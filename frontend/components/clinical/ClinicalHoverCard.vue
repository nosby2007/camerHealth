<template>
  <v-menu
    v-model="open"
    open-on-hover
    open-delay="220"
    close-delay="180"
    offset-x
    max-width="360"
    content-class="clinical-hover-card-menu"
  >
    <template #activator="{ on, attrs }">
      <span class="clinical-hover-card-activator" v-bind="attrs" tabindex="0" v-on="on">
        <slot name="activator">{{ title }}</slot>
      </span>
    </template>
    <v-card class="clinical-hover-card" role="dialog" :aria-label="title">
      <v-card-title class="clinical-hover-card-title">
        <div>
          <span v-if="eyebrow">{{ eyebrow }}</span>
          <strong>{{ title }}</strong>
          <small v-if="subtitle">{{ subtitle }}</small>
        </div>
        <v-btn icon x-small aria-label="Close" @click="open = false"><v-icon x-small>mdi-close</v-icon></v-btn>
      </v-card-title>
      <v-card-text class="clinical-hover-card-body">
        <slot>
          <dl v-if="details.length">
            <div v-for="detail in details" :key="detail.label">
              <dt>{{ detail.label }}</dt>
              <dd>{{ detail.value || '—' }}</dd>
            </div>
          </dl>
        </slot>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script>
export default {
  name: 'ClinicalHoverCard',
  props: {
    title: { type: String, default: '' },
    eyebrow: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    details: { type: Array, default: () => [] }
  },
  data: () => ({ open: false })
}
</script>

<style scoped>
.clinical-hover-card-activator { display: inline-flex; max-width: 100%; }
.clinical-hover-card { border: 1px solid #94a3b8; box-shadow: 0 10px 28px rgba(15, 23, 42, .22); }
.clinical-hover-card-title { display: flex; justify-content: space-between; gap: 12px; padding: 12px 14px 8px; background: #edf8f6; color: #134e4a; }
.clinical-hover-card-title span, .clinical-hover-card-title strong, .clinical-hover-card-title small { display: block; }
.clinical-hover-card-title span { font-size: 9px; font-weight: 900; letter-spacing: .08em; }
.clinical-hover-card-title strong { margin-top: 2px; font-size: 15px; }
.clinical-hover-card-title small { margin-top: 3px; color: #52716e; font-size: 10px; }
.clinical-hover-card-body { padding: 8px 14px 12px; }
.clinical-hover-card-body dl { margin: 0; }
.clinical-hover-card-body dl div { padding: 6px 0; border-bottom: 1px solid #e2e8f0; }
.clinical-hover-card-body dl div:last-child { border-bottom: 0; }
.clinical-hover-card-body dt { color: #64748b; font-size: 9px; font-weight: 900; text-transform: uppercase; }
.clinical-hover-card-body dd { margin: 2px 0 0; color: #1e293b; font-size: 11px; font-weight: 700; }
</style>
