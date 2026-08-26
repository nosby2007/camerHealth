const test = require('node:test')
const assert = require('node:assert/strict')
const {
  READ_ONLY_ERROR,
  isPatientReadOnly,
  assertPatientWritable,
  canPreviewRole
} = require('../util/patient-360-policy.cjs')

test('treats discharged and inactive patient records as read only', () => {
  assert.equal(isPatientReadOnly({ patientStatus: 'Discharged' }), true)
  assert.equal(isPatientReadOnly({ admissionStatus: 'discharged' }), true)
  assert.equal(isPatientReadOnly({ recordStatus: 'Inactive' }), true)
  assert.equal(isPatientReadOnly({ active: false }), true)
  assert.equal(isPatientReadOnly({ patientStatus: 'Admitted', active: true }), false)
})

test('blocks writes to a discharged chart with a stable error code', () => {
  assert.throws(
    () => assertPatientWritable({ patientStatus: 'Discharged' }),
    error => error.code === READ_ONLY_ERROR && error.message === READ_ONLY_ERROR
  )
  assert.equal(assertPatientWritable({ patientStatus: 'Admitted' }), true)
})

test('allows role preview only for administrators outside production', () => {
  assert.equal(canPreviewRole('ADMIN', 'development'), true)
  assert.equal(canPreviewRole('ADMIN', 'production'), false)
  assert.equal(canPreviewRole('NURSE', 'development'), false)
})
