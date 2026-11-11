<template>
  <v-dialog :value="show" max-width="600" persistent @input="$emit('update:show', $event)">
    <v-card>
      <v-card-title>{{ $t('clinical360.flowsheets.device_data_dialog.title') }}</v-card-title>
      <v-card-text>
        <p class="subtitle">{{ $t('clinical360.flowsheets.device_data_dialog.subtitle') }}</p>

        <v-select
          v-model="selectedDevice"
          :label="$t('clinical360.flowsheets.device_data_dialog.select_device')"
          :items="deviceOptions"
          item-text="text"
          item-value="value"
          outlined
          dense
        />

        <div v-if="selectedDevice" class="device-data-preview">
          <h4>{{ $t('clinical360.flowsheets.device_data_dialog.available_data_points') }}</h4>
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
        <v-btn text small @click="$emit('update:show', false)">{{ $t('clinical360.flowsheets.device_data_dialog.cancel') }}</v-btn>
        <v-btn depressed color="#0f766e" dark small @click="importData" :disabled="!selectedDevice || !selectedPoints.length">
          {{ $t('clinical360.flowsheets.device_data_dialog.import') }}
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
      selectedPoints: []
    }
  },
  computed: {
    deviceOptions() {
      return [
        ['vitals', 'devices.vitals'],
        ['vent', 'devices.vent'],
        ['vac', 'devices.vac'],
        ['glucose', 'devices.glucose']
      ].map(([value, key]) => ({
        value,
        text: this.$t(`clinical360.flowsheets.device_data_dialog.${key}`)
      }))
    },
    availableDataPoints() {
      return [
        ['temp', 'data_points.temperature'],
        ['hr', 'data_points.heart_rate'],
        ['rr', 'data_points.respiratory_rate'],
        ['sbp', 'data_points.systolic_bp'],
        ['dbp', 'data_points.diastolic_bp'],
        ['spo2', 'data_points.spo2']
      ].map(([id, key]) => ({
        id,
        label: this.$t(`clinical360.flowsheets.device_data_dialog.${key}`)
      }))
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
