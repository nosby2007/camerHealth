const DATABASE_NAME = 'camero-health-clinical-files'
const STORE_NAME = 'patient-documents'
const DATABASE_VERSION = 1

function openDatabase() {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('Offline file storage is unavailable'))
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Unable to open offline file storage'))
  })
}

function runTransaction(mode, operation) {
  return openDatabase().then(database => new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode)
    const request = operation(transaction.objectStore(STORE_NAME))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Offline file operation failed'))
    transaction.oncomplete = () => database.close()
  }))
}

export function saveOfflineDocument(key, file) {
  return runTransaction('readwrite', store => store.put(file, key))
}

export function getOfflineDocument(key) {
  return runTransaction('readonly', store => store.get(key))
}
