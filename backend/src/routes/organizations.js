// ─── CameroHealth — Organization / Organization Unit Routes (Phase 13) ──────
// MINSANTE / Regional Delegation / District hierarchy above facility scope.
const { Router } = require('express')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { authenticate, authorize, hierarchyScoped } = require('../middleware/auth')
const { validate } = require('../middleware/validate')

const router = Router()

const HIERARCHY_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'REGIONAL_ADMIN', 'DISTRICT_ADMIN']

// ─── Schemas ────────────────────────────────────────────────────────────────
const organizationSchema = z.object({
  organizationCode: z.string().optional(),
  name: z.string().min(1),
  organizationType: z.enum(['MINISTRY', 'PUBLIC_HEALTH_AUTHORITY', 'PRIVATE_NETWORK', 'NGO_NETWORK', 'OTHER']),
  status: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

const organizationUnitSchema = z.object({
  parentUnitId: z.string().uuid().optional(),
  unitCode: z.string().optional(),
  name: z.string().min(1),
  unitType: z.enum(['NATIONAL', 'REGIONAL_DELEGATION', 'DISTRICT', 'CITY_CLUSTER', 'OTHER']),
  hierarchyLevel: z.number().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  status: z.string().optional()
})

const staffAssignmentSchema = z.object({
  staffProfileId: z.string().uuid(),
  assignmentRole: z.enum(['SUPER_ADMIN', 'ORG_ADMIN', 'REGIONAL_ADMIN', 'DISTRICT_ADMIN']),
  assignmentScope: z.enum(['platform', 'organization', 'organization_unit', 'facility']),
  organizationId: z.string().uuid().optional(),
  organizationUnitId: z.string().uuid().optional(),
  facilityId: z.string().uuid().optional(),
  assignedReason: z.string().optional()
})

function validateScopeBinding(scope, { organizationId, organizationUnitId, facilityId }) {
  if (scope === 'platform') return true
  if (scope === 'organization') return Boolean(organizationId)
  if (scope === 'organization_unit') return Boolean(organizationId && organizationUnitId)
  if (scope === 'facility') return Boolean(facilityId)
  return false
}

// ─── Organizations ────────────────────────────────────────────────────────────

// GET /api/organizations — list (SUPER_ADMIN sees all; others see their own via hierarchyScoped)
router.get('/', authenticate, authorize(...HIERARCHY_ROLES), hierarchyScoped, async (req, res, next) => {
  try {
    const where = req.user.role === 'SUPER_ADMIN'
      ? {}
      : { id: req.staffAssignment?.organizationId || '__none__' }
    const organizations = await prisma.organization.findMany({ where, orderBy: { name: 'asc' } })
    res.json({ organizations })
  } catch (error) {
    next(error)
  }
})

// POST /api/organizations — SUPER_ADMIN only
router.post('/', authenticate, authorize('SUPER_ADMIN'), validate(organizationSchema), async (req, res, next) => {
  try {
    const org = await prisma.organization.create({ data: req.body })
    await prisma.auditLog.create({
      data: { organizationId: org.id, action: 'ORGANIZATION_CREATED', actorId: req.user.id, detail: `Organization "${org.name}" created` }
    })
    res.status(201).json({ organization: org })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/organizations/:id — SUPER_ADMIN / ORG_ADMIN
router.patch('/:id', authenticate, authorize('SUPER_ADMIN', 'ORG_ADMIN'), async (req, res, next) => {
  try {
    const { name, organizationType, status, metadata } = req.body
    const org = await prisma.organization.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(organizationType && { organizationType }),
        ...(status && { status }),
        ...(metadata !== undefined && { metadata })
      }
    })
    res.json({ organization: org })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/organizations/:id — SUPER_ADMIN only
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    await prisma.organization.delete({ where: { id: req.params.id } })
    res.json({ message: 'Organization deleted' })
  } catch (error) {
    next(error)
  }
})

// ─── Organization units ───────────────────────────────────────────────────────

// POST /api/organizations/:id/units — create a unit under an organization
router.post('/:id/units', authenticate, authorize('SUPER_ADMIN', 'ORG_ADMIN'), validate(organizationUnitSchema), async (req, res, next) => {
  try {
    const unit = await prisma.organizationUnit.create({
      data: { ...req.body, organizationId: req.params.id }
    })
    await prisma.auditLog.create({
      data: { organizationId: req.params.id, action: 'ORG_UNIT_CREATED', actorId: req.user.id, detail: `Unit "${unit.name}" (${unit.unitType}) created` }
    })
    res.status(201).json({ organizationUnit: unit })
  } catch (error) {
    next(error)
  }
})

// GET /api/organizations/:id/units — list units for an organization
router.get('/:id/units', authenticate, authorize(...HIERARCHY_ROLES), async (req, res, next) => {
  try {
    const units = await prisma.organizationUnit.findMany({
      where: { organizationId: req.params.id },
      orderBy: [{ hierarchyLevel: 'asc' }, { name: 'asc' }]
    })
    res.json({ organizationUnits: units })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/organizations/:orgId/units/:unitId
router.patch('/:orgId/units/:unitId', authenticate, authorize('SUPER_ADMIN', 'ORG_ADMIN', 'REGIONAL_ADMIN', 'DISTRICT_ADMIN'), async (req, res, next) => {
  try {
    const { name, unitType, hierarchyLevel, region, city, status, parentUnitId } = req.body
    const unit = await prisma.organizationUnit.update({
      where: { id: req.params.unitId },
      data: {
        ...(name && { name }),
        ...(unitType && { unitType }),
        ...(hierarchyLevel !== undefined && { hierarchyLevel }),
        ...(region !== undefined && { region }),
        ...(city !== undefined && { city }),
        ...(status && { status }),
        ...(parentUnitId !== undefined && { parentUnitId: parentUnitId || null })
      }
    })
    res.json({ organizationUnit: unit })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/organizations/:orgId/units/:unitId
router.delete('/:orgId/units/:unitId', authenticate, authorize('SUPER_ADMIN', 'ORG_ADMIN'), async (req, res, next) => {
  try {
    await prisma.organizationUnit.delete({ where: { id: req.params.unitId } })
    res.json({ message: 'Organization unit deleted' })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/organizations/facilities/:facilityId/attach — attach a facility to an org/unit
router.patch('/facilities/:facilityId/attach', authenticate, authorize('SUPER_ADMIN', 'ORG_ADMIN', 'REGIONAL_ADMIN', 'DISTRICT_ADMIN'), async (req, res, next) => {
  try {
    const { organizationId, organizationUnitId } = req.body
    const facility = await prisma.facility.update({
      where: { id: req.params.facilityId },
      data: {
        organizationId: organizationId || null,
        organizationUnitId: organizationUnitId || null
      }
    })
    await prisma.auditLog.create({
      data: {
        organizationId: organizationId || null,
        organizationUnitId: organizationUnitId || null,
        action: 'FACILITY_ATTACHED_TO_ORG',
        actorId: req.user.id,
        targetId: facility.id
      }
    })
    res.json({ facility })
  } catch (error) {
    next(error)
  }
})

// ─── Staff assignments ─────────────────────────────────────────────────────────

// POST /api/organizations/:id/staff-assignments — assign a staff member a scoped role
router.post('/:id/staff-assignments', authenticate, authorize('SUPER_ADMIN', 'ORG_ADMIN'), validate(staffAssignmentSchema), async (req, res, next) => {
  try {
    if (!validateScopeBinding(req.body.assignmentScope, req.body)) {
      return res.status(400).json({ error: 'assignmentScope does not match the provided organization/unit/facility id.' })
    }
    const assignment = await prisma.staffAssignment.create({
      data: {
        ...req.body,
        assignedByStaffId: req.user.id
      }
    })
    await prisma.auditLog.create({
      data: {
        organizationId: req.params.id,
        action: 'STAFF_ASSIGNMENT_CREATED',
        actorId: req.user.id,
        targetId: assignment.staffProfileId,
        detail: `Assigned role ${assignment.assignmentRole} (${assignment.assignmentScope})`
      }
    })
    res.status(201).json({ staffAssignment: assignment })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/organizations/staff-assignments/:assignmentId/revoke
router.patch('/staff-assignments/:assignmentId/revoke', authenticate, authorize('SUPER_ADMIN', 'ORG_ADMIN'), async (req, res, next) => {
  try {
    const assignment = await prisma.staffAssignment.update({
      where: { id: req.params.assignmentId },
      data: { status: 'revoked', endAt: new Date() }
    })
    res.json({ staffAssignment: assignment })
  } catch (error) {
    next(error)
  }
})

module.exports = router
