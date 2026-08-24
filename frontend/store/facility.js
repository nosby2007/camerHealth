/**
 * facility.js — CameroHealth Facility & Staff Store
 * Now powered by Express backend API.
 */

import { staffApi, facilityApi, authApi, departmentApi, auditApi } from '~/services/api'
import { generateStaffId, generateStaffEmail, getFacilityDomain } from '~/util/identity'

// ─── Roles (kept for frontend reference) ─────────────────────────────────────
export const ROLES = {
  ADMIN:    'ADMIN',
  DOCTOR:   'DOCTOR',
  NP:       'NP',
  NURSE:    'NURSE',
  CNA:      'CNA',
  MAJOR_SERVICE: 'MAJOR_SERVICE',
  NURSING_SUPERVISOR: 'NURSING_SUPERVISOR',
  MIDWIFE:  'MIDWIFE',
  LAB:      'LAB',
  IMAGING:  'IMAGING',
  PHYSIOTHERAPIST: 'PHYSIOTHERAPIST',
  PHARMACY: 'PHARMACY',
  BILLING:  'BILLING',
  RECORDS:  'RECORDS',
  FRONT_DESK: 'FRONT_DESK',
  SOCIAL_WORKER: 'SOCIAL_WORKER',
  BIOMEDICAL: 'BIOMEDICAL'
}

export const ROLE_LABELS = {
  ADMIN:   'Administrator',
  DOCTOR:  'Doctor / Clinician',
  NP:      'Nurse Practitioner',
  NURSE:   'Nurse',
  CNA:     'Care Assistant / Nursing Aide',
  MAJOR_SERVICE: 'Major de service / Head Nurse',
  NURSING_SUPERVISOR: 'Surveillant general / Nursing Supervisor',
  MIDWIFE: 'Sage-femme / Midwife',
  LAB:     'Laboratory Technician',
  IMAGING: 'Imaging / Radiology',
  PHYSIOTHERAPIST: 'Kinesitherapist / Physiotherapist',
  PHARMACY: 'Pharmacy Staff',
  BILLING: 'Billing / Claims Staff',
  RECORDS: 'Medical Records Officer',
  FRONT_DESK: 'Admissions / Front Desk',
  SOCIAL_WORKER: 'Social Worker',
}

