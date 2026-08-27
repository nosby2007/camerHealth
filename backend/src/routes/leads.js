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
