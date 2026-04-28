async function insertAuditEvent(adminClient, payload) {
  try {
    const insertPayload = {
      facility_id: payload.facilityId,
      actor_staff_id: payload.actorStaffId || null,
      target_table: payload.targetTable || 'system',
      target_id: payload.targetId || null,
      action: payload.action,
      reason: payload.reason || null,
      old_values: payload.oldValues || null,
      new_values: payload.newValues || null,
      metadata: payload.metadata || {},
      status: 'recorded',
      created_by: payload.actorStaffId || null,
      updated_by: payload.actorStaffId || null
    }

    await adminClient.from('audit_logs').insert(insertPayload)
  } catch (error) {
    console.error('[audit] unable to persist audit event', {
      action: payload.action,
      code: error && error.code,
      message: error && error.message
    })
  }
}

module.exports = {
  insertAuditEvent
}