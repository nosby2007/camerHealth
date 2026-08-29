// ─── CameroHealth — Billing Routes ──────────────────────────────────────────
const { Router } = require('express')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { authenticate, facilityScoped } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { requireFacilityId, requirePatientForFacility } = require('../lib/tenant')

const router = Router()

// ─── Helpers ────────────────────────────────────────────────────────────────
function getFacilityId(req) {
  return requireFacilityId(req)
}

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
  const inv = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { charges: true, payments: true }
  })
  if (!inv) return
  const totalOpenCharges = inv.charges
    .filter(c => c.status === 'Open')
    .reduce((s, c) => s + c.total, 0)
  const totalPaid = inv.payments.reduce((s, p) => s + p.amount, 0)
  let status = 'Unpaid'
  if (totalPaid > 0 && totalOpenCharges === 0) status = 'Paid'
  else if (totalPaid > 0) status = 'Partial'
  await prisma.invoice.update({ where: { id: invoiceId }, data: { status } })
}

function buildStatement(invoice, patients) {
  const p = patients.find(pt => pt.id === invoice.patientId)
  const charges = invoice.charges || []
  const payments = invoice.payments || []
  const openCharges = charges.filter(c => c.status === 'Open')
  const paidCharges = charges.filter(c => c.status === 'Paid')
  const totalCharges = charges.reduce((s, c) => s + c.total, 0)
  const openChargesTotal = openCharges.reduce((s, c) => s + c.total, 0)
  const paidChargesTotal = paidCharges.reduce((s, c) => s + c.total, 0)
  const amountPaid = payments.reduce((s, p) => s + p.amount, 0)
  // ── CRITICAL: The amount still owed ("balance") is the sum of OPEN charges.
  //    A charge is only marked Paid once it is FULLY covered by a payment, so the
  //    outstanding amount is exactly the total of charges still in status 'Open'.
  //    Using totalCharges - amountPaid made the balance collapse to 0 whenever a
  //    previous payment covered an older invoice, even though a NEW prescription
  //    (or order) had just added an unpaid charge — causing the queue to wrongly
  //    show "CLEARED" while pending charges existed.
  const balance = openChargesTotal
  let status = 'NO_CHARGES'
  if (charges.length > 0 || payments.length > 0) {
    if (openChargesTotal === 0 && amountPaid > 0) status = 'PAID'
    else if (openChargesTotal > 0 && amountPaid > 0) status = 'PARTIAL'
    else if (openChargesTotal > 0) status = 'UNPAID'
  }
  return {
    invoiceId: invoice.id,
    patientId: invoice.patientId,
    mrn: p ? (p.mrn || p.id) : invoice.patientId,
    patientName: p ? `${p.firstName} ${p.lastName}`.toUpperCase() : invoice.patientId,
    charges,
    payments,
    totalCharges,
    openChargesTotal,
    paidChargesTotal,
    amountPaid,
    balance,
    status,
    updatedAt: invoice.updatedAt
  }
}

