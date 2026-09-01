const test = require('node:test')
const assert = require('node:assert/strict')
const { occurrencesThrough } = require('./medicationSchedule')

test('builds recurring medication doses only through the refresh horizon', () => {
  const doses = occurrencesThrough('Daily', '2026-08-29T08:00:00.000Z', '2026-08-31T07:59:59.000Z')
  assert.deepEqual(doses, ['2026-08-30T08:00:00.000Z'])
})

test('does not renew one-time or PRN medication orders', () => {
  assert.deepEqual(occurrencesThrough('Once', '2026-08-29T08:00:00.000Z', '2026-09-02T08:00:00.000Z'), [])
  assert.deepEqual(occurrencesThrough('PRN', '2026-08-29T08:00:00.000Z', '2026-09-02T08:00:00.000Z'), [])
})
