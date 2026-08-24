<template>
  <div class="tabs">
    <div class="tabs-container">
      <button
        v-for="template in templates"
        :key="template.id"
        :class="['tab', { active: template.id === selectedTemplateId }]"
        @click="$emit('select-template', template.id)"
      >
        {{ template.label }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FlowsheetTabs',
  props: {
    templates: { type: Array, required: true },
    selectedTemplateId: { type: String, required: true }
  }
}
</script>

<style scoped>
.tabs {
  background: #f9f9f9;
  border-bottom: 1px solid #e0e0e0;
  overflow-x: auto;
}

.tabs-container {
  display: flex;
  gap: 0;
}

.tab {
  padding: 12px 16px;
  border: none;
  background: #f9f9f9;
  color: #666;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab:hover {
  background: #f0f0f0;
}

.tab.active {
  color: #0f766e;
  border-bottom-color: #0f766e;
  background: #fff;
}
</style>
