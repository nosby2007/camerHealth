<template>
  <section class="about-page">
    <div class="page-band intro-band">
      <div class="content-wrap intro-grid">
        <div>
          <p class="eyebrow">CameroHealth</p>
          <h1>Clinical operations and public health oversight in one secure system.</h1>
          <p class="lead">
            The platform is organized around facility workflows, patient records,
            clinical documentation, surveillance reporting, and administrative governance.
          </p>
        </div>
        <div class="signal-panel">
          <div v-for="item in signals" :key="item.label" class="signal-row">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="page-band">
      <div class="content-wrap capability-grid">
        <article v-for="capability in capabilities" :key="capability.title" class="capability-card">
          <v-icon color="#003366" size="26">{{ capability.icon }}</v-icon>
          <h2>{{ capability.title }}</h2>
          <p>{{ capability.text }}</p>
        </article>
      </div>
    </div>

    <div class="page-band quiet-band">
      <div class="content-wrap operations-grid">
        <div>
          <p class="eyebrow">Operational Model</p>
          <h2>Built for clinical teams that move between patients, orders, notes, and handoffs.</h2>
        </div>
        <ul class="operations-list">
          <li v-for="item in operations" :key="item">{{ item }}</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  layout: 'public',
  head: { title: 'About CameroHealth' },
  data() {
    return {
      signals: [
        { label: 'Clinical Layer', value: 'Patient 360' },
        { label: 'National Layer', value: 'Surveillance' },
        { label: 'Governance', value: 'RBAC + audit' }
      ],
      capabilities: [
        {
          icon: 'mdi-clipboard-pulse',
          title: 'Clinical workflows',
          text: 'Patient intake, visits, nursing documentation, orders, wound care, and discharge readiness.'
        },
        {
          icon: 'mdi-shield-account',
          title: 'Administrative control',
          text: 'Facility setup, staff roles, access review, policy controls, and operational reporting.'
        },
        {
          icon: 'mdi-map-search',
          title: 'Public health visibility',
          text: 'Regional surveillance, case monitoring, mapping, reporting, and outbreak review.'
        }
      ],
      operations: [
        'Role-aware workspaces for providers, nurses, administrators, lab, imaging, and billing.',
        'Patient-centered chart navigation with orders, notes, flowsheets, documents, and care plans.',
        'Security-first migration path toward Supabase Auth, RLS, audit logs, and protected backend actions.'
      ]
    }
  }
}
</script>

<style scoped>
.about-page {
  color: #15324a;
}
.page-band {
  padding: clamp(34px, 6vw, 72px) 24px;
}
.intro-band {
  background: linear-gradient(180deg, #ffffff 0%, #eef7f6 100%);
}
.quiet-band {
  background: #eef4f8;
}
.content-wrap {
  max-width: 1120px;
  margin: 0 auto;
}
.intro-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
  gap: 28px;
  align-items: center;
}
.eyebrow {
  margin: 0 0 8px;
  color: #0f766e;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
h1, h2, h3, p {
  margin-top: 0;
}
h1 {
  max-width: 820px;
  margin-bottom: 16px;
  color: #0f2537;
  font-size: clamp(34px, 5vw, 58px);
  line-height: 1.02;
}
.lead {
  max-width: 760px;
  margin-bottom: 0;
  color: #4b6475;
  font-size: 18px;
  line-height: 1.65;
}
.signal-panel {
  background: #ffffff;
  border: 1px solid #d7e5ec;
  border-radius: 8px;
  padding: 14px;
}
.signal-row {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 12px 0;
  border-bottom: 1px solid #e7eef3;
}
.signal-row:last-child {
  border-bottom: 0;
}
.signal-row span {
  color: #587080;
  font-weight: 700;
}
.signal-row strong {
  color: #003366;
}
.capability-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.capability-card {
  min-height: 210px;
  background: #ffffff;
  border: 1px solid #d7e5ec;
  border-radius: 8px;
  padding: 22px;
}
.capability-card h2 {
  margin: 18px 0 10px;
  color: #0f2537;
  font-size: 20px;
}
.capability-card p,
.operations-list {
  color: #4b6475;
  line-height: 1.6;
}
.operations-grid {
  display: grid;
  grid-template-columns: minmax(260px, 0.85fr) minmax(0, 1.15fr);
  gap: 28px;
}
.operations-grid h2 {
  color: #0f2537;
  font-size: 30px;
  line-height: 1.18;
}
.operations-list {
  margin: 0;
  padding-left: 20px;
}
.operations-list li {
  margin-bottom: 12px;
}
@media (max-width: 860px) {
  .intro-grid,
  .capability-grid,
  .operations-grid {
    grid-template-columns: 1fr;
  }
}
</style>
