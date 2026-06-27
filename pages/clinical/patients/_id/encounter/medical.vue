<template>
  <v-container fluid class="gov-content pa-8">

    <!-- Header -->
    <v-row class="mb-6 no-gutters align-center">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar tile color="#003366" size="48" class="mr-4 shadow-sm">
            <v-icon dark>mdi-medical-bag</v-icon>
          </v-avatar>
          <div>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">MEDICAL CONSULTATION</span>
            <h1 class="text-h5 font-weight-black gov-text-primary ls-tight uppercase">
              MEDICAL ENCOUNTER — {{ patientName }}
            </h1>
            <div class="text-caption grey--text mt-1" v-if="patient">
              {{ patient.id }} · {{ patient.gender }} · {{ calculatedAge(patient.dob) }} years ·
              Blood group: <strong>{{ patient.bloodType || 'N/A' }}</strong>
              <v-chip x-small label color="#D97706" dark class="ml-2 font-weight-black" v-if="hasAllergy">
                <v-icon x-small left>mdi-alert</v-icon>ALLERGY: {{ patient.allergies }}
              </v-chip>
            </div>
          </div>
        </div>
      </v-col>
      <v-col cols="auto">
        <v-btn outlined tile color="#00A99D" class="font-weight-black text-caption mr-2"
          :to="`/clinical/patients/${$route.params.id}`">
          <v-icon left small>mdi-account</v-icon>Patient details
        </v-btn>
        <v-btn outlined tile color="grey" class="font-weight-black text-caption"
          @click="$router.go(-1)">
          <v-icon left small>mdi-arrow-left</v-icon>Back
        </v-btn>
      </v-col>
    </v-row>

    <!-- Context: latest vital signs -->
    <v-card flat tile class="mb-6 gov-card b-1 shadow-sm" v-if="lastVitals">
      <div class="pa-3 bg-grey lighten-4 border-bottom text-caption font-weight-black grey--text uppercase ls-1">
        <v-icon left x-small>mdi-heart-pulse</v-icon>LATEST VITAL SIGNS (Nursing triage)
      </div>
      <div class="pa-4 d-flex flex-wrap" style="gap:16px">
        <div class="vital-badge"><span>BP</span><strong>{{ lastVitals.bp || '—' }} mmHg</strong></div>
        <div class="vital-badge"><span>HR</span><strong>{{ lastVitals.hr || '—' }} bpm</strong></div>
        <div class="vital-badge"><span>T°</span><strong>{{ lastVitals.temp ? lastVitals.temp + '°C' : '—' }}</strong></div>
        <div class="vital-badge"><span>SpO2</span><strong>{{ lastVitals.spo2 ? lastVitals.spo2 + '%' : '—' }}</strong></div>
        <div class="vital-badge"><span>GCS</span><strong>{{ lastVitals.glasgow || '—' }}/15</strong></div>
        <div class="vital-badge"><span>Pain</span><strong>{{ lastVitals.pain !== undefined ? lastVitals.pain + '/10' : '—' }}</strong></div>
        <div class="vital-badge"><span>Weight</span><strong>{{ lastVitals.weight ? lastVitals.weight + ' kg' : '—' }}</strong></div>
        <div class="text-caption grey--text align-self-center font-italic">
          Recorded on {{ formatDate(lastVitals.recordedAt) }} by {{ lastVitals.recordedBy }}
        </div>
      </div>
    </v-card>

    <v-form ref="form" v-model="valid">
      <v-row>

        <!-- ── COLONNE GAUCHE ─────────────────────────────────────────────── -->
        <v-col cols="12" lg="6">

          <!-- Chief complaint and history -->
          <v-card flat tile class="gov-card b-1 shadow-sm mb-6 overflow-hidden">
            <div class="pa-3 bg-navy white--text font-weight-black text-caption ls-1 uppercase">
              <v-icon left small dark>mdi-clipboard-text</v-icon>CHIEF COMPLAINT AND MEDICAL HISTORY
            </div>
            <div class="pa-6">
              <label class="form-label">Primary chief complaint <span class="error--text">*</span></label>
              <v-text-field v-model="encounter.chiefComplaint" outlined tile dense
                :rules="[v => !!v || 'Required']" class="rounded-0 mb-4"
                placeholder="Chief complaint..."></v-text-field>

              <label class="form-label">History of present illness <span class="error--text">*</span></label>
              <v-textarea v-model="encounter.historyOfIllness" outlined tile dense rows="4"
                :rules="[v => !!v || 'Required']" class="rounded-0 mb-4"
                placeholder="Onset, presentation, character, location, radiation, intensity, progression, modifying factors, associated symptoms..."></v-textarea>

              <label class="form-label">Past medical history</label>
              <v-textarea v-model="encounter.medicalHistory" outlined tile dense rows="2"
                class="rounded-0 mb-4" placeholder="Hypertension, diabetes, heart disease, HIV, chronic malaria..."></v-textarea>

              <label class="form-label">Surgical history</label>
              <v-text-field v-model="encounter.surgicalHistory" outlined tile dense class="rounded-0 mb-4"
                placeholder="E.g. appendectomy 2018, cesarean section..."></v-text-field>

              <label class="form-label">Family history</label>
              <v-text-field v-model="encounter.familyHistory" outlined tile dense class="rounded-0 mb-4"
                placeholder="E.g. father with diabetes, mother with hypertension..."></v-text-field>

              <label class="form-label">Drug allergies</label>
              <v-text-field v-model="encounter.allergies" outlined tile dense class="rounded-0 mb-4"
                :class="encounter.allergies ? 'error--text' : ''"
                placeholder="None known / Penicillin / NSAIDs..."></v-text-field>

              <label class="form-label">Current medications before consultation</label>
              <v-textarea v-model="encounter.currentMeds" outlined tile dense rows="2"
                class="rounded-0 mb-4" placeholder="Name, dose, frequency..."></v-textarea>

              <label class="form-label">Lifestyle and risk factors</label>
              <v-select v-model="encounter.riskFactors"
                :items="['Smoking','Alcohol use','Sedentary lifestyle','Obesity','Chronic stress','Malnutrition','Unsafe water exposure','Occupational exposure']"
                multiple outlined tile dense class="rounded-0 mb-4"></v-select>
            </div>
          </v-card>

          <!-- Physical examination -->
          <v-card flat tile class="gov-card b-1 shadow-sm mb-6 overflow-hidden">
            <div class="pa-3 bg-navy white--text font-weight-black text-caption ls-1 uppercase">
              <v-icon left small dark>mdi-human</v-icon>PHYSICAL EXAMINATION
            </div>
            <div class="pa-6">
              <label class="form-label">General condition</label>
              <v-select v-model="exam.generalState"
                :items="['Good general condition','Acceptable general condition','Impaired','Poor general condition']"
                outlined tile dense class="rounded-0 mb-4"></v-select>

              <div class="section-label mb-3">SYSTEM-BASED EXAMINATION</div>

              <label class="form-label">Cardiovascular</label>
              <v-textarea v-model="exam.cardiovascular" outlined tile dense rows="2" class="rounded-0 mb-3"
                placeholder="Heart sounds, murmurs, peripheral pulses, edema..."></v-textarea>

              <label class="form-label">Respiratory</label>
              <v-textarea v-model="exam.respiratory" outlined tile dense rows="2" class="rounded-0 mb-3"
                placeholder="Breath sounds, crackles, wheezing, dullness..."></v-textarea>

              <label class="form-label">Abdominal</label>
              <v-textarea v-model="exam.abdominal" outlined tile dense rows="2" class="rounded-0 mb-3"
                placeholder="Palpation findings, pain, guarding, hepato-splenomegaly..."></v-textarea>

              <label class="form-label">Neurological</label>
              <v-textarea v-model="exam.neurological" outlined tile dense rows="2" class="rounded-0 mb-3"
                placeholder="Consciousness, orientation, reflexes, meningeal signs, motor or sensory deficits..."></v-textarea>

              <label class="form-label">Other systems (Skin, ENT, genitourinary, musculoskeletal...)</label>
              <v-textarea v-model="exam.other" outlined tile dense rows="2" class="rounded-0 mb-3"></v-textarea>

              <label class="form-label">Clinical examination summary</label>
              <v-textarea v-model="exam.clinicalFindings" outlined tile dense rows="3" class="rounded-0"
                placeholder="Summary of the positive and clinically relevant examination findings..."></v-textarea>
            </div>
          </v-card>
        </v-col>

        <!-- ── COLONNE DROITE ─────────────────────────────────────────────── -->
        <v-col cols="12" lg="6">

          <!-- Diagnostic assessment -->
          <v-card flat tile class="gov-card b-1 shadow-sm mb-6 overflow-hidden">
            <div class="pa-3 bg-navy white--text font-weight-black text-caption ls-1 uppercase">
              <v-icon left small dark>mdi-brain</v-icon>DIAGNOSTIC ASSESSMENT
            </div>
            <div class="pa-6">
              <label class="form-label">Primary diagnosis <span class="error--text">*</span></label>
              <v-text-field v-model="diagnosis.primary" outlined tile dense
                :rules="[v => !!v || 'Required']" class="rounded-0 mb-4"
                placeholder="E.g. uncomplicated malaria, bacterial pneumonia, acute appendicitis..."></v-text-field>

              <label class="form-label">Differential diagnoses</label>
              <v-combobox v-model="diagnosis.differentials" multiple outlined tile dense
                class="rounded-0 mb-4" chips small-chips deletable-chips
                placeholder="Add a differential diagnosis..."></v-combobox>

              <label class="form-label">Associated diagnoses / comorbidities</label>
              <v-combobox v-model="diagnosis.comorbidities" multiple outlined tile dense
                class="rounded-0 mb-4" chips small-chips deletable-chips></v-combobox>

              <label class="form-label">Clinical severity</label>
              <v-btn-toggle v-model="diagnosis.severity" mandatory class="gov-toggle mb-4" dense tile>
                <v-btn value="Mild" small tile>Mild</v-btn>
                <v-btn value="Moderate" small tile>Moderate</v-btn>
                <v-btn value="Severe" small tile>Severe</v-btn>
                <v-btn value="Critical" small tile>🔴 Critical</v-btn>
              </v-btn-toggle>
            </div>
          </v-card>

          <!-- Treatment plan -->
          <v-card flat tile class="gov-card b-1 shadow-sm mb-6 overflow-hidden">
            <div class="pa-3 bg-navy white--text font-weight-black text-caption ls-1 uppercase">
              <v-icon left small dark>mdi-pill</v-icon>TREATMENT PLAN
            </div>
            <div class="pa-6">
              <label class="form-label">Medication prescriptions</label>
              <v-textarea v-model="plan.medications" outlined tile dense rows="4" class="rounded-0 mb-4"
                placeholder="1. Amoxicillin 500mg · 3x/day · 7 days
