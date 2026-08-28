// ─── CameroHealth — MinIO Storage provider (on-premise deployment) ──────────
// Same interface as supabaseProvider.js so storageService.js can switch
// between them purely on STORAGE_PROVIDER — route code never knows which one
// is behind it.
const { Client } = require('minio')
const { MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET, MINIO_USE_SSL } = require('../../config')

function notConfiguredError() {
  const error = new Error('Missing MINIO_ENDPOINT, MINIO_ACCESS_KEY or MINIO_SECRET_KEY in backend environment')
  error.status = 500
  return error
}

let client = null
function getClient() {
  if (!MINIO_ENDPOINT || !MINIO_ACCESS_KEY || !MINIO_SECRET_KEY) throw notConfiguredError()
  if (client) return client
  const url = new URL(MINIO_ENDPOINT)
  client = new Client({
    endPoint: url.hostname,
    port: url.port ? parseInt(url.port, 10) : (MINIO_USE_SSL ? 443 : 80),
    useSSL: MINIO_USE_SSL || url.protocol === 'https:',
    accessKey: MINIO_ACCESS_KEY,
    secretKey: MINIO_SECRET_KEY
  })
  return client
}

async function ensureReady() {
  const minio = getClient()
  const exists = await minio.bucketExists(MINIO_BUCKET).catch(() => false)
  if (!exists) await minio.makeBucket(MINIO_BUCKET)
}

async function upload(path, buffer, contentType) {
  const minio = getClient()
  await minio.putObject(MINIO_BUCKET, path, buffer, buffer.length, { 'Content-Type': contentType || 'application/octet-stream' })
  return { path }
}

async function getSignedUrl(path, expiresInSeconds) {
  const minio = getClient()
  return minio.presignedGetObject(MINIO_BUCKET, path, expiresInSeconds)
}

async function remove(path) {
  const minio = getClient()
  await minio.removeObject(MINIO_BUCKET, path)
}

module.exports = { ensureReady, upload, getSignedUrl, remove }
