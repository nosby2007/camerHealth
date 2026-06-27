<template>
  <v-container fluid class="pa-8 content-container">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-8 pb-4 border-bottom">
      <h1 class="text-h4 font-weight-medium" style="color: #2F353A;">New Patient</h1>
      <v-btn outlined color="#20B2AA" class="text-lowercase px-4 font-weight-bold bg-white" to="/clinical/patients/new" elevation="0" style="border-width: 1px;">
        + new patient
      </v-btn>
    </div>

    <v-alert dense text color="#003366" class="mb-6 font-weight-bold text-caption">
      <v-icon left small color="#003366">mdi-clipboard-pulse</v-icon>
      Intake captures identity, safety flags, payer details, emergency contact and first department routing for the clinical workflow.
    </v-alert>

    <!-- Form Section -->
    <v-card flat class="pa-6 elevation-1 white bg-white rounded-sm">
      <v-form ref="form" v-model="valid">

        <div class="section-title mb-4">Workflow and Safety</div>

        <v-row class="mb-2">
          <v-col cols="12" md="4">
            <label class="form-label">Acuity Level</label>
            <v-select v-model="form.acuityLevel" :items="['Routine', 'Urgent', 'Emergency']" flat outlined dense class="bg-white rounded-sm"></v-select>
          </v-col>
          <v-col cols="12" md="4">
            <label class="form-label">Route To Department</label>
            <v-select v-model="form.departmentRouting" :items="departments" flat outlined dense class="bg-white rounded-sm"></v-select>
          </v-col>
          <v-col cols="12" md="4">
            <label class="form-label">Route To Service</label>
            <v-select v-model="form.serviceRouting" :items="servicesForDepartment" item-text="name" item-value="name" flat outlined dense class="bg-white rounded-sm"></v-select>
          </v-col>
        </v-row>

        <v-row class="mb-2">
          <v-col cols="12" md="4">
            <label class="form-label">Specialty</label>
            <v-select v-model="form.specialtyRouting" :items="specialtiesForDepartment" flat outlined dense class="bg-white rounded-sm"></v-select>
          </v-col>
          <v-col cols="12" md="4">
            <label class="form-label">Visit Reason</label>
            <v-text-field v-model="form.visitReason" flat outlined dense class="bg-white rounded-sm"></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <label class="form-label">PHI Access Basis</label>
            <v-select v-model="form.phiAccessBasis" :items="['Treatment', 'Payment', 'Operations', 'Emergency Override', 'Patient Request']" flat outlined dense class="bg-white rounded-sm"></v-select>
          </v-col>
        </v-row>

        <v-row class="mb-2">
          <v-col cols="12" md="6">
            <label class="form-label">Known Allergies</label>
            <v-textarea v-model="form.allergies" rows="2" flat outlined dense class="bg-white rounded-sm" placeholder="Medication, food, latex, other"></v-textarea>
          </v-col>
          <v-col cols="12" md="6">
            <label class="form-label">Current Medications</label>
            <v-textarea v-model="form.currentMeds" rows="2" flat outlined dense class="bg-white rounded-sm"></v-textarea>
          </v-col>
        </v-row>

        <div class="section-title mb-4">Patient Identity</div>
        
        <!-- Row 1 -->
        <v-row class="mb-2">
          <v-col cols="12" md="6">
            <label class="form-label">First Name <span class="error--text">*</span></label>
            <v-text-field v-model="form.firstName" flat outlined dense required :rules="[v => !!v || 'Required']" class="bg-white rounded-sm"></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <label class="form-label">Patient Status</label>
            <v-combobox v-model="form.patientStatus" :items="['New', 'Returning', 'Continuing', 'Transferred', 'Emergency']" flat outlined dense class="bg-white rounded-sm"></v-combobox>
          </v-col>
        </v-row>

        <!-- Row 2 -->
        <v-row class="mb-2">
          <v-col cols="12" md="6">
            <label class="form-label">Middle Name</label>
            <v-text-field v-model="form.middleName" flat outlined dense class="bg-white rounded-sm"></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <label class="form-label">External Patient Id</label>
            <v-text-field v-model="form.externalId" flat outlined dense class="bg-white rounded-sm"></v-text-field>
          </v-col>
        </v-row>

        <!-- Row 3 -->
        <v-row class="mb-2">
          <v-col cols="12" md="6">
            <label class="form-label">Last Name <span class="error--text">*</span></label>
            <v-text-field v-model="form.lastName" flat outlined dense required :rules="[v => !!v || 'Required']" class="bg-white rounded-sm"></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <label class="form-label">Blood Type</label>
            <v-select v-model="form.bloodType" :items="['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']" flat outlined dense class="bg-white rounded-sm"></v-select>
          </v-col>
        </v-row>

        <!-- Row 4 -->
        <v-row class="mb-2">
          <v-col cols="12" md="6">
            <label class="form-label">Sex</label>
            <v-select v-model="form.gender" :items="['Male', 'Female', 'Other']" flat outlined dense class="bg-white rounded-sm"></v-select>
          </v-col>
          <v-col cols="12" md="6">
            <label class="form-label">Clinic Site</label>
            <v-text-field v-model="form.clinicSite" flat outlined dense class="bg-white rounded-sm"></v-text-field>
          </v-col>
        </v-row>

        <!-- Row 5 -->
        <v-row class="mb-2">
          <v-col cols="12" md="6">
            <label class="form-label">Date Of Birth</label>
            <v-text-field v-model="form.dob" type="date" flat outlined dense class="bg-white rounded-sm"></v-text-field>
            <div class="text-caption grey--text mt-n4 mb-2">Age: {{ calculatedAge }}</div>
          </v-col>
          <v-col cols="12" md="6">
            <label class="form-label">Referred By</label>
            <v-text-field v-model="form.referredBy" flat outlined dense class="bg-white rounded-sm"></v-text-field>
            
            <label class="form-label mt-2 d-block">Referred Date</label>
            <v-text-field v-model="form.referredDate" type="date" flat outlined dense class="bg-white rounded-sm"></v-text-field>
          </v-col>
        </v-row>

        <!-- Row 6 -->
        <v-row class="mb-2">
          <v-col cols="12" md="6">
            <label class="form-label">Place Of Birth</label>
            <v-text-field v-model="form.placeOfBirth" flat outlined dense class="bg-white rounded-sm"></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <label class="form-label">Religion</label>
            <v-combobox v-model="form.religion" :items="['None', 'Christianity', 'Islam', 'Catholic', 'Baptist', 'Presbyterian', 'Seventh Day Adventist', 'Traditional', 'Other']" flat outlined dense class="bg-white rounded-sm"></v-combobox>
          </v-col>
        </v-row>

        <!-- Row 7 -->
        <v-row class="mb-2">
          <v-col cols="12" md="6">
            <label class="form-label">Occupation</label>
            <v-text-field v-model="form.occupation" flat outlined dense class="bg-white rounded-sm"></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <label class="form-label">Parent/Guardian</label>
            <v-text-field v-model="form.parentGuardian" flat outlined dense class="bg-white rounded-sm"></v-text-field>
          </v-col>
        </v-row>

        <!-- Row 8 -->
        <v-row class="mb-2 d-flex align-end">
          <v-col cols="12" md="6">
            <label class="form-label">Patient Type</label>
            <v-radio-group v-model="form.patientType" row class="mt-0">
              <v-radio label="Charity" value="Charity"></v-radio>
              <v-radio label="Private" value="Private"></v-radio>
            </v-radio-group>
          </v-col>
          <v-col cols="12" md="6">
            <label class="form-label">Payment Profile</label>
            <v-select v-model="form.paymentProfile" :items="['Cash', 'Insurance']" flat outlined dense class="bg-white rounded-sm"></v-select>
          </v-col>
        </v-row>

        <div class="d-flex justify-end mb-4">
            <v-btn color="#20B2AA" dark depressed class="text-none">
              <v-icon left small>mdi-plus</v-icon> Add Contact
            </v-btn>
        </div>

        <!-- Contact Section Row 1 -->
        <v-row class="mb-2">
          <v-col cols="12" md="6">
            <label class="form-label">Phone</label>
            <v-text-field v-model="form.phone" flat outlined dense class="bg-white rounded-sm"></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <label class="form-label">Email</label>
            <v-text-field v-model="form.email" flat outlined dense class="bg-white rounded-sm"></v-text-field>
          </v-col>
        </v-row>

        <!-- Contact Section Row 2 -->
        <v-row class="mb-2">
          <v-col cols="12" md="6">
            <label class="form-label">Address</label>
            <v-textarea v-model="form.address" rows="3" flat outlined dense class="bg-white rounded-sm"></v-textarea>
          </v-col>
          <v-col cols="12" md="6">
            <label class="form-label">Country</label>
            <v-combobox v-model="form.country" :items="['Cameroon', 'Nigeria', 'Chad', 'Central African Republic', 'Equatorial Guinea', 'Gabon', 'Congo']" flat outlined dense class="bg-white rounded-sm"></v-combobox>
          </v-col>
        </v-row>
        
        <v-divider class="my-6"></v-divider>

        <div class="section-title mb-4">Emergency Contact and Payer</div>

        <v-row class="mb-2">
          <v-col cols="12" md="4">
            <label class="form-label">Emergency Contact Name</label>
            <v-text-field v-model="form.emergencyContactName" flat outlined dense class="bg-white rounded-sm"></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <label class="form-label">Relationship</label>
            <v-text-field v-model="form.emergencyContactRelationship" flat outlined dense class="bg-white rounded-sm"></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <label class="form-label">Emergency Contact Phone</label>
            <v-text-field v-model="form.emergencyContactPhone" flat outlined dense class="bg-white rounded-sm"></v-text-field>
          </v-col>
        </v-row>

        <v-row class="mb-2">
          <v-col cols="12" md="4">
            <label class="form-label">Insurance Provider</label>
            <v-text-field v-model="form.insuranceProvider" flat outlined dense class="bg-white rounded-sm"></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <label class="form-label">Policy Number</label>
            <v-text-field v-model="form.policyNumber" flat outlined dense class="bg-white rounded-sm"></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <label class="form-label">Consent Status</label>
            <v-select v-model="form.consentStatus" :items="['Signed', 'Verbal', 'Pending', 'Emergency Override']" flat outlined dense class="bg-white rounded-sm"></v-select>
          </v-col>
        </v-row>

        <div class="section-title mb-4">Clinical Background</div>

        <v-row class="mb-2">
          <v-col cols="12" md="4">
            <label class="form-label">Medical History</label>
            <v-textarea v-model="form.medicalHistory" rows="3" flat outlined dense class="bg-white rounded-sm"></v-textarea>
          </v-col>
          <v-col cols="12" md="4">
            <label class="form-label">Surgical History</label>
            <v-textarea v-model="form.surgicalHistory" rows="3" flat outlined dense class="bg-white rounded-sm"></v-textarea>
          </v-col>
          <v-col cols="12" md="4">
            <label class="form-label">Family History</label>
            <v-textarea v-model="form.familyHistory" rows="3" flat outlined dense class="bg-white rounded-sm"></v-textarea>
          </v-col>
        </v-row>
        
        <!-- Actions -->
        <div class="d-flex justify-end pt-2 pb-6">
          <v-btn color="#f86c6b" dark depressed class="text-none px-6 mr-3" style="border-radius: 4px;" @click="$router.push('/clinical/patients')">
            Cancel
          </v-btn>
          <v-btn color="#C6E6F5" style="color: #20A8D8;" depressed class="text-none px-6 font-weight-bold" @click="savePatient" :disabled="!valid">
            Add
          </v-btn>
        </div>
      </v-form>
    </v-card>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      valid: false,
      form: { 
          firstName: '', 
          middleName: '', 
          lastName: '', 
          dob: '', 
          gender: 'Male', 
          bloodType: '', 
          patientStatus: 'New',
          externalId: '',
          clinicSite: '',
          referredBy: '',
          referredDate: '',
          placeOfBirth: '',
          religion: '',
          occupation: '',
          parentGuardian: '',
          patientType: 'Private',
          paymentProfile: 'Cash',
          acuityLevel: 'Routine',
          departmentRouting: 'Urgences',
          serviceRouting: '',
          specialtyRouting: '',
          phiAccessBasis: 'Treatment',
          visitReason: '',
          allergies: '',
          currentMeds: '',
          emergencyContactName: '',
          emergencyContactRelationship: '',
          emergencyContactPhone: '',
          insuranceProvider: '',
          policyNumber: '',
          consentStatus: 'Pending',
          medicalHistory: '',
          surgicalHistory: '',
          familyHistory: '',
          phone: '', 
          email: '', 
          address: '',
          country: 'Cameroon' 
      }
    }
  },
  computed: {
    hospitalDepartments() {
      return this.$store.getters['facility/getClinicalDepartments'] || []
    },
    departments() {
      const names = this.hospitalDepartments.map(department => department.name)
      return names.length ? names : ['Registration', 'Triage', 'Outpatient', 'Emergency', 'Laboratory', 'Imaging', 'Inpatient', 'Maternity', 'Pharmacy', 'Billing']
    },
    selectedDepartment() {
      return this.hospitalDepartments.find(department => department.name === this.form.departmentRouting)
    },
    servicesForDepartment() {
      return this.selectedDepartment ? (this.selectedDepartment.services || []) : []
    },
    specialtiesForDepartment() {
      return this.selectedDepartment ? (this.selectedDepartment.specialties || []) : this.$store.getters['facility/getSpecialties'] || []
    },
    calculatedAge() {
      if (!this.form.dob) return "0 months 0 days";
      const diff = new Date().getTime() - new Date(this.form.dob).getTime();
      const ageDate = new Date(diff); 
      return Math.abs(ageDate.getUTCFullYear() - 1970) + " years";
    }
  },
  methods: {
    savePatient() {
      if (this.$refs.form.validate()) {
        const fullRecord = { 
            ...this.form, 
            name: `${this.form.firstName} ${this.form.lastName}`,
          age: this.calculatedAge,
          patientStatus: this.form.acuityLevel === 'Emergency' ? 'Emergency' : this.form.patientStatus
        }
        this.$store.dispatch('clinical/registerPatient', fullRecord)
        this.$refs.form.reset(); 
        this.$toast.success('Patient record created.');
        this.$router.push('/clinical/patients')
      }
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
.form-label {
    font-size: 14px;
    font-weight: 600;
    color: #5C6873;
    display: block;
    margin-bottom: 6px;
}
  .section-title {
    border-left: 4px solid #20B2AA;
    color: #2F353A;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.8px;
    padding-left: 10px;
    text-transform: uppercase;
  }
.error--text { color: #f86c6b !important; }

/* Customizing inputs to look like HospitalRun */
::v-deep .v-input__slot {
    min-height: 38px !important;
    border-color: #E4E7EA !important;
}
::v-deep .v-text-field__details {
    display: none !important; 
}
.mb-2 {
    margin-bottom: 16px !important;
}
::v-deep .v-radio label {
    font-size: 14px;
    color: #5C6873;
}
</style>
