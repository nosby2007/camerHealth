<template>
  <div class="education-tree">
    <div v-for="title in displayedTitles" :key="title.id" class="tree-item">
      <div class="title-label" @click="toggleTitle(title.id)">
        <v-icon x-small>{{ expandedTitles[title.id] ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
        <span>{{ title.title }}</span>
        <span class="badge">{{ getPointCount(title.id) }}</span>
      </div>
      <div v-if="expandedTitles[title.id]" class="points">
        <div v-for="point in getPoints(title.id)" :key="point.id" class="point-item" @click="$emit('select-point', point.id)">
          <v-icon x-small :class="['status', point.status]">{{ statusIcon(point.status) }}</v-icon>
          <span class="label">{{ point.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EducationTree',
  props: {
    patientId: { type: String, required: true },
    showActive: { type: Boolean, default: true }
  },
  data() {
    return {
      expandedTitles: {}
    }
  },
  computed: {
    displayedTitles() {
      const titles = this.$store.getters['education/educationTitlesForPatient']?.(this.patientId) || []
      return titles.filter(t => {
        if (!this.showActive) return true
        const points = this.getPoints(t.id)
        return points.some(p => p.status !== 'completed' && p.status !== 'resolved')
      })
    }
  },
  methods: {
    getPointCount(titleId) {
      return this.getPoints(titleId).length
    },
    getPoints(titleId) {
      return this.$store.getters['education/educationPointsForTitle']?.(titleId) || []
    },
    toggleTitle(titleId) {
      this.$set(this.expandedTitles, titleId, !this.expandedTitles[titleId])
    },
    statusIcon(status) {
      const icons = {
        active: 'mdi-circle-outline',
        completed: 'mdi-check-circle',
        needs_reinforcement: 'mdi-alert-circle-outline',
        resolved: 'mdi-check-circle',
        not_applicable: 'mdi-circle-outline'
      }
      return icons[status] || 'mdi-circle-outline'
    }
  },
  mounted() {
    if (this.displayedTitles.length > 0) {
      this.$set(this.expandedTitles, this.displayedTitles[0].id, true)
    }
  }
}
</script>

<style scoped>
.education-tree {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tree-item {
  border-bottom: 1px solid #e2e8f0;
}

.title-label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: #134e4a;
}

.title-label:hover {
  background: #f0fdfa;
}

.badge {
  margin-left: auto;
  background: #dbeafe;
  color: #075985;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
}

.points {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: 12px;
}

.point-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  font-size: 11px;
  color: #334155;
  cursor: pointer;
}

.point-item:hover {
  background: #f0fdfa;
}

.status {
  font-size: 12px;
}

.status.active {
  color: #94a3b8;
}

.status.completed {
  color: #16a34a;
}

.status.needs_reinforcement {
  color: #f97316;
}

.status.resolved {
  color: #0f766e;
}
</style>
