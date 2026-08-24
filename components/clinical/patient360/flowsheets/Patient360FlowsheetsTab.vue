<template>
  <div class="flowsheet-tab">
    <FlowsheetToolbar
      :patient-id="patientId"
      :encounter-id="encounterId"
      :admission-id="admissionId"
      :role="role"
      @add-rows="openWriteDialog('showAddRowsDialog')"
      @device-data="openWriteDialog('showDeviceDataDialog')"
      @chart-correction="openWriteDialog('showCorrectionDialog')"
      @flowsheet-history="showHistoryDialog = true"
      @timed-documentation="openWriteDialog('showTimedCareDialog')"
    />

    <div v-if="readOnly" class="read-only-notice">
      <v-icon x-small>mdi-lock-outline</v-icon>
      Discharged chart. Timestamped care and assessments are available in read-only mode.
    </div>

    <div class="timed-care-summary">
      <div>
        <span>Care documentation</span>
        <strong>Timestamped care, evaluation, care plan and education</strong>
      </div>
      <v-btn v-if="!readOnly" x-small depressed color="#0f766e" dark @click="showTimedCareDialog = true">
        <v-icon x-small left>mdi-clock-edit-outline</v-icon>New timed entry
      </v-btn>
    </div>

    <div v-if="recentTimedEntries.length" class="timed-entry-list">
      <article v-for="entry in recentTimedEntries" :key="entry.id">
        <strong>{{ entry.label }}</strong>
        <span>{{ formatDateTime(entry.documentedAt) }}</span>
        <small>{{ entry.summary }}</small>
      </article>
    </div>

    <div class="flowsheet-container">
      <FlowsheetTabs
        :templates="templates"
        :selected-template-id="selectedTemplateId"
        @select-template="selectTemplate"
      />

      <div :class="['flowsheet-body', { 'body-nav-collapsed': isBodyNavCollapsed, 'detail-panel-collapsed': isRightPanelCollapsed }]">
        <FlowsheetBodySystemNav
          :template-id="selectedTemplateId"
          :sections="sections"
          @filter-sections="filterBySections"
          @collapse-change="isBodyNavCollapsed = $event"
        />

        <div :class="['flowsheet-grid-container', { 'read-only-grid': readOnly }]">
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

    <TimedCareDocumentationDialog
      :show.sync="showTimedCareDialog"
      :templates="templates"
      @save="fileTimedCare"
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
import TimedCareDocumentationDialog from './TimedCareDocumentationDialog.vue'

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
    FlowsheetHistoryDialog,
    TimedCareDocumentationDialog
  },
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true },
    admissionId: { type: String, required: true },
    role: { type: String, required: true },
    readOnly: { type: Boolean, default: false }
  },
  data() {
    return {
      showAddRowsDialog: false,
      showDeviceDataDialog: false,
      showCorrectionDialog: false,
      showHistoryDialog: false,
      showTimedCareDialog: false,
      filteredBySystems: null,
      isBodyNavCollapsed: false,
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
    },
    recentTimedEntries() {
      return this.$store.getters['flowsheets/recentTimedCareEntries'](this.patientId, this.encounterId).slice(0, 4)
    }
  },
  watch: {
    readOnly(value) {
      if (!value) return
      this.showAddRowsDialog = false
      this.showDeviceDataDialog = false
      this.showCorrectionDialog = false
      this.showTimedCareDialog = false
    }
  },
  mounted() {
    // Create initial columns when component mounts
    if (!this.readOnly) this.createInitialColumns()
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
      if (this.readOnly) return
      this.$store.dispatch('flowsheets/updateCell', {
        ...payload,
        patientId: this.patientId,
        encounterId: this.encounterId
      })
    },
    correctCell(payload) {
      if (this.readOnly) return
      this.$store.dispatch('flowsheets/correctCell', {
        ...payload,
        patientId: this.patientId,
        encounterId: this.encounterId
      })
    },
    createInitialColumns() {
      if (this.readOnly) return
      const existingColumns = this.$store.state.flowsheets.columns.filter(
        column => column.patientId === this.patientId && column.encounterId === this.encounterId
      )
      const scheduledHours = [8, 12, 16]
      scheduledHours.slice(existingColumns.length).forEach(hour => {
        const documentedAt = new Date()
        documentedAt.setHours(hour, 0, 0, 0)
        this.$store.dispatch('flowsheets/createColumn', {
          patientId: this.patientId,
          encounterId: this.encounterId,
          admissionId: this.admissionId,
          documentedAt: documentedAt.toISOString(),
          source: 'scheduled'
        })
      })
    },
    addRows(rows) {
      if (this.readOnly) return
      // Rows are now already defined in the store templates
      this.$forceUpdate()
    },
    importDeviceData(data) {
      if (this.readOnly) return
      // Placeholder for device data import
      console.log('Importing device data:', data)
    },
    async fileTimedCare(payload) {
      if (this.readOnly) return
      await this.$store.dispatch('flowsheets/documentTimedCare', {
        patientId: this.patientId,
        encounterId: this.encounterId,
        admissionId: this.admissionId,
        ...payload
      })
      this.$toast?.success('Timed care entry filed')
    },
    openWriteDialog(dialogName) {
      if (this.readOnly) return
      this[dialogName] = true
    },
    formatDateTime(value) {
      if (!value) return ''
      return new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
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

.read-only-notice {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid #cbd5e1;
  background: #f1f5f9;
  color: #334155;
  font-size: 11px;
  font-weight: 700;
}

.read-only-grid ::v-deep input,
.read-only-grid ::v-deep textarea,
.read-only-grid ::v-deep select,
.read-only-grid ::v-deep button,
.read-only-grid ::v-deep .v-input,
.read-only-grid ::v-deep .v-btn {
  pointer-events: none !important;
  opacity: 0.68;
}

.timed-care-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid #d7e0df;
  background: #f8fafc;
}

