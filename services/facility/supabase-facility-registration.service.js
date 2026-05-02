import { createClient } from '@supabase/supabase-js'

function registrationError(code, message, cause = null) {
  const err = new Error(message)
  err.code = code
  if (cause) err.cause = cause
  return err
}

function buildPermissions(role) {
  const map = {
    ADMIN: ['manage_staff', 'manage_facility_settings', 'manage_patients', 'manage_clinical_records', 'manage_invoices', 'view_audit_logs'],
    DOCTOR: ['read_patients', 'write_medical_visits', 'write_medications', 'write_lab_orders', 'write_imaging_orders', 'write_admissions'],
    NURSE: ['read_patients', 'write_nursing_visits', 'write_appointments', 'write_care_records'],
    LAB: ['read_patients_limited', 'read_lab_orders', 'update_lab_orders'],
    IMAGING: ['read_patients_limited', 'read_imaging_orders', 'update_imaging_orders']
  }
  return map[role] || []
}

function createSupabaseClient(url, key) {
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })
}

function generateFacilityCode(facility) {
  const region = (facility.region || 'GEN').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()
  const name = (facility.name || 'FACILITY').replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase()
  return `${region}-${name}`
}

function validatePayload(payload) {
  const missing = []
  if (!payload || !payload.facility) missing.push('facility')
  if (!payload || !payload.admin) missing.push('admin')

  const facility = payload && payload.facility ? payload.facility : {}
  const admin = payload && payload.admin ? payload.admin : {}

  if (!facility.name) missing.push('facility.name')
  if (!facility.region) missing.push('facility.region')
  if (!facility.city) missing.push('facility.city')
  if (!facility.quarter) missing.push('facility.quarter')
  if (!facility.email) missing.push('facility.email')
  if (!admin.fullName) missing.push('admin.fullName')
  if (!admin.staffId) missing.push('admin.staffId')
  if (!admin.email) missing.push('admin.email')
  if (!admin.password) missing.push('admin.password')

  if (missing.length) {
    throw registrationError('MISSING_REQUIRED_FIELDS', `Missing required fields: ${missing.join(', ')}`)
  }
}

function classifySupabaseError(error, fallbackCode, fallbackMessage) {
  const message = (error && error.message ? error.message : '').toLowerCase()
  const code = error && error.code ? error.code : ''

  if (message.includes('user already registered') || message.includes('already registered')) {
    return registrationError('DUPLICATE_EMAIL', 'This email is already registered.', error)
  }

  if (code === '23505' || message.includes('duplicate key')) {
    if (message.includes('email')) {
      return registrationError('DUPLICATE_EMAIL', 'This email is already registered.', error)
    }
    if (message.includes('staff_code') || message.includes('staff code')) {
      return registrationError('DUPLICATE_STAFF_CODE', 'This staff code already exists for the facility.', error)
    }
    if (message.includes('facilities_code') || message.includes('facility') || message.includes('code')) {
      return registrationError('DUPLICATE_FACILITY', 'A facility with the same code or identity already exists.', error)
    }
  }

  if (code === '42501' || message.includes('row-level security') || message.includes('permission denied')) {
    return registrationError('RLS_PERMISSION_FAILURE', 'Registration is blocked by backend permissions or RLS policy. A server-side bootstrap flow may be required.', error)
  }

  if (message.includes('network') || message.includes('failed to fetch') || message.includes('fetch')) {
    return registrationError('NETWORK_UNAVAILABLE', 'Supabase is unavailable or the network request failed.', error)
  }

  return registrationError(fallbackCode, fallbackMessage, error)
}

export async function createFacilityRecord(supabase, payload) {
  const facilityInput = {
    code: generateFacilityCode(payload.facility),
    name: payload.facility.name.trim(),
    region: payload.facility.region,
    city: payload.facility.city.trim(),
    quarter: payload.facility.quarter.trim(),
    email: payload.facility.email.trim().toLowerCase(),
    phone: payload.facility.phone ? payload.facility.phone.trim() : null,
    status: 'active'
  }

  const { data, error } = await supabase
    .from('facilities')
    .insert(facilityInput)
    .select()
    .single()

  if (error) {
    throw classifySupabaseError(error, 'FACILITY_INSERT_FAILED', 'Failed to create facility record.')
  }

  return data
}

