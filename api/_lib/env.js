function requiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    const error = new Error(`Missing required server environment variable: ${name}`)
    error.code = 'ENV_MISSING'
    throw error
  }
  return value
}

function getServerSupabaseConfig() {
  return {
    url: requiredEnv('SUPABASE_URL'),
    serviceRoleKey: requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
  }
}

module.exports = {
  requiredEnv,
  getServerSupabaseConfig
}