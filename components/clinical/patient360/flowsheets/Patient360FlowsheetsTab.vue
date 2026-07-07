<template>
  <div class="flowsheet-tab">
    <FlowsheetToolbar
      :patient-id="patientId"
      :encounter-id="encounterId"
      :admission-id="admissionId"
      :role="role"
      @add-rows="showAddRowsDialog = true"
      @device-data="showDeviceDataDialog = true"
      @chart-correction="showCorrectionDialog = true"
      @flowsheet-history="showHistoryDialog = true"
    />

    <div class="flowsheet-container">
      <FlowsheetTabs
        :templates="templates"
        :selected-template-id="selectedTemplateId"
        @select-template="selectTemplate"
      />

      <div class="flowsheet-body">
        <FlowsheetBodySystemNav
          :template-id="selectedTemplateId"
          :sections="sections"
          @filter-sections="filterBySections"
        />

        <div class="flowsheet-grid-container">
          <FlowsheetGrid
            :patient-id="patientId"
            :encounter-id="encounterId"
            :template-id="selectedTemplateId"
            :sections="filteredSections"
            :hide-completed="hideCompleted"
            :smart-collapse="smartCollapse"
            :show-last-filed="showLastFiled"
            @select-row="selectRow"
            @cell-update="updateCell"
            @cell-correct="correctCell"
          />
        </div>

        <div :class="['flowsheet-right-panel', { collapsed: isRightPanelCollapsed }]">
          <button class="panel-collapse-btn" @click="isRightPanelCollapsed = !isRightPanelCollapsed" :title="isRightPanelCollapsed ? 'Expand' : 'Collapse'">
            <v-icon x-small>{{ isRightPanelCollapsed ? 'mdi-chevron-left' : 'mdi-chevron-right' }}</v-icon>
          </button>
          <div v-if="!isRightPanelCollapsed" class="panel-content">
            <FlowsheetRightPanel
              :row-id="selectedRowId"
              :patient-id="patientId"
              :encounter-id="encounterId"
              :last-filed="lastFiledValue"
            />
          </div>
        </div>
      </div>
    </div>

    <AddRowsDialog
      :show.sync="showAddRowsDialog"
      :template-id="selectedTemplateId"
      :patient-id="patientId"
      :encounter-id="encounterId"
      @add="addRows"
    />

    <DeviceDataDialog
      :show.sync="showDeviceDataDialog"
      :patient-id="patientId"
      :encounter-id="encounterId"
      @import="importDeviceData"
    />

    <ChartCorrectionDialog
      :show.sync="showCorrectionDialog"
      :patient-id="patientId"
      :encounter-id="encounterId"
      @correct="correctCell"
    />

    <FlowsheetHistoryDialog
      :show.sync="showHistoryDialog"
      :patient-id="patientId"
      :encounter-id="encounterId"
    />
  </div>
</template>

<script>
import FlowsheetToolbar from './FlowsheetToolbar.vue'
import FlowsheetTabs from './FlowsheetTabs.vue'
import FlowsheetBodySystemNav from './FlowsheetBodySystemNav.vue'
import FlowsheetGrid from './FlowsheetGrid.vue'
import FlowsheetRightPanel from './FlowsheetRightPanel.vue'
import AddRowsDialog from './AddRowsDialog.vue'
import DeviceDataDialog from './DeviceDataDialog.vue'
import ChartCorrectionDialog from './ChartCorrectionDialog.vue'
import FlowsheetHistoryDialog from './FlowsheetHistoryDialog.vue'

