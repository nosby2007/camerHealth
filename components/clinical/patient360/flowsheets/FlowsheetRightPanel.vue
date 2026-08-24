<template>
  <div class="right-panel">
    <div v-if="!rowId" class="empty-state">
      <p>Select a row to view details</p>
    </div>

    <div v-else class="panel-content">
      <div class="panel-section">
        <h4>{{ row?.label }}</h4>
        <p v-if="row?.unit" class="unit">Unit: {{ row.unit }}</p>
      </div>

      <div class="panel-section">
        <h5>Information</h5>
        <p v-if="row?.rowType" class="info-item">
          <strong>Type:</strong> {{ row.rowType }}
        </p>
        <p v-if="row?.calculation" class="info-item">
          <strong>Calculation:</strong> {{ row.calculation }}
        </p>
        <p v-if="row?.required" class="info-item">
          <strong>Required:</strong> Yes
        </p>
      </div>

      <div v-if="lastFiled" class="panel-section">
        <h5>Last Filed Value</h5>
        <div class="last-filed-info">
          <p><strong>Value:</strong> {{ lastFiled.displayValue }}</p>
          <p><strong>Date:</strong> {{ formatDate(lastFiled.documentedAt) }}</p>
          <p><strong>By:</strong> {{ lastFiled.documentedBy }}</p>
        </div>
      </div>

      <div class="panel-section">
        <h5>Definition</h5>
        <p class="definition">Clinical reference definition and normal ranges would appear here.</p>
      </div>

      <div class="panel-section">
        <h5>Clinical Instructions</h5>
        <p class="instructions">Clinical charting instructions and guidelines would appear here.</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FlowsheetRightPanel',
  props: {
    rowId: { type: String, default: null },
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true },
    lastFiled: { type: Object, default: null }
  },
  computed: {
    row() {
      if (!this.rowId) return null
      const allRows = Object.values(this.$store.state.flowsheets.flowsheetRows).flat()
      return allRows.find(r => r.id === this.rowId)
    }
  },
  methods: {
    formatDate(dateStr) {
      if (!dateStr) return '—'
      return new Date(dateStr).toLocaleString()
    }
  }
}
</script>

<style scoped>
.right-panel {
  background: #fafafa;
  border-left: 1px solid #e0e0e0;
  overflow-y: auto;
  padding: 12px;
  font-size: 12px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.panel-content {
  font-size: 11px;
}

.panel-section {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ddd;
}

.panel-section:last-child {
  border-bottom: none;
}

.panel-section h4 {
  margin: 0 0 8px 0;
  color: #134e4a;
  font-size: 13px;
  font-weight: 600;
}

.panel-section h5 {
  margin: 0 0 6px 0;
  color: #333;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.unit {
  margin: 0;
  color: #666;
}

.info-item {
  margin: 4px 0;
  color: #555;
}

.info-item strong {
  color: #333;
}

.last-filed-info p {
  margin: 4px 0;
  color: #555;
}

.definition,
.instructions {
  margin: 0;
  color: #666;
  line-height: 1.4;
}
</style>
