<template>
  <v-dialog :value="open" max-width="980" persistent scrollable @input="$emit('close')">
    <v-card class="discharge-dialog">
      <v-card-title class="dialog-title">
        <div>
          <span>Discharge and continuity</span>
          <strong>{{ patientName }}</strong>
        </div>
        <v-btn icon small @click="$emit('close')"><v-icon small>mdi-close</v-icon></v-btn>
      </v-card-title>
      <v-card-text>
        <v-alert v-if="formError" dense text type="error" class="mt-3 mb-2">
          {{ formError }}
        </v-alert>
        <v-tabs v-model="tab" grow background-color="transparent" color="#0f766e" slider-color="#0f766e">
          <v-tab>Note</v-tab>
          <v-tab>Meds</v-tab>
          <v-tab>Precautions</v-tab>
          <v-tab>Appointments</v-tab>
        </v-tabs>
        <v-tabs-items v-model="tab">
          <v-tab-item>
            <div class="discharge-grid">
              <v-text-field v-model="form.dischargeDateTime" type="datetime-local" label="Discharge date and time" dense outlined required />
              <v-select v-model="form.dischargeDisposition" :items="dispositionOptions" label="Disposition" dense outlined required />
            </div>
            <v-textarea v-model="form.note" label="Discharge note" rows="4" dense outlined />
            <v-textarea v-model="form.handoff" label="Handoff summary" rows="3" dense outlined />
            <v-select v-model="form.readiness" :items="readinessOptions" label="Readiness" dense outlined />
          </v-tab-item>
          <v-tab-item>
            <v-textarea v-model="form.medsAtDischarge" label="Meds at discharge" rows="5" dense outlined />
          </v-tab-item>
          <v-tab-item>
            <v-textarea v-model="form.returnPrecautions" label="Return precautions" rows="5" dense outlined />
          </v-tab-item>
          <v-tab-item>
            <v-text-field v-model="form.followUpAppointment" label="Follow-up appointment" dense outlined />
            <v-textarea v-model="form.appointments" label="Appointment notes" rows="4" dense outlined />
          </v-tab-item>
        </v-tabs-items>
      </v-card-text>
      <v-card-actions class="dialog-actions">
        <v-spacer />
        <v-btn text small @click="$emit('close')">Cancel</v-btn>
        <v-btn depressed color="#0f766e" dark small :loading="saving" @click="save">
          <v-icon x-small left>mdi-logout-variant</v-icon>Complete discharge
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'DischargePlanDialog',
  props: {
    open: { type: Boolean, default: false },
    patientId: { type: String, required: true },
    patientName: { type: String, default: '' }
  },
  data() {
    return {
      tab: 0,
      saving: false,
      formError: '',
      readinessOptions: ['Ready now', 'Not yet ready', 'Needs review'],
      dispositionOptions: ['Home', 'Home with Services', 'Rehabilitation', 'Skilled Nursing', 'Hospice', 'Transfer to Another Facility', 'Against Medical Advice', 'Deceased'],
      form: this.resetForm()
    }
  },
  watch: {
    open(value) {
      if (value) {
        this.form = this.resetForm()
        this.formError = ''
        this.tab = 0
      }
    }
  },
  methods: {
    resetForm() {
      return {
        dischargeDateTime: toLocalDateTime(new Date()),
        dischargeDisposition: 'Home',
        note: '',
        handoff: '',
        readiness: 'Not yet ready',
        medsAtDischarge: '',
        returnPrecautions: '',
        followUpAppointment: '',
        appointments: ''
      }
    },
    async save() {
      this.formError = this.validateForm()
      if (this.formError) {
        this.tab = this.validationTab()
        return
      }
      this.saving = true
      try {
        const patientId = this.patientId
        const recordedAt = new Date(this.form.dischargeDateTime).toISOString()
        const note = await this.$store.dispatch('discharge/addDischargeNote', {
          patientId,
          encounterId: this.$route.params.encounterId || null,
          noteType: 'discharge_note',
          title: 'Discharge note',
          body: [this.form.note, this.form.handoff].filter(Boolean).join('\n\n'),
          readiness: this.form.readiness,
          recordedAt
        })
        if (this.form.medsAtDischarge.trim()) {
          await this.$store.dispatch('discharge/addDischargeMedication', {
            patientId,
            encounterId: this.$route.params.encounterId || null,
            name: 'Discharge medication list',
            details: this.form.medsAtDischarge,
            recordedAt
          })
        }
        if (this.form.returnPrecautions.trim()) {
          await this.$store.dispatch('discharge/addReturnPrecaution', {
            patientId,
            encounterId: this.$route.params.encounterId || null,
            title: 'Return precautions',
            details: this.form.returnPrecautions,
            recordedAt
          })
        }
        if (this.form.followUpAppointment.trim() || this.form.appointments.trim()) {
          await this.$store.dispatch('discharge/addDischargeAppointment', {
            patientId,
            encounterId: this.$route.params.encounterId || null,
            title: this.form.followUpAppointment || 'Follow-up appointment',
            notes: this.form.appointments,
            recordedAt
          })
        }
        this.$emit('saved', {
          ...note,
          ...this.form,
          dischargedAt: recordedAt,
          disposition: this.form.dischargeDisposition
        })
        this.$emit('close')
      } catch (error) {
        this.formError = error.response?.data?.error || error.message || 'Discharge could not be completed.'
      } finally {
        this.saving = false
      }
    },
    validateForm() {
      if (!this.form.dischargeDateTime || !this.form.dischargeDisposition) return 'Discharge date, time and disposition are required.'
      if (this.form.readiness !== 'Ready now') return 'The patient must be marked Ready now before discharge.'
      if (!this.form.note.trim() || !this.form.handoff.trim()) return 'Discharge note and handoff summary are required.'
      if (!this.form.medsAtDischarge.trim()) return 'Document discharge medications or explicitly record that none are prescribed.'
      if (!this.form.returnPrecautions.trim()) return 'Return precautions are required.'
      return ''
    },
    validationTab() {
      if (!this.form.medsAtDischarge.trim()) return 1
      if (!this.form.returnPrecautions.trim()) return 2
      return 0
    }
  }
}

function toLocalDateTime(date) {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}
</script>

<style scoped>
.discharge-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

@media (max-width: 700px) {
  .discharge-grid {
    grid-template-columns: 1fr;
  }
}
</style>
