<template>
  <div class="order-entry-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-plus-circle-outline</v-icon>
        <span>New Order</span>
        <v-spacer />
        <button type="button" class="close-btn" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </button>
      </v-card-title>

      <v-divider />

      <v-card-text class="form-body">
        <form @submit.prevent="submitForm">
          <!-- Order Type Selection -->
          <section class="form-section">
            <h3 class="section-title">Order Type *</h3>
            <div class="order-type-selector">
              <button
                v-for="type in orderTypes"
                :key="type.id"
                type="button"
                :class="['type-btn', { active: form.orderType === type.id }]"
                @click="form.orderType = type.id"
              >
                <v-icon>{{ type.icon }}</v-icon>
                <span>{{ type.label }}</span>
              </button>
            </div>
          </section>

          <!-- Common Order Fields -->
          <section class="form-section">
            <h3 class="section-title">Order Details</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Ordering Provider *</label>
                <v-text-field
                  v-model="form.orderingProvider"
                  placeholder="Provider name or ID"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>Priority *</label>
                <v-select
                  v-model="form.priority"
                  :items="['Routine', 'Urgent', 'STAT', 'Timed']"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>Frequency</label>
                <v-select
                  v-model="form.frequency"
                  :items="['Once', 'Daily', 'BID', 'TID', 'QID', 'Q4H', 'Q6H', 'Q8H', 'Q12H', 'Weekly', 'As needed']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Start Date/Time</label>
                <v-text-field
                  v-model="form.startDateTime"
                  type="datetime-local"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- Medication Order Fields -->
          <section v-if="form.orderType === 'medication'" class="form-section">
            <h3 class="section-title">Medication Details</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Medication Name *</label>
                <v-text-field
                  v-model="form.medication.name"
                  placeholder="e.g., Amoxicillin"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>Strength *</label>
                <v-text-field
                  v-model="form.medication.strength"
                  placeholder="e.g., 500mg"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>Route *</label>
                <v-select
                  v-model="form.medication.route"
                  :items="['Oral', 'IV', 'IM', 'SC', 'Topical', 'Inhaled', 'Sublingual', 'Rectal', 'Transdermal', 'Nasal']"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>Dose *</label>
                <v-text-field
                  v-model="form.medication.dose"
                  placeholder="e.g., 1-2 tablets"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>Indication/Reason</label>
                <v-text-field
                  v-model="form.medication.indication"
                  placeholder="e.g., Infection, Pain relief"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Special Instructions</label>
                <v-text-field
                  v-model="form.medication.instructions"
                  placeholder="e.g., With food, Do not crush"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Duration</label>
                <v-text-field
                  v-model="form.medication.duration"
                  placeholder="e.g., 7 days, 2 weeks"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Refills Allowed</label>
                <v-text-field
                  v-model="form.medication.refills"
                  type="number"
                  min="0"
                  max="10"
                  outlined
                  dense
                />
              </div>
            </div>

            <div class="checklist" style="margin-top: 16px">
              <label class="checklist-item">
                <v-checkbox v-model="form.medication.flags.allergiesChecked" />
                <span>Allergies checked</span>
              </label>
              <label class="checklist-item">
                <v-checkbox v-model="form.medication.flags.drugInteractionsChecked" />
                <span>Drug interactions checked</span>
              </label>
              <label class="checklist-item">
                <v-checkbox v-model="form.medication.flags.renalDosingConsideration" />
                <span>Renal dosing consideration</span>
              </label>
              <label class="checklist-item">
                <v-checkbox v-model="form.medication.flags.hepaticDosingConsideration" />
                <span>Hepatic dosing consideration</span>
              </label>
            </div>
          </section>

          <!-- Lab Order Fields -->
          <section v-if="form.orderType === 'lab'" class="form-section">
            <h3 class="section-title">Lab Order Details</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Lab Test Name *</label>
                <v-text-field
                  v-model="form.lab.testName"
                  placeholder="e.g., Complete Blood Count"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>Specimen Type *</label>
                <v-select
                  v-model="form.lab.specimenType"
                  :items="['Blood', 'Urine', 'Stool', 'Sputum', 'CSF', 'Tissue', 'Other']"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>Collection Instructions</label>
                <v-text-field
                  v-model="form.lab.collectionInstructions"
                  placeholder="e.g., Fasting required, 24-hour collection"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Reference Range Notes</label>
                <v-text-field
                  v-model="form.lab.referenceNotes"
                  placeholder="Special considerations"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- Imaging Order Fields -->
          <section v-if="form.orderType === 'imaging'" class="form-section">
            <h3 class="section-title">Imaging Order Details</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Imaging Study *</label>
                <v-text-field
                  v-model="form.imaging.study"
                  placeholder="e.g., Chest X-ray, CT scan"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>Body Part/Area *</label>
                <v-text-field
                  v-model="form.imaging.bodyPart"
                  placeholder="e.g., Right knee, Abdomen"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>Clinical Indication</label>
                <v-text-field
                  v-model="form.imaging.indication"
                  placeholder="e.g., Rule out fracture"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Contrast Needed</label>
                <v-checkbox v-model="form.imaging.contrastNeeded" />
              </div>

              <div v-if="form.imaging.contrastNeeded" class="form-group">
                <label>Contrast Type</label>
                <v-select
                  v-model="form.imaging.contrastType"
                  :items="['Iodine-based', 'Gadolinium', 'Barium']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Special Instructions</label>
                <v-text-field
                  v-model="form.imaging.instructions"
                  placeholder="e.g., NPO 4 hours prior"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- General Instructions -->
          <section class="form-section">
            <h3 class="section-title">Order Instructions</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Additional Notes</label>
                <v-textarea
                  v-model="form.notes"
                  placeholder="Any additional instructions or notes for the order..."
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
              Create Order
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
  name: 'OrderEntryForm',
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true }
  },
  data() {
    return {
      form: {
        orderType: 'medication',
        orderingProvider: '',
        priority: 'Routine',
        frequency: 'Once',
        startDateTime: new Date().toISOString().slice(0, 16),
        notes: '',
        medication: {
          name: '',
          strength: '',
          route: 'Oral',
          dose: '',
          indication: '',
          instructions: '',
          duration: '',
          refills: 0,
          flags: {
            allergiesChecked: false,
            drugInteractionsChecked: false,
            renalDosingConsideration: false,
            hepaticDosingConsideration: false
          }
        },
        lab: {
          testName: '',
          specimenType: 'Blood',
          collectionInstructions: '',
          referenceNotes: ''
        },
        imaging: {
          study: '',
          bodyPart: '',
          indication: '',
          contrastNeeded: false,
          contrastType: '',
          instructions: ''
        }
      },
      orderTypes: [
        { id: 'medication', label: 'Medication', icon: 'mdi-pills' },
        { id: 'lab', label: 'Lab', icon: 'mdi-flask' },
        { id: 'imaging', label: 'Imaging', icon: 'mdi-image' },
        { id: 'procedure', label: 'Procedure', icon: 'mdi-hospital-box' }
      ]
    }
  },
  methods: {
    ...mapActions('nursing', ['createOrder']),
    async submitForm() {
      if (!this.form.orderingProvider || !this.form.orderType) {
        alert('Please fill in required fields')
        return
      }

      try {
        const orderData = {
          patientId: this.patientId,
          encounterId: this.encounterId,
          orderType: this.form.orderType,
          status: 'draft',
          priority: this.form.priority,
          frequency: this.form.frequency,
          startDateTime: this.form.startDateTime,
          orderingProvider: this.form.orderingProvider,
          notes: this.form.notes
        }

        // Add type-specific data
        if (this.form.orderType === 'medication') {
          Object.assign(orderData, { medication: this.form.medication })
        } else if (this.form.orderType === 'lab') {
          Object.assign(orderData, { lab: this.form.lab })
        } else if (this.form.orderType === 'imaging') {
          Object.assign(orderData, { imaging: this.form.imaging })
        }

        await this.createOrder(orderData)
        this.$emit('save', orderData)
      } catch (error) {
        console.error('Error creating order:', error)
        alert('Error creating order')
      }
    }
  }
}
</script>

<style scoped>
.order-entry-form {
  width: 100%;
}

.form-header {
  background: linear-gradient(90deg, #1e40af 0%, #1e3a8a 100%);
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

.order-type-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 2px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 700;
  font-size: 12px;
  color: #64748b;
}

.type-btn:hover {
  border-color: #0ea5e9;
  background: #f0f9ff;
}

.type-btn.active {
  border-color: #1e40af;
  background: #dbeafe;
  color: #0c2340;
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
