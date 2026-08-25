<template>
  <div class="intake-output-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-water</v-icon>
        <span>Intake & Output Record</span>
        <v-spacer />
        <button type="button" class="close-btn" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </button>
      </v-card-title>

      <v-divider />

      <v-card-text class="form-body">
        <form @submit.prevent="submitForm">
          <section class="form-section">
            <h3 class="section-title">Fluid Intake</h3>

            <div class="intake-items">
              <div v-for="item in intakeItems" :key="item.id" class="intake-item">
                <div class="item-header">
                  <label>{{ item.label }}</label>
                  <span v-if="form.intake[item.id]" class="item-value">{{ form.intake[item.id] }} mL</span>
                </div>
                <v-text-field
                  :value="form.intake[item.id]"
                  type="number"
                  min="0"
                  outlined
                  dense
                  suffix="mL"
                  @input="form.intake[item.id] = $event || 0"
                />
              </div>
            </div>

            <div class="total-row">
              <strong>Total Intake (8-hour shift)</strong>
              <span class="total-value">{{ totalIntake }} mL</span>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">Fluid Output</h3>

            <div class="output-items">
              <div v-for="item in outputItems" :key="item.id" class="output-item">
                <div class="item-header">
                  <label>{{ item.label }}</label>
                  <span v-if="form.output[item.id]" class="item-value">{{ form.output[item.id] }} mL</span>
                </div>
                <v-text-field
                  :value="form.output[item.id]"
                  type="number"
                  min="0"
                  outlined
                  dense
                  suffix="mL"
                  @input="form.output[item.id] = $event || 0"
                />
              </div>
            </div>

            <div class="total-row">
              <strong>Total Output (8-hour shift)</strong>
              <span class="total-value">{{ totalOutput }} mL</span>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">I&O Balance</h3>
            <div class="balance-display" :class="{ positive: ioBalance > 0, negative: ioBalance < 0, neutral: ioBalance === 0 }">
              <div class="balance-icon">
                <v-icon v-if="ioBalance > 0" large color="success">mdi-plus-circle</v-icon>
                <v-icon v-else-if="ioBalance < 0" large color="error">mdi-minus-circle</v-icon>
                <v-icon v-else large>mdi-circle</v-icon>
              </div>
              <div>
                <span class="balance-label">Net Balance</span>
                <strong class="balance-value">{{ ioBalance > 0 ? '+' : '' }}{{ ioBalance }} mL</strong>
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">Urine Output Details</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Urine Color</label>
                <v-select
                  v-model="form.urineColor"
                  :items="['Colorless', 'Pale yellow', 'Yellow', 'Dark yellow', 'Amber', 'Brown', 'Red', 'Other']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Urine Clarity</label>
                <v-select
                  v-model="form.urineClarity"
                  :items="['Clear', 'Slightly cloudy', 'Cloudy', 'Very turbid']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Catheter Type</label>
                <v-select
                  v-model="form.catheterType"
                  :items="['None', 'Foley', 'Condom', 'Straight Cath', 'Suprapubic']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Catheter Status</label>
                <v-select
                  v-model="form.catheterStatus"
                  :items="['Patent', 'Draining well', 'Slow output', 'No output', 'Blocked', 'Removed']"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">Additional Output</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Nasogastric Drainage</label>
                <v-textarea
                  v-model="form.ngDrainage"
                  placeholder="Color, consistency, amount if applicable..."
                  outlined
                  dense
                  rows="2"
                />
              </div>

              <div class="form-group">
                <label>Drain Output</label>
                <v-textarea
                  v-model="form.drainOutput"
                  placeholder="Type of drain, amount, character..."
                  outlined
                  dense
                  rows="2"
                />
              </div>

              <div class="form-group">
                <label>Stool Output</label>
                <v-select
                  v-model="form.stoolOutput"
                  :items="['No BM', 'Continent', 'Incontinent', 'Diarrhea', 'Hard/Constipated', 'Other']"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>Vomitus/Emesis</label>
                <v-textarea
                  v-model="form.vomitus"
                  placeholder="Amount, color, character if applicable..."
                  outlined
                  dense
                  rows="2"
                />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">Clinical Notes</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Fluid Status & Assessment</label>
                <v-textarea
                  v-model="form.fluidStatus"
                  placeholder="Skin turgor, mucous membranes, weight changes, symptoms..."
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
              Save Intake & Output
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
  name: 'IntakeOutputForm',
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true }
  },
  data() {
    return {
      form: {
        intake: {
          oral_water: 0,
          oral_juice: 0,
          oral_milk: 0,
          oral_soup: 0,
          oral_other: 0,
          iv_maintenance: 0,
          iv_bolus: 0,
          iv_blood: 0,
          blood_products: 0,
          medications: 0
        },
        output: {
          urine: 0,
          emesis: 0,
          ng_drainage: 0,
          ostomy: 0,
          drain: 0,
          stool: 0,
          diaphoresis: 0
        },
        urineColor: 'Pale yellow',
        urineClarity: 'Clear',
        catheterType: 'None',
        catheterStatus: '',
        ngDrainage: '',
        drainOutput: '',
        stoolOutput: 'No BM',
        vomitus: '',
        fluidStatus: ''
      },
      intakeItems: [
        { id: 'oral_water', label: 'Oral - Water' },
        { id: 'oral_juice', label: 'Oral - Juice' },
        { id: 'oral_milk', label: 'Oral - Milk' },
        { id: 'oral_soup', label: 'Oral - Soup/Broth' },
        { id: 'oral_other', label: 'Oral - Other' },
        { id: 'iv_maintenance', label: 'IV Maintenance' },
        { id: 'iv_bolus', label: 'IV Bolus' },
        { id: 'iv_blood', label: 'IV Blood' },
        { id: 'blood_products', label: 'Blood Products' },
        { id: 'medications', label: 'Medications IV' }
      ],
      outputItems: [
        { id: 'urine', label: 'Urine' },
        { id: 'emesis', label: 'Emesis/Vomit' },
        { id: 'ng_drainage', label: 'NG Drainage' },
        { id: 'ostomy', label: 'Ostomy' },
        { id: 'drain', label: 'Drain' },
        { id: 'stool', label: 'Stool' },
        { id: 'diaphoresis', label: 'Diaphoresis (est)' }
      ]
    }
  },
  computed: {
    totalIntake() {
      return Object.values(this.form.intake).reduce((sum, val) => sum + (parseInt(val) || 0), 0)
    },
    totalOutput() {
      return Object.values(this.form.output).reduce((sum, val) => sum + (parseInt(val) || 0), 0)
    },
    ioBalance() {
      return this.totalIntake - this.totalOutput
    }
  },
  methods: {
    ...mapActions('flowsheets', ['createFlowsheetEntry']),
    async submitForm() {
      try {
        await this.createFlowsheetEntry({
          patientId: this.patientId,
          encounterId: this.encounterId,
          templateId: 'assessment',
          sectionId: 'intake-output-1',
          entries: {
            intake: JSON.stringify(this.form.intake),
            'total-intake': this.totalIntake,
            output: JSON.stringify(this.form.output),
            'total-output': this.totalOutput,
            'io-balance': this.ioBalance,
            'urine-color': this.form.urineColor,
            'urine-clarity': this.form.urineClarity,
            'catheter-type': this.form.catheterType,
            'catheter-status': this.form.catheterStatus,
            'ng-drainage': this.form.ngDrainage,
            'drain-output': this.form.drainOutput,
            'stool-output': this.form.stoolOutput,
            vomitus: this.form.vomitus,
            'fluid-status': this.form.fluidStatus
          },
          recordedAt: new Date().toISOString()
        })
        this.$emit('save', this.form)
      } catch (error) {
        console.error('Error saving intake/output:', error)
        alert('Error saving intake & output')
      }
    }
  }
}
</script>

<style scoped>
.intake-output-form {
  width: 100%;
}

.form-header {
  background: linear-gradient(90deg, #0369a1 0%, #0284c7 100%);
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

.intake-items,
.output-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.intake-item,
.output-item {
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: #f8fafc;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-header label {
  color: #334155;
  font-size: 12px;
  font-weight: 700;
}

.item-value {
  background: #e0f2fe;
  color: #0c4a6e;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 700;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f0f9ff;
  border: 2px solid #0284c7;
  border-radius: 4px;
  margin-top: 12px;
}

.total-row strong {
  color: #0c4a6e;
  font-weight: 900;
}

.total-value {
  font-size: 18px;
  font-weight: 900;
  color: #0284c7;
}

.balance-display {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 6px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
}

.balance-display.positive {
  background: #f0fdf4;
  border-color: #86efac;
}

.balance-display.negative {
  background: #fef2f2;
  border-color: #fca5a5;
}

.balance-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
}

.balance-label {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 4px;
}

.balance-value {
  display: block;
  font-size: 20px;
  font-weight: 900;
  color: #0f172a;
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
