
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
      <v-spacer />
      <v-col cols="12" md="auto">
         <v-btn
           color="#00A99D"
           dark tile depressed height="48"
           class="font-weight-black text-caption ls-1 px-8"
           :loading="syncing"
           @click="submitNationalReport"
         >
           <v-icon left>mdi-cloud-upload</v-icon>
           SYNC TO NATIONAL
         </v-btn>
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

    <!-- Danger Zone: Factory Reset -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card flat tile class="b-1 overflow-hidden" style="border-color:#C0392B !important">
          <div class="pa-4 d-flex align-center" style="background:#FFF5F5; border-bottom:1px solid #FECACA">
            <v-icon color="#C0392B" class="mr-3">mdi-alert-octagon</v-icon>
            <div>
              <div class="text-caption font-weight-black uppercase ls-1" style="color:#C0392B">DANGER ZONE</div>
              <div class="text-caption grey--text font-weight-medium">Actions here are irreversible on this device.</div>
            </div>
          </div>
          <div class="pa-6 d-flex align-center justify-space-between">
            <div>
              <div class="text-caption font-weight-black gov-text-primary mb-1">RE-INITIALIZE FACILITY</div>
              <div class="text-caption grey--text" style="max-width:480px">
                Wipes all local facility data (staff, patients, audit log) from this device and returns to the
                registration page. Use this to set up a new facility with a new organisation prefix.
              </div>
            </div>
            <v-btn
              color="#C0392B" dark tile depressed height="48" class="font-weight-black text-caption ls-1 ml-6"
              @click="resetDialog = true"
            >
              <v-icon left small>mdi-restart-alert</v-icon>
              WIPE &amp; RE-REGISTER
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Confirmation Dialog -->
    <v-dialog v-model="resetDialog" max-width="480" persistent>
      <v-card flat tile class="b-1">
        <div class="pa-4" style="background:#C0392B">
          <div class="white--text font-weight-black text-caption ls-1 uppercase d-flex align-center">
            <v-icon left small color="white">mdi-alert</v-icon>
            CONFIRM FACILITY WIPE
          </div>
        </div>
        <div class="pa-8">
          <p class="text-body-2 font-weight-bold gov-text-primary mb-2">
            This will permanently erase all local data:
          </p>
          <ul class="text-caption mb-6" style="color:#C0392B; font-weight:700; line-height:2">
            <li>Facility registration &amp; org prefix</li>
            <li>All staff accounts &amp; passwords</li>
            <li>All patient records &amp; clinical data</li>
            <li>All audit logs on this device</li>
          </ul>
          <v-alert dense text type="error" class="text-caption font-weight-bold rounded-0 mb-6">
            Type <strong>WIPE</strong> below to confirm.
          </v-alert>
          <v-text-field
            v-model="wipeConfirmText"
            label="Type WIPE to confirm"
            outlined tile dense
            class="mb-4 rounded-0"
          ></v-text-field>
          <v-row dense>
            <v-col cols="7">
              <v-btn
                color="#C0392B" dark block height="48" tile depressed
                :disabled="wipeConfirmText !== 'WIPE'"
                :loading="wiping"
                @click="doWipe"
                class="font-weight-black text-caption"
              >
                WIPE ALL DATA &amp; RE-REGISTER
              </v-btn>
            </v-col>
            <v-col cols="5">
              <v-btn color="grey lighten-2" block height="48" tile depressed @click="cancelWipe" class="font-weight-black text-caption">CANCEL</v-btn>
            </v-col>
          </v-row>
        </div>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>
