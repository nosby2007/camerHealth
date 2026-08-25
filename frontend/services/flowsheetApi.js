export class FlowsheetApi {
  constructor(axios) {
    this.axios = axios
  }

  async saveCell({ cellId, rowId, columnId, patientId, encounterId, value, displayValue, source }) {
    try {
      const response = await this.axios.post('/api/flowsheets/cells', {
        id: cellId,
        rowId,
        columnId,
        patientId,
        encounterId,
        value,
        displayValue: displayValue || value,
        source: source || 'manual',
        status: 'draft',
        documentedAt: new Date().toISOString()
      })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message || 'Failed to save cell' }
    }
  }

  async fileColumn({ columnId, patientId, encounterId }) {
    try {
      const response = await this.axios.post(`/api/flowsheets/columns/${columnId}/file`, {
        patientId,
        encounterId,
        filedAt: new Date().toISOString()
      })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message || 'Failed to file column' }
    }
  }

  async getColumnStatus({ columnId, patientId, encounterId }) {
    try {
      const response = await this.axios.get(`/api/flowsheets/columns/${columnId}/status`, {
        params: { patientId, encounterId }
      })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message || 'Failed to get column status' }
    }
  }

  async correctCell({ originalCellId, rowId, columnId, patientId, encounterId, newValue, reason }) {
    try {
      const response = await this.axios.post('/api/flowsheets/corrections', {
        originalCellId,
        rowId,
        columnId,
        patientId,
        encounterId,
        newValue,
        reason,
        correctedAt: new Date().toISOString()
      })
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message || 'Failed to create correction' }
    }
  }
}

export function createFlowsheetApi(axios) {
  return new FlowsheetApi(axios)
}
