# CHANGES — CameroHealth / MINSANTE
> Journal des modifications techniques apportées au projet.  
> Maintenu par jepte Nkwanmen Pour Innovtech Services.

---

## [Unreleased] — 27 Avril 2026

### Phase 16 — Staging Evidence Packaging For Shadow Validation

#### `docs/qa/QA-phase-16-staging-evidence-runbook.md` — ADDED
- **ADDED**: staging execution runbook for controlled shadow validation evidence collection
- **ADDED**: prerequisites, environment confirmation, and migration-presence verification (not production-applied)
- **ADDED**: required test users/roles, fixture maps, safe script execution flow, pass/fail recording, and severity classification
- **ADDED**: triage procedures for cross-tenant false positives and false negatives
- **ADDED**: required logs/screenshots/query outputs, reviewer signoff, go/no-go section, and rollback/cleanup instructions

#### `docs/qa/QA-phase-16-shadow-validation-execution-report-template.md` — ADDED
- **ADDED**: standardized execution report template including metadata fields:
   - test date, environment, git SHA, supabase project/environment, tester, reviewer, dataset version
- **ADDED**: result tables for role/scope matrix, cross-tenant denial, break-glass eligibility, facility-only compatibility, and null `organization_id` compatibility
- **ADDED**: issue log, evidence links, go/no-go decision, remediation tracking, and final signoff section

#### `docs/security/phase-16-staging-data-fixture-requirements.md` — ADDED
- **ADDED**: mandatory staging fixture specification for public and private hierarchy test data
- **ADDED**: explicit fixture requirements for unrelated organization/facility negative controls
- **ADDED**: assignment fixtures for active, inactive, expired, platform, organization, unit, facility, and department scopes
- **ADDED**: expected denial fixtures and fixture versioning/traceability requirements

#### Phase 16 Safety Confirmation
- **CONFIRMED**: documentation and QA packaging only
- **CONFIRMED**: no SQL helper changes
- **CONFIRMED**: no active RLS policy changes
- **CONFIRMED**: no app code or frontend flow changes

### Phase 15 — Shadow Validation Plan & Role/Scope Matrix (Pre-Cutover)

#### `docs/security/multiscope-rls-shadow-test-plan.md` — ADDED
- **ADDED**: controlled shadow validation plan for multi-scope helper functions before any policy cutover
- **ADDED**: full role/scope matrix coverage for:
   - roles: `SUPER_ADMIN`, `SUPPORT_ADMIN`, `ORG_ADMIN`, `REGIONAL_ADMIN`, `DISTRICT_ADMIN`, `FACILITY_ADMIN`, `ADMIN`, `DOCTOR`, `NURSE`, `LAB`, `IMAGING`, `AUDITOR`
   - scopes: `platform`, `organization`, `regional/delegation unit`, `district unit`, `facility`, `department`, `unrelated organization`, `unrelated facility`
- **ADDED**: expected helper outcomes for:
   - `can_read_facility_metadata`
   - `can_manage_facility`
   - `can_troubleshoot_facility`
   - `can_break_glass_access`
   - `has_platform_role`
   - `has_organization_scope`
   - `has_unit_scope`
   - `has_facility_scope`
- **ADDED**: go/no-go criteria, rollback criteria, and evidence capture format for staging validation

#### `docs/qa/QA-phase-15-multiscope-shadow-validation-checklist.md` — ADDED
- **ADDED**: QA execution checklist for full role/scope matrix and helper validation in shadow mode
- **ADDED**: negative-path checks (cross-tenant denial, expired assignments, inactive assignments)
- **ADDED**: compatibility checks for null `organization_id` and existing `facility_id` model

#### `supabase/tests/phase15_multiscope_helper_validation.sql` — ADDED (STAGING SHADOW SCRIPT)
- **ADDED**: staging-only SQL validation templates with placeholders for sample fixtures
- **ADDED**: expected pass/fail comment patterns for helper assertions
- **ADDED**: cross-tenant denial test templates
- **ADDED**: expired/inactive assignment tests
- **ADDED**: null `organization_id` and facility-only compatibility tests
- **CONFIRMED**: no production data insert, no active policy rewiring, no patient/clinical policy changes

### Phase 14 — Read-Only Multi-Scope RLS Helpers & Tenant Mapping Runbook (Draft)

