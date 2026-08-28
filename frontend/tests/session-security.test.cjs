const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')

const frontendRoot = path.resolve(__dirname, '..')

function loadSessionPlugin() {
  const pluginPath = path.join(frontendRoot, 'plugins', 'session-timeout.client.js')
  const source = fs.readFileSync(pluginPath, 'utf8')
    .replace('export default', 'module.exports =')
  const sandbox = {
    module: { exports: {} },
    exports: {},
    process: { env: {} },
    window: null,
    document: null,
    Date
  }
  vm.runInNewContext(source, sandbox, { filename: pluginPath })
  return sandbox.module.exports
}

test('expires an authenticated session after fifteen minutes', () => {
  const eventListeners = {}
  const scheduled = []
  const dispatches = []
  const windowMock = {
    addEventListener: (name, handler) => { eventListeners[name] = handler },
    clearTimeout: () => {},
    setTimeout: (handler, delay) => {
      scheduled.push({ handler, delay })
      return scheduled.length
    }
  }
  const documentMock = {
    visibilityState: 'visible',
    addEventListener: (name, handler) => { eventListeners[name] = handler }
  }
  const store = {
    state: { auth: { isAuthenticated: true } },
    dispatch: (type, payload) => dispatches.push({ type, payload }),
    watch: (selector, callback, options) => {
      if (options.immediate) callback(selector(store.state))
    }
  }

  const plugin = loadSessionPlugin()
  const originalWindow = global.window
  const originalDocument = global.document
  global.window = windowMock
  global.document = documentMock
  try {
    const source = fs.readFileSync(path.join(frontendRoot, 'plugins', 'session-timeout.client.js'), 'utf8')
      .replace('export default', 'module.exports =')
    const sandbox = {
      module: { exports: {} },
      exports: {},
      process: { env: {} },
      window: windowMock,
      document: documentMock,
      Date
    }
    vm.runInNewContext(source, sandbox)
    sandbox.module.exports({ store })
  } finally {
    global.window = originalWindow
    global.document = originalDocument
  }

  assert.equal(typeof plugin, 'function')
  assert.equal(scheduled[0].delay, 15 * 60 * 1000)
  assert.equal(typeof eventListeners.pointerdown, 'function')
  assert.equal(typeof eventListeners.visibilitychange, 'function')

  scheduled[0].handler()
  // The plugin runs inside a vm sandbox (a separate realm), so the dispatched
  // payload object is not identity-equal to a main-realm literal even when
  // structurally identical. Normalize through JSON to compare by value only.
  assert.deepEqual(JSON.parse(JSON.stringify(dispatches)), [{ type: 'auth/logout', payload: { reason: 'inactive' } }])
})

test('protected unauthenticated routes redirect to login', () => {
  const middleware = fs.readFileSync(path.join(frontendRoot, 'middleware', 'auth.js'), 'utf8')
  assert.match(middleware, /return redirect\('\/login'\)/)
  assert.match(middleware, /return redirect\('\/ministry-login'\)/)
})

test('logout clears patient tabs and replaces browser history', () => {
  const authStore = fs.readFileSync(path.join(frontendRoot, 'store', 'auth.js'), 'utf8')
  assert.match(authStore, /removeItem\('camero_health_openPatientTabs'\)/)
  assert.match(authStore, /window\.location\.replace\(target\)/)
})
