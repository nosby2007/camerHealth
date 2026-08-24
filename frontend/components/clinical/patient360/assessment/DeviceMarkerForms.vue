<template>
  <div class="device-marker-forms">
    <!-- IV Line Form -->
    <v-dialog v-model="dialogs.iv" max-width="600">
      <template #activator="{ on, attrs }">
        <v-btn small depressed color="#0369a1" dark v-bind="attrs" v-on="on">
          <v-icon small left>mdi-needle</v-icon>IV Line
        </v-btn>
      </template>
      <v-card>
        <v-card-title>IV Line Placement</v-card-title>
        <v-card-text>
          <div class="form-group">
            <label>Site Location *</label>
            <v-select
              v-model="forms.iv.site"
              :items="['Right arm', 'Left arm', 'Right hand', 'Left hand', 'Right leg', 'Left leg', 'Central line', 'PICC', 'Other']"
              outlined dense required
            />
          </div>
          <div class="form-group">
            <label>Gauge</label>
            <v-select v-model="forms.iv.gauge" :items="['18G', '20G', '22G', '24G', '26G']" outlined dense />
          </div>
          <div class="form-group">
            <label>Type</label>
            <v-select v-model="forms.iv.type" :items="['Peripheral', 'Central', 'PICC', 'Arterial']" outlined dense />
          </div>
          <div class="form-group">
            <label>Status</label>
            <v-select v-model="forms.iv.status" :items="['Patent', 'Sluggish', 'Occluded', 'Infiltrated', 'Phlebitis']" outlined dense />
          </div>
          <div class="form-group">
            <label>Insertion Date</label>
            <v-text-field v-model="forms.iv.insertionDate" type="date" outlined dense />
          </div>
          <div class="form-group">
            <label>Dressing Intact</label>
            <v-checkbox v-model="forms.iv.dressingIntact" />
          </div>
          <div class="form-group">
            <label>Notes</label>
            <v-textarea v-model="forms.iv.notes" outlined dense rows="3" />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="dialogs.iv = false">Close</v-btn>
          <v-btn color="primary" dark @click="saveDevice('iv')">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Tracheostomy Form -->
    <v-dialog v-model="dialogs.trach" max-width="600">
      <template #activator="{ on, attrs }">
        <v-btn small depressed color="#7c3aed" dark v-bind="attrs" v-on="on">
          <v-icon small left>mdi-air-filter</v-icon>Trach
        </v-btn>
      </template>
      <v-card>
        <v-card-title>Tracheostomy Management</v-card-title>
        <v-card-text>
          <div class="form-group">
            <label>Tube Size *</label>
            <v-text-field v-model="forms.trach.tubeSize" placeholder="e.g., 8mm" outlined dense required />
          </div>
          <div class="form-group">
            <label>Type</label>
            <v-select v-model="forms.trach.type" :items="['Standard cuffed', 'Standard uncuffed', 'Double-lumen', 'Fenestrated']" outlined dense />
          </div>
          <div class="form-group">
            <label>Cuff Status</label>
            <v-select v-model="forms.trach.cuffStatus" :items="['Inflated', 'Deflated']" outlined dense />
          </div>
          <div class="form-group">
            <label>Cuff Pressure (cmH2O)</label>
            <v-text-field v-model="forms.trach.cuffPressure" type="number" outlined dense />
          </div>
          <div class="form-group">
            <label>Secretions</label>
            <v-select v-model="forms.trach.secretions" :items="['Minimal', 'Moderate', 'Copious', 'Bloody', 'Purulent']" outlined dense />
          </div>
          <div class="form-group">
            <label>Last Suctioning</label>
            <v-text-field v-model="forms.trach.lastSuctioning" type="datetime-local" outlined dense />
          </div>
          <div class="form-group">
            <label>Stoma Condition</label>
            <v-select v-model="forms.trach.stomaCondition" :items="['Clean/dry', 'Redness', 'Drainage', 'Granulation', 'Infection']" outlined dense />
          </div>
          <div class="form-group">
            <label>Notes</label>
            <v-textarea v-model="forms.trach.notes" outlined dense rows="3" />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="dialogs.trach = false">Close</v-btn>
          <v-btn color="primary" dark @click="saveDevice('trach')">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Foley Catheter Form -->
    <v-dialog v-model="dialogs.foley" max-width="600">
      <template #activator="{ on, attrs }">
        <v-btn small depressed color="#0f766e" dark v-bind="attrs" v-on="on">
          <v-icon small left>mdi-water</v-icon>Foley
        </v-btn>
      </template>
      <v-card>
        <v-card-title>Foley Catheter</v-card-title>
        <v-card-text>
          <div class="form-group">
            <label>Insertion Date *</label>
            <v-text-field v-model="forms.foley.insertionDate" type="date" outlined dense required />
          </div>
          <div class="form-group">
            <label>Catheter Size (Fr) *</label>
            <v-text-field v-model="forms.foley.size" placeholder="e.g., 18Fr" outlined dense required />
          </div>
          <div class="form-group">
            <label>Urine Color</label>
            <v-select v-model="forms.foley.urineColor" :items="['Colorless', 'Pale yellow', 'Yellow', 'Dark yellow', 'Amber', 'Red', 'Brown']" outlined dense />
          </div>
          <div class="form-group">
            <label>Urine Clarity</label>
            <v-select v-model="forms.foley.urineClarity" :items="['Clear', 'Slightly cloudy', 'Cloudy', 'Very turbid']" outlined dense />
          </div>
          <div class="form-group">
            <label>Output (24h) mL</label>
            <v-text-field v-model="forms.foley.output24h" type="number" outlined dense />
          </div>
          <div class="form-group">
            <label>Catheter Status</label>
            <v-select v-model="forms.foley.status" :items="['Patent/draining well', 'Sluggish', 'No output', 'Blocked', 'Kinked', 'Removed']" outlined dense />
          </div>
          <div class="form-group">
            <label>Meatal Care Done</label>
            <v-checkbox v-model="forms.foley.meatialCareDone" />
          </div>
          <div class="form-group">
            <label>Notes</label>
            <v-textarea v-model="forms.foley.notes" outlined dense rows="3" />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="dialogs.foley = false">Close</v-btn>
          <v-btn color="primary" dark @click="saveDevice('foley')">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Drain Form -->
    <v-dialog v-model="dialogs.drain" max-width="600">
      <template #activator="{ on, attrs }">
        <v-btn small depressed color="#f97316" dark v-bind="attrs" v-on="on">
          <v-icon small left>mdi-pipe</v-icon>Drain
        </v-btn>
      </template>
      <v-card>
        <v-card-title>Drain Management</v-card-title>
        <v-card-text>
          <div class="form-group">
            <label>Drain Type *</label>
            <v-select v-model="forms.drain.type" :items="['Jackson-Pratt', 'Penrose', 'Hemovac', 'Chest tube', 'T-tube', 'Other']" outlined dense required />
          </div>
          <div class="form-group">
            <label>Location *</label>
            <v-text-field v-model="forms.drain.location" placeholder="e.g., Abdomen left lower quadrant" outlined dense required />
          </div>
          <div class="form-group">
            <label>Drain Size (Fr)</label>
            <v-text-field v-model="forms.drain.size" outlined dense />
          </div>
          <div class="form-group">
            <label>Output (24h) mL</label>
            <v-text-field v-model="forms.drain.output24h" type="number" outlined dense />
          </div>
          <div class="form-group">
            <label>Output Characteristics</label>
            <v-select v-model="forms.drain.characteristics" :items="['Clear', 'Serous', 'Serosanguinous', 'Sanguinous', 'Purulent', 'Other']" outlined dense />
          </div>
          <div class="form-group">
            <label>Suction Applied</label>
            <v-checkbox v-model="forms.drain.suctionApplied" />
          </div>
          <div class="form-group">
            <label>Suction Pressure (mmHg)</label>
            <v-text-field v-model="forms.drain.suctionPressure" type="number" outlined dense />
          </div>
          <div class="form-group">
            <label>Dressing Intact/Secure</label>
            <v-checkbox v-model="forms.drain.dressingIntact" />
          </div>
          <div class="form-group">
            <label>Notes</label>
            <v-textarea v-model="forms.drain.notes" outlined dense rows="3" />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="dialogs.drain = false">Close</v-btn>
          <v-btn color="primary" dark @click="saveDevice('drain')">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Ostomy Form -->
    <v-dialog v-model="dialogs.ostomy" max-width="600">
      <template #activator="{ on, attrs }">
        <v-btn small depressed color="#64748b" dark v-bind="attrs" v-on="on">
          <v-icon small left>mdi-circle-slice-8</v-icon>Ostomy
        </v-btn>
      </template>
      <v-card>
        <v-card-title>Ostomy Management</v-card-title>
        <v-card-text>
          <div class="form-group">
            <label>Ostomy Type *</label>
            <v-select v-model="forms.ostomy.type" :items="['Colostomy', 'Ileostomy', 'Urostomy', 'Gastrostomy', 'Jejunostomy']" outlined dense required />
          </div>
          <div class="form-group">
            <label>Location *</label>
            <v-text-field v-model="forms.ostomy.location" placeholder="e.g., Left abdomen" outlined dense required />
          </div>
          <div class="form-group">
            <label>Appliance Type</label>
            <v-select v-model="forms.ostomy.applianceType" :items="['One-piece', 'Two-piece', 'Pouch-only']" outlined dense />
          </div>
          <div class="form-group">
            <label>Appliance Condition</label>
            <v-select v-model="forms.ostomy.applianceCondition" :items="['Intact', 'Leaking', 'Odor', 'Needs change']" outlined dense />
          </div>
          <div class="form-group">
            <label>Stoma Color</label>
            <v-select v-model="forms.ostomy.stomaColor" :items="['Red/pink', 'Dark red', 'Pale', 'Black', 'Other']" outlined dense />
          </div>
          <div class="form-group">
            <label>Stoma Size (mm)</label>
            <v-text-field v-model="forms.ostomy.stomaSize" type="number" outlined dense />
          </div>
          <div class="form-group">
            <label>Peristomal Skin</label>
            <v-select v-model="forms.ostomy.peristomalSkin" :items="['Intact', 'Irritated', 'Breakdown', 'Infection']" outlined dense />
          </div>
          <div class="form-group">
            <label>Output Type</label>
            <v-select v-model="forms.ostomy.outputType" :items="['Formed stool', 'Loose stool', 'Liquid', 'Urine', 'Mucus']" outlined dense />
          </div>
          <div class="form-group">
            <label>Patient Education Done</label>
            <v-checkbox v-model="forms.ostomy.educationDone" />
          </div>
          <div class="form-group">
            <label>Notes</label>
            <v-textarea v-model="forms.ostomy.notes" outlined dense rows="3" />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="dialogs.ostomy = false">Close</v-btn>
          <v-btn color="primary" dark @click="saveDevice('ostomy')">Save</v-btn>
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
        this.$notify({ type: 'success', message: `${deviceType.toUpperCase()} recorded` })
        this.dialogs[deviceType] = false
        this.$emit('saved', { type: deviceType, data: this.forms[deviceType] })
      } catch (error) {
        this.$notify({ type: 'error', message: `Error saving ${deviceType}` })
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
