<template>
  <v-container fluid class="gov-content pa-8">
    <nurse-patient-header :patient="patient" />
    <v-row>
      <v-col cols="12" lg="7"><clinical-note-editor :value="selectedNote" @save="saveNote" @sign="signNote" /></v-col>
      <v-col cols="12" lg="5">
        <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
          <div class="pa-4 bg-grey lighten-4 border-bottom text-caption font-weight-black grey--text text-uppercase ls-1">Patient notes</div>
          <v-list dense class="pa-0">
            <v-list-item v-for="note in chart.notes" :key="note.id" class="border-bottom" @click="selectedNote = note">
              <v-list-item-content>
                <v-list-item-title class="text-caption font-weight-black gov-text-primary">{{ note.title || note.noteType }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption">{{ note.status }} · {{ note.createdAt }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-list-item v-if="!chart.notes.length"><v-list-item-title class="text-caption grey--text">No notes yet.</v-list-item-title></v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import NursePatientHeader from '~/components/nursing/NursePatientHeader.vue'
import ClinicalNoteEditor from '~/components/nursing/ClinicalNoteEditor.vue'

export default {
  components: { NursePatientHeader, ClinicalNoteEditor },
  layout: 'admins',
  head: { title: 'Clinical Clipboard' },
  data() { return { selectedNote: { noteType: 'nursing_note', title: '', body: '', status: 'draft' } } },
  computed: {
    patientId() { return this.$route.params.id },
    patient() { return (this.$store.getters['clinical/patientDirectory'] || []).find(item => item.id === this.patientId) || {} },
    chart() { return this.$store.getters['nursing/patientNursing360'](this.patientId) }
  },
  mounted() { this.$store.commit('nursing/LOAD_FROM_STORAGE') },
  methods: {
    async saveNote(note) {
      if (note.id) this.selectedNote = await this.$store.dispatch('nursing/updateClinicalNote', note)
      else this.selectedNote = await this.$store.dispatch('nursing/createClinicalNote', { ...note, patientId: this.patientId })
    },
    async signNote(id) { this.selectedNote = await this.$store.dispatch('nursing/signClinicalNote', id) }
  }
}
</script>

<style scoped>
.gov-card { background:white !important; }
.gov-text-primary { color:#1B1F23 !important; }
.b-1 { border:1px solid #E5E7EB; }
.border-bottom { border-bottom:1px solid #E5E7EB; }
.shadow-sm { box-shadow:0 2px 6px rgba(0,0,0,0.05) !important; }
.ls-1 { letter-spacing:0.8px !important; }
</style>
