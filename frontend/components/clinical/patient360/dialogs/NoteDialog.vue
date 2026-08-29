<template>
  <v-dialog :value="open" max-width="820" persistent scrollable @input="$emit('close')">
    <v-card class="note-dialog">
      <v-card-title class="dialog-title">
        <div>
          <span>{{ dialogEyebrow }}</span>
          <strong>{{ dialogHeadline }}</strong>
        </div>
        <v-btn icon small @click="$emit('close')"><v-icon small>mdi-close</v-icon></v-btn>
      </v-card-title>
      <v-card-text>
        <ClinicalNoteEditor :value="note" @save="handleSave" @sign="handleSign" />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import ClinicalNoteEditor from '~/components/nursing/ClinicalNoteEditor.vue'

const NOTE_TYPE_LABELS = {
  nursing_note: 'General Nursing Note',
  wound_note: 'Wound Care Note',
  progress_note: 'Progress Note',
  incident_note: 'Incident Note',
  provider_notification: 'Provider Notification',
  discharge_note: 'Discharge Note'
}

export default {
  name: 'NoteDialog',
  components: { ClinicalNoteEditor },
  props: {
    open: { type: Boolean, default: false },
    patientId: { type: String, required: true },
    noteType: { type: String, default: 'nursing_note' },
    dialogTitle: { type: String, default: '' },
    authorRole: { type: String, default: '' },
    existingNote: { type: Object, default: null }
  },
  data() {
    return {
      note: this.buildDraft()
    }
  },
  computed: {
    dialogEyebrow() {
      return this.authorRole ? `${this.authorRole} documentation` : 'Clinical documentation'
    },
    dialogHeadline() {
      return this.dialogTitle || NOTE_TYPE_LABELS[this.noteType] || 'Clinical Note'
    }
  },
  watch: {
    open(value) {
      if (value) this.note = this.buildDraft()
    },
    patientId() {
      this.$emit('close')
    }
  },
  methods: {
    buildDraft() {
      if (this.existingNote) return { ...this.existingNote }
      return {
        noteType: this.noteType,
        title: this.dialogTitle || NOTE_TYPE_LABELS[this.noteType] || '',
        body: '',
        status: 'draft'
      }
    },
    async handleSave(draft) {
      const payload = { ...draft, patientId: this.patientId, authorRole: this.authorRole }
      try {
        if (payload.id) {
          this.note = await this.$store.dispatch('nursing/updateClinicalNote', payload)
        } else {
          this.note = await this.$store.dispatch('nursing/createClinicalNote', payload)
        }
        this.$emit('saved', this.note)
      } catch (err) {
        this.$emit('error', err.response?.data?.error || err.message || 'Unable to save this note.')
      }
    },
    async handleSign(id) {
      try {
        this.note = await this.$store.dispatch('nursing/signClinicalNote', id)
        this.$emit('saved', this.note)
      } catch (err) {
        this.$emit('error', err.response?.data?.error || err.message || 'Unable to sign this note.')
      }
    }
  }
}
</script>

<style scoped>
.note-dialog {
  background: #fff;
}
.dialog-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background: #0f766e;
  color: #fff;
  padding: 14px 18px;
}
.dialog-title span {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  opacity: 0.85;
}
.dialog-title strong {
  display: block;
  font-size: 16px;
}
</style>
