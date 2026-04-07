
<template>
  <v-card flat tile outlined class="gov-kpi-card h-100 overflow-hidden">
    <div class="gov-kpi-header" :style="{ backgroundColor: color }"></div>
    <div class="pa-5">
      <div class="d-flex justify-space-between align-start mb-4">
        <div>
          <div class="text-caption font-weight-black grey--text text--darken-1 text-uppercase ls-1 mb-1">{{ title }}</div>
          <div class="text-h3 font-weight-black gov-text-primary lh-1 ls-tight mb-1">{{ primaryValue }}</div>
          <div v-if="secondaryLabel" class="text-caption font-weight-bold grey--text uppercase">
            {{ secondaryLabel }}
            <span v-if="secondaryValue !== undefined" class="gov-text-secondary ml-1">{{ secondaryValue }}</span>
          </div>
        </div>
        <div v-if="icon" class="gov-kpi-icon-wrap pa-2 bg-grey lighten-4">
          <v-icon color="#003366">{{ icon }}</v-icon>
        </div>
      </div>
      
      <!-- Minimal Trend Sparkline (Green Accent) -->
      <div v-if="chart && chart.data" class="mt-4 pt-4 border-top">
         <apexchart type="line" height="40" :options="sparklineOptions" :series="chartSeries"></apexchart>
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
        stroke: { curve: 'smooth', width: 2, colors: [this.color === '#003366' ? '#00A99D' : this.color] },
        tooltip: { fixed: { enabled: false }, x: { show: false }, y: { title: { formatter: () => '' } }, marker: { show: false } }
      }
    }
  }
}
</script>

<style scoped>
.gov-kpi-card {
  background: white !important;
  border: 1px solid #E5E7EB !important;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important;
  border-radius: 0px !important;
  transition: transform 0.2s ease;
  &:hover { transform: translateY(-2px); }
}

.gov-kpi-header { height: 4px; width: 100%; position: absolute; top: 0; left: 0; }
.gov-text-primary { color: #1B1F23 !important; }
.gov-text-secondary { color: #00A99D !important; }
.gov-kpi-icon-wrap { border: 1px solid #F1F5F9; border-radius: 0px; }
.border-top { border-top: 1px solid #F1F5F9; }

.lh-1 { line-height: 0.9 !important; }
.ls-tight { letter-spacing: -1.5px !important; }
.ls-1 { letter-spacing: 0.8px !important; }
.uppercase { text-transform: uppercase; }
.h-100 { height: 100%; }
</style>
