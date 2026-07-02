<template>
  <div class="clinical-workspace-shell">
    <header class="workspace-header">
      <div>
        <p class="eyebrow">CameroHealth Clinical Workspace</p>
        <h1>Patient 360 · {{ selectedRoleLabel }}</h1>
      </div>
      <div class="header-actions">
        <span class="pill">Nurse Navigator</span>
        <span class="pill">Clinical Clipboard</span>
      </div>
    </header>

    <section class="role-switcher">
      <button v-for="role in roles" :key="role.key" :class="['role-btn', { active: selectedRole === role.key }]" @click="selectedRole = role.key">
        {{ role.label }}
      </button>
    </section>

    <div class="patient-360-grid">
      <aside class="snapshot-panel">
        <h2>Patient Snapshot</h2>
        <div class="patient-name">{{ patient.name }}</div>
        <div class="meta-grid">
          <div><strong>DOB</strong><span>{{ patient.dob }}</span></div>
          <div><strong>MRN</strong><span>{{ patient.mrn }}</span></div>
          <div><strong>Facility</strong><span>{{ patient.facility }}</span></div>
          <div><strong>Unit/Room</strong><span>{{ patient.unit }}</span></div>
          <div><strong>Code</strong><span>{{ patient.codeStatus }}</span></div>
          <div><strong>Allergies</strong><span>{{ patient.allergies }}</span></div>
          <div><strong>Precautions</strong><span>{{ patient.precautions }}</span></div>
          <div><strong>Attending</strong><span>{{ patient.attending }}</span></div>
        </div>
        <div class="snapshot-card">
          <h3>Active alerts</h3>
          <ul>
            <li v-for="item in patient.alerts" :key="item">{{ item }}</li>
          </ul>
        </div>
      </aside>

      <main class="workspace-panel">
        <nav class="workspace-tabs">
          <button v-for="tab in tabs" :key="tab" :class="['tab-btn', { active: selectedTab === tab }]" @click="selectedTab = tab">
            {{ tab }}
          </button>
        </nav>

        <section class="workspace-content">
          <div v-if="selectedTab === 'Summary'" class="content-grid">
            <article class="card">
              <h3>{{ selectedRoleLabel }} Workspace</h3>
              <p>{{ roleSummary }}</p>
            </article>
            <article class="card">
              <h3>Navigator</h3>
              <ul>
                <li v-for="item in navigatorSections" :key="item">{{ item }}</li>
              </ul>
            </article>
          </div>

          <div v-else-if="selectedTab === 'Navigator'" class="content-grid">
            <article class="card" v-for="section in navigatorSections" :key="section">
              <h3>{{ section }}</h3>
              <p>{{ navigatorDetails[section] }}</p>
            </article>
          </div>

          <div v-else-if="selectedTab === 'Flowsheets'" class="card">
            <h3>Configurable flowsheets</h3>
            <ul>
              <li v-for="flow in flowsheets" :key="flow">{{ flow }}</li>
            </ul>
          </div>

          <div v-else-if="selectedTab === 'Orders'" class="card">
            <h3>Orders queue</h3>
            <ul>
              <li v-for="order in orders" :key="order.title">{{ order.title }} · {{ order.status }}</li>
            </ul>
          </div>

          <div v-else-if="selectedTab === 'Wound Management'" class="card">
            <h3>Wound intelligence</h3>
            <p>{{ woundSummary }}</p>
          </div>

          <div v-else-if="selectedTab === 'Discharge'" class="card">
            <h3>Discharge workflow</h3>
            <p>{{ dischargeSummary }}</p>
          </div>

          <div v-else class="card">
            <h3>{{ selectedTab }}</h3>
            <p>CameroHealth-native workflow content for {{ selectedRoleLabel.toLowerCase() }} tasks is available for future expansion.</p>
          </div>
        </section>
      </main>

      <aside class="clipboard-panel">
        <h2>Clinical Clipboard</h2>
        <div class="clipboard-card">
          <h3>Current meds</h3>
          <ul>
            <li v-for="med in clipboard.meds" :key="med">{{ med }}</li>
          </ul>
        </div>
        <div class="clipboard-card">
          <h3>Tasks</h3>
          <ul>
            <li v-for="task in clipboard.tasks" :key="task">{{ task }}</li>
          </ul>
        </div>
        <div class="clipboard-card">
          <h3>Blood bank report</h3>
          <p>{{ clipboard.blood }}</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script>
import clinicalWorkflowEngine from '~/services/clinical/workflowEngine';

