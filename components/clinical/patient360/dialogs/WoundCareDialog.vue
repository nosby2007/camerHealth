<template>
  <v-dialog :value="open" max-width="900" persistent scrollable @input="$emit('close')">
    <v-card class="wound-dialog">
      <v-card-title class="dialog-title">
        <div>
          <span>Wound documentation</span>
          <strong>Wound Care Note</strong>
        </div>
        <v-btn icon small @click="$emit('close')"><v-icon small>mdi-close</v-icon></v-btn>
      </v-card-title>
      <v-card-text>
        <section v-if="!selectedWoundId && mode !== 'new'" class="wound-picker">
          <p class="section-label">Select a wound to reassess, or document a new one</p>
          <div v-if="patientWounds.length" class="wound-grid">
            <WoundCard
              v-for="wound in patientWounds"
              :key="wound.id"
              :wound="wound"
              :assessments="assessmentsFor(wound.id)"
              @open="selectWound(wound)"
            />
          </div>
          <div v-else class="empty-wounds">
            <v-icon size="40" color="#94a3b8">mdi-bandage</v-icon>
            <span>No wounds documented yet for this patient.</span>
          </div>
          <v-btn depressed color="#0f766e" dark class="font-weight-black mt-3" @click="mode = 'new'">
            <v-icon small left>mdi-plus</v-icon>Document a new wound
          </v-btn>
        </section>

        <section v-else>
          <button type="button" class="back-link" @click="reset">
            <v-icon x-small>mdi-arrow-left</v-icon> Choose a different wound
          </button>

          <div v-if="mode === 'new'" class="new-wound-fields">
            <p class="section-label">New wound</p>
            <div class="dialog-grid three">
              <v-text-field v-model="newWound.woundType" label="Wound type" dense outlined :rules="[requiredRule]" />
              <v-text-field v-model="newWound.anatomicalLocation" label="Anatomical location" dense outlined :rules="[requiredRule]" />
              <v-select v-model="newWound.acquiredLocation" :items="acquiredLocationOptions" label="Acquired location" dense outlined />
            </div>
          </div>
          <div v-else class="existing-wound-summary">
            <strong>{{ selectedWound.woundType }}</strong>
            <span>{{ selectedWound.anatomicalLocation }}</span>
          </div>

          <p class="section-label">Assessment</p>
          <div class="dialog-grid three">
            <v-text-field v-model.number="assessment.lengthCm" type="number" label="Length (cm)" dense outlined />
            <v-text-field v-model.number="assessment.widthCm" type="number" label="Width (cm)" dense outlined />
            <v-text-field v-model.number="assessment.depthCm" type="number" label="Depth (cm)" dense outlined />
          </div>
          <div class="calculated-metrics">
            <span>Surface area <strong>{{ surfaceArea }} cm²</strong></span>
            <span>Volume <strong>{{ volume !== null ? volume + ' cm³' : '-' }}</strong></span>
          </div>
          <div class="dialog-grid three mt-3">
            <v-select v-model="assessment.drainageAmount" :items="['none', 'scant', 'small', 'moderate', 'large']" label="Drainage" dense outlined />
            <v-text-field v-model="assessment.dressingType" label="Dressing" dense outlined />
            <v-text-field v-model.number="assessment.painScore" type="number" min="0" max="10" label="Pain /10" dense outlined />
          </div>
          <v-textarea v-model="assessment.treatmentPlan" label="Treatment plan" rows="3" dense outlined />
        </section>
      </v-card-text>
      <v-card-actions v-if="selectedWoundId || mode === 'new'" class="dialog-actions">
        <span v-if="lastWarning" class="warning-flag"><v-icon x-small color="#be123c">mdi-alert</v-icon>Surface increased since prior measurement</span>
        <v-spacer />
        <v-btn text small @click="$emit('close')">Cancel</v-btn>
        <v-btn depressed color="#0f766e" dark small :loading="saving" @click="save">
          <v-icon x-small left>mdi-content-save</v-icon>Save assessment
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
const { calculateWoundSurfaceArea, calculateWoundVolume } = require('~/util/nursing-workflow.cjs')
import WoundCard from '~/components/nursing/WoundCard.vue'

function defaultAssessment() {
  return { lengthCm: null, widthCm: null, depthCm: null, drainageAmount: 'none', dressingType: '', treatmentPlan: '', painScore: 0 }
}

