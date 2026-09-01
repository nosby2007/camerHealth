// ─── CameroHealth — eMAR dose scheduling ────────────────────────────────────
// Server-side port of frontend/services/clinical/workflowEngine.js's
// FREQUENCY_HOURS / nextOccurrenceAt (kept in sync by hand — small and
// dependency-free on both sides). Computing "when is the next dose due" here
// rather than only on the client makes the schedule authoritative even if a
// nurse's browser crashes or is offline mid-administration.

const FREQUENCY_HOURS = {
  'each shift': 8,
  daily: 24,
  bid: 12,
  tid: 8,
  qid: 6,
  q4h: 4,
  'every 4 hours': 4,
  q6h: 6,
  q8h: 8,
  'every 8 hours': 8,
  q12h: 12
}

// Fixed cadence from the given anchor (the dose's own originally-planned
// time, not the actual administration time — so the grid stays on a stable
// q6h/q8h/etc. rhythm instead of drifting with how late/early each dose was
// actually given).
function nextOccurrenceAt(frequency, anchor) {
  const normalized = String(frequency || '').trim().toLowerCase()
  const base = new Date(anchor || Date.now())
  if (Number.isNaN(base.getTime()) || !normalized || ['once', 'prn', 'as needed'].includes(normalized)) return null

  if (normalized === 'weekly') {
    base.setDate(base.getDate() + 7)
    return base.toISOString()
  }

  const hours = FREQUENCY_HOURS[normalized]
  if (!hours) return null
  return new Date(base.getTime() + hours * 60 * 60 * 1000).toISOString()
}

function occurrencesThrough(frequency, anchor, horizon, maximum = 32) {
  const limit = new Date(horizon)
  if (Number.isNaN(limit.getTime())) return []
  const occurrences = []
  let cursor = anchor
  while (occurrences.length < maximum) {
    const next = nextOccurrenceAt(frequency, cursor)
    if (!next || new Date(next).getTime() > limit.getTime()) break
    occurrences.push(next)
    cursor = next
  }
  return occurrences
}

// For the FIRST dose of a new (non-urgent) order only: round up to the next
// standard clock slot for that frequency's interval, rather than scheduling
// it at the exact prescribing timestamp. Slots are even divisions of the day
// starting at midnight (q6h -> 00/06/12/18, q8h -> 00/08/16, q12h -> 00/12,
// q4h -> 00/04/08/...), which is a common nursing MAR convention; "daily"
// uses a fixed 08:00 morning med-pass time since a 24h interval has no
// natural sub-division. This is a deliberate clinical-workflow default, not
// a hard requirement — revisit if the facility's actual med-pass times differ.
function roundToNextStandardSlot(frequency, anchor) {
  const normalized = String(frequency || '').trim().toLowerCase()
  const base = new Date(anchor || Date.now())
  if (Number.isNaN(base.getTime()) || !normalized || ['once', 'prn', 'as needed', 'weekly'].includes(normalized)) {
    return null
  }

  if (normalized === 'daily' || normalized === 'each shift') {
    const slotHour = normalized === 'daily' ? 8 : nextShiftStartHour(base.getUTCHours())
    const next = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), slotHour, 0, 0, 0))
    if (next.getTime() <= base.getTime()) next.setUTCDate(next.getUTCDate() + 1)
    return next.toISOString()
  }

  const hours = FREQUENCY_HOURS[normalized]
  if (!hours) return null

  const dayStart = Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), 0, 0, 0, 0)
  const elapsedMs = base.getTime() - dayStart
  const slotMs = hours * 60 * 60 * 1000
  const nextSlotIndex = Math.floor(elapsedMs / slotMs) + 1
  return new Date(dayStart + nextSlotIndex * slotMs).toISOString()
}

function nextShiftStartHour(currentHour) {
  const shiftStarts = [0, 8, 16]
  return shiftStarts.find((h) => h > currentHour) ?? shiftStarts[0]
}

// Order statuses that mean "stop generating future doses" — same vocabulary
// already used by the frontend (ClinicalWorkspace.vue's status classifier).
const DISCONTINUED_STATUS_RE = /discontinued|cancelled|cancel|stopped/i

function isDiscontinued(medicationStatus) {
  return DISCONTINUED_STATUS_RE.test(String(medicationStatus || ''))
}

module.exports = { FREQUENCY_HOURS, nextOccurrenceAt, occurrencesThrough, roundToNextStandardSlot, isDiscontinued }
