<template>
  <div class="admission-form">
    <v-card>
      <v-card-title class="form-header">
        <span>{{ $t('clinical360.navigator.admission_checklist.title') }}</span>
        <v-spacer />
        <button type="button" class="close-btn" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </button>
      </v-card-title>

      <v-divider />

      <v-card-text class="form-body">
        <form @submit.prevent="submitForm">
          <!-- Demographics & Identification -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.navigator.admission_checklist.section_identification_title') }}</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.navigator.admission_checklist.mrn_verified_label') }}</label>
                <v-checkbox v-model="form.mrnVerified" />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.admission_checklist.id_band_label') }}</label>
                <v-checkbox v-model="form.idBandApplied" />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.admission_checklist.allergies_confirmed_label') }}</label>
                <v-checkbox v-model="form.allergiesConfirmed" />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.admission_checklist.allergy_list_label') }}</label>
                <v-text-field
                  v-model="form.allergyList"
                  :placeholder="$t('clinical360.navigator.admission_checklist.allergy_list_placeholder')"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- Vital Signs & Assessment -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.navigator.admission_checklist.section_assessment_title') }}</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.navigator.admission_checklist.temperature_label') }}</label>
                <v-text-field
                  v-model="form.temperature"
                  type="number"
                  step="0.1"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.admission_checklist.heart_rate_label') }}</label>
                <v-text-field
                  v-model="form.heartRate"
                  type="number"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.admission_checklist.bp_systolic_label') }}</label>
                <v-text-field
                  v-model="form.bpSystolic"
                  type="number"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.admission_checklist.bp_diastolic_label') }}</label>
                <v-text-field
                  v-model="form.bpDiastolic"
                  type="number"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.admission_checklist.respiratory_rate_label') }}</label>
                <v-text-field
                  v-model="form.respiratoryRate"
                  type="number"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.admission_checklist.spo2_label') }}</label>
                <v-text-field
                  v-model="form.spo2"
                  type="number"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- Admission Orders & Precautions -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.navigator.admission_checklist.section_precautions_title') }}</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.navigator.admission_checklist.fall_risk_label') }}</label>
                <v-select
                  v-model="form.fallRisk"
                  :items="fallRiskItems"
                  item-text="text"
                  item-value="value"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.admission_checklist.isolation_type_label') }}</label>
                <v-select
                  v-model="form.isolationType"
                  :items="isolationTypeItems"
                  item-text="text"
                  item-value="value"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.admission_checklist.code_status_label') }}</label>
                <v-select
                  v-model="form.codeStatus"
                  :items="codeStatusItems"
                  item-text="text"
                  item-value="value"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.admission_checklist.special_precautions_label') }}</label>
                <v-text-field
                  v-model="form.specialPrecautions"
                  :placeholder="$t('clinical360.navigator.admission_checklist.special_precautions_placeholder')"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- Equipment & Devices -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.navigator.admission_checklist.section_equipment_title') }}</h3>

            <div class="checklist">
              <label v-for="item in equipmentItems" :key="item.id" class="checklist-item">
                <v-checkbox v-model="form.equipment[item.id]" />
                <span>{{ item.label }}</span>
              </label>
            </div>
          </section>

          <!-- Orientation & Education -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.navigator.admission_checklist.section_orientation_title') }}</h3>

            <div class="checklist">
              <label v-for="item in orientationItems" :key="item.id" class="checklist-item">
                <v-checkbox v-model="form.orientation[item.id]" />
                <span>{{ item.label }}</span>
              </label>
            </div>
          </section>

          <!-- Admitting Provider -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.navigator.admission_checklist.section_documentation_title') }}</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.navigator.admission_checklist.admitting_provider_label') }}</label>
                <v-text-field
                  v-model="form.admittingProvider"
                  :placeholder="$t('clinical360.navigator.admission_checklist.admitting_provider_placeholder')"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.navigator.admission_checklist.admission_notes_label') }}</label>
                <v-textarea
                  v-model="form.admissionNotes"
                  :placeholder="$t('clinical360.navigator.admission_checklist.admission_notes_placeholder')"
                  outlined
                  dense
                  rows="4"
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
              {{ $t('clinical360.navigator.admission_checklist.cancel_btn') }}
            </v-btn>
            <v-btn
              type="submit"
              color="primary"
              dark
            >
              {{ $t('clinical360.navigator.admission_checklist.save_btn') }}
            </v-btn>
          </div>
        </form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  name: 'AdmissionChecklistForm',
  props: {
    patientId: { type: String, required: true }
  },
  data() {
    return {
      form: {
        // Safety
        mrnVerified: false,
        idBandApplied: false,
        allergiesConfirmed: false,
        allergyList: '',
        // Vitals
        temperature: '',
        heartRate: '',
        bpSystolic: '',
        bpDiastolic: '',
        respiratoryRate: '',
        spo2: '',
        // Precautions
        fallRisk: 'Low',
        isolationType: 'Standard',
        codeStatus: 'Full Resuscitation',
        specialPrecautions: '',
        // Equipment
        equipment: {
          bed: false,
          monitor: false,
          iv: false,
          oxygen: false,
          suction: false,
          call_bell: false
        },
        // Orientation
        orientation: {
          room_tour: false,
          call_system: false,
          bed_controls: false,
          bathroom: false,
          safety_info: false
        },
        // Documentation
        admittingProvider: '',
        admissionNotes: ''
      }
    }
  },
  computed: {
    fallRiskItems() {
      return [
        { text: this.$t('clinical360.navigator.admission_checklist.fall_risk_low'), value: 'Low' },
        { text: this.$t('clinical360.navigator.admission_checklist.fall_risk_medium'), value: 'Medium' },
        { text: this.$t('clinical360.navigator.admission_checklist.fall_risk_high'), value: 'High' }
      ]
    },
    isolationTypeItems() {
      return [
        { text: this.$t('clinical360.navigator.admission_checklist.isolation_none'), value: 'No isolation' },
        { text: this.$t('clinical360.navigator.admission_checklist.isolation_standard'), value: 'Standard' },
        { text: this.$t('clinical360.navigator.admission_checklist.isolation_contact'), value: 'Contact' },
        { text: this.$t('clinical360.navigator.admission_checklist.isolation_droplet'), value: 'Droplet' },
        { text: this.$t('clinical360.navigator.admission_checklist.isolation_airborne'), value: 'Airborne' }
      ]
    },
    codeStatusItems() {
      return [
        { text: this.$t('clinical360.navigator.admission_checklist.code_status_full'), value: 'Full Resuscitation' },
        { text: this.$t('clinical360.navigator.admission_checklist.code_status_limited'), value: 'Limited Resuscitation' },
        { text: this.$t('clinical360.navigator.admission_checklist.code_status_none'), value: 'No Resuscitation' },
        { text: this.$t('clinical360.navigator.admission_checklist.code_status_comfort'), value: 'Comfort Care' }
      ]
    },
    equipmentItems() {
      return [
        { id: 'bed', label: this.$t('clinical360.navigator.admission_checklist.equipment_bed') },
        { id: 'monitor', label: this.$t('clinical360.navigator.admission_checklist.equipment_monitor') },
        { id: 'iv', label: this.$t('clinical360.navigator.admission_checklist.equipment_iv') },
        { id: 'oxygen', label: this.$t('clinical360.navigator.admission_checklist.equipment_oxygen') },
        { id: 'suction', label: this.$t('clinical360.navigator.admission_checklist.equipment_suction') },
        { id: 'call_bell', label: this.$t('clinical360.navigator.admission_checklist.equipment_call_bell') }
      ]
    },
    orientationItems() {
      return [
        { id: 'room_tour', label: this.$t('clinical360.navigator.admission_checklist.orientation_room_tour') },
        { id: 'call_system', label: this.$t('clinical360.navigator.admission_checklist.orientation_call_system') },
        { id: 'bed_controls', label: this.$t('clinical360.navigator.admission_checklist.orientation_bed_controls') },
        { id: 'bathroom', label: this.$t('clinical360.navigator.admission_checklist.orientation_bathroom') },
        { id: 'safety_info', label: this.$t('clinical360.navigator.admission_checklist.orientation_safety_info') }
      ]
    }
  },
  methods: {
    submitForm() {
      this.$emit('save', { ...this.form, completedAt: new Date().toISOString() })
    }
  }
}
</script>

<style scoped>
.admission-form {
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
