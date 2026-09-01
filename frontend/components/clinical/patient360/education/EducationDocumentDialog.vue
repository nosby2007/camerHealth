<template>
  <v-dialog :value="show" max-width="600" persistent @input="$emit('update:show', $event)">
    <v-card>
      <v-card-title>{{ $t('clinical360.education.document_dialog.title', { label: point && point.label }) }}</v-card-title>
      <v-card-text>
        <div class="form-section">
          <label class="label">{{ $t('clinical360.education.document_dialog.learners') }}</label>
          <div class="learners-grid">
            <v-checkbox v-for="l in learnerOptions" :key="l.value" v-model="form.learners" :value="l.value" :label="l.text" dense />
          </div>
        </div>

        <div class="form-section">
          <v-select v-model="form.readiness" :label="$t('clinical360.education.document_dialog.readiness')" :items="readinessOptions" item-value="value" item-text="text" dense outlined />
        </div>

        <div class="form-section">
          <label class="label">{{ $t('clinical360.education.document_dialog.method') }}</label>
          <div class="methods-grid">
            <v-checkbox v-for="m in methodOptions" :key="m.value" v-model="form.methods" :value="m.value" :label="m.text" dense />
          </div>
        </div>

        <div class="form-section">
          <label class="label">{{ $t('clinical360.education.document_dialog.response') }}</label>
          <div class="responses-grid">
            <v-checkbox v-for="r in responseOptions" :key="r.value" v-model="form.responses" :value="r.value" :label="r.text" dense />
          </div>
        </div>

        <div class="form-section">
          <v-switch v-model="form.teachingCompleted" inset dense color="#0f766e" :label="$t('clinical360.education.document_dialog.teaching_completed')" />
          <v-switch v-model="form.familyEducation" inset dense color="#0f766e" :label="$t('clinical360.education.document_dialog.family_education_provided')" />
        </div>

        <div class="form-section">
          <v-text-field v-model="form.nextReviewAt" :label="$t('clinical360.education.document_dialog.next_review_at')" type="datetime-local" dense outlined />
        </div>

        <v-textarea v-model="form.comment" :label="$t('clinical360.education.document_dialog.comments')" rows="3" dense outlined />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text small @click="$emit('update:show', false)">{{ $t('clinical360.education.document_dialog.cancel') }}</v-btn>
        <v-btn depressed color="#0f766e" dark small @click="file">{{ $t('clinical360.education.document_dialog.file') }}</v-btn>
        <v-btn depressed color="#16a34a" dark small @click="fileAndResolve">
          <v-icon x-small left>mdi-check</v-icon>{{ $t('clinical360.education.document_dialog.file_and_resolve') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'EducationDocumentDialog',
  props: {
    show: { type: Boolean, default: false },
    point: { type: Object, default: null }
  },
  data() {
    return {
      form: {
        learners: [],
        readiness: '',
        methods: [],
        responses: [],
        comment: '',
        teachingCompleted: true,
        familyEducation: false,
        nextReviewAt: ''
      },
    }
  },
  computed: {
    learnerOptions() {
      return [
        ['patient', 'Patient'],
        ['family', 'Family'],
        ['significant_other', 'Significant Other'],
        ['caregiver', 'Caregiver'],
        ['other', 'Other']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.education.document_dialog.learner_${k}`) }))
    },
    readinessOptions() {
      return [
        ['eager', 'Eager'],
        ['acceptance', 'Acceptance'],
        ['nonacceptance', 'Nonacceptance'],
        ['refuses', 'Refuses']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.education.document_dialog.readiness_${k}`) }))
    },
    methodOptions() {
      return [
        ['explanation', 'Explanation'],
        ['demonstration', 'Demonstration'],
        ['handout', 'Handout'],
        ['interpreter', 'Interpreter'],
        ['video', 'Video'],
        ['class_group', 'Class/Group']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.education.document_dialog.method_${k}`) }))
    },
    responseOptions() {
      return [
        ['verbalizes_understanding', 'Verbalizes Understanding'],
        ['demonstrated_understanding', 'Demonstrated Understanding'],
        ['needs_reinforcement', 'Needs Reinforcement'],
        ['no_evidence_of_learning', 'No Evidence of Learning'],
        ['refused_teaching', 'Refused Teaching']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.education.document_dialog.response_${k}`) }))
    }
  },
  watch: {
    show(val) {
      if (!val) {
        this.form = { learners: [], readiness: '', methods: [], responses: [], comment: '', teachingCompleted: true, familyEducation: false, nextReviewAt: '' }
      }
    }
  },
  methods: {
    file() {
      this.$emit('save', this.form)
      this.$emit('update:show', false)
    },
    fileAndResolve() {
      this.$emit('save', { ...this.form, resolveAfterFile: true })
      this.$emit('update:show', false)
    }
  }
}
</script>

<style scoped>
.form-section {
  margin-bottom: 12px;
}

.label {
  display: block;
  font-size: 11px;
  font-weight: 800;
  color: #134e4a;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.learners-grid,
.methods-grid,
.responses-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.learners-grid {
  grid-template-columns: 1fr 1fr;
}
</style>
