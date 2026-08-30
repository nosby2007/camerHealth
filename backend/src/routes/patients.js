// ─── CameroHealth — Patient Routes ───────────────────────────────────────────
const { Router } = require('express')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { authenticate } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { requireFacilityId, patientIdentifierWhere } = require('../lib/tenant')

const router = Router()

// ─── MRN Generator ───────────────────────────────────────────────────────────
// Format: {FAC}-{YY}P-{NNNNN}
// Example: HGO-26P-00001  (facility short + 2-digit year + P + zero-padded seq)
async function generateMRN(facilityId, facilityCode) {
  const shortCode = (facilityCode || 'HGO').slice(0, 3).toUpperCase()
  const yy = String(new Date().getFullYear()).slice(-2)
  const prefix = `${shortCode}-${yy}P`

  // Count patients REGISTERED THIS YEAR at this facility for sequential numbering
  const yearStart = new Date(`20${yy}-01-01T00:00:00.000Z`)
  const count = await prisma.patient.count({
    where: {
      facilityId,
      createdAt: { gte: yearStart }
    }
  })
  const seq = String(count + 1).padStart(5, '0')
  return `${prefix}-${seq}`
}

const patientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  dob: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  surgicalHistory: z.string().optional(),
  familyHistory: z.string().optional(),
  age: z.any().optional(),
  patientStatus: z.string().optional(),
  externalId: z.string().optional(),
  patientType: z.string().optional(),
  paymentProfile: z.string().optional(),
  acuityLevel: z.string().optional(),
  departmentRouting: z.string().optional(),
  serviceRouting: z.string().optional(),
  specialtyRouting: z.string().optional(),
  visitReason: z.string().optional(),
  phiAccessBasis: z.string().optional(),
  consentStatus: z.string().optional(),
  insuranceProvider: z.string().optional(),
  policyNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  vitals: z.any().optional(),
  religion: z.string().optional(),
  occupation: z.string().optional(),
  parentGuardian: z.string().optional(),
  referredBy: z.string().optional(),
  referredDate: z.string().optional(),
  name: z.string().optional()
})

// Helper: format a patient record for the frontend
function formatPatient(p) {
  const meta = p.metadata || {}
  const age = p.dateOfBirth ? (new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()) : (meta.age || '?')
  const riskLevel = p.acuityLevel === 'Emergency' ? 'high'
    : p.acuityLevel === 'Urgent' ? 'medium'
    : 'low'

  return {
    id: p.id,
    mrn: p.mrn,
    facilityId: p.facilityId,
    name: `${p.firstName} ${p.lastName}`,
    displayName: `${p.firstName} ${p.lastName}`,
    firstName: p.firstName,
    middleName: p.middleName || '',
    lastName: p.lastName,
    dateOfBirth: p.dateOfBirth,
    dob: p.dateOfBirth,
    gender: p.gender,
    age,
    phone: p.phone || '',
    email: p.email || '',
    address: p.address || '',
    country: p.country || 'Cameroon',
    bloodType: p.bloodType || '',
    allergies: p.allergies || '',
    medicalHistory: p.medicalHistory || '',
    surgicalHistory: p.surgicalHistory || '',
    familyHistory: p.familyHistory || '',
    status: p.status,

    // Clinical routing
    patientStatus: p.patientStatus || 'New',
    externalId: p.externalId || '',
    patientType: p.patientType || 'Private',
    paymentProfile: p.paymentProfile || 'Cash',
    acuityLevel: p.acuityLevel || 'Routine',
    riskLevel,
    riskReasons: p.acuityLevel === 'Emergency' ? ['Emergency acuity'] : [],
    currentDepartment: p.departmentRouting || 'Registration',
    departmentRouting: p.departmentRouting || '',
    serviceRouting: p.serviceRouting || '',
    specialtyRouting: p.specialtyRouting || '',
    visitReason: p.visitReason || '',
    consentStatus: p.consentStatus || 'Pending',
    phiAccessBasis: p.phiAccessBasis || 'Treatment',

    // Discharge
    dischargedAt: p.dischargedAt,
    dischargeDisposition: p.dischargeDisposition || '',
    dischargeReason: p.dischargeReason || '',
    dischargedBy: p.dischargedBy || '',

    // Insurance & emergency
    insuranceProvider: p.insuranceProvider || '',
    policyNumber: p.policyNumber || '',
    emergencyContactName: p.emergencyContactName || '',
    emergencyContactRelationship: p.emergencyContactRelationship || '',
    emergencyContactPhone: p.emergencyContactPhone || '',

    // Extended fields from metadata
    vitals: meta.vitals || {},
    religion: meta.religion || '',
    occupation: meta.occupation || '',
    parentGuardian: meta.parentGuardian || '',
    referredBy: meta.referredBy || '',
    referredDate: meta.referredDate || '',

    // Workflow placeholders (populated by clinical store)
    openOrders: [],
    openTasks: [],
    pendingAdmission: null,

    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  }
}

