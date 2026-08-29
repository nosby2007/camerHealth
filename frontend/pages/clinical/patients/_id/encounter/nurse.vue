<template>
  <v-container fluid class="gov-content pa-8">

    <!-- Header -->
    <v-row class="mb-6 no-gutters align-center">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar tile color="#00A99D" size="48" class="mr-4 shadow-sm">
            <v-icon dark>mdi-stethoscope</v-icon>
          </v-avatar>
          <div>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">NURSING EVALUATION</span>
            <h1 class="text-h5 font-weight-black gov-text-primary ls-tight uppercase">
              NURSING TRIAGE AND ENCOUNTER — {{ patientName }}
            </h1>
            <div class="text-caption grey--text mt-1" v-if="patient">
              {{ patient.id }} · {{ patient.gender }} · {{ calculatedAge(patient.dob) }} years
              <v-chip x-small label color="#D97706" dark class="ml-2 font-weight-black" v-if="hasAllergy">
                <v-icon x-small left>mdi-alert</v-icon>ALLERGY: {{ patient.allergies }}
              </v-chip>
            </div>
          </div>
        </div>
      </v-col>
      <v-col cols="auto">
        <v-btn outlined tile color="#003366" class="font-weight-black text-caption mr-2"
          :to="`/clinical/patients/${$route.params.id}`">
          <v-icon left small>mdi-account</v-icon>Patient details
        </v-btn>
        <v-btn outlined tile color="grey" class="font-weight-black text-caption"
          @click="$router.go(-1)">
          <v-icon left small>mdi-arrow-left</v-icon>Back
        </v-btn>
      </v-col>
    </v-row>

    <v-form ref="form" v-model="valid">
      <v-row>

        <!-- ── COLONNE GAUCHE ─────────────────────────────────────────────── -->
        <v-col cols="12" lg="5">

          <!-- Section 1: Vital signs -->
          <v-card flat tile class="gov-card b-1 shadow-sm mb-6 overflow-hidden">
            <div class="pa-3 bg-navy white--text font-weight-black text-caption ls-1 uppercase">
              <v-icon left small dark>mdi-heart-pulse</v-icon>VITAL SIGNS
            </div>
            <div class="pa-6">
              <v-row dense>
                <v-col cols="6">
                  <label class="form-label">Blood pressure</label>
                  <v-text-field v-model="vitals.bp" placeholder="E.g. 120/80" outlined tile dense suffix="mmHg"
                    class="rounded-0 mb-2" :rules="[bpRule]"></v-text-field>
                </v-col>
                <v-col cols="6">
                  <label class="form-label">Heart rate</label>
                  <v-text-field v-model.number="vitals.hr" type="number" outlined tile dense suffix="bpm"
                    class="rounded-0 mb-2" min="30" max="250"></v-text-field>
                </v-col>
                <v-col cols="6">
                  <label class="form-label">Respiratory rate</label>
                  <v-text-field v-model.number="vitals.rr" type="number" outlined tile dense suffix="c/min"
                    class="rounded-0 mb-2" min="8" max="60"></v-text-field>
                </v-col>
                <v-col cols="6">
                  <label class="form-label">Temperature</label>
                  <v-text-field v-model.number="vitals.temp" type="number" step="0.1" outlined tile dense suffix="°C"
                    class="rounded-0 mb-2" min="34" max="43"></v-text-field>
                </v-col>
                <v-col cols="6">
                  <label class="form-label">SpO2</label>
                  <v-text-field v-model.number="vitals.spo2" type="number" outlined tile dense suffix="%"
                    class="rounded-0 mb-2" min="50" max="100"></v-text-field>
                </v-col>
                <v-col cols="6">
                  <label class="form-label">Glucose</label>
                  <v-text-field v-model.number="vitals.glucose" type="number" step="0.1" outlined tile dense suffix="g/L"
                    class="rounded-0 mb-2"></v-text-field>
                </v-col>
                <v-col cols="6">
                  <label class="form-label">Weight</label>
                  <v-text-field v-model.number="vitals.weight" type="number" step="0.1" outlined tile dense suffix="kg"
                    class="rounded-0 mb-2"></v-text-field>
                </v-col>
                <v-col cols="6">
                  <label class="form-label">Height</label>
                  <v-text-field v-model.number="vitals.height" type="number" outlined tile dense suffix="cm"
                    class="rounded-0 mb-2"></v-text-field>
                </v-col>
              </v-row>

              <!-- Calculated BMI -->
              <div class="text-caption grey--text mt-1 mb-4" v-if="bmi">
                BMI: <strong>{{ bmi }}</strong> — {{ bmiLabel }}
              </div>

              <!-- Glasgow score -->
              <div class="section-label mb-3">GLASGOW SCORE (GCS)</div>
              <v-row dense>
                <v-col cols="4">
                  <label class="form-label">Eye opening</label>
                  <v-select v-model.number="vitals.gcsE" :items="[{text:'Spontaneous (4)',value:4},{text:'To sound (3)',value:3},{text:'To pain (2)',value:2},{text:'None (1)',value:1}]"
                    item-text="text" item-value="value" outlined tile dense class="rounded-0"></v-select>
                </v-col>
                <v-col cols="4">
                  <label class="form-label">Verbal response</label>
                  <v-select v-model.number="vitals.gcsV" :items="[{text:'Oriented (5)',value:5},{text:'Confused (4)',value:4},{text:'Incoherent (3)',value:3},{text:'Incomprehensible (2)',value:2},{text:'None (1)',value:1}]"
                    item-text="text" item-value="value" outlined tile dense class="rounded-0"></v-select>
                </v-col>
                <v-col cols="4">
                  <label class="form-label">Motor response</label>
                  <v-select v-model.number="vitals.gcsM" :items="[{text:'To command (6)',value:6},{text:'Localized (5)',value:5},{text:'Withdrawal (4)',value:4},{text:'Flexion (3)',value:3},{text:'Extension (2)',value:2},{text:'None (1)',value:1}]"
                    item-text="text" item-value="value" outlined tile dense class="rounded-0"></v-select>
                </v-col>
              </v-row>
              <v-chip label small :color="glasgowColor" dark class="font-weight-black mt-2">
                Total GCS: {{ glasgowScore }} / 15 — {{ glasgowLabel }}
              </v-chip>

              <!-- Pain scale -->
              <div class="section-label mt-4 mb-3">PAIN SCALE (0–10)</div>
              <v-slider v-model="vitals.pain" :min="0" :max="10" :step="1" thumb-label
                :color="painColor" track-color="grey lighten-2" class="mb-2">
                <template v-slot:thumb-label="{ value }">{{ value }}</template>
              </v-slider>
              <div class="d-flex justify-space-between text-caption grey--text">
                <span>0 — None</span><span>5 — Moderate</span><span>10 — Severe</span>
              </div>
            </div>
          </v-card>

        </v-col>

        <!-- ── COLONNE DROITE ─────────────────────────────────────────────── -->
        <v-col cols="12" lg="7">

          <!-- Section 2: Chief complaint -->
          <v-card flat tile class="gov-card b-1 shadow-sm mb-6 overflow-hidden">
            <div class="pa-3 bg-navy white--text font-weight-black text-caption ls-1 uppercase">
              <v-icon left small dark>mdi-clipboard-text</v-icon>CHIEF COMPLAINT AND NURSING HISTORY
            </div>
            <div class="pa-6">
              <label class="form-label">Primary chief complaint <span class="error--text">*</span></label>
              <v-text-field v-model="encounter.chiefComplaint" outlined tile dense
                :rules="[v => !!v || 'Required']" class="rounded-0 mb-4"
                placeholder="E.g. abdominal pain for 2 days..."></v-text-field>

              <label class="form-label">History of present illness</label>
              <v-textarea v-model="encounter.historyOfIllness" outlined tile dense rows="3" class="rounded-0 mb-4"
                placeholder="Onset, character, location, progression, aggravating or relieving factors..."></v-textarea>

              <label class="form-label">Mode of arrival</label>
              <v-select v-model="encounter.modeOfArrival"
                :items="['Walk-in','Ambulance','Referred from another facility','Family','Self-presented emergency']"
                outlined tile dense class="rounded-0 mb-4"></v-select>

              <label class="form-label">Triage level</label>
              <v-btn-toggle v-model="encounter.triageLevel" mandatory class="gov-toggle mb-4" dense tile>
                <v-btn value="Green" small tile>🟢 Green (Non-urgent)</v-btn>
                <v-btn value="Yellow" small tile>🟡 Yellow (Urgent)</v-btn>
                <v-btn value="Orange" small tile>🟠 Orange (Very urgent)</v-btn>
                <v-btn value="Red" small tile>🔴 Red (Critical)</v-btn>
              </v-btn-toggle>
            </div>
          </v-card>

          <!-- Section 3: Nursing assessment -->
          <v-card flat tile class="gov-card b-1 shadow-sm mb-6 overflow-hidden">
            <div class="pa-3 bg-navy white--text font-weight-black text-caption ls-1 uppercase">
              <v-icon left small dark>mdi-clipboard-check</v-icon>NURSING ASSESSMENT
            </div>
            <div class="pa-6">
              <v-row dense>
                <v-col cols="12" md="6">
                  <label class="form-label">General condition</label>
                  <v-select v-model="assessment.generalCondition"
                    :items="['Good general condition','Stable','Impaired','Serious','Critical']"
                    outlined tile dense class="rounded-0 mb-4"></v-select>
                </v-col>
                <v-col cols="12" md="6">
                  <label class="form-label">Level of consciousness</label>
                  <v-select v-model="assessment.consciousness"
                    :items="['Alert and oriented','Confused','Drowsy','Stuporous','Comatose']"
                    outlined tile dense class="rounded-0 mb-4"></v-select>
                </v-col>
                <v-col cols="12" md="6">
                  <label class="form-label">Skin and mucosal status</label>
                  <v-select v-model="assessment.skinCondition"
                    :items="['Normal','Pale','Jaundiced','Cyanotic','Dehydrated','Edematous']"
                    outlined tile dense class="rounded-0 mb-4" multiple></v-select>
                </v-col>
                <v-col cols="12" md="6">
                  <label class="form-label">Respiratory status</label>
                  <v-select v-model="assessment.respiratoryStatus"
                    :items="['Normal','Mild dyspnea','Moderate dyspnea','Respiratory distress','Cyanosis']"
                    outlined tile dense class="rounded-0 mb-4"></v-select>
                </v-col>
                <v-col cols="12">
                  <label class="form-label">Identified nursing problems</label>
                  <v-select v-model="assessment.nursingProblems"
                    :items="nursingProblemsList" multiple outlined tile dense class="rounded-0 mb-4"></v-select>
                </v-col>
                <v-col cols="12" md="6">
                  <label class="form-label">Hygiene</label>
                  <v-select v-model="assessment.hygiene"
                    :items="['Good','Acceptable','Insufficient','Poor']"
                    outlined tile dense class="rounded-0 mb-4"></v-select>
                </v-col>
                <v-col cols="12" md="6">
                  <label class="form-label">Independence level</label>
                  <v-select v-model="assessment.autonomy"
                    :items="['Fully independent','Partially dependent','Fully dependent']"
                    outlined tile dense class="rounded-0 mb-4"></v-select>
                </v-col>
              </v-row>

              <label class="form-label">Additional nursing observations</label>
              <v-textarea v-model="assessment.additionalObservations" outlined tile dense rows="3"
                class="rounded-0 mb-4" placeholder="Clinical, behavioral, or contextual observations..."></v-textarea>
            </div>
          </v-card>

          <!-- Section 4: Nursing actions and progress note -->
          <v-card flat tile class="gov-card b-1 shadow-sm mb-6 overflow-hidden">
            <div class="pa-3 bg-navy white--text font-weight-black text-caption ls-1 uppercase">
              <v-icon left small dark>mdi-note-text</v-icon>NURSING ACTIONS AND PROGRESS NOTE
            </div>
            <div class="pa-6">
              <label class="form-label">Completed nursing actions</label>
              <v-select v-model="nursingNote.actions"
                :items="nursingActionsList" multiple outlined tile dense class="rounded-0 mb-4"></v-select>

              <label class="form-label">Nursing progress note <span class="error--text">*</span></label>
              <v-textarea v-model="nursingNote.observation" outlined tile dense rows="4"
                :rules="[v => !!v || 'Required']" class="rounded-0 mb-4"
                placeholder="Describe the patient's condition, progression since the last evaluation, and care provided..."></v-textarea>

              <label class="form-label">Patient response to care</label>
              <v-textarea v-model="nursingNote.response" outlined tile dense rows="2"
                class="rounded-0 mb-4" placeholder="Tolerance to care, post-care pain, behavior..."></v-textarea>

              <label class="form-label">Disposition / next steps</label>
              <v-select v-model="nursingNote.orientation"
                :items="['Discharge home','Medical consultation','Admission','Emergency care','Lab / Imaging','Nursing follow-up']"
                outlined tile dense class="rounded-0 mb-4"></v-select>
            </div>
          </v-card>

          <!-- Save actions -->
          <div class="d-flex justify-end" style="gap:12px">
            <v-btn large tile depressed outlined color="#003366" class="font-weight-black text-caption px-8"
              :to="`/clinical/patients/${$route.params.id}`">
              Cancel
            </v-btn>
            <v-btn large tile depressed color="#00A99D" dark class="font-weight-black text-caption px-8"
              :disabled="!valid" :loading="saving" @click="save">
              <v-icon left>mdi-content-save</v-icon>SAVE NURSING EVALUATION
            </v-btn>
          </div>

        </v-col>
      </v-row>
    </v-form>

  </v-container>
