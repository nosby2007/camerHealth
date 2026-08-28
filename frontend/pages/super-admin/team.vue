<template>
  <v-container fluid class="super-admin-shell">
    <header class="admin-header">
      <div>
        <p class="eyebrow">Super Admin · Team</p>
        <h1>Internal Team Access</h1>
        <p class="header-copy">Sales and support accounts for the CameroHealth team — separate from any clinical or facility role.</p>
      </div>
      <div class="header-actions">
        <v-btn tile depressed color="#003366" dark class="font-weight-black text-caption" @click="openInvite">
          <v-icon left small>mdi-account-plus</v-icon>Invite team member
        </v-btn>
      </div>
    </header>

    <div class="tbl-scroll">
      <v-data-table :headers="headers" :items="team" item-key="assignmentId" class="gov-table" tile elevation="0" :loading="loading">
        <template v-slot:item.fullName="{ item }">
          <strong>{{ item.staff.fullName }}</strong>
        </template>
        <template v-slot:item.role="{ item }">
          <v-chip x-small label :color="item.role === 'SALES' ? '#0f766e' : '#7c3aed'" dark class="font-weight-black">{{ item.role }}</v-chip>
        </template>
        <template v-slot:item.status="{ item }">
          <v-chip x-small label :color="item.staff.status === 'active' ? '#0f766e' : '#94a3b8'" dark class="font-weight-black">{{ item.staff.status }}</v-chip>
        </template>
        <template v-slot:item.actions="{ item }">
          <v-btn x-small text :color="item.staff.status === 'active' ? '#be123c' : '#0f766e'" class="font-weight-black" @click="toggleStatus(item)">
            {{ item.staff.status === 'active' ? 'Deactivate' : 'Reactivate' }}
          </v-btn>
        </template>
      </v-data-table>
    </div>

    <v-dialog v-model="inviteDialog" max-width="440">
      <v-card tile>
        <v-card-title class="font-weight-black">Invite team member</v-card-title>
        <v-card-text>
          <v-text-field v-model="form.fullName" outlined dense label="Full name"></v-text-field>
          <v-text-field v-model="form.email" outlined dense label="Email"></v-text-field>
          <v-select v-model="form.role" :items="['SALES', 'SUPPORT']" outlined dense label="Role"></v-select>
          <v-text-field v-model="form.password" outlined dense label="Temporary password" :type="showPwd ? 'text' : 'password'" :append-icon="showPwd ? 'mdi-eye-off' : 'mdi-eye'" @click:append="showPwd = !showPwd"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="inviteDialog = false">Cancel</v-btn>
          <v-btn color="#003366" dark depressed :loading="saving" @click="invite">Invite</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { platformApi } from '~/services/api'

export default {
  name: 'SuperAdminTeam',
  head: { title: 'Internal Team Access' },
  data() {
    return {
      team: [],
      loading: true,
      inviteDialog: false,
      saving: false,
      showPwd: false,
      form: { fullName: '', email: '', role: 'SALES', password: '' },
      headers: [
        { text: 'Name', value: 'fullName' },
        { text: 'Role', value: 'role' },
        { text: 'Status', value: 'status' },
        { text: '', value: 'actions', sortable: false }
      ]
    }
  },
  async mounted() {
    await this.load()
  },
  methods: {
    async load() {
      this.loading = true
      try {
        const { data } = await platformApi.listTeam()
        this.team = data.team || []
      } catch (err) {
        this.$toast.error(err.response?.data?.error || err.message)
      } finally {
        this.loading = false
      }
    },
    openInvite() {
      this.form = { fullName: '', email: '', role: 'SALES', password: '' }
      this.inviteDialog = true
    },
    async invite() {
      this.saving = true
      try {
        await platformApi.inviteTeamMember(this.form)
        this.inviteDialog = false
        await this.load()
        this.$toast.success('Team member invited')
      } catch (err) {
        this.$toast.error(err.response?.data?.error || err.message)
      } finally {
        this.saving = false
      }
    },
    async toggleStatus(item) {
      const next = item.staff.status === 'active' ? 'inactive' : 'active'
      try {
        await platformApi.setTeamMemberStatus(item.staff.id, next)
        await this.load()
      } catch (err) {
        this.$toast.error(err.response?.data?.error || err.message)
      }
    }
  }
}
</script>

<style scoped>
.super-admin-shell { min-height: calc(100vh - 72px); padding: clamp(18px, 3vw, 32px); background: #f5f7f6; color: #15324a; }
.admin-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; margin-bottom: 18px; }
.eyebrow { margin: 0 0 6px; color: #0f766e; font-size: 11px; font-weight: 900; letter-spacing: 0.14em; text-transform: uppercase; }
h1 { margin: 0 0 8px; color: #0f2537; font-size: clamp(24px, 3.4vw, 34px); line-height: 1.08; }
.header-copy { margin: 0; color: #526b7c; font-weight: 700; max-width: 60ch; }
.tbl-scroll { overflow-x: auto; background: #fff; border: 1px solid #dce6ec; border-radius: 8px; }
</style>
