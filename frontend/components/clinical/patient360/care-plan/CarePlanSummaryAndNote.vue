<template>
  <div class="summary-and-note">
    <div class="content-grid">
      <!-- Left: Summary Items -->
      <div class="summary-panel">
        <h3>Care Plan Documentation Summary</h3>

        <div class="group-controls">
          <v-radio-group v-model="groupBy" row dense>
            <v-radio label="By Problem" value="problem" />
            <v-radio label="By Outcome" value="outcome" />
          </v-radio-group>
        </div>

        <div class="documented-items">
          <div v-for="item in documentedItems" :key="item.id" class="item">
            <div class="item-header">
              <span class="item-label">
                <v-icon x-small>mdi-checkbox-marked</v-icon>
                {{ item.label }}
              </span>
              <v-btn x-small icon @click="addItemToNote(item)">
                <v-icon x-small>mdi-plus</v-icon>
              </v-btn>
            </div>
            <div class="item-meta">
              {{ formatDate(item.lastDocumentedAt) }} · {{ item.lastDocumentedBy }}
            </div>
          </div>
        </div>

        <v-btn x-small text color="#0f766e" @click="addAllToNote">
          + Add All
        </v-btn>
      </div>

      <!-- Right: Note Editor -->
      <div class="note-panel">
        <h3>Plan of Care Note</h3>

        <div class="note-controls">
          <v-text-field v-model="noteDate" label="Date of Service" type="date" dense outlined />
          <v-text-field v-model="noteTime" label="Time" type="time" dense outlined />
          <span class="note-type">Type: <strong>Plan of Care</strong></span>
        </div>

        <textarea
          v-model="noteBody"
          class="note-editor"
          placeholder="Enter plan of care note..."
        />

        <div class="note-actions">
          <v-btn x-small text @click="noteBody = ''">Clear</v-btn>
          <v-spacer />
          <v-btn x-small text @click="$emit('cancel')">Cancel</v-btn>
          <v-btn x-small depressed color="#0f766e" dark :loading="saving" @click="pend">
            Pend
          </v-btn>
          <v-btn x-small depressed color="#16a34a" dark :loading="saving" @click="sign">
            <v-icon x-small left>mdi-draw-pen</v-icon>Sign
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CarePlanSummaryAndNote',
  props: {
    patientId: { type: String, required: true },
    encounterId: { type: String, required: true },
    admissionId: { type: String, default: '' },
    role: { type: String, default: '' }
  },
  data() {
    return {
      groupBy: 'problem',
      noteBody: '',
      noteDate: new Date().toISOString().split('T')[0],
      noteTime: new Date().toTimeString().slice(0, 5),
      saving: false,
      selectedItems: []
    }
  },
  computed: {
    documentedItems() {
      const goals = this.$store.state.carePlan?.carePlanGoals || []
      return goals
        .filter(g => g.patientId === this.patientId && g.lastProgressStatus)
        .sort((a, b) => new Date(b.lastDocumentedAt) - new Date(a.lastDocumentedAt))
    }
  },
  methods: {
    addItemToNote(item) {
      const line = `Goal: ${item.label}\nStatus: ${item.lastProgressStatus}\n`
      this.noteBody += line
      if (!this.selectedItems.includes(item.id)) {
        this.selectedItems.push(item.id)
      }
      this.$toast?.success('Item added to note')
    },
    addAllToNote() {
      this.documentedItems.forEach(item => {
        if (!this.selectedItems.includes(item.id)) {
          const line = `Goal: ${item.label}\nStatus: ${item.lastProgressStatus}\n`
          this.noteBody += line
          this.selectedItems.push(item.id)
        }
      })
      this.$toast?.success('All items added to note')
    },
    async pend() {
      if (!this.noteBody.trim()) {
        this.$toast?.error('Note body is required')
        return
      }

      this.saving = true
      try {
        await this.$store.dispatch('carePlan/createOrUpdateCarePlanNoteDraft', {
          patientId: this.patientId,
          encounterId: this.encounterId,
          admissionId: this.admissionId,
          includedGoalIds: this.selectedItems,
          body: this.noteBody
        })
        this.$toast?.success('Note pended')
        this.noteBody = ''
        this.selectedItems = []
      } finally {
        this.saving = false
      }
    },
    async sign() {
      if (!this.noteBody.trim()) {
        this.$toast?.error('Note body is required')
        return
      }

      this.saving = true
      try {
        await this.$store.dispatch('carePlan/signCarePlanNote', {
          patientId: this.patientId,
          encounterId: this.encounterId,
          admissionId: this.admissionId,
          body: this.noteBody,
          linkedCarePlanProgressEntryIds: this.selectedItems
        })
        this.$toast?.success('Plan of Care note signed')
        this.noteBody = ''
        this.selectedItems = []
      } catch (err) {
        this.$toast?.error('Failed to sign note')
      } finally {
        this.saving = false
      }
    },
    formatDate(date) {
      if (!date) return '-'
      const d = new Date(date)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }
}
</script>

<style scoped>
.summary-and-note {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

.content-grid {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 16px;
  flex: 1;
}

.summary-panel,
.note-panel {
  display: flex;
  flex-direction: column;
  border: 1px solid #d7e0df;
  background: #fff;
  padding: 12px;
}

h3 {
  margin: 0 0 12px 0;
  color: #134e4a;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

.group-controls {
  margin-bottom: 12px;
}

.documented-items {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 12px;
}

.item {
  margin-bottom: 8px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.item-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #134e4a;
  font-weight: 600;
}

.item-meta {
  font-size: 10px;
  color: #64748b;
  margin-left: 20px;
}

.note-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.note-type {
  font-size: 12px;
  color: #334155;
}

.note-editor {
  flex: 1;
  font-family: monospace;
  font-size: 11px;
  padding: 8px;
  border: 1px solid #d7e0df;
  border-radius: 3px;
  resize: none;
  margin-bottom: 12px;
  min-height: 150px;
}

.note-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.note-actions .v-spacer {
  flex: 1;
}
</style>
