const test = require('node:test');
const assert = require('node:assert/strict');
const workflowEngine = require('../services/clinical/workflowEngine');

test('calculates wound surface area from length and width', () => {
  assert.equal(workflowEngine.calculateWoundSurface(6, 2), 12);
  assert.equal(workflowEngine.calculateWoundSurface(0, 4), 0);
});

test('generates tasks for medication and wound orders', () => {
  const tasks = workflowEngine.generateTasksFromOrder({
    id: 'order-1',
    type: 'wound',
    description: 'Dressing change',
    assigned_role: 'NURSE'
  }, { id: 'patient-1', name: 'Amina' }, { id: 'encounter-1' });

  assert.equal(tasks.length >= 2, true);
  assert.ok(tasks.some((task) => task.title === 'Wound follow-up'));
  assert.ok(tasks.some((task) => task.title === 'Clinical acknowledgement'));
});

test('enforces role-based permissions', () => {
  assert.equal(workflowEngine.canAccessRole('NURSE', 'document_assessment'), true);
  assert.equal(workflowEngine.canAccessRole('RECEPTION', 'create_admission'), true);
  assert.equal(workflowEngine.canAccessRole('BILLING', 'create_orders'), false);
  assert.equal(workflowEngine.canAccessRole('DOCTOR', 'sign_provider_note'), true);
});

test('creates a signed note amendment without mutating the original note', () => {
  const originalNote = { id: 'note-1', content: 'Initial note', status: 'signed', version: 1 };
  const amended = workflowEngine.amendSignedNote(originalNote, 'Revised wound assessment', 'nurse-1');

  assert.equal(amended.status, 'draft');
  assert.equal(amended.amended_from_id, 'note-1');
  assert.equal(amended.version, 2);
  assert.equal(originalNote.status, 'signed');
});

test('marks discharge workflow complete when required steps are present', () => {
  const result = workflowEngine.completeDischargeWorkflow({
    steps: {
      discharge_order: true,
      medication_reconciliation: true,
      discharge_summary: true,
      follow_up: true
    }
  });

  assert.equal(result.completed, true);
  assert.equal(result.status, 'completed');
});
