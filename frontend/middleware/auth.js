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
const OPEN_ROUTES = ['/', '/about', '/contact', '/login', '/register', '/ministry-login']

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

const CLINICAL_PERMITTED = {
  ADMIN:   ['/admin', '/clinical'],
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

  const path            = route.path
  const isAuthenticated = store.state.auth.isAuthenticated
  const role            = store.state.auth.role
  const setupComplete   = store.state.facility ? store.state.facility.setupComplete : false

  // ── 1. Layer selector & open routes — always allow ──────────────────────────
  if (OPEN_ROUTES.includes(path)) {
    // / is always the entry point — never auto-redirect away from it
    if (path !== '/') {
      if (isAuthenticated && role) {
        const home = CLINICAL_HOME[role] || MINISTRY_HOME[role]
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

  // ── 4. Super Admin routes ─────────────────────────────────────────────────
  if (path.startsWith('/super-admin')) {
    if (role !== 'ADMIN') return redirect(CLINICAL_HOME[role] || MINISTRY_HOME[role] || '/')
    return
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
