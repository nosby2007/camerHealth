// ─── CameroHealth — Platform Operations Routes (Super Admin only) ───────────
// True platform-wide views: not scoped to a facility or even an organization.
// This is the software vendor's own back office, distinct from MINSANTE/org
// hierarchy oversight (see organizations.js/reports.js for that).
const { Router } = require('express')
const prisma = require('../lib/prisma')
const { authenticate, authorize } = require('../middleware/auth')

const router = Router()

// GET /api/platform/overview — counts + recent activity across the whole platform
router.get('/overview', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const now = new Date()
    const reportMonth = now.getMonth() + 1
    const reportYear = now.getFullYear()

    const [
      organizationCount,
      facilityTotal,
      facilityActive,
      staffTotal,
      staffActive,
      patientCount,
      rmaSubmittedThisMonth,
      recentAudit,
      recentFacilities
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.facility.count(),
      prisma.facility.count({ where: { status: 'active' } }),
      prisma.staffProfile.count(),
      prisma.staffProfile.count({ where: { status: 'active' } }),
      prisma.patient.count(),
      prisma.monthlyActivityReport.count({
        where: { reportMonth, reportYear, status: { in: ['submitted', 'validated'] } }
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: { id: true, action: true, detail: true, createdAt: true, facilityId: true, organizationId: true }
      }),
      prisma.facility.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, code: true, region: true, city: true, status: true, createdAt: true }
      })
    ])

    res.json({
      generatedAt: now.toISOString(),
      counts: {
        organizations: organizationCount,
        facilities: { total: facilityTotal, active: facilityActive },
        staff: { total: staffTotal, active: staffActive },
        patients: patientCount
      },
      rmaCompliance: {
        reportMonth,
        reportYear,
        submitted: rmaSubmittedThisMonth,
        expected: facilityActive,
        rate: facilityActive ? Math.round((rmaSubmittedThisMonth / facilityActive) * 100) : null
      },
      recentAudit,
      recentFacilities
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
