
<template>
  <v-container fluid class="gov-content pa-10">

    <!-- Header -->
    <v-row class="mb-10 no-gutters align-center">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar tile color="#0B3D2E" size="48" class="mr-4 shadow-sm">
            <v-icon dark>mdi-bed</v-icon>
          </v-avatar>
          <div>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">CLINICAL DATA</span>
            <h1 class="text-h4 font-weight-black gov-text-primary ls-tight uppercase">INPATIENT</h1>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-row class="no-gutters">

      <!-- Admission Form -->
      <v-col cols="12" lg="4">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-navy white--text font-weight-black text-caption ls-1 uppercase">
            {{ editingId ? 'EDIT ADMISSION' : 'NEW ADMISSION' }}
          </div>
          <div class="pa-8">
            <v-form ref="form" v-model="valid">

              <div class="section-label mb-4">PATIENT</div>

              <v-autocomplete
                v-model="form.patientId"
                :items="patientItems"
                item-text="label"
                item-value="id"
                label="Patient's Code"
                flat outlined tile dense required
                :rules="[v => !!v || 'Required']"
                class="mb-4 rounded-0"
              ></v-autocomplete>

              <v-divider class="mb-6 grey lighten-3"></v-divider>
              <div class="section-label mb-4">ADMISSION DETAILS</div>

              <v-text-field
                v-model="form.admissionDate"
                label="Admission Date"
                type="date"
                flat outlined tile dense required
                :rules="[v => !!v || 'Required']"
                class="mb-4 rounded-0"
              ></v-text-field>

              <v-row dense>
                <v-col cols="6">
                  <v-select
                    v-model="form.ward"
                    :items="wards"
                    label="Ward"
                    flat outlined tile dense required
                    :rules="[v => !!v || 'Required']"
                    class="mb-4 rounded-0"
                  ></v-select>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="form.bedNumber"
                    label="Bed No."
                    flat outlined tile dense
                    class="mb-4 rounded-0"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-select
                v-model="form.admissionType"
                :items="['Emergency', 'Elective', 'Maternity', 'Surgical', 'Medical', 'Paediatric', 'ICU']"
                label="Admission Type"
                flat outlined tile dense
                class="mb-4 rounded-0"
              ></v-select>

              <v-textarea
                v-model="form.admissionReason"
                label="Reason for Admission"
                rows="2"
                flat outlined tile dense
                class="mb-4 rounded-0"
              ></v-textarea>

              <v-select
                v-model="form.attendingDoctor"
                :items="doctors"
                label="Attending Doctor"
                flat outlined tile dense
                class="mb-4 rounded-0"
              ></v-select>

              <v-divider class="mb-6 grey lighten-3"></v-divider>
              <div class="section-label mb-4">CLINICAL NOTES</div>

              <v-textarea
                v-model="form.diagnosis"
                label="Diagnosis"
                rows="2"
                flat outlined tile dense
                class="mb-4 rounded-0"
              ></v-textarea>

              <v-textarea
                v-model="form.treatment"
                label="Treatment Plan"
                rows="2"
                flat outlined tile dense
                class="mb-8 rounded-0"
              ></v-textarea>

              <v-row dense>
                <v-col :cols="editingId ? 8 : 12">
                  <v-btn
                    color="#0B3D2E" dark block height="52" tile depressed
                    :disabled="!valid" :loading="loading"
                    @click="save"
                    class="font-weight-black text-caption ls-1"
                  >
                    {{ editingId ? 'UPDATE' : 'ADMIT PATIENT' }}
                    <v-icon right small>mdi-bed-plus</v-icon>
                  </v-btn>
                </v-col>
                <v-col v-if="editingId" cols="4">
                  <v-btn color="grey lighten-2" block height="52" tile depressed @click="cancelEdit" class="font-weight-black text-caption">CANCEL</v-btn>
                </v-col>
              </v-row>

            </v-form>
          </div>
        </v-card>
      </v-col>

      <!-- Inpatient Table -->
      <v-col cols="12" lg="8" class="pl-lg-8">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-grey lighten-4 d-flex align-center border-bottom flex-wrap" style="gap:8px">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search inpatients..."
              single-line hide-details flat outlined tile dense
              class="bg-white rounded-0" style="max-width:280px"
            ></v-text-field>
            <v-spacer />
            <v-btn-toggle v-model="statusFilter" tile dense>
              <v-btn x-small value=""           class="font-weight-black text-caption">ALL</v-btn>
              <v-btn x-small value="Admitted"   class="font-weight-black text-caption">ADMITTED</v-btn>
              <v-btn x-small value="Stable"     class="font-weight-black text-caption">STABLE</v-btn>
              <v-btn x-small value="Critical"   class="font-weight-black text-caption">CRITICAL</v-btn>
              <v-btn x-small value="Discharged" class="font-weight-black text-caption">DISCHARGED</v-btn>
            </v-btn-toggle>
          </div>

          <v-data-table
            :headers="headers"
            :items="filteredInpatients"
            :search="search"
            class="gov-table"
            tile elevation="0"
          >
            <template v-slot:item.patientName="{ item }">
              <div>
                <div class="text-caption font-weight-black grey--text">{{ item.patientId }}</div>
                <div class="text-body-2 font-weight-black gov-text-primary">{{ item.patientName.toUpperCase() }}</div>
              </div>
            </template>
            <template v-slot:item.ward="{ item }">
              <span class="text-caption font-weight-black">{{ item.ward }}</span>
              <span v-if="item.bedNumber" class="text-caption grey--text ml-1">· Bed {{ item.bedNumber }}</span>
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip x-small dark label :color="statusColor(item.status)" class="font-weight-black">{{ item.status.toUpperCase() }}</v-chip>
            </template>
            <template v-slot:item.admissionDate="{ item }">
              <span class="text-caption grey--text font-weight-bold">{{ item.admissionDate }}</span>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                  <v-btn icon x-small v-on="on" @click="editInpatient(item)" class="mr-1">
                    <v-icon small color="#0B3D2E">mdi-pencil</v-icon>
                  </v-btn>
                </template>
                <span>Edit</span>
              </v-tooltip>
              <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                  <v-btn icon x-small v-on="on" @click="setStatus(item, 'Critical')" :disabled="item.status === 'Discharged'">
                    <v-icon small color="#C0392B">mdi-alert-circle</v-icon>
                  </v-btn>
                </template>
                <span>Mark Critical</span>
              </v-tooltip>
              <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                  <v-btn icon x-small v-on="on" @click="confirmDischarge(item)" :disabled="item.status === 'Discharged'">
                    <v-icon small color="#1F7A5C">mdi-exit-run</v-icon>
                  </v-btn>
                </template>
                <span>Discharge</span>
              </v-tooltip>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Discharge Confirmation Dialog -->
    <v-dialog v-model="dischargeDialog" max-width="420" persistent>
      <v-card flat tile class="gov-card b-1">
        <div class="pa-4 bg-teal white--text font-weight-black text-caption ls-1 uppercase">
          CONFIRM PATIENT DISCHARGE
        </div>
        <div class="pa-8">
          <p class="text-body-2 font-weight-bold gov-text-primary mb-1">Discharging:</p>
          <p class="text-h6 font-weight-black gov-text-primary mb-1">{{ dischargeTarget ? dischargeTarget.patientName : '' }}</p>
          <p class="text-caption grey--text mb-6">{{ dischargeTarget ? dischargeTarget.patientId : '' }} — Ward: {{ dischargeTarget ? dischargeTarget.ward : '' }}</p>
          <v-text-field v-model="dischargeNote" label="Discharge Note (optional)" outlined tile dense class="mb-6 rounded-0"></v-text-field>
          <v-row dense>
            <v-col cols="6">
              <v-btn color="#0B3D2E" dark block height="48" tile depressed :loading="loading" @click="doDischarge" class="font-weight-black text-caption">DISCHARGE</v-btn>
            </v-col>
            <v-col cols="6">
              <v-btn color="grey lighten-2" block height="48" tile depressed @click="dischargeDialog = false" class="font-weight-black text-caption">CANCEL</v-btn>
            </v-col>
          </v-row>
        </div>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>
