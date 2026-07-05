<template>
  <div class="epic-workspace">
    <header class="chart-topbar">
      <div class="brand-row">
        <v-avatar tile size="24" color="#0f766e" class="mr-2">
          <v-icon dark x-small>mdi-hospital-building</v-icon>
        </v-avatar>
        <strong>CameroHealth Chart</strong>
        <span class="environment">Clinical Workflow</span>
      </div>
      <div class="search-box">
        <v-icon small color="#64748b">mdi-magnify</v-icon>
        <span>Search chart, order, patient, navigator</span>
      </div>
      <div class="topbar-actions">
        <v-btn v-if="patientScoped" x-small text color="#0f766e" class="font-weight-black" to="/clinical/patients">
          <v-icon x-small left>mdi-account-search</v-icon>Patient list
        </v-btn>
        <label class="role-switcher">
          <span>Role</span>
          <select v-model="previewRole">
            <option v-for="role in roleOptions" :key="role.value" :value="role.value">
              {{ role.short }}
            </option>
          </select>
        </label>
        <v-btn x-small text color="#0f766e" class="font-weight-black">Print</v-btn>
        <v-btn x-small text color="#0f766e" class="font-weight-black">Chart correction</v-btn>
        <v-avatar size="28" color="#dbeafe">
          <span class="avatar-text">{{ userInitials }}</span>
        </v-avatar>
      </div>
    </header>

    <section class="patient-tabs">
      <button
        v-for="chart in openCharts"
        :key="chart.id"
        :class="['patient-tab', { active: chart.id === activeChartId }]"
        @click="activeChartId = chart.id"
      >
        {{ chart.shortName }}
      </button>
    </section>

    <section class="access-strip">
      <div>
        <v-icon small color="#0f766e">mdi-shield-lock</v-icon>
        <strong>{{ accessProfile.label }}</strong>
        <span>{{ accessProfile.scope }}</span>
      </div>
      <div>
        <span>{{ visibleChartTabs.length }} chart tabs</span>
        <span>{{ accessProfile.audit }}</span>
      </div>
    </section>

    <div class="chart-frame">
      <aside class="storyboard">
        <div class="storyboard-identity">
          <div class="avatar-ring">
            <span>{{ activePatient.initials }}</span>
          </div>
          <div>
            <h1>{{ activePatient.name }}</h1>
            <p>{{ activePatient.gender }}, {{ activePatient.age }} y.o.</p>
          </div>
        </div>

        <div class="demographic-stack">
          <div><span>DOB</span><strong>{{ activePatient.dob }}</strong></div>
          <div><span>MRN</span><strong>{{ activePatient.mrn }}</strong></div>
          <div><span>Account</span><strong>{{ activePatient.account }}</strong></div>
          <div><span>Bed</span><strong>{{ activePatient.bed }}</strong></div>
        </div>

        <div class="alert-block code-alert">{{ activePatient.codeStatus }}</div>
        <div class="alert-block critical">Precautions: {{ activePatient.precautions }}</div>
        <div class="alert-block infection">Infection: {{ activePatient.infectionStatus }}</div>
        <div class="alert-block wound">Admission wound documentation</div>

        <div v-if="accessProfile.restrictedNotice" class="restricted-notice">
          <v-icon x-small color="#92400e">mdi-lock-alert</v-icon>
          {{ accessProfile.restrictedNotice }}
        </div>

        <div class="story-section">
          <span>Attending</span>
          <strong>{{ activePatient.attending }}</strong>
        </div>
        <div class="story-section">
          <span>Allergies</span>
          <strong>{{ activePatient.allergies }}</strong>
        </div>
        <div class="story-section compact">
          <span>Admitted</span>
          <strong>{{ activePatient.admitted }}</strong>
          <small>{{ activePatient.patientClass }}</small>
        </div>
        <div class="story-section compact">
          <span>Vitals</span>
          <strong>{{ activePatient.vitals }}</strong>
          <small>BMI {{ activePatient.bmi }}</small>
        </div>

        <div class="story-worklist">
          <h2>Acknowledge orders</h2>
          <p v-for="item in acknowledgeOrders" :key="item.label">
            <v-icon x-small :color="item.color">{{ item.icon }}</v-icon>
            {{ item.label }} <strong>{{ item.count }}</strong>
          </p>
        </div>
      </aside>

      <main class="chart-main">
        <nav class="chart-tabs">
          <button
            v-for="tab in visibleChartTabs"
            :key="tab"
            :class="{ active: selectedChartTab === tab }"
            @click="selectedChartTab = tab"
          >
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

        <div class="navigator-layout">
          <aside class="navigator-rail">
            <h2>Navigators</h2>
            <button
              v-for="nav in visibleNavigatorTabs"
              :key="nav.key"
              :class="{ active: selectedNavigator === nav.key }"
              @click="selectedNavigator = nav.key"
            >
              <v-icon x-small>{{ nav.icon }}</v-icon>
              {{ nav.label }}
            </button>

            <div class="rail-group" v-if="activeNavigator">
              <strong>{{ activeNavigator.label }}</strong>
              <a v-for="section in activeNavigator.sections" :key="section" href="#" @click.prevent>
                {{ section }}
              </a>
            </div>
          </aside>

          <section class="workspace-panel">
            <div class="workspace-title">
              <div>
                <p>{{ activeNavigator.label }}</p>
                <h2>{{ activeNavigator.headline }}</h2>
              </div>
          <div class="title-actions">
            <v-chip x-small label color="#e0f2fe" text-color="#075985" class="font-weight-black">
              Current admission
            </v-chip>
            <v-btn
              v-if="activePatientId"
              x-small
              depressed
              color="#003366"
              dark
              class="font-weight-black"
              :to="`/clinical/patients/${activePatientId}/encounter/nurse`"
            >
              <v-icon x-small left>mdi-stethoscope</v-icon>Nurse work
            </v-btn>
            <v-btn
              v-if="activePatientId && canLaunchMedical"
              x-small
              depressed
              color="#1d4ed8"
              dark
              class="font-weight-black"
              :to="`/clinical/patients/${activePatientId}/encounter/medical`"
            >
              <v-icon x-small left>mdi-medical-bag</v-icon>Medical
            </v-btn>
            <v-btn x-small depressed color="#0f766e" dark class="font-weight-black">
              <v-icon x-small left>mdi-plus</v-icon>New Reading
                </v-btn>
              </div>
            </div>

            <section v-if="selectedNavigator === 'sdoh'" class="sdoh-section">
              <div class="sdoh-card">
                <div class="section-title purple">
                  <v-icon small color="#6d28d9">mdi-heart</v-icon>
                  Health-Related Social Needs
                </div>
                <div class="sdoh-content">
                  <div class="sdoh-wheel" aria-label="Social determinants of health summary">
                    <button
                      v-for="domain in sdohDomains"
                      :key="domain.key"
                      :class="['wheel-segment', { active: activeSdoh === domain.key, positive: domain.status === 'clear', warning: domain.status === 'risk' }]"
                      :style="{ transform: `rotate(${domain.angle}deg) translateY(-112px) rotate(${-domain.angle}deg)` }"
                      @click="activeSdoh = domain.key"
                    >
                      <v-icon>{{ domain.icon }}</v-icon>
                    </button>
                    <div class="wheel-center">
                      <strong>{{ activeSdohDomain.summary }}</strong>
                      <span>{{ activeSdohDomain.date }}</span>
                    </div>
                  </div>

                  <article class="sdoh-popover">
                    <div class="popover-header">
                      <v-icon color="#334155">{{ activeSdohDomain.icon }}</v-icon>
                      <div>
                        <h3>{{ activeSdohDomain.label }}</h3>
                        <p>{{ activeSdohDomain.date }}: {{ activeSdohDomain.summary }}</p>
                      </div>
                    </div>
                    <div class="timeline">
                      <v-icon small color="#111827">mdi-chevron-left</v-icon>
                      <div class="timeline-track">
                        <span
                          v-for="point in activeSdohDomain.history"
                          :key="point.date"
                          :class="['timeline-point', point.status]"
                          :title="point.date"
                        ></span>
                      </div>
                      <v-icon small color="#94a3b8">mdi-chevron-right</v-icon>
                      <strong>Today</strong>
                    </div>
                    <div class="popover-body">
                      <h4>{{ activeSdohDomain.date }}: {{ activeSdohDomain.summary }}</h4>
                      <p class="assessment-name">{{ activeSdohDomain.assessment }}</p>
                      <div v-for="line in activeSdohDomain.details" :key="line.label" class="answer-row">
                        <span>{{ line.label }}</span>
                        <strong>{{ line.value }}</strong>
                      </div>
                    </div>
                  </article>
                </div>
                <a class="outside-data" href="#" @click.prevent>
                  <v-icon small>mdi-earth</v-icon>
                  View additional outside data
                </a>
              </div>
            </section>

            <section v-else-if="selectedNavigator === 'admission'" class="flowsheet">
              <FlowSection
                title="Intake and Output"
                :columns="flowColumns"
                :rows="intakeRows"
              />
              <FlowSection
                title="Delirium - GCS"
                required
                :columns="flowColumns"
                :rows="deliriumRows"
              />
              <FlowSection
                title="Sepsis Screen"
                :columns="flowColumns"
                :rows="sepsisRows"
              />
            </section>

            <section v-else-if="selectedNavigator === 'discharge'" class="discharge-board">
              <div class="discharge-summary">
                <div>
                  <h3>Expected Discharge</h3>
                  <div class="segmented">
                    <button>Today</button>
                    <button class="active">Tomorrow</button>
                    <button>Later</button>
                  </div>
                </div>
                <div>
                  <h3>Medical Readiness for Discharge</h3>
                  <div class="segmented">
                    <button>Ready Now</button>
                    <button class="active">Not Yet Ready</button>
                  </div>
                </div>
              </div>

              <FlowSection
                title="Discharge Milestones and Delays"
                :columns="['Status', 'Owner', 'Due']"
                :rows="dischargeRows"
              />
            </section>

            <section v-else-if="selectedNavigator === 'transfer'" class="flowsheet">
              <div class="info-banner">
                <v-icon small color="#0f766e">mdi-clipboard-check</v-icon>
                Pre-Procedure Checklist: complete the following questions before transfer or print documents.
              </div>
              <FlowSection
                title="Pre-Procedure Checklist"
                required
                :columns="['Current admission']"
                :rows="transferRows"
              />
              <FlowSection
                title="Ticket to Ride"
                :columns="['Status']"
                :rows="ticketRows"
              />
            </section>

            <section v-else-if="selectedNavigator === 'mar'" class="flowsheet">
              <FlowSection
                title="Medication Administration Record"
                :columns="['0600', '1000', '1400', '1800']"
                :rows="visibleMarRows"
              />
            </section>

            <section v-else-if="selectedNavigator === 'vitals'" class="flowsheet">
              <FlowSection
                title="Vital Signs and Pain"
                required
                :columns="patientVitals.length ? ['Last Filed'] : flowColumns"
                :rows="visibleVitalRows"
              />
              <FlowSection
                title="Nursing Assessment"
                :columns="latestVisit && latestVisit.assessment ? ['Last Filed'] : flowColumns"
                :rows="visibleAssessmentRows"
              />
            </section>

            <section v-else-if="selectedNavigator === 'careteam'" class="flowsheet">
              <FlowSection
                title="Current Encounter Team"
                :columns="['Role', 'Shift', 'Contact']"
                :rows="visibleCareTeamRows"
              />
            </section>

            <section v-else-if="selectedNavigator === 'worklist'" class="flowsheet">
              <FlowSection
                title="Work List"
                required
                :columns="['Time', 'Priority', 'Status']"
                :rows="visibleWorklistRows"
              />
            </section>

            <section v-else class="flowsheet">
              <FlowSection
                :title="activeNavigator.headline"
                :columns="flowColumns"
                :rows="defaultRows"
              />
            </section>
          </section>
        </div>
      </main>

      <aside class="clinical-clipboard">
        <div class="clipboard-tabs">
          <button class="active">Sidebar Summary</button>
          <button>Clinical Clipboard</button>
          <button>Navigators</button>
        </div>

        <section class="clipboard-panel">
          <h2>Index</h2>
          <div class="index-grid">
            <a v-for="item in visibleSidebarIndex" :key="item" href="#" @click.prevent>{{ item }}</a>
          </div>
        </section>

        <section v-if="canSeeClinicalHistory" class="clipboard-panel">
          <h2>Medical History</h2>
          <div v-for="item in medicalHistory" :key="item.label" class="history-row">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <section v-if="canViewOrders" class="orders-panel">
          <div class="orders-header">
            <strong>Inpatient Orders</strong>
            <v-btn x-small depressed color="#0f766e" dark class="font-weight-black">New</v-btn>
          </div>
          <div v-if="visibleActiveOrders.length" class="order-list">
            <article v-for="order in visibleActiveOrders" :key="order.title" class="order-row">
              <v-icon small :color="order.color">{{ order.icon }}</v-icon>
              <div>
                <strong>{{ order.title }}</strong>
                <span>{{ order.detail }}</span>
              </div>
            </article>
          </div>
          <div v-else class="no-orders">
            <v-icon size="52" color="#94a3b8">mdi-clipboard-text-outline</v-icon>
            <span>No Orders</span>
          </div>
          <button class="sign-button">
            <v-icon small>mdi-draw-pen</v-icon>
            Sign
          </button>
        </section>
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
const FlowSection = {
  name: 'FlowSection',
  props: {
    title: { type: String, required: true },
    columns: { type: Array, default: () => [] },
    rows: { type: Array, default: () => [] },
    required: { type: Boolean, default: false }
  },
  template: `
    <article class="flow-section">
      <header>
        <div>
          <v-icon x-small color="#0f766e">mdi-table</v-icon>
          <strong>{{ title }}</strong>
          <span v-if="required" class="required-dot">Required Documentation</span>
        </div>
        <a href="#" @click.prevent>Flowsheets</a>
      </header>
      <div class="flow-grid" :style="{ gridTemplateColumns: gridTemplate }">
        <div class="flow-cell label-cell"></div>
        <div v-for="column in columns" :key="column" class="flow-cell column-cell">{{ column }}</div>
        <template v-for="row in rows">
          <div :key="row.label + '-label'" class="flow-cell row-label">{{ row.label }}</div>
          <div v-for="column in columns" :key="row.label + column" class="flow-cell value-cell">
            {{ row.values && row.values[column] !== undefined ? row.values[column] : row.value || '-' }}
          </div>
        </template>
      </div>
    </article>
  `,
  computed: {
    gridTemplate() {
      return `minmax(220px, 1.1fr) repeat(${this.columns.length}, minmax(120px, 1fr))`
    }
  }
}

