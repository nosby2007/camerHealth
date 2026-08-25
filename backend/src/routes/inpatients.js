// ─── CameroHealth — Inpatient / Admission Routes ────────────────────────────
const { Router } = require('express')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { authenticate } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { requirePatientForFacility } = require('../lib/tenant')

const router = Router()

const admitSchema = z.object({
  patientId:         z.string().uuid(),
  ward:              z.string().min(1),
  bedNumber:         z.string().optional(),
  admissionType:     z.string().optional(),
  admissionReason:   z.string().optional(),
  diagnosis:         z.string().optional(),
  treatmentPlan:     z.string().optional(),
  attendingDoctorId: z.string().uuid().optional(),
  notes:             z.string().optional()
})

// GET /api/inpatients — List active inpatients
router.get('/', authenticate, async (req, res, next) => {
  try {
    const where = { facilityId: req.user.facilityId }
    if (req.query.status && req.query.status !== 'all') {
      where.status = req.query.status
    } else if (req.query.status !== 'all') {
      where.status = { not: 'Discharged' }
    }

    const inpatients = await prisma.inpatient.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true, gender: true } },
        admittedBy: { select: { id: true, fullName: true } }
      },
      orderBy: { admittedAt: 'desc' }
    })
    res.json(inpatients)
  } catch (error) {
    next(error)
  }
})

// POST /api/inpatients — Admit a patient
router.post('/', authenticate, validate(admitSchema), async (req, res, next) => {
  try {
    await requirePatientForFacility(req.body.patientId, req.user.facilityId, { select: { id: true } })
    const inpatient = await prisma.inpatient.create({
      data: {
        patientId:         req.body.patientId,
        facilityId:        req.user.facilityId,
        ward:              req.body.ward,
        bedNumber:         req.body.bedNumber         || null,
        admissionType:     req.body.admissionType     || null,
        admissionReason:   req.body.admissionReason   || null,
        diagnosis:         req.body.diagnosis         || null,
        treatmentPlan:     req.body.treatmentPlan     || null,
        attendingDoctorId: req.body.attendingDoctorId || null,
        admittedById:      req.user.id
      }
    })

    await prisma.auditLog.create({
      data: {
        facilityId: req.user.facilityId,
        action: 'PATIENT_ADMITTED',
        actorId: req.user.id,
        targetId: inpatient.id,
        detail: `Patient admitted to ${inpatient.ward}`
      }
    })

    res.status(201).json(inpatient)
  } catch (error) {
    next(error)
  }
})

// PATCH /api/inpatients/:id — Update status (discharge, transfer)
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const { status, ward, bedNumber, admissionType, admissionReason, diagnosis, treatmentPlan, attendingDoctorId, dischargeSummary } = req.body
    const existing = await prisma.inpatient.findFirst({
      where: { id: req.params.id, facilityId: req.user.facilityId }
    })
    if (!existing) return res.status(404).json({ error: 'Inpatient record not found' })

    const updated = await prisma.inpatient.update({
      where: { id: req.params.id },
      data: {
        ...(status            && { status }),
        ...(ward              && { ward }),
        ...(bedNumber         !== undefined && { bedNumber }),
        ...(admissionType     && { admissionType }),
        ...(admissionReason   !== undefined && { admissionReason }),
        ...(diagnosis         !== undefined && { diagnosis }),
        ...(treatmentPlan     !== undefined && { treatmentPlan }),
        ...(attendingDoctorId !== undefined && { attendingDoctorId: attendingDoctorId || null }),
        ...(dischargeSummary  !== undefined && { dischargeSummary }),
        ...(status === 'Discharged' && { dischargedAt: new Date() })
      }
    })

    if (status === 'Discharged') {
      await prisma.auditLog.create({
        data: {
          facilityId: req.user.facilityId,
          action: 'PATIENT_DISCHARGED',
          actorId: req.user.id,
          targetId: updated.id,
          detail: `Patient discharged from ${updated.ward}`
        }
      })
    }

    res.json(updated)
  } catch (error) {
    next(error)
  }
})

module.exports = router
