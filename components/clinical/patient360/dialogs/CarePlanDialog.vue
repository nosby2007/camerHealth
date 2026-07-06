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
              type="button"
              class="template-card custom-card"
              @click="selectCustom"
              title="Create a custom care plan from scratch"
            >
              <v-icon color="#0f766e" size="28">mdi-plus-circle-outline</v-icon>
              <strong>Create Custom Care Plan</strong>
              <span>Define your own care plan</span>
            </button>
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
          <v-menu ref="dateMenu" v-model="dateMenuOpen" :close-on-content-click="false" offset-y>
            <template #activator="{ on, attrs }">
              <v-text-field
                :value="formatDateForDisplay(form.targetDate)"
                label="Target/Reachable Date"
                readonly
                dense
                outlined
                v-bind="attrs"
                v-on="on"
              />
            </template>
            <v-date-picker v-model="form.targetDate" @input="dateMenuOpen = false" />
          </v-menu>
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
  },
  {
    key: 'bowel-bladder',
    label: 'Bowel & Bladder Elimination',
    problem: 'Altered urinary/bowel elimination',
    goal: 'Patient achieves normal pattern of elimination or maintains current functional status',
    interventions: 'Monitor I&O, establish toileting schedule, provide privacy and assistance, offer fluid/dietary adjustment as needed.'
  },
  {
    key: 'breathing',
    label: 'Respiratory / Breathing',
    problem: 'Ineffective breathing pattern',
    goal: 'Patient maintains adequate respiratory effort and O2 saturation >=94%',
    interventions: 'Monitor respiratory rate, SpO2, and breath sounds q4h, position for optimal ventilation, oxygen therapy as ordered.'
  },
  {
    key: 'cognitive',
    label: 'Cognitive & Mental Health',
    problem: 'Acute confusion / anxiety',
    goal: 'Patient maintains orientation to person, place, time; reports reduced anxiety',
    interventions: 'Orient to surroundings frequently, provide consistent routine, reduce stimuli, use therapeutic communication, monitor mental status.'
  },
  {
    key: 'sleep',
    label: 'Sleep & Rest',
    problem: 'Impaired sleep pattern',
    goal: 'Patient reports improved sleep quality and feels rested',
    interventions: 'Establish consistent bedtime routine, minimize noise/light, encourage daytime activity, pain management, herbal tea/relaxation if appropriate.'
  },
  {
    key: 'hydration',
    label: 'Fluid & Hydration',
    problem: 'Risk for dehydration',
    goal: 'Patient maintains adequate fluid balance; urine output >0.5 mL/kg/hr, mucous membranes moist',
    interventions: 'Monitor I&O q shift, daily weight, vital signs, encourage fluid intake per orders, IV therapy as prescribed.'
  },
  {
    key: 'communication',
    label: 'Communication & Hearing',
    problem: 'Impaired verbal communication',
    goal: 'Patient/family able to communicate needs effectively',
    interventions: 'Provide hearing aids/assistive devices, speak clearly, use visual aids, allow time for response, document communication barriers.'
  },
  {
    key: 'safety',
    label: 'Safety & Security',
    problem: 'Unsafe environment / self-harm risk',
    goal: 'Patient remains safe; no injury or harm incidents',
    interventions: 'Implement fall precautions, bed alarm, close supervision, remove environmental hazards, assess suicidal/homicidal ideation if indicated.'
  },
  {
    key: 'social',
    label: 'Social Support & Coping',
    problem: 'Limited social support / ineffective coping',
    goal: 'Patient/family verbalize understanding of condition and engage with support resources',
    interventions: 'Facilitate family visits, social work referral, identify support systems, teach coping strategies, connect with community resources.'
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
      form: { problem: '', goal: '', interventions: '', targetDate: '' },
      dateMenuOpen: false,
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
      this.form = { problem: '', goal: '', interventions: '', targetDate: '' }
      this.dateMenuOpen = false
    },
    selectTemplate(tpl) {
      this.selectedTemplate = tpl
      this.form = { ...this.form, problem: tpl.problem, goal: tpl.goal, interventions: tpl.interventions }
    },
    selectCustom() {
      this.selectedTemplate = { key: 'custom', label: 'Custom Care Plan' }
      this.form = { problem: '', goal: '', interventions: '', targetDate: '' }
    },
    formatDateForDisplay(date) {
      if (!date) return '—'
      const d = new Date(date)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
.template-card.custom-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #f0fdfa;
  border: 2px dashed #0f766e;
}
.template-card.custom-card:hover {
  background: #dcfce7;
  border-color: #134e4a;
}
.template-card.custom-card strong {
  text-align: center;
  color: #0f766e;
  font-size: 12px;
}
.template-card.custom-card span {
  text-align: center;
  color: #0f766e;
  font-size: 10px;
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
