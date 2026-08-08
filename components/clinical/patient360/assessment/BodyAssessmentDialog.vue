<template>
  <v-dialog v-model="isOpen" max-width="960px" persistent scrollable>
    <v-card class="body-assessment-dialog">
      <v-card-title class="body-assessment-title">
        <div>
          <span>Nurse Command Center</span>
          <strong>Body Assessment</strong>
        </div>
        <v-spacer></v-spacer>
        <v-btn icon small @click="closeDialog">
          <v-icon small>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <div class="body-assessment-layout">
          <BodyAssessmentAvatar :gender="gender" @area-selected="handleAreaSelected" />
          <aside class="body-assessment-form">
            <label>
              Severity
              <select v-model="severity">
                <option>Routine</option>
                <option>Watch</option>
                <option>Urgent</option>
                <option>Critical</option>
              </select>
            </label>
            <label>
              Nursing observation
              <textarea v-model="notes" rows="5" placeholder="Skin, pain, wound, IV site, mobility, neuro or respiratory finding"></textarea>
            </label>
            <label>
              Next action
              <textarea v-model="nextAction" rows="3" placeholder="Reposition, wound photo, notify provider, medication review, reassess"></textarea>
            </label>
            <div class="selected-summary">
              <strong>{{ selectedAreas.length || 'No' }} area(s) selected</strong>
              <span>{{ selectedAreas.join(', ') || 'Select body areas on the avatar.' }}</span>
            </div>
          </aside>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="closeDialog">Cancel</v-btn>
        <v-btn color="#0f766e" dark depressed :disabled="!selectedAreas.length" @click="saveAssessment">
          Save Assessment
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import BodyAssessmentAvatar from './BodyAssessmentAvatar.vue'

export default {
  name: 'BodyAssessmentDialog',
  components: {
    BodyAssessmentAvatar
  },
  props: {
    value: {
      type: Boolean,
      default: false
    },
    gender: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      selectedAreas: [],
      notes: '',
      severity: 'Routine',
      nextAction: ''
    }
  },
  computed: {
    isOpen: {
      get() {
        return this.value
      },
      set(val) {
        this.$emit('input', val)
      }
    }
  },
  methods: {
    handleAreaSelected(areas) {
      this.selectedAreas = areas
    },
    closeDialog() {
      this.isOpen = false
    },
    saveAssessment() {
      this.$emit('save', {
        selectedAreas: this.selectedAreas,
        severity: this.severity,
        notes: this.notes,
        nextAction: this.nextAction,
        timestamp: new Date().toISOString()
      })
      this.selectedAreas = []
      this.notes = ''
      this.severity = 'Routine'
      this.nextAction = ''
      this.closeDialog()
    }
  }
}
</script>

<style scoped>
.body-assessment-dialog {
  background: #fff;
}
.body-assessment-title {
  background: #e7f4e2;
  border-bottom: 1px solid #b7c9c6;
}
.body-assessment-title div {
  display: grid;
  gap: 2px;
}
.body-assessment-title span {
  color: #0f766e;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}
.body-assessment-title strong {
  color: #173b39;
  font-size: 16px;
  font-weight: 900;
}
.body-assessment-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
  gap: 12px;
}
.body-assessment-form {
  display: grid;
  align-content: start;
  gap: 12px;
  background: #f8fafc;
  border: 1px solid #dbe6e3;
  padding: 12px;
}
.body-assessment-form label {
  display: grid;
  gap: 5px;
  color: #334155;
  font-size: 12px;
  font-weight: 900;
}
.body-assessment-form select,
.body-assessment-form textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #0f172a;
  padding: 8px;
  font-size: 13px;
}
.selected-summary {
  display: grid;
  gap: 4px;
  background: #ecfdf5;
  border: 1px solid #bbf7d0;
  padding: 10px;
}
.selected-summary strong {
  color: #166534;
}
.selected-summary span {
  color: #334155;
  line-height: 1.35;
}
@media (max-width: 860px) {
  .body-assessment-layout {
    grid-template-columns: 1fr;
  }
}
</style>
