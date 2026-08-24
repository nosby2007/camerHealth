<template>
  <div>
    <v-dialog v-model="dialogs.order" max-width="620" persistent>
      <v-card>
        <v-card-title class="form-title">
          <div><span>Patient 360</span><strong>Choose an order form</strong></div>
          <v-btn icon small @click="close('order')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text class="order-choice-grid">
          <button type="button" @click="chooseOrder('lab')"><v-icon color="#0369a1">mdi-flask</v-icon><strong>Laboratory</strong><span>Test, priority and specimen instructions</span></button>
          <button type="button" @click="chooseOrder('imaging')"><v-icon color="#7c3aed">mdi-radiology-box</v-icon><strong>Imaging</strong><span>Exam, priority and clinical indication</span></button>
          <button type="button" @click="chooseOrder('medication')"><v-icon color="#0f766e">mdi-pill-plus</v-icon><strong>Medication</strong><span>Drug, dose, route and frequency</span></button>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.task" max-width="680" persistent scrollable>
      <v-card>
        <v-card-title class="form-title">
          <div><span>Care workload</span><strong>Create a patient task</strong></div>
          <v-btn icon small @click="close('task')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="forms.task.title" label="Task / care to perform" dense outlined :rules="[requiredRule]" />
          <div class="form-grid two">
            <v-select v-model="forms.task.assignedToRole" :items="careRoles" label="Responsible role" dense outlined />
            <v-select v-model="forms.task.priority" :items="priorities" label="Priority" dense outlined />
            <v-text-field v-model="forms.task.dueAt" label="Due date and time" type="datetime-local" dense outlined />
            <v-select v-model="forms.task.frequency" :items="frequencies" label="Frequency" dense outlined />
          </div>
          <v-textarea v-model="forms.task.instructions" label="Instructions and expected result" rows="3" dense outlined />
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn text small @click="close('task')">Cancel</v-btn><v-btn depressed dark color="#0f766e" small :loading="saving" @click="saveTask">Create task</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.safety" max-width="720" persistent scrollable>
      <v-card>
        <v-card-title class="form-title safety">
          <div><span>Safety watch</span><strong>{{ safetyTitle }}</strong></div>
          <v-btn icon small @click="close('safety')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-select v-model="forms.safety.type" :items="safetyTypes" item-text="label" item-value="value" label="Safety domain" dense outlined />
          <template v-if="forms.safety.type === 'allergies'">
            <v-textarea v-model="forms.safety.allergies" label="Allergies / intolerances" rows="3" dense outlined hint="Use No known allergies only after verification." persistent-hint />
            <v-select v-model="forms.safety.allergySeverity" :items="['Not applicable', 'Mild', 'Moderate', 'Severe', 'Anaphylaxis risk']" label="Highest severity" dense outlined />
          </template>
          <template v-else-if="forms.safety.type === 'precautions'">
            <v-textarea v-model="forms.safety.precautions" label="Clinical precautions" rows="3" dense outlined />
            <v-text-field v-model="forms.safety.infectionStatus" label="Isolation / infection status" dense outlined />
          </template>
          <template v-else>
            <v-select v-model="forms.safety.fallRisk" :items="['Low', 'Moderate', 'High', 'Very high']" label="Fall risk" dense outlined />
            <v-select v-model="forms.safety.assistance" :items="['Independent', 'Supervision', 'Assist x1', 'Assist x2', 'Bedbound']" label="Mobility assistance" dense outlined />
          </template>
          <v-textarea v-model="forms.safety.note" label="Assessment, intervention and communication" rows="3" dense outlined />
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn text small @click="close('safety')">Cancel</v-btn><v-btn depressed dark color="#be123c" small :loading="saving" @click="saveSafety">Update safety watch</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.labResult" max-width="760" persistent scrollable>
      <v-card>
        <v-card-title class="form-title diagnostic">
          <div><span>Laboratory</span><strong>Record and validate result</strong></div>
          <v-btn icon small @click="close('labResult')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-select v-model="forms.labResult.orderId" :items="labOrderOptions" item-text="text" item-value="value" label="Laboratory order" dense outlined :rules="[requiredRule]" />
          <div class="form-grid two">
            <v-text-field v-model="forms.labResult.specimen" label="Specimen / sample" dense outlined :rules="[requiredRule]" />
            <v-text-field v-model="forms.labResult.collectedAt" label="Collected date and time" type="datetime-local" dense outlined :rules="[requiredRule]" />
            <v-text-field v-model="forms.labResult.collectedBy" label="Collected by" dense outlined />
            <v-select v-model="forms.labResult.collectionStatus" :items="['Collected', 'Received in laboratory', 'Rejected / recollect']" label="Specimen status" dense outlined />
          </div>
          <div class="form-grid two">
            <v-text-field v-model="forms.labResult.result" label="Result" dense outlined :rules="[requiredRule]" />
            <v-text-field v-model="forms.labResult.unit" label="Unit" dense outlined />
            <v-text-field v-model="forms.labResult.referenceRange" label="Reference range" dense outlined />
            <v-select v-model="forms.labResult.flag" :items="['Normal', 'Low', 'High', 'Critical']" label="Flag" dense outlined />
          </div>
          <v-textarea v-model="forms.labResult.comment" label="Laboratory comment / critical result communication" rows="3" dense outlined />
          <div v-if="forms.labResult.flag === 'Critical'" class="critical-result-fields">
            <strong>Critical result communication</strong>
            <div class="form-grid two">
              <v-text-field v-model="forms.labResult.criticalCommunicatedTo" label="Communicated to" dense outlined :rules="[requiredRule]" />
              <v-text-field v-model="forms.labResult.communicationAt" label="Communication date and time" type="datetime-local" dense outlined :rules="[requiredRule]" />
            </div>
          </div>
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn text small @click="close('labResult')">Cancel</v-btn><v-btn depressed dark color="#0369a1" small :loading="saving" @click="saveLabResult">Validate result</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.imagingResult" max-width="780" persistent scrollable>
      <v-card>
        <v-card-title class="form-title imaging">
          <div><span>Imaging</span><strong>File imaging report</strong></div>
          <v-btn icon small @click="close('imagingResult')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-select v-model="forms.imagingResult.orderId" :items="imagingOrderOptions" item-text="text" item-value="value" label="Imaging order" dense outlined :rules="[requiredRule]" />
          <v-textarea v-model="forms.imagingResult.findings" label="Findings" rows="4" dense outlined :rules="[requiredRule]" />
          <v-textarea v-model="forms.imagingResult.impression" label="Impression / conclusion" rows="3" dense outlined />
          <div class="form-grid two">
            <v-select v-model="forms.imagingResult.urgency" :items="['Routine', 'Important', 'Urgent', 'Critical']" label="Communication priority" dense outlined />
            <v-text-field v-model="forms.imagingResult.recommendation" label="Recommendation / follow-up" dense outlined />
          </div>
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn text small @click="close('imagingResult')">Cancel</v-btn><v-btn depressed dark color="#7c3aed" small :loading="saving" @click="saveImagingResult">File report</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.careTeam" max-width="720" persistent scrollable>
      <v-card>
        <v-card-title class="form-title team">
          <div><span>Care coordination</span><strong>Add care-team member</strong></div>
          <v-btn icon small @click="close('careTeam')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <div class="form-grid two">
            <v-text-field v-model="forms.careTeam.name" label="Staff member" dense outlined :rules="[requiredRule]" />
            <v-select v-model="forms.careTeam.role" :items="careRoles" label="Role / discipline" dense outlined />
            <v-text-field v-model="forms.careTeam.service" label="Service / department" dense outlined />
            <v-text-field v-model="forms.careTeam.contact" label="Phone / extension" dense outlined />
            <v-select v-model="forms.careTeam.responsibility" :items="['Attending', 'Consulting', 'Bedside care', 'Diagnostics', 'Medication', 'Discharge coordination']" label="Responsibility" dense outlined />
            <v-select v-model="forms.careTeam.status" :items="['Active', 'On call', 'Consult requested', 'Completed']" label="Status" dense outlined />
          </div>
          <v-textarea v-model="forms.careTeam.note" label="Coordination note" rows="2" dense outlined />
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn text small @click="close('careTeam')">Cancel</v-btn><v-btn depressed dark color="#0f766e" small :loading="saving" @click="saveCareTeam">Add member</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.social" max-width="760" persistent scrollable>
      <v-card>
        <v-card-title class="form-title social">
          <div><span>Health-related social needs</span><strong>Document barrier and intervention</strong></div>
          <v-btn icon small @click="close('social')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <div class="form-grid two">
            <v-select v-model="forms.social.domain" :items="socialDomains" label="Domain" dense outlined />
            <v-select v-model="forms.social.status" :items="['No need', 'Needs review', 'At risk', 'Urgent']" label="Status" dense outlined />
          </div>
          <v-textarea v-model="forms.social.finding" label="Screening finding" rows="3" dense outlined :rules="[requiredRule]" />
          <v-textarea v-model="forms.social.intervention" label="Referral, family plan or community resource" rows="3" dense outlined />
          <div class="form-grid two">
            <v-text-field v-model="forms.social.owner" label="Follow-up owner" dense outlined />
            <v-text-field v-model="forms.social.followUpAt" label="Follow-up date" type="date" dense outlined />
          </div>
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn text small @click="close('social')">Cancel</v-btn><v-btn depressed dark color="#be123c" small :loading="saving" @click="saveSocial">File social assessment</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.education" max-width="760" persistent scrollable>
      <v-card>
        <v-card-title class="form-title education">
          <div><span>Patient and family education</span><strong>Document teaching and teach-back</strong></div>
          <v-btn icon small @click="close('education')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="forms.education.topic" label="Teaching topic" dense outlined :rules="[requiredRule]" />
          <div class="form-grid two">
            <v-select v-model="forms.education.learners" :items="['Patient', 'Family/Caregiver', 'Caregiver', 'Other']" label="Learners" multiple chips small-chips dense outlined />
            <v-select v-model="forms.education.methods" :items="['Explanation', 'Demonstration', 'Written material', 'Interpreter', 'Teach-back']" label="Method" multiple chips small-chips dense outlined />
            <v-select v-model="forms.education.readiness" :items="['Eager', 'Acceptance', 'Needs support', 'Refuses']" label="Readiness" dense outlined />
            <v-select v-model="forms.education.response" :items="['Verbalizes Understanding', 'Demonstrated Understanding', 'Needs Reinforcement', 'Refused Teaching']" label="Response" dense outlined />
          </div>
          <v-textarea v-model="forms.education.comment" label="Teaching content, language and family participation" rows="3" dense outlined />
          <v-switch v-model="forms.education.resolveAfterFile" color="#0f766e" inset dense label="Teaching completed; resolve this point" />
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn text small @click="close('education')">Cancel</v-btn><v-btn depressed dark color="#0f766e" small :loading="saving" @click="saveEducation">File education</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
const freshForms = () => ({
  task: { title: '', assignedToRole: 'NURSE', priority: 'Today', dueAt: '', frequency: 'Once', instructions: '' },
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
      dialogs: { order: false, task: false, safety: false, labResult: false, imagingResult: false, careTeam: false, social: false, education: false },
      forms: freshForms(),
      requiredRule: value => Boolean(value) || 'Required',
      priorities: ['Routine', 'Today', 'Urgent', 'STAT'],
      frequencies: ['Once', 'Each shift', 'Daily', 'Every 4 hours', 'Every 8 hours', 'PRN'],
      careRoles: ['NURSE', 'DOCTOR', 'NP', 'CNA', 'MIDWIFE', 'LAB', 'IMAGING', 'PHARMACY', 'SOCIAL_WORKER', 'PHYSIOTHERAPIST', 'MAJOR_SERVICE'],
      socialDomains: ['Food security', 'Transportation', 'Financial strain', 'Housing', 'Utilities', 'Stress', 'Safety', 'Family support'],
      safetyTypes: [
        { label: 'Allergies', value: 'allergies' },
        { label: 'Precautions / isolation', value: 'precautions' },
        { label: 'Fall and mobility risk', value: 'fall' }
      ]
    }
  },
  computed: {
    labOrderOptions() {
      return this.labOrders.map(order => ({ text: `${order.test || order.testName || 'Lab test'} · ${order.status || 'Requested'}`, value: order.id }))
    },
    imagingOrderOptions() {
      return this.imagingOrders.map(order => ({ text: `${order.exam || order.modality || 'Imaging exam'} · ${order.status || 'Requested'}`, value: order.id }))
    },
    safetyTitle() {
      return this.safetyTypes.find(item => item.value === this.forms.safety.type)?.label || 'Safety assessment'
    }
  },
  methods: {
    open(kind, options = {}) {
      if (!Object.prototype.hasOwnProperty.call(this.dialogs, kind)) return false
      if (this.readOnly) {
        this.$emit('error', 'This patient has been discharged. The Patient 360 chart is read only.')
        return false
      }
      if (!this.canOpen(kind)) {
        this.$emit('error', 'Your role is not authorized to use this Patient 360 form.')
        return false
      }
      this.forms = freshForms()
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
      if (!this.forms.task.title) return
      await this.runSave('task', async () => {
        await this.$store.dispatch('clinical/createTask', { patientId: this.patientId, relatedType: 'care-task', title: this.forms.task.title, assignedToRole: this.forms.task.assignedToRole, priority: this.forms.task.priority, dueAt: this.forms.task.dueAt, frequency: this.forms.task.frequency, actionReason: this.forms.task.instructions || 'Created from Patient 360' })
        this.notify('Care task created.')
      })
    },
    async saveSafety() {
      const safety = this.forms.safety
      if (safety.type === 'allergies' && !String(safety.allergies || '').trim()) {
        this.$emit('error', 'Verify and enter allergies or explicitly enter No known allergies.')
        return
      }
      await this.runSave('safety', async () => {
        const updates = safety.type === 'allergies'
          ? { allergies: safety.allergies.trim(), allergySeverity: safety.allergySeverity }
          : safety.type === 'precautions'
            ? { precautions: safety.precautions || 'Standard', infectionStatus: safety.infectionStatus || 'No isolation' }
            : { fallRisk: safety.fallRisk, mobilityAssistance: safety.assistance }
        await this.$store.dispatch('clinical/updatePatient', { patientId: this.patientId, updates })
        await this.$store.dispatch('clinical/addNursingNote', { patientId: this.patientId, recordedAt: new Date().toISOString(), actions: [`Safety review: ${this.safetyTitle}`], observation: safety.note || `${this.safetyTitle} verified.`, response: Object.values(updates).join(' / ') })
        this.notify(`${this.safetyTitle} updated.`)
      })
    },
    async saveLabResult() {
      const order = this.labOrders.find(item => item.id === this.forms.labResult.orderId)
      const result = this.forms.labResult
      if (!order || !result.result || !result.specimen || !result.collectedAt) return
      if (result.flag === 'Critical' && !result.criticalCommunicatedTo) {
        this.$emit('error', 'Document who received the critical laboratory result.')
        return
      }
      await this.runSave('labResult', async () => {
        await this.$store.dispatch('clinical/updateLabOrder', { ...order, ...result, collectedAt: new Date(result.collectedAt).toISOString(), communicationAt: result.flag === 'Critical' ? new Date(result.communicationAt).toISOString() : '', status: 'Completed', resultedAt: new Date().toISOString(), resultedByRole: this.role })
        await this.completeRelatedTask(order.id, 'Laboratory result validated')
        this.notify('Laboratory result validated.')
      })
    },
    async saveImagingResult() {
      const order = this.imagingOrders.find(item => item.id === this.forms.imagingResult.orderId)
      if (!order || !this.forms.imagingResult.findings) return
      await this.runSave('imagingResult', async () => {
        await this.$store.dispatch('clinical/updateImagingOrder', { ...order, ...this.forms.imagingResult, status: 'Completed', reportedAt: new Date().toISOString(), reportedByRole: this.role })
        await this.completeRelatedTask(order.id, 'Imaging report filed')
        this.notify('Imaging report filed.')
      })
    },
    async saveCareTeam() {
      if (!this.forms.careTeam.name) return
      await this.runSave('careTeam', async () => {
        await this.$store.dispatch('clinical/addCareTeamMember', { patientId: this.patientId, ...this.forms.careTeam })
        this.notify('Care-team member added.')
      })
    },
    async saveSocial() {
      if (!this.forms.social.finding) return
      await this.runSave('social', async () => {
        const assessment = await this.$store.dispatch('clinical/addSocialAssessment', { patientId: this.patientId, ...this.forms.social })
        if (['At risk', 'Urgent', 'Needs review'].includes(this.forms.social.status)) {
          await this.$store.dispatch('clinical/createTask', { patientId: this.patientId, relatedType: 'social-assessment', relatedId: assessment.id, title: `${this.forms.social.domain} follow-up`, assignedToRole: 'SOCIAL_WORKER', priority: this.forms.social.status === 'Urgent' ? 'Urgent' : 'Today', dueAt: this.forms.social.followUpAt, actionReason: this.forms.social.intervention || this.forms.social.finding })
        }
        this.notify('Social-needs assessment filed.')
      })
    },
    async saveEducation() {
      if (!this.forms.education.topic) return
      await this.runSave('education', async () => {
        const title = await this.$store.dispatch('education/addEducationTitle', { patientId: this.patientId, encounterId: this.encounterId, admissionId: this.admissionId, title: 'Patient and family education', category: 'general' })
        const point = await this.$store.dispatch('education/addEducationPoint', { titleId: title.id, patientId: this.patientId, encounterId: this.encounterId, admissionId: this.admissionId, label: this.forms.education.topic, topic: this.forms.education.topic, description: this.forms.education.comment })
        const doc = await this.$store.dispatch('education/documentEducationPoint', { pointId: point.id, titleId: title.id, patientId: this.patientId, encounterId: this.encounterId, learners: this.forms.education.learners, readiness: this.forms.education.readiness, methods: this.forms.education.methods, responses: [this.forms.education.response], comment: this.forms.education.comment })
        if (this.forms.education.resolveAfterFile) await this.$store.dispatch('education/fileAndResolveEducationDocumentation', { documentationId: doc.id, pointId: point.id, patientId: this.patientId })
        this.notify('Patient education documented.')
      })
    },
    async completeRelatedTask(relatedId, reason) {
      const task = (this.$store.getters['clinical/getTasks'] || []).find(item => item.patientId === this.patientId && item.relatedId === relatedId && !['done', 'cancel'].includes(item.status))
      if (task) await this.$store.dispatch('clinical/updateTaskStatus', { id: task.id, status: 'done', reason })
    },
    toLocalDateTime(value) {
      const date = value instanceof Date ? value : new Date(value)
      if (Number.isNaN(date.getTime())) return ''
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      return local.toISOString().slice(0, 16)
    },
    async runSave(kind, operation) {
      this.saving = true
      try { await operation(); this.close(kind) } catch (error) { this.$emit('error', 'Unable to save this Patient 360 form.') } finally { this.saving = false }
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
@media (max-width: 700px) { .form-grid.two, .order-choice-grid { grid-template-columns: 1fr; } }
</style>
