<template>
  <v-container fluid class="gov-content pa-10">
    <v-row class="mb-8 no-gutters align-center">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar tile color="#6D28D9" size="48" class="mr-4 shadow-sm"><v-icon dark>mdi-text-box-check</v-icon></v-avatar>
          <div>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">MEDICAL TEMPLATES</span>
            <h1 class="text-h4 font-weight-black gov-text-primary uppercase">Smart Phrase Library</h1>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-row class="no-gutters">
      <v-col cols="12" lg="4">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-purple white--text font-weight-black text-caption ls-1 uppercase">NEW TEMPLATE</div>
          <div class="pa-8">
            <v-form ref="form" v-model="valid">
              <v-text-field v-model="form.name" label="Template Name" outlined tile dense :rules="[v => !!v || 'Required']" class="mb-4" />
              <v-select v-model="form.type" :items="['Encounter Note', 'Triage', 'Discharge', 'Procedure', 'Referral', 'Patient Instruction']" label="Type" outlined tile dense class="mb-4" />
              <v-select v-model="form.specialty" :items="specialties" label="Specialty" outlined tile dense class="mb-4" />
              <v-textarea v-model="form.sections" label="Sections" rows="4" outlined tile dense class="mb-4" />
              <v-textarea v-model="form.phrase" label="Smart Phrase" rows="4" outlined tile dense class="mb-6" />
              <v-btn block tile depressed color="#6D28D9" dark height="48" :disabled="!valid" class="font-weight-black text-caption" @click="save">SAVE TEMPLATE</v-btn>
            </v-form>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="8" class="pl-lg-8">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center flex-wrap" style="gap:10px">
            <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Search templates..." single-line hide-details outlined tile dense class="bg-white max-400" />
            <v-spacer />
            <v-select v-model="typeFilter" :items="typeFilters" label="Type" hide-details outlined tile dense class="bg-white filter-control" />
          </div>
          <v-data-table :headers="headers" :items="filteredTemplates" :search="search" class="gov-table" tile elevation="0">
            <template v-slot:item.name="{ item }"><span class="font-weight-black gov-text-primary">{{ item.name }}</span><div class="text-caption grey--text">{{ item.id }}</div></template>
            <template v-slot:item.phrase="{ item }"><span class="text-caption">{{ item.phrase }}</span></template>
            <template v-slot:item.actions="{ item }"><v-btn x-small tile outlined color="#6D28D9" class="font-weight-black" @click="copyPhrase(item)">COPY</v-btn></template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  head: { title: 'Medical Templates' },
  data() {
    return {
      valid: false,
      search: '',
      typeFilter: 'All types',
      form: { name: '', type: 'Encounter Note', specialty: 'Primary Care', sections: '', phrase: '' },
      specialties: ['Primary Care', 'Emergency', 'Inpatient', 'Surgery', 'Maternity', 'Paediatrics', 'Cardiology', 'Public Health'],
      headers: [
        { text: 'TEMPLATE', value: 'name' },
        { text: 'TYPE', value: 'type' },
        { text: 'SPECIALTY', value: 'specialty' },
        { text: 'SMART PHRASE', value: 'phrase' },
        { text: '', value: 'actions', sortable: false, align: 'right' }
      ]
    }
  },
  computed: {
    templates() { return this.$store.getters['clinical/getMedicalTemplates'] || [] },
    typeFilters() { return ['All types', ...new Set(this.templates.map(item => item.type).filter(Boolean))] },
    filteredTemplates() { return this.typeFilter === 'All types' ? this.templates : this.templates.filter(item => item.type === this.typeFilter) }
  },
  methods: {
    save() {
      if (!this.$refs.form.validate()) return
      this.$store.dispatch('clinical/createMedicalTemplate', this.form)
      this.$toast.success('Template saved.')
      this.$refs.form.reset()
      this.form.type = 'Encounter Note'
      this.form.specialty = 'Primary Care'
    },
    copyPhrase(item) {
      if (navigator.clipboard) navigator.clipboard.writeText(item.phrase || '')
      this.$toast.success('Smart phrase copied.')
    }
  }
}
</script>

<style scoped>
.gov-card { background: white !important; }
.bg-purple { background-color: #6D28D9 !important; }
.gov-text-primary { color: #1B1F23 !important; }
.b-1 { border: 1px solid #E5E7EB; }
.border-bottom { border-bottom: 1px solid #E5E7EB; }
.bg-white { background: white !important; }
.max-400 { max-width: 400px; }
.filter-control { max-width: 220px; }
.shadow-sm { box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }
.ls-1 { letter-spacing: 0.8px !important; }
.uppercase { text-transform: uppercase; }
.gov-table { background: white !important; }
.gov-table ::v-deep th { background:#F8FAFC !important; color:#1B1F23 !important; font-size:10px !important; font-weight:800; text-transform:uppercase; }
</style>
