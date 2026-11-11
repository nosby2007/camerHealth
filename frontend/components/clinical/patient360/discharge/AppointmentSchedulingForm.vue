<template>
  <div class="appointment-scheduling-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-calendar-multiple-check</v-icon>
        <span>{{ $t('clinical360.discharge.appointment_form.title') }}</span>
        <v-spacer />
        <button type="button" class="close-btn" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </button>
      </v-card-title>

      <v-divider />

      <v-card-text class="form-body">
        <form @submit.prevent="submitForm">
          <!-- Primary Care Follow-up -->
          <section class="form-section">
            <h3 class="section-title">🏥 {{ $t('clinical360.discharge.appointment_form.section_pcp_title') }} *</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.appointment_form.pcp_name_label') }} *</label>
                <v-text-field v-model="form.pcpName" :placeholder="$t('clinical360.discharge.appointment_form.pcp_name_placeholder')" outlined dense required />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.appointment_form.pcp_phone_label') }} *</label>
                <v-text-field v-model="form.pcpPhone" :placeholder="$t('clinical360.discharge.appointment_form.pcp_phone_placeholder')" outlined dense required />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.appointment_form.appointment_window_label') }} *</label>
                <v-select
                  v-model="form.pcpAppointmentWindow"
                  :items="appointmentWindowOptions"
                  item-value="value"
                  item-text="text"
                  outlined dense required
                />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.appointment_form.appointment_scheduled_label') }}</label>
                <v-text-field v-model="form.pcpAppointmentDate" type="date" outlined dense />
              </div>
            </div>
          </section>

          <!-- Specialist Appointments -->
          <section class="form-section">
            <div class="section-header">
              <h3 class="section-title">🩺 {{ $t('clinical360.discharge.appointment_form.section_specialist_title') }}</h3>
              <v-btn small text color="primary" @click="addSpecialist">
                <v-icon small>mdi-plus</v-icon>{{ $t('clinical360.discharge.appointment_form.add_specialist_btn') }}
              </v-btn>
            </div>

            <div class="specialists-list">
              <div v-for="(spec, idx) in form.specialists" :key="idx" class="specialist-card">
                <div class="specialist-content">
                  <div class="specialist-row">
                    <v-select
                      v-model="form.specialists[idx].specialty"
                      :items="specialtyOptions"
                      item-value="value"
                      item-text="text"
                      :label="$t('clinical360.discharge.appointment_form.specialty_label') + ' *'"
                      outlined dense
                      required
                    />
                    <v-text-field
                      v-model="form.specialists[idx].providerName"
                      :label="$t('clinical360.discharge.appointment_form.provider_name_label')"
                      outlined dense
                    />
                  </div>
                  <div class="specialist-row">
                    <v-text-field
                      v-model="form.specialists[idx].phone"
                      :label="$t('clinical360.discharge.appointment_form.phone_label')"
                      outlined dense
                    />
                    <v-text-field
                      v-model="form.specialists[idx].location"
                      :label="$t('clinical360.discharge.appointment_form.location_label')"
                      outlined dense
                    />
                  </div>
                  <div class="specialist-row">
                    <v-text-field
                      v-model="form.specialists[idx].dueBy"
                      type="date"
                      :label="$t('clinical360.discharge.appointment_form.due_by_label')"
                      outlined dense
                    />
                    <v-text-field
                      v-model="form.specialists[idx].appointmentDate"
                      type="date"
                      :label="$t('clinical360.discharge.appointment_form.scheduled_date_label')"
                      outlined dense
                    />
                  </div>
                  <v-text-field
                    v-model="form.specialists[idx].reason"
                    :label="$t('clinical360.discharge.appointment_form.reason_label')"
                    :placeholder="$t('clinical360.discharge.appointment_form.reason_placeholder')"
                    outlined dense
                  />
                </div>
                <v-btn small icon @click="removeSpecialist(idx)">
                  <v-icon small>mdi-close</v-icon>
                </v-btn>
              </div>
            </div>
          </section>

          <!-- Lab/Imaging Follow-up -->
          <section class="form-section">
            <div class="section-header">
              <h3 class="section-title">🔬 {{ $t('clinical360.discharge.appointment_form.section_lab_title') }}</h3>
              <v-btn small text color="primary" @click="addLabTest">
                <v-icon small>mdi-plus</v-icon>{{ $t('clinical360.discharge.appointment_form.add_test_btn') }}
              </v-btn>
            </div>

            <div class="tests-list">
              <div v-for="(test, idx) in form.labTests" :key="idx" class="test-card">
                <div class="test-content">
                  <v-combobox
                    v-model="form.labTests[idx].testName"
                    :items="labTestOptions"
                    :label="$t('clinical360.discharge.appointment_form.test_name_label') + ' *'"
                    outlined dense required
                  />
                  <div class="test-row">
                    <v-text-field
                      v-model="form.labTests[idx].dueDate"
                      type="date"
                      :label="$t('clinical360.discharge.appointment_form.due_date_label')"
                      outlined dense
                    />
                    <v-text-field
                      v-model="form.labTests[idx].completedDate"
                      type="date"
                      :label="$t('clinical360.discharge.appointment_form.completed_label')"
                      outlined dense
                    />
                    <v-select
                      v-model="form.labTests[idx].status"
                      :items="labTestStatusOptions"
                      item-value="value"
                      item-text="text"
                      :label="$t('clinical360.discharge.appointment_form.status_label')"
                      outlined dense
                    />
                  </div>
                </div>
                <v-btn small icon @click="removeLabTest(idx)">
                  <v-icon small>mdi-close</v-icon>
                </v-btn>
              </div>
            </div>
          </section>

          <!-- Therapy Appointments -->
          <section class="form-section">
            <h3 class="section-title">💪 {{ $t('clinical360.discharge.appointment_form.section_therapy_title') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.appointment_form.physical_therapy_label') }}</label>
                <v-text-field v-model="form.physicalTherapy" :placeholder="$t('clinical360.discharge.appointment_form.therapy_placeholder')" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.appointment_form.occupational_therapy_label') }}</label>
                <v-text-field v-model="form.occupationalTherapy" :placeholder="$t('clinical360.discharge.appointment_form.therapy_placeholder')" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.appointment_form.speech_therapy_label') }}</label>
                <v-text-field v-model="form.speechTherapy" :placeholder="$t('clinical360.discharge.appointment_form.therapy_placeholder')" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.appointment_form.mental_health_label') }}</label>
                <v-text-field v-model="form.mentalHealthTherapy" :placeholder="$t('clinical360.discharge.appointment_form.therapy_placeholder')" outlined dense />
              </div>
            </div>
          </section>

          <!-- Patient Notification -->
          <section class="form-section">
            <h3 class="section-title">📞 {{ $t('clinical360.discharge.appointment_form.section_notification_title') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.appointment_form.patient_notified_label') }}</label>
                <v-checkbox v-model="form.patientNotified" :label="$t('clinical360.discharge.appointment_form.notified_yes')" />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.appointment_form.notification_datetime_label') }}</label>
                <v-text-field v-model="form.notificationDate" type="datetime-local" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.appointment_form.notification_method_label') }}</label>
                <v-select
                  v-model="form.notificationMethod"
                  :items="notificationMethodOptions"
                  item-value="value"
                  item-text="text"
                  outlined dense
                />
              </div>
            </div>
            <v-text-field
              v-model="form.notificationNotes"
              :label="$t('clinical360.discharge.appointment_form.notification_notes_label')"
              :placeholder="$t('clinical360.discharge.appointment_form.notification_notes_placeholder')"
              outlined dense multi-line rows="2"
            />
          </section>

          <!-- Appointment Reminders -->
          <section class="form-section">
            <h3 class="section-title">⏰ {{ $t('clinical360.discharge.appointment_form.section_reminders_title') }}</h3>
            <div class="checklist">
              <v-checkbox v-model="form.reminders.dayBefore" :label="$t('clinical360.discharge.appointment_form.reminder_day_before')" />
              <v-checkbox v-model="form.reminders.twoDaysBefore" :label="$t('clinical360.discharge.appointment_form.reminder_two_days_before')" />
              <v-checkbox v-model="form.reminders.phoneReminder" :label="$t('clinical360.discharge.appointment_form.reminder_phone_needed')" />
            </div>
            <v-text-field
              v-model="form.reminders.reminderPhoneNumber"
              :label="$t('clinical360.discharge.appointment_form.reminder_phone_label')"
              :placeholder="$t('clinical360.discharge.appointment_form.reminder_phone_placeholder')"
              outlined dense
            />
          </section>

          <div class="form-actions">
            <v-btn type="button" outlined @click="$emit('close')">{{ $t('clinical360.discharge.appointment_form.cancel_btn') }}</v-btn>
            <v-btn type="submit" color="primary" dark>{{ $t('clinical360.discharge.appointment_form.save_btn') }}</v-btn>
          </div>
        </form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'AppointmentSchedulingForm',
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true }
  },
  data() {
    return {
      form: {
        pcpName: '', pcpPhone: '', pcpAppointmentWindow: '2 weeks', pcpAppointmentDate: '',
        specialists: [],
        labTests: [],
        physicalTherapy: '', occupationalTherapy: '', speechTherapy: '', mentalHealthTherapy: '',
        patientNotified: false, notificationDate: '', notificationMethod: 'Phone call', notificationNotes: '',
        reminders: { dayBefore: true, twoDaysBefore: false, phoneReminder: false, reminderPhoneNumber: '' }
      },
      labTestOptions: [
        'CBC', 'CMP', 'BMP', 'Troponin', 'INR/PT', 'aPTT', 'Glucose', 'HbA1c',
        'TSH', 'Lipid panel', 'LFTs', 'Urinalysis', 'Blood cultures', 'Other'
      ]
    }
  },
  computed: {
    appointmentWindowOptions() {
      return [
        ['window_1_week', '1 week'], ['window_2_weeks', '2 weeks'], ['window_3_weeks', '3 weeks'],
        ['window_4_weeks', '4 weeks'], ['window_within_24_hours', 'Within 24 hours']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.discharge.appointment_form.${k}`) }))
    },
    specialtyOptions() {
      return [
        ['specialty_cardiology', 'Cardiology'], ['specialty_oncology', 'Oncology'], ['specialty_orthopedics', 'Orthopedics'],
        ['specialty_neurology', 'Neurology'], ['specialty_endocrinology', 'Endocrinology'], ['specialty_nephrology', 'Nephrology'],
        ['specialty_gastroenterology', 'Gastroenterology'], ['specialty_pulmonology', 'Pulmonology'],
        ['specialty_dermatology', 'Dermatology'], ['specialty_urology', 'Urology'], ['specialty_other', 'Other']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.discharge.appointment_form.${k}`) }))
    },
    labTestStatusOptions() {
      return [
        ['status_ordered', 'Ordered'], ['status_scheduled', 'Scheduled'],
        ['status_completed', 'Completed'], ['status_pending_results', 'Pending results']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.discharge.appointment_form.${k}`) }))
    },
    notificationMethodOptions() {
      return [
        ['method_phone_call', 'Phone call'], ['method_text_sms', 'Text/SMS'], ['method_email', 'Email'],
        ['method_patient_portal', 'Patient portal'], ['method_in_person', 'In-person']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.discharge.appointment_form.${k}`) }))
    }
  },
  methods: {
    ...mapActions('discharge', ['createAppointmentSchedule']),
    addSpecialist() {
      this.form.specialists.push({
        specialty: '', providerName: '', phone: '', location: '', dueBy: '', appointmentDate: '', reason: ''
      })
    },
    removeSpecialist(idx) {
      this.form.specialists.splice(idx, 1)
    },
    addLabTest() {
      this.form.labTests.push({
        testName: '', dueDate: '', completedDate: '', status: 'Ordered'
      })
    },
    removeLabTest(idx) {
      this.form.labTests.splice(idx, 1)
    },
    async submitForm() {
      if (!this.form.pcpName || !this.form.pcpPhone) {
        alert(this.$t('clinical360.discharge.appointment_form.error_pcp_required'))
        return
      }
      try {
        await this.createAppointmentSchedule({
          patientId: this.patientId,
          encounterId: this.encounterId,
          ...this.form,
          createdAt: new Date().toISOString()
        })
        this.$emit('save', this.form)
      } catch (error) {
        alert(this.$t('clinical360.discharge.appointment_form.error_save_failed'))
      }
    }
  }
}
</script>

<style scoped>
.appointment-scheduling-form { width: 100%; }
.form-header { background: linear-gradient(90deg, #0891b2 0%, #0369a1 100%); color: white !important; padding: 16px; display: flex; align-items: center; gap: 12px; }
.close-btn { border: none; background: transparent; cursor: pointer; color: white; padding: 4px; }
.form-body { padding: 24px; max-height: calc(100vh - 200px); overflow-y: auto; }
.form-section { margin-bottom: 24px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.section-title { color: #0f172a; font-size: 13px; font-weight: 900; margin: 0; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { color: #334155; font-size: 12px; font-weight: 700; }
.specialists-list, .tests-list { display: flex; flex-direction: column; gap: 12px; }
.specialist-card, .test-card { display: flex; gap: 8px; padding: 12px; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 4px; }
.specialist-content, .test-content { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.specialist-row, .test-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; }
.checklist { display: flex; flex-direction: column; gap: 8px; }
.form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
</style>
