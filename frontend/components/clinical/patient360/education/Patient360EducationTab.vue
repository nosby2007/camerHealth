<template>
  <div class="education-workspace">
    <!-- Toolbar -->
    <div class="education-toolbar">
      <div class="toolbar-actions">
        <v-btn v-if="!readOnly" x-small depressed color="#0f766e" dark @click="showAddTitleDialog = true">
          <v-icon x-small left>mdi-plus</v-icon>{{ $t('clinical360.education.tab.add_title') }}
        </v-btn>
        <v-btn v-if="!readOnly" x-small text @click="showAddPointDialog = true">
          <v-icon x-small left>mdi-plus</v-icon>{{ $t('clinical360.education.tab.add_point') }}
        </v-btn>
      </div>

      <div class="toolbar-controls">
        <v-checkbox v-model="showActive" dense :label="$t('clinical360.education.tab.active_only')" class="mt-0" />
        <v-checkbox v-model="hideDescriptions" dense :label="$t('clinical360.education.tab.hide_descriptions')" class="mt-0" />
      </div>
    </div>

    <div v-if="readOnly" class="read-only-notice">
      <v-icon x-small>mdi-lock-outline</v-icon>
      {{ $t('clinical360.education.tab.read_only_notice') }}
    </div>

    <div class="education-summary" :aria-label="$t('clinical360.education.tab.summary_aria_label')">
      <div><v-icon small color="#0f766e">mdi-book-open-page-variant-outline</v-icon><span>{{ $t('clinical360.education.tab.topics') }}</span><strong>{{ educationSummary.titleCount }}</strong></div>
      <div><v-icon small color="#0369a1">mdi-format-list-checks</v-icon><span>{{ $t('clinical360.education.tab.teaching_points') }}</span><strong>{{ educationSummary.pointCount }}</strong></div>
      <div><v-icon small color="#15803d">mdi-check-decagram-outline</v-icon><span>{{ $t('clinical360.education.tab.completed') }}</span><strong>{{ educationSummary.completedCount }}</strong></div>
      <div><v-icon small color="#7c3aed">mdi-account-heart-outline</v-icon><span>{{ $t('clinical360.education.tab.family_sessions') }}</span><strong>{{ educationSummary.familyEducationCount }}</strong></div>
      <div class="completion-cell"><span>{{ $t('clinical360.education.tab.overall_completion') }}</span><strong>{{ completionRate }}%</strong><i><b :style="{ width: `${completionRate}%` }"></b></i></div>
    </div>

    <!-- Main Content -->
    <div class="education-content" :class="{ 'tree-collapsed': treeCollapsed }">
      <!-- Left: Education Tree -->
      <div class="education-tree-panel" v-if="!treeCollapsed">
        <div class="tree-header">
          <h4>{{ $t('clinical360.education.tab.topics') }}</h4>
          <button class="collapse-btn" @click="treeCollapsed = true" :title="$t('clinical360.education.tab.collapse_sidebar')">
            <v-icon x-small>mdi-chevron-left</v-icon>
          </button>
        </div>
        <EducationTree
          :patient-id="patientId"
          :show-active="showActive"
          @select-title="selectedTitleId = $event"
          @select-point="selectedPointId = $event"
        />
      </div>
      <button v-else class="expand-tree-btn" @click="treeCollapsed = false" :title="$t('clinical360.education.tab.expand_sidebar')">
        <v-icon x-small>mdi-chevron-right</v-icon>
      </button>

      <!-- Center: Education Points & Documentation -->
      <div class="education-points-panel">
        <div v-if="selectedTitle" class="title-section">
          <h3>{{ selectedTitle.title }}</h3>

          <div class="education-cards">
            <EducationPointCard
              v-for="point in selectedTitlePoints"
              :key="point.id"
              :point="point"
              :hide-description="hideDescriptions"
              @select="selectedPointId = point.id"
              @document="documentPoint(point)"
              @add-material="openMaterialDialog"
            />
          </div>
        </div>
        <div v-else class="empty">
          {{ $t('clinical360.education.tab.select_title_prompt') }}
        </div>
      </div>

      <!-- Right: Patient Materials -->
      <div class="materials-panel">
        <h4>{{ $t('clinical360.education.tab.patient_materials') }}</h4>
        <v-btn v-if="!readOnly" x-small text color="#0f766e" @click="showAddMaterialDialog = true">
          <v-icon x-small left>mdi-plus</v-icon>{{ $t('clinical360.education.tab.add_material') }}
        </v-btn>

        <div class="materials-list">
          <div v-for="assignment in assignedMaterials" :key="assignment.id" class="material-item">
            <span class="material-title">{{ assignment.material?.title }}</span>
            <v-btn v-if="!readOnly" x-small icon @click="removeMaterialFromAvs(assignment.id)">
              <v-icon x-small>mdi-close</v-icon>
            </v-btn>
          </div>
          <div v-if="!assignedMaterials.length" class="materials-empty">{{ $t('clinical360.education.tab.no_material_assigned') }}</div>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <v-dialog v-model="showAddTitleDialog" max-width="400">
      <v-card>
        <v-card-title>{{ $t('clinical360.education.tab.add_education_title') }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="newTitle" :label="$t('clinical360.education.tab.title_label')" outlined dense />
          <v-select v-model="newCategory" :label="$t('clinical360.education.tab.category')" :items="categories" item-value="value" item-text="text" outlined dense />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text small @click="showAddTitleDialog = false">{{ $t('clinical360.education.tab.cancel') }}</v-btn>
          <v-btn depressed color="#0f766e" dark small @click="addTitle">{{ $t('clinical360.education.tab.add') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showAddPointDialog" max-width="400">
      <v-card>
        <v-card-title>{{ $t('clinical360.education.tab.add_education_point') }}</v-card-title>
        <v-card-text>
          <v-select v-model="newPointTitleId" :label="$t('clinical360.education.tab.title_label')" :items="titles" item-text="title" item-value="id" outlined dense />
          <v-text-field v-model="newPointLabel" :label="$t('clinical360.education.tab.label_field')" outlined dense />
          <v-text-field v-model="newPointTopic" :label="$t('clinical360.education.tab.topic_field')" outlined dense />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text small @click="showAddPointDialog = false">{{ $t('clinical360.education.tab.cancel') }}</v-btn>
          <v-btn depressed color="#0f766e" dark small @click="addPoint">{{ $t('clinical360.education.tab.add') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showAddMaterialDialog" max-width="560" persistent>
      <v-card>
        <v-card-title class="material-dialog-title">
          <div><span>{{ $t('clinical360.education.tab.patient_education_eyebrow') }}</span><strong>{{ $t('clinical360.education.tab.add_material_to_packet') }}</strong></div>
          <v-btn icon small @click="showAddMaterialDialog = false"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text class="pt-5">
          <v-text-field v-model.trim="materialForm.title" :label="$t('clinical360.education.tab.material_title')" dense outlined :rules="[requiredRule]" />
          <div class="material-form-grid">
            <v-select v-model="materialForm.language" :items="languageOptions" item-value="value" item-text="text" :label="$t('clinical360.education.tab.language')" dense outlined />
            <v-select v-model="materialForm.format" :items="formatOptions" item-value="value" item-text="text" :label="$t('clinical360.education.tab.format')" dense outlined />
          </div>
          <v-textarea v-model.trim="materialForm.instructions" :label="$t('clinical360.education.tab.key_instructions')" rows="3" dense outlined />
          <v-checkbox v-model="materialForm.addToAvs" dense hide-details :label="$t('clinical360.education.tab.include_in_packet')" />
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn text small @click="showAddMaterialDialog = false">{{ $t('clinical360.education.tab.cancel') }}</v-btn><v-btn depressed dark color="#0f766e" small :loading="savingMaterial" @click="saveMaterial">{{ $t('clinical360.education.tab.add_material_button') }}</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <EducationDocumentDialog
      v-if="selectedPoint"
      :show.sync="showDocumentDialog"
      :point="selectedPoint"
      @save="fileEducation"
    />
  </div>
</template>

<script>
import EducationTree from './EducationTree.vue'
import EducationPointCard from './EducationPointCard.vue'
import EducationDocumentDialog from './EducationDocumentDialog.vue'

export default {
  name: 'Patient360EducationTab',
  components: {
    EducationTree,
    EducationPointCard,
    EducationDocumentDialog
  },
  watch: {
    readOnly(value) {
      if (!value) return
      this.showAddTitleDialog = false
      this.showAddPointDialog = false
      this.showAddMaterialDialog = false
      this.showDocumentDialog = false
    }
  },
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true },
    admissionId: { type: String, default: '' },
    role: { type: String, default: '' },
    readOnly: { type: Boolean, default: false }
  },
  data() {
    return {
      selectedTitleId: null,
      selectedPointId: null,
      showActive: true,
      hideDescriptions: false,
      showAddTitleDialog: false,
      showAddPointDialog: false,
      showAddMaterialDialog: false,
      showDocumentDialog: false,
      newTitle: '',
      newCategory: 'general',
      newPointTitleId: null,
      newPointLabel: '',
      newPointTopic: '',
      treeCollapsed: false,
      savingMaterial: false,
      materialForm: { title: '', language: 'French', format: 'Verbal + printed', instructions: '', addToAvs: true }
    }
  },
  computed: {
    requiredRule() {
      return value => Boolean(String(value || '').trim()) || this.$t('clinical360.education.tab.required')
    },
    categories() {
      return [
        ['general', 'general'],
        ['infection', 'infection'],
        ['safety', 'safety'],
        ['wound', 'wound'],
        ['discharge', 'discharge'],
        ['pain', 'pain'],
        ['nutrition', 'nutrition']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.education.tab.category_${k}`) }))
    },
    languageOptions() {
      return [
        ['french', 'French'],
        ['english', 'English'],
        ['bilingual', 'Bilingual'],
        ['local_interpreter', 'Local language / interpreter']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.education.tab.material_language_${k}`) }))
    },
    formatOptions() {
      return [
        ['verbal', 'Verbal'],
        ['printed_handout', 'Printed handout'],
        ['visual_demonstration', 'Visual demonstration'],
        ['verbal_printed', 'Verbal + printed'],
        ['caregiver_demonstration', 'Caregiver demonstration']
      ].map(([k, value]) => ({ value, text: this.$t(`clinical360.education.tab.material_format_${k}`) }))
    },
    titles() {
      return this.$store.getters['education/educationTitlesForPatient']?.(this.patientId) || []
    },
    selectedTitle() {
      if (!this.selectedTitleId) return null
      return this.titles.find(t => t.id === this.selectedTitleId)
    },
    selectedTitlePoints() {
      if (!this.selectedTitleId) return []
      return this.$store.getters['education/educationPointsForTitle']?.(this.selectedTitleId) || []
    },
    selectedPoint() {
      if (!this.selectedPointId) return null
      return this.$store.state.education?.educationPoints?.find(p => p.id === this.selectedPointId)
    },
    assignedMaterials() {
      return this.$store.getters['education/assignedMaterialsForEncounter']?.(this.patientId, this.encounterId) || []
    },
    educationSummary() {
      return this.$store.getters['education/educationSummaryProjection']?.(this.patientId) || { titleCount: 0, pointCount: 0, completedCount: 0, familyEducationCount: 0 }
    },
    completionRate() {
      return this.educationSummary.pointCount ? Math.round((this.educationSummary.completedCount / this.educationSummary.pointCount) * 100) : 0
    }
  },
  methods: {
    async addTitle() {
      if (this.readOnly) return
      try {
        await this.$store.dispatch('education/addEducationTitle', {
          patientId: this.patientId,
          encounterId: this.encounterId,
          admissionId: this.admissionId,
          title: this.newTitle,
          category: this.newCategory
        })
        this.showAddTitleDialog = false
        this.newTitle = ''
        this.$toast?.success(this.$t('clinical360.education.tab.toast_title_added'))
      } catch (err) {
        this.$toast?.error(err.response?.data?.error || err.message || this.$t('clinical360.education.tab.toast_title_add_error'))
      }
    },
    async addPoint() {
      if (this.readOnly) return
      try {
        await this.$store.dispatch('education/addEducationPoint', {
          titleId: this.newPointTitleId,
          patientId: this.patientId,
          encounterId: this.encounterId,
          admissionId: this.admissionId,
          label: this.newPointLabel,
          topic: this.newPointTopic
        })
        this.showAddPointDialog = false
        this.newPointLabel = ''
        this.newPointTopic = ''
        this.$toast?.success(this.$t('clinical360.education.tab.toast_point_added'))
      } catch (err) {
        this.$toast?.error(err.response?.data?.error || err.message || this.$t('clinical360.education.tab.toast_point_add_error'))
      }
    },
    documentPoint(point) {
      if (this.readOnly) return
      this.selectedPointId = point.id
      this.showDocumentDialog = true
    },
    async fileEducation(data) {
      if (this.readOnly) return
      try {
        const doc = await this.$store.dispatch('education/documentEducationPoint', {
          pointId: this.selectedPointId,
          titleId: this.selectedTitleId,
          patientId: this.patientId,
          encounterId: this.encounterId,
          ...data
        })
        if (data.resolveAfterFile) {
          await this.$store.dispatch('education/fileAndResolveEducationDocumentation', {
            documentationId: doc.id,
            pointId: this.selectedPointId,
            patientId: this.patientId
          })
        }
        this.showDocumentDialog = false
        this.$toast?.success(this.$t('clinical360.education.tab.toast_education_documented'))
      } catch (err) {
        this.$toast?.error(err.response?.data?.error || err.message || this.$t('clinical360.education.tab.toast_document_error'))
      }
    },
    async removeMaterialFromAvs(assignmentId) {
      if (this.readOnly) return
      try {
        await this.$store.dispatch('education/removeMaterialFromAvs', {
          assignmentId,
          patientId: this.patientId
        })
        this.$toast?.success(this.$t('clinical360.education.tab.toast_material_removed'))
      } catch (err) {
        this.$toast?.error(err.response?.data?.error || err.message || this.$t('clinical360.education.tab.toast_material_remove_error'))
      }
    },
    openMaterialDialog() {
      if (!this.readOnly) this.showAddMaterialDialog = true
    },
    async saveMaterial() {
      if (this.readOnly || !this.materialForm.title) return
      this.savingMaterial = true
      try {
        const material = await this.$store.dispatch('education/createPatientMaterial', {
          patientId: this.patientId,
          title: this.materialForm.title,
          language: this.materialForm.language,
          format: this.materialForm.format,
          instructions: this.materialForm.instructions
        })
        if (this.materialForm.addToAvs) {
          await this.$store.dispatch('education/addMaterialToAvs', {
            patientId: this.patientId,
            encounterId: this.encounterId,
            materialId: material.id
          })
        }
        this.materialForm = { title: '', language: 'French', format: 'Verbal + printed', instructions: '', addToAvs: true }
        this.showAddMaterialDialog = false
        this.$toast?.success(this.$t('clinical360.education.tab.toast_material_added'))
      } catch (err) {
        this.$toast?.error(err.response?.data?.error || err.message || this.$t('clinical360.education.tab.toast_material_add_error'))
      } finally {
        this.savingMaterial = false
      }
    }
  },
  mounted() {
    const initialize = this.readOnly
      ? Promise.resolve()
      : this.$store.dispatch('education/initializeEducationForPatient', {
          patientId: this.patientId,
          encounterId: this.encounterId,
          admissionId: this.admissionId
        })
    Promise.resolve(initialize).then(() => {
      if (!this.selectedTitleId && this.titles.length) this.selectedTitleId = this.titles[0].id
    })
  }
}
</script>

