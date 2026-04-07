
<template>
  <v-container fluid class="gov-content pa-10">
    <v-row class="mb-10 no-gutters align-center">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar tile color="#00A99D" size="48" class="mr-4 shadow-sm">
            <v-icon dark>mdi-pill</v-icon>
          </v-avatar>
          <div>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">PHARMACY & PRESCRIPTION UNIT</span>
            <h1 class="text-h4 font-weight-black gov-text-primary ls-tight uppercase">MEDICATIONS</h1>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-row class="no-gutters">
      <!-- Prescription Form -->
      <v-col cols="12" lg="4">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-navy white--text font-weight-black text-caption ls-1 uppercase">
            {{ editingId ? 'EDIT PRESCRIPTION' : 'NEW PRESCRIPTION' }}
          </div>
          <div class="pa-8">
            <v-form ref="form" v-model="valid">
              <v-autocomplete
                v-model="form.patientId"
                :items="patients"
                item-text="name"
                item-value="id"
                label="Patient"
                flat outlined tile dense required
                :rules="[v => !!v || 'Required']"
                class="mb-4 rounded-0"
              ></v-autocomplete>

              <v-combobox
                v-model="form.medication"
                :items="commonMedications"
                label="Medication Name"
                flat outlined tile dense required
                :rules="[v => !!v || 'Required']"
                class="mb-4 rounded-0"
              ></v-combobox>

              <v-row dense>
                <v-col cols="6">
                  <v-text-field
                    v-model="form.dosage"
                    label="Dosage (e.g. 500mg)"
                    flat outlined tile dense required
                    :rules="[v => !!v || 'Required']"
                    class="mb-4 rounded-0"
                  ></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-select
                    v-model="form.route"
                    :items="routes"
                    label="Route"
                    flat outlined tile dense
                    class="mb-4 rounded-0"
                  ></v-select>
                </v-col>
              </v-row>

              <v-select
                v-model="form.frequency"
                :items="frequencies"
                label="Frequency"
                flat outlined tile dense required
                :rules="[v => !!v || 'Required']"
                class="mb-4 rounded-0"
              ></v-select>

              <v-row dense>
                <v-col cols="6">
                  <v-text-field
                    v-model="form.startDate"
                    label="Start Date"
                    type="date"
                    flat outlined tile dense
                    class="mb-4 rounded-0"
                  ></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="form.endDate"
                    label="End Date"
                    type="date"
                    flat outlined tile dense
                    class="mb-4 rounded-0"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-textarea
                v-model="form.notes"
                label="Prescriber Notes"
                rows="2"
                flat outlined tile dense
                class="mb-8 rounded-0"
              ></v-textarea>

              <v-row dense>
                <v-col :cols="editingId ? 8 : 12">
                  <v-btn color="#00A99D" dark block height="48" tile depressed :disabled="!valid" @click="save" class="font-weight-black text-caption ls-1">
                    {{ editingId ? 'UPDATE' : 'PRESCRIBE' }}
                    <v-icon right small>mdi-check-bold</v-icon>
                  </v-btn>
                </v-col>
                <v-col v-if="editingId" cols="4">
                  <v-btn color="grey lighten-2" block height="48" tile depressed @click="cancelEdit" class="font-weight-black text-caption">CANCEL</v-btn>
                </v-col>
              </v-row>
            </v-form>
          </div>
        </v-card>
      </v-col>

      <!-- Medications Table -->
      <v-col cols="12" lg="8" class="pl-lg-8">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-grey lighten-4 d-flex align-center border-bottom">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search medications..."
              single-line hide-details flat outlined tile dense
              class="bg-white rounded-0 max-400"
            ></v-text-field>
            <v-spacer />
            <v-btn-toggle v-model="statusFilter" tile dense class="ml-4">
              <v-btn x-small value="" class="font-weight-black text-caption">ALL</v-btn>
              <v-btn x-small value="Active" class="font-weight-black text-caption">ACTIVE</v-btn>
              <v-btn x-small value="Completed" class="font-weight-black text-caption">COMPLETED</v-btn>
              <v-btn x-small value="Discontinued" class="font-weight-black text-caption">DISCONTINUED</v-btn>
            </v-btn-toggle>
          </div>
          <v-data-table
            :headers="headers"
            :items="filteredMedications"
            :search="search"
            class="gov-spreadsheet-table"
            tile elevation="0"
          >
            <template v-slot:item.patientName="{ item }">
              <span class="text-body-2 font-weight-black gov-text-primary">{{ item.patientName.toUpperCase() }}</span>
            </template>
            <template v-slot:item.medication="{ item }">
              <span class="font-weight-bold">{{ item.medication }}</span>
              <div class="text-caption grey--text">{{ item.dosage }} — {{ item.route }}</div>
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip x-small dark label :color="statusColor(item.status)" class="font-weight-black">{{ item.status.toUpperCase() }}</v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn icon x-small @click="editMed(item)" class="mr-1">
                <v-icon small color="#003366">mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon x-small @click="setStatus(item, 'Completed')" :disabled="item.status !== 'Active'">
                <v-icon small color="#00A99D">mdi-check-circle</v-icon>
              </v-btn>
              <v-btn icon x-small @click="setStatus(item, 'Discontinued')">
                <v-icon small color="#C0392B">mdi-close-circle</v-icon>
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
  head: { title: 'Medications' },
  data() {
    return {
      valid: false,
      search: '',
      statusFilter: '',
      editingId: null,
      form: { patientId: '', medication: '', dosage: '', route: 'Oral', frequency: '', startDate: '', endDate: '', notes: '' },
      commonMedications: [
        'Amoxicillin', 'Artemether-Lumefantrine', 'Azithromycin', 'Ciprofloxacin',
        'Cotrimoxazole', 'Doxycycline', 'Metformin', 'Amlodipine', 'Lisinopril',
        'Atorvastatin', 'Omeprazole', 'Paracetamol', 'Ibuprofen', 'ORS', 'Zinc Sulfate',
        'Vitamin A', 'Iron + Folic Acid', 'Oral Rehydration Salts'
      ],
      routes: ['Oral', 'IV', 'IM', 'Topical', 'Inhalation', 'Sublingual', 'Rectal'],
      frequencies: ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Every 8 hours', 'Every 6 hours', 'As needed (PRN)', 'Weekly'],
      headers: [
        { text: 'PATIENT', value: 'patientName' },
        { text: 'MEDICATION', value: 'medication' },
        { text: 'FREQUENCY', value: 'frequency' },
        { text: 'START', value: 'startDate' },
        { text: 'END', value: 'endDate' },
        { text: 'STATUS', value: 'status', align: 'center' },
        { text: '', value: 'actions', sortable: false, align: 'right' }
      ]
    }
  },
  computed: {
    patients() { return this.$store.getters['clinical/getPatients'] },
    medications() {
      return this.$store.getters['clinical/getMedications'].map(m => {
        const p = this.patients.find(pt => pt.id === m.patientId)
        return { ...m, patientName: p ? p.name : 'Unknown' }
      }).reverse()
    },
    filteredMedications() {
      if (!this.statusFilter) return this.medications
      return this.medications.filter(m => m.status === this.statusFilter)
    }
  },
  methods: {
    save() {
      if (!this.$refs.form.validate()) return
      if (this.editingId) {
        this.$store.dispatch('clinical/updateMedication', { ...this.form, id: this.editingId })
        this.$toast.success('Prescription updated.')
        this.cancelEdit()
      } else {
        this.$store.dispatch('clinical/prescribeMedication', this.form)
        this.$toast.success('Medication prescribed.')
        this.$refs.form.reset()
        this.form.route = 'Oral'
      }
    },
    editMed(item) {
      this.editingId = item.id
      this.form = { patientId: item.patientId, medication: item.medication, dosage: item.dosage, route: item.route, frequency: item.frequency, startDate: item.startDate, endDate: item.endDate, notes: item.notes }
    },
    cancelEdit() { this.editingId = null; this.$refs.form.reset(); this.form.route = 'Oral' },
    setStatus(item, status) { this.$store.dispatch('clinical/updateMedication', { ...item, status }) },
    statusColor(s) {
      return { Active: '#00A99D', Completed: '#003366', Discontinued: '#C0392B' }[s] || '#6B7280'
    }
  }
}
</script>

<style scoped>
.gov-card { background: white !important; }
.bg-navy { background-color: #003366 !important; }
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
.gov-spreadsheet-table ::v-deep th {
  background: #F8FAFC !important;
  color: #1B1F23 !important;
  font-size: 10px !important;
  font-weight: 800;
  text-transform: uppercase;
}
</style>
