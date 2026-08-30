<template>
  <section class="security-page">
    <header class="security-intro">
      <div class="content-wrap">
        <p class="eyebrow">{{ copy.eyebrow }}</p><h1>{{ copy.title }}</h1><p>{{ copy.lead }}</p>
      </div>
    </header>
    <div class="content-wrap principles">
      <article v-for="principle in principles" :key="principle.title">
        <v-icon>{{ principle.icon }}</v-icon><div><h2>{{ principle.title }}</h2><p>{{ principle.text }}</p></div>
      </article>
    </div>
    <section class="controls-band">
      <div class="content-wrap controls-grid">
        <div><p class="eyebrow">{{ copy.controls }}</p><h2>{{ copy.controlsTitle }}</h2><p>{{ copy.controlsText }}</p></div>
        <ul><li v-for="control in controls" :key="control"><v-icon small>mdi-check-circle</v-icon>{{ control }}</li></ul>
      </div>
    </section>
    <section class="content-wrap responsibility">
      <div><p class="eyebrow">{{ copy.responsibility }}</p><h2>{{ copy.responsibilityTitle }}</h2></div>
      <p>{{ copy.responsibilityText }}</p>
      <nuxt-link to="/contact">{{ copy.action }}<v-icon small>mdi-arrow-right</v-icon></nuxt-link>
    </section>
  </section>
</template>
<script>
export default {
  layout: 'public', head: { title: 'Sécurité CameroHealth' },
  computed: {
    isFrench() { return this.$store.state.locale !== 'en' },
    copy() { return this.isFrench ? { eyebrow: 'Sécurité et confidentialité', title: 'Protéger le dossier patient à chaque étape.', lead: 'La sécurité repose sur l’identité, le rôle, l’établissement, la traçabilité et la fermeture automatique des sessions inactives.', controls: 'Contrôles applicatifs', controlsTitle: 'Les droits suivent le travail réel.', controlsText: 'Un utilisateur accède aux fonctions nécessaires à sa responsabilité et à son établissement. Les actions sensibles restent identifiables et auditables.', responsibility: 'Responsabilité partagée', responsibilityTitle: 'La technologie complète les règles de l’hôpital.', responsibilityText: 'La qualité des comptes, la désactivation rapide du personnel sortant, la formation et les procédures locales restent essentielles à la protection des données.', action: 'Préparer une revue de sécurité' } : { eyebrow: 'Security and privacy', title: 'Protect the patient record at every step.', lead: 'Security is built around identity, role, facility, traceability and automatic closure of inactive sessions.', controls: 'Application controls', controlsTitle: 'Permissions follow real work.', controlsText: 'Users access the functions required by their role and facility. Sensitive actions remain attributable and auditable.', responsibility: 'Shared responsibility', responsibilityTitle: 'Technology supports hospital policy.', responsibilityText: 'Account quality, rapid staff deactivation, training and local procedures remain essential to data protection.', action: 'Plan a security review' } },
    principles() { return this.isFrench ? [{ icon:'mdi-domain',title:'Isolation par établissement',text:'Les patients, documents et activités sont limités à l’organisation authentifiée.'},{icon:'mdi-account-key',title:'Accès selon le rôle',text:'Chaque métier dispose d’un espace et de permissions adaptés à sa responsabilité.'},{icon:'mdi-history',title:'Traçabilité',text:'Les opérations sensibles sont associées à l’utilisateur et au contexte de soin.'},{icon:'mdi-timer-lock',title:'Sessions maîtrisées',text:'Expiration des jetons, déconnexion après inactivité et retour direct à la connexion.'}] : [{icon:'mdi-domain',title:'Facility isolation',text:'Patients, documents and activity are scoped to the authenticated organization.'},{icon:'mdi-account-key',title:'Role-based access',text:'Each profession receives a workspace and permissions aligned to responsibility.'},{icon:'mdi-history',title:'Traceability',text:'Sensitive operations are linked to the user and care context.'},{icon:'mdi-timer-lock',title:'Controlled sessions',text:'Token expiry, inactivity logout and direct return to sign-in.'}] },
    controls() { return this.isFrench ? ['Identité unique du personnel et établissement obligatoire','Droits séparés pour clinique, administration, laboratoire, pharmacie et accueil','Dossiers sortis maintenus en lecture seule','Origines réseau autorisées explicitement','Environnements développement, préproduction et production séparés','Aucune clé de service exposée dans le navigateur'] : ['Unique staff identity with mandatory facility context','Separated permissions for clinical, administration, lab, pharmacy and reception','Discharged charts remain read-only','Network origins explicitly allowlisted','Separated development, staging and production environments','No service key exposed to the browser'] }
  }
}
</script>
<style scoped>
.security-page{color:#143b37;background:#f8fbfa}.content-wrap{max-width:1120px;margin:0 auto}.security-intro{padding:clamp(72px,10vw,128px) 24px;background:#f0f7f5;border-bottom:1px solid #cddfdb}.eyebrow{margin:0 0 10px;color:#08786e;font-size:12px;font-weight:900;text-transform:uppercase}.security-intro h1{max-width:850px;margin:0 0 18px;color:#073c38;font-size:clamp(44px,7vw,76px);line-height:1}.security-intro p:not(.eyebrow){max-width:760px;color:#58746f;font-size:18px;line-height:1.65}.principles{display:grid;grid-template-columns:1fr 1fr;padding:clamp(60px,8vw,100px) 24px}.principles article{min-height:190px;display:grid;grid-template-columns:42px 1fr;gap:18px;padding:28px;border-right:1px solid #cbdedb;border-bottom:1px solid #cbdedb;background:#fff}.principles article:nth-child(2n){border-right:0}.principles article:nth-last-child(-n+2){border-bottom:0}.principles .v-icon{color:#08786e!important}.principles h2{margin:0 0 9px;font-size:21px}.principles p,.controls-grid p,.responsibility p{margin:0;color:#5e7975;line-height:1.65}.controls-band{padding:clamp(60px,8vw,92px) 24px;color:#fff;background:#073c38}.controls-grid{display:grid;grid-template-columns:.8fr 1.2fr;gap:70px}.controls-grid .eyebrow{color:#8fe3d6}.controls-grid h2{margin:0 0 14px;font-size:clamp(30px,5vw,48px);line-height:1.08}.controls-grid p{color:#c4dbd7}.controls-grid ul{margin:0;padding:0;list-style:none}.controls-grid li{display:flex;gap:10px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.15);font-weight:700}.controls-grid .v-icon{color:#79dfcf!important}.responsibility{display:grid;grid-template-columns:1fr 1.2fr auto;gap:30px;align-items:center;padding:70px 24px}.responsibility h2{margin:0;font-size:30px}.responsibility a{display:inline-flex;align-items:center;gap:7px;padding:12px 14px;color:#fff;background:#006b63;text-decoration:none;font-weight:900;border-radius:4px}.responsibility a .v-icon{color:#fff!important}@media(max-width:760px){.principles,.controls-grid,.responsibility{grid-template-columns:1fr}.principles article{border-right:0!important;border-bottom:1px solid #cbdedb!important}.principles article:last-child{border-bottom:0!important}}
</style>
