// ─── CameroHealth — Flowsheet Routes (Cells, Columns, Corrections) ──────────
// Matches the contract already called by frontend/services/flowsheetApi.js.
const { Router } = require('express')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { authenticate } = require('../middleware/auth')
const { validate } = require('../middleware/validate')

const router = Router()

// ─── Schemas ────────────────────────────────────────────────────────────────
const cellSchema = z.object({
  id: z.string().min(1),
  rowId: z.string().min(1),
  columnId: z.string().min(1),
  patientId: z.string().uuid(),
  encounterId: z.string().optional(),
  value: z.any(),
  displayValue: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  documentedAt: z.string().optional()
})

const fileColumnSchema = z.object({
  patientId: z.string().uuid(),
  encounterId: z.string().optional(),
  filedAt: z.string().optional()
})

const correctionSchema = z.object({
  originalCellId: z.string().min(1),
  rowId: z.string().min(1),
  columnId: z.string().min(1),
  patientId: z.string().uuid(),
  encounterId: z.string().optional(),
  newValue: z.any(),
  reason: z.string().min(1),
  correctedAt: z.string().optional()
})

// ─── POST /cells — upsert a cell (idempotent by client-supplied id) ─────────
router.post('/cells', authenticate, validate(cellSchema), async (req, res, next) => {
  try {
    const { id, rowId, columnId, patientId, encounterId, value, displayValue, source, status, documentedAt } = req.body

    // The column is created client-side first; ensure it exists before the cell.
    await prisma.flowsheetColumn.upsert({
      where: { id: columnId },
      update: {},
      create: {
        id: columnId,
        patientId,
        encounterId: encounterId || null,
        facilityId: req.user.facilityId,
        status: 'draft'
      }
    })

    const cell = await prisma.flowsheetCell.upsert({
      where: { id },
      update: {
        value,
        displayValue: displayValue || null,
        source: source || null,
        status: status || 'draft',
        documentedAt: documentedAt ? new Date(documentedAt) : new Date(),
        documentedById: req.user.id
      },
      create: {
        id,
        rowId,
        columnId,
        patientId,
        encounterId: encounterId || null,
        facilityId: req.user.facilityId,
        value,
        displayValue: displayValue || null,
        source: source || null,
        status: status || 'draft',
        documentedAt: documentedAt ? new Date(documentedAt) : new Date(),
        documentedById: req.user.id
      }
    })

    res.status(201).json({ cell })
  } catch (error) {
    next(error)
  }
})

// ─── POST /columns/:columnId/file — mark a column filed ─────────────────────
router.post('/columns/:columnId/file', authenticate, validate(fileColumnSchema), async (req, res, next) => {
  try {
    const { columnId } = req.params
    const { patientId, encounterId, filedAt } = req.body

    const column = await prisma.flowsheetColumn.upsert({
      where: { id: columnId },
      update: {
        status: 'filed',
        filedAt: filedAt ? new Date(filedAt) : new Date(),
        filedById: req.user.id
      },
      create: {
        id: columnId,
        patientId,
        encounterId: encounterId || null,
        facilityId: req.user.facilityId,
        status: 'filed',
        filedAt: filedAt ? new Date(filedAt) : new Date(),
        filedById: req.user.id
      }
    })

    await prisma.auditLog.create({
      data: {
        facilityId: req.user.facilityId,
        action: 'FLOWSHEET_COLUMN_FILED',
        actorId: req.user.id,
        targetId: column.id,
        detail: `Flowsheet column filed for patient ${patientId}`
      }
    })

    res.json({ column })
  } catch (error) {
    next(error)
  }
})

// ─── GET /columns/:columnId/status ───────────────────────────────────────────
router.get('/columns/:columnId/status', authenticate, async (req, res, next) => {
  try {
    const { columnId } = req.params
    const column = await prisma.flowsheetColumn.findUnique({
      where: { id: columnId },
      include: { cells: true }
    })
    if (!column) {
      return res.status(404).json({ error: 'Flowsheet column not found' })
    }
    res.json({ column })
  } catch (error) {
    next(error)
  }
})

// ─── POST /corrections — never mutates the original cell ────────────────────
router.post('/corrections', authenticate, validate(correctionSchema), async (req, res, next) => {
  try {
    const { originalCellId, rowId, columnId, patientId, encounterId, newValue, reason, correctedAt } = req.body

    const correction = await prisma.flowsheetCorrection.create({
      data: {
        originalCellId,
        rowId,
        columnId,
        patientId,
        encounterId: encounterId || null,
        facilityId: req.user.facilityId,
        newValue,
        reason,
        correctedAt: correctedAt ? new Date(correctedAt) : new Date(),
        correctedById: req.user.id
      }
    })

    await prisma.auditLog.create({
      data: {
        facilityId: req.user.facilityId,
        action: 'FLOWSHEET_CELL_CORRECTED',
        actorId: req.user.id,
        targetId: originalCellId,
        detail: reason
      }
    })

    res.status(201).json({ correction })
  } catch (error) {
    next(error)
  }
})

module.exports = router
