<template>
  <section class="doctor-center">
    <header class="doctor-brief">
      <div>
        <span>{{ $t('clinical360.doctor.command_center.eyebrow') }}</span>
        <h2>{{ $t('clinical360.doctor.command_center.heading') }}</h2>
        <p>{{ $t('clinical360.doctor.command_center.subheading') }}</p>
      </div>
      <div class="doctor-actions">
        <v-btn x-small depressed color="#003366" dark :disabled="readOnly" @click="$emit('new-note')">
          <v-icon x-small left>mdi-note-edit-outline</v-icon>{{ $t('clinical360.doctor.command_center.progress_note') }}
        </v-btn>
        <v-btn x-small depressed color="#0f766e" dark :disabled="readOnly" @click="$emit('new-order')">
          <v-icon x-small left>mdi-clipboard-plus-outline</v-icon>{{ $t('clinical360.doctor.command_center.new_order') }}
        </v-btn>
      </div>
    </header>

    <div class="doctor-metrics">
      <button type="button" @click="openTab('Lab Results')"><span>{{ $t('clinical360.doctor.command_center.results_to_review') }}</span><strong>{{ resultsToReview }}</strong><small>{{ $t('clinical360.doctor.command_center.laboratory_and_imaging') }}</small></button>
      <button type="button" @click="openTab('Medications')"><span>{{ $t('clinical360.doctor.command_center.active_medications') }}</span><strong>{{ activeMedications.length }}</strong><small>{{ $t('clinical360.doctor.command_center.reconcile_and_monitor') }}</small></button>
      <button type="button" @click="openTab('Work List')"><span>{{ $t('clinical360.doctor.command_center.open_clinical_work') }}</span><strong>{{ tasks.length }}</strong><small>{{ $t('clinical360.doctor.command_center.assigned_follow_up') }}</small></button>
      <button type="button" @click="openTab('Care Plan')"><span>{{ $t('clinical360.doctor.command_center.care_plans') }}</span><strong>{{ carePlans.length }}</strong><small>{{ $t('clinical360.doctor.command_center.goals_and_outcomes') }}</small></button>
    </div>

    <div class="doctor-grid">
      <section class="doctor-panel clinical-summary">
        <header><span>{{ $t('clinical360.doctor.command_center.clinical_synthesis') }}</span><strong>{{ $t('clinical360.doctor.command_center.current_state') }}</strong></header>
        <dl>
          <div><dt>{{ $t('clinical360.doctor.command_center.patient_label') }}</dt><dd>{{ patient.name }}</dd></div>
          <div><dt>{{ $t('clinical360.doctor.command_center.location_label') }}</dt><dd>{{ patient.bed || patient.patientClass }}</dd></div>
          <div><dt>{{ $t('clinical360.doctor.command_center.attending_label') }}</dt><dd>{{ patient.attending }}</dd></div>
          <div><dt>{{ $t('clinical360.doctor.command_center.allergies_label') }}</dt><dd class="alert-value">{{ patient.allergies }}</dd></div>
          <div><dt>{{ $t('clinical360.doctor.command_center.latest_vitals_label') }}</dt><dd>{{ vitalSummary }}</dd></div>
          <div><dt>{{ $t('clinical360.doctor.command_center.active_problem_label') }}</dt><dd>{{ latestDiagnosis }}</dd></div>
        </dl>
        <button type="button" class="panel-link" @click="openTab('Chart Review')">{{ $t('clinical360.doctor.command_center.open_longitudinal_chart') }}</button>
      </section>

      <section class="doctor-panel review-queue">
        <header><span>{{ $t('clinical360.doctor.command_center.review_queue_eyebrow') }}</span><strong>{{ $t('clinical360.doctor.command_center.review_queue_title') }}</strong></header>
        <button v-for="item in reviewQueue" :key="item.label" type="button" @click="openTab(item.tab)">
          <v-icon small :color="item.color">{{ item.icon }}</v-icon>
          <div><strong>{{ item.label }}</strong><span>{{ item.detail }}</span></div>
          <em :class="item.level">{{ item.badge }}</em>
        </button>
      </section>

      <section class="doctor-panel recent-notes">
        <header><span>{{ $t('clinical360.doctor.command_center.medical_documentation') }}</span><strong>{{ $t('clinical360.doctor.command_center.recent_progress') }}</strong></header>
        <article v-for="note in recentNotes" :key="note.id || note.recordedAt">
          <div><strong>{{ note.diagnosis || note.title || $t('clinical360.doctor.command_center.medical_progress_note') }}</strong><small>{{ formatDate(note.recordedAt || note.createdAt) }}</small></div>
          <p>{{ note.plan || note.clinicalFindings || note.progressNote || $t('clinical360.doctor.command_center.no_narrative_filed') }}</p>
        </article>
        <div v-if="!recentNotes.length" class="doctor-empty">{{ $t('clinical360.doctor.command_center.no_medical_note_filed') }}</div>
        <button type="button" class="panel-link" @click="openTab('Notes')">{{ $t('clinical360.doctor.command_center.review_all_notes') }}</button>
      </section>

      <section class="doctor-panel active-orders">
        <header><span>{{ $t('clinical360.doctor.command_center.orders_and_therapy') }}</span><strong>{{ $t('clinical360.doctor.command_center.active_plan') }}</strong></header>
        <div v-for="item in activePlan" :key="item.key" class="plan-row">
          <v-icon small :color="item.color">{{ item.icon }}</v-icon>
          <div><strong>{{ item.label }}</strong><span>{{ item.detail }}</span></div>
          <b>{{ item.status }}</b>
        </div>
        <div v-if="!activePlan.length" class="doctor-empty">{{ $t('clinical360.doctor.command_center.no_active_order_filed') }}</div>
        <button type="button" class="panel-link" @click="openTab('Orders')">{{ $t('clinical360.doctor.command_center.manage_orders') }}</button>
      </section>
    </div>
  </section>
