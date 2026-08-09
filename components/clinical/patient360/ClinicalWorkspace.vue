<template>
  <div class="clinical-workspace">
    <!-- Header -->
    <v-app-bar color="primary" dark dense>
      <v-toolbar-title>Patient 360 - Clinical Workspace</v-toolbar-title>
      <v-spacer />
      <v-menu>
        <template #activator="{ on, attrs }">
          <v-btn icon v-bind="attrs" v-on="on">
            <v-icon>mdi-menu</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="exportData">
            <v-list-item-title>Export Records</v-list-item-title>
          </v-list-item>
          <v-list-item @click="printRecords">
            <v-list-item-title>Print Records</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Navigation -->
    <v-navigation-drawer app permanent width="280">
      <v-list dense>
        <v-list-item-group v-model="activeTab" color="primary">
          <!-- Phase 1 -->
          <v-list-item @click="activeTab = 'avatar'">
            <v-list-item-icon><v-icon>mdi-human</v-icon></v-list-item-icon>
            <v-list-item-title>360° Avatar</v-list-item-title>
          </v-list-item>

          <!-- Phase 2 -->
          <v-list-item @click="activeTab = 'navigator'">
            <v-list-item-icon><v-icon>mdi-compass</v-icon></v-list-item-icon>
            <v-list-item-title>Workflow Navigator</v-list-item-title>
          </v-list-item>

          <!-- Phase 3 -->
          <v-list-group prepend-icon="mdi-chart-line">
            <template #activator>
              <v-list-item-title>Flowsheet Assessment</v-list-item-title>
            </template>
            <v-list-item @click="openForm('vitals')">
              <v-list-item-title class="pl-8">Vitals</v-list-item-title>
            </v-list-item>
            <v-list-item @click="openForm('pain')">
              <v-list-item-title class="pl-8">Pain</v-list-item-title>
            </v-list-item>
            <v-list-item @click="openForm('mobility')">
              <v-list-item-title class="pl-8">Mobility</v-list-item-title>
            </v-list-item>
            <v-list-item @click="openForm('intakeOutput')">
              <v-list-item-title class="pl-8">Intake/Output</v-list-item-title>
            </v-list-item>
            <v-list-item @click="openForm('headToToe')">
              <v-list-item-title class="pl-8">Head-to-Toe</v-list-item-title>
            </v-list-item>
          </v-list-group>

          <!-- Phase 4 -->
          <v-list-group prepend-icon="mdi-hospital-box-outline">
            <template #activator>
              <v-list-item-title>Orders & MAR</v-list-item-title>
            </template>
            <v-list-item @click="openForm('orderEntry')">
              <v-list-item-title class="pl-8">Order Entry</v-list-item-title>
            </v-list-item>
            <v-list-item @click="openForm('mar')">
              <v-list-item-title class="pl-8">MAR</v-list-item-title>
            </v-list-item>
            <v-list-item @click="openForm('medReconciliation')">
              <v-list-item-title class="pl-8">Med Reconciliation</v-list-item-title>
            </v-list-item>
            <v-list-item @click="openForm('deviceMarkers')">
              <v-list-item-title class="pl-8">Device Markers</v-list-item-title>
            </v-list-item>
          </v-list-group>

          <!-- Phase 5 -->
          <v-list-group prepend-icon="mdi-file-document-outline">
            <template #activator>
              <v-list-item-title>Care Planning</v-list-item-title>
            </template>
            <v-list-item @click="openForm('carePlanTemplate')">
              <v-list-item-title class="pl-8">Templates</v-list-item-title>
            </v-list-item>
            <v-list-item @click="openForm('carePlan')">
              <v-list-item-title class="pl-8">Care Plan</v-list-item-title>
            </v-list-item>
            <v-list-item @click="openForm('patientEducation')">
              <v-list-item-title class="pl-8">Education</v-list-item-title>
            </v-list-item>
          </v-list-group>

          <!-- Phase 6 -->
          <v-list-group prepend-icon="mdi-door-open">
            <template #activator>
              <v-list-item-title>Discharge Planning</v-list-item-title>
            </template>
            <v-list-item @click="openForm('dischargeContinuity')">
              <v-list-item-title class="pl-8">Continuity</v-list-item-title>
            </v-list-item>
            <v-list-item @click="openForm('followUpTasks')">
              <v-list-item-title class="pl-8">Follow-up Tasks</v-list-item-title>
            </v-list-item>
            <v-list-item @click="openForm('appointments')">
              <v-list-item-title class="pl-8">Appointments</v-list-item-title>
            </v-list-item>
            <v-list-item @click="openForm('returnPrecautions')">
              <v-list-item-title class="pl-8">Return Precautions</v-list-item-title>
            </v-list-item>
          </v-list-group>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <v-container fluid class="workspace-container">
        <!-- Avatar Tab -->
        <component
          v-if="activeTab === 'avatar'"
          :is="BodyAssessmentAvatar"
          :patient-id="patientId"
          :encounter-id="encounterId"
        />

        <!-- Navigator Tab -->
        <component
          v-else-if="activeTab === 'navigator'"
          :is="NavigatorStrip"
          :patient-id="patientId"
          :encounter-id="encounterId"
        />

        <!-- Forms Dialog -->
        <v-dialog v-model="formDialog.open" max-width="900" persistent scrollable>
          <!-- Vitals -->
          <VitalsAssessmentForm
            v-if="formDialog.type === 'vitals'"
            :patient-id="patientId"
            :encounter-id="encounterId"
            @close="formDialog.open = false"
            @save="onFormSave('vitals', $event)"
          />

          <!-- Pain -->
          <PainAssessmentForm
            v-else-if="formDialog.type === 'pain'"
            :patient-id="patientId"
            :encounter-id="encounterId"
            @close="formDialog.open = false"
            @save="onFormSave('pain', $event)"
          />

          <!-- Mobility -->
          <MobilityAssessmentForm
            v-else-if="formDialog.type === 'mobility'"
            :patient-id="patientId"
            :encounter-id="encounterId"
            @close="formDialog.open = false"
            @save="onFormSave('mobility', $event)"
          />

          <!-- Intake/Output -->
          <IntakeOutputForm
            v-else-if="formDialog.type === 'intakeOutput'"
            :patient-id="patientId"
            :encounter-id="encounterId"
            @close="formDialog.open = false"
            @save="onFormSave('intakeOutput', $event)"
          />

          <!-- Head-to-Toe -->
          <HeadToToeAssessmentForm
            v-else-if="formDialog.type === 'headToToe'"
            :patient-id="patientId"
            :encounter-id="encounterId"
            @close="formDialog.open = false"
            @save="onFormSave('headToToe', $event)"
          />

          <!-- Order Entry -->
          <OrderEntryForm
            v-else-if="formDialog.type === 'orderEntry'"
            :patient-id="patientId"
            :encounter-id="encounterId"
            @close="formDialog.open = false"
            @save="onFormSave('orderEntry', $event)"
          />

          <!-- MAR -->
          <MARInterface
            v-else-if="formDialog.type === 'mar'"
            :patient-id="patientId"
            :encounter-id="encounterId"
            @close="formDialog.open = false"
            @save="onFormSave('mar', $event)"
          />

          <!-- Medication Reconciliation -->
          <MedicationReconciliationForm
            v-else-if="formDialog.type === 'medReconciliation'"
            :patient-id="patientId"
            :encounter-id="encounterId"
            @close="formDialog.open = false"
            @save="onFormSave('medReconciliation', $event)"
          />

          <!-- Device Markers -->
          <div v-else-if="formDialog.type === 'deviceMarkers'" class="device-dialog">
            <DeviceMarkerForms
              :patient-id="patientId"
              :encounter-id="encounterId"
              @saved="onFormSave('deviceMarkers', $event)"
            />
            <v-btn @click="formDialog.open = false" class="mt-4">Close</v-btn>
          </div>

          <!-- Care Plan Template -->
          <CarePlanTemplateSelector
            v-else-if="formDialog.type === 'carePlanTemplate'"
            :patient-id="patientId"
            :encounter-id="encounterId"
            @close="formDialog.open = false"
            @select="onTemplateSelect"
          />

          <!-- Care Plan -->
          <CarePlanForm
            v-else-if="formDialog.type === 'carePlan'"
            :patient-id="patientId"
            :encounter-id="encounterId"
            :template="selectedTemplate"
            @close="formDialog.open = false"
            @save="onFormSave('carePlan', $event)"
          />

          <!-- Patient Education -->
          <PatientEducationForm
            v-else-if="formDialog.type === 'patientEducation'"
            :patient-id="patientId"
            :encounter-id="encounterId"
            @close="formDialog.open = false"
            @save="onFormSave('patientEducation', $event)"
          />

          <!-- Discharge Continuity -->
          <DischargeContinuityForm
            v-else-if="formDialog.type === 'dischargeContinuity'"
            :patient-id="patientId"
            :encounter-id="encounterId"
            @close="formDialog.open = false"
            @save="onFormSave('dischargeContinuity', $event)"
          />

          <!-- Follow-up Tasks -->
          <FollowUpTasksForm
            v-else-if="formDialog.type === 'followUpTasks'"
            :patient-id="patientId"
            :encounter-id="encounterId"
            @close="formDialog.open = false"
            @save="onFormSave('followUpTasks', $event)"
          />

          <!-- Appointments -->
          <AppointmentSchedulingForm
            v-else-if="formDialog.type === 'appointments'"
            :patient-id="patientId"
            :encounter-id="encounterId"
            @close="formDialog.open = false"
            @save="onFormSave('appointments', $event)"
          />

          <!-- Return Precautions -->
          <ReturnPrecautionsForm
            v-else-if="formDialog.type === 'returnPrecautions'"
            :patient-id="patientId"
            :encounter-id="encounterId"
            @close="formDialog.open = false"
            @save="onFormSave('returnPrecautions', $event)"
          />
        </v-dialog>

        <!-- Notification Snackbar -->
        <v-snackbar
          v-model="notification.show"
          :color="notification.color"
          timeout="3000"
          bottom right
        >
          {{ notification.message }}
        </v-snackbar>
      </v-container>
    </v-main>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

