
<template>
  <v-app>
    <v-container fluid class="entry-bg fill-height d-flex align-center justify-center">
      <div style="width:100%; max-width:680px">

        <!-- Branding -->
        <div class="text-center mb-12">
          <v-avatar tile size="72" class="mb-6">
            <v-img src="/logo.png" contain></v-img>
          </v-avatar>
          <div class="text-caption font-weight-black ls-2 uppercase grey--text mb-2">CameroHealth</div>
          <h1 class="text-h4 font-weight-black gov-text-primary ls-tight uppercase mb-2">Digitalising Health, Improving Care</h1>
        </div>

        <!-- Layer Selection -->
        <div class="text-caption font-weight-black grey--text text-center uppercase ls-2 mb-6">SELECT YOUR ACCESS LAYER</div>

        <v-row>
          <!-- Clinical Layer -->
          <v-col cols="12" sm="6">
            <v-card
              flat tile
              class="layer-card b-1 pa-10 text-center shadow-sm"
              @click="selectClinical"
            >
              <div class="layer-icon-wrap clinical mb-6 mx-auto">
                <v-icon size="40" color="white">mdi-hospital-building</v-icon>
              </div>
              <div class="text-subtitle-1 font-weight-black gov-text-primary uppercase mb-2">Clinical Layer</div>
              <div class="text-caption grey--text font-weight-medium mb-6">
                Hospital staff, doctors, nurses, laboratory and imaging personnel
              </div>
              <v-chip label small color="#0B3D2E" dark class="font-weight-black text-caption">
                FACILITY ACCESS
              </v-chip>
            </v-card>
          </v-col>

          <!-- National Health Statistics -->
          <v-col cols="12" sm="6">
            <v-card
              flat tile
              class="layer-card b-1 pa-10 text-center shadow-sm"
              @click="selectMinistry"
            >
              <div class="layer-icon-wrap ministry mb-6 mx-auto">
                <v-icon size="40" color="white">mdi-account-tie</v-icon>
              </div>
              <div class="text-subtitle-1 font-weight-black gov-text-primary uppercase mb-2">National Health Statistics</div>
              <div class="text-caption grey--text font-weight-medium mb-6">
                MINSANTE public health officers, national surveillance and epidemiology
              </div>
              <v-chip label small color="#003366" dark class="font-weight-black text-caption">
                NATIONAL ACCESS
              </v-chip>
            </v-card>
          </v-col>
        </v-row>

        <!-- Footer notice -->
        <div class="text-center mt-10">
          <v-icon x-small color="#C0392B" class="mr-1">mdi-shield-lock</v-icon>
          <div class="text-caption font-weight-black grey--text text--darken-1 uppercase ls-1 mb-1">Notice to Authorized Users</div>
          <p class="text-caption grey--text font-weight-medium mb-0" style="font-size:10px">
            This CameroHealth infrastructure is restricted to authorized Ministerial Personnel or Hospital Personnel.
            All sessions are audited under National Health Security Protocol.
          </p>
        </div>

      </div>
    </v-container>
  </v-app>
</template>

<script>
export default {
  layout: 'public',
  head: { title: 'CameroHealth — Select Layer' },
  mounted() {
    this.$store.commit('facility/RELOAD_FROM_STORAGE')
  },
  methods: {
    selectClinical() {
      const setupComplete = this.$store.state.facility.setupComplete
      this.$router.push(setupComplete ? '/login' : '/register')
    },
    selectMinistry() {
      this.$router.push('/ministry-login')
    }
  }
}
</script>

<style scoped>
.entry-bg {
  background-color: #F5F7F6;
  background-image: radial-gradient(#E2E8F0 1px, transparent 1px);
  background-size: 24px 24px;
  min-height: 100vh;
}
.gov-text-primary { color: #1B1F23 !important; }
.b-1 { border: 1px solid #E2E8F0 !important; }
.ls-tight { letter-spacing: -1.5px !important; }
.ls-1 { letter-spacing: 0.8px !important; }
.ls-2 { letter-spacing: 2px !important; }
.uppercase { text-transform: uppercase; }
.shadow-sm { box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important; }

.layer-card {
  cursor: pointer;
  background: white !important;
  border-radius: 0 !important;
  transition: all 0.2s ease;
}
.layer-card:hover {
  border-color: #003366 !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important;
}

.layer-icon-wrap {
  width: 80px; height: 80px;
  border-radius: 0;
  display: flex; align-items: center; justify-content: center;
}
.layer-icon-wrap.clinical  { background: #0B3D2E; }
.layer-icon-wrap.ministry  { background: #003366; }
</style>