#### `supabase/migrations/20260427_007_multiscope_rls_helpers_draft.sql` — ADDED (DRAFT ONLY)
- **ADDED**: read-only helper function draft to prepare future multi-scope RLS evolution without altering active policies
- **ADDED**: helper functions:
   - `current_staff_assignments()`
   - `has_platform_role(required_roles text[])`
   - `has_organization_scope(target_organization_id uuid, required_roles text[])`
   - `has_unit_scope(target_unit_id uuid, required_roles text[])`
   - `has_facility_scope(target_facility_id uuid, required_roles text[])`
   - `can_read_facility_metadata(target_facility_id uuid)`
   - `can_manage_facility(target_facility_id uuid)`
   - `can_troubleshoot_facility(target_facility_id uuid)`
   - `can_break_glass_access(target_facility_id uuid)`
- **CONFIRMED**: no active policy rewrites, no policy drops, no patient/clinical policy replacement in this phase

#### `docs/security/facility-to-organization-unit-mapping-runbook.md` — ADDED
- **ADDED**: safe migration runbook for mapping standalone facilities to organization and organization_unit hierarchy
- **ADDED**: explicit public model workflow (MINSANTE -> Regional Delegation -> District -> Facility)
- **ADDED**: explicit private multi-site workflow (Private Organization -> Region/City Unit -> Facility)
- **ADDED**: staged backfill, assignment validation, rollback strategy, and cross-tenant access prevention controls

#### `docs/qa/QA-phase-14-multiscope-rls-helper-checklist.md` — ADDED
- **ADDED**: QA checks for helper function behavior without policy activation
- **ADDED**: validation that facility-based prototype and existing RLS remain unchanged
- **ADDED**: break-glass governance checks (disabled by default unless explicit approval)

### Phase 13 — Multi-Tenant Hierarchy & Super Admin Architecture (Additive Draft)

#### `supabase/migrations/20260427_006_multi_tenant_superadmin_draft.sql` — ADDED (DRAFT ONLY)
- **ADDED**: additive tenant hierarchy schema draft for platform -> organization -> organization_unit -> facility -> department model
- **ADDED**: new tables:
   - `organizations`
   - `organization_units`
   - `facility_departments`
   - `staff_assignments`
   - `platform_admins`
   - `support_tickets`
   - `system_events`
- **ADDED**: transitional nullable links on `facilities`:
   - `organization_id uuid null`
   - `organization_unit_id uuid null`
- **CONFIRMED**: no replacement of `facility_id`, no required `organization_id`, no patient/clinical table rewrite

#### `docs/security/multi-tenant-superadmin-architecture.md` — ADDED
- **ADDED**: non-breaking architecture for both public and private healthcare tenant structures
- **ADDED**: public hierarchy mapping (MINSANTE -> Regional Delegation -> District -> Facility)
- **ADDED**: private network mapping (Parent organization -> regional/city unit -> clinic sites)
- **ADDED**: super admin/support admin governance model and break-glass modeling requirements
- **ADDED**: phased RLS evolution notes from facility scope to multi-scope enforcement (future phase only)

#### `docs/qa/QA-phase-13-multitenant-superadmin-checklist.md` — ADDED
- **ADDED**: QA controls to verify additive compatibility with current facility-based prototype model
- **ADDED**: checks for nullable organization links, hierarchical unit support, role scope assignments, and break-glass modeling
- **ADDED**: explicit validation that existing RLS and clinical frontend flows remain unchanged in this phase

### Phase 11 — Server-Side Bootstrap & Staff Invitation Scaffold

#### `api/bootstrap/facility-admin.js` — ADDED
- **ADDED**: secure server-side bootstrap endpoint scaffold `POST /api/bootstrap/facility-admin`
- **ADDED**: strict request validation for facility/admin bootstrap payload
- **ADDED**: server-side Supabase admin flow to create/verify auth user, create facility, create ADMIN staff profile, create facility settings
- **ADDED**: audit event writes for `FACILITY_REGISTERED`, `ACCOUNT_CREATED`, and `BOOTSTRAP_FAILED`
- **ADDED**: safe response model without exposing auth internals or privileged data

#### `api/admin/staff/invite.js` — ADDED
- **ADDED**: secure server-side staff invitation endpoint scaffold `POST /api/admin/staff/invite`
- **ADDED**: caller verification from bearer token to `auth.users.id` then `staff_profiles.auth_user_id`
- **ADDED**: ADMIN-only + active-status authorization gate
- **ADDED**: facility scoping derived server-side to block cross-facility staff creation
- **ADDED**: role validation (`ADMIN`, `DOCTOR`, `NURSE`, `LAB`, `IMAGING`)
- **ADDED**: audit event writes for `AUTH_STAFF_INVITED` and `AUTH_STAFF_INVITE_FAILED`

