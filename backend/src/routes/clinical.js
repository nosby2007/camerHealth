// ─── CameroHealth — Clinical Routes (Visits, Labs, Imaging, Medications) ─────
const { Router } = require('express')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { authenticate } = require('../middleware/auth')
const { validate } = require('../middleware/validate')

const router = Router()

// ─── Schemas ────────────────────────────────────────────────────────────────
const visitSchema = z.object({
  patientId:         z.string().uuid(),
  encounterType:     z.string().min(1),
  chiefComplaint:    z.string().optional(),
  triageLevel:       z.string().optional(),
  severity:          z.string().optional(),
  clinicalStatus:    z.string().optional(),
  disease:           z.string().optional(),
  symptoms:          z.array(z.string()).optional(),
  symptomText:       z.string().optional(),
  diagnosis:         z.string().optional(),
  labResults:        z.string().optional(),
  imagingNotes:      z.string().optional(),
  prescription:      z.string().optional(),
  treatmentPlan:     z.string().optional(),
  notes:             z.string().optional(),
  pastHistory:       z.record(z.string()).optional(),
  physicalExam:      z.record(z.string()).optional(),
  vitals:            z.record(z.string()).optional(),
  conclusion:        z.string().optional(),
  admissionWard:     z.string().optional(),
  admissionReason:   z.string().optional(),
  referralTarget:    z.string().optional(),
  attendingDoctorId: z.string().uuid().optional()
})

const labOrderSchema = z.object({
  patientId: z.string().uuid(),
  test: z.string().min(1),
  priority: z.string().optional(),
  notes: z.string().optional()
})

const imagingOrderSchema = z.object({
  patientId: z.string().uuid(),
  exam: z.string().min(1),
  priority: z.string().optional(),
  notes: z.string().optional()
})

const medicationSchema = z.object({
  patientId: z.string().uuid(),
  drug: z.string().min(1),
  dose: z.string().min(1),
  frequency: z.string().min(1),
  route: z.string().optional(),
  duration: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  notes: z.string().optional(),
// ── Pharmacy workflow fields (may be set on create) ────────────────────────
  dispensingStatus: z.string().nullable().optional(),
  paymentStatus: z.string().nullable().optional(),
  inStock: z.boolean().nullable().optional(),
  qtyDispensed: z.number().int().nullable().optional(),
  dispensedBy: z.string().nullable().optional(),
  dispensedAt: z.string().nullable().optional(),
  pharmacistNotes: z.string().nullable().optional()
})

