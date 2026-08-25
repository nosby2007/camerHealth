'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const {
  normalizeSearchValue,
  matchesPatientQuery,
  exactPatientIdentifierMatch
} = require('../util/patient-search.cjs')

const patient = {
  id: 'PAT-TF4DDNGB4',
  displayName: 'Amina Mballa',
  mrn: 'MRN-360-0001',
  barcode: 'BR-WF360-0001',
  phone: '+237 699 000 360',
  currentDepartment: 'Medecine interne'
}

test('normalizes accents and separators', () => {
  assert.equal(normalizeSearchValue('  Médecine-Interne '), 'medecine interne')
})

test('matches patients by name, MRN, barcode, phone and department', () => {
  for (const query of ['amina', 'MRN-360-0001', 'BR-WF360-0001', '699 000', 'medecine interne']) {
    assert.equal(matchesPatientQuery(patient, query), true, query)
  }
})

test('requires all search tokens', () => {
  assert.equal(matchesPatientQuery(patient, 'amina interne'), true)
  assert.equal(matchesPatientQuery(patient, 'amina chirurgie'), false)
})

test('recognizes exact chart identifiers', () => {
  assert.equal(exactPatientIdentifierMatch(patient, 'mrn 360 0001'), true)
  assert.equal(exactPatientIdentifierMatch(patient, 'BR-WF360-0001'), true)
  assert.equal(exactPatientIdentifierMatch(patient, 'amina'), false)
})
