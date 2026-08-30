<template>
  <section class="coordination-workspace">
    <header class="module-header">
      <div>
        <span>{{ copy.eyebrow }}</span>
        <h2>{{ copy.title }}</h2>
        <p>{{ copy.subtitle }}</p>
      </div>
      <div class="header-actions">
        <v-btn x-small text color="#0f766e" @click="$emit('open-tab', 'Care Teams')">
          <v-icon x-small left>mdi-account-group-outline</v-icon>{{ copy.careTeam }}
        </v-btn>
        <v-btn x-small text color="#0f766e" :disabled="readOnly" @click="openNote">
          <v-icon x-small left>mdi-note-edit-outline</v-icon>{{ copy.note }}
        </v-btn>
        <v-btn x-small text color="#0f766e" :disabled="readOnly" @click="openAssignment">
          <v-icon x-small left>mdi-clipboard-account-outline</v-icon>{{ copy.assignment }}
        </v-btn>
        <v-btn x-small depressed color="#0f766e" dark :disabled="readOnly" @click="openMeeting">
          <v-icon x-small left>mdi-account-voice</v-icon>{{ copy.conference }}
        </v-btn>
      </div>
    </header>

    <div v-if="readOnly" class="read-only">
      <v-icon x-small>mdi-lock-outline</v-icon> {{ copy.readOnly }}
    </div>

    <div class="metric-strip">
      <article v-for="metric in metrics" :key="metric.label" :class="metric.state">
        <v-icon small :color="metric.color">{{ metric.icon }}</v-icon>
        <div><span>{{ metric.label }}</span><strong>{{ metric.value }}</strong><small>{{ metric.detail }}</small></div>
      </article>
    </div>

    <div class="coordination-layout">
      <main>
        <section class="work-section">
          <header><div><span>{{ copy.workQueue }}</span><strong>{{ copy.workQueueTitle }}</strong></div><button type="button" @click="$emit('open-tab', 'Work List')">{{ copy.viewAll }}</button></header>
          <div class="work-head"><span>{{ copy.item }}</span><span>{{ copy.owner }}</span><span>{{ copy.due }}</span><span>{{ copy.status }}</span></div>
          <div v-for="task in scopedTasks.slice(0, 7)" :key="task.id" class="work-row">
            <div><strong>{{ task.title }}</strong><small>{{ task.actionReason || task.instructions || copy.noDetail }}</small></div>
            <span>{{ task.assignedToRole || task.assignedRole || copy.team }}</span>
            <span>{{ formatDate(task.dueAt) }}</span>
            <b :class="taskState(task)">{{ task.status || 'pending' }}</b>
          </div>
          <div v-if="!scopedTasks.length" class="empty-state"><v-icon>mdi-clipboard-check-outline</v-icon><span>{{ copy.noTasks }}</span></div>
        </section>

        <section class="work-section meeting-section">
          <header><div><span>{{ copy.governance }}</span><strong>{{ copy.meetingsTitle }}</strong></div><button type="button" :disabled="readOnly" @click="openMeeting">{{ copy.add }}</button></header>
          <article v-for="record in meetingRecords.slice(0, 5)" :key="record.id" class="meeting-row">
            <v-icon small color="#0f766e">mdi-account-group-outline</v-icon>
            <div><strong>{{ record.title }}</strong><small>{{ record.createdBy || copy.team }} · {{ formatDate(record.createdAt) }}</small></div>
            <span>{{ record.category || copy.conference }}</span>
          </article>
          <div v-if="!meetingRecords.length" class="empty-state"><v-icon>mdi-calendar-blank-outline</v-icon><span>{{ copy.noMeetings }}</span></div>
        </section>
      </main>

      <aside>
        <section class="staff-section">
          <header><span>{{ copy.coverage }}</span><strong>{{ copy.staffTitle }}</strong></header>
          <div v-for="member in scopedStaff.slice(0, 9)" :key="member.id" class="staff-row">
            <span class="staff-avatar">{{ initials(member.fullName) }}</span>
            <div><strong>{{ member.fullName }}</strong><small>{{ roleLabel(member.role) }}</small></div>
            <span>{{ member.service || member.department || copy.available }}</span>
          </div>
          <div v-if="!scopedStaff.length" class="empty-state compact"><span>{{ copy.noStaff }}</span></div>
        </section>

        <section class="team-section">
          <header><span>{{ copy.interdisciplinary }}</span><strong>{{ copy.patientTeam }}</strong></header>
          <div v-for="member in members.slice(0, 6)" :key="member.label" class="team-row">
            <strong>{{ member.label }}</strong><span>{{ member.values && member.values.Role }}</span>
          </div>
          <button type="button" @click="$emit('open-tab', 'Care Teams')">{{ copy.openCareTeam }}</button>
        </section>
      </aside>
    </div>

    <v-dialog v-model="dialogs.note" max-width="660" persistent>
      <v-card tile>
        <v-card-title class="dialog-title"><v-icon left color="#0f766e">mdi-note-edit-outline</v-icon>{{ copy.noteDialog }}</v-card-title>
        <v-card-text class="pt-5">
          <v-text-field v-model.trim="noteForm.title" :label="copy.noteTitle" dense outlined />
          <v-textarea v-model.trim="noteForm.body" :label="copy.noteBody" rows="6" dense outlined />
          <div class="dialog-grid">
            <v-select v-model="noteForm.status" :items="noteStatuses" :label="copy.noteStatus" dense outlined />
            <v-checkbox v-model="noteForm.share" :disabled="noteForm.status !== 'signed'" :label="copy.shareTeam" dense />
          </div>
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn text @click="dialogs.note=false">{{ copy.cancel }}</v-btn><v-btn depressed color="#0f766e" dark :loading="saving" :disabled="readOnly || !noteForm.title || !noteForm.body" @click="saveNote">{{ copy.save }}</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.meeting" max-width="720" persistent>
      <v-card tile>
        <v-card-title class="dialog-title"><v-icon left color="#0f766e">mdi-account-voice</v-icon>{{ copy.meetingDialog }}</v-card-title>
        <v-card-text class="pt-5">
          <div class="dialog-grid">
            <v-select v-model="meetingForm.type" :items="meetingTypes" :label="copy.meetingType" dense outlined />
            <v-text-field v-model="meetingForm.scheduledAt" type="datetime-local" :label="copy.date" dense outlined />
          </div>
          <v-text-field v-model.trim="meetingForm.attendees" :label="copy.attendees" dense outlined />
          <v-textarea v-model.trim="meetingForm.agenda" :label="copy.agenda" rows="2" dense outlined />
          <v-textarea v-model.trim="meetingForm.decisions" :label="copy.decisions" rows="3" dense outlined />
          <v-text-field v-model.trim="meetingForm.followUp" :label="copy.followUp" dense outlined />
          <div v-if="meetingForm.followUp" class="dialog-grid">
            <v-select v-model="meetingForm.assignedRole" :items="assignmentRoles" item-text="text" item-value="value" :label="copy.owner" dense outlined />
            <v-text-field v-model="meetingForm.dueAt" type="datetime-local" :label="copy.due" dense outlined />
          </div>
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn text @click="dialogs.meeting=false">{{ copy.cancel }}</v-btn><v-btn depressed color="#0f766e" dark :loading="saving" :disabled="readOnly || !meetingForm.type || !meetingForm.decisions" @click="saveMeeting">{{ copy.fileMinutes }}</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.assignment" max-width="620" persistent>
      <v-card tile>
        <v-card-title class="dialog-title"><v-icon left color="#0f766e">mdi-clipboard-account-outline</v-icon>{{ copy.assignmentDialog }}</v-card-title>
        <v-card-text class="pt-5">
          <v-text-field v-model.trim="assignmentForm.title" :label="copy.taskTitle" dense outlined />
          <div class="dialog-grid">
            <v-select v-model="assignmentForm.assignedRole" :items="assignmentRoles" item-text="text" item-value="value" :label="copy.owner" dense outlined />
            <v-select v-model="assignmentForm.priority" :items="priorities" :label="copy.priority" dense outlined />
          </div>
          <v-text-field v-model="assignmentForm.dueAt" type="datetime-local" :label="copy.due" dense outlined />
          <v-textarea v-model.trim="assignmentForm.reason" :label="copy.instructions" rows="3" dense outlined />
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn text @click="dialogs.assignment=false">{{ copy.cancel }}</v-btn><v-btn depressed color="#0f766e" dark :loading="saving" :disabled="readOnly || !assignmentForm.title || !assignmentForm.assignedRole" @click="saveAssignment">{{ copy.assign }}</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
  </section>
