<template>
  <div class="mar-interface">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-pill</v-icon>
        <span>Medication Administration Record (MAR)</span>
        <v-spacer />
        <button type="button" class="close-btn" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </button>
      </v-card-title>

      <v-divider />

      <v-card-text class="form-body">
        <!-- Medication Selection -->
        <section class="form-section">
          <h3 class="section-title">Select Medication to Administer</h3>
          <div class="medication-selector">
            <div v-for="med in activeMedications" :key="med.id" class="medication-card" :class="{ selected: selectedMedId === med.id }" @click="selectMedication(med)">
              <div class="med-info">
                <strong>{{ med.name }} {{ med.strength }}</strong>
                <span class="med-route">{{ med.route }}</span>
                <small>{{ med.frequency }}</small>
              </div>
              <div class="med-status" :class="med.lastAdministered ? 'recent' : 'due'">
                {{ med.lastAdministered ? `Last: ${formatTime(med.lastAdministered)}` : 'DUE' }}
              </div>
            </div>
          </div>
        </section>

        <!-- MAR Entry Form -->
        <section v-if="selectedMed" class="form-section">
          <h3 class="section-title">Administration Details</h3>

          <div class="form-grid">
            <div class="form-group">
              <label>Medication *</label>
              <v-text-field
                :value="`${selectedMed.name} ${selectedMed.strength} - ${selectedMed.route}`"
                outlined
                dense
                readonly
              />
            </div>

            <div class="form-group">
              <label>Dose Ordered *</label>
              <v-text-field
                :value="selectedMed.dose"
                outlined
                dense
                readonly
              />
            </div>

            <div class="form-group">
              <label>Dose Administered *</label>
              <v-text-field
                v-model="marEntry.doseAdministered"
                placeholder="e.g., 1 tablet, 10mL"
                outlined
                dense
                required
              />
            </div>

            <div class="form-group">
              <label>Route *</label>
              <v-select
                v-model="marEntry.route"
                :items="['Oral', 'IV', 'IM', 'SC', 'Topical', 'Inhaled', 'Sublingual', 'Rectal']"
                outlined
                dense
                required
              />
            </div>

            <div class="form-group">
              <label>Administration Time *</label>
              <v-text-field
                v-model="marEntry.administrationTime"
                type="time"
                outlined
                dense
                required
              />
            </div>

            <div class="form-group">
              <label>Administered By *</label>
              <v-text-field
                v-model="marEntry.administeredBy"
                placeholder="Nurse name/ID"
                outlined
                dense
                required
              />
            </div>

            <div class="form-group">
              <label>Site (if applicable)</label>
              <v-text-field
                v-model="marEntry.site"
                placeholder="e.g., Right arm, Left buttock"
                outlined
                dense
              />
            </div>

            <div class="form-group">
              <label>Lot/Serial Number</label>
              <v-text-field
                v-model="marEntry.lotNumber"
                outlined
                dense
              />
            </div>
          </div>

          <section class="form-section">
            <h3 class="section-title">Administration Status</h3>
            <div class="status-options">
              <button
                v-for="status in administrationStatuses"
                :key="status.id"
                type="button"
                :class="['status-btn', { active: marEntry.status === status.id }]"
                @click="marEntry.status = status.id"
              >
                <v-icon small>{{ status.icon }}</v-icon>
                {{ status.label }}
              </button>
            </div>
          </section>

          <section v-if="marEntry.status === 'refused' || marEntry.status === 'held'" class="form-section">
            <h3 class="section-title">Reason</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Reason for {{ marEntry.status === 'refused' ? 'Refusal' : 'Hold' }} *</label>
                <v-text-field
                  v-model="marEntry.reason"
                  placeholder="Why was medication refused/held?"
                  outlined
                  dense
                  required
                />
              </div>
              <div class="form-group">
                <label>Notify Provider</label>
                <v-checkbox v-model="marEntry.notifyProvider" />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">Patient Response</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Patient Tolerance/Response</label>
                <v-select
                  v-model="marEntry.patientResponse"
                  :items="['Well tolerated', 'Mild side effect', 'Moderate side effect', 'Severe reaction', 'N/A']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Adverse Effects</label>
                <v-text-field
                  v-model="marEntry.adverseEffects"
                  placeholder="Any adverse reactions noted..."
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Clinical Effect</label>
                <v-text-field
                  v-model="marEntry.clinicalEffect"
                  placeholder="e.g., Pain reduced to 3/10, fever down to 38.5°C"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">Medication Scan Verification</h3>
            <div class="verification-checklist">
              <label class="checklist-item">
                <v-checkbox v-model="marEntry.verification.rightPatient" />
                <span>Right Patient</span>
              </label>
              <label class="checklist-item">
                <v-checkbox v-model="marEntry.verification.rightMedication" />
                <span>Right Medication</span>
              </label>
              <label class="checklist-item">
                <v-checkbox v-model="marEntry.verification.rightDose" />
                <span>Right Dose</span>
              </label>
              <label class="checklist-item">
                <v-checkbox v-model="marEntry.verification.rightRoute" />
                <span>Right Route</span>
              </label>
              <label class="checklist-item">
                <v-checkbox v-model="marEntry.verification.rightTime" />
                <span>Right Time</span>
              </label>
            </div>
          </section>

          <div class="form-actions">
            <v-btn type="button" outlined @click="clearForm">
              Clear
            </v-btn>
            <v-btn type="button" outlined @click="$emit('close')">
              Cancel
            </v-btn>
            <v-btn type="button" color="success" dark @click="submitMAR" :disabled="!allVerificationsChecked">
              Document Administration
            </v-btn>
          </div>
        </section>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex'