</template>

<script>
export default {
  name: 'Patient360DoctorCommandCenter',
  props: {
    patient: { type: Object, default: () => ({}) },
    latestVitals: { type: Object, default: null },
    medicalNotes: { type: Array, default: () => [] },
    labOrders: { type: Array, default: () => [] },
    imagingOrders: { type: Array, default: () => [] },
    medications: { type: Array, default: () => [] },
    tasks: { type: Array, default: () => [] },
    carePlans: { type: Array, default: () => [] },
    readOnly: { type: Boolean, default: false }
  },
  computed: {
    activeMedications() {
      return this.medications.filter(item => !/cancel|discontinu|reject|void/i.test(String(item.status || 'Active')))
    },
    resultsToReview() {
      return [...this.labOrders, ...this.imagingOrders].filter(item => /pending|requested|preliminary|abnormal|critical|ready|resulted/i.test(String(item.status || 'Pending'))).length
    },
    vitalSummary() {
      const row = this.latestVitals || {}
      const parts = []
      if (row.bp || row.bloodPressure) parts.push(`BP ${row.bp || row.bloodPressure}`)
      if (row.hr || row.pulseRate) parts.push(`HR ${row.hr || row.pulseRate}`)
      if (row.temp || row.temperature) parts.push(`Temp ${row.temp || row.temperature} C`)
      if (row.spo2 || row.oxygenSaturation) parts.push(`SpO2 ${row.spo2 || row.oxygenSaturation}%`)
      return parts.length ? parts.join(' | ') : this.$t('clinical360.doctor.command_center.vitals_not_filed')
    },
    latestDiagnosis() {
      const note = this.recentNotes[0]
      return note && (note.diagnosis || note.clinicalFindings) || this.$t('clinical360.doctor.command_center.no_diagnosis_filed')
    },
    recentNotes() {
      return [...this.medicalNotes]
        .sort((a, b) => new Date(b.recordedAt || b.createdAt || 0) - new Date(a.recordedAt || a.createdAt || 0))
        .slice(0, 3)
    },
    reviewQueue() {
      const pendingLabs = this.labOrders.filter(item => !/final|complete|cancel/i.test(String(item.status || ''))).length
      const pendingImaging = this.imagingOrders.filter(item => !/final|complete|cancel/i.test(String(item.status || ''))).length
      const t = key => this.$t(`clinical360.doctor.command_center.${key}`)
      return [
        { label: t('laboratory_results'), detail: t('orders_awaiting_final_review', { count: pendingLabs }), badge: pendingLabs ? t('badge_review') : t('badge_clear'), level: pendingLabs ? 'warning' : 'good', color: '#0369a1', icon: 'mdi-flask-outline', tab: 'Lab Results' },
        { label: t('imaging_reports'), detail: t('studies_or_reports_open', { count: pendingImaging }), badge: pendingImaging ? t('badge_review') : t('badge_clear'), level: pendingImaging ? 'warning' : 'good', color: '#7c3aed', icon: 'mdi-radiology-box-outline', tab: 'Lab Results' },
        { label: t('medication_reconciliation'), detail: t('active_medications_count', { count: this.activeMedications.length }), badge: this.activeMedications.length ? t('badge_verify') : t('badge_none'), level: this.activeMedications.length ? 'warning' : 'good', color: '#0f766e', icon: 'mdi-pill-multiple', tab: 'Medications' },
        { label: t('disposition_readiness'), detail: t('open_tasks_before_transition', { count: this.tasks.length }), badge: this.tasks.length ? t('badge_open') : t('badge_ready'), level: this.tasks.length ? 'warning' : 'good', color: '#b45309', icon: 'mdi-hospital-exit', tab: 'Handoff' }
      ]
    },
    activePlan() {
      const t = key => this.$t(`clinical360.doctor.command_center.${key}`)
      const labs = this.labOrders.slice(0, 2).map(item => ({ key: `lab-${item.id}`, icon: 'mdi-flask-outline', color: '#0369a1', label: item.test || item.testName || t('laboratory_order'), detail: item.priority || t('routine'), status: item.status || t('requested') }))
      const imaging = this.imagingOrders.slice(0, 2).map(item => ({ key: `img-${item.id}`, icon: 'mdi-radiology-box-outline', color: '#7c3aed', label: item.exam || item.modality || t('imaging_order'), detail: item.priority || t('routine'), status: item.status || t('requested') }))
      const medications = this.activeMedications.slice(0, 3).map(item => ({ key: `med-${item.id}`, icon: 'mdi-pill', color: '#0f766e', label: item.drug || item.medication || t('medication'), detail: [item.dose, item.route, item.frequency].filter(Boolean).join(' | '), status: item.status || t('active_status') }))
      return [...labs, ...imaging, ...medications]
    }
  },
  methods: {
    openTab(tab) {
      this.$emit('open-tab', tab)
    },
    formatDate(value) {
      if (!value) return this.$t('clinical360.doctor.command_center.date_not_filed')
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
    }
  }
}
</script>

