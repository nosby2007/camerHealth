<template>
  <v-container fluid class="pa-8 content-container">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-8 pb-4 border-bottom">
      <h1 class="text-h4 font-weight-medium" style="color: #2F353A;">Patient Listing</h1>
      <v-btn outlined color="#20B2AA" class="text-lowercase px-4 font-weight-bold bg-white" to="/clinical/patients/new" elevation="0" style="border-width: 1px;">
        + new patient
      </v-btn>
    </div>

    <!-- Empty State -->
    <v-card flat v-if="!patients || patients.length === 0" class="pa-4 rounded-sm" style="background-color: #FCF8E3; color: #8A6D3B; border-color: #FAEBCC; border-width: 1px; border-style: solid;">
      <span>No patients found. <nuxt-link to="/clinical/patients/new" style="color: #20B2AA; text-decoration: none;">Create a new patient record?</nuxt-link></span>
    </v-card>

    <!-- Patients Table -->
    <v-card flat tile v-else class="table-container bg-transparent">
      <div class="d-flex mb-4">
        <v-text-field
          v-model="search"
          placeholder="Search"
          single-line
          hide-details
          flat
          outlined
          dense
          class="bg-white max-400 rounded-sm"
          style="border-color: #ccc;"
        ></v-text-field>
      </div>
      
      <v-data-table
        :headers="headers"
        :items="patients"
        :search="search"
        class="hospital-table elevation-0"
        hide-default-footer
      >
        <template v-slot:item.name="{ item }">
          <span style="color: #20B2AA;">{{ item.name }}</span>
        </template>
        <template v-slot:item.sex="{ item }">
          <span>{{ item.gender }}</span>
        </template>
        <template v-slot:item.contact="{ item }">
          <span>{{ item.phone }}</span>
        </template>
        <template v-slot:item.actions="{ item }">
            <v-btn icon small color="#20B2AA" title="Voir le dossier patient"
              @click="$router.push('/clinical/patients/' + item.id)">
              <v-icon small>mdi-eye</v-icon>
            </v-btn>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      search: '',
      headers: [
        { text: 'Name', align: 'start', value: 'name', class: 'table-header' },
        { text: 'Age', value: 'age', class: 'table-header' },
        { text: 'Sex', value: 'sex', class: 'table-header' },
        { text: 'Blood Type', value: 'bloodType', class: 'table-header' },
        { text: 'Patient Type', value: 'patientType', class: 'table-header' },
        { text: 'Contact', value: 'contact', class: 'table-header' },
        { text: 'Actions', value: 'actions', sortable: false, align: 'right', class: 'table-header' }
      ]
    }
  },
  computed: {
    patients() { 
      // Mapping for display
      return this.$store.getters['clinical/getPatients'] || []
    }
  }
}
</script>

<style scoped>
.content-container {
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background-color: #F8F9FA;
  min-height: 100vh;
}
.border-bottom { border-bottom: 2px solid #E2E8F0; }
.bg-white { background: white !important; }
.bg-transparent { background: transparent !important; }
.max-400 { max-width: 400px; }

.hospital-table {
  background: white !important;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
}
.hospital-table ::v-deep th { 
  background-color: #E2E8F0 !important; 
  color: #64748B !important; 
  font-size: 13px !important; 
  font-weight: 600; 
  height: 48px !important; 
  text-transform: capitalize; 
}
.hospital-table ::v-deep td { 
  border-bottom: 1px solid #F1F5F9 !important; 
  height: 50px !important; 
  color: #1B1F23;
  font-size: 14px;
}
</style>
