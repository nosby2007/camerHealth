000<template>
  <v-container fluid class="pa-0 fill-height imaging-bg">
    <v-row no-gutters class="fill-height">

      <!-- ── LEFT: Worklist ─────────────────────────────── -->
      <v-col cols="12" md="4" lg="3" class="worklist-panel b-right d-flex flex-column">
        <div class="pa-4 bg-purple white--text d-flex align-center justify-space-between">
          <div>
            <div class="text-caption font-weight-black ls-1 opacity-75">
              {{ isDoctorOrAdmin ? 'PHYSICIAN IMAGING MANAGEMENT' : 'DIAGNOSTIC IMAGING' }}
            </div>
            <div class="text-subtitle-2 font-weight-black">RADIOLOGY ORDERS & REPORTS</div>
          </div>
          <v-avatar tile color="rgba(255,255,255,0.15)" size="36">
            <v-icon dark small>mdi-radiology-box</v-icon>
          </v-avatar>
        </div>

        <!-- Doctor Action: Create New Imaging Request -->
        <div class="pa-3 bg-grey lighten-4 b-bottom">
          <v-btn
            color="#7C3AED" dark block tile height="38" depressed
            class="font-weight-black text-caption"
            @click="openNewOrderDialog()"
          >
            <v-icon left small>mdi-plus-circle</v-icon> CREATE NEW IMAGING REQUEST
          </v-btn>
        </div>

        <!-- Filters -->
        <div class="pa-3 b-bottom bg-white">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            placeholder="Search patient or exam..."
            outlined tile dense hide-details
            class="rounded-0 mb-2"
          ></v-text-field>
          <div class="d-flex" style="gap:6px">
            <v-btn
              v-for="f in statusFilters" :key="f.value"
              x-small tile depressed
              :color="statusFilter === f.value ? '#7C3AED' : '#F1F5F9'"
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
            <div class="text-caption grey--text mb-1">{{ order.modality }}<span v-if="order.bodyPart"> — {{ order.bodyPart }}</span></div>
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
            <v-icon size="40" color="#E2E8F0" class="mb-2 d-block">mdi-radiology-box-outline</v-icon>
            No imaging orders found
          </div>
        </div>
      </v-col>

      <!-- ── RIGHT: Order Detail / Report View & Entry ──────────── -->
      <v-col cols="12" md="8" lg="9" class="d-flex flex-column">
        <!-- Empty state -->
        <div v-if="!selectedOrder" class="fill-height d-flex align-center justify-center">
          <div class="text-center grey--text">
            <v-icon size="72" color="#E2E8F0">mdi-radiology-box-outline</v-icon>
            <div class="text-caption font-weight-black mt-4 uppercase ls-1">Select an imaging order to view details</div>
            <v-btn color="#7C3AED" dark tile depressed class="mt-4 font-weight-black text-caption" @click="openNewOrderDialog()">
              <v-icon left small>mdi-plus</v-icon>CREATE IMAGING REQUEST
            </v-btn>
          </div>
        </div>

        <template v-else>
          <!-- Header -->
          <div class="pa-6 bg-white b-bottom">
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="section-label mb-1">IMAGING ORDER — {{ selectedOrder.id }}</div>
                <div class="text-h6 font-weight-black gov-text-primary uppercase">
                  {{ selectedOrder.modality }}<span v-if="selectedOrder.bodyPart"> — {{ selectedOrder.bodyPart }}</span>
                </div>
                <div class="text-caption grey--text mt-1">
                  Patient: <strong>{{ selectedOrder.patientName }}</strong> ({{ selectedOrder.patientId }})
                  · Requested by: <strong>{{ selectedOrder.orderedBy }}</strong>
                  · Date: {{ selectedOrder.requestedAt }}
                </div>
              </div>
              <div class="d-flex align-center" style="gap:8px">
                <v-btn
                  x-small outlined tile color="#7C3AED"
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
                Patient must clear imaging fees at the Cash Office before the imaging scan can be performed.
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
            color="#7C3AED" border="left"
          >
            <v-icon left small color="#7C3AED">mdi-cash-check</v-icon>
            <strong>PAYMENT CONFIRMED AT CASH OFFICE</strong> — Cleared for imaging acquisition & radiologist report.
          </v-alert>

          <!-- Body: Order Info + Radiology Report -->
          <div class="flex-grow-1 overflow-y-auto pa-6">
            <v-row>
              <!-- Left: Order Info -->
              <v-col cols="12" lg="5">
                <v-card flat tile class="b-1 mb-4 overflow-hidden">
                  <div class="pa-3 bg-grey lighten-4 border-bottom font-weight-black text-caption uppercase ls-1">
                    <v-icon left x-small>mdi-clipboard-text</v-icon> EXAM INFORMATION
                  </div>
                  <div class="pa-4">
                    <div class="detail-row">
                      <span class="detail-label">Modality</span>
                      <span class="detail-value font-weight-black">{{ selectedOrder.modality }}</span>
                    </div>
                    <div class="detail-row" v-if="selectedOrder.bodyPart">
                      <span class="detail-label">Anatomical Region</span>
                      <span class="detail-value">{{ selectedOrder.bodyPart }}</span>
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

                <!-- Workflow Status & Actions -->
                <v-card flat tile class="b-1 overflow-hidden">
                  <div class="pa-3 bg-grey lighten-4 border-bottom font-weight-black text-caption uppercase ls-1">
                    <v-icon left x-small>mdi-timeline-check</v-icon> WORKFLOW STATUS
                  </div>
                  <div class="pa-4">
                    <template v-if="!isDoctorOrAdmin">
                      <v-btn
                        v-if="selectedOrder.status === 'Requested'"
                        :disabled="selectedOrder.paymentStatus !== 'Paid'"
                        color="#7C3AED" dark block height="40" tile depressed
                        class="font-weight-black text-caption mb-3"
                        @click="setStatus('In Progress')"
                      >
                        <v-icon left small>mdi-play-circle</v-icon> START SCAN / ACQUISITION
                      </v-btn>
                      <v-btn
                        v-if="selectedOrder.status === 'In Progress'"
                        color="#003366" dark block height="40" tile depressed
                        class="font-weight-black text-caption mb-3"
                        @click="reportDialog = true"
                      >
                        <v-icon left small>mdi-draw</v-icon> ENTER RADIOLOGY REPORT
                      </v-btn>
                    </template>

                    <div v-if="selectedOrder.status === 'Completed'" class="text-center pa-4">
                      <v-icon size="36" color="#7C3AED">mdi-check-decagram</v-icon>
                      <div class="text-caption font-weight-black purple--text text--darken-2 mt-2">RADIOLOGY REPORT FILED</div>
                      <div class="text-caption grey--text">{{ selectedOrder.reportFiledAt }}</div>
                      <v-btn
                        v-if="!isDoctorOrAdmin"
                        x-small tile outlined color="#7C3AED" class="mt-3 font-weight-black text-caption"
                        @click="reportDialog = true"
                      >
                        <v-icon left x-small>mdi-pencil</v-icon> AMEND REPORT
                      </v-btn>
                    </div>

                    <div v-if="selectedOrder.status === 'Requested' && selectedOrder.paymentStatus !== 'Paid'" class="text-caption orange--text font-weight-black text-center mt-2">
                      ⚠ Waiting for patient to clear imaging fees at Cash Office
                    </div>
                    <div v-if="selectedOrder.status === 'Requested' && selectedOrder.paymentStatus === 'Paid'" class="text-caption purple--text font-weight-black text-center mt-2">
                      ✔ Paid at Cash Office — Imaging technician is performing scan
                    </div>
                  </div>
                </v-card>
              </v-col>

              <!-- Right: Radiology Report Display -->
              <v-col cols="12" lg="7">
                <v-card flat tile class="b-1 overflow-hidden">
                  <div class="pa-3 d-flex align-center justify-space-between border-bottom"
                    :style="selectedOrder.status === 'Completed' ? 'background:#7C3AED' : 'background:#F8FAFC'">
                    <div class="font-weight-black text-caption uppercase ls-1"
                      :class="selectedOrder.status === 'Completed' ? 'white--text' : 'grey--text'">
                      <v-icon left x-small :color="selectedOrder.status === 'Completed' ? 'white' : 'grey'">mdi-radiology-box</v-icon>
                      RADIOLOGY REPORT
                    </div>
                    <v-chip x-small dark :color="statusColor(selectedOrder.status)" class="font-weight-black">
                      {{ selectedOrder.status }}
                    </v-chip>
                  </div>
                  <div class="pa-6">
                    <div class="text-caption font-weight-black grey--text uppercase mb-2">Imaging Scan File</div>
                    <div v-if="selectedOrder.imageUrl" class="mb-4">
                      <a :href="selectedOrder.imageUrl" target="_blank" class="text-caption gov-text-primary font-weight-black">
                        View uploaded scan
                      </a>
                      <div class="text-caption grey--text mt-1">{{ getImageDisplayName(selectedOrder) }}</div>
                      <div v-if="selectedOrder.imageMimeType && selectedOrder.imageMimeType.startsWith('image/')" class="mt-3">
                        <img :src="selectedOrder.imageUrl" alt="Uploaded scan" style="max-width:100%; border:1px solid #E5E7EB; border-radius:4px;" />
                      </div>
                    </div>
                    <div v-else-if="selectedOrder.paymentStatus === 'Paid' && selectedOrder.status !== 'Requested'" class="mb-4">
                      <v-file-input
                        v-model="imageFile"
                        label="Upload scan image / report file"
                        accept="image/*,.pdf,.dcm"
                        outlined tile dense
                        hide-details
                        class="rounded-0 mb-3"
                        placeholder="Choose file from workstation"
                      />
                      <v-btn
                        color="#7C3AED" dark tile depressed
                        :disabled="!imageFile || uploadLoading"
                        :loading="uploadLoading"
                        @click="uploadImagingFile"
                        class="font-weight-black text-caption"
                      >
                        Upload scan file
                      </v-btn>
                      <div v-if="imageUploadError" class="text-caption error--text mt-2">{{ imageUploadError }}</div>
                    </div>
                    <div v-else-if="selectedOrder.status === 'Requested'" class="text-caption grey--text">
                      Patient payment must clear and the scan must start before uploading an image.
                    </div>
                    <div v-else class="text-caption grey--text">
                      Imaging file upload is available once payment is confirmed.
                    </div>
                  </div>
                  <div v-if="selectedOrder.status === 'Completed'" class="pa-6">
                    <div class="result-chip purple--text font-weight-black text-caption mb-4">
                      <v-icon small color="#7C3AED" class="mr-1">mdi-check-circle</v-icon>
                      Reported by {{ selectedOrder.reportedBy }} on {{ selectedOrder.reportFiledAt }}
                    </div>
                    <div class="result-block pa-4 mb-4">
                      <div class="text-caption font-weight-black grey--text uppercase mb-2">RADIOLOGICAL FINDINGS</div>
                      <div class="text-body-2 font-weight-medium" style="white-space:pre-wrap">{{ selectedOrder.report }}</div>
                    </div>
                    <div v-if="selectedOrder.impression" class="result-block pa-4 mb-4" style="background:#F5F3FF; border-color:#DDD6FE">
                      <div class="text-caption font-weight-black purple--text text--darken-3 uppercase mb-2">IMPRESSION / CONCLUSION</div>
                      <div class="text-body-2 font-weight-bold purple--text text--darken-4">{{ selectedOrder.impression }}</div>
                    </div>
                    <div v-if="selectedOrder.recommendations" class="result-block pa-4">
                      <div class="text-caption font-weight-black grey--text uppercase mb-2">RECOMMENDATIONS</div>
                      <div class="text-caption font-italic">{{ selectedOrder.recommendations }}</div>
                    </div>
                  </div>
                  <div v-else class="pa-8 text-center grey--text">
                    <v-icon size="48" color="#E2E8F0">mdi-radiology-box-outline</v-icon>
                    <div class="text-caption mt-3">No radiology report filed yet. Pending scan performance.</div>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </template>
      </v-col>
    </v-row>

    <!-- ── DIALOG: Doctor Create New Imaging Request ──────────── -->
    <v-dialog v-model="newOrderDialog" max-width="580" persistent>
      <v-card flat tile>
        <div class="pa-4 bg-purple white--text font-weight-black text-caption uppercase ls-1 d-flex align-center justify-space-between">
          <span><v-icon left small dark>mdi-plus-circle</v-icon>CREATE NEW IMAGING REQUEST</span>
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

          <label class="form-label">Imaging Modality / Exam <span class="error--text">*</span></label>
          <v-combobox
            v-model="newOrderForm.modality"
            :items="commonModalities"
            outlined tile dense class="rounded-0 mb-4"
            placeholder="Choose or type imaging exam..."
          ></v-combobox>

          <label class="form-label">Body Part / Anatomical Region</label>
          <v-text-field
            v-model="newOrderForm.bodyPart"
            outlined tile dense class="rounded-0 mb-4"
            placeholder="e.g. Chest, Right Knee, Abdomen, Brain..."
          ></v-text-field>

          <label class="form-label">Priority</label>
          <v-btn-toggle v-model="newOrderForm.priority" mandatory class="mb-4 d-flex" tile dense>
            <v-btn value="Routine" small tile class="flex-grow-1 font-weight-black text-caption">Routine</v-btn>
            <v-btn value="Urgent" small tile class="flex-grow-1 font-weight-black text-caption warning--text">Urgent</v-btn>
            <v-btn value="STAT" small tile class="flex-grow-1 font-weight-black text-caption error--text">🔴 STAT (Emergency)</v-btn>
          </v-btn-toggle>

          <label class="form-label">Clinical Indication / Reason for Imaging</label>
          <v-textarea
            v-model="newOrderForm.clinicalNotes"
            outlined tile dense rows="3"
            class="rounded-0 mb-2"
            placeholder="e.g. Persistent cough 2 weeks, trauma to right leg, acute abdominal pain..."
          ></v-textarea>
        </div>
        <div class="pa-4 d-flex justify-end b-top" style="gap:8px">
          <v-btn text tile class="font-weight-black text-caption" @click="newOrderDialog = false">CANCEL</v-btn>
          <v-btn
            color="#7C3AED" dark tile depressed
            :disabled="!newOrderForm.patientId || !newOrderForm.modality"
            @click="submitNewOrder"
            class="font-weight-black text-caption px-6"
          >
            <v-icon left small>mdi-check-decagram</v-icon> VALIDATE & SEND IMAGING REQUEST
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- ── DIALOG: Radiologist Report Entry ──────────── -->
    <v-dialog v-model="reportDialog" max-width="560" persistent>
      <v-card flat tile>
        <div class="pa-4 bg-purple white--text font-weight-black text-caption uppercase ls-1">
          <v-icon left small dark>mdi-radiology-box</v-icon>
          RECORD RADIOLOGY REPORT — {{ selectedOrder ? selectedOrder.modality : '' }}
        </div>
        <div class="pa-6">
          <div class="text-caption font-weight-black grey--text uppercase ls-1 mb-1">Patient</div>
          <div class="text-subtitle-2 font-weight-black gov-text-primary mb-4">{{ selectedOrder ? selectedOrder.patientName : '' }}</div>

          <label class="form-label">Radiological Findings <span class="error--text">*</span></label>
          <v-textarea
            v-model="reportForm.report"
            outlined tile dense rows="4"
            class="rounded-0 mb-4"
            placeholder="Describe parenchymal, osseous, vascular or soft tissue findings..."
          ></v-textarea>

          <label class="form-label">Impression / Conclusion</label>
          <v-textarea
            v-model="reportForm.impression"
            outlined tile dense rows="2"
            class="rounded-0 mb-4"
            placeholder="Main radiological diagnosis / conclusion..."
          ></v-textarea>

          <label class="form-label">Recommendations (optional)</label>
          <v-textarea
            v-model="reportForm.recommendations"
            outlined tile dense rows="2"
            class="rounded-0 mb-4"
            placeholder="e.g. Recommend follow-up CT scan in 4 weeks, clinical correlation..."
          ></v-textarea>
        </div>
        <div class="pa-4 d-flex justify-end b-top" style="gap:8px">
          <v-btn text tile class="font-weight-black text-caption" @click="reportDialog = false">CANCEL</v-btn>
          <v-btn
            color="#7C3AED" dark tile depressed
            :disabled="!reportForm.report"
            @click="submitReport"
            class="font-weight-black text-caption px-6"
          >
            <v-icon left small>mdi-check-decagram</v-icon> FILE RADIOLOGY REPORT
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>
export default {
  layout: 'admins',
  head: { title: 'Diagnostic Imaging Management' },
  data() {
    return {
      search: '',
      statusFilter: '',
      selectedOrder: null,
      newOrderDialog: false,
      reportDialog: false,
      newOrderForm: { patientId: '', modality: '', bodyPart: '', priority: 'Routine', clinicalNotes: '' },
      reportForm: { report: '', impression: '', recommendations: '' },
      imageFile: null,
      uploadLoading: false,
      imageUploadError: '',
      statusFilters: [
        { value: '', label: 'ALL' },
        { value: 'Requested', label: 'PENDING' },
        { value: 'In Progress', label: 'IN PROGRESS' },
        { value: 'Completed', label: 'DONE' }
      ],
      commonModalities: [
        'Chest X-Ray', 'Abdominal X-Ray', 'Bone / Extremity X-Ray',
        'Abdominal Ultrasound', 'Obstetric Ultrasound', 'Pelvic Ultrasound',
        'Brain CT Scan', 'Chest CT Scan', 'Abdominal CT Scan',
        'Brain MRI', 'Spine MRI', 'Mammography', 'ECG (Electrocardiogram)'
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
        text: `${p.mrn || p.id} — ${p.name || ((p.firstName || '') + ' ' + (p.lastName || '')).trim()}`
      }))
    },
    allOrders() {
      return (this.$store.getters['clinical/getImagingOrders'] || []).map(o => this.normalizeOrder(o)).reverse()
    },
    filteredOrders() {
      let list = this.allOrders
      if (this.statusFilter) list = list.filter(o => o.status === this.statusFilter)
      if (this.search) {
        const q = this.search.toLowerCase()
        list = list.filter(o =>
          (o.patientName || '').toLowerCase().includes(q) ||
          (o.modality || '').toLowerCase().includes(q) ||
          (o.id || '').toLowerCase().includes(q)
        )
      }
      return list
    }
  },
  mounted() {
    this.$store.dispatch('clinical/fetchPatients')
    this.$store.dispatch('clinical/fetchImagingOrders')
    this.$store.dispatch('billing/fetchAllStatements')
    if (this.$route.query && this.$route.query.patientId) {
      this.openNewOrderDialog(this.$route.query.patientId)
    }
  },
  methods: {
    isOrderPaid(order) {
      const stmt = this.$store.getters['billing/statementForPatient'](order.patientId)
      if (!stmt) return false
      if (stmt.status === 'PAID') return true
      const charge = (stmt.charges || []).find(c => c.sourceType === 'imaging_order' && c.sourceId === order.id)
      if (!charge) return false
      return charge.status === 'Waived'
    },
    normalizeOrder(o) {
      const p = this.patients.find(pt => pt.id === o.patientId)
      const paid = this.isOrderPaid(o)
      // Normalize the raw backend order into a fully-presentable shape so the
      // template never crashes on missing fields after a reload.
      return {
        id: o.id || '',
        patientId: o.patientId || '',
        patientName: p ? (p.name || ((p.firstName || '') + ' ' + (p.lastName || '')).trim()) : (o.patientName || o.patientId || '—'),
        modality: o.exam || o.modality || 'Imaging',
        bodyPart: o.bodyPart || '',
        exam: o.exam || o.modality || '',
        priority: o.priority || 'Routine',
        status: o.status || 'Requested',
        clinicalNotes: o.notes || o.clinicalNotes || '',
        requestedAt: o.requestedAt ? new Date(o.requestedAt).toLocaleDateString('fr-CM') : '—',
        orderedBy: o.orderedBy || (o.requestedBy && o.requestedBy.fullName) || (o.requestedBy && o.requestedBy.name) || '',
        paymentStatus: paid ? 'Paid' : 'Unpaid',
        report: o.result || o.report || '',
        impression: o.impression || '',
        recommendations: o.notes && o.notes !== o.clinicalNotes ? o.notes : (o.recommendations || ''),
        reportedBy: o.reportedBy || (o.completedBy && o.completedBy.fullName) || '',
        reportFiledAt: o.completedAt ? new Date(o.completedAt).toLocaleDateString('fr-CM') + ' ' + new Date(o.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        imageUrl: o.imageUrl || '',
        imagePath: o.imagePath || '',
        imageName: o.imageName || '',
        imageMimeType: o.imageMimeType || '',
        imageUploadedAt: o.imageUploadedAt || null,
        imageUploadedById: o.imageUploadedById || '',
        ...o
      }
    },
    selectOrder(order) {
      this.selectedOrder = order
      this.reportForm = {
        report: order.report || '',
        impression: order.impression || '',
        recommendations: order.recommendations || ''
      }
      this.imageFile = null
      this.uploadLoading = false
      this.imageUploadError = ''
    },
    openNewOrderDialog(patientId = '') {
      this.newOrderForm = {
        patientId: patientId || (this.patients.length ? this.patients[0].id : ''),
        modality: 'Chest X-Ray',
        bodyPart: 'Chest',
        priority: 'Routine',
        clinicalNotes: ''
      }
      this.newOrderDialog = true
    },
    async submitNewOrder() {
      if (!this.newOrderForm.patientId || !this.newOrderForm.modality) return
      const orderedBy = this.$store.state.auth.fullName || this.$store.state.auth.staffId || 'Doctor'
      const modality = typeof this.newOrderForm.modality === 'string' ? this.newOrderForm.modality : this.newOrderForm.modality.text || 'Imaging'

      const imgOrder = await this.$store.dispatch('clinical/orderImaging', {
        patientId: this.newOrderForm.patientId,
        exam: modality + (this.newOrderForm.bodyPart ? ' — ' + this.newOrderForm.bodyPart : ''),
        priority: this.newOrderForm.priority,
        notes: this.newOrderForm.clinicalNotes
      })

      // Auto-create billing charge for this imaging order
      const imgPrice = this.$store.getters['billing/activeCatalog']
        .find(i => i.section === 'imaging' && i.name.toLowerCase().includes(modality.toLowerCase().split(' ')[0]))
      if (imgPrice) {
        await this.$store.dispatch('billing/chargeForImagingOrder', {
          patientId: this.newOrderForm.patientId,
          orderId: (imgOrder.imagingOrder || imgOrder).id,
          examName: modality,
          unitPrice: imgPrice.unitPrice
        })
      }

      this.newOrderDialog = false
      this.$toast.success('Imaging request created! Patient must pay at Cash Office before scan.')
      await this.$store.dispatch('clinical/fetchImagingOrders')
      const created = this.allOrders.find(o => o.id === (imgOrder.imagingOrder || imgOrder).id)
      if (created) this.selectOrder(created)
    },
    async setStatus(status) {
      try {
        await this.$store.dispatch('clinical/updateImagingOrder', { id: this.selectedOrder.id, status })
        await this.$store.dispatch('clinical/fetchImagingOrders')
        // Re-select the order from the fresh store data so it stays in sync
        const fresh = this.$store.getters['clinical/getImagingOrders'].find(o => o.id === this.selectedOrder.id)
        if (fresh) {
          this.selectOrder(this.normalizeOrder(fresh))
        } else {
          this.selectOrder(this.normalizeOrder({ ...this.selectedOrder, status }))
        }
        this.$toast.success('Status updated to ' + status)
      } catch (err) {
        this.$toast.error(err.response?.data?.error || err.message || 'Failed to update status. Please try again.')
      }
    },
    markAsPaid() {
      this.$toast.warning('Payment must be recorded at the Cash Office.')
    },
    async submitReport() {
      if (!this.reportForm.report) return
      const now = new Date().toISOString()
      const reportedBy = this.$store.state.auth.fullName || this.$store.state.auth.staffId || 'Radiologist'
      await this.$store.dispatch('clinical/updateImagingOrder', {
        id: this.selectedOrder.id,
        status: 'Completed',
        result: this.reportForm.report + (this.reportForm.impression ? '\n\nIMPRESSION: ' + this.reportForm.impression : ''),
        notes: this.reportForm.recommendations
      })
      await this.$store.dispatch('clinical/fetchImagingOrders')
      const freshAfterReport = this.$store.getters['clinical/getImagingOrders'].find(o => o.id === this.selectedOrder.id)
      this.selectOrder(this.normalizeOrder(freshAfterReport || {
        ...this.selectedOrder, status: 'Completed',
        result: this.reportForm.report,
        report: this.reportForm.report,
        impression: this.reportForm.impression,
        recommendations: this.reportForm.recommendations,
        reportedBy,
        reportFiledAt: new Date(now).toLocaleDateString('fr-CM') + ' ' + new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }))
      this.reportDialog = false
      this.$toast.success('Radiology report filed & transmitted to doctor chart.')
    },
    async uploadImagingFile() {
      if (!this.selectedOrder || !this.imageFile) return
      this.uploadLoading = true
      this.imageUploadError = ''
      try {
        const fileBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const dataUrl = reader.result
            const base64 = dataUrl.split(',')[1]
            resolve(base64)
          }
          reader.onerror = reject
          reader.readAsDataURL(this.imageFile)
        })

        await this.$store.dispatch('clinical/uploadImagingFile', {
          id: this.selectedOrder.id,
          data: {
            fileBase64,
            imageName: this.imageFile.name,
            imageMimeType: this.imageFile.type || 'application/octet-stream',
            imageUploadedAt: new Date().toISOString(),
            imageUploadedById: this.$store.state.auth.staffId
          }
        })

        await this.$store.dispatch('clinical/fetchImagingOrders')
        const fresh = this.$store.getters['clinical/getImagingOrders'].find(o => o.id === this.selectedOrder.id)
        if (fresh) this.selectOrder(this.normalizeOrder(fresh))
        this.$toast.success('Imaging file uploaded and linked to the order.')
      } catch (err) {
        this.imageUploadError = err.response?.data?.error || err.message || 'Upload failed. Check the file and try again.'
      } finally {
        this.uploadLoading = false
        this.imageFile = null
      }
    },
    getImageDisplayName(order) {
      return order.imageName || order.imagePath?.split('/')?.pop() || 'Uploaded scan'
    },
    printReport() {
      window.print()
    },
    priorityColor(p) { return { Routine: '#6B7280', Urgent: '#F4A300', STAT: '#C0392B' }[p] || '#6B7280' },
    statusColor(s) { return { Requested: '#7C3AED', 'In Progress': '#D97706', Completed: '#003366' }[s] || '#6B7280' }
  }
}
</script>

<style scoped>
.imaging-bg { background: #F8FAFC; }
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
.worklist-item--active { background: #F5F3FF !important; border-left: 3px solid #7C3AED; }

.section-label {
  font-size: 10px; font-weight: 800; letter-spacing: 1.5px;
  text-transform: uppercase; color: #7C3AED;
  border-left: 3px solid #7C3AED; padding-left: 8px;
}
.form-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #374151; display: block; margin-bottom: 4px; }

.detail-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #F3F4F6; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #9CA3AF; letter-spacing: 0.5px; }
.detail-value { font-size: 12px; color: #1B1F23; text-align: right; max-width: 60%; }

.result-block { background: #F8FAFC; border: 1px solid #E5E7EB; }
</style>
