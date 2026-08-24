<template>
  <v-dialog :value="show" max-width="800" persistent @input="$emit('update:show', $event)">
    <v-card>
      <v-card-title>Flowsheet History</v-card-title>
      <v-card-text>
        <div class="history-filters">
          <v-text-field
            v-model="filterRow"
            label="Filter by row"
            outlined
            dense
            small
          />
          <v-select
            v-model="filterUser"
            label="Filter by user"
            :items="users"
            outlined
            dense
            small
            clearable
          />
        </div>

        <div class="history-timeline">
          <div v-if="filteredHistory.length === 0" class="no-history">
            No history found.
          </div>

          <div v-for="event in filteredHistory" :key="event.id" class="history-event">
            <div class="event-timestamp">{{ formatDate(event.timestamp) }}</div>
            <div class="event-content">
              <div class="event-user">{{ event.actor }}</div>
              <div class="event-action">{{ event.action }}</div>
              <div v-if="event.details" class="event-details">{{ event.details }}</div>
            </div>
          </div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text small @click="$emit('update:show', false)">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'FlowsheetHistoryDialog',
  props: {
    show: { type: Boolean, default: false },
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true }
  },
  data() {
    return {
      filterRow: '',
      filterUser: null
    }
  },
  computed: {
    auditLogs() {
      return this.$store.state.flowsheets.auditLogs.filter(
        log => log.patientId === this.patientId && log.targetTable === 'flowsheets'
      )
    },
    users() {
      const unique = [...new Set(this.auditLogs.map(log => log.actor))]
      return unique.sort()
    },
    filteredHistory() {
      let history = this.auditLogs

      if (this.filterRow) {
        history = history.filter(log =>
          log.details?.toLowerCase().includes(this.filterRow.toLowerCase())
        )
      }

      if (this.filterUser) {
        history = history.filter(log => log.actor === this.filterUser)
      }

      return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    }
  },
  methods: {
    formatDate(dateStr) {
      if (!dateStr) return '—'
      return new Date(dateStr).toLocaleString()
    }
  }
}
</script>

<style scoped>
.history-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.history-filters > * {
  flex: 1;
}

.history-timeline {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.no-history {
  padding: 40px 20px;
  text-align: center;
  color: #999;
}

.history-event {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;
}

.history-event:last-child {
  border-bottom: none;
}

.event-timestamp {
  color: #999;
  font-size: 11px;
  white-space: nowrap;
}

.event-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-user {
  font-weight: 600;
  color: #333;
}

.event-action {
  color: #666;
  text-transform: uppercase;
  font-size: 10px;
}

.event-details {
  color: #999;
  font-size: 11px;
  font-style: italic;
}
</style>
