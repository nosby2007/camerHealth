<template>
  <div class="body-assessment-avatar">
    <div class="avatar-header">
      <h3>Body Assessment</h3>
      <div class="avatar-controls">
        <button type="button" class="control-btn" @click="view = 'front'">Front</button>
        <button type="button" class="control-btn" @click="view = 'back'">Back</button>
        <button type="button" class="control-btn" @click="clearSelection">Clear</button>
      </div>
    </div>

    <div class="body-map" :class="[view, anatomy, { 'with-image': avatarImageSrc }]" aria-label="Interactive body assessment map">
      <img
        v-if="avatarImageSrc"
        class="assessment-avatar-image"
        :src="avatarImageSrc"
        :alt="`${anatomy} ${view} body avatar`"
      >
      <button
        v-for="area in visibleAreas"
        :key="area.key"
        type="button"
        :class="['body-area', area.key, { selected: selectedAreas.includes(area.label) }]"
        :aria-pressed="selectedAreas.includes(area.label) ? 'true' : 'false'"
        @click="toggleArea(area.label)"
      >
        <v-icon x-small>{{ area.icon }}</v-icon>
        <span>{{ area.label }}</span>
      </button>
    </div>

    <div class="selected-areas">
      <h4>Selected Areas</h4>
      <div v-if="!selectedAreas.length" class="no-selection">
        Select body areas to document pain, wound, IV line, mobility or neuro findings.
      </div>
      <div v-else class="areas-list">
        <span v-for="area in selectedAreas" :key="area" class="area-tag">
          {{ area }}
          <button type="button" @click="toggleArea(area)">x</button>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import maleFrontAvatar from '~/assets/images/clinical/avatar/male-front.jpg'
import maleBackAvatar from '~/assets/images/clinical/avatar/male-back.jpg'
import femaleFrontAvatar from '~/assets/images/clinical/avatar/female-front.png'
import femaleBackAvatar from '~/assets/images/clinical/avatar/female-back.png'

const BODY_AREAS = [
  { key: 'head', label: 'Head / neuro', view: 'front', icon: 'mdi-head-cog-outline' },
  { key: 'chest', label: 'Chest / respiratory', view: 'front', icon: 'mdi-lungs' },
  { key: 'breast', label: 'Breast / chest', view: 'front', anatomy: 'female', icon: 'mdi-human-female' },
  { key: 'abdomen', label: 'Abdomen', view: 'front', icon: 'mdi-stomach' },
  { key: 'left-arm', label: 'Left arm / IV', view: 'front', icon: 'mdi-needle' },
  { key: 'right-arm', label: 'Right arm / IV', view: 'front', icon: 'mdi-needle' },
  { key: 'pelvis', label: 'Pelvis / catheter', view: 'front', icon: 'mdi-human' },
  { key: 'left-leg', label: 'Left leg / mobility', view: 'front', icon: 'mdi-walk' },
  { key: 'right-leg', label: 'Right leg / mobility', view: 'front', icon: 'mdi-walk' },
  { key: 'back-head', label: 'Posterior head', view: 'back', icon: 'mdi-head-cog-outline' },
  { key: 'back-upper', label: 'Back / pressure risk', view: 'back', icon: 'mdi-bandage' },
  { key: 'sacrum', label: 'Sacrum / pressure injury', view: 'back', icon: 'mdi-bandage' },
  { key: 'back-left-leg', label: 'Left heel / skin', view: 'back', icon: 'mdi-foot-print' },
  { key: 'back-right-leg', label: 'Right heel / skin', view: 'back', icon: 'mdi-foot-print' }
]

