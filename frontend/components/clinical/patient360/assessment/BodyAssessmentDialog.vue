<template>
  <v-dialog v-model="isOpen" max-width="960px" persistent scrollable>
    <v-card class="body-assessment-dialog">
      <v-card-title class="body-assessment-title">
        <div>
          <span>{{ $t('clinical360.assessment.body_dialog.eyebrow') }}</span>
          <strong>{{ $t('clinical360.assessment.body_dialog.title') }}</strong>
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
              {{ $t('clinical360.assessment.body_dialog.assessment_focus') }}
              <select v-model="assessmentType">
                <option value="general">{{ $t('clinical360.assessment.body_dialog.focus_general') }}</option>
                <option value="wound">{{ $t('clinical360.assessment.body_dialog.focus_wound') }}</option>
                <option value="iv">{{ $t('clinical360.assessment.body_dialog.focus_iv') }}</option>
                <option value="trach">{{ $t('clinical360.assessment.body_dialog.focus_trach') }}</option>
                <option value="foley">{{ $t('clinical360.assessment.body_dialog.focus_foley') }}</option>
                <option value="drain">{{ $t('clinical360.assessment.body_dialog.focus_drain') }}</option>
                <option value="ostomy">{{ $t('clinical360.assessment.body_dialog.focus_ostomy') }}</option>
                <option value="pain">{{ $t('clinical360.assessment.body_dialog.focus_pain') }}</option>
              </select>
            </label>
            <label>
              {{ $t('clinical360.assessment.body_dialog.priority') }}
              <select v-model="severity">
                <option value="Routine">{{ $t('clinical360.assessment.body_dialog.priority_routine') }}</option>
                <option value="Watch">{{ $t('clinical360.assessment.body_dialog.priority_watch') }}</option>
                <option value="Urgent">{{ $t('clinical360.assessment.body_dialog.priority_urgent') }}</option>
                <option value="Critical">{{ $t('clinical360.assessment.body_dialog.priority_critical') }}</option>
              </select>
            </label>
            <label v-if="assessmentType === 'wound'">
              {{ $t('clinical360.assessment.body_dialog.wound_status') }}
              <select v-model="elementStatus">
                <option value="Open">{{ $t('clinical360.assessment.body_dialog.wound_status_open') }}</option>
                <option value="Improving">{{ $t('clinical360.assessment.body_dialog.wound_status_improving') }}</option>
                <option value="Worsening">{{ $t('clinical360.assessment.body_dialog.wound_status_worsening') }}</option>
                <option value="Resolved">{{ $t('clinical360.assessment.body_dialog.wound_status_resolved') }}</option>
              </select>
            </label>
            <label v-else-if="assessmentType === 'iv'">
              {{ $t('clinical360.assessment.body_dialog.iv_status') }}
              <select v-model="elementStatus">
                <option value="Patent">{{ $t('clinical360.assessment.body_dialog.iv_status_patent') }}</option>
                <option value="Infiltrated">{{ $t('clinical360.assessment.body_dialog.iv_status_infiltrated') }}</option>
                <option value="Phlebitis">{{ $t('clinical360.assessment.body_dialog.iv_status_phlebitis') }}</option>
                <option value="Discontinued">{{ $t('clinical360.assessment.body_dialog.iv_status_discontinued') }}</option>
              </select>
            </label>
            <label v-else-if="assessmentType === 'trach'">
              {{ $t('clinical360.assessment.body_dialog.trach_status') }}
              <select v-model="elementStatus">
                <option value="Secure">{{ $t('clinical360.assessment.body_dialog.trach_status_secure') }}</option>
                <option value="Needs suction">{{ $t('clinical360.assessment.body_dialog.trach_status_needs_suction') }}</option>
                <option value="Redness">{{ $t('clinical360.assessment.body_dialog.trach_status_redness') }}</option>
                <option value="Escalate">{{ $t('clinical360.assessment.body_dialog.trach_status_escalate') }}</option>
              </select>
            </label>
            <label v-else-if="assessmentType === 'foley'">
              {{ $t('clinical360.assessment.body_dialog.foley_status') }}
              <select v-model="elementStatus">
                <option value="Draining">{{ $t('clinical360.assessment.body_dialog.foley_status_draining') }}</option>
                <option value="Low output">{{ $t('clinical360.assessment.body_dialog.foley_status_low_output') }}</option>
                <option value="Obstructed">{{ $t('clinical360.assessment.body_dialog.foley_status_obstructed') }}</option>
                <option value="Removed">{{ $t('clinical360.assessment.body_dialog.foley_status_removed') }}</option>
              </select>
            </label>
            <label v-else-if="assessmentType === 'drain'">
              {{ $t('clinical360.assessment.body_dialog.drain_status') }}
              <select v-model="elementStatus">
                <option value="Active">{{ $t('clinical360.assessment.body_dialog.drain_status_active') }}</option>
                <option value="Low output">{{ $t('clinical360.assessment.body_dialog.drain_status_low_output') }}</option>
                <option value="Clamped">{{ $t('clinical360.assessment.body_dialog.drain_status_clamped') }}</option>
                <option value="Removed">{{ $t('clinical360.assessment.body_dialog.drain_status_removed') }}</option>
              </select>
            </label>
            <label v-else-if="assessmentType === 'ostomy'">
              {{ $t('clinical360.assessment.body_dialog.ostomy_status') }}
              <select v-model="elementStatus">
                <option value="Intact">{{ $t('clinical360.assessment.body_dialog.ostomy_status_intact') }}</option>
                <option value="Leak">{{ $t('clinical360.assessment.body_dialog.ostomy_status_leak') }}</option>
                <option value="Irritated skin">{{ $t('clinical360.assessment.body_dialog.ostomy_status_irritated_skin') }}</option>
                <option value="Resolved">{{ $t('clinical360.assessment.body_dialog.ostomy_status_resolved') }}</option>
              </select>
            </label>
            <label v-else-if="assessmentType === 'pain'">
              {{ $t('clinical360.assessment.body_dialog.pain_score') }}
              <select v-model="elementStatus">
                <option>0</option>
                <option>1-3</option>
                <option>4-6</option>
                <option>7-10</option>
              </select>
            </label>
            <label>
              {{ $t('clinical360.assessment.body_dialog.nursing_observation') }}
              <textarea v-model="notes" rows="5" :placeholder="$t('clinical360.assessment.body_dialog.nursing_observation_placeholder')"></textarea>
            </label>
            <label>
              {{ $t('clinical360.assessment.body_dialog.next_action') }}
              <textarea v-model="nextAction" rows="3" :placeholder="$t('clinical360.assessment.body_dialog.next_action_placeholder')"></textarea>
            </label>
            <div class="selected-summary">
              <strong>{{ selectedAreas.length ? $t('clinical360.assessment.body_dialog.areas_selected_count', { count: selectedAreas.length }) : $t('clinical360.assessment.body_dialog.areas_selected_none') }}</strong>
              <span>{{ selectedAreas.join(', ') || $t('clinical360.assessment.body_dialog.select_areas_hint') }}</span>
            </div>
          </aside>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="closeDialog">{{ $t('clinical360.assessment.body_dialog.cancel') }}</v-btn>
        <v-btn color="#0f766e" dark depressed :disabled="!selectedAreas.length" @click="saveAssessment">
          {{ $t('clinical360.assessment.body_dialog.save_assessment') }}
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
      nextAction: '',
      assessmentType: 'general',
      elementStatus: ''
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
        assessmentType: this.assessmentType,
        elementStatus: this.elementStatus,
        notes: this.notes,
        nextAction: this.nextAction,
        timestamp: new Date().toISOString()
      })
      this.selectedAreas = []
      this.notes = ''
      this.severity = 'Routine'
      this.nextAction = ''
      this.assessmentType = 'general'
      this.elementStatus = ''
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
.body-assessment-form label select,
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
