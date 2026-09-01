<template>
  <div class="education-card">
    <div class="card-header">
      <h4>{{ point.label }}</h4>
      <v-menu offset-y>
        <template #activator="{ on, attrs }">
          <v-btn icon x-small v-bind="attrs" v-on="on">
            <v-icon x-small>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list dense>
          <v-list-item @click="$emit('document')">
            <v-list-item-title>{{ $t('clinical360.education.point_card.document') }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="$emit('add-material')">
            <v-list-item-title>{{ $t('clinical360.education.point_card.add_material') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <div v-if="!hideDescription && point.description" class="description">
      {{ point.description }}
    </div>

    <div v-if="point.topic" class="topic">
      <strong>{{ $t('clinical360.education.point_card.topic') }}</strong> {{ point.topic }}
    </div>

    <div v-if="latestDoc" class="latest-doc">
      <span class="label">{{ $t('clinical360.education.point_card.latest') }}</span>
      <span class="learners">{{ latestDoc.learners?.join(', ') }}</span>
      <span class="status" :class="latestDoc.status">{{ latestDoc.status }}</span>
    </div>

    <div v-else class="no-doc">
      {{ $t('clinical360.education.point_card.not_yet_documented') }}
    </div>

    <div class="card-actions">
      <v-btn x-small text color="#0f766e" @click="$emit('document')">
        <v-icon x-small left>mdi-pencil</v-icon>{{ $t('clinical360.education.point_card.document') }}
      </v-btn>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EducationPointCard',
  props: {
    point: { type: Object, required: true },
    hideDescription: { type: Boolean, default: false }
  },
  computed: {
    latestDoc() {
      return this.$store.getters['education/latestDocumentationByPoint']?.(this.point.id)
    }
  }
}
</script>

<style scoped>
.education-card {
  border: 1px solid #d7e0df;
  background: #fff;
  padding: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.card-header h4 {
  margin: 0;
  color: #134e4a;
  font-size: 12px;
  font-weight: 600;
}

.description {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 6px;
  line-height: 1.3;
}

.topic {
  font-size: 11px;
  color: #334155;
  margin-bottom: 6px;
}

.latest-doc,
.no-doc {
  font-size: 10px;
  margin-bottom: 8px;
  padding: 6px;
  background: #f8fafc;
  border-radius: 3px;
}

.latest-doc {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #334155;
}

.latest-doc .label {
  font-weight: 600;
  color: #134e4a;
}

.latest-doc .learners {
  flex: 1;
}

.latest-doc .status {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  padding: 2px 4px;
  border-radius: 2px;
  background: #dbeafe;
  color: #075985;
}

.no-doc {
  color: #94a3b8;
  text-align: center;
}

.card-actions {
  display: flex;
  gap: 4px;
}
</style>
