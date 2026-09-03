<template>
  <div>
    <v-dialog v-model="dialogs.order" max-width="620" persistent>
      <v-card>
        <v-card-title class="form-title">
          <div><span>{{ $t('clinical360.dialogs.context_forms.eyebrow') }}</span><strong>{{ $t('clinical360.dialogs.context_forms.choose_order_form') }}</strong></div>
          <v-btn icon small @click="close('order')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text class="order-choice-grid">
          <button type="button" @click="chooseOrder('lab')"><v-icon color="#0369a1">mdi-flask</v-icon><strong>{{ $t('clinical360.dialogs.context_forms.laboratory') }}</strong><span>{{ $t('clinical360.dialogs.context_forms.laboratory_hint') }}</span></button>
          <button type="button" @click="chooseOrder('imaging')"><v-icon color="#7c3aed">mdi-radiology-box</v-icon><strong>{{ $t('clinical360.dialogs.context_forms.imaging') }}</strong><span>{{ $t('clinical360.dialogs.context_forms.imaging_hint') }}</span></button>
          <button type="button" @click="chooseOrder('medication')"><v-icon color="#0f766e">mdi-pill-plus</v-icon><strong>{{ $t('clinical360.dialogs.context_forms.medication') }}</strong><span>{{ $t('clinical360.dialogs.context_forms.medication_hint') }}</span></button>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.task" max-width="680" persistent scrollable>
      <v-card>
        <v-card-title class="form-title">
          <div><span>{{ $t('clinical360.dialogs.context_forms.care_workload') }}</span><strong>{{ $t('clinical360.dialogs.context_forms.create_task') }}</strong></div>
          <v-btn icon small @click="close('task')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-autocomplete
            v-model="selectedTaskTemplate"
            :items="taskTemplateOptions"
            :label="$t('clinical360.dialogs.context_forms.task_template')"
            :placeholder="$t('clinical360.dialogs.context_forms.task_template_placeholder')"
            item-text="label"
            item-value="id"
            return-object
            clearable
            hide-details="auto"
            dense
            outlined
            @change="applyTaskTemplate"
          >
            <template v-slot:item="{ item }">
              <div class="task-template-option">
                <strong>{{ item.label }}</strong>
                <small>{{ item.frequencyLabel }} · {{ item.roleLabel }}</small>
              </div>
            </template>
          </v-autocomplete>
          <v-text-field v-model="forms.task.title" :label="$t('clinical360.dialogs.context_forms.task_title')" dense outlined :rules="[requiredRule]" />
          <div class="form-grid two">
            <v-select v-model="forms.task.assignedToRole" :items="careRoles" :label="$t('clinical360.dialogs.context_forms.responsible_role')" dense outlined />
            <v-select
              v-model="forms.task.priority"
              :items="taskPriorityOptions"
              item-value="value"
              item-text="text"
              :label="$t('clinical360.dialogs.context_forms.priority')"
              dense
              outlined
            />
            <v-text-field
              v-model="forms.task.dueAt"
              :label="$t('clinical360.dialogs.context_forms.first_due_at')"
              type="datetime-local"
              dense
              outlined
              :rules="[requiredRule]"
            />
            <v-select
              v-model="forms.task.frequency"
              :items="taskFrequencyOptions"
              item-value="value"
              item-text="text"
              :label="$t('clinical360.dialogs.context_forms.frequency')"
              dense
              outlined
            />
            <v-select
              v-model="forms.task.reminderMinutesBefore"
              :items="reminderOptions"
              item-text="text"
              item-value="value"
              :label="$t('clinical360.dialogs.context_forms.reminder')"
              dense
              outlined
            />
          </div>
          <v-textarea
            v-model="forms.task.instructions"
            :label="$t('clinical360.dialogs.context_forms.task_instructions')"
            rows="3"
            dense
            outlined
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text small @click="close('task')">{{ $t('clinical360.dialogs.context_forms.cancel') }}</v-btn>
          <v-btn depressed dark color="#0f766e" small :loading="saving" @click="saveTask">{{ $t('clinical360.dialogs.context_forms.create_task_btn') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.safety" max-width="720" persistent scrollable>
      <v-card>
        <v-card-title class="form-title safety">
          <div><span>{{ $t('clinical360.dialogs.context_forms.safety_watch') }}</span><strong>{{ safetyTitle }}</strong></div>
          <v-btn icon small @click="close('safety')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-select
            v-model="forms.safety.type"
            :items="safetyTypeOptions"
            item-text="label"
            item-value="value"
            :label="$t('clinical360.dialogs.context_forms.safety_domain')"
            dense
            outlined
          />
          <template v-if="forms.safety.type === 'allergies'">
            <v-textarea
              v-model="forms.safety.allergies"
              :label="$t('clinical360.dialogs.context_forms.allergies')"
              rows="3"
              dense
              outlined
              :hint="$t('clinical360.dialogs.context_forms.allergies_hint')"
              persistent-hint
            />
            <v-select
              v-model="forms.safety.allergySeverity"
              :items="allergySeverityOptions"
              item-value="value"
              item-text="text"
              :label="$t('clinical360.dialogs.context_forms.highest_severity')"
              dense
              outlined
            />
          </template>
          <template v-else-if="forms.safety.type === 'precautions'">
            <v-textarea
              v-model="forms.safety.precautions"
              :label="$t('clinical360.dialogs.context_forms.clinical_precautions')"
              rows="3"
              dense
              outlined
            />
            <v-text-field
              v-model="forms.safety.infectionStatus"
              :label="$t('clinical360.dialogs.context_forms.infection_status')"
              dense
              outlined
            />
          </template>
          <template v-else>
            <v-select
              v-model="forms.safety.fallRisk"
              :items="fallRiskOptions"
              item-value="value"
              item-text="text"
              :label="$t('clinical360.dialogs.context_forms.fall_risk')"
              dense
              outlined
            />
            <v-select
              v-model="forms.safety.assistance"
              :items="mobilityAssistanceOptions"
              item-value="value"
              item-text="text"
              :label="$t('clinical360.dialogs.context_forms.mobility_assistance')"
              dense
              outlined
            />
          </template>
          <v-textarea
            v-model="forms.safety.note"
            :label="$t('clinical360.dialogs.context_forms.assessment_note')"
            rows="3"
            dense
            outlined
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text small @click="close('safety')">{{ $t('clinical360.dialogs.context_forms.cancel') }}</v-btn>
          <v-btn depressed dark color="#be123c" small :loading="saving" @click="saveSafety">{{ $t('clinical360.dialogs.context_forms.update_safety_watch') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.labResult" max-width="760" persistent scrollable>
      <v-card>
        <v-card-title class="form-title diagnostic">
          <div><span>{{ $t('clinical360.dialogs.context_forms.laboratory') }}</span><strong>{{ $t('clinical360.dialogs.context_forms.record_validate_result') }}</strong></div>
          <v-btn icon small @click="close('labResult')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-select
            v-model="forms.labResult.orderId"
            :items="labOrderOptions"
            item-text="text"
            item-value="value"
            :label="$t('clinical360.dialogs.context_forms.laboratory_order')"
            dense
            outlined
            :rules="[requiredRule]"
          />
          <div class="form-grid two">
            <v-text-field v-model="forms.labResult.specimen" :label="$t('clinical360.dialogs.context_forms.specimen')" dense outlined :rules="[requiredRule]" />
            <v-text-field
              v-model="forms.labResult.collectedAt"
              :label="$t('clinical360.dialogs.context_forms.collected_at')"
              type="datetime-local"
              dense
              outlined
              :rules="[requiredRule]"
            />
            <v-text-field v-model="forms.labResult.collectedBy" :label="$t('clinical360.dialogs.context_forms.collected_by')" dense outlined />
            <v-select
              v-model="forms.labResult.collectionStatus"
              :items="specimenStatusOptions"
              item-value="value"
              item-text="text"
              :label="$t('clinical360.dialogs.context_forms.specimen_status')"
              dense
              outlined
            />
          </div>
          <div class="form-grid two">
            <v-text-field v-model="forms.labResult.result" :label="$t('clinical360.dialogs.context_forms.result')" dense outlined :rules="[requiredRule]" />
            <v-text-field v-model="forms.labResult.unit" :label="$t('clinical360.dialogs.context_forms.unit')" dense outlined />
            <v-text-field v-model="forms.labResult.referenceRange" :label="$t('clinical360.dialogs.context_forms.reference_range')" dense outlined />
            <v-select
              v-model="forms.labResult.flag"
              :items="labFlagOptions"
              item-value="value"
              item-text="text"
              :label="$t('clinical360.dialogs.context_forms.flag')"
              dense
              outlined
            />
          </div>
          <v-textarea
            v-model="forms.labResult.comment"
            :label="$t('clinical360.dialogs.context_forms.lab_comment')"
            rows="3"
            dense
            outlined
          />
          <div v-if="forms.labResult.flag === 'Critical'" class="critical-result-fields">
            <strong>{{ $t('clinical360.dialogs.context_forms.critical_result_communication') }}</strong>
            <div class="form-grid two">
              <v-text-field
                v-model="forms.labResult.criticalCommunicatedTo"
                :label="$t('clinical360.dialogs.context_forms.communicated_to')"
                dense
                outlined
                :rules="[requiredRule]"
              />
              <v-text-field
                v-model="forms.labResult.communicationAt"
                :label="$t('clinical360.dialogs.context_forms.communication_at')"
                type="datetime-local"
                dense
                outlined
                :rules="[requiredRule]"
              />
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text small @click="close('labResult')">{{ $t('clinical360.dialogs.context_forms.cancel') }}</v-btn>
          <v-btn depressed dark color="#0369a1" small :loading="saving" @click="saveLabResult">{{ $t('clinical360.dialogs.context_forms.validate_result') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.imagingResult" max-width="780" persistent scrollable>
      <v-card>
        <v-card-title class="form-title imaging">
          <div><span>{{ $t('clinical360.dialogs.context_forms.imaging') }}</span><strong>{{ $t('clinical360.dialogs.context_forms.file_imaging_report') }}</strong></div>
          <v-btn icon small @click="close('imagingResult')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-select
            v-model="forms.imagingResult.orderId"
            :items="imagingOrderOptions"
            item-text="text"
            item-value="value"
            :label="$t('clinical360.dialogs.context_forms.imaging_order')"
            dense
            outlined
            :rules="[requiredRule]"
          />
          <v-textarea
            v-model="forms.imagingResult.findings"
            :label="$t('clinical360.dialogs.context_forms.findings')"
            rows="4"
            dense
            outlined
            :rules="[requiredRule]"
          />
          <v-textarea
            v-model="forms.imagingResult.impression"
            :label="$t('clinical360.dialogs.context_forms.impression')"
            rows="3"
            dense
            outlined
          />
          <div class="form-grid two">
            <v-select
              v-model="forms.imagingResult.urgency"
              :items="imagingUrgencyOptions"
              item-value="value"
              item-text="text"
              :label="$t('clinical360.dialogs.context_forms.communication_priority')"
              dense
              outlined
            />
            <v-text-field
              v-model="forms.imagingResult.recommendation"
              :label="$t('clinical360.dialogs.context_forms.recommendation')"
              dense
              outlined
            />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text small @click="close('imagingResult')">{{ $t('clinical360.dialogs.context_forms.cancel') }}</v-btn>
          <v-btn depressed dark color="#7c3aed" small :loading="saving" @click="saveImagingResult">{{ $t('clinical360.dialogs.context_forms.file_report') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.careTeam" max-width="720" persistent scrollable>
      <v-card>
        <v-card-title class="form-title team">
          <div><span>{{ $t('clinical360.dialogs.context_forms.care_coordination') }}</span><strong>{{ $t('clinical360.dialogs.context_forms.add_care_team_member') }}</strong></div>
          <v-btn icon small @click="close('careTeam')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <div class="form-grid two">
            <v-autocomplete
              v-model="selectedCareTeamStaff"
              :items="careTeamStaffOptions"
              :label="$t('clinical360.dialogs.context_forms.staff_member')"
              :placeholder="$t('clinical360.dialogs.context_forms.staff_member_placeholder')"
              item-text="label"
              item-value="id"
              return-object
              clearable
              hide-no-data
              hide-details="auto"
              dense
              outlined
              :rules="[requiredRule]"
              @change="selectCareTeamStaff"
            >
              <template v-slot:item="{ item }">
                <div class="staff-option">
                  <strong>{{ item.name }}</strong>
                  <small>{{ item.roleLabel }}<span v-if="item.service"> · {{ item.service }}</span></small>
                </div>
              </template>
              <template v-slot:selection="{ item }">
                <span>{{ item.name }}</span>
              </template>
            </v-autocomplete>
            <v-select v-model="forms.careTeam.role" :items="careRoles" :label="$t('clinical360.dialogs.context_forms.role_discipline')" dense outlined />
            <v-text-field v-model="forms.careTeam.service" :label="$t('clinical360.dialogs.context_forms.service_department')" dense outlined />
            <v-text-field v-model="forms.careTeam.contact" :label="$t('clinical360.dialogs.context_forms.phone_extension')" dense outlined />
            <v-select
              v-model="forms.careTeam.responsibility"
              :items="responsibilityOptions"
              item-value="value"
              item-text="text"
              :label="$t('clinical360.dialogs.context_forms.responsibility')"
              dense
              outlined
            />
            <v-select
              v-model="forms.careTeam.status"
              :items="careTeamStatusOptions"
              item-value="value"
              item-text="text"
              :label="$t('clinical360.dialogs.context_forms.status')"
              dense
              outlined
            />
          </div>
          <v-textarea v-model="forms.careTeam.note" :label="$t('clinical360.dialogs.context_forms.coordination_note')" rows="2" dense outlined />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text small @click="close('careTeam')">{{ $t('clinical360.dialogs.context_forms.cancel') }}</v-btn>
          <v-btn depressed dark color="#0f766e" small :loading="saving" @click="saveCareTeam">{{ $t('clinical360.dialogs.context_forms.add_member') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.social" max-width="760" persistent scrollable>
      <v-card>
        <v-card-title class="form-title social">
          <div><span>{{ $t('clinical360.dialogs.context_forms.social_needs') }}</span><strong>{{ $t('clinical360.dialogs.context_forms.document_barrier_intervention') }}</strong></div>
          <v-btn icon small @click="close('social')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <div class="form-grid two">
            <v-select
              v-model="forms.social.domain"
              :items="socialDomainOptions"
              item-value="value"
              item-text="text"
              :label="$t('clinical360.dialogs.context_forms.domain')"
              dense
              outlined
            />
            <v-select
              v-model="forms.social.status"
              :items="socialStatusOptions"
              item-value="value"
              item-text="text"
              :label="$t('clinical360.dialogs.context_forms.status')"
              dense
              outlined
            />
          </div>
          <v-textarea
            v-model="forms.social.finding"
            :label="$t('clinical360.dialogs.context_forms.screening_finding')"
            rows="3"
            dense
            outlined
            :rules="[requiredRule]"
          />
          <v-textarea
            v-model="forms.social.intervention"
            :label="$t('clinical360.dialogs.context_forms.referral_plan')"
            rows="3"
            dense
            outlined
          />
          <div class="form-grid two">
            <v-text-field v-model="forms.social.owner" :label="$t('clinical360.dialogs.context_forms.follow_up_owner')" dense outlined />
            <v-text-field
              v-model="forms.social.followUpAt"
              :label="$t('clinical360.dialogs.context_forms.follow_up_date')"
              type="date"
              dense
              outlined
            />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text small @click="close('social')">{{ $t('clinical360.dialogs.context_forms.cancel') }}</v-btn>
          <v-btn depressed dark color="#be123c" small :loading="saving" @click="saveSocial">{{ $t('clinical360.dialogs.context_forms.file_social_assessment') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.education" max-width="760" persistent scrollable>
      <v-card>
        <v-card-title class="form-title education">
          <div><span>{{ $t('clinical360.dialogs.context_forms.patient_family_education') }}</span><strong>{{ $t('clinical360.dialogs.context_forms.document_teaching') }}</strong></div>
          <v-btn icon small @click="close('education')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="forms.education.topic" :label="$t('clinical360.dialogs.context_forms.teaching_topic')" dense outlined :rules="[requiredRule]" />
          <div class="form-grid two">
            <v-select
              v-model="forms.education.learners"
              :items="learnersOptions"
              item-value="value"
              item-text="text"
              :label="$t('clinical360.dialogs.context_forms.learners')"
              multiple
              chips
              small-chips
              dense
              outlined
            />
            <v-select
              v-model="forms.education.methods"
              :items="methodsOptions"
              item-value="value"
              item-text="text"
              :label="$t('clinical360.dialogs.context_forms.method')"
              multiple
              chips
              small-chips
              dense
              outlined
            />
            <v-select
              v-model="forms.education.readiness"
              :items="readinessOptions"
              item-value="value"
              item-text="text"
              :label="$t('clinical360.dialogs.context_forms.readiness')"
              dense
              outlined
            />
            <v-select
              v-model="forms.education.response"
              :items="responseOptions"
              item-value="value"
              item-text="text"
              :label="$t('clinical360.dialogs.context_forms.response')"
              dense
              outlined
            />
          </div>
          <v-textarea
            v-model="forms.education.comment"
            :label="$t('clinical360.dialogs.context_forms.teaching_content')"
            rows="3"
            dense
            outlined
          />
          <v-switch
            v-model="forms.education.resolveAfterFile"
            color="#0f766e"
            inset
            dense
            :label="$t('clinical360.dialogs.context_forms.teaching_completed')"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text small @click="close('education')">{{ $t('clinical360.dialogs.context_forms.cancel') }}</v-btn>
          <v-btn depressed dark color="#0f766e" small :loading="saving" @click="saveEducation">{{ $t('clinical360.dialogs.context_forms.file_education') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
const freshForms = () => ({
  task: { title: '', assignedToRole: 'NURSE', priority: 'Today', dueAt: '', frequency: 'Once', reminderMinutesBefore: 30, instructions: '' },
  safety: { type: 'allergies', allergies: '', allergySeverity: 'Not applicable', precautions: '', infectionStatus: '', fallRisk: 'Low', assistance: 'Independent', note: '' },
  labResult: { orderId: '', specimen: '', collectedAt: '', collectedBy: '', collectionStatus: 'Collected', result: '', unit: '', referenceRange: '', flag: 'Normal', comment: '', criticalCommunicatedTo: '', communicationAt: '' },
  imagingResult: { orderId: '', findings: '', impression: '', urgency: 'Routine', recommendation: '' },
  careTeam: { name: '', role: 'NURSE', service: '', contact: '', responsibility: 'Bedside care', status: 'Active', note: '' },
  social: { domain: 'Transportation', status: 'Needs review', finding: '', intervention: '', owner: '', followUpAt: '' },
  education: { topic: '', learners: ['Patient'], methods: ['Explanation'], readiness: 'Acceptance', response: 'Verbalizes Understanding', comment: '', resolveAfterFile: true }
})

export default {
  name: 'Patient360ContextForms',
  props: {
    patientId: { type: String, required: true },
    patient: { type: Object, required: true },
    role: { type: String, default: 'NURSE' },
    encounterId: { type: String, default: '' },
    admissionId: { type: String, default: '' },
    labOrders: { type: Array, default: () => [] },
    imagingOrders: { type: Array, default: () => [] },
    readOnly: { type: Boolean, default: false }
  },
  data() {
    return {
      saving: false,
      selectedCareTeamStaff: null,
      selectedTaskTemplate: null,
      dialogs: { order: false, task: false, safety: false, labResult: false, imagingResult: false, careTeam: false, social: false, education: false },
      forms: freshForms(),
      requiredRule: value => Boolean(value) || this.$t('clinical360.dialogs.context_forms.required'),
      careRoles: ['NURSE', 'DOCTOR', 'NP', 'CNA', 'MIDWIFE', 'LAB', 'IMAGING', 'PHARMACY', 'SOCIAL_WORKER', 'PHYSIOTHERAPIST', 'MAJOR_SERVICE'],
      // Keys are the stable English values persisted to the backend; labels are translated for display only.
      safetyTypes: [
        { label: 'Allergies', value: 'allergies' },
        { label: 'Precautions / isolation', value: 'precautions' },
        { label: 'Fall and mobility risk', value: 'fall' }
      ]
    }
  },
  computed: {
    labOrderOptions() {
      return this.labOrders.map(order => ({
        text: `${order.test || order.testName || this.$t('clinical360.dialogs.context_forms.lab_test_fallback')} · ${order.status || this.$t('clinical360.dialogs.context_forms.requested')}`,
        value: order.id
      }))
    },
    imagingOrderOptions() {
      return this.imagingOrders.map(order => ({
        text: `${order.exam || order.modality || this.$t('clinical360.dialogs.context_forms.imaging_exam_fallback')} · ${order.status || this.$t('clinical360.dialogs.context_forms.requested')}`,
        value: order.id
      }))
    },
    safetyTitle() {
      const found = this.safetyTypes.find(item => item.value === this.forms.safety.type)
      if (!found) return this.$t('clinical360.dialogs.context_forms.safety_assessment')
      const key = { allergies: 'safety_type_allergies', precautions: 'safety_type_precautions', fall: 'safety_type_fall' }[found.value]
      return key ? this.$t(`clinical360.dialogs.context_forms.${key}`) : found.label
    },
    safetyTypeOptions() {
      const keyByValue = { allergies: 'safety_type_allergies', precautions: 'safety_type_precautions', fall: 'safety_type_fall' }
      return this.safetyTypes.map(item => ({ value: item.value, label: this.$t(`clinical360.dialogs.context_forms.${keyByValue[item.value]}`) }))
    },
    taskPriorityOptions() {
      return [
        ['Routine', this.$t('clinical360.dialogs.context_forms.options.priority.routine')],
        ['Today', this.$t('clinical360.dialogs.context_forms.options.priority.today')],
        ['Urgent', this.$t('clinical360.dialogs.context_forms.options.priority.urgent')],
        ['STAT', this.$t('clinical360.dialogs.context_forms.options.priority.stat')]
      ].map(([value, text]) => ({ value, text }))
    },
    taskFrequencyOptions() {
      return [
        ['Once', this.$t('clinical360.dialogs.context_forms.options.frequency.once')],
        ['Each shift', this.$t('clinical360.dialogs.context_forms.options.frequency.each_shift')],
        ['Daily', this.$t('clinical360.dialogs.context_forms.options.frequency.daily')],
        ['Every 4 hours', this.$t('clinical360.dialogs.context_forms.options.frequency.every_4_hours')],
        ['Every 8 hours', this.$t('clinical360.dialogs.context_forms.options.frequency.every_8_hours')],
        ['PRN', this.$t('clinical360.dialogs.context_forms.options.frequency.prn')]
      ].map(([value, text]) => ({ value, text }))
    },
    taskTemplateOptions() {
      const templates = [
        ['rounding', 'NURSE', 'hourly_rounding', 'Each shift'],
        ['vitals', 'NURSE', 'vital_signs', 'Daily'],
        ['pain', 'NURSE', 'pain_reassessment', 'Each shift'],
        ['intake-output', 'NURSE', 'intake_output', 'Each shift'],
        ['fall-safety', 'NURSE', 'fall_safety', 'Daily'],
        ['adl', 'CNA', 'activities_daily_living', 'Daily'],
        ['repositioning', 'CNA', 'repositioning', 'Every 4 hours'],
        ['progress-note', 'DOCTOR', 'daily_progress_note', 'Daily'],
        ['review-results', 'DOCTOR', 'review_results', 'Daily'],
        ['med-reconciliation', 'PHARMACY', 'medication_reconciliation', 'Daily'],
        ['specimen-follow-up', 'LAB', 'specimen_follow_up', 'Each shift']
      ]
      return templates
        .filter(([, role]) => role === this.forms.task.assignedToRole)
        .map(([id, role, key, frequency]) => ({
          id,
          role,
          label: this.$t(`clinical360.dialogs.context_forms.templates.${key}.title`),
          instructions: this.$t(`clinical360.dialogs.context_forms.templates.${key}.instructions`),
          frequency,
          frequencyLabel: this.taskFrequencyOptions.find(item => item.value === frequency)?.text || frequency,
          roleLabel: this.roleLabel(role)
        }))
    },
    reminderOptions() {
      return [
        [0, this.$t('clinical360.dialogs.context_forms.options.reminder.at_due_time')],
        [15, this.$t('clinical360.dialogs.context_forms.options.reminder.min_15')],
        [30, this.$t('clinical360.dialogs.context_forms.options.reminder.min_30')],
        [60, this.$t('clinical360.dialogs.context_forms.options.reminder.hour_1')],
        [240, this.$t('clinical360.dialogs.context_forms.options.reminder.hours_4')]
      ].map(([value, text]) => ({ value, text }))
    },
    allergySeverityOptions() {
      return [
        ['Not applicable', this.$t('clinical360.dialogs.context_forms.options.allergy_severity.not_applicable')],
        ['Mild', this.$t('clinical360.dialogs.context_forms.options.allergy_severity.mild')],
        ['Moderate', this.$t('clinical360.dialogs.context_forms.options.allergy_severity.moderate')],
        ['Severe', this.$t('clinical360.dialogs.context_forms.options.allergy_severity.severe')],
        ['Anaphylaxis risk', this.$t('clinical360.dialogs.context_forms.options.allergy_severity.anaphylaxis_risk')]
      ].map(([value, text]) => ({ value, text }))
    },
    fallRiskOptions() {
      return [
        ['Low', this.$t('clinical360.dialogs.context_forms.options.fall_risk.low')],
        ['Moderate', this.$t('clinical360.dialogs.context_forms.options.fall_risk.moderate')],
        ['High', this.$t('clinical360.dialogs.context_forms.options.fall_risk.high')],
        ['Very high', this.$t('clinical360.dialogs.context_forms.options.fall_risk.very_high')]
      ].map(([value, text]) => ({ value, text }))
    },
    mobilityAssistanceOptions() {
      return [
        ['Independent', this.$t('clinical360.dialogs.context_forms.options.mobility_assistance.independent')],
        ['Supervision', this.$t('clinical360.dialogs.context_forms.options.mobility_assistance.supervision')],
        ['Assist x1', this.$t('clinical360.dialogs.context_forms.options.mobility_assistance.assist_x1')],
        ['Assist x2', this.$t('clinical360.dialogs.context_forms.options.mobility_assistance.assist_x2')],
        ['Bedbound', this.$t('clinical360.dialogs.context_forms.options.mobility_assistance.bedbound')]
      ].map(([value, text]) => ({ value, text }))
    },
    specimenStatusOptions() {
      return [
        ['Collected', this.$t('clinical360.dialogs.context_forms.options.specimen_status.collected')],
        ['Received in laboratory', this.$t('clinical360.dialogs.context_forms.options.specimen_status.received_in_laboratory')],
        ['Rejected / recollect', this.$t('clinical360.dialogs.context_forms.options.specimen_status.rejected_recollect')]
      ].map(([value, text]) => ({ value, text }))
    },
    labFlagOptions() {
      return [
        ['Normal', this.$t('clinical360.dialogs.context_forms.options.lab_flag.normal')],
        ['Low', this.$t('clinical360.dialogs.context_forms.options.lab_flag.low')],
        ['High', this.$t('clinical360.dialogs.context_forms.options.lab_flag.high')],
        ['Critical', this.$t('clinical360.dialogs.context_forms.options.lab_flag.critical')]
      ].map(([value, text]) => ({ value, text }))
    },
    imagingUrgencyOptions() {
      return [
        ['Routine', this.$t('clinical360.dialogs.context_forms.options.imaging_urgency.routine')],
        ['Important', this.$t('clinical360.dialogs.context_forms.options.imaging_urgency.important')],
        ['Urgent', this.$t('clinical360.dialogs.context_forms.options.imaging_urgency.urgent')],
        ['Critical', this.$t('clinical360.dialogs.context_forms.options.imaging_urgency.critical')]
      ].map(([value, text]) => ({ value, text }))
    },
    responsibilityOptions() {
      return [
        ['Attending', this.$t('clinical360.dialogs.context_forms.options.responsibility.attending')],
        ['Consulting', this.$t('clinical360.dialogs.context_forms.options.responsibility.consulting')],
        ['Bedside care', this.$t('clinical360.dialogs.context_forms.options.responsibility.bedside_care')],
        ['Diagnostics', this.$t('clinical360.dialogs.context_forms.options.responsibility.diagnostics')],
        ['Medication', this.$t('clinical360.dialogs.context_forms.options.responsibility.medication')],
        ['Discharge coordination', this.$t('clinical360.dialogs.context_forms.options.responsibility.discharge_coordination')]
      ].map(([value, text]) => ({ value, text }))
    },
    careTeamStatusOptions() {
      return [
        ['Active', this.$t('clinical360.dialogs.context_forms.options.care_team_status.active')],
        ['On call', this.$t('clinical360.dialogs.context_forms.options.care_team_status.on_call')],
        ['Consult requested', this.$t('clinical360.dialogs.context_forms.options.care_team_status.consult_requested')],
        ['Completed', this.$t('clinical360.dialogs.context_forms.options.care_team_status.completed')]
      ].map(([value, text]) => ({ value, text }))
    },
    careTeamStaffOptions() {
      // The full staff directory is admin-scoped. Clinical users receive the
      // facility-scoped active summary, so use it as the normal fallback.
      const directory = this.$store.getters['facility/getAllStaff'] || []
      const activeSummary = this.$store.getters['facility/getActiveStaff'] || []
      const staff = directory.length ? directory : activeSummary
      return staff
        .filter(member => member && member.status !== 'inactive')
        .map(member => {
          const name = member.fullName || member.full_name || member.name || member.staffCode || member.id
          const role = member.role || member.discipline || ''
          const roleLabel = this.roleLabel(role)
          return {
            id: member.id || member.staffCode || name,
            name,
            role,
            roleLabel,
            label: `${name} · ${roleLabel}`,
            service: member.service || member.department || '',
            contact: member.phone || member.phoneNumber || member.extension || member.contact || ''
          }
        })
        .sort((a, b) => a.name.localeCompare(b.name))
    },
    socialDomainOptions() {
      return [
        ['Food security', this.$t('clinical360.dialogs.context_forms.options.social_domain.food_security')],
        ['Transportation', this.$t('clinical360.dialogs.context_forms.options.social_domain.transportation')],
        ['Financial strain', this.$t('clinical360.dialogs.context_forms.options.social_domain.financial_strain')],
        ['Housing', this.$t('clinical360.dialogs.context_forms.options.social_domain.housing')],
        ['Utilities', this.$t('clinical360.dialogs.context_forms.options.social_domain.utilities')],
        ['Stress', this.$t('clinical360.dialogs.context_forms.options.social_domain.stress')],
        ['Safety', this.$t('clinical360.dialogs.context_forms.options.social_domain.safety')],
        ['Family support', this.$t('clinical360.dialogs.context_forms.options.social_domain.family_support')]
      ].map(([value, text]) => ({ value, text }))
    },
    socialStatusOptions() {
      return [
        ['No need', this.$t('clinical360.dialogs.context_forms.options.social_status.no_need')],
        ['Needs review', this.$t('clinical360.dialogs.context_forms.options.social_status.needs_review')],
        ['At risk', this.$t('clinical360.dialogs.context_forms.options.social_status.at_risk')],
        ['Urgent', this.$t('clinical360.dialogs.context_forms.options.social_status.urgent')]
      ].map(([value, text]) => ({ value, text }))
    },
    learnersOptions() {
      return [
        ['Patient', this.$t('clinical360.dialogs.context_forms.options.learners.patient')],
        ['Family/Caregiver', this.$t('clinical360.dialogs.context_forms.options.learners.family_caregiver')],
        ['Caregiver', this.$t('clinical360.dialogs.context_forms.options.learners.caregiver')],
        ['Other', this.$t('clinical360.dialogs.context_forms.options.learners.other')]
      ].map(([value, text]) => ({ value, text }))
    },
    methodsOptions() {
      return [
        ['Explanation', this.$t('clinical360.dialogs.context_forms.options.method.explanation')],
        ['Demonstration', this.$t('clinical360.dialogs.context_forms.options.method.demonstration')],
        ['Written material', this.$t('clinical360.dialogs.context_forms.options.method.written_material')],
        ['Interpreter', this.$t('clinical360.dialogs.context_forms.options.method.interpreter')],
        ['Teach-back', this.$t('clinical360.dialogs.context_forms.options.method.teach_back')]
      ].map(([value, text]) => ({ value, text }))
    },
    readinessOptions() {
      return [
        ['Eager', this.$t('clinical360.dialogs.context_forms.options.readiness.eager')],
        ['Acceptance', this.$t('clinical360.dialogs.context_forms.options.readiness.acceptance')],
        ['Needs support', this.$t('clinical360.dialogs.context_forms.options.readiness.needs_support')],
        ['Refuses', this.$t('clinical360.dialogs.context_forms.options.readiness.refuses')]
      ].map(([value, text]) => ({ value, text }))
    },
    responseOptions() {
      return [
        ['Verbalizes Understanding', this.$t('clinical360.dialogs.context_forms.options.response.verbalizes_understanding')],
        ['Demonstrated Understanding', this.$t('clinical360.dialogs.context_forms.options.response.demonstrated_understanding')],
        ['Needs Reinforcement', this.$t('clinical360.dialogs.context_forms.options.response.needs_reinforcement')],
        ['Refused Teaching', this.$t('clinical360.dialogs.context_forms.options.response.refused_teaching')]
      ].map(([value, text]) => ({ value, text }))
    }
  },
  methods: {
    open(kind, options = {}) {
      if (!Object.prototype.hasOwnProperty.call(this.dialogs, kind)) return false
      if (this.readOnly) {
        this.$emit('error', this.$t('clinical360.dialogs.context_forms.discharged_read_only'))
        return false
      }
      if (!this.canOpen(kind)) {
        this.$emit('error', this.$t('clinical360.dialogs.context_forms.role_not_authorized'))
        return false
      }
      this.forms = freshForms()
      this.selectedCareTeamStaff = null
      this.selectedTaskTemplate = null
      if (kind === 'careTeam') {
        const directory = this.$store.getters['facility/getAllStaff'] || []
        const activeSummary = this.$store.getters['facility/getActiveStaff'] || []
        if (!directory.length && !activeSummary.length) {
          this.$store.dispatch('facility/fetchActiveStaffSummary').catch(() => {})
        }
      }
      if (kind === 'task') this.forms.task.dueAt = this.toLocalDateTime(new Date(Date.now() + 60 * 60 * 1000))
      if (kind === 'safety') {
        this.forms.safety.type = options.type || 'allergies'
        this.forms.safety.allergies = this.patient.allergies || ''
        this.forms.safety.precautions = this.patient.precautions || ''
        this.forms.safety.infectionStatus = this.patient.infectionStatus || ''
      }
      if (kind === 'labResult') {
        this.forms.labResult.orderId = options.orderId || this.labOrderOptions[0]?.value || ''
        const order = this.labOrders.find(item => item.id === this.forms.labResult.orderId) || {}
        this.forms.labResult.specimen = order.specimen || order.specimenType || ''
        this.forms.labResult.collectedAt = this.toLocalDateTime(order.collectedAt || new Date())
        this.forms.labResult.collectedBy = order.collectedBy || this.$store.state.auth?.fullName || ''
        this.forms.labResult.collectionStatus = order.collectionStatus || 'Collected'
        this.forms.labResult.communicationAt = this.toLocalDateTime(new Date())
      }
      if (kind === 'imagingResult') this.forms.imagingResult.orderId = options.orderId || this.imagingOrderOptions[0]?.value || ''
      if (kind === 'education') this.forms.education.topic = options.topic || ''
      this.$set(this.dialogs, kind, true)
      return true
    },
    close(kind) { this.$set(this.dialogs, kind, false) },
    roleLabel(role) {
      const labels = {
        ADMIN: 'Administrator', DOCTOR: 'Doctor', NP: 'Nurse practitioner', NURSE: 'Nurse', CNA: 'Care assistant',
        MIDWIFE: 'Midwife', LAB: 'Laboratory', IMAGING: 'Imaging', PHARMACY: 'Pharmacy', SOCIAL_WORKER: 'Social worker',
        PHYSIOTHERAPIST: 'Physiotherapist', MAJOR_SERVICE: 'Major service', NURSING_SUPERVISOR: 'Nursing supervisor'
      }
      return labels[role] || role || this.$t('clinical360.dialogs.context_forms.staff_member')
    },
    selectCareTeamStaff(member) {
      if (!member) return
      this.forms.careTeam.name = member.name
      this.forms.careTeam.role = member.role || this.forms.careTeam.role
      this.forms.careTeam.service = member.service || ''
      this.forms.careTeam.contact = member.contact || ''
    },
    applyTaskTemplate(template) {
      if (!template) return
      this.forms.task.title = template.label
      this.forms.task.instructions = template.instructions
      this.forms.task.frequency = template.frequency
    },
    canOpen(kind) {
      const permissions = {
        order: ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR'],
        task: ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'CNA', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR', 'LAB', 'IMAGING', 'PHARMACY', 'SOCIAL_WORKER', 'PHYSIOTHERAPIST'],
        safety: ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR'],
        labResult: ['ADMIN', 'LAB'],
        imagingResult: ['ADMIN', 'IMAGING'],
        careTeam: ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR'],
        social: ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'MIDWIFE', 'SOCIAL_WORKER'],
        education: ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'MIDWIFE', 'PHARMACY', 'SOCIAL_WORKER', 'PHYSIOTHERAPIST']
      }
      return !permissions[kind] || permissions[kind].includes(this.role)
    },
    chooseOrder(kind) { this.close('order'); this.$emit('order', kind) },
    notify(message) { this.$emit('saved', message) },
    async saveTask() {
      if (!this.forms.task.title || !this.forms.task.dueAt) return
      await this.runSave('task', async () => {
        await this.$store.dispatch('clinical/createTask', { patientId: this.patientId, encounterId: this.encounterId, relatedType: 'care-task', title: this.forms.task.title, instructions: this.forms.task.instructions, assignedToRole: this.forms.task.assignedToRole, priority: this.forms.task.priority, dueAt: new Date(this.forms.task.dueAt).toISOString(), frequency: this.forms.task.frequency, reminderMinutesBefore: this.forms.task.reminderMinutesBefore, automationSource: 'provider-created', actionReason: this.forms.task.instructions || this.$t('clinical360.dialogs.context_forms.created_from_patient_360') })
        this.notify(this.$t('clinical360.dialogs.context_forms.care_task_created'))
      })
    },
    async saveSafety() {
      const safety = this.forms.safety
      if (safety.type === 'allergies' && !String(safety.allergies || '').trim()) {
        this.$emit('error', this.$t('clinical360.dialogs.context_forms.verify_allergies'))
        return
      }
      await this.runSave('safety', async () => {
        const updates = safety.type === 'allergies'
          ? { allergies: safety.allergies.trim(), allergySeverity: safety.allergySeverity }
          : safety.type === 'precautions'
            ? {
                precautions: safety.precautions || 'Standard',
                infectionStatus: safety.infectionStatus || 'No isolation'
              }
            : { fallRisk: safety.fallRisk, mobilityAssistance: safety.assistance }
        await this.$store.dispatch('clinical/updatePatient', { patientId: this.patientId, updates })
        await this.$store.dispatch('clinical/addNursingNote', {
          patientId: this.patientId,
          recordedAt: new Date().toISOString(),
          actions: [this.$t('clinical360.dialogs.context_forms.safety_review_action', { title: this.safetyTitle })],
          observation: safety.note || this.$t('clinical360.dialogs.context_forms.safety_verified_observation', { title: this.safetyTitle }),
          response: Object.values(updates).join(' / ')
        })
        this.notify(this.$t('clinical360.dialogs.context_forms.safety_updated', { title: this.safetyTitle }))
      })
    },
    async saveLabResult() {
      const order = this.labOrders.find(item => item.id === this.forms.labResult.orderId)
      const result = this.forms.labResult
      if (!order || !result.result || !result.specimen || !result.collectedAt) return
      if (result.flag === 'Critical' && !result.criticalCommunicatedTo) {
        this.$emit('error', this.$t('clinical360.dialogs.context_forms.document_critical_recipient'))
        return
      }
      await this.runSave('labResult', async () => {
        await this.$store.dispatch('clinical/updateLabOrder', { ...order, ...result, collectedAt: new Date(result.collectedAt).toISOString(), communicationAt: result.flag === 'Critical' ? new Date(result.communicationAt).toISOString() : '', status: 'Completed', resultedAt: new Date().toISOString(), resultedByRole: this.role })
        await this.completeRelatedTask(order.id, 'Laboratory result validated')
        this.notify(this.$t('clinical360.dialogs.context_forms.lab_result_validated'))
      })
    },
    async saveImagingResult() {
      const order = this.imagingOrders.find(item => item.id === this.forms.imagingResult.orderId)
      if (!order || !this.forms.imagingResult.findings) return
      await this.runSave('imagingResult', async () => {
        await this.$store.dispatch('clinical/updateImagingOrder', { ...order, ...this.forms.imagingResult, status: 'Completed', reportedAt: new Date().toISOString(), reportedByRole: this.role })
        await this.completeRelatedTask(order.id, 'Imaging report filed')
        this.notify(this.$t('clinical360.dialogs.context_forms.imaging_report_filed'))
      })
    },
    async saveCareTeam() {
      if (!this.forms.careTeam.name) return
      await this.runSave('careTeam', async () => {
        await this.$store.dispatch('clinical/addCareTeamMember', { patientId: this.patientId, ...this.forms.careTeam })
        this.notify(this.$t('clinical360.dialogs.context_forms.care_team_member_added'))
      })
    },
    async saveSocial() {
      if (!this.forms.social.finding) return
      await this.runSave('social', async () => {
        const assessment = await this.$store.dispatch('clinical/addSocialAssessment', { patientId: this.patientId, ...this.forms.social })
        if (['At risk', 'Urgent', 'Needs review'].includes(this.forms.social.status)) {
          await this.$store.dispatch('clinical/createTask', { patientId: this.patientId, relatedType: 'social-assessment', relatedId: assessment.id, title: `${this.forms.social.domain} follow-up`, assignedToRole: 'SOCIAL_WORKER', priority: this.forms.social.status === 'Urgent' ? 'Urgent' : 'Today', dueAt: this.forms.social.followUpAt, actionReason: this.forms.social.intervention || this.forms.social.finding })
        }
        this.notify(this.$t('clinical360.dialogs.context_forms.social_assessment_filed'))
      })
    },
    async saveEducation() {
      if (!this.forms.education.topic) return
      await this.runSave('education', async () => {
        const title = await this.$store.dispatch('education/addEducationTitle', { patientId: this.patientId, encounterId: this.encounterId, admissionId: this.admissionId, title: 'Patient and family education', category: 'general' })
        const point = await this.$store.dispatch('education/addEducationPoint', { titleId: title.id, patientId: this.patientId, encounterId: this.encounterId, admissionId: this.admissionId, label: this.forms.education.topic, topic: this.forms.education.topic, description: this.forms.education.comment })
        const doc = await this.$store.dispatch('education/documentEducationPoint', { pointId: point.id, titleId: title.id, patientId: this.patientId, encounterId: this.encounterId, learners: this.forms.education.learners, readiness: this.forms.education.readiness, methods: this.forms.education.methods, responses: [this.forms.education.response], comment: this.forms.education.comment })
        if (this.forms.education.resolveAfterFile) await this.$store.dispatch('education/fileAndResolveEducationDocumentation', { documentationId: doc.id, pointId: point.id, patientId: this.patientId })
        this.notify(this.$t('clinical360.dialogs.context_forms.education_documented'))
      })
    },
    async completeRelatedTask(relatedId, reason) {
      const task = (this.$store.getters['clinical/getTasks'] || []).find(item => item.patientId === this.patientId && item.relatedId === relatedId && !['done', 'cancel'].includes(item.status))
      if (task) {
        const dueAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
        await this.$store.dispatch('clinical/completeTaskAndScheduleNext', {
          id: task.id,
          reason,
          performedAt: new Date().toISOString(),
          nextTitle: `Provider review: ${task.title || 'clinical result'}`,
          nextDueAt: dueAt,
          nextFrequency: 'Once',
          nextAssignedToRole: 'DOCTOR',
          nextInstructions: `Review the completed result and document the clinical response. Source: ${relatedId}`,
          reminderMinutesBefore: 15
        })
      }
    },
    toLocalDateTime(value) {
      const date = value instanceof Date ? value : new Date(value)
      if (Number.isNaN(date.getTime())) return ''
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      return local.toISOString().slice(0, 16)
    },
    async runSave(kind, operation) {
      this.saving = true
      try { await operation(); this.close(kind) } catch (error) { this.$emit('error', this.$t('clinical360.dialogs.context_forms.save_error')) } finally { this.saving = false }
    }
  }
}
</script>

<style scoped>
.form-title { display: flex; align-items: flex-start; justify-content: space-between; background: #0f766e; color: #fff; }
.form-title.safety { background: #991b1b; }
.form-title.diagnostic { background: #075985; }
.form-title.imaging { background: #6d28d9; }
.form-title.team { background: #134e4a; }
.form-title.social { background: #9f1239; }
.form-title.education { background: #166534; }
.critical-result-fields { margin-top: 10px; padding: 10px; border-left: 3px solid #be123c; background: #fff1f2; }
.critical-result-fields > strong { display: block; margin-bottom: 10px; color: #9f1239; font-size: 11px; text-transform: uppercase; }
.form-title span { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; }
.form-title strong { display: block; font-size: 16px; }
.form-grid { display: grid; gap: 10px; }
.form-grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.order-choice-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; padding-top: 18px !important; }
.order-choice-grid button { display: flex; min-height: 126px; flex-direction: column; align-items: flex-start; gap: 7px; padding: 14px; border: 1px solid #cbd5e1; background: #fff; color: #0f172a; cursor: pointer; text-align: left; }
.order-choice-grid button:hover { border-color: #0f766e; background: #f0fdfa; }
.order-choice-grid span { color: #64748b; font-size: 11px; }
.staff-option { display: flex; min-width: 0; flex-direction: column; padding: 2px 0; }
.staff-option strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.staff-option small { color: #64748b; font-size: 10px; }
.task-template-option { display: flex; min-width: 0; flex-direction: column; padding: 2px 0; }
.task-template-option strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.task-template-option small { color: #64748b; font-size: 10px; }
@media (max-width: 700px) { .form-grid.two, .order-choice-grid { grid-template-columns: 1fr; } }
</style>
