<template>
  <nav class="chart-tabs" role="tablist" aria-label="Patient 360 sections">
    <button
      type="button"
      class="tab-scroll-control"
      aria-label="Scroll tabs left"
      @click="scrollTabs(-1)"
    >
      <v-icon x-small>mdi-chevron-left</v-icon>
    </button>

    <div ref="tabScroller" class="tabs-scroll">
      <button
        v-for="tab in primaryTabs"
        :key="tab"
        type="button"
        role="tab"
        :aria-selected="(selectedTab === tab).toString()"
        :class="{ active: selectedTab === tab }"
        @click="$emit('select', tab)"
      >
        {{ tabLabel(tab) }}
      </button>

      <v-menu v-if="overflowTabs.length" offset-y>
        <template #activator="{ on, attrs }">
          <button
            type="button"
            class="more-tab"
            :class="{ active: isOverflowActive }"
            v-bind="attrs"
            v-on="on"
            aria-haspopup="true"
            :aria-label="isOverflowActive ? `More sections, current: ${selectedTab}` : 'More sections'"
          >
            <span>{{ isOverflowActive ? tabLabel(selectedTab) : $t('clinical360.common.more') }}</span>
            <v-icon x-small>mdi-chevron-down</v-icon>
          </button>
        </template>
        <v-list dense>
          <v-list-item
            v-for="tab in overflowTabs"
            :key="tab"
            :class="{ 'v-list-item--active': selectedTab === tab }"
            @click="$emit('select', tab)"
          >
            <v-list-item-title>{{ tabLabel(tab) }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <button
      type="button"
      class="tab-scroll-control"
      aria-label="Scroll tabs right"
      @click="scrollTabs(1)"
    >
      <v-icon x-small>mdi-chevron-right</v-icon>
    </button>
  </nav>
</template>

<script>
export default {
  name: 'TabNav',
  props: {
    primaryTabs: { type: Array, default: () => [] },
    overflowTabs: { type: Array, default: () => [] },
    selectedTab: { type: String, default: '' }
  },
  computed: {
    isOverflowActive() {
      return this.overflowTabs.includes(this.selectedTab)
    }
  },
  methods: {
    tabLabel(tab) {
      const keys = {
        Summary: 'summary',
        'EMR Command Center': 'emr_command',
        'Doctor Command Center': 'doctor_command',
        'Nurse Command Center': 'nurse_command',
        'Chart Review': 'chart_review',
        Navigators: 'navigators',
        Avatar: 'avatar',
        Flowsheets: 'flowsheets',
        Orders: 'orders',
        MAR: 'mar',
        Medications: 'medications',
        'Lab Results': 'lab_results',
        'Wound Management': 'wound_management',
        Notes: 'notes',
        'Care Plan': 'care_plan',
        Education: 'education',
        'Work List': 'work_list',
        Immunizations: 'immunizations',
        'Sedation/Procedure Documentation': 'procedure',
        'Care Teams': 'care_teams',
        Handoff: 'handoff',
        Documents: 'documents',
        Registration: 'registration'
      }
      const key = keys[tab]
      return key ? this.$t(`clinical360.tabs.${key}`) : tab
    },
    scrollTabs(direction) {
      const el = this.$refs.tabScroller
      if (!el) return
      const amount = direction > 0 ? 240 : -240
      el.scrollBy({ left: amount, behavior: 'smooth' })
    }
  }
}
</script>

<style scoped>
.chart-tabs {
  height: 36px;
  display: flex;
  overflow: hidden;
  gap: 2px;
  align-items: end;
  background: #eaf3f1;
  border-bottom: 1px solid #cbd5e1;
}
.tabs-scroll {
  display: flex;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}
.tabs-scroll::-webkit-scrollbar {
  display: none;
}
.chart-tabs button {
  height: 31px;
  border: 0;
  border-right: 1px solid #cbd5e1;
  background: transparent;
  padding: 0 9px;
  color: #0f3f3b;
  white-space: nowrap;
  font-weight: 800;
  cursor: pointer;
}
.tab-scroll-control {
  flex: 0 0 30px;
  width: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: #d9eeea;
  color: #0f3f3b;
}
.chart-tabs button.active {
  background: #fff;
  border-top: 3px solid #0f766e;
}
.more-tab {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
}
.tabs-scroll .more-tab {
  margin-left: 0;
}
.more-tab:focus-visible,
.tab-scroll-control:focus-visible,
.chart-tabs button:focus-visible {
  outline: 2px solid #0f766e;
  outline-offset: -2px;
}
</style>
