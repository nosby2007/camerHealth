
<template>
  <v-container fluid class="gov-content pa-10">
    <!-- Header: Non-Printable -->
    <v-row class="mb-10 no-gutters align-center no-print">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar tile color="#00A99D" size="48" class="mr-4 shadow-sm">
             <v-icon dark>mdi-file-clock</v-icon>
          </v-avatar>
          <div>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">NATIONAL SURVEILLANCE & RESPONSE DATA</span>
            <h1 class="text-h4 font-weight-black gov-text-primary ls-tight uppercase">CLINICAL DATA</h1>
          </div>
        </div>
      </v-col>
    </v-row>
    
    <v-row class="no-gutters no-print">
      <!-- Site-Level Logging Form -->
      <v-col cols="12" lg="4">
        <v-card flat tile class="gov-card b-1 overflow-y-auto shadow-sm" style="max-height: 80vh;">
          <div class="pa-4 bg-navy white--text font-weight-black text-caption ls-1 uppercase sticky-header d-flex justify-space-between align-center">
             <span>EPIDEMIOLOGICAL INCIDENT REPORT FORM</span>
             <!-- Prominent Export Button Inside Form Header -->
             <v-btn x-small color="white" light depressed tile height="28" class="font-weight-black text-caption ls-1" @click="printRecord">
                <v-icon left x-small>mdi-file-pdf-box</v-icon> EXPORT PDF
             </v-btn>
          </div>
          <div class="pa-8">
            <v-alert v-if="!form.patientId || !form.disease" dense text type="info" color="#00A99D" class="mb-6 text-caption font-weight-bold">
               Fill Patient and Disease data to enable detailed PDF export.
            </v-alert>

            <v-form ref="form" v-model="valid">
              <v-autocomplete 
                v-model="form.patientId" 
                :items="patientItems" 
                item-text="label" 
                item-value="id" 
                label="Patient's Code" 
                flat outlined tile dense 
                required
                class="mb-6 rounded-0"
              ></v-autocomplete>
              
              <v-select 
                v-model="form.disease" 
                :items="groupedDiseases" 
                label="Diagnosis Categorization" 
                flat outlined tile dense 
                required
                @change="onDiseaseChange"
                class="mb-6 rounded-0"
              ></v-select>

              <div class="text-caption font-weight-black grey--text text--darken-3 mb-2 uppercase px-2 ls-1 font-italic">Clinical Severity Index</div>
              <v-btn-toggle v-model="form.severity" mandatory class="gov-toggle mb-6" dense block tile>
                 <v-btn value="Low" small text tile>Low</v-btn>
                 <v-btn value="Moderate" small text tile>Moderate</v-btn>
                 <v-btn value="High" small text tile>High</v-btn>
                 <v-btn value="Critical" small text tile>Critical</v-btn>
              </v-btn-toggle>
              
              <div class="text-caption font-weight-black grey--text text--darken-3 mb-2 uppercase px-2 ls-1 font-italic">Current Clinical Status</div>
              <v-btn-toggle v-model="form.status" mandatory class="gov-toggle mb-8" dense block tile>
                 <v-btn value="Suspected" small text tile>Suspected</v-btn>
                 <v-btn value="Confirmed" small text tile>Confirmed</v-btn>
                 <v-btn value="Recovered" small text tile>Recovered</v-btn>
                 <v-btn value="Deceased" small text tile>Deceased</v-btn>
              </v-btn-toggle>
              
              <v-select 
                v-model="form.symptoms" 
                :items="allSymptoms" 
                label="Observable Symptoms" 
                multiple 
                flat outlined tile dense
                class="mb-4 rounded-0"
              ></v-select>
              <v-textarea v-model="form.symptomText" label="Symptom Details (Free text)" rows="2" outlined tile dense class="mb-6 rounded-0"></v-textarea>

              <div class="gov-input-section pa-5 mb-4">
                <div class="text-caption font-weight-black gov-text-secondary mb-3 uppercase ls-1">Diagnosis</div>
                <v-textarea v-model="form.diagnosis" label="Diagnosis" rows="2" outlined tile dense class="bg-white rounded-0 mb-0"></v-textarea>
              </div>

              <div class="gov-input-section pa-5 mb-4">
                <div class="text-caption font-weight-black gov-text-secondary mb-3 uppercase ls-1">Investigations</div>
                <v-text-field v-model="form.labResults"    label="Lab Results"         outlined tile dense class="mb-2 bg-white rounded-0"></v-text-field>
                <v-text-field v-model="form.imagingNotes"  label="Imaging / CT Notes"  outlined tile dense class="mb-0 bg-white rounded-0"></v-text-field>
              </div>

              <div class="gov-input-section pa-5 mb-6">
                <div class="text-caption font-weight-black gov-text-secondary mb-3 uppercase ls-1">Treatment</div>
                <v-text-field v-model="form.prescription"  label="Prescription / Protocol" outlined tile dense class="mb-2 bg-white rounded-0"></v-text-field>
                <v-textarea   v-model="form.treatment"     label="Treatment Plan"          rows="2" outlined tile dense class="bg-white rounded-0 mb-0"></v-textarea>
              </div>

              <v-expand-transition>
                <div v-if="isChronic" class="gov-vital-box pa-5 mb-6">
                  <div class="text-caption font-weight-black gov-green--text mb-3 uppercase ls-1">Chronic Monitoring Records</div>
                  <v-row dense>
                    <v-col cols="6">
                      <v-text-field v-model="form.vitals.bloodPressure" label="Sys/Dia BP (mmHg)" outlined tile dense hide-details class="bg-white rounded-0"></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field v-model="form.vitals.bloodSugar" label="Glucose Index" outlined tile dense hide-details class="bg-white rounded-0"></v-text-field>
                    </v-col>
                  </v-row>
                </div>
              </v-expand-transition>

              <v-textarea v-model="form.notes" label="Authorized Clinical Observations" rows="3" flat outlined tile dense class="mb-10 rounded-0 font-weight-bold gov-text-primary"></v-textarea>
              
              <v-row dense>
                <v-col cols="8">
                  <v-btn color="#00A99D" dark block height="54" tile depressed :disabled="!valid || !form.patientId" @click="saveVisit" class="font-weight-black text-caption ls-1">
                    COMMIT RECORD
                    <v-icon right small>mdi-cloud-upload-outline</v-icon>
                  </v-btn>
                </v-col>
                <v-col cols="4">
                   <v-btn color="#00A99D" dark block height="54" tile depressed @click="printRecord" class="font-weight-black text-caption ls-1">
                    <v-icon>mdi-printer</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </div>
        </v-card>
      </v-col>

      <!-- Institutional Incident History -->
      <v-col cols="12" lg="8" class="pl-lg-8 shadow-sm">
        <v-card flat tile class="gov-card b-1 overflow-hidden h-100">
          <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center shadow-sm">
             <v-icon left small color="#003366">mdi-history</v-icon>
             <span class="text-caption font-weight-black grey--text text-uppercase ls-1">Chronological Site-Level Incident Audit Stream</span>
          </div>
          <v-data-table :headers="headers" :items="visitsWithDetails" class="gov-spreadsheet-table" tile elevation="0">
            <template v-slot:item.patientName="{ item }">
              <span class="text-body-2 font-weight-black gov-text-primary">{{ item.patientName.toUpperCase() }}</span>
              <div class="text-caption grey--text font-weight-bold opacity-40">{{ item.patientId }}</div>
            </template>
            <template v-slot:item.disease="{ item }">
              <v-chip label x-small dark :color="item.type === 'Chronic' ? '#C0392B' : '#003366'" class="font-weight-black">
                {{ item.disease.toUpperCase() }}
              </v-chip>
            </template>
            <template v-slot:item.severity="{ item }">
               <v-chip x-small outlined :color="getSeverityColor(item.severity)" class="font-weight-black">{{ item.severity.toUpperCase() }}</v-chip>
            </template>
            <template v-slot:item.createdAt="{ item }">
              <div class="text-caption font-weight-black gov-text-primary lh-1 mb-1">{{ new Date(item.createdAt).toLocaleDateString() }}</div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- HIDDEN PRINT TEMPLATE (PDF Generation Layer) -->
    <div id="medical-report-print" class="printable-only">
       <div class="print-header d-flex justify-space-between align-center border-bottom pb-6 mb-8">
          <div>
             <div class="text-h6 font-weight-black gov-text-primary uppercase">CameroHealth</div>
             <div class="text-caption font-weight-bold grey--text uppercase">MINISTRY OF PUBLIC HEALTH</div>
             <div class="text-caption font-weight-bold grey--text uppercase">Digitalising Health, Improving Care</div>
          </div>
          <div class="text-right">
             <div class="text-h6 font-weight-black error--text uppercase">CLINICAL INCIDENT REPORT</div>
             <div class="text-caption font-weight-bold uppercase">ARCHIVE ID: {{ form.patientId || 'NEW-RECORD' }}-{{ Date.now() }}</div>
          </div>
       </div>

       <div class="print-section mb-8">
          <div class="text-caption font-weight-black bg-grey-lighten-4 pa-2 border-bottom uppercase mb-4">FACILITY INFORMATION</div>
          <v-row dense>
             <v-col cols="6"><span class="font-weight-bold mr-2">INSTITUTION:</span> {{ institution }}</v-col>
             <v-col cols="6"><span class="font-weight-bold mr-2">LOCATION:</span> {{ region }}</v-col>
             <v-col cols="6"><span class="font-weight-bold mr-2">ATTENDING STAFF:</span> {{ staffName }}</v-col>
             <v-col cols="6"><span class="font-weight-bold mr-2">STAFF ID:</span> {{ staffId }}</v-col>
          </v-row>
       </div>

       <div class="print-section mb-8">
          <div class="text-caption font-weight-black bg-grey-lighten-4 pa-2 border-bottom uppercase mb-4">PATIENT IDENTIFICATION</div>
          <v-row dense>
             <v-col cols="6"><span class="font-weight-bold mr-2">FULL NAME:</span> {{ selectedPatient ? selectedPatient.name : 'UNSPECIFIED' }}</v-col>
             <v-col cols="6"><span class="font-weight-bold mr-2">PATIENT ID:</span> {{ form.patientId || 'PENDING' }}</v-col>
             <v-col cols="3"><span class="font-weight-bold mr-2">AGE:</span> {{ selectedPatient ? selectedPatient.age : '--' }}</v-col>
             <v-col cols="3"><span class="font-weight-bold mr-2">GENDER:</span> {{ selectedPatient ? selectedPatient.gender : '--' }}</v-col>
          </v-row>
       </div>

       <div class="print-section mb-8">
          <div class="text-caption font-weight-black bg-grey-lighten-4 pa-2 border-bottom uppercase mb-4">EPIDEMIOLOGICAL ASSESSMENT</div>
          <v-row dense>
             <v-col cols="6"><span class="font-weight-bold mr-2">DIAGNOSIS:</span> {{ form.diagnosis || (form.disease ? form.disease.toUpperCase() : 'PENDING') }}</v-col>
             <v-col cols="6"><span class="font-weight-bold mr-2">SEVERITY:</span> {{ form.severity.toUpperCase() }}</v-col>
             <v-col cols="6"><span class="font-weight-bold mr-2">STATUS:</span> {{ form.status.toUpperCase() }}</v-col>
             <v-col cols="12" class="mt-2"><span class="font-weight-bold mr-2">SYMPTOMS:</span> {{ form.symptoms.length ? form.symptoms.join(', ') : 'NONE RECORDED' }} {{ form.symptomText ? '| ' + form.symptomText : '' }}</v-col>
          </v-row>
       </div>

       <div class="print-section mb-8" v-if="isChronic">
          <div class="text-caption font-weight-black bg-grey-lighten-4 pa-2 border-bottom uppercase mb-4">CLINICAL VITALS (CHRONIC)</div>
          <v-row dense>
             <v-col cols="6"><span class="font-weight-bold mr-2">BLOOD PRESSURE:</span> {{ form.vitals.bloodPressure || 'N/A' }} mmHg</v-col>
             <v-col cols="6"><span class="font-weight-bold mr-2">BLOOD SUGAR:</span> {{ form.vitals.bloodSugar || 'N/A' }}</v-col>
          </v-row>
       </div>

       <div class="print-section mb-8">
          <div class="text-caption font-weight-black bg-grey-lighten-4 pa-2 border-bottom uppercase mb-4">INVESTIGATIONS</div>
          <div class="mb-4"><span class="font-weight-bold">LAB RESULTS:</span> {{ form.labResults || 'NO LAB DATA RECORDED' }}</div>
          <div class="mb-4"><span class="font-weight-bold">IMAGING NOTES:</span> {{ form.imagingNotes || 'NO IMAGING DATA RECORDED' }}</div>
       </div>

       <div class="print-section mb-8">
          <div class="text-caption font-weight-black bg-grey-lighten-4 pa-2 border-bottom uppercase mb-4">TREATMENT</div>
          <div class="mb-4"><span class="font-weight-bold">PRESCRIPTION:</span> {{ form.prescription || 'NONE PRESCRIBED' }}</div>
          <div class="mb-4"><span class="font-weight-bold">TREATMENT PLAN:</span> {{ form.treatment || 'NONE RECORDED' }}</div>
          <div class="mb-4 border pa-4 font-italic"><span class="font-weight-black block mb-2">CLINICAL OBSERVATIONS:</span> {{ form.notes || 'No additional comments provided' }}</div>
       </div>

       <div class="print-footer mt-12 pt-12 border-top d-flex justify-space-between align-end">
          <div><div class="border-top-black pt-2 px-8 text-center text-caption font-weight-black">OFFICIAL STAMP / SEAL</div></div>
          <div class="text-right">
             <div class="text-caption font-weight-bold">REPORT GENERATED: {{ new Date().toLocaleString() }}</div>
             <div class="text-caption font-weight-bold">AUTHORIZED SIGNATURE: ____________________</div>
          </div>
       </div>
    </div>
  </v-container>
