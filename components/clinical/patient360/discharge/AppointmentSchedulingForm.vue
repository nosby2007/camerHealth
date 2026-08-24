<template>
  <div class="appointment-scheduling-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-calendar-multiple-check</v-icon>
        <span>Appointment Scheduling & Coordination</span>
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
            <h3 class="section-title">🏥 Primary Care Physician Follow-up *</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>PCP Name *</label>
                <v-text-field v-model="form.pcpName" placeholder="Dr. Name" outlined dense required />
              </div>
              <div class="form-group">
                <label>PCP Contact Phone *</label>
                <v-text-field v-model="form.pcpPhone" placeholder="(555) 123-4567" outlined dense required />
              </div>
              <div class="form-group">
                <label>Preferred Appointment Window *</label>
                <v-select
                  v-model="form.pcpAppointmentWindow"
                  :items="['1 week', '2 weeks', '3 weeks', '4 weeks', 'Within 24 hours']"
                  outlined dense required
                />
              </div>
              <div class="form-group">
                <label>Appointment Scheduled</label>
                <v-text-field v-model="form.pcpAppointmentDate" type="date" outlined dense />
              </div>
            </div>
          </section>

          <!-- Specialist Appointments -->
          <section class="form-section">
            <div class="section-header">
              <h3 class="section-title">🩺 Specialist Appointments</h3>
              <v-btn small text color="primary" @click="addSpecialist">
                <v-icon small>mdi-plus</v-icon>Add Specialist
              </v-btn>
            </div>

            <div class="specialists-list">
              <div v-for="(spec, idx) in form.specialists" :key="idx" class="specialist-card">
                <div class="specialist-content">
                  <div class="specialist-row">
                    <v-select
                      v-model="form.specialists[idx].specialty"
                      :items="specialtyOptions"
                      label="Specialty *"
                      outlined dense
                      required
                    />
                    <v-text-field
                      v-model="form.specialists[idx].providerName"
                      label="Provider Name"
                      outlined dense
                    />
                  </div>
                  <div class="specialist-row">
                    <v-text-field
                      v-model="form.specialists[idx].phone"
                      label="Phone"
                      outlined dense
                    />
                    <v-text-field
                      v-model="form.specialists[idx].location"
                      label="Location/Office"
                      outlined dense
                    />
                  </div>
                  <div class="specialist-row">
                    <v-text-field
                      v-model="form.specialists[idx].dueBy"
                      type="date"
                      label="Appointment due by"
                      outlined dense
                    />
                    <v-text-field
                      v-model="form.specialists[idx].appointmentDate"
                      type="date"
                      label="Scheduled date"
                      outlined dense
                    />
                  </div>
                  <v-text-field
                    v-model="form.specialists[idx].reason"
                    label="Reason for referral"
                    placeholder="Why this specialist?"
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
              <h3 class="section-title">🔬 Lab/Imaging Follow-up</h3>
              <v-btn small text color="primary" @click="addLabTest">
                <v-icon small>mdi-plus</v-icon>Add Test
              </v-btn>
            </div>

            <div class="tests-list">
              <div v-for="(test, idx) in form.labTests" :key="idx" class="test-card">
                <div class="test-content">
                  <v-combobox
                    v-model="form.labTests[idx].testName"
                    :items="labTestOptions"
                    label="Test Name *"
                    outlined dense required
                  />
                  <div class="test-row">
                    <v-text-field
                      v-model="form.labTests[idx].dueDate"
                      type="date"
                      label="Due date"
                      outlined dense
                    />
                    <v-text-field
                      v-model="form.labTests[idx].completedDate"
                      type="date"
                      label="Completed"
                      outlined dense
                    />
                    <v-select
                      v-model="form.labTests[idx].status"
                      :items="['Ordered', 'Scheduled', 'Completed', 'Pending results']"
                      label="Status"
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
            <h3 class="section-title">💪 Therapy Appointments</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Physical Therapy</label>
                <v-text-field v-model="form.physicalTherapy" placeholder="Provider and frequency" outlined dense />
              </div>
              <div class="form-group">
                <label>Occupational Therapy</label>
                <v-text-field v-model="form.occupationalTherapy" placeholder="Provider and frequency" outlined dense />
              </div>
              <div class="form-group">
                <label>Speech Therapy</label>
                <v-text-field v-model="form.speechTherapy" placeholder="Provider and frequency" outlined dense />
              </div>
              <div class="form-group">
                <label>Mental Health/Counseling</label>
                <v-text-field v-model="form.mentalHealthTherapy" placeholder="Provider and frequency" outlined dense />
              </div>
            </div>
          </section>

          <!-- Patient Notification -->
          <section class="form-section">
            <h3 class="section-title">📞 Patient Notification</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Patient Notified</label>
                <v-checkbox v-model="form.patientNotified" label="Yes" />
              </div>
              <div class="form-group">
                <label>Notification Date/Time</label>
                <v-text-field v-model="form.notificationDate" type="datetime-local" outlined dense />
              </div>
              <div class="form-group">
                <label>Notification Method</label>
                <v-select
                  v-model="form.notificationMethod"
                  :items="['Phone call', 'Text/SMS', 'Email', 'Patient portal', 'In-person']"
                  outlined dense
                />
              </div>
            </div>
            <v-text-field
              v-model="form.notificationNotes"
              label="Notification notes"
              placeholder="Who was notified, what was communicated..."
              outlined dense multi-line rows="2"
            />
          </section>

          <!-- Appointment Reminders -->
          <section class="form-section">
            <h3 class="section-title">⏰ Appointment Reminders</h3>
            <div class="checklist">
              <v-checkbox v-model="form.reminders.dayBefore" label="Send reminder 1 day before appointment" />
              <v-checkbox v-model="form.reminders.twoDaysBefore" label="Send reminder 2 days before appointment" />
              <v-checkbox v-model="form.reminders.phoneReminder" label="Phone reminder needed" />
            </div>
            <v-text-field
              v-model="form.reminders.reminderPhoneNumber"
              label="Reminder phone number"
              placeholder="Contact number for reminders"
              outlined dense
            />
          </section>

          <div class="form-actions">
            <v-btn type="button" outlined @click="$emit('close')">Cancel</v-btn>
            <v-btn type="submit" color="primary" dark>Save Appointments</v-btn>
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
      specialtyOptions: [
        'Cardiology', 'Oncology', 'Orthopedics', 'Neurology', 'Endocrinology',
        'Nephrology', 'Gastroenterology', 'Pulmonology', 'Dermatology', 'Urology', 'Other'
      ],
      labTestOptions: [
        'CBC', 'CMP', 'BMP', 'Troponin', 'INR/PT', 'aPTT', 'Glucose', 'HbA1c',
        'TSH', 'Lipid panel', 'LFTs', 'Urinalysis', 'Blood cultures', 'Other'
      ]
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
        alert('Please fill in PCP information')
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
        alert('Error saving appointments')
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
