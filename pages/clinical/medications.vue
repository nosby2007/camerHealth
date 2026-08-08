<template>
  <v-container fluid class="pa-0 fill-height rx-bg">
    <v-row no-gutters class="fill-height">

      <!-- ── LEFT: Prescription Queue ───────────────────────── -->
      <v-col cols="12" md="4" lg="3" class="worklist-panel b-right d-flex flex-column">
        <div class="pa-4 bg-navy white--text d-flex align-center justify-space-between">
          <div>
            <div class="text-caption font-weight-black ls-1 opacity-75">PHYSICIAN WORKLIST</div>
            <div class="text-subtitle-2 font-weight-black">PRESCRIPTIONS</div>
          </div>
          <v-avatar tile color="rgba(255,255,255,0.15)" size="36">
            <v-icon dark small>mdi-prescription</v-icon>
          </v-avatar>
        </div>

        <!-- Create New Prescription -->
        <div class="pa-3 bg-grey lighten-4 b-bottom">
          <v-btn color="#003366" dark block tile height="38" depressed class="font-weight-black text-caption" @click="openNewRxDialog()">
            <v-icon left small>mdi-plus-circle</v-icon> WRITE NEW PRESCRIPTION
          </v-btn>
        </div>

        <!-- Filters -->
        <div class="pa-3 b-bottom bg-white">
          <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="Search patient or drug..." outlined tile dense hide-details class="rounded-0 mb-2"></v-text-field>
          <div class="d-flex" style="gap:6px">
            <v-btn v-for="f in statusFilters" :key="f.value" x-small tile depressed
              :color="statusFilter === f.value ? '#003366' : '#F1F5F9'"
              :dark="statusFilter === f.value"
              class="font-weight-black text-caption flex-grow-1"
              @click="statusFilter = f.value">{{ f.label }}</v-btn>
          </div>
        </div>

        <!-- Prescription List -->
        <div class="flex-grow-1 overflow-y-auto">
          <div v-for="rx in filteredRx" :key="rx.id"
            :class="['worklist-item pa-4 b-bottom', selectedRx && selectedRx.id === rx.id ? 'worklist-item--active' : '']"
            @click="selectRx(rx)">
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="text-caption font-weight-black gov-text-primary uppercase">{{ rx.patientName }}</span>
              <v-chip x-small dark label :color="statusColor(rx.dispensingStatus || rx.status)" class="font-weight-black">
                {{ rx.dispensingStatus || rx.status }}
              </v-chip>
            </div>
            <div class="text-caption grey--text mb-1">{{ rx.medication }}</div>
            <div class="d-flex align-center justify-space-between">
              <span class="text-caption grey--text" style="font-size:10px">{{ rx.dosage }} · {{ rx.frequency }}</span>
              <div class="d-flex align-center" style="gap:4px">
                <v-icon x-small :color="rx.paymentStatus === 'Paid' ? '#00A99D' : 'orange'">
                  {{ rx.paymentStatus === 'Paid' ? 'mdi-cash-check' : 'mdi-cash-clock' }}
                </v-icon>
                <span class="text-caption" :class="rx.paymentStatus === 'Paid' ? 'success--text' : 'orange--text'" style="font-size:9px;font-weight:800">
                  {{ rx.paymentStatus === 'Paid' ? 'PAID' : 'UNPAID' }}
                </span>
              </div>
            </div>
            <div class="text-caption grey--text mt-1" style="font-size:10px">{{ rx.prescribedAt }} · {{ rx.prescribedBy }}</div>
          </div>
          <div v-if="filteredRx.length === 0" class="pa-8 text-center grey--text text-caption">
            <v-icon size="40" color="#E2E8F0" class="mb-2 d-block">mdi-prescription</v-icon>
            No prescriptions found
          </div>
        </div>
      </v-col>

      <!-- ── RIGHT: Prescription Detail & Tracking ────────────── -->
      <v-col cols="12" md="8" lg="9" class="d-flex flex-column">
        <div v-if="!selectedRx" class="fill-height d-flex align-center justify-center">
          <div class="text-center grey--text">
            <v-icon size="72" color="#E2E8F0">mdi-prescription</v-icon>
            <div class="text-caption font-weight-black mt-4 uppercase ls-1">Select or create a prescription</div>
            <v-btn color="#003366" dark tile depressed class="mt-4 font-weight-black text-caption" @click="openNewRxDialog()">
              <v-icon left small>mdi-plus</v-icon>WRITE PRESCRIPTION
            </v-btn>
          </div>
        </div>

        <template v-else>
          <!-- Header -->
          <div class="pa-6 bg-white b-bottom">
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="section-label mb-1">PRESCRIPTION — {{ selectedRx.id }}</div>
                <div class="text-h6 font-weight-black gov-text-primary uppercase">{{ selectedRx.medication }}</div>
                <div class="text-caption grey--text mt-1">
                  Patient: <strong>{{ selectedRx.patientName }}</strong> ({{ selectedRx.patientId }})
                  · Prescribed by: <strong>{{ selectedRx.prescribedBy }}</strong>
                  · {{ selectedRx.prescribedAt }}
                </div>
              </div>
              <div class="d-flex align-center" style="gap:8px">
                <v-btn x-small outlined tile color="#003366" class="font-weight-black text-caption" :to="`/clinical/patients/${selectedRx.patientId}`">
                  <v-icon left x-small>mdi-account</v-icon>VIEW PATIENT 360
                </v-btn>
                <v-chip label :color="statusColor(selectedRx.dispensingStatus || selectedRx.status)" dark class="font-weight-black">
                  {{ selectedRx.dispensingStatus || selectedRx.status }}
                </v-chip>
              </div>
            </div>
          </div>

          <div class="flex-grow-1 overflow-y-auto pa-6">
            <v-row>
              <!-- Prescription Details -->
              <v-col cols="12" lg="5">
                <v-card flat tile class="b-1 mb-4 overflow-hidden">
                  <div class="pa-3 bg-grey lighten-4 border-bottom font-weight-black text-caption uppercase ls-1">
                    <v-icon left x-small>mdi-prescription</v-icon> PRESCRIPTION DETAILS
                  </div>
                  <div class="pa-4">
                    <div class="detail-row"><span class="detail-label">Drug</span><span class="detail-value font-weight-black">{{ selectedRx.medication }}</span></div>
                    <div class="detail-row"><span class="detail-label">Dosage</span><span class="detail-value">{{ selectedRx.dosage }}</span></div>
                    <div class="detail-row"><span class="detail-label">Route</span><span class="detail-value">{{ selectedRx.route }}</span></div>
                    <div class="detail-row"><span class="detail-label">Frequency</span><span class="detail-value">{{ selectedRx.frequency }}</span></div>
                    <div class="detail-row"><span class="detail-label">Quantity</span><span class="detail-value font-weight-black">{{ selectedRx.quantity || 1 }}</span></div>
                    <div class="detail-row"><span class="detail-label">Duration</span><span class="detail-value">{{ selectedRx.startDate }} → {{ selectedRx.endDate || 'Ongoing' }}</span></div>
                    <div class="detail-row" v-if="selectedRx.notes"><span class="detail-label">Clinical Notes</span><span class="detail-value font-italic" style="max-width:55%">{{ selectedRx.notes }}</span></div>
                  </div>
                </v-card>

                <!-- Edit Prescription (only if not yet dispensed) -->
                <v-card v-if="selectedRx.dispensingStatus !== 'Dispensed'" flat tile class="b-1 overflow-hidden">
                  <div class="pa-3 bg-grey lighten-4 border-bottom font-weight-black text-caption uppercase ls-1">
                    <v-icon left x-small>mdi-pencil</v-icon> AMEND PRESCRIPTION
                  </div>
                  <div class="pa-4">
                    <v-btn small tile outlined color="#C0392B" class="font-weight-black text-caption mr-2" @click="discontinue(selectedRx)">
                      <v-icon left x-small>mdi-close-circle</v-icon> DISCONTINUE
                    </v-btn>
                    <v-btn small tile outlined color="#003366" class="font-weight-black text-caption" @click="openEditDialog(selectedRx)">
                      <v-icon left x-small>mdi-pencil</v-icon> EDIT RX
                    </v-btn>
                  </div>
                </v-card>
              </v-col>

              <!-- Dispensing & Payment Status -->
              <v-col cols="12" lg="7">
                <v-card flat tile class="b-1 overflow-hidden">
                  <div class="pa-3 d-flex align-center justify-space-between border-bottom"
                    :style="selectedRx.dispensingStatus === 'Dispensed' ? 'background:#003366' : 'background:#F8FAFC'">
                    <div class="font-weight-black text-caption uppercase ls-1" :class="selectedRx.dispensingStatus === 'Dispensed' ? 'white--text' : 'grey--text'">
                      <v-icon left x-small :color="selectedRx.dispensingStatus === 'Dispensed' ? 'white' : 'grey'">mdi-pharmacy</v-icon>
                      PHARMACY STATUS
                    </div>
                    <v-chip x-small dark :color="statusColor(selectedRx.dispensingStatus || selectedRx.status)" class="font-weight-black">
                      {{ selectedRx.dispensingStatus || selectedRx.status }}
                    </v-chip>
                  </div>
                  <div class="pa-6">
                    <!-- Timeline -->
                    <div class="mb-4">
                      <div class="step-row">
                        <v-icon small color="#003366">mdi-prescription</v-icon>
                        <div class="ml-3">
                          <div class="text-caption font-weight-black">Prescribed</div>
                          <div class="text-caption grey--text">{{ selectedRx.prescribedAt }} by {{ selectedRx.prescribedBy }}</div>
                        </div>
                        <v-icon small color="#00A99D" class="ml-auto">mdi-check-circle</v-icon>
                      </div>
                      <div class="step-row mt-3">
                        <v-icon small :color="selectedRx.paymentStatus === 'Paid' ? '#00A99D' : 'orange'">mdi-cash-register</v-icon>
                        <div class="ml-3">
                          <div class="text-caption font-weight-black">Cash Office Payment</div>
                          <div class="text-caption" :class="selectedRx.paymentStatus === 'Paid' ? 'success--text' : 'orange--text'">
                            {{ selectedRx.paymentStatus === 'Paid' ? 'Cleared — Patient paid at Cash Office' : 'Patient must pay at Cash Office first' }}
                          </div>
                        </div>
                        <v-icon small :color="selectedRx.paymentStatus === 'Paid' ? '#00A99D' : 'orange'" class="ml-auto">
                          {{ selectedRx.paymentStatus === 'Paid' ? 'mdi-check-circle' : 'mdi-clock-outline' }}
                        </v-icon>
                      </div>
                      <div class="step-row mt-3">
                        <v-icon small :color="selectedRx.dispensingStatus === 'Dispensed' ? '#003366' : 'grey lighten-1'">mdi-pharmacy</v-icon>
                        <div class="ml-3">
                          <div class="text-caption font-weight-black">Pharmacy Dispensing</div>
                          <div class="text-caption grey--text" v-if="selectedRx.dispensingStatus === 'Dispensed'">
                            Dispensed by {{ selectedRx.dispensedBy }} on {{ selectedRx.dispensedAt }}
                          </div>
                          <div class="text-caption grey--text" v-else>Awaiting pharmacy confirmation</div>
                        </div>
                        <v-icon small :color="selectedRx.dispensingStatus === 'Dispensed' ? '#003366' : 'grey lighten-1'" class="ml-auto">
                          {{ selectedRx.dispensingStatus === 'Dispensed' ? 'mdi-check-decagram' : 'mdi-clock-outline' }}
                        </v-icon>
                      </div>
                    </div>

                    <!-- Stock Status -->
                    <v-alert v-if="selectedRx.inStock === false" dense text type="warning" class="mb-0 rounded-0 text-caption" color="orange">
                      <strong>OUT OF STOCK</strong> — This medication is currently not available at the hospital pharmacy.
                      Patient may need to procure externally.
                    </v-alert>
                    <v-alert v-else-if="selectedRx.inStock === true" dense text type="success" class="mb-0 rounded-0 text-caption" color="#00A99D">
                      <strong>IN STOCK</strong> — Medication available at hospital pharmacy.
                    </v-alert>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </template>
      </v-col>
    </v-row>

    <!-- ── DIALOG: New / Edit Prescription ──────────── -->
    <v-dialog v-model="rxDialog" max-width="600" persistent>
      <v-card flat tile>
        <div class="pa-4 bg-navy white--text font-weight-black text-caption uppercase ls-1 d-flex align-center justify-space-between">
          <span><v-icon left small dark>mdi-prescription</v-icon>{{ editingId ? 'AMEND PRESCRIPTION' : 'WRITE NEW PRESCRIPTION' }}</span>
          <v-btn icon dark x-small @click="rxDialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <div class="pa-6">
          <v-form ref="rxForm" v-model="formValid">
            <label class="form-label">Patient <span class="error--text">*</span></label>
            <v-autocomplete v-model="form.patientId" :items="patientSelectItems" item-text="text" item-value="id"
              outlined tile dense class="rounded-0 mb-4" placeholder="Search patient..." :rules="[v => !!v || 'Required']" :disabled="!!editingId"></v-autocomplete>

            <label class="form-label">Medication / Drug Name <span class="error--text">*</span></label>
            <v-combobox v-model="form.medication" :items="commonMedications" outlined tile dense class="rounded-0 mb-4"
              placeholder="Choose or type drug name..." :rules="[v => !!v || 'Required']"></v-combobox>

            <v-row dense>
              <v-col cols="6">
                <label class="form-label">Dosage <span class="error--text">*</span></label>
                <v-text-field v-model="form.dosage" outlined tile dense class="rounded-0 mb-4" placeholder="e.g. 500mg" :rules="[v => !!v || 'Required']"></v-text-field>
              </v-col>
              <v-col cols="6">
                <label class="form-label">Route</label>
                <v-select v-model="form.route" :items="routes" outlined tile dense class="rounded-0 mb-4"></v-select>
              </v-col>
            </v-row>

            <v-row dense>
              <v-col cols="6">
                <label class="form-label">Frequency <span class="error--text">*</span></label>
                <v-select v-model="form.frequency" :items="frequencies" outlined tile dense class="rounded-0 mb-4" :rules="[v => !!v || 'Required']"></v-select>
              </v-col>
              <v-col cols="6">
                <label class="form-label">Quantity / Units</label>
                <v-text-field v-model.number="form.quantity" type="number" min="1" outlined tile dense class="rounded-0 mb-4" placeholder="e.g. 30 tablets"></v-text-field>
              </v-col>
            </v-row>

            <v-row dense>
              <v-col cols="6">
                <label class="form-label">Start Date</label>
                <v-text-field v-model="form.startDate" type="date" outlined tile dense class="rounded-0 mb-4"></v-text-field>
              </v-col>
              <v-col cols="6">
                <label class="form-label">End Date</label>
                <v-text-field v-model="form.endDate" type="date" outlined tile dense class="rounded-0 mb-4"></v-text-field>
              </v-col>
            </v-row>

            <label class="form-label">Clinical Indication / Prescriber Notes</label>
            <v-textarea v-model="form.notes" outlined tile dense rows="2" class="rounded-0 mb-2" placeholder="Reason for prescription, contraindications noted, patient instructions..."></v-textarea>
          </v-form>
        </div>
        <div class="pa-4 d-flex justify-end b-top" style="gap:8px">
          <v-btn text tile class="font-weight-black text-caption" @click="rxDialog = false">CANCEL</v-btn>
          <v-btn color="#003366" dark tile depressed :disabled="!formValid || !form.patientId || !form.medication"
            @click="saveRx" class="font-weight-black text-caption px-6">
            <v-icon left small>mdi-check-decagram</v-icon> {{ editingId ? 'SAVE CHANGES' : 'ISSUE PRESCRIPTION' }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>
export default {
  layout: 'admins',
  head: { title: 'Physician Prescriptions' },
  data() {
    return {
      search: '',
      statusFilter: '',
      selectedRx: null,
      rxDialog: false,
      editingId: null,
      formValid: false,
      form: { patientId: '', medication: '', dosage: '', route: 'Oral', frequency: '', quantity: 1, startDate: '', endDate: '', notes: '' },
      statusFilters: [
        { value: '', label: 'ALL' },
        { value: 'Active', label: 'ACTIVE' },
        { value: 'Dispensed', label: 'DISPENSED' },
        { value: 'Discontinued', label: 'STOPPED' }
      ],
      routes: ['Oral', 'Intravenous (IV)', 'Intramuscular (IM)', 'Topical', 'Inhalation', 'Sublingual', 'Rectal', 'Subcutaneous'],
      frequencies: ['Once daily (OD)', 'Twice daily (BD)', 'Three times daily (TDS)', 'Four times daily (QID)', 'Every 8 hours (Q8H)', 'Every 6 hours (Q6H)', 'Every 12 hours (Q12H)', 'As needed (PRN)', 'Stat (single dose)', 'Weekly'],
      commonMedications: [
        'Amoxicillin 500mg', 'Amoxicillin/Clavulanate 625mg', 'Artemether-Lumefantrine 6×4',
        'Azithromycin 500mg', 'Ceftriaxone 1g IV', 'Ciprofloxacin 500mg',
        'Cotrimoxazole 480mg', 'Doxycycline 100mg', 'Metronidazole 500mg',
        'Paracetamol 500mg', 'Ibuprofen 400mg', 'Diclofenac 50mg',
        'Omeprazole 20mg', 'Metformin 500mg', 'Amlodipine 5mg',
        'Lisinopril 5mg', 'Atorvastatin 20mg', 'Furosemide 40mg',
        'ORS Sachets', 'Zinc Sulfate 20mg', 'Vitamin A 200 000 IU',
        'Iron + Folic Acid', 'Mebendazole 500mg'
      ]
    }
  },
  computed: {
    patients() { return this.$store.getters['clinical/getPatients'] || [] },
    patientSelectItems() {
      return this.patients.map(p => ({
        id: p.id,
        text: `${p.name || ((p.firstName || '') + ' ' + (p.lastName || '')).trim()} (${p.id})`
      }))
    },
    allRx() {
      return (this.$store.getters['clinical/getMedications'] || []).map(m => {
        const p = this.patients.find(pt => pt.id === m.patientId)
        return {
          ...m,
          patientName: p ? (p.name || ((p.firstName || '') + ' ' + (p.lastName || '')).trim()) : m.patientId,
          prescribedAt: m.prescribedAt ? new Date(m.prescribedAt).toLocaleDateString('fr-CM') : '—',
          prescribedBy: m.prescribedBy || m.orderedBy || 'Doctor'
        }
      }).reverse()
    },
    filteredRx() {
      let list = this.allRx
      if (this.statusFilter) list = list.filter(m => (m.dispensingStatus || m.status) === this.statusFilter)
      if (this.search) {
        const q = this.search.toLowerCase()
        list = list.filter(m =>
          (m.patientName || '').toLowerCase().includes(q) ||
          (m.medication || '').toLowerCase().includes(q)
        )
      }
      return list
    }
  },
  mounted() {
    this.$store.commit('clinical/LOAD_FROM_STORAGE')
    if (this.$route.query.patientId) this.openNewRxDialog(this.$route.query.patientId)
  },
  methods: {
    selectRx(rx) { this.selectedRx = rx },
    openNewRxDialog(patientId = '') {
      this.editingId = null
      this.form = {
        patientId: patientId || '',
        medication: '',
        dosage: '',
        route: 'Oral',
        frequency: 'Once daily (OD)',
        quantity: 1,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        notes: ''
      }
      this.rxDialog = true
    },
    openEditDialog(rx) {
      this.editingId = rx.id
      this.form = {
        patientId: rx.patientId,
        medication: rx.medication,
        dosage: rx.dosage,
        route: rx.route || 'Oral',
        frequency: rx.frequency,
        quantity: rx.quantity || 1,
        startDate: rx.startDate || '',
        endDate: rx.endDate || '',
        notes: rx.notes || ''
      }
      this.rxDialog = true
    },
    async saveRx() {
      if (!this.$refs.rxForm.validate()) return
      const prescribedBy = this.$store.state.auth.fullName || this.$store.state.auth.staffId || 'Doctor'
      const medName = typeof this.form.medication === 'string' ? this.form.medication : this.form.medication?.text || 'Drug'

      if (this.editingId) {
        await this.$store.dispatch('clinical/updateMedication', {
          id: this.editingId,
          ...this.form,
          medication: medName
        })
        this.$toast.success('Prescription updated.')
      } else {
        const rec = await this.$store.dispatch('clinical/prescribeMedication', {
          ...this.form,
          medication: medName,
          prescribedBy,
          dispensingStatus: 'Pending',
          paymentStatus: 'Unpaid',
          inStock: null
        })
        this.$toast.success('Prescription issued! Sent to Cash Office & Pharmacy.')
        const created = this.allRx.find(m => m.id === rec.id)
        if (created) this.selectRx(created)
      }
      this.rxDialog = false
    },
    discontinue(rx) {
      this.$store.dispatch('clinical/updateMedication', { ...rx, status: 'Discontinued', dispensingStatus: 'Discontinued' })
      this.selectedRx = { ...this.selectedRx, status: 'Discontinued', dispensingStatus: 'Discontinued' }
      this.$toast.warning('Prescription discontinued.')
    },
    statusColor(s) {
      return {
        Active: '#003366', Pending: '#D97706', Dispensed: '#00A99D',
        Discontinued: '#C0392B', Completed: '#6B7280', 'Partially Dispensed': '#7C3AED'
      }[s] || '#6B7280'
    }
  }
}
</script>

<style scoped>
.rx-bg { background: #F8FAFC; }
.bg-navy { background: #003366 !important; }
.gov-text-primary { color: #1B1F23 !important; }
.ls-1 { letter-spacing: 0.8px; }
.uppercase { text-transform: uppercase; }
.b-right { border-right: 1px solid #E5E7EB; }
.b-bottom { border-bottom: 1px solid #E5E7EB; }
.b-top { border-top: 1px solid #E5E7EB; }
.b-1 { border: 1px solid #E5E7EB; }
.border-bottom { border-bottom: 1px solid #E5E7EB; }
.worklist-panel { background: white; }
.worklist-item { cursor: pointer; transition: background 0.15s; }
.worklist-item:hover { background: #F8FAFC; }
.worklist-item--active { background: #EFF6FF !important; border-left: 3px solid #003366; }
.section-label { font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #003366; border-left: 3px solid #00A99D; padding-left: 8px; }
.form-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #374151; display: block; margin-bottom: 4px; }
.detail-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #F3F4F6; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #9CA3AF; letter-spacing: 0.5px; }
.detail-value { font-size: 12px; color: #1B1F23; text-align: right; max-width: 60%; }
.step-row { display: flex; align-items: flex-start; }
.opacity-75 { opacity: 0.75; }
</style>
