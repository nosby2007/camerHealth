function hasDisplayValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== ''
}

function looksLikeUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim())
}

function resolveDisplayAccount(patient = {}) {
  const candidates = [patient.accountNumber, patient.account, patient.encounterNumber, patient.visitNumber]
  return candidates.find(value => hasDisplayValue(value) && !looksLikeUuid(value)) || 'Not assigned'
}

function formatClinicalDate(value, locale = 'en-CA') {
  if (!hasDisplayValue(value)) return 'N/A'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: '2-digit', timeZone: 'UTC' }).format(parsed)
}

function firstValue(record, keys) {
  for (const key of keys) {
    if (hasDisplayValue(record && record[key])) return record[key]
  }
  return ''
}

function formatVitalsSummary(vitals) {
  if (!vitals) return 'No current vitals'
  if (typeof vitals === 'string') {
    const trimmed = vitals.trim()
    if (!trimmed) return 'No current vitals'
    try {
      return formatVitalsSummary(JSON.parse(trimmed))
    } catch (error) {
      return trimmed
    }
  }
  if (typeof vitals !== 'object') return 'No current vitals'

  const values = [
    ['BP', firstValue(vitals, ['bp', 'bloodPressure']), ''],
    ['HR', firstValue(vitals, ['hr', 'pulseRate', 'heartRate']), ' bpm'],
    ['RR', firstValue(vitals, ['rr', 'respiratoryRate']), '/min'],
    ['Temp', firstValue(vitals, ['temp', 'temperature']), ' C'],
    ['SpO2', firstValue(vitals, ['spo2', 'oxygenSaturation']), '%'],
    ['Pain', firstValue(vitals, ['pain', 'painScore']), '/10']
  ]
  const parts = values
    .filter(([, value]) => hasDisplayValue(value))
    .map(([label, value, unit]) => `${label} ${value}${unit}`)
  return parts.length ? parts.join(' | ') : 'No current vitals'
}

module.exports = { formatClinicalDate, formatVitalsSummary, looksLikeUuid, resolveDisplayAccount }
