<template>
  <section class="worklist-workspace">
    <header class="module-header"><div><span>{{ $t('clinical360.work_list.tab.care_delivery') }}</span><h2>{{ $t('clinical360.work_list.tab.work_list') }}</h2><p>{{ $t('clinical360.work_list.tab.header_subtitle') }}</p></div><v-btn v-if="canCreateTask && !readOnly" x-small depressed color="#0f766e" dark @click="$emit('new-task')"><v-icon x-small left>mdi-plus</v-icon>{{ $t('clinical360.work_list.tab.new_task') }}</v-btn></header>
    <div v-if="readOnly" class="read-only"><v-icon x-small>mdi-lock-outline</v-icon> {{ $t('clinical360.work_list.tab.read_only_notice') }}</div>
    <div v-if="tasksNeedingAttention.length" class="reminder-strip"><v-icon small color="#991b1b">mdi-bell-ring-outline</v-icon><strong>{{ $t('clinical360.work_list.tab.tasks_due_count', { count: tasksNeedingAttention.length }) }}</strong><span>{{ $t('clinical360.work_list.tab.reminder_strip_note') }}</span></div>
    <div class="worklist-tools">
      <div class="metrics">
        <button v-for="item in metrics" :key="item.key" :class="{active:filter===item.key}" @click="filter=item.key"><span>{{ item.label }}</span><strong>{{ item.value }}</strong></button>
      </div>
      <label><v-icon x-small>mdi-magnify</v-icon><input v-model.trim="search" type="search" :placeholder="$t('clinical360.work_list.tab.search_placeholder')" /></label>
    </div>
    <div class="task-board">
      <div class="task-head"><span>{{ $t('clinical360.work_list.tab.col_due') }}</span><span>{{ $t('clinical360.work_list.tab.col_care_activity') }}</span><span>{{ $t('clinical360.work_list.tab.col_owner') }}</span><span>{{ $t('clinical360.work_list.tab.col_priority') }}</span><span>{{ $t('clinical360.work_list.tab.col_status') }}</span><span>{{ $t('clinical360.work_list.tab.col_actions') }}</span></div>
      <div v-for="task in filteredTasks" :key="task.id || task.title" :class="['task-row',{attention:isAttentionDue(task)}]">
        <time :class="{overdue:isOverdue(task)}">{{ dueLabel(task) }}</time>
        <div><ClinicalHoverCard :title="task.title || task.label || $t('clinical360.work_list.tab.care_task')" :eyebrow="$t('clinical360.work_list.tab.care_task')" :subtitle="dueLabel(task)" :details="taskHoverDetails(task)"><template #activator><strong class="detail-trigger">{{ task.title || task.label || $t('clinical360.work_list.tab.care_task') }}</strong></template></ClinicalHoverCard><small>{{ taskDetail(task) }}</small></div>
        <span><b>{{ ownerLabel(task) }}</b><small>{{ task.frequency || $t('clinical360.work_list.tab.once') }}</small></span>
        <span><b :class="['priority',priorityClass(task)]">{{ task.priority || $t('clinical360.work_list.tab.routine') }}</b></span>
        <span><b :class="['status',statusClass(task)]">{{ statusLabel(task) }}</b><small v-if="isAttentionDue(task)">{{ $t('clinical360.work_list.tab.reminder_active') }}</small></span>
        <div class="row-actions">
          <v-btn v-if="canUpdateTask && !readOnly" x-small icon :title="$t('clinical360.work_list.tab.complete_task')" @click="openStatusDialog(task,'done')"><v-icon small color="#15803d">mdi-check-circle-outline</v-icon></v-btn>
          <v-btn v-if="canUpdateTask && !readOnly" x-small icon :title="$t('clinical360.work_list.tab.place_task_on_hold')" @click="openStatusDialog(task,'hold')"><v-icon small color="#b45309">mdi-pause-circle-outline</v-icon></v-btn>
        </div>
      </div>
      <div v-if="!filteredTasks.length" class="empty"><v-icon size="38" color="#94a3b8">mdi-clipboard-check-outline</v-icon><strong>{{ $t('clinical360.work_list.tab.no_task_title') }}</strong><span>{{ $t('clinical360.work_list.tab.no_task_hint') }}</span></div>
    </div>
    <v-dialog v-model="statusDialog" max-width="560" persistent>
      <v-card>
        <v-card-title :class="['status-dialog-title', pendingStatus]"><div><span>WORK LIST</span><strong>{{ pendingStatus === 'done' ? $t('clinical360.work_list.tab.complete_care_task') : $t('clinical360.work_list.tab.place_care_task_on_hold') }}</strong></div><v-btn icon small @click="closeStatusDialog"><v-icon small>mdi-close</v-icon></v-btn></v-card-title>
        <v-card-text class="pt-5">
          <div class="selected-task"><small>{{ $t('clinical360.work_list.tab.selected_activity') }}</small><strong>{{ pendingTask && (pendingTask.title || pendingTask.label) }}</strong></div>
           <v-text-field v-model="performedAt" type="datetime-local" :label="pendingStatus === 'done' ? $t('clinical360.work_list.tab.completed_date_time') : $t('clinical360.work_list.tab.status_date_time')" dense outlined />
           <v-textarea v-model.trim="statusNote" :label="pendingStatus === 'done' ? $t('clinical360.work_list.tab.care_performed_label') : $t('clinical360.work_list.tab.hold_reason_label')" rows="4" dense outlined :rules="[requiredRule]" />
           <div v-if="pendingStatus === 'done'" class="next-task-panel">
             <div class="next-task-heading"><v-icon small color="#0f766e">mdi-calendar-arrow-right</v-icon><div><strong>{{ $t('clinical360.work_list.tab.schedule_next_task') }}</strong><small>{{ $t('clinical360.work_list.tab.schedule_next_task_hint') }}</small></div></div>
             <v-text-field v-model.trim="nextTitle" :label="$t('clinical360.work_list.tab.next_task')" dense outlined :rules="[requiredRule]" />
             <div class="next-task-grid">
               <v-text-field v-model="nextDueAt" type="datetime-local" :label="$t('clinical360.work_list.tab.next_due_date_time')" dense outlined :rules="[requiredRule]" />
               <v-select v-model="nextFrequency" :items="frequencies" :label="$t('clinical360.work_list.tab.frequency')" dense outlined />
               <v-select v-model="nextAssignedToRole" :items="careRoles" :label="$t('clinical360.work_list.tab.responsible_discipline')" dense outlined />
               <v-select v-model="reminderMinutesBefore" :items="reminderOptions" item-text="text" item-value="value" :label="$t('clinical360.work_list.tab.reminder')" dense outlined />
             </div>
             <v-textarea v-model.trim="nextInstructions" :label="$t('clinical360.work_list.tab.next_instructions')" rows="2" dense outlined />
           </div>
        </v-card-text>
        <v-card-actions><v-spacer/><v-btn text small @click="closeStatusDialog">{{ $t('clinical360.work_list.tab.cancel') }}</v-btn><v-btn small depressed dark :color="pendingStatus === 'done' ? '#15803d' : '#b45309'" :disabled="!canConfirmStatus" @click="confirmStatus">{{ pendingStatus === 'done' ? $t('clinical360.work_list.tab.complete_and_schedule_next') : $t('clinical360.work_list.tab.place_on_hold') }}</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
  </section>
