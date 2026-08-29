// ─── CameroHealth — Care Plan Routes ────────────────────────────────────────
const { Router } = require('express')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { authenticate, authorize } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { requirePatientForFacility } = require('../lib/tenant')
const { CLINICAL_WRITE_ROLES } = require('../lib/clinicalRoles')

const router = Router()

const carePlanSchema = z.object({
  patientId: z.string().uuid(),
  encounterId: z.string().nullable().optional(),
  admissionId: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  status: z.string().optional(),
  source: z.string().nullable().optional()
})

const carePlanUpdateSchema = z.object({
  name: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  status: z.string().optional()
})

const problemSchema = z.object({
  carePlanId: z.string().uuid(),
  patientId: z.string().uuid(),
  label: z.string().min(1),
  status: z.string().optional(),
  source: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  diagnosis: z.string().nullable().optional()
})

const problemUpdateSchema = z.object({
  label: z.string().optional(),
  status: z.string().optional(),
  sortOrder: z.number().optional(),
  diagnosis: z.string().nullable().optional()
})

const goalSchema = z.object({
  problemId: z.string().uuid(),
  patientId: z.string().uuid(),
  label: z.string().min(1),
  description: z.string().nullable().optional(),
  status: z.string().optional(),
  source: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  expectedEndDate: z.string().nullable().optional(),
  achieved: z.boolean().optional(),
  timeline: z.string().nullable().optional()
})

const goalUpdateSchema = z.object({
  label: z.string().optional(),
  description: z.string().nullable().optional(),
  status: z.string().optional(),
  statusReason: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  expectedEndDate: z.string().nullable().optional(),
  achieved: z.boolean().optional(),
  timeline: z.string().nullable().optional()
})

const outcomeSchema = z.object({
  goalId: z.string().uuid(),
  patientId: z.string().uuid(),
  label: z.string().nullable().optional(),
  status: z.string().optional(),
  source: z.string().nullable().optional()
})

const outcomeUpdateSchema = z.object({
  label: z.string().nullable().optional(),
  status: z.string().optional(),
  statusReason: z.string().nullable().optional()
})

const progressEntrySchema = z.object({
  carePlanId: z.string().uuid(),
  problemId: z.string().uuid().nullable().optional(),
  goalId: z.string().uuid().nullable().optional(),
  outcomeId: z.string().uuid().nullable().optional(),
  patientId: z.string().uuid(),
  progressStatus: z.string().min(1),
  comment: z.string().nullable().optional()
})

const reviewSchema = z.object({
  carePlanId: z.string().uuid(),
  patientId: z.string().uuid(),
  comment: z.string().nullable().optional()
})

// ─── Care plans ───────────────────────────────────────────────────────────
router.get('/patients/:patientId/care-plans', authenticate, async (req, res, next) => {
  try {
    const carePlans = await prisma.carePlan.findMany({
      where: { patientId: req.params.patientId, facilityId: req.user.facilityId },
      include: {
        problems: {
          include: { goals: { include: { outcomes: true } } }
        }
      },
      orderBy: { createdAt: 'asc' }
    })
    res.json({ carePlans })
  } catch (error) {
    next(error)
  }
})

router.post('/care-plans', authenticate, authorize(...CLINICAL_WRITE_ROLES), validate(carePlanSchema), async (req, res, next) => {
  try {
    await requirePatientForFacility(req.body.patientId, req.user.facilityId, { select: { id: true } })
    const carePlan = await prisma.carePlan.create({
      data: {
        patientId: req.body.patientId,
        encounterId: req.body.encounterId || null,
        admissionId: req.body.admissionId || null,
        facilityId: req.user.facilityId,
        name: req.body.name || null,
        title: req.body.title || null,
        type: req.body.type || null,
        status: req.body.status || 'active',
        source: req.body.source || 'manual'
      }
    })
    res.status(201).json({ carePlan })
  } catch (error) {
    next(error)
  }
})