.timed-care-summary div {
  display: flex;
  flex-direction: column;
}

.timed-care-summary span {
  font-size: 11px;
  font-weight: 800;
  color: #0f766e;
  text-transform: uppercase;
}

.timed-care-summary strong {
  font-size: 14px;
  color: #0f172a;
}

.timed-entry-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid #d7e0df;
  background: #fff;
}

.timed-entry-list article {
  display: flex;
  min-height: 72px;
  flex-direction: column;
  gap: 3px;
  padding: 8px;
  border: 1px solid #d7e0df;
  border-radius: 8px;
  background: #ffffff;
}

.timed-entry-list strong {
  color: #134e4a;
  font-size: 12px;
}

.timed-entry-list span,
.timed-entry-list small {
  color: #475569;
  font-size: 11px;
}

.flowsheet-body {
  --body-nav-width: 190px;
  --detail-panel-width: 260px;
  display: grid;
  grid-template-columns: var(--body-nav-width) minmax(520px, 1fr) var(--detail-panel-width);
  flex: 1;
  min-height: 420px;
  background: #d8e1e0;
  overflow: hidden;
  transition: grid-template-columns 0.3s ease;
}

.flowsheet-body.body-nav-collapsed {
  --body-nav-width: 40px;
}

.flowsheet-body.detail-panel-collapsed {
  --detail-panel-width: 40px;
}

.flowsheet-right-panel {
  background: #f9f9f9;
  border-left: 1px solid #e0e0e0;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.flowsheet-right-panel.collapsed {
  width: auto;
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

@media (max-width: 900px) {
  .timed-care-summary {
    align-items: stretch;
    flex-direction: column;
  }

  .timed-entry-list {
    grid-template-columns: 1fr;
  }

  .flowsheet-body {
    --body-nav-width: 1fr;
    --detail-panel-width: 1fr;
    grid-template-columns: 1fr;
    overflow: visible;
  }

  .flowsheet-right-panel,
  .flowsheet-right-panel.collapsed {
    min-height: 44px;
    width: auto;
  }
}
</style>