</template>

<script>
import { diseaseInfo } from '@/store/diseases'

export default {
  data() {
    return {
      valid: false,
      form: { 
        patientId: '', disease: '', status: 'Suspected', severity: 'Low', symptoms: [], symptomText: '',
        diagnosis: '', labResults: '', imagingNotes: '', prescription: '', treatment: '',
        notes: '', vitals: { bloodPressure: '', bloodSugar: '' } 
      },
      headers: [
        { text: 'IDENTIFIED CASE', value: 'patientName' },
        { text: 'EPIDEMIOLOGICAL FOCUS', value: 'disease' },
        { text: 'SEVERITY', value: 'severity', align: 'center' },
        { text: 'STATUS', value: 'status', align: 'center' },
        { text: 'LOG TIMESTAMP', value: 'createdAt', align: 'right' }
      ]
    }
  },
  computed: {
    patients() { return this.$store.getters['clinical/getPatients'] },
    patientItems() {
      return this.patients.map(p => ({ id: p.id, label: `${p.id} — ${p.name}` }))
    },
    visits() { return this.$store.getters['clinical/getVisits'] },
    institution() { return this.$store.state.auth.institution },
    region() { return this.$store.state.auth.region },
    staffName() { return this.$store.state.auth.user ? this.$store.state.auth.user.username : 'Authorized Staff' },
    staffId() { return this.$store.state.auth.staffId },
    selectedPatient() { return this.patients.find(p => p.id === this.form.patientId) },
    visitsWithDetails() {
      return this.visits.map(v => {
        const p = this.patients.find(pat => pat.id === v.patientId);
        const info = diseaseInfo[v.disease.toLowerCase().replace(/\s+/g, '_')] || {};
        return { ...v, patientName: p ? p.name : 'Unknown Record', type: info.type || 'Infectious' }
      }).reverse()
    },
    groupedDiseases() {
      const items = []; const chronic = []; const infectious = [];
      Object.keys(diseaseInfo).forEach(key => {
        const info = diseaseInfo[key]; const item = { text: info.name, value: info.name };
        if (info.type === 'Chronic') chronic.push(item); else infectious.push(item);
      });
      return [ ...infectious, ...chronic ];
    },
    isChronic() {
      if (!this.form.disease) return false;
      const key = this.form.disease.toLowerCase().replace(/\s+/g, '_');
      const info = diseaseInfo[key];
      return info && info.type === 'Chronic';
    },
    allSymptoms() { return ['Fever', 'Cough', 'Fatigue', 'Vomiting', 'Diarrhea', 'Rash', 'Headache', 'Pain', 'Dizziness', 'Palpitations'] }
  },
  methods: {
    onDiseaseChange() { this.form.vitals = { bloodPressure: '', bloodSugar: '' } },
    getSeverityColor(s) {
       const colors = { 'Low': '#00A99D', 'Moderate': '#F4A300', 'High': '#C0392B', 'Critical': '#C0392B' }
       return colors[s] || '#6B7280';
    },
    saveVisit() {
      if (this.$refs.form.validate()) {
        const info = diseaseInfo[this.form.disease.toLowerCase().replace(/\s+/g, '_')] || {};
        this.$store.dispatch('clinical/logVisit', { ...this.form, type: info.type || 'Infectious' })
        this.$refs.form.reset(); this.form.status = 'Suspected'; this.form.severity = 'Low';
        this.$toast.success('Clinical incident record committed safely.');
      } else {
        this.$toast.error('Please complete mandatory fields.');
      }
    },
    printRecord() {
       window.print();
    }
  }
}
</script>

