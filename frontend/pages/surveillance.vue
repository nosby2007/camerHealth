
<template>
  <v-container fluid class="pa-0 gov-surveillance-container">
    <v-row no-gutters>
      <!-- GIS Map Stream -->
      <v-col cols="12" md="8" lg="9" class="gis-map-col">
          <v-card flat tile class="h-100 b-1 overflow-hidden">
            <div class="pa-4 bg-navy white--text font-weight-black text-caption ls-1 d-flex align-center">
              <v-icon left dark small>mdi-earth</v-icon>
              CAMEROON NATIONAL EPIDEMIOLOGICAL GIS LAYER
              <v-spacer />
              <v-chip x-small color="#003366" dark label class="font-weight-bold">LEVEL: NATIONWIDE</v-chip>
            </div>
            <GmapMap
              :center="CAMEROON_CENTER"
              :zoom="7"
              map-type-id="roadmap"
              class="gov-map"
              ref="mapRef"
              :options="mapOptions"
            >
              <GmapInfoWindow
                v-if="showingInfoWindow"
                @closeclick="onCancelMarker"
                :options="{ pixelOffset: { width: 0, height: -35 } }"
                :position="infoWindowPosition"
              >
                <div class="pa-2 gov-infowindow">
                  <div class="text-caption font-weight-black grey--text mb-1">FACILITY IDENTIFIER</div>
                  <h3 class="text-subtitle-2 font-weight-black mb-1 gov-navy--text">{{ currentMedicalFacility.name.toUpperCase() }}</h3>
                  <v-chip label x-small dark :color="currentMedicalFacility.status === 'Open' ? '#166534' : '#B91C1C'" class="mb-2 font-weight-bold">{{ currentMedicalFacility.status.toUpperCase() }}</v-chip>
                  <div class="text-caption font-weight-bold grey--text text--darken-3 mt-1">AVAILABLE BEDS: {{ currentMedicalFacility.available_beds }}</div>
                  <div class="text-caption font-weight-bold grey--text text--darken-3">REFID: {{ currentMedicalFacility.osm_id }}</div>
                </div>
              </GmapInfoWindow>
            </GmapMap>
          </v-card>
      </v-col>

      <!-- Institutional Intelligence Sidebar -->
      <v-col cols="12" md="4" lg="3" class="pa-6 gov-side-panel">
        
        <!-- Official Intelligence Feed -->
        <v-card flat tile outlined class="mb-6 intel-card">
          <div class="pa-3 bg-grey lighten-4 border-bottom font-weight-black grey--text text--darken-3 text-caption ls-1">
             <v-icon left x-small color="#B91C1C">mdi-target</v-icon>
             CRITICAL INTELLIGENCE FEED
          </div>
          <div class="pa-4 intel-scroll">
            <div v-for="alert in allAlerts" :key="alert.id" class="mb-3">
              <div class="gov-alert-record pa-3" :class="alert.type">
                 <div class="text-caption font-weight-black mb-1 uppercase">{{ alert.title }}</div>
                 <div class="text-caption lh-1 grey--text text--darken-3">{{ alert.message }}</div>
                 <div class="mt-2 text-right">
                    <span class="text-caption font-weight-black grey--text opacity-50">{{ new Date().toLocaleDateString() }}</span>
                 </div>
              </div>
            </div>
            <div v-if="allAlerts.length === 0" class="text-center py-6 grey--text font-italic text-caption">
              No anomalies detected for this tracking period.
            </div>
          </div>
        </v-card>

        <!-- Reporting Data Panel -->
        <v-card flat tile outlined class="stats-panel flex-grow-1">
          <div class="pa-3 bg-navy white--text font-weight-black text-caption ls-1">
             REGIONAL DATA EXPLORER
          </div>
          
          <div v-if="markerClicked || currentRegion" class="pa-4">
             <div class="d-flex align-center mb-6 px-2 border-left-navy">
               <div>
                  <div class="text-caption font-weight-black grey--text">ADMIN AREA FOCUS:</div>
                  <div class="text-h6 font-weight-black gov-navy--text">
                    {{ markerClicked ? currentMedicalFacility.name : currentRegion.name.toUpperCase() }}
                  </div>
               </div>
             </div>
             
             <div class="table-container mt-4">
               <template v-for="(table, index) in tables">
                  <v-simple-table :key="index" dense class="gov-data-table">
                    <tbody>
                      <tr v-for="item in table" :key="item.key">
                        <td class="text-caption font-weight-bold grey--text text--darken-1">{{ item.key.toUpperCase() }}</td>
                        <td class="text-right text-body-2 font-weight-black" :style="{color: item.color || '#003366'}">{{ item.value }}</td>
                      </tr>
                    </tbody>
                  </v-simple-table>
               </template>
             </div>
          </div>
          <div v-else class="text-center pa-10">
             <v-icon x-large color="grey lighten-2">mdi-chart-areaspline</v-icon>
             <div class="text-caption font-weight-bold grey--text mt-4">SELECT GEOGRAPHIC UNIT FOR ANALYSIS</div>
          </div>
        </v-card>

      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import axios from "axios";
