<template>
  <section class="emar-board">
    <div class="emar-time-header">
      <span>Medication</span>
      <div>
        <strong v-for="time in timeColumns" :key="time" :class="{ focus: focusTime === time }">{{ formatDisplayTime(time) }}</strong>
      </div>
      <span>Actions</span>
    </div>

    <article v-for="med in medications" :key="med.id" class="emar-row" :class="med.statusClass">
      <div class="emar-medication">
        <div>
          <v-icon small :color="med.color">{{ med.icon }}</v-icon>
          <ClinicalHoverCard :title="med.label" :eyebrow="med.route" :subtitle="med.frequency" :details="medHoverDetails(med)"><template #activator><strong class="detail-trigger">{{ med.label }}</strong></template></ClinicalHoverCard>
        </div>
        <p>{{ med.detail }}</p>
        <div class="emar-med-meta">
          <span>{{ med.route }}</span>
          <span>{{ med.frequency }}</span>
          <span>{{ med.dispense }}</span>
        </div>
        <div class="emar-admin-instructions">
          <v-icon x-small>mdi-clipboard-text-outline</v-icon>
          <span>{{ med.administrationInstructions }}</span>
        </div>
        <small v-if="showEducation">{{ med.education }}</small>
      </div>

      <div class="emar-time-grid">
        <button
          v-for="time in timeColumns"
          :key="`${med.id}-${time}`"
          type="button"
          :class="['emar-time-cell', cellFor(med.id, time).statusClass, { focus: focusTime === time }]"
          :title="cellFor(med.id, time).statusDetail || cellFor(med.id, time).text"
          @click="$emit('cell-click', { medication: med, administration: cellFor(med.id, time).administration, defaultAction: cellFor(med.id, time).defaultAction })"
        >
          <v-icon v-if="cellFor(med.id, time).icon" x-small>{{ cellFor(med.id, time).icon }}</v-icon>
          <v-icon v-if="cellFor(med.id, time).badge" x-small class="emar-cell-badge" color="#16a34a">{{ cellFor(med.id, time).badge }}</v-icon>
          <span>{{ cellFor(med.id, time).text }}</span>
        </button>
      </div>

      <div class="emar-actions">
        <button type="button" @click="$emit('row-action', { action: 'given', medication: med })">
          <v-icon x-small>mdi-check</v-icon>Administer
        </button>
        <button type="button" @click="$emit('row-action', { action: 'held', medication: med })">
          <v-icon x-small>mdi-pause</v-icon>Hold
        </button>
        <button type="button" @click="$emit('row-action', { action: 'refused', medication: med })">
          <v-icon x-small>mdi-account-cancel-outline</v-icon>Refuse
        </button>
        <button type="button" @click="$emit('open-report', med)">
          <v-icon x-small>mdi-file-document-outline</v-icon>Report
        </button>
        <button type="button" @click="$emit('open-details', med)">
          <v-icon x-small>mdi-information-outline</v-icon>Details
        </button>
      </div>
    </article>

    <div v-if="!medications.length" class="empty-orders compact">
      <v-icon size="42" color="#94a3b8">mdi-pill-off</v-icon>
      <strong>No medication in this eMAR view</strong>
      <span>Place a medication order or adjust the view filter.</span>
    </div>
  </section>
</template>

<script>
import ClinicalHoverCard from '../ClinicalHoverCard.vue'
// Icon shown once a dose has actually been GIVEN, by dosage form — the user
// asked specifically for this: what was administered should be visible at a
// glance, not just a colored square. mdi has no dedicated feeding-tube icon,
// so g-tube uses the closest available (mdi-water-pump).
const GIVEN_FORM_ICONS = {
  tablet: 'mdi-pill',
  syrup: 'mdi-bottle-tonic-outline',
  iv: 'mdi-iv-bag',
  'g-tube': 'mdi-water-pump',
  injection: 'mdi-needle',
  inhaler: 'mdi-weather-windy'
}

