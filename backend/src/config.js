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

// ─── Deployment mode ────────────────────────────────────────────────────────
// DEPLOYMENT_MODE=cloud (default) — CameroHealth's own managed infrastructure.
// DEPLOYMENT_MODE=onprem — installed on a hospital's own server; storage and
// database are local, and CLOUD_PATIENT_SYNC must stay false so no clinical
// data leaves the hospital network. See docs/onprem/ARCHITECTURE.md.
const DEPLOYMENT_MODE = config.DEPLOYMENT_MODE === 'onprem' ? 'onprem' : 'cloud'
const DATA_RESIDENCY = config.DATA_RESIDENCY === 'LOCAL' ? 'LOCAL' : 'CLOUD'
const CLOUD_PATIENT_SYNC = String(config.CLOUD_PATIENT_SYNC).toLowerCase() === 'true'

// Refuse to start with a self-contradictory deployment configuration rather
// than silently doing the wrong thing with clinical data.
if (DEPLOYMENT_MODE === 'onprem' && DATA_RESIDENCY === 'LOCAL' && CLOUD_PATIENT_SYNC) {
  throw new Error(
    '[CameroHealth Backend] Invalid configuration: DEPLOYMENT_MODE=onprem with ' +
    'DATA_RESIDENCY=LOCAL requires CLOUD_PATIENT_SYNC=false. This combination would ' +
    'send patient data to external infrastructure from what is declared as a ' +
    'local-only, on-premise install — refusing to start.'
  )
}
if (DEPLOYMENT_MODE === 'onprem' && DATA_RESIDENCY === 'CLOUD') {
  // eslint-disable-next-line no-console
  console.warn(
    '[CameroHealth Backend] WARNING: DEPLOYMENT_MODE=onprem but DATA_RESIDENCY=CLOUD. ' +
    'This is an on-premise install that has NOT declared local data residency — ' +
    'confirm this is intentional.'
  )
}

const STORAGE_PROVIDER = config.STORAGE_PROVIDER === 'minio' ? 'minio' : 'supabase'

// ─── Export ─────────────────────────────────────────────────────────────────

module.exports = {
  PORT: parseInt(config.PORT, 10) || 4000,

  NODE_ENV,

  DEPLOYMENT_MODE,
  DATA_RESIDENCY,
  CLOUD_PATIENT_SYNC,
  HOSPITAL_ID: config.HOSPITAL_ID || null,
  HOSPITAL_NAME: config.HOSPITAL_NAME || null,
  CAMEROHEALTH_VERSION: config.CAMEROHEALTH_VERSION || '1.0.0',

  STORAGE_PROVIDER,
  MINIO_ENDPOINT: config.MINIO_ENDPOINT || null,
  MINIO_ACCESS_KEY: config.MINIO_ACCESS_KEY || null,
  MINIO_SECRET_KEY: config.MINIO_SECRET_KEY || null,
  MINIO_BUCKET: config.MINIO_BUCKET || 'camerohealth',
  MINIO_USE_SSL: String(config.MINIO_USE_SSL).toLowerCase() === 'true',

  TELEMETRY_ENABLED: String(config.TELEMETRY_ENABLED).toLowerCase() === 'true',

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
