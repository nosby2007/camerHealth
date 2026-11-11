<template>
  <div :class="['body-system-nav', { collapsed: isCollapsed }]">
    <div class="nav-header">
      <button class="collapse-btn" @click="toggleCollapse" :title="isCollapsed ? $t('clinical360.flowsheets.body_system_nav.expand') : $t('clinical360.flowsheets.body_system_nav.collapse')">
        <v-icon x-small>{{ isCollapsed ? 'mdi-chevron-right' : 'mdi-chevron-left' }}</v-icon>
      </button>
      <span v-if="!isCollapsed" class="nav-title">{{ $t('clinical360.flowsheets.body_system_nav.body_systems') }}</span>
      <button v-if="!isCollapsed && selectedSystems.length > 0" class="clear-btn" @click="clearFilters" :title="$t('clinical360.flowsheets.body_system_nav.clear_all_filters')">
        ✕
      </button>
    </div>

    <!-- Content (hidden when collapsed) -->
    <div v-if="!isCollapsed" class="nav-content">
      <!-- Select All / Clear All -->
      <label class="nav-item checkbox-item">
        <input
          type="checkbox"
          :checked="selectedSystems.length === uniqueSystems.length && uniqueSystems.length > 0"
          @change="toggleSelectAll"
        />
        <span>{{ $t('clinical360.flowsheets.body_system_nav.all_systems') }}</span>
      </label>

      <!-- Individual systems -->
      <div v-for="system in uniqueSystems" :key="system" class="nav-section">
        <label class="nav-item checkbox-item">
          <input
            type="checkbox"
            :checked="selectedSystems.includes(system)"
            @change="toggleSystem(system)"
          />
          <span>{{ system }}</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FlowsheetBodySystemNav',
  props: {
    templateId: { type: String, required: true },
    sections: { type: Array, required: true }
  },
  data() {
    return {
      selectedSystems: [],
      isCollapsed: false
    }
  },
  computed: {
    uniqueSystems() {
      const systems = this.sections
        .map(s => s.bodySystem)
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort()
      return systems
    }
  },
  methods: {
    toggleSystem(system) {
      const idx = this.selectedSystems.indexOf(system)
      if (idx >= 0) {
        this.selectedSystems.splice(idx, 1)
      } else {
        this.selectedSystems.push(system)
      }
      this.$emit('filter-sections', this.selectedSystems.length > 0 ? this.selectedSystems : null)
    },
    toggleSelectAll(event) {
      if (event.target.checked) {
        this.selectedSystems = [...this.uniqueSystems]
      } else {
        this.selectedSystems = []
      }
      this.$emit('filter-sections', this.selectedSystems.length > 0 ? this.selectedSystems : null)
    },
    clearFilters() {
      this.selectedSystems = []
      this.$emit('filter-sections', null)
    },
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed
      this.$emit('collapse-change', this.isCollapsed)
    }
  }
}
</script>

<style scoped>
.body-system-nav {
  background: #f7faf9;
  border-right: 1px solid #cbd5e1;
  min-width: 0;
  overflow: hidden;
  padding: 0;
  font-size: 12px;
  transition: all 0.3s ease;
  width: auto;
}

.body-system-nav.collapsed {
  width: auto;
  padding: 0;
}

.body-system-nav:not(.collapsed) {
  padding: 8px;
  overflow-y: auto;
}

.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #134e4a;
  padding: 8px;
  border-bottom: 1px solid #cbd5e1;
  margin-bottom: 8px;
  gap: 4px;
}

.body-system-nav.collapsed .nav-header {
  margin-bottom: 0;
  border-bottom: none;
  padding: 8px 4px;
  flex-direction: column;
}

.nav-title {
  flex: 1;
}

.collapse-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #0f766e;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.collapse-btn:hover {
  color: #075d58;
}

.nav-content {
  animation: slideIn 0.3s ease;
}

.clear-btn {
  background: none;
  border: none;
  color: #0f766e;
  cursor: pointer;
  font-size: 14px;
  padding: 0 4px;
  transition: color 0.2s ease;
}

.clear-btn:hover {
  color: #c41e3a;
}

.nav-section {
  margin-bottom: 4px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 2px;
  transition: background 0.2s ease;
  user-select: none;
}

.checkbox-item:hover {
  background: #e8eaea;
}

.checkbox-item input {
  margin-right: 8px;
  cursor: pointer;
  accent-color: #0f766e;
}

.checkbox-item span {
  color: #666;
  font-size: 11px;
}

.checkbox-item input:checked ~ span {
  color: #0f766e;
  font-weight: 600;
}

@keyframes slideIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
