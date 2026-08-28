const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const root = path.resolve(__dirname, '..')
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8')

test('distribution pages remain publicly accessible', () => {
  const middleware = read('middleware/auth.js')
  for (const route of ['/about', '/implementation', '/security', '/contact']) {
    assert.match(middleware, new RegExp(`['"]${route}['"]`))
  }
})

test('public pages expose product, deployment, security and contact journeys', () => {
  const home = read('pages/index.vue')
  const layout = read('layouts/public.vue')
  assert.match(home, /CameroHealth/)
  assert.match(home, /camerohealth-care-team\.png/)
  assert.match(layout, /to="\/implementation"/)
  assert.match(layout, /to="\/security"/)
  assert.match(layout, /to="\/contact"/)
  assert.match(layout, /to="\/login"/)
})

test('public pages are indexable while authenticated layouts are not', () => {
  assert.doesNotMatch(read('nuxt.config.js'), /content:\s*"noindex, nofollow"/)
  assert.match(read('layouts/public.vue'), /content: 'index, follow'/)
  assert.match(read('layouts/admins.vue'), /content: 'noindex, nofollow'/)
  assert.match(read('layouts/default.vue'), /content: 'noindex, nofollow'/)
})

test('contact form warns against patient data', () => {
  const contact = read('pages/contact.vue')
  assert.match(contact, /Aucune donnée patient/)
  assert.match(contact, /Do not enter any patient information/)
  assert.match(contact, /mailto:support@camerohealth\.cm/)
})

test('public site presents CEMAC identity, specialist modules and resilient access', () => {
  const home = read('pages/index.vue')
  const product = read('pages/about.vue')
  assert.match(home, /Interopérabilité CEMAC/)
  assert.match(home, /CMR-CE-26-004821/)
  assert.match(home, /mode hors connexion sécurisé/)
  for (const moduleName of ['LAB', 'GYNÉCO', 'REFERRAL', 'NETWORK']) {
    assert.match(home, new RegExp(moduleName))
  }
  assert.match(product, /Réseau hospitalier/)
})
