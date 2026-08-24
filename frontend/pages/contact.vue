<template>
  <section class="contact-page">
    <div class="content-wrap">
      <header class="page-header">
        <p class="eyebrow">Contact</p>
        <h1>Implementation, facility access, and operational support.</h1>
        <p>
          CameroHealth access should be coordinated through the facility administrator,
          implementation lead, or authorized ministry contact assigned to the deployment.
        </p>
      </header>

      <div class="contact-grid">
        <article v-for="channel in channels" :key="channel.title" class="contact-card">
          <v-icon color="#003366" size="28">{{ channel.icon }}</v-icon>
          <h2>{{ channel.title }}</h2>
          <p>{{ channel.text }}</p>
        </article>
      </div>

      <section class="request-panel">
        <div>
          <h2>Before requesting access</h2>
          <p>
            Keep facility name, staff role, department, and supervisor approval ready.
            Clinical access should only be granted when the treatment or operations basis is clear.
          </p>
        </div>
        <ul>
          <li v-for="item in checklist" :key="item">{{ item }}</li>
        </ul>
      </section>
    </div>
  </section>
</template>

<script>
export default {
  layout: 'public',
  head: { title: 'Contact CameroHealth' },
  data() {
    return {
      channels: [
        {
          icon: 'mdi-hospital-building',
          title: 'Facility onboarding',
          text: 'Coordinate organization setup, administrator approval, staff groups, units, and clinical workflow readiness.'
        },
        {
          icon: 'mdi-account-key',
          title: 'Access support',
          text: 'Route account creation, role changes, MFA resets, and staff deactivation through the facility administrator.'
        },
        {
          icon: 'mdi-shield-check',
          title: 'Governance review',
          text: 'Review audit expectations, PHI access basis, reporting scope, and production release readiness.'
        }
      ],
      checklist: [
        'Confirm the facility and department where access is needed.',
        'Confirm the staff role and minimum permissions required.',
        'Confirm approval from the responsible facility or ministry authority.',
        'Use the protected admin workflow for account invitations and role changes.'
      ]
    }
  }
}
</script>

<style scoped>
.contact-page {
  min-height: calc(100vh - 68px);
  padding: clamp(34px, 6vw, 72px) 24px;
  background: #f6fafb;
  color: #15324a;
}
.content-wrap {
  max-width: 1080px;
  margin: 0 auto;
}
.page-header {
  max-width: 760px;
  margin-bottom: 30px;
}
.eyebrow {
  margin: 0 0 8px;
  color: #0f766e;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
h1, h2, p {
  margin-top: 0;
}
h1 {
  margin-bottom: 14px;
  color: #0f2537;
  font-size: clamp(32px, 5vw, 52px);
  line-height: 1.04;
}
.page-header p,
.contact-card p,
.request-panel p,
.request-panel li {
  color: #4b6475;
  line-height: 1.6;
}
.contact-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.contact-card {
  background: #ffffff;
  border: 1px solid #d7e5ec;
  border-radius: 8px;
  padding: 22px;
}
.contact-card h2 {
  margin: 16px 0 10px;
  color: #0f2537;
  font-size: 20px;
}
.request-panel {
  display: grid;
  grid-template-columns: minmax(260px, 0.9fr) minmax(0, 1.1fr);
  gap: 24px;
  margin-top: 18px;
  padding: 24px;
  background: #ffffff;
  border: 1px solid #d7e5ec;
  border-radius: 8px;
}
.request-panel h2 {
  color: #0f2537;
}
.request-panel ul {
  margin: 0;
  padding-left: 20px;
}
.request-panel li {
  margin-bottom: 10px;
}
@media (max-width: 820px) {
  .contact-grid,
  .request-panel {
    grid-template-columns: 1fr;
  }
}
</style>