export async function createAdminStaffProfile(supabase, authUserId, facilityId, payload) {
  if (!authUserId) {
    throw registrationError('AUTH_USER_ID_MISSING', 'Missing auth user id from Supabase Auth sign-up.')
  }

  const { data, error } = await supabase
    .from('staff_profiles')
    .insert({
      auth_user_id: authUserId,
      facility_id: facilityId,
      staff_code: payload.admin.staffId.trim().toUpperCase(),
      full_name: payload.admin.fullName.trim(),
      email: payload.admin.email.trim().toLowerCase(),
      role: 'ADMIN',
      phone: payload.admin.phone ? payload.admin.phone.trim() : null,
      status: 'active'
    })
    .select()
    .single()

  if (error) {
    throw classifySupabaseError(error, 'STAFF_PROFILE_INSERT_FAILED', 'Failed to create administrator staff profile.')
  }

  return data
}

export async function createDefaultFacilitySettings(supabase, facilityId) {
  const { data, error } = await supabase
    .from('facility_settings')
    .upsert({
      facility_id: facilityId,
      settings_key: 'general',
      settings_value: {
        registrationMode: 'supabase_auth_compat',
        authCutoverPhase: 9,
        staffInvitationMode: 'backend_required'
      },
      status: 'active'
    }, { onConflict: 'facility_id,settings_key' })
    .select()
    .single()

  if (error) {
    throw classifySupabaseError(error, 'FACILITY_SETTINGS_INSERT_FAILED', 'Failed to create default facility settings.')
  }

  return data
}

export function normalizeFacilityRegistrationResult({ authUser, facility, staffProfile, facilitySettings, pendingConfirmation = false }) {
  if (pendingConfirmation) {
    return {
      status: 'pending_confirmation',
      authUserId: authUser && authUser.id ? authUser.id : null,
      message: 'Check your email to confirm the account before backend facility bootstrap can continue.'
    }
  }

  return {
    status: 'registered',
    authUserId: authUser.id,
    facility,
    staffProfile,
    facilitySettings,
    authContext: {
      userId: authUser.id,
      authUserId: authUser.id,
      staffProfileId: staffProfile.id,
      staffId: staffProfile.staff_code,
      staffCode: staffProfile.staff_code,
      facilityId: facility.id,
      institutionId: facility.id,
      role: staffProfile.role,
      displayName: staffProfile.full_name,
      email: staffProfile.email || authUser.email || '',
      institutionName: facility.name,
      accountStatus: staffProfile.status,
      permissions: buildPermissions(staffProfile.role)
    },
    audit: {
      persisted: false,
      action: 'AUTH_FACILITY_REGISTERED',
      note: 'TODO: move audit persistence to backend-safe path when claims/RLS bootstrap is finalized.'
    }
  }
}

export async function registerFacilityWithAdmin(payload, options) {
  validatePayload(payload)

  const supabaseUrl = options && options.supabaseUrl
  const supabaseKey = options && options.supabaseKey

  if (!supabaseUrl || !supabaseKey) {
    throw registrationError('SUPABASE_CONFIG_MISSING', 'Supabase registration requires SUPABASE_URL and SUPABASE_KEY.')
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

  const { data, error } = await supabase.auth.signUp({
    email: payload.admin.email.trim().toLowerCase(),
    password: payload.admin.password,
    options: {
      data: {
        full_name: payload.admin.fullName.trim(),
        staff_code: payload.admin.staffId.trim().toUpperCase(),
        requested_role: 'ADMIN',
        facility_name: payload.facility.name.trim()
      }
    }
  })

  if (error || !data || !data.user) {
    throw classifySupabaseError(error, 'SUPABASE_AUTH_SIGNUP_FAILED', 'Supabase Auth sign-up failed.')
  }

  if (!data.session) {
    return normalizeFacilityRegistrationResult({
      authUser: data.user,
      pendingConfirmation: true
    })
  }

  const facility = await createFacilityRecord(supabase, payload)
  const staffProfile = await createAdminStaffProfile(supabase, data.user.id, facility.id, payload)
  const facilitySettings = await createDefaultFacilitySettings(supabase, facility.id)

  await supabase.auth.signOut()

  return normalizeFacilityRegistrationResult({
    authUser: data.user,
    facility,
    staffProfile,
    facilitySettings
  })
}