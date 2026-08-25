require('dotenv').config()

const prisma = require('../src/lib/prisma')
const { signToken } = require('../src/lib/jwt')

const apiBase = (process.env.API_TEST_URL || 'http://127.0.0.1:4000/api').replace(/\/$/, '')

async function api(path, token, options = {}) {
  return fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  })
}

function tokenFor(staff) {
  return signToken({
    id: staff.id,
    staffCode: staff.staffCode,
    role: staff.role,
    facilityId: staff.facilityId
  })
}

async function main() {
  const staff = await prisma.staffProfile.findMany({
    where: { status: 'active' },
    select: { id: true, staffCode: true, role: true, facilityId: true }
  })
  const patients = await prisma.patient.findMany({
    select: { id: true, facilityId: true }
  })

  const contexts = []
  for (const member of staff) {
    const patient = patients.find(item => item.facilityId === member.facilityId)
    if (patient && !contexts.some(item => item.staff.facilityId === member.facilityId)) {
      contexts.push({ staff: member, patient })
    }
  }

  if (contexts.length < 2) {
    throw new Error('Tenant verification requires active staff and patients in at least two facilities.')
  }

  const primary = contexts.find(item => item.staff.role === 'ADMIN') || contexts[0]
  const foreign = contexts.find(item => item.staff.facilityId !== primary.staff.facilityId)
  const primaryToken = tokenFor(primary.staff)

  const listResponse = await api('/patients?limit=200', primaryToken)
  if (!listResponse.ok) throw new Error(`Patient list returned HTTP ${listResponse.status}`)
  const listBody = await listResponse.json()
  const visiblePatients = listBody.patients || []
  const crossTenantRows = visiblePatients.filter(item => item.facilityId !== primary.staff.facilityId)
  if (crossTenantRows.length) throw new Error(`Patient list leaked ${crossTenantRows.length} cross-facility record(s).`)

  const foreignDetail = await api(`/patients/${foreign.patient.id}`, primaryToken)
  if (foreignDetail.status !== 404) {
    throw new Error(`Cross-facility patient lookup returned HTTP ${foreignDetail.status}; expected 404.`)
  }

  const spoofedList = await api('/patients?limit=200', primaryToken, {
    headers: { 'X-Facility-ID': foreign.staff.facilityId }
  })
  if (!spoofedList.ok) throw new Error(`Header-spoof list returned HTTP ${spoofedList.status}`)
  const spoofedBody = await spoofedList.json()
  if ((spoofedBody.patients || []).some(item => item.facilityId !== primary.staff.facilityId)) {
    throw new Error('X-Facility-ID header changed the authenticated patient scope.')
  }

  const crossTenantOrder = await api('/clinical/lab-orders', primaryToken, {
    method: 'POST',
    body: JSON.stringify({ patientId: foreign.patient.id, test: 'TENANT_ISOLATION_NO_WRITE' })
  })
  if (crossTenantOrder.status !== 404) {
    throw new Error(`Cross-facility clinical write returned HTTP ${crossTenantOrder.status}; expected 404.`)
  }

  console.log(JSON.stringify({
    result: 'PASS',
    testedRole: primary.staff.role,
    visiblePatientCount: visiblePatients.length,
    crossFacilityListRecords: 0,
    crossFacilityDetailStatus: foreignDetail.status,
    crossFacilityWriteStatus: crossTenantOrder.status,
    headerSpoofIgnored: true
  }, null, 2))
}

main()
  .catch(error => {
    console.error(`[TENANT ISOLATION FAILED] ${error.message}`)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
