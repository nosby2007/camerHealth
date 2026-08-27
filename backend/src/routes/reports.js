// ─── CameroHealth — RMA (Rapport Mensuel d'Activité) Routes ─────────────────
// Named `reports.js` (not `/reports`) to avoid colliding with the existing
// frontend `/reports` page, an unrelated Ministry epidemiological export view.
const { Router } = require('express')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { authenticate, authorize, facilityScoped, hierarchyScoped } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { resolveFacilityIdsForUnit } = require('../lib/orgHierarchy')

const router = Router()

const HIERARCHY_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'REGIONAL_ADMIN', 'DISTRICT_ADMIN']

// ─── RMA_INDICATOR_SCHEMA_V1 ──────────────────────────────────────────────────
// Generic starter indicator set — placeholder pending the official MINSANTE
// RMA form. Kept as a versioned zod schema (not columns) so the real list can
// be swapped in later without a migration; only this object needs to change.
const RMA_INDICATOR_SCHEMA_V1 = z.object({
  consultationsTotal: z.number().nonnegative().optional(),
  consultationsNew: z.number().nonnegative().optional(),
  admissionsTotal: z.number().nonnegative().optional(),
  deliveries: z.number().nonnegative().optional(),
  deathsTotal: z.number().nonnegative().optional(),
  deathsMaternal: z.number().nonnegative().optional(),
  deathsUnder5: z.number().nonnegative().optional(),
  malariaCases: z.number().nonnegative().optional(),
  tuberculosisCases: z.number().nonnegative().optional(),
  vaccinationsDoses: z.number().nonnegative().optional()
}).catchall(z.number().optional())

const rmaSchema = z.object({
  reportMonth: z.number().int().min(1).max(12),
  reportYear: z.number().int().min(2000),
  indicators: RMA_INDICATOR_SCHEMA_V1
})

const validationSchema = z.object({
  validationNotes: z.string().optional()
})

const rejectionSchema = z.object({
  rejectionReason: z.string().min(1)
})

function sumIndicators(reports) {
  const totals = {}
  for (const report of reports) {
    const indicators = report.indicators || {}
    for (const [key, value] of Object.entries(indicators)) {
      if (typeof value !== 'number') continue
      totals[key] = (totals[key] || 0) + value
    }
  }
  return totals
}

// ─── POST /rma — facility submits its monthly report ─────────────────────────
router.post('/rma', authenticate, authorize('ADMIN'), facilityScoped, validate(rmaSchema), async (req, res, next) => {
  try {
    const { reportMonth, reportYear, indicators } = req.body
    const facility = await prisma.facility.findUnique({ where: { id: req.user.facilityId } })

    const report = await prisma.monthlyActivityReport.upsert({
      where: { facilityId_reportMonth_reportYear: { facilityId: req.user.facilityId, reportMonth, reportYear } },
      update: {
        indicators,
        status: 'submitted',
        organizationUnitId: facility?.organizationUnitId || null,
        submittedById: req.user.id,
        submittedAt: new Date()
      },
      create: {
        facilityId: req.user.facilityId,
        organizationUnitId: facility?.organizationUnitId || null,
        reportMonth,
        reportYear,
        indicators,
        status: 'submitted',
        submittedById: req.user.id,
        submittedAt: new Date()
      }
    })

    await prisma.auditLog.create({
      data: {
        facilityId: req.user.facilityId,
        action: 'RMA_SUBMITTED',
        actorId: req.user.id,
        targetId: report.id,
        detail: `RMA ${reportMonth}/${reportYear} submitted`
      }
    })

    res.status(201).json({ report })
  } catch (error) {
    next(error)
  }
})

// ─── GET /rma — list reports visible to the caller ────────────────────────────
router.get('/rma', authenticate, hierarchyScoped, async (req, res, next) => {
  try {
    const { reportMonth, reportYear, status } = req.query

    let where = {}
    if (req.scopedFacilityIds === 'ALL') {
      // platform scope — no facility filter
    } else if (Array.isArray(req.scopedFacilityIds)) {
      where.facilityId = { in: req.scopedFacilityIds }
    } else {
      where.facilityId = req.user.facilityId
    }

    if (reportMonth) where.reportMonth = Number(reportMonth)
    if (reportYear) where.reportYear = Number(reportYear)
    if (status) where.status = status

    const reports = await prisma.monthlyActivityReport.findMany({
      where,
      orderBy: [{ reportYear: 'desc' }, { reportMonth: 'desc' }],
      include: { facility: { select: { id: true, name: true, code: true, region: true } } }
    })
    res.json({ reports })
  } catch (error) {
    next(error)
  }
})

// ─── PATCH /rma/:id/validate ─────────────────────────────────────────────────
router.patch('/rma/:id/validate', authenticate, authorize(...HIERARCHY_ROLES), validate(validationSchema), async (req, res, next) => {
  try {
    const report = await prisma.monthlyActivityReport.update({
      where: { id: req.params.id },
      data: {
        status: 'validated',
        validatedById: req.user.id,
        validatedAt: new Date(),
        validationNotes: req.body.validationNotes || null
      }
    })
    await prisma.auditLog.create({
      data: {
        facilityId: report.facilityId,
        organizationUnitId: report.organizationUnitId,
        action: 'RMA_VALIDATED',
        actorId: req.user.id,
        targetId: report.id
      }
    })
    res.json({ report })
  } catch (error) {
    next(error)
  }
})

// ─── PATCH /rma/:id/reject ────────────────────────────────────────────────────
router.patch('/rma/:id/reject', authenticate, authorize(...HIERARCHY_ROLES), validate(rejectionSchema), async (req, res, next) => {
  try {
    const report = await prisma.monthlyActivityReport.update({
      where: { id: req.params.id },
      data: {
        status: 'rejected',
        rejectedById: req.user.id,
        rejectedAt: new Date(),
        rejectionReason: req.body.rejectionReason
      }
    })
    await prisma.auditLog.create({
      data: {
        facilityId: report.facilityId,
        organizationUnitId: report.organizationUnitId,
        action: 'RMA_REJECTED',
        actorId: req.user.id,
        targetId: report.id,
        detail: req.body.rejectionReason
      }
    })
    res.json({ report })
  } catch (error) {
    next(error)
  }
})

// ─── GET /rma/aggregate?unitId=&month=&year= — rollup for a unit's subtree ──
router.get('/rma/aggregate', authenticate, authorize(...HIERARCHY_ROLES), async (req, res, next) => {
  try {
    const { unitId, month, year } = req.query
    if (!unitId || !month || !year) {
      return res.status(400).json({ error: 'unitId, month and year query parameters are required' })
    }

    const facilityIds = await resolveFacilityIdsForUnit(unitId)
    const reports = await prisma.monthlyActivityReport.findMany({
      where: {
        facilityId: { in: facilityIds },
        reportMonth: Number(month),
        reportYear: Number(year)
      },
      include: { facility: { select: { id: true, name: true, code: true } } }
    })

    res.json({
      unitId,
      reportMonth: Number(month),
      reportYear: Number(year),
      facilityCount: facilityIds.length,
      reportedCount: reports.length,
      totals: sumIndicators(reports),
      reports
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
