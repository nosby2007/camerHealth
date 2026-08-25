const { createClient } = require('@supabase/supabase-js')
const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = require('../config')

function getSupabaseAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in backend environment')
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}

async function ensureStorageBucket(bucketName) {
  if (!bucketName) {
    throw new Error('SUPABASE_STORAGE_BUCKET is not configured')
  }
  const supabase = getSupabaseAdminClient()
  const { data: existingBucket, error: getBucketError } = await supabase.storage.getBucket(bucketName)
  if (getBucketError && getBucketError.status !== 404) {
    throw getBucketError
  }
  if (existingBucket) {
    return existingBucket
  }

  const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
    public: false
  })
  if (createError) {
    throw createError
  }
  return data
}

module.exports = {
  getSupabaseAdminClient,
  ensureStorageBucket
}
