<template>
  <nav class="navigator-strip" role="navigation" aria-label="Clinical workflow navigator">
    <div class="navigator-container">
      <!-- Current Patient Info -->
      <div class="patient-info">
        <span class="patient-name">{{ patientName }}</span>
        <span class="patient-meta">{{ patientMeta }}</span>
      </div>

      <!-- Workflow State Indicator -->
      <div class="workflow-state">
        <div class="state-item" :class="{ active: currentState === 'admission' }">
          <div class="state-dot"></div>
          <span>Admission</span>
        </div>
        <div class="state-arrow">→</div>
        <div class="state-item" :class="{ active: currentState === 'active-care' }">
          <div class="state-dot"></div>
          <span>Active Care</span>
        </div>
        <div class="state-arrow">→</div>
        <div class="state-item" :class="{ active: currentState === 'discharge' }">
          <div class="state-dot"></div>
          <span>Discharge</span>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div class="quick-actions">
        <button
          type="button"
          class="action-btn admission-btn"
          :disabled="!canAdmit"
          @click="openAdmissionChecklist"
          aria-label="Admission workflow"
        >
          <v-icon small>mdi-clipboard-check</v-icon>
          Admission
        </button>

        <button
          type="button"
          class="action-btn transfer-btn"
          :disabled="!canTransfer"
          @click="openTransferChecklist"
          aria-label="Transfer workflow"
        >
          <v-icon small>mdi-transfer</v-icon>
          Transfer
        </button>

        <button
          type="button"
          class="action-btn discharge-btn"
          :disabled="!canDischarge"
          @click="openDischargeSummary"
          aria-label="Discharge workflow"
        >
          <v-icon small>mdi-exit-to-app</v-icon>
          Discharge
        </button>
      </div>

      <!-- Alert Indicator -->
      <div v-if="alertCount > 0" class="alert-badge">
        <v-icon small color="white">mdi-bell-alert</v-icon>
        <span>{{ alertCount }}</span>
      </div>
    </div>

    <!-- Admission Checklist Dialog -->
    <v-dialog v-model="showAdmissionDialog" max-width="800px">
      <AdmissionChecklistForm
        :patient-id="patientId"
        @save="handleAdmissionSave"
        @close="showAdmissionDialog = false"
      />
    </v-dialog>

    <!-- Transfer Checklist Dialog -->
    <v-dialog v-model="showTransferDialog" max-width="800px">
      <TransferChecklistForm
        :patient-id="patientId"
        @save="handleTransferSave"
        @close="showTransferDialog = false"
      />
    </v-dialog>

    <!-- Discharge Summary Dialog -->
    <v-dialog v-model="showDischargeDialog" max-width="900px">
      <DischargeSummaryForm
        :patient-id="patientId"
        @save="handleDischargeSave"
        @close="showDischargeDialog = false"
      />
    </v-dialog>
  </nav>
</template>

<script>
import { mapState } from 'vuex'
import AdmissionChecklistForm from './navigator/AdmissionChecklistForm.vue'
import TransferChecklistForm from './navigator/TransferChecklistForm.vue'
import DischargeSummaryForm from './navigator/DischargeSummaryForm.vue'

