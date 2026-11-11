<template>
  <section class="medication-workspace">
    <header class="module-header">
      <div>
        <span>{{ $t('clinical360.medications.tab.section_label') }}</span>
        <h2>{{ $t('clinical360.medications.tab.title') }}</h2>
        <p>{{ $t('clinical360.medications.tab.subtitle') }}</p>
      </div>
      <div class="header-actions">
        <v-btn x-small outlined color="#0f766e" @click="printMedicationList">
          <v-icon x-small left>mdi-printer</v-icon>{{ $t('clinical360.medications.tab.print_list') }}
        </v-btn>
        <v-btn v-if="canPrescribe && !readOnly" x-small depressed color="#0f766e" dark @click="view = 'formulary'">
          <v-icon x-small left>mdi-pill-plus</v-icon>{{ $t('clinical360.medications.tab.new_order') }}
        </v-btn>
      </div>
    </header>

    <div v-if="readOnly" class="read-only"><v-icon x-small>mdi-lock-outline</v-icon> {{ $t('clinical360.medications.tab.read_only_notice') }}</div>

    <div class="view-tabs" role="tablist" :aria-label="$t('clinical360.medications.tab.aria_workspace_views')">
      <button type="button" :class="{ active: view === 'profile' }" @click="view = 'profile'">{{ $t('clinical360.medications.tab.patient_medications') }} <strong>{{ medications.length }}</strong></button>
      <button type="button" :class="{ active: view === 'formulary' }" @click="view = 'formulary'">{{ $t('clinical360.medications.tab.formulary_and_education') }} <strong>{{ catalog.length }}</strong></button>
    </div>

    <template v-if="view === 'profile'">
      <div class="summary-strip">
        <article><span>{{ $t('clinical360.medications.tab.active') }}</span><strong>{{ activeCount }}</strong><small>{{ $t('clinical360.medications.tab.current_orders') }}</small></article>
        <article><span>{{ $t('clinical360.medications.tab.awaiting_pharmacy') }}</span><strong>{{ pendingCount }}</strong><small>{{ $t('clinical360.medications.tab.pending_or_partial') }}</small></article>
        <article :class="{ alert: outOfStockCount }"><span>{{ $t('clinical360.medications.tab.out_of_stock') }}</span><strong>{{ outOfStockCount }}</strong><small>{{ $t('clinical360.medications.tab.requires_a_plan') }}</small></article>
        <article><span>{{ $t('clinical360.medications.tab.dispensed') }}</span><strong>{{ dispensedCount }}</strong><small>{{ $t('clinical360.medications.tab.pharmacy_completed') }}</small></article>
      </div>
      <div class="filter-bar">
        <label><v-icon x-small>mdi-magnify</v-icon><input v-model.trim="search" type="search" :placeholder="$t('clinical360.medications.tab.search_placeholder')" /></label>
        <span>{{ $t('clinical360.medications.tab.shown_count', { count: filteredMedications.length }) }}</span>
      </div>
      <div class="medication-table" role="table" :aria-label="$t('clinical360.medications.tab.aria_medication_list')">
        <div class="medication-head" role="row"><span>{{ $t('clinical360.medications.tab.col_medication') }}</span><span>{{ $t('clinical360.medications.tab.col_dose_route') }}</span><span>{{ $t('clinical360.medications.tab.col_schedule') }}</span><span>{{ $t('clinical360.medications.tab.col_pharmacy') }}</span><span>{{ $t('clinical360.medications.tab.col_education') }}</span></div>
        <article v-for="med in filteredMedications" :key="med.id" class="medication-row">
          <span><ClinicalHoverCard :title="medicationName(med)" :eyebrow="$t('clinical360.medications.tab.section_label')" :subtitle="med.frequency || $t('clinical360.medications.tab.not_scheduled')" :details="medicationHoverDetails(med)"><template #activator><strong class="detail-trigger">{{ medicationName(med) }}</strong></template></ClinicalHoverCard><small>{{ med.medicationClass || catalogFor(med)?.medicationClass || $t('clinical360.medications.tab.class_not_labelled') }}</small></span>
          <span><strong>{{ med.dose || med.dosage || $t('clinical360.medications.tab.per_order') }}</strong><small>{{ med.route || $t('clinical360.medications.tab.route_not_filed') }}</small></span>
          <span><strong>{{ med.frequency || $t('clinical360.medications.tab.not_scheduled') }}</strong><small>{{ med.status || $t('clinical360.medications.tab.status_active') }}</small></span>
          <span><b :class="['status', pharmacyStatusClass(med)]">{{ pharmacyStatusLabel(med) }}</b><small>{{ med.stockAction || med.dispenseLocation || $t('clinical360.medications.tab.hospital_pharmacy') }}</small></span>
          <span><strong>{{ educationFor(med) }}</strong><small v-if="sideEffectsFor(med)">{{ $t('clinical360.medications.tab.common_effects', { effects: sideEffectsFor(med) }) }}</small></span>
        </article>
        <div v-if="!filteredMedications.length" class="empty-state"><v-icon size="34" color="#94a3b8">mdi-pill-off</v-icon><strong>{{ $t('clinical360.medications.tab.empty_state') }}</strong></div>
      </div>
    </template>

    <template v-else>
      <div class="formulary-notice"><v-icon small color="#b45309">mdi-shield-alert-outline</v-icon><span><strong>{{ $t('clinical360.medications.tab.prescribing_support_only') }}</strong> {{ $t('clinical360.medications.tab.prescribing_support_detail') }}</span></div>
      <div class="catalog-filters">
        <label><v-icon x-small>mdi-magnify</v-icon><input v-model.trim="catalogSearch" type="search" :placeholder="$t('clinical360.medications.tab.catalog_search_placeholder')" /></label>
        <select v-model="selectedClass"><option value="">{{ $t('clinical360.medications.tab.all_classes') }}</option><option v-for="item in classes" :key="item">{{ item }}</option></select>
        <select v-model="selectedNeed"><option value="">{{ $t('clinical360.medications.tab.all_clinical_needs') }}</option><option v-for="item in needs" :key="item">{{ item }}</option></select>
      </div>
      <div class="catalog-layout">
        <div class="catalog-list">
          <button v-for="item in filteredCatalog" :key="item.id" type="button" :class="{ selected: selectedCatalogId === item.id }" @click="selectedCatalogId = item.id">
            <span><strong>{{ item.genericName }}</strong><small>{{ item.medicationClass }}</small></span>
            <em>{{ item.needs.slice(0, 2).join(' · ') }}</em>
          </button>
          <div v-if="!filteredCatalog.length" class="empty-state"><strong>{{ $t('clinical360.medications.tab.no_formulary_match') }}</strong></div>
        </div>
        <aside class="catalog-detail">
          <template v-if="selectedCatalog">
            <header><span>{{ $t('clinical360.medications.tab.generic_medication') }}</span><strong>{{ selectedCatalog.genericName }}</strong><small>{{ selectedCatalog.medicationClass }}</small></header>
            <dl>
              <div><dt>{{ $t('clinical360.medications.tab.clinical_needs') }}</dt><dd>{{ selectedCatalog.needs.join(', ') }}</dd></div>
              <div><dt>{{ $t('clinical360.medications.tab.common_routes') }}</dt><dd>{{ selectedCatalog.routes.join(', ') }}</dd></div>
              <div><dt>{{ $t('clinical360.medications.tab.common_side_effects') }}</dt><dd>{{ selectedCatalog.sideEffects }}</dd></div>
              <div><dt>{{ $t('clinical360.medications.tab.patient_education') }}</dt><dd>{{ selectedCatalog.education }}</dd></div>
              <div class="warning"><dt>{{ $t('clinical360.medications.tab.safety_check') }}</dt><dd>{{ selectedCatalog.warnings }}</dd></div>
            </dl>
            <v-btn v-if="canPrescribe && !readOnly" block small depressed color="#0f766e" dark @click="$emit('prescribe', selectedCatalog)"><v-icon x-small left>mdi-file-document-edit-outline</v-icon>{{ $t('clinical360.medications.tab.use_in_medication_order') }}</v-btn>
          </template>
          <div v-else class="empty-state">{{ $t('clinical360.medications.tab.select_formulary_item') }}</div>
        </aside>
      </div>
    </template>
  </section>