2. Paracetamol 1g · as needed for pain · max 4x/day
3. Normal saline 500ml IV · every 8h..."></v-textarea>

              <div class="section-label mb-3">STRUCTURED PRESCRIPTION ORDERS</div>
              <div v-for="(row, index) in prescriptionRows" :key="index" class="order-row pa-3 mb-3">
                <v-row dense>
                  <v-col cols="12" md="4">
                    <v-combobox v-model="row.medication" :items="commonMedications" label="Medication" outlined tile dense hide-details></v-combobox>
                  </v-col>
                  <v-col cols="6" md="2">
                    <v-text-field v-model="row.dosage" label="Dose" outlined tile dense hide-details></v-text-field>
                  </v-col>
                  <v-col cols="6" md="2">
                    <v-select v-model="row.route" :items="routes" label="Route" outlined tile dense hide-details></v-select>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-select v-model="row.frequency" :items="frequencies" label="Frequency" outlined tile dense hide-details></v-select>
                  </v-col>
                  <v-col cols="12" md="1" class="d-flex align-center justify-end">
                    <v-btn icon small @click="removePrescription(index)" :disabled="prescriptionRows.length === 1"><v-icon small color="#C0392B">mdi-delete</v-icon></v-btn>
                  </v-col>
                </v-row>
                <v-row dense class="mt-2">
                  <v-col cols="6" md="3"><v-text-field v-model="row.duration" label="Duration" outlined tile dense hide-details></v-text-field></v-col>
                  <v-col cols="6" md="3"><v-select v-model="row.dispenseAt" :items="['Hospital pharmacy','External pharmacy','Ward stock','Patient supplied']" label="Dispense" outlined tile dense hide-details></v-select></v-col>
                  <v-col cols="12" md="6"><v-text-field v-model="row.instructions" label="Instructions" outlined tile dense hide-details></v-text-field></v-col>
                </v-row>
              </div>
              <v-btn small tile outlined color="#003366" class="font-weight-black text-caption mb-4" @click="addPrescription">
                <v-icon left small>mdi-plus</v-icon>Add medication order
              </v-btn>

              <label class="form-label">Ordered laboratory tests</label>
              <v-select v-model="plan.labOrders"
                :items="['CBC','CRP','ESR','Fasting glucose','Creatinine/Urea','Electrolyte panel','Liver function tests','Blood culture','Urine culture','Malaria smear/RDT','CD4/Viral load','Pregnancy test','Lipid profile']"
                multiple outlined tile dense class="rounded-0 mb-4"></v-select>

              <label class="form-label">Ordered imaging</label>
              <v-select v-model="plan.imagingOrders"
                :items="['Chest X-ray','Abdominal X-ray','Abdominal ultrasound','Pelvic ultrasound','Obstetric ultrasound','Brain CT scan','Chest CT scan','MRI','Mammography','ECG']"
                multiple outlined tile dense class="rounded-0 mb-4"></v-select>

              <label class="form-label">Other orders (diet, physiotherapy, social support...)</label>
              <v-textarea v-model="plan.otherOrders" outlined tile dense rows="2" class="rounded-0 mb-4"
                placeholder="Low-salt diet, physiotherapy, psychosocial support, social assistance..."></v-textarea>
            </div>
          </v-card>

          <!-- Medical progress note -->
          <v-card flat tile class="gov-card b-1 shadow-sm mb-6 overflow-hidden">
            <div class="pa-3 bg-navy white--text font-weight-black text-caption ls-1 uppercase">
              <v-icon left small dark>mdi-note-edit</v-icon>MEDICAL PROGRESS NOTE (SOAP)
            </div>
            <div class="pa-6">
              <label class="form-label">S — Subjective (patient-reported symptoms)</label>
              <v-textarea v-model="soap.subjective" outlined tile dense rows="2" class="rounded-0 mb-3"
                placeholder="What the patient reports..."></v-textarea>

              <label class="form-label">O — Objective (clinical and diagnostic findings)</label>
              <v-textarea v-model="soap.objective" outlined tile dense rows="2" class="rounded-0 mb-3"
                placeholder="Physical examination, vital signs, laboratory or imaging results..."></v-textarea>

              <label class="form-label">A — Assessment (clinical interpretation)</label>
              <v-textarea v-model="soap.assessment" outlined tile dense rows="2" class="rounded-0 mb-3"
                placeholder="Working diagnosis, progression, clinical assessment..."></v-textarea>

              <label class="form-label">P — Plan (actions thérapeutiques)</label>
              <v-textarea v-model="soap.plan" outlined tile dense rows="2" class="rounded-0 mb-4"
                placeholder="Treatments, follow-up, education, disposition..."></v-textarea>
            </div>
          </v-card>

          <!-- Final disposition -->
          <v-card flat tile class="gov-card b-1 shadow-sm mb-6 overflow-hidden">
            <div class="pa-3 bg-navy white--text font-weight-black text-caption ls-1 uppercase">
              <v-icon left small dark>mdi-door-open</v-icon>END OF CONSULTATION DECISION
            </div>
            <div class="pa-6">
              <label class="form-label">Decision <span class="error--text">*</span></label>
              <v-select v-model="outcome.decision"
                :items="['Discharge home','Admission','Inter-facility referral','Emergency care','Outpatient follow-up','Scheduled surgery']"
                :rules="[v => !!v || 'Required']" outlined tile dense class="rounded-0 mb-4"></v-select>

              <label class="form-label">Next appointment date</label>
              <v-text-field v-model="outcome.nextAppointment" type="date" outlined tile dense class="rounded-0 mb-4"></v-text-field>

              <v-expand-transition>
                <div v-if="outcome.decision === 'Admission'" class="decision-box pa-4 mb-4">
                  <div class="section-label mb-3">ADMISSION ORDER</div>
                  <v-row dense>
                    <v-col cols="12" md="4"><v-select v-model="admission.ward" :items="wards" label="Ward" outlined tile dense></v-select></v-col>
                    <v-col cols="12" md="4"><v-text-field v-model="admission.bedNumber" label="Bed" outlined tile dense></v-text-field></v-col>
                    <v-col cols="12" md="4"><v-select v-model="admission.admissionType" :items="admissionTypes" label="Type" outlined tile dense></v-select></v-col>
                  </v-row>
                  <v-textarea v-model="admission.admissionReason" label="Admission reason" rows="2" outlined tile dense></v-textarea>
                </div>
              </v-expand-transition>

              <v-expand-transition>
                <div v-if="outcome.decision === 'Inter-facility referral'" class="decision-box pa-4 mb-4">
                  <div class="section-label mb-3">REFERRAL ORDER</div>
                  <v-text-field v-model="referral.toFacility" label="Receiving facility" outlined tile dense></v-text-field>
                  <v-row dense>
                    <v-col cols="12" md="6"><v-select v-model="referral.specialty" :items="referralSpecialties" label="Specialty" outlined tile dense></v-select></v-col>
                    <v-col cols="12" md="6"><v-select v-model="referral.priority" :items="['Routine','Urgent','Emergency']" label="Priority" outlined tile dense></v-select></v-col>
                  </v-row>
                  <v-textarea v-model="referral.reason" label="Reason and stabilization given" rows="2" outlined tile dense></v-textarea>
                </div>
              </v-expand-transition>

              <v-expand-transition>
                <div v-if="outcome.decision === 'Discharge home'" class="decision-box pa-4 mb-4">
                  <div class="section-label mb-3">DISCHARGE SUMMARY</div>
                  <v-textarea v-model="discharge.condition" label="Condition at discharge" rows="2" outlined tile dense></v-textarea>
                  <v-textarea v-model="discharge.warningSigns" label="Return immediately if" rows="2" outlined tile dense></v-textarea>
                  <v-textarea v-model="discharge.homeCare" label="Home care and prevention" rows="2" outlined tile dense></v-textarea>
                </div>
              </v-expand-transition>

              <div class="section-label mb-3">BILLING AND FOLLOW-UP</div>
              <v-row dense>
                <v-col cols="12" md="6"><v-text-field v-model.number="billing.consultationFee" label="Consultation fee" type="number" outlined tile dense suffix="XAF"></v-text-field></v-col>
                <v-col cols="12" md="6"><v-select v-model="billing.paymentClass" :items="['Cash','Insurance','Charity','Waived','Corporate']" label="Payment class" outlined tile dense></v-select></v-col>
              </v-row>

              <label class="form-label">Instructions given to the patient / caregiver</label>
              <v-textarea v-model="outcome.patientInstructions" outlined tile dense rows="3" class="rounded-0 mb-4"
                placeholder="Warning signs to monitor, dietary guidance, how to take medications..."></v-textarea>
            </div>
          </v-card>

          <!-- Actions -->
          <div class="d-flex justify-end" style="gap:12px">
            <v-btn large tile depressed outlined color="#003366" class="font-weight-black text-caption px-8"
              :to="`/clinical/patients/${$route.params.id}`">
              Cancel
            </v-btn>
            <v-btn large tile depressed color="#003366" dark class="font-weight-black text-caption px-8"
              :disabled="!valid" :loading="saving" @click="save">
              <v-icon left>mdi-content-save</v-icon>SAVE MEDICAL CONSULTATION
            </v-btn>
          </div>

        </v-col>
      </v-row>
    </v-form>

    <style scoped>
    .vital-badge { display:flex; flex-direction:column; align-items:center; background:#f8fafc; border:1px solid #e2e8f0; padding:8px 16px; border-radius:2px; min-width:80px; }
    .vital-badge span { font-size:10px; color:#6b7280; font-weight:700; text-transform:uppercase; letter-spacing:.5px; }
    .vital-badge strong { font-size:14px; color:#003366; }
    .order-row, .decision-box { background:#F8FAFC; border:1px solid #E5E7EB; }
    </style>

  </v-container>
</template>

<script>
export default {
  layout: 'admins',

  data() {
    return {
      valid: false,
      saving: false,

      encounter: {
        chiefComplaint: '', historyOfIllness: '', medicalHistory: '',
        surgicalHistory: '', familyHistory: '', allergies: '',
        currentMeds: '', riskFactors: []
      },

      exam: {
        generalState: 'Good general condition',
        cardiovascular: '', respiratory: '', abdominal: '',
        neurological: '', other: '', clinicalFindings: ''
      },

      diagnosis: {
        primary: '', differentials: [], comorbidities: [],
        severity: 'Mild'
      },

      plan: {
        medications: '', labOrders: [], imagingOrders: [], otherOrders: ''
      },

      prescriptionRows: [
        { medication: '', dosage: '', route: 'Oral', frequency: '', duration: '', dispenseAt: 'Hospital pharmacy', instructions: '' }
      ],

      commonMedications: [
        'Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Amoxicillin-Clavulanate', 'Ceftriaxone',
        'Metronidazole', 'Ciprofloxacin', 'Azithromycin', 'Doxycycline', 'Artemether-Lumefantrine',
        'Quinine', 'ORS', 'Zinc Sulfate', 'Omeprazole', 'Amlodipine', 'Metformin', 'Salbutamol',
        'Normal Saline', 'Ringer Lactate', 'Iron + Folic Acid'
      ],
      routes: ['Oral', 'IV', 'IM', 'Topical', 'Inhalation', 'Sublingual', 'Rectal'],
      frequencies: ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Every 8 hours', 'Every 6 hours', 'As needed (PRN)', 'Single dose'],

      soap: {
        subjective: '', objective: '', assessment: '', plan: ''
      },

      outcome: {
        decision: '', nextAppointment: '', patientInstructions: ''
      },

      admission: {
        ward: 'General Medicine', bedNumber: '', admissionType: 'Medical', admissionReason: ''
      },
      wards: ['General Medicine', 'Emergency Observation', 'Maternity', 'Paediatrics', 'Surgery', 'Isolation'],
      admissionTypes: ['Emergency', 'Medical', 'Surgical', 'Maternity', 'Paediatric', 'Observation'],

      referral: {
        toFacility: '', specialty: 'General Medicine', priority: 'Routine', reason: ''
      },
      referralSpecialties: ['General Medicine', 'Emergency', 'Surgery', 'Obstetrics', 'Paediatrics', 'Internal Medicine', 'Radiology', 'Laboratory'],

      discharge: {
        condition: '', warningSigns: '', homeCare: ''
      },

      billing: {
        consultationFee: 5000,
        paymentClass: 'Cash'
      }
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
    hasAllergy() { return !!(this.patient && this.patient.allergies && this.patient.allergies.trim()) },

    lastVitals() {
      const all = (this.$store.getters['clinical/getVitalSigns'] || [])
        .filter(v => v.patientId === this.$route.params.id)
      if (!all.length) return null
      return [...all].sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))[0]
    }
  },

  methods: {
    calculatedAge(dob) {
      if (!dob) return '—'
      return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    },
    formatDate(iso) {
      if (!iso) return '—'
      return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    },

    addPrescription() {
      this.prescriptionRows.push({ medication: '', dosage: '', route: 'Oral', frequency: '', duration: '', dispenseAt: 'Hospital pharmacy', instructions: '' })
    },

    removePrescription(index) {
      if (this.prescriptionRows.length > 1) this.prescriptionRows.splice(index, 1)
    },

    async save() {
      if (!this.$refs.form.validate()) return
      this.saving = true
      try {
        const patientId  = this.$route.params.id
        const recordedBy = this.$store.state.auth.fullName
        const now        = new Date().toISOString()

        // 1. Record the medical encounter
        await this.$store.dispatch('clinical/logVisit', {
          patientId,
          encounterType: 'MÉDICAL',
          chiefComplaint: this.encounter.chiefComplaint,
          diagnosis: this.diagnosis.primary,
          recordedBy,
          createdAt: now
        })

        // 2. Record the complete medical note
        await this.$store.dispatch('clinical/addMedicalNote', {
          patientId, recordedBy, recordedAt: now,
          diagnosis: this.diagnosis.primary,
          differentials: this.diagnosis.differentials,
          severity: this.diagnosis.severity,
          clinicalFindings: this.exam.clinicalFindings,
          plan: this.plan.medications,
          soap: { ...this.soap },
          outcome: { ...this.outcome },
          admission: { ...this.admission },
          referral: { ...this.referral },
          discharge: { ...this.discharge },
          billing: { ...this.billing },
          prescriptions: this.prescriptionRows.filter(row => row.medication),
          exam: { ...this.exam },
          encounter: { ...this.encounter }
        })

        // 3. Create structured medication orders and legacy free-text fallback
        const structuredPrescriptions = this.prescriptionRows.filter(row => row.medication)
        for (const prescription of structuredPrescriptions) {
          const medicationOrder = await this.$store.dispatch('clinical/prescribeMedication', {
            patientId,
            medication: prescription.medication,
            dosage: prescription.dosage,
            route: prescription.route,
            frequency: prescription.frequency,
            duration: prescription.duration,
            notes: prescription.instructions,
            dispenseAt: prescription.dispenseAt,
            prescribedBy: recordedBy
          })
          await this.$store.dispatch('clinical/createTask', {
            patientId,
            relatedType: 'medication',
            relatedId: medicationOrder.id,
            title: `Administer ${prescription.medication}`,
            assignedToRole: 'NURSE',
            actionReason: `Medication order ${medicationOrder.id} generated from medical encounter`
          })
        }

        if (this.plan.medications && structuredPrescriptions.length === 0) {
          const medicationOrder = await this.$store.dispatch('clinical/prescribeMedication', {
            patientId,
            medication: 'Free-text prescription',
            prescriptionText: this.plan.medications,
            prescribedBy: recordedBy
          })
          await this.$store.dispatch('clinical/createTask', {
            patientId,
            relatedType: 'medication',
            relatedId: medicationOrder.id,
            title: 'Administer prescribed medication',
            assignedToRole: 'NURSE',
            actionReason: `Medication order ${medicationOrder.id} generated from medical encounter`
          })
        }

        // 4. Create laboratory orders if selected
        for (const test of this.plan.labOrders) {
          const labOrder = await this.$store.dispatch('clinical/orderLab', {
            patientId, testName: test, orderedBy: recordedBy
          })
          await this.$store.dispatch('clinical/createTask', {
            patientId,
            relatedType: 'lab',
            relatedId: labOrder.id,
            title: `Process lab order: ${test}`,
            assignedToRole: 'LAB',
            actionReason: `Lab order ${labOrder.id} generated from medical encounter`
          })
        }

        // 5. Create imaging orders
        for (const img of this.plan.imagingOrders) {
          const imagingOrder = await this.$store.dispatch('clinical/orderImaging', {
            patientId, modality: img, orderedBy: recordedBy
          })
          await this.$store.dispatch('clinical/createTask', {
            patientId,
            relatedType: 'imaging',
            relatedId: imagingOrder.id,
            title: `Process imaging order: ${img}`,
            assignedToRole: 'IMAGING',
            actionReason: `Imaging order ${imagingOrder.id} generated from medical encounter`
          })
        }

        // 6. Admit the patient if needed
        if (this.outcome.decision === 'Admission') {
          await this.$store.dispatch('clinical/admitPatient', {
            patientId,
            admittedBy: recordedBy,
            diagnosis: this.diagnosis.primary,
            ward: this.admission.ward,
            bedNumber: this.admission.bedNumber,
            admissionType: this.admission.admissionType,
            admissionReason: this.admission.admissionReason || this.encounter.chiefComplaint,
            treatment: this.soap.plan || this.plan.medications,
            attendingDoctor: recordedBy,
            admissionDate: new Date().toISOString().slice(0, 10)
          })
        }

        if (this.outcome.decision === 'Inter-facility referral') {
          await this.$store.dispatch('clinical/createReferral', {
            patientId,
            toFacility: this.referral.toFacility || 'Higher-level referral facility',
            specialty: this.referral.specialty,
            priority: this.referral.priority,
            reason: this.referral.reason || this.diagnosis.primary,
            clinicalSummary: `${this.encounter.chiefComplaint}. Diagnosis: ${this.diagnosis.primary}. Treatment: ${this.soap.plan || this.plan.medications}`,
            createdBy: recordedBy
          })
        }

        if (this.outcome.nextAppointment) {
          await this.$store.dispatch('clinical/scheduleAppointment', {
            patientId,
            date: this.outcome.nextAppointment,
            time: '08:00',
            provider: recordedBy,
            type: 'Medical follow-up',
            reason: this.diagnosis.primary
          })
        }

        if (this.billing.consultationFee || this.plan.labOrders.length || this.plan.imagingOrders.length) {
          await this.$store.dispatch('clinical/createInvoice', {
            patientId,
            amount: Number(this.billing.consultationFee || 0) + (this.plan.labOrders.length * 2500) + (this.plan.imagingOrders.length * 5000),
            paymentMethod: this.billing.paymentClass,
            description: `Medical consultation: ${this.diagnosis.primary}`,
            createdBy: recordedBy
          })
        }

        if (this.outcome.decision === 'Discharge home') {
          await this.$store.dispatch('clinical/createDocument', {
            patientId,
            title: `Discharge summary - ${this.diagnosis.primary}`,
            category: 'Discharge Summary',
            content: `Diagnosis: ${this.diagnosis.primary}\nCondition: ${this.discharge.condition}\nTreatment: ${this.soap.plan || this.plan.medications}\nInstructions: ${this.outcome.patientInstructions}\nReturn if: ${this.discharge.warningSigns}\nHome care: ${this.discharge.homeCare}`,
            status: 'Filed'
          })
        }

        this.$toast.success('Medical consultation saved successfully')
        this.$router.push(`/clinical/patients/${patientId}`)
      } catch (e) {
        this.$toast.error('An error occurred while saving the record')
      } finally {
        this.saving = false
      }
    }
  }
}
</script>
