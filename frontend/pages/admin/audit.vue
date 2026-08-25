
<template>
  <v-container fluid class="gov-content pa-10">

    <v-row class="mb-10 no-gutters align-center">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar tile color="#003366" size="48" class="mr-4 shadow-sm">
            <v-icon dark>mdi-history</v-icon>
          </v-avatar>
          <div>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">ADMIN — INTEGRITY LAYER</span>
            <h1 class="text-h4 font-weight-black gov-text-primary ls-tight uppercase">AUDIT LOG</h1>
          </div>
        </div>
      </v-col>
      <v-spacer />
      <v-col cols="auto">
        <v-btn outlined color="#003366" tile height="44" class="font-weight-black text-caption ls-1 px-6" @click="exportLog">
          <v-icon left small>mdi-database-export</v-icon>EXPORT (.JSON)
        </v-btn>
      </v-col>
    </v-row>

    <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
      <div class="pa-4 bg-grey lighten-4 d-flex align-center border-bottom flex-wrap" style="gap:12px">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search log..."
          single-line hide-details flat outlined tile dense
          class="bg-white rounded-0" style="max-width:300px"
        ></v-text-field>
        <v-select
          v-model="actionFilter"
          :items="actionTypes"
          label="Filter by Action"
          clearable single-line hide-details flat outlined tile dense
          class="bg-white rounded-0" style="max-width:240px"
        ></v-select>
        <v-spacer />
        <div class="text-caption font-weight-black grey--text uppercase ls-1">
          {{ filteredLog.length }} EVENTS
        </div>
      </div>

      <v-data-table
        :headers="headers"
        :items="filteredLog"
        :search="search"
        :items-per-page="15"
        class="gov-table"
        tile elevation="0"
        sort-by="timestamp"
        sort-desc
      >
        <template v-slot:item.action="{ item }">
          <v-chip x-small dark label :color="actionColor(item.action)" class="font-weight-black">{{ item.action }}</v-chip>
        </template>
        <template v-slot:item.timestamp="{ item }">
          <span class="text-caption grey--text font-weight-bold">{{ fmt(item.timestamp) }}</span>
        </template>
      </v-data-table>
    </v-card>

  </v-container>
</template>

<script>
export default {
  head: { title: 'Audit Log' },
  data() {
    return {
      search: '',
      actionFilter: null,
      headers: [
        { text: 'ACTION',    value: 'action' },
        { text: 'ACTOR',     value: 'actor' },
        { text: 'DETAIL',    value: 'detail' },
        { text: 'TIMESTAMP', value: 'timestamp', align: 'right' }
      ]
    }
  },
  computed: {
    auditLog()    { return this.$store.getters['facility/getAuditLog'] },
    actionTypes() { return [...new Set(this.auditLog.map(e => e.action))] },
    filteredLog() {
      if (!this.actionFilter) return this.auditLog
      return this.auditLog.filter(e => e.action === this.actionFilter)
    }
  },
  methods: {
    fmt(ts) { return new Date(ts).toLocaleString() },
    actionColor(a) {
      return { FACILITY_REGISTERED: '#003366', ACCOUNT_CREATED: '#0B3D2E', ACCOUNT_DEACTIVATED: '#C0392B', PASSWORD_RESET: '#F4A300' }[a] || '#6B7280'
    },
    exportLog() {
      const data = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.auditLog, null, 2))
      const a = document.createElement('a')
      a.setAttribute('href', data)
      a.setAttribute('download', `audit_log_${Date.now()}.json`)
      document.body.appendChild(a); a.click(); a.remove()
    }
  }
}
</script>

<style scoped>
.gov-card { background: white !important; }
.gov-text-primary { color: #1B1F23 !important; }
.b-1 { border: 1px solid #E5E7EB; }
.border-bottom { border-bottom: 1px solid #E5E7EB; }
.bg-white { background: white !important; }
.shadow-sm { box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }
.ls-tight { letter-spacing: -1.2px !important; }
.ls-1 { letter-spacing: 0.8px !important; }
.uppercase { text-transform: uppercase; }
.gov-table { background: white !important; }
.gov-table ::v-deep th { background:#F8FAFC !important; color:#1B1F23 !important; font-size:10px !important; font-weight:800; text-transform:uppercase; }
</style>
