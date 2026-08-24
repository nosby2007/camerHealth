// ─── CameroHealth — Environment Configuration ───────────────────────────────
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')

// Load `.env` first as the base configuration (always present).
// Then layer `.env.<NODE_ENV>` on top so environment-specific values take
// precedence while any variable missing from the env-specific file still
// falls back to the base `.env`.
const env = process.env.NODE_ENV || 'development'
const envPath = path.resolve(__dirname, '..', `.env.${env}`)
const defaultEnvPath = path.resolve(__dirname, '..', '.env')

if (fs.existsSync(defaultEnvPath)) {
  dotenv.config({ path: defaultEnvPath })
}

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true })
}

const requiredVars = [
  'DATABASE_URL',
  'DIRECT_URL',
  'JWT_SECRET'
]

const missing = requiredVars.filter(v => !process.env[v])
if (missing.length) {
  throw new Error(
    `[CameroHealth Backend] Missing required environment variables: ${missing.join(', ')}\n` +
    `Copy .env.example to .env and fill in the values.`
  )
}

module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 4000,
  NODE_ENV: env,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:8000',
  SUPABASE_URL: process.env.SUPABASE_URL || null,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || null,
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET || null
}
