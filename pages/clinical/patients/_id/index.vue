<template>
  <v-container fluid class="gov-content pa-8">

    <!-- ── Patient not found ─────────────────────────────────────────────── -->
    <v-alert v-if="!patient" type="error" tile dense class="mb-6">
      Patient not found. <nuxt-link to="/clinical/patients" class="white--text">← Back to patient list</nuxt-link>
    </v-alert>

    <template v-else>
      <!-- ── Patient identity banner ─────────────────────────────────────── -->
      <v-card flat tile class="mb-6 gov-card b-1 shadow-sm overflow-hidden">
        <div class="pa-6 bg-navy d-flex align-center flex-wrap" style="gap:16px">
          <v-avatar tile size="60" color="#00A99D" class="shadow-sm">
            <v-icon dark size="30">mdi-account</v-icon>
          </v-avatar>
          <div class="white--text flex-grow-1">
            <div class="text-caption opacity-70 font-weight-black ls-1 mb-1">{{ patient.id }} — PATIENT DETAILS</div>
            <div class="text-h5 font-weight-black ls-tight uppercase">{{ patient.firstName }} {{ patient.middleName }} {{ patient.lastName }}</div>
            <div class="text-caption mt-1 opacity-80">
              {{ patient.gender }} · {{ calculatedAge(patient.dob) }} years ·
              Blood group: <strong>{{ patient.bloodType || 'N/A' }}</strong> ·
              Facility: <strong>{{ patient.clinicSite || institution }}</strong>
            </div>
          </div>
          <!-- Quick actions -->
          <div class="d-flex flex-wrap" style="gap:8px">
            <v-btn small tile depressed color="white" class="gov-text-primary font-weight-black text-caption"
              :to="`/clinical/patients/${$route.params.id}/encounter/nurse`">
              <v-icon left small>mdi-stethoscope</v-icon>Nursing evaluation
            </v-btn>
            <v-btn small tile depressed color="#00A99D" dark class="font-weight-black text-caption"
              :to="`/clinical/patients/${$route.params.id}/encounter/medical`"
              v-if="canDoMedical">
              <v-icon left small>mdi-medical-bag</v-icon>Medical consultation
            </v-btn>
            <v-btn small tile outlined color="white" class="font-weight-black text-caption"
              @click="$router.go(-1)">
              <v-icon left small>mdi-arrow-left</v-icon>Back
            </v-btn>
          </div>
        </div>

        <!-- Status and quick alerts -->
        <div class="pa-3 d-flex flex-wrap align-center bg-grey lighten-4" style="gap:8px">
          <v-chip x-small label :color="statusColor(patient.patientStatus)" dark class="font-weight-black">
            {{ patient.patientStatus || 'New' }}
          </v-chip>
          <v-chip x-small label color="#003366" dark class="font-weight-black" v-if="activeInpatient">
            <v-icon x-small left>mdi-bed</v-icon>ADMITTED — Bed {{ activeInpatient.bedNumber }}
          </v-chip>
          <v-chip x-small label color="#D97706" dark class="font-weight-black" v-if="hasAllergy">
            <v-icon x-small left>mdi-alert</v-icon>KNOWN ALLERGY
          </v-chip>
          <v-spacer />
          <span class="text-caption grey--text">Recorded on {{ formatDate(patient.createdAt) }}</span>
        </div>

        <div class="pa-3 d-flex flex-wrap align-center phi-strip" style="gap:8px">
          <v-icon small color="#003366">mdi-shield-lock</v-icon>
          <span class="text-caption font-weight-black gov-text-primary">PHI ACCESS:</span>
          <v-chip x-small label :color="phiPolicy.canOpenChart ? '#1F7A5C' : '#D97706'" dark class="font-weight-black">{{ phiPolicy.access }}</v-chip>
          <span class="text-caption grey--text font-weight-bold">
            {{ staffContext && staffContext.department ? staffContext.department : 'Facility role' }}
            <span v-if="staffContext && staffContext.service"> · {{ staffContext.service }}</span>
          </span>
          <v-spacer />
          <span class="text-caption grey--text">Basis: {{ patient.phiAccessBasis || 'Treatment' }}</span>
        </div>
      </v-card>

      <!-- ── Patient record tabs ────────────────────────────────────────────── -->
      <v-tabs v-model="tab" tile color="#003366" background-color="white" class="gov-tabs b-1 mb-6 shadow-sm">
        <v-tab class="text-caption font-weight-black ls-1 uppercase"><v-icon left small>mdi-account-details</v-icon>Summary</v-tab>
        <v-tab class="text-caption font-weight-black ls-1 uppercase"><v-icon left small>mdi-heart-pulse</v-icon>Vital signs</v-tab>
        <v-tab class="text-caption font-weight-black ls-1 uppercase"><v-icon left small>mdi-clipboard-list</v-icon>Encounters</v-tab>
        <v-tab class="text-caption font-weight-black ls-1 uppercase"><v-icon left small>mdi-note-text</v-icon>Nursing notes</v-tab>
        <v-tab class="text-caption font-weight-black ls-1 uppercase"><v-icon left small>mdi-format-list-checks</v-icon>Tasks</v-tab>
        <v-tab class="text-caption font-weight-black ls-1 uppercase" v-if="canDoMedical"><v-icon left small>mdi-medical-bag</v-icon>Medical notes</v-tab>
      </v-tabs>

      <v-tabs-items v-model="tab">

        <!-- ─────────────────────── TAB 1: SUMMARY ──────────────────────── -->
        <v-tab-item>
          <v-row>
            <v-col cols="12" md="6">
              <v-card flat tile class="gov-card b-1 pa-6 shadow-sm mb-6">
                <div class="text-caption font-weight-black grey--text uppercase ls-1 mb-4 border-left px-3">ADMINISTRATIVE IDENTITY</div>
                <div class="info-row"><span>First name</span><strong>{{ patient.firstName }}</strong></div>
                <div class="info-row"><span>Last name</span><strong>{{ patient.lastName }}</strong></div>
                <div class="info-row" v-if="patient.middleName"><span>Middle name</span><strong>{{ patient.middleName }}</strong></div>
                <div class="info-row"><span>Date of birth</span><strong>{{ patient.dob || 'N/A' }}</strong></div>
                <div class="info-row"><span>Age</span><strong>{{ calculatedAge(patient.dob) }} years</strong></div>
                <div class="info-row"><span>Sex</span><strong>{{ patient.gender || 'N/A' }}</strong></div>
                <div class="info-row"><span>Blood type</span><strong>{{ patient.bloodType || 'N/A' }}</strong></div>
                <div class="info-row"><span>External ID</span><strong>{{ patient.externalId || '—' }}</strong></div>
              </v-card>

              <v-card flat tile class="gov-card b-1 pa-6 shadow-sm">
                <div class="text-caption font-weight-black grey--text uppercase ls-1 mb-4 border-left px-3">CONTACT AND ORIGIN</div>
                <div class="info-row"><span>Phone</span><strong>{{ patient.phone || '—' }}</strong></div>
                <div class="info-row"><span>Region</span><strong>{{ patient.region || '—' }}</strong></div>
                <div class="info-row"><span>Address</span><strong>{{ patient.address || '—' }}</strong></div>
                <div class="info-row"><span>Referred by</span><strong>{{ patient.referredBy || '—' }}</strong></div>
                <div class="info-row"><span>Referral date</span><strong>{{ patient.referredDate || '—' }}</strong></div>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card flat tile class="gov-card b-1 pa-6 shadow-sm mb-6">
                <div class="text-caption font-weight-black grey--text uppercase ls-1 mb-4 border-left px-3">HISTORY AND ALLERGIES</div>
                <div class="info-row"><span>Allergies</span>
                  <strong :class="hasAllergy ? 'error--text' : ''">{{ patient.allergies || 'None known' }}</strong>
                </div>
                <div class="info-row"><span>Medical history</span><strong>{{ patient.medicalHistory || '—' }}</strong></div>
                <div class="info-row"><span>Surgical history</span><strong>{{ patient.surgicalHistory || '—' }}</strong></div>
                <div class="info-row"><span>Family history</span><strong>{{ patient.familyHistory || '—' }}</strong></div>
                <div class="info-row"><span>Current medications</span><strong>{{ patient.currentMeds || '—' }}</strong></div>
              </v-card>

              <!-- Latest vital signs -->
              <v-card flat tile class="gov-card b-1 pa-6 shadow-sm">
                <div class="text-caption font-weight-black grey--text uppercase ls-1 mb-4 border-left px-3">LATEST VITAL SIGNS</div>
                <template v-if="lastVitals">
                  <div class="info-row"><span>BP</span><strong>{{ lastVitals.bp || '—' }} mmHg</strong></div>
                  <div class="info-row"><span>Heart rate</span><strong>{{ lastVitals.hr || '—' }} bpm</strong></div>
                  <div class="info-row"><span>Respiratory rate</span><strong>{{ lastVitals.rr || '—' }} c/min</strong></div>
                  <div class="info-row"><span>Temperature</span><strong>{{ lastVitals.temp || '—' }} °C</strong></div>
                  <div class="info-row"><span>SpO2</span><strong>{{ lastVitals.spo2 || '—' }} %</strong></div>
                  <div class="info-row"><span>Glucose</span><strong>{{ lastVitals.glucose || '—' }} g/L</strong></div>
                  <div class="info-row"><span>Weight / Height</span><strong>{{ lastVitals.weight || '—' }} kg / {{ lastVitals.height || '—' }} cm</strong></div>
                  <div class="text-caption grey--text mt-3 font-italic">Recorded on {{ formatDate(lastVitals.recordedAt) }} by {{ lastVitals.recordedBy }}</div>
                </template>
                <div v-else class="text-caption grey--text font-italic text-center py-4">No vital signs recorded</div>
              </v-card>
            </v-col>
          </v-row>
        </v-tab-item>

        <!-- ─────────────────── TAB 2: VITAL SIGNS ──────────────── -->
        <v-tab-item>
          <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
            <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center">
              <span class="text-caption font-weight-black grey--text uppercase ls-1">VITAL SIGNS HISTORY</span>
              <v-spacer />
              <v-btn small tile depressed color="#003366" dark class="font-weight-black text-caption"
                :to="`/clinical/patients/${$route.params.id}/encounter/nurse`">
                <v-icon left small>mdi-plus</v-icon>New entry
              </v-btn>
            </div>
            <v-data-table
              :headers="vitalsHeaders"
              :items="patientVitals"
              :items-per-page="10"
              tile elevation="0"
              class="gov-table"
              sort-by="recordedAt"
              sort-desc
            >
              <template v-slot:item.bp="{ item }">
                <v-chip x-small :color="bpColor(item.bp)" dark label class="font-weight-black">{{ item.bp || '—' }}</v-chip>
              </template>
              <template v-slot:item.temp="{ item }">
                <v-chip x-small :color="tempColor(item.temp)" dark label class="font-weight-black">{{ item.temp ? item.temp + '°C' : '—' }}</v-chip>
              </template>
              <template v-slot:item.spo2="{ item }">
                <v-chip x-small :color="spo2Color(item.spo2)" dark label class="font-weight-black">{{ item.spo2 ? item.spo2 + '%' : '—' }}</v-chip>
              </template>
              <template v-slot:item.recordedAt="{ item }">
                <span class="text-caption">{{ formatDate(item.recordedAt) }}</span>
              </template>
            </v-data-table>
          </v-card>
        </v-tab-item>

        <!-- ─────────────────── TAB 3: ENCOUNTERS ──────────────────── -->
        <v-tab-item>
          <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
            <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center">
              <span class="text-caption font-weight-black grey--text uppercase ls-1">ENCOUNTER HISTORY</span>
              <v-spacer />
              <v-btn small tile depressed color="#00A99D" dark class="font-weight-black text-caption mr-2"
                :to="`/clinical/patients/${$route.params.id}/encounter/nurse`">
                <v-icon left small>mdi-stethoscope</v-icon>Nursing evaluation
              </v-btn>
              <v-btn small tile depressed color="#003366" dark class="font-weight-black text-caption"
                :to="`/clinical/patients/${$route.params.id}/encounter/medical`" v-if="canDoMedical">
                <v-icon left small>mdi-medical-bag</v-icon>Medical consultation
              </v-btn>
            </div>
            <v-timeline dense class="pa-6" v-if="patientVisits.length > 0">
              <v-timeline-item
                v-for="visit in patientVisits" :key="visit.id"
                :color="encounterColor(visit.encounterType)"
                small
              >
                <div class="d-flex align-start justify-space-between">
                  <div>
                    <div class="text-caption font-weight-black gov-text-primary uppercase">{{ visit.encounterType || 'Consultation' }}</div>
                    <div class="text-caption grey--text">{{ formatDate(visit.createdAt) }} — {{ visit.recordedBy || '—' }}</div>
                    <div class="text-body-2 mt-1 font-weight-medium" v-if="visit.chiefComplaint">
                      Chief complaint: <em>{{ visit.chiefComplaint }}</em>
                    </div>
                    <div class="text-caption mt-1" v-if="visit.diagnosis">
                      Diagnosis: <strong>{{ visit.diagnosis }}</strong>
                    </div>
                  </div>
                  <v-chip x-small :color="encounterColor(visit.encounterType)" dark label class="font-weight-black ml-4">
                    {{ displayEncounterType(visit.encounterType) || '—' }}
                  </v-chip>
                </div>
              </v-timeline-item>
            </v-timeline>
            <div v-else class="text-center pa-10 grey--text font-italic text-caption">
              No encounters recorded for this patient.
            </div>
          </v-card>
        </v-tab-item>

        <!-- ─────────────────── TAB 4: NURSING NOTES ─────────────── -->
        <v-tab-item>
          <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
            <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center">
              <span class="text-caption font-weight-black grey--text uppercase ls-1">NURSING PROGRESS NOTES</span>
              <v-spacer />
              <v-btn small tile depressed color="#00A99D" dark class="font-weight-black text-caption"
                :to="`/clinical/patients/${$route.params.id}/encounter/nurse`">
                <v-icon left small>mdi-plus</v-icon>New note
              </v-btn>
            </div>
            <div class="pa-6">
              <div v-for="note in nursingNotes" :key="note.id" class="mb-4 gov-note-card pa-4 b-1">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div>
                    <v-chip x-small color="#00A99D" dark label class="font-weight-black mr-2">NURSE</v-chip>
                    <span class="text-caption font-weight-black">{{ note.recordedBy }}</span>
                  </div>
                  <div class="d-flex align-center" style="gap:6px">
                    <span class="text-caption grey--text">{{ formatDate(note.recordedAt) }}</span>
                    <v-btn icon x-small color="#003366" @click="openNoteEditDialog('nursing', note)">
                      <v-icon x-small>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn icon x-small color="#6b7280" @click="openAuditDialog(note)">
                      <v-icon x-small>mdi-history</v-icon>
                    </v-btn>
                  </div>
                </div>
                <div class="text-body-2 font-weight-medium" v-if="note.observation">
                  <strong>Observation:</strong> {{ note.observation }}
                </div>
                <div class="text-body-2 mt-1" v-if="note.actions">
                  <strong>Actions:</strong> {{ note.actions }}
                </div>
                <div class="text-body-2 mt-1" v-if="note.response">
                  <strong>Patient response:</strong> {{ note.response }}
                </div>
              </div>
              <div v-if="nursingNotes.length === 0" class="text-center pa-10 grey--text font-italic text-caption">
                No nursing notes recorded.
              </div>
            </div>
          </v-card>
        </v-tab-item>

        <!-- ─────────────────── TAB 5: TASKS ───────────────── -->
        <v-tab-item>
          <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
            <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center">
              <span class="text-caption font-weight-black grey--text uppercase ls-1">CARE TEAM TASKS</span>
            </div>
            <div class="pa-6">
              <v-data-table
                :headers="taskHeaders"
                :items="patientTasks"
                class="gov-table"
                :items-per-page="10"
                sort-by="createdAt"
                sort-desc
              >
                <template v-slot:item.status="{ item }">
                  <v-chip x-small dark label :color="taskStatusColor(item.status)" class="font-weight-black">
                    {{ (item.status || '').toUpperCase() }}
                  </v-chip>
                </template>
                <template v-slot:item.assignedToRole="{ item }">
                  <v-chip x-small label class="font-weight-black">{{ item.assignedToRole }}</v-chip>
                </template>
                <template v-slot:item.createdAt="{ item }">
                  <span class="text-caption">{{ formatDate(item.createdAt) }}</span>
                </template>
                <template v-slot:item.actions="{ item }">
                  <v-btn x-small tile outlined color="#003366" class="font-weight-black" @click="openTaskStatusDialog(item)">
                    Update status
                  </v-btn>
                </template>
              </v-data-table>
              <div v-if="patientTasks.length === 0" class="text-center pa-10 grey--text font-italic text-caption">
                No operational tasks for this patient.
              </div>
            </div>
          </v-card>
        </v-tab-item>

        <!-- ─────────────────── TAB 6: MEDICAL NOTES ───────────────── -->
        <v-tab-item v-if="canDoMedical">
          <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
            <div class="pa-4 bg-grey lighten-4 border-bottom d-flex align-center">
              <span class="text-caption font-weight-black grey--text uppercase ls-1">MEDICAL PROGRESS NOTES</span>
              <v-spacer />
              <v-btn small tile depressed color="#003366" dark class="font-weight-black text-caption"
                :to="`/clinical/patients/${$route.params.id}/encounter/medical`">
                <v-icon left small>mdi-plus</v-icon>New consultation
              </v-btn>
            </div>
            <div class="pa-6">
              <div v-for="note in medicalNotes" :key="note.id" class="mb-4 gov-note-card pa-4 b-1">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div>
                    <v-chip x-small color="#003366" dark label class="font-weight-black mr-2">PHYSICIAN</v-chip>
                    <span class="text-caption font-weight-black">{{ note.recordedBy }}</span>
                  </div>
                  <div class="d-flex align-center" style="gap:6px">
                    <span class="text-caption grey--text">{{ formatDate(note.recordedAt) }}</span>
                    <v-btn icon x-small color="#003366" @click="openNoteEditDialog('medical', note)">
                      <v-icon x-small>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn icon x-small color="#6b7280" @click="openAuditDialog(note)">
                      <v-icon x-small>mdi-history</v-icon>
                    </v-btn>
                  </div>
                </div>
                <div class="text-body-2 font-weight-medium" v-if="note.diagnosis">
                  <strong>Diagnosis:</strong> {{ note.diagnosis }}
                </div>
                <div class="text-body-2 mt-1" v-if="note.clinicalFindings">
                  <strong>Clinical examination:</strong> {{ note.clinicalFindings }}
                </div>
                <div class="text-body-2 mt-1" v-if="note.plan">
                  <strong>Treatment plan:</strong> {{ note.plan }}
                </div>
                <div class="text-body-2 mt-1 font-italic" v-if="note.progressNote">
                  <strong>Progress note:</strong> {{ note.progressNote }}
                </div>
              </div>
              <div v-if="medicalNotes.length === 0" class="text-center pa-10 grey--text font-italic text-caption">
                No medical notes recorded.
              </div>
            </div>
          </v-card>
        </v-tab-item>

      </v-tabs-items>

      <v-dialog v-model="noteEditDialog" max-width="760" persistent>
        <v-card flat tile class="gov-card b-1">
          <div class="pa-4 bg-grey lighten-4 border-bottom text-caption font-weight-black uppercase ls-1">
            Edit {{ noteEditType }} note
          </div>
          <div class="pa-6">
            <v-textarea
              v-if="noteEditType === 'nursing'"
              v-model="noteEditForm.observation"
              outlined tile dense rows="3" class="mb-4"
              label="Observation"
            />
            <v-text-field
              v-if="noteEditType === 'nursing'"
              v-model="noteEditForm.actions"
              outlined tile dense class="mb-4"
              label="Actions"
            />
            <v-textarea
              v-if="noteEditType === 'nursing'"
              v-model="noteEditForm.response"
              outlined tile dense rows="2" class="mb-4"
              label="Patient response"
            />

            <v-text-field
              v-if="noteEditType === 'medical'"
              v-model="noteEditForm.diagnosis"
              outlined tile dense class="mb-4"
              label="Diagnosis"
            />
            <v-textarea
              v-if="noteEditType === 'medical'"
              v-model="noteEditForm.clinicalFindings"
              outlined tile dense rows="3" class="mb-4"
              label="Clinical findings"
            />
            <v-textarea
              v-if="noteEditType === 'medical'"
              v-model="noteEditForm.plan"
              outlined tile dense rows="3" class="mb-4"
              label="Plan"
            />

            <v-textarea
              v-model="noteEditReason"
              outlined tile dense rows="2" class="mb-4"
              label="Reason for modification"
            />

            <div class="d-flex justify-end" style="gap:10px">
              <v-btn tile outlined color="grey" @click="noteEditDialog = false">Cancel</v-btn>
              <v-btn tile color="#003366" dark @click="saveNoteEdit">Save update</v-btn>
            </div>
          </div>
        </v-card>
      </v-dialog>

      <v-dialog v-model="auditDialog" max-width="900">
        <v-card flat tile class="gov-card b-1">
          <div class="pa-4 bg-grey lighten-4 border-bottom text-caption font-weight-black uppercase ls-1">
            Note audit trail
          </div>
          <div class="pa-6">
            <v-timeline dense>
              <v-timeline-item v-for="entry in selectedAuditEntries" :key="entry.id" small color="#003366">
                <div class="text-caption font-weight-black">{{ entry.action }}</div>
                <div class="text-caption grey--text">{{ formatDate(entry.at) }} by {{ entry.actor }}</div>
                <div class="text-body-2 mt-1">Reason: {{ entry.reason || 'No reason provided' }}</div>
                <div class="text-caption mt-1" v-if="entry.changedFields && entry.changedFields.length">
                  Fields changed: {{ entry.changedFields.join(', ') }}
                </div>
              </v-timeline-item>
            </v-timeline>
            <div v-if="selectedAuditEntries.length === 0" class="text-caption grey--text font-italic">No audit history available.</div>
          </div>
        </v-card>
      </v-dialog>

      <v-dialog v-model="taskStatusDialog" max-width="640" persistent>
        <v-card flat tile class="gov-card b-1">
          <div class="pa-4 bg-grey lighten-4 border-bottom text-caption font-weight-black uppercase ls-1">
            Update task status
          </div>
          <div class="pa-6">
            <div class="text-body-2 font-weight-black mb-4">{{ selectedTask ? selectedTask.title : '' }}</div>
            <v-select
              v-model="taskStatusForm.status"
              :items="taskStatuses"
              outlined tile dense class="mb-4"
              label="Status"
            />
            <v-textarea
              v-model="taskStatusForm.reason"
              outlined tile dense rows="3" class="mb-4"
              label="Reason for action"
            />
            <div class="d-flex justify-end" style="gap:10px">
              <v-btn tile outlined color="grey" @click="taskStatusDialog = false">Cancel</v-btn>
              <v-btn tile color="#003366" dark @click="saveTaskStatus">Save status</v-btn>
            </div>
          </div>
        </v-card>
      </v-dialog>
    </template>

    <style scoped>
    .info-row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #f1f5f9; font-size:13px; }
    .info-row span { color:#6b7280; }
    .gov-note-card { background:#fafbfc; border-radius:2px; }
    .border-left { border-left:3px solid #003366; }
    .phi-strip { background:#F8FAFC; border-top:1px solid #E5E7EB; }
    </style>

  </v-container>
</template>

<script>
export default {
  layout: 'admins',

  data() {
    return {
      tab: 0,
      vitalsHeaders: [
        { text: 'BP (mmHg)', value: 'bp' },
        { text: 'HR (bpm)', value: 'hr' },
        { text: 'RR (c/min)', value: 'rr' },
        { text: 'Temp (°C)', value: 'temp' },
        { text: 'SpO2 (%)', value: 'spo2' },
        { text: 'Glucose (g/L)', value: 'glucose' },
        { text: 'Weight (kg)', value: 'weight' },
        { text: 'Glasgow', value: 'glasgow' },
        { text: 'Pain /10', value: 'pain' },
        { text: 'Recorded by', value: 'recordedBy' },
        { text: 'Date', value: 'recordedAt' }
      ],
      taskHeaders: [
        { text: 'Task', value: 'title' },
        { text: 'Assigned role', value: 'assignedToRole' },
        { text: 'Status', value: 'status' },
        { text: 'Reason', value: 'actionReason' },
        { text: 'Created', value: 'createdAt' },
        { text: '', value: 'actions', sortable: false, align: 'right' }
      ],
      noteEditDialog: false,
      noteEditType: 'nursing',
      noteEditForm: {},
      selectedNoteId: null,
      noteEditReason: '',
      auditDialog: false,
      selectedAuditEntries: [],
      taskStatusDialog: false,
      selectedTask: null,
      taskStatuses: [
        { text: 'Done', value: 'done' },
        { text: 'Hold', value: 'hold' },
        { text: 'Cancel', value: 'cancel' }
      ],
      taskStatusForm: {
        status: 'done',
        reason: ''
      }
    }
  },

  computed: {
    patient() {
      const id = this.$route.params.id
      const patients = this.$store.getters['clinical/getPatients'] || []
      return patients.find(p => p.id === id) || null
    },
    institution() { return this.$store.state.auth.institution },
    role()        { return this.$store.state.auth.role },
    fullName()    { return this.$store.state.auth.fullName },
    staffContext(){ return this.$store.getters['facility/getStaffContext'](this.$store.state.auth.staffId) || null },
    phiPolicy()   { return (this.staffContext && this.staffContext.phiPolicy) || { access: 'minimum-necessary', canOpenChart: false } },
    canDoMedical(){ return ['DOCTOR', 'ADMIN'].includes(this.role) },
    hasAllergy()  { return !!(this.patient && this.patient.allergies && this.patient.allergies.trim()) },

    activeInpatient() {
      const inpatients = this.$store.getters['clinical/getInpatients'] || []
      return inpatients.find(i => i.patientId === this.$route.params.id && i.status === 'Admitted') || null
    },

    patientVitals() {
      const all = this.$store.getters['clinical/getVitalSigns'] || []
      return all.filter(v => v.patientId === this.$route.params.id)
    },

    lastVitals() {
      if (!this.patientVitals.length) return null
      return [...this.patientVitals].sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))[0]
    },

    patientVisits() {
      const all = this.$store.getters['clinical/getVisits'] || []
      return all.filter(v => v.patientId === this.$route.params.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    },

    nursingNotes() {
      const all = this.$store.getters['clinical/getNursingNotes'] || []
      return all.filter(n => n.patientId === this.$route.params.id)
        .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
    },

    medicalNotes() {
      const all = this.$store.getters['clinical/getMedicalNotes'] || []
      return all.filter(n => n.patientId === this.$route.params.id)
        .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
    },

    patientTasks() {
      const all = this.$store.getters['clinical/getTasks'] || []
      return all
        .filter(t => t.patientId === this.$route.params.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }
  },

  methods: {
    calculatedAge(dob) {
      if (!dob) return '—'
      const diff = Date.now() - new Date(dob).getTime()
      return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
    },
    formatDate(iso) {
      if (!iso) return '—'
      return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    },
    statusColor(status) {
      const map = { 'Emergency': '#B91C1C', 'Admitted': '#003366', 'Transferred': '#D97706', 'Returning': '#00A99D', 'New': '#6b7280', 'Continuing': '#00A99D' }
      return map[status] || '#6b7280'
    },
    encounterColor(type) {
      return type === 'MÉDICAL' ? '#003366' : type === 'INFIRMIER' ? '#00A99D' : '#6b7280'
    },
    displayEncounterType(type) {
      if (type === 'MÉDICAL') return 'MEDICAL'
      if (type === 'INFIRMIER') return 'NURSING'
      return type
    },
    openNoteEditDialog(noteType, note) {
      this.noteEditType = noteType
      this.selectedNoteId = note.id
      this.noteEditReason = ''
      if (noteType === 'nursing') {
        this.noteEditForm = {
          observation: note.observation || '',
          actions: note.actions || '',
          response: note.response || ''
        }
      } else {
        this.noteEditForm = {
          diagnosis: note.diagnosis || '',
          clinicalFindings: note.clinicalFindings || '',
          plan: note.plan || ''
        }
      }
      this.noteEditDialog = true
    },
    openAuditDialog(note) {
      this.selectedAuditEntries = [...(note.auditTrail || [])].sort((a, b) => new Date(b.at) - new Date(a.at))
      this.auditDialog = true
    },
    async saveNoteEdit() {
      if (!this.selectedNoteId) return
      if (!this.noteEditReason || !this.noteEditReason.trim()) {
        this.$toast.error('Please provide a reason for modification')
        return
      }
      const payload = {
        id: this.selectedNoteId,
        updates: { ...this.noteEditForm },
        reason: this.noteEditReason,
        updatedBy: this.fullName
      }
      if (this.noteEditType === 'nursing') {
        await this.$store.dispatch('clinical/updateNursingNote', payload)
      } else {
        await this.$store.dispatch('clinical/updateMedicalNote', payload)
      }
      this.noteEditDialog = false
      this.$toast.success('Note updated successfully')
    },
    openTaskStatusDialog(task) {
      this.selectedTask = task
      this.taskStatusForm = {
        status: task.status || 'done',
        reason: ''
      }
      this.taskStatusDialog = true
    },
    async saveTaskStatus() {
      if (!this.selectedTask) return
      if (!this.taskStatusForm.reason || !this.taskStatusForm.reason.trim()) {
        this.$toast.error('Reason for action is required')
        return
      }
      await this.$store.dispatch('clinical/updateTaskStatus', {
        id: this.selectedTask.id,
        status: this.taskStatusForm.status,
        reason: this.taskStatusForm.reason,
        updatedBy: this.fullName
      })
      this.taskStatusDialog = false
      this.$toast.success('Task status updated')
    },
    taskStatusColor(status) {
      const map = { pending: '#6b7280', done: '#166534', hold: '#D97706', cancel: '#B91C1C' }
      return map[status] || '#6b7280'
    },
    bpColor(bp) {
      if (!bp) return 'grey'
      const sys = parseInt(bp.split('/')[0])
      if (sys >= 180) return '#B91C1C'
      if (sys >= 140) return '#D97706'
      if (sys < 90)  return '#B91C1C'
      return '#166534'
    },
    tempColor(t) {
      if (!t) return 'grey'
      if (t >= 39) return '#B91C1C'
      if (t >= 37.5) return '#D97706'
      if (t < 36) return '#003366'
      return '#166534'
    },
    spo2Color(s) {
      if (!s) return 'grey'
      if (s < 90) return '#B91C1C'
      if (s < 95) return '#D97706'
      return '#166534'
    }
  }
}
</script>
