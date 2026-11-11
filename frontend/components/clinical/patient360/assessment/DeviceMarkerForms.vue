<template>
  <div class="device-marker-forms">
    <!-- IV Line Form -->
    <v-dialog v-model="dialogs.iv" max-width="600">
      <template #activator="{ on, attrs }">
        <v-btn small depressed color="#0369a1" dark v-bind="attrs" v-on="on">
          <v-icon small left>mdi-needle</v-icon>{{ $t('clinical360.assessment.device_marker.iv_line') }}
        </v-btn>
      </template>
      <v-card>
        <v-card-title>{{ $t('clinical360.assessment.device_marker.iv_line_placement') }}</v-card-title>
        <v-card-text>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.site_location') }} *</label>
            <v-select
              v-model="forms.iv.site"
              :items="ivSiteItems"
              item-value="value" item-text="text"
              outlined dense required
            />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.gauge') }}</label>
            <v-select v-model="forms.iv.gauge" :items="['18G', '20G', '22G', '24G', '26G']" outlined dense />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.type') }}</label>
            <v-select v-model="forms.iv.type" :items="ivTypeItems" item-value="value" item-text="text" outlined dense />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.status') }}</label>
            <v-select v-model="forms.iv.status" :items="ivStatusItems" item-value="value" item-text="text" outlined dense />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.insertion_date') }}</label>
            <v-text-field v-model="forms.iv.insertionDate" type="date" outlined dense />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.dressing_intact') }}</label>
            <v-checkbox v-model="forms.iv.dressingIntact" />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.notes') }}</label>
            <v-textarea v-model="forms.iv.notes" outlined dense rows="3" />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="dialogs.iv = false">{{ $t('clinical360.assessment.device_marker.close') }}</v-btn>
          <v-btn color="primary" dark @click="saveDevice('iv')">{{ $t('clinical360.assessment.device_marker.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Tracheostomy Form -->
    <v-dialog v-model="dialogs.trach" max-width="600">
      <template #activator="{ on, attrs }">
        <v-btn small depressed color="#7c3aed" dark v-bind="attrs" v-on="on">
          <v-icon small left>mdi-air-filter</v-icon>{{ $t('clinical360.assessment.device_marker.trach') }}
        </v-btn>
      </template>
      <v-card>
        <v-card-title>{{ $t('clinical360.assessment.device_marker.trach_management') }}</v-card-title>
        <v-card-text>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.tube_size') }} *</label>
            <v-text-field v-model="forms.trach.tubeSize" :placeholder="$t('clinical360.assessment.device_marker.tube_size_placeholder')" outlined dense required />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.type') }}</label>
            <v-select v-model="forms.trach.type" :items="trachTypeItems" item-value="value" item-text="text" outlined dense />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.cuff_status') }}</label>
            <v-select v-model="forms.trach.cuffStatus" :items="trachCuffStatusItems" item-value="value" item-text="text" outlined dense />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.cuff_pressure') }}</label>
            <v-text-field v-model="forms.trach.cuffPressure" type="number" outlined dense />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.secretions') }}</label>
            <v-select v-model="forms.trach.secretions" :items="secretionsItems" item-value="value" item-text="text" outlined dense />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.last_suctioning') }}</label>
            <v-text-field v-model="forms.trach.lastSuctioning" type="datetime-local" outlined dense />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.stoma_condition') }}</label>
            <v-select v-model="forms.trach.stomaCondition" :items="stomaConditionItems" item-value="value" item-text="text" outlined dense />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.notes') }}</label>
            <v-textarea v-model="forms.trach.notes" outlined dense rows="3" />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="dialogs.trach = false">{{ $t('clinical360.assessment.device_marker.close') }}</v-btn>
          <v-btn color="primary" dark @click="saveDevice('trach')">{{ $t('clinical360.assessment.device_marker.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Foley Catheter Form -->
    <v-dialog v-model="dialogs.foley" max-width="600">
      <template #activator="{ on, attrs }">
        <v-btn small depressed color="#0f766e" dark v-bind="attrs" v-on="on">
          <v-icon small left>mdi-water</v-icon>{{ $t('clinical360.assessment.device_marker.foley') }}
        </v-btn>
      </template>
      <v-card>
        <v-card-title>{{ $t('clinical360.assessment.device_marker.foley_catheter') }}</v-card-title>
        <v-card-text>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.insertion_date') }} *</label>
            <v-text-field v-model="forms.foley.insertionDate" type="date" outlined dense required />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.catheter_size') }} *</label>
            <v-text-field v-model="forms.foley.size" :placeholder="$t('clinical360.assessment.device_marker.catheter_size_placeholder')" outlined dense required />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.urine_color') }}</label>
            <v-select v-model="forms.foley.urineColor" :items="urineColorItems" item-value="value" item-text="text" outlined dense />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.urine_clarity') }}</label>
            <v-select v-model="forms.foley.urineClarity" :items="urineClarityItems" item-value="value" item-text="text" outlined dense />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.output_24h') }}</label>
            <v-text-field v-model="forms.foley.output24h" type="number" outlined dense />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.catheter_status') }}</label>
            <v-select v-model="forms.foley.status" :items="foleyStatusItems" item-value="value" item-text="text" outlined dense />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.meatal_care_done') }}</label>
            <v-checkbox v-model="forms.foley.meatialCareDone" />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.notes') }}</label>
            <v-textarea v-model="forms.foley.notes" outlined dense rows="3" />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="dialogs.foley = false">{{ $t('clinical360.assessment.device_marker.close') }}</v-btn>
          <v-btn color="primary" dark @click="saveDevice('foley')">{{ $t('clinical360.assessment.device_marker.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Drain Form -->
    <v-dialog v-model="dialogs.drain" max-width="600">
      <template #activator="{ on, attrs }">
        <v-btn small depressed color="#f97316" dark v-bind="attrs" v-on="on">
          <v-icon small left>mdi-pipe</v-icon>{{ $t('clinical360.assessment.device_marker.drain') }}
        </v-btn>
      </template>
      <v-card>
        <v-card-title>{{ $t('clinical360.assessment.device_marker.drain_management') }}</v-card-title>
        <v-card-text>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.drain_type') }} *</label>
            <v-select v-model="forms.drain.type" :items="drainTypeItems" item-value="value" item-text="text" outlined dense required />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.location') }} *</label>
            <v-text-field v-model="forms.drain.location" :placeholder="$t('clinical360.assessment.device_marker.drain_location_placeholder')" outlined dense required />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.drain_size') }}</label>
            <v-text-field v-model="forms.drain.size" outlined dense />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.output_24h') }}</label>
            <v-text-field v-model="forms.drain.output24h" type="number" outlined dense />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.output_characteristics') }}</label>
            <v-select v-model="forms.drain.characteristics" :items="characteristicsItems" item-value="value" item-text="text" outlined dense />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.suction_applied') }}</label>
            <v-checkbox v-model="forms.drain.suctionApplied" />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.suction_pressure') }}</label>
            <v-text-field v-model="forms.drain.suctionPressure" type="number" outlined dense />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.dressing_intact_secure') }}</label>
            <v-checkbox v-model="forms.drain.dressingIntact" />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.notes') }}</label>
            <v-textarea v-model="forms.drain.notes" outlined dense rows="3" />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="dialogs.drain = false">{{ $t('clinical360.assessment.device_marker.close') }}</v-btn>
          <v-btn color="primary" dark @click="saveDevice('drain')">{{ $t('clinical360.assessment.device_marker.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Ostomy Form -->
    <v-dialog v-model="dialogs.ostomy" max-width="600">
      <template #activator="{ on, attrs }">
        <v-btn small depressed color="#64748b" dark v-bind="attrs" v-on="on">
          <v-icon small left>mdi-circle-slice-8</v-icon>{{ $t('clinical360.assessment.device_marker.ostomy') }}
        </v-btn>
      </template>
      <v-card>
        <v-card-title>{{ $t('clinical360.assessment.device_marker.ostomy_management') }}</v-card-title>
        <v-card-text>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.ostomy_type') }} *</label>
            <v-select v-model="forms.ostomy.type" :items="ostomyTypeItems" item-value="value" item-text="text" outlined dense required />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.location') }} *</label>
            <v-text-field v-model="forms.ostomy.location" :placeholder="$t('clinical360.assessment.device_marker.ostomy_location_placeholder')" outlined dense required />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.appliance_type') }}</label>
            <v-select v-model="forms.ostomy.applianceType" :items="applianceTypeItems" item-value="value" item-text="text" outlined dense />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.appliance_condition') }}</label>
            <v-select v-model="forms.ostomy.applianceCondition" :items="applianceConditionItems" item-value="value" item-text="text" outlined dense />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.stoma_color') }}</label>
            <v-select v-model="forms.ostomy.stomaColor" :items="stomaColorItems" item-value="value" item-text="text" outlined dense />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.stoma_size') }}</label>
            <v-text-field v-model="forms.ostomy.stomaSize" type="number" outlined dense />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.peristomal_skin') }}</label>
            <v-select v-model="forms.ostomy.peristomalSkin" :items="peristomalSkinItems" item-value="value" item-text="text" outlined dense />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.output_type') }}</label>
            <v-select v-model="forms.ostomy.outputType" :items="outputTypeItems" item-value="value" item-text="text" outlined dense />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.patient_education_done') }}</label>
            <v-checkbox v-model="forms.ostomy.educationDone" />
          </div>
          <div class="form-group">
            <label>{{ $t('clinical360.assessment.device_marker.notes') }}</label>
            <v-textarea v-model="forms.ostomy.notes" outlined dense rows="3" />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="dialogs.ostomy = false">{{ $t('clinical360.assessment.device_marker.close') }}</v-btn>
          <v-btn color="primary" dark @click="saveDevice('ostomy')">{{ $t('clinical360.assessment.device_marker.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'DeviceMarkerForms',
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true }
  },
  data() {
    return {
      dialogs: { iv: false, trach: false, foley: false, drain: false, ostomy: false },
      forms: {
        iv: { site: '', gauge: '', type: '', status: '', insertionDate: '', dressingIntact: false, notes: '' },
        trach: { tubeSize: '', type: '', cuffStatus: '', cuffPressure: '', secretions: '', lastSuctioning: '', stomaCondition: '', notes: '' },
        foley: { insertionDate: '', size: '', urineColor: '', urineClarity: '', output24h: '', status: '', meatialCareDone: false, notes: '' },
        drain: { type: '', location: '', size: '', output24h: '', characteristics: '', suctionApplied: false, suctionPressure: '', dressingIntact: false, notes: '' },
        ostomy: { type: '', location: '', applianceType: '', applianceCondition: '', stomaColor: '', stomaSize: '', peristomalSkin: '', outputType: '', educationDone: false, notes: '' }
      }
    }
  },
  computed: {
    ivSiteItems() {
      return [
        ['Right arm', 'iv_site_right_arm'],
        ['Left arm', 'iv_site_left_arm'],
        ['Right hand', 'iv_site_right_hand'],
        ['Left hand', 'iv_site_left_hand'],
        ['Right leg', 'iv_site_right_leg'],
        ['Left leg', 'iv_site_left_leg'],
        ['Central line', 'iv_site_central_line'],
        ['PICC', 'iv_site_picc'],
        ['Other', 'iv_site_other']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.assessment.device_marker.${key}`) }))
    },
    ivTypeItems() {
      return [
        ['Peripheral', 'iv_type_peripheral'],
        ['Central', 'iv_type_central'],
        ['PICC', 'iv_type_picc'],
        ['Arterial', 'iv_type_arterial']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.assessment.device_marker.${key}`) }))
    },
    ivStatusItems() {
      return [
        ['Patent', 'iv_status_patent'],
        ['Sluggish', 'iv_status_sluggish'],
        ['Occluded', 'iv_status_occluded'],
        ['Infiltrated', 'iv_status_infiltrated'],
        ['Phlebitis', 'iv_status_phlebitis']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.assessment.device_marker.${key}`) }))
    },
    trachTypeItems() {
      return [
        ['Standard cuffed', 'trach_type_standard_cuffed'],
        ['Standard uncuffed', 'trach_type_standard_uncuffed'],
        ['Double-lumen', 'trach_type_double_lumen'],
        ['Fenestrated', 'trach_type_fenestrated']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.assessment.device_marker.${key}`) }))
    },
    trachCuffStatusItems() {
      return [
        ['Inflated', 'trach_cuff_inflated'],
        ['Deflated', 'trach_cuff_deflated']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.assessment.device_marker.${key}`) }))
    },
    secretionsItems() {
      return [
        ['Minimal', 'secretions_minimal'],
        ['Moderate', 'secretions_moderate'],
        ['Copious', 'secretions_copious'],
        ['Bloody', 'secretions_bloody'],
        ['Purulent', 'secretions_purulent']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.assessment.device_marker.${key}`) }))
    },
    stomaConditionItems() {
      return [
        ['Clean/dry', 'stoma_condition_clean_dry'],
        ['Redness', 'stoma_condition_redness'],
        ['Drainage', 'stoma_condition_drainage'],
        ['Granulation', 'stoma_condition_granulation'],
        ['Infection', 'stoma_condition_infection']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.assessment.device_marker.${key}`) }))
    },
    urineColorItems() {
      return [
        ['Colorless', 'urine_color_colorless'],
        ['Pale yellow', 'urine_color_pale_yellow'],
        ['Yellow', 'urine_color_yellow'],
        ['Dark yellow', 'urine_color_dark_yellow'],
        ['Amber', 'urine_color_amber'],
        ['Red', 'urine_color_red'],
        ['Brown', 'urine_color_brown']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.assessment.device_marker.${key}`) }))
    },
    urineClarityItems() {
      return [
        ['Clear', 'urine_clarity_clear'],
        ['Slightly cloudy', 'urine_clarity_slightly_cloudy'],
        ['Cloudy', 'urine_clarity_cloudy'],
        ['Very turbid', 'urine_clarity_very_turbid']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.assessment.device_marker.${key}`) }))
    },
    foleyStatusItems() {
      return [
        ['Patent/draining well', 'foley_catheter_status_patent_draining_well'],
        ['Sluggish', 'foley_catheter_status_sluggish'],
        ['No output', 'foley_catheter_status_no_output'],
        ['Blocked', 'foley_catheter_status_blocked'],
        ['Kinked', 'foley_catheter_status_kinked'],
        ['Removed', 'foley_catheter_status_removed']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.assessment.device_marker.${key}`) }))
    },
    drainTypeItems() {
      return [
        ['Jackson-Pratt', 'drain_type_jackson_pratt'],
        ['Penrose', 'drain_type_penrose'],
        ['Hemovac', 'drain_type_hemovac'],
        ['Chest tube', 'drain_type_chest_tube'],
        ['T-tube', 'drain_type_t_tube'],
        ['Other', 'drain_type_other']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.assessment.device_marker.${key}`) }))
    },
    characteristicsItems() {
      return [
        ['Clear', 'characteristics_clear'],
        ['Serous', 'characteristics_serous'],
        ['Serosanguinous', 'characteristics_serosanguinous'],
        ['Sanguinous', 'characteristics_sanguinous'],
        ['Purulent', 'characteristics_purulent'],
        ['Other', 'characteristics_other']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.assessment.device_marker.${key}`) }))
    },
    ostomyTypeItems() {
      return [
        ['Colostomy', 'ostomy_type_colostomy'],
        ['Ileostomy', 'ostomy_type_ileostomy'],
        ['Urostomy', 'ostomy_type_urostomy'],
        ['Gastrostomy', 'ostomy_type_gastrostomy'],
        ['Jejunostomy', 'ostomy_type_jejunostomy']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.assessment.device_marker.${key}`) }))
    },
    applianceTypeItems() {
      return [
        ['One-piece', 'appliance_type_one_piece'],
        ['Two-piece', 'appliance_type_two_piece'],
        ['Pouch-only', 'appliance_type_pouch_only']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.assessment.device_marker.${key}`) }))
    },
    applianceConditionItems() {
      return [
        ['Intact', 'appliance_condition_intact'],
        ['Leaking', 'appliance_condition_leaking'],
        ['Odor', 'appliance_condition_odor'],
        ['Needs change', 'appliance_condition_needs_change']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.assessment.device_marker.${key}`) }))
    },
    stomaColorItems() {
      return [
        ['Red/pink', 'stoma_color_red_pink'],
        ['Dark red', 'stoma_color_dark_red'],
        ['Pale', 'stoma_color_pale'],
        ['Black', 'stoma_color_black'],
        ['Other', 'stoma_color_other']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.assessment.device_marker.${key}`) }))
    },
    peristomalSkinItems() {
      return [
        ['Intact', 'peristomal_skin_intact'],
        ['Irritated', 'peristomal_skin_irritated'],
        ['Breakdown', 'peristomal_skin_breakdown'],
        ['Infection', 'peristomal_skin_infection']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.assessment.device_marker.${key}`) }))
    },
    outputTypeItems() {
      return [
        ['Formed stool', 'output_type_formed_stool'],
        ['Loose stool', 'output_type_loose_stool'],
        ['Liquid', 'output_type_liquid'],
        ['Urine', 'output_type_urine'],
        ['Mucus', 'output_type_mucus']
      ].map(([value, key]) => ({ value, text: this.$t(`clinical360.assessment.device_marker.${key}`) }))
    }
  },
  methods: {
    ...mapActions('nursing', ['createDeviceMarker']),
    async saveDevice(deviceType) {
      try {
        await this.createDeviceMarker({
          patientId: this.patientId,
          encounterId: this.encounterId,
          type: deviceType,
          data: this.forms[deviceType],
          recordedAt: new Date().toISOString()
        })
        const deviceLabel = this.$t(`clinical360.assessment.device_marker.device_type_${deviceType}`)
        this.$notify({ type: 'success', message: this.$t('clinical360.assessment.device_marker.recorded_message', { device: deviceLabel }) })
        this.dialogs[deviceType] = false
        this.$emit('saved', { type: deviceType, data: this.forms[deviceType] })
      } catch (error) {
        const deviceLabel = this.$t(`clinical360.assessment.device_marker.device_type_${deviceType}`)
        this.$notify({ type: 'error', message: this.$t('clinical360.assessment.device_marker.error_saving_message', { device: deviceLabel }) })
      }
    }
  }
}
</script>

<style scoped>
.device-marker-forms {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-weight: 700;
  font-size: 12px;
  color: #334155;
  margin-bottom: 6px;
}
</style>