export default {
  name: 'Patient360FlowsheetsTab',
  components: {
    FlowsheetToolbar,
    FlowsheetTabs,
    FlowsheetBodySystemNav,
    FlowsheetGrid,
    FlowsheetRightPanel,
    AddRowsDialog,
    DeviceDataDialog,
    ChartCorrectionDialog,
    FlowsheetHistoryDialog
  },
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true },
    admissionId: { type: String, required: true },
    role: { type: String, required: true }
  },
  data() {
    return {
      showAddRowsDialog: false,
      showDeviceDataDialog: false,
      showCorrectionDialog: false,
      showHistoryDialog: false,
      filteredBySystems: null,
      isRightPanelCollapsed: false
    }
  },
  computed: {
    templates() {
      return this.$store.getters['flowsheets/templates']
    },
    selectedTemplateId() {
      return this.$store.state.flowsheets.selectedTemplateId
    },
    sections() {
      return this.$store.getters['flowsheets/sectionsForTemplate'](this.selectedTemplateId)
    },
    filteredSections() {
      if (!this.filteredBySystems || this.filteredBySystems.length === 0) return this.sections
      return this.sections.filter(s => this.filteredBySystems.includes(s.bodySystem))
    },
    selectedRowId() {
      return this.$store.state.flowsheets.selectedRowId
    },
    hideCompleted() {
      return this.$store.state.flowsheets.hideCompleted
    },
    smartCollapse() {
      return this.$store.state.flowsheets.smartCollapse
    },
    showLastFiled() {
      return this.$store.state.flowsheets.showLastFiled
    },
    lastFiledValue() {
      if (!this.selectedRowId) return null
      return this.$store.getters['flowsheets/lastFiledByRow'](this.patientId, this.encounterId, this.selectedRowId)
    }
  },
  mounted() {
    // Create initial columns when component mounts
    this.createInitialColumns()
    // Initialize API service for backend persistence
    this.initializeApi()
  },
  methods: {
    selectTemplate(templateId) {
      this.$store.commit('flowsheets/SET_SELECTED_TEMPLATE', templateId)
      this.filteredBySystems = null
      // Create columns for new template
      this.createInitialColumns()
    },
    selectRow(rowId) {
      this.$store.commit('flowsheets/SET_SELECTED_ROW', rowId)
    },
    filterBySections(systems) {
      this.filteredBySystems = systems
    },
    updateCell(payload) {
      this.$store.dispatch('flowsheets/updateCell', {
        ...payload,
        patientId: this.patientId,
        encounterId: this.encounterId
      })
    },
    correctCell(payload) {
      this.$store.dispatch('flowsheets/correctCell', {
        ...payload,
        patientId: this.patientId,
        encounterId: this.encounterId
      })
    },
    createInitialColumns() {
      // Create 3 initial time columns
      const times = ['08:00', '12:00', '16:00']
      times.forEach(time => {
        if (this.$store.state.flowsheets.columns.length < 3) {
          this.$store.dispatch('flowsheets/createColumn', {
            patientId: this.patientId,
            encounterId: this.encounterId,
            admissionId: this.admissionId,
            documentedAt: new Date().toISOString(),
            source: 'manual'
          })
        }
      })
    },
    addRows(rows) {
      // Rows are now already defined in the store templates
      this.$forceUpdate()
    },
    importDeviceData(data) {
      // Placeholder for device data import
      console.log('Importing device data:', data)
    },
    initializeApi() {
      if (!this.$store.$flowsheetApi && !window.$flowsheetApi) {
        try {
          const { createFlowsheetApi } = require('~/services/flowsheetApi')
          const api = createFlowsheetApi(this.$axios)
          this.$store.$flowsheetApi = api
          window.$flowsheetApi = api
        } catch (error) {
          console.warn('FlowsheetApi service not available (backend may not be configured):', error.message)
        }
      }
    }
  }
}
</script>

<style scoped>
.flowsheet-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.flowsheet-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.flowsheet-body {
  display: grid;
  grid-template-columns: 200px 1fr 250px;
  flex: 1;
  gap: 1px;
  background: #e8eaea;
  overflow: hidden;
  transition: grid-template-columns 0.3s ease;
}

.flowsheet-right-panel {
  background: #f9f9f9;
  border-left: 1px solid #e0e0e0;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  min-width: 40px;
}

.flowsheet-right-panel.collapsed {
  width: 40px;
  min-width: 40px;
}

.panel-collapse-btn {
  background: none;
  border: none;
  padding: 8px 4px;
  cursor: pointer;
  color: #0f766e;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 0.2s ease;
  min-height: 40px;
}

.panel-collapse-btn:hover {
  color: #075d58;
}

.panel-content {
  overflow-y: auto;
  flex: 1;
  padding: 8px;
}

.flowsheet-grid-container {
  overflow: auto;
  background: #fff;
}
</style>
