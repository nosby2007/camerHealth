const { assertPatientWritable: assertWritableRecord } = require('../util/patient-360-policy.cjs')
const { generateTasksFromOrder, nextTaskFromCompletion } = require('../services/clinical/workflowEngine')
import { patientApi, clinicalApi, appointmentApi, inpatientApi, vitalsApi, clinicalNotesApi, taskApi, careTeamApi } from '~/services/api'
import { enqueue, isNetworkError } from '~/util/offline-queue'

export const namespaced = true

function belongsToAuthenticatedFacility(record, rootState) {
  const facilityId = rootState.auth && rootState.auth.facilityId
  return Boolean(facilityId && record && record.facilityId === facilityId)
}

function tenantFields(rootState) {
  return {
    facilityId: rootState.auth.facilityId,
    institution: rootState.auth.institution
  }
}

export const state = () => ({
  patients: [],
  visits: [],
  fieldReports: [],
  inpatients: [],
  appointments: [],
  medications: [],
  medicationAdministrations: [],
  labOrders: [],
  imagingOrders: [],
  invoices: [],
  vitalSigns: [],
  nursingNotes: [],
  medicalNotes: [],
  tasks: [],
  careTeamMembers: [],
  socialAssessments: [],
  documents: [],
  insuranceClaims: [],
  referrals: [],
  medicalTemplates: [],
  portalMessages: [],
  voiceDrafts: [],
  offlineMode: false,
  lastSync: null,
  viewMode: 'national',
  selectedAdmissionPatient: null,
  loading: false,
  error: null
})

