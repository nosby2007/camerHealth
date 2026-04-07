
<template>
  <v-container fluid class="gov-dashboard pa-10">
    <!-- Ministerial Header (Green Identity) -->
    <v-row class="mb-10 no-gutters align-center">
      <v-col cols="12" md="8">
        <h1 class="text-h4 font-weight-black gov-text-primary mb-2 ls-tight text-uppercase">
          {{ $t("titles.dashboard") }}
        </h1>
        <div class="d-flex align-center">
          <v-icon x-small color="#00A99D" class="mr-2">mdi-shield-check</v-icon>
          <span class="text-caption font-weight-bold grey--text text-uppercase ls-1">NATIONAL INTEGRATED DISEASE SURVEILLANCE & RESPONSE DATA</span>
        </div>
      </v-col>
      <v-spacer />
      <v-col cols="12" md="auto">
        <div class="d-flex align-center">
           <div class="gov-mode-panel pa-2 mr-4 b-1 shadow-sm">
              <v-switch
                v-model="showFieldData"
                label="Integrated Field Surveillance Data"
                color="#00A99D"
                dense
                class="mt-n1 text-caption font-weight-black"
              ></v-switch>
           </div>
           
           <DiseaseSelector />
           
           <v-btn tile depressed color="#00A99D" dark height="44" class="ml-4 px-6 font-weight-black text-caption ls-1" @click="getStats" :loading="loading">
             <v-icon left size="18">mdi-sync</v-icon>
             {{ $t("refresh").toUpperCase() }}
           </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Key Performance Indicators (KPIs) -->
    <v-row class="mb-10">
      <v-col v-for="(item, index) in getTotalStats.series" :key="index" cols="12" sm="6" md="3">
          <MiniStatistics
            :title="getCat(index).toUpperCase()"
            :primaryValue="item[0]"
            :secondaryValue="item[1]"
            :chart="getLast30DayStats.series[index]"
            :color="'#00A99D'"
            :secondaryLabel="suffixesMap[index][1] ? $t(suffixesMap[index][1]).toUpperCase() : ''"
          />
      </v-col>
    </v-row>

    <!-- Regional Geospatial Intelligence -->
    <v-row class="mb-10">
      <v-col cols="12">
        <v-card flat tile class="gov-card b-1 overflow-hidden">
          <div class="pa-4 bg-primary white--text d-flex justify-space-between align-center border-bottom shadow-sm">
            <div class="text-caption font-weight-black text-uppercase ls-1 px-4 border-left">GIS GEOGRAPHIC DISTRIBUTION & RESOURCE HEATMAP</div>
            <v-chip label x-small dark color="#00A99D" class="font-weight-black">OFFICIAL MINISTRY DATA LAYER</v-chip>
          </div>
          <div class="gov-map-container">
             <Map />
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Detailed Analytics Grid -->
    <v-row class="mb-10">
      <v-col cols="12" md="8">
        <v-card flat tile class="gov-card b-1 pa-8 h-100 shadow-sm">
           <h2 class="text-subtitle-1 font-weight-black gov-text-primary uppercase mb-1">{{ $t("chart_titles.cases_by_region") }}</h2>
           <p class="text-caption grey--text font-weight-medium mb-6 uppercase">Focus: {{ currentFocus.toUpperCase() }}</p>
           <v-divider class="mb-8 grey lighten-3"></v-divider>
           <TotalBarChart
            :height="400"
            :horizontal="true"
            :showDataLabel="false"
            :series="getTop20Regions.series"
            :labels="getTop20Regions.labels"
            :colors="['#00A99D']"
          />
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card flat tile class="gov-card b-1 pa-8 h-100 shadow-sm">
           <h2 class="text-subtitle-1 font-weight-black gov-text-primary uppercase mb-1">{{ $t("chart_titles.total_by_age_and_sex") }}</h2>
           <p class="text-caption grey--text font-weight-medium mb-6 uppercase">Demographic Spread Analysis</p>
           <v-divider class="mb-8 grey lighten-3"></v-divider>
           <TotalBarChart
            :height="360"
            :horizontal="true"
            :stacked="true"
            :showDataLabel="false"
            :series="getTotalByAgeGenderSeries.series"
            :labels="getTotalByAgeGenderSeries.labels"
            :labelFormatter="getTotalByAgeGenderSeries.formatter"
            :colors="['#003366', '#C0392B']"
            :grid="getTotalByAgeGenderSeries.grid"
            :tooltip="getTotalByAgeGenderSeries.tooltip"
          />
        </v-card>
      </v-col>
    </v-row>

    <!-- Outcomes and Capacity -->
    <v-row class="mb-10">
      <v-col cols="12" md="6">
        <v-card flat tile class="gov-card b-1 pa-8 h-100 shadow-sm">
            <div class="text-caption font-weight-black gov-text-secondary uppercase mb-8 ls-1 px-4 border-left">OCCUPANCY RESILIENCE: {{ currentFocus.toUpperCase() }}</div>
            <v-row align="center">
              <v-col cols="12" md="6">
                <div style="width: 100%; max-width: 250px;" class="mx-auto">
                    <PieChart :labels="[ 'Outpatient', 'Critical (ICU)', 'Stable ward' ]" :datasets="getHospitalizationStats" />
                </div>
              </v-col>
              <v-col cols="12" md="6" class="text-center text-md-left">
                <div class="text-h2 font-weight-black gov-text-primary">{{ hospitalizedPercentage }}%</div>
                <div class="text-caption font-weight-black grey--text uppercase ls-1">{{ $t("statistics.hospitalization_rate") }}</div>
                <v-divider class="my-6 grey lighten-4"></v-divider>
                <div class="text-caption grey--text font-weight-bold italic opacity-60">Verified national metrics from MINSANTE digital surveillance registries.</div>
              </v-col>
            </v-row>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card flat tile class="gov-card b-1 pa-8 h-100 shadow-sm">
            <div class="text-caption font-weight-black error--text uppercase mb-8 ls-1 px-4 border-left-error">OUTCOME INDEX: {{ currentFocus.toUpperCase() }}</div>
             <v-row align="center">
              <v-col cols="12" md="6">
                <div style="width: 100%; max-width: 250px;" class="mx-auto">
                   <PieChart :labels="[ $t('covid_stages.recovered'), $t('covid_stages.dead') ]" :datasets="getFinalOutcomeStats" />
                </div>
              </v-col>
              <v-col cols="12" md="6" class="text-center text-md-left">
                <div class="text-h2 font-weight-black gov-text-primary">{{ 100 - (finalOutcomePercentage || 0) }}%</div>
                <div class="text-caption font-weight-black grey--text uppercase ls-1">{{ $t("statistics.recovery_rate") }}</div>
                <v-divider class="my-6 grey lighten-4"></v-divider>
                <div class="text-caption grey--text font-weight-bold italic opacity-60">Statistical success markers based on archived discharge vs mortality data.</div>
              </v-col>
            </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- Time Series -->
    <v-row class="mb-12">
      <v-col cols="12">
        <v-card flat tile class="gov-card b-1 pa-10 shadow-sm">
           <h2 class="text-subtitle-1 font-weight-black gov-text-primary uppercase mb-1">{{ $t("chart_titles.hourly") }}</h2>
           <p class="text-caption grey--text font-weight-medium mb-10 uppercase">Sovereign Longitudinal Analysis (24H Sweep)</p>
           <HourlyCasesLineChart :chartdata="getHourlyLiveStats" />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState, mapGetters, mapActions } from "vuex";