</template>

<script>
import ClinicalHoverCard from '../../ClinicalHoverCard.vue'

const { MEDICATION_CATALOG, findMedicationCatalogItem } = require('../../../../util/medication-catalog.cjs')

export default {
  name: 'Patient360MedicationTab',
  components: { ClinicalHoverCard },
  props: {
    medications: { type: Array, default: () => [] },
    patient: { type: Object, default: () => ({}) },
    role: { type: String, default: '' },
    readOnly: { type: Boolean, default: false }
  },
  data: () => ({ view: 'profile', search: '', catalogSearch: '', selectedClass: '', selectedNeed: '', selectedCatalogId: MEDICATION_CATALOG[0]?.id || '' }),
  computed: {
    catalog() { return MEDICATION_CATALOG },
    canPrescribe() { return ['ADMIN', 'DOCTOR', 'NP', 'MIDWIFE'].includes(this.role) },
    activeCount() { return this.medications.filter(item => !/discontinued|completed|cancelled/i.test(String(item.status || ''))).length },
    pendingCount() { return this.medications.filter(item => /pending|partial/i.test(this.pharmacyStatus(item))).length },
    outOfStockCount() { return this.medications.filter(item => item.inStock === false || /out of stock/i.test(this.pharmacyStatus(item))).length },
    dispensedCount() { return this.medications.filter(item => /^dispensed$/i.test(this.pharmacyStatus(item))).length },
    filteredMedications() {
      const query = this.search.toLowerCase()
      return this.medications.filter(item => !query || `${this.medicationName(item)} ${item.route || ''} ${item.frequency || ''} ${this.pharmacyStatus(item)}`.toLowerCase().includes(query))
    },
    classes() { return [...new Set(this.catalog.map(item => item.medicationClass))].sort() },
    needs() { return [...new Set(this.catalog.flatMap(item => item.needs))].sort() },
    filteredCatalog() {
      const query = this.catalogSearch.toLowerCase()
      return this.catalog.filter(item => {
        if (this.selectedClass && item.medicationClass !== this.selectedClass) return false
        if (this.selectedNeed && !item.needs.includes(this.selectedNeed)) return false
        return !query || `${item.genericName} ${item.medicationClass} ${item.needs.join(' ')} ${item.labels.join(' ')}`.toLowerCase().includes(query)
      })
    },
    selectedCatalog() { return this.catalog.find(item => item.id === this.selectedCatalogId) || this.filteredCatalog[0] || null }
  },
  methods: {
    medicationName(med) { return med.drug || med.medication || med.name || this.$t('clinical360.medications.tab.default_medication') },
    catalogFor(med) { return findMedicationCatalogItem(this.medicationName(med)) },
    educationFor(med) { return med.education || this.catalogFor(med)?.education || this.$t('clinical360.medications.tab.education_not_documented') },
    sideEffectsFor(med) { return med.sideEffects || this.catalogFor(med)?.sideEffects || '' },
    pharmacyStatus(med) { return med.inStock === false ? 'Out of Stock' : (med.dispensingStatus || 'Pending') },
    pharmacyStatusLabel(med) {
      const status = this.pharmacyStatus(med)
      if (status === 'Out of Stock') return this.$t('clinical360.medications.tab.out_of_stock_status')
      if (status === 'Pending') return this.$t('clinical360.medications.tab.pending_status')
      return status
    },
    pharmacyStatusClass(med) { const value = this.pharmacyStatus(med).toLowerCase(); return value.includes('out of stock') ? 'stockout' : value.includes('dispensed') && !value.includes('partial') ? 'complete' : value.includes('partial') ? 'partial' : 'pending' },
    medicationHoverDetails(med) {
      return [
        { label: this.$t('clinical360.medications.tab.col_dose_route'), value: [med.dose || med.dosage, med.route].filter(Boolean).join(' · ') || this.$t('clinical360.medications.tab.per_order') },
        { label: this.$t('clinical360.medications.tab.col_schedule'), value: med.frequency || this.$t('clinical360.medications.tab.not_scheduled') },
        { label: this.$t('clinical360.medications.tab.col_pharmacy'), value: this.pharmacyStatusLabel(med) },
        { label: this.$t('clinical360.medications.tab.col_education'), value: this.educationFor(med) },
        { label: this.$t('clinical360.medications.tab.common_side_effects'), value: this.sideEffectsFor(med) }
      ]
    },
    printMedicationList() {
      if (!process.client) return
      const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]))
      const rows = this.medications.map(med => `<tr><td>${escape(this.medicationName(med))}</td><td>${escape(med.dose || med.dosage || '-')}</td><td>${escape(med.route || '-')}</td><td>${escape(med.frequency || '-')}</td><td>${escape(med.status || this.$t('clinical360.medications.tab.status_active'))}</td><td>${escape(this.pharmacyStatusLabel(med))}</td></tr>`).join('')
      const patientName = this.patient.name || [this.patient.firstName, this.patient.lastName].filter(Boolean).join(' ') || this.$t('clinical360.medications.tab.default_patient')
      const mrn = this.patient.mrn || this.patient.MRN || this.patient.id || '-'
      const popup = window.open('', '_blank', 'width=980,height=720')
      if (!popup) return
      popup.document.write(`<!doctype html><html><head><title>${escape(this.$t('clinical360.medications.tab.print_title', { name: patientName }))}</title><style>body{font-family:Arial,sans-serif;color:#172b31;margin:28px}h1{font-size:20px;margin:0 0 4px}.meta{font-size:12px;margin-bottom:20px;color:#52676c}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #b8c6c8;padding:7px;text-align:left;vertical-align:top}th{background:#e7efef}.footer{margin-top:20px;font-size:10px;color:#64757a}</style></head><body><h1>${escape(this.$t('clinical360.medications.tab.print_heading'))}</h1><div class="meta"><strong>${escape(patientName)}</strong> · ${escape(this.$t('clinical360.medications.tab.print_mrn', { mrn }))} · ${escape(this.$t('clinical360.medications.tab.print_printed', { datetime: new Date().toLocaleString() }))}</div><table><thead><tr><th>${escape(this.$t('clinical360.medications.tab.col_medication'))}</th><th>${escape(this.$t('clinical360.medications.tab.print_col_dose'))}</th><th>${escape(this.$t('clinical360.medications.tab.print_col_route'))}</th><th>${escape(this.$t('clinical360.medications.tab.print_col_frequency'))}</th><th>${escape(this.$t('clinical360.medications.tab.print_col_clinical_status'))}</th><th>${escape(this.$t('clinical360.medications.tab.col_pharmacy'))}</th></tr></thead><tbody>${rows || `<tr><td colspan="6">${escape(this.$t('clinical360.medications.tab.print_no_medication'))}</td></tr>`}</tbody></table><div class="footer">${escape(this.$t('clinical360.medications.tab.print_footer'))}</div></body></html>`)
      popup.document.close()
      popup.focus()
      popup.print()
    }
  }
}
</script>

