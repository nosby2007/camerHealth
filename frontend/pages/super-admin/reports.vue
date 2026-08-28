<template>
  <v-container fluid class="super-admin-shell">
    <header class="admin-header">
      <div>
        <p class="eyebrow">Super Admin · Phase 13</p>
        <h1>RMA — Rapport Mensuel d'Activité</h1>
        <p class="header-copy">Review, validate, and aggregate monthly activity reports across your scope.</p>
      </div>
      <v-btn tile outlined color="#003366" class="font-weight-black text-caption" to="/super-admin/dhis2-mapping">
        <v-icon left small>mdi-swap-horizontal</v-icon>
        DHIS2 Mapping
      </v-btn>
    </header>

    <section class="filters">
      <v-select v-model="filters.status" :items="statusOptions" outlined dense hide-details clearable label="Status" class="filter"></v-select>
      <v-select v-model="filters.reportMonth" :items="monthOptions" outlined dense hide-details clearable label="Month" class="filter"></v-select>
      <v-text-field v-model="filters.reportYear" outlined dense hide-details type="number" label="Year" class="filter"></v-text-field>
      <v-btn tile depressed color="#003366" dark class="font-weight-black text-caption" :loading="loading" @click="load">Filter</v-btn>
    </section>

    <v-data-table :headers="headers" :items="reports" item-key="id" class="gov-table" tile elevation="0">
      <template v-slot:item.facility="{ item }">
        <strong>{{ item.facility ? item.facility.name : item.facilityId }}</strong>
      </template>
      <template v-slot:item.period="{ item }">{{ item.reportMonth }}/{{ item.reportYear }}</template>
      <template v-slot:item.status="{ item }">
        <v-chip x-small label dark :color="statusColor(item.status)" class="font-weight-black">{{ item.status }}</v-chip>
      </template>
      <template v-slot:item.dhis2="{ item }">
        <v-chip v-if="item.dhisSyncStatus === 'success'" x-small label dark color="#0f766e" class="font-weight-black">
          <v-icon left x-small>mdi-check</v-icon>SYNCED
        </v-chip>
        <v-chip v-else-if="item.dhisSyncStatus === 'failed'" x-small label dark color="#be123c" class="font-weight-black">
          <v-icon left x-small>mdi-alert</v-icon>FAILED
        </v-chip>
        <span v-else class="hint" style="margin:0">—</span>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-btn v-if="item.status === 'submitted'" x-small text color="#0f766e" class="font-weight-black" @click="validate(item)">Validate</v-btn>
        <v-btn v-if="item.status === 'submitted'" x-small text color="#be123c" class="font-weight-black" @click="reject(item)">Reject</v-btn>
        <v-btn v-if="['submitted', 'validated'].includes(item.status)" x-small text color="#003366" class="font-weight-black" :loading="syncingId === item.id" @click="syncToDhis2(item)">
          Sync to DHIS2
        </v-btn>
      </template>
    </v-data-table>

    <section class="panel mt-6">
      <h2>Aggregate by unit</h2>
      <div class="agg-filters">
        <v-select v-model="aggUnitId" :items="units" item-text="name" item-value="id" outlined dense hide-details label="Unit" class="filter"></v-select>
        <v-select v-model="aggMonth" :items="monthOptions" outlined dense hide-details label="Month" class="filter"></v-select>
        <v-text-field v-model="aggYear" outlined dense hide-details type="number" label="Year" class="filter"></v-text-field>
        <v-btn tile depressed color="#0f766e" dark class="font-weight-black text-caption" :disabled="!aggUnitId" @click="loadAggregate">Aggregate</v-btn>
      </div>
      <div v-if="aggregate" class="agg-result">
        <p class="hint">{{ aggregate.reportedCount }} / {{ aggregate.facilityCount }} facilities reported.</p>
        <div class="totals-grid">
          <div v-for="(value, key) in aggregate.totals" :key="key" class="total-tile">
            <span>{{ key }}</span>
            <strong>{{ value }}</strong>
          </div>
        </div>
      </div>
    </section>
  </v-container>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'SuperAdminReports',
  head: { title: 'RMA Reports' },
  data() {
    return {
      filters: { status: '', reportMonth: null, reportYear: new Date().getFullYear() },
      aggUnitId: null,
      aggMonth: new Date().getMonth() + 1,
      aggYear: new Date().getFullYear(),
      statusOptions: ['draft', 'submitted', 'validated', 'rejected'],
      monthOptions: Array.from({ length: 12 }, (_, i) => i + 1),
      headers: [
        { text: 'Facility', value: 'facility' },
        { text: 'Period', value: 'period' },
        { text: 'Status', value: 'status' },
        { text: 'DHIS2', value: 'dhis2', sortable: false },
        { text: '', value: 'actions', sortable: false }
      ],
      syncingId: null
    }
  },
  computed: {
    ...mapState('reports', ['reports', 'aggregate', 'loading']),
    ...mapState('organizations', ['units'])
  },
  async mounted() {
    await this.load()
    await this.fetchOrganizations()
  },
  methods: {
    ...mapActions('reports', ['fetchReports', 'validateReport', 'rejectReport', 'fetchAggregate', 'syncDhis2']),
    ...mapActions('organizations', ['fetchOrganizations']),
    async load() {
      await this.fetchReports({
        status: this.filters.status || undefined,
        reportMonth: this.filters.reportMonth || undefined,
        reportYear: this.filters.reportYear || undefined
      })
    },
    async loadAggregate() {
      await this.fetchAggregate({ unitId: this.aggUnitId, month: this.aggMonth, year: this.aggYear })
    },
    async validate(item) {
      const notes = window.prompt('Validation notes (optional):') || ''
      try {
        await this.validateReport({ id: item.id, validationNotes: notes })
      } catch (err) {
        this.$toast.error(err.response?.data?.error || err.message)
      }
    },
    async reject(item) {
      const reason = window.prompt('Rejection reason:')
      if (!reason) return
      try {
        await this.rejectReport({ id: item.id, rejectionReason: reason })
      } catch (err) {
        this.$toast.error(err.response?.data?.error || err.message)
      }
    },
    async syncToDhis2(item) {
      this.syncingId = item.id
      try {
        await this.syncDhis2(item.id)
        this.$toast.success('RMA synced to DHIS2')
      } catch (err) {
        this.$toast.error(err.response?.data?.error || err.message)
      } finally {
        this.syncingId = null
      }
    },
    statusColor(status) {
      return { draft: '#94a3b8', submitted: '#d97706', validated: '#0f766e', rejected: '#be123c' }[status] || '#94a3b8'
    }
  }
}
</script>

