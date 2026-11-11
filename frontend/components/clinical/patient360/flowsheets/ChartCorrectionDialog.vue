<template>
  <v-dialog :value="show" max-width="600" persistent @input="$emit('update:show', $event)">
    <v-card>
      <v-card-title>{{ $t('clinical360.flowsheets.chart_correction_dialog.title') }}</v-card-title>
      <v-card-text>
        <p class="subtitle">{{ $t('clinical360.flowsheets.chart_correction_dialog.subtitle') }}</p>

        <div class="form-section">
          <label class="label">{{ $t('clinical360.flowsheets.chart_correction_dialog.select_entry') }}</label>
          <div class="entries-list">
            <div
              v-for="entry in recentEntries"
              :key="entry.id"
              :class="['entry-item', { selected: selectedEntry?.id === entry.id }]"
              @click="selectedEntry = entry"
            >
              <div class="entry-info">
                <div class="entry-row">{{ entry.rowLabel }}</div>
                <div class="entry-value">{{ $t('clinical360.flowsheets.chart_correction_dialog.current_value', { value: entry.value }) }}</div>
              </div>
              <div class="entry-date">{{ formatDate(entry.documentedAt) }}</div>
            </div>
          </div>
        </div>

        <div v-if="selectedEntry" class="form-section">
          <v-text-field
            v-model="newValue"
            :label="$t('clinical360.flowsheets.chart_correction_dialog.corrected_value')"
            outlined
            dense
          />

          <v-textarea
            v-model="reason"
            :label="$t('clinical360.flowsheets.chart_correction_dialog.reason_for_correction')"
            outlined
            dense
            rows="3"
            :placeholder="$t('clinical360.flowsheets.chart_correction_dialog.reason_placeholder')"
          />
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text small @click="$emit('update:show', false)">{{ $t('clinical360.flowsheets.chart_correction_dialog.cancel') }}</v-btn>
        <v-btn depressed color="#0f766e" dark small @click="submitCorrection" :disabled="!selectedEntry || !newValue || !reason">
          {{ $t('clinical360.flowsheets.chart_correction_dialog.create_correction') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'ChartCorrectionDialog',
  props: {
    show: { type: Boolean, default: false },
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true }
  },
  data() {
    return {
      selectedEntry: null,
      newValue: '',
      reason: ''
    }
  },
  computed: {
    recentEntries() {
      const allRows = Object.values(this.$store.state.flowsheets.flowsheetRows).flat()
      return this.$store.state.flowsheets.cells
        .filter(c => c.patientId === this.patientId && c.encounterId === this.encounterId && c.status === 'filed')
        .sort((a, b) => new Date(b.documentedAt) - new Date(a.documentedAt))
        .slice(0, 20)
        .map(cell => {
          const row = allRows.find(r => r.id === cell.rowId)
          return {
            id: cell.id,
            rowId: cell.rowId,
            rowLabel: row?.label || this.$t('clinical360.flowsheets.chart_correction_dialog.unknown_row'),
            value: cell.displayValue,
            documentedAt: cell.documentedAt,
            documentedBy: cell.documentedBy
          }
        })
    }
  },
  watch: {
    show(val) {
      if (!val) {
        this.selectedEntry = null
        this.newValue = ''
        this.reason = ''
      }
    }
  },
  methods: {
    submitCorrection() {
      this.$emit('correct', {
        originalCellId: this.selectedEntry.id,
        rowId: this.selectedEntry.rowId,
        newValue: this.newValue,
        reason: this.reason,
        patientId: this.patientId,
        encounterId: this.encounterId
      })
      this.$emit('update:show', false)
    },
    formatDate(dateStr) {
      if (!dateStr) return '—'
      return new Date(dateStr).toLocaleString()
    }
  }
}
</script>

<style scoped>
.subtitle {
  color: #666;
  font-size: 12px;
  margin-bottom: 16px;
}

.form-section {
  margin-bottom: 16px;
}

.label {
  display: block;
  font-size: 11px;
  font-weight: 800;
  color: #134e4a;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.entries-list {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.entry-item {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s ease;
}

.entry-item:last-child {
  border-bottom: none;
}

.entry-item:hover {
  background: #f9f9f9;
}

.entry-item.selected {
  background: #e8f4f3;
  border-left: 3px solid #0f766e;
}

.entry-info {
  flex: 1;
}

.entry-row {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.entry-value {
  font-size: 11px;
  color: #666;
  margin-top: 2px;
}

.entry-date {
  font-size: 10px;
  color: #999;
  white-space: nowrap;
  margin-left: 12px;
}
</style>
