<template>
  <div class="emr-workspace">
    <header class="chart-topbar">
      <div class="brand-row">
        <v-avatar tile size="24" color="#0f766e" class="mr-2">
          <v-icon dark x-small>mdi-hospital-building</v-icon>
        </v-avatar>
        <strong>{{ $t('clinical360.workspace.chart') }}</strong>
        <span class="environment">{{ $t('clinical360.workspace.clinical_workflow') }}</span>
      </div>
      <div class="search-box" role="combobox" :aria-expanded="String(globalSearchOpen)" aria-haspopup="listbox">
        <v-icon small color="#64748b">mdi-magnify</v-icon>
        <input
          v-model="globalSearchQuery"
          type="search"
          :aria-label="$t('clinical360.workspace.search_chart')"
          :placeholder="$t('clinical360.workspace.search_placeholder')"
          @focus="globalSearchOpen = true"
          @blur="scheduleGlobalSearchClose"
          @keydown.enter.prevent="submitGlobalSearch"
          @keydown.esc.prevent="clearGlobalSearch"
        >
        <button v-if="globalSearchQuery" type="button" class="search-clear" :title="$t('clinical360.workspace.clear_search')" @mousedown.prevent @click="clearGlobalSearch">
          <v-icon x-small>mdi-close</v-icon>
        </button>
        <div v-if="globalSearchOpen && globalSearchQuery" class="global-search-results" role="listbox">
          <button
            v-for="result in globalSearchResults"
            :key="result.key"
            type="button"
            role="option"
            @mousedown.prevent
            @click="selectGlobalSearchResult(result)"
          >
            <v-icon small :color="result.color || '#0f766e'">{{ result.icon }}</v-icon>
            <span><strong>{{ result.title }}</strong><small>{{ result.meta }}</small></span>
            <b>{{ result.group }}</b>
          </button>
          <div v-if="!globalSearchResults.length" class="search-empty">{{ $t('clinical360.workspace.no_search_results') }}</div>
        </div>
      </div>
      <div class="topbar-actions">
        <v-btn v-if="patientScoped" x-small text color="#0f766e" class="font-weight-black" to="/clinical/patients">
          <v-icon x-small left>mdi-account-search</v-icon>{{ $t('clinical360.workspace.patient_list') }}
        </v-btn>
        <v-btn x-small text color="#0f766e" class="font-weight-black" @click="dialogs.scan = true">
          <v-icon x-small left>mdi-barcode-scan</v-icon>{{ $t('clinical360.workspace.scan_bracelet') }}
        </v-btn>
        <label v-if="canPreviewRole" class="role-switcher">
          <span>{{ $t('clinical360.workspace.preview_role') }}</span>
          <select v-model="previewRole">
            <option v-for="role in roleOptions" :key="role.value" :value="role.value">
              {{ role.short }}
            </option>
          </select>
        </label>
        <v-btn v-if="patientScoped && activePatientId" x-small text color="#0f766e" class="font-weight-black" @click="openReportCenter">
          <v-icon x-small left>mdi-printer</v-icon>{{ $t('clinical360.workspace.print') }}
        </v-btn>
        <v-btn x-small text color="#0f766e" class="font-weight-black">{{ $t('clinical360.workspace.chart_correction') }}</v-btn>
        <v-btn v-if="patientScoped && activePatientRecord" x-small tile depressed color="#D97706" dark class="font-weight-black ml-1" @click="openTransferModal">
          <v-icon x-small left>mdi-swap-horizontal</v-icon>{{ $t('clinical360.workspace.transfer_patient') }}
        </v-btn>
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
          :aria-label="$t('clinical360.workspace.close_named_chart', { name: chart.shortName })"
          @click.stop="closeOpenChart(chart)"
        >
          <v-icon x-small>mdi-close</v-icon>
        </button>
      </div>
      <button
        v-if="patientScoped"
        type="button"
        class="patient-tab-add"
        :aria-label="$t('clinical360.workspace.open_another_chart')"
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
        <span>{{ $t('clinical360.workspace.chart_tabs_count', { count: visibleChartTabs.length }) }}</span>
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

    <NavigatorStrip
      ref="navigatorStrip"
      v-if="activePatient && activePatientId"
      :patient-id="activePatientId"
      :patient-name="activePatient.name"
      :patient-meta="`${activePatient.age}y • ${activePatient.admissionStatus || 'Active'}`"
      :current-state="isPatientDischarged ? 'discharge' : currentWorkflowState"
      :read-only="isPatientDischarged"
      @admission-complete="handleWorkflowComplete('admission')"
      @transfer-complete="handleWorkflowComplete('transfer')"
      @discharge-complete="handleWorkflowComplete('discharge', $event)"
    />

    <v-alert v-if="isPatientDischarged" tile dense color="#475569" dark class="discharged-readonly-alert ma-0">
      <v-icon left small color="white">mdi-lock-outline</v-icon>
      <strong>{{ $t('clinical360.workspace.discharged_read_only') }}</strong>
      {{ $t('clinical360.workspace.discharged_detail', { date: formatShortDate(activePatient.dischargedAt) }) }}
    </v-alert>

    <div class="chart-frame" :class="{ 'left-collapsed': effectiveLeftPanelCollapsed, 'right-collapsed': effectiveRightPanelCollapsed, 'chart-readonly': isPatientDischarged }">
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
          <aside v-if="selectedChartTab === 'Navigators'" class="navigator-rail">
            <div class="rail-group" v-if="activeNavigator">
              <strong>{{ activeNavigator.label }}</strong>
              <a
                v-for="section in activeNavigatorSections"
                :key="section.key"
                :class="['navigator-section-link', navigatorSectionStatus(section).status, { active: selectedNavigatorSection === section.key }]"
                href="#"
                @click.prevent="selectNavigatorSection(section.key)"
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
          <v-icon x-small left>mdi-tune-variant</v-icon>{{ $t('clinical360.workspace.manage_tabs') }}
        </v-btn>
        <v-chip x-small label color="#e0f2fe" text-color="#075985" class="font-weight-black">
          {{ $t('clinical360.workspace.current_admission') }}
        </v-chip>
            <v-btn
              v-if="activePatientId && canLaunchNurse && !isPatientDischarged"
              x-small
              depressed
              color="#003366"
              dark
              class="font-weight-black"
              @click="openChartDialog('nurse')"
            >
              <v-icon x-small left>mdi-stethoscope</v-icon>{{ $t('clinical360.workspace.nurse_work') }}
            </v-btn>
            <v-btn
              v-if="activePatientId && canLaunchMedical && !isPatientDischarged"
              x-small
              depressed
              color="#1d4ed8"
              dark
              class="font-weight-black"
              @click="openChartDialog('medical')"
            >
              <v-icon x-small left>mdi-medical-bag</v-icon>{{ $t('clinical360.workspace.medical') }}
            </v-btn>
            <v-btn v-if="canLaunchNurse && !isPatientDischarged" x-small depressed color="#0f766e" dark class="font-weight-black" @click="openChartDialog('nurse')">
              <v-icon x-small left>mdi-plus</v-icon>{{ $t('clinical360.workspace.new_reading') }}
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
                  <span>{{ $t('clinical360.workspace.patient_summary') }}</span>
                  <strong>{{ summaryHeadline }}</strong>
                  <p>{{ summaryNarrative }}</p>
                </div>
                <div class="summary-actions">
                  <v-btn x-small depressed color="#003366" dark @click="openCommandAction('nurse')">
                    <v-icon x-small left>mdi-stethoscope</v-icon>{{ $t('clinical360.workspace.nurse_entry') }}
                  </v-btn>
                  <v-btn x-small depressed color="#0f766e" dark @click="openCommandAction('flowsheet')">
                    <v-icon x-small left>mdi-clock-edit-outline</v-icon>{{ $t('clinical360.workspace.timed_care') }}
                  </v-btn>
                  <v-btn x-small text color="#7c3aed" @click="openCommandAction('handoff')">
                    <v-icon x-small left>mdi-handshake-outline</v-icon>{{ $t('clinical360.workspace.handoff') }}
                  </v-btn>
                </div>
              </div>

              <div class="summary-status-grid">
                <button
                  v-for="item in summaryStatusCards"
                  :key="item.label"
                  type="button"
                  :class="['summary-status-card', item.status]"
                  @click="openCommandAction(item.action)"
                >
                  <v-icon small>{{ item.icon }}</v-icon>
                  <div>
                    <span>{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                    <p>{{ item.detail }}</p>
                  </div>
                </button>
              </div>

              <section class="summary-cycle-panel">
                <header>
                  <div>
                    <span>{{ $t('clinical360.workspace.patient_cycle') }}</span>
                    <strong>{{ $t('clinical360.workspace.admission_to_continuity') }}</strong>
                  </div>
                  <div class="summary-completeness">
                    <strong>{{ summaryCompleteness }}%</strong>
                    <span>{{ $t('clinical360.workspace.chart_readiness') }}</span>
                  </div>
                </header>
                <div class="summary-cycle-track">
                  <button
                    v-for="(stage, index) in summaryCareCycle"
                    :key="stage.key"
                    type="button"
                    :class="['summary-cycle-step', stage.status]"
                    @click="openCommandAction(stage.action)"
                  >
                    <span>{{ index + 1 }}</span>
                    <div>
                      <strong>{{ stage.label }}</strong>
                      <small>{{ stage.detail }}</small>
                    </div>
                    <v-icon x-small>mdi-chevron-right</v-icon>
                  </button>
                </div>
              </section>

              <div class="summary-columns summary-clinical-grid">
                <section class="summary-panel">
                  <header>
                    <span>{{ $t('clinical360.workspace.safety_watch') }}</span>
                    <strong>{{ $t('clinical360.workspace.critical_facts') }}</strong>
                  </header>
                  <div class="summary-safety-list">
                    <button
                      v-for="item in summarySafetyItems"
                      :key="item.label"
                      type="button"
                      :class="item.level"
                      @click="openCommandAction(item.action)"
                    >
                      <v-icon small>{{ item.icon }}</v-icon>
                      <div>
                        <strong>{{ item.label }}</strong>
                        <span>{{ item.detail }}</span>
                      </div>
                    </button>
                  </div>
                </section>

                <section class="summary-panel">
                  <header>
                    <span>{{ $t('clinical360.workspace.department_ownership') }}</span>
                    <strong>{{ $t('clinical360.workspace.who_acts_next') }}</strong>
                  </header>
                  <div class="summary-department-list">
                    <button
                      v-for="item in summaryDepartmentItems"
                      :key="item.label"
                      type="button"
                      @click="openCommandAction(item.action)"
                    >
                      <v-icon small :color="item.color">{{ item.icon }}</v-icon>
                      <div>
                        <strong>{{ item.label }}</strong>
                        <span>{{ item.detail }}</span>
                      </div>
                      <em :class="item.status">{{ item.badge }}</em>
                    </button>
                  </div>
                </section>
              </div>

            <div class="summary-columns">
              <section class="summary-panel">
                <header>
                  <span>{{ $t('clinical360.workspace.today_priorities') }}</span>
                  <strong>{{ $t('clinical360.workspace.before_handoff') }}</strong>
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
                    <span>{{ $t('clinical360.workspace.care_continuity') }}</span>
                    <strong>{{ $t('clinical360.workspace.last_filed_next_owner') }}</strong>
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
                    <span>{{ $t('clinical360.workspace.care_plan') }}</span>
                    <strong>{{ $t('clinical360.workspace.goals_interventions_outcomes') }}</strong>
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
                    <span>{{ $t('clinical360.workspace.education') }}</span>
                    <strong>{{ $t('clinical360.workspace.teaching_completed') }}</strong>
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
                  :title="$t('clinical360.workspace.cards.patient_snapshot')"
                  :columns="['Current']"
                  :rows="summaryRows"
                  action="nurse"
                  @action="openCommandAction"
                />
                <FlowSection
                  :title="$t('clinical360.workspace.cards.latest_signals')"
                  :columns="['Last Filed']"
                  :rows="visibleVitalRows"
                  action="flowsheet"
                  @action="openCommandAction"
                />
              </div>

              <FlowSection
                v-if="summaryActiveOrderRows.length"
                :title="$t('clinical360.workspace.cards.active_orders')"
                :columns="['Detail']"
                :rows="summaryActiveOrderRows"
                action="orders"
                @action="openCommandAction"
              />
              <FlowSection
                v-if="summaryLatestNoteRows.length"
                :title="$t('clinical360.workspace.cards.latest_notes')"
                :columns="['Type', 'Recorded', 'Summary']"
                :rows="summaryLatestNoteRows"
                action="notes"
                @action="openCommandAction"
              />
              <FlowSection
                v-if="summaryPendingTaskRows.length"
                :title="$t('clinical360.workspace.cards.pending_documentation')"
                :columns="['Status']"
                :rows="summaryPendingTaskRows"
                action="worklist"
                @action="openCommandAction"
              />
            </section>

            <section v-else-if="selectedChartTab === 'EMR Command Center'" class="emr-command-center">
              <div class="command-brief">
                <div>
                  <span>{{ $t('clinical360.workspace.hospital_command') }}</span>
                  <strong>{{ $t('clinical360.workspace.hospital_command_detail') }}</strong>
                </div>
                <div class="command-brief-actions">
                  <v-chip small label color="#dcfce7" text-color="#166534" class="font-weight-black">
                    Offline ready
                  </v-chip>
                  <v-chip small label color="#e0f2fe" text-color="#075985" class="font-weight-black">
                    {{ accessProfile.short }} scope
                  </v-chip>
                  <v-btn x-small depressed color="#0f766e" dark @click="openCommandAction('nurse')">
                    <v-icon x-small left>mdi-clipboard-pulse-outline</v-icon>{{ $t('clinical360.workspace.document') }}
                  </v-btn>
                </div>
              </div>

              <div class="command-card-grid" :aria-label="$t('clinical360.workspace.navigation.hospital_modules')">
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

              <div class="command-live-strip" :aria-label="$t('clinical360.workspace.navigation.live_operations')">
                <button type="button" @click="selectChartTab('Work List')"><span>{{ $t('clinical360.command.open_work') }}</span><strong>{{ patientTasks.length }}</strong><small>{{ $t('clinical360.command.assigned_tasks') }}</small></button>
                <button type="button" @click="selectChartTab('Orders')"><span>{{ $t('clinical360.command.diagnostics') }}</span><strong>{{ patientLabOrders.length + patientImagingOrders.length }}</strong><small>{{ $t('clinical360.command.lab_imaging') }}</small></button>
                <button type="button" @click="selectChartTab('Documents')"><span>{{ $t('clinical360.command.chart_records') }}</span><strong>{{ patientDocuments.length }}</strong><small>{{ $t('clinical360.command.filed_documents') }}</small></button>
                <button type="button" @click="selectChartTab('Care Teams')"><span>{{ $t('clinical360.command.coverage') }}</span><strong>{{ visibleCareTeamRows.length }}</strong><small>{{ $t('clinical360.command.team_members') }}</small></button>
              </div>

              <div class="command-two-column">
                <FlowSection
                  :title="$t('clinical360.workspace.cards.department_coverage')"
                  :columns="['Status', 'Owner', 'Next']"
                  :rows="departmentCoverageRows"
                />
                <FlowSection
                  :title="$t('clinical360.workspace.cards.offline_readiness')"
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
                  :title="$t('clinical360.workspace.cards.handoff_matrix')"
                  :columns="['From', 'To', 'Action']"
                  :rows="departmentHandoffRows"
                />
              </div>

              <FlowSection
                :title="$t('clinical360.workspace.cards.role_actions')"
                :columns="['Priority', 'Where', 'Action']"
                :rows="roleActionRows"
              />
            </section>

            <Patient360DoctorCommandCenter
              v-else-if="selectedChartTab === 'Doctor Command Center'"
              :patient="activePatient"
              :latest-vitals="latestVitals"
              :medical-notes="patientMedicalNotes"
              :lab-orders="patientLabOrders"
              :imaging-orders="patientImagingOrders"
              :medications="patientMedications"
              :tasks="patientTasks"
              :care-plans="patientCarePlans"
              :read-only="isPatientDischarged"
              @open-tab="selectChartTab"
              @new-note="openChartDialog('medical')"
              @new-order="selectChartTab('Orders')"
            />

            <section v-else-if="selectedChartTab === 'Nurse Command Center'" class="nurse-command-center">
              <div class="command-brief nurse">
                <div>
                  <span>{{ $t('clinical360.workspace.nurse_command') }}</span>
                  <strong>{{ $t('clinical360.workspace.nurse_command_detail') }}</strong>
                </div>
                <div class="command-brief-actions">
                  <v-btn x-small depressed color="#003366" dark @click="openCommandAction('nurse')">
                    <v-icon x-small left>mdi-stethoscope</v-icon>{{ $t('clinical360.workspace.new_nursing_entry') }}
                  </v-btn>
                  <v-btn x-small depressed color="#0f766e" dark @click="openCommandAction('flowsheet')">
                    <v-icon x-small left>mdi-clock-edit-outline</v-icon>{{ $t('clinical360.workspace.timed_flowsheet') }}
                  </v-btn>
                  <v-btn x-small depressed color="#be123c" dark @click="openCommandAction('body')">
                    <v-icon x-small left>mdi-human</v-icon>{{ $t('clinical360.workspace.body_assessment') }}
                  </v-btn>
                  <v-btn x-small depressed color="#0f766e" dark @click="openCommandAction('medication')">
                    <v-icon x-small left>mdi-pill</v-icon>{{ $t('clinical360.workspace.mar') }}
                  </v-btn>
                  <v-btn x-small depressed color="#7c3aed" dark @click="openCommandAction('handoff')">
                    <v-icon x-small left>mdi-handshake-outline</v-icon>{{ $t('clinical360.workspace.handoff') }}
                  </v-btn>
                </div>
              </div>

              <div class="command-live-strip nurse-live" :aria-label="$t('clinical360.workspace.navigation.live_nursing')">
                <button type="button" @click="openCommandAction('nurse')"><span>{{ $t('clinical360.command.last_vitals') }}</span><strong>{{ latestVitalsSummary || $t('clinical360.common.due') }}</strong><small>{{ $t('clinical360.command.document_assessment') }}</small></button>
                <button type="button" @click="selectChartTab('MAR')"><span>{{ $t('clinical360.command.medication_profile') }}</span><strong>{{ patientMedications.length }}</strong><small>{{ $t('clinical360.command.active_items') }}</small></button>
                <button type="button" @click="selectChartTab('Wound Management')"><span>{{ $t('clinical360.command.skin_integrity') }}</span><strong>{{ patientWounds.length }}</strong><small>{{ $t('clinical360.command.documented_wounds') }}</small></button>
                <button type="button" @click="selectChartTab('Handoff')"><span>{{ $t('clinical360.command.shift_handoff') }}</span><strong>{{ latestNursingNote ? $t('clinical360.common.started') : $t('clinical360.common.due') }}</strong><small>{{ $t('clinical360.command.continuity_record') }}</small></button>
              </div>

              <div class="nurse-focus-grid">
                <button v-for="item in nurseCommandTiles" :key="item.label" type="button" :class="['nurse-focus-card', item.status]" @click="openNurseCommandTile(item)">
                  <v-icon small>{{ item.icon }}</v-icon>
                  <div>
                    <strong>{{ item.label }}</strong>
                    <span>{{ item.value }}</span>
                    <p>{{ item.action }}</p>
                  </div>
                </button>
              </div>

              <div class="command-two-column">
                <FlowSection
                  :title="$t('clinical360.workspace.cards.shift_care_board')"
                  :columns="['Time', 'Priority', 'Action']"
                  :rows="nurseShiftRows"
                />
                <FlowSection
                  :title="$t('clinical360.workspace.cards.support_tasks')"
                  :columns="['Status', 'Owner', 'Action']"
                  :rows="supportCareRows"
                />
              </div>

              <FlowSection
                :title="$t('clinical360.workspace.cards.safety_escalation')"
                :columns="['Signal', 'Owner', 'Action']"
                :rows="nurseEscalationRows"
              />
            </section>

            <Patient360ChartReviewTab
              v-else-if="selectedChartTab === 'Chart Review'"
              :events="chartReviewEvents"
              :metrics="chartReviewMetrics"
              :risks="chartReviewRisks"
              :alerts="chartReviewAlerts"
              :read-only="isPatientDischarged"
              @action="openCommandAction"
              @navigate="selectChartTab"
            />

            <section v-else-if="selectedChartTab === 'Avatar'" class="avatar-workspace">
              <div class="avatar-command">
                <div>
                  <span>{{ $t('clinical360.workspace.clinical_avatar') }}</span>
                  <strong>{{ $t('clinical360.workspace.avatar_detail') }}</strong>
                  <p>{{ avatarNarrative }}</p>
                </div>
                <div class="flowsheet-actions">
                  <v-btn x-small depressed color="#0f766e" dark @click="openCommandAction('body')">
                    <v-icon x-small left>mdi-human</v-icon>{{ $t('clinical360.workspace.body_assessment') }}
                  </v-btn>
                  <v-btn x-small depressed color="#0f766e" dark @click="openCommandAction('flowsheet')">
                    <v-icon x-small left>mdi-clock-edit-outline</v-icon>{{ $t('clinical360.workspace.timed_care') }}
                  </v-btn>
                  <v-btn v-if="!isPatientDischarged" x-small text color="#7c3aed" @click="dialogs.woundCare = true">
                    <v-icon x-small left>mdi-bandage</v-icon>{{ $t('clinical360.workspace.wound_care') }}
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
                <section class="patient-body-panel" :aria-label="$t('clinical360.workspace.navigation.patient_body_avatar')">
                  <div v-if="!isPatientDischarged" class="avatar-placement-palette" :aria-label="$t('clinical360.workspace.navigation.placement_tools')">
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
                    <span><i class="risk"></i>{{ $t('clinical360.workspace.risk') }}</span>
                    <span><i class="active"></i>{{ $t('clinical360.workspace.active_care') }}</span>
                    <span><i class="stable"></i>{{ $t('clinical360.workspace.stable') }}</span>
                  </div>
                  <div class="avatar-view-toggle">
                    <button :class="{ active: avatarView === 'front' }" type="button" @click="avatarView = 'front'">{{ $t('clinical360.workspace.front') }}</button>
                    <button :class="{ active: avatarView === 'back' }" type="button" @click="avatarView = 'back'">{{ $t('clinical360.workspace.back') }}</button>
                  </div>
                  <div class="avatar-zoom-toggle">
                    <button type="button" :disabled="avatarZoom <= AVATAR_ZOOM_MIN" :aria-label="$t('clinical360.workspace.navigation.zoom_out')" @click="zoomAvatar(-1)">
                      <v-icon x-small>mdi-magnify-minus-outline</v-icon>
                    </button>
                    <span>{{ Math.round(avatarZoom * 100) }}%</span>
                    <button type="button" :disabled="avatarZoom >= AVATAR_ZOOM_MAX" :aria-label="$t('clinical360.workspace.navigation.zoom_in')" @click="zoomAvatar(1)">
                      <v-icon x-small>mdi-magnify-plus-outline</v-icon>
                    </button>
                    <button v-if="avatarZoom !== 1" type="button" :aria-label="$t('clinical360.workspace.navigation.reset_zoom')" @click="resetAvatarZoom">
                      <v-icon x-small>mdi-backup-restore</v-icon>
                    </button>
                  </div>
                  <div class="body-canvas">
                    <div
                      ref="avatarBodyFigure"
                      :class="['body-figure', avatarView, avatarAnatomy, { 'with-image': avatarImageSrc, placing: selectedAvatarTool }]"
                      :style="{ transform: `scale(${avatarZoom})` }"
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
                        v-for="item in visibleAvatarPlacements"
                        :key="item.id"
                        type="button"
                        :class="['avatar-sticker', item.type, avatarPlacementStatusClass(item)]"
                        :style="avatarPlacementStyle(item)"
                        :title="`${item.label} - ${item.region}`"
                        :aria-label="`Open ${item.label} at ${item.region}, status ${item.status}`"
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
                    <span>{{ avatarPlacements.length }} active item(s) · {{ frontAvatarPlacementCount }} front · {{ backAvatarPlacementCount }} back</span>
                    <strong v-if="selectedAvatarToolRecord">Click anatomy to place: {{ selectedAvatarToolRecord.label }}</strong>
                    <strong v-else>{{ isPatientDischarged ? 'Placed items are available for review.' : 'Select or drag a sticker to document exact location.' }}</strong>
                    <small v-if="archivedAvatarPlacementCount">{{ archivedAvatarPlacementCount }} resolved / removed item(s) retained in audit history.</small>
                  </div>
                  <div v-if="avatarPlacements.length" class="avatar-mapped-items" :aria-label="$t('clinical360.workspace.navigation.active_mapped_elements')">
                    <button v-for="item in avatarPlacements" :key="`mapped-${item.id}`" type="button" @click="reviewAvatarPlacement(item)">
                      <v-icon x-small :color="item.color">{{ item.icon }}</v-icon>
                      <span><strong>{{ item.label }}</strong><small>{{ item.region }} · {{ item.status }}</small></span>
                      <em>{{ item.view }}</em>
                    </button>
                  </div>
                  <div v-if="!isPatientDischarged" class="avatar-actions">
                    <button @click="openAvatarAction(activeAvatarZoneRecord.primaryAction)">
                      <v-icon x-small>mdi-note-plus</v-icon>
                      {{ activeAvatarZoneRecord.primaryActionLabel }}
                    </button>
                    <button v-if="!isPatientDischarged && activeAvatarZoneRecord.key === 'skin'" @click="dialogs.woundCare = true">
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
                    <button v-if="avatarPlacements.length" class="danger" @click="openClearAvatarDialog">
                      <v-icon x-small>mdi-eraser-variant</v-icon>
                      Clear avatar
                    </button>
                  </div>
                  <FlowSection
                    :title="$t('clinical360.workspace.cards.selected_zone')"
                    :columns="['Status', 'Evidence', 'Action']"
                    :rows="activeAvatarRows"
                  />
                  <FlowSection
                    :title="$t('clinical360.workspace.cards.placed_devices')"
                    :columns="['Type', 'Region', 'Status']"
                    :rows="avatarPlacementRows"
                  />
                </section>
              </div>

              <FlowSection
                :title="$t('clinical360.workspace.cards.systems_review')"
                required
                :columns="['Status', 'Evidence', 'Action']"
                :rows="avatarSystemRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.cards.care_targets')"
                :columns="['Location', 'Status', 'Next Step']"
                :rows="avatarCareTargetRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.cards.avatar_priorities')"
                :columns="['Reason', 'Owner', 'Next Action']"
                :rows="avatarPriorityRows"
              />
            </section>

            <section v-else-if="selectedChartTab === 'Orders'" class="orders-workspace">
              <div class="orders-command">
                <div>
                  <span>{{ $t('clinical360.workspace.orders') }}</span>
                  <strong>{{ $t('clinical360.workspace.orders_detail') }}</strong>
                </div>
                <div class="orders-quick-actions">
                  <v-btn x-small depressed color="#0369a1" dark @click="openOrderComposer('lab')">
                    <v-icon x-small left>mdi-flask</v-icon>{{ $t('clinical360.workspace.lab') }}
                  </v-btn>
                  <v-btn x-small depressed color="#7c3aed" dark @click="openOrderComposer('imaging')">
                    <v-icon x-small left>mdi-radiology-box</v-icon>{{ $t('clinical360.workspace.imaging') }}
                  </v-btn>
                  <v-btn x-small depressed color="#0f766e" dark @click="openOrderComposer('medication')">
                    <v-icon x-small left>mdi-pill-plus</v-icon>{{ $t('clinical360.workspace.medication') }}
                  </v-btn>
                </div>
              </div>

              <div class="orders-tabs" role="tablist" :aria-label="$t('clinical360.workspace.navigation.order_views')">
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
                  <span>{{ $t('clinical360.workspace.show_home_medications') }}</span>
                </label>
                <label>
                  <span>{{ $t('clinical360.workspace.sort_by') }}</span>
                  <select v-model="orderSortBy">
                    <option v-for="option in orderSortOptions" :key="option" :value="option">{{ option }}</option>
                  </select>
                </label>
                <label>
                  <span>{{ $t('clinical360.workspace.go_to') }}</span>
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
                    <strong>{{ $t('clinical360.workspace.no_orders_view') }}</strong>
                    <span>{{ $t('clinical360.workspace.no_orders_hint') }}</span>
                  </div>
                </div>

                <aside class="order-sidebar-panel">
                  <div class="order-sidebar-tabs">
                    <button type="button" :class="{ active: selectedOrderPanel === 'manage' }" @click="selectedOrderPanel = 'manage'">{{ $t('clinical360.workspace.manage_orders') }}</button>
                    <button type="button" :class="{ active: selectedOrderPanel === 'sets' }" @click="selectedOrderPanel = 'sets'">{{ $t('clinical360.workspace.order_sets') }}</button>
                  </div>

                  <div class="order-provider">
                    <v-icon small color="#0f766e">mdi-account-tie</v-icon>
                    <div>
                      <span>{{ $t('clinical360.workspace.providers') }}</span>
                      <strong>{{ activePatient.provider || activePatient.attending || 'Provider not assigned' }}</strong>
                    </div>
                  </div>

                  <div class="order-search-row">
                    <input v-model="orderSearch" type="search" :placeholder="$t('clinical360.workspace.navigation.place_orders_search')">
                    <button type="button" @click="openOrderComposer(orderMode)">
                      <v-icon x-small>mdi-plus</v-icon>
                      {{ $t('clinical360.nursing.sidebar.new') }}
                    </button>
                  </div>

                  <label class="order-mode-row">
                    <span>{{ $t('clinical360.workspace.select_order_mode') }}</span>
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
                  <span>{{ $t('clinical360.workspace.emar') }}</span>
                  <strong>{{ $t('clinical360.workspace.mar_full') }}</strong>
                </div>
                <div class="emar-command-actions">
                  <v-btn x-small depressed color="#0f766e" dark @click="openMarQuickScan">
                    <v-icon x-small left>mdi-barcode-scan</v-icon>{{ $t('clinical360.workspace.scan_medication') }}
                  </v-btn>
                  <v-btn v-if="canLaunchPrescription" x-small depressed color="#7c3aed" dark @click="openChartDialog('medication')">
                    <v-icon x-small left>mdi-pill-plus</v-icon>{{ $t('clinical360.workspace.medication_order') }}
                  </v-btn>
                </div>
              </div>

              <div class="emar-tabs" role="tablist" :aria-label="$t('clinical360.workspace.navigation.emar_views')">
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
                  <span>{{ $t('clinical360.workspace.go_to') }}</span>
                  <select v-model="marTimeFocus">
                    <option v-for="time in marTimeColumns" :key="time" :value="time">{{ time }}</option>
                  </select>
                </label>
                <label class="emar-toggle">
                  <input v-model="marShowEducation" type="checkbox">
                  <span>{{ $t('clinical360.workspace.show_med_education') }}</span>
                </label>
                <label class="emar-toggle">
                  <input v-model="marHideAdmins" type="checkbox">
                  <span>{{ $t('clinical360.workspace.hide_all_admins') }}</span>
                </label>
                <input v-model="marSearch" class="emar-search" type="search" :placeholder="$t('clinical360.workspace.navigation.medication_search')">
              </div>

              <div class="emar-layout">
                <EmarGrid
                  :medications="visibleEmarMedicationRows"
                  :administrations="currentDayMedicationAdministrations"
                  :time-columns="marTimeColumns"
                  :focus-time="marTimeFocus"
                  :show-education="marShowEducation"
                  @cell-click="onEmarCellClick"
                  @row-action="onEmarRowAction"
                  @open-report="openMarReport"
                  @open-details="med => openOrderComposer('medication', med.orderItem)"
                />

                <aside class="emar-side">
                  <section class="emar-advisories">
                    <header>
                      <v-icon small color="#be123c">mdi-alert-octagon</v-icon>
                      <strong>{{ $t('clinical360.workspace.chart_advisories') }}</strong>
                    </header>
                    <article v-for="advisory in marAdvisories" :key="advisory.title" :class="advisory.level">
                      <strong>{{ advisory.title }}</strong>
                      <span>{{ advisory.detail }}</span>
                    </article>
                  </section>

                  <section class="emar-advisories">
                    <header>
                      <v-icon small color="#0f766e">mdi-school-outline</v-icon>
                      <strong>{{ $t('clinical360.workspace.medication_education') }}</strong>
                    </header>
                    <article v-for="row in marEducationCards" :key="row.label" class="education">
                      <strong>{{ row.label }}</strong>
                      <span>{{ row.detail }}</span>
                    </article>
                  </section>
                </aside>
              </div>
            </section>

            <Patient360MedicationTab
              v-else-if="selectedChartTab === 'Medications'"
              :medications="patientMedications"
              :patient="activePatient"
              :role="currentRole"
              :read-only="isPatientDischarged"
              @prescribe="openMedicationFromCatalog"
            />

            <Patient360LabResultsTab
              v-else-if="selectedChartTab === 'Lab Results'"
              :orders="patientLabOrders"
              :imaging-orders="patientImagingOrders"
              :role="currentRole"
              :read-only="isPatientDischarged"
              @record-result="openContextForm('labResult', $event)"
              @new-order="openOrderComposer('lab')"
              @record-imaging-result="openContextForm('imagingResult', $event)"
              @new-imaging-order="openOrderComposer('imaging')"
            />

            <Patient360WoundManagementTab
              v-else-if="selectedChartTab === 'Wound Management'"
              :wounds="patientWounds"
              :assessments="woundAssessmentMap"
              :photos="patientWoundPhotos"
              :read-only="isPatientDischarged"
              @open-wound="openWoundDialog"
            />

            <section v-else-if="selectedChartTab === 'Notes'" class="flowsheet notes-workspace">
              <div class="action-strip">
                <v-menu v-if="noteMenuOptions.length" offset-y>
                  <template #activator="{ on, attrs }">
                    <v-btn x-small depressed color="#0f766e" dark v-bind="attrs" v-on="on">
                      <v-icon x-small left>mdi-note-plus</v-icon>{{ $t('clinical360.workspace.new_note') }}
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
                  <v-icon x-small left>mdi-medical-bag</v-icon>{{ $t('clinical360.workspace.legacy_medical_note') }}
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
                  <div v-if="!signableNotes.length" class="notes-empty">{{ $t('clinical360.workspace.no_notes') }}</div>

                  <template v-if="legacyNoteEntries.length">
                    <h3 class="legacy-heading">{{ $t('clinical360.workspace.legacy_entries') }}</h3>
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
                        <v-btn v-if="selectedNote.status === 'draft'" x-small text color="#0f766e" @click="editSelectedNote">{{ $t('clinical360.workspace.edit') }}</v-btn>
                        <v-btn v-if="selectedNote.status === 'draft'" x-small depressed color="#0f766e" dark @click="signSelectedNote">
                          <v-icon x-small left>mdi-draw-pen</v-icon>{{ $t('clinical360.workspace.sign') }}
                        </v-btn>
                        <v-btn v-if="selectedNote.status !== 'draft'" x-small text color="#7c3aed" @click="amendSelectedNote">{{ $t('clinical360.workspace.amend') }}</v-btn>
                        <v-btn v-if="selectedNote.status !== 'draft'" x-small text color="#0369a1" :disabled="selectedNote.sharedWithCareTeam" @click="shareSelectedNote">
                          {{ selectedNote.sharedWithCareTeam ? 'Shared' : 'Share' }}
                        </v-btn>
                      </div>
                    </header>
                    <p class="notes-body">{{ selectedNote.body }}</p>

                    <div v-if="amendingNoteId === selectedNote.id" class="amend-box">
                      <v-textarea v-model="amendmentDraft" :label="$t('clinical360.workspace.fields.amendment')" rows="2" dense outlined />
                      <div class="amend-actions">
                        <v-btn x-small text @click="amendingNoteId = null">{{ $t('clinical360.workspace.cancel') }}</v-btn>
                        <v-btn x-small depressed color="#7c3aed" dark @click="submitAmendment">{{ $t('clinical360.workspace.submit_amendment') }}</v-btn>
                      </div>
                    </div>

                    <div v-if="selectedNote.amendments && selectedNote.amendments.length" class="notes-amendments">
                      <h3>{{ $t('clinical360.workspace.amendments') }}</h3>
                      <div v-for="amendment in selectedNote.amendments" :key="amendment.id" class="amendment-row">
                        <span>{{ formatShortDate(amendment.at) }} &middot; {{ amendment.actor }}</span>
                        <p>{{ amendment.body }}</p>
                      </div>
                    </div>
                  </template>
                  <div v-else class="notes-empty-detail">
                    <v-icon size="42" color="#94a3b8">mdi-note-text-outline</v-icon>
                    <span>{{ $t('clinical360.workspace.select_note') }}</span>
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
              :read-only="isPatientDischarged"
              @saved="toastSuccess('Care plan created and added to the patient chart.')"
              @error="toastError($event)"
            />

            <Patient360EducationTab
              v-else-if="selectedChartTab === 'Education'"
              :patient-id="activePatientId"
              :encounter-id="currentEncounterId"
              :admission-id="currentAdmissionId"
              :role="currentRole"
              :read-only="isPatientDischarged"
            />

            <Patient360FlowsheetsTab
              v-else-if="selectedChartTab === 'Flowsheets'"
              :patient-id="activePatientId"
              :encounter-id="currentEncounterId"
              :admission-id="currentAdmissionId"
              :role="currentRole"
              :read-only="isPatientDischarged"
            />

            <Patient360WorkListTab
              v-else-if="selectedChartTab === 'Work List'"
              :tasks="patientTasks"
              :role="currentRole"
              :read-only="isPatientDischarged"
              @new-task="openContextForm('task')"
              @update-status="updateWorkListTask"
              @reminder="handleWorkListReminder"
            />

            <Patient360RoleCoordinationTab
              v-else-if="['Social Services', 'Unit Management', 'Nursing Supervision'].includes(selectedChartTab)"
              :patient-id="activePatientId"
              :patient="findPatientRecord(activePatientId) || activePatient"
              :role="currentRole"
              :workspace-tab="selectedChartTab"
              :tasks="coordinationTasks"
              :documents="patientDocuments"
              :members="visibleCareTeamRows"
              :read-only="isPatientDischarged"
              @open-tab="selectChartTab"
              @saved="toastSuccess"
              @error="toastError"
            />

            <Patient360ImmunizationsTab
              v-else-if="selectedChartTab === 'Immunizations'"
              :patient-id="activePatientId"
              :patient="findPatientRecord(activePatientId) || activePatient"
              :role="currentRole"
              :read-only="isPatientDischarged"
              @saved="toastSuccess('Immunization record saved.')"
            />

            <Patient360CareTeamTab
              v-else-if="selectedChartTab === 'Care Teams'"
              :members="visibleCareTeamRows"
              :patient="activePatient"
              :role="currentRole"
              :read-only="isPatientDischarged"
              @add-member="openContextForm('careTeam')"
              @new-task="openContextForm('task')"
              @handoff="openCommandAction('handoff')"
            />

            <Patient360ChatTab
              v-else-if="selectedChartTab === 'Chat'"
              :patient="activePatient"
              :messages="patientMessages"
              :current-full-name="$store.state.auth.fullName"
              :read-only="isPatientDischarged"
              @send="sendChatMessage"
            />

            <Patient360HandoffTab
              v-else-if="selectedChartTab === 'Handoff'"
              :patient="activePatient"
              :notes="patientNursingNotes"
              :tasks="patientTasks"
              :lab-orders="patientLabOrders"
              :imaging-orders="patientImagingOrders"
              :read-only="isPatientDischarged"
              @new-handoff="openCommandAction('handoff')"
            />

            <Patient360DocumentsTab
              v-else-if="selectedChartTab === 'Documents'"
              :patient-id="activePatientId"
              :documents="patientDocuments"
              :role="currentRole"
              :read-only="isPatientDischarged"
              @file-document="openChartDialog('document')"
              @saved="toastSuccess"
            />

            <Patient360RegistrationTab
              v-else-if="selectedChartTab === 'Registration'"
              :patient-id="activePatientId"
              :patient="findPatientRecord(activePatientId) || activePatient"
              :role="currentRole"
              :read-only="isPatientDischarged"
              @saved="toastSuccess('Registration updated.')"
            />

            <Patient360ProcedureTab
              v-else-if="selectedChartTab === 'Sedation/Procedure Documentation'"
              :patient-id="activePatientId"
              :patient="findPatientRecord(activePatientId) || activePatient"
              :documents="patientDocuments"
              :tasks="patientTasks"
              :role="currentRole"
              :read-only="isPatientDischarged"
              @saved="toastSuccess"
            />

            <section v-else-if="selectedChartTab === 'Navigators'" class="navigator-active-workspace">
              <header class="navigator-active-head">
                <div>
                  <span>{{ activeNavigatorSectionMeta.group || activeNavigator.label }}</span>
                  <strong>{{ navigatorSectionContent.title }}</strong>
                  <p>{{ navigatorSectionContent.description }}</p>
                </div>
                <div class="navigator-section-pager">
                  <button type="button" :title="$t('clinical360.workspace.navigation.previous_subsection')" :aria-label="$t('clinical360.workspace.navigation.previous_subsection')" :disabled="navigatorSectionIndex <= 0" @click="moveNavigatorSection(-1)">
                    <v-icon small>mdi-chevron-up</v-icon>
                  </button>
                  <b>{{ navigatorSectionIndex + 1 }} / {{ activeNavigatorSections.length }}</b>
                  <button type="button" :title="$t('clinical360.workspace.navigation.next_subsection')" :aria-label="$t('clinical360.workspace.navigation.next_subsection')" :disabled="navigatorSectionIndex >= activeNavigatorSections.length - 1" @click="moveNavigatorSection(1)">
                    <v-icon small>mdi-chevron-down</v-icon>
                  </button>
                </div>
              </header>

              <div class="navigator-readiness" :class="navigatorSectionContent.status">
                <div>
                  <span>{{ $t('clinical360.workspace.section_readiness') }}</span>
                  <strong>{{ navigatorSectionContent.readiness }}%</strong>
                </div>
                <div class="navigator-readiness-track" role="progressbar" :aria-valuenow="navigatorSectionContent.readiness" aria-valuemin="0" aria-valuemax="100">
                  <i :style="{ width: `${navigatorSectionContent.readiness}%` }"></i>
                </div>
                <small>{{ navigatorSectionContent.readinessLabel }}</small>
              </div>

              <FlowSection
                :title="navigatorSectionContent.title"
                :columns="navigatorSectionContent.columns"
                :rows="navigatorSectionContent.rows"
                :required="navigatorSectionContent.required"
                :action="isPatientDischarged ? '' : navigatorSectionContent.action"
                @action="openCommandAction"
              />

              <div class="navigator-continuity-grid">
                <article>
                  <header><v-icon x-small color="#0f766e">mdi-source-branch</v-icon><strong>{{ $t('clinical360.workspace.dependencies') }}</strong></header>
                  <ul>
                    <li v-for="item in navigatorSectionContent.dependencies" :key="item.label">
                      <span>{{ item.label }}</span>
                      <b :class="item.status">{{ item.value }}</b>
                    </li>
                  </ul>
                </article>
                <article>
                  <header><v-icon x-small color="#0f766e">mdi-account-arrow-right-outline</v-icon><strong>{{ $t('clinical360.workspace.continuity_ownership') }}</strong></header>
                  <ul>
                    <li><span>{{ $t('clinical360.workspace.primary_owner') }}</span><b>{{ activeNavigatorSectionMeta.owner }}</b></li>
                    <li><span>{{ $t('clinical360.workspace.next_action') }}</span><b>{{ navigatorSectionContent.nextAction }}</b></li>
                    <li><span>{{ $t('clinical360.workspace.patient_state') }}</span><b>{{ isPatientDischarged ? $t('clinical360.workspace.read_only') : $t('clinical360.workspace.active_care') }}</b></li>
                  </ul>
                </article>
              </div>
            </section>

            <section v-else-if="selectedNavigator === 'sdoh'" class="sdoh-section">
              <div class="sdoh-card">
                <div class="section-title purple">
                  <v-icon small color="#6d28d9">mdi-heart</v-icon>
                  Health-Related Social Needs
                </div>
                <div class="sdoh-content">
                  <div class="sdoh-wheel" :aria-label="$t('clinical360.workspace.navigation.sdoh_summary')">
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
                      <strong>{{ $t('clinical360.workspace.today') }}</strong>
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
                  <strong>{{ $t('clinical360.workspace.shift_navigator') }}</strong>
                  <span>{{ activePatient.name }} - active nursing shift</span>
                </div>
                <v-btn v-if="canLaunchNurse" x-small depressed color="#0f766e" dark @click="openChartDialog('nurse')">
                  <v-icon x-small left>mdi-plus</v-icon>{{ $t('clinical360.workspace.new_reading') }}
                </v-btn>
              </div>
              <FlowSection
                :title="$t('clinical360.workspace.navigation.overview')"
                :columns="['Status', 'Owner', 'Action']"
                :rows="shiftOverviewRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.signed_held_orders')"
                :columns="['Type', 'Status', 'Detail']"
                :rows="signedHeldOrderRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.release_orders')"
                :columns="['Status', 'Owner', 'Action']"
                :rows="releaseOrderRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.care_everywhere')"
                :columns="['Authorization', 'Last Update', 'Action']"
                :rows="careEverywhereRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.quick_links')"
                :columns="['Destination', 'Status', 'Action']"
                :rows="quickLinkRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.delirium_gcs')"
                required
                :columns="flowColumns"
                :rows="deliriumRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.specimen_notification')"
                :columns="['Status', 'Owner', 'Due']"
                :rows="specimenNotificationRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.assessments')"
                :columns="['Last Filed']"
                :rows="visibleAssessmentRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.clinical_alerts')"
                :columns="['Status', 'Source', 'Action']"
                :rows="clinicalAlertRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.vitals_pain')"
                required
                :columns="patientVitals.length ? ['Last Filed'] : flowColumns"
                :rows="visibleVitalRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.head_to_toe')"
                :columns="['Last Filed', 'Concern', 'Action']"
                :rows="headToToeRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.iv_assessment')"
                :columns="['Site', 'Status', 'Action']"
                :rows="ivAssessmentRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.intake_output')"
                :columns="flowColumns"
                :rows="intakeRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.sepsis_screen')"
                :columns="flowColumns"
                :rows="sepsisRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.rounds_safety_fall')"
                :columns="['Status', 'Risk', 'Action']"
                :rows="safetyFallRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.comfort_hygiene')"
                :columns="['Status', 'Need', 'Action']"
                :rows="comfortHygieneRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.functional_quality')"
                :columns="['Status', 'Baseline', 'Goal']"
                :rows="mobilityQualityRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.plan_of_care')"
                :columns="['Owner', 'Status', 'Next Step']"
                :rows="carePlanRows"
              />
            </section>

            <section v-else-if="selectedNavigator === 'admission'" class="navigator-workspace">
              <div class="navigator-banner">
                <div>
                  <strong>{{ $t('clinical360.workspace.admission_navigator') }}</strong>
                  <span>{{ $t('clinical360.workspace.admission_navigator_detail') }}</span>
                </div>
                <v-btn x-small depressed color="#0f766e" dark @click="openChartDialog('document')">
                  <v-icon x-small left>mdi-file-plus</v-icon>{{ $t('clinical360.workspace.file_admission_document') }}
                </v-btn>
              </div>
              <FlowSection
                :title="$t('clinical360.workspace.navigation.signed_held_orders')"
                :columns="['Type', 'Status', 'Detail']"
                :rows="signedHeldOrderRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.release_orders')"
                :columns="['Status', 'Owner', 'Action']"
                :rows="releaseOrderRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.outside_records')"
                :columns="['Authorization', 'Last Update', 'Action']"
                :rows="careEverywhereRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.quick_links')"
                :columns="['Destination', 'Status', 'Action']"
                :rows="admissionQuickLinkRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.documentation_review')"
                :columns="['Status', 'Owner', 'Action']"
                :rows="admissionDocumentationRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.intake_output')"
                :columns="flowColumns"
                :rows="intakeRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.delirium_gcs')"
                required
                :columns="flowColumns"
                :rows="deliriumRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.sepsis_screen')"
                :columns="flowColumns"
                :rows="sepsisRows"
              />
            </section>

            <section v-else-if="selectedNavigator === 'discharge'" class="navigator-workspace">
              <div class="navigator-banner">
                <div>
                  <strong>{{ $t('clinical360.workspace.discharge_navigator') }}</strong>
                  <span>{{ $t('clinical360.workspace.discharge_navigator_detail') }}</span>
                </div>
                <v-btn x-small depressed color="#0f766e" dark @click="openChartDialog('discharge')">
                  <v-icon x-small left>mdi-logout-variant</v-icon>{{ $t('clinical360.workspace.file_discharge_bundle') }}
                </v-btn>
              </div>
              <div class="discharge-summary">
                <div>
                  <h3>{{ $t('clinical360.workspace.expected_discharge') }}</h3>
                  <div class="segmented">
                    <button>{{ $t('clinical360.workspace.today') }}</button>
                    <button class="active">{{ $t('clinical360.workspace.tomorrow') }}</button>
                    <button>{{ $t('clinical360.workspace.later') }}</button>
                  </div>
                </div>
                <div>
                  <h3>{{ $t('clinical360.workspace.medical_discharge_readiness') }}</h3>
                  <div class="segmented">
                    <button>{{ $t('clinical360.workspace.ready_now') }}</button>
                    <button class="active">{{ $t('clinical360.workspace.not_yet_ready') }}</button>
                  </div>
                </div>
                <div>
                  <h3>{{ $t('clinical360.workspace.expected_time') }}</h3>
                  <div class="segmented">
                    <button>{{ $t('clinical360.workspace.morning') }}</button>
                    <button>{{ $t('clinical360.workspace.midday') }}</button>
                    <button class="active">{{ $t('clinical360.workspace.afternoon') }}</button>
                    <button>{{ $t('clinical360.workspace.evening') }}</button>
                  </div>
                </div>
                <div>
                  <h3>{{ $t('clinical360.workspace.discharge_comment') }}</h3>
                  <p class="planning-comment">
                    {{ latestNursingNote ? latestNursingNote.observation || latestNursingNote.response : 'No discharge planning comment filed' }}
                  </p>
                </div>
              </div>

              <FlowSection
                :title="$t('clinical360.workspace.navigation.discharge_milestones')"
                :columns="['Status', 'Owner', 'Due']"
                :rows="dischargeRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.quality_discharge')"
                :columns="['Status', 'Owner', 'Action']"
                :rows="dischargeQualityRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.discharge_documentation')"
                :columns="['Status', 'Owner', 'Action']"
                :rows="dischargeDocumentationRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.discharge_instructions')"
                required
                :columns="['Status', 'Owner', 'Action']"
                :rows="dischargeInstructionRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.follow_up_avs')"
                :columns="['Status', 'Owner', 'Action']"
                :rows="afterVisitSummaryRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.pain_impact')"
                :columns="['Last Filed', 'Owner', 'Action']"
                :rows="painImpactRows"
              />
            </section>

            <section v-else-if="selectedNavigator === 'transfer'" class="navigator-workspace">
              <div class="navigator-banner">
                <div>
                  <strong>{{ $t('clinical360.workspace.transfer_navigator') }}</strong>
                  <span>{{ $t('clinical360.workspace.transfer_navigator_detail') }}</span>
                </div>
                <v-btn x-small depressed color="#0f766e" dark @click="openChartDialog('document')">
                  <v-icon x-small left>mdi-printer-check</v-icon>{{ $t('clinical360.workspace.file_transfer_packet') }}
                </v-btn>
              </div>
              <FlowSection
                :title="$t('clinical360.workspace.navigation.pre_procedure')"
                required
                :columns="['Current admission']"
                :rows="transferRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.ticket_procedure')"
                :columns="['Status']"
                :rows="ticketRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.print_procedure_packet')"
                :columns="['Status', 'Owner', 'Action']"
                :rows="transferPrintRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.transfer_xray')"
                :columns="['Status', 'Destination', 'Action']"
                :rows="transferXrayRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.ticket_xray')"
                :columns="['Status', 'Destination', 'Action']"
                :rows="ticketXrayRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.patient_return')"
                :columns="['Status', 'Owner', 'Action']"
                :rows="patientReturnRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.handoff')"
                :columns="['Status', 'Owner', 'Concern']"
                :rows="handoffRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.vitals_monitoring')"
                required
                :columns="patientVitals.length ? ['Last Filed'] : flowColumns"
                :rows="visibleVitalRows"
              />
            </section>

            <section v-else-if="selectedNavigator === 'mar'" class="flowsheet">
              <div class="navigator-banner">
                <div>
                  <strong>{{ $t('clinical360.workspace.mar_full') }}</strong>
                  <span>{{ $t('clinical360.workspace.mar_navigator_detail') }}</span>
                </div>
                <v-btn x-small depressed color="#0f766e" dark @click="selectChartTab('MAR')">
                  <v-icon x-small left>mdi-open-in-new</v-icon>{{ $t('clinical360.workspace.open_full_emar') }}
                </v-btn>
              </div>
              <FlowSection
                :title="$t('clinical360.workspace.navigation.mar')"
                :columns="['0600', '1000', '1400', '1800']"
                :rows="visibleMarRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.medication_education')"
                :columns="['Status', 'Route', 'Instructions']"
                :rows="medicationProfileRows"
              />
            </section>

            <section v-else-if="selectedNavigator === 'vitals'" class="flowsheet">
              <FlowSection
                :title="$t('clinical360.workspace.navigation.vitals_pain')"
                required
                :columns="patientVitals.length ? ['Last Filed'] : flowColumns"
                :rows="visibleVitalRows"
              />
              <FlowSection
                :title="$t('clinical360.workspace.navigation.nursing_assessment')"
                :columns="latestVisit && latestVisit.assessment ? ['Last Filed'] : flowColumns"
                :rows="visibleAssessmentRows"
              />
            </section>

            <section v-else-if="selectedNavigator === 'careteam'" class="flowsheet">
              <FlowSection
                :title="$t('clinical360.workspace.navigation.encounter_team')"
                :columns="['Role', 'Shift', 'Contact']"
                :rows="visibleCareTeamRows"
              />
            </section>

            <section v-else-if="selectedNavigator === 'worklist'" class="flowsheet">
              <FlowSection
                :title="$t('clinical360.workspace.navigation.work_list')"
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
        :medical-history="translatedMedicalHistory"
        :can-see-clinical-history="canSeeClinicalHistory"
        :can-view-orders="canViewOrders"
        :active-orders="visibleActiveOrders"
        :lab-orders="patientLabOrders"
        :imaging-orders="patientImagingOrders"
        :tasks="patientTasks"
        :care-team-rows="visibleCareTeamRows"
        :read-only="isPatientDischarged"
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
            <span>{{ $t('clinical360.workspace.nursing_encounter') }}</span>
            <strong>{{ activePatient.name }}</strong>
          </div>
          <v-btn icon small @click="closeChartDialog('nurse')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="nurseFormRef" v-model="forms.nurseValid">
            <div class="dialog-grid three">
              <v-text-field v-model="forms.nurse.vitals.bp" :label="$t('clinical360.workspace.fields.bp')" dense outlined hide-details />
              <v-text-field v-model.number="forms.nurse.vitals.hr" :label="$t('clinical360.workspace.fields.hr')" type="number" dense outlined hide-details />
              <v-text-field v-model.number="forms.nurse.vitals.rr" :label="$t('clinical360.workspace.fields.rr')" type="number" dense outlined hide-details />
              <v-text-field v-model.number="forms.nurse.vitals.temp" :label="$t('clinical360.workspace.fields.temperature')" type="number" step="0.1" dense outlined hide-details />
              <v-text-field v-model.number="forms.nurse.vitals.spo2" :label="$t('clinical360.workspace.fields.spo2')" type="number" dense outlined hide-details />
              <v-text-field v-model.number="forms.nurse.vitals.pain" :label="$t('clinical360.workspace.fields.pain_10')" type="number" min="0" max="10" dense outlined hide-details />
            </div>
            <div class="dialog-grid three mt-3">
              <v-select v-model.number="forms.nurse.vitals.gcsE" :items="gcsEyeOptions" item-text="text" item-value="value" :label="$t('clinical360.workspace.fields.gcs_eye')" dense outlined hide-details />
              <v-select v-model.number="forms.nurse.vitals.gcsV" :items="gcsVerbalOptions" item-text="text" item-value="value" :label="$t('clinical360.workspace.fields.gcs_verbal')" dense outlined hide-details />
              <v-select v-model.number="forms.nurse.vitals.gcsM" :items="gcsMotorOptions" item-text="text" item-value="value" :label="$t('clinical360.workspace.fields.gcs_motor')" dense outlined hide-details />
            </div>
            <div class="dialog-grid two mt-3">
              <v-text-field v-model="forms.nurse.encounter.chiefComplaint" :label="$t('clinical360.workspace.fields.chief_complaint')" dense outlined :rules="[requiredRule]" />
              <v-select v-model="forms.nurse.encounter.triageLevel" :items="triageLevels" :label="$t('clinical360.workspace.fields.triage')" dense outlined />
            </div>
            <v-textarea v-model="forms.nurse.encounter.historyOfIllness" :label="$t('clinical360.workspace.fields.history_illness')" rows="2" dense outlined />
            <div class="dialog-grid two">
              <v-select v-model="forms.nurse.assessment.generalCondition" :items="generalConditionOptions" :label="$t('clinical360.workspace.fields.general_condition')" dense outlined />
              <v-select v-model="forms.nurse.assessment.consciousness" :items="consciousnessOptions" :label="$t('clinical360.workspace.fields.consciousness')" dense outlined />
              <v-select v-model="forms.nurse.assessment.respiratoryStatus" :items="respiratoryOptions" :label="$t('clinical360.workspace.fields.respiratory_status')" dense outlined />
              <v-select v-model="forms.nurse.assessment.nursingProblems" :items="nursingProblemsList" :label="$t('clinical360.workspace.fields.nursing_problems')" multiple chips small-chips dense outlined />
            </div>
            <v-select v-model="forms.nurse.note.actions" :items="nursingActionsList" :label="$t('clinical360.workspace.fields.nursing_actions')" multiple chips small-chips dense outlined />
            <v-textarea v-model="forms.nurse.note.observation" :label="$t('clinical360.workspace.fields.observation')" rows="2" dense outlined />
            <v-textarea v-model="forms.nurse.note.response" :label="$t('clinical360.workspace.fields.patient_response_follow_up')" rows="2" dense outlined />
          </v-form>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <span>GCS {{ nurseGcsScore }}/15</span>
          <v-spacer />
          <v-btn text small @click="closeChartDialog('nurse')">{{ $t('clinical360.workspace.cancel') }}</v-btn>
          <v-btn depressed color="#0f766e" dark small :loading="savingDialog" @click="saveNurseEncounter">
            <v-icon x-small left>mdi-content-save</v-icon>{{ $t('clinical360.workspace.file_to_360') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.medical" max-width="860" persistent scrollable>
      <v-card class="chart-dialog">
        <v-card-title class="dialog-title">
          <div>
            <span>{{ $t('clinical360.workspace.medical_note') }}</span>
            <strong>{{ activePatient.name }}</strong>
          </div>
          <v-btn icon small @click="closeChartDialog('medical')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="medicalFormRef" v-model="forms.medicalValid">
            <v-text-field v-model="forms.medical.chiefComplaint" :label="$t('clinical360.workspace.fields.chief_complaint')" dense outlined :rules="[requiredRule]" />
            <v-textarea v-model="forms.medical.clinicalFindings" :label="$t('clinical360.workspace.fields.clinical_findings')" rows="3" dense outlined />
            <div class="dialog-grid two">
              <v-text-field v-model="forms.medical.diagnosis" :label="$t('clinical360.workspace.fields.diagnosis')" dense outlined :rules="[requiredRule]" />
              <v-select v-model="forms.medical.severity" :items="severityOptions" :label="$t('clinical360.workspace.fields.severity')" dense outlined />
            </div>
            <v-textarea v-model="forms.medical.plan" :label="$t('clinical360.workspace.fields.plan_treatment')" rows="3" dense outlined />
            <v-textarea v-model="forms.medical.instructions" :label="$t('clinical360.workspace.fields.patient_instructions')" rows="2" dense outlined />
          </v-form>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn text small @click="closeChartDialog('medical')">{{ $t('clinical360.workspace.cancel') }}</v-btn>
          <v-btn depressed color="#1d4ed8" dark small :loading="savingDialog" @click="saveMedicalNote">
            <v-icon x-small left>mdi-content-save</v-icon>{{ $t('clinical360.workspace.file_to_360') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.lab" max-width="680" persistent scrollable>
      <v-card class="chart-dialog">
        <v-card-title class="dialog-title">
          <div>
            <span>{{ $t('clinical360.workspace.laboratory_order') }}</span>
            <strong>{{ activePatient.name }}</strong>
          </div>
          <v-btn icon small @click="closeChartDialog('lab')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="labFormRef" v-model="forms.orderValid">
            <div class="dialog-grid two">
              <v-text-field v-model="forms.order.lab.testName" :label="$t('clinical360.workspace.fields.lab_test')" dense outlined :rules="[requiredRule]" />
              <v-select v-model="forms.order.lab.priority" :items="priorityOptions" :label="$t('clinical360.workspace.fields.priority')" dense outlined />
            </div>
            <v-textarea v-model="forms.order.instructions" :label="$t('clinical360.workspace.fields.specimen_instructions')" rows="2" dense outlined />
          </v-form>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn text small @click="closeChartDialog('lab')">{{ $t('clinical360.workspace.cancel') }}</v-btn>
          <v-btn depressed color="#0369a1" dark small :loading="savingDialog" @click="saveLabOrder">
            <v-icon x-small left>mdi-flask</v-icon>{{ $t('clinical360.workspace.place_lab_order') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.imaging" max-width="680" persistent scrollable>
      <v-card class="chart-dialog">
        <v-card-title class="dialog-title">
          <div>
            <span>{{ $t('clinical360.workspace.imaging_order') }}</span>
            <strong>{{ activePatient.name }}</strong>
          </div>
          <v-btn icon small @click="closeChartDialog('imaging')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="imagingFormRef" v-model="forms.orderValid">
            <div class="dialog-grid two">
              <v-text-field v-model="forms.order.imaging.modality" :label="$t('clinical360.workspace.fields.modality_exam')" dense outlined :rules="[requiredRule]" />
              <v-select v-model="forms.order.imaging.priority" :items="priorityOptions" :label="$t('clinical360.workspace.fields.priority')" dense outlined />
            </div>
            <v-textarea v-model="forms.order.instructions" :label="$t('clinical360.workspace.fields.protocol_notes')" rows="2" dense outlined />
          </v-form>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn text small @click="closeChartDialog('imaging')">{{ $t('clinical360.workspace.cancel') }}</v-btn>
          <v-btn depressed color="#7c3aed" dark small :loading="savingDialog" @click="saveImagingOrder">
            <v-icon x-small left>mdi-radiology-box</v-icon>{{ $t('clinical360.workspace.place_imaging_order') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.medication" max-width="760" persistent scrollable>
      <v-card class="chart-dialog">
        <v-card-title class="dialog-title">
          <div>
            <span>{{ $t('clinical360.workspace.medication_order') }}</span>
            <strong>{{ activePatient.name }}</strong>
          </div>
          <v-btn icon small @click="closeChartDialog('medication')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="medicationFormRef" v-model="forms.orderValid">
            <div class="dialog-grid two">
              <v-autocomplete v-model="forms.order.medication.medication" :items="orderDrugSuggestions" item-text="name" item-value="name"
                :label="$t('clinical360.workspace.fields.medication')" dense outlined :disabled="!orderDrugSuggestions.length"
                :placeholder="orderDrugSuggestions.length ? $t('clinical360.workspace.fields.select_catalog_medication') : $t('clinical360.workspace.fields.no_catalog_medication')"
                :rules="[requiredRule, () => !!orderSelectedCatalogItem || 'Must be selected from the official price catalog']">
                <template #append-outer>
                  <v-btn v-if="currentRole === 'ADMIN'" icon small :title="$t('clinical360.workspace.fields.add_catalog_drug')" :to="'/admin/tarification'" target="_blank">
                    <v-icon small>mdi-tag-plus-outline</v-icon>
                  </v-btn>
                </template>
              </v-autocomplete>
              <v-text-field v-model="forms.order.medication.dosage" :label="$t('clinical360.workspace.fields.dose')" dense outlined :rules="[requiredRule]" />
              <v-select v-model="forms.order.medication.route" :items="medicationRoutes" :label="$t('clinical360.workspace.fields.route')" dense outlined :rules="[requiredRule]" />
              <v-text-field v-model="forms.order.medication.frequency" :label="$t('clinical360.workspace.fields.frequency')" dense outlined :rules="[requiredRule]" />
              <v-text-field v-model="forms.order.medication.medicationClass" :label="$t('clinical360.workspace.fields.medication_class')" dense outlined readonly />
              <v-text-field v-model="forms.order.medication.indication" :label="$t('clinical360.workspace.fields.clinical_indication')" dense outlined />
              <v-select v-model="forms.order.medication.form" :items="medicationForms" :label="$t('clinical360.workspace.fields.form')" dense outlined :rules="[requiredRule]" />
              <v-select v-model="forms.order.medication.priority" :items="priorityOptions" :label="$t('clinical360.workspace.fields.priority')" dense outlined />
            </div>
            <v-textarea v-model="forms.order.instructions" :label="$t('clinical360.workspace.fields.administration_instructions')" rows="2" dense outlined />
            <div v-if="forms.order.medication.sideEffects || forms.order.medication.education || forms.order.medication.safetyWarnings" class="medication-order-support">
              <div v-if="forms.order.medication.sideEffects"><strong>{{ $t('clinical360.workspace.common_side_effects') }}</strong><span>{{ forms.order.medication.sideEffects }}</span></div>
              <div v-if="forms.order.medication.education"><strong>{{ $t('clinical360.workspace.patient_education') }}</strong><span>{{ forms.order.medication.education }}</span></div>
              <div v-if="forms.order.medication.safetyWarnings" class="warning"><strong>{{ $t('clinical360.workspace.safety_verification') }}</strong><span>{{ forms.order.medication.safetyWarnings }}</span></div>
            </div>
          </v-form>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn text small @click="closeChartDialog('medication')">{{ $t('clinical360.workspace.cancel') }}</v-btn>
          <v-btn depressed color="#0f766e" dark small :loading="savingDialog" :disabled="!orderSelectedCatalogItem" @click="saveMedicationOrder">
            <v-icon x-small left>mdi-pill-plus</v-icon>{{ $t('clinical360.workspace.place_medication_order') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.marAction" max-width="720" persistent scrollable>
      <v-card class="chart-dialog">
        <v-card-title class="dialog-title">
          <div>
            <span>{{ $t('clinical360.workspace.emar_documentation') }}</span>
            <strong>{{ selectedMarMedication ? selectedMarMedication.label : activePatient.name }}</strong>
          </div>
          <v-btn icon small @click="closeChartDialog('marAction')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="marActionFormRef" v-model="forms.marValid">
            <div class="dialog-grid three">
              <v-select v-model="forms.mar.action" :items="marActionOptions" :label="$t('clinical360.workspace.fields.action')" dense outlined />
              <v-select v-model="forms.mar.time" :items="marTimeColumns" :label="$t('clinical360.workspace.fields.time')" dense outlined />
              <v-text-field v-model="forms.mar.barcode" :label="$t('clinical360.workspace.fields.barcode')" dense outlined />
            </div>
            <div class="dialog-grid two mt-3">
              <v-text-field v-model="forms.mar.dose" :label="$t('clinical360.workspace.fields.dose_administered')" dense outlined />
              <v-text-field v-model="forms.mar.site" :label="$t('clinical360.workspace.fields.site_line')" dense outlined />
            </div>
            <v-alert v-if="selectedMarMedication" dense text color="#0f766e" class="mb-3">
              <strong>{{ $t('clinical360.workspace.administration_instructions') }}</strong>
              {{ selectedMarMedication.administrationInstructions }}
            </v-alert>
            <v-textarea v-model="forms.mar.comment" :label="$t('clinical360.workspace.fields.clinical_comment')" rows="2" dense outlined />
            <v-textarea v-model="forms.mar.patientResponse" :label="$t('clinical360.workspace.fields.patient_response_education')" rows="2" dense outlined />
          </v-form>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <span>{{ selectedMarMedication ? selectedMarMedication.detail : 'Medication administration' }}</span>
          <v-spacer />
          <v-btn text small @click="closeChartDialog('marAction')">{{ $t('clinical360.workspace.cancel') }}</v-btn>
          <v-btn depressed color="#0f766e" dark small :loading="savingDialog" @click="saveMarAction">
            <v-icon x-small left>mdi-content-save-check</v-icon>{{ $t('clinical360.workspace.file_emar_action') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.marReport" max-width="760" scrollable>
      <v-card class="chart-dialog">
        <v-card-title class="dialog-title">
          <div>
            <span>{{ $t('clinical360.workspace.administration_report') }}</span>
            <strong>{{ selectedMarMedication ? selectedMarMedication.label : '' }}</strong>
          </div>
          <v-btn icon small @click="dialogs.marReport = false"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="marReportHeaders"
            :items="marReportRows"
            :items-per-page="10"
            dense
            no-data-text="No administration history filed yet for this medication."
          >
            <template #item.status="{ item }">
              <v-chip x-small :color="marReportStatusColor(item.status)" dark>{{ item.status }}</v-chip>
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn text small @click="dialogs.marReport = false">{{ $t('clinical360.workspace.close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.document" max-width="720" persistent scrollable>
      <v-card class="chart-dialog">
        <v-card-title class="dialog-title">
          <div>
            <span>{{ $t('clinical360.workspace.clinical_document') }}</span>
            <strong>{{ activePatient.name }}</strong>
          </div>
          <v-btn icon small @click="closeChartDialog('document')"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="documentFormRef" v-model="forms.documentValid">
            <div class="dialog-grid two">
              <v-text-field v-model="forms.document.title" :label="$t('clinical360.workspace.fields.document_title')" dense outlined :rules="[requiredRule]" />
              <v-select v-model="forms.document.category" :items="documentCategories" :label="$t('clinical360.workspace.fields.category')" dense outlined />
            </div>
            <v-textarea v-model="forms.document.content" :label="$t('clinical360.workspace.fields.document_content')" rows="6" dense outlined />
          </v-form>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn text small @click="closeChartDialog('document')">{{ $t('clinical360.workspace.cancel') }}</v-btn>
          <v-btn depressed color="#0f766e" dark small :loading="savingDialog" @click="saveDocumentDialog">
            <v-icon x-small left>mdi-file-check</v-icon>{{ $t('clinical360.workspace.file_document') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.avatarPlacement" max-width="720" persistent scrollable>
      <v-card class="chart-dialog avatar-placement-dialog">
        <v-card-title class="dialog-title">
          <div>
            <span>{{ $t('clinical360.workspace.avatar_device_map') }}</span>
            <strong>{{ avatarPlacementDialogTitle }}</strong>
          </div>
          <v-btn icon small @click="closeAvatarPlacementDialog"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-alert v-if="isPatientDischarged" tile dense color="#475569" dark class="mb-3">
            <v-icon left small color="white">mdi-lock-outline</v-icon>
            Discharged chart. This mapped element is available for review only.
          </v-alert>
          <v-form ref="avatarPlacementFormRef" v-model="forms.avatarPlacementValid">
          <div class="dialog-grid two">
            <v-select
              v-model="forms.avatarPlacement.type"
              :items="avatarPlacementTools"
              item-text="label"
              item-value="key"
              :label="$t('clinical360.workspace.fields.element')"
              dense
              outlined
              :disabled="avatarPlacementIsPersisted || isPatientDischarged"
              :rules="[requiredRule]"
              @change="syncAvatarPlacementType"
            />
            <v-text-field v-model="forms.avatarPlacement.region" :label="$t('clinical360.workspace.fields.anatomical_region')" dense outlined :readonly="isPatientDischarged" :rules="[requiredRule]" />
            <v-select v-model="forms.avatarPlacement.status" :items="avatarPlacementStatusOptions" :label="$t('clinical360.workspace.fields.clinical_status')" dense outlined :disabled="isPatientDischarged" :rules="[requiredRule]" />
            <v-text-field v-model="forms.avatarPlacement.view" :label="$t('clinical360.workspace.fields.view')" dense outlined readonly />
            <v-text-field v-model="forms.avatarPlacement.indication" :label="avatarPlacementIndicationLabel" dense outlined :readonly="isPatientDischarged" :rules="avatarPlacementRequiresIndication ? [requiredRule] : []" />
            <v-text-field v-model="forms.avatarPlacement.insertedAt" type="datetime-local" :label="avatarPlacementDateLabel" dense outlined :readonly="isPatientDischarged" />
            <v-text-field v-model="forms.avatarPlacement.nextReviewAt" type="datetime-local" :label="$t('clinical360.workspace.fields.next_review')" dense outlined :readonly="isPatientDischarged" />
            <v-text-field v-if="avatarPlacementShowsSize" v-model="forms.avatarPlacement.sizeGauge" :label="avatarPlacementSizeLabel" dense outlined :readonly="isPatientDischarged" />
            <v-text-field v-if="avatarPlacementShowsOutput" v-model="forms.avatarPlacement.output" :label="avatarPlacementOutputLabel" dense outlined :readonly="isPatientDischarged" />
            <v-select v-if="forms.avatarPlacement.type === 'pain'" v-model="forms.avatarPlacement.painScore" :items="painScoreOptions" :label="$t('clinical360.workspace.fields.pain_score')" dense outlined :disabled="isPatientDischarged" />
            <v-text-field v-model="forms.avatarPlacement.siteCondition" :label="$t('clinical360.workspace.fields.site_condition')" dense outlined :readonly="isPatientDischarged" />
            <v-text-field v-model="forms.avatarPlacement.siteCare" :label="avatarPlacementSiteCareLabel" dense outlined :readonly="isPatientDischarged" />
            <v-text-field v-model="forms.avatarPlacement.dressing" :label="$t('clinical360.workspace.fields.dressing_securement')" dense outlined :readonly="isPatientDischarged" />
            <v-text-field ref="avatarRemovalReason" v-if="avatarPlacementIsEnding" v-model="forms.avatarPlacement.removalReason" :label="$t('clinical360.workspace.fields.removal_reason')" dense outlined :readonly="isPatientDischarged" :rules="[requiredRule]" />
          </div>
          <v-textarea
            v-model="forms.avatarPlacement.notes"
            :label="avatarPlacementNotesLabel"
            rows="4"
            dense
            outlined
            :readonly="isPatientDischarged"
          />
          <div class="avatar-placement-hint">
            <v-icon small color="#0f766e">mdi-map-marker-radius</v-icon>
            <span>{{ forms.avatarPlacement.label }} placed on {{ forms.avatarPlacement.region }} at {{ forms.avatarPlacement.x }}%, {{ forms.avatarPlacement.y }}%.</span>
          </div>
          </v-form>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-btn
            v-if="avatarPlacementIsPersisted && !isPatientDischarged"
            text
            color="#be123c"
            small
            @click="prepareAvatarPlacementRemoval"
          >
            <v-icon x-small left>mdi-medical-bag</v-icon>{{ $t('clinical360.workspace.end_remove') }}
          </v-btn>
          <v-spacer />
          <v-btn text small @click="closeAvatarPlacementDialog">{{ isPatientDischarged ? 'Close' : 'Cancel' }}</v-btn>
          <v-btn v-if="!isPatientDischarged" depressed color="#0f766e" dark small :loading="savingDialog" @click="saveAvatarPlacement">
            <v-icon x-small left>mdi-content-save</v-icon>{{ $t('clinical360.workspace.save_location') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.clearAvatar" max-width="560" persistent>
      <v-card class="chart-dialog">
        <v-card-title class="dialog-title">
          <div><span>{{ $t('clinical360.workspace.avatar_safety_action') }}</span><strong>{{ $t('clinical360.workspace.clear_active_markers') }}</strong></div>
          <v-btn icon small @click="dialogs.clearAvatar = false"><v-icon small>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-alert tile dense type="warning" text class="mb-4">
            This will remove {{ avatarPlacements.length }} marker(s) from the visible body map. Wounds, device records, notes and audit history will remain available.
          </v-alert>
          <v-textarea v-model.trim="avatarClearReason" :label="$t('clinical360.workspace.fields.clear_avatar_reason')" rows="3" dense outlined :rules="[requiredRule]" :placeholder="$t('clinical360.workspace.fields.clear_avatar_example')" />
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn text small @click="dialogs.clearAvatar = false">{{ $t('clinical360.workspace.cancel') }}</v-btn>
          <v-btn depressed color="#b91c1c" dark small :disabled="!avatarClearReason" :loading="savingDialog" @click="clearAvatarMarkers">
            <v-icon x-small left>mdi-eraser-variant</v-icon>{{ $t('clinical360.workspace.clear_visible_markers') }}
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
      @error="toastError"
    />
    <WoundCareDialog
      :open="dialogs.woundCare"
      :patient-id="activePatientId"
      :author-role="currentRole"
      :initial-wound-id="selectedWoundForDialogId"
      :read-only="isPatientDischarged"
      @close="closeChartDialog('woundCare')"
      @saved="handleWoundSaved"
    />
    <CarePlanDialog
      :open="dialogs.carePlan"
      :patient-id="activePatientId"
      :author-role="currentRole"
      @close="closeChartDialog('carePlan')"
      @saved="handleCarePlanSaved"
      @error="toastError"
    />
    <DischargePlanDialog
      :open="dialogs.discharge"
      :patient-id="activePatientId"
      :patient-name="activePatient.name"
      @close="closeChartDialog('discharge')"
      @saved="handleDischargeSaved"
    />
    <PatientBarcodeScannerDialog
      :open="dialogs.scan"
      :patient-id="activePatientId"
      :role="currentRole"
      @close="closeChartDialog('scan')"
      @patient="openScannedPatient"
      @saved="handleWoundPhotoSaved"
      @toast="toastSuccess"
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
    <Patient360ContextForms
      ref="contextForms"
      :patient-id="activePatientId"
      :patient="activePatient"
      :role="currentRole"
      :encounter-id="currentEncounterId"
      :admission-id="currentAdmissionId"
      :lab-orders="patientLabOrders"
      :imaging-orders="patientImagingOrders"
      :read-only="isPatientDischarged"
      @order="openOrderComposer"
      @saved="handleContextFormSaved"
      @error="toastError"
    />
    <v-dialog v-model="dialogs.tabManager" max-width="920" persistent scrollable>
      <v-card class="tab-manager-dialog">
        <v-card-title class="tab-manager-title">
          <div>
            <span>{{ $t('clinical360.workspace.patient_360') }}</span>
            <strong>{{ $t('clinical360.workspace.tab_manager') }}</strong>
          </div>
          <v-spacer></v-spacer>
          <v-btn icon small @click="dialogs.tabManager = false">
            <v-icon small>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <div class="tab-manager-summary">
            <p>{{ $t('clinical360.workspace.tab_manager_hint') }}</p>
            <small>{{ $t('clinical360.workspace.tab_manager_access') }}</small>
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
            <v-icon x-small left>mdi-restore</v-icon>{{ $t('clinical360.workspace.reset_default') }}
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn text @click="dialogs.tabManager = false">{{ $t('clinical360.workspace.done') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Transfer Patient Modal -->
    <v-dialog v-model="showTransferDialog" max-width="500" persistent>
      <v-card tile flat class="b-1 pa-0">
        <div class="pa-4 white--text font-weight-black text-caption uppercase d-flex align-center justify-space-between" style="background:#003366!important; color:white!important;">
          <span>{{ $t('clinical360.workspace.transfer_patient_care') }}</span>
          <v-btn icon x-small dark @click="showTransferDialog = false"><v-icon small color="white">mdi-close</v-icon></v-btn>
        </div>
        <div class="pa-6" style="background:white;">
          <div class="mb-4">
            <span class="text-caption font-weight-black grey--text text-uppercase">{{ $t('clinical360.workspace.patient') }}</span>
            <div class="text-body-2 font-weight-black">{{ activePatient.name }} ({{ activePatientId }})</div>
            <div class="text-caption grey--text">{{ $t('clinical360.workspace.current_department') }} : <strong>{{ activePatientRecord ? (activePatientRecord.currentDepartment || $t('clinical360.workspace.general_medicine')) : $t('clinical360.workspace.general_medicine') }}</strong></div>
          </div>
          <v-divider class="mb-4" />
          <v-select
            v-model="transferForm.targetDepartment"
            :items="availableTransferDepartments"
            :label="$t('clinical360.workspace.fields.target_department')"
            outlined tile dense required
            class="mb-3"
          ></v-select>
          <v-textarea
            v-model="transferForm.reason"
            :label="$t('clinical360.workspace.fields.transfer_reason')"
            rows="3"
            outlined tile dense
            class="mb-4"
          ></v-textarea>
          <v-row dense>
            <v-col cols="6">
              <v-btn color="#00A99D" dark block height="44" tile depressed :loading="transferLoading" @click="submitTransfer" class="font-weight-black text-caption">{{ $t('clinical360.workspace.confirm_transfer') }}</v-btn>
            </v-col>
            <v-col cols="6">
              <v-btn color="grey lighten-2" block height="44" tile depressed @click="showTransferDialog = false" class="font-weight-black text-caption">{{ $t('clinical360.workspace.cancel') }}</v-btn>
            </v-col>
          </v-row>
        </div>
      </v-card>
    </v-dialog>
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
import CarePlanDialog from '~/components/clinical/patient360/dialogs/CarePlanDialog.vue'
import DischargePlanDialog from '~/components/clinical/patient360/discharge/DischargePlanDialog.vue'
import PatientBarcodeScannerDialog from '~/components/clinical/patient360/PatientBarcodeScannerDialog.vue'
import Patient360CarePlanTab from '~/components/clinical/patient360/care-plan/Patient360CarePlanTab.vue'
import Patient360EducationTab from '~/components/clinical/patient360/education/Patient360EducationTab.vue'
import Patient360ChartReviewTab from '~/components/clinical/patient360/chart-review/Patient360ChartReviewTab.vue'
import Patient360FlowsheetsTab from '~/components/clinical/patient360/flowsheets/Patient360FlowsheetsTab.vue'
import Patient360LabResultsTab from '~/components/clinical/patient360/labs/Patient360LabResultsTab.vue'
import Patient360MedicationTab from '~/components/clinical/patient360/medications/Patient360MedicationTab.vue'
import EmarGrid from '~/components/clinical/emar/EmarGrid.vue'
import Patient360ChatTab from '~/components/clinical/patient360/chat/Patient360ChatTab.vue'
import Patient360WorkListTab from '~/components/clinical/patient360/work-list/Patient360WorkListTab.vue'
import Patient360CareTeamTab from '~/components/clinical/patient360/care-team/Patient360CareTeamTab.vue'
import Patient360RoleCoordinationTab from '~/components/clinical/patient360/coordination/Patient360RoleCoordinationTab.vue'
import Patient360ImmunizationsTab from '~/components/clinical/patient360/immunizations/Patient360ImmunizationsTab.vue'
import Patient360HandoffTab from '~/components/clinical/patient360/handoff/Patient360HandoffTab.vue'
import Patient360DocumentsTab from '~/components/clinical/patient360/documents/Patient360DocumentsTab.vue'
import Patient360RegistrationTab from '~/components/clinical/patient360/registration/Patient360RegistrationTab.vue'
import Patient360WoundManagementTab from '~/components/clinical/patient360/wounds/Patient360WoundManagementTab.vue'
import Patient360ProcedureTab from '~/components/clinical/patient360/procedure/Patient360ProcedureTab.vue'
import Patient360DoctorCommandCenter from '~/components/clinical/patient360/doctor/Patient360DoctorCommandCenter.vue'
import TimedCareDocumentationDialog from '~/components/clinical/patient360/flowsheets/TimedCareDocumentationDialog.vue'
import BodyAssessmentDialog from '~/components/clinical/patient360/assessment/BodyAssessmentDialog.vue'
import Patient360ContextForms from '~/components/clinical/patient360/dialogs/Patient360ContextForms.vue'
import NavigatorStrip from '~/components/clinical/patient360/NavigatorStrip.vue'
import FlowSection from '~/components/clinical/patient360/FlowSection.vue'
import maleFrontAvatar from '~/assets/images/clinical/avatar/male-front.jpg'
import maleBackAvatar from '~/assets/images/clinical/avatar/male-back.jpg'
import femaleFrontAvatar from '~/assets/images/clinical/avatar/female-front.png'
import femaleBackAvatar from '~/assets/images/clinical/avatar/female-back.png'
const {
  detectAvatarRegion,
  isResolvedAvatarStatus,
  statusOptionsForAvatarType
} = require('~/util/avatar-workflow.cjs')
const { findMedicationCatalogItem } = require('~/util/medication-catalog.cjs')
const { isMedicationOrderForMar, resolveAdministrationInstructions } = require('~/util/medication-workflow.cjs')
const { formatClinicalDate, formatVitalsSummary, resolveDisplayAccount } = require('~/util/patient-display.cjs')
const { canPreviewRole: rolePreviewAllowed } = require('~/util/patient-360-policy.cjs')
const { normalizeSearchValue, matchesPatientQuery, exactPatientIdentifierMatch } = require('~/util/patient-search.cjs')
const { localDayKey, administrationsForLocalDay, latestAdministrationForSlot } = require('~/services/clinical/workflowEngine')

function firstFiledValue(record, keys, fallback = '') {
  for (const key of keys) {
    const value = record && record[key]
    if (value !== undefined && value !== null && String(value).trim()) return String(value)
  }
  return fallback
}

function chartEventStatus(value) {
  const normalized = String(value || '').toLowerCase()
  if (/critical|urgent|worsen|abnormal|positive|overdue|failed|high risk/.test(normalized)) return 'danger'
  if (/pending|draft|requested|due|review|watch|moderate|held/.test(normalized)) return 'warning'
  if (/normal|stable|complete|completed|signed|final|resolved|healed|administered|filed|negative/.test(normalized)) return 'good'
  return 'neutral'
}

const ALL_CLINICAL_TABS = [
  'Summary',
  'EMR Command Center',
  'Doctor Command Center',
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
  'Chat',
  'Handoff',
  'Documents',
  'Registration',
  'Social Services',
  'Unit Management',
  'Nursing Supervision'
]

// Tabs shown directly in the tab bar; everything else in visibleChartTabs collapses into the More menu.
const PRIMARY_TAB_ORDER = ['Summary', 'EMR Command Center', 'Nurse Command Center', 'Chart Review', 'Orders', 'MAR', 'Flowsheets', 'Notes', 'Care Plan']

const ROLE_PRIMARY_TABS = {
  DOCTOR: ['Summary', 'Doctor Command Center', 'Chart Review', 'Orders', 'Lab Results', 'Medications', 'Notes', 'Care Plan', 'Handoff'],
  NP: ['Summary', 'Doctor Command Center', 'Chart Review', 'Orders', 'Lab Results', 'Medications', 'Notes', 'Care Plan', 'Handoff'],
  SOCIAL_WORKER: ['Summary', 'Social Services', 'Notes', 'Care Plan', 'Work List', 'Care Teams', 'Education', 'Documents'],
  MAJOR_SERVICE: ['Summary', 'Unit Management', 'Nurse Command Center', 'Work List', 'Care Teams', 'Notes', 'Handoff', 'Care Plan', 'Documents'],
  NURSING_SUPERVISOR: ['Summary', 'Nursing Supervision', 'Nurse Command Center', 'Work List', 'Care Teams', 'Notes', 'Handoff', 'Documents']
}

const RIGHT_PANEL_DEFAULT_COLLAPSED_TABS = ['Notes', 'Flowsheets', 'MAR', 'Orders']
const CHART_TAB_LAYOUT_KEY = 'camero_health_patient360Tabs'

const ADMIN_LIKE_ROLES = ['ADMIN', 'RECORDS', 'BILLING', 'FRONT_DESK']
const ROLE_COORDINATION_TABS = ['Social Services', 'Unit Management', 'Nursing Supervision']
const GENERAL_CLINICAL_TABS = ALL_CLINICAL_TABS.filter(tab => !ROLE_COORDINATION_TABS.includes(tab) && tab !== 'Doctor Command Center')

const TAB_ACCESS = {
  ADMIN: ALL_CLINICAL_TABS,
  DOCTOR: [...GENERAL_CLINICAL_TABS, 'Doctor Command Center'],
  NP: [...GENERAL_CLINICAL_TABS, 'Doctor Command Center'],
  NURSE: GENERAL_CLINICAL_TABS,
  MIDWIFE: GENERAL_CLINICAL_TABS.filter(tab => tab !== 'Sedation/Procedure Documentation'),
  MAJOR_SERVICE: [...GENERAL_CLINICAL_TABS, 'Unit Management'],
  NURSING_SUPERVISOR: [...GENERAL_CLINICAL_TABS, 'Nursing Supervision'],
  CNA: ['Summary', 'EMR Command Center', 'Nurse Command Center', 'Navigators', 'Flowsheets', 'Work List', 'Care Plan', 'Education', 'Chat', 'Handoff'],
  LAB: ['Summary', 'EMR Command Center', 'Chart Review', 'Navigators', 'Orders', 'Lab Results', 'Work List'],
  IMAGING: ['Summary', 'EMR Command Center', 'Chart Review', 'Navigators', 'Orders', 'Work List', 'Documents'],
  PHARMACY: ['Summary', 'EMR Command Center', 'Chart Review', 'Orders', 'MAR', 'Medications', 'Work List', 'Education'],
  FRONT_DESK: ['Summary', 'EMR Command Center', 'Registration', 'Documents', 'Care Teams'],
  RECORDS: ['Summary', 'EMR Command Center', 'Chart Review', 'Documents', 'Registration', 'Care Teams'],
  BILLING: ['Summary', 'EMR Command Center', 'Registration', 'Documents'],
  SOCIAL_WORKER: ['Summary', 'Social Services', 'EMR Command Center', 'Navigators', 'Notes', 'Care Plan', 'Education', 'Work List', 'Care Teams', 'Handoff', 'Documents'],
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
  components: { FlowSection, PatientBanner, LeftPatientPanel, RightClinicalPanel, TabNav, NoteDialog, WoundCareDialog, CarePlanDialog, DischargePlanDialog, PatientBarcodeScannerDialog, Patient360CarePlanTab, Patient360EducationTab, Patient360ChartReviewTab, Patient360FlowsheetsTab, Patient360LabResultsTab, Patient360MedicationTab, Patient360WorkListTab, Patient360CareTeamTab, Patient360RoleCoordinationTab, Patient360ImmunizationsTab, Patient360HandoffTab, Patient360DocumentsTab, Patient360RegistrationTab, Patient360WoundManagementTab, Patient360ProcedureTab, Patient360DoctorCommandCenter, TimedCareDocumentationDialog, BodyAssessmentDialog, Patient360ContextForms, NavigatorStrip, EmarGrid, Patient360ChatTab },
  props: {
    patientId: { type: String, default: '' },
    patientScoped: { type: Boolean, default: false },
    patientRecord: { type: Object, default: null }
  },
  data() {
    return {
      showTransferDialog: false,
      transferLoading: false,
      transferForm: {
        targetDepartment: 'General Medicine',
        reason: ''
      },
      activeChartId: this.patientId || 'demo-1',
      previewRole: this.$store.state.auth.role || 'NURSE',
      selectedChartTab: 'Summary',
      globalSearchQuery: '',
      globalSearchOpen: false,
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
      avatarZoom: 1,
      AVATAR_ZOOM_MIN: 0.6,
      AVATAR_ZOOM_MAX: 2,
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
      clinicalNowTick: Date.now(),
      clinicalRefreshTimer: null,
      clinicalRefreshDayKey: '',
      selectedMarMedication: null,
      selectedMarAdministrationId: null,
      selectedMarAction: 'given',
      selectedWoundForDialogId: '',
      avatarClearReason: '',
      marTimeColumnsFallback: ['1400', '1500', '1600', '1700', '1800', '1900', '2000'],
      remoteAiCarePlan: null,
      aiCareLoading: false,
      aiCareError: '',
      currentWorkflowState: 'active-care',
      dialogs: {
        nurse: false,
        medical: false,
        lab: false,
        imaging: false,
        medication: false,
        document: false,
        discharge: false,
        scan: false,
        marAction: false,
        marReport: false,
        note: false,
        woundCare: false,
        carePlan: false,
        avatarPlacement: false,
        clearAvatar: false,
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
      medicationForms: ['tablet', 'syrup', 'iv', 'g-tube', 'injection', 'inhaler'],
      marActionOptions: ['Given', 'Held', 'Refused', 'Not scanned', 'Patient education', 'Details reviewed'],
      painScoreOptions: Array.from({ length: 11 }, (_, value) => value),
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
    activePatientRecord() {
      return this.findPatientRecord(this.activePatientId)
    },
    availableTransferDepartments() {
      const model = this.$store.getters['facility/getHospitalModel']
      const depts = (model && model.departments) || []
      const names = depts.map(d => d.name)
      return names.length ? names : ['General Medicine', 'Paediatrics', 'Surgery', 'Obstetrics & Gynecology', 'Cardiology', 'Oncology', 'Emergency', 'ICU']
    },
    activePatientId() {
      return this.patientId || this.activeChartId || (this.$route.params && this.$route.params.id) || ''
    },
    currentRole() {
      return this.canPreviewRole ? this.previewRole : this.actualRole
    },
    actualRole() {
      return this.$store.state.auth.role || 'NURSE'
    },
    canPreviewRole() {
      return rolePreviewAllowed(this.actualRole, process.env.NODE_ENV)
    },
    canLaunchMedical() {
      return ['ADMIN', 'DOCTOR', 'NP'].includes(this.currentRole)
    },
    canLaunchNurse() {
      return ['NURSE', 'CNA', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR'].includes(this.currentRole)
    },
    canLaunchPrescription() {
      return ['ADMIN', 'DOCTOR', 'NP', 'NURSE'].includes(this.currentRole)
    },
    // Billed drugs must come from the official DB price catalog, not free
    // text — a typed name that doesn't match a catalog entry exactly (e.g.
    // "Furosemide" vs the catalog's "Furosemide 40mg") used to fail to bill
    // silently, leaving Cash Office showing no charge for a real prescription.
    orderDrugSuggestions() {
      const catalog = (this.$store.getters['billing/catalog'] || {}).drugs || []
      return catalog.filter(d => d.active !== false).map(d => ({ name: d.name, unitPrice: d.unitPrice, dbId: d.id || d.dbId }))
    },
    orderSelectedCatalogItem() {
      const name = this.forms.order.medication.medication
      if (!name) return null
      return this.orderDrugSuggestions.find(d => d.name.toLowerCase() === String(name).toLowerCase()) || null
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
      if (role === 'SOCIAL_WORKER') {
        options.push({ key: 'social', label: 'Social Work Note', icon: 'mdi-hand-heart-outline', kind: 'note', noteType: 'social_coordination_note', dialogTitle: 'Social Work Note' })
      }
      if (role === 'MAJOR_SERVICE') {
        options.push({ key: 'unit-management', label: 'Unit Management Note', icon: 'mdi-clipboard-account-outline', kind: 'note', noteType: 'unit_coordination_note', dialogTitle: 'Unit Management Note' })
      }
      if (role === 'NURSING_SUPERVISOR') {
        options.push({ key: 'nursing-supervision', label: 'Nursing Supervision Note', icon: 'mdi-account-supervisor-outline', kind: 'note', noteType: 'supervision_coordination_note', dialogTitle: 'Nursing Supervision Note' })
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
      const order = ROLE_PRIMARY_TABS[this.currentRole] || PRIMARY_TAB_ORDER
      return order.filter(tab => this.visibleChartTabs.includes(tab))
    },
    overflowTabs() {
      return this.visibleChartTabs.filter(tab => !this.primaryTabs.includes(tab))
    },
    fallRiskEntry() {
      const patient = this.findPatientRecord(this.activePatientId)
      if (patient && patient.fallRisk) return { label: 'Fall risk', value: patient.fallRisk }
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
    globalSearchResults() {
      const query = normalizeSearchValue(this.globalSearchQuery)
      if (!query) return []
      const results = []
      const directory = this.$store.getters['clinical/patientDirectory'] || []
      directory.filter(patient => matchesPatientQuery(patient, query)).slice(0, 5).forEach(patient => {
        results.push({
          key: `patient-${patient.id}`,
          type: 'patient',
          patient,
          title: patient.displayName || patient.name || patient.id,
          meta: [patient.mrn, patient.currentDepartment].filter(Boolean).join(' · '),
          group: 'Patient',
          icon: 'mdi-account-box-outline'
        })
      })
      this.visibleChartTabs.filter(tab => normalizeSearchValue(tab).includes(query)).slice(0, 4).forEach(tab => {
        results.push({ key: `tab-${tab}`, type: 'tab', tab, title: tab, meta: 'Open chart workspace', group: 'Tab', icon: 'mdi-tab' })
      })
      this.visibleNavigatorTabs.forEach(navigator => {
        const section = (navigator.sections || []).map(item => (typeof item === 'string' ? { key: item, label: item, group: '' } : item)).find(item => normalizeSearchValue(`${item.label} ${item.group}`).includes(query))
        if (normalizeSearchValue(navigator.label).includes(query) || section) {
          results.push({
            key: `navigator-${navigator.key}-${section ? section.key : 'root'}`,
            type: 'navigator',
            navigator,
            section,
            title: section ? section.label : navigator.label,
            meta: `${navigator.label} navigator${section && section.group ? ` · ${section.group}` : ''}`,
            group: 'Navigator',
            icon: navigator.icon || 'mdi-compass-outline'
          })
        }
      })
      const activities = [
        ...this.patientLabOrders.map(item => ({ item, tab: 'Lab Results', label: item.testName || item.test || item.name || 'Lab order', icon: 'mdi-flask-outline' })),
        ...this.patientImagingOrders.map(item => ({ item, tab: 'Lab Results', label: item.modality || item.exam || item.name || 'Imaging order', icon: 'mdi-radiology-box-outline' })),
        ...this.patientTasks.map(item => ({ item, tab: 'Work List', label: item.title || item.task || 'Care task', icon: 'mdi-clipboard-check-outline' })),
        ...this.patientMedications.map(item => ({ item, tab: 'Medications', label: item.medication || item.name || 'Medication', icon: 'mdi-pill' }))
      ]
      activities.filter(activity => normalizeSearchValue(`${activity.label} ${activity.item.status || ''}`).includes(query)).slice(0, 4).forEach((activity, index) => {
        results.push({ key: `activity-${activity.tab}-${activity.item.id || index}`, type: 'activity', ...activity, title: activity.label, meta: activity.item.status || 'Open record', group: 'Chart', icon: activity.icon })
      })
      return results.slice(0, 12)
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
      const primary = this.navigatorSectionContent.action || this.activeNavigatorSectionMeta.action
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
    navigatorSectionIndex() {
      return Math.max(0, this.activeNavigatorSections.findIndex(section => section.key === this.selectedNavigatorSection))
    },
    navigatorSectionContent() {
      const key = String(this.activeNavigatorSectionMeta.key || '').toLowerCase()
      const label = this.activeNavigatorSectionMeta.label || this.activeNavigator.headline
      const group = this.activeNavigatorSectionMeta.group || this.activeNavigator.label
      const sectionState = this.navigatorSectionStatus({ key })
      const readinessByState = { complete: 100, active: 72, warning: 42, due: 18, neutral: 35 }
      const base = (columns, rows, action, options = {}) => ({
        title: options.title || label,
        description: options.description || this.activeNavigatorSectionMeta.detail,
        columns,
        rows: rows && rows.length ? rows : [{ label: 'No patient data filed', values: columns.reduce((values, column) => ({ ...values, [column]: '-' }), {}) }],
        action: action || this.activeNavigatorSectionMeta.action || 'notes',
        required: options.required !== undefined ? options.required : /required|assessment|discharge instructions/i.test(group),
        readiness: options.readiness !== undefined ? options.readiness : readinessByState[sectionState.status] || 35,
        readinessLabel: options.readinessLabel || (sectionState.label === 'filed' ? 'Documentation filed and available to the care team.' : `${sectionState.label} · review the values and document the next action.`),
        status: options.status || sectionState.status,
        nextAction: options.nextAction || this.activeNavigatorSectionMeta.detail,
        dependencies: options.dependencies || [
          { label: 'Vital signs', value: this.latestVitalsSummary ? 'Filed' : 'Due', status: this.latestVitalsSummary ? 'good' : 'warning' },
          { label: 'Orders', value: `${this.patientLabOrders.length + this.patientImagingOrders.length + this.patientMedications.length} active`, status: 'neutral' },
          { label: 'Open tasks', value: String(this.patientTasks.length), status: this.patientTasks.length ? 'warning' : 'good' }
        ]
      })

      if (this.selectedNavigator === 'sdoh') {
        const domainBySection = {
          'food insecurity': 'food',
          'transportation needs': 'transport',
          'financial strain': 'financial',
          stress: 'stress',
          housing: 'housing',
          'social support': 'support'
        }
        const domain = this.sdohDomains.find(item => item.key === domainBySection[key]) || this.activeSdohDomain
        const rows = [
          { label: 'Current screening', values: { Status: domain.summary, Assessment: domain.assessment, Recorded: domain.date } },
          ...domain.details.map(item => ({ label: item.label, values: { Status: item.value, Assessment: domain.label, Recorded: domain.date } }))
        ]
        return base(['Status', 'Assessment', 'Recorded'], rows, 'social', {
          title: domain.label,
          description: `${domain.assessment}. Document barriers, intervention, owner and follow-up without leaving Patient 360.`,
          readiness: domain.status === 'clear' ? 100 : 45,
          status: domain.status === 'clear' ? 'complete' : 'warning',
          readinessLabel: domain.status === 'clear' ? 'Screening filed with no active need.' : 'Need requires clarification, intervention or follow-up.',
          nextAction: domain.status === 'clear' ? 'Continue routine screening.' : 'Document intervention and assign follow-up.'
        })
      }

      if (key === 'overview') return base(['Status', 'Owner', 'Action'], this.shiftOverviewRows, 'nurse', { title: `${this.activeNavigator.label} overview` })
      if (/signed-held/.test(key)) return base(['Type', 'Status', 'Detail'], this.signedHeldOrderRows, 'orders')
      if (/release-orders/.test(key)) return base(['Status', 'Owner', 'Action'], this.releaseOrderRows, 'orders')
      if (/care-everywhere/.test(key)) return base(['Authorization', 'Last Update', 'Action'], this.careEverywhereRows, 'document')
      if (/quick-links/.test(key)) return base(['Destination', 'Status', 'Action'], this.selectedNavigator === 'admission' ? this.admissionQuickLinkRows : this.quickLinkRows, 'flowsheet')
      if (/delirium|gcs/.test(key)) return base(this.flowColumns, this.deliriumRows, 'nurse', { required: true })
      if (/specimen/.test(key)) return base(['Status', 'Owner', 'Due'], this.specimenNotificationRows.slice(0, 2), 'worklist', { required: true })
      if (/provider-notification|clinical-alert/.test(key)) return base(['Status', 'Source', 'Action'], this.clinicalAlertRows, 'handoff')
      if (/falls-doc|fall-risk|falls-neuro|rounds-safety|suicide-risk/.test(key)) return base(['Status', 'Risk', 'Action'], this.safetyFallRows, 'safety-fall', { required: true })
      if (/vital-signs|^vitals$|^pain$|discharge-vitals/.test(key)) return base(this.patientVitals.length ? ['Last Filed'] : this.flowColumns, this.visibleVitalRows, 'nurse', { required: true })
      if (/head-to-toe|^neuro$|orientation/.test(key)) return base(['Last Filed', 'Concern', 'Action'], this.headToToeRows, 'body', { required: true })
      if (/iv-assessment|implants|lda-removal|wound-lda-removal/.test(key)) {
        const devices = this.avatarPlacements
          .filter(marker => !isResolvedAvatarStatus(marker.status))
          .map(marker => ({ label: marker.label || marker.type, values: { Site: marker.region || marker.view, Status: marker.status || 'Active', Action: marker.nextReviewAt ? `Review ${this.formatShortDate(marker.nextReviewAt)}` : 'Assess site and necessity' } }))
        return base(['Site', 'Status', 'Action'], devices.length ? devices : this.ivAssessmentRows, 'body', { required: true })
      }
      if (/intake-output/.test(key)) return base(this.flowColumns, this.intakeRows, 'flowsheet', { required: true })
      if (/sepsis/.test(key)) return base(this.flowColumns, this.sepsisRows, 'nurse', { required: true })
      if (/comfort|psychosocial/.test(key)) return base(['Status', 'Need', 'Action'], this.comfortHygieneRows, key === 'psychosocial' ? 'social' : 'flowsheet')
      if (/mobility|baseline|adls|function-quality|functional-items|bms/.test(key)) return base(['Status', 'Baseline', 'Goal'], this.mobilityQualityRows, 'flowsheet', { required: true })
      if (/education/.test(key)) return base(['Status', 'Owner', 'Notes'], this.educationRows, 'education', { required: true })
      if (/care-plans/.test(key)) return base(['Owner', 'Status', 'Next Step'], this.carePlanRows, 'care-plan', { required: true })

      if (/allergies/.test(key)) {
        return base(['Status', 'Source', 'Action'], [{ label: 'Allergies and intolerances', values: { Status: this.activePatient.allergies || 'Not documented', Source: 'Patient banner', Action: 'Verify reaction and severity' } }], 'safety-allergies', { required: true })
      }
      if (/latex|travel-exposure/.test(key)) {
        return base(['Status', 'Owner', 'Action'], [{ label, values: { Status: 'Review required', Owner: 'NURSE', Action: 'Document admission screening' } }], 'safety-precautions', { required: true })
      }
      if (/home-meds|med-rec|current meds|scheduled|prn|continuous|running infusions|medication-detail|home-pharmacy|med-rec-status|type-of-med-rec|pain-med-instructions|reconciliation/.test(key)) {
        return base(['Status', 'Route', 'Instructions'], this.medicationProfileRows, 'medication', { required: /med-rec|reconciliation/.test(key) })
      }
      if (/alcohol/.test(key)) return base(['Status', 'Owner', 'Action'], [{ label: 'Alcohol and substance use', values: { Status: this.activePatient.alcoholUse || 'Not documented', Owner: 'NURSE / PROVIDER', Action: 'Screen use, withdrawal risk and support need' } }], 'nurse', { required: true })
      if (/vaccine/.test(key)) return base(['Status', 'Date', 'Source'], this.immunizationRows, 'document')
      if (/contacts-legal/.test(key)) return base(['Value'], this.registrationRows, 'registration', { required: true })
      if (/belongings/.test(key)) return base(['Status', 'Owner', 'Action'], this.dischargeDocumentationRows.filter(row => /belongings/i.test(row.label)), 'document', { required: true })

      if (/expected-discharge|discharge-milestones/.test(key)) return base(['Status', 'Owner', 'Due'], this.dischargeRows, 'discharge', { required: true })
      if (/pain-impact/.test(key)) return base(['Last Filed', 'Owner', 'Action'], this.painImpactRows, 'nurse', { required: true })
      if (/quality-discharge/.test(key)) return base(['Status', 'Owner', 'Action'], this.dischargeQualityRows, 'discharge', { required: true })
      if (/best-practice|discharge-info|family-notification|dme-recommendation/.test(key)) return base(['Status', 'Owner', 'Action'], this.dischargeDocumentationRows.filter(row => {
        const token = key.replace(/-/g, ' ').replace('dme recommendation', 'dme')
        return row.label.toLowerCase().includes(token.split(' ')[0])
      }), 'discharge', { required: true })
      if (/instructions|diet-instructions|nursing-discharge|wound-care-instructions|rt-instructions/.test(key)) return base(['Status', 'Owner', 'Action'], this.dischargeInstructionRows, 'discharge', { required: true })
      if (/follow-up-providers|after-visit-summary/.test(key)) return base(['Status', 'Owner', 'Action'], this.afterVisitSummaryRows, 'discharge', { required: true })

      if (/pre-procedure/.test(key)) return base(['Current admission'], this.transferRows, 'transfer', { required: true })
      if (/ticket-procedure/.test(key)) return base(['Status'], this.ticketRows, 'transfer', { required: true })
      if (/print-procedure/.test(key)) return base(['Status', 'Owner', 'Action'], this.transferPrintRows, 'document')
      if (/diagnostic-test|non-invasive/.test(key)) return base(['Status', 'Destination', 'Action'], this.transferXrayRows, 'imaging-results', { required: true })
      if (/ticket-xray/.test(key)) return base(['Status', 'Destination', 'Action'], this.ticketXrayRows, 'transfer', { required: true })
      if (/print-xray/.test(key)) return base(['Status', 'Owner', 'Action'], this.transferPrintRows, 'document')
      if (/handoff/.test(key)) return base(['Status', 'Owner', 'Concern'], this.handoffRows, 'handoff', { required: true })
      if (/vital-monitoring/.test(key)) return base(this.patientVitals.length ? ['Last Filed'] : this.flowColumns, this.visibleVitalRows, 'nurse', { required: true })

      if (this.selectedNavigator === 'mar') return base(['0600', '1000', '1400', '1800'], this.visibleMarRows, 'medication', { required: true })
      if (this.selectedNavigator === 'blood') {
        if (/type and screen/.test(key)) return base(['Type', 'Status', 'Detail'], this.orderRows.filter(row => row.values.Type === 'Lab'), 'lab-results', { required: true })
        if (/transfusion vitals/.test(key)) return base(this.patientVitals.length ? ['Last Filed'] : this.flowColumns, this.visibleVitalRows, 'nurse', { required: true })
        return base(['Category', 'Status', 'Filed'], this.documentRows.filter(row => /consent|blood|transfusion/i.test(`${row.label} ${row.values.Category}`)), 'document', { required: true })
      }
      if (this.selectedNavigator === 'vitals') return base(this.patientVitals.length ? ['Last Filed'] : this.flowColumns, /wound/i.test(key) ? this.headToToeRows : this.visibleVitalRows, /wound/i.test(key) ? 'body' : 'nurse', { required: true })
      if (this.selectedNavigator === 'worklist') {
        const rows = this.visibleWorklistRows.filter(row => {
          const state = String(row.values.Status || '').toLowerCase()
          if (/completed/.test(key)) return /done|completed|closed/.test(state)
          if (/overdue/.test(key)) return /overdue|late/.test(state)
          if (/due now/.test(key)) return /due|open|pending|unread/.test(state)
          return true
        })
        return base(['Time', 'Priority', 'Status'], rows, 'worklist', { required: true })
      }
      if (this.selectedNavigator === 'careteam') return base(['Role', 'Shift', 'Contact'], this.visibleCareTeamRows.filter(row => key === 'attending' ? /attending/i.test(row.values.Role) : key === 'consults' ? /consult/i.test(row.values.Role) : true), 'care-team')

      return base(['Status', 'Owner', 'Action'], [{ label, values: { Status: sectionState.label, Owner: this.activeNavigatorSectionMeta.owner, Action: this.activeNavigatorSectionMeta.detail } }], this.activeNavigatorSectionMeta.action || 'notes')
    },
    workspaceEyebrow() {
      if (this.selectedChartTab && this.selectedChartTab !== 'Navigators') return this.selectedChartTab
      return this.activeNavigator ? this.activeNavigator.label : 'Patient 360'
    },
    workspaceHeadline() {
      const map = {
        Summary: 'Patient 360 Summary',
        'EMR Command Center': 'EMR Command Center',
        'Doctor Command Center': 'Medical Decision and Follow-up Center',
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
    isPatientDischarged() {
      const getter = this.$store.getters['clinical/isPatientDischarged']
      return Boolean(this.activePatientId && getter && getter(this.activePatientId))
    },
    visibleSidebarIndex() {
      const blocked = []
      if (!this.canViewOrders) blocked.push('Orders', 'Blood Admin')
      if (!this.canSeeClinicalHistory) blocked.push('Risk', 'Problem List', 'History', 'Intake/Output')
      if (!this.canViewSocialNeeds) blocked.push('Discharge')
      const keys = {
        Orders: 'orders',
        'Plan of Care': 'plan_of_care',
        Risk: 'risk',
        'Problem List': 'problem_list',
        History: 'history',
        'Blood Admin': 'blood_admin',
        'Intake/Output': 'intake_output',
        'Care Team': 'care_team',
        Discharge: 'discharge',
        Notes: 'notes'
      }
      return this.sidebarIndex
        .filter(item => !blocked.includes(item))
        .map(item => this.$t(`clinical360.nursing.sidebar.index_items.${keys[item]}`))
    },
    translatedMedicalHistory() {
      return this.medicalHistory.map(item => ({
        label: this.translateSidebarText(item.label),
        value: this.translateSidebarText(item.value)
      }))
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
      let filtered = source
      if (this.currentRole === 'LAB') filtered = source.filter(order => order.icon === 'mdi-flask' || order.title.toLowerCase().includes('cbc'))
      if (this.currentRole === 'PHARMACY') filtered = source.filter(order => order.icon === 'mdi-pill' || order.title.toLowerCase().includes('medication'))
      return filtered.map(order => ({
        ...order,
        title: this.translateSidebarText(order.title),
        detail: this.translateSidebarText(order.detail)
      }))
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
      return all.filter(item => item.patientId === this.activePatientId && !['done', 'cancel', 'completed', 'cancelled'].includes(String(item.status || '').toLowerCase()))
    },
    coordinationTasks() {
      const all = this.$store.getters['clinical/getTasks'] || []
      return all.filter(item => item.patientId === this.activePatientId)
    },
    patientWounds() {
      const all = this.$store.getters['nursing/getWounds'] || []
      return all.filter(item => item.patientId === this.activePatientId)
    },
    woundAssessmentMap() {
      return this.patientWounds.reduce((map, wound) => {
        map[wound.id] = this.woundAssessmentsFor(wound.id)
        return map
      }, {})
    },
    patientWoundPhotos() {
      const all = this.$store.getters['nursing/getWoundPhotos'] || []
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
          icon: 'mdi-heart-pulse',
          action: 'nurse'
        },
        {
          label: 'Care workload',
          value: this.patientTasks.length ? `${this.patientTasks.length} task(s)` : 'Routine care',
          detail: this.patientTasks.length ? 'Review worklist and document completion.' : 'Continue scheduled rounds.',
          status: this.patientTasks.length ? 'active' : 'complete',
          icon: 'mdi-format-list-checks',
          action: 'worklist'
        },
        {
          label: 'Orders / meds',
          value: `${this.patientLabOrders.length + this.patientImagingOrders.length + this.patientMedications.length} active`,
          detail: this.patientMedications.length ? 'Medication profile available for MAR review.' : 'Check med reconciliation and orders.',
          status: this.patientMedications.length ? 'active' : 'warning',
          icon: 'mdi-clipboard-pulse-outline',
          action: 'orders'
        },
        {
          label: 'Discharge readiness',
          value: hasDischargeDoc ? 'Started' : 'Prepare',
          detail: this.dischargeReadinessLabel,
          status: hasDischargeDoc && !this.patientTasks.length ? 'complete' : 'warning',
          icon: 'mdi-exit-run',
          action: 'discharge-plan'
        },
        {
          label: 'Social / family',
          value: this.canViewSocialNeeds ? this.summarySocialStatus : 'Protected',
          detail: this.canViewSocialNeeds ? 'Transport, family, finances and home support visible.' : 'Visible by role authorization only.',
          status: this.canViewSocialNeeds ? this.summarySocialStatusLevel : 'protected',
          icon: 'mdi-account-group-outline',
          action: this.canViewSocialNeeds ? 'social' : 'care-team'
        },
        {
          label: 'Last care entry',
          value: this.recentTimedCareEntries.length ? this.formatShortDate(this.recentTimedCareEntries[0].documentedAt) : 'Not filed',
          detail: this.recentTimedCareEntries[0]?.summary || 'Use Timed care to document bedside work.',
          status: this.recentTimedCareEntries.length ? 'complete' : 'warning',
          icon: 'mdi-clock-edit-outline',
          action: 'flowsheet'
        },
        {
          label: 'Care plan',
          value: carePlanSummary.goalCount ? `${carePlanSummary.completedGoals || 0}/${carePlanSummary.goalCount}` : 'No plan yet',
          detail: carePlanSummary.recentProgress ? `Last update: ${carePlanSummary.recentProgress.label}` : 'Create goals, interventions and outcomes.',
          status: carePlanSummary.goalCount ? 'complete' : 'warning',
          icon: 'mdi-clipboard-text-outline',
          action: 'care-plan'
        },
        {
          label: 'Education',
          value: educationSummary.documentedCount ? `${educationSummary.completedCount || 0}/${educationSummary.pointCount || 0}` : 'No teaching filed',
          detail: educationSummary.latestEducation ? `Latest teaching by ${educationSummary.latestEducation.learners.join(', ') || 'team'}` : 'Document teaching completed and family education.',
          status: educationSummary.documentedCount ? 'complete' : 'warning',
          icon: 'mdi-school-outline',
          action: 'education'
        }
      ]
    },
    summaryCompleteness() {
      const carePlan = this.$store.getters['carePlan/carePlanSummaryProjection']?.(this.activePatientId) || {}
      const education = this.$store.getters['education/educationSummaryProjection']?.(this.activePatientId) || {}
      const discharge = this.$store.getters['discharge/patientDischargeOverview']?.(this.activePatientId) || {}
      const checks = [
        Boolean(this.activePatient.mrn),
        Boolean(this.latestVitalsSummary),
        Boolean(this.latestVisit || this.latestNursingNote),
        Boolean(this.patientMedications.length || this.patientLabOrders.length || this.patientImagingOrders.length),
        Boolean(carePlan.goalCount),
        Boolean(education.documentedCount),
        Boolean(discharge.noteCount || this.patientDocuments.some(doc => /discharge|sortie|avs/i.test(`${doc.title || ''} ${doc.category || ''}`)))
      ]
      return Math.round((checks.filter(Boolean).length / checks.length) * 100)
    },
    summaryCareCycle() {
      const carePlan = this.$store.getters['carePlan/carePlanSummaryProjection']?.(this.activePatientId) || {}
      const discharge = this.$store.getters['discharge/patientDischargeOverview']?.(this.activePatientId) || {}
      return [
        {
          key: 'admission',
          label: 'Admission',
          detail: this.activePatient.mrn ? `${this.activePatient.patientClass} · ${this.activePatient.bed}` : 'Identity and service assignment due',
          status: this.activePatient.mrn ? 'complete' : 'due',
          action: 'registration'
        },
        {
          key: 'assessment',
          label: 'Assessment',
          detail: this.latestVitalsSummary ? 'Initial clinical set filed' : 'Vitals, pain and GCS due',
          status: this.latestVitalsSummary ? 'complete' : 'due',
          action: 'nurse'
        },
        {
          key: 'active-care',
          label: 'Active care',
          detail: carePlan.goalCount ? `${carePlan.goalCount} goal(s) · ${this.patientTasks.length} task(s)` : 'Care plan needs activation',
          status: carePlan.goalCount ? 'active' : 'warning',
          action: 'care-plan'
        },
        {
          key: 'discharge',
          label: 'Discharge',
          detail: discharge.noteCount ? `${discharge.openCount || 0} open continuity item(s)` : 'Prepare instructions and follow-up',
          status: discharge.noteCount && !discharge.openCount ? 'complete' : 'warning',
          action: 'discharge-plan'
        }
      ]
    },
    summarySafetyItems() {
      const woundCount = this.patientWounds.filter(item => !['resolved', 'healed', 'closed'].includes(String(item.status || '').toLowerCase())).length
      const fallRisk = this.fallRiskEntry ? this.fallRiskEntry.value : 'Not documented'
      return [
        { label: 'Allergies', detail: this.activePatient.allergies || 'No known allergies', level: /no known/i.test(this.activePatient.allergies || '') ? 'normal' : 'critical', icon: 'mdi-alert-circle-outline', action: 'safety-allergies' },
        { label: 'Precautions', detail: this.activePatient.precautions || 'Standard', level: /standard/i.test(this.activePatient.precautions || '') ? 'normal' : 'warning', icon: 'mdi-shield-alert-outline', action: 'safety-precautions' },
        { label: 'Fall risk', detail: fallRisk, level: /not documented/i.test(fallRisk) ? 'warning' : 'normal', icon: 'mdi-walk', action: 'safety-fall' },
        { label: 'Skin / devices', detail: woundCount ? `${woundCount} active wound(s) on avatar` : 'No active wound documented', level: woundCount ? 'warning' : 'normal', icon: 'mdi-human', action: 'body' }
      ]
    },
    summaryDepartmentItems() {
      const pendingLabs = this.patientLabOrders.filter(item => !/complete|result|validated|cancel/i.test(String(item.status || ''))).length
      const pendingImaging = this.patientImagingOrders.filter(item => !/complete|report|validated|cancel/i.test(String(item.status || ''))).length
      return [
        { label: 'Nursing', detail: this.latestNursingNote ? 'Bedside note and observations available' : 'Nursing assessment and handoff due', badge: this.latestNursingNote ? 'Filed' : 'Due', status: this.latestNursingNote ? 'complete' : 'due', icon: 'mdi-stethoscope', color: '#0f766e', action: 'nurse' },
        { label: 'Medical team', detail: this.patientMedicalNotes.length ? `${this.patientMedicalNotes.length} medical note(s)` : 'Provider diagnosis and plan pending', badge: this.patientMedicalNotes.length ? 'Active' : 'Review', status: this.patientMedicalNotes.length ? 'active' : 'warning', icon: 'mdi-doctor', color: '#003366', action: this.canLaunchMedical ? 'medical' : 'notes' },
        { label: 'Laboratory', detail: this.patientLabOrders.length ? `${pendingLabs} pending of ${this.patientLabOrders.length}` : 'No laboratory order', badge: pendingLabs ? 'Pending' : 'Clear', status: pendingLabs ? 'warning' : 'complete', icon: 'mdi-flask', color: '#0369a1', action: 'lab-results' },
        { label: 'Pharmacy / MAR', detail: this.patientMedications.length ? `${this.patientMedications.length} active medication(s)` : 'Medication reconciliation due', badge: this.patientMedications.length ? 'Active' : 'Due', status: this.patientMedications.length ? 'active' : 'due', icon: 'mdi-pill', color: '#7c3aed', action: 'medication' },
        { label: 'Imaging', detail: this.patientImagingOrders.length ? `${pendingImaging} pending of ${this.patientImagingOrders.length}` : 'No imaging request', badge: pendingImaging ? 'Pending' : 'Clear', status: pendingImaging ? 'warning' : 'complete', icon: 'mdi-radiology-box', color: '#b45309', action: 'imaging-results' },
        { label: 'Continuity / family', detail: this.dischargeReadinessLabel, badge: 'Review', status: 'warning', icon: 'mdi-account-group-outline', color: '#be123c', action: 'discharge-plan' }
      ]
    },
    summarySocialStatus() {
      const assessments = this.$store.getters['clinical/patientSocialAssessments']?.(this.activePatientId) || []
      const riskCount = assessments.length
        ? assessments.filter(item => ['At risk', 'Urgent', 'Needs review'].includes(item.status)).length
        : this.sdohDomains.filter(item => item.status === 'risk').length
      if (riskCount > 1) return `${riskCount} risks`
      if (riskCount === 1) return '1 risk'
      return 'No active risk'
    },
    summarySocialStatusLevel() {
      const assessments = this.$store.getters['clinical/patientSocialAssessments']?.(this.activePatientId) || []
      if (assessments.length) return assessments.some(item => ['At risk', 'Urgent', 'Needs review'].includes(item.status)) ? 'due' : 'complete'
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
        { label: 'Barcode', values: { Current: this.activePatient.barcode || this.activePatient.externalId || 'Generated on registration' } },
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
    chartReviewEvents() {
      const events = []
      const event = (category, prefix, item, config) => {
        const at = firstFiledValue(item, config.dateKeys || ['createdAt', 'recordedAt', 'updatedAt'], '')
        const statusLabel = firstFiledValue(item, config.statusKeys || ['status'], config.statusLabel || 'Filed')
        events.push({
          id: `${prefix}-${item.id || events.length}`,
          category,
          at,
          label: config.label,
          summary: config.summary || '',
          detail: config.detail || config.summary || '',
          clinician: config.clinician || firstFiledValue(item, ['recordedBy', 'createdBy', 'orderedBy', 'documentedBy', 'provider'], ''),
          status: config.status || chartEventStatus(statusLabel),
          statusLabel,
          sourceLabel: config.sourceLabel || '',
          targetTab: config.targetTab || '',
          icon: config.icon || '',
          facts: (config.facts || []).filter(fact => fact.value !== undefined && fact.value !== null && String(fact.value).trim())
        })
      }

      if (this.canSeeClinicalHistory) {
        this.patientVisits.forEach(visit => {
          const label = firstFiledValue(visit, ['chiefComplaint', 'diagnosis', 'reason'], 'Clinical encounter')
          event('encounter', 'visit', visit, {
            label,
            summary: firstFiledValue(visit, ['assessment', 'clinicalFindings', 'history', 'notes'], this.displayEncounterType(visit.encounterType)),
            detail: [visit.diagnosis ? `Diagnosis: ${visit.diagnosis}` : '', visit.plan ? `Plan: ${visit.plan}` : '', visit.notes || ''].filter(Boolean).join('\n'),
            statusLabel: visit.status || 'Completed encounter',
            sourceLabel: this.displayEncounterType(visit.encounterType),
            targetTab: 'Notes',
            icon: 'mdi-stethoscope',
            dateKeys: ['createdAt', 'recordedAt', 'visitDate'],
            facts: [
              { label: 'Encounter type', value: this.displayEncounterType(visit.encounterType) },
              { label: 'Diagnosis', value: visit.diagnosis },
              { label: 'Disposition', value: visit.disposition }
            ]
          })
        })

        this.patientVitals.forEach(vitals => {
          const summary = [
            vitals.bp ? `BP ${vitals.bp}` : '',
            vitals.hr ? `HR ${vitals.hr}` : '',
            vitals.temp ? `Temp ${vitals.temp} C` : '',
            vitals.spo2 ? `SpO2 ${vitals.spo2}%` : '',
            vitals.pain !== undefined && vitals.pain !== '' ? `Pain ${vitals.pain}/10` : ''
          ].filter(Boolean).join(' · ') || 'Vital signs filed'
          const abnormal = Number(vitals.spo2) > 0 && Number(vitals.spo2) < 92
          const febrile = Number(vitals.temp) >= 38
          event('observation', 'vitals', vitals, {
            label: abnormal || febrile ? 'Vital signs require review' : 'Vital signs',
            summary,
            detail: firstFiledValue(vitals, ['notes', 'comment'], summary),
            status: abnormal || febrile ? 'danger' : 'good',
            statusLabel: abnormal ? 'Low oxygen saturation' : (febrile ? 'Fever' : 'Filed'),
            sourceLabel: 'Clinical observations',
            targetTab: 'Flowsheets',
            icon: 'mdi-heart-pulse',
            dateKeys: ['recordedAt', 'createdAt'],
            facts: [
              { label: 'Blood pressure', value: vitals.bp },
              { label: 'Heart rate', value: vitals.hr },
              { label: 'Temperature', value: vitals.temp ? `${vitals.temp} C` : '' },
              { label: 'SpO2', value: vitals.spo2 ? `${vitals.spo2}%` : '' },
              { label: 'Pain', value: vitals.pain !== undefined && vitals.pain !== '' ? `${vitals.pain}/10` : '' },
              { label: 'GCS', value: vitals.gcs }
            ]
          })
        })

        this.signableNotes.forEach(note => {
          const detail = firstFiledValue(note, ['body', 'content', 'narrative', 'summary', 'assessment', 'plan'], '')
          event('note', 'clinical-note', note, {
            label: note.title || this.noteTypeLabel(note.noteType),
            summary: detail || `${this.noteTypeLabel(note.noteType)} · ${note.status || 'filed'}`,
            detail,
            statusLabel: note.status || 'Filed',
            sourceLabel: this.noteTypeLabel(note.noteType),
            targetTab: 'Notes',
            icon: 'mdi-note-text-outline',
            dateKeys: ['createdAt', 'recordedAt', 'updatedAt']
          })
        })

        this.patientNursingNotes.forEach(note => {
          const detail = [note.observation, note.actions, note.response].filter(Boolean).join('\n')
          event('note', 'nursing-note', note, {
            label: note.title || 'Nursing note',
            summary: note.response || note.observation || 'Nursing documentation filed',
            detail,
            statusLabel: note.status || 'Filed',
            sourceLabel: 'Nursing documentation',
            targetTab: 'Notes',
            icon: 'mdi-account-heart-outline',
            dateKeys: ['recordedAt', 'createdAt']
          })
        })

        this.patientMedicalNotes.forEach(note => {
          const detail = [note.clinicalFindings, note.assessment, note.plan].filter(Boolean).join('\n')
          event('note', 'medical-note', note, {
            label: note.title || 'Medical progress note',
            summary: note.plan || note.clinicalFindings || 'Medical documentation filed',
            detail,
            statusLabel: note.status || 'Filed',
            sourceLabel: 'Medical documentation',
            targetTab: 'Notes',
            icon: 'mdi-doctor',
            dateKeys: ['recordedAt', 'createdAt']
          })
        })

        this.patientWounds.forEach(wound => {
          this.woundAssessmentsFor(wound.id).forEach(assessment => {
            const location = wound.anatomicalLocation || wound.location || 'Location not filed'
            const size = assessment.surfaceArea ? `${assessment.surfaceArea} cm2` : [assessment.length, assessment.width].filter(Boolean).join(' x ')
            event('wound', `wound-${wound.id}`, assessment, {
              label: `${wound.woundType || 'Wound'} · ${location}`,
              summary: [size, assessment.drainageType, assessment.dressingType].filter(Boolean).join(' · ') || 'Wound assessment filed',
              detail: firstFiledValue(assessment, ['notes', 'description', 'treatment'], 'Wound assessment filed.'),
              status: assessment.warningAreaIncreased ? 'danger' : chartEventStatus(wound.status || assessment.status),
              statusLabel: assessment.warningAreaIncreased ? 'Surface area increased' : (assessment.status || wound.status || 'Active'),
              sourceLabel: 'Wound care',
              targetTab: 'Wound Management',
              icon: 'mdi-bandage',
              dateKeys: ['createdAt', 'assessedAt', 'recordedAt'],
              facts: [
                { label: 'Location', value: location },
                { label: 'Surface area', value: size },
                { label: 'Drainage', value: assessment.drainageType },
                { label: 'Dressing', value: assessment.dressingType }
              ]
            })
          })
        })

        const timedGetter = this.$store.getters['flowsheets/recentTimedCareEntries']
        const timedEntries = timedGetter ? timedGetter(this.activePatientId, this.currentEncounterId) : []
        timedEntries.forEach(entry => {
          event('care', 'timed-care', entry, {
            label: entry.carePerformed || entry.title || 'Timed bedside care',
            summary: entry.summary || entry.response || entry.notes || 'Scheduled care documented',
            detail: [entry.summary, entry.observations, entry.response, entry.notes].filter(Boolean).join('\n'),
            statusLabel: entry.status || 'Completed',
            sourceLabel: entry.templateName || 'Flowsheet',
            targetTab: 'Flowsheets',
            icon: 'mdi-clock-check-outline',
            dateKeys: ['documentedAt', 'createdAt', 'scheduledAt']
          })
        })
      }

      if (this.canViewOrders) {
        const visibleLabOrders = ['IMAGING', 'PHARMACY'].includes(this.currentRole) ? [] : this.patientLabOrders
        const visibleImagingOrders = ['LAB', 'PHARMACY'].includes(this.currentRole) ? [] : this.patientImagingOrders
        visibleLabOrders.forEach(order => {
          const result = firstFiledValue(order, ['result', 'value', 'resultValue', 'interpretation'], '')
          const hasResult = Boolean(result)
          event(hasResult ? 'result' : 'order', 'lab', order, {
            label: order.test || order.testName || order.orderName || 'Laboratory order',
            summary: result || order.instructions || order.priority || 'Specimen requested',
            detail: [result ? `Result: ${result}` : '', order.units ? `Units: ${order.units}` : '', order.referenceRange ? `Reference: ${order.referenceRange}` : '', order.comment || order.notes || ''].filter(Boolean).join('\n'),
            statusLabel: order.status || (hasResult ? 'Final' : 'Requested'),
            sourceLabel: 'Laboratory',
            targetTab: hasResult ? 'Lab Results' : 'Orders',
            icon: 'mdi-flask-outline',
            dateKeys: ['resultedAt', 'updatedAt', 'createdAt', 'requestedAt'],
            facts: [
              { label: 'Result', value: result },
              { label: 'Priority', value: order.priority },
              { label: 'Specimen', value: order.specimen }
            ]
          })
        })

        visibleImagingOrders.forEach(order => {
          const report = firstFiledValue(order, ['report', 'result', 'findings', 'impression'], '')
          event(report ? 'result' : 'order', 'imaging', order, {
            label: order.exam || order.study || order.orderName || 'Imaging order',
            summary: report || order.indication || order.priority || 'Imaging requested',
            detail: [order.findings, order.impression, order.report].filter(Boolean).join('\n'),
            statusLabel: order.status || (report ? 'Final' : 'Requested'),
            sourceLabel: 'Imaging',
            targetTab: 'Orders',
            icon: 'mdi-radiology-box',
            dateKeys: ['resultedAt', 'updatedAt', 'createdAt', 'requestedAt'],
            facts: [
              { label: 'Indication', value: order.indication },
              { label: 'Priority', value: order.priority },
              { label: 'Impression', value: order.impression }
            ]
          })
        })
      }

      if (this.canViewOrders && (this.canSeeClinicalHistory || this.currentRole === 'PHARMACY')) {
        this.patientMedications.forEach(medication => {
          const name = medication.drug || medication.medication || medication.name || 'Medication'
          const detail = [medication.dose, medication.route, medication.frequency].filter(Boolean).join(' · ')
          event('medication', 'medication', medication, {
            label: name,
            summary: detail || medication.instructions || 'Medication profile item',
            detail: [detail, medication.instructions, medication.indication].filter(Boolean).join('\n'),
            statusLabel: medication.status || 'Active',
            sourceLabel: 'Medication profile',
            targetTab: 'MAR',
            icon: 'mdi-pill',
            dateKeys: ['administeredAt', 'prescribedAt', 'updatedAt', 'createdAt'],
            facts: [
              { label: 'Dose', value: medication.dose },
              { label: 'Route', value: medication.route },
              { label: 'Frequency', value: medication.frequency },
              { label: 'Indication', value: medication.indication }
            ]
          })
        })
      }

      if (this.canSeeClinicalHistory || ['ADMIN', 'RECORDS'].includes(this.currentRole)) {
        this.patientDocuments.forEach(document => {
          event('document', 'document', document, {
            label: document.title || document.category || 'Clinical document',
            summary: firstFiledValue(document, ['content', 'description'], document.category || 'Document filed'),
            detail: firstFiledValue(document, ['content', 'description'], 'Document filed in the patient record.'),
            statusLabel: document.status || 'Filed',
            sourceLabel: document.category || 'Documents',
            targetTab: 'Documents',
            icon: 'mdi-file-document-outline',
            dateKeys: ['createdAt', 'filedAt', 'updatedAt']
          })
        })
      }

      if (this.canSeeClinicalHistory || this.canViewSocialNeeds || this.currentRole === 'PHARMACY') {
        const educationGetter = this.$store.getters['education/educationEventsForChartReview']
        const educationEvents = educationGetter ? educationGetter(this.activePatientId) : []
        educationEvents.forEach((education, index) => {
          event('education', 'education', { ...education, id: education.id || index }, {
            label: education.label || 'Patient education documented',
            summary: education.details || 'Teaching filed',
            detail: education.details || 'Patient or family teaching was documented.',
            statusLabel: 'Completed',
            sourceLabel: 'Education',
            targetTab: 'Education',
            icon: 'mdi-school-outline',
            dateKeys: ['timestamp', 'filedAt', 'taughtAt']
          })
        })
      }

      return events.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
    },
    chartReviewMetrics() {
      const makeMetric = (label, value, detail, icon, status = 'neutral') => ({ label, value: String(value), detail, icon, status })
      if (this.currentRole === 'LAB') {
        const resulted = this.patientLabOrders.filter(order => firstFiledValue(order, ['result', 'value', 'resultValue'], '')).length
        const critical = this.patientLabOrders.filter(order => chartEventStatus(`${order.status || ''} ${order.interpretation || ''}`) === 'danger').length
        return [
          makeMetric('Lab requests', this.patientLabOrders.length, 'Visible laboratory scope', 'mdi-flask-outline'),
          makeMetric('Results filed', resulted, 'Validated or resulted', 'mdi-check-decagram-outline', resulted ? 'good' : 'warning'),
          makeMetric('Awaiting result', Math.max(this.patientLabOrders.length - resulted, 0), 'Collection or validation pending', 'mdi-timer-sand', this.patientLabOrders.length - resulted ? 'warning' : 'good'),
          makeMetric('Critical signals', critical, 'Requires notification', 'mdi-alert-circle-outline', critical ? 'danger' : 'good'),
          makeMetric('Visible events', this.chartReviewEvents.length, 'Role-filtered chart timeline', 'mdi-timeline-clock-outline', 'good')
        ]
      }
      if (this.currentRole === 'IMAGING') {
        const reported = this.patientImagingOrders.filter(order => firstFiledValue(order, ['report', 'result', 'findings', 'impression'], '')).length
        return [
          makeMetric('Imaging requests', this.patientImagingOrders.length, 'Visible imaging scope', 'mdi-radiology-box'),
          makeMetric('Reports filed', reported, 'Result available', 'mdi-file-check-outline', reported ? 'good' : 'warning'),
          makeMetric('Awaiting report', Math.max(this.patientImagingOrders.length - reported, 0), 'Acquisition or reading pending', 'mdi-timer-sand', this.patientImagingOrders.length - reported ? 'warning' : 'good'),
          makeMetric('Urgent requests', this.patientImagingOrders.filter(order => /urgent|stat/i.test(order.priority || '')).length, 'Prioritised studies', 'mdi-alert-circle-outline'),
          makeMetric('Visible events', this.chartReviewEvents.length, 'Role-filtered chart timeline', 'mdi-timeline-clock-outline', 'good')
        ]
      }
      if (this.currentRole === 'PHARMACY') {
        const active = this.patientMedications.filter(item => !/stopped|discontinued|cancelled/i.test(item.status || '')).length
        return [
          makeMetric('Medication profile', this.patientMedications.length, 'Visible pharmacy scope', 'mdi-pill'),
          makeMetric('Active medication', active, 'Current profile items', 'mdi-medication-outline', active ? 'good' : 'warning'),
          makeMetric('Held / pending', this.patientMedications.filter(item => /held|pending|review/i.test(item.status || '')).length, 'Needs pharmacy review', 'mdi-pause-circle-outline'),
          makeMetric('Education events', this.chartReviewEvents.filter(item => item.category === 'education').length, 'Medication teaching included', 'mdi-school-outline'),
          makeMetric('Visible events', this.chartReviewEvents.length, 'Role-filtered chart timeline', 'mdi-timeline-clock-outline', 'good')
        ]
      }
      if (this.currentRole === 'RECORDS') {
        return [
          makeMetric('Filed documents', this.patientDocuments.length, 'Visible records scope', 'mdi-file-document-multiple-outline'),
          makeMetric('Discharge documents', this.patientDocuments.filter(doc => /discharge|sortie|avs/i.test(`${doc.title || ''} ${doc.category || ''}`)).length, 'Continuity record', 'mdi-file-export-outline'),
          makeMetric('Clinical encounters', 0, 'Protected by role', 'mdi-shield-lock-outline'),
          makeMetric('Clinical notes', 0, 'Protected by role', 'mdi-shield-lock-outline'),
          makeMetric('Visible events', this.chartReviewEvents.length, 'Role-filtered chart timeline', 'mdi-timeline-clock-outline', 'good')
        ]
      }

      const diagnosticCount = this.patientLabOrders.length + this.patientImagingOrders.length
      const activeWounds = this.patientWounds.filter(wound => !/resolved|healed|closed/i.test(wound.status || '')).length
      const notes = this.signableNotes.length + this.patientNursingNotes.length + this.patientMedicalNotes.length
      return [
        {
          label: 'Latest observations',
          value: this.latestVitalsSummary || 'Not filed',
          detail: this.latestVitals ? this.formatShortDate(this.latestVitals.recordedAt || this.latestVitals.createdAt) : 'Clinical set due',
          icon: 'mdi-heart-pulse',
          status: this.latestVitalsSummary ? 'good' : 'warning'
        },
        {
          label: 'Encounters',
          value: String(this.patientVisits.length),
          detail: this.latestVisit ? this.formatShortDate(this.latestVisit.createdAt || this.latestVisit.recordedAt) : 'No encounter filed',
          icon: 'mdi-stethoscope',
          status: this.patientVisits.length ? 'good' : 'warning'
        },
        {
          label: 'Clinical notes',
          value: String(notes),
          detail: this.unsignedNoteCount ? `${this.unsignedNoteCount} unsigned` : 'No unsigned note',
          icon: 'mdi-note-text-outline',
          status: this.unsignedNoteCount ? 'warning' : 'good'
        },
        {
          label: 'Diagnostics',
          value: String(diagnosticCount),
          detail: `${this.patientLabOrders.length} lab · ${this.patientImagingOrders.length} imaging`,
          icon: 'mdi-flask-outline',
          status: diagnosticCount ? 'neutral' : 'good'
        },
        {
          label: 'Active wounds / care',
          value: String(activeWounds),
          detail: this.hasWoundAreaWarning ? 'Reassessment required' : `${this.patientTasks.length} open task(s)`,
          icon: 'mdi-bandage',
          status: this.hasWoundAreaWarning ? 'danger' : (activeWounds ? 'warning' : 'good')
        }
      ]
    },
    chartReviewRisks() {
      const patient = this.findPatientRecord(this.activePatientId) || this.activePatient || {}
      const chartState = { label: 'Chart state', value: this.isPatientDischarged ? 'Discharged · read only' : 'Active encounter', status: this.isPatientDischarged ? 'neutral' : 'good' }
      if (this.currentRole === 'LAB') return [{ label: 'Access scope', value: 'Laboratory data only', status: 'neutral' }, chartState]
      if (this.currentRole === 'IMAGING') return [{ label: 'Access scope', value: 'Imaging data only', status: 'neutral' }, chartState]
      if (this.currentRole === 'RECORDS') return [{ label: 'Access scope', value: 'Filed records only', status: 'neutral' }, chartState]
      const riskLevel = patient.riskLevel || 'Not scored'
      const allergyValue = Array.isArray(patient.allergies)
        ? patient.allergies.join(', ')
        : (patient.allergies || patient.allergy || 'None filed')
      if (this.currentRole === 'PHARMACY') {
        return [
          { label: 'Allergies', value: allergyValue, status: /none|no known/i.test(allergyValue) ? 'good' : 'warning' },
          { label: 'Access scope', value: 'Medication safety only', status: 'neutral' },
          chartState
        ]
      }
      const fallRisk = patient.fallRisk || (this.fallRiskEntry && this.fallRiskEntry.value) || 'Not scored'
      const activeWounds = this.patientWounds.filter(wound => !/resolved|healed|closed/i.test(wound.status || '')).length
      return [
        { label: 'Overall risk', value: riskLevel, status: chartEventStatus(riskLevel) },
        { label: 'Allergies', value: allergyValue, status: /none|no known/i.test(allergyValue) ? 'good' : 'warning' },
        { label: 'Fall risk', value: fallRisk, status: chartEventStatus(fallRisk) },
        { label: 'Skin integrity', value: activeWounds ? `${activeWounds} active wound(s)` : 'No active wound', status: activeWounds ? 'warning' : 'good' },
        chartState
      ]
    },
    chartReviewAlerts() {
      const alerts = []
      const abnormalVitals = this.chartReviewEvents.find(item => item.category === 'observation' && item.status === 'danger')
      if (abnormalVitals) alerts.push({ id: 'vitals-alert', eventId: abnormalVitals.id, category: 'observation', label: abnormalVitals.label, detail: abnormalVitals.summary })
      const abnormalResult = this.chartReviewEvents.find(item => item.category === 'result' && item.status === 'danger')
      if (abnormalResult) alerts.push({ id: 'result-alert', eventId: abnormalResult.id, category: 'result', label: abnormalResult.label, detail: abnormalResult.summary })
      const woundWarning = this.chartReviewEvents.find(item => item.category === 'wound' && item.status === 'danger')
      if (woundWarning) alerts.push({ id: 'wound-alert', eventId: woundWarning.id, category: 'wound', label: 'Wound trend warning', detail: woundWarning.label })
      if (this.canSeeClinicalHistory && this.unsignedNoteCount) alerts.push({ id: 'unsigned-notes', category: 'note', label: `${this.unsignedNoteCount} unsigned note(s)`, detail: 'Review and sign drafts before handoff.' })
      if (this.canSeeClinicalHistory && this.patientTasks.length) alerts.push({ id: 'open-tasks', category: 'care', label: `${this.patientTasks.length} open care task(s)`, detail: 'Review ownership and next due action.' })
      return alerts
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
          Instructions: med.administrationInstructions || med.instructions || med.notes || med.frequency || med.dose || med.prescriptionText || '-'
        }
      }))
    },
    medicationAdministrations() {
      return this.$store.state.clinical.medicationAdministrations.filter(a => a.patientId === this.activePatientId)
    },
    currentDayMedicationAdministrations() {
      return administrationsForLocalDay(this.medicationAdministrations, this.clinicalNowTick)
    },
    patientMessages() {
      return this.$store.state.clinical.patientMessages.filter(m => m.patientId === this.activePatientId)
    },
    marTimeColumns() {
      const times = new Set()
      this.currentDayMedicationAdministrations.forEach(a => {
        const t = this.formatSlotTime(a.scheduledFor)
        if (t) times.add(t)
      })
      if (!times.size) return this.marTimeColumnsFallback
      return Array.from(times).sort()
    },
    emarMedicationRows() {
      const medications = this.patientMedications.filter(isMedicationOrderForMar)
      return medications.map((med) => {
        const name = med.drug || med.medication || med.name || med.label || 'Medication'
        const catalogItem = findMedicationCatalogItem(name)
        const route = med.route || (/(iv|infusion)/i.test(name) ? 'IV' : 'Oral')
        const frequency = med.frequency || med.instructions || med.prescriptionText || 'Scheduled'
        const isPrn = /prn|as needed|au besoin/i.test(frequency)
        const isInfusion = /infusion|ivpb|continuous|running/i.test(`${name} ${route} ${frequency}`)
        const status = med.status || 'Active'
        const statusClass = this.orderStatusClass(status)
        return {
          id: med.id,
          raw: med,
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
          medicationClass: med.medicationClass || (catalogItem && catalogItem.medicationClass) || '',
          form: med.form || (catalogItem && catalogItem.form) || '',
          sideEffects: med.sideEffects || (catalogItem && catalogItem.sideEffects) || '',
          education: med.education || (catalogItem && catalogItem.education) || `Educate patient on ${name}, indication, expected effect and side effects.`,
          administrationInstructions: resolveAdministrationInstructions(med, catalogItem),
          status,
          statusClass,
          scheduleType: isInfusion ? 'infusion' : isPrn ? 'prn' : 'scheduled',
          color: isInfusion ? '#7c3aed' : isPrn ? '#b45309' : '#0f766e',
          icon: isInfusion ? 'mdi-iv-bag' : isPrn ? 'mdi-pill-multiple' : 'mdi-pill',
          lastAdmin: med.lastAdminTime || med.administeredAt || med.lastAdmin || 'Not filed',
          // Real per-dose history (medicationAdministrations, fetched from the
          // backend) drives this now instead of comparing a single free-text
          // status against one adminTime — see EmarGrid.vue for the cell
          // icon/color resolution that consumes the same records directly.
          timeline: this.marTimeColumns.map(time => {
            const administration = latestAdministrationForSlot(this.currentDayMedicationAdministrations, med.id, time)
            if (!administration) return { time, text: isPrn ? 'PRN' : '', status: isPrn ? 'prn' : 'empty', defaultAction: isPrn ? 'given' : 'details', administrationId: null }
            const map = {
              Given: { text: 'Given', status: 'given', defaultAction: 'details' },
              Held: { text: 'Held', status: 'held', defaultAction: 'details' },
              Refused: { text: 'Refused', status: 'refused', defaultAction: 'details' },
              'Not Available': { text: 'N/A', status: 'held', defaultAction: 'details' }
            }
            const resolved = map[administration.status] || { text: 'Due', status: 'due', defaultAction: 'given' }
            return { time, ...resolved, statusDetail: administration.comment || administration.refusalReason || '', administrationId: administration.id }
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
    marReportHeaders() {
      return [
        { text: 'Scheduled', value: 'scheduledFor' },
        { text: 'Given at', value: 'administeredAt' },
        { text: 'Nurse', value: 'nurse' },
        { text: 'Status', value: 'status' },
        { text: 'Dose', value: 'doseGiven' },
        { text: 'Patient response', value: 'patientResponse' },
        { text: 'Comment', value: 'comment' }
      ]
    },
    marReportRows() {
      if (!this.selectedMarMedication) return []
      return this.medicationAdministrations
        .filter(a => a.medicationId === this.selectedMarMedication.id)
        .slice()
        .sort((a, b) => new Date(b.scheduledFor) - new Date(a.scheduledFor))
        .map(a => ({
          scheduledFor: new Date(a.scheduledFor).toLocaleString(),
          administeredAt: a.administeredAt ? new Date(a.administeredAt).toLocaleString() : '-',
          nurse: (a.administeredBy && a.administeredBy.fullName) || '-',
          status: a.status,
          doseGiven: a.doseGiven || '-',
          patientResponse: a.patientResponse || '-',
          comment: a.comment || '-'
        }))
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
    avatarPlacementStatusOptions() {
      return statusOptionsForAvatarType(this.forms.avatarPlacement && this.forms.avatarPlacement.type)
    },
    avatarPlacementIsPersisted() {
      const id = this.forms.avatarPlacement && this.forms.avatarPlacement.id
      return Boolean(id && (this.$store.getters['nursing/getBodyMapMarkers'] || []).some(item => item.id === id))
    },
    avatarPlacementIsEnding() {
      return isResolvedAvatarStatus(this.forms.avatarPlacement && this.forms.avatarPlacement.status)
    },
    avatarPlacementRequiresIndication() {
      return ['trach', 'iv', 'foley', 'drain', 'ostomy'].includes(this.forms.avatarPlacement && this.forms.avatarPlacement.type)
    },
    avatarPlacementShowsSize() {
      return ['trach', 'iv', 'foley', 'drain', 'ostomy', 'wound'].includes(this.forms.avatarPlacement && this.forms.avatarPlacement.type)
    },
    avatarPlacementShowsOutput() {
      return ['foley', 'drain', 'ostomy', 'wound'].includes(this.forms.avatarPlacement && this.forms.avatarPlacement.type)
    },
    avatarPlacementIndicationLabel() {
      const labels = {
        wound: 'Wound type / etiology',
        trach: 'Airway indication',
        iv: 'Line indication / therapy',
        foley: 'Catheter indication',
        drain: 'Drain indication',
        ostomy: 'Ostomy type / indication',
        pain: 'Pain quality / trigger'
      }
      return labels[this.forms.avatarPlacement && this.forms.avatarPlacement.type] || 'Clinical indication'
    },
    avatarPlacementDateLabel() {
      return this.forms.avatarPlacement && this.forms.avatarPlacement.type === 'wound' ? 'First identified' : 'Insertion / onset date and time'
    },
    avatarPlacementSizeLabel() {
      const labels = {
        wound: 'Dimensions (L x W x D cm)',
        trach: 'Tube size / cuff',
        iv: 'Catheter gauge / line type',
        foley: 'Catheter and balloon size',
        drain: 'Drain type / size',
        ostomy: 'Stoma size'
      }
      return labels[this.forms.avatarPlacement && this.forms.avatarPlacement.type] || 'Size'
    },
    avatarPlacementOutputLabel() {
      const labels = {
        wound: 'Drainage amount / character',
        foley: 'Urine output / appearance',
        drain: 'Output amount / character',
        ostomy: 'Output amount / character'
      }
      return labels[this.forms.avatarPlacement && this.forms.avatarPlacement.type] || 'Output'
    },
    frontAvatarPlacementCount() {
      return this.avatarPlacements.filter(item => item.view === 'front').length
    },
    backAvatarPlacementCount() {
      return this.avatarPlacements.filter(item => item.view === 'back').length
    },
    archivedAvatarPlacementCount() {
      return (this.$store.getters['nursing/getBodyMapMarkers'] || []).filter(item => (
        item.patientId === this.activePatientId &&
        item.source === 'avatar' &&
        isResolvedAvatarStatus(item.status)
      )).length
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
        : [{ label: 'No task filed for this patient', values: { Time: '-', Priority: '-', Status: '-', Action: '-' } }]
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
      if (!this.patientTasks.length) return [{ label: 'No task filed for this patient', values: { Time: '-', Priority: '-', Status: '-' } }]
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
      const filedMembers = this.$store.getters['clinical/patientCareTeam']?.(this.activePatientId) || []
      const rows = filedMembers.map(member => ({
        label: member.name,
        values: { Role: member.role || member.responsibility || '-', Shift: member.status || 'Active', Contact: member.contact || member.service || '-' }
      }))
      if (attending && !rows.some(row => row.label === attending)) rows.unshift({ label: attending, values: { Role: 'Attending / Referent', Shift: 'Current', Contact: patient.phone || '-' } })
      if (rows.length) return rows
      return [{ label: 'No care team filed', values: { Role: '-', Shift: '-', Contact: 'Use "Add member" to file the care team' } }]
    },
    activePatient() {
      const patient = this.findPatientRecord(this.activePatientId)
      if (!patient) {
        return {
          id: this.activePatientId,
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
        id: patient.id || this.activePatientId,
        initials: initialsFor(name),
        name,
        gender: patient.gender || patient.sex || 'Sex N/A',
        age: patient.age || ageFromDob(patient.dob) || 'N/A',
        dob: formatClinicalDate(patient.dob, this.$i18n && this.$i18n.locale === 'fr' ? 'fr-CM' : 'en-CA'),
        mrn: patient.mrn || patient.externalId || patient.id,
        account: resolveDisplayAccount(patient),
        bed: patient.bed || patient.currentDepartment || 'Ambulatory',
        codeStatus: this.maskClinical(patient.codeStatus || patient.code || 'Full Resuscitation'),
        precautions: this.maskClinical(patient.precautions || 'Standard'),
        infectionStatus: this.maskClinical(patient.infectionStatus || 'No isolation'),
        attending: patient.attending || patient.provider || patient.referredBy || 'Provider not assigned',
        allergies: this.maskMedication(patient.allergies || 'No known allergies'),
        admitted: formatClinicalDate(patient.admittedAt || patient.createdAt, this.$i18n && this.$i18n.locale === 'fr' ? 'fr-CM' : 'en-CA'),
        patientClass: patient.patientClass || patient.patientStatus || 'Outpatient',
        vitals: this.maskClinical(formatVitalsSummary(this.latestVitals || patient.vitals)),
        bmi: this.maskClinical(this.latestBmi || patient.bmi || 'N/A')
      }
    },
    latestVitalsSummary() {
      return this.latestVitals ? formatVitalsSummary(this.latestVitals) : ''
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
      this.loadCareCoordinationData(newId)
      if (newId) {
        this.$store.dispatch('clinical/fetchLabOrders')
        this.$store.dispatch('clinical/fetchImagingOrders')
        this.$store.dispatch('clinical/fetchMedicationAdministrations', { patientId: newId })
        this.$store.dispatch('clinical/fetchPatientMessages', newId)
      }
    }
  },
  mounted() {
    // Needed so a prescription written from here can be billed at the exact
    // DB catalog price, same as the standalone medications.vue flow —
    // otherwise Cash Office never sees a charge for it (no price to bill at).
    this.$store.dispatch('billing/fetchCatalog')
    // The eMAR grid needs both the orders (medications) and their per-dose
    // history (medicationAdministrations) — neither was being loaded for a
    // patient opened directly (only pharmacy/medications.vue populated the
    // former as a side effect of its own unrelated view).
    this.$store.dispatch('clinical/fetchMedications')
    // Load diagnostics when a chart is opened directly, not only after using
    // the standalone laboratory or imaging screens.
    this.$store.dispatch('clinical/fetchLabOrders')
    this.$store.dispatch('clinical/fetchImagingOrders')
    if (this.activePatientId) {
      this.$store.dispatch('clinical/fetchMedicationAdministrations', { patientId: this.activePatientId })
      this.$store.dispatch('clinical/fetchPatientMessages', this.activePatientId)
    }
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
    this.loadCareCoordinationData(this.activePatientId)
    if (process.client) {
      this.updateViewportBreakpoints()
      window.addEventListener('resize', this.updateViewportBreakpoints)
      document.addEventListener('visibilitychange', this.handleClinicalVisibilityChange)
      this.clinicalRefreshDayKey = localDayKey(this.clinicalNowTick)
      this.clinicalRefreshTimer = window.setInterval(this.refreshDaySensitiveData, 60000)
    }
  },
  beforeDestroy() {
    if (process.client) {
      window.removeEventListener('resize', this.updateViewportBreakpoints)
      document.removeEventListener('visibilitychange', this.handleClinicalVisibilityChange)
      if (this.clinicalRefreshTimer) window.clearInterval(this.clinicalRefreshTimer)
    }
  },
  methods: {
    refreshDaySensitiveData(force = false) {
      const now = Date.now()
      const nextDayKey = localDayKey(now)
      this.clinicalNowTick = now
      if (!force && nextDayKey === this.clinicalRefreshDayKey) return
      this.clinicalRefreshDayKey = nextDayKey
      if (!this.activePatientId) return
      this.$store.dispatch('clinical/fetchTasks', { patientId: this.activePatientId })
      this.$store.dispatch('clinical/fetchMedicationAdministrations', { patientId: this.activePatientId })
    },
    handleClinicalVisibilityChange() {
      if (document.visibilityState === 'visible') this.refreshDaySensitiveData(true)
    },
    translateSidebarText(value) {
      const keys = {
        Diabetes: 'diabetes',
        'Type 2': 'type_2',
        Hypertension: 'hypertension',
        Yes: 'yes',
        'Fall risk': 'fall_risk',
        High: 'high',
        'Skin integrity': 'skin_integrity',
        'Active wound': 'active_wound',
        Isolation: 'isolation',
        'No isolation': 'no_isolation',
        'Wound dressing change': 'wound_dressing_change',
        'Daily at 0900': 'daily_at_0900',
        'CBC with differential': 'cbc_differential',
        Scheduled: 'scheduled',
        'Medication review': 'medication_review',
        Acknowledge: 'acknowledge',
        'Lab order': 'lab_order',
        Requested: 'requested',
        'Imaging order': 'imaging_order',
        Medication: 'medication',
        Active: 'active'
      }
      return keys[value] ? this.$t(`clinical360.nursing.sidebar.values.${keys[value]}`) : value
    },
    submitGlobalSearch() {
      const directory = this.$store.getters['clinical/patientDirectory'] || []
      const exactPatient = directory.find(patient => exactPatientIdentifierMatch(patient, this.globalSearchQuery))
      if (exactPatient) {
        this.selectGlobalSearchResult({ type: 'patient', patient: exactPatient })
        return
      }
      if (this.globalSearchResults.length) this.selectGlobalSearchResult(this.globalSearchResults[0])
    },
    selectGlobalSearchResult(result) {
      if (!result) return
      if (result.type === 'patient' && result.patient) {
        this.$router.push(`/clinical/patients/${result.patient.id}`)
      } else if (result.type === 'tab') {
        this.selectChartTab(result.tab)
      } else if (result.type === 'navigator') {
        this.selectNavigator(result.navigator.key)
        if (result.section) this.selectNavigatorSection(result.section.key)
      } else if (result.type === 'activity') {
        const targetTab = this.visibleChartTabs.includes(result.tab) ? result.tab : 'Chart Review'
        this.selectChartTab(targetTab)
      }
      this.clearGlobalSearch()
    },
    scheduleGlobalSearchClose() {
      setTimeout(() => { this.globalSearchOpen = false }, 120)
    },
    clearGlobalSearch() {
      this.globalSearchQuery = ''
      this.globalSearchOpen = false
    },
    openTransferModal() {
      const rec = this.activePatientRecord
      if (rec) {
        this.transferForm.targetDepartment = rec.currentDepartment || 'General Medicine'
      }
      this.transferForm.reason = ''
      this.showTransferDialog = true
    },
    openReportCenter() {
      if (!this.activePatientId) return
      this.$router.push({ path: '/clinical/report-center', query: { patientId: this.activePatientId } })
    },
    async submitTransfer() {
      if (!this.transferForm.targetDepartment) {
        if (this.$toast) this.$toast.error('Please select a target department')
        return
      }
      this.transferLoading = true
      try {
        await this.$store.dispatch('clinical/transferPatient', {
          patientId: this.activePatientId,
          targetDepartment: this.transferForm.targetDepartment,
          reason: this.transferForm.reason
        })
        if (this.$toast) this.$toast.success(`Patient successfully transferred to ${this.transferForm.targetDepartment}`)
        this.showTransferDialog = false
      } finally {
        this.transferLoading = false
      }
    },
    avatarStorageKey() {
      return `camero_patient_avatar_placements_${this.activePatientId || 'demo'}`
    },
    loadCareCoordinationData(patientId) {
      if (!patientId) return
      this.$store.dispatch('clinical/fetchTasks', { patientId })
      this.$store.dispatch('clinical/fetchCareTeam', patientId)
      this.$store.dispatch('clinical/fetchSocialAssessments', patientId)
      this.$store.dispatch('discharge/fetchDischargeOverview', patientId)
    },
    loadAvatarPlacements() {
      const patientMarkers = (this.$store.getters['nursing/getBodyMapMarkers'] || [])
        .filter(item => item.patientId === this.activePatientId && item.source === 'avatar')
      const storeMarkers = patientMarkers
        .filter(item => !['resolved', 'removed'].includes(String(item.status || '').toLowerCase()))
      if (patientMarkers.length) {
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
      if (!this.ensurePatientWritable()) return
      this.selectedAvatarTool = this.selectedAvatarTool === key ? '' : key
    },
    startAvatarToolDrag(event, key) {
      if (!this.ensurePatientWritable()) return
      this.selectedAvatarTool = key
      if (event && event.dataTransfer) {
        event.dataTransfer.setData('text/plain', key)
        event.dataTransfer.effectAllowed = 'copy'
      }
    },
    handleAvatarDrop(event) {
      if (!this.ensurePatientWritable()) return
      const key = event && event.dataTransfer ? event.dataTransfer.getData('text/plain') : this.selectedAvatarTool
      this.placeAvatarItemFromEvent(event, key)
    },
    zoomAvatar(direction) {
      const step = 0.2
      const next = Math.round((this.avatarZoom + direction * step) * 100) / 100
      this.avatarZoom = Math.min(this.AVATAR_ZOOM_MAX, Math.max(this.AVATAR_ZOOM_MIN, next))
    },
    resetAvatarZoom() {
      this.avatarZoom = 1
    },
    handleAvatarCanvasClick(event) {
      if (this.isPatientDischarged) return
      if (!this.selectedAvatarTool) return
      const blocked = event.target && event.target.closest && event.target.closest('.avatar-sticker')
      if (blocked) return
      this.placeAvatarItemFromEvent(event, this.selectedAvatarTool)
    },
    placeAvatarItemFromEvent(event, key) {
      if (!this.ensurePatientWritable()) return
      const tool = this.avatarPlacementTools.find(item => item.key === key)
      const figure = this.$refs.avatarBodyFigure
      if (!tool || !figure || !event) return
      const rect = figure.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))
      const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))
      const placement = this.buildAvatarPlacement(tool, x, y)
      if (!placement.region) {
        this.toastError('Place the marker directly on the patient anatomy.')
        return
      }
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
        indication: '',
        insertedAt: now.slice(0, 16),
        nextReviewAt: '',
        sizeGauge: '',
        output: '',
        painScore: tool.key === 'pain' ? 0 : null,
        siteCondition: '',
        removalReason: '',
        siteCare: this.defaultAvatarSiteCare(tool.key),
        dressing: '',
        notes: '',
        createdAt: now,
        updatedAt: now
      }
    },
    detectAvatarRegion(x, y) {
      return detectAvatarRegion({ x, y, view: this.avatarView, anatomy: this.avatarAnatomy })
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
    reviewAvatarPlacement(item) {
      this.avatarView = item.view || 'front'
      this.openAvatarPlacement(item)
    },
    closeAvatarPlacementDialog() {
      this.$set(this.dialogs, 'avatarPlacement', false)
      this.forms.avatarPlacement = { ...defaultDialogForms().avatarPlacement }
    },
    openClearAvatarDialog() {
      if (!this.ensurePatientWritable() || !this.avatarPlacements.length) return
      this.avatarClearReason = ''
      this.$set(this.dialogs, 'clearAvatar', true)
    },
    async clearAvatarMarkers() {
      if (!this.ensurePatientWritable()) return
      const reason = String(this.avatarClearReason || '').trim()
      if (!reason) {
        this.toastError('Document the clinical reason before clearing the avatar.')
        return
      }
      const activeIds = new Set(this.avatarPlacements.map(item => item.id))
      const markers = (this.$store.getters['nursing/getBodyMapMarkers'] || [])
        .filter(item => item.patientId === this.activePatientId && item.source === 'avatar' && activeIds.has(item.id))
      const clearedAt = new Date().toISOString()
      this.savingDialog = true
      try {
        await Promise.all(markers.map(marker => this.$store.dispatch('nursing/updateBodyMapMarker', {
          ...marker,
          status: 'Removed',
          removalReason: reason,
          removedAt: clearedAt,
          removedBy: this.actorName(),
          batchCleared: true
        })))
        await this.$store.dispatch('clinical/addNursingNote', {
          patientId: this.activePatientId,
          recordedBy: this.actorName(),
          recordedAt: clearedAt,
          actions: [`Avatar cleared (${this.avatarPlacements.length} markers)`],
          observation: 'Visible wound, line and device markers reconciled and removed from the body map.',
          response: reason,
          orientation: 'Underlying clinical records and audit history retained.'
        })
        this.avatarPlacements = []
        this.selectedAvatarTool = ''
        this.persistAvatarPlacements()
        this.$set(this.dialogs, 'clearAvatar', false)
        this.avatarClearReason = ''
        this.toastSuccess('Avatar cleared. Clinical records remain in the chart history.')
      } catch (e) {
        this.toastError('Unable to clear the avatar markers.')
      } finally {
        this.savingDialog = false
      }
    },
    prepareAvatarPlacementRemoval() {
      this.forms.avatarPlacement.status = this.forms.avatarPlacement.type === 'wound' ? 'Resolved' : 'Removed'
      this.forms.avatarPlacement.removalReason = ''
      this.$nextTick(() => {
        const field = this.$refs.avatarRemovalReason
        const input = field && field.$refs && field.$refs.input
        if (input) input.focus()
      })
    },
    syncAvatarPlacementType(type) {
      const tool = this.avatarPlacementTools.find(item => item.key === type)
      if (!tool) return
      this.forms.avatarPlacement.label = tool.label
      this.forms.avatarPlacement.icon = tool.icon
      this.forms.avatarPlacement.color = tool.color
      if (!statusOptionsForAvatarType(type).includes(this.forms.avatarPlacement.status)) {
        this.forms.avatarPlacement.status = tool.defaultStatus || statusOptionsForAvatarType(type)[0]
      }
      this.forms.avatarPlacement.siteCare = this.defaultAvatarSiteCare(type)
    },
    async saveAvatarPlacement() {
      if (!this.ensurePatientWritable()) return
      const formRef = this.$refs.avatarPlacementFormRef
      if (formRef && !formRef.validate()) {
        this.toastError('Complete the required avatar documentation fields.')
        return
      }
      const form = { ...this.forms.avatarPlacement, updatedAt: new Date().toISOString() }
      const tool = this.avatarPlacementTools.find(item => item.key === form.type)
      if (tool) {
        form.label = tool.label
        form.icon = tool.icon
        form.color = tool.color
      }
      const shouldRemoveFromAvatar = isResolvedAvatarStatus(form.status)
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
        if (!shouldRemoveFromAvatar) {
          await this.$store.dispatch('clinical/createTask', {
            patientId: this.activePatientId,
            relatedType: `avatar-${form.type}`,
            relatedId: form.id,
            title: `${form.label} follow-up: ${form.region}`,
            assignedToRole: 'NURSE',
            priority: /escalate|needs|worsening|infiltrated|phlebitis|obstructed|severe|concern/i.test(form.status || '') ? 'Today' : 'Routine',
            actionReason: this.avatarPlacementClinicalSummary(form)
          })
        }
        await this.$store.dispatch('clinical/addNursingNote', {
          patientId: this.activePatientId,
          recordedBy: this.actorName(),
          recordedAt: form.updatedAt,
          actions: [shouldRemoveFromAvatar ? `${form.label} removed from avatar` : `Avatar ${form.label} mapping`],
          observation: this.avatarPlacementClinicalSummary(form),
          response: shouldRemoveFromAvatar ? form.removalReason : (form.siteCare || 'Continue site monitoring.'),
          orientation: [form.dressing, form.nextReviewAt ? `Next review: ${form.nextReviewAt}` : ''].filter(Boolean).join(' | ')
        })
        this.closeAvatarPlacementDialog()
        this.toastSuccess(shouldRemoveFromAvatar ? `${form.label} removed from avatar.` : `${form.label} location saved.`)
        if (form.type === 'wound' && !shouldRemoveFromAvatar) {
          this.$nextTick(() => { this.dialogs.woundCare = true })
        }
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
            status: status === 'resolved' ? 'healed' : (status === 'removed' ? 'closed' : (['improving', 'worsening', 'active'].includes(status) ? status : existing.status || 'active')),
            anatomicalLocation: form.region || existing.anatomicalLocation,
            woundType: form.indication || existing.woundType,
            avatarMarkerId: form.id,
            updatedBy: this.actorName()
          })
        }
      }
      if (status === 'resolved' || status === 'removed') return null
      return this.$store.dispatch('nursing/createWound', {
        patientId: this.activePatientId,
        woundType: form.indication || 'Wound from avatar',
        anatomicalLocation: form.region,
        acquiredLocation: 'unknown',
        status: 'active',
        avatarMarkerId: form.id,
        source: 'avatar'
      })
    },
    avatarPlacementClinicalSummary(form) {
      return [
        `${form.label} at ${form.region} (${form.view})`,
        `status: ${form.status}`,
        form.indication ? `indication/type: ${form.indication}` : '',
        form.sizeGauge ? `size: ${form.sizeGauge}` : '',
        form.output ? `output/drainage: ${form.output}` : '',
        form.painScore !== null && form.painScore !== '' ? `pain: ${form.painScore}/10` : '',
        form.siteCondition ? `site: ${form.siteCondition}` : '',
        form.dressing ? `dressing: ${form.dressing}` : '',
        form.notes || ''
      ].filter(Boolean).join(' | ')
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
        return
      }
      if (['DOCTOR', 'NP'].includes(this.currentRole) && this.selectedChartTab === 'Summary' && this.visibleChartTabs.includes('Doctor Command Center')) {
        this.selectChartTab('Doctor Command Center')
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
    selectNavigatorSection(key) {
      this.selectedNavigatorSection = key
      if (this.selectedNavigator === 'sdoh') {
        const domainBySection = {
          'food insecurity': 'food',
          'transportation needs': 'transport',
          'financial strain': 'financial',
          stress: 'stress',
          housing: 'housing',
          'social support': 'support'
        }
        this.activeSdoh = domainBySection[String(key || '').toLowerCase()] || this.activeSdoh
      }
    },
    moveNavigatorSection(direction) {
      const nextIndex = Math.min(Math.max(this.navigatorSectionIndex + direction, 0), this.activeNavigatorSections.length - 1)
      const section = this.activeNavigatorSections[nextIndex]
      if (section) this.selectNavigatorSection(section.key)
    },
    setNavigatorContext(key) {
      this.selectedNavigator = key
      const nav = this.navigatorTabs.find(item => item.key === key)
      const first = nav && nav.sections && nav.sections[0]
      this.selectNavigatorSection(first ? (typeof first === 'string' ? first : first.key) : '')
    },
    normalizeOrderKind(kind) {
      const value = String(kind || '').toLowerCase()
      if (value.includes('lab')) return 'lab'
      if (value.includes('imag') || value.includes('radio')) return 'imaging'
      if (value.includes('med') || value.includes('pill')) return 'medication'
      if (value.includes('wound')) return 'wound'
      return 'nursing'
    },
    openNurseCommandTile(item) {
      const label = String(item && item.label ? item.label : '').toLowerCase()
      if (/vital|assessment/.test(label)) return this.openCommandAction('nurse')
      if (/medication/.test(label)) return this.selectChartTab('MAR')
      if (/wound|skin/.test(label)) return this.selectChartTab('Wound Management')
      if (/mobility|hygiene|support/.test(label)) return this.openCommandAction('flowsheet')
      if (/handoff/.test(label)) return this.selectChartTab('Handoff')
      if (/documentation|note/.test(label)) return this.selectChartTab('Notes')
      return this.selectChartTab('Work List')
    },
    openCommandAction(action) {
      const target = String(action || '').toLowerCase()
      if (this.isPatientDischarged) {
        this.toastError('This patient has been discharged. The Patient 360 chart is read only.')
        return
      }
      if (target === 'safety-allergies') {
        this.openContextForm('safety', { type: 'allergies' })
        return
      }
      if (target === 'safety-precautions') {
        this.openContextForm('safety', { type: 'precautions' })
        return
      }
      if (target === 'safety-fall') {
        this.openContextForm('safety', { type: 'fall' })
        return
      }
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
        this.openContextForm('order')
        return
      }
      if (target === 'lab-results') {
        if (this.patientLabOrders.length && ['ADMIN', 'LAB'].includes(this.currentRole)) this.openContextForm('labResult')
        else if (this.patientLabOrders.length) this.selectedChartTab = this.visibleChartTabs.includes('Lab Results') ? 'Lab Results' : 'Orders'
        else this.openOrderComposer('lab')
        return
      }
      if (target === 'imaging-results') {
        if (this.patientImagingOrders.length && ['ADMIN', 'IMAGING'].includes(this.currentRole)) this.openContextForm('imagingResult')
        else if (this.patientImagingOrders.length) this.selectedChartTab = this.visibleChartTabs.includes('Chart Review') ? 'Chart Review' : 'Orders'
        else this.openOrderComposer('imaging')
        return
      }
      if (target === 'care-team') {
        this.openContextForm('careTeam')
        return
      }
      if (target === 'discharge-plan') {
        this.dialogs.discharge = true
        return
      }
      if (target === 'admission') {
        if (this.$refs.navigatorStrip) this.$refs.navigatorStrip.openAdmissionChecklist()
        return
      }
      if (target === 'transfer') {
        if (this.$refs.navigatorStrip) this.$refs.navigatorStrip.openTransferChecklist()
        return
      }
      if (target === 'discharge') {
        this.dialogs.discharge = true
        return
      }
      if (target === 'document') {
        this.openChartDialog('document')
        return
      }
      if (target === 'education') {
        this.openContextForm('education')
        return
      }
      if (target === 'care-plan') {
        this.dialogs.carePlan = true
        return
      }
      if (target === 'lab') {
        this.openOrderComposer('lab')
        return
      }
      if (target === 'medication') {
        if (this.patientMedications.length) this.openMarQuickScan()
        else this.openChartDialog('medication')
        return
      }
      if (target === 'registration') {
        if (this.$refs.navigatorStrip) this.$refs.navigatorStrip.openAdmissionChecklist()
        return
      }
      if (target === 'worklist') {
        this.openContextForm('task')
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
        this.openContextForm('social')
        return
      }
      if (target === 'notes') {
        this.noteDialogConfig = { noteType: 'progress_note', dialogTitle: 'Clinical progress note', existingNote: null }
        this.dialogs.note = true
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
    openContextForm(kind, options = {}) {
      if (!this.ensurePatientWritable() || !this.$refs.contextForms) return false
      return this.$refs.contextForms.open(kind, options)
    },
    async updateWorkListTask({ task, status, reason, ...continuity }) {
      if (!task || !task.id || !this.ensurePatientWritable()) return
      const labels = { done: 'completed', hold: 'placed on hold', cancel: 'cancelled' }
      try {
        if (status === 'done') {
          const result = await this.$store.dispatch('clinical/completeTaskAndScheduleNext', {
            id: task.id,
            reason,
            ...continuity
          })
          this.toastSuccess(`Task completed. Next occurrence scheduled ${this.formatShortDate(result.nextTask.dueAt)}.`)
          return
        }
        await this.$store.dispatch('clinical/updateTaskStatus', {
          id: task.id,
          status,
          reason: reason || `Task ${labels[status] || 'updated'} from Patient 360 Work List`,
          ...continuity
        })
        this.toastSuccess(`Task ${labels[status] || 'updated'}.`)
      } catch (error) {
        this.toastError(error.message || 'Unable to update the work-list task.')
      }
    },
    handleWorkListReminder(tasks) {
      if (!Array.isArray(tasks) || !tasks.length) return
      this.toastError(`${tasks.length} work-list task(s) are due now or approaching.`)
    },
    handleContextFormSaved(message) {
      this.toastSuccess(message)
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
          const catalogItem = findMedicationCatalogItem(this.forms.order.medication.medication)
          this.forms.order.medication.medicationClass = order.raw.medicationClass || (catalogItem && catalogItem.medicationClass) || ''
          this.forms.order.medication.indication = order.raw.indication || ''
          this.forms.order.medication.sideEffects = order.raw.sideEffects || (catalogItem && catalogItem.sideEffects) || ''
          this.forms.order.medication.education = order.raw.education || (catalogItem && catalogItem.education) || ''
          this.forms.order.medication.safetyWarnings = order.raw.safetyWarnings || (catalogItem && catalogItem.warnings) || ''
          this.forms.order.medication.form = order.raw.form || (catalogItem && catalogItem.form) || ''
          this.forms.order.medication.priority = order.raw.priority || 'Routine'
          this.forms.order.instructions = order.raw.administrationInstructions || order.raw.instructions || order.raw.notes || order.detail || ''
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
    openMedicationFromCatalog(item) {
      if (!item || !this.ensurePatientWritable()) return
      this.openChartDialog('medication')
      this.forms.order.medication.medication = item.genericName || ''
      this.forms.order.medication.route = item.routes && item.routes[0] ? item.routes[0] : 'Oral'
      this.forms.order.medication.medicationClass = item.medicationClass || ''
      this.forms.order.medication.indication = item.needs && item.needs[0] ? item.needs[0] : ''
      this.forms.order.medication.sideEffects = item.sideEffects || ''
      this.forms.order.medication.education = item.education || ''
      this.forms.order.medication.safetyWarnings = item.warnings || ''
      this.forms.order.medication.form = item.form || ''
      this.forms.order.medication.priority = 'Routine'
      this.forms.order.instructions = ''
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
    marReportStatusColor(status) {
      const colors = { Given: '#16a34a', Held: '#7c3aed', Refused: '#dc2626', 'Not Available': '#64748b', Due: '#f97316' }
      return colors[status] || '#64748b'
    },
    formatSlotTime(iso) {
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return null
      return `${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`
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
    onEmarCellClick({ medication, administration, defaultAction }) {
      if (defaultAction === 'details' && administration && administration.status !== 'Given') {
        // A resolved-but-non-Given cell (Held/Refused/N-A) still opens the
        // action dialog pre-filled, rather than the read-only order details,
        // so a nurse can review/amend what was filed.
        this.openMarAction(administration.status.toLowerCase(), medication, { time: this.formatSlotTime(administration.scheduledFor), administrationId: administration.id })
        return
      }
      if (defaultAction === 'details') {
        this.openOrderComposer('medication', medication.orderItem)
        return
      }
      const cell = medication.timeline.find(c => administration && c.administrationId === administration.id)
      this.openMarAction('given', medication, cell)
    },
    onEmarRowAction({ action, medication }) {
      this.openMarAction(action, medication)
    },
    async sendChatMessage(body) {
      try {
        await this.$store.dispatch('clinical/sendPatientMessage', { patientId: this.activePatientId, body })
      } catch (e) {
        this.toastError('Unable to send message.')
      }
    },
    openMarReport(medication) {
      this.selectedMarMedication = medication
      this.$set(this.dialogs, 'marReport', true)
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
        'not available': 'Not Available',
        scan: 'Not scanned',
        education: 'Patient education'
      }
      // No cell was clicked (row action button) — fall back to this
      // medication's earliest still-open (Due) dose so the action applies to
      // the right administration record.
      const targetCell = cell || (medication && medication.timeline.find(c => c.status === 'due'))
      this.selectedMarMedication = medication
      this.selectedMarAdministrationId = targetCell ? targetCell.administrationId : null
      this.selectedMarAction = actionMap[normalized] || 'Given'
      this.forms.mar = {
        ...defaultDialogForms().mar,
        action: this.selectedMarAction,
        time: targetCell && targetCell.time ? targetCell.time : this.marTimeFocus,
        dose: medication ? medication.detail.split(' · ')[0] || '' : '',
        comment: targetCell && targetCell.text ? `eMAR cell ${targetCell.time}: ${targetCell.text}` : '',
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
        const action = this.forms.mar.action || 'Given'
        const administrationStatusMap = { Given: 'Given', Held: 'Held', Refused: 'Refused', 'Not Available': 'Not Available' }
        const administrationStatus = administrationStatusMap[action]
        if (administrationStatus) {
          let administrationId = this.selectedMarAdministrationId
          if (!administrationId && this.selectedMarMedication.raw && this.selectedMarMedication.raw.id) {
            // PRN / demand doses have no pre-scheduled "Due" row — create one
            // filed for right now, then administer it in the same flow.
            const created = await this.$store.dispatch('clinical/createMedicationAdministration', {
              medicationId: this.selectedMarMedication.raw.id,
              patientId: this.activePatientId,
              scheduledFor: new Date().toISOString()
            })
            administrationId = (created.administration || created).id
          }
          if (administrationId) {
            await this.$store.dispatch('clinical/administerMedication', {
              id: administrationId,
              status: administrationStatus,
              route: this.selectedMarMedication.route,
              doseGiven: this.forms.mar.dose,
              site: this.forms.mar.site,
              refusalReason: action === 'Refused' ? this.forms.mar.comment : undefined,
              patientResponse: this.forms.mar.patientResponse,
              comment: this.forms.mar.comment
            })
          }
        }
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
      if (kind !== 'scan' && !this.ensurePatientWritable()) return
      if (kind === 'nurse' && !this.canLaunchNurse) {
        this.$toast.error('Your role does not have access to nursing charting.')
        return
      }
      if (kind === 'medical' && !this.canLaunchMedical) {
        this.$toast.error('Your role does not have access to medical charting.')
        return
      }
      if (kind === 'medication' && !this.canLaunchPrescription) {
        this.$toast.error('Your role does not have access to prescribe or modify medication orders.')
        return
      }
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
      if (kind === 'discharge') {
        this.forms.discharge = defaultDialogForms().discharge
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
        discharge_note: 'Discharge Note',
        social_coordination_note: 'Social Work Note',
        unit_coordination_note: 'Unit Management Note',
        supervision_coordination_note: 'Nursing Supervision Note'
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
      if (!this.ensurePatientWritable()) return
      if (!this.selectedNote) return
      this.noteDialogConfig = {
        noteType: this.selectedNote.noteType,
        dialogTitle: this.selectedNote.title,
        existingNote: this.selectedNote
      }
      this.dialogs.note = true
    },
    async signSelectedNote() {
      if (!this.ensurePatientWritable()) return
      if (!this.selectedNoteId) return
      await this.$store.dispatch('nursing/signClinicalNote', this.selectedNoteId)
      this.toastSuccess('Note signed.')
    },
    amendSelectedNote() {
      if (!this.ensurePatientWritable()) return
      if (!this.selectedNoteId) return
      this.amendingNoteId = this.selectedNoteId
      this.amendmentDraft = ''
    },
    async submitAmendment() {
      if (!this.ensurePatientWritable()) return
      if (!this.amendmentDraft.trim()) return
      await this.$store.dispatch('nursing/amendClinicalNote', { id: this.amendingNoteId, amendment: this.amendmentDraft.trim() })
      this.amendingNoteId = null
      this.amendmentDraft = ''
      this.toastSuccess('Amendment recorded.')
    },
    async shareSelectedNote() {
      if (!this.ensurePatientWritable()) return
      if (!this.selectedNoteId) return
      await this.$store.dispatch('nursing/shareClinicalNote', this.selectedNoteId)
      this.toastSuccess('Note shared with care team.')
    },
    handleNoteSaved(note) {
      this.dialogs.note = false
      if (note) this.selectedNoteId = note.id
      this.toastSuccess('Note saved.')
    },
    openWoundDialog(wound) {
      this.selectedWoundForDialogId = wound && wound.id ? wound.id : ''
      this.dialogs.woundCare = true
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
    async handleDischargeSaved(payload) {
      await this.completePatientDischarge(payload || {})
    },
    openScannedPatient(patient) {
      if (!patient || !patient.id) return
      this.closeChartDialog('scan')
      this.$router.push(`/clinical/patients/${patient.id}`)
    },
    handleWoundPhotoSaved() {
      this.toastSuccess('Wound photo saved.')
    },
    async signCarePlanFromCard(id) {
      if (!this.ensurePatientWritable()) return
      await this.$store.dispatch('nursing/signCarePlan', id)
      this.toastSuccess('Care plan signed.')
    },
    async archiveCarePlanFromCard(id) {
      if (!this.ensurePatientWritable()) return
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
    ensurePatientWritable() {
      if (!this.activePatientId || this.isPatientDischarged) {
        this.toastError('This patient has been discharged. The Patient 360 chart is read only.')
        return false
      }
      return true
    },
    async completePatientDischarge(payload) {
      if (this.isPatientDischarged) return
      try {
        await this.$store.dispatch('clinical/dischargePatient', {
          patientId: this.activePatientId,
          ...payload
        })
        this.currentWorkflowState = 'discharge'
        Object.keys(this.dialogs).forEach(key => this.$set(this.dialogs, key, false))
        this.toastSuccess('Patient discharged. The chart is now read only and listed under Inactive patients.')
      } catch (error) {
        this.toastError('Unable to complete the discharge workflow.')
      }
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
        await this.$store.dispatch('clinical/createTasksFromClinicalOrder', {
          order: { id: record.id, type: 'lab', description: this.forms.order.lab.testName, assigned_role: 'LAB', priority: this.forms.order.lab.priority || 'Routine', due_at: record.requestedAt || new Date().toISOString(), frequency: 'Once' },
          patient: { id: patientId, name: this.activePatient.displayName || this.activePatient.name },
          encounter: { id: this.currentEncounterId }
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
        await this.$store.dispatch('clinical/createTasksFromClinicalOrder', {
          order: { id: record.id, type: 'imaging', description: this.forms.order.imaging.modality, assigned_role: 'IMAGING', priority: this.forms.order.imaging.priority || 'Routine', due_at: record.requestedAt || new Date().toISOString(), frequency: 'Once' },
          patient: { id: patientId, name: this.activePatient.displayName || this.activePatient.name },
          encounter: { id: this.currentEncounterId }
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
        const catalogItem = findMedicationCatalogItem(this.forms.order.medication.medication)
        const record = await this.$store.dispatch('clinical/prescribeMedication', {
          patientId,
          medication: this.forms.order.medication.medication,
          dosage: this.forms.order.medication.dosage,
          drug: this.forms.order.medication.medication,
          dose: this.forms.order.medication.dosage,
          route: this.forms.order.medication.route,
          frequency: this.forms.order.medication.frequency,
          medicationClass: this.forms.order.medication.medicationClass || (catalogItem && catalogItem.medicationClass) || '',
          indication: this.forms.order.medication.indication || '',
          sideEffects: this.forms.order.medication.sideEffects || (catalogItem && catalogItem.sideEffects) || '',
          education: this.forms.order.medication.education || (catalogItem && catalogItem.education) || '',
          safetyWarnings: this.forms.order.medication.safetyWarnings || (catalogItem && catalogItem.warnings) || '',
          form: this.forms.order.medication.form || (catalogItem && catalogItem.form) || '',
          priority: this.forms.order.medication.priority || 'Routine',
          instructions: this.forms.order.instructions,
          notes: this.forms.order.instructions,
          prescribedBy: recordedBy
        })
        // The backend auto-schedules the first eMAR dose when the order is
        // created — pull it in now so the grid shows it immediately instead
        // of waiting for the next unrelated refresh.
        await this.$store.dispatch('clinical/fetchMedicationAdministrations', { patientId })
        await this.$store.dispatch('clinical/createTasksFromClinicalOrder', {
          order: { id: record.id, type: 'medication', medication: this.forms.order.medication.medication, description: this.forms.order.instructions || `Administer ${this.forms.order.medication.medication}`, assigned_role: 'NURSE', priority: 'Routine', due_at: record.prescribedAt || new Date().toISOString(), frequency: this.forms.order.medication.frequency || 'Once' },
          patient: { id: patientId, name: this.activePatient.displayName || this.activePatient.name },
          encounter: { id: this.currentEncounterId }
        })

        // Bill the Cash Office at the exact DB price catalog rate — without
        // this, a prescription written here never reaches Cash Office at all
        // (chargeForMedication was only ever called from medications.vue).
        // orderSelectedCatalogItem is required by the field's own validation
        // rule and the submit button's :disabled, so this should always be
        // set here — the else branch is defensive, not the expected path.
        const drugName = this.forms.order.medication.medication
        const catalogPriceItem = this.orderSelectedCatalogItem
        if (catalogPriceItem && catalogPriceItem.unitPrice !== undefined) {
          await this.$store.dispatch('billing/chargeForMedication', {
            patientId,
            medicationId: record.id,
            drugName,
            unitPrice: Number(catalogPriceItem.unitPrice),
            quantity: 1
          })
        } else {
          this.toastError('Drug not found in official price catalog — patient not billed. Add it to the price catalog first.')
        }

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
    async saveDischargeBundle() {
      const patientId = this.activePatientId
      this.savingDialog = true
      try {
        const recordedAt = new Date().toISOString()
        const note = await this.$store.dispatch('discharge/addDischargeNote', {
          patientId,
          encounterId: this.currentEncounterId,
          admissionId: this.currentAdmissionId,
          noteType: 'discharge_note',
          title: this.forms.discharge.noteTitle || 'Discharge note',
          body: [this.forms.discharge.note, this.forms.discharge.handoff].filter(Boolean).join('\n\n'),
          readiness: this.forms.discharge.readiness,
          recordedAt
        })
        if (this.forms.discharge.medsAtDischarge.trim()) {
          await this.$store.dispatch('discharge/addDischargeMedication', {
            patientId,
            encounterId: this.currentEncounterId,
            admissionId: this.currentAdmissionId,
            name: this.forms.discharge.noteTitle || 'Discharge medications',
            details: this.forms.discharge.medsAtDischarge,
            recordedAt
          })
        }
        if (this.forms.discharge.returnPrecautions.trim()) {
          await this.$store.dispatch('discharge/addReturnPrecaution', {
            patientId,
            encounterId: this.currentEncounterId,
            admissionId: this.currentAdmissionId,
            title: 'Return precautions',
            details: this.forms.discharge.returnPrecautions,
            recordedAt
          })
        }
        if (this.forms.discharge.followUpAppointment.trim() || this.forms.discharge.appointments.trim()) {
          await this.$store.dispatch('discharge/addDischargeAppointment', {
            patientId,
            encounterId: this.currentEncounterId,
            admissionId: this.currentAdmissionId,
            title: this.forms.discharge.followUpAppointment || 'Follow-up appointment',
            notes: this.forms.discharge.appointments,
            recordedAt
          })
        }
        await this.$store.dispatch('clinical/createDocument', {
          patientId,
          title: this.forms.discharge.noteTitle || 'Discharge summary',
          category: 'Discharge Summary',
          content: [this.forms.discharge.note, this.forms.discharge.handoff, this.forms.discharge.medsAtDischarge, this.forms.discharge.returnPrecautions].filter(Boolean).join('\n\n'),
          status: 'Filed'
        })
        await this.$store.dispatch('clinical/createTask', {
          patientId,
          title: 'Discharge follow-up complete',
          assignedToRole: 'NURSE',
          priority: 'Today',
          relatedType: 'discharge',
          relatedId: note.id,
          actionReason: 'Discharge bundle filed from Patient 360'
        })
        this.selectedChartTab = 'Navigators'
        this.selectedNavigator = 'discharge'
        this.closeChartDialog('discharge')
        this.toastSuccess('Discharge bundle filed.')
      } catch (e) {
        this.toastError('Unable to file discharge bundle.')
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
        'Social Services': 'sdoh',
        'Unit Management': 'worklist',
        'Nursing Supervision': 'worklist',
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
      // Prefer the reactive Vuex record when available. The route can provide
      // an initial patient snapshot, but mutations (for example adding an
      // allergy from the Safety Watch dialog) update Vuex first. Returning the
      // prop snapshot here made the save succeed while the banner still showed
      // the old value until a full page reload.
      const all = this.$store.getters['clinical/patientDirectoryAll'] || []
      const directory = this.$store.getters['clinical/patientDirectory'] || []
      const patients = this.$store.getters['clinical/getPatients'] || []
      return all.find(item => item.id === id)
        || directory.find(item => item.id === id)
        || patients.find(item => item.id === id)
        || (this.patientRecord && this.patientRecord.id === id ? this.patientRecord : null)
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
    },
    async handleWorkflowComplete(workflowType, payload = {}) {
      const workflowMessages = {
        admission: 'Admission checklist completed successfully.',
        transfer: 'Transfer workflow completed successfully.',
        discharge: 'Discharge summary completed successfully.'
      }
      this.toastSuccess(workflowMessages[workflowType] || 'Workflow completed.')
      if (workflowType === 'admission') {
        this.currentWorkflowState = 'active-care'
      } else if (workflowType === 'discharge') {
        await this.completePatientDischarge(payload)
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
    avatarPlacementValid: false,
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
      medication: { medication: '', dosage: '', route: 'Oral', frequency: '', medicationClass: '', indication: '', sideEffects: '', education: '', safetyWarnings: '', form: '', priority: 'Routine' }
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
    discharge: {
      noteTitle: '',
      readiness: 'Not yet ready',
      note: '',
      handoff: '',
      medsAtDischarge: '',
      returnPrecautions: '',
      followUpAppointment: '',
      appointments: ''
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
      indication: '',
      insertedAt: '',
      nextReviewAt: '',
      sizeGauge: '',
      output: '',
      painScore: null,
      siteCondition: '',
      removalReason: '',
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
  position: relative;
  z-index: 40;
}
.search-box input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #0f172a;
  font-size: 11px;
  letter-spacing: 0;
}
.search-box input::placeholder { color: #64748b; opacity: 1; }
.search-clear { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border: 0; background: transparent; color: #475569; }
.global-search-results {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  max-height: 360px;
  overflow-y: auto;
  border: 1px solid #94a3b8;
  background: #fff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, .18);
}
.global-search-results > button {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  padding: 6px 10px;
  border: 0;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
  text-align: left;
  cursor: pointer;
}
.global-search-results > button:hover,
.global-search-results > button:focus { background: #f0fdfa; outline: 2px solid #0f766e; outline-offset: -2px; }
.global-search-results > button > span { display: grid; min-width: 0; }
.global-search-results strong { overflow: hidden; color: #0f172a; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.global-search-results small { overflow: hidden; color: #64748b; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.global-search-results b { color: #0f766e; font-size: 8px; text-transform: uppercase; }
.search-empty { padding: 14px; color: #64748b; font-size: 10px; text-align: center; }
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
.navigator-layout > .workspace-panel {
  grid-column: 1 / -1;
}
.navigator-layout > .navigator-rail + .workspace-panel {
  grid-column: 2;
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
.navigator-active-workspace {
  display: grid;
  gap: 8px;
  margin-top: 8px;
}
.navigator-active-head {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 11px;
  border: 1px solid #b7c9c6;
  border-left: 4px solid #0f766e;
  background: #f5fbfa;
}
.navigator-active-head > div:first-child {
  min-width: 0;
  display: grid;
  gap: 2px;
}
.navigator-active-head span {
  color: #0f766e;
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
}
.navigator-active-head strong {
  color: #16324f;
  font-size: 15px;
}
.navigator-active-head p {
  margin: 0;
  color: #526579;
  font-size: 11px;
}
.navigator-section-pager {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 32px 56px 32px;
  align-items: center;
  border: 1px solid #b9c9d2;
  background: #fff;
}
.navigator-section-pager button {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 0;
  color: #0f766e;
  background: transparent;
}
.navigator-section-pager button:disabled { color: #cbd5e1; }
.navigator-section-pager button:not(:disabled):hover,
.navigator-section-pager button:not(:disabled):focus-visible { background: #e9f7f5; outline: 2px solid #0f766e; outline-offset: -2px; }
.navigator-section-pager b { color: #365469; font-size: 10px; text-align: center; }
.navigator-readiness {
  display: grid;
  grid-template-columns: 130px minmax(120px, 1fr) minmax(180px, auto);
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid #d7e0df;
  background: #fff;
}
.navigator-readiness > div:first-child {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.navigator-readiness span,
.navigator-readiness small { color: #64748b; font-size: 10px; }
.navigator-readiness strong { color: #16324f; font-size: 13px; }
.navigator-readiness-track { height: 7px; overflow: hidden; background: #e2e8f0; }
.navigator-readiness-track i { display: block; height: 100%; background: #0f766e; transition: width .2s ease; }
.navigator-readiness.warning .navigator-readiness-track i { background: #f97316; }
.navigator-readiness.due .navigator-readiness-track i { background: #be123c; }
.navigator-continuity-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.navigator-continuity-grid article {
  min-width: 0;
  border: 1px solid #d7e0df;
  background: #fff;
}
.navigator-continuity-grid article > header {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 6px 9px;
  border-bottom: 1px solid #d7e0df;
  background: #f7fafb;
}
.navigator-continuity-grid header strong { color: #365469; font-size: 11px; }
.navigator-continuity-grid ul { margin: 0; padding: 0 9px; list-style: none; }
.navigator-continuity-grid li {
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid #edf2f4;
  color: #64748b;
  font-size: 10px;
}
.navigator-continuity-grid li:last-child { border-bottom: 0; }
.navigator-continuity-grid li b { max-width: 64%; color: #16324f; text-align: right; overflow-wrap: anywhere; }
.navigator-continuity-grid li b.good { color: #0f766e; }
.navigator-continuity-grid li b.warning { color: #b45309; }
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
  width: 100%;
  min-height: 104px;
  padding: 10px;
  border: 1px solid #d7e0df;
  border-left: 4px solid #64748b;
  border-radius: 8px;
  background: #fff;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
}
.summary-status-card:hover,
.summary-status-card:focus-visible { background: #f0fdfa; outline: 2px solid transparent; }
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
.summary-cycle-panel {
  border: 1px solid #b7c9c6;
  background: #fff;
}
.summary-cycle-panel > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid #d7e0df;
  background: #f8fafc;
}
.summary-cycle-panel > header span {
  display: block;
  color: #0f766e;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}
.summary-cycle-panel > header strong { color: #0f172a; font-size: 14px; }
.summary-completeness { text-align: right; }
.summary-completeness strong { display: block; color: #0f766e !important; font-size: 18px !important; }
.summary-cycle-track {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.summary-cycle-step {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 16px;
  align-items: center;
  gap: 8px;
  min-height: 68px;
  padding: 10px;
  border: 0;
  border-right: 1px solid #e2e8f0;
  background: #fff;
  color: #0f172a;
  cursor: pointer;
  text-align: left;
}
.summary-cycle-step:last-child { border-right: 0; }
.summary-cycle-step:hover { background: #f0fdfa; }
.summary-cycle-step > span {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  font-size: 11px;
  font-weight: 900;
}
.summary-cycle-step.complete > span { background: #dcfce7; color: #166534; }
.summary-cycle-step.active > span { background: #dbeafe; color: #075985; }
.summary-cycle-step.warning > span { background: #ffedd5; color: #9a3412; }
.summary-cycle-step.due > span { background: #fee2e2; color: #991b1b; }
.summary-cycle-step strong { display: block; font-size: 12px; }
.summary-cycle-step small { display: block; margin-top: 2px; color: #64748b; font-size: 10px; line-height: 1.25; }
.summary-safety-list,
.summary-department-list { display: grid; }
.summary-safety-list button,
.summary-department-list button {
  display: grid;
  align-items: center;
  gap: 9px;
  min-height: 52px;
  padding: 8px 12px;
  border: 0;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
  color: #0f172a;
  cursor: pointer;
  text-align: left;
}
.summary-safety-list button { grid-template-columns: 22px minmax(0, 1fr); border-left: 4px solid #16a34a; }
.summary-safety-list button.warning { border-left-color: #f97316; }
.summary-safety-list button.critical { border-left-color: #be123c; }
.summary-department-list button { grid-template-columns: 22px minmax(0, 1fr) auto; }
.summary-safety-list button:last-child,
.summary-department-list button:last-child { border-bottom: 0; }
.summary-safety-list button:hover,
.summary-department-list button:hover { background: #f8fafc; }
.summary-safety-list strong,
.summary-department-list strong { display: block; color: #134e4a; font-size: 12px; }
.summary-safety-list span,
.summary-department-list span { display: block; color: #64748b; font-size: 10px; }
.summary-department-list em {
  padding: 2px 6px;
  border-radius: 4px;
  background: #e2e8f0;
  color: #475569;
  font-size: 9px;
  font-style: normal;
  font-weight: 900;
  text-transform: uppercase;
}
.summary-department-list em.complete { background: #dcfce7; color: #166534; }
.summary-department-list em.active { background: #dbeafe; color: #075985; }
.summary-department-list em.warning { background: #ffedd5; color: #9a3412; }
.summary-department-list em.due { background: #fee2e2; color: #991b1b; }
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
.flow-section header .flow-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: #1d4ed8;
  cursor: pointer;
  font-size: 11px;
  font-weight: 800;
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
  grid-template-columns: repeat(2, 1fr);
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
.avatar-zoom-toggle {
  background: #fff;
  border-bottom: 1px solid #d7e0df;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 9px;
}
.avatar-zoom-toggle button {
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #334155;
  cursor: pointer;
  min-width: 28px;
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.avatar-zoom-toggle button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.avatar-zoom-toggle span {
  font-size: 11px;
  font-weight: 900;
  color: #334155;
  min-width: 38px;
  text-align: center;
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
  transition: transform 0.15s ease;
  transform-origin: center top;
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
.avatar-placement-summary small {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
}
.avatar-mapped-items {
  border: 1px solid #d7e0df;
  display: grid;
  max-height: 190px;
  overflow: auto;
}
.avatar-mapped-items button {
  align-items: center;
  background: #fff;
  border: 0;
  border-bottom: 1px solid #e2e8f0;
  color: #0f172a;
  cursor: pointer;
  display: grid;
  gap: 7px;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  min-height: 42px;
  padding: 6px 8px;
  text-align: left;
}
.avatar-mapped-items button:last-child {
  border-bottom: 0;
}
.avatar-mapped-items button:hover,
.avatar-mapped-items button:focus-visible {
  background: #f0fdfa;
  outline: 2px solid #0f766e;
  outline-offset: -2px;
}
.avatar-mapped-items button span {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.avatar-mapped-items button strong {
  font-size: 11px;
  font-weight: 900;
}
.avatar-mapped-items button small {
  color: #64748b;
  font-size: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.avatar-mapped-items button em {
  color: #0f766e;
  font-size: 9px;
  font-style: normal;
  font-weight: 900;
  text-transform: uppercase;
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
.command-live-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 1fr));
  border: 1px solid #b8d3cf;
  background: #fff;
}
.command-live-strip button {
  min-height: 66px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2px 8px;
  padding: 9px 11px;
  text-align: left;
  border-right: 1px solid #dbe6e3;
}
.command-live-strip button:last-child { border-right: 0; }
.command-live-strip span { color: #475569; font-size: 11px; font-weight: 800; }
.command-live-strip strong { color: #0f766e; font-size: 16px; text-align: right; }
.command-live-strip small { grid-column: 1 / -1; color: #64748b; }
.command-live-strip button:hover { background: #eef7f5; }
.nurse-live { border-color: #a7c6df; }
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
  text-align: left;
  cursor: pointer;
}
.nurse-focus-card:hover { background: #f0fdfa; border-color: #0f766e; }
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
  .navigator-layout > .navigator-rail + .workspace-panel {
    grid-column: 1;
  }
  .navigator-rail {
    border-right: 0;
    border-bottom: 1px solid #94a3b8;
    overflow-x: auto;
  }
  .navigator-rail .rail-group {
    grid-auto-columns: minmax(160px, 200px);
    grid-auto-flow: column;
    margin-top: 0;
    padding-top: 0;
  }
  .navigator-rail .rail-group > strong { display: none; }
  .navigator-readiness { grid-template-columns: 120px minmax(120px, 1fr); }
  .navigator-readiness > small { grid-column: 1 / -1; }
  .navigator-continuity-grid { grid-template-columns: 1fr; }
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
  .summary-cycle-track {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .summary-cycle-step:nth-child(2) { border-right: 0; }
  .summary-cycle-step:nth-child(-n+2) { border-bottom: 1px solid #e2e8f0; }
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
  .summary-cycle-track {
    grid-template-columns: 1fr;
  }
  .summary-cycle-step,
  .summary-cycle-step:nth-child(2) {
    border-right: 0;
    border-bottom: 1px solid #e2e8f0;
  }
  .summary-cycle-step:last-child { border-bottom: 0; }
  .navigator-focus-grid {
    grid-template-columns: 1fr;
  }
  .navigator-active-head { align-items: flex-start; flex-direction: column; }
  .navigator-readiness { grid-template-columns: 1fr; }
  .navigator-readiness > small { grid-column: auto; }
}
</style>

<style scoped>
.medication-order-support{display:grid;gap:7px;margin-top:2px}.medication-order-support>div{display:grid;gap:2px;padding:8px 10px;background:#eef7f6;border-left:3px solid #0f766e;font-size:11px}.medication-order-support>div.warning{background:#fff7ed;border-left-color:#c2410c}.medication-order-support strong{font-size:9px;text-transform:uppercase;color:#536d73}.avatar-actions button.danger{border-color:#fecaca;color:#991b1b;background:#fff7f7}
</style>
