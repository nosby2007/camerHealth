
export const state = () => ({
  patients: [],
  visits: [],
  fieldReports: [],
  inpatients: [],
  appointments: [],
  medications: [],
  labOrders: [],
  imagingOrders: [],
  invoices: [],
  vitalSigns: [],
  nursingNotes: [],
  medicalNotes: [],
  tasks: [],
  documents: [],
  insuranceClaims: [],
  referrals: [],
  medicalTemplates: [],
  portalMessages: [],
  voiceDrafts: [],
  offlineMode: false,
  lastSync: null,
  viewMode: 'national'
})

export const mutations = {
  ADD_PATIENT(state, patient) {
    state.patients.push(patient)
    saveToLocalStorage('patients', state.patients)
  },
  ADD_VISIT(state, visit) {
    state.visits.push(visit)
    saveToLocalStorage('visits', state.visits)
  },
  ADD_FIELD_REPORT(state, report) {
    state.fieldReports.push(report)
    saveToLocalStorage('fieldReports', state.fieldReports)
  },
  SET_OFFLINE_MODE(state, mode) {
    state.offlineMode = mode
  },
  SET_VIEW_MODE(state, mode) {
    state.viewMode = mode
  },
  SET_LAST_SYNC(state, timestamp) {
    state.lastSync = timestamp
  },
  ADD_INPATIENT(state, record) {
    state.inpatients.push(record)
    saveToLocalStorage('inpatients', state.inpatients)
  },
  UPDATE_INPATIENT(state, record) {
    const idx = state.inpatients.findIndex(i => i.id === record.id)
    if (idx !== -1) { state.inpatients.splice(idx, 1, record); saveToLocalStorage('inpatients', state.inpatients) }
  },
  ADD_APPOINTMENT(state, appt) {
    state.appointments.push(appt)
    saveToLocalStorage('appointments', state.appointments)
  },
  UPDATE_APPOINTMENT(state, appt) {
    const idx = state.appointments.findIndex(a => a.id === appt.id)
    if (idx !== -1) { state.appointments.splice(idx, 1, appt); saveToLocalStorage('appointments', state.appointments) }
  },
  ADD_MEDICATION(state, med) {
    state.medications.push(med)
    saveToLocalStorage('medications', state.medications)
  },
  UPDATE_MEDICATION(state, med) {
    const idx = state.medications.findIndex(m => m.id === med.id)
    if (idx !== -1) { state.medications.splice(idx, 1, med); saveToLocalStorage('medications', state.medications) }
  },
  ADD_LAB_ORDER(state, order) {
    state.labOrders.push(order)
    saveToLocalStorage('labOrders', state.labOrders)
  },
  UPDATE_LAB_ORDER(state, order) {
    const idx = state.labOrders.findIndex(l => l.id === order.id)
    if (idx !== -1) { state.labOrders.splice(idx, 1, order); saveToLocalStorage('labOrders', state.labOrders) }
  },
  ADD_IMAGING_ORDER(state, order) {
    state.imagingOrders.push(order)
    saveToLocalStorage('imagingOrders', state.imagingOrders)
  },
  UPDATE_IMAGING_ORDER(state, order) {
    const idx = state.imagingOrders.findIndex(i => i.id === order.id)
    if (idx !== -1) { state.imagingOrders.splice(idx, 1, order); saveToLocalStorage('imagingOrders', state.imagingOrders) }
  },
  ADD_INVOICE(state, invoice) {
    state.invoices.push(invoice)
    saveToLocalStorage('invoices', state.invoices)
  },
  UPDATE_INVOICE(state, invoice) {
    const idx = state.invoices.findIndex(i => i.id === invoice.id)
    if (idx !== -1) { state.invoices.splice(idx, 1, invoice); saveToLocalStorage('invoices', state.invoices) }
  },
  LOAD_FROM_STORAGE(state) {
    state.patients = loadFromLocalStorage('patients') || []
    state.visits = loadFromLocalStorage('visits') || []
    state.fieldReports = loadFromLocalStorage('fieldReports') || []
    state.inpatients = loadFromLocalStorage('inpatients') || []
    state.appointments = loadFromLocalStorage('appointments') || []
    state.medications = loadFromLocalStorage('medications') || []
    state.labOrders = loadFromLocalStorage('labOrders') || []
    state.imagingOrders = loadFromLocalStorage('imagingOrders') || []
    state.invoices = loadFromLocalStorage('invoices') || []
    state.vitalSigns = loadFromLocalStorage('vitalSigns') || []
    state.nursingNotes = loadFromLocalStorage('nursingNotes') || []
    state.medicalNotes = loadFromLocalStorage('medicalNotes') || []
    state.tasks = loadFromLocalStorage('tasks') || []
    state.documents = loadFromLocalStorage('documents') || []
    state.insuranceClaims = loadFromLocalStorage('insuranceClaims') || []
    state.referrals = loadFromLocalStorage('referrals') || []
    state.medicalTemplates = loadFromLocalStorage('medicalTemplates') || defaultMedicalTemplates()
    state.portalMessages = loadFromLocalStorage('portalMessages') || []
    state.voiceDrafts = loadFromLocalStorage('voiceDrafts') || []
  },
  ADD_VITAL_SIGNS(state, record) {
    state.vitalSigns.push(record)
    saveToLocalStorage('vitalSigns', state.vitalSigns)
  },
  ADD_NURSING_NOTE(state, note) {
    state.nursingNotes.push(note)
    saveToLocalStorage('nursingNotes', state.nursingNotes)
  },
  ADD_MEDICAL_NOTE(state, note) {
    state.medicalNotes.push(note)
    saveToLocalStorage('medicalNotes', state.medicalNotes)
  },
  UPDATE_NURSING_NOTE(state, note) {
    const idx = state.nursingNotes.findIndex(n => n.id === note.id)
    if (idx !== -1) {
      state.nursingNotes.splice(idx, 1, note)
      saveToLocalStorage('nursingNotes', state.nursingNotes)
    }
  },
  UPDATE_MEDICAL_NOTE(state, note) {
    const idx = state.medicalNotes.findIndex(n => n.id === note.id)
    if (idx !== -1) {
      state.medicalNotes.splice(idx, 1, note)
      saveToLocalStorage('medicalNotes', state.medicalNotes)
    }
  },
  ADD_TASK(state, task) {
    state.tasks.push(task)
    saveToLocalStorage('tasks', state.tasks)
  },
  UPDATE_TASK(state, task) {
    const idx = state.tasks.findIndex(t => t.id === task.id)
    if (idx !== -1) {
      state.tasks.splice(idx, 1, task)
      saveToLocalStorage('tasks', state.tasks)
    }
  },
  ADD_DOCUMENT(state, document) {
    state.documents.push(document)
    saveToLocalStorage('documents', state.documents)
  },
  UPDATE_DOCUMENT(state, document) {
    const idx = state.documents.findIndex(item => item.id === document.id)
    if (idx !== -1) { state.documents.splice(idx, 1, document); saveToLocalStorage('documents', state.documents) }
  },
  ADD_INSURANCE_CLAIM(state, claim) {
    state.insuranceClaims.push(claim)
    saveToLocalStorage('insuranceClaims', state.insuranceClaims)
  },
  UPDATE_INSURANCE_CLAIM(state, claim) {
    const idx = state.insuranceClaims.findIndex(item => item.id === claim.id)
    if (idx !== -1) { state.insuranceClaims.splice(idx, 1, claim); saveToLocalStorage('insuranceClaims', state.insuranceClaims) }
  },
  ADD_REFERRAL(state, referral) {
    state.referrals.push(referral)
    saveToLocalStorage('referrals', state.referrals)
  },
  UPDATE_REFERRAL(state, referral) {
    const idx = state.referrals.findIndex(item => item.id === referral.id)
    if (idx !== -1) { state.referrals.splice(idx, 1, referral); saveToLocalStorage('referrals', state.referrals) }
  },
  ADD_MEDICAL_TEMPLATE(state, template) {
    state.medicalTemplates.push(template)
    saveToLocalStorage('medicalTemplates', state.medicalTemplates)
  },
  UPDATE_MEDICAL_TEMPLATE(state, template) {
    const idx = state.medicalTemplates.findIndex(item => item.id === template.id)
    if (idx !== -1) { state.medicalTemplates.splice(idx, 1, template); saveToLocalStorage('medicalTemplates', state.medicalTemplates) }
  },
  ADD_PORTAL_MESSAGE(state, message) {
    state.portalMessages.push(message)
    saveToLocalStorage('portalMessages', state.portalMessages)
  },
  UPDATE_PORTAL_MESSAGE(state, message) {
    const idx = state.portalMessages.findIndex(item => item.id === message.id)
    if (idx !== -1) { state.portalMessages.splice(idx, 1, message); saveToLocalStorage('portalMessages', state.portalMessages) }
  },
  ADD_VOICE_DRAFT(state, draft) {
    state.voiceDrafts.push(draft)
    saveToLocalStorage('voiceDrafts', state.voiceDrafts)
  },
  UPDATE_VOICE_DRAFT(state, draft) {
    const idx = state.voiceDrafts.findIndex(item => item.id === draft.id)
    if (idx !== -1) { state.voiceDrafts.splice(idx, 1, draft); saveToLocalStorage('voiceDrafts', state.voiceDrafts) }
  }
}

