<template>
  <v-container fluid class="report-center pa-6 pa-md-10">
    <header class="page-header mb-6">
      <div class="title-group">
        <v-avatar tile color="#003366" size="48"><v-icon dark>mdi-printer-check</v-icon></v-avatar>
        <div>
          <span>{{ isFrench ? 'DOSSIER PATIENT' : 'PATIENT CHART' }}</span>
          <h1>{{ isFrench ? 'Centre de rapports' : 'Report Center' }}</h1>
          <p>{{ isFrench ? 'Prévisualiser et imprimer les documents du parcours patient.' : 'Preview and print documents across the patient journey.' }}</p>
        </div>
      </div>
      <v-btn tile depressed color="#003366" dark :disabled="!selectedPatient" @click="printReport">
        <v-icon left small>mdi-printer</v-icon>{{ isFrench ? 'Imprimer' : 'Print' }}
      </v-btn>
    </header>

    <v-alert v-if="loadError" tile dense type="warning" class="mb-5">{{ loadError }}</v-alert>

    <section class="report-controls mb-6" aria-label="Report selection">
      <v-autocomplete v-model="patientId" :items="patientItems" item-text="label" item-value="id" label="Patient / MRN" prepend-inner-icon="mdi-account-search" outlined tile dense hide-details />
      <v-select v-model="reportType" :items="reportTypes" item-text="label" item-value="value" :label="isFrench ? 'Type de rapport' : 'Report type'" outlined tile dense hide-details />
      <v-select v-if="availableRecords.length" v-model="recordId" :items="availableRecords" item-text="label" item-value="id" :label="isFrench ? 'Document source' : 'Source record'" outlined tile dense hide-details />
    </section>

    <section v-if="selectedPatient" id="clinical-report-preview" class="report-sheet">
      <div class="report-letterhead">
        <div><strong>{{ institution }}</strong><span>{{ isFrench ? 'Rapport clinique confidentiel' : 'Confidential clinical report' }}</span></div>
        <div class="report-meta"><span>{{ reportTitle }}</span><strong>{{ generatedAt }}</strong></div>
      </div>

      <div class="patient-banner">
        <div><span>Patient</span><strong>{{ patientName }}</strong></div>
        <div><span>MRN</span><strong>{{ selectedPatient.mrn || '-' }}</strong></div>
        <div><span>{{ isFrench ? 'Naissance' : 'DOB' }}</span><strong>{{ formatDate(selectedPatient.dob || selectedPatient.dateOfBirth) }}</strong></div>
        <div><span>{{ isFrench ? 'Sexe' : 'Sex' }}</span><strong>{{ selectedPatient.gender || selectedPatient.sex || '-' }}</strong></div>
      </div>

      <div v-if="!reportSections.length" class="empty-report">
        <v-icon size="40" color="#94a3b8">mdi-file-alert-outline</v-icon>
        <strong>{{ isFrench ? 'Aucune donnée disponible pour ce rapport.' : 'No data is available for this report.' }}</strong>
      </div>

      <article v-for="section in reportSections" :key="section.title" class="report-section">
        <h2>{{ section.title }}</h2>
        <dl v-if="section.rows && section.rows.length">
          <template v-for="row in section.rows">
            <dt :key="`${section.title}-${row.label}-label`">{{ row.label }}</dt>
            <dd :key="`${section.title}-${row.label}-value`">{{ display(row.value) }}</dd>
          </template>
        </dl>
        <div v-if="section.content" class="narrative">{{ section.content }}</div>
      </article>

      <footer class="report-footer">
        <div><span>{{ isFrench ? 'Préparé par' : 'Prepared by' }}</span><strong>{{ preparedBy }}</strong></div>
        <div><span>{{ isFrench ? 'Établissement' : 'Facility' }}</span><strong>{{ institution }}</strong></div>
        <div class="signature"><span>Signature</span></div>
      </footer>
    </section>

    <v-alert v-else tile color="#e2e8f0" class="navy--text">
      {{ isFrench ? 'Sélectionnez un patient pour générer un rapport.' : 'Select a patient to generate a report.' }}
    </v-alert>
  </v-container>
</template>

