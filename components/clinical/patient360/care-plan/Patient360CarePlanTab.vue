<template>
  <div class="care-plan-workspace">
    <CarePlanSubTabs
      :selected-subview="selectedSubview"
      @select="selectedSubview = $event"
    />

    <!-- Overview -->
    <CarePlanOverview
      v-if="selectedSubview === 'overview'"
      :patient-id="patientId"
      :encounter-id="encounterId"
      :admission-id="admissionId"
      :role="role"
    />

    <!-- Manage Plan & Document Progress -->
    <CarePlanManageProgress
      v-else-if="selectedSubview === 'managePlanDocumentProgress'"
      :patient-id="patientId"
      :encounter-id="encounterId"
      :admission-id="admissionId"
      :role="role"
    />

    <!-- Summary and Note -->
    <CarePlanSummaryAndNote
      v-else-if="selectedSubview === 'summaryAndNote'"
      :patient-id="patientId"
      :encounter-id="encounterId"
      :admission-id="admissionId"
      :role="role"
    />
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
    role: { type: String, default: '' }
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
</style>
