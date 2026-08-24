<template>
  <div class="care-plan-template-selector">
    <v-card>
      <v-card-title class="form-header">
        <v-icon small>mdi-file-document-outline</v-icon>
        <span>Select Care Plan Template</span>
        <v-spacer />
        <button type="button" class="close-btn" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </button>
      </v-card-title>

      <v-divider />

      <v-card-text class="form-body">
        <!-- Search & Filter -->
        <section class="form-section">
          <v-text-field
            v-model="searchQuery"
            placeholder="Search templates..."
            outlined
            dense
            prepend-icon="mdi-magnify"
          />
        </section>

        <!-- Template Categories -->
        <section class="form-section">
          <h3 class="section-title">Quick Start Templates</h3>
          <div class="template-grid">
            <div
              v-for="template in filteredTemplates"
              :key="template.id"
              class="template-card"
              @click="selectTemplate(template)"
            >
              <div class="template-icon">
                <v-icon large :color="template.color">{{ template.icon }}</v-icon>
              </div>
              <div class="template-info">
                <strong>{{ template.title }}</strong>
                <p>{{ template.description }}</p>
                <small>{{ template.goalCount }} Goals • {{ template.interventionCount }} Interventions</small>
              </div>
              <v-icon class="template-arrow">mdi-chevron-right</v-icon>
            </div>
          </div>
        </section>

        <!-- Template Preview -->
        <section v-if="selectedTemplate" class="form-section">
          <h3 class="section-title">Template Preview: {{ selectedTemplate.title }}</h3>
          <div class="preview-container">
            <div class="preview-section">
              <h4>Clinical Problems</h4>
              <ul>
                <li v-for="problem in selectedTemplate.problems" :key="problem">
                  {{ problem }}
                </li>
              </ul>
            </div>

            <div class="preview-section">
              <h4>Sample Goals</h4>
              <ul>
                <li v-for="goal in selectedTemplate.sampleGoals" :key="goal">
                  {{ goal }}
                </li>
              </ul>
            </div>

            <div class="preview-section">
              <h4>Sample Interventions</h4>
              <ul>
                <li v-for="intervention in selectedTemplate.sampleInterventions" :key="intervention">
                  {{ intervention }}
                </li>
              </ul>
            </div>
          </div>

          <div class="template-actions">
            <v-btn type="button" outlined @click="selectedTemplate = null">
              Back
            </v-btn>
            <v-btn type="button" color="primary" dark @click="useTemplate">
              Use This Template
            </v-btn>
          </div>
        </section>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  name: 'CarePlanTemplateSelector',
  props: {
    patientId: { type: String, required: true }
  },
  data() {
    return {
      searchQuery: '',
      selectedTemplate: null,
      templates: [
        {
          id: 'hypertension',
          title: 'Hypertension Management',
          description: 'Blood pressure control and monitoring plan',
          icon: 'mdi-heart-pulse',
          color: '#dc2626',
          goalCount: 3,
          interventionCount: 8,
          problems: ['Elevated blood pressure', 'Risk of stroke/MI', 'Medication management'],
          sampleGoals: [
            'Maintain BP < 130/80 mmHg',
            'Patient will verbalize understanding of HTN',
            'Patient will adhere to medication regimen'
          ],
          sampleInterventions: [
            'Monitor BP every 4 hours',
            'Administer antihypertensive medications as ordered',
            'Provide low-sodium diet',
            'Encourage relaxation techniques',
            'Assess medication side effects',
            'Teach DASH diet principles',
            'Monitor fluid intake and output',
            'Provide health education materials'
          ]
        },
        {
          id: 'diabetes',
          title: 'Diabetes Management',
          description: 'Blood glucose control and diabetic education',
          icon: 'mdi-droplet',
          color: '#2563eb',
          goalCount: 4,
          interventionCount: 10,
          problems: ['Hyperglycemia', 'Risk of complications', 'Lack of knowledge about diabetes'],
          sampleGoals: [
            'Maintain blood glucose 100-180 mg/dL',
            'Patient will demonstrate accurate glucose monitoring',
            'Patient will identify signs/symptoms of hypo/hyperglycemia',
            'Patient will follow diabetic diet'
          ],
          sampleInterventions: [
            'Monitor blood glucose before meals and bedtime',
            'Administer insulin as ordered',
            'Provide diabetic education',
            'Assess feet daily for ulcers',
            'Teach carbohydrate counting',
            'Monitor for signs of diabetic complications',
            'Encourage physical activity',
            'Provide dietary consultation',
            'Assess adherence to regimen',
            'Review medication administration'
          ]
        },
        {
          id: 'wound-care',
          title: 'Wound Care & Healing',
          description: 'Comprehensive wound assessment and treatment',
          icon: 'mdi-bandage',
          color: '#be123c',
          goalCount: 3,
          interventionCount: 9,
          problems: ['Impaired tissue integrity', 'Risk of infection', 'Altered body image'],
          sampleGoals: [
            'Wound will show signs of healing within 2 weeks',
            'Patient will remain free of infection',
            'Patient will perform wound care independently'
          ],
          sampleInterventions: [
            'Assess wound daily (size, color, drainage)',
            'Perform sterile dressing changes',
            'Monitor for signs of infection',
            'Provide wound cleansing',
            'Apply prescribed topical agents',
            'Maintain proper nutrition',
            'Educate on wound care at home',
            'Assess pain level and manage',
            'Monitor vital signs for fever'
          ]
        },
        {
          id: 'pneumonia',
          title: 'Pneumonia Recovery',
          description: 'Respiratory care and infection management',
          icon: 'mdi-lungs',
          color: '#059669',
          goalCount: 4,
          interventionCount: 10,
          problems: ['Ineffective airway clearance', 'Impaired gas exchange', 'Risk of sepsis'],
          sampleGoals: [
            'Patient will maintain clear airway',
            'SpO2 will remain > 95%',
            'Patient will demonstrate effective coughing',
            'Patient will be afebrile within 48 hours'
          ],
          sampleInterventions: [
            'Monitor respiratory rate and oxygen saturation',
            'Position patient for optimal breathing',
            'Provide oxygen therapy as ordered',
            'Encourage deep breathing and coughing',
            'Administer antibiotics as prescribed',
            'Monitor breath sounds',
            'Assess sputum characteristics',
            'Maintain fluid intake',
            'Monitor temperature',
            'Provide rest periods'
          ]
        },
        {
          id: 'heart-failure',
          title: 'Heart Failure Management',
          description: 'Cardiac monitoring and symptom management',
          icon: 'mdi-heart',
          color: '#e11d48',
          goalCount: 4,
          interventionCount: 11,
          problems: ['Decreased cardiac output', 'Fluid overload', 'Risk of complications'],
          sampleGoals: [
            'Patient will maintain adequate cardiac output',
            'Patient will not experience dyspnea',
            'Fluid intake and output will be balanced',
            'Patient will verbalize understanding of HF'
          ],
          sampleInterventions: [
            'Monitor vital signs and cardiac rhythm',
            'Assess breath sounds and jugular veins',
            'Monitor I&O and daily weight',
            'Provide oxygen therapy',
            'Administer cardiac medications',
            'Restrict sodium and fluids as ordered',
            'Position for optimal breathing',
            'Assess for edema',
            'Provide rest periods',
            'Teach low-sodium diet',
            'Educate on medication compliance'
          ]
        },
        {
          id: 'pain-management',
          title: 'Pain Management',
          description: 'Comprehensive pain assessment and treatment',
          icon: 'mdi-alert-circle',
          color: '#dc2626',
          goalCount: 3,
          interventionCount: 8,
          problems: ['Acute/chronic pain', 'Limited mobility', 'Impaired sleep'],
          sampleGoals: [
            'Patient will report pain < 3/10',
            'Patient will demonstrate pain management techniques',
            'Patient will maintain adequate rest'
          ],
          sampleInterventions: [
            'Assess pain level and characteristics regularly',
            'Administer analgesics as ordered',
            'Use non-pharmacological interventions',
            'Apply heat/cold therapy',
            'Provide positioning support',
            'Teach relaxation techniques',
            'Monitor medication effectiveness',
            'Assess for side effects'
          ]
        },
        {
          id: 'falls-prevention',
          title: 'Falls Prevention',
          description: 'Fall risk reduction and safety measures',
          icon: 'mdi-alert-octagon',
          color: '#ea580c',
          goalCount: 3,
          interventionCount: 9,
          problems: ['High fall risk', 'Altered mobility', 'Environmental hazards'],
          sampleGoals: [
            'Patient will not fall during hospitalization',
            'Patient will use safety devices correctly',
            'Patient will verbalize understanding of fall risks'
          ],
          sampleInterventions: [
            'Perform fall risk assessment',
            'Keep bed at low position',
            'Keep call bell within reach',
            'Provide non-slip footwear',
            'Remove environmental hazards',
            'Ensure adequate lighting',
            'Assist with ambulation',
            'Use bed alarm if appropriate',
            'Teach proper use of assistive devices'
          ]
        },
        {
          id: 'nutrition-support',
          title: 'Nutrition & Hydration',
          description: 'Nutritional support and feeding plan',
          icon: 'mdi-apple',
          color: '#059669',
          goalCount: 3,
          interventionCount: 8,
          problems: ['Inadequate nutrition', 'Risk of malnutrition', 'Impaired swallowing'],
          sampleGoals: [
            'Patient will maintain adequate caloric intake',
            'Patient will achieve stable weight',
            'Patient will demonstrate safe eating techniques'
          ],
          sampleInterventions: [
            'Monitor weight and nutritional status',
            'Assist with meals as needed',
            'Monitor food/fluid intake',
            'Provide high-protein, high-calorie diet',
            'Assess swallowing ability',
            'Position properly for eating',
            'Provide dietary consultation',
            'Monitor laboratory values'
          ]
        }
      ]
    }
  },
  computed: {
    filteredTemplates() {
      if (!this.searchQuery) return this.templates
      return this.templates.filter(t =>
        t.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(this.searchQuery.toLowerCase())
      )
    }
  },
  methods: {
    selectTemplate(template) {
      this.selectedTemplate = template
    },
    useTemplate() {
      this.$emit('select', this.selectedTemplate)
    }
  }
}
</script>

