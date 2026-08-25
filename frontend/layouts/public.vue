<template>
  <v-app id="camerohealth-public">
    <header class="public-header">
      <nuxt-link to="/" class="brand-lockup">
        <v-avatar tile size="34" class="brand-mark">
          <v-img src="/logo.png" contain />
        </v-avatar>
        <span>CameroHealth</span>
      </nuxt-link>

      <nav class="public-nav" aria-label="Public navigation">
        <nuxt-link to="/">Accueil</nuxt-link>
        <nuxt-link to="/about">A propos</nuxt-link>
        <nuxt-link to="/contact">Contact</nuxt-link>
        <nuxt-link to="/login" class="nav-cta">Acceder</nuxt-link>
      </nav>
    </header>

    <main class="public-main">
      <nuxt />
    </main>
  </v-app>
</template>

<script>
export default {}
</script>

<style scoped>
.public-header {
  min-height: 68px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  padding: 14px clamp(18px, 4vw, 48px);
  border-bottom: 1px solid #d8e4ec;
  background: rgba(255, 255, 255, 0.96);
}
.brand-lockup {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #003366;
  text-decoration: none;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.brand-mark {
  background: #f1f7f6;
  border: 1px solid #d8e4ec;
}
.public-nav {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.public-nav a {
  color: #15324a;
  text-decoration: none;
  font-size: 13px;
  font-weight: 800;
  padding: 8px 10px;
  border-radius: 6px;
}
.public-nav a:hover,
.public-nav a.nuxt-link-exact-active {
  background: #edf6f4;
  color: #003366;
}
.public-nav .nav-cta {
  background: #003366;
  color: #fff !important;
}
.public-main {
  min-height: calc(100vh - 68px);
  background: #f6fafb;
}
@media (max-width: 640px) {
  .public-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .public-nav {
    justify-content: flex-start;
    width: 100%;
  }
}
</style>
