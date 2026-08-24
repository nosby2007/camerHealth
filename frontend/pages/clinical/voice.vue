<template>
  <v-container fluid class="gov-content pa-10">
    <v-row class="mb-8 no-gutters align-center">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar tile color="#C0392B" size="48" class="mr-4 shadow-sm"><v-icon dark>mdi-microphone</v-icon></v-avatar>
          <div>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">VOICE RECOGNITION</span>
            <h1 class="text-h4 font-weight-black gov-text-primary uppercase">Clinical Dictation</h1>
          </div>
        </div>
      </v-col>
      <v-spacer />
      <v-col cols="auto"><v-chip label color="#C0392B" dark class="font-weight-black text-caption">{{ draftCount }} DRAFTS</v-chip></v-col>
    </v-row>

    <v-alert dense text color="#003366" class="mb-6 font-weight-bold text-caption">
      <v-icon left small color="#003366">mdi-information</v-icon>
      Browser speech recognition is used when available. If unavailable, paste dictated text into the transcript box and save it as a clinical draft.
    </v-alert>

    <v-row class="no-gutters">
      <v-col cols="12" lg="4">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-red white--text font-weight-black text-caption ls-1 uppercase">DICTATION CAPTURE</div>
          <div class="pa-8">
            <v-form ref="form" v-model="valid">
              <v-autocomplete v-model="form.patientId" :items="patientItems" item-text="label" item-value="id" label="Patient" outlined tile dense :rules="[v => !!v || 'Required']" class="mb-4" />
              <v-select v-model="form.noteType" :items="['Nursing Note', 'Medical Note', 'Procedure Note', 'Discharge Summary', 'Referral Letter']" label="Note Type" outlined tile dense class="mb-4" />
              <div class="d-flex mb-4" style="gap:8px">
                <v-btn tile depressed :color="listening ? '#C0392B' : '#003366'" dark class="font-weight-black text-caption" @click="toggleListening">
                  <v-icon left small>{{ listening ? 'mdi-stop' : 'mdi-microphone' }}</v-icon>{{ listening ? 'STOP' : 'DICTATE' }}
                </v-btn>
                <v-btn tile outlined color="#6B7280" class="font-weight-black text-caption" @click="form.transcript = ''">CLEAR</v-btn>
              </div>
              <v-textarea v-model="form.transcript" label="Transcript" rows="8" outlined tile dense :rules="[v => !!v || 'Required']" class="mb-4" />
              <v-select v-model="form.status" :items="['Draft', 'Ready for Review', 'Signed']" label="Status" outlined tile dense class="mb-6" />
              <v-btn block tile depressed color="#C0392B" dark height="48" :disabled="!valid" class="font-weight-black text-caption" @click="save">SAVE DICTATION</v-btn>
            </v-form>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="8" class="pl-lg-8">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center flex-wrap" style="gap:10px">
            <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Search dictations..." single-line hide-details outlined tile dense class="bg-white max-400" />
            <v-spacer />
            <v-btn-toggle v-model="statusFilter" tile dense>
              <v-btn x-small value="" class="font-weight-black text-caption">ALL</v-btn>
              <v-btn x-small value="Draft" class="font-weight-black text-caption">DRAFT</v-btn>
              <v-btn x-small value="Ready for Review" class="font-weight-black text-caption">REVIEW</v-btn>
              <v-btn x-small value="Signed" class="font-weight-black text-caption">SIGNED</v-btn>
            </v-btn-toggle>
          </div>
          <v-data-table :headers="headers" :items="filteredDrafts" :search="search" class="gov-table" tile elevation="0">
            <template v-slot:item.patientName="{ item }"><span class="font-weight-black gov-text-primary">{{ item.patientName }}</span></template>
            <template v-slot:item.transcript="{ item }"><span class="text-caption">{{ item.transcript }}</span></template>
            <template v-slot:item.status="{ item }"><v-chip x-small dark label :color="statusColor(item.status)" class="font-weight-black">{{ item.status.toUpperCase() }}</v-chip></template>
            <template v-slot:item.actions="{ item }">
              <v-btn icon x-small @click="setStatus(item, 'Ready for Review')"><v-icon small color="#003366">mdi-eye-check</v-icon></v-btn>
              <v-btn icon x-small @click="setStatus(item, 'Signed')"><v-icon small color="#00A99D">mdi-draw-pen</v-icon></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  head: { title: 'Voice Recognition' },
  data() {
    return {
      valid: false,
      search: '',
      statusFilter: '',
      listening: false,
      recognition: null,
      form: { patientId: '', noteType: 'Medical Note', transcript: '', status: 'Draft' },
      headers: [
        { text: 'PATIENT', value: 'patientName' },
        { text: 'TYPE', value: 'noteType' },
        { text: 'TRANSCRIPT', value: 'transcript' },
        { text: 'STATUS', value: 'status', align: 'center' },
        { text: '', value: 'actions', sortable: false, align: 'right' }
      ]
    }
  },
  computed: {
    patients() { return this.$store.getters['clinical/getPatients'] || [] },
    patientItems() { return this.patients.map(patient => ({ id: patient.id, label: `${patient.id} - ${patient.name}` })) },
    drafts() {
      return (this.$store.getters['clinical/getVoiceDrafts'] || []).map(draft => {
        const patient = this.patients.find(item => item.id === draft.patientId)
        return { ...draft, patientName: patient ? patient.name : 'Unknown' }
      }).reverse()
    },
    filteredDrafts() { return this.statusFilter ? this.drafts.filter(item => item.status === this.statusFilter) : this.drafts },
    draftCount() { return this.drafts.filter(item => item.status !== 'Signed').length }
  },
  methods: {
    toggleListening() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        this.$toast.error('Speech recognition is not available in this browser.')
        return
      }
      if (this.listening && this.recognition) {
        this.recognition.stop()
        return
      }
      this.recognition = new SpeechRecognition()
      this.recognition.continuous = true
      this.recognition.interimResults = true
      this.recognition.lang = 'en-US'
      this.recognition.onresult = event => {
        let text = ''
        for (let index = 0; index < event.results.length; index += 1) text += event.results[index][0].transcript
        this.form.transcript = text
      }
      this.recognition.onend = () => { this.listening = false }
      this.listening = true
      this.recognition.start()
    },
    save() {
      if (!this.$refs.form.validate()) return
      this.$store.dispatch('clinical/createVoiceDraft', this.form)
      this.$toast.success('Dictation draft saved.')
      this.$refs.form.reset()
      this.form.noteType = 'Medical Note'
      this.form.status = 'Draft'
    },
    setStatus(item, status) { this.$store.dispatch('clinical/updateVoiceDraft', { ...item, status }) },
    statusColor(status) { return { Draft: '#6B7280', 'Ready for Review': '#D97706', Signed: '#00A99D' }[status] || '#6B7280' }
  }
}
</script>

<style scoped>
.gov-card { background: white !important; }
.bg-red { background-color: #C0392B !important; }
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
