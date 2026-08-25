<template>
  <div class="return-precautions-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-alert-circle-outline</v-icon>
        <span>Return Precautions & Red Flags</span>
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
            <h3 class="section-title">🚨 CRITICAL RED FLAGS - Call 911 or Go to ED Immediately</h3>
            <div class="critical-alerts">
              <div v-for="alert in criticalAlerts" :key="alert" class="alert-item">
                <v-checkbox v-model="form.criticalRedFlags[alert]" />
                <span class="alert-text">{{ alert }}</span>
              </div>
            </div>
            <v-textarea
              v-model="form.otherCriticalAlerts"
              label="Other critical alerts specific to this patient"
              placeholder="List additional red flags..."
              outlined dense rows="2"
            />
          </section>

          <!-- Surgical/Wound Complications -->
          <section class="form-section">
            <h3 class="section-title">🩹 Surgical/Wound Complications</h3>
            <div class="precaution-grid">
              <div v-for="item in woundPrecautions" :key="item" class="precaution-item">
                <v-checkbox v-model="form.woundPrecautions[item]" />
                <span>{{ item }}</span>
              </div>
            </div>
            <v-textarea
              v-model="form.woundPrecautionDetails"
              label="Specific wound care and complication warning signs"
              placeholder="Detailed instructions for wound monitoring..."
              outlined dense rows="3"
            />
          </section>

          <!-- Medication-Related Precautions -->
          <section class="form-section">
            <h3 class="section-title">💊 Medication-Related Precautions</h3>
            <div class="precaution-grid">
              <div v-for="item in medicationPrecautions" :key="item" class="precaution-item">
                <v-checkbox v-model="form.medicationPrecautions[item]" />
                <span>{{ item }}</span>
              </div>
            </div>
            <v-textarea
              v-model="form.medicationPrecautionDetails"
              label="Specific medication warnings and interactions"
              placeholder="Important medication safety information..."
              outlined dense rows="3"
            />
          </section>

          <!-- Activity/Mobility Precautions -->
          <section class="form-section">
            <h3 class="section-title">🚶 Activity & Mobility Precautions</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Weight Bearing Status *</label>
                <v-select
                  v-model="form.weightBearingStatus"
                  :items="['Full weight bearing', 'Partial weight bearing', 'Non-weight bearing', 'No restrictions']"
                  outlined dense required
                />
              </div>
              <div class="form-group">
                <label>Mobility Aids Needed</label>
                <v-combobox
                  v-model="form.mobilityAids"
                  :items="['Walker', 'Crutches', 'Cane', 'Wheelchair', 'None']"
                  multiple outlined dense chips
                />
              </div>
            </div>
            <div class="precaution-grid">
              <div v-for="item in activityPrecautions" :key="item" class="precaution-item">
                <v-checkbox v-model="form.activityPrecautions[item]" />
                <span>{{ item }}</span>
              </div>
            </div>
          </section>

          <!-- Infection Control Precautions -->
          <section class="form-section">
            <h3 class="section-title">🛡️ Infection Control Precautions</h3>
            <div class="precaution-grid">
              <div v-for="item in infectionPrecautions" :key="item" class="precaution-item">
                <v-checkbox v-model="form.infectionPrecautions[item]" />
                <span>{{ item }}</span>
              </div>
            </div>
            <v-textarea
              v-model="form.infectionPrecautionDetails"
              label="Specific infection control measures"
              placeholder="Hand hygiene, isolation precautions, exposure prevention..."
              outlined dense rows="3"
            />
          </section>

          <!-- Diet Precautions -->
          <section class="form-section">
            <h3 class="section-title">🍽️ Diet & Nutrition Precautions</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Diet Type *</label>
                <v-select
                  v-model="form.dietType"
                  :items="['Regular', 'Low sodium', 'Diabetic', 'High protein', 'Soft/pureed', 'Clear liquids', 'NPO', 'Tube feeding']"
                  outlined dense required
                />
              </div>
              <div class="form-group">
                <label>Fluid Restrictions</label>
                <v-text-field
                  v-model="form.fluidRestriction"
                  placeholder="e.g., 1200 mL/day"
                  outlined dense
                />
              </div>
            </div>
            <div class="precaution-grid">
              <div v-for="item in dietPrecautions" :key="item" class="precaution-item">
                <v-checkbox v-model="form.dietPrecautions[item]" />
                <span>{{ item }}</span>
              </div>
            </div>
          </section>

          <!-- Device-Specific Precautions -->
          <section class="form-section">
            <h3 class="section-title">⚙️ Device-Specific Precautions</h3>
            <div class="device-precautions">
              <div class="device-item">
                <h4>{{ form.devices.hasIV ? '✓' : '○' }} IV Line / Central Line</h4>
                <v-checkbox v-model="form.devices.hasIV" @change="toggleDevice('hasIV')" />
                <div v-if="form.devices.hasIV" class="device-details">
                  <v-text-field v-model="form.devices.ivPrecautions" placeholder="Care and precautions..." outlined dense />
                </div>
              </div>

              <div class="device-item">
                <h4>{{ form.devices.hasCatheter ? '✓' : '○' }} Foley Catheter</h4>
                <v-checkbox v-model="form.devices.hasCatheter" @change="toggleDevice('hasCatheter')" />
                <div v-if="form.devices.hasCatheter" class="device-details">
                  <v-text-field v-model="form.devices.catheterPrecautions" placeholder="Care and precautions..." outlined dense />
                </div>
              </div>

              <div class="device-item">
                <h4>{{ form.devices.hasDrain ? '✓' : '○' }} Drain</h4>
                <v-checkbox v-model="form.devices.hasDrain" @change="toggleDevice('hasDrain')" />
                <div v-if="form.devices.hasDrain" class="device-details">
                  <v-text-field v-model="form.devices.drainPrecautions" placeholder="Output monitoring, care..." outlined dense />
                </div>
              </div>

              <div class="device-item">
                <h4>{{ form.devices.hasTrach ? '✓' : '○' }} Tracheostomy</h4>
                <v-checkbox v-model="form.devices.hasTrach" @change="toggleDevice('hasTrach')" />
                <div v-if="form.devices.hasTrach" class="device-details">
                  <v-text-field v-model="form.devices.trachPrecautions" placeholder="Suctioning, care..." outlined dense />
                </div>
              </div>

              <div class="device-item">
                <h4>{{ form.devices.hasOstomy ? '✓' : '○' }} Ostomy</h4>
                <v-checkbox v-model="form.devices.hasOstomy" @change="toggleDevice('hasOstomy')" />
                <div v-if="form.devices.hasOstomy" class="device-details">
                  <v-text-field v-model="form.devices.ostomyPrecautions" placeholder="Appliance change, skin care..." outlined dense />
                </div>
              </div>
            </div>
          </section>

          <!-- Environmental/Home Safety -->
          <section class="form-section">
            <h3 class="section-title">🏠 Environmental & Home Safety</h3>
            <div class="precaution-grid">
              <div v-for="item in homeSafetyPrecautions" :key="item" class="precaution-item">
                <v-checkbox v-model="form.homeSafetyPrecautions[item]" />
                <span>{{ item }}</span>
              </div>
            </div>
          </section>

          <!-- When to Contact Provider -->
          <section class="form-section">
            <h3 class="section-title">📞 When to Contact Your Provider</h3>
            <v-textarea
              v-model="form.contactProviderCriteria"
              label="Symptoms/situations requiring provider contact (not ED)"
              placeholder="Define parameters for calling office, nurse line, on-call..."
              outlined dense rows="4"
            />
          </section>

          <!-- Patient/Family Education -->
          <section class="form-section">
            <h3 class="section-title">✅ Patient/Family Education Completed</h3>
            <div class="checklist">
              <v-checkbox v-model="form.education.precautionsReviewed" label="Red flags and precautions reviewed verbally" />
              <v-checkbox v-model="form.education.writtenMaterialProvided" label="Written precautions provided" />
              <v-checkbox v-model="form.education.emergentnumbers" label="Emergency numbers provided (911, ED, hotline)" />
              <v-checkbox v-model="form.education.returnDemonstration" label="Return demonstration/teach-back completed" />
              <v-checkbox v-model="form.education.familyPresent" label="Family member present during education" />
            </div>
          </section>

          <div class="form-actions">
            <v-btn type="button" outlined @click="$emit('close')">Cancel</v-btn>
            <v-btn type="submit" color="primary" dark>Save Precautions</v-btn>
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
      },
      criticalAlerts: [
        'Severe chest pain or shortness of breath',
        'Loss of consciousness or severe confusion',
        'Uncontrolled bleeding or blood clot',
        'Severe allergic reaction',
        'High fever (>103°F / >39.4°C)',
        'Severe abdominal pain',
        'Signs of sepsis (fever, chills, confusion)'
      ],
      woundPrecautions: ['Watch for increased redness or warmth', 'Monitor for pus or foul odor', 'Report increasing pain', 'Keep wound dry', 'Report incision opening', 'Watch for unusual drainage'],
      medicationPrecautions: ['Take as prescribed', 'Do not skip doses', 'Watch for allergies', 'Monitor side effects', 'Avoid OTC drugs', 'Track refills'],
      activityPrecautions: ['No strenuous activity', 'Avoid heavy lifting', 'Use assistive device', 'Take breaks', 'Sleep with elevation'],
      infectionPrecautions: ['Hand hygiene', 'Keep incision clean', 'Avoid crowds', 'Report fever', 'Monitor signs'],
      dietPrecautions: ['Follow prescribed diet', 'Avoid triggers', 'Drink fluids', 'Report nausea', 'Eat frequent meals'],
      homeSafetyPrecautions: ['Remove fall hazards', 'Install grab bars', 'Adequate lighting', 'Bed rails', 'Phone accessible', 'Post emergency contacts']
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
        alert('Error saving precautions')
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
