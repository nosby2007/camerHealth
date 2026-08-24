function sanitizeMetadata(metadata) {
  const result = {}
  const source = metadata && typeof metadata === 'object' ? metadata : {}

  Object.keys(source).forEach((key) => {
    const lowered = key.toLowerCase()
    if (lowered.includes('password') || lowered.includes('token') || lowered.includes('secret') || lowered.includes('key')) {
      return
    }
    result[key] = source[key]
  })

  return result
}

async function insertAuditEvent(adminClient, payload, options = {}) {
  const strict = Boolean(options.strict)
  const insertPayload = {
    facility_id: payload.facilityId,
    actor_staff_id: payload.actorStaffId || null,
    target_table: payload.targetTable || 'system',
    target_id: payload.targetId || null,
    action: payload.action,
    reason: payload.reason || null,
    old_values: payload.oldValues || null,
    new_values: payload.newValues || null,
    metadata: sanitizeMetadata({
      endpoint: payload.endpoint || null,
      correlationId: payload.correlationId || null,
      actorAuthUserId: payload.actorAuthUserId || null,
      errorCategory: payload.errorCategory || null,
      ...payload.metadata
    }),
    status: payload.status || 'recorded',
    created_by: payload.actorStaffId || null,
    updated_by: payload.actorStaffId || null
  }

  const { error } = await adminClient.from('audit_logs').insert(insertPayload)
  if (error) {
    console.error('[audit] unable to persist audit event', {
      action: payload.action,
      code: error.code,
      message: error.message,
      correlationId: payload.correlationId || null
    })
    if (strict) {
      const err = new Error('AUDIT_PERSIST_FAILED')
      err.code = 'AUDIT_PERSIST_FAILED'
      err.cause = error
      throw err
    }
    return { ok: false, error }
  }

  return { ok: true }
}

module.exports = {
  sanitizeMetadata,
  insertAuditEvent
}