// ─── GET /api/billing/statements — All patient statements for queue ──────────
router.get('/statements', authenticate, facilityScoped, async (req, res, next) => {
  try {
    const facilityId = getFacilityId(req)
    const [invoices, allPatients] = await Promise.all([
      prisma.invoice.findMany({
        where: { facilityId },
        include: { charges: true, payments: true },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.patient.findMany({
        where: { facilityId },
        select: { id: true, firstName: true, lastName: true, mrn: true }
      })
    ])

    // One statement per patient: use the most recent invoice for charges/status,
    // but collect payments from ALL invoices so history is never lost
    const invoicesByPatient = {}
    for (const inv of invoices) {
      if (!invoicesByPatient[inv.patientId]) {
        invoicesByPatient[inv.patientId] = [inv]
      } else {
        invoicesByPatient[inv.patientId].push(inv)
      }
    }

    const invoicedIds = new Set(Object.keys(invoicesByPatient))
    const withInvoice = Object.values(invoicesByPatient).map(patientInvoices => {
      const latestInvoice = patientInvoices.reduce((latest, current) =>
        new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest,
        patientInvoices[0]
      )
      return buildStatement({
        ...latestInvoice,
        charges: patientInvoices.flatMap(i => i.charges || []),
        payments: patientInvoices.flatMap(i => i.payments || [])
      }, allPatients)
    })
    const withoutInvoice = allPatients
      .filter(p => !invoicedIds.has(p.id))
      .map(p => ({
        invoiceId: null, patientId: p.id, mrn: p.mrn || p.id,
        patientName: `${p.firstName} ${p.lastName}`.toUpperCase(),
        charges: [], payments: [], totalCharges: 0, amountPaid: 0, balance: 0,
        status: 'NO_CHARGES', updatedAt: null
      }))

    res.json({ statements: [...withInvoice, ...withoutInvoice] })
  } catch (err) { next(err) }
})

// ─── GET /api/billing/statement/:patientId ───────────────────────────────────
router.get('/statement/:patientId', authenticate, facilityScoped, async (req, res, next) => {
  try {
    const facilityId = getFacilityId(req)
    const patient = await prisma.patient.findFirst({
      where: {
        facilityId,
        OR: [
          { id: req.params.patientId },
          { mrn: req.params.patientId }
        ]
      }
    })

    const patientId = patient ? patient.id : req.params.patientId
    const invoices = await prisma.invoice.findMany({
      where: { patientId, facilityId },
      include: { charges: true, payments: true },
      orderBy: { updatedAt: 'desc' }
    })

    if (!invoices.length) {
      return res.json({
        invoiceId: null, patientId: req.params.patientId,
        mrn: patient ? (patient.mrn || patient.id) : req.params.patientId,
        patientName: patient ? `${patient.firstName} ${patient.lastName}`.toUpperCase() : req.params.patientId,
        charges: [], payments: [], totalCharges: 0, amountPaid: 0, balance: 0,
        status: 'NO_CHARGES', updatedAt: null
      })
    }

    // Most recent invoice drives charges/status; all invoices contribute payments
    const primary = invoices.reduce((latest, current) =>
      new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest,
      invoices[0]
    )
    const allCharges = invoices.flatMap(i => i.charges || [])
    const allPayments = invoices.flatMap(i => i.payments || [])
    res.json(buildStatement({ ...primary, charges: allCharges, payments: allPayments }, patient ? [patient] : []))
  } catch (err) { next(err) }
})

// ─── POST /api/billing/charges — Add a charge ───────────────────────────────
router.post('/charges', authenticate, facilityScoped, async (req, res, next) => {
  try {
    const { patientId, description, category, unitPrice, quantity = 1,
            departmentSource, sourceType, sourceId } = req.body
    const facilityId = getFacilityId(req)
    await requirePatientForFacility(patientId, facilityId, { select: { id: true } })
    const invoice = await getOrCreateInvoice(patientId, facilityId, req.user.id)
    const charge = await prisma.charge.create({
      data: {
        invoiceId: invoice.id, patientId, facilityId,
        description, category, unitPrice, quantity,
        total: unitPrice * quantity,
        departmentSource: departmentSource || null,
        sourceType: sourceType || null,
        sourceId: sourceId || null,
        status: 'Open'
      }
    })
    await recalcInvoiceStatus(invoice.id)
    res.status(201).json({ charge })
  } catch (err) { next(err) }
})

// ─── PATCH /api/billing/charges/:id — Waive / reopen a charge ───────────────
router.patch('/charges/:id', authenticate, facilityScoped, async (req, res, next) => {
  try {
    const { status } = req.body
    const facilityId = getFacilityId(req)
    const charge = await prisma.charge.findFirst({
      where: { id: req.params.id, facilityId }
    })
    if (!charge) return res.status(404).json({ error: 'Charge not found' })
    const updated = await prisma.charge.update({ where: { id: req.params.id }, data: { status } })
    await recalcInvoiceStatus(charge.invoiceId)

    // Same sync as POST /payments — a reopened charge (payment reversed,
    // waiver undone) must also clear the medication back to Unpaid, or
    // Pharmacy would keep showing it as payable when it no longer is.
    if (charge.sourceType === 'medication' && charge.sourceId) {
      await prisma.medication.updateMany({
        where: { id: charge.sourceId, facilityId },
        data: { paymentStatus: status === 'Open' ? 'Unpaid' : 'Paid' }
      })
    }

    res.json({ charge: updated })
  } catch (err) { next(err) }
})

// ─── POST /api/billing/payments — Record a payment ──────────────────────────
router.post('/payments', authenticate, facilityScoped, async (req, res, next) => {
  try {
    const { patientId, amount, method, reference, note, paidChargeIds = [] } = req.body
    const facilityId = getFacilityId(req)
    await requirePatientForFacility(patientId, facilityId, { select: { id: true } })
    const invoice = await getOrCreateInvoice(patientId, facilityId, req.user.id)
    const cashier = req.user.fullName || req.user.staffCode || 'Cashier'
    const count = await prisma.payment.count({ where: { facilityId } })
    const facility = await prisma.facility.findUnique({ where: { id: facilityId } })
    const receiptNumber = `RCT-${facility.code}-${String(count + 1).padStart(5, '0')}`
    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id, patientId, facilityId,
        receiptNumber, amount, method,
        reference: reference || null,
        note: note || null,
        cashier
      }
    })

    const openCharges = await prisma.charge.findMany({
      where: { invoiceId: invoice.id, facilityId, status: 'Open' },
      select: { id: true, total: true, sourceType: true, sourceId: true }
    })

    const requestedChargeIds = Array.isArray(paidChargeIds)
      ? paidChargeIds.filter(id => openCharges.some(c => c.id === id))
      : []

    const candidateCharges = requestedChargeIds.length > 0
      ? openCharges.filter(c => requestedChargeIds.includes(c.id))
      : openCharges

    const candidateTotal = candidateCharges.reduce((sum, c) => sum + c.total, 0)

    // ── Hospital-correct payment allocation ──────────────────────────────────
    // Only mark charges as Paid when the tender FULLY covers them. A partial
    // payment (amount < candidateTotal) stays as a credit on the account: the
    // remaining open charges keep their Open status and the patient still owes
    // the difference — this is exactly what global hospital billing does.
    let allocated = 0
    const toPay = []
    const candidateOrdered = [...candidateCharges].sort((a, b) => a.total - b.total)
    for (const c of candidateOrdered) {
      if (allocated + c.total <= amount) {
        toPay.push(c)
        allocated += c.total
      }
    }
    if (toPay.length > 0) {
      await prisma.charge.updateMany({
        where: {
          id: { in: toPay.map(c => c.id) },
          invoiceId: invoice.id,
          facilityId,
          status: 'Open'
        },
        data: { status: 'Paid' }
      })

      // Keep Medication.paymentStatus in sync with the charge it's billed
      // through — without this, Pharmacy's dispense queue only shows the
      // correct payment state because it separately cross-references the
      // live Charge record; any other view reading paymentStatus directly
      // would show a payment as still pending forever.
      const paidMedicationIds = toPay
        .filter(c => c.sourceType === 'medication' && c.sourceId)
        .map(c => c.sourceId)
      if (paidMedicationIds.length > 0) {
        await prisma.medication.updateMany({
          where: { id: { in: paidMedicationIds }, facilityId },
          data: { paymentStatus: 'Paid' }
        })
      }
    }

    await recalcInvoiceStatus(invoice.id)
    await prisma.auditLog.create({
      data: {
        facilityId, action: 'PAYMENT_RECORDED',
        actorId: req.user.id, targetId: payment.id,
        detail: `Payment ${receiptNumber}: XAF ${amount} via ${method}`
      }
    })
    res.status(201).json({ payment: { ...payment, patientId } })
  } catch (err) { next(err) }
})

