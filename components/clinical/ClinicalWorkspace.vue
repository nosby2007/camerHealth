<template>
  <div class="emr-workspace">
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
      <div
        v-for="chart in openPatientChartsDisplay"
        :key="chart.id"
        :class="['patient-tab', { active: chart.id === activePatientId }]"
      >
        <button type="button" class="patient-tab-label" @click="selectOpenChart(chart)">
          {{ chart.shortName }}
        </button>
        <button
          v-if="patientScoped"
          type="button"
          class="patient-tab-close"
          :aria-label="`Close ${chart.shortName} chart`"
          @click.stop="closeOpenChart(chart)"
        >
          <v-icon x-small>mdi-close</v-icon>
        </button>
      </div>
      <button
        v-if="patientScoped"
        type="button"
        class="patient-tab-add"
        aria-label="Open another patient chart"
        @click="$router.push('/clinical/patients')"
      >
        <v-icon x-small>mdi-plus</v-icon>
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

    <PatientBanner
      :patient="activePatient"
      :fall-risk="fallRiskEntry"
      :skin-integrity="skinIntegrityEntry"
      :closable="patientScoped"
      @close="closePatientChart"
    />

    <div class="chart-frame" :class="{ 'left-collapsed': effectiveLeftPanelCollapsed, 'right-collapsed': effectiveRightPanelCollapsed }">
      <LeftPatientPanel
        :patient="activePatient"
        :access-profile="accessProfile"
        :acknowledge-orders="acknowledgeOrders"
        :collapsed="effectiveLeftPanelCollapsed"
        @toggle="toggleLeftPanel"
      />

      <main class="chart-main">
        <TabNav
          :primary-tabs="primaryTabs"
          :overflow-tabs="overflowTabs"
          :selected-tab="selectedChartTab"
          @select="selectChartTab"
        />

        <div class="navigator-layout">
          <nav v-if="selectedChartTab === 'Navigators'" class="navigator-tab-strip">
            <button
              v-for="nav in visibleNavigatorTabs"
              :key="nav.key"
              :class="{ active: selectedNavigator === nav.key }"
              @click="selectNavigator(nav.key)"
            >
              <v-icon x-small>{{ nav.icon }}</v-icon>
              {{ nav.label }}
            </button>
          </nav>
          <aside class="navigator-rail">
            <div class="rail-group" v-if="activeNavigator">
              <strong>{{ activeNavigator.label }}</strong>
              <a
                v-for="section in activeNavigatorSections"
                :key="section.key"
                :class="['navigator-section-link', navigatorSectionStatus(section).status, { active: selectedNavigatorSection === section.key }]"
                href="#"
                @click.prevent="selectedNavigatorSection = section.key"
              >
                <small v-if="section.group">{{ section.group }}</small>
                <span>
                  {{ section.label }}
                  <i>{{ navigatorSectionStatus(section).label }}</i>
                </span>
              </a>
            </div>
          </aside>

          <section class="workspace-panel">
            <div class="workspace-title">
              <div>
                <p>{{ workspaceEyebrow }}</p>
                <h2>{{ workspaceHeadline }}</h2>
              </div>
      <div class="title-actions">
        <v-btn
          x-small
          text
          color="#0f766e"
          class="font-weight-black"
          @click="dialogs.tabManager = true"
        >
          <v-icon x-small left>mdi-tune-variant</v-icon>Manage tabs
        </v-btn>
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
              @click="openChartDialog('nurse')"
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
              @click="openChartDialog('medical')"
            >
              <v-icon x-small left>mdi-medical-bag</v-icon>Medical
            </v-btn>
            <v-btn x-small depressed color="#0f766e" dark class="font-weight-black" @click="openChartDialog('nurse')">
              <v-icon x-small left>mdi-plus</v-icon>New Reading
                </v-btn>
              </div>
            </div>

            <section v-if="selectedChartTab === 'Navigators'" class="navigator-focus-panel">
              <div class="navigator-focus-head">
                <div>
                  <span>{{ activeNavigator.label }}</span>
                  <strong>{{ activeNavigatorSectionMeta.label }}</strong>
                  <p>{{ activeNavigatorSectionMeta.detail }}</p>
                </div>
                <div class="navigator-focus-actions">
                  <v-btn
                    v-for="action in navigatorQuickActions"
                    :key="action.label"
                    x-small
                    :text="!action.primary"
                    :depressed="action.primary"
                    :color="action.color"
                    :dark="action.primary"
                    @click="openCommandAction(action.action)"
                  >
                    <v-icon x-small left>{{ action.icon }}</v-icon>{{ action.label }}
                  </v-btn>
                </div>
              </div>
              <div class="navigator-focus-grid">
                <article v-for="row in navigatorSectionProgressRows" :key="row.label" :class="row.status">
                  <span>{{ row.label }}</span>
                  <strong>{{ row.value }}</strong>
                  <small>{{ row.detail }}</small>
                </article>
              </div>
            </section>

            <section v-if="selectedChartTab === 'Summary'" class="patient-summary-dashboard">
              <div class="summary-hero">
                <div>
                  <span>Patient summary</span>
                  <strong>{{ summaryHeadline }}</strong>
                  <p>{{ summaryNarrative }}</p>
                </div>
                <div class="summary-actions">
                  <v-btn x-small depressed color="#003366" dark @click="openCommandAction('nurse')">
                    <v-icon x-small left>mdi-stethoscope</v-icon>Nurse entry
                  </v-btn>
                  <v-btn x-small depressed color="#0f766e" dark @click="openCommandAction('flowsheet')">
                    <v-icon x-small left>mdi-clock-edit-outline</v-icon>Timed care
                  </v-btn>
                  <v-btn x-small text color="#7c3aed" @click="openCommandAction('handoff')">
                    <v-icon x-small left>mdi-handshake-outline</v-icon>Handoff
                  </v-btn>
                </div>
              </div>

              <div class="summary-status-grid">
                <article v-for="item in summaryStatusCards" :key="item.label" :class="['summary-status-card', item.status]">
                  <v-icon small>{{ item.icon }}</v-icon>
                  <div>
                    <span>{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                    <p>{{ item.detail }}</p>
                  </div>
                </article>
              </div>

            <div class="summary-columns">
              <section class="summary-panel">
                <header>
                  <span>Today priorities</span>
                  <strong>What must move before handoff</strong>
                  </header>
                  <div class="summary-list">
                    <button
                      v-for="item in summaryPriorityItems"
                      :key="item.label"
                      type="button"
                      @click="openCommandAction(item.action)"
                    >
                      <i :class="item.level"></i>
                      <div>
                        <strong>{{ item.label }}</strong>
                        <span>{{ item.detail }}</span>
                      </div>
                    </button>
                  </div>
                </section>

                <section class="summary-panel">
                  <header>
                    <span>Care continuity</span>
                    <strong>Last filed and next owner</strong>
                  </header>
                  <div class="summary-timeline">
                    <article v-for="item in summaryContinuityItems" :key="item.label">
                      <small>{{ item.time }}</small>
                      <div>
                        <strong>{{ item.label }}</strong>
                        <span>{{ item.detail }}</span>
                      </div>
                    </article>
                  </div>
                </section>
              </div>

              <div class="summary-columns">
                <section class="summary-panel">
                  <header>
                    <span>Care plan</span>
                    <strong>Goals, interventions and outcomes</strong>
                  </header>
                  <div class="summary-list compact">
                    <button
                      v-for="item in carePlanSummaryCards"
                      :key="item.label"
                      type="button"
                      @click="openCommandAction('care-plan')"
                    >
                      <i :class="item.level"></i>
                      <div>
                        <strong>{{ item.label }}</strong>
                        <span>{{ item.detail }}</span>
                      </div>
                    </button>
                  </div>
                </section>

                <section class="summary-panel">
                  <header>
                    <span>Education</span>
                    <strong>Teaching completed and family education</strong>
                  </header>
                  <div class="summary-list compact">
                    <button
                      v-for="item in educationSummaryCards"
                      :key="item.label"
                      type="button"
                      @click="openCommandAction('education')"
                    >
                      <i :class="item.level"></i>
                      <div>
                        <strong>{{ item.label }}</strong>
                        <span>{{ item.detail }}</span>
                      </div>
                    </button>
                  </div>
                </section>
              </div>

              <div class="summary-columns">
                <FlowSection
                  title="Patient Snapshot"
                  :columns="['Current']"
                  :rows="summaryRows"
                />
                <FlowSection
                  title="Latest Clinical Signals"
                  :columns="['Last Filed']"
                  :rows="visibleVitalRows"
                />
              </div>

              <FlowSection
                v-if="summaryActiveOrderRows.length"
                title="Active Orders Summary"
                :columns="['Detail']"
                :rows="summaryActiveOrderRows"
              />
              <FlowSection
                v-if="summaryLatestNoteRows.length"
                title="Latest Notes"
                :columns="['Type', 'Recorded', 'Summary']"
                :rows="summaryLatestNoteRows"
              />
              <FlowSection
                v-if="summaryPendingTaskRows.length"
                title="Pending Tasks / Required Documentation"
                :columns="['Status']"
                :rows="summaryPendingTaskRows"
              />
            </section>

            <section v-else-if="selectedChartTab === 'EMR Command Center'" class="emr-command-center">
              <div class="command-brief">
                <div>
                  <span>General hospital command center</span>
                  <strong>Protected 360 view for departments, offline work and Cameroonian hospital operations.</strong>
                </div>
                <div class="command-brief-actions">
                  <v-chip small label color="#dcfce7" text-color="#166534" class="font-weight-black">
                    Offline ready
                  </v-chip>
                  <v-chip small label color="#e0f2fe" text-color="#075985" class="font-weight-black">
                    {{ accessProfile.short }} scope
                  </v-chip>
                  <v-btn x-small depressed color="#0f766e" dark @click="openCommandAction('nurse')">
                    <v-icon x-small left>mdi-clipboard-pulse-outline</v-icon>Document
                  </v-btn>
                </div>
              </div>

              <div class="command-card-grid" aria-label="Hospital command modules">
                <article
                  v-for="card in emrCommandCards"
                  :key="card.key"
                  :class="['command-card', card.status]"
                >
                  <div class="command-card-icon">
                    <v-icon small>{{ card.icon }}</v-icon>
                  </div>
                  <div>
                    <strong>{{ card.label }}</strong>
                    <span>{{ card.owner }}</span>
                    <p>{{ card.detail }}</p>
                  </div>
                  <button type="button" @click="openCommandAction(card.action)">
                    {{ card.actionLabel }}
                  </button>
                </article>
              </div>

              <div class="command-two-column">
                <FlowSection
                  title="Department Coverage"
                  :columns="['Status', 'Owner', 'Next']"
                  :rows="departmentCoverageRows"
                />
                <FlowSection
                  title="Offline and Low-Bandwidth Readiness"
                  :columns="['State', 'Fallback', 'Action']"
                  :rows="offlineReadinessRows"
                />
              </div>

              <div class="command-two-column">
                <FlowSection
                  title="360 Patient Cycle"
                  :columns="['State', 'Lead', 'Next']"
                  :rows="patientCycleRows"
                />
                <FlowSection
                  title="Department Handoff Matrix"
                  :columns="['From', 'To', 'Action']"
                  :rows="departmentHandoffRows"
                />
              </div>

              <FlowSection
                title="My Role - Actions Now"
                :columns="['Priority', 'Where', 'Action']"
                :rows="roleActionRows"
              />
            </section>

            <section v-else-if="selectedChartTab === 'Nurse Command Center'" class="nurse-command-center">
              <div class="command-brief nurse">
                <div>
                  <span>Nurse command center</span>
                  <strong>One shift board for vitals, nursing tasks, medication safety, hygiene, mobility, wound care and handoff.</strong>
                </div>
                <div class="command-brief-actions">
                  <v-btn x-small depressed color="#003366" dark @click="openCommandAction('nurse')">
                    <v-icon x-small left>mdi-stethoscope</v-icon>New nursing entry
                  </v-btn>
                  <v-btn x-small depressed color="#0f766e" dark @click="openCommandAction('flowsheet')">
                    <v-icon x-small left>mdi-clock-edit-outline</v-icon>Timed flowsheet
                  </v-btn>
                  <v-btn x-small depressed color="#be123c" dark @click="openCommandAction('body')">
                    <v-icon x-small left>mdi-human</v-icon>Body assessment
                  </v-btn>
                  <v-btn x-small depressed color="#0f766e" dark @click="openCommandAction('medication')">
                    <v-icon x-small left>mdi-pill</v-icon>MAR
                  </v-btn>
                  <v-btn x-small depressed color="#7c3aed" dark @click="openCommandAction('handoff')">
                    <v-icon x-small left>mdi-handshake-outline</v-icon>Handoff
                  </v-btn>
                </div>
              </div>

              <div class="nurse-focus-grid">
                <article v-for="item in nurseCommandTiles" :key="item.label" :class="['nurse-focus-card', item.status]">
                  <v-icon small>{{ item.icon }}</v-icon>
                  <div>
                    <strong>{{ item.label }}</strong>
                    <span>{{ item.value }}</span>
                    <p>{{ item.action }}</p>
                  </div>
                </article>
              </div>

              <div class="command-two-column">
                <FlowSection
                  title="Shift Care Board"
                  :columns="['Time', 'Priority', 'Action']"
                  :rows="nurseShiftRows"
                />
                <FlowSection
                  title="Aide-Soignant and Support Tasks"
                  :columns="['Status', 'Owner', 'Action']"
                  :rows="supportCareRows"
                />
              </div>

              <FlowSection
                title="Safety, Escalation and Handoff"
                :columns="['Signal', 'Owner', 'Action']"
                :rows="nurseEscalationRows"
              />
            </section>

            <section v-else-if="selectedChartTab === 'Chart Review'" class="flowsheet">
              <FlowSection
                title="Encounter Timeline"
                :columns="['Type', 'Recorded', 'Clinician']"
                :rows="chartReviewRows"
              />
              <FlowSection
                title="Problem and Risk Review"
                :columns="['Status']"
                :rows="riskReviewRows"
              />
            </section>

            <section v-else-if="selectedChartTab === 'Avatar'" class="avatar-workspace">
              <div class="avatar-command">
                <div>
                  <span>Clinical avatar</span>
                  <strong>Body map for risks, wounds, pain, lines, mobility and medication workload</strong>
                  <p>{{ avatarNarrative }}</p>
                </div>
                <div class="flowsheet-actions">
                  <v-btn x-small depressed color="#0f766e" dark @click="openCommandAction('body')">
                    <v-icon x-small left>mdi-human</v-icon>Body assessment
                  </v-btn>
                  <v-btn x-small depressed color="#0f766e" dark @click="openCommandAction('flowsheet')">
                    <v-icon x-small left>mdi-clock-edit-outline</v-icon>Timed care
                  </v-btn>
                  <v-btn x-small text color="#7c3aed" @click="dialogs.woundCare = true">
                    <v-icon x-small left>mdi-bandage</v-icon>Wound care
                  </v-btn>
                </div>
              </div>

              <div class="avatar-zone-strip">
                <button
                  v-for="zone in avatarZones"
                  :key="zone.key"
                  type="button"
                  :class="['avatar-zone-card', zone.status, { selected: activeAvatarZone === zone.key }]"
                  @click="activeAvatarZone = zone.key"
                >
                  <v-icon small :color="zone.color">{{ zone.icon }}</v-icon>
                  <strong>{{ zone.short }}</strong>
                  <span>{{ zone.statusLabel }}</span>
                </button>
              </div>

              <div class="avatar-grid">
                <section class="patient-body-panel" aria-label="Patient body avatar">
                  <div class="avatar-placement-palette" aria-label="Avatar placement tools">
                    <button
                      v-for="tool in avatarPlacementTools"
                      :key="tool.key"
                      type="button"
                      draggable="true"
                      :class="{ active: selectedAvatarTool === tool.key }"
                      @click="selectAvatarTool(tool.key)"
                      @dragstart="startAvatarToolDrag($event, tool.key)"
                    >
                      <v-icon small :color="tool.color">{{ tool.icon }}</v-icon>
                      <span>{{ tool.label }}</span>
                    </button>
                  </div>
                  <div class="avatar-legend">
                    <span><i class="risk"></i>Risk</span>
                    <span><i class="active"></i>Active care</span>
                    <span><i class="stable"></i>Stable</span>
                  </div>
                  <div class="avatar-view-toggle">
                    <button :class="{ active: avatarView === 'front' }" type="button" @click="avatarView = 'front'">Front</button>
                    <button :class="{ active: avatarView === 'back' }" type="button" @click="avatarView = 'back'">Back</button>
                  </div>
                  <div class="body-canvas">
                    <div
                      ref="avatarBodyFigure"
                      :class="['body-figure', avatarView, avatarAnatomy, { 'with-image': avatarImageSrc, placing: selectedAvatarTool }]"
                      @click="handleAvatarCanvasClick"
                      @dragover.prevent
                      @drop.prevent="handleAvatarDrop"
                    >
                      <img
                        v-if="avatarImageSrc"
                        class="body-avatar-image"
                        :src="avatarImageSrc"
                        :alt="`${avatarAnatomyLabel} ${avatarView} body avatar`"
                      >
                      <button
                        v-for="zone in visibleAvatarZones"
                        :key="zone.key"
                        :class="['body-zone', zone.key, zone.status, { selected: activeAvatarZone === zone.key }]"
                        type="button"
                        @click.stop="activeAvatarZone = zone.key"
                      >
                        <v-icon x-small>{{ zone.icon }}</v-icon>
                        <span>{{ zone.short }}</span>
                      </button>
                      <button
                        v-for="item in visibleAvatarPlacements"
                        :key="item.id"
                        type="button"
                        :class="['avatar-sticker', item.type, avatarPlacementStatusClass(item)]"
                        :style="avatarPlacementStyle(item)"
                        :title="`${item.label} - ${item.region}`"
                        @click.stop="openAvatarPlacement(item)"
                      >
                        <v-icon x-small>{{ item.icon }}</v-icon>
                      </button>
                      <div class="body-head"></div>
                      <div class="body-ear left"></div>
                      <div class="body-ear right"></div>
                      <div v-if="avatarView === 'front'" class="body-face"></div>
                      <div class="body-neck"></div>
                      <div class="body-shoulder"></div>
                      <div class="body-torso"></div>
                      <div v-if="avatarView === 'front' && avatarAnatomy === 'female'" class="body-breast left"></div>
                      <div v-if="avatarView === 'front' && avatarAnatomy === 'female'" class="body-breast right"></div>
                      <div v-if="avatarView === 'front'" class="body-pelvis"></div>
                      <div v-if="avatarView === 'back'" class="body-spine"></div>
                      <div v-if="avatarView === 'back'" class="body-glute left"></div>
                      <div v-if="avatarView === 'back'" class="body-glute right"></div>
                      <div class="body-arm left"></div>
                      <div class="body-arm right"></div>
                      <div class="body-hand left"></div>
                      <div class="body-hand right"></div>
                      <div class="body-leg left"></div>
                      <div class="body-leg right"></div>
                      <div class="body-foot left"></div>
                      <div class="body-foot right"></div>
                    </div>
                  </div>
                </section>

                <section class="avatar-detail-panel">
                  <header>
                    <div>
                      <v-icon small :color="activeAvatarZoneRecord.color">{{ activeAvatarZoneRecord.icon }}</v-icon>
                      <strong>{{ activeAvatarZoneRecord.label }}</strong>
                    </div>
                    <span>{{ activeAvatarZoneRecord.statusLabel }}</span>
                  </header>
                  <p>{{ activeAvatarZoneRecord.detail }}</p>
                  <div class="avatar-placement-summary">
                    <span>{{ avatarPlacements.length }} placed item(s)</span>
                    <strong v-if="selectedAvatarToolRecord">Click anatomy to place: {{ selectedAvatarToolRecord.label }}</strong>
                    <strong v-else>Select or drag a sticker to document exact location.</strong>
                  </div>
                  <div class="avatar-actions">
                    <button @click="openAvatarAction(activeAvatarZoneRecord.primaryAction)">
                      <v-icon x-small>mdi-note-plus</v-icon>
                      {{ activeAvatarZoneRecord.primaryActionLabel }}
                    </button>
                    <button v-if="activeAvatarZoneRecord.key === 'skin'" @click="dialogs.woundCare = true">
                      <v-icon x-small>mdi-bandage</v-icon>
                      Wound reassessment
                    </button>
                    <button @click="openCommandAction('flowsheet')">
                      <v-icon x-small>mdi-clock-edit-outline</v-icon>
                      Timed flowsheet
                    </button>
                    <button @click="openChartDialog('document')">
                      <v-icon x-small>mdi-camera-plus</v-icon>
                      Photo / document
                    </button>
                  </div>
                  <FlowSection
                    title="Selected Zone Detail"
                    :columns="['Status', 'Evidence', 'Action']"
                    :rows="activeAvatarRows"
                  />
                  <FlowSection
                    title="Placed LDA / Wound / Devices"
                    :columns="['Type', 'Region', 'Status']"
                    :rows="avatarPlacementRows"
                  />
                </section>
              </div>

              <FlowSection
                title="Avatar Systems Review"
                required
                :columns="['Status', 'Evidence', 'Action']"
                :rows="avatarSystemRows"
              />
              <FlowSection
                title="Lines, Wounds and Care Targets"
                :columns="['Location', 'Status', 'Next Step']"
                :rows="avatarCareTargetRows"
              />
              <FlowSection
                title="Avatar Priorities"
                :columns="['Reason', 'Owner', 'Next Action']"
                :rows="avatarPriorityRows"
              />
            </section>

            <section v-else-if="selectedChartTab === 'Orders'" class="orders-workspace">
              <div class="orders-command">
                <div>
                  <span>Orders</span>
                  <strong>Medication, diagnostics and care orders</strong>
                </div>
                <div class="orders-quick-actions">
                  <v-btn x-small depressed color="#0369a1" dark @click="openOrderComposer('lab')">
                    <v-icon x-small left>mdi-flask</v-icon>Lab
                  </v-btn>
                  <v-btn x-small depressed color="#7c3aed" dark @click="openOrderComposer('imaging')">
                    <v-icon x-small left>mdi-radiology-box</v-icon>Imaging
                  </v-btn>
                  <v-btn x-small depressed color="#0f766e" dark @click="openOrderComposer('medication')">
                    <v-icon x-small left>mdi-pill-plus</v-icon>Medication
                  </v-btn>
                </div>
              </div>

              <div class="orders-tabs" role="tablist" aria-label="Order views">
                <button
                  v-for="tab in orderWorkspaceTabs"
                  :key="tab.key"
                  type="button"
                  :class="{ active: selectedOrderView === tab.key }"
                  @click="selectedOrderView = tab.key"
                >
                  <span>{{ tab.label }}</span>
                  <strong>{{ tab.count }}</strong>
                </button>
              </div>

              <div class="orders-controls">
                <label class="orders-toggle">
                  <input v-model="showHomeMedications" type="checkbox">
                  <span>Show Home Medications</span>
                </label>
                <label>
                  <span>Sort by</span>
                  <select v-model="orderSortBy">
                    <option v-for="option in orderSortOptions" :key="option" :value="option">{{ option }}</option>
                  </select>
                </label>
                <label>
                  <span>Go to</span>
                  <select v-model="orderGoTo">
                    <option v-for="option in orderGoToOptions" :key="option" :value="option">{{ option }}</option>
                  </select>
                </label>
              </div>

              <div class="orders-layout">
                <div class="orders-main">
                  <section v-for="group in visibleOrderGroups" :key="group.key" class="order-group">
                    <header>
                      <div>
                        <strong>{{ group.title }}</strong>
                        <span>{{ group.rows.length }} item(s)</span>
                      </div>
                      <button type="button" @click="orderGoTo = group.title">
                        <v-icon x-small>mdi-arrow-down-right</v-icon>
                        Focus
                      </button>
                    </header>

                    <article v-for="order in group.rows" :key="order.id" class="order-card" :class="order.statusClass">
                      <div class="order-card-icon">
                        <v-icon small :color="order.color">{{ order.icon }}</v-icon>
                      </div>
                      <div class="order-card-body">
                        <div class="order-card-title">
                          <strong>{{ order.label }}</strong>
                          <span>{{ order.typeLabel }}</span>
                        </div>
                        <p>{{ order.detail }}</p>
                        <div class="order-meta">
                          <span>{{ order.status }}</span>
                          <span>{{ order.schedule }}</span>
                          <span>{{ order.orderedBy }}</span>
                        </div>
                      </div>
                      <div class="order-action-buttons">
                        <button type="button" @click="handleOrderAction('modify', order)">
                          <v-icon x-small>mdi-pencil</v-icon>
                          Modify
                        </button>
                        <button type="button" @click="handleOrderAction('hold', order)">
                          <v-icon x-small>mdi-pause</v-icon>
                          Hold
                        </button>
                        <button type="button" @click="handleOrderAction('discontinue', order)">
                          <v-icon x-small>mdi-close-circle-outline</v-icon>
                          Discontinue
                        </button>
                      </div>
                    </article>
                  </section>

                  <div v-if="!visibleOrderGroups.length" class="empty-orders compact">
                    <v-icon size="42" color="#94a3b8">mdi-clipboard-text-outline</v-icon>
                    <strong>No orders in this view</strong>
                    <span>Use New, Lab, Imaging or Medication to place an order from Patient 360.</span>
                  </div>
                </div>

                <aside class="order-sidebar-panel">
                  <div class="order-sidebar-tabs">
                    <button type="button" :class="{ active: selectedOrderPanel === 'manage' }" @click="selectedOrderPanel = 'manage'">Manage Orders</button>
                    <button type="button" :class="{ active: selectedOrderPanel === 'sets' }" @click="selectedOrderPanel = 'sets'">Order Sets</button>
                  </div>

                  <div class="order-provider">
                    <v-icon small color="#0f766e">mdi-account-tie</v-icon>
                    <div>
                      <span>Providers</span>
                      <strong>{{ activePatient.provider || activePatient.attending || 'Provider not assigned' }}</strong>
                    </div>
                  </div>

                  <div class="order-search-row">
                    <input v-model="orderSearch" type="search" placeholder="Place orders, order sets, or pathways">
                    <button type="button" @click="openOrderComposer(orderMode)">
                      <v-icon x-small>mdi-plus</v-icon>
                      New
                    </button>
                  </div>

                  <label class="order-mode-row">
                    <span>Select order mode</span>
                    <select v-model="orderMode">
                      <option v-for="option in orderModeOptions" :key="option" :value="option">{{ option }}</option>
                    </select>
                  </label>

                  <div v-if="selectedOrderPanel === 'manage'" class="order-set-list">
                    <button
                      v-for="suggestion in orderEntrySuggestions"
                      :key="suggestion.label"
                      type="button"
                      @click="openOrderComposer(suggestion.kind)"
                    >
                      <v-icon small :color="suggestion.color">{{ suggestion.icon }}</v-icon>
                      <div>
                        <strong>{{ suggestion.label }}</strong>
                        <span>{{ suggestion.detail }}</span>
                      </div>
                    </button>
                  </div>
                  <div v-else class="order-set-list">
                    <button v-for="set in orderSetSuggestions" :key="set.label" type="button" @click="openOrderSet(set)">
                      <v-icon small color="#0f766e">mdi-folder-plus-outline</v-icon>
                      <div>
                        <strong>{{ set.label }}</strong>
                        <span>{{ set.detail }}</span>
                      </div>
                    </button>
                  </div>
                </aside>
              </div>
            </section>

            <section v-else-if="selectedChartTab === 'MAR'" class="emar-workspace">
              <div class="emar-command">
                <div>
                  <span>eMAR</span>
                  <strong>Medication Administration Record</strong>
                </div>
                <div class="emar-command-actions">
                  <v-btn x-small depressed color="#0f766e" dark @click="openMarQuickScan">
                    <v-icon x-small left>mdi-barcode-scan</v-icon>Scan med
                  </v-btn>
                  <v-btn x-small depressed color="#7c3aed" dark @click="openChartDialog('medication')">
                    <v-icon x-small left>mdi-pill-plus</v-icon>Medication order
                  </v-btn>
                </div>
              </div>

              <div class="emar-tabs" role="tablist" aria-label="eMAR views">
                <button
                  v-for="tab in marViewTabs"
                  :key="tab.key"
                  type="button"
                  :class="{ active: selectedMarView === tab.key }"
                  @click="selectedMarView = tab.key"
                >
                  <span>{{ tab.label }}</span>
                  <strong>{{ tab.count }}</strong>
                </button>
              </div>

              <div class="emar-controls">
                <label>
                  <span>Go to</span>
                  <select v-model="marTimeFocus">
                    <option v-for="time in marTimeColumns" :key="time" :value="time">{{ time }}</option>
                  </select>
                </label>
                <label class="emar-toggle">
                  <input v-model="marShowEducation" type="checkbox">
                  <span>Show Med Education</span>
                </label>
                <label class="emar-toggle">
                  <input v-model="marHideAdmins" type="checkbox">
                  <span>Hide All Admins</span>
                </label>
                <input v-model="marSearch" class="emar-search" type="search" placeholder="Search medication, route, indication">
              </div>

              <div class="emar-layout">
                <section class="emar-board">
                  <div class="emar-time-header">
                    <span>Medication</span>
                    <div>
                      <strong v-for="time in marTimeColumns" :key="time" :class="{ focus: marTimeFocus === time }">{{ time }}</strong>
                    </div>
                    <span>Actions</span>
                  </div>

                  <article v-for="med in visibleEmarMedicationRows" :key="med.id" class="emar-row" :class="med.statusClass">
                    <div class="emar-medication">
                      <div>
                        <v-icon small :color="med.color">{{ med.icon }}</v-icon>
                        <strong>{{ med.label }}</strong>
                      </div>
                      <p>{{ med.detail }}</p>
                      <div class="emar-med-meta">
                        <span>{{ med.route }}</span>
                        <span>{{ med.frequency }}</span>
                        <span>{{ med.dispense }}</span>
                      </div>
                      <small v-if="marShowEducation">{{ med.education }}</small>
                    </div>

                    <div class="emar-time-grid">
                      <button
                        v-for="cell in med.timeline"
                        :key="`${med.id}-${cell.time}`"
                        type="button"
                        :class="['emar-time-cell', cell.status, { focus: marTimeFocus === cell.time }]"
                        @click="openMarAction(cell.defaultAction, med, cell)"
                      >
                        <span>{{ cell.text }}</span>
                      </button>
                    </div>

                    <div class="emar-actions">
                      <button type="button" @click="openMarAction('given', med)">
                        <v-icon x-small>mdi-check</v-icon>Administer
                      </button>
                      <button type="button" @click="openMarAction('held', med)">
                        <v-icon x-small>mdi-pause</v-icon>Hold
                      </button>
                      <button type="button" @click="openMarAction('refused', med)">
                        <v-icon x-small>mdi-account-cancel-outline</v-icon>Refuse
                      </button>
                      <button type="button" @click="openOrderComposer('medication', med.orderItem)">
                        <v-icon x-small>mdi-information-outline</v-icon>Details
                      </button>
                    </div>
                  </article>

                  <div v-if="!visibleEmarMedicationRows.length" class="empty-orders compact">
                    <v-icon size="42" color="#94a3b8">mdi-pill-off</v-icon>
                    <strong>No medication in this eMAR view</strong>
                    <span>Place a medication order or adjust the view filter.</span>
                  </div>
                </section>

                <aside class="emar-side">
                  <section class="emar-advisories">
                    <header>
                      <v-icon small color="#be123c">mdi-alert-octagon</v-icon>
                      <strong>Patient Chart Advisories</strong>
                    </header>
                    <article v-for="advisory in marAdvisories" :key="advisory.title" :class="advisory.level">
                      <strong>{{ advisory.title }}</strong>
                      <span>{{ advisory.detail }}</span>
                    </article>
                  </section>

                  <section class="emar-advisories">
                    <header>
                      <v-icon small color="#0f766e">mdi-school-outline</v-icon>
                      <strong>Medication Education</strong>
                    </header>
                    <article v-for="row in marEducationCards" :key="row.label" class="education">
                      <strong>{{ row.label }}</strong>
                      <span>{{ row.detail }}</span>
                    </article>
                  </section>
                </aside>
              </div>
            </section>

            <section v-else-if="selectedChartTab === 'Medications'" class="flowsheet">
              <div class="action-strip">
                <v-btn x-small depressed color="#0f766e" dark @click="openChartDialog('medication')">
                  <v-icon x-small left>mdi-pill-plus</v-icon>Medication order
                </v-btn>
              </div>
              <FlowSection
                title="Medication Profile"
                :columns="['Status', 'Route', 'Instructions']"
                :rows="medicationProfileRows"
              />
            </section>

            <section v-else-if="selectedChartTab === 'Lab Results'" class="flowsheet">
              <FlowSection
                title="Laboratory Orders and Results"
                :columns="['Status', 'Priority', 'Result']"
                :rows="labResultRows"
              />
            </section>

            <section v-else-if="selectedChartTab === 'Wound Management'" class="flowsheet wound-management">
              <div class="action-strip">
                <v-btn x-small depressed color="#0f766e" dark @click="dialogs.woundCare = true">
                  <v-icon x-small left>mdi-bandage</v-icon>Document Wound
                </v-btn>
              </div>
              <div v-if="patientWounds.length" class="wound-grid">
                <WoundCard
                  v-for="wound in patientWounds"
                  :key="wound.id"
                  :wound="wound"
                  :assessments="woundAssessmentsFor(wound.id)"
                  @open="dialogs.woundCare = true"
                />
              </div>
              <div v-else class="empty-wounds">
                <v-icon size="48" color="#94a3b8">mdi-bandage</v-icon>
                <span>No wounds documented for this patient yet.</span>
              </div>
            </section>

            <section v-else-if="selectedChartTab === 'Notes'" class="flowsheet notes-workspace">
              <div class="action-strip">
                <v-menu v-if="noteMenuOptions.length" offset-y>
                  <template #activator="{ on, attrs }">
                    <v-btn x-small depressed color="#0f766e" dark v-bind="attrs" v-on="on">
                      <v-icon x-small left>mdi-note-plus</v-icon>New Note
                      <v-icon x-small right>mdi-chevron-down</v-icon>
                    </v-btn>
                  </template>
                  <v-list dense>
                    <v-list-item v-for="option in noteMenuOptions" :key="option.key" @click="openNoteMenuOption(option)">
                      <v-list-item-icon><v-icon small>{{ option.icon }}</v-icon></v-list-item-icon>
                      <v-list-item-title>{{ option.label }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
                <v-btn v-if="canLaunchMedical" x-small depressed color="#1d4ed8" dark @click="openChartDialog('medical')">
                  <v-icon x-small left>mdi-medical-bag</v-icon>Medical note (legacy)
                </v-btn>
              </div>

              <div class="notes-layout">
                <div class="notes-list">
                  <button
                    v-for="note in signableNotes"
                    :key="note.id"
                    type="button"
                    :class="['notes-list-item', { active: selectedNoteId === note.id }]"
                    @click="selectedNoteId = note.id"
                  >
                    <strong>{{ note.title || noteTypeLabel(note.noteType) }}</strong>
                    <span class="notes-meta">
                      <span :class="['status-chip', note.status]">{{ note.status }}</span>
                      {{ formatShortDate(note.createdAt) }} &middot; {{ note.createdBy }}
                    </span>
                  </button>
                  <div v-if="!signableNotes.length" class="notes-empty">No notes yet. Use New Note to document.</div>

                  <template v-if="legacyNoteEntries.length">
                    <h3 class="legacy-heading">Legacy entries</h3>
                    <div v-for="entry in legacyNoteEntries" :key="entry.id" class="notes-list-item legacy">
                      <strong>{{ entry.label }}</strong>
                      <span class="notes-meta">{{ entry.type }} &middot; {{ entry.recorded }}</span>
                    </div>
                  </template>
                </div>

                <div class="notes-detail">
                  <template v-if="selectedNote">
                    <header>
                      <div>
                        <span :class="['status-chip', selectedNote.status]">{{ selectedNote.status }}</span>
                        <h2>{{ selectedNote.title || noteTypeLabel(selectedNote.noteType) }}</h2>
                        <p>{{ selectedNote.createdBy }} &middot; {{ formatShortDate(selectedNote.createdAt) }}</p>
                      </div>
                      <div class="notes-detail-actions">
                        <v-btn v-if="selectedNote.status === 'draft'" x-small text color="#0f766e" @click="editSelectedNote">Edit</v-btn>
                        <v-btn v-if="selectedNote.status === 'draft'" x-small depressed color="#0f766e" dark @click="signSelectedNote">
                          <v-icon x-small left>mdi-draw-pen</v-icon>Sign
                        </v-btn>
                        <v-btn v-if="selectedNote.status !== 'draft'" x-small text color="#7c3aed" @click="amendSelectedNote">Amend</v-btn>
                        <v-btn v-if="selectedNote.status !== 'draft'" x-small text color="#0369a1" :disabled="selectedNote.sharedWithCareTeam" @click="shareSelectedNote">
                          {{ selectedNote.sharedWithCareTeam ? 'Shared' : 'Share' }}
                        </v-btn>
                      </div>
                    </header>
                    <p class="notes-body">{{ selectedNote.body }}</p>

                    <div v-if="amendingNoteId === selectedNote.id" class="amend-box">
                      <v-textarea v-model="amendmentDraft" label="Amendment" rows="2" dense outlined />
                      <div class="amend-actions">
                        <v-btn x-small text @click="amendingNoteId = null">Cancel</v-btn>
                        <v-btn x-small depressed color="#7c3aed" dark @click="submitAmendment">Submit amendment</v-btn>
                      </div>
                    </div>

                    <div v-if="selectedNote.amendments && selectedNote.amendments.length" class="notes-amendments">
                      <h3>Amendments</h3>
                      <div v-for="amendment in selectedNote.amendments" :key="amendment.id" class="amendment-row">
                        <span>{{ formatShortDate(amendment.at) }} &middot; {{ amendment.actor }}</span>
                        <p>{{ amendment.body }}</p>
                      </div>
                    </div>
                  </template>
                  <div v-else class="notes-empty-detail">
                    <v-icon size="42" color="#94a3b8">mdi-note-text-outline</v-icon>
                    <span>Select a note to view details</span>
                  </div>
                </div>
              </div>
            </section>

            <Patient360CarePlanTab
              v-else-if="selectedChartTab === 'Care Plan'"
              :patient-id="activePatientId"
              :encounter-id="currentEncounterId"
              :admission-id="currentAdmissionId"
              :role="currentRole"
            />

            <Patient360EducationTab
              v-else-if="selectedChartTab === 'Education'"
              :patient-id="activePatientId"
              :encounter-id="currentEncounterId"
              :admission-id="currentAdmissionId"
              :role="currentRole"
            />

            <Patient360FlowsheetsTab
              v-else-if="selectedChartTab === 'Flowsheets'"
              :patient-id="activePatientId"
              :encounter-id="currentEncounterId"
              :admission-id="currentAdmissionId"
              :role="currentRole"
            />

            <section v-else-if="selectedChartTab === 'Work List'" class="flowsheet">
              <FlowSection
                title="Work List"
                required
                :columns="['Time', 'Priority', 'Status']"
                :rows="visibleWorklistRows"
              />
            </section>

            <section v-else-if="selectedChartTab === 'Immunizations'" class="flowsheet">
              <FlowSection
                title="Immunizations"
                :columns="['Status', 'Date', 'Source']"
                :rows="immunizationRows"
              />
            </section>

            <section v-else-if="selectedChartTab === 'Care Teams'" class="flowsheet">
              <FlowSection
                title="Current Encounter Team"
                :columns="['Role', 'Shift', 'Contact']"
                :rows="visibleCareTeamRows"
              />
            </section>

            <section v-else-if="selectedChartTab === 'Handoff'" class="flowsheet">
              <FlowSection
                title="Nursing Handoff"
                :columns="['Status', 'Owner', 'Concern']"
                :rows="handoffRows"
              />
            </section>

            <section v-else-if="selectedChartTab === 'Documents'" class="flowsheet">
              <div class="action-strip">
                <v-btn x-small depressed color="#0f766e" dark @click="openChartDialog('document')">
                  <v-icon x-small left>mdi-file-plus</v-icon>File document
                </v-btn>
              </div>
              <FlowSection
                title="Documents"
                :columns="['Category', 'Status', 'Filed']"
                :rows="documentRows"
              />
            </section>

            <section v-else-if="selectedChartTab === 'Registration'" class="flowsheet">
              <FlowSection
                title="Registration and Demographics"
                :columns="['Value']"
                :rows="registrationRows"
              />
            </section>

            <section v-else-if="selectedNavigator === 'sdoh'" class="sdoh-section">
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

            <section v-else-if="selectedNavigator === 'shift'" class="navigator-workspace">
              <div class="navigator-banner">
                <div>
                  <strong>Shift Navigator</strong>
                  <span>{{ activePatient.name }} - active nursing shift</span>
                </div>
                <v-btn x-small depressed color="#0f766e" dark @click="openChartDialog('nurse')">
                  <v-icon x-small left>mdi-plus</v-icon>New Reading
                </v-btn>
              </div>
              <FlowSection
                title="Overview"
                :columns="['Status', 'Owner', 'Action']"
                :rows="shiftOverviewRows"
              />
              <FlowSection
                title="Signed/Held Orders"
                :columns="['Type', 'Status', 'Detail']"
                :rows="signedHeldOrderRows"
              />
              <FlowSection
                title="Release Orders"
                :columns="['Status', 'Owner', 'Action']"
                :rows="releaseOrderRows"
              />
              <FlowSection
                title="Care Everywhere"
                :columns="['Authorization', 'Last Update', 'Action']"
                :rows="careEverywhereRows"
              />
              <FlowSection
                title="Quick Links"
                :columns="['Destination', 'Status', 'Action']"
                :rows="quickLinkRows"
              />
              <FlowSection
                title="Delirium - GCS"
                required
                :columns="flowColumns"
                :rows="deliriumRows"
              />
              <FlowSection
                title="Specimen Collection and Provider Notification"
                :columns="['Status', 'Owner', 'Due']"
                :rows="specimenNotificationRows"
              />
              <FlowSection
                title="Assessments"
                :columns="['Last Filed']"
                :rows="visibleAssessmentRows"
              />
              <FlowSection
                title="Clinical Alerts"
                :columns="['Status', 'Source', 'Action']"
                :rows="clinicalAlertRows"
              />
              <FlowSection
                title="Vital Signs and Pain"
                required
                :columns="patientVitals.length ? ['Last Filed'] : flowColumns"
                :rows="visibleVitalRows"
              />
              <FlowSection
                title="Head to Toe"
                :columns="['Last Filed', 'Concern', 'Action']"
                :rows="headToToeRows"
              />
              <FlowSection
                title="IV Assessment"
                :columns="['Site', 'Status', 'Action']"
                :rows="ivAssessmentRows"
              />
              <FlowSection
                title="Intake and Output"
                :columns="flowColumns"
                :rows="intakeRows"
              />
              <FlowSection
                title="Sepsis Screen"
                :columns="flowColumns"
                :rows="sepsisRows"
              />
              <FlowSection
                title="Rounds/Safety/Fall Risk"
                :columns="['Status', 'Risk', 'Action']"
                :rows="safetyFallRows"
              />
              <FlowSection
                title="Comfort and Hygiene"
                :columns="['Status', 'Need', 'Action']"
                :rows="comfortHygieneRows"
              />
              <FlowSection
                title="Functional / Quality"
                :columns="['Status', 'Baseline', 'Goal']"
                :rows="mobilityQualityRows"
              />
              <FlowSection
                title="Plan of Care"
                :columns="['Owner', 'Status', 'Next Step']"
                :rows="carePlanRows"
              />
            </section>

            <section v-else-if="selectedNavigator === 'admission'" class="navigator-workspace">
              <div class="navigator-banner">
                <div>
                  <strong>Admission Navigator</strong>
                  <span>Admission, orders release and outside records</span>
                </div>
                <v-btn x-small depressed color="#0f766e" dark @click="openChartDialog('document')">
                  <v-icon x-small left>mdi-file-plus</v-icon>File admission document
                </v-btn>
              </div>
              <FlowSection
                title="Signed and Held Orders"
                :columns="['Type', 'Status', 'Detail']"
                :rows="signedHeldOrderRows"
              />
              <FlowSection
                title="Release Orders"
                :columns="['Status', 'Owner', 'Action']"
                :rows="releaseOrderRows"
              />
              <FlowSection
                title="Care Everywhere Outside Records"
                :columns="['Authorization', 'Last Update', 'Action']"
                :rows="careEverywhereRows"
              />
              <FlowSection
                title="Quick Links"
                :columns="['Destination', 'Status', 'Action']"
                :rows="admissionQuickLinkRows"
              />
              <FlowSection
                title="Documentation Review"
                :columns="['Status', 'Owner', 'Action']"
                :rows="admissionDocumentationRows"
              />
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

            <section v-else-if="selectedNavigator === 'discharge'" class="navigator-workspace">
              <div class="navigator-banner">
                <div>
                  <strong>Discharge Navigator</strong>
                  <span>Expected discharge, readiness, milestones, instructions and after visit summary</span>
                </div>
                <v-btn x-small depressed color="#0f766e" dark @click="openChartDialog('document')">
                  <v-icon x-small left>mdi-file-document-check</v-icon>File discharge document
                </v-btn>
              </div>
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
                <div>
                  <h3>Expected Time</h3>
                  <div class="segmented">
                    <button>Morning</button>
                    <button>Midday</button>
                    <button class="active">Afternoon</button>
                    <button>Evening</button>
                  </div>
                </div>
                <div>
                  <h3>Discharge Planning Comment</h3>
                  <p class="planning-comment">
                    {{ latestNursingNote ? latestNursingNote.observation || latestNursingNote.response : 'No discharge planning comment filed' }}
                  </p>
                </div>
              </div>

              <FlowSection
                title="Discharge Milestones and Delays"
                :columns="['Status', 'Owner', 'Due']"
                :rows="dischargeRows"
              />
              <FlowSection
                title="Quality Discharge"
                :columns="['Status', 'Owner', 'Action']"
                :rows="dischargeQualityRows"
              />
              <FlowSection
                title="Discharge Documentation"
                :columns="['Status', 'Owner', 'Action']"
                :rows="dischargeDocumentationRows"
              />
              <FlowSection
                title="Discharge Instructions"
                required
                :columns="['Status', 'Owner', 'Action']"
                :rows="dischargeInstructionRows"
              />
              <FlowSection
                title="Follow-up Providers and After Visit Summary"
                :columns="['Status', 'Owner', 'Action']"
                :rows="afterVisitSummaryRows"
              />
              <FlowSection
                title="Pain Impact"
                :columns="['Last Filed', 'Owner', 'Action']"
                :rows="painImpactRows"
              />
            </section>

            <section v-else-if="selectedNavigator === 'transfer'" class="navigator-workspace">
              <div class="navigator-banner">
                <div>
                  <strong>Transfer Navigator</strong>
                  <span>Procedure, X-Ray transfer, ticket to ride, return handoff and monitoring</span>
                </div>
                <v-btn x-small depressed color="#0f766e" dark @click="openChartDialog('document')">
                  <v-icon x-small left>mdi-printer-check</v-icon>Print / file transfer packet
                </v-btn>
              </div>
              <FlowSection
                title="Pre-Procedure Checklist"
                required
                :columns="['Current admission']"
                :rows="transferRows"
              />
              <FlowSection
                title="Ticket to Ride - Procedure"
                :columns="['Status']"
                :rows="ticketRows"
              />
              <FlowSection
                title="Print Pre-Procedure Checklist, Med Rec Form, and Ticket to Ride"
                :columns="['Status', 'Owner', 'Action']"
                :rows="transferPrintRows"
              />
              <FlowSection
                title="Transfer to X-Ray"
                :columns="['Status', 'Destination', 'Action']"
                :rows="transferXrayRows"
              />
              <FlowSection
                title="Ticket to Ride - X-Ray"
                :columns="['Status', 'Destination', 'Action']"
                :rows="ticketXrayRows"
              />
              <FlowSection
                title="Upon Patient Return"
                :columns="['Status', 'Owner', 'Action']"
                :rows="patientReturnRows"
              />
              <FlowSection
                title="Handoff"
                :columns="['Status', 'Owner', 'Concern']"
                :rows="handoffRows"
              />
              <FlowSection
                title="Vital Signs Monitoring"
                required
                :columns="patientVitals.length ? ['Last Filed'] : flowColumns"
                :rows="visibleVitalRows"
              />
            </section>

            <section v-else-if="selectedNavigator === 'mar'" class="flowsheet">
              <div class="navigator-banner">
                <div>
                  <strong>Medication Administration Record</strong>
                  <span>Scheduled, PRN, continuous and running infusion medication command</span>
                </div>
                <v-btn x-small depressed color="#0f766e" dark @click="selectChartTab('MAR')">
                  <v-icon x-small left>mdi-open-in-new</v-icon>Open full eMAR
                </v-btn>
              </div>
              <FlowSection
                title="Medication Administration Record"
                :columns="['0600', '1000', '1400', '1800']"
                :rows="visibleMarRows"
              />
              <FlowSection
                title="Medication Education"
                :columns="['Status', 'Route', 'Instructions']"
                :rows="medicationProfileRows"
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

      <RightClinicalPanel
        :sidebar-index="visibleSidebarIndex"
        :medical-history="medicalHistory"
        :can-see-clinical-history="canSeeClinicalHistory"
        :can-view-orders="canViewOrders"
        :active-orders="visibleActiveOrders"
        :lab-orders="patientLabOrders"
        :imaging-orders="patientImagingOrders"
        :tasks="patientTasks"
        :care-team-rows="visibleCareTeamRows"
        :collapsed="effectiveRightPanelCollapsed"
        @toggle="toggleRightPanel"
        @new-order="openChartDialog('medication')"
        @sign-orders="selectChartTab('Orders')"
      />
    </div>

    <v-dialog v-model="dialogs.nurse" max-width="980" persistent scrollable>
      <v-card class="chart-dialog">
        <v-card-title class="dialog-title">
          <div>
            <span>Nursing encounter</span>
            <strong>{{ activePatient.name }}</strong>
          </div>
          <v-btn icon small @click="closeChartDialog('nurse')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="nurseFormRef" v-model="forms.nurseValid">
            <div class="dialog-grid three">
              <v-text-field v-model="forms.nurse.vitals.bp" label="BP" dense outlined hide-details />
              <v-text-field v-model.number="forms.nurse.vitals.hr" label="HR" type="number" dense outlined hide-details />
              <v-text-field v-model.number="forms.nurse.vitals.rr" label="RR" type="number" dense outlined hide-details />
              <v-text-field v-model.number="forms.nurse.vitals.temp" label="Temp C" type="number" step="0.1" dense outlined hide-details />
              <v-text-field v-model.number="forms.nurse.vitals.spo2" label="SpO2 %" type="number" dense outlined hide-details />
              <v-text-field v-model.number="forms.nurse.vitals.pain" label="Pain /10" type="number" min="0" max="10" dense outlined hide-details />
            </div>
            <div class="dialog-grid three mt-3">
              <v-select v-model.number="forms.nurse.vitals.gcsE" :items="gcsEyeOptions" item-text="text" item-value="value" label="GCS Eye" dense outlined hide-details />
              <v-select v-model.number="forms.nurse.vitals.gcsV" :items="gcsVerbalOptions" item-text="text" item-value="value" label="GCS Verbal" dense outlined hide-details />
              <v-select v-model.number="forms.nurse.vitals.gcsM" :items="gcsMotorOptions" item-text="text" item-value="value" label="GCS Motor" dense outlined hide-details />
            </div>
            <div class="dialog-grid two mt-3">
              <v-text-field v-model="forms.nurse.encounter.chiefComplaint" label="Chief complaint" dense outlined :rules="[requiredRule]" />
              <v-select v-model="forms.nurse.encounter.triageLevel" :items="triageLevels" label="Triage" dense outlined />
            </div>
            <v-textarea v-model="forms.nurse.encounter.historyOfIllness" label="History of illness" rows="2" dense outlined />
            <div class="dialog-grid two">
              <v-select v-model="forms.nurse.assessment.generalCondition" :items="generalConditionOptions" label="General condition" dense outlined />
              <v-select v-model="forms.nurse.assessment.consciousness" :items="consciousnessOptions" label="Consciousness" dense outlined />
              <v-select v-model="forms.nurse.assessment.respiratoryStatus" :items="respiratoryOptions" label="Respiratory status" dense outlined />
              <v-select v-model="forms.nurse.assessment.nursingProblems" :items="nursingProblemsList" label="Nursing problems" multiple chips small-chips dense outlined />
            </div>
            <v-select v-model="forms.nurse.note.actions" :items="nursingActionsList" label="Nursing actions" multiple chips small-chips dense outlined />
            <v-textarea v-model="forms.nurse.note.observation" label="Observation" rows="2" dense outlined />
            <v-textarea v-model="forms.nurse.note.response" label="Patient response / follow-up" rows="2" dense outlined />
          </v-form>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <span>GCS {{ nurseGcsScore }}/15</span>
          <v-spacer />
          <v-btn text small @click="closeChartDialog('nurse')">Cancel</v-btn>
          <v-btn depressed color="#0f766e" dark small :loading="savingDialog" @click="saveNurseEncounter">
            <v-icon x-small left>mdi-content-save</v-icon>File to 360
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.medical" max-width="860" persistent scrollable>
      <v-card class="chart-dialog">
        <v-card-title class="dialog-title">
          <div>
            <span>Medical note</span>
            <strong>{{ activePatient.name }}</strong>
          </div>
          <v-btn icon small @click="closeChartDialog('medical')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="medicalFormRef" v-model="forms.medicalValid">
            <v-text-field v-model="forms.medical.chiefComplaint" label="Chief complaint" dense outlined :rules="[requiredRule]" />
            <v-textarea v-model="forms.medical.clinicalFindings" label="Clinical findings" rows="3" dense outlined />
            <div class="dialog-grid two">
              <v-text-field v-model="forms.medical.diagnosis" label="Diagnosis" dense outlined :rules="[requiredRule]" />
              <v-select v-model="forms.medical.severity" :items="severityOptions" label="Severity" dense outlined />
            </div>
            <v-textarea v-model="forms.medical.plan" label="Plan / orders / treatment" rows="3" dense outlined />
            <v-textarea v-model="forms.medical.instructions" label="Patient instructions" rows="2" dense outlined />
          </v-form>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn text small @click="closeChartDialog('medical')">Cancel</v-btn>
          <v-btn depressed color="#1d4ed8" dark small :loading="savingDialog" @click="saveMedicalNote">
            <v-icon x-small left>mdi-content-save</v-icon>File to 360
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.lab" max-width="680" persistent scrollable>
      <v-card class="chart-dialog">
        <v-card-title class="dialog-title">
          <div>
            <span>Laboratory order</span>
            <strong>{{ activePatient.name }}</strong>
          </div>
          <v-btn icon small @click="closeChartDialog('lab')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="labFormRef" v-model="forms.orderValid">
            <div class="dialog-grid two">
              <v-text-field v-model="forms.order.lab.testName" label="Lab test" dense outlined :rules="[requiredRule]" />
              <v-select v-model="forms.order.lab.priority" :items="priorityOptions" label="Priority" dense outlined />
            </div>
            <v-textarea v-model="forms.order.instructions" label="Clinical reason / specimen instructions" rows="2" dense outlined />
          </v-form>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn text small @click="closeChartDialog('lab')">Cancel</v-btn>
          <v-btn depressed color="#0369a1" dark small :loading="savingDialog" @click="saveLabOrder">
            <v-icon x-small left>mdi-flask</v-icon>Place lab order
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.imaging" max-width="680" persistent scrollable>
      <v-card class="chart-dialog">
        <v-card-title class="dialog-title">
          <div>
            <span>Imaging order</span>
            <strong>{{ activePatient.name }}</strong>
          </div>
          <v-btn icon small @click="closeChartDialog('imaging')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="imagingFormRef" v-model="forms.orderValid">
            <div class="dialog-grid two">
              <v-text-field v-model="forms.order.imaging.modality" label="Modality / exam" dense outlined :rules="[requiredRule]" />
              <v-select v-model="forms.order.imaging.priority" :items="priorityOptions" label="Priority" dense outlined />
            </div>
            <v-textarea v-model="forms.order.instructions" label="Clinical indication / protocol notes" rows="2" dense outlined />
          </v-form>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn text small @click="closeChartDialog('imaging')">Cancel</v-btn>
          <v-btn depressed color="#7c3aed" dark small :loading="savingDialog" @click="saveImagingOrder">
            <v-icon x-small left>mdi-radiology-box</v-icon>Place imaging order
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.medication" max-width="760" persistent scrollable>
      <v-card class="chart-dialog">
        <v-card-title class="dialog-title">
          <div>
            <span>Medication order</span>
            <strong>{{ activePatient.name }}</strong>
          </div>
          <v-btn icon small @click="closeChartDialog('medication')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="medicationFormRef" v-model="forms.orderValid">
            <div class="dialog-grid two">
              <v-text-field v-model="forms.order.medication.medication" label="Medication" dense outlined :rules="[requiredRule]" />
              <v-text-field v-model="forms.order.medication.dosage" label="Dose" dense outlined />
              <v-select v-model="forms.order.medication.route" :items="medicationRoutes" label="Route" dense outlined />
              <v-text-field v-model="forms.order.medication.frequency" label="Frequency" dense outlined />
            </div>
            <v-textarea v-model="forms.order.instructions" label="Administration instructions" rows="2" dense outlined />
          </v-form>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn text small @click="closeChartDialog('medication')">Cancel</v-btn>
          <v-btn depressed color="#0f766e" dark small :loading="savingDialog" @click="saveMedicationOrder">
            <v-icon x-small left>mdi-pill-plus</v-icon>Place medication order
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.marAction" max-width="720" persistent scrollable>
      <v-card class="chart-dialog">
        <v-card-title class="dialog-title">
          <div>
            <span>eMAR documentation</span>
            <strong>{{ selectedMarMedication ? selectedMarMedication.label : activePatient.name }}</strong>
          </div>
          <v-btn icon small @click="closeChartDialog('marAction')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="marActionFormRef" v-model="forms.marValid">
            <div class="dialog-grid three">
              <v-select v-model="forms.mar.action" :items="marActionOptions" label="Action" dense outlined />
              <v-select v-model="forms.mar.time" :items="marTimeColumns" label="Time" dense outlined />
              <v-text-field v-model="forms.mar.barcode" label="Barcode / scan" dense outlined />
            </div>
            <div class="dialog-grid two mt-3">
              <v-text-field v-model="forms.mar.dose" label="Dose administered" dense outlined />
              <v-text-field v-model="forms.mar.site" label="Site / line" dense outlined />
            </div>
            <v-textarea v-model="forms.mar.comment" label="Clinical comment / reason" rows="2" dense outlined />
            <v-textarea v-model="forms.mar.patientResponse" label="Patient response / education" rows="2" dense outlined />
          </v-form>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <span>{{ selectedMarMedication ? selectedMarMedication.detail : 'Medication administration' }}</span>
          <v-spacer />
          <v-btn text small @click="closeChartDialog('marAction')">Cancel</v-btn>
          <v-btn depressed color="#0f766e" dark small :loading="savingDialog" @click="saveMarAction">
            <v-icon x-small left>mdi-content-save-check</v-icon>File eMAR action
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.document" max-width="720" persistent scrollable>
      <v-card class="chart-dialog">
        <v-card-title class="dialog-title">
          <div>
            <span>Clinical document</span>
            <strong>{{ activePatient.name }}</strong>
          </div>
          <v-btn icon small @click="closeChartDialog('document')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="documentFormRef" v-model="forms.documentValid">
            <div class="dialog-grid two">
              <v-text-field v-model="forms.document.title" label="Document title" dense outlined :rules="[requiredRule]" />
              <v-select v-model="forms.document.category" :items="documentCategories" label="Category" dense outlined />
            </div>
            <v-textarea v-model="forms.document.content" label="Document content" rows="6" dense outlined />
          </v-form>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn text small @click="closeChartDialog('document')">Cancel</v-btn>
          <v-btn depressed color="#0f766e" dark small :loading="savingDialog" @click="saveDocumentDialog">
            <v-icon x-small left>mdi-file-check</v-icon>File document
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.avatarPlacement" max-width="720" persistent scrollable>
      <v-card class="chart-dialog avatar-placement-dialog">
        <v-card-title class="dialog-title">
          <div>
            <span>Avatar LDA / device map</span>
            <strong>{{ avatarPlacementDialogTitle }}</strong>
          </div>
          <v-btn icon small @click="closeAvatarPlacementDialog"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <div class="dialog-grid two">
            <v-select
              v-model="forms.avatarPlacement.type"
              :items="avatarPlacementTools"
              item-text="label"
              item-value="key"
              label="Element"
              dense
              outlined
            />
            <v-text-field v-model="forms.avatarPlacement.region" label="Detected region" dense outlined />
            <v-select v-model="forms.avatarPlacement.status" :items="avatarPlacementStatusOptions" label="Status" dense outlined />
            <v-text-field v-model="forms.avatarPlacement.view" label="View" dense outlined readonly />
            <v-text-field v-model="forms.avatarPlacement.siteCare" :label="avatarPlacementSiteCareLabel" dense outlined />
            <v-text-field v-model="forms.avatarPlacement.dressing" label="Dressing / securement" dense outlined />
          </div>
          <v-textarea
            v-model="forms.avatarPlacement.notes"
            :label="avatarPlacementNotesLabel"
            rows="4"
            dense
            outlined
          />
          <div class="avatar-placement-hint">
            <v-icon small color="#0f766e">mdi-map-marker-radius</v-icon>
            <span>{{ forms.avatarPlacement.label }} placed on {{ forms.avatarPlacement.region }} at {{ forms.avatarPlacement.x }}%, {{ forms.avatarPlacement.y }}%.</span>
          </div>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-btn
            v-if="forms.avatarPlacement.id"
            text
            color="#be123c"
            small
            @click="removeAvatarPlacement(forms.avatarPlacement.id)"
          >
            <v-icon x-small left>mdi-delete</v-icon>Remove
          </v-btn>
          <v-spacer />
          <v-btn text small @click="closeAvatarPlacementDialog">Cancel</v-btn>
          <v-btn depressed color="#0f766e" dark small :loading="savingDialog" @click="saveAvatarPlacement">
            <v-icon x-small left>mdi-content-save</v-icon>Save location
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <NoteDialog
      :open="dialogs.note"
      :patient-id="activePatientId"
      :note-type="noteDialogConfig.noteType"
      :dialog-title="noteDialogConfig.dialogTitle"
      :author-role="currentRole"
      :existing-note="noteDialogConfig.existingNote"
      @close="closeChartDialog('note')"
      @saved="handleNoteSaved"
    />
    <WoundCareDialog
      :open="dialogs.woundCare"
      :patient-id="activePatientId"
      :author-role="currentRole"
      @close="closeChartDialog('woundCare')"
      @saved="handleWoundSaved"
    />
    <CarePlanDialog
      :open="dialogs.carePlan"
      :patient-id="activePatientId"
      :author-role="currentRole"
      @close="closeChartDialog('carePlan')"
      @saved="handleCarePlanSaved"
    />
    <BodyAssessmentDialog
      :value="showBodyAssessmentDialog"
      :gender="avatarAnatomy"
      @input="showBodyAssessmentDialog = $event"
      @save="handleBodyAssessmentSave"
    />
    <TimedCareDocumentationDialog
      :show.sync="dialogs.timedCare"
      :templates="timedCareTemplates"
      :preset="timedCareDialogPreset || {}"
      @save="handleTimedCareSave"
    />
    <v-dialog v-model="dialogs.tabManager" max-width="920" persistent scrollable>
      <v-card class="tab-manager-dialog">
        <v-card-title class="tab-manager-title">
          <div>
            <span>Patient 360</span>
            <strong>Tab manager</strong>
          </div>
          <v-spacer></v-spacer>
          <v-btn icon small @click="dialogs.tabManager = false">
            <v-icon small>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <div class="tab-manager-summary">
            <p>Reorder, hide, and restore chart tabs per user preference.</p>
            <small>Role access still applies. Hidden tabs stay hidden until restored.</small>
          </div>
          <div class="tab-manager-grid">
            <article v-for="tab in tabManagerItems" :key="tab.key" :class="['tab-manager-item', { hidden: tab.hidden }]">
              <div class="tab-manager-label">
                <strong>{{ tab.label }}</strong>
                <small>{{ tab.group }}</small>
              </div>
              <div class="tab-manager-actions">
                <v-btn icon small :disabled="tab.index === 0" @click="moveChartTab(tab.key, -1)">
                  <v-icon small>mdi-arrow-up</v-icon>
                </v-btn>
                <v-btn icon small :disabled="tab.index === tabManagerItems.length - 1" @click="moveChartTab(tab.key, 1)">
                  <v-icon small>mdi-arrow-down</v-icon>
                </v-btn>
                <v-switch
                  v-model="tab.visible"
                  inset
                  dense
                  hide-details
                  color="#0f766e"
                  @change="setChartTabVisibility(tab.key, $event)"
                />
              </div>
            </article>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn text color="#0f766e" @click="resetChartTabPreferences">
            <v-icon x-small left>mdi-restore</v-icon>Reset default
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn text @click="dialogs.tabManager = false">Done</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import PatientBanner from '~/components/clinical/patient360/PatientBanner.vue'
import LeftPatientPanel from '~/components/clinical/patient360/LeftPatientPanel.vue'
import RightClinicalPanel from '~/components/clinical/patient360/RightClinicalPanel.vue'
import TabNav from '~/components/clinical/patient360/TabNav.vue'
import NoteDialog from '~/components/clinical/patient360/dialogs/NoteDialog.vue'
import WoundCareDialog from '~/components/clinical/patient360/dialogs/WoundCareDialog.vue'
import WoundCard from '~/components/nursing/WoundCard.vue'
import CarePlanDialog from '~/components/clinical/patient360/dialogs/CarePlanDialog.vue'
import Patient360CarePlanTab from '~/components/clinical/patient360/care-plan/Patient360CarePlanTab.vue'
import Patient360EducationTab from '~/components/clinical/patient360/education/Patient360EducationTab.vue'
import Patient360FlowsheetsTab from '~/components/clinical/patient360/flowsheets/Patient360FlowsheetsTab.vue'
import TimedCareDocumentationDialog from '~/components/clinical/patient360/flowsheets/TimedCareDocumentationDialog.vue'
import BodyAssessmentDialog from '~/components/clinical/patient360/assessment/BodyAssessmentDialog.vue'
import maleFrontAvatar from '~/assets/images/clinical/avatar/male-front.jpg'
import maleBackAvatar from '~/assets/images/clinical/avatar/male-back.jpg'
import femaleFrontAvatar from '~/assets/images/clinical/avatar/female-front.png'
import femaleBackAvatar from '~/assets/images/clinical/avatar/female-back.png'

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
  'EMR Command Center',
  'Nurse Command Center',
  'Chart Review',
  'Navigators',
  'Avatar',
  'Flowsheets',
  'Orders',
  'MAR',
  'Medications',
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

// Tabs shown directly in the tab bar; everything else in visibleChartTabs collapses into the More menu.
const PRIMARY_TAB_ORDER = ['Summary', 'EMR Command Center', 'Nurse Command Center', 'Chart Review', 'Orders', 'MAR', 'Flowsheets', 'Notes', 'Care Plan']

const RIGHT_PANEL_DEFAULT_COLLAPSED_TABS = ['Notes', 'Flowsheets', 'MAR', 'Orders']
const CHART_TAB_LAYOUT_KEY = 'camero_health_patient360Tabs'

const ADMIN_LIKE_ROLES = ['ADMIN', 'RECORDS', 'BILLING', 'FRONT_DESK']

const TAB_ACCESS = {
  ADMIN: ALL_CLINICAL_TABS,
  DOCTOR: ALL_CLINICAL_TABS,
  NP: ALL_CLINICAL_TABS,
  NURSE: ALL_CLINICAL_TABS,
  MIDWIFE: ALL_CLINICAL_TABS.filter(tab => !['Sedation/Procedure Documentation'].includes(tab)),
  MAJOR_SERVICE: ALL_CLINICAL_TABS,
  NURSING_SUPERVISOR: ALL_CLINICAL_TABS,
  CNA: ['Summary', 'EMR Command Center', 'Nurse Command Center', 'Navigators', 'Flowsheets', 'Work List', 'Care Plan', 'Education', 'Handoff'],
  LAB: ['Summary', 'EMR Command Center', 'Chart Review', 'Navigators', 'Orders', 'Lab Results', 'Work List'],
  IMAGING: ['Summary', 'EMR Command Center', 'Chart Review', 'Navigators', 'Orders', 'Work List', 'Documents'],
  PHARMACY: ['Summary', 'EMR Command Center', 'Chart Review', 'Orders', 'MAR', 'Medications', 'Work List', 'Education'],
  FRONT_DESK: ['Summary', 'EMR Command Center', 'Registration', 'Documents', 'Care Teams'],
  RECORDS: ['Summary', 'EMR Command Center', 'Chart Review', 'Documents', 'Registration', 'Care Teams'],
  BILLING: ['Summary', 'EMR Command Center', 'Registration', 'Documents'],
  SOCIAL_WORKER: ['Summary', 'EMR Command Center', 'Navigators', 'Notes', 'Care Plan', 'Education'],
  PHYSIOTHERAPIST: ['Summary', 'EMR Command Center', 'Nurse Command Center', 'Navigators', 'Flowsheets', 'Care Plan', 'Work List', 'Notes']
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
  components: { FlowSection, PatientBanner, LeftPatientPanel, RightClinicalPanel, TabNav, NoteDialog, WoundCareDialog, WoundCard, CarePlanDialog, Patient360CarePlanTab, Patient360EducationTab, Patient360FlowsheetsTab, TimedCareDocumentationDialog, BodyAssessmentDialog },
  props: {
    patientId: { type: String, default: '' },
    patientScoped: { type: Boolean, default: false }
  },
  data() {
    return {
      activeChartId: this.patientId || 'demo-1',
      previewRole: this.$store.state.auth.role || 'NURSE',
      selectedChartTab: 'Summary',
      leftPanelCollapsed: false,
      rightPanelOverride: null,
      isNarrowRight: false,
      isNarrowBoth: false,
      openPatientTabs: [],
      selectedNavigator: 'shift',
      selectedNavigatorSection: 'overview',
      activeSdoh: 'food',
      activeAvatarZone: 'cardiac',
      avatarView: 'front',
      selectedAvatarTool: '',
      avatarPlacementSequence: 0,
      avatarPlacements: [],
      avatarPlacementTools: [
        { key: 'wound', label: 'Wound', icon: 'mdi-bandage', color: '#be123c', defaultStatus: 'Active' },
        { key: 'trach', label: 'Trach', icon: 'mdi-air-filter', color: '#7c3aed', defaultStatus: 'In place' },
        { key: 'iv', label: 'IV line', icon: 'mdi-needle', color: '#0369a1', defaultStatus: 'Patent' },
        { key: 'foley', label: 'Foley', icon: 'mdi-water-outline', color: '#0f766e', defaultStatus: 'Draining' },
        { key: 'drain', label: 'Drain', icon: 'mdi-pipe', color: '#f97316', defaultStatus: 'Active' },
        { key: 'ostomy', label: 'Ostomy', icon: 'mdi-circle-slice-8', color: '#64748b', defaultStatus: 'Appliance intact' },
        { key: 'pain', label: 'Pain', icon: 'mdi-alert-circle-outline', color: '#dc2626', defaultStatus: 'Needs reassessment' }
      ],
      showBodyAssessmentDialog: false,
      timedCareDialogPreset: null,
      chartTabPreferences: {
        order: [],
        hidden: []
      },
      chartTabs: ALL_CLINICAL_TABS,
      navigatorTabs: [
        {
          key: 'shift',
          label: 'Shift',
          icon: 'mdi-clock-outline',
          headline: 'Shift Navigator',
          sections: [
            { key: 'overview', label: 'Overview', group: 'Overview' },
            { key: 'signed-held', label: 'Signed/Held Orders', group: 'Orders' },
            { key: 'release-orders', label: 'Release Orders', group: 'Orders' },
            { key: 'care-everywhere', label: 'Care Everywhere', group: 'Outside records' },
            { key: 'quick-links', label: 'Quick Links', group: 'Tools' },
            { key: 'delirium-gcs', label: 'Delirium - GCS', group: 'Required Documentation' },
            { key: 'specimen', label: 'Specimen Collection', group: 'Required Documentation' },
            { key: 'implants', label: 'Implants/Pumps', group: 'Required Documentation' },
            { key: 'provider-notification', label: 'Provider Notification', group: 'Required Documentation' },
            { key: 'falls-doc-review', label: 'Falls Doc Review', group: 'Required Documentation' },
            { key: 'clinical-alerts', label: 'Clinical Alerts', group: 'Assessments' },
            { key: 'vital-signs', label: 'Vital Signs', group: 'Assessments' },
            { key: 'pain', label: 'Pain', group: 'Assessments' },
            { key: 'head-to-toe', label: 'Head to Toe', group: 'Assessments' },
            { key: 'iv-assessment', label: 'IV Assessment', group: 'Assessments' },
            { key: 'intake-output', label: 'Intake and Output', group: 'Assessments' },
            { key: 'sepsis', label: 'Sepsis Screen', group: 'Assessments' },
            { key: 'rounds-safety', label: 'Rounds/Safety/Alarms', group: 'Safety' },
            { key: 'fall-risk', label: 'Fall Risk', group: 'Safety' },
            { key: 'falls-neuro', label: 'Pt Falls & Neuro', group: 'Safety' },
            { key: 'comfort', label: 'Comfort & Hygiene', group: 'Safety' },
            { key: 'suicide-risk', label: 'Suicide Risk', group: 'Safety' },
            { key: 'mobility', label: 'Mobility', group: 'Functional/Quality' },
            { key: 'education', label: 'Education', group: 'Plan of Care' },
            { key: 'care-plans', label: 'Care Plans', group: 'Plan of Care' }
          ]
        },
        {
          key: 'admission',
          label: 'Admission',
          icon: 'mdi-login-variant',
          headline: 'Admission Review',
          sections: [
            { key: 'signed-held', label: 'Signed/Held Orders', group: 'Orders' },
            { key: 'release-orders', label: 'Release Orders', group: 'Orders' },
            { key: 'care-everywhere', label: 'Care Everywhere', group: 'Outside records' },
            { key: 'quick-links', label: 'Quick Links', group: 'Tools' },
            { key: 'specimen', label: 'Specimen Collection', group: 'History' },
            { key: 'provider-notification', label: 'Provider Notification', group: 'History' },
            { key: 'travel-exposure', label: 'Travel/Exposure', group: 'History' },
            { key: 'allergies', label: 'Allergies', group: 'History' },
            { key: 'latex', label: 'Latex Screening', group: 'History' },
            { key: 'home-meds', label: 'Home Meds', group: 'History' },
            { key: 'med-rec', label: 'Med Rec', group: 'History' },
            { key: 'alcohol', label: 'Alcohol Use', group: 'History' },
            { key: 'implants', label: 'Implants/Pumps', group: 'History' },
            { key: 'vaccine-screen', label: 'Vaccine Screen', group: 'History' },
            { key: 'contacts-legal', label: 'Contacts & Legal', group: 'History' },
            { key: 'orientation', label: 'Orientation/Identity', group: 'Assessment' },
            { key: 'clinical-alerts', label: 'Clinical Alerts', group: 'Assessment' },
            { key: 'vital-signs', label: 'Vital Signs', group: 'Assessment' },
            { key: 'pain', label: 'Pain', group: 'Assessment' },
            { key: 'baseline', label: 'Baseline', group: 'Assessment' },
            { key: 'adls', label: 'ADLs', group: 'Assessment' },
            { key: 'head-to-toe', label: 'Head to Toe', group: 'Assessment' },
            { key: 'iv-assessment', label: 'IV Assessment', group: 'Assessment' },
            { key: 'intake-output', label: 'Intake and Output', group: 'Assessment' },
            { key: 'delirium-gcs', label: 'Delirium - GCS', group: 'Assessment' },
            { key: 'sepsis', label: 'Sepsis Screen', group: 'Assessment' },
            { key: 'rounds-safety', label: 'Rounds/Safety/Alarms', group: 'Safety' },
            { key: 'fall-risk', label: 'Fall Risk', group: 'Safety' },
            { key: 'comfort', label: 'Comfort & Hygiene', group: 'Safety' },
            { key: 'psychosocial', label: 'Psychosocial', group: 'Safety' },
            { key: 'suicide-risk', label: 'Suicide Risk', group: 'Safety' },
            { key: 'belongings', label: 'Belongings', group: 'Safety' },
            { key: 'mobility', label: 'Mobility', group: 'Functional/Quality' },
            { key: 'education', label: 'Education', group: 'Plan of Care' },
            { key: 'care-plans', label: 'Care Plans', group: 'Plan of Care' }
          ]
        },
        {
          key: 'discharge',
          label: 'Discharge',
          icon: 'mdi-logout-variant',
          headline: 'Expected Discharge',
          sections: [
            { key: 'expected-discharge', label: 'Exp. Discharge', group: 'Discharge Milestones' },
            { key: 'expected-discharge-readiness', label: 'Expected Discha.', group: 'Discharge Milestones' },
            { key: 'discharge-milestones', label: 'Discharge Milest...', group: 'Discharge Milestones' },
            { key: 'pain-impact', label: 'Pain Impact', group: 'Quality Discharge' },
            { key: 'bms', label: 'BMS', group: 'Quality Discharge' },
            { key: 'function-quality', label: 'Function/Quality', group: 'Quality Discharge' },
            { key: 'functional-items', label: 'Functional Items', group: 'Quality Discharge' },
            { key: 'mobility', label: 'Mobility', group: 'Quality Discharge' },
            { key: 'quality-discharge', label: 'Quality Discharge', group: 'Quality Discharge' },
            { key: 'best-practice', label: 'BestPractice', group: 'Discharge Doc' },
            { key: 'discharge-info', label: 'Discharge Info', group: 'Discharge Doc' },
            { key: 'family-notification', label: 'Family Notification', group: 'Discharge Doc' },
            { key: 'home-pharmacy', label: 'Home Pharmacy', group: 'Discharge Doc' },
            { key: 'discharge-vitals', label: 'Discharge Vital S...', group: 'Discharge Doc' },
            { key: 'vaccine-doc', label: 'Vaccine Doc', group: 'Discharge Doc' },
            { key: 'belongings', label: 'Belongings', group: 'Discharge Doc' },
            { key: 'belongings-return', label: 'Belongings Retur...', group: 'Discharge Doc' },
            { key: 'lda-removal', label: 'LDA Removal', group: 'Discharge Doc' },
            { key: 'wound-lda-removal', label: 'Wound LDA rem...', group: 'Discharge Doc' },
            { key: 'education', label: 'Education', group: 'Discharge Doc' },
            { key: 'dme-recommendation', label: 'DME Recommen...', group: 'Discharge Doc' },
            { key: 'handoff', label: 'Handoff', group: 'Discharge Doc' },
            { key: 'instructions', label: 'Instructions', group: 'Discharge Instructions' },
            { key: 'medication-detail', label: 'Medication Detail', group: 'Discharge Instructions' },
            { key: 'med-rec-status', label: 'Med Rec Status', group: 'Discharge Instructions' },
            { key: 'type-of-med-rec', label: 'Type of Med Rec', group: 'Discharge Instructions' },
            { key: 'pain-med-instructions', label: 'Pain/Med Instruc...', group: 'Discharge Instructions' },
            { key: 'diet-instructions', label: 'Diet Instructions', group: 'Discharge Instructions' },
            { key: 'nursing-discharge', label: 'Nursing Dischar...', group: 'Discharge Instructions' },
            { key: 'wound-care-instructions', label: 'Wound Care Instr...', group: 'Discharge Instructions' },
            { key: 'rt-instructions', label: 'RT Instructions', group: 'Discharge Instructions' },
            { key: 'follow-up-providers', label: 'Follow-up Provid...', group: 'Discharge Instructions' },
            { key: 'after-visit-summary', label: 'After Visit Summary', group: 'After Visit Summary' },
            { key: 'after-visit-summary-review', label: 'After Visit Summ...', group: 'After Visit Summary' }
          ]
        },
        {
          key: 'transfer',
          label: 'Transfer',
          icon: 'mdi-swap-horizontal',
          headline: 'Transfer and Procedure Readiness',
          sections: [
            { key: 'pre-procedure', label: 'Pre-Procedure Checklist', group: 'Transfer to Procedure' },
            { key: 'ticket-procedure', label: 'Ticket to Ride', group: 'Transfer to Procedure' },
            { key: 'print-procedure', label: 'Print Documents', group: 'Transfer to Procedure' },
            { key: 'diagnostic-test', label: 'Diagnostic Test', group: 'Transfer to X-Ray' },
            { key: 'non-invasive', label: 'Non-Invasive Procedure', group: 'Transfer to X-Ray' },
            { key: 'ticket-xray', label: 'Ticket to Ride', group: 'Transfer to X-Ray' },
            { key: 'print-xray', label: 'Print Documents', group: 'Transfer to X-Ray' },
            { key: 'med-rec', label: 'Med Rec for Meds', group: 'Upon Patient Return' },
            { key: 'handoff', label: 'Handoff', group: 'Upon Patient Return' },
            { key: 'vital-monitoring', label: 'Vital Signs Monitoring', group: 'Upon Patient Return' }
          ]
        },
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
        { label: 'Site marked before procedure', values: { 'Current admission': '-' } },
        { label: 'Consent', values: { 'Current admission': '-' } },
        { label: 'H&P verified', values: { 'Current admission': '-' } },
        { label: 'Procedure order verified', values: { 'Current admission': '-' } },
        { label: 'Allergies reviewed', values: { 'Current admission': '-' } },
        { label: 'Patient ID verified', values: { 'Current admission': '-' } },
        { label: 'Completed or verified the following:', values: { 'Current admission': '-' } },
        { label: 'Blood consent signed', values: { 'Current admission': '-' } },
        { label: 'Blood band on?', values: { 'Current admission': '-' } },
        { label: 'Blood type and screen', values: { 'Current admission': '-' } },
        { label: 'Blood products ordered?', values: { 'Current admission': '-' } },
        { label: 'NPO start', values: { 'Current admission': '-' } },
        { label: 'IV infusing', values: { 'Current admission': '-' } },
        { label: 'Was anticoagulant given?', values: { 'Current admission': '-' } },
        { label: 'Valuables', values: { 'Current admission': 'None' } },
        { label: 'Prosthesis', values: { 'Current admission': '-' } },
        { label: 'Lab values reviewed', values: { 'Current admission': '-' } }
      ],
      ticketRows: [
        { label: 'Transfer destination', values: { Status: 'Procedure area' } },
        { label: 'Transport mode', values: { Status: 'Bed' } },
        { label: 'Oxygen required', values: { Status: 'No' } },
        { label: 'Isolation alert visible', values: { Status: 'Review' } },
        { label: 'Mobility assistance', values: { Status: 'Assist x1' } },
        { label: 'Documents travel with patient', values: { Status: 'Required' } }
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
      ],
      selectedOrderView: 'active',
      selectedOrderPanel: 'manage',
      showHomeMedications: false,
      orderSortBy: 'Order Type',
      orderGoTo: 'Scheduled',
      orderSearch: '',
      orderMode: 'Medication',
      selectedMarView: 'all',
      marTimeFocus: '1700',
      marShowEducation: true,
      marHideAdmins: false,
      marSearch: '',
      selectedMarMedication: null,
      selectedMarAction: 'given',
      marTimeColumns: ['1400', '1500', '1600', '1700', '1800', '1900', '2000'],
      remoteAiCarePlan: null,
      aiCareLoading: false,
      aiCareError: '',
      dialogs: {
        nurse: false,
        medical: false,
        lab: false,
        imaging: false,
        medication: false,
        document: false,
        marAction: false,
        note: false,
        woundCare: false,
        carePlan: false,
        avatarPlacement: false,
        timedCare: false,
        tabManager: false
      },
      noteDialogConfig: { noteType: 'nursing_note', dialogTitle: '', existingNote: null },
      selectedNoteId: null,
      amendingNoteId: null,
      amendmentDraft: '',
      savingDialog: false,
      forms: defaultDialogForms(),
      triageLevels: ['Green', 'Yellow', 'Orange', 'Red'],
      severityOptions: ['Mild', 'Moderate', 'Severe', 'Critical'],
      priorityOptions: ['Routine', 'Today', 'Urgent', 'STAT'],
      medicationRoutes: ['Oral', 'IV', 'IM', 'Topical', 'Inhalation', 'Sublingual', 'Rectal'],
      marActionOptions: ['Given', 'Held', 'Refused', 'Not scanned', 'Patient education', 'Details reviewed'],
      avatarPlacementStatusOptions: ['Active', 'In place', 'Patent', 'Draining', 'Clean/dry/intact', 'Needs reassessment', 'Resolved', 'Removed', 'Escalate'],
      documentCategories: ['Clinical Note', 'Consent', 'Referral', 'Discharge Summary', 'Education', 'Wound Photo'],
      generalConditionOptions: ['Good general condition', 'Stable', 'Impaired', 'Serious', 'Critical'],
      consciousnessOptions: ['Alert and oriented', 'Confused', 'Drowsy', 'Stuporous', 'Comatose'],
      respiratoryOptions: ['Normal', 'Mild dyspnea', 'Moderate dyspnea', 'Respiratory distress', 'Cyanosis'],
      nursingProblemsList: [
        'Acute pain', 'Chronic pain', 'Impaired mobility', 'Fall risk', 'Self-care deficit',
        'Impaired nutrition', 'Constipation', 'Diarrhea', 'Urinary retention', 'Incontinence',
        'Impaired breathing', 'Anxiety', 'Risk of infection', 'Pressure injury risk'
      ],
      nursingActionsList: [
        'Vital signs recorded', 'IV line placement', 'IV injection', 'IM injection',
        'Simple dressing', 'Complex dressing', 'Urinary catheterization', 'Suctioning',
        'Oxygen therapy', 'ECG completed', 'Blood sample collected', 'Medication administration',
        'Patient education', 'Pain-relief positioning', 'Mobilization', 'Personal hygiene completed'
      ],
      gcsEyeOptions: [
        { text: 'Spontaneous (4)', value: 4 },
        { text: 'To sound (3)', value: 3 },
        { text: 'To pain (2)', value: 2 },
        { text: 'None (1)', value: 1 }
      ],
      gcsVerbalOptions: [
        { text: 'Oriented (5)', value: 5 },
        { text: 'Confused (4)', value: 4 },
        { text: 'Incoherent (3)', value: 3 },
        { text: 'Incomprehensible (2)', value: 2 },
        { text: 'None (1)', value: 1 }
      ],
      gcsMotorOptions: [
        { text: 'To command (6)', value: 6 },
        { text: 'Localized (5)', value: 5 },
        { text: 'Withdrawal (4)', value: 4 },
        { text: 'Flexion (3)', value: 3 },
        { text: 'Extension (2)', value: 2 },
        { text: 'None (1)', value: 1 }
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
    noteMenuOptions() {
      const role = this.currentRole
      const options = []
      if (['NURSE', 'CNA', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR'].includes(role)) {
        options.push({ key: 'assessment', label: 'Nursing Assessment', icon: 'mdi-clipboard-pulse', kind: 'legacy-nurse' })
        options.push({ key: 'wound', label: 'Wound Care Note', icon: 'mdi-bandage', kind: 'wound' })
        options.push({ key: 'general', label: 'General Note', icon: 'mdi-note-text', kind: 'note', noteType: 'nursing_note', dialogTitle: 'General Nursing Note' })
      }
      if (role === 'NP') {
        options.push({ key: 'np-encounter', label: 'NP Encounter Note', icon: 'mdi-stethoscope', kind: 'note', noteType: 'progress_note', dialogTitle: 'NP Encounter Note' })
      }
      if (role === 'DOCTOR') {
        options.push({ key: 'progress', label: 'Progress Note', icon: 'mdi-stethoscope', kind: 'note', noteType: 'progress_note', dialogTitle: 'Progress Note' })
      }
      return options
    },
    signableNotes() {
      const all = this.$store.getters['nursing/getClinicalNotes'] || []
      return all
        .filter(item => item.patientId === this.activePatientId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    },
    selectedNote() {
      return this.signableNotes.find(item => item.id === this.selectedNoteId) || null
    },
    legacyNoteEntries() {
      return this.noteRows.map((row, index) => ({
        id: 'legacy-' + index,
        label: row.label,
        type: row.values.Type,
        recorded: row.values.Recorded
      }))
    },
    rightPanelCollapsed() {
      if (this.rightPanelOverride !== null) return this.rightPanelOverride
      return RIGHT_PANEL_DEFAULT_COLLAPSED_TABS.includes(this.selectedChartTab)
    },
    effectiveLeftPanelCollapsed() {
      return this.leftPanelCollapsed || this.isNarrowBoth
    },
    effectiveRightPanelCollapsed() {
      return this.rightPanelCollapsed || this.isNarrowRight
    },
    primaryTabs() {
      return PRIMARY_TAB_ORDER.filter(tab => this.visibleChartTabs.includes(tab))
    },
    overflowTabs() {
      return this.visibleChartTabs.filter(tab => !PRIMARY_TAB_ORDER.includes(tab))
    },
    fallRiskEntry() {
      return this.medicalHistory.find(item => item.label === 'Fall risk') || null
    },
    skinIntegrityEntry() {
      const activeCount = this.patientWounds.filter(item => item.status === 'active' || item.status === 'worsening').length
      if (activeCount) {
        return { label: 'Skin integrity', value: activeCount === 1 ? 'Active wound' : `${activeCount} active wounds` }
      }
      return this.medicalHistory.find(item => item.label === 'Skin integrity') || null
    },
    requiredRule() {
      return value => Boolean(value) || 'Required'
    },
    nurseGcsScore() {
      const v = this.forms.nurse.vitals
      return Number(v.gcsE || 0) + Number(v.gcsV || 0) + Number(v.gcsM || 0)
    },
    roleOptions() {
      return Object.keys(ACCESS_PROFILES).map(value => ({ value, ...ACCESS_PROFILES[value] }))
    },
    accessProfile() {
      return ACCESS_PROFILES[this.currentRole] || ACCESS_PROFILES.NURSE
    },
    visibleChartTabs() {
      const allowed = TAB_ACCESS[this.currentRole] || TAB_ACCESS.NURSE
      const base = this.chartTabs.filter(tab => allowed.includes(tab))
      const preferred = Array.isArray(this.chartTabPreferences.order) ? this.chartTabPreferences.order.filter(tab => base.includes(tab)) : []
      const hidden = new Set(Array.isArray(this.chartTabPreferences.hidden) ? this.chartTabPreferences.hidden : [])
      const ordered = [
        ...preferred,
        ...base.filter(tab => !preferred.includes(tab))
      ]
      return ordered.filter(tab => !hidden.has(tab))
    },
    tabManagerItems() {
      return this.visibleChartTabs.map((tab, index) => ({
        key: tab,
        label: tab,
        group: PRIMARY_TAB_ORDER.includes(tab) ? 'Primary' : 'Overflow',
        index,
        visible: true,
        hidden: false
      })).concat(
        this.chartTabs
          .filter(tab => !this.visibleChartTabs.includes(tab) && (TAB_ACCESS[this.currentRole] || TAB_ACCESS.NURSE).includes(tab))
          .map(tab => ({
            key: tab,
            label: tab,
            group: PRIMARY_TAB_ORDER.includes(tab) ? 'Primary' : 'Overflow',
            index: this.visibleChartTabs.length,
            visible: false,
            hidden: true
          }))
      )
    },
    visibleNavigatorTabs() {
      const allowed = NAV_ACCESS[this.currentRole] || NAV_ACCESS.NURSE
      return this.navigatorTabs.filter(item => allowed.includes(item.key))
    },
    activeNavigator() {
      return this.visibleNavigatorTabs.find(item => item.key === this.selectedNavigator) || this.visibleNavigatorTabs[0] || this.navigatorTabs[0]
    },
    activeNavigatorSections() {
      const sections = this.activeNavigator && this.activeNavigator.sections ? this.activeNavigator.sections : []
      return sections.map(section => typeof section === 'string' ? { key: section, label: section, group: '' } : section)
    },
    activeNavigatorSectionMeta() {
      const section = this.activeNavigatorSections.find(item => item.key === this.selectedNavigatorSection) || this.activeNavigatorSections[0] || {}
      const key = section.key || ''
      const map = {
        'signed-held': { owner: 'Provider / Nurse', detail: 'Review held orders before release or transfer.', action: 'orders' },
        'release-orders': { owner: 'Provider / Nurse', detail: 'Release eligible orders and acknowledge active tasks.', action: 'orders' },
        'care-everywhere': { owner: 'Records / Provider', detail: 'Outside records and referral information for continuity.', action: 'notes' },
        'quick-links': { owner: 'Care team', detail: 'Fast access to common 360 documentation areas.', action: 'flowsheet' },
        'delirium-gcs': { owner: 'Nurse', detail: 'Document mental status, RASS/CAM and Glasgow coma scale.', action: 'nurse' },
        specimen: { owner: 'Lab / Nurse', detail: 'Collect specimens, track pending labs and notify provider.', action: 'worklist' },
        'provider-notification': { owner: 'Nurse', detail: 'Escalate abnormal results, vitals or safety concerns.', action: 'handoff' },
        'vital-signs': { owner: 'Nurse / CNA', detail: 'Capture vitals, pain, oxygenation and response to care.', action: 'nurse' },
        pain: { owner: 'Nurse', detail: 'Assess pain score, intervention and reassessment.', action: 'nurse' },
        'head-to-toe': { owner: 'Nurse', detail: 'Structured body-system assessment without leaving 360.', action: 'body' },
        'iv-assessment': { owner: 'Nurse', detail: 'Check line site, patency, dressing and infection risk.', action: 'flowsheet' },
        'intake-output': { owner: 'Nurse / Aide-soignant', detail: 'Record intake, output, meals, fluids and elimination.', action: 'flowsheet' },
        sepsis: { owner: 'Nurse / Provider', detail: 'Screen infection signals and escalate fever or instability.', action: 'nurse' },
        'rounds-safety': { owner: 'Nurse / Aide-soignant', detail: 'Safety rounds, alarms, hygiene, mobility and environment.', action: 'flowsheet' },
        'fall-risk': { owner: 'Nurse / Physio', detail: 'Update fall risk and safe mobility plan.', action: 'flowsheet' },
        comfort: { owner: 'Nurse / Aide-soignant', detail: 'Document comfort, dignity care, hygiene and family support.', action: 'flowsheet' },
        mobility: { owner: 'Nurse / Physio', detail: 'Baseline function, assist level and rehabilitation needs.', action: 'flowsheet' },
        education: { owner: 'Nurse / Pharmacy / Social', detail: 'Prefilled patient/family education and teach-back.', action: 'education' },
        'care-plans': { owner: 'Care team', detail: 'Goals, barriers and daily care plan progress.', action: 'care-plan' },
        'expected-discharge': { owner: 'Care team', detail: 'Set expected discharge date/time and readiness blockers.', action: 'discharge' },
        'discharge-info': { owner: 'Nurse / Records', detail: 'File discharge document, instructions and patient packet.', action: 'discharge' },
        'medication-detail': { owner: 'Provider / Pharmacy', detail: 'Reconcile medication instructions for discharge.', action: 'medication' },
        handoff: { owner: 'Nurse / Major', detail: 'Summarize unresolved risks and next-shift ownership.', action: 'handoff' },
        'pre-procedure': { owner: 'Nurse / Provider', detail: 'Complete checklist before transfer or procedure.', action: 'transfer' },
        'ticket-procedure': { owner: 'Nurse', detail: 'Prepare ticket to ride and transfer packet.', action: 'transfer' },
        'vital-monitoring': { owner: 'Nurse', detail: 'Monitor and file vitals before and after transfer.', action: 'nurse' }
      }
      const fallback = map[key] || { owner: this.accessProfile.short, detail: `${section.group || this.activeNavigator.label} section for this patient cycle.`, action: this.selectedNavigator }
      return {
        key,
        label: section.label || this.activeNavigator.headline || 'Navigator section',
        group: section.group || this.activeNavigator.label,
        ...fallback
      }
    },
    navigatorQuickActions() {
      const primary = this.activeNavigatorSectionMeta.action
      const actions = [
        { label: 'Document', action: primary, icon: 'mdi-pencil-plus', color: '#0f766e', primary: true },
        { label: 'Timed care', action: 'flowsheet', icon: 'mdi-clock-edit-outline', color: '#0f766e', primary: false },
        { label: 'Note', action: 'notes', icon: 'mdi-note-text-outline', color: '#1d4ed8', primary: false }
      ]
      if (this.activeNavigatorSectionMeta.key && /med|mar|pharmacy/i.test(`${this.activeNavigatorSectionMeta.key} ${this.activeNavigator.label}`)) {
        actions.splice(1, 0, { label: 'MAR', action: 'medication', icon: 'mdi-pill', color: '#0f766e', primary: false })
      }
      if (/discharge|transfer|admission/i.test(this.selectedNavigator)) {
        actions.push({ label: 'File doc', action: 'document', icon: 'mdi-file-plus', color: '#7c3aed', primary: false })
      }
      return actions.slice(0, 4)
    },
    navigatorSectionProgressRows() {
      const sectionKey = this.activeNavigatorSectionMeta.key || ''
      const hasVitals = Boolean(this.latestVitalsSummary)
      const hasNotes = Boolean(this.latestNursingNote || this.signableNotes.length)
      const hasOrders = Boolean(this.patientLabOrders.length || this.patientImagingOrders.length || this.patientMedications.length)
      const hasDischargeDoc = this.patientDocuments.some(doc => /discharge|sortie|avs|after visit/i.test(`${doc.title || ''} ${doc.category || ''}`))
      const rows = [
        {
          label: 'Owner',
          value: this.activeNavigatorSectionMeta.owner,
          detail: this.accessProfile.scope,
          status: 'active'
        },
        {
          label: 'Documentation',
          value: hasNotes ? 'Started' : 'Due',
          detail: hasNotes ? 'Recent clinical documentation exists.' : 'No recent note filed for this patient.',
          status: hasNotes ? 'complete' : 'warning'
        },
        {
          label: 'Vitals',
          value: hasVitals ? 'Filed' : 'Due',
          detail: this.latestVitalsSummary || 'Record vitals/pain if clinically needed.',
          status: hasVitals ? 'complete' : 'due'
        },
        {
          label: 'Orders',
          value: hasOrders ? `${this.patientLabOrders.length + this.patientImagingOrders.length + this.patientMedications.length} active` : 'None active',
          detail: hasOrders ? 'Review orders and acknowledge tasks.' : 'No active order signal in this chart.',
          status: hasOrders ? 'active' : 'complete'
        }
      ]
      if (/discharge|after-visit|family|home|dme|belongings/i.test(sectionKey)) {
        rows[1] = {
          label: 'Discharge packet',
          value: hasDischargeDoc ? 'Started' : 'Not started',
          detail: hasDischargeDoc ? 'Discharge document available.' : 'File instructions, follow-up and family handoff.',
          status: hasDischargeDoc ? 'complete' : 'warning'
        }
      }
      if (/specimen|diagnostic|xray|lab/i.test(sectionKey)) {
        rows[3] = {
          label: 'Diagnostics',
          value: this.patientLabOrders.length || this.patientImagingOrders.length ? 'Active' : 'No active request',
          detail: `${this.patientLabOrders.length} lab / ${this.patientImagingOrders.length} imaging item(s).`,
          status: this.patientLabOrders.length || this.patientImagingOrders.length ? 'active' : 'complete'
        }
      }
      return rows
    },
    workspaceEyebrow() {
      if (this.selectedChartTab && this.selectedChartTab !== 'Navigators') return this.selectedChartTab
      return this.activeNavigator ? this.activeNavigator.label : 'Patient 360'
    },
    workspaceHeadline() {
      const map = {
        Summary: 'Patient 360 Summary',
        'EMR Command Center': 'EMR Command Center',
        'Nurse Command Center': 'Nurse Command Center',
        'Chart Review': 'Longitudinal Chart Review',
        Flowsheets: 'Care Schedule Flowsheets',
        Orders: 'Orders and Diagnostics',
        MAR: 'Medication Administration Record',
        Medications: 'Medication Profile',
        'Lab Results': 'Laboratory Results',
        'Wound Management': 'Wound and Skin Care',
        Notes: 'Clinical Notes',
        'Care Plan': 'Care Plan and Goals',
        Education: 'Patient Education',
        'Work List': 'Care Team Work List',
        Immunizations: 'Immunization Record',
        'Care Teams': 'Current Care Team',
        Handoff: 'Nursing Handoff',
        Documents: 'Clinical Documents',
        Registration: 'Registration and Demographics'
      }
      return map[this.selectedChartTab] || (this.activeNavigator ? this.activeNavigator.headline : 'Patient 360')
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
    openPatientChartsDisplay() {
      return this.patientScoped ? this.openPatientTabs : this.openCharts
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
    latestNursingNote() {
      return latestByDate(this.patientNursingNotes, 'recordedAt')
    },
    patientMedicalNotes() {
      const all = this.$store.getters['clinical/getMedicalNotes'] || []
      return all.filter(item => item.patientId === this.activePatientId)
    },
    patientTasks() {
      const all = this.$store.getters['clinical/getTasks'] || []
      return all.filter(item => item.patientId === this.activePatientId)
    },
    patientWounds() {
      const all = this.$store.getters['nursing/getWounds'] || []
      return all.filter(item => item.patientId === this.activePatientId)
    },
    hasWoundAreaWarning() {
      return this.patientWounds.some(wound => this.woundAssessmentsFor(wound.id).some(item => item.warningAreaIncreased))
    },
    patientCarePlans() {
      const all = this.$store.getters['nursing/getCarePlans'] || []
      return all
        .filter(item => item.patientId === this.activePatientId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    },
    unsignedNoteCount() {
      return this.signableNotes.filter(item => item.status === 'draft').length
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
    patientDocuments() {
      const all = this.$store.getters['clinical/getDocuments'] || []
      return all.filter(item => item.patientId === this.activePatientId)
    },
    timedCareTemplates() {
      return this.$store.getters['flowsheets/templates'] || []
    },
    summaryHeadline() {
      const location = this.activePatient.bed || this.activePatient.service || 'Location not assigned'
      const risk = this.activePatient.riskLevel ? `${this.activePatient.riskLevel} risk` : 'risk not scored'
      return `${location} · ${this.activePatient.patientClass || 'Patient'} · ${risk}`
    },
    summaryNarrative() {
      const parts = [
        this.latestVitalsSummary ? `Latest vitals: ${this.latestVitalsSummary}` : 'Vitals are due.',
        this.patientTasks.length ? `${this.patientTasks.length} open task(s).` : 'No open care task filed.',
        this.patientMedications.length ? `${this.patientMedications.length} medication item(s).` : 'Medication reconciliation may be due.',
        this.dischargeReadinessLabel
      ]
      return parts.join(' ')
    },
    dischargeReadinessLabel() {
      const hasDischargeDoc = this.patientDocuments.some(doc => /discharge|sortie|avs|after visit/i.test(`${doc.title || ''} ${doc.category || ''}`))
      if (hasDischargeDoc && !this.patientTasks.length) return 'Discharge packet started and no open task blocker.'
      if (hasDischargeDoc) return 'Discharge packet started; close remaining blockers.'
      return 'Prepare discharge education, pharmacy, transport and follow-up early.'
    },
    recentTimedCareEntries() {
      const getter = this.$store.getters['flowsheets/recentTimedCareEntries']
      return getter ? getter(this.activePatientId, this.currentEncounterId).slice(0, 3) : []
    },
    summaryStatusCards() {
      const vitals = this.latestVitals || {}
      const temp = Number(vitals.temp)
      const spo2 = Number(vitals.spo2)
      const pain = Number(vitals.pain)
      const abnormalVitals = (Number.isFinite(temp) && temp >= 38) || (Number.isFinite(spo2) && spo2 < 92) || (Number.isFinite(pain) && pain >= 7)
      const hasDischargeDoc = this.patientDocuments.some(doc => /discharge|sortie|avs|after visit/i.test(`${doc.title || ''} ${doc.category || ''}`))
      const carePlanSummary = this.$store.getters['carePlan/carePlanSummaryProjection']?.(this.activePatientId) || {}
      const educationSummary = this.$store.getters['education/educationSummaryProjection']?.(this.activePatientId) || {}
      return [
        {
          label: 'Clinical status',
          value: abnormalVitals ? 'Needs review' : (this.latestVitalsSummary ? 'Stable trend' : 'Vitals due'),
          detail: this.latestVitalsSummary || 'Capture vitals, pain and GCS.',
          status: abnormalVitals ? 'due' : (this.latestVitalsSummary ? 'complete' : 'warning'),
          icon: 'mdi-heart-pulse'
        },
        {
          label: 'Care workload',
          value: this.patientTasks.length ? `${this.patientTasks.length} task(s)` : 'Routine care',
          detail: this.patientTasks.length ? 'Review worklist and document completion.' : 'Continue scheduled rounds.',
          status: this.patientTasks.length ? 'active' : 'complete',
          icon: 'mdi-format-list-checks'
        },
        {
          label: 'Orders / meds',
          value: `${this.patientLabOrders.length + this.patientImagingOrders.length + this.patientMedications.length} active`,
          detail: this.patientMedications.length ? 'Medication profile available for MAR review.' : 'Check med reconciliation and orders.',
          status: this.patientMedications.length ? 'active' : 'warning',
          icon: 'mdi-clipboard-pulse-outline'
        },
        {
          label: 'Discharge readiness',
          value: hasDischargeDoc ? 'Started' : 'Prepare',
          detail: this.dischargeReadinessLabel,
          status: hasDischargeDoc && !this.patientTasks.length ? 'complete' : 'warning',
          icon: 'mdi-exit-run'
        },
        {
          label: 'Social / family',
          value: this.canViewSocialNeeds ? this.summarySocialStatus : 'Protected',
          detail: this.canViewSocialNeeds ? 'Transport, family, finances and home support visible.' : 'Visible by role authorization only.',
          status: this.canViewSocialNeeds ? this.summarySocialStatusLevel : 'protected',
          icon: 'mdi-account-group-outline'
        },
        {
          label: 'Last care entry',
          value: this.recentTimedCareEntries.length ? this.formatShortDate(this.recentTimedCareEntries[0].documentedAt) : 'Not filed',
          detail: this.recentTimedCareEntries[0]?.summary || 'Use Timed care to document bedside work.',
          status: this.recentTimedCareEntries.length ? 'complete' : 'warning',
          icon: 'mdi-clock-edit-outline'
        },
        {
          label: 'Care plan',
          value: carePlanSummary.goalCount ? `${carePlanSummary.completedGoals || 0}/${carePlanSummary.goalCount}` : 'No plan yet',
          detail: carePlanSummary.recentProgress ? `Last update: ${carePlanSummary.recentProgress.label}` : 'Create goals, interventions and outcomes.',
          status: carePlanSummary.goalCount ? 'complete' : 'warning',
          icon: 'mdi-clipboard-text-outline'
        },
        {
          label: 'Education',
          value: educationSummary.documentedCount ? `${educationSummary.completedCount || 0}/${educationSummary.pointCount || 0}` : 'No teaching filed',
          detail: educationSummary.latestEducation ? `Latest teaching by ${educationSummary.latestEducation.learners.join(', ') || 'team'}` : 'Document teaching completed and family education.',
          status: educationSummary.documentedCount ? 'complete' : 'warning',
          icon: 'mdi-school-outline'
        }
      ]
    },
    summarySocialStatus() {
      const riskCount = this.sdohDomains.filter(item => item.status === 'risk').length
      if (riskCount > 1) return `${riskCount} risks`
      if (riskCount === 1) return '1 risk'
      return 'No active risk'
    },
    summarySocialStatusLevel() {
      return this.sdohDomains.some(item => item.status === 'risk') ? 'due' : 'complete'
    },
    summaryPriorityItems() {
      const priorities = []
      if (!this.latestVitalsSummary) priorities.push({ label: 'Record vitals, pain and GCS', detail: 'First complete nursing set is still due.', action: 'nurse', level: 'high' })
      if (this.patientTasks.length) priorities.push({ label: 'Close open worklist items', detail: `${this.patientTasks.length} task(s) pending before handoff.`, action: 'worklist', level: 'high' })
      if (this.patientMedications.length) priorities.push({ label: 'Review MAR and medication safety', detail: `${this.patientMedications.length} active medication item(s).`, action: 'medication', level: 'medium' })
      if (this.hasWoundAreaWarning || this.patientWounds.length) priorities.push({ label: 'Skin and wound follow-up', detail: this.hasWoundAreaWarning ? 'Wound area warning needs reassessment.' : `${this.patientWounds.length} wound record(s) available.`, action: 'flowsheet', level: this.hasWoundAreaWarning ? 'high' : 'medium' })
      if (this.canViewSocialNeeds && this.sdohDomains.some(item => item.status === 'risk')) priorities.push({ label: 'Social / transport barrier review', detail: 'Resolve family, transport or financial barrier early.', action: 'social', level: 'medium' })
      if (!priorities.length) priorities.push({ label: 'Continue scheduled care', detail: 'No urgent blocker detected; document the next timed round.', action: 'flowsheet', level: 'low' })
      return priorities.slice(0, 5)
    },
    carePlanSummaryCards() {
      const summary = this.$store.getters['carePlan/carePlanSummaryProjection']?.(this.activePatientId) || {}
      return [
        { label: 'Plans', detail: `${summary.planCount || 0} active plan(s)`, level: 'low' },
        { label: 'Goals', detail: `${summary.goalCount || 0} goal(s), ${summary.pendingGoals || 0} pending`, level: summary.pendingGoals ? 'medium' : 'low' },
        { label: 'Progress', detail: `${summary.progressCount || 0} documented event(s)`, level: summary.progressCount ? 'low' : 'high' },
        { label: 'Outcome', detail: `${summary.outcomeCount || 0} outcome(s) tracked`, level: 'low' }
      ]
    },
    educationSummaryCards() {
      const summary = this.$store.getters['education/educationSummaryProjection']?.(this.activePatientId) || {}
      return [
        { label: 'Titles', detail: `${summary.titleCount || 0} topic area(s)`, level: 'low' },
        { label: 'Points', detail: `${summary.pointCount || 0} teaching point(s)`, level: summary.pointCount ? 'low' : 'high' },
        { label: 'Completed', detail: `${summary.completedCount || 0} documented completed`, level: summary.completedCount ? 'low' : 'medium' },
        { label: 'Family education', detail: `${summary.familyEducationCount || 0} family session(s)`, level: summary.familyEducationCount ? 'low' : 'medium' }
      ]
    },
    summaryContinuityItems() {
      const rows = []
      if (this.latestVitalsSummary) rows.push({ label: 'Latest vitals', time: this.formatShortDate(this.latestVitals.recordedAt), detail: this.latestVitalsSummary })
      if (this.recentTimedCareEntries.length) rows.push({ label: 'Timed care', time: this.formatShortDate(this.recentTimedCareEntries[0].documentedAt), detail: this.recentTimedCareEntries[0].summary })
      if (this.latestNursingNote) rows.push({ label: 'Nursing note', time: this.formatShortDate(this.latestNursingNote.recordedAt || this.latestNursingNote.createdAt), detail: this.latestNursingNote.response || this.latestNursingNote.observation || this.latestNursingNote.summary || 'Nursing note available' })
      if (this.signableNotes.length) rows.push({ label: 'Clinical note', time: this.formatShortDate(this.signableNotes[0].createdAt), detail: `${this.noteTypeLabel(this.signableNotes[0].noteType)} · ${this.signableNotes[0].status}` })
      if (this.patientDocuments.length) rows.push({ label: 'Document', time: this.formatShortDate(this.patientDocuments[0].createdAt), detail: this.patientDocuments[0].title || this.patientDocuments[0].category || 'Document filed' })
      if (!rows.length) rows.push({ label: 'No filed activity yet', time: 'Now', detail: 'Start with Nurse entry or Timed care documentation.' })
      return rows.slice(0, 5)
    },
    summaryRows() {
      return [
        { label: 'Name', values: { Current: this.activePatient.name } },
        { label: 'MRN', values: { Current: this.activePatient.mrn } },
        { label: 'Current location', values: { Current: this.activePatient.bed } },
        { label: 'Class', values: { Current: this.activePatient.patientClass } },
        { label: 'Allergies', values: { Current: this.activePatient.allergies } },
        { label: 'Open tasks', values: { Current: this.patientTasks.length } },
        { label: 'Open orders', values: { Current: this.patientLabOrders.length + this.patientImagingOrders.length + this.patientMedications.length } }
      ]
    },
    summaryActiveOrderRows() {
      return this.visibleActiveOrders.map(order => ({ label: order.title, values: { Detail: order.detail } }))
    },
    summaryLatestNoteRows() {
      const signable = this.signableNotes.slice(0, 3).map(note => ({
        label: note.title || this.noteTypeLabel(note.noteType),
        values: { Type: this.noteTypeLabel(note.noteType), Recorded: this.formatShortDate(note.createdAt), Summary: note.status }
      }))
      return [...signable, ...this.noteRows].slice(0, 3)
    },
    summaryPendingTaskRows() {
      const legacy = this.patientTasks.map(task => ({
        label: task.title || 'Care task',
        values: { Status: task.status || 'pending' }
      }))
      const woundFollowUps = this.unsignedNoteCount
        ? [{ label: `${this.unsignedNoteCount} note(s) awaiting signature`, values: { Status: 'draft' } }]
        : []
      return [...woundFollowUps, ...legacy].slice(0, 5)
    },
    emrCommandCards() {
      const hasVitals = Boolean(this.latestVitalsSummary)
      const hasClinicalNote = Boolean(this.latestVisit || this.latestNursingNote)
      const hasDiagnostics = Boolean(this.patientLabOrders.length || this.patientImagingOrders.length)
      const hasMeds = Boolean(this.patientMedications.length)
      const hasDischargeDoc = this.patientDocuments.some(doc => /discharge|sortie|avs|after visit/i.test(`${doc.title || ''} ${doc.category || ''}`))
      return [
        {
          key: 'registration',
          label: 'Reception and admission',
          owner: 'Reception + Nurse',
          detail: 'Identity, contact, consent, payment class and bed/service assignment.',
          status: this.activePatient.mrn ? 'complete' : 'due',
          icon: 'mdi-account-plus',
          action: 'registration',
          actionLabel: 'Open'
        },
        {
          key: 'triage',
          label: 'Triage and first contact',
          owner: 'Nurse / Midwife',
          detail: hasVitals ? this.latestVitalsSummary : 'Capture vitals, pain score, GCS and first nursing assessment.',
          status: hasVitals ? 'complete' : 'due',
          icon: 'mdi-heart-pulse',
          action: 'nurse',
          actionLabel: hasVitals ? 'Update' : 'Start'
        },
        {
          key: 'consultation',
          label: 'Clinical decision desk',
          owner: 'Doctor / NP / Midwife',
          detail: hasClinicalNote ? 'Clinical documentation started.' : 'Diagnosis, plan, orders and escalation decisions.',
          status: hasClinicalNote ? 'active' : 'due',
          icon: 'mdi-stethoscope',
          action: this.canLaunchMedical ? 'medical' : 'notes',
          actionLabel: this.canLaunchMedical ? 'Assess' : 'Review'
        },
        {
          key: 'care',
          label: 'Nurse and support care',
          owner: 'Nurse + Aide-soignant',
          detail: this.patientTasks.length ? `${this.patientTasks.length} active task(s) to coordinate.` : 'Timed care, hygiene, mobility, wound care and handoff.',
          status: this.patientTasks.length ? 'active' : 'warning',
          icon: 'mdi-clipboard-list-outline',
          action: 'worklist',
          actionLabel: 'Work'
        },
        {
          key: 'diagnostics',
          label: 'Lab and imaging',
          owner: 'Lab + Imaging',
          detail: hasDiagnostics ? `${this.patientLabOrders.length} lab and ${this.patientImagingOrders.length} imaging item(s).` : 'Specimen, imaging requests and result acknowledgement.',
          status: hasDiagnostics ? 'active' : 'pending',
          icon: 'mdi-flask',
          action: 'lab',
          actionLabel: 'Order'
        },
        {
          key: 'pharmacy',
          label: 'Pharmacy and eMAR',
          owner: 'Pharmacy + Nurse',
          detail: hasMeds ? `${this.patientMedications.length} medication item(s) active.` : 'Medication profile, dispense, administration and reconciliation.',
          status: hasMeds ? 'active' : 'pending',
          icon: 'mdi-pill',
          action: 'medication',
          actionLabel: hasMeds ? 'MAR' : 'Add'
        },
        {
          key: 'maternity',
          label: 'Maternity and newborn',
          owner: 'Sage-femme',
          detail: 'Pregnancy, labor, delivery, newborn and postpartum checks when applicable.',
          status: this.currentRole === 'MIDWIFE' ? 'active' : 'pending',
          icon: 'mdi-baby-face-outline',
          action: 'maternity',
          actionLabel: 'Check'
        },
        {
          key: 'billing',
          label: 'Costs and social support',
          owner: 'Billing + Social work',
          detail: 'Deposit, insurance, indigent support, transport and family coordination.',
          status: this.canViewSocialNeeds ? 'active' : 'pending',
          icon: 'mdi-cash-register',
          action: 'social',
          actionLabel: 'Review'
        },
        {
          key: 'discharge',
          label: 'Discharge and follow-up',
          owner: 'Care team',
          detail: hasDischargeDoc ? 'Discharge document available.' : 'Instructions, medications, follow-up, supplies and family handoff.',
          status: hasDischargeDoc ? 'complete' : 'due',
          icon: 'mdi-logout-variant',
          action: 'discharge',
          actionLabel: 'Prepare'
        }
      ]
    },
    nurseCommandTiles() {
      const vitalsDue = !this.latestVitalsSummary
      const pain = this.latestVitals && this.latestVitals.pain !== undefined ? Number(this.latestVitals.pain) : null
      const medCount = this.patientMedications.length
      return [
        {
          label: 'Vitals and triage',
          value: this.latestVitalsSummary || 'Due now',
          action: vitalsDue ? 'Open nursing entry and capture vitals, pain and GCS.' : 'Trend and update at next scheduled round.',
          status: vitalsDue ? 'due' : 'complete',
          icon: 'mdi-heart-pulse'
        },
        {
          label: 'Pain and comfort',
          value: Number.isFinite(pain) ? `${pain}/10` : 'Not filed',
          action: Number.isFinite(pain) && pain >= 7 ? 'Reassess now and notify provider if not controlled.' : 'Document comfort, positioning and response.',
          status: Number.isFinite(pain) && pain >= 7 ? 'due' : 'active',
          icon: 'mdi-alert-circle-outline'
        },
        {
          label: 'Medication safety',
          value: medCount ? `${medCount} active` : 'Med rec due',
          action: medCount ? 'Review MAR due/held/refused items.' : 'Start medication reconciliation or request order.',
          status: medCount ? 'active' : 'warning',
          icon: 'mdi-pill'
        },
        {
          label: 'Wound and skin',
          value: this.patientWounds.length ? `${this.patientWounds.length} documented` : 'Review',
          action: this.hasWoundAreaWarning ? 'Wound area increased - reassess and notify provider.' : 'Check dressing, photo, dimensions, pressure risk and supplies.',
          status: this.hasWoundAreaWarning ? 'due' : (this.patientWounds.length ? 'active' : 'active'),
          icon: 'mdi-bandage'
        },
        {
          label: 'Mobility and fall risk',
          value: 'Safety rounds',
          action: 'Coordinate aide-soignant support for hygiene, meals and mobility.',
          status: 'active',
          icon: 'mdi-walk'
        },
        {
          label: 'Handoff readiness',
          value: this.latestNursingNote ? 'Note available' : 'Due before shift end',
          action: 'Close open tasks and document unresolved risks.',
          status: this.latestNursingNote ? 'complete' : 'warning',
          icon: 'mdi-handshake-outline'
        },
        {
          label: 'Documentation',
          value: this.unsignedNoteCount ? `${this.unsignedNoteCount} unsigned` : 'All signed',
          action: this.unsignedNoteCount ? "Sign draft notes from today's encounters." : 'All notes signed.',
          status: this.unsignedNoteCount ? 'warning' : 'complete',
          icon: 'mdi-draw-pen'
        }
      ]
    },
    nurseShiftRows() {
      return [
        { label: 'Start shift safety check', values: { Time: 'Start', Priority: 'High', Action: 'Confirm identity, allergies, code status, isolation and fall risk' } },
        { label: 'Vitals, pain and GCS', values: { Time: '0800 / PRN', Priority: this.latestVitalsSummary ? 'Routine' : 'High', Action: this.latestVitalsSummary || 'Capture first complete nursing set' } },
        { label: 'Medication pass and MAR review', values: { Time: 'Per schedule', Priority: this.patientMedications.length ? 'High' : 'Review', Action: this.patientMedications.length ? 'Administer, hold, refuse or educate in MAR' : 'Medication reconciliation pending' } },
        { label: 'Wound / skin / hygiene round', values: { Time: 'Mid-shift', Priority: 'Today', Action: 'Inspect skin, dressing, hygiene, nutrition and mobility needs' } },
        { label: 'Lab / imaging follow-up', values: { Time: 'When resulted', Priority: this.patientLabOrders.length || this.patientImagingOrders.length ? 'High' : 'Routine', Action: 'Acknowledge results and escalate critical signals' } },
        { label: 'End shift handoff', values: { Time: 'Before shift end', Priority: 'High', Action: 'Summarize care, unresolved tasks, family/social issues and next nurse priorities' } }
      ]
    },
    supportCareRows() {
      return [
        { label: 'Hygiene and dignity care', values: { Status: 'Scheduled', Owner: 'CNA / Nurse', Action: 'Bathing, linen, oral care and privacy' } },
        { label: 'Meals and hydration', values: { Status: 'Monitor', Owner: 'CNA / Nurse', Action: 'Record intake, swallowing risk and family food issues' } },
        { label: 'Mobility assistance', values: { Status: 'Safety', Owner: 'CNA / Physio', Action: 'Ambulate or reposition with fall precautions' } },
        { label: 'Transport inside hospital', values: { Status: this.patientImagingOrders.length ? 'Possible' : 'As needed', Owner: 'Support staff', Action: 'Move patient with ticket, oxygen/isolation status and documents' } },
        { label: 'Family communication', values: { Status: 'Context', Owner: 'Nurse / Social', Action: 'Document caregiver updates, payment barriers and discharge support' } }
      ]
    },
    nurseEscalationRows() {
      const vitals = this.latestVitals || {}
      const spo2 = Number(vitals.spo2)
      const temp = Number(vitals.temp)
      const pain = Number(vitals.pain)
      return [
        { label: 'Abnormal vitals', values: { Signal: this.latestVitalsSummary || 'No current vitals', Owner: 'NURSE', Action: Number.isFinite(spo2) && spo2 < 92 ? 'Recheck oxygen and notify provider' : 'Trend and escalate if outside protocol' } },
        { label: 'Fever / infection', values: { Signal: Number.isFinite(temp) ? `${temp} C` : 'Not filed', Owner: 'NURSE / PROVIDER', Action: Number.isFinite(temp) && temp >= 38 ? 'Start sepsis screen and notify provider' : 'Monitor temperature and infection precautions' } },
        { label: 'Uncontrolled pain', values: { Signal: Number.isFinite(pain) ? `${pain}/10` : 'Not filed', Owner: 'NURSE', Action: Number.isFinite(pain) && pain >= 7 ? 'Document intervention response and medication review' : 'Reassess after care' } },
        { label: 'Medication issue', values: { Signal: this.patientMedications.length ? 'Medication profile active' : 'No active meds', Owner: 'NURSE / PHARMACY', Action: 'Escalate allergy, stock, dose, refused or held medication issues' } },
        { label: 'Discharge blocker', values: { Signal: this.patientTasks.length ? `${this.patientTasks.length} open task(s)` : 'No task blocker filed', Owner: 'NURSE / MAJOR', Action: 'Resolve tasks, social support, transport, pharmacy and family education' } }
      ]
    },
    departmentCoverageRows() {
      return [
        { label: 'Reception / Admissions', values: { Status: this.activePatient.mrn ? 'Registered' : 'Due', Owner: 'FRONT_DESK', Next: 'Verify identity, contact, consent and payment class' } },
        { label: 'Infirmier / Infirmiere', values: { Status: this.latestVitalsSummary ? 'Care started' : 'Vitals due', Owner: 'NURSE', Next: 'Document vitals, assessment, tasks and handoff' } },
        { label: 'Aide-soignant', values: { Status: 'Task view', Owner: 'CNA', Next: 'Hygiene, mobility, meals, safety rounds' } },
        { label: 'Medecin / NP', values: { Status: this.latestVisit ? 'Encounter filed' : 'Assessment due', Owner: 'DOCTOR / NP', Next: 'Diagnosis, orders, procedure and discharge decisions' } },
        { label: 'Sage-femme', values: { Status: this.currentRole === 'MIDWIFE' ? 'Focused view' : 'When applicable', Owner: 'MIDWIFE', Next: 'Maternal, newborn and postpartum documentation' } },
        { label: 'Laborantin', values: { Status: this.patientLabOrders.length ? 'Specimen queue' : 'No active lab', Owner: 'LAB', Next: 'Collect, validate and publish results' } },
        { label: 'Imagerie', values: { Status: this.patientImagingOrders.length ? 'Imaging queue' : 'No active imaging', Owner: 'IMAGING', Next: 'Schedule, perform and report imaging' } },
        { label: 'Pharmacie', values: { Status: this.patientMedications.length ? 'Medication profile' : 'Med rec due', Owner: 'PHARMACY', Next: 'Dispense, reconcile and support MAR safety' } },
        { label: 'Major / Surveillant', values: { Status: this.patientTasks.length ? 'Open workload' : 'Stable workload', Owner: 'MAJOR / SUPERVISOR', Next: 'Assign staff, watch blockers, validate handoff' } },
        { label: 'Facturation / Social', values: { Status: 'Context aware', Owner: 'BILLING / SOCIAL', Next: 'Costs, insurance, indigent support and transport' } }
      ]
    },
    offlineReadinessRows() {
      const queuedWork = this.patientTasks.length + this.patientDocuments.length + this.patientVitals.length
      return [
        { label: 'Patient chart cache', values: { State: 'Ready', Fallback: 'Local browser storage', Action: 'Keep active patient available during outage' } },
        { label: 'Forms in dialogs', values: { State: 'Ready', Fallback: 'Save when network returns', Action: 'Use Patient 360 dialogs for all entries' } },
        { label: 'Low bandwidth mode', values: { State: 'Ready', Fallback: 'Text-first flowsheets', Action: 'Avoid heavy navigation and image dependency' } },
        { label: 'Queued clinical work', values: { State: `${queuedWork} local item(s)`, Fallback: 'Sync audit trail', Action: 'Review before shift handoff' } },
        { label: 'Shared workstation safety', values: { State: this.accessProfile.audit, Fallback: 'Role-based masking', Action: 'Minimum necessary data by role' } },
        { label: 'Paper fallback', values: { State: 'Supported', Fallback: 'Print summary / discharge packet', Action: 'Use print only when needed' } }
      ]
    },
    patientCycleRows() {
      const hasVitals = Boolean(this.latestVitalsSummary)
      const hasProviderNote = Boolean(this.latestVisit)
      const hasDiagnostics = Boolean(this.patientLabOrders.length || this.patientImagingOrders.length)
      const hasMedicationProfile = Boolean(this.patientMedications.length)
      const hasDischargeDoc = this.patientDocuments.some(doc => /discharge|sortie|avs|after visit/i.test(`${doc.title || ''} ${doc.category || ''}`))
      return [
        { label: '1. Admission / registration', values: { State: this.activePatient.mrn ? 'Open chart' : 'Due', Lead: 'Reception', Next: 'Identity, contact, consent, payer and service' } },
        { label: '2. Triage / first nurse contact', values: { State: hasVitals ? 'Started' : 'Due', Lead: 'Nurse / Midwife', Next: hasVitals ? this.latestVitalsSummary : 'Vitals, pain, GCS, allergy and fall risk' } },
        { label: '3. Diagnosis and plan', values: { State: hasProviderNote ? 'Documented' : 'Pending', Lead: 'Doctor / NP', Next: 'Problem list, orders, escalation and care goals' } },
        { label: '4. Daily nursing care', values: { State: this.patientTasks.length ? `${this.patientTasks.length} task(s)` : 'Routine board', Lead: 'Nurse / CNA', Next: 'Hygiene, mobility, wound, vitals, education and handoff' } },
        { label: '5. Lab / imaging loop', values: { State: hasDiagnostics ? 'Active' : 'As needed', Lead: 'Lab / Imaging', Next: 'Collect, perform, validate, acknowledge critical results' } },
        { label: '6. Pharmacy / medication loop', values: { State: hasMedicationProfile ? 'Active' : 'Med rec due', Lead: 'Pharmacy / Nurse', Next: 'Stock, substitutions, MAR, patient education' } },
        { label: '7. Cost, family and social support', values: { State: this.canViewSocialNeeds ? 'Visible' : 'Role protected', Lead: 'Billing / Social', Next: 'Deposit, insurance, indigent support, transport and caregiver' } },
        { label: '8. Discharge and follow-up', values: { State: hasDischargeDoc ? 'Packet started' : 'Prepare early', Lead: 'Care team', Next: 'Medication, wound supplies, appointment, transport, paper summary' } }
      ]
    },
    departmentHandoffRows() {
      return [
        { label: 'Reception to nurse', values: { From: 'Reception', To: 'Nurse', Action: 'Identity, bed/service, payer status, emergency contact and consent' } },
        { label: 'Nurse to doctor', values: { From: 'Nurse', To: 'Doctor / NP', Action: 'Triage level, vitals trend, pain, GCS, allergies and urgent concerns' } },
        { label: 'Doctor to lab/imaging', values: { From: 'Provider', To: 'Lab / Imaging', Action: 'Clear indication, priority, specimen/procedure instructions and transport need' } },
        { label: 'Doctor/pharmacy to nurse', values: { From: 'Provider / Pharmacy', To: 'Nurse', Action: 'Medication plan, substitutions, holds, allergies and administration warnings' } },
        { label: 'Nurse to CNA/support', values: { From: 'Nurse', To: 'Aide-soignant / Support', Action: 'Hygiene, meals, mobility, fall risk, isolation and transport limits' } },
        { label: 'Care team to discharge desk', values: { From: 'Care team', To: 'Reception / Social / Billing', Action: 'Follow-up, bill status, transport, family teaching and printed packet' } }
      ]
    },
    roleActionRows() {
      const rowsByRole = {
        NURSE: [
          ['High', 'Triage / Flowsheets', 'Record vitals, pain, GCS, nursing assessment and care tasks'],
          ['High', 'MAR / Orders', 'Administer medications, acknowledge results and document response'],
          ['Today', 'Discharge', 'Teach patient/family and complete handoff']
        ],
        DOCTOR: [
          ['High', 'Clinical decision', 'Review chart, diagnose, place orders and update plan'],
          ['Today', 'Diagnostics', 'Act on abnormal lab/imaging results'],
          ['Today', 'Discharge', 'Confirm readiness and final instructions']
        ],
        MIDWIFE: [
          ['High', 'Maternity', 'Track mother, fetus/newborn, labor or postpartum signals'],
          ['High', 'Triage', 'Capture vitals, bleeding, pain and obstetric warning signs'],
          ['Today', 'Education', 'Counsel mother/family and document follow-up']
        ],
        LAB: [
          ['High', 'Orders', 'Collect specimen and update status'],
          ['High', 'Results', 'Validate result and flag critical values'],
          ['Today', 'Handoff', 'Notify nurse/provider for urgent findings']
        ],
        PHARMACY: [
          ['High', 'Medications', 'Verify allergies, dose, stock and substitutions'],
          ['High', 'MAR', 'Support administration safety and reconciliation'],
          ['Today', 'Discharge', 'Prepare take-home medication instructions']
        ],
        FRONT_DESK: [
          ['High', 'Registration', 'Confirm identity, contact, consent and payment class'],
          ['Today', 'Documents', 'Attach ID, referral, insurance or paper forms'],
          ['Today', 'Discharge', 'Schedule follow-up and print patient packet']
        ],
        CNA: [
          ['High', 'Work List', 'Complete hygiene, meals, mobility and safety rounds'],
          ['Today', 'Flowsheets', 'Report abnormal findings to nurse'],
          ['Today', 'Handoff', 'Document assistance level and unresolved needs']
        ]
      }
      const fallback = [
        ['High', 'Patient 360', 'Review assigned items and act within role scope'],
        ['Today', 'Work List', 'Complete, escalate or hand off open tasks'],
        ['Today', 'Documents', 'File required documentation before shift end']
      ]
      return (rowsByRole[this.currentRole] || fallback).map(row => ({
        label: row[1],
        values: { Priority: row[0], Where: row[1], Action: row[2] }
      }))
    },
    chartReviewRows() {
      const visitEntries = this.patientVisits.map(visit => ({
        label: visit.chiefComplaint || visit.diagnosis || 'Clinical encounter',
        at: visit.createdAt,
        values: {
          Type: this.displayEncounterType(visit.encounterType),
          Recorded: this.formatShortDate(visit.createdAt),
          Clinician: visit.recordedBy || '-'
        }
      }))
      const noteEntries = this.signableNotes.map(note => ({
        label: note.title || this.noteTypeLabel(note.noteType),
        at: note.createdAt,
        values: {
          Type: this.noteTypeLabel(note.noteType),
          Recorded: this.formatShortDate(note.createdAt),
          Clinician: note.createdBy || '-'
        }
      }))
      const woundEntries = this.patientWounds.flatMap(wound => this.woundAssessmentsFor(wound.id).map(assessment => ({
        label: `Wound assessment - ${wound.woundType || 'wound'}`,
        at: assessment.createdAt,
        values: {
          Type: 'Wound Assessment',
          Recorded: this.formatShortDate(assessment.createdAt),
          Clinician: assessment.createdBy || '-'
        }
      })))
      const combined = [...visitEntries, ...noteEntries, ...woundEntries].sort((a, b) => new Date(b.at) - new Date(a.at))
      if (!combined.length) {
        return [{ label: 'No encounters filed', values: { Type: '-', Recorded: '-', Clinician: '-' } }]
      }
      return combined.slice(0, 8).map(({ label, values }) => ({ label, values }))
    },
    riskReviewRows() {
      const patient = this.findPatientRecord(this.activePatientId)
      const reasons = patient && patient.riskReasons && patient.riskReasons.length ? patient.riskReasons : ['No active risk reason filed']
      return [
        { label: 'Risk level', values: { Status: patient ? patient.riskLevel || 'low' : '-' } },
        ...reasons.map(reason => ({ label: reason, values: { Status: 'Review' } }))
      ]
    },
    orderRows() {
      const rows = [
        ...this.patientLabOrders.map(order => ({
          label: order.test || order.orderName || 'Lab order',
          values: { Type: 'Lab', Status: order.status || 'Requested', Detail: order.priority || order.result || '-' }
        })),
        ...this.patientImagingOrders.map(order => ({
          label: order.exam || order.study || 'Imaging order',
          values: { Type: 'Imaging', Status: order.status || 'Requested', Detail: order.priority || order.report || '-' }
        })),
        ...this.patientMedications.map(med => ({
          label: med.drug || med.medication || med.name || 'Medication',
          values: { Type: 'Medication', Status: med.status || 'Active', Detail: [med.dose, med.frequency].filter(Boolean).join(' · ') || '-' }
        }))
      ]
      return rows.length ? rows : [{ label: 'No active orders', values: { Type: '-', Status: '-', Detail: '-' } }]
    },
    orderWorkspaceTabs() {
      const activeCount = this.allOrderItems.filter(item => !/discontinued|cancelled/i.test(item.status)).length
      return [
        { key: 'active', label: 'Active', count: activeCount },
        { key: 'signed', label: 'Signed & Held', count: this.signedHeldOrderItems.length },
        { key: 'home', label: 'Home Meds', count: this.homeMedicationItems.length },
        { key: 'history', label: 'Order History', count: this.orderHistoryItems.length }
      ]
    },
    orderSortOptions() {
      return ['Order Type', 'Status', 'Priority', 'Newest first']
    },
    orderGoToOptions() {
      return ['Scheduled', 'PRN', 'Labs', 'Imaging', 'Home Medications', 'Signed & Held', 'Order History']
    },
    orderModeOptions() {
      return ['Medication', 'Lab', 'Imaging', 'Nursing care', 'Wound care']
    },
    allOrderItems() {
      if (!this.canViewOrders) return []
      const labItems = this.patientLabOrders.map((order, index) => ({
        id: order.id || `lab-${index}`,
        type: 'lab',
        typeLabel: 'Lab',
        label: order.test || order.testName || order.orderName || 'Lab order',
        detail: order.instructions || order.result || order.value || 'Specimen collection and result follow-up',
        status: order.status || 'Requested',
        schedule: order.priority || 'Scheduled',
        orderedBy: order.orderedBy || 'Provider / Nurse',
        priority: order.priority || 'Routine',
        group: 'Labs',
        icon: 'mdi-flask',
        color: '#0369a1',
        statusClass: this.orderStatusClass(order.status || 'Requested'),
        raw: order
      }))
      const imagingItems = this.patientImagingOrders.map((order, index) => ({
        id: order.id || `img-${index}`,
        type: 'imaging',
        typeLabel: 'Imaging',
        label: order.exam || order.modality || order.study || 'Imaging order',
        detail: order.instructions || order.report || 'Radiology scheduling and transport readiness',
        status: order.status || 'Requested',
        schedule: order.priority || 'Scheduled',
        orderedBy: order.orderedBy || 'Provider / Nurse',
        priority: order.priority || 'Routine',
        group: 'Imaging',
        icon: 'mdi-radiology-box',
        color: '#7c3aed',
        statusClass: this.orderStatusClass(order.status || 'Requested'),
        raw: order
      }))
      const medicationItems = this.patientMedications.map((med, index) => {
        const frequency = med.frequency || med.instructions || med.prescriptionText || ''
        const isPrn = /prn|as needed|au besoin/i.test(frequency)
        return {
          id: med.id || `med-${index}`,
          type: 'medication',
          typeLabel: 'Medication',
          label: med.drug || med.medication || med.name || 'Medication',
          detail: [med.dose || med.dosage, med.route, med.frequency || med.instructions].filter(Boolean).join(' · ') || 'Medication administration profile',
          status: med.status || 'Active',
          schedule: isPrn ? 'PRN' : med.frequency || 'Scheduled',
          orderedBy: med.prescribedBy || med.orderedBy || 'Provider / Pharmacy',
          priority: isPrn ? 'PRN' : 'Routine',
          group: isPrn ? 'PRN' : 'Scheduled',
          icon: 'mdi-pill',
          color: '#0f766e',
          statusClass: this.orderStatusClass(med.status || 'Active'),
          raw: med
        }
      })
      const realItems = [...medicationItems, ...labItems, ...imagingItems]
      if (realItems.length) return realItems
      return this.activeOrders.map((order, index) => {
        const title = order.title || 'Clinical order'
        const isLab = /cbc|lab|blood|specimen/i.test(title)
        const isMedication = /medication|drug|pill|admin/i.test(title)
        const type = isLab ? 'lab' : isMedication ? 'medication' : 'nursing'
        return {
          id: `fallback-order-${index}`,
          type,
          typeLabel: isLab ? 'Lab' : isMedication ? 'Medication' : 'Nursing care',
          label: title,
          detail: order.detail || 'Open care order',
          status: order.detail || 'Active',
          schedule: isLab ? 'Labs' : 'Scheduled',
          orderedBy: 'Patient 360 demo',
          priority: 'Routine',
          group: isLab ? 'Labs' : 'Scheduled',
          icon: order.icon || 'mdi-clipboard-text-outline',
          color: order.color || '#0f766e',
          statusClass: this.orderStatusClass(order.detail || 'Active'),
          raw: null
        }
      })
    },
    signedHeldOrderItems() {
      const realOrders = this.allOrderItems.filter(item => /signed|held/i.test(`${item.status} ${item.schedule}`))
      if (realOrders.length) return realOrders.map(item => ({ ...item, group: 'Signed & Held' }))
      return this.signedHeldOrderRows.map((row, index) => ({
        id: `signed-held-${index}`,
        type: 'signed',
        typeLabel: row.values.Type || 'Admission',
        label: row.label,
        detail: row.values.Detail || 'No signed and held action required',
        status: row.values.Status || 'None',
        schedule: 'Signed & Held',
        orderedBy: 'Admission command center',
        priority: 'Review',
        group: 'Signed & Held',
        icon: 'mdi-clipboard-check-outline',
        color: '#475569',
        statusClass: this.orderStatusClass(row.values.Status || 'None'),
        raw: null
      }))
    },
    homeMedicationItems() {
      const patient = this.findPatientRecord(this.activePatientId) || {}
      const homeMeds = Array.isArray(patient.homeMedications) ? patient.homeMedications : []
      const mappedHomeMeds = homeMeds.map((med, index) => ({
        id: med.id || `home-med-${index}`,
        type: 'medication',
        typeLabel: 'Home Medication',
        label: med.drug || med.medication || med.name || String(med),
        detail: [med.dose || med.dosage, med.route, med.frequency].filter(Boolean).join(' · ') || 'Patient home medication',
        status: med.status || 'Needs reconciliation',
        schedule: 'Home Medications',
        orderedBy: med.source || 'Patient history',
        priority: 'Medication reconciliation',
        group: 'Home Medications',
        icon: 'mdi-home-heart',
        color: '#7c3aed',
        statusClass: this.orderStatusClass(med.status || 'Needs reconciliation'),
        raw: med
      }))
      if (mappedHomeMeds.length) return mappedHomeMeds
      return [
        {
          id: 'home-med-reconciliation',
          type: 'medication',
          typeLabel: 'Home Medication',
          label: 'Medication reconciliation',
          detail: this.patientMedications.length ? 'Review active profile against home medication history' : 'No home medication history filed',
          status: this.patientMedications.length ? 'Started' : 'Due',
          schedule: 'Home Medications',
          orderedBy: 'Nurse / Pharmacy',
          priority: 'Admission',
          group: 'Home Medications',
          icon: 'mdi-home-heart',
          color: '#7c3aed',
          statusClass: this.orderStatusClass(this.patientMedications.length ? 'Started' : 'Due'),
          raw: null
        }
      ]
    },
    orderHistoryItems() {
      const taskHistory = this.patientTasks
        .filter(task => /order|medication|lab|imaging|hold|discontinue/i.test(`${task.title || ''} ${task.relatedType || ''} ${task.actionReason || ''}`))
        .map((task, index) => ({
          id: task.id || `order-history-task-${index}`,
          type: task.relatedType || 'task',
          typeLabel: 'Order Task',
          label: task.title || 'Order task',
          detail: task.actionReason || 'Order command task',
          status: task.status || 'pending',
          schedule: task.updatedAt ? this.formatShortDate(task.updatedAt) : 'Order History',
          orderedBy: task.updatedBy || task.createdBy || 'Care team',
          priority: task.priority || 'Routine',
          group: 'Order History',
          icon: 'mdi-history',
          color: '#475569',
          statusClass: this.orderStatusClass(task.status || 'pending'),
          raw: task
        }))
      const orders = this.allOrderItems.map(item => ({
        ...item,
        id: `history-${item.id}`,
        group: 'Order History',
        schedule: item.raw && (item.raw.prescribedAt || item.raw.requestedAt) ? this.formatShortDate(item.raw.prescribedAt || item.raw.requestedAt) : item.schedule
      }))
      return [...taskHistory, ...orders]
    },
    visibleOrderItems() {
      let items = []
      if (this.selectedOrderView === 'signed') items = this.signedHeldOrderItems
      else if (this.selectedOrderView === 'home') items = this.homeMedicationItems
      else if (this.selectedOrderView === 'history') items = this.orderHistoryItems
      else {
        items = this.allOrderItems.filter(item => !/discontinued|cancelled/i.test(item.status))
        if (this.showHomeMedications) items = [...items, ...this.homeMedicationItems]
      }
      const query = this.orderSearch.trim().toLowerCase()
      if (query) {
        items = items.filter(item => `${item.label} ${item.detail} ${item.typeLabel} ${item.status}`.toLowerCase().includes(query))
      }
      const sorted = [...items]
      if (this.orderSortBy === 'Status') sorted.sort((a, b) => a.status.localeCompare(b.status))
      if (this.orderSortBy === 'Priority') sorted.sort((a, b) => a.priority.localeCompare(b.priority))
      if (this.orderSortBy === 'Order Type') sorted.sort((a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label))
      if (this.orderSortBy === 'Newest first') sorted.sort((a, b) => String(b.id).localeCompare(String(a.id)))
      return sorted
    },
    visibleOrderGroups() {
      const grouped = this.visibleOrderItems.reduce((groups, item) => {
        const key = item.group || 'Orders'
        if (!groups[key]) groups[key] = []
        groups[key].push(item)
        return groups
      }, {})
      const preferred = ['Scheduled', 'PRN', 'Labs', 'Imaging', 'Home Medications', 'Signed & Held', 'Order History']
      const keys = Object.keys(grouped).sort((a, b) => {
        const aScore = preferred.includes(a) ? preferred.indexOf(a) : preferred.length
        const bScore = preferred.includes(b) ? preferred.indexOf(b) : preferred.length
        return aScore - bScore || a.localeCompare(b)
      })
      if (this.orderGoTo && keys.includes(this.orderGoTo)) {
        keys.splice(keys.indexOf(this.orderGoTo), 1)
        keys.unshift(this.orderGoTo)
      }
      return keys.map(key => ({ key, title: key, rows: grouped[key] }))
    },
    orderEntrySuggestions() {
      const suggestions = [
        { kind: 'Medication', label: 'Medication order', detail: 'Dose, route, frequency and nursing task', icon: 'mdi-pill-plus', color: '#0f766e' },
        { kind: 'Lab', label: 'Lab order', detail: 'Specimen collection and lab follow-up', icon: 'mdi-flask', color: '#0369a1' },
        { kind: 'Imaging', label: 'Imaging order', detail: 'Radiology request and transport readiness', icon: 'mdi-radiology-box', color: '#7c3aed' },
        { kind: 'Nursing care', label: 'Nursing care task', detail: 'Creates a work-list task for the shift', icon: 'mdi-clipboard-pulse-outline', color: '#be123c' },
        { kind: 'Wound care', label: 'Wound care order', detail: 'Dressing, photo and skin assessment command', icon: 'mdi-bandage', color: '#b45309' }
      ]
      const query = this.orderSearch.trim().toLowerCase()
      if (!query) return suggestions
      return suggestions.filter(item => `${item.label} ${item.detail}`.toLowerCase().includes(query))
    },
    orderSetSuggestions() {
      return [
        { kind: 'Nursing care', label: 'Admission nurse bundle', detail: 'Vitals, pain, GCS, fall risk and education' },
        { kind: 'Wound care', label: 'Wound care bundle', detail: 'Dressing task, wound photo and pain reassessment' },
        { kind: 'Lab', label: 'Sepsis screen bundle', detail: 'CBC, cultures if ordered, vitals and provider notification' },
        { kind: 'Medication', label: 'Discharge med rec bundle', detail: 'Medication review, pharmacy reconciliation and education' }
      ]
    },
    shiftOverviewRows() {
      return [
        { label: 'Current shift', values: { Status: this.currentRole, Owner: this.actorName(), Action: 'Continue active 360 command center' } },
        { label: 'Required documentation', values: { Status: this.patientVitals.length ? 'Started' : 'Due', Owner: 'NURSE', Action: 'Vitals, pain, GCS and assessments' } },
        { label: 'Open work', values: { Status: this.patientTasks.length, Owner: 'Care team', Action: 'Review Work List' } },
        { label: 'New results', values: { Status: this.patientLabOrders.length + this.patientImagingOrders.length, Owner: 'NURSE', Action: 'Acknowledge diagnostics' } }
      ]
    },
    signedHeldOrderRows() {
      const orders = this.orderRows.filter(row => row.values.Status !== '-')
      return orders.length ? orders : [
        { label: 'Admission/Transfer Signed and Held Orders', values: { Type: 'Admission', Status: 'None', Detail: 'No signed and held orders for this encounter' } }
      ]
    },
    releaseOrderRows() {
      const openOrders = this.patientLabOrders.length + this.patientImagingOrders.length + this.patientMedications.length
      return [
        { label: 'Release signed and held orders', values: { Status: openOrders ? 'Available' : 'No pending release', Owner: 'Provider / Nurse', Action: openOrders ? 'Review and release eligible orders' : 'No action' } },
        { label: 'Order acknowledgement', values: { Status: this.patientTasks.length ? 'Required' : 'Current', Owner: 'NURSE', Action: 'Acknowledge active orders' } }
      ]
    },
    careEverywhereRows() {
      return [
        { label: 'All Care Medical Associates LLC', values: { Authorization: 'Not needed', 'Last Update': '30 Jun 2026', Action: 'View outside records' } },
        { label: 'Central Regional Health Center', values: { Authorization: 'Not needed', 'Last Update': '30 Jun 2026', Action: 'View outside records' } },
        { label: 'NextGen Share', values: { Authorization: 'Not needed', 'Last Update': '30 Jun 2026', Action: 'Find outside charts' } }
      ]
    },
    quickLinkRows() {
      return [
        { label: 'Go to Document Flowsheet', values: { Destination: 'Flowsheets', Status: 'Available', Action: 'Open in 360 panel' } },
        { label: 'New Reading', values: { Destination: 'Nursing dialog', Status: 'Available', Action: 'Record vitals and nursing note' } },
        { label: 'Required Documentation', values: { Destination: 'Shift requirements', Status: this.patientVitals.length ? 'Started' : 'Due', Action: 'Complete required rows' } }
      ]
    },
    admissionQuickLinkRows() {
      return [
        ...this.quickLinkRows,
        { label: 'Find Outside Charts', values: { Destination: 'Care Everywhere', Status: 'Available', Action: 'Search outside organizations' } },
        { label: 'Documentation Review', values: { Destination: 'Admission documents', Status: 'Open', Action: 'Review admission packet' } }
      ]
    },
    specimenNotificationRows() {
      return [
        { label: 'Specimen collection', values: { Status: this.patientLabOrders.length ? 'Pending / active' : 'No active specimen', Owner: 'LAB / NURSE', Due: this.patientLabOrders.length ? 'Today' : '-' } },
        { label: 'Provider notification', values: { Status: this.patientLabOrders.length || this.patientImagingOrders.length ? 'If critical result' : 'No pending notification', Owner: 'NURSE', Due: 'Per result' } },
        { label: 'Implants/Pumps', values: { Status: 'No active pump filed', Owner: 'NURSE', Due: 'Assess on admission' } },
        { label: 'Falls documentation review', values: { Status: 'Required', Owner: 'NURSE', Due: 'This shift' } }
      ]
    },
    clinicalAlertRows() {
      return [
        { label: 'Precautions', values: { Status: this.activePatient.precautions, Source: 'Storyboard', Action: 'Maintain precautions' } },
        { label: 'Allergies', values: { Status: this.activePatient.allergies, Source: 'Registration / pharmacy', Action: 'Verify before medication' } },
        { label: 'Infection status', values: { Status: this.activePatient.infectionStatus, Source: 'Admission', Action: 'Review isolation' } }
      ]
    },
    headToToeRows() {
      return [
        { label: 'Neuro', values: { 'Last Filed': this.latestVitals && this.latestVitals.glasgow ? `GCS ${this.latestVitals.glasgow}` : '-', Concern: 'Monitor mentation', Action: 'Reassess per shift' } },
        { label: 'Respiratory', values: { 'Last Filed': this.latestVitals && this.latestVitals.spo2 ? `SpO2 ${this.latestVitals.spo2}%` : '-', Concern: 'Oxygenation', Action: 'Document respiratory status' } },
        { label: 'Skin / wound', values: { 'Last Filed': 'Admission wound documentation', Concern: 'Wound care', Action: 'Photo and dressing assessment' } }
      ]
    },
    ivAssessmentRows() {
      return [
        { label: 'Peripheral IV', values: { Site: 'Not filed', Status: 'Assess', Action: 'Document patency and dressing' } },
        { label: 'Line infection prevention', values: { Site: 'All active lines', Status: 'Due', Action: 'Review site and date' } }
      ]
    },
    safetyFallRows() {
      return [
        { label: 'Rounds/Safety/Alarms', values: { Status: 'Active', Risk: 'Routine safety rounds', Action: 'Document alarms and environment' } },
        { label: 'Fall Risk', values: { Status: 'Required', Risk: 'Assess each shift', Action: 'Update fall prevention plan' } },
        { label: 'Pt Falls & Neuro', values: { Status: 'No event filed', Risk: 'Monitor neuro status', Action: 'File event if fall occurs' } },
        { label: 'Suicide Risk', values: { Status: 'Screening due', Risk: 'Admission safety', Action: 'Complete screening' } }
      ]
    },
    comfortHygieneRows() {
      return [
        { label: 'Comfort', values: { Status: this.latestVitals && this.latestVitals.pain !== undefined ? `${this.latestVitals.pain}/10 pain` : 'Assess', Need: 'Pain / position', Action: 'Reposition and reassess' } },
        { label: 'Hygiene', values: { Status: 'Open', Need: 'Daily care', Action: 'Document assistance level' } },
        { label: 'Psychosocial', values: { Status: 'Open', Need: 'Support / orientation', Action: 'Assess coping and family support' } }
      ]
    },
    mobilityQualityRows() {
      return [
        { label: 'Mobility', values: { Status: 'Open', Baseline: 'Assess on admission', Goal: 'Safe mobility plan' } },
        { label: 'ADLs', values: { Status: 'Open', Baseline: 'Needs assessment', Goal: 'Document independence level' } },
        { label: 'Education', values: { Status: 'Open', Baseline: 'Patient teaching', Goal: 'Complete teach-back' } }
      ]
    },
    admissionDocumentationRows() {
      return [
        { label: 'Travel/Exposure', values: { Status: 'Not filed', Owner: 'NURSE', Action: 'Complete admission history' } },
        { label: 'Allergies / Latex Screening', values: { Status: this.activePatient.allergies, Owner: 'NURSE / PHARMACY', Action: 'Verify and reconcile' } },
        { label: 'Home Meds / Medication Reconciliation', values: { Status: this.patientMedications.length ? 'Started' : 'Due', Owner: 'NURSE / PROVIDER', Action: 'Review medication history' } },
        { label: 'Contacts & Legal', values: { Status: 'Review', Owner: 'Reception / Nurse', Action: 'Confirm emergency contact and consent' } },
        { label: 'Belongings', values: { Status: 'Not filed', Owner: 'NURSE', Action: 'Document patient belongings' } }
      ]
    },
    transferPrintRows() {
      return [
        { label: 'Pre-Procedure Checklist', values: { Status: 'Ready to print', Owner: 'NURSE', Action: 'Review missing items before print' } },
        { label: 'Medication Reconciliation Form', values: { Status: this.patientMedications.length ? 'Medication profile available' : 'No active medications filed', Owner: 'NURSE / PHARMACY', Action: 'Attach current MAR' } },
        { label: 'Ticket to Ride', values: { Status: 'Required', Owner: 'NURSE', Action: 'Send with patient' } },
        { label: 'Transfer packet document', values: { Status: this.patientDocuments.length ? 'Documents filed' : 'No transfer document filed', Owner: 'NURSE', Action: 'File document in 360' } }
      ]
    },
    transferXrayRows() {
      const imaging = this.patientImagingOrders
      if (!imaging.length) {
        return [
          { label: 'Diagnostic Test', values: { Status: 'No active imaging order', Destination: 'Radiology', Action: 'Place imaging order if needed' } },
          { label: 'Non-Invasive Procedure', values: { Status: 'Not scheduled', Destination: 'Procedure area', Action: 'Review transfer need' } },
          { label: 'Print Documents', values: { Status: 'Not ready', Destination: 'Radiology', Action: 'Complete ticket to ride first' } }
        ]
      }
      return imaging.map(order => ({
        label: order.exam || order.modality || order.study || 'Imaging order',
        values: {
          Status: order.status || 'Requested',
          Destination: 'Radiology / X-Ray',
          Action: order.priority || 'Transport when ready'
        }
      }))
    },
    ticketXrayRows() {
      return [
        { label: 'Destination', values: { Status: this.patientImagingOrders.length ? 'Radiology' : 'Not selected', Destination: 'X-Ray / Imaging', Action: 'Confirm receiving area' } },
        { label: 'Oxygen / monitoring', values: { Status: this.latestVitals && this.latestVitals.spo2 ? `SpO2 ${this.latestVitals.spo2}%` : 'Assess before transport', Destination: 'During transport', Action: 'Document support required' } },
        { label: 'Isolation and precautions', values: { Status: this.activePatient.infectionStatus, Destination: 'Receiving area', Action: 'Notify transport team' } },
        { label: 'Allergy banner', values: { Status: this.activePatient.allergies, Destination: 'Receiving area', Action: 'Verify before contrast or meds' } }
      ]
    },
    patientReturnRows() {
      return [
        { label: 'Med Rec for Meds', values: { Status: this.patientMedications.length ? 'Review current meds' : 'No active medications filed', Owner: 'NURSE / PHARMACY', Action: 'Resume, hold, or reconcile meds' } },
        { label: 'Handoff', values: { Status: 'Required on return', Owner: 'NURSE', Action: 'Document procedure outcome and concerns' } },
        { label: 'Vital Signs Monitoring', values: { Status: this.latestVitalsSummary || 'No current vitals', Owner: 'NURSE', Action: 'Record post-transfer vitals' } },
        { label: 'Pain reassessment', values: { Status: this.latestVitals && this.latestVitals.pain !== undefined ? `${this.latestVitals.pain}/10` : 'Due', Owner: 'NURSE', Action: 'Reassess after procedure/transport' } }
      ]
    },
    dischargeQualityRows() {
      return [
        { label: 'Pain Impact', values: { Status: this.latestVitals && this.latestVitals.pain !== undefined ? `${this.latestVitals.pain}/10` : 'Not filed', Owner: 'NURSE', Action: 'Reassess pain before discharge' } },
        { label: 'BMS', values: { Status: this.latestVisit && this.latestVisit.assessment ? 'Assessment available' : 'Not reviewed', Owner: 'NURSE', Action: 'Confirm bowel/bladder status' } },
        { label: 'Function/Quality', values: { Status: this.patientTasks.length ? 'Open care tasks' : 'No open task filed', Owner: 'NURSE / CASE MANAGER', Action: 'Resolve quality checklist' } },
        { label: 'Functional Items', values: { Status: this.latestVisit && this.latestVisit.assessment ? 'Review latest assessment' : 'Needs assessment', Owner: 'NURSE', Action: 'Confirm ADL support and equipment' } },
        { label: 'Mobility', values: { Status: this.latestNursingNote ? this.latestNursingNote.mobility || 'See nursing note' : 'Not documented', Owner: 'NURSE / PHYSIO', Action: 'Confirm safe ambulation or transport' } },
        { label: 'Quality Discharge', values: { Status: this.patientTasks.length ? `${this.patientTasks.length} task(s) to review` : 'Ready for checklist review', Owner: 'MAJOR / NURSE', Action: 'Mark reviewed when completed' } }
      ]
    },
    dischargeDocumentationRows() {
      const hasDischargeDoc = this.patientDocuments.some(doc => /discharge|sortie|avs|after visit/i.test(`${doc.title || ''} ${doc.category || ''}`))
      return [
        { label: 'BestPractice', values: { Status: 'Review required', Owner: 'NURSE', Action: 'Check discharge best-practice prompts' } },
        { label: 'Discharge Info', values: { Status: hasDischargeDoc ? 'Document filed' : 'No discharge document filed', Owner: 'NURSE / PROVIDER', Action: 'File discharge document in 360' } },
        { label: 'Family Notification', values: { Status: this.activePatient.emergencyContact ? 'Contact available' : 'No contact listed', Owner: 'NURSE', Action: 'Notify family/caregiver' } },
        { label: 'Home Pharmacy', values: { Status: this.patientMedications.length ? 'Medication profile ready' : 'No active meds filed', Owner: 'PHARMACY', Action: 'Confirm dispense pharmacy' } },
        { label: 'Discharge Vital Signs', values: { Status: this.latestVitalsSummary || 'No current vitals', Owner: 'NURSE', Action: 'Capture final vitals' } },
        { label: 'Vaccine Doc', values: { Status: 'Review immunizations', Owner: 'NURSE', Action: 'Confirm vaccine documentation' } },
        { label: 'Belongings', values: { Status: 'Pending confirmation', Owner: 'NURSE', Action: 'Inventory belongings' } },
        { label: 'Belongings Return', values: { Status: 'Pending return', Owner: 'NURSE', Action: 'Return and document belongings' } },
        { label: 'LDA Removal', values: { Status: 'Review lines/tubes', Owner: 'NURSE', Action: 'Remove or document active LDAs' } },
        { label: 'Wound LDA Removal', values: { Status: this.activePatient.woundStatus || 'Wound review needed', Owner: 'WOUND NURSE', Action: 'Complete wound LDA review' } },
        { label: 'Education', values: { Status: this.latestNursingNote ? 'Education note available' : 'Not filed', Owner: 'NURSE', Action: 'Document discharge teaching' } },
        { label: 'DME Recommendation', values: { Status: 'Needs review', Owner: 'CASE MANAGER', Action: 'Confirm equipment or supplies' } },
        { label: 'Handoff', values: { Status: this.latestNursingNote ? 'Nursing note available' : 'No handoff note filed', Owner: 'NURSE', Action: 'Complete discharge handoff' } }
      ]
    },
    dischargeInstructionRows() {
      return [
        { label: 'Instructions', values: { Status: 'Required', Owner: 'NURSE', Action: 'Review final instructions with patient' } },
        { label: 'Medication Detail', values: { Status: this.patientMedications.length ? `${this.patientMedications.length} medication(s)` : 'No active meds filed', Owner: 'PHARMACY / PROVIDER', Action: 'Reconcile and explain medications' } },
        { label: 'Med Rec Status', values: { Status: this.patientMedications.length ? 'Pending final reconciliation' : 'No medication profile', Owner: 'PROVIDER', Action: 'Complete medication reconciliation' } },
        { label: 'Type of Med Rec', values: { Status: 'Discharge', Owner: 'PROVIDER', Action: 'Confirm discharge med rec type' } },
        { label: 'Pain/Med Instructions', values: { Status: this.latestVitals && this.latestVitals.pain !== undefined ? `Pain ${this.latestVitals.pain}/10` : 'Pain not filed', Owner: 'NURSE', Action: 'Give pain and medication instructions' } },
        { label: 'Diet Instructions', values: { Status: this.activePatient.diet || 'Not documented', Owner: 'NURSE / DIETITIAN', Action: 'Confirm discharge diet' } },
        { label: 'Nursing Discharge Instructions', values: { Status: this.latestNursingNote ? 'Draft from latest note' : 'Not started', Owner: 'NURSE', Action: 'Document nursing discharge instructions' } },
        { label: 'Wound Care Instructions', values: { Status: this.activePatient.woundStatus || 'Needs wound review', Owner: 'WOUND NURSE', Action: 'Add wound care instructions' } },
        { label: 'RT Instructions', values: { Status: 'If applicable', Owner: 'RESPIRATORY', Action: 'Confirm respiratory therapy instructions' } },
        { label: 'Follow-up Providers', values: { Status: this.activePatient.provider || this.activePatient.attending || 'Provider not assigned', Owner: 'RECEPTION / NURSE', Action: 'Schedule follow-up appointment' } }
      ]
    },
    afterVisitSummaryRows() {
      const avsDoc = this.patientDocuments.find(doc => /avs|after visit|discharge|sortie/i.test(`${doc.title || ''} ${doc.category || ''}`))
      return [
        { label: 'After Visit Summary', values: { Status: avsDoc ? 'Available' : 'Not generated', Owner: 'NURSE', Action: avsDoc ? this.formatShortDate(avsDoc.createdAt) : 'Generate and review AVS' } },
        { label: 'Patient Copy', values: { Status: avsDoc ? 'Ready to print/share' : 'Pending AVS', Owner: 'RECEPTION / NURSE', Action: 'Print, send, or hand to patient' } },
        { label: 'Follow-up Providers', values: { Status: this.activePatient.provider || this.activePatient.attending || 'Needs provider', Owner: 'RECEPTION', Action: 'Confirm appointment and contact' } },
        { label: 'Care Team Review', values: { Status: this.patientTasks.length ? 'Open tasks remain' : 'No task blocker filed', Owner: 'MAJOR / NURSE', Action: 'Final discharge review' } }
      ]
    },
    painImpactRows() {
      return [
        { label: 'Impact of Pain', values: { 'Last Filed': this.latestVitals && this.latestVitals.pain !== undefined ? `${this.latestVitals.pain}/10` : '-', Owner: 'NURSE', Action: 'Assess pain impact before discharge' } },
        { label: 'Pain Management Plan', values: { 'Last Filed': this.patientMedications.length ? 'Medication profile available' : '-', Owner: 'PROVIDER / PHARMACY', Action: 'Confirm take-home plan' } },
        { label: 'Patient Understanding', values: { 'Last Filed': this.latestNursingNote ? this.latestNursingNote.response || 'See nursing note' : '-', Owner: 'NURSE', Action: 'Teach and document response' } }
      ]
    },
    labResultRows() {
      if (!this.patientLabOrders.length) {
        return [{ label: 'No lab orders', values: { Status: '-', Priority: '-', Result: '-' } }]
      }
      return this.patientLabOrders.map(order => ({
        label: order.test || order.orderName || 'Lab order',
        values: {
          Status: order.status || 'Requested',
          Priority: order.priority || '-',
          Result: order.result || order.value || 'Pending'
        }
      }))
    },
    medicationProfileRows() {
      if (!this.patientMedications.length) {
        return [{ label: 'No medications filed', values: { Status: '-', Route: '-', Instructions: '-' } }]
      }
      return this.patientMedications.map(med => ({
        label: med.drug || med.medication || med.name || 'Medication',
        values: {
          Status: med.status || 'Active',
          Route: med.route || med.dispenseAt || '-',
          Instructions: med.instructions || med.frequency || med.dose || med.prescriptionText || '-'
        }
      }))
    },
    emarMedicationRows() {
      const medications = this.patientMedications.length
        ? this.patientMedications
        : this.marRows.map((row, index) => ({ id: `demo-mar-${index}`, drug: row.label, status: 'Active', frequency: Object.values(row.values).includes('Due') ? 'Scheduled' : 'PRN', dose: '', route: '', demoValues: row.values }))
      return medications.map((med, index) => {
        const name = med.drug || med.medication || med.name || med.label || 'Medication'
        const route = med.route || (/(iv|infusion)/i.test(name) ? 'IV' : 'Oral')
        const frequency = med.frequency || med.instructions || med.prescriptionText || 'Scheduled'
        const isPrn = /prn|as needed|au besoin/i.test(frequency)
        const isInfusion = /infusion|ivpb|continuous|running/i.test(`${name} ${route} ${frequency}`)
        const status = med.status || 'Active'
        const statusClass = this.orderStatusClass(status)
        const adminTime = med.lastAdminTime || med.administeredAt || med.schedule || (isPrn ? '' : this.marTimeColumns[index % this.marTimeColumns.length])
        return {
          id: med.id || `emar-med-${index}`,
          raw: med.id && !String(med.id).startsWith('demo-mar') ? med : null,
          orderItem: {
            type: 'medication',
            raw: med,
            label: name,
            detail: [med.dose || med.dosage, route, frequency].filter(Boolean).join(' · ')
          },
          label: name,
          detail: [med.dose || med.dosage || 'Dose per order', route, frequency].filter(Boolean).join(' · '),
          route,
          frequency,
          dispense: med.dispenseLocation || med.dispenseAt || 'Central pharmacy / unit stock',
          education: med.education || `Educate patient on ${name}, indication, expected effect and side effects.`,
          status,
          statusClass,
          scheduleType: isInfusion ? 'infusion' : isPrn ? 'prn' : 'scheduled',
          color: isInfusion ? '#7c3aed' : isPrn ? '#b45309' : '#0f766e',
          icon: isInfusion ? 'mdi-iv-bag' : isPrn ? 'mdi-pill-multiple' : 'mdi-pill',
          lastAdmin: med.lastAdminTime || med.administeredAt || med.lastAdmin || 'Not filed',
          timeline: this.marTimeColumns.map(time => {
            const demoValue = med.demoValues && med.demoValues[time]
            const isDue = !isPrn && (time === adminTime || (!adminTime && time === '1800'))
            const isGiven = demoValue === 'Given' || String(status).toLowerCase() === 'given' || String(med.administrationStatus || '').toLowerCase() === 'given'
            const isHeld = demoValue === 'Held' || /hold|held/i.test(status)
            const isRunning = demoValue === 'Running' || (isInfusion && ['1600', '1700', '1800'].includes(time))
            const text = demoValue || (isGiven && time === adminTime ? 'Given' : isHeld && time === adminTime ? 'Held' : isRunning ? 'Running' : isDue ? 'Due' : isPrn ? 'PRN' : '')
            return {
              time,
              text,
              status: isGiven && time === adminTime ? 'given' : isHeld && time === adminTime ? 'held' : isRunning ? 'running' : isDue ? 'due' : isPrn ? 'prn' : 'empty',
              defaultAction: isDue || isPrn || isRunning ? 'given' : 'details'
            }
          })
        }
      })
    },
    marViewTabs() {
      const rows = this.emarMedicationRows
      return [
        { key: 'all', label: 'All', count: rows.length },
        { key: 'scheduled', label: 'Scheduled', count: rows.filter(row => row.scheduleType === 'scheduled').length },
        { key: 'prn', label: 'PRN', count: rows.filter(row => row.scheduleType === 'prn').length },
        { key: 'continuous', label: 'Continuous', count: rows.filter(row => row.scheduleType === 'infusion').length },
        { key: 'running', label: 'Running Infusions', count: rows.filter(row => row.timeline.some(cell => cell.status === 'running')).length },
        { key: 'education', label: 'Education', count: rows.length }
      ]
    },
    visibleEmarMedicationRows() {
      let rows = [...this.emarMedicationRows]
      if (this.selectedMarView === 'scheduled') rows = rows.filter(row => row.scheduleType === 'scheduled')
      if (this.selectedMarView === 'prn') rows = rows.filter(row => row.scheduleType === 'prn')
      if (this.selectedMarView === 'continuous') rows = rows.filter(row => row.scheduleType === 'infusion')
      if (this.selectedMarView === 'running') rows = rows.filter(row => row.timeline.some(cell => cell.status === 'running'))
      if (this.marHideAdmins) rows = rows.filter(row => row.timeline.some(cell => ['due', 'prn', 'running'].includes(cell.status)))
      const query = this.marSearch.trim().toLowerCase()
      if (query) {
        rows = rows.filter(row => `${row.label} ${row.detail} ${row.route} ${row.frequency} ${row.education}`.toLowerCase().includes(query))
      }
      return rows
    },
    marAdvisories() {
      const rows = []
      if (this.activePatient.allergies && !/no known/i.test(this.activePatient.allergies)) {
        rows.push({ level: 'high', title: 'Allergy check required', detail: this.activePatient.allergies })
      }
      const dueCount = this.emarMedicationRows.filter(row => row.timeline.some(cell => cell.status === 'due')).length
      if (dueCount) rows.push({ level: 'warning', title: 'Medications due', detail: `${dueCount} medication(s) due in the current eMAR window.` })
      const unscanned = this.emarMedicationRows.filter(row => row.raw && !row.raw.lastScanAt).length
      if (unscanned) rows.push({ level: 'warning', title: 'Barcode scan pending', detail: `${unscanned} active medication(s) do not have a scan filed.` })
      if (!rows.length) rows.push({ level: 'normal', title: 'No blocking advisory', detail: 'Continue medication rights and patient education.' })
      return rows
    },
    marEducationCards() {
      return this.visibleEmarMedicationRows.slice(0, 5).map(row => ({
        label: row.label,
        detail: row.education
      }))
    },
    noteRows() {
      const rows = [
        ...this.patientNursingNotes.map(note => ({
          label: note.observation || 'Nursing note',
          values: { Type: 'Nursing', Recorded: this.formatShortDate(note.recordedAt), Summary: note.response || note.actions || '-' }
        })),
        ...this.patientMedicalNotes.map(note => ({
          label: note.diagnosis || note.progressNote || 'Medical note',
          values: { Type: 'Medical', Recorded: this.formatShortDate(note.recordedAt), Summary: note.plan || note.clinicalFindings || '-' }
        }))
      ]
      return rows.length ? rows : [{ label: 'No clinical notes filed', values: { Type: '-', Recorded: '-', Summary: '-' } }]
    },
    carePlanRows() {
      const taskRows = this.patientTasks.map(task => ({
        label: task.title || 'Care task',
        values: { Owner: task.assignedToRole || 'Care team', Status: task.status || 'pending', 'Next Step': task.actionReason || 'Continue plan' }
      }))
      return taskRows.length ? taskRows : [
        { label: 'Nursing surveillance', values: { Owner: 'NURSE', Status: 'Active', 'Next Step': 'Capture vitals and notes' } },
        { label: 'Provider review', values: { Owner: 'DOCTOR', Status: 'Open', 'Next Step': 'Review orders and diagnosis' } }
      ]
    },
    carePlanProblemRows() {
      const problems = (this.latestVisit && this.latestVisit.assessment && this.latestVisit.assessment.nursingProblems) || []
      return problems.map(problem => ({ label: problem, values: { Goal: 'Resolve or stabilize', Status: 'Active' } }))
    },
    educationRows() {
      const latestNote = latestByDate(this.patientNursingNotes, 'recordedAt')
      return [
        { label: 'Medication education', values: { Status: this.patientMedications.length ? 'Due' : 'Not started', Owner: 'Nurse / Pharmacy', Notes: 'Review current medication profile' } },
        { label: 'Discharge instructions', values: { Status: 'Open', Owner: 'Care team', Notes: latestNote ? latestNote.response || 'See latest note' : 'No education note filed' } }
      ]
    },
    immunizationRows() {
      const patient = this.findPatientRecord(this.activePatientId) || {}
      return [
        { label: 'Influenza', values: { Status: patient.influenzaStatus || 'Not reviewed', Date: patient.influenzaDate || '-', Source: 'Patient chart' } },
        { label: 'Tetanus', values: { Status: patient.tetanusStatus || 'Unknown', Date: patient.tetanusDate || '-', Source: 'Patient chart' } }
      ]
    },
    handoffRows() {
      const latestNote = latestByDate(this.patientNursingNotes, 'recordedAt')
      return [
        { label: 'Situation', values: { Status: this.activePatient.patientClass, Owner: 'Outgoing RN', Concern: latestNote ? latestNote.observation || '-' : 'No handoff note filed' } },
        { label: 'Orders to acknowledge', values: { Status: this.patientLabOrders.length + this.patientImagingOrders.length, Owner: 'Incoming RN', Concern: 'Review open orders' } },
        { label: 'Tasks due', values: { Status: this.patientTasks.length, Owner: 'Care team', Concern: 'Complete work list' } }
      ]
    },
    documentRows() {
      if (!this.patientDocuments.length) {
        return [{ label: 'No documents filed', values: { Category: '-', Status: '-', Filed: '-' } }]
      }
      return this.patientDocuments.map(doc => ({
        label: doc.title || doc.name || 'Document',
        values: {
          Category: doc.category || 'Clinical document',
          Status: doc.status || 'Filed',
          Filed: this.formatShortDate(doc.createdAt)
        }
      }))
    },
    registrationRows() {
      const patient = this.findPatientRecord(this.activePatientId) || {}
      return [
        { label: 'Full name', values: { Value: this.activePatient.name } },
        { label: 'Date of birth', values: { Value: this.activePatient.dob } },
        { label: 'Sex', values: { Value: this.activePatient.gender } },
        { label: 'Phone', values: { Value: patient.phone || '-' } },
        { label: 'Address', values: { Value: patient.address || '-' } },
        { label: 'Region', values: { Value: patient.region || '-' } },
        { label: 'PHI basis', values: { Value: patient.phiAccessBasis || 'Treatment' } }
      ]
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
    avatarAnatomy() {
      const gender = String(this.activePatient.gender || this.activePatient.sex || '').toLowerCase()
      if (/female|femme|woman|girl|f\b/.test(gender)) return 'female'
      if (/male|homme|man|boy|m\b/.test(gender)) return 'male'
      return 'male'
    },
    avatarAnatomyLabel() {
      return this.avatarAnatomy === 'female' ? 'female' : 'male'
    },
    avatarImageSrc() {
      const images = {
        female: {
          front: femaleFrontAvatar,
          back: femaleBackAvatar
        },
        male: {
          front: maleFrontAvatar,
          back: maleBackAvatar
        }
      }
      return images[this.avatarAnatomy] && images[this.avatarAnatomy][this.avatarView]
    },
    selectedAvatarToolRecord() {
      return this.avatarPlacementTools.find(tool => tool.key === this.selectedAvatarTool) || null
    },
    visibleAvatarPlacements() {
      return this.avatarPlacements.filter(item => item.view === this.avatarView)
    },
    avatarPlacementRows() {
      if (!this.avatarPlacements.length) {
        return [
          { label: 'No placed item', values: { Type: '-', Region: 'Select or drag a sticker onto the avatar', Status: 'Pending' } }
        ]
      }
      return this.avatarPlacements.map(item => ({
        label: item.label,
        values: {
          Type: item.label,
          Region: `${item.region} (${item.view})`,
          Status: item.status || 'Active'
        }
      }))
    },
    avatarPlacementDialogTitle() {
      const form = this.forms.avatarPlacement || {}
      return form.id ? `${form.label} - ${form.region || 'Selected location'}` : 'New mapped element'
    },
    avatarPlacementSiteCareLabel() {
      const type = this.forms.avatarPlacement && this.forms.avatarPlacement.type
      const labels = {
        wound: 'Wound bed / care',
        trach: 'Trach care / airway',
        iv: 'Line type / gauge',
        foley: 'Urine output / catheter care',
        drain: 'Drain output / bulb status',
        ostomy: 'Stoma / appliance',
        pain: 'Intervention'
      }
      return labels[type] || 'Site care'
    },
    avatarPlacementNotesLabel() {
      const type = this.forms.avatarPlacement && this.forms.avatarPlacement.type
      const labels = {
        wound: 'Wound assessment notes',
        trach: 'Tracheostomy assessment notes',
        iv: 'IV site assessment notes',
        foley: 'Foley catheter assessment notes',
        drain: 'Drain assessment notes',
        ostomy: 'Ostomy assessment notes',
        pain: 'Pain assessment notes'
      }
      return labels[type] || 'Assessment notes'
    },
    avatarZones() {
      const vitals = this.latestVitals || {}
      const pain = Number(vitals.pain)
      const spo2 = Number(vitals.spo2)
      const activeWoundCount = this.patientWounds.length
      const hasWound = Boolean(activeWoundCount || this.activePatient.woundStatus || /wound|skin/i.test(`${this.activePatient.problem || ''} ${this.activePatient.alert || ''}`))
      const abnormalVitals = Number.isFinite(spo2) && spo2 < 92
      return [
        {
          key: 'neuro',
          view: 'front',
          label: 'Neuro / cognition',
          short: 'Neuro',
          icon: 'mdi-brain',
          color: '#2563eb',
          status: this.latestVitals && this.latestVitals.glasgow && Number(this.latestVitals.glasgow) < 15 ? 'risk' : 'stable',
          statusLabel: this.latestVitals && this.latestVitals.glasgow ? `GCS ${this.latestVitals.glasgow}` : 'Neuro due',
          detail: this.latestVitals && this.latestVitals.glasgow ? 'Latest Glasgow Coma Scale is available.' : 'No current neuro score filed.',
          primaryAction: 'body',
          primaryActionLabel: 'Neuro assessment'
        },
        {
          key: 'resp',
          view: 'front',
          label: 'Respiratory',
          short: 'Resp',
          icon: 'mdi-lungs',
          color: abnormalVitals ? '#be123c' : '#0f766e',
          status: abnormalVitals ? 'risk' : 'stable',
          statusLabel: vitals.spo2 ? `SpO2 ${vitals.spo2}%` : 'SpO2 due',
          detail: vitals.spo2 ? 'Respiratory status is tied to latest filed SpO2.' : 'Record respiratory status with next vital signs.',
          primaryAction: 'nurse',
          primaryActionLabel: 'Respiratory note'
        },
        ...(this.avatarAnatomy === 'female'
          ? [{
              key: 'breast',
              view: 'front',
              label: 'Breast / chest',
              short: 'Breast',
              icon: 'mdi-human-female',
              color: '#7c3aed',
              status: 'stable',
              statusLabel: 'Breast review',
              detail: 'Assess breast/chest skin, pain, swelling, wound, lactation or postpartum findings when clinically relevant.',
              primaryAction: 'body',
              primaryActionLabel: 'Breast assessment'
            }]
          : []),
        {
          key: 'cardiac',
          view: 'front',
          label: 'Cardiac / vitals',
          short: 'Vitals',
          icon: 'mdi-heart-pulse',
          color: '#0f766e',
          status: this.patientVitals.length ? 'active' : 'risk',
          statusLabel: this.latestVitalsSummary || 'Vitals due',
          detail: this.latestVitalsSummary || 'No current vital signs filed for this patient.',
          primaryAction: 'nurse',
          primaryActionLabel: 'File vitals'
        },
        {
          key: 'iv',
          view: 'front',
          label: 'IV / lines',
          short: 'IV',
          icon: 'mdi-needle',
          color: '#7c3aed',
          status: this.patientMedications.some(med => /iv|infusion/i.test(`${med.route || ''} ${med.frequency || ''} ${med.instructions || ''}`)) ? 'active' : 'stable',
          statusLabel: 'Line review',
          detail: 'Review patency, site condition, dressing date and infusion compatibility.',
          primaryAction: 'body',
          primaryActionLabel: 'Line assessment'
        },
        {
          key: 'skin',
          view: 'back',
          label: 'Skin / wound',
          short: 'Skin',
          icon: 'mdi-bandage',
          color: hasWound ? '#be123c' : '#0f766e',
          status: hasWound ? 'risk' : 'stable',
          statusLabel: hasWound ? `${activeWoundCount || 1} wound/skin` : 'Skin stable',
          detail: hasWound ? (this.activePatient.woundStatus || 'Active wound concern requires photo, dimensions and dressing status.') : 'No active wound signal in current chart.',
          primaryAction: 'wound',
          primaryActionLabel: 'Wound documentation'
        },
        {
          key: 'pain',
          view: 'front',
          label: 'Pain',
          short: 'Pain',
          icon: 'mdi-alert-circle-outline',
          color: Number.isFinite(pain) && pain >= 7 ? '#be123c' : '#f97316',
          status: Number.isFinite(pain) && pain >= 7 ? 'risk' : (Number.isFinite(pain) ? 'active' : 'stable'),
          statusLabel: Number.isFinite(pain) ? `${pain}/10` : 'Pain due',
          detail: Number.isFinite(pain) ? 'Pain score is filed and can drive reassessment timing.' : 'Pain score should be captured with the next nursing assessment.',
          primaryAction: 'nurse',
          primaryActionLabel: 'Pain reassessment'
        },
        {
          key: 'mobility',
          view: 'back',
          label: 'Mobility / fall risk',
          short: 'Move',
          icon: 'mdi-walk',
          color: '#f97316',
          status: 'active',
          statusLabel: 'Fall precautions',
          detail: 'Mobility assistance and fall precautions remain part of shift rounds.',
          primaryAction: 'flowsheet',
          primaryActionLabel: 'Mobility round'
        },
        {
          key: 'meds',
          view: 'front',
          label: 'Medication workload',
          short: 'Meds',
          icon: 'mdi-pill',
          color: '#0f766e',
          status: this.patientMedications.length ? 'active' : 'stable',
          statusLabel: this.patientMedications.length ? `${this.patientMedications.length} medication(s)` : 'No meds filed',
          detail: this.patientMedications.length ? 'Active medication profile is available for MAR and reconciliation.' : 'No active medication order filed in this chart.',
          primaryAction: 'medication',
          primaryActionLabel: 'Medication action'
        }
      ]
    },
    visibleAvatarZones() {
      return this.avatarZones.filter(zone => zone.view === this.avatarView || ['pain', 'meds'].includes(zone.key))
    },
    avatarNarrative() {
      const riskCount = this.avatarZones.filter(zone => zone.status === 'risk').length
      const activeCount = this.avatarZones.filter(zone => zone.status === 'active').length
      return `${riskCount} risk zone(s), ${activeCount} active care zone(s), ${this.patientWounds.length} wound record(s), ${this.patientMedications.length} medication item(s).`
    },
    activeAvatarZoneRecord() {
      return this.avatarZones.find(zone => zone.key === this.activeAvatarZone) || this.avatarZones[0]
    },
    activeAvatarRows() {
      const zone = this.activeAvatarZoneRecord
      const evidenceMap = {
        neuro: this.latestVitals && this.latestVitals.glasgow ? `GCS ${this.latestVitals.glasgow}` : 'No GCS filed',
        resp: this.latestVitals && this.latestVitals.spo2 ? `SpO2 ${this.latestVitals.spo2}%` : 'No SpO2 filed',
        cardiac: this.latestVitalsSummary || 'No current vitals',
        breast: this.avatarAnatomy === 'female' ? 'Female anatomy enabled' : 'Not applicable',
        iv: this.patientMedications.length ? 'Medication/infusion profile available' : 'No infusion order filed',
        skin: this.activePatient.woundStatus || 'Admission wound documentation',
        pain: this.latestVitals && this.latestVitals.pain !== undefined ? `${this.latestVitals.pain}/10` : 'Pain not filed',
        mobility: this.latestNursingNote ? this.latestNursingNote.mobility || 'See nursing note' : 'No mobility note filed',
        meds: this.patientMedications.length ? `${this.patientMedications.length} active item(s)` : 'No medication profile'
      }
      const actionMap = {
        neuro: 'Document neuro/GCS assessment',
        resp: 'Record respiratory status and oxygen need',
        cardiac: 'File vitals and reassess trend',
        breast: 'Document focused breast/chest assessment',
        iv: 'Document line site, patency and dressing',
        skin: 'File wound photo, measurements and dressing',
        pain: 'Document intervention and reassessment',
        mobility: 'Update fall risk and assist level',
        meds: 'Review MAR and medication reconciliation'
      }
      return [
        {
          label: zone.label,
          values: {
            Status: zone.statusLabel,
            Evidence: evidenceMap[zone.key] || zone.detail,
            Action: actionMap[zone.key] || 'Document assessment'
          }
        }
      ]
    },
    avatarSystemRows() {
      return this.avatarZones.map(zone => ({
        label: zone.label,
        values: {
          Status: zone.statusLabel,
          Evidence: zone.detail,
          Action: zone.status === 'risk' ? 'Prioritize this zone' : 'Continue scheduled assessment'
        }
      }))
    },
    avatarCareTargetRows() {
      return [
        { label: 'Wound / skin target', values: { Location: 'Skin', Status: this.activePatient.woundStatus || 'Review skin integrity', 'Next Step': 'Photo, dimensions, dressing status' } },
        { label: 'Pain target', values: { Location: 'Pain', Status: this.latestVitals && this.latestVitals.pain !== undefined ? `${this.latestVitals.pain}/10` : 'Not filed', 'Next Step': 'Reassess after intervention' } },
        { label: 'IV / line target', values: { Location: 'Upper extremity / IV', Status: 'Assess patency', 'Next Step': 'Document site and dressing' } },
        { label: 'Mobility target', values: { Location: 'Lower extremity / safety', Status: 'Fall precautions active', 'Next Step': 'Confirm assist level every round' } },
        { label: 'Medication target', values: { Location: 'MAR', Status: this.patientMedications.length ? `${this.patientMedications.length} medication(s)` : 'No meds filed', 'Next Step': 'Review due/held/administered items' } }
      ]
    },
    avatarPriorityRows() {
      const rows = this.avatarZones
        .filter(zone => zone.status === 'risk')
        .map(zone => ({
          label: zone.label,
          values: {
            Reason: zone.statusLabel,
            Owner: zone.key === 'skin' ? 'WOUND NURSE / NURSE' : zone.key === 'meds' ? 'NURSE / PHARMACY' : 'NURSE',
            'Next Action': zone.detail
          }
        }))
      if (!rows.length) {
        rows.push({ label: 'Scheduled body review', values: { Reason: 'No high-risk zone selected', Owner: 'NURSE / CNA', 'Next Action': 'Continue timed care rounds and reassess changes.' } })
      }
      return rows
    },
    flowsheetTimeColumns() {
      return ['0800', '1000', '1200', '1400', '1600', '1800']
    },
    aiCareAcuityScore() {
      let score = 22
      const vitals = this.latestVitals || {}
      const pain = Number(vitals.pain)
      const temp = Number(vitals.temp)
      const spo2 = Number(vitals.spo2)
      const hr = Number(vitals.hr)
      if (!this.patientVitals.length) score += 14
      if (Number.isFinite(pain) && pain >= 7) score += 18
      if (Number.isFinite(temp) && temp >= 38) score += 15
      if (Number.isFinite(spo2) && spo2 < 92) score += 18
      if (Number.isFinite(hr) && (hr > 110 || hr < 50)) score += 12
      if (this.patientTasks.length) score += Math.min(this.patientTasks.length * 6, 24)
      if (this.patientLabOrders.length || this.patientImagingOrders.length) score += 8
      if (this.patientMedications.length) score += 5
      if (this.activePatient.woundStatus || /wound|skin/i.test(`${this.activePatient.problem || ''} ${this.activePatient.alert || ''}`)) score += 12
      return Math.min(score, 100)
    },
    aiCareRiskLabel() {
      if (this.aiCareAcuityScore >= 75) return 'High risk'
      if (this.aiCareAcuityScore >= 50) return 'Watch closely'
      return 'Stable command state'
    },
    effectiveAiCareAcuityScore() {
      return this.remoteAiCarePlan && Number.isFinite(Number(this.remoteAiCarePlan.acuityScore))
        ? Number(this.remoteAiCarePlan.acuityScore)
        : this.aiCareAcuityScore
    },
    effectiveAiCareRiskLabel() {
      return this.remoteAiCarePlan && this.remoteAiCarePlan.riskLabel
        ? this.remoteAiCarePlan.riskLabel
        : this.aiCareRiskLabel
    },
    aiNextBestAction() {
      const vitals = this.latestVitals || {}
      const pain = Number(vitals.pain)
      const spo2 = Number(vitals.spo2)
      if (!this.patientVitals.length) return 'Start with vitals, pain score and GCS, then file the nursing assessment.'
      if (Number.isFinite(spo2) && spo2 < 92) return 'Prioritize respiratory reassessment and notify provider if low oxygen persists.'
      if (Number.isFinite(pain) && pain >= 7) return 'Reassess pain now, document intervention response, and review medication plan.'
      if (this.patientTasks.length) return 'Complete or acknowledge due care tasks before the next scheduled round.'
      if (this.activePatient.woundStatus) return 'Complete wound reassessment, photo/dimensions, and dressing status.'
      return 'Continue scheduled rounds and document the next flowsheet event on time.'
    },
    effectiveAiNextBestAction() {
      return this.remoteAiCarePlan && this.remoteAiCarePlan.nextBestAction
        ? this.remoteAiCarePlan.nextBestAction
        : this.aiNextBestAction
    },
    aiCareInsights() {
      const insights = []
      const vitals = this.latestVitals || {}
      const pain = Number(vitals.pain)
      const temp = Number(vitals.temp)
      const spo2 = Number(vitals.spo2)
      if (!this.patientVitals.length) {
        insights.push({ level: 'high', icon: 'mdi-heart-pulse', title: 'Vitals missing', detail: 'No current vital signs filed for this patient.' })
      } else {
        insights.push({ level: 'good', icon: 'mdi-check-circle', title: 'Vitals available', detail: this.latestVitalsSummary || 'Latest vital signs are filed.' })
      }
      if (Number.isFinite(pain) && pain >= 7) {
        insights.push({ level: 'high', icon: 'mdi-alert-circle', title: 'Pain priority', detail: `Pain is ${pain}/10. Reassessment and response are due.` })
      }
      if (Number.isFinite(spo2) && spo2 < 92) {
        insights.push({ level: 'high', icon: 'mdi-lungs', title: 'Oxygenation risk', detail: `SpO2 is ${spo2}%. Respiratory review is recommended.` })
      }
      if (Number.isFinite(temp) && temp >= 38) {
        insights.push({ level: 'warning', icon: 'mdi-thermometer-alert', title: 'Fever watch', detail: `Temperature is ${temp} C. Consider sepsis screen.` })
      }
      if (this.patientTasks.length) {
        insights.push({ level: 'warning', icon: 'mdi-format-list-checks', title: 'Open care tasks', detail: `${this.patientTasks.length} task(s) need review in this shift.` })
      }
      if (this.patientMedications.length) {
        insights.push({ level: 'info', icon: 'mdi-pill', title: 'Medication workload', detail: `${this.patientMedications.length} medication item(s) in the active profile.` })
      }
      if (this.activePatient.woundStatus || /wound|skin/i.test(`${this.activePatient.problem || ''} ${this.activePatient.alert || ''}`)) {
        insights.push({ level: 'warning', icon: 'mdi-bandage', title: 'Wound care focus', detail: 'Wound/skin documentation should stay on the care schedule.' })
      }
      return insights.slice(0, 5)
    },
    effectiveAiCareInsights() {
      return this.remoteAiCarePlan && Array.isArray(this.remoteAiCarePlan.insights) && this.remoteAiCarePlan.insights.length
        ? this.remoteAiCarePlan.insights
        : this.aiCareInsights
    },
    aiPriorityRows() {
      const rows = []
      const vitals = this.latestVitals || {}
      const pain = Number(vitals.pain)
      const spo2 = Number(vitals.spo2)
      if (!this.patientVitals.length) {
        rows.push({ label: 'Capture baseline vitals and GCS', values: { Reason: 'No current vital signs', Owner: 'NURSE', 'Next Action': 'Open Documenter soin' } })
      }
      if (Number.isFinite(spo2) && spo2 < 92) {
        rows.push({ label: 'Respiratory reassessment', values: { Reason: `SpO2 ${spo2}%`, Owner: 'NURSE / PROVIDER', 'Next Action': 'Recheck oxygen, notify if persistent' } })
      }
      if (Number.isFinite(pain) && pain >= 7) {
        rows.push({ label: 'Pain intervention response', values: { Reason: `Pain ${pain}/10`, Owner: 'NURSE', 'Next Action': 'Document intervention and reassessment' } })
      }
      if (this.patientTasks.length) {
        rows.push({ label: 'Close due worklist items', values: { Reason: `${this.patientTasks.length} open task(s)`, Owner: 'CARE TEAM', 'Next Action': 'Acknowledge, complete, or escalate' } })
      }
      if (this.activePatient.woundStatus || /wound|skin/i.test(`${this.activePatient.problem || ''} ${this.activePatient.alert || ''}`)) {
        rows.push({ label: 'Wound photo and dressing status', values: { Reason: 'Active wound concern', Owner: 'WOUND NURSE', 'Next Action': 'File wound documentation' } })
      }
      if (!rows.length) {
        rows.push({ label: 'Maintain scheduled care', values: { Reason: 'No high-priority signal', Owner: 'NURSE', 'Next Action': 'Continue timed flowsheet rounds' } })
      }
      return rows
    },
    effectiveAiPriorityRows() {
      if (!this.remoteAiCarePlan || !Array.isArray(this.remoteAiCarePlan.priorityRows) || !this.remoteAiCarePlan.priorityRows.length) {
        return this.aiPriorityRows
      }
      return this.remoteAiCarePlan.priorityRows.map(row => ({
        label: row.label || 'AI recommendation',
        values: {
          Reason: row.reason || '-',
          Owner: row.owner || 'CARE TEAM',
          'Next Action': row.nextAction || '-'
        }
      }))
    },
    flowsheetScheduleSlots() {
      const openTasks = this.patientTasks.length
      return [
        { time: '0800', label: this.latestVitalsSummary ? 'Vitaux deja files' : 'Vitaux / douleur a saisir', owner: 'NURSE', status: this.latestVitalsSummary ? 'done' : 'due' },
        { time: '1000', label: 'Pansement / wound care', owner: 'WOUND NURSE', status: 'active' },
        { time: '1200', label: 'Reevaluation douleur + I/O', owner: 'NURSE', status: 'due' },
        { time: '1400', label: this.patientMedications.length ? 'Administration medicaments' : 'Medication review', owner: 'NURSE / PHARMACY', status: this.patientMedications.length ? 'active' : 'pending' },
        { time: '1600', label: openTasks ? `${openTasks} tache(s) a cloturer` : 'Rounds securite', owner: 'CARE TEAM', status: openTasks ? 'due' : 'pending' },
        { time: '1800', label: 'Handoff et plan prochaine equipe', owner: 'NURSE', status: this.latestNursingNote ? 'pending' : 'due' }
      ]
    },
    flowsheetScheduleRows() {
      return [
        { label: 'Vital signs / pain', values: { '0800': this.latestVitalsSummary || 'Due', '1000': '-', '1200': 'Reassess', '1400': '-', '1600': 'As needed', '1800': 'Handoff value' } },
        { label: 'Medication administration', values: { '0800': this.patientMedications.length ? 'Review MAR' : '-', '1000': this.patientMedications.length ? 'Scheduled' : '-', '1200': '-', '1400': this.patientMedications.length ? 'Scheduled' : '-', '1600': '-', '1800': this.patientMedications.length ? 'Evening due' : '-' } },
        { label: 'Wound / skin care', values: { '0800': 'Inspect', '1000': 'Dressing / photo', '1200': '-', '1400': 'Reposition', '1600': 'Skin check', '1800': 'Handoff' } },
        { label: 'Intake and output', values: { '0800': 'Start totals', '1000': '-', '1200': 'Record I/O', '1400': '-', '1600': 'Review balance', '1800': 'Close shift' } },
        { label: 'Mobility / safety rounds', values: { '0800': 'Fall precautions', '1000': 'Assist activity', '1200': 'Position', '1400': 'Round', '1600': 'Round', '1800': 'Handoff risk' } }
      ]
    },
    flowsheetTaskRows() {
      const rows = this.patientTasks.length
        ? this.patientTasks.map(task => ({
          label: task.title || task.label || 'Care task',
          values: {
            Time: this.formatShortDate(task.createdAt || task.updatedAt) || 'Today',
            Priority: task.priority || task.assignedToRole || 'Routine',
            Status: task.status || 'pending',
            Action: task.actionReason || 'Document in flowsheet'
          }
        }))
        : this.worklistRows.map(row => ({
          label: row.label,
          values: { ...row.values, Action: row.values.Status === 'Open' || row.values.Status === 'Due' ? 'Documenter / completer' : 'Review' }
        }))
      return rows
    },
    skinWoundFlowsheetRows() {
      const scheduleRows = [
        { label: 'Braden Scale - sensory perception', values: { '0800': '3', '1000': '-', '1200': '-', '1400': '-', '1600': 'Recheck', '1800': '-' } },
        { label: 'Moisture', values: { '0800': '4', '1000': '-', '1200': 'Monitor', '1400': '-', '1600': '-', '1800': '-' } },
        { label: 'Activity / mobility', values: { '0800': '2', '1000': 'Assist x1', '1200': '-', '1400': 'Reposition', '1600': '-', '1800': 'Handoff' } },
        { label: 'Nutrition', values: { '0800': '2', '1000': '-', '1200': 'Meal intake', '1400': '-', '1600': '-', '1800': '-' } },
        { label: 'Friction and shear', values: { '0800': '3', '1000': '-', '1200': '-', '1400': 'Reposition', '1600': '-', '1800': '-' } },
        { label: 'Wound prevention dressing', values: { '0800': 'Assess', '1000': 'Change if due', '1200': '-', '1400': '-', '1600': 'Intact?', '1800': 'Report' } }
      ]
      if (!this.patientWounds.length) {
        return [...scheduleRows, { label: 'Wound photo / dimensions', values: { '0800': 'No wounds documented', '1000': '-', '1200': '-', '1400': '-', '1600': '-', '1800': '-' } }]
      }
      const woundRows = this.patientWounds.map(wound => {
        const latest = this.woundAssessmentsFor(wound.id).slice(-1)[0]
        const summary = latest ? `${latest.surfaceArea} cm2${latest.warningAreaIncreased ? ' (increased)' : ''}` : 'Assess due'
        return {
          label: `${wound.woundType || 'Wound'} - ${wound.anatomicalLocation || 'location N/A'}`,
          values: {
            '0800': summary,
            '1000': '-',
            '1200': '-',
            '1400': '-',
            '1600': latest ? (latest.dressingType || 'Dressing due') : 'Assess due',
            '1800': '-'
          }
        }
      })
      return [...scheduleRows, ...woundRows]
    },
    flowsheetVitalsRows() {
      if (this.patientVitals.length) {
        return [
          { label: 'Blood pressure', values: { 'Last Filed': this.latestVitals.bp || '-', 'Next Due': '1200 / PRN', Action: 'Document trend' } },
          { label: 'Heart rate', values: { 'Last Filed': this.latestVitals.hr || '-', 'Next Due': '1200 / PRN', Action: 'Notify if abnormal' } },
          { label: 'Temperature', values: { 'Last Filed': this.latestVitals.temp ? `${this.latestVitals.temp} C` : '-', 'Next Due': '1200 / PRN', Action: 'Sepsis screen if febrile' } },
          { label: 'SpO2', values: { 'Last Filed': this.latestVitals.spo2 ? `${this.latestVitals.spo2}%` : '-', 'Next Due': '1200 / PRN', Action: 'Respiratory review' } },
          { label: 'Pain', values: { 'Last Filed': this.latestVitals.pain !== undefined ? `${this.latestVitals.pain}/10` : '-', 'Next Due': 'After intervention', Action: 'Reassess pain' } },
          { label: 'Fall precautions', values: { 'Last Filed': 'Active', 'Next Due': 'Every round', Action: 'Document safety round' } }
        ]
      }
      return [
        { label: 'Blood pressure', values: { '0800': 'Due', '1000': '-', '1200': 'Due', '1400': '-', '1600': 'PRN', '1800': 'Handoff' } },
        { label: 'Pain score', values: { '0800': 'Due', '1000': 'After care', '1200': 'Due', '1400': '-', '1600': 'PRN', '1800': 'Handoff' } },
        { label: 'Safety round', values: { '0800': 'Fall precautions', '1000': 'Round', '1200': 'Round', '1400': 'Round', '1600': 'Round', '1800': 'Handoff' } }
      ]
    },
    flowsheetIntakeMobilityRows() {
      return [
        { label: 'Oral intake', values: { '0800': 'Breakfast', '1000': '-', '1200': 'Lunch', '1400': '-', '1600': 'Hydration', '1800': 'Dinner' } },
        { label: 'IV intake', values: { '0800': 'Review fluids', '1000': '-', '1200': 'Record volume', '1400': '-', '1600': 'Review balance', '1800': 'Close shift' } },
        { label: 'Urine output', values: { '0800': 'Record', '1000': '-', '1200': 'Record', '1400': '-', '1600': 'Record', '1800': 'Total' } },
        { label: 'Stool / ostomy', values: { '0800': 'Assess', '1000': '-', '1200': 'Record if present', '1400': '-', '1600': '-', '1800': 'Handoff' } },
        { label: 'Mobility assistance', values: { '0800': 'Plan', '1000': 'Assist activity', '1200': 'Position', '1400': 'Ambulate if safe', '1600': 'Reposition', '1800': 'Handoff' } }
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
          codeStatus: this.maskClinical('Full Resuscitation'),
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
        codeStatus: this.maskClinical(patient.codeStatus || patient.code || 'Full Resuscitation'),
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
    },
    currentEncounterId() {
      return this.activePatientId ? `${this.activePatientId}-encounter-1` : ''
    },
    currentAdmissionId() {
      return this.activePatientId ? `${this.activePatientId}-admission-1` : ''
    }
  },
  watch: {
    currentRole(newRole, oldRole) {
      this.normalizeVisibleSelection()
      if (newRole !== oldRole) this.applyRoleDefaultTab()
    },
    visibleChartTabs: 'normalizeVisibleSelection',
    visibleNavigatorTabs: 'normalizeVisibleSelection',
    patientId(newId) {
      if (this.patientScoped) this.registerOpenChart(newId)
      this.selectedNoteId = null
      this.amendingNoteId = null
      this.loadAvatarPlacements()
    }
  },
  mounted() {
    this.$store.commit('clinical/LOAD_FROM_STORAGE')
    if (this.$store.hasModule && this.$store.hasModule('nursing')) {
      this.$store.commit('nursing/LOAD_FROM_STORAGE')
    }
    this.loadLayoutPreferences()
    this.normalizeVisibleSelection()
    this.applyRoleDefaultTab()
    if (this.patientScoped) {
      this.loadOpenPatientTabs()
      this.registerOpenChart(this.activePatientId)
    }
    this.loadAvatarPlacements()
    if (process.client) {
      this.updateViewportBreakpoints()
      window.addEventListener('resize', this.updateViewportBreakpoints)
    }
  },
  beforeDestroy() {
    if (process.client) window.removeEventListener('resize', this.updateViewportBreakpoints)
  },
  methods: {
    avatarStorageKey() {
      return `camero_patient_avatar_placements_${this.activePatientId || 'demo'}`
    },
    loadAvatarPlacements() {
      const storeMarkers = (this.$store.getters['nursing/getBodyMapMarkers'] || [])
        .filter(item => item.patientId === this.activePatientId && item.source === 'avatar' && !['resolved', 'removed'].includes(String(item.status || '').toLowerCase()))
      if (storeMarkers.length) {
        this.avatarPlacements = storeMarkers.map(this.normalizeAvatarPlacement)
        this.avatarPlacementSequence = this.avatarPlacements.length
        if (process.client) this.persistAvatarPlacements()
        return
      }
      if (!process.client) return
      try {
        const raw = window.localStorage.getItem(this.avatarStorageKey())
        const records = raw ? JSON.parse(raw) : []
        this.avatarPlacements = Array.isArray(records) ? records : []
        this.avatarPlacementSequence = this.avatarPlacements.length
      } catch (e) {
        this.avatarPlacements = []
      }
    },
    persistAvatarPlacements() {
      if (!process.client) return
      window.localStorage.setItem(this.avatarStorageKey(), JSON.stringify(this.avatarPlacements))
    },
    normalizeAvatarPlacement(item) {
      const tool = this.avatarPlacementTools.find(tool => tool.key === item.type) || {}
      return {
        ...item,
        label: item.label || tool.label || 'Mapped item',
        icon: item.icon || tool.icon || 'mdi-map-marker-radius',
        color: item.color || tool.color || '#0f766e',
        x: Number(item.x) || 50,
        y: Number(item.y) || 50,
        view: item.view || 'front',
        status: item.status || tool.defaultStatus || 'Active'
      }
    },
    selectAvatarTool(key) {
      this.selectedAvatarTool = this.selectedAvatarTool === key ? '' : key
    },
    startAvatarToolDrag(event, key) {
      this.selectedAvatarTool = key
      if (event && event.dataTransfer) {
        event.dataTransfer.setData('text/plain', key)
        event.dataTransfer.effectAllowed = 'copy'
      }
    },
    handleAvatarDrop(event) {
      const key = event && event.dataTransfer ? event.dataTransfer.getData('text/plain') : this.selectedAvatarTool
      this.placeAvatarItemFromEvent(event, key)
    },
    handleAvatarCanvasClick(event) {
      if (!this.selectedAvatarTool) return
      const blocked = event.target && event.target.closest && event.target.closest('.body-zone, .avatar-sticker')
      if (blocked) return
      this.placeAvatarItemFromEvent(event, this.selectedAvatarTool)
    },
    placeAvatarItemFromEvent(event, key) {
      const tool = this.avatarPlacementTools.find(item => item.key === key)
      const figure = this.$refs.avatarBodyFigure
      if (!tool || !figure || !event) return
      const rect = figure.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))
      const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))
      const placement = this.buildAvatarPlacement(tool, x, y)
      this.avatarPlacements = [...this.avatarPlacements, placement]
      this.persistAvatarPlacements()
      this.openAvatarPlacement(placement)
    },
    buildAvatarPlacement(tool, x, y) {
      const roundedX = Math.round(x)
      const roundedY = Math.round(y)
      const now = new Date().toISOString()
      this.avatarPlacementSequence += 1
      return {
        id: `avatar-${Date.now()}-${this.avatarPlacementSequence}`,
        type: tool.key,
        label: tool.label,
        icon: tool.icon,
        color: tool.color,
        status: tool.defaultStatus || 'Active',
        region: this.detectAvatarRegion(roundedX, roundedY),
        view: this.avatarView,
        anatomy: this.avatarAnatomy,
        x: roundedX,
        y: roundedY,
        source: 'avatar',
        relatedClinicalId: '',
        relatedClinicalType: tool.key === 'wound' ? 'wound' : 'device',
        siteCare: this.defaultAvatarSiteCare(tool.key),
        dressing: '',
        notes: '',
        createdAt: now,
        updatedAt: now
      }
    },
    detectAvatarRegion(x, y) {
      const side = x < 42 ? 'left' : (x > 58 ? 'right' : 'midline')
      if (y <= 18) return this.avatarView === 'back' ? 'posterior head / occiput' : 'head / face'
      if (y <= 30) return 'neck'
      if (this.avatarView === 'front' && this.avatarAnatomy === 'female' && y <= 45 && x >= 32 && x <= 68) {
        return side === 'left' ? 'left breast / chest' : (side === 'right' ? 'right breast / chest' : 'sternal chest')
      }
      if (y <= 47) return this.avatarView === 'back' ? `${side} upper back / scapula` : `${side} chest`
      if (y <= 63) return this.avatarView === 'back' ? 'lower back / flank' : 'abdomen'
      if (y <= 72) return this.avatarView === 'back' ? 'sacrum / gluteal area' : 'pelvis / groin'
      if (x <= 25 && y <= 68) return 'left arm / hand'
      if (x >= 75 && y <= 68) return 'right arm / hand'
      if (x < 50) return this.avatarView === 'back' ? 'left posterior leg / heel' : 'left leg / foot'
      return this.avatarView === 'back' ? 'right posterior leg / heel' : 'right leg / foot'
    },
    defaultAvatarSiteCare(type) {
      const defaults = {
        wound: 'Measure, photo, drainage, wound bed and dressing status.',
        trach: 'Airway patent, ties secure, stoma clean, suction need assessed.',
        iv: 'Assess patency, redness, swelling, pain, dressing date and infusion compatibility.',
        foley: 'Assess securement, urine color/output, dependent drainage and infection risk.',
        drain: 'Assess output amount/color, suction, insertion site and securement.',
        ostomy: 'Assess stoma color, peristomal skin, output and appliance seal.',
        pain: 'Document pain score, intervention and reassessment time.'
      }
      return defaults[type] || 'Assess and document site.'
    },
    avatarPlacementStyle(item) {
      return {
        left: `${item.x}%`,
        top: `${item.y}%`,
        borderColor: item.color || '#0f766e',
        color: item.color || '#0f766e'
      }
    },
    avatarPlacementStatusClass(item) {
      const status = String(item.status || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      return status ? `status-${status}` : 'status-active'
    },
    openAvatarPlacement(item) {
      this.forms.avatarPlacement = { ...defaultDialogForms().avatarPlacement, ...item }
      this.$set(this.dialogs, 'avatarPlacement', true)
    },
    closeAvatarPlacementDialog() {
      this.$set(this.dialogs, 'avatarPlacement', false)
    },
    async removeAvatarPlacement(id) {
      const existing = (this.$store.getters['nursing/getBodyMapMarkers'] || []).find(item => item.id === id)
      if (existing) {
        await this.$store.dispatch('nursing/updateBodyMapMarker', {
          ...existing,
          status: 'Removed',
          removedAt: new Date().toISOString()
        })
      }
      this.avatarPlacements = this.avatarPlacements.filter(item => item.id !== id)
      this.persistAvatarPlacements()
      this.closeAvatarPlacementDialog()
      this.toastSuccess('Avatar location removed.')
    },
    async saveAvatarPlacement() {
      const form = { ...this.forms.avatarPlacement, updatedAt: new Date().toISOString() }
      const tool = this.avatarPlacementTools.find(item => item.key === form.type)
      if (tool) {
        form.label = tool.label
        form.icon = tool.icon
        form.color = tool.color
      }
      const shouldRemoveFromAvatar = ['resolved', 'removed'].includes(String(form.status || '').toLowerCase())
      this.savingDialog = true
      try {
        const previousPlacementId = form.id
        let markerRecord = null
        const markerPayload = {
          ...form,
          source: 'avatar',
          patientId: this.activePatientId,
          markerType: form.type,
          anatomicalLocation: form.region
        }
        if (form.id && (this.$store.getters['nursing/getBodyMapMarkers'] || []).some(item => item.id === form.id)) {
          markerRecord = await this.$store.dispatch('nursing/updateBodyMapMarker', markerPayload)
        } else {
          markerRecord = await this.$store.dispatch('nursing/createBodyMapMarker', markerPayload)
          if (markerRecord && markerRecord.id) form.id = markerRecord.id
        }
        if (form.type === 'wound') {
          const wound = await this.upsertWoundFromAvatarPlacement(form)
          if (wound && wound.id) {
            form.relatedClinicalId = wound.id
            form.relatedClinicalType = 'wound'
            await this.$store.dispatch('nursing/updateBodyMapMarker', {
              ...form,
              source: 'avatar',
              patientId: this.activePatientId,
              markerType: form.type,
              anatomicalLocation: form.region
            })
          }
        }
        if (shouldRemoveFromAvatar) {
          this.avatarPlacements = this.avatarPlacements.filter(item => item.id !== form.id && item.id !== previousPlacementId)
        } else {
          const exists = this.avatarPlacements.some(item => item.id === form.id || item.id === previousPlacementId)
          this.avatarPlacements = exists
            ? this.avatarPlacements.map(item => (item.id === form.id || item.id === previousPlacementId) ? form : item)
            : [...this.avatarPlacements, form]
        }
        this.persistAvatarPlacements()
        await this.$store.dispatch('clinical/createTask', {
          patientId: this.activePatientId,
          relatedType: `avatar-${form.type}`,
          relatedId: form.id,
          title: `${form.label} mapped: ${form.region}`,
          assignedToRole: form.type === 'trach' ? 'NURSE' : 'NURSE',
          priority: /Escalate|Needs/.test(form.status || '') ? 'Today' : 'Routine',
          actionReason: `${form.label} on ${form.region} (${form.view}). ${form.siteCare || ''} ${form.dressing || ''} ${form.notes || ''}`.trim()
        })
        await this.$store.dispatch('clinical/addNursingNote', {
          patientId: this.activePatientId,
          recordedBy: this.actorName(),
          recordedAt: form.updatedAt,
          actions: [`Avatar ${form.label} mapping`],
          observation: `${form.label} located at ${form.region} (${form.view}). Status: ${form.status}. ${form.notes || ''}`,
          response: form.siteCare || 'Continue site monitoring.',
          orientation: form.dressing || ''
        })
        this.closeAvatarPlacementDialog()
        this.toastSuccess(shouldRemoveFromAvatar ? `${form.label} removed from avatar.` : `${form.label} location saved.`)
      } catch (e) {
        this.toastError('Unable to file avatar location note.')
      } finally {
        this.savingDialog = false
      }
    },
    async upsertWoundFromAvatarPlacement(form) {
      const status = String(form.status || '').toLowerCase()
      if (form.relatedClinicalId) {
        const existing = this.patientWounds.find(wound => wound.id === form.relatedClinicalId)
        if (existing) {
          return this.$store.dispatch('nursing/updateWound', {
            ...existing,
            status: status === 'resolved' ? 'healed' : (status === 'removed' ? 'closed' : existing.status || 'active'),
            anatomicalLocation: form.region || existing.anatomicalLocation,
            avatarMarkerId: form.id,
            updatedBy: this.actorName()
          })
        }
      }
      if (status === 'resolved' || status === 'removed') return null
      return this.$store.dispatch('nursing/createWound', {
        patientId: this.activePatientId,
        woundType: form.siteCare && !/^Measure,/.test(form.siteCare) ? form.siteCare : 'Wound from avatar',
        anatomicalLocation: form.region,
        acquiredLocation: 'unknown',
        status: 'active',
        avatarMarkerId: form.id,
        source: 'avatar'
      })
    },
    navigatorSectionStatus(section) {
      const key = String(section && section.key ? section.key : section || '').toLowerCase()
      const hasVitals = Boolean(this.latestVitalsSummary)
      const hasNotes = Boolean(this.latestNursingNote || this.signableNotes.length)
      const hasOrders = Boolean(this.patientLabOrders.length || this.patientImagingOrders.length || this.patientMedications.length)
      const hasDischargeDoc = this.patientDocuments.some(doc => /discharge|sortie|avs|after visit/i.test(`${doc.title || ''} ${doc.category || ''}`))
      if (/vital|pain|gcs|delirium|sepsis/.test(key)) return hasVitals ? { status: 'complete', label: 'filed' } : { status: 'due', label: 'due' }
      if (/order|release|signed|med|mar|reconciliation/.test(key)) return hasOrders ? { status: 'active', label: 'active' } : { status: 'complete', label: 'clear' }
      if (/discharge|after-visit|family|home|dme|belonging|lda|instruction/.test(key)) return hasDischargeDoc ? { status: 'active', label: 'started' } : { status: 'warning', label: 'prep' }
      if (/specimen|diagnostic|xray|lab/.test(key)) return (this.patientLabOrders.length || this.patientImagingOrders.length) ? { status: 'active', label: 'active' } : { status: 'complete', label: 'clear' }
      if (/handoff|note|documentation|notification/.test(key)) return hasNotes ? { status: 'complete', label: 'filed' } : { status: 'warning', label: 'open' }
      if (/fall|safety|comfort|hygiene|mobility|intake|head|iv|skin|wound/.test(key)) return { status: 'active', label: 'round' }
      return { status: 'neutral', label: 'open' }
    },
    openAvatarAction(action) {
      const target = String(action || '').toLowerCase()
      if (target === 'wound') {
        this.dialogs.woundCare = true
        return
      }
      this.openCommandAction(target || 'body')
    },
    applyRoleDefaultTab() {
      const adminLike = ADMIN_LIKE_ROLES.includes(this.currentRole)
      if (adminLike && this.selectedChartTab === 'Summary' && this.visibleChartTabs.includes('Chart Review')) {
        this.selectChartTab('Chart Review')
      }
    },
    loadLayoutPreferences() {
      if (!process.client) return
      try {
        const raw = window.localStorage.getItem('camero_health_patient360Layout')
        if (!raw) return
        const saved = JSON.parse(raw)
        if (typeof saved.leftPanelCollapsed === 'boolean') this.leftPanelCollapsed = saved.leftPanelCollapsed
        if (saved.rightPanelOverride === null || typeof saved.rightPanelOverride === 'boolean') {
          this.rightPanelOverride = saved.rightPanelOverride
        }
      } catch (e) {
        // ignore malformed/legacy layout preferences
      }
      this.loadChartTabPreferences()
    },
    persistLayoutPreferences() {
      if (!process.client) return
      window.localStorage.setItem('camero_health_patient360Layout', JSON.stringify({
        leftPanelCollapsed: this.leftPanelCollapsed,
        rightPanelOverride: this.rightPanelOverride
      }))
    },
    loadChartTabPreferences() {
      if (!process.client) return
      try {
        const raw = window.localStorage.getItem(CHART_TAB_LAYOUT_KEY)
        if (!raw) return
        const saved = JSON.parse(raw)
        if (Array.isArray(saved.order)) this.chartTabPreferences.order = saved.order.filter(tab => ALL_CLINICAL_TABS.includes(tab))
        if (Array.isArray(saved.hidden)) this.chartTabPreferences.hidden = saved.hidden.filter(tab => ALL_CLINICAL_TABS.includes(tab))
      } catch (e) {
        // ignore malformed tab preferences
      }
    },
    persistChartTabPreferences() {
      if (!process.client) return
      window.localStorage.setItem(CHART_TAB_LAYOUT_KEY, JSON.stringify(this.chartTabPreferences))
    },
    setChartTabVisibility(tab, visible) {
      const hidden = new Set(this.chartTabPreferences.hidden)
      if (visible) hidden.delete(tab)
      else hidden.add(tab)
      this.chartTabPreferences.hidden = Array.from(hidden)
      this.persistChartTabPreferences()
      this.normalizeVisibleSelection()
    },
    moveChartTab(tab, direction) {
      const visible = this.visibleChartTabs.slice()
      const index = visible.indexOf(tab)
      if (index < 0) return
      const target = index + direction
      if (target < 0 || target >= visible.length) return
      const reordered = visible.slice()
      const [item] = reordered.splice(index, 1)
      reordered.splice(target, 0, item)
      this.chartTabPreferences.order = reordered
      this.persistChartTabPreferences()
    },
    resetChartTabPreferences() {
      this.chartTabPreferences = { order: [], hidden: [] }
      this.persistChartTabPreferences()
      this.normalizeVisibleSelection()
    },
    toggleLeftPanel() {
      this.leftPanelCollapsed = !this.leftPanelCollapsed
      this.persistLayoutPreferences()
    },
    toggleRightPanel() {
      this.rightPanelOverride = !this.rightPanelCollapsed
      this.persistLayoutPreferences()
    },
    closePatientChart() {
      this.$router.push('/clinical/patients')
    },
    loadOpenPatientTabs() {
      if (!process.client) return
      try {
        const raw = window.sessionStorage.getItem('camero_health_openPatientTabs')
        if (!raw) return
        const saved = JSON.parse(raw)
        if (Array.isArray(saved)) {
          this.openPatientTabs = saved.filter(item => item && item.id && item.shortName)
        }
      } catch (e) {
        // ignore malformed session data
      }
    },
    persistOpenPatientTabs() {
      if (!process.client) return
      window.sessionStorage.setItem('camero_health_openPatientTabs', JSON.stringify(this.openPatientTabs))
    },
    registerOpenChart(id) {
      if (!id || this.openPatientTabs.some(tab => tab.id === id)) return
      const patient = this.findPatientRecord(id)
      const shortName = patient
        ? patient.displayName || patient.name || `${patient.lastName || 'Patient'}, ${patient.firstName || ''}`.trim()
        : id
      this.openPatientTabs.push({ id, shortName })
      if (this.openPatientTabs.length > 8) this.openPatientTabs.shift()
      this.persistOpenPatientTabs()
    },
    selectOpenChart(chart) {
      if (this.patientScoped) {
        if (chart.id !== this.activePatientId) this.$router.push('/clinical/patients/' + chart.id)
      } else {
        this.activeChartId = chart.id
      }
    },
    closeOpenChart(chart) {
      const index = this.openPatientTabs.findIndex(tab => tab.id === chart.id)
      if (index === -1) return
      const wasActive = chart.id === this.activePatientId
      this.openPatientTabs.splice(index, 1)
      this.persistOpenPatientTabs()
      if (wasActive) {
        const next = this.openPatientTabs[index] || this.openPatientTabs[index - 1]
        this.$router.push(next ? '/clinical/patients/' + next.id : '/clinical/patients')
      }
    },
    updateViewportBreakpoints() {
      this.isNarrowRight = window.innerWidth <= 1280
      this.isNarrowBoth = window.innerWidth <= 920
    },
    buildClinicalAiContext() {
      const patient = this.activePatient || {}
      return {
        role: this.currentRole,
        patient: {
          age: patient.age || '',
          gender: patient.gender || '',
          patientClass: patient.patientClass || patient.patientStatus || '',
          isolation: patient.isolation || patient.infectionStatus || ''
        },
        latestVitals: this.latestVitals || null,
        latestVitalsSummary: this.latestVitalsSummary || '',
        latestNursingNoteSummary: this.latestNursingNote
          ? [this.latestNursingNote.observation, this.latestNursingNote.response, this.latestNursingNote.actions].filter(Boolean).join(' | ')
          : '',
        openTasks: this.patientTasks.map(task => ({
          title: task.title || task.label || 'Care task',
          priority: task.priority || '',
          status: task.status || '',
          owner: task.assignedToRole || ''
        })),
        medications: this.patientMedications.map(med => ({
          name: med.drug || med.medication || med.name || 'Medication',
          route: med.route || '',
          schedule: med.schedule || med.frequency || '',
          status: med.status || ''
        })),
        diagnostics: {
          labOrders: this.patientLabOrders.length,
          imagingOrders: this.patientImagingOrders.length
        },
        wound: {
          status: patient.woundStatus || patient.problem || '',
          due: Boolean(patient.woundStatus || /wound|skin/i.test(`${patient.problem || ''} ${patient.alert || ''}`))
        },
        schedule: this.flowsheetScheduleSlots.map(slot => ({
          time: slot.time,
          label: slot.label,
          owner: slot.owner,
          status: slot.status
        }))
      }
    },
    async refreshAiCarePlan() {
      this.aiCareLoading = true
      this.aiCareError = ''
      try {
        const response = await fetch('/api/clinical/ai-care-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({ context: this.buildClinicalAiContext() })
        })
        const contentType = response.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) {
          throw new Error('AI endpoint did not return JSON.')
        }
        const payload = await response.json()
        if (!response.ok || !payload.ok || !payload.plan) {
          throw new Error(payload.message || 'Unable to generate ChatGPT care plan.')
        }
        this.remoteAiCarePlan = payload.plan
        this.toastSuccess(`ChatGPT care plan ready (${payload.model || 'OpenAI'}).`)
      } catch (error) {
        this.aiCareError = 'ChatGPT indisponible: le moteur local reste actif.'
        this.remoteAiCarePlan = null
        this.toastError(this.aiCareError)
      } finally {
        this.aiCareLoading = false
      }
    },
    selectNavigator(key) {
      this.selectedChartTab = 'Navigators'
      this.setNavigatorContext(key)
    },
    setNavigatorContext(key) {
      this.selectedNavigator = key
      const nav = this.navigatorTabs.find(item => item.key === key)
      const first = nav && nav.sections && nav.sections[0]
      this.selectedNavigatorSection = first ? (typeof first === 'string' ? first : first.key) : ''
    },
    normalizeOrderKind(kind) {
      const value = String(kind || '').toLowerCase()
      if (value.includes('lab')) return 'lab'
      if (value.includes('imag') || value.includes('radio')) return 'imaging'
      if (value.includes('med') || value.includes('pill')) return 'medication'
      if (value.includes('wound')) return 'wound'
      return 'nursing'
    },
    openCommandAction(action) {
      const target = String(action || '').toLowerCase()
      if (target === 'nurse') {
        this.openChartDialog('nurse')
        return
      }
      if (target === 'body') {
        this.showBodyAssessmentDialog = true
        return
      }
      if (target === 'flowsheet') {
        this.openTimedCareDialogFromNavigator()
        return
      }
      if (target === 'medical') {
        this.openChartDialog('medical')
        return
      }
      if (target === 'orders') {
        this.selectedChartTab = this.visibleChartTabs.includes('Orders') ? 'Orders' : 'Navigators'
        return
      }
      if (target === 'admission') {
        this.openNavigatorDocumentPreset({
          title: 'Admission assessment',
          category: 'Clinical Note',
          content: [
            'Admission reason:',
            'Chief complaint:',
            'Initial findings:',
            'Allergies reviewed:',
            'Medication reconciliation:',
            'Admission problems:',
            'Plan on arrival:'
          ].join('\n')
        })
        return
      }
      if (target === 'transfer') {
        this.openNavigatorDocumentPreset({
          title: 'Transfer packet',
          category: 'Clinical Note',
          content: [
            'Transfer reason:',
            'Destination:',
            'Pre-transfer checklist:',
            'Lines / drains / devices:',
            'Escort / transport mode:',
            'Vitals before transfer:',
            'Return handoff plan:'
          ].join('\n')
        })
        return
      }
      if (target === 'discharge') {
        this.openNavigatorDocumentPreset({
          title: 'Discharge summary',
          category: 'Discharge Summary',
          content: [
            'Complaint on arrival:',
            'Clinical findings:',
            'Diagnosis:',
            'Lab tests requested/results:',
            'Drugs prescribed:',
            'Hospital course / evolution:',
            'Outcome:',
            'Length of stay:',
            'Follow-up / return precautions:'
          ].join('\n')
        })
        return
      }
      if (target === 'document') {
        this.openChartDialog('document')
        return
      }
      if (target === 'education') {
        this.selectedChartTab = this.visibleChartTabs.includes('Education') ? 'Education' : 'Care Plan'
        return
      }
      if (target === 'care-plan') {
        this.selectedChartTab = this.visibleChartTabs.includes('Care Plan') ? 'Care Plan' : 'Notes'
        return
      }
      if (target === 'transfer') {
        this.selectedChartTab = this.visibleChartTabs.includes('Navigators') ? 'Navigators' : 'Summary'
        if (this.visibleChartTabs.includes('Navigators')) this.selectNavigator('transfer')
        return
      }
      if (target === 'lab') {
        this.openOrderComposer('lab')
        return
      }
      if (target === 'medication') {
        if (this.patientMedications.length && this.visibleChartTabs.includes('MAR')) this.selectedChartTab = 'MAR'
        else this.openChartDialog('medication')
        return
      }
      if (target === 'registration') {
        this.selectedChartTab = this.visibleChartTabs.includes('Registration') ? 'Registration' : 'Summary'
        this.setNavigatorContext('admission')
        return
      }
      if (target === 'worklist') {
        this.selectedChartTab = this.visibleChartTabs.includes('Work List') ? 'Work List' : 'Navigators'
        if (this.visibleNavigatorTabs.some(item => item.key === 'worklist')) this.setNavigatorContext('worklist')
        return
      }
      if (target === 'maternity') {
        this.selectedChartTab = this.visibleChartTabs.includes('Care Plan') ? 'Care Plan' : 'Notes'
        this.forms.document = defaultDialogForms().document
        this.forms.document.title = 'Maternal / newborn care note'
        this.forms.document.category = 'Clinical Note'
        this.forms.document.content = 'Document maternal, newborn, labor or postpartum findings when applicable.'
        this.openChartDialog('document')
        return
      }
      if (target === 'social') {
        this.selectedChartTab = this.visibleChartTabs.includes('Navigators') ? 'Navigators' : 'Summary'
        if (this.visibleChartTabs.includes('Navigators')) this.selectNavigator('sdoh')
        return
      }
      if (target === 'discharge') {
        this.selectedChartTab = this.visibleChartTabs.includes('Navigators') ? 'Navigators' : 'Care Plan'
        if (this.visibleChartTabs.includes('Navigators')) this.selectNavigator('discharge')
        return
      }
      if (target === 'notes') {
        this.selectedChartTab = this.visibleChartTabs.includes('Notes') ? 'Notes' : 'Summary'
        return
      }
      if (target === 'handoff') {
        this.noteDialogConfig = {
          noteType: 'progress_note',
          dialogTitle: 'Shift handoff / caregiver summary',
          existingNote: null
        }
        this.dialogs.note = true
        return
      }
      this.selectedChartTab = 'EMR Command Center'
    },
    openNavigatorDocumentPreset(preset) {
      this.forms.document = {
        ...defaultDialogForms().document,
        ...preset
      }
      this.openChartDialog('document')
    },
    timedCarePresetForContext() {
      const sectionKey = this.activeNavigatorSectionMeta && this.activeNavigatorSectionMeta.key ? String(this.activeNavigatorSectionMeta.key).toLowerCase() : ''
      const map = {
        'vital-signs': {
          templateKey: 'routine',
          templateId: 'timed-care',
          carePerformed: 'Vitals and bedside assessment completed',
          frequency: 'Per scheduled round',
          patientResponse: 'Patient tolerated assessment.',
          abnormalFindings: 'None reported',
          carePlanFocus: 'Vital signs, pain and general stability',
          educationGiven: 'Explain vitals schedule and report warning signs.',
          nextDue: 'Reassess per unit schedule and handoff changes.'
        },
        pain: {
          templateKey: 'routine',
          templateId: 'timed-care',
          carePerformed: 'Pain reassessment completed',
          frequency: 'Per pain round / after intervention',
          patientResponse: 'Pain response documented.',
          abnormalFindings: 'Escalate if persistent severe pain or new symptoms.',
          carePlanFocus: 'Pain control and comfort',
          educationGiven: 'Explain pain plan and when to call staff.',
          nextDue: 'Reassess after intervention and document response.'
        },
        'head-to-toe': {
          templateKey: 'routine',
          templateId: 'timed-care',
          carePerformed: 'Head-to-toe assessment completed',
          frequency: 'Per shift',
          patientResponse: 'Assessment tolerated.',
          abnormalFindings: 'Document any abnormal body system finding.',
          carePlanFocus: 'Whole-body assessment and risks',
          educationGiven: 'Explain care plan and safety instructions.',
          nextDue: 'Continue shift rounds and escalate changes.'
        },
        'iv-assessment': {
          templateKey: 'routine',
          templateId: 'timed-care',
          carePerformed: 'IV site checked and documented',
          frequency: 'Per IV round',
          patientResponse: 'IV site tolerated.',
          abnormalFindings: 'Redness, pain, swelling or infiltration.',
          carePlanFocus: 'Line patency and infection prevention',
          educationGiven: 'Explain line care and report pain/swelling.',
          nextDue: 'Reassess line at next round.'
        },
        'intake-output': {
          templateKey: 'routine',
          templateId: 'timed-care',
          carePerformed: 'Intake and output documented',
          frequency: 'Per shift',
          patientResponse: 'Intake/output discussed with patient or caregiver.',
          abnormalFindings: 'Low output, vomiting, diarrhea or poor intake.',
          carePlanFocus: 'Hydration and elimination monitoring',
          educationGiven: 'Teach hydration and output reporting.',
          nextDue: 'Continue I/O monitoring.'
        },
        sepsis: {
          templateKey: 'routine',
          templateId: 'timed-care',
          carePerformed: 'Sepsis screen performed',
          frequency: 'Per trigger / per shift',
          patientResponse: 'Screen reviewed.',
          abnormalFindings: 'Fever, tachycardia, hypotension or worsening condition.',
          carePlanFocus: 'Early detection and escalation',
          educationGiven: 'Explain need to report fever, shivering or worsening symptoms.',
          nextDue: 'Escalate abnormal screen immediately.'
        },
        'rounds-safety': {
          templateKey: 'cna',
          templateId: 'timed-care',
          carePerformed: 'Safety and comfort round completed',
          frequency: 'Every round',
          patientResponse: 'Comfort and safety needs addressed.',
          abnormalFindings: 'Falls, alarm issues, confusion or environmental hazards.',
          carePlanFocus: 'Safety, dignity and prevention',
          educationGiven: 'Explain call-bell use and fall precautions.',
          nextDue: 'Continue safety rounds.'
        },
        comfort: {
          templateKey: 'cna',
          templateId: 'timed-care',
          carePerformed: 'Comfort and hygiene care completed',
          frequency: 'Per round',
          patientResponse: 'Comfort improved after care.',
          abnormalFindings: 'Pain, pressure injury risk or refusal.',
          carePlanFocus: 'Comfort, hygiene and pressure protection',
          educationGiven: 'Teach family support and hygiene expectations.',
          nextDue: 'Repeat comfort round.'
        },
        mobility: {
          templateKey: 'routine',
          templateId: 'timed-care',
          carePerformed: 'Mobility and assistance level documented',
          frequency: 'Per shift / mobilization event',
          patientResponse: 'Mobility tolerated.',
          abnormalFindings: 'Weakness, dizziness or unsafe transfer.',
          carePlanFocus: 'Mobility and fall prevention',
          educationGiven: 'Explain safe mobilization and ask for assistance.',
          nextDue: 'Reassess with next mobilization.'
        },
        'care-plans': {
          templateKey: 'discharge',
          templateId: 'timed-care',
          carePerformed: 'Care plan progress reviewed',
          frequency: 'Per care planning round',
          patientResponse: 'Goals discussed with patient and team.',
          abnormalFindings: 'Unmet goals or unresolved barriers.',
          carePlanFocus: 'Care plan progress and barriers',
          educationGiven: 'Review goals and teach-back.',
          nextDue: 'Update care plan at next review.'
        },
        'expected-discharge': {
          templateKey: 'discharge',
          templateId: 'timed-care',
          carePerformed: 'Discharge readiness reviewed',
          frequency: 'Daily until discharge',
          patientResponse: 'Patient/family updated on plan.',
          abnormalFindings: 'Transport, pharmacy, payment or home barrier.',
          carePlanFocus: 'Discharge readiness and continuity',
          educationGiven: 'Review meds, follow-up, danger signs and paperwork.',
          nextDue: 'Confirm discharge barriers and resolve.'
        },
        'discharge-info': {
          templateKey: 'discharge',
          templateId: 'timed-care',
          carePerformed: 'Discharge instructions filed',
          frequency: 'Before discharge',
          patientResponse: 'Patient/family received instructions.',
          abnormalFindings: 'Missing documents or pending signatures.',
          carePlanFocus: 'Discharge packet completion',
          educationGiven: 'Teach medications, wound care, follow-up and return precautions.',
          nextDue: 'Verify all discharge documents are complete.'
        }
      }
      return map[sectionKey] || map['vital-signs']
    },
    openTimedCareDialogFromNavigator() {
      this.timedCareDialogPreset = this.timedCarePresetForContext()
      this.dialogs.timedCare = true
      this.selectedChartTab = this.visibleChartTabs.includes('Flowsheets') ? 'Flowsheets' : 'Nurse Command Center'
    },
    async handleTimedCareSave(payload) {
      try {
        await this.$store.dispatch('flowsheets/documentTimedCare', {
          patientId: this.activePatientId,
          encounterId: this.currentEncounterId,
          admissionId: this.currentAdmissionId,
          ...payload
        })
        this.selectedChartTab = this.visibleChartTabs.includes('Flowsheets') ? 'Flowsheets' : this.selectedChartTab
        this.toastSuccess('Timed care entry filed.')
      } catch (e) {
        this.toastError('Unable to file timed care entry.')
      } finally {
        this.dialogs.timedCare = false
        this.timedCareDialogPreset = null
      }
    },
    orderStatusClass(status) {
      const value = String(status || '').toLowerCase()
      if (/hold|held/.test(value)) return 'held'
      if (/discontinued|cancelled|cancel/.test(value)) return 'stopped'
      if (/requested|pending|due/.test(value)) return 'pending'
      if (/completed|done|given|active|started/.test(value)) return 'active'
      return 'neutral'
    },
    openOrderComposer(kind, order) {
      const normalized = this.normalizeOrderKind(kind)
      if (normalized === 'lab') {
        this.openChartDialog('lab')
        if (order && order.raw) {
          this.forms.order.lab.testName = order.raw.test || order.raw.testName || order.label || ''
          this.forms.order.lab.priority = order.raw.priority || 'Routine'
          this.forms.order.instructions = order.raw.instructions || order.detail || ''
        }
        return
      }
      if (normalized === 'imaging') {
        this.openChartDialog('imaging')
        if (order && order.raw) {
          this.forms.order.imaging.modality = order.raw.exam || order.raw.modality || order.raw.study || order.label || ''
          this.forms.order.imaging.priority = order.raw.priority || 'Routine'
          this.forms.order.instructions = order.raw.instructions || order.detail || ''
        }
        return
      }
      if (normalized === 'medication') {
        this.openChartDialog('medication')
        if (order && order.raw) {
          this.forms.order.medication.medication = order.raw.drug || order.raw.medication || order.raw.name || order.label || ''
          this.forms.order.medication.dosage = order.raw.dose || order.raw.dosage || ''
          this.forms.order.medication.route = order.raw.route || 'Oral'
          this.forms.order.medication.frequency = order.raw.frequency || ''
          this.forms.order.instructions = order.raw.instructions || order.detail || ''
        }
        return
      }
      if (normalized === 'wound') {
        this.forms.document = defaultDialogForms().document
        this.forms.document.title = order && order.label ? `Wound care order - ${order.label}` : 'Wound care order'
        this.forms.document.category = 'Wound Photo'
        this.forms.document.content = order && order.detail ? order.detail : 'Document wound care plan, dressing task, photo requirement and reassessment.'
        this.openChartDialog('document')
        return
      }
      this.openChartDialog('nurse')
    },
    async handleOrderAction(action, order) {
      if (!order) return
      if (action === 'modify') {
        this.openOrderComposer(order.type, order)
        return
      }
      const nextStatus = action === 'hold' ? 'Hold' : 'Discontinued'
      const actionLabel = action === 'hold' ? 'Hold' : 'Discontinue'
      this.savingDialog = true
      try {
        if (order.raw && order.raw.id) {
          const nextRecord = { ...order.raw, status: nextStatus, updatedAt: new Date().toISOString(), updatedBy: this.actorName() }
          if (order.type === 'medication') await this.$store.dispatch('clinical/updateMedication', nextRecord)
          else if (order.type === 'lab') await this.$store.dispatch('clinical/updateLabOrder', nextRecord)
          else if (order.type === 'imaging') await this.$store.dispatch('clinical/updateImagingOrder', nextRecord)
        }
        await this.$store.dispatch('clinical/createTask', {
          patientId: this.activePatientId,
          relatedType: order.type,
          relatedId: order.id,
          title: `${actionLabel} order: ${order.label}`,
          assignedToRole: action === 'hold' ? 'NURSE' : 'PROVIDER',
          priority: action === 'hold' ? 'Today' : 'Routine',
          actionReason: `${actionLabel} requested from Patient 360 Orders by ${this.actorName()}`
        })
        this.toastSuccess(`${actionLabel} documented for ${order.label}.`)
      } catch (e) {
        this.toastError(`Unable to ${actionLabel.toLowerCase()} order.`)
      } finally {
        this.savingDialog = false
      }
    },
    openOrderSet(set) {
      this.orderMode = set.kind || 'Medication'
      this.openOrderComposer(this.orderMode)
    },
    openMarQuickScan() {
      const firstDue = this.visibleEmarMedicationRows.find(row => row.timeline.some(cell => cell.status === 'due')) || this.visibleEmarMedicationRows[0] || null
      if (firstDue) {
        const dueCell = firstDue.timeline.find(cell => cell.status === 'due') || firstDue.timeline.find(cell => cell.status === 'prn') || null
        this.openMarAction('given', firstDue, dueCell)
      } else {
        this.openChartDialog('medication')
      }
    },
    openMarAction(action, medication, cell) {
      if (action === 'details') {
        this.openOrderComposer('medication', medication && medication.orderItem)
        return
      }
      const normalized = String(action || 'given').toLowerCase()
      const actionMap = {
        given: 'Given',
        held: 'Held',
        refused: 'Refused',
        scan: 'Not scanned',
        education: 'Patient education'
      }
      this.selectedMarMedication = medication
      this.selectedMarAction = actionMap[normalized] || 'Given'
      this.forms.mar = {
        ...defaultDialogForms().mar,
        action: this.selectedMarAction,
        time: cell && cell.time ? cell.time : this.marTimeFocus,
        dose: medication ? medication.detail.split(' · ')[0] || '' : '',
        comment: cell && cell.text ? `eMAR cell ${cell.time}: ${cell.text}` : '',
        patientResponse: medication && this.marShowEducation ? medication.education : ''
      }
      this.$set(this.dialogs, 'marAction', true)
    },
    async saveMarAction() {
      if (!this.selectedMarMedication) return
      const form = this.$refs.marActionFormRef
      if (form && form.validate && !form.validate()) return
      this.savingDialog = true
      try {
        const now = new Date().toISOString()
        const action = this.forms.mar.action || 'Given'
        const statusMap = {
          Given: 'Given',
          Held: 'Hold',
          Refused: 'Refused',
          'Not scanned': 'Not scanned',
          'Patient education': 'Education documented',
          'Details reviewed': 'Reviewed'
        }
        if (this.selectedMarMedication.raw && this.selectedMarMedication.raw.id) {
          await this.$store.dispatch('clinical/updateMedication', {
            ...this.selectedMarMedication.raw,
            status: statusMap[action] || action,
            lastAdminTime: this.forms.mar.time,
            lastScanAt: this.forms.mar.barcode ? now : this.selectedMarMedication.raw.lastScanAt,
            administrationStatus: statusMap[action] || action,
            administrationComment: this.forms.mar.comment,
            patientResponse: this.forms.mar.patientResponse,
            updatedAt: now,
            updatedBy: this.actorName()
          })
        }
        await this.$store.dispatch('clinical/createTask', {
          patientId: this.activePatientId,
          relatedType: 'emar',
          relatedId: this.selectedMarMedication.id,
          title: `eMAR ${action}: ${this.selectedMarMedication.label}`,
          assignedToRole: 'NURSE',
          priority: action === 'Held' || action === 'Refused' ? 'Today' : 'Routine',
          actionReason: [
            `Time ${this.forms.mar.time}`,
            this.forms.mar.dose ? `Dose ${this.forms.mar.dose}` : '',
            this.forms.mar.site ? `Site ${this.forms.mar.site}` : '',
            this.forms.mar.comment || '',
            this.forms.mar.patientResponse || ''
          ].filter(Boolean).join(' | ')
        })
        this.closeChartDialog('marAction')
        this.toastSuccess(`eMAR action filed for ${this.selectedMarMedication.label}.`)
      } catch (e) {
        this.toastError('Unable to file eMAR action.')
      } finally {
        this.savingDialog = false
      }
    },
    openChartDialog(kind) {
      if (!this.activePatientId) return
      if (['lab', 'imaging', 'medication'].includes(kind)) {
        const next = defaultDialogForms().order
        if (kind === 'lab') {
          this.forms.order.lab = next.lab
          this.forms.order.instructions = ''
        }
        if (kind === 'imaging') {
          this.forms.order.imaging = next.imaging
          this.forms.order.instructions = ''
        }
        if (kind === 'medication') {
          this.forms.order.medication = next.medication
          this.forms.order.instructions = ''
        }
      }
      if (kind === 'document') {
        this.forms.document = defaultDialogForms().document
      }
      if (kind === 'medical') {
        this.forms.medical = defaultDialogForms().medical
        this.forms.medical.chiefComplaint = this.latestVisit ? this.latestVisit.chiefComplaint || '' : ''
      }
      if (kind === 'nurse') {
        this.forms.nurse = defaultDialogForms().nurse
        if (this.latestVitals) {
          this.forms.nurse.vitals = {
            ...this.forms.nurse.vitals,
            bp: this.latestVitals.bp || '',
            hr: this.latestVitals.hr || null,
            rr: this.latestVitals.rr || null,
            temp: this.latestVitals.temp || null,
            spo2: this.latestVitals.spo2 || null,
            pain: this.latestVitals.pain || 0,
            weight: this.latestVitals.weight || null,
            height: this.latestVitals.height || null
          }
        }
      }
      this.$set(this.dialogs, kind, true)
    },
    closeChartDialog(kind) {
      this.$set(this.dialogs, kind, false)
    },
    woundAssessmentsFor(woundId) {
      return this.$store.getters['nursing/woundTrend'](woundId) || []
    },
    noteTypeLabel(type) {
      const map = {
        nursing_note: 'General Nursing Note',
        wound_note: 'Wound Care Note',
        progress_note: 'Progress Note',
        incident_note: 'Incident Note',
        provider_notification: 'Provider Notification',
        discharge_note: 'Discharge Note'
      }
      return map[type] || 'Clinical Note'
    },
    openNoteMenuOption(option) {
      if (option.kind === 'legacy-nurse') {
        this.openChartDialog('nurse')
        return
      }
      if (option.kind === 'wound') {
        this.dialogs.woundCare = true
        return
      }
      if (option.kind === 'note') {
        this.noteDialogConfig = { noteType: option.noteType, dialogTitle: option.dialogTitle, existingNote: null }
        this.dialogs.note = true
      }
    },
    editSelectedNote() {
      if (!this.selectedNote) return
      this.noteDialogConfig = {
        noteType: this.selectedNote.noteType,
        dialogTitle: this.selectedNote.title,
        existingNote: this.selectedNote
      }
      this.dialogs.note = true
    },
    async signSelectedNote() {
      if (!this.selectedNoteId) return
      await this.$store.dispatch('nursing/signClinicalNote', this.selectedNoteId)
      this.toastSuccess('Note signed.')
    },
    amendSelectedNote() {
      if (!this.selectedNoteId) return
      this.amendingNoteId = this.selectedNoteId
      this.amendmentDraft = ''
    },
    async submitAmendment() {
      if (!this.amendmentDraft.trim()) return
      await this.$store.dispatch('nursing/amendClinicalNote', { id: this.amendingNoteId, amendment: this.amendmentDraft.trim() })
      this.amendingNoteId = null
      this.amendmentDraft = ''
      this.toastSuccess('Amendment recorded.')
    },
    async shareSelectedNote() {
      if (!this.selectedNoteId) return
      await this.$store.dispatch('nursing/shareClinicalNote', this.selectedNoteId)
      this.toastSuccess('Note shared with care team.')
    },
    handleNoteSaved(note) {
      this.dialogs.note = false
      if (note) this.selectedNoteId = note.id
      this.toastSuccess('Note saved.')
    },
    async handleWoundSaved(payload) {
      const status = String(payload && payload.woundStatus ? payload.woundStatus : '').toLowerCase()
      const woundId = payload && payload.woundId
      if (woundId && ['healed', 'closed'].includes(status)) {
        const markers = (this.$store.getters['nursing/getBodyMapMarkers'] || [])
          .filter(item => item.relatedClinicalId === woundId)
        await Promise.all(markers.map(marker => this.$store.dispatch('nursing/updateBodyMapMarker', {
          ...marker,
          status: 'Resolved',
          resolvedAt: new Date().toISOString()
        })))
        this.avatarPlacements = this.avatarPlacements.filter(item => item.relatedClinicalId !== woundId)
        this.persistAvatarPlacements()
      }
      this.toastSuccess('Wound assessment saved.')
    },
    handleCarePlanSaved() {
      this.toastSuccess('Care plan added.')
    },
    async signCarePlanFromCard(id) {
      await this.$store.dispatch('nursing/signCarePlan', id)
      this.toastSuccess('Care plan signed.')
    },
    async archiveCarePlanFromCard(id) {
      await this.$store.dispatch('nursing/archiveCarePlan', id)
      this.toastSuccess('Care plan archived.')
    },
    isCarePlanOverdue(plan) {
      if (!plan.targetDate) return false
      return new Date(plan.targetDate) < new Date() && plan.status !== 'archived'
    },
    toastSuccess(message) {
      if (this.$toast && this.$toast.success) this.$toast.success(message)
    },
    toastError(message) {
      if (this.$toast && this.$toast.error) this.$toast.error(message)
    },
    actorName() {
      return this.$store.state.auth.fullName || (this.$store.state.auth.user && this.$store.state.auth.user.username) || 'Clinical user'
    },
    async saveNurseEncounter() {
      const form = this.$refs.nurseFormRef
      if (form && form.validate && !form.validate()) return
      this.savingDialog = true
      try {
        const now = new Date().toISOString()
        const recordedBy = this.actorName()
        const patientId = this.activePatientId
        await this.$store.dispatch('clinical/recordVitalSigns', {
          patientId,
          recordedBy,
          recordedAt: now,
          glasgow: this.nurseGcsScore,
          ...this.forms.nurse.vitals
        })
        await this.$store.dispatch('clinical/logVisit', {
          patientId,
          encounterType: 'INFIRMIER',
          chiefComplaint: this.forms.nurse.encounter.chiefComplaint,
          historyOfIllness: this.forms.nurse.encounter.historyOfIllness,
          modeOfArrival: this.forms.nurse.encounter.modeOfArrival,
          triageLevel: this.forms.nurse.encounter.triageLevel,
          assessment: { ...this.forms.nurse.assessment },
          recordedBy,
          createdAt: now
        })
        await this.$store.dispatch('clinical/addNursingNote', {
          patientId,
          recordedBy,
          recordedAt: now,
          ...this.forms.nurse.note
        })
        const assessmentSummary = [
          this.forms.nurse.encounter.chiefComplaint ? `Chief complaint: ${this.forms.nurse.encounter.chiefComplaint}` : '',
          this.forms.nurse.note.observation ? `Observation: ${this.forms.nurse.note.observation}` : '',
          this.forms.nurse.note.response ? `Response: ${this.forms.nurse.note.response}` : ''
        ].filter(Boolean).join('\n')
        await this.$store.dispatch('nursing/createClinicalNote', {
          patientId,
          noteType: 'nursing_note',
          title: 'Nursing Assessment',
          body: assessmentSummary || 'Nursing assessment documented.',
          authorRole: this.currentRole
        })
        this.selectedChartTab = 'Notes'
        this.closeChartDialog('nurse')
        this.toastSuccess('Nursing encounter filed in Patient 360.')
      } catch (e) {
        this.toastError('Unable to file nursing encounter.')
      } finally {
        this.savingDialog = false
      }
    },
    async saveMedicalNote() {
      const form = this.$refs.medicalFormRef
      if (form && form.validate && !form.validate()) return
      this.savingDialog = true
      try {
        const now = new Date().toISOString()
        const recordedBy = this.actorName()
        const patientId = this.activePatientId
        await this.$store.dispatch('clinical/logVisit', {
          patientId,
          encounterType: 'MÉDICAL',
          chiefComplaint: this.forms.medical.chiefComplaint,
          diagnosis: this.forms.medical.diagnosis,
          severity: this.forms.medical.severity,
          recordedBy,
          createdAt: now
        })
        await this.$store.dispatch('clinical/addMedicalNote', {
          patientId,
          recordedBy,
          recordedAt: now,
          diagnosis: this.forms.medical.diagnosis,
          severity: this.forms.medical.severity,
          clinicalFindings: this.forms.medical.clinicalFindings,
          plan: this.forms.medical.plan,
          outcome: { patientInstructions: this.forms.medical.instructions },
          encounter: { chiefComplaint: this.forms.medical.chiefComplaint }
        })
        const progressSummary = [
          this.forms.medical.chiefComplaint ? `Chief complaint: ${this.forms.medical.chiefComplaint}` : '',
          this.forms.medical.clinicalFindings ? `Findings: ${this.forms.medical.clinicalFindings}` : '',
          this.forms.medical.diagnosis ? `Diagnosis: ${this.forms.medical.diagnosis} (${this.forms.medical.severity || 'unspecified severity'})` : '',
          this.forms.medical.plan ? `Plan: ${this.forms.medical.plan}` : '',
          this.forms.medical.instructions ? `Patient instructions: ${this.forms.medical.instructions}` : ''
        ].filter(Boolean).join('\n')
        await this.$store.dispatch('nursing/createClinicalNote', {
          patientId,
          noteType: 'progress_note',
          title: this.forms.medical.diagnosis ? `Progress Note - ${this.forms.medical.diagnosis}` : 'Progress Note',
          body: progressSummary || 'Progress note documented.',
          authorRole: this.currentRole
        })
        this.selectedChartTab = 'Notes'
        this.closeChartDialog('medical')
        this.toastSuccess('Medical note filed in Patient 360.')
      } catch (e) {
        this.toastError('Unable to file medical note.')
      } finally {
        this.savingDialog = false
      }
    },
    async saveLabOrder() {
      const form = this.$refs.labFormRef
      if (form && form.validate && !form.validate()) return
      this.savingDialog = true
      try {
        const patientId = this.activePatientId
        const recordedBy = this.actorName()
        const record = await this.$store.dispatch('clinical/orderLab', {
          patientId,
          testName: this.forms.order.lab.testName,
          test: this.forms.order.lab.testName,
          priority: this.forms.order.lab.priority,
          instructions: this.forms.order.instructions,
          orderedBy: recordedBy
        })
        await this.$store.dispatch('clinical/createTask', {
          patientId,
          relatedType: 'lab',
          relatedId: record.id,
          title: `Complete lab order: ${this.forms.order.lab.testName}`,
          assignedToRole: 'LAB',
          priority: this.forms.order.lab.priority || 'Routine',
          actionReason: this.forms.order.instructions || 'Created from Patient 360'
        })
        this.selectedChartTab = 'Orders'
        this.closeChartDialog('lab')
        this.toastSuccess('Lab order placed from Patient 360.')
      } catch (e) {
        this.toastError('Unable to place lab order.')
      } finally {
        this.savingDialog = false
      }
    },
    async saveImagingOrder() {
      const form = this.$refs.imagingFormRef
      if (form && form.validate && !form.validate()) return
      this.savingDialog = true
      try {
        const patientId = this.activePatientId
        const recordedBy = this.actorName()
        const record = await this.$store.dispatch('clinical/orderImaging', {
          patientId,
          modality: this.forms.order.imaging.modality,
          exam: this.forms.order.imaging.modality,
          priority: this.forms.order.imaging.priority,
          instructions: this.forms.order.instructions,
          orderedBy: recordedBy
        })
        await this.$store.dispatch('clinical/createTask', {
          patientId,
          relatedType: 'imaging',
          relatedId: record.id,
          title: `Complete imaging order: ${this.forms.order.imaging.modality}`,
          assignedToRole: 'IMAGING',
          priority: this.forms.order.imaging.priority || 'Routine',
          actionReason: this.forms.order.instructions || 'Created from Patient 360'
        })
        this.selectedChartTab = 'Orders'
        this.closeChartDialog('imaging')
        this.toastSuccess('Imaging order placed from Patient 360.')
      } catch (e) {
        this.toastError('Unable to place imaging order.')
      } finally {
        this.savingDialog = false
      }
    },
    async saveMedicationOrder() {
      const form = this.$refs.medicationFormRef
      if (form && form.validate && !form.validate()) return
      this.savingDialog = true
      try {
        const patientId = this.activePatientId
        const recordedBy = this.actorName()
        const record = await this.$store.dispatch('clinical/prescribeMedication', {
          patientId,
          medication: this.forms.order.medication.medication,
          dosage: this.forms.order.medication.dosage,
          drug: this.forms.order.medication.medication,
          dose: this.forms.order.medication.dosage,
          route: this.forms.order.medication.route,
          frequency: this.forms.order.medication.frequency,
          instructions: this.forms.order.instructions,
          prescribedBy: recordedBy
        })
        await this.$store.dispatch('clinical/createTask', {
          patientId,
          relatedType: 'medication',
          relatedId: record.id,
          title: `Administer ${this.forms.order.medication.medication}`,
          assignedToRole: 'NURSE',
          priority: 'routine',
          actionReason: this.forms.order.instructions || 'Created from Patient 360'
        })
        this.selectedChartTab = 'Medications'
        this.closeChartDialog('medication')
        this.toastSuccess('Medication order placed from Patient 360.')
      } catch (e) {
        this.toastError('Unable to place medication order.')
      } finally {
        this.savingDialog = false
      }
    },
    async saveDocumentDialog() {
      const form = this.$refs.documentFormRef
      if (form && form.validate && !form.validate()) return
      this.savingDialog = true
      try {
        await this.$store.dispatch('clinical/createDocument', {
          patientId: this.activePatientId,
          title: this.forms.document.title,
          category: this.forms.document.category,
          content: this.forms.document.content,
          status: 'Filed'
        })
        this.selectedChartTab = 'Documents'
        this.closeChartDialog('document')
        this.toastSuccess('Document filed in Patient 360.')
      } catch (e) {
        this.toastError('Unable to file document.')
      } finally {
        this.savingDialog = false
      }
    },
    selectChartTab(tab) {
      this.selectedChartTab = tab
      const navMap = {
        Summary: 'admission',
        'EMR Command Center': 'admission',
        'Nurse Command Center': 'shift',
        'Chart Review': 'shift',
        Navigators: this.selectedNavigator || 'admission',
        Avatar: 'vitals',
        Flowsheets: 'vitals',
        Orders: 'worklist',
        MAR: 'mar',
        Medications: 'medreview',
        'Lab Results': 'worklist',
        'Wound Management': 'worklist',
        Notes: 'shift',
        'Care Plan': 'discharge',
        Education: 'discharge',
        'Work List': 'worklist',
        Immunizations: 'admission',
        'Sedation/Procedure Documentation': 'transfer',
        'Care Teams': 'careteam',
        Handoff: 'worklist',
        Documents: 'admission',
        Registration: 'admission'
      }
      const next = navMap[tab]
      if (next && this.visibleNavigatorTabs.some(item => item.key === next)) {
        this.selectedNavigator = next
      }
    },
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
      if (!this.activeNavigatorSections.some(section => section.key === this.selectedNavigatorSection)) {
        this.selectedNavigatorSection = this.activeNavigatorSections[0] ? this.activeNavigatorSections[0].key : ''
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
    },
    displayEncounterType(type) {
      if (type === 'MÉDICAL' || type === 'MEDICAL') return 'Medical'
      if (type === 'INFIRMIER' || type === 'NURSING') return 'Nursing'
      return type || 'Encounter'
    },
    async handleBodyAssessmentSave(payload) {
      const selectedAreas = Array.isArray(payload.selectedAreas) ? payload.selectedAreas : []
      if (!selectedAreas.length) return
      const timestamp = payload.timestamp || new Date().toISOString()
      const severity = payload.severity || 'Routine'
      const assessmentType = payload.assessmentType || 'general'
      const elementStatus = payload.elementStatus || ''
      const notes = payload.notes || ''
      const nextAction = payload.nextAction || 'Continue nursing follow-up.'
      const priority = ['Critical', 'Urgent'].includes(severity) ? 'High' : (severity === 'Watch' ? 'Today' : 'Routine')
      const focusLabelMap = {
        general: 'General body assessment',
        wound: 'Wound assessment',
        iv: 'IV line assessment',
        trach: 'Tracheostomy assessment',
        foley: 'Foley catheter assessment',
        drain: 'Drain assessment',
        ostomy: 'Ostomy assessment',
        pain: 'Pain assessment'
      }
      const focusLabel = focusLabelMap[assessmentType] || 'Body assessment'
      const details = [
        `Focus: ${focusLabel}`,
        `Areas: ${selectedAreas.join(', ')}`,
        `Severity: ${severity}`,
        elementStatus ? `Element status: ${elementStatus}` : '',
        notes ? `Observation: ${notes}` : '',
        nextAction ? `Next: ${nextAction}` : '',
        `Completed: ${timestamp}`
      ].filter(Boolean).join(' | ')
      try {
        await this.$store.dispatch('clinical/createTask', {
          patientId: this.activePatientId,
          relatedType: assessmentType === 'general' ? 'assessment' : `assessment-${assessmentType}`,
          title: `${focusLabel} - ${selectedAreas.join(', ')}`,
          assignedToRole: 'NURSE',
          priority,
          actionReason: details
        })
        await this.$store.dispatch('clinical/addNursingNote', {
          patientId: this.activePatientId,
          recordedBy: this.actorName(),
          recordedAt: timestamp,
          actions: [focusLabel],
          observation: notes || `${focusLabel} completed for ${selectedAreas.join(', ')}.`,
          response: nextAction,
          orientation: [severity, elementStatus].filter(Boolean).join(' / ')
        })
        this.selectedChartTab = 'Nurse Command Center'
        this.toastSuccess('Body assessment saved successfully.')
      } catch (e) {
        this.toastError('Unable to save body assessment.')
      }
    }
  }
}

function defaultDialogForms() {
  return {
    nurseValid: false,
    medicalValid: false,
    orderValid: false,
    documentValid: false,
    marValid: false,
    nurse: {
      vitals: {
        bp: '',
        hr: null,
        rr: null,
        temp: null,
        spo2: null,
        glucose: null,
        weight: null,
        height: null,
        gcsE: 4,
        gcsV: 5,
        gcsM: 6,
        pain: 0
      },
      encounter: {
        chiefComplaint: '',
        historyOfIllness: '',
        modeOfArrival: 'Walk-in',
        triageLevel: 'Green'
      },
      assessment: {
        generalCondition: 'Good general condition',
        consciousness: 'Alert and oriented',
        respiratoryStatus: 'Normal',
        nursingProblems: []
      },
      note: {
        actions: [],
        observation: '',
        response: '',
        orientation: ''
      }
    },
    medical: {
      chiefComplaint: '',
      clinicalFindings: '',
      diagnosis: '',
      severity: 'Mild',
      plan: '',
      instructions: ''
    },
    order: {
      type: 'lab',
      instructions: '',
      lab: { testName: '', priority: 'Routine' },
      imaging: { modality: '', priority: 'Routine' },
      medication: { medication: '', dosage: '', route: 'Oral', frequency: '' }
    },
    mar: {
      action: 'Given',
      time: '',
      dose: '',
      site: '',
      barcode: '',
      comment: '',
      patientResponse: ''
    },
    document: {
      title: '',
      category: 'Clinical Note',
      content: ''
    },
    avatarPlacement: {
      id: '',
      type: 'wound',
      label: 'Wound',
      icon: 'mdi-bandage',
      color: '#be123c',
      status: 'Active',
      region: '',
      view: 'front',
      anatomy: 'female',
      x: 50,
      y: 50,
      siteCare: '',
      dressing: '',
      notes: '',
      createdAt: '',
      updatedAt: ''
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
.emr-workspace {
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
  display: flex;
  align-items: stretch;
  border: 1px solid #7fb5ae;
  border-bottom: 0;
  background: #dcecea;
  color: #0f3f3b;
  font-weight: 800;
}
.patient-tab.active {
  background: #f8fbfb;
}
.patient-tab-label {
  flex: 1;
  border: 0;
  background: transparent;
  color: inherit;
  font-weight: inherit;
  padding: 0 8px;
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.patient-tab-close {
  flex: 0 0 auto;
  width: 22px;
  border: 0;
  border-left: 1px solid rgba(15, 118, 110, 0.25);
  background: transparent;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.patient-tab-close:hover {
  background: #fee2e2;
  color: #7f1d1d;
}
.patient-tab-add {
  height: 27px;
  width: 27px;
  border: 1px solid #7fb5ae;
  border-bottom: 0;
  background: #dcecea;
  color: #0f3f3b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.patient-tab-label:focus-visible,
.patient-tab-close:focus-visible,
.patient-tab-add:focus-visible {
  outline: 2px solid #0f766e;
  outline-offset: -2px;
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
  grid-template-columns: var(--left-panel-width, 280px) minmax(0, 1fr) var(--right-panel-width, 320px);
  min-height: calc(100vh - 180px);
}
.chart-frame.left-collapsed {
  --left-panel-width: 64px;
}
.chart-frame.right-collapsed {
  --right-panel-width: 64px;
}
.chart-main {
  min-width: 0;
  overflow: auto;
  background: #eef5f4;
  display: flex;
  flex-direction: column;
}
.navigator-layout {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
  flex: 1;
}
.navigator-tab-strip {
  grid-column: 1 / -1;
  background: #f5fbfa;
  border-bottom: 1px solid #b7c9c6;
  display: flex;
  gap: 2px;
  min-height: 30px;
  overflow-x: auto;
  padding: 0 6px;
}
.navigator-tab-strip button {
  align-items: center;
  background: transparent;
  border: 0;
  border-right: 1px solid #d7e0df;
  color: #173b39;
  cursor: pointer;
  display: inline-flex;
  font-size: 11px;
  font-weight: 900;
  gap: 4px;
  padding: 0 10px;
  white-space: nowrap;
}
.navigator-tab-strip button.active {
  background: #fff;
  border-top: 3px solid #0f766e;
  color: #0f4f4b;
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
  border-left: 2px solid transparent;
  display: grid;
  gap: 1px;
  padding: 3px 4px 3px 7px;
  text-decoration: none;
}
.rail-group a span {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 6px;
}
.rail-group a i {
  border-radius: 999px;
  color: #475569;
  font-size: 8px;
  font-style: normal;
  font-weight: 900;
  line-height: 1;
  padding: 2px 4px;
  text-transform: uppercase;
}
.rail-group a.complete i { background: #dcfce7; color: #14532d; }
.rail-group a.active i { background: #e0f2fe; color: #075985; }
.rail-group a.warning i { background: #ffedd5; color: #9a3412; }
.rail-group a.due i { background: #fee2e2; color: #991b1b; }
.rail-group a.active {
  background: #eef6ff;
  border-left-color: #1d4ed8;
  color: #0f3b82;
  font-weight: 900;
}
.rail-group a small {
  color: #64748b;
  font-size: 9px;
  font-weight: 900;
  line-height: 1;
  text-transform: uppercase;
}
.workspace-panel {
  padding: 8px;
  overflow: auto;
  min-width: 0;
}
.navigator-focus-panel {
  background: #fff;
  border: 1px solid #b7c9c6;
  border-top: 0;
  padding: 10px;
}
.navigator-focus-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}
.navigator-focus-head span {
  color: #0f766e;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}
.navigator-focus-head strong {
  display: block;
  color: #0f172a;
  font-size: 16px;
}
.navigator-focus-head p {
  color: #475569;
  font-size: 12px;
  margin: 3px 0 0;
}
.navigator-focus-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}
.navigator-focus-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}
.navigator-focus-grid article {
  border: 1px solid #d7e0df;
  border-left: 4px solid #64748b;
  border-radius: 8px;
  min-height: 72px;
  padding: 8px;
}
.navigator-focus-grid article.complete { border-left-color: #16a34a; }
.navigator-focus-grid article.active { border-left-color: #0369a1; }
.navigator-focus-grid article.warning { border-left-color: #f97316; }
.navigator-focus-grid article.due { border-left-color: #be123c; }
.navigator-focus-grid span {
  color: #64748b;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}
.navigator-focus-grid strong {
  display: block;
  color: #134e4a;
  font-size: 13px;
}
.navigator-focus-grid small {
  color: #475569;
  display: block;
  font-size: 11px;
  margin-top: 3px;
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
.patient-summary-dashboard {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.summary-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border: 1px solid #b7d8d2;
  border-left: 5px solid #0f766e;
  background: #f8fbfb;
}
.summary-hero div:first-child {
  min-width: 0;
}
.summary-hero span,
.summary-panel header span {
  color: #0f766e;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}
.summary-hero strong {
  display: block;
  color: #0f172a;
  font-size: 17px;
  line-height: 1.25;
}
.summary-hero p {
  margin: 4px 0 0;
  color: #475569;
  font-size: 12px;
}
.summary-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}
.summary-status-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(120px, 1fr));
  gap: 8px;
}
.summary-status-card {
  display: flex;
  gap: 8px;
  min-height: 104px;
  padding: 10px;
  border: 1px solid #d7e0df;
  border-left: 4px solid #64748b;
  border-radius: 8px;
  background: #fff;
}
.summary-status-card.complete { border-left-color: #16a34a; }
.summary-status-card.active { border-left-color: #0369a1; }
.summary-status-card.warning { border-left-color: #f97316; }
.summary-status-card.due { border-left-color: #be123c; }
.summary-status-card.protected { border-left-color: #7c3aed; }
.summary-status-card span {
  color: #64748b;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}
.summary-status-card strong {
  display: block;
  margin-top: 2px;
  color: #0f172a;
  font-size: 14px;
}
.summary-status-card p {
  margin: 4px 0 0;
  color: #475569;
  font-size: 11px;
  line-height: 1.3;
}
.summary-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.summary-panel {
  border: 1px solid #b7c9c6;
  background: #fff;
}
.summary-panel header {
  padding: 10px 12px;
  border-bottom: 1px solid #d7e0df;
  background: #f8fafc;
}
.summary-panel header strong {
  display: block;
  color: #0f172a;
  font-size: 14px;
}
.summary-list {
  display: grid;
  gap: 1px;
  background: #e2e8f0;
}
.summary-list button {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 12px;
  border: 0;
  background: #fff;
  color: #0f172a;
  cursor: pointer;
  text-align: left;
}
.summary-list button:hover {
  background: #f0fdfa;
}
.summary-list i {
  width: 9px;
  height: 9px;
  margin-top: 4px;
  border-radius: 50%;
  background: #64748b;
  flex: 0 0 auto;
}
.summary-list i.high { background: #be123c; }
.summary-list i.medium { background: #f97316; }
.summary-list i.low { background: #16a34a; }
.summary-list strong,
.summary-timeline strong {
  display: block;
  color: #134e4a;
  font-size: 12px;
}
.summary-list span,
.summary-timeline span {
  color: #475569;
  font-size: 11px;
}
.summary-timeline {
  display: grid;
}
.summary-timeline article {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
}
.summary-timeline article:last-child {
  border-bottom: 0;
}
.summary-timeline small {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
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
.navigator-workspace {
  display: grid;
  gap: 8px;
}
.navigator-banner {
  align-items: center;
  background: #edf7f5;
  border: 1px solid #b7c9c6;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 8px 10px;
}
.navigator-banner div {
  display: grid;
  gap: 2px;
}
.navigator-banner strong {
  color: #134e4a;
  font-size: 14px;
  font-weight: 900;
}
.navigator-banner span {
  color: #475569;
  font-size: 11px;
  font-weight: 700;
}
.avatar-workspace {
  display: grid;
  gap: 8px;
}
.avatar-command {
  align-items: center;
  background: #f0fdfa;
  border: 1px solid #99f6e4;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 9px 10px;
}
.avatar-command div:first-child {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.avatar-command span {
  color: #0f766e;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}
.avatar-command strong {
  color: #134e4a;
  font-size: 14px;
  font-weight: 900;
}
.avatar-command p {
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  margin: 0;
}
.avatar-zone-strip {
  display: grid;
  gap: 6px;
  grid-template-columns: repeat(auto-fit, minmax(118px, 1fr));
}
.avatar-zone-card {
  align-items: center;
  background: #fff;
  border: 1px solid #cbd5e1;
  color: #0f172a;
  cursor: pointer;
  display: grid;
  gap: 3px;
  grid-template-columns: auto 1fr;
  min-height: 54px;
  padding: 7px 8px;
  text-align: left;
}
.avatar-zone-card strong {
  font-size: 12px;
  font-weight: 900;
}
.avatar-zone-card span {
  color: #64748b;
  font-size: 10px;
  font-weight: 800;
  grid-column: 1 / -1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.avatar-zone-card.risk {
  background: #fff1f2;
  border-color: #fecdd3;
}
.avatar-zone-card.active {
  background: #ecfdf5;
  border-color: #99f6e4;
}
.avatar-zone-card.stable {
  background: #f8fafc;
  border-color: #cbd5e1;
}
.avatar-zone-card.selected {
  box-shadow: inset 0 0 0 2px #0f766e;
}
.avatar-grid {
  display: grid;
  grid-template-columns: minmax(260px, 340px) minmax(0, 1fr);
  gap: 8px;
}
.patient-body-panel,
.avatar-detail-panel {
  border: 1px solid #b7c9c6;
  background: #fff;
}
.avatar-placement-palette {
  display: grid;
  gap: 6px;
  grid-template-columns: repeat(auto-fit, minmax(78px, 1fr));
  padding: 8px;
  border-bottom: 1px solid #d7e0df;
  background: #f8fafc;
}
.avatar-placement-palette button {
  align-items: center;
  background: #fff;
  border: 1px solid #cbd5e1;
  color: #334155;
  cursor: grab;
  display: inline-flex;
  gap: 5px;
  justify-content: center;
  min-height: 32px;
  padding: 5px 7px;
  font-size: 11px;
  font-weight: 900;
}
.avatar-placement-palette button.active {
  background: #ecfdf5;
  border-color: #0f766e;
  box-shadow: inset 0 0 0 1px #0f766e;
  color: #134e4a;
}
.avatar-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  border-bottom: 1px solid #d7e0df;
  background: #f8fafc;
  padding: 7px 9px;
}
.avatar-legend span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #475569;
  font-size: 11px;
  font-weight: 900;
}
.avatar-legend i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
}
.avatar-legend .risk { background: #be123c; }
.avatar-legend .active { background: #0f766e; }
.avatar-legend .stable { background: #64748b; }
.avatar-view-toggle {
  background: #fff;
  border-bottom: 1px solid #d7e0df;
  display: grid;
  gap: 6px;
  grid-template-columns: repeat(4, 1fr);
  padding: 7px 9px;
}
.avatar-view-toggle button {
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #334155;
  cursor: pointer;
  font-size: 11px;
  font-weight: 900;
  min-height: 28px;
}
.avatar-view-toggle button.active {
  background: #0f766e;
  border-color: #0f766e;
  color: #fff;
}
.body-canvas {
  min-height: 430px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(90deg, transparent 49.6%, rgba(15, 118, 110, 0.08) 49.6% 50.4%, transparent 50.4%),
    linear-gradient(180deg, #f8fafc 0%, #eef5f4 100%);
  overflow: auto;
  padding: 16px;
}
.body-figure {
  position: relative;
  width: 260px;
  height: 390px;
}
.body-figure.placing {
  cursor: crosshair;
}
.body-avatar-image {
  bottom: 0;
  height: 100%;
  left: 50%;
  object-fit: contain;
  pointer-events: none;
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  width: 100%;
  z-index: 1;
}
.body-figure::after {
  color: #94a3b8;
  content: "FRONT";
  font-size: 10px;
  font-weight: 900;
  left: 50%;
  letter-spacing: 0;
  position: absolute;
  text-transform: uppercase;
  top: 260px;
  transform: translateX(-50%);
}
.body-figure.with-image::after {
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid #e2e8f0;
  padding: 2px 5px;
  z-index: 2;
}
.body-figure.back::after {
  content: "BACK";
}
.body-head,
.body-neck,
.body-ear,
.body-face,
.body-shoulder,
.body-torso,
.body-breast,
.body-pelvis,
.body-spine,
.body-glute,
.body-arm,
.body-hand,
.body-leg,
.body-foot {
  position: absolute;
  background: #edf2f7;
  border: 1px solid #94a3b8;
  box-shadow: inset 0 8px 18px rgba(255, 255, 255, 0.72), inset 0 -10px 20px rgba(100, 116, 139, 0.12);
}
.body-figure.with-image .body-head,
.body-figure.with-image .body-neck,
.body-figure.with-image .body-ear,
.body-figure.with-image .body-face,
.body-figure.with-image .body-shoulder,
.body-figure.with-image .body-torso,
.body-figure.with-image .body-breast,
.body-figure.with-image .body-pelvis,
.body-figure.with-image .body-spine,
.body-figure.with-image .body-glute,
.body-figure.with-image .body-arm,
.body-figure.with-image .body-hand,
.body-figure.with-image .body-leg,
.body-figure.with-image .body-foot {
  display: none;
}
.body-head {
  left: 101px;
  top: 2px;
  width: 58px;
  height: 68px;
  border-radius: 50% 50% 44% 44%;
}
.body-ear {
  top: 28px;
  width: 10px;
  height: 24px;
  border-radius: 8px;
}
.body-ear.left { left: 95px; }
.body-ear.right { right: 95px; }
.body-face {
  left: 114px;
  top: 24px;
  width: 32px;
  height: 28px;
  border: 0;
  border-top: 1px solid rgba(100, 116, 139, 0.22);
  border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 50%;
  background: transparent;
  box-shadow: none;
}
.body-neck {
  left: 114px;
  top: 66px;
  width: 32px;
  height: 24px;
  border-radius: 8px;
}
.body-shoulder {
  left: 56px;
  top: 84px;
  width: 148px;
  height: 42px;
  border-radius: 52px 52px 16px 16px;
}
.body-torso {
  left: 78px;
  top: 96px;
  width: 104px;
  height: 146px;
  border-radius: 38px 38px 30px 30px;
}
.body-figure.male .body-shoulder {
  left: 49px;
  width: 162px;
}
.body-figure.male .body-torso {
  left: 74px;
  width: 112px;
  border-radius: 34px 34px 22px 22px;
}
.body-figure.female .body-shoulder {
  left: 63px;
  width: 134px;
}
.body-figure.female .body-torso {
  left: 82px;
  width: 96px;
  border-radius: 44px 44px 36px 36px;
}
.body-breast {
  top: 130px;
  width: 38px;
  height: 32px;
  border-radius: 50% 50% 46% 46%;
  background: rgba(226, 232, 240, 0.92);
  border-color: rgba(148, 163, 184, 0.7);
}
.body-breast.left { left: 84px; }
.body-breast.right { right: 84px; }
.body-pelvis {
  left: 86px;
  top: 223px;
  width: 88px;
  height: 46px;
  border-radius: 18px 18px 44px 44px;
}
.body-figure.back .body-torso {
  border-radius: 34px 34px 28px 28px;
  box-shadow: inset 0 -42px 0 rgba(148, 163, 184, 0.16);
}
.body-figure.back .body-head {
  background: #dbe4ee;
}
.body-spine {
  left: 128px;
  top: 104px;
  width: 4px;
  height: 124px;
  border: 0;
  background: rgba(100, 116, 139, 0.28);
  box-shadow: none;
}
.body-glute {
  top: 228px;
  width: 44px;
  height: 46px;
  border-radius: 28px 28px 38px 38px;
}
.body-glute.left { left: 84px; }
.body-glute.right { right: 84px; }
.body-arm {
  top: 108px;
  width: 32px;
  height: 148px;
  border-radius: 22px;
}
.body-arm.left {
  left: 40px;
  transform: rotate(12deg);
}
.body-arm.right {
  right: 40px;
  transform: rotate(-12deg);
}
.body-hand {
  top: 250px;
  width: 36px;
  height: 34px;
  border-radius: 18px 18px 16px 16px;
}
.body-hand.left {
  left: 28px;
  transform: rotate(8deg);
}
.body-hand.right {
  right: 28px;
  transform: rotate(-8deg);
}
.body-leg {
  top: 258px;
  width: 38px;
  height: 112px;
  border-radius: 22px 22px 18px 18px;
}
.body-leg.left { left: 82px; }
.body-leg.right { right: 82px; }
.body-figure.female .body-leg.left { left: 86px; }
.body-figure.female .body-leg.right { right: 86px; }
.body-foot {
  top: 366px;
  width: 42px;
  height: 18px;
  border-radius: 16px 16px 10px 10px;
}
.body-foot.left {
  left: 76px;
  transform: rotate(-8deg);
}
.body-foot.right {
  right: 76px;
  transform: rotate(8deg);
}
.body-zone {
  position: absolute;
  z-index: 3;
  min-width: 54px;
  min-height: 34px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #0f172a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 5px 7px;
  font-size: 10px;
  font-weight: 900;
  cursor: pointer;
}
.body-zone.risk {
  border-color: #be123c;
  background: #fff1f2;
}
.body-zone.active {
  border-color: #0f766e;
  background: #ecfdf5;
}
.body-zone.stable {
  border-color: #64748b;
  background: #f8fafc;
}
.body-zone.selected {
  outline: 3px solid #99f6e4;
  z-index: 3;
}
.body-zone.neuro { left: 103px; top: 0; }
.body-zone.resp { left: 146px; top: 105px; }
.body-zone.breast { left: 103px; top: 148px; }
.body-zone.cardiac { left: 54px; top: 116px; }
.body-zone.iv { left: 0; top: 166px; }
.body-zone.skin { left: 103px; top: 170px; }
.body-zone.pain { right: 0; top: 166px; }
.body-zone.mobility { left: 34px; top: 302px; }
.body-zone.meds { right: 34px; top: 302px; }
.avatar-sticker {
  align-items: center;
  background: rgba(255, 255, 255, 0.94);
  border: 2px solid #0f766e;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.2);
  cursor: pointer;
  display: inline-flex;
  height: 30px;
  justify-content: center;
  margin-left: -15px;
  margin-top: -15px;
  padding: 0;
  position: absolute;
  width: 30px;
  z-index: 4;
}
.avatar-sticker.wound {
  background: #fff1f2;
}
.avatar-sticker.trach {
  background: #f5f3ff;
}
.avatar-sticker.iv {
  background: #eff6ff;
}
.avatar-sticker.foley,
.avatar-sticker.drain {
  background: #f0fdfa;
}
.avatar-sticker.pain {
  background: #fef2f2;
}
.avatar-sticker.status-needs-reassessment,
.avatar-sticker.status-escalate {
  box-shadow: 0 0 0 3px rgba(190, 18, 60, 0.18), 0 2px 8px rgba(15, 23, 42, 0.2);
}
.avatar-detail-panel {
  display: grid;
  align-content: start;
  gap: 8px;
  padding: 10px;
}
.avatar-detail-panel > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 1px solid #d7e0df;
  padding-bottom: 8px;
}
.avatar-detail-panel > header div {
  display: flex;
  align-items: center;
  gap: 6px;
}
.avatar-detail-panel > header strong {
  color: #134e4a;
  font-size: 16px;
  font-weight: 900;
}
.avatar-detail-panel > header span {
  color: #475569;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}
.avatar-detail-panel p {
  margin: 0;
  color: #334155;
  font-size: 13px;
  font-weight: 700;
}
.avatar-placement-summary {
  display: grid;
  gap: 3px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 8px;
}
.avatar-placement-summary span {
  color: #0f766e;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}
.avatar-placement-summary strong {
  color: #334155;
  font-size: 12px;
  font-weight: 900;
}
.avatar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.avatar-actions button {
  min-height: 30px;
  border: 1px solid #99f6e4;
  background: #f0fdfa;
  color: #134e4a;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 9px;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}
.avatar-placement-hint {
  align-items: center;
  background: #ecfdf5;
  border: 1px solid #bbf7d0;
  color: #134e4a;
  display: flex;
  gap: 8px;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.35;
  padding: 8px 10px;
}
@media (max-width: 760px) {
  .avatar-command {
    align-items: stretch;
    flex-direction: column;
  }
  .avatar-placement-palette {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .avatar-view-toggle {
    grid-template-columns: 1fr 1fr;
  }
  .body-figure {
    transform: scale(0.92);
    transform-origin: center top;
  }
}
.flowsheet-command-center {
  display: grid;
  gap: 8px;
}
.emr-command-center,
.nurse-command-center {
  display: grid;
  gap: 12px;
}
.command-brief {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background: #f8fafc;
  border: 1px solid #dbe6e3;
  border-left: 4px solid #0f766e;
  padding: 10px 12px;
}
.command-brief div:first-child {
  display: grid;
  gap: 3px;
}
.command-brief span {
  color: #64748b;
  font-weight: 800;
}
.command-brief strong {
  color: #0f172a;
  font-size: 13px;
}
.command-brief-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}
.command-card-grid {
  display: grid;
  grid-template-columns: repeat(9, minmax(124px, 1fr));
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
}
.command-card {
  min-height: 190px;
  background: #ffffff;
  border: 1px solid #dbe6e3;
  border-top: 4px solid #94a3b8;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 8px;
  padding: 10px;
}
.command-card.complete { border-top-color: #16a34a; }
.command-card.active { border-top-color: #0369a1; }
.command-card.due { border-top-color: #be123c; }
.command-card.warning { border-top-color: #f97316; }
.command-card.pending { border-top-color: #64748b; }
.command-card-icon {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  background: #eef7f5;
  color: #0f766e;
  border: 1px solid #cfe5df;
}
.command-card strong {
  display: block;
  color: #0f172a;
  font-size: 12px;
}
.command-card span {
  display: block;
  color: #0f766e;
  font-weight: 800;
  margin-top: 2px;
}
.command-card p {
  color: #475569;
  line-height: 1.35;
  margin: 6px 0 0;
}
.command-card button {
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #0f172a;
  font-weight: 900;
  padding: 6px 8px;
  text-align: center;
  cursor: pointer;
}
.command-card button:hover {
  border-color: #0f766e;
  color: #0f766e;
}
.command-two-column {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.85fr);
  gap: 12px;
}
.nurse-focus-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(130px, 1fr));
  gap: 8px;
}
.nurse-focus-card {
  min-height: 118px;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 8px;
  align-content: start;
  background: #fff;
  border: 1px solid #dbe6e3;
  border-left: 4px solid #94a3b8;
  padding: 9px;
}
.nurse-focus-card.complete { border-left-color: #16a34a; }
.nurse-focus-card.active { border-left-color: #0369a1; }
.nurse-focus-card.due { border-left-color: #be123c; }
.nurse-focus-card.warning { border-left-color: #f97316; }
.nurse-focus-card strong {
  display: block;
  color: #0f172a;
  font-size: 12px;
  font-weight: 900;
}
.nurse-focus-card span {
  display: block;
  color: #0f766e;
  font-weight: 900;
  margin-top: 2px;
}
.nurse-focus-card p {
  margin: 5px 0 0;
  color: #475569;
  line-height: 1.35;
}
.flowsheet-actions {
  display: flex !important;
  grid-template-columns: none !important;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}
.flowsheet-actions .v-btn {
  text-transform: none;
}
.ai-care-panel {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: 8px;
  border: 1px solid #b7c9c6;
  background: #f8fafc;
  padding: 8px;
}
.ai-care-score {
  display: grid;
  align-content: center;
  justify-items: center;
  min-height: 116px;
  border: 1px solid #99f6e4;
  background: #ecfeff;
  color: #134e4a;
  text-align: center;
}
.ai-care-score span,
.ai-care-score small {
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}
.ai-care-score strong {
  font-size: 38px;
  line-height: 1;
  font-weight: 900;
}
.ai-care-main {
  display: grid;
  gap: 8px;
}
.ai-care-main header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.ai-care-main header div {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ai-care-main header strong {
  color: #134e4a;
  font-size: 14px;
  font-weight: 900;
}
.ai-care-main header span {
  color: #64748b;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}
.ai-care-tools {
  display: flex !important;
  grid-template-columns: none !important;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}
.ai-care-tools .v-btn {
  text-transform: none;
}
.ai-care-main p {
  margin: 0;
  color: #0f172a;
  font-size: 13px;
  font-weight: 800;
}
.ai-care-error {
  color: #b45309;
  font-size: 11px;
  font-weight: 900;
}
.ai-insight-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 6px;
}
.ai-insight {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 6px;
  border: 1px solid #cbd5e1;
  background: #fff;
  padding: 7px;
}
.ai-insight strong {
  display: block;
  color: #0f172a;
  font-size: 12px;
  font-weight: 900;
}
.ai-insight span {
  display: block;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.25;
}
.ai-insight.high {
  border-left: 4px solid #be123c;
}
.ai-insight.warning {
  border-left: 4px solid #f97316;
}
.ai-insight.info {
  border-left: 4px solid #2563eb;
}
.ai-insight.good {
  border-left: 4px solid #16a34a;
}
.care-calendar {
  display: grid;
  grid-template-columns: repeat(6, minmax(118px, 1fr));
  gap: 6px;
  overflow-x: auto;
}
.care-slot {
  min-height: 76px;
  border: 1px solid #cbd5e1;
  background: #fff;
  display: grid;
  align-content: start;
  gap: 3px;
  padding: 8px;
}
.care-slot strong {
  color: #0f172a;
  font-size: 14px;
  font-weight: 900;
}
.care-slot span {
  color: #334155;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.25;
}
.care-slot small {
  color: #64748b;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}
.care-slot.due {
  border-left: 4px solid #be123c;
  background: #fff7ed;
}
.care-slot.active {
  border-left: 4px solid #0f766e;
  background: #f0fdfa;
}
.care-slot.done {
  border-left: 4px solid #16a34a;
  background: #f0fdf4;
}
.care-slot.pending {
  border-left: 4px solid #64748b;
  background: #f8fafc;
}
.orders-workspace {
  display: grid;
  gap: 8px;
  padding-top: 8px;
}
.orders-command {
  min-height: 46px;
  border: 1px solid #b7c9c6;
  background: #f8fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 8px;
}
.orders-command div:first-child {
  display: grid;
  gap: 2px;
}
.orders-command span {
  color: #0f766e;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}
.orders-command strong {
  color: #134e4a;
  font-size: 14px;
  font-weight: 900;
}
.orders-quick-actions {
  display: flex !important;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}
.orders-quick-actions .v-btn {
  text-transform: none;
}
.orders-tabs {
  display: flex;
  align-items: end;
  gap: 3px;
  min-height: 34px;
  border-bottom: 1px solid #7fb5ae;
}
.orders-tabs button {
  min-width: 118px;
  height: 31px;
  border: 1px solid #9bbfba;
  border-bottom: 0;
  background: #dcecea;
  color: #334155;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 900;
}
.orders-tabs button.active {
  height: 34px;
  background: #fff;
  color: #0f4f4b;
  border-top: 3px solid #0f766e;
}
.orders-tabs button strong {
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #e2e8f0;
  color: #0f172a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}
.orders-tabs button.active strong {
  background: #0f766e;
  color: white;
}
.orders-controls {
  min-height: 38px;
  border: 1px solid #d7e0df;
  background: #f8fafc;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 7px 8px;
}
.orders-controls label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #334155;
  font-size: 11px;
  font-weight: 900;
}
.orders-controls select,
.order-mode-row select {
  height: 24px;
  border: 1px solid #94a3b8;
  background: white;
  color: #0f172a;
  font-size: 11px;
  font-weight: 800;
  outline: none;
}
.orders-toggle input {
  width: 14px;
  height: 14px;
}
.orders-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 8px;
  align-items: start;
}
.orders-main {
  display: grid;
  gap: 8px;
  min-width: 0;
}
.order-group {
  border: 1px solid #b7c9c6;
  background: #fff;
}
.order-group > header {
  min-height: 34px;
  background: #e7f4e2;
  border-bottom: 1px solid #b7c9c6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
}
.order-group > header div {
  display: flex;
  align-items: center;
  gap: 7px;
}
.order-group > header strong {
  color: #134e4a;
  font-size: 13px;
  font-weight: 900;
}
.order-group > header span {
  color: #64748b;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}
.order-group > header button {
  border: 1px solid #99f6e4;
  background: #f0fdfa;
  color: #0f766e;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 7px;
  font-size: 11px;
  font-weight: 900;
  cursor: pointer;
}
.order-card {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: start;
  border-bottom: 1px solid #e2e8f0;
  padding: 8px;
}
.order-card:last-child {
  border-bottom: 0;
}
.order-card.active {
  border-left: 4px solid #0f766e;
}
.order-card.pending {
  border-left: 4px solid #f97316;
}
.order-card.held {
  border-left: 4px solid #7c3aed;
  background: #faf5ff;
}
.order-card.stopped {
  border-left: 4px solid #64748b;
  background: #f8fafc;
}
.order-card-icon {
  width: 24px;
  height: 24px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
}
.order-card-body {
  min-width: 0;
  display: grid;
  gap: 4px;
}
.order-card-title {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}
.order-card-title strong {
  color: #0f172a;
  font-size: 13px;
  font-weight: 900;
  overflow-wrap: anywhere;
}
.order-card-title span {
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #475569;
  padding: 1px 5px;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  white-space: nowrap;
}
.order-card-body p {
  margin: 0;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
  overflow-wrap: anywhere;
}
.order-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.order-meta span {
  background: #eef2ff;
  color: #334155;
  border: 1px solid #d7e0df;
  padding: 2px 5px;
  font-size: 10px;
  font-weight: 900;
}
.order-action-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: flex-end;
  max-width: 280px;
}
.order-action-buttons button {
  min-height: 26px;
  border: 1px solid #cbd5e1;
  background: white;
  color: #334155;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 7px;
  font-size: 11px;
  font-weight: 900;
  cursor: pointer;
}
.order-action-buttons button:hover {
  border-color: #0f766e;
  color: #0f766e;
}
.order-sidebar-panel {
  border: 1px solid #b7c9c6;
  background: #eef5f4;
  display: grid;
  gap: 8px;
  padding: 8px;
}
.order-sidebar-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
}
.order-sidebar-tabs button {
  min-height: 28px;
  border: 1px solid #cbd5e1;
  background: #e2e8f0;
  color: #334155;
  font-size: 11px;
  font-weight: 900;
  cursor: pointer;
}
.order-sidebar-tabs button.active {
  background: white;
  border-top: 3px solid #0f766e;
  color: #0f4f4b;
}
.order-provider {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: 6px;
  align-items: start;
  border-bottom: 1px solid #d7e0df;
  padding-bottom: 6px;
}
.order-provider div {
  display: grid;
  gap: 2px;
}
.order-provider span,
.order-mode-row span {
  color: #64748b;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}
.order-provider strong {
  color: #0f172a;
  font-size: 12px;
  font-weight: 900;
  overflow-wrap: anywhere;
}
.order-search-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 54px;
  gap: 4px;
}
.order-search-row input {
  min-width: 0;
  height: 30px;
  border: 1px solid #94a3b8;
  background: white;
  padding: 0 7px;
  color: #0f172a;
  font-size: 11px;
  font-weight: 800;
  outline: none;
}
.order-search-row button {
  border: 1px solid #0f766e;
  background: #0f766e;
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 900;
  cursor: pointer;
}
.order-mode-row {
  display: grid;
  gap: 4px;
}
.order-set-list {
  display: grid;
  gap: 5px;
}
.order-set-list button {
  min-height: 48px;
  border: 1px solid #d7e0df;
  background: white;
  color: #0f172a;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 7px;
  align-items: start;
  padding: 7px;
  text-align: left;
  cursor: pointer;
}
.order-set-list button:hover {
  border-color: #0f766e;
  background: #f0fdfa;
}
.order-set-list div {
  display: grid;
  gap: 2px;
}
.order-set-list strong {
  font-size: 12px;
  font-weight: 900;
}
.order-set-list span {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.25;
}
.empty-orders.compact {
  min-height: 180px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  color: #64748b;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 4px;
  padding: 20px;
  text-align: center;
}
.empty-orders.compact strong {
  color: #334155;
  font-size: 14px;
  font-weight: 900;
}
.emar-workspace {
  display: grid;
  gap: 8px;
  padding-top: 8px;
}
.emar-command {
  min-height: 46px;
  border: 1px solid #b7c9c6;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px;
}
.emar-command > div:first-child {
  display: grid;
  gap: 2px;
}
.emar-command span {
  color: #0f766e;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}
.emar-command strong {
  color: #134e4a;
  font-size: 14px;
  font-weight: 900;
}
.emar-command-actions {
  display: flex !important;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}
.emar-command-actions .v-btn {
  text-transform: none;
}
.emar-tabs {
  display: flex;
  gap: 3px;
  align-items: end;
  min-height: 34px;
  border-bottom: 1px solid #7fb5ae;
  overflow-x: auto;
}
.emar-tabs button {
  min-width: 112px;
  height: 31px;
  border: 1px solid #9bbfba;
  border-bottom: 0;
  background: #dcecea;
  color: #334155;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
}
.emar-tabs button.active {
  height: 34px;
  background: white;
  color: #0f4f4b;
  border-top: 3px solid #0f766e;
}
.emar-tabs button strong {
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #e2e8f0;
  color: #0f172a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}
.emar-tabs button.active strong {
  background: #0f766e;
  color: white;
}
.emar-controls {
  min-height: 38px;
  border: 1px solid #d7e0df;
  background: #f8fafc;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 7px 8px;
}
.emar-controls label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #334155;
  font-size: 11px;
  font-weight: 900;
}
.emar-controls select {
  height: 24px;
  border: 1px solid #94a3b8;
  background: white;
  color: #0f172a;
  font-size: 11px;
  font-weight: 800;
  outline: none;
}
.emar-toggle input {
  width: 14px;
  height: 14px;
}
.emar-search {
  flex: 1 1 220px;
  min-width: 180px;
  height: 26px;
  border: 1px solid #94a3b8;
  background: white;
  padding: 0 8px;
  color: #0f172a;
  font-size: 11px;
  font-weight: 800;
  outline: none;
}
.emar-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 8px;
  align-items: start;
}
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
  grid-template-columns: 270px minmax(420px, 1fr) 180px;
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
  grid-template-columns: repeat(7, minmax(54px, 1fr));
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
.emar-time-cell {
  min-height: 42px;
  border: 1px solid #d7e0df;
  background: #f8fafc;
  color: #94a3b8;
  cursor: pointer;
  font-size: 11px;
  font-weight: 900;
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
  background: #f0fdf4;
  border-color: #16a34a;
  color: #166534;
}
.emar-time-cell.held {
  background: #faf5ff;
  border-color: #7c3aed;
  color: #5b21b6;
}
.emar-time-cell.running {
  background: #eef2ff;
  border-color: #4f46e5;
  color: #3730a3;
}
.emar-time-cell.prn {
  background: #fffbeb;
  border-color: #d97706;
  color: #92400e;
}
.emar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-content: start;
  justify-content: flex-end;
}
.emar-actions button {
  min-height: 25px;
  border: 1px solid #cbd5e1;
  background: white;
  color: #334155;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  font-size: 10px;
  font-weight: 900;
  cursor: pointer;
}
.emar-actions button:hover {
  border-color: #0f766e;
  color: #0f766e;
}
.emar-side {
  display: grid;
  gap: 8px;
}
.emar-advisories {
  border: 1px solid #b7c9c6;
  background: #eef5f4;
  padding: 8px;
  display: grid;
  gap: 6px;
}
.emar-advisories header {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #134e4a;
  font-weight: 900;
}
.emar-advisories article {
  border: 1px solid #d7e0df;
  background: white;
  padding: 7px;
  display: grid;
  gap: 3px;
}
.emar-advisories article.high {
  border-left: 4px solid #be123c;
}
.emar-advisories article.warning {
  border-left: 4px solid #f97316;
}
.emar-advisories article.normal,
.emar-advisories article.education {
  border-left: 4px solid #0f766e;
}
.emar-advisories article strong {
  color: #0f172a;
  font-size: 12px;
  font-weight: 900;
}
.emar-advisories article span {
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.25;
}
.action-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  border: 1px solid #d7e0df;
  padding: 8px;
  margin-top: 8px;
}
.action-strip .v-btn {
  text-transform: none;
}
.wound-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
  margin-top: 10px;
}
.empty-wounds {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 0;
  color: #94a3b8;
  margin-top: 10px;
}
.care-plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin: 10px 0;
}
.care-plan-card {
  border: 1px solid #d7e0df;
  background: #fff;
  padding: 12px;
}
.care-plan-card.overdue {
  border-left: 4px solid #f97316;
  background: #fffbeb;
}
.care-plan-card header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}
.care-plan-card header strong {
  color: #134e4a;
  font-size: 13px;
  flex: 1;
}
.care-plan-card p {
  font-size: 12.5px;
  color: #334155;
  margin: 4px 0;
}
.care-plan-card p.target-date {
  background: #f0f9ff;
  padding: 6px 8px;
  border-radius: 3px;
  color: #0c4a6e;
}
.care-plan-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  border-top: 1px solid #e2e8f0;
  padding-top: 6px;
}
.care-plan-meta span {
  font-size: 11px;
  color: #64748b;
}
.status-chip.overdue-flag {
  background: #fed7aa;
  color: #92400e;
}
.status-chip.signed {
  background: #dbeafe;
  color: #075985;
}
.status-chip.archived {
  background: #e5e7eb;
  color: #4b5563;
}
.notes-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 12px;
  margin-top: 10px;
  min-height: 0;
}
.notes-list {
  border: 1px solid #d7e0df;
  background: #fff;
  overflow: auto;
  max-height: 640px;
}
.notes-list-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  width: 100%;
  border: 0;
  border-bottom: 1px solid #e2e8f0;
  background: transparent;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
}
.notes-list-item strong {
  color: #0f172a;
  font-size: 12.5px;
}
.notes-list-item.active {
  background: #f0fdfa;
  box-shadow: inset 3px 0 0 #0f766e;
}
.notes-list-item.legacy {
  cursor: default;
  color: #64748b;
}
.notes-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #64748b;
}
.notes-empty, .notes-empty-detail {
  padding: 20px 12px;
  color: #94a3b8;
  font-size: 12.5px;
}
.notes-empty-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  justify-content: center;
  min-height: 200px;
}
.legacy-heading {
  font-size: 10.5px;
  text-transform: uppercase;
  color: #94a3b8;
  padding: 10px 12px 2px;
  margin: 0;
}
.status-chip {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 800;
  font-size: 10px;
  text-transform: uppercase;
}
.status-chip.draft { background: #fef3c7; color: #78350f; }
.status-chip.signed { background: #dcfce7; color: #14532d; }
.status-chip.amended { background: #e0f2fe; color: #075985; }
.notes-detail {
  border: 1px solid #d7e0df;
  background: #fff;
  padding: 14px;
  overflow: auto;
}
.notes-detail header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 10px;
  margin-bottom: 10px;
}
.notes-detail header h2 {
  font-size: 15px;
  margin: 4px 0 2px;
  color: #134e4a;
}
.notes-detail header p {
  margin: 0;
  color: #64748b;
  font-size: 12px;
}
.notes-detail-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.notes-body {
  white-space: pre-wrap;
  color: #1f2937;
  font-size: 13px;
  line-height: 1.5;
}
.amend-box {
  background: #faf5ff;
  border: 1px solid #e9d5ff;
  padding: 10px;
  margin: 10px 0;
}
.amend-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}
.notes-amendments h3 {
  font-size: 11px;
  text-transform: uppercase;
  color: #7c3aed;
  margin: 10px 0 4px;
}
.amendment-row {
  border-left: 2px solid #e9d5ff;
  padding: 4px 0 4px 10px;
  margin-bottom: 6px;
}
.amendment-row span {
  font-size: 11px;
  color: #64748b;
}
.amendment-row p {
  margin: 2px 0 0;
  font-size: 12.5px;
}
.chart-dialog {
  border: 1px solid #86a9a5;
  border-radius: 4px;
}
.dialog-title {
  min-height: 54px;
  background: #e7f4e2;
  border-bottom: 1px solid #b7c9c6;
  color: #173b39;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
}
.dialog-title div {
  display: grid;
  gap: 2px;
}
.dialog-title span {
  color: #0f766e;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}
.dialog-title strong {
  font-size: 15px;
  font-weight: 900;
}
.dialog-grid {
  display: grid;
  gap: 10px;
}
.dialog-grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.dialog-grid.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.dialog-actions {
  border-top: 1px solid #d7e0df;
  background: #f8fafc;
}
.dialog-actions span {
  color: #0f766e;
  font-size: 12px;
  font-weight: 900;
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
.planning-comment {
  min-height: 32px;
  margin: 0;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  padding: 8px;
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
  .navigator-layout, .sdoh-content, .discharge-summary, .ai-care-panel, .avatar-grid, .orders-layout, .emar-layout, .command-two-column, .nurse-focus-grid, .summary-columns {
    grid-template-columns: 1fr;
  }
  .summary-hero {
    align-items: flex-start;
    flex-direction: column;
  }
  .summary-actions {
    justify-content: flex-start;
  }
  .summary-status-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .navigator-focus-head {
    flex-direction: column;
  }
  .navigator-focus-actions {
    justify-content: flex-start;
  }
  .navigator-focus-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .summary-timeline article {
    grid-template-columns: 1fr;
  }
  .command-card-grid {
    grid-template-columns: repeat(9, minmax(180px, 220px));
  }
  .orders-command,
  .emar-command,
  .command-brief,
  .order-card {
    grid-template-columns: 1fr;
  }
  .orders-command,
  .emar-command,
  .command-brief {
    align-items: flex-start;
    flex-direction: column;
  }
  .orders-tabs,
  .emar-tabs {
    overflow-x: auto;
  }
  .order-action-buttons {
    justify-content: flex-start;
    max-width: none;
  }
  .sdoh-popover:before {
    display: none;
  }
  .dialog-grid.two,
  .dialog-grid.three {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 560px) {
  .summary-status-grid {
    grid-template-columns: 1fr;
  }
  .navigator-focus-grid {
    grid-template-columns: 1fr;
  }
}
</style>
