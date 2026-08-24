<template>
  <div class="mobility-assessment-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-walk</v-icon>
        <span>Mobility & Functional Assessment</span>
        <v-spacer />
        <button type="button" class="close-btn" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </button>
      </v-card-title>

      <v-divider />

      <v-card-text class="form-body">
        <form @submit.prevent="submitForm">
          <section class="form-section">
            <h3 class="section-title">Mobility Status</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Mobility Level *</label>
                <v-select
                  v-model="form.mobilityLevel"
                  :items="mobilityLevels"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>Assistance Required</label>
                <v-select
                  v-model="form.assistanceRequired"
                  :items="['None', 'Supervision', 'Contact Guard', 'Minimal Assist', 'Moderate Assist', 'Maximal Assist', 'Dependent']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Assistive Devices Used</label>
                <v-combobox
                  v-model="form.assistiveDevices"
                  :items="['Cane', 'Walker', 'Crutches', 'Wheelchair', 'Bed', 'Other']"
                  multiple
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Ambulation Distance</label>
                <v-select
                  v-model="form.ambulationDistance"
                  :items="['Bedbound', 'Chairbound', 'Room', '10-50 ft', '50-150 ft', '>150 ft', 'Unlimited']"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">Functional Abilities</h3>
            <div class="function-grid">
              <div v-for="activity in functionalActivities" :key="activity.id" class="function-item">
                <label>{{ activity.label }}</label>
                <v-select
                  :value="form.functionStatus[activity.id]"
                  :items="['Independent', 'Supervision', 'Assistance', 'Dependent', 'N/A']"
                  outlined
                  dense
                  @change="form.functionStatus[activity.id] = $event"
                />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">Barriers to Mobility</h3>
            <div class="checklist">
              <label v-for="barrier in mobilityBarriers" :key="barrier.id" class="checklist-item">
                <v-checkbox v-model="form.barriers[barrier.id]" />
                <span>{{ barrier.label }}</span>
              </label>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">Fall Risk Assessment</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Fall Risk Level</label>
                <v-select
                  v-model="form.fallRiskLevel"
                  :items="['Low', 'Medium', 'High', 'Very High']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Fall Prevention Measures Implemented</label>
                <v-combobox
                  v-model="form.fallPrevention"
                  :items="['Bed alarm', 'Fall mat', 'Frequent checks', 'Bed rail', 'Assist with ambulation', 'Adequate lighting', 'Clear pathways', 'Call bell accessible']"
                  multiple
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">Exercise & Therapy</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Physical Therapy Ordered</label>
                <v-checkbox v-model="form.ptOrdered" />
              </div>

              <div class="form-group">
                <label>Occupational Therapy Ordered</label>
                <v-checkbox v-model="form.otOrdered" />
              </div>

              <div class="form-group">
                <label>Exercise Performed Today</label>
                <v-textarea
                  v-model="form.exercisePerformed"
                  placeholder="e.g., ROM exercises, walking, therapy session..."
                  outlined
                  dense
                  rows="3"
                />
              </div>

              <div class="form-group">
                <label>Patient Response to Activity</label>
                <v-textarea
                  v-model="form.activityResponse"
                  placeholder="How did patient tolerate activity? Any symptoms?"
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
              Save Mobility Assessment
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
  name: 'MobilityAssessmentForm',
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true }
  },
  data() {
    return {
      form: {
        mobilityLevel: '',
        assistanceRequired: 'None',
        assistiveDevices: [],
        ambulationDistance: '',
        functionStatus: {
          bed_transfer: 'Independent',
          wheelchair_transfer: 'Independent',
          toileting: 'Independent',
          dressing: 'Independent',
          grooming: 'Independent',
          feeding: 'Independent',
          bathing: 'Independent'
        },
        barriers: {
          pain: false,
          weakness: false,
          contractures: false,
          casts_splints: false,
          obesity: false,
          cognitive: false,
          depression: false,
          medication: false
        },
        fallRiskLevel: 'Low',
        fallPrevention: [],
        ptOrdered: false,
        otOrdered: false,
        exercisePerformed: '',
        activityResponse: ''
      },
      mobilityLevels: [
        'Independent',
        'Walks with assistance',
        'Wheelchair dependent',
        'Bedbound',
        'Chairbound'
      ],
      functionalActivities: [
        { id: 'bed_transfer', label: 'Bed Transfer' },
        { id: 'wheelchair_transfer', label: 'Wheelchair Transfer' },
        { id: 'toileting', label: 'Toileting' },
        { id: 'dressing', label: 'Dressing' },
        { id: 'grooming', label: 'Grooming' },
        { id: 'feeding', label: 'Feeding' },
        { id: 'bathing', label: 'Bathing' }
      ],
      mobilityBarriers: [
        { id: 'pain', label: 'Pain' },
        { id: 'weakness', label: 'Weakness/Fatigue' },
        { id: 'contractures', label: 'Contractures' },
        { id: 'casts_splints', label: 'Casts/Splints' },
        { id: 'obesity', label: 'Obesity' },
        { id: 'cognitive', label: 'Cognitive Impairment' },
        { id: 'depression', label: 'Depression' },
        { id: 'medication', label: 'Medication Side Effects' }
      ]
    }
  },
  methods: {
    ...mapActions('flowsheets', ['createFlowsheetEntry']),
    async submitForm() {
      try {
        await this.createFlowsheetEntry({
          patientId: this.patientId,
          encounterId: this.encounterId,
          templateId: 'mobility',
          sectionId: 'mobility-1',
          entries: {
            'mobility-level': this.form.mobilityLevel,
            'assistance-required': this.form.assistanceRequired,
            'assistive-devices': this.form.assistiveDevices.join(', '),
            'ambulation-distance': this.form.ambulationDistance,
            'function-status': JSON.stringify(this.form.functionStatus),
            barriers: JSON.stringify(this.form.barriers),
            'fall-risk': this.form.fallRiskLevel,
            'fall-prevention': this.form.fallPrevention.join(', '),
            'pt-ordered': this.form.ptOrdered,
            'ot-ordered': this.form.otOrdered,
            'exercise-performed': this.form.exercisePerformed,
            'activity-response': this.form.activityResponse
          },
          recordedAt: new Date().toISOString()
        })
        this.$emit('save', this.form)
      } catch (error) {
        console.error('Error saving mobility assessment:', error)
        alert('Error saving mobility assessment')
      }
    }
  }
}
</script>

<style scoped>
.mobility-assessment-form {
  width: 100%;
}

.form-header {
  background: linear-gradient(90deg, #7c3aed 0%, #a855f7 100%);
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

.function-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.function-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.function-item label {
  color: #334155;
  font-size: 12px;
  font-weight: 700;
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
