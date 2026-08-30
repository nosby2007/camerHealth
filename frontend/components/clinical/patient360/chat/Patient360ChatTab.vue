<template>
  <section class="chat-shell">
    <header>
      <div><small>CARE TEAM</small><h2>Internal chat</h2><p>Async discussion for {{ patient.displayName || patient.name || 'this patient' }} — visible to the whole clinical team, not part of the legal chart.</p></div>
    </header>

    <div ref="feed" class="chat-feed">
      <div v-if="!messages.length" class="empty"><v-icon size="32" color="#94a3b8">mdi-message-text-outline</v-icon><span>No messages yet — start the discussion.</span></div>
      <article v-for="msg in messages" :key="msg.id" class="bubble" :class="{ mine: isMine(msg) }">
        <div class="meta"><strong>{{ authorName(msg) }}</strong><span>{{ formatTime(msg.createdAt) }}</span></div>
        <p>{{ msg.body }}</p>
      </article>
    </div>

    <form v-if="!readOnly" class="composer" @submit.prevent="send">
      <v-textarea v-model="draft" rows="2" auto-grow dense hide-details placeholder="Message the care team about this patient..." />
      <v-btn depressed color="#0f766e" dark :disabled="!draft.trim()" @click="send"><v-icon small left>mdi-send</v-icon>Send</v-btn>
    </form>
    <div v-else class="readonly-note">This patient's record is read-only — chat is view-only.</div>
  </section>
</template>

<script>
export default {
  name: 'Patient360ChatTab',
  props: {
    patient: { type: Object, default: () => ({}) },
    messages: { type: Array, default: () => [] },
    currentFullName: { type: String, default: '' },
    readOnly: { type: Boolean, default: false }
  },
  data() {
    return { draft: '' }
  },
  watch: {
    messages() {
      this.$nextTick(this.scrollToBottom)
    }
  },
  mounted() {
    this.scrollToBottom()
  },
  methods: {
    isMine(msg) {
      return this.authorName(msg) === this.currentFullName
    },
    authorName(msg) {
      return (msg.author && msg.author.fullName) || 'Care team'
    },
    formatTime(iso) {
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return ''
      return d.toLocaleString()
    },
    scrollToBottom() {
      const el = this.$refs.feed
      if (el) el.scrollTop = el.scrollHeight
    },
    send() {
      const body = this.draft.trim()
      if (!body) return
      this.$emit('send', body)
      this.draft = ''
    }
  }
}
</script>

<style scoped>
.chat-shell { padding: 14px; background: #f8fbfb; min-height: 100%; display: flex; flex-direction: column; gap: 10px; }
.chat-shell > header { border-bottom: 2px solid #0f766e; padding-bottom: 10px; }
.chat-shell small { font-weight: 900; color: #64748b; }
.chat-shell h2 { font-size: 18px; margin: 2px 0; }
.chat-shell p { margin: 0; color: #475569; font-size: 12px; }
.chat-feed { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; min-height: 200px; max-height: 480px; padding: 4px; }
.chat-feed .empty { display: flex; flex-direction: column; align-items: center; gap: 6px; color: #94a3b8; padding: 30px 0; font-size: 12px; }
.bubble { align-self: flex-start; max-width: 70%; background: white; border: 1px solid #d7e0df; border-radius: 4px; padding: 8px 10px; }
.bubble.mine { align-self: flex-end; background: #ecfdf5; border-color: #0f766e; }
.bubble .meta { display: flex; justify-content: space-between; gap: 12px; font-size: 10px; font-weight: 900; color: #64748b; margin-bottom: 3px; }
.bubble p { margin: 0; font-size: 13px; color: #0f172a; white-space: pre-wrap; overflow-wrap: anywhere; }
.composer { display: flex; gap: 8px; align-items: flex-end; border-top: 1px solid #cbd5e1; padding-top: 10px; }
.composer .v-textarea { flex: 1; }
.readonly-note { border-top: 1px solid #cbd5e1; padding-top: 10px; color: #64748b; font-size: 12px; }
</style>
