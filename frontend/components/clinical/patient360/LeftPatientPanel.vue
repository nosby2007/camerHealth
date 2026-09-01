<template>
  <aside class="left-patient-panel" :class="{ collapsed }">
    <button
      type="button"
      class="panel-toggle"
      :aria-expanded="(!collapsed).toString()"
      aria-controls="patient-left-panel-body"
      :aria-label="collapsed ? $t('clinical360.nursing.patient_context.expand') : $t('clinical360.nursing.patient_context.collapse')"
      @click="$emit('toggle')"
    >
      <v-icon small>
        {{ collapsed ? 'mdi-chevron-right' : 'mdi-chevron-left' }}
      </v-icon>
    </button>

    <div v-if="!collapsed" id="patient-left-panel-body" class="panel-body">
      <div class="storyboard-identity">
        <div class="avatar-ring">
          <span>{{ patient.initials }}</span>
        </div>
        <div>
          <h1>{{ patient.name }}</h1>
          <p>{{ patient.gender }}, {{ patient.age }} {{ $t('clinical360.nursing.patient_context.years_old') }}</p>
        </div>
      </div>

      <div class="demographic-stack">
        <div><span>{{ $t('clinical360.nursing.patient_context.dob') }}</span><strong>{{ patient.dob }}</strong></div>
        <div><span>MRN</span><strong>{{ patient.mrn }}</strong></div>
        <div><span>{{ $t('clinical360.nursing.patient_context.account') }}</span><strong>{{ patient.account }}</strong></div>
        <div><span>{{ $t('clinical360.nursing.patient_context.bed') }}</span><strong>{{ patient.bed }}</strong></div>
      </div>

      <div class="alert-block code-alert">
        {{ $t('clinical360.nursing.patient_context.code') }} : {{ patient.codeStatus }}
      </div>
      <div class="alert-block critical">
        {{ $t('clinical360.nursing.patient_context.precautions') }} : {{ patient.precautions }}
      </div>
      <div class="alert-block infection">
        {{ $t('clinical360.nursing.patient_context.infection') }} : {{ patient.infectionStatus }}
      </div>
      <div class="alert-block wound">
        {{ $t('clinical360.nursing.patient_context.admission_wound') }}
      </div>

      <div v-if="accessProfile.restrictedNotice" class="restricted-notice">
        <v-icon x-small color="#92400e">
          mdi-lock-alert
        </v-icon>
        {{ accessProfile.restrictedNotice }}
      </div>

      <div class="story-section">
        <span>{{ $t('clinical360.nursing.patient_context.attending') }}</span>
        <strong>{{ patient.attending }}</strong>
      </div>
      <div class="story-section">
        <span>{{ $t('clinical360.nursing.allergies') }}</span>
        <strong>{{ patient.allergies }}</strong>
      </div>
      <div class="story-section compact">
        <span>{{ $t('clinical360.nursing.patient_context.admitted') }}</span>
        <strong>{{ patient.admitted }}</strong>
        <small>{{ patient.patientClass }}</small>
      </div>
      <div class="story-section compact">
        <span>{{ $t('clinical360.nursing.patient_context.vitals') }}</span>
        <strong>{{ patient.vitals }}</strong>
        <small>BMI {{ patient.bmi }}</small>
      </div>

      <div class="story-worklist">
        <h2>{{ $t('clinical360.nursing.patient_context.acknowledge_orders') }}</h2>
        <p v-for="item in acknowledgeOrders" :key="item.label">
          <v-icon x-small :color="item.color">
            {{ item.icon }}
          </v-icon>
          {{ item.label }} <strong>{{ item.count }}</strong>
        </p>
      </div>
    </div>

    <div v-else class="panel-rail" role="group" :aria-label="$t('clinical360.nursing.patient_context.collapsed')">
      <div class="rail-avatar" :aria-label="`${$t('clinical360.nursing.patient_context.patient')} ${patient.name}`" role="img">
        <span>{{ patient.initials }}</span>
      </div>
      <button type="button" class="rail-icon allergy" :aria-label="`${$t('clinical360.nursing.patient_context.allergy')} : ${patient.allergies}`">
        <v-tooltip top>
          <template #activator="{ on }">
            <span v-on="on"><v-icon small color="#be123c">mdi-allergy</v-icon></span>
          </template>
          <span>{{ $t('clinical360.nursing.patient_context.allergy') }} : {{ patient.allergies }}</span>
        </v-tooltip>
      </button>
      <button type="button" class="rail-icon code" :aria-label="`${$t('clinical360.nursing.patient_context.code_status')} : ${patient.codeStatus}`">
        <v-tooltip top>
          <template #activator="{ on }">
            <span v-on="on"><v-icon small color="#f97316">mdi-heart-pulse</v-icon></span>
          </template>
          <span>{{ $t('clinical360.nursing.patient_context.code') }} : {{ patient.codeStatus }}</span>
        </v-tooltip>
      </button>
      <button type="button" class="rail-icon infection" :aria-label="`${$t('clinical360.nursing.patient_context.isolation')} : ${patient.infectionStatus}`">
        <v-tooltip top>
          <template #activator="{ on }">
            <span v-on="on"><v-icon small color="#16a34a">mdi-biohazard</v-icon></span>
          </template>
          <span>{{ $t('clinical360.nursing.patient_context.isolation') }} : {{ patient.infectionStatus }}</span>
        </v-tooltip>
      </button>
      <button type="button" class="rail-icon bed" :aria-label="`${$t('clinical360.nursing.patient_context.bed')} : ${patient.bed}`">
        <v-tooltip top>
          <template #activator="{ on }">
            <span v-on="on"><v-icon small color="#0f766e">mdi-bed</v-icon></span>
          </template>
          <span>{{ $t('clinical360.nursing.patient_context.bed') }} : {{ patient.bed }}</span>
        </v-tooltip>
      </button>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'LeftPatientPanel',
  props: {
    patient: { type: Object, required: true },
    accessProfile: { type: Object, required: true },
    acknowledgeOrders: { type: Array, default: () => [] },
    collapsed: { type: Boolean, default: false }
  }
}
</script>

