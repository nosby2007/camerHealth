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
        <v-tabs v-model="tab" grow background-color="transparent" color="#0f766e" slider-color="#0f766e">
          <v-tab>Note</v-tab>
          <v-tab>Meds</v-tab>
          <v-tab>Precautions</v-tab>
          <v-tab>Appointments</v-tab>
        </v-tabs>
        <v-tabs-items v-model="tab">
          <v-tab-item>
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
          <v-icon x-small left>mdi-logout-variant</v-icon>File discharge
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
      readinessOptions: ['Ready now', 'Not yet ready', 'Needs review'],
      form: this.resetForm()
    }
  },
  watch: {
    open(value) {
      if (value) this.form = this.resetForm()
    }
  },
  methods: {
    resetForm() {
      return {
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
      this.saving = true
      try {
        const patientId = this.patientId
        const recordedAt = new Date().toISOString()
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
        this.$emit('saved', note)
        this.$emit('close')
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

