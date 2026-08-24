<template>
  <v-container fluid class="super-admin-shell">
    <header class="admin-header">
      <div>
        <p class="eyebrow">Super Admin</p>
        <h1>Platform Control Center</h1>
        <p class="header-copy">
          Facility governance, staff access, audit review, and clinical workflow readiness.
        </p>
      </div>
      <div class="header-actions">
        <v-btn tile depressed color="#003366" dark class="font-weight-black text-caption" to="/admin/hospital">
          <v-icon left small>mdi-hospital-building</v-icon>Facility model
        </v-btn>
        <v-btn tile outlined color="#003366" class="font-weight-black text-caption" to="/admin/audit">
          <v-icon left small>mdi-history</v-icon>Audit log
        </v-btn>
      </div>
    </header>

    <section class="metric-grid">
      <article v-for="metric in metrics" :key="metric.label" class="metric-tile">
        <div>
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
        </div>
        <v-icon :color="metric.color" size="30">{{ metric.icon }}</v-icon>
      </article>
    </section>

    <section class="control-grid">
      <article v-for="module in modules" :key="module.title" class="module-tile">
        <div class="module-icon">
          <v-icon color="#003366">{{ module.icon }}</v-icon>
        </div>
        <div class="module-body">
          <h2>{{ module.title }}</h2>
          <p>{{ module.text }}</p>
          <v-btn x-small text color="#003366" class="font-weight-black px-0" :to="module.to">
            Open <v-icon right x-small>mdi-arrow-right</v-icon>
          </v-btn>
        </div>
      </article>
    </section>

    <section class="readiness-grid">
      <article class="readiness-panel">
        <h2>Release Readiness</h2>
        <div v-for="item in readiness" :key="item.label" class="status-row">
          <span>{{ item.label }}</span>
          <v-chip x-small label :color="item.color" dark class="font-weight-black">{{ item.status }}</v-chip>
        </div>
      </article>

      <article class="readiness-panel">
        <h2>Priority Actions</h2>
        <ul class="action-list">
          <li v-for="item in priorityActions" :key="item">{{ item }}</li>
        </ul>
      </article>
    </section>
  </v-container>
</template>

<script>
export default {
  name: 'SuperAdminPage',
  head: { title: 'Super Admin Control Center' },
  computed: {
    metrics() {
      return [
        {
          label: 'Staff profiles',
          value: this.staffCount,
          icon: 'mdi-account-multiple',
          color: '#003366'
        },
        {
          label: 'Patients',
          value: this.patientCount,
          icon: 'mdi-account-heart',
          color: '#0f766e'
        },
        {
          label: 'Open tasks',
          value: this.openTaskCount,
          icon: 'mdi-format-list-checks',
          color: '#d97706'
        },
        {
          label: 'Audit scope',
          value: this.auditStatus,
          icon: 'mdi-shield-check',
          color: '#6d28d9'
        }
      ]
    },
    modules() {
      return [
        {
          icon: 'mdi-hospital-building',
          title: 'Facility Model',
          text: 'Review facility setup, care areas, departments, and operational configuration.',
          to: '/admin/hospital'
        },
        {
          icon: 'mdi-account-key',
          title: 'Staff Access',
          text: 'Manage staff invitations, roles, account status, and least-privilege access.',
          to: '/admin/staff'
        },
        {
          icon: 'mdi-monitor-dashboard',
          title: 'Clinical Workspace',
          text: 'Open the chart workflow shell for navigators, flowsheets, orders, and handoffs.',
          to: '/clinical'
        },
        {
          icon: 'mdi-file-document-multiple',
          title: 'Documents',
          text: 'Review filed clinical documents, forms, and operational records.',
          to: '/clinical/documents'
        },
        {
          icon: 'mdi-text-box-check',
          title: 'Templates',
          text: 'Maintain clinical note templates, structured documentation, and order-support content.',
          to: '/clinical/templates'
        },
        {
          icon: 'mdi-history',
          title: 'Audit Review',
          text: 'Review sensitive activity and staff access events for governance follow-up.',
          to: '/admin/audit'
        }
      ]
    },
    readiness() {
      return [
        { label: 'Public pages', status: 'Clean', color: '#0f766e' },
        { label: 'Super admin route', status: 'Protected', color: '#0f766e' },
        { label: 'Environment variables', status: 'Needs real values', color: '#d97706' },
        { label: 'Lint configuration', status: 'Needs setup', color: '#d97706' }
      ]
    },
    priorityActions() {
      return [
        'Replace prototype local credential flows with Supabase Auth for production users.',
        'Keep protected account invitation and audit workflows behind backend endpoints.',
        'Connect the clinical workspace modules to live patient, order, task, and document records.',
        'Complete environment configuration before release builds.'
      ]
    },
    staffCount() {
      const staff = this.$store.getters['facility/getAllStaff']
      return Array.isArray(staff) ? staff.length : 0
    },
    patientCount() {
      const patients = this.$store.getters['clinical/patientDirectory']
      return Array.isArray(patients) ? patients.length : 0
    },
    openTaskCount() {
      const clinicalTasks = this.$store.getters['clinical/getTasks'] || []
      const nursingTasks = this.$store.getters['nursing/getTasks'] || []
      return [...clinicalTasks, ...nursingTasks].filter(task => ['pending', 'in_progress'].includes(task.status)).length
    },
    auditStatus() {
      const audit = this.$store.getters['nursing/getAuditLogs'] || []
      return audit.length ? audit.length : 'Ready'
    }
  },
  mounted() {
    this.$store.commit('clinical/LOAD_FROM_STORAGE')
    this.$store.commit('facility/RELOAD_FROM_STORAGE')
    if (this.$store._modulesNamespaceMap['nursing/']) this.$store.commit('nursing/LOAD_FROM_STORAGE')
  }
}
</script>

