// ─── CameroHealth — Environment Configuration ───────────────────────────────

const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')

/**
 * Read an env file without immediately mutating process.env.
 *
 * Priority used below:
 *   Runtime environment variables
 *       >
 *   .env.<NODE_ENV>
 *       >
 *   .env
 */
function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  return dotenv.parse(fs.readFileSync(filePath))
}
const defaultEnvPath = path.resolve(__dirname, '..', '.env')

// Read base .env first
const baseEnv = readEnvFile(defaultEnvPath)

// Runtime variables always have highest priority
const runtimeEnv = { ...process.env }

// Determine environment
const NODE_ENV =
  runtimeEnv.NODE_ENV ||
  baseEnv.NODE_ENV ||
  'development'

// Load environment-specific file
const envPath = path.resolve(
  __dirname,
  '..',
  `.env.${NODE_ENV}`
)

const environmentEnv = readEnvFile(envPath)

// Final configuration
const config = {
  ...baseEnv,
  ...environmentEnv,
  ...runtimeEnv
}

// Make file-based values available to libraries that directly use process.env
Object.assign(process.env, config)

// ─── Validation ─────────────────────────────────────────────────────────────

const requiredVars = [
  'DATABASE_URL',
  'DIRECT_URL',
  'JWT_SECRET'
]

// CORS must NEVER silently fall back to localhost outside development/test
if (!['development', 'test'].includes(NODE_ENV)) {
  requiredVars.push('CORS_ORIGIN')
}

const missing = requiredVars.filter(
  variable =>
    !config[variable] ||
    String(config[variable]).trim() === ''
)

if (missing.length) {
  throw new Error(
    `[CameroHealth Backend] Missing required environment variables: ${missing.join(', ')}`
  )
}

// ─── CORS ───────────────────────────────────────────────────────────────────

const defaultCorsOrigins =
  'http://localhost:4200,http://localhost:8000'

const CORS_ORIGIN =
  config.CORS_ORIGIN ||
  defaultCorsOrigins

// ─── Export ─────────────────────────────────────────────────────────────────

module.exports = {
  PORT: parseInt(config.PORT, 10) || 4000,

  NODE_ENV,

  DATABASE_URL: config.DATABASE_URL,
  DIRECT_URL: config.DIRECT_URL,

  JWT_SECRET: config.JWT_SECRET,
  JWT_EXPIRES_IN:
    config.JWT_EXPIRES_IN || '24h',

  CORS_ORIGIN,

  SUPABASE_URL:
    config.SUPABASE_URL || null,

  SUPABASE_SERVICE_KEY:
    config.SUPABASE_SERVICE_KEY || null,

  SUPABASE_STORAGE_BUCKET:
    config.SUPABASE_STORAGE_BUCKET || null,

  MTN_MOMO_SUBSCRIPTION_KEY:
    config.MTN_MOMO_SUBSCRIPTION_KEY || null,
  MTN_MOMO_API_USER:
    config.MTN_MOMO_API_USER || null,
  MTN_MOMO_API_KEY:
    config.MTN_MOMO_API_KEY || null,
  MTN_MOMO_ENV:
    config.MTN_MOMO_ENV || 'sandbox',
  MTN_MOMO_CALLBACK_HOST:
    config.MTN_MOMO_CALLBACK_HOST || null,

  ORANGE_MONEY_CLIENT_ID:
    config.ORANGE_MONEY_CLIENT_ID || null,
  ORANGE_MONEY_CLIENT_SECRET:
    config.ORANGE_MONEY_CLIENT_SECRET || null
}
