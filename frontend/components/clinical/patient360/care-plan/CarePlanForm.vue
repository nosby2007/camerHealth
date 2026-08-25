<template>
  <div class="care-plan-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-file-document</v-icon>
        <span>Create Care Plan<span v-if="template"> from {{ template.title }}</span></span>
        <v-spacer />
        <button type="button" class="close-btn" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </button>
      </v-card-title>

      <v-divider />

      <v-card-text class="form-body">
        <form @submit.prevent="submitForm">
          <!-- Care Plan Header -->
          <section class="form-section">
            <h3 class="section-title">Care Plan Information</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Care Plan Title *</label>
                <v-text-field
                  v-model="form.title"
                  placeholder="e.g., Hypertension Management Plan"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>Primary Diagnosis *</label>
                <v-text-field
                  v-model="form.diagnosis"
                  placeholder="e.g., Essential Hypertension"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>Start Date *</label>
                <v-text-field
                  v-model="form.startDate"
                  type="date"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>Target Completion Date</label>
                <v-text-field
                  v-model="form.targetDate"
                  type="date"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Care Plan Status</label>
                <v-select
                  v-model="form.status"
                  :items="['Draft', 'Active', 'On Hold', 'Completed', 'Revised']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Priority Level</label>
                <v-select
                  v-model="form.priority"
                  :items="['Low', 'Medium', 'High', 'Critical']"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- Clinical Problems -->
          <section class="form-section">
            <div class="section-header">
              <h3 class="section-title">Clinical Problems/Diagnoses</h3>
              <v-btn small text color="primary" @click="addProblem">
                <v-icon small>mdi-plus</v-icon>Add Problem
              </v-btn>
            </div>

            <div class="problems-list">
              <div v-for="(problem, idx) in form.problems" :key="idx" class="problem-card">
                <div class="problem-content">
                  <v-text-field
                    v-model="form.problems[idx]"
                    placeholder="e.g., Elevated blood pressure, Risk of stroke"
                    outlined
                    dense
                  />
                </div>
                <v-btn small icon @click="removeProblem(idx)">
                  <v-icon small>mdi-close</v-icon>
                </v-btn>
              </div>
            </div>
          </section>

          <!-- Goals -->
          <section class="form-section">
            <div class="section-header">
              <h3 class="section-title">Goals/Expected Outcomes</h3>
              <v-btn small text color="primary" @click="addGoal">
                <v-icon small>mdi-plus</v-icon>Add Goal
              </v-btn>
            </div>

            <div class="goals-list">
              <div v-for="(goal, idx) in form.goals" :key="idx" class="goal-card">
                <div class="goal-content">
                  <v-text-field
                    v-model="form.goals[idx].description"
                    placeholder="Goal description"
                    outlined
                    dense
                  />
                  <v-select
                    v-model="form.goals[idx].timeline"
                    :items="['24 hours', '48 hours', '1 week', '2 weeks', 'Ongoing']"
                    label="Timeline"
                    outlined
                    dense
                  />
                  <v-checkbox
                    v-model="form.goals[idx].achieved"
                    label="Goal Achieved"
                  />
                </div>
                <v-btn small icon @click="removeGoal(idx)">
                  <v-icon small>mdi-close</v-icon>
                </v-btn>
              </div>
            </div>
          </section>

          <!-- Interventions -->
          <section class="form-section">
            <div class="section-header">
              <h3 class="section-title">Nursing Interventions</h3>
              <v-btn small text color="primary" @click="addIntervention">
                <v-icon small>mdi-plus</v-icon>Add Intervention
              </v-btn>
            </div>

            <div class="interventions-list">
              <div v-for="(intervention, idx) in form.interventions" :key="idx" class="intervention-card">
                <div class="intervention-content">
                  <v-text-field
                    v-model="form.interventions[idx].action"
                    placeholder="e.g., Monitor blood pressure every 4 hours"
                    outlined
                    dense
                  />
                  <div class="intervention-row">
                    <v-select
                      v-model="form.interventions[idx].frequency"
                      :items="['Once', 'Every 2H', 'Every 4H', 'Every 6H', 'Every 8H', 'Daily', 'As needed']"
                      label="Frequency"
                      outlined
                      dense
                    />
                    <v-select
                      v-model="form.interventions[idx].status"
                      :items="['Not started', 'In progress', 'Completed']"
                      label="Status"
                      outlined
                      dense
                    />
                  </div>
                </div>
                <v-btn small icon @click="removeIntervention(idx)">
                  <v-icon small>mdi-close</v-icon>
                </v-btn>
              </div>
            </div>
          </section>

          <!-- Education -->
          <section class="form-section">
            <h3 class="section-title">Patient Education</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Education Topics</label>
                <v-combobox
                  v-model="form.educationTopics"
                  :items="educationSuggestions"
                  multiple
                  outlined
                  dense
                  chips
                />
              </div>

              <div class="form-group">
                <label>Education Completed</label>
                <v-checkbox v-model="form.educationCompleted" />
              </div>

              <div class="form-group">
                <label>Patient Understanding Level</label>
                <v-select
                  v-model="form.patientUnderstanding"
                  :items="['Poor', 'Fair', 'Good', 'Excellent']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Education Notes</label>
                <v-textarea
                  v-model="form.educationNotes"
                  placeholder="Notes on patient education..."
                  outlined
                  dense
                  rows="3"
                />
              </div>
            </div>
          </section>

          <!-- Responsible Parties -->
          <section class="form-section">
            <h3 class="section-title">Responsible Parties</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Primary Nurse</label>
                <v-text-field
                  v-model="form.primaryNurse"
                  placeholder="Nurse name/ID"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Care Coordinator</label>
                <v-text-field
                  v-model="form.caseManager"
                  placeholder="Coordinator name"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Physician/Provider</label>
                <v-text-field
                  v-model="form.provider"
                  placeholder="Provider name"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Family/Caregiver Involved</label>
                <v-checkbox v-model="form.familyInvolved" />
              </div>
            </div>
          </section>

          <!-- General Notes -->
          <section class="form-section">
            <h3 class="section-title">General Notes</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Additional Comments</label>
                <v-textarea
                  v-model="form.notes"
                  placeholder="Any additional notes or observations..."
                  outlined
                  dense
                  rows="4"
                />
              </div>
            </div>
          </section>

          <div class="form-actions">
            <v-btn type="button" outlined @click="$emit('close')">
              Cancel
            </v-btn>
            <v-btn type="submit" color="primary" dark>
              Save Care Plan
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
  name: 'CarePlanForm',
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true },
    admissionId: { type: String, default: '' },
    template: { type: Object, default: null }
  },
  data() {
    return {
      form: {
        title: this.template?.title || '',
        diagnosis: this.template?.problems?.[0] || '',
        startDate: new Date().toISOString().split('T')[0],
        targetDate: '',
        status: 'Draft',
        priority: 'Medium',
        problems: this.template?.problems ? [...this.template.problems] : [],
        goals: this.template?.sampleGoals?.map(g => ({
          description: g,
          timeline: '1 week',
          achieved: false
        })) || [],
        interventions: this.template?.sampleInterventions?.map(i => ({
          action: i,
          frequency: 'Daily',
          status: 'Not started'
        })) || [],
        educationTopics: [],
        educationCompleted: false,
        patientUnderstanding: 'Good',
        educationNotes: '',
        primaryNurse: '',
        caseManager: '',
        provider: '',
        familyInvolved: false,
        notes: ''
      },
      educationSuggestions: [
        'Disease process',
        'Medication management',
        'Diet and nutrition',
        'Exercise and activity',
        'Stress management',
        'Warning signs/symptoms',
        'When to seek help',
        'Lifestyle modifications',
        'Follow-up appointments',
        'Support resources'
      ]
    }
  },
  methods: {
    ...mapActions('carePlan', ['createCarePlan']),
    addProblem() {
      this.form.problems.push('')
    },
    removeProblem(idx) {
      this.form.problems.splice(idx, 1)
    },
    addGoal() {
      this.form.goals.push({
        description: '',
        timeline: '1 week',
        achieved: false
      })
    },
    removeGoal(idx) {
      this.form.goals.splice(idx, 1)
    },
    addIntervention() {
      this.form.interventions.push({
        action: '',
        frequency: 'Daily',
        status: 'Not started'
      })
    },
    removeIntervention(idx) {
      this.form.interventions.splice(idx, 1)
    },
    async submitForm() {
      if (!this.form.title || !this.form.diagnosis) {
        this.$emit('error', 'Care plan title and primary diagnosis are required.')
        return
      }

      try {
        const record = await this.createCarePlan({
          patientId: this.patientId,
          encounterId: this.encounterId,
          admissionId: this.admissionId,
          templateId: this.template ? this.template.id : null,
          ...this.form,
          createdAt: new Date().toISOString()
        })
        this.$emit('save', record)
      } catch (error) {
        this.$emit('error', error && error.message === 'PATIENT_DISCHARGED_READ_ONLY'
          ? 'Discharged charts are read-only.'
          : 'Unable to create the care plan.')
      }
    }
  }
}
</script>

<style scoped>
.care-plan-form {
  width: 100%;
}

.form-header {
  background: #0f766e;
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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  color: #0f172a;
  font-size: 13px;
  font-weight: 900;
  margin: 0;
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

.problems-list,
.goals-list,
.interventions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.problem-card,
.goal-card,
.intervention-card {
  display: flex;
  gap: 8px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 4px;
}

.problem-content,
.goal-card {
  flex: 1;
}

.intervention-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.intervention-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
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
