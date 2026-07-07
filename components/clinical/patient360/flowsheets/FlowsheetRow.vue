<template>
  <div :class="['flowsheet-row', { selected: isSelected }]" @click="$emit('select')">
    <div class="row-label" :title="row.label">
      {{ row.label }}
      <span v-if="row.unit" class="unit">({{ row.unit }})</span>
    </div>

    <div v-if="showLastFiled" class="last-filed">
      <span v-if="lastFiled">{{ lastFiled.displayValue }}</span>
      <span v-else class="no-data">—</span>
    </div>

    <div class="time-columns">
      <FlowsheetCell
        v-for="col in columns"
        :key="col.id"
        :cell="getCellForColumn(col)"
        :row-id="row.id"
        :column-id="col.id"
        :row-type="row.rowType"
        :patient-id="patientId"
        :encounter-id="encounterId"
        @update="$emit('cell-update', $event)"
        @correct="$emit('cell-correct', $event)"
      />
    </div>
  </div>
</template>

<script>
import FlowsheetCell from './FlowsheetCell.vue'

export default {
  name: 'FlowsheetRow',
  components: { FlowsheetCell },
  props: {
    row: { type: Object, required: true },
    columns: { type: Array, required: true },
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true },
    showLastFiled: { type: Boolean, default: true },
    isSelected: { type: Boolean, default: false }
  },
  emits: ['select', 'cell-update', 'cell-correct'],
  computed: {
    lastFiled() {
      return this.$store.getters['flowsheets/lastFiledByRow'](this.patientId, this.encounterId, this.row.id)
    }
  },
  methods: {
    getCellForColumn(col) {
      return this.$store.getters['flowsheets/cellsByColumnAndRow'](col.id, this.row.id)
    }
  }
}
</script>

<style scoped>
.flowsheet-row {
  display: grid;
  grid-template-columns: 150px 120px 1fr;
  gap: 1px;
  background: #e8eaea;
  padding: 1px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.flowsheet-row:hover {
  background: #d0e0e0;
}

.flowsheet-row.selected {
  background: #c9e9e7;
}

.row-label {
  padding: 8px;
  background: #fff;
  font-size: 12px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unit {
  font-size: 10px;
  color: #999;
  font-weight: normal;
  margin-left: 2px;
}

.last-filed {
  padding: 8px;
  background: #fff;
  font-size: 12px;
  text-align: center;
  border-right: 1px solid #ccc;
  color: #666;
}

.no-data {
  color: #ccc;
}

.time-columns {
  display: flex;
  gap: 1px;
  background: #e8eaea;
}
</style>
