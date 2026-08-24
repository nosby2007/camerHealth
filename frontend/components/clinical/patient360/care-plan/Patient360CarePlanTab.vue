<template>
  <div class="care-plan-workspace">
    <CarePlanSubTabs
      :selected-subview="selectedSubview"
      @select="selectedSubview = $event"
    />

    <div v-if="readOnly" class="read-only-notice">
      <v-icon x-small>mdi-lock-outline</v-icon>
      Discharged chart. Care plan history is available in read-only mode.
    </div>

    <div :class="['care-plan-content', { 'read-only': readOnly }]">
      <CarePlanOverview
        v-if="selectedSubview === 'overview'"
        :patient-id="patientId"
        :encounter-id="encounterId"
        :admission-id="admissionId"
        :role="role"
      />

      <CarePlanManageProgress
        v-else-if="selectedSubview === 'managePlanDocumentProgress'"
        :patient-id="patientId"
        :encounter-id="encounterId"
        :admission-id="admissionId"
        :role="role"
      />

      <CarePlanSummaryAndNote
        v-else-if="selectedSubview === 'summaryAndNote'"
        :patient-id="patientId"
        :encounter-id="encounterId"
        :admission-id="admissionId"
        :role="role"
      />
    </div>
  </div>
</template>

<script>
import CarePlanSubTabs from './CarePlanSubTabs.vue'
import CarePlanOverview from './CarePlanOverview.vue'
import CarePlanManageProgress from './CarePlanManageProgress.vue'
import CarePlanSummaryAndNote from './CarePlanSummaryAndNote.vue'

export default {
  name: 'Patient360CarePlanTab',
  components: {
    CarePlanSubTabs,
    CarePlanOverview,
    CarePlanManageProgress,
    CarePlanSummaryAndNote
  },
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true },
    admissionId: { type: String, default: '' },
    role: { type: String, default: '' },
    readOnly: { type: Boolean, default: false }
  },
  data() {
    return {
      selectedSubview: 'overview'
    }
  },
  watch: {
    patientId() {
      this.selectedSubview = 'overview'
    }
  }
}
</script>

<style scoped>
.care-plan-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.care-plan-content {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
}

.read-only-notice {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid #cbd5e1;
  background: #f1f5f9;
  color: #334155;
  font-size: 11px;
  font-weight: 700;
}

.care-plan-content.read-only ::v-deep button,
.care-plan-content.read-only ::v-deep input,
.care-plan-content.read-only ::v-deep textarea,
.care-plan-content.read-only ::v-deep select,
.care-plan-content.read-only ::v-deep .v-btn,
.care-plan-content.read-only ::v-deep .v-input {
  pointer-events: none !important;
  opacity: 0.62;
}
</style>
