<template>
  <div class="patient-education-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-book-open</v-icon>
        <span>Patient Education Record</span>
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
            <h3 class="section-title">Session Information</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Education Topic *</label>
                <v-combobox
                  v-model="form.topic"
                  :items="educationTopics"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>Date/Time of Session</label>
                <v-text-field
                  v-model="form.sessionDateTime"
                  type="datetime-local"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Duration (minutes)</label>
                <v-text-field
                  v-model="form.duration"
                  type="number"
                  min="5"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Educator Name</label>
                <v-text-field
                  v-model="form.educatorName"
                  placeholder="Nurse/Educator name"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- Learning Objectives -->
          <section class="form-section">
            <h3 class="section-title">Learning Objectives</h3>
            <div class="objectives-checklist">
              <div v-for="(objective, idx) in form.objectives" :key="idx" class="objective-item">
                <v-checkbox
                  v-model="form.objectives[idx].covered"
                  :label="form.objectives[idx].text"
                />
              </div>
            </div>
          </section>

          <!-- Education Materials Provided -->
          <section class="form-section">
            <h3 class="section-title">Education Materials Provided</h3>
            <div class="materials-checklist">
              <label v-for="material in educationMaterials" :key="material.id" class="material-item">
                <v-checkbox v-model="form.materials[material.id]" />
                <span>{{ material.label }}</span>
              </label>
            </div>

            <div class="form-grid" style="margin-top: 16px">
              <div class="form-group">
                <label>Other Materials</label>
                <v-text-field
                  v-model="form.otherMaterials"
                  placeholder="List any other materials provided..."
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- Content Covered -->
          <section class="form-section">
            <h3 class="section-title">Content Summary</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Key Topics Discussed</label>
                <v-textarea
                  v-model="form.topicsCovered"
                  placeholder="Summarize main topics covered in education..."
                  outlined
                  dense
                  rows="3"
                />
              </div>

              <div class="form-group">
                <label>Special Emphasis</label>
                <v-textarea
                  v-model="form.specialEmphasis"
                  placeholder="Any special areas of focus or repeated topics..."
                  outlined
                  dense
                  rows="3"
                />
              </div>
            </div>
          </section>

          <!-- Patient Response & Understanding -->
          <section class="form-section">
            <h3 class="section-title">Patient Response & Comprehension</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Patient Engagement Level</label>
                <v-select
                  v-model="form.engagementLevel"
                  :items="['Poor', 'Fair', 'Good', 'Excellent']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Comprehension Level</label>
                <v-select
                  v-model="form.comprehensionLevel"
                  :items="['Minimal', 'Partial', 'Good', 'Full', 'Unable to assess']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Learning Barriers Identified</label>
                <v-combobox
                  v-model="form.learningBarriers"
                  :items="['Language', 'Vision', 'Hearing', 'Cognitive', 'Motivation', 'Literacy', 'Pain', 'Other']"
                  multiple
                  outlined
                  dense
                  chips
                />
              </div>

              <div class="form-group">
                <label>Barriers Addressed</label>
                <v-textarea
                  v-model="form.barriersAddressed"
                  placeholder="How were learning barriers addressed..."
                  outlined
                  dense
                  rows="2"
                />
              </div>
            </div>
          </section>

          <!-- Patient Knowledge Demonstration -->
          <section class="form-section">
            <h3 class="section-title">Knowledge Demonstration (Teach-Back Method)</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Teach-Back Assessment</label>
                <v-select
                  v-model="form.teachBackResult"
                  :items="['Accurate understanding', 'Partial understanding', 'Misunderstandings present', 'Unable to demonstrate', 'Not attempted']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Patient Explanation</label>
                <v-textarea
                  v-model="form.patientExplanation"
                  placeholder="How patient explained back the content..."
                  outlined
                  dense
                  rows="3"
                />
              </div>

              <div class="form-group">
                <label>Corrections/Clarifications Needed</label>
                <v-textarea
                  v-model="form.corrections"
                  placeholder="Any corrections or clarifications made..."
                  outlined
                  dense
                  rows="3"
                />
              </div>
            </div>
          </section>

          <!-- Family/Caregiver Participation -->
          <section class="form-section">
            <h3 class="section-title">Family/Caregiver Involvement</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Family/Caregiver Present</label>
                <v-checkbox v-model="form.familyPresent" />
              </div>

              <div class="form-group">
                <label>Family/Caregiver Name(s)</label>
                <v-text-field
                  v-model="form.familyNames"
                  placeholder="Names of those present"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Family Understanding</label>
                <v-select
                  v-model="form.familyUnderstanding"
                  :items="['Poor', 'Fair', 'Good', 'Excellent', 'N/A']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Role in Care</label>
                <v-combobox
                  v-model="form.familyRole"
                  :items="['Medication reminders', 'Diet monitoring', 'Exercise support', 'Appointment scheduling', 'Transportation', 'Other']"
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
            <h3 class="section-title">Follow-up Plan</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Follow-up Education Needed</label>
                <v-checkbox v-model="form.followUpNeeded" />
              </div>

              <div class="form-group">
                <label>Recommended Topics for Follow-up</label>
                <v-textarea
                  v-model="form.followUpTopics"
                  placeholder="Topics to reinforce or revisit..."
                  outlined
                  dense
                  rows="3"
                />
              </div>

              <div class="form-group">
                <label>Referrals Made</label>
                <v-combobox
                  v-model="form.referrals"
                  :items="['Diabetes educator', 'Nutritionist', 'Physical therapy', 'Social work', 'Chaplain', 'Other']"
                  multiple
                  outlined
                  dense
                  chips
                />
              </div>

              <div class="form-group">
                <label>Resources Provided</label>
                <v-text-field
                  v-model="form.resourcesProvided"
                  placeholder="Contact info for support organizations, websites, etc."
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <div class="form-actions">
            <v-btn type="button" outlined @click="$emit('close')">
              Cancel
            </v-btn>
            <v-btn type="submit" color="primary" dark>
              Document Education
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
      },
      educationTopics: [
        'Disease process',
        'Medication management',
        'Diet and nutrition',
        'Exercise and activity',
        'Stress management',
        'Warning signs/symptoms',
        'When to seek help',
        'Lifestyle modifications',
        'Follow-up appointments',
        'Support resources',
        'Wound care',
        'Pain management'
      ],
      educationMaterials: [
        { id: 'pamphlet', label: 'Educational pamphlet' },
        { id: 'video', label: 'Educational video' },
        { id: 'diagram', label: 'Diagram/picture' },
        { id: 'handout', label: 'Handout materials' },
        { id: 'website', label: 'Website/online resources' },
        { id: 'demonstration', label: 'Demonstration/practice' },
        { id: 'discussion', label: 'Group discussion' }
      ]
    }
  },
  methods: {
    ...mapActions('education', ['recordEducation']),
    async submitForm() {
      if (!this.form.topic) {
        alert('Please select an education topic')
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
        alert('Error recording education')
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
