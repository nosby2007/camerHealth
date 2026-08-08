
<template>
  <v-container fluid class="gov-content pa-10">
    <v-row class="mb-10 no-gutters align-center">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar tile color="#00A99D" size="48" class="mr-4 shadow-sm">
            <v-icon dark>mdi-flask</v-icon>
          </v-avatar>
          <div>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">DIAGNOSTIC SERVICES</span>
            <h1 class="text-h4 font-weight-black gov-text-primary ls-tight uppercase">LABORATORY ORDERS</h1>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-row class="no-gutters">
      <v-col cols="12" lg="4">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-navy white--text font-weight-black text-caption ls-1 uppercase">
            NEW LAB REQUEST
          </div>
          <div class="pa-8">
            <v-form ref="form" v-model="valid">
              <v-autocomplete v-model="form.patientId" :items="patients" item-text="name" item-value="id" label="Patient" flat outlined tile dense required :rules="[v => !!v || 'Required']" class="mb-4 rounded-0"></v-autocomplete>
              <v-select v-model="form.testType" :items="testTypes" label="Test Type" flat outlined tile dense required :rules="[v => !!v || 'Required']" class="mb-4 rounded-0"></v-select>
              <v-select v-model="form.priority" :items="['Routine', 'Urgent', 'STAT']" label="Priority" flat outlined tile dense class="mb-4 rounded-0"></v-select>
              <v-textarea v-model="form.clinicalNotes" label="Clinical Notes" rows="2" flat outlined tile dense class="mb-8 rounded-0"></v-textarea>
              <v-btn color="#00A99D" dark block height="48" tile depressed :disabled="!valid" @click="save" class="font-weight-black text-caption ls-1">
                SUBMIT REQUEST <v-icon right small>mdi-flask-plus</v-icon>
              </v-btn>
            </v-form>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="8" class="pl-lg-8">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-grey lighten-4 d-flex align-center border-bottom">
            <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Search lab orders..." single-line hide-details flat outlined tile dense class="bg-white rounded-0 max-400"></v-text-field>
            <v-spacer />
            <v-btn-toggle v-model="statusFilter" tile dense class="ml-4">
              <v-btn x-small value="" class="font-weight-black text-caption">ALL</v-btn>
              <v-btn x-small value="Requested" class="font-weight-black text-caption">PENDING</v-btn>
              <v-btn x-small value="In Progress" class="font-weight-black text-caption">IN PROGRESS</v-btn>
              <v-btn x-small value="Completed" class="font-weight-black text-caption">COMPLETED</v-btn>
            </v-btn-toggle>
          </div>
          <v-data-table :headers="headers" :items="filteredOrders" :search="search" class="gov-spreadsheet-table" tile elevation="0">
            <template v-slot:item.patientName="{ item }">
              <span class="text-body-2 font-weight-black gov-text-primary">{{ item.patientName.toUpperCase() }}</span>
            </template>
            <template v-slot:item.priority="{ item }">
              <v-chip x-small dark label :color="priorityColor(item.priority)" class="font-weight-black">{{ item.priority }}</v-chip>
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip x-small dark label :color="statusColor(item.status)" class="font-weight-black">{{ item.status.toUpperCase() }}</v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn
                v-if="canProcessOrders && item.status === 'Requested'"
                x-small
                tile
                depressed
                color="#00A99D"
                dark
                class="font-weight-black text-caption"
                @click="receiveAndOpenResult(item)"
              >
                RECEIVE & FILL
                <v-icon right x-small>mdi-test-tube</v-icon>
              </v-btn>
              <v-btn
                v-else-if="canProcessOrders && item.status === 'In Progress'"
                x-small
                tile
                outlined
                color="#003366"
                class="font-weight-black text-caption"
                @click="openResult(item)"
              >
                FILL RESULT
                <v-icon right x-small>mdi-clipboard-check</v-icon>
              </v-btn>
              <v-btn
                v-else-if="item.status === 'Completed'"
                x-small
                tile
                text
                color="#003366"
                class="font-weight-black text-caption"
                @click="openResult(item)"
              >
                VIEW RESULT
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="resultDialog" max-width="500" persistent>
      <v-card flat tile>
        <div class="pa-4 bg-navy white--text font-weight-black text-caption ls-1 uppercase">ENTER LAB RESULT</div>
        <div class="pa-8">
          <div class="text-caption font-weight-black grey--text mb-4 uppercase">{{ selectedOrder ? selectedOrder.testType : '' }} — {{ selectedOrder ? selectedOrder.patientName : '' }}</div>
          <v-text-field v-model="resultForm.specimenId" label="Specimen / Accession ID" flat outlined tile dense class="mb-4 rounded-0"></v-text-field>
          <v-select v-model="resultForm.specimenQuality" :items="['Accepted', 'Hemolyzed', 'Insufficient sample', 'Rejected']" label="Specimen Quality" flat outlined tile dense class="mb-4 rounded-0"></v-select>
          <v-textarea v-model="resultForm.result" label="Result / Findings" rows="4" flat outlined tile dense class="mb-4 rounded-0"></v-textarea>
          <v-textarea v-model="resultForm.technicalNotes" label="Technical Notes" rows="2" flat outlined tile dense class="mb-6 rounded-0"></v-textarea>
          <v-row dense>
            <v-col cols="8">
              <v-btn color="#00A99D" dark block height="44" tile depressed :disabled="!resultForm.result" @click="submitResult" class="font-weight-black text-caption">
                SUBMIT LAB RESULT
                <v-icon right x-small>mdi-send-check</v-icon>
              </v-btn>
            </v-col>
            <v-col cols="4">
              <v-btn block height="44" tile depressed @click="resultDialog = false" class="font-weight-black text-caption">CANCEL</v-btn>
            </v-col>
          </v-row>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
