// ─── Verifies the patient discharge workflow actually persists to Postgres ──
// Registers a throwaway facility/admin/patient via the real HTTP API, PATCHes
// the patient the same way frontend/store/clinical.js's dischargePatient
// action now does, then re-fetches the patient from a fresh request to prove
// the discharge fields round-trip through the database rather than only
// living in Vuex state.
require('dotenv').config()

const apiBase = (process.env.API_TEST_URL || 'http://127.0.0.1:4000/api').replace(/\/$/, '')

async function api(path, token, options = {}) {
  const res = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers || {})
    }
  })
  return res
}

async function main() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase()

  const registerRes = await api('/auth/register', null, {
    method: 'POST',
    body: JSON.stringify({
      facilityName: `Discharge Test Facility ${suffix}`,
      facilityCode: `DTF${suffix}`,
      region: 'Littoral',
      city: 'Douala',
      facilityEmail: `dtf-${suffix.toLowerCase()}@example.test`,
      adminFullName: 'Test Admin',
      adminEmail: `admin-${suffix.toLowerCase()}@example.test`,
      adminPassword: 'TestPassword123!'
    })
  })
  if (!registerRes.ok) {
    throw new Error(`Facility registration failed: HTTP ${registerRes.status} ${await registerRes.text()}`)
  }
  const { token } = await registerRes.json()

  const createRes = await api('/patients', token, {
    method: 'POST',
    body: JSON.stringify({
      firstName: 'Discharge',
      lastName: `Verify${suffix}`,
      dateOfBirth: '1990-01-01',
      gender: 'Female',
      departmentRouting: 'Ward A',
      acuityLevel: 'Routine'
    })
  })
  if (!createRes.ok) {
    throw new Error(`Patient creation failed: HTTP ${createRes.status} ${await createRes.text()}`)
  }
  const created = await createRes.json()
  const patientId = created.id
  if (!patientId) throw new Error('Patient creation response had no id')
  if (String(created.patientStatus || '').toLowerCase() === 'discharged') {
    throw new Error('Newly created patient unexpectedly already discharged')
  }

  // ── Cascaded records: inpatient stay, open task, active medication ────────
  const admitRes = await api('/inpatients', token, {
    method: 'POST',
    body: JSON.stringify({ patientId, ward: 'Ward A', bedNumber: 'A1' })
  })
  if (!admitRes.ok) throw new Error(`Inpatient admit failed: HTTP ${admitRes.status} ${await admitRes.text()}`)
  const inpatient = await admitRes.json()

  const taskRes = await api('/tasks', token, {
    method: 'POST',
    body: JSON.stringify({ patientId, title: 'Follow-up wound check', assignedToRole: 'NURSE' })
  })
  if (!taskRes.ok) throw new Error(`Task creation failed: HTTP ${taskRes.status} ${await taskRes.text()}`)
  const { task } = await taskRes.json()

  const medRes = await api('/clinical/medications', token, {
    method: 'POST',
    body: JSON.stringify({ patientId, drug: 'Amoxicillin', dose: '500mg', frequency: 'TID' })
  })
  if (!medRes.ok) throw new Error(`Medication creation failed: HTTP ${medRes.status} ${await medRes.text()}`)
  const medication = await medRes.json()

  const dischargedAt = new Date().toISOString()
  const dischargeRes = await api(`/patients/${patientId}`, token, {
    method: 'PATCH',
    body: JSON.stringify({
      patientStatus: 'Discharged',
      dischargedAt,
      dischargeDisposition: 'Home',
      dischargeReason: 'E2E verification discharge',
      dischargedBy: 'Test Admin'
    })
  })
  if (!dischargeRes.ok) {
    throw new Error(`Discharge PATCH failed: HTTP ${dischargeRes.status} ${await dischargeRes.text()}`)
  }
  const patched = await dischargeRes.json()
  if (patched.patientStatus !== 'Discharged') {
    throw new Error(`PATCH response patientStatus was "${patched.patientStatus}", expected "Discharged"`)
  }

  // Re-fetch from a separate request to prove this round-tripped through the
  // database rather than just echoing the request body back.
  const refetchRes = await api(`/patients/${patientId}`, token)
  if (!refetchRes.ok) {
    throw new Error(`Patient re-fetch failed: HTTP ${refetchRes.status} ${await refetchRes.text()}`)
  }
  const refetched = await refetchRes.json()

  const checks = [
    ['patientStatus', refetched.patientStatus, 'Discharged'],
    ['dischargeDisposition', refetched.dischargeDisposition, 'Home'],
    ['dischargeReason', refetched.dischargeReason, 'E2E verification discharge'],
    ['dischargedBy', refetched.dischargedBy, 'Test Admin']
  ]
  for (const [field, actual, expected] of checks) {
    if (actual !== expected) {
      throw new Error(`Re-fetched patient.${field} was "${actual}", expected "${expected}"`)
    }
  }
  if (!refetched.dischargedAt) {
    throw new Error('Re-fetched patient.dischargedAt was empty')
  }

  // Cascade: mirror what dischargePatient now does for the inpatient stay,
  // the open task, and the active medication, then re-fetch each to prove
  // those persisted too rather than only updating local Vuex state.
  const inpatientDischargeRes = await api(`/inpatients/${inpatient.id}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'Discharged', dischargeSummary: 'E2E verification discharge' })
  })
  if (!inpatientDischargeRes.ok) {
    throw new Error(`Inpatient discharge PATCH failed: HTTP ${inpatientDischargeRes.status} ${await inpatientDischargeRes.text()}`)
  }

  const taskCancelRes = await api(`/tasks/${task.id}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'cancel', reason: 'Closed by completed discharge workflow' })
  })
  if (!taskCancelRes.ok) {
    throw new Error(`Task cancel PATCH failed: HTTP ${taskCancelRes.status} ${await taskCancelRes.text()}`)
  }

  const medDiscontinueRes = await api(`/clinical/medications/${medication.id}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'Discontinued' })
  })
  if (!medDiscontinueRes.ok) {
    throw new Error(`Medication discontinue PATCH failed: HTTP ${medDiscontinueRes.status} ${await medDiscontinueRes.text()}`)
  }

  const [inpatientListRes, taskListRes, medListRes] = await Promise.all([
    api('/inpatients?status=all', token),
    api(`/tasks?patientId=${patientId}`, token),
    api(`/clinical/medications?patientId=${patientId}`, token)
  ])
  const inpatientsAfter = await inpatientListRes.json()
  const tasksAfter = await taskListRes.json()
  const medsAfter = await medListRes.json()

  const refetchedInpatient = (Array.isArray(inpatientsAfter) ? inpatientsAfter : inpatientsAfter.inpatients || [])
    .find(item => item.id === inpatient.id)
  const refetchedTask = (tasksAfter.tasks || tasksAfter).find(item => item.id === task.id)
  const refetchedMed = (Array.isArray(medsAfter) ? medsAfter : medsAfter.medications || []).find(item => item.id === medication.id)

  if (!refetchedInpatient || refetchedInpatient.status !== 'Discharged' || !refetchedInpatient.dischargedAt) {
    throw new Error(`Inpatient did not persist as Discharged: ${JSON.stringify(refetchedInpatient)}`)
  }
  if (!refetchedTask || refetchedTask.status !== 'cancel') {
    throw new Error(`Task did not persist as cancelled: ${JSON.stringify(refetchedTask)}`)
  }
  if (!refetchedMed || refetchedMed.status !== 'Discontinued') {
    throw new Error(`Medication did not persist as Discontinued: ${JSON.stringify(refetchedMed)}`)
  }

  console.log('OK: discharge fields and cascaded inpatient/task/medication updates all persisted and round-tripped through the database.')
  console.log(JSON.stringify({
    patientId,
    patientStatus: refetched.patientStatus,
    dischargedAt: refetched.dischargedAt,
    dischargeDisposition: refetched.dischargeDisposition,
    dischargeReason: refetched.dischargeReason,
    dischargedBy: refetched.dischargedBy,
    inpatientStatus: refetchedInpatient.status,
    taskStatus: refetchedTask.status,
    medicationStatus: refetchedMed.status
  }, null, 2))
}

main().catch(err => {
  console.error('FAILED:', err.message)
  process.exit(1)
})
