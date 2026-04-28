const { getSupabaseAdminClient, findAuthUserByEmail } = require('../_lib/supabase-admin')
const { assertFields, isEmail, sanitizeEmail, toStringSafe, randomCode } = require('../_lib/request')
const { insertAuditEvent } = require('../_lib/audit')
const {
  json,
  badRequest,
  conflict,
  internalServerError,
  methodNotAllowed,
  tooManyRequests
} = require('../_lib/http')
const { enforceRateLimit } = require('../_lib/rate-limit')

const REQUIRED_FIELDS = [
  'facilityName',
  'facilityType',
  'region',
  'address',
  'adminEmail',
  'adminPassword',
  'adminFirstName',
  'adminLastName'
]

module.exports = async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  const limit = enforceRateLimit(req, 'bootstrap-facility-admin', { max: 5, windowMs: 60 * 1000 })
  if (limit.limited) {
    res.setHeader('Retry-After', String(limit.retryAfterSeconds))
    return tooManyRequests(res, 'Too many bootstrap attempts. Please retry later.')
  }

  const body = req.body || {}
  const validation = assertFields(body, REQUIRED_FIELDS)
  if (!validation.valid) {
    return badRequest(
      res,
      `Missing required fields: ${validation.missing.join(', ')}`,
      'MISSING_REQUIRED_FIELDS',
      validation.missing
    )
  }

  const adminEmail = sanitizeEmail(body.adminEmail)
  if (!isEmail(adminEmail)) {
    return badRequest(res, 'adminEmail must be a valid email address.', 'INVALID_ADMIN_EMAIL')
  }

  const adminPassword = toStringSafe(body.adminPassword)
  if (adminPassword.length < 8) {
    return badRequest(res, 'adminPassword must contain at least 8 characters.', 'INVALID_ADMIN_PASSWORD')
  }

  const adminClient = getSupabaseAdminClient()
  let authUser = null
  let facility = null
  let staffProfile = null

  try {
    const existing = await findAuthUserByEmail(adminClient, adminEmail)
    if (existing) {
      authUser = existing
    } else {
      const { data: createdUserData, error: createdUserError } = await adminClient.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: false,
        user_metadata: {
          first_name: toStringSafe(body.adminFirstName),
          last_name: toStringSafe(body.adminLastName),
          source: 'facility-bootstrap-api'
        }
      })

      if (createdUserError || !createdUserData || !createdUserData.user) {
        return internalServerError(res, 'Unable to create bootstrap auth user.', 'BOOTSTRAP_AUTH_CREATE_FAILED')
      }
      authUser = createdUserData.user
    }

    const adminStatus = authUser.email_confirmed_at ? 'active' : 'pending_email_confirmation'

    const { data: facilityInsert, error: facilityError } = await adminClient
      .from('facilities')
      .insert({
        code: randomCode('FAC'),
        name: toStringSafe(body.facilityName),
        region: toStringSafe(body.region),
        city: null,
        quarter: toStringSafe(body.address),
        email: adminEmail,
        phone: toStringSafe(body.adminPhone) || null,
        status: 'active'
      })
      .select('id, code, name, region, city, quarter, email, status, created_at')
      .single()

    if (facilityError) {
      if (facilityError.code === '23505') {
        return conflict(res, 'Facility already exists with conflicting unique values.', 'FACILITY_CONFLICT')
      }
      return internalServerError(res, 'Unable to create facility record.', 'FACILITY_CREATE_FAILED')
    }
    facility = facilityInsert

    const { data: profileInsert, error: profileError } = await adminClient
      .from('staff_profiles')
      .insert({
        auth_user_id: authUser.id,
        facility_id: facility.id,
        staff_code: randomCode('ADM'),
        full_name: `${toStringSafe(body.adminFirstName)} ${toStringSafe(body.adminLastName)}`.trim(),
        email: adminEmail,
        role: 'ADMIN',
        phone: toStringSafe(body.adminPhone) || null,
        status: adminStatus
      })
      .select('id, facility_id, staff_code, full_name, email, role, status, created_at')
      .single()

    if (profileError) {
      if (profileError.code === '23505') {
        return conflict(res, 'Admin staff profile already exists for this auth user or facility.', 'ADMIN_PROFILE_CONFLICT')
      }
      return internalServerError(res, 'Unable to create admin staff profile.', 'ADMIN_PROFILE_CREATE_FAILED')
    }
    staffProfile = profileInsert

    await adminClient.from('facility_settings').upsert({
      facility_id: facility.id,
      settings_key: 'general',
      settings_value: {
        facilityType: toStringSafe(body.facilityType),
        bootstrapSource: 'api/bootstrap/facility-admin',
        bootstrapAt: new Date().toISOString()
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
      targetTable: 'facilities',
      targetId: facility.id,
      action: 'FACILITY_REGISTERED',
      reason: 'Facility created through secure bootstrap endpoint.',
      metadata: {
        endpoint: '/api/bootstrap/facility-admin',
        authUserId: authUser.id
      }
    })

    await insertAuditEvent(adminClient, {
      facilityId: facility.id,
      actorStaffId: staffProfile.id,
      targetTable: 'staff_profiles',
      targetId: staffProfile.id,
      action: 'ACCOUNT_CREATED',
      reason: 'Initial facility admin account created through secure bootstrap endpoint.',
      metadata: {
        endpoint: '/api/bootstrap/facility-admin',
        role: 'ADMIN',
        authUserId: authUser.id
      }
    })

    return json(res, 201, {
      ok: true,
      code: 'FACILITY_ADMIN_BOOTSTRAPPED',
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
    })
  } catch (error) {
    if (facility && staffProfile) {
      await insertAuditEvent(adminClient, {
        facilityId: facility.id,
        actorStaffId: staffProfile.id,
        targetTable: 'system',
        targetId: null,
        action: 'BOOTSTRAP_FAILED',
        reason: 'Bootstrap endpoint failed unexpectedly.',
        metadata: {
          endpoint: '/api/bootstrap/facility-admin',
          code: error && error.code,
          message: error && error.message
        }
      })
    }

    return internalServerError(res, 'Bootstrap failed. Please retry or contact support.', 'BOOTSTRAP_FAILED')
  }
}