// ─── CameroHealth — DHIS2 client ─────────────────────────────────────────────
// Pushes RMA indicators to a DHIS2 instance via the dataValueSets API, so
// facilities don't have to re-key the same monthly report a second time.
// Optional, like Supabase: an organization with no DHIS2 config configured
// simply has no sync available — this never blocks the local RMA workflow.
const { decrypt } = require('./crypto')

function periodFromMonthYear(month, year) {
  return `${year}${String(month).padStart(2, '0')}`
}

// Builds the DataValueSet payload from RMA indicators + the organization's
// indicatorKey -> DHIS2 dataElement mapping. Indicators with no mapping are
// skipped (not an error — an organization may only map a subset so far).
function buildDataValueSet({ organization, orgUnitId, month, year, indicators, mappings }) {
  const period = periodFromMonthYear(month, year)
  const dataValues = mappings
    .filter(mapping => indicators[mapping.indicatorKey] !== undefined && indicators[mapping.indicatorKey] !== null)
    .map(mapping => ({
      dataElement: mapping.dhisDataElementId,
      categoryOptionCombo: mapping.dhisCategoryOptionComboId || undefined,
      period,
      orgUnit: orgUnitId,
      value: String(indicators[mapping.indicatorKey])
    }))

  return { dataSet: undefined, orgUnit: orgUnitId, period, dataValues }
}

async function postDataValueSet(organization, dataValueSet) {
  if (!organization.dhisBaseUrl || !organization.dhisUsername || !organization.dhisPasswordEncrypted) {
    const error = new Error('DHIS2 is not configured for this organization. Set the base URL, username and password in the org DHIS2 mapping screen.')
    error.status = 400
    error.code = 'DHIS2_NOT_CONFIGURED'
    throw error
  }

  const password = decrypt(organization.dhisPasswordEncrypted)
  const credentials = Buffer.from(`${organization.dhisUsername}:${password}`).toString('base64')
  const url = `${organization.dhisBaseUrl.replace(/\/$/, '')}/api/dataValueSets`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dataValueSet)
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(`DHIS2 rejected the submission (${response.status}): ${body ? JSON.stringify(body) : 'no response body'}`)
    error.status = 502
    throw error
  }
  return body
}

module.exports = { buildDataValueSet, postDataValueSet, periodFromMonthYear }