#### `api/_lib/*.js` — ADDED
- **ADDED**: shared server helper modules:
   - `env.js` for server env guardrails
   - `http.js` for consistent safe error/response payloads
   - `request.js` for input normalization and validation
   - `rate-limit.js` for per-IP rate-limit scaffold
   - `supabase-admin.js` for service-role Supabase client creation (server-side only)
   - `caller-context.js` for authenticated ADMIN caller resolution
   - `audit.js` for centralized audit insertion helper

#### `vercel.json` — UPDATED
- **UPDATED**: added explicit `/api/*` routing rule before SPA catch-all to ensure API calls are not swallowed by `index.html` fallback

#### `.env.example` — UPDATED
- **ADDED**: `SUPABASE_SERVICE_ROLE_KEY=` (server-side only)
- **ADDED**: `STAFF_INVITE_ENDPOINT=`
- **ADDED**: `FACILITY_BOOTSTRAP_ENDPOINT=`

#### Security / QA Documentation — ADDED
- **ADDED**: `docs/security/bootstrap-and-staff-invite-backend-design.md`
- **ADDED**: `docs/qa/QA-phase-11-bootstrap-staff-endpoint-checklist.md`
- **DOCUMENTED**: bootstrap paradox under strict RLS and rationale for controlled privileged bootstrap endpoint
- **DOCUMENTED**: production follow-up requirements (durable rate limit, compensation strategy, onboarding lifecycle hardening)

### Phase 12 — Endpoint Hardening For Production Readiness (Scaffold)

#### `api/_lib/request.js` — HARDENED
- **ADDED**: robust payload validators for bootstrap and invite endpoints
- **ADDED**: stronger email/password/facility/staff code/phone normalization checks
- **ADDED**: explicit rejection of client-supplied `facility_id` in invite payload

#### `api/_lib/http.js` + `api/_lib/correlation.js` — HARDENED
- **ADDED**: correlation id propagation (`X-Correlation-Id`) for tracing
- **ADDED**: safer normalized error payload envelopes with correlation context
- **ADDED**: explicit backend unavailable response handling

#### `api/_lib/idempotency.js` — ADDED
- **ADDED**: idempotency key support (`Idempotency-Key` / `X-Idempotency-Key`)
- **ADDED**: request hash comparison to reject key reuse with payload drift
- **ADDED**: replay support for repeated requests with same key and same payload
- **ADDED**: DB-backed idempotency support scaffold + in-memory fallback for local/staging

#### `api/_lib/audit.js` — HARDENED
- **ADDED**: metadata sanitization to avoid leaking passwords/tokens/secrets
- **ADDED**: endpoint/correlation/actor-auth context support
- **ADDED**: strict mode option for compliance-critical audit writes

#### `api/_lib/rate-limit.js` — HARDENED
- **ADDED**: multi-scope rate limit utility for endpoint-level composition
- **ADDED**: strategy descriptor documenting distributed limiter requirement for production

#### `api/bootstrap/facility-admin.js` — HARDENED
- **ADDED**: idempotency flow handling (replay/conflict/in-progress)
- **ADDED**: compensation path for partial failures:
   - rollback attempt by deleting newly created auth user when facility insert fails
   - mark facility inactive when profile creation fails
- **ADDED**: stronger failure audits with error category and correlation id
- **ADDED**: safer status-oriented response shape without provider internals

#### `api/admin/staff/invite.js` — HARDENED
- **ADDED**: idempotency flow handling (replay/conflict/in-progress)
- **ADDED**: strict caller enforcement (active ADMIN + facility derived server-side)
- **ADDED**: invite lifecycle handling with status model scaffold (`pending`, `accepted`, `revoked`, `expired`, `failed`)
- **ADDED**: resend behavior for existing pending invites
- **ADDED**: rollback attempt if auth user is created but profile insert fails
- **ADDED**: expanded audit event coverage including invite failure and account creation events

#### `supabase/migrations/20260427_005_endpoint_hardening_draft.sql` — ADDED (DRAFT ONLY)
- **ADDED**: `public.idempotency_keys` table + indexes
- **ADDED**: `public.pending_staff_invites` table + lifecycle status checks + indexes
- **ADDED**: `updated_at` triggers for hardening tables
- **NOTE**: draft only, not applied to production