</template>

<script>
export default {
  layout: 'admins',

  data() {
    return {
      valid: false,
      saving: false,

      vitals: {
        bp: '', hr: null, rr: null, temp: null, spo2: null,
        glucose: null, weight: null, height: null,
        gcsE: 4, gcsV: 5, gcsM: 6, pain: 0
      },

      encounter: {
        chiefComplaint: '',
        historyOfIllness: '',
        modeOfArrival: 'Walk-in',
        triageLevel: 'Green'
      },

      assessment: {
        generalCondition: 'Good general condition',
        consciousness: 'Alert and oriented',
        skinCondition: [],
        respiratoryStatus: 'Normal',
        nursingProblems: [],
        hygiene: 'Good',
        autonomy: 'Fully independent',
        additionalObservations: ''
      },

      nursingNote: {
        actions: [],
        observation: '',
        response: '',
        orientation: ''
      },

      nursingProblemsList: [
        'Acute pain','Chronic pain','Impaired mobility',
        'Fall risk','Self-care deficit','Impaired nutrition',
        'Constipation','Diarrhea','Urinary retention','Incontinence',
        'Impaired breathing','Anxiety','Risk of infection',
        'Impaired thermoregulation','Pressure injury risk','Sleep disturbance'
      ],

      nursingActionsList: [
        'Vital signs recorded','IV line placement','IV injection','IM injection',
        'Simple dressing','Complex dressing','Urinary catheterization','Suctioning',
        'Oxygen therapy','ECG completed','Blood sample collected','Medication administration',
        'Surgery preparation','Patient education','Psychological support',
        'Pain-relief positioning','Mobilization','Personal hygiene completed'
      ]
    }
  },

  computed: {
    patient() {
      const id = this.$route.params.id
      return (this.$store.getters['clinical/getPatients'] || []).find(p => p.id === id) || null
    },
    patientName() {
      if (!this.patient) return this.$route.params.id
      return `${this.patient.firstName || ''} ${this.patient.lastName || ''}`.trim().toUpperCase()
    },
    hasAllergy()  { return !!(this.patient && this.patient.allergies && this.patient.allergies.trim()) },

    bmi() {
      if (!this.vitals.weight || !this.vitals.height) return null
      return (this.vitals.weight / Math.pow(this.vitals.height / 100, 2)).toFixed(1)
    },
    bmiLabel() {
      const b = parseFloat(this.bmi)
      if (b < 18.5) return 'Underweight'
      if (b < 25)   return 'Normal weight'
      if (b < 30)   return 'Overweight'
      return 'Obesity'
    },

    glasgowScore() { return (this.vitals.gcsE || 0) + (this.vitals.gcsV || 0) + (this.vitals.gcsM || 0) },
    glasgowLabel() {
      if (this.glasgowScore >= 13) return 'Mild'
      if (this.glasgowScore >= 9)  return 'Moderate'
      return 'Severe'
    },
    glasgowColor() {
      if (this.glasgowScore >= 13) return '#166534'
      if (this.glasgowScore >= 9)  return '#D97706'
      return '#B91C1C'
    },
    painColor() {
      if (this.vitals.pain <= 3) return '#166534'
      if (this.vitals.pain <= 6) return '#D97706'
      return '#B91C1C'
    }
  },

  methods: {
    calculatedAge(dob) {
      if (!dob) return '—'
      return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    },
    bpRule(v) {
      if (!v) return true
      return /^\d{2,3}\/\d{2,3}$/.test(v) || 'Format: 120/80'
    },
    buildNursingNoteBody() {
      const L = []
      L.push('NURSING ASSESSMENT')
      L.push('General condition: ' + (this.assessment.generalCondition || '—'))
      L.push('Consciousness: ' + (this.assessment.consciousness || '—'))
      if (this.assessment.skinCondition.length) L.push('Skin condition: ' + this.assessment.skinCondition.join(', '))
      L.push('Respiratory status: ' + (this.assessment.respiratoryStatus || '—'))
      if (this.assessment.nursingProblems.length) L.push('Nursing problems: ' + this.assessment.nursingProblems.join(', '))
      L.push('Hygiene: ' + (this.assessment.hygiene || '—'))
      L.push('Autonomy: ' + (this.assessment.autonomy || '—'))
      if (this.assessment.additionalObservations) L.push('Additional observations: ' + this.assessment.additionalObservations)
      L.push('')
      L.push('VITALS: BP ' + (this.vitals.bp || '—') + ', HR ' + (this.vitals.hr || '—') + ', RR ' + (this.vitals.rr || '—') +
        ', Temp ' + (this.vitals.temp || '—') + ', SpO2 ' + (this.vitals.spo2 || '—') + ', Pain ' + this.vitals.pain +
        ', GCS ' + this.glasgowScore + ' (' + this.glasgowLabel + ')')
      L.push('')
      L.push('NURSING NOTE')
      if (this.nursingNote.actions.length) L.push('Actions performed: ' + this.nursingNote.actions.join(', '))
      L.push('Observation: ' + (this.nursingNote.observation || '—'))
      L.push('Patient response: ' + (this.nursingNote.response || '—'))
      if (this.nursingNote.orientation) L.push('Orientation given: ' + this.nursingNote.orientation)
      return L.join('\n')
    },

    async save() {
      if (!this.$refs.form.validate()) return
      this.saving = true
      try {
        const patientId  = this.$route.params.id
        const recordedBy = this.$store.state.auth.fullName
        const now        = new Date().toISOString()

        // 1. Record vital signs
        await this.$store.dispatch('clinical/recordVitalSigns', {
          patientId, recordedBy, recordedAt: now,
          glasgow: this.glasgowScore,
          ...this.vitals
        })

        // 2. Record the nursing encounter and assessment
        await this.$store.dispatch('clinical/logVisit', {
          patientId,
          encounterType: 'INFIRMIER',
          chiefComplaint: this.encounter.chiefComplaint,
          historyOfIllness: this.encounter.historyOfIllness,
          modeOfArrival: this.encounter.modeOfArrival,
          triageLevel: this.encounter.triageLevel,
          assessment: { ...this.assessment },
          recordedBy,
          createdAt: now
        })

        // 3. Record the nursing progress note
        await this.$store.dispatch('clinical/addNursingNote', {
          patientId, recordedBy, recordedAt: now,
          title: 'Nursing Evaluation',
          body: this.buildNursingNoteBody(),
          structuredData: {
            vitals: { ...this.vitals },
            encounter: { ...this.encounter },
            assessment: { ...this.assessment },
            nursingNote: { ...this.nursingNote },
            patientId, recordedBy, recordedAt: now
          }
        })

        this.$toast.success('Nursing evaluation saved successfully')
        this.$router.push(`/clinical/patients/${patientId}`)
      } catch (e) {
        this.$toast.error(e.response?.data?.error || e.message || 'An error occurred while saving the record')
      } finally {
        this.saving = false
      }
    }
  }
}
</script>