<style scoped>
.super-admin-shell { min-height: calc(100vh - 72px); padding: clamp(18px, 3vw, 32px); background: #f5f7f6; color: #15324a; }
.admin-header { margin-bottom: 18px; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.eyebrow { margin: 0 0 6px; color: #0f766e; font-size: 11px; font-weight: 900; letter-spacing: 0.14em; text-transform: uppercase; }
h1 { margin: 0 0 8px; color: #0f2537; font-size: clamp(24px, 3.4vw, 34px); line-height: 1.08; }
.header-copy { margin: 0; color: #526b7c; font-weight: 700; }
.filters, .agg-filters { display: flex; gap: 10px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
.filter { max-width: 180px; }
.panel { background: #fff; border: 1px solid #dce6ec; border-radius: 8px; padding: 16px; }
.panel h2 { color: #0f2537; font-size: 15px; margin-bottom: 12px; }
.hint { color: #94a3b8; font-size: 12px; margin-bottom: 12px; }
.totals-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
.total-tile { border: 1px solid #edf2f5; border-radius: 6px; padding: 10px; }
.total-tile span { display: block; color: #94a3b8; font-size: 10px; text-transform: uppercase; font-weight: 800; }
.total-tile strong { display: block; margin-top: 4px; color: #0f2537; font-size: 20px; }
</style>
