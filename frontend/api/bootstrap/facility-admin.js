const { getSupabaseAdminClient, findAuthUserByEmail } = require('../_lib/supabase-admin')
const { validateBootstrapPayload, randomCode } = require('../_lib/request')
const { insertAuditEvent } = require('../_lib/audit')
const {
  json,
  badRequest,
  conflict,
  internalServerError,
  serviceUnavailable,
  methodNotAllowed,
  tooManyRequests
} = require('../_lib/http')
const { enforceRateLimits, rateLimitStrategyInfo } = require('../_lib/rate-limit')
const { getCorrelationId } = require('../_lib/correlation')
const { beginIdempotency, completeIdempotency } = require('../_lib/idempotency')

module.exports = async (req, res) => {
  const correlationId = getCorrelationId(req, res)
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'], correlationId)

  const body = req.body || {}
  const bootstrapValidation = validateBootstrapPayload(body)

  const limit = enforceRateLimits(req, [
    { scope: 'bootstrap-facility-admin:ip', max: 5, windowMs: 60 * 1000 },
    { scope: `bootstrap-facility-admin:email:${(bootstrapValidation.value.adminEmail || 'unknown').toLowerCase()}`, max: 3, windowMs: 60 * 1000 }
  ])

  if (limit.limited) {
    res.setHeader('Retry-After', String(limit.retryAfterSeconds))
    return tooManyRequests(res, 'Too many bootstrap attempts. Please retry later.', correlationId)
  }

  if (!bootstrapValidation.valid) {
    return badRequest(res, bootstrapValidation.errors.join(' '), 'INVALID_BOOTSTRAP_PAYLOAD', {
      missing: bootstrapValidation.missing,
      errors: bootstrapValidation.errors
    }, correlationId)
  }

  const payload = bootstrapValidation.value
  let adminClient
  try {
    adminClient = getSupabaseAdminClient()
  } catch (error) {
    return serviceUnavailable(res, 'Bootstrap backend is unavailable due to missing server configuration.', 'BOOTSTRAP_BACKEND_UNAVAILABLE', correlationId)
  }

  let idem
  try {
    idem = await beginIdempotency({
      req,
      adminClient,
      endpoint: '/api/bootstrap/facility-admin',
      requesterId: payload.adminEmail,
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

  let authUser = null
  let facility = null
  let staffProfile = null
  let authUserCreated = false
  let facilityCreated = false
  let compensation = {
    authUserDeleted: false,
    facilityMarkedInactive: false
  }

  try {
    const existing = await findAuthUserByEmail(adminClient, payload.adminEmail)
    if (existing) {
      authUser = existing
    } else {
      const { data: createdUserData, error: createdUserError } = await adminClient.auth.admin.createUser({
        email: payload.adminEmail,
        password: payload.adminPassword,
        email_confirm: false,
        user_metadata: {
          first_name: payload.adminFirstName,
          last_name: payload.adminLastName,
          source: 'facility-bootstrap-api'
        }
      })

      if (createdUserError || !createdUserData || !createdUserData.user) {
        const responseBody = {
          ok: false,
          code: 'BOOTSTRAP_AUTH_CREATE_FAILED',
          message: 'Unable to create bootstrap auth user.',
          correlationId
        }
        await completeIdempotency(adminClient, idem, { status: 'failed', responseBody })
        return internalServerError(res, responseBody.message, responseBody.code, correlationId)
      }
      authUser = createdUserData.user
      authUserCreated = true
    }

    const adminStatus = authUser.email_confirmed_at ? 'active' : 'inactive'

    const { data: facilityInsert, error: facilityError } = await adminClient
      .from('facilities')
      .insert({
        code: randomCode('FAC'),
        name: payload.facilityName,
        region: payload.region,
        city: null,
        quarter: payload.address,
        email: payload.adminEmail,
        phone: payload.adminPhone,
        status: 'active'
      })
      .select('id, code, name, region, city, quarter, email, status, created_at')
      .single()

    if (facilityError) {
      if (authUserCreated) {
        await adminClient.auth.admin.deleteUser(authUser.id).then(() => {
          compensation.authUserDeleted = true
        }).catch(() => {})
      }

      await insertAuditEvent(adminClient, {
        facilityId: null,
        actorStaffId: null,
        actorAuthUserId: authUser ? authUser.id : null,
        targetTable: 'facilities',
        action: 'BOOTSTRAP_FAILED',
        reason: 'Facility insert failed during bootstrap.',
        endpoint: '/api/bootstrap/facility-admin',
        correlationId,
        errorCategory: facilityError.code || 'FACILITY_INSERT_ERROR',
        metadata: {
          compensation,
          rateLimit: rateLimitStrategyInfo()
        }
      })

      if (facilityError.code === '23505') {
        const responseBody = {
          ok: false,
          code: 'FACILITY_CONFLICT',
          message: 'Facility already exists with conflicting unique values.',
          correlationId,
          status: 'failed'
        }
        await completeIdempotency(adminClient, idem, { status: 'failed', responseBody })
        return conflict(res, responseBody.message, responseBody.code, correlationId)
      }

      const responseBody = {
        ok: false,
        code: 'FACILITY_CREATE_FAILED',
        message: 'Unable to create facility record.',
        correlationId,
        status: 'failed'
      }
      await completeIdempotency(adminClient, idem, { status: 'failed', responseBody })
      return internalServerError(res, responseBody.message, responseBody.code, correlationId)
    }
    facility = facilityInsert
    facilityCreated = true

    const { data: profileInsert, error: profileError } = await adminClient
      .from('staff_profiles')
      .insert({
        auth_user_id: authUser.id,
        facility_id: facility.id,
        staff_code: randomCode('ADM'),
        full_name: `${payload.adminFirstName} ${payload.adminLastName}`.trim(),
        email: payload.adminEmail,
        role: 'ADMIN',
        phone: payload.adminPhone,
        status: adminStatus
      })
      .select('id, facility_id, staff_code, full_name, email, role, status, created_at')
      .single()

    if (profileError) {
      if (facilityCreated) {
        await adminClient.from('facilities').update({ status: 'inactive' }).eq('id', facility.id)
          .then(() => {
            compensation.facilityMarkedInactive = true
          })
          .catch(() => {})
      }

      if (authUserCreated) {
        await adminClient.auth.admin.deleteUser(authUser.id)
          .then(() => {
            compensation.authUserDeleted = true
          })
          .catch(() => {})
      }

      await insertAuditEvent(adminClient, {
        facilityId: facility ? facility.id : null,
        actorStaffId: null,
        actorAuthUserId: authUser ? authUser.id : null,
        targetTable: 'staff_profiles',
        action: 'BOOTSTRAP_FAILED',
        reason: 'Admin staff profile insert failed during bootstrap.',
        endpoint: '/api/bootstrap/facility-admin',
        correlationId,
        errorCategory: profileError.code || 'PROFILE_INSERT_ERROR',
        metadata: {
          compensation,
          facilityId: facility ? facility.id : null
        }
      })

      if (profileError.code === '23505') {
        const responseBody = {
          ok: false,
          code: 'ADMIN_PROFILE_CONFLICT',
          message: 'Admin staff profile already exists for this auth user or facility.',
          correlationId,
          status: 'failed'
        }
        await completeIdempotency(adminClient, idem, { status: 'failed', responseBody })
        return conflict(res, responseBody.message, responseBody.code, correlationId)
      }

      const responseBody = {
        ok: false,
        code: 'ADMIN_PROFILE_CREATE_FAILED',
        message: 'Unable to create admin staff profile.',
        correlationId,
        status: 'failed'
      }
      await completeIdempotency(adminClient, idem, { status: 'failed', responseBody })
      return internalServerError(res, responseBody.message, responseBody.code, correlationId)
    }
    staffProfile = profileInsert

    await adminClient.from('facility_settings').upsert({
      facility_id: facility.id,
      settings_key: 'general',
      settings_value: {
        facilityType: payload.facilityType,
        bootstrapSource: 'api/bootstrap/facility-admin',
        bootstrapAt: new Date().toISOString(),
        bootstrapStatus: 'completed'
      },
      status: 'active',
      created_by: staffProfile.id,
      updated_by: staffProfile.id
    }, {
      onConflict: 'facility_id,settings_key'
    })

    await insertAuditEvent(adminClient, {
      facilityId: facility.id,
      actorStaffId: staffProfile.id,
      actorAuthUserId: authUser.id,
      targetTable: 'facilities',
      targetId: facility.id,
      action: 'FACILITY_REGISTERED',
      reason: 'Facility created through secure bootstrap endpoint.',
      endpoint: '/api/bootstrap/facility-admin',
      correlationId,
      metadata: {
        authUserId: authUser.id,
        bootstrapStatus: 'completed'
      }
    }, { strict: true })

    await insertAuditEvent(adminClient, {
      facilityId: facility.id,
      actorStaffId: staffProfile.id,
      actorAuthUserId: authUser.id,
      targetTable: 'staff_profiles',
      targetId: staffProfile.id,
      action: 'ACCOUNT_CREATED',
      reason: 'Initial facility admin account created through secure bootstrap endpoint.',
      endpoint: '/api/bootstrap/facility-admin',
      correlationId,
      metadata: {
        role: 'ADMIN',
        authUserId: authUser.id
      }
    }, { strict: true })

    const responseBody = {
      ok: true,
      code: 'FACILITY_ADMIN_BOOTSTRAPPED',
      status: 'completed',
      correlationId,
      data: {
        facility: {
          id: facility.id,
          code: facility.code,
          name: facility.name,
          region: facility.region,
          status: facility.status
        },
        admin: {
          authUserId: authUser.id,
          staffProfileId: staffProfile.id,
          staffCode: staffProfile.staff_code,
          fullName: staffProfile.full_name,
          email: staffProfile.email,
          role: staffProfile.role,
          status: staffProfile.status
        }
      }
    }

    await completeIdempotency(adminClient, idem, { status: 'completed', responseBody })

    return json(res, 201, responseBody)
  } catch (error) {
    await insertAuditEvent(adminClient, {
      facilityId: facility ? facility.id : null,
      actorStaffId: staffProfile ? staffProfile.id : null,
      actorAuthUserId: authUser ? authUser.id : null,
      targetTable: 'system',
      targetId: null,
      action: 'BOOTSTRAP_FAILED',
      reason: 'Bootstrap endpoint failed unexpectedly.',
      endpoint: '/api/bootstrap/facility-admin',
      correlationId,
      errorCategory: (error && error.code) || 'UNEXPECTED_ERROR',
      metadata: {
        compensation
      }
    })

    const responseBody = {
      ok: false,
      code: 'BOOTSTRAP_FAILED',
      message: 'Bootstrap failed. Please retry or contact support.',
      correlationId,
      status: 'failed'
    }

    await completeIdempotency(adminClient, idem, { status: 'failed', responseBody }).catch(() => {})
    return internalServerError(res, responseBody.message, responseBody.code, correlationId)
  }
}