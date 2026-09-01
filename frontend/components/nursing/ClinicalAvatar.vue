<template>
  <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
    <div class="pa-4 bg-navy white--text d-flex align-center justify-space-between">
      <span class="text-caption font-weight-black text-uppercase ls-1">{{ $t('clinical360.nursing.clinical_avatar') }}</span>
      <v-btn-toggle v-model="currentView" dense tile mandatory>
        <v-btn x-small value="anterior">
          {{ $t('clinical360.nursing.front') }}
        </v-btn>
        <v-btn x-small value="posterior">
          {{ $t('clinical360.nursing.back') }}
        </v-btn>
      </v-btn-toggle>
    </div>
    <div class="avatar-stage pa-4">
      <svg viewBox="0 0 220 420" class="body-svg" role="img" :aria-label="$t('clinical360.nursing.body_map')">
        <path d="M110 20c25 0 44 19 44 43s-19 43-44 43-44-19-44-43 19-43 44-43z" fill="#E8EEF3" stroke="#003366" stroke-width="2" />
        <path d="M78 112h64l22 126-14 128H70L56 238z" fill="#F7FAFC" stroke="#003366" stroke-width="2" />
        <path d="M57 130 26 238l18 7 39-101zM163 130l31 108-18 7-39-101z" fill="#E8EEF3" stroke="#003366" stroke-width="2" />
        <path d="M83 366 70 410h32l10-44zM137 366l13 44h-32l-10-44z" fill="#E8EEF3" stroke="#003366" stroke-width="2" />
        <g v-for="marker in visibleMarkers" :key="marker.id" class="marker" @click="$emit('marker-click', marker)">
          <circle
            :cx="marker.xPosition * 2.2"
            :cy="marker.yPosition * 4.2"
            r="9"
            :fill="markerColor(marker)"
            stroke="white"
            stroke-width="3"
          />
          <title>{{ marker.markerType }} - {{ marker.bodyRegion }}</title>
        </g>
      </svg>
    </div>
    <div class="pa-4 border-top">
      <div v-for="marker in visibleMarkers" :key="marker.id + '-row'" class="d-flex align-center justify-space-between marker-row py-2">
        <div>
          <div class="text-caption font-weight-black gov-text-primary text-uppercase">
            {{ marker.markerType }}
          </div>
          <div class="text-caption grey--text">
            {{ marker.bodyRegion }} · {{ statusLabel(marker.status) }}
          </div>
        </div>
        <v-chip x-small label dark :color="markerColor(marker)" class="font-weight-black">
          {{ severityLabel(marker.severity || 'moderate') }}
        </v-chip>
      </div>
      <div v-if="!visibleMarkers.length" class="text-caption grey--text font-weight-bold">
        {{ $t('clinical360.nursing.no_markers') }}
      </div>
    </div>
  </v-card>
</template>

<script>
export default {
  props: { markers: { type: Array, default: () => [] }, viewType: { type: String, default: 'anterior' } },
  data () { return { currentView: this.viewType } },
  computed: { visibleMarkers () { return this.markers.filter(marker => (marker.viewType || 'anterior') === this.currentView) } },
  methods: {
    markerColor (marker) {
      return { low: '#1F7A5C', moderate: '#D97706', high: '#C0392B', critical: '#7F1D1D' }[marker.severity] || '#D97706'
    },
    severityLabel (severity) { const key = `clinical360.nursing.severity.${severity}`; return this.$te(key) ? this.$t(key) : severity },
    statusLabel (status) { const key = `clinical360.nursing.statuses.${status}`; return this.$te(key) ? this.$t(key) : status }
  }
}
</script>

<style scoped>
.gov-card { background: white !important; }
.bg-navy { background: #003366 !important; }
.gov-text-primary { color: #1B1F23 !important; }
.avatar-stage { background:#F8FAFC; min-height:420px; display:flex; align-items:center; justify-content:center; }
.body-svg { width:100%; max-width:280px; height:auto; }
.marker { cursor:pointer; }
.marker-row:not(:last-child) { border-bottom:1px solid #EEF2F7; }
.b-1 { border: 1px solid #E5E7EB; }
.border-top { border-top:1px solid #E5E7EB; }
.shadow-sm { box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }
.ls-1 { letter-spacing: 0.8px !important; }
</style>