#### Documentation / QA / Test Plan — ADDED
- **ADDED**: `docs/security/endpoint-hardening-phase-12.md`
- **ADDED**: `docs/qa/QA-phase-12-endpoint-hardening-checklist.md`
- **ADDED**: `docs/qa/Phase-12-api-integration-test-plan.md` (documentation-based integration plan)

### Supabase v1.0 Backend Security Draft (Phases 2-4)

#### `supabase/migrations/20260427_001_v1_schema_draft.sql` — ADDED
- **ADDED**: Supabase v1.0 schema draft for clinical backend persistence (draft only, not applied to production)
- **ADDED**: core multi-tenant clinical tables:
   - `facilities`
   - `staff_profiles`
   - `patients`
   - `visits`
   - `appointments`
   - `inpatient_admissions`
   - `lab_orders`
   - `imaging_orders`
   - `medications`
   - `invoices`
   - `audit_logs`
   - `facility_settings`
- **ADDED**: governance columns across all tables (`id`, `facility_id`, `created_by`, `updated_by`, `created_at`, `updated_at`, and `status` where applicable)
- **ADDED**: `updated_at` trigger function and update triggers
- **ADDED**: tenant-focused indexes and explicit SQL comments describing the purpose of each table

#### `supabase/migrations/20260427_002_v1_rls_policies_draft.sql` — ADDED
- **ADDED**: dedicated Row Level Security draft for tenant isolation and role-based clinical access (draft only)
- **ADDED**: helper functions for security context resolution:
   - `request_jwt_claims()`
   - `current_staff_profile_id()`
   - `current_facility_id()`
   - `current_staff_role()`
   - `get_current_staff_profile()`
   - `is_facility_admin()`
   - `has_clinical_role(required_roles text[])`
   - `same_facility(row_facility_id uuid)`
- **ADDED**: `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` on all v1.0 clinical tables
- **ADDED**: explicit `SELECT`, `INSERT`, `UPDATE`, `DELETE` policies per table scoped by `facility_id` and role
- **ADDED**: special protection for `audit_logs` (insert-only for normal activity, delete blocked by default)
- **ADDED**: staging verification notes for tenant isolation and role enforcement tests

#### Authentication and JWT Claims Audit — COMPLETED (Phase 4)
- **AUDITED**: current authentication model and compatibility with Supabase RLS expected claims
- **CONFIRMED**: current app uses multiple auth mechanisms in parallel (local clinical auth, ministry free-entry flow, legacy Cognito hooks)
- **IDENTIFIED GAP**: no reliable production-grade JWT claim pipeline today for `staff_profile_id`, `facility_id`, and `role`
- **IDENTIFIED GAP**: no consistent `auth.uid()` to `staff_profiles` binding in the current prototype flow
- **DOCUMENTED**: safe migration path from localStorage prototype auth to Supabase Auth + database-enforced authorization
- **SECURITY GUIDANCE**:
   - do not store tokens in localStorage
   - do not rely on client-side hashing as production safeguard
   - do not expose Supabase service role key in frontend
   - do not treat frontend middleware as security boundary
- **SCOPE NOTE**: no frontend page updates, no Vuex migration, no production deployment, and no production migration apply were executed in Phases 2-4

### Clinical Notes Audit and Task Workflow

#### `pages/clinical/patients/_id/index.vue` — UPDATED
- **ADDED**: editable note dialogs for both nursing notes and medical notes directly from the patient details timeline
- **ADDED**: audit history button (`mdi-history`) on each note card to view who changed what, when, and why
- **ADDED**: tasks tab in patient details to track operational orders with status management (`done`, `hold`, `cancel`)
- **ADDED**: task status update dialog requiring a reason for action

#### `store/clinical.js` — UPDATED
- **ADDED**: task state persistence (`tasks`) with local storage sync and filtering getter (`getTasks`)
- **ADDED**: note update actions (`updateNursingNote`, `updateMedicalNote`) that append structured audit trail entries
- **ADDED**: task lifecycle actions (`createTask`, `updateTaskStatus`) with history and action reason metadata
- **ADDED**: note metadata (`createdBy`, `updatedBy`, `auditTrail`) for traceability

#### `pages/clinical/patients/_id/encounter/medical.vue` — UPDATED
- **ADDED**: automatic task creation from medical orders:
   - medication order → task assigned to `NURSE`
   - lab order → task assigned to `LAB`
   - imaging order → task assigned to `IMAGING`
