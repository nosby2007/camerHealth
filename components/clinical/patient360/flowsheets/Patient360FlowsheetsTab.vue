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
          @filter-section="filterBySection"
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

        <FlowsheetRightPanel
          :row-id="selectedRowId"
          :patient-id="patientId"
          :encounter-id="encounterId"
          :last-filed="lastFiledValue"
        />
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
      filteredBySection: null
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
      if (!this.filteredBySection) return this.sections
      return this.sections.filter(s => s.bodySystem === this.filteredBySection)
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
  methods: {
    selectTemplate(templateId) {
      this.$store.commit('flowsheets/SET_SELECTED_TEMPLATE', templateId)
      this.filteredBySection = null
    },
    selectRow(rowId) {
      this.$store.commit('flowsheets/SET_SELECTED_ROW', rowId)
    },
    filterBySection(bodySystem) {
      this.filteredBySection = bodySystem
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
    addRows(rows) {
      console.log('Add rows:', rows)
    },
    importDeviceData(data) {
      console.log('Import device data:', data)
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
}

.flowsheet-grid-container {
  overflow: auto;
  background: #fff;
}
</style>
