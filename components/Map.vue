
<template>
  <v-container id="map-wrap" :style="mapstyle" class="pa-0 relative overflow-hidden">
    <!-- Institutional Layer Control (Green Identity) -->
    <v-card tile dark color="#0B3D2E" class="map-controls pa-2 d-flex align-center shadow-sm">
       <span class="text-caption font-weight-black mr-4 ml-2 ls-1 font-italic">{{ $t("titles.surveillance") }} :</span>
       <v-btn-toggle v-model="activeLayer" mandatory dense class="gov-mini-toggle">
          <v-btn x-small value="all">{{ $t("menu.global_data") }}</v-btn>
          <v-btn x-small value="Infectious">INFECTIEUX</v-btn>
          <v-btn x-small value="Chronic">CHRONIQUE</v-btn>
       </v-btn-toggle>
       <v-spacer />
       <div class="d-flex align-center mr-2">
          <div class="risk-legend mr-4 d-none d-md-flex">
             <div class="legend-item"><span class="dot green"></span> Bas</div>
             <div class="legend-item"><span class="dot amber"></span> Modéré</div>
             <div class="legend-item"><span class="dot red"></span> Élevé</div>
          </div>
          <v-btn icon x-small @click="init"><v-icon x-small>mdi-refresh</v-icon></v-btn>
       </div>
    </v-card>

    <div class="map-canvas-container">
      <GmapMap
        :center="CAMEROON_CENTER"
        :zoom="6.5"
        style="width: 100%; height: 100%;"
        ref="frontPageMap"
        :options="mapOptions"
      >
        <!-- Regional Risk Layers (Clickable Polygons) -->
        <GmapInfoWindow
          v-if="showingInfoWindow"
          @closeclick="showingInfoWindow=false"
          :options="{ pixelOffset: { width: 0, height: -10 } }"
          :position="infoWindowPosition"
        >
          <div class="pa-2 gov-map-tooltip">
            <div class="text-caption font-weight-black mb-1 gov-green--text">{{ infoWindowDetails.name.toUpperCase() }}</div>
            <v-divider class="mb-2 grey lighten-3"></v-divider>
            <div class="d-flex justify-space-between mb-1">
               <span class="text-caption grey--text font-weight-bold">Notifications Totales:</span>
               <span class="text-caption font-weight-black">{{ infoWindowDetails.totalCases }}</span>
            </div>
            <div class="d-flex justify-space-between mb-1">
               <span class="text-caption grey--text font-weight-bold">Indices Critiques:</span>
               <span class="text-caption font-weight-black error--text">{{ infoWindowDetails.critical }}</span>
            </div>
            <div class="text-caption mt-2 pt-1 border-top grey--text opacity-60 italic" style="font-size: 9px !important;">
               SÉCURITÉ NIHIS - MISE À JOUR: {{ lastUpdate }}
            </div>
          </div>
        </GmapInfoWindow>

        <!-- Static Infrastructure Markers (Towns & Hospitals) -->
        <GmapMarker
          v-for="(marker, index) in infrastructureMarkers"
          :key="index"
          :position="marker.position"
          :icon="marker.icon"
          :title="marker.title"
          @click="onMarkerClick(marker)"
        />
      </GmapMap>
    </div>
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";
import _forEach from "lodash/forEach";
import _map from "lodash/map";
import _find from "lodash/find";
import { gmapApi } from "vue2-google-maps";
import Util from "@/util/util";

const CAMEROON_CENTER = { lat: 5.5, lng: 12.5 };
const CAMEROON_BOUNDS = { north: 13.5, south: 1.5, east: 16.5, west: 8.5 };
const RISK_COLORS = { low: "#166534", moderate: "#F4A300", high: "#C0392B" };

// Hospital and Town Markers
const INFRASTRUCTURE = [
  { title: 'Hôpital Général de Yaoundé', position: { lat: 3.8667, lng: 11.5167 }, type: 'hospital' },
  { title: 'Hôpital Laquintinie de Douala', position: { lat: 4.0500, lng: 9.7000 }, type: 'hospital' },
  { title: 'Bafoussam Regional Hospital', position: { lat: 5.4771, lng: 10.4176 }, type: 'hospital' },
  { title: 'Garoua Regional Hospital', position: { lat: 9.3000, lng: 13.4000 }, type: 'hospital' },
  { title: 'Bamenda Regional Hospital', position: { lat: 5.9631, lng: 10.1591 }, type: 'hospital' },
  { title: 'Ngaoundéré', position: { lat: 7.3167, lng: 13.5833 }, type: 'town' },
  { title: 'Maroua', position: { lat: 10.5913, lng: 14.3163 }, type: 'town' },
  { title: 'Bertoua', position: { lat: 4.5833, lng: 13.6833 }, type: 'town' },
  { title: 'Ebolowa', position: { lat: 2.9167, lng: 11.1500 }, type: 'town' }
];