export const DEFAULT_DEPARTMENTS = [
  {
    id: 'dept-1',
    code: 'EMERGENCY',
    name: 'Urgences',
    headOfDepartment: 'Dr. Mbarga Alain',
    wards: [
      { id: 'ward-101', name: 'Tri / Resuscitation Room', beds: 6, status: 'Active' },
      { id: 'ward-102', name: 'Salle d\'Observation Hommes', beds: 10, status: 'Active' },
      { id: 'ward-103', name: 'Salle d\'Observation Femmes', beds: 10, status: 'Active' }
    ]
  },
  {
    id: 'dept-2',
    code: 'MEDICINE',
    name: 'Médecine Interne',
    headOfDepartment: 'Dr. Fotso Beatrice',
    wards: [
      { id: 'ward-201', name: 'Unité de Cardiologie', beds: 12, status: 'Active' },
      { id: 'ward-202', name: 'Unité d\'Endocrinologie & Diabète', beds: 10, status: 'Active' },
      { id: 'ward-203', name: 'Hospitalisation Médecine Hommes', beds: 16, status: 'Active' },
      { id: 'ward-204', name: 'Hospitalisation Médecine Femmes', beds: 16, status: 'Active' }
    ]
  },
  {
    id: 'dept-3',
    code: 'SURGERY',
    name: 'Chirurgie',
    headOfDepartment: 'Dr. Essomba Guy',
    wards: [
      { id: 'ward-301', name: 'Chirurgie Générale & Viscérale', beds: 15, status: 'Active' },
      { id: 'ward-302', name: 'Traumatologie & Orthopédie', beds: 12, status: 'Active' },
      { id: 'ward-303', name: 'Bloc Opératoire Central', beds: 4, status: 'Active' },
      { id: 'ward-304', name: 'Salle de Réveil (PACU)', beds: 6, status: 'Active' }
    ]
  },
  {
    id: 'dept-4',
    code: 'PEDIATRICS',
    name: 'Pédiatrie',
    headOfDepartment: 'Dr. Nkemba Rose',
    wards: [
      { id: 'ward-401', name: 'Néonatologie & Couveuses', beds: 10, status: 'Active' },
      { id: 'ward-402', name: 'Hospitalisation Pédiatrique', beds: 20, status: 'Active' },
      { id: 'ward-403', name: 'Unité de Nutrition Thérapeutique', beds: 8, status: 'Active' }
    ]
  },
  {
    id: 'dept-5',
    code: 'OBGYN',
    name: 'Gynécologie - Obstétrique',
    headOfDepartment: 'Dr. Manga Therese',
    wards: [
      { id: 'ward-501', name: 'Salle d\'Accouchement (Maternité)', beds: 8, status: 'Active' },
      { id: 'ward-502', name: 'Suites de Couches / Post-Partum', beds: 16, status: 'Active' },
      { id: 'ward-503', name: 'Grossesses à Haut Risque (GHR)', beds: 8, status: 'Active' }
    ]
  },
  {
    id: 'dept-6',
    code: 'ICU',
    name: 'Réanimation & Soins Intensifs',
    headOfDepartment: 'Dr. Talla Patrick',
    wards: [
      { id: 'ward-601', name: 'Réanimation Polyvalente', beds: 8, status: 'Active' },
      { id: 'ward-602', name: 'Soins Intensifs Cardiologiques (USIC)', beds: 6, status: 'Active' }
    ]
  },
  {
    id: 'dept-7',
    code: 'OPD',
    name: 'Consultations Externes',
    headOfDepartment: 'Dr. Abena Marie',
    wards: [
      { id: 'ward-701', name: 'Box Consultations Médecine', beds: 4, status: 'Active' },
      { id: 'ward-702', name: 'Box Consultations Chirurgie', beds: 2, status: 'Active' },
      { id: 'ward-703', name: 'Box Consultations Pédiatrie', beds: 3, status: 'Active' }
    ]
  },
  {
    id: 'dept-8',
    code: 'LAB',
    name: 'Laboratoire',
    headOfDepartment: 'Dr. Jean Atangana',
    wards: [
      { id: 'ward-801', name: 'Biochimie Clinique', beds: 0, status: 'Active' },
      { id: 'ward-802', name: 'Hématologie', beds: 0, status: 'Active' },
      { id: 'ward-803', name: 'Bactériologie / Parasitologie', beds: 0, status: 'Active' }
    ]
  },
  {
    id: 'dept-9',
    code: 'IMAGING',
    name: 'Imagerie Médicale',
    headOfDepartment: 'Dr. Paul Bekolo',
    wards: [
      { id: 'ward-901', name: 'Radiologie', beds: 0, status: 'Active' },
      { id: 'ward-902', name: 'Échographie', beds: 0, status: 'Active' },
      { id: 'ward-903', name: 'Scanner / IRM', beds: 0, status: 'Active' }
    ]
  }
]

export const state = () => ({
  facility: null,
  staff: [],
  staffRoles: [],
  departments: [],
  auditLog: [],
  loading: false,
  error: null,
  setupComplete: false,
  staffLoginHistory: []
})

export const mutations = {
  SET_FACILITY(state, facility) { state.facility = facility },
  SET_STAFF(state, staff) { state.staff = staff },
  SET_DEPARTMENTS(state, departments) { state.departments = departments },
  SET_AUDIT_LOG(state, logs) { state.auditLog = logs },
  ADD_STAFF(state, member) { state.staff.push(member) },
  UPDATE_STAFF(state, member) {
    const idx = state.staff.findIndex(s => s.id === member.id)
    if (idx !== -1) state.staff.splice(idx, 1, member)
  },
  REMOVE_STAFF(state, id) {
    state.staff = state.staff.filter(s => s.id !== id)
  },
  SET_STAFF_ROLES(state, roles) { state.staffRoles = roles },
  SET_LOADING(state, val) { state.loading = val },
  SET_ERROR(state, err) { state.error = err },
  SET_SETUP_COMPLETE(state, val) { state.setupComplete = val },
  SET_STAFF_LOGIN_HISTORY(state, history) { state.staffLoginHistory = history },
  RELOAD_FROM_STORAGE(state) {
    // Purge legacy prototype items from browser localStorage so system relies 100% on database
    if (process.client) {
      localStorage.removeItem('camero_facility')
      localStorage.removeItem('camero_staff')
      localStorage.removeItem('camero_session')
    }
  }
}