export default {
  name: 'EmarGrid',
  components: { ClinicalHoverCard },
  props: {
    medications: { type: Array, default: () => [] }, // each: { id, label, detail, route, frequency, dispense, administrationInstructions, education, icon, color, statusClass, form }
    administrations: { type: Array, default: () => [] }, // raw MedicationAdministration rows for the visible patient
    timeColumns: { type: Array, default: () => [] }, // ['1400', '1500', ...]
    focusTime: { type: String, default: '' },
    showEducation: { type: Boolean, default: false }
  },
  methods: {
    medHoverDetails(med) {
      return [
        { label: 'Dose', value: med.detail },
        { label: 'Dispense', value: med.dispense },
        { label: 'Instructions', value: med.administrationInstructions },
        { label: 'Education', value: med.education }
      ]
    },
    formatDisplayTime(time) {
      return time
    },
    formatSlot(iso) {
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return null
      return `${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`
    },
    findAdministration(medicationId, time) {
      return this.administrations.find(a => a.medicationId === medicationId && this.formatSlot(a.scheduledFor) === time) || null
    },
    cellFor(medicationId, time) {
      const administration = this.findAdministration(medicationId, time)
      if (!administration) return { statusClass: 'empty', text: '', icon: '', badge: '', administration: null, defaultAction: 'given' }

      const status = administration.status
      if (status === 'Refused') {
        return { statusClass: 'refused', text: 'Refused', icon: 'mdi-account-cancel-outline', badge: '', administration, defaultAction: 'details' }
      }
      if (status === 'Given') {
        const med = this.medications.find(m => m.id === medicationId)
        const icon = GIVEN_FORM_ICONS[med && med.form] || 'mdi-pill'
        return { statusClass: 'given', text: 'Given', icon, badge: 'mdi-check-circle', administration, defaultAction: 'details' }
      }
      if (status === 'Held') {
        return { statusClass: 'held', text: 'Held', icon: 'mdi-pause-circle-outline', badge: 'mdi-information-outline', statusDetail: administration.comment || administration.refusalReason || 'Medication held', administration, defaultAction: 'details' }
      }
      if (status === 'Not Available') {
        return { statusClass: 'held', text: 'N/A', icon: 'mdi-alert-circle-outline', badge: '', statusDetail: administration.comment || 'Medication not available', administration, defaultAction: 'details' }
      }
      // Due
      const isPast = new Date(administration.scheduledFor).getTime() <= Date.now()
      return { statusClass: 'due', text: isPast ? 'Due' : 'Sched', icon: '', badge: '', administration, defaultAction: 'given' }
    }
  }
}
</script>

<style scoped>
.emar-board {
  min-width: 0;
  border: 1px solid #b7c9c6;
  background: white;
  overflow-x: auto;
}
.emar-time-header,
.emar-row {
  min-width: 880px;
  display: grid;
  grid-template-columns: 270px minmax(420px, 1fr) 220px;
  gap: 6px;
  align-items: stretch;
}
.emar-time-header {
  background: #e7f4e2;
  border-bottom: 1px solid #b7c9c6;
  min-height: 32px;
  align-items: center;
  padding: 0 6px;
  color: #134e4a;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}
.emar-time-header div,
.emar-time-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(54px, 1fr));
  gap: 3px;
}
.emar-time-header strong {
  text-align: center;
  color: #1d4ed8;
  font-size: 12px;
}
.emar-time-header strong.focus {
  background: #cffafe;
  color: #0f766e;
}
.emar-row {
  border-bottom: 1px solid #e2e8f0;
  padding: 8px 6px;
}
.emar-row:last-child {
  border-bottom: 0;
}
.emar-row.active {
  border-left: 4px solid #0f766e;
}
.emar-row.pending {
  border-left: 4px solid #f97316;
}
.emar-row.held {
  border-left: 4px solid #7c3aed;
  background: #faf5ff;
}
.emar-row.stopped {
  border-left: 4px solid #64748b;
  background: #f8fafc;
}
.emar-medication {
  display: grid;
  gap: 4px;
  align-content: start;
}
.emar-medication > div:first-child {
  display: flex;
  align-items: center;
  gap: 6px;
}
.emar-medication strong {
  color: #0f172a;
  font-size: 13px;
  font-weight: 900;
  overflow-wrap: anywhere;
}
.emar-medication p {
  margin: 0;
  color: #334155;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.25;
}
.emar-medication small {
  color: #475569;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.25;
}
.emar-med-meta {
  display: flex !important;
  flex-wrap: wrap;
  gap: 4px;
}
.emar-med-meta span {
  border: 1px solid #d7e0df;
  background: #f8fafc;
  color: #334155;
  padding: 2px 5px;
  font-size: 10px;
  font-weight: 900;
}
.emar-admin-instructions {
  display: flex !important;
  align-items: flex-start !important;
  gap: 5px !important;
  margin-top: 2px;
  padding: 6px;
  border-left: 3px solid #0f766e;
  background: #ecfdf5;
  color: #134e4a;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.35;
}
.emar-time-cell {
  min-height: 42px;
  border: 1px solid #d7e0df;
  background: #f8fafc;
  color: #94a3b8;
  cursor: pointer;
  font-size: 10px;
  font-weight: 900;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  position: relative;
}
.emar-time-cell.focus {
  box-shadow: inset 0 0 0 2px #0f766e;
}
.emar-time-cell.due {
  background: #fff7ed;
  border-color: #f97316;
  color: #9a3412;
}
.emar-time-cell.given {
  background: #e8f5e9;
  border-color: #16a34a;
  color: #166534;
}
.emar-time-cell.held {
  background: #faf5ff;
  border-color: #7c3aed;
  color: #5b21b6;
}
.emar-time-cell.refused {
  background: #ffebee;
  border-color: #dc2626;
  color: #991b1b;
}
.emar-cell-badge {
  position: absolute;
  top: 1px;
  right: 1px;
}
.emar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-content: start;
  justify-content: flex-end;
}
.emar-actions button {
  border: 1px solid #d7e0df;
  background: #f8fafc;
  color: #334155;
  padding: 3px 6px;
  font-size: 10px;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 3px;
}
</style>
