<template>
  <div class="mobility-assessment-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-walk</v-icon>
        <span>{{ $t('clinical360.flowsheets.forms.mobility.title') }}</span>
        <v-spacer />
        <button type="button" class="close-btn" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </button>
      </v-card-title>

      <v-divider />

      <v-card-text class="form-body">
        <form @submit.prevent="submitForm">
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.flowsheets.forms.mobility.section_mobility_status') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.mobility.label_mobility_level') }} *</label>
                <v-select
                  v-model="form.mobilityLevel"
                  :items="mobilityLevels"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.mobility.label_assistance_required') }}</label>
                <v-select
                  v-model="form.assistanceRequired"
                  :items="assistanceRequiredOptions"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.mobility.label_assistive_devices') }}</label>
                <v-combobox
                  v-model="form.assistiveDevices"
                  :items="assistiveDevicesOptions"
                  item-value="value"
                  item-text="text"
                  multiple
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.mobility.label_ambulation_distance') }}</label>
                <v-select
                  v-model="form.ambulationDistance"
                  :items="ambulationDistanceOptions"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.flowsheets.forms.mobility.section_functional_abilities') }}</h3>
            <div class="function-grid">
              <div v-for="activity in functionalActivities" :key="activity.id" class="function-item">
                <label>{{ activity.label }}</label>
                <v-select
                  :value="form.functionStatus[activity.id]"
                  :items="functionStatusOptions"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                  @change="form.functionStatus[activity.id] = $event"
                />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.flowsheets.forms.mobility.section_barriers') }}</h3>
            <div class="checklist">
              <label v-for="barrier in mobilityBarriers" :key="barrier.id" class="checklist-item">
                <v-checkbox v-model="form.barriers[barrier.id]" />
                <span>{{ barrier.label }}</span>
              </label>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.flowsheets.forms.mobility.section_fall_risk') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.mobility.label_fall_risk_level') }}</label>
                <v-select
                  v-model="form.fallRiskLevel"
                  :items="fallRiskOptions"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.mobility.label_fall_prevention') }}</label>
                <v-combobox
                  v-model="form.fallPrevention"
                  :items="fallPreventionOptions"
                  item-value="value"
                  item-text="text"
                  multiple
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.flowsheets.forms.mobility.section_exercise_therapy') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.mobility.label_pt_ordered') }}</label>
                <v-checkbox v-model="form.ptOrdered" />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.mobility.label_ot_ordered') }}</label>
                <v-checkbox v-model="form.otOrdered" />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.mobility.label_exercise_performed') }}</label>
                <v-textarea
                  v-model="form.exercisePerformed"
                  :placeholder="$t('clinical360.flowsheets.forms.mobility.placeholder_exercise_performed')"
                  outlined
                  dense
                  rows="3"
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.mobility.label_activity_response') }}</label>
                <v-textarea
                  v-model="form.activityResponse"
                  :placeholder="$t('clinical360.flowsheets.forms.mobility.placeholder_activity_response')"
                  outlined
                  dense
                  rows="3"
                />
              </div>
            </div>
          </section>

          <div class="form-actions">
            <v-btn type="button" outlined @click="$emit('close')">
              {{ $t('clinical360.flowsheets.forms.mobility.cancel') }}
            </v-btn>
            <v-btn type="submit" color="primary" dark>
              {{ $t('clinical360.flowsheets.forms.mobility.save') }}
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
  name: 'MobilityAssessmentForm',
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true }
  },
  data() {
    return {
      form: {
        mobilityLevel: '',
        assistanceRequired: '',
        assistiveDevices: [],
        ambulationDistance: '',
        functionStatus: {
          bed_transfer: '',
          wheelchair_transfer: '',
          toileting: '',
          dressing: '',
          grooming: '',
          feeding: '',
          bathing: ''
        },
        barriers: {
          pain: false,
          weakness: false,
          contractures: false,
          casts_splints: false,
          obesity: false,
          cognitive: false,
          depression: false,
          medication: false
        },
        fallRiskLevel: '',
        fallPrevention: [],
        ptOrdered: false,
        otOrdered: false,
        exercisePerformed: '',
        activityResponse: ''
      },
      functionalActivityIds: ['bed_transfer', 'wheelchair_transfer', 'toileting', 'dressing', 'grooming', 'feeding', 'bathing'],
      mobilityBarrierIds: ['pain', 'weakness', 'contractures', 'casts_splints', 'obesity', 'cognitive', 'depression', 'medication']
    }
  },
  computed: {
    mobilityLevels() {
      return [
        ['independent', 'Independent'], ['walks_with_assistance', 'Walks with assistance'],
        ['wheelchair_dependent', 'Wheelchair dependent'], ['bedbound', 'Bedbound'], ['chairbound', 'Chairbound']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.flowsheets.forms.mobility.options.mobility_level.${k}`) }))
    },
    assistanceRequiredOptions() {
      return [
        ['none', 'None'], ['supervision', 'Supervision'], ['contact_guard', 'Contact Guard'],
        ['minimal_assist', 'Minimal Assist'], ['moderate_assist', 'Moderate Assist'],
        ['maximal_assist', 'Maximal Assist'], ['dependent', 'Dependent']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.flowsheets.forms.mobility.options.assistance_required.${k}`) }))
    },
    assistiveDevicesOptions() {
      return [
        ['cane', 'Cane'], ['walker', 'Walker'], ['crutches', 'Crutches'], ['wheelchair', 'Wheelchair'], ['bed', 'Bed'], ['other', 'Other']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.flowsheets.forms.mobility.options.assistive_devices.${k}`) }))
    },
    ambulationDistanceOptions() {
      return [
        ['bedbound', 'Bedbound'], ['chairbound', 'Chairbound'], ['room', 'Room'], ['ten_to_fifty_ft', '10-50 ft'],
        ['fifty_to_150_ft', '50-150 ft'], ['over_150_ft', '>150 ft'], ['unlimited', 'Unlimited']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.flowsheets.forms.mobility.options.ambulation_distance.${k}`) }))
    },
    functionStatusOptions() {
      return [
        ['independent', 'Independent'], ['supervision', 'Supervision'], ['assistance', 'Assistance'],
        ['dependent', 'Dependent'], ['na', 'N/A']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.flowsheets.forms.mobility.options.function_status.${k}`) }))
    },
    fallRiskOptions() {
      return [
        ['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['very_high', 'Very High']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.flowsheets.forms.mobility.options.fall_risk.${k}`) }))
    },
    fallPreventionOptions() {
      return [
        ['bed_alarm', 'Bed alarm'], ['fall_mat', 'Fall mat'], ['frequent_checks', 'Frequent checks'],
        ['bed_rail', 'Bed rail'], ['assist_with_ambulation', 'Assist with ambulation'],
        ['adequate_lighting', 'Adequate lighting'], ['clear_pathways', 'Clear pathways'],
        ['call_bell_accessible', 'Call bell accessible']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.flowsheets.forms.mobility.options.fall_prevention.${k}`) }))
    },
    functionalActivities() {
      return this.functionalActivityIds.map(id => ({
        id,
        label: this.$t(`clinical360.flowsheets.forms.mobility.options.functional_activities.${id}`)
      }))
    },
    mobilityBarriers() {
      return this.mobilityBarrierIds.map(id => ({
        id,
        label: this.$t(`clinical360.flowsheets.forms.mobility.options.barriers.${id}`)
      }))
    }
  },
  created() {
    this.form.assistanceRequired = 'None'
    this.form.fallRiskLevel = 'Low'
    Object.keys(this.form.functionStatus).forEach(key => {
      this.form.functionStatus[key] = 'Independent'
    })
  },
  methods: {
    ...mapActions('flowsheets', ['createFlowsheetEntry']),
    async submitForm() {
      try {
        await this.createFlowsheetEntry({
          patientId: this.patientId,
          encounterId: this.encounterId,
          templateId: 'mobility',
          sectionId: 'mobility-1',
          entries: {
            'mobility-level': this.form.mobilityLevel,
            'assistance-required': this.form.assistanceRequired,
            'assistive-devices': this.form.assistiveDevices.join(', '),
            'ambulation-distance': this.form.ambulationDistance,
            'function-status': JSON.stringify(this.form.functionStatus),
            barriers: JSON.stringify(this.form.barriers),
            'fall-risk': this.form.fallRiskLevel,
            'fall-prevention': this.form.fallPrevention.join(', '),
            'pt-ordered': this.form.ptOrdered,
            'ot-ordered': this.form.otOrdered,
            'exercise-performed': this.form.exercisePerformed,
            'activity-response': this.form.activityResponse
          },
          recordedAt: new Date().toISOString()
        })
        this.$emit('save', this.form)
      } catch (error) {
        console.error('Error saving mobility assessment:', error)
        alert(this.$t('clinical360.flowsheets.forms.mobility.save_error'))
      }
    }
  }
}
</script>

<style scoped>
.mobility-assessment-form {
  width: 100%;
}

.form-header {
  background: linear-gradient(90deg, #7c3aed 0%, #a855f7 100%);
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

.function-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.function-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.function-item label {
  color: #334155;
  font-size: 12px;
  font-weight: 700;
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
