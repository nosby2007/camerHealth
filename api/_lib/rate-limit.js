const BUCKET = new Map()
const { optionalEnv } = require('./env')

function buildKey(req, scope) {
  const forwarded = req.headers['x-forwarded-for']
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : (forwarded || req.socket.remoteAddress || 'unknown-ip')
  return `${scope}:${ip}`
}

function normalizeIdentity(value) {
  if (value === null || value === undefined || value === '') return 'anonymous'
  return String(value).trim().toLowerCase()
}

function enforceRateLimit(req, scope, options = {}) {
  const max = typeof options.max === 'number' ? options.max : 10
  const windowMs = typeof options.windowMs === 'number' ? options.windowMs : 60 * 1000
  const now = Date.now()
  const key = buildKey(req, scope)
  const current = BUCKET.get(key)

  if (!current || now > current.resetAt) {
    BUCKET.set(key, { count: 1, resetAt: now + windowMs })
    return { limited: false }
  }

  current.count += 1
  if (current.count > max) {
    return {
      limited: true,
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000)
    }
  }

  return { limited: false }
}

function enforceRateLimits(req, rules = []) {
  for (const rule of rules) {
    const limit = enforceRateLimit(req, rule.scope, {
      max: rule.max,
      windowMs: rule.windowMs
    })
    if (limit.limited) return { limited: true, scope: rule.scope, retryAfterSeconds: limit.retryAfterSeconds }
  }
  return { limited: false }
}

function rateLimitStrategyInfo() {
  return {
    strategy: optionalEnv('RATE_LIMIT_STRATEGY', 'memory'),
    distributedReady: false,
    note: 'Memory limiter is for local/staging only. Use Redis/Upstash/Vercel KV/Supabase-backed limiter before production cutover.'
  }
}

module.exports = {
  normalizeIdentity,
  enforceRateLimit,
  enforceRateLimits,
  rateLimitStrategyInfo
}