export default {
  name: 'BodyAssessmentAvatar',
  props: {
    gender: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      view: 'front',
      selectedAreas: []
    }
  },
  computed: {
    anatomy() {
      const gender = String(this.gender || '').toLowerCase()
      if (/female|femme|woman|girl|f\b/.test(gender)) return 'female'
      if (/male|homme|man|boy|m\b/.test(gender)) return 'male'
      return 'male'
    },
    avatarImageSrc() {
      const images = {
        female: {
          front: femaleFrontAvatar,
          back: femaleBackAvatar
        },
        male: {
          front: maleFrontAvatar,
          back: maleBackAvatar
        }
      }
      return images[this.anatomy] && images[this.anatomy][this.view]
    },
    visibleAreas() {
      return BODY_AREAS.filter(area => {
        if (area.view !== this.view) return false
        return !area.anatomy || area.anatomy === this.anatomy
      })
    }
  },
  methods: {
    toggleArea(label) {
      if (this.selectedAreas.includes(label)) {
        this.selectedAreas = this.selectedAreas.filter(item => item !== label)
      } else {
        this.selectedAreas = [...this.selectedAreas, label]
      }
      this.$emit('area-selected', [...this.selectedAreas])
    },
    clearSelection() {
      this.selectedAreas = []
      this.$emit('area-selected', [])
    }
  }
}
</script>

<style scoped>
.body-assessment-avatar {
  background: #fff;
  border: 1px solid #dbe6e3;
  padding: 12px;
}
.avatar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}
.avatar-header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 15px;
  font-weight: 900;
}
.avatar-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.control-btn {
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #0f172a;
  padding: 5px 8px;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}
