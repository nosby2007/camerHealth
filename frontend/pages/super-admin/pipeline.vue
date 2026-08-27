<template>
  <v-container fluid class="super-admin-shell">
    <header class="admin-header">
      <div>
        <p class="eyebrow">Super Admin · Commercial</p>
        <h1>Sales Pipeline</h1>
        <p class="header-copy">Prospects to signed customers — the vendor's own CRM, separate from any clinical workspace.</p>
      </div>
      <div class="header-actions">
        <v-btn tile depressed color="#003366" dark class="font-weight-black text-caption" @click="openNewLead">
          <v-icon left small>mdi-account-plus</v-icon>New lead
        </v-btn>
      </div>
    </header>

    <div class="board">
      <section v-for="stage in stages" :key="stage" class="column">
        <div class="column-head">
          <span>{{ stageLabel(stage) }}</span>
          <em>{{ byStage(stage).length }}</em>
        </div>
        <div class="column-body">
          <button v-for="lead in byStage(stage)" :key="lead.id" type="button" class="lead-card" @click="openLead(lead)">
            <strong>{{ lead.organizationName }}</strong>
            <span>{{ lead.contactName }}</span>
            <div class="lead-meta">
              <span v-if="lead.region">{{ lead.region }}</span>
              <span v-if="lead.estimatedValue" class="value">{{ formatMoney(lead.estimatedValue, lead.currency) }}</span>
            </div>
          </button>
          <div v-if="!byStage(stage).length" class="empty">—</div>
        </div>
      </section>
    </div>

    <!-- New lead dialog -->
    <v-dialog v-model="newDialog" max-width="480">
      <v-card tile>
        <v-card-title class="font-weight-black">New lead</v-card-title>
        <v-card-text>
          <v-text-field v-model="newForm.organizationName" outlined dense label="Facility / organization name"></v-text-field>
          <v-text-field v-model="newForm.contactName" outlined dense label="Contact name"></v-text-field>
          <v-text-field v-model="newForm.contactEmail" outlined dense label="Contact email"></v-text-field>
          <v-text-field v-model="newForm.contactPhone" outlined dense label="Contact phone"></v-text-field>
          <v-select v-model="newForm.facilityType" :items="facilityTypes" outlined dense label="Facility type" clearable></v-select>
          <div class="d-flex" style="gap:10px">
            <v-text-field v-model="newForm.region" outlined dense label="Region"></v-text-field>
            <v-text-field v-model="newForm.city" outlined dense label="City"></v-text-field>
          </div>
          <v-text-field v-model.number="newForm.estimatedValue" type="number" outlined dense label="Estimated value (XAF)"></v-text-field>
          <v-select v-model="newForm.source" :items="sources" outlined dense label="Source" clearable></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="newDialog = false">Cancel</v-btn>
          <v-btn color="#003366" dark depressed :loading="saving" @click="saveNewLead">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Lead detail dialog -->
    <v-dialog v-model="detailDialog" max-width="640" scrollable>
      <v-card v-if="current" tile>
        <v-card-title class="d-flex justify-space-between align-center">
          <span class="font-weight-black">{{ current.organizationName }}</span>
          <v-chip x-small label :color="stageColor(current.stage)" dark class="font-weight-black">{{ stageLabel(current.stage) }}</v-chip>
        </v-card-title>
        <v-card-text style="max-height: 70vh">
          <div class="detail-grid">
            <v-text-field v-model="editForm.contactName" outlined dense label="Contact name"></v-text-field>
            <v-text-field v-model="editForm.contactEmail" outlined dense label="Contact email"></v-text-field>
            <v-text-field v-model="editForm.contactPhone" outlined dense label="Contact phone"></v-text-field>
            <v-text-field v-model.number="editForm.quoteAmount" type="number" outlined dense label="Quote amount (XAF)"></v-text-field>
            <v-text-field v-model.number="editForm.contractValue" type="number" outlined dense label="Contract value (XAF)"></v-text-field>
            <v-text-field v-model="editForm.renewalDate" outlined dense label="Renewal date" type="date"></v-text-field>
          </div>
          <v-btn small tile outlined color="#003366" class="font-weight-black text-caption mb-4" :loading="saving" @click="saveEdit">
            Save details
          </v-btn>

          <div class="stage-actions">
            <span class="text-caption font-weight-black grey--text uppercase">Move to</span>
            <v-btn
              v-for="s in stages" :key="s"
              x-small tile
              :outlined="current.stage !== s"
              :color="stageColor(s)"
              :dark="current.stage === s"
              class="font-weight-black"
              @click="moveStage(s)"
            >{{ stageLabel(s) }}</v-btn>
          </div>

          <v-alert v-if="current.stage === 'SIGNED' && !current.convertedFacilityId" dense text type="success" class="mt-4">
            Signed — ready to become a real facility.
            <div class="d-flex mt-2" style="gap:8px">
              <v-text-field v-model="convertForm.facilityCode" outlined dense hide-details label="Facility code"></v-text-field>
              <v-text-field v-model="convertForm.facilityEmail" outlined dense hide-details label="Facility email"></v-text-field>
              <v-btn small tile depressed color="#0f766e" dark :loading="converting" @click="convert">Convert</v-btn>
            </div>
          </v-alert>
          <v-alert v-if="current.convertedFacilityId" dense text type="info" class="mt-4">
            Converted to a facility record. Onboard staff via Staff Access.
          </v-alert>

          <v-divider class="my-4"></v-divider>

          <div class="d-flex mb-3" style="gap:8px">
            <v-textarea v-model="noteBody" outlined dense rows="2" label="Add a note / call / email log" hide-details></v-textarea>
            <v-btn small tile depressed color="#003366" dark :loading="addingNote" @click="addNote">Log</v-btn>
          </div>

          <div v-for="activity in current.activities" :key="activity.id" class="activity-row">
            <span class="activity-type">{{ activity.type }}</span>
            <span v-if="activity.fromStage || activity.toStage">{{ activity.fromStage || '—' }} → {{ activity.toStage }}</span>
            <span v-if="activity.body">{{ activity.body }}</span>
            <em>{{ formatDate(activity.createdAt) }}</em>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="detailDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'

