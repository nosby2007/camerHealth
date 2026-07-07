<template>
  <v-dialog :value="show" max-width="600" persistent @input="$emit('update:show', $event)">
    <v-card>
      <v-card-title>Import Device Data</v-card-title>
      <v-card-text>
        <p class="subtitle">Select device data to import into eligible flowsheet rows.</p>

        <v-select
          v-model="selectedDevice"
          label="Select Device"
          :items="deviceOptions"
          outlined
          dense
        />

        <div v-if="selectedDevice" class="device-data-preview">
          <h4>Available Data Points</h4>
          <div class="data-points">
            <div v-for="point in availableDataPoints" :key="point.id" class="data-point">
              <v-checkbox
                v-model="selectedPoints"
                :value="point.id"
                :label="point.label"
                dense
              />
            </div>
          </div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text small @click="$emit('update:show', false)">Cancel</v-btn>
        <v-btn depressed color="#0f766e" dark small @click="importData" :disabled="!selectedDevice || !selectedPoints.length">
          Import
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'DeviceDataDialog',
  props: {
    show: { type: Boolean, default: false },
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true }
  },
  data() {
    return {
      selectedDevice: null,
      selectedPoints: [],
      deviceOptions: [
        { text: 'Vitals Monitor', value: 'vitals' },
        { text: 'Ventilator', value: 'vent' },
        { text: 'Wound VAC', value: 'vac' },
        { text: 'Glucose Meter', value: 'glucose' }
      ],
      availableDataPoints: [
        { id: 'temp', label: 'Temperature' },
        { id: 'hr', label: 'Heart Rate' },
        { id: 'rr', label: 'Respiratory Rate' },
        { id: 'sbp', label: 'Systolic BP' },
        { id: 'dbp', label: 'Diastolic BP' },
        { id: 'spo2', label: 'SpO2' }
      ]
    }
  },
  watch: {
    show(val) {
      if (!val) {
        this.selectedDevice = null
        this.selectedPoints = []
      }
    }
  },
  methods: {
    importData() {
      this.$emit('import', {
        device: this.selectedDevice,
        points: this.selectedPoints,
        patientId: this.patientId,
        encounterId: this.encounterId
      })
      this.$emit('update:show', false)
    }
  }
}
</script>

<style scoped>
.subtitle {
  color: #666;
  font-size: 12px;
  margin-bottom: 16px;
}

.device-data-preview {
  margin-top: 16px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 4px;
}

.device-data-preview h4 {
  margin: 0 0 12px 0;
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.data-points {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.data-point {
  display: flex;
  align-items: center;
}
</style>
