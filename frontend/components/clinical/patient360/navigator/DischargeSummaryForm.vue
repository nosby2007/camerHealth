<template>
  <div class="discharge-form">
    <v-card>
      <v-card-title class="form-header">
        <span>{{ $t('clinical360.navigator.discharge_summary.title') }}</span>
        <v-spacer />
        <button type="button" class="close-btn" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </button>
      </v-card-title>

      <v-divider />

      <v-card-text class="form-body">
        <form @submit.prevent="submitForm">
          <v-alert v-if="validationError" dense text type="error" class="mb-4">
            {{ validationError }}
          </v-alert>
          <!-- Discharge Planning -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.navigator.discharge_summary.section_planning_title') }}</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.navigator.discharge_summary.discharge_datetime_label') }}</label>
                <v-text-field
                  v-model="form.dischargeDateTime"
                  type="datetime-local"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.discharge_summary.disposition_label') }}</label>
                <v-select
                  v-model="form.dischargeDisposition"
                  :items="dispositionItems"
                  item-text="text"
                  item-value="value"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.discharge_summary.discharging_provider_label') }}</label>
                <v-text-field
                  v-model="form.dischargingProvider"
                  :placeholder="$t('clinical360.navigator.discharge_summary.discharging_provider_placeholder')"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.discharge_summary.primary_diagnosis_label') }}</label>
                <v-text-field
                  v-model="form.primaryDiagnosis"
                  :placeholder="$t('clinical360.navigator.discharge_summary.primary_diagnosis_placeholder')"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- Clinical Condition at Discharge -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.navigator.discharge_summary.section_status_title') }}</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.navigator.discharge_summary.general_condition_label') }}</label>
                <v-select
                  v-model="form.generalCondition"
                  :items="generalConditionItems"
                  item-text="text"
                  item-value="value"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.discharge_summary.mental_status_label') }}</label>
                <v-select
                  v-model="form.mentalStatus"
                  :items="mentalStatusItems"
                  item-text="text"
                  item-value="value"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.discharge_summary.functional_ability_label') }}</label>
                <v-select
                  v-model="form.functionalAbility"
                  :items="functionalAbilityItems"
                  item-text="text"
                  item-value="value"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.discharge_summary.pain_level_label') }}</label>
                <v-text-field
                  v-model="form.painAtDischarge"
                  type="number"
                  min="0"
                  max="10"
                  outlined
                  dense
                />
              </div>
            </div>

            <div class="form-grid" style="margin-top: 16px">
              <div class="form-group">
                <label>{{ $t('clinical360.navigator.discharge_summary.condition_summary_label') }}</label>
                <v-textarea
                  v-model="form.conditionSummary"
                  :placeholder="$t('clinical360.navigator.discharge_summary.condition_summary_placeholder')"
                  outlined
                  dense
                  rows="4"
                />
              </div>
            </div>
          </section>

          <!-- Medications at Discharge -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.navigator.discharge_summary.section_medications_title') }}</h3>

            <div class="checklist">
              <label class="checklist-item">
                <v-checkbox v-model="form.medicationReconciliation" />
                <span>{{ $t('clinical360.navigator.discharge_summary.medication_reconciliation') }}</span>
              </label>
              <label class="checklist-item">
                <v-checkbox v-model="form.medicationsProvided" />
                <span>{{ $t('clinical360.navigator.discharge_summary.medications_provided') }}</span>
              </label>
              <label class="checklist-item">
                <v-checkbox v-model="form.medicationInstructions" />
                <span>{{ $t('clinical360.navigator.discharge_summary.medication_instructions_reviewed') }}</span>
              </label>
            </div>

            <div class="form-grid" style="margin-top: 16px">
              <div class="form-group">
                <label>{{ $t('clinical360.navigator.discharge_summary.medications_at_home_label') }}</label>
                <v-textarea
                  v-model="form.medicationsAtHome"
                  :placeholder="$t('clinical360.navigator.discharge_summary.medications_at_home_placeholder')"
                  outlined
                  dense
                  rows="4"
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.discharge_summary.discontinued_meds_label') }}</label>
                <v-textarea
                  v-model="form.discontinuedMeds"
                  :placeholder="$t('clinical360.navigator.discharge_summary.discontinued_meds_placeholder')"
                  outlined
                  dense
                  rows="3"
                />
              </div>
            </div>
          </section>

          <!-- Discharge Instructions -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.navigator.discharge_summary.section_instructions_title') }}</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.navigator.discharge_summary.activity_restrictions_label') }}</label>
                <v-textarea
                  v-model="form.activityRestrictions"
                  :placeholder="$t('clinical360.navigator.discharge_summary.activity_restrictions_placeholder')"
                  outlined
                  dense
                  rows="3"
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.discharge_summary.diet_nutrition_label') }}</label>
                <v-textarea
                  v-model="form.dietInstructions"
                  :placeholder="$t('clinical360.navigator.discharge_summary.diet_nutrition_placeholder')"
                  outlined
                  dense
                  rows="3"
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.discharge_summary.wound_care_label') }}</label>
                <v-textarea
                  v-model="form.woundCare"
                  :placeholder="$t('clinical360.navigator.discharge_summary.wound_care_placeholder')"
                  outlined
                  dense
                  rows="3"
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.discharge_summary.return_precautions_label') }}</label>
                <v-textarea
                  v-model="form.returnPrecautions"
                  :placeholder="$t('clinical360.navigator.discharge_summary.return_precautions_placeholder')"
                  outlined
                  dense
                  rows="3"
                />
              </div>
            </div>
          </section>

          <!-- Follow-up Arrangements -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.navigator.discharge_summary.section_follow_up_title') }}</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.navigator.discharge_summary.primary_care_follow_up_label') }}</label>
                <v-text-field
                  v-model="form.primaryCareFollowup"
                  :placeholder="$t('clinical360.navigator.discharge_summary.follow_up_placeholder')"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.discharge_summary.specialist_follow_up_label') }}</label>
                <v-text-field
                  v-model="form.specialistFollowup"
                  :placeholder="$t('clinical360.navigator.discharge_summary.follow_up_placeholder')"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.discharge_summary.lab_follow_up_label') }}</label>
                <v-text-field
                  v-model="form.labFollowup"
                  :placeholder="$t('clinical360.navigator.discharge_summary.lab_follow_up_placeholder')"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.discharge_summary.other_services_label') }}</label>
                <v-text-field
                  v-model="form.otherServices"
                  :placeholder="$t('clinical360.navigator.discharge_summary.other_services_placeholder')"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- Patient/Family Education -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.navigator.discharge_summary.section_education_title') }}</h3>

            <div class="checklist">
              <label v-for="item in educationItems" :key="item.id" class="checklist-item">
                <v-checkbox v-model="form.education[item.id]" />
                <span>{{ item.label }}</span>
              </label>
            </div>
          </section>

          <!-- Form Actions -->
          <div class="form-actions">
            <v-btn
              type="button"
              outlined
              @click="$emit('close')"
            >
              {{ $t('clinical360.navigator.discharge_summary.cancel_btn') }}
            </v-btn>
            <v-btn
              type="submit"
              color="primary"
              dark
            >
              {{ $t('clinical360.navigator.discharge_summary.complete_discharge_btn') }}
            </v-btn>
          </div>
        </form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  name: 'DischargeSummaryForm',
  props: {
    patientId: { type: String, required: true }
  },
  data() {
    return {
      validationError: '',
      form: {
        dischargeDateTime: '',
        dischargeDisposition: 'Home',
        dischargingProvider: '',
        primaryDiagnosis: '',
        generalCondition: 'Stable',
        mentalStatus: 'Alert & Oriented x3',
        functionalAbility: 'Independent',
        painAtDischarge: '0',
        conditionSummary: '',
        medicationReconciliation: false,
        medicationsProvided: false,
        medicationInstructions: false,
        medicationsAtHome: '',
        discontinuedMeds: '',
        activityRestrictions: '',
        dietInstructions: '',
        woundCare: '',
        returnPrecautions: '',
        primaryCareFollowup: '',
        specialistFollowup: '',
        labFollowup: '',
        otherServices: '',
        education: {
          disease_process: false,
          medication_use: false,
          activity_level: false,
          diet_restrictions: false,
          when_to_call: false,
          appointment_importance: false,
          support_resources: false
        }
      }
    }
  },
  computed: {
    dispositionItems() {
      return [
        { text: this.$t('clinical360.navigator.discharge_summary.disposition_home'), value: 'Home' },
        { text: this.$t('clinical360.navigator.discharge_summary.disposition_home_with_services'), value: 'Home with Services' },
        { text: this.$t('clinical360.navigator.discharge_summary.disposition_rehabilitation'), value: 'Rehabilitation' },
        { text: this.$t('clinical360.navigator.discharge_summary.disposition_skilled_nursing'), value: 'Skilled Nursing' },
        { text: this.$t('clinical360.navigator.discharge_summary.disposition_assisted_living'), value: 'Assisted Living' },
        { text: this.$t('clinical360.navigator.discharge_summary.disposition_hospice'), value: 'Hospice' },
        { text: this.$t('clinical360.navigator.discharge_summary.disposition_transfer'), value: 'Transfer to Another Facility' },
        { text: this.$t('clinical360.navigator.discharge_summary.disposition_ama'), value: 'AMA' }
      ]
    },
    generalConditionItems() {
      return [
        { text: this.$t('clinical360.navigator.discharge_summary.condition_stable'), value: 'Stable' },
        { text: this.$t('clinical360.navigator.discharge_summary.condition_improved'), value: 'Improved' },
        { text: this.$t('clinical360.navigator.discharge_summary.condition_good'), value: 'Good' },
        { text: this.$t('clinical360.navigator.discharge_summary.condition_fair'), value: 'Fair' },
        { text: this.$t('clinical360.navigator.discharge_summary.condition_critical'), value: 'Critical' }
      ]
    },
    mentalStatusItems() {
      return [
        { text: this.$t('clinical360.navigator.discharge_summary.mental_status_aox3'), value: 'Alert & Oriented x3' },
        { text: this.$t('clinical360.navigator.discharge_summary.mental_status_aox2'), value: 'Alert & Oriented x2' },
        { text: this.$t('clinical360.navigator.discharge_summary.mental_status_confused'), value: 'Confused' },
        { text: this.$t('clinical360.navigator.discharge_summary.mental_status_lethargic'), value: 'Lethargic' },
        { text: this.$t('clinical360.navigator.discharge_summary.mental_status_unresponsive'), value: 'Unresponsive' }
      ]
    },
    functionalAbilityItems() {
      return [
        { text: this.$t('clinical360.navigator.discharge_summary.functional_independent'), value: 'Independent' },
        { text: this.$t('clinical360.navigator.discharge_summary.functional_assistance_1'), value: 'Assistance of 1' },
        { text: this.$t('clinical360.navigator.discharge_summary.functional_assistance_2plus'), value: 'Assistance of 2+' },
        { text: this.$t('clinical360.navigator.discharge_summary.functional_bedbound'), value: 'Bedbound' }
      ]
    },
    educationItems() {
      return [
        { id: 'disease_process', label: this.$t('clinical360.navigator.discharge_summary.education_disease_process') },
        { id: 'medication_use', label: this.$t('clinical360.navigator.discharge_summary.education_medication_use') },
        { id: 'activity_level', label: this.$t('clinical360.navigator.discharge_summary.education_activity_level') },
        { id: 'diet_restrictions', label: this.$t('clinical360.navigator.discharge_summary.education_diet_restrictions') },
        { id: 'when_to_call', label: this.$t('clinical360.navigator.discharge_summary.education_when_to_call') },
        { id: 'appointment_importance', label: this.$t('clinical360.navigator.discharge_summary.education_appointment_importance') },
        { id: 'support_resources', label: this.$t('clinical360.navigator.discharge_summary.education_support_resources') }
      ]
    }
  },
  methods: {
    submitForm() {
      const requiredText = [
        [this.$t('clinical360.navigator.discharge_summary.field_discharge_datetime'), this.form.dischargeDateTime],
        [this.$t('clinical360.navigator.discharge_summary.field_disposition'), this.form.dischargeDisposition],
        [this.$t('clinical360.navigator.discharge_summary.field_primary_diagnosis'), this.form.primaryDiagnosis],
        [this.$t('clinical360.navigator.discharge_summary.field_condition_summary'), this.form.conditionSummary],
        [this.$t('clinical360.navigator.discharge_summary.field_return_precautions'), this.form.returnPrecautions]
      ]
      const missing = requiredText.filter(([, value]) => !String(value || '').trim()).map(([label]) => label)
      if (missing.length) {
        this.validationError = this.$t('clinical360.navigator.discharge_summary.error_required_fields', { fields: missing.join(', ') })
        return
      }
      if (!this.form.medicationReconciliation) {
        this.validationError = this.$t('clinical360.navigator.discharge_summary.error_medication_reconciliation')
        return
      }
      if (!Object.values(this.form.education).some(Boolean)) {
        this.validationError = this.$t('clinical360.navigator.discharge_summary.error_education_topic')
        return
      }

      this.validationError = ''
      this.$emit('save', { ...this.form, completedAt: new Date().toISOString() })
    }
  }
}
</script>

<style scoped>
.discharge-form {
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
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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
