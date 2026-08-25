<template>
  <div />
</template>

<script>
export default {
  name: 'ClinicalIndexRedirect',
  middleware({ redirect }) {
    return redirect('/clinical/patients')
  }
}
</script>
  <div class="clinical-page">
    <ClinicalWorkspace />
  </div>
</template>

<script>
import ClinicalWorkspace from '~/components/clinical/ClinicalWorkspace.vue';

export default {
  name: 'ClinicalIndexPage',
  components: { ClinicalWorkspace }
};
</script>

<style scoped>
.clinical-page {
  padding: 24px;
  background: linear-gradient(180deg, #f7fbff 0%, #eef4f8 100%);
  min-height: 100vh;
}
</style>
