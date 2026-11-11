// ─── CameroHealth — Discharge Planning Routes ───────────────────────────────
const { Router } = require('express')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { authenticate, authorize } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { requirePatientForFacility } = require('../lib/tenant')
const { CLINICAL_WRITE_ROLES } = require('../lib/clinicalRoles')

const router = Router()

// frontend/store/discharge.js treats 5 near-identical sub-types uniformly —
// they all land in DischargeFollowUp with `kind` as the discriminator and
// the whole record kept as `payload` (see schema.prisma comment on the model).
const followUpSchema = z.object({
  patientId: z.string().uuid(),
  admissionId: z.string().optional(),
  kind: z.enum(['note', 'follow_up_order', 'medication', 'return_precaution', 'appointment']),
  payload: z.record(z.any())
})

const followUpUpdateSchema = z.object({
  status: z.string().optional(),
  payload: z.record(z.any()).optional()
})

const milestoneSchema = z.object({
  patientId: z.string().uuid(),
  admissionId: z.string().optional(),
  title: z.string().min(1),
  owner: z.string().nullable().optional(),
  dueLabel: z.string().nullable().optional(),
  sortOrder: z.number().optional()
})

const milestoneUpdateSchema = z.object({
  status: z.string().optional(),
  title: z.string().optional(),
  owner: z.string().nullable().optional(),
  dueLabel: z.string().nullable().optional()
})

async function getOrCreatePlan(patientId, admissionId, facilityId) {
  let plan = await prisma.dischargePlan.findFirst({ where: { patientId, facilityId, status: 'active' } })
  if (!plan) {
    plan = await prisma.dischargePlan.create({ data: { patientId, admissionId: admissionId || null, facilityId } })
  }
  return plan
}

// GET /api/discharge/overview?patientId=... — everything the discharge
// dialog and the Patient 360 discharge summary need in one call
router.get('/discharge/overview', authenticate, async (req, res, next) => {
  try {
    const { patientId } = req.query
    if (!patientId) return res.status(400).json({ error: 'patientId query parameter is required' })
    const plan = await prisma.dischargePlan.findFirst({
      where: { patientId, facilityId: req.user.facilityId, status: 'active' },
      include: {
        milestones: { orderBy: { sortOrder: 'asc' } },
        followUps: { orderBy: { createdAt: 'desc' } }
      }
    })
    res.json({ plan: plan ? { id: plan.id, status: plan.status } : null, milestones: plan ? plan.milestones : [], followUps: plan ? plan.followUps : [] })
  } catch (error) {
    next(error)
  }
})

// POST /api/discharge/milestones — file one milestone (the frontend seeds
// the standard 4 by calling this once per milestone)
router.post('/discharge/milestones', authenticate, authorize(...CLINICAL_WRITE_ROLES), validate(milestoneSchema), async (req, res, next) => {
  try {
    await requirePatientForFacility(req.body.patientId, req.user.facilityId, { select: { id: true } })
    const plan = await getOrCreatePlan(req.body.patientId, req.body.admissionId, req.user.facilityId)
    const milestone = await prisma.dischargeMilestone.create({
      data: {
        dischargePlanId: plan.id,
        title: req.body.title,
        owner: req.body.owner || null,
        dueLabel: req.body.dueLabel || null,
        sortOrder: req.body.sortOrder || 0
      }
    })
    res.status(201).json({ milestone, planId: plan.id })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/discharge/milestones/:id
router.patch('/discharge/milestones/:id', authenticate, authorize(...CLINICAL_WRITE_ROLES), validate(milestoneUpdateSchema), async (req, res, next) => {
  try {
    const existing = await prisma.dischargeMilestone.findFirst({
      where: { id: req.params.id, dischargePlan: { facilityId: req.user.facilityId } }
    })
    if (!existing) return res.status(404).json({ error: 'Discharge milestone not found' })
    const milestone = await prisma.dischargeMilestone.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.status && { status: req.body.status }),
        ...(req.body.title !== undefined && { title: req.body.title }),
        ...(req.body.owner !== undefined && { owner: req.body.owner }),
        ...(req.body.dueLabel !== undefined && { dueLabel: req.body.dueLabel })
      }
    })
    res.json({ milestone })
  } catch (error) {
    next(error)
  }
})

// POST /api/discharge/follow-ups — note / follow_up_order / medication /
// return_precaution / appointment, discriminated by `kind`
router.post('/discharge/follow-ups', authenticate, authorize(...CLINICAL_WRITE_ROLES), validate(followUpSchema), async (req, res, next) => {
  try {
    await requirePatientForFacility(req.body.patientId, req.user.facilityId, { select: { id: true } })
    const plan = await getOrCreatePlan(req.body.patientId, req.body.admissionId, req.user.facilityId)
    const followUp = await prisma.dischargeFollowUp.create({
      data: {
        dischargePlanId: plan.id,
        kind: req.body.kind,
        payload: req.body.payload,
        createdById: req.user.id
      }
    })
    res.status(201).json({ followUp, planId: plan.id })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/discharge/follow-ups/:id
router.patch('/discharge/follow-ups/:id', authenticate, authorize(...CLINICAL_WRITE_ROLES), validate(followUpUpdateSchema), async (req, res, next) => {
  try {
    const existing = await prisma.dischargeFollowUp.findFirst({
      where: { id: req.params.id, dischargePlan: { facilityId: req.user.facilityId } }
    })
    if (!existing) return res.status(404).json({ error: 'Discharge follow-up not found' })
    const followUp = await prisma.dischargeFollowUp.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.status && { status: req.body.status }),
        ...(req.body.payload && { payload: { ...existing.payload, ...req.body.payload } })
      }
    })
    res.json({ followUp })
  } catch (error) {
    next(error)
  }
})

module.exports = router
