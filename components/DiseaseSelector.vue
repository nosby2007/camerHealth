
<template>
  <div class="gov-disease-selector">
    <v-menu offset-y transition="slide-y-transition" :close-on-content-click="false" v-model="menu" tile>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          dark
          color="#0B3D2E"
          v-bind="attrs"
          v-on="on"
          tile
          depressed
          height="44"
          class="px-5 font-weight-black text-caption ls-1"
        >
          <v-icon left size="18">mdi-virus-outline</v-icon>
          SURVEILLANCE FOCUS: {{ selectedDisease.toUpperCase() }}
          <v-icon right size="18">mdi-chevron-down</v-icon>
        </v-btn>
      </template>

      <v-card tile min-width="600" class="gov-disease-card b-1">
        <div class="pa-4 bg-navy white--text d-flex align-center">
           <v-icon dark small class="mr-2">mdi-filter-variant</v-icon>
           <span class="text-caption font-weight-black ls-1 uppercase">Epidemiological Vector Focus Selection</span>
           <v-spacer />
           <v-btn icon dark x-small @click="menu = false"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        
        <v-row no-gutters>
          <v-col cols="6" class="border-right">
            <div class="pa-4 bg-grey lighten-4 text-caption font-weight-black grey--text uppercase ls-1 border-bottom">Infectious Protocols</div>
            <v-list dense class="pa-0">
               <v-list-item v-for="d in infectious" :key="d.id" @click="select(d.name)" :class="{'gov-active-item': selectedDisease === d.name}">
                  <v-list-item-content>
                    <v-list-item-title class="text-caption font-weight-black gov-text-primary">{{ d.name.toUpperCase() }}</v-list-item-title>
                  </v-list-item-content>
                  <v-list-item-action v-if="selectedDisease === d.name">
                    <v-icon x-small color="#0B3D2E">mdi-check-circle</v-icon>
                  </v-list-item-action>
               </v-list-item>
            </v-list>
          </v-col>
          <v-col cols="6">
            <div class="pa-4 bg-grey lighten-4 text-caption font-weight-black grey--text uppercase ls-1 border-bottom">Chronic Regimes</div>
            <v-list dense class="pa-0">
               <v-list-item v-for="d in chronic" :key="d.id" @click="select(d.name)" :class="{'gov-active-item': selectedDisease === d.name}">
                  <v-list-item-content>
                    <v-list-item-title class="text-caption font-weight-black gov-text-primary">{{ d.name.toUpperCase() }}</v-list-item-title>
                  </v-list-item-content>
                  <v-list-item-action v-if="selectedDisease === d.name">
                    <v-icon x-small color="#0B3D2E">mdi-check-circle</v-icon>
                  </v-list-item-action>
               </v-list-item>
            </v-list>
          </v-col>
        </v-row>
      </v-card>
    </v-menu>
  </div>
</template>

<script>
import { diseaseInfo } from '@/store/diseases'

export default {
  data() {
    return {
      menu: false
    }
  },
  computed: {
    selectedDisease() { return this.$store.state.stats.disease },
    diseases() { return Object.values(diseaseInfo) },
    infectious() { return this.diseases.filter(d => d.type === 'Infectious') },
    chronic() { return this.diseases.filter(d => d.type === 'Chronic') }
  },
  methods: {
    select(name) {
      this.$store.commit('stats/SET_DISEASE', name);
      this.menu = false;
    }
  }
}
</script>

<style scoped>
.gov-disease-selector { display: inline-block; }
.gov-disease-card { background: white !important; }
.bg-navy { background: #0B3D2E !important; }
.gov-text-primary { color: #1B1F23 !important; }
.gov-active-item { background: #F5F7F6 !important; border-left: 4px solid #0B3D2E !important; }
.border-right { border-right: 1px solid #E2E8F0; }
.border-bottom { border-bottom: 1px solid #E2E8F0; }
.ls-1 { letter-spacing: 1px; }
.uppercase { text-transform: uppercase; }
.b-1 { border: 1px solid #E2E8F0; }
</style>