<script>
export default {
  data: () => ({ patientId: '', reportType: 'admission', recordId: '', loadError: '' }),
  computed: {
    isFrench() { return this.$i18n.locale === 'fr' },
    institution() { return this.$store.state.auth.institution || 'CameroHealth' },
    preparedBy() { return this.$store.state.auth.fullName || this.$store.state.auth.staffId || '-' },
    patients() { return this.$store.getters['clinical/getPatients'] || [] },
    inpatients() { return this.$store.getters['clinical/getInpatients'] || [] },
    documents() { return this.$store.getters['clinical/getDocuments'] || [] },
    nursingNotes() { return this.$store.getters['clinical/getNursingNotes'] || [] },
    medicalNotes() { return this.$store.getters['clinical/getMedicalNotes'] || [] },
    visits() { return this.$store.getters['clinical/getVisits'] || [] },
    patientItems() { return this.patients.map(patient => ({ id: patient.id, label: `${patient.mrn || '-'} - ${this.nameOf(patient)}` })) },
    selectedPatient() { return this.patients.find(patient => patient.id === this.patientId) || null },
    patientName() { return this.selectedPatient ? this.nameOf(this.selectedPatient) : '-' },
    reportTypes() {
      return [
        { value: 'admission', label: 'Admission' },
        { value: 'transfer', label: this.isFrench ? 'Transfert' : 'Transfer' },
        { value: 'discharge', label: this.isFrench ? 'Sortie' : 'Discharge' },
        { value: 'nursing-note', label: this.isFrench ? 'Note infirmière' : 'Nursing note' },
        { value: 'medical-note', label: this.isFrench ? 'Note médicale' : 'Medical note' },
        { value: 'other', label: this.isFrench ? 'Autre document' : 'Other document' }
      ]
    },
    reportTitle() { return this.reportTypes.find(item => item.value === this.reportType)?.label || 'Clinical report' },
    generatedAt() { return new Date().toLocaleString(this.isFrench ? 'fr-CM' : 'en-US') },
    availableRecords() {
      if (!this.patientId) return []
      let records = []
      if (this.reportType === 'admission') records = this.inpatients.filter(item => item.patientId === this.patientId)
      if (this.reportType === 'transfer') records = this.documents.filter(item => item.patientId === this.patientId && /transfer|transfert/i.test(`${item.category} ${item.title}`))
      if (this.reportType === 'discharge') records = this.documents.filter(item => item.patientId === this.patientId && /discharge|sortie/i.test(`${item.category} ${item.title}`))
      if (this.reportType === 'nursing-note') records = this.nursingNotes.filter(item => item.patientId === this.patientId)
      if (this.reportType === 'medical-note') records = this.medicalNotes.filter(item => item.patientId === this.patientId)
      if (this.reportType === 'other') records = this.documents.filter(item => item.patientId === this.patientId)
      return records.slice().sort((a, b) => new Date(this.recordDate(b) || 0) - new Date(this.recordDate(a) || 0)).map(item => ({ ...item, label: `${this.formatDateTime(this.recordDate(item))} - ${item.title || item.category || item.id}` }))
    },
    selectedRecord() { return this.availableRecords.find(item => item.id === this.recordId) || this.availableRecords[0] || null },
    reportSections() {
      if (!this.selectedPatient) return []
      if (this.reportType === 'admission') return this.admissionSections()
      if (this.reportType === 'transfer') return this.documentSections('Transfer details')
      if (this.reportType === 'discharge') return this.dischargeSections()
      if (this.reportType === 'nursing-note') return this.noteSections('Nursing documentation')
      if (this.reportType === 'medical-note') return this.noteSections('Medical documentation')
      return this.documentSections('Document details')
    }
  },
  watch: { patientId() { this.recordId = '' }, reportType() { this.recordId = '' } },
  async mounted() {
    const results = await Promise.allSettled([
      this.$store.dispatch('clinical/fetchPatients'),
      this.$store.dispatch('clinical/fetchInpatients', { status: 'all' }),
      this.$store.dispatch('clinical/fetchVisits')
    ])
    if (results.every(result => result.status === 'rejected')) this.loadError = this.isFrench ? 'Impossible de charger les données du serveur.' : 'Unable to load server data.'
    const routePatient = this.$route.query.patientId
    if (routePatient && this.patients.some(patient => patient.id === routePatient)) this.patientId = routePatient
  },
  methods: {
    nameOf(patient) { return patient.name || patient.fullName || [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ') || patient.id },
    display(value) { return value === null || value === undefined || value === '' ? '-' : value },
    formatDate(value) { return value ? new Date(value).toLocaleDateString(this.isFrench ? 'fr-CM' : 'en-US') : '-' },
    formatDateTime(value) { return value ? new Date(value).toLocaleString(this.isFrench ? 'fr-CM' : 'en-US') : '-' },
    recordDate(record) { return record?.createdAt || record?.recordedAt || record?.admittedAt || record?.updatedAt || '' },
    escapeHtml(value) {
      return String(value || '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]))
    },
    admissionSections() {
      const admission = this.selectedRecord || this.inpatients.find(item => item.patientId === this.patientId) || {}
      const visit = this.visits.find(item => item.patientId === this.patientId) || {}
      return [
        { title: 'Admission', rows: [
          { label: this.isFrench ? 'Date et heure' : 'Date and time', value: this.formatDateTime(admission.admittedAt || visit.createdAt) },
          { label: this.isFrench ? 'Service / unité' : 'Service / unit', value: admission.ward || this.selectedPatient.departmentRouting },
          { label: this.isFrench ? 'Lit' : 'Bed', value: admission.bedNumber },
          { label: this.isFrench ? "Type d'admission" : 'Admission type', value: admission.admissionType || this.selectedPatient.patientStatus },
          { label: this.isFrench ? "Motif d'admission" : 'Admission reason', value: admission.admissionReason || visit.chiefComplaint || this.selectedPatient.visitReason },
          { label: this.isFrench ? 'Diagnostic' : 'Diagnosis', value: admission.diagnosis || visit.diagnosis }
        ] },
        { title: this.isFrench ? 'Sécurité clinique' : 'Clinical safety', rows: [
          { label: 'Allergies', value: this.selectedPatient.allergies },
          { label: this.isFrench ? 'Groupe sanguin' : 'Blood type', value: this.selectedPatient.bloodType },
          { label: this.isFrench ? 'Antécédents' : 'Medical history', value: this.selectedPatient.medicalHistory }
        ] }
      ]
    },
    dischargeSections() {
      const item = this.selectedRecord || {}
      return [
        { title: this.isFrench ? 'Décision de sortie' : 'Discharge decision', rows: [
          { label: this.isFrench ? 'Date de sortie' : 'Discharge date', value: this.formatDateTime(this.selectedPatient.dischargedAt || item.createdAt) },
          { label: this.isFrench ? 'Destination' : 'Disposition', value: this.selectedPatient.dischargeDisposition },
          { label: this.isFrench ? 'Motif / diagnostic' : 'Reason / diagnosis', value: this.selectedPatient.dischargeReason },
          { label: this.isFrench ? 'Responsable' : 'Discharged by', value: this.selectedPatient.dischargedBy || item.createdBy }
        ] },
        { title: item.title || (this.isFrench ? 'Résumé de sortie' : 'Discharge summary'), content: item.content || item.summary || (this.isFrench ? 'Aucun résumé de sortie déposé.' : 'No discharge summary filed.') }
      ]
    },
    documentSections(fallbackTitle) {
      const item = this.selectedRecord
      if (!item) return []
      return [{ title: item.title || fallbackTitle, rows: [
        { label: this.isFrench ? 'Catégorie' : 'Category', value: item.category },
        { label: this.isFrench ? 'Statut' : 'Status', value: item.status },
        { label: this.isFrench ? 'Déposé le' : 'Filed at', value: this.formatDateTime(item.createdAt) },
        { label: this.isFrench ? 'Déposé par' : 'Filed by', value: item.createdBy }
      ], content: item.content || item.summary || item.note }]
    },
    noteSections(fallbackTitle) {
      const note = this.selectedRecord
      if (!note) return []
      return [{ title: note.title || fallbackTitle, rows: [
        { label: this.isFrench ? 'Date et heure' : 'Date and time', value: this.formatDateTime(note.recordedAt || note.createdAt) },
        { label: this.isFrench ? 'Auteur' : 'Author', value: note.recordedBy || note.createdBy },
        { label: this.isFrench ? 'Statut' : 'Status', value: note.status || 'Filed' }
      ], content: [note.observation, note.assessment, note.actions, note.response, note.plan, note.content].filter(Boolean).join('\n\n') }]
    },
    printReport() {
      const source = document.getElementById('clinical-report-preview')
      if (!source) return
      const win = window.open('', '_blank', 'width=960,height=760')
      if (!win) return this.$toast.error(this.isFrench ? "Autorisez les fenêtres contextuelles pour imprimer." : 'Allow pop-ups to print.')
      const title = `${this.escapeHtml(this.reportTitle)} - ${this.escapeHtml(this.patientName)}`
      win.document.write(`<!doctype html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;color:#0f172a;margin:32px}.report-sheet{max-width:900px;margin:auto}.report-letterhead,.patient-banner,.report-footer{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid #003366;padding:14px 0}.report-letterhead div,.patient-banner div,.report-footer div{display:flex;flex-direction:column}.report-letterhead span,.patient-banner span,.report-footer span{font-size:10px;text-transform:uppercase;color:#64748b}.patient-banner{background:#f1f5f9;padding:14px}.report-section{margin-top:24px}.report-section h2{font-size:15px;text-transform:uppercase;border-bottom:1px solid #cbd5e1;padding-bottom:7px}dl{display:grid;grid-template-columns:220px 1fr;margin:0}dt,dd{padding:7px;border-bottom:1px solid #e2e8f0;margin:0;font-size:12px}dt{font-weight:bold}.narrative{white-space:pre-wrap;font-size:13px;line-height:1.55}.report-footer{margin-top:48px;border-top:1px solid #94a3b8;border-bottom:0}.signature{min-width:180px;border-bottom:1px solid #334155}@media print{body{margin:10mm}}</style></head><body>${source.outerHTML}<script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`)
      win.document.close()
    }
  }
}
</script>

<style scoped>
.report-center{background:#f4f7f6;min-height:100%;color:#0f172a}.page-header{display:flex;align-items:center;justify-content:space-between;gap:20px}.title-group{display:flex;align-items:center;gap:16px}.title-group span{color:#64748b;font-size:11px;font-weight:900;letter-spacing:.8px}.title-group h1{margin:0;font-size:28px;letter-spacing:0}.title-group p{margin:2px 0 0;color:#64748b}.report-controls{display:grid;grid-template-columns:minmax(240px,1.35fr) minmax(190px,.8fr) minmax(250px,1.2fr);gap:12px;padding:16px;background:white;border:1px solid #dbe3e8}.report-sheet{max-width:980px;margin:0 auto;background:white;border:1px solid #dbe3e8;padding:32px;box-shadow:0 2px 8px rgba(15,23,42,.06)}.report-letterhead,.patient-banner,.report-footer{display:flex;justify-content:space-between;gap:20px}.report-letterhead{border-bottom:3px solid #003366;padding-bottom:16px}.report-letterhead>div,.patient-banner>div,.report-footer>div{display:flex;flex-direction:column}.report-letterhead span,.patient-banner span,.report-footer span{color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase}.report-meta{text-align:right}.patient-banner{margin-top:18px;padding:14px 16px;background:#eef6f5;border-left:4px solid #00a99d}.report-section{margin-top:26px}.report-section h2{font-size:14px;text-transform:uppercase;color:#003366;border-bottom:1px solid #cbd5e1;padding-bottom:8px}.report-section dl{display:grid;grid-template-columns:minmax(170px,.55fr) 1.45fr;margin:0}.report-section dt,.report-section dd{padding:9px 8px;margin:0;border-bottom:1px solid #e2e8f0;font-size:12px}.report-section dt{font-weight:800;color:#475569}.narrative{white-space:pre-wrap;line-height:1.6;font-size:13px}.empty-report{min-height:180px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#64748b}.report-footer{margin-top:48px;padding-top:14px;border-top:1px solid #94a3b8}.signature{min-width:180px;border-bottom:1px solid #334155}@media(max-width:900px){.report-controls{grid-template-columns:1fr}.page-header{align-items:flex-start}.patient-banner{display:grid;grid-template-columns:1fr 1fr}}
</style>
