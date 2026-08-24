<template>
  <v-container fluid class="pa-0 fill-height pharmacy-bg">
    <v-row no-gutters class="fill-height">

      <!-- ── LEFT: Dispense Queue ───────────────────────── -->
      <v-col cols="12" md="4" lg="3" class="worklist-panel b-right d-flex flex-column">
        <div class="pa-4 bg-green-dark white--text d-flex align-center justify-space-between">
          <div>
            <div class="text-caption font-weight-black ls-1 opacity-75">HOSPITAL PHARMACY</div>
            <div class="text-subtitle-2 font-weight-black">DISPENSE WORKBENCH</div>
          </div>
          <v-avatar tile color="rgba(255,255,255,0.15)" size="36">
            <v-icon dark small>mdi-pharmacy</v-icon>
          </v-avatar>
        </div>

        <!-- Filters -->
        <div class="pa-3 b-bottom bg-white">
          <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="Search patient or drug..." outlined tile dense hide-details class="rounded-0 mb-2"></v-text-field>
          <div class="d-flex" style="gap:6px">
            <v-btn v-for="f in statusFilters" :key="f.value" x-small tile depressed
              :color="statusFilter === f.value ? '#0B3D2E' : '#F1F5F9'"
              :dark="statusFilter === f.value"
              class="font-weight-black text-caption flex-grow-1"
              @click="statusFilter = f.value">{{ f.label }}</v-btn>
          </div>
        </div>

        <!-- Queue List -->
        <div class="flex-grow-1 overflow-y-auto">
          <div v-for="rx in filteredRx" :key="rx.id"
            :class="['worklist-item pa-4 b-bottom', selectedRx && selectedRx.id === rx.id ? 'worklist-item--active' : '']"
            @click="selectRx(rx)">
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="text-caption font-weight-black gov-text-primary uppercase">{{ rx.patientName }}</span>
              <v-chip x-small dark label :color="statusColor(rx.dispensingStatus)" class="font-weight-black">
                {{ rx.dispensingStatus || 'Pending' }}
              </v-chip>
            </div>
            <div class="text-caption font-weight-medium grey--text text--darken-2 mb-1">{{ rx.medication }}</div>
            <div class="d-flex align-center justify-space-between">
              <span class="text-caption grey--text" style="font-size:10px">{{ rx.dosage }} · {{ rx.frequency }}</span>
              <div class="d-flex align-center" style="gap:4px">
                <!-- Payment indicator -->
                <v-icon x-small :color="rx.paymentStatus === 'Paid' ? '#00A99D' : 'orange'">
                  {{ rx.paymentStatus === 'Paid' ? 'mdi-cash-check' : 'mdi-cash-clock' }}
                </v-icon>
                <span class="text-caption" :class="rx.paymentStatus === 'Paid' ? 'success--text' : 'orange--text'" style="font-size:9px;font-weight:800">
                  {{ rx.paymentStatus === 'Paid' ? 'PAID' : 'UNPAID' }}
                </span>
              </div>
            </div>
            <!-- Stock badge -->
            <div class="mt-1">
              <v-chip x-small :color="rx.inStock === true ? '#E8F5E9' : rx.inStock === false ? '#FEF2F2' : '#F3F4F6'" class="font-weight-black" style="font-size:9px">
                <v-icon x-small :color="rx.inStock === true ? '#00A99D' : rx.inStock === false ? '#C0392B' : '#9CA3AF'" left>
                  {{ rx.inStock === true ? 'mdi-check' : rx.inStock === false ? 'mdi-close' : 'mdi-help' }}
                </v-icon>
                {{ rx.inStock === true ? 'In Stock' : rx.inStock === false ? 'Out of Stock' : 'Stock Unknown' }}
              </v-chip>
            </div>
            <div class="text-caption grey--text mt-1" style="font-size:10px">{{ rx.prescribedAt }} · Dr. {{ rx.prescribedBy }}</div>
          </div>
          <div v-if="filteredRx.length === 0" class="pa-8 text-center grey--text text-caption">
            <v-icon size="40" color="#E2E8F0" class="mb-2 d-block">mdi-pharmacy</v-icon>
            No prescriptions in queue
          </div>
        </div>
      </v-col>

      <!-- ── RIGHT: Dispense Panel ──────────────────────────── -->
      <v-col cols="12" md="8" lg="9" class="d-flex flex-column">
        <div v-if="!selectedRx" class="fill-height d-flex align-center justify-center">
          <div class="text-center grey--text">
            <v-icon size="72" color="#E2E8F0">mdi-pharmacy</v-icon>
            <div class="text-caption font-weight-black mt-4 uppercase ls-1">Select a prescription from the queue</div>
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
                  · Prescribed by: <strong>Dr. {{ selectedRx.prescribedBy }}</strong>
                  · {{ selectedRx.prescribedAt }}
                </div>
              </div>
              <div class="d-flex align-center" style="gap:8px">
                <v-btn x-small outlined tile color="#0B3D2E" class="font-weight-black text-caption" :to="`/clinical/patients/${selectedRx.patientId}`">
                  <v-icon left x-small>mdi-account</v-icon>PATIENT 360
                </v-btn>
                <v-chip label :color="statusColor(selectedRx.dispensingStatus)" dark class="font-weight-black">
                  {{ selectedRx.dispensingStatus || 'Pending' }}
                </v-chip>
              </div>
            </div>
          </div>

          <!-- Payment Gate Banner -->
          <v-alert v-if="selectedRx.paymentStatus !== 'Paid'" dense text type="warning"
            class="mx-6 mt-4 mb-0 rounded-0 font-weight-bold text-caption" color="orange" border="left">
            <v-icon left small color="orange">mdi-cash-lock</v-icon>
            <strong>PAYMENT NOT CONFIRMED</strong> —
            Patient must pay for this medication at the Cash Office before dispensing. However, you may still check stock and set availability.
          </v-alert>
          <v-alert v-else dense text type="success" class="mx-6 mt-4 mb-0 rounded-0 font-weight-bold text-caption" color="#00A99D" border="left">
            <v-icon left small color="#00A99D">mdi-cash-check</v-icon>
            <strong>PAYMENT CONFIRMED</strong> — Patient has paid at Cash Office. Ready to dispense.
          </v-alert>

          <div class="flex-grow-1 overflow-y-auto pa-6">
            <v-row>
              <!-- Left: Rx Details + Patient Info -->
              <v-col cols="12" lg="5">
                <!-- Prescription Details -->
                <v-card flat tile class="b-1 mb-4 overflow-hidden">
                  <div class="pa-3 bg-grey lighten-4 border-bottom font-weight-black text-caption uppercase ls-1">
                    <v-icon left x-small>mdi-prescription</v-icon>PRESCRIPTION
                  </div>
                  <div class="pa-4">
                    <div class="detail-row"><span class="detail-label">Drug</span><span class="detail-value font-weight-black">{{ selectedRx.medication }}</span></div>
                    <div class="detail-row"><span class="detail-label">Dosage</span><span class="detail-value">{{ selectedRx.dosage }}</span></div>
                    <div class="detail-row"><span class="detail-label">Route</span><span class="detail-value">{{ selectedRx.route }}</span></div>
                    <div class="detail-row"><span class="detail-label">Frequency</span><span class="detail-value">{{ selectedRx.frequency }}</span></div>
                    <div class="detail-row"><span class="detail-label">Qty Prescribed</span><span class="detail-value font-weight-black">{{ selectedRx.quantity || 1 }}</span></div>
                    <div class="detail-row" v-if="selectedRx.notes"><span class="detail-label">Prescriber Notes</span><span class="detail-value font-italic" style="max-width:55%">{{ selectedRx.notes }}</span></div>
                  </div>
                </v-card>

                <!-- Stock Management (Pharmacist Only) -->
                <v-card flat tile class="b-1 overflow-hidden">
                  <div class="pa-3 bg-grey lighten-4 border-bottom font-weight-black text-caption uppercase ls-1">
                    <v-icon left x-small>mdi-warehouse</v-icon>STOCK & AVAILABILITY
                  </div>
                  <div class="pa-4">
                    <div class="text-caption font-weight-black grey--text uppercase mb-3">Is this medication in stock at the hospital pharmacy?</div>
                    <v-btn-toggle v-model="stockStatus" mandatory class="mb-4 d-flex" tile dense>
                      <v-btn value="true" small tile class="flex-grow-1 font-weight-black text-caption" @click="updateStock(true)">
                        <v-icon left x-small color="#00A99D">mdi-check-circle</v-icon> YES, IN STOCK
                      </v-btn>
                      <v-btn value="false" small tile class="flex-grow-1 font-weight-black text-caption" @click="updateStock(false)">
                        <v-icon left x-small color="#C0392B">mdi-close-circle</v-icon> OUT OF STOCK
                      </v-btn>
                    </v-btn-toggle>
                    <v-alert v-if="stockStatus === 'false'" dense text type="warning" class="rounded-0 text-caption mb-0" color="orange">
                      <strong>OUT-OF-STOCK PLAN REQUIRED</strong><br>
                      {{ selectedRx.stockAction || 'Document external procurement, substitution review or restock follow-up.' }}
                    </v-alert>
                    <v-btn v-if="stockStatus === 'false'" small block tile outlined color="#C0392B" class="mt-3 font-weight-black text-caption" @click="openStockIssueDialog">
                      <v-icon left x-small>mdi-clipboard-alert-outline</v-icon>{{ selectedRx.stockIssueReason ? 'UPDATE STOCK PLAN' : 'DOCUMENT STOCK PLAN' }}
                    </v-btn>
                  </div>
                </v-card>
              </v-col>

              <!-- Right: Dispense Action Panel -->
              <v-col cols="12" lg="7">
                <v-card flat tile class="b-1 overflow-hidden">
                  <div class="pa-3 border-bottom" :style="selectedRx.dispensingStatus === 'Dispensed' ? 'background:#0B3D2E' : 'background:#F8FAFC'">
                    <div class="font-weight-black text-caption uppercase ls-1" :class="selectedRx.dispensingStatus === 'Dispensed' ? 'white--text' : 'grey--text'">
                      <v-icon left x-small :color="selectedRx.dispensingStatus === 'Dispensed' ? 'white' : 'grey'">mdi-pill</v-icon>
                      DISPENSE RECORD
                    </div>
                  </div>

                  <!-- Already dispensed -->
                  <div v-if="selectedRx.dispensingStatus === 'Dispensed'" class="pa-6 text-center">
                    <v-icon size="48" color="#00A99D">mdi-check-decagram</v-icon>
                    <div class="text-subtitle-2 font-weight-black success--text mt-2">MEDICATION DISPENSED</div>
                    <div class="text-caption grey--text mt-1">Dispensed by {{ selectedRx.dispensedBy }}</div>
                    <div class="text-caption grey--text">{{ selectedRx.dispensedAt }}</div>
                    <div v-if="selectedRx.qtyDispensed && selectedRx.qtyDispensed < selectedRx.quantity" class="mt-3">
                      <v-chip small color="#7C3AED" dark class="font-weight-black">
                        PARTIAL: {{ selectedRx.qtyDispensed }} of {{ selectedRx.quantity }} units dispensed
                      </v-chip>
                    </div>
                    <v-btn x-small tile outlined color="#0B3D2E" class="mt-4 font-weight-black text-caption" @click="dispenseDialog = true">
                      <v-icon left x-small>mdi-pencil</v-icon> AMEND DISPENSE RECORD
                    </v-btn>
                  </div>

                  <!-- Pending dispense -->
                  <div v-else class="pa-6">
                    <div v-if="selectedRx.dispensingStatus === 'Discontinued'" class="text-center pa-4">
                      <v-icon size="36" color="#C0392B">mdi-close-circle</v-icon>
                      <div class="text-caption font-weight-black error--text mt-2">PRESCRIPTION DISCONTINUED BY PHYSICIAN</div>
                      <div class="text-caption grey--text">Do not dispense. Check with prescribing doctor.</div>
                    </div>

                    <template v-else>
                      <div class="mb-4">
                        <div class="text-caption font-weight-black grey--text uppercase mb-2">DISPENSE SUMMARY</div>
                        <div class="bg-grey lighten-4 pa-3 b-1">
                          <div class="d-flex justify-space-between text-caption mb-1">
                            <span>Prescribed quantity</span>
                            <strong>{{ selectedRx.quantity || 1 }} unit(s)</strong>
                          </div>
                          <div class="d-flex justify-space-between text-caption mb-1">
                            <span>Patient payment</span>
                            <span :class="selectedRx.paymentStatus === 'Paid' ? 'success--text font-weight-black' : 'orange--text font-weight-black'">
                              {{ selectedRx.paymentStatus === 'Paid' ? 'CONFIRMED' : 'NOT CONFIRMED' }}
                            </span>
                          </div>
                          <div class="d-flex justify-space-between text-caption">
                            <span>Stock status</span>
                            <span :class="selectedRx.inStock === true ? 'success--text font-weight-black' : 'error--text font-weight-black'">
                              {{ selectedRx.inStock === true ? 'IN STOCK' : selectedRx.inStock === false ? 'OUT OF STOCK' : 'UNKNOWN' }}
                            </span>
                          </div>
                        </div>
                      </div>

                      <v-btn
                        color="#0B3D2E" dark block height="48" tile depressed
                        :disabled="selectedRx.paymentStatus !== 'Paid' || selectedRx.inStock === false"
                        class="font-weight-black text-caption mb-3"
                        @click="dispenseDialog = true">
                        <v-icon left small>mdi-pill</v-icon> CONFIRM DISPENSING
                      </v-btn>

                      <div v-if="selectedRx.paymentStatus !== 'Paid'" class="text-caption orange--text font-weight-black text-center">
                        ⚠ Waiting for payment at Cash Office
                      </div>
                      <div v-if="selectedRx.inStock === false" class="text-caption error--text font-weight-black text-center mt-1">
                        ✗ Out of stock — patient must procure externally
                      </div>
                    </template>
                  </div>
                </v-card>

                <!-- Patient Medication History for this patient -->
                <v-card flat tile class="b-1 overflow-hidden mt-4">
                  <div class="pa-3 bg-grey lighten-4 border-bottom font-weight-black text-caption uppercase ls-1">
                    <v-icon left x-small>mdi-history</v-icon>OTHER ACTIVE PRESCRIPTIONS FOR THIS PATIENT
                  </div>
                  <div>
                    <div v-for="rx in otherRxForPatient" :key="rx.id" class="pa-3 b-bottom d-flex align-center justify-space-between">
                      <div>
                        <div class="text-caption font-weight-black">{{ rx.medication }}</div>
                        <div class="text-caption grey--text" style="font-size:10px">{{ rx.dosage }} · {{ rx.frequency }}</div>
                      </div>
                      <v-chip x-small dark :color="statusColor(rx.dispensingStatus || rx.status)" class="font-weight-black">
                        {{ rx.dispensingStatus || rx.status }}
                      </v-chip>
                    </div>
                    <div v-if="otherRxForPatient.length === 0" class="pa-4 text-center text-caption grey--text">No other active prescriptions</div>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </template>
      </v-col>
    </v-row>

    <!-- ── DIALOG: Confirm Dispense ─────────────────────── -->
    <v-dialog v-model="dispenseDialog" max-width="480" persistent>
      <v-card flat tile>
        <div class="pa-4 bg-green-dark white--text font-weight-black text-caption uppercase ls-1 d-flex align-center justify-space-between">
          <span><v-icon left small dark>mdi-pill</v-icon>CONFIRM DISPENSING</span>
          <v-btn icon dark x-small @click="dispenseDialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <div class="pa-6" v-if="selectedRx">
          <div class="text-caption grey--text uppercase font-weight-black mb-1">Patient</div>
          <div class="text-subtitle-2 font-weight-black gov-text-primary mb-4">{{ selectedRx.patientName }}</div>

          <div class="bg-grey lighten-4 pa-3 b-1 mb-4 text-caption">
            <strong>{{ selectedRx.medication }}</strong> — {{ selectedRx.dosage }} — {{ selectedRx.frequency }}<br>
            Prescribed qty: <strong>{{ selectedRx.quantity || 1 }} unit(s)</strong>
          </div>

          <label class="form-label">Quantity to Dispense Now <span class="error--text">*</span></label>
          <v-text-field v-model.number="dispenseForm.qty" type="number" :min="1" :max="selectedRx ? selectedRx.quantity : 999"
            outlined tile dense class="rounded-0 mb-3" placeholder="Enter qty..."></v-text-field>

          <v-alert v-if="selectedRx && dispenseForm.qty < selectedRx.quantity" dense text type="info" class="mb-3 rounded-0 text-caption" color="#7C3AED">
            <strong>PARTIAL DISPENSE</strong> — You are dispensing {{ dispenseForm.qty }} of {{ selectedRx.quantity }} unit(s).
            Prescription will be marked as "Partially Dispensed". Patient may collect the rest later.
          </v-alert>

          <label class="form-label">Pharmacist Notes (optional)</label>
          <v-textarea v-model="dispenseForm.pharmacistNotes" outlined tile dense rows="2" class="rounded-0 mb-2"
            placeholder="Patient counselling notes, substitution made, etc..."></v-textarea>
        </div>
        <div class="pa-4 d-flex justify-end b-top" style="gap:8px">
          <v-btn text tile class="font-weight-black text-caption" @click="dispenseDialog = false">CANCEL</v-btn>
          <v-btn color="#0B3D2E" dark tile depressed :disabled="!dispenseForm.qty || dispenseForm.qty < 1"
            @click="confirmDispense" class="font-weight-black text-caption px-6">
            <v-icon left small>mdi-check-decagram</v-icon> CONFIRM DISPENSED
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="stockIssueDialog" max-width="620" persistent scrollable>
      <v-card flat tile>
        <div class="pa-4 white--text font-weight-black text-caption uppercase ls-1 d-flex align-center justify-space-between" style="background:#9f1239">
          <span><v-icon left small dark>mdi-package-variant-remove</v-icon>OUT-OF-STOCK CONTINUITY PLAN</span>
          <v-btn icon dark x-small @click="closeStockIssueDialog"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <v-card-text v-if="selectedRx" class="pa-5">
          <v-alert dense text type="warning" tile class="text-caption">Dispensing remains blocked until stock is restored. Document how the patient and prescriber will be supported.</v-alert>
          <div class="text-subtitle-2 font-weight-black mb-4">{{ selectedRx.medication }} · {{ selectedRx.patientName }}</div>
          <v-select v-model="stockIssueForm.reason" :items="stockIssueReasons" label="Reason" outlined tile dense />
          <v-select v-model="stockIssueForm.action" :items="stockIssueActions" label="Continuity action" outlined tile dense />
          <v-text-field v-if="stockIssueForm.action === 'Expected restock / backorder'" v-model="stockIssueForm.expectedRestockAt" type="date" label="Expected restock date" outlined tile dense />
          <v-text-field v-if="stockIssueForm.action === 'Request prescriber substitution'" v-model="stockIssueForm.suggestedAlternative" label="Suggested formulary alternative (prescriber must approve)" outlined tile dense />
          <v-checkbox v-model="stockIssueForm.patientCounselled" dense hide-details class="mt-0 mb-3" label="Patient / caregiver informed and counselled" />
          <v-textarea v-model.trim="stockIssueForm.notes" label="Pharmacist notes and contact instructions" rows="3" outlined tile dense />
        </v-card-text>
        <v-card-actions class="pa-4 b-top">
          <v-spacer />
          <v-btn text tile class="font-weight-black text-caption" @click="closeStockIssueDialog">CANCEL</v-btn>
          <v-btn color="#9f1239" dark tile depressed class="font-weight-black text-caption" :disabled="!stockIssueForm.reason || !stockIssueForm.action" @click="saveStockIssue">SAVE CONTINUITY PLAN</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>