const ALL_CLINICAL_TABS = [
  'Summary',
  'Chart Review',
  'Navigators',
  'Avatar',
  'Flowsheets',
  'Orders',
  'MAR',
  'Lab Results',
  'Wound Management',
  'Notes',
  'Care Plan',
  'Education',
  'Work List',
  'Immunizations',
  'Sedation/Procedure Documentation',
  'Care Teams',
  'Handoff',
  'Documents',
  'Registration'
]

const TAB_ACCESS = {
  ADMIN: ALL_CLINICAL_TABS,
  DOCTOR: ALL_CLINICAL_TABS,
  NP: ALL_CLINICAL_TABS,
  NURSE: ALL_CLINICAL_TABS,
  MIDWIFE: ALL_CLINICAL_TABS.filter(tab => !['Sedation/Procedure Documentation'].includes(tab)),
  MAJOR_SERVICE: ALL_CLINICAL_TABS,
  NURSING_SUPERVISOR: ALL_CLINICAL_TABS,
  CNA: ['Summary', 'Navigators', 'Flowsheets', 'Work List', 'Care Plan', 'Education', 'Handoff'],
  LAB: ['Summary', 'Chart Review', 'Navigators', 'Orders', 'Lab Results', 'Work List'],
  IMAGING: ['Summary', 'Chart Review', 'Navigators', 'Orders', 'Work List', 'Documents'],
  PHARMACY: ['Summary', 'Chart Review', 'Orders', 'MAR', 'Medications', 'Work List', 'Education'],
  FRONT_DESK: ['Summary', 'Registration', 'Documents', 'Care Teams'],
  RECORDS: ['Summary', 'Chart Review', 'Documents', 'Registration', 'Care Teams'],
  BILLING: ['Summary', 'Registration', 'Documents'],
  SOCIAL_WORKER: ['Summary', 'Navigators', 'Notes', 'Care Plan', 'Education'],
  PHYSIOTHERAPIST: ['Summary', 'Navigators', 'Flowsheets', 'Care Plan', 'Work List', 'Notes']
}

