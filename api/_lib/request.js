function toStringSafe(value) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function sanitizeEmail(value) {
  return toStringSafe(value).toLowerCase()
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function assertFields(body, requiredFields) {
  const missing = requiredFields.filter((field) => !toStringSafe(body[field]))
  return {
    valid: missing.length === 0,
    missing
  }
}

function normalizeRole(role) {
  return toStringSafe(role).toUpperCase()
}

function normalizePhone(value) {
  const cleaned = toStringSafe(value)
  if (!cleaned) return null
  const normalized = cleaned.replace(/[^\d+]/g, '')
  if (normalized.length < 7 || normalized.length > 20) return null
  return normalized
}

function isSafeStaffCode(value) {
  return /^[A-Z0-9-]{3,30}$/.test(toStringSafe(value).toUpperCase())
}

function isValidFacilityName(value) {
  const v = toStringSafe(value)
  return v.length >= 3 && v.length <= 140
}

function isStrongPassword(value) {
  const v = toStringSafe(value)
  if (v.length < 10) return false
  return /[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v)
}

function normalizeRequestBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {}
  return body
}

function validateBootstrapPayload(body) {
  const payload = normalizeRequestBody(body)
  const required = [
    'facilityName',
    'facilityType',
    'region',
    'address',
    'adminEmail',
    'adminPassword',
    'adminFirstName',
    'adminLastName'
  ]

  const missing = required.filter((field) => !toStringSafe(payload[field]))
  const errors = []

  const facilityName = toStringSafe(payload.facilityName)
  const facilityType = toStringSafe(payload.facilityType)
  const region = toStringSafe(payload.region)
  const address = toStringSafe(payload.address)
  const adminEmail = sanitizeEmail(payload.adminEmail)
  const adminPassword = toStringSafe(payload.adminPassword)
  const adminFirstName = toStringSafe(payload.adminFirstName)
  const adminLastName = toStringSafe(payload.adminLastName)
  const adminPhone = normalizePhone(payload.adminPhone)

  if (missing.length) errors.push(`Missing required fields: ${missing.join(', ')}`)
  if (adminEmail && !isEmail(adminEmail)) errors.push('adminEmail must be a valid email address.')
  if (facilityName && !isValidFacilityName(facilityName)) errors.push('facilityName must be between 3 and 140 characters.')
  if (adminPassword && !isStrongPassword(adminPassword)) {
    errors.push('adminPassword must be at least 10 chars and include uppercase, lowercase, and a number.')
  }

  return {
    valid: errors.length === 0,
    missing,
    errors,
    value: {
      facilityName,
      facilityType,
      region,
      address,
      adminEmail,
      adminPassword,
      adminFirstName,
      adminLastName,
      adminPhone
    }
  }
}

function validateInvitePayload(body, allowedRoles) {
  const payload = normalizeRequestBody(body)
  const required = ['email', 'firstName', 'role']
  const missing = required.filter((field) => !toStringSafe(payload[field]))
  const errors = []

  if (payload.facility_id || payload.facilityId) {
    errors.push('facility_id must not be provided by client.')
  }

  const email = sanitizeEmail(payload.email)
  const firstName = toStringSafe(payload.firstName)
  const lastName = toStringSafe(payload.lastName)
  const role = normalizeRole(payload.role)
  const staffCode = toStringSafe(payload.staffCode).toUpperCase()
  const phone = normalizePhone(payload.phone)

  if (missing.length) errors.push(`Missing required fields: ${missing.join(', ')}`)
  if (email && !isEmail(email)) errors.push('email must be a valid email address.')
  if (role && Array.isArray(allowedRoles) && !allowedRoles.includes(role)) {
    errors.push(`Unsupported role. Allowed roles: ${allowedRoles.join(', ')}`)
  }
  if (staffCode && !isSafeStaffCode(staffCode)) {
    errors.push('staffCode must be 3-30 chars using A-Z, 0-9, and hyphen only.')
  }

  return {
    valid: errors.length === 0,
    missing,
    errors,
    value: {
      email,
      firstName,
      lastName,
      role,
      staffCode,
      phone,
      title: toStringSafe(payload.title),
      department: toStringSafe(payload.department)
    }
  }
}

function randomCode(prefix) {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `${prefix}-${rand}`
}

module.exports = {
  toStringSafe,
  sanitizeEmail,
  isEmail,
  assertFields,
  normalizeRole,
  normalizePhone,
  isSafeStaffCode,
  isValidFacilityName,
  isStrongPassword,
  normalizeRequestBody,
  validateBootstrapPayload,
  validateInvitePayload,
  randomCode
}