export default {
  head: { title: 'Inpatient' },
  data() {
    return {
      valid: false,
      search: '',
      statusFilter: '',
      loading: false,
      editingId: null,
      dischargeDialog: false,
      dischargeTarget: null,
      dischargeNote: '',
      form: {
        patientId: '', admissionDate: '', ward: '', bedNumber: '',
        admissionType: 'Medical', admissionReason: '', attendingDoctor: '',
        diagnosis: '', treatment: ''
      },
      wards: ['General Medicine', 'Surgery', 'Maternity', 'Paediatrics', 'ICU', 'Orthopaedics', 'Cardiology', 'Neurology', 'Oncology', 'Isolation'],
      doctors: ['Dr. Kamga', 'Dr. Nkeng', 'Dr. Biya', 'Dr. Mbarga', 'Dr. Fouda'],
      headers: [
        { text: 'PATIENT',        value: 'patientName' },
        { text: 'WARD / BED',     value: 'ward' },
        { text: 'TYPE',           value: 'admissionType' },
        { text: 'ADMITTED',       value: 'admissionDate' },
        { text: 'STATUS',         value: 'status',  align: 'center' },
        { text: '',               value: 'actions', sortable: false, align: 'right' }
      ]
    }
  },
  computed: {
    patients() { return this.$store.getters['clinical/getPatients'] },
    patientItems() {
      return this.patients.map(p => ({ id: p.id, label: `${p.id} — ${p.name}` }))
    },
    inpatients() { return this.$store.getters['clinical/getInpatients'].map(a => {
        const p = this.patients.find(pt => pt.id === a.patientId)
        return { ...a, patientName: p ? p.name : 'Unknown' }
      }).reverse()
    },
    filteredInpatients() {
      if (!this.statusFilter) return this.inpatients
      return this.inpatients.filter(i => i.status === this.statusFilter)
    }
  },
  methods: {
    save() {
      if (!this.$refs.form.validate()) return
      this.loading = true
      if (this.editingId) {
        this.$store.dispatch('clinical/updateInpatient', { ...this.form, id: this.editingId })
        this.$toast.success('Admission record updated.')
        this.cancelEdit()
      } else {
        this.$store.dispatch('clinical/admitPatient', this.form)
        this.$toast.success('Patient admitted successfully.')
        this.$refs.form.reset()
        this.form.admissionType = 'Medical'
      }
      this.loading = false
    },
    editInpatient(item) {
      this.editingId = item.id
      this.form = {
        patientId: item.patientId, admissionDate: item.admissionDate,
        ward: item.ward, bedNumber: item.bedNumber, admissionType: item.admissionType,
        admissionReason: item.admissionReason, attendingDoctor: item.attendingDoctor,
        diagnosis: item.diagnosis, treatment: item.treatment
      }
    },
    cancelEdit() { this.editingId = null; this.$refs.form.reset(); this.form.admissionType = 'Medical' },
    setStatus(item, status) { this.$store.dispatch('clinical/updateInpatient', { ...item, status }) },
    confirmDischarge(item) { this.dischargeTarget = item; this.dischargeNote = ''; this.dischargeDialog = true },
    doDischarge() {
      this.loading = true
      this.$store.dispatch('clinical/updateInpatient', { ...this.dischargeTarget, status: 'Discharged', dischargeNote: this.dischargeNote, dischargeDate: new Date().toISOString().slice(0, 10) })
      this.$toast.success('Patient discharged.')
      this.dischargeDialog = false; this.dischargeTarget = null; this.loading = false
    },
    statusColor(s) {
      return { Admitted: '#003366', Stable: '#1F7A5C', Critical: '#C0392B', Discharged: '#6B7280' }[s] || '#6B7280'
    }
  }
}
</script>

<style scoped>
.gov-card { background: white !important; }
.bg-navy { background-color: #0B3D2E !important; }
.bg-teal { background-color: #0B3D2E !important; }
.gov-text-primary { color: #1B1F23 !important; }
.b-1 { border: 1px solid #E5E7EB; }
.border-bottom { border-bottom: 1px solid #E5E7EB; }
.bg-white { background: white !important; }
.shadow-sm { box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }
.ls-tight { letter-spacing: -1.2px !important; }
.ls-1 { letter-spacing: 0.8px !important; }
.uppercase { text-transform: uppercase; }
.section-label { font-size:10px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color:#0B3D2E; border-left:4px solid #00A99D; padding-left:10px; }
.gov-table { background: white !important; }
.gov-table ::v-deep th { background:#F8FAFC !important; color:#1B1F23 !important; font-size:10px !important; font-weight:800; text-transform:uppercase; }
</style>