const NAV_ACCESS = {
  ADMIN: ['shift', 'admission', 'discharge', 'transfer', 'medreview', 'mar', 'blood', 'vitals', 'worklist', 'careteam', 'sdoh'],
  DOCTOR: ['shift', 'admission', 'discharge', 'transfer', 'medreview', 'mar', 'blood', 'vitals', 'worklist', 'careteam', 'sdoh'],
  NP: ['shift', 'admission', 'discharge', 'transfer', 'medreview', 'mar', 'blood', 'vitals', 'worklist', 'careteam', 'sdoh'],
  NURSE: ['shift', 'admission', 'discharge', 'transfer', 'medreview', 'mar', 'blood', 'vitals', 'worklist', 'careteam', 'sdoh'],
  MIDWIFE: ['shift', 'admission', 'discharge', 'transfer', 'medreview', 'mar', 'vitals', 'worklist', 'careteam', 'sdoh'],
  MAJOR_SERVICE: ['shift', 'admission', 'discharge', 'transfer', 'medreview', 'mar', 'blood', 'vitals', 'worklist', 'careteam', 'sdoh'],
  NURSING_SUPERVISOR: ['shift', 'admission', 'discharge', 'transfer', 'medreview', 'mar', 'blood', 'vitals', 'worklist', 'careteam', 'sdoh'],
  CNA: ['shift', 'admission', 'vitals', 'worklist', 'careteam'],
  LAB: ['shift', 'worklist'],
  IMAGING: ['shift', 'worklist'],
  PHARMACY: ['medreview', 'mar', 'worklist'],
  FRONT_DESK: ['admission', 'careteam'],
  RECORDS: ['admission', 'careteam'],
  BILLING: ['admission'],
  SOCIAL_WORKER: ['sdoh', 'discharge', 'careteam'],
  PHYSIOTHERAPIST: ['shift', 'vitals', 'worklist', 'careteam']
}

const ACCESS_PROFILES = {
  ADMIN: { label: 'Administrator', short: 'Admin', scope: 'Facility administration plus audited clinical chart access', audit: 'Reason required for sensitive PHI', clinical: true, orders: true, social: true },
  DOCTOR: { label: 'Medecin', short: 'Doctor', scope: 'Assigned service, consults, orders and clinical decisions', audit: 'Full clinical chart', clinical: true, orders: true, social: true },
  NP: { label: 'Nurse Practitioner', short: 'NP', scope: 'Advanced clinical documentation and orders', audit: 'Full clinical chart', clinical: true, orders: true, social: true },
  NURSE: { label: 'Infirmier / Infirmiere', short: 'Nurse', scope: 'Complete patient 360 for active nursing care', audit: 'All tabs available', clinical: true, orders: true, social: true },
  MIDWIFE: { label: 'Sage-femme', short: 'Midwife', scope: 'Maternal, newborn, admission and care-team data', audit: 'Maternal scope', clinical: true, orders: true, social: true },
  MAJOR_SERVICE: { label: 'Major de service', short: 'Major', scope: 'Unit supervision, assignments, safety and handoff', audit: 'Unit oversight', clinical: true, orders: true, social: true },
  NURSING_SUPERVISOR: { label: 'Surveillant general', short: 'Supervisor', scope: 'Facility nursing oversight with audited cross-unit view', audit: 'Audited oversight', clinical: true, orders: true, social: true },
  CNA: { label: 'Aide-soignant', short: 'CNA', scope: 'Task-focused nursing aide view', audit: 'Limited PHI', clinical: true, orders: false, social: false, restrictedNotice: 'Limited view: no medications, orders or sensitive social-risk detail.' },
  LAB: { label: 'Laborantin', short: 'Lab', scope: 'Lab orders, specimen status and validated results only', audit: 'Minimum necessary', clinical: false, orders: true, social: false, restrictedNotice: 'Diagnostic view: demographics and orders only.' },
  IMAGING: { label: 'Imagerie', short: 'Imaging', scope: 'Imaging requests and reports only', audit: 'Minimum necessary', clinical: false, orders: true, social: false, restrictedNotice: 'Imaging view: no full clinical history.' },
  PHARMACY: { label: 'Pharmacien', short: 'Pharmacy', scope: 'Medication profile, allergies, MAR and dispensing', audit: 'Medication scope', clinical: false, orders: true, social: false, restrictedNotice: 'Pharmacy view: medication safety data only.' },
  FRONT_DESK: { label: 'Reception / Admissions', short: 'Reception', scope: 'Identity, registration, consent and appointments', audit: 'No clinical notes', clinical: false, orders: false, social: false, restrictedNotice: 'Reception view: clinical details are protected.' },
  RECORDS: { label: 'Archives medicales', short: 'Records', scope: 'Chart documents and registration integrity', audit: 'Audited records access', clinical: false, orders: false, social: false, restrictedNotice: 'Records view: direct care details are minimized.' },
  BILLING: { label: 'Facturation', short: 'Billing', scope: 'Billing and insurance only', audit: 'No clinical chart', clinical: false, orders: false, social: false, restrictedNotice: 'Billing view: clinical details are hidden.' },
  SOCIAL_WORKER: { label: 'Assistant social', short: 'Social', scope: 'Social needs, discharge barriers and support plan', audit: 'Social-care scope', clinical: false, orders: false, social: true },
  PHYSIOTHERAPIST: { label: 'Kinesitherapeute', short: 'Kine', scope: 'Mobility, rehab plan and functional assessments', audit: 'Rehab scope', clinical: true, orders: false, social: false }
}

