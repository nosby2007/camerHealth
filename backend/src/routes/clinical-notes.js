// ─── CameroHealth — Vitals & Clinical Notes Routes ──────────────────────────
const { Router } = require('express')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { authenticate, authorize } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { CLINICAL_WRITE_ROLES } = require('../lib/clinicalRoles')

const router = Router()

// ─── Schemas ────────────────────────────────────────────────────────────────
const vitalsSchema = z.object({
  patientId: z.string().uuid(),
  visitId: z.string().uuid().optional(),
  bp: z.string().optional(),
  hr: z.number().optional(),
  rr: z.number().optional(),
  temp: z.number().optional(),
  spo2: z.number().optional(),
  glucose: z.number().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  gcsE: z.number().optional(),
  gcsV: z.number().optional(),
  gcsM: z.number().optional(),
  pain: z.number().optional(),
  recordedAt: z.string().optional()
})

// The Nurse Command Center (frontend/store/nursing.js) files several more
// granular note types than the original nursing/medical/plan_of_care set —
// union both vocabularies rather than forcing every caller onto one.
const noteSchema = z.object({
  patientId: z.string().uuid(),
  encounterId: z.string().optional(),
  noteType: z.enum(['nursing', 'medical', 'plan_of_care', 'nursing_note', 'wound_note', 'progress_note', 'incident_note', 'provider_notification', 'discharge_note']),
  title: z.string().optional(),
  body: z.string().min(1),
  status: z.string().optional(),
  authorRole: z.string().optional(),
  // Full form data behind notes authored from a structured page (e.g. the
  // Medical Encounter form) — lets the exact original note be re-rendered
  // later (view/print), rather than only ever having the flattened summary.
  structuredData: z.record(z.any()).optional()
})

const noteUpdateSchema = z.object({
  title: z.string().optional(),
  body: z.string().min(1).optional(),
  status: z.string().optional()
})

const amendSchema = z.object({
  body: z.string().min(1)
})

// ─── Vitals ─────────────────────────────────────────────────────────────────

// POST /api/vitals — record a vital signs set
router.post('/vitals', authenticate, authorize(...CLINICAL_WRITE_ROLES), validate(vitalsSchema), async (req, res, next) => {
  try {
    const { patientId, visitId, recordedAt, ...vitals } = req.body
    const record = await prisma.vitalSigns.create({
      data: {
        patientId,
        facilityId: req.user.facilityId,
        visitId: visitId || null,
        ...vitals,
        recordedById: req.user.id,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date()
      }
    })
    res.status(201).json({ vitalSigns: record })
  } catch (error) {
    next(error)
  }
})

// GET /api/vitals?patientId=... — vitals history for a patient
router.get('/vitals', authenticate, async (req, res, next) => {
  try {
    const { patientId } = req.query
    if (!patientId) {
      return res.status(400).json({ error: 'patientId query parameter is required' })
    }
    const vitalSigns = await prisma.vitalSigns.findMany({
      where: { patientId, facilityId: req.user.facilityId },
      orderBy: { recordedAt: 'desc' }
    })
    res.json({ vitalSigns })
  } catch (error) {
    next(error)
  }
})

// ─── Clinical notes (nursing / medical / plan_of_care) ───────────────────────

// POST /api/clinical-notes — create a note
router.post('/clinical-notes', authenticate, authorize(...CLINICAL_WRITE_ROLES), validate(noteSchema), async (req, res, next) => {
  try {
    const { patientId, encounterId, noteType, title, body, status, authorRole, structuredData } = req.body
    const note = await prisma.clinicalNote.create({
      data: {
        patientId,
        facilityId: req.user.facilityId,
        encounterId: encounterId || null,
        noteType,
        title: title || null,
        body,
        structuredData: structuredData || null,
        authorRole: authorRole || req.user.role,
        status: status || 'filed',
        createdById: req.user.id
      }
    })
    await prisma.auditLog.create({
      data: {
        facilityId: req.user.facilityId,
        action: 'CLINICAL_NOTE_CREATED',
        actorId: req.user.id,
        targetId: note.id,
        detail: `${noteType} note filed for patient ${patientId}`
      }
    })
    res.status(201).json({ note })
  } catch (error) {
    next(error)
  }
})