export const mutations = {
  SET_PATIENTS(state, patients) { state.patients = patients },
  ADD_PATIENT(state, patient) { state.patients.push(patient) },
  UPSERT_PATIENT(state, patient) {
    const idx = state.patients.findIndex(item => item.id === patient.id)
    if (idx === -1) state.patients.push(patient)
    else state.patients.splice(idx, 1, patient)
  },
  UPDATE_PATIENT(state, patient) {
    const idx = state.patients.findIndex(item => item.id === patient.id)
    if (idx !== -1) {
      state.patients.splice(idx, 1, patient)
    }
  },
  UPDATE_PATIENT_ADMISSION_FLAG(state, payload) {
    const p = state.patients.find(pt => pt.id === payload.patientId)
    if (p) {
      p.pendingAdmission = payload.ward
      p.admissionStatus = payload.status
      p.admissionReason = payload.admissionReason || ''
    }
  },
  SET_VISITS(state, visits) { state.visits = visits },
  ADD_VISIT(state, visit) { state.visits.push(visit) },
  ADD_FIELD_REPORT(state, report) { state.fieldReports.push(report) },
  SET_OFFLINE_MODE(state, mode) { state.offlineMode = mode },
  SET_VIEW_MODE(state, mode) { state.viewMode = mode },
  SET_LAST_SYNC(state, timestamp) { state.lastSync = timestamp },
  SET_INPATIENTS(state, records) { state.inpatients = records },
  ADD_INPATIENT(state, record) { state.inpatients.push(record) },
  UPDATE_INPATIENT(state, record) {
    const idx = state.inpatients.findIndex(i => i.id === record.id)
    if (idx !== -1) state.inpatients.splice(idx, 1, record)
  },
  SET_APPOINTMENTS(state, appts) { state.appointments = appts },
  ADD_APPOINTMENT(state, appt) { state.appointments.push(appt) },
  UPDATE_APPOINTMENT(state, appt) {
    const idx = state.appointments.findIndex(a => a.id === appt.id)
    if (idx !== -1) state.appointments.splice(idx, 1, appt)
  },
  SET_MEDICATIONS(state, meds) { state.medications = meds },
  ADD_MEDICATION(state, med) { state.medications.push(med) },
  UPDATE_MEDICATION(state, med) {
    const idx = state.medications.findIndex(m => m.id === med.id)
    if (idx !== -1) state.medications.splice(idx, 1, med)
  },
  SET_MEDICATION_ADMINISTRATIONS(state, rows) { state.medicationAdministrations = rows },
  UPSERT_MEDICATION_ADMINISTRATION(state, row) {
    if (!row) return
    const idx = state.medicationAdministrations.findIndex(a => a.id === row.id)
    if (idx !== -1) state.medicationAdministrations.splice(idx, 1, row)
    else state.medicationAdministrations.push(row)
  },
  SET_LAB_ORDERS(state, orders) { state.labOrders = orders },
  ADD_LAB_ORDER(state, order) { state.labOrders.push(order) },
  UPDATE_LAB_ORDER(state, order) {
    const idx = state.labOrders.findIndex(o => o.id === order.id)
    if (idx !== -1) state.labOrders.splice(idx, 1, order)
  },
  SET_IMAGING_ORDERS(state, orders) { state.imagingOrders = orders },
  ADD_IMAGING_ORDER(state, order) { state.imagingOrders.push(order) },
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
    // Patient identity is server-authoritative. The former global cache could
    // survive a facility switch and must never repopulate another tenant.
    state.patients = []
    if (process.client) localStorage.removeItem('camero_health_patients')
    state.visits = loadFromLocalStorage('visits') || []
    state.fieldReports = loadFromLocalStorage('fieldReports') || []
    state.inpatients = loadFromLocalStorage('inpatients') || []
    // Appointments are server-authoritative. Legacy APT-* demo records cannot
    // be patched by the UUID-based API and may also survive a facility switch.
    state.appointments = []
    if (process.client) localStorage.removeItem('camero_health_appointments')
    state.medications = loadFromLocalStorage('medications') || []
    state.labOrders = loadFromLocalStorage('labOrders') || []
    state.imagingOrders = loadFromLocalStorage('imagingOrders') || []
    state.invoices = loadFromLocalStorage('invoices') || []
    state.vitalSigns = loadFromLocalStorage('vitalSigns') || []
    state.nursingNotes = loadFromLocalStorage('nursingNotes') || []
    state.medicalNotes = loadFromLocalStorage('medicalNotes') || []
    state.tasks = loadFromLocalStorage('tasks') || []
    state.careTeamMembers = loadFromLocalStorage('careTeamMembers') || []
    state.socialAssessments = loadFromLocalStorage('socialAssessments') || []
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
    }
  },
  SET_LOADING(state, val) { state.loading = val },
  SET_ERROR(state, err) { state.error = err },
  SET_SELECTED_ADMISSION_PATIENT(state, patient) { state.selectedAdmissionPatient = patient },
  SET_MEDICAL_TEMPLATES(state, templates) { state.medicalTemplates = templates },
  UPDATE_MEDICAL_NOTE(state, note) {
    const idx = state.medicalNotes.findIndex(n => n.id === note.id)
    if (idx !== -1) state.medicalNotes.splice(idx, 1, note)
  },
  ADD_TASK(state, task) {
    state.tasks.push(task)
    saveToLocalStorage('tasks', state.tasks)
  },
  SET_TASKS(state, tasks) {
    state.tasks = tasks
    saveToLocalStorage('tasks', state.tasks)
  },
  // Upserts one patient's tasks into the shared facility-wide array instead
  // of replacing it outright — a per-patient chart fetch must not wipe out
  // every other patient's tasks that the dashboard's facility-wide fetch
  // already loaded (and vice versa).
  MERGE_PATIENT_TASKS(state, { patientId, tasks }) {
    const others = state.tasks.filter(t => t.patientId !== patientId)
    state.tasks = [...others, ...tasks]
    saveToLocalStorage('tasks', state.tasks)
  },
  ADD_CARE_TEAM_MEMBER(state, member) {
    state.careTeamMembers.push(member)
    saveToLocalStorage('careTeamMembers', state.careTeamMembers)
  },
  SET_CARE_TEAM_MEMBERS(state, members) {
    state.careTeamMembers = members
    saveToLocalStorage('careTeamMembers', state.careTeamMembers)
  },
  ADD_SOCIAL_ASSESSMENT(state, assessment) {
    state.socialAssessments.push(assessment)
    saveToLocalStorage('socialAssessments', state.socialAssessments)
  },
  SET_SOCIAL_ASSESSMENTS(state, assessments) {
    state.socialAssessments = assessments
    saveToLocalStorage('socialAssessments', state.socialAssessments)
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
  registerPatientLocal({ commit, rootState }, patient) {
    const id = 'PAT-' + Math.random().toString(36).substr(2, 9).toUpperCase()
    const mrn = patient.mrn || `MRN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    const barcode = patient.barcode || `BR-${id.replace(/^PAT-/, '')}-${Date.now().toString().slice(-6)}`
    const record = {
      ...patient,
      id,
      mrn,
      barcode,
      ...tenantFields(rootState),
      region: patient.region || rootState.auth.region,
      createdAt: new Date().toISOString()
    }
    commit('ADD_PATIENT', record)
    return record
  },
  updatePatientLocal({ state, commit, rootState }, { patientId, updates }) {
    const existing = state.patients.find(item => item.id === patientId)
    if (!existing) return null
    const record = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: rootState.auth.fullName || rootState.auth.staffId || 'Clinical user'
    }
    commit('UPDATE_PATIENT', record)
    return record
  },
  dischargePatient({ state, commit, rootState }, payload) {
    const patientId = payload.patientId
    const existing = state.patients.find(item => item.id === patientId)
    if (!existing) throw new Error('Patient record not found')
    if (String(existing.patientStatus || '').toLowerCase() === 'discharged') return existing
    const requestedDischargeAt = payload.dischargedAt || payload.dischargeDateTime
    const parsedDischargeAt = requestedDischargeAt ? new Date(requestedDischargeAt) : new Date()
    const dischargedAt = isNaN(parsedDischargeAt.getTime()) ? new Date().toISOString() : parsedDischargeAt.toISOString()
    const actor = rootState.auth.fullName || rootState.auth.staffId || 'Clinical user'
    const dischargeRecord = {
      ...existing,
      patientStatus: 'Discharged',
      admissionStatus: 'Discharged',
      recordStatus: 'Inactive',
      active: false,
      dischargedAt,
      dischargeDisposition: payload.disposition || payload.dischargeDisposition || 'Home',
      dischargeReason: payload.reason || payload.primaryDiagnosis || payload.note || 'Discharge workflow completed',
      dischargedBy: actor,
      updatedAt: dischargedAt,
      updatedBy: actor
    }
    commit('UPDATE_PATIENT', dischargeRecord)

    state.inpatients
      .filter(item => item.patientId === patientId && String(item.status || '').toLowerCase() !== 'discharged')
      .forEach(item => commit('UPDATE_INPATIENT', {
        ...item,
        status: 'Discharged',
        dischargedAt,
        dischargeDisposition: dischargeRecord.dischargeDisposition,
        dischargedBy: actor
      }))

    state.tasks
      .filter(item => item.patientId === patientId && ['pending', 'hold'].includes(String(item.status || '').toLowerCase()))
      .forEach(item => commit('UPDATE_TASK', {
        ...item,
        status: 'cancel',
        updatedAt: dischargedAt,
        updatedBy: actor,
        actionReason: 'Closed by completed discharge workflow',
        history: [
          ...(item.history || []),
          {
            id: 'THS-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
            action: 'STATUS_UPDATED',
            status: 'cancel',
            actor,
            at: dischargedAt,
            reason: 'Closed by completed discharge workflow'
          }
        ]
      }))

    state.medications
      .filter(item => item.patientId === patientId && String(item.status || '').toLowerCase() === 'active')
      .forEach(item => commit('UPDATE_MEDICATION', {
        ...item,
        status: 'Discontinued',
        discontinuedAt: dischargedAt,
        discontinuedBy: actor,
        discontinuationReason: 'Patient discharged'
      }))

    return dischargeRecord
  },
  provisionPatientWorkflowDemoLocal({ state, commit, rootState }) {
    const institution = rootState.auth.institution || 'CameroHealth Demo Hospital'
    const region = rootState.auth.region || 'Littoral'
    const now = new Date().toISOString()
    const facilityId = rootState.auth.facilityId
    if (!facilityId) throw new Error('A facility-scoped session is required')
    const tenant = tenantFields(rootState)
    const patientId = `PAT-WF360-${facilityId.slice(0, 8).toUpperCase()}`

    if (state.patients.some(patient => patient.id === patientId && patient.facilityId === facilityId)) {
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
      mrn: 'MRN-360-0001',
      externalId: 'MRN-360-0001',
      barcode: 'BR-WF360-0001',
      patientStatus: 'Admitted',
      patientClass: 'Inpatient',
      clinicSite: institution,
      ...tenant,
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
      ...tenant,
      region,
      ward: 'Medecine interne',
      bedNumber: 'MI-12',
      status: 'Admitted',
      admittedAt: now
    })

    commit('ADD_VITAL_SIGNS', {
      id: 'VIT-WF360-DEMO',
      patientId,
      ...tenant,
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
      ...tenant,
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
      ...tenant,
      drug: 'Amlodipine',
      dose: '5 mg',
      frequency: 'Daily',
      status: 'Active',
      prescribedAt: now
    })

    commit('ADD_LAB_ORDER', {
      id: 'LAB-WF360-DEMO',
      patientId,
      ...tenant,
      test: 'CBC with differential',
      priority: 'Routine',
      status: 'Requested',
      requestedAt: now
    })

    commit('ADD_IMAGING_ORDER', {
      id: 'IMG-WF360-DEMO',
      patientId,
      ...tenant,
      exam: 'Lower limb ultrasound',
      priority: 'Today',
      status: 'Requested',
      requestedAt: now
    })

    commit('ADD_TASK', {
      id: 'TSK-WF360-DEMO',
      patientId,
      ...tenant,
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
      ...tenant,
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
  async logVisitLocal({ state, commit, rootState, dispatch }, visit) {
    assertPatientWritable(state, visit.patientId)
    commit('ADD_VISIT', {
      ...visit,
      id: Date.now(),
      ...tenantFields(rootState),
      region: rootState.auth.region,
      createdAt: new Date().toISOString()
    })
  },
  async reportFieldCase({ commit, rootState }, report) {
    commit('ADD_FIELD_REPORT', {
      ...report,
      id: Date.now(),
      ...tenantFields(rootState),
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
  admitPatientLocal({ state, commit, rootState }, record) {
    assertPatientWritable(state, record.patientId)
    commit('ADD_INPATIENT', {
      ...record,
      id: 'INP-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      ...tenantFields(rootState),
      status: 'Admitted',
      admittedAt: new Date().toISOString()
    })
  },
  updateInpatientLocal({ state, commit }, record) {
    const existing = state.inpatients.find(item => item.id === record.id)
    assertPatientWritable(state, record.patientId || (existing && existing.patientId))
    commit('UPDATE_INPATIENT', record)
  },
  scheduleAppointmentLocal({ commit, rootState }, appt) {
    commit('ADD_APPOINTMENT', {
      ...appt,
      id: 'APT-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      ...tenantFields(rootState),
      status: 'Scheduled',
      createdAt: new Date().toISOString()
    })
  },
  updateAppointmentLocal({ commit }, appt) {
    commit('UPDATE_APPOINTMENT', appt)
  },
  prescribeMedicationLocal({ state, commit, rootState }, med) {
    assertPatientWritable(state, med.patientId)
    const medicationRecord = {
      ...med,
      id: 'MED-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      ...tenantFields(rootState),
      status: 'Active',
      prescribedAt: new Date().toISOString()
    }
    commit('ADD_MEDICATION', medicationRecord)
    return medicationRecord
  },
  updateMedicationLocal({ state, commit }, med) {
    const existing = state.medications.find(item => item.id === med.id)
    assertPatientWritable(state, med.patientId || (existing && existing.patientId))
    commit('UPDATE_MEDICATION', med)
  },
  orderLabLocal({ state, commit, rootState }, order) {
    assertPatientWritable(state, order.patientId)
    const labOrderRecord = {
      ...order,
      id: 'LAB-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      ...tenantFields(rootState),
      status: 'Requested',
      requestedAt: new Date().toISOString()
    }
    commit('ADD_LAB_ORDER', labOrderRecord)
    return labOrderRecord
  },
  updateLabOrderLocal({ state, commit }, order) {
    const existing = state.labOrders.find(item => item.id === order.id)
    assertPatientWritable(state, order.patientId || (existing && existing.patientId))
    commit('UPDATE_LAB_ORDER', order)
  },
  orderImagingLocal({ state, commit, rootState }, order) {
    assertPatientWritable(state, order.patientId)
    const imagingOrderRecord = {
      ...order,
      id: 'IMG-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      ...tenantFields(rootState),
      status: 'Requested',
      requestedAt: new Date().toISOString()
    }
    commit('ADD_IMAGING_ORDER', imagingOrderRecord)
    return imagingOrderRecord
  },
  updateImagingOrderLocal({ state, commit }, order) {
    const existing = state.imagingOrders.find(item => item.id === order.id)
    assertPatientWritable(state, order.patientId || (existing && existing.patientId))
    commit('UPDATE_IMAGING_ORDER', order)
  },
  createInvoice({ commit, rootState }, invoice) {
    commit('ADD_INVOICE', {
      ...invoice,
      id: 'INV-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      ...tenantFields(rootState),
      status: 'Unpaid',
      createdAt: new Date().toISOString()
    })
  },
  updateInvoice({ commit }, invoice) {
    commit('UPDATE_INVOICE', invoice)
  },
  async recordVitalSigns({ state, commit, dispatch, rootState }, vitals) {
    assertPatientWritable(state, vitals.patientId)
    const local = {
      ...vitals,
      id: 'VIT-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      ...tenantFields(rootState),
      pendingSync: false
    }
    try {
      const { data } = await vitalsApi.record(vitals)
      local.id = (data.vitalSigns && data.vitalSigns.id) || local.id
    } catch (err) {
      if (isNetworkError(err)) {
        await enqueue(rootState.auth?.facilityId, 'vitals-record', vitals)
        await dispatch('offlineQueue/refreshPendingCount', null, { root: true })
        local.pendingSync = true
      } else {
        commit('SET_ERROR', err.response?.data?.error || err.message)
      }
    }
    commit('ADD_VITAL_SIGNS', local)
  },
  async addNursingNote({ state, commit, dispatch, rootState }, note) {
    assertPatientWritable(state, note.patientId)
    const now = new Date().toISOString()
    const actor = note.recordedBy || rootState.auth.fullName || 'Unknown user'
    const local = {
      ...note,
      id: 'NNT-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      ...tenantFields(rootState),
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
    }
    // Re-throw real (non-network) errors instead of swallowing them — the
    // same class of bug found in addMedicalNote: a body-less payload fails
    // backend validation, and a caller that doesn't see the error shows a
    // false "saved successfully" toast over a note that was never persisted.
    try {
      const { data } = await clinicalNotesApi.create({
        patientId: note.patientId,
        encounterId: note.encounterId,
        noteType: 'nursing',
        title: note.title,
        body: note.body || note.note || note.text || '',
        structuredData: note.structuredData || undefined
      })
      local.id = (data.note && data.note.id) || local.id
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      if (isNetworkError(err)) {
        await enqueue(rootState.auth?.facilityId, 'nursing-note-create', {
          patientId: note.patientId,
          encounterId: note.encounterId,
          noteType: 'nursing',
          title: note.title,
          body: note.body || note.note || note.text || '',
          structuredData: note.structuredData || undefined
        })
        await dispatch('offlineQueue/refreshPendingCount', null, { root: true })
      } else {
        throw err
      }
    }
    commit('ADD_NURSING_NOTE', local)
  },
  async addMedicalNote({ state, commit, dispatch, rootState }, note) {
    assertPatientWritable(state, note.patientId)
    const now = new Date().toISOString()
    const actor = note.recordedBy || rootState.auth.fullName || 'Unknown user'
    const local = {
      ...note,
      id: 'MNT-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      ...tenantFields(rootState),
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
    }
    // Unlike vitals/RMA (routine, high-frequency, safe to retry silently via
    // the offline queue), a rejected medical note is a real problem the
    // caller must know about immediately — re-throwing on anything other
    // than a network blip prevents a "saved successfully" toast over a note
    // that was actually never persisted (the bug that caused every medical
    // consultation to silently vanish before body/structuredData existed).
    try {
      const { data } = await clinicalNotesApi.create({
        patientId: note.patientId,
        encounterId: note.encounterId,
        noteType: 'medical',
        title: note.title,
        body: note.body || note.note || note.text || '',
        structuredData: note.structuredData || undefined
      })
      local.id = (data.note && data.note.id) || local.id
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      if (isNetworkError(err)) {
        await enqueue(rootState.auth?.facilityId, 'medical-note-create', {
          patientId: note.patientId,
          encounterId: note.encounterId,
          noteType: 'medical',
          title: note.title,
          body: note.body || note.note || note.text || '',
          structuredData: note.structuredData || undefined
        })
        await dispatch('offlineQueue/refreshPendingCount', null, { root: true })
      } else {
        throw err
      }
    }
    commit('ADD_MEDICAL_NOTE', local)
    return local
  },
  async updateNursingNote({ state, commit, rootState }, payload) {
    const existing = state.nursingNotes.find(n => n.id === payload.id)
    if (!existing) return
    assertPatientWritable(state, existing.patientId)
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
    try {
      await clinicalNotesApi.update(existing.id, { body: next.body, title: next.title })
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
    }
    commit('UPDATE_NURSING_NOTE', next)
  },
  async updateMedicalNote({ state, commit, rootState }, payload) {
    const existing = state.medicalNotes.find(n => n.id === payload.id)
    if (!existing) return
    assertPatientWritable(state, existing.patientId)
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
    try {
      await clinicalNotesApi.update(existing.id, { body: next.body, title: next.title })
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
    }
    commit('UPDATE_MEDICAL_NOTE', next)
  },
  async fetchTasks({ commit }, params = {}) {
    try {
      const { data } = await taskApi.list(params)
      if (params.patientId) {
        commit('MERGE_PATIENT_TASKS', { patientId: params.patientId, tasks: data.tasks || [] })
      } else {
        commit('SET_TASKS', data.tasks || [])
      }
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
    }
  },
  async fetchCareTeam({ commit }, patientId) {
    try {
      const { data } = await careTeamApi.list(patientId)
      commit('SET_CARE_TEAM_MEMBERS', data.members || [])
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
    }
  },
  async fetchSocialAssessments({ commit }, patientId) {
    try {
      const { data } = await careTeamApi.listSocialAssessments(patientId)
      commit('SET_SOCIAL_ASSESSMENTS', data.assessments || [])
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
    }
  },
  async createTask({ state, commit, rootState }, task) {
    assertPatientWritable(state, task.patientId)
    const existing = task.automationKey && state.tasks.find(item => item.automationKey === task.automationKey)
    if (existing) return existing
    const now = new Date().toISOString()
    const actor = rootState.auth.fullName || 'Unknown user'
    const local = {
      ...task,
      id: 'TSK-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      ...tenantFields(rootState),
      status: 'pending',
      seriesId: task.seriesId || null,
      parentTaskId: task.parentTaskId || null,
      occurrenceNumber: Number(task.occurrenceNumber || 1),
      reminderMinutesBefore: Number(task.reminderMinutesBefore ?? 30),
      reminderAcknowledgedAt: null,
      automationSource: task.automationSource || null,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
      actionReason: task.actionReason || 'Task created from clinical order'
    }
    try {
      const { data } = await taskApi.create(task)
      local.id = (data.task && data.task.id) || local.id
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('ADD_TASK', local)
    return local
  },
  createTasksFromClinicalOrder({ dispatch }, { order, patient = {}, encounter = {} }) {
    const generated = generateTasksFromOrder(order, patient, encounter)
    return Promise.all(generated.map((task, index) => dispatch('createTask', {
      patientId: task.patient_id,
      encounterId: task.encounter_id,
      relatedType: task.source_type,
      relatedId: task.source_id,
      title: task.title,
      instructions: task.description,
      assignedToRole: task.assigned_role,
      assignedToUserId: task.assigned_user_id,
      priority: task.priority,
      dueAt: task.due_at,
      frequency: task.frequency,
      reminderMinutesBefore: task.reminder_minutes_before,
      seriesId: task.series_id,
      automationSource: task.automation_source,
      automationKey: `${task.source_type}:${task.source_id}:${task.title}:${index}`,
      actionReason: `Automatically generated from clinical order ${task.source_id}`
    })))
  },
  async addCareTeamMember({ state, commit, rootState }, member) {
    assertPatientWritable(state, member.patientId)
    const local = {
      ...member,
      id: 'CTM-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      ...tenantFields(rootState),
      addedAt: new Date().toISOString(),
      addedBy: rootState.auth.fullName || rootState.auth.staffId || 'Clinical user'
    }
    try {
      const { data } = await careTeamApi.addMember(member)
      local.id = (data.member && data.member.id) || local.id
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('ADD_CARE_TEAM_MEMBER', local)
    return local
  },
  async addSocialAssessment({ state, commit, rootState }, assessment) {
    assertPatientWritable(state, assessment.patientId)
    const local = {
      ...assessment,
      id: 'SDH-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      ...tenantFields(rootState),
      assessedAt: new Date().toISOString(),
      assessedBy: rootState.auth.fullName || rootState.auth.staffId || 'Clinical user'
    }
    try {
      const { data } = await careTeamApi.addSocialAssessment(assessment)
      local.id = (data.assessment && data.assessment.id) || local.id
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('ADD_SOCIAL_ASSESSMENT', local)
    return local
  },
  async updateTaskStatus({ state, commit, rootState }, payload) {
    const task = state.tasks.find(t => t.id === payload.id)
    if (!task) return
    assertPatientWritable(state, task.patientId)
    if (!['done', 'hold', 'cancel'].includes(payload.status)) return
    const now = new Date().toISOString()
    const actor = payload.updatedBy || rootState.auth.fullName || 'Unknown user'
    const reason = payload.reason || 'Task status updated'
    const next = {
      ...task,
      status: payload.status,
      completedAt: payload.status === 'done' ? (payload.performedAt || now) : task.completedAt || null,
      completionDocumentation: payload.status === 'done' ? reason : task.completionDocumentation || '',
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
    try {
      await taskApi.updateStatus(payload.id, { status: payload.status, reason })
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
    commit('UPDATE_TASK', next)
    return next
  },
  async completeTaskAndScheduleNext({ state, commit, dispatch, rootState }, payload) {
    const task = state.tasks.find(item => item.id === payload.id)
    if (!task) throw new Error('Task not found')
    assertPatientWritable(state, task.patientId)
    if (!String(payload.reason || '').trim()) throw new Error('Completion documentation is required')
    const actor = payload.updatedBy || rootState.auth.fullName || 'Unknown user'
    const performedAt = payload.performedAt || new Date().toISOString()
    const nextTaskPayload = nextTaskFromCompletion(task, { ...payload, performedAt })
    const nextTask = await dispatch('createTask', nextTaskPayload)
    const completed = {
      ...task,
      status: 'done',
      completedAt: performedAt,
      completionDocumentation: payload.reason,
      nextTaskId: nextTask.id,
      updatedAt: performedAt,
      updatedBy: actor,
      actionReason: payload.reason,
      history: [
        ...(task.history || []),
        {
          id: 'THS-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          action: 'COMPLETED_AND_NEXT_SCHEDULED',
          status: 'done',
          actor,
          at: performedAt,
          reason: payload.reason,
          nextTaskId: nextTask.id,
          nextDueAt: nextTask.dueAt
        }
      ]
    }
    commit('UPDATE_TASK', completed)
    return { completedTask: completed, nextTask }
  },
  createDocument({ state, commit, rootState }, document) {
    assertPatientWritable(state, document.patientId)
    const record = {
      ...document,
      id: 'DOC-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      ...tenantFields(rootState),
      status: document.status || 'Filed',
      createdAt: new Date().toISOString(),
      createdBy: rootState.auth.fullName || 'Unknown user'
    }
    commit('ADD_DOCUMENT', record)
    return record
  },
  updateDocument({ state, commit }, document) {
    const existing = state.documents.find(item => item.id === document.id)
    assertPatientWritable(state, document.patientId || (existing && existing.patientId))
    commit('UPDATE_DOCUMENT', document)
  },
  createInsuranceClaim({ commit, rootState }, claim) {
    commit('ADD_INSURANCE_CLAIM', {
      ...claim,
      id: 'CLM-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      ...tenantFields(rootState),
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
      ...tenantFields(rootState),
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
      ...tenantFields(rootState),
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
      ...tenantFields(rootState),
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
      ...tenantFields(rootState),
      status: draft.status || 'Draft',
      createdAt: new Date().toISOString(),
      createdBy: rootState.auth.fullName || 'Unknown user'
    })
  },
  updateVoiceDraft({ commit }, draft) {
    commit('UPDATE_VOICE_DRAFT', draft)
  },
  // ─── API Async Actions ────────────────────────────────────────────────────────
  async fetchPatients({ state, commit }, params = {}) {
    commit('SET_LOADING', true)
    try {
      const { data } = await patientApi.list(params)
      commit('SET_PATIENTS', data.patients || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      if (!err.response) return { patients: state.patients, offline: true }
      throw err
    } finally {
      commit('SET_LOADING', false)
    }
  },
  async registerPatientApi({ commit, dispatch }, patientData) {
    commit('SET_LOADING', true)
    try {
      const { data } = await patientApi.create(patientData)
      commit('ADD_PATIENT', data.patient || data)
      await dispatch('fetchPatients')
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    } finally {
      commit('SET_LOADING', false)
    }
  },
  async updatePatientApi({ commit }, { id, ...data }) {
    try {
      const { data: updated } = await patientApi.update(id, data)
      commit('UPDATE_PATIENT', updated.patient || updated)
      return updated
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },
  async fetchVisits({ commit }) {
    try {
      const { data } = await clinicalApi.getVisits()
      commit('SET_VISITS', data.visits || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },
  async fetchLabOrders({ commit }) {
    try {
      const { data } = await clinicalApi.getLabOrders()
      commit('SET_LAB_ORDERS', data.labOrders || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },
  async fetchImagingOrders({ commit }) {
    try {
      const { data } = await clinicalApi.getImagingOrders()
      commit('SET_IMAGING_ORDERS', data.imagingOrders || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },
  async fetchMedications({ commit }) {
    try {
      const { data } = await clinicalApi.getMedications()
      commit('SET_MEDICATIONS', data.medications || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },
  async fetchAppointments({ commit }, params = {}) {
    try {
      const { data } = await appointmentApi.list(params)
      commit('SET_APPOINTMENTS', data.appointments || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },
  async fetchInpatients({ commit }, params = {}) {
    try {
      const { data } = await inpatientApi.list(params)
      commit('SET_INPATIENTS', data.inpatients || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },
  async registerPatient({ dispatch }, patientData) {
    try {
      return await dispatch('registerPatientApi', patientData)
    } catch (err) {
      if (err.response) throw err
      return dispatch('registerPatientLocal', patientData)
    }
  },
  async updatePatient({ dispatch }, payload) {
    const patientId = payload.id || payload.patientId
    const updates = payload.updates || Object.keys(payload).reduce((record, key) => {
      if (!['id', 'patientId'].includes(key)) record[key] = payload[key]
      return record
    }, {})
    try {
      return await dispatch('updatePatientApi', { id: patientId, ...updates })
    } catch (err) {
      if (err.response) throw err
      return dispatch('updatePatientLocal', { patientId, updates })
    }
  },
  async logVisit({ commit }, visitData) {
    try {
      const { data } = await clinicalApi.createVisit(visitData)
      commit('ADD_VISIT', data.visit || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },
  async orderLab({ commit }, orderData) {
    try {
      const { data } = await clinicalApi.createLabOrder(orderData)
      commit('ADD_LAB_ORDER', data.labOrder || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },
  async updateLabOrder({ commit }, { id, ...data }) {
    try {
      const { data: updated } = await clinicalApi.updateLabOrder(id, data)
      commit('UPDATE_LAB_ORDER', updated.labOrder || updated)
      return updated
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },
  async orderImaging({ commit }, orderData) {
    try {
      const { data } = await clinicalApi.createImagingOrder(orderData)
      commit('ADD_IMAGING_ORDER', data.imagingOrder || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },
  async updateImagingOrder({ commit }, { id, ...data }) {
    try {
      const { data: updated } = await clinicalApi.updateImagingOrder(id, data)
      commit('UPDATE_IMAGING_ORDER', updated.imagingOrder || updated)
      return updated
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },
  async uploadImagingFile({ commit }, { id, data }) {
    try {
      const { data: updated } = await clinicalApi.uploadImagingFile(id, data)
      commit('UPDATE_IMAGING_ORDER', updated.imagingOrder || updated)
      return updated
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },
  async prescribeMedication({ commit }, medData) {
    try {
      const { data } = await clinicalApi.createMedication(medData)
      commit('ADD_MEDICATION', data.medication || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },
  async updateMedication({ commit }, { id, ...data }) {
    try {
      const { data: updated } = await clinicalApi.updateMedication(id, data)
      commit('UPDATE_MEDICATION', updated.medication || updated)
      return updated
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },
  // ─── eMAR ───────────────────────────────────────────────────────────────
  async fetchMedicationAdministrations({ commit }, params) {
    try {
      const { data } = await clinicalApi.getMedicationAdministrations(params)
      commit('SET_MEDICATION_ADMINISTRATIONS', data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },
  async administerMedication({ commit }, { id, ...data }) {
    try {
      const { data: result } = await clinicalApi.administerMedication(id, data)
      commit('UPSERT_MEDICATION_ADMINISTRATION', result.administration)
      if (result.nextDue) commit('UPSERT_MEDICATION_ADMINISTRATION', result.nextDue)
      return result
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },
  async scheduleAppointment({ commit }, apptData) {
    try {
      const { data } = await appointmentApi.create(apptData)
      commit('ADD_APPOINTMENT', data.appointment || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },
  async updateAppointment({ commit }, { id, ...data }) {
    try {
      const { data: updated } = await appointmentApi.update(id, data)
      commit('UPDATE_APPOINTMENT', updated.appointment || updated)
      return updated
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },
  async admitPatient({ commit }, admitData) {
    try {
      const { data } = await inpatientApi.admit(admitData)
      commit('ADD_INPATIENT', data.inpatient || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },
  async updateInpatient({ commit }, { id, ...data }) {
    try {
      const { data: updated } = await inpatientApi.update(id, data)
      commit('UPDATE_INPATIENT', updated.inpatient || updated)
      return updated
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },
  async transferPatient({ state, dispatch, rootState }, { patientId, targetDepartment, reason }) {
    const admission = state.inpatients.find(item =>
      item.patientId === patientId &&
      belongsToAuthenticatedFacility(item, rootState) &&
      String(item.status || '').toLowerCase() !== 'discharged'
    )
    if (!admission) throw new Error('Active inpatient admission not found')

    const previousDepartment = admission.ward || 'Unspecified unit'
    const transferredAt = new Date().toISOString()
    const updated = await dispatch('updateInpatient', {
      id: admission.id,
      ward: targetDepartment,
      status: 'Admitted'
    })
    await dispatch('updatePatient', {
      patientId,
      updates: { departmentRouting: targetDepartment, currentDepartment: targetDepartment }
    })
    const document = await dispatch('createDocument', {
      patientId,
      title: `Transfer - ${previousDepartment} to ${targetDepartment}`,
      category: 'Transfer',
      status: 'Filed',
      content: [
        `Transferred: ${transferredAt}`,
        `From: ${previousDepartment}`,
        `To: ${targetDepartment}`,
        `Reason: ${reason || 'Clinical transfer'}`,
        `Prepared by: ${rootState.auth.fullName || rootState.auth.staffId || 'Clinical user'}`
      ].join('\n')
    })
    return { inpatient: updated.inpatient || updated, document }
  },
  async provisionPatientWorkflowDemo({ dispatch, state }) {
    await dispatch('fetchPatients')
    const first = state.patients[0]
    if (first) return first.id
    return dispatch('provisionPatientWorkflowDemoLocal')
  }
}

export const getters = {
  patientDirectoryAll: (state, getters, rootState) => state.patients.filter(p => belongsToAuthenticatedFacility(p, rootState)),
  patientById: (state, getters, rootState) => id => state.patients.find(p =>
    p.id === id && belongsToAuthenticatedFacility(p, rootState)
  ),
  getPatient: (state, getters) => id => getters.patientById(id) || null,
  patientsByDepartment: (state, getters) => dept =>
    getters.patientDirectoryAll.filter(p => p.currentDepartment === dept || p.departmentRouting === dept),
  loading: state => state.loading,
  error: state => state.error,

  // FILTERED DATA
  getPatients: (state, getters) => getters.patientDirectoryAll,

  getVisits: (state, getters, rootState) => state.visits.filter(item => belongsToAuthenticatedFacility(item, rootState)),
  getFieldReports: (state, getters, rootState) => state.fieldReports.filter(item => belongsToAuthenticatedFacility(item, rootState)),
  getInpatients: (state, getters, rootState) => state.inpatients.filter(item => belongsToAuthenticatedFacility(item, rootState)),
  getAppointments: (state, getters, rootState) => state.appointments.filter(item => belongsToAuthenticatedFacility(item, rootState)),
  getMedications: (state, getters, rootState) => state.medications.filter(item => belongsToAuthenticatedFacility(item, rootState)),
  getLabOrders: (state, getters, rootState) => state.labOrders.filter(item => belongsToAuthenticatedFacility(item, rootState)),
  getImagingOrders: (state, getters, rootState) => state.imagingOrders.filter(item => belongsToAuthenticatedFacility(item, rootState)),
  getInvoices: (state, getters, rootState) => state.invoices.filter(item => belongsToAuthenticatedFacility(item, rootState)),
  getVitalSigns: (state, getters, rootState) => state.vitalSigns.filter(item => belongsToAuthenticatedFacility(item, rootState)),
  getNursingNotes: (state, getters, rootState) => state.nursingNotes.filter(item => belongsToAuthenticatedFacility(item, rootState)),
  getMedicalNotes: (state, getters, rootState) => state.medicalNotes.filter(item => belongsToAuthenticatedFacility(item, rootState)),
  getTasks: (state, getters, rootState) => state.tasks.filter(item => belongsToAuthenticatedFacility(item, rootState)),
  patientCareTeam: (state, getters, rootState) => patientId => state.careTeamMembers.filter(item =>
    item.patientId === patientId && belongsToAuthenticatedFacility(item, rootState)
  ),
  patientSocialAssessments: (state, getters, rootState) => patientId => state.socialAssessments.filter(item =>
    item.patientId === patientId && belongsToAuthenticatedFacility(item, rootState)
  ),
  getDocuments: (state, getters, rootState) => state.documents.filter(item => belongsToAuthenticatedFacility(item, rootState)),
  getInsuranceClaims: (state, getters, rootState) => state.insuranceClaims.filter(item => belongsToAuthenticatedFacility(item, rootState)),
  getReferrals: (state, getters, rootState) => state.referrals.filter(item => belongsToAuthenticatedFacility(item, rootState)),
  getMedicalTemplates: (state, getters, rootState) => {
    const templates = state.medicalTemplates && state.medicalTemplates.length ? state.medicalTemplates : defaultMedicalTemplates()
    return templates.filter(item =>
      (!item.facilityId && !item.institution) || belongsToAuthenticatedFacility(item, rootState)
    )
  },
  getPortalMessages: (state, getters, rootState) => state.portalMessages.filter(item => belongsToAuthenticatedFacility(item, rootState)),
  getVoiceDrafts: (state, getters, rootState) => state.voiceDrafts.filter(item => belongsToAuthenticatedFacility(item, rootState)),
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
      const isDischarged = String(patient.patientStatus || patient.admissionStatus || '').toLowerCase() === 'discharged' || String(patient.recordStatus || '').toLowerCase() === 'inactive'
      const activeInpatient = inpatients.find(item => item.patientId === patient.id && String(item.status || '').toLowerCase() !== 'discharged')
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
        mrn: patient.mrn || patient.externalId || patient.id,
        externalId: patient.externalId || patient.mrn || patient.id,
        barcode: patient.barcode || '',
        currentDepartment: isDischarged ? 'Inactive / Discharged' : resolveCurrentDepartment({ patient, activeInpatient, openOrders, latestVisit, nextAppointment }),
        lifecycleStatus: isDischarged ? 'inactive' : ((!latestVisit && !activeInpatient) || patient.pendingAdmission || ['waiting', 'waitlisted', 'registered', 'pending'].includes(String(patient.patientStatus || '').toLowerCase()) ? 'waiting' : 'active'),
        isDischarged,
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
  isPatientDischarged: state => patientId => {
    const patient = state.patients.find(item => item.id === patientId)
    if (!patient) return false
    return String(patient.patientStatus || patient.admissionStatus || '').toLowerCase() === 'discharged' || String(patient.recordStatus || '').toLowerCase() === 'inactive'
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
        patients: directory.filter(patient => patient.lifecycleStatus !== 'inactive' && !patient.latestVisit && !patient.activeInpatient),
        nextAction: 'Complete intake and confirm demographics'
      },
      {
        key: 'triage',
        title: 'Nursing / Triage',
        icon: 'mdi-stethoscope',
        color: '#00A99D',
        patients: directory.filter(patient => patient.lifecycleStatus !== 'inactive' && (patient.riskLevel !== 'low' || !patient.latestVitals)),
        nextAction: 'Capture vitals, allergies, acuity and nursing note'
      },
      {
        key: 'provider',
        title: 'Provider Review',
        icon: 'mdi-medical-bag',
        color: '#0B3D2E',
        patients: directory.filter(patient => patient.lifecycleStatus !== 'inactive' && patient.latestVitals && (!patient.latestVisit || patient.openTasks.length > 0)),
        nextAction: 'Review chart, diagnose, place orders and plan care'
      },
      {
        key: 'diagnostics',
        title: 'Diagnostics',
        icon: 'mdi-flask-outline',
        color: '#D97706',
        patients: directory.filter(patient => patient.lifecycleStatus !== 'inactive' && patient.openOrders.length > 0),
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
      patients: directory.filter(patient => patient.lifecycleStatus !== 'inactive' && patient.nextAppointment && isToday(patient.nextAppointment.date)),
      total: appointments.filter(item => item.status === 'Scheduled' && isToday(item.date)).length,
      highRisk: 0,
      nextAction: 'Confirm arrivals and route to intake'
    }, {
      key: 'task-worklist',
      title: 'Care Team Tasks',
      icon: 'mdi-format-list-checks',
      color: '#6D28D9',
      patients: directory.filter(patient => patient.lifecycleStatus !== 'inactive' && patient.openTasks.length > 0),
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
      activePatients: directory.filter(patient => patient.lifecycleStatus === 'active').length,
      highRiskPatients: directory.filter(patient => patient.lifecycleStatus !== 'inactive' && patient.riskLevel === 'high').length,
      pendingDiagnostics: labOrders.filter(item => item.status !== 'Completed').length + imagingOrders.filter(item => item.status !== 'Completed').length,
      openTasks: tasks.filter(item => item.status === 'pending' || item.status === 'hold').length,
      admittedPatients: inpatients.filter(item => item.status !== 'Discharged').length,
      pendingClaims: claims.filter(item => !['Paid', 'Denied', 'Closed'].includes(item.status)).length,
      openReferrals: referrals.filter(item => item.status !== 'Closed').length,
      unreadPortalMessages: portalMessages.filter(item => item.status === 'Unread').length,
      filedDocuments: documents.length,
      busiestQueue: queues.reduce((current, queue) => (queue.total > (current.total || 0) ? queue : current), {})
    }
  }
}

function saveToLocalStorage(key, data) {
  if (!process.client) return
  const facilityId = sessionStorage.getItem('camero_facility_id')
  if (!facilityId) return
  const scopedData = key === 'medicalTemplates' || !Array.isArray(data)
    ? data
    : data.filter(item => item && item.facilityId === facilityId)
  localStorage.setItem(`camero_health_${facilityId}_${key}`, JSON.stringify(scopedData))
}

function loadFromLocalStorage(key) {
  if (!process.client) return null
  const facilityId = sessionStorage.getItem('camero_facility_id')
  const legacyKey = 'camero_health_' + key
  localStorage.removeItem(legacyKey)
  if (!facilityId) return null
  const data = localStorage.getItem(`camero_health_${facilityId}_${key}`)
  if (!data) return null
  try {
    const parsed = JSON.parse(data)
    if (key === 'medicalTemplates' || !Array.isArray(parsed)) return parsed
    return parsed.filter(item => item && item.facilityId === facilityId)
  } catch {
    localStorage.removeItem(`camero_health_${facilityId}_${key}`)
    return null
  }
}

function getChangedFields(previous, updates) {
  return Object.keys(updates).filter((key) => {
    const prev = JSON.stringify(previous[key])
    const next = JSON.stringify(updates[key])
    return prev !== next
  })
}

function assertPatientWritable(state, patientId) {
  if (!patientId) return
  const patient = state.patients.find(item => item.id === patientId)
  if (!patient) return
  assertWritableRecord(patient)
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
