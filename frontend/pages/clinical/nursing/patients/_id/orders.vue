<template>
  <v-container fluid class="gov-content pa-8">
    <nurse-patient-header :patient="patient" />
    <v-row>
      <v-col cols="12" lg="8">
        <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
          <div class="pa-4 bg-grey lighten-4 border-bottom text-caption font-weight-black grey--text text-uppercase ls-1">Orders and task generation</div>
          <v-data-table :headers="headers" :items="chart.orders" dense class="gov-table"></v-data-table>
        </v-card>
      </v-col>
      <v-col cols="12" lg="4">
        <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
          <div class="pa-4 bg-navy white--text text-caption font-weight-black text-uppercase ls-1">Create nursing order</div>
          <div class="pa-5">
            <v-text-field v-model="form.title" outlined tile dense label="Order title"></v-text-field>
            <v-text-field v-model="form.orderType" outlined tile dense label="Order type"></v-text-field>
            <v-select v-model="form.priority" :items="['routine','urgent','stat']" outlined tile dense label="Priority"></v-select>
            <v-textarea v-model="form.instructions" outlined tile dense rows="3" label="Instructions"></v-textarea>
            <v-btn tile depressed color="#003366" dark class="font-weight-black text-caption" @click="saveOrder"><v-icon left small>mdi-plus</v-icon>Create order</v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import NursePatientHeader from '~/components/nursing/NursePatientHeader.vue'

export default {
  components: { NursePatientHeader },
  layout: 'admins',
  head: { title: 'Orders and Tasks' },
  data() { return { form: { title: '', orderType: 'nursing_intervention', priority: 'routine', instructions: '', assignedRole: 'NURSE' }, headers: [{ text: 'TITLE', value: 'title' }, { text: 'TYPE', value: 'orderType' }, { text: 'PRIORITY', value: 'priority' }, { text: 'STATUS', value: 'status' }] } },
  computed: {
    patientId() { return this.$route.params.id },
    patient() { return (this.$store.getters['clinical/patientDirectory'] || []).find(item => item.id === this.patientId) || {} },
    chart() { return this.$store.getters['nursing/patientNursing360'](this.patientId) }
  },
  mounted() {
    this.$store.commit('nursing/LOAD_FROM_STORAGE')
    this.$store.dispatch('nursing/loadPatientChart', this.patientId)
  },
  methods: { saveOrder() { this.$store.dispatch('nursing/createOrder', { ...this.form, patientId: this.patientId }); this.form.title = ''; this.form.instructions = '' } }
}
</script>

<style scoped>
.gov-card { background:white !important; }
.bg-navy { background:#003366 !important; }
.b-1 { border:1px solid #E5E7EB; }
.border-bottom { border-bottom:1px solid #E5E7EB; }
.shadow-sm { box-shadow:0 2px 6px rgba(0,0,0,0.05) !important; }
.ls-1 { letter-spacing:0.8px !important; }
.gov-table ::v-deep th { background:#F8FAFC !important; color:#1B1F23 !important; font-size:10px !important; font-weight:800; text-transform:uppercase; }
</style>