import _forEach from "lodash/forEach";
import _map from "lodash/map";
import _find from "lodash/find";
import _filter from "lodash/filter";
import { gmapApi } from "vue2-google-maps";
import Util from "@/util/util";

const CAMEROON_CENTER = { lat: 5.5, lng: 12.5 };
const GOV_COLORS = ["#003366", "#D97706", "#B91C1C"];

export default {
  data() {
    return {
      loading: false,
      map: undefined,
      administrativeZoneDataAll: null,
      markerClicked: false,
      showingInfoWindow: false,
      infoWindowPosition: null,
      regionSelected: false,
      currentRegion: null,
      currentMedicalFacility: null,
      currentMedicalFacilities: null,
      regionRecords: [],
      regionOverlayRecords: [],
      medicalFacilityRecords: [],
      headers: null,
      tables: null,
      CAMEROON_CENTER,
      mapOptions: {
        styles: [
          { "featureType": "all", "elementType": "all", "stylers": [{ "saturation": -100 }, { "gamma": 0.5 }] },
          { "featureType": "road", "elementType": "all", "stylers": [{ "visibility": "simplified" }] },
          { "featureType": "administrative", "elementType": "labels", "stylers": [{ "visibility": "on" }] }
        ],
        disableDefaultUI: true,
        zoomControl: true,
        streetViewControl: false
      }
    };
  },
  computed: {
    google: gmapApi,
    allAlerts() {
      return [...this.$store.getters['clinical/infectiousAlerts'], ...this.$store.getters['clinical/chronicAlerts']]
    }
  },
  mounted() {
    this.$refs.mapRef.$mapPromise.then(map => {
      this.map = map;
      this.init();
    });
  },
  methods: {
    onCancelMarker() { this.showingInfoWindow = false; this.markerClicked = false; },
    onClickPolygon(e, adminRegion3Id) {
      const regionId = parseInt(adminRegion3Id);
      let selectedRegion = _find(this.regionRecords, { adminRegion3Id: regionId });
      if (selectedRegion !== this.currentRegion) {
        this.currentRegion = selectedRegion;
        this.currentMedicalFacilities = _filter(this.medicalFacilityRecords, { admin_region_3_id: adminRegion3Id });
        this.tables = this.getTables();
      } else {
        this.currentRegion = null;
        this.currentMedicalFacilities = null;
      }
    },
    getTables() {
       if (!this.currentMedicalFacilities || this.currentMedicalFacilities.length === 0) return [];
       const f = this.currentMedicalFacilities[0];
       const regionVisits = this.$store.getters['clinical/getVisits'].filter(v => v.region === this.currentRegion.name);
       const regionField = this.$store.getters['clinical/getFieldReports'].filter(r => r.region === this.currentRegion.name);
       
       return [[
         { key: "Resource Status", value: f.status || 'Active', color: '#00A99D' },
         { key: "Regional Cases", value: regionVisits.length + regionField.reduce((a, r) => a + (parseInt(r.cases) || 0), 0), color: '#B91C1C' },
         { key: "Regional Bed Capacity", value: f.total_beds || 'N/A', color: '#003366' },
         { key: "Critical Severity cases", value: regionVisits.filter(v => v.severity === 'Critical').length, color: '#003366' }
       ]];
    },
    getRegionRecords() {
      const features = (this.administrativeZoneDataAll && this.administrativeZoneDataAll.features) || [];
      const visits = this.$store.getters['clinical/getVisits'];
      const field = this.$store.getters['clinical/getFieldReports'];
      
      this.regionRecords = [];
      this.regionOverlayRecords = _map(features, (data) => {
        const regionName = data.properties.region_name;
        const vCount = visits.filter(v => v.region === regionName).length;
        const fCount = field.filter(r => r.region === regionName).reduce((a, r) => a + (parseInt(r.cases) || 0), 0);
        
        let regionRecord = { adminRegion3Id: data.properties.region_id, name: regionName, totalCases: vCount + fCount };
        this.regionRecords.push(regionRecord);
        
        let coords = data.geometry.type === 'MultiPolygon' ? data.geometry.coordinates[0][0] : data.geometry.coordinates[0];
        return {
          adminRegion3Id: data.properties.region_id,
          paths: _map(coords, ld => ({ lat: parseFloat(ld[1]), lng: parseFloat(ld[0]) })),
          fillColor: regionRecord.totalCases > 10 ? GOV_COLORS[2] : (regionRecord.totalCases > 2 ? GOV_COLORS[1] : GOV_COLORS[0])
        };
      });
    },
    async createPolygons() {
      _forEach(this.regionOverlayRecords, ro => {
        var poly = new this.google.maps.Polygon({
          paths: ro.paths,
          strokeColor: "#003366",
          strokeOpacity: 0.5,
          strokeWeight: 1,
          fillColor: ro.fillColor,
          fillOpacity: 0.4
        });
        this.google.maps.event.addListener(poly, "click", e => this.onClickPolygon(e, ro.adminRegion3Id));
        poly.setMap(this.map);
      });
    },
    async init() {
      try {
        const response = await axios.get(`https://sheetsu.com/apis/v1.0su/97079a6a1458/`);
        this.administrativeZoneDataAll = await Util.downloadGeoJson(this.$axios);
        this.getRegionRecords();
        this.medicalFacilityRecords = _map(response.data, r => ({ ...r, admin_region_3_id: parseInt(r.admin_region_3_id) }));
        await this.createPolygons();
      } catch (error) { console.log(error); }
    }
  }
};
</script>

