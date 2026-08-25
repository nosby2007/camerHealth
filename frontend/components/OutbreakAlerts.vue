<template>
  <v-card elevation="0" class="alerts-card" :class="{ 'has-alerts': alerts.length > 0 }">
    <v-card-title class="alerts-title">
      <v-icon left :color="alerts.length > 0 ? 'warning' : 'grey'">mdi-alert-circle</v-icon>
      {{ $t('alerts.title') }}
      <v-chip v-if="alerts.length > 0" color="warning" small dark class="ml-2">
        {{ alerts.length }}
      </v-chip>
    </v-card-title>
    
    <v-card-text class="alerts-content">
      <template v-if="alerts.length === 0">
        <v-alert type="success" dense text class="mb-0">
          <v-icon left small>mdi-check-circle</v-icon>
          {{ $t('alerts.no_alerts') }}
        </v-alert>
      </template>
      
      <template v-else>
        <v-list dense class="alerts-list">
          <v-list-item
            v-for="(alert, index) in displayAlerts"
            :key="index"
            :class="`alert-severity-${alert.severity}`"
          >
            <v-list-item-icon>
              <v-icon
                :color="alert.severity === 'high' ? 'error' : 'warning'"
                :size="alert.severity === 'high' ? 28 : 24"
              >
                {{ alert.severity === 'high' ? 'mdi-alert-octagon' : 'mdi-alert' }}
              </v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="alert-district">
                {{ alert.district }}
              </v-list-item-title>
              <v-list-item-subtitle class="alert-message">
                {{ alert.message }}
              </v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action>
              <v-chip
                :color="alert.severity === 'high' ? 'error' : 'warning'"
                small
                dark
                label
              >
                {{ alert.severity === 'high' ? $t('alerts.threshold_exceeded') : $t('alerts.increasing_trend') }}
              </v-chip>
            </v-list-item-action>
          </v-list-item>
        </v-list>
        
        <v-expand-transition>
          <div v-if="showAll && alerts.length > 3" class="more-alerts">
            <v-list dense>
              <v-list-item
                v-for="(alert, index) in moreAlerts"
                :key="index"
                :class="`alert-severity-${alert.severity}`"
              >
                <v-list-item-icon>
                  <v-icon :color="alert.severity === 'high' ? 'error' : 'warning'" small>
                    {{ alert.severity === 'high' ? 'mdi-alert-octagon' : 'mdi-alert' }}
                  </v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title class="alert-district">{{ alert.district }}</v-list-item-title>
                  <v-list-item-subtitle class="alert-message">{{ alert.message }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </div>
        </v-expand-transition>
        
        <v-btn
          v-if="alerts.length > 3"
          text
          small
          color="primary"
          class="mt-2"
          @click="showAll = !showAll"
        >
          <v-icon left small>{{ showAll ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
          {{ showAll ? $t('common.close') : `+${alerts.length - 3} ${$t('alerts.district')}` }}
        </v-btn>
      </template>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  data() {
    return {
      showAll: false
    }
  },
  computed: {
    ...mapGetters('diseases', ['getAlerts']),
    
    alerts() {
      return this.getAlerts || []
    },
    
    displayAlerts() {
      return this.showAll ? this.alerts : this.alerts.slice(0, 3)
    },
    
    moreAlerts() {
      return this.alerts.slice(3)
    }
  }
}
</script>

<style scoped>
.alerts-card {
  border-top: 0px;
  height: 100%;
}

.alerts-card.has-alerts {
  border-left: 3px solid #ff9800;
}

.alerts-title {
  font-size: 1rem;
  font-weight: 600;
  color: #6e8192;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.alerts-content {
  padding: 8px;
}

.alerts-list {
  background: transparent;
}

.alert-severity-high {
  background: linear-gradient(90deg, rgba(244, 67, 54, 0.08) 0%, transparent 100%);
  border-left: 3px solid #f44336;
  margin-bottom: 4px;
  border-radius: 0 4px 4px 0;
}

.alert-severity-medium {
  background: linear-gradient(90deg, rgba(255, 152, 0, 0.08) 0%, transparent 100%);
  border-left: 3px solid #ff9800;
  margin-bottom: 4px;
  border-radius: 0 4px 4px 0;
}

.alert-district {
  font-weight: 600;
  font-size: 0.9rem;
}

.alert-message {
  font-size: 0.8rem;
  color: #6e8192;
}

.more-alerts {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
</style>