// GET /api/clinical-notes?patientId=...&noteType=... — list notes
router.get('/clinical-notes', authenticate, async (req, res, next) => {
  try {
    const { patientId, noteType } = req.query
    if (!patientId) {
      return res.status(400).json({ error: 'patientId query parameter is required' })
    }
    const notes = await prisma.clinicalNote.findMany({
      where: {
        patientId,
        facilityId: req.user.facilityId,
        ...(noteType && { noteType })
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ notes })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/clinical-notes/:id — amend an unsigned note
router.patch('/clinical-notes/:id', authenticate, authorize(...CLINICAL_WRITE_ROLES), validate(noteUpdateSchema), async (req, res, next) => {
  try {
    const existing = await prisma.clinicalNote.findFirst({
      where: { id: req.params.id, facilityId: req.user.facilityId }
    })
    if (!existing) {
      return res.status(404).json({ error: 'Clinical note not found' })
    }
    if (existing.signedAt) {
      return res.status(409).json({ error: 'A signed note cannot be amended. File an addendum instead.' })
    }
    const { title, body, status } = req.body
    const note = await prisma.clinicalNote.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(body !== undefined && { body }),
        ...(status && { status })
      }
    })
    res.json({ note })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/clinical-notes/:id/sign — sign a note (immutable afterwards)
router.patch('/clinical-notes/:id/sign', authenticate, authorize(...CLINICAL_WRITE_ROLES), async (req, res, next) => {
  try {
    const existing = await prisma.clinicalNote.findFirst({
      where: { id: req.params.id, facilityId: req.user.facilityId }
    })
    if (!existing) {
      return res.status(404).json({ error: 'Clinical note not found' })
    }
    const note = await prisma.clinicalNote.update({
      where: { id: req.params.id },
      data: { status: 'signed', signedAt: new Date(), signedById: req.user.id }
    })
    await prisma.auditLog.create({
      data: {
        facilityId: req.user.facilityId,
        action: 'CLINICAL_NOTE_SIGNED',
        actorId: req.user.id,
        targetId: note.id
      }
    })
    res.json({ note })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/clinical-notes/:id/share — flag a note as shared with the care team
router.patch('/clinical-notes/:id/share', authenticate, authorize(...CLINICAL_WRITE_ROLES), async (req, res, next) => {
  try {
    const existing = await prisma.clinicalNote.findFirst({
      where: { id: req.params.id, facilityId: req.user.facilityId }
    })
    if (!existing) {
      return res.status(404).json({ error: 'Clinical note not found' })
    }
    if (existing.status === 'draft') {
      return res.status(409).json({ error: 'File the note before sharing it with the care team' })
    }
    const note = await prisma.clinicalNote.update({
      where: { id: req.params.id },
      data: { sharedWithCareTeam: true, sharedAt: new Date(), sharedById: req.user.id }
    })
    res.json({ note })
  } catch (error) {
    next(error)
  }
})

// POST /api/clinical-notes/:id/amend — attach an addendum to a note. A signed
// note's own body/title stay immutable (PATCH /:id 409s on a signed note),
// but an amendment can always be added — it does not alter the original.
router.post('/clinical-notes/:id/amend', authenticate, authorize(...CLINICAL_WRITE_ROLES), validate(amendSchema), async (req, res, next) => {
  try {
    const existing = await prisma.clinicalNote.findFirst({
      where: { id: req.params.id, facilityId: req.user.facilityId }
    })
    if (!existing) {
      return res.status(404).json({ error: 'Clinical note not found' })
    }
    const amendments = Array.isArray(existing.amendments) ? existing.amendments : []
    const note = await prisma.clinicalNote.update({
      where: { id: req.params.id },
      data: {
        status: existing.status === 'signed' ? 'amended' : existing.status,
        amendments: [...amendments, {
          body: req.body.body,
          actorId: req.user.id,
          actorName: req.user.fullName || req.user.staffCode,
          at: new Date().toISOString()
        }]
      }
    })
    res.json({ note })
  } catch (error) {
    next(error)
  }
})

module.exports = router
