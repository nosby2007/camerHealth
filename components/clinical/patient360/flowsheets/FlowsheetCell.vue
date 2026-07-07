<template>
  <div :class="['flowsheet-cell', { filled: !!cell, corrected: cell?.source === 'correction' }]">
    <input
      v-if="editing"
      :value="cell?.displayValue || ''"
      type="text"
      class="cell-input"
      @blur="endEdit"
      @keyup.enter="endEdit"
      @keyup.escape="cancelEdit"
      @input="updateValue"
    />
    <div v-else class="cell-display" @click="startEdit" :title="cell?.displayValue">
      {{ cell?.displayValue || '—' }}
      <v-icon v-if="cell?.source === 'correction'" x-small class="correction-icon">mdi-pencil</v-icon>
    </div>
  </div>
</template>

<script>
import { makeId } from '~/util/nursing-workflow.cjs'

export default {
  name: 'FlowsheetCell',
  props: {
    cell: { type: Object, default: null },
    rowId: { type: String, required: true },
    columnId: { type: String, required: true },
    rowType: { type: String, default: 'text' },
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true }
  },
  emits: ['update', 'correct'],
  data() {
    return {
      editing: false,
      editValue: ''
    }
  },
  methods: {
    startEdit() {
      if (this.rowType === 'calculated') return
      this.editing = true
      this.editValue = this.cell?.displayValue || ''
      this.$nextTick(() => {
        this.$el.querySelector('.cell-input')?.focus()
      })
    },
    endEdit() {
      if (this.editValue !== (this.cell?.displayValue || '')) {
        this.$emit('update', {
          cellId: this.cell?.id || makeId('FLC'),
          rowId: this.rowId,
          columnId: this.columnId,
          value: this.editValue,
          displayValue: this.editValue
        })
      }
      this.editing = false
    },
    cancelEdit() {
      this.editing = false
    },
    updateValue(e) {
      this.editValue = e.target.value
    }
  }
}
</script>

<style scoped>
.flowsheet-cell {
  flex: 0 0 120px;
  padding: 1px;
  background: #fff;
  border-right: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  font-size: 12px;
}

.flowsheet-cell.filled {
  background: #f0f8f7;
}

.flowsheet-cell.corrected {
  background: #fff8dc;
}

.cell-display {
  width: 100%;
  padding: 6px;
  text-align: center;
  cursor: text;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.cell-input {
  width: 100%;
  padding: 4px;
  border: 1px solid #0f766e;
  border-radius: 2px;
  font-size: 12px;
  text-align: center;
}

.correction-icon {
  color: #f59e0b;
}
</style>
