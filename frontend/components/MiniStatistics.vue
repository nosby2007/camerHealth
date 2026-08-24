<template>
  <v-card flat tile class="mission-geo-card h-100 overflow-hidden">
    <div class="mission-card-accent" :style="{ backgroundColor: color }"></div>
    <div class="pa-5 relative z-2">
      <div class="d-flex justify-space-between align-center mb-6">
        <div class="text-caption font-weight-black grey--text text-uppercase ls-2">{{ title }}</div>
        <v-icon v-if="icon" small color="grey lighten-2">{{ icon }}</v-icon>
      </div>
      
      <div class="intelligence-grid">
        <div class="text-h2 font-weight-black gov-text-primary ls-ultra-tight">{{ primaryValue }}</div>
        <div v-if="secondaryValue !== undefined" class="metric-adornment pa-2 ml-4">
          <div class="text-caption grey--text uppercase font-weight-black">{{ secondaryLabel }}</div>
          <div class="text-h6 font-weight-black error--text mt-n1">{{ secondaryValue }}</div>
        </div>
      </div>

      <div v-if="chart && chart.data" class="mt-6 mission-spark">
         <apexchart type="area" height="35" :options="sparklineOptions" :series="chartSeries"></apexchart>
      </div>
    </div>
  </v-card>
</template>

<script>
export default {
  props: {
    title: { type: String, default: "" },
    primaryValue: { type: [String, Number], default: 0 },
    secondaryValue: { type: [String, Number], default: undefined },
    secondaryLabel: { type: String, default: "" },
    icon: { type: String, default: "" },
    color: { type: String, default: "#003366" },
    chart: { type: Object, default: () => ({ data: [] }) }
  },
  computed: {
    chartSeries() { return [{ data: this.chart.data || [] }] },
    sparklineOptions() {
      return {
        chart: { sparkline: { enabled: true } },
        stroke: { curve: 'smooth', width: 2, colors: [this.color] },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.15, opacityTo: 0.05 } },
        tooltip: { enabled: false }
      }
    }
  }
}
</script>

<style scoped>
.mission-geo-card {
  background: white !important;
  border: 1px solid #E5E7EB !important;
  clip-path: polygon(0 0, 100% 0, 100% 85%, 92% 100%, 0 100%);
  position: relative;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}
.mission-geo-card:hover { transform: translateY(-5px); box-shadow: 0 15px 35px rgba(0,0,0,0.1) !important; }
.mission-card-accent { position: absolute; top: 0; left: 0; width: 4px; height: 100%; opacity: 0.8; }
.intelligence-grid { display: flex; align-items: center; }
.metric-adornment { border-left: 2px solid #F1F5F9; }
.ls-ultra-tight { letter-spacing: -3px !important; line-height: 0.8; }
.ls-2 { letter-spacing: 2px; }
.z-2 { position: relative; z-index: 2; }
.mission-spark { opacity: 0.8; filter: saturate(1.5); }
.uppercase { text-transform: uppercase; }
.gov-text-primary { color: #1B1F23 !important; }
.h-100 { height: 100%; }
</style>