- **ADDED**: task payload includes related order id, assigned role, and reason context for downstream action tracking

### Additional Clinical Navigation

#### `pages/clinical/inpatient.vue` — UPDATED
- **ADDED**: direct link from the patient column to the patient details page `/clinical/patients/:id`
- **ADDED**: dedicated `mdi-account-card-details-outline` action to open the patient details page from the inpatient table
- **ADDED**: dedicated `mdi-stethoscope` action to launch the nursing evaluation route `/clinical/patients/:id/encounter/nurse` from an admitted patient row
- **BEHAVIOR**: the nursing evaluation action is disabled when the patient is already marked as `Discharged`

#### `pages/clinical/visits.vue` — UPDATED
- **ADDED**: direct link from the patient row to the patient details page `/clinical/patients/:id`
- **ADDED**: new actions column in outpatient history with quick access to patient details and nursing evaluation
- **ADDED**: `mdi-stethoscope` button to quickly reopen the nursing triage flow from outpatient history

#### `pages/clinical/patients/_id/index.vue` — UPDATED
- **UPDATED**: translated the patient details page UI copy to English for the new tabs, actions, labels, note sections, and vital sign history
- **ADDED**: normalized encounter type display so legacy values like `INFIRMIER` and `MÉDICAL` render as `NURSING` and `MEDICAL`

#### `pages/clinical/patients/_id/encounter/nurse.vue` — UPDATED
- **UPDATED**: translated the nursing evaluation page UI copy to English, including section titles, form labels, placeholders, action buttons, and notifications
- **UPDATED**: translated visible select option values and defaults for the newly added nursing workflow

#### `pages/clinical/patients/_id/encounter/medical.vue` — UPDATED
- **UPDATED**: translated the medical encounter page UI copy to English, including headers, section titles, form labels, placeholders, action buttons, and notifications
- **UPDATED**: translated visible workflow option values and defaults for severity, final decision, exam state, and risk factors in the new medical flow

### 🛠 Correctifs post-intégration clinique

#### `store/clinical.js` — CORRIGÉ
Deux erreurs de structure JavaScript ont été introduites pendant l'ajout du circuit clinique, puis corrigées :
- **CORRIGÉ** : `recordVitalSigns`, `addNursingNote` et `addMedicalNote` étaient imbriquées par erreur dans `updateInvoice()` au lieu d'être déclarées comme actions Vuex distinctes
- **CORRIGÉ** : `getVitalSigns`, `getNursingNotes` et `getMedicalNotes` étaient imbriqués par erreur dans `getInvoices` au lieu d'être déclarés comme getters racine
- **IMPACT** : supprimait le démarrage de Nuxt avec erreurs Babel `Missing semicolon` sur le store clinique
- **RÉSULTAT** : build Nuxt rétabli, flux clinique compilable, getters/actions vitaux-notes disponibles à l'exécution

#### Environnement local de preview — VALIDÉ
Le démarrage local a nécessité une remise en état de l'environnement Node pour permettre la revue fonctionnelle du module clinique :
- **RÉINSTALLÉ** : dépendances Node via suppression de `node_modules/` et `package-lock.json`, puis `npm install --legacy-peer-deps --no-progress --no-audit --no-fund`
- **CRÉÉ LOCAL UNIQUEMENT** : fichier `.env.development` de preview avec valeurs placeholder pour satisfaire la validation stricte de `nuxt.config.js`
- **VALIDÉ** : démarrage Nuxt en développement après correction du store et restauration des dépendances
- **NOTE** : le port 8000 étant déjà occupé localement, Nuxt a automatiquement basculé sur un port aléatoire de preview

#### Observations de build non bloquantes
- **WARN** : `router.scrollBehavior` dans `nuxt.config.js` est déprécié dans Nuxt 2 au profit de `app/router.scrollBehavior.js`
- **WARN** : `mode: 'spa'` est marqué comme déprécié ; la forme moderne est `ssr: false`
- **WARN** : `static/icon.png` absent, ce qui dégrade seulement l'initialisation PWA
- **WARN** : absence de configuration ESLint détectée par `eslint-loader` pendant le build

### 🔴 Sécurité P0 — Corrections critiques

