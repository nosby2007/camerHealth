// ─── CameroHealth — Staff Routes ───────────────────────────────────────────
const { Router } = require('express')
const bcrypt = require('bcryptjs')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { authenticate, authorize } = require('../middleware/auth')
const { validate } = require('../middleware/validate')

const router = Router()

const createStaffSchema = z.object({
  staffCode: z.string().optional(),
  fullName: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1),
  password: z.string().min(8),
  department: z.string().nullable().optional(),
  service: z.string().nullable().optional(),
  specialty: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  phiScope: z.string().nullable().optional()
})

// GET /api/staff/providers — List active doctors/NPs at the user's facility,
// for assigning a provider to an appointment or a patient chart. Open to any
// authenticated staff (scheduling is done by reception/nursing, not just admins).
router.get('/providers', authenticate, async (req, res, next) => {
  try {
    const providers = await prisma.staffProfile.findMany({
      where: { facilityId: req.user.facilityId, role: { in: ['DOCTOR', 'NP'] }, status: 'active' },
      select: { id: true, fullName: true, role: true, specialty: true },
      orderBy: { fullName: 'asc' }
    })
    res.json(providers)
  } catch (error) {
    next(error)
  }
})

// GET /api/staff — List staff for the user's facility
router.get('/', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const staff = await prisma.staffProfile.findMany({
      where: { facilityId: req.user.facilityId },
      select: {
        id: true,
        staffCode: true,
        fullName: true,
        email: true,
        role: true,
        department: true,
        service: true,
        status: true,
        lastLogin: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(staff)
  } catch (error) {
    next(error)
  }
})

// POST /api/staff — Create a new staff account (ADMIN only)
router.post('/', authenticate, authorize('ADMIN'), validate(createStaffSchema), async (req, res, next) => {
  try {
    const { staffCode: customCode, fullName, email, role, password, department, service, specialty, phone } = req.body

    const facility = await prisma.facility.findUnique({ where: { id: req.user.facilityId } })
    const count = await prisma.staffProfile.count({ where: { facilityId: req.user.facilityId } })
    const staffCode = customCode || `${facility.code}-${role.substring(0, 3)}${String(count + 1).padStart(3, '0')}`

    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)

    const staff = await prisma.staffProfile.create({
      data: {
        staffCode,
        fullName,
        email: email.toLowerCase(),
        role,
        passwordHash,
        facilityId: req.user.facilityId,
        department: department || null,
        service: service || null,
        specialty: specialty || null,
        phone: phone || null,
        status: 'active'
      }
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        facilityId: req.user.facilityId,
        action: 'STAFF_CREATED',
        actorId: req.user.id,
        targetId: staff.id,
        detail: `Staff account created: ${fullName} (${staffCode}) - ${role}`
      }
    })

    res.status(201).json({
      id: staff.id,
      staffCode: staff.staffCode,
      fullName: staff.fullName,
      email: staff.email,
      role: staff.role
    })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/staff/:id — Update or deactivate staff
router.patch('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { status, department, service, role } = req.body

    const staff = await prisma.staffProfile.findFirst({
      where: { id: req.params.id, facilityId: req.user.facilityId }
    })
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' })
    }

    const updated = await prisma.staffProfile.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(department !== undefined && { department }),
        ...(service !== undefined && { service }),
        ...(role && { role })
      }
    })

    await prisma.auditLog.create({
      data: {
        facilityId: req.user.facilityId,
        action: status === 'inactive' ? 'STAFF_DEACTIVATED' : 'STAFF_UPDATED',
        actorId: req.user.id,
        targetId: updated.id,
        detail: `Staff ${updated.fullName} (${updated.staffCode}) updated. Status: ${updated.status}`
      }
    })

    res.json({ id: updated.id, status: updated.status })
  } catch (error) {
    next(error)
  }
})

module.exports = router
