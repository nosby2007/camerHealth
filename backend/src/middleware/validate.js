// ─── CameroHealth — Zod Validation Middleware ───────────────────────────────
const { z } = require('zod')

/**
 * Middleware factory that validates request body against a Zod schema.
 * @param {z.ZodSchema} schema - Zod schema to validate against
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body)
      req.body = parsed
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        })
      }
      next(error)
    }
  }
}

module.exports = { validate }