export default {
  head: { title: 'Laboratory' },
  data() {
    return {
      valid: false, search: '', statusFilter: '', resultDialog: false, selectedOrder: null,
      resultForm: { specimenId: '', specimenQuality: 'Accepted', result: '', technicalNotes: '' },
      form: { patientId: '', testType: '', priority: 'Routine', clinicalNotes: '' },
      testTypes: ['Full Blood Count (FBC)', 'Malaria RDT', 'HIV Test', 'Hepatitis B/C', 'Blood Glucose', 'Urine Analysis', 'Stool Analysis', 'Liver Function Test', 'Renal Function Test', 'Typhoid (Widal)', 'TB Sputum', 'COVID-19 PCR', 'Pregnancy Test'],
      headers: [
        { text: 'PATIENT', value: 'patientName' },
        { text: 'TEST', value: 'testType' },
        { text: 'PRIORITY', value: 'priority', align: 'center' },
        { text: 'STATUS', value: 'status', align: 'center' },
        { text: 'RESULT', value: 'result', width: '160px' },
        { text: 'DATE', value: 'requestedAt' },
        { text: '', value: 'actions', sortable: false, align: 'right' }
      ]
    }
  },
  computed: {
    role() { return this.$store.state.auth.role },
    isLabTechnician() { return this.role === 'LAB' },
    canProcessOrders() { return this.isLabTechnician },
    patients() { return this.$store.getters['clinical/getPatients'] },
    orders() {
      return this.$store.getters['clinical/getLabOrders'].map(o => {
        const p = this.patients.find(pt => pt.id === o.patientId)
        return { ...o, patientName: p ? p.name : 'Unknown', requestedAt: new Date(o.requestedAt).toLocaleDateString() }
      }).reverse()
    },
    filteredOrders() {
      if (!this.statusFilter) return this.orders
      return this.orders.filter(o => o.status === this.statusFilter)
    },
    pendingCount() { return this.orders.filter(o => o.status === 'Requested').length },
    inProgressCount() { return this.orders.filter(o => o.status === 'In Progress').length },
    completedTodayCount() {
      const today = new Date().toDateString()
      return this.orders.filter(o => o.status === 'Completed' && o.completedAt && new Date(o.completedAt).toDateString() === today).length
    }
  },
  methods: {
    save() {
      if (!this.$refs.form.validate()) return
      this.$store.dispatch('clinical/orderLab', this.form)
      this.$toast.success('Lab request submitted.')
      this.$refs.form.reset()
      this.form.priority = 'Routine'
    },
    receiveSpecimen(item) {
      const updated = {
        ...item,
        status: 'In Progress',
        receivedAt: new Date().toISOString(),
        receivedBy: this.$store.state.auth.staffId || ''
      }
      this.$store.dispatch('clinical/updateLabOrder', updated)
      return updated
    },
    receiveAndOpenResult(item) {
      const updated = this.receiveSpecimen(item)
      this.openResult(updated)
    },
    openResult(item) {
      this.selectedOrder = item
      this.resultForm = {
        specimenId: item.specimenId || '',
        specimenQuality: item.specimenQuality || 'Accepted',
        result: item.result || '',
        technicalNotes: item.technicalNotes || ''
      }
      this.resultDialog = true
    },
    submitResult() {
      this.$store.dispatch('clinical/updateLabOrder', {
        ...this.selectedOrder,
        ...this.resultForm,
        status: 'Completed',
        completedAt: new Date().toISOString(),
        completedBy: this.$store.state.auth.staffId || ''
      })
      this.$toast.success('Result recorded.')
      this.resultDialog = false
      this.resultForm = { specimenId: '', specimenQuality: 'Accepted', result: '', technicalNotes: '' }
    },
    priorityColor(p) { return { Routine: '#6B7280', Urgent: '#F4A300', STAT: '#C0392B' }[p] || '#6B7280' },
    statusColor(s) { return { Requested: '#00A99D', 'In Progress': '#F4A300', Completed: '#003366' }[s] || '#6B7280' }
  }
}
</script>

<style scoped>
.gov-card { background: white !important; }
.bg-navy { background-color: #00A99D !important; }
.gov-text-primary { color: #1B1F23 !important; }
.b-1 { border: 1px solid #E5E7EB; }
.border-bottom { border-bottom: 1px solid #E5E7EB; }
.bg-white { background: white !important; }
.max-400 { max-width: 400px; }
.shadow-sm { box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }
.ls-tight { letter-spacing: -1.2px !important; }
.ls-1 { letter-spacing: 0.8px !important; }
.uppercase { text-transform: uppercase; }
.gov-spreadsheet-table { background: white !important; }
.gov-spreadsheet-table ::v-deep th { background: #F8FAFC !important; color: #1B1F23 !important; font-size: 10px !important; font-weight: 800; text-transform: uppercase; }
</style>
