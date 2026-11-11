<template>
  <div class="followup-tasks-form">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-clipboard-check-outline</v-icon>
        <span>{{ $t('clinical360.discharge.follow_up_form.title') }}</span>
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
            <h3 class="section-title">📌 {{ $t('clinical360.discharge.follow_up_form.section_overview_title') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.follow_up_form.discharge_date_label') }}</label>
                <v-text-field v-model="form.dischargeDate" type="date" outlined dense readonly />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.follow_up_form.completion_date_label') }}</label>
                <v-text-field v-model="form.completionDate" type="date" outlined dense />
              </div>
            </div>
          </section>

          <!-- Task List -->
          <section class="form-section">
            <div class="section-header">
              <h3 class="section-title">{{ $t('clinical360.discharge.follow_up_form.section_tasks_title') }}</h3>
              <v-btn small text color="primary" @click="addTask">
                <v-icon small>mdi-plus</v-icon>{{ $t('clinical360.discharge.follow_up_form.add_task_btn') }}
              </v-btn>
            </div>

            <div class="tasks-list">
              <div v-for="(task, idx) in form.tasks" :key="idx" class="task-card">
                <div class="task-priority">
                  <v-select
                    v-model="form.tasks[idx].priority"
                    :items="priorityOptions"
                    item-value="value"
                    item-text="text"
                    outlined dense
                    class="priority-select"
                  />
                </div>
                <div class="task-content">
                  <v-text-field
                    v-model="form.tasks[idx].description"
                    :placeholder="$t('clinical360.discharge.follow_up_form.task_description_placeholder')"
                    outlined dense
                  />
                  <div class="task-details">
                    <v-text-field
                      v-model="form.tasks[idx].dueDate"
                      type="date"
                      :label="$t('clinical360.discharge.follow_up_form.due_date_label')"
                      outlined dense
                    />
                    <v-select
                      v-model="form.tasks[idx].assignedTo"
                      :items="assigneeOptions"
                      item-value="value"
                      item-text="text"
                      :label="$t('clinical360.discharge.follow_up_form.assigned_to_label')"
                      outlined dense
                    />
                    <v-select
                      v-model="form.tasks[idx].status"
                      :items="taskStatusOptions"
                      item-value="value"
                      item-text="text"
                      :label="$t('clinical360.discharge.follow_up_form.status_label')"
                      outlined dense
                    />
                  </div>
                  <v-text-field
                    v-model="form.tasks[idx].notes"
                    :placeholder="$t('clinical360.discharge.follow_up_form.task_notes_placeholder')"
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
            <h3 class="section-title">📊 {{ $t('clinical360.discharge.follow_up_form.section_monitoring_title') }}</h3>
            <div class="monitoring-grid">
              <div class="monitoring-item">
                <h4>{{ $t('clinical360.discharge.follow_up_form.daily_monitoring_title') }}</h4>
                <v-checkbox v-model="form.monitoring.dailyVitals" :label="$t('clinical360.discharge.follow_up_form.monitoring_vitals')" />
                <v-checkbox v-model="form.monitoring.dailyPain" :label="$t('clinical360.discharge.follow_up_form.monitoring_pain')" />
                <v-checkbox v-model="form.monitoring.dailySymptoms" :label="$t('clinical360.discharge.follow_up_form.monitoring_symptoms')" />
                <v-checkbox v-model="form.monitoring.dailyIntake" :label="$t('clinical360.discharge.follow_up_form.monitoring_intake_output')" />
              </div>

              <div class="monitoring-item">
                <h4>{{ $t('clinical360.discharge.follow_up_form.wound_monitoring_title') }}</h4>
                <v-checkbox v-model="form.monitoring.woundDaily" :label="$t('clinical360.discharge.follow_up_form.monitoring_wound_daily')" />
                <v-checkbox v-model="form.monitoring.woundPhotos" :label="$t('clinical360.discharge.follow_up_form.monitoring_wound_photos')" />
                <v-checkbox v-model="form.monitoring.woundCulture" :label="$t('clinical360.discharge.follow_up_form.monitoring_wound_culture')" />
              </div>

              <div class="monitoring-item">
                <h4>{{ $t('clinical360.discharge.follow_up_form.lab_monitoring_title') }}</h4>
                <v-checkbox v-model="form.monitoring.labWork" :label="$t('clinical360.discharge.follow_up_form.monitoring_lab_work')" />
                <v-checkbox v-model="form.monitoring.imaging" :label="$t('clinical360.discharge.follow_up_form.monitoring_imaging')" />
                <v-checkbox v-model="form.monitoring.pathology" :label="$t('clinical360.discharge.follow_up_form.monitoring_pathology')" />
              </div>

              <div class="monitoring-item">
                <h4>{{ $t('clinical360.discharge.follow_up_form.medication_monitoring_title') }}</h4>
                <v-checkbox v-model="form.monitoring.medicationAdherence" :label="$t('clinical360.discharge.follow_up_form.monitoring_medication_adherence')" />
                <v-checkbox v-model="form.monitoring.sideEffects" :label="$t('clinical360.discharge.follow_up_form.monitoring_side_effects')" />
                <v-checkbox v-model="form.monitoring.labValues" :label="$t('clinical360.discharge.follow_up_form.monitoring_lab_values')" />
              </div>
            </div>

            <div class="form-grid" style="margin-top: 16px">
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.follow_up_form.remote_devices_label') }}</label>
                <v-combobox
                  v-model="form.monitoring.devices"
                  :items="deviceOptions"
                  item-value="value"
                  item-text="text"
                  multiple outlined dense chips
                />
              </div>
            </div>
          </section>

          <!-- Communication Plan -->
          <section class="form-section">
            <h3 class="section-title">💬 {{ $t('clinical360.discharge.follow_up_form.section_communication_title') }}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.follow_up_form.contact_method_label') }}</label>
                <v-select
                  v-model="form.communication.contactMethod"
                  :items="contactMethodOptions"
                  item-value="value"
                  item-text="text"
                  outlined dense
                />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.follow_up_form.call_frequency_label') }}</label>
                <v-select
                  v-model="form.communication.frequency"
                  :items="frequencyOptions"
                  item-value="value"
                  item-text="text"
                  outlined dense
                />
              </div>
              <div class="form-group">
                <label>{{ $t('clinical360.discharge.follow_up_form.first_contact_label') }}</label>
                <v-text-field v-model="form.communication.firstContactDate" type="datetime-local" outlined dense />
              </div>
            </div>
          </section>

          <!-- Escalation Criteria -->
          <section class="form-section">
            <h3 class="section-title">⚠️ {{ $t('clinical360.discharge.follow_up_form.section_escalation_title') }}</h3>
            <v-textarea
              v-model="form.escalationCriteria"
              :label="$t('clinical360.discharge.follow_up_form.escalation_label')"
              :placeholder="$t('clinical360.discharge.follow_up_form.escalation_placeholder')"
              outlined dense rows="4"
            />
          </section>

          <div class="form-actions">
            <v-btn type="button" outlined @click="$emit('close')">{{ $t('clinical360.discharge.follow_up_form.cancel_btn') }}</v-btn>
            <v-btn type="submit" color="primary" dark>{{ $t('clinical360.discharge.follow_up_form.save_btn') }}</v-btn>
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
  computed: {
    priorityOptions() {
      return [
        ['priority_critical', 'Critical'], ['priority_high', 'High'], ['priority_medium', 'Medium'], ['priority_low', 'Low']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.discharge.follow_up_form.${k}`) }))
    },
    assigneeOptions() {
      return [
        ['assignee_patient', 'Patient'], ['assignee_caregiver', 'Caregiver'], ['assignee_nurse', 'Nurse'],
        ['assignee_coordinator', 'Coordinator'], ['assignee_md', 'MD'], ['assignee_other', 'Other']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.discharge.follow_up_form.${k}`) }))
    },
    taskStatusOptions() {
      return [
        ['task_status_pending', 'Pending'], ['task_status_in_progress', 'In progress'],
        ['task_status_completed', 'Completed'], ['task_status_overdue', 'Overdue']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.discharge.follow_up_form.${k}`) }))
    },
    deviceOptions() {
      return [
        ['device_glucose_monitor', 'Glucose monitor'], ['device_bp_cuff', 'BP cuff'], ['device_pulse_oximeter', 'Pulse oximeter'],
        ['device_scales', 'Scales'], ['device_thermometer', 'Thermometer'], ['device_holter_monitor', 'Holter monitor']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.discharge.follow_up_form.${k}`) }))
    },
    contactMethodOptions() {
      return [
        ['contact_method_phone_call', 'Phone call'], ['contact_method_text_message', 'Text message'],
        ['contact_method_email', 'Email'], ['contact_method_telehealth', 'Telehealth'], ['contact_method_home_visit', 'Home visit']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.discharge.follow_up_form.${k}`) }))
    },
    frequencyOptions() {
      return [
        ['frequency_daily', 'Daily'], ['frequency_every_2_3_days', 'Every 2-3 days'], ['frequency_weekly', 'Weekly'],
        ['frequency_biweekly', 'Bi-weekly'], ['frequency_as_needed', 'As needed']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.discharge.follow_up_form.${k}`) }))
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
        alert(this.$t('clinical360.discharge.follow_up_form.error_save_failed'))
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
