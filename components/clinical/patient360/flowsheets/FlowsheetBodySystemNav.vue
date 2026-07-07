<template>
  <div class="body-system-nav">
    <div class="nav-header">Body Systems</div>
    <button class="nav-item active" @click="$emit('filter-section', null)">All Systems</button>
    <div v-for="section in sections" :key="section.id" class="nav-section">
      <button
        class="nav-item"
        :title="section.bodySystem"
        @click="$emit('filter-section', section.bodySystem)"
      >
        {{ section.bodySystem }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FlowsheetBodySystemNav',
  props: {
    templateId: { type: String, required: true },
    sections: { type: Array, required: true }
  }
}
</script>

<style scoped>
.body-system-nav {
  background: #f9f9f9;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
  padding: 8px;
  font-size: 12px;
}

.nav-header {
  font-weight: 600;
  color: #134e4a;
  padding: 8px;
  border-bottom: 1px solid #ddd;
  margin-bottom: 4px;
}

.nav-section {
  margin-bottom: 2px;
}

.nav-item {
  display: block;
  width: 100%;
  padding: 6px 8px;
  border: none;
  background: transparent;
  text-align: left;
  color: #666;
  cursor: pointer;
  border-radius: 3px;
  font-size: 11px;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: #e8eaea;
  color: #333;
}

.nav-item.active {
  background: #0f766e;
  color: #fff;
}
</style>
