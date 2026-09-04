<template>
  <section class="lab-workspace">
    <header class="module-header">
      <div>
        <span>{{ $t('clinical360.labs.tab.section_label') }}</span>
        <h2>{{ mode === 'lab' ? $t('clinical360.labs.tab.title_lab') : $t('clinical360.labs.tab.title_imaging') }}</h2>
        <p>{{ mode === 'lab' ? $t('clinical360.labs.tab.subtitle_lab') : $t('clinical360.labs.tab.subtitle_imaging') }}</p>
      </div>
      <div class="header-actions">
        <v-btn v-if="canOrder && !readOnly" x-small text color="#0369a1" @click="newOrder">
          <v-icon x-small left>mdi-plus</v-icon>{{ $t('clinical360.labs.tab.new_order') }}
        </v-btn>
        <v-btn v-if="canResult && !readOnly" x-small depressed color="#0369a1" dark @click="recordSelected">
          <v-icon x-small left>{{ mode === 'lab' ? 'mdi-flask-check-outline' : 'mdi-radiology-box' }}</v-icon>{{ mode === 'lab' ? $t('clinical360.labs.tab.record_result') : $t('clinical360.labs.tab.file_report') }}
        </v-btn>
      </div>
    </header>

    <div v-if="readOnly" class="read-only"><v-icon x-small>mdi-lock-outline</v-icon> {{ $t('clinical360.labs.tab.read_only_notice') }}</div>

    <div class="diagnostic-tabs" role="tablist" :aria-label="$t('clinical360.labs.tab.diagnostic_result_type')">
      <button type="button" :class="{ active: mode === 'lab' }" @click="switchMode('lab')"><v-icon x-small>mdi-flask-outline</v-icon>{{ $t('clinical360.labs.tab.laboratory') }} <strong>{{ orders.length }}</strong></button>
      <button type="button" :class="{ active: mode === 'imaging' }" @click="switchMode('imaging')"><v-icon x-small>mdi-radiology-box</v-icon>{{ $t('clinical360.labs.tab.imaging') }} <strong>{{ imagingOrders.length }}</strong></button>
    </div>

    <div class="summary-strip" :aria-label="$t('clinical360.labs.tab.aria_diagnostic_summary')">
      <button v-for="item in summary" :key="item.key" type="button" :class="{ active: filter === item.key }" @click="filter = item.key">
        <v-icon small :color="item.color">{{ item.icon }}</v-icon>
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </button>
    </div>

    <div class="filter-bar">
      <label><v-icon x-small>mdi-magnify</v-icon><input v-model.trim="search" type="search" :placeholder="mode === 'lab' ? $t('clinical360.labs.tab.search_placeholder_lab') : $t('clinical360.labs.tab.search_placeholder_imaging')" /></label>
      <span>{{ $t('clinical360.labs.tab.shown_count', { count: filteredOrders.length }) }}</span>
    </div>

    <div class="lab-layout">
      <div class="results-list" role="table" :aria-label="mode === 'lab' ? $t('clinical360.labs.tab.aria_lab_orders') : $t('clinical360.labs.tab.aria_imaging_orders')">
        <div class="result-head" role="row">
          <span>{{ mode === 'lab' ? $t('clinical360.labs.tab.col_test_specimen') : $t('clinical360.labs.tab.col_exam_region') }}</span><span>{{ $t('clinical360.labs.tab.col_priority') }}</span><span>{{ $t('clinical360.labs.tab.col_status') }}</span><span>{{ mode === 'lab' ? $t('clinical360.labs.tab.col_result') : $t('clinical360.labs.tab.col_impression') }}</span><span>{{ mode === 'lab' ? $t('clinical360.labs.tab.col_collected_resulted') : $t('clinical360.labs.tab.col_ordered_reported') }}</span>
        </div>
        <button v-for="order in filteredOrders" :key="order.id" type="button" class="result-row" :class="{ selected: selectedId === order.id }" @click="selectedId = order.id">
          <span><ClinicalHoverCard :title="testName(order)" :eyebrow="mode === 'lab' ? $t('clinical360.labs.tab.laboratory') : $t('clinical360.labs.tab.imaging')" :subtitle="order.status || $t('clinical360.labs.tab.requested')" :details="orderHoverDetails(order)"><template #activator><strong class="detail-trigger">{{ testName(order) }}</strong></template></ClinicalHoverCard><small>{{ specimen(order) }}</small></span>
          <span><b :class="['priority', priorityClass(order.priority)]">{{ order.priority || $t('clinical360.labs.tab.routine') }}</b></span>
          <span><b :class="['status', statusClass(order)]">{{ order.status || $t('clinical360.labs.tab.requested') }}</b></span>
          <span><strong :class="flagClass(order)">{{ resultText(order) }}</strong><small>{{ referenceText(order) }}</small></span>
          <span><small>{{ timingText(order) }}</small></span>
        </button>
        <div v-if="!filteredOrders.length" class="empty-state">
          <v-icon size="36" color="#94a3b8">{{ mode === 'lab' ? 'mdi-flask-empty-outline' : 'mdi-image-search-outline' }}</v-icon>
          <strong>{{ mode === 'lab' ? $t('clinical360.labs.tab.empty_state_lab') : $t('clinical360.labs.tab.empty_state_imaging') }}</strong>
          <span>{{ $t('clinical360.labs.tab.empty_state_hint') }}</span>
        </div>
      </div>

      <aside class="result-detail">
        <template v-if="selectedOrder">
          <header><v-icon color="#0369a1">{{ mode === 'lab' ? 'mdi-flask-outline' : 'mdi-radiology-box' }}</v-icon><div><span>{{ mode === 'lab' ? $t('clinical360.labs.tab.selected_result') : $t('clinical360.labs.tab.selected_report') }}</span><strong>{{ testName(selectedOrder) }}</strong></div></header>
          <dl>
            <div><dt>{{ $t('clinical360.labs.tab.order_status') }}</dt><dd>{{ selectedOrder.status || $t('clinical360.labs.tab.requested') }}</dd></div>
            <div><dt>{{ mode === 'lab' ? $t('clinical360.labs.tab.specimen') : $t('clinical360.labs.tab.body_region') }}</dt><dd>{{ specimen(selectedOrder) }}</dd></div>
            <div><dt>{{ $t('clinical360.labs.tab.col_priority') }}</dt><dd>{{ selectedOrder.priority || $t('clinical360.labs.tab.routine') }}</dd></div>
            <div><dt>{{ $t('clinical360.labs.tab.col_result') }}</dt><dd :class="flagClass(selectedOrder)">{{ resultText(selectedOrder) }}</dd></div>
            <div v-if="mode === 'lab'"><dt>{{ $t('clinical360.labs.tab.reference') }}</dt><dd>{{ selectedOrder.referenceRange || $t('clinical360.labs.tab.not_supplied') }}</dd></div>
            <div><dt>{{ mode === 'lab' ? $t('clinical360.labs.tab.comment') : $t('clinical360.labs.tab.findings_recommendation') }}</dt><dd>{{ detailText(selectedOrder) }}</dd></div>
          </dl>
          <div v-if="isCritical(selectedOrder)" class="critical-note"><v-icon x-small color="#be123c">mdi-alert</v-icon> {{ $t('clinical360.labs.tab.critical_note') }}</div>
          <v-btn v-if="canResult && !readOnly" block small depressed color="#0369a1" dark @click="recordSelected">{{ mode === 'lab' ? $t('clinical360.labs.tab.record_validate_result') : $t('clinical360.labs.tab.file_imaging_report') }}</v-btn>
        </template>
        <div v-else class="detail-empty">{{ $t('clinical360.labs.tab.select_diagnostic_item') }}</div>
      </aside>
    </div>
  </section>