<style scoped>
.left-patient-panel {
  background: #d9efe8;
  border-right: 2px solid #0f766e;
  overflow: auto;
  position: relative;
  min-width: 0;
}
.panel-toggle {
  position: sticky;
  top: 0;
  z-index: 1;
  width: 100%;
  height: 24px;
  border: 0;
  border-bottom: 1px solid rgba(15, 118, 110, 0.25);
  background: #c5e6df;
  color: #0f766e;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.panel-toggle:focus-visible {
  outline: 2px solid #0f766e;
  outline-offset: -2px;
}
.panel-body {
  padding: 8px;
}
.storyboard-identity {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.avatar-ring {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: radial-gradient(circle, #f5d0fe, #ddd6fe);
  border: 1px solid #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 20px;
  color: #6d28d9;
}
.panel-body h1 {
  font-size: 15px;
  margin: 0;
  color: #134e4a;
}
.panel-body p {
  margin: 2px 0 0;
}
.demographic-stack {
  display: grid;
  gap: 3px;
  margin-bottom: 8px;
}
.demographic-stack div, .story-section {
  display: grid;
  grid-template-columns: 58px 1fr;
  gap: 4px;
  align-items: center;
}
.demographic-stack span, .story-section span {
  color: #315b58;
  font-weight: 700;
}
.demographic-stack strong, .story-section strong {
  color: #0f172a;
}
.alert-block {
  padding: 4px 6px;
  margin-bottom: 4px;
  color: #111827;
  font-weight: 900;
  border: 1px solid rgba(0,0,0,0.16);
}
.code-alert { background: #f97316; }
.critical { background: #be123c; color: #fff; }
.infection { background: #16a34a; color: #fff; }
.wound { background: #eab308; }
.restricted-notice {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  color: #78350f;
  padding: 6px;
  margin: 6px 0;
  font-weight: 900;
}
.story-section {
  border-bottom: 1px solid rgba(15,118,110,0.2);
  padding: 5px 0;
}
.story-section.compact {
  grid-template-columns: 58px 1fr;
}
.story-section small {
  grid-column: 2;
  color: #475569;
}
.story-worklist {
  margin-top: 10px;
}
.story-worklist h2 {
  font-size: 11px;
  color: #134e4a;
  text-transform: uppercase;
  margin: 0 0 6px;
}
.story-worklist p {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 4px 0;
}
.panel-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 10px 4px;
}
.rail-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: radial-gradient(circle, #f5d0fe, #ddd6fe);
  border: 1px solid #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 12px;
  color: #6d28d9;
}
.rail-icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: 1px solid rgba(15, 118, 110, 0.25);
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}
.rail-icon:focus-visible {
  outline: 2px solid #0f766e;
  outline-offset: 2px;
}
</style>
