// ─── CameroHealth — Commercial Pipeline Routes (Super Admin + Sales team) ───
// The vendor's own sales CRM: track a health facility from prospect to
// signed customer. Not a clinical or MINSANTE concept — kept fully separate
// from organizations.js (public-health hierarchy) and facilityScoped routes.
const { Router } = require('express')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { authenticate, authorize } = require('../middleware/auth')
const { validate } = require('../middleware/validate')

const router = Router()

const STAGES = ['NEW', 'CONTACTED', 'DEMO_SCHEDULED', 'DEMO_DONE', 'PROPOSAL_SENT', 'NEGOTIATION', 'SIGNED', 'LOST']

// Lead.createdById is a required FK to StaffProfile — fine for leads entered
// by Super Admin/Sales, but a public visitor submitting the contact form has
// no staff account. Attribute those leads to one fixed, login-disabled
// system account instead of loosening the schema. Reuses the same internal
// placeholder facility platform.js already created for vendor team members.
const VENDOR_HQ_CODE = 'CAMEROHEALTH-HQ'
const WEBSITE_SYSTEM_STAFF_CODE = `${VENDOR_HQ_CODE}-WEB001`

async function ensureWebsiteSystemStaff() {
  const existingStaff = await prisma.staffProfile.findFirst({ where: { staffCode: WEBSITE_SYSTEM_STAFF_CODE } })
  if (existingStaff) return existingStaff

  let hq = await prisma.facility.findUnique({ where: { code: VENDOR_HQ_CODE } })
  if (!hq) {
    hq = await prisma.facility.create({
      data: {
        code: VENDOR_HQ_CODE,
        name: 'CameroHealth (Internal)',
        region: 'N/A',
        city: 'N/A',
        email: 'ops@camerohealth.cm',
        status: 'active'
      }
    })
  }

  // No passwordHash — this account can never authenticate, it exists purely
  // as an attribution record for leads with no human submitter.
  return prisma.staffProfile.create({
    data: {
      staffCode: WEBSITE_SYSTEM_STAFF_CODE,
      fullName: 'Website (public form)',
      email: 'website-system@camerohealth.cm',
      role: 'SUPPORT',
      facilityId: hq.id,
      status: 'inactive'
    }
  })
}

// ─── Schemas ────────────────────────────────────────────────────────────────
// Every optional field is also .nullable(): Vuetify's clearable v-select
// (facilityType, source in the New Lead form) emits `null`, not `undefined`,
// when left empty — plain .optional() rejects that with a 400.
const leadSchema = z.object({
  organizationName: z.string().min(1),
  contactName: z.string().min(1),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  facilityType: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  estimatedValue: z.number().nonnegative().nullable().optional(),
  currency: z.string().nullable().optional(),
  assignedToStaffId: z.string().uuid().nullable().optional()
})

const leadUpdateSchema = z.object({
  organizationName: z.string().min(1).optional(),
  contactName: z.string().min(1).optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  facilityType: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  estimatedValue: z.number().nonnegative().nullable().optional(),
  currency: z.string().nullable().optional(),
  quoteAmount: z.number().nonnegative().nullable().optional(),
  quoteSentAt: z.string().nullable().optional(),
  contractValue: z.number().nonnegative().nullable().optional(),
  contractSignedAt: z.string().nullable().optional(),
  renewalDate: z.string().nullable().optional(),
  assignedToStaffId: z.string().uuid().nullable().optional()
})

const stageChangeSchema = z.object({
  stage: z.enum(STAGES),
  note: z.string().optional(),
  lostReason: z.string().optional()
})

const activitySchema = z.object({
  type: z.enum(['note', 'call', 'email', 'meeting']),
  body: z.string().min(1)
})

const convertSchema = z.object({
  facilityCode: z.string().min(2).max(20),
  facilityEmail: z.string().email()
})

// The public marketing site's "request a demo" form — contact.vue. Its
// fields don't line up 1:1 with the Lead columns (role/size/message have no
// dedicated column), so the route below folds them into the lead record plus
// a first activity note rather than dropping them.
const publicDemoRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  facility: z.string().min(1),
  city: z.string().min(1),
  role: z.string().min(1),
  size: z.string().min(1),
  message: z.string().min(1),
  consent: z.literal(true)
})

// ─── POST /public — the marketing site's "request a demo" form ─────────────
// No authentication — this is what a visitor on camerohealth.cm submits.
// Protected by the same global rate limiter as the rest of /api (see
// backend/src/index.js), not a separate one, consistent with the other
// public endpoint in this app (POST /api/auth/register).
router.post('/public', validate(publicDemoRequestSchema), async (req, res, next) => {
  try {
    const { name, email, facility, city, role, size, message } = req.body
    const systemStaff = await ensureWebsiteSystemStaff()

    const lead = await prisma.lead.create({
      data: {
        organizationName: facility,
        contactName: name,
        contactEmail: email,
        city,
        source: 'website_contact_form',
        createdById: systemStaff.id
      }
    })
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'note',
        toStage: 'NEW',
        body: `Demande de démonstration soumise via le site public.\nFonction: ${role}\nCapacité de l'établissement: ${size}\n\nPriorités:\n${message}`,
        createdById: systemStaff.id
      }
    })

    res.status(201).json({ received: true })
  } catch (error) {
    next(error)
  }
})

