<template>
  <div class="followup-tasks-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-clipboard-check-outline</v-icon>
        <span>Follow-up Tasks & Monitoring</span>
        <v-spacer />
        <button type="button" class="close-btn" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </button>
      </v-card-title>

      <v-divider />

      <v-card-text class="form-body">
        <form @submit.prevent="submitForm">
          <!-- Task Overview -->
          <section class="form-section">
            <h3 class="section-title">📌 Follow-up Tasks Overview</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Discharge Date</label>
                <v-text-field v-model="form.dischargeDate" type="date" outlined dense readonly />
              </div>
              <div class="form-group">
                <label>Expected Completion Date</label>
                <v-text-field v-model="form.completionDate" type="date" outlined dense />
              </div>
            </div>
          </section>

          <!-- Task List -->
          <section class="form-section">
            <div class="section-header">
              <h3 class="section-title">Tasks to Complete</h3>
              <v-btn small text color="primary" @click="addTask">
                <v-icon small>mdi-plus</v-icon>Add Task
              </v-btn>
            </div>

            <div class="tasks-list">
              <div v-for="(task, idx) in form.tasks" :key="idx" class="task-card">
                <div class="task-priority">
                  <v-select
                    v-model="form.tasks[idx].priority"
                    :items="['Critical', 'High', 'Medium', 'Low']"
                    outlined dense
                    class="priority-select"
                  />
                </div>
                <div class="task-content">
                  <v-text-field
                    v-model="form.tasks[idx].description"
                    placeholder="Task description"
                    outlined dense
                  />
                  <div class="task-details">
                    <v-text-field
                      v-model="form.tasks[idx].dueDate"
                      type="date"
                      label="Due date"
                      outlined dense
                    />
                    <v-select
                      v-model="form.tasks[idx].assignedTo"
                      :items="['Patient', 'Caregiver', 'Nurse', 'Coordinator', 'MD', 'Other']"
                      label="Assigned to"
                      outlined dense
                    />
                    <v-select
                      v-model="form.tasks[idx].status"
                      :items="['Pending', 'In progress', 'Completed', 'Overdue']"
                      label="Status"
                      outlined dense
                    />
                  </div>
                  <v-text-field
                    v-model="form.tasks[idx].notes"
                    placeholder="Additional notes..."
                    outlined dense
                  />
                </div>
                <v-btn small icon @click="removeTask(idx)">
                  <v-icon small>mdi-close</v-icon>
                </v-btn>
              </div>
            </div>
          </section>

          <!-- Monitoring Plan -->
          <section class="form-section">
            <h3 class="section-title">📊 Monitoring Plan</h3>
            <div class="monitoring-grid">
              <div class="monitoring-item">
                <h4>Daily Monitoring</h4>
                <v-checkbox v-model="form.monitoring.dailyVitals" label="Vitals (BP, HR, Temp)" />
                <v-checkbox v-model="form.monitoring.dailyPain" label="Pain assessment" />
                <v-checkbox v-model="form.monitoring.dailySymptoms" label="Symptom monitoring" />
                <v-checkbox v-model="form.monitoring.dailyIntake" label="Intake/Output" />
              </div>

              <div class="monitoring-item">
                <h4>Wound/Incision Monitoring</h4>
                <v-checkbox v-model="form.monitoring.woundDaily" label="Daily wound checks" />
                <v-checkbox v-model="form.monitoring.woundPhotos" label="Weekly wound photos" />
                <v-checkbox v-model="form.monitoring.woundCulture" label="Cultures if needed" />
              </div>

              <div class="monitoring-item">
                <h4>Lab/Imaging Follow-up</h4>
                <v-checkbox v-model="form.monitoring.labWork" label="Lab work ordered" />
                <v-checkbox v-model="form.monitoring.imaging" label="Imaging studies" />
                <v-checkbox v-model="form.monitoring.pathology" label="Pathology results" />
              </div>

              <div class="monitoring-item">
                <h4>Medication Monitoring</h4>
                <v-checkbox v-model="form.monitoring.medicationAdherence" label="Medication adherence" />
                <v-checkbox v-model="form.monitoring.sideEffects" label="Side effect monitoring" />
                <v-checkbox v-model="form.monitoring.labValues" label="Drug levels/INR monitoring" />
              </div>
            </div>

            <div class="form-grid" style="margin-top: 16px">
              <div class="form-group">
                <label>Remote Monitoring Devices</label>
                <v-combobox
                  v-model="form.monitoring.devices"
                  :items="['Glucose monitor', 'BP cuff', 'Pulse oximeter', 'Scales', 'Thermometer', 'Holter monitor']"
                  multiple outlined dense chips
                />
              </div>
            </div>
          </section>

          <!-- Communication Plan -->
          <section class="form-section">
            <h3 class="section-title">💬 Communication Plan</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Patient Contact Method</label>
                <v-select
                  v-model="form.communication.contactMethod"
                  :items="['Phone call', 'Text message', 'Email', 'Telehealth', 'Home visit']"
                  outlined dense
                />
              </div>
              <div class="form-group">
                <label>Follow-up Call Frequency</label>
                <v-select
                  v-model="form.communication.frequency"
                  :items="['Daily', 'Every 2-3 days', 'Weekly', 'Bi-weekly', 'As needed']"
                  outlined dense
                />
              </div>
              <div class="form-group">
                <label>First Contact Scheduled</label>
                <v-text-field v-model="form.communication.firstContactDate" type="datetime-local" outlined dense />
              </div>
            </div>
          </section>

          <!-- Escalation Criteria -->
          <section class="form-section">
            <h3 class="section-title">⚠️ Escalation Criteria</h3>
            <v-textarea
              v-model="form.escalationCriteria"
              label="When to escalate care/readmit"
              placeholder="Define specific parameters that warrant escalation..."
              outlined dense rows="4"
            />
          </section>

          <div class="form-actions">
            <v-btn type="button" outlined @click="$emit('close')">Cancel</v-btn>
            <v-btn type="submit" color="primary" dark>Save Follow-up Plan</v-btn>
          </div>
        </form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'FollowUpTasksForm',
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true },
    dischargeDate: { type: String, default: '' }
  },
  data() {
    return {
      form: {
        dischargeDate: this.dischargeDate || new Date().toISOString().split('T')[0],
        completionDate: '',
        tasks: [],
        monitoring: {
          dailyVitals: false, dailyPain: false, dailySymptoms: false, dailyIntake: false,
          woundDaily: false, woundPhotos: false, woundCulture: false,
          labWork: false, imaging: false, pathology: false,
          medicationAdherence: false, sideEffects: false, labValues: false,
          devices: []
        },
        communication: {
          contactMethod: 'Phone call',
          frequency: 'Weekly',
          firstContactDate: ''
        },
        escalationCriteria: ''
      }
    }
  },
  methods: {
    ...mapActions('discharge', ['createFollowUpPlan']),
    addTask() {
      this.form.tasks.push({
        priority: 'Medium',
        description: '',
        dueDate: '',
        assignedTo: 'Patient',
        status: 'Pending',
        notes: ''
      })
    },
    removeTask(idx) {
      this.form.tasks.splice(idx, 1)
    },
    async submitForm() {
      try {
        await this.createFollowUpPlan({
          patientId: this.patientId,
          encounterId: this.encounterId,
          ...this.form,
          createdAt: new Date().toISOString()
        })
        this.$emit('save', this.form)
      } catch (error) {
        alert('Error saving follow-up plan')
      }
    }
  }
}
</script>

<style scoped>
.followup-tasks-form { width: 100%; }
.form-header { background: linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%); color: white !important; padding: 16px; display: flex; align-items: center; gap: 12px; }
.close-btn { border: none; background: transparent; cursor: pointer; color: white; padding: 4px; }
.form-body { padding: 24px; max-height: calc(100vh - 200px); overflow-y: auto; }
.form-section { margin-bottom: 24px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.section-title { color: #0f172a; font-size: 13px; font-weight: 900; margin: 0; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { color: #334155; font-size: 12px; font-weight: 700; }
.tasks-list { display: flex; flex-direction: column; gap: 12px; }
.task-card { display: flex; gap: 8px; padding: 12px; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 4px; }
.task-priority { flex: 0 0 80px; }
.priority-select { margin: 0; }
.task-content { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.task-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; }
.monitoring-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; }
.monitoring-item { padding: 12px; border: 1px solid #e2e8f0; border-radius: 4px; background: #f8fafc; }
.monitoring-item h4 { margin: 0 0 12px; color: #0f172a; font-size: 12px; font-weight: 700; }
.form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
</style>