router.patch('/care-plans/:id', authenticate, authorize(...CLINICAL_WRITE_ROLES), validate(carePlanUpdateSchema), async (req, res, next) => {
  try {
    const existing = await prisma.carePlan.findFirst({ where: { id: req.params.id, facilityId: req.user.facilityId } })
    if (!existing) return res.status(404).json({ error: 'Care plan not found' })
    const carePlan = await prisma.carePlan.update({ where: { id: req.params.id }, data: req.body })
    res.json({ carePlan })
  } catch (error) {
    next(error)
  }
})

// ─── Problems ───────────────────────────────────────────────────────────────
router.post('/care-plan-problems', authenticate, authorize(...CLINICAL_WRITE_ROLES), validate(problemSchema), async (req, res, next) => {
  try {
    const carePlan = await prisma.carePlan.findFirst({ where: { id: req.body.carePlanId, facilityId: req.user.facilityId } })
    if (!carePlan) return res.status(404).json({ error: 'Care plan not found' })
    const problem = await prisma.carePlanProblem.create({
      data: {
        carePlanId: req.body.carePlanId,
        patientId: req.body.patientId,
        facilityId: req.user.facilityId,
        label: req.body.label,
        status: req.body.status || 'active',
        source: req.body.source || 'manual',
        sortOrder: req.body.sortOrder || 0,
        diagnosis: req.body.diagnosis || null
      }
    })
    res.status(201).json({ problem })
  } catch (error) {
    next(error)
  }
})

router.patch('/care-plan-problems/:id', authenticate, authorize(...CLINICAL_WRITE_ROLES), validate(problemUpdateSchema), async (req, res, next) => {
  try {
    const existing = await prisma.carePlanProblem.findFirst({ where: { id: req.params.id, facilityId: req.user.facilityId } })
    if (!existing) return res.status(404).json({ error: 'Problem not found' })
    const problem = await prisma.carePlanProblem.update({ where: { id: req.params.id }, data: req.body })
    res.json({ problem })
  } catch (error) {
    next(error)
  }
})

// ─── Goals ──────────────────────────────────────────────────────────────────
router.post('/care-plan-goals', authenticate, authorize(...CLINICAL_WRITE_ROLES), validate(goalSchema), async (req, res, next) => {
  try {
    const problem = await prisma.carePlanProblem.findFirst({ where: { id: req.body.problemId, facilityId: req.user.facilityId } })
    if (!problem) return res.status(404).json({ error: 'Problem not found' })
    const goal = await prisma.carePlanGoal.create({
      data: {
        problemId: req.body.problemId,
        patientId: req.body.patientId,
        facilityId: req.user.facilityId,
        label: req.body.label,
        description: req.body.description || null,
        status: req.body.status || 'active',
        source: req.body.source || 'manual',
        sortOrder: req.body.sortOrder || 0,
        expectedEndDate: req.body.expectedEndDate ? new Date(req.body.expectedEndDate) : null,
        achieved: !!req.body.achieved,
        timeline: req.body.timeline || null
      }
    })
    res.status(201).json({ goal })
  } catch (error) {
    next(error)
  }
})

router.patch('/care-plan-goals/:id', authenticate, authorize(...CLINICAL_WRITE_ROLES), validate(goalUpdateSchema), async (req, res, next) => {
  try {
    const existing = await prisma.carePlanGoal.findFirst({ where: { id: req.params.id, facilityId: req.user.facilityId } })
    if (!existing) return res.status(404).json({ error: 'Goal not found' })
    const { expectedEndDate, ...rest } = req.body
    const goal = await prisma.carePlanGoal.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        ...(expectedEndDate !== undefined && { expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : null })
      }
    })
    res.json({ goal })
  } catch (error) {
    next(error)
  }
})

