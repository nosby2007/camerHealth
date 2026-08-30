function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function calculateWoundSurfaceArea(lengthCm, widthCm) {
  const length = toNumber(lengthCm)
  const width = toNumber(widthCm)
  if (length <= 0 || width <= 0) return 0
  return Number((length * width).toFixed(2))
}

function calculateWoundVolume(lengthCm, widthCm, depthCm) {
  const depth = toNumber(depthCm)
  if (depth <= 0) return null
  return Number((calculateWoundSurfaceArea(lengthCm, widthCm) * depth).toFixed(2))
}

function hasWoundAreaIncreased(previousAssessment, nextAssessment) {
  if (!previousAssessment || !nextAssessment) return false
  const previousArea = toNumber(previousAssessment.surface_area || previousAssessment.surfaceArea)
  const nextArea = toNumber(nextAssessment.surface_area || nextAssessment.surfaceArea)
  return nextArea > previousArea
}

function taskFromProviderOrder(order, assignedNurse) {
  if (!order || order.assigned_role !== 'NURSE') return null
  return {
    patient_id: order.patient_id,
    facility_id: order.facility_id,
    linked_order_id: order.id,
    linked_order_type: order.order_type,
    title: order.title || order.order_type || 'Provider order',
    priority: order.priority || 'routine',
    reason: order.reason || order.instructions || '',
    status: 'pending',
    assigned_nurse_id: assignedNurse || order.assigned_staff_id || null,
    due_at: order.due_at || null
  }
}

// Bridges taskFromProviderOrder's snake_case shape (matching the backend's
// column naming) to the camelCase payload store/nursing.js's createTask
// action forwards to taskApi.create.
function mapSnakeTask(task) {
  if (!task) return task
  return {
    patientId: task.patient_id,
    facilityId: task.facility_id,
    linkedOrderId: task.linked_order_id,
    linkedOrderType: task.linked_order_type,
    title: task.title,
    priority: task.priority,
    reason: task.reason,
    status: task.status,
    assignedNurseId: task.assigned_nurse_id,
    dueAt: task.due_at
  }
}

function makeId(prefix = 'ID') {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 9)
  return `${prefix}-${timestamp}-${random}`
}

function withBase(rootState, data, prefix) {
  return {
    id: data.id || makeId(prefix),
    facilityId: rootState.auth?.facilityId || '',
    institution: rootState.auth?.institution || '',
    ...data
  }
}

module.exports = {
  calculateWoundSurfaceArea,
  calculateWoundVolume,
  hasWoundAreaIncreased,
  taskFromProviderOrder,
  mapSnakeTask,
  makeId,
  withBase
}
