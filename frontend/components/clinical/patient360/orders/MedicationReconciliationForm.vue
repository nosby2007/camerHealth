<template>
  <div class="med-reconciliation-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-clipboard-check</v-icon>
        <span>Medication Reconciliation</span>
        <v-spacer />
        <button type="button" class="close-btn" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </button>
      </v-card-title>

      <v-divider />

      <v-card-text class="form-body">
        <form @submit.prevent="submitForm">
          <!-- Reconciliation Instructions -->
          <section class="form-section">
            <div class="reconciliation-banner">
              <v-icon small>mdi-information</v-icon>
              <span>Compare home medications with current facility orders and identify discrepancies</span>
            </div>
          </section>

          <!-- Home Medications -->
          <section class="form-section">
            <h3 class="section-title">Current Home Medications</h3>
            <div class="med-table">
              <div class="table-header">
                <span>Medication</span>
                <span>Dose</span>
                <span>Frequency</span>
                <span>Reason</span>
                <span>Status</span>
              </div>
              <div v-for="(med, idx) in form.homeMedications" :key="idx" class="table-row">
                <span>{{ med.name }}</span>
                <span>{{ med.dose }}</span>
                <span>{{ med.frequency }}</span>
                <span>{{ med.reason }}</span>
                <v-select
                  :value="med.reconciliationStatus"
                  :items="['Continue', 'Hold', 'Dose change', 'Discontinued']"
                  outlined
                  dense
                  @change="form.homeMedications[idx].reconciliationStatus = $event"
                />
              </div>
            </div>
          </section>

          <!-- Current Facility Orders -->
          <section class="form-section">
            <h3 class="section-title">Current Facility Orders</h3>
            <div class="med-table">
              <div class="table-header">
                <span>Medication</span>
                <span>Dose</span>
                <span>Route</span>
                <span>Frequency</span>
              </div>
              <div v-for="(med, idx) in form.facilityOrders" :key="idx" class="table-row">
                <span>{{ med.name }}</span>
                <span>{{ med.dose }}</span>
                <span>{{ med.route }}</span>
                <span>{{ med.frequency }}</span>
              </div>
            </div>
          </section>

          <!-- Discrepancies Found -->
          <section class="form-section">
            <h3 class="section-title">Discrepancies & Actions</h3>
            <div class="discrepancy-list">
              <div v-if="discrepancies.length === 0" class="no-discrepancies">
                <v-icon color="success">mdi-check-circle</v-icon>
                <span>No discrepancies found</span>
              </div>
              <div v-for="(disc, idx) in discrepancies" v-else :key="idx" class="discrepancy-card" :class="disc.severity">
                <div class="disc-header">
                  <strong>{{ disc.medication }}</strong>
                  <v-chip small :color="disc.severity === 'high' ? 'error' : 'warning'">{{ disc.type }}</v-chip>
                </div>
                <p>{{ disc.description }}</p>
                <div class="disc-action">
                  <label>Action Required:</label>
                  <v-select
                    :value="form.discrepancyActions[idx]"
                    :items="['Clarify with provider', 'Order correction', 'Note discrepancy', 'Patient education']"
                    outlined
                    dense
                    @change="form.discrepancyActions[idx] = $event"
                  />
                </div>
              </div>
            </div>
          </section>

          <!-- Allergy & Interaction Check -->
          <section class="form-section">
            <h3 class="section-title">Safety Checks</h3>
            <div class="safety-checklist">
              <label class="checklist-item">
                <v-checkbox v-model="form.safetyChecks.allergiesVerified" />
                <span>Patient allergies verified against all medications</span>
              </label>
              <label class="checklist-item">
                <v-checkbox v-model="form.safetyChecks.drugInteractionsChecked" />
                <span>Drug-drug interactions checked</span>
              </label>
              <label class="checklist-item">
                <v-checkbox v-model="form.safetyChecks.drugAllergiesChecked" />
                <span>Drug-allergy incompatibilities checked</span>
              </label>
              <label class="checklist-item">
                <v-checkbox v-model="form.safetyChecks.duplicateTherapyReviewed" />
                <span>Duplicate therapy reviewed</span>
              </label>
              <label class="checklist-item">
                <v-checkbox v-model="form.safetyChecks.dosingAppropriate" />
                <span>Dosing appropriate for patient (renal, hepatic, age)</span>
              </label>
              <label class="checklist-item">
                <v-checkbox v-model="form.safetyChecks.contraindications" />
                <span>No contraindications present</span>
              </label>
            </div>
          </section>

          <!-- Patient Education -->
          <section class="form-section">
            <h3 class="section-title">Patient Education</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Education Provided On:</label>
                <div class="education-checks">
                  <label class="check-item">
                    <v-checkbox v-model="form.education.purposeOfMeds" />
                    <span>Purpose of medications</span>
                  </label>
                  <label class="check-item">
                    <v-checkbox v-model="form.education.sideEffects" />
                    <span>Common side effects</span>
                  </label>
                  <label class="check-item">
                    <v-checkbox v-model="form.education.takeAs Ordered" />
                    <span>Take as ordered</span>
                  </label>
                  <label class="check-item">
                    <v-checkbox v-model="form.education.drugInteractions" />
                    <span>Drug interactions/food</span>
                  </label>
                  <label class="check-item">
                    <v-checkbox v-model="form.education.storagePrecautions" />
                    <span>Storage precautions</span>
                  </label>
                  <label class="check-item">
                    <v-checkbox v-model="form.education.whenToCallDoctor" />
                    <span>When to call doctor</span>
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label>Patient Understanding</label>
                <v-select
                  v-model="form.patientUnderstanding"
                  :items="['Full understanding', 'Good understanding', 'Partial understanding', 'Limited understanding', 'Unable to assess']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Education Notes</label>
                <v-textarea
                  v-model="form.educationNotes"
                  placeholder="Additional education provided or barriers to understanding..."
                  outlined
                  dense
                  rows="3"
                />
              </div>
            </div>
          </section>

          <!-- Reconciliation Summary -->
          <section class="form-section">
            <h3 class="section-title">Reconciliation Summary</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Reconciled By *</label>
                <v-text-field
                  v-model="form.reconciledBy"
                  placeholder="Name/ID of person performing reconciliation"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>Overall Reconciliation Status</label>
                <v-select
                  v-model="form.reconciliationStatus"
                  :items="['Completed - No changes', 'Completed - Changes made', 'Pending provider review', 'Unable to complete']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Summary Notes</label>
                <v-textarea
                  v-model="form.summaryNotes"
                  placeholder="Summary of reconciliation findings and actions taken..."
                  outlined
                  dense
                  rows="3"
                />
              </div>
            </div>
          </section>

          <div class="form-actions">
            <v-btn type="button" outlined @click="$emit('close')">
              Cancel
            </v-btn>
            <v-btn type="submit" color="primary" dark>
              Complete Reconciliation
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
  name: 'MedicationReconciliationForm',
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true }
  },
  data() {
    return {
      form: {
        homeMedications: [
          { name: 'Lisinopril', dose: '10mg', frequency: 'Daily', reason: 'Hypertension', reconciliationStatus: 'Continue' },
          { name: 'Metformin', dose: '500mg', frequency: 'BID', reason: 'Diabetes', reconciliationStatus: 'Continue' },
          { name: 'Aspirin', dose: '81mg', frequency: 'Daily', reason: 'Cardiac', reconciliationStatus: 'Continue' }
        ],
        facilityOrders: [
          { name: 'Lisinopril', dose: '10mg', route: 'Oral', frequency: 'Daily' },
          { name: 'Metformin', dose: '500mg', route: 'Oral', frequency: 'BID' }
        ],
        discrepancyActions: ['Clarify with provider', 'Note discrepancy'],
        safetyChecks: {
          allergiesVerified: false,
          drugInteractionsChecked: false,
          drugAllergiesChecked: false,
          duplicateTherapyReviewed: false,
          dosingAppropriate: false,
          contraindications: false
        },
        education: {
          purposeOfMeds: false,
          sideEffects: false,
          takeAsOrdered: false,
          drugInteractions: false,
          storagePrecautions: false,
          whenToCallDoctor: false
        },
        patientUnderstanding: 'Good understanding',
        educationNotes: '',
        reconciledBy: '',
        reconciliationStatus: 'Completed - No changes',
        summaryNotes: ''
      }
    }
  },
  computed: {
    discrepancies() {
      return [
        {
          medication: 'Aspirin',
          type: 'Missing from Orders',
          description: 'Patient taking aspirin 81mg daily at home but not ordered in facility',
          severity: 'high'
        }
      ]
    }
  },
  methods: {
    ...mapActions('nursing', ['completeMedicationReconciliation']),
    async submitForm() {
      if (!this.form.reconciledBy) {
        alert('Please enter who performed the reconciliation')
        return
      }

      const allSafetyChecks = Object.values(this.form.safetyChecks).every(v => v === true)
      if (!allSafetyChecks) {
        alert('All safety checks must be completed')
        return
      }

      try {
        await this.completeMedicationReconciliation({
          patientId: this.patientId,
          encounterId: this.encounterId,
          reconciliationData: this.form,
          completedAt: new Date().toISOString()
        })
        this.$emit('save', this.form)
      } catch (error) {
        console.error('Error completing medication reconciliation:', error)
        alert('Error completing medication reconciliation')
      }
    }
  }
}
</script>

