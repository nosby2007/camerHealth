<template>
  <v-container fluid class="gov-content pa-8">
    <div class="d-flex align-center justify-space-between mb-6 flex-wrap" style="gap:12px">
      <div>
        <div class="text-caption font-weight-black grey--text text-uppercase ls-1 mb-1">ENTERPRISE HOSPITAL OPERATING MODEL</div>
        <h1 class="text-h4 font-weight-black gov-text-primary uppercase mb-1">{{ model.facilityDisplayName }}</h1>
        <div class="text-caption grey--text font-weight-bold">Departments, specialties, service leadership, patient workflows and PHI governance</div>
      </div>
      <v-btn tile depressed color="#003366" dark class="font-weight-black text-caption" :loading="saving" @click="saveModel">
        <v-icon left small>mdi-content-save</v-icon>Save model
      </v-btn>
    </div>

    <v-row dense class="mb-6">
      <v-col v-for="metric in metrics" :key="metric.label" cols="12" sm="6" lg="3">
        <v-card flat tile class="gov-card b-1 pa-5 h-100 shadow-sm">
          <div class="d-flex align-center justify-space-between mb-4">
            <v-avatar tile size="38" :color="metric.color"><v-icon dark>{{ metric.icon }}</v-icon></v-avatar>
            <span class="text-h4 font-weight-black gov-text-primary">{{ metric.value }}</span>
          </div>
          <div class="text-caption font-weight-black grey--text text-uppercase ls-1">{{ metric.label }}</div>
          <div class="text-caption grey--text mt-1">{{ metric.helper }}</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="8">
        <v-card flat tile class="gov-card b-1 shadow-sm mb-6 overflow-hidden">
          <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center flex-wrap" style="gap:10px">
            <v-icon color="#003366" small>mdi-hospital-building</v-icon>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">Departments and services</span>
            <v-spacer />
            <v-select v-model="typeFilter" :items="typeFilters" hide-details dense outlined tile class="filter-control bg-white" label="Type"></v-select>
          </div>
          <v-data-table :headers="departmentHeaders" :items="filteredDepartments" class="gov-table" item-key="id" :items-per-page="8" tile elevation="0">
            <template v-slot:item.name="{ item }">
              <div class="font-weight-black gov-text-primary text-uppercase">{{ item.name }}</div>
              <div class="text-caption grey--text font-weight-bold">{{ item.location }}</div>
            </template>
            <template v-slot:item.type="{ item }">
              <v-chip x-small dark label :color="typeColor(item.type)" class="font-weight-black">{{ item.type }}</v-chip>
            </template>
            <template v-slot:item.lead="{ item }">
              <div class="text-caption font-weight-black gov-text-primary">{{ item.leadRole }}</div>
              <div class="text-caption grey--text">{{ item.headNurseRole }}</div>
            </template>
            <template v-slot:item.specialties="{ item }">
              <div class="chip-wrap">
                <v-chip v-for="specialty in item.specialties.slice(0, 3)" :key="specialty" x-small label class="mr-1 mb-1 font-weight-bold">{{ specialty }}</v-chip>
                <v-chip v-if="item.specialties.length > 3" x-small label color="#F3F4F6" class="font-weight-bold">+{{ item.specialties.length - 3 }}</v-chip>
              </div>
            </template>
            <template v-slot:item.services="{ item }">
              <span class="font-weight-black">{{ item.services.length }}</span>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn icon small @click="selectDepartment(item)"><v-icon small color="#003366">mdi-pencil</v-icon></v-btn>
            </template>
          </v-data-table>
        </v-card>

        <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
          <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center">
            <v-icon color="#0B3D2E" small class="mr-2">mdi-source-branch</v-icon>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">Hospital workflows touching patient PHI</span>
          </div>
          <v-row dense class="pa-4">
            <v-col v-for="workflow in workflows" :key="workflow.id" cols="12" md="6">
              <div class="workflow-box pa-4 h-100">
                <div class="text-caption font-weight-black gov-text-primary text-uppercase mb-3">{{ workflow.name }}</div>
                <div class="workflow-steps">
                  <span v-for="stage in workflow.stages" :key="stage" class="workflow-step">{{ stage }}</span>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card flat tile class="gov-card b-1 shadow-sm mb-6 overflow-hidden">
          <div class="pa-4 bg-navy white--text font-weight-black text-caption text-uppercase ls-1">Governance</div>
          <div class="pa-5">
            <div v-for="row in governanceRows" :key="row.label" class="info-row">
              <span>{{ row.label }}</span><strong>{{ row.value }}</strong>
            </div>
          </div>
        </v-card>

        <v-card flat tile class="gov-card b-1 shadow-sm mb-6 overflow-hidden">
          <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center">
            <v-icon color="#C0392B" small class="mr-2">mdi-shield-lock</v-icon>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">PHI access policy</span>
          </div>
          <v-list dense class="pa-0">
            <v-list-item v-for="policy in policyRows" :key="policy.role" class="border-bottom py-3">
              <v-list-item-content>
                <v-list-item-title class="text-caption font-weight-black gov-text-primary">{{ policy.role }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption">{{ policy.access }}</v-list-item-subtitle>
                <div class="text-caption grey--text mt-1">{{ policy.note }}</div>
              </v-list-item-content>
              <v-list-item-action>
                <v-chip x-small label :color="policy.canOpenChart ? '#1F7A5C' : '#D97706'" dark class="font-weight-black">
                  {{ policy.canOpenChart ? 'CHART' : 'LIMITED' }}
                </v-chip>
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </v-card>

        <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
          <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center">
            <v-icon color="#003366" small class="mr-2">mdi-pencil-box</v-icon>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">Selected department</span>
          </div>
          <div class="pa-5" v-if="draftDepartment">
            <v-text-field v-model="draftDepartment.name" label="Department" dense outlined tile></v-text-field>
            <v-text-field v-model="draftDepartment.location" label="Location" dense outlined tile></v-text-field>
            <v-text-field v-model="draftDepartment.leadRole" label="Chef de service" dense outlined tile></v-text-field>
            <v-text-field v-model="draftDepartment.headNurseRole" label="Major de service" dense outlined tile></v-text-field>
            <v-textarea v-model="specialtiesText" label="Specialties" dense outlined tile rows="3" hint="One specialty per line" persistent-hint></v-textarea>
            <v-btn block tile depressed color="#00A99D" dark class="font-weight-black text-caption mt-3" @click="updateDepartment">
              <v-icon left small>mdi-check</v-icon>Update department
            </v-btn>
          </div>
          <div v-else class="pa-8 text-center grey--text text-caption font-weight-bold">Select a department to edit leadership and specialties.</div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  head: { title: 'Hospital Operating Model' },
  data() {
    return {
      typeFilter: '',
      saving: false,
      draftDepartment: null,
      specialtiesText: '',
      typeFilters: [
        { text: 'All types', value: '' },
        { text: 'Clinical', value: 'clinical' },
        { text: 'Diagnostic', value: 'diagnostic' },
        { text: 'Support', value: 'support' },
        { text: 'Administrative', value: 'administrative' }
      ],
      departmentHeaders: [
        { text: 'Department', value: 'name' },
        { text: 'Type', value: 'type', align: 'center' },
        { text: 'Leadership', value: 'lead' },
        { text: 'Specialties', value: 'specialties' },
        { text: 'Services', value: 'services', align: 'center' },
        { text: '', value: 'actions', sortable: false, align: 'right' }
      ]
    }
  },
  computed: {
    model() { return this.$store.getters['facility/getHospitalModel'] || {} },
    departments() { return this.$store.getters['facility/getDepartments'] || [] },
    workflows() { return this.$store.getters['facility/getWorkflowCatalog'] || [] },
    policies() { return this.$store.getters['facility/getPhiPolicies'] || {} },
    filteredDepartments() {
      if (!this.typeFilter) return this.departments
      return this.departments.filter(item => item.type === this.typeFilter)
    },
    metrics() {
      const serviceCount = this.departments.reduce((total, department) => total + (department.services || []).length, 0)
      return [
        { label: 'Departments', value: this.departments.length, helper: 'Clinical, diagnostic, support and admin', icon: 'mdi-domain', color: '#003366' },
        { label: 'Services', value: serviceCount, helper: 'Operational units and queues', icon: 'mdi-source-branch', color: '#00A99D' },
        { label: 'Specialties', value: this.$store.getters['facility/getSpecialties'].length, helper: 'Medical and administrative scopes', icon: 'mdi-stethoscope', color: '#0B3D2E' },
        { label: 'Workflows', value: this.workflows.length, helper: 'Patient pathways with PHI rules', icon: 'mdi-transit-connection-variant', color: '#D97706' }
      ]
    },
    governanceRows() {
      const governance = this.model.governance || {}
      return [
        { label: 'Administration', value: governance.administratorTitle },
        { label: 'Medical leadership', value: governance.medicalDirectorTitle },
        { label: 'Nursing leadership', value: governance.nursingDirectorTitle },
        { label: 'Service lead', value: governance.serviceLeadTitle },
        { label: 'Unit lead', value: governance.headNurseTitle }
      ]
    },
    policyRows() {
      return Object.keys(this.policies).filter(role => role !== 'DEFAULT').map(role => ({ role, ...this.policies[role] }))
    }
  },
  methods: {
    typeColor(type) {
      return { clinical: '#0B3D2E', diagnostic: '#D97706', support: '#6D28D9', administrative: '#003366' }[type] || '#6B7280'
    },
    selectDepartment(department) {
      this.draftDepartment = JSON.parse(JSON.stringify(department))
      this.specialtiesText = (department.specialties || []).join('\n')
    },
    updateDepartment() {
      const next = {
        ...this.draftDepartment,
        specialties: this.specialtiesText.split('\n').map(item => item.trim()).filter(Boolean)
      }
      this.$store.dispatch('facility/updateDepartment', next)
      this.$toast.success('Department governance updated.')
      this.selectDepartment(next)
    },
    async saveModel() {
      this.saving = true
      try {
        await this.$store.dispatch('facility/saveHospitalModel', this.model)
        this.$toast.success('Hospital operating model saved.')
      } finally {
        setTimeout(() => { this.saving = false }, 600)
      }
    }
  }
}
</script>

