<template>
  <div class="manage-progress-workspace">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="action-group">
        <v-btn x-small depressed color="#0f766e" dark @click="showAddDialog = true">
          <v-icon x-small left>mdi-plus</v-icon>Add Care Plan
        </v-btn>
        <v-menu offset-y>
          <template #activator="{ on, attrs }">
            <v-btn x-small text v-bind="attrs" v-on="on">
              Apply to all undocumented
              <v-icon x-small>mdi-chevron-down</v-icon>
            </v-btn>
          </template>
          <v-list dense>
            <v-list-item v-for="status in progressStatuses" :key="status" @click="applyToAll(status)">
              <v-list-item-title>{{ statusLabel(status) }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>

      <div class="filter-group">
        <v-checkbox v-model="showActive" dense label="Active Only" class="mt-0" />
      </div>
    </div>

    <!-- Warning Banner -->
    <div v-if="overdueGoals.length > 0" class="warning-banner">
      <v-icon small>mdi-alert</v-icon>
      {{ overdueGoals.length }} goal(s) have overdue expected end dates.
    </div>

    <!-- Main Content -->
    <div class="manage-content" :class="{ 'tree-collapsed': treeCollapsed }">
      <!-- Left Tree -->
      <div v-if="!treeCollapsed" class="tree-panel">
        <div class="tree-header">
          <v-btn x-small text @click="expandAll = !expandAll" class="expand-collapse-all">
            {{ expandAll ? 'Collapse All' : 'Expand All' }}
          </v-btn>
          <button class="collapse-btn" @click="treeCollapsed = true" title="Collapse sidebar">
            <v-icon x-small>mdi-chevron-left</v-icon>
          </button>
        </div>
        <CarePlanTree
          :patient-id="patientId"
          :expand-all="expandAll"
          @select-goal="selectedGoalId = $event"
        />
      </div>
      <button v-else class="expand-tree-btn" @click="treeCollapsed = false" title="Expand sidebar">
        <v-icon x-small>mdi-chevron-right</v-icon>
      </button>

      <!-- Center Progress Documentation -->
      <div class="progress-panel">
        <div v-if="selectedGoal" class="goal-detail">
          <h4>{{ selectedGoal.label }}</h4>
          <p v-if="selectedGoal.description" class="description">{{ selectedGoal.description }}</p>

          <div class="progress-buttons">
            <button
              v-for="status in progressStatuses"
              :key="status"
              type="button"
              :class="['progress-btn', { active: selectedGoal.lastProgressStatus === status }]"
              @click="documentProgress(status)"
            >
              {{ statusLabel(status) }}
            </button>
          </div>

          <div v-if="selectedGoal.lastProgressStatus" class="last-documented">
            Last documented: {{ selectedGoal.lastDocumentedBy }} on {{ formatDate(selectedGoal.lastDocumentedAt) }}
          </div>
        </div>
        <div v-else class="empty">
          Select a goal to document progress.
        </div>
      </div>
    </div>

    <!-- Bottom Actions -->
    <div class="bottom-actions">
      <v-btn x-small text @click="markReviewed">
        <v-icon x-small left>mdi-check-circle</v-icon>Mark as Reviewed
      </v-btn>
    </div>

    <!-- Add Care Plan Dialog -->
    <v-dialog v-model="showAddDialog" max-width="500" persistent>
      <v-card>
        <v-card-title>Add Care Plan</v-card-title>
        <v-card-text>
          <v-text-field v-model="newPlan.name" label="Care Plan Name" outlined dense />
          <v-select v-model="newPlan.type" label="Type" :items="carePlanTypes" outlined dense />
          <v-textarea v-model="newPlan.problem" label="Problem / diagnosis" rows="2" outlined dense />
          <v-textarea v-model="newPlan.goal" label="Goal" rows="2" outlined dense />
          <v-textarea v-model="newPlan.intervention" label="Intervention" rows="2" outlined dense />
          <v-textarea v-model="newPlan.expectedOutcome" label="Expected outcome" rows="2" outlined dense />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text small @click="showAddDialog = false">Cancel</v-btn>
          <v-btn depressed color="#0f766e" dark small @click="addCarePlan">Add</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import CarePlanTree from './CarePlanTree.vue'

export default {
  name: 'CarePlanManageProgress',
  components: { CarePlanTree },
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true },
    admissionId: { type: String, default: '' },
    role: { type: String, default: '' }
  },
  data() {
    return {
      selectedGoalId: null,
      showActive: true,
      expandAll: false,
      showAddDialog: false,
      treeCollapsed: false,
      progressStatuses: ['progressing', 'not_progressing', 'adequate_for_discharge', 'completed', 'unexpected_discharge_disposition'],
      carePlanTypes: ['general', 'fall_risk', 'skin_integrity', 'pain', 'infection', 'nutrition', 'mobility', 'discharge'],
      newPlan: { name: '', type: 'general', problem: '', goal: '', intervention: '', expectedOutcome: '' }
    }
  },
  computed: {
    overdueGoals() {
      return this.$store.getters['carePlan/overdueGoals']?.(this.patientId) || []
    },
    selectedGoal() {
      if (!this.selectedGoalId) return null
      return this.$store.state.carePlan?.carePlanGoals?.find(g => g.id === this.selectedGoalId)
    }
  },
  methods: {
    documentProgress(status) {
      this.$store.dispatch('carePlan/documentProgress', {
        carePlanId: this.selectedGoal.carePlanId,
        problemId: this.selectedGoal.problemId,
        goalId: this.selectedGoalId,
        outcomeId: null,
        patientId: this.patientId,
        encounterId: this.encounterId,
        progressStatus: status,
        comment: ''
      })
      this.$toast?.success('Progress documented')
    },
    applyToAll(status) {
      const plans = (this.$store.state.carePlan?.carePlans || []).filter(plan => plan.patientId === this.patientId)
      plans.forEach(plan => {
        this.$store.dispatch('carePlan/applyProgressToAllUndocumented', {
          carePlanId: plan.id,
          progressStatus: status,
          patientId: this.patientId,
          encounterId: this.encounterId
        })
      })
      this.$toast?.success('Applied to all undocumented goals')
    },
    markReviewed() {
      const plans = (this.$store.state.carePlan?.carePlans || []).filter(plan => plan.patientId === this.patientId)
      if (plans.length > 0) {
        this.$store.dispatch('carePlan/markCarePlanReviewed', {
          carePlanId: plans[0].id,
          patientId: this.patientId,
          encounterId: this.encounterId,
          comment: ''
        })
        this.$toast?.success('Care plan marked as reviewed')
      }
    },
    async addCarePlan() {
      const planRecord = await this.$store.dispatch('carePlan/addCarePlan', {
        patientId: this.patientId,
        encounterId: this.encounterId,
        admissionId: this.admissionId,
        name: this.newPlan.name,
        type: this.newPlan.type
      })
      if (this.newPlan.problem) {
        await this.$store.dispatch('carePlan/addProblem', {
          patientId: this.patientId,
          encounterId: this.encounterId,
          admissionId: this.admissionId,
          carePlanId: planRecord.id,
          label: this.newPlan.problem
        })
      }
      if (this.newPlan.goal) {
        const problemId = this.$store.state.carePlan?.carePlanProblems?.find(item => item.patientId === this.patientId && item.carePlanId === planRecord.id && item.label === this.newPlan.problem)?.id || null
        await this.$store.dispatch('carePlan/addGoal', {
          patientId: this.patientId,
          encounterId: this.encounterId,
          admissionId: this.admissionId,
          carePlanId: planRecord.id,
          problemId,
          label: this.newPlan.goal,
          description: this.newPlan.intervention,
          expectedEndDate: null
        })
      }
      if (this.newPlan.expectedOutcome) {
        const goalId = this.$store.state.carePlan?.carePlanGoals?.find(item => item.patientId === this.patientId && item.carePlanId === planRecord.id && item.label === this.newPlan.goal)?.id || null
        await this.$store.dispatch('carePlan/addOutcome', {
          patientId: this.patientId,
          encounterId: this.encounterId,
          admissionId: this.admissionId,
          carePlanId: planRecord.id,
          goalId,
          label: this.newPlan.expectedOutcome
        })
      }
      this.showAddDialog = false
      this.newPlan = { name: '', type: 'general', problem: '', goal: '', intervention: '', expectedOutcome: '' }
      this.$toast?.success('Care plan added')
    },
    statusLabel(status) {
      const labels = {
        progressing: 'Progressing',
        not_progressing: 'Not Progressing',
        adequate_for_discharge: 'Adequate for Discharge',
        completed: 'Completed',
        unexpected_discharge_disposition: 'Unexpected Discharge'
      }
      return labels[status] || status
    },
    formatDate(date) {
      if (!date) return '-'
      const d = new Date(date)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }
}
</script>

