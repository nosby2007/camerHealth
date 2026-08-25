const READ_ONLY_ERROR = 'PATIENT_DISCHARGED_READ_ONLY'

function normalizePatientStatus(patient = {}) {
  return String(patient.patientStatus || patient.admissionStatus || '').trim().toLowerCase()
}

function isPatientReadOnly(patient) {
  if (!patient) return false
  const status = normalizePatientStatus(patient)
  const recordStatus = String(patient.recordStatus || '').trim().toLowerCase()
  return status === 'discharged' || recordStatus === 'inactive' || patient.active === false
}

function assertPatientWritable(patient) {
  if (isPatientReadOnly(patient)) {
    const error = new Error(READ_ONLY_ERROR)
    error.code = READ_ONLY_ERROR
    throw error
  }
  return true
}

function canPreviewRole(actualRole, environment = process.env.NODE_ENV) {
  return String(actualRole || '').toUpperCase() === 'ADMIN' && environment !== 'production'
}

module.exports = {
  READ_ONLY_ERROR,
  normalizePatientStatus,
  isPatientReadOnly,
  assertPatientWritable,
  canPreviewRole
}
