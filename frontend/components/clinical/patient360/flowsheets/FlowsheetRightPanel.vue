<template>
  <div class="right-panel">
    <div v-if="!rowId" class="empty-state">
      <p>{{ $t('clinical360.flowsheets.right_panel.select_row_prompt') }}</p>
    </div>

    <div v-else class="panel-content">
      <div class="panel-section">
        <h4>{{ row?.label }}</h4>
        <p v-if="row?.unit" class="unit">{{ $t('clinical360.flowsheets.right_panel.unit_label', { unit: row.unit }) }}</p>
      </div>

      <div class="panel-section">
        <h5>{{ $t('clinical360.flowsheets.right_panel.information') }}</h5>
        <p v-if="row?.rowType" class="info-item">
          <strong>{{ $t('clinical360.flowsheets.right_panel.type') }}</strong> {{ row.rowType }}
        </p>
        <p v-if="row?.calculation" class="info-item">
          <strong>{{ $t('clinical360.flowsheets.right_panel.calculation') }}</strong> {{ row.calculation }}
        </p>
        <p v-if="row?.required" class="info-item">
          <strong>{{ $t('clinical360.flowsheets.right_panel.required') }}</strong> {{ $t('clinical360.flowsheets.right_panel.yes') }}
        </p>
      </div>

      <div v-if="lastFiled" class="panel-section">
        <h5>{{ $t('clinical360.flowsheets.right_panel.last_filed_value') }}</h5>
        <div class="last-filed-info">
          <p><strong>{{ $t('clinical360.flowsheets.right_panel.value') }}</strong> {{ lastFiled.displayValue }}</p>
          <p><strong>{{ $t('clinical360.flowsheets.right_panel.date') }}</strong> {{ formatDate(lastFiled.documentedAt) }}</p>
          <p><strong>{{ $t('clinical360.flowsheets.right_panel.by') }}</strong> {{ lastFiled.documentedBy }}</p>
        </div>
      </div>

      <div class="panel-section">
        <h5>{{ $t('clinical360.flowsheets.right_panel.definition') }}</h5>
        <p class="definition">{{ $t('clinical360.flowsheets.right_panel.definition_placeholder') }}</p>
      </div>

      <div class="panel-section">
        <h5>{{ $t('clinical360.flowsheets.right_panel.clinical_instructions') }}</h5>
        <p class="instructions">{{ $t('clinical360.flowsheets.right_panel.instructions_placeholder') }}</p>
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
