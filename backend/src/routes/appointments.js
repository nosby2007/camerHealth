// ─── CameroHealth — Appointment Routes ──────────────────────────────────────
const { Router } = require('express')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { authenticate } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { requirePatientForFacility } = require('../lib/tenant')

const router = Router()

const appointmentSchema = z.object({
  patientId: z.string().uuid(),
  date: z.string().min(1),
  time: z.string().nullable().optional(),
  type: z.string().min(1),
  notes: z.string().nullable().optional(),
  providerId: z.string().nullable().optional()
})

const appointmentUpdateSchema = z.object({
  status: z.enum(['Scheduled', 'Completed', 'Cancelled', 'No-Show']).optional(),
  date: z.string().min(1).optional(),
  time: z.string().nullable().optional(),
  type: z.string().min(1).optional(),
  notes: z.string().nullable().optional(),
  providerId: z.string().uuid().nullable().optional()
})

// GET /api/appointments
router.get('/', authenticate, async (req, res, next) => {
  try {
    const where = { facilityId: req.user.facilityId }
    if (req.query.date) {
      const dateStart = new Date(req.query.date)
      dateStart.setHours(0, 0, 0, 0)
      const dateEnd = new Date(dateStart)
      dateEnd.setHours(23, 59, 59, 999)
      where.date = { gte: dateStart, lte: dateEnd }
    }
    if (req.query.status) {
      where.status = req.query.status
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true, phone: true } },
        provider: { select: { id: true, fullName: true } }
      },
      orderBy: { date: 'asc' }
    })
    res.json(appointments)
  } catch (error) {
    next(error)
  }
})

// POST /api/appointments
router.post('/', authenticate, validate(appointmentSchema), async (req, res, next) => {
  try {
    await requirePatientForFacility(req.body.patientId, req.user.facilityId, { select: { id: true } })
    const appointment = await prisma.appointment.create({
      data: {
        patientId: req.body.patientId,
        facilityId: req.user.facilityId,
        date: new Date(req.body.date),
        time: req.body.time || null,
        type: req.body.type,
        notes: req.body.notes || null,
        providerId: req.body.providerId || null,
        createdById: req.user.id
      }
    })

    await prisma.auditLog.create({
      data: {
        facilityId: req.user.facilityId,
        action: 'APPOINTMENT_CREATED',
        actorId: req.user.id,
        targetId: appointment.id,
        detail: `Appointment created: ${appointment.type} on ${appointment.date.toISOString().split('T')[0]}`
      }
    })

    res.status(201).json(appointment)
  } catch (error) {
    next(error)
  }
})

// PATCH /api/appointments/:id
router.patch('/:id', authenticate, validate(appointmentUpdateSchema), async (req, res, next) => {
  try {
    const { status, date, time, type, notes, providerId } = req.body
    const existing = await prisma.appointment.findFirst({
      where: { id: req.params.id, facilityId: req.user.facilityId }
    })
    if (!existing) return res.status(404).json({ error: 'Appointment not found' })

    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(date && { date: new Date(date) }),
        ...(time !== undefined && { time }),
        ...(type !== undefined && { type }),
        ...(notes !== undefined && { notes }),
        ...(providerId !== undefined && { providerId })
      }
    })
    res.json(updated)
  } catch (error) {
    next(error)
  }
})

module.exports = router
