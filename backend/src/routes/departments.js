// ─── CameroHealth — Department & Ward Routes ─────────────────────────────────
const { Router } = require('express')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { authenticate, authorize } = require('../middleware/auth')
const { validate } = require('../middleware/validate')

const router = Router()

const deptSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  headOfDepartment: z.string().nullable().optional(),
  status: z.string().optional(),
  sortOrder: z.number().optional()
})

const wardSchema = z.object({
  name: z.string().min(1),
  beds: z.number().optional(),
  status: z.string().optional(),
  sortOrder: z.number().optional()
})

// GET /api/departments — All departments with their wards for this facility
router.get('/', authenticate, async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      where: { facilityId: req.user.facilityId },
      include: { wards: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' }
    })
    res.json({ departments })
  } catch (error) {
    next(error)
  }
})

// POST /api/departments — Create a new department
router.post('/', authenticate, authorize('ADMIN'), validate(deptSchema), async (req, res, next) => {
  try {
    const dept = await prisma.department.create({
      data: {
        facilityId: req.user.facilityId,
        code: req.body.code.toUpperCase(),
        name: req.body.name,
        headOfDepartment: req.body.headOfDepartment || null,
        status: req.body.status || 'Active',
        sortOrder: req.body.sortOrder || 0
      },
      include: { wards: true }
    })
    await prisma.auditLog.create({
      data: { facilityId: req.user.facilityId, action: 'DEPARTMENT_CREATED', actorId: req.user.id, detail: `Department "${dept.name}" (${dept.code}) created` }
    })
    res.status(201).json({ department: dept })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/departments/:id — Update a department
router.patch('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { name, headOfDepartment, status, sortOrder } = req.body
    const dept = await prisma.department.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(headOfDepartment !== undefined && { headOfDepartment }),
        ...(status && { status }),
        ...(sortOrder !== undefined && { sortOrder })
      },
      include: { wards: { orderBy: { sortOrder: 'asc' } } }
    })
    res.json({ department: dept })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/departments/:id — Delete a department (and its wards via cascade)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.department.delete({ where: { id: req.params.id } })
    res.json({ message: 'Department deleted' })
  } catch (error) {
    next(error)
  }
})

// POST /api/departments/:id/wards — Add a ward to a department
router.post('/:id/wards', authenticate, authorize('ADMIN'), validate(wardSchema), async (req, res, next) => {
  try {
    const ward = await prisma.ward.create({
      data: {
        departmentId: req.params.id,
        name: req.body.name,
        beds: req.body.beds || 0,
        status: req.body.status || 'Active',
        sortOrder: req.body.sortOrder || 0
      }
    })
    res.status(201).json({ ward })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/departments/:deptId/wards/:wardId — Update a ward
router.patch('/:deptId/wards/:wardId', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { name, beds, status, sortOrder } = req.body
    const ward = await prisma.ward.update({
      where: { id: req.params.wardId },
      data: {
        ...(name && { name }),
        ...(beds !== undefined && { beds }),
        ...(status && { status }),
        ...(sortOrder !== undefined && { sortOrder })
      }
    })
    res.json({ ward })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/departments/:deptId/wards/:wardId — Delete a ward
router.delete('/:deptId/wards/:wardId', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.ward.delete({ where: { id: req.params.wardId } })
    res.json({ message: 'Ward deleted' })
  } catch (error) {
    next(error)
  }
})

module.exports = router
