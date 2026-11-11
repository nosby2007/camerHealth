// ─── CameroHealth — Care Team & Social Assessment Routes ────────────────────
const { Router } = require('express')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { authenticate, authorize } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { requirePatientForFacility } = require('../lib/tenant')

const router = Router()

// Matches Patient360ContextForms.vue's permissions map — care team management
// stays clinician-only, but social assessments are the social worker's own
// domain and must not be gated behind CLINICAL_WRITE_ROLES.
const CARE_TEAM_ROLES = ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR']
const SOCIAL_ASSESSMENT_ROLES = ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'MIDWIFE', 'SOCIAL_WORKER']

const careTeamMemberSchema = z.object({
  patientId: z.string().uuid(),
  name: z.string().min(1),
  role: z.string().min(1),
  service: z.string().nullable().optional(),
  contact: z.string().nullable().optional(),
  responsibility: z.string().nullable().optional(),
  status: z.string().optional(),
  note: z.string().nullable().optional()
})

const socialAssessmentSchema = z.object({
  patientId: z.string().uuid(),
  domain: z.string().min(1),
  finding: z.string().nullable().optional(),
  intervention: z.string().nullable().optional(),
  status: z.string().optional(),
  followUpAt: z.string().nullable().optional()
})

// ─── Care Team ────────────────────────────────────────────────────────────
// GET /api/care-team?patientId=...
router.get('/care-team', authenticate, async (req, res, next) => {
  try {
    const { patientId } = req.query
    if (!patientId) return res.status(400).json({ error: 'patientId query parameter is required' })
    const members = await prisma.careTeamMember.findMany({
      where: { patientId, facilityId: req.user.facilityId, removedAt: null },
      orderBy: { addedAt: 'desc' }
    })
    res.json({ members })
  } catch (error) {
    next(error)
  }
})

// POST /api/care-team
router.post('/care-team', authenticate, authorize(...CARE_TEAM_ROLES), validate(careTeamMemberSchema), async (req, res, next) => {
  try {
    await requirePatientForFacility(req.body.patientId, req.user.facilityId, { select: { id: true } })
    const member = await prisma.careTeamMember.create({
      data: {
        patientId: req.body.patientId,
        facilityId: req.user.facilityId,
        name: req.body.name,
        role: req.body.role,
        service: req.body.service || null,
        contact: req.body.contact || null,
        responsibility: req.body.responsibility || null,
        status: req.body.status || 'Active',
        note: req.body.note || null,
        addedById: req.user.id
      }
    })
    res.status(201).json({ member })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/care-team/:id — update status or remove a member
router.patch('/care-team/:id', authenticate, authorize(...CARE_TEAM_ROLES), async (req, res, next) => {
  try {
    const existing = await prisma.careTeamMember.findFirst({ where: { id: req.params.id, facilityId: req.user.facilityId } })
    if (!existing) return res.status(404).json({ error: 'Care team member not found' })
    const { status, removed } = req.body
    const member = await prisma.careTeamMember.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(removed === true && { removedAt: new Date() })
      }
    })
    res.json({ member })
  } catch (error) {
    next(error)
  }
})

// ─── Social Assessments ─────────────────────────────────────────────────────
// GET /api/social-assessments?patientId=...
router.get('/social-assessments', authenticate, async (req, res, next) => {
  try {
    const { patientId } = req.query
    if (!patientId) return res.status(400).json({ error: 'patientId query parameter is required' })
    const assessments = await prisma.socialAssessment.findMany({
      where: { patientId, facilityId: req.user.facilityId },
      orderBy: { assessedAt: 'desc' }
    })
    res.json({ assessments })
  } catch (error) {
    next(error)
  }
})

// POST /api/social-assessments
router.post('/social-assessments', authenticate, authorize(...SOCIAL_ASSESSMENT_ROLES), validate(socialAssessmentSchema), async (req, res, next) => {
  try {
    await requirePatientForFacility(req.body.patientId, req.user.facilityId, { select: { id: true } })
    const assessment = await prisma.socialAssessment.create({
      data: {
        patientId: req.body.patientId,
        facilityId: req.user.facilityId,
        domain: req.body.domain,
        finding: req.body.finding || null,
        intervention: req.body.intervention || null,
        status: req.body.status || 'Open',
        followUpAt: req.body.followUpAt ? new Date(req.body.followUpAt) : null,
        assessedById: req.user.id
      }
    })
    res.status(201).json({ assessment })
  } catch (error) {
    next(error)
  }
})

module.exports = router
