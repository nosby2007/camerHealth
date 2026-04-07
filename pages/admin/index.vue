
<template>
  <v-container fluid class="gov-content pa-10">

    <!-- Header -->
    <v-row class="mb-10 no-gutters align-center">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar tile color="#003366" size="48" class="mr-4 shadow-sm">
            <v-icon dark>mdi-shield-account</v-icon>
          </v-avatar>
          <div>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">FACILITY ADMINISTRATION</span>
            <h1 class="text-h4 font-weight-black gov-text-primary ls-tight uppercase">{{ facility.name }}</h1>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Facility Info + Staff KPIs -->
    <v-row class="mb-10">
      <v-col cols="12" md="5">
        <v-card flat tile class="gov-card b-1 pa-8 shadow-sm h-100">
          <div class="section-label mb-6">FACILITY RECORD</div>
          <div v-for="row in facilityRows" :key="row.label" class="d-flex mb-3">
            <span class="text-caption font-weight-black grey--text uppercase" style="min-width:110px">{{ row.label }}</span>
            <span class="text-caption font-weight-black gov-text-primary">{{ row.value }}</span>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="7">
        <v-row>
          <v-col v-for="kpi in staffKpis" :key="kpi.role" cols="6">
            <v-card flat tile class="gov-card b-1 pa-6 shadow-sm text-center">
              <v-icon :color="kpi.color" large class="mb-2">{{ kpi.icon }}</v-icon>
              <div class="text-h3 font-weight-black gov-text-primary">{{ kpi.count }}</div>
              <div class="text-caption font-weight-black grey--text uppercase ls-1 mt-1">{{ kpi.label }}</div>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-row class="mb-10">
      <v-col cols="12">
        <v-card flat tile class="gov-card b-1 pa-8 shadow-sm">
          <div class="section-label mb-6">QUICK ACTIONS</div>
          <v-row dense>
            <v-col v-for="action in quickActions" :key="action.to" cols="12" sm="6" md="3">
              <v-btn
                :color="action.color" :outlined="action.outlined"
                dark block height="52" tile depressed
                :to="action.to"
                class="font-weight-black text-caption ls-1"
              >
                <v-icon left small>{{ action.icon }}</v-icon>{{ action.label }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Audit Log -->
    <v-row>
      <v-col cols="12">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-navy white--text font-weight-black text-caption ls-1 uppercase d-flex justify-space-between align-center">
            <span><v-icon left small>mdi-history</v-icon>RECENT AUDIT EVENTS</span>
            <v-btn x-small text color="white" to="/admin/audit" class="font-weight-black">VIEW ALL</v-btn>
          </div>
          <v-data-table
            :headers="auditHeaders"
            :items="recentAudit"
            hide-default-footer
            :items-per-page="6"
            class="gov-table"
            tile elevation="0"
          >
            <template v-slot:item.action="{ item }">
              <v-chip x-small dark label :color="actionColor(item.action)" class="font-weight-black">{{ item.action }}</v-chip>
            </template>
            <template v-slot:item.timestamp="{ item }">
              <span class="text-caption grey--text font-weight-bold">{{ fmt(item.timestamp) }}</span>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

  </v-container>
</template>

<script>
export default {
  head: { title: 'Admin Dashboard' },
  computed: {
    facility() { return this.$store.getters['facility/getFacility'] || {} },
    allStaff() { return this.$store.getters['facility/getAllStaff'] },
    recentAudit() { return this.$store.getters['facility/getAuditLog'].slice(0, 6) },
    facilityRows() {
      const f = this.facility
      return [
        { label: 'Facility ID', value: f.id },
        { label: 'Region',      value: f.region },
        { label: 'City',        value: f.city },
        { label: 'Quarter',     value: f.quarter },
        { label: 'Email',       value: f.email },
        { label: 'Registered',  value: f.createdAt ? this.fmt(f.createdAt) : '—' }
      ]
    },
    staffKpis() {
      return [
        { role: 'DOCTOR',  label: 'Doctors',   icon: 'mdi-doctor',        color: '#003366' },
        { role: 'NURSE',   label: 'Nurses',    icon: 'mdi-medical-bag',   color: '#0B3D2E' },
        { role: 'LAB',     label: 'Lab',       icon: 'mdi-flask',         color: '#1F7A5C' },
        { role: 'IMAGING', label: 'Imaging',   icon: 'mdi-radiology-box', color: '#F4A300' }
      ].map(r => ({ ...r, count: this.allStaff.filter(s => s.role === r.role && s.active).length }))
    },
    quickActions() {
      return [
        { label: 'MANAGE STAFF',     to: '/admin/staff',         icon: 'mdi-account-plus',   color: '#003366', outlined: false },
        { label: 'PATIENT REGISTRY', to: '/clinical/patients',   icon: 'mdi-account-group',  color: '#0B3D2E', outlined: false },
        { label: 'CLINICAL VISITS',  to: '/clinical/visits',     icon: 'mdi-clipboard-list', color: '#1F7A5C', outlined: false },
        { label: 'AUDIT LOG',        to: '/admin/audit',         icon: 'mdi-history',        color: '#003366', outlined: true  }
      ]
    },
    auditHeaders() {
      return [
        { text: 'ACTION',    value: 'action' },
        { text: 'ACTOR',     value: 'actor' },
        { text: 'DETAIL',    value: 'detail' },
        { text: 'TIMESTAMP', value: 'timestamp', align: 'right' }
      ]
    }
  },
  methods: {
    fmt(ts) { return new Date(ts).toLocaleString() },
    actionColor(a) {
      return { FACILITY_REGISTERED: '#003366', ACCOUNT_CREATED: '#0B3D2E', ACCOUNT_DEACTIVATED: '#C0392B', PASSWORD_RESET: '#F4A300' }[a] || '#6B7280'
    }
  }
}
</script>

<style scoped>
.gov-card { background: white !important; }
.bg-navy { background-color: #003366 !important; }
.gov-text-primary { color: #1B1F23 !important; }
.b-1 { border: 1px solid #E5E7EB; }
.h-100 { height: 100%; }
.shadow-sm { box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }
.ls-tight { letter-spacing: -1.2px !important; }
.ls-1 { letter-spacing: 0.8px !important; }
.uppercase { text-transform: uppercase; }
.section-label { font-size:10px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color:#003366; border-left:4px solid #00A99D; padding-left:10px; }
.gov-table { background: white !important; }
.gov-table ::v-deep th { background:#F8FAFC !important; color:#1B1F23 !important; font-size:10px !important; font-weight:800; text-transform:uppercase; }
</style>
