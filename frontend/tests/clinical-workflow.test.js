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
  assert.ok(tasks.every((task) => task.automation_source === 'clinical-order'));
  assert.ok(tasks.every((task) => task.series_id === 'order-1'));
});

test('calculates the next occurrence for common clinical frequencies', () => {
  const anchor = '2026-08-29T08:00:00.000Z';
  assert.equal(workflowEngine.nextOccurrenceAt('Q4H', anchor), '2026-08-29T12:00:00.000Z');
  assert.equal(workflowEngine.nextOccurrenceAt('Daily', anchor), '2026-08-30T08:00:00.000Z');
  assert.equal(workflowEngine.nextOccurrenceAt('Once', anchor), null);
});

test('keeps only the current eMAR day and selects the newest matching slot', () => {
  const atLocalTime = (day, seconds = 0) => new Date(2026, 7, day, 8, 0, seconds).toISOString();
  const rows = [
    { id: 'yesterday', medicationId: 'med-1', scheduledFor: atLocalTime(29), status: 'Given' },
    { id: 'today-old', medicationId: 'med-1', scheduledFor: atLocalTime(30), status: 'Due' },
    { id: 'today-new', medicationId: 'med-1', scheduledFor: atLocalTime(30, 1), status: 'Given' }
  ];
  const today = workflowEngine.administrationsForLocalDay(rows, new Date(2026, 7, 30, 12));
  assert.equal(today.some((row) => row.id === 'yesterday'), false);
  assert.equal(workflowEngine.latestAdministrationForSlot(today, 'med-1', '0800').id, 'today-new');
});

test('work-list day filtering identifies stale task occurrences', () => {
  const today = workflowEngine.localDayKey(new Date(2026, 7, 31, 12));
  assert.equal(workflowEngine.localDayKey(new Date(2026, 7, 30, 12)) < today, true);
  assert.equal(workflowEngine.localDayKey(new Date(2026, 7, 31, 12)) >= today, true);
});

test('requires and links the next task when a work-list task is completed', () => {
  const next = workflowEngine.nextTaskFromCompletion({
    id: 'task-1', patientId: 'patient-1', title: 'Wound care', assignedToRole: 'NURSE', frequency: 'Daily', dueAt: '2026-08-29T08:00:00.000Z'
  }, { performedAt: '2026-08-29T08:15:00.000Z', nextDueAt: '2026-08-30T08:00:00.000Z' });
  assert.equal(next.parentTaskId, 'task-1');
  assert.equal(next.seriesId, 'task-1');
  assert.equal(next.occurrenceNumber, 2);
  assert.equal(next.dueAt, '2026-08-30T08:00:00.000Z');
});

test('rejects completion without a future task date for one-time work', () => {
  assert.throws(() => workflowEngine.nextTaskFromCompletion({
    id: 'task-2', patientId: 'patient-1', title: 'One-time assessment', frequency: 'Once'
  }, { performedAt: '2026-08-29T08:15:00.000Z' }), /next due date/i);
});

test('activates reminders at the configured lead time', () => {
  const task = { status: 'pending', dueAt: '2026-08-29T10:00:00.000Z', reminderMinutesBefore: 30 };
  assert.equal(workflowEngine.reminderState(task, '2026-08-29T09:20:00.000Z'), 'scheduled');
  assert.equal(workflowEngine.reminderState(task, '2026-08-29T09:35:00.000Z'), 'reminder');
  assert.equal(workflowEngine.reminderState(task, '2026-08-29T10:05:00.000Z'), 'due');
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