<style scoped>
.med-reconciliation-form {
  width: 100%;
}

.form-header {
  background: linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%);
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

.reconciliation-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f3f0ff;
  border: 1px solid #e9d5ff;
  border-radius: 6px;
  color: #6d28d9;
  font-size: 12px;
  font-weight: 700;
}

.med-table {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 100px 100px 120px 140px;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
  font-weight: 900;
  font-size: 12px;
  color: #334155;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 100px 100px 120px 140px;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
  align-items: center;
}

.table-row:last-child {
  border-bottom: none;
}

.discrepancy-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.no-discrepancies {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 6px;
  color: #059669;
  font-weight: 700;
  justify-content: center;
}

.discrepancy-card {
  padding: 12px;
  border: 1px solid #fca5a5;
  border-left: 4px solid #f87171;
  background: #fef2f2;
  border-radius: 4px;
}

.discrepancy-card.high {
  border-left-color: #dc2626;
  background: #fee2e2;
}

.disc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.disc-header strong {
  color: #7f1d1d;
}

.discrepancy-card p {
  color: #991b1b;
  font-size: 12px;
  margin: 8px 0;
}

.disc-action {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.disc-action label {
  color: #7f1d1d;
  font-size: 11px;
  font-weight: 700;
}

.safety-checklist,
.education-checks {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.checklist-item,
.check-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background 0.2s;
  font-size: 12px;
}

.checklist-item:hover,
.check-item:hover {
  background: #f1f5f9;
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
