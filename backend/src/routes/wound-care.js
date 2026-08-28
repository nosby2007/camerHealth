// ─── CameroHealth — Wound Care Routes ───────────────────────────────────────
const { Router } = require('express')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { authenticate } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { requirePatientForFacility } = require('../lib/tenant')

const router = Router()

// ─── Schemas ────────────────────────────────────────────────────────────────
// Field names match what the frontend already sends (frontend/store/nursing.js)
// — the mapping to Prisma column names happens inside the handlers, not here,
// so nothing on the Vuex/component side has to change.
const woundSchema = z.object({
  patientId: z.string().uuid(),
  woundType: z.string().optional(),
  type: z.string().optional(),
  anatomicalLocation: z.string().optional(),
  location: z.string().optional(),
  status: z.string().optional()
})

const woundUpdateSchema = z.object({
  woundType: z.string().optional(),
  type: z.string().optional(),
  anatomicalLocation: z.string().optional(),
  location: z.string().optional(),
  status: z.string().optional()
})

const assessmentSchema = z.object({
  lengthCm: z.number().nullable().optional(),
  widthCm: z.number().nullable().optional(),
  depthCm: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  assessedAt: z.string().optional()
})

const photoSchema = z.object({
  photoData: z.string().min(1), // base64 (with or without data: prefix)
  imageMimeType: z.string().optional(),
  imageName: z.string().optional(),
  timestamp: z.string().optional()
})

function surfaceAreaOf(a) {
  if (a.lengthCm == null || a.widthCm == null) return null
  return Math.round(a.lengthCm * a.widthCm * 100) / 100
}
function volumeOf(a) {
  if (a.lengthCm == null || a.widthCm == null || a.depthCm == null) return null
  return Math.round(a.lengthCm * a.widthCm * a.depthCm * 100) / 100
}

// ─── GET /patients/:patientId/wounds — wounds + latest assessment/photos ────
router.get('/patients/:patientId/wounds', authenticate, async (req, res, next) => {
  try {
    const wounds = await prisma.wound.findMany({
      where: { patientId: req.params.patientId, facilityId: req.user.facilityId },
      include: {
        assessments: { orderBy: { assessedAt: 'desc' } },
        photos: { orderBy: { takenAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ wounds })
  } catch (error) {
    next(error)
  }
})

// ─── POST /wounds — create a wound ───────────────────────────────────────────
router.post('/wounds', authenticate, validate(woundSchema), async (req, res, next) => {
  try {
    await requirePatientForFacility(req.body.patientId, req.user.facilityId, { select: { id: true } })
    const wound = await prisma.wound.create({
      data: {
        patientId: req.body.patientId,
        facilityId: req.user.facilityId,
        type: req.body.type || req.body.woundType || 'Unspecified',
        location: req.body.location || req.body.anatomicalLocation || 'Unspecified',
        status: req.body.status || 'active',
        createdById: req.user.id
      }
    })
    res.status(201).json({ wound })
  } catch (error) {
    next(error)
  }
})

// ─── PATCH /wounds/:id ────────────────────────────────────────────────────────
router.patch('/wounds/:id', authenticate, validate(woundUpdateSchema), async (req, res, next) => {
  try {
    const existing = await prisma.wound.findFirst({ where: { id: req.params.id, facilityId: req.user.facilityId } })
    if (!existing) return res.status(404).json({ error: 'Wound not found' })
    const { type, woundType, location, anatomicalLocation, status } = req.body
    const wound = await prisma.wound.update({
      where: { id: req.params.id },
      data: {
        ...((type || woundType) && { type: type || woundType }),
        ...((location || anatomicalLocation) && { location: location || anatomicalLocation }),
        ...(status && { status })
      }
    })
    res.json({ wound })
  } catch (error) {
    next(error)
  }
})

// ─── POST /wounds/:id/assessments — server computes area/volume/trend ───────
router.post('/wounds/:id/assessments', authenticate, validate(assessmentSchema), async (req, res, next) => {
  try {
    const wound = await prisma.wound.findFirst({ where: { id: req.params.id, facilityId: req.user.facilityId } })
    if (!wound) return res.status(404).json({ error: 'Wound not found' })

    const { lengthCm, widthCm, depthCm, notes, assessedAt } = req.body
    const surfaceArea = surfaceAreaOf({ lengthCm, widthCm })
    const volume = volumeOf({ lengthCm, widthCm, depthCm })

    const priorAssessment = await prisma.woundAssessment.findFirst({
      where: { woundId: wound.id },
      orderBy: { assessedAt: 'desc' }
    })
    const warningAreaIncreased = Boolean(
      priorAssessment && priorAssessment.surfaceArea != null && surfaceArea != null && surfaceArea > priorAssessment.surfaceArea
    )

    const assessment = await prisma.woundAssessment.create({
      data: {
        woundId: wound.id,
        patientId: wound.patientId,
        facilityId: req.user.facilityId,
        lengthCm: lengthCm ?? null,
        widthCm: widthCm ?? null,
        depthCm: depthCm ?? null,
        surfaceArea,
        volume,
        warningAreaIncreased,
        notes: notes || null,
        assessedAt: assessedAt ? new Date(assessedAt) : new Date(),
        assessedById: req.user.id
      }
    })
    res.status(201).json({ assessment })
  } catch (error) {
    next(error)
  }
})

// ─── POST /wounds/:id/photos — base64 upload to Supabase Storage ────────────
router.post('/wounds/:id/photos', authenticate, validate(photoSchema), async (req, res, next) => {
  try {
    const wound = await prisma.wound.findFirst({ where: { id: req.params.id, facilityId: req.user.facilityId } })
    if (!wound) return res.status(404).json({ error: 'Wound not found' })

    const bucket = process.env.SUPABASE_STORAGE_BUCKET
    if (!bucket) {
      return res.status(500).json({ error: 'SUPABASE_STORAGE_BUCKET is not configured' })
    }
    const { getSupabaseAdminClient, ensureStorageBucket } = require('../lib/supabase')
    await ensureStorageBucket(bucket)

    const { photoData, imageMimeType, imageName, timestamp } = req.body
    const base64Payload = photoData.includes(',') ? photoData.split(',')[1] : photoData
    const finalName = imageName || 'wound-photo.jpg'
    const uploadPath = `wounds/${wound.id}/${Date.now()}_${finalName}`

    const supabase = getSupabaseAdminClient()
    const { error: uploadError } = await supabase.storage.from(bucket).upload(uploadPath, Buffer.from(base64Payload, 'base64'), {
      contentType: imageMimeType || 'image/jpeg',
      upsert: false
    })
    if (uploadError) throw uploadError

    const { data: signedData, error: signedError } = await supabase.storage.from(bucket).createSignedUrl(uploadPath, 60 * 60 * 24 * 30)
    if (signedError) throw signedError

    const photo = await prisma.woundPhoto.create({
      data: {
        woundId: wound.id,
        patientId: wound.patientId,
        facilityId: req.user.facilityId,
        imageUrl: signedData?.signedURL || signedData?.signedUrl || '',
        imagePath: uploadPath,
        takenAt: timestamp ? new Date(timestamp) : new Date(),
        uploadedById: req.user.id
      }
    })
    res.status(201).json({ photo })
  } catch (error) {
    next(error)
  }
})

module.exports = router
