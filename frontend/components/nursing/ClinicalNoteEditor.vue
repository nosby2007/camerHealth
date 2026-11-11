<template>
  <v-card flat tile class="gov-card b-1 shadow-sm overflow-hidden">
    <div class="pa-4 bg-navy white--text d-flex align-center justify-space-between">
      <span class="text-caption font-weight-black text-uppercase ls-1">{{ $t('clinical360.nursing.clinical_clipboard') }}</span>
      <v-chip x-small label color="white" text-color="#003366" class="font-weight-black">
        {{ statusLabel(value.status || 'draft') }}
      </v-chip>
    </div>
    <div class="pa-5">
      <v-select
        v-model="draft.noteType"
        :items="noteTypeOptions"
        outlined
        tile
        dense
        :label="$t('clinical360.nursing.note_type')"
        class="rounded-0"
      />
      <v-text-field
        v-model="draft.title"
        outlined
        tile
        dense
        :label="$t('clinical360.nursing.title')"
        class="rounded-0"
      />
      <v-textarea
        v-model="draft.body"
        outlined
        tile
        rows="8"
        :label="$t('clinical360.nursing.clinical_note')"
        class="rounded-0"
      />
      <v-alert dense tile color="#F8FAFC" class="b-1 text-caption grey--text mb-4">
        {{ $t('clinical360.nursing.signed_note_locked') }}
      </v-alert>
      <div class="d-flex justify-end flex-wrap" style="gap:8px">
        <v-btn
          tile
          outlined
          color="#003366"
          class="font-weight-black text-caption"
          :disabled="value.status === 'signed'"
          @click="$emit('save', draft)"
        >
          <v-icon left small>
            mdi-content-save
          </v-icon>{{ $t('clinical360.nursing.save_draft') }}
        </v-btn>
        <v-btn
          tile
          depressed
          color="#003366"
          dark
          class="font-weight-black text-caption"
          :disabled="!value.id || value.status === 'signed'"
          @click="$emit('sign', value.id)"
        >
          <v-icon left small>
            mdi-draw-pen
          </v-icon>{{ $t('clinical360.nursing.sign') }}
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<script>
export default {
  props: { value: { type: Object, default: () => ({ noteType: 'nursing_note', body: '', status: 'draft' }) } },
  data () { return { noteTypes: ['nursing_note', 'wound_note', 'progress_note', 'incident_note', 'provider_notification', 'discharge_note'], draft: { ...this.value } } },
  computed: {
    noteTypeOptions () { return this.noteTypes.map(value => ({ value, text: this.$t(`clinical360.nursing.note_types.${value}`) })) }
  },
  watch: { value: { deep: true, handler (value) { this.draft = { ...value } } } },
  methods: {
    statusLabel (status) { const key = `clinical360.nursing.statuses.${status}`; return this.$te(key) ? this.$t(key) : status }
  }
}
</script>

<style scoped>
.gov-card { background:white !important; }
.bg-navy { background:#003366 !important; }
.b-1 { border:1px solid #E5E7EB; }
.shadow-sm { box-shadow:0 2px 6px rgba(0,0,0,0.05) !important; }
.ls-1 { letter-spacing:0.8px !important; }
</style>