export const actions = {
  registerPatient({ commit, rootState }, patient) {
    const id = 'PAT-' + Math.random().toString(36).substr(2, 9).toUpperCase()
    commit('ADD_PATIENT', {
      ...patient,
      id,
      institution: rootState.auth.institution,
      region: patient.region || rootState.auth.region,
      createdAt: new Date().toISOString()
    })
  },
  provisionPatientWorkflowDemo({ state, commit, rootState }) {
    const institution = rootState.auth.institution || 'CameroHealth Demo Hospital'
    const region = rootState.auth.region || 'Littoral'
    const now = new Date().toISOString()
    const patientId = 'PAT-WF360-DEMO'

    if (state.patients.some(patient => patient.id === patientId && patient.institution === institution)) {
      return patientId
    }

    commit('ADD_PATIENT', {
      id: patientId,
      firstName: 'Amina',
      middleName: '',
      lastName: 'Mballa',
      name: 'Amina Mballa',
      gender: 'Female',
      dob: '1988-04-18',
      phone: '+237 699 000 360',
      region,
      address: 'Bonaberi, Douala',
      bloodType: 'O+',
      externalId: 'MRN-360-0001',
      patientStatus: 'Admitted',
      patientClass: 'Inpatient',
      clinicSite: institution,
      institution,
      allergies: 'Penicillin',
      medicalHistory: 'Hypertension, chronic lower limb wound',
      surgicalHistory: 'None reported',
      familyHistory: 'Diabetes in mother',
      currentMeds: 'Amlodipine 5 mg daily',
      phiAccessBasis: 'Treatment',
      createdAt: now
    })

    commit('ADD_INPATIENT', {
      id: 'INP-WF360-DEMO',
      patientId,
      institution,
      region,
      ward: 'Medecine interne',
      bedNumber: 'MI-12',
      status: 'Admitted',
      admittedAt: now
    })

    commit('ADD_VITAL_SIGNS', {
      id: 'VIT-WF360-DEMO',
      patientId,
      institution,
      region,
      recordedBy: rootState.auth.fullName || 'Nurse Demo',
      recordedAt: now,
      bp: '138/84',
      hr: 86,
      rr: 18,
      temp: 37.2,
      spo2: 97,
      glucose: 1.1,
      weight: 72,
      height: 168,
      glasgow: 15,
      pain: 3
    })

    commit('ADD_VISIT', {
      id: 'VIS-WF360-DEMO',
      patientId,
      institution,
      region,
      encounterType: 'INFIRMIER',
      chiefComplaint: 'Follow-up wound dressing and pain review',
      triageLevel: 'Yellow',
      assessment: {
        generalCondition: 'Stable',
        consciousness: 'Alert and oriented',
        respiratoryStatus: 'Normal',
        nursingProblems: ['Acute pain', 'Risk of infection', 'Pressure injury risk']
      },
      recordedBy: rootState.auth.fullName || 'Nurse Demo',
      createdAt: now
    })

    commit('ADD_MEDICATION', {
      id: 'MED-WF360-DEMO',
      patientId,
      institution,
      drug: 'Amlodipine',
      dose: '5 mg',
      frequency: 'Daily',
      status: 'Active',
      prescribedAt: now
    })

    commit('ADD_LAB_ORDER', {
      id: 'LAB-WF360-DEMO',
      patientId,
      institution,
      test: 'CBC with differential',
      priority: 'Routine',
      status: 'Requested',
      requestedAt: now
    })

    commit('ADD_IMAGING_ORDER', {
      id: 'IMG-WF360-DEMO',
      patientId,
      institution,
      exam: 'Lower limb ultrasound',
      priority: 'Today',
      status: 'Requested',
      requestedAt: now
    })

    commit('ADD_TASK', {
      id: 'TSK-WF360-DEMO',
      patientId,
      institution,
      title: 'Wound dressing and photo documentation',
      assignedToRole: 'NURSE',
      priority: 'Today',
      status: 'pending',
      actionReason: 'Daily wound workflow',
      createdAt: now,
      createdBy: rootState.auth.fullName || 'Nurse Demo',
      updatedAt: now,
      updatedBy: rootState.auth.fullName || 'Nurse Demo',
      history: []
    })

    commit('ADD_NURSING_NOTE', {
      id: 'NNT-WF360-DEMO',
      patientId,
      institution,
      recordedBy: rootState.auth.fullName || 'Nurse Demo',
      recordedAt: now,
      observation: 'Patient stable. Wound dressing clean, pain controlled after repositioning.',
      actions: 'Vitals recorded, wound reviewed, patient education completed',
      response: 'Patient tolerated care well.',
      createdAt: now,
      updatedAt: now,
      auditTrail: []
    })

    return patientId
  },
  async logVisit({ commit, rootState, dispatch }, visit) {
    commit('ADD_VISIT', {
      ...visit,
      id: Date.now(),
      institution: rootState.auth.institution,
      region: rootState.auth.region,
      createdAt: new Date().toISOString()
    })
  },
  async reportFieldCase({ commit, rootState }, report) {
    commit('ADD_FIELD_REPORT', {
      ...report,
      id: Date.now(),
      institution: rootState.auth.institution,
      createdAt: new Date().toISOString()
    })
  },
  async syncToSupabase({ state }, payload) {
    const record = {
      facility_name: payload.facility_name,
      region: payload.region,
      disease: payload.disease,
      case_count: payload.case_count,
      recorded_at: new Date().toISOString()
    }

    console.log('--- SUPABASE SYNC ATTEMPT ---')
    console.log('Payload:', record)

    try {
      const { data, error } = await this.$supabase.from('health_telemetry').insert([record])

      if (error) {
        console.error('❌ Supabase Error:', error.message, '| Hint:', error.hint || 'Check RLS Policies')
        this.$toast.error(`Sync Blocked: ${error.message}`)
        return
      }

      console.log('✅ Sync Successful:', data)
      this.$toast.success('Synced to National Hub')
    } catch (e) {
      console.error('❌ Critical system failure during sync:', e)
    }
  },
  syncData({ commit }) {
    commit('SET_LAST_SYNC', new Date().toISOString())
    return new Promise(resolve => setTimeout(resolve, 1500))
  },
  admitPatient({ commit, rootState }, record) {
    commit('ADD_INPATIENT', {
      ...record,
      id: 'INP-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      status: 'Admitted',
      admittedAt: new Date().toISOString()
    })
  },
  updateInpatient({ commit }, record) {
    commit('UPDATE_INPATIENT', record)
  },
  scheduleAppointment({ commit, rootState }, appt) {
    commit('ADD_APPOINTMENT', {
      ...appt,
      id: 'APT-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      status: 'Scheduled',
      createdAt: new Date().toISOString()
    })
  },
  updateAppointment({ commit }, appt) {
    commit('UPDATE_APPOINTMENT', appt)
  },
  prescribeMedication({ commit, rootState }, med) {
    const medicationRecord = {
      ...med,
      id: 'MED-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      status: 'Active',
      prescribedAt: new Date().toISOString()
    }
    commit('ADD_MEDICATION', medicationRecord)
    return medicationRecord
  },
  updateMedication({ commit }, med) {
    commit('UPDATE_MEDICATION', med)
  },
  orderLab({ commit, rootState }, order) {
    const labOrderRecord = {
      ...order,
      id: 'LAB-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      status: 'Requested',
      requestedAt: new Date().toISOString()
    }
    commit('ADD_LAB_ORDER', labOrderRecord)
    return labOrderRecord
  },
  updateLabOrder({ commit }, order) {
    commit('UPDATE_LAB_ORDER', order)
  },
  orderImaging({ commit, rootState }, order) {
    const imagingOrderRecord = {
      ...order,
      id: 'IMG-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      status: 'Requested',
      requestedAt: new Date().toISOString()
    }
    commit('ADD_IMAGING_ORDER', imagingOrderRecord)
    return imagingOrderRecord
  },
  updateImagingOrder({ commit }, order) {
    commit('UPDATE_IMAGING_ORDER', order)
  },
  createInvoice({ commit, rootState }, invoice) {
    commit('ADD_INVOICE', {
      ...invoice,
      id: 'INV-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      status: 'Unpaid',
      createdAt: new Date().toISOString()
    })
  },
  updateInvoice({ commit }, invoice) {
    commit('UPDATE_INVOICE', invoice)
  },
  recordVitalSigns({ commit, rootState }, vitals) {
    commit('ADD_VITAL_SIGNS', {
      ...vitals,
      id: 'VIT-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution
    })
  },
  addNursingNote({ commit, rootState }, note) {
    const now = new Date().toISOString()
    const actor = note.recordedBy || rootState.auth.fullName || 'Unknown user'
    commit('ADD_NURSING_NOTE', {
      ...note,
      id: 'NNT-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      createdBy: actor,
      createdAt: now,
      updatedBy: actor,
      updatedAt: now,
      auditTrail: [
        {
          id: 'AUD-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          action: 'CREATED',
          actor,
          at: now,
          reason: 'Initial nursing note entry',
          changedFields: []
        }
      ]
    })
  },
  addMedicalNote({ commit, rootState }, note) {
    const now = new Date().toISOString()
    const actor = note.recordedBy || rootState.auth.fullName || 'Unknown user'
    commit('ADD_MEDICAL_NOTE', {
      ...note,
      id: 'MNT-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      createdBy: actor,
      createdAt: now,
      updatedBy: actor,
      updatedAt: now,
      auditTrail: [
        {
          id: 'AUD-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          action: 'CREATED',
          actor,
          at: now,
          reason: 'Initial medical note entry',
          changedFields: []
        }
      ]
    })
  },
  updateNursingNote({ state, commit, rootState }, payload) {
    const existing = state.nursingNotes.find(n => n.id === payload.id)
    if (!existing) return
    const now = new Date().toISOString()
    const actor = payload.updatedBy || rootState.auth.fullName || 'Unknown user'
    const updates = payload.updates || {}
    const next = {
      ...existing,
      ...updates,
      updatedBy: actor,
      updatedAt: now,
      auditTrail: [
        ...(existing.auditTrail || []),
        {
          id: 'AUD-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          action: 'UPDATED',
          actor,
          at: now,
          reason: payload.reason || 'Nursing note updated',
          changedFields: getChangedFields(existing, updates)
        }
      ]
    }
    commit('UPDATE_NURSING_NOTE', next)
  },
  updateMedicalNote({ state, commit, rootState }, payload) {
    const existing = state.medicalNotes.find(n => n.id === payload.id)
    if (!existing) return
    const now = new Date().toISOString()
    const actor = payload.updatedBy || rootState.auth.fullName || 'Unknown user'
    const updates = payload.updates || {}
    const next = {
      ...existing,
      ...updates,
      updatedBy: actor,
      updatedAt: now,
      auditTrail: [
        ...(existing.auditTrail || []),
        {
          id: 'AUD-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          action: 'UPDATED',
          actor,
          at: now,
          reason: payload.reason || 'Medical note updated',
          changedFields: getChangedFields(existing, updates)
        }
      ]
    }
    commit('UPDATE_MEDICAL_NOTE', next)
  },
  createTask({ commit, rootState }, task) {
    const now = new Date().toISOString()
    const actor = rootState.auth.fullName || 'Unknown user'
    const record = {
      ...task,
      id: 'TSK-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      status: 'pending',
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
      actionReason: task.actionReason || 'Task created from clinical order',
      history: [
        {
          id: 'THS-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          action: 'CREATED',
          status: 'pending',
          actor,
          at: now,
          reason: task.actionReason || 'Task created from clinical order'
        }
      ]
    }
    commit('ADD_TASK', record)
    return record
  },
  updateTaskStatus({ state, commit, rootState }, payload) {
    const task = state.tasks.find(t => t.id === payload.id)
    if (!task) return
    if (!['done', 'hold', 'cancel'].includes(payload.status)) return
    const now = new Date().toISOString()
    const actor = payload.updatedBy || rootState.auth.fullName || 'Unknown user'
    const reason = payload.reason || 'Task status updated'
    const next = {
      ...task,
      status: payload.status,
      updatedAt: now,
      updatedBy: actor,
      actionReason: reason,
      history: [
        ...(task.history || []),
        {
          id: 'THS-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          action: 'STATUS_UPDATED',
          status: payload.status,
          actor,
          at: now,
          reason
        }
      ]
    }
    commit('UPDATE_TASK', next)
  },
  createDocument({ commit, rootState }, document) {
    commit('ADD_DOCUMENT', {
      ...document,
      id: 'DOC-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      status: document.status || 'Filed',
      createdAt: new Date().toISOString(),
      createdBy: rootState.auth.fullName || 'Unknown user'
    })
  },
  updateDocument({ commit }, document) {
    commit('UPDATE_DOCUMENT', document)
  },
  createInsuranceClaim({ commit, rootState }, claim) {
    commit('ADD_INSURANCE_CLAIM', {
      ...claim,
      id: 'CLM-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      status: claim.status || 'Draft',
      createdAt: new Date().toISOString()
    })
  },
  updateInsuranceClaim({ commit }, claim) {
    commit('UPDATE_INSURANCE_CLAIM', claim)
  },
  createReferral({ commit, rootState }, referral) {
    commit('ADD_REFERRAL', {
      ...referral,
      id: 'REF-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      status: referral.status || 'Open',
      createdAt: new Date().toISOString(),
      createdBy: rootState.auth.fullName || 'Unknown user'
    })
  },
  updateReferral({ commit }, referral) {
    commit('UPDATE_REFERRAL', referral)
  },
  createMedicalTemplate({ commit, rootState }, template) {
    commit('ADD_MEDICAL_TEMPLATE', {
      ...template,
      id: 'TPL-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      createdAt: new Date().toISOString()
    })
  },
  updateMedicalTemplate({ commit }, template) {
    commit('UPDATE_MEDICAL_TEMPLATE', template)
  },
  createPortalMessage({ commit, rootState }, message) {
    commit('ADD_PORTAL_MESSAGE', {
      ...message,
      id: 'MSG-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      status: message.status || 'Unread',
      createdAt: new Date().toISOString()
    })
  },
  updatePortalMessage({ commit }, message) {
    commit('UPDATE_PORTAL_MESSAGE', message)
  },
  createVoiceDraft({ commit, rootState }, draft) {
    commit('ADD_VOICE_DRAFT', {
      ...draft,
      id: 'VOC-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      institution: rootState.auth.institution,
      status: draft.status || 'Draft',
      createdAt: new Date().toISOString(),
      createdBy: rootState.auth.fullName || 'Unknown user'
    })
  },
  updateVoiceDraft({ commit }, draft) {
    commit('UPDATE_VOICE_DRAFT', draft)
  }
}

