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
