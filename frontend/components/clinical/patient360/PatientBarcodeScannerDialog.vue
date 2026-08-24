<template>
  <v-dialog :value="open" max-width="920" persistent scrollable @input="$emit('close')">
    <v-card class="scanner-dialog">
      <v-card-title class="dialog-title">
        <div>
          <span>Bedside access</span>
          <strong>Scan bracelet or capture wound photo</strong>
        </div>
        <v-btn icon small @click="$emit('close')"><v-icon small>mdi-close</v-icon></v-btn>
      </v-card-title>
      <v-card-text>
        <v-alert dense outlined color="#0f766e" border="left" class="mb-4">
          Access is checked against the current role before opening the chart or saving a wound photo.
        </v-alert>
        <div class="scanner-grid">
          <section class="scanner-panel">
            <h3>Scan patient bracelet</h3>
            <video ref="video" autoplay playsinline muted class="scanner-video"></video>
            <canvas ref="canvas" class="d-none"></canvas>
            <div class="scanner-actions">
              <v-btn small depressed color="#0f766e" dark @click="startCamera">
                <v-icon x-small left>mdi-camera</v-icon>Start camera
              </v-btn>
              <v-btn small outlined color="#0f766e" @click="stopCamera">
                <v-icon x-small left>mdi-stop</v-icon>Stop
              </v-btn>
            </div>
            <v-text-field v-model="manualCode" label="Manual barcode / MRN" dense outlined hide-details class="mt-3" />
            <div class="scanner-actions mt-2">
              <v-btn small depressed color="#003366" dark @click="resolveManualScan">
                <v-icon x-small left>mdi-barcode-scan</v-icon>Open patient
              </v-btn>
            </div>
          </section>

          <section class="scanner-panel">
            <h3>Capture wound photo</h3>
            <div class="photo-preview">
              <img v-if="photoPreview" :src="photoPreview" alt="Wound photo preview">
              <div v-else class="photo-empty">
                <v-icon size="38" color="#94a3b8">mdi-camera-plus</v-icon>
                <span>Take a photo of the wound or device site.</span>
              </div>
            </div>
            <input ref="photoInput" class="d-none" type="file" accept="image/*" capture="environment" @change="handleFilePick">
            <div class="scanner-actions">
              <v-btn small depressed color="#0f766e" dark @click="$refs.photoInput.click()">
                <v-icon x-small left>mdi-camera-plus</v-icon>Take photo
              </v-btn>
              <v-btn small outlined color="#0f766e" :disabled="!photoPreview" @click="clearPhoto">
                <v-icon x-small left>mdi-delete</v-icon>Clear
              </v-btn>
            </div>
            <v-textarea v-model="photoNote" label="Photo note" rows="2" dense outlined class="mt-3" />
            <div class="scanner-actions">
              <v-btn small depressed color="#003366" dark :disabled="!photoPreview" :loading="savingPhoto" @click="savePhoto">
                <v-icon x-small left>mdi-content-save</v-icon>Save wound photo
              </v-btn>
            </div>
          </section>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'PatientBarcodeScannerDialog',
  props: {
    open: { type: Boolean, default: false },
    patientId: { type: String, default: '' },
    role: { type: String, default: '' }
  },
  data() {
    return {
      manualCode: '',
      photoPreview: '',
      photoBlob: null,
      photoNote: '',
      savingPhoto: false,
      stream: null,
      detector: null,
      scanTimer: null
    }
  },
  watch: {
    open(value) {
      if (value) this.initScanner()
      else this.stopCamera()
    }
  },
  beforeDestroy() {
    this.stopCamera()
  },
  methods: {
    canAccessPatient(patient) {
      if (!patient) return false
      const profile = this.$store.getters['facility/accessProfileForRole']?.(this.role) || {}
      if (profile.canOpenChart) return true
      return ['NURSE', 'DOCTOR', 'NP', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR', 'PHARMACY', 'LAB'].includes(this.role)
    },
    patientFromCode(code) {
      const patients = this.$store.getters['clinical/getPatients'] || []
      const normalized = String(code || '').trim()
      return patients.find(item => item.id === normalized || item.mrn === normalized || item.externalId === normalized || item.barcode === normalized) || null
    },
    async initScanner() {
      this.manualCode = ''
      this.photoPreview = ''
      this.photoBlob = null
      this.photoNote = ''
      if ('BarcodeDetector' in window) {
        try {
          this.detector = new window.BarcodeDetector({ formats: ['code_128', 'ean_13', 'qr_code'] })
        } catch (e) {
          this.detector = null
        }
      }
      await this.startCamera()
    },
    async startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return
        this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        const video = this.$refs.video
        if (video) video.srcObject = this.stream
        this.beginScanLoop()
      } catch (e) {
        this.stopCamera()
      }
    },
    beginScanLoop() {
      if (this.scanTimer) clearInterval(this.scanTimer)
      this.scanTimer = setInterval(async () => {
        const video = this.$refs.video
        const canvas = this.$refs.canvas
        if (!video || !canvas || !this.detector || !video.videoWidth) return
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const codes = await this.detector.detect(canvas).catch(() => [])
        const first = codes && codes[0] && (codes[0].rawValue || codes[0].rawText)
        if (first) this.resolveManualScan(first)
      }, 1200)
    },
    stopCamera() {
      if (this.scanTimer) clearInterval(this.scanTimer)
      this.scanTimer = null
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop())
        this.stream = null
      }
    },
    resolveManualScan(code = this.manualCode) {
      const patient = this.patientFromCode(code)
      if (!patient) {
        this.$emit('toast', 'Patient not found for scanned code.')
        return
      }
      if (!this.canAccessPatient(patient)) {
        this.$emit('toast', 'Access denied for this role.')
        return
      }
      this.$emit('patient', patient)
    },
    handleFilePick(event) {
      const file = event.target.files && event.target.files[0]
      if (!file) return
      this.photoBlob = file
      this.photoPreview = URL.createObjectURL(file)
    },
    clearPhoto() {
      this.photoBlob = null
      this.photoPreview = ''
      this.photoNote = ''
    },
    async savePhoto() {
      if (!this.photoBlob) return
      this.savingPhoto = true
      try {
        const patient = this.patientFromCode(this.patientId) || this.patientFromCode(this.manualCode) || this.$store.getters['clinical/getPatientById']?.(this.patientId)
        if (!patient || !this.canAccessPatient(patient)) {
          this.$emit('toast', 'Unauthorized to save wound photo.')
          return
        }
        const record = await this.$store.dispatch('nursing/addWoundPhoto', {
          patientId: patient.id,
          note: this.photoNote,
          capturedAt: new Date().toISOString(),
          capturedBy: this.$store.state.auth.fullName || this.$store.state.auth.staffId || 'Clinical user',
          status: 'filed',
          source: 'bedside-camera'
        })
        this.$emit('saved', record)
        this.clearPhoto()
      } finally {
        this.savingPhoto = false
      }
    }
  }
}
</script>

<style scoped>
.scanner-dialog { background:#fff; }
.dialog-title { display:flex; align-items:flex-start; justify-content:space-between; background:#0f766e; color:#fff; padding:14px 18px; }
.dialog-title span { display:block; font-size:11px; text-transform:uppercase; opacity:.85; }
.dialog-title strong { display:block; font-size:16px; }
.scanner-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.scanner-panel { border:1px solid #dbe3e8; padding:14px; }
.scanner-video, .photo-preview { width:100%; min-height:240px; background:#0b1220; object-fit:cover; border:1px solid #cbd5e1; }
.photo-preview { display:flex; align-items:center; justify-content:center; overflow:hidden; }
.photo-preview img { width:100%; height:100%; object-fit:cover; display:block; }
.photo-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; color:#64748b; min-height:240px; }
.scanner-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
.d-none { display:none; }
@media (max-width: 900px) {
  .scanner-grid { grid-template-columns:1fr; }
}
</style>