// ─── VISITS ─────────────────────────────────────────────────────────────────
router.get('/visits', authenticate, async (req, res, next) => {
  try {
    const visits = await prisma.visit.findMany({
      where: { facilityId: req.user.facilityId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    res.json(visits)
  } catch (error) {
    next(error)
  }
})

router.post('/visits', authenticate, validate(visitSchema), async (req, res, next) => {
  try {
    const visit = await prisma.visit.create({
      data: {
        patientId:         req.body.patientId,
        facilityId:        req.user.facilityId,
        encounterType:     req.body.encounterType,
        chiefComplaint:    req.body.chiefComplaint    || null,
        triageLevel:       req.body.triageLevel       || null,
        severity:          req.body.severity          || null,
        clinicalStatus:    req.body.clinicalStatus    || null,
        disease:           req.body.disease           || null,
        symptoms:          req.body.symptoms          || [],
        symptomText:       req.body.symptomText       || null,
        diagnosis:         req.body.diagnosis         || null,
        labResults:        req.body.labResults        || null,
        imagingNotes:      req.body.imagingNotes      || null,
        prescription:      req.body.prescription      || null,
        treatmentPlan:     req.body.treatmentPlan     || null,
        notes:             req.body.notes             || null,
        pastHistory:       req.body.pastHistory       || null,
        physicalExam:      req.body.physicalExam      || null,
        vitals:            req.body.vitals            || null,
        conclusion:        req.body.conclusion        || null,
        admissionWard:     req.body.admissionWard     || null,
        admissionReason:   req.body.admissionReason   || null,
        referralTarget:    req.body.referralTarget    || null,
        attendingDoctorId: req.body.attendingDoctorId || null,
        recordedById:      req.user.id
      }
    })
    res.status(201).json(visit)
  } catch (error) {
    next(error)
  }
})

// ─── LAB ORDERS ─────────────────────────────────────────────────────────────
router.get('/lab-orders', authenticate, async (req, res, next) => {
  try {
    const orders = await prisma.labOrder.findMany({
      where: { facilityId: req.user.facilityId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true } }
      },
      orderBy: { requestedAt: 'desc' },
      take: 100
    })
    res.json(orders)
  } catch (error) {
    next(error)
  }
})

router.post('/lab-orders', authenticate, validate(labOrderSchema), async (req, res, next) => {
  try {
    const order = await prisma.labOrder.create({
      data: {
        patientId: req.body.patientId,
        facilityId: req.user.facilityId,
        test: req.body.test,
        priority: req.body.priority || 'Routine',
        notes: req.body.notes || null,
        requestedById: req.user.id
      }
    })
    res.status(201).json(order)
  } catch (error) {
    next(error)
  }
})

router.patch('/lab-orders/:id', authenticate, async (req, res, next) => {
  try {
    const { status, result } = req.body
    const order = await prisma.labOrder.findFirst({
      where: { id: req.params.id, facilityId: req.user.facilityId }
    })
    if (!order) return res.status(404).json({ error: 'Lab order not found' })

    const updated = await prisma.labOrder.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(result !== undefined && { result }),
        ...(status === 'Completed' && { completedById: req.user.id, completedAt: new Date() })
      }
    })
    res.json(updated)
  } catch (error) {
    next(error)
  }
})

// ─── IMAGING ORDERS ─────────────────────────────────────────────────────────
router.get('/imaging-orders', authenticate, async (req, res, next) => {
  try {
    const orders = await prisma.imagingOrder.findMany({
      where: { facilityId: req.user.facilityId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true } }
      },
      orderBy: { requestedAt: 'desc' },
      take: 100
    })
    res.json(orders)
  } catch (error) {
    next(error)
  }
})

router.post('/imaging-orders', authenticate, validate(imagingOrderSchema), async (req, res, next) => {
  try {
    const order = await prisma.imagingOrder.create({
      data: {
        patientId: req.body.patientId,
        facilityId: req.user.facilityId,
        exam: req.body.exam,
        priority: req.body.priority || 'Routine',
        notes: req.body.notes || null,
        requestedById: req.user.id
      }
    })
    res.status(201).json(order)
  } catch (error) {
    next(error)
  }
})

router.patch('/imaging-orders/:id', authenticate, async (req, res, next) => {
  try {
    const {
      status,
      result,
      fileBase64,
      imageName,
      imageMimeType,
      imageUploadedAt,
      imageUploadedById
    } = req.body

    const order = await prisma.imagingOrder.findFirst({
      where: { id: req.params.id, facilityId: req.user.facilityId }
    })
    if (!order) return res.status(404).json({ error: 'Imaging order not found' })

    // ── Build the update payload ──────────────────────────────────────────────
    // Status/result updates are sent alone. Image fields are only touched when
    // a file is actually being uploaded, so a simple status change never sends
    // image columns (which may not exist in an older Prisma client / DB).
    const data = {}
    if (status) data.status = status
    if (result !== undefined) data.result = result
    if (status === 'Completed') {
      data.completedById = req.user.id
      data.completedAt = new Date()
    }

    // ── File upload (only when a file is provided) ────────────────────────────
    if (fileBase64) {
      const { getSupabaseAdminClient, ensureStorageBucket } = require('../lib/supabase')
      const bucket = process.env.SUPABASE_STORAGE_BUCKET
      if (!bucket) {
        return res.status(500).json({ error: 'SUPABASE_STORAGE_BUCKET is not configured' })
      }
      await ensureStorageBucket(bucket)

      const finalName = imageName || order.imageName || 'imaging-file'
      const uploadPath = `${req.params.id}/${Date.now()}_${finalName}`
      const supabase = getSupabaseAdminClient()
      const { error: uploadError } = await supabase.storage.from(bucket).upload(uploadPath, Buffer.from(fileBase64, 'base64'), {
        contentType: imageMimeType || 'application/octet-stream',
        upsert: false
      })
      if (uploadError) throw uploadError

      const { data: signedData, error: signedError } = await supabase.storage.from(bucket).createSignedUrl(uploadPath, 60 * 60 * 24)
      if (signedError) throw signedError

      data.imageUrl = signedData?.signedURL || signedData?.signedUrl || ''
      data.imagePath = uploadPath
      data.imageName = finalName
      data.imageMimeType = imageMimeType || 'application/octet-stream'
      data.imageUploadedAt = new Date()
      data.imageUploadedById = imageUploadedById || req.user.id
    }

    const updated = await prisma.imagingOrder.update({
      where: { id: req.params.id },
      data
    })
    res.json(updated)
  } catch (error) {
    next(error)
  }
})