export default {
  name: 'MARInterface',
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true }
  },
  data() {
    return {
      selectedMedId: null,
      selectedMed: null,
      marEntry: {
        doseAdministered: '',
        route: 'Oral',
        administrationTime: new Date().toTimeString().slice(0, 5),
        administeredBy: '',
        site: '',
        lotNumber: '',
        status: 'given',
        reason: '',
        notifyProvider: false,
        patientResponse: 'Well tolerated',
        adverseEffects: '',
        clinicalEffect: '',
        verification: {
          rightPatient: false,
          rightMedication: false,
          rightDose: false,
          rightRoute: false,
          rightTime: false
        }
      },
      administrationStatuses: [
        { id: 'given', label: 'Given', icon: 'mdi-check-circle' },
        { id: 'refused', label: 'Refused', icon: 'mdi-close-circle' },
        { id: 'held', label: 'Held', icon: 'mdi-pause-circle' },
        { id: 'not_available', label: 'Not Available', icon: 'mdi-alert-circle' }
      ],
      activeMedications: [
        {
          id: 'med-1',
          name: 'Amoxicillin',
          strength: '500mg',
          route: 'Oral',
          dose: '1 tablet',
          frequency: 'TID x7 days',
          lastAdministered: null
        },
        {
          id: 'med-2',
          name: 'Lisinopril',
          strength: '10mg',
          route: 'Oral',
          dose: '1 tablet',
          frequency: 'Daily',
          lastAdministered: '2026-08-09T06:00:00'
        },
        {
          id: 'med-3',
          name: 'Morphine',
          strength: '5mg',
          route: 'IV',
          dose: '5-10mg',
          frequency: 'Q4H PRN',
          lastAdministered: '2026-08-09T14:30:00'
        }
      ]
    }
  },
  computed: {
    allVerificationsChecked() {
      const v = this.marEntry.verification
      return v.rightPatient && v.rightMedication && v.rightDose && v.rightRoute && v.rightTime
    }
  },
  methods: {
    ...mapActions('nursing', ['updateMedicationAdministration']),
    selectMedication(med) {
      this.selectedMedId = med.id
      this.selectedMed = med
      this.marEntry.route = med.route
    },
    formatTime(isoString) {
      return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    },
    clearForm() {
      this.marEntry = {
        doseAdministered: '',
        route: 'Oral',
        administrationTime: new Date().toTimeString().slice(0, 5),
        administeredBy: '',
        site: '',
        lotNumber: '',
        status: 'given',
        reason: '',
        notifyProvider: false,
        patientResponse: 'Well tolerated',
        adverseEffects: '',
        clinicalEffect: '',
        verification: {
          rightPatient: false,
          rightMedication: false,
          rightDose: false,
          rightRoute: false,
          rightTime: false
        }
      }
    },
    async submitMAR() {
      if (!this.selectedMed || !this.marEntry.administeredBy) {
        alert('Please fill in required fields')
        return
      }

      try {
        await this.updateMedicationAdministration({
          patientId: this.patientId,
          encounterId: this.encounterId,
          medicationId: this.selectedMedId,
          marData: {
            ...this.marEntry,
            administeredAt: new Date().toISOString()
          }
        })
        this.$emit('save', this.marEntry)
        this.clearForm()
      } catch (error) {
        console.error('Error recording medication administration:', error)
        alert('Error recording medication administration')
      }
    }
  }
}
</script>

<style scoped>
.mar-interface {
  width: 100%;
}

.form-header {
  background: linear-gradient(90deg, #059669 0%, #047857 100%);
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

.medication-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.medication-card {
  padding: 12px;
  border: 2px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.medication-card:hover {
  border-color: #10b981;
  background: #f0fdf4;
}

.medication-card.selected {
  border-color: #059669;
  background: #dcfce7;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
}

.med-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.med-info strong {
  color: #0f172a;
  font-size: 13px;
  font-weight: 900;
}

.med-route {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
}

.med-info small {
  color: #94a3b8;
  font-size: 11px;
}

.med-status {
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
}

.med-status.due {
  background: #fef2f2;
  color: #be123c;
}

.med-status.recent {
  background: #f0fdf4;
  color: #059669;
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

.status-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.status-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border: 2px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 700;
  font-size: 12px;
  color: #64748b;
}

.status-btn:hover {
  border-color: #10b981;
  background: #f0fdf4;
}

.status-btn.active {
  border-color: #059669;
  background: #dcfce7;
  color: #065f46;
}

.verification-checklist {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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
