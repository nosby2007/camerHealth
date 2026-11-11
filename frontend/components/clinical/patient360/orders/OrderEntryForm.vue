<template>
  <div class="order-entry-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-plus-circle-outline</v-icon>
        <span>{{ $t('clinical360.orders.order_entry.new_order') }}</span>
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
            <h3 class="section-title">{{ $t('clinical360.orders.order_entry.order_type') }}</h3>
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
            <h3 class="section-title">{{ $t('clinical360.orders.order_entry.order_details') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.orders.order_entry.ordering_provider') }}</label>
                <v-text-field
                  v-model="form.orderingProvider"
                  :placeholder="$t('clinical360.orders.order_entry.ordering_provider_placeholder')"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.orders.order_entry.priority') }}</label>
                <v-select
                  v-model="form.priority"
                  :items="['Routine', 'Urgent', 'STAT', 'Timed']"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.orders.order_entry.frequency') }}</label>
                <v-select
                  v-model="form.frequency"
                  :items="['Once', 'Daily', 'BID', 'TID', 'QID', 'Q4H', 'Q6H', 'Q8H', 'Q12H', 'Weekly', 'As needed']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.orders.order_entry.start_datetime') }}</label>
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
            <h3 class="section-title">{{ $t('clinical360.orders.order_entry.medication_details') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.orders.order_entry.medication_name') }}</label>
                <v-text-field
                  v-model="form.medication.name"
                  :placeholder="$t('clinical360.orders.order_entry.medication_name_placeholder')"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.orders.order_entry.strength') }}</label>
                <v-text-field
                  v-model="form.medication.strength"
                  :placeholder="$t('clinical360.orders.order_entry.strength_placeholder')"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.orders.order_entry.route') }}</label>
                <v-select
                  v-model="form.medication.route"
                  :items="['Oral', 'IV', 'IM', 'SC', 'Topical', 'Inhaled', 'Sublingual', 'Rectal', 'Transdermal', 'Nasal']"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.orders.order_entry.dose') }}</label>
                <v-text-field
                  v-model="form.medication.dose"
                  :placeholder="$t('clinical360.orders.order_entry.dose_placeholder')"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.orders.order_entry.indication_reason') }}</label>
                <v-text-field
                  v-model="form.medication.indication"
                  :placeholder="$t('clinical360.orders.order_entry.indication_placeholder')"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.orders.order_entry.special_instructions') }}</label>
                <v-text-field
                  v-model="form.medication.instructions"
                  :placeholder="$t('clinical360.orders.order_entry.special_instructions_placeholder')"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.orders.order_entry.duration') }}</label>
                <v-text-field
                  v-model="form.medication.duration"
                  :placeholder="$t('clinical360.orders.order_entry.duration_placeholder')"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.orders.order_entry.refills_allowed') }}</label>
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
                <span>{{ $t('clinical360.orders.order_entry.allergies_checked') }}</span>
              </label>
              <label class="checklist-item">
                <v-checkbox v-model="form.medication.flags.drugInteractionsChecked" />
                <span>{{ $t('clinical360.orders.order_entry.drug_interactions_checked') }}</span>
              </label>
              <label class="checklist-item">
                <v-checkbox v-model="form.medication.flags.renalDosingConsideration" />
                <span>{{ $t('clinical360.orders.order_entry.renal_dosing_consideration') }}</span>
              </label>
              <label class="checklist-item">
                <v-checkbox v-model="form.medication.flags.hepaticDosingConsideration" />
                <span>{{ $t('clinical360.orders.order_entry.hepatic_dosing_consideration') }}</span>
              </label>
            </div>
          </section>

          <!-- Lab Order Fields -->
          <section v-if="form.orderType === 'lab'" class="form-section">
            <h3 class="section-title">{{ $t('clinical360.orders.order_entry.lab_order_details') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.orders.order_entry.lab_test_name') }}</label>
                <v-text-field
                  v-model="form.lab.testName"
                  :placeholder="$t('clinical360.orders.order_entry.lab_test_name_placeholder')"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.orders.order_entry.specimen_type') }}</label>
                <v-select
                  v-model="form.lab.specimenType"
                  :items="['Blood', 'Urine', 'Stool', 'Sputum', 'CSF', 'Tissue', 'Other']"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.orders.order_entry.collection_instructions') }}</label>
                <v-text-field
                  v-model="form.lab.collectionInstructions"
                  :placeholder="$t('clinical360.orders.order_entry.collection_instructions_placeholder')"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.orders.order_entry.reference_range_notes') }}</label>
                <v-text-field
                  v-model="form.lab.referenceNotes"
                  :placeholder="$t('clinical360.orders.order_entry.reference_range_notes_placeholder')"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- Imaging Order Fields -->
          <section v-if="form.orderType === 'imaging'" class="form-section">
            <h3 class="section-title">{{ $t('clinical360.orders.order_entry.imaging_order_details') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.orders.order_entry.imaging_study') }}</label>
                <v-text-field
                  v-model="form.imaging.study"
                  :placeholder="$t('clinical360.orders.order_entry.imaging_study_placeholder')"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.orders.order_entry.body_part_area') }}</label>
                <v-text-field
                  v-model="form.imaging.bodyPart"
                  :placeholder="$t('clinical360.orders.order_entry.body_part_area_placeholder')"
                  outlined
                  dense
                  required
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.orders.order_entry.clinical_indication') }}</label>
                <v-text-field
                  v-model="form.imaging.indication"
                  :placeholder="$t('clinical360.orders.order_entry.clinical_indication_placeholder')"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.orders.order_entry.contrast_needed') }}</label>
                <v-checkbox v-model="form.imaging.contrastNeeded" />
              </div>

              <div v-if="form.imaging.contrastNeeded" class="form-group">
                <label>{{ $t('clinical360.orders.order_entry.contrast_type') }}</label>
                <v-select
                  v-model="form.imaging.contrastType"
                  :items="['Iodine-based', 'Gadolinium', 'Barium']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.orders.order_entry.special_instructions') }}</label>
                <v-text-field
                  v-model="form.imaging.instructions"
                  :placeholder="$t('clinical360.orders.order_entry.imaging_instructions_placeholder')"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <!-- General Instructions -->
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.orders.order_entry.order_instructions') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.orders.order_entry.additional_notes') }}</label>
                <v-textarea
                  v-model="form.notes"
                  :placeholder="$t('clinical360.orders.order_entry.additional_notes_placeholder')"
                  outlined
                  dense
                  rows="3"
                />
              </div>
            </div>
          </section>

          <div class="form-actions">
            <v-btn type="button" outlined @click="$emit('close')">
              {{ $t('clinical360.orders.order_entry.cancel') }}
            </v-btn>
            <v-btn type="submit" color="primary" dark>
              {{ $t('clinical360.orders.order_entry.create_order') }}
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
      }
    }
  },
  computed: {
    orderTypes() {
      return [
        { id: 'medication', label: this.$t('clinical360.orders.order_entry.order_type_medication'), icon: 'mdi-pills' },
        { id: 'lab', label: this.$t('clinical360.orders.order_entry.order_type_lab'), icon: 'mdi-flask' },
        { id: 'imaging', label: this.$t('clinical360.orders.order_entry.order_type_imaging'), icon: 'mdi-image' },
        { id: 'procedure', label: this.$t('clinical360.orders.order_entry.order_type_procedure'), icon: 'mdi-hospital-box' }
      ]
    }
  },
  methods: {
    ...mapActions('nursing', ['createOrder']),
    async submitForm() {
      if (!this.form.orderingProvider || !this.form.orderType) {
        alert(this.$t('clinical360.orders.order_entry.alert_required_fields'))
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
        alert(this.$t('clinical360.orders.order_entry.alert_create_error'))
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
