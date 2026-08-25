const test = require('node:test')
const assert = require('node:assert/strict')
const {
  anatomicalSide,
  detectAvatarRegion,
  isPointOnBody,
  isResolvedAvatarStatus,
  statusOptionsForAvatarType
} = require('../util/avatar-workflow.cjs')

test('uses patient laterality rather than screen laterality on the front view', () => {
  assert.equal(anatomicalSide(30, 'front'), 'right')
  assert.equal(anatomicalSide(70, 'front'), 'left')
  assert.equal(anatomicalSide(30, 'back'), 'left')
})

test('detects extremities before torso regions', () => {
  assert.equal(detectAvatarRegion({ x: 25, y: 42, view: 'front', anatomy: 'male' }), 'right arm / hand')
  assert.equal(detectAvatarRegion({ x: 75, y: 42, view: 'back', anatomy: 'female' }), 'right arm / hand')
})

test('detects sex-specific and posterior regions', () => {
  assert.equal(detectAvatarRegion({ x: 42, y: 30, view: 'front', anatomy: 'female' }), 'right breast / chest')
  assert.equal(detectAvatarRegion({ x: 50, y: 70, view: 'back', anatomy: 'female' }), 'sacrum')
})

test('rejects clicks outside the anatomical silhouette', () => {
  assert.equal(isPointOnBody(5, 10), false)
  assert.equal(detectAvatarRegion({ x: 5, y: 10, view: 'front' }), '')
})

test('provides device-specific lifecycle statuses', () => {
  assert.ok(statusOptionsForAvatarType('iv').includes('Infiltrated'))
  assert.ok(statusOptionsForAvatarType('trach').includes('Needs suction'))
  assert.equal(isResolvedAvatarStatus('Removed'), true)
  assert.equal(isResolvedAvatarStatus('Patent'), false)
})