// ─── GET /api/patients ─────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 100
    const search = req.query.search || ''
    const skip = (page - 1) * limit

    const facilityId = requireFacilityId(req)
    const where = { facilityId }

    if (search) {
      const searchFilter = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { mrn: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ]
      where.OR = searchFilter
    }

    const [rawPatients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.patient.count({ where })
    ])

    const patients = rawPatients.map(formatPatient)

    res.json({
      patients,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (error) {
    next(error)
  }
})

// ─── GET /api/patients/:id ─────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const facilityId = requireFacilityId(req)
    const patient = await prisma.patient.findFirst({
      where: patientIdentifierWhere(req.params.id, facilityId),
      include: {
        visits: { where: { facilityId }, orderBy: { createdAt: 'desc' }, take: 10 },
        labOrders: { where: { facilityId }, orderBy: { createdAt: 'desc' }, take: 10 },
        imagingOrders: { where: { facilityId }, orderBy: { createdAt: 'desc' }, take: 10 },
        medications: { where: { facilityId }, orderBy: { createdAt: 'desc' }, take: 10 },
        appointments: { where: { facilityId }, orderBy: { date: 'desc' }, take: 5 },
        invoices: { where: { facilityId }, orderBy: { createdAt: 'desc' }, take: 5 }
      }
    })
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' })
    }
    const formatted = formatPatient(patient)
    // Attach full clinical data
    formatted.visits = patient.visits
    formatted.labOrders = patient.labOrders
    formatted.imagingOrders = patient.imagingOrders
    formatted.medications = patient.medications
    formatted.appointments = patient.appointments
    formatted.invoices = patient.invoices
    formatted.openOrders = [
      ...patient.labOrders.filter(o => o.status === 'pending'),
      ...patient.imagingOrders.filter(o => o.status === 'pending')
    ]
    res.json(formatted)
  } catch (error) {
    next(error)
  }
})

