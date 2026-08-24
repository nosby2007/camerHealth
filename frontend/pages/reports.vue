
<template>
  <v-container fluid class="pa-10 gov-content">
    <!-- Institutional Header (Green Identity) -->
    <v-row class="mb-10 no-gutters align-center">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar tile color="#0B3D2E" size="48" class="mr-4 shadow-sm">
             <v-icon dark>mdi-file-cabinet</v-icon>
          </v-avatar>
          <div>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">Archival Surveillance Records</span>
            <h1 class="text-h4 font-weight-black gov-text-primary ls-tight uppercase">REGIONAL FACILITY AUDIT</h1>
          </div>
        </div>
      </v-col>
      <v-spacer />
      <v-col cols="auto" v-if="medicalFacilityRecords.length > 0">
        <download-excel
          class="export-btn"
          :data="json_data"
          :fields="json_fields"
          worksheet="National Facility Audit"
          type="csv"
          name='National_Health_Resources_Report.xls'>
          <v-btn tile color="#0B3D2E" dark depressed height="44" class="px-8 font-weight-black text-caption ls-1">
            <v-icon left size="18">mdi-file-excel</v-icon>
            GENERATE EPIDEMIOLOGICAL EXPORT (.CSV)
          </v-btn>
        </download-excel>
      </v-col>
    </v-row>

    <!-- Spreadsheet Style Data Table (Green Theme) -->
    <v-card flat tile outlined class="gov-card b-1 overflow-hidden shadow-sm">
      <div class="pa-4 bg-grey lighten-4 d-flex align-center border-bottom">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="FILTER RECORDS BY FACILITY IDENTITY / REGION"
          single-line
          hide-details
          flat
          outlined
          tile
          dense
          class="bg-white rounded-0 max-400"
        ></v-text-field>
        <v-spacer />
        <span class="text-caption font-weight-black grey--text mr-4 ls-1">AUDIT TOTAL: {{ server_items_length }} RECORDS</span>
      </div>

      <v-data-table
        :headers="headers"
        :loading="loading"
        :loading-text="loadingText"
        :items="medicalFacilityRecords"
        :sort-by="['name']"
        fixed-header
        height="calc(100vh - 350px)"
        class="gov-spreadsheet-table"
        :search="search"
      >
        <template v-slot:item.available_beds="{ item }">
          <span class="font-weight-black text-center" :style="{color: getAvailableBedColor(item.available_beds)}">{{ item.available_beds }}</span>
        </template>
        <template v-slot:item.available_ventilators="{ item }">
          <span class="font-weight-black text-center" :style="{color: getAvailableVentilatorsColor(item.available_ventilators)}">{{ item.available_ventilators }}</span>
        </template>
        <template v-slot:item.masks="{ item }">
          <span class="font-weight-black text-center" :style="{color: getColorCode(item.masks)}">{{ item.masks }}</span>
        </template>
        <template v-slot:item.status="{ item }">
           <v-chip x-small label dark :color="item.status === 'Open' ? '#1F7A5C' : '#C0392B'" class="font-weight-black">{{ item.status.toUpperCase() }}</v-chip>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script>
import axios from "axios";
import _map from "lodash/map";

export default {
  data() {
    return {
      search: '',
      loading: true,
      loadingText: "Synchronizing with National Health Database...",
      server_items_length: 0,
      headers: [
        {text: "FACILITY IDENTITY", value: "name", sortable: true, filterable: true, width: '250px'},
        {text: "CLASSIFICATION", value: "amenity"},
        {text: "STATUS", value: "status"},
        {text: "TOTAL BEDS", value: "total_beds", align: 'center'},
        {text: "BEDS AVAILABLE", value: "available_beds", align: 'center'},
        {text: "ICU CAPACITY", value: "total_icu_beds", align: 'center'},
        {text: "VENTILATORS", value: "available_ventilators", align: 'center'},
        {text: "MASKS", value: "masks", align: 'center'},
        {text: "TEST KITS", value: "testing_kits", align: 'center'}
      ],
      medicalFacilityRecords: [],
      json_fields: null,
      json_data: null
    };
  },
  methods: {
    fetchAllMedicalFacilitesData: async function () {
      this.loading = true;
      try {
        const response = await axios.get(`https://sheetsu.com/apis/v1.0su/97079a6a1458/`);
        this.medicalFacilityRecords = response.data;
        this.server_items_length = this.medicalFacilityRecords.length;
        this.json_fields = this.getJsonFields();
        this.json_data = this.getJsonData();
        this.loading = false;
      } catch (error) {
        console.log(error);
        this.loading = false;
      }
    },
    getColorCode(n) { return n > 1000 ? '#166534' : (n > 199 ? '#F4A300' : '#C0392B'); },
    getAvailableBedColor(n) { return n > 100 ? '#166534' : (n > 50 ? '#F4A300' : '#C0392B'); },
    getAvailableVentilatorsColor(n) { return n > 3 ? '#166534' : (n > 2 ? '#F4A300' : '#C0392B'); },
    getJsonFields() {
      return { 'Facility Name': 'name', 'Type': 'amenity', 'Status': 'status', 'Beds': 'total_beds', 'Avail_Beds': 'available_beds', 'ICU': 'total_icu_beds', 'Ventilators': 'available_ventilators', 'Test_Kits': 'testing_kits' }
    },
    getJsonData() {
      return _map(this.medicalFacilityRecords, (f) => ({ name: f.name, amenity: f.amenity, status: f.status, total_beds: f.total_beds, available_beds: f.available_beds, total_icu_beds: f.total_icu_beds, available_ventilators: f.available_ventilators, testing_kits: f.testing_kits }))
    }
  },
  mounted() {
    this.fetchAllMedicalFacilitesData();
  }
};
</script>

<style scoped>
.gov-spreadsheet-table {
  background: white !important;
  ::v-deep th { 
    background: #0B3D2E !important; 
    color: white !important; 
    font-size: 10px !important; 
    font-weight: 800; 
    letter-spacing: 1px; 
    height: 48px !important; 
    text-transform: uppercase;
    border-right: 1px solid rgba(255,255,255,0.05) !important;
  }
  ::v-deep td { 
    border-bottom: 1px solid #E5E7EB !important; 
    border-right: 1px solid #F8FAFC !important;
    height: 44px !important;
    font-size: 13px !important;
    color: #1B1F23 !important;
    font-weight: 500;
  }
  ::v-deep tr:nth-child(even) { background-color: #F8FAFC; }
}

.gov-text-primary { color: #1B1F23 !important; }
.max-400 { max-width: 400px; }
.ls-tight { letter-spacing: -1.2px !important; }
.ls-1 { letter-spacing: 1px !important; }
.uppercase { text-transform: uppercase; }
.b-1 { border: 1px solid #E5E7EB; }
.bg-white { background: white !important; }
.shadow-sm { box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }
</style>
