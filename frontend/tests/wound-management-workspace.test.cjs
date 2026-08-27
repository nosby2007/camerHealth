const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const workspaceSource = fs.readFileSync(
  path.join(root, 'components/clinical/patient360/wounds/Patient360WoundManagementTab.vue'),
  'utf8'
)
const dialogSource = fs.readFileSync(
  path.join(root, 'components/clinical/patient360/dialogs/WoundCareDialog.vue'),
  'utf8'
)
const clinicalWorkspaceSource = fs.readFileSync(
  path.join(root, 'components/clinical/ClinicalWorkspace.vue'),
  'utf8'
)

test('wound management exposes the required three-column workflow', () => {
  assert.match(workspaceSource, /grid-template-columns:178px minmax\(0,1fr\) 238px/)
  assert.match(workspaceSource, /Discharge Milestones/)
  assert.match(workspaceSource, /OVERVIEW/)
  assert.match(workspaceSource, /DOCUMENTATION/)
  assert.match(workspaceSource, /DISCHARGE/)
})

test('wound actions stay inside Patient 360 and open the connected dialog', () => {
  assert.match(workspaceSource, /\$emit\('open-wound'/)
  assert.match(clinicalWorkspaceSource, /@open-wound="openWoundDialog"/)
  assert.match(clinicalWorkspaceSource, /:initial-wound-id="selectedWoundForDialogId"/)
})

test('wound discharge continuity fields are persisted with assessments', () => {
  for (const field of ['followUpOwner', 'followUpDate', 'supplyPlan', 'dischargeInstructions']) {
    assert.match(dialogSource, new RegExp(`assessment\\.${field}`))
    assert.match(dialogSource, new RegExp(`${field}: ''`))
  }
  assert.match(workspaceSource, /discharge continuity instructions incomplete/)
})

test('stored wound photos are passed into readiness calculations', () => {
  assert.match(clinicalWorkspaceSource, /:photos="patientWoundPhotos"/)
  assert.match(clinicalWorkspaceSource, /nursing\/getWoundPhotos/)
  assert.match(workspaceSource, /this\.photos\.filter\(item => item\.woundId === wound\.id\)/)
})
