<template>
  <v-container fluid class="super-admin-shell">
    <header class="admin-header">
      <div>
        <p class="eyebrow">Super Admin · Phase 13</p>
        <h1>Organizations &amp; Hierarchy</h1>
        <p class="header-copy">
          MINSANTE, regional delegations, districts and the facilities beneath them.
        </p>
      </div>
      <div class="header-actions">
        <v-btn tile depressed color="#003366" dark class="font-weight-black text-caption" @click="openOrgDialog()">
          <v-icon left small>mdi-domain-plus</v-icon>New organization
        </v-btn>
      </div>
    </header>

    <section class="layout-grid">
      <!-- Organizations list -->
      <article class="panel">
        <h2>Organizations</h2>
        <div v-if="!organizations.length" class="empty">No organization yet. Create MINSANTE (or a network) to start.</div>
        <button
          v-for="org in organizations"
          :key="org.id"
          type="button"
          class="org-row"
          :class="{ active: selectedOrgId === org.id }"
          @click="selectOrganization(org.id)"
        >
          <div>
            <strong>{{ org.name }}</strong>
            <span>{{ org.organizationType }}</span>
          </div>
          <v-chip x-small label :color="org.status === 'active' ? '#0f766e' : '#94a3b8'" dark class="font-weight-black">{{ org.status }}</v-chip>
        </button>
      </article>

      <!-- Unit tree for the selected organization -->
      <article class="panel">
        <div class="panel-head">
          <h2>Units — {{ selectedOrg ? selectedOrg.name : 'Select an organization' }}</h2>
          <v-btn v-if="selectedOrgId" x-small tile depressed color="#0f766e" dark class="font-weight-black" @click="openUnitDialog()">
            <v-icon left x-small>mdi-plus</v-icon>Add unit
          </v-btn>
        </div>
        <div v-if="selectedOrgId && !units.length" class="empty">No units yet — add a Regional Delegation or District.</div>
        <div v-for="unit in orderedUnits" :key="unit.id" class="unit-row" :style="{ paddingLeft: (unit.hierarchyLevel || 0) * 18 + 12 + 'px' }">
          <div>
            <v-icon x-small color="#003366">mdi-sitemap</v-icon>
            <strong>{{ unit.name }}</strong>
            <span class="unit-type">{{ unit.unitType }}</span>
          </div>
          <div class="unit-actions">
            <button type="button" @click="openUnitDialog(unit)">edit</button>
            <button type="button" class="danger" @click="removeUnit(unit)">remove</button>
          </div>
        </div>
      </article>

      <!-- Facilities attached to the selected organization -->
      <article class="panel">
        <h2>Attach a facility</h2>
        <p class="hint">Link an existing facility to this organization and, optionally, one of its units.</p>
        <v-select v-model="attachFacilityId" :items="facilityOptions" item-text="label" item-value="id" outlined dense hide-details label="Facility" class="mb-3"></v-select>
        <v-select v-model="attachUnitId" :items="units" item-text="name" item-value="id" outlined dense hide-details clearable label="Unit (optional)" class="mb-3"></v-select>
        <v-btn tile depressed color="#003366" dark class="font-weight-black text-caption" :disabled="!attachFacilityId" :loading="attaching" @click="attachFacility">
          Attach facility
        </v-btn>
      </article>
    </section>

    <!-- Facilities that already belong to the selected organization -->
    <section v-if="selectedOrgId" class="panel mt-4">
      <h2>Facilities — {{ selectedOrg ? selectedOrg.name : '' }}</h2>
      <p class="hint">Every facility this organization can see and coordinate, with the unit it reports through.</p>
      <div v-if="!orgFacilities.length" class="empty">No facility attached yet — use "Attach a facility" above.</div>
      <div v-else class="tbl-scroll">
        <table class="facility-table">
          <thead>
            <tr><th>Name</th><th>Code</th><th>Unit</th><th>Region / City</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr v-for="f in orgFacilities" :key="f.id">
              <td><strong>{{ f.name }}</strong></td>
              <td>{{ f.code }}</td>
              <td>{{ f.unitName || '—' }}</td>
              <td>{{ f.region }} · {{ f.city }}</td>
              <td><v-chip x-small label :color="f.status === 'active' ? '#0f766e' : '#94a3b8'" dark class="font-weight-black">{{ f.status }}</v-chip></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Login credentials for this organization's admins -->
    <section v-if="selectedOrgId" class="panel mt-4">
      <div class="panel-head">
        <h2>Admins — {{ selectedOrg ? selectedOrg.name : '' }}</h2>
        <v-btn x-small tile depressed color="#003366" dark class="font-weight-black" @click="openAdminDialog">
          <v-icon left x-small>mdi-account-key</v-icon>Create admin credentials
        </v-btn>
      </div>
      <p class="hint">Every account that can sign in and manage this organization or one of its units.</p>
      <div v-if="!orgAdmins.length" class="empty">No admin account yet — this organization cannot be managed by anyone but you.</div>
      <div v-else class="tbl-scroll">
        <table class="facility-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Unit</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr v-for="a in orgAdmins" :key="a.assignmentId">
              <td><strong>{{ a.staff.fullName }}</strong></td>
              <td>{{ a.staff.email }}</td>
              <td><v-chip x-small label color="#003366" dark class="font-weight-black">{{ a.role }}</v-chip></td>
              <td>{{ a.unitName || '—' }}</td>
              <td><v-chip x-small label :color="a.staff.status === 'active' ? '#0f766e' : '#94a3b8'" dark class="font-weight-black">{{ a.staff.status }}</v-chip></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Create admin dialog -->
    <v-dialog v-model="adminDialog" max-width="440">
      <v-card tile>
        <v-card-title class="font-weight-black">Create admin credentials</v-card-title>
        <v-card-text>
          <p class="hint">Creates a login for this organization (or one of its units) — separate from your own Super Admin account.</p>
          <v-text-field v-model="adminForm.fullName" outlined dense label="Full name"></v-text-field>
          <v-text-field v-model="adminForm.email" outlined dense label="Email"></v-text-field>
          <v-select v-model="adminForm.assignmentRole" :items="orgAdminRoles" outlined dense label="Role"></v-select>
          <v-select
            v-if="adminForm.assignmentRole !== 'ORG_ADMIN'"
            v-model="adminForm.organizationUnitId"
            :items="units" item-text="name" item-value="id"
            outlined dense label="Unit (required for this role)"
          ></v-select>
          <v-text-field v-model="adminForm.password" outlined dense label="Temporary password" :type="showAdminPwd ? 'text' : 'password'" :append-icon="showAdminPwd ? 'mdi-eye-off' : 'mdi-eye'" @click:append="showAdminPwd = !showAdminPwd"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="adminDialog = false">Cancel</v-btn>
          <v-btn color="#003366" dark depressed :loading="savingAdmin" @click="saveAdmin">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Organization dialog -->
    <v-dialog v-model="orgDialog" max-width="480">
      <v-card tile>
        <v-card-title class="font-weight-black">New organization</v-card-title>
        <v-card-text>
          <v-text-field v-model="orgForm.name" outlined dense label="Name (e.g. MINSANTE)"></v-text-field>
          <v-select v-model="orgForm.organizationType" :items="orgTypes" outlined dense label="Type"></v-select>
          <v-text-field v-model="orgForm.organizationCode" outlined dense label="Code (optional)"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="orgDialog = false">Cancel</v-btn>
          <v-btn color="#003366" dark depressed :loading="saving" @click="saveOrganization">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Unit dialog -->
    <v-dialog v-model="unitDialog" max-width="480">
      <v-card tile>
        <v-card-title class="font-weight-black">{{ unitForm.id ? 'Edit unit' : 'New unit' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="unitForm.name" outlined dense label="Name"></v-text-field>
          <v-select v-model="unitForm.unitType" :items="unitTypes" outlined dense label="Type"></v-select>
          <v-select v-model="unitForm.parentUnitId" :items="units" item-text="name" item-value="id" outlined dense clearable label="Parent unit (optional)"></v-select>
          <v-text-field v-model="unitForm.region" outlined dense label="Region (optional)"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="unitDialog = false">Cancel</v-btn>
          <v-btn color="#0f766e" dark depressed :loading="saving" @click="saveUnit">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { facilityApi } from '~/services/api'

export default {
  name: 'SuperAdminOrganizations',
  head: { title: 'Organizations & Hierarchy' },
  data() {
    return {
      selectedOrgId: null,
      orgDialog: false,
      unitDialog: false,
      saving: false,
      attaching: false,
      attachFacilityId: null,
      attachUnitId: null,
      facilities: [],
      adminDialog: false,
      savingAdmin: false,
      showAdminPwd: false,
      adminForm: { fullName: '', email: '', assignmentRole: 'ORG_ADMIN', organizationUnitId: null, password: '' },
      orgAdminRoles: ['ORG_ADMIN', 'REGIONAL_ADMIN', 'DISTRICT_ADMIN'],
      orgForm: { name: '', organizationType: 'PUBLIC_HEALTH_AUTHORITY', organizationCode: '' },
      unitForm: { id: null, name: '', unitType: 'DISTRICT', parentUnitId: null, region: '' },
      orgTypes: ['MINISTRY', 'PUBLIC_HEALTH_AUTHORITY', 'PRIVATE_NETWORK', 'NGO_NETWORK', 'OTHER'],
      unitTypes: ['NATIONAL', 'REGIONAL_DELEGATION', 'DISTRICT', 'CITY_CLUSTER', 'OTHER']
    }
  },
  computed: {
    ...mapState('organizations', ['organizations', 'units']),
    orgFacilities() { return this.$store.state.organizations.facilities },
    orgAdmins() { return this.$store.state.organizations.admins },
    selectedOrg() {
      return this.organizations.find(o => o.id === this.selectedOrgId) || null
    },
    orderedUnits() {
      return [...this.units].sort((a, b) => (a.hierarchyLevel || 0) - (b.hierarchyLevel || 0) || a.name.localeCompare(b.name))
    },
    facilityOptions() {
      return this.facilities.map(f => ({ id: f.id, label: `${f.name} (${f.code})` }))
    }
  },
  async mounted() {
    await this.fetchOrganizations()
    if (this.organizations.length) this.selectOrganization(this.organizations[0].id)
    try {
      const { data } = await facilityApi.list()
      this.facilities = data || []
    } catch (err) {
      this.$toast.error(err.response?.data?.error || err.message)
    }
  },
  methods: {
    ...mapActions('organizations', [
      'fetchOrganizations', 'createOrganization', 'fetchUnits', 'fetchFacilities', 'fetchAdmins', 'createAdmin', 'createUnit', 'updateUnit', 'removeUnit', 'attachFacility'
    ]),
    async selectOrganization(id) {
      this.selectedOrgId = id
      await Promise.all([this.fetchUnits(id), this.fetchFacilities(id), this.fetchAdmins(id)])
    },
    openAdminDialog() {
      this.adminForm = { fullName: '', email: '', assignmentRole: 'ORG_ADMIN', organizationUnitId: null, password: '' }
      this.adminDialog = true
    },
    async saveAdmin() {
      this.savingAdmin = true
      try {
        await this.createAdmin({ organizationId: this.selectedOrgId, ...this.adminForm })
        this.adminDialog = false
        this.$toast.success('Admin credentials created')
      } catch (err) {
        this.$toast.error(err.response?.data?.error || err.message)
      } finally {
        this.savingAdmin = false
      }
    },
    openOrgDialog() {
      this.orgForm = { name: '', organizationType: 'PUBLIC_HEALTH_AUTHORITY', organizationCode: '' }
      this.orgDialog = true
    },
    async saveOrganization() {
      this.saving = true
      try {
        const org = await this.createOrganization(this.orgForm)
        this.orgDialog = false
        if (org) await this.selectOrganization(org.id)
      } catch (err) {
        this.$toast.error(err.response?.data?.error || err.message)
      } finally {
        this.saving = false
      }
    },
    openUnitDialog(unit) {
      this.unitForm = unit
        ? { id: unit.id, name: unit.name, unitType: unit.unitType, parentUnitId: unit.parentUnitId, region: unit.region || '' }
        : { id: null, name: '', unitType: 'DISTRICT', parentUnitId: null, region: '' }
      this.unitDialog = true
    },
    async saveUnit() {
      this.saving = true
      try {
        if (this.unitForm.id) {
          await this.updateUnit({ organizationId: this.selectedOrgId, unitId: this.unitForm.id, ...this.unitForm })
        } else {
          await this.createUnit({ organizationId: this.selectedOrgId, ...this.unitForm })
        }
        this.unitDialog = false
      } catch (err) {
        this.$toast.error(err.response?.data?.error || err.message)
      } finally {
        this.saving = false
      }
    },
    async removeUnit(unit) {
      if (!window.confirm(`Remove unit "${unit.name}"?`)) return
      try {
        await this.$store.dispatch('organizations/removeUnit', { organizationId: this.selectedOrgId, unitId: unit.id })
      } catch (err) {
        this.$toast.error(err.response?.data?.error || err.message)
      }
    },
    async attachFacility() {
      this.attaching = true
      try {
        await this.$store.dispatch('organizations/attachFacility', {
          facilityId: this.attachFacilityId,
          organizationId: this.selectedOrgId,
          organizationUnitId: this.attachUnitId || null
        })
        await this.fetchFacilities(this.selectedOrgId)
        this.$toast.success('Facility attached')
      } catch (err) {
        this.$toast.error(err.response?.data?.error || err.message)
      } finally {
        this.attaching = false
      }
    }
  }
}
</script>

<style scoped>
.super-admin-shell { min-height: calc(100vh - 72px); padding: clamp(18px, 3vw, 32px); background: #f5f7f6; color: #15324a; }
.admin-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; margin-bottom: 18px; }
.eyebrow { margin: 0 0 6px; color: #0f766e; font-size: 11px; font-weight: 900; letter-spacing: 0.14em; text-transform: uppercase; }
h1, h2, p { margin-top: 0; }
h1 { margin-bottom: 8px; color: #0f2537; font-size: clamp(24px, 3.4vw, 34px); line-height: 1.08; }
.header-copy { margin-bottom: 0; color: #526b7c; font-weight: 700; }
.layout-grid { display: grid; grid-template-columns: 1fr 1.3fr 1fr; gap: 12px; align-items: start; }
.panel { background: #fff; border: 1px solid #dce6ec; border-radius: 8px; padding: 16px; }
.panel h2 { color: #0f2537; font-size: 15px; margin-bottom: 12px; }
.panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.empty { color: #94a3b8; font-size: 13px; font-weight: 700; padding: 12px 0; }
.hint { color: #94a3b8; font-size: 12px; margin-bottom: 12px; }
.org-row { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px; border: 1px solid #edf2f5; border-radius: 6px; margin-bottom: 6px; background: #fff; cursor: pointer; text-align: left; }
.org-row.active { border-color: #0f766e; background: #ecfdf5; }
.org-row strong { display: block; color: #0f2537; }
.org-row span { display: block; color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 800; }
.unit-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #edf2f5; }
.unit-row strong { margin-left: 6px; color: #0f2537; }
.unit-type { margin-left: 8px; color: #94a3b8; font-size: 10px; text-transform: uppercase; font-weight: 800; }
.unit-actions { display: flex; gap: 10px; }
.unit-actions button { border: 0; background: none; color: #0f766e; font-weight: 800; font-size: 11px; cursor: pointer; text-transform: uppercase; }
.unit-actions button.danger { color: #be123c; }
.tbl-scroll { overflow-x: auto; }
.facility-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.facility-table th { text-align: left; text-transform: uppercase; letter-spacing: 0.04em; font-size: 10px; color: #94a3b8; font-weight: 800; padding: 8px 10px; border-bottom: 1px solid #dce6ec; }
.facility-table td { padding: 8px 10px; border-bottom: 1px solid #edf2f5; color: #334155; }
.facility-table strong { color: #0f2537; }
@media (max-width: 1100px) { .layout-grid { grid-template-columns: 1fr; } }
</style>
