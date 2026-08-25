<template>
  <div class="care-plan-workspace">
    <div class="care-plan-toolbar">
      <div>
        <strong>Patient Care Plan</strong>
        <span>Prebuilt clinical plans, individualized goals and documented progress</span>
      </div>
      <v-btn v-if="!readOnly" x-small depressed color="#0f766e" dark @click="openTemplateSelector">
        <v-icon x-small left>mdi-plus</v-icon>New care plan
      </v-btn>
    </div>

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
        :read-only="readOnly"
        @create="openTemplateSelector"
        @manage="selectedSubview = 'managePlanDocumentProgress'"
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

    <v-dialog v-model="showTemplateSelector" max-width="1080" persistent scrollable>
      <CarePlanTemplateSelector
        :patient-id="patientId"
        @close="showTemplateSelector = false"
        @select="startFromTemplate"
      />
    </v-dialog>

    <v-dialog v-model="showCarePlanForm" max-width="1080" persistent scrollable>
      <CarePlanForm
        v-if="showCarePlanForm"
        :patient-id="patientId"
        :encounter-id="encounterId"
        :admission-id="admissionId"
        :template="selectedTemplate"
        @close="closeCarePlanForm"
        @save="handleCarePlanSaved"
        @error="$emit('error', $event)"
      />
    </v-dialog>
  </div>
</template>

<script>
import CarePlanSubTabs from './CarePlanSubTabs.vue'
import CarePlanOverview from './CarePlanOverview.vue'
import CarePlanManageProgress from './CarePlanManageProgress.vue'
import CarePlanSummaryAndNote from './CarePlanSummaryAndNote.vue'
import CarePlanTemplateSelector from './CarePlanTemplateSelector.vue'
import CarePlanForm from './CarePlanForm.vue'

export default {
  name: 'Patient360CarePlanTab',
  components: {
    CarePlanSubTabs,
    CarePlanOverview,
    CarePlanManageProgress,
    CarePlanSummaryAndNote,
    CarePlanTemplateSelector,
    CarePlanForm
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
      selectedSubview: 'overview',
      showTemplateSelector: false,
      showCarePlanForm: false,
      selectedTemplate: null
    }
  },
  watch: {
    patientId() {
      this.selectedSubview = 'overview'
      this.initializeCarePlan()
    }
  },
  mounted() {
    this.initializeCarePlan()
  },
  methods: {
    initializeCarePlan() {
      if (this.readOnly) return
      this.$store.dispatch('carePlan/initializeCarePlanForPatient', {
        patientId: this.patientId,
        encounterId: this.encounterId,
        admissionId: this.admissionId
      })
    },
    openTemplateSelector() {
      if (this.readOnly) return
      this.selectedTemplate = null
      this.showTemplateSelector = true
    },
    startFromTemplate(template) {
      this.selectedTemplate = template
      this.showTemplateSelector = false
      this.showCarePlanForm = true
    },
    closeCarePlanForm() {
      this.showCarePlanForm = false
      this.selectedTemplate = null
    },
    handleCarePlanSaved(record) {
      this.closeCarePlanForm()
      this.selectedSubview = 'overview'
      this.$emit('saved', record)
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

.care-plan-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 48px;
  padding: 8px 12px;
  border-bottom: 1px solid #cbd5e1;
  background: #f8fafc;
}
.care-plan-toolbar > div { display: grid; gap: 2px; }
.care-plan-toolbar strong { color: #134e4a; font-size: 13px; }
.care-plan-toolbar span { color: #64748b; font-size: 10px; }

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