<style scoped>
.doctor-center { padding: 12px; background: #f4f8f7; min-height: 100%; color: #0f172a; }
.doctor-brief { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 16px; border-left: 5px solid #003366; background: #fff; box-shadow: 0 1px 3px rgba(15, 23, 42, .12); }
.doctor-brief span, .doctor-panel header span { color: #0f766e; font-size: 10px; font-weight: 900; }
.doctor-brief h2 { margin: 2px 0; font-size: 20px; letter-spacing: 0; }
.doctor-brief p { margin: 0; color: #475569; font-size: 12px; }
.doctor-actions { display: flex; gap: 6px; flex-shrink: 0; }
.doctor-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin: 10px 0; }
.doctor-metrics button { min-height: 82px; padding: 10px 12px; border: 1px solid #cbd5e1; border-top: 4px solid #0f766e; background: #fff; text-align: left; cursor: pointer; }
.doctor-metrics span, .doctor-metrics small { display: block; color: #64748b; font-size: 10px; font-weight: 800; }
.doctor-metrics strong { display: block; margin: 2px 0; color: #003366; font-size: 24px; }
.doctor-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 10px; }
.doctor-panel { border: 1px solid #cbd5e1; background: #fff; min-width: 0; }
.doctor-panel > header { padding: 10px 12px; border-bottom: 1px solid #dbe4e3; background: #edf6f4; }
.doctor-panel > header strong { display: block; margin-top: 2px; font-size: 14px; }
.clinical-summary dl { margin: 0; padding: 4px 12px; }
.clinical-summary dl div { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 8px; padding: 7px 0; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
.clinical-summary dt { color: #64748b; font-weight: 800; }
.clinical-summary dd { margin: 0; font-weight: 800; overflow-wrap: anywhere; }
.alert-value { color: #b91c1c; }
.review-queue > button { width: 100%; display: grid; grid-template-columns: 24px minmax(0, 1fr) auto; align-items: center; gap: 8px; padding: 9px 12px; border: 0; border-bottom: 1px solid #e2e8f0; background: #fff; text-align: left; cursor: pointer; }
.review-queue button div strong, .review-queue button div span { display: block; }
.review-queue button div strong { font-size: 12px; }
.review-queue button div span { color: #64748b; font-size: 10px; }
.review-queue em { padding: 2px 6px; font-size: 9px; font-style: normal; font-weight: 900; }
.review-queue em.warning { background: #fef3c7; color: #92400e; }
.review-queue em.good { background: #dcfce7; color: #166534; }
.recent-notes article, .plan-row { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; }
.recent-notes article div { display: flex; justify-content: space-between; gap: 8px; }
.recent-notes article strong { font-size: 12px; }
.recent-notes article small { color: #64748b; font-size: 9px; }
.recent-notes article p { margin: 4px 0 0; color: #334155; font-size: 10px; line-height: 1.4; }
.plan-row { display: grid; grid-template-columns: 24px minmax(0, 1fr) auto; align-items: center; gap: 8px; }
.plan-row div strong, .plan-row div span { display: block; }
.plan-row div strong { font-size: 11px; }.plan-row div span { color: #64748b; font-size: 9px; }.plan-row b { color: #0f766e; font-size: 9px; }
.panel-link { margin: 8px 12px; border: 0; background: transparent; color: #0057b8; font-size: 10px; font-weight: 900; cursor: pointer; }
.doctor-empty { padding: 18px 12px; color: #64748b; font-size: 11px; }
@media (max-width: 1050px) { .doctor-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }.doctor-grid { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .doctor-brief { align-items: flex-start; flex-direction: column; }.doctor-actions { width: 100%; }.doctor-metrics { grid-template-columns: 1fr 1fr; } }
</style>
