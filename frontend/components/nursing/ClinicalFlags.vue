<template>
  <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
    <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center">
      <v-icon small color="#003366" class="mr-2">
        mdi-flag-variant
      </v-icon>
      <span class="text-caption font-weight-black grey--text text-uppercase ls-1">{{ $t('clinical360.nursing.clinical_flags') }}</span>
    </div>
    <v-list dense class="pa-0">
      <v-list-item v-for="flag in flags" :key="flag.label" class="border-bottom">
        <v-list-item-icon class="mr-3">
          <v-icon :color="flag.color">
            {{ flag.icon }}
          </v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title class="text-caption font-weight-black gov-text-primary">
            {{ flag.label }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-caption">
            {{ flag.text }}
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
      <v-list-item v-if="!flags.length">
        <v-list-item-icon class="mr-3">
          <v-icon color="#1F7A5C">
            mdi-check-circle
          </v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title class="text-caption font-weight-black gov-text-primary">
            {{ $t('clinical360.nursing.no_critical_flags') }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-caption">
            {{ $t('clinical360.nursing.routine_surveillance') }}
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script>
export default {
  props: {
    patient: { type: Object, default: () => ({}) },
    tasks: { type: Array, default: () => [] },
    wounds: { type: Array, default: () => [] },
    woundAssessments: { type: Array, default: () => [] }
  },
  computed: {
    flags () {
      const flags = []
      if (this.patient.allergies) { flags.push({ label: this.$t('clinical360.nursing.allergy_alert'), text: this.patient.allergies, icon: 'mdi-alert-octagon', color: '#C0392B' }) }
      const openTasks = this.tasks.filter(task => ['pending', 'in_progress'].includes(task.status))
      if (openTasks.length) { flags.push({ label: this.$t('clinical360.nursing.open_tasks'), text: this.$t('clinical360.nursing.tasks_follow_up', { count: openTasks.length }), icon: 'mdi-format-list-checks', color: '#D97706' }) }
      const activeWounds = this.wounds.filter(wound => !['healed', 'closed'].includes(wound.status))
      if (activeWounds.length) { flags.push({ label: this.$t('clinical360.nursing.skin_follow_up'), text: this.$t('clinical360.nursing.active_wounds', { count: activeWounds.length }), icon: 'mdi-bandage', color: '#003366' }) }
      if (this.woundAssessments.some(item => item.warningAreaIncreased)) { flags.push({ label: this.$t('clinical360.nursing.wound_trend_warning'), text: this.$t('clinical360.nursing.wound_trend_detail'), icon: 'mdi-trending-up', color: '#C0392B' }) }
      return flags
    }
  }
}
</script>

<style scoped>
.gov-card { background: white !important; }
.gov-text-primary { color: #1B1F23 !important; }
.b-1 { border: 1px solid #E5E7EB; }
.border-bottom { border-bottom: 1px solid #E5E7EB; }
.shadow-sm { box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }
.ls-1 { letter-spacing: 0.8px !important; }
</style>
