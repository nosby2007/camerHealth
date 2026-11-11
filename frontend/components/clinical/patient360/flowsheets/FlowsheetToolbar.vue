<template>
  <div class="toolbar">
    <div class="toolbar-section">
      <v-btn small text @click="$emit('add-rows')" :title="$t('clinical360.flowsheets.toolbar.add_rows')">
        <v-icon x-small left>mdi-plus</v-icon>{{ $t('clinical360.flowsheets.toolbar.add_rows') }}
      </v-btn>
      <v-btn small text @click="insertColumn" :title="$t('clinical360.flowsheets.toolbar.add_column')">
        <v-icon x-small left>mdi-plus</v-icon>{{ $t('clinical360.flowsheets.toolbar.add_col') }}
      </v-btn>
      <v-btn small text @click="insertColumn" :title="$t('clinical360.flowsheets.toolbar.insert_column')">
        <v-icon x-small left>mdi-plus</v-icon>{{ $t('clinical360.flowsheets.toolbar.insert_col') }}
      </v-btn>
      <v-btn small :color="isSaving ? 'info' : 'success'" text :disabled="isSaving" @click="fileCurrentColumn" :title="$t('clinical360.flowsheets.toolbar.file_save_current_column')">
        <v-icon x-small left>{{ isSaving ? 'mdi-loading' : 'mdi-content-save' }}</v-icon>{{ isSaving ? $t('clinical360.flowsheets.toolbar.saving') : $t('clinical360.flowsheets.toolbar.file_column') }}
      </v-btn>
      <v-btn small depressed color="#0f766e" dark @click="$emit('timed-documentation')" :title="$t('clinical360.flowsheets.toolbar.timed_care_documentation')">
        <v-icon x-small left>mdi-clock-edit-outline</v-icon>{{ $t('clinical360.flowsheets.toolbar.timed_entry') }}
      </v-btn>
      <div v-if="saveStatus" :class="['save-status', saveError ? 'error' : 'success']">
        <v-icon x-small>{{ saveError ? 'mdi-alert-circle' : 'mdi-check-circle' }}</v-icon>
        <span>{{ saveStatusText }}</span>
      </div>
      <v-btn small text @click="$emit('device-data')" :title="$t('clinical360.flowsheets.toolbar.device_data')">
        <v-icon x-small left>mdi-database</v-icon>{{ $t('clinical360.flowsheets.toolbar.device_data') }}
      </v-btn>
    </div>

    <div class="toolbar-section">
      <v-btn small text @click="toggleHideCompleted" :color="hideCompleted ? 'primary' : ''">
        <v-icon x-small left>mdi-eye-off</v-icon>{{ $t('clinical360.flowsheets.toolbar.hide_completed') }}
      </v-btn>
      <v-btn small text @click="toggleSmartCollapse" :color="smartCollapse ? 'primary' : ''">
        <v-icon x-small left>mdi-compress</v-icon>{{ $t('clinical360.flowsheets.toolbar.smart_collapse') }}
      </v-btn>
      <v-btn small text @click="goToLastFiled">
        <v-icon x-small left>mdi-history</v-icon>{{ $t('clinical360.flowsheets.toolbar.last_filed') }}
      </v-btn>
      <v-btn small text @click="goToDate">
        <v-icon x-small left>mdi-calendar</v-icon>{{ $t('clinical360.flowsheets.toolbar.go_to_date') }}
      </v-btn>
    </div>

    <div class="toolbar-section">
      <v-menu offset-y>
        <template #activator="{ on, attrs }">
          <v-btn small text v-bind="attrs" v-on="on">
            <v-icon x-small left>mdi-account</v-icon>{{ $t('clinical360.flowsheets.toolbar.responsible') }}
          </v-btn>
        </template>
        <v-list dense>
          <v-list-item @click="setResponsible('current')">
            <v-list-item-title>{{ $t('clinical360.flowsheets.toolbar.current_user') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-btn small text @click="refresh">
        <v-icon x-small left>mdi-refresh</v-icon>{{ $t('clinical360.flowsheets.toolbar.refresh') }}
      </v-btn>
      <v-btn small text @click="$emit('flowsheet-history')">
        <v-icon x-small left>mdi-history</v-icon>{{ $t('clinical360.flowsheets.toolbar.history') }}
      </v-btn>
      <v-btn small text @click="$emit('chart-correction')">
        <v-icon x-small left>mdi-pencil</v-icon>{{ $t('clinical360.flowsheets.toolbar.chart_correction') }}
      </v-btn>
      <v-btn small text @click="openGraph">
        <v-icon x-small left>mdi-chart-line</v-icon>{{ $t('clinical360.flowsheets.toolbar.graph') }}
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
    },
    selectedColumnId() {
      return this.$store.state.flowsheets.selectedColumnId
    },
    isSaving() {
      return this.$store.state.flowsheets.saveState.isSaving
    },
    saveError() {
      return this.$store.state.flowsheets.saveState.saveError
    },
    lastSavedAt() {
      return this.$store.state.flowsheets.saveState.lastSavedAt
    },
    saveStatus() {
      return this.saveError || this.lastSavedAt
    },
    saveStatusText() {
      if (this.saveError) return this.$t('clinical360.flowsheets.toolbar.save_error', { error: this.saveError })
      if (this.lastSavedAt) {
        const time = new Date(this.lastSavedAt)
        return this.$t('clinical360.flowsheets.toolbar.saved_at', { time: time.toLocaleTimeString() })
      }
      return ''
    }
  },
  methods: {
    async insertColumn() {
      const column = await this.$store.dispatch('flowsheets/createColumn', {
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
    },
    async fileCurrentColumn() {
      if (!this.selectedColumnId) {
        alert(this.$t('clinical360.flowsheets.toolbar.select_column_to_file'))
        return
      }
      try {
        await this.$store.dispatch('flowsheets/fileColumn', {
          columnId: this.selectedColumnId,
          patientId: this.patientId,
          encounterId: this.encounterId
        })
      } catch (error) {
        console.error('Failed to file column:', error)
      }
    }
  }
}
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 8px;
  min-height: 46px;
  padding: 5px 8px;
  background: #f7faf9;
  border-bottom: 1px solid #cbd5e1;
  align-items: center;
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
}

.toolbar-section {
  display: flex;
  gap: 4px;
  align-items: center;
  flex: 0 0 auto;
}

.toolbar-section:not(:last-child) {
  border-right: 1px solid #ccc;
  padding-right: 8px;
}

.toolbar ::v-deep .v-btn {
  min-width: auto;
  padding: 0 8px;
  white-space: nowrap;
}

.save-status {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.save-status.success {
  color: #2e7d32;
  background: #e8f5e9;
}

.save-status.error {
  color: #c62828;
  background: #ffebee;
}
</style>
