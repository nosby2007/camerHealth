<template>
  <v-container fluid class="gov-content pa-10">
    <v-row class="mb-8 no-gutters align-center">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar tile color="#0B3D2E" size="48" class="mr-4 shadow-sm"><v-icon dark>mdi-shield-check</v-icon></v-avatar>
          <div>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">INSURANCE AND CLAIMS</span>
            <h1 class="text-h4 font-weight-black gov-text-primary uppercase">Claims Workqueue</h1>
          </div>
        </div>
      </v-col>
      <v-spacer />
      <v-col cols="auto" class="d-flex" style="gap:8px">
        <v-chip label color="#D97706" dark class="font-weight-black text-caption">{{ pendingCount }} PENDING</v-chip>
        <v-chip label color="#00A99D" dark class="font-weight-black text-caption">XAF {{ approvedAmount.toLocaleString() }} APPROVED</v-chip>
      </v-col>
    </v-row>

    <v-row class="no-gutters">
      <v-col cols="12" lg="4">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-green white--text font-weight-black text-caption ls-1 uppercase">NEW CLAIM</div>
          <div class="pa-8">
            <v-form ref="form" v-model="valid">
              <v-autocomplete v-model="form.patientId" :items="patientItems" item-text="label" item-value="id" label="Patient" outlined tile dense :rules="[v => !!v || 'Required']" class="mb-4" />
              <v-text-field v-model="form.payer" label="Payer / Insurance" outlined tile dense :rules="[v => !!v || 'Required']" class="mb-4" />
              <v-text-field v-model="form.policyNumber" label="Policy Number" outlined tile dense class="mb-4" />
              <v-select v-model="form.claimType" :items="['Outpatient', 'Inpatient', 'Emergency', 'Lab', 'Imaging', 'Medication', 'Procedure']" label="Claim Type" outlined tile dense class="mb-4" />
              <v-text-field v-model.number="form.amount" type="number" prefix="XAF" label="Claim Amount" outlined tile dense :rules="[v => !!v || 'Required', v => v > 0 || 'Must be > 0']" class="mb-4" />
              <v-select v-model="form.status" :items="['Draft', 'Submitted', 'Accepted', 'Denied', 'Paid']" label="Status" outlined tile dense class="mb-4" />
              <v-textarea v-model="form.notes" label="Claim Notes" rows="3" outlined tile dense class="mb-6" />
              <v-btn block tile depressed color="#0B3D2E" dark height="48" :disabled="!valid" class="font-weight-black text-caption" @click="save">CREATE CLAIM</v-btn>
            </v-form>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="8" class="pl-lg-8">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center flex-wrap" style="gap:10px">
            <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Search claims..." single-line hide-details outlined tile dense class="bg-white max-400" />
            <v-spacer />
            <v-btn-toggle v-model="statusFilter" tile dense>
              <v-btn x-small value="" class="font-weight-black text-caption">ALL</v-btn>
              <v-btn x-small value="Submitted" class="font-weight-black text-caption">SUBMITTED</v-btn>
              <v-btn x-small value="Accepted" class="font-weight-black text-caption">ACCEPTED</v-btn>
              <v-btn x-small value="Denied" class="font-weight-black text-caption">DENIED</v-btn>
              <v-btn x-small value="Paid" class="font-weight-black text-caption">PAID</v-btn>
            </v-btn-toggle>
          </div>
          <v-data-table :headers="headers" :items="filteredClaims" :search="search" class="gov-table" tile elevation="0">
            <template v-slot:item.patientName="{ item }"><span class="font-weight-black gov-text-primary">{{ item.patientName }}</span></template>
            <template v-slot:item.amount="{ item }"><span class="font-weight-black">XAF {{ Number(item.amount || 0).toLocaleString() }}</span></template>
            <template v-slot:item.status="{ item }"><v-chip x-small dark label :color="statusColor(item.status)" class="font-weight-black">{{ item.status.toUpperCase() }}</v-chip></template>
            <template v-slot:item.actions="{ item }">
              <v-btn icon x-small @click="setStatus(item, 'Submitted')"><v-icon small color="#003366">mdi-send</v-icon></v-btn>
              <v-btn icon x-small @click="setStatus(item, 'Accepted')"><v-icon small color="#00A99D">mdi-check-circle</v-icon></v-btn>
              <v-btn icon x-small @click="setStatus(item, 'Denied')"><v-icon small color="#C0392B">mdi-close-circle</v-icon></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  head: { title: 'Insurance and Claims' },
  data() {
    return {
      valid: false,
      search: '',
      statusFilter: '',
      form: { patientId: '', payer: '', policyNumber: '', claimType: 'Outpatient', amount: null, status: 'Draft', notes: '' },
      headers: [
        { text: 'CLAIM', value: 'id' },
        { text: 'PATIENT', value: 'patientName' },
        { text: 'PAYER', value: 'payer' },
        { text: 'TYPE', value: 'claimType' },
        { text: 'AMOUNT', value: 'amount' },
        { text: 'STATUS', value: 'status', align: 'center' },
        { text: '', value: 'actions', sortable: false, align: 'right' }
      ]
    }
  },
  computed: {
    patients() { return this.$store.getters['clinical/getPatients'] || [] },
    patientItems() { return this.patients.map(patient => ({ id: patient.id, label: `${patient.id} - ${patient.name}` })) },
    claims() {
      return (this.$store.getters['clinical/getInsuranceClaims'] || []).map(claim => {
        const patient = this.patients.find(item => item.id === claim.patientId)
        return { ...claim, patientName: patient ? patient.name : 'Unknown' }
      }).reverse()
    },
    filteredClaims() { return this.statusFilter ? this.claims.filter(item => item.status === this.statusFilter) : this.claims },
    pendingCount() { return this.claims.filter(item => !['Paid', 'Denied', 'Closed'].includes(item.status)).length },
    approvedAmount() { return this.claims.filter(item => ['Accepted', 'Paid'].includes(item.status)).reduce((sum, item) => sum + Number(item.amount || 0), 0) }
  },
  methods: {
    save() {
      if (!this.$refs.form.validate()) return
      this.$store.dispatch('clinical/createInsuranceClaim', this.form)
      this.$toast.success('Claim created.')
      this.$refs.form.reset()
      this.form.claimType = 'Outpatient'
      this.form.status = 'Draft'
    },
    setStatus(item, status) { this.$store.dispatch('clinical/updateInsuranceClaim', { ...item, status }) },
    statusColor(status) { return { Draft: '#6B7280', Submitted: '#D97706', Accepted: '#003366', Denied: '#C0392B', Paid: '#00A99D' }[status] || '#6B7280' }
  }
}
</script>

<style scoped>
.gov-card { background: white !important; }
.bg-green { background-color: #0B3D2E !important; }
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
</style>