// ─── Outcomes ───────────────────────────────────────────────────────────────
router.post('/care-plan-outcomes', authenticate, authorize(...CLINICAL_WRITE_ROLES), validate(outcomeSchema), async (req, res, next) => {
  try {
    const goal = await prisma.carePlanGoal.findFirst({ where: { id: req.body.goalId, facilityId: req.user.facilityId } })
    if (!goal) return res.status(404).json({ error: 'Goal not found' })
    const outcome = await prisma.carePlanOutcome.create({
      data: {
        goalId: req.body.goalId,
        patientId: req.body.patientId,
        facilityId: req.user.facilityId,
        label: req.body.label || null,
        status: req.body.status || 'active',
        source: req.body.source || 'manual'
      }
    })
    res.status(201).json({ outcome })
  } catch (error) {
    next(error)
  }
})

router.patch('/care-plan-outcomes/:id', authenticate, authorize(...CLINICAL_WRITE_ROLES), validate(outcomeUpdateSchema), async (req, res, next) => {
  try {
    const existing = await prisma.carePlanOutcome.findFirst({ where: { id: req.params.id, facilityId: req.user.facilityId } })
    if (!existing) return res.status(404).json({ error: 'Outcome not found' })
    const outcome = await prisma.carePlanOutcome.update({ where: { id: req.params.id }, data: req.body })
    res.json({ outcome })
  } catch (error) {
    next(error)
  }
})

// ─── Progress entries — server computes and persists lastProgressStatus ────
router.post('/care-plan-progress-entries', authenticate, authorize(...CLINICAL_WRITE_ROLES), validate(progressEntrySchema), async (req, res, next) => {
  try {
    const carePlan = await prisma.carePlan.findFirst({ where: { id: req.body.carePlanId, facilityId: req.user.facilityId } })
    if (!carePlan) return res.status(404).json({ error: 'Care plan not found' })

    const { problemId, goalId, outcomeId, patientId, progressStatus, comment } = req.body
    const documentedAt = new Date()

    const entry = await prisma.carePlanProgressEntry.create({
      data: {
        carePlanId: req.body.carePlanId,
        problemId: problemId || null,
        goalId: goalId || null,
        outcomeId: outcomeId || null,
        patientId,
        facilityId: req.user.facilityId,
        progressStatus,
        comment: comment || null,
        documentedById: req.user.id,
        documentedByRole: req.user.role || null,
        documentedAt,
        source: 'manual'
      }
    })

    let goal = null
    if (goalId) {
      goal = await prisma.carePlanGoal.update({
        where: { id: goalId },
        data: { lastProgressStatus: progressStatus, lastDocumentedAt: documentedAt, lastDocumentedById: req.user.id }
      })
    }

    res.status(201).json({ entry, goal })
  } catch (error) {
    next(error)
  }
})

router.get('/patients/:patientId/care-plan-progress-entries', authenticate, async (req, res, next) => {
  try {
    const entries = await prisma.carePlanProgressEntry.findMany({
      where: { patientId: req.params.patientId, facilityId: req.user.facilityId },
      orderBy: { documentedAt: 'desc' }
    })
    res.json({ entries })
  } catch (error) {
    next(error)
  }
})

// ─── Reviews ────────────────────────────────────────────────────────────────
router.post('/care-plans/:id/review', authenticate, authorize(...CLINICAL_WRITE_ROLES), validate(reviewSchema), async (req, res, next) => {
  try {
    const carePlan = await prisma.carePlan.findFirst({ where: { id: req.params.id, facilityId: req.user.facilityId } })
    if (!carePlan) return res.status(404).json({ error: 'Care plan not found' })

    const reviewedAt = new Date()
    const [review, updatedPlan] = await prisma.$transaction([
      prisma.carePlanReview.create({
        data: {
          carePlanId: req.params.id,
          patientId: req.body.patientId,
          facilityId: req.user.facilityId,
          reviewedById: req.user.id,
          reviewedAt,
          comment: req.body.comment || null
        }
      }),
      prisma.carePlan.update({
        where: { id: req.params.id },
        data: { reviewedAt, reviewedById: req.user.id }
      })
    ])
    res.status(201).json({ review, carePlan: updatedPlan })
  } catch (error) {
    next(error)
  }
})

module.exports = router
