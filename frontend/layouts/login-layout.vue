<template>
  <v-app>
    <v-flex mx-auto>
      <nuxt />
    </v-flex>
  </v-app>
</template>

<script>
export default {
  head() {
    return { meta: [{ hid: 'robots', name: 'robots', content: 'noindex, nofollow' }] }
  }
};
</script>

<style></style>
