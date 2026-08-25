const { unauthorized, forbidden } = require('./http')

function extractBearerToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization
  if (!authHeader || typeof authHeader !== 'string') return null
  const [type, token] = authHeader.split(' ')
  if (!type || !token || type.toLowerCase() !== 'bearer') return null
  return token
}

async function requireActiveAdminCaller({ req, res, adminClient }) {
  const token = extractBearerToken(req)
  if (!token) {
    unauthorized(res, 'Authentication required to invite staff.', 'AUTH_TOKEN_MISSING')
    return null
  }

  const { data: userData, error: userError } = await adminClient.auth.getUser(token)
  if (userError || !userData || !userData.user) {
    unauthorized(res, 'Invalid or expired authentication token.', 'AUTH_TOKEN_INVALID')
    return null
  }

  const authUserId = userData.user.id
  const { data: staffProfile, error: staffError } = await adminClient
    .from('staff_profiles')
    .select('id, facility_id, role, status, email, full_name, staff_code, auth_user_id')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (staffError) {
    forbidden(res, 'Unable to resolve caller staff profile.', 'CALLER_PROFILE_LOOKUP_FAILED')
    return null
  }

  if (!staffProfile) {
    forbidden(res, 'No staff profile is linked to this account.', 'CALLER_PROFILE_NOT_FOUND')
    return null
  }

  if (String(staffProfile.status || '').toLowerCase() !== 'active') {
    forbidden(res, 'Caller account is not active.', 'CALLER_NOT_ACTIVE')
    return null
  }

  if (String(staffProfile.role || '').toUpperCase() !== 'ADMIN') {
    forbidden(res, 'Only active ADMIN users can invite staff.', 'CALLER_NOT_ADMIN')
    return null
  }

  return {
    authUser: userData.user,
    staffProfile
  }
}

module.exports = {
  extractBearerToken,
  requireActiveAdminCaller
}