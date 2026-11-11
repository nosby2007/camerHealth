<template>
  <div class="return-precautions-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-alert-circle-outline</v-icon>
        <span>{{ $t('clinical360.discharge.return_precautions_form.title') }}</span>
        <v-spacer />
        <button type="button" class="close-btn" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </button>
      </v-card-title>

      <v-divider />

      <v-card-text class="form-body">
        <form @submit.prevent="submitForm">
          <!-- Critical Red Flags -->
          <section class="form-section">
            <h3 class="section-title">🚨 {{ $t('clinical360.discharge.return_precautions_form.section_critical_title') }}</h3>
            <div class="critical-alerts">
              <div v-for="alert in criticalAlerts" :key="alert.key" class="alert-item">
                <v-checkbox v-model="form.criticalRedFlags[alert.key]" />
                <span class="alert-text">{{ $t(alert.labelKey) }}</span>
              </div>
            </div>
            <v-textarea
              v-model="form.otherCriticalAlerts"
              :label="$t('clinical360.discharge.return_precautions_form.other_critical_label')"
              :placeholder="$t('clinical360.discharge.return_precautions_form.other_critical_placeholder')"
              outlined dense rows="2"
            />
          </section>

          <!-- Surgical/Wound Complications -->
          <section class="form-section">
            <h3 class="section-title">🩹 {{ $t('clinical360.discharge.return_precautions_form.section_wound_title') }}</h3>
            <div class="precaution-grid">
              <div v-for="item in woundPrecautions" :key="item.key" class="precaution-item">
                <v-checkbox v-model="form.woundPrecautions[item.key]" />
                <span>{{ $t(item.labelKey) }}</span>
              </div>
            </div>
            <v-textarea
              v-model="form.woundPrecautionDetails"
              :label="$t('clinical360.discharge.return_precautions_form.wound_details_label')"
              :placeholder="$t('clinical360.discharge.return_precautions_form.wound_details_placeholder')"
              outlined dense rows="3"
            />
          </section>

          <!-- Medication-Related Precautions -->
          <section class="form-section">
            <h3 class="section-title">💊 {{ $t('clinical360.discharge.return_precautions_form.section_medication_title') }}</h3>
            <div class="precaution-grid">
              <div v-for="item in medicationPrecautions" :key="item.key" class="precaution-item">
                <v-checkbox v-model="form.medicationPrecautions[item.key]" />
                <span>{{ $t(item.labelKey) }}</span>
              </div>
            </div>
            <v-textarea
              v-model="form.medicationPrecautionDetails"
              :label="$t('clinical360.discharge.return_precautions_form.medication_details_label')"
              :placeholder="$t('clinical360.discharge.return_precautions_form.medication_details_placeholder')"
              outlined dense rows="3"
            />
          </section>

          <!-- Activity/Mobility Precautions -->
          <section class="form-section">
            <h3 class="section-title">🚶 {{ $t('clinical360.discharge.return_precautions_form.section_activity_title') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.return_precautions_form.weight_bearing_label') }} *</label>
                <v-select
                  v-model="form.weightBearingStatus"
                  :items="weightBearingOptions"
                  item-text="text" item-value="value"
                  outlined dense required
                />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.return_precautions_form.mobility_aids_label') }}</label>
                <v-combobox
                  v-model="form.mobilityAids"
                  :items="mobilityAidOptions"
                  item-text="text" item-value="value"
                  multiple outlined dense chips
                />
              </div>
            </div>
            <div class="precaution-grid">
              <div v-for="item in activityPrecautions" :key="item.key" class="precaution-item">
                <v-checkbox v-model="form.activityPrecautions[item.key]" />
                <span>{{ $t(item.labelKey) }}</span>
              </div>
            </div>
          </section>

          <!-- Infection Control Precautions -->
          <section class="form-section">
            <h3 class="section-title">🛡️ {{ $t('clinical360.discharge.return_precautions_form.section_infection_title') }}</h3>
            <div class="precaution-grid">
              <div v-for="item in infectionPrecautions" :key="item.key" class="precaution-item">
                <v-checkbox v-model="form.infectionPrecautions[item.key]" />
                <span>{{ $t(item.labelKey) }}</span>
              </div>
            </div>
            <v-textarea
              v-model="form.infectionPrecautionDetails"
              :label="$t('clinical360.discharge.return_precautions_form.infection_details_label')"
              :placeholder="$t('clinical360.discharge.return_precautions_form.infection_details_placeholder')"
              outlined dense rows="3"
            />
          </section>

          <!-- Diet Precautions -->
          <section class="form-section">
            <h3 class="section-title">🍽️ {{ $t('clinical360.discharge.return_precautions_form.section_diet_title') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.return_precautions_form.diet_type_label') }} *</label>
                <v-select
                  v-model="form.dietType"
                  :items="dietTypeOptions"
                  item-text="text" item-value="value"
                  outlined dense required
                />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.return_precautions_form.fluid_restriction_label') }}</label>
                <v-text-field
                  v-model="form.fluidRestriction"
                  :placeholder="$t('clinical360.discharge.return_precautions_form.fluid_restriction_placeholder')"
                  outlined dense
                />
              </div>
            </div>
            <div class="precaution-grid">
              <div v-for="item in dietPrecautions" :key="item.key" class="precaution-item">
                <v-checkbox v-model="form.dietPrecautions[item.key]" />
                <span>{{ $t(item.labelKey) }}</span>
              </div>
            </div>
          </section>

          <!-- Device-Specific Precautions -->
          <section class="form-section">
            <h3 class="section-title">⚙️ {{ $t('clinical360.discharge.return_precautions_form.section_devices_title') }}</h3>
            <div class="device-precautions">
              <div class="device-item">
                <h4>{{ form.devices.hasIV ? '✓' : '○' }} {{ $t('clinical360.discharge.return_precautions_form.device_iv_title') }}</h4>
                <v-checkbox v-model="form.devices.hasIV" @change="toggleDevice('hasIV')" />
                <div v-if="form.devices.hasIV" class="device-details">
                  <v-text-field v-model="form.devices.ivPrecautions" :placeholder="$t('clinical360.discharge.return_precautions_form.device_care_placeholder')" outlined dense />
                </div>
              </div>

              <div class="device-item">
                <h4>{{ form.devices.hasCatheter ? '✓' : '○' }} {{ $t('clinical360.discharge.return_precautions_form.device_catheter_title') }}</h4>
                <v-checkbox v-model="form.devices.hasCatheter" @change="toggleDevice('hasCatheter')" />
                <div v-if="form.devices.hasCatheter" class="device-details">
                  <v-text-field v-model="form.devices.catheterPrecautions" :placeholder="$t('clinical360.discharge.return_precautions_form.device_care_placeholder')" outlined dense />
                </div>
              </div>

              <div class="device-item">
                <h4>{{ form.devices.hasDrain ? '✓' : '○' }} {{ $t('clinical360.discharge.return_precautions_form.device_drain_title') }}</h4>
                <v-checkbox v-model="form.devices.hasDrain" @change="toggleDevice('hasDrain')" />
                <div v-if="form.devices.hasDrain" class="device-details">
                  <v-text-field v-model="form.devices.drainPrecautions" :placeholder="$t('clinical360.discharge.return_precautions_form.device_drain_placeholder')" outlined dense />
                </div>
              </div>

              <div class="device-item">
                <h4>{{ form.devices.hasTrach ? '✓' : '○' }} {{ $t('clinical360.discharge.return_precautions_form.device_trach_title') }}</h4>
                <v-checkbox v-model="form.devices.hasTrach" @change="toggleDevice('hasTrach')" />
                <div v-if="form.devices.hasTrach" class="device-details">
                  <v-text-field v-model="form.devices.trachPrecautions" :placeholder="$t('clinical360.discharge.return_precautions_form.device_trach_placeholder')" outlined dense />
                </div>
              </div>

              <div class="device-item">
                <h4>{{ form.devices.hasOstomy ? '✓' : '○' }} {{ $t('clinical360.discharge.return_precautions_form.device_ostomy_title') }}</h4>
                <v-checkbox v-model="form.devices.hasOstomy" @change="toggleDevice('hasOstomy')" />
                <div v-if="form.devices.hasOstomy" class="device-details">
                  <v-text-field v-model="form.devices.ostomyPrecautions" :placeholder="$t('clinical360.discharge.return_precautions_form.device_ostomy_placeholder')" outlined dense />
                </div>
              </div>
            </div>
          </section>

          <!-- Environmental/Home Safety -->
          <section class="form-section">
            <h3 class="section-title">🏠 {{ $t('clinical360.discharge.return_precautions_form.section_home_safety_title') }}</h3>
            <div class="precaution-grid">
              <div v-for="item in homeSafetyPrecautions" :key="item.key" class="precaution-item">
                <v-checkbox v-model="form.homeSafetyPrecautions[item.key]" />
                <span>{{ $t(item.labelKey) }}</span>
              </div>
            </div>
          </section>

          <!-- When to Contact Provider -->
          <section class="form-section">
            <h3 class="section-title">📞 {{ $t('clinical360.discharge.return_precautions_form.section_contact_provider_title') }}</h3>
            <v-textarea
              v-model="form.contactProviderCriteria"
              :label="$t('clinical360.discharge.return_precautions_form.contact_provider_label')"
              :placeholder="$t('clinical360.discharge.return_precautions_form.contact_provider_placeholder')"
              outlined dense rows="4"
            />
          </section>

          <!-- Patient/Family Education -->
          <section class="form-section">
            <h3 class="section-title">✅ {{ $t('clinical360.discharge.return_precautions_form.section_education_title') }}</h3>
            <div class="checklist">
              <v-checkbox v-model="form.education.precautionsReviewed" :label="$t('clinical360.discharge.return_precautions_form.education_precautions_reviewed')" />
              <v-checkbox v-model="form.education.writtenMaterialProvided" :label="$t('clinical360.discharge.return_precautions_form.education_written_material')" />
              <v-checkbox v-model="form.education.emergentnumbers" :label="$t('clinical360.discharge.return_precautions_form.education_emergency_numbers')" />
              <v-checkbox v-model="form.education.returnDemonstration" :label="$t('clinical360.discharge.return_precautions_form.education_return_demonstration')" />
              <v-checkbox v-model="form.education.familyPresent" :label="$t('clinical360.discharge.return_precautions_form.education_family_present')" />
            </div>
          </section>

          <div class="form-actions">
            <v-btn type="button" outlined @click="$emit('close')">{{ $t('clinical360.discharge.return_precautions_form.cancel_btn') }}</v-btn>
            <v-btn type="submit" color="primary" dark>{{ $t('clinical360.discharge.return_precautions_form.save_btn') }}</v-btn>
          </div>
        </form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'ReturnPrecautionsForm',
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true }
  },
  data() {
    return {
      form: {
        criticalRedFlags: {
          'Severe chest pain or shortness of breath': false,
          'Loss of consciousness or severe confusion': false,
          'Uncontrolled bleeding or blood clot': false,
          'Severe allergic reaction': false,
          'High fever (>103°F / >39.4°C)': false,
          'Severe abdominal pain': false,
          'Signs of sepsis (fever, chills, confusion)': false
        },
        otherCriticalAlerts: '',
        woundPrecautions: {
          'Watch for increased redness or warmth': false,
          'Monitor for pus or foul odor': false,
          'Report increasing pain not relieved by medications': false,
          'Keep wound dry and covered as instructed': false,
          'Report opening of incision or separation': false,
          'Watch for unusual drainage or bleeding': false
        },
        woundPrecautionDetails: '',
        medicationPrecautions: {
          'Take medications as prescribed': false,
          'Do not stop/skip doses without contacting provider': false,
          'Watch for allergic reactions': false,
          'Monitor for medication side effects': false,
          'Avoid over-the-counter drugs without approval': false,
          'Keep track of medication refills': false
        },
        medicationPrecautionDetails: '',
        weightBearingStatus: '', mobilityAids: [],
        activityPrecautions: {
          'No strenuous activity until cleared': false,
          'Avoid heavy lifting (>10 lbs) until cleared': false,
          'Use assistive device as prescribed': false,
          'Take breaks and avoid overexertion': false,
          'Sleep with legs elevated if swelling present': false
        },
        infectionPrecautions: {
          'Practice good hand hygiene': false,
          'Keep incision clean and dry': false,
          'Avoid crowds if immunocompromised': false,
          'Report fever >100.4°F': false,
          'Monitor for signs of infection': false
        },
        infectionPrecautionDetails: '',
        dietType: '', fluidRestriction: '',
        dietPrecautions: {
          'Follow prescribed diet exactly': false,
          'Avoid foods that cause discomfort': false,
          'Drink plenty of fluids (unless restricted)': false,
          'Report nausea, vomiting, or loss of appetite': false,
          'Eat small, frequent meals': false
        },
        devices: {
          hasIV: false, ivPrecautions: '',
          hasCatheter: false, catheterPrecautions: '',
          hasDrain: false, drainPrecautions: '',
          hasTrach: false, trachPrecautions: '',
          hasOstomy: false, ostomyPrecautions: ''
        },
        homeSafetyPrecautions: {
          'Remove fall hazards (rugs, clutter)': false,
          'Install grab bars in bathroom': false,
          'Ensure adequate lighting': false,
          'Use bed rails if needed': false,
          'Keep phone accessible': false,
          'Have emergency contacts posted': false
        },
        contactProviderCriteria: '',
        education: {
          precautionsReviewed: false,
          writtenMaterialProvided: false,
          emergentnumbers: false,
          returnDemonstration: false,
          familyPresent: false
        }
      }
    }
  },
  computed: {
    criticalAlerts() {
      return [
        { key: 'Severe chest pain or shortness of breath', labelKey: 'clinical360.discharge.return_precautions_form.flag_chest_pain' },
        { key: 'Loss of consciousness or severe confusion', labelKey: 'clinical360.discharge.return_precautions_form.flag_confusion' },
        { key: 'Uncontrolled bleeding or blood clot', labelKey: 'clinical360.discharge.return_precautions_form.flag_bleeding' },
        { key: 'Severe allergic reaction', labelKey: 'clinical360.discharge.return_precautions_form.flag_allergic_reaction' },
        { key: 'High fever (>103°F / >39.4°C)', labelKey: 'clinical360.discharge.return_precautions_form.flag_high_fever' },
        { key: 'Severe abdominal pain', labelKey: 'clinical360.discharge.return_precautions_form.flag_abdominal_pain' },
        { key: 'Signs of sepsis (fever, chills, confusion)', labelKey: 'clinical360.discharge.return_precautions_form.flag_sepsis' }
      ]
    },
    woundPrecautions() {
      return [
        { key: 'Watch for increased redness or warmth', labelKey: 'clinical360.discharge.return_precautions_form.wound_redness' },
        { key: 'Monitor for pus or foul odor', labelKey: 'clinical360.discharge.return_precautions_form.wound_pus' },
        { key: 'Report increasing pain', labelKey: 'clinical360.discharge.return_precautions_form.wound_increasing_pain' },
        { key: 'Keep wound dry', labelKey: 'clinical360.discharge.return_precautions_form.wound_dry_covered' },
        { key: 'Report incision opening', labelKey: 'clinical360.discharge.return_precautions_form.wound_incision_opening' },
        { key: 'Watch for unusual drainage', labelKey: 'clinical360.discharge.return_precautions_form.wound_unusual_drainage' }
      ]
    },
    medicationPrecautions() {
      return [
        { key: 'Take as prescribed', labelKey: 'clinical360.discharge.return_precautions_form.medication_as_prescribed' },
        { key: 'Do not skip doses', labelKey: 'clinical360.discharge.return_precautions_form.medication_no_skip_doses' },
        { key: 'Watch for allergies', labelKey: 'clinical360.discharge.return_precautions_form.medication_allergic_reactions' },
        { key: 'Monitor side effects', labelKey: 'clinical360.discharge.return_precautions_form.medication_side_effects' },
        { key: 'Avoid OTC drugs', labelKey: 'clinical360.discharge.return_precautions_form.medication_avoid_otc' },
        { key: 'Track refills', labelKey: 'clinical360.discharge.return_precautions_form.medication_track_refills' }
      ]
    },
    activityPrecautions() {
      return [
        { key: 'No strenuous activity', labelKey: 'clinical360.discharge.return_precautions_form.activity_no_strenuous' },
        { key: 'Avoid heavy lifting', labelKey: 'clinical360.discharge.return_precautions_form.activity_avoid_lifting' },
        { key: 'Use assistive device', labelKey: 'clinical360.discharge.return_precautions_form.activity_use_assistive_device' },
        { key: 'Take breaks', labelKey: 'clinical360.discharge.return_precautions_form.activity_take_breaks' },
        { key: 'Sleep with elevation', labelKey: 'clinical360.discharge.return_precautions_form.activity_elevate_legs' }
      ]
    },
    infectionPrecautions() {
      return [
        { key: 'Hand hygiene', labelKey: 'clinical360.discharge.return_precautions_form.infection_hand_hygiene' },
        { key: 'Keep incision clean', labelKey: 'clinical360.discharge.return_precautions_form.infection_keep_incision_clean' },
        { key: 'Avoid crowds', labelKey: 'clinical360.discharge.return_precautions_form.infection_avoid_crowds' },
        { key: 'Report fever', labelKey: 'clinical360.discharge.return_precautions_form.infection_report_fever' },
        { key: 'Monitor signs', labelKey: 'clinical360.discharge.return_precautions_form.infection_monitor_signs' }
      ]
    },
    dietPrecautions() {
      return [
        { key: 'Follow prescribed diet', labelKey: 'clinical360.discharge.return_precautions_form.diet_follow_prescribed' },
        { key: 'Avoid triggers', labelKey: 'clinical360.discharge.return_precautions_form.diet_avoid_discomfort_foods' },
        { key: 'Drink fluids', labelKey: 'clinical360.discharge.return_precautions_form.diet_drink_fluids' },
        { key: 'Report nausea', labelKey: 'clinical360.discharge.return_precautions_form.diet_report_nausea' },
        { key: 'Eat frequent meals', labelKey: 'clinical360.discharge.return_precautions_form.diet_small_frequent_meals' }
      ]
    },
    homeSafetyPrecautions() {
      return [
        { key: 'Remove fall hazards', labelKey: 'clinical360.discharge.return_precautions_form.safety_remove_hazards' },
        { key: 'Install grab bars', labelKey: 'clinical360.discharge.return_precautions_form.safety_grab_bars' },
        { key: 'Adequate lighting', labelKey: 'clinical360.discharge.return_precautions_form.safety_lighting' },
        { key: 'Bed rails', labelKey: 'clinical360.discharge.return_precautions_form.safety_bed_rails' },
        { key: 'Phone accessible', labelKey: 'clinical360.discharge.return_precautions_form.safety_phone_accessible' },
        { key: 'Post emergency contacts', labelKey: 'clinical360.discharge.return_precautions_form.safety_emergency_contacts' }
      ]
    },
    weightBearingOptions() {
      return [
        { value: 'Full weight bearing', text: this.$t('clinical360.discharge.return_precautions_form.weight_bearing_full') },
        { value: 'Partial weight bearing', text: this.$t('clinical360.discharge.return_precautions_form.weight_bearing_partial') },
        { value: 'Non-weight bearing', text: this.$t('clinical360.discharge.return_precautions_form.weight_bearing_none') },
        { value: 'No restrictions', text: this.$t('clinical360.discharge.return_precautions_form.weight_bearing_no_restrictions') }
      ]
    },
    mobilityAidOptions() {
      return [
        { value: 'Walker', text: this.$t('clinical360.discharge.return_precautions_form.mobility_walker') },
        { value: 'Crutches', text: this.$t('clinical360.discharge.return_precautions_form.mobility_crutches') },
        { value: 'Cane', text: this.$t('clinical360.discharge.return_precautions_form.mobility_cane') },
        { value: 'Wheelchair', text: this.$t('clinical360.discharge.return_precautions_form.mobility_wheelchair') },
        { value: 'None', text: this.$t('clinical360.discharge.return_precautions_form.mobility_none') }
      ]
    },
    dietTypeOptions() {
      return [
        { value: 'Regular', text: this.$t('clinical360.discharge.return_precautions_form.diet_type_regular') },
        { value: 'Low sodium', text: this.$t('clinical360.discharge.return_precautions_form.diet_type_low_sodium') },
        { value: 'Diabetic', text: this.$t('clinical360.discharge.return_precautions_form.diet_type_diabetic') },
        { value: 'High protein', text: this.$t('clinical360.discharge.return_precautions_form.diet_type_high_protein') },
        { value: 'Soft/pureed', text: this.$t('clinical360.discharge.return_precautions_form.diet_type_soft_pureed') },
        { value: 'Clear liquids', text: this.$t('clinical360.discharge.return_precautions_form.diet_type_clear_liquids') },
        { value: 'NPO', text: this.$t('clinical360.discharge.return_precautions_form.diet_type_npo') },
        { value: 'Tube feeding', text: this.$t('clinical360.discharge.return_precautions_form.diet_type_tube_feeding') }
      ]
    }
  },
  methods: {
    ...mapActions('discharge', ['createReturnPrecautions']),
    toggleDevice(device) {
      // Toggle device subchecks visibility
    },
    async submitForm() {
      try {
        await this.createReturnPrecautions({
          patientId: this.patientId,
          encounterId: this.encounterId,
          ...this.form,
          createdAt: new Date().toISOString()
        })
        this.$emit('save', this.form)
      } catch (error) {
        alert(this.$t('clinical360.discharge.return_precautions_form.error_save_failed'))
      }
    }
  }
}
</script>

<style scoped>
.return-precautions-form { width: 100%; }
.form-header { background: linear-gradient(90deg, #ea580c 0%, #c2410c 100%); color: white !important; padding: 16px; display: flex; align-items: center; gap: 12px; }
.close-btn { border: none; background: transparent; cursor: pointer; color: white; padding: 4px; }
.form-body { padding: 24px; max-height: calc(100vh - 200px); overflow-y: auto; }
.form-section { margin-bottom: 24px; }
.section-title { color: #0f172a; font-size: 13px; font-weight: 900; margin: 0 0 14px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { color: #334155; font-size: 12px; font-weight: 700; }
.critical-alerts, .precaution-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 8px; }
.alert-item, .precaution-item { display: flex; align-items: flex-start; gap: 8px; padding: 8px; }
.alert-text { color: #7f1d1d; font-weight: 600; }
.device-precautions { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; }
.device-item { padding: 12px; border: 1px solid #e2e8f0; border-radius: 4px; background: #f8fafc; }
.device-item h4 { margin: 0 0 8px; color: #0f172a; font-size: 12px; font-weight: 700; }
.device-details { margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0; }
.checklist { display: flex; flex-direction: column; gap: 8px; }
.form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
</style>