export const getters = {
  // ROLE HELPERS
  isClinical: (state, getters, rootState) => [
    'ADMIN',
    'DOCTOR',
    'NP',
    'NURSE',
    'CNA',
    'MIDWIFE',
    'MAJOR_SERVICE',
    'NURSING_SUPERVISOR',
    'LAB',
    'IMAGING',
    'PHARMACY',
    'BILLING',
    'RECORDS',
    'FRONT_DESK',
    'SOCIAL_WORKER',
    'PHYSIOTHERAPIST',
    'CLINICAL_STAFF'
  ].includes(rootState.auth.role),
  isMinistry: (state, getters, rootState) => ['PUBLIC_HEALTH_OFFICER', 'EPIDEMIOLOGIST'].includes(rootState.auth.role),

  // FILTERED DATA
  getPatients: (state, getters, rootState) => {
    // Ministry users sees ONLY anonymized stats conceptually (handled in view)
    // For simplicity here, we filter by institution for clinical staff
    if (getters.isClinical) {
      return state.patients.filter(p => p.institution === rootState.auth.institution)
    }
    return state.patients
  },

  getVisits: (state, getters, rootState) => {
    if (getters.isClinical) {
      return state.visits.filter(v => v.institution === rootState.auth.institution)
    }
    return state.visits
  },

  getFieldReports: state => state.fieldReports,
  getInpatients: (state, getters, rootState) => {
    if (getters.isClinical) return state.inpatients.filter(i => i.institution === rootState.auth.institution)
    return state.inpatients
  },
  getAppointments: (state, getters, rootState) => {
    if (getters.isClinical) return state.appointments.filter(a => a.institution === rootState.auth.institution)
    return state.appointments
  },
  getMedications: (state, getters, rootState) => {
    if (getters.isClinical) return state.medications.filter(m => m.institution === rootState.auth.institution)
    return state.medications
  },
  getLabOrders: (state, getters, rootState) => {
    if (getters.isClinical) return state.labOrders.filter(l => l.institution === rootState.auth.institution)
    return state.labOrders
  },
  getImagingOrders: (state, getters, rootState) => {
    if (getters.isClinical) return state.imagingOrders.filter(i => i.institution === rootState.auth.institution)
    return state.imagingOrders
  },
  getInvoices: (state, getters, rootState) => {
    if (getters.isClinical) return state.invoices.filter(i => i.institution === rootState.auth.institution)
    return state.invoices
  },
  getVitalSigns: (state, getters, rootState) => {
    if (getters.isClinical) return state.vitalSigns.filter(v => v.institution === rootState.auth.institution)
    return state.vitalSigns
  },
  getNursingNotes: (state, getters, rootState) => {
    if (getters.isClinical) return state.nursingNotes.filter(n => n.institution === rootState.auth.institution)
    return state.nursingNotes
  },
  getMedicalNotes: (state, getters, rootState) => {
    if (getters.isClinical) return state.medicalNotes.filter(n => n.institution === rootState.auth.institution)
    return state.medicalNotes
  },
  getTasks: (state, getters, rootState) => {
    if (getters.isClinical) return state.tasks.filter(t => t.institution === rootState.auth.institution)
    return state.tasks
  },
  getDocuments: (state, getters, rootState) => {
    if (getters.isClinical) return state.documents.filter(item => item.institution === rootState.auth.institution)
    return state.documents
  },
  getInsuranceClaims: (state, getters, rootState) => {
    if (getters.isClinical) return state.insuranceClaims.filter(item => item.institution === rootState.auth.institution)
    return state.insuranceClaims
  },
  getReferrals: (state, getters, rootState) => {
    if (getters.isClinical) return state.referrals.filter(item => item.institution === rootState.auth.institution)
    return state.referrals
  },
  getMedicalTemplates: (state, getters, rootState) => {
    const templates = state.medicalTemplates && state.medicalTemplates.length ? state.medicalTemplates : defaultMedicalTemplates()
    if (getters.isClinical) return templates.filter(item => !item.institution || item.institution === rootState.auth.institution)
    return templates
  },
  getPortalMessages: (state, getters, rootState) => {
    if (getters.isClinical) return state.portalMessages.filter(item => item.institution === rootState.auth.institution)
    return state.portalMessages
  },
  getVoiceDrafts: (state, getters, rootState) => {
    if (getters.isClinical) return state.voiceDrafts.filter(item => item.institution === rootState.auth.institution)
    return state.voiceDrafts
  },
  patientDirectory: (state, getters) => {
    const patients = getters.getPatients || []
    const visits = getters.getVisits || []
    const appointments = getters.getAppointments || []
    const inpatients = getters.getInpatients || []
    const labOrders = getters.getLabOrders || []
    const imagingOrders = getters.getImagingOrders || []
    const vitalSigns = getters.getVitalSigns || []
    const tasks = getters.getTasks || []
    const documents = getters.getDocuments || []
    const claims = getters.getInsuranceClaims || []
    const referrals = getters.getReferrals || []
    const portalMessages = getters.getPortalMessages || []

    return patients.map(patient => {
      const patientVisits = visits.filter(item => item.patientId === patient.id)
      const patientAppointments = appointments.filter(item => item.patientId === patient.id)
      const patientLabs = labOrders.filter(item => item.patientId === patient.id)
      const patientImaging = imagingOrders.filter(item => item.patientId === patient.id)
      const patientTasks = tasks.filter(item => item.patientId === patient.id)
      const activeInpatient = inpatients.find(item => item.patientId === patient.id && item.status !== 'Discharged')
      const latestVisit = latestByDate(patientVisits, 'createdAt')
      const latestVitals = latestByDate(vitalSigns.filter(item => item.patientId === patient.id), 'recordedAt')
      const nextAppointment = upcomingAppointment(patientAppointments)
      const openOrders = [
        ...patientLabs.filter(item => item.status !== 'Completed'),
        ...patientImaging.filter(item => item.status !== 'Completed')
      ]
      const openTasks = patientTasks.filter(item => item.status === 'pending' || item.status === 'hold')
      const patientDocuments = documents.filter(item => item.patientId === patient.id)
      const patientClaims = claims.filter(item => item.patientId === patient.id)
      const patientReferrals = referrals.filter(item => item.patientId === patient.id)
      const patientPortalMessages = portalMessages.filter(item => item.patientId === patient.id)
      const risk = computePatientRisk({ patient, latestVitals, latestVisit, activeInpatient, openTasks, openOrders })

      return {
        ...patient,
        displayName: patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
        mrn: patient.externalId || patient.id,
        currentDepartment: resolveCurrentDepartment({ patient, activeInpatient, openOrders, latestVisit, nextAppointment }),
        riskLevel: risk.level,
        riskReasons: risk.reasons,
        latestVisit,
        latestVitals,
        activeInpatient,
        nextAppointment,
        openOrders,
        openTasks,
        documents: patientDocuments,
        claims: patientClaims,
        referrals: patientReferrals,
        portalMessages: patientPortalMessages,
        lastActivityAt: latestActivityDate([patient.createdAt, latestVisit && latestVisit.createdAt, latestVitals && latestVitals.recordedAt, nextAppointment && nextAppointment.date])
      }
    })
  },
  departmentQueues: (state, getters) => {
    const directory = getters.patientDirectory || []
    const labs = getters.getLabOrders || []
    const imaging = getters.getImagingOrders || []
    const appointments = getters.getAppointments || []
    const inpatients = getters.getInpatients || []
    const tasks = getters.getTasks || []

    return [
      {
        key: 'front-desk',
        title: 'Registration / Intake',
        icon: 'mdi-clipboard-account',
        color: '#003366',
        patients: directory.filter(patient => !patient.latestVisit && !patient.activeInpatient),
        nextAction: 'Complete intake and confirm demographics'
      },
      {
        key: 'triage',
        title: 'Nursing / Triage',
        icon: 'mdi-stethoscope',
        color: '#00A99D',
        patients: directory.filter(patient => patient.riskLevel !== 'low' || !patient.latestVitals),
        nextAction: 'Capture vitals, allergies, acuity and nursing note'
      },
      {
        key: 'provider',
        title: 'Provider Review',
        icon: 'mdi-medical-bag',
        color: '#0B3D2E',
        patients: directory.filter(patient => patient.latestVitals && (!patient.latestVisit || patient.openTasks.length > 0)),
        nextAction: 'Review chart, diagnose, place orders and plan care'
      },
      {
        key: 'diagnostics',
        title: 'Diagnostics',
        icon: 'mdi-flask-outline',
        color: '#D97706',
        patients: directory.filter(patient => patient.openOrders.length > 0),
        nextAction: 'Complete pending lab and imaging orders'
      },
      {
        key: 'inpatient',
        title: 'Inpatient / Ward',
        icon: 'mdi-bed',
        color: '#1F7A5C',
        patients: directory.filter(patient => patient.activeInpatient),
        nextAction: 'Track ward status, bed, notes and discharge readiness'
      }
    ].map(queue => ({
      ...queue,
      total: queue.patients.length,
      highRisk: queue.patients.filter(patient => patient.riskLevel === 'high').length
    })).concat({
      key: 'scheduled',
      title: 'Scheduled Today',
      icon: 'mdi-calendar-clock',
      color: '#4B5563',
      patients: directory.filter(patient => patient.nextAppointment && isToday(patient.nextAppointment.date)),
      total: appointments.filter(item => item.status === 'Scheduled' && isToday(item.date)).length,
      highRisk: 0,
      nextAction: 'Confirm arrivals and route to intake'
    }, {
      key: 'task-worklist',
      title: 'Care Team Tasks',
      icon: 'mdi-format-list-checks',
      color: '#6D28D9',
      patients: directory.filter(patient => patient.openTasks.length > 0),
      total: tasks.filter(item => item.status === 'pending' || item.status === 'hold').length,
      highRisk: 0,
      nextAction: 'Close, hold or cancel assigned care tasks'
    }, {
      key: 'beds',
      title: 'Active Beds',
      icon: 'mdi-hospital-building',
      color: '#0F766E',
      patients: directory.filter(patient => patient.activeInpatient),
      total: inpatients.filter(item => item.status !== 'Discharged').length,
      highRisk: inpatients.filter(item => item.status === 'Critical').length,
      nextAction: 'Monitor occupancy and critical ward patients'
    })
  },
  clinicalCommandMetrics: (state, getters) => {
    const directory = getters.patientDirectory || []
    const queues = getters.departmentQueues || []
    const labOrders = getters.getLabOrders || []
    const imagingOrders = getters.getImagingOrders || []
    const tasks = getters.getTasks || []
    const inpatients = getters.getInpatients || []
    const documents = getters.getDocuments || []
    const claims = getters.getInsuranceClaims || []
    const referrals = getters.getReferrals || []
    const portalMessages = getters.getPortalMessages || []

    return {
      activePatients: directory.filter(patient => patient.currentDepartment !== 'Registry').length,
      highRiskPatients: directory.filter(patient => patient.riskLevel === 'high').length,
      pendingDiagnostics: labOrders.filter(item => item.status !== 'Completed').length + imagingOrders.filter(item => item.status !== 'Completed').length,
      openTasks: tasks.filter(item => item.status === 'pending' || item.status === 'hold').length,
      admittedPatients: inpatients.filter(item => item.status !== 'Discharged').length,
      pendingClaims: claims.filter(item => !['Paid', 'Denied', 'Closed'].includes(item.status)).length,
      openReferrals: referrals.filter(item => item.status !== 'Closed').length,
      unreadPortalMessages: portalMessages.filter(item => item.status === 'Unread').length,
      filedDocuments: documents.length,
      busiestQueue: queues.reduce((current, queue) => (queue.total > (current.total || 0) ? queue : current), {})
    }
  },
  isOffline: state => state.offlineMode,
  getViewMode: state => state.viewMode,

  // Intelligence: Rule-based alerts for infectious diseases
  infectiousAlerts: (state, getters, rootState) => {
    const alerts = []
    const regions = ['Far North', 'North', 'Adamawa', 'Centre', 'South', 'East', 'West', 'Littoral', 'South-West', 'North-West']

    // Check field reports for outbreaks
    state.fieldReports.forEach(report => {
      if (report.severity === 'High') {
        alerts.push({
          id: 'field-' + report.id,
          type: 'error',
          title: `Critical Outbreak: ${report.disease}`,
          message: `${report.cases} cases reported in ${report.region}. Severity: HIGH.`,
          region: report.region
        })
      }
    })

    return alerts
  },

  // Chronic transition alerts
  chronicAlerts: (state) => {
    const alerts = []
    const chronicVisits = state.visits.filter(v => v.type === 'Chronic')
    if (chronicVisits.length > 5) {
      alerts.push({
        id: 'chronic-trend',
        type: 'warning',
        title: 'Rising Chronic Trend',
        message: 'Steady increase in chronic disease visits detected in the field layer.',
        region: 'National'
      })
    }
    return alerts
  }
}

