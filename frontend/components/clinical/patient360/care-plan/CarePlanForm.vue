<template>
  <div class="care-plan-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-file-document</v-icon>
        <span>{{ $t('clinical360.care_plan.form.title') }}<span v-if="template"> {{ $t('clinical360.care_plan.form.from_template', { name: template.title }) }}</span></span>
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
            <h3 class="section-title">{{ $t('clinical360.care_plan.form.care_plan_information') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.care_plan.form.care_plan_title') }} *</label>
                <v-text-field
                  v-model="form.title"
                  :placeholder="$t('clinical360.care_plan.form.care_plan_title_placeholder')"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.care_plan.form.primary_diagnosis') }} *</label>
                <v-text-field
                  v-model="form.diagnosis"
                  :placeholder="$t('clinical360.care_plan.form.primary_diagnosis_placeholder')"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.care_plan.form.start_date') }} *</label>
                <v-text-field
                  v-model="form.startDate"
                  type="date"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.care_plan.form.target_completion_date') }}</label>
                <v-text-field
                  v-model="form.targetDate"
                  type="date"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.care_plan.form.care_plan_status') }}</label>
                <v-select
                  v-model="form.status"
                  :items="statusItems"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.care_plan.form.priority_level') }}</label>
                <v-select
                  v-model="form.priority"
                  :items="priorityItems"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- Clinical Problems -->
          <section class="form-section">
            <div class="section-header">
              <h3 class="section-title">{{ $t('clinical360.care_plan.form.clinical_problems') }}</h3>
              <v-btn small text color="primary" @click="addProblem">
                <v-icon small>mdi-plus</v-icon>{{ $t('clinical360.care_plan.form.add_problem') }}
              </v-btn>
            </div>

            <div class="problems-list">
              <div v-for="(problem, idx) in form.problems" :key="idx" class="problem-card">
                <div class="problem-content">
                  <v-text-field
                    v-model="form.problems[idx]"
                    :placeholder="$t('clinical360.care_plan.form.problem_placeholder')"
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
              <h3 class="section-title">{{ $t('clinical360.care_plan.form.goals_expected_outcomes') }}</h3>
              <v-btn small text color="primary" @click="addGoal">
                <v-icon small>mdi-plus</v-icon>{{ $t('clinical360.care_plan.form.add_goal') }}
              </v-btn>
            </div>

            <div class="goals-list">
              <div v-for="(goal, idx) in form.goals" :key="idx" class="goal-card">
                <div class="goal-content">
                  <v-text-field
                    v-model="form.goals[idx].description"
                    :placeholder="$t('clinical360.care_plan.form.goal_description_placeholder')"
                    outlined
                    dense
                  />
                  <v-select
                    v-model="form.goals[idx].timeline"
                    :items="timelineItems"
                    item-value="value"
                    item-text="text"
                    :label="$t('clinical360.care_plan.form.timeline')"
                    outlined
                    dense
                  />
                  <v-checkbox
                    v-model="form.goals[idx].achieved"
                    :label="$t('clinical360.care_plan.form.goal_achieved')"
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
              <h3 class="section-title">{{ $t('clinical360.care_plan.form.nursing_interventions') }}</h3>
              <v-btn small text color="primary" @click="addIntervention">
                <v-icon small>mdi-plus</v-icon>{{ $t('clinical360.care_plan.form.add_intervention') }}
              </v-btn>
            </div>

            <div class="interventions-list">
              <div v-for="(intervention, idx) in form.interventions" :key="idx" class="intervention-card">
                <div class="intervention-content">
                  <v-text-field
                    v-model="form.interventions[idx].action"
                    :placeholder="$t('clinical360.care_plan.form.intervention_placeholder')"
                    outlined
                    dense
                  />
                  <div class="intervention-row">
                    <v-select
                      v-model="form.interventions[idx].frequency"
                      :items="frequencyItems"
                      item-value="value"
                      item-text="text"
                      :label="$t('clinical360.care_plan.form.frequency')"
                      outlined
                      dense
                    />
                    <v-select
                      v-model="form.interventions[idx].status"
                      :items="interventionStatusItems"
                      item-value="value"
                      item-text="text"
                      :label="$t('clinical360.care_plan.form.status')"
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
            <h3 class="section-title">{{ $t('clinical360.care_plan.form.patient_education') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.care_plan.form.education_topics') }}</label>
                <v-combobox
                  v-model="form.educationTopics"
                  :items="educationSuggestions"
                  item-value="value"
                  item-text="text"
                  :return-object="false"
                  multiple
                  outlined
                  dense
                  chips
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.care_plan.form.education_completed') }}</label>
                <v-checkbox v-model="form.educationCompleted" />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.care_plan.form.patient_understanding_level') }}</label>
                <v-select
                  v-model="form.patientUnderstanding"
                  :items="understandingItems"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.care_plan.form.education_notes') }}</label>
                <v-textarea
                  v-model="form.educationNotes"
                  :placeholder="$t('clinical360.care_plan.form.education_notes_placeholder')"
                  outlined
                  dense
                  rows="3"
                />
              </div>
            </div>
          </section>

          <!-- Responsible Parties -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.care_plan.form.responsible_parties') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.care_plan.form.primary_nurse') }}</label>
                <v-text-field
                  v-model="form.primaryNurse"
                  :placeholder="$t('clinical360.care_plan.form.primary_nurse_placeholder')"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.care_plan.form.care_coordinator') }}</label>
                <v-text-field
                  v-model="form.caseManager"
                  :placeholder="$t('clinical360.care_plan.form.care_coordinator_placeholder')"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.care_plan.form.physician_provider') }}</label>
                <v-text-field
                  v-model="form.provider"
                  :placeholder="$t('clinical360.care_plan.form.physician_provider_placeholder')"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.care_plan.form.family_caregiver_involved') }}</label>
                <v-checkbox v-model="form.familyInvolved" />
              </div>
            </div>
          </section>

          <!-- General Notes -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.care_plan.form.general_notes') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.care_plan.form.additional_comments') }}</label>
                <v-textarea
                  v-model="form.notes"
                  :placeholder="$t('clinical360.care_plan.form.additional_comments_placeholder')"
                  outlined
                  dense
                  rows="4"
                />
              </div>
            </div>
          </section>

          <div class="form-actions">
            <v-btn type="button" outlined @click="$emit('close')">
              {{ $t('clinical360.care_plan.form.cancel') }}
            </v-btn>
            <v-btn type="submit" color="primary" dark>
              {{ $t('clinical360.care_plan.form.save_care_plan') }}
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
      }
    }
  },
  computed: {
    statusItems() {
      return [
        ['Draft', 'status_draft'],
        ['Active', 'status_active'],
        ['On Hold', 'status_on_hold'],
        ['Completed', 'status_completed'],
        ['Revised', 'status_revised']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.care_plan.form.${key}`) }))
    },
    priorityItems() {
      return [
        ['Low', 'priority_low'],
        ['Medium', 'priority_medium'],
        ['High', 'priority_high'],
        ['Critical', 'priority_critical']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.care_plan.form.${key}`) }))
    },
    timelineItems() {
      return [
        ['24 hours', 'timeline_24_hours'],
        ['48 hours', 'timeline_48_hours'],
        ['1 week', 'timeline_1_week'],
        ['2 weeks', 'timeline_2_weeks'],
        ['Ongoing', 'timeline_ongoing']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.care_plan.form.${key}`) }))
    },
    frequencyItems() {
      return [
        ['Once', 'frequency_once'],
        ['Every 2H', 'frequency_every_2h'],
        ['Every 4H', 'frequency_every_4h'],
        ['Every 6H', 'frequency_every_6h'],
        ['Every 8H', 'frequency_every_8h'],
        ['Daily', 'frequency_daily'],
        ['As needed', 'frequency_as_needed']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.care_plan.form.${key}`) }))
    },
    interventionStatusItems() {
      return [
        ['Not started', 'intervention_status_not_started'],
        ['In progress', 'intervention_status_in_progress'],
        ['Completed', 'intervention_status_completed']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.care_plan.form.${key}`) }))
    },
    understandingItems() {
      return [
        ['Poor', 'understanding_poor'],
        ['Fair', 'understanding_fair'],
        ['Good', 'understanding_good'],
        ['Excellent', 'understanding_excellent']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.care_plan.form.${key}`) }))
    },
    educationSuggestions() {
      return [
        ['Disease process', 'education_disease_process'],
        ['Medication management', 'education_medication_management'],
        ['Diet and nutrition', 'education_diet_nutrition'],
        ['Exercise and activity', 'education_exercise_activity'],
        ['Stress management', 'education_stress_management'],
        ['Warning signs/symptoms', 'education_warning_signs'],
        ['When to seek help', 'education_when_to_seek_help'],
        ['Lifestyle modifications', 'education_lifestyle_modifications'],
        ['Follow-up appointments', 'education_follow_up_appointments'],
        ['Support resources', 'education_support_resources']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.care_plan.form.${key}`) }))
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
        this.$emit('error', this.$t('clinical360.care_plan.form.title_diagnosis_required'))
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
          ? this.$t('clinical360.care_plan.form.discharged_read_only')
          : this.$t('clinical360.care_plan.form.create_failed'))
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
