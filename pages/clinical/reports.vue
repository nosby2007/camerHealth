
<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="headline mb-4">Facility & Field Reports (Quick Submission)</h1>
      </v-col>
      
      <!-- Quick Report Form -->
      <v-col cols="12" md="4">
        <v-card outlined color="#f9f9f9">
          <v-card-title class="primary white--text">Submit Field Case Data</v-card-title>
          <v-card-text class="pt-4">
            <v-form ref="form" v-model="valid">
              <v-select v-model="form.region" :items="regions" label="Region" required></v-select>
              <v-select v-model="form.disease" :items="diseases" label="Disease Type" required></v-select>
              <v-text-field v-model.number="form.cases" label="Number of Cases" type="number" required></v-text-field>
              
              <v-select 
                v-model="form.severity" 
                :items="['Low', 'Medium', 'High', 'Critical']" 
                label="Severity Level" 
                required
              ></v-select>

              <v-select 
                v-model="form.paymentMethod" 
                :items="['Cash', 'MTN MoMo', 'Orange Money']" 
                label="Payment Method (Simulated)"
              ></v-select>

              <v-btn color="success" block class="mt-4" :disabled="!valid" @click="saveReport">
                <v-icon left>mdi-send</v-icon> Submit Report
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Field Reports History -->
      <v-col cols="12" md="8">
        <v-card outlined>
          <v-card-title>Regional Submission History</v-card-title>
          <v-data-table
            :headers="headers"
            :items="reports"
            class="elevation-1"
          >
            <template v-slot:item.severity="{ item }">
              <v-chip dark small :color="getSeverityColor(item.severity)">{{ item.severity }}</v-chip>
            </template>
            <template v-slot:item.createdAt="{ item }">
              {{ new Date(item.createdAt).toLocaleString() }}
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { diseaseInfo } from '@/store/diseases'

export default {
  data() {
    return {
      valid: false,
      form: {
        region: 'Centre',
        disease: 'Malaria',
        cases: 0,
        severity: 'Low',
        paymentMethod: 'Cash'
      },
      regions: ['Far North', 'North', 'Adamawa', 'Centre', 'South', 'East', 'West', 'Littoral', 'South-West', 'North-West'],
      headers: [
        { text: 'Region', value: 'region' },
        { text: 'Disease', value: 'disease' },
        { text: 'Cases', value: 'cases' },
        { text: 'Severity', value: 'severity' },
        { text: 'Date', value: 'createdAt' }
      ]
    }
  },
  computed: {
    reports() {
      return [...this.$store.getters['clinical/getFieldReports']].reverse()
    },
    diseases() {
      return Object.values(diseaseInfo).map(d => d.name)
    }
  },
  methods: {
    getSeverityColor(severity) {
      const colors = {
        'Low': 'green',
        'Medium': 'orange',
        'High': 'red',
        'Critical': 'purple accent-4'
      }
      return colors[severity] || 'primary'
    },
    saveReport() {
      if (this.$refs.form.validate()) {
        const info = Object.values(diseaseInfo).find(d => d.name === this.form.disease) || {};
        this.$store.dispatch('clinical/reportFieldCase', { 
           ...this.form, 
           type: info.type || 'Infectious' 
        })
        this.form.cases = 0
        this.$toast.success('Regional report submitted to queue')
      }
    }
  }
}
</script>
