// ─── CameroHealth — StorageService ───────────────────────────────────────────
// Single entry point for all file storage. Business/route code must only call
// through here — never require supabaseProvider/minioProvider directly — so
// on-premise vs cloud is a one-line config switch, not a code change.
const { STORAGE_PROVIDER } = require('../../config')

function getProvider() {
  return STORAGE_PROVIDER === 'minio'
    ? require('./minioProvider')
    : require('./supabaseProvider')
}

async function ensureReady() {
  return getProvider().ensureReady()
}

async function upload(path, buffer, contentType) {
  return getProvider().upload(path, buffer, contentType)
}

async function getSignedUrl(path, expiresInSeconds) {
  return getProvider().getSignedUrl(path, expiresInSeconds)
}

async function remove(path) {
  return getProvider().remove(path)
}

module.exports = { ensureReady, upload, getSignedUrl, remove }
