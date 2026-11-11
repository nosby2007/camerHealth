<template>
  <div :class="['flowsheet-row', { selected: isSelected, 'is-child': indentLevel > 0, 'without-last-filed': !showLastFiled }]" :style="{ '--row-indent': `${indentLevel * 18}px` }">
    <div class="row-label" :title="row.label" @click="$emit('select')">
      <div class="label-content">
        <button
          v-if="hasChildren"
          class="expand-toggle"
          @click.stop="$emit('toggle-collapse')"
          :title="isCollapsed ? $t('clinical360.flowsheets.row.expand') : $t('clinical360.flowsheets.row.collapse')"
        >
          <v-icon x-small>{{ isCollapsed ? 'mdi-chevron-right' : 'mdi-chevron-down' }}</v-icon>
        </button>
        <span v-else class="expand-spacer"></span>
        <span class="label-text">
          {{ row.label }}
          <span v-if="row.unit" class="unit">({{ row.unit }})</span>
        </span>
      </div>
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
    isSelected: { type: Boolean, default: false },
    hasChildren: { type: Boolean, default: false },
    isCollapsed: { type: Boolean, default: false },
    indentLevel: { type: Number, default: 0 }
  },
  emits: ['select', 'cell-update', 'cell-correct', 'toggle-collapse'],
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
  --row-label-width: 210px;
  --last-filed-width: 120px;
  display: grid;
  grid-template-columns: var(--row-label-width) var(--last-filed-width) minmax(0, 1fr);
  background: #fff;
  border-bottom: 1px solid #d7e0df;
  cursor: pointer;
  transition: background 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

.flowsheet-row.without-last-filed {
  grid-template-columns: var(--row-label-width) minmax(0, 1fr);
}

.flowsheet-row.is-child {
  background: #f5f5f5;
}

.flowsheet-row:hover {
  background: #d0e0e0;
}

.flowsheet-row.is-child:hover {
  background: #efefef;
}

.flowsheet-row.selected {
  background: #c9e9e7;
}

.row-label {
  min-height: 44px;
  padding: 7px 10px;
  background: #fff;
  font-size: 12px;
  font-weight: 500;
  color: #333;
  border-right: 1px solid #d7e0df;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.flowsheet-row.is-child .row-label {
  background: #fafafa;
  font-weight: 400;
  padding-left: 0;
}

.label-content {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
  padding-left: var(--row-indent, 0);
}

.expand-toggle {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0f766e;
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.expand-toggle:hover {
  color: #075d58;
}

.expand-spacer {
  width: 24px;
  flex-shrink: 0;
}

.label-text {
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
  align-items: center;
  display: flex;
  justify-content: center;
  min-height: 44px;
  padding: 7px 8px;
  background: #fff;
  font-size: 12px;
  text-align: center;
  border-right: 1px solid #d7e0df;
  box-sizing: border-box;
  color: #666;
}

.no-data {
  color: #ccc;
}

.time-columns {
  display: flex;
  min-width: 0;
  background: #fff;
}
</style>
