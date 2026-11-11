// ─── CameroHealth — Patient Education Routes ────────────────────────────────
const { Router } = require('express')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { authenticate, authorize } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { requirePatientForFacility } = require('../lib/tenant')
const { CLINICAL_WRITE_ROLES } = require('../lib/clinicalRoles')

const router = Router()

// Documenting/reviewing patient teaching is also the social worker's and
// physiotherapist's domain (frontend/components/.../Patient360ContextForms.vue
// permissions.education) — broader than CLINICAL_WRITE_ROLES.
const EDUCATION_ROLES = ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'MIDWIFE', 'PHARMACY', 'SOCIAL_WORKER', 'PHYSIOTHERAPIST']

const titleSchema = z.object({
  patientId: z.string().uuid(),
  encounterId: z.string().nullable().optional(),
  admissionId: z.string().nullable().optional(),
  title: z.string().min(1),
  category: z.string().nullable().optional(),
  source: z.string().optional(),
  sortOrder: z.number().optional()
})

const pointSchema = z.object({
  titleId: z.string().uuid(),
  patientId: z.string().uuid(),
  encounterId: z.string().nullable().optional(),
  admissionId: z.string().nullable().optional(),
  label: z.string().min(1),
  description: z.string().nullable().optional(),
  topic: z.string().nullable().optional(),
  requiredLearners: z.array(z.string()).optional(),
  materialIds: z.array(z.string()).nullable().optional(),
  linkedProblemIds: z.array(z.string()).nullable().optional(),
  linkedOrderIds: z.array(z.string()).nullable().optional(),
  linkedMedicationIds: z.array(z.string()).nullable().optional(),
  sortOrder: z.number().optional(),
  systemGenerated: z.boolean().optional()
})

const pointUpdateSchema = z.object({
  status: z.string().optional()
})

const documentationSchema = z.object({
  pointId: z.string().uuid(),
  titleId: z.string().uuid().nullable().optional(),
  patientId: z.string().uuid(),
  learners: z.array(z.string()).optional(),
  readiness: z.string().nullable().optional(),
  methods: z.array(z.string()).optional(),
  responses: z.array(z.string()).optional(),
  comment: z.string().nullable().optional(),
  familyEducation: z.boolean().optional()
})

const documentationUpdateSchema = z.object({
  status: z.string().optional(),
  filed: z.boolean().optional(),
  resolved: z.boolean().optional()
})

const materialSchema = z.object({
  patientId: z.string().uuid(),
  title: z.string().min(1),
  language: z.string().optional(),
  format: z.string().optional(),
  instructions: z.string().nullable().optional()
})

const assignmentSchema = z.object({
  patientId: z.string().uuid(),
  materialId: z.string().uuid(),
  addedToAvs: z.boolean().optional()
})

const commentSchema = z.object({
  pointId: z.string().uuid(),
  patientId: z.string().uuid(),
  comment: z.string().min(1)
})

// GET /api/education?patientId=... — everything the education store hydrates
// its local collections from in one call
router.get('/education', authenticate, async (req, res, next) => {
  try {
    const { patientId } = req.query
    if (!patientId) return res.status(400).json({ error: 'patientId query parameter is required' })
    const facilityId = req.user.facilityId
    const [titles, points, documentations, materials, assignments, comments] = await Promise.all([
      prisma.educationTitle.findMany({ where: { patientId, facilityId }, orderBy: { sortOrder: 'asc' } }),
      prisma.educationPoint.findMany({ where: { patientId, facilityId }, orderBy: { sortOrder: 'asc' } }),
      prisma.educationDocumentation.findMany({ where: { patientId, facilityId }, orderBy: { taughtAt: 'desc' } }),
      prisma.patientMaterial.findMany({ where: { patientId, facilityId } }),
      prisma.materialAssignment.findMany({ where: { patientId, facilityId } }),
      prisma.educationComment.findMany({ where: { patientId, facilityId }, orderBy: { commentedAt: 'desc' } })
    ])
    res.json({ titles, points, documentations, materials, assignments, comments })
  } catch (error) {
    next(error)
  }
})

router.post('/education/titles', authenticate, authorize(...EDUCATION_ROLES), validate(titleSchema), async (req, res, next) => {
  try {
    await requirePatientForFacility(req.body.patientId, req.user.facilityId, { select: { id: true } })
    const title = await prisma.educationTitle.create({
      data: {
        patientId: req.body.patientId,
        encounterId: req.body.encounterId || null,
        facilityId: req.user.facilityId,
        title: req.body.title,
        category: req.body.category || null,
        source: req.body.source || 'manual',
        sortOrder: req.body.sortOrder || 0
      }
    })
    res.status(201).json({ title })
  } catch (error) {
    next(error)
  }
})

router.post('/education/points', authenticate, authorize(...EDUCATION_ROLES), validate(pointSchema), async (req, res, next) => {
  try {
    await requirePatientForFacility(req.body.patientId, req.user.facilityId, { select: { id: true } })
    const point = await prisma.educationPoint.create({
      data: {
        titleId: req.body.titleId,
        patientId: req.body.patientId,
        facilityId: req.user.facilityId,
        encounterId: req.body.encounterId || null,
        admissionId: req.body.admissionId || null,
        label: req.body.label,
        description: req.body.description || null,
        topic: req.body.topic || null,
        requiredLearners: req.body.requiredLearners || null,
        materialIds: req.body.materialIds || null,
        linkedProblemIds: req.body.linkedProblemIds || null,
        linkedOrderIds: req.body.linkedOrderIds || null,
        linkedMedicationIds: req.body.linkedMedicationIds || null,
        sortOrder: req.body.sortOrder || 0,
        systemGenerated: req.body.systemGenerated || false
      }
    })
    res.status(201).json({ point })
  } catch (error) {
    next(error)
  }
})

