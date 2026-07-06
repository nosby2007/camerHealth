<template>
  <v-dialog :value="open" max-width="820" persistent scrollable @input="$emit('close')">
    <v-card class="care-plan-dialog">
      <v-card-title class="dialog-title">
        <div>
          <span>Care planning</span>
          <strong>Add Care Plan</strong>
        </div>
        <v-btn icon small @click="$emit('close')"><v-icon small>mdi-close</v-icon></v-btn>
      </v-card-title>
      <v-card-text>
        <section v-if="!selectedTemplate">
          <p class="section-label">Choose a care plan to add</p>
          <div class="template-grid">
            <button
              v-for="tpl in templates"
              :key="tpl.key"
              type="button"
              class="template-card"
              @click="selectTemplate(tpl)"
            >
              <strong>{{ tpl.label }}</strong>
              <span>{{ tpl.problem }}</span>
            </button>
          </div>
        </section>

        <section v-else>
          <button type="button" class="back-link" @click="selectedTemplate = null">
            <v-icon x-small>mdi-arrow-left</v-icon> Choose a different care plan
          </button>
          <v-text-field v-model="form.problem" label="Problem" dense outlined :rules="[requiredRule]" />
          <v-textarea v-model="form.goal" label="Goal" rows="2" dense outlined />
          <v-textarea v-model="form.interventions" label="Interventions" rows="3" dense outlined />
        </section>
      </v-card-text>
      <v-card-actions v-if="selectedTemplate" class="dialog-actions">
        <v-spacer />
        <v-btn text small @click="$emit('close')">Cancel</v-btn>
        <v-btn depressed color="#0f766e" dark small :loading="saving" @click="save">
          <v-icon x-small left>mdi-clipboard-plus</v-icon>Add to Care Plan
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
const CARE_PLAN_TEMPLATES = [
  {
    key: 'general',
    label: 'General Nursing Care',
    problem: 'General nursing surveillance',
    goal: 'Patient remains stable with needs met throughout admission',
    interventions: 'Routine vitals, hygiene, comfort and safety checks per shift schedule.'
  },
  {
    key: 'fall-risk',
    label: 'Fall Risk',
    problem: 'Risk for falls',
    goal: 'Patient remains free from fall-related injury during admission',
    interventions: 'Bed in low position, call bell within reach, non-slip footwear, hourly rounding, fall-risk signage.'
  },
  {
    key: 'skin-integrity',
    label: 'Skin Integrity / Pressure Injury Risk',
    problem: 'Risk for impaired skin integrity',
    goal: 'Skin remains intact with no new pressure injury during admission',
    interventions: 'Reposition every 2 hours, pressure-relief surface, daily skin assessment, keep skin clean and dry.'
  },
  {
    key: 'pain',
    label: 'Pain Management',
    problem: 'Acute pain',
    goal: 'Patient reports pain controlled to acceptable level (<=3/10)',
    interventions: 'Scheduled pain assessment, administer ordered analgesia, non-pharmacological comfort measures.'
  },
  {
    key: 'infection-risk',
    label: 'Infection Risk',
    problem: 'Risk for infection',
    goal: 'Patient remains free of signs of infection during admission',
    interventions: 'Monitor temperature and wound/IV sites, hand hygiene, aseptic technique, isolation precautions as ordered.'
  },
  {
    key: 'nutrition',
    label: 'Nutrition',
    problem: 'Imbalanced nutrition, less than body requirements',
    goal: 'Patient maintains adequate nutritional intake during admission',
    interventions: 'Monitor intake/output, weigh per protocol, dietitian referral, encourage oral intake as tolerated.'
  },
  {
    key: 'mobility',
    label: 'Mobility / Activity Intolerance',
    problem: 'Impaired physical mobility',
    goal: 'Patient achieves safe mobility appropriate to condition',
    interventions: 'Assist with ambulation, physiotherapy referral, range-of-motion exercises, fall precautions.'
  },
  {
    key: 'discharge',
    label: 'Discharge Planning',
    problem: 'Discharge readiness',
    goal: 'Patient/family prepared for safe discharge with follow-up arranged',
    interventions: 'Medication reconciliation, discharge instructions, follow-up appointment, transport and support coordination.'
  }
]

export default {
  name: 'CarePlanDialog',
  props: {
    open: { type: Boolean, default: false },
    patientId: { type: String, required: true },
    authorRole: { type: String, default: '' }
  },
  data() {
    return {
      templates: CARE_PLAN_TEMPLATES,
      selectedTemplate: null,
      form: { problem: '', goal: '', interventions: '' },
      saving: false,
      requiredRule: value => Boolean(value) || 'Required'
    }
  },
  watch: {
    open(value) {
      if (value) this.reset()
    },
    patientId() {
      this.reset()
      this.$emit('close')
    }
  },
  methods: {
    reset() {
      this.selectedTemplate = null
      this.form = { problem: '', goal: '', interventions: '' }
    },
    selectTemplate(tpl) {
      this.selectedTemplate = tpl
      this.form = { problem: tpl.problem, goal: tpl.goal, interventions: tpl.interventions }
    },
    async save() {
      if (!this.form.problem) return
      this.saving = true
      try {
        const record = await this.$store.dispatch('nursing/createCarePlan', {
          ...this.form,
          patientId: this.patientId,
          authorRole: this.authorRole
        })
        this.$emit('saved', record)
        this.$emit('close')
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.care-plan-dialog {
  background: #fff;
}
.dialog-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background: #0f766e;
  color: #fff;
  padding: 14px 18px;
}
.dialog-title span {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  opacity: 0.85;
}
.dialog-title strong {
  display: block;
  font-size: 16px;
}
.section-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  color: #134e4a;
  margin: 4px 0 8px;
}
.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}
.template-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  border: 1px solid #d7e0df;
  background: #f8fafc;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
}
.template-card:hover {
  border-color: #0f766e;
  background: #f0fdfa;
}
.template-card strong {
  color: #134e4a;
  font-size: 13px;
}
.template-card span {
  color: #64748b;
  font-size: 11.5px;
}
.back-link {
  border: 0;
  background: transparent;
  color: #0f766e;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 0 10px;
}
.dialog-actions {
  padding: 10px 18px;
}
</style>