export default {
  name: 'WoundCareDialog',
  components: { WoundCard },
  props: {
    open: { type: Boolean, default: false },
    patientId: { type: String, required: true },
    authorRole: { type: String, default: '' }
  },
  data() {
    return {
      mode: 'pick',
      selectedWoundId: '',
      newWound: { woundType: '', anatomicalLocation: '', acquiredLocation: 'unknown' },
      assessment: defaultAssessment(),
      saving: false,
      lastWarning: false,
      acquiredLocationOptions: ['present_on_admission', 'facility_acquired', 'community_acquired', 'unknown'],
      requiredRule: value => Boolean(value) || 'Required'
    }
  },
  computed: {
    patientWounds() {
      return (this.$store.getters['nursing/getWounds'] || []).filter(item => item.patientId === this.patientId)
    },
    selectedWound() {
      return this.patientWounds.find(item => item.id === this.selectedWoundId) || {}
    },
    surfaceArea() {
      return calculateWoundSurfaceArea(this.assessment.lengthCm, this.assessment.widthCm)
    },
    volume() {
      return calculateWoundVolume(this.assessment.lengthCm, this.assessment.widthCm, this.assessment.depthCm)
    }
  },
  watch: {
    open(value) {
      if (value) this.reset()
    },
    patientId() {
      this.reset()
      this.$emit('close')
    }
  },
  methods: {
    assessmentsFor(woundId) {
      return this.$store.getters['nursing/woundTrend'](woundId) || []
    },
    selectWound(wound) {
      this.mode = 'existing'
      this.selectedWoundId = wound.id
      this.assessment = defaultAssessment()
    },
    reset() {
      this.mode = 'pick'
      this.selectedWoundId = ''
      this.newWound = { woundType: '', anatomicalLocation: '', acquiredLocation: 'unknown' }
      this.assessment = defaultAssessment()
      this.lastWarning = false
    },
    async save() {
      this.saving = true
      try {
        let woundId = this.selectedWoundId
        let woundLabel = this.selectedWound.woundType
        if (this.mode === 'new') {
          const wound = await this.$store.dispatch('nursing/createWound', { ...this.newWound, patientId: this.patientId })
          woundId = wound.id
          woundLabel = wound.woundType
        }
        const record = await this.$store.dispatch('nursing/createWoundAssessment', {
          ...this.assessment,
          woundId,
          patientId: this.patientId
        })
        this.lastWarning = Boolean(record && record.warningAreaIncreased)
        const summary = `Wound: ${woundLabel || 'Unspecified'}. Surface area ${record.surfaceArea} cm², ` +
          `${record.volume !== null ? 'volume ' + record.volume + ' cm³, ' : ''}` +
          `drainage ${this.assessment.drainageAmount}, dressing ${this.assessment.dressingType || 'not specified'}. ` +
          `${this.assessment.treatmentPlan || ''}`
        await this.$store.dispatch('nursing/createClinicalNote', {
          patientId: this.patientId,
          noteType: 'wound_note',
          title: `Wound care note - ${woundLabel || 'wound'}`,
          body: summary.trim(),
          authorRole: this.authorRole
        })
        this.$emit('saved', record)
        if (!this.lastWarning) this.$emit('close')
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.wound-dialog {
  background: #fff;
}
.dialog-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background: #0f766e;
  color: #fff;
  padding: 14px 18px;
}
.dialog-title span {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  opacity: 0.85;
}
.dialog-title strong {
  display: block;
  font-size: 16px;
}
.section-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  color: #134e4a;
  margin: 12px 0 6px;
}
.wound-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
}
.empty-wounds {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 30px 0;
  color: #94a3b8;
}
.back-link {
  border: 0;
  background: transparent;
  color: #0f766e;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 0 8px;
}
.existing-wound-summary {
  background: #f0fdfa;
  border: 1px solid #99f6e4;
  padding: 8px 12px;
  margin-bottom: 8px;
}
.existing-wound-summary strong {
  display: block;
  color: #134e4a;
}
.dialog-grid {
  display: grid;
  gap: 12px;
}
.dialog-grid.three {
  grid-template-columns: repeat(3, 1fr);
}
.calculated-metrics {
  display: flex;
  gap: 20px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 8px 12px;
  margin: 8px 0;
}
.calculated-metrics strong {
  margin-left: 6px;
  color: #0f172a;
}
.dialog-actions {
  padding: 10px 18px;
}
.warning-flag {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #be123c;
  font-weight: 800;
  font-size: 12px;
}
</style>
