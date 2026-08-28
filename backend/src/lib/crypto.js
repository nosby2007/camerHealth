// ─── CameroHealth — Symmetric Encryption Helper ─────────────────────────────
// Used to store third-party credentials (DHIS2 password) at rest without
// plain text, without introducing a new secret to manage — the key is
// derived from JWT_SECRET, which every deployment already configures.
const crypto = require('crypto')
const { JWT_SECRET } = require('../config')

const ALGO = 'aes-256-gcm'
const key = crypto.createHash('sha256').update(String(JWT_SECRET)).digest()

function encrypt(plainText) {
  if (!plainText) return null
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

function decrypt(payload) {
  if (!payload) return null
  const buffer = Buffer.from(payload, 'base64')
  const iv = buffer.subarray(0, 12)
  const authTag = buffer.subarray(12, 28)
  const encrypted = buffer.subarray(28)
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

module.exports = { encrypt, decrypt }