<style scoped>
.care-plan-template-selector {
  width: 100%;
}

.form-header {
  background: linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%);
  color: white !important;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.close-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  color: white;
  padding: 4px;
}

.form-body {
  padding: 24px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.form-section {
  margin-bottom: 24px;
}

.section-title {
  color: #0f172a;
  font-size: 13px;
  font-weight: 900;
  margin: 0 0 14px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.template-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 2px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-card:hover {
  border-color: #7c3aed;
  background: #f5f3ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.1);
}

.template-icon {
  flex: 0 0 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.template-info {
  flex: 1;
  min-width: 0;
}

.template-info strong {
  display: block;
  color: #0f172a;
  font-size: 13px;
  margin-bottom: 4px;
}

.template-info p {
  color: #64748b;
  font-size: 12px;
  margin: 4px 0;
}

.template-info small {
  color: #94a3b8;
  font-size: 11px;
}

.template-arrow {
  flex: 0 0 auto;
  color: #cbd5e1;
}

.preview-container {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.preview-section {
  background: white;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.preview-section h4 {
  color: #0f172a;
  font-size: 12px;
  font-weight: 900;
  margin: 0 0 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e2e8f0;
}

.preview-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.preview-section li {
  color: #475569;
  font-size: 11px;
  padding: 4px 0;
  padding-left: 16px;
  position: relative;
}

.preview-section li:before {
  content: '•';
  position: absolute;
  left: 6px;
  font-weight: 900;
}

.template-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}
</style>
