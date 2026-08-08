<template>
  <v-dialog :value="show" max-width="860" persistent scrollable @input="$emit('update:show', $event)">
    <v-card class="timed-care-dialog">
      <v-card-title class="dialog-title">
        <div>
          <span>Flowsheet horodate</span>
          <strong>Document care, evaluation, plan and education</strong>
        </div>
        <v-spacer />
        <v-btn icon small @click="$emit('update:show', false)">
          <v-icon small>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <div class="template-strip">
          <button
            v-for="template in templatesLibrary"
            :key="template.key"
            type="button"
            :class="['template-card', { active: form.templateKey === template.key }]"
            @click="applyTemplate(template.key)"
          >
            <v-icon small>{{ template.icon }}</v-icon>
            <strong>{{ template.label }}</strong>
            <span>{{ template.hint }}</span>
          </button>
        </div>

        <div class="dialog-grid three">
          <v-text-field v-model="form.date" label="Date" type="date" dense outlined />
          <v-text-field v-model="form.time" label="Time" type="time" dense outlined />
          <v-select v-model="form.templateId" label="Flowsheet" :items="flowsheetOptions" item-text="label" item-value="id" dense outlined />
        </div>

        <div class="dialog-grid two mt-2">
          <v-text-field v-model="form.carePerformed" label="Care performed" dense outlined />
          <v-text-field v-model="form.frequency" label="Schedule / frequency" dense outlined />
        </div>

        <div class="dialog-grid two">
          <v-textarea v-model="form.patientResponse" label="Patient response / evaluation" rows="2" dense outlined />
          <v-textarea v-model="form.abnormalFindings" label="Abnormal findings / escalation" rows="2" dense outlined />
        </div>

        <div class="dialog-grid two">
          <v-select v-model="form.carePlanFocus" label="Care plan focus" :items="carePlanOptions" dense outlined />
          <v-select v-model="form.educationGiven" label="Education prefilled" :items="educationOptions" dense outlined />
        </div>

        <v-textarea v-model="form.nextDue" label="Next due / handoff" rows="2" dense outlined />

        <div class="offline-note">
          <v-icon small color="#0f766e">mdi-cloud-sync-outline</v-icon>
          <span>Saved locally first for low-bandwidth/offline care, then available for sync.</span>
        </div>
      </v-card-text>

      <v-card-actions class="dialog-actions">
        <span>Creates a timestamped flowsheet column and a linked nursing note.</span>
        <v-spacer />
        <v-btn text small @click="$emit('update:show', false)">Cancel</v-btn>
        <v-btn depressed color="#0f766e" dark small @click="save">
          <v-icon x-small left>mdi-content-save</v-icon>File Entry
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
const TEMPLATE_LIBRARY = [
  {
    key: 'routine',
    label: 'Routine care',
    icon: 'mdi-clock-check-outline',
    hint: 'Vitals, comfort, response',
    templateId: 'timed-care',
    values: {
      carePerformed: 'Routine nursing care completed',
      frequency: 'Per shift / as scheduled',
      patientResponse: 'Patient tolerated care. No immediate concern reported.',
      abnormalFindings: 'None reported',
      carePlanFocus: 'Daily nursing care and safety',
      educationGiven: 'Explain care plan, call bell, medication schedule and warning signs',
      nextDue: 'Continue scheduled observations and handoff any change in condition.'
    }
  },
  {
    key: 'wound',
    label: 'Wound care',
    icon: 'mdi-bandage',
    hint: 'Dressing and skin',
    templateId: 'skin-wound',
    values: {
      carePerformed: 'Wound assessed and dressing care completed',
      frequency: 'Per wound care order',
      patientResponse: 'Patient tolerated dressing care.',
      abnormalFindings: 'Monitor pain, odor, drainage, bleeding, fever or spreading redness.',
      carePlanFocus: 'Skin integrity and infection prevention',
      educationGiven: 'Keep dressing clean and dry; report fever, bad smell, increased pain or bleeding.',
      nextDue: 'Reassess dressing and wound symptoms at next round.'
    }
  },
  {
    key: 'cna',
    label: 'Aide-soignant',
    icon: 'mdi-account-heart',
    hint: 'Hygiene, turn, feed',
    templateId: 'cna-rounds',
    values: {
      carePerformed: 'Basic care round completed',
      frequency: 'Every 2-4 hours / per unit routine',
      patientResponse: 'Comfort improved after care.',
      abnormalFindings: 'Escalate pain, confusion, fever, fall risk, refusal, reduced intake or skin concern.',
      carePlanFocus: 'Comfort, hygiene, mobility and pressure injury prevention',
      educationGiven: 'Family/patient reminded to call staff before mobilizing.',
      nextDue: 'Next round due per unit schedule; report abnormal findings to nurse.'
    }
  },
  {
    key: 'maternity',
    label: 'Maternity',
    icon: 'mdi-mother-nurse',
    hint: 'Mother and newborn',
    templateId: 'maternity-care',
    values: {
      carePerformed: 'Mother and newborn check completed',
      frequency: 'Per maternity observation schedule',
      patientResponse: 'Mother/family engaged in teaching.',
      abnormalFindings: 'Escalate bleeding, fever, severe headache, convulsion, breathing difficulty or poor feeding.',
      carePlanFocus: 'Postpartum/newborn safety and family education',
      educationGiven: 'Bleeding danger signs, breastfeeding support, newborn fever, poor feeding and follow-up.',
      nextDue: 'Repeat mother/newborn observation and reinforce danger signs.'
    }
  },
  {
    key: 'discharge',
    label: 'Discharge prep',
    icon: 'mdi-exit-run',
    hint: 'Teaching and follow-up',
    templateId: 'timed-care',
    values: {
      carePerformed: 'Discharge readiness review completed',
      frequency: 'Before discharge',
      patientResponse: 'Patient/family able to repeat key instructions.',
      abnormalFindings: 'Unresolved medicine, transport, payment, wound, follow-up or caregiver barrier.',
      carePlanFocus: 'Discharge readiness and continuity of care',
      educationGiven: 'Medication plan, wound care, diet, red flags, return precautions and follow-up appointment.',
      nextDue: 'Confirm pharmacy, documents, transport and follow-up before leaving.'
    }
  }
]

