import { makeId, withBase } from '~/util/nursing-workflow.cjs'

const scoped = (arr, rootState, rootGetters) => {
  if (!arr) return []
  const facility = rootState.auth?.facilityId
  const institution = rootState.auth?.institution
  return arr.filter(item => {
    if (facility && item.facilityId && item.facilityId !== facility) return false
    if (institution && item.institution && item.institution !== institution) return false
    return true
  })
}

const FLOWSHEET_TEMPLATES = [
  { id: 'skin-wound', label: 'Skin/Wound Assess/Care', category: 'assessment', bodySystem: 'SKIN' },
  { id: 'vital-signs', label: 'Vital Signs', category: 'vitals', bodySystem: 'GENERAL' },
  { id: 'pain', label: 'Pain Assessment', category: 'assessment', bodySystem: 'GENERAL' },
  { id: 'mobility', label: 'Mobility', category: 'assessment', bodySystem: 'MUSCULOSKELETAL' },
  { id: 'safety', label: 'Rounds/Safety/Alarms', category: 'safety', bodySystem: 'OTHER' },
  { id: 'comfort', label: 'Comfort & Hygiene', category: 'assessment', bodySystem: 'OTHER' },
  { id: 'ventilation', label: 'Mechanical Ventilation', category: 'specialty', bodySystem: 'CHEST' },
  { id: 'sepsis', label: 'NSG Sepsis Screen', category: 'assessment', bodySystem: 'OTHER' },
  { id: 'mobility-quality', label: 'NSG Mobility Quality', category: 'assessment', bodySystem: 'MUSCULOSKELETAL' },
  { id: 'assessment', label: 'Assessment', category: 'assessment', bodySystem: 'GENERAL' }
]

const FLOWSHEET_SECTIONS = {
  'vital-signs': [
    { id: 'vs-1', label: 'Vital Signs', bodySystem: 'GENERAL', collapsedByDefault: false, smartCollapseEligible: false }
  ],
  'pain': [
    { id: 'pain-1', label: 'Pain Assessment', bodySystem: 'GENERAL', collapsedByDefault: false, smartCollapseEligible: true }
  ],
  'skin-wound': [
    { id: 'skin-1', label: 'Skin Assessment', bodySystem: 'SKIN', collapsedByDefault: false, smartCollapseEligible: true },
    { id: 'wound-1', label: 'Wound Care', bodySystem: 'SKIN', collapsedByDefault: false, smartCollapseEligible: true }
  ],
  'assessment': [
    { id: 'neuro-1', label: 'Neurological', bodySystem: 'HEAD', collapsedByDefault: false, smartCollapseEligible: true },
    { id: 'resp-1', label: 'Respiratory', bodySystem: 'CHEST', collapsedByDefault: false, smartCollapseEligible: true },
    { id: 'cardio-1', label: 'Cardiovascular', bodySystem: 'CHEST', collapsedByDefault: false, smartCollapseEligible: true }
  ]
}

