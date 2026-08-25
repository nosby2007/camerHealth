<template>
  <v-container fluid class="gov-content pa-8">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6 flex-wrap" style="gap:12px">
      <div>
        <div class="text-caption font-weight-black grey--text text-uppercase ls-1 mb-1">ENTERPRISE HOSPITAL OPERATING MODEL</div>
        <h1 class="text-h4 font-weight-black gov-text-primary uppercase mb-1">{{ model.facilityDisplayName || 'Hospital Operating Model' }}</h1>
        <div class="text-caption grey--text font-weight-bold">Departments, wards & units, medical specialties, care leadership, patient workflows, and PHI governance</div>
      </div>
      <div class="d-flex align-center" style="gap:8px">
        <v-btn tile outlined color="#003366" class="font-weight-black text-caption" @click="resetToDefaults">
          <v-icon left small>mdi-refresh</v-icon>Reset English Defaults
        </v-btn>
        <v-btn tile depressed color="#00A99D" dark class="font-weight-black text-caption" @click="openAddDialog">
          <v-icon left small>mdi-plus</v-icon>Add Department
        </v-btn>
        <v-btn tile depressed color="#003366" dark class="font-weight-black text-caption" :loading="saving" @click="saveModel">
          <v-icon left small>mdi-content-save</v-icon>Save Model
        </v-btn>
      </div>
    </div>

    <!-- Metrics -->
    <v-row dense class="mb-6">
      <v-col v-for="metric in metrics" :key="metric.label" cols="12" sm="6" lg="3">
        <v-card flat tile class="gov-card b-1 pa-5 h-100 shadow-sm">
          <div class="d-flex align-center justify-space-between mb-4">
            <v-avatar tile size="38" :color="metric.color"><v-icon dark>{{ metric.icon }}</v-icon></v-avatar>
            <span class="text-h4 font-weight-black gov-text-primary">{{ metric.value }}</span>
          </div>
          <div class="text-caption font-weight-black grey--text text-uppercase ls-1">{{ metric.label }}</div>
          <div class="text-caption grey--text mt-1">{{ metric.helper }}</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Content -->
    <v-row>
      <v-col cols="12" lg="8">
        <!-- Departments Table -->
        <v-card flat tile class="gov-card b-1 shadow-sm mb-6 overflow-hidden">
          <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center flex-wrap" style="gap:10px">
            <v-icon color="#003366" small>mdi-hospital-building</v-icon>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">Departments, Wards & Units</span>
            <v-spacer />
            <v-select v-model="typeFilter" :items="typeFilters" hide-details dense outlined tile class="filter-control bg-white" label="Type"></v-select>
          </div>

          <v-data-table :headers="departmentHeaders" :items="filteredDepartments" class="gov-table" item-key="id" :items-per-page="10" tile elevation="0">
            <!-- Department Name & Location -->
            <template v-slot:item.name="{ item }">
              <div class="font-weight-black gov-text-primary text-uppercase">{{ item.name }}</div>
              <div class="text-caption grey--text font-weight-bold">{{ item.location }}</div>
            </template>

            <!-- Type -->
            <template v-slot:item.type="{ item }">
              <v-chip x-small dark label :color="typeColor(item.type)" class="font-weight-black text-uppercase">{{ item.type }}</v-chip>
            </template>

            <!-- Ward / Unit -->
            <template v-slot:item.wardUnit="{ item }">
              <div class="chip-wrap">
                <template v-if="wardUnits(item).length">
                  <v-chip v-for="svc in wardUnits(item)" :key="svc.id || svc.name" x-small label color="#E8F4FD" class="mr-1 mb-1 font-weight-bold" style="color:#003366">
                    <v-icon x-small left color="#003366">mdi-bed</v-icon>{{ svc.name }}
                  </v-chip>
                </template>
                <span v-else class="text-caption grey--text font-italic">None</span>
              </div>
            </template>

            <!-- Specialties -->
            <template v-slot:item.specialties="{ item }">
              <div class="chip-wrap">
                <v-chip v-for="specialty in (item.specialties || []).slice(0, 3)" :key="specialty" x-small label class="mr-1 mb-1 font-weight-bold">{{ specialty }}</v-chip>
                <v-chip v-if="(item.specialties || []).length > 3" x-small label color="#F3F4F6" class="font-weight-bold">+{{ item.specialties.length - 3 }}</v-chip>
              </div>
            </template>



            <!-- Actions -->
            <template v-slot:item.actions="{ item }">
              <div class="d-flex align-center justify-end" style="gap:4px">
                <v-btn icon small @click="selectDepartment(item)" color="#003366" title="Edit department">
                  <v-icon small>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon small @click="confirmDelete(item)" color="#C0392B" title="Delete department">
                  <v-icon small>mdi-delete</v-icon>
                </v-btn>
              </div>
            </template>
          </v-data-table>
        </v-card>

        <!-- Workflows -->
        <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
          <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center">
            <v-icon color="#0B3D2E" small class="mr-2">mdi-source-branch</v-icon>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">Hospital Workflows Touching Patient PHI</span>
          </div>
          <v-row dense class="pa-4">
            <v-col v-for="workflow in workflows" :key="workflow.id" cols="12" md="6">
              <div class="workflow-box pa-4 h-100">
                <div class="text-caption font-weight-black gov-text-primary text-uppercase mb-3">{{ workflow.name }}</div>
                <div class="workflow-steps">
                  <span v-for="stage in workflow.stages" :key="stage" class="workflow-step">{{ stage }}</span>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <!-- Sidebar Controls -->
      <v-col cols="12" lg="4">
        <!-- Executive Governance -->
        <v-card flat tile class="gov-card b-1 shadow-sm mb-6 overflow-hidden">
          <div class="pa-4 bg-navy white--text font-weight-black text-caption text-uppercase ls-1 d-flex align-center justify-space-between">
            <span>Governance Titles</span>
            <v-btn x-small text dark @click="editingGovernance = !editingGovernance">
              <v-icon x-small class="mr-1">mdi-pencil</v-icon>{{ editingGovernance ? 'Done' : 'Edit' }}
            </v-btn>
          </div>
          <div class="pa-5" v-if="!editingGovernance">
            <div v-for="row in governanceRows" :key="row.label" class="info-row">
              <span>{{ row.label }}</span><strong>{{ row.value }}</strong>
            </div>
          </div>
          <div class="pa-5" v-else>
            <v-text-field v-model="model.governance.administratorTitle" label="General Administration" dense outlined tile class="mb-2"></v-text-field>
            <v-text-field v-model="model.governance.medicalDirectorTitle" label="Medical Leadership" dense outlined tile class="mb-2"></v-text-field>
            <v-text-field v-model="model.governance.nursingDirectorTitle" label="Nursing Leadership" dense outlined tile class="mb-2"></v-text-field>
            <v-text-field v-model="model.governance.serviceLeadTitle" label="Department Head Title" dense outlined tile class="mb-2"></v-text-field>
            <v-text-field v-model="model.governance.headNurseTitle" label="Unit Head Nurse Title" dense outlined tile class="mb-2"></v-text-field>
            <v-btn block tile depressed color="#003366" dark class="font-weight-black text-caption" @click="saveGovernance">
              <v-icon left small>mdi-check</v-icon>Save Governance Titles
            </v-btn>
          </div>
        </v-card>

        <!-- Edit Selected Department -->
        <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
          <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon color="#003366" small class="mr-2">mdi-pencil-box</v-icon>
              <span class="text-caption font-weight-black grey--text text-uppercase ls-1">Edit Selected Department</span>
            </div>
            <v-btn v-if="draftDepartment" icon x-small @click="draftDepartment = null" color="grey">
              <v-icon small>mdi-close</v-icon>
            </v-btn>
          </div>

          <div class="pa-5" v-if="draftDepartment">
            <v-text-field v-model="draftDepartment.name" label="Department Name" dense outlined tile class="mb-2"></v-text-field>
            <v-text-field v-model="draftDepartment.location" label="Location / Building" dense outlined tile class="mb-2"></v-text-field>
            <v-select v-model="draftDepartment.type" :items="typeOptions" label="Department Type" dense outlined tile class="mb-2"></v-select>
            <v-text-field v-model="draftDepartment.leadRole" label="Department Head (Chef de Service)" dense outlined tile class="mb-2"></v-text-field>
            <v-text-field v-model="draftDepartment.headNurseRole" label="Nurse Manager (Major de Service)" dense outlined tile class="mb-2"></v-text-field>

            <v-textarea v-model="wardUnitsText" label="Wards / Units (one per line)" dense outlined tile rows="3"
              hint="Inpatient wards assigned to this department" persistent-hint class="mb-3"></v-textarea>

            <v-textarea v-model="specialtiesText" label="Specialties (one per line)" dense outlined tile rows="3"
              hint="Medical & clinical specialties" persistent-hint class="mb-3"></v-textarea>

            <div class="d-flex" style="gap:8px">
              <v-btn flex-grow-1 tile depressed color="#00A99D" dark class="font-weight-black text-caption" @click="updateDepartment">
                <v-icon left small>mdi-check</v-icon>Update Department
              </v-btn>
              <v-btn tile outlined color="#C0392B" class="font-weight-black text-caption" @click="confirmDelete(draftDepartment)">
                <v-icon small>mdi-delete</v-icon>
              </v-btn>
            </div>
          </div>

          <div v-else class="pa-8 text-center grey--text text-caption font-weight-bold">
            Select a department row using the <v-icon small color="#003366">mdi-pencil</v-icon> icon to modify its details, wards, or specialties anytime.
          </div>
        </v-card>
      </v-col>
    </v-row>


    <!-- Add Department Dialog -->
    <v-dialog v-model="showAddDialog" max-width="560px" persistent>
      <v-card tile class="b-1">
        <v-card-title class="bg-navy white--text font-weight-black text-subtitle-1 text-uppercase pa-4">
          <v-icon left dark color="#00A99D">mdi-plus-circle</v-icon>Add New Department
          <v-spacer />
          <v-btn icon dark x-small @click="showAddDialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text class="pa-6">
          <v-text-field v-model="newDept.name" label="Department Name *" dense outlined tile class="mb-2" :rules="[v => !!v || 'Required']"></v-text-field>
          <v-text-field v-model="newDept.location" label="Location / Building" dense outlined tile class="mb-2"></v-text-field>
          <v-select v-model="newDept.type" :items="typeOptions" label="Department Type *" dense outlined tile class="mb-2"></v-select>
          <v-text-field v-model="newDept.leadRole" label="Department Head Title" dense outlined tile class="mb-2" placeholder="e.g. Head of Cardiology"></v-text-field>
          <v-text-field v-model="newDept.headNurseRole" label="Nurse Manager Title" dense outlined tile class="mb-2" placeholder="e.g. Cardiology Nurse Manager"></v-text-field>

          <v-textarea v-model="newWardsText" label="Wards / Units (one per line)" dense outlined tile rows="2"
            placeholder="e.g. Cardiac Care Ward, ICU Unit" class="mb-2" hint="Creates inpatient units for patient admission" persistent-hint></v-textarea>

          <v-textarea v-model="newSpecialtiesText" label="Specialties (one per line)" dense outlined tile rows="2"
            placeholder="e.g. Cardiology, Electrophysiology" class="mb-2"></v-textarea>

        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4 bg-grey lighten-4 d-flex justify-end">
          <v-btn text tile class="font-weight-bold" @click="showAddDialog = false">Cancel</v-btn>
          <v-btn tile depressed color="#003366" dark class="font-weight-black" @click="addDepartment">
            <v-icon left small>mdi-plus</v-icon>Add Department
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="420px">
      <v-card tile class="b-1 pa-4">
        <v-card-title class="font-weight-black text-h6 red--text text--darken-2 pa-0 mb-3">
          Delete Department
        </v-card-title>
        <v-card-text class="pa-0 mb-4 text-body-2">
          Are you sure you want to delete <strong>{{ deptToDelete ? deptToDelete.name : '' }}</strong>? This action will remove its wards and specialties from the operating model.
        </v-card-text>
        <v-card-actions class="pa-0 d-flex justify-end" style="gap:8px">
          <v-btn text tile class="font-weight-bold" @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn tile depressed color="#C0392B" dark class="font-weight-black" @click="deleteSelectedDepartment">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
