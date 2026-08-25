const assert = require('assert')
const {
  calculateWoundSurfaceArea,
  calculateWoundVolume,
  hasWoundAreaIncreased,
  taskFromProviderOrder
} = require('../util/nursing-workflow.cjs')

assert.strictEqual(calculateWoundSurfaceArea(3.2, 2), 6.4)
assert.strictEqual(calculateWoundSurfaceArea(-1, 2), 0)
assert.strictEqual(calculateWoundVolume(3, 2, 0.5), 3)
assert.strictEqual(calculateWoundVolume(3, 2, 0), null)
assert.strictEqual(hasWoundAreaIncreased({ surfaceArea: 4 }, { surfaceArea: 5 }), true)
assert.strictEqual(hasWoundAreaIncreased({ surfaceArea: 5 }, { surfaceArea: 4 }), false)

const task = taskFromProviderOrder({
  id: 'order-1',
  facility_id: 'facility-1',
  patient_id: 'patient-1',
  assigned_role: 'NURSE',
  order_type: 'wound_dressing',
  title: 'Change dressing',
  priority: 'urgent',
  instructions: 'Sterile dressing every shift'
}, 'nurse-1')

assert.deepStrictEqual(task, {
  patient_id: 'patient-1',
  facility_id: 'facility-1',
  linked_order_id: 'order-1',
  linked_order_type: 'wound_dressing',
  title: 'Change dressing',
  priority: 'urgent',
  reason: 'Sterile dressing every shift',
  status: 'pending',
  assigned_nurse_id: 'nurse-1',
  due_at: null
})

assert.strictEqual(taskFromProviderOrder({ assigned_role: 'LAB' }), null)
console.log('nursing-workflow tests passed')
