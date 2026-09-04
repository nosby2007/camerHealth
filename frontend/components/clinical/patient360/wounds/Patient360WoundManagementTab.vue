<template>
  <section class="wound-shell">
    <header class="workspace-head">
      <div>
        <small>{{ $t('clinical360.wounds.tab.skin_integrity') }}</small>
        <h2>{{ $t('clinical360.wounds.tab.wound_management') }}</h2>
        <p>{{ $t('clinical360.wounds.tab.header_subtitle') }}</p>
      </div>
      <v-btn v-if="!readOnly" x-small depressed color="#0f766e" dark @click="$emit('open-wound')">
        <v-icon x-small left>mdi-bandage</v-icon>{{ $t('clinical360.wounds.tab.new_wound') }}
      </v-btn>
    </header>

    <div class="metric-strip" :aria-label="$t('clinical360.wounds.tab.wound_status_summary')">
      <span><b>{{ wounds.length }}</b><small>{{ $t('clinical360.wounds.tab.total_wounds') }}</small></span>
      <span><b>{{ activeCount }}</b><small>{{ $t('clinical360.wounds.tab.active') }}</small></span>
      <span :class="{ alert: worseningCount }"><b>{{ worseningCount }}</b><small>{{ $t('clinical360.wounds.tab.worsening') }}</small></span>
      <span><b>{{ photoCount }}</b><small>{{ $t('clinical360.wounds.tab.photos') }}</small></span>
      <span><b>{{ dischargeReadiness }}%</b><small>{{ $t('clinical360.wounds.tab.discharge_ready') }}</small></span>
    </div>

    <div class="wound-workspace-grid">
      <nav class="wound-rail" :aria-label="$t('clinical360.wounds.tab.wound_management_sections')">
        <button type="button" :class="['milestone-link', { active: activeSection === 'milestones' }]" @click="selectSection('milestones')">
          <v-icon x-small>mdi-flag-checkered</v-icon>
          <span><strong>{{ $t('clinical360.wounds.tab.discharge_milestones') }}</strong><small>{{ $t('clinical360.wounds.tab.and_delays') }}</small></span>
          <em>{{ completedMilestones }}/{{ dischargeMilestones.length }}</em>
        </button>
        <div v-for="group in navigationGroups" :key="group.label" class="rail-group">
          <strong>{{ group.label }}</strong>
          <button v-for="item in group.items" :key="item.key" type="button" :class="{ active: activeSection === item.key }" @click="selectSection(item.key)">
            <v-icon x-small>{{ item.icon }}</v-icon><span>{{ item.label }}</span><i>{{ item.count }}</i>
          </button>
        </div>
      </nav>

      <main class="wound-content">
        <header class="content-head">
          <div><small>{{ sectionMeta.eyebrow }}</small><h3>{{ sectionMeta.title }}</h3><p>{{ sectionMeta.description }}</p></div>
          <v-btn v-if="activeSection === 'documentation' && !readOnly" x-small depressed color="#0f766e" dark @click="$emit('open-wound', selectedWound)">
            <v-icon x-small left>mdi-note-plus</v-icon>{{ $t('clinical360.wounds.tab.file_assessment') }}
          </v-btn>
        </header>

        <template v-if="activeSection === 'milestones'">
          <section class="readiness-band">
            <div><span>{{ $t('clinical360.wounds.tab.wound_discharge_readiness') }}</span><strong>{{ dischargeReadiness }}%</strong></div>
            <div class="readiness-track"><i :style="{ width: dischargeReadiness + '%' }"></i></div>
            <small>{{ activeCount ? $t('clinical360.wounds.tab.active_wounds_require_continuity', { count: activeCount }) : $t('clinical360.wounds.tab.no_active_wound_prevents_discharge') }}</small>
          </section>
          <section class="row-panel">
            <header><strong>{{ $t('clinical360.wounds.tab.milestones') }}</strong><span>{{ $t('clinical360.wounds.tab.required_before_discharge') }}</span></header>
            <button v-for="milestone in dischargeMilestones" :key="milestone.key" type="button" class="clinical-row" @click="selectSection(milestone.target)">
              <v-icon small :color="statusColor(milestone.status)">{{ statusIcon(milestone.status) }}</v-icon>
              <span><strong>{{ milestone.label }}</strong><small>{{ milestone.detail }}</small></span>
              <em :class="milestone.status">{{ milestone.status }}</em><v-icon x-small>mdi-chevron-right</v-icon>
            </button>
          </section>
          <section class="row-panel delay-panel">
            <header><strong>{{ $t('clinical360.wounds.tab.delays_and_blockers') }}</strong><span>{{ $t('clinical360.wounds.tab.open_count', { count: dischargeDelays.length }) }}</span></header>
            <div v-if="!dischargeDelays.length" class="clear-state"><v-icon small color="#047857">mdi-check-circle</v-icon>{{ $t('clinical360.wounds.tab.no_discharge_delay') }}</div>
            <div v-for="delay in dischargeDelays" :key="delay" class="delay-row"><v-icon small color="#b45309">mdi-alert-outline</v-icon>{{ delay }}</div>
          </section>
        </template>

        <template v-else-if="activeSection === 'overview'">
          <section v-if="wounds.length" class="wound-list">
            <button v-for="wound in wounds" :key="wound.id" type="button" :class="['wound-list-row', { active: selectedWound && selectedWound.id === wound.id }]" @click="selectWound(wound)">
              <span class="wound-number">{{ woundSequence(wound) }}</span>
              <span><strong>{{ wound.woundType || $t('clinical360.wounds.tab.wound') }}</strong><small>{{ wound.anatomicalLocation || $t('clinical360.wounds.tab.location_not_documented') }}</small></span>
              <span><small>{{ $t('clinical360.wounds.tab.latest_measurement') }}</small><strong>{{ measurement(wound) }}</strong></span>
              <span><small>{{ $t('clinical360.wounds.tab.last_assessment') }}</small><strong>{{ lastDate(wound) }}</strong></span>
              <em :class="statusClass(wound.status)">{{ wound.status || $t('clinical360.wounds.tab.status_active') }}</em>
            </button>
          </section>
          <div v-else class="empty-state"><v-icon size="42" color="#94a3b8">mdi-bandage</v-icon><strong>{{ $t('clinical360.wounds.tab.no_wound_documented') }}</strong><span>{{ $t('clinical360.wounds.tab.no_wound_documented_hint') }}</span></div>
        </template>

        <template v-else-if="activeSection === 'documentation'">
          <div class="documentation-filter">
            <label>{{ $t('clinical360.wounds.tab.wound') }}
              <select v-model="documentationWoundId">
                <option value="all">{{ $t('clinical360.wounds.tab.all_wounds') }}</option>
                <option v-for="wound in wounds" :key="wound.id" :value="wound.id">{{ wound.woundType || $t('clinical360.wounds.tab.wound') }} - {{ wound.anatomicalLocation || $t('clinical360.wounds.tab.unknown_location') }}</option>
              </select>
            </label>
            <span>{{ $t('clinical360.wounds.tab.assessment_count', { count: documentationRows.length }) }}</span>
          </div>
          <section v-if="documentationRows.length" class="assessment-table">
            <div class="assessment-row heading"><span>{{ $t('clinical360.wounds.tab.col_date_clinician') }}</span><span>{{ $t('clinical360.wounds.tab.wound') }}</span><span>{{ $t('clinical360.wounds.tab.col_dimensions') }}</span><span>{{ $t('clinical360.wounds.tab.col_drainage_dressing') }}</span><span>{{ $t('clinical360.wounds.tab.col_pain') }}</span></div>
            <button v-for="row in documentationRows" :key="row.id" type="button" class="assessment-row" @click="openAssessment(row)">
              <span><strong>{{ formatDate(row.recordedAt || row.assessedAt || row.createdAt) }}</strong><small>{{ row.createdBy || $t('clinical360.wounds.tab.clinician') }}</small></span>
              <span><strong>{{ woundLabel(row.woundId) }}</strong><small>{{ row.woundStatus || $t('clinical360.wounds.tab.status_not_filed') }}</small></span>
              <span>{{ assessmentMeasurement(row) }}</span>
              <span>{{ row.drainageAmount || $t('clinical360.wounds.tab.not_filed') }}<small>{{ row.dressingType || $t('clinical360.wounds.tab.dressing_not_filed') }}</small></span>
              <span>{{ row.painScore !== undefined && row.painScore !== null ? row.painScore + '/10' : '-' }}</span>
            </button>
          </section>
          <div v-else class="empty-state"><v-icon size="38" color="#94a3b8">mdi-clipboard-text-outline</v-icon><strong>{{ $t('clinical360.wounds.tab.no_assessment_in_view') }}</strong><span>{{ $t('clinical360.wounds.tab.no_assessment_in_view_hint') }}</span></div>
        </template>

        <template v-else>
          <section class="discharge-summary">
            <div><small>{{ $t('clinical360.wounds.tab.active_wounds_label') }}</small><strong>{{ activeCount }}</strong><span>{{ activeCount ? $t('clinical360.wounds.tab.continuity_plan_required') : $t('clinical360.wounds.tab.no_active_wound') }}</span></div>
            <div><small>{{ $t('clinical360.wounds.tab.documentation_label') }}</small><strong>{{ completedMilestones }}/{{ dischargeMilestones.length }}</strong><span>{{ $t('clinical360.wounds.tab.milestones_complete') }}</span></div>
            <div><small>{{ $t('clinical360.wounds.tab.readiness_label') }}</small><strong>{{ dischargeReadiness }}%</strong><span>{{ $t('clinical360.wounds.tab.wound_discharge_readiness') }}</span></div>
          </section>
          <section class="row-panel">
            <header><strong>{{ $t('clinical360.wounds.tab.discharge_documentation') }}</strong><span>{{ $t('clinical360.wounds.tab.review_every_active_wound') }}</span></header>
            <div v-for="item in dischargeRequirements" :key="item.label" class="requirement-row">
              <v-icon small :color="item.complete ? '#047857' : '#b45309'">{{ item.complete ? 'mdi-check-circle' : 'mdi-clock-alert-outline' }}</v-icon>
              <span><strong>{{ item.label }}</strong><small>{{ item.detail }}</small></span>
              <em :class="item.complete ? 'complete' : 'pending'">{{ item.complete ? $t('clinical360.wounds.tab.complete') : $t('clinical360.wounds.tab.required') }}</em>
            </div>
          </section>
          <v-alert v-if="activeCount" dense tile outlined color="#b45309" class="mt-3 mb-0 wound-alert">{{ $t('clinical360.wounds.tab.discharge_handoff_notice') }}</v-alert>
        </template>
      </main>

      <aside class="wound-context">
        <template v-if="selectedWound">
          <header><small>{{ $t('clinical360.wounds.tab.selected_wound') }}</small><strong>{{ selectedWound.woundType || $t('clinical360.wounds.tab.wound') }}</strong><span>{{ selectedWound.anatomicalLocation || $t('clinical360.wounds.tab.location_not_documented') }}</span></header>
          <dl>
            <div><dt>{{ $t('clinical360.wounds.tab.status') }}</dt><dd :class="statusClass(selectedWound.status)">{{ selectedWound.status || $t('clinical360.wounds.tab.status_active') }}</dd></div>
            <div><dt>{{ $t('clinical360.wounds.tab.acquired') }}</dt><dd>{{ cleanLabel(selectedWound.acquiredLocation || $t('clinical360.wounds.tab.unknown')) }}</dd></div>
            <div><dt>{{ $t('clinical360.wounds.tab.last_measured') }}</dt><dd>{{ measurement(selectedWound) }}</dd></div>
            <div><dt>{{ $t('clinical360.wounds.tab.last_assessed') }}</dt><dd>{{ lastDate(selectedWound) }}</dd></div>
            <div><dt>{{ $t('clinical360.wounds.tab.photos') }}</dt><dd>{{ woundPhotoCount(selectedWound) }}</dd></div>
          </dl>
          <section class="latest-assessment">
            <strong>{{ $t('clinical360.wounds.tab.latest_assessment') }}</strong>
            <template v-if="latest(selectedWound).id">
              <p><span>{{ $t('clinical360.wounds.tab.drainage') }}</span>{{ cleanLabel(latest(selectedWound).drainageAmount || $t('clinical360.wounds.tab.not_filed_lower')) }}</p>
              <p><span>{{ $t('clinical360.wounds.tab.dressing') }}</span>{{ latest(selectedWound).dressingType || $t('clinical360.wounds.tab.not_filed') }}</p>
              <p><span>{{ $t('clinical360.wounds.tab.pain') }}</span>{{ latest(selectedWound).painScore !== undefined ? latest(selectedWound).painScore + '/10' : $t('clinical360.wounds.tab.not_filed') }}</p>
              <p><span>{{ $t('clinical360.wounds.tab.plan') }}</span>{{ latest(selectedWound).treatmentPlan || $t('clinical360.wounds.tab.not_filed') }}</p>
            </template>
            <p v-else>{{ $t('clinical360.wounds.tab.no_assessment_filed') }}</p>
          </section>
          <v-alert v-if="latest(selectedWound).warningAreaIncreased" dense tile color="#fff1f2" class="trend-alert"><v-icon small color="#be123c">mdi-trending-up</v-icon>{{ $t('clinical360.wounds.tab.surface_area_increased') }}</v-alert>
          <v-btn block small depressed :color="readOnly ? '#475569' : '#0f766e'" dark @click="$emit('open-wound', selectedWound)">
            <v-icon small left>{{ readOnly ? 'mdi-eye-outline' : 'mdi-clipboard-edit-outline' }}</v-icon>{{ readOnly ? $t('clinical360.wounds.tab.review_record') : $t('clinical360.wounds.tab.document_assessment') }}
          </v-btn>
        </template>
        <div v-else class="context-empty"><v-icon size="34" color="#94a3b8">mdi-cursor-default-click-outline</v-icon><strong>{{ $t('clinical360.wounds.tab.select_a_wound') }}</strong><span>{{ $t('clinical360.wounds.tab.select_a_wound_hint') }}</span></div>
      </aside>
    </div>
  </section>
