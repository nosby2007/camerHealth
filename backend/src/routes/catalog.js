// ─── CameroHealth — Price Catalog Routes ──────────────────────────────────────
const { Router } = require('express')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { authenticate, authorize } = require('../middleware/auth')
const { validate } = require('../middleware/validate')

const router = Router()

const catalogItemSchema = z.object({
  section: z.string().min(1),
  category: z.string().min(1),
  name: z.string().min(1),
  unitPrice: z.number().min(0),
  costPrice: z.number().optional().nullable(),
  minPrice: z.number().optional().nullable(),
  maxPrice: z.number().optional().nullable(),
  department: z.string().optional().nullable(),
  ward: z.string().optional().nullable(),
  aliases: z.array(z.string()).optional(),
  active: z.boolean().optional()
})

// GET /api/catalog — Get all catalog items for facility (grouped or flat)
router.get('/', async (req, res, next) => {
  try {
    let facilityId = null
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1]
        const jwt = require('jsonwebtoken')
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'camerohealth_secret_key_2026_dev')
        facilityId = decoded.facilityId
      } catch (e) {}
    }
    if (!facilityId && req.headers['x-facility-id']) {
      facilityId = req.headers['x-facility-id']
    }
    if (!facilityId) {
      const defaultFacility = await prisma.facility.findFirst({ where: { code: 'HGOPY' } })
      if (defaultFacility) facilityId = defaultFacility.id
    }

    const items = await prisma.priceCatalog.findMany({
      where: facilityId ? { facilityId } : {},
      orderBy: { name: 'asc' }
    })

    // Group by section
    const catalog = {
      consultations: [],
      labTests: [],
      imaging: [],
      drugs: [],
      hospitalization: [],
      nursingActs: [],
      supplies: [],
      procedures: []
    }

    items.forEach(item => {
      if (!catalog[item.section]) catalog[item.section] = []
      catalog[item.section].push(item)
    })

    res.json({ catalog, items })
  } catch (error) {
    next(error)
  }
})

// POST /api/catalog — Create a new catalog item (ADMIN only)
router.post('/', authenticate, authorize('ADMIN'), validate(catalogItemSchema), async (req, res, next) => {
  try {
    const data = req.body
    const item = await prisma.priceCatalog.create({
      data: {
        facilityId: req.user.facilityId,
        section: data.section,
        category: data.category,
        name: data.name,
        unitPrice: data.unitPrice,
        costPrice: data.costPrice || 0,
        minPrice: data.minPrice || null,
        maxPrice: data.maxPrice || null,
        department: data.department || null,
        ward: data.ward || null,
        aliases: data.aliases || [],
        active: data.active !== false
      }
    })

    await prisma.auditLog.create({
      data: {
        facilityId: req.user.facilityId,
        action: 'CATALOG_ITEM_CREATED',
        actorId: req.user.id,
        targetId: item.id,
        detail: `Catalog item created: ${item.name} (${item.section}) — ${item.unitPrice} XAF`
      }
    })

    res.status(201).json(item)
  } catch (error) {
    next(error)
  }
})

// PATCH /api/catalog/:id — Update price or status (ADMIN only)
router.patch('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { unitPrice, costPrice, minPrice, maxPrice, active, name } = req.body
    const existing = await prisma.priceCatalog.findFirst({
      where: { id: req.params.id, facilityId: req.user.facilityId }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Catalog item not found' })
    }

    const updated = await prisma.priceCatalog.update({
      where: { id: req.params.id },
      data: {
        ...(unitPrice !== undefined && { unitPrice: Number(unitPrice) }),
        ...(costPrice !== undefined && { costPrice: Number(costPrice) }),
        ...(minPrice !== undefined && { minPrice: Number(minPrice) }),
        ...(maxPrice !== undefined && { maxPrice: Number(maxPrice) }),
        ...(active !== undefined && { active: Boolean(active) }),
        ...(name && { name })
      }
    })

    await prisma.auditLog.create({
      data: {
        facilityId: req.user.facilityId,
        action: 'CATALOG_ITEM_UPDATED',
        actorId: req.user.id,
        targetId: updated.id,
        detail: `Catalog item ${updated.name} updated. UnitPrice: ${updated.unitPrice} XAF, Active: ${updated.active}`
      }
    })

    res.json(updated)
  } catch (error) {
    next(error)
  }
})

// DELETE /api/catalog/:id — Delete item (ADMIN only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const existing = await prisma.priceCatalog.findFirst({
      where: { id: req.params.id, facilityId: req.user.facilityId }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Catalog item not found' })
    }

    await prisma.priceCatalog.delete({ where: { id: req.params.id } })

    await prisma.auditLog.create({
      data: {
        facilityId: req.user.facilityId,
        action: 'CATALOG_ITEM_DELETED',
        actorId: req.user.id,
        targetId: req.params.id,
        detail: `Catalog item deleted: ${existing.name} (${existing.section})`
      }
    })

    res.json({ message: 'Catalog item deleted' })
  } catch (error) {
    next(error)
  }
})

module.exports = router