import MiniStatistics from "~/components/MiniStatistics";
import DiseaseSelector from "~/components/DiseaseSelector";
import HourlyCasesLineChart from "~/components/HourlyCasesLineChart";
import TotalBarChart from "~/components/TotalBarChart.vue";
import PieChart from "~/components/PieChart.vue";
import Map from "@/components/Map";
import pmoCases from "../resources/pmoCases.json";
import pmoPatients from "../resources/pmoPatients.json";
import _map from "lodash/map";
import _orderBy from "lodash/orderBy";
import _forEach from "lodash/forEach";
import _uniqBy from "lodash/uniqBy";
import MomentTimezone from "moment-timezone";
import { extendMoment } from "moment-range";

const moment = extendMoment(MomentTimezone);
const roundValue = (value, decimals) => Number(Math.round(value + "e" + decimals) + "e-" + decimals);

function createHourlyGroupedRecords(records) {
  let hash = Object.create(null); let grouped = [];
  _forEach(records, r => {
    var key = r.date_time_announced.slice(0, 13);
    if (!hash[key]) { hash[key] = { cases: 1, time: key + ":00:00.000Z" }; grouped.push(hash[key]); }
    hash[key].cases += 1;
  });
  return grouped;
}

function createDailyGroupedRecords(records) {
  let hash = Object.create(null); let grouped = [];
  _forEach(records, r => {
    var key = r.date_time_announced.slice(0, 10);
    if (!hash[key]) { hash[key] = { cases: 1, time: key + "T00:00:00.000Z" }; grouped.push(hash[key]); }
    hash[key].cases += 1;
  });
  return grouped;
}