// ─── POST /api/patients ────────────────────────────────────────────────────
router.post('/', authenticate, validate(patientSchema), async (req, res, next) => {
  try {
    const b = req.body
    const facilityId = requireFacilityId(req)
    const facility = await prisma.facility.findUnique({ where: { id: facilityId } })
    if (!facility) return res.status(403).json({ error: 'Assigned facility not found' })
    const mrn = await generateMRN(facilityId, facility.code)

    const dobString = b.dateOfBirth || b.dob || null
    let validDob
    if (dobString) {
      const parsed = new Date(dobString)
      validDob = isNaN(parsed.getTime()) ? new Date('2000-01-01') : parsed
    } else if (b.age) {
      validDob = new Date(`${new Date().getFullYear() - Number(b.age)}-01-01`)
    } else {
      validDob = new Date('2000-01-01')
    }

    const patient = await prisma.patient.create({
      data: {
        mrn,
        firstName: b.firstName,
        middleName: b.middleName || null,
        lastName: b.lastName,
        dateOfBirth: validDob,
        gender: b.gender || 'Male',
        phone: b.phone || null,
        email: b.email || null,
        address: b.address || null,
        country: b.country || 'Cameroon',
        bloodType: b.bloodType || null,
        allergies: b.allergies || null,
        medicalHistory: b.medicalHistory || null,
        surgicalHistory: b.surgicalHistory || null,
        familyHistory: b.familyHistory || null,
        // Clinical intake
        patientStatus: b.patientStatus || 'New',
        externalId: b.externalId || null,
        patientType: b.patientType || 'Private',
        paymentProfile: b.paymentProfile || 'Cash',
        acuityLevel: b.acuityLevel || 'Routine',
        departmentRouting: b.departmentRouting || 'Registration',
        serviceRouting: b.serviceRouting || null,
        specialtyRouting: b.specialtyRouting || null,
        visitReason: b.visitReason || null,
        phiAccessBasis: b.phiAccessBasis || 'Treatment',
        consentStatus: b.consentStatus || 'Pending',
        // Insurance & emergency contact
        insuranceProvider: b.insuranceProvider || null,
        policyNumber: b.policyNumber || null,
        emergencyContactName: b.emergencyContactName || null,
        emergencyContactRelationship: b.emergencyContactRelationship || null,
        emergencyContactPhone: b.emergencyContactPhone || null,
        // Extended metadata
        metadata: {
          vitals: b.vitals || {},
          religion: b.religion || '',
          occupation: b.occupation || '',
          parentGuardian: b.parentGuardian || '',
          referredBy: b.referredBy || '',
          referredDate: b.referredDate || '',
          age: b.age || null
        },
        facilityId,
        createdById: req.user.id
      }
    })

    await prisma.auditLog.create({
      data: {
        facilityId,
        action: 'PATIENT_REGISTERED',
        actorId: req.user.id,
        targetId: patient.id,
        detail: `Patient ${patient.firstName} ${patient.lastName} registered — MRN: ${patient.mrn} | Dept: ${patient.departmentRouting} | Acuity: ${patient.acuityLevel}`
      }
    })

    res.status(201).json(formatPatient(patient))
  } catch (error) {
    next(error)
  }
})

// ─── PATCH /api/patients/:id ───────────────────────────────────────────────
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.patient.findFirst({
      where: { id: req.params.id, facilityId: req.user.facilityId }
    })
    if (!existing) {
      return res.status(404).json({ error: 'Patient not found' })
    }
    const b = req.body
    const updated = await prisma.patient.update({
      where: { id: req.params.id },
      data: {
        ...(b.firstName && { firstName: b.firstName }),
        ...(b.lastName && { lastName: b.lastName }),
        ...(b.middleName !== undefined && { middleName: b.middleName }),
        ...(b.phone !== undefined && { phone: b.phone }),
        ...(b.email !== undefined && { email: b.email }),
        ...(b.address !== undefined && { address: b.address }),
        ...(b.bloodType !== undefined && { bloodType: b.bloodType }),
        ...(b.allergies !== undefined && { allergies: b.allergies }),
        ...(b.departmentRouting !== undefined && { departmentRouting: b.departmentRouting }),
        ...(b.acuityLevel !== undefined && { acuityLevel: b.acuityLevel }),
        ...(b.status && { status: b.status }),
        ...(b.patientStatus !== undefined && { patientStatus: b.patientStatus }),
        ...(b.dischargedAt !== undefined && { dischargedAt: b.dischargedAt ? new Date(b.dischargedAt) : null }),
        ...(b.dischargeDisposition !== undefined && { dischargeDisposition: b.dischargeDisposition }),
        ...(b.dischargeReason !== undefined && { dischargeReason: b.dischargeReason }),
        ...(b.dischargedBy !== undefined && { dischargedBy: b.dischargedBy }),
        ...(b.metadata && { metadata: { ...((existing.metadata) || {}), ...b.metadata } })
      }
    })
    res.json(formatPatient(updated))
  } catch (error) {
    next(error)
  }
})

module.exports = router
