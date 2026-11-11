<template>
  <article class="flow-section">
    <header>
      <div>
        <v-icon x-small color="#0f766e">mdi-table</v-icon>
        <strong>{{ title }}</strong>
        <span v-if="required" class="required-dot">{{ $t('clinical360.shell.flow_section.required_documentation') }}</span>
      </div>
      <button v-if="action" type="button" class="flow-action" @click="$emit('action', action)">
        <v-icon x-small>mdi-pencil-outline</v-icon>
        {{ $t('clinical360.shell.flow_section.open_form') }}
      </button>
    </header>

    <div class="flow-grid" :style="{ gridTemplateColumns: gridTemplate }">
      <div class="flow-cell label-cell"></div>
      <div v-for="column in columns" :key="column" class="flow-cell column-cell">
        {{ column }}
      </div>
      <template v-for="row in rows">
        <div :key="`${row.label}-label`" class="flow-cell row-label">
          {{ row.label }}
        </div>
        <div
          v-for="column in columns"
          :key="`${row.label}-${column}`"
          class="flow-cell value-cell"
        >
          {{ cellValue(row, column) }}
        </div>
      </template>
    </div>
  </article>
</template>

<script>
export default {
  name: 'FlowSection',
  props: {
    title: { type: String, required: true },
    columns: { type: Array, default: () => [] },
    rows: { type: Array, default: () => [] },
    required: { type: Boolean, default: false },
    action: { type: String, default: '' }
  },
  computed: {
    gridTemplate() {
      return `minmax(220px, 1.1fr) repeat(${this.columns.length}, minmax(120px, 1fr))`
    }
  },
  methods: {
    cellValue(row, column) {
      if (row.values && row.values[column] !== undefined) return row.values[column]
      return row.value || '-'
    }
  }
}
</script>

<style scoped>
.flow-section {
  background: #fff;
  border: 1px solid #cbd5e1;
  min-width: 0;
}
.flow-section header {
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #e7f4e2;
  border-bottom: 1px solid #cbd5e1;
  padding: 5px 8px;
}
.flow-section header div,
.flow-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.flow-action {
  border: 0;
  background: transparent;
  color: #1d4ed8;
  cursor: pointer;
  font-size: 11px;
  font-weight: 800;
}
.required-dot {
  color: #0f766e;
  font-size: 10px;
  font-weight: 900;
}
.flow-grid {
  display: grid;
  overflow-x: auto;
}
.flow-cell {
  min-height: 26px;
  border-right: 1px solid #d7e0df;
  border-bottom: 1px solid #d7e0df;
  padding: 5px 7px;
}
.column-cell {
  color: #1d4ed8;
  font-weight: 900;
  text-align: center;
}
.row-label {
  color: #334155;
  font-weight: 700;
}
.value-cell {
  color: #0f172a;
  text-align: center;
}
</style>
