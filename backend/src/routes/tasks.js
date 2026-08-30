// ─── CameroHealth — Care Team Work List (Task) Routes ───────────────────────
const { Router } = require('express')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { authenticate, authorize } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { requirePatientForFacility } = require('../lib/tenant')

const router = Router()

// The work list is a cross-department coordination tool (nursing hands a
// task to pharmacy, lab, social work, etc.) — deliberately broader than
// CLINICAL_WRITE_ROLES, matching the roles the frontend already lets open
// the "New Task" form (Patient360ContextForms.vue permissions.task).
const TASK_ROLES = ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'CNA', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR', 'LAB', 'IMAGING', 'PHARMACY', 'SOCIAL_WORKER', 'PHYSIOTHERAPIST']

const taskSchema = z.object({
  patientId: z.string().uuid(),
  relatedType: z.string().optional(),
  relatedId: z.string().optional(),
  title: z.string().min(1),
  assignedToRole: z.string().min(1),
  assignedToId: z.string().uuid().optional(),
  priority: z.string().optional(),
  dueAt: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  actionReason: z.string().nullable().optional()
})

// Union of the two task vocabularies in use: the department-wide worklist
// (clinical.js: pending/done/hold/cancel) and the Nurse Command Center's
// per-nurse task list (nursing.js: pending/in_progress/completed/refused/
// missed/cancelled) — both write to this same table.
const taskStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'done', 'completed', 'hold', 'refused', 'missed', 'cancel', 'cancelled']),
  reason: z.string().optional()
})

// GET /api/tasks?patientId=... — work list for a patient (or the whole
// facility's open tasks when patientId is omitted, for a role-scoped inbox)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { patientId, status, assignedToRole, assignedToId } = req.query
    const tasks = await prisma.task.findMany({
      where: {
        facilityId: req.user.facilityId,
        ...(patientId && { patientId }),
        ...(status && { status }),
        ...(assignedToRole && { assignedToRole }),
        ...(assignedToId && { assignedToId })
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    })
    res.json({ tasks })
  } catch (error) {
    next(error)
  }
})

// POST /api/tasks
router.post('/', authenticate, authorize(...TASK_ROLES), validate(taskSchema), async (req, res, next) => {
  try {
    await requirePatientForFacility(req.body.patientId, req.user.facilityId, { select: { id: true } })
    const now = new Date()
    const task = await prisma.task.create({
      data: {
        patientId: req.body.patientId,
        facilityId: req.user.facilityId,
        relatedType: req.body.relatedType || null,
        relatedId: req.body.relatedId || null,
        title: req.body.title,
        assignedToRole: req.body.assignedToRole,
        assignedToId: req.body.assignedToId || null,
        priority: req.body.priority || 'Routine',
        status: 'pending',
        dueAt: req.body.dueAt ? new Date(req.body.dueAt) : null,
        frequency: req.body.frequency || null,
        actionReason: req.body.actionReason || 'Task created from clinical order',
        history: [{ action: 'CREATED', status: 'pending', actor: req.user.fullName || req.user.staffCode, at: now.toISOString(), reason: req.body.actionReason || 'Task created from clinical order' }],
        createdById: req.user.id
      }
    })
    res.status(201).json({ task })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/tasks/:id — update status (done / hold / cancel)
router.patch('/:id', authenticate, authorize(...TASK_ROLES), validate(taskStatusSchema), async (req, res, next) => {
  try {
    const existing = await prisma.task.findFirst({ where: { id: req.params.id, facilityId: req.user.facilityId } })
    if (!existing) return res.status(404).json({ error: 'Task not found' })

    const now = new Date()
    const reason = req.body.reason || 'Task status updated'
    const history = Array.isArray(existing.history) ? existing.history : []
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        status: req.body.status,
        updatedById: req.user.id,
        history: [...history, { action: 'STATUS_UPDATED', status: req.body.status, actor: req.user.fullName || req.user.staffCode, at: now.toISOString(), reason }]
      }
    })
    res.json({ task })
  } catch (error) {
    next(error)
  }
})

module.exports = router
