function json(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function errorPayload(code, message, correlationId, details = null) {
  return {
    ok: false,
    code,
    message,
    correlationId,
    details
  }
}

function badRequest(res, message, code = 'INVALID_REQUEST', details = null, correlationId = null) {
  return json(res, 400, errorPayload(code, message, correlationId, details))
}

function unauthorized(res, message = 'Authentication required.', code = 'UNAUTHORIZED', correlationId = null) {
  return json(res, 401, errorPayload(code, message, correlationId))
}

function forbidden(res, message = 'Access denied.', code = 'FORBIDDEN', correlationId = null) {
  return json(res, 403, errorPayload(code, message, correlationId))
}

function conflict(res, message, code = 'CONFLICT', correlationId = null) {
  return json(res, 409, errorPayload(code, message, correlationId))
}

function tooManyRequests(res, message = 'Too many requests. Please retry later.', correlationId = null) {
  return json(res, 429, errorPayload('RATE_LIMITED', message, correlationId))
}

function internalServerError(res, message = 'Internal server error.', code = 'SERVER_ERROR', correlationId = null) {
  return json(res, 500, errorPayload(code, message, correlationId))
}

function serviceUnavailable(res, message = 'Backend service unavailable.', code = 'BACKEND_UNAVAILABLE', correlationId = null) {
  return json(res, 503, errorPayload(code, message, correlationId))
}

function methodNotAllowed(res, methods, correlationId = null) {
  res.setHeader('Allow', methods.join(', '))
  return json(res, 405, errorPayload('METHOD_NOT_ALLOWED', `Method not allowed. Allowed methods: ${methods.join(', ')}`, correlationId))
}

module.exports = {
  json,
  errorPayload,
  badRequest,
  unauthorized,
  forbidden,
  conflict,
  tooManyRequests,
  internalServerError,
  serviceUnavailable,
  methodNotAllowed
}