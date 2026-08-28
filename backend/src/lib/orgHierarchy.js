// ─── CameroHealth — Organization Hierarchy Helpers ──────────────────────────
// Depth is small and fixed (MINSANTE -> Region -> District -> Facility, <=4
// levels) and unit counts are modest (a few hundred), so a plain JS tree walk
// over one findMany() is simpler and fast enough — no recursive SQL needed.
const prisma = require('./prisma')

/**
 * Fetch every unit for an organization and index it by parent for traversal.
 */
async function loadUnitTree(organizationId) {
  const units = await prisma.organizationUnit.findMany({ where: { organizationId } })
  const byId = new Map(units.map(u => [u.id, u]))
  const childrenByParent = new Map()
  for (const unit of units) {
    const key = unit.parentUnitId || null
    if (!childrenByParent.has(key)) childrenByParent.set(key, [])
    childrenByParent.get(key).push(unit)
  }
  return { units, byId, childrenByParent }
}

/**
 * Collect a unit id and every descendant unit id beneath it.
 */
function collectDescendantUnitIds(rootUnitId, childrenByParent) {
  const ids = [rootUnitId]
  const stack = [rootUnitId]
  while (stack.length) {
    const current = stack.pop()
    const children = childrenByParent.get(current) || []
    for (const child of children) {
      ids.push(child.id)
      stack.push(child.id)
    }
  }
  return ids
}

/**
 * Resolve every facility id visible beneath a given organization unit
 * (the unit itself plus all descendant units), including facilities
 * attached directly to an ancestor unit at any depth.
 */
async function resolveFacilityIdsForUnit(unitId) {
  const unit = await prisma.organizationUnit.findUnique({ where: { id: unitId } })
  if (!unit) return []
  const { childrenByParent } = await loadUnitTree(unit.organizationId)
  const unitIds = collectDescendantUnitIds(unitId, childrenByParent)
  const facilities = await prisma.facility.findMany({
    where: { organizationUnitId: { in: unitIds } },
    select: { id: true }
  })
  return facilities.map(f => f.id)
}

/**
 * Resolve every facility id belonging to an organization at all (root scope).
 */
async function resolveFacilityIdsForOrganization(organizationId) {
  const facilities = await prisma.facility.findMany({
    where: { organizationId },
    select: { id: true }
  })
  return facilities.map(f => f.id)
}

/**
 * A staff member normally acts under their StaffProfile.role. If they hold an
 * active Phase 13 StaffAssignment (regional/district/org/platform admin —
 * roles that don't belong to a single facility), that assignment's role
 * takes over as their effective/acting role application-wide: it's how
 * `authorize()` on hierarchy routes and the frontend's role-based routing
 * recognize them, since neither reads StaffAssignment directly.
 */
async function resolveEffectiveRole(staffProfileId, fallbackRole) {
  const assignment = await prisma.staffAssignment.findFirst({
    where: { staffProfileId, status: 'active' },
    orderBy: { createdAt: 'desc' }
  })
  return assignment ? assignment.assignmentRole : fallbackRole
}

module.exports = {
  loadUnitTree,
  collectDescendantUnitIds,
  resolveFacilityIdsForUnit,
  resolveFacilityIdsForOrganization,
  resolveEffectiveRole
}
