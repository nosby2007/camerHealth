const { createClient } = require('@supabase/supabase-js')
const { getServerSupabaseConfig } = require('./env')

function getSupabaseAdminClient() {
  const cfg = getServerSupabaseConfig()
  return createClient(cfg.url, cfg.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}

async function findAuthUserByEmail(adminClient, email) {
  const normalized = String(email || '').trim().toLowerCase()
  if (!normalized) return null

  let page = 1
  const perPage = 200
  while (page <= 10) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const users = data && data.users ? data.users : []
    const match = users.find((u) => String(u.email || '').toLowerCase() === normalized)
    if (match) return match
    if (users.length < perPage) return null
    page += 1
  }

  return null
}

module.exports = {
  getSupabaseAdminClient,
  findAuthUserByEmail
}