export default {
  head: { title: 'Hospital Operating Model' },
  data() {
    return {
      typeFilter: '',
      saving: false,
      draftDepartment: null,
      specialtiesText: '',
      wardUnitsText: '',
      editingGovernance: false,

      // Add Dialog state
      showAddDialog: false,
      newDept: { name: '', location: '', type: 'clinical', leadRole: '', headNurseRole: '' },
      newWardsText: '',
      newSpecialtiesText: '',

      // Delete Dialog state
      showDeleteDialog: false,
      deptToDelete: null,

      typeFilters: [
        { text: 'All Types', value: '' },
        { text: 'Clinical', value: 'clinical' },
        { text: 'Diagnostic', value: 'diagnostic' },
        { text: 'Support', value: 'support' },
        { text: 'Administrative', value: 'administrative' }
      ],
      typeOptions: ['clinical', 'diagnostic', 'support', 'administrative'],

      // Requested table column order: departments, ward/unit, specialties, leadership
      departmentHeaders: [
        { text: 'Department', value: 'name' },
        { text: 'Type', value: 'type', align: 'center' },
        { text: 'Ward / Unit', value: 'wardUnit' },
        { text: 'Specialties', value: 'specialties' },
        { text: 'Actions', value: 'actions', sortable: false, align: 'right' }
      ]
    }
  },
  async mounted() {
    await this.$store.dispatch('facility/fetchDepartments')
  },
  computed: {
    model() { return this.$store.getters['facility/getHospitalModel'] || {} },
    departments() { return this.$store.getters['facility/getDepartments'] || [] },
    workflows() { return this.$store.getters['facility/getWorkflowCatalog'] || [] },
    policies() { return this.$store.getters['facility/getPhiPolicies'] || {} },
    filteredDepartments() {
      if (!this.typeFilter) return this.departments
      return this.departments.filter(item => item.type === this.typeFilter)
    },
    metrics() {
      const wardCount = this.departments.reduce((total, d) => total + (d.services || []).filter(s => s.queueKey === 'inpatient').length, 0)
      return [
        { label: 'Departments', value: this.departments.length, helper: 'Clinical, diagnostic, support & admin', icon: 'mdi-domain', color: '#003366' },
        { label: 'Wards / Units', value: wardCount, helper: 'Inpatient wards and care units', icon: 'mdi-bed', color: '#00A99D' },
        { label: 'Specialties', value: this.$store.getters['facility/getSpecialties'].length, helper: 'Medical and administrative scopes', icon: 'mdi-stethoscope', color: '#0B3D2E' },
        { label: 'Workflows', value: this.workflows.length, helper: 'Patient pathways with PHI rules', icon: 'mdi-transit-connection-variant', color: '#D97706' }
      ]
    },
    governanceRows() {
      const governance = this.model.governance || {}
      return [
        { label: 'General Administration', value: governance.administratorTitle || 'General Director' },
        { label: 'Medical Leadership', value: governance.medicalDirectorTitle || 'Medical Director' },
        { label: 'Nursing Leadership', value: governance.nursingDirectorTitle || 'Chief Nursing Officer' },
        { label: 'Department Head Title', value: governance.serviceLeadTitle || 'Department Head' },
        { label: 'Unit Lead Title', value: governance.headNurseTitle || 'Head Nurse / Unit Manager' }
      ]
    }
  },
  methods: {
    typeColor(type) {
      return { clinical: '#0B3D2E', diagnostic: '#D97706', support: '#6D28D9', administrative: '#003366' }[type] || '#6B7280'
    },

    /** Filter inpatient ward/unit services for a department */
    wardUnits(department) {
      return department.wards || department.services || []
    },

    selectDepartment(department) {
      this.draftDepartment = JSON.parse(JSON.stringify(department))
      this.specialtiesText = (department.specialties || []).join('\n')
      this.wardUnitsText = (department.services || [])
        .map(s => (typeof s === 'string' ? s : s.name))
        .join('\n')
    },

    async updateDepartment() {
      if (!this.draftDepartment) return

      try {
        await this.$store.dispatch('facility/updateDepartment', {
          id: this.draftDepartment.id,
          name: this.draftDepartment.name,
          headOfDepartment: this.draftDepartment.leadRole || this.draftDepartment.headOfDepartment
        })
        this.$toast.success(`Department "${this.draftDepartment.name}" updated successfully.`)
      } catch (err) {
        this.$toast.error(err.message || 'Failed to update department.')
      }
    },

    openAddDialog() {
      this.newDept = { name: '', location: '', type: 'clinical', leadRole: '', headNurseRole: '' }
      this.newWardsText = ''
      this.newSpecialtiesText = ''
      this.showAddDialog = true
    },

    async addDepartment() {
      if (!this.newDept.name.trim()) {
        this.$toast.error('Department name is required.')
        return
      }

      try {
        const code = this.newDept.name.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 15)
        await this.$store.dispatch('facility/createDepartment', {
          code,
          name: this.newDept.name.trim(),
          headOfDepartment: this.newDept.leadRole.trim() || null
        })
        this.$toast.success(`Department "${this.newDept.name}" added to database.`)
        this.showAddDialog = false
      } catch (err) {
        this.$toast.error(err.message || 'Failed to create department.')
      }
    },

    confirmDelete(dept) {
      this.deptToDelete = dept
      this.showDeleteDialog = true
    },

    async deleteSelectedDepartment() {
      if (!this.deptToDelete) return
      try {
        await this.$store.dispatch('facility/deleteDepartment', this.deptToDelete.id)
        this.$toast.success(`Department "${this.deptToDelete.name}" removed.`)
        if (this.draftDepartment && this.draftDepartment.id === this.deptToDelete.id) {
          this.draftDepartment = null
        }
      } catch (err) {
        this.$toast.error(err.message || 'Failed to delete department.')
      } finally {
        this.showDeleteDialog = false
        this.deptToDelete = null
      }
    },

    saveGovernance() {
      this.editingGovernance = false
      this.saveModel()
    },

    async resetToDefaults() {
      await this.$store.dispatch('facility/resetHospitalModel')
      this.draftDepartment = null
      this.$toast.info('Hospital operating model reset to English defaults.')
    },

    async saveModel() {
      this.saving = true
      try {
        await this.$store.dispatch('facility/saveHospitalModel', this.model)
        this.$toast.success('Hospital operating model saved successfully.')
      } finally {
        setTimeout(() => { this.saving = false }, 600)
      }
    }
  }
}
</script>

