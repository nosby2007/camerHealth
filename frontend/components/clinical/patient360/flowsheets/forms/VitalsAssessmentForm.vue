<template>
  <div class="vitals-assessment-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-heart-pulse</v-icon>
        <span>{{ $t('clinical360.flowsheets.forms.vitals.title') }}</span>
        <v-spacer />
        <button type="button" class="close-btn" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </button>
      </v-card-title>

      <v-divider />

      <v-card-text class="form-body">
        <form @submit.prevent="submitForm">
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.flowsheets.forms.vitals.section_temperature') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.vitals.label_temperature') }} *</label>
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
                <label>{{ $t('clinical360.flowsheets.forms.vitals.label_temperature_site') }}</label>
                <v-select
                  v-model="form.temperatureSite"
                  :items="temperatureSiteOptions"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.flowsheets.forms.vitals.section_cardiovascular') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.vitals.label_heart_rate') }} *</label>
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
                <label>{{ $t('clinical360.flowsheets.forms.vitals.label_hr_rhythm') }}</label>
                <v-select
                  v-model="form.heartRateRhythm"
                  :items="hrRhythmOptions"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.vitals.label_bp_systolic') }} *</label>
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
                <label>{{ $t('clinical360.flowsheets.forms.vitals.label_bp_diastolic') }} *</label>
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
            <h3 class="section-title">{{ $t('clinical360.flowsheets.forms.vitals.section_respiratory') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.vitals.label_respiratory_rate') }} *</label>
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
                <label>{{ $t('clinical360.flowsheets.forms.vitals.label_breathing_pattern') }}</label>
                <v-select
                  v-model="form.breathingPattern"
                  :items="breathingPatternOptions"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.vitals.label_spo2') }} *</label>
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
                <label>{{ $t('clinical360.flowsheets.forms.vitals.label_oxygen_source') }}</label>
                <v-select
                  v-model="form.oxygenSource"
                  :items="oxygenSourceOptions"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.flowsheets.forms.vitals.section_additional_vitals') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.vitals.label_glucose') }}</label>
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
                <label>{{ $t('clinical360.flowsheets.forms.vitals.label_weight') }}</label>
                <v-text-field
                  v-model="form.weight"
                  type="number"
                  step="0.1"
                  outlined
                  dense
                />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.vitals.label_pain_level') }}</label>
                <v-slider
                  v-model="form.painLevel"
                  min="0"
                  max="10"
                  step="1"
                  thumb-label="always"
                />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.vitals.label_mental_status') }}</label>
                <v-select
                  v-model="form.mentalStatus"
                  :items="mentalStatusOptions"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.flowsheets.forms.vitals.section_assessment_notes') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.vitals.label_observations') }}</label>
                <v-textarea
                  v-model="form.observations"
                  :placeholder="$t('clinical360.flowsheets.forms.vitals.placeholder_observations')"
                  outlined
                  dense
                  rows="3"
                />
              </div>
            </div>
          </section>

          <div class="form-actions">
            <v-btn type="button" outlined @click="$emit('close')">
              {{ $t('clinical360.flowsheets.forms.vitals.cancel') }}
            </v-btn>
            <v-btn type="submit" color="primary" dark>
              {{ $t('clinical360.flowsheets.forms.vitals.save') }}
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
        temperatureSite: '',
        heartRate: '',
        heartRateRhythm: '',
        bpSystolic: '',
        bpDiastolic: '',
        respiratoryRate: '',
        breathingPattern: '',
        spo2: '',
        oxygenSource: '',
        glucose: '',
        weight: '',
        painLevel: 0,
        mentalStatus: '',
        observations: ''
      }
    }
  },
  computed: {
    temperatureSiteOptions() {
      return [
        ['oral', 'Oral'], ['axillary', 'Axillary'], ['tympanic', 'Tympanic'], ['temporal', 'Temporal']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.flowsheets.forms.vitals.options.temperature_site.${k}`) }))
    },
    hrRhythmOptions() {
      return [
        ['regular', 'Regular'], ['irregular', 'Irregular'], ['rapid', 'Rapid'], ['slow', 'Slow']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.flowsheets.forms.vitals.options.hr_rhythm.${k}`) }))
    },
    breathingPatternOptions() {
      return [
        ['regular', 'Regular'], ['labored', 'Labored'], ['shallow', 'Shallow'], ['deep', 'Deep'], ['irregular', 'Irregular']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.flowsheets.forms.vitals.options.breathing_pattern.${k}`) }))
    },
    oxygenSourceOptions() {
      return [
        ['room_air', 'Room Air'], ['nasal_cannula', 'Nasal Cannula'], ['face_mask', 'Face Mask'],
        ['non_rebreather', 'Non-rebreather'], ['ventilator', 'Ventilator']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.flowsheets.forms.vitals.options.oxygen_source.${k}`) }))
    },
    mentalStatusOptions() {
      return [
        ['alert', 'Alert'], ['oriented_x3', 'Oriented x3'], ['confused', 'Confused'], ['lethargic', 'Lethargic'], ['unresponsive', 'Unresponsive']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.flowsheets.forms.vitals.options.mental_status.${k}`) }))
    }
  },
  created() {
    this.form.temperatureSite = 'Oral'
    this.form.heartRateRhythm = 'Regular'
    this.form.breathingPattern = 'Regular'
    this.form.oxygenSource = 'Room Air'
    this.form.mentalStatus = 'Alert'
  },
  methods: {
    ...mapActions('flowsheets', ['createFlowsheetEntry']),
    async submitForm() {
      if (!this.form.temperature || !this.form.heartRate || !this.form.bpSystolic || !this.form.bpDiastolic || !this.form.respiratoryRate || !this.form.spo2) {
        alert(this.$t('clinical360.flowsheets.forms.vitals.required_fields_error'))
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
        alert(this.$t('clinical360.flowsheets.forms.vitals.save_error'))
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
