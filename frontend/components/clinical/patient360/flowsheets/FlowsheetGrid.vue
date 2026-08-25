<template>
  <div class="flowsheet-grid" :style="{ minWidth: gridMinWidth }">
    <div :class="['grid-header', 'sticky', { 'without-last-filed': !showLastFiled }]">
      <div class="row-label-col">Row</div>
      <div v-if="showLastFiled" class="last-filed-col">Last Filed</div>
      <div class="time-columns">
        <div v-for="col in columns" :key="col.id" class="time-column">
          <div class="column-time">{{ col.label }}</div>
          <div class="column-status" :class="col.status">{{ col.status }}</div>
        </div>
      </div>
    </div>

    <div v-for="section in visibleSections" :key="section.id" class="section">
      <div
        :class="['section-header', { collapsed: collapsedSections[section.id] }]"
        @click="toggleSection(section.id)"
      >
        <v-icon x-small>{{ collapsedSections[section.id] ? 'mdi-chevron-right' : 'mdi-chevron-down' }}</v-icon>
        <span>{{ section.label }}</span>
        <span class="row-count">({{ section.rows.length }})</span>
      </div>

      <template v-if="!collapsedSections[section.id]">
        <FlowsheetRow
          v-for="row in getVisibleRowsWithChildren(section.rows)"
          :key="row.id"
          :row="row"
          :columns="columns"
          :patient-id="patientId"
          :encounter-id="encounterId"
          :show-last-filed="showLastFiled"
          :is-selected="row.id === selectedRowId"
          :has-children="hasChildren(row.id)"
          :is-collapsed="collapsedRows[row.id]"
          :indent-level="row.level || 0"
          @select="$emit('select-row', row.id)"
          @toggle-collapse="toggleRowCollapse(row.id)"
          @cell-update="onCellUpdate"
          @cell-correct="$emit('cell-correct', $event)"
        />
      </template>
    </div>
  </div>
</template>

<script>
import FlowsheetRow from './FlowsheetRow.vue'

export default {
  name: 'FlowsheetGrid',
  components: { FlowsheetRow },
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true },
    templateId: { type: String, required: true },
    sections: { type: Array, required: true },
    hideCompleted: { type: Boolean, default: false },
    smartCollapse: { type: Boolean, default: false },
    showLastFiled: { type: Boolean, default: true }
  },
  emits: ['select-row', 'cell-update', 'cell-correct'],
  data() {
    return {
      collapsedSections: {}
    }
  },
  emits: ['select-row', 'cell-update', 'cell-correct'],
  computed: {
    selectedRowId() {
      return this.$store.state.flowsheets.selectedRowId
    },
    columns() {
      return this.$store.state.flowsheets.columns.filter(
        c => c.patientId === this.patientId && c.encounterId === this.encounterId
      )
    },
    visibleSections() {
      if (!this.smartCollapse) return this.sections

      return this.sections.map(section => ({
        ...section,
        rows: section.rows.filter(row => row.status !== 'completed')
      }))
    },
    collapsedRows() {
      return this.$store.state.flowsheets.collapsedRows
    },
    gridMinWidth() {
      const fixedColumns = this.showLastFiled ? 330 : 210
      return `${fixedColumns + (this.columns.length * 120)}px`
    }
  },
  methods: {
    toggleSection(sectionId) {
      this.$set(this.collapsedSections, sectionId, !this.collapsedSections[sectionId])
    },
    toggleRowCollapse(rowId) {
      this.$store.commit('flowsheets/TOGGLE_ROW_COLLAPSE', rowId)
    },
    onCellUpdate(event) {
      // Set the column as the selected column so users can file it
      if (event.columnId) {
        this.$store.commit('flowsheets/SET_SELECTED_COLUMN', event.columnId)
      }
      this.$emit('cell-update', event)
    },
    visibleRows(rows) {
      if (this.hideCompleted) {
        return rows.filter(row => {
          const cells = this.$store.state.flowsheets.cells.filter(
            c => c.rowId === row.id && c.patientId === this.patientId && c.encounterId === this.encounterId
          )
          return !cells.every(c => c.status === 'completed')
        })
      }
      return rows.filter(r => !r.parentId)
    },
    getChildRows(parentId) {
      return this.$store.getters['flowsheets/childRows'](parentId)
    },
    hasChildren(rowId) {
      return this.$store.getters['flowsheets/hasChildren'](rowId)
    },
    getVisibleRowsWithChildren(rows) {
      const result = []
      const parentRows = this.visibleRows(rows)

      for (const row of parentRows) {
        result.push(row)

        if (!this.collapsedRows[row.id]) {
          const children = this.getChildRows(row.id)
          result.push(...children)
        }
      }

      return result
    }
  }
}
</script>

<style scoped>
.flowsheet-grid {
  --row-label-width: 210px;
  --last-filed-width: 120px;
  --time-column-width: 120px;
  font-size: 12px;
  width: 100%;
  background: #fff;
}

.grid-header {
  display: grid;
  grid-template-columns: var(--row-label-width) var(--last-filed-width) minmax(0, 1fr);
  background: #dce8e6;
  border-bottom: 2px solid #0f766e;
  top: 0;
  z-index: 10;
  width: 100%;
  box-sizing: border-box;
}

.grid-header.without-last-filed {
  grid-template-columns: var(--row-label-width) minmax(0, 1fr);
}

.grid-header.sticky {
  position: sticky;
  top: 0;
}

.row-label-col,
.last-filed-col {
  align-items: center;
  display: flex;
  min-height: 52px;
  padding: 8px 12px;
  background: #edf4f3;
  font-weight: 800;
  text-align: left;
  border-right: 1px solid #b8c8c6;
  box-sizing: border-box;
}

.time-columns {
  display: flex;
  background: #dce8e6;
  min-width: 0;
}

.time-column {
  box-sizing: border-box;
  flex: 0 0 var(--time-column-width);
  min-height: 52px;
  padding: 8px 10px;
  background: #edf4f3;
  border-right: 1px solid #b8c8c6;
}

.column-time {
  font-weight: 600;
  color: #333;
}

.column-status {
  font-size: 10px;
  text-transform: uppercase;
  color: #666;
}

.section {
  background: #fff;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #e7efee;
  border-bottom: 1px solid #cbd5e1;
  border-top: 1px solid #cbd5e1;
  cursor: pointer;
  font-weight: 600;
  color: #134e4a;
  user-select: none;
}

.section-header:hover {
  background: #eee;
}

.row-count {
  font-size: 11px;
  color: #999;
  font-weight: normal;
  margin-left: auto;
}
</style>
