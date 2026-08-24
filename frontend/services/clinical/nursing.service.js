function requireClient(supabase) {
  if (!supabase) throw new Error('Supabase client is required for nursing service operations.')
  return supabase
}

function applyFacility(query, facilityId) {
  return facilityId ? query.eq('facility_id', facilityId) : query
}

export function createNursingService(supabase) {
  const client = requireClient(supabase)

  return {
    async listPatient360({ patientId, facilityId }) {
      const [markers, wounds, woundAssessments, notes, tasks, orders, carePlans, documents, audit] = await Promise.all([
        applyFacility(client.from('body_map_markers').select('*').eq('patient_id', patientId), facilityId),
        applyFacility(client.from('wounds').select('*').eq('patient_id', patientId), facilityId),
        applyFacility(client.from('wound_assessments').select('*').eq('patient_id', patientId), facilityId),
        applyFacility(client.from('clinical_notes').select('*').eq('patient_id', patientId), facilityId),
        applyFacility(client.from('tasks').select('*').eq('patient_id', patientId), facilityId),
        applyFacility(client.from('orders').select('*').eq('patient_id', patientId), facilityId),
        applyFacility(client.from('care_plans').select('*').eq('patient_id', patientId), facilityId),
        applyFacility(client.from('documents').select('*').eq('patient_id', patientId), facilityId),
        applyFacility(client.from('audit_logs').select('*').eq('patient_id', patientId), facilityId)
      ])

      const results = { markers, wounds, woundAssessments, notes, tasks, orders, carePlans, documents, audit }
      Object.keys(results).forEach(key => {
        if (results[key].error) throw results[key].error
      })

      return Object.fromEntries(Object.entries(results).map(([key, result]) => [key, result.data || []]))
    },

    async createBodyMapMarker(payload) {
      const { data, error } = await client.from('body_map_markers').insert(payload).select().single()
      if (error) throw error
      return data
    },

    async createWound(payload) {
      const { data, error } = await client.from('wounds').insert(payload).select().single()
      if (error) throw error
      return data
    },

    async updateWound(id, payload) {
      const { data, error } = await client.from('wounds').update(payload).eq('id', id).select().single()
      if (error) throw error
      return data
    },

    async createWoundAssessment(payload) {
      const { data, error } = await client.from('wound_assessments').insert(payload).select().single()
      if (error) throw error
      return data
    },

    async addWoundPhoto(payload) {
      const { data, error } = await client.from('wound_photos').insert(payload).select().single()
      if (error) throw error
      return data
    },

    async createNursingAssessment(payload) {
      const { data, error } = await client.from('nursing_assessments').insert(payload).select().single()
      if (error) throw error
      return data
    },

    async createClinicalNote(payload) {
      const { data, error } = await client.from('clinical_notes').insert(payload).select().single()
      if (error) throw error
      return data
    },

    async signClinicalNote(id) {
      const { data, error } = await client.from('clinical_notes').update({ status: 'signed', signed_at: new Date().toISOString() }).eq('id', id).select().single()
      if (error) throw error
      return data
    },

    async amendClinicalNote(id, amendment) {
      const { data, error } = await client.rpc('append_clinical_note_amendment', { note_id: id, amendment_body: amendment })
      if (error) throw error
      return data
    },

    async updateTaskStatus(id, status, reason) {
      const { data, error } = await client.from('tasks').update({ status, status_reason: reason, completed_at: status === 'completed' ? new Date().toISOString() : null }).eq('id', id).select().single()
      if (error) throw error
      return data
    }
  }
}