export default {
  name: 'ClinicalWorkspace',
  components: { FlowSection },
  props: {
    patientId: { type: String, default: '' },
    patientScoped: { type: Boolean, default: false }
  },
  data() {
    return {
      activeChartId: this.patientId || 'demo-1',
      previewRole: this.$store.state.auth.role || 'NURSE',
      selectedChartTab: 'Navigators',
      selectedNavigator: 'admission',
      activeSdoh: 'food',
      chartTabs: ALL_CLINICAL_TABS,
      navigatorTabs: [
        { key: 'shift', label: 'Shift', icon: 'mdi-clock-outline', headline: 'Shift Navigator', sections: ['Overview', 'Signed/Held Orders', 'Quick Links', 'Pain', 'Head to Toe', 'IV Assessment'] },
        { key: 'admission', label: 'Admission', icon: 'mdi-login-variant', headline: 'Admission Review', sections: ['Intake and Output', 'Delirium - GCS', 'Sepsis Screen', 'Fall Risk', 'Nutrition', 'Belongings'] },
        { key: 'discharge', label: 'Discharge', icon: 'mdi-logout-variant', headline: 'Expected Discharge', sections: ['Exp. Discharge', 'BMS', 'Function/Quality', 'Medication Detail', 'Instructions', 'Follow-up Providers'] },
        { key: 'transfer', label: 'Transfer', icon: 'mdi-swap-horizontal', headline: 'Pre-Procedure Checklist', sections: ['Pre-Procedure Checklist', 'Print Documents', 'Ticket to Ride', 'Handoff', 'Vital Signs Monitoring'] },
        { key: 'medreview', label: 'Medication Review', icon: 'mdi-pill', headline: 'Medication Review', sections: ['Current Meds', 'Scheduled', 'PRN', 'Medication Detail', 'Reconciliation'] },
        { key: 'mar', label: 'MAR', icon: 'mdi-format-list-checks', headline: 'Medication Administration Record', sections: ['Scheduled', 'PRN', 'Continuous', 'Running Infusions', 'Education'] },
        { key: 'blood', label: 'Blood Admin', icon: 'mdi-water', headline: 'Blood Administration', sections: ['Type and Screen', 'Consent', 'Dual Verification', 'Transfusion Vitals'] },
        { key: 'vitals', label: 'Vitals', icon: 'mdi-heart-pulse', headline: 'Vital Signs and Assessment', sections: ['Vitals', 'Pain', 'Neuro', 'Mobility', 'Wounds'] },
        { key: 'worklist', label: 'Work List', icon: 'mdi-clipboard-list-outline', headline: 'Role Work List', sections: ['Overdue', 'Due Now', 'My Discipline', 'Completed'] },
        { key: 'careteam', label: 'Care Teams', icon: 'mdi-account-group', headline: 'Care Team', sections: ['Attending', 'Consults', 'Nursing Team', 'Pharmacy', 'Diagnostics'] },
        { key: 'sdoh', label: 'Social Needs', icon: 'mdi-account-heart', headline: 'Health-Related Social Needs', sections: ['Food Insecurity', 'Transportation Needs', 'Financial Strain', 'Stress', 'Housing', 'Social Support'] }
      ],
      sdohDomains: [
        { key: 'food', label: 'Food Insecurity', icon: 'mdi-food-apple', angle: 0, status: 'clear', date: 'Jun 11, 2026', summary: 'No Food Insecurity', assessment: 'Hunger Vital Sign', details: [{ label: 'Worried about running out of food in the last year', value: 'Never true' }, { label: 'Ran out of food in the last year', value: 'Never true' }], history: [{ date: '2023', status: 'clear' }, { date: '2024', status: 'clear' }, { date: '2025', status: 'clear' }, { date: '2026', status: 'clear' }] },
        { key: 'transport', label: 'Transportation Needs', icon: 'mdi-car', angle: 45, status: 'risk', date: 'Jun 8, 2026', summary: 'Patient unable to answer', assessment: 'SM SDOH Transportation Source', details: [{ label: 'HRSN Transportation - Medical Needs', value: 'Unable to respond' }, { label: 'HRSN Transportation - Daily Living', value: 'Unable to respond' }], history: [{ date: '2023', status: 'clear' }, { date: '2024', status: 'clear' }, { date: '2025', status: 'risk' }, { date: '2026', status: 'risk' }] },
        { key: 'financial', label: 'Financial Resource Strain', icon: 'mdi-cash', angle: 90, status: 'risk', date: 'Jun 11, 2026', summary: 'Patient unable to answer', assessment: 'Overall Financial Resource Strain (CARDIA)', details: [{ label: 'Difficulty paying living expenses', value: 'Patient unable to answer' }], history: [{ date: '2023', status: 'clear' }, { date: '2024', status: 'warning' }, { date: '2025', status: 'clear' }, { date: '2026', status: 'risk' }] },
        { key: 'stress', label: 'Stress', icon: 'mdi-account-alert', angle: 135, status: 'risk', date: 'Jun 30, 2026', summary: 'Patient unable to answer', assessment: 'Finnish Institute of Occupational Health - Occupational Stress Questionnaire', details: [{ label: 'Feeling of Stress', value: 'Patient unable to answer' }], history: [{ date: '2023', status: 'risk' }, { date: '2024', status: 'clear' }, { date: '2025', status: 'clear' }, { date: '2026', status: 'risk' }] },
        { key: 'housing', label: 'Housing Stability', icon: 'mdi-home-outline', angle: 180, status: 'clear', date: 'Jun 11, 2026', summary: 'Stable housing', assessment: 'Housing and Living Situation', details: [{ label: 'Concern about losing housing', value: 'No' }, { label: 'Current living situation', value: 'Stable' }], history: [{ date: '2023', status: 'clear' }, { date: '2024', status: 'clear' }, { date: '2025', status: 'clear' }, { date: '2026', status: 'clear' }] },
        { key: 'support', label: 'Social Connections', icon: 'mdi-account-group', angle: 225, status: 'clear', date: 'Jun 11, 2026', summary: 'Connected', assessment: 'Social Connection Screening', details: [{ label: 'Talks with family or friends', value: 'Several times per week' }, { label: 'Needs help at home', value: 'No' }], history: [{ date: '2023', status: 'clear' }, { date: '2024', status: 'clear' }, { date: '2025', status: 'clear' }, { date: '2026', status: 'clear' }] },
        { key: 'safety', label: 'Safety', icon: 'mdi-shield-alert', angle: 270, status: 'clear', date: 'Jun 11, 2026', summary: 'No safety concern', assessment: 'Safety Screening', details: [{ label: 'Feels physically and emotionally safe', value: 'Yes' }, { label: 'Threatened or hurt by anyone', value: 'No' }], history: [{ date: '2023', status: 'clear' }, { date: '2024', status: 'clear' }, { date: '2025', status: 'clear' }, { date: '2026', status: 'clear' }] },
        { key: 'utilities', label: 'Utilities', icon: 'mdi-lightning-bolt', angle: 315, status: 'clear', date: 'Jun 11, 2026', summary: 'No utility need', assessment: 'Utility Needs', details: [{ label: 'Utility shutoff concern', value: 'No' }, { label: 'Needs utility assistance', value: 'No' }], history: [{ date: '2023', status: 'clear' }, { date: '2024', status: 'clear' }, { date: '2025', status: 'clear' }, { date: '2026', status: 'clear' }] }
      ],
      flowColumns: ['6/29/2026 2200', '6/30/2026 0534', '6/30/2026 0700', '6/30/2026 0800'],
      intakeRows: [
        { label: 'Oral intake', values: { '6/30/2026 0700': '240 mL' } },
        { label: 'Urine occurrence', values: { '6/29/2026 2200': '1', '6/30/2026 0800': '1' } },
        { label: 'Mobility assistance', values: { '6/30/2026 0700': 'Assist x1' } }
      ],
      deliriumRows: [
        { label: 'Richmond Agitation Sedation Scale (RASS)', values: { '6/29/2026 2200': 'Alert and calm', '6/30/2026 0534': 'Alert and calm', '6/30/2026 0700': 'Alert and calm', '6/30/2026 0800': 'Alert and calm' } },
        { label: 'CAM-ICU overall status', values: { '6/29/2026 2200': 'Not Present', '6/30/2026 0700': 'Not Present' } },
        { label: 'Glasgow coma scale', values: { '6/30/2026 0800': '15' } }
      ],
      sepsisRows: [
        { label: 'Temperature abnormal', values: { '6/30/2026 0700': 'No' } },
        { label: 'Respiratory abnormal', values: { '6/30/2026 0700': 'No' } },
        { label: 'Provider notified', values: { '6/30/2026 0800': '-' } }
      ],
      dischargeRows: [
        { label: 'Infusion selection', values: { Status: 'Open', Owner: 'Nurse', Due: 'Today' } },
        { label: 'Discharge order', values: { Status: 'Pending', Owner: 'Provider', Due: 'Tomorrow' } },
        { label: 'Transportation needs', values: { Status: 'Needs review', Owner: 'Case Manager', Due: 'Today' } },
        { label: 'Discharge medication reconciliation', values: { Status: 'Not started', Owner: 'Provider', Due: 'Tomorrow' } },
        { label: 'Notify family/caregiver', values: { Status: 'Open', Owner: 'RN', Due: 'Today' } }
      ],
      transferRows: [
        { label: 'Site marked before procedure', value: '-' },
        { label: 'Consent', value: '-' },
        { label: 'H&P verified', value: '-' },
        { label: 'Procedure order verified', value: '-' },
        { label: 'Allergies reviewed', value: '-' },
        { label: 'Patient ID verified', value: '-' },
        { label: 'Blood consent signed', value: '-' },
        { label: 'NPO start', value: '-' }
      ],
      ticketRows: [
        { label: 'Transport mode', value: 'Bed' },
        { label: 'Oxygen required', value: 'No' },
        { label: 'Isolation alert visible', value: 'Yes' }
      ],
      marRows: [
        { label: 'Acetaminophen 650 mg', values: { '0600': '-', '1000': 'Given', '1400': '-', '1800': 'Due' } },
        { label: 'Meropenem 500 mg IV', values: { '0600': 'Given', '1000': '-', '1400': 'Due', '1800': '-' } },
        { label: 'Magnesium sulfate infusion', values: { '0600': 'Running', '1000': 'Running', '1400': 'Verify', '1800': '-' } },
        { label: 'PRN pain medication', values: { '0600': '-', '1000': 'Held', '1400': '-', '1800': '-' } }
      ],
      vitalRows: [
        { label: 'BP', values: { '6/29/2026 2200': '132/78', '6/30/2026 0534': '128/76', '6/30/2026 0700': '130/80', '6/30/2026 0800': '137/82' } },
        { label: 'Pulse', values: { '6/29/2026 2200': '82', '6/30/2026 0534': '78', '6/30/2026 0700': '80', '6/30/2026 0800': '84' } },
        { label: 'Respirations', values: { '6/29/2026 2200': '18', '6/30/2026 0534': '18', '6/30/2026 0700': '16', '6/30/2026 0800': '18' } },
        { label: 'Pain score', values: { '6/29/2026 2200': '2/10', '6/30/2026 0534': '0/10', '6/30/2026 0700': '1/10', '6/30/2026 0800': '2/10' } }
      ],
      assessmentRows: [
        { label: 'Neuro status', values: { '6/30/2026 0700': 'Alert', '6/30/2026 0800': 'Oriented' } },
        { label: 'Skin/wound', values: { '6/30/2026 0700': 'Dressing intact', '6/30/2026 0800': 'Photo due' } },
        { label: 'Fall precautions', values: { '6/30/2026 0700': 'Active', '6/30/2026 0800': 'Active' } }
      ],
      careTeamRows: [
        { label: 'Raja M Khan, MD', values: { Role: 'Attending', Shift: 'Current admission', Contact: '478-803-7525' } },
        { label: 'Cyra De Los Reyes, RN', values: { Role: 'Registered Nurse', Shift: '0700-1900', Contact: '478-803-7300' } },
        { label: 'Ahmad A Kabbani, MD', values: { Role: 'Consulting physician', Shift: 'On call', Contact: '478-745-2915' } },
        { label: 'Emily Swortzel, RD', values: { Role: 'Dietitian', Shift: 'Day', Contact: '478-803-7300' } }
      ],
      worklistRows: [
        { label: 'Wound management: dressing algorithm', values: { Time: '1000', Priority: 'Today', Status: 'Open' } },
        { label: 'Reassess pain and vitals', values: { Time: '1200', Priority: 'Routine', Status: 'Due' } },
        { label: 'Acknowledge new lab result', values: { Time: 'Now', Priority: 'High', Status: 'Unread' } },
        { label: 'Discharge readiness review', values: { Time: '1500', Priority: 'Today', Status: 'Pending' } }
      ],
      defaultRows: [
        { label: 'Current status', values: { '6/30/2026 0700': 'Reviewed' } },
        { label: 'Next action', values: { '6/30/2026 0800': 'Document follow-up' } }
      ],
      sidebarIndex: ['Orders', 'Plan of Care', 'Risk', 'Problem List', 'History', 'Blood Admin', 'Intake/Output', 'Care Team', 'Discharge', 'Notes'],
      medicalHistory: [
        { label: 'Diabetes', value: 'Type 2' },
        { label: 'Hypertension', value: 'Yes' },
        { label: 'Fall risk', value: 'High' },
        { label: 'Skin integrity', value: 'Active wound' },
        { label: 'Isolation', value: 'No isolation' }
      ],
      activeOrders: [
        { icon: 'mdi-bandage', color: '#be123c', title: 'Wound dressing change', detail: 'Daily at 0900' },
        { icon: 'mdi-flask', color: '#0369a1', title: 'CBC with differential', detail: 'Scheduled' },
        { icon: 'mdi-pill', color: '#7c3aed', title: 'Medication review', detail: 'Acknowledge' }
      ]
    }
  },
  computed: {
    activePatientId() {
      return this.patientId || this.activeChartId || (this.$route.params && this.$route.params.id) || ''
    },
    currentRole() {
      return this.previewRole || this.$store.state.auth.role || 'NURSE'
    },
    canLaunchMedical() {
      return ['ADMIN', 'DOCTOR', 'NP'].includes(this.currentRole)
    },
    roleOptions() {
      return Object.keys(ACCESS_PROFILES).map(value => ({ value, ...ACCESS_PROFILES[value] }))
    },
    accessProfile() {
      return ACCESS_PROFILES[this.currentRole] || ACCESS_PROFILES.NURSE
    },
    visibleChartTabs() {
      const allowed = TAB_ACCESS[this.currentRole] || TAB_ACCESS.NURSE
      return this.chartTabs.filter(tab => allowed.includes(tab))
    },
    visibleNavigatorTabs() {
      const allowed = NAV_ACCESS[this.currentRole] || NAV_ACCESS.NURSE
      return this.navigatorTabs.filter(item => allowed.includes(item.key))
    },
    activeNavigator() {
      return this.visibleNavigatorTabs.find(item => item.key === this.selectedNavigator) || this.visibleNavigatorTabs[0] || this.navigatorTabs[0]
    },
    activeSdohDomain() {
      return this.sdohDomains.find(item => item.key === this.activeSdoh) || this.sdohDomains[0]
    },
    userInitials() {
      const fullName = this.$store.state.auth.fullName || (this.$store.state.auth.user && this.$store.state.auth.user.username) || 'NJ'
      return fullName.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()
    },
    openCharts() {
      const patients = this.$store.getters['clinical/patientDirectory'] || []
      if (this.patientScoped && this.activePatientId) {
        const selected = this.findPatientRecord(this.activePatientId)
        const shortName = selected
          ? selected.displayName || selected.name || `${selected.lastName || 'Patient'}, ${selected.firstName || ''}`.trim()
          : this.activePatientId
        return [{ id: this.activePatientId, shortName }]
      }
      const base = patients.slice(0, 3).map((patient, index) => ({
        id: patient.id,
        shortName: patient.displayName || patient.name || `${patient.lastName || 'Patient'}, ${patient.firstName || index + 1}`
      }))
      return base.length ? base : [
        { id: 'demo-1', shortName: 'Howington, Sheria A' },
        { id: 'demo-2', shortName: 'Irwin, Charles C' },
        { id: 'demo-3', shortName: 'Rodriguez, Artavia' }
      ]
    },
    canSeeClinicalHistory() {
      return Boolean(this.accessProfile.clinical)
    },
    canViewOrders() {
      return Boolean(this.accessProfile.orders)
    },
    canViewSocialNeeds() {
      return Boolean(this.accessProfile.social)
    },
    visibleSidebarIndex() {
      const blocked = []
      if (!this.canViewOrders) blocked.push('Orders', 'Blood Admin')
      if (!this.canSeeClinicalHistory) blocked.push('Risk', 'Problem List', 'History', 'Intake/Output')
      if (!this.canViewSocialNeeds) blocked.push('Discharge')
      return this.sidebarIndex.filter(item => !blocked.includes(item))
    },
    visibleActiveOrders() {
      if (!this.canViewOrders) return []
      const patientOrders = [
        ...this.patientLabOrders.map(order => ({
          icon: 'mdi-flask',
          color: '#0369a1',
          title: order.test || order.orderName || order.title || 'Lab order',
          detail: order.status || order.priority || 'Requested'
        })),
        ...this.patientImagingOrders.map(order => ({
          icon: 'mdi-radiology-box',
          color: '#7c3aed',
          title: order.exam || order.study || order.title || 'Imaging order',
          detail: order.status || order.priority || 'Requested'
        })),
        ...this.patientMedications.map(order => ({
          icon: 'mdi-pill',
          color: '#0f766e',
          title: order.drug || order.medication || order.name || 'Medication',
          detail: order.dose || order.frequency || order.status || 'Active'
        }))
      ]
      const source = patientOrders.length ? patientOrders : this.activeOrders
      if (this.currentRole === 'LAB') return source.filter(order => order.icon === 'mdi-flask' || order.title.toLowerCase().includes('cbc'))
      if (this.currentRole === 'PHARMACY') return source.filter(order => order.icon === 'mdi-pill' || order.title.toLowerCase().includes('medication'))
      return source
    },
    patientVitals() {
      const all = this.$store.getters['clinical/getVitalSigns'] || []
      return all.filter(item => item.patientId === this.activePatientId)
    },
    latestVitals() {
      return latestByDate(this.patientVitals, 'recordedAt')
    },
    patientVisits() {
      const all = this.$store.getters['clinical/getVisits'] || []
      return all.filter(item => item.patientId === this.activePatientId)
    },
    latestVisit() {
      return latestByDate(this.patientVisits, 'createdAt')
    },
    patientNursingNotes() {
      const all = this.$store.getters['clinical/getNursingNotes'] || []
      return all.filter(item => item.patientId === this.activePatientId)
    },
    patientMedicalNotes() {
      const all = this.$store.getters['clinical/getMedicalNotes'] || []
      return all.filter(item => item.patientId === this.activePatientId)
    },
    patientTasks() {
      const all = this.$store.getters['clinical/getTasks'] || []
      return all.filter(item => item.patientId === this.activePatientId)
    },
    patientLabOrders() {
      const all = this.$store.getters['clinical/getLabOrders'] || []
      return all.filter(item => item.patientId === this.activePatientId)
    },
    patientImagingOrders() {
      const all = this.$store.getters['clinical/getImagingOrders'] || []
      return all.filter(item => item.patientId === this.activePatientId)
    },
    patientMedications() {
      const all = this.$store.getters['clinical/getMedications'] || []
      return all.filter(item => item.patientId === this.activePatientId)
    },
    visibleVitalRows() {
      if (!this.patientVitals.length) return this.vitalRows
      const latest = this.latestVitals || {}
      return [
        { label: 'BP', values: { 'Last Filed': latest.bp || '-' } },
        { label: 'Pulse', values: { 'Last Filed': latest.hr || '-' } },
        { label: 'Respirations', values: { 'Last Filed': latest.rr || '-' } },
        { label: 'Temperature', values: { 'Last Filed': latest.temp ? `${latest.temp} C` : '-' } },
        { label: 'SpO2', values: { 'Last Filed': latest.spo2 ? `${latest.spo2}%` : '-' } },
        { label: 'Pain score', values: { 'Last Filed': latest.pain !== undefined ? `${latest.pain}/10` : '-' } },
        { label: 'GCS', values: { 'Last Filed': latest.glasgow || '-' } }
      ]
    },
    visibleAssessmentRows() {
      const latest = this.latestVisit || {}
      if (!latest.assessment) return this.assessmentRows
      return [
        { label: 'General condition', values: { 'Last Filed': latest.assessment.generalCondition || '-' } },
        { label: 'Consciousness', values: { 'Last Filed': latest.assessment.consciousness || '-' } },
        { label: 'Respiratory status', values: { 'Last Filed': latest.assessment.respiratoryStatus || '-' } },
        { label: 'Nursing problems', values: { 'Last Filed': Array.isArray(latest.assessment.nursingProblems) ? latest.assessment.nursingProblems.join(', ') : '-' } }
      ]
    },
    visibleWorklistRows() {
      if (!this.patientTasks.length) return this.worklistRows
      return this.patientTasks.map(task => ({
        label: task.title || task.label || 'Care task',
        values: {
          Time: this.formatShortDate(task.createdAt || task.updatedAt),
          Priority: task.priority || task.assignedToRole || 'Routine',
          Status: task.status || 'pending'
        }
      }))
    },
    visibleMarRows() {
      if (!this.patientMedications.length) return this.marRows
      return this.patientMedications.map(med => ({
        label: med.drug || med.medication || med.name || 'Medication',
        values: {
          '0600': med.schedule === '0600' ? med.status || 'Due' : '-',
          '1000': med.schedule === '1000' ? med.status || 'Due' : '-',
          '1400': med.schedule === '1400' ? med.status || 'Due' : med.frequency || '-',
          '1800': med.schedule === '1800' ? med.status || 'Due' : med.dose || '-'
        }
      }))
    },
    visibleCareTeamRows() {
      const patient = this.findPatientRecord(this.activePatientId)
      const attending = patient && (patient.attending || patient.provider || patient.referredBy)
      if (!attending) return this.careTeamRows
      return [
        { label: attending, values: { Role: 'Attending / Referent', Shift: 'Current', Contact: patient.phone || '-' } },
        ...this.careTeamRows.slice(1)
      ]
    },
    activePatient() {
      const patient = this.findPatientRecord(this.activePatientId)
      if (!patient) {
        return {
          initials: 'SH',
          name: this.patientScoped ? 'Patient not found' : 'Sheria A. Howington',
          gender: 'Female',
          age: '79',
          dob: '6/22/1947',
          mrn: this.patientScoped ? this.activePatientId : '113332',
          account: this.patientScoped ? this.activePatientId : '125544',
          bed: 'RHQ 2FL-R2208-1',
          codeStatus: this.maskClinical('Code: Full Resuscitation'),
          precautions: this.maskClinical('Aspiration, bleeding, cardiac'),
          infectionStatus: this.maskClinical('No isolation'),
          attending: 'Raja M Khan, MD',
          allergies: this.maskMedication('Zolpidem, Vancomycin, Zinc Acetate'),
          admitted: '6/29/2026',
          patientClass: 'Inpatient',
          vitals: this.maskClinical('137 lb · 5 ft 5 in'),
          bmi: this.maskClinical('22.80')
        }
      }
      const name = patient.displayName || patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
      return {
        initials: initialsFor(name),
        name,
        gender: patient.gender || patient.sex || 'Sex N/A',
        age: patient.age || ageFromDob(patient.dob) || 'N/A',
        dob: patient.dob || 'DOB N/A',
        mrn: patient.mrn || patient.externalId || patient.id,
        account: patient.account || patient.id,
        bed: patient.bed || patient.currentDepartment || 'Ambulatory',
        codeStatus: this.maskClinical(patient.codeStatus || patient.code || 'Code: Full Resuscitation'),
        precautions: this.maskClinical(patient.precautions || 'Standard'),
        infectionStatus: this.maskClinical(patient.infectionStatus || 'No isolation'),
        attending: patient.attending || patient.provider || patient.referredBy || 'Provider not assigned',
        allergies: this.maskMedication(patient.allergies || 'No known allergies'),
        admitted: patient.admittedAt || patient.createdAt || 'N/A',
        patientClass: patient.patientClass || patient.patientStatus || 'Outpatient',
        vitals: this.maskClinical(this.latestVitalsSummary || patient.vitals || 'No current vitals'),
        bmi: this.maskClinical(this.latestBmi || patient.bmi || 'N/A')
      }
    },
    latestVitalsSummary() {
      if (!this.latestVitals) return ''
      const parts = []
      if (this.latestVitals.bp) parts.push(`BP ${this.latestVitals.bp}`)
      if (this.latestVitals.hr) parts.push(`HR ${this.latestVitals.hr}`)
      if (this.latestVitals.temp) parts.push(`${this.latestVitals.temp} C`)
      return parts.join(' · ')
    },
    latestBmi() {
      const v = this.latestVitals
      if (!v || !v.weight || !v.height) return ''
      return (v.weight / Math.pow(v.height / 100, 2)).toFixed(1)
    },
    acknowledgeOrders() {
      return [
        { label: 'Lab', count: this.patientLabOrders.length, icon: 'mdi-flask', color: '#be123c' },
        { label: 'Imaging', count: this.patientImagingOrders.length, icon: 'mdi-radiology-box', color: '#0369a1' },
        { label: 'Scheduled meds', count: this.patientMedications.length, icon: 'mdi-pill', color: '#475569' },
        { label: 'Tasks', count: this.patientTasks.length, icon: 'mdi-format-list-checks', color: '#475569' }
      ]
    }
  },
  watch: {
    currentRole: 'normalizeVisibleSelection',
    visibleChartTabs: 'normalizeVisibleSelection',
    visibleNavigatorTabs: 'normalizeVisibleSelection'
  },
  mounted() {
    this.$store.commit('clinical/LOAD_FROM_STORAGE')
    if (this.$store.hasModule && this.$store.hasModule('nursing')) {
      this.$store.commit('nursing/LOAD_FROM_STORAGE')
    }
    this.normalizeVisibleSelection()
  },
  methods: {
    findPatientRecord(id) {
      const directory = this.$store.getters['clinical/patientDirectory'] || []
      const patients = this.$store.getters['clinical/getPatients'] || []
      return directory.find(item => item.id === id) || patients.find(item => item.id === id) || null
    },
    normalizeVisibleSelection() {
      if (!this.visibleChartTabs.includes(this.selectedChartTab)) {
        this.selectedChartTab = this.visibleChartTabs[0] || 'Summary'
      }
      if (!this.visibleNavigatorTabs.some(item => item.key === this.selectedNavigator)) {
        this.selectedNavigator = this.visibleNavigatorTabs[0] ? this.visibleNavigatorTabs[0].key : 'admission'
      }
      if (!this.canViewSocialNeeds && this.selectedNavigator === 'sdoh') {
        this.selectedNavigator = this.visibleNavigatorTabs[0] ? this.visibleNavigatorTabs[0].key : 'admission'
      }
    },
    maskClinical(value) {
      return this.canSeeClinicalHistory ? value : 'Protected'
    },
    maskMedication(value) {
      return (this.canSeeClinicalHistory || this.currentRole === 'PHARMACY') ? value : 'Protected'
    },
    countGetter(name) {
      const value = this.$store.getters[name]
      return Array.isArray(value) ? value.length : 0
    },
    formatShortDate(value) {
      if (!value) return '-'
      try {
        return new Date(value).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      } catch (e) {
        return '-'
      }
    }
  }
}

