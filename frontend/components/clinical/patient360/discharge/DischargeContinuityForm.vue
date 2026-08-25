<template>
  <div class="discharge-continuity-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-hospital-box-outline</v-icon>
        <span>Discharge Continuity Planning</span>
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
            <h3 class="section-title">📋 Discharge Summary</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Discharge Date/Time *</label>
                <v-text-field v-model="form.dischargeDateTime" type="datetime-local" outlined dense required />
              </div>
              <div class="form-group">
                <label>Disposition Type *</label>
                <v-select
                  v-model="form.disposition"
                  :items="['Home', 'Home with services', 'Assisted living', 'Skilled nursing', 'Acute rehab', 'LTAC', 'Hospice']"
                  outlined dense required
                />
              </div>
              <div class="form-group">
                <label>Discharge Destination</label>
                <v-text-field v-model="form.destination" placeholder="Address/Facility name" outlined dense />
              </div>
            </div>
          </section>

          <!-- Medications at Discharge -->
          <section class="form-section">
            <h3 class="section-title">💊 Medications at Discharge</h3>
            <v-text-field
              v-model="form.medicationsAtDischarge"
              label="List all discharge medications"
              placeholder="Include: name, dose, route, frequency..."
              outlined dense multi-line rows="4"
            />
          </section>

          <!-- Instruction Content -->
          <section class="form-section">
            <h3 class="section-title">📝 Discharge Instructions</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Diet Instructions</label>
                <v-text-field v-model="form.diet" placeholder="Specific diet restrictions/recommendations..." outlined dense />
              </div>
              <div class="form-group">
                <label>Activity Restrictions</label>
                <v-text-field v-model="form.activity" placeholder="Weight bearing, lifting limits, return to work..." outlined dense />
              </div>
              <div class="form-group">
                <label>Wound Care Instructions</label>
                <v-textarea v-model="form.woundCare" placeholder="Dressing changes, signs of infection, bathing..." outlined dense rows="3" />
              </div>
            </div>
          </section>

          <!-- Signs/Symptoms to Monitor -->
          <section class="form-section">
            <h3 class="section-title">⚠️ Return Precautions</h3>
            <v-textarea
              v-model="form.returnPrecautions"
              label="When to return to hospital/seek care"
              placeholder="List red flags and warning signs..."
              outlined dense rows="4"
            />
          </section>

          <!-- Follow-up Appointments -->
          <section class="form-section">
            <h3 class="section-title">📅 Follow-up Appointments</h3>
            <div class="appointments-list">
              <div v-for="(appt, idx) in form.appointments" :key="idx" class="appt-card">
                <div class="appt-content">
                  <v-text-field v-model="form.appointments[idx].provider" placeholder="Provider name/specialty" outlined dense />
                  <v-text-field v-model="form.appointments[idx].date" type="date" label="Scheduled date" outlined dense />
                  <v-text-field v-model="form.appointments[idx].time" type="time" label="Time" outlined dense />
                  <v-text-field v-model="form.appointments[idx].location" placeholder="Office/clinic location" outlined dense />
                  <v-text-field v-model="form.appointments[idx].phone" placeholder="Contact phone" outlined dense />
                </div>
                <v-btn small icon @click="removeAppointment(idx)">
                  <v-icon small>mdi-close</v-icon>
                </v-btn>
              </div>
              <v-btn small text color="primary" @click="addAppointment">
                <v-icon small>mdi-plus</v-icon>Add Appointment
              </v-btn>
            </div>
          </section>

          <!-- Home Services -->
          <section class="form-section">
            <h3 class="section-title">🏥 Home Services Arranged</h3>
            <div class="services-checklist">
              <div v-for="service in homeServices" :key="service" class="service-item">
                <v-checkbox v-model="form.homeServices[service]" />
                <span>{{ service }}</span>
              </div>
            </div>
            <v-text-field
              v-model="form.serviceDetails"
              label="Service provider details and schedule"
              placeholder="Agency names, phone numbers, visit times..."
              outlined dense multi-line rows="3"
            />
          </section>

          <!-- Medications Teaching -->
          <section class="form-section">
            <h3 class="section-title">💊 Medication Teaching Completed</h3>
            <div class="checklist">
              <v-checkbox v-model="form.medicationTeachingDone" label="Patient/family educated on all medications" />
              <v-checkbox v-model="form.sideEffectsTaught" label="Side effects and when to report reviewed" />
              <v-checkbox v-model="form.interactionsTaught" label="Drug interactions and food interactions discussed" />
              <v-checkbox v-model="form.adherenceAssessed" label="Adherence plan and resources provided" />
            </div>
          </section>

          <!-- Transportation & Support -->
          <section class="form-section">
            <h3 class="section-title">🚗 Transportation & Support</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Transportation Arranged</label>
                <v-checkbox v-model="form.transportationArranged" label="Yes" />
              </div>
              <div class="form-group">
                <label>Caregiver/Support Person</label>
                <v-text-field v-model="form.caregiver" placeholder="Name and relationship" outlined dense />
              </div>
              <div class="form-group">
                <label>Financial Resources Discussed</label>
                <v-checkbox v-model="form.financialResourcesDiscussed" label="Medicare/Medicaid, payment options" />
              </div>
            </div>
          </section>

          <!-- Referrals -->
          <section class="form-section">
            <h3 class="section-title">📤 Referrals & Resources</h3>
            <v-textarea
              v-model="form.referrals"
              label="Referrals made and community resources provided"
              placeholder="Physical therapy, nutrition, social services, support groups..."
              outlined dense rows="3"
            />
          </section>

          <!-- Discharge Coordinator -->
          <section class="form-section">
            <h3 class="section-title">Discharge Coordination</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Discharge Coordinator</label>
                <v-text-field v-model="form.coordinator" placeholder="Name/Title" outlined dense />
              </div>
              <div class="form-group">
                <label>Coordinator Contact</label>
                <v-text-field v-model="form.coordinatorContact" placeholder="Phone number" outlined dense />
              </div>
            </div>
          </section>

          <div class="form-actions">
            <v-btn type="button" outlined @click="$emit('close')">Cancel</v-btn>
            <v-btn type="submit" color="primary" dark>Save Discharge Plan</v-btn>
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
        alert('Error saving discharge plan')
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