export default {
  name: 'ClinicalWorkspace',
  data() {
    return {
      selectedRole: 'NURSE',
      selectedTab: 'Summary',
      tabs: ['Summary', 'Navigator', 'Avatar', 'Flowsheets', 'Orders', 'Wound Management', 'Notes', 'Care Plan', 'Education', 'Worklist', 'Immunizations', 'Documents', 'Discharge', 'Transfer', 'Blood Admin', 'Team Conference'],
      roles: [
        { key: 'RECEPTION', label: 'Reception' },
        { key: 'NURSE', label: 'Nurse' },
        { key: 'DOCTOR', label: 'Doctor' },
        { key: 'NP', label: 'NP' },
        { key: 'ADMIN', label: 'Admin' },
        { key: 'BILLING', label: 'Billing' },
        { key: 'CASE_MANAGER', label: 'Case Manager' }
      ],
      patient: {
        name: 'Amina Njie',
        dob: '1987-04-12',
        mrn: 'MRN-10482',
        facility: 'Bamenda General',
        unit: '3B / Room 12 / Bed 2',
        codeStatus: 'Full',
        allergies: 'Penicillin',
        precautions: 'Falls, isolation',
        attending: 'Dr. K. Saho',
        alerts: ['New imaging available', 'Orders to acknowledge', 'Wound dressing due']
      },
      navigatorSections: ['Shift', 'Admission', 'Discharge', 'Transfer', 'Medication Review', 'Blood Admin', 'Team Conference'],
      navigatorDetails: {
        Shift: 'Round checklist, vitals due, pain reassessment, and handoff review.',
        Admission: 'Admission orders, allergy review, skin assessment, and initial nursing note.',
        Discharge: 'Expected discharge date, medication reconciliation, home instructions, and summary review.',
        Transfer: 'Pre-procedure checklist, transport readiness, and receiving department notification.',
        'Medication Review': 'Medication reconciliation, PRN review, and outpatient medication instructions.',
        'Blood Admin': 'Type and screen, dual verification, transfusion monitoring and reaction documentation.',
        'Team Conference': 'Care plan review, provider communication, and discharge readiness updates.'
      },
      flowsheets: ['Vital Signs', 'Intake and Output', 'Pain Assessment', 'Mobility', 'Rounds/Safety', 'Comfort and Hygiene', 'IV Assessment', 'Skin/Wound Assessment', 'Braden Scale', 'Delirium/GCS', 'Sepsis Screen', 'Blood Admin', 'Ostomy', 'Wound Measurements'],
      orders: [
        { title: 'Wound care dressing', status: 'active' },
        { title: 'CBC with differential', status: 'scheduled' },
        { title: 'Medication review', status: 'acknowledge' }
      ],
      clipboard: {
        meds: ['Metformin 500 mg', 'Lisinopril 10 mg', 'Acetaminophen PRN'],
        tasks: ['Wound dressing due', 'Dr. note to sign', 'Discharge packet pending'],
        blood: 'Type and screen completed · crossmatch pending'
      },
      woundSummary: 'Admission wound documentation, wound measurements, provider notification, and weekly wound report are available from this workspace.',
      dischargeSummary: 'Discharge milestones, transportation needs, medication reconciliation, education, and summary sign-off are tracked in the discharge navigator.'
    };
  },
  computed: {
    selectedRoleLabel() {
      const role = this.roles.find((item) => item.key === this.selectedRole);
      return role ? role.label : this.selectedRole;
    },
    roleSummary() {
      if (this.selectedRole === 'RECEPTION') {
        return 'Reception Desk supports registration, demographics, insurance intake, referrals, scheduling, admission creation, and discharge packet preparation.';
      }
      if (this.selectedRole === 'NURSE') {
        return 'Nurse TaskFlow manages assigned patients, tasks, vitals, wound assessments, I/O, notes, handoff, and discharge readiness.';
      }
      if (this.selectedRole === 'DOCTOR' || this.selectedRole === 'NP') {
        return 'Provider Command Center supports orders, diagnosis management, notes to sign, discharge readiness, and CDS alerts.';
      }
      if (this.selectedRole === 'ADMIN') {
        return 'Admin Control Center manages facilities, units, users, templates, RBAC, policies, reports, and audit review.';
      }
      if (this.selectedRole === 'BILLING') {
        return 'Billing workspace focuses on payer configuration, insurance review, charges, and billing documents.';
      }
      return 'Case manager workflow aligns discharge planning, referrals, education, and care coordination.';
    }
  },
  methods: {
    canAccess(action) {
      return clinicalWorkflowEngine.canAccessRole(this.selectedRole, action);
    }
  }
};
</script>

<style scoped>
.clinical-workspace-shell {
  background: #f5f8fb;
  color: #15324a;
  padding: 24px;
  border-radius: 18px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
}
.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.72rem;
  color: #4e7aa7;
  margin: 0 0 4px 0;
}
.header-actions { display: flex; gap: 8px; }
.pill {
  background: #dfeefc;
  color: #14517f;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
}
.role-switcher, .workspace-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
.role-btn, .tab-btn {
  border: 1px solid #cdd9e4;
  background: white;
  color: #29485d;
  border-radius: 999px;
  padding: 7px 12px;
  cursor: pointer;
}
.role-btn.active, .tab-btn.active {
  background: #14517f;
  color: white;
  border-color: #14517f;
}
.patient-360-grid {
  display: grid;
  grid-template-columns: 1.05fr 2.1fr 0.95fr;
  gap: 16px;
}
.snapshot-panel, .workspace-panel, .clipboard-panel {
  background: white;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #e3ebf3;
}
.patient-name { font-size: 1.2rem; font-weight: 700; margin-bottom: 12px; }
.meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.meta-grid div { display: flex; flex-direction: column; gap: 3px; font-size: 0.92rem; }
.snapshot-card, .card, .clipboard-card {
  margin-top: 12px;
  background: #f8fbfe;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #e7eef5;
}
.content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
ul { margin: 0; padding-left: 18px; }
@media (max-width: 920px) {
  .patient-360-grid { grid-template-columns: 1fr; }
}
</style>
