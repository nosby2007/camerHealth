// ─── CameroHealth — Mobile Money Routes ─────────────────────────────────────
const { Router } = require('express')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { authenticate, facilityScoped } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { requireFacilityId, requirePatientForFacility } = require('../lib/tenant')
const mtnMomo = require('../lib/mobileMoney/mtnMomo')
const orangeMoney = require('../lib/mobileMoney/orangeMoney')

const router = Router()

const PROVIDERS = { MTN_MOMO: mtnMomo, ORANGE_MONEY: orangeMoney }

const requestSchema = z.object({
  patientId: z.string().uuid(),
  invoiceId: z.string().nullable().optional(),
  provider: z.enum(['MTN_MOMO', 'ORANGE_MONEY']),
  phoneNumber: z.string().min(6),
  amount: z.number().positive(),
  currency: z.string().optional(),
  paidChargeIds: z.array(z.string()).optional()
})

async function getOrCreateInvoice(patientId, facilityId, issuedById) {
  let invoice = await prisma.invoice.findFirst({
    where: { patientId, facilityId, status: { in: ['Unpaid', 'Partial'] } },
    include: { charges: true, payments: true },
    orderBy: { updatedAt: 'desc' }
  })
  if (!invoice) {
    const count = await prisma.invoice.count({ where: { facilityId } })
    const facility = await prisma.facility.findUnique({ where: { id: facilityId } })
    const invoiceNumber = `INV-${facility.code}-${String(count + 1).padStart(5, '0')}`
    invoice = await prisma.invoice.create({
      data: { patientId, facilityId, invoiceNumber, issuedById, status: 'Unpaid' },
      include: { charges: true, payments: true }
    })
  }
  return invoice
}

async function recalcInvoiceStatus(invoiceId) {
  const inv = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { charges: true, payments: true } })
  if (!inv) return
  const totalOpenCharges = inv.charges.filter(c => c.status === 'Open').reduce((sum, c) => sum + c.total, 0)
  const totalPaid = inv.payments.reduce((sum, p) => sum + p.amount, 0)
  const totalCharges = inv.charges.reduce((sum, c) => sum + c.total, 0)
  const status = totalOpenCharges === 0 && totalCharges > 0 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid')
  await prisma.invoice.update({ where: { id: invoiceId }, data: { status } })
}

// Records the confirmed mobile money payment as a real Payment and allocates
// it against open charges, using the same full-coverage-only allocation rule
// as the manual cash flow in billing.js POST /payments.
async function finalizeSuccessfulPayment(mmRequest) {
  if (mmRequest.completedPaymentId) return
  const facilityId = mmRequest.facilityId
  const invoice = await getOrCreateInvoice(mmRequest.patientId, facilityId, mmRequest.requestedById)
  const count = await prisma.payment.count({ where: { facilityId } })
  const facility = await prisma.facility.findUnique({ where: { id: facilityId } })
  const receiptNumber = `RCT-${facility.code}-${String(count + 1).padStart(5, '0')}`

  const payment = await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      patientId: mmRequest.patientId,
      facilityId,
      receiptNumber,
      amount: mmRequest.amount,
      method: mmRequest.provider === 'MTN_MOMO' ? 'MTN Mobile Money' : 'Orange Money',
      reference: mmRequest.externalReferenceId,
      note: 'Mobile money payment',
      cashier: 'Mobile Money'
    }
  })

  const openCharges = await prisma.charge.findMany({
    where: { invoiceId: invoice.id, facilityId, status: 'Open' },
    select: { id: true, total: true }
  })
  const paidChargeIds = Array.isArray(mmRequest.paidChargeIds) ? mmRequest.paidChargeIds : []
  const candidateCharges = paidChargeIds.length > 0
    ? openCharges.filter(c => paidChargeIds.includes(c.id))
    : openCharges

  let allocated = 0
  const toPay = []
  for (const charge of [...candidateCharges].sort((a, b) => a.total - b.total)) {
    if (allocated + charge.total <= mmRequest.amount) {
      toPay.push(charge.id)
      allocated += charge.total
    }
  }
  if (toPay.length > 0) {
    await prisma.charge.updateMany({ where: { id: { in: toPay }, invoiceId: invoice.id, facilityId, status: 'Open' }, data: { status: 'Paid' } })
  }
  await recalcInvoiceStatus(invoice.id)

  await prisma.mobileMoneyRequest.update({
    where: { id: mmRequest.id },
    data: { status: 'SUCCESSFUL', completedPaymentId: payment.id }
  })

  return payment
}

