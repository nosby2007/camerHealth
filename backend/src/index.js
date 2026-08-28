// ─── CameroHealth — Express Server Entry ────────────────────────────────────

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const compression = require('compression')
const rateLimit = require('express-rate-limit')

const {
  PORT,
  CORS_ORIGIN,
  NODE_ENV
} = require('./config')

const prisma = require('./lib/prisma')

// ─── Routes ─────────────────────────────────────────────────────────────────

const authRoutes = require('./routes/auth')
const facilityRoutes = require('./routes/facilities')
const staffRoutes = require('./routes/staff')
const patientRoutes = require('./routes/patients')
const clinicalRoutes = require('./routes/clinical')
const appointmentRoutes = require('./routes/appointments')
const inpatientRoutes = require('./routes/inpatients')
const billingRoutes = require('./routes/billing')
const auditRoutes = require('./routes/audit')
const departmentRoutes = require('./routes/departments')
const catalogRoutes = require('./routes/catalog')
const flowsheetRoutes = require('./routes/flowsheets')
const clinicalNotesRoutes = require('./routes/clinical-notes')
const organizationRoutes = require('./routes/organizations')
const reportsRoutes = require('./routes/reports')
const platformRoutes = require('./routes/platform')
const leadRoutes = require('./routes/leads')
const woundCareRoutes = require('./routes/wound-care')
const carePlanRoutes = require('./routes/care-plans')
const mobileMoneyRoutes = require('./routes/mobile-money')

const app = express()

// ─── Global Middleware ──────────────────────────────────────────────────────

app.use(helmet())
app.use(compression())

app.use(
  morgan(
    NODE_ENV === 'production'
      ? 'combined'
      : 'dev'
  )
)

// ─── CORS ───────────────────────────────────────────────────────────────────

function normalizeOrigin(origin) {
  return String(origin)
    .trim()
    .replace(/\/+$/, '')
}

const allowedOrigins = CORS_ORIGIN
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean)

const unrestrictedCors =
  NODE_ENV === 'development' ||
  NODE_ENV === 'test'

console.log(
  `[CORS] Environment: ${NODE_ENV}`
)

console.log(
  `[CORS] Allowed origins: ${
    allowedOrigins.join(', ') || '(none)'
  }`
)

const corsOptions = {
  origin(origin, callback) {
    /**
     * Requests without Origin:
     * - curl
     * - Postman
     * - server-to-server
     * - some health checks
     */
    if (!origin) {
      return callback(null, true)
    }

    const normalizedOrigin =
      normalizeOrigin(origin)

    if (
      unrestrictedCors ||
      allowedOrigins.includes(normalizedOrigin)
    ) {
      return callback(null, true)
    }

    console.warn(
      `[CORS] BLOCKED origin="${normalizedOrigin}" allowed="${allowedOrigins.join(',')}"`
    )

    const error =
      new Error('Origin not allowed by CORS')

    error.status = 403

    return callback(error)
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Facility-ID'
  ],

  optionsSuccessStatus: 204
}

// app.use(cors()) handles preflight OPTIONS globally.
// No app.options('*', ...) required.
app.use(cors(corsOptions))

app.use(
  express.json({
    limit: '10mb'
  })
)

app.use(
  express.urlencoded({
    extended: true
  })
)

// ─── Root & Health Check ────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CameroHealth Backend REST API',
    version: '1.0.0',
    documentation: 'All endpoints are under /api/',
    healthCheck: '/api/health'
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CameroHealth API',
    version: '1.0.0',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  })
})

// ─── Rate Limiting ──────────────────────────────────────────────────────────

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 1000,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    error:
      'Too many requests. Please try again later.'
  }
})

app.use('/api/', globalLimiter)

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max:
    NODE_ENV === 'production'
      ? 20
      : 500,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    error:
      'Too many authentication attempts. Please try again later.'
  }
})

app.use(
  '/api/auth/',
  authLimiter
)

// ─── Routes ─────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes)
app.use('/api/facilities', facilityRoutes)
app.use('/api/staff', staffRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/clinical', clinicalRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/inpatients', inpatientRoutes)
app.use('/api/billing', billingRoutes)
app.use('/api/audit', auditRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/catalog', catalogRoutes)
app.use('/api/flowsheets', flowsheetRoutes)
app.use('/api', clinicalNotesRoutes) // exposes /api/vitals and /api/clinical-notes
app.use('/api/organizations', organizationRoutes)
app.use('/api', reportsRoutes) // exposes /api/rma/*
app.use('/api/platform', platformRoutes)
app.use('/api/leads', leadRoutes)
app.use('/api', woundCareRoutes) // exposes /api/patients/:patientId/wounds and /api/wounds/*
app.use('/api', carePlanRoutes) // exposes /api/care-plans/* and /api/care-plan-*
app.use('/api/mobile-money', mobileMoneyRoutes)

// ─── 404 Handler ────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found'
  })
})

// ─── Global Error Handler ───────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error(
    '[ERROR]',
    err.stack ||
    err.message ||
    err
  )

  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors
    })
  }

  if (
    err.name ===
    'PrismaClientKnownRequestError'
  ) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        error:
          'A record with this value already exists'
      })
    }

    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Record not found'
      })
    }
  }

  return res.status(
    err.status || 500
  ).json({
    error:
      err.message ||
      'Internal server error'
  })
})

// ─── Start Server ───────────────────────────────────────────────────────────

let server = null

async function main() {
  try {
    // Connect DB BEFORE accepting requests
    await prisma.$connect()

    console.log(
      '[DB] Connected to PostgreSQL (Supabase)'
    )

    // ─── File Storage (Supabase in cloud mode, MinIO in on-prem mode) ───────

    const storageService = require('./lib/storage')
    const { STORAGE_PROVIDER } = require('./config')

    try {
      await storageService.ensureReady()
      console.log(`[STORAGE] Ready (provider: ${STORAGE_PROVIDER})`)
    } catch (storageErr) {
      console.warn(`[STORAGE] Could not initialize ${STORAGE_PROVIDER} storage:`, storageErr.message)
    }

    // ─── Start HTTP Server ─────────────────────────────────────────────────

    server = app.listen(
      PORT,
      '0.0.0.0',
      () => {
        console.log(
          `[SERVER] CameroHealth API listening on port ${PORT}`
        )

        console.log(
          `[SERVER] Environment: ${NODE_ENV}`
        )

        console.log(
          `[SERVER] Local URL: http://localhost:${PORT}`
        )
      }
    )
  } catch (err) {
    console.error(
      '[STARTUP] CameroHealth failed to start:',
      err.stack ||
      err.message ||
      err
    )

    try {
      await prisma.$disconnect()
    } catch (_) {
      // Ignore shutdown errors during failed startup
    }

    process.exit(1)
  }
}

// ─── Graceful Shutdown ──────────────────────────────────────────────────────

async function shutdown(signal) {
  console.log(
    `[SHUTDOWN] ${signal} received`
  )

  if (server) {
    await new Promise(resolve => {
      server.close(resolve)
    })
  }

  try {
    await prisma.$disconnect()

    console.log(
      '[DB] PostgreSQL disconnected'
    )
  } catch (err) {
    console.error(
      '[DB] Error during disconnect:',
      err.message
    )
  }

  process.exit(0)
}

if (require.main === module) {
  main()

  process.once(
    'SIGTERM',
    () => shutdown('SIGTERM')
  )

  process.once(
    'SIGINT',
    () => shutdown('SIGINT')
  )
}

module.exports = app