function saveToLocalStorage(key, data) {
  if (process.client) {
    localStorage.setItem('camero_health_' + key, JSON.stringify(data))
  }
}

function loadFromLocalStorage(key) {
  if (process.client) {
    const data = localStorage.getItem('camero_health_' + key)
    return data ? JSON.parse(data) : null
  }
  return null
}

function getChangedFields(previous, updates) {
  return Object.keys(updates).filter((key) => {
    const prev = JSON.stringify(previous[key])
    const next = JSON.stringify(updates[key])
    return prev !== next
  })
}

function latestByDate(records, field) {
  if (!records || !records.length) return null
  return [...records].sort((a, b) => new Date(b[field] || 0) - new Date(a[field] || 0))[0]
}

function upcomingAppointment(appointments) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return [...(appointments || [])]
    .filter(item => item.status === 'Scheduled' && new Date(item.date) >= today)
    .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`))[0] || null
}

function latestActivityDate(values) {
  const dates = values.filter(Boolean).map(value => new Date(value)).filter(date => !isNaN(date.getTime()))
  if (!dates.length) return null
  return new Date(Math.max(...dates.map(date => date.getTime()))).toISOString()
}

function resolveCurrentDepartment({ patient, activeInpatient, openOrders, latestVisit, nextAppointment }) {
  if (activeInpatient) return activeInpatient.ward || 'Inpatient'
  if (openOrders && openOrders.length) return 'Diagnostics'
  if (latestVisit && latestVisit.encounterType === 'MÉDICAL') return 'Provider Follow-up'
  if (latestVisit && latestVisit.encounterType === 'INFIRMIER') return 'Nursing Review'
  if (nextAppointment && isToday(nextAppointment.date)) return 'Scheduled Today'
  if (patient.departmentRouting) return patient.departmentRouting
  return 'Registry'
}

function computePatientRisk({ patient, latestVitals, latestVisit, activeInpatient, openTasks, openOrders }) {
  const reasons = []
  if (patient.patientStatus === 'Emergency') reasons.push('Emergency intake')
  if (patient.allergies && patient.allergies.trim()) reasons.push('Known allergy')
  if (activeInpatient && activeInpatient.status === 'Critical') reasons.push('Critical inpatient')
  if (latestVisit && ['High', 'Critical'].includes(latestVisit.severity)) reasons.push(`${latestVisit.severity} severity encounter`)
  if (latestVitals) {
    const systolic = parseInt(String(latestVitals.bp || '').split('/')[0])
    const temperature = parseFloat(latestVitals.temp)
    const spo2 = parseFloat(latestVitals.spo2)
    if (systolic >= 180 || systolic < 90) reasons.push('Blood pressure out of range')
    if (temperature >= 39 || temperature < 36) reasons.push('Temperature out of range')
    if (spo2 && spo2 < 92) reasons.push('Low oxygen saturation')
  }
  if ((openTasks || []).length >= 3) reasons.push('Multiple open care tasks')
  if ((openOrders || []).some(order => ['STAT', 'Emergency', 'Urgent'].includes(order.priority))) reasons.push('Urgent diagnostic order')

  if (reasons.length >= 2 || reasons.some(reason => /Critical|Emergency|oxygen|Blood pressure/.test(reason))) {
    return { level: 'high', reasons }
  }
  if (reasons.length === 1 || (openOrders || []).length || (openTasks || []).length) {
    return { level: 'medium', reasons: reasons.length ? reasons : ['Open care activity'] }
  }
  return { level: 'low', reasons: [] }
}

function isToday(value) {
  if (!value) return false
  const date = new Date(value)
  const today = new Date()
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate()
}

function defaultMedicalTemplates() {
  return [
    {
      id: 'TPL-SOAP-GENERAL',
      name: 'SOAP General Visit',
      specialty: 'Primary Care',
      type: 'Encounter Note',
      sections: 'Subjective\nObjective\nAssessment\nPlan\nFollow-up',
      phrase: 'Patient presents for evaluation. Vitals reviewed. Assessment and plan discussed with patient.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'TPL-ED-TRIAGE',
      name: 'Emergency Triage',
      specialty: 'Emergency',
      type: 'Triage',
      sections: 'Chief complaint\nAcuity\nVitals\nRed flags\nImmediate actions',
      phrase: 'Triage completed. Patient assigned acuity based on presenting complaint and vital signs.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'TPL-DISCHARGE',
      name: 'Discharge Summary',
      specialty: 'Inpatient',
      type: 'Discharge',
      sections: 'Admission diagnosis\nHospital course\nDischarge medications\nInstructions\nFollow-up',
      phrase: 'Patient discharged in stable condition with instructions and follow-up plan reviewed.',
      createdAt: new Date().toISOString()
    }
  ]
}
