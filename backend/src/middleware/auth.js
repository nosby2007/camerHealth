// ─── CameroHealth — JWT Authentication Middleware ───────────────────────────
const { verifyToken } = require('../lib/jwt')
const prisma = require('../lib/prisma')

/**
 * Authenticate a request via JWT Bearer token.
 * Attaches `req.user` with staff profile info on success.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Provide a valid Bearer token.' })
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)

    // Verify staff still exists and is active
    const staff = await prisma.staffProfile.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        staffCode: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        facilityId: true,
        department: true,
        service: true
      }
    })

    if (!staff) {
      return res.status(401).json({ error: 'Staff account not found.' })
    }

    if (staff.status !== 'active') {
      return res.status(403).json({ error: 'Staff account is inactive. Contact an administrator.' })
    }

    req.user = {
      id: staff.id,
      staffCode: staff.staffCode,
      fullName: staff.fullName,
      email: staff.email,
      role: staff.role,
      facilityId: staff.facilityId,
      department: staff.department,
      service: staff.service
    }

    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token.' })
    }
    next(error)
  }
}

/**
 * Authorize based on roles. Must be used AFTER `authenticate`.
 * @param  {...string} roles - Allowed roles (e.g. 'ADMIN', 'DOCTOR')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
      })
    }

    next()
  }
}

/**
 * Reject any caller-supplied facility that differs from the authenticated
 * staff profile. Route queries must still use req.user.facilityId.
 */
function facilityScoped(req, res, next) {
  const requestFacilityId = req.headers['x-facility-id'] || req.params.facilityId || req.body?.facilityId

  if (requestFacilityId && requestFacilityId !== req.user.facilityId) {
    return res.status(403).json({ error: 'Cross-facility access is not permitted.' })
  }

  next()
}

module.exports = {
  authenticate,
  authorize,
  facilityScoped
}