export default {
  props: {
    mapstyle: { type: String, default: "height: 500px; width: 100%;" }
  },
  data() {
    return {
      map: undefined,
      activeLayer: 'all',
      administrativeZoneDataAll: null,
      showingInfoWindow: false,
      infoWindowPosition: null,
      infoWindowDetails: { name: '', totalCases: 0, critical: 0 },
      polygons: [],
      CAMEROON_CENTER,
      mapOptions: {
        styles: [
          { "featureType": "all", "elementType": "all", "stylers": [{ "saturation": -100 }, { "lightness": 20 }] },
          { "featureType": "poi", "elementType": "labels", "stylers": [{ "visibility": "simplified" }] },
          { "featureType": "water", "elementType": "all", "stylers": [{ "color": "#E2E8F0" }] }
        ],
        disableDefaultUI: true,
        zoomControl: true,
        restriction: {
           latLngBounds: CAMEROON_BOUNDS,
           strictBounds: false
        }
      }
    };
  },
  computed: {
    google: gmapApi,
    ...mapGetters('clinical', ['getPatients', 'getVisits', 'getFieldReports']),
    lastUpdate() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    infrastructureMarkers() {
      if (!this.google) return [];
      return INFRASTRUCTURE.map(inf => ({
        ...inf,
        icon: {
          url: inf.type === 'hospital' 
            ? 'https://maps.google.com/mapfiles/ms/icons/red-pushpin.png' 
            : 'https://maps.google.com/mapfiles/ms/icons/green-pushpin.png',
          scaledSize: new this.google.maps.Size(32, 32)
        }
      }));
    }
  },
  watch: {
    activeLayer() { this.refreshPolygons(); },
    getVisits: { deep: true, handler() { this.refreshPolygons(); } }
  },
  methods: {
    async init() {
      this.administrativeZoneDataAll = await Util.downloadGeoJson(this.$axios);
      this.refreshPolygons();
    },
    refreshPolygons() {
      if (!this.map || !this.google) return;
      this.polygons.forEach(p => p.setMap(null));
      this.polygons = [];

      const features = (this.administrativeZoneDataAll && this.administrativeZoneDataAll.features) || [];
      features.forEach((data) => {
        const regionName = data.properties.region_name;
        const stats = this.getRegionStats(regionName);
        const coords = data.geometry.type === 'MultiPolygon' ? data.geometry.coordinates[0][0] : data.geometry.coordinates[0];
        const paths = _map(coords, ld => ({ lat: parseFloat(ld[1]), lng: parseFloat(ld[0]) }));
        const riskColor = this.getRiskColor(stats.total);

        const poly = new this.google.maps.Polygon({
          paths,
          strokeColor: "#0B3D2E",
          strokeOpacity: 0.3,
          strokeWeight: 1,
          fillColor: riskColor,
          fillOpacity: 0.5,
          map: this.map,
          clickable: true
        });

        this.google.maps.event.addListener(poly, "click", (e) => {
           this.infoWindowDetails = { name: regionName, ...stats };
           this.infoWindowPosition = e.latLng;
           this.showingInfoWindow = true;
           this.map.panTo(e.latLng);
        });
        
        this.google.maps.event.addListener(poly, "mouseover", () => {
           if (!this.showingInfoWindow) poly.setOptions({ fillOpacity: 0.8 });
        });
        this.google.maps.event.addListener(poly, "mouseout", () => {
           if (!this.showingInfoWindow) poly.setOptions({ fillOpacity: 0.5 });
        });
        this.polygons.push(poly);
      });
    },
    onMarkerClick(marker) {
      this.infoWindowDetails = { name: marker.title, totalCases: 'Site Resource', critical: 'Operational' };
      this.infoWindowPosition = marker.position;
      this.showingInfoWindow = true;
    },
    getRegionStats(regionName) {
      const visits = this.getVisits.filter(v => v.region === regionName);
      const reports = this.getFieldReports.filter(r => r.region === regionName);
      let total = visits.length + reports.reduce((acc, r) => acc + (parseInt(r.cases) || 0), 0);
      let critical = visits.filter(v => v.severity === 'Critical' || v.status === 'Confirmed').length;
      if (this.activeLayer !== 'all') { total = visits.filter(v => v.type === this.activeLayer).length; }
      return { total, critical };
    },
    getRiskColor(count) {
      if (count > 10) return RISK_COLORS.high;
      if (count > 2) return RISK_COLORS.moderate;
      return RISK_COLORS.low;
    }
  },
  mounted() {
    this.$refs.frontPageMap.$mapPromise.then(map => {
      this.map = map;
      this.init();
    });
  }
};
</script>

<style scoped>
.relative { position: relative; }
.map-canvas-container { height: calc(100% - 40px); width: 100%; }
.map-controls { height: 40px; border-bottom: 1px solid rgba(255,255,255,0.05); }

.gov-mini-toggle {
  background: rgba(255,255,255,0.05) !important;
  border-radius: 0px !important;
  .v-btn { color: rgba(255,255,255,0.6) !important; border-radius: 0px !important; border: none !important;
    &.v-btn--active { background: #1F7A5C !important; color: white !important; font-weight: 800; }
  }
}

.risk-legend {
  gap: 12px;
  .legend-item { display: flex; align-items: center; font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.7); text-transform: uppercase;
    .dot { width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; 
      &.green { background: #166534; }
      &.amber { background: #F4A300; }
      &.red { background: #C0392B; }
    }
  }
}

.gov-map-tooltip { min-width: 220px; box-shadow: none !important; }
.gov-green--text { color: #0B3D2E !important; }
.ls-1 { letter-spacing: 1px; }
.opacity-60 { opacity: 0.6; }
.italic { font-style: italic; }
.shadow-sm { box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }
</style>
