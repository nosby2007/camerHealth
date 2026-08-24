<template>
  <div class="care-plan-overview">
    <div class="overview-grid">
      <!-- Left: Problems/Goals Summary -->
      <section class="overview-section">
        <h3>Care Plan Problems & Goals</h3>
        <div v-if="overview" class="summary-stats">
          <div class="stat">
            <span class="label">Care Plans:</span>
            <span class="value">{{ overview.carePlanCount }}</span>
          </div>
          <div class="stat">
            <span class="label">Problems:</span>
            <span class="value">{{ overview.problemCount }}</span>
          </div>
          <div class="stat">
            <span class="label">Goals:</span>
            <span class="value">{{ overview.goalCount }}</span>
          </div>
          <div class="stat">
            <span class="label">Progressing:</span>
            <span class="value">{{ overview.progressingCount }}</span>
          </div>
          <div class="stat">
            <span class="label">Adequate for Discharge:</span>
            <span class="value">{{ overview.adequateForDischargeCount }}</span>
          </div>
          <div class="stat">
            <span class="label">Undocumented:</span>
            <span class="value">{{ overview.undocumentedCount }}</span>
          </div>
          <div v-if="overview.overdueCount > 0" class="stat warning">
            <span class="label">Overdue Goals:</span>
            <span class="value">{{ overview.overdueCount }}</span>
          </div>
        </div>
        <v-btn x-small text color="#0f766e" @click="$router.push(`/clinical/patients/${patientId}?tab=Care Plan`)">
          View Care Plan Progress
        </v-btn>
      </section>

      <!-- Right: Education Completion -->
      <section class="overview-section">
        <h3>Education Titles Completion</h3>
        <div v-for="edu in educationCompletionSummary" :key="edu.titleId" class="education-item">
          <span class="title">{{ edu.title }}</span>
          <span class="completion">{{ edu.completedCount }} of {{ edu.totalPoints }} complete</span>
        </div>
      </section>
    </div>

    <!-- Bottom: Most Recent Care Plan Note -->
    <section class="overview-section full-width">
      <h3>Most Recent Care Plan Note</h3>
      <div v-if="mostRecentNote" class="note-preview">
        <div class="note-header">
          <span class="title">{{ mostRecentNote.title }}</span>
          <span class="status" :class="mostRecentNote.status">{{ mostRecentNote.status }}</span>
        </div>
        <div class="note-meta">
          <span>{{ mostRecentNote.createdBy }}</span>
          <span>{{ formatDate(mostRecentNote.createdAt) }}</span>
        </div>
        <div class="note-body">{{ mostRecentNote.body }}</div>
      </div>
      <div v-else class="empty">
        No care plan note filed yet.
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'CarePlanOverview',
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true },
    admissionId: { type: String, default: '' },
    role: { type: String, default: '' }
  },
  computed: {
    overview() {
      return this.$store.getters['carePlan/carePlanOverview']?.(this.patientId)
    },
    educationCompletionSummary() {
      return this.$store.getters['education/educationCompletionSummary']?.(this.patientId) || []
    },
    mostRecentNote() {
      return this.$store.getters['carePlan/mostRecentCarePlanNote']?.(this.patientId)
    }
  },
  methods: {
    formatDate(date) {
      if (!date) return '-'
      const d = new Date(date)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }
}
</script>

<style scoped>
.care-plan-overview {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  overflow-y: auto;
}

.overview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.overview-section {
  border: 1px solid #d7e0df;
  background: #fff;
  padding: 12px;
}

.overview-section h3 {
  margin: 0 0 8px 0;
  color: #134e4a;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

.summary-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.stat {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #334155;
}

.stat.warning {
  color: #f97316;
  font-weight: 600;
}

.stat .label {
  flex: 1;
}

.stat .value {
  font-weight: 600;
  color: #0f766e;
}

.education-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  padding: 4px 0;
  border-bottom: 1px solid #e2e8f0;
}

.education-item .title {
  color: #134e4a;
  font-weight: 600;
}

.education-item .completion {
  color: #64748b;
  font-size: 11px;
}

.full-width {
  grid-column: 1 / -1;
}

.note-preview {
  background: #f8fafc;
  padding: 10px;
  border-radius: 3px;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.note-header .title {
  font-weight: 600;
  color: #134e4a;
}

.note-header .status {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 3px;
  background: #dbeafe;
  color: #075985;
}

.note-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #64748b;
  margin-bottom: 8px;
}

.note-body {
  font-size: 11px;
  color: #334155;
  line-height: 1.4;
  max-height: 100px;
  overflow: hidden;
  white-space: pre-wrap;
}

.empty {
  color: #94a3b8;
  font-size: 12px;
  padding: 20px;
  text-align: center;
}
</style>
