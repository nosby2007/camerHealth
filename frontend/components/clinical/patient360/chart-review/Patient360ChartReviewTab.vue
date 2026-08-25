<template>
  <section class="chart-review-workspace">
    <header class="chart-review-command">
      <div>
        <span>Longitudinal chart</span>
        <strong>One clinical timeline across the current patient record</strong>
        <p>Review encounters, observations, notes, diagnostics, medications, wounds, education and filed documents without leaving Patient 360.</p>
      </div>
      <div class="chart-review-actions">
        <v-btn v-if="!readOnly" x-small depressed color="#0f766e" dark @click="$emit('action', 'notes')">
          <v-icon x-small left>mdi-note-plus-outline</v-icon>New note
        </v-btn>
        <v-btn v-if="!readOnly" x-small depressed color="#003366" dark @click="$emit('action', 'flowsheet')">
          <v-icon x-small left>mdi-clock-edit-outline</v-icon>Timed care
        </v-btn>
      </div>
    </header>

    <div class="chart-review-metrics" aria-label="Chart review summary">
      <article v-for="metric in metrics" :key="metric.label" :class="['chart-review-metric', metric.status || 'neutral']">
        <v-icon small>{{ metric.icon }}</v-icon>
        <div>
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
          <small>{{ metric.detail }}</small>
        </div>
      </article>
    </div>

    <div v-if="alerts.length" class="chart-review-alerts" aria-label="Items requiring review">
      <div class="chart-review-alert-title">
        <v-icon small color="#be123c">mdi-alert-circle-outline</v-icon>
        <strong>Attention required</strong>
      </div>
      <button v-for="alert in alerts.slice(0, 4)" :key="alert.id" type="button" @click="selectAlert(alert)">
        <span>{{ alert.label }}</span>
        <small>{{ alert.detail }}</small>
      </button>
    </div>

    <div class="chart-review-toolbar">
      <label class="chart-review-search">
        <v-icon small>mdi-magnify</v-icon>
        <input v-model.trim="query" type="search" placeholder="Search chart events, clinician or detail" aria-label="Search chart review">
        <button v-if="query" type="button" title="Clear search" aria-label="Clear search" @click="query = ''">
          <v-icon small>mdi-close</v-icon>
        </button>
      </label>
      <div class="chart-review-period" role="group" aria-label="Chart review period">
        <button
          v-for="period in periods"
          :key="period.value"
          type="button"
          :class="{ active: selectedPeriod === period.value }"
          @click="selectedPeriod = period.value"
        >
          {{ period.label }}
        </button>
      </div>
    </div>

    <div class="chart-review-categories" aria-label="Chart event categories">
      <button
        v-for="category in availableCategories"
        :key="category.key"
        type="button"
        :class="{ active: selectedCategory === category.key }"
        @click="selectedCategory = category.key"
      >
        <v-icon x-small>{{ category.icon }}</v-icon>
        {{ category.label }}
        <span>{{ category.count }}</span>
      </button>
    </div>

    <div class="chart-review-main">
      <section class="chart-review-timeline" aria-label="Clinical timeline">
        <header>
          <div>
            <strong>{{ filteredEvents.length }} event{{ filteredEvents.length === 1 ? '' : 's' }}</strong>
            <span>{{ activeFilterLabel }}</span>
          </div>
          <button type="button" :title="sortDescending ? 'Show oldest first' : 'Show newest first'" @click="sortDescending = !sortDescending">
            <v-icon small>{{ sortDescending ? 'mdi-sort-clock-descending-outline' : 'mdi-sort-clock-ascending-outline' }}</v-icon>
          </button>
        </header>

        <div v-if="filteredEvents.length" class="chart-review-event-list">
          <button
            v-for="event in filteredEvents"
            :key="event.id"
            type="button"
            :class="['chart-review-event', event.status || 'neutral', { selected: selectedEvent && selectedEvent.id === event.id }]"
            @click="selectedEventId = event.id"
          >
            <span class="chart-review-event-icon"><v-icon small>{{ event.icon }}</v-icon></span>
            <span class="chart-review-event-copy">
              <span class="chart-review-event-meta">
                <strong>{{ event.categoryLabel }}</strong>
                <time>{{ formatDate(event.at) }}</time>
              </span>
              <b>{{ event.label }}</b>
              <small>{{ event.summary || event.detail || 'No additional summary filed.' }}</small>
              <em>{{ event.clinician || 'Clinical record' }}</em>
            </span>
          </button>
        </div>
        <div v-else class="chart-review-empty">
          <v-icon>mdi-file-search-outline</v-icon>
          <strong>No chart events match this view</strong>
          <span>Change the period, category or search terms.</span>
        </div>
      </section>

      <aside class="chart-review-detail" aria-label="Selected chart event detail">
        <template v-if="selectedEvent">
          <header>
            <span :class="['chart-review-detail-icon', selectedEvent.status || 'neutral']">
              <v-icon>{{ selectedEvent.icon }}</v-icon>
            </span>
            <div>
              <span>{{ selectedEvent.categoryLabel }}</span>
              <strong>{{ selectedEvent.label }}</strong>
              <small>{{ formatDateLong(selectedEvent.at) }}</small>
            </div>
          </header>

          <dl>
            <div>
              <dt>Recorded by</dt>
              <dd>{{ selectedEvent.clinician || 'Not specified' }}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{{ selectedEvent.statusLabel || selectedEvent.status || 'Filed' }}</dd>
            </div>
            <div v-if="selectedEvent.sourceLabel">
              <dt>Source</dt>
              <dd>{{ selectedEvent.sourceLabel }}</dd>
            </div>
          </dl>

          <section>
            <h3>Clinical summary</h3>
            <p>{{ selectedEvent.detail || selectedEvent.summary || 'No narrative detail was filed for this event.' }}</p>
          </section>

          <section v-if="selectedEvent.facts && selectedEvent.facts.length">
            <h3>Filed values</h3>
            <ul>
              <li v-for="fact in selectedEvent.facts" :key="fact.label">
                <span>{{ fact.label }}</span>
                <strong>{{ fact.value }}</strong>
              </li>
            </ul>
          </section>

          <v-btn v-if="selectedEvent.targetTab" small outlined color="#0f766e" @click="$emit('navigate', selectedEvent.targetTab)">
            Open {{ selectedEvent.targetTab }}
            <v-icon small right>mdi-arrow-right</v-icon>
          </v-btn>
        </template>
        <div v-else class="chart-review-empty compact">
          <v-icon>mdi-text-box-search-outline</v-icon>
          <strong>Select a clinical event</strong>
          <span>Its complete filed context will appear here.</span>
        </div>

        <section class="chart-review-risks">
          <h3>Problems and risks</h3>
          <ul>
            <li v-for="risk in risks" :key="risk.label">
              <span>{{ risk.label }}</span>
              <strong :class="risk.status || 'neutral'">{{ risk.value }}</strong>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </section>
