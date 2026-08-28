// ─── CameroHealth — Supabase Storage provider (cloud deployment) ────────────
const { createClient } = require('@supabase/supabase-js')
const { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_STORAGE_BUCKET } = require('../../config')

function notConfiguredError() {
  const error = new Error('Missing SUPABASE_URL, SUPABASE_SERVICE_KEY or SUPABASE_STORAGE_BUCKET in backend environment')
  error.status = 500
  return error
}

function getClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) throw notConfiguredError()
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  })
}

async function ensureReady() {
  if (!SUPABASE_STORAGE_BUCKET) throw notConfiguredError()
  const supabase = getClient()
  const { data: existingBucket, error: getBucketError } = await supabase.storage.getBucket(SUPABASE_STORAGE_BUCKET)
  if (getBucketError && getBucketError.status !== 404) throw getBucketError
  if (existingBucket) return
  const { error: createError } = await supabase.storage.createBucket(SUPABASE_STORAGE_BUCKET, { public: false })
  if (createError) throw createError
}

async function upload(path, buffer, contentType) {
  const supabase = getClient()
  const { error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).upload(path, buffer, { contentType, upsert: false })
  if (error) throw error
  return { path }
}

async function getSignedUrl(path, expiresInSeconds) {
  const supabase = getClient()
  const { data, error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).createSignedUrl(path, expiresInSeconds)
  if (error) throw error
  return data?.signedURL || data?.signedUrl || ''
}

async function remove(path) {
  const supabase = getClient()
  const { error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).remove([path])
  if (error) throw error
}

module.exports = { ensureReady, upload, getSignedUrl, remove }
