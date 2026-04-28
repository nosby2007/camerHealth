function json(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function badRequest(res, message, code = 'INVALID_REQUEST', details = null) {
  return json(res, 400, {
    ok: false,
    code,
    message,
    details
  })
}

function unauthorized(res, message = 'Authentication required.', code = 'UNAUTHORIZED') {
  return json(res, 401, {
    ok: false,
    code,
    message
  })
}

function forbidden(res, message = 'Access denied.', code = 'FORBIDDEN') {
  return json(res, 403, {
    ok: false,
    code,
    message
  })
}

function conflict(res, message, code = 'CONFLICT') {
  return json(res, 409, {
    ok: false,
    code,
    message
  })
}

function tooManyRequests(res, message = 'Too many requests. Please retry later.') {
  return json(res, 429, {
    ok: false,
    code: 'RATE_LIMITED',
    message
  })
}

function internalServerError(res, message = 'Internal server error.', code = 'SERVER_ERROR') {
  return json(res, 500, {
    ok: false,
    code,
    message
  })
}

function methodNotAllowed(res, methods) {
  res.setHeader('Allow', methods.join(', '))
  return json(res, 405, {
    ok: false,
    code: 'METHOD_NOT_ALLOWED',
    message: `Method not allowed. Allowed methods: ${methods.join(', ')}`
  })
}

module.exports = {
  json,
  badRequest,
  unauthorized,
  forbidden,
  conflict,
  tooManyRequests,
  internalServerError,
  methodNotAllowed
}