<template>
  <v-container fluid class="gov-content pa-10">
    <v-row class="mb-8 no-gutters align-center">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar tile color="#003366" size="48" class="mr-4 shadow-sm"><v-icon dark>mdi-file-document-multiple</v-icon></v-avatar>
          <div>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">DOCUMENT MANAGEMENT</span>
            <h1 class="text-h4 font-weight-black gov-text-primary uppercase">Clinical Documents</h1>
          </div>
        </div>
      </v-col>
      <v-spacer />
      <v-col cols="auto" class="d-flex" style="gap:8px">
        <v-chip label color="#003366" dark class="font-weight-black text-caption">{{ documents.length }} FILED</v-chip>
        <v-chip label color="#D97706" dark class="font-weight-black text-caption">{{ unsignedCount }} UNSIGNED</v-chip>
      </v-col>
    </v-row>

    <v-row class="no-gutters">
      <v-col cols="12" lg="4">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-navy white--text font-weight-black text-caption ls-1 uppercase">FILE DOCUMENT</div>
          <div class="pa-8">
            <v-form ref="form" v-model="valid">
              <v-autocomplete v-model="form.patientId" :items="patientItems" item-text="label" item-value="id" label="Patient" outlined tile dense :rules="[v => !!v || 'Required']" class="mb-4" />
              <v-select v-model="form.category" :items="categories" label="Document Type" outlined tile dense :rules="[v => !!v || 'Required']" class="mb-4" />
              <v-text-field v-model="form.title" label="Title" outlined tile dense :rules="[v => !!v || 'Required']" class="mb-4" />
              <v-select v-model="form.status" :items="['Filed', 'Unsigned', 'Needs Review', 'Archived']" label="Status" outlined tile dense class="mb-4" />
              <v-textarea v-model="form.summary" label="Document Summary" rows="4" outlined tile dense class="mb-6" />
              <v-btn block tile depressed color="#00A99D" dark height="48" :disabled="!valid" class="font-weight-black text-caption" @click="save">FILE DOCUMENT</v-btn>
            </v-form>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="8" class="pl-lg-8">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center flex-wrap" style="gap:10px">
            <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Search documents..." single-line hide-details outlined tile dense class="bg-white max-400" />
            <v-spacer />
            <v-btn-toggle v-model="statusFilter" tile dense>
              <v-btn x-small value="" class="font-weight-black text-caption">ALL</v-btn>
              <v-btn x-small value="Unsigned" class="font-weight-black text-caption">UNSIGNED</v-btn>
              <v-btn x-small value="Needs Review" class="font-weight-black text-caption">REVIEW</v-btn>
              <v-btn x-small value="Filed" class="font-weight-black text-caption">FILED</v-btn>
            </v-btn-toggle>
          </div>
          <v-data-table :headers="headers" :items="filteredDocuments" :search="search" class="gov-table" tile elevation="0">
            <template v-slot:item.patientName="{ item }">
              <nuxt-link :to="`/clinical/patients/${item.patientId}`" class="patient-link font-weight-black">{{ item.patientName }}</nuxt-link>
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip x-small dark label :color="statusColor(item.status)" class="font-weight-black">{{ item.status.toUpperCase() }}</v-chip>
            </template>
            <template v-slot:item.createdAt="{ item }"><span class="text-caption grey--text">{{ formatDate(item.createdAt) }}</span></template>
            <template v-slot:item.actions="{ item }">
              <v-btn icon x-small @click="setStatus(item, 'Filed')"><v-icon small color="#00A99D">mdi-check-decagram</v-icon></v-btn>
              <v-btn icon x-small @click="setStatus(item, 'Archived')"><v-icon small color="#6B7280">mdi-archive</v-icon></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  head: { title: 'Document Management' },
  data() {
    return {
      valid: false,
      search: '',
      statusFilter: '',
      form: { patientId: '', category: 'Clinical Note', title: '', status: 'Filed', summary: '' },
      categories: ['Clinical Note', 'Consent', 'Lab Report', 'Imaging Report', 'Referral Letter', 'Discharge Summary', 'Insurance Form', 'Patient Upload'],
      headers: [
        { text: 'PATIENT', value: 'patientName' },
        { text: 'TYPE', value: 'category' },
        { text: 'TITLE', value: 'title' },
        { text: 'STATUS', value: 'status', align: 'center' },
        { text: 'FILED', value: 'createdAt' },
        { text: '', value: 'actions', sortable: false, align: 'right' }
      ]
    }
  },
  computed: {
    patients() { return this.$store.getters['clinical/getPatients'] || [] },
    patientItems() { return this.patients.map(patient => ({ id: patient.id, label: `${patient.id} - ${patient.name}` })) },
    documents() {
      return (this.$store.getters['clinical/getDocuments'] || []).map(document => {
        const patient = this.patients.find(item => item.id === document.patientId)
        return { ...document, patientName: patient ? patient.name : 'Unknown' }
      }).reverse()
    },
    filteredDocuments() {
      if (!this.statusFilter) return this.documents
      return this.documents.filter(item => item.status === this.statusFilter)
    },
    unsignedCount() { return this.documents.filter(item => ['Unsigned', 'Needs Review'].includes(item.status)).length }
  },
  methods: {
    save() {
      if (!this.$refs.form.validate()) return
      this.$store.dispatch('clinical/createDocument', this.form)
      this.$toast.success('Document filed.')
      this.$refs.form.reset()
      this.form.status = 'Filed'
      this.form.category = 'Clinical Note'
    },
    setStatus(item, status) {
      this.$store.dispatch('clinical/updateDocument', { ...item, status })
    },
    statusColor(status) { return { Filed: '#003366', Unsigned: '#D97706', 'Needs Review': '#C0392B', Archived: '#6B7280' }[status] || '#6B7280' },
    formatDate(value) { return value ? new Date(value).toLocaleDateString() : '-' }
  }
}
</script>

<style scoped>
.gov-card { background: white !important; }
.bg-navy { background-color: #003366 !important; }
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