function timeOneDay() {
  var time = [];
  for (let i = 0; i < 24; i++) { time.unshift(moment().startOf("hour").tz("Africa/Douala").subtract(i, "hours").toISOString()); }
  return time;
}

export default {
  head: { title: 'Tableau de Bord National' },
  components: { DiseaseSelector, HourlyCasesLineChart, MiniStatistics, TotalBarChart, PieChart, Map },
  data() {
    return {
      loading: false,
      labels: ["covid_stages.confirmed", "covid_stages.hospitalized", "covid_stages.recovered", "covid_stages.quarantined"],
      suffixesMap: { 0: ["covid_stages.confirmed", "covid_stages.dead"], 1: ["covid_stages.hospitalized_stable", "covid_stages.hospitalized_critical"], 2: ["covid_stages.recovered"], 3: ["covid_stages.quarantined"] },
      hospitalizedPercentage: 0, finalOutcomePercentage: 0, regionRecords: [], showFieldData: false
    };
  },
  computed: {
    ...mapState('stats', ['disease']),
    currentFocus() { return this.disease || 'General Surveillance' },
    getTotalStats() {
      let totalCaseObj = { ...pmoCases[0] };
      if (this.showFieldData) {
        totalCaseObj.confirmed += this.$store.getters['clinical/getFieldReports'].reduce((acc, r) => acc + (parseInt(r.cases) || 0), 0);
        totalCaseObj.deceased += this.$store.getters['clinical/getVisits'].filter(v => v.status === 'Deceased').length;
      }
      return { series: [[totalCaseObj.confirmed, totalCaseObj.deceased], [totalCaseObj.stable + totalCaseObj.critical, totalCaseObj.critical], [totalCaseObj.recovered], [totalCaseObj.tested]] };
    },
    getTop20Regions() {
      let woredaByTotalCases = _map(_uniqBy(this.regionRecords, "name"), r => {
        let count = r.totalCases;
        if (this.showFieldData) { count += this.$store.getters['clinical/getFieldReports'].filter(fr => fr.region === r.name).reduce((acc, fr) => acc + (parseInt(fr.cases) || 0), 0) }
        return { country: r.name, count };
      });
      let top10Woredas = _orderBy(woredaByTotalCases, ["count"], ["desc"]).slice(0, 20);
      return { series: [{ name: "Cas Confirmés", data: _map(top10Woredas, "count") }], labels: _map(top10Woredas, "country") };
    },
    getTotalByAgeGenderSeries() {
      const ageRanges = [[0, 4], [5, 14], [15, 34], [35, 44], [45, 54], [55, 64], [65, 74], [75, 84], [85, 120]];
      const totalCases = pmoPatients.results.length || 1;
      const getSeries = gender => ageRanges.map(range => {
        const count = pmoPatients.results.filter(p => p.gender === gender && p.age >= range[0] && p.age <= range[1]).length;
        return gender === "M" ? -count : count;
      });
      return {
        series: [{ name: "HOMMES", data: getSeries("M") }, { name: "FEMMES", data: getSeries("F") }],
        labels: ["85+", "75-84", "65-74", "55-64", "45-54", "35-44", "15-34", "5-14", "0-4"],
        formatter: val => Math.abs(Math.round((100 * val) / totalCases)) + "%",
        grid: { xaxis: { lines: { show: false } } },
        tooltip: { shared: false, y: { formatter: val => `${Math.abs(val)} Rapports` } }
      };
    },
    getHospitalizationStats() {
      let totalCaseObj = { ...pmoCases[0] };
      if (this.showFieldData) totalCaseObj.confirmed += this.$store.getters['clinical/getFieldReports'].reduce((acc, r) => acc + (parseInt(r.cases) || 0), 0);
      let total = totalCaseObj.confirmed || 1;
      this.hospitalizedPercentage = roundValue(totalCaseObj.critical / total, 3) * 100;
      return [{ backgroundColor: ["#F5F7F6", "#C0392B", "#F4A300"], data: [total - (totalCaseObj.stable + totalCaseObj.critical), totalCaseObj.critical, totalCaseObj.stable] }];
    },
    getFinalOutcomeStats() {
      let totalCaseObj = { ...pmoCases[0] };
      if (this.showFieldData) totalCaseObj.deceased += this.$store.getters['clinical/getVisits'].filter(v => v.status === 'Deceased').length;
      let total = (totalCaseObj.deceased + totalCaseObj.recovered) || 1;
      this.finalOutcomePercentage = roundValue(totalCaseObj.deceased / total, 3) * 100;
      return [{ backgroundColor: ["#00A99D", "#C0392B"], data: [totalCaseObj.recovered, totalCaseObj.deceased] }];
    },
    getHourlyLiveStats() {
      const last24hours = timeOneDay();
      const groupedHourlyRecords = createHourlyGroupedRecords(pmoPatients.results);
      const casesPerHour = last24hours.map(hour => {
        const record = groupedHourlyRecords.find(r => r.time === hour);
        return record ? record.cases : 0;
      });
      return { series: [{ name: "Incidents", data: casesPerHour }], xaxis: { categories: last24hours.map(h => moment(h).format("hA")) } };
    },
    getLast30DayStats() {
      const range = Array.from(moment.range(moment().subtract(30, "days"), moment()).by("day"));
      const groupedDailyRecords = createDailyGroupedRecords(pmoPatients.results);
      const casesPerDay = range.map(day => {
        const record = groupedDailyRecords.find(r => r.time.slice(0, 10) === day.format("YYYY-MM-DD"));
        return record ? record.cases : 0;
      });
      return { series: [{ name: "Surveillance Trend", data: casesPerDay.reverse() }] };
    }
  },
  methods: {
    ...mapActions("stats", ["loadStats"]),
    async getStats() { this.loading = true; try { await this.loadStats(); this.loading = false; } catch (err) { this.loading = false; } },
    getCat(index) { return this.$t(this.labels[index]); }
  },
  async mounted() {
    this.getStats();
    this.regionRecords = [{ name: 'Adamaoua', totalCases: 45 }, { name: 'Centre', totalCases: 250 }, { name: 'Est', totalCases: 52 }, { name: 'Extrême-Nord', totalCases: 89 }, { name: 'Littoral', totalCases: 198 }, { name: 'Nord', totalCases: 67 }, { name: 'Nord-Ouest', totalCases: 104 }, { name: 'Ouest', totalCases: 112 }, { name: 'Sud', totalCases: 48 }, { name: 'Sud-Ouest', totalCases: 76 }];
  }
};
</script>

<style scoped>
.bg-primary { background-color: #003366 !important; }
.gov-text-primary { color: #1B1F23 !important; }
.gov-text-secondary { color: #00A99D !important; }
.border-bottom { border-bottom: 2px solid #E5E7EB; }
.gov-map-container { height: 500px; background-color: #F5F7F6; }
.gov-mode-panel { background-color: white; border: 1px solid #E5E7EB; }
.ls-tight { letter-spacing: -1.5px !important; }
.ls-1 { letter-spacing: 0.8px !important; }
.uppercase { text-transform: uppercase; }
.h-100 { height: 100%; }
.border-left { border-left: 4px solid #00A99D; }
.border-left-error { border-left: 4px solid #C0392B; }
.shadow-sm { box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }
.opacity-60 { opacity: 0.6; }
.italic { font-style: italic; }
.gov-card { border: 1px solid #E5E7EB !important; background-color: white !important; border-radius: 0px !important; }
</style>
