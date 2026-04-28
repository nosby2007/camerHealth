const { getSupabaseAdminClient, findAuthUserByEmail } = require('../../_lib/supabase-admin')
const { requireActiveAdminCaller } = require('../../_lib/caller-context')
const { insertAuditEvent } = require('../../_lib/audit')
const { assertFields, isEmail, normalizeRole, sanitizeEmail, toStringSafe, randomCode } = require('../../_lib/request')
const {
  json,
  badRequest,
  conflict,
  internalServerError,
  methodNotAllowed,
  tooManyRequests
} = require('../../_lib/http')
const { enforceRateLimit } = require('../../_lib/rate-limit')

const REQUIRED_FIELDS = ['email', 'firstName', 'role']
const ALLOWED_ROLES = ['ADMIN', 'DOCTOR', 'NURSE', 'LAB', 'IMAGING']

module.exports = async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  const limit = enforceRateLimit(req, 'admin-staff-invite', { max: 20, windowMs: 60 * 1000 })
  if (limit.limited) {
    res.setHeader('Retry-After', String(limit.retryAfterSeconds))
    return tooManyRequests(res, 'Too many invitation attempts. Please retry later.')
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

  const inviteRole = normalizeRole(body.role)
  if (!ALLOWED_ROLES.includes(inviteRole)) {
    return badRequest(res, `Unsupported role. Allowed roles: ${ALLOWED_ROLES.join(', ')}`, 'INVALID_ROLE')
  }

  const inviteEmail = sanitizeEmail(body.email)
  if (!isEmail(inviteEmail)) {
    return badRequest(res, 'email must be a valid email address.', 'INVALID_EMAIL')
  }

  const adminClient = getSupabaseAdminClient()
  const caller = await requireActiveAdminCaller({ req, res, adminClient })
  if (!caller) return

  const callerFacilityId = caller.staffProfile.facility_id
  const callerStaffId = caller.staffProfile.id

  try {
    const existingUser = await findAuthUserByEmail(adminClient, inviteEmail)
    let authUserId = existingUser ? existingUser.id : null

    if (!existingUser) {
      const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(inviteEmail, {
        data: {
          first_name: toStringSafe(body.firstName),
          last_name: toStringSafe(body.lastName),
          requested_role: inviteRole,
          invited_by_staff_profile_id: callerStaffId,
          invited_facility_id: callerFacilityId,
          source: '/api/admin/staff/invite'
        }
      })

      if (inviteError || !inviteData || !inviteData.user) {
        await insertAuditEvent(adminClient, {
          facilityId: callerFacilityId,
          actorStaffId: callerStaffId,
          targetTable: 'staff_profiles',
          targetId: null,
          action: 'AUTH_STAFF_INVITE_FAILED',
          reason: 'Supabase Auth invite failed.',
          metadata: {
            endpoint: '/api/admin/staff/invite',
            role: inviteRole,
            email: inviteEmail,
            code: inviteError && inviteError.code,
            message: inviteError && inviteError.message
          }
        })

        return internalServerError(res, 'Unable to invite staff at this time.', 'INVITE_AUTH_FAILED')
      }

      authUserId = inviteData.user.id
    }

    const staffCode = toStringSafe(body.staffCode) || randomCode('STF')
    const fullName = `${toStringSafe(body.firstName)} ${toStringSafe(body.lastName)}`.trim()

    const { data: profile, error: profileError } = await adminClient
      .from('staff_profiles')
      .insert({
        auth_user_id: authUserId,
        facility_id: callerFacilityId,
        staff_code: staffCode.toUpperCase(),
        full_name: fullName,
        email: inviteEmail,
        role: inviteRole,
        phone: toStringSafe(body.phone) || null,
        status: 'pending_email_confirmation',
        created_by: callerStaffId,
        updated_by: callerStaffId
      })
      .select('id, facility_id, staff_code, full_name, email, role, status, created_at')
      .single()

    if (profileError) {
      if (profileError.code === '23505') {
        await insertAuditEvent(adminClient, {
          facilityId: callerFacilityId,
          actorStaffId: callerStaffId,
          targetTable: 'staff_profiles',
          targetId: null,
          action: 'AUTH_STAFF_INVITE_FAILED',
          reason: 'Staff profile uniqueness conflict.',
          metadata: {
            endpoint: '/api/admin/staff/invite',
            role: inviteRole,
            email: inviteEmail,
            staffCode: staffCode.toUpperCase(),
            code: profileError.code,
            message: profileError.message
          }
        })
        return conflict(res, 'Staff invite conflicts with existing email/staff code/account.', 'INVITE_CONFLICT')
      }

      await insertAuditEvent(adminClient, {
        facilityId: callerFacilityId,
        actorStaffId: callerStaffId,
        targetTable: 'staff_profiles',
        targetId: null,
        action: 'AUTH_STAFF_INVITE_FAILED',
        reason: 'Failed to create staff profile for invited user.',
        metadata: {
          endpoint: '/api/admin/staff/invite',
          role: inviteRole,
          email: inviteEmail,
          code: profileError.code,
          message: profileError.message
        }
      })

      return internalServerError(res, 'Unable to create invited staff profile.', 'INVITE_PROFILE_CREATE_FAILED')
    }

    await insertAuditEvent(adminClient, {
      facilityId: callerFacilityId,
      actorStaffId: callerStaffId,
      targetTable: 'staff_profiles',
      targetId: profile.id,
      action: 'AUTH_STAFF_INVITED',
      reason: 'Staff invited by active facility admin.',
      metadata: {
        endpoint: '/api/admin/staff/invite',
        role: inviteRole,
        email: inviteEmail,
        authUserId
      }
    })

    return json(res, 201, {
      ok: true,
      code: 'STAFF_INVITED',
      data: {
        profile: {
          id: profile.id,
          facilityId: profile.facility_id,
          staffCode: profile.staff_code,
          fullName: profile.full_name,
          email: profile.email,
          role: profile.role,
          status: profile.status
        }
      }
    })
  } catch (error) {
    await insertAuditEvent(adminClient, {
      facilityId: callerFacilityId,
      actorStaffId: callerStaffId,
      targetTable: 'staff_profiles',
      targetId: null,
      action: 'AUTH_STAFF_INVITE_FAILED',
      reason: 'Unexpected server error in invite endpoint.',
      metadata: {
        endpoint: '/api/admin/staff/invite',
        code: error && error.code,
        message: error && error.message
      }
    })

    return internalServerError(res, 'Staff invite failed. Please retry later.', 'INVITE_FAILED')
  }
}