// ─── CameroHealth — Auth Routes ─────────────────────────────────────────────
const { Router } = require('express')
const bcrypt = require('bcryptjs')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { signToken } = require('../lib/jwt')
const { validate } = require('../middleware/validate')
const { authenticate } = require('../middleware/auth')
const { resolveEffectiveRole } = require('../lib/orgHierarchy')

const router = Router()

// ─── Zod Schemas ────────────────────────────────────────────────────────────
const registerSchema = z.object({
  facilityName: z.string().min(1, 'Facility name is required'),
  facilityCode: z.string().min(2, 'Facility code must be at least 2 characters').max(20),
  region: z.string().min(1, 'Region is required'),
  city: z.string().min(1, 'City is required'),
  quarter: z.string().optional(),
  facilityEmail: z.string().email('Valid facility email is required'),
  facilityPhone: z.string().optional(),
  adminFullName: z.string().min(1, 'Admin full name is required'),
  adminEmail: z.string().email('Valid admin email is required'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters')
})

const loginSchema = z.object({
  email: z.string().optional(),
  staffCode: z.string().optional(),
  loginInput: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
  facilityId: z.string().optional()
})

// ─── POST /api/auth/register (Register a new facility with its admin) ──────
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const {
      facilityName, facilityCode, region, city, quarter,
      facilityEmail, facilityPhone,
      adminFullName, adminEmail, adminPassword
    } = req.body

    // Check if facility code or email already exists
    const existingFacility = await prisma.facility.findFirst({
      where: {
        OR: [
          { code: facilityCode.toUpperCase() },
          { email: facilityEmail.toLowerCase() }
        ]
      }
    })
    if (existingFacility) {
      return res.status(409).json({
        error: 'A facility with this code or email already exists.'
      })
    }

    // Hash admin password
    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(adminPassword, salt)

    // Create facility and admin in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const facility = await tx.facility.create({
        data: {
          code: facilityCode.toUpperCase(),
          name: facilityName,
          region,
          city,
          quarter: quarter || '',
          email: facilityEmail.toLowerCase(),
          phone: facilityPhone || null,
          status: 'active'
        }
      })

      const adminStaffCode = `${facilityCode.toUpperCase()}-ADM001`

      const staff = await tx.staffProfile.create({
        data: {
          staffCode: adminStaffCode,
          fullName: adminFullName,
          email: adminEmail.toLowerCase(),
          role: 'ADMIN',
          passwordHash,
          facilityId: facility.id,
          status: 'active'
        }
      })

      // Log audit entry
      await tx.auditLog.create({
        data: {
          facilityId: facility.id,
          action: 'FACILITY_REGISTERED',
          actorId: staff.id,
          detail: `Facility "${facilityName}" registered. Admin: ${adminFullName} (${adminStaffCode})`
        }
      })

      return { facility, staff }
    }, { maxWait: 10000, timeout: 20000 })

    // Generate JWT for the admin
    const token = signToken({
      id: result.staff.id,
      staffCode: result.staff.staffCode,
      role: result.staff.role,
      facilityId: result.facility.id
    })

    res.status(201).json({
      message: 'Facility registered successfully',
      facility: {
        id: result.facility.id,
        code: result.facility.code,
        name: result.facility.name,
        region: result.facility.region
      },
      staff: {
        id: result.staff.id,
        staffCode: result.staff.staffCode,
        fullName: result.staff.fullName,
        email: result.staff.email,
        role: result.staff.role
      },
      token
    })
  } catch (error) {
    next(error)
  }
})

// ─── POST /api/auth/login (Authenticate staff by email or staffCode) ───────
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, staffCode, loginInput, password, facilityId } = req.body

    const identifier = (loginInput || email || staffCode || '').trim()

    if (!identifier) {
      return res.status(400).json({ error: 'Staff ID or Email is required.' })
    }

    const isEmail = identifier.includes('@')
    // Exact match only. A previous `staffCode: { endsWith }` fallback let a
    // short suffix like "ADM001" or "NUR001" match the first staff row with
    // that suffix in ANY facility (staffCode is `<FACILITY_CODE>-<ROLE>001`,
    // so every facility's admin ends in "-ADM001") — a real cross-facility
    // and cross-role authentication bypass, not just a UX shortcut.
    const whereFilter = isEmail
      ? { email: identifier.toLowerCase() }
      : { staffCode: identifier.toUpperCase() }

    const staff = await prisma.staffProfile.findFirst({
      where: whereFilter,
      include: {
        facility: {
          select: { id: true, code: true, name: true, region: true, city: true }
        }
      }
    })

    if (!staff) {
      return res.status(401).json({ error: 'Invalid credentials.' })
    }

    if (staff.status !== 'active') {
      return res.status(403).json({ error: 'Account is inactive. Contact an administrator.' })
    }

    if (!staff.passwordHash) {
      return res.status(401).json({ error: 'This account uses external authentication.' })
    }

    const passwordValid = await bcrypt.compare(password, staff.passwordHash)
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials.' })
    }

    // Update last login
    await prisma.staffProfile.update({
      where: { id: staff.id },
      data: { lastLogin: new Date() }
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        facilityId: staff.facilityId,
        action: 'LOGIN',
        actorId: staff.id,
        detail: `Staff ${staff.fullName} (${staff.staffCode}) logged in`
      }
    })

    const effectiveRole = await resolveEffectiveRole(staff.id, staff.role)

    const token = signToken({
      id: staff.id,
      staffCode: staff.staffCode,
      role: effectiveRole,
      facilityId: staff.facilityId
    })

    res.json({
      message: 'Login successful',
      token,
      staffProfile: {
        id: staff.id,
        staffCode: staff.staffCode,
        fullName: staff.fullName,
        email: staff.email,
        role: effectiveRole,
        facilityId: staff.facilityId,
        department: staff.department,
        service: staff.service
      },
      facility: staff.facility
    })
  } catch (error) {
    next(error)
  }
})

// ─── GET /api/auth/me (Get current user profile) ───────────────────────────
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const staff = await prisma.staffProfile.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        staffCode: true,
        fullName: true,
        email: true,
        role: true,
        department: true,
        service: true,
        facilityId: true,
        status: true,
        lastLogin: true,
        createdAt: true
      }
    })

    const facility = await prisma.facility.findUnique({
      where: { id: req.user.facilityId },
      select: {
        id: true,
        code: true,
        name: true,
        region: true,
        city: true
      }
    })

    // req.user.role is already the effective role (authenticate middleware
    // resolves any active StaffAssignment) — reflect that here too, since
    // `staff.role` alone would only show the raw StaffProfile column.
    res.json({ staff: { ...staff, role: req.user.role }, facility })
  } catch (error) {
    next(error)
  }
})

module.exports = router