.control-btn.active {
  background: #0f766e;
  border-color: #0f766e;
  color: #fff;
}
.body-map {
  position: relative;
  min-height: 430px;
  background:
    linear-gradient(90deg, transparent 49.6%, rgba(15, 118, 110, 0.08) 49.6% 50.4%, transparent 50.4%),
    #eef7f5;
  border: 1px solid #cfe5df;
}
.body-map:before {
  content: "";
  position: absolute;
  left: 50%;
  top: 20px;
  width: 176px;
  height: 370px;
  transform: translateX(-50%);
  background:
    radial-gradient(circle at 50% 34px, #dbe6e3 0 30px, transparent 31px),
    radial-gradient(ellipse at 50% 238px, rgba(203, 213, 225, 0.9) 0 42px, transparent 43px),
    linear-gradient(#dbe6e3 0 0) 50% 78px / 104px 152px no-repeat,
    linear-gradient(#dbe6e3 0 0) 14px 102px / 36px 156px no-repeat,
    linear-gradient(#dbe6e3 0 0) 126px 102px / 36px 156px no-repeat,
    linear-gradient(#dbe6e3 0 0) 54px 226px / 32px 148px no-repeat,
    linear-gradient(#dbe6e3 0 0) 90px 226px / 32px 148px no-repeat;
  border-radius: 40px;
  opacity: 0.85;
}
.body-map.with-image:before {
  display: none;
}
.assessment-avatar-image {
  bottom: 0;
  height: 100%;
  left: 50%;
  object-fit: contain;
  pointer-events: none;
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  width: 100%;
  z-index: 1;
}
.body-map.male:before {
  background:
    radial-gradient(circle at 50% 34px, #dbe6e3 0 30px, transparent 31px),
    radial-gradient(ellipse at 50% 238px, rgba(203, 213, 225, 0.9) 0 38px, transparent 39px),
    linear-gradient(#dbe6e3 0 0) 50% 78px / 116px 152px no-repeat,
    linear-gradient(#dbe6e3 0 0) 8px 102px / 38px 156px no-repeat,
    linear-gradient(#dbe6e3 0 0) 130px 102px / 38px 156px no-repeat,
    linear-gradient(#dbe6e3 0 0) 52px 226px / 34px 148px no-repeat,
    linear-gradient(#dbe6e3 0 0) 90px 226px / 34px 148px no-repeat;
}
.body-map.female:before {
  background:
    radial-gradient(circle at 50% 34px, #dbe6e3 0 30px, transparent 31px),
    radial-gradient(circle at 70px 134px, rgba(203, 213, 225, 0.92) 0 20px, transparent 21px),
    radial-gradient(circle at 106px 134px, rgba(203, 213, 225, 0.92) 0 20px, transparent 21px),
    radial-gradient(ellipse at 50% 238px, rgba(203, 213, 225, 0.94) 0 46px, transparent 47px),
    linear-gradient(#dbe6e3 0 0) 50% 80px / 98px 150px no-repeat,
    linear-gradient(#dbe6e3 0 0) 20px 104px / 34px 154px no-repeat,
    linear-gradient(#dbe6e3 0 0) 122px 104px / 34px 154px no-repeat,
    linear-gradient(#dbe6e3 0 0) 58px 226px / 30px 148px no-repeat,
    linear-gradient(#dbe6e3 0 0) 88px 226px / 30px 148px no-repeat;
}
.body-map.back.female:before,
.body-map.back.male:before {
  background:
    radial-gradient(circle at 50% 34px, #dbe6e3 0 30px, transparent 31px),
    linear-gradient(rgba(100, 116, 139, 0.2) 0 0) 50% 92px / 4px 132px no-repeat,
    radial-gradient(ellipse at 71px 244px, rgba(203, 213, 225, 0.94) 0 24px, transparent 25px),
    radial-gradient(ellipse at 105px 244px, rgba(203, 213, 225, 0.94) 0 24px, transparent 25px),
    linear-gradient(#dbe6e3 0 0) 50% 80px / 104px 150px no-repeat,
    linear-gradient(#dbe6e3 0 0) 16px 104px / 36px 154px no-repeat,
    linear-gradient(#dbe6e3 0 0) 124px 104px / 36px 154px no-repeat,
    linear-gradient(#dbe6e3 0 0) 56px 226px / 32px 148px no-repeat,
    linear-gradient(#dbe6e3 0 0) 88px 226px / 32px 148px no-repeat;
}
.body-area {
  position: absolute;
  z-index: 2;
  width: 112px;
  min-height: 40px;
  display: grid;
  grid-template-columns: 18px 1fr;
  align-items: center;
  gap: 5px;
  border: 1px solid #94a3b8;
  background: rgba(255,255,255,0.92);
  color: #0f172a;
  padding: 6px;
  font-size: 11px;
  font-weight: 900;
  text-align: left;
  cursor: pointer;
}
.body-area.selected {
  border-color: #be123c;
  background: #fff1f2;
  color: #9f1239;
}
.head, .back-head { left: calc(50% - 56px); top: 18px; }
.chest { left: calc(50% - 56px); top: 96px; }
.breast { left: calc(50% - 56px); top: 145px; }
.abdomen { left: calc(50% - 56px); top: 194px; }
.left-arm { left: calc(50% - 190px); top: 112px; }
.right-arm { right: calc(50% - 190px); top: 112px; }
.pelvis { left: calc(50% - 56px); top: 244px; }
.left-leg { left: calc(50% - 150px); top: 310px; }
.right-leg { right: calc(50% - 150px); top: 310px; }
.back-upper { left: calc(50% - 56px); top: 110px; }
.sacrum { left: calc(50% - 56px); top: 220px; }
.back-left-leg { left: calc(50% - 150px); top: 318px; }
.back-right-leg { right: calc(50% - 150px); top: 318px; }
.selected-areas {
  margin-top: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 10px;
}
.selected-areas h4 {
  margin: 0 0 8px;
  color: #475569;
  font-size: 12px;
  font-weight: 900;
}
.no-selection {
  color: #64748b;
  font-size: 12px;
  line-height: 1.35;
}
.areas-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.area-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #0f766e;
  color: #fff;
  padding: 5px 8px;
  font-size: 11px;
  font-weight: 900;
}
.area-tag button {
  border: 0;
  background: transparent;
  color: #fff;
  cursor: pointer;
  font-weight: 900;
}
@media (max-width: 760px) {
  .body-map {
    min-height: 500px;
  }
  .body-area {
    width: 132px;
  }
  .left-arm, .back-left-leg, .left-leg {
    left: 8px;
  }
  .right-arm, .back-right-leg, .right-leg {
    right: 8px;
  }
}
</style>