// ─── POST /mobile-money/request — initiate a Request to Pay ─────────────────
router.post('/request', authenticate, facilityScoped, validate(requestSchema), async (req, res, next) => {
  try {
    const facilityId = requireFacilityId(req)
    const { patientId, invoiceId, provider, phoneNumber, amount, currency, paidChargeIds } = req.body
    await requirePatientForFacility(patientId, facilityId, { select: { id: true } })

    const client = PROVIDERS[provider]
    if (!client.isConfigured()) {
      return res.status(400).json({ error: `${provider} is not configured on this deployment.` })
    }

    const mmRequest = await prisma.mobileMoneyRequest.create({
      data: {
        patientId,
        facilityId,
        invoiceId: invoiceId || null,
        provider,
        phoneNumber,
        amount,
        currency: currency || 'XAF',
        status: 'PENDING',
        paidChargeIds: paidChargeIds || [],
        requestedById: req.user.id
      }
    })

    try {
      const { referenceId } = await client.requestToPay({
        phoneNumber,
        amount,
        currency: currency || 'XAF',
        externalId: mmRequest.id,
        payeeNote: `CameroHealth invoice payment`
      })
      const updated = await prisma.mobileMoneyRequest.update({
        where: { id: mmRequest.id },
        data: { externalReferenceId: referenceId }
      })
      res.status(201).json({ request: updated })
    } catch (providerError) {
      await prisma.mobileMoneyRequest.update({
        where: { id: mmRequest.id },
        data: { status: 'FAILED', statusDetail: providerError.message }
      })
      return res.status(502).json({ error: `Mobile money provider error: ${providerError.message}` })
    }
  } catch (error) {
    next(error)
  }
})

// ─── GET /mobile-money/:id/status — manual poll ─────────────────────────────
router.get('/:id/status', authenticate, facilityScoped, async (req, res, next) => {
  try {
    const facilityId = requireFacilityId(req)
    const mmRequest = await prisma.mobileMoneyRequest.findFirst({ where: { id: req.params.id, facilityId } })
    if (!mmRequest) return res.status(404).json({ error: 'Mobile money request not found' })

    if (mmRequest.status !== 'PENDING' || !mmRequest.externalReferenceId) {
      return res.json({ request: mmRequest })
    }

    const client = PROVIDERS[mmRequest.provider]
    const { status } = await client.getTransactionStatus(mmRequest.externalReferenceId)

    if (status === 'SUCCESSFUL') {
      await finalizeSuccessfulPayment(mmRequest)
    } else if (status === 'FAILED') {
      await prisma.mobileMoneyRequest.update({ where: { id: mmRequest.id }, data: { status: 'FAILED' } })
    }

    const refreshed = await prisma.mobileMoneyRequest.findUnique({ where: { id: mmRequest.id } })
    res.json({ request: refreshed })
  } catch (error) {
    next(error)
  }
})

// ─── POST /mobile-money/callback/mtn — MTN webhook ──────────────────────────
router.post('/callback/mtn', async (req, res, next) => {
  try {
    const { referenceId, status } = req.body
    if (!referenceId) return res.status(400).json({ error: 'referenceId is required' })

    const mmRequest = await prisma.mobileMoneyRequest.findFirst({ where: { externalReferenceId: referenceId } })
    if (!mmRequest) return res.status(404).json({ error: 'Unknown reference' })

    if (status === 'SUCCESSFUL') {
      await finalizeSuccessfulPayment(mmRequest)
    } else if (status === 'FAILED') {
      await prisma.mobileMoneyRequest.update({ where: { id: mmRequest.id }, data: { status: 'FAILED', statusDetail: 'Provider reported failure' } })
    }

    res.json({ received: true })
  } catch (error) {
    next(error)
  }
})

module.exports = router
