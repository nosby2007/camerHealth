const state = () => ({
  orders: [],
  medicationOrders: [],
  labOrders: [],
  imagingOrders: [],
  procedureOrders: []
})

const mutations = {
  ADD_ORDER(state, order) {
    state.orders.push({
      id: Date.now().toString(),
      ...order,
      createdAt: new Date().toISOString(),
      status: 'Pending'
    })
  },
  ADD_MEDICATION_ORDER(state, order) {
    state.medicationOrders.push({
      id: Date.now().toString(),
      ...order,
      createdAt: new Date().toISOString(),
      status: 'Pending'
    })
  },
  ADD_LAB_ORDER(state, order) {
    state.labOrders.push({
      id: Date.now().toString(),
      ...order,
      createdAt: new Date().toISOString(),
      status: 'Pending'
    })
  },
  ADD_IMAGING_ORDER(state, order) {
    state.imagingOrders.push({
      id: Date.now().toString(),
      ...order,
      createdAt: new Date().toISOString(),
      status: 'Pending'
    })
  },
  ADD_PROCEDURE_ORDER(state, order) {
    state.procedureOrders.push({
      id: Date.now().toString(),
      ...order,
      createdAt: new Date().toISOString(),
      status: 'Pending'
    })
  },
  UPDATE_ORDER_STATUS(state, { orderId, status }) {
    const order = state.orders.find(o => o.id === orderId)
    if (order) order.status = status
  }
}

const actions = {
  async createOrder({ commit }, order) {
    commit('ADD_ORDER', order)
    return order
  },
  async createMedicationOrder({ commit }, order) {
    commit('ADD_MEDICATION_ORDER', order)
    return order
  },
  async createLabOrder({ commit }, order) {
    commit('ADD_LAB_ORDER', order)
    return order
  },
  async createImagingOrder({ commit }, order) {
    commit('ADD_IMAGING_ORDER', order)
    return order
  },
  async createProcedureOrder({ commit }, order) {
    commit('ADD_PROCEDURE_ORDER', order)
    return order
  },
  async updateOrderStatus({ commit }, payload) {
    commit('UPDATE_ORDER_STATUS', payload)
    return payload
  }
}

const getters = {
  getPendingOrders: state => state.orders.filter(o => o.status === 'Pending'),
  getCompletedOrders: state => state.orders.filter(o => o.status === 'Completed')
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
