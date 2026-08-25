const prisma = require('./prisma')

function requireFacilityId(req) {
  const facilityId = req.user?.facilityId
  if (!facilityId) {
    const error = new Error('Authenticated staff account is not assigned to a facility.')
    error.status = 403
    throw error
  }
  return facilityId
}

function patientIdentifierWhere(identifier, facilityId) {
  return {
    facilityId,
    OR: [
      { id: identifier },
      { mrn: identifier },
      { externalId: identifier }
    ]
  }
}

async function findPatientForFacility(identifier, facilityId, options = {}) {
  return prisma.patient.findFirst({
    ...options,
    where: patientIdentifierWhere(identifier, facilityId)
  })
}

async function requirePatientForFacility(identifier, facilityId, options = {}) {
  const patient = await findPatientForFacility(identifier, facilityId, options)
  if (!patient) {
    const error = new Error('Patient not found')
    error.status = 404
    throw error
  }
  return patient
}

module.exports = {
  requireFacilityId,
  patientIdentifierWhere,
  findPatientForFacility,
  requirePatientForFacility
}