</template>

<script>
export default {
  name: 'Patient360WoundManagementTab',
  props: {
    wounds: { type: Array, default: () => [] },
    assessments: { type: Object, default: () => ({}) },
    photos: { type: Array, default: () => [] },
    readOnly: Boolean
  },
  data() { return { activeSection: 'milestones', selectedWoundId: '', documentationWoundId: 'all' } },
  computed: {
    activeCount() { return this.wounds.filter(item => !this.isResolved(item)).length },
    worseningCount() { return this.wounds.filter(item => /worsen/i.test(item.status || '')).length },
    photoCount() { return this.wounds.reduce((total, wound) => total + this.woundPhotoCount(wound), 0) },
    selectedWound() { return this.wounds.find(item => item.id === this.selectedWoundId) || this.wounds[0] || null },
    navigationGroups() { return [
      { label: this.$t('clinical360.wounds.tab.nav_overview'), items: [{ key: 'overview', label: this.$t('clinical360.wounds.tab.nav_skin_wound_overview'), icon: 'mdi-view-dashboard-outline', count: this.wounds.length }] },
      { label: this.$t('clinical360.wounds.tab.nav_documentation'), items: [{ key: 'documentation', label: this.$t('clinical360.wounds.tab.nav_assessments_and_photos'), icon: 'mdi-clipboard-text-outline', count: this.allAssessments.length }] },
      { label: this.$t('clinical360.wounds.tab.nav_discharge'), items: [{ key: 'discharge', label: this.$t('clinical360.wounds.tab.nav_continuity_and_instructions'), icon: 'mdi-exit-run', count: this.dischargeDelays.length }] }
    ] },
    sectionMeta() { return {
      milestones: { eyebrow: this.$t('clinical360.wounds.tab.eyebrow_milestones'), title: this.$t('clinical360.wounds.tab.title_milestones'), description: this.$t('clinical360.wounds.tab.description_milestones') },
      overview: { eyebrow: this.$t('clinical360.wounds.tab.nav_overview'), title: this.$t('clinical360.wounds.tab.title_overview'), description: this.$t('clinical360.wounds.tab.description_overview') },
      documentation: { eyebrow: this.$t('clinical360.wounds.tab.nav_documentation'), title: this.$t('clinical360.wounds.tab.title_documentation'), description: this.$t('clinical360.wounds.tab.description_documentation') },
      discharge: { eyebrow: this.$t('clinical360.wounds.tab.nav_discharge'), title: this.$t('clinical360.wounds.tab.title_discharge'), description: this.$t('clinical360.wounds.tab.description_discharge') }
    }[this.activeSection] },
    allAssessments() { return Object.keys(this.assessments).reduce((rows, woundId) => rows.concat((this.assessments[woundId] || []).map(item => ({ ...item, woundId: item.woundId || woundId }))), []).sort((a, b) => new Date(b.recordedAt || b.assessedAt || b.createdAt || 0) - new Date(a.recordedAt || a.assessedAt || a.createdAt || 0)) },
    documentationRows() { return this.documentationWoundId === 'all' ? this.allAssessments : this.allAssessments.filter(item => item.woundId === this.documentationWoundId) },
    dischargeRequirements() {
      const active = this.wounds.filter(item => !this.isResolved(item)); const assessments = active.map(item => this.latest(item))
      return [
        { label: this.$t('clinical360.wounds.tab.req_status_lda_review'), complete: !active.length || active.every(item => item.status && item.anatomicalLocation), detail: active.length ? this.$t('clinical360.wounds.tab.req_status_lda_review_detail_active', { count: active.length }) : this.$t('clinical360.wounds.tab.req_status_lda_review_detail_resolved') },
        { label: this.$t('clinical360.wounds.tab.req_current_assessment'), complete: !active.length || assessments.every(item => item.id), detail: this.$t('clinical360.wounds.tab.req_current_assessment_detail') },
        { label: this.$t('clinical360.wounds.tab.req_photo_documentation'), complete: !active.length || active.every(item => this.woundPhotoCount(item) > 0), detail: this.$t('clinical360.wounds.tab.req_photo_documentation_detail') },
        { label: this.$t('clinical360.wounds.tab.req_dressing_treatment_instructions'), complete: !active.length || assessments.every(item => item.dressingType && item.treatmentPlan), detail: this.$t('clinical360.wounds.tab.req_dressing_treatment_instructions_detail') },
        { label: this.$t('clinical360.wounds.tab.req_followup_ownership_supplies'), complete: !active.length || assessments.every(item => item.followUpOwner && item.supplyPlan && item.dischargeInstructions), detail: this.$t('clinical360.wounds.tab.req_followup_ownership_supplies_detail') }
      ]
    },
    dischargeMilestones() { return this.dischargeRequirements.map((item, index) => ({ key: `milestone-${index}`, label: item.label, detail: item.detail, status: item.complete ? 'complete' : (index === 0 && this.worseningCount ? 'blocked' : 'pending'), target: index === 0 ? 'overview' : (index < 4 ? 'documentation' : 'discharge') })) },
    completedMilestones() { return this.dischargeMilestones.filter(item => item.status === 'complete').length },
    dischargeReadiness() { return Math.round((this.completedMilestones / Math.max(this.dischargeMilestones.length, 1)) * 100) },
    dischargeDelays() {
      const delays = []; if (this.worseningCount) delays.push(this.$t('clinical360.wounds.tab.delay_worsening_wounds', { count: this.worseningCount }))
      this.wounds.filter(item => !this.isResolved(item)).forEach(wound => { const assessment = this.latest(wound); const label = `${wound.woundType || this.$t('clinical360.wounds.tab.wound')} - ${wound.anatomicalLocation || this.$t('clinical360.wounds.tab.unknown_location')}`; if (!assessment.id) delays.push(this.$t('clinical360.wounds.tab.delay_no_current_assessment', { label })); else if (!assessment.treatmentPlan || !assessment.dressingType) delays.push(this.$t('clinical360.wounds.tab.delay_treatment_dressing_incomplete', { label })); else if (!assessment.followUpOwner || !assessment.supplyPlan || !assessment.dischargeInstructions) delays.push(this.$t('clinical360.wounds.tab.delay_discharge_continuity_incomplete', { label })); if (!this.woundPhotoCount(wound)) delays.push(this.$t('clinical360.wounds.tab.delay_photo_not_filed', { label })) })
      return delays
    }
  },
  watch: { wounds: { immediate: true, handler(items) { if (!items.some(item => item.id === this.selectedWoundId)) this.selectedWoundId = items[0] ? items[0].id : '' } } },
  methods: {
    selectSection(section) { this.activeSection = section }, selectWound(wound) { this.selectedWoundId = wound.id },
    openAssessment(row) { const wound = this.wounds.find(item => item.id === row.woundId); if (wound) { this.selectWound(wound); this.$emit('open-wound', wound) } },
    isResolved(wound) { return /healed|closed|resolved/i.test(wound.status || '') },
    latest(wound) { const list = this.assessments[wound.id] || []; return [...list].sort((a, b) => new Date(b.recordedAt || b.assessedAt || b.createdAt || 0) - new Date(a.recordedAt || a.assessedAt || a.createdAt || 0))[0] || {} },
    measurement(wound) { return this.assessmentMeasurement(this.latest(wound)) },
    assessmentMeasurement(item) { return [item.lengthCm, item.widthCm, item.depthCm].every(value => value !== undefined && value !== null) ? `${item.lengthCm} x ${item.widthCm} x ${item.depthCm} cm` : this.$t('clinical360.wounds.tab.not_measured') },
    lastDate(wound) { const item = this.latest(wound); return item.id ? this.formatDate(item.recordedAt || item.assessedAt || item.createdAt) : this.$t('clinical360.wounds.tab.no_assessment') },
    formatDate(value) { if (!value) return this.$t('clinical360.wounds.tab.not_filed'); const date = new Date(value); return Number.isNaN(date.getTime()) ? this.$t('clinical360.wounds.tab.not_filed') : date.toLocaleString() },
    woundPhotoCount(wound) {
      const embedded = (this.assessments[wound.id] || []).reduce((total, item) => total + (item.photos || []).length, 0)
      const stored = this.photos.filter(item => item.woundId === wound.id).length
      return Math.max(embedded, stored)
    },
    woundLabel(woundId) { const wound = this.wounds.find(item => item.id === woundId); return wound ? `${wound.woundType || this.$t('clinical360.wounds.tab.wound')} - ${wound.anatomicalLocation || this.$t('clinical360.wounds.tab.unknown_location')}` : this.$t('clinical360.wounds.tab.wound_record') },
    woundSequence(wound) { return String(this.wounds.findIndex(item => item.id === wound.id) + 1).padStart(2, '0') }, cleanLabel(value) { return String(value).replace(/_/g, ' ') },
    statusClass(value) { return /worsen|blocked/i.test(value) ? 'danger' : /heal|closed|resolved|complete/i.test(value) ? 'good' : 'warning' },
    statusColor(status) { return status === 'complete' ? '#047857' : status === 'blocked' ? '#be123c' : '#b45309' }, statusIcon(status) { return status === 'complete' ? 'mdi-check-circle' : status === 'blocked' ? 'mdi-alert-circle' : 'mdi-clock-outline' }
  }
}
</script>

