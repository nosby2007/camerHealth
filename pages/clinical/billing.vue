
<template>
  <v-container fluid class="gov-content pa-10">
    <v-row class="mb-10 no-gutters align-center">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar tile color="#00A99D" size="48" class="mr-4 shadow-sm">
            <v-icon dark>mdi-receipt</v-icon>
          </v-avatar>
          <div>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">FINANCE & BILLING UNIT</span>
            <h1 class="text-h4 font-weight-black gov-text-primary ls-tight uppercase">BILLING & INVOICES</h1>
          </div>
        </div>
      </v-col>
      <v-spacer />
      <v-col cols="auto" class="d-flex align-center">
        <v-chip label class="mr-2 font-weight-black text-caption" color="#F8FAFC">TOTAL: {{ invoices.length }}</v-chip>
        <v-chip label class="mr-2 font-weight-black text-caption" color="#C0392B" dark>UNPAID: {{ unpaidCount }}</v-chip>
        <v-chip label class="font-weight-black text-caption" color="#00A99D" dark>PAID: {{ paidCount }}</v-chip>
      </v-col>
    </v-row>

    <v-row class="no-gutters">
      <v-col cols="12" lg="4">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-navy white--text font-weight-black text-caption ls-1 uppercase">
            GENERATE INVOICE
          </div>
          <div class="pa-8">
            <v-form ref="form" v-model="valid">
              <v-autocomplete v-model="form.patientId" :items="patients" item-text="name" item-value="id" label="Patient" flat outlined tile dense required :rules="[v => !!v || 'Required']" class="mb-4 rounded-0"></v-autocomplete>
              <v-select v-model="form.serviceType" :items="serviceTypes" label="Service Type" flat outlined tile dense required :rules="[v => !!v || 'Required']" class="mb-4 rounded-0"></v-select>
              <v-text-field v-model.number="form.amount" label="Amount (XAF)" type="number" flat outlined tile dense required :rules="[v => !!v || 'Required', v => v > 0 || 'Must be > 0']" class="mb-4 rounded-0" prefix="XAF"></v-text-field>
              <v-select v-model="form.paymentMethod" :items="['Cash', 'MTN MoMo', 'Orange Money', 'Insurance', 'Waived']" label="Payment Method" flat outlined tile dense class="mb-4 rounded-0"></v-select>
              <v-textarea v-model="form.notes" label="Notes" rows="2" flat outlined tile dense class="mb-8 rounded-0"></v-textarea>
              <v-btn color="#00A99D" dark block height="48" tile depressed :disabled="!valid" @click="save" class="font-weight-black text-caption ls-1">
                GENERATE INVOICE <v-icon right small>mdi-receipt-text-plus</v-icon>
              </v-btn>
            </v-form>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="8" class="pl-lg-8">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-grey lighten-4 d-flex align-center border-bottom">
            <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Search invoices..." single-line hide-details flat outlined tile dense class="bg-white rounded-0 max-400"></v-text-field>
            <v-spacer />
            <v-btn-toggle v-model="statusFilter" tile dense class="ml-4">
              <v-btn x-small value="" class="font-weight-black text-caption">ALL</v-btn>
              <v-btn x-small value="Unpaid" class="font-weight-black text-caption">UNPAID</v-btn>
              <v-btn x-small value="Paid" class="font-weight-black text-caption">PAID</v-btn>
              <v-btn x-small value="Waived" class="font-weight-black text-caption">WAIVED</v-btn>
            </v-btn-toggle>
          </div>
          <v-data-table :headers="headers" :items="filteredInvoices" :search="search" class="gov-spreadsheet-table" tile elevation="0">
            <template v-slot:item.patientName="{ item }">
              <span class="text-body-2 font-weight-black gov-text-primary">{{ item.patientName.toUpperCase() }}</span>
            </template>
            <template v-slot:item.amount="{ item }">
              <span class="font-weight-black">XAF {{ item.amount.toLocaleString() }}</span>
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip x-small dark label :color="statusColor(item.status)" class="font-weight-black">{{ item.status.toUpperCase() }}</v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn icon x-small @click="markPaid(item)" :disabled="item.status !== 'Unpaid'">
                <v-icon small color="#00A99D">mdi-check-circle</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  head: { title: 'Billing' },
  data() {
    return {
      valid: false, search: '', statusFilter: '',
      form: { patientId: '', serviceType: '', amount: null, paymentMethod: 'Cash', notes: '' },
      serviceTypes: ['Consultation', 'Laboratory', 'Imaging / Radiology', 'Medication', 'Surgery', 'Vaccination', 'Antenatal Care', 'Emergency', 'Admission (per day)', 'Other'],
      headers: [
        { text: 'INVOICE ID', value: 'id', width: '130px' },
        { text: 'PATIENT', value: 'patientName' },
        { text: 'SERVICE', value: 'serviceType' },
        { text: 'AMOUNT', value: 'amount' },
        { text: 'METHOD', value: 'paymentMethod' },
        { text: 'STATUS', value: 'status', align: 'center' },
        { text: 'DATE', value: 'createdAt' },
        { text: '', value: 'actions', sortable: false, align: 'right' }
      ]
    }
  },
  computed: {
    patients() { return this.$store.getters['clinical/getPatients'] },
    invoices() {
      return this.$store.getters['clinical/getInvoices'].map(i => {
        const p = this.patients.find(pt => pt.id === i.patientId)
        return { ...i, patientName: p ? p.name : 'Unknown', createdAt: new Date(i.createdAt).toLocaleDateString() }
      }).reverse()
    },
    filteredInvoices() {
      if (!this.statusFilter) return this.invoices
      return this.invoices.filter(i => i.status === this.statusFilter)
    },
    unpaidCount() { return this.invoices.filter(i => i.status === 'Unpaid').length },
    paidCount() { return this.invoices.filter(i => i.status === 'Paid').length }
  },
  methods: {
    save() {
      if (!this.$refs.form.validate()) return
      this.$store.dispatch('clinical/createInvoice', this.form)
      this.$toast.success('Invoice generated.')
      this.$refs.form.reset()
      this.form.paymentMethod = 'Cash'
    },
    markPaid(item) {
      this.$store.dispatch('clinical/updateInvoice', { ...item, status: item.paymentMethod === 'Waived' ? 'Waived' : 'Paid' })
      this.$toast.success('Payment recorded.')
    },
    statusColor(s) { return { Unpaid: '#C0392B', Paid: '#00A99D', Waived: '#6B7280' }[s] || '#6B7280' }
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