// ─── POST /api/billing/clearances — Issue a clearance ───────────────────────
router.post('/clearances', authenticate, facilityScoped, async (req, res, next) => {
  try {
    const { patientId, serviceType, department, amount, method } = req.body
    const facilityId = getFacilityId(req)
    await requirePatientForFacility(patientId, facilityId, { select: { id: true } })
    const issuedBy = req.user.fullName || req.user.staffCode || 'Cash Office'
    const ts = Date.now().toString(36).toUpperCase()
    const clearanceCode = `CLR-${ts}-${Math.random().toString(36).slice(2,5).toUpperCase()}`
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Record payment for the clearance fee
    const invoice = await getOrCreateInvoice(patientId, facilityId, req.user.id)
    const count = await prisma.payment.count({ where: { facilityId } })
    const facility = await prisma.facility.findUnique({ where: { id: facilityId } })
    const receiptNumber = `RCT-${facility.code}-${String(count + 1).padStart(5, '0')}`
    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id, patientId, facilityId,
        receiptNumber, amount, method,
        reference: clearanceCode,
        note: `Clearance fee — ${serviceType}${department ? ' / ' + department : ''}`,
        cashier: issuedBy
      }
    })

    // Add consultation charge — status Open, invoice.status drives paid/pending logic
    const existing = await prisma.charge.findFirst({
      where: { invoiceId: invoice.id, facilityId, sourceType: 'clearance', sourceId: serviceType }
    })
    if (!existing) {
      await prisma.charge.create({
        data: {
          invoiceId: invoice.id, patientId, facilityId,
          description: `${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} fee${department ? ' — ' + department : ''}`,
          category: 'consultation', unitPrice: amount, quantity: 1, total: amount,
          sourceType: 'clearance', sourceId: serviceType, status: 'Open'
        }
      })
    }
    await recalcInvoiceStatus(invoice.id)

    const clearance = await prisma.clearance.create({
      data: { patientId, facilityId, serviceType, department: department || null, clearanceCode, amount, method, issuedBy, expiresAt }
    })
    res.status(201).json({ clearance, payment: { ...payment, patientId } })
  } catch (err) { next(err) }
})

