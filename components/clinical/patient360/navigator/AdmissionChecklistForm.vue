<template>
  <div class="admission-form">
    <v-card>
      <v-card-title class="form-header">
        <span>Admission Checklist</span>
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
            <h3 class="section-title">Patient Identification & Safety</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>MRN Verified</label>
                <v-checkbox v-model="form.mrnVerified" />
              </div>

              <div class="form-group">
                <label>ID Band Applied</label>
                <v-checkbox v-model="form.idBandApplied" />
              </div>

              <div class="form-group">
                <label>Allergies Confirmed</label>
                <v-checkbox v-model="form.allergiesConfirmed" />
              </div>

              <div class="form-group">
                <label>Allergy List</label>
                <v-text-field
                  v-model="form.allergyList"
                  placeholder="e.g., Penicillin, NKDA"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- Vital Signs & Assessment -->
          <section class="form-section">
            <h3 class="section-title">Initial Assessment</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>Temperature (°C)</label>
                <v-text-field
                  v-model="form.temperature"
                  type="number"
                  step="0.1"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Heart Rate (bpm)</label>
                <v-text-field
                  v-model="form.heartRate"
                  type="number"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>BP Systolic (mmHg)</label>
                <v-text-field
                  v-model="form.bpSystolic"
                  type="number"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>BP Diastolic (mmHg)</label>
                <v-text-field
                  v-model="form.bpDiastolic"
                  type="number"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Respiratory Rate</label>
                <v-text-field
                  v-model="form.respiratoryRate"
                  type="number"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>SpO2 (%)</label>
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
            <h3 class="section-title">Precautions & Orders</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>Fall Risk Level</label>
                <v-select
                  v-model="form.fallRisk"
                  :items="['Low', 'Medium', 'High']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Isolation Type</label>
                <v-select
                  v-model="form.isolationType"
                  :items="['No isolation', 'Standard', 'Contact', 'Droplet', 'Airborne']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Code Status</label>
                <v-select
                  v-model="form.codeStatus"
                  :items="['Full Resuscitation', 'Limited Resuscitation', 'No Resuscitation', 'Comfort Care']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Special Precautions</label>
                <v-text-field
                  v-model="form.specialPrecautions"
                  placeholder="e.g., NPO, Bed rest"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- Equipment & Devices -->
          <section class="form-section">
            <h3 class="section-title">Equipment & Devices</h3>

            <div class="checklist">
              <label v-for="item in equipmentItems" :key="item.id" class="checklist-item">
                <v-checkbox v-model="form.equipment[item.id]" />
                <span>{{ item.label }}</span>
              </label>
            </div>
          </section>

          <!-- Orientation & Education -->
          <section class="form-section">
            <h3 class="section-title">Orientation</h3>

            <div class="checklist">
              <label v-for="item in orientationItems" :key="item.id" class="checklist-item">
                <v-checkbox v-model="form.orientation[item.id]" />
                <span>{{ item.label }}</span>
              </label>
            </div>
          </section>

          <!-- Admitting Provider -->
          <section class="form-section">
            <h3 class="section-title">Admission Documentation</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>Admitting Provider</label>
                <v-text-field
                  v-model="form.admittingProvider"
                  placeholder="Provider name"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Admission Notes</label>
                <v-textarea
                  v-model="form.admissionNotes"
                  placeholder="Additional notes..."
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
              Cancel
            </v-btn>
            <v-btn
              type="submit"
              color="primary"
              dark
            >
              Save Admission
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
      },
      equipmentItems: [
        { id: 'bed', label: 'Bed & Controls' },
        { id: 'monitor', label: 'Cardiac Monitor' },
        { id: 'iv', label: 'IV Access' },
        { id: 'oxygen', label: 'Oxygen Equipment' },
        { id: 'suction', label: 'Suction Equipment' },
        { id: 'call_bell', label: 'Call Bell' }
      ],
      orientationItems: [
        { id: 'room_tour', label: 'Room Tour Completed' },
        { id: 'call_system', label: 'Call System Explained' },
        { id: 'bed_controls', label: 'Bed Controls Demonstrated' },
        { id: 'bathroom', label: 'Bathroom Location Shown' },
        { id: 'safety_info', label: 'Safety Information Provided' }
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
