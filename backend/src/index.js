// ─── CameroHealth — Express Server Entry ────────────────────────────────────
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const compression = require('compression')
const rateLimit = require('express-rate-limit')

const { PORT, CORS_ORIGIN, NODE_ENV } = require('./config')
const prisma = require('./lib/prisma')

// Routes
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

const app = express()

// ─── Global Middleware ──────────────────────────────────────────────────────
app.use(helmet())
app.use(compression())
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(cors({
  origin: true, // Allow any origin in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Facility-ID']
}))
app.options('*', cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── Rate Limiting ─────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { error: 'Too many requests. Please try again later.' }
})
app.use('/api/', globalLimiter)

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: NODE_ENV === 'production' ? 20 : 500,
  message: { error: 'Too many authentication attempts. Please try again later.' }
})
app.use('/api/auth/', authLimiter)

// ─── Root & Health Check ──────────────────────────────────────────────────
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
    timestamp: new Date().toISOString()
  })
})

// ─── Routes ────────────────────────────────────────────────────────────────
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

// ─── 404 Handler ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ─── Global Error Handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message || err)

  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors
    })
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: 'A record with this value already exists'
      })
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Record not found'
      })
    }
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  })
})

// ─── Start Server ──────────────────────────────────────────────────────────
async function main() {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] CameroHealth API running on http://127.0.0.1:${PORT} and http://localhost:${PORT}`)
    console.log(`[SERVER] Environment: ${NODE_ENV}`)
  })

  try {
    await prisma.$connect()
    console.log('[DB] Connected to PostgreSQL (Supabase)')

    const { ensureStorageBucket } = require('./lib/supabase')
    const storageBucket = process.env.SUPABASE_STORAGE_BUCKET
    if (storageBucket) {
      try {
        await ensureStorageBucket(storageBucket)
        console.log(`[SUPABASE] Ensured storage bucket exists: ${storageBucket}`)
      } catch (bucketErr) {
        console.warn('[SUPABASE] Could not ensure storage bucket:', bucketErr.message)
      }
    } else {
      console.warn('[SUPABASE] SUPABASE_STORAGE_BUCKET is not configured; image upload may fail.')
    }

    // One-time cleanup: delete all existing lab/imaging orders and their charges
    const deleted = await prisma.$transaction([
      prisma.charge.deleteMany({ where: { sourceType: { in: ['lab_order', 'imaging_order'] } } }),
      prisma.labOrder.deleteMany({}),
      prisma.imagingOrder.deleteMany({})
    ])
    console.log(`[CLEANUP] Deleted lab/imaging orders and charges:`, deleted.map(r => r.count))
    // Recalc all invoice statuses and close Open charges on fully-paid invoices
    const allInvoices = await prisma.invoice.findMany({ include: { charges: true, payments: true } })
    for (const inv of allInvoices) {
      const totalCharges = inv.charges.filter(c => c.status === 'Open').reduce((s, c) => s + c.total, 0)
      const totalPaid = inv.payments.reduce((s, p) => s + p.amount, 0)
      const isFullyPaid = totalPaid > 0 && totalPaid >= totalCharges
      if (isFullyPaid) {
        await prisma.invoice.update({ where: { id: inv.id }, data: { status: 'Paid' } })
        await prisma.charge.updateMany({ where: { invoiceId: inv.id, status: 'Open' }, data: { status: 'Waived' } })
      }
    }
    console.log('[BILLING] Invoice status reconciliation complete')
  } catch (err) {
    console.warn('[DB] Connection warning:', err.message)
  }
}

main()

// ─── Graceful Shutdown ─────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('[SHUTDOWN] SIGTERM received')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('[SHUTDOWN] SIGINT received')
  await prisma.$disconnect()
  process.exit(0)
})

module.exports = app
