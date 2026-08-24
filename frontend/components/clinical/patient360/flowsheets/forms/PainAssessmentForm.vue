<template>
  <div class="pain-assessment-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-alert-circle</v-icon>
        <span>Pain Assessment</span>
        <v-spacer />
        <button type="button" class="close-btn" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </button>
      </v-card-title>

      <v-divider />

      <v-card-text class="form-body">
        <form @submit.prevent="submitForm">
          <section class="form-section">
            <h3 class="section-title">Pain Score</h3>
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
                  <span class="no-pain">No pain (0)</span>
                  <span class="worst-pain">Worst pain (10)</span>
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
            <h3 class="section-title">Pain Characteristics</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Pain Location *</label>
                <v-text-field
                  v-model="form.painLocation"
                  placeholder="e.g., Left shoulder, Abdomen"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>Pain Type</label>
                <v-select
                  v-model="form.painType"
                  :items="['Sharp', 'Dull', 'Aching', 'Throbbing', 'Burning', 'Shooting', 'Cramping', 'Other']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Pain Onset</label>
                <v-select
                  v-model="form.painOnset"
                  :items="['Sudden', 'Gradual', 'Constant', 'Intermittent', 'Episodic']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Pain Duration</label>
                <v-select
                  v-model="form.painDuration"
                  :items="['Minutes', 'Hours', 'Days', 'Weeks', 'Chronic']"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">Pain Management</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Current Medication</label>
                <v-text-field
                  v-model="form.currentMedication"
                  placeholder="e.g., Morphine 10mg IV"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Non-pharmacological Interventions</label>
                <v-combobox
                  v-model="form.nonPharmInterventions"
                  :items="['Rest', 'Ice', 'Heat', 'Positioning', 'Massage', 'Distraction', 'Relaxation', 'Music']"
                  multiple
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Intervention Effectiveness</label>
                <v-select
                  v-model="form.interventionEffectiveness"
                  :items="['Not effective', 'Minimally effective', 'Somewhat effective', 'Very effective', 'Completely relieved']"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">Behavioral Observations</h3>
            <div class="checklist">
              <label v-for="behavior in painBehaviors" :key="behavior.id" class="checklist-item">
                <v-checkbox v-model="form.behaviors[behavior.id]" />
                <span>{{ behavior.label }}</span>
              </label>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">Assessment Notes</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Pain Impact on Function</label>
                <v-textarea
                  v-model="form.functionalImpact"
                  placeholder="How does pain affect patient's activities?"
                  outlined
                  dense
                  rows="3"
                />
              </div>
              <div class="form-group">
                <label>Nursing Interventions</label>
                <v-textarea
                  v-model="form.nursingInterventions"
                  placeholder="Actions taken to manage pain..."
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
              Save Pain Assessment
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
      painLevels: [
        { score: 0, label: 'No pain' },
        { score: 1, label: 'Minimal' },
        { score: 2, label: 'Very mild' },
        { score: 3, label: 'Mild' },
        { score: 4, label: 'Moderate' },
        { score: 5, label: 'Moderate-severe' },
        { score: 6, label: 'Severe' },
        { score: 7, label: 'Very severe' },
        { score: 8, label: 'Intense' },
        { score: 9, label: 'Almost unbearable' },
        { score: 10, label: 'Worst possible pain' }
      ],
      painBehaviors: [
        { id: 'facial_grimace', label: 'Facial grimace/grimacing' },
        { id: 'guarding', label: 'Guarding/protective behavior' },
        { id: 'restlessness', label: 'Restlessness' },
        { id: 'crying', label: 'Crying or moaning' },
        { id: 'withdrawal', label: 'Withdrawal' },
        { id: 'reduced_interaction', label: 'Reduced interaction' }
      ]
    }
  },
  methods: {
    ...mapActions('flowsheets', ['createFlowsheetEntry']),
    async submitForm() {
      if (!this.form.painLocation) {
        alert('Please specify pain location')
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
        alert('Error saving pain assessment')
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