<style scoped>
.gov-surveillance-container { background-color: #F3F4F6; height: calc(100vh - 64px); }
.gis-map-col { height: 100%; border-right: 2px solid #E5E7EB; }
.gov-map { height: 100%; width: 100%; }

.bg-navy { background-color: #003366 !important; }
.gov-navy--text { color: #003366 !important; }
.border-bottom { border-bottom: 1px solid #E5E7EB; }
.ls-1 { letter-spacing: 1px; }

.intel-scroll { max-height: 320px; overflow-y: auto; }
.gov-alert-record {
  border-left: 4px solid #D1D5DB;
  background: white;
  border-right: 1px solid #E5E7EB;
  border-bottom: 1px solid #E5E7EB;
  border-top: 1px solid #E5E7EB;
  &.error { border-left-color: #B91C1C; background: #FEF2F2; }
  &.warning { border-left-color: #D97706; background: #FFFBEB; }
}

.gov-data-table {
  background: white !important;
  td { height: 48px !important; border-bottom: 1px solid #E5E7EB !important; }
}

.border-left-navy { border-left: 4px solid #003366; padding-left: 12px; }
.lh-1 { line-height: 1.2 !important; }
.gov-infowindow { min-width: 200px; }
.uppercase { text-transform: uppercase; }
</style>