<style scoped>
.gov-card { background: white !important; }
.bg-navy { background-color: #003366 !important; }
.gov-text-primary { color: #1B1F23 !important; }
.gov-text-secondary { color: #00A99D !important; }
.gov-green--text { color: #003366 !important; }
.sticky-header { position: sticky; top: 0; z-index: 20; }
.gov-toggle { background: #F8FAFC !important; border: 1px solid #E2E8F0 !important; padding: 2px;
  .v-btn { border: none !important; color: #6B7280 !important; font-size: 10px !important; font-weight: 800;
    &.v-btn--active { background: #003366 !important; color: white !important; }
  }
}
.gov-input-section { background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid #00A99D; }
.gov-vital-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid #003366; }
.gov-spreadsheet-table { background: white !important;
  ::v-deep th { background: #F8FAFC !important; color: #1B1F23 !important; font-size: 10px !important; font-weight: 800; text-transform: uppercase; }
}
.ls-1 { letter-spacing: 1px; }
.ls-tight { letter-spacing: -1.2px; }
.uppercase { text-transform: uppercase; }
.border-bottom { border-bottom: 1px solid #E5E7EB; }
.b-1 { border: 1px solid #E5E7EB; }
.shadow-sm { box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }
.printable-only { display: none; }
@media print {
  .no-print { display: none !important; }
  .printable-only { display: block !important; padding: 40px; background: white; font-family: 'Inter', sans-serif; }
  .border-top-black { border-top: 2px solid black; }
  .bg-grey-lighten-4 { background-color: #f5f5f5 !important; -webkit-print-color-adjust: exact; }
}
</style>