<style scoped>
.gov-card { background: white !important; }
.bg-navy { background: #003366 !important; }
.gov-text-primary { color: #1B1F23 !important; }
.border-bottom { border-bottom: 1px solid #E5E7EB; }
.ls-1 { letter-spacing: 0.8px !important; }
.uppercase { text-transform: uppercase; }
.h-100 { height: 100%; }
.b-1 { border: 1px solid #E5E7EB; }
.shadow-sm { box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }
.filter-control { max-width: 190px; }
.bg-white { background: white !important; }
.info-row { display:flex; justify-content:space-between; gap:16px; padding:10px 0; border-bottom:1px solid #EEF2F7; font-size:12px; }
.info-row span { color:#6B7280; font-weight:800; text-transform:uppercase; }
.info-row strong { color:#1B1F23; text-align:right; }
.workflow-box { border:1px solid #E5E7EB; background:#FFFFFF; }
.workflow-steps { display:flex; flex-wrap:wrap; gap:6px; }
.workflow-step { font-size:11px; font-weight:800; color:#1B1F23; background:#F3F4F6; border:1px solid #E5E7EB; padding:5px 7px; }
.chip-wrap { max-width:260px; }
.gov-table { background: white !important; }
.gov-table ::v-deep th { background:#F8FAFC !important; color:#1B1F23 !important; font-size:10px !important; font-weight:800; text-transform:uppercase; }
</style>