export default {
  name: 'NavigatorStrip',
  components: {
    AdmissionChecklistForm,
    TransferChecklistForm,
    DischargeSummaryForm
  },
  props: {
    patientId: { type: String, required: true },
    patientName: { type: String, required: true },
    patientMeta: { type: String, default: '' },
    currentState: { type: String, default: 'active-care' },
    readOnly: { type: Boolean, default: false }
  },
  data() {
    return {
      showAdmissionDialog: false,
      showTransferDialog: false,
      showDischargeDialog: false
    }
  },
  computed: {
    ...mapState('clinical', ['alerts']),
    canAdmit() {
      return !this.readOnly && this.currentState === 'admission'
    },
    canTransfer() {
      return !this.readOnly && this.currentState === 'active-care'
    },
    canDischarge() {
      return !this.readOnly && this.currentState === 'active-care'
    },
    alertCount() {
      return (this.alerts || []).filter(a => !a.acknowledged).length
    }
  },
  methods: {
    openAdmissionChecklist() {
      if (this.readOnly) return
      this.showAdmissionDialog = true
    },
    openTransferChecklist() {
      if (this.readOnly) return
      this.showTransferDialog = true
    },
    openDischargeSummary() {
      if (this.readOnly) return
      this.showDischargeDialog = true
    },
    async handleAdmissionSave(data) {
      const task = await this.$store.dispatch('clinical/createTask', {
        patientId: this.patientId,
        relatedType: 'admission-checklist',
        title: 'Admission checklist completed',
        assignedToRole: 'NURSE',
        priority: 'Today',
        actionReason: JSON.stringify(data)
      })
      await this.$store.dispatch('clinical/updateTaskStatus', { id: task.id, status: 'done', reason: 'Admission checklist filed' })
      this.showAdmissionDialog = false
      this.$emit('admission-complete', data)
    },
    async handleTransferSave(data) {
      const task = await this.$store.dispatch('clinical/createTask', {
        patientId: this.patientId,
        relatedType: 'transfer-checklist',
        title: `Transfer checklist: ${data.transferLocation || 'destination'}`,
        assignedToRole: 'NURSE',
        priority: 'Today',
        actionReason: JSON.stringify(data)
      })
      await this.$store.dispatch('clinical/updateTaskStatus', { id: task.id, status: 'done', reason: 'Transfer checklist filed' })
      this.showTransferDialog = false
      this.$emit('transfer-complete', data)
    },
    async handleDischargeSave(data) {
      const task = await this.$store.dispatch('clinical/createTask', {
        patientId: this.patientId,
        relatedType: 'discharge-summary',
        title: 'Discharge summary completed',
        assignedToRole: 'NURSE',
        priority: 'Today',
        actionReason: JSON.stringify(data)
      })
      await this.$store.dispatch('clinical/updateTaskStatus', { id: task.id, status: 'done', reason: 'Discharge summary filed' })
      this.showDischargeDialog = false
      this.$emit('discharge-complete', data)
    }
  }
}
</script>

<style scoped>
.navigator-strip {
  background: linear-gradient(90deg, #0f3f3b 0%, #134e4a 100%);
  border-bottom: 2px solid #0f766e;
  padding: 12px 16px;
  color: #fff;
  z-index: 10;
}

.navigator-container {
  display: flex;
  align-items: center;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.patient-info {
  display: flex;
  flex-direction: column;
  min-width: 200px;
  border-right: 1px solid rgba(255,255,255,0.2);
  padding-right: 24px;
}

.patient-name {
  font-weight: 900;
  font-size: 15px;
}

.patient-meta {
  font-size: 12px;
  color: #a7d8cc;
}

.workflow-state {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.state-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 4px;
  background: rgba(255,255,255,0.08);
  font-size: 12px;
  font-weight: 700;
  opacity: 0.6;
  transition: all 0.2s;
}

.state-item.active {
  background: rgba(29, 185, 84, 0.2);
  opacity: 1;
  border: 1px solid #1db954;
}

.state-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #a7d8cc;
}

.state-item.active .state-dot {
  background: #1db954;
  box-shadow: 0 0 6px rgba(29, 185, 84, 0.6);
}

.state-arrow {
  color: #64b5a6;
  font-weight: 900;
}

.quick-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 4px;
  background: rgba(255,255,255,0.1);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.2);
  border-color: rgba(255,255,255,0.5);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.admission-btn {
  border-color: #4c9a88;
  color: #a7d8cc;
}

.transfer-btn {
  border-color: #4c9a88;
  color: #a7d8cc;
}

.discharge-btn {
  border-color: #c084fc;
  color: #e9d5ff;
}

.alert-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: #dc2626;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}

@media (max-width: 1024px) {
  .navigator-container {
    gap: 16px;
  }

  .workflow-state {
    display: none;
  }

  .patient-info {
    border-right: none;
    padding-right: 0;
    min-width: auto;
  }
}
</style>