</template>

<script>
const CATEGORY_META = {
  encounter: { label: 'Encounters', icon: 'mdi-stethoscope' },
  observation: { label: 'Observations', icon: 'mdi-heart-pulse' },
  note: { label: 'Notes', icon: 'mdi-note-text-outline' },
  order: { label: 'Orders', icon: 'mdi-clipboard-list-outline' },
  result: { label: 'Results', icon: 'mdi-flask-outline' },
  medication: { label: 'Medications', icon: 'mdi-pill' },
  wound: { label: 'Wounds', icon: 'mdi-bandage' },
  care: { label: 'Care', icon: 'mdi-clock-check-outline' },
  education: { label: 'Education', icon: 'mdi-school-outline' },
  document: { label: 'Documents', icon: 'mdi-file-document-outline' }
}

export default {
  name: 'Patient360ChartReviewTab',
  props: {
    events: { type: Array, default: () => [] },
    metrics: { type: Array, default: () => [] },
    risks: { type: Array, default: () => [] },
    alerts: { type: Array, default: () => [] },
    readOnly: { type: Boolean, default: false }
  },
  data() {
    return {
      query: '',
      selectedCategory: 'all',
      selectedPeriod: 'all',
      selectedEventId: '',
      sortDescending: true,
      periods: [
        { label: '24h', value: '24h' },
        { label: '7d', value: '7d' },
        { label: '30d', value: '30d' },
        { label: 'All', value: 'all' }
      ]
    }
  },
  computed: {
    normalizedEvents() {
      return this.events.map((event, index) => {
        const category = CATEGORY_META[event.category] || CATEGORY_META.care
        return {
          ...event,
          id: event.id || `chart-event-${index}`,
          category: event.category || 'care',
          categoryLabel: event.categoryLabel || category.label,
          icon: event.icon || category.icon
        }
      })
    },
    availableCategories() {
      const categories = Object.keys(CATEGORY_META)
        .map(key => ({ key, ...CATEGORY_META[key], count: this.normalizedEvents.filter(event => event.category === key).length }))
        .filter(item => item.count)
      return [{ key: 'all', label: 'All', icon: 'mdi-view-list-outline', count: this.normalizedEvents.length }, ...categories]
    },
    filteredEvents() {
      const now = Date.now()
      const ranges = { '24h': 86400000, '7d': 604800000, '30d': 2592000000 }
      const search = this.query.toLowerCase()
      return this.normalizedEvents
        .filter(event => this.selectedCategory === 'all' || event.category === this.selectedCategory)
        .filter(event => {
          if (this.selectedPeriod === 'all') return true
          const at = new Date(event.at).getTime()
          return Number.isFinite(at) && now - at <= ranges[this.selectedPeriod]
        })
        .filter(event => {
          if (!search) return true
          return [event.label, event.summary, event.detail, event.clinician, event.categoryLabel]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(search)
        })
        .sort((a, b) => {
          const difference = new Date(b.at).getTime() - new Date(a.at).getTime()
          return this.sortDescending ? difference : -difference
        })
    },
    selectedEvent() {
      return this.normalizedEvents.find(event => event.id === this.selectedEventId) || this.filteredEvents[0] || null
    },
    activeFilterLabel() {
      const category = this.availableCategories.find(item => item.key === this.selectedCategory)
      const period = this.periods.find(item => item.value === this.selectedPeriod)
      return `${category ? category.label : 'All'} · ${period ? period.label : 'All time'}`
    }
  },
  watch: {
    events: {
      immediate: true,
      handler(events) {
        if (!events.some(event => event.id === this.selectedEventId)) {
          this.selectedEventId = events[0] ? events[0].id : ''
        }
      }
    },
    filteredEvents(events) {
      if (events.length && !events.some(event => event.id === this.selectedEventId)) {
        this.selectedEventId = events[0].id
      }
    }
  },
  methods: {
    selectAlert(alert) {
      if (alert.eventId) this.selectedEventId = alert.eventId
      this.selectedCategory = alert.category || 'all'
    },
    formatDate(value) {
      if (!value) return 'Date not filed'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return 'Date not filed'
      return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    },
    formatDateLong(value) {
      if (!value) return 'Date and time not filed'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return 'Date and time not filed'
      return date.toLocaleString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
  }
}
</script>

<style scoped>
.chart-review-workspace { display: grid; gap: 12px; min-width: 0; }
.chart-review-command { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 14px 16px; border-left: 4px solid #0f766e; background: #f4fbfa; }
.chart-review-command > div:first-child { display: grid; gap: 3px; }
.chart-review-command span { color: #0f766e; font-size: 11px; font-weight: 800; text-transform: uppercase; }
.chart-review-command strong { color: #16324f; font-size: 17px; }
.chart-review-command p { max-width: 780px; margin: 0; color: #526579; font-size: 12px; }
.chart-review-actions { display: flex; flex-wrap: wrap; gap: 6px; }
.chart-review-metrics { display: grid; grid-template-columns: repeat(5, minmax(130px, 1fr)); gap: 8px; }
.chart-review-metric { min-width: 0; min-height: 86px; display: flex; gap: 9px; padding: 11px; border: 1px solid #d8e2e8; border-top: 3px solid #64748b; background: #fff; }
.chart-review-metric.warning { border-top-color: #f59e0b; }
.chart-review-metric.danger { border-top-color: #be123c; }
.chart-review-metric.good { border-top-color: #0f766e; }
.chart-review-metric > div { min-width: 0; display: grid; align-content: start; gap: 2px; }
.chart-review-metric span, .chart-review-metric small { color: #64748b; font-size: 10px; }
.chart-review-metric strong { color: #16324f; font-size: 15px; line-height: 1.2; overflow-wrap: anywhere; }
.chart-review-alerts { display: grid; grid-template-columns: 150px repeat(4, minmax(130px, 1fr)); border: 1px solid #fecdd3; background: #fff7f8; }
.chart-review-alert-title, .chart-review-alerts button { min-width: 0; min-height: 54px; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; padding: 8px 10px; border-right: 1px solid #fecdd3; text-align: left; }
.chart-review-alert-title { flex-direction: row; align-items: center; gap: 6px; color: #9f1239; }
.chart-review-alerts button span { color: #881337; font-size: 11px; font-weight: 800; }
.chart-review-alerts button small { color: #7f1d1d; font-size: 10px; }
.chart-review-alerts button:hover, .chart-review-alerts button:focus-visible { background: #ffe4e6; outline: 2px solid #be123c; outline-offset: -2px; }
.chart-review-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.chart-review-search { flex: 1; max-width: 540px; min-height: 36px; display: flex; align-items: center; gap: 7px; padding: 0 10px; border: 1px solid #b9c9d2; background: #fff; }
.chart-review-search:focus-within { border-color: #0f766e; box-shadow: 0 0 0 2px rgba(15, 118, 110, .14); }
.chart-review-search input { width: 100%; min-width: 0; border: 0; outline: 0; color: #16324f; font-size: 12px; }
.chart-review-period { display: grid; grid-template-columns: repeat(4, 44px); border: 1px solid #b9c9d2; }
.chart-review-period button { min-height: 34px; border-right: 1px solid #b9c9d2; color: #526579; background: #fff; font-size: 11px; font-weight: 800; }
.chart-review-period button:last-child { border-right: 0; }
.chart-review-period button.active { color: #fff; background: #0f766e; }
.chart-review-categories { display: flex; gap: 5px; padding-bottom: 3px; overflow-x: auto; scrollbar-width: thin; }
.chart-review-categories button { flex: 0 0 auto; min-height: 32px; display: flex; align-items: center; gap: 5px; padding: 0 9px; border: 1px solid #cbd8df; background: #fff; color: #526579; font-size: 11px; font-weight: 700; }
.chart-review-categories button span { min-width: 20px; padding: 1px 5px; background: #edf3f6; color: #365469; text-align: center; }
.chart-review-categories button.active { border-color: #0f766e; background: #e9f7f5; color: #0f5f59; }
.chart-review-main { display: grid; grid-template-columns: minmax(360px, 1.25fr) minmax(280px, .75fr); gap: 10px; min-height: 520px; }
.chart-review-timeline, .chart-review-detail { min-width: 0; border: 1px solid #d4e0e6; background: #fff; }
.chart-review-timeline > header { min-height: 46px; display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #d4e0e6; background: #f7fafb; }
.chart-review-timeline > header > div { display: grid; }
.chart-review-timeline > header strong { color: #16324f; font-size: 12px; }
.chart-review-timeline > header span { color: #64748b; font-size: 10px; }
.chart-review-event-list { max-height: 640px; overflow-y: auto; }
.chart-review-event { position: relative; width: 100%; min-height: 88px; display: grid; grid-template-columns: 34px minmax(0, 1fr); gap: 10px; padding: 11px 12px; border-bottom: 1px solid #e5ecef; background: #fff; text-align: left; }
.chart-review-event::before { position: absolute; top: 0; bottom: 0; left: 0; width: 3px; background: #94a3b8; content: ''; }
.chart-review-event.warning::before { background: #f59e0b; }
.chart-review-event.danger::before { background: #be123c; }
.chart-review-event.good::before { background: #0f766e; }
.chart-review-event:hover, .chart-review-event:focus-visible, .chart-review-event.selected { background: #f1f8f8; outline: 0; }
.chart-review-event.selected { box-shadow: inset 3px 0 #0f766e; }
.chart-review-event-icon { width: 32px; height: 32px; display: grid; place-items: center; border: 1px solid #d1dde3; background: #f7fafb; color: #0f766e; }
.chart-review-event-copy { min-width: 0; display: grid; gap: 2px; }
.chart-review-event-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.chart-review-event-meta strong { color: #0f766e; font-size: 9px; text-transform: uppercase; }
.chart-review-event-meta time, .chart-review-event-copy em { color: #64748b; font-size: 9px; font-style: normal; }
.chart-review-event-copy b { color: #16324f; font-size: 12px; overflow-wrap: anywhere; }
.chart-review-event-copy small { display: -webkit-box; overflow: hidden; color: #526579; font-size: 10px; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.chart-review-detail { padding: 14px; }
.chart-review-detail > header { display: grid; grid-template-columns: 42px minmax(0, 1fr); gap: 10px; padding-bottom: 12px; border-bottom: 1px solid #e2e8ec; }
.chart-review-detail > header > div { min-width: 0; display: grid; gap: 2px; }
.chart-review-detail > header span { color: #0f766e; font-size: 10px; font-weight: 800; text-transform: uppercase; }
.chart-review-detail > header strong { color: #16324f; font-size: 15px; overflow-wrap: anywhere; }
.chart-review-detail > header small { color: #64748b; font-size: 10px; }
.chart-review-detail-icon { width: 42px; height: 42px; display: grid; place-items: center; background: #e9f7f5; }
.chart-review-detail-icon.warning { background: #fef3c7; }
.chart-review-detail-icon.danger { background: #ffe4e6; }
.chart-review-detail dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 12px 0; border: 1px solid #e2e8ec; }
.chart-review-detail dl > div { min-width: 0; display: grid; gap: 2px; padding: 8px; border-right: 1px solid #e2e8ec; }
.chart-review-detail dt { color: #64748b; font-size: 9px; text-transform: uppercase; }
.chart-review-detail dd { margin: 0; color: #16324f; font-size: 11px; font-weight: 700; overflow-wrap: anywhere; }
.chart-review-detail section { margin: 12px 0; }
.chart-review-detail h3 { margin: 0 0 5px; color: #365469; font-size: 10px; text-transform: uppercase; }
.chart-review-detail p { margin: 0; color: #334155; font-size: 11px; line-height: 1.5; white-space: pre-line; }
.chart-review-detail ul { margin: 0; padding: 0; list-style: none; }
.chart-review-detail li { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; padding: 6px 0; border-bottom: 1px solid #edf2f4; font-size: 10px; }
.chart-review-detail li span { color: #64748b; }
.chart-review-detail li strong { color: #16324f; text-align: right; overflow-wrap: anywhere; }
.chart-review-risks { padding-top: 10px; border-top: 2px solid #d4e0e6; }
.chart-review-risks li strong.warning { color: #b45309; }
.chart-review-risks li strong.danger { color: #be123c; }
.chart-review-risks li strong.good { color: #0f766e; }
.chart-review-empty { min-height: 240px; display: grid; place-content: center; justify-items: center; gap: 5px; padding: 20px; color: #64748b; text-align: center; }
.chart-review-empty strong { color: #365469; font-size: 12px; }
.chart-review-empty span { font-size: 10px; }
.chart-review-empty.compact { min-height: 180px; }
@media (max-width: 1180px) {
  .chart-review-metrics { grid-template-columns: repeat(3, minmax(130px, 1fr)); }
  .chart-review-alerts { grid-template-columns: 140px repeat(2, minmax(130px, 1fr)); }
}
@media (max-width: 840px) {
  .chart-review-command, .chart-review-toolbar { align-items: stretch; flex-direction: column; }
  .chart-review-search { max-width: none; }
  .chart-review-main { grid-template-columns: 1fr; }
  .chart-review-timeline { min-height: 420px; }
  .chart-review-detail { min-height: 360px; }
}
@media (max-width: 560px) {
  .chart-review-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .chart-review-alerts { grid-template-columns: 1fr; }
  .chart-review-alert-title, .chart-review-alerts button { border-right: 0; border-bottom: 1px solid #fecdd3; }
  .chart-review-period { grid-template-columns: repeat(4, minmax(40px, 1fr)); }
}
</style>
