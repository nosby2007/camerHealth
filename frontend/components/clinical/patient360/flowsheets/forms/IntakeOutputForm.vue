<template>
  <div class="intake-output-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-water</v-icon>
        <span>{{ $t('clinical360.flowsheets.forms.intake_output.title') }}</span>
        <v-spacer />
        <button type="button" class="close-btn" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </button>
      </v-card-title>

      <v-divider />

      <v-card-text class="form-body">
        <form @submit.prevent="submitForm">
          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.flowsheets.forms.intake_output.section_fluid_intake') }}</h3>

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
              <strong>{{ $t('clinical360.flowsheets.forms.intake_output.total_intake_label') }}</strong>
              <span class="total-value">{{ totalIntake }} mL</span>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.flowsheets.forms.intake_output.section_fluid_output') }}</h3>

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
              <strong>{{ $t('clinical360.flowsheets.forms.intake_output.total_output_label') }}</strong>
              <span class="total-value">{{ totalOutput }} mL</span>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.flowsheets.forms.intake_output.section_io_balance') }}</h3>
            <div class="balance-display" :class="{ positive: ioBalance > 0, negative: ioBalance < 0, neutral: ioBalance === 0 }">
              <div class="balance-icon">
                <v-icon v-if="ioBalance > 0" large color="success">mdi-plus-circle</v-icon>
                <v-icon v-else-if="ioBalance < 0" large color="error">mdi-minus-circle</v-icon>
                <v-icon v-else large>mdi-circle</v-icon>
              </div>
              <div>
                <span class="balance-label">{{ $t('clinical360.flowsheets.forms.intake_output.net_balance_label') }}</span>
                <strong class="balance-value">{{ ioBalance > 0 ? '+' : '' }}{{ ioBalance }} mL</strong>
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.flowsheets.forms.intake_output.section_urine_details') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.intake_output.label_urine_color') }}</label>
                <v-select
                  v-model="form.urineColor"
                  :items="urineColorOptions"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.intake_output.label_urine_clarity') }}</label>
                <v-select
                  v-model="form.urineClarity"
                  :items="urineClarityOptions"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.intake_output.label_catheter_type') }}</label>
                <v-select
                  v-model="form.catheterType"
                  :items="catheterTypeOptions"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.intake_output.label_catheter_status') }}</label>
                <v-select
                  v-model="form.catheterStatus"
                  :items="catheterStatusOptions"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.flowsheets.forms.intake_output.section_additional_output') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.intake_output.label_ng_drainage') }}</label>
                <v-textarea
                  v-model="form.ngDrainage"
                  :placeholder="$t('clinical360.flowsheets.forms.intake_output.placeholder_ng_drainage')"
                  outlined
                  dense
                  rows="2"
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.intake_output.label_drain_output') }}</label>
                <v-textarea
                  v-model="form.drainOutput"
                  :placeholder="$t('clinical360.flowsheets.forms.intake_output.placeholder_drain_output')"
                  outlined
                  dense
                  rows="2"
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.intake_output.label_stool_output') }}</label>
                <v-select
                  v-model="form.stoolOutput"
                  :items="stoolOutputOptions"
                  item-value="value"
                  item-text="text"
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.intake_output.label_vomitus') }}</label>
                <v-textarea
                  v-model="form.vomitus"
                  :placeholder="$t('clinical360.flowsheets.forms.intake_output.placeholder_vomitus')"
                  outlined
                  dense
                  rows="2"
                />
              </div>
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">{{ $t('clinical360.flowsheets.forms.intake_output.section_clinical_notes') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.flowsheets.forms.intake_output.label_fluid_status') }}</label>
                <v-textarea
                  v-model="form.fluidStatus"
                  :placeholder="$t('clinical360.flowsheets.forms.intake_output.placeholder_fluid_status')"
                  outlined
                  dense
                  rows="3"
                />
              </div>
            </div>
          </section>

          <div class="form-actions">
            <v-btn type="button" outlined @click="$emit('close')">
              {{ $t('clinical360.flowsheets.forms.intake_output.cancel') }}
            </v-btn>
            <v-btn type="submit" color="primary" dark>
              {{ $t('clinical360.flowsheets.forms.intake_output.save') }}
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
        urineColor: '',
        urineClarity: '',
        catheterType: '',
        catheterStatus: '',
        ngDrainage: '',
        drainOutput: '',
        stoolOutput: '',
        vomitus: '',
        fluidStatus: ''
      },
      intakeItemIds: ['oral_water', 'oral_juice', 'oral_milk', 'oral_soup', 'oral_other', 'iv_maintenance', 'iv_bolus', 'iv_blood', 'blood_products', 'medications'],
      outputItemIds: ['urine', 'emesis', 'ng_drainage', 'ostomy', 'drain', 'stool', 'diaphoresis']
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
    },
    intakeItems() {
      return this.intakeItemIds.map(id => ({
        id,
        label: this.$t(`clinical360.flowsheets.forms.intake_output.options.intake.${id}`)
      }))
    },
    outputItems() {
      return this.outputItemIds.map(id => ({
        id,
        label: this.$t(`clinical360.flowsheets.forms.intake_output.options.output.${id}`)
      }))
    },
    urineColorOptions() {
      return [
        ['colorless', 'Colorless'], ['pale_yellow', 'Pale yellow'], ['yellow', 'Yellow'],
        ['dark_yellow', 'Dark yellow'], ['amber', 'Amber'], ['brown', 'Brown'], ['red', 'Red'], ['other', 'Other']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.flowsheets.forms.intake_output.options.urine_color.${k}`) }))
    },
    urineClarityOptions() {
      return [
        ['clear', 'Clear'], ['slightly_cloudy', 'Slightly cloudy'], ['cloudy', 'Cloudy'], ['very_turbid', 'Very turbid']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.flowsheets.forms.intake_output.options.urine_clarity.${k}`) }))
    },
    catheterTypeOptions() {
      return [
        ['none', 'None'], ['foley', 'Foley'], ['condom', 'Condom'], ['straight_cath', 'Straight Cath'], ['suprapubic', 'Suprapubic']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.flowsheets.forms.intake_output.options.catheter_type.${k}`) }))
    },
    catheterStatusOptions() {
      return [
        ['patent', 'Patent'], ['draining_well', 'Draining well'], ['slow_output', 'Slow output'],
        ['no_output', 'No output'], ['blocked', 'Blocked'], ['removed', 'Removed']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.flowsheets.forms.intake_output.options.catheter_status.${k}`) }))
    },
    stoolOutputOptions() {
      return [
        ['no_bm', 'No BM'], ['continent', 'Continent'], ['incontinent', 'Incontinent'],
        ['diarrhea', 'Diarrhea'], ['hard_constipated', 'Hard/Constipated'], ['other', 'Other']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.flowsheets.forms.intake_output.options.stool_output.${k}`) }))
    }
  },
  created() {
    this.form.urineColor = 'Pale yellow'
    this.form.urineClarity = 'Clear'
    this.form.catheterType = 'None'
    this.form.stoolOutput = 'No BM'
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
        alert(this.$t('clinical360.flowsheets.forms.intake_output.save_error'))
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
