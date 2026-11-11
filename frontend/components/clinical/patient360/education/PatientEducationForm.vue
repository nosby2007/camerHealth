<template>
  <div class="patient-education-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-book-open</v-icon>
        <span>{{ $t('clinical360.education.patient_form.record_title') }}</span>
        <v-spacer />
        <button type="button" class="close-btn" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </button>
      </v-card-title>

      <v-divider />

      <v-card-text class="form-body">
        <form @submit.prevent="submitForm">
          <!-- Education Session Info -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.education.patient_form.session_information') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.education.patient_form.education_topic') }}</label>
                <v-combobox
                  v-model="form.topic"
                  :items="educationTopics"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.education.patient_form.session_datetime') }}</label>
                <v-text-field
                  v-model="form.sessionDateTime"
                  type="datetime-local"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.education.patient_form.duration_minutes') }}</label>
                <v-text-field
                  v-model="form.duration"
                  type="number"
                  min="5"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.education.patient_form.educator_name') }}</label>
                <v-text-field
                  v-model="form.educatorName"
                  :placeholder="$t('clinical360.education.patient_form.educator_name_placeholder')"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- Learning Objectives -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.education.patient_form.learning_objectives') }}</h3>
            <div class="objectives-checklist">
              <div v-for="(objective, idx) in form.objectives" :key="idx" class="objective-item">
                <v-checkbox
                  v-model="form.objectives[idx].covered"
                  :label="objectiveLabels[idx]"
                />
              </div>
            </div>
          </section>

          <!-- Education Materials Provided -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.education.patient_form.materials_provided') }}</h3>
            <div class="materials-checklist">
              <label v-for="material in educationMaterials" :key="material.id" class="material-item">
                <v-checkbox v-model="form.materials[material.id]" />
                <span>{{ material.label }}</span>
              </label>
            </div>

            <div class="form-grid" style="margin-top: 16px">
              <div class="form-group">
                <label>{{ $t('clinical360.education.patient_form.other_materials') }}</label>
                <v-text-field
                  v-model="form.otherMaterials"
                  :placeholder="$t('clinical360.education.patient_form.other_materials_placeholder')"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- Content Covered -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.education.patient_form.content_summary') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.education.patient_form.key_topics_discussed') }}</label>
                <v-textarea
                  v-model="form.topicsCovered"
                  :placeholder="$t('clinical360.education.patient_form.topics_covered_placeholder')"
                  outlined
                  dense
                  rows="3"
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.education.patient_form.special_emphasis') }}</label>
                <v-textarea
                  v-model="form.specialEmphasis"
                  :placeholder="$t('clinical360.education.patient_form.special_emphasis_placeholder')"
                  outlined
                  dense
                  rows="3"
                />
              </div>
            </div>
          </section>

          <!-- Patient Response & Understanding -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.education.patient_form.response_comprehension') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.education.patient_form.engagement_level') }}</label>
                <v-select
                  v-model="form.engagementLevel"
                  :items="engagementLevelOptions"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.education.patient_form.comprehension_level') }}</label>
                <v-select
                  v-model="form.comprehensionLevel"
                  :items="comprehensionLevelOptions"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.education.patient_form.learning_barriers') }}</label>
                <v-combobox
                  v-model="form.learningBarriers"
                  :items="learningBarrierOptions"
                  item-value="value"
                  item-text="text"
                  multiple
                  outlined
                  dense
                  chips
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.education.patient_form.barriers_addressed') }}</label>
                <v-textarea
                  v-model="form.barriersAddressed"
                  :placeholder="$t('clinical360.education.patient_form.barriers_addressed_placeholder')"
                  outlined
                  dense
                  rows="2"
                />
              </div>
            </div>
          </section>

          <!-- Patient Knowledge Demonstration -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.education.patient_form.knowledge_demonstration') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.education.patient_form.teach_back_assessment') }}</label>
                <v-select
                  v-model="form.teachBackResult"
                  :items="teachBackResultOptions"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.education.patient_form.patient_explanation') }}</label>
                <v-textarea
                  v-model="form.patientExplanation"
                  :placeholder="$t('clinical360.education.patient_form.patient_explanation_placeholder')"
                  outlined
                  dense
                  rows="3"
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.education.patient_form.corrections_needed') }}</label>
                <v-textarea
                  v-model="form.corrections"
                  :placeholder="$t('clinical360.education.patient_form.corrections_placeholder')"
                  outlined
                  dense
                  rows="3"
                />
              </div>
            </div>
          </section>

          <!-- Family/Caregiver Participation -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.education.patient_form.family_involvement') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.education.patient_form.family_present') }}</label>
                <v-checkbox v-model="form.familyPresent" />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.education.patient_form.family_names') }}</label>
                <v-text-field
                  v-model="form.familyNames"
                  :placeholder="$t('clinical360.education.patient_form.family_names_placeholder')"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.education.patient_form.family_understanding') }}</label>
                <v-select
                  v-model="form.familyUnderstanding"
                  :items="familyUnderstandingOptions"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.education.patient_form.role_in_care') }}</label>
                <v-combobox
                  v-model="form.familyRole"
                  :items="familyRoleOptions"
                  item-value="value"
                  item-text="text"
                  multiple
                  outlined
                  dense
                  chips
                />
              </div>
            </div>
          </section>

          <!-- Follow-up Plan -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.education.patient_form.follow_up_plan') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.education.patient_form.follow_up_needed') }}</label>
                <v-checkbox v-model="form.followUpNeeded" />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.education.patient_form.follow_up_topics') }}</label>
                <v-textarea
                  v-model="form.followUpTopics"
                  :placeholder="$t('clinical360.education.patient_form.follow_up_topics_placeholder')"
                  outlined
                  dense
                  rows="3"
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.education.patient_form.referrals_made') }}</label>
                <v-combobox
                  v-model="form.referrals"
                  :items="referralOptions"
                  item-value="value"
                  item-text="text"
                  multiple
                  outlined
                  dense
                  chips
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.education.patient_form.resources_provided') }}</label>
                <v-text-field
                  v-model="form.resourcesProvided"
                  :placeholder="$t('clinical360.education.patient_form.resources_provided_placeholder')"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <div class="form-actions">
            <v-btn type="button" outlined @click="$emit('close')">
              {{ $t('clinical360.education.patient_form.cancel') }}
            </v-btn>
            <v-btn type="submit" color="primary" dark>
              {{ $t('clinical360.education.patient_form.document_education') }}
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
  name: 'PatientEducationForm',
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true }
  },
  data() {
    return {
      form: {
        topic: '',
        sessionDateTime: new Date().toISOString().slice(0, 16),
        duration: 30,
        educatorName: '',
        objectives: [
          { text: 'Patient will verbalize understanding of disease process', covered: false },
          { text: 'Patient will demonstrate proper medication administration', covered: false },
          { text: 'Patient will identify warning signs requiring medical attention', covered: false },
          { text: 'Patient will state lifestyle modifications', covered: false }
        ],
        materials: {
          pamphlet: false,
          video: false,
          diagram: false,
          handout: false,
          website: false,
          demonstration: false,
          discussion: false
        },
        otherMaterials: '',
        topicsCovered: '',
        specialEmphasis: '',
        engagementLevel: 'Good',
        comprehensionLevel: 'Good',
        learningBarriers: [],
        barriersAddressed: '',
        teachBackResult: 'Accurate understanding',
        patientExplanation: '',
        corrections: '',
        familyPresent: false,
        familyNames: '',
        familyUnderstanding: 'N/A',
        familyRole: [],
        followUpNeeded: false,
        followUpTopics: '',
        referrals: [],
        resourcesProvided: ''
      }
    }
  },
  computed: {
    objectiveLabels() {
      return [
        this.$t('clinical360.education.patient_form.objective_disease_process'),
        this.$t('clinical360.education.patient_form.objective_medication_administration'),
        this.$t('clinical360.education.patient_form.objective_warning_signs'),
        this.$t('clinical360.education.patient_form.objective_lifestyle_modifications')
      ]
    },
    educationTopics() {
      return [
        ['disease_process', 'Disease process'],
        ['medication_management', 'Medication management'],
        ['diet_and_nutrition', 'Diet and nutrition'],
        ['exercise_and_activity', 'Exercise and activity'],
        ['stress_management', 'Stress management'],
        ['warning_signs_symptoms', 'Warning signs/symptoms'],
        ['when_to_seek_help', 'When to seek help'],
        ['lifestyle_modifications', 'Lifestyle modifications'],
        ['follow_up_appointments', 'Follow-up appointments'],
        ['support_resources', 'Support resources'],
        ['wound_care', 'Wound care'],
        ['pain_management', 'Pain management']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.education.patient_form.topic_${k}`) }))
    },
    educationMaterials() {
      return [
        { id: 'pamphlet', label: this.$t('clinical360.education.patient_form.material_pamphlet') },
        { id: 'video', label: this.$t('clinical360.education.patient_form.material_video') },
        { id: 'diagram', label: this.$t('clinical360.education.patient_form.material_diagram') },
        { id: 'handout', label: this.$t('clinical360.education.patient_form.material_handout') },
        { id: 'website', label: this.$t('clinical360.education.patient_form.material_website') },
        { id: 'demonstration', label: this.$t('clinical360.education.patient_form.material_demonstration') },
        { id: 'discussion', label: this.$t('clinical360.education.patient_form.material_discussion') }
      ]
    },
    engagementLevelOptions() {
      return [
        ['poor', 'Poor'], ['fair', 'Fair'], ['good', 'Good'], ['excellent', 'Excellent']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.education.patient_form.level_${k}`) }))
    },
    comprehensionLevelOptions() {
      return [
        ['minimal', 'Minimal'], ['partial', 'Partial'], ['good', 'Good'], ['full', 'Full'], ['unable_to_assess', 'Unable to assess']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.education.patient_form.level_${k}`) }))
    },
    learningBarrierOptions() {
      return [
        ['language', 'Language'], ['vision', 'Vision'], ['hearing', 'Hearing'], ['cognitive', 'Cognitive'],
        ['motivation', 'Motivation'], ['literacy', 'Literacy'], ['pain', 'Pain'], ['other', 'Other']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.education.patient_form.barrier_${k}`) }))
    },
    teachBackResultOptions() {
      return [
        ['accurate_understanding', 'Accurate understanding'],
        ['partial_understanding', 'Partial understanding'],
        ['misunderstandings_present', 'Misunderstandings present'],
        ['unable_to_demonstrate', 'Unable to demonstrate'],
        ['not_attempted', 'Not attempted']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.education.patient_form.teach_back_${k}`) }))
    },
    familyUnderstandingOptions() {
      return [
        ['poor', 'Poor'], ['fair', 'Fair'], ['good', 'Good'], ['excellent', 'Excellent'], ['na', 'N/A']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.education.patient_form.level_${k}`) }))
    },
    familyRoleOptions() {
      return [
        ['medication_reminders', 'Medication reminders'],
        ['diet_monitoring', 'Diet monitoring'],
        ['exercise_support', 'Exercise support'],
        ['appointment_scheduling', 'Appointment scheduling'],
        ['transportation', 'Transportation'],
        ['other', 'Other']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.education.patient_form.family_role_${k}`) }))
    },
    referralOptions() {
      return [
        ['diabetes_educator', 'Diabetes educator'],
        ['nutritionist', 'Nutritionist'],
        ['physical_therapy', 'Physical therapy'],
        ['social_work', 'Social work'],
        ['chaplain', 'Chaplain'],
        ['other', 'Other']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.education.patient_form.referral_${k}`) }))
    }
  },
  methods: {
    ...mapActions('education', ['recordEducation']),
    async submitForm() {
      if (!this.form.topic) {
        alert(this.$t('clinical360.education.patient_form.alert_select_topic'))
        return
      }

      try {
        await this.recordEducation({
          patientId: this.patientId,
          encounterId: this.encounterId,
          ...this.form,
          completedAt: new Date().toISOString()
        })
        this.$emit('save', this.form)
      } catch (error) {
        console.error('Error recording education:', error)
        alert(this.$t('clinical360.education.patient_form.alert_record_error'))
      }
    }
  }
}
</script>

<style scoped>
.patient-education-form {
  width: 100%;
}

.form-header {
  background: linear-gradient(90deg, #2563eb 0%, #1e40af 100%);
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

.objectives-checklist,
.materials-checklist {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

.objective-item,
.material-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.objective-item:hover,
.material-item:hover {
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
