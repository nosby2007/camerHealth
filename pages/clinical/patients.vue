
<template>
  <v-container fluid class="gov-content pa-10">
    <v-row class="mb-10 no-gutters align-center">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar tile color="#00A99D" size="48" class="mr-4 shadow-sm">
             <v-icon dark>mdi-account-group</v-icon>
          </v-avatar>
          <div>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">OFFICIAL CIVIL HEALTH REGISTRY</span>
            <h1 class="text-h4 font-weight-black gov-text-primary ls-tight uppercase">PATIENT IDENTIFICATION HUB</h1>
          </div>
        </div>
      </v-col>
      <v-spacer />
      <v-col cols="auto">
        <v-btn outlined color="#00A99D" depressed tile height="44" class="px-6 font-weight-black text-caption ls-1" @click="exportData">
          <v-icon left small>mdi-database-export</v-icon>
          EXPORT REGISTRY (.JSON)
        </v-btn>
      </v-col>
    </v-row>
    
    <v-row class="no-gutters">
      <!-- Institutional Registration Module -->
      <v-col cols="12" lg="4">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-navy white--text font-weight-black text-caption ls-1 uppercase">
            REGISTRATION UNIT: ALPHA-1
          </div>
          <div class="pa-8">
            <div class="text-caption font-weight-black grey--text text--darken-2 mb-6 uppercase ls-1 px-2 border-left">Patient Identification</div>
            <v-form ref="form" v-model="valid">

              <v-text-field v-model="form.name" label="Name" tile flat outlined dense required :rules="[v => !!v || 'Required']" class="mb-4 rounded-0"></v-text-field>

              <v-row dense>
                <v-col cols="6">
                  <v-text-field v-model="form.dob" label="Date of Birth" type="date" tile flat outlined dense class="mb-4 rounded-0"></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field v-model.number="form.age" label="Age" type="number" tile flat outlined dense required :rules="[v => !!v || 'Required']" class="mb-4 rounded-0" hide-spin-buttons></v-text-field>
                </v-col>
              </v-row>

              <v-row dense>
                <v-col cols="6">
                  <v-select v-model="form.gender" :items="['Male', 'Female', 'Other']" label="Sex" tile flat outlined dense required class="mb-4 rounded-0"></v-select>
                </v-col>
                <v-col cols="6">
                  <v-select v-model="form.maritalStatus" :items="['Single', 'Married', 'Divorced', 'Widowed']" label="Marital Status" tile flat outlined dense class="mb-4 rounded-0"></v-select>
                </v-col>
              </v-row>

              <v-text-field v-model="form.occupation" label="Occupation" tile flat outlined dense class="mb-4 rounded-0"></v-text-field>

              <v-select v-model="form.religion" :items="['Christianity', 'Islam', 'Traditional', 'Other', 'None']" label="Religion" tile flat outlined dense class="mb-4 rounded-0"></v-select>

              <v-select v-model="form.region" :items="regions" label="Region" tile flat outlined dense required class="mb-4 rounded-0"></v-select>

              <v-text-field v-model="form.address" label="Address" tile flat outlined dense class="mb-4 rounded-0"></v-text-field>

              <v-text-field v-model="form.phone" label="Contact" tile flat outlined dense class="mb-4 rounded-0"></v-text-field>

              <v-text-field v-model="form.emergencyContact" label="Person to Contact" tile flat outlined dense class="mb-4 rounded-0"></v-text-field>

              <v-text-field v-model="form.emergencyPhone" label="Number of Person to Contact" tile flat outlined dense class="mb-8 rounded-0"></v-text-field>
              
              <v-divider class="mb-8 grey lighten-4"></v-divider>
              
              <v-btn color="#00A99D" dark block height="54" tile depressed :disabled="!valid" @click="savePatient" class="font-weight-black text-caption ls-1">
                COMMIT RECORD TO CENTRAL Digitalising Health, Improving Care DATABASE
                <v-icon right small>mdi-check-bold</v-icon>
              </v-btn>
            </v-form>
          </div>
        </v-card>
      </v-col>

      <!-- Registry Explorer (Traditional Table Style) -->
      <v-col cols="12" lg="8" class="pl-lg-8">
        <v-card flat tile class="gov-card b-1 overflow-hidden shadow-sm">
          <div class="pa-4 bg-grey lighten-4 d-flex align-center border-bottom">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="GLOBAL IDENTIFIER SEARCH"
              single-line
              hide-details
              flat
              outlined
              tile
              dense
              class="bg-white rounded-0 max-400"
            ></v-text-field>
          </div>
          <v-data-table
            :headers="headers"
            :items="patients"
            :search="search"
            class="gov-spreadsheet-table"
            tile
            elevation="0"
          >
            <template v-slot:item.id="{ item }">
              <span class="text-caption font-weight-black grey--text opacity-50">{{ item.id }}</span>
            </template>
            <template v-slot:item.name="{ item }">
              <div>
                <div class="text-caption font-weight-black grey--text">{{ item.id }}</div>
                <div class="text-body-2 font-weight-black gov-text-primary">{{ item.name.toUpperCase() }}</div>
              </div>
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip x-small dark label color="#00A99D" class="font-weight-black">ACTIVE</v-chip>
            </template>
            <template v-slot:item.createdAt="{ item }">
              <span class="text-caption font-weight-black grey--text">{{ new Date(item.createdAt).toLocaleDateString() }}</span>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      valid: false,
      search: '',
      form: { name: '', age: null, dob: '', gender: 'Male', maritalStatus: 'Single', occupation: '', religion: '', region: 'Centre', address: '', phone: '', emergencyContact: '', emergencyPhone: '' },
      regions: ['Far North', 'North', 'Adamawa', 'Centre', 'South', 'East', 'West', 'Littoral', 'South-West', 'North-West'],
      headers: [
        { text: 'NAME',        value: 'name' },
        { text: 'AGE',         value: 'age',        sortable: true },
        { text: 'SEX',         value: 'gender' },
        { text: 'REGION',      value: 'region' },
        { text: 'CONTACT',     value: 'phone' },
        { text: 'COMMIT DATE', value: 'createdAt',  align: 'right' }
      ]
    }
  },
  computed: {
    patients() { return this.$store.getters['clinical/getPatients'] }
  },
  methods: {
    savePatient() {
      if (this.$refs.form.validate()) {
        this.$store.dispatch('clinical/registerPatient', this.form)
        this.$refs.form.reset(); this.form.gender = 'Male'; this.form.region = 'Centre'; this.form.maritalStatus = 'Single';
        this.$toast.success('Patient record committed safely to Site Registry.');
      }
    },
    exportData() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.patients));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "patient_registry_export.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    }
  }
}
</script>

<style scoped>
.gov-card { background: white !important; }
.bg-navy { background-color: #003366 !important; }
.gov-text-primary { color: #1B1F23 !important; }
.border-left { border-left: 4px solid #00A99D; }
.border-bottom { border-bottom: 1px solid #E5E7EB; }
.b-1 { border: 1px solid #E5E7EB; }
.bg-white { background: white !important; }
.max-400 { max-width: 400px; }
.shadow-sm { box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }

.gov-spreadsheet-table {
  background: white !important;
  ::v-deep th { background: #F8FAFC !important; border-bottom: 2px solid #E2E8F0 !important; color: #1B1F23 !important; font-size: 10px !important; font-weight: 800; letter-spacing: 1px; height: 48px !important; text-transform: uppercase; }
  ::v-deep td { border-bottom: 1px solid #F1F5F9 !important; height: 50px !important; }
}

.ls-tight { letter-spacing: -1.2px !important; }
.ls-1 { letter-spacing: 0.8px !important; }
.uppercase { text-transform: uppercase; }
.opacity-50 { opacity: 0.5; }
</style>