const FLOWSHEET_ROWS = {
  'vital-signs': [
    { id: 'temp', label: 'Temperature', sectionId: 'vs-1', rowType: 'numeric', unit: '°C', required: true, canGraph: true, calculation: null },
    { id: 'hr', label: 'Heart Rate', sectionId: 'vs-1', rowType: 'numeric', unit: 'bpm', required: true, canGraph: true, calculation: null },
    { id: 'rr', label: 'Respiratory Rate', sectionId: 'vs-1', rowType: 'numeric', unit: 'breaths/min', required: true, canGraph: true, calculation: null },
    { id: 'sbp', label: 'Systolic BP', sectionId: 'vs-1', rowType: 'numeric', unit: 'mmHg', required: true, canGraph: true, calculation: null },
    { id: 'dbp', label: 'Diastolic BP', sectionId: 'vs-1', rowType: 'numeric', unit: 'mmHg', required: true, canGraph: true, calculation: null },
    { id: 'spo2', label: 'SpO2', sectionId: 'vs-1', rowType: 'numeric', unit: '%', required: true, canGraph: true, calculation: null },
    { id: 'glucose', label: 'Blood Glucose', sectionId: 'vs-1', rowType: 'numeric', unit: 'mg/dL', required: false, canGraph: true, calculation: null }
  ],
  'pain': [
    { id: 'pain-score', label: 'Pain Score (0-10)', sectionId: 'pain-1', rowType: 'numeric', unit: null, required: true, canGraph: true, calculation: null },
    { id: 'pain-location', label: 'Location', sectionId: 'pain-1', rowType: 'text', unit: null, required: false, canGraph: false, calculation: null },
    { id: 'pain-type', label: 'Type', sectionId: 'pain-1', rowType: 'select', unit: null, required: false, canGraph: false, calculation: null }
  ],
  'skin-wound': [
    { id: 'skin-intact', label: 'Skin Intact', sectionId: 'skin-1', rowType: 'select', unit: null, required: true, canGraph: false, calculation: null },
    { id: 'wound-count', label: 'Number of Wounds', sectionId: 'wound-1', rowType: 'numeric', unit: null, required: false, canGraph: false, calculation: null },
    { id: 'dressing-change', label: 'Dressing Changed', sectionId: 'wound-1', rowType: 'select', unit: null, required: false, canGraph: false, calculation: null }
  ],
  'assessment': [
    { id: 'gcs-eye', label: 'GCS - Eye Opening', sectionId: 'neuro-1', rowType: 'numeric', unit: null, required: false, canGraph: false, calculation: null },
    { id: 'gcs-verbal', label: 'GCS - Verbal Response', sectionId: 'neuro-1', rowType: 'numeric', unit: null, required: false, canGraph: false, calculation: null },
    { id: 'gcs-motor', label: 'GCS - Motor Response', sectionId: 'neuro-1', rowType: 'numeric', unit: null, required: false, canGraph: false, calculation: null },
    { id: 'gcs-total', label: 'GCS Total', sectionId: 'neuro-1', rowType: 'calculated', unit: null, required: false, canGraph: false, calculation: 'gcs-total' },
    { id: 'breath-sounds', label: 'Breath Sounds', sectionId: 'resp-1', rowType: 'text', unit: null, required: false, canGraph: false, calculation: null },
    { id: 'heart-sounds', label: 'Heart Sounds', sectionId: 'cardio-1', rowType: 'text', unit: null, required: false, canGraph: false, calculation: null }
  ]
}

export const state = () => ({
  flowsheetTemplates: FLOWSHEET_TEMPLATES,
  flowsheetSections: FLOWSHEET_SECTIONS,
  flowsheetRows: FLOWSHEET_ROWS,
  cells: [],
  columns: [],
  corrections: [],
  auditLogs: [],
  selectedTemplateId: 'vital-signs',
  selectedRowId: null,
  selectedColumnId: null,
  hideCompleted: false,
  smartCollapse: false,
  showLastFiled: true
})

export const mutations = {
  SET_SELECTED_TEMPLATE(state, id) {
    state.selectedTemplateId = id
  },
  SET_SELECTED_ROW(state, id) {
    state.selectedRowId = id
  },
  SET_SELECTED_COLUMN(state, id) {
    state.selectedColumnId = id
  },
  SET_HIDE_COMPLETED(state, val) {
    state.hideCompleted = val
  },
  SET_SMART_COLLAPSE(state, val) {
    state.smartCollapse = val
  },
  SET_SHOW_LAST_FILED(state, val) {
    state.showLastFiled = val
  },
  ADD_COLUMN(state, column) {
    state.columns.push(column)
  },
  ADD_CELL(state, cell) {
    state.cells.push(cell)
  },
  UPDATE_CELL(state, cell) {
    const idx = state.cells.findIndex(c => c.id === cell.id)
    if (idx >= 0) state.cells.splice(idx, 1, cell)
  },
  ADD_CORRECTION(state, correction) {
    state.corrections.push(correction)
  },
  ADD_AUDIT(state, log) {
    state.auditLogs.push(log)
  }
}

