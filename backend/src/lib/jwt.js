// ─── CameroHealth — JWT Helpers ─────────────────────────────────────────────
const jwt = require('jsonwebtoken')
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config')

/**
 * Sign a JWT token for a staff profile
 */
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  })
}

/**
 * Verify and decode a JWT token
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

/**
 * Extract the staff ID (subject) from a token
 */
function getTokenPayload(token) {
  const decoded = verifyToken(token)
  return {
    id: decoded.id,
    staffCode: decoded.staffCode,
    role: decoded.role,
    facilityId: decoded.facilityId
  }
}

module.exports = {
  signToken,
  verifyToken,
  getTokenPayload
}
