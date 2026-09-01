<template>
  <v-dialog :value="open" max-width="1000" persistent scrollable @input="$emit('close')">
    <v-card class="wound-dialog">
      <v-card-title class="dialog-title">
        <div>
          <span>{{ $t('clinical360.dialogs.wound_care_dialog.eyebrow') }}</span>
          <strong>{{ $t('clinical360.dialogs.wound_care_dialog.title') }}</strong>
        </div>
        <v-btn icon small @click="$emit('close')"><v-icon small>mdi-close</v-icon></v-btn>
      </v-card-title>
      <v-card-text>
        <section v-if="!selectedWoundId && mode !== 'new'" class="wound-picker">
          <p class="section-label">{{ $t('clinical360.dialogs.wound_care_dialog.select_wound') }}</p>
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
            <span>{{ $t('clinical360.dialogs.wound_care_dialog.no_wounds') }}</span>
          </div>
          <v-btn v-if="!readOnly" depressed color="#0f766e" dark class="font-weight-black mt-3" @click="mode = 'new'">
            <v-icon small left>mdi-plus</v-icon>{{ $t('clinical360.dialogs.wound_care_dialog.document_new_wound') }}
          </v-btn>
        </section>

        <section v-else>
          <button type="button" class="back-link" @click="reset">
            <v-icon x-small>mdi-arrow-left</v-icon> {{ $t('clinical360.dialogs.wound_care_dialog.choose_different_wound') }}
          </button>

          <div v-if="mode === 'new'" class="new-wound-fields">
            <p class="section-label">{{ $t('clinical360.dialogs.wound_care_dialog.new_wound') }}</p>
            <div class="dialog-grid three">
              <v-text-field v-model="newWound.woundType" :label="$t('clinical360.dialogs.wound_care_dialog.wound_type')" dense outlined :rules="[requiredRule]" />
              <v-text-field v-model="newWound.anatomicalLocation" :label="$t('clinical360.dialogs.wound_care_dialog.anatomical_location')" dense outlined :rules="[requiredRule]" />
              <v-select v-model="newWound.acquiredLocation" :items="acquiredLocationOptions" :label="$t('clinical360.dialogs.wound_care_dialog.acquired_location')" dense outlined />
            </div>
          </div>
          <div v-else class="existing-wound-summary">
            <strong>{{ selectedWound.woundType }}</strong>
            <span>{{ selectedWound.anatomicalLocation }}</span>
          </div>

          <!-- Assessment Section -->
          <p class="section-label">{{ $t('clinical360.dialogs.wound_care_dialog.assessment') }}</p>
          <div class="dialog-grid three">
            <v-text-field v-model.number="assessment.lengthCm" type="number" :label="$t('clinical360.dialogs.wound_care_dialog.length_cm')" dense outlined />
            <v-text-field v-model.number="assessment.widthCm" type="number" :label="$t('clinical360.dialogs.wound_care_dialog.width_cm')" dense outlined />
            <v-text-field v-model.number="assessment.depthCm" type="number" :label="$t('clinical360.dialogs.wound_care_dialog.depth_cm')" dense outlined />
          </div>
          <div class="dialog-grid three mt-3">
            <v-select v-model="assessment.woundStatus" :items="woundStatusOptions" :label="$t('clinical360.dialogs.wound_care_dialog.wound_status')" dense outlined />
          </div>
          <div class="calculated-metrics">
            <span>{{ $t('clinical360.dialogs.wound_care_dialog.surface_area') }} <strong>{{ surfaceArea }} cm²</strong></span>
            <span>{{ $t('clinical360.dialogs.wound_care_dialog.volume') }} <strong>{{ volume !== null ? volume + ' cm³' : '-' }}</strong></span>
          </div>
          <div class="dialog-grid three mt-3">
            <v-select v-model="assessment.drainageAmount" :items="['none', 'scant', 'small', 'moderate', 'large']" :label="$t('clinical360.dialogs.wound_care_dialog.drainage')" dense outlined />
            <v-text-field v-model="assessment.dressingType" :label="$t('clinical360.dialogs.wound_care_dialog.dressing')" dense outlined />
            <v-text-field v-model.number="assessment.painScore" type="number" min="0" max="10" :label="$t('clinical360.dialogs.wound_care_dialog.pain_10')" dense outlined />
          </div>
          <v-textarea v-model="assessment.treatmentPlan" :label="$t('clinical360.dialogs.wound_care_dialog.treatment_plan')" rows="3" dense outlined />

          <p class="section-label mt-4">{{ $t('clinical360.dialogs.wound_care_dialog.discharge_continuity') }}</p>
          <div class="dialog-grid two">
            <v-text-field v-model="assessment.followUpOwner" :label="$t('clinical360.dialogs.wound_care_dialog.follow_up_owner')" dense outlined />
            <v-text-field v-model="assessment.followUpDate" type="date" :label="$t('clinical360.dialogs.wound_care_dialog.follow_up_date')" dense outlined />
          </div>
          <v-textarea
            v-model="assessment.supplyPlan"
            :label="$t('clinical360.dialogs.wound_care_dialog.supply_plan')"
            rows="2"
            dense
            outlined
          />
          <v-textarea
            v-model="assessment.dischargeInstructions"
            :label="$t('clinical360.dialogs.wound_care_dialog.discharge_instructions')"
            rows="3"
            dense
            outlined
          />

          <!-- Photo Section - NEW -->
          <p class="section-label mt-4">{{ $t('clinical360.dialogs.wound_care_dialog.wound_photos_assessment_id', { id: assessmentId }) }}</p>
          <div class="photo-section">
            <!-- Photo Capture -->
            <div v-if="!readOnly" class="photo-input-area">
              <v-btn
                color="primary"
                dark
                small
                @click="triggerFileInput"
                class="mb-2"
              >
                <v-icon small left>mdi-camera</v-icon>
                {{ $t('clinical360.dialogs.wound_care_dialog.add_photo_camera') }}
              </v-btn>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                capture="environment"
                style="display: none"
                @change="onPhotoSelected"
              />

              <v-btn
                color="info"
                text
                small
                @click="triggerGalleryInput"
                class="mb-2"
              >
                <v-icon small left>mdi-image-multiple</v-icon>
                {{ $t('clinical360.dialogs.wound_care_dialog.select_from_gallery') }}
              </v-btn>
              <input
                ref="galleryInput"
                type="file"
                accept="image/*"
                style="display: none"
                @change="onPhotoSelected"
              />
            </div>

            <!-- Photo Preview -->
            <div v-if="photoPreview" class="photo-preview">
              <img :src="photoPreview" :alt="$t('clinical360.dialogs.wound_care_dialog.photo_preview')" class="preview-image" />
              <div class="preview-actions">
                <v-btn small color="success" dark @click="savePhoto">
                  <v-icon small>mdi-check</v-icon>{{ $t('clinical360.dialogs.wound_care_dialog.save_photo') }}
                </v-btn>
                <v-btn small text @click="clearPhotoPreview">
                  <v-icon small>mdi-close</v-icon>{{ $t('clinical360.dialogs.wound_care_dialog.cancel') }}
                </v-btn>
              </div>
            </div>

            <!-- Photos Gallery -->
            <div v-if="assessment.photos && assessment.photos.length" class="photos-gallery">
              <h4 class="gallery-title">{{ $t('clinical360.dialogs.wound_care_dialog.attached_photos', { count: assessment.photos.length }) }}</h4>
              <div class="photos-grid">
                <div v-for="(photo, idx) in assessment.photos" :key="idx" class="photo-item">
                  <img :src="photo.data" :alt="$t('clinical360.dialogs.wound_care_dialog.photo_n', { n: idx + 1 })" class="gallery-image" />
                  <div class="photo-info">
                    <small>{{ formatDate(photo.timestamp) }}</small>
                    <v-btn small icon @click="removePhoto(idx)">
                      <v-icon x-small>mdi-close</v-icon>
                    </v-btn>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="no-photos">
              <v-icon color="#94a3b8">mdi-image-outline</v-icon>
              <span>{{ $t('clinical360.dialogs.wound_care_dialog.no_photos') }}</span>
            </div>
          </div>
        </section>
      </v-card-text>
      <v-card-actions v-if="selectedWoundId || mode === 'new'" class="dialog-actions">
        <span v-if="lastWarning" class="warning-flag"><v-icon x-small color="#be123c">mdi-alert</v-icon>{{ $t('clinical360.dialogs.wound_care_dialog.surface_increased') }}</span>
        <v-spacer />
        <v-btn text small @click="$emit('close')">{{ $t('clinical360.dialogs.wound_care_dialog.cancel') }}</v-btn>
        <v-btn v-if="!readOnly" depressed color="#0f766e" dark small :loading="saving" @click="save">
          <v-icon x-small left>mdi-content-save</v-icon>{{ $t('clinical360.dialogs.wound_care_dialog.save_assessment') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
const { calculateWoundSurfaceArea, calculateWoundVolume } = require('~/util/nursing-workflow.cjs')
import WoundCard from '~/components/nursing/WoundCard.vue'
import { v4 as uuidv4 } from 'uuid'

function defaultAssessment() {
  return {
    lengthCm: null,
    widthCm: null,
    depthCm: null,
    drainageAmount: 'none',
    dressingType: '',
    treatmentPlan: '',
    followUpOwner: '',
    followUpDate: '',
    supplyPlan: '',
    dischargeInstructions: '',
    painScore: 0,
    woundStatus: 'active',
    photos: []
  }
}

export default {
  name: 'WoundCareDialog',
  components: { WoundCard },
  props: {
    open: { type: Boolean, default: false },
    patientId: { type: String, required: true },
    authorRole: { type: String, default: '' },
    initialWoundId: { type: String, default: '' },
    readOnly: { type: Boolean, default: false }
  },
  data() {
    return {
      mode: 'pick',
      selectedWoundId: '',
      assessmentId: uuidv4(),
      newWound: { woundType: '', anatomicalLocation: '', acquiredLocation: 'unknown' },
      assessment: defaultAssessment(),
      photoPreview: null,
      photoFile: null,
      saving: false,
      lastWarning: false,
      acquiredLocationOptions: ['present_on_admission', 'facility_acquired', 'community_acquired', 'unknown'],
      woundStatusOptions: ['active', 'improving', 'worsening', 'healed', 'closed'],
      requiredRule: value => Boolean(value) || this.$t('clinical360.dialogs.wound_care_dialog.required')
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
      if (value) {
        this.reset()
        this.assessmentId = uuidv4()
        const wound = this.patientWounds.find(item => item.id === this.initialWoundId)
        if (wound) this.selectWound(wound)
      }
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
      this.assessment = {
        ...defaultAssessment(),
        woundStatus: wound.status || 'active'
      }
    },
    reset() {
      this.mode = 'pick'
      this.selectedWoundId = ''
      this.newWound = { woundType: '', anatomicalLocation: '', acquiredLocation: 'unknown' }
      this.assessment = defaultAssessment()
      this.photoPreview = null
      this.photoFile = null
    },
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    triggerGalleryInput() {
      this.$refs.galleryInput.click()
    },
    onPhotoSelected(event) {
      const file = event.target.files?.[0]
      if (!file) return

      this.photoFile = file
      const reader = new FileReader()
      reader.onload = (e) => {
        this.photoPreview = e.target.result
      }
      reader.readAsDataURL(file)
    },
    savePhoto() {
      if (!this.photoPreview) return

      this.assessment.photos = this.assessment.photos || []
      this.assessment.photos.push({
        data: this.photoPreview,
        timestamp: new Date().toISOString(),
        assessmentId: this.assessmentId,
        woundId: this.selectedWoundId
      })

      this.clearPhotoPreview()
      this.$notify({ type: 'success', message: this.$t('clinical360.dialogs.wound_care_dialog.photo_saved') })
    },
    clearPhotoPreview() {
      this.photoPreview = null
      this.photoFile = null
      if (this.$refs.fileInput) this.$refs.fileInput.value = ''
      if (this.$refs.galleryInput) this.$refs.galleryInput.value = ''
    },
    removePhoto(idx) {
      this.assessment.photos.splice(idx, 1)
    },
    formatDate(isoString) {
      return new Date(isoString).toLocaleString()
    },
    async save() {
      this.saving = true
      try {
        if (this.mode === 'new') {
          const wound = await this.$store.dispatch('nursing/createWound', {
            patientId: this.patientId,
            ...this.newWound
          })
          this.selectedWoundId = wound.id
        }

        const record = await this.$store.dispatch('nursing/createWoundAssessment', {
          patientId: this.patientId,
          woundId: this.selectedWoundId,
          assessmentId: this.assessmentId,
          ...this.assessment
        })

        const wound = this.patientWounds.find(item => item.id === this.selectedWoundId)
        if (wound && this.assessment.woundStatus && this.assessment.woundStatus !== wound.status) {
          await this.$store.dispatch('nursing/updateWound', {
            ...wound,
            status: this.assessment.woundStatus,
            statusUpdatedAt: new Date().toISOString(),
            statusUpdatedByRole: this.authorRole
          })
        }

        if (this.assessment.photos?.length) {
          for (const photo of this.assessment.photos) {
            await this.$store.dispatch('nursing/addWoundPhoto', {
              patientId: this.patientId,
              woundId: this.selectedWoundId,
              assessmentId: this.assessmentId,
              photoData: photo.data,
              timestamp: photo.timestamp
            })
          }
        }

        this.$emit('saved', record)
        this.$notify({ type: 'success', message: this.$t('clinical360.dialogs.wound_care_dialog.assessment_saved') })
        this.reset()
      } catch (e) {
        this.$notify({ type: 'error', message: this.$t('clinical360.dialogs.wound_care_dialog.assessment_save_error') })
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.dialog-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px !important;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.dialog-title div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dialog-title span {
  font-size: 12px;
  color: #64748b;
}

.dialog-title strong {
  color: #0f172a;
  font-size: 15px;
}

.section-label {
  color: #0f172a;
  font-size: 13px;
  font-weight: 900;
  margin: 16px 0 8px;
}

.dialog-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.dialog-grid.three {
  grid-template-columns: repeat(3, 1fr);
}

.calculated-metrics {
  display: flex;
  gap: 24px;
  padding: 12px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 4px;
  font-size: 12px;
}

.calculated-metrics span {
  color: #0c4a6e;
}

.back-link {
  background: none;
  border: none;
  color: #0f766e;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;
  padding: 0;
}

.back-link:hover {
  color: #0369a1;
}

/* Photo Section Styles */
.photo-section {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 16px;
  background: #f8fafc;
}

.photo-input-area {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.photo-preview {
  margin: 16px 0;
  padding: 12px;
  background: white;
  border: 2px solid #bae6fd;
  border-radius: 6px;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.photos-gallery {
  margin-top: 16px;
}

.gallery-title {
  color: #0f172a;
  font-size: 12px;
  font-weight: 900;
  margin: 0 0 12px;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.photo-item {
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  background: white;
  position: relative;
}

.gallery-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  display: block;
}

.photo-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px;
  background: #f8fafc;
  font-size: 10px;
  color: #64748b;
}

.no-photos {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: #94a3b8;
  text-align: center;
}

.wound-picker,
.new-wound-fields,
.existing-wound-summary {
  margin-bottom: 16px;
}

.wound-grid,
.empty-wounds {
  margin: 16px 0;
}

.empty-wounds {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px;
  color: #94a3b8;
}

.mt-3 {
  margin-top: 12px !important;
}

.mb-2 {
  margin-bottom: 8px !important;
}

.mt-4 {
  margin-top: 16px !important;
}

.dialog-actions {
  padding: 16px !important;
  border-top: 1px solid #e2e8f0;
}

.warning-flag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #be123c;
  font-weight: 700;
}
</style>