// ─── GET / — list leads, optionally filtered by stage ────────────────────────
router.get('/', authenticate, authorize('SUPER_ADMIN', 'SALES'), async (req, res, next) => {
  try {
    const { stage } = req.query
    const leads = await prisma.lead.findMany({
      where: stage ? { stage } : undefined,
      orderBy: { updatedAt: 'desc' }
    })
    res.json({ leads, stages: STAGES })
  } catch (error) {
    next(error)
  }
})

// ─── POST / — create a lead ───────────────────────────────────────────────────
router.post('/', authenticate, authorize('SUPER_ADMIN', 'SALES'), validate(leadSchema), async (req, res, next) => {
  try {
    const lead = await prisma.lead.create({
      data: { ...req.body, createdById: req.user.id }
    })
    await prisma.leadActivity.create({
      data: { leadId: lead.id, type: 'stage_change', toStage: 'NEW', createdById: req.user.id }
    })
    res.status(201).json({ lead })
  } catch (error) {
    next(error)
  }
})

// ─── GET /:id — lead detail + activity timeline ───────────────────────────────
router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'SALES'), async (req, res, next) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: { activities: { orderBy: { createdAt: 'desc' } } }
    })
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    res.json({ lead })
  } catch (error) {
    next(error)
  }
})

// ─── PATCH /:id — update lead fields (contact info, quote, contract) ─────────
router.patch('/:id', authenticate, authorize('SUPER_ADMIN', 'SALES'), validate(leadUpdateSchema), async (req, res, next) => {
  try {
    const data = { ...req.body }
    for (const dateField of ['quoteSentAt', 'contractSignedAt', 'renewalDate']) {
      if (data[dateField]) data[dateField] = new Date(data[dateField])
    }
    const lead = await prisma.lead.update({ where: { id: req.params.id }, data })
    res.json({ lead })
  } catch (error) {
    next(error)
  }
})

// ─── PATCH /:id/stage — move a lead through the pipeline ─────────────────────
router.patch('/:id/stage', authenticate, authorize('SUPER_ADMIN', 'SALES'), validate(stageChangeSchema), async (req, res, next) => {
  try {
    const existing = await prisma.lead.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'Lead not found' })

    const { stage, note, lostReason } = req.body
    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: {
        stage,
        ...(stage === 'LOST' && lostReason && { lostReason }),
        ...(stage === 'PROPOSAL_SENT' && !existing.quoteSentAt && { quoteSentAt: new Date() }),
        ...(stage === 'SIGNED' && !existing.contractSignedAt && { contractSignedAt: new Date() })
      }
    })
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'stage_change',
        fromStage: existing.stage,
        toStage: stage,
        body: note || lostReason || null,
        createdById: req.user.id
      }
    })
    res.json({ lead })
  } catch (error) {
    next(error)
  }
})

// ─── POST /:id/activities — log a note/call/email/meeting ───────────────────
router.post('/:id/activities', authenticate, authorize('SUPER_ADMIN', 'SALES'), validate(activitySchema), async (req, res, next) => {
  try {
    const activity = await prisma.leadActivity.create({
      data: { leadId: req.params.id, type: req.body.type, body: req.body.body, createdById: req.user.id }
    })
    res.status(201).json({ activity })
  } catch (error) {
    next(error)
  }
})

// ─── POST /:id/convert — signed lead becomes a real Facility shell record ───
router.post('/:id/convert', authenticate, authorize('SUPER_ADMIN'), validate(convertSchema), async (req, res, next) => {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: req.params.id } })
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    if (lead.convertedFacilityId) return res.status(409).json({ error: 'Lead already converted' })

    const facility = await prisma.facility.create({
      data: {
        code: req.body.facilityCode.toUpperCase(),
        name: lead.organizationName,
        region: lead.region || 'Unspecified',
        city: lead.city || 'Unspecified',
        email: req.body.facilityEmail.toLowerCase(),
        status: 'active'
      }
    })

    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        convertedFacilityId: facility.id,
        stage: 'SIGNED',
        contractSignedAt: lead.contractSignedAt || new Date()
      }
    })

    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'note',
        body: `Converted to facility ${facility.name} (${facility.code}). Next: invite the facility ADMIN via /register or staff creation.`,
        createdById: req.user.id
      }
    })

    res.status(201).json({ lead: updated, facility })
  } catch (error) {
    next(error)
  }
})

module.exports = router
