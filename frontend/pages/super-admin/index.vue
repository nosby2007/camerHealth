<template>
  <v-container fluid class="super-admin-shell">
    <header class="admin-header">
      <div>
        <p class="eyebrow">Super Admin · Platform</p>
        <h1>Platform Command Center</h1>
        <p class="header-copy">
          Business operations across every organization and facility on CameroHealth — separate from any single facility's clinical workspace.
        </p>
      </div>
      <div class="header-actions">
        <v-btn tile depressed color="#003366" dark class="font-weight-black text-caption" to="/super-admin/organizations">
          <v-icon left small>mdi-sitemap</v-icon>Organizations
        </v-btn>
        <v-btn tile outlined color="#003366" class="font-weight-black text-caption" to="/super-admin/reports">
          <v-icon left small>mdi-file-chart-check</v-icon>RMA Reports
        </v-btn>
      </div>
    </header>

    <section class="metric-grid">
      <article v-for="metric in metrics" :key="metric.label" class="metric-tile">
        <div>
          <span>{{ metric.label }}</span>
          <strong>{{ loading ? '—' : metric.value }}</strong>
        </div>
        <v-icon :color="metric.color" size="30">{{ metric.icon }}</v-icon>
      </article>
    </section>

    <section class="readiness-grid">
      <article class="readiness-panel">
        <h2>RMA compliance — this month</h2>
        <div v-if="overview" class="compliance-row">
          <div class="compliance-ring" :style="ringStyle">
            <span>{{ overview.rmaCompliance.rate === null ? '—' : overview.rmaCompliance.rate + '%' }}</span>
          </div>
          <div class="compliance-copy">
            <strong>{{ overview.rmaCompliance.submitted }} / {{ overview.rmaCompliance.expected }}</strong>
            <span>facilities reported for {{ overview.rmaCompliance.reportMonth }}/{{ overview.rmaCompliance.reportYear }}</span>
          </div>
        </div>
        <div v-else class="empty">Loading…</div>
      </article>

      <article class="readiness-panel">
        <h2>Recently onboarded facilities</h2>
        <div v-if="overview && overview.recentFacilities.length">
          <div v-for="f in overview.recentFacilities" :key="f.id" class="status-row">
            <span>{{ f.name }} <em class="muted">({{ f.code }})</em></span>
            <v-chip x-small label :color="f.status === 'active' ? '#0f766e' : '#94a3b8'" dark class="font-weight-black">{{ f.status }}</v-chip>
          </div>
        </div>
        <div v-else class="empty">No facilities yet.</div>
      </article>
    </section>

    <section class="readiness-grid mt-4">
      <article class="readiness-panel">
        <h2>Recent platform activity</h2>
        <div v-if="overview && overview.recentAudit.length">
          <div v-for="entry in overview.recentAudit" :key="entry.id" class="status-row">
            <span>{{ entry.action }}<em v-if="entry.detail" class="muted"> — {{ entry.detail }}</em></span>
            <span class="muted small">{{ formatDate(entry.createdAt) }}</span>
          </div>
        </div>
        <div v-else class="empty">No activity recorded yet.</div>
      </article>

      <article class="readiness-panel">
        <h2>Coming next</h2>
        <ul class="action-list">
          <li>Commercial pipeline — leads, demos, quotes, contracts, signed customers.</li>
          <li>Team access for sales/support staff, separate from clinical roles.</li>
          <li>Per-organization subscription/contract status.</li>
        </ul>
      </article>
    </section>
  </v-container>
</template>

<script>
import { platformApi } from '~/services/api'

export default {
  name: 'SuperAdminPage',
  head: { title: 'Platform Command Center' },
  data() {
    return { overview: null, loading: true }
  },
  computed: {
    metrics() {
      const c = this.overview ? this.overview.counts : null
      return [
        { label: 'Organizations', value: c ? c.organizations : 0, icon: 'mdi-domain', color: '#003366' },
        { label: 'Facilities', value: c ? `${c.facilities.active} / ${c.facilities.total}` : 0, icon: 'mdi-hospital-building', color: '#0f766e' },
        { label: 'Staff accounts', value: c ? `${c.staff.active} / ${c.staff.total}` : 0, icon: 'mdi-account-multiple', color: '#d97706' },
        { label: 'Patients (platform)', value: c ? c.patients : 0, icon: 'mdi-account-heart', color: '#6d28d9' }
      ]
    },
    ringStyle() {
      const rate = this.overview && this.overview.rmaCompliance.rate !== null ? this.overview.rmaCompliance.rate : 0
      return { background: `conic-gradient(#0f766e ${rate * 3.6}deg, #e2e8f0 0deg)` }
    }
  },
  async mounted() {
    try {
      const { data } = await platformApi.overview()
      this.overview = data
    } catch (err) {
      this.$toast.error(err.response?.data?.error || err.message)
    } finally {
      this.loading = false
    }
  },
  methods: {
    formatDate(iso) {
      return new Date(iso).toLocaleString()
    }
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
  max-width: 60ch;
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
  font-size: 26px;
  line-height: 1;
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
.readiness-panel h2 {
  margin-bottom: 12px;
  color: #0f2537;
  font-size: 15px;
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
.muted { color: #94a3b8; font-weight: 600; font-style: normal; }
.small { font-size: 11px; }
.empty { color: #94a3b8; font-size: 13px; font-weight: 700; padding: 8px 0; }
.action-list {
  margin: 0;
  padding-left: 18px;
  color: #526b7c;
  line-height: 1.6;
}
.action-list li {
  margin-bottom: 10px;
}
.compliance-row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.compliance-ring {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 72px;
}
.compliance-ring::before {
  content: '';
  position: absolute;
}
.compliance-ring span {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  color: #0f2537;
  font-size: 14px;
}
.compliance-copy {
  display: flex;
  flex-direction: column;
}
.compliance-copy strong {
  color: #0f2537;
  font-size: 20px;
}
.compliance-copy span {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
}
@media (max-width: 1060px) {
  .metric-grid {
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
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
