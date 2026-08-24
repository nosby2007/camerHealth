<template>
  <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
    <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center justify-space-between">
      <span class="text-caption font-weight-black grey--text text-uppercase ls-1"><v-icon small color="#003366" class="mr-2">mdi-format-list-checks</v-icon>Nurse TaskFlow</span>
      <v-chip x-small label color="#003366" dark class="font-weight-black">{{ openCount }} OPEN</v-chip>
    </div>
    <v-data-table :headers="headers" :items="tasks" dense class="gov-table" :items-per-page="6" hide-default-footer>
      <template v-slot:item.title="{ item }">
        <div class="font-weight-black gov-text-primary text-caption">{{ item.title }}</div>
        <div class="text-caption grey--text">{{ item.reason || item.linkedOrderType || 'Nursing task' }}</div>
      </template>
      <template v-slot:item.priority="{ item }">
        <v-chip x-small label dark :color="priorityColor(item.priority)" class="font-weight-black">{{ item.priority || 'routine' }}</v-chip>
      </template>
      <template v-slot:item.status="{ item }">
        <v-select :value="item.status" :items="statuses" dense outlined tile hide-details class="status-select" @change="$emit('status-change', { id: item.id, status: $event })"></v-select>
      </template>
    </v-data-table>
  </v-card>
</template>

<script>
export default {
  props: { tasks: { type: Array, default: () => [] } },
  data() {
    return {
      statuses: ['pending', 'in_progress', 'completed', 'refused', 'missed', 'cancelled'],
      headers: [
        { text: 'TASK', value: 'title' },
        { text: 'PRIORITY', value: 'priority', align: 'center' },
        { text: 'DUE', value: 'dueAt' },
        { text: 'STATUS', value: 'status', width: 170 }
      ]
    }
  },
  computed: { openCount() { return this.tasks.filter(task => ['pending', 'in_progress'].includes(task.status)).length } },
  methods: { priorityColor(priority) { return { stat: '#C0392B', urgent: '#D97706', routine: '#003366' }[priority] || '#003366' } }
}
</script>

<style scoped>
.gov-card { background:white !important; }
.gov-text-primary { color:#1B1F23 !important; }
.b-1 { border:1px solid #E5E7EB; }
.border-bottom { border-bottom:1px solid #E5E7EB; }
.shadow-sm { box-shadow:0 2px 6px rgba(0,0,0,0.05) !important; }
.ls-1 { letter-spacing:0.8px !important; }
.status-select { max-width:155px; }
.gov-table ::v-deep th { background:#F8FAFC !important; color:#1B1F23 !important; font-size:10px !important; font-weight:800; text-transform:uppercase; }
</style>
