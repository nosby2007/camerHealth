// ─── CameroHealth — Audit Log Routes ─────────────────────────────────────────
const { Router } = require('express')
const prisma = require('../lib/prisma')
const { authenticate, authorize } = require('../middleware/auth')

const router = Router()

// GET /api/audit — Fetch audit log for this facility (admin only)
router.get('/', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1
    const limit = parseInt(req.query.limit) || 50
    const skip  = (page - 1) * limit

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { facilityId: req.user.facilityId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          facility: { select: { code: true, name: true } }
        }
      }),
      prisma.auditLog.count({ where: { facilityId: req.user.facilityId } })
    ])

    // Normalise the shape expected by the frontend
    const formatted = logs.map(log => ({
      id:        log.id,
      action:    log.action,
      actor:     log.actorId,   // frontend resolves name via staff list
      detail:    log.detail || '',
      ipAddress: log.ipAddress || '',
      timestamp: log.createdAt,
      facilityId: log.facilityId
    }))

    res.json({ logs: formatted, total, page, pages: Math.ceil(total / limit) })
  } catch (error) {
    next(error)
  }
})

module.exports = router
