<template>
  <div class="transfer-form">
    <v-card>
      <v-card-title class="form-header">
        <span>{{ $t('clinical360.navigator.transfer_checklist.title') }}</span>
        <v-spacer />
        <button type="button" class="close-btn" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </button>
      </v-card-title>

      <v-divider />

      <v-card-text class="form-body">
        <form @submit.prevent="submitForm">
          <!-- Transfer Details -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.navigator.transfer_checklist.section_transfer_info_title') }}</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.navigator.transfer_checklist.current_location_label') }}</label>
                <v-text-field
                  v-model="form.currentLocation"
                  outlined
                  dense
                  readonly
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.transfer_checklist.transfer_location_label') }}</label>
                <v-select
                  v-model="form.transferLocation"
                  :items="transferLocations"
                  item-text="text"
                  item-value="value"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.transfer_checklist.transfer_reason_label') }}</label>
                <v-select
                  v-model="form.transferReason"
                  :items="transferReasonItems"
                  item-text="text"
                  item-value="value"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.transfer_checklist.transfer_time_label') }}</label>
                <v-text-field
                  v-model="form.transferTime"
                  type="datetime-local"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- Patient Condition -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.navigator.transfer_checklist.section_patient_status_title') }}</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.navigator.transfer_checklist.general_condition_label') }}</label>
                <v-select
                  v-model="form.patientCondition"
                  :items="patientConditionItems"
                  item-text="text"
                  item-value="value"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.transfer_checklist.mobility_level_label') }}</label>
                <v-select
                  v-model="form.mobilityLevel"
                  :items="mobilityLevelItems"
                  item-text="text"
                  item-value="value"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.transfer_checklist.cognitive_status_label') }}</label>
                <v-select
                  v-model="form.cognitiveStatus"
                  :items="cognitiveStatusItems"
                  item-text="text"
                  item-value="value"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.transfer_checklist.pain_level_label') }}</label>
                <v-text-field
                  v-model="form.painLevel"
                  type="number"
                  min="0"
                  max="10"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- Equipment & Lines Transfer -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.navigator.transfer_checklist.section_equipment_title') }}</h3>

            <div class="checklist">
              <label v-for="item in equipmentItems" :key="item.id" class="checklist-item">
                <v-checkbox v-model="form.equipment[item.id]" />
                <span>{{ item.label }}</span>
              </label>
            </div>

            <div class="form-grid" style="margin-top: 16px">
              <div class="form-group">
                <label>{{ $t('clinical360.navigator.transfer_checklist.equipment_notes_label') }}</label>
                <v-textarea
                  v-model="form.equipmentNotes"
                  :placeholder="$t('clinical360.navigator.transfer_checklist.equipment_notes_placeholder')"
                  outlined
                  dense
                  rows="3"
                />
              </div>
            </div>
          </section>

          <!-- Hand-off Communication -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.navigator.transfer_checklist.section_handoff_title') }}</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.navigator.transfer_checklist.situation_label') }}</label>
                <v-textarea
                  v-model="form.situation"
                  :placeholder="$t('clinical360.navigator.transfer_checklist.situation_placeholder')"
                  outlined
                  dense
                  rows="3"
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.transfer_checklist.background_label') }}</label>
                <v-textarea
                  v-model="form.background"
                  :placeholder="$t('clinical360.navigator.transfer_checklist.background_placeholder')"
                  outlined
                  dense
                  rows="3"
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.transfer_checklist.assessment_label') }}</label>
                <v-textarea
                  v-model="form.assessment"
                  :placeholder="$t('clinical360.navigator.transfer_checklist.assessment_placeholder')"
                  outlined
                  dense
                  rows="3"
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.transfer_checklist.recommendation_label') }}</label>
                <v-textarea
                  v-model="form.recommendation"
                  :placeholder="$t('clinical360.navigator.transfer_checklist.recommendation_placeholder')"
                  outlined
                  dense
                  rows="3"
                />
              </div>
            </div>
          </section>

          <!-- Transferring Personnel -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.navigator.transfer_checklist.section_documentation_title') }}</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.navigator.transfer_checklist.transferring_nurse_label') }}</label>
                <v-text-field
                  v-model="form.transferringNurse"
                  :placeholder="$t('clinical360.navigator.transfer_checklist.name_placeholder')"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.transfer_checklist.receiving_contact_label') }}</label>
                <v-text-field
                  v-model="form.receivingContact"
                  :placeholder="$t('clinical360.navigator.transfer_checklist.receiving_contact_placeholder')"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- Form Actions -->
          <div class="form-actions">
            <v-btn
              type="button"
              outlined
              @click="$emit('close')"
            >
              {{ $t('clinical360.navigator.transfer_checklist.cancel_btn') }}
            </v-btn>
            <v-btn
              type="submit"
              color="primary"
              dark
            >
              {{ $t('clinical360.navigator.transfer_checklist.complete_transfer_btn') }}
            </v-btn>
          </div>
        </form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  name: 'TransferChecklistForm',
  props: {
    patientId: { type: String, required: true }
  },
  data() {
    return {
      form: {
        currentLocation: 'Medecine interne',
        transferLocation: '',
        transferReason: '',
        transferTime: '',
        patientCondition: 'Stable',
        mobilityLevel: 'Assistance of 1',
        cognitiveStatus: 'Alert & Oriented',
        painLevel: '0',
        equipment: {
          iv_line: false,
          oxygen: false,
          monitor: false,
          catheter: false,
          drain: false,
          other: false
        },
        equipmentNotes: '',
        situation: '',
        background: '',
        assessment: '',
        recommendation: '',
        transferringNurse: '',
        receivingContact: ''
      }
    }
  },
  computed: {
    transferLocations() {
      return [
        { text: this.$t('clinical360.navigator.transfer_checklist.location_icu'), value: 'ICU' },
        { text: this.$t('clinical360.navigator.transfer_checklist.location_step_down'), value: 'Step-Down Unit' },
        { text: this.$t('clinical360.navigator.transfer_checklist.location_med_surg'), value: 'Medical/Surgical Floor' },
        { text: this.$t('clinical360.navigator.transfer_checklist.location_telemetry'), value: 'Telemetry Unit' },
        { text: this.$t('clinical360.navigator.transfer_checklist.location_pediatrics'), value: 'Pediatrics' },
        { text: this.$t('clinical360.navigator.transfer_checklist.location_maternity'), value: 'Maternity' },
        { text: this.$t('clinical360.navigator.transfer_checklist.location_or'), value: 'OR' },
        { text: this.$t('clinical360.navigator.transfer_checklist.location_recovery'), value: 'Recovery' },
        { text: this.$t('clinical360.navigator.transfer_checklist.location_other_facility'), value: 'Other Facility' }
      ]
    },
    transferReasonItems() {
      return [
        { text: this.$t('clinical360.navigator.transfer_checklist.reason_step_down_care'), value: 'Step Down Care' },
        { text: this.$t('clinical360.navigator.transfer_checklist.reason_isolation_change'), value: 'Isolation Change' },
        { text: this.$t('clinical360.navigator.transfer_checklist.reason_specialty_care'), value: 'Specialty Care' },
        { text: this.$t('clinical360.navigator.transfer_checklist.reason_room_change'), value: 'Room Change' },
        { text: this.$t('clinical360.navigator.transfer_checklist.reason_other'), value: 'Other' }
      ]
    },
    patientConditionItems() {
      return [
        { text: this.$t('clinical360.navigator.transfer_checklist.condition_stable'), value: 'Stable' },
        { text: this.$t('clinical360.navigator.transfer_checklist.condition_improved'), value: 'Improved' },
        { text: this.$t('clinical360.navigator.transfer_checklist.condition_unchanged'), value: 'Unchanged' },
        { text: this.$t('clinical360.navigator.transfer_checklist.condition_declined'), value: 'Declined' },
        { text: this.$t('clinical360.navigator.transfer_checklist.condition_critical'), value: 'Critical' }
      ]
    },
    mobilityLevelItems() {
      return [
        { text: this.$t('clinical360.navigator.transfer_checklist.mobility_independent'), value: 'Independent' },
        { text: this.$t('clinical360.navigator.transfer_checklist.mobility_assistance_1'), value: 'Assistance of 1' },
        { text: this.$t('clinical360.navigator.transfer_checklist.mobility_assistance_2'), value: 'Assistance of 2' },
        { text: this.$t('clinical360.navigator.transfer_checklist.mobility_bedbound'), value: 'Bedbound' }
      ]
    },
    cognitiveStatusItems() {
      return [
        { text: this.$t('clinical360.navigator.transfer_checklist.cognitive_alert_oriented'), value: 'Alert & Oriented' },
        { text: this.$t('clinical360.navigator.transfer_checklist.cognitive_confused'), value: 'Confused' },
        { text: this.$t('clinical360.navigator.transfer_checklist.cognitive_altered_loc'), value: 'Altered LOC' }
      ]
    },
    equipmentItems() {
      return [
        { id: 'iv_line', label: this.$t('clinical360.navigator.transfer_checklist.equipment_iv_line') },
        { id: 'oxygen', label: this.$t('clinical360.navigator.transfer_checklist.equipment_oxygen') },
        { id: 'monitor', label: this.$t('clinical360.navigator.transfer_checklist.equipment_monitor') },
        { id: 'catheter', label: this.$t('clinical360.navigator.transfer_checklist.equipment_catheter') },
        { id: 'drain', label: this.$t('clinical360.navigator.transfer_checklist.equipment_drain') },
        { id: 'other', label: this.$t('clinical360.navigator.transfer_checklist.equipment_other') }
      ]
    }
  },
  methods: {
    submitForm() {
      if (!this.form.transferLocation) {
        alert(this.$t('clinical360.navigator.transfer_checklist.error_select_destination'))
        return
      }

      this.$emit('save', { ...this.form, completedAt: new Date().toISOString() })
    }
  }
}
</script>

<style scoped>
.transfer-form {
  width: 100%;
}

.form-header {
  background: #f8fafc;
  padding: 16px;
}

.close-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #64748b;
  padding: 4px;
}

.form-body {
  padding: 24px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.form-section {
  margin-bottom: 28px;
}

.section-title {
  color: #0f172a;
  font-size: 14px;
  font-weight: 900;
  margin: 0 0 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
