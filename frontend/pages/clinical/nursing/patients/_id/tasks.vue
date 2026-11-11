<template>
  <v-container fluid class="gov-content pa-8">
    <nurse-patient-header :patient="patient" />
    <v-row>
      <v-col cols="12" lg="8"><nurse-task-list :tasks="chart.tasks" @status-change="updateTaskStatus" /></v-col>
      <v-col cols="12" lg="4">
        <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
          <div class="pa-4 bg-navy white--text text-caption font-weight-black text-uppercase ls-1">Create task</div>
          <div class="pa-5">
            <v-text-field v-model="form.title" outlined tile dense label="Task title"></v-text-field>
            <v-select v-model="form.priority" :items="['routine','urgent','stat']" outlined tile dense label="Priority"></v-select>
            <v-textarea v-model="form.reason" outlined tile dense rows="3" label="Reason"></v-textarea>
            <v-btn tile depressed color="#003366" dark class="font-weight-black text-caption" @click="saveTask"><v-icon left small>mdi-plus</v-icon>Create task</v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import NursePatientHeader from '~/components/nursing/NursePatientHeader.vue'
import NurseTaskList from '~/components/nursing/NurseTaskList.vue'

export default {
  components: { NursePatientHeader, NurseTaskList },
  layout: 'admins',
  head: { title: 'Nurse TaskFlow' },
  data() { return { form: { title: '', priority: 'routine', reason: '' } } },
  computed: {
    patientId() { return this.$route.params.id },
    patient() { return (this.$store.getters['clinical/patientDirectory'] || []).find(item => item.id === this.patientId) || {} },
    chart() { return this.$store.getters['nursing/patientNursing360'](this.patientId) }
  },
  mounted() {
    this.$store.commit('nursing/LOAD_FROM_STORAGE')
    this.$store.dispatch('nursing/loadPatientChart', this.patientId)
  },
  methods: {
    async saveTask() {
      try {
        await this.$store.dispatch('nursing/createTask', { ...this.form, patientId: this.patientId })
        this.form = { title: '', priority: 'routine', reason: '' }
        this.$toast.success('Task created.')
      } catch (err) {
        this.$toast.error(err.response?.data?.error || err.message || 'Unable to create this task.')
      }
    },
    async updateTaskStatus(payload) {
      try {
        await this.$store.dispatch('nursing/updateTaskStatus', payload)
      } catch (err) {
        this.$toast.error(err.response?.data?.error || err.message || 'Unable to update this task.')
      }
    }
  }
}
</script>

<style scoped>
.gov-card { background:white !important; }
.bg-navy { background:#003366 !important; }
.b-1 { border:1px solid #E5E7EB; }
.shadow-sm { box-shadow:0 2px 6px rgba(0,0,0,0.05) !important; }
.ls-1 { letter-spacing:0.8px !important; }
</style>