export const actions = {
  createColumn({ commit, dispatch, rootState }, { patientId, encounterId, admissionId, documentedAt, source }) {
    const column = withBase(rootState, {
      patientId,
      encounterId,
      admissionId,
      documentedAt: documentedAt || new Date().toISOString(),
      label: new Date(documentedAt || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      status: 'draft',
      createdBy: rootState.auth?.fullName || rootState.auth?.staffId,
      responsibleUserId: rootState.auth?.staffId,
      source: source || 'manual'
    }, 'FLC')
    commit('ADD_COLUMN', column)
    dispatch('audit', { action: 'FLOWSHEET_COLUMN_CREATED', targetId: column.id, patientId })
    return column
  },

  updateCell({ commit, dispatch, rootState }, { cellId, value, displayValue, rowId, columnId, patientId, encounterId }) {
    const cell = withBase(rootState, {
      id: cellId,
      rowId,
      columnId,
      patientId,
      encounterId,
      value,
      displayValue: displayValue || value,
      status: 'draft',
      documentedAt: new Date().toISOString(),
      documentedBy: rootState.auth?.fullName || rootState.auth?.staffId,
      source: 'manual'
    }, 'FLC')
    commit('UPDATE_CELL', cell)
    dispatch('audit', { action: 'FLOWSHEET_CELL_UPDATED', targetId: cellId, patientId, details: { rowId, value } })
    return cell
  },

  fileColumn({ state, commit, dispatch, rootState }, { columnId, patientId, encounterId }) {
    const column = state.columns.find(c => c.id === columnId)
    if (column) {
      const filed = { ...column, status: 'filed', filedAt: new Date().toISOString(), filedBy: rootState.auth?.fullName || rootState.auth?.staffId }
      commit('ADD_COLUMN', filed)
      dispatch('audit', { action: 'FLOWSHEET_COLUMN_FILED', targetId: columnId, patientId })
      return filed
    }
  },

  correctCell({ state, commit, dispatch, rootState }, { originalCellId, rowId, columnId, patientId, encounterId, newValue, reason }) {
    const correctedCell = withBase(rootState, {
      rowId,
      columnId,
      patientId,
      encounterId,
      value: newValue,
      displayValue: newValue,
      status: 'filed',
      documentedAt: new Date().toISOString(),
      documentedBy: rootState.auth?.fullName || rootState.auth?.staffId,
      source: 'correction',
      correctedFromCellId: originalCellId
    }, 'FLC')

    const correction = withBase(rootState, {
      originalCellId,
      correctedCellId: correctedCell.id,
      patientId,
      encounterId,
      oldValue: state.cells.find(c => c.id === originalCellId)?.value,
      newValue,
      reason,
      correctedBy: rootState.auth?.fullName || rootState.auth?.staffId,
      correctedAt: new Date().toISOString()
    }, 'COR')

    commit('ADD_CELL', correctedCell)
    commit('ADD_CORRECTION', correction)
    dispatch('audit', { action: 'FLOWSHEET_CORRECTION_CREATED', targetId: correction.id, patientId, details: { oldValue: correction.oldValue, newValue, reason } })
    return { correctedCell, correction }
  },

  audit({ commit, rootState }, event) {
    commit('ADD_AUDIT', {
      id: makeId('AUD'),
      facilityId: rootState.auth?.facilityId || '',
      actor: rootState.auth?.fullName || rootState.auth?.staffId || 'Unknown user',
      action: event.action,
      targetTable: 'flowsheets',
      targetId: event.targetId,
      patientId: event.patientId,
      timestamp: new Date().toISOString(),
      details: event.details || ''
    })
  }
}

export const getters = {
  templates: (state) => state.flowsheetTemplates,

  sectionsForTemplate: (state) => (templateId) => {
    return (state.flowsheetSections[templateId] || []).map(section => ({
      ...section,
      rows: (state.flowsheetRows[templateId] || []).filter(r => r.sectionId === section.id)
    }))
  },

  cellsByColumnAndRow: (state) => (columnId, rowId) => {
    return state.cells.find(c => c.columnId === columnId && c.rowId === rowId)
  },

  lastFiledByRow: (state) => (patientId, encounterId, rowId) => {
    const cells = state.cells
      .filter(c => c.patientId === patientId && c.encounterId === encounterId && c.rowId === rowId && c.status === 'filed')
      .sort((a, b) => new Date(b.documentedAt) - new Date(a.documentedAt))
    return cells[0] || null
  },

  calculatedValue: (state, getters) => (columnId, rowId, calculation, patientId, encounterId) => {
    if (calculation === 'gcs-total') {
      const eye = getters.cellsByColumnAndRow(columnId, 'gcs-eye')?.value || 0
      const verbal = getters.cellsByColumnAndRow(columnId, 'gcs-verbal')?.value || 0
      const motor = getters.cellsByColumnAndRow(columnId, 'gcs-motor')?.value || 0
      return parseInt(eye) + parseInt(verbal) + parseInt(motor)
    }
    return null
  },

  correctionsByOriginalCell: (state) => (cellId) => {
    return state.corrections.filter(c => c.originalCellId === cellId)
  }
}
