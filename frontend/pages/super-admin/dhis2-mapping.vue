<template>
  <v-container fluid class="super-admin-shell">
    <header class="admin-header">
      <div>
        <p class="eyebrow">Super Admin · DHIS2</p>
        <h1>DHIS2 Indicator Mapping</h1>
        <p class="header-copy">Connect an organization to its DHIS2 instance so its RMA submissions can be synced without re-keying.</p>
      </div>
    </header>

    <section class="panel">
      <v-select
        v-model="selectedOrgId"
        :items="organizations"
        item-text="name"
        item-value="id"
        outlined dense hide-details
        label="Organization"
        style="max-width: 360px"
        @change="loadMapping"
      ></v-select>
    </section>

    <section v-if="selectedOrgId" class="panel mt-4">
      <h2>Connection</h2>
      <v-row dense>
        <v-col cols="12" md="6">
          <v-text-field v-model="config.dhisBaseUrl" outlined dense label="DHIS2 base URL" placeholder="https://play.dhis2.org/demo" hide-details class="mb-3"></v-text-field>
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model="config.dhisUsername" outlined dense label="Username" hide-details class="mb-3"></v-text-field>
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model="config.dhisPassword" outlined dense type="password" :label="config.hasPassword ? 'Password (leave blank to keep current)' : 'Password'" hide-details class="mb-3"></v-text-field>
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field v-model="config.dhisOrgUnitId" outlined dense label="DHIS2 org unit ID" hint="The UID of the org unit RMA data should be attributed to" persistent-hint></v-text-field>
        </v-col>
      </v-row>
    </section>

    <section v-if="selectedOrgId" class="panel mt-4">
      <div class="d-flex align-center justify-space-between mb-3">
        <h2 class="mb-0">Indicator mapping</h2>
        <v-btn x-small tile outlined color="#003366" class="font-weight-black" @click="addMappingRow">
          <v-icon left x-small>mdi-plus</v-icon>Add indicator
        </v-btn>
      </div>
      <p class="hint">Map each RMA indicator key to the corresponding DHIS2 data element UID (and category option combo, if the data element requires one).</p>

      <div v-for="(mapping, idx) in config.mappings" :key="idx" class="mapping-row">
        <v-text-field v-model="mapping.indicatorKey" outlined dense hide-details label="RMA indicator key" placeholder="consultationsTotal" class="mr-2"></v-text-field>
        <v-text-field v-model="mapping.dhisDataElementId" outlined dense hide-details label="DHIS2 data element UID" class="mr-2"></v-text-field>
        <v-text-field v-model="mapping.dhisCategoryOptionComboId" outlined dense hide-details label="Category option combo (optional)" class="mr-2"></v-text-field>
        <v-btn icon small @click="config.mappings.splice(idx, 1)"><v-icon small color="#be123c">mdi-delete</v-icon></v-btn>
      </div>

      <v-btn tile depressed color="#00A99D" dark class="font-weight-black text-caption mt-4" :loading="saving" @click="save">
        Save configuration
      </v-btn>
    </section>
  </v-container>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { reportsApi } from '~/services/api'

export default {
  name: 'SuperAdminDhis2Mapping',
  head: { title: 'DHIS2 Mapping' },
  data() {
    return {
      selectedOrgId: null,
      saving: false,
      config: { dhisBaseUrl: '', dhisUsername: '', dhisPassword: '', dhisOrgUnitId: '', hasPassword: false, mappings: [] }
    }
  },
  computed: {
    ...mapState('organizations', ['organizations'])
  },
  async mounted() {
    await this.fetchOrganizations()
  },
  methods: {
    ...mapActions('organizations', ['fetchOrganizations']),
    async loadMapping() {
      if (!this.selectedOrgId) return
      try {
        const { data } = await reportsApi.getDhis2Mapping(this.selectedOrgId)
        this.config = {
          dhisBaseUrl: data.dhisBaseUrl || '',
          dhisUsername: data.dhisUsername || '',
          dhisPassword: '',
          dhisOrgUnitId: data.dhisOrgUnitId || '',
          hasPassword: data.hasPassword,
          mappings: (data.mappings || []).map(m => ({ ...m }))
        }
      } catch (err) {
        this.$toast.error(err.response?.data?.error || err.message)
      }
    },
    addMappingRow() {
      this.config.mappings.push({ indicatorKey: '', dhisDataElementId: '', dhisCategoryOptionComboId: '' })
    },
    async save() {
      this.saving = true
      try {
        const payload = {
          dhisBaseUrl: this.config.dhisBaseUrl || null,
          dhisUsername: this.config.dhisUsername || null,
          dhisOrgUnitId: this.config.dhisOrgUnitId || null,
          mappings: this.config.mappings.filter(m => m.indicatorKey && m.dhisDataElementId)
        }
        if (this.config.dhisPassword) payload.dhisPassword = this.config.dhisPassword
        await reportsApi.updateDhis2Mapping(this.selectedOrgId, payload)
        this.$toast.success('DHIS2 configuration saved')
        await this.loadMapping()
      } catch (err) {
        this.$toast.error(err.response?.data?.error || err.message)
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.super-admin-shell { min-height: calc(100vh - 72px); padding: clamp(18px, 3vw, 32px); background: #f5f7f6; color: #15324a; }
.admin-header { margin-bottom: 18px; }
.eyebrow { margin: 0 0 6px; color: #0f766e; font-size: 11px; font-weight: 900; letter-spacing: 0.14em; text-transform: uppercase; }
h1 { margin: 0 0 8px; color: #0f2537; font-size: clamp(24px, 3.4vw, 34px); line-height: 1.08; }
.header-copy { margin: 0; color: #526b7c; font-weight: 700; max-width: 640px; }
.panel { background: #fff; border: 1px solid #dce6ec; border-radius: 8px; padding: 16px; }
.panel h2 { color: #0f2537; font-size: 15px; margin-bottom: 12px; }
.hint { color: #94a3b8; font-size: 12px; margin-bottom: 12px; }
.mapping-row { display: flex; align-items: center; gap: 4px; margin-bottom: 8px; }
</style>
