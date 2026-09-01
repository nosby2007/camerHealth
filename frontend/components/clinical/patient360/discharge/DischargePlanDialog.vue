<template>
  <v-dialog :value="open" max-width="980" persistent scrollable @input="$emit('close')">
    <v-card class="discharge-dialog">
      <v-card-title class="dialog-title">
        <div>
          <span>{{ $t('clinical360.discharge.plan_dialog.title') }}</span>
          <strong>{{ patientName }}</strong>
        </div>
        <v-btn icon small @click="$emit('close')"><v-icon small>mdi-close</v-icon></v-btn>
      </v-card-title>
      <v-card-text>
        <v-alert v-if="formError" dense text type="error" class="mt-3 mb-2">
          {{ formError }}
        </v-alert>
        <v-tabs v-model="tab" grow background-color="transparent" color="#0f766e" slider-color="#0f766e">
          <v-tab>{{ $t('clinical360.discharge.plan_dialog.tab_note') }}</v-tab>
          <v-tab>{{ $t('clinical360.discharge.plan_dialog.tab_meds') }}</v-tab>
          <v-tab>{{ $t('clinical360.discharge.plan_dialog.tab_precautions') }}</v-tab>
          <v-tab>{{ $t('clinical360.discharge.plan_dialog.tab_appointments') }}</v-tab>
        </v-tabs>
        <v-tabs-items v-model="tab">
          <v-tab-item>
            <div class="discharge-grid">
              <v-text-field v-model="form.dischargeDateTime" type="datetime-local" :label="$t('clinical360.discharge.plan_dialog.discharge_datetime_label')" dense outlined required />
              <v-select v-model="form.dischargeDisposition" :items="dispositionOptions" item-text="text" item-value="value" :label="$t('clinical360.discharge.plan_dialog.disposition_label')" dense outlined required />
            </div>
            <v-textarea v-model="form.note" :label="$t('clinical360.discharge.plan_dialog.note_label')" rows="4" dense outlined />
            <v-textarea v-model="form.handoff" :label="$t('clinical360.discharge.plan_dialog.handoff_label')" rows="3" dense outlined />
            <v-select v-model="form.readiness" :items="readinessOptions" item-text="text" item-value="value" :label="$t('clinical360.discharge.plan_dialog.readiness_label')" dense outlined />
          </v-tab-item>
          <v-tab-item>
            <v-textarea v-model="form.medsAtDischarge" :label="$t('clinical360.discharge.plan_dialog.meds_at_discharge_label')" rows="5" dense outlined />
          </v-tab-item>
          <v-tab-item>
            <v-textarea v-model="form.returnPrecautions" :label="$t('clinical360.discharge.plan_dialog.return_precautions_label')" rows="5" dense outlined />
          </v-tab-item>
          <v-tab-item>
            <v-text-field v-model="form.followUpAppointment" :label="$t('clinical360.discharge.plan_dialog.follow_up_appointment_label')" dense outlined />
            <v-textarea v-model="form.appointments" :label="$t('clinical360.discharge.plan_dialog.appointment_notes_label')" rows="4" dense outlined />
          </v-tab-item>
        </v-tabs-items>
      </v-card-text>
      <v-card-actions class="dialog-actions">
        <v-spacer />
        <v-btn text small @click="$emit('close')">{{ $t('clinical360.discharge.plan_dialog.cancel_btn') }}</v-btn>
        <v-btn depressed color="#0f766e" dark small :loading="saving" @click="save">
          <v-icon x-small left>mdi-logout-variant</v-icon>{{ $t('clinical360.discharge.plan_dialog.complete_discharge_btn') }}
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
      form: this.resetForm()
    }
  },
  computed: {
    readinessOptions() {
      return [
        { value: 'Ready now', text: this.$t('clinical360.discharge.plan_dialog.readiness_ready_now') },
        { value: 'Not yet ready', text: this.$t('clinical360.discharge.plan_dialog.readiness_not_yet_ready') },
        { value: 'Needs review', text: this.$t('clinical360.discharge.plan_dialog.readiness_needs_review') }
      ]
    },
    dispositionOptions() {
      return [
        { value: 'Home', text: this.$t('clinical360.discharge.plan_dialog.disposition_home') },
        { value: 'Home with Services', text: this.$t('clinical360.discharge.plan_dialog.disposition_home_with_services') },
        { value: 'Rehabilitation', text: this.$t('clinical360.discharge.plan_dialog.disposition_rehabilitation') },
        { value: 'Skilled Nursing', text: this.$t('clinical360.discharge.plan_dialog.disposition_skilled_nursing') },
        { value: 'Hospice', text: this.$t('clinical360.discharge.plan_dialog.disposition_hospice') },
        { value: 'Transfer to Another Facility', text: this.$t('clinical360.discharge.plan_dialog.disposition_transfer') },
        { value: 'Against Medical Advice', text: this.$t('clinical360.discharge.plan_dialog.disposition_ama') },
        { value: 'Deceased', text: this.$t('clinical360.discharge.plan_dialog.disposition_deceased') }
      ]
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
          title: this.$t('clinical360.discharge.plan_dialog.discharge_note_title'),
          body: [this.form.note, this.form.handoff].filter(Boolean).join('\n\n'),
          readiness: this.form.readiness,
          recordedAt
        })
        if (this.form.medsAtDischarge.trim()) {
          await this.$store.dispatch('discharge/addDischargeMedication', {
            patientId,
            encounterId: this.$route.params.encounterId || null,
            name: this.$t('clinical360.discharge.plan_dialog.discharge_medication_list_name'),
            details: this.form.medsAtDischarge,
            recordedAt
          })
        }
        if (this.form.returnPrecautions.trim()) {
          await this.$store.dispatch('discharge/addReturnPrecaution', {
            patientId,
            encounterId: this.$route.params.encounterId || null,
            title: this.$t('clinical360.discharge.plan_dialog.return_precautions_title'),
            details: this.form.returnPrecautions,
            recordedAt
          })
        }
        if (this.form.followUpAppointment.trim() || this.form.appointments.trim()) {
          await this.$store.dispatch('discharge/addDischargeAppointment', {
            patientId,
            encounterId: this.$route.params.encounterId || null,
            title: this.form.followUpAppointment || this.$t('clinical360.discharge.plan_dialog.follow_up_appointment_default_title'),
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
        this.formError = error.response?.data?.error || error.message || this.$t('clinical360.discharge.plan_dialog.error_discharge_failed')
      } finally {
        this.saving = false
      }
    },
    validateForm() {
      if (!this.form.dischargeDateTime || !this.form.dischargeDisposition) return this.$t('clinical360.discharge.plan_dialog.error_datetime_disposition_required')
      if (this.form.readiness !== 'Ready now') return this.$t('clinical360.discharge.plan_dialog.error_readiness_required')
      if (!this.form.note.trim() || !this.form.handoff.trim()) return this.$t('clinical360.discharge.plan_dialog.error_note_handoff_required')
      if (!this.form.medsAtDischarge.trim()) return this.$t('clinical360.discharge.plan_dialog.error_medications_required')
      if (!this.form.returnPrecautions.trim()) return this.$t('clinical360.discharge.plan_dialog.error_return_precautions_required')
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