#### `nuxt.config.js`
- **SUPPRIMÉ** : Tous les secrets hardcodés avec valeurs de fallback (`|| 'valeur_en_dur'`)
  - Clé Google Maps API (`AIzaSy...`) — **à révoquer dans Google Cloud Console**
  - Client ID Cognito (`3j7mu7dum...`) — **à révoquer dans AWS Console**
  - Client Secret Cognito (`314ebm8...`) — **à révoquer dans AWS Console**
  - URL Supabase (`jgltrrvzcrylapnuyfyf.supabase.co`) — **à révoquer**
  - Clé Supabase (`sb_publishable_CHBAlLp...`) — **à révoquer dans Supabase Dashboard**
- **AJOUTÉ** : `privateRuntimeConfig` — `CLIENT_SECRET` isolé côté serveur uniquement, jamais envoyé au navigateur
- **AJOUTÉ** : `publicRuntimeConfig` — variables runtime non compilées dans le bundle JS
- **AJOUTÉ** : Validation des variables d'environnement au démarrage du serveur (lève une erreur explicite si une variable critique est absente)
- **AJOUTÉ** : `router.prefetchLinks: false` — désactive le prefetch automatique des routes protégées (sécurité RBAC)
- **AJOUTÉ** : `router.scrollBehavior` — remise en haut de page à chaque navigation
- **AJOUTÉ** : `@nuxtjs/eslint-module` réactivé (était commenté)
- **AJOUTÉ** : `axios` configuré : `baseURL`, `timeout: 15000`, header `X-Application`, `retry: 2`
- **AJOUTÉ** : `head.meta` enrichi : `robots: noindex`, `theme-color`, `Cache-Control: no-store`
- **AJOUTÉ** : `pwa.manifest` complet : nom, `short_name`, `lang: fr`, `theme_color`
- **AJOUTÉ** : `pwa.workbox` : cache uniquement les fonts Google, jamais les données cliniques
- **MODIFIÉ** : `nuxtPrecompress.enabled` conditionnel (`NODE_ENV === 'production'` uniquement)

#### `plugins/supabase.js`
- **SUPPRIMÉ** : `console.log('Initializing Supabase with URL:', ...)` — exposait l'URL en clair dans les DevTools
- **AJOUTÉ** : Validation au démarrage — lève une erreur si `SUPABASE_URL` ou `SUPABASE_KEY` est absent

