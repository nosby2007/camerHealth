<template>
  <v-container fluid class="pa-10">

    <!-- Header -->
    <v-row class="mb-8 align-center no-gutters">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar tile color="#00A99D" size="48" class="mr-4 shadow-sm">
            <v-icon dark>mdi-tag-multiple</v-icon>
          </v-avatar>
          <div>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">CASH OFFICE</span>
            <h1 class="text-h4 font-weight-black gov-text-primary ls-tight uppercase">Price Catalog</h1>
            <div class="text-caption grey--text mt-1">Read-only view of all prices · Managed by Administration</div>
          </div>
        </div>
      </v-col>
      <v-spacer />
      <v-col cols="auto">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search any item, alias or section..."
          outlined tile dense hide-details
          class="rounded-0"
          style="min-width:320px"
        ></v-text-field>
      </v-col>
    </v-row>

    <!-- Tabs -->
    <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
      <v-tabs v-model="activeTab" background-color="#003366" dark slider-color="#00A99D" show-arrows>
        <v-tab v-for="section in sections" :key="section.key" class="font-weight-black text-caption ls-1">
          <v-icon left small>{{ section.icon }}</v-icon>{{ section.label }}
          <v-chip v-if="activeCount(section.key) > 0" x-small dark color="#00A99D" class="ml-2 font-weight-black">{{ activeCount(section.key) }}</v-chip>
        </v-tab>
      </v-tabs>

      <v-tabs-items v-model="activeTab">
        <v-tab-item v-for="section in sections" :key="section.key">
          <div class="pa-4 bg-grey lighten-4 b-bottom d-flex align-center">
            <span class="text-caption grey--text font-weight-bold">
              {{ activeItems(section.key).length }} active items
            </span>
          </div>

          <v-data-table
            :headers="headersFor(section.key)"
            :items="filteredItems(section.key)"
            :items-per-page="25"
            :footer-props="{ itemsPerPageOptions: [10, 25, 50] }"
            class="gov-table"
            tile elevation="0"
            :search="search"
          >
            <template v-slot:item.unitPrice="{ item }">
              <span class="font-weight-black gov-text-primary">{{ fmt(item.unitPrice) }}</span>
            </template>

            <template v-slot:item.costPrice="{ item }">
              <span v-if="item.costPrice" class="grey--text">{{ fmt(item.costPrice) }}</span>
              <span v-else class="grey--text">—</span>
            </template>

            <template v-slot:item.range="{ item }">
              <span v-if="item.minPrice" class="grey--text">{{ fmt(item.minPrice) }} – {{ fmt(item.maxPrice) }}</span>
              <span v-else class="grey--text">—</span>
            </template>

            <template v-slot:item.status="{ item }">
              <v-chip x-small label dark :color="item.active !== false ? '#1F7A5C' : '#9CA3AF'" class="font-weight-black">
                {{ item.active !== false ? 'ACTIVE' : 'INACTIVE' }}
              </v-chip>
            </template>
          </v-data-table>
        </v-tab-item>
      </v-tabs-items>
    </v-card>

    <div class="text-caption grey--text mt-4 font-italic text-center">
      Prices are managed by Facility Administration. Contact your admin to request price changes.
    </div>

  </v-container>
</template>

<script>
export default {
  head: { title: 'Price Catalog — Cash Office' },
  data() {
    return {
      activeTab: 0,
      search: '',
      sections: [
        { key: 'consultations',   label: 'Consultations',  icon: 'mdi-stethoscope' },
        { key: 'labTests',        label: 'Laboratory',     icon: 'mdi-flask' },
        { key: 'imaging',         label: 'Imaging',        icon: 'mdi-radiology-box' },
        { key: 'drugs',           label: 'Drugs',          icon: 'mdi-pill' },
        { key: 'hospitalization', label: 'Hospitalisation',icon: 'mdi-bed' },
        { key: 'nursingActs',     label: 'Nursing Acts',   icon: 'mdi-medical-bag' },
        { key: 'supplies',        label: 'Supplies',       icon: 'mdi-syringe' },
        { key: 'procedures',      label: 'Procedures',     icon: 'mdi-scissors-cutting' }
      ]
    }
  },
  mounted() {
    this.$store.dispatch('billing/loadFromStorage')
  },
  computed: {
    catalog() { return this.$store.getters['billing/catalog'] }
  },
  methods: {
    catalogSection(key) { return this.catalog[key] || [] },
    activeCount(key) { return this.catalogSection(key).filter(i => i.active !== false).length },
    activeItems(key) { return this.catalogSection(key).filter(i => i.active !== false) },
    filteredItems(key) {
      const items = this.catalogSection(key)
      if (!this.search) return items
      const q = this.search.toLowerCase()
      return items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.aliases && i.aliases.some(a => a.toLowerCase().includes(q)))
      )
    },
    headersFor(key) {
      const base = [
        { text: 'NAME', value: 'name', class: 'font-weight-black text-caption' },
        { text: 'UNIT PRICE', value: 'unitPrice', width: 140, class: 'font-weight-black text-caption' },
        { text: 'STATUS', value: 'status', width: 100, class: 'font-weight-black text-caption' }
      ]
      if (key === 'drugs') base.splice(2, 0, { text: 'COST PRICE', value: 'costPrice', width: 130, class: 'font-weight-black text-caption' })
      if (['labTests', 'imaging'].includes(key)) base.splice(2, 0, { text: 'PRICE RANGE', value: 'range', width: 160, sortable: false, class: 'font-weight-black text-caption' })
      return base
    },
    fmt(val) { return 'XAF ' + Number(val || 0).toLocaleString() }
  }
}
</script>

<style scoped>
.gov-card { background: white !important; }
.gov-text-primary { color: #1B1F23 !important; }
.b-1 { border: 1px solid #E5E7EB; }
.b-bottom { border-bottom: 1px solid #E5E7EB; }
.shadow-sm { box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }
.ls-tight { letter-spacing: -1.2px !important; }
.ls-1 { letter-spacing: 0.8px !important; }
.uppercase { text-transform: uppercase; }
.gov-table { background: white !important; }
.gov-table ::v-deep th { background: #F8FAFC !important; color: #1B1F23 !important; font-size: 10px !important; font-weight: 800; text-transform: uppercase; }
.gov-table ::v-deep td { font-size: 12px !important; }
</style>
