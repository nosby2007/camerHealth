
<template>
  <v-container fluid class="gov-content pa-10">
    <v-row class="mb-10 no-gutters align-center">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar tile color="#00A99D" size="48" class="mr-4 shadow-sm">
            <v-icon dark>mdi-radiology-box</v-icon>
          </v-avatar>
          <div>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">DIAGNOSTIC IMAGING UNIT</span>
            <h1 class="text-h4 font-weight-black gov-text-primary ls-tight uppercase">IMAGING ORDERS</h1>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-row class="no-gutters">
      <v-col cols="12" lg="4">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-navy white--text font-weight-black text-caption ls-1 uppercase">
            NEW IMAGING REQUEST
          </div>
          <div class="pa-8">
            <v-form ref="form" v-model="valid">
              <v-autocomplete v-model="form.patientId" :items="patients" item-text="name" item-value="id" label="Patient" flat outlined tile dense required :rules="[v => !!v || 'Required']" class="mb-4 rounded-0"></v-autocomplete>
              <v-select v-model="form.modality" :items="modalities" label="Imaging Modality" flat outlined tile dense required :rules="[v => !!v || 'Required']" class="mb-4 rounded-0"></v-select>
              <v-text-field v-model="form.bodyPart" label="Body Part / Region" flat outlined tile dense required :rules="[v => !!v || 'Required']" class="mb-4 rounded-0"></v-text-field>
              <v-select v-model="form.priority" :items="['Routine', 'Urgent', 'Emergency']" label="Priority" flat outlined tile dense class="mb-4 rounded-0"></v-select>
              <v-textarea v-model="form.clinicalIndication" label="Clinical Indication" rows="2" flat outlined tile dense class="mb-8 rounded-0"></v-textarea>
              <v-btn color="#00A99D" dark block height="48" tile depressed :disabled="!valid" @click="save" class="font-weight-black text-caption ls-1">
                SUBMIT REQUEST <v-icon right small>mdi-radiology-box-outline</v-icon>
              </v-btn>
            </v-form>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="8" class="pl-lg-8">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-grey lighten-4 d-flex align-center border-bottom">
            <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Search imaging orders..." single-line hide-details flat outlined tile dense class="bg-white rounded-0 max-400"></v-text-field>
            <v-spacer />
            <v-btn-toggle v-model="statusFilter" tile dense class="ml-4">
              <v-btn x-small value="" class="font-weight-black text-caption">ALL</v-btn>
              <v-btn x-small value="Requested" class="font-weight-black text-caption">PENDING</v-btn>
              <v-btn x-small value="Completed" class="font-weight-black text-caption">REPORTED</v-btn>
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
              <v-chip x-small dark label :color="item.status === 'Completed' ? '#003366' : '#00A99D'" class="font-weight-black">{{ item.status.toUpperCase() }}</v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn icon x-small @click="openReport(item)" :disabled="item.status === 'Completed'">
                <v-icon small color="#00A99D">mdi-file-document-edit</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="reportDialog" max-width="500" persistent>
      <v-card flat tile>
        <div class="pa-4 bg-navy white--text font-weight-black text-caption ls-1 uppercase">ENTER IMAGING REPORT</div>
        <div class="pa-8">
          <div class="text-caption font-weight-black grey--text mb-4 uppercase">{{ selectedOrder ? selectedOrder.modality + ' — ' + selectedOrder.bodyPart : '' }}</div>
          <v-textarea v-model="reportText" label="Radiologist Report / Findings" rows="5" flat outlined tile dense class="mb-6 rounded-0"></v-textarea>
          <v-row dense>
            <v-col cols="8">
              <v-btn color="#00A99D" dark block height="44" tile depressed @click="submitReport" class="font-weight-black text-caption">SUBMIT REPORT</v-btn>
            </v-col>
            <v-col cols="4">
              <v-btn block height="44" tile depressed @click="reportDialog = false" class="font-weight-black text-caption">CANCEL</v-btn>
            </v-col>
          </v-row>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
export default {
  head: { title: 'Imaging' },
  data() {
    return {
      valid: false, search: '', statusFilter: '', reportDialog: false, selectedOrder: null, reportText: '',
      form: { patientId: '', modality: '', bodyPart: '', priority: 'Routine', clinicalIndication: '' },
      modalities: ['X-Ray', 'Ultrasound', 'CT Scan', 'MRI', 'Mammography', 'Fluoroscopy', 'Echocardiogram'],
      headers: [
        { text: 'PATIENT', value: 'patientName' },
        { text: 'MODALITY', value: 'modality' },
        { text: 'BODY PART', value: 'bodyPart' },
        { text: 'PRIORITY', value: 'priority', align: 'center' },
        { text: 'STATUS', value: 'status', align: 'center' },
        { text: 'DATE', value: 'requestedAt' },
        { text: '', value: 'actions', sortable: false, align: 'right' }
      ]
    }
  },
  computed: {
    patients() { return this.$store.getters['clinical/getPatients'] },
    orders() {
      return this.$store.getters['clinical/getImagingOrders'].map(o => {
        const p = this.patients.find(pt => pt.id === o.patientId)
        return { ...o, patientName: p ? p.name : 'Unknown', requestedAt: new Date(o.requestedAt).toLocaleDateString() }
      }).reverse()
    },
    filteredOrders() {
      if (!this.statusFilter) return this.orders
      return this.orders.filter(o => o.status === this.statusFilter)
    }
  },
  methods: {
    save() {
      if (!this.$refs.form.validate()) return
      this.$store.dispatch('clinical/orderImaging', this.form)
      this.$toast.success('Imaging request submitted.')
      this.$refs.form.reset()
      this.form.priority = 'Routine'
    },
    openReport(item) { this.selectedOrder = item; this.reportText = item.report || ''; this.reportDialog = true },
    submitReport() {
      this.$store.dispatch('clinical/updateImagingOrder', { ...this.selectedOrder, status: 'Completed', report: this.reportText })
      this.$toast.success('Imaging report submitted.')
      this.reportDialog = false; this.reportText = ''
    },
    priorityColor(p) { return { Routine: '#6B7280', Urgent: '#F4A300', Emergency: '#C0392B' }[p] || '#6B7280' }
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
