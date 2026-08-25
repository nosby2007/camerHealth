<template>
  <div class="vitals-assessment-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-heart-pulse</v-icon>
        <span>Vital Signs Assessment</span>
        <v-spacer />
        <button type="button" class="close-btn" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </button>
      </v-card-title>

      <v-divider />

      <v-card-text class="form-body">
        <form @submit.prevent="submitForm">
          <section class="form-section">
            <h3 class="section-title">Temperature</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Temperature (°C) *</label>
                <v-text-field
                  v-model="form.temperature"
                  type="number"
                  step="0.1"
                  min="35"
                  max="42"
                  outlined
                  dense
                  required
                />
              </div>
              <div class="form-group">
                <label>Site</label>
                <v-select
                  v-model="form.temperatureSite"
                  :items="['Oral', 'Axillary', 'Tympanic', 'Temporal']"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">Cardiovascular</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Heart Rate (bpm) *</label>
                <v-text-field
                  v-model="form.heartRate"
                  type="number"
                  min="30"
                  max="200"
                  outlined
                  dense
                  required
                />
              </div>
              <div class="form-group">
                <label>HR Rhythm</label>
                <v-select
                  v-model="form.heartRateRhythm"
                  :items="['Regular', 'Irregular', 'Rapid', 'Slow']"
                  outlined
                  dense
                />
              </div>
              <div class="form-group">
                <label>Systolic BP (mmHg) *</label>
                <v-text-field
                  v-model="form.bpSystolic"
                  type="number"
                  min="50"
                  max="250"
                  outlined
                  dense
                  required
                />
              </div>
              <div class="form-group">
                <label>Diastolic BP (mmHg) *</label>
                <v-text-field
                  v-model="form.bpDiastolic"
                  type="number"
                  min="30"
                  max="150"
                  outlined
                  dense
                  required
                />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">Respiratory</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Respiratory Rate (breaths/min) *</label>
                <v-text-field
                  v-model="form.respiratoryRate"
                  type="number"
                  min="8"
                  max="50"
                  outlined
                  dense
                  required
                />
              </div>
              <div class="form-group">
                <label>Breathing Pattern</label>
                <v-select
                  v-model="form.breathingPattern"
                  :items="['Regular', 'Labored', 'Shallow', 'Deep', 'Irregular']"
                  outlined
                  dense
                />
              </div>
              <div class="form-group">
                <label>SpO2 (%) *</label>
                <v-text-field
                  v-model="form.spo2"
                  type="number"
                  min="70"
                  max="100"
                  outlined
                  dense
                  required
                />
              </div>
              <div class="form-group">
                <label>O2 Source</label>
                <v-select
                  v-model="form.oxygenSource"
                  :items="['Room Air', 'Nasal Cannula', 'Face Mask', 'Non-rebreather', 'Ventilator']"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">Additional Vitals</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Blood Glucose (mg/dL)</label>
                <v-text-field
                  v-model="form.glucose"
                  type="number"
                  min="20"
                  max="600"
                  outlined
                  dense
                />
              </div>
              <div class="form-group">
                <label>Weight (kg)</label>
                <v-text-field
                  v-model="form.weight"
                  type="number"
                  step="0.1"
                  outlined
                  dense
                />
              </div>
              <div class="form-group">
                <label>Pain Level (0-10)</label>
                <v-slider
                  v-model="form.painLevel"
                  min="0"
                  max="10"
                  step="1"
                  thumb-label="always"
                />
              </div>
              <div class="form-group">
                <label>Mental Status</label>
                <v-select
                  v-model="form.mentalStatus"
                  :items="['Alert', 'Oriented x3', 'Confused', 'Lethargic', 'Unresponsive']"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">Assessment Notes</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Clinical Observations</label>
                <v-textarea
                  v-model="form.observations"
                  placeholder="Any significant findings or concerns..."
                  outlined
                  dense
                  rows="3"
                />
              </div>
            </div>
          </section>

          <div class="form-actions">
            <v-btn type="button" outlined @click="$emit('close')">
              Cancel
            </v-btn>
            <v-btn type="submit" color="primary" dark>
              Save Vital Signs
            </v-btn>
          </div>
        </form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'VitalsAssessmentForm',
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true }
  },
  data() {
    return {
      form: {
        temperature: '',
        temperatureSite: 'Oral',
        heartRate: '',
        heartRateRhythm: 'Regular',
        bpSystolic: '',
        bpDiastolic: '',
        respiratoryRate: '',
        breathingPattern: 'Regular',
        spo2: '',
        oxygenSource: 'Room Air',
        glucose: '',
        weight: '',
        painLevel: 0,
        mentalStatus: 'Alert',
        observations: ''
      }
    }
  },
  methods: {
    ...mapActions('flowsheets', ['createFlowsheetEntry']),
    async submitForm() {
      if (!this.form.temperature || !this.form.heartRate || !this.form.bpSystolic || !this.form.bpDiastolic || !this.form.respiratoryRate || !this.form.spo2) {
        alert('Please fill in all required vital signs')
        return
      }

      try {
        await this.createFlowsheetEntry({
          patientId: this.patientId,
          encounterId: this.encounterId,
          templateId: 'vital-signs',
          sectionId: 'vs-1',
          entries: {
            temp: this.form.temperature,
            hr: this.form.heartRate,
            hrRhythm: this.form.heartRateRhythm,
            sbp: this.form.bpSystolic,
            dbp: this.form.bpDiastolic,
            rr: this.form.respiratoryRate,
            breathingPattern: this.form.breathingPattern,
            spo2: this.form.spo2,
            o2Source: this.form.oxygenSource,
            glucose: this.form.glucose,
            weight: this.form.weight,
            pain: this.form.painLevel,
            mentalStatus: this.form.mentalStatus,
            notes: this.form.observations
          },
          recordedAt: new Date().toISOString()
        })
        this.$emit('save', this.form)
      } catch (error) {
        console.error('Error saving vitals:', error)
        alert('Error saving vital signs')
      }
    }
  }
}
</script>

<style scoped>
.vitals-assessment-form {
  width: 100%;
}

.form-header {
  background: linear-gradient(90deg, #0f3f3b 0%, #134e4a 100%);
  color: white !important;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.close-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  color: white;
  padding: 4px;
}

.form-body {
  padding: 24px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.form-section {
  margin-bottom: 24px;
}

.section-title {
  color: #0f172a;
  font-size: 13px;
  font-weight: 900;
  margin: 0 0 14px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  color: #334155;
  font-size: 12px;
  font-weight: 700;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}
</style>
