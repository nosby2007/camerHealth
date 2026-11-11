<template>
  <div class="head-to-toe-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-human</v-icon>
        <span>{{ $t('clinical360.flowsheets.forms.head_to_toe.title') }}</span>
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
            <h3 class="section-title">👁️ {{ $t('clinical360.flowsheets.forms.head_to_toe.section_head_neuro') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_eyes') }}</label>
                <v-text-field v-model="form.eyes" :placeholder="$t('clinical360.flowsheets.forms.head_to_toe.placeholder_eyes')" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_ears') }}</label>
                <v-text-field v-model="form.ears" :placeholder="$t('clinical360.flowsheets.forms.head_to_toe.placeholder_ears')" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_mouth') }}</label>
                <v-text-field v-model="form.mouth" :placeholder="$t('clinical360.flowsheets.forms.head_to_toe.placeholder_mouth')" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_gcs') }}</label>
                <v-text-field v-model="form.gcs" type="number" min="3" max="15" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_speech') }}</label>
                <v-select v-model="form.speech" :items="speechOptions" item-value="value" item-text="text" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_mental_status') }}</label>
                <v-select v-model="form.mentalStatus" :items="mentalStatusOptions" item-value="value" item-text="text" outlined dense />
              </div>
            </div>
          </section>

          <!-- NECK & LYMPH -->
          <section class="form-section">
            <h3 class="section-title">🔗 {{ $t('clinical360.flowsheets.forms.head_to_toe.section_neck_lymph') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_neck_rom') }}</label>
                <v-select v-model="form.neckRom" :items="neckRomOptions" item-value="value" item-text="text" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_lymph_nodes') }}</label>
                <v-text-field v-model="form.lymphNodes" :placeholder="$t('clinical360.flowsheets.forms.head_to_toe.placeholder_lymph_nodes')" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_jvd') }}</label>
                <v-text-field v-model="form.jvd" :placeholder="$t('clinical360.flowsheets.forms.head_to_toe.placeholder_jvd')" outlined dense />
              </div>
            </div>
          </section>

          <!-- CHEST & LUNGS -->
          <section class="form-section">
            <h3 class="section-title">💨 {{ $t('clinical360.flowsheets.forms.head_to_toe.section_chest_respiratory') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_breath_sounds') }}</label>
                <v-select v-model="form.breathSounds" :items="breathSoundsOptions" item-value="value" item-text="text" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_wob') }}</label>
                <v-select v-model="form.wob" :items="wobOptions" item-value="value" item-text="text" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_chest_wall') }}</label>
                <v-text-field v-model="form.chestWall" :placeholder="$t('clinical360.flowsheets.forms.head_to_toe.placeholder_chest_wall')" outlined dense />
              </div>
            </div>
          </section>

          <!-- CARDIAC -->
          <section class="form-section">
            <h3 class="section-title">❤️ {{ $t('clinical360.flowsheets.forms.head_to_toe.section_cardiac') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_heart_sounds') }}</label>
                <v-select v-model="form.heartSounds" :items="heartSoundsOptions" item-value="value" item-text="text" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_murmurs') }}</label>
                <v-text-field v-model="form.murmurs" :placeholder="$t('clinical360.flowsheets.forms.head_to_toe.placeholder_murmurs')" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_edema') }}</label>
                <v-select v-model="form.edema" :items="edemaOptions" item-value="value" item-text="text" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_pulses') }}</label>
                <v-text-field v-model="form.pulses" :placeholder="$t('clinical360.flowsheets.forms.head_to_toe.placeholder_pulses')" outlined dense />
              </div>
            </div>
          </section>

          <!-- ABDOMEN -->
          <section class="form-section">
            <h3 class="section-title">🫀 {{ $t('clinical360.flowsheets.forms.head_to_toe.section_abdomen') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_abdomen_shape') }}</label>
                <v-select v-model="form.abdomenShape" :items="abdomenShapeOptions" item-value="value" item-text="text" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_bowel_sounds') }}</label>
                <v-select v-model="form.bowelSounds" :items="bowelSoundsOptions" item-value="value" item-text="text" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_tenderness') }}</label>
                <v-text-field v-model="form.tenderness" :placeholder="$t('clinical360.flowsheets.forms.head_to_toe.placeholder_tenderness')" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_organomegaly') }}</label>
                <v-text-field v-model="form.organomegaly" :placeholder="$t('clinical360.flowsheets.forms.head_to_toe.placeholder_organomegaly')" outlined dense />
              </div>
            </div>
          </section>

          <!-- EXTREMITIES -->
          <section class="form-section">
            <h3 class="section-title">🦵 {{ $t('clinical360.flowsheets.forms.head_to_toe.section_extremities') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_upper_extremities') }}</label>
                <v-text-field v-model="form.upperExtremities" :placeholder="$t('clinical360.flowsheets.forms.head_to_toe.placeholder_upper_extremities')" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_lower_extremities') }}</label>
                <v-text-field v-model="form.lowerExtremities" :placeholder="$t('clinical360.flowsheets.forms.head_to_toe.placeholder_lower_extremities')" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_skin') }}</label>
                <v-text-field v-model="form.skin" :placeholder="$t('clinical360.flowsheets.forms.head_to_toe.placeholder_skin')" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_nails') }}</label>
                <v-text-field v-model="form.nails" :placeholder="$t('clinical360.flowsheets.forms.head_to_toe.placeholder_nails')" outlined dense />
              </div>
            </div>
          </section>

          <!-- NEURO CHECKS -->
          <section class="form-section">
            <h3 class="section-title">🧠 {{ $t('clinical360.flowsheets.forms.head_to_toe.section_neuro_findings') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_motor_strength') }}</label>
                <v-text-field v-model="form.motorStrength" :placeholder="$t('clinical360.flowsheets.forms.head_to_toe.placeholder_motor_strength')" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_sensory') }}</label>
                <v-select v-model="form.sensory" :items="sensoryOptions" item-value="value" item-text="text" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_reflexes') }}</label>
                <v-text-field v-model="form.reflexes" :placeholder="$t('clinical360.flowsheets.forms.head_to_toe.placeholder_reflexes')" outlined dense />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_coordination') }}</label>
                <v-select v-model="form.coordination" :items="coordinationOptions" item-value="value" item-text="text" outlined dense />
              </div>
            </div>
          </section>

          <!-- SUMMARY -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.flowsheets.forms.head_to_toe.section_summary') }}</h3>
            <div class="form-group">
              <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_abnormal_findings') }}</label>
              <v-textarea
                v-model="form.abnormalFindings"
                :placeholder="$t('clinical360.flowsheets.forms.head_to_toe.placeholder_abnormal_findings')"
                outlined dense rows="4"
              />
            </div>
            <div class="form-group">
              <label>{{ $t('clinical360.flowsheets.forms.head_to_toe.label_clinical_impression') }}</label>
              <v-textarea
                v-model="form.clinicalImpression"
                :placeholder="$t('clinical360.flowsheets.forms.head_to_toe.placeholder_clinical_impression')"
                outlined dense rows="4"
              />
            </div>
          </section>

          <div class="form-actions">
            <v-btn type="button" outlined @click="$emit('close')">{{ $t('clinical360.flowsheets.forms.head_to_toe.cancel') }}</v-btn>
            <v-btn type="submit" color="primary" dark>{{ $t('clinical360.flowsheets.forms.head_to_toe.save') }}</v-btn>
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
  computed: {
    speechOptions() {
      return [['clear', 'Clear'], ['slurred', 'Slurred'], ['aphasia', 'Aphasia'], ['dysarthria', 'Dysarthria']].map(([k, value]) =>
        ({ value, text: this.$t(`clinical360.flowsheets.forms.head_to_toe.options.speech.${k}`) }))
    },
    mentalStatusOptions() {
      return [['alert', 'Alert'], ['oriented_x3', 'Oriented x3'], ['confused', 'Confused'], ['lethargic', 'Lethargic'], ['unresponsive', 'Unresponsive']].map(([k, value]) =>
        ({ value, text: this.$t(`clinical360.flowsheets.forms.head_to_toe.options.mental_status.${k}`) }))
    },
    neckRomOptions() {
      return [['full', 'Full'], ['limited', 'Limited'], ['stiff', 'Stiff'], ['pain_with_movement', 'Pain with movement']].map(([k, value]) =>
        ({ value, text: this.$t(`clinical360.flowsheets.forms.head_to_toe.options.neck_rom.${k}`) }))
    },
    breathSoundsOptions() {
      return [['clear_bilaterally', 'Clear bilaterally'], ['wheezes', 'Wheezes'], ['crackles', 'Crackles'], ['diminished', 'Diminished'], ['absent', 'Absent']].map(([k, value]) =>
        ({ value, text: this.$t(`clinical360.flowsheets.forms.head_to_toe.options.breath_sounds.${k}`) }))
    },
    wobOptions() {
      return [['easy', 'Easy'], ['labored', 'Labored'], ['with_retractions', 'With retractions'], ['pursed_lip_breathing', 'Pursed-lip breathing']].map(([k, value]) =>
        ({ value, text: this.$t(`clinical360.flowsheets.forms.head_to_toe.options.wob.${k}`) }))
    },
    heartSoundsOptions() {
      return [['rrr', 'RRR'], ['s3', 'S3'], ['s4', 'S4'], ['murmur', 'Murmur'], ['irregular', 'Irregular']].map(([k, value]) =>
        ({ value, text: this.$t(`clinical360.flowsheets.forms.head_to_toe.options.heart_sounds.${k}`) }))
    },
    edemaOptions() {
      return [
        { value: 'None', text: this.$t('clinical360.flowsheets.forms.head_to_toe.options.edema.none') },
        { value: '1+', text: '1+' },
        { value: '2+', text: '2+' },
        { value: '3+', text: '3+' },
        { value: '4+', text: '4+' }
      ]
    },
    abdomenShapeOptions() {
      return [['flat', 'Flat'], ['rounded', 'Rounded'], ['distended', 'Distended'], ['obese', 'Obese'], ['scaphoid', 'Scaphoid']].map(([k, value]) =>
        ({ value, text: this.$t(`clinical360.flowsheets.forms.head_to_toe.options.abdomen_shape.${k}`) }))
    },
    bowelSoundsOptions() {
      return [['active_all_quadrants', 'Active all quadrants'], ['hypoactive', 'Hypoactive'], ['hyperactive', 'Hyperactive'], ['absent', 'Absent']].map(([k, value]) =>
        ({ value, text: this.$t(`clinical360.flowsheets.forms.head_to_toe.options.bowel_sounds.${k}`) }))
    },
    sensoryOptions() {
      return [['intact', 'Intact'], ['decreased', 'Decreased'], ['absent', 'Absent'], ['hyperesthesia', 'Hyperesthesia']].map(([k, value]) =>
        ({ value, text: this.$t(`clinical360.flowsheets.forms.head_to_toe.options.sensory.${k}`) }))
    },
    coordinationOptions() {
      return [['normal', 'Normal'], ['ataxia', 'Ataxia'], ['tremor', 'Tremor'], ['dysmetria', 'Dysmetria']].map(([k, value]) =>
        ({ value, text: this.$t(`clinical360.flowsheets.forms.head_to_toe.options.coordination.${k}`) }))
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
        alert(this.$t('clinical360.flowsheets.forms.head_to_toe.save_error'))
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
