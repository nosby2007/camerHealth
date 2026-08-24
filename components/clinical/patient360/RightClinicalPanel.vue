<template>
  <aside class="right-clinical-panel" :class="{ collapsed }">
    <button
      type="button"
      class="panel-toggle"
      :aria-expanded="(!collapsed).toString()"
      aria-controls="patient-right-panel-body"
      :aria-label="collapsed ? 'Expand clinical sidebar' : 'Collapse clinical sidebar'"
      @click="$emit('toggle')"
    >
      <v-icon small>{{ collapsed ? 'mdi-chevron-left' : 'mdi-chevron-right' }}</v-icon>
    </button>

    <div v-if="!collapsed" id="patient-right-panel-body" class="panel-body">
      <section class="clipboard-panel">
        <h2>Index</h2>
        <div class="index-grid">
          <a v-for="item in sidebarIndex" :key="item" href="#" @click.prevent>{{ item }}</a>
        </div>
      </section>

      <section v-if="canSeeClinicalHistory" class="clipboard-panel">
        <h2>Medical History</h2>
        <div v-for="item in medicalHistory" :key="item.label" class="history-row">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </section>

      <section v-if="canViewOrders" class="orders-panel">
        <div class="orders-header">
          <strong>Inpatient Orders</strong>
          <v-btn v-if="!readOnly" x-small depressed color="#0f766e" dark class="font-weight-black" @click="$emit('new-order')">New</v-btn>
        </div>
        <div v-if="activeOrders.length" class="order-list">
          <article v-for="order in activeOrders" :key="order.title" class="order-row">
            <v-icon small :color="order.color">{{ order.icon }}</v-icon>
            <div>
              <strong>{{ order.title }}</strong>
              <span>{{ order.detail }}</span>
            </div>
          </article>
        </div>
        <div v-else class="no-orders">
          <v-icon size="52" color="#94a3b8">mdi-clipboard-text-outline</v-icon>
          <span>No Orders</span>
        </div>
        <button v-if="!readOnly" class="sign-button" @click="$emit('sign-orders')">
          <v-icon small>mdi-draw-pen</v-icon>
          Sign
        </button>
      </section>

      <section v-if="recentLabItems.length" class="clipboard-panel">
        <h2>Recent Labs</h2>
        <div v-for="item in recentLabItems" :key="item.key" class="history-row">
          <span>{{ item.label }}</span>
          <strong>{{ item.status }}</strong>
        </div>
      </section>

      <section v-if="pendingTasks.length" class="clipboard-panel">
        <h2>Pending Tasks</h2>
        <div v-for="task in pendingTasks" :key="task.id || task.title" class="history-row">
          <span>{{ task.title || 'Care task' }}</span>
          <strong>{{ task.status || 'pending' }}</strong>
        </div>
      </section>

      <section v-if="careTeamRows.length" class="clipboard-panel">
        <h2>Care Team</h2>
        <div v-for="row in careTeamRows" :key="row.label" class="history-row">
          <span>{{ row.label }}</span>
          <strong>{{ row.values && row.values.Role }}</strong>
        </div>
      </section>
    </div>

    <div v-else class="panel-rail" role="group" aria-label="Clinical sidebar (collapsed)">
      <button type="button" class="rail-icon" aria-label="Index / quick links">
        <v-icon small color="#0f766e">mdi-format-list-bulleted</v-icon>
      </button>
      <button v-if="canViewOrders" type="button" class="rail-icon" :aria-label="`Orders: ${activeOrders.length} active`" @click="!readOnly && $emit('sign-orders')">
        <v-icon small color="#0369a1">mdi-clipboard-text-outline</v-icon>
      </button>
      <button type="button" class="rail-icon" :aria-label="`Recent labs: ${recentLabItems.length}`">
        <v-icon small color="#7c3aed">mdi-flask</v-icon>
      </button>
      <button type="button" class="rail-icon" aria-label="Care team">
        <v-icon small color="#0f766e">mdi-account-group</v-icon>
      </button>
      <button type="button" class="rail-icon" :aria-label="`Pending tasks: ${pendingTasks.length}`">
        <v-icon small color="#be123c">mdi-format-list-checks</v-icon>
      </button>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'RightClinicalPanel',
  props: {
    sidebarIndex: { type: Array, default: () => [] },
    medicalHistory: { type: Array, default: () => [] },
    canSeeClinicalHistory: { type: Boolean, default: false },
    canViewOrders: { type: Boolean, default: false },
    activeOrders: { type: Array, default: () => [] },
    labOrders: { type: Array, default: () => [] },
    imagingOrders: { type: Array, default: () => [] },
    tasks: { type: Array, default: () => [] },
    careTeamRows: { type: Array, default: () => [] },
    collapsed: { type: Boolean, default: false },
    readOnly: { type: Boolean, default: false }
  },
  computed: {
    recentLabItems() {
      const labs = this.labOrders.map((order, index) => ({
        key: `lab-${index}`,
        label: order.test || order.orderName || order.title || 'Lab order',
        status: order.status || order.priority || 'Requested'
      }))
      const imaging = this.imagingOrders.map((order, index) => ({
        key: `imaging-${index}`,
        label: order.exam || order.study || order.title || 'Imaging order',
        status: order.status || order.priority || 'Requested'
      }))
      return [...labs, ...imaging].slice(0, 6)
    },
    pendingTasks() {
      return this.tasks.filter(task => task.status === 'pending' || task.status === 'hold').slice(0, 6)
    }
  }
}
</script>

<style scoped>
.right-clinical-panel {
  background: #eef5f4;
  border-left: 2px solid #0f766e;
  overflow: auto;
  position: relative;
  min-width: 0;
}
.panel-toggle {
  position: sticky;
  top: 0;
  z-index: 1;
  width: 100%;
  height: 24px;
  border: 0;
  border-bottom: 1px solid rgba(15, 118, 110, 0.25);
  background: #dcecea;
  color: #0f766e;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.panel-toggle:focus-visible {
  outline: 2px solid #0f766e;
  outline-offset: -2px;
}
.panel-body {
  padding: 8px;
}
.clipboard-panel {
  padding: 8px;
}
.clipboard-panel h2 {
  font-size: 11px;
  color: #134e4a;
  text-transform: uppercase;
  margin: 0 0 6px;
}
.index-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 12px;
}
.index-grid a {
  color: #1d4ed8;
  font-weight: 700;
  text-decoration: none;
}
.history-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid #e2e8f0;
  padding: 4px 0;
}
.history-row span {
  color: #64748b;
}
.orders-panel {
  min-height: 300px;
  position: relative;
}
.orders-header {
  height: 34px;
  background: #e2e8f0;
  border-bottom: 1px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
}
.order-list {
  display: grid;
  gap: 6px;
  padding: 8px;
}
.order-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  border: 1px solid #e2e8f0;
  padding: 8px;
  background: #fff;
}
.order-row div {
  display: grid;
  gap: 2px;
}
.order-row span {
  color: #64748b;
}
.no-orders {
  height: 210px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: #94a3b8;
  font-size: 24px;
  font-weight: 900;
}
.sign-button {
  position: absolute;
  bottom: 8px;
  right: 8px;
  border: 0;
  background: transparent;
  color: #7f1d1d;
  font-weight: 900;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.panel-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 10px 4px;
}
.rail-icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: 1px solid rgba(15, 118, 110, 0.25);
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}
.rail-icon:focus-visible {
  outline: 2px solid #0f766e;
  outline-offset: 2px;
}
</style>
