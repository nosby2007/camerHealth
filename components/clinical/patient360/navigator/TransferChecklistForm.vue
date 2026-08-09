<template>
  <div class="transfer-form">
    <v-card>
      <v-card-title class="form-header">
        <span>Transfer Checklist</span>
        <v-spacer />
        <button type="button" class="close-btn" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </button>
      </v-card-title>

      <v-divider />

      <v-card-text class="form-body">
        <form @submit.prevent="submitForm">
          <!-- Transfer Details -->
          <section class="form-section">
            <h3 class="section-title">Transfer Information</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>Current Unit/Location</label>
                <v-text-field
                  v-model="form.currentLocation"
                  outlined
                  dense
                  readonly
                />
              </div>

              <div class="form-group">
                <label>Transferring To (Required)</label>
                <v-select
                  v-model="form.transferLocation"
                  :items="transferLocations"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>Transfer Reason</label>
                <v-select
                  v-model="form.transferReason"
                  :items="['Step Down Care', 'Isolation Change', 'Specialty Care', 'Room Change', 'Other']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Anticipated Transfer Time</label>
                <v-text-field
                  v-model="form.transferTime"
                  type="datetime-local"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- Patient Condition -->
          <section class="form-section">
            <h3 class="section-title">Current Patient Status</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>General Condition</label>
                <v-select
                  v-model="form.patientCondition"
                  :items="['Stable', 'Improved', 'Unchanged', 'Declined', 'Critical']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Mobility Level</label>
                <v-select
                  v-model="form.mobilityLevel"
                  :items="['Independent', 'Assistance of 1', 'Assistance of 2', 'Bedbound']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Cognitive Status</label>
                <v-select
                  v-model="form.cognitiveStatus"
                  :items="['Alert & Oriented', 'Confused', 'Altered LOC']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Pain Level (0-10)</label>
                <v-text-field
                  v-model="form.painLevel"
                  type="number"
                  min="0"
                  max="10"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- Equipment & Lines Transfer -->
          <section class="form-section">
            <h3 class="section-title">Equipment & Lines Management</h3>

            <div class="checklist">
              <label v-for="item in equipmentItems" :key="item.id" class="checklist-item">
                <v-checkbox v-model="form.equipment[item.id]" />
                <span>{{ item.label }}</span>
              </label>
            </div>

            <div class="form-grid" style="margin-top: 16px">
              <div class="form-group">
                <label>Equipment Transfer Notes</label>
                <v-textarea
                  v-model="form.equipmentNotes"
                  placeholder="e.g., IV relocated to right arm, oxygen flow verified"
                  outlined
                  dense
                  rows="3"
                />
              </div>
            </div>
          </section>

          <!-- Hand-off Communication -->
          <section class="form-section">
            <h3 class="section-title">Hand-off Communication (SBAR)</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>Situation - Key Events</label>
                <v-textarea
                  v-model="form.situation"
                  placeholder="Current clinical situation..."
                  outlined
                  dense
                  rows="3"
                />
              </div>

              <div class="form-group">
                <label>Background - Medical History</label>
                <v-textarea
                  v-model="form.background"
                  placeholder="Relevant medical history..."
                  outlined
                  dense
                  rows="3"
                />
              </div>

              <div class="form-group">
                <label>Assessment - Current Issues</label>
                <v-textarea
                  v-model="form.assessment"
                  placeholder="Assessment and concerns..."
                  outlined
                  dense
                  rows="3"
                />
              </div>

              <div class="form-group">
                <label>Recommendation - Next Steps</label>
                <v-textarea
                  v-model="form.recommendation"
                  placeholder="Recommended actions and follow-up..."
                  outlined
                  dense
                  rows="3"
                />
              </div>
            </div>
          </section>

          <!-- Transferring Personnel -->
          <section class="form-section">
            <h3 class="section-title">Transfer Documentation</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>Transferring Nurse</label>
                <v-text-field
                  v-model="form.transferringNurse"
                  placeholder="Name"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Receiving Unit Contact</label>
                <v-text-field
                  v-model="form.receivingContact"
                  placeholder="Name or extension"
                  outlined
                  dense
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
              Complete Transfer
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
  name: 'TransferChecklistForm',
  props: {
    patientId: { type: String, required: true }
  },
  data() {
    return {
      form: {
        currentLocation: 'Medecine interne',
        transferLocation: '',
        transferReason: '',
        transferTime: '',
        patientCondition: 'Stable',
        mobilityLevel: 'Assistance of 1',
        cognitiveStatus: 'Alert & Oriented',
        painLevel: '0',
        equipment: {
          iv_line: false,
          oxygen: false,
          monitor: false,
          catheter: false,
          drain: false,
          other: false
        },
        equipmentNotes: '',
        situation: '',
        background: '',
        assessment: '',
        recommendation: '',
        transferringNurse: '',
        receivingContact: ''
      },
      transferLocations: [
        'ICU',
        'Step-Down Unit',
        'Medical/Surgical Floor',
        'Telemetry Unit',
        'Pediatrics',
        'Maternity',
        'OR',
        'Recovery',
        'Other Facility'
      ],
      equipmentItems: [
        { id: 'iv_line', label: 'IV Line (location noted)' },
        { id: 'oxygen', label: 'Oxygen Supply' },
        { id: 'monitor', label: 'Cardiac Monitor' },
        { id: 'catheter', label: 'Urinary Catheter' },
        { id: 'drain', label: 'Drains/Tubes' },
        { id: 'other', label: 'Other Equipment' }
      ]
    }
  },
  methods: {
    ...mapActions('nursing', ['createNursingTask']),
    async submitForm() {
      if (!this.form.transferLocation) {
        alert('Please select a transfer destination')
        return
      }

      try {
        await this.createNursingTask({
          patientId: this.patientId,
          type: 'TRANSFER_CHECKLIST',
          data: this.form,
          status: 'completed',
          completedAt: new Date().toISOString()
        })
        this.$emit('save', this.form)
      } catch (error) {
        console.error('Error saving transfer checklist:', error)
      }
    }
  }
}
</script>

<style scoped>
.transfer-form {
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
