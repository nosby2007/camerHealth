const { getSupabaseAdminClient, findAuthUserByEmail } = require('../../_lib/supabase-admin')
const { requireActiveAdminCaller } = require('../../_lib/caller-context')
const { insertAuditEvent } = require('../../_lib/audit')
const { validateInvitePayload, randomCode } = require('../../_lib/request')
const {
  json,
  badRequest,
  conflict,
  internalServerError,
  serviceUnavailable,
  methodNotAllowed,
  tooManyRequests
} = require('../../_lib/http')
const { enforceRateLimits, rateLimitStrategyInfo } = require('../../_lib/rate-limit')
const { getCorrelationId } = require('../../_lib/correlation')
const { beginIdempotency, completeIdempotency } = require('../../_lib/idempotency')

const ALLOWED_ROLES = ['ADMIN', 'DOCTOR', 'NURSE', 'LAB', 'IMAGING']
const INVITE_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
  FAILED: 'failed'
}

module.exports = async (req, res) => {
  const correlationId = getCorrelationId(req, res)
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'], correlationId)

  const body = req.body || {}
  const inviteValidation = validateInvitePayload(body, ALLOWED_ROLES)
  const inviteEmail = inviteValidation.value.email || 'unknown'

  const limit = enforceRateLimits(req, [
    { scope: 'admin-staff-invite:ip', max: 20, windowMs: 60 * 1000 },
    { scope: `admin-staff-invite:email:${inviteEmail}`, max: 5, windowMs: 60 * 1000 }
  ])

  if (limit.limited) {
    res.setHeader('Retry-After', String(limit.retryAfterSeconds))
    return tooManyRequests(res, 'Too many invitation attempts. Please retry later.', correlationId)
  }

  if (!inviteValidation.valid) {
    return badRequest(res, inviteValidation.errors.join(' '), 'INVALID_INVITE_PAYLOAD', {
      missing: inviteValidation.missing,
      errors: inviteValidation.errors
    }, correlationId)
  }

  const payload = inviteValidation.value

  let adminClient
  try {
    adminClient = getSupabaseAdminClient()
  } catch (error) {
    return serviceUnavailable(res, 'Invite backend is unavailable due to missing server configuration.', 'INVITE_BACKEND_UNAVAILABLE', correlationId)
  }

  const caller = await requireActiveAdminCaller({ req, res, adminClient })
  if (!caller) return

  const callerFacilityId = caller.staffProfile.facility_id
  const callerStaffId = caller.staffProfile.id
  const callerAuthUserId = caller.authUser.id

  let idem
  try {
    idem = await beginIdempotency({
      req,
      adminClient,
      endpoint: '/api/admin/staff/invite',
      requesterId: callerAuthUserId,
      body: payload
    })
  } catch (error) {
    return internalServerError(res, 'Unable to initialize idempotency guard.', 'IDEMPOTENCY_INIT_FAILED', correlationId)
  }

  if (idem && idem.conflict) {
    return conflict(res, 'Idempotency key already used with a different request payload.', 'IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD', correlationId)
  }

  if (idem && idem.inProgress) {
    return conflict(res, 'A request with this idempotency key is already being processed.', 'IDEMPOTENCY_REQUEST_IN_PROGRESS', correlationId)
  }

  if (idem && idem.replay) {
    return json(res, 200, {
      ...idem.cachedResponse,
      replayed: true,
      correlationId
    })
  }

  try {
    const inviteExpiresAt = new Date(Date.now() + (72 * 60 * 60 * 1000)).toISOString()
    const existingUser = await findAuthUserByEmail(adminClient, payload.email)
    let authUserId = existingUser ? existingUser.id : null
    let authUserCreated = false

    const staffCode = payload.staffCode || randomCode('STF')
    const fullName = `${payload.firstName} ${payload.lastName}`.trim()

    const { data: existingInvite } = await adminClient
      .from('pending_staff_invites')
      .select('id, status, expires_at, auth_user_id, staff_profile_id, role')
      .eq('facility_id', callerFacilityId)
      .eq('email', payload.email)
      .eq('staff_code', staffCode)
      .maybeSingle()

    if (existingInvite && existingInvite.status === INVITE_STATUS.ACCEPTED) {
      const responseBody = {
        ok: false,
        code: 'INVITE_ALREADY_ACCEPTED',
        message: 'This staff invitation has already been accepted.',
        correlationId,
        status: INVITE_STATUS.ACCEPTED
      }
      await completeIdempotency(adminClient, idem, { status: 'failed', responseBody })
      return conflict(res, responseBody.message, responseBody.code, correlationId)
    }

    const now = Date.now()
    const existingInviteExpired = existingInvite && existingInvite.expires_at
      ? new Date(existingInvite.expires_at).getTime() < now
      : false

    let inviteAction = 'AUTH_STAFF_INVITED'
    if (existingInvite && existingInvite.status === INVITE_STATUS.PENDING && !existingInviteExpired) {
      inviteAction = 'AUTH_STAFF_INVITE_RESENT'
    }

    if (existingInvite && existingInviteExpired && existingInvite.status === INVITE_STATUS.PENDING) {
      await adminClient
        .from('pending_staff_invites')
        .update({ status: INVITE_STATUS.EXPIRED })
        .eq('id', existingInvite.id)
    }

    if (!existingUser) {
      const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(payload.email, {
        data: {
          first_name: payload.firstName,
          last_name: payload.lastName,
          requested_role: payload.role,
          invited_by_staff_profile_id: callerStaffId,
          invited_facility_id: callerFacilityId,
          source: '/api/admin/staff/invite'
        }
      })

      if (inviteError || !inviteData || !inviteData.user) {
        await insertAuditEvent(adminClient, {
          facilityId: callerFacilityId,
          actorStaffId: callerStaffId,
          actorAuthUserId: callerAuthUserId,
          targetTable: 'staff_profiles',
          targetId: null,
          action: 'AUTH_STAFF_INVITE_FAILED',
          reason: 'Supabase Auth invite failed.',
          endpoint: '/api/admin/staff/invite',
          correlationId,
          errorCategory: inviteError && inviteError.code,
          metadata: {
            role: payload.role,
            email: payload.email,
            code: inviteError && inviteError.code,
            rateLimit: rateLimitStrategyInfo()
          }
        })

        const responseBody = {
          ok: false,
          code: 'INVITE_AUTH_FAILED',
          message: 'Unable to invite staff at this time.',
          correlationId,
          status: INVITE_STATUS.FAILED
        }
        await completeIdempotency(adminClient, idem, { status: 'failed', responseBody })
        return internalServerError(res, responseBody.message, responseBody.code, correlationId)
      }

      authUserId = inviteData.user.id
      authUserCreated = true
    }

    const { data: existingProfile } = await adminClient
      .from('staff_profiles')
      .select('id, status, role, facility_id, staff_code, email, full_name')
      .eq('facility_id', callerFacilityId)
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    let profile = existingProfile || null
    let accountCreated = false

    if (!existingProfile) {
      const { data: profileInsert, error: profileError } = await adminClient
        .from('staff_profiles')
        .insert({
          auth_user_id: authUserId,
          facility_id: callerFacilityId,
          staff_code: staffCode,
          full_name: fullName,
          email: payload.email,
          role: payload.role,
          phone: payload.phone,
          status: 'inactive',
          created_by: callerStaffId,
          updated_by: callerStaffId
        })
        .select('id, facility_id, staff_code, full_name, email, role, status, created_at')
        .single()

      if (profileError) {
        if (authUserCreated) {
          await adminClient.auth.admin.deleteUser(authUserId).catch(() => {})
        }

        await insertAuditEvent(adminClient, {
          facilityId: callerFacilityId,
          actorStaffId: callerStaffId,
          actorAuthUserId: callerAuthUserId,
          targetTable: 'staff_profiles',
          targetId: null,
          action: 'AUTH_STAFF_INVITE_FAILED',
          reason: 'Staff profile creation failed during invite flow.',
          endpoint: '/api/admin/staff/invite',
          correlationId,
          errorCategory: profileError.code,
          metadata: {
            role: payload.role,
            email: payload.email,
            staffCode,
            authUserRollbackAttempted: authUserCreated
          }
        })

        if (profileError.code === '23505') {
          const responseBody = {
            ok: false,
            code: 'INVITE_CONFLICT',
            message: 'Staff invite conflicts with existing email/staff code/account.',
            correlationId,
            status: INVITE_STATUS.FAILED
          }
          await completeIdempotency(adminClient, idem, { status: 'failed', responseBody })
          return conflict(res, responseBody.message, responseBody.code, correlationId)
        }

        const responseBody = {
          ok: false,
          code: 'INVITE_PROFILE_CREATE_FAILED',
          message: 'Unable to create invited staff profile.',
          correlationId,
          status: INVITE_STATUS.FAILED
        }
        await completeIdempotency(adminClient, idem, { status: 'failed', responseBody })
        return internalServerError(res, responseBody.message, responseBody.code, correlationId)
      }

      profile = profileInsert
      accountCreated = true
    }

    const inviteUpsertPayload = {
      facility_id: callerFacilityId,
      email: payload.email,
      staff_code: staffCode,
      role: payload.role,
      first_name: payload.firstName,
      last_name: payload.lastName,
      phone: payload.phone,
      title: payload.title || null,
      department: payload.department || null,
      invited_by_staff_id: callerStaffId,
      auth_user_id: authUserId,
      staff_profile_id: profile.id,
      status: INVITE_STATUS.PENDING,
      expires_at: inviteExpiresAt,
      metadata: {
        endpoint: '/api/admin/staff/invite',
        correlationId
      }
    }

    const { error: inviteStateError } = await adminClient
      .from('pending_staff_invites')
      .upsert(inviteUpsertPayload, { onConflict: 'facility_id,email,staff_code' })

    if (inviteStateError) {
      await insertAuditEvent(adminClient, {
        facilityId: callerFacilityId,
        actorStaffId: callerStaffId,
        actorAuthUserId: callerAuthUserId,
        targetTable: 'pending_staff_invites',
        targetId: null,
        action: 'AUTH_STAFF_INVITE_FAILED',
        reason: 'Unable to persist invite lifecycle state.',
        endpoint: '/api/admin/staff/invite',
        correlationId,
        errorCategory: inviteStateError.code,
        metadata: {
          role: payload.role,
          email: payload.email,
          staffCode
        }
      })

      const responseBody = {
        ok: false,
        code: 'INVITE_STATE_PERSIST_FAILED',
        message: 'Unable to persist invitation state.',
        correlationId,
        status: INVITE_STATUS.FAILED
      }
      await completeIdempotency(adminClient, idem, { status: 'failed', responseBody })
      return internalServerError(res, responseBody.message, responseBody.code, correlationId)
    }

    const eventAction = inviteAction

    await insertAuditEvent(adminClient, {
      facilityId: callerFacilityId,
      actorStaffId: callerStaffId,
      actorAuthUserId: callerAuthUserId,
      targetTable: 'staff_profiles',
      targetId: profile.id,
      action: eventAction,
      reason: 'Staff invitation lifecycle event by active facility admin.',
      endpoint: '/api/admin/staff/invite',
      correlationId,
      metadata: {
        role: payload.role,
        email: payload.email,
        authUserId,
        inviteStatus: INVITE_STATUS.PENDING
      }
    })

    if (accountCreated) {
      await insertAuditEvent(adminClient, {
        facilityId: callerFacilityId,
        actorStaffId: callerStaffId,
        actorAuthUserId: callerAuthUserId,
        targetTable: 'staff_profiles',
        targetId: profile.id,
        action: 'AUTH_ACCOUNT_CREATED',
        reason: 'Staff profile created for invited account.',
        endpoint: '/api/admin/staff/invite',
        correlationId,
        metadata: {
          role: payload.role,
          email: payload.email,
          authUserId
        }
      })
    }

    const responseBody = {
      ok: true,
      code: 'STAFF_INVITED',
      status: INVITE_STATUS.PENDING,
      correlationId,
      data: {
        profile: {
          id: profile.id,
          facilityId: profile.facility_id,
          staffCode: profile.staff_code,
          fullName: profile.full_name,
          email: profile.email,
          role: profile.role,
          status: profile.status
        },
        invite: {
          email: payload.email,
          role: payload.role,
          status: INVITE_STATUS.PENDING,
          expiresAt: inviteExpiresAt,
          action: eventAction
        }
      }
    }

    await completeIdempotency(adminClient, idem, { status: 'completed', responseBody })

    return json(res, 201, responseBody)
  } catch (error) {
    await insertAuditEvent(adminClient, {
      facilityId: callerFacilityId,
      actorStaffId: callerStaffId,
      actorAuthUserId: callerAuthUserId,
      targetTable: 'staff_profiles',
      targetId: null,
      action: 'AUTH_STAFF_INVITE_FAILED',
      reason: 'Unexpected server error in invite endpoint.',
      endpoint: '/api/admin/staff/invite',
      correlationId,
      errorCategory: (error && error.code) || 'UNEXPECTED_ERROR',
      metadata: {
        rateLimit: rateLimitStrategyInfo()
      }
    })

    const responseBody = {
      ok: false,
      code: 'INVITE_FAILED',
      message: 'Staff invite failed. Please retry later.',
      correlationId,
      status: INVITE_STATUS.FAILED
    }

    await completeIdempotency(adminClient, idem, { status: 'failed', responseBody }).catch(() => {})
    return internalServerError(res, responseBody.message, responseBody.code, correlationId)
  }
}