router.patch('/education/points/:id', authenticate, authorize(...EDUCATION_ROLES), validate(pointUpdateSchema), async (req, res, next) => {
  try {
    const existing = await prisma.educationPoint.findFirst({ where: { id: req.params.id, facilityId: req.user.facilityId } })
    if (!existing) return res.status(404).json({ error: 'Education point not found' })
    const point = await prisma.educationPoint.update({
      where: { id: req.params.id },
      data: { ...(req.body.status && { status: req.body.status }) }
    })
    res.json({ point })
  } catch (error) {
    next(error)
  }
})

router.post('/education/documentation', authenticate, authorize(...EDUCATION_ROLES), validate(documentationSchema), async (req, res, next) => {
  try {
    await requirePatientForFacility(req.body.patientId, req.user.facilityId, { select: { id: true } })
    const learners = req.body.learners || []
    const familyEducation = req.body.familyEducation !== undefined
      ? req.body.familyEducation
      : (learners.includes('Family') || learners.includes('Family/Caregiver') || learners.includes('Caregiver'))
    const doc = await prisma.educationDocumentation.create({
      data: {
        pointId: req.body.pointId,
        titleId: req.body.titleId || null,
        patientId: req.body.patientId,
        facilityId: req.user.facilityId,
        learners,
        readiness: req.body.readiness || null,
        methods: req.body.methods || [],
        responses: req.body.responses || [],
        comment: req.body.comment || null,
        teachingCompleted: true,
        familyEducation,
        taughtById: req.user.id,
        taughtByRole: req.user.role,
        taughtAt: new Date(),
        status: 'documented'
      }
    })

    // Mirror the frontend's point-status rule so both write paths agree.
    let newStatus = null
    if (req.body.responses?.includes('Needs Reinforcement')) newStatus = 'needs_reinforcement'
    else if (req.body.responses?.includes('Verbalizes Understanding') || req.body.responses?.includes('Demonstrated Understanding')) newStatus = 'completed'
    if (newStatus) {
      await prisma.educationPoint.updateMany({ where: { id: req.body.pointId, facilityId: req.user.facilityId }, data: { status: newStatus } })
    }

    res.status(201).json({ documentation: doc })
  } catch (error) {
    next(error)
  }
})

router.patch('/education/documentation/:id', authenticate, authorize(...EDUCATION_ROLES), validate(documentationUpdateSchema), async (req, res, next) => {
  try {
    const existing = await prisma.educationDocumentation.findFirst({ where: { id: req.params.id, facilityId: req.user.facilityId } })
    if (!existing) return res.status(404).json({ error: 'Education documentation not found' })
    const now = new Date()
    const doc = await prisma.educationDocumentation.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.filed && { filedAt: now, status: 'filed' }),
        ...(req.body.resolved && { resolvedAt: now, status: 'resolved' }),
        ...(req.body.status && !req.body.filed && !req.body.resolved && { status: req.body.status })
      }
    })
    if (req.body.resolved) {
      await prisma.educationPoint.updateMany({ where: { id: existing.pointId, facilityId: req.user.facilityId }, data: { status: 'completed' } })
    }
    res.json({ documentation: doc })
  } catch (error) {
    next(error)
  }
})

router.post('/education/materials', authenticate, authorize(...EDUCATION_ROLES), validate(materialSchema), async (req, res, next) => {
  try {
    await requirePatientForFacility(req.body.patientId, req.user.facilityId, { select: { id: true } })
    const material = await prisma.patientMaterial.create({
      data: {
        patientId: req.body.patientId,
        facilityId: req.user.facilityId,
        title: req.body.title,
        language: req.body.language || 'French',
        format: req.body.format || 'Verbal + printed',
        instructions: req.body.instructions || null,
        createdById: req.user.id
      }
    })
    res.status(201).json({ material })
  } catch (error) {
    next(error)
  }
})

router.post('/education/material-assignments', authenticate, authorize(...EDUCATION_ROLES), validate(assignmentSchema), async (req, res, next) => {
  try {
    await requirePatientForFacility(req.body.patientId, req.user.facilityId, { select: { id: true } })
    const assignment = await prisma.materialAssignment.create({
      data: {
        patientId: req.body.patientId,
        facilityId: req.user.facilityId,
        materialId: req.body.materialId,
        addedToAvs: req.body.addedToAvs !== false,
        addedById: req.user.id,
        addedAt: new Date()
      }
    })
    res.status(201).json({ assignment })
  } catch (error) {
    next(error)
  }
})

router.patch('/education/material-assignments/:id', authenticate, authorize(...EDUCATION_ROLES), async (req, res, next) => {
  try {
    const existing = await prisma.materialAssignment.findFirst({ where: { id: req.params.id, facilityId: req.user.facilityId } })
    if (!existing) return res.status(404).json({ error: 'Material assignment not found' })
    const assignment = await prisma.materialAssignment.update({
      where: { id: req.params.id },
      data: { removedAt: new Date(), removedById: req.user.id }
    })
    res.json({ assignment })
  } catch (error) {
    next(error)
  }
})

router.post('/education/comments', authenticate, authorize(...EDUCATION_ROLES), validate(commentSchema), async (req, res, next) => {
  try {
    await requirePatientForFacility(req.body.patientId, req.user.facilityId, { select: { id: true } })
    const comment = await prisma.educationComment.create({
      data: {
        pointId: req.body.pointId,
        patientId: req.body.patientId,
        facilityId: req.user.facilityId,
        comment: req.body.comment,
        commentedById: req.user.id,
        commentedAt: new Date()
      }
    })
    res.status(201).json({ comment })
  } catch (error) {
    next(error)
  }
})

module.exports = router
