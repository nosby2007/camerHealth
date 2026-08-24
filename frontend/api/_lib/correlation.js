const crypto = require('crypto')

function getCorrelationId(req, res) {
  const header = req.headers['x-correlation-id'] || req.headers['x-request-id']
  const value = header && String(header).trim()
    ? String(header).trim()
    : crypto.randomUUID()

  res.setHeader('X-Correlation-Id', value)
  return value
}

module.exports = {
  getCorrelationId
}