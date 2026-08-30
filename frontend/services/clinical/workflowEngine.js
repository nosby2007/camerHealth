const ROLE_CAPABILITIES = {
  RECEPTION: ['create_demographics', 'update_demographics', 'create_appointment', 'upload_document', 'create_admission', 'assign_room'],
  NURSE: ['document_assessment', 'document_flowsheet', 'document_wound', 'complete_task', 'document_vitals', 'document_io'],
  DOCTOR: ['create_orders', 'sign_provider_note', 'manage_diagnosis', 'discharge_patient'],
  NP: ['create_orders', 'sign_provider_note', 'manage_diagnosis', 'discharge_patient'],
  ADMIN: ['manage_users', 'manage_templates', 'manage_workflows', 'review_audit_logs', 'manage_facilities'],
  BILLING: ['view_payer', 'view_insurance', 'view_billing_documents', 'manage_charges'],
  CASE_MANAGER: ['review_discharge', 'coordinate_care', 'manage_follow_up']
};

function canAccessRole(role, action) {
  const normalizedRole = String(role || '').toUpperCase();
  const capabilities = ROLE_CAPABILITIES[normalizedRole] || [];
  return capabilities.includes(action);
}

function calculateWoundSurface(length, width, depth) {
  const numericLength = Number(length);
  const numericWidth = Number(width);
  const numericDepth = depth === undefined || depth === null ? null : Number(depth);

  if ([numericLength, numericWidth, numericDepth].some((value) => value !== null && Number.isNaN(value))) {
    return null;
  }

  return Number((numericLength * numericWidth).toFixed(2));
}

const FREQUENCY_HOURS = {
  'each shift': 8,
  daily: 24,
  bid: 12,
  tid: 8,
  qid: 6,
  q4h: 4,
  'every 4 hours': 4,
  q6h: 6,
  q8h: 8,
  'every 8 hours': 8,
  q12h: 12
};

function nextOccurrenceAt(frequency, anchor) {
  const normalized = String(frequency || '').trim().toLowerCase();
  const base = new Date(anchor || Date.now());
  if (Number.isNaN(base.getTime()) || !normalized || ['once', 'prn', 'as needed'].includes(normalized)) return null;

  if (normalized === 'weekly') {
    base.setDate(base.getDate() + 7);
    return base.toISOString();
  }

  const hours = FREQUENCY_HOURS[normalized];
  if (!hours) return null;
  return new Date(base.getTime() + hours * 60 * 60 * 1000).toISOString();
}

function reminderState(task, now = new Date()) {
  if (!task || /done|complete|cancel|discontinued/i.test(String(task.status || ''))) return 'closed';
  const due = new Date(task.dueAt || task.due_at || '');
  const current = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(due.getTime()) || Number.isNaN(current.getTime())) return 'unscheduled';
  const minutes = (due.getTime() - current.getTime()) / 60000;
  if (minutes <= 0) return 'due';
  if (minutes <= Number(task.reminderMinutesBefore ?? task.reminder_minutes_before ?? 30)) return 'reminder';
  return 'scheduled';
}

function nextTaskFromCompletion(task, completion = {}) {
  const completedAt = completion.performedAt || completion.completedAt || new Date().toISOString();
  const priorDue = new Date(task.dueAt || '');
  const completedDate = new Date(completedAt);
  const recurrenceAnchor = !Number.isNaN(priorDue.getTime()) && priorDue > completedDate ? priorDue : completedAt;
  const calculatedDueAt = nextOccurrenceAt(task.frequency, recurrenceAnchor);
  const dueAt = completion.nextDueAt || calculatedDueAt;
  if (!dueAt) throw new Error('A next due date is required to complete this task.');
  const parsedDueAt = new Date(dueAt);
  const parsedCompletedAt = new Date(completedAt);
  if (Number.isNaN(parsedDueAt.getTime()) || parsedDueAt <= parsedCompletedAt) {
    throw new Error('The next task must be scheduled after completion.');
  }

  return {
    patientId: task.patientId,
    encounterId: task.encounterId || null,
    relatedType: task.relatedType || 'care-task',
    relatedId: task.relatedId || null,
    title: completion.nextTitle || task.title || task.label || 'Care task follow-up',
    instructions: completion.nextInstructions || task.instructions || '',
    assignedToRole: completion.nextAssignedToRole || task.assignedToRole || task.assignedRole || 'CARE TEAM',
    priority: completion.nextPriority || task.priority || 'Routine',
    frequency: completion.nextFrequency || task.frequency || 'Once',
    dueAt: parsedDueAt.toISOString(),
    reminderMinutesBefore: Number(completion.reminderMinutesBefore ?? task.reminderMinutesBefore ?? 30),
    seriesId: task.seriesId || task.id,
    parentTaskId: task.id,
    occurrenceNumber: Number(task.occurrenceNumber || 1) + 1,
    automationSource: task.automationSource || 'provider-completion',
    actionReason: `Next occurrence scheduled after ${task.id || 'care task'} completion`
  };
}

