<template>
  <div class="pain-assessment-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-alert-circle</v-icon>
        <span>{{ $t('clinical360.flowsheets.forms.pain.title') }}</span>
        <v-spacer />
        <button type="button" class="close-btn" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </button>
      </v-card-title>

      <v-divider />

      <v-card-text class="form-body">
        <form @submit.prevent="submitForm">
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.flowsheets.forms.pain.section_pain_score') }}</h3>
            <div class="pain-scale">
              <div class="scale-visual">
                <div class="scale-slider">
                  <v-slider
                    v-model="form.painScore"
                    min="0"
                    max="10"
                    step="1"
                    track-size="8"
                    thumb-size="32"
                    thumb-label="always"
                    color="#be123c"
                  />
                </div>
                <div class="scale-labels">
                  <span class="no-pain">{{ $t('clinical360.flowsheets.forms.pain.no_pain_label') }}</span>
                  <span class="worst-pain">{{ $t('clinical360.flowsheets.forms.pain.worst_pain_label') }}</span>
                </div>
              </div>

              <div class="pain-descriptors">
                <div v-for="level in painLevels" :key="level.score" class="descriptor-chip">
                  <span class="score">{{ level.score }}</span>
                  <span class="label">{{ level.label }}</span>
                </div>
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.flowsheets.forms.pain.section_pain_characteristics') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.pain.label_pain_location') }} *</label>
                <v-text-field
                  v-model="form.painLocation"
                  :placeholder="$t('clinical360.flowsheets.forms.pain.placeholder_pain_location')"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.pain.label_pain_type') }}</label>
                <v-select
                  v-model="form.painType"
                  :items="painTypeOptions"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.pain.label_pain_onset') }}</label>
                <v-select
                  v-model="form.painOnset"
                  :items="painOnsetOptions"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.pain.label_pain_duration') }}</label>
                <v-select
                  v-model="form.painDuration"
                  :items="painDurationOptions"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.flowsheets.forms.pain.section_pain_management') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.pain.label_current_medication') }}</label>
                <v-text-field
                  v-model="form.currentMedication"
                  :placeholder="$t('clinical360.flowsheets.forms.pain.placeholder_current_medication')"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.pain.label_nonpharm_interventions') }}</label>
                <v-combobox
                  v-model="form.nonPharmInterventions"
                  :items="nonpharmOptions"
                  item-value="value"
                  item-text="text"
                  multiple
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.pain.label_intervention_effectiveness') }}</label>
                <v-select
                  v-model="form.interventionEffectiveness"
                  :items="effectivenessOptions"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.flowsheets.forms.pain.section_behavioral_observations') }}</h3>
            <div class="checklist">
              <label v-for="behavior in painBehaviors" :key="behavior.id" class="checklist-item">
                <v-checkbox v-model="form.behaviors[behavior.id]" />
                <span>{{ behavior.label }}</span>
              </label>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.flowsheets.forms.pain.section_assessment_notes') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.pain.label_functional_impact') }}</label>
                <v-textarea
                  v-model="form.functionalImpact"
                  :placeholder="$t('clinical360.flowsheets.forms.pain.placeholder_functional_impact')"
                  outlined
                  dense
                  rows="3"
                />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.pain.label_nursing_interventions') }}</label>
                <v-textarea
                  v-model="form.nursingInterventions"
                  :placeholder="$t('clinical360.flowsheets.forms.pain.placeholder_nursing_interventions')"
                  outlined
                  dense
                  rows="3"
                />
              </div>
            </div>
          </section>

          <div class="form-actions">
            <v-btn type="button" outlined @click="$emit('close')">
              {{ $t('clinical360.flowsheets.forms.pain.cancel') }}
            </v-btn>
            <v-btn type="submit" color="primary" dark>
              {{ $t('clinical360.flowsheets.forms.pain.save') }}
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
  name: 'PainAssessmentForm',
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true }
  },
  data() {
    return {
      form: {
        painScore: 0,
        painLocation: '',
        painType: '',
        painOnset: '',
        painDuration: '',
        currentMedication: '',
        nonPharmInterventions: [],
        interventionEffectiveness: '',
        behaviors: {
          facial_grimace: false,
          guarding: false,
          restlessness: false,
          crying: false,
          withdrawal: false,
          reduced_interaction: false
        },
        functionalImpact: '',
        nursingInterventions: ''
      },
      painLevelKeys: ['no_pain', 'minimal', 'very_mild', 'mild', 'moderate', 'moderate_severe', 'severe', 'very_severe', 'intense', 'almost_unbearable', 'worst_possible'],
      painBehaviorIds: ['facial_grimace', 'guarding', 'restlessness', 'crying', 'withdrawal', 'reduced_interaction']
    }
  },
  computed: {
    painLevels() {
      return this.painLevelKeys.map((k, score) => ({
        score,
        label: this.$t(`clinical360.flowsheets.forms.pain.options.pain_levels.${k}`)
      }))
    },
    painBehaviors() {
      return this.painBehaviorIds.map(id => ({
        id,
        label: this.$t(`clinical360.flowsheets.forms.pain.options.behaviors.${id}`)
      }))
    },
    painTypeOptions() {
      return [
        ['sharp', 'Sharp'], ['dull', 'Dull'], ['aching', 'Aching'], ['throbbing', 'Throbbing'],
        ['burning', 'Burning'], ['shooting', 'Shooting'], ['cramping', 'Cramping'], ['other', 'Other']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.flowsheets.forms.pain.options.pain_type.${k}`) }))
    },
    painOnsetOptions() {
      return [
        ['sudden', 'Sudden'], ['gradual', 'Gradual'], ['constant', 'Constant'], ['intermittent', 'Intermittent'], ['episodic', 'Episodic']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.flowsheets.forms.pain.options.pain_onset.${k}`) }))
    },
    painDurationOptions() {
      return [
        ['minutes', 'Minutes'], ['hours', 'Hours'], ['days', 'Days'], ['weeks', 'Weeks'], ['chronic', 'Chronic']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.flowsheets.forms.pain.options.pain_duration.${k}`) }))
    },
    nonpharmOptions() {
      return [
        ['rest', 'Rest'], ['ice', 'Ice'], ['heat', 'Heat'], ['positioning', 'Positioning'],
        ['massage', 'Massage'], ['distraction', 'Distraction'], ['relaxation', 'Relaxation'], ['music', 'Music']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.flowsheets.forms.pain.options.nonpharm.${k}`) }))
    },
    effectivenessOptions() {
      return [
        ['not_effective', 'Not effective'], ['minimally_effective', 'Minimally effective'],
        ['somewhat_effective', 'Somewhat effective'], ['very_effective', 'Very effective'],
        ['completely_relieved', 'Completely relieved']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.flowsheets.forms.pain.options.effectiveness.${k}`) }))
    }
  },
  methods: {
    ...mapActions('flowsheets', ['createFlowsheetEntry']),
    async submitForm() {
      if (!this.form.painLocation) {
        alert(this.$t('clinical360.flowsheets.forms.pain.location_required_error'))
        return
      }

      try {
        await this.createFlowsheetEntry({
          patientId: this.patientId,
          encounterId: this.encounterId,
          templateId: 'pain',
          sectionId: 'pain-1',
          entries: {
            'pain-score': this.form.painScore,
            'pain-location': this.form.painLocation,
            'pain-type': this.form.painType,
            'pain-onset': this.form.painOnset,
            'pain-duration': this.form.painDuration,
            'current-medication': this.form.currentMedication,
            'nonpharm-interventions': this.form.nonPharmInterventions.join(', '),
            'intervention-effectiveness': this.form.interventionEffectiveness,
            behaviors: JSON.stringify(this.form.behaviors),
            'functional-impact': this.form.functionalImpact,
            'nursing-interventions': this.form.nursingInterventions
          },
          recordedAt: new Date().toISOString()
        })
        this.$emit('save', this.form)
      } catch (error) {
        console.error('Error saving pain assessment:', error)
        alert(this.$t('clinical360.flowsheets.forms.pain.save_error'))
      }
    }
  }
}
</script>

<style scoped>
.pain-assessment-form {
  width: 100%;
}

.form-header {
  background: linear-gradient(90deg, #be123c 0%, #e11d48 100%);
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

.pain-scale {
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 20px;
  border-radius: 8px;
}

.scale-visual {
  margin-bottom: 20px;
}

.scale-slider {
  margin: 16px 0;
}

.scale-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #64748b;
  font-weight: 700;
}

.pain-descriptors {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
  margin-top: 16px;
}

.descriptor-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: white;
  border: 1px solid #fecaca;
  border-radius: 4px;
  font-size: 11px;
}

.descriptor-chip .score {
  font-weight: 900;
  color: #be123c;
  min-width: 20px;
}

.descriptor-chip .label {
  color: #64748b;
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

.checklist {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.checklist-item:hover {
  background: #f1f5f9;
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
