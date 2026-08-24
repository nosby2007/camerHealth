const state = () => ({
  carePlans: [],
  templates: [
    {
      id: 'htn',
      title: 'Hypertension Management',
      problems: ['Elevated blood pressure', 'Risk of hypertensive crisis'],
      sampleGoals: ['BP <140/90 within 24 hours', 'Patient verbalizes understanding of medications'],
      sampleInterventions: [
        'Monitor BP every 4 hours',
        'Administer antihypertensive medications as ordered',
        'Educate on DASH diet',
        'Limit sodium intake to <2000mg/day'
      ]
    },
    {
      id: 'dm',
      title: 'Diabetes Management',
      problems: ['Hyperglycemia', 'Risk of diabetic complications'],
      sampleGoals: ['Glucose 100-200 mg/dL', 'Patient demonstrates proper insulin administration'],
      sampleInterventions: [
        'Monitor blood glucose every 4-6 hours',
        'Administer insulin as ordered',
        'Provide diabetic diet education',
        'Assess for signs of hypo/hyperglycemia'
      ]
    },
    {
      id: 'wc',
      title: 'Wound Care & Healing',
      problems: ['Impaired skin integrity', 'Risk of infection', 'Delayed wound healing'],
      sampleGoals: ['Wound heals without complications', 'No signs of infection'],
      sampleInterventions: [
        'Perform daily wound assessment',
        'Change dressings per protocol',
        'Monitor for signs of infection',
        'Take wound photos for documentation',
        'Elevate affected limb'
      ]
    },
    {
      id: 'pn',
      title: 'Pneumonia Recovery',
      problems: ['Impaired gas exchange', 'Ineffective airway clearance', 'Risk of infection'],
      sampleGoals: ['SpO2 >94%', 'Clear breath sounds bilaterally', 'Productive cough with clear secretions'],
      sampleInterventions: [
        'Monitor vital signs and SpO2 continuously',
        'Elevate head of bed 30-45 degrees',
        'Encourage deep breathing and coughing',
        'Administer oxygen as ordered',
        'Obtain chest X-ray as ordered'
      ]
    },
    {
      id: 'hf',
      title: 'Heart Failure Management',
      problems: ['Decreased cardiac output', 'Fluid volume excess', 'Activity intolerance'],
      sampleGoals: ['No shortness of breath at rest', 'Stable weight', 'Patient tolerates ADLs'],
      sampleInterventions: [
        'Monitor I&O carefully',
        'Weigh patient daily',
        'Restrict fluid intake as ordered',
        'Administer diuretics and cardiac medications',
        'Position for comfort and reduce work of breathing'
      ]
    },
    {
      id: 'pm',
      title: 'Pain Management',
      problems: ['Acute/chronic pain', 'Risk of functional decline'],
      sampleGoals: ['Pain reduced to 3/10 or less', 'Able to participate in care activities'],
      sampleInterventions: [
        'Assess pain every 2-4 hours',
        'Administer analgesics per protocol',
        'Use non-pharmacological measures',
        'Educate on pain management strategies',
        'Document pain response'
      ]
    },
    {
      id: 'fp',
      title: 'Falls Prevention',
      problems: ['High fall risk', 'Risk of injury'],
      sampleGoals: ['No falls during hospitalization', 'Patient uses assistive devices correctly'],
      sampleInterventions: [
        'Implement fall precautions',
        'Keep bed in low position',
        'Assist with ambulation',
        'Remove environmental hazards',
        'Use bed alarm if needed'
      ]
    },
    {
      id: 'nh',
      title: 'Nutrition & Hydration',
      problems: ['Inadequate nutritional intake', 'Risk of malnutrition', 'Dehydration'],
      sampleGoals: ['Patient consumes 75% of meals', 'Maintains current weight', 'Adequate fluid intake'],
      sampleInterventions: [
        'Monitor intake and output',
        'Provide preferred foods/fluids',
        'Assist with feeding as needed',
        'Consult nutritionist',
        'Educate on nutrition requirements'
      ]
    }
  ]
})

const mutations = {
  ADD_CARE_PLAN(state, plan) {
    state.carePlans.push({
      id: Date.now().toString(),
      ...plan,
      createdAt: new Date().toISOString()
    })
  },
  UPDATE_CARE_PLAN(state, plan) {
    const idx = state.carePlans.findIndex(p => p.id === plan.id)
    if (idx >= 0) {
      state.carePlans[idx] = { ...state.carePlans[idx], ...plan }
    }
  }
}

const actions = {
  async createCarePlan({ commit }, plan) {
    commit('ADD_CARE_PLAN', plan)
    return plan
  },
  async updateCarePlan({ commit }, plan) {
    commit('UPDATE_CARE_PLAN', plan)
    return plan
  }
}

const getters = {
  getTemplate: state => id => state.templates.find(t => t.id === id),
  getCarePlans: state => state.carePlans,
  getActiveCarePlans: state => state.carePlans.filter(p => p.status === 'Active')
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
