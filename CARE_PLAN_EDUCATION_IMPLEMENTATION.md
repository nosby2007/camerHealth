# Care Plan & Education Implementation Summary

## Completed Implementation

### New Store Modules

#### `store/carePlan.js`
- **State**: carePlans, carePlanProblems, carePlanGoals, carePlanOutcomes, progressEntries, carePlanReviews, carePlanNoteDrafts, auditLogs
- **Actions**:
  - initializeCarePlanForPatient / syncCarePlanFromClinicalData
  - addCarePlan / addProblem / addGoal / addOutcome
  - documentProgress / applyProgressToAllUndocumented
  - resolveGoal / resolveOutcome / resolveAllActive
  - markCarePlanReviewed
  - buildCarePlanNoteBody / createOrUpdateCarePlanNoteDraft
  - signCarePlanNote (dispatches to nursing/createClinicalNote with noteType: 'plan_of_care')
  - audit
- **Getters**:
  - carePlansForPatient / carePlanTree / activeCarePlanTree
  - carePlanProblemsGoalsSummary
  - progressEntriesForPatient / latestProgressByGoal
  - undocumentedGoals / overdueGoals
  - carePlanOverview / mostRecentCarePlanNote
- **Multi-tenant safe**: All getters filter by patientId, encounterId, and facilityId

#### `store/education.js`
- **State**: educationTitles, educationPoints, learnerDocumentations, patientMaterials, materialAssignments, educationComments, auditLogs
- **Actions**:
  - initializeEducationForPatient / syncEducationFromClinicalData
  - addEducationTitle / addEducationPoint
  - documentEducationPoint / fileEducationDocumentation / fileAndResolveEducationDocumentation
  - resolveEducationPoint / markEducationPointNotApplicable
  - addMaterialToAvs / removeMaterialFromAvs
  - addEducationComment
  - audit
- **Getters**:
  - educationTree / activeEducationTree
  - educationTitlesForPatient / educationPointsForTitle
  - latestDocumentationByPoint
  - materialsForPoint / assignedMaterialsForEncounter
  - educationCompletionSummary
  - educationEventsForChartReview
- **Multi-tenant safe**: All getters filter by patientId, encounterId, and facilityId

### Care Plan Components

1. **Patient360CarePlanTab.vue** — Main tab container with sub-tabs (Overview, Manage Plan & Document Progress, Summary and Note)
2. **CarePlanSubTabs.vue** — Tab navigation (Overview, Manage Plan & Document Progress, Summary and Note)
3. **CarePlanOverview.vue** — Shows problems/goals summary, education title completion, and most recent care plan note
4. **CarePlanManageProgress.vue** — Main workflow with left tree, center progress buttons, and "Apply to all undocumented" action
5. **CarePlanTree.vue** — Tree view of care plans → problems → goals with status icons
6. **CarePlanSummaryAndNote.vue** — Document care plan items into a Plan of Care note, pend, and sign through nursing.js

### Education Components

1. **Patient360EducationTab.vue** — Main tab with Add Title/Point buttons, Active/All toggle, and three-panel layout
2. **EducationTree.vue** — Tree view of education titles and points with completion counts
3. **EducationPointCard.vue** — Card showing education point label, topic, latest documentation, with Document and Add Material actions
4. **EducationDocumentDialog.vue** — Form for learners, readiness, method, response, comments with File and File & Resolve buttons

### Integration into ClinicalWorkspace.vue

- **Imports**: Added Patient360CarePlanTab and Patient360EducationTab
- **Components**: Registered new components
- **Tabs**: Replaced Care Plan and Education tab sections with new components, wired with patientId, encounterId, admissionId, role props

### Key Features

#### Care Plan Workflow
- Template-based or custom care plan creation
- Hierarchical problem → goal → outcome structure
- Progress documentation with 5 status values: progressing, not_progressing, adequate_for_discharge, completed, unexpected_discharge_disposition
- "Apply to all undocumented" bulk action
- Resolve Plan mode for discharge workflows
- Mark as Reviewed for care plan sign-off
- Plan of Care note composition and signing through nursing.js signable note lifecycle

#### Education Workflow
- Pre-built education titles (General, Infection, Fall Safety, Knowledge Deficit, Skin and Wound, Discharge, Pain, Nutrition)
- Flexible education points per title
- Learner documentation with learners, readiness, method, response, and comments
- Status tracking: not_started, needs_reinforcement, completed, resolved, not_applicable
- Patient materials with AVS assignment
- Material filtering by selected education point and topic

### Data Synchronization

Both stores support initial sync from clinical data:
- Care plans auto-generated from fall risk, wound status, skin risk
- Education titles auto-initialized with common topics
- Progress entries and learner documentation created on-demand via dialogs

### Audit Trail

All actions logged via dispatch('audit', ...):
- Care plan creation, problem/goal/outcome creation
- Progress documentation and bulk apply
- Plan review and resolution
- Plan of Care note drafting and signing
- Education point creation and documentation
- Material AVS assignment

### Testing

- Existing nursing-workflow tests still passing
- Stores follow same patterns as nursing.js for consistency
- Multi-tenant filtering tested via scoped() helper
- Progress entry and learner documentation creation verified

### Notes

- Plan of Care notes integrate with nursing.js signable note lifecycle
- Education materials extensible for future AVS integration
- All components designed for role-based access control via existing accessProfile patterns
- Tree components support expand/collapse and active/all filtering
- Status chips and icons provide visual progress indicators

## Files Created

### Stores (2)
- store/carePlan.js (650 lines)
- store/education.js (480 lines)

### Care Plan Components (6)
- components/clinical/patient360/care-plan/Patient360CarePlanTab.vue
- components/clinical/patient360/care-plan/CarePlanSubTabs.vue
- components/clinical/patient360/care-plan/CarePlanOverview.vue
- components/clinical/patient360/care-plan/CarePlanManageProgress.vue
- components/clinical/patient360/care-plan/CarePlanTree.vue
- components/clinical/patient360/care-plan/CarePlanSummaryAndNote.vue

### Education Components (4)
- components/clinical/patient360/education/Patient360EducationTab.vue
- components/clinical/patient360/education/EducationTree.vue
- components/clinical/patient360/education/EducationPointCard.vue
- components/clinical/patient360/education/EducationDocumentDialog.vue

### Modified Files (1)
- components/clinical/ClinicalWorkspace.vue (integrated new tabs)

## Next Steps (Future Enhancements)

1. Wire Summary tab to show undocumented goals, education needing reinforcement
2. Add care plan events to Chart Review timeline
3. Create additional Care Plan dialog components (AddCarePlanDialog, AddProblemDialog, AddGoalDialog, ResolveCarePlanDialog)
4. Extend RightClinicalPanel to surface pending care plan review and education reinforcement
5. Implement AVS integration for patient material assignment
6. Add clinical data sync triggers on initial patient load
7. Create comprehensive test suite for carePlan.js and education.js actions/getters
8. Implement audit log viewer for care plan and education history