</template>

<script>
import ClinicalHoverCard from '../../ClinicalHoverCard.vue'

export default {
  name: 'Patient360LabResultsTab',
  components: { ClinicalHoverCard },
  props: {
    orders: { type: Array, default: () => [] },
    imagingOrders: { type: Array, default: () => [] },
    role: { type: String, default: '' },
    readOnly: { type: Boolean, default: false }
  },
  data: () => ({ mode: 'lab', filter: 'all', search: '', selectedId: '' }),
  computed: {
    activeOrders() { return this.mode === 'lab' ? this.orders : this.imagingOrders },
    canResult() { return this.mode === 'lab' ? ['ADMIN', 'LAB'].includes(this.role) : ['ADMIN', 'IMAGING'].includes(this.role) },
    canOrder() { return ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR'].includes(this.role) },
    selectedOrder() { return this.activeOrders.find(item => item.id === this.selectedId) || this.filteredOrders[0] || null },
    summary() {
      return [
        { key: 'all', label: this.mode === 'lab' ? this.$t('clinical360.labs.tab.all_tests') : this.$t('clinical360.labs.tab.all_exams'), value: this.activeOrders.length, icon: this.mode === 'lab' ? 'mdi-flask-outline' : 'mdi-radiology-box', color: '#0369a1' },
        { key: 'pending', label: this.$t('clinical360.labs.tab.pending'), value: this.activeOrders.filter(item => !this.isComplete(item)).length, icon: 'mdi-clock-outline', color: '#b45309' },
        { key: 'abnormal', label: this.mode === 'lab' ? this.$t('clinical360.labs.tab.abnormal') : this.$t('clinical360.labs.tab.significant'), value: this.activeOrders.filter(item => this.isAbnormal(item)).length, icon: 'mdi-trending-up', color: '#c2410c' },
        { key: 'critical', label: this.$t('clinical360.labs.tab.critical'), value: this.activeOrders.filter(item => this.isCritical(item)).length, icon: 'mdi-alert-octagon-outline', color: '#be123c' }
      ]
    },
    filteredOrders() {
      const query = this.search.toLowerCase()
      return this.activeOrders.filter(item => {
        if (this.filter === 'pending' && this.isComplete(item)) return false
        if (this.filter === 'abnormal' && !this.isAbnormal(item)) return false
        if (this.filter === 'critical' && !this.isCritical(item)) return false
        return !query || `${this.testName(item)} ${this.specimen(item)} ${this.resultText(item)}`.toLowerCase().includes(query)
      })
    }
  },
  watch: {
    activeOrders: { immediate: true, handler(items) { if (!items.some(item => item.id === this.selectedId)) this.selectedId = items[0]?.id || '' } }
  },
  methods: {
    switchMode(mode) { this.mode = mode; this.filter = 'all'; this.search = ''; this.selectedId = '' },
    testName(order) { return this.mode === 'lab' ? (order.test || order.testName || order.orderName || order.title || this.$t('clinical360.labs.tab.default_laboratory_test')) : (order.exam || order.modality || order.study || order.orderName || order.title || this.$t('clinical360.labs.tab.default_imaging_exam')) },
    specimen(order) { return this.mode === 'lab' ? (order.specimen || order.specimenType || order.sample || this.$t('clinical360.labs.tab.specimen_not_documented')) : (order.bodyPart || order.region || order.anatomicalRegion || order.indication || this.$t('clinical360.labs.tab.body_region_not_documented')) },
    resultText(order) { return this.mode === 'lab' ? ([order.result || order.value, order.unit].filter(Boolean).join(' ') || this.$t('clinical360.labs.tab.pending')) : (order.impression || order.result || order.report || this.$t('clinical360.labs.tab.report_pending')) },
    referenceText(order) { return order.referenceRange ? this.$t('clinical360.labs.tab.reference_value', { range: order.referenceRange }) : (order.flag || '') },
    detailText(order) { return this.mode === 'lab' ? (order.comment || order.instructions || this.$t('clinical360.labs.tab.no_lab_comment')) : ([order.findings, order.recommendation, order.instructions].filter(Boolean).join(' · ') || this.$t('clinical360.labs.tab.no_imaging_findings')) },
    timingText(order) { const value = this.mode === 'lab' ? (order.resultedAt || order.collectedAt || order.updatedAt || order.createdAt) : (order.reportedAt || order.performedAt || order.updatedAt || order.createdAt); return value ? new Date(value).toLocaleString() : (this.mode === 'lab' ? this.$t('clinical360.labs.tab.not_collected') : this.$t('clinical360.labs.tab.not_performed')) },
    isComplete(order) { return /complete|result|validated|reported|cancel/i.test(String(order.status || '')) || Boolean(order.result || order.value || order.report || order.findings || order.impression) },
    resultSignals(order) { return `${order.interpretation || ''} ${order.flag || ''} ${order.severity || ''} ${order.urgency || ''} ${order.status || ''} ${order.result || order.value || ''} ${order.comment || order.notes || ''} ${order.findings || ''} ${order.impression || ''}` },
    isAbnormal(order) { return /low|high|abnormal|critical|panic|important|urgent|significant|positive|detected|reactive/i.test(this.resultSignals(order)) },
    isCritical(order) { return /critical|panic|life[- ]?threatening|anaphyl|severe/i.test(this.resultSignals(order)) },
    statusClass(order) { return this.isCritical(order) ? 'critical' : this.isComplete(order) ? 'complete' : /collect|progress/i.test(String(order.status || '')) ? 'progress' : 'pending' },
    flagClass(order) { return this.isCritical(order) ? 'critical-text' : this.isAbnormal(order) ? 'abnormal-text' : '' },
    priorityClass(priority) { return /stat|urgent/i.test(String(priority || '')) ? 'urgent' : '' },
    newOrder() { this.$emit(this.mode === 'lab' ? 'new-order' : 'new-imaging-order') },
    recordSelected() { this.$emit(this.mode === 'lab' ? 'record-result' : 'record-imaging-result', { orderId: this.selectedOrder?.id || '' }) }
    ,orderHoverDetails(order) {
      return [
        { label: this.$t('clinical360.labs.tab.order_status'), value: order.status || this.$t('clinical360.labs.tab.requested') },
        { label: this.mode === 'lab' ? this.$t('clinical360.labs.tab.specimen') : this.$t('clinical360.labs.tab.body_region'), value: this.specimen(order) },
        { label: this.$t('clinical360.labs.tab.col_priority'), value: order.priority || this.$t('clinical360.labs.tab.routine') },
        { label: this.mode === 'lab' ? this.$t('clinical360.labs.tab.col_result') : this.$t('clinical360.labs.tab.col_impression'), value: this.resultText(order) },
        { label: this.$t('clinical360.labs.tab.comment'), value: this.detailText(order) }
      ]
    }
  }
}
</script>

<style scoped>
.lab-workspace{height:100%;display:flex;flex-direction:column;background:#f5f8f8;color:#18333a;overflow:hidden}.module-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#fff;border-bottom:1px solid #cddbdc}.module-header span,.result-detail header span{font-size:10px;font-weight:800;color:#55737a}.module-header h2{margin:1px 0;font-size:18px;line-height:1.15}.module-header p{margin:0;color:#5b7378;font-size:11px}.header-actions{display:flex;gap:6px}.read-only{padding:7px 14px;background:#f1f5f9;border-bottom:1px solid #cbd5e1;font-size:11px;font-weight:700}.diagnostic-tabs{display:flex;background:#fff;border-bottom:1px solid #cddbdc}.diagnostic-tabs button{display:flex;align-items:center;gap:6px;padding:8px 14px;border:0;border-right:1px solid #d8e2e3;background:#fff;color:#405b61;font-size:11px;font-weight:800}.diagnostic-tabs button.active{background:#eaf5f6;box-shadow:inset 0 -3px #087f79;color:#075e59}.diagnostic-tabs strong{margin-left:5px}.summary-strip{display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));background:#fff;border-bottom:1px solid #d5e0e1}.summary-strip button{height:58px;display:grid;grid-template-columns:28px 1fr auto;align-items:center;text-align:left;padding:0 14px;border:0;border-right:1px solid #e1e8e9;background:#fff}.summary-strip button.active{background:#eaf5f6;box-shadow:inset 0 -3px #087f79}.summary-strip span{font-size:11px;font-weight:700}.summary-strip strong{font-size:20px}.filter-bar{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#edf3f3;border-bottom:1px solid #d5e0e1}.filter-bar label{display:flex;align-items:center;gap:6px;background:#fff;border:1px solid #bacbcc;padding:5px 9px;width:min(420px,60%)}.filter-bar input{width:100%;border:0;outline:0;font-size:12px}.filter-bar>span{font-size:10px;font-weight:800;color:#60777c}.lab-layout{display:grid;grid-template-columns:minmax(620px,1fr) 300px;min-height:0;flex:1}.results-list{overflow:auto;background:#fff;border-right:1px solid #cddbdc}.result-head,.result-row{display:grid;grid-template-columns:minmax(190px,1.5fr) 86px 100px minmax(140px,1fr) 150px;gap:8px;align-items:center}.result-head{position:sticky;top:0;z-index:2;padding:7px 12px;background:#e7efef;border-bottom:1px solid #c7d6d7;font-size:10px;font-weight:800;text-transform:uppercase}.result-row{width:100%;padding:10px 12px;border:0;border-bottom:1px solid #e1e8e9;background:#fff;text-align:left;color:#18333a}.result-row:hover,.result-row.selected{background:#eff8f8}.result-row.selected{box-shadow:inset 3px 0 #087f79}.result-row span{min-width:0;font-size:11px}.result-row strong,.result-row small{display:block;overflow:hidden;text-overflow:ellipsis}.result-row small{margin-top:2px;color:#61777c}.status,.priority{display:inline-block!important;width:max-content;padding:2px 6px;background:#edf2f3;color:#38545a;font-size:9px!important;text-transform:uppercase}.status.complete{background:#dcfce7;color:#166534}.status.pending{background:#fef3c7;color:#92400e}.status.progress{background:#dbeafe;color:#1d4ed8}.status.critical,.priority.urgent{background:#fee2e2;color:#b91c1c}.critical-text{color:#be123c!important}.abnormal-text{color:#c2410c!important}.result-detail{padding:14px;background:#f7faf9;overflow:auto}.result-detail header{display:flex;gap:9px;align-items:center;padding-bottom:12px;border-bottom:1px solid #d5e0e1}.result-detail header strong{display:block;font-size:14px}.result-detail dl{margin:8px 0 14px}.result-detail dl div{padding:7px 0;border-bottom:1px solid #e1e8e9}.result-detail dt{font-size:9px;font-weight:800;text-transform:uppercase;color:#657b80}.result-detail dd{margin:2px 0 0;font-size:11px;font-weight:700}.critical-note{padding:8px;margin:0 0 12px;background:#fff1f2;border-left:3px solid #be123c;font-size:10px;font-weight:700}.empty-state,.detail-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;min-height:180px;color:#667e83;font-size:11px}.detail-empty{height:100%;text-align:center}@media(max-width:1100px){.lab-layout{grid-template-columns:1fr}.result-detail{display:none}.summary-strip{grid-template-columns:repeat(2,1fr)}}
</style>
