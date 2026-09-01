<template>
  <div class="discharge-continuity-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-hospital-box-outline</v-icon>
        <span>{{ $t('clinical360.discharge.continuity_form.title') }}</span>
        <v-spacer />
        <button type="button" class="close-btn" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </button>
      </v-card-title>

      <v-divider />

      <v-card-text class="form-body">
        <form @submit.prevent="submitForm">
          <!-- Discharge Planning Summary -->
          <section class="form-section">
            <h3 class="section-title">📋 {{ $t('clinical360.discharge.continuity_form.section_summary_title') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.continuity_form.discharge_datetime_label') }} *</label>
                <v-text-field v-model="form.dischargeDateTime" type="datetime-local" outlined dense required />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.continuity_form.disposition_label') }} *</label>
                <v-select
                  v-model="form.disposition"
                  :items="dispositionOptions"
                  item-value="value"
                  item-text="text"
                  outlined dense required
                />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.continuity_form.destination_label') }}</label>
                <v-text-field v-model="form.destination" :placeholder="$t('clinical360.discharge.continuity_form.destination_placeholder')" outlined dense />
              </div>
            </div>
          </section>

          <!-- Medications at Discharge -->
          <section class="form-section">
            <h3 class="section-title">💊 {{ $t('clinical360.discharge.continuity_form.section_medications_title') }}</h3>
            <v-text-field
              v-model="form.medicationsAtDischarge"
              :label="$t('clinical360.discharge.continuity_form.medications_list_label')"
              :placeholder="$t('clinical360.discharge.continuity_form.medications_list_placeholder')"
              outlined dense multi-line rows="4"
            />
          </section>

          <!-- Instruction Content -->
          <section class="form-section">
            <h3 class="section-title">📝 {{ $t('clinical360.discharge.continuity_form.section_instructions_title') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.continuity_form.diet_instructions_label') }}</label>
                <v-text-field v-model="form.diet" :placeholder="$t('clinical360.discharge.continuity_form.diet_instructions_placeholder')" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.continuity_form.activity_restrictions_label') }}</label>
                <v-text-field v-model="form.activity" :placeholder="$t('clinical360.discharge.continuity_form.activity_restrictions_placeholder')" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.continuity_form.wound_care_instructions_label') }}</label>
                <v-textarea v-model="form.woundCare" :placeholder="$t('clinical360.discharge.continuity_form.wound_care_instructions_placeholder')" outlined dense rows="3" />
              </div>
            </div>
          </section>

          <!-- Signs/Symptoms to Monitor -->
          <section class="form-section">
            <h3 class="section-title">⚠️ {{ $t('clinical360.discharge.continuity_form.section_return_precautions_title') }}</h3>
            <v-textarea
              v-model="form.returnPrecautions"
              :label="$t('clinical360.discharge.continuity_form.return_precautions_label')"
              :placeholder="$t('clinical360.discharge.continuity_form.return_precautions_placeholder')"
              outlined dense rows="4"
            />
          </section>

          <!-- Follow-up Appointments -->
          <section class="form-section">
            <h3 class="section-title">📅 {{ $t('clinical360.discharge.continuity_form.section_appointments_title') }}</h3>
            <div class="appointments-list">
              <div v-for="(appt, idx) in form.appointments" :key="idx" class="appt-card">
                <div class="appt-content">
                  <v-text-field v-model="form.appointments[idx].provider" :placeholder="$t('clinical360.discharge.continuity_form.appointment_provider_placeholder')" outlined dense />
                  <v-text-field v-model="form.appointments[idx].date" type="date" :label="$t('clinical360.discharge.continuity_form.appointment_scheduled_date_label')" outlined dense />
                  <v-text-field v-model="form.appointments[idx].time" type="time" :label="$t('clinical360.discharge.continuity_form.appointment_time_label')" outlined dense />
                  <v-text-field v-model="form.appointments[idx].location" :placeholder="$t('clinical360.discharge.continuity_form.appointment_location_placeholder')" outlined dense />
                  <v-text-field v-model="form.appointments[idx].phone" :placeholder="$t('clinical360.discharge.continuity_form.appointment_phone_placeholder')" outlined dense />
                </div>
                <v-btn small icon @click="removeAppointment(idx)">
                  <v-icon small>mdi-close</v-icon>
                </v-btn>
              </div>
              <v-btn small text color="primary" @click="addAppointment">
                <v-icon small>mdi-plus</v-icon>{{ $t('clinical360.discharge.continuity_form.add_appointment_btn') }}
              </v-btn>
            </div>
          </section>

          <!-- Home Services -->
          <section class="form-section">
            <h3 class="section-title">🏥 {{ $t('clinical360.discharge.continuity_form.section_home_services_title') }}</h3>
            <div class="services-checklist">
              <div v-for="service in homeServices" :key="service" class="service-item">
                <v-checkbox v-model="form.homeServices[service]" />
                <span>{{ homeServiceLabels[service] }}</span>
              </div>
            </div>
            <v-text-field
              v-model="form.serviceDetails"
              :label="$t('clinical360.discharge.continuity_form.service_details_label')"
              :placeholder="$t('clinical360.discharge.continuity_form.service_details_placeholder')"
              outlined dense multi-line rows="3"
            />
          </section>

          <!-- Medications Teaching -->
          <section class="form-section">
            <h3 class="section-title">💊 {{ $t('clinical360.discharge.continuity_form.section_medication_teaching_title') }}</h3>
            <div class="checklist">
              <v-checkbox v-model="form.medicationTeachingDone" :label="$t('clinical360.discharge.continuity_form.medication_teaching_done')" />
              <v-checkbox v-model="form.sideEffectsTaught" :label="$t('clinical360.discharge.continuity_form.side_effects_taught')" />
              <v-checkbox v-model="form.interactionsTaught" :label="$t('clinical360.discharge.continuity_form.interactions_taught')" />
              <v-checkbox v-model="form.adherenceAssessed" :label="$t('clinical360.discharge.continuity_form.adherence_assessed')" />
            </div>
          </section>

          <!-- Transportation & Support -->
          <section class="form-section">
            <h3 class="section-title">🚗 {{ $t('clinical360.discharge.continuity_form.section_transportation_title') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.continuity_form.transportation_arranged_label') }}</label>
                <v-checkbox v-model="form.transportationArranged" :label="$t('clinical360.discharge.continuity_form.notified_yes')" />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.continuity_form.caregiver_label') }}</label>
                <v-text-field v-model="form.caregiver" :placeholder="$t('clinical360.discharge.continuity_form.caregiver_placeholder')" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.continuity_form.financial_resources_label') }}</label>
                <v-checkbox v-model="form.financialResourcesDiscussed" :label="$t('clinical360.discharge.continuity_form.financial_resources_checkbox')" />
              </div>
            </div>
          </section>

          <!-- Referrals -->
          <section class="form-section">
            <h3 class="section-title">📤 {{ $t('clinical360.discharge.continuity_form.section_referrals_title') }}</h3>
            <v-textarea
              v-model="form.referrals"
              :label="$t('clinical360.discharge.continuity_form.referrals_label')"
              :placeholder="$t('clinical360.discharge.continuity_form.referrals_placeholder')"
              outlined dense rows="3"
            />
          </section>

          <!-- Discharge Coordinator -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.discharge.continuity_form.section_coordination_title') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.continuity_form.coordinator_label') }}</label>
                <v-text-field v-model="form.coordinator" :placeholder="$t('clinical360.discharge.continuity_form.coordinator_placeholder')" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.continuity_form.coordinator_contact_label') }}</label>
                <v-text-field v-model="form.coordinatorContact" :placeholder="$t('clinical360.discharge.continuity_form.coordinator_contact_placeholder')" outlined dense />
              </div>
            </div>
          </section>

          <div class="form-actions">
            <v-btn type="button" outlined @click="$emit('close')">{{ $t('clinical360.discharge.continuity_form.cancel_btn') }}</v-btn>
            <v-btn type="submit" color="primary" dark>{{ $t('clinical360.discharge.continuity_form.save_btn') }}</v-btn>
          </div>
        </form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'DischargeContinuityForm',
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true }
  },
  data() {
    return {
      form: {
        dischargeDateTime: '', disposition: '', destination: '',
        medicationsAtDischarge: '', diet: '', activity: '', woundCare: '',
        returnPrecautions: '', appointments: [],
        homeServices: { nursing: false, PT: false, OT: false, speechTherapy: false, socialWork: false, dietitian: false },
        serviceDetails: '',
        medicationTeachingDone: false, sideEffectsTaught: false, interactionsTaught: false, adherenceAssessed: false,
        transportationArranged: false, caregiver: '', financialResourcesDiscussed: false,
        referrals: '', coordinator: '', coordinatorContact: ''
      },
      homeServices: ['Nursing', 'Physical therapy', 'Occupational therapy', 'Speech therapy', 'Social work', 'Dietitian']
    }
  },
  computed: {
    dispositionOptions() {
      return [
        ['disposition_home', 'Home'], ['disposition_home_with_services', 'Home with services'],
        ['disposition_assisted_living', 'Assisted living'], ['disposition_skilled_nursing', 'Skilled nursing'],
        ['disposition_acute_rehab', 'Acute rehab'], ['disposition_ltac', 'LTAC'], ['disposition_hospice', 'Hospice']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.discharge.continuity_form.${k}`) }))
    },
    homeServiceLabels() {
      return {
        Nursing: this.$t('clinical360.discharge.continuity_form.service_nursing'),
        'Physical therapy': this.$t('clinical360.discharge.continuity_form.service_physical_therapy'),
        'Occupational therapy': this.$t('clinical360.discharge.continuity_form.service_occupational_therapy'),
        'Speech therapy': this.$t('clinical360.discharge.continuity_form.service_speech_therapy'),
        'Social work': this.$t('clinical360.discharge.continuity_form.service_social_work'),
        Dietitian: this.$t('clinical360.discharge.continuity_form.service_dietitian')
      }
    }
  },
  methods: {
    ...mapActions('discharge', ['createDischargePlan']),
    addAppointment() {
      this.form.appointments.push({ provider: '', date: '', time: '', location: '', phone: '' })
    },
    removeAppointment(idx) {
      this.form.appointments.splice(idx, 1)
    },
    async submitForm() {
      try {
        await this.createDischargePlan({
          patientId: this.patientId,
          encounterId: this.encounterId,
          ...this.form,
          createdAt: new Date().toISOString()
        })
        this.$emit('save', this.form)
      } catch (error) {
        alert(this.$t('clinical360.discharge.continuity_form.error_save_failed'))
      }
    }
  }
}
</script>

<style scoped>
.discharge-continuity-form { width: 100%; }
.form-header { background: linear-gradient(90deg, #dc2626 0%, #991b1b 100%); color: white !important; padding: 16px; display: flex; align-items: center; gap: 12px; }
.close-btn { border: none; background: transparent; cursor: pointer; color: white; padding: 4px; }
.form-body { padding: 24px; max-height: calc(100vh - 200px); overflow-y: auto; }
.form-section { margin-bottom: 24px; }
.section-title { color: #0f172a; font-size: 13px; font-weight: 900; margin: 0 0 14px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { color: #334155; font-size: 12px; font-weight: 700; }
.appointments-list { display: flex; flex-direction: column; gap: 12px; }
.appt-card { display: flex; gap: 8px; padding: 12px; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 4px; }
.appt-content { flex: 1; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; }
.services-checklist { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; margin-bottom: 16px; }
.service-item { display: flex; align-items: center; gap: 8px; }
.checklist { display: flex; flex-direction: column; gap: 8px; }
.form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
</style>
