'use strict'

function normalizeSearchValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function patientSearchValues(patient = {}) {
  return [
    patient.displayName,
    patient.name,
    patient.firstName,
    patient.lastName,
    patient.mrn,
    patient.externalId,
    patient.id,
    patient.barcode,
    patient.phone,
    patient.currentDepartment,
    patient.department,
    patient.serviceRouting,
    patient.specialtyRouting
  ].filter(Boolean)
}

function matchesPatientQuery(patient, query) {
  const normalizedQuery = normalizeSearchValue(query)
  if (!normalizedQuery) return true
  const tokens = normalizedQuery.split(' ').filter(Boolean)
  const haystack = patientSearchValues(patient).map(normalizeSearchValue).join(' ')
  return tokens.every(token => haystack.includes(token))
}

function exactPatientIdentifierMatch(patient, query) {
  const normalizedQuery = normalizeSearchValue(query)
  if (!normalizedQuery) return false
  return [patient && patient.mrn, patient && patient.externalId, patient && patient.id, patient && patient.barcode]
    .filter(Boolean)
    .some(value => normalizeSearchValue(value) === normalizedQuery)
}

module.exports = {
  normalizeSearchValue,
  patientSearchValues,
  matchesPatientQuery,
  exactPatientIdentifierMatch
}
