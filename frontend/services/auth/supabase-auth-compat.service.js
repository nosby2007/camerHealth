import { createClient } from '@supabase/supabase-js'

function parseBooleanFlag(value, fallback = false) {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

function buildPermissions(role) {
  const map = {
    ADMIN: ['manage_staff', 'manage_facility_settings', 'manage_patients', 'manage_clinical_records', 'manage_invoices', 'view_audit_logs'],
    DOCTOR: ['read_patients', 'write_medical_visits', 'write_medications', 'write_lab_orders', 'write_imaging_orders', 'write_admissions'],
    NP: ['read_patients', 'write_medical_visits', 'write_medications', 'write_lab_orders', 'write_imaging_orders', 'write_admissions'],
    NURSE: ['read_patients', 'write_nursing_visits', 'write_appointments', 'write_care_records'],
    CNA: ['read_patients_limited', 'write_care_tasks'],
    MIDWIFE: ['read_patients', 'write_maternity_visits', 'write_nursing_visits', 'write_care_records'],
    MAJOR_SERVICE: ['read_patients', 'write_nursing_visits', 'write_care_records', 'manage_unit_worklists', 'view_unit_audit'],
    NURSING_SUPERVISOR: ['read_patients', 'write_nursing_visits', 'write_care_records', 'manage_nursing_worklists', 'view_nursing_audit'],
    LAB: ['read_patients_limited', 'read_lab_orders', 'update_lab_orders'],
    IMAGING: ['read_patients_limited', 'read_imaging_orders', 'update_imaging_orders'],
    PHARMACY: ['read_patients_limited', 'read_medications', 'dispense_medications', 'update_medication_status'],
    FRONT_DESK: ['read_patient_demographics', 'write_appointments', 'write_registration'],
    RECORDS: ['read_patient_demographics', 'read_clinical_documents', 'manage_records'],
    BILLING: ['read_patient_demographics', 'manage_invoices', 'manage_claims'],
    SOCIAL_WORKER: ['read_patients_limited', 'write_social_needs'],
    PHYSIOTHERAPIST: ['read_patients_limited', 'write_rehab_notes']
  }
  return map[role] || []
}

function authError(code, message, cause = null) {
  const err = new Error(message)
  err.code = code
  if (cause) err.cause = cause
  return err
}

function classifySupabaseSignInError(error) {
  const message = (error && error.message ? error.message : '').toLowerCase()
  if (message.includes('invalid login credentials')) {
    return authError('INVALID_CREDENTIALS', 'Invalid email or password.', error)
  }
  return authError('SUPABASE_AUTH_FAILURE', 'Supabase sign-in failed.', error)
}

function createSupabaseAuthClient(url, key) {
  return createClient(url, key, {
    auth: {
      // Transitional compatibility: keep auth tokens out of localStorage.
      persistSession: false,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })
}

function normalizeAuthContext(user, staffProfile) {
  const role = staffProfile.role
  const facility = staffProfile.facilities || {}

  return {
    userId: user.id,
    authUserId: user.id,
    staffProfileId: staffProfile.id,
    staffId: staffProfile.staff_code || null,
    staffCode: staffProfile.staff_code || null,
    facilityId: staffProfile.facility_id,
    institutionId: staffProfile.facility_id,
    institutionName: facility.name || '',
    role,
    displayName: staffProfile.full_name || user.email || '',
    email: staffProfile.email || user.email || '',
    accountStatus: staffProfile.status,
    permissions: buildPermissions(role)
  }
}

export function createSupabaseAuthCompat(options) {
  const url = options.supabaseUrl
  const key = options.supabaseKey
  const enabled = parseBooleanFlag(options.enableSupabaseAuth, false)

  if (!url || !key) {
    throw authError('SUPABASE_CONFIG_MISSING', 'Supabase auth compatibility requires SUPABASE_URL and SUPABASE_KEY.')
  }

  const supabaseAuthClient = createSupabaseAuthClient(url, key)

  async function getCurrentAuthUser() {
    const { data, error } = await supabaseAuthClient.auth.getUser()
    if (error) {
      throw authError('SUPABASE_AUTH_FAILURE', 'Failed to fetch current Supabase auth user.', error)
    }
    return data ? data.user : null
  }

  async function resolveLinkedStaffProfile(authUserId) {
    const { data, error } = await supabaseAuthClient
      .from('staff_profiles')
      .select('id, auth_user_id, staff_code, facility_id, role, status, full_name, email, facilities:facility_id(id, name)')
      .eq('auth_user_id', authUserId)
      .limit(1)
      .maybeSingle()

    if (error) {
      throw authError('STAFF_PROFILE_LOOKUP_FAILED', 'Failed to resolve linked staff profile from Supabase.', error)
    }

    if (!data) {
      throw authError('STAFF_PROFILE_NOT_FOUND', 'No linked staff profile found for this authenticated user.')
    }

    if (data.status !== 'active') {
      throw authError('STAFF_PROFILE_INACTIVE', 'Linked staff profile is not active.')
    }

    if (!data.facility_id) {
      throw authError('FACILITY_MISSING', 'Linked staff profile has no facility_id.')
    }

    if (!data.role) {
      throw authError('ROLE_MISSING', 'Linked staff profile has no role.')
    }

    return data
  }

  return {
    isEnabled() {
      return enabled
    },

    async signInWithPassword({ email, password }) {
      if (!enabled) {
        throw authError('SUPABASE_AUTH_DISABLED', 'Supabase Auth compatibility is disabled by feature flag.')
      }

      const { data, error } = await supabaseAuthClient.auth.signInWithPassword({ email, password })
      if (error || !data || !data.user) {
        throw classifySupabaseSignInError(error)
      }

      const staffProfile = await resolveLinkedStaffProfile(data.user.id)
      return normalizeAuthContext(data.user, staffProfile)
    },

    async getCurrentAuthUser() {
      return getCurrentAuthUser()
    },

    async resolveAuthContext() {
      if (!enabled) {
        throw authError('SUPABASE_AUTH_DISABLED', 'Supabase Auth compatibility is disabled by feature flag.')
      }

      const user = await getCurrentAuthUser()
      if (!user) {
        throw authError('AUTH_USER_MISSING', 'No authenticated Supabase user found.')
      }

      const staffProfile = await resolveLinkedStaffProfile(user.id)
      return normalizeAuthContext(user, staffProfile)
    },

    async signOut() {
      const { error } = await supabaseAuthClient.auth.signOut()
      if (error) {
        throw authError('SUPABASE_AUTH_FAILURE', 'Supabase sign-out failed.', error)
      }
      return true
    }
  }
}
