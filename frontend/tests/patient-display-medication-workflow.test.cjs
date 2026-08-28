const assert = require('node:assert/strict')
const test = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const { formatClinicalDate, formatVitalsSummary, resolveDisplayAccount } = require('../util/patient-display.cjs')
const { isMedicationOrderForMar, resolveAdministrationInstructions } = require('../util/medication-workflow.cjs')

test('patient identifiers use a clinical account number instead of a UUID', () => {
  assert.equal(resolveDisplayAccount({ account: 'b3099fd5-9d6d-4f35-94bd-7ac5315c49b0', mrn: 'E00-26P-00001' }), 'Not assigned')
  assert.equal(resolveDisplayAccount({ accountNumber: 'ENC-2026-001', mrn: 'MRN-1' }), 'ENC-2026-001')
})

test('legacy vital objects render as a concise clinical summary', () => {
  assert.equal(
    formatVitalsSummary({ bloodPressure: '120/80', pulseRate: 72, respiratoryRate: 16, temperature: 37, oxygenSaturation: 98 }),
    'BP 120/80 | HR 72 bpm | RR 16/min | Temp 37 C | SpO2 98%'
  )
  assert.match(formatClinicalDate('1991-01-01T00:00:00.000Z'), /1991/)
})

test('MAR accepts real active prescriptions and excludes synthetic or inactive rows', () => {
  assert.equal(isMedicationOrderForMar({ id: 'MED-1', drug: 'Paracetamol', status: 'Active' }), true)
  assert.equal(isMedicationOrderForMar({ drug: 'Paracetamol', status: 'Active' }), false)
  assert.equal(isMedicationOrderForMar({ id: 'MED-2', drug: 'Amlodipine', status: 'Discontinued' }), false)
})

test('Patient 360 MAR does not synthesize demo medications or arbitrary administration times', () => {
  const source = fs.readFileSync(path.join(__dirname, '../components/clinical/ClinicalWorkspace.vue'), 'utf8')
  assert.doesNotMatch(source, /demo-mar-/)
  assert.doesNotMatch(source, /marTimeColumns\[index %/)
  assert.match(source, /patientMedications\.filter\(isMedicationOrderForMar\)/)
})

test('administration instructions prioritize the signed prescription notes', () => {
  assert.equal(resolveAdministrationInstructions({ route: 'Oral', notes: 'Give with food.' }), 'Give with food.')
  assert.match(resolveAdministrationInstructions({ route: 'IV' }), /IV access/)
})