<style scoped>
.medication-workspace{height:100%;display:flex;flex-direction:column;background:#f5f8f8;color:#18333a;overflow:hidden}.module-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#fff;border-bottom:1px solid #cddbdc}.module-header span,.catalog-detail header span{font-size:10px;font-weight:800;color:#55737a}.module-header h2{margin:1px 0;font-size:18px;line-height:1.15}.module-header p{margin:0;color:#5b7378;font-size:11px}.header-actions{display:flex;gap:6px}.read-only{padding:7px 14px;background:#f1f5f9;border-bottom:1px solid #cbd5e1;font-size:11px;font-weight:700}.view-tabs{display:flex;background:#fff;border-bottom:1px solid #cddbdc}.view-tabs button{padding:9px 15px;border:0;border-right:1px solid #d8e2e3;background:#fff;font-size:11px;font-weight:800;color:#405b61}.view-tabs button.active{background:#eaf5f6;box-shadow:inset 0 -3px #087f79;color:#075e59}.view-tabs strong{margin-left:7px}.summary-strip{display:grid;grid-template-columns:repeat(4,1fr);background:#fff;border-bottom:1px solid #d5e0e1}.summary-strip article{padding:10px 14px;border-right:1px solid #e1e8e9}.summary-strip article.alert{background:#fff1f2}.summary-strip span,.summary-strip small{display:block;font-size:9px;font-weight:800;color:#62797e;text-transform:uppercase}.summary-strip strong{font-size:21px}.filter-bar,.catalog-filters{display:flex;gap:8px;align-items:center;padding:8px 12px;background:#edf3f3;border-bottom:1px solid #d5e0e1}.filter-bar label,.catalog-filters label{display:flex;align-items:center;gap:6px;background:#fff;border:1px solid #bacbcc;padding:5px 9px;width:min(440px,60%)}.filter-bar input,.catalog-filters input{width:100%;border:0;outline:0;font-size:12px}.filter-bar>span{margin-left:auto;font-size:10px;font-weight:800}.catalog-filters select{height:29px;border:1px solid #bacbcc;background:#fff;padding:0 8px;font-size:11px}.medication-table{overflow:auto;background:#fff}.medication-head,.medication-row{display:grid;grid-template-columns:minmax(170px,1.2fr) 130px 140px 150px minmax(230px,1.6fr);gap:9px;align-items:start}.medication-head{position:sticky;top:0;z-index:2;padding:7px 12px;background:#e7efef;border-bottom:1px solid #c7d6d7;font-size:9px;font-weight:800;text-transform:uppercase}.medication-row{padding:10px 12px;border-bottom:1px solid #e1e8e9;font-size:11px}.medication-row span{min-width:0}.medication-row strong,.medication-row small{display:block}.medication-row small{margin-top:3px;color:#61777c}.status{display:inline-block!important;width:max-content;padding:2px 6px;background:#fef3c7;color:#92400e;font-size:9px!important;text-transform:uppercase}.status.complete{background:#dcfce7;color:#166534}.status.partial{background:#ede9fe;color:#6d28d9}.status.stockout{background:#fee2e2;color:#b91c1c}.formulary-notice{display:flex;gap:8px;align-items:flex-start;padding:8px 14px;background:#fffbeb;border-bottom:1px solid #f1d89a;font-size:10px}.catalog-layout{display:grid;grid-template-columns:minmax(360px,1fr) 360px;min-height:0;flex:1}.catalog-list{overflow:auto;background:#fff;border-right:1px solid #cddbdc}.catalog-list button{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 13px;border:0;border-bottom:1px solid #e1e8e9;background:#fff;text-align:left;color:#18333a}.catalog-list button:hover,.catalog-list button.selected{background:#eff8f8}.catalog-list button.selected{box-shadow:inset 3px 0 #087f79}.catalog-list span strong,.catalog-list span small{display:block}.catalog-list span small,.catalog-list em{font-size:10px;color:#61777c;font-style:normal}.catalog-detail{padding:14px;background:#f7faf9;overflow:auto}.catalog-detail header{padding-bottom:11px;border-bottom:1px solid #d5e0e1}.catalog-detail header strong,.catalog-detail header small{display:block}.catalog-detail header strong{font-size:16px}.catalog-detail header small{font-size:11px;color:#61777c}.catalog-detail dl{margin:8px 0 14px}.catalog-detail dl div{padding:7px 0;border-bottom:1px solid #e1e8e9}.catalog-detail dt{font-size:9px;font-weight:800;text-transform:uppercase;color:#657b80}.catalog-detail dd{margin:2px 0 0;font-size:11px}.catalog-detail .warning{padding:8px;background:#fff7ed;border-left:3px solid #c2410c}.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:150px;color:#667e83;font-size:11px}@media(max-width:1100px){.catalog-layout{grid-template-columns:1fr}.catalog-detail{display:none}.medication-head,.medication-row{grid-template-columns:minmax(160px,1.4fr) 110px 120px 130px}.medication-head span:last-child,.medication-row span:last-child{display:none}}@media(max-width:760px){.module-header{align-items:flex-start}.module-header p{display:none}.summary-strip{grid-template-columns:repeat(2,1fr)}.catalog-filters{align-items:stretch;flex-direction:column}.catalog-filters label{width:100%}.medication-head,.medication-row{grid-template-columns:1.4fr 1fr 1fr}.medication-head span:nth-child(4),.medication-row span:nth-child(4){display:none}}
</style>
