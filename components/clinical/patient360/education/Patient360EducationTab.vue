<template>
  <div class="education-workspace">
    <!-- Toolbar -->
    <div class="education-toolbar">
      <div class="toolbar-actions">
        <v-btn x-small depressed color="#0f766e" dark @click="showAddTitleDialog = true">
          <v-icon x-small left>mdi-plus</v-icon>Add Title
        </v-btn>
        <v-btn x-small text @click="showAddPointDialog = true">
          <v-icon x-small left>mdi-plus</v-icon>Add Point
        </v-btn>
      </div>

      <div class="toolbar-controls">
        <v-checkbox v-model="showActive" dense label="Active Only" class="mt-0" />
        <v-checkbox v-model="hideDescriptions" dense label="Hide Descriptions" class="mt-0" />
      </div>
    </div>

    <!-- Main Content -->
    <div class="education-content" :class="{ 'tree-collapsed': treeCollapsed }">
      <!-- Left: Education Tree -->
      <div class="education-tree-panel" v-if="!treeCollapsed">
        <div class="tree-header">
          <h4>Topics</h4>
          <button class="collapse-btn" @click="treeCollapsed = true" title="Collapse sidebar">
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
      <button v-else class="expand-tree-btn" @click="treeCollapsed = false" title="Expand sidebar">
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
              @add-material="showAddMaterialDialog = true"
            />
          </div>
        </div>
        <div v-else class="empty">
          Select an education title to view points.
        </div>
      </div>

      <!-- Right: Patient Materials -->
      <div class="materials-panel">
        <h4>Patient Materials</h4>
        <v-btn x-small text color="#0f766e" @click="showAddMaterialDialog = true">
          <v-icon x-small left>mdi-plus</v-icon>Add Material
        </v-btn>

        <div class="materials-list">
          <div v-for="assignment in assignedMaterials" :key="assignment.id" class="material-item">
            <span class="material-title">{{ assignment.material?.title }}</span>
            <v-btn x-small icon @click="removeMaterialFromAvs(assignment.id)">
              <v-icon x-small>mdi-close</v-icon>
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <v-dialog v-model="showAddTitleDialog" max-width="400">
      <v-card>
        <v-card-title>Add Education Title</v-card-title>
        <v-card-text>
          <v-text-field v-model="newTitle" label="Title" outlined dense />
          <v-select v-model="newCategory" label="Category" :items="categories" outlined dense />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text small @click="showAddTitleDialog = false">Cancel</v-btn>
          <v-btn depressed color="#0f766e" dark small @click="addTitle">Add</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showAddPointDialog" max-width="400">
      <v-card>
        <v-card-title>Add Education Point</v-card-title>
        <v-card-text>
          <v-select v-model="newPointTitleId" label="Title" :items="titles" item-text="title" item-value="id" outlined dense />
          <v-text-field v-model="newPointLabel" label="Label" outlined dense />
          <v-text-field v-model="newPointTopic" label="Topic" outlined dense />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text small @click="showAddPointDialog = false">Cancel</v-btn>
          <v-btn depressed color="#0f766e" dark small @click="addPoint">Add</v-btn>
        </v-card-actions>
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
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true },
    admissionId: { type: String, default: '' },
    role: { type: String, default: '' }
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
      categories: ['general', 'infection', 'safety', 'wound', 'discharge', 'pain', 'nutrition'],
      treeCollapsed: false
    }
  },
  computed: {
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
    }
  },
  methods: {
    addTitle() {
      this.$store.dispatch('education/addEducationTitle', {
        patientId: this.patientId,
        encounterId: this.encounterId,
        admissionId: this.admissionId,
        title: this.newTitle,
        category: this.newCategory
      })
      this.showAddTitleDialog = false
      this.newTitle = ''
      this.$toast?.success('Title added')
    },
    addPoint() {
      this.$store.dispatch('education/addEducationPoint', {
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
      this.$toast?.success('Point added')
    },
    documentPoint(point) {
      this.selectedPointId = point.id
      this.showDocumentDialog = true
    },
    async fileEducation(data) {
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
      this.$toast?.success('Education documented')
    },
    removeMaterialFromAvs(assignmentId) {
      this.$store.dispatch('education/removeMaterialFromAvs', {
        assignmentId,
        patientId: this.patientId
      })
      this.$toast?.success('Material removed')
    }
  },
  mounted() {
    this.$store.dispatch('education/initializeEducationForPatient', {
      patientId: this.patientId,
      encounterId: this.encounterId,
      admissionId: this.admissionId
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
</style>
