import axios from 'axios'

function inviteError(code, message, cause = null) {
  const err = new Error(message)
  err.code = code
  if (cause) err.cause = cause
  return err
}

function splitName(fullName) {
  const value = (fullName || '').trim()
  if (!value) return { firstName: '', lastName: '' }
  const parts = value.split(/\s+/)
  return {
    firstName: parts.shift() || '',
    lastName: parts.join(' ') || ''
  }
}

function validateInvitePayload(payload) {
  const missing = []
  if (!payload.email) missing.push('email')
  if (!payload.fullName) missing.push('fullName')
  if (!payload.staffId) missing.push('staffId')
  if (!payload.role) missing.push('role')
  if (missing.length) {
    throw inviteError('MISSING_REQUIRED_FIELDS', `Missing required fields: ${missing.join(', ')}`)
  }
}

function classifyInviteError(error) {
  if (!error) return inviteError('STAFF_INVITE_FAILED', 'Staff invitation failed.')

  if (error.code === 'BACKEND_INVITE_UNAVAILABLE') return error

  const status = error.response && error.response.status
  const apiMessage = error.response && error.response.data && error.response.data.message

  if (status === 400) return inviteError('INVALID_INVITE_REQUEST', apiMessage || 'Staff invitation request is invalid.', error)
  if (status === 403) return inviteError('INVITE_NOT_ALLOWED', apiMessage || 'You are not allowed to invite staff.', error)
  if (status === 404) return inviteError('BACKEND_INVITE_UNAVAILABLE', 'Secure staff invitation backend is not implemented yet.', error)
  if (status === 409) return inviteError('INVITE_CONFLICT', apiMessage || 'A staff account with the same email or staff code already exists.', error)
  if (status >= 500) return inviteError('INVITE_BACKEND_ERROR', apiMessage || 'Staff invitation backend failed.', error)

  return inviteError('STAFF_INVITE_FAILED', apiMessage || error.message || 'Staff invitation failed.', error)
}

export async function inviteStaff(payload, options = {}) {
  validateInvitePayload(payload)

  if (!options.endpoint) {
    throw inviteError('BACKEND_INVITE_UNAVAILABLE', 'Secure staff invitation backend is not configured yet.')
  }

  const name = splitName(payload.fullName)

  try {
    const response = await axios.post(options.endpoint, {
      email: payload.email.trim().toLowerCase(),
      firstName: name.firstName,
      lastName: name.lastName,
      role: payload.role,
      staffCode: payload.staffId.trim().toUpperCase(),
      phone: payload.phone || '',
      title: payload.title || '',
      department: payload.department || ''
    })

    return response.data
  } catch (error) {
    throw classifyInviteError(error)
  }
}