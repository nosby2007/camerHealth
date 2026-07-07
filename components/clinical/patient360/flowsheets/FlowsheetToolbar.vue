<template>
  <div class="toolbar">
    <div class="toolbar-section">
      <v-btn small text @click="$emit('add-rows')" title="Add Rows">
        <v-icon x-small left>mdi-plus</v-icon>Add Rows
      </v-btn>
      <v-btn small text @click="insertColumn" title="Add Column">
        <v-icon x-small left>mdi-plus</v-icon>Add Col
      </v-btn>
      <v-btn small text @click="insertColumn" title="Insert Column">
        <v-icon x-small left>mdi-plus</v-icon>Insert Col
      </v-btn>
      <v-btn small text @click="$emit('device-data')" title="Device Data">
        <v-icon x-small left>mdi-database</v-icon>Device Data
      </v-btn>
    </div>

    <div class="toolbar-section">
      <v-btn small text @click="toggleHideCompleted" :color="hideCompleted ? 'primary' : ''">
        <v-icon x-small left>mdi-eye-off</v-icon>Hide Comp'd
      </v-btn>
      <v-btn small text @click="toggleSmartCollapse" :color="smartCollapse ? 'primary' : ''">
        <v-icon x-small left>mdi-compress</v-icon>Smart-Collapse
      </v-btn>
      <v-btn small text @click="goToLastFiled">
        <v-icon x-small left>mdi-history</v-icon>Last Filed
      </v-btn>
      <v-btn small text @click="goToDate">
        <v-icon x-small left>mdi-calendar</v-icon>Go to Date
      </v-btn>
    </div>

    <div class="toolbar-section">
      <v-menu offset-y>
        <template #activator="{ on, attrs }">
          <v-btn small text v-bind="attrs" v-on="on">
            <v-icon x-small left>mdi-account</v-icon>Responsible
          </v-btn>
        </template>
        <v-list dense>
          <v-list-item @click="setResponsible('current')">
            <v-list-item-title>Current User</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-btn small text @click="refresh">
        <v-icon x-small left>mdi-refresh</v-icon>Refresh
      </v-btn>
      <v-btn small text @click="$emit('flowsheet-history')">
        <v-icon x-small left>mdi-history</v-icon>History
      </v-btn>
      <v-btn small text @click="$emit('chart-correction')">
        <v-icon x-small left>mdi-pencil</v-icon>Chart Correction
      </v-btn>
      <v-btn small text @click="openGraph">
        <v-icon x-small left>mdi-chart-line</v-icon>Graph
      </v-btn>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FlowsheetToolbar',
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true },
    admissionId: { type: String, required: true },
    role: { type: String, required: true }
  },
  data() {
    return {
      selectedDate: null
    }
  },
  computed: {
    hideCompleted() {
      return this.$store.state.flowsheets.hideCompleted
    },
    smartCollapse() {
      return this.$store.state.flowsheets.smartCollapse
    }
  },
  methods: {
    insertColumn() {
      const column = this.$store.dispatch('flowsheets/createColumn', {
        patientId: this.patientId,
        encounterId: this.encounterId,
        admissionId: this.admissionId
      })
      this.$store.commit('flowsheets/SET_SELECTED_COLUMN', column.id)
    },
    toggleHideCompleted() {
      this.$store.commit('flowsheets/SET_HIDE_COMPLETED', !this.hideCompleted)
    },
    toggleSmartCollapse() {
      this.$store.commit('flowsheets/SET_SMART_COLLAPSE', !this.smartCollapse)
    },
    goToLastFiled() {
      this.$emit('go-to-last-filed')
    },
    goToDate() {
      this.$emit('go-to-date')
    },
    setResponsible(user) {
      console.log('Set responsible:', user)
    },
    refresh() {
      this.$forceUpdate()
    },
    openGraph() {
      this.$emit('open-graph')
    }
  }
}
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 16px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  align-items: center;
  flex-wrap: wrap;
}

.toolbar-section {
  display: flex;
  gap: 4px;
  align-items: center;
}

.toolbar-section:not(:last-child) {
  border-right: 1px solid #ccc;
  padding-right: 12px;
}
</style>
