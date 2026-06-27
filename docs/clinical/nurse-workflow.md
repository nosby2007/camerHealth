# CameroHealth Nurse Module Workflow

This module adds a production-ready nursing workflow layer without replacing the existing nursing encounter page at `/clinical/patients/:id/encounter/nurse`.

## Workflow Areas

- **Nurse Command Center**: queue of patients, open nursing tasks, active wound follow-up, and unsigned notes.
- **Patient 360**: nursing-centered snapshot of a patient's markers, wounds, notes, tasks, documents, and care plans.
- **Clinical Avatar**: body-map markers for wounds, pressure injuries, drains, catheters, ostomy, edema, rash, bruises, IV lines, and pain points.
- **Skin & Wound Navigator**: wound problem list and serial wound assessments with surface area and volume calculations.
- **Wound Intelligence**: trend warnings when wound surface area increases compared with prior assessment.
- **Nurse TaskFlow**: task statuses aligned to nursing operations: `pending`, `in_progress`, `completed`, `refused`, `missed`, `cancelled`.
- **Clinical Clipboard**: draft, signed, and amended clinical notes. Signed notes are locked; corrections are amendments.
- **Documents and Reports**: document shells for wound reports, nursing summaries, discharge instructions, and incident reports.

## Data Model

The draft migration `supabase/migrations/20260626_008_nurse_module_schema_draft.sql` adds:

- `body_map_markers`
- `wounds`
- `wound_assessments`
- `wound_photos`
- `wound_treatments`
- `nursing_assessments`
- `clinical_notes`
- `orders`
- `tasks`
- `care_plans`
- `documents`
- audit log enrichment with `patient_id` and `context`

The migration also expands clinical roles to `ADMIN`, `DOCTOR`, `NP`, `NURSE`, `CNA`, `LAB`, `IMAGING`, `BILLING`.

## Frontend Architecture

- `store/nursing.js` keeps the prototype localStorage-first and additive.
- `services/clinical/nursing.service.js` provides Supabase CRUD wrappers for production integration.
- `types/nursing.d.ts` documents TypeScript interfaces without converting the Nuxt 2 app.
- Reusable Vue components live in `components/nursing/`.
- Pages live under `/clinical/nursing`.

## Validation

Run the no-dependency nursing workflow tests:

```bash
npm run test:nursing
```

The test covers wound surface area, wound volume, trend warning logic, and provider-order-to-nursing-task generation.

## Safety Notes

- Existing clinical pages and store actions are preserved.
- The legacy nursing triage route remains available from Patient 360.
- RLS policies in the migration are draft policies and must be validated in staging before production use.
- Billing has limited read access only to task/document shell data in the draft policy.