// Phase 1
import BodyAssessmentAvatar from './assessment/BodyAssessmentAvatar.vue'

// Phase 2
import NavigatorStrip from './NavigatorStrip.vue'

// Phase 3
import VitalsAssessmentForm from './flowsheets/forms/VitalsAssessmentForm.vue'
import PainAssessmentForm from './flowsheets/forms/PainAssessmentForm.vue'
import MobilityAssessmentForm from './flowsheets/forms/MobilityAssessmentForm.vue'
import IntakeOutputForm from './flowsheets/forms/IntakeOutputForm.vue'
import HeadToToeAssessmentForm from './flowsheets/forms/HeadToToeAssessmentForm.vue'

// Phase 4
import OrderEntryForm from './orders/OrderEntryForm.vue'
import MARInterface from './orders/MARInterface.vue'
import MedicationReconciliationForm from './orders/MedicationReconciliationForm.vue'
import DeviceMarkerForms from './assessment/DeviceMarkerForms.vue'

// Phase 5
import CarePlanTemplateSelector from './care-plan/CarePlanTemplateSelector.vue'
import CarePlanForm from './care-plan/CarePlanForm.vue'
import PatientEducationForm from './education/PatientEducationForm.vue'

// Phase 6
import DischargeContinuityForm from './discharge/DischargeContinuityForm.vue'
import FollowUpTasksForm from './discharge/FollowUpTasksForm.vue'
import AppointmentSchedulingForm from './discharge/AppointmentSchedulingForm.vue'
import ReturnPrecautionsForm from './discharge/ReturnPrecautionsForm.vue'