export const actions = {
  async fetchFacility({ commit }, id) {
    commit('SET_LOADING', true)
    try {
      const { data } = await facilityApi.get(id)
      commit('SET_FACILITY', data.facility || data)
      commit('SET_SETUP_COMPLETE', true)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async registerFacility({ commit, dispatch }, { facility, admin }) {
    commit('SET_LOADING', true)
    try {
      const payload = {
        facilityName: facility.name,
        facilityCode: facility.orgPrefix,
        region: facility.region,
        city: facility.city,
        quarter: facility.quarter || '',
        facilityEmail: facility.email,
        facilityPhone: facility.phone || '',
        adminFullName: admin.fullName,
        adminEmail: facility.email, // Or generated admin email
        adminPassword: admin.password
      }
      const { data } = await authApi.register(payload)
      commit('SET_FACILITY', data.facility)
      commit('SET_SETUP_COMPLETE', true)
      return {
        adminId: data.staff ? data.staff.staffCode : 'ADMIN001',
        adminEmail: data.staff ? data.staff.email : facility.email
      }
    } catch (err) {
      const message = err.message || err.response?.data?.error || 'Facility registration failed'
      commit('SET_ERROR', message)
      throw new Error(message)
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async updateFacility({ commit }, { id, ...data }) {
    commit('SET_LOADING', true)
    try {
      const { data: updated } = await facilityApi.update(id, data)
      commit('SET_FACILITY', updated.facility || updated)
      return updated
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async fetchStaff({ commit }) {
    commit('SET_LOADING', true)
    try {
      const { data } = await staffApi.list()
      commit('SET_STAFF', data.staff || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async createStaff({ commit }, staffData) {
    commit('SET_LOADING', true)
    try {
      const { data } = await staffApi.create(staffData)
      commit('ADD_STAFF', data.staffProfile || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async createStaffAccount({ commit, state }, formData) {
    commit('SET_LOADING', true)
    try {
      const facility = state.facility || {}
      const orgPrefix = facility.orgPrefix || facility.code || 'HGOPY'
      const existingIds = (state.staff || []).map(s => s.staffCode || s.id)
      const staffCode = generateStaffId(orgPrefix, formData.role, existingIds)
      const domain = facility.facilityDomain || getFacilityDomain(facility.email, orgPrefix)
      const email = generateStaffEmail(staffCode, domain)

      const payload = {
        staffCode,
        fullName: formData.fullName,
        email,
        password: formData.password,
        role: formData.role,
        ...(formData.department ? { department: formData.department } : {}),
        ...(formData.service ? { service: formData.service } : {}),
        ...(formData.specialty ? { specialty: formData.specialty } : {}),
        position: formData.position || undefined,
        ...(formData.phiScope ? { phiScope: formData.phiScope } : {})
      }

      const { data } = await staffApi.create(payload)
      commit('ADD_STAFF', data.staffProfile || data.staff || data)
      return {
        staffId: staffCode,
        staffEmail: email,
        ...data
      }
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async deactivateStaffAccount({ dispatch }, id) {
    return await dispatch('deactivateStaff', id)
  },

  async resetStaffPassword({ commit }, { staffId, newPassword }) {
    try {
      const { data } = await staffApi.update(staffId, { password: newPassword })
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },

  async updateStaff({ commit }, { id, ...data }) {
    try {
      const { data: updated } = await staffApi.update(id, data)
      commit('UPDATE_STAFF', updated.staffProfile || updated)
      return updated
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },

  async deactivateStaff({ commit }, id) {
    try {
      const { data } = await staffApi.update(id, { status: 'inactive' })
      commit('UPDATE_STAFF', data.staffProfile || data)
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
      throw err
    }
  },

  async fetchDepartments({ commit }) {
    try {
      const { data } = await departmentApi.list()
      commit('SET_DEPARTMENTS', data.departments || [])
      return data.departments
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
    }
  },

  async fetchAuditLog({ commit }, params = {}) {
    try {
      const { data } = await auditApi.list(params)
      commit('SET_AUDIT_LOG', data.logs || [])
      return data
    } catch (err) {
      commit('SET_ERROR', err.response?.data?.error || err.message)
    }
  },

  async createDepartment({ dispatch }, payload) {
    try {
      const { data } = await departmentApi.create(payload)
      await dispatch('fetchDepartments')
      return data.department
    } catch (err) {
      throw err
    }
  },

  async updateDepartment({ dispatch }, { id, ...payload }) {
    try {
      const { data } = await departmentApi.update(id, payload)
      await dispatch('fetchDepartments')
      return data.department
    } catch (err) {
      throw err
    }
  },

  async deleteDepartment({ dispatch }, id) {
    try {
      await departmentApi.remove(id)
      await dispatch('fetchDepartments')
    } catch (err) {
      throw err
    }
  }
}

export const getters = {
  getFacility: (state) => state.facility || {},
  getAllStaff:  (state) => state.staff || [],
  getAuditLog: (state) => state.auditLog.length ? state.auditLog : (state.staffLoginHistory || []),
  getClinicalDepartments: (state, getters) => getters.getHospitalModel.departments,
  getSpecialties: (state, getters) => {
    const depts = getters.getDepartments || []
    const set = new Set()
    depts.forEach(d => {
      (d.specialties || []).forEach(s => set.add(s))
    })
    return Array.from(set)
  },
  getHospitalModel: (state) => {
    const deptSpecialtiesMap = {
      EMERGENCY:  ['Emergency Medicine', 'Trauma Care', 'Triage', 'Resuscitation'],
      MEDICINE:   ['Internal Medicine', 'Cardiology', 'Endocrinology & Diabetes', 'Gastroenterology'],
      SURGERY:    ['General Surgery', 'Visceral Surgery', 'Orthopedics & Traumatology', 'Anesthesia'],
      PEDIATRICS: ['General Pediatrics', 'Neonatology', 'Pediatric Nutrition', 'Vaccination'],
      OBGYN:      ['Obstetrics', 'Gynecology', 'Maternal-Fetal Medicine', 'Postpartum Care'],
      ICU:        ['Intensive Care', 'Cardiovascular ICU', 'Mechanical Ventilation'],
      OPD:        ['General Outpatient', 'Specialist Consultations', 'Preventive Care'],
      LAB:        ['Clinical Biochemistry', 'Hematology', 'Bacteriology', 'Parasitology'],
      IMAGING:    ['Diagnostic Radiology', 'Ultrasound Imaging', 'CT & MRI Scanning'],
      PHARMACY:   ['Clinical Pharmacy', 'Hospital Dispensing', 'Pharmacovigilance']
    }

    if (state.departments && state.departments.length > 0) {
      return {
        departments: state.departments.map(d => {
          const wards = (d.wards || []).map(w => ({
            id:     w.id,
            name:   w.name,
            beds:   w.beds,
            status: w.status,
            queueKey: 'inpatient'
          }))
          const specialties = d.specialties && d.specialties.length > 0 
            ? d.specialties 
            : (deptSpecialtiesMap[d.code] || [d.name])

          return {
            id:               d.id,
            code:             d.code,
            name:             d.name,
            location:         d.location || 'Main Complex',
            type:             ['LAB', 'IMAGING'].includes(d.code) ? 'diagnostic' : ['PHARMACY'].includes(d.code) ? 'support' : 'clinical',
            headOfDepartment: d.headOfDepartment,
            leadRole:         d.headOfDepartment || 'Department Head',
            status:           d.status,
            wards:            wards,
            services:         wards,
            specialties:      specialties
          }
        })
      }
    }

    // Default fallback mapping
    return {
      departments: DEFAULT_DEPARTMENTS.map(d => ({
        ...d,
        location: 'Main Complex',
        type: ['LAB', 'IMAGING'].includes(d.code) ? 'diagnostic' : ['PHARMACY'].includes(d.code) ? 'support' : 'clinical',
        leadRole: d.headOfDepartment || 'Department Head',
        services: (d.wards || []).map(w => ({ ...w, queueKey: 'inpatient' })),
        specialties: deptSpecialtiesMap[d.code] || [d.name]
      }))
    }
  },
  getDepartments: (state, getters) => getters.getHospitalModel.departments,
  hospitalDepartments: (state, getters) => getters.getHospitalModel.departments,
  getWorkflowCatalog: () => [
    { id: 'w1', name: 'Emergency Triage & Admission', stages: ['Triage', 'Emergency Consult', 'Observation Ward / ICU'] },
    { id: 'w2', name: 'Outpatient Consultation & Pharmacy', stages: ['Registration', 'OPD Consult', 'Lab / Imaging', 'Pharmacy'] },
    { id: 'w3', name: 'Inpatient Surgical Care', stages: ['Admission', 'Pre-op Ward', 'Operating Theater', 'PACU', 'Inpatient Ward'] },
    { id: 'w4', name: 'Maternal & Neonatal Care', stages: ['Antenatal Care', 'Delivery Room', 'Postpartum Ward', 'Neonatology'] }
  ],
  getPhiPolicies: () => ({
    consentRequired: true,
    auditEnabled: true,
    dataRetentionYears: 10
  })
}
