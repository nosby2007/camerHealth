const { onRequest } = require('firebase-functions/v2/https')
const app = require('./src/index')

exports.api = onRequest({
  region: 'europe-west1',
  memory: '1GiB',
  timeoutSeconds: 120,
  minInstances: 0,
  maxInstances: 10,
  concurrency: 40,
  secrets: [
    'DATABASE_URL',
    'DIRECT_URL',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'CORS_ORIGIN',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'SUPABASE_STORAGE_BUCKET'
  ]
}, app)
