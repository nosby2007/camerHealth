<template>
  <div class="head-to-toe-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-human</v-icon>
        <span>Head-to-Toe Assessment</span>
        <v-spacer />
        <button type="button" class="close-btn" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </button>
      </v-card-title>

      <v-divider />

      <v-card-text class="form-body">
        <form @submit.prevent="submitForm">
          <!-- HEAD & NEURO -->
          <section class="form-section">
            <h3 class="section-title">👁️ Head & Neurological</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Eyes</label>
                <v-text-field v-model="form.eyes" placeholder="PERRL, any drainage, conjunctivitis..." outlined dense />
              </div>
              <div class="form-group">
                <label>Ears/Nose</label>
                <v-text-field v-model="form.ears" placeholder="Cerumen, drainage, septum deviation..." outlined dense />
              </div>
              <div class="form-group">
                <label>Mouth/Teeth</label>
                <v-text-field v-model="form.mouth" placeholder="Dentition, oral hygiene, ulcers..." outlined dense />
              </div>
              <div class="form-group">
                <label>GCS Score</label>
                <v-text-field v-model="form.gcs" type="number" min="3" max="15" outlined dense />
              </div>
              <div class="form-group">
                <label>Speech</label>
                <v-select v-model="form.speech" :items="['Clear', 'Slurred', 'Aphasia', 'Dysarthria']" outlined dense />
              </div>
              <div class="form-group">
                <label>Mental Status</label>
                <v-select v-model="form.mentalStatus" :items="['Alert', 'Oriented x3', 'Confused', 'Lethargic', 'Unresponsive']" outlined dense />
              </div>
            </div>
          </section>

          <!-- NECK & LYMPH -->
          <section class="form-section">
            <h3 class="section-title">🔗 Neck & Lymph Nodes</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Neck ROM</label>
                <v-select v-model="form.neckRom" :items="['Full', 'Limited', 'Stiff', 'Pain with movement']" outlined dense />
              </div>
              <div class="form-group">
                <label>Lymph Nodes</label>
                <v-text-field v-model="form.lymphNodes" placeholder="Size, location, tender/fixed..." outlined dense />
              </div>
              <div class="form-group">
                <label>JVD/Carotid</label>
                <v-text-field v-model="form.jvd" placeholder="No JVD, carotid bruits..." outlined dense />
              </div>
            </div>
          </section>

          <!-- CHEST & LUNGS -->
          <section class="form-section">
            <h3 class="section-title">💨 Chest & Respiratory</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Breath Sounds</label>
                <v-select v-model="form.breathSounds" :items="['Clear bilaterally', 'Wheezes', 'Crackles', 'Diminished', 'Absent']" outlined dense />
              </div>
              <div class="form-group">
                <label>Work of Breathing</label>
                <v-select v-model="form.wob" :items="['Easy', 'Labored', 'With retractions', 'Pursed-lip breathing']" outlined dense />
              </div>
              <div class="form-group">
                <label>Chest Wall</label>
                <v-text-field v-model="form.chestWall" placeholder="Symmetric, no scars, lesions..." outlined dense />
              </div>
            </div>
          </section>

          <!-- CARDIAC -->
          <section class="form-section">
            <h3 class="section-title">❤️ Cardiac</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Heart Sounds</label>
                <v-select v-model="form.heartSounds" :items="['RRR', 'S3', 'S4', 'Murmur', 'Irregular']" outlined dense />
              </div>
              <div class="form-group">
                <label>Murmurs/Rubs</label>
                <v-text-field v-model="form.murmurs" placeholder="Location, timing, grade..." outlined dense />
              </div>
              <div class="form-group">
                <label>Edema</label>
                <v-select v-model="form.edema" :items="['None', '1+', '2+', '3+', '4+']" outlined dense />
              </div>
              <div class="form-group">
                <label>Pulses</label>
                <v-text-field v-model="form.pulses" placeholder="2+ bilateral, equal, no bruits..." outlined dense />
              </div>
            </div>
          </section>

          <!-- ABDOMEN -->
          <section class="form-section">
            <h3 class="section-title">🫀 Abdomen</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Shape/Appearance</label>
                <v-select v-model="form.abdomenShape" :items="['Flat', 'Rounded', 'Distended', 'Obese', 'Scaphoid']" outlined dense />
              </div>
              <div class="form-group">
                <label>Bowel Sounds</label>
                <v-select v-model="form.bowelSounds" :items="['Active all quadrants', 'Hypoactive', 'Hyperactive', 'Absent']" outlined dense />
              </div>
              <div class="form-group">
                <label>Tenderness</label>
                <v-text-field v-model="form.tenderness" placeholder="Location, severity, guarding..." outlined dense />
              </div>
              <div class="form-group">
                <label>Organomegaly</label>
                <v-text-field v-model="form.organomegaly" placeholder="None palpable, liver border, etc..." outlined dense />
              </div>
            </div>
          </section>

          <!-- EXTREMITIES -->
          <section class="form-section">
            <h3 class="section-title">🦵 Extremities</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Upper Extremities</label>
                <v-text-field v-model="form.upperExtremities" placeholder="Strength 5/5, no tremor, warm..." outlined dense />
              </div>
              <div class="form-group">
                <label>Lower Extremities</label>
                <v-text-field v-model="form.lowerExtremities" placeholder="ROM intact, no calf tenderness..." outlined dense />
              </div>
              <div class="form-group">
                <label>Skin</label>
                <v-text-field v-model="form.skin" placeholder="Color, turgor, lesions, bruises..." outlined dense />
              </div>
              <div class="form-group">
                <label>Nails</label>
                <v-text-field v-model="form.nails" placeholder="Color, capillary refill, clubbing..." outlined dense />
              </div>
            </div>
          </section>

          <!-- NEURO CHECKS -->
          <section class="form-section">
            <h3 class="section-title">🧠 Neurological Findings</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Motor Strength (4 extremities)</label>
                <v-text-field v-model="form.motorStrength" placeholder="5/5 throughout, no drift..." outlined dense />
              </div>
              <div class="form-group">
                <label>Sensory</label>
                <v-select v-model="form.sensory" :items="['Intact', 'Decreased', 'Absent', 'Hyperesthesia']" outlined dense />
              </div>
              <div class="form-group">
                <label>Reflexes</label>
                <v-text-field v-model="form.reflexes" placeholder="2+ throughout, no Babinski..." outlined dense />
              </div>
              <div class="form-group">
                <label>Coordination</label>
                <v-select v-model="form.coordination" :items="['Normal', 'Ataxia', 'Tremor', 'Dysmetria']" outlined dense />
              </div>
            </div>
          </section>

          <!-- SUMMARY -->
          <section class="form-section">
            <h3 class="section-title">Summary & Abnormal Findings</h3>
            <div class="form-group">
              <label>Abnormal Findings</label>
              <v-textarea
                v-model="form.abnormalFindings"
                placeholder="List any abnormal findings for follow-up..."
                outlined dense rows="4"
              />
            </div>
            <div class="form-group">
              <label>Clinical Impression</label>
              <v-textarea
                v-model="form.clinicalImpression"
                placeholder="Overall assessment and plan..."
                outlined dense rows="4"
              />
            </div>
          </section>

          <div class="form-actions">
            <v-btn type="button" outlined @click="$emit('close')">Cancel</v-btn>
            <v-btn type="submit" color="primary" dark>Save Assessment</v-btn>
          </div>
        </form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'HeadToToeAssessmentForm',
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true }
  },
  data() {
    return {
      form: {
        eyes: '', ears: '', mouth: '', gcs: '', speech: '', mentalStatus: '',
        neckRom: '', lymphNodes: '', jvd: '',
        breathSounds: '', wob: '', chestWall: '',
        heartSounds: '', murmurs: '', edema: '', pulses: '',
        abdomenShape: '', bowelSounds: '', tenderness: '', organomegaly: '',
        upperExtremities: '', lowerExtremities: '', skin: '', nails: '',
        motorStrength: '', sensory: '', reflexes: '', coordination: '',
        abnormalFindings: '', clinicalImpression: ''
      }
    }
  },
  methods: {
    ...mapActions('flowsheets', ['createFlowsheetEntry']),
    async submitForm() {
      try {
        await this.createFlowsheetEntry({
          patientId: this.patientId,
          encounterId: this.encounterId,
          templateId: 'assessment',
          sectionId: 'head-to-toe-1',
          entries: this.form,
          recordedAt: new Date().toISOString()
        })
        this.$emit('save', this.form)
      } catch (error) {
        alert('Error saving assessment')
      }
    }
  }
}
</script>

<style scoped>
.head-to-toe-form { width: 100%; }

.form-header {
  background: linear-gradient(90deg, #0f3f3b 0%, #134e4a 100%);
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

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}
</style>