export default {
  head: { title: 'Admin Dashboard' },
  computed: {
    facility() { return this.$store.getters['facility/getFacility'] || {} },
    allStaff() { return this.$store.getters['facility/getAllStaff'] || [] },
    confirmedVisits() { return (this.$store.getters['clinical/getVisits'] || []).filter(v => v && v.status === 'Confirmed') },
    recentAudit() { return (this.$store.getters['facility/getAuditLog'] || []).slice(0, 6) },
    facilityRows() {
      const f = this.facility
      return [
        { label: 'Facility ID',   value: f.code || f.orgPrefix || f.id || '—' },
        { label: 'Facility Name', value: f.name || '—' },
        { label: 'Region',        value: f.region || '—' },
        { label: 'City',          value: f.city || '—' },
        { label: 'Quarter',       value: f.quarter || '—' },
        { label: 'Email',         value: f.email || '—' },
        { label: 'Phone',         value: f.phone || '—' },
        { label: 'Status',        value: f.status || 'active' },
        { label: 'Registered',    value: f.createdAt ? this.fmt(f.createdAt) : '—' }
      ]
    },
    staffKpis() {
      const staffList = this.allStaff || []
      return [
        { role: 'DOCTOR',  label: 'Doctors',   icon: 'mdi-doctor',        color: '#003366' },
        { role: 'NURSE',   label: 'Nurses',    icon: 'mdi-medical-bag',   color: '#0B3D2E' },
        { role: 'LAB',     label: 'Lab',       icon: 'mdi-flask',         color: '#1F7A5C' },
        { role: 'IMAGING', label: 'Imaging',   icon: 'mdi-radiology-box', color: '#F4A300' }
      ].map(r => ({ ...r, count: staffList.filter(s => s && s.role === r.role && s.status !== 'inactive').length }))
    },

    quickActions() {
      return [
        { label: 'MANAGE STAFF',     to: '/admin/staff',         icon: 'mdi-account-plus',   color: '#003366', outlined: false },
        { label: 'HOSPITAL MODEL',   to: '/admin/hospital',      icon: 'mdi-hospital-building', color: '#003366', outlined: false },
        { label: 'PATIENT REGISTRY', to: '/clinical/patients',   icon: 'mdi-account-group',  color: '#0B3D2E', outlined: false },
        { label: 'CLINICAL VISITS',  to: '/clinical/visits',     icon: 'mdi-clipboard-list', color: '#1F7A5C', outlined: false },
        { label: 'AUDIT LOG',        to: '/admin/audit',         icon: 'mdi-history',        color: '#003366', outlined: true  },
        { label: 'PRICE CATALOG',     to: '/admin/tarification',  icon: 'mdi-tag-multiple',   color: '#1F7A5C', outlined: true  }
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
  data() {
    return {
      syncing: false,
      resetDialog: false,
      wiping: false,
      wipeConfirmText: ''
    }
  },
  async mounted() {
    const facilityId = this.$store.state.auth.facilityId
    if (facilityId && !this.facility.id) {
      try { await this.$store.dispatch('facility/fetchFacility', facilityId) } catch(e) {}
    }
    // Fetch staff, departments, and audit log from DB
    await Promise.allSettled([
      this.$store.dispatch('facility/fetchStaff'),
      this.$store.dispatch('facility/fetchDepartments'),
      this.$store.dispatch('facility/fetchAuditLog', { limit: 20 })
    ])
  },
  methods: {
    fmt(ts) { return new Date(ts).toLocaleString() },
    actionColor(a) {
      return { FACILITY_REGISTERED: '#003366', ACCOUNT_CREATED: '#0B3D2E', ACCOUNT_DEACTIVATED: '#C0392B', PASSWORD_RESET: '#F4A300' }[a] || '#6B7280'
    },
    async submitNationalReport() {
      this.syncing = true;
      try {
        const stats = {
           facility_name: this.facility.name,
           region: this.facility.region,
           disease: 'Consolidated Facility Report',
           case_count: this.confirmedVisits.length
        }
        await this.$store.dispatch('clinical/syncToSupabase', stats)
        this.$toast.success('National Telemetry Synced Successfully')
      } catch (err) {
        console.error(err);
        this.$toast.error('Sync failed. Check connection.')
      } finally {
        setTimeout(() => { this.syncing = false }, 1000)
      }
    },
    cancelWipe() {
      this.resetDialog = false
      this.wipeConfirmText = ''
    },
    async doWipe() {
      if (this.wipeConfirmText !== 'WIPE') return
      this.wiping = true
      try {
        // Wipe facility store (localStorage + Vuex)
        await this.$store.dispatch('facility/wipeAllData')
        // Wipe auth session
        this.$store.commit('auth/CLEAR_SESSION')
        // Also clear any clinical data in sessionStorage
        if (process.client) {
          sessionStorage.clear()
          // Remove all camero_ keys from localStorage that aren't covered by facility store
          Object.keys(localStorage)
            .filter(k => k.startsWith('camero_'))
            .forEach(k => localStorage.removeItem(k))
        }
        this.$toast.success('Facility data wiped. Redirecting to registration...')
        setTimeout(() => this.$router.push('/register'), 800)
      } catch (err) {
        this.$toast.error('Wipe failed. Please try again.')
      } finally {
        this.wiping = false
        this.resetDialog = false
        this.wipeConfirmText = ''
      }
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
