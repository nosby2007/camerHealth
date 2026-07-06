<template>
  <section class="patient-banner" aria-label="Patient safety banner">
    <div class="patient-banner-identity">
      <strong>{{ patient.name }}</strong>
      <span>{{ patient.gender }}, {{ patient.age }} y.o.</span>
      <span>{{ patient.mrn }}</span>
      <span>{{ patient.bed }}</span>
    </div>
    <div class="patient-banner-badges">
      <span class="safety-badge code">
        <v-icon x-small color="#f97316">mdi-heart-pulse</v-icon>
        Code: {{ patient.codeStatus }}
      </span>
      <span class="safety-badge allergy">
        <v-icon x-small color="#be123c">mdi-allergy</v-icon>
        Allergy: {{ patient.allergies }}
      </span>
      <span class="safety-badge isolation">
        <v-icon x-small color="#16a34a">mdi-biohazard</v-icon>
        Isolation: {{ patient.infectionStatus }}
      </span>
      <span class="safety-badge precaution">
        <v-icon x-small color="#0369a1">mdi-shield-alert</v-icon>
        Precautions: {{ patient.precautions }}
      </span>
      <span v-if="fallRisk" class="safety-badge fall-risk">
        <v-icon x-small color="#7c2d12">mdi-walk</v-icon>
        Fall Risk: {{ fallRisk.value }}
      </span>
      <span v-if="skinIntegrity" class="safety-badge wound">
        <v-icon x-small color="#a16207">mdi-bandage</v-icon>
        {{ skinIntegrity.value }}
      </span>
    </div>
  </section>
</template>

<script>
export default {
  name: 'PatientBanner',
  props: {
    patient: { type: Object, required: true },
    fallRisk: { type: Object, default: null },
    skinIntegrity: { type: Object, default: null }
  }
}
</script>

<style scoped>
.patient-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 16px;
  padding: 6px 12px;
  background: #f0fdfa;
  border-bottom: 2px solid #0f766e;
}
.patient-banner-identity {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 10px;
  font-size: 13px;
}
.patient-banner-identity strong {
  color: #134e4a;
  font-size: 14px;
}
.patient-banner-identity span {
  color: #315b58;
}
.patient-banner-identity span::before {
  content: '\2022';
  margin-right: 10px;
  color: #94a3b8;
}
.patient-banner-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.safety-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 800;
  font-size: 11px;
  border: 1px solid rgba(0, 0, 0, 0.16);
  white-space: nowrap;
}
.safety-badge.code { background: #ffedd5; color: #7c2d12; }
.safety-badge.allergy { background: #fee2e2; color: #7f1d1d; }
.safety-badge.isolation { background: #dcfce7; color: #14532d; }
.safety-badge.precaution { background: #e0f2fe; color: #075985; }
.safety-badge.fall-risk { background: #fef3c7; color: #78350f; }
.safety-badge.wound { background: #fef9c3; color: #713f12; }
</style>
