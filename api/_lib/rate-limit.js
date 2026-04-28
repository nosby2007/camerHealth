const BUCKET = new Map()

function buildKey(req, scope) {
  const forwarded = req.headers['x-forwarded-for']
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : (forwarded || req.socket.remoteAddress || 'unknown-ip')
  return `${scope}:${ip}`
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

module.exports = {
  enforceRateLimit
}