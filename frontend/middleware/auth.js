/**
 * auth.js middleware — CameroHealth Route Guard
 *
 * TWO COMPLETELY SEPARATE AUTH FLOWS:
 *
 * ── NATIONAL HEALTH STATISTICS (original, unchanged) ──────────────────────────────────────
 *   Entry : /ministry-login  (free-entry form → Cognito)
 *   Routes: /ministry, /surveillance, /maps, /reports
 *   Roles : PUBLIC_HEALTH_OFFICER, EPIDEMIOLOGIST
 *
 * ── CLINICAL LAYER (new facility-based) ───────────────────────────────────────
 *   Entry : /register (first time) → /login (returning)
 *   Routes: /clinical/*, /admin/*
 *   Roles : ADMIN, DOCTOR, NP, NURSE, CNA, MIDWIFE, LAB, IMAGING,
 *           PHARMACY, MAJOR_SERVICE, NURSING_SUPERVISOR, FRONT_DESK,
 *           BILLING, RECORDS, SOCIAL_WORKER
 */

const MINISTRY_ROLES  = ['PUBLIC_HEALTH_OFFICER', 'EPIDEMIOLOGIST']
// Phase 13 org hierarchy — MINSANTE / Regional Delegation / District tier,
// distinct from facility-level ADMIN. See docs/security/multi-tenant-superadmin-architecture.md.
const SUPER_ADMIN_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'REGIONAL_ADMIN', 'DISTRICT_ADMIN']
// Internal vendor team (sales/support) — platform-scoped like SUPER_ADMIN,
// but restricted to their own corner of /super-admin (no org hierarchy, no
// RMA, no team management). See backend/src/routes/platform.js "team" routes.
const PLATFORM_TEAM_ROLES = ['SALES', 'SUPPORT']
// Feature sub-paths beyond the bare /super-admin home (checked separately
// below since a naive prefix match on '/super-admin' itself would swallow
// every sub-route, including ones team roles must NOT reach).
const PLATFORM_TEAM_PERMITTED = {
  SALES:   ['/super-admin/pipeline'],
  SUPPORT: []
}
const CLINICAL_ROLES  = [
  'ADMIN',
  'DOCTOR',
  'NP',
  'NURSE',
  'CNA',
  'MIDWIFE',
  'LAB',
  'IMAGING',
  'PHARMACY',
  'MAJOR_SERVICE',
  'NURSING_SUPERVISOR',
  'BILLING',
  'RECORDS',
  'FRONT_DESK',
  'SOCIAL_WORKER',
  'PHYSIOTHERAPIST'
]

// Fully public — no auth needed
const OPEN_ROUTES = ['/', '/about', '/implementation', '/security', '/contact', '/login', '/register', '/ministry-login']

const CLINICAL_HOME = {
  ADMIN:   '/admin',
  DOCTOR:  '/clinical/dashboard',
  NP:      '/clinical/dashboard',
  NURSE:   '/clinical/patients',
  CNA:     '/clinical/nursing',
  MIDWIFE: '/clinical/patients',
  LAB:     '/clinical/lab',
  IMAGING: '/clinical/imaging',
  PHARMACY: '/clinical/medications',
  MAJOR_SERVICE: '/clinical/patients',
  NURSING_SUPERVISOR: '/clinical/patients',
  BILLING: '/clinical/billing',
  RECORDS: '/clinical/patients',
  FRONT_DESK: '/clinical/patients',
  SOCIAL_WORKER: '/clinical/patients',
  PHYSIOTHERAPIST: '/clinical/patients'
}

const MINISTRY_HOME = {
  PUBLIC_HEALTH_OFFICER: '/ministry',
  EPIDEMIOLOGIST:        '/ministry'
}

const SUPER_ADMIN_HOME = {
  SUPER_ADMIN:     '/super-admin',
  ORG_ADMIN:       '/super-admin',
  REGIONAL_ADMIN:  '/super-admin',
  DISTRICT_ADMIN:  '/super-admin',
  SALES:           '/super-admin',
  SUPPORT:         '/super-admin'
}

const CLINICAL_PERMITTED = {
  ADMIN:   ['/admin', '/admin/rma', '/clinical'],
  DOCTOR:  ['/clinical'],
  NP:      ['/clinical'],
  NURSE:   ['/clinical'],
  CNA:     ['/clinical/nursing', '/clinical/patients'],
  MIDWIFE: ['/clinical'],
  LAB:     ['/clinical', '/clinical/lab', '/clinical/dashboard'],
  IMAGING: ['/clinical', '/clinical/imaging', '/clinical/dashboard'],
  PHARMACY: ['/clinical', '/clinical/medications', '/clinical/dashboard'],
  MAJOR_SERVICE: ['/clinical'],
  NURSING_SUPERVISOR: ['/clinical'],
  BILLING: ['/clinical/billing', '/clinical/catalog', '/clinical/dashboard', '/clinical/insurance'],
  RECORDS: ['/clinical', '/clinical/patients', '/clinical/dashboard'],
  FRONT_DESK: ['/clinical', '/clinical/patients', '/clinical/appointments', '/clinical/dashboard'],
  SOCIAL_WORKER: ['/clinical'],
  PHYSIOTHERAPIST: ['/clinical', '/clinical/nursing', '/clinical/dashboard']
}

const MINISTRY_PERMITTED = ['/ministry', '/surveillance', '/maps', '/reports']

export default function ({ store, redirect, route }) {
  if (process.client) {
    store.commit('auth/RESTORE_SESSION')
    store.commit('auth/loadFromStorage')
    store.commit('facility/RELOAD_FROM_STORAGE')
  }

  // nuxt generate emits each route as a directory (e.g. login/index.html), and
  // the static-file nginx 301s a bare "/login" to "/login/" to serve it —
  // so route.path can arrive with a trailing slash on a fresh page load.
  // Strip it before any comparison below, or "/login/" fails the OPEN_ROUTES
  // check, gets redirect()'d back to "/login", and — since Vue Router treats
  // the two as the same route — that redirect is rejected as a duplicate
  // navigation, leaving the loading bar stuck.
  const path            = route.path.length > 1 ? route.path.replace(/\/+$/, '') : route.path
  const isAuthenticated = store.state.auth.isAuthenticated
  const role            = store.state.auth.role
  const setupComplete   = store.state.facility ? store.state.facility.setupComplete : false

  // ── 1. Layer selector & open routes — always allow ──────────────────────────
  if (OPEN_ROUTES.includes(path)) {
    // / is always the entry point — never auto-redirect away from it
    if (path !== '/') {
      if (isAuthenticated && role) {
        const home = CLINICAL_HOME[role] || MINISTRY_HOME[role] || SUPER_ADMIN_HOME[role]
        if (home) return redirect(home)
      }
    }
    // Allow /login and /register to open freely
    return
  }

  // ── 2. Must be authenticated beyond this point ───────────────────────────────
  if (!isAuthenticated || !role) {
    // Keep the two authentication layers separate and never leave a protected
    // route visible after a session expires.
    if (MINISTRY_PERMITTED.some(p => path.startsWith(p))) return redirect('/ministry-login')
    return redirect('/login')
  }

  // ── 3. Ministry routes ───────────────────────────────────────────────────────
  if (MINISTRY_PERMITTED.some(p => path.startsWith(p))) {
    if (!MINISTRY_ROLES.includes(role)) return redirect(CLINICAL_HOME[role] || '/')
    return
  }

  // ── 4. Super Admin routes (Phase 13 org hierarchy — not facility ADMIN) ──────
  if (path.startsWith('/super-admin')) {
    if (SUPER_ADMIN_ROLES.includes(role)) return // full access to every /super-admin sub-route
    if (PLATFORM_TEAM_ROLES.includes(role)) {
      const permitted = PLATFORM_TEAM_PERMITTED[role] || []
      const allowed = path === '/super-admin' || permitted.some(p => path.startsWith(p))
      if (allowed) return
    }
    return redirect(CLINICAL_HOME[role] || MINISTRY_HOME[role] || '/')
  }

  // ── 4. Clinical / Admin routes ───────────────────────────────────────────────
  if (path.startsWith('/clinical') || path.startsWith('/admin')) {
    if (!CLINICAL_ROLES.includes(role)) return redirect(MINISTRY_HOME[role] || '/')
    const permitted = CLINICAL_PERMITTED[role] || []
    const allowed   = permitted.some(p => path.startsWith(p))
    if (!allowed) return redirect(CLINICAL_HOME[role] || '/')
    return
  }
}