function generateTasksFromOrder(order, patient = {}, encounter = {}) {
  const base = {
    patient_id: patient.id || 'patient-demo',
    encounter_id: encounter.id || 'encounter-demo',
    assigned_role: order.assigned_role || 'NURSE',
    assigned_user_id: order.assigned_user_id || null,
    source_type: 'order',
    source_id: order.id || 'order-demo',
    priority: order.priority || 'routine',
    due_at: order.due_at || new Date().toISOString(),
    status: 'pending',
    description: order.description || 'Review and acknowledge the order.',
    frequency: order.frequency || 'Once',
    reminder_minutes_before: Number(order.reminder_minutes_before ?? 30),
    series_id: order.series_id || order.id || 'order-demo',
    automation_source: 'clinical-order'
  };

  const generatedTasks = [];

  if (order.type === 'medication' || order.category === 'medication') {
    generatedTasks.push({
      ...base,
      title: 'Medication review',
      description: `Review ${order.medication || 'medication'} order for ${patient.name || 'the patient'}.`
    });
  }

  if (order.type === 'wound' || order.category === 'wound') {
    generatedTasks.push({
      ...base,
      title: 'Wound follow-up',
      description: `Assess wound care instructions for ${patient.name || 'the patient'}.`
    });
  }

  generatedTasks.push({
    ...base,
    title: 'Clinical acknowledgement',
    description: `Acknowledge ${order.description || 'the order'} and document next steps.`
  });

  return generatedTasks;
}

function createSignedNote(note) {
  return {
    ...note,
    status: 'signed',
    signed_at: new Date().toISOString(),
    version: note.version || 1
  };
}

function amendSignedNote(note, amendment, amendedBy) {
  if (!note || note.status !== 'signed') {
    return {
      ...note,
      status: 'draft',
      amended_by: amendedBy || null,
      amendment: amendment || 'No amendment provided.'
    };
  }

  return {
    id: `${note.id || 'note'}-v2`,
    ...note,
    amended_from_id: note.id,
    status: 'draft',
    version: (note.version || 1) + 1,
    content: `${note.content || ''}\n\nAmendment: ${amendment}`,
    amended_by: amendedBy || null,
    amended_at: new Date().toISOString()
  };
}

function completeDischargeWorkflow(plan) {
  const requiredSteps = ['discharge_order', 'medication_reconciliation', 'discharge_summary', 'follow_up'];
  const completedSteps = requiredSteps.filter((step) => Boolean(plan?.steps?.[step]));

  return {
    completed: completedSteps.length === requiredSteps.length,
    completed_steps: completedSteps,
    pending_steps: requiredSteps.filter((step) => !completedSteps.includes(step)),
    status: completedSteps.length === requiredSteps.length ? 'completed' : 'in_progress'
  };
}

module.exports = {
  ROLE_CAPABILITIES,
  canAccessRole,
  calculateWoundSurface,
  nextOccurrenceAt,
  reminderState,
  nextTaskFromCompletion,
  generateTasksFromOrder,
  createSignedNote,
  amendSignedNote,
  completeDischargeWorkflow
};
