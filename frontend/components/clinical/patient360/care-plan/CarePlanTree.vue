<template>
  <div class="care-plan-tree">
    <div v-for="plan in carePlans" :key="plan.id" class="plan-node">
      <div
        class="plan-label"
        :class="{ expanded: expandedPlans[plan.id] }"
        @click="togglePlan(plan.id)"
      >
        <v-icon x-small>{{ expandedPlans[plan.id] ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
        <span class="name">{{ plan.name }}</span>
        <span class="status" :class="plan.status">{{ plan.status }}</span>
      </div>

      <div v-if="expandedPlans[plan.id]" class="plan-problems">
        <div v-for="problem in getProblemsByPlan(plan.id)" :key="problem.id" class="problem-node">
          <div class="problem-label">
            <v-icon x-small>mdi-folder</v-icon>
            <span>{{ problem.label }}</span>
          </div>

          <div class="goals">
            <div
              v-for="goal in getGoalsByProblem(problem.id)"
              :key="goal.id"
              :class="['goal-node', { selected: goal.id === selectedGoalId }]"
              @click="$emit('select-goal', goal.id)"
            >
              <v-icon x-small :class="['status-icon', goal.lastProgressStatus || 'undocumented']">
                {{ statusIcon(goal.lastProgressStatus) }}
              </v-icon>
              <span class="label">{{ goal.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CarePlanTree',
  props: {
    patientId: { type: String, required: true },
    expandAll: { type: Boolean, default: false },
    selectedGoalId: { type: String, default: null }
  },
  data() {
    return {
      expandedPlans: {}
    }
  },
  computed: {
    carePlans() {
      return this.$store.getters['carePlan/carePlansForPatient']?.(this.patientId) || []
    }
  },
  watch: {
    expandAll(val) {
      const newExpanded = {}
      this.carePlans.forEach(plan => {
        newExpanded[plan.id] = val
      })
      this.expandedPlans = newExpanded
    }
  },
  methods: {
    getProblemsByPlan(planId) {
      return (this.$store.state.carePlan?.carePlanProblems || [])
        .filter(p => p.carePlanId === planId)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    },
    getGoalsByProblem(problemId) {
      return (this.$store.state.carePlan?.carePlanGoals || [])
        .filter(g => g.problemId === problemId)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    },
    togglePlan(planId) {
      this.$set(this.expandedPlans, planId, !this.expandedPlans[planId])
    },
    statusIcon(status) {
      const icons = {
        progressing: 'mdi-check-circle-outline',
        not_progressing: 'mdi-alert-circle-outline',
        adequate_for_discharge: 'mdi-check-circle',
        completed: 'mdi-check-circle',
        undocumented: 'mdi-circle-outline'
      }
      return icons[status] || 'mdi-circle-outline'
    }
  },
  mounted() {
    // Expand first plan by default
    if (this.carePlans.length > 0) {
      this.$set(this.expandedPlans, this.carePlans[0].id, true)
    }
  }
}
</script>

<style scoped>
.care-plan-tree {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plan-node {
  border: 1px solid #d7e0df;
  background: #fff;
}

.plan-label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  background: #f8fafc;
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
  color: #134e4a;
}

.plan-label:hover {
  background: #eaf3f1;
}

.plan-label .name {
  flex: 1;
}

.plan-label .status {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 3px;
  background: #dbeafe;
  color: #075985;
}

.plan-problems {
  padding: 8px 0;
}

.problem-node {
  border-top: 1px solid #e2e8f0;
  padding: 8px 8px;
}

.problem-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #0f766e;
  font-weight: 600;
  margin-bottom: 6px;
}

.goals {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 12px;
}

.goal-node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  font-size: 11px;
  color: #334155;
  cursor: pointer;
  border-radius: 3px;
}

.goal-node:hover {
  background: #f0fdfa;
}

.goal-node.selected {
  background: #dbeafe;
  color: #075985;
  font-weight: 600;
}

.status-icon {
  flex: 0 0 auto;
}

.status-icon.progressing {
  color: #16a34a;
}

.status-icon.not_progressing {
  color: #ea580c;
}

.status-icon.adequate_for_discharge,
.status-icon.completed {
  color: #0f766e;
}

.status-icon.undocumented {
  color: #94a3b8;
}
</style>