export default {
  layout: 'admins',
  head: { title: 'Pharmacy Dispense Workbench' },
  data() {
    return {
      search: '',
      statusFilter: '',
      selectedRx: null,
      stockStatus: null,
      dispenseDialog: false,
      stockIssueDialog: false,
      dispenseForm: { qty: 1, pharmacistNotes: '' },
      stockIssueForm: { reason: '', action: '', expectedRestockAt: '', suggestedAlternative: '', patientCounselled: false, notes: '' },
      stockIssueReasons: ['Temporary stockout', 'Not stocked by hospital', 'Expired / quarantined stock', 'Supply chain delay', 'Quantity insufficient'],
      stockIssueActions: ['External pharmacy referral', 'Request prescriber substitution', 'Expected restock / backorder', 'Transfer stock from another unit or facility'],
      statusFilters: [
        { value: '', label: 'ALL' },
        { value: 'Pending', label: 'PENDING' },
        { value: 'Partially Dispensed', label: 'PARTIAL' },
        { value: 'Out of Stock', label: 'OUT OF STOCK' },
        { value: 'Dispensed', label: 'DONE' }
      ]
    }
  },
  computed: {
    patients() { return this.$store.getters['clinical/getPatients'] || [] },
    allRx() {
      return (this.$store.getters['clinical/getMedications'] || [])
        .filter(m => !['Discontinued', 'Completed'].includes(m.status))
        .map(m => {
          const p = this.patients.find(pt => pt.id === m.patientId)
          // Derive the live payment status from the Cash Office statement so a
          // medication paid after prescribing immediately shows as PAID here
          // (matching the pre-backend behaviour where the queue read billing state).
          const stmt = this.$store.getters['billing/statementForPatient'](m.patientId)
          const charge = (stmt && stmt.charges || []).find(c => c.sourceType === 'medication' && c.sourceId === m.id)
          const paymentStatus = charge ? (charge.status === 'Paid' ? 'Paid' : 'Unpaid') : (m.paymentStatus || 'Unpaid')
          return {
            ...m,
            medication: m.medication || m.drug || m.name || 'Medication not labelled',
            dosage: m.dose || m.dosage || '',
            route: m.route || '',
            patientName: p ? (p.name || ((p.firstName || '') + ' ' + (p.lastName || '')).trim()) : m.patientId,
            prescribedAt: m.prescribedAt ? new Date(m.prescribedAt).toLocaleDateString('fr-CM') : '—',
            prescribedBy: m.prescribedBy || m.orderedBy || 'Doctor',
            paymentStatus
          }
        }).reverse()
    },
    filteredRx() {
      let list = this.allRx
      if (this.statusFilter) list = list.filter(m => (m.dispensingStatus || 'Pending') === this.statusFilter)
      if (this.search) {
        const q = this.search.toLowerCase()
        list = list.filter(m => (m.patientName || '').toLowerCase().includes(q) || (m.medication || '').toLowerCase().includes(q))
      }
      return list
    },
    otherRxForPatient() {
      if (!this.selectedRx) return []
      return this.allRx.filter(m => m.patientId === this.selectedRx.patientId && m.id !== this.selectedRx.id && m.status === 'Active')
    }
  },
  mounted() {
    // Load prescriptions, patients and billing statements from the backend API.
    // (The old localStorage-based mutations were removed with the API migration.)
    Promise.all([
      this.$store.dispatch('clinical/fetchMedications'),
      this.$store.dispatch('clinical/fetchPatients'),
      this.$store.dispatch('billing/fetchAllStatements')
    ]).catch(() => {
      // Swallow — individual getters fall back to empty arrays and the UI
      // just shows the empty state until the backend becomes reachable.
    })
  },
  methods: {
    selectRx(rx) {
      this.selectedRx = rx
      this.stockStatus = rx.inStock === true ? 'true' : rx.inStock === false ? 'false' : null
      this.dispenseForm = { qty: rx.quantity || 1, pharmacistNotes: rx.pharmacistNotes || '' }
    },
    async updateStock(val) {
      if (!this.selectedRx) return
      if (!val) {
        this.stockStatus = 'false'
        this.openStockIssueDialog()
        return
      }
      const updated = {
        ...this.selectedRx,
        inStock: true,
        dispensingStatus: this.selectedRx.dispensingStatus === 'Out of Stock' ? 'Pending' : (this.selectedRx.dispensingStatus || 'Pending'),
        stockRestoredAt: new Date().toISOString(),
        stockRestoredBy: this.actorName()
      }
      try {
        await this.$store.dispatch('clinical/updateMedication', updated)
        this.selectedRx = updated
        this.$toast.success('Medication marked in stock. Dispensing can continue after safety checks.')
      } catch (err) {
        this.$toast.error(err.response?.data?.error || err.message || 'Failed to update stock.')
      }
    },
    openStockIssueDialog() {
      if (!this.selectedRx) return
      this.stockIssueForm = {
        reason: this.selectedRx.stockIssueReason || 'Temporary stockout',
        action: this.selectedRx.stockAction || 'External pharmacy referral',
        expectedRestockAt: this.selectedRx.expectedRestockAt || '',
        suggestedAlternative: this.selectedRx.suggestedAlternative || '',
        patientCounselled: Boolean(this.selectedRx.patientCounselled),
        notes: this.selectedRx.stockIssueNotes || ''
      }
      this.stockIssueDialog = true
    },
    closeStockIssueDialog() {
      this.stockIssueDialog = false
      this.stockStatus = this.selectedRx && this.selectedRx.inStock === true ? 'true' : this.selectedRx && this.selectedRx.inStock === false ? 'false' : null
    },
    async saveStockIssue() {
      if (!this.selectedRx || !this.stockIssueForm.reason || !this.stockIssueForm.action) return
      const reviewedAt = new Date().toISOString()
      const updated = {
        ...this.selectedRx,
        inStock: false,
        dispensingStatus: 'Out of Stock',
        stockIssueReason: this.stockIssueForm.reason,
        stockAction: this.stockIssueForm.action,
        expectedRestockAt: this.stockIssueForm.expectedRestockAt,
        suggestedAlternative: this.stockIssueForm.suggestedAlternative,
        patientCounselled: this.stockIssueForm.patientCounselled,
        stockIssueNotes: this.stockIssueForm.notes,
        stockReviewedAt: reviewedAt,
        stockReviewedBy: this.actorName()
      }
      try {
        await this.$store.dispatch('clinical/updateMedication', updated)
        await this.$store.dispatch('clinical/createTask', {
          patientId: updated.patientId,
          relatedType: 'medication-stockout',
          relatedId: updated.id,
          title: `Resolve medication stockout: ${updated.medication}`,
          assignedToRole: this.stockIssueForm.action === 'Request prescriber substitution' ? 'DOCTOR' : 'PHARMACY',
          priority: 'Today',
          actionReason: [this.stockIssueForm.reason, this.stockIssueForm.action, this.stockIssueForm.suggestedAlternative, this.stockIssueForm.notes].filter(Boolean).join(' | ')
        })
        this.selectedRx = updated
        this.stockStatus = 'false'
        this.stockIssueDialog = false
        this.$toast.warning('Out-of-stock plan recorded and follow-up task created.')
      } catch (e) {
        this.$toast.error('Unable to save the out-of-stock plan.')
      }
    },
    async confirmDispense() {
      if (!this.dispenseForm.qty || this.dispenseForm.qty < 1) return
      const now = new Date()
      const dispensedAtISO = now.toISOString()
      const dispensedAt = now.toLocaleDateString('fr-CM') + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const dispensedBy = this.$store.state.auth.fullName || this.$store.state.auth.staffId || 'Pharmacist'
      const isPartial = this.dispenseForm.qty < (this.selectedRx.quantity || 1)

      const payload = {
        id: this.selectedRx.id,
        dispensingStatus: isPartial ? 'Partially Dispensed' : 'Dispensed',
        qtyDispensed: this.dispenseForm.qty,
        dispensedBy,
        dispensedAt: dispensedAtISO,
        pharmacistNotes: this.dispenseForm.pharmacistNotes
      }
      try {
        await this.$store.dispatch('clinical/updateMedication', payload)
        this.selectedRx = { ...this.selectedRx, ...payload, dispensedAt }
        this.dispenseDialog = false

        if (isPartial) {
          this.$toast.warning(`Partial dispense confirmed: ${this.dispenseForm.qty} of ${this.selectedRx.quantity} unit(s).`)
        } else {
          this.$toast.success('Medication dispensed & recorded.')
        }
      } catch (err) {
        this.$toast.error(err.response?.data?.error || err.message || 'Failed to record dispense.')
      }
    },
    statusColor(s) {
      return {
        Active: '#003366', Pending: '#D97706', Dispensed: '#00A99D',
        Discontinued: '#C0392B', Completed: '#6B7280', 'Partially Dispensed': '#7C3AED', 'Out of Stock': '#9f1239'
      }[s] || '#6B7280'
    },
    actorName() {
      return this.$store.state.auth.fullName || this.$store.state.auth.staffId || 'Pharmacist'
    }
  }
}
</script>

<style scoped>
.pharmacy-bg { background: #F8FAFC; }
.bg-green-dark { background: #0B3D2E !important; }
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
.worklist-item--active { background: #ECFDF5 !important; border-left: 3px solid #0B3D2E; }
.section-label { font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #0B3D2E; border-left: 3px solid #00A99D; padding-left: 8px; }
.form-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #374151; display: block; margin-bottom: 4px; }
.detail-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #F3F4F6; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #9CA3AF; letter-spacing: 0.5px; }
.detail-value { font-size: 12px; color: #1B1F23; text-align: right; max-width: 60%; }
.opacity-75 { opacity: 0.75; }
</style>
