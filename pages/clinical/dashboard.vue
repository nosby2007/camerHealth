
<template>
  <v-container fluid class="pa-10 gov-content">
    <v-row class="mb-10 no-gutters align-center">
      <v-col cols="12" md="8">
        <div class="text-caption font-weight-black grey--text text-uppercase ls-1 mb-1">CLINICAL OPERATIONAL LAYER</div>
        <h1 class="text-h4 font-weight-black gov-text-primary ls-tight uppercase">
          {{ institution.toUpperCase() }} - PERFORMANCE HUB
        </h1>
      </v-col>
      <v-spacer />
      <v-col cols="auto">
         <v-chip label color="#00A99D" dark class="font-weight-black shadow-sm">
            <v-icon left small>mdi-hospital-marker</v-icon>
            ACTIVE SESSION: {{ userRole.replace('_', ' ') }}
         </v-chip>
      </v-col>
    </v-row>

    <!-- Clinical KPIs -->
    <v-row class="mb-10">
      <v-col cols="12" sm="6" md="3">
         <MiniStatistics 
            title="PATIENTS REGISTERED" 
            :primaryValue="hospitalPatients.length" 
            secondaryLabel="Site Registry"
            :color="'#00A99D'" 
            icon="mdi-account-group"
         />
      </v-col>
      <v-col cols="12" sm="6" md="3">
         <MiniStatistics 
            title="CLINICAL VISITS" 
            :primaryValue="hospitalVisits.length" 
            secondaryLabel="Last 30 Days"
            :color="'#00A99D'" 
            icon="mdi-clipboard-list"
         />
      </v-col>
      <v-col cols="12" sm="6" md="3">
         <MiniStatistics 
            title="CRITICAL INCIDENTS" 
            :primaryValue="criticalCount" 
            secondaryLabel="Active Alerts"
            :color="'#C0392B'" 
            icon="mdi-alert-octagon"
         />
      </v-col>
      <v-col cols="12" sm="6" md="3">
         <v-card flat tile outlined class="gov-card-kpi pa-6 bg-navy white--text h-100 shadow-sm border-none">
            <div class="text-caption font-weight-bold opacity-70 uppercase mb-2 ls-1">Primary Site Focus</div>
            <div class="text-h6 font-weight-black mb-1 ls-tight">{{ topDisease }}</div>
            <v-divider class="my-3 white opacity-10"></v-divider>
            <div class="text-caption grey--text text--lighten-2 italic font-weight-medium">Most prevalent condition in site registry</div>
         </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- Activity Trend -->
      <v-col cols="12" md="8">
        <v-card flat tile outlined class="gov-card b-1 pa-8 shadow-sm">
           <div class="text-caption font-weight-black gov-text-secondary uppercase mb-8 ls-1 px-4 border-left">WEEKLY OPERATIONAL THROUGHPUT</div>
           <apexchart height="320" type="bar" :options="chartOptions" :series="chartSeries"></apexchart>
        </v-card>
      </v-col>
      
      <!-- Recent Admissions -->
      <v-col cols="12" md="4">
        <v-card flat tile outlined class="gov-card b-1 h-100 shadow-sm">
           <div class="pa-4 bg-grey lighten-4 border-bottom font-weight-black grey--text text-caption uppercase ls-1">Recent Site Registry Admissions</div>
           <v-list dense class="pa-0">
              <v-list-item v-for="p in recentPatients" :key="p.id" class="border-bottom py-2">
                 <v-list-item-avatar tile color="#F1F5F9" class="b-1 mr-4">
                    <v-icon color="#00A99D" size="18">mdi-account</v-icon>
                 </v-list-item-avatar>
                 <v-list-item-content>
                    <v-list-item-title class="font-weight-black text-caption gov-text-primary lh-1 mb-1">{{ p.name.toUpperCase() }}</v-list-item-title>
                    <v-list-item-subtitle class="text-caption font-weight-bold">{{ p.age }} YRS | {{ p.gender }} | {{ p.region }}</v-list-item-subtitle>
                 </v-list-item-content>
                 <v-list-item-action>
                    <span class="text-caption grey--text font-weight-bold opacity-60">{{ formatDate(p.createdAt) }}</span>
                 </v-list-item-action>
              </v-list-item>
              <div v-if="recentPatients.length === 0" class="pa-12 text-center grey--text italic text-caption font-weight-bold opacity-40">
                NO RECENT REGISTRY ENTRIES DETECTED
              </div>
           </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import MiniStatistics from "~/components/MiniStatistics";
import _groupBy from 'lodash/groupBy';
import _orderBy from 'lodash/orderBy';

export default {
  head: { title: 'Hospital Intelligence Hub' },
  components: { MiniStatistics },
  computed: {
    institution() { return this.$store.state.auth.institution || 'Unknown Facility' },
    hospitalPatients() { return this.$store.getters['clinical/getPatients'] },
    hospitalVisits() { return this.$store.getters['clinical/getVisits'] },
    userRole() { return this.$store.state.auth.role || 'GUEST' },
    criticalCount() { return this.hospitalVisits.filter(v => v.status === 'Confirmed' || v.severity === 'Critical').length },
    topDisease() {
      if (this.hospitalVisits.length === 0) return 'NONE DETECTED';
      const grouped = _groupBy(this.hospitalVisits, 'disease');
      const sorted = _orderBy(Object.entries(grouped), [e => e[1].length], ['desc']);
      return sorted[0][0].toUpperCase();
    },
    recentPatients() { return [...this.hospitalPatients].reverse().slice(0, 8) },
    chartSeries() { return [{ name: 'Visits', data: [12, 19, 14, 22, this.hospitalVisits.length, 0, 0] }] },
    chartOptions() {
      return {
        chart: { type: 'bar', toolbar: { show: false } },
        colors: ['#00A99D'],
        xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], labels: { style: { fontWeight: 700, colors: '#6B7280' } } },
        plotOptions: { bar: { columnWidth: '40%', borderRadius: 0 } },
        grid: { borderColor: '#F1F5F9' }
      }
    }
  },
  methods: {
    formatDate(d) { return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' }) }
  }
}
</script>

<style scoped>
.gov-card { background: white !important; }
.bg-navy { background: #003366 !important; }
.gov-text-primary { color: #1B1F23 !important; }
.gov-text-secondary { color: #00A99D !important; }
.border-left { border-left: 4px solid #00A99D; }
.border-bottom { border-bottom: 1px solid #F1F5F9; }
.ls-tight { letter-spacing: -1.2px !important; }
.ls-1 { letter-spacing: 0.8px !important; }
.uppercase { text-transform: uppercase; }
.opacity-70 { opacity: 0.7; }
.opacity-10 { opacity: 0.1; }
.h-100 { height: 100%; }
.b-1 { border: 1px solid #E5E7EB; }
.border-none { border: none !important; }
.shadow-sm { box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }
.italic { font-style: italic; }
.lh-1 { line-height: 1.1; }
</style>
