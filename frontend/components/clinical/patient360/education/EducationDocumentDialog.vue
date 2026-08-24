<template>
  <v-dialog :value="show" max-width="600" persistent @input="$emit('update:show', $event)">
    <v-card>
      <v-card-title>Document Education: {{ point?.label }}</v-card-title>
      <v-card-text>
        <div class="form-section">
          <label class="label">Learners</label>
          <div class="learners-grid">
            <v-checkbox v-for="l in learnerOptions" :key="l" v-model="form.learners" :value="l" :label="l" dense />
          </div>
        </div>

        <div class="form-section">
          <v-select v-model="form.readiness" label="Readiness" :items="readinessOptions" dense outlined />
        </div>

        <div class="form-section">
          <label class="label">Method</label>
          <div class="methods-grid">
            <v-checkbox v-for="m in methodOptions" :key="m" v-model="form.methods" :value="m" :label="m" dense />
          </div>
        </div>

        <div class="form-section">
          <label class="label">Response</label>
          <div class="responses-grid">
            <v-checkbox v-for="r in responseOptions" :key="r" v-model="form.responses" :value="r" :label="r" dense />
          </div>
        </div>

        <div class="form-section">
          <v-switch v-model="form.teachingCompleted" inset dense color="#0f766e" label="Teaching completed" />
          <v-switch v-model="form.familyEducation" inset dense color="#0f766e" label="Family education provided" />
        </div>

        <div class="form-section">
          <v-text-field v-model="form.nextReviewAt" label="Next review date/time" type="datetime-local" dense outlined />
        </div>

        <v-textarea v-model="form.comment" label="Comments" rows="3" dense outlined />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text small @click="$emit('update:show', false)">Cancel</v-btn>
        <v-btn depressed color="#0f766e" dark small @click="file">File</v-btn>
        <v-btn depressed color="#16a34a" dark small @click="fileAndResolve">
          <v-icon x-small left>mdi-check</v-icon>File & Resolve
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
      learnerOptions: ['Patient', 'Family', 'Significant Other', 'Caregiver', 'Other'],
      readinessOptions: ['Eager', 'Acceptance', 'Nonacceptance', 'Refuses'],
      methodOptions: ['Explanation', 'Demonstration', 'Handout', 'Interpreter', 'Video', 'Class/Group'],
      responseOptions: ['Verbalizes Understanding', 'Demonstrated Understanding', 'Needs Reinforcement', 'No Evidence of Learning', 'Refused Teaching']
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