<style scoped>
.gov-card { background: white !important; }
.bg-navy { background: #003366 !important; }
.gov-text-primary { color: #1B1F23 !important; }
.border-bottom { border-bottom: 1px solid #E5E7EB; }
.ls-1 { letter-spacing: 0.8px !important; }
.uppercase { text-transform: uppercase; }
.h-100 { height: 100%; }
.b-1 { border: 1px solid #E5E7EB; }
.shadow-sm { box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }
.filter-control { max-width: 190px; }
.bg-white { background: white !important; }
.info-row { display:flex; justify-content:space-between; gap:16px; padding:10px 0; border-bottom:1px solid #EEF2F7; font-size:12px; }
.info-row span { color:#6B7280; font-weight:800; text-transform:uppercase; }
.info-row strong { color:#1B1F23; text-align:right; }
.workflow-box { border:1px solid #E5E7EB; background:#FFFFFF; }
.workflow-steps { display:flex; flex-wrap:wrap; gap:6px; }
.workflow-step { font-size:11px; font-weight:800; color:#1B1F23; background:#F3F4F6; border:1px solid #E5E7EB; padding:5px 7px; }
.chip-wrap { max-width:260px; }
.gov-table { background: white !important; }
.gov-table ::v-deep th { background:#F8FAFC !important; color:#1B1F23 !important; font-size:10px !important; font-weight:800; text-transform:uppercase; }
</style>
