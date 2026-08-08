<template>
  <v-container fluid class="pa-0 fill-height lab-bg">
    <v-row no-gutters class="fill-height">

      <!-- ── LEFT: Worklist ─────────────────────────────── -->
      <v-col cols="12" md="4" lg="3" class="worklist-panel b-right d-flex flex-column">
        <div class="pa-4 bg-navy white--text d-flex align-center justify-space-between">
          <div>
            <div class="text-caption font-weight-black ls-1 opacity-75">
              {{ isDoctorOrAdmin ? 'PHYSICIAN ORDER MANAGEMENT' : 'DIAGNOSTIC WORKSTATION' }}
            </div>
            <div class="text-subtitle-2 font-weight-black">LABORATORY ORDERS & RESULTS</div>
          </div>
          <v-avatar tile color="rgba(255,255,255,0.15)" size="36">
            <v-icon dark small>mdi-flask</v-icon>
          </v-avatar>
        </div>

        <!-- Doctor Action: Create New Request -->
        <div class="pa-3 bg-grey lighten-4 b-bottom">
          <v-btn
            color="#00A99D" dark block tile height="38" depressed
            class="font-weight-black text-caption"
            @click="openNewOrderDialog()"
          >
            <v-icon left small>mdi-plus-circle</v-icon> CREATE NEW LAB REQUEST
          </v-btn>
        </div>

        <!-- Filters -->
        <div class="pa-3 b-bottom bg-white">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            placeholder="Search patient or test..."
            outlined tile dense hide-details
            class="rounded-0 mb-2"
          ></v-text-field>
          <div class="d-flex" style="gap:6px">
            <v-btn
              v-for="f in statusFilters" :key="f.value"
              x-small tile depressed
              :color="statusFilter === f.value ? '#00A99D' : '#F1F5F9'"
              :dark="statusFilter === f.value"
              class="font-weight-black text-caption flex-grow-1"
              @click="statusFilter = f.value"
            >{{ f.label }}</v-btn>
          </div>
        </div>

        <!-- Order list -->
        <div class="flex-grow-1 overflow-y-auto">
          <div
            v-for="order in filteredOrders" :key="order.id"
            :class="['worklist-item pa-4 b-bottom', selectedOrder && selectedOrder.id === order.id ? 'worklist-item--active' : '']"
            @click="selectOrder(order)"
          >
            <div class="d-flex align-center justify-space-between mb-1">
              <span class="text-caption font-weight-black gov-text-primary uppercase">{{ order.patientName }}</span>
              <v-chip x-small dark label :color="priorityColor(order.priority)" class="font-weight-black">{{ order.priority }}</v-chip>
            </div>
            <div class="text-caption grey--text mb-1">{{ order.testName || order.test }}</div>
            <div class="d-flex align-center justify-space-between">
              <v-chip x-small outlined :color="statusColor(order.status)" class="font-weight-black">{{ order.status }}</v-chip>
              <div class="d-flex align-center" style="gap:4px">
                <v-icon x-small :color="order.paymentStatus === 'Paid' ? '#00A99D' : 'orange'">
                  {{ order.paymentStatus === 'Paid' ? 'mdi-cash-check' : 'mdi-cash-clock' }}
                </v-icon>
                <span class="text-caption" :class="order.paymentStatus === 'Paid' ? 'success--text' : 'orange--text'" style="font-size:9px;font-weight:800">
                  {{ order.paymentStatus === 'Paid' ? 'PAID' : 'UNPAID' }}
                </span>
              </div>
            </div>
            <div class="text-caption grey--text mt-1" style="font-size:10px">{{ order.requestedAt }} · {{ order.orderedBy }}</div>
          </div>
          <div v-if="filteredOrders.length === 0" class="pa-8 text-center grey--text text-caption">
            <v-icon size="40" color="#E2E8F0" class="mb-2 d-block">mdi-flask-empty</v-icon>
            No lab orders found
          </div>
        </div>
      </v-col>

      <!-- ── RIGHT: Order Detail / Result View & Entry ──────────── -->
      <v-col cols="12" md="8" lg="9" class="d-flex flex-column">
        <!-- Empty state -->
        <div v-if="!selectedOrder" class="fill-height d-flex align-center justify-center">
          <div class="text-center grey--text">
            <v-icon size="72" color="#E2E8F0">mdi-flask-outline</v-icon>
            <div class="text-caption font-weight-black mt-4 uppercase ls-1">Select a lab order to view details</div>
            <v-btn color="#00A99D" dark tile depressed class="mt-4 font-weight-black text-caption" @click="openNewOrderDialog()">
              <v-icon left small>mdi-plus</v-icon>CREATE LAB REQUEST
            </v-btn>
          </div>
        </div>

        <template v-else>
          <!-- Header -->
          <div class="pa-6 bg-white b-bottom">
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="section-label mb-1">LAB ORDER — {{ selectedOrder.id }}</div>
                <div class="text-h6 font-weight-black gov-text-primary uppercase">
                  {{ selectedOrder.testName || selectedOrder.test }}
                </div>
                <div class="text-caption grey--text mt-1">
                  Patient: <strong>{{ selectedOrder.patientName }}</strong> ({{ selectedOrder.patientId }})
                  · Requested by: <strong>{{ selectedOrder.orderedBy }}</strong>
                  · Date: {{ selectedOrder.requestedAt }}
                </div>
              </div>
              <div class="d-flex align-center" style="gap:8px">
                <v-btn
                  x-small outlined tile color="#003366"
                  class="font-weight-black text-caption"
                  :to="`/clinical/patients/${selectedOrder.patientId}`"
                >
                  <v-icon left x-small>mdi-account</v-icon>VIEW PATIENT 360
                </v-btn>
                <v-chip label dark :color="priorityColor(selectedOrder.priority)" class="font-weight-black">
                  {{ selectedOrder.priority }}
                </v-chip>
                <v-chip label :color="statusColor(selectedOrder.status)" dark class="font-weight-black">
                  {{ selectedOrder.status }}
                </v-chip>
              </div>
            </div>
          </div>

          <!-- Payment Gate Banner -->
          <v-alert
            v-if="selectedOrder.paymentStatus !== 'Paid'"
            dense text type="warning"
            class="mx-6 mt-4 mb-0 rounded-0 font-weight-bold text-caption"
            color="orange"
            border="left"
          >
            <div class="d-flex align-center justify-space-between">
              <div>
                <v-icon left small color="orange">mdi-cash-lock</v-icon>
                <strong>PAYMENT PENDING AT CASH OFFICE</strong> —
                Patient must clear the lab fee at the Cash Office before the lab technician can process the test.
              </div>
              <v-btn v-if="!isDoctorOrAdmin" x-small tile outlined color="orange" class="font-weight-black text-caption" @click="markAsPaid">
                MARK AS PAID (OVERRIDE)
              </v-btn>
            </div>
          </v-alert>

          <v-alert
            v-else
            dense text type="success"
            class="mx-6 mt-4 mb-0 rounded-0 font-weight-bold text-caption"
            color="#00A99D" border="left"
          >
            <v-icon left small color="#00A99D">mdi-cash-check</v-icon>
            <strong>PAYMENT CONFIRMED AT CASH OFFICE</strong> — Ready for laboratory technician processing.
          </v-alert>

          <!-- Body: Request Info + Lab Result Report -->
          <div class="flex-grow-1 overflow-y-auto pa-6">
            <v-row>
              <!-- Left: Request Details -->
              <v-col cols="12" lg="5">
                <v-card flat tile class="b-1 mb-4 overflow-hidden">
                  <div class="pa-3 bg-grey lighten-4 border-bottom font-weight-black text-caption uppercase ls-1">
                    <v-icon left x-small>mdi-clipboard-text</v-icon> REQUEST INFORMATION
                  </div>
                  <div class="pa-4">
                    <div class="detail-row">
                      <span class="detail-label">Test / Panel</span>
                      <span class="detail-value font-weight-black">{{ selectedOrder.testName || selectedOrder.test }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Patient Name</span>
                      <span class="detail-value font-weight-black">{{ selectedOrder.patientName }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Patient ID</span>
                      <span class="detail-value">{{ selectedOrder.patientId }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Priority</span>
                      <v-chip x-small dark label :color="priorityColor(selectedOrder.priority)" class="font-weight-black">
                        {{ selectedOrder.priority }}
                      </v-chip>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Requested by</span>
                      <span class="detail-value">{{ selectedOrder.orderedBy || '—' }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Request Date</span>
                      <span class="detail-value">{{ selectedOrder.requestedAt }}</span>
                    </div>
                    <div class="detail-row" v-if="selectedOrder.clinicalNotes">
                      <span class="detail-label">Clinical Indication</span>
                      <span class="detail-value font-italic" style="max-width:55%">{{ selectedOrder.clinicalNotes }}</span>
                    </div>
                  </div>
                </v-card>

                <!-- Workflow Actions for Tech / Doctor -->
                <v-card flat tile class="b-1 overflow-hidden">
                  <div class="pa-3 bg-grey lighten-4 border-bottom font-weight-black text-caption uppercase ls-1">
                    <v-icon left x-small>mdi-timeline-check</v-icon> WORKFLOW STATUS
                  </div>
                  <div class="pa-4">
                    <template v-if="!isDoctorOrAdmin">
                      <v-btn
                        v-if="selectedOrder.status === 'Requested'"
                        :disabled="selectedOrder.paymentStatus !== 'Paid'"
                        color="#00A99D" dark block height="40" tile depressed
                        class="font-weight-black text-caption mb-3"
                        @click="setStatus('In Progress')"
                      >
                        <v-icon left small>mdi-play-circle</v-icon> START LAB PROCESSING
                      </v-btn>
                      <v-btn
                        v-if="selectedOrder.status === 'In Progress'"
                        color="#003366" dark block height="40" tile depressed
                        class="font-weight-black text-caption mb-3"
                        @click="resultDialog = true"
                      >
                        <v-icon left small>mdi-check-circle</v-icon> ENTER TEST RESULTS
                      </v-btn>
                    </template>

                    <div v-if="selectedOrder.status === 'Completed'" class="text-center pa-4">
                      <v-icon size="36" color="#00A99D">mdi-check-decagram</v-icon>
                      <div class="text-caption font-weight-black success--text mt-2">TEST RESULT FILED & VALIDATED</div>
                      <div class="text-caption grey--text">{{ selectedOrder.resultFiledAt }}</div>
                      <v-btn
                        v-if="!isDoctorOrAdmin"
                        x-small tile outlined color="#003366" class="mt-3 font-weight-black text-caption"
                        @click="resultDialog = true"
                      >
                        <v-icon left x-small>mdi-pencil</v-icon> AMEND RESULT
                      </v-btn>
                    </div>

                    <div v-if="selectedOrder.status === 'Requested' && selectedOrder.paymentStatus !== 'Paid'" class="text-caption orange--text font-weight-black text-center mt-2">
                      ⚠ Waiting for patient to clear lab fees at Cash Office
                    </div>
                    <div v-if="selectedOrder.status === 'Requested' && selectedOrder.paymentStatus === 'Paid'" class="text-caption teal--text font-weight-black text-center mt-2">
                      ✔ Paid at Cash Office — Lab technician is processing the sample
                    </div>
                  </div>
                </v-card>
              </v-col>

              <!-- Right: Results Report Panel -->
              <v-col cols="12" lg="7">
                <v-card flat tile class="b-1 overflow-hidden">
                  <div class="pa-3 d-flex align-center justify-space-between border-bottom"
                    :style="selectedOrder.status === 'Completed' ? 'background:#003366' : 'background:#F8FAFC'">
                    <div class="font-weight-black text-caption uppercase ls-1"
                      :class="selectedOrder.status === 'Completed' ? 'white--text' : 'grey--text'">
                      <v-icon left x-small :color="selectedOrder.status === 'Completed' ? 'white' : 'grey'">mdi-flask-outline</v-icon>
                      LABORATORY RESULT REPORT
                    </div>
                    <v-chip x-small dark :color="statusColor(selectedOrder.status)" class="font-weight-black">
                      {{ selectedOrder.status }}
                    </v-chip>
                  </div>
                  <div v-if="selectedOrder.status === 'Completed'" class="pa-6">
                    <div class="result-chip success--text font-weight-black text-caption mb-4">
                      <v-icon small color="#00A99D" class="mr-1">mdi-check-circle</v-icon>
                      Validated by {{ selectedOrder.performedBy }} on {{ selectedOrder.resultFiledAt }}
                    </div>
                    <div class="result-block pa-4 mb-4">
                      <div class="text-caption font-weight-black grey--text uppercase mb-2">RESULT / FINDINGS</div>
                      <div class="text-body-2 font-weight-medium" style="white-space:pre-wrap">{{ selectedOrder.result }}</div>
                    </div>
                    <div v-if="selectedOrder.interpretation" class="result-block pa-4 mb-4"
                      :class="selectedOrder.interpretation === 'Abnormal' ? 'result-block--alert' : selectedOrder.interpretation === 'Critical' ? 'result-block--critical' : ''">
                      <div class="text-caption font-weight-black grey--text uppercase mb-2">CLINICAL INTERPRETATION</div>
                      <v-chip small dark :color="interpretationColor(selectedOrder.interpretation)" class="font-weight-black">
                        {{ selectedOrder.interpretation }}
                      </v-chip>
                    </div>
                    <div v-if="selectedOrder.technicianNotes" class="result-block pa-4">
                      <div class="text-caption font-weight-black grey--text uppercase mb-2">TECHNICIAN NOTES</div>
                      <div class="text-caption font-italic">{{ selectedOrder.technicianNotes }}</div>
                    </div>
                  </div>
                  <div v-else class="pa-8 text-center grey--text">
                    <v-icon size="48" color="#E2E8F0">mdi-flask-empty</v-icon>
                    <div class="text-caption mt-3">No result filed yet. Pending technician processing.</div>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </template>
      </v-col>
    </v-row>

    <!-- ── DIALOG: Doctor Create New Lab Request ──────────── -->
    <v-dialog v-model="newOrderDialog" max-width="580" persistent>
      <v-card flat tile>
        <div class="pa-4 bg-navy white--text font-weight-black text-caption uppercase ls-1 d-flex align-center justify-space-between">
          <span><v-icon left small dark>mdi-plus-circle</v-icon>CREATE NEW LABORATORY REQUEST</span>
          <v-btn icon dark x-small @click="newOrderDialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <div class="pa-6">
          <label class="form-label">Select Patient <span class="error--text">*</span></label>
          <v-autocomplete
            v-model="newOrderForm.patientId"
            :items="patientSelectItems"
            item-text="text" item-value="id"
            outlined tile dense class="rounded-0 mb-4"
            placeholder="Search patient by name or ID..."
          ></v-autocomplete>

          <label class="form-label">Select Laboratory Test / Panel <span class="error--text">*</span></label>
          <v-combobox
            v-model="newOrderForm.testName"
            :items="commonLabTests"
            outlined tile dense class="rounded-0 mb-4"
            placeholder="Choose or type a test name..."
          ></v-combobox>

          <label class="form-label">Priority</label>
          <v-btn-toggle v-model="newOrderForm.priority" mandatory class="mb-4 d-flex" tile dense>
            <v-btn value="Routine" small tile class="flex-grow-1 font-weight-black text-caption">Routine</v-btn>
            <v-btn value="Urgent" small tile class="flex-grow-1 font-weight-black text-caption warning--text">Urgent</v-btn>
            <v-btn value="STAT" small tile class="flex-grow-1 font-weight-black text-caption error--text">🔴 STAT (Emergency)</v-btn>
          </v-btn-toggle>

          <label class="form-label">Clinical Indication / Reason for Request</label>
          <v-textarea
            v-model="newOrderForm.clinicalNotes"
            outlined tile dense rows="3"
            class="rounded-0 mb-2"
            placeholder="e.g. Fever for 3 days, suspected malaria, routine preoperative check..."
          ></v-textarea>
        </div>
        <div class="pa-4 d-flex justify-end b-top" style="gap:8px">
          <v-btn text tile class="font-weight-black text-caption" @click="newOrderDialog = false">CANCEL</v-btn>
          <v-btn
            color="#00A99D" dark tile depressed
            :disabled="!newOrderForm.patientId || !newOrderForm.testName"
            @click="submitNewOrder"
            class="font-weight-black text-caption px-6"
          >
            <v-icon left small>mdi-check-decagram</v-icon> VALIDATE & SEND REQUEST
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- ── DIALOG: Lab Tech Result Entry ──────────── -->
    <v-dialog v-model="resultDialog" max-width="560" persistent>
      <v-card flat tile>
        <div class="pa-4 bg-navy white--text font-weight-black text-caption uppercase ls-1">
          <v-icon left small dark>mdi-flask</v-icon>
          RECORD LAB RESULT — {{ selectedOrder ? (selectedOrder.testName || selectedOrder.test) : '' }}
        </div>
        <div class="pa-6">
          <div class="text-caption font-weight-black grey--text uppercase ls-1 mb-1">Patient</div>
          <div class="text-subtitle-2 font-weight-black gov-text-primary mb-4">{{ selectedOrder ? selectedOrder.patientName : '' }}</div>

          <label class="form-label">Result / Findings <span class="error--text">*</span></label>
          <v-textarea
            v-model="resultForm.result"
            outlined tile dense rows="4"
            class="rounded-0 mb-4"
            placeholder="e.g. HGB: 10.5 g/dL (Low), WBC: 8.2 x10³/μL (Normal), PLT: 245 x10³/μL (Normal)..."
          ></v-textarea>

          <label class="form-label">Clinical Interpretation</label>
          <v-btn-toggle v-model="resultForm.interpretation" mandatory class="mb-4 d-flex" tile dense>
            <v-btn value="Normal" small tile class="flex-grow-1 font-weight-black text-caption">
              <v-icon left x-small color="#00A99D">mdi-check-circle</v-icon> Normal
            </v-btn>
            <v-btn value="Abnormal" small tile class="flex-grow-1 font-weight-black text-caption">
              <v-icon left x-small color="orange">mdi-alert-circle</v-icon> Abnormal
            </v-btn>
            <v-btn value="Critical" small tile class="flex-grow-1 font-weight-black text-caption">
              <v-icon left x-small color="#C0392B">mdi-alert</v-icon> Critical
            </v-btn>
            <v-btn value="Indeterminate" small tile class="flex-grow-1 font-weight-black text-caption">
              <v-icon left x-small color="grey">mdi-help-circle</v-icon> Indeterminate
            </v-btn>
          </v-btn-toggle>

          <label class="form-label">Technician Notes (optional)</label>
          <v-textarea
            v-model="resultForm.technicianNotes"
            outlined tile dense rows="2"
            class="rounded-0 mb-4"
            placeholder="Sample quality, repeat run notes, methodology..."
          ></v-textarea>
        </div>
        <div class="pa-4 d-flex justify-end b-top" style="gap:8px">
          <v-btn text tile class="font-weight-black text-caption" @click="resultDialog = false">CANCEL</v-btn>
          <v-btn
            color="#003366" dark tile depressed
            :disabled="!resultForm.result"
            @click="submitResult"
            class="font-weight-black text-caption px-6"
          >
            <v-icon left small>mdi-check-decagram</v-icon> FILE RESULT
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>
export default {
  layout: 'admins',
  head: { title: 'Laboratory Management' },
  data() {
    return {
      search: '',
      statusFilter: '',
      selectedOrder: null,
      newOrderDialog: false,
      resultDialog: false,
      newOrderForm: { patientId: '', testName: '', priority: 'Routine', clinicalNotes: '' },
      resultForm: { result: '', interpretation: 'Normal', technicianNotes: '' },
      statusFilters: [
        { value: '', label: 'ALL' },
        { value: 'Requested', label: 'PENDING' },
        { value: 'In Progress', label: 'IN PROGRESS' },
        { value: 'Completed', label: 'DONE' }
      ],
      commonLabTests: [
        'CBC with differential', 'CRP (C-Reactive Protein)', 'ESR (Erythrocyte Sedimentation Rate)',
        'Fasting Blood Glucose', 'Creatinine & Urea', 'Electrolyte Panel (Na, K, Cl)',
        'Liver Function Tests (ALT, AST, Bilirubin)', 'Blood Culture', 'Urine Culture & Sensitivity',
        'Malaria Smear & RDT', 'CD4 Count / Viral Load', 'Pregnancy Test (Beta-hCG)',
        'Lipid Profile', 'Stool Examination'
      ]
    }
  },
  computed: {
    userRole() { return this.$store.state.auth.role || 'DOCTOR' },
    isDoctorOrAdmin() {
      return ['DOCTOR', 'ADMIN', 'NP', 'MAJOR_SERVICE'].includes(this.userRole)
    },
    patients() { return this.$store.getters['clinical/getPatients'] || [] },
    patientSelectItems() {
      return this.patients.map(p => ({
        id: p.id,
        text: `${p.name || (p.firstName + ' ' + p.lastName)} (${p.id} · ${p.gender || ''})`
      }))
    },
    allOrders() {
      return (this.$store.getters['clinical/getLabOrders'] || []).map(o => {
        const p = this.patients.find(pt => pt.id === o.patientId)
        const paid = this.isOrderPaid(o)
        return {
          ...o,
          patientName: p ? (p.name || ((p.firstName || '') + ' ' + (p.lastName || '')).trim()) : o.patientId,
          requestedAt: o.requestedAt ? new Date(o.requestedAt).toLocaleDateString('fr-CM') : '—',
          paymentStatus: paid ? 'Paid' : 'Unpaid'
        }
      }).reverse()
    },
    filteredOrders() {
      let list = this.allOrders
      if (this.statusFilter) list = list.filter(o => o.status === this.statusFilter)
      if (this.search) {
        const q = this.search.toLowerCase()
        list = list.filter(o =>
          (o.patientName || '').toLowerCase().includes(q) ||
          (o.testName || o.test || '').toLowerCase().includes(q) ||
          (o.id || '').toLowerCase().includes(q)
        )
      }
      return list
    }
  },
  mounted() {
    this.$store.commit('clinical/LOAD_FROM_STORAGE')
    this.$store.dispatch('billing/loadFromStorage')
    if (this.$route.query && this.$route.query.patientId) {
      this.openNewOrderDialog(this.$route.query.patientId)
    }
  },
  methods: {
    isOrderPaid(order) {
      const statement = this.$store.getters['billing/statementForPatient'](order.patientId)
      if (!statement) return false
      const labCharge = (statement.charges || []).find(c =>
        c.sourceType === 'lab_order' && c.sourceId === order.id
      )
      if (!labCharge) return false
      return statement.amountPaid >= labCharge.total && labCharge.total > 0
    },
    selectOrder(order) {
      this.selectedOrder = order
      this.resultForm = {
        result: order.result || '',
        interpretation: order.interpretation || 'Normal',
        technicianNotes: order.technicianNotes || ''
      }
    },
    openNewOrderDialog(patientId = '') {
      this.newOrderForm = {
        patientId: patientId || (this.patients.length ? this.patients[0].id : ''),
        testName: 'CBC with differential',
        priority: 'Routine',
        clinicalNotes: ''
      }
      this.newOrderDialog = true
    },
    async submitNewOrder() {
      if (!this.newOrderForm.patientId || !this.newOrderForm.testName) return
      const orderedBy = this.$store.state.auth.fullName || this.$store.state.auth.staffId || 'Doctor'
      const testName = typeof this.newOrderForm.testName === 'string' ? this.newOrderForm.testName : this.newOrderForm.testName.text || 'Lab Test'

      const labOrder = await this.$store.dispatch('clinical/orderLab', {
        patientId: this.newOrderForm.patientId,
        testName,
        priority: this.newOrderForm.priority,
        clinicalNotes: this.newOrderForm.clinicalNotes,
        orderedBy
      })

      await this.$store.dispatch('clinical/createTask', {
        patientId: this.newOrderForm.patientId,
        relatedType: 'lab',
        relatedId: labOrder.id,
        title: 'Process lab order: ' + testName,
        assignedToRole: 'LAB',
        actionReason: 'Lab order requested by ' + orderedBy
      })

      this.newOrderDialog = false
      this.$toast.success('Laboratory request created! Sent to Cash Office & Lab Workbench.')

      const created = this.allOrders.find(o => o.id === labOrder.id)
      if (created) this.selectOrder(created)
    },
    setStatus(status) {
      const updated = { ...this.selectedOrder, status }
      this.$store.dispatch('clinical/updateLabOrder', updated)
      this.selectedOrder = { ...this.selectedOrder, status }
      this.$toast.success('Status updated to ' + status)
    },
    markAsPaid() {
      const updated = { ...this.selectedOrder, paymentStatus: 'Paid' }
      this.$store.dispatch('clinical/updateLabOrder', updated)
      this.selectedOrder = { ...this.selectedOrder, paymentStatus: 'Paid' }
      this.$toast.warning('Payment marked manually — ensure Cash Office receipt exists.')
    },
    submitResult() {
      if (!this.resultForm.result) return
      const now = new Date().toISOString()
      const performedBy = this.$store.state.auth.fullName || this.$store.state.auth.staffId || 'Lab Technician'
      const updated = {
        ...this.selectedOrder,
        status: 'Completed',
        result: this.resultForm.result,
        interpretation: this.resultForm.interpretation,
        technicianNotes: this.resultForm.technicianNotes,
        performedBy,
        resultFiledAt: new Date(now).toLocaleDateString('fr-CM') + ' ' + new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      this.$store.dispatch('clinical/updateLabOrder', updated)
      this.selectedOrder = updated
      this.resultDialog = false
      if (this.resultForm.interpretation === 'Critical') {
        this.$toast.error('⚠ CRITICAL RESULT FILED — Requesting physician notified!')
      } else {
        this.$toast.success('Lab result filed & transmitted to doctor chart.')
      }
    },
    priorityColor(p) { return { Routine: '#6B7280', Urgent: '#F4A300', STAT: '#C0392B' }[p] || '#6B7280' },
    statusColor(s) { return { Requested: '#00A99D', 'In Progress': '#D97706', Completed: '#003366' }[s] || '#6B7280' },
    interpretationColor(i) { return { Normal: '#00A99D', Abnormal: '#D97706', Critical: '#C0392B', Indeterminate: '#6B7280' }[i] || '#6B7280' }
  }
}
</script>

<style scoped>
.lab-bg { background: #F8FAFC; }
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

.section-label {
  font-size: 10px; font-weight: 800; letter-spacing: 1.5px;
  text-transform: uppercase; color: #003366;
  border-left: 3px solid #00A99D; padding-left: 8px;
}
.form-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #374151; display: block; margin-bottom: 4px; }

.detail-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #F3F4F6; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #9CA3AF; letter-spacing: 0.5px; }
.detail-value { font-size: 12px; color: #1B1F23; text-align: right; max-width: 60%; }

.result-block { background: #F8FAFC; border: 1px solid #E5E7EB; }
.result-block--alert { background: #FFFBEB; border-color: #F59E0B; }
.result-block--critical { background: #FEF2F2; border-color: #EF4444; }
</style>
