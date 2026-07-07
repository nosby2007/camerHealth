import { makeId, withBase } from '~/util/nursing-workflow.cjs'

const createDebouncer = () => {
  const timers = {}
  return {
    debounce(key, fn, delay = 3000) {
      if (timers[key]) clearTimeout(timers[key])
      timers[key] = setTimeout(() => {
        fn()
        delete timers[key]
      }, delay)
    }
  }
}

const debouncer = createDebouncer()

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
    { id: 'temp', label: 'Temperature', sectionId: 'vs-1', rowType: 'numeric', unit: '°C', required: true, canGraph: true, calculation: null, parentId: null, level: 0 },
    { id: 'hr', label: 'Heart Rate', sectionId: 'vs-1', rowType: 'numeric', unit: 'bpm', required: true, canGraph: true, calculation: null, parentId: null, level: 0 },
    { id: 'rr', label: 'Respiratory Rate', sectionId: 'vs-1', rowType: 'numeric', unit: 'breaths/min', required: true, canGraph: true, calculation: null, parentId: null, level: 0 },
    { id: 'sbp', label: 'Systolic BP', sectionId: 'vs-1', rowType: 'numeric', unit: 'mmHg', required: true, canGraph: true, calculation: null, parentId: null, level: 0 },
    { id: 'dbp', label: 'Diastolic BP', sectionId: 'vs-1', rowType: 'numeric', unit: 'mmHg', required: true, canGraph: true, calculation: null, parentId: null, level: 0 },
    { id: 'spo2', label: 'SpO2', sectionId: 'vs-1', rowType: 'numeric', unit: '%', required: true, canGraph: true, calculation: null, parentId: null, level: 0 },
    { id: 'glucose', label: 'Blood Glucose', sectionId: 'vs-1', rowType: 'numeric', unit: 'mg/dL', required: false, canGraph: true, calculation: null, parentId: null, level: 0 }
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
    // Neurological Section
    { id: 'gcs', label: 'Glasgow Coma Scale (GCS)', sectionId: 'neuro-1', rowType: 'group', unit: null, required: false, canGraph: false, calculation: null, parentId: null, level: 0 },
    { id: 'gcs-eye', label: 'Eye Opening', sectionId: 'neuro-1', rowType: 'numeric', unit: '1-4', required: false, canGraph: false, calculation: null, parentId: 'gcs', level: 1 },
    { id: 'gcs-verbal', label: 'Verbal Response', sectionId: 'neuro-1', rowType: 'numeric', unit: '1-5', required: false, canGraph: false, calculation: null, parentId: 'gcs', level: 1 },
    { id: 'gcs-motor', label: 'Motor Response', sectionId: 'neuro-1', rowType: 'numeric', unit: '1-6', required: false, canGraph: false, calculation: null, parentId: 'gcs', level: 1 },
    { id: 'gcs-total', label: 'Total Score', sectionId: 'neuro-1', rowType: 'calculated', unit: '3-15', required: false, canGraph: false, calculation: 'gcs-total', parentId: 'gcs', level: 1 },

    { id: 'pupil', label: 'Pupil Assessment', sectionId: 'neuro-1', rowType: 'group', unit: null, required: false, canGraph: false, calculation: null, parentId: null, level: 0 },
    { id: 'pupil-size', label: 'Size (mm)', sectionId: 'neuro-1', rowType: 'numeric', unit: 'mm', required: false, canGraph: false, calculation: null, parentId: 'pupil', level: 1 },
    { id: 'pupil-react', label: 'Reaction to Light', sectionId: 'neuro-1', rowType: 'select', unit: null, required: false, canGraph: false, calculation: null, parentId: 'pupil', level: 1 },

    // Respiratory Section
    { id: 'breath', label: 'Breath Sounds Assessment', sectionId: 'resp-1', rowType: 'group', unit: null, required: false, canGraph: false, calculation: null, parentId: null, level: 0 },
    { id: 'breath-sounds', label: 'Sounds Present', sectionId: 'resp-1', rowType: 'text', unit: null, required: false, canGraph: false, calculation: null, parentId: 'breath', level: 1 },
    { id: 'breath-wheeze', label: 'Wheezing', sectionId: 'resp-1', rowType: 'select', unit: null, required: false, canGraph: false, calculation: null, parentId: 'breath', level: 1 },
    { id: 'breath-crackles', label: 'Crackles', sectionId: 'resp-1', rowType: 'select', unit: null, required: false, canGraph: false, calculation: null, parentId: 'breath', level: 1 },

    // Cardiovascular Section
    { id: 'heart', label: 'Heart Sounds Assessment', sectionId: 'cardio-1', rowType: 'group', unit: null, required: false, canGraph: false, calculation: null, parentId: null, level: 0 },
    { id: 'heart-sounds', label: 'Sounds Present', sectionId: 'cardio-1', rowType: 'text', unit: null, required: false, canGraph: false, calculation: null, parentId: 'heart', level: 1 },
    { id: 'heart-murmur', label: 'Murmur', sectionId: 'cardio-1', rowType: 'select', unit: null, required: false, canGraph: false, calculation: null, parentId: 'heart', level: 1 },
    { id: 'heart-irregular', label: 'Irregular Rhythm', sectionId: 'cardio-1', rowType: 'select', unit: null, required: false, canGraph: false, calculation: null, parentId: 'heart', level: 1 }
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
  showLastFiled: true,
  collapsedRows: {},
  saveState: {
    isSaving: false,
    saveError: null,
    lastSavedAt: null,
    pendingCells: {},
    columnStatus: {}
  }
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
    if (idx >= 0) {
      state.cells.splice(idx, 1, cell)
    } else {
      state.cells.push(cell)
    }
  },
  ADD_CORRECTION(state, correction) {
    state.corrections.push(correction)
  },
  ADD_AUDIT(state, log) {
    state.auditLogs.push(log)
  },
  TOGGLE_ROW_COLLAPSE(state, rowId) {
    state.collapsedRows[rowId] = !state.collapsedRows[rowId]
  },
  SET_SAVING(state, val) {
    state.saveState.isSaving = val
  },
  SET_SAVE_ERROR(state, error) {
    state.saveState.saveError = error
  },
  SET_LAST_SAVED(state, timestamp) {
    state.saveState.lastSavedAt = timestamp
  },
  ADD_PENDING_CELL(state, { cellId, data }) {
    state.saveState.pendingCells[cellId] = data
  },
  REMOVE_PENDING_CELL(state, cellId) {
    delete state.saveState.pendingCells[cellId]
  },
  SET_COLUMN_STATUS(state, { columnId, status }) {
    state.saveState.columnStatus[columnId] = status
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
    commit('ADD_PENDING_CELL', { cellId, data: cell })
    commit('SET_SAVE_ERROR', null)

    dispatch('audit', { action: 'FLOWSHEET_CELL_UPDATED', targetId: cellId, patientId, details: { rowId, value } })

    // Debounced auto-save to backend
    debouncer.debounce(`cell-${cellId}`, () => {
      dispatch('persistCell', { cell, patientId, encounterId })
    }, 3000)

    return cell
  },

  async persistCell({ commit, dispatch }, { cell, patientId, encounterId }) {
    try {
      commit('SET_SAVING', true)
      const api = this.$flowsheetApi || window.$flowsheetApi
      if (!api) {
        throw new Error('API service not initialized')
      }

      const result = await api.saveCell({
        cellId: cell.id,
        rowId: cell.rowId,
        columnId: cell.columnId,
        patientId,
        encounterId,
        value: cell.value,
        displayValue: cell.displayValue,
        source: cell.source
      })

      if (result.success) {
        commit('REMOVE_PENDING_CELL', cell.id)
        commit('SET_LAST_SAVED', new Date().toISOString())
        commit('SET_SAVE_ERROR', null)
      } else {
        commit('SET_SAVE_ERROR', result.error)
      }
      commit('SET_SAVING', false)
    } catch (error) {
      commit('SET_SAVE_ERROR', error.message)
      commit('SET_SAVING', false)
    }
  },

  async fileColumn({ state, commit, dispatch, rootState }, { columnId, patientId, encounterId }) {
    try {
      commit('SET_SAVING', true)
      const api = this.$flowsheetApi || window.$flowsheetApi
      if (!api) {
        throw new Error('API service not initialized')
      }

      const result = await api.fileColumn({ columnId, patientId, encounterId })
      if (result.success) {
        const column = state.columns.find(c => c.id === columnId)
        if (column) {
          const filed = { ...column, status: 'filed', filedAt: new Date().toISOString(), filedBy: rootState.auth?.fullName || rootState.auth?.staffId }
          commit('ADD_COLUMN', filed)
          commit('SET_COLUMN_STATUS', { columnId, status: 'filed' })
          commit('SET_LAST_SAVED', new Date().toISOString())
          commit('SET_SAVE_ERROR', null)
          dispatch('audit', { action: 'FLOWSHEET_COLUMN_FILED', targetId: columnId, patientId })
          commit('SET_SAVING', false)
          return filed
        }
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      commit('SET_SAVE_ERROR', error.message)
      commit('SET_SAVING', false)
      throw error
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
  },

  childRows: (state) => (parentId) => {
    const allRows = Object.values(state.flowsheetRows).flat()
    return allRows.filter(r => r.parentId === parentId)
  },

  hasChildren: (state) => (rowId) => {
    const allRows = Object.values(state.flowsheetRows).flat()
    return allRows.some(r => r.parentId === rowId)
  }
}
