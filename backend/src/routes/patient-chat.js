// ─── CameroHealth — Patient Chat (internal, async care-team discussion) ────
// One message thread per patient, visible to the whole clinical team — an
// async discussion feed alongside the chart, not a real-time messenger (this
// app has no WebSocket layer; a plain poll/refresh on open matches every
// other clinical resource here).
const { Router } = require('express')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { authenticate, authorize } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { requirePatientForFacility } = require('../lib/tenant')
const { CLINICAL_WRITE_ROLES } = require('../lib/clinicalRoles')

const router = Router()

const AUTHOR_SELECT = { select: { id: true, fullName: true, role: true } }

const messageSchema = z.object({
  patientId: z.string().uuid(),
  body: z.string().min(1)
})

// ─── GET /patient-chat?patientId= ───────────────────────────────────────────
router.get('/patient-chat', authenticate, async (req, res, next) => {
  try {
    const { patientId } = req.query
    if (!patientId) return res.status(400).json({ error: 'patientId is required' })

    const messages = await prisma.patientMessage.findMany({
      where: { patientId, facilityId: req.user.facilityId },
      include: { author: AUTHOR_SELECT },
      orderBy: { createdAt: 'asc' },
      take: 500
    })
    res.json(messages)
  } catch (error) {
    next(error)
  }
})

// ─── POST /patient-chat ──────────────────────────────────────────────────────
router.post('/patient-chat', authenticate, authorize(...CLINICAL_WRITE_ROLES), validate(messageSchema), async (req, res, next) => {
  try {
    await requirePatientForFacility(req.body.patientId, req.user.facilityId, { select: { id: true } })

    const message = await prisma.patientMessage.create({
      data: {
        patientId: req.body.patientId,
        facilityId: req.user.facilityId,
        authorId: req.user.id,
        body: req.body.body
      },
      include: { author: AUTHOR_SELECT }
    })
    res.status(201).json(message)
  } catch (error) {
    next(error)
  }
})

module.exports = router