</template>

<script>
const ROLE_LABELS = {
  DOCTOR: 'Doctor', NP: 'Nurse Practitioner', NURSE: 'Nurse', CNA: 'Care Assistant', MIDWIFE: 'Midwife',
  MAJOR_SERVICE: 'Major de service', NURSING_SUPERVISOR: 'Nursing Supervisor', LAB: 'Laboratory',
  IMAGING: 'Imaging', PHARMACY: 'Pharmacy', SOCIAL_WORKER: 'Social Worker', PHYSIOTHERAPIST: 'Physiotherapy'
}

export default {
  name: 'Patient360RoleCoordinationTab',
  props: {
    patientId: { type: String, required: true },
    patient: { type: Object, default: () => ({}) },
    role: { type: String, required: true },
    workspaceTab: { type: String, default: '' },
    tasks: { type: Array, default: () => [] },
    documents: { type: Array, default: () => [] },
    members: { type: Array, default: () => [] },
    readOnly: { type: Boolean, default: false }
  },
  data: () => ({
    saving: false,
    dialogs: { note: false, meeting: false, assignment: false },
    noteForm: { title: '', body: '', status: 'draft', share: false },
    meetingForm: { type: 'IDT Conference', scheduledAt: '', attendees: '', agenda: '', decisions: '', followUp: '', assignedRole: 'NURSE', dueAt: '' },
    assignmentForm: { title: '', assignedRole: 'NURSE', priority: 'Today', dueAt: '', reason: '' },
    priorities: ['Routine', 'Today', 'Urgent', 'STAT'],
    noteStatuses: [{ text: 'Draft / Brouillon', value: 'draft' }, { text: 'Sign now / Signer', value: 'signed' }],
    assignmentRoles: Object.keys(ROLE_LABELS).map(value => ({ value, text: ROLE_LABELS[value] }))
  }),
  created() {
    if (!this.activeStaff.length) this.$store.dispatch('facility/fetchActiveStaffSummary')
  },
  computed: {
    isFrench() { return this.$i18n && this.$i18n.locale === 'fr' },
    mode() {
      if (this.workspaceTab === 'Social Services') return 'social'
      if (this.workspaceTab === 'Unit Management') return 'unit'
      if (this.workspaceTab === 'Nursing Supervision') return 'supervision'
      return this.role === 'SOCIAL_WORKER' ? 'social' : this.role === 'MAJOR_SERVICE' ? 'unit' : 'supervision'
    },
    copy() {
      const fr = {
        social: { eyebrow: 'CONTINUITE ET ACCOMPAGNEMENT', title: 'Service social', subtitle: 'Evaluation sociale, obstacles a la sortie, ressources et coordination familiale.' },
        unit: { eyebrow: 'PILOTAGE OPERATIONNEL', title: 'Pilotage du service', subtitle: 'Couverture du personnel, charge de travail, securite et coordination du service.' },
        supervision: { eyebrow: 'GOUVERNANCE DES SOINS', title: 'Supervision infirmiere', subtitle: 'Surveillance transversale des services, qualite, effectifs et escalades cliniques.' },
        careTeam: 'Equipe de soins', note: 'Rediger une note', assignment: 'Affecter', conference: 'Conference', readOnly: 'Patient sorti : cet espace est en lecture seule.', workQueue: 'TRAVAIL ACTIF', workQueueTitle: 'Actions et suivis', viewAll: 'Voir la liste', item: 'Element', owner: 'Responsable', due: 'Echeance', status: 'Statut', noDetail: 'Aucun detail', team: 'Equipe', noTasks: 'Aucune action ouverte dans ce perimetre.', governance: 'COORDINATION', meetingsTitle: 'IDT, qualite et reunions cliniques', add: 'Ajouter', noMeetings: 'Aucun compte rendu de reunion pour ce patient.', coverage: 'COUVERTURE', staffTitle: 'Personnel disponible', available: 'Disponible', noStaff: 'Aucun membre actif trouve.', interdisciplinary: 'INTERDISCIPLINAIRE', patientTeam: 'Equipe du patient', openCareTeam: 'Ouvrir toute l equipe', noteDialog: 'Nouvelle note professionnelle', noteTitle: 'Titre de la note', noteBody: 'Evaluation, constat et plan', noteStatus: 'Statut', shareTeam: 'Partager avec l equipe de soins', meetingDialog: 'Conference et compte rendu', meetingType: 'Type de reunion', date: 'Date et heure', attendees: 'Participants', agenda: 'Ordre du jour', decisions: 'Decisions et recommandations', followUp: 'Action de suivi', priority: 'Priorite', instructions: 'Instructions / justification', fileMinutes: 'Classer le compte rendu', assignmentDialog: 'Nouvelle affectation', taskTitle: 'Tache ou intervention', assign: 'Affecter', cancel: 'Annuler', save: 'Enregistrer', saveError: 'Enregistrement impossible. Verifiez vos droits et le statut du patient.' }
      const en = {
        social: { eyebrow: 'CONTINUITY AND SUPPORT', title: 'Social Services', subtitle: 'Social assessment, discharge barriers, resources and family coordination.' },
        unit: { eyebrow: 'UNIT OPERATIONS', title: 'Unit Management', subtitle: 'Staff coverage, workload, safety and service coordination.' },
        supervision: { eyebrow: 'NURSING GOVERNANCE', title: 'Nursing Supervision', subtitle: 'Cross-unit oversight, quality, staffing and clinical escalation.' },
        careTeam: 'Care team', note: 'Write note', assignment: 'Assign', conference: 'Conference', readOnly: 'Discharged patient: this workspace is read only.', workQueue: 'ACTIVE WORK', workQueueTitle: 'Actions and follow-up', viewAll: 'View work list', item: 'Item', owner: 'Owner', due: 'Due', status: 'Status', noDetail: 'No detail', team: 'Team', noTasks: 'No open action in this scope.', governance: 'COORDINATION', meetingsTitle: 'IDT, quality and clinical meetings', add: 'Add', noMeetings: 'No meeting minutes filed for this patient.', coverage: 'COVERAGE', staffTitle: 'Available staff', available: 'Available', noStaff: 'No active staff member found.', interdisciplinary: 'INTERDISCIPLINARY', patientTeam: 'Patient care team', openCareTeam: 'Open full care team', noteDialog: 'New professional note', noteTitle: 'Note title', noteBody: 'Assessment, findings and plan', noteStatus: 'Status', shareTeam: 'Share with care team', meetingDialog: 'Conference and meeting minutes', meetingType: 'Meeting type', date: 'Date and time', attendees: 'Attendees', agenda: 'Agenda', decisions: 'Decisions and recommendations', followUp: 'Follow-up action', priority: 'Priority', instructions: 'Instructions / rationale', fileMinutes: 'File meeting minutes', assignmentDialog: 'New assignment', taskTitle: 'Task or intervention', assign: 'Assign', cancel: 'Cancel', save: 'Save', saveError: 'Unable to save. Check your access and the patient chart status.' }
      const source = this.isFrench ? fr : en
      return { ...source, ...source[this.mode] }
    },
    meetingTypes() { return ['IDT Conference', 'Quality Assurance Review', 'Clinical Meeting', 'Safety Huddle', 'Discharge Planning Conference'] },
    activeStaff() { return this.$store.getters['facility/getActiveStaff'] || [] },
    scopedStaff() {
      if (this.mode === 'social') return this.activeStaff.filter(item => item.role === 'SOCIAL_WORKER')
      const nursingRoles = ['NURSE', 'CNA', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR']
      const nursingStaff = this.activeStaff.filter(item => nursingRoles.includes(item.role))
      if (this.mode === 'supervision') return nursingStaff
      const service = String(this.patient.service || this.patient.department || '').toLowerCase()
      const unitStaff = service ? nursingStaff.filter(item => `${item.service || ''} ${item.department || ''}`.toLowerCase().includes(service)) : []
      return unitStaff.length ? unitStaff : nursingStaff
    },
    scopedTasks() {
      if (this.mode === 'social') return this.tasks.filter(item => /social|family|transport|housing|financial|discharge barrier/i.test(`${item.relatedType || ''} ${item.assignedToRole || item.assignedRole || ''} ${item.title || ''}`))
      return this.tasks.filter(item => /nurse|cna|midwife|major|supervisor|care team|safety|quality|handoff/i.test(`${item.assignedToRole || item.assignedRole || ''} ${item.title || ''} ${item.relatedType || ''}`) || !item.assignedToRole)
    },
    openTasks() { return this.scopedTasks.filter(item => !/done|complete|cancel|resolved/i.test(item.status || '')).length },
    meetingRecords() { return this.documents.filter(item => /conference|meeting|quality|idt|safety huddle/i.test(`${item.category || ''} ${item.title || ''}`)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) },
    metrics() {
      const staffLabel = this.isFrench ? 'Personnel' : 'Staff coverage'
      return [
        { label: this.isFrench ? 'Actions ouvertes' : 'Open actions', value: this.openTasks, detail: this.copy.workQueueTitle, icon: 'mdi-clipboard-alert-outline', color: this.openTasks ? '#c2410c' : '#15803d', state: this.openTasks ? 'warning' : 'good' },
        { label: staffLabel, value: this.scopedStaff.length, detail: this.copy.staffTitle, icon: 'mdi-account-multiple-check-outline', color: '#0369a1', state: 'neutral' },
        { label: this.isFrench ? 'Conferences' : 'Conferences', value: this.meetingRecords.length, detail: 'IDT / QA / Clinical', icon: 'mdi-account-voice', color: '#7c3aed', state: 'neutral' },
        { label: this.isFrench ? 'Equipe patient' : 'Patient team', value: this.members.length, detail: this.copy.interdisciplinary, icon: 'mdi-account-group-outline', color: '#0f766e', state: 'neutral' }
      ]
    }
  },
  methods: {
    nowLocal() { const date = new Date(Date.now() - new Date().getTimezoneOffset() * 60000); return date.toISOString().slice(0, 16) },
    formatDate(value) { return value ? new Date(value).toLocaleString(this.isFrench ? 'fr-CM' : 'en-US', { dateStyle: 'short', timeStyle: 'short' }) : '-' },
    initials(name) { return String(name || '?').split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() },
    roleLabel(role) { return ROLE_LABELS[role] || role },
    taskState(task) { const value = String(task.status || '').toLowerCase(); return /done|complete|resolved/.test(value) ? 'good' : /urgent|missed|overdue/.test(`${value} ${task.priority || ''}`.toLowerCase()) ? 'danger' : 'warning' },
    openNote() { this.noteForm = { title: this.copy.title, body: '', status: 'draft', share: false }; this.dialogs.note = true },
    openMeeting() { this.meetingForm = { type: 'IDT Conference', scheduledAt: this.nowLocal(), attendees: '', agenda: '', decisions: '', followUp: '', assignedRole: this.mode === 'social' ? 'SOCIAL_WORKER' : 'NURSE', dueAt: '' }; this.dialogs.meeting = true },
    openAssignment() { this.assignmentForm = { title: '', assignedRole: this.mode === 'social' ? 'SOCIAL_WORKER' : 'NURSE', priority: 'Today', dueAt: '', reason: '' }; this.dialogs.assignment = true },
    async saveNote() {
      if (this.readOnly) return this.$emit('error', this.copy.readOnly)
      this.saving = true
      try {
        const note = await this.$store.dispatch('nursing/createClinicalNote', { patientId: this.patientId, noteType: `${this.mode}_coordination_note`, title: this.noteForm.title, body: this.noteForm.body })
        if (this.noteForm.status === 'signed' && note) {
          await this.$store.dispatch('nursing/signClinicalNote', note.id)
          if (this.noteForm.share) await this.$store.dispatch('nursing/shareClinicalNote', note.id)
        }
        this.dialogs.note = false
        this.$emit('saved', this.isFrench ? 'Note enregistree.' : 'Note saved.')
      } catch (error) { this.$emit('error', this.copy.saveError) } finally { this.saving = false }
    },
    async saveMeeting() {
      if (this.readOnly) return this.$emit('error', this.copy.readOnly)
      this.saving = true
      try {
        const form = this.meetingForm
        await this.$store.dispatch('clinical/createDocument', { patientId: this.patientId, title: `${form.type} - ${this.patient.fullName || this.patient.name || this.patientId}`, category: 'Care Team Conference', status: 'Filed', content: [`Scheduled: ${form.scheduledAt}`, `Attendees: ${form.attendees || '-'}`, `Agenda: ${form.agenda || '-'}`, `Decisions: ${form.decisions}`, `Follow-up: ${form.followUp || '-'}`].join('\n') })
        if (form.followUp) await this.$store.dispatch('clinical/createTask', { patientId: this.patientId, title: form.followUp, assignedToRole: form.assignedRole, priority: 'Today', dueAt: form.dueAt || null, relatedType: 'care-team-conference', actionReason: `${form.type}: ${form.decisions}` })
        this.dialogs.meeting = false
        this.$emit('saved', this.isFrench ? 'Compte rendu classe.' : 'Meeting minutes filed.')
      } catch (error) { this.$emit('error', this.copy.saveError) } finally { this.saving = false }
    },
    async saveAssignment() {
      if (this.readOnly) return this.$emit('error', this.copy.readOnly)
      this.saving = true
      try {
        const form = this.assignmentForm
        await this.$store.dispatch('clinical/createTask', { patientId: this.patientId, title: form.title, assignedToRole: form.assignedRole, priority: form.priority, dueAt: form.dueAt || null, relatedType: `${this.mode}-coordination`, actionReason: form.reason || `${this.copy.title} assignment` })
        this.dialogs.assignment = false
        this.$emit('saved', this.isFrench ? 'Tache affectee.' : 'Task assigned.')
      } catch (error) { this.$emit('error', this.copy.saveError) } finally { this.saving = false }
    }
  }
}
</script>

<style scoped>
.coordination-workspace{height:100%;display:flex;flex-direction:column;overflow:hidden;background:#f3f7f6;color:#17383a}.module-header{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:12px 16px;background:#fff;border-bottom:1px solid #cbd9d8}.module-header span,.work-section header span,.staff-section header span,.team-section header span{display:block;font-size:9px;font-weight:900;color:#587473;letter-spacing:.6px}.module-header h2{margin:1px 0;font-size:18px}.module-header p{margin:0;font-size:11px;color:#607877}.header-actions{display:flex;align-items:center;gap:4px;flex-wrap:wrap;justify-content:flex-end}.read-only{padding:7px 14px;background:#f1f5f9;border-bottom:1px solid #cbd5e1;font-size:11px;font-weight:700}.metric-strip{display:grid;grid-template-columns:repeat(4,1fr);background:#fff;border-bottom:1px solid #cfdcdb}.metric-strip article{display:grid;grid-template-columns:34px 1fr;align-items:center;min-height:70px;padding:9px 14px;border-right:1px solid #e0e8e7}.metric-strip article.warning{background:#fffaf0}.metric-strip span,.metric-strip strong,.metric-strip small{display:block}.metric-strip span{font-size:9px;font-weight:800;text-transform:uppercase;color:#627b79}.metric-strip strong{font-size:20px}.metric-strip small{font-size:10px;color:#617a78}.coordination-layout{display:grid;grid-template-columns:minmax(620px,1fr) 310px;min-height:0;flex:1}.coordination-layout main{overflow:auto;border-right:1px solid #cfdddc}.coordination-layout aside{overflow:auto;background:#f8fbfa}.work-section{background:#fff;border-bottom:8px solid #edf3f2}.work-section>header{display:flex;align-items:center;justify-content:space-between;padding:9px 13px;background:#e8f0ef;border-bottom:1px solid #ccd9d8}.work-section header strong,.staff-section header strong,.team-section header strong{display:block;font-size:12px}.work-section header button,.team-section>button{border:0;background:transparent;color:#0f766e;font-size:10px;font-weight:800}.work-head,.work-row{display:grid;grid-template-columns:minmax(250px,1.6fr) 130px 105px 82px;gap:10px;align-items:center}.work-head{padding:6px 13px;background:#f5f8f8;border-bottom:1px solid #dce5e4;font-size:9px;font-weight:800;text-transform:uppercase}.work-row{min-height:56px;padding:7px 13px;border-bottom:1px solid #e1e8e7}.work-row strong,.work-row small{display:block}.work-row strong{font-size:11px}.work-row small,.work-row>span{font-size:10px;color:#657c7a}.work-row b{justify-self:start;padding:3px 6px;font-size:9px;text-transform:uppercase}.work-row b.good{background:#dcfce7;color:#166534}.work-row b.warning{background:#fef3c7;color:#92400e}.work-row b.danger{background:#fee2e2;color:#b91c1c}.meeting-row{display:grid;grid-template-columns:30px 1fr 135px;gap:8px;align-items:center;min-height:54px;padding:7px 13px;border-bottom:1px solid #e1e8e7}.meeting-row strong,.meeting-row small{display:block}.meeting-row strong{font-size:11px}.meeting-row small,.meeting-row>span{font-size:10px;color:#657c7a}.staff-section,.team-section{background:#fff;border-bottom:8px solid #edf3f2}.staff-section>header,.team-section>header{padding:9px 12px;background:#e8f0ef;border-bottom:1px solid #ccd9d8}.staff-row{display:grid;grid-template-columns:32px 1fr;gap:8px;align-items:center;min-height:54px;padding:7px 12px;border-bottom:1px solid #e1e8e7}.staff-row>span:last-child{grid-column:2;font-size:9px;color:#607877;margin-top:-8px}.staff-row strong,.staff-row small{display:block}.staff-row strong{font-size:10px}.staff-row small{font-size:9px;color:#657c7a}.staff-avatar{display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:#d9eeea;color:#075f59;font-size:10px;font-weight:900}.team-row{padding:7px 12px;border-bottom:1px solid #e1e8e7}.team-row strong,.team-row span{display:block}.team-row strong{font-size:10px}.team-row span{font-size:9px;color:#657c7a}.team-section>button{width:100%;padding:9px;text-align:left}.empty-state{display:flex;min-height:90px;align-items:center;justify-content:center;gap:7px;color:#6b807e;font-size:10px}.empty-state.compact{min-height:60px}.dialog-title{font-size:16px!important;font-weight:800;border-bottom:1px solid #d7e2e1}.dialog-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:1100px){.coordination-layout{grid-template-columns:1fr}.coordination-layout aside{display:grid;grid-template-columns:1fr 1fr}.metric-strip{grid-template-columns:repeat(2,1fr)}}@media(max-width:720px){.module-header{align-items:flex-start;flex-direction:column}.header-actions{justify-content:flex-start}.coordination-layout aside{grid-template-columns:1fr}.work-head,.work-row{grid-template-columns:minmax(180px,1fr) 90px 75px}.work-head span:nth-child(3),.work-row>span:nth-child(3){display:none}.metric-strip{grid-template-columns:1fr 1fr}.dialog-grid{grid-template-columns:1fr}}
</style>
