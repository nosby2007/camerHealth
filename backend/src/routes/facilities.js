// ─── CameroHealth — Facility Routes ─────────────────────────────────────────
const { Router } = require('express')
const prisma = require('../lib/prisma')
const { authenticate, authorize, facilityScoped } = require('../middleware/auth')

const router = Router()

// GET /api/facilities — List facilities (public health officers, platform admin)
router.get('/', authenticate, authorize('ADMIN', 'PUBLIC_HEALTH_OFFICER', 'SUPER_ADMIN', 'ORG_ADMIN', 'REGIONAL_ADMIN', 'DISTRICT_ADMIN'), async (req, res, next) => {
  try {
    const facilities = await prisma.facility.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        region: true,
        city: true,
        status: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    })
    res.json(facilities)
  } catch (error) {
    next(error)
  }
})

// GET /api/facilities/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const facility = await prisma.facility.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            staffProfiles: true,
            patients: true
          }
        }
      }
    })
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' })
    }
    res.json(facility)
  } catch (error) {
    next(error)
  }
})

// PATCH /api/facilities/:id — Update facility info
router.patch('/:id', authenticate, authorize('ADMIN'), facilityScoped, async (req, res, next) => {
  try {
    const { name, region, city, quarter, phone } = req.body
    const facility = await prisma.facility.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(region && { region }),
        ...(city && { city }),
        ...(quarter !== undefined && { quarter }),
        ...(phone !== undefined && { phone })
      }
    })
    res.json(facility)
  } catch (error) {
    next(error)
  }
})

module.exports = router
