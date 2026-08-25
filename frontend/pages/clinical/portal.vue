<template>
  <v-container fluid class="gov-content pa-10">
    <v-row class="mb-8 no-gutters align-center">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar tile color="#003366" size="48" class="mr-4 shadow-sm"><v-icon dark>mdi-cellphone-message</v-icon></v-avatar>
          <div>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">PATIENT PORTAL</span>
            <h1 class="text-h4 font-weight-black gov-text-primary uppercase">Portal Messages</h1>
          </div>
        </div>
      </v-col>
      <v-spacer />
      <v-col cols="auto"><v-chip label color="#C0392B" dark class="font-weight-black text-caption">{{ unreadCount }} UNREAD</v-chip></v-col>
    </v-row>

    <v-row class="no-gutters">
      <v-col cols="12" lg="4">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-navy white--text font-weight-black text-caption ls-1 uppercase">SEND PORTAL MESSAGE</div>
          <div class="pa-8">
            <v-form ref="form" v-model="valid">
              <v-autocomplete v-model="form.patientId" :items="patientItems" item-text="label" item-value="id" label="Patient" outlined tile dense :rules="[v => !!v || 'Required']" class="mb-4" />
              <v-select v-model="form.category" :items="['Appointment', 'Lab Result', 'Medication', 'Billing', 'Education', 'General']" label="Category" outlined tile dense class="mb-4" />
              <v-text-field v-model="form.subject" label="Subject" outlined tile dense :rules="[v => !!v || 'Required']" class="mb-4" />
              <v-textarea v-model="form.message" label="Message" rows="5" outlined tile dense :rules="[v => !!v || 'Required']" class="mb-6" />
              <v-btn block tile depressed color="#003366" dark height="48" :disabled="!valid" class="font-weight-black text-caption" @click="save">SEND MESSAGE</v-btn>
            </v-form>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="8" class="pl-lg-8">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center flex-wrap" style="gap:10px">
            <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Search portal messages..." single-line hide-details outlined tile dense class="bg-white max-400" />
            <v-spacer />
            <v-btn-toggle v-model="statusFilter" tile dense>
              <v-btn x-small value="" class="font-weight-black text-caption">ALL</v-btn>
              <v-btn x-small value="Unread" class="font-weight-black text-caption">UNREAD</v-btn>
              <v-btn x-small value="Read" class="font-weight-black text-caption">READ</v-btn>
              <v-btn x-small value="Replied" class="font-weight-black text-caption">REPLIED</v-btn>
            </v-btn-toggle>
          </div>
          <v-data-table :headers="headers" :items="filteredMessages" :search="search" class="gov-table" tile elevation="0">
            <template v-slot:item.patientName="{ item }"><span class="font-weight-black gov-text-primary">{{ item.patientName }}</span></template>
            <template v-slot:item.subject="{ item }"><span class="font-weight-bold">{{ item.subject }}</span><div class="text-caption grey--text">{{ item.message }}</div></template>
            <template v-slot:item.status="{ item }"><v-chip x-small dark label :color="statusColor(item.status)" class="font-weight-black">{{ item.status.toUpperCase() }}</v-chip></template>
            <template v-slot:item.actions="{ item }">
              <v-btn icon x-small @click="setStatus(item, 'Read')"><v-icon small color="#003366">mdi-email-open</v-icon></v-btn>
              <v-btn icon x-small @click="setStatus(item, 'Replied')"><v-icon small color="#00A99D">mdi-reply</v-icon></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  head: { title: 'Patient Portal' },
  data() {
    return {
      valid: false,
      search: '',
      statusFilter: '',
      form: { patientId: '', category: 'General', subject: '', message: '' },
      headers: [
        { text: 'PATIENT', value: 'patientName' },
        { text: 'CATEGORY', value: 'category' },
        { text: 'SUBJECT', value: 'subject' },
        { text: 'STATUS', value: 'status', align: 'center' },
        { text: 'DATE', value: 'createdAt' },
        { text: '', value: 'actions', sortable: false, align: 'right' }
      ]
    }
  },
  computed: {
    patients() { return this.$store.getters['clinical/getPatients'] || [] },
    patientItems() { return this.patients.map(patient => ({ id: patient.id, label: `${patient.id} - ${patient.name}` })) },
    messages() {
      return (this.$store.getters['clinical/getPortalMessages'] || []).map(message => {
        const patient = this.patients.find(item => item.id === message.patientId)
        return { ...message, patientName: patient ? patient.name : 'Unknown', createdAt: new Date(message.createdAt).toLocaleDateString() }
      }).reverse()
    },
    filteredMessages() { return this.statusFilter ? this.messages.filter(item => item.status === this.statusFilter) : this.messages },
    unreadCount() { return this.messages.filter(item => item.status === 'Unread').length }
  },
  methods: {
    save() {
      if (!this.$refs.form.validate()) return
      this.$store.dispatch('clinical/createPortalMessage', this.form)
      this.$toast.success('Portal message sent.')
      this.$refs.form.reset()
      this.form.category = 'General'
    },
    setStatus(item, status) { this.$store.dispatch('clinical/updatePortalMessage', { ...item, status }) },
    statusColor(status) { return { Unread: '#C0392B', Read: '#003366', Replied: '#00A99D' }[status] || '#6B7280' }
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
</style>