<style scoped>
.wound-shell{min-height:100%;padding:12px;color:#16324f;background:#eef5f4}.workspace-head{min-height:64px;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:10px 12px;border:1px solid #b7c9c6;border-left:5px solid #0f766e;background:#f8fbfb}.workspace-head small,.content-head small{color:#0f766e;font-size:9px;font-weight:900}.workspace-head h2{margin:1px 0;color:#134e4a;font-size:18px}.workspace-head p,.content-head p{margin:0;color:#64748b;font-size:11px}.metric-strip{min-height:56px;display:grid;grid-template-columns:repeat(5,minmax(90px,1fr));margin-top:8px;border:1px solid #b7c9c6;background:#fff}.metric-strip>span{display:flex;flex-direction:column;justify-content:center;padding:8px 12px;border-right:1px solid #d7e0df}.metric-strip>span:last-child{border-right:0}.metric-strip b{color:#0f766e;font-size:19px}.metric-strip small{color:#64748b;font-size:9px;font-weight:900;text-transform:uppercase}.metric-strip .alert b{color:#be123c}
.wound-workspace-grid{min-height:560px;display:grid;grid-template-columns:178px minmax(0,1fr) 238px;gap:8px;margin-top:8px}.wound-rail,.wound-content,.wound-context{min-width:0;border:1px solid #b7c9c6;background:#fff}.wound-rail{padding:8px 0}.milestone-link,.rail-group button{width:100%;border:0;background:transparent;color:#365469;cursor:pointer;text-align:left}.milestone-link{display:grid;grid-template-columns:18px minmax(0,1fr) auto;gap:6px;align-items:center;min-height:54px;padding:7px 9px;border-bottom:1px solid #d7e0df}.milestone-link span{display:flex;flex-direction:column}.milestone-link strong{font-size:10px}.milestone-link small{font-size:9px}.milestone-link em,.rail-group i{min-width:19px;padding:2px 4px;color:#0f766e;background:#dff4f0;font-size:9px;font-style:normal;font-weight:900;text-align:center}.rail-group>strong{display:block;padding:13px 9px 4px;color:#64748b;font-size:9px}.rail-group button{min-height:38px;display:grid;grid-template-columns:17px minmax(0,1fr) auto;align-items:center;gap:5px;padding:6px 9px;border-left:3px solid transparent;font-size:10px;font-weight:800}.milestone-link:hover,.rail-group button:hover,.milestone-link.active,.rail-group button.active{color:#0f766e;background:#edf8f6}.milestone-link.active,.rail-group button.active{border-left-color:#0f766e}
.wound-content{padding:10px;overflow:hidden}.content-head{min-height:64px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:9px;border-bottom:2px solid #0f766e}.content-head h3{margin:1px 0;color:#16324f;font-size:15px}.readiness-band{display:grid;grid-template-columns:190px minmax(120px,1fr);align-items:center;gap:8px 12px;margin-top:10px;padding:10px;border:1px solid #cbd5e1;background:#f8fafc}.readiness-band>div:first-child{display:flex;justify-content:space-between;gap:8px}.readiness-band span,.readiness-band small{color:#64748b;font-size:10px}.readiness-band strong{color:#0f766e}.readiness-track{height:8px;overflow:hidden;background:#dbe4e2}.readiness-track i{display:block;height:100%;background:#0f766e}.readiness-band>small{grid-column:1/-1}
.row-panel{margin-top:10px;border:1px solid #cbd5e1}.row-panel>header{min-height:34px;display:flex;align-items:center;justify-content:space-between;padding:6px 9px;background:#e8f2f1}.row-panel header strong{font-size:11px}.row-panel header span{color:#64748b;font-size:9px}.clinical-row{width:100%;min-height:50px;display:grid;grid-template-columns:20px minmax(0,1fr) 62px 14px;align-items:center;gap:8px;padding:7px 9px;border:0;border-top:1px solid #e2e8f0;background:#fff;cursor:pointer;text-align:left}.clinical-row:hover{background:#f8fafc}.clinical-row span,.requirement-row span{display:flex;flex-direction:column}.clinical-row strong,.requirement-row strong{color:#16324f;font-size:10px}.clinical-row small,.requirement-row small{color:#64748b;font-size:9px}.clinical-row em,.requirement-row em{padding:3px 5px;font-size:8px;font-style:normal;font-weight:900;text-align:center;text-transform:uppercase}.clinical-row em.complete,.requirement-row em.complete{color:#047857;background:#dcfce7}.clinical-row em.pending,.requirement-row em.pending{color:#b45309;background:#fef3c7}.clinical-row em.blocked{color:#be123c;background:#ffe4e6}.clear-state,.delay-row{min-height:38px;display:flex;align-items:center;gap:7px;padding:7px 9px;border-top:1px solid #e2e8f0;color:#475569;font-size:10px}.delay-row{color:#92400e}
.wound-list{margin-top:10px;border:1px solid #cbd5e1}.wound-list-row{width:100%;min-height:68px;display:grid;grid-template-columns:30px 1.2fr 1fr 1fr 64px;align-items:center;gap:8px;padding:8px;border:0;border-bottom:1px solid #e2e8f0;background:#fff;cursor:pointer;text-align:left}.wound-list-row:last-child{border-bottom:0}.wound-list-row:hover,.wound-list-row.active{background:#f0fdfa}.wound-list-row.active{box-shadow:inset 4px 0 #0f766e}.wound-list-row>span:not(.wound-number){display:flex;flex-direction:column}.wound-list-row strong{color:#16324f;font-size:10px}.wound-list-row small{color:#64748b;font-size:9px}.wound-number{display:grid;width:26px;height:26px;place-items:center;color:#0f766e;background:#dff4f0;font-size:9px;font-weight:900}.wound-list-row em{font-size:9px;font-style:normal;font-weight:900;text-transform:uppercase}.good{color:#047857!important}.warning{color:#b45309!important}.danger{color:#be123c!important}
.documentation-filter{min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;padding:6px 8px;border:1px solid #cbd5e1;background:#f8fafc}.documentation-filter label{color:#475569;font-size:9px;font-weight:900}.documentation-filter select{min-width:190px;height:28px;margin-left:7px;padding:0 7px;border:1px solid #94a3b8;background:#fff;color:#16324f}.documentation-filter span{color:#64748b;font-size:9px}.assessment-table{margin-top:8px;border:1px solid #cbd5e1;overflow-x:auto}.assessment-row{min-width:650px;width:100%;min-height:56px;display:grid;grid-template-columns:1.15fr 1.2fr .8fr 1fr 42px;align-items:center;gap:8px;padding:7px 8px;border:0;border-bottom:1px solid #e2e8f0;background:#fff;color:#334155;font-size:9px;text-align:left}.assessment-row:not(.heading){cursor:pointer}.assessment-row:not(.heading):hover{background:#f0fdfa}.assessment-row.heading{min-height:32px;background:#e8f2f1;font-weight:900}.assessment-row>span{display:flex;flex-direction:column}.assessment-row strong{color:#16324f;font-size:9px}.assessment-row small{color:#64748b;font-size:8px}
.discharge-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}.discharge-summary>div{min-height:78px;display:flex;flex-direction:column;padding:9px;border:1px solid #cbd5e1;border-top:4px solid #0f766e}.discharge-summary small{color:#64748b;font-size:8px;font-weight:900}.discharge-summary strong{margin:3px 0;color:#0f766e;font-size:19px}.discharge-summary span{color:#475569;font-size:9px}.requirement-row{min-height:52px;display:grid;grid-template-columns:20px minmax(0,1fr) 60px;align-items:center;gap:8px;padding:7px 9px;border-top:1px solid #e2e8f0}.wound-alert{font-size:10px}
.wound-context{align-self:start}.wound-context>header{display:flex;flex-direction:column;padding:11px;border-bottom:2px solid #0f766e;background:#e8f2f1}.wound-context header small{color:#0f766e;font-size:8px;font-weight:900}.wound-context header strong{margin-top:2px;color:#16324f;font-size:13px}.wound-context header span{color:#64748b;font-size:10px}.wound-context dl{margin:0;padding:4px 10px}.wound-context dl>div{min-height:34px;display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid #e2e8f0}.wound-context dt{color:#64748b;font-size:9px}.wound-context dd{margin:0;color:#16324f;font-size:9px;font-weight:900;text-align:right}.latest-assessment{margin:8px 10px;padding:8px;border:1px solid #cbd5e1;background:#f8fafc}.latest-assessment>strong{font-size:10px}.latest-assessment p{display:grid;grid-template-columns:62px 1fr;gap:6px;margin:6px 0 0;color:#334155;font-size:9px}.latest-assessment p span{color:#64748b}.trend-alert{margin:8px 10px!important;color:#9f1239!important;font-size:9px}.wound-context>.v-btn{width:calc(100% - 20px);margin:8px 10px 10px}.empty-state,.context-empty{min-height:260px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:#64748b;text-align:center}.empty-state strong,.context-empty strong{color:#334155;font-size:11px}.empty-state span,.context-empty span{max-width:240px;font-size:9px}.context-empty{min-height:320px;padding:15px}
@media(max-width:1280px){.wound-workspace-grid{grid-template-columns:164px minmax(0,1fr)}.wound-context{grid-column:1/-1;display:grid;grid-template-columns:200px 1fr 180px;align-items:start}.wound-context dl{display:grid;grid-template-columns:repeat(2,1fr)}.wound-context>.v-btn{align-self:center}.context-empty{grid-column:1/-1;min-height:130px}}
@media(max-width:800px){.wound-shell{padding:8px}.metric-strip{grid-template-columns:repeat(2,1fr)}.metric-strip>span{border-bottom:1px solid #d7e0df}.wound-workspace-grid{grid-template-columns:1fr}.wound-rail{display:grid;grid-template-columns:repeat(4,minmax(130px,1fr));overflow-x:auto}.milestone-link{border-bottom:0}.rail-group>strong{display:none}.rail-group button{height:100%}.wound-context{grid-column:auto;display:block}.wound-list-row{grid-template-columns:30px 1fr 66px}.wound-list-row>span:nth-child(3),.wound-list-row>span:nth-child(4){display:none}.discharge-summary{grid-template-columns:1fr}.readiness-band{grid-template-columns:1fr}.readiness-band>small{grid-column:auto}}
</style>