function initialsFor(name) {
  return String(name || 'PT')
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function ageFromDob(dob) {
  if (!dob) return null
  const age = Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000)
  return Number.isFinite(age) ? age : null
}

function latestByDate(items, field) {
  if (!Array.isArray(items) || !items.length) return null
  return [...items]
    .filter(item => item && item[field])
    .sort((a, b) => new Date(b[field]) - new Date(a[field]))[0] || null
}
</script>

<style scoped>
.epic-workspace {
  min-height: calc(100vh - 72px);
  background: #dbe8e5;
  color: #1f2933;
  font-size: 12px;
}
.chart-topbar {
  height: 42px;
  background: #17a398;
  background-image: linear-gradient(135deg, rgba(255,255,255,0.16), transparent 40%);
  color: #083b38;
  display: grid;
  grid-template-columns: minmax(240px, 1fr) minmax(280px, 520px) minmax(220px, 1fr);
  align-items: center;
  gap: 16px;
  padding: 0 12px;
  border-bottom: 1px solid #0f766e;
}
.brand-row, .topbar-actions, .search-box {
  display: flex;
  align-items: center;
}
.brand-row strong {
  font-size: 13px;
  margin-right: 12px;
}
.environment {
  color: #0f4f4b;
  font-weight: 700;
}
.search-box {
  height: 24px;
  background: rgba(255,255,255,0.8);
  border: 1px solid rgba(15, 118, 110, 0.4);
  border-radius: 999px;
  padding: 0 12px;
  gap: 8px;
  color: #64748b;
  justify-content: center;
}
.topbar-actions {
  justify-content: flex-end;
  gap: 8px;
}
.role-switcher {
  height: 26px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.8);
  border: 1px solid rgba(15, 118, 110, 0.45);
  border-radius: 4px;
  padding: 0 6px;
  color: #0f4f4b;
  font-weight: 900;
}
.role-switcher span {
  font-size: 10px;
  text-transform: uppercase;
}
.role-switcher select {
  border: 0;
  background: transparent;
  color: #0f3f3b;
  font-size: 11px;
  font-weight: 900;
  outline: none;
}
.avatar-text {
  color: #075985;
  font-size: 11px;
  font-weight: 900;
}
.patient-tabs {
  height: 32px;
  display: flex;
  align-items: end;
  gap: 4px;
  padding: 0 8px;
  background: #b5d4d0;
  border-bottom: 1px solid #7fb5ae;
}
.patient-tab {
  height: 27px;
  min-width: 132px;
  border: 1px solid #7fb5ae;
  border-bottom: 0;
  background: #dcecea;
  color: #0f3f3b;
  font-weight: 800;
  cursor: pointer;
}
.patient-tab.active {
  background: #f8fbfb;
}
.access-strip {
  min-height: 34px;
  background: #f8fbfb;
  border-bottom: 1px solid #b7d8d2;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 5px 10px;
  color: #334155;
  font-size: 11px;
}
.access-strip div {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.access-strip strong {
  color: #0f766e;
  font-size: 12px;
}
.access-strip span {
  white-space: nowrap;
}
.chart-frame {
  display: grid;
  grid-template-columns: 198px minmax(0, 1fr) 320px;
  min-height: calc(100vh - 180px);
}
.storyboard {
  background: #d9efe8;
  border-right: 2px solid #0f766e;
  padding: 8px;
  overflow: auto;
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
.storyboard h1 {
  font-size: 15px;
  margin: 0;
  color: #134e4a;
}
.storyboard p {
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
.story-worklist h2, .clipboard-panel h2 {
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
.chart-main {
  min-width: 0;
  background: #eef5f4;
  display: flex;
  flex-direction: column;
}
.chart-tabs {
  height: 36px;
  display: flex;
  overflow-x: auto;
  gap: 2px;
  align-items: end;
  background: #eaf3f1;
  border-bottom: 1px solid #cbd5e1;
}
.chart-tabs button {
  height: 31px;
  border: 0;
  border-right: 1px solid #cbd5e1;
  background: transparent;
  padding: 0 9px;
  color: #0f3f3b;
  white-space: nowrap;
  font-weight: 800;
  cursor: pointer;
}
.chart-tabs button.active {
  background: #fff;
  border-top: 3px solid #0f766e;
}
.navigator-layout {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  min-height: 0;
  flex: 1;
}
.navigator-rail {
  background: #e5f0ef;
  border-right: 1px solid #94a3b8;
  padding: 8px;
  overflow: auto;
}
.navigator-rail h2 {
  margin: 0 0 8px;
  color: #134e4a;
  font-size: 17px;
}
.navigator-rail button {
  width: 100%;
  border: 0;
  background: transparent;
  color: #263f3d;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px;
  cursor: pointer;
  text-align: left;
  font-weight: 700;
}
.navigator-rail button.active {
  background: #d9f99d;
  border-left: 3px solid #0f766e;
}
.rail-group {
  border-top: 1px solid #cbd5e1;
  margin-top: 10px;
  padding-top: 8px;
  display: grid;
  gap: 4px;
}
.rail-group strong {
  color: #475569;
}
.rail-group a {
  color: #1d4ed8;
  text-decoration: none;
}
.workspace-panel {
  padding: 8px;
  overflow: auto;
  min-width: 0;
}
.workspace-title {
  min-height: 52px;
  background: #eefcf9;
  border: 1px solid #b7d8d2;
  border-left: 5px solid #0f766e;
  padding: 8px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.workspace-title p {
  margin: 0;
  color: #64748b;
  font-weight: 900;
  text-transform: uppercase;
}
.workspace-title h2 {
  margin: 2px 0 0;
  color: #134e4a;
  font-size: 16px;
}
.title-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.sdoh-card, .flow-section, .orders-panel, .clipboard-panel {
  background: #fff;
  border: 1px solid #b7c9c6;
  margin-top: 8px;
}
.section-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-weight: 900;
  font-size: 16px;
}
.section-title.purple {
  background: #d8cdf7;
  color: #5b21b6;
}
.sdoh-content {
  display: grid;
  grid-template-columns: 320px minmax(360px, 620px);
  align-items: center;
  justify-content: center;
  gap: 20px;
  min-height: 430px;
  padding: 20px;
}
.sdoh-wheel {
  position: relative;
  width: 270px;
  height: 270px;
  border-radius: 50%;
  margin: 20px auto;
  border: 24px solid #e5e7eb;
  background: #f8fafc;
}
.wheel-segment {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 62px;
  height: 62px;
  margin-left: -31px;
  margin-top: -31px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  cursor: pointer;
  color: #334155;
}
.wheel-segment.positive {
  background: #a7f3d0;
}
.wheel-segment.warning {
  background: #fde68a;
}
.wheel-segment.active {
  outline: 4px solid #0f766e;
  background: #86efac;
}
.wheel-center {
  position: absolute;
  inset: 74px;
  border-radius: 50%;
  background: white;
  border: 1px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  padding: 12px;
}
.wheel-center strong {
  font-size: 13px;
}
.wheel-center span {
  margin-top: 4px;
  color: #64748b;
}
.sdoh-popover {
  background: white;
  border: 1px solid #334155;
  box-shadow: 0 10px 24px rgba(15,23,42,0.18);
  padding: 18px;
  min-height: 310px;
  position: relative;
}
.sdoh-popover:before {
  content: "";
  position: absolute;
  left: -18px;
  top: 50%;
  width: 32px;
  height: 32px;
  background: white;
  border-left: 1px solid #334155;
  border-bottom: 1px solid #334155;
  transform: rotate(45deg);
}
.popover-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.popover-header h3 {
  color: #1d4ed8;
  margin: 0;
  font-size: 20px;
}
.popover-header p {
  margin: 5px 0 0;
  font-weight: 900;
}
.timeline {
  display: grid;
  grid-template-columns: 22px 1fr 22px 54px;
  align-items: center;
  gap: 6px;
  margin: 24px 0;
}
.timeline-track {
  height: 2px;
  background: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: space-around;
}
.timeline-point {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #16a34a;
  border: 2px solid white;
  box-shadow: 0 0 0 1px #64748b;
}
.timeline-point.risk { background: #be123c; }
.timeline-point.warning { background: #f97316; }
.popover-body {
  border-top: 4px solid #475569;
  padding-top: 14px;
}
.popover-body h4 {
  margin: 0 0 14px;
  font-size: 16px;
}
.assessment-name {
  font-weight: 900;
  margin: 0 0 12px;
}
.answer-row {
  display: grid;
  gap: 3px;
  margin-bottom: 12px;
}
.answer-row span {
  color: #334155;
}
.outside-data {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #1d4ed8;
  font-weight: 800;
  padding-bottom: 12px;
  text-decoration: none;
}
.flow-section header {
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #e7f4e2;
  border-bottom: 1px solid #cbd5e1;
  padding: 5px 8px;
}
.flow-section header div {
  display: flex;
  align-items: center;
  gap: 6px;
}
.flow-section header a {
  color: #1d4ed8;
  font-weight: 800;
  text-decoration: none;
}
.required-dot {
  color: #0f766e;
  font-weight: 900;
}
.flow-grid {
  display: grid;
  overflow-x: auto;
}
.flow-cell {
  min-height: 26px;
  border-right: 1px solid #d7e0df;
  border-bottom: 1px solid #d7e0df;
  padding: 5px 7px;
}
.column-cell {
  color: #1d4ed8;
  font-weight: 900;
  text-align: center;
}
.row-label {
  font-weight: 700;
  color: #334155;
}
.value-cell {
  color: #0f172a;
  text-align: center;
}
.info-banner {
  background: #dff4ed;
  border: 1px solid #b7d8d2;
  padding: 8px 10px;
  display: flex;
  gap: 6px;
  align-items: center;
  font-weight: 900;
  margin-top: 8px;
}
.discharge-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  background: white;
  border: 1px solid #b7c9c6;
  padding: 16px;
  margin-top: 8px;
}
.discharge-summary h3 {
  margin: 0 0 8px;
  color: #134e4a;
}
.segmented {
  display: inline-flex;
  border: 1px solid #94a3b8;
}
.segmented button {
  border: 0;
  border-right: 1px solid #94a3b8;
  background: #f8fafc;
  padding: 5px 10px;
  font-weight: 800;
}
.segmented button:last-child {
  border-right: 0;
}
.segmented button.active {
  background: #0f766e;
  color: white;
}
.clinical-clipboard {
  background: #eef5f4;
  border-left: 2px solid #0f766e;
  padding: 8px;
  overflow: auto;
}
.clipboard-tabs {
  display: flex;
  gap: 2px;
  margin-bottom: 8px;
}
.clipboard-tabs button {
  flex: 1;
  min-height: 30px;
  border: 1px solid #cbd5e1;
  background: #e2e8f0;
  color: #334155;
  font-weight: 800;
  cursor: pointer;
}
.clipboard-tabs button.active {
  background: white;
  border-top: 3px solid #0f766e;
}
.clipboard-panel {
  padding: 8px;
}
.index-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 12px;
}
.index-grid a {
  color: #1d4ed8;
  font-weight: 700;
  text-decoration: none;
}
.history-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid #e2e8f0;
  padding: 4px 0;
}
.history-row span {
  color: #64748b;
}
.orders-panel {
  min-height: 300px;
  position: relative;
}
.orders-header {
  height: 34px;
  background: #e2e8f0;
  border-bottom: 1px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
}
.order-list {
  display: grid;
  gap: 6px;
  padding: 8px;
}
.order-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  border: 1px solid #e2e8f0;
  padding: 8px;
  background: #fff;
}
.order-row div {
  display: grid;
  gap: 2px;
}
.order-row span {
  color: #64748b;
}
.no-orders {
  height: 210px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: #94a3b8;
  font-size: 24px;
  font-weight: 900;
}
.sign-button {
  position: absolute;
  bottom: 8px;
  right: 8px;
  border: 0;
  background: transparent;
  color: #7f1d1d;
  font-weight: 900;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
@media (max-width: 1280px) {
  .chart-frame {
    grid-template-columns: 190px minmax(0, 1fr);
  }
  .clinical-clipboard {
    display: none;
  }
}
@media (max-width: 920px) {
  .chart-topbar {
    grid-template-columns: 1fr;
    height: auto;
    padding: 8px;
  }
  .access-strip {
    align-items: flex-start;
    flex-direction: column;
  }
  .access-strip div {
    flex-wrap: wrap;
  }
  .chart-frame, .navigator-layout, .sdoh-content, .discharge-summary {
    grid-template-columns: 1fr;
  }
  .storyboard {
    display: none;
  }
  .sdoh-popover:before {
    display: none;
  }
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