<style scoped>
.education-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.education-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8fafc;
  border-bottom: 1px solid #d7e0df;
}

.toolbar-actions,
.toolbar-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.education-content {
  display: grid;
  grid-template-columns: 250px 1fr 280px;
  gap: 1px;
  flex: 1;
  overflow: hidden;
  background: #d7e0df;
  position: relative;
}

.education-content.tree-collapsed {
  grid-template-columns: 40px 1fr 280px;
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

.education-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(105px, 1fr)) minmax(180px, 1.35fr);
  background: #fff;
  border-bottom: 1px solid #d7e0df;
}

.education-summary > div {
  min-height: 55px;
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  padding: 7px 12px;
  border-right: 1px solid #e1e8e7;
}

.education-summary span { font-size: 10px; font-weight: 700; color: #526d70; }
.education-summary strong { font-size: 18px; color: #17383a; }
.education-summary .completion-cell { grid-template-columns: 1fr auto; align-content: center; }
.completion-cell i { grid-column: 1 / -1; height: 5px; margin-top: 5px; background: #dce7e5; overflow: hidden; }
.completion-cell b { display: block; height: 100%; background: #0f766e; }

.education-tree-panel,
.education-points-panel,
.materials-panel {
  background: #fff;
  overflow-y: auto;
  padding: 12px;
}

.title-section h3 {
  margin: 0 0 12px 0;
  color: #134e4a;
  font-size: 13px;
  font-weight: 800;
}

.education-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.materials-panel h4 {
  margin: 0 0 8px 0;
  color: #134e4a;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.materials-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.material-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px;
  background: #f8fafc;
  border-radius: 3px;
  font-size: 11px;
}

.material-title {
  font-weight: 600;
  color: #134e4a;
}

.materials-empty { padding: 10px 6px; color: #708487; font-size: 10px; border-top: 1px solid #e5eceb; }
.material-dialog-title { display: flex; justify-content: space-between; background: #166534; color: #fff; }
.material-dialog-title span { display: block; font-size: 10px; font-weight: 800; }
.material-dialog-title strong { display: block; font-size: 16px; }
.material-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }

.empty {
  color: #94a3b8;
  font-size: 12px;
  text-align: center;
  padding: 20px;
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.tree-header h4 {
  margin: 0;
  color: #134e4a;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.collapse-btn,
.expand-tree-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0f766e;
  transition: background 0.2s ease;
  border-radius: 3px;
}

.collapse-btn:hover,
.expand-tree-btn:hover {
  background: rgba(15, 118, 110, 0.1);
}

.expand-tree-btn {
  width: 100%;
  height: 100%;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 1100px) {
  .education-summary { grid-template-columns: repeat(3, 1fr); }
  .education-content { grid-template-columns: 220px 1fr; }
  .materials-panel { display: none; }
}
</style>
