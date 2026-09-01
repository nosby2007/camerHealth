<template>
  <nav class="care-plan-subtabs">
    <button
      v-for="tab in tabs"
      :key="tab"
      type="button"
      :class="{ active: selectedSubview === tab }"
      @click="$emit('select', tab)"
    >
      {{ tabLabel(tab) }}
    </button>
  </nav>
</template>

<script>
export default {
  name: 'CarePlanSubTabs',
  props: {
    selectedSubview: { type: String, default: 'overview' }
  },
  data() {
    return {
      tabs: ['overview', 'managePlanDocumentProgress', 'summaryAndNote']
    }
  },
  methods: {
    tabLabel(tab) {
      const keys = {
        overview: 'overview',
        managePlanDocumentProgress: 'manage_plan_document_progress',
        summaryAndNote: 'summary_and_note'
      }
      const key = keys[tab]
      return key ? this.$t(`clinical360.care_plan.sub_tabs.${key}`) : tab
    }
  }
}
</script>

<style scoped>
.care-plan-subtabs {
  display: flex;
  gap: 2px;
  background: #eaf3f1;
  border-bottom: 1px solid #cbd5e1;
  height: 36px;
  align-items: end;
}

.care-plan-subtabs button {
  height: 31px;
  border: 0;
  border-right: 1px solid #cbd5e1;
  background: transparent;
  padding: 0 12px;
  color: #0f3f3b;
  white-space: nowrap;
  font-weight: 800;
  font-size: 12px;
  cursor: pointer;
}

.care-plan-subtabs button.active {
  background: #fff;
  border-top: 3px solid #0f766e;
}

.care-plan-subtabs button:focus-visible {
  outline: 2px solid #0f766e;
  outline-offset: -2px;
}
</style>