<style scoped>
.manage-progress-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8fafc;
  border-bottom: 1px solid #d7e0df;
}

.action-group,
.filter-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.warning-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fef9c3;
  color: #713f12;
  font-size: 12px;
}

.manage-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 0;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.manage-content.tree-collapsed {
  grid-template-columns: 40px 1fr;
}

.tree-panel,
.progress-panel {
  overflow-y: auto;
  border-right: 1px solid #d7e0df;
  padding: 12px;
}

.progress-panel {
  border-right: none;
}

.tree-actions {
  margin-bottom: 12px;
}

.goal-detail h4 {
  margin: 0 0 8px 0;
  color: #134e4a;
  font-size: 13px;
}

.description {
  font-size: 12px;
  color: #64748b;
  margin: 0 0 12px 0;
}

.progress-buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.progress-btn {
  padding: 8px 12px;
  border: 1px solid #d7e0df;
  background: #fff;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
}

.progress-btn:hover {
  background: #f0fdfa;
  border-color: #0f766e;
}

.progress-btn.active {
  background: #dbeafe;
  border-color: #0f766e;
  color: #075985;
}

.last-documented {
  font-size: 11px;
  color: #64748b;
}

.empty {
  color: #94a3b8;
  font-size: 12px;
  text-align: center;
  padding: 20px;
}

.bottom-actions {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  border-top: 1px solid #d7e0df;
  background: #f8fafc;
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}

.tree-header .expand-collapse-all {
  flex: 1;
  text-align: left;
}

.collapse-btn,
.expand-tree-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0f766e;
  transition: background 0.2s ease;
  border-radius: 3px;
}

.collapse-btn:hover,
.expand-tree-btn:hover {
  background: rgba(15, 118, 110, 0.1);
}

.expand-tree-btn {
  width: 100%;
  height: 100%;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
