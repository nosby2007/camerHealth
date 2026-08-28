// ─── CameroHealth — Platform Operations Routes (Super Admin only) ───────────
// True platform-wide views: not scoped to a facility or even an organization.
// This is the software vendor's own back office, distinct from MINSANTE/org
// hierarchy oversight (see organizations.js/reports.js for that).
const { Router } = require('express')
const bcrypt = require('bcryptjs')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { authenticate, authorize } = require('../middleware/auth')
const { validate } = require('../middleware/validate')

const router = Router()

// Internal team members (sales/support) still need a StaffProfile row, and
// facilityId is a required FK — there's no clinical facility for them to
// belong to, so they're parked under one fixed internal placeholder facility
// instead. Their real access comes entirely from their platform-scope
// StaffAssignment, resolved by hierarchyScoped/resolveEffectiveRole.
const VENDOR_HQ_CODE = 'CAMEROHEALTH-HQ'

async function ensureVendorHqFacility() {
  const existing = await prisma.facility.findUnique({ where: { code: VENDOR_HQ_CODE } })
  if (existing) return existing
  return prisma.facility.create({
    data: {
      code: VENDOR_HQ_CODE,
      name: 'CameroHealth (Internal)',
      region: 'N/A',
      city: 'N/A',
      email: 'ops@camerohealth.cm',
      status: 'active'
    }
  })
}

const TEAM_ROLES = ['SALES', 'SUPPORT']

const teamMemberSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(TEAM_ROLES)
})

// GET /api/platform/overview — counts + recent activity across the whole platform
router.get('/overview', authenticate, authorize('SUPER_ADMIN', 'SALES', 'SUPPORT'), async (req, res, next) => {
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

// GET /api/platform/team — list internal sales/support team members
router.get('/team', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const assignments = await prisma.staffAssignment.findMany({
      where: { assignmentScope: 'platform', assignmentRole: { in: TEAM_ROLES }, status: 'active' },
      orderBy: { createdAt: 'desc' }
    })
    const staffIds = assignments.map(a => a.staffProfileId)
    const staff = await prisma.staffProfile.findMany({
      where: { id: { in: staffIds } },
      select: { id: true, fullName: true, email: true, status: true, lastLogin: true, createdAt: true }
    })
    const staffById = new Map(staff.map(s => [s.id, s]))
    const team = assignments
      .map(a => ({ assignmentId: a.id, role: a.assignmentRole, staff: staffById.get(a.staffProfileId) }))
      .filter(t => t.staff)
    res.json({ team })
  } catch (error) {
    next(error)
  }
})

// POST /api/platform/team — invite a sales/support team member
router.post('/team', authenticate, authorize('SUPER_ADMIN'), validate(teamMemberSchema), async (req, res, next) => {
  try {
    const { fullName, email, password, role } = req.body
    const hq = await ensureVendorHqFacility()

    const count = await prisma.staffProfile.count({ where: { facilityId: hq.id } })
    const staffCode = `${VENDOR_HQ_CODE}-${role.substring(0, 3)}${String(count + 1).padStart(3, '0')}`

    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)

    const staff = await prisma.staffProfile.create({
      data: {
        staffCode,
        fullName,
        email: email.toLowerCase(),
        role,
        passwordHash,
        facilityId: hq.id,
        status: 'active'
      }
    })

    const assignment = await prisma.staffAssignment.create({
      data: {
        staffProfileId: staff.id,
        assignmentRole: role,
        assignmentScope: 'platform',
        assignedByStaffId: req.user.id,
        assignedReason: `Internal team member invited by ${req.user.staffCode}`
      }
    })

    await prisma.auditLog.create({
      data: {
        action: 'PLATFORM_TEAM_MEMBER_INVITED',
        actorId: req.user.id,
        targetId: staff.id,
        detail: `${fullName} (${staffCode}) invited as ${role}`
      }
    })

    res.status(201).json({
      staff: { id: staff.id, staffCode: staff.staffCode, fullName: staff.fullName, email: staff.email, role },
      assignment
    })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/platform/team/:staffProfileId/status — activate/deactivate a team member
router.patch('/team/:staffProfileId/status', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { status } = req.body
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'status must be "active" or "inactive"' })
    }
    const staff = await prisma.staffProfile.update({
      where: { id: req.params.staffProfileId },
      data: { status }
    })
    res.json({ id: staff.id, status: staff.status })
  } catch (error) {
    next(error)
  }
})

module.exports = router