const STAGE_LABELS = {
  NEW: 'New', CONTACTED: 'Contacted', DEMO_SCHEDULED: 'Demo scheduled', DEMO_DONE: 'Demo done',
  PROPOSAL_SENT: 'Proposal sent', NEGOTIATION: 'Negotiation', SIGNED: 'Signed', LOST: 'Lost'
}
const STAGE_COLORS = {
  NEW: '#94a3b8', CONTACTED: '#0369a1', DEMO_SCHEDULED: '#7c3aed', DEMO_DONE: '#7c3aed',
  PROPOSAL_SENT: '#d97706', NEGOTIATION: '#d97706', SIGNED: '#0f766e', LOST: '#be123c'
}

export default {
  name: 'SuperAdminPipeline',
  head: { title: 'Sales Pipeline' },
  data() {
    return {
      newDialog: false,
      detailDialog: false,
      saving: false,
      converting: false,
      addingNote: false,
      noteBody: '',
      newForm: { organizationName: '', contactName: '', contactEmail: '', contactPhone: '', facilityType: '', region: '', city: '', estimatedValue: null, source: '' },
      editForm: {},
      convertForm: { facilityCode: '', facilityEmail: '' },
      facilityTypes: ['Hospital', 'CMA', 'Health Center', 'Private Clinic', 'Community Center'],
      sources: ['Referral', 'Website', 'Cold outreach', 'MINSANTE introduction', 'Conference / event']
    }
  },
  computed: {
    ...mapState('leads', ['leads', 'stages', 'current']),
    ...mapGetters('leads', ['byStage'])
  },
  async mounted() {
    await this.fetchLeads()
  },
  methods: {
    ...mapActions('leads', ['fetchLeads', 'fetchLead', 'createLead', 'updateLead', 'changeStage', 'addActivity', 'convertLead']),
    stageLabel(s) { return STAGE_LABELS[s] || s },
    stageColor(s) { return STAGE_COLORS[s] || '#94a3b8' },
    formatMoney(v, currency) { return `${Math.round(v).toLocaleString()} ${currency || 'XAF'}` },
    formatDate(iso) { return new Date(iso).toLocaleString() },
    openNewLead() {
      this.newForm = { organizationName: '', contactName: '', contactEmail: '', contactPhone: '', facilityType: '', region: '', city: '', estimatedValue: null, source: '' }
      this.newDialog = true
    },
    async saveNewLead() {
      this.saving = true
      try {
        await this.createLead(this.newForm)
        this.newDialog = false
      } catch (err) {
        this.$toast.error(err.response?.data?.error || err.message)
      } finally {
        this.saving = false
      }
    },
    async openLead(lead) {
      await this.fetchLead(lead.id)
      this.editForm = {
        contactName: this.current.contactName,
        contactEmail: this.current.contactEmail,
        contactPhone: this.current.contactPhone,
        quoteAmount: this.current.quoteAmount,
        contractValue: this.current.contractValue,
        renewalDate: this.current.renewalDate ? this.current.renewalDate.slice(0, 10) : ''
      }
      this.convertForm = { facilityCode: '', facilityEmail: this.current.contactEmail || '' }
      this.detailDialog = true
    },
    async saveEdit() {
      this.saving = true
      try {
        await this.updateLead({ id: this.current.id, ...this.editForm })
        await this.fetchLead(this.current.id)
      } catch (err) {
        this.$toast.error(err.response?.data?.error || err.message)
      } finally {
        this.saving = false
      }
    },
    async moveStage(stage) {
      if (stage === this.current.stage) return
      let lostReason = ''
      if (stage === 'LOST') {
        lostReason = window.prompt('Reason lost (optional):') || ''
      }
      try {
        await this.changeStage({ id: this.current.id, stage, lostReason })
        await this.fetchLead(this.current.id)
      } catch (err) {
        this.$toast.error(err.response?.data?.error || err.message)
      }
    },
    async addNote() {
      if (!this.noteBody.trim()) return
      this.addingNote = true
      try {
        await this.addActivity({ id: this.current.id, type: 'note', body: this.noteBody })
        this.noteBody = ''
      } catch (err) {
        this.$toast.error(err.response?.data?.error || err.message)
      } finally {
        this.addingNote = false
      }
    },
    async convert() {
      this.converting = true
      try {
        await this.convertLead({ id: this.current.id, ...this.convertForm })
        this.$toast.success('Converted to a facility record')
        await this.fetchLead(this.current.id)
      } catch (err) {
        this.$toast.error(err.response?.data?.error || err.message)
      } finally {
        this.converting = false
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
.header-copy { margin: 0; color: #526b7c; font-weight: 700; }
.board { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 12px; }
.column { flex: 0 0 220px; background: #eef2f4; border-radius: 8px; display: flex; flex-direction: column; max-height: calc(100vh - 200px); }
.column-head { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em; color: #526b7c; border-bottom: 1px solid #dce6ec; }
.column-body { padding: 8px; overflow-y: auto; flex: 1; }
.lead-card { width: 100%; text-align: left; display: block; background: #fff; border: 1px solid #dce6ec; border-radius: 6px; padding: 10px; margin-bottom: 8px; cursor: pointer; }
.lead-card strong { display: block; color: #0f2537; font-size: 13px; }
.lead-card span { display: block; color: #526b7c; font-size: 11px; }
.lead-meta { display: flex; justify-content: space-between; margin-top: 6px; font-size: 10px; }
.lead-meta .value { font-weight: 900; color: #0f766e; }
.empty { color: #cbd5e1; font-size: 12px; text-align: center; padding: 10px 0; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 10px; }
.stage-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 8px; }
.activity-row { display: flex; flex-wrap: wrap; gap: 8px; padding: 8px 0; border-bottom: 1px solid #edf2f5; font-size: 12px; }
.activity-type { text-transform: uppercase; font-weight: 900; color: #0f766e; font-size: 10px; }
.activity-row em { margin-left: auto; color: #94a3b8; font-size: 10px; }
</style>