export default {
  name: 'ClinicalWorkspace',
  components: {
    BodyAssessmentAvatar,
    NavigatorStrip,
    VitalsAssessmentForm,
    PainAssessmentForm,
    MobilityAssessmentForm,
    IntakeOutputForm,
    HeadToToeAssessmentForm,
    OrderEntryForm,
    MARInterface,
    MedicationReconciliationForm,
    DeviceMarkerForms,
    CarePlanTemplateSelector,
    CarePlanForm,
    PatientEducationForm,
    DischargeContinuityForm,
    FollowUpTasksForm,
    AppointmentSchedulingForm,
    ReturnPrecautionsForm
  },
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true }
  },
  data() {
    return {
      activeTab: 'avatar',
      formDialog: {
        open: false,
        type: null
      },
      selectedTemplate: null,
      notification: {
        show: false,
        message: '',
        color: 'success'
      }
    }
  },
  computed: {
    ...mapState('patient', ['currentPatient', 'currentEncounter'])
  },
  methods: {
    ...mapActions('patient', ['loadPatient', 'loadEncounter']),
    openForm(formType) {
      this.formDialog.type = formType
      this.formDialog.open = true
    },
    onFormSave(formType, data) {
      this.notification.message = `${formType} saved successfully`
      this.notification.color = 'success'
      this.notification.show = true
      this.formDialog.open = false
    },
    onTemplateSelect(template) {
      this.selectedTemplate = template
      this.formDialog.type = 'carePlan'
    },
    exportData() {
      this.$notify({ type: 'info', message: 'Export functionality coming soon' })
    },
    printRecords() {
      window.print()
    }
  },
  mounted() {
    this.loadPatient(this.patientId)
    this.loadEncounter(this.encounterId)
  }
}
</script>

<style scoped>
.clinical-workspace {
  display: flex;
  height: 100vh;
  background: #f5f7fa;
}

.workspace-container {
  padding: 20px;
  max-width: 100%;
}

.device-dialog {
  padding: 20px;
  background: white;
  border-radius: 4px;
}
</style>