// ─── GET /api/billing/clearances/:patientId — Get active clearances ──────────
router.get('/clearances/:patientId', authenticate, facilityScoped, async (req, res, next) => {
  try {
    const facilityId = getFacilityId(req)
    const clearances = await prisma.clearance.findMany({
      where: {
        patientId: req.params.patientId,
        facilityId,
        revoked: false,
        expiresAt: { gt: new Date() }
      }
    })
    res.json({ clearances })
  } catch (err) { next(err) }
})

// ─── DELETE /api/billing/clearances/:id — Revoke a clearance ────────────────
router.delete('/clearances/:id', authenticate, facilityScoped, async (req, res, next) => {
  try {
    const facilityId = getFacilityId(req)
    const updated = await prisma.clearance.updateMany({
      where: { id: req.params.id, facilityId },
      data: { revoked: true, revokedAt: new Date() }
    })
    if (updated.count === 0) return res.status(404).json({ error: 'Clearance not found' })
    res.json({ clearance: updated })
  } catch (err) { next(err) }
})

// ─── GET /api/billing — List invoices (legacy / admin) ──────────────────────
router.get('/', authenticate, facilityScoped, async (req, res, next) => {
  try {
    const facilityId = getFacilityId(req)
    const where = { facilityId }
    if (req.query.patientId) where.patientId = req.query.patientId
    const invoices = await prisma.invoice.findMany({
      where, include: { charges: true, payments: true },
      orderBy: { createdAt: 'desc' }, take: 200
    })
    res.json({ invoices })
  } catch (err) { next(err) }
})

module.exports = router
