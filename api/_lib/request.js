function toStringSafe(value) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function sanitizeEmail(value) {
  return toStringSafe(value).toLowerCase()
}

function isEmail(value) {
  return /.+@.+\..+/.test(value)
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
  randomCode
}