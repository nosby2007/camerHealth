<template>
  <v-container fluid class="pa-10">

    <!-- Header -->
    <v-row class="mb-8 align-center no-gutters">
      <v-col>
        <div class="d-flex align-center">
          <v-avatar tile color="#003366" size="48" class="mr-4 shadow-sm">
            <v-icon dark>mdi-tag-multiple</v-icon>
          </v-avatar>
          <div>
            <span class="text-caption font-weight-black grey--text text-uppercase ls-1">FACILITY ADMINISTRATION</span>
            <h1 class="text-h4 font-weight-black gov-text-primary ls-tight uppercase">Price Catalog</h1>
          </div>
        </div>
      </v-col>
      <v-spacer />
      <v-col cols="auto">
        <v-btn outlined tile height="44" color="error" class="font-weight-black text-caption ls-1 mr-3" @click="resetDialog = true">
          <v-icon left small>mdi-restore</v-icon>RESET TO DEFAULTS
        </v-btn>
        <v-btn tile depressed height="44" color="#003366" dark class="font-weight-black text-caption ls-1" @click="openAddDialog">
          <v-icon left small>mdi-plus</v-icon>ADD ITEM
        </v-btn>
      </v-col>
    </v-row>

    <!-- Tabs -->
    <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
      <v-tabs v-model="activeTab" background-color="#003366" dark slider-color="#00A99D" show-arrows>
        <v-tab v-for="section in sections" :key="section.key" class="font-weight-black text-caption ls-1">
          <v-icon left small>{{ section.icon }}</v-icon>{{ section.label }}
        </v-tab>
      </v-tabs>

      <v-tabs-items v-model="activeTab">
        <v-tab-item v-for="section in sections" :key="section.key">
          <div class="pa-4 d-flex align-center b-bottom">
            <v-text-field
              v-model="search"
              dense outlined hide-details clearable
              placeholder="Search items..."
              prepend-inner-icon="mdi-magnify"
              style="max-width:320px"
              class="text-caption"
            />
            <v-spacer />
            <span class="text-caption grey--text font-weight-bold">
              {{ activeItems(section.key).length }} active / {{ catalogSection(section.key).length }} total
            </span>
          </div>

          <v-data-table
            :headers="headersFor(section.key)"
            :items="filteredItems(section.key)"
            :items-per-page="20"
            :footer-props="{ itemsPerPageOptions: [10, 20, 50] }"
            class="gov-table"
            tile elevation="0"
          >
            <!-- Price cell — inline edit -->
            <template v-slot:item.unitPrice="{ item }">
              <div class="d-flex align-center" style="min-width:140px">
                <v-text-field
                  :value="item.unitPrice"
                  dense outlined hide-details
                  type="number" min="0"
                  suffix="XAF"
                  style="max-width:130px"
                  class="text-caption"
                  @change="val => updatePrice(section.key, item, val)"
                />
              </div>
            </template>

            <!-- Cost price (drugs only) -->
            <template v-slot:item.costPrice="{ item }">
              <span class="text-caption grey--text">{{ item.costPrice ? fmt(item.costPrice) : '—' }}</span>
            </template>

            <!-- Min/Max range (lab + imaging) -->
            <template v-slot:item.range="{ item }">
              <span v-if="item.minPrice" class="text-caption grey--text">
                {{ fmt(item.minPrice) }} – {{ fmt(item.maxPrice) }}
              </span>
              <span v-else class="text-caption grey--text">—</span>
            </template>

            <!-- Active toggle -->
            <template v-slot:item.active="{ item }">
              <v-switch
                :input-value="item.active !== false"
                dense hide-details color="#00A99D"
                class="mt-0 pt-0"
                @change="val => toggleActive(section.key, item, val)"
              />
            </template>

            <!-- Status chip -->
            <template v-slot:item.status="{ item }">
              <v-chip x-small label dark :color="item.active !== false ? '#1F7A5C' : '#9CA3AF'" class="font-weight-black">
                {{ item.active !== false ? 'ACTIVE' : 'INACTIVE' }}
              </v-chip>
            </template>
          </v-data-table>
        </v-tab-item>
      </v-tabs-items>
    </v-card>

    <!-- Reset Confirm Dialog -->
    <v-dialog v-model="resetDialog" max-width="420" tile>
      <v-card flat tile class="b-1">
        <div class="pa-6 bg-navy white--text font-weight-black text-caption ls-1 uppercase">
          <v-icon left small>mdi-alert</v-icon>RESET PRICE CATALOG
        </div>
        <div class="pa-6 text-body-2">
          This will restore <strong>all prices</strong> to the default Buea Regional Hospital price list and discard any custom changes. This cannot be undone.
        </div>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn text tile class="font-weight-black text-caption" @click="resetDialog = false">CANCEL</v-btn>
          <v-btn tile depressed color="error" dark class="font-weight-black text-caption" @click="confirmReset">RESET</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add Item Dialog -->
    <v-dialog v-model="addDialog" max-width="520" tile>
      <v-card flat tile class="b-1">
        <div class="pa-6 bg-navy white--text font-weight-black text-caption ls-1 uppercase">
          <v-icon left small>mdi-plus</v-icon>ADD CATALOG ITEM
        </div>
        <div class="pa-6">
          <v-select
            v-model="newItem.section"
            :items="sections" item-text="label" item-value="key"
            label="Section" outlined dense class="mb-3"
          />
          <v-text-field v-model="newItem.name" label="Item name" outlined dense class="mb-3" />
          <v-text-field v-model.number="newItem.unitPrice" label="Unit price (XAF)" type="number" min="0" outlined dense class="mb-3" />
          <v-text-field
            v-if="newItem.section === 'drugs'"
            v-model.number="newItem.costPrice"
            label="Cost price (XAF)" type="number" min="0" outlined dense class="mb-3"
          />
          <v-text-field
            v-if="['labTests','imaging'].includes(newItem.section)"
            v-model.number="newItem.minPrice"
            label="Min price (XAF)" type="number" min="0" outlined dense class="mb-3"
          />
          <v-text-field
            v-if="['labTests','imaging'].includes(newItem.section)"
            v-model.number="newItem.maxPrice"
            label="Max price (XAF)" type="number" min="0" outlined dense
          />
        </div>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn text tile class="font-weight-black text-caption" @click="addDialog = false">CANCEL</v-btn>
          <v-btn tile depressed color="#003366" dark class="font-weight-black text-caption" :disabled="!newItem.name || !newItem.section" @click="confirmAdd">ADD</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>
export default {
  head: { title: 'Price Catalog — Tarification' },
  data() {
    return {
      activeTab: 0,
      search: '',
      resetDialog: false,
      addDialog: false,
      newItem: { section: 'drugs', name: '', unitPrice: 0, costPrice: 0, minPrice: 0, maxPrice: 0 },
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
    activeItems(key) { return this.catalogSection(key).filter(i => i.active !== false) },
    filteredItems(key) {
      const items = this.catalogSection(key)
      if (!this.search) return items
      const q = this.search.toLowerCase()
      return items.filter(i => i.name.toLowerCase().includes(q))
    },
    headersFor(key) {
      const base = [
        { text: 'NAME', value: 'name', class: 'font-weight-black text-caption' },
        { text: 'UNIT PRICE', value: 'unitPrice', width: 160, class: 'font-weight-black text-caption' },
        { text: 'STATUS', value: 'status', width: 100, class: 'font-weight-black text-caption' },
        { text: 'ACTIVE', value: 'active', width: 80, sortable: false, class: 'font-weight-black text-caption' }
      ]
      if (key === 'drugs') base.splice(2, 0, { text: 'COST PRICE', value: 'costPrice', width: 130, class: 'font-weight-black text-caption' })
      if (['labTests', 'imaging'].includes(key)) base.splice(2, 0, { text: 'PRICE RANGE', value: 'range', width: 160, sortable: false, class: 'font-weight-black text-caption' })
      return base
    },
    updatePrice(section, item, val) {
      const price = Math.max(0, Number(val) || 0)
      this.$store.dispatch('billing/updateCatalogItem', { section, id: item.id, updates: { unitPrice: price } })
      this.$toast.success(`${item.name} → ${this.fmt(price)} XAF`)
    },
    toggleActive(section, item, val) {
      this.$store.dispatch('billing/updateCatalogItem', { section, id: item.id, updates: { active: !!val } })
    },
    confirmReset() {
      this.$store.dispatch('billing/resetCatalog')
      this.resetDialog = false
      this.$toast.success('Price catalog reset to defaults')
    },
    openAddDialog() {
      const currentSection = this.sections[this.activeTab]
      this.newItem = { section: currentSection ? currentSection.key : 'drugs', name: '', unitPrice: 0, costPrice: 0, minPrice: 0, maxPrice: 0 }
      this.addDialog = true
    },
    confirmAdd() {
      const section = this.newItem.section
      const id = `${section.slice(0, 4)}-custom-${Date.now()}`
      const item = {
        id,
        category: this.categoryFor(section),
        name: this.newItem.name,
        unitPrice: Number(this.newItem.unitPrice) || 0,
        active: true
      }
      if (section === 'drugs') item.costPrice = Number(this.newItem.costPrice) || 0
      if (['labTests', 'imaging'].includes(section)) {
        item.minPrice = Number(this.newItem.minPrice) || 0
        item.maxPrice = Number(this.newItem.maxPrice) || 0
      }
      // ADD_CATALOG_ITEM mutation — push directly via updateCatalogItem won't work for new items
      // Use the store's catalog array directly via a dedicated mutation
      this.$store.commit('billing/ADD_CATALOG_ITEM', { section, item })
      this.addDialog = false
      this.$toast.success(`${item.name} added to ${section}`)
    },
    categoryFor(section) {
      return { consultations: 'consultation', labTests: 'laboratory', imaging: 'imaging', drugs: 'drug', hospitalization: 'hospitalization', nursingActs: 'nursing_act', procedures: 'procedure' }[section] || section
    },
    fmt(val) { return Number(val).toLocaleString('fr-CM') }
  }
}
</script>

<style scoped>
.gov-card { background: white !important; }
.bg-navy { background-color: #003366 !important; }
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