<style scoped>
.super-admin-shell {
  min-height: calc(100vh - 72px);
  padding: clamp(18px, 3vw, 32px);
  background: #f5f7f6;
  color: #15324a;
}
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  margin-bottom: 18px;
}
.eyebrow {
  margin: 0 0 6px;
  color: #0f766e;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
h1, h2, p {
  margin-top: 0;
}
h1 {
  margin-bottom: 8px;
  color: #0f2537;
  font-size: clamp(28px, 4vw, 42px);
  line-height: 1.08;
}
.header-copy {
  margin-bottom: 0;
  color: #526b7c;
  font-weight: 700;
}
.header-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}
.metric-tile {
  min-height: 108px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  background: #ffffff;
  border: 1px solid #dce6ec;
  border-radius: 8px;
}
.metric-tile span {
  display: block;
  color: #526b7c;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.metric-tile strong {
  display: block;
  margin-top: 8px;
  color: #0f2537;
  font-size: 30px;
  line-height: 1;
}
.control-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}
.module-tile {
  min-height: 164px;
  display: flex;
  gap: 14px;
  padding: 18px;
  background: #ffffff;
  border: 1px solid #dce6ec;
  border-radius: 8px;
}
.module-icon {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #edf6f4;
  border-radius: 6px;
}
.module-body h2,
.readiness-panel h2 {
  margin-bottom: 8px;
  color: #0f2537;
  font-size: 18px;
}
.module-body p,
.action-list {
  color: #526b7c;
  line-height: 1.55;
}
.readiness-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 12px;
}
.readiness-panel {
  padding: 18px;
  background: #ffffff;
  border: 1px solid #dce6ec;
  border-radius: 8px;
}
.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #edf2f5;
}
.status-row:last-child {
  border-bottom: 0;
}
.status-row span {
  color: #334155;
  font-weight: 800;
}
.action-list {
  margin: 0;
  padding-left: 18px;
}
.action-list li {
  margin-bottom: 10px;
}
@media (max-width: 1060px) {
  .metric-grid,
  .control-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 760px) {
  .admin-header,
  .readiness-grid {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
  .header-actions {
    justify-content: flex-start;
  }
  .metric-grid,
  .control-grid {
    grid-template-columns: 1fr;
  }
}
</style>
