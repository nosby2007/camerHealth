const ACTIVE_AVATAR_STATUSES = {
  wound: ['Active', 'Improving', 'Worsening', 'Needs reassessment', 'Resolved'],
  trach: ['In place', 'Secure', 'Needs suction', 'Site concern', 'Escalate', 'Removed'],
  iv: ['Patent', 'Clean/dry/intact', 'Needs reassessment', 'Infiltrated', 'Phlebitis', 'Removed'],
  foley: ['Draining', 'Patent', 'Low output', 'Obstructed', 'Needs reassessment', 'Removed'],
  drain: ['Active', 'Patent', 'Low output', 'Clamped', 'Needs reassessment', 'Removed'],
  ostomy: ['Appliance intact', 'Active', 'Leak', 'Skin concern', 'Needs reassessment', 'Resolved'],
  pain: ['Mild', 'Moderate', 'Severe', 'Needs reassessment', 'Resolved']
}

function clampCoordinate(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 50
  return Math.max(0, Math.min(100, number))
}

function anatomicalSide(x, view) {
  if (x >= 43 && x <= 57) return 'midline'
  const screenSide = x < 50 ? 'left' : 'right'
  if (view === 'front') return screenSide === 'left' ? 'right' : 'left'
  return screenSide
}

function isPointOnBody(xValue, yValue) {
  const x = clampCoordinate(xValue)
  const y = clampCoordinate(yValue)

  if (y <= 18) return x >= 37 && x <= 63
  if (y <= 25) return x >= 35 && x <= 65
  if (y <= 44) return x >= 20 && x <= 80
  if (y <= 61) return x >= 12 && x <= 88
  if (y <= 73) return x >= 33 && x <= 67
  if (y <= 95) return (x >= 32 && x <= 49) || (x >= 51 && x <= 68)
  return x >= 29 && x <= 71
}

function detectAvatarRegion({ x: xValue, y: yValue, view = 'front', anatomy = 'male' }) {
  const x = clampCoordinate(xValue)
  const y = clampCoordinate(yValue)
  const normalizedView = view === 'back' ? 'back' : 'front'
  const side = anatomicalSide(x, normalizedView)

  if (!isPointOnBody(x, y)) return ''
  if (y <= 15) return normalizedView === 'back' ? 'posterior head / occiput' : 'head / face'
  if (y <= 23) return side === 'midline' ? 'anterior neck / trachea' : `${side} neck`

  // Check extremities before torso bands so arm clicks are not mislabeled as chest or abdomen.
  if (y <= 61 && x < 36) return `${side} arm / hand`
  if (y <= 61 && x > 64) return `${side} arm / hand`

  if (y <= 36) {
    if (normalizedView === 'back') return side === 'midline' ? 'upper back / spine' : `${side} upper back / scapula`
    if (anatomy === 'female' && y >= 25) return side === 'midline' ? 'sternal chest' : `${side} breast / chest`
    return side === 'midline' ? 'sternal chest' : `${side} chest`
  }
  if (y <= 53) return normalizedView === 'back'
    ? (side === 'midline' ? 'thoracic spine' : `${side} mid back`)
    : (side === 'midline' ? 'upper abdomen' : `${side} upper abdomen`)
  if (y <= 66) return normalizedView === 'back'
    ? (side === 'midline' ? 'lumbar spine' : `${side} lower back / flank`)
    : (side === 'midline' ? 'lower abdomen' : `${side} lower abdomen`)
  if (y <= 73) return normalizedView === 'back'
    ? (side === 'midline' ? 'sacrum' : `${side} gluteal area`)
    : (side === 'midline' ? 'pelvis / perineum' : `${side} groin / hip`)
  if (y <= 94) return normalizedView === 'back' ? `${side} posterior leg` : `${side} leg`
  return `${side} foot / heel`
}

function statusOptionsForAvatarType(type) {
  return ACTIVE_AVATAR_STATUSES[type] || ['Active', 'Needs reassessment', 'Resolved', 'Removed']
}

function isResolvedAvatarStatus(status) {
  return ['resolved', 'removed'].includes(String(status || '').trim().toLowerCase())
}

module.exports = {
  anatomicalSide,
  detectAvatarRegion,
  isPointOnBody,
  isResolvedAvatarStatus,
  statusOptionsForAvatarType
}
