// ─── CameroHealth — eMAR: Medication Administration Routes ─────────────────
// Normalized per-dose history that backs the eMAR grid and the administration
// report. Distinct from Medication (the order/prescription) in clinical.js —
// administering one dose must never overwrite the record of another.
const { Router } = require('express')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { authenticate, authorize } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { requirePatientForFacility } = require('../lib/tenant')
const { nextOccurrenceAt, isDiscontinued } = require('../lib/medicationSchedule')
const { NURSE_CHART_ROLES } = require('../lib/clinicalRoles')

const router = Router()

const ADMINISTERED_BY_SELECT = { select: { id: true, fullName: true } }

// ─── Schemas ────────────────────────────────────────────────────────────────
const createDueSchema = z.object({
  medicationId: z.string().uuid(),
  patientId: z.string().uuid(),
  scheduledFor: z.string()
})

const administerSchema = z.object({
  status: z.enum(['Given', 'Held', 'Refused', 'Not Available']),
  administeredAt: z.string().nullable().optional(),
  route: z.string().nullable().optional(),
  doseGiven: z.string().nullable().optional(),
  site: z.string().nullable().optional(),
  lotNumber: z.string().nullable().optional(),
  patientResponse: z.string().nullable().optional(),
  refusalReason: z.string().nullable().optional(),
  comment: z.string().nullable().optional()
})

// ─── GET /medication-administrations?patientId=&medicationId= ──────────────
// History for the eMAR grid and the administration report — the PATCH record
// below already IS the report, this just lists them.
router.get('/medication-administrations', authenticate, async (req, res, next) => {
  try {
    const { patientId, medicationId } = req.query
    const where = { facilityId: req.user.facilityId }
    if (patientId) where.patientId = patientId
    if (medicationId) where.medicationId = medicationId

    const administrations = await prisma.medicationAdministration.findMany({
      where,
      include: { administeredBy: ADMINISTERED_BY_SELECT },
      orderBy: { scheduledFor: 'asc' },
      take: 500
    })
    res.json(administrations)
  } catch (error) {
    next(error)
  }
})

// ─── POST /medication-administrations ───────────────────────────────────────
// Creates a "Due" row directly — used by clinical.js when a new order is
// placed (the first scheduled dose) and available generally for manually
// scheduling a dose outside that flow.
router.post('/medication-administrations', authenticate, authorize('ADMIN', ...NURSE_CHART_ROLES), validate(createDueSchema), async (req, res, next) => {
  try {
    const { medicationId, patientId, scheduledFor } = req.body
    await requirePatientForFacility(patientId, req.user.facilityId, { select: { id: true } })
    const medication = await prisma.medication.findFirst({
      where: { id: medicationId, facilityId: req.user.facilityId }
    })
    if (!medication) return res.status(404).json({ error: 'Medication order not found' })

    const administration = await prisma.medicationAdministration.create({
      data: {
        medicationId,
        patientId,
        facilityId: req.user.facilityId,
        scheduledFor: new Date(scheduledFor),
        status: 'Due'
      }
    })
    res.status(201).json({ administration })
  } catch (error) {
    next(error)
  }
})

// ─── PATCH /medication-administrations/:id ──────────────────────────────────
// The actual "give / hold / refuse / not available" action — this record IS
// the administration report entry. On success, auto-schedules the next dose
// at a fixed cadence from this dose's own planned time (not the actual
// administration time, to avoid drift), UNLESS the order has since been
// discontinued/cancelled/stopped. The cadence continues for Held/Refused/Not
// Available too — only discontinuation stops future doses from being planned.
router.patch('/medication-administrations/:id', authenticate, authorize('ADMIN', ...NURSE_CHART_ROLES), validate(administerSchema), async (req, res, next) => {
  try {
    const existing = await prisma.medicationAdministration.findFirst({
      where: { id: req.params.id, facilityId: req.user.facilityId }
    })
    if (!existing) return res.status(404).json({ error: 'Administration record not found' })

    const medication = await prisma.medication.findFirst({
      where: { id: existing.medicationId, facilityId: req.user.facilityId }
    })
    if (!medication) return res.status(404).json({ error: 'Medication order not found' })

    const {
      status, administeredAt, route, doseGiven, site,
      lotNumber, patientResponse, refusalReason, comment
    } = req.body

    const administration = await prisma.medicationAdministration.update({
      where: { id: existing.id },
      data: {
        status,
        administeredAt: administeredAt ? new Date(administeredAt) : new Date(),
        administeredById: req.user.id,
        route: route || existing.route,
        doseGiven: doseGiven || null,
        site: site || null,
        lotNumber: lotNumber || null,
        patientResponse: patientResponse || null,
        refusalReason: refusalReason || null,
        comment: comment || null
      },
      include: { administeredBy: ADMINISTERED_BY_SELECT }
    })

    let nextDue = null
    if (!isDiscontinued(medication.status)) {
      const nextTime = nextOccurrenceAt(medication.frequency, existing.scheduledFor)
      if (nextTime) {
        nextDue = await prisma.medicationAdministration.create({
          data: {
            medicationId: medication.id,
            patientId: medication.patientId,
            facilityId: req.user.facilityId,
            scheduledFor: new Date(nextTime),
            status: 'Due'
          }
        })
      }
    }

    res.json({ administration, nextDue })
  } catch (error) {
    next(error)
  }
})

module.exports = router
