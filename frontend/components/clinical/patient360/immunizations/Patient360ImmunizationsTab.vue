<template>
  <section class="module-shell">
    <header class="module-head">
      <div><small>{{ $t('clinical360.immunizations.tab.section_label') }}</small><h2>{{ $t('clinical360.immunizations.tab.title') }}</h2><p>{{ $t('clinical360.immunizations.tab.subtitle') }}</p></div>
      <v-btn v-if="canEdit" x-small depressed color="#0f766e" dark @click="openForm()"><v-icon x-small left>mdi-shield-plus-outline</v-icon>{{ $t('clinical360.immunizations.tab.document_vaccine') }}</v-btn>
    </header>
    <div class="metrics"><span><b>{{ rows.length }}</b> {{ $t('clinical360.immunizations.tab.reviewed') }}</span><span><b>{{ dueCount }}</b> {{ $t('clinical360.immunizations.tab.due_unknown') }}</span><span><b>{{ completeCount }}</b> {{ $t('clinical360.immunizations.tab.complete') }}</span></div>
    <div class="record-table">
      <div class="record-row heading"><span>{{ $t('clinical360.immunizations.tab.col_vaccine') }}</span><span>{{ $t('clinical360.immunizations.tab.col_status') }}</span><span>{{ $t('clinical360.immunizations.tab.col_date') }}</span><span>{{ $t('clinical360.immunizations.tab.col_source') }}</span><span></span></div>
      <div v-for="row in rows" :key="row.key" class="record-row">
        <strong>{{ row.label }}</strong><span :class="['status', statusClass(row.status)]">{{ row.status }}</span><span>{{ row.date || '-' }}</span><span>{{ row.source }}</span>
        <v-btn v-if="canEdit" icon x-small :title="$t('clinical360.immunizations.tab.update_vaccine_title')" @click="openForm(row)"><v-icon small>mdi-pencil-outline</v-icon></v-btn>
      </div>
    </div>
    <v-dialog v-model="dialog" max-width="620" persistent>
      <v-card><v-card-title class="dialog-title">{{ $t('clinical360.immunizations.tab.dialog_title') }}<v-spacer/><v-btn icon small @click="dialog=false"><v-icon>mdi-close</v-icon></v-btn></v-card-title>
        <v-card-text class="pt-4"><v-form ref="form">
          <div class="form-grid"><v-select v-model="form.vaccine" :items="vaccines" :label="$t('clinical360.immunizations.tab.field_vaccine')" dense outlined/><v-select v-model="form.status" :items="statuses" :label="$t('clinical360.immunizations.tab.field_status')" dense outlined/></div>
          <div class="form-grid"><v-text-field v-model="form.date" type="date" :label="$t('clinical360.immunizations.tab.field_date')" dense outlined/><v-select v-model="form.source" :items="sources" :label="$t('clinical360.immunizations.tab.field_source')" dense outlined/></div>
          <v-textarea v-model="form.note" :label="$t('clinical360.immunizations.tab.field_note')" rows="3" dense outlined/>
        </v-form></v-card-text>
        <v-card-actions><v-spacer/><v-btn text small @click="dialog=false">{{ $t('clinical360.immunizations.tab.cancel') }}</v-btn><v-btn small depressed color="#0f766e" dark :loading="saving" @click="save">{{ $t('clinical360.immunizations.tab.save') }}</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
  </section>
</template>
<script>
export default {
  name: 'Patient360ImmunizationsTab',
  props: { patientId: { type: String, required: true }, patient: { type: Object, default: () => ({}) }, role: { type: String, default: '' }, readOnly: Boolean },
  data: () => ({ dialog: false, saving: false, vaccines: ['Influenza', 'Tetanus', 'COVID-19', 'Hepatitis B', 'Yellow fever', 'BCG', 'Other'], statuses: ['Administered', 'Verified', 'Due', 'Declined', 'Contraindicated', 'Unknown'], sources: ['Patient chart', 'Vaccination card', 'Patient / family', 'External facility', 'Administered here'], form: { vaccine: 'Influenza', status: 'Verified', date: '', source: 'Patient chart', note: '' } }),
  computed: {
    rows() { const p=this.patient||{}; const base=[['influenza','Influenza'],['tetanus','Tetanus'],['covid','COVID-19'],['hepatitisB','Hepatitis B'],['yellowFever','Yellow fever'],['bcg','BCG']]; return base.map(([key,label])=>({ key,label,status:p[`${key}Status`]||'Unknown',date:p[`${key}Date`]||'',source:p[`${key}Source`]||'Patient chart' })) },
    canEdit() { return !this.readOnly && ['ADMIN','DOCTOR','NP','NURSE','MIDWIFE','MAJOR_SERVICE','NURSING_SUPERVISOR'].includes(this.role) },
    dueCount() { return this.rows.filter(r=>/due|unknown|not reviewed/i.test(r.status)).length },
    completeCount() { return this.rows.filter(r=>/administered|verified|complete/i.test(r.status)).length }
  },
  methods: {
    statusClass(v){ return /due|unknown/i.test(v)?'warning':/declined|contra/i.test(v)?'danger':'good' },
    openForm(row){ if(row) this.form={ vaccine:row.label,status:row.status,date:row.date,source:row.source,note:'' }; else this.form={ vaccine:'Influenza',status:'Verified',date:'',source:'Patient chart',note:'' }; this.dialog=true },
    keyFor(v){ return {Influenza:'influenza',Tetanus:'tetanus','COVID-19':'covid','Hepatitis B':'hepatitisB','Yellow fever':'yellowFever',BCG:'bcg'}[v]||String(v).replace(/\W+/g,'') },
    async save(){ if(!this.form.vaccine||!this.form.status) return; this.saving=true; try { const k=this.keyFor(this.form.vaccine); await this.$store.dispatch('clinical/updatePatient',{patientId:this.patientId,updates:{[`${k}Status`]:this.form.status,[`${k}Date`]:this.form.date,[`${k}Source`]:this.form.source}}); await this.$store.dispatch('clinical/createDocument',{patientId:this.patientId,title:`Immunization - ${this.form.vaccine}`,category:'Immunization',content:[this.form.status,this.form.date,this.form.source,this.form.note].filter(Boolean).join(' | '),status:'Filed'}); this.dialog=false; this.$emit('saved') } finally { this.saving=false } }
  }
}
</script>
<style scoped>
.module-shell{padding:14px;background:#f8fbfb;min-height:100%}.module-head{display:flex;justify-content:space-between;gap:16px;align-items:center;border-bottom:2px solid #0f766e;padding-bottom:10px}.module-head small{font-weight:900;color:#64748b}.module-head h2{font-size:18px;margin:2px 0}.module-head p{font-size:12px;margin:0;color:#64748b}.metrics{display:flex;gap:24px;padding:10px 0;font-size:12px}.metrics b{font-size:16px;color:#0f766e}.record-table{border:1px solid #cbd5e1;background:white}.record-row{display:grid;grid-template-columns:1.2fr .9fr 1fr 1.2fr 34px;align-items:center;min-height:40px;border-bottom:1px solid #e2e8f0;padding:5px 10px;font-size:12px}.record-row.heading{font-weight:900;background:#e8f2f1}.status{font-weight:800}.status.good{color:#047857}.status.warning{color:#b45309}.status.danger{color:#be123c}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.dialog-title{font-size:16px!important;font-weight:900}@media(max-width:700px){.record-row{grid-template-columns:1fr 1fr}.record-row.heading{display:none}.form-grid{grid-template-columns:1fr}}
</style>
