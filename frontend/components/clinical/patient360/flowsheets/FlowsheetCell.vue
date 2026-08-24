<template>
  <div :class="['flowsheet-cell', { filled: !!cell, corrected: cell?.source === 'correction', editing: editing, pending: isPending }]">
    <input
      v-if="editing"
      ref="input"
      v-model="editValue"
      type="text"
      class="cell-input"
      @blur="endEdit"
      @keyup.enter="endEdit"
      @keyup.escape="cancelEdit"
      @click.stop
    />
    <div v-else class="cell-display" @click.stop="startEdit" :title="cell?.displayValue">
      {{ cell?.displayValue || '—' }}
      <v-icon v-if="cell?.source === 'correction'" x-small class="correction-icon">mdi-pencil</v-icon>
      <v-icon v-if="isPending" x-small class="pending-icon">mdi-clock-outline</v-icon>
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
  computed: {
    isPending() {
      const pendingCells = this.$store.state.flowsheets.saveState.pendingCells
      return this.cell?.id && pendingCells[this.cell.id]
    }
  },
  methods: {
    startEdit() {
      if (this.rowType === 'calculated') return
      this.editing = true
      this.editValue = this.cell?.displayValue || ''
      this.$nextTick(() => {
        this.$refs.input?.focus()
        this.$refs.input?.select()
      })
    },
    endEdit() {
      if (this.editValue.trim() !== '') {
        this.$emit('update', {
          cellId: this.cell?.id || makeId('FLC'),
          rowId: this.rowId,
          columnId: this.columnId,
          value: this.editValue,
          displayValue: this.editValue
        })
      }
      this.editing = false
      this.editValue = ''
    },
    cancelEdit() {
      this.editing = false
      this.editValue = ''
    }
  }
}
</script>

<style scoped>
.flowsheet-cell {
  flex: 0 0 120px;
  box-sizing: border-box;
  padding: 0;
  background: #fff;
  border-right: 1px solid #d7e0df;
  display: flex;
  align-items: stretch;
  justify-content: center;
  min-height: 44px;
  font-size: 12px;
}

.flowsheet-cell.filled {
  background: #f0f8f7;
}

.flowsheet-cell.corrected {
  background: #fff8dc;
}

.flowsheet-cell.editing {
  background: #e8f5f3;
  padding: 2px;
}

.cell-display {
  width: 100%;
  padding: 8px;
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
  user-select: none;
}

.cell-display:hover {
  background: rgba(15, 118, 110, 0.05);
}

.cell-input {
  width: 100%;
  height: 100%;
  padding: 6px;
  border: 2px solid #0f766e;
  border-radius: 0;
  font-size: 12px;
  text-align: center;
  font-family: inherit;
  box-sizing: border-box;
}

.cell-input:focus {
  outline: none;
  border-color: #0f766e;
  box-shadow: inset 0 0 0 1px #0f766e;
}

.correction-icon {
  color: #f59e0b;
}

.pending-icon {
  color: #0f766e;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
