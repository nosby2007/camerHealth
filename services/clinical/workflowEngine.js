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
    description: order.description || 'Review and acknowledge the order.'
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
  generateTasksFromOrder,
  createSignedNote,
  amendSignedNote,
  completeDischargeWorkflow
};
