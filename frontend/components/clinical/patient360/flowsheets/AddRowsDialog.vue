<template>
  <v-dialog :value="show" max-width="600" persistent @input="$emit('update:show', $event)">
    <v-card>
      <v-card-title>{{ $t('clinical360.flowsheets.add_rows_dialog.title') }}</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="search"
          :label="$t('clinical360.flowsheets.add_rows_dialog.search_rows')"
          outlined
          dense
          prepend-inner-icon="mdi-magnify"
        />

        <div class="rows-list">
          <div v-for="row in availableRows" :key="row.id" class="row-item">
            <v-checkbox
              v-model="selectedRows"
              :value="row.id"
              dense
            />
            <div class="row-info">
              <div class="row-label">{{ row.label }}</div>
              <div v-if="row.unit" class="row-unit">{{ row.unit }}</div>
            </div>
          </div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text small @click="$emit('update:show', false)">{{ $t('clinical360.flowsheets.add_rows_dialog.cancel') }}</v-btn>
        <v-btn depressed color="#0f766e" dark small @click="addRows">{{ $t('clinical360.flowsheets.add_rows_dialog.add_selected') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'AddRowsDialog',
  props: {
    show: { type: Boolean, default: false },
    templateId: { type: String, required: true },
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true }
  },
  data() {
    return {
      search: '',
      selectedRows: []
    }
  },
  computed: {
    availableRows() {
      const rows = this.$store.state.flowsheets.flowsheetRows[this.templateId] || []
      if (!this.search) return rows
      return rows.filter(r => r.label.toLowerCase().includes(this.search.toLowerCase()))
    }
  },
  watch: {
    show(val) {
      if (!val) {
        this.search = ''
        this.selectedRows = []
      }
    }
  },
  methods: {
    addRows() {
      this.$emit('add', this.selectedRows)
      this.$emit('update:show', false)
    }
  }
}
</script>

<style scoped>
.rows-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-top: 12px;
}

.row-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.row-item:last-child {
  border-bottom: none;
}

.row-info {
  margin-left: 8px;
  flex: 1;
}

.row-label {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.row-unit {
  font-size: 11px;
  color: #999;
}
</style>
