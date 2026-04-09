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
 *   Roles : ADMIN, DOCTOR, NURSE, LAB, IMAGING
 */

const MINISTRY_ROLES  = ['PUBLIC_HEALTH_OFFICER', 'EPIDEMIOLOGIST']
const CLINICAL_ROLES  = ['ADMIN', 'DOCTOR', 'NURSE', 'LAB', 'IMAGING']

// Fully public — no auth needed
const OPEN_ROUTES = ['/', '/login', '/register', '/ministry-login']

const CLINICAL_HOME = {
  ADMIN:   '/admin',
  DOCTOR:  '/clinical/dashboard',
  NURSE:   '/clinical/dashboard',
  LAB:     '/clinical/lab',
  IMAGING: '/clinical/imaging'
}

const MINISTRY_HOME = {
  PUBLIC_HEALTH_OFFICER: '/ministry',
  EPIDEMIOLOGIST:        '/ministry'
}

const CLINICAL_PERMITTED = {
  ADMIN:   ['/admin', '/clinical'],
  DOCTOR:  ['/clinical'],
  NURSE:   ['/clinical'],
  LAB:     ['/clinical/lab', '/clinical/dashboard'],
  IMAGING: ['/clinical/imaging', '/clinical/dashboard']
}

const MINISTRY_PERMITTED = ['/ministry', '/surveillance', '/maps', '/reports']

export default function ({ store, redirect, route }) {
  const path            = route.path
  const isAuthenticated = store.state.auth.isAuthenticated
  const role            = store.state.auth.role
  const setupComplete   = store.state.facility ? store.state.facility.setupComplete : false

  // ── 1. Layer selector & open routes — always allow ──────────────────────────
  if (OPEN_ROUTES.includes(path)) {
    // If already authenticated, skip straight to home
    if (isAuthenticated && role) {
      const home = CLINICAL_HOME[role] || MINISTRY_HOME[role]
      if (home) return redirect(home)
    }
    // /register only valid when facility not yet set up
    if (path === '/register' && setupComplete) return redirect('/login')
    // /login only valid when facility is set up
    if (path === '/login' && !setupComplete) return redirect('/register')
    return
  }

  // ── 2. Must be authenticated beyond this point ───────────────────────────────
  if (!isAuthenticated || !role) {
    // Send to the right entry point
    return redirect('/')
  }

  // ── 3. Ministry routes ───────────────────────────────────────────────────────
  if (MINISTRY_PERMITTED.some(p => path.startsWith(p))) {
    if (!MINISTRY_ROLES.includes(role)) return redirect(CLINICAL_HOME[role] || '/')
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