export default {
  name: 'TimedCareDocumentationDialog',
  props: {
    show: { type: Boolean, default: false },
    templates: { type: Array, default: () => [] }
  },
  data() {
    return {
      form: this.defaultForm()
    }
  },
  computed: {
    flowsheetOptions() {
      return this.templates.filter(item => ['timed-care', 'skin-wound', 'cna-rounds', 'maternity-care'].includes(item.id))
    },
    carePlanOptions() {
      return [
        'Daily nursing care and safety',
        'Skin integrity and infection prevention',
        'Pain control and comfort',
        'Mobility and fall prevention',
        'Nutrition and hydration',
        'Postpartum/newborn safety and family education',
        'Discharge readiness and continuity of care',
        'Social support, transport or payment barrier'
      ]
    },
    educationOptions() {
      return [
        'Explain care plan, call bell, medication schedule and warning signs',
        'Medication purpose, dose timing, side effects and missed dose plan',
        'Wound dressing care, infection signs and return precautions',
        'Diet, hydration and diabetes/hypertension self-care',
        'Fall prevention and safe mobilization',
        'Mother/newborn danger signs and breastfeeding support',
        'Discharge medication, follow-up, transport and caregiver plan'
      ]
    },
    templatesLibrary() {
      return TEMPLATE_LIBRARY
    }
  },
  watch: {
    show(value) {
      if (value) this.applyTemplate(this.form.templateKey || 'routine')
    }
  },
  methods: {
    defaultForm() {
      const now = new Date()
      return {
        templateKey: 'routine',
        templateId: 'timed-care',
        date: now.toISOString().slice(0, 10),
        time: now.toTimeString().slice(0, 5),
        carePerformed: '',
        frequency: '',
        patientResponse: '',
        abnormalFindings: '',
        carePlanFocus: '',
        educationGiven: '',
        nextDue: ''
      }
    },
    applyTemplate(key) {
      const template = TEMPLATE_LIBRARY.find(item => item.key === key) || TEMPLATE_LIBRARY[0]
      this.form = {
        ...this.form,
        templateKey: template.key,
        templateId: template.templateId,
        ...template.values
      }
    },
    save() {
      const documentedAt = new Date(`${this.form.date}T${this.form.time || '00:00'}`).toISOString()
      this.$emit('save', {
        templateId: this.form.templateId,
        documentedAt,
        summary: this.form.carePerformed,
        carePlanFocus: this.form.carePlanFocus,
        educationGiven: this.form.educationGiven,
        nextDue: this.form.nextDue,
        entries: {
          'care-performed': this.form.carePerformed,
          'care-frequency': this.form.frequency,
          'patient-response': this.form.patientResponse,
          'abnormal-findings': this.form.abnormalFindings,
          escalation: this.form.abnormalFindings,
          'care-plan-focus': this.form.carePlanFocus,
          'education-given': this.form.educationGiven,
          'next-due': this.form.nextDue,
          hygiene: this.form.carePerformed,
          positioning: this.form.frequency,
          feeding: this.form.patientResponse,
          'reported-to-nurse': this.form.abnormalFindings,
          'maternal-status': this.form.carePerformed,
          'newborn-status': this.form.patientResponse,
          'family-teaching': this.form.educationGiven,
          'danger-signs': this.form.nextDue
        }
      })
      this.form = this.defaultForm()
      this.$emit('update:show', false)
    }
  }
}
</script>

<style scoped>
.timed-care-dialog {
  border-radius: 8px;
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #d7e0df;
}

.dialog-title div {
  display: flex;
  flex-direction: column;
}

.dialog-title span {
  font-size: 11px;
  font-weight: 800;
  color: #0f766e;
  text-transform: uppercase;
}

.dialog-title strong {
  font-size: 18px;
  color: #0f172a;
}

.template-strip {
  display: grid;
  grid-template-columns: repeat(5, minmax(120px, 1fr));
  gap: 8px;
  margin-bottom: 14px;
}

.template-card {
  display: flex;
  min-height: 84px;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 10px;
  border: 1px solid #d7e0df;
  border-radius: 8px;
  background: #f8fafc;
  text-align: left;
}

.template-card.active {
  border-color: #0f766e;
  background: #ecfdf5;
  color: #134e4a;
}

.template-card strong {
  font-size: 12px;
}

.template-card span {
  font-size: 11px;
  color: #475569;
}

.dialog-grid {
  display: grid;
  gap: 10px;
}

.dialog-grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.dialog-grid.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.offline-note,
.dialog-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.offline-note {
  padding: 8px 10px;
  border: 1px solid #99f6e4;
  border-radius: 6px;
  background: #f0fdfa;
  color: #134e4a;
  font-size: 12px;
}

.dialog-actions span {
  color: #64748b;
  font-size: 12px;
}

@media (max-width: 900px) {
  .template-strip,
  .dialog-grid.two,
  .dialog-grid.three {
    grid-template-columns: 1fr;
  }
}
</style>
