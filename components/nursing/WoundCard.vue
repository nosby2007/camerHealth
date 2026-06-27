<template>
  <v-card flat tile class="gov-card b-1 shadow-sm h-100 overflow-hidden">
    <div class="pa-4 d-flex align-center justify-space-between border-bottom">
      <div>
        <div class="text-caption font-weight-black gov-text-primary text-uppercase">{{ wound.woundType || wound.wound_type || 'Wound' }}</div>
        <div class="text-caption grey--text font-weight-bold">{{ wound.anatomicalLocation || wound.anatomical_location || 'Location N/A' }}</div>
      </div>
      <v-chip x-small label dark :color="statusColor" class="font-weight-black">{{ wound.status || 'active' }}</v-chip>
    </div>
    <div class="pa-4">
      <v-row dense>
        <v-col cols="6"><div class="metric"><span>Surface</span><strong>{{ latest.surfaceArea || latest.surface_area || 0 }} cm2</strong></div></v-col>
        <v-col cols="6"><div class="metric"><span>Depth</span><strong>{{ latest.depthCm || latest.depth_cm || 0 }} cm</strong></div></v-col>
        <v-col cols="6"><div class="metric"><span>Pain</span><strong>{{ latest.painScore || latest.pain_score || 0 }}/10</strong></div></v-col>
        <v-col cols="6"><div class="metric"><span>Dressing</span><strong>{{ latest.dressingType || latest.dressing_type || 'N/A' }}</strong></div></v-col>
      </v-row>
      <v-alert v-if="latest.warningAreaIncreased" dense tile type="warning" color="#D97706" dark class="mt-4 mb-0 text-caption font-weight-bold">Surface increased since prior measurement.</v-alert>
      <div class="text-caption grey--text mt-4">{{ latest.treatmentPlan || latest.treatment_plan || 'No treatment plan documented yet.' }}</div>
    </div>
    <div class="pa-3 bg-grey lighten-4 border-top text-right">
      <v-btn x-small tile depressed color="#003366" dark class="font-weight-black" :to="detailTo"><v-icon left x-small>mdi-open-in-new</v-icon>Open</v-btn>
    </div>
  </v-card>
</template>

<script>
export default {
  props: {
    wound: { type: Object, default: () => ({}) },
    assessments: { type: Array, default: () => [] },
    detailTo: { type: String, default: '' }
  },
  computed: {
    latest() {
      return [...this.assessments].sort((a, b) => new Date(b.assessedAt || b.assessed_at || b.createdAt) - new Date(a.assessedAt || a.assessed_at || a.createdAt))[0] || {}
    },
    statusColor() {
      return { active: '#D97706', improving: '#1F7A5C', worsening: '#C0392B', healed: '#003366', closed: '#6B7280' }[this.wound.status] || '#D97706'
    }
  }
}
</script>

<style scoped>
.gov-card { background:white !important; }
.gov-text-primary { color:#1B1F23 !important; }
.metric { background:#F8FAFC; border:1px solid #E5E7EB; padding:10px; min-height:64px; }
.metric span { display:block; color:#6B7280; font-size:11px; font-weight:800; text-transform:uppercase; }
.metric strong { display:block; color:#1B1F23; font-size:13px; margin-top:4px; }
.b-1 { border:1px solid #E5E7EB; }
.border-bottom { border-bottom:1px solid #E5E7EB; }
.border-top { border-top:1px solid #E5E7EB; }
.shadow-sm { box-shadow:0 2px 6px rgba(0,0,0,0.05) !important; }
.h-100 { height:100%; }
</style>
