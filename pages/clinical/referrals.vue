<template>
  <v-container fluid class="gov-content pa-10">
    <v-row class="mb-8 no-gutters align-center">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar tile color="#D97706" size="48" class="mr-4 shadow-sm"><v-icon dark>mdi-account-arrow-right</v-icon></v-avatar>
          <div>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">REFERRALS</span>
            <h1 class="text-h4 font-weight-black gov-text-primary uppercase">Referral Management</h1>
          </div>
        </div>
      </v-col>
      <v-spacer />
      <v-col cols="auto"><v-chip label color="#D97706" dark class="font-weight-black text-caption">{{ openCount }} OPEN</v-chip></v-col>
    </v-row>

    <v-row class="no-gutters">
      <v-col cols="12" lg="4">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-orange white--text font-weight-black text-caption ls-1 uppercase">CREATE REFERRAL</div>
          <div class="pa-8">
            <v-form ref="form" v-model="valid">
              <v-autocomplete v-model="form.patientId" :items="patientItems" item-text="label" item-value="id" label="Patient" outlined tile dense :rules="[v => !!v || 'Required']" class="mb-4" />
              <v-text-field v-model="form.toFacility" label="Receiving Facility" outlined tile dense :rules="[v => !!v || 'Required']" class="mb-4" />
              <v-select v-model="form.specialty" :items="specialties" label="Specialty" outlined tile dense class="mb-4" />
              <v-select v-model="form.priority" :items="['Routine', 'Urgent', 'Emergency']" label="Priority" outlined tile dense class="mb-4" />
              <v-textarea v-model="form.reason" label="Reason for referral" rows="3" outlined tile dense :rules="[v => !!v || 'Required']" class="mb-4" />
              <v-textarea v-model="form.clinicalSummary" label="Clinical summary" rows="3" outlined tile dense class="mb-6" />
              <v-btn block tile depressed color="#D97706" dark height="48" :disabled="!valid" class="font-weight-black text-caption" @click="save">SEND REFERRAL</v-btn>
            </v-form>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="8" class="pl-lg-8">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center flex-wrap" style="gap:10px">
            <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Search referrals..." single-line hide-details outlined tile dense class="bg-white max-400" />
            <v-spacer />
            <v-btn-toggle v-model="statusFilter" tile dense>
              <v-btn x-small value="" class="font-weight-black text-caption">ALL</v-btn>
              <v-btn x-small value="Open" class="font-weight-black text-caption">OPEN</v-btn>
              <v-btn x-small value="Accepted" class="font-weight-black text-caption">ACCEPTED</v-btn>
              <v-btn x-small value="Closed" class="font-weight-black text-caption">CLOSED</v-btn>
            </v-btn-toggle>
          </div>
          <v-data-table :headers="headers" :items="filteredReferrals" :search="search" class="gov-table" tile elevation="0">
            <template v-slot:item.patientName="{ item }"><nuxt-link :to="`/clinical/patients/${item.patientId}`" class="patient-link font-weight-black">{{ item.patientName }}</nuxt-link></template>
            <template v-slot:item.priority="{ item }"><v-chip x-small dark label :color="priorityColor(item.priority)" class="font-weight-black">{{ item.priority }}</v-chip></template>
            <template v-slot:item.status="{ item }"><v-chip x-small dark label :color="statusColor(item.status)" class="font-weight-black">{{ item.status.toUpperCase() }}</v-chip></template>
            <template v-slot:item.actions="{ item }">
              <v-btn icon x-small @click="setStatus(item, 'Accepted')"><v-icon small color="#003366">mdi-check</v-icon></v-btn>
              <v-btn icon x-small @click="setStatus(item, 'Closed')"><v-icon small color="#00A99D">mdi-check-all</v-icon></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  head: { title: 'Referrals' },
  data() {
    return {
      valid: false,
      search: '',
      statusFilter: '',
      form: { patientId: '', toFacility: '', specialty: 'General Medicine', priority: 'Routine', reason: '', clinicalSummary: '' },
      specialties: ['General Medicine', 'Emergency', 'Surgery', 'Obstetrics', 'Paediatrics', 'Cardiology', 'Neurology', 'Oncology', 'Orthopaedics', 'Radiology', 'Laboratory'],
      headers: [
        { text: 'PATIENT', value: 'patientName' },
        { text: 'TO FACILITY', value: 'toFacility' },
        { text: 'SPECIALTY', value: 'specialty' },
        { text: 'PRIORITY', value: 'priority', align: 'center' },
        { text: 'STATUS', value: 'status', align: 'center' },
        { text: '', value: 'actions', sortable: false, align: 'right' }
      ]
    }
  },
  computed: {
    patients() { return this.$store.getters['clinical/getPatients'] || [] },
    patientItems() { return this.patients.map(patient => ({ id: patient.id, label: `${patient.id} - ${patient.name}` })) },
    referrals() {
      return (this.$store.getters['clinical/getReferrals'] || []).map(referral => {
        const patient = this.patients.find(item => item.id === referral.patientId)
        return { ...referral, patientName: patient ? patient.name : 'Unknown' }
      }).reverse()
    },
    filteredReferrals() { return this.statusFilter ? this.referrals.filter(item => item.status === this.statusFilter) : this.referrals },
    openCount() { return this.referrals.filter(item => item.status !== 'Closed').length }
  },
  methods: {
    save() {
      if (!this.$refs.form.validate()) return
      this.$store.dispatch('clinical/createReferral', this.form)
      this.$toast.success('Referral created.')
      this.$refs.form.reset()
      this.form.priority = 'Routine'
      this.form.specialty = 'General Medicine'
    },
    setStatus(item, status) { this.$store.dispatch('clinical/updateReferral', { ...item, status }) },
    priorityColor(priority) { return { Routine: '#6B7280', Urgent: '#D97706', Emergency: '#C0392B' }[priority] || '#6B7280' },
    statusColor(status) { return { Open: '#D97706', Accepted: '#003366', Closed: '#00A99D' }[status] || '#6B7280' }
  }
}
</script>

<style scoped>
.gov-card { background: white !important; }
.bg-orange { background-color: #D97706 !important; }
.gov-text-primary { color: #1B1F23 !important; }
.b-1 { border: 1px solid #E5E7EB; }
.border-bottom { border-bottom: 1px solid #E5E7EB; }
.bg-white { background: white !important; }
.max-400 { max-width: 400px; }
.shadow-sm { box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }
.ls-1 { letter-spacing: 0.8px !important; }
.uppercase { text-transform: uppercase; }
.gov-table { background: white !important; }
.gov-table ::v-deep th { background:#F8FAFC !important; color:#1B1F23 !important; font-size:10px !important; font-weight:800; text-transform:uppercase; }
.patient-link { color: #003366; text-decoration: none; }
.patient-link:hover { text-decoration: underline; }
</style>
