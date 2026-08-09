<template>
  <div class="discharge-form">
    <v-card>
      <v-card-title class="form-header">
        <span>Discharge Summary & Instructions</span>
        <v-spacer />
        <button type="button" class="close-btn" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </button>
      </v-card-title>

      <v-divider />

      <v-card-text class="form-body">
        <form @submit.prevent="submitForm">
          <!-- Discharge Planning -->
          <section class="form-section">
            <h3 class="section-title">Discharge Planning</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>Discharge Date & Time</label>
                <v-text-field
                  v-model="form.dischargeDateTime"
                  type="datetime-local"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>Discharge Disposition</label>
                <v-select
                  v-model="form.dischargeDisposition"
                  :items="['Home', 'Home with Services', 'Rehabilitation', 'Skilled Nursing', 'Assisted Living', 'Hospice', 'Transfer to Another Facility', 'AMA']"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>Discharging Provider</label>
                <v-text-field
                  v-model="form.dischargingProvider"
                  placeholder="Provider name"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Primary Diagnosis at Discharge</label>
                <v-text-field
                  v-model="form.primaryDiagnosis"
                  placeholder="e.g., Pneumonia, resolved"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- Clinical Condition at Discharge -->
          <section class="form-section">
            <h3 class="section-title">Patient Status at Discharge</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>General Condition</label>
                <v-select
                  v-model="form.generalCondition"
                  :items="['Stable', 'Improved', 'Good', 'Fair', 'Critical']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Mental Status</label>
                <v-select
                  v-model="form.mentalStatus"
                  :items="['Alert & Oriented x3', 'Alert & Oriented x2', 'Confused', 'Lethargic', 'Unresponsive']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Functional Ability</label>
                <v-select
                  v-model="form.functionalAbility"
                  :items="['Independent', 'Assistance of 1', 'Assistance of 2+', 'Bedbound']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Pain Level (0-10) at Discharge</label>
                <v-text-field
                  v-model="form.painAtDischarge"
                  type="number"
                  min="0"
                  max="10"
                  outlined
                  dense
                />
              </div>
            </div>

            <div class="form-grid" style="margin-top: 16px">
              <div class="form-group">
                <label>Condition Summary</label>
                <v-textarea
                  v-model="form.conditionSummary"
                  placeholder="Summary of clinical status at time of discharge..."
                  outlined
                  dense
                  rows="4"
                />
              </div>
            </div>
          </section>

          <!-- Medications at Discharge -->
          <section class="form-section">
            <h3 class="section-title">Medications</h3>

            <div class="checklist">
              <label class="checklist-item">
                <v-checkbox v-model="form.medicationReconciliation" />
                <span>Medication Reconciliation Completed</span>
              </label>
              <label class="checklist-item">
                <v-checkbox v-model="form.medicationsProvided" />
                <span>Discharge Medications Provided to Patient</span>
              </label>
              <label class="checklist-item">
                <v-checkbox v-model="form.medicationInstructions" />
                <span>Medication Instructions Reviewed</span>
              </label>
            </div>

            <div class="form-grid" style="margin-top: 16px">
              <div class="form-group">
                <label>Medications to Continue at Home</label>
                <v-textarea
                  v-model="form.medicationsAtHome"
                  placeholder="e.g., Amoxicillin 500mg TID x7 days, Ibuprofen 400mg QID PRN"
                  outlined
                  dense
                  rows="4"
                />
              </div>

              <div class="form-group">
                <label>Medications Discontinued</label>
                <v-textarea
                  v-model="form.discontinuedMeds"
                  placeholder="List any meds stopped..."
                  outlined
                  dense
                  rows="3"
                />
              </div>
            </div>
          </section>

          <!-- Discharge Instructions -->
          <section class="form-section">
            <h3 class="section-title">Discharge Instructions</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>Activity Restrictions</label>
                <v-textarea
                  v-model="form.activityRestrictions"
                  placeholder="e.g., No heavy lifting, rest as tolerated"
                  outlined
                  dense
                  rows="3"
                />
              </div>

              <div class="form-group">
                <label>Diet/Nutrition</label>
                <v-textarea
                  v-model="form.dietInstructions"
                  placeholder="e.g., Clear liquids, high protein diet"
                  outlined
                  dense
                  rows="3"
                />
              </div>

              <div class="form-group">
                <label>Wound Care/Special Instructions</label>
                <v-textarea
                  v-model="form.woundCare"
                  placeholder="Detailed care instructions..."
                  outlined
                  dense
                  rows="3"
                />
              </div>

              <div class="form-group">
                <label>Return Precautions</label>
                <v-textarea
                  v-model="form.returnPrecautions"
                  placeholder="When to seek immediate care, red flags..."
                  outlined
                  dense
                  rows="3"
                />
              </div>
            </div>
          </section>

          <!-- Follow-up Arrangements -->
          <section class="form-section">
            <h3 class="section-title">Follow-up Arrangements</h3>

            <div class="form-grid">
              <div class="form-group">
                <label>Primary Care Follow-up</label>
                <v-text-field
                  v-model="form.primaryCareFollowup"
                  placeholder="Provider name, date, location"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Specialist Follow-up</label>
                <v-text-field
                  v-model="form.specialistFollowup"
                  placeholder="Provider name, date, location"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Lab/Imaging Follow-up</label>
                <v-text-field
                  v-model="form.labFollowup"
                  placeholder="e.g., X-ray in 2 weeks"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Other Services Arranged</label>
                <v-text-field
                  v-model="form.otherServices"
                  placeholder="e.g., Home health, PT/OT"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- Patient/Family Education -->
          <section class="form-section">
            <h3 class="section-title">Patient & Family Education</h3>

            <div class="checklist">
              <label v-for="item in educationItems" :key="item.id" class="checklist-item">
                <v-checkbox v-model="form.education[item.id]" />
                <span>{{ item.label }}</span>
              </label>
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
              Complete Discharge
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
  name: 'DischargeSummaryForm',
  props: {
    patientId: { type: String, required: true }
  },
  data() {
    return {
      form: {
        dischargeDateTime: '',
        dischargeDisposition: 'Home',
        dischargingProvider: '',
        primaryDiagnosis: '',
        generalCondition: 'Stable',
        mentalStatus: 'Alert & Oriented x3',
        functionalAbility: 'Independent',
        painAtDischarge: '0',
        conditionSummary: '',
        medicationReconciliation: false,
        medicationsProvided: false,
        medicationInstructions: false,
        medicationsAtHome: '',
        discontinuedMeds: '',
        activityRestrictions: '',
        dietInstructions: '',
        woundCare: '',
        returnPrecautions: '',
        primaryCareFollowup: '',
        specialistFollowup: '',
        labFollowup: '',
        otherServices: '',
        education: {
          disease_process: false,
          medication_use: false,
          activity_level: false,
          diet_restrictions: false,
          when_to_call: false,
          appointment_importance: false,
          support_resources: false
        }
      },
      educationItems: [
        { id: 'disease_process', label: 'Disease Process & Prognosis' },
        { id: 'medication_use', label: 'Proper Medication Use' },
        { id: 'activity_level', label: 'Activity Restrictions' },
        { id: 'diet_restrictions', label: 'Diet & Nutrition' },
        { id: 'when_to_call', label: 'When to Call Provider' },
        { id: 'appointment_importance', label: 'Importance of Follow-up' },
        { id: 'support_resources', label: 'Community Resources/Support' }
      ]
    }
  },
  methods: {
    ...mapActions('nursing', ['createNursingTask']),
    async submitForm() {
      if (!this.form.dischargeDateTime || !this.form.dischargeDisposition) {
        alert('Please complete all required fields')
        return
      }

      try {
        await this.createNursingTask({
          patientId: this.patientId,
          type: 'DISCHARGE_SUMMARY',
          data: this.form,
          status: 'completed',
          completedAt: new Date().toISOString()
        })
        this.$emit('save', this.form)
      } catch (error) {
        console.error('Error saving discharge summary:', error)
      }
    }
  }
}
</script>

<style scoped>
.discharge-form {
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
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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
