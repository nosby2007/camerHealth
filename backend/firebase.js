const { onRequest } = require('firebase-functions/v2/https')

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
}, (request, response) => {
  // Secret Manager values are available when the function handles a request,
  // but not while the Firebase CLI is discovering exported functions.
  const app = require('./src/index')
  return app(request, response)
})