#### `vercel.json`
- **AJOUTÉ** : Headers HTTP de sécurité sur toutes les réponses :
  - `X-Frame-Options: DENY` — protection contre le clickjacking
  - `X-Content-Type-Options: nosniff` — protection contre le MIME sniffing
  - `X-XSS-Protection: 1; mode=block` — protection XSS pour les navigateurs legacy
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` — force HTTPS pour 2 ans
  - `Referrer-Policy: strict-origin-when-cross-origin` — évite les fuites de données via l'en-tête Referer
  - `Content-Security-Policy` — restreint les sources de scripts, styles, images, et connexions
  - `Permissions-Policy` — désactive `camera`, `microphone`, `interest-cohort`
- **AJOUTÉ** : Header `Cache-Control: immutable` sur les assets `/_nuxt/*` (performance)

#### `README.md`
- **AJOUTÉ** : Section `🔑 Environment Configuration` avec tableau de classification des variables (public/privé)
- **AJOUTÉ** : Section `🔒 Security Architecture` documentant toutes les corrections P0
- **AJOUTÉ** : Tableau des risques résiduels connus avec sévérité et fichiers concernés
- **AJOUTÉ** : Cartographie complète des routes par rôle (couche Ministry + couche Clinique)
- **MIS À JOUR** : Prérequis Node.js : v14/v16 → **v20 LTS** (v14/v16 sont en fin de vie)
- **MIS À JOUR** : Quick Start avec étape obligatoire de configuration de l'environnement
- **MIS À JOUR** : Instructions de déploiement Vercel (variables via Dashboard, pas `vercel.json`)

---

### 📁 Nouveaux fichiers créés

---

### 🏥 Circuit clinique — Dossier patient & Encounters médicaux

#### `pages/clinical/patients/_id/index.vue` — CRÉÉ
Page centrale du dossier patient (hub clinique). Accessible via `/clinical/patients/:id`.
- **Bandeau identité** : Nom complet, ID, sexe, âge calculé, groupe sanguin, site clinique ; alertes hospitalisation active et allergie connue
- **Boutons d'action rapides** : Triage infirmier → `encounter/nurse`, Consultation médicale → `encounter/medical` (DOCTOR/ADMIN uniquement)
- **Onglet Résumé** : Identité administrative, contact/provenance, antécédents + allergies, derniers paramètres vitaux en résumé
- **Onglet Paramètres vitaux** : Tableau complet avec alertes couleur (TA, FC, FR, T°, SpO2, Glycémie, Glasgow, Douleur)
- **Onglet Consultations** : Timeline chronologique de tous les encounters (INFIRMIER + MÉDICAL) avec motif, diagnostic, praticien
- **Onglet Notes infirmières** : Notes de progression infirmières chronologiques (observation, actions, réponse patient)
- **Onglet Notes médicales** : Notes SOAP médicales — visible uniquement aux rôles `DOCTOR` et `ADMIN`

#### `pages/clinical/patients/_id/encounter/nurse.vue` — CRÉÉ
Formulaire complet d'évaluation et triage infirmier. Route : `/clinical/patients/:id/encounter/nurse`.
- **Paramètres vitaux** : TA, FC, FR, Température, SpO2, Glycémie, Poids, Taille, IMC calculé
- **Score de Glasgow** : Saisie des 3 composantes (E + V + M), score total calculé avec alerte couleur
- **Douleur EVA** : Slider 0-10 avec gradient de couleur
- **Motif & Anamnèse** : Motif principal, histoire de la maladie, mode de venue, niveau de triage (Vert/Jaune/Orange/Rouge)
- **Assessment infirmier** : État général, conscience, état cutané, respiratoire, problèmes infirmiers identifiés, hygiène, autonomie
- **Note de progression infirmière** : Actions réalisées, note narrative, réponse du patient, orientation/suite
- **À la sauvegarde** : dispatch vers 3 actions Vuex : `recordVitalSigns`, `logVisit` (encounterType: INFIRMIER), `addNursingNote`
- **Rôles autorisés** : NURSE, DOCTOR, ADMIN (via middleware)

#### `pages/clinical/patients/_id/encounter/medical.vue` — CRÉÉ
Formulaire complet de consultation médicale. Route : `/clinical/patients/:id/encounter/medical`.
- **Contexte** : Affiche les derniers paramètres vitaux du triage infirmier en en-tête
- **Anamnèse complète** : Motif, HPI, antécédents médicaux/chirurgicaux/familiaux, allergies, médicaments en cours, facteurs de risque
- **Examen physique** : État général + examen par appareils (cardiovasculaire, respiratoire, abdominal, neurologique, autres)
- **Hypothèses diagnostiques** : Diagnostic principal, diagnostics différentiels (combobox libre), comorbidités, sévérité
- **Plan thérapeutique** : Prescriptions médicamenteuses (texte libre), ordres de labo (multi-select), imagerie (multi-select), autres ordres
- **Note SOAP** : Subjective, Objective, Assessment, Plan
- **Décision finale** : Retour domicile / Hospitalisation / Référence / Urgences / Suivi ambulatoire / Chirurgie programmée, prochain RDV, consignes patient
- **À la sauvegarde** : dispatch vers `logVisit` (MÉDICAL), `addMedicalNote`, `prescribeMedication`, `orderLab`, `orderImaging`, `admitPatient` (si Hospitalisation)
- **Rôles autorisés** : DOCTOR, ADMIN uniquement

#### `store/clinical.js` — MIS À JOUR
Ajout de la gestion des paramètres vitaux, notes infirmières, et notes médicales :
- **État** : `vitalSigns: []`, `nursingNotes: []`, `medicalNotes: []`
- **Mutations** : `ADD_VITAL_SIGNS`, `ADD_NURSING_NOTE`, `ADD_MEDICAL_NOTE`
- **`LOAD_FROM_STORAGE`** : chargement des 3 nouvelles clés depuis `localStorage`
- **Actions** :
   - `recordVitalSigns(vitals)` → ID préfixé `VIT-`, filtre par institution
   - `addNursingNote(note)` → ID préfixé `NNT-`
   - `addMedicalNote(note)` → ID préfixé `MNT-`
- **Getters** :
   - `getVitalSigns` → filtré par institution pour les rôles cliniques
   - `getNursingNotes` → filtré par institution
   - `getMedicalNotes` → filtré par institution

#### `pages/clinical/patients/index.vue` — MIS À JOUR
- Bouton `mdi-eye` : remplacé `$toast.info('Viewing Patient Record')` par `$router.push('/clinical/patients/' + item.id)` — navigation vers le dossier patient

---

### 🗺 Nouvelles routes cliniques

| Route | Page | Rôles |
| :--- | :--- | :--- |
| `/clinical/patients/:id` | Dossier patient complet (5 onglets) | ADMIN, DOCTOR, NURSE |
| `/clinical/patients/:id/encounter/nurse` | Triage & Évaluation infirmière | ADMIN, DOCTOR, NURSE |
| `/clinical/patients/:id/encounter/medical` | Consultation médicale complète | ADMIN, DOCTOR |

#### `.env.example`
Modèle de configuration d'environnement documenté, sans aucune valeur réelle.  
Toutes les variables requises y sont listées avec leur description, classification (public/privé), et les instructions pour les obtenir.  
**Les développeurs doivent copier ce fichier vers `.env.development` avant de démarrer.**

#### `.gitignore`
Le projet n'en possédait aucun. Protège désormais :
- `.env` et `.env.*` (sauf `.env.example`)
- `node_modules/`, `.nuxt/`, `dist/`, `.output/`
- Fichiers IDE (`.vscode/`, `.idea/`)
- Logs et fichiers de couverture de tests

---

## Risques résiduels — À traiter en priorité

> Ces risques ont été identifiés lors de l'audit mais n'ont pas encore été corrigés.  
> Chaque développeur doit en être informé avant de contribuer.

| Risque | Sévérité | Fichiers | Sprint cible |
| :--- | :---: | :--- | :---: |
| Données cliniques stockées uniquement en `localStorage` — aucune persistance serveur, aucune sécurité côté serveur | 🔴 Critique | `store/clinical.js` | S2 |
| Hachage SHA-256 sans sel côté navigateur pour les mots de passe (vulnérable rainbow tables) | 🔴 Critique | `store/facility.js` → `sha256()` | S2 |
| Données de staff (mots de passe hashés) stockées en `localStorage` — effaçables | 🔴 Critique | `store/facility.js` | S2 |
| Deux systèmes d'auth non reconciliés : Cognito (`plugins/auth.js`) et localStorage (`store/facility.js`) | 🟠 Élevé | `plugins/auth.js`, `store/auth.js` | S2 |
| Audit log stocké en `localStorage` — un admin peut l'effacer via les DevTools | 🟠 Élevé | `pages/admin/audit.vue` | S3 |
| Absence de rate limiting sur `/login` — attaques brute-force possibles | 🟠 Élevé | `pages/login.vue` | S2 |
| Absence totale de tests unitaires et d'intégration | 🟡 Moyen | Tout le projet | S3 |
| Nuxt 2 / Vue 2 en fin de vie (EOL décembre 2023) — plus de correctifs de sécurité | 🟡 Moyen | `package.json` | S4-6 |
| `moment.js` obsolète — `date-fns` déjà présent dans les dépendances | 🟢 Faible | `package.json` | S4 |
| Deux librairies de graphiques (ApexCharts + Chart.js) — bundle inutilement lourd | 🟢 Faible | `package.json` | S4 |

---

## Actions requises après ce commit

> **Ces étapes doivent être effectuées manuellement par un administrateur du projet.**

1. **Révoquer toutes les clés exposées** dans l'historique Git :
   - [ ] Google Cloud Console → supprimer la clé `AIzaSyCbJ9q4wE-kF96sFcMKiYPmBfiGw_MpvuY`
   - [ ] AWS Console → Cognito → régénérer le Client Secret de l'App Client
   - [ ] Supabase Dashboard → régénérer la clé `sb_publishable_CHBAlLp76qFuLpjBXnVIYQ_0316QP08`

2. **Configurer les nouvelles clés** dans les environnements :
   - [ ] Vercel Dashboard → Settings → Environment Variables
   - [ ] Fichier `.env.development` local (copié depuis `.env.example`)

3. **Activer les Row Level Security (RLS)** sur toutes les tables Supabase :
   - [ ] Table `patients`
   - [ ] Table `staff`
   - [ ] Table `invoices`
   - [ ] Table `audit_logs`
   - [ ] Toutes les autres tables cliniques

4. **Envisager de purger l'historique Git** contenant les secrets :
   ```bash
   # Utiliser BFG Repo Cleaner ou git filter-repo
   # ATTENTION : cette opération réécrit l'historique — coordonner avec toute l'équipe
   git filter-repo --string '314ebm8pfjvtqo8qv1palf3l2a38ktbbmuq2' --replace-text /dev/null
   ```

---

*Document maintenu par Jepthe Nkwanmen l'équipe de développement CameroHealth — Innovtech Services*  
*Dernière mise à jour : 27 Avril 2026*
