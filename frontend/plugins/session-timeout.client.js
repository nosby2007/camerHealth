const DEFAULT_IDLE_TIMEOUT_MS = 15 * 60 * 1000
const ACTIVITY_THROTTLE_MS = 1000

export default ({ store }) => {
  const configuredTimeout = Number(process.env.SESSION_IDLE_TIMEOUT_MS)
  const idleTimeoutMs = Number.isFinite(configuredTimeout) && configuredTimeout > 0
    ? configuredTimeout
    : DEFAULT_IDLE_TIMEOUT_MS

  let timer = null
  let lastActivityAt = Date.now()
  let lastHandledAt = 0

  const clearTimer = () => {
    if (timer) window.clearTimeout(timer)
    timer = null
  }

  const expireSession = () => {
    clearTimer()
    if (store.state.auth && store.state.auth.isAuthenticated) {
      store.dispatch('auth/logout', { reason: 'inactive' })
    }
  }

  const scheduleExpiry = () => {
    clearTimer()
    if (!store.state.auth || !store.state.auth.isAuthenticated) return

    const elapsed = Date.now() - lastActivityAt
    const remaining = idleTimeoutMs - elapsed
    if (remaining <= 0) {
      expireSession()
      return
    }
    timer = window.setTimeout(expireSession, remaining)
  }

  const recordActivity = () => {
    const now = Date.now()
    if (now - lastHandledAt < ACTIVITY_THROTTLE_MS) return
    lastHandledAt = now
    lastActivityAt = now
    scheduleExpiry()
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') scheduleExpiry()
  }

  ;['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(eventName => {
    window.addEventListener(eventName, recordActivity, { passive: true })
  })
  document.addEventListener('visibilitychange', handleVisibilityChange)

  store.watch(
    state => Boolean(state.auth && state.auth.isAuthenticated),
    isAuthenticated => {
      if (isAuthenticated) {
        lastActivityAt = Date.now()
        scheduleExpiry()
      } else {
        clearTimer()
      }
    },
    { immediate: true }
  )
}