</template>
<script>
const { nextOccurrenceAt, reminderState, localDayKey } = require('../../../../services/clinical/workflowEngine')
import ClinicalHoverCard from '../../ClinicalHoverCard.vue'

export default {
  name:'Patient360WorkListTab',
  components:{ClinicalHoverCard},
  props:{tasks:{type:Array,default:()=>[]},role:{type:String,default:''},readOnly:{type:Boolean,default:false}},
  data:()=>({filter:'all',search:'',statusDialog:false,pendingTask:null,pendingStatus:'done',statusNote:'',performedAt:'',nextTitle:'',nextDueAt:'',nextFrequency:'Once',nextAssignedToRole:'NURSE',nextInstructions:'',reminderMinutesBefore:30,nowTick:Date.now(),reminderTimer:null,lastReminderSignature:'',frequencies:['Once','Each shift','Daily','BID','TID','QID','Every 4 hours','Every 8 hours','Weekly','PRN'],careRoles:['NURSE','DOCTOR','NP','CNA','MIDWIFE','LAB','IMAGING','PHARMACY','SOCIAL_WORKER','PHYSIOTHERAPIST','MAJOR_SERVICE']}),
  computed:{
    canCreateTask(){return ['ADMIN','DOCTOR','NP','NURSE','CNA','MIDWIFE','MAJOR_SERVICE','NURSING_SUPERVISOR','LAB','IMAGING','PHARMACY','SOCIAL_WORKER','PHYSIOTHERAPIST'].includes(this.role)},
    canUpdateTask(){return this.canCreateTask},
    reminderOptions(){return[[0,'reminder_at_due_time'],[15,'reminder_15_before'],[30,'reminder_30_before'],[60,'reminder_1h_before'],[240,'reminder_4h_before']].map(([value,key])=>({value,text:this.$t(`clinical360.work_list.tab.${key}`)}))},
    metrics(){return[{key:'all',label:this.$t('clinical360.work_list.tab.metric_open'),value:this.currentDayTasks.length},{key:'overdue',label:this.$t('clinical360.work_list.tab.metric_overdue'),value:this.currentDayTasks.filter(this.isOverdue).length},{key:'urgent',label:this.$t('clinical360.work_list.tab.metric_urgent_stat'),value:this.currentDayTasks.filter(t=>/urgent|stat|high/i.test(String(t.priority||''))).length},{key:'mine',label:this.$t('clinical360.work_list.tab.metric_my_role'),value:this.currentDayTasks.filter(t=>this.ownerLabel(t)===this.role).length}]},
    currentDayTasks(){const today=localDayKey(this.nowTick);return this.tasks.filter(task=>{if(!task.dueAt)return localDayKey(task.createdAt||this.nowTick)===today;return localDayKey(task.dueAt)>=today})},
    tasksNeedingAttention(){this.nowTick;return this.currentDayTasks.filter(this.isAttentionDue)},
    canConfirmStatus(){return Boolean(this.statusNote&&(this.pendingStatus!=='done'||(this.nextTitle&&this.nextDueAt)))},
    filteredTasks(){const q=this.search.toLowerCase();return this.currentDayTasks.filter(t=>{if(this.filter==='overdue'&&!this.isOverdue(t))return false;if(this.filter==='urgent'&&!/urgent|stat|high/i.test(String(t.priority||'')))return false;if(this.filter==='mine'&&this.ownerLabel(t)!==this.role)return false;return !q||`${t.title||t.label||''} ${this.ownerLabel(t)} ${t.instructions||''}`.toLowerCase().includes(q)}).sort((a,b)=>{const rank=t=>this.isOverdue(t)?0:/urgent|stat|high/i.test(String(t.priority||''))?1:2;const r=rank(a)-rank(b);return r!==0?r:new Date(a.dueAt||a.createdAt||0)-new Date(b.dueAt||b.createdAt||0)})}
  },
  mounted(){this.refreshReminders();this.reminderTimer=setInterval(this.refreshReminders,60000)},
  beforeDestroy(){if(this.reminderTimer)clearInterval(this.reminderTimer)},
  methods:{
    requiredRule(value){return Boolean(String(value||'').trim())||this.$t('clinical360.work_list.tab.required')},
    ownerLabel(t){return t.assignedToRole||t.assignedRole||t.owner||'CARE TEAM'},
    isOverdue(t){return Boolean(t.dueAt)&&new Date(t.dueAt)<new Date()&&!/done|complete|cancel/i.test(String(t.status||''))},
    isAttentionDue(t){return ['due','reminder'].includes(reminderState(t,new Date(this.nowTick)))},
    taskDetail(t){const history=Array.isArray(t.history)?t.history.slice().reverse().find(item=>item.reason):null;const value=t.instructions||((history&&history.reason)||t.actionReason||t.reason||t.relatedType||this.$t('clinical360.work_list.tab.patient_care_activity'));return String(value).replace(/next occurrence scheduled after\s+[a-f0-9-]{20,}\s+completion\.?/i,'Next occurrence scheduled after the prior task was completed.')},
    dueLabel(t){if(!t.dueAt)return t.createdAt?new Date(t.createdAt).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):this.$t('clinical360.work_list.tab.not_scheduled');return new Date(t.dueAt).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})},
    statusLabel(t){return this.isOverdue(t)?this.$t('clinical360.work_list.tab.overdue'):(t.status||this.$t('clinical360.work_list.tab.pending'))},
    statusClass(t){return this.isOverdue(t)?'overdue':/hold/i.test(String(t.status||''))?'hold':'open'},
    priorityClass(t){return /urgent|stat|high/i.test(String(t.priority||''))?'urgent':''},
    openStatusDialog(task,status){this.pendingTask=task;this.pendingStatus=status;this.statusNote='';const now=new Date(Date.now()-new Date().getTimezoneOffset()*60000);this.performedAt=now.toISOString().slice(0,16);this.nextTitle=task.title||task.label||this.$t('clinical360.work_list.tab.care_task_follow_up');this.nextFrequency=task.frequency||'Once';this.nextAssignedToRole=this.ownerLabel(task);this.nextInstructions=task.instructions||'';this.reminderMinutesBefore=Number(task.reminderMinutesBefore??30);const due=new Date(task.dueAt||0);const anchor=due>new Date()?due:new Date();const calculated=nextOccurrenceAt(task.frequency,anchor);const fallback=new Date(Date.now()+24*60*60*1000);const next=new Date(calculated||fallback);this.nextDueAt=new Date(next.getTime()-next.getTimezoneOffset()*60000).toISOString().slice(0,16);this.statusDialog=true},
    closeStatusDialog(){this.statusDialog=false;this.pendingTask=null;this.statusNote=''},
    refreshReminders(){this.nowTick=Date.now();const signature=this.tasksNeedingAttention.map(task=>task.id).sort().join('|');if(signature&&signature!==this.lastReminderSignature)this.$emit('reminder',this.tasksNeedingAttention);this.lastReminderSignature=signature},
    taskHoverDetails(task){return[{label:this.$t('clinical360.work_list.tab.col_owner'),value:this.ownerLabel(task)},{label:this.$t('clinical360.work_list.tab.col_priority'),value:task.priority||this.$t('clinical360.work_list.tab.routine')},{label:this.$t('clinical360.work_list.tab.col_status'),value:this.statusLabel(task)},{label:this.$t('clinical360.work_list.tab.frequency'),value:task.frequency||this.$t('clinical360.work_list.tab.once')},{label:this.$t('clinical360.work_list.tab.next_instructions'),value:this.taskDetail(task)}]},
    confirmStatus(){if(!this.pendingTask||!this.canConfirmStatus)return;this.$emit('update-status',{task:this.pendingTask,status:this.pendingStatus,reason:this.statusNote,performedAt:new Date(this.performedAt).toISOString(),nextTitle:this.nextTitle,nextDueAt:this.nextDueAt?new Date(this.nextDueAt).toISOString():'',nextFrequency:this.nextFrequency,nextAssignedToRole:this.nextAssignedToRole,nextInstructions:this.nextInstructions,reminderMinutesBefore:this.reminderMinutesBefore});this.closeStatusDialog()}
  }
}
</script>
<style scoped>
.worklist-workspace{height:100%;display:flex;flex-direction:column;background:#f4f8f7;color:#17383a;overflow:hidden}.module-header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#fff;border-bottom:1px solid #cbd9d8}.module-header span{font-size:10px;font-weight:800;color:#587473}.module-header h2{margin:1px 0;font-size:18px}.module-header p{margin:0;font-size:11px;color:#607877}.read-only{padding:7px 14px;background:#f1f5f9;border-bottom:1px solid #cbd5e1;font-size:11px;font-weight:700}.reminder-strip{display:flex;align-items:center;gap:8px;padding:8px 14px;background:#fff1f2;border-bottom:1px solid #fecdd3;color:#991b1b;font-size:11px}.reminder-strip span{color:#7f1d1d}.worklist-tools{display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:#edf3f2;border-bottom:1px solid #cfdddc}.metrics{display:flex;gap:4px}.metrics button{display:flex;align-items:center;gap:8px;height:32px;padding:0 10px;background:#fff;border:1px solid #cad8d7;font-size:10px;font-weight:700}.metrics button.active{border-color:#0f766e;background:#e6f5f2}.metrics strong{font-size:15px}.worklist-tools label{display:flex;align-items:center;gap:6px;width:min(320px,35%);background:#fff;border:1px solid #baccca;padding:5px 8px}.worklist-tools input{width:100%;border:0;outline:0;font-size:11px}.task-board{overflow:auto;flex:1;background:#fff}.task-head,.task-row{display:grid;grid-template-columns:130px minmax(250px,1.6fr) 130px 95px 95px 72px;gap:9px;align-items:center}.task-head{position:sticky;top:0;z-index:2;padding:7px 12px;background:#dde9e7;font-size:9px;font-weight:800;text-transform:uppercase}.task-row{min-height:58px;padding:8px 12px;border-bottom:1px solid #dfe8e7;font-size:11px}.task-row.attention{background:#fff7ed;border-left:3px solid #ea580c}.task-row:hover{background:#f5faf9}.task-row strong,.task-row small,.task-row span b{display:block}.task-row small{margin-top:2px;color:#657b79}.task-row time{font-weight:700}.task-row time.overdue{color:#be123c}.priority,.status{display:inline-block!important;width:max-content;padding:2px 6px;background:#e8efee;text-transform:uppercase;font-size:9px}.priority.urgent,.status.overdue{background:#fee2e2;color:#b91c1c}.status.hold{background:#fef3c7;color:#92400e}.status.open{background:#dbeafe;color:#1d4ed8}.row-actions{display:flex}.empty{display:flex;min-height:210px;align-items:center;justify-content:center;flex-direction:column;gap:4px;color:#667e7c;font-size:11px}.status-dialog-title{display:flex;justify-content:space-between;background:#15803d;color:#fff}.status-dialog-title.hold{background:#a16207}.status-dialog-title span{display:block;font-size:10px;font-weight:800}.status-dialog-title strong{display:block;font-size:16px}.selected-task{padding:9px;margin-bottom:12px;background:#eef5f4;border-left:3px solid #0f766e}.selected-task small,.selected-task strong{display:block}.selected-task small{font-size:9px;text-transform:uppercase;color:#657b79}.selected-task strong{font-size:12px}.next-task-panel{padding:12px;background:#f0fdfa;border:1px solid #99f6e4}.next-task-heading{display:flex;gap:8px;margin-bottom:12px}.next-task-heading strong,.next-task-heading small{display:block}.next-task-heading small{color:#52716e}.next-task-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}@media(max-width:1100px){.task-head,.task-row{grid-template-columns:100px minmax(220px,1fr) 110px 80px 80px 60px}.worklist-tools{align-items:stretch;flex-direction:column;gap:7px}.worklist-tools label{width:100%}.next-task-grid{grid-template-columns:1fr}}
</style>