// ─── MEDICATIONS ────────────────────────────────────────────────────────────
router.get('/medications', authenticate, async (req, res, next) => {
  try {
    const meds = await prisma.medication.findMany({
      where: { facilityId: req.user.facilityId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true } }
      },
      orderBy: { prescribedAt: 'desc' },
      take: 100
    })
    res.json(meds)
  } catch (error) {
    next(error)
  }
})

router.post('/medications', authenticate, validate(medicationSchema), async (req, res, next) => {
  try {
    const med = await prisma.medication.create({
      data: {
        patientId: req.body.patientId,
        facilityId: req.user.facilityId,
        drug: req.body.drug,
        dose: req.body.dose,
        frequency: req.body.frequency,
        route: req.body.route || null,
        duration: req.body.duration || null,
        quantity: req.body.quantity || 1,
        notes: req.body.notes || null,
        // ── Pharmacy workflow fields ──────────────────────────────────────────
        dispensingStatus: req.body.dispensingStatus || 'Pending',
        paymentStatus: req.body.paymentStatus || 'Unpaid',
        inStock: req.body.inStock !== undefined ? req.body.inStock : null,
        qtyDispensed: req.body.qtyDispensed || null,
        dispensedBy: req.body.dispensedBy || null,
        dispensedAt: req.body.dispensedAt ? new Date(req.body.dispensedAt) : null,
        pharmacistNotes: req.body.pharmacistNotes || null,
        prescribedById: req.user.id
      }
    })
    res.status(201).json(med)
  } catch (error) {
    next(error)
  }
})

router.patch('/medications/:id', authenticate, async (req, res, next) => {
  try {
    const {
      status,
      dispensingStatus,
      paymentStatus,
      inStock,
      qtyDispensed,
      dispensedBy,
      dispensedAt,
      pharmacistNotes
    } = req.body
    const med = await prisma.medication.findFirst({
      where: { id: req.params.id, facilityId: req.user.facilityId }
    })
    if (!med) return res.status(404).json({ error: 'Medication not found' })

    const data = {}
    if (status) data.status = status
    if (dispensingStatus) data.dispensingStatus = dispensingStatus
    if (paymentStatus) data.paymentStatus = paymentStatus
    if (inStock !== undefined) data.inStock = inStock
    if (qtyDispensed !== undefined && qtyDispensed !== null) data.qtyDispensed = qtyDispensed
    if (dispensedBy) data.dispensedBy = dispensedBy
    if (dispensedAt) data.dispensedAt = new Date(dispensedAt)
    if (pharmacistNotes !== undefined) data.pharmacistNotes = pharmacistNotes

    const updated = await prisma.medication.update({
      where: { id: req.params.id },
      data
    })
    res.json(updated)
  } catch (error) {
    next(error)
  }
})

module.exports = router
