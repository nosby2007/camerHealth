// ─── CameroHealth — Offline write queue ─────────────────────────────────────
// A write-only queue for clinical actions issued while offline, NOT a page/
// asset cache — Workbox stays disabled (see nuxt.config.js) so PHI never
// enters a shared browser cache. Entries live in IndexedDB, scoped by
// facilityId, and are replayed in order as soon as the browser goes back
// online (or the app is remounted).
const DATABASE_NAME = 'camero-health-offline-queue'
const STORE_NAME = 'pending-writes'
const DATABASE_VERSION = 1

function openDatabase() {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('Offline queue is unavailable'))
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Unable to open offline queue'))
  })
}

function runTransaction(mode, operation) {
  return openDatabase().then(database => new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode)
    const request = operation(transaction.objectStore(STORE_NAME))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Offline queue operation failed'))
    transaction.oncomplete = () => database.close()
  }))
}

function makeEntryId() {
  return `OFQ-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`
}

// actionType identifies which handler in FLUSH_HANDLERS (below) replays this
// entry — it is NOT a Vuex action path, so a handler can call whichever
// store action makes sense once back online.
export function enqueue(facilityId, actionType, payload) {
  const entry = {
    id: makeEntryId(),
    facilityId,
    actionType,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastError: null
  }
  return runTransaction('readwrite', store => store.put(entry)).then(() => entry)
}

export function listPending(facilityId) {
  return runTransaction('readonly', store => store.getAll()).then(entries =>
    (entries || []).filter(entry => !facilityId || entry.facilityId === facilityId)
  )
}

export function removeEntry(id) {
  return runTransaction('readwrite', store => store.delete(id))
}

function updateEntry(entry) {
  return runTransaction('readwrite', store => store.put(entry))
}

// handlers: { [actionType]: (payload) => Promise } — supplied by the caller
// so this module has no dependency on the Vuex store or api client.
export async function flush(facilityId, handlers) {
  const pending = await listPending(facilityId)
  let succeeded = 0
  let failed = 0
  for (const entry of pending.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))) {
    const handler = handlers[entry.actionType]
    if (!handler) continue
    try {
      await handler(entry.payload)
      await removeEntry(entry.id)
      succeeded += 1
    } catch (error) {
      failed += 1
      entry.attempts += 1
      entry.lastError = error.response?.data?.error || error.message
      await updateEntry(entry)
    }
  }
  return { succeeded, failed, remaining: pending.length - succeeded }
}

export function isNetworkError(error) {
  return !error.response
}

let onlineListenerAttached = false
export function watchForReconnect(callback) {
  if (typeof window === 'undefined' || onlineListenerAttached) return
  onlineListenerAttached = true
  window.addEventListener('online', callback)
}
