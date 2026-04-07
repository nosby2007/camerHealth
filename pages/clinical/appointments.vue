
<template>
  <v-container fluid class="gov-content pa-10">
    <v-row class="mb-10 no-gutters align-center">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar tile color="#00A99D" size="48" class="mr-4 shadow-sm">
            <v-icon dark>mdi-calendar-clock</v-icon>
          </v-avatar>
          <div>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">CLINICAL SCHEDULING UNIT</span>
            <h1 class="text-h4 font-weight-black gov-text-primary ls-tight uppercase">APPOINTMENT MANAGEMENT</h1>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-row class="no-gutters">
      <!-- Booking Form -->
      <v-col cols="12" lg="4">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-navy white--text font-weight-black text-caption ls-1 uppercase">
            {{ editingId ? 'EDIT APPOINTMENT' : 'SCHEDULE NEW APPOINTMENT' }}
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

              <v-select
                v-model="form.type"
                :items="appointmentTypes"
                label="Appointment Type"
                flat outlined tile dense required
                :rules="[v => !!v || 'Required']"
                class="mb-4 rounded-0"
              ></v-select>

              <v-text-field
                v-model="form.date"
                label="Date"
                type="date"
                flat outlined tile dense required
                :rules="[v => !!v || 'Required']"
                class="mb-4 rounded-0"
              ></v-text-field>

              <v-text-field
                v-model="form.time"
                label="Time"
                type="time"
                flat outlined tile dense required
                :rules="[v => !!v || 'Required']"
                class="mb-4 rounded-0"
              ></v-text-field>

              <v-select
                v-model="form.provider"
                :items="providers"
                label="Attending Provider"
                flat outlined tile dense
                class="mb-4 rounded-0"
              ></v-select>

              <v-textarea
                v-model="form.reason"
                label="Reason for Visit"
                rows="2"
                flat outlined tile dense
                class="mb-8 rounded-0"
              ></v-textarea>

              <v-row dense>
                <v-col :cols="editingId ? 8 : 12">
                  <v-btn color="#00A99D" dark block height="48" tile depressed :disabled="!valid" @click="save" class="font-weight-black text-caption ls-1">
                    {{ editingId ? 'UPDATE' : 'SCHEDULE' }}
                    <v-icon right small>mdi-calendar-check</v-icon>
                  </v-btn>
                </v-col>
                <v-col v-if="editingId" cols="4">
                  <v-btn color="grey lighten-2" block height="48" tile depressed @click="cancelEdit" class="font-weight-black text-caption">
                    CANCEL
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </div>
        </v-card>
      </v-col>

      <!-- Appointments Table -->
      <v-col cols="12" lg="8" class="pl-lg-8">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-grey lighten-4 d-flex align-center border-bottom">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search appointments..."
              single-line hide-details flat outlined tile dense
              class="bg-white rounded-0 max-400"
            ></v-text-field>
            <v-spacer />
            <v-btn-toggle v-model="statusFilter" tile dense class="ml-4">
              <v-btn x-small value="" class="font-weight-black text-caption">ALL</v-btn>
              <v-btn x-small value="Scheduled" class="font-weight-black text-caption">SCHEDULED</v-btn>
              <v-btn x-small value="Completed" class="font-weight-black text-caption">COMPLETED</v-btn>
              <v-btn x-small value="Cancelled" class="font-weight-black text-caption">CANCELLED</v-btn>
            </v-btn-toggle>
          </div>
          <v-data-table
            :headers="headers"
            :items="filteredAppointments"
            :search="search"
            class="gov-spreadsheet-table"
            tile elevation="0"
          >
            <template v-slot:item.patientName="{ item }">
              <span class="text-body-2 font-weight-black gov-text-primary">{{ item.patientName.toUpperCase() }}</span>
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip x-small dark label :color="statusColor(item.status)" class="font-weight-black">{{ item.status.toUpperCase() }}</v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn icon x-small @click="editAppointment(item)" class="mr-1">
                <v-icon small color="#003366">mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon x-small @click="markStatus(item, 'Completed')" :disabled="item.status === 'Completed'">
                <v-icon small color="#00A99D">mdi-check-circle</v-icon>
              </v-btn>
              <v-btn icon x-small @click="markStatus(item, 'Cancelled')" :disabled="item.status === 'Cancelled'">
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
  head: { title: 'Appointments' },
  data() {
    return {
      valid: false,
      search: '',
      statusFilter: '',
      editingId: null,
      form: { patientId: '', type: '', date: '', time: '', provider: '', reason: '' },
      appointmentTypes: ['General Consultation', 'Follow-Up', 'Vaccination', 'Antenatal Care', 'Lab Review', 'Specialist Referral', 'Emergency'],
      providers: ['Dr. Kamga', 'Dr. Nkeng', 'Dr. Biya', 'Nurse Fouda', 'Nurse Mbarga'],
      headers: [
        { text: 'PATIENT', value: 'patientName' },
        { text: 'TYPE', value: 'type' },
        { text: 'DATE', value: 'date' },
        { text: 'TIME', value: 'time' },
        { text: 'PROVIDER', value: 'provider' },
        { text: 'STATUS', value: 'status', align: 'center' },
        { text: '', value: 'actions', sortable: false, align: 'right' }
      ]
    }
  },
  computed: {
    patients() { return this.$store.getters['clinical/getPatients'] },
    appointments() {
      return this.$store.getters['clinical/getAppointments'].map(a => {
        const p = this.patients.find(pt => pt.id === a.patientId)
        return { ...a, patientName: p ? p.name : 'Unknown' }
      }).reverse()
    },
    filteredAppointments() {
      if (!this.statusFilter) return this.appointments
      return this.appointments.filter(a => a.status === this.statusFilter)
    }
  },
  methods: {
    save() {
      if (!this.$refs.form.validate()) return
      if (this.editingId) {
        this.$store.dispatch('clinical/updateAppointment', { ...this.form, id: this.editingId })
        this.$toast.success('Appointment updated.')
        this.cancelEdit()
      } else {
        this.$store.dispatch('clinical/scheduleAppointment', this.form)
        this.$toast.success('Appointment scheduled.')
        this.$refs.form.reset()
      }
    },
    editAppointment(item) {
      this.editingId = item.id
      this.form = { patientId: item.patientId, type: item.type, date: item.date, time: item.time, provider: item.provider, reason: item.reason }
    },
    cancelEdit() {
      this.editingId = null
      this.$refs.form.reset()
    },
    markStatus(item, status) {
      this.$store.dispatch('clinical/updateAppointment', { ...item, status })
    },
    statusColor(s) {
      return { Scheduled: '#00A99D', Completed: '#003366', Cancelled: '#C0392B', 'No-Show': '#F4A300' }[s] || '#6B7280'
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
.gov-spreadsheet-table {
  background: white !important;
}
.gov-spreadsheet-table ::v-deep th {
  background: #F8FAFC !important;
  color: #1B1F23 !important;
  font-size: 10px !important;
  font-weight: 800;
  text-transform: uppercase;
}
</style>
