<template>
  <nav class="chart-tabs" role="tablist" aria-label="Patient 360 sections">
    <button
      v-for="tab in primaryTabs"
      :key="tab"
      type="button"
      role="tab"
      :aria-selected="(selectedTab === tab).toString()"
      :class="{ active: selectedTab === tab }"
      @click="$emit('select', tab)"
    >
      {{ tab }}
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
          <span>{{ isOverflowActive ? selectedTab : 'More' }}</span>
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
          <v-list-item-title>{{ tab }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
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
  }
}
</script>

<style scoped>
.chart-tabs {
  height: 36px;
  display: flex;
  overflow-x: hidden;
  gap: 2px;
  align-items: end;
  background: #eaf3f1;
  border-bottom: 1px solid #cbd5e1;
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
.more-tab:focus-visible,
.chart-tabs button:focus-visible {
  outline: 2px solid #0f766e;
  outline-offset: -2px;
}
</style>
