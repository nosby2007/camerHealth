<template>
  <section class="implementation-page">
    <header class="page-intro">
      <div class="content-wrap">
        <p class="eyebrow">{{ copy.eyebrow }}</p>
        <h1>{{ copy.title }}</h1>
        <p>{{ copy.lead }}</p>
        <nuxt-link to="/contact" class="page-action">{{ copy.action }}<v-icon small>mdi-arrow-right</v-icon></nuxt-link>
      </div>
    </header>

    <div class="content-wrap delivery-section">
      <div class="section-title"><p class="eyebrow">{{ copy.method }}</p><h2>{{ copy.methodTitle }}</h2></div>
      <div class="delivery-steps">
        <article v-for="(step,index) in steps" :key="step.title">
          <span>{{ String(index + 1).padStart(2, '0') }}</span><h3>{{ step.title }}</h3><p>{{ step.text }}</p>
        </article>
      </div>
    </div>

    <section class="readiness-band">
      <div class="content-wrap readiness-grid">
        <div><p class="eyebrow">{{ copy.readiness }}</p><h2>{{ copy.readinessTitle }}</h2><p>{{ copy.readinessText }}</p></div>
        <div class="readiness-list">
          <div v-for="item in readiness" :key="item.title"><v-icon>{{ item.icon }}</v-icon><span><strong>{{ item.title }}</strong><small>{{ item.text }}</small></span></div>
        </div>
      </div>
    </section>

    <div class="content-wrap environment-section">
      <div class="section-title"><p class="eyebrow">{{ copy.environments }}</p><h2>{{ copy.environmentsTitle }}</h2></div>
      <div class="environment-table">
        <div class="table-head"><span>{{ copy.stage }}</span><span>{{ copy.purpose }}</span><span>{{ copy.access }}</span></div>
        <div v-for="environment in environmentRows" :key="environment.stage"><strong>{{ environment.stage }}</strong><span>{{ environment.purpose }}</span><span>{{ environment.access }}</span></div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  layout: 'public',
  head: { title: 'Déploiement CameroHealth' },
  computed: {
    isFrench() { return this.$store.state.locale !== 'en' },
    copy() {
      return this.isFrench
        ? { eyebrow: 'Déploiement hospitalier', title: 'Mettre en service sans désorganiser les soins.', lead: 'Le déploiement part des parcours existants, prépare les équipes et avance service par service avec des critères de validation clairs.', action: 'Planifier un cadrage', method: 'Méthode', methodTitle: 'Un déploiement progressif et mesurable.', readiness: 'Préparation terrain', readinessTitle: 'Le logiciel doit s’adapter aux réalités de l’établissement.', readinessText: 'Nous vérifions les postes, le réseau, les responsabilités, les formulaires et les circuits de validation avant le pilote.', environments: 'Environnements séparés', environmentsTitle: 'Tester avant de mettre en production.', stage: 'Environnement', purpose: 'Utilisation', access: 'Accès' }
        : { eyebrow: 'Hospital deployment', title: 'Go live without disrupting care.', lead: 'Deployment starts from existing workflows, prepares teams and progresses department by department with clear acceptance criteria.', action: 'Plan a discovery session', method: 'Method', methodTitle: 'A progressive, measurable rollout.', readiness: 'Field readiness', readinessTitle: 'Software must fit the facility’s reality.', readinessText: 'We validate workstations, network, responsibilities, forms and approval paths before the pilot.', environments: 'Separated environments', environmentsTitle: 'Test before production.', stage: 'Environment', purpose: 'Purpose', access: 'Access' }
    },
    steps() {
      return this.isFrench
        ? [{ title: 'Cadrage', text: 'Cartographie des services, rôles, parcours patient et exigences réglementaires.' }, { title: 'Configuration', text: 'Structure de l’hôpital, comptes, droits, formulaires, catalogues et modèles.' }, { title: 'Pilote', text: 'Mise en service limitée, accompagnement au poste et correction des écarts.' }, { title: 'Généralisation', text: 'Extension par service, suivi des usages, qualité des données et support.' }]
        : [{ title: 'Discovery', text: 'Map departments, roles, patient journeys and regulatory requirements.' }, { title: 'Configuration', text: 'Facility structure, accounts, permissions, forms, catalogues and templates.' }, { title: 'Pilot', text: 'Limited go-live, at-the-elbow support and correction of workflow gaps.' }, { title: 'Scale-up', text: 'Department rollout, adoption tracking, data quality and support.' }]
    },
    readiness() {
      return this.isFrench
        ? [{ icon: 'mdi-wifi-strength-2', title: 'Réseau', text: 'Parcours légers et reprise après interruption.' }, { icon: 'mdi-laptop', title: 'Équipement', text: 'Postes partagés, tablettes et scanners code-barres.' }, { icon: 'mdi-account-school', title: 'Formation', text: 'Scénarios par métier et référents internes.' }, { icon: 'mdi-headset', title: 'Support', text: 'Suivi du pilote et gestion structurée des incidents.' }]
        : [{ icon: 'mdi-wifi-strength-2', title: 'Network', text: 'Lightweight workflows and recovery after interruption.' }, { icon: 'mdi-laptop', title: 'Equipment', text: 'Shared workstations, tablets and barcode scanners.' }, { icon: 'mdi-account-school', title: 'Training', text: 'Role-based scenarios and local champions.' }, { icon: 'mdi-headset', title: 'Support', text: 'Pilot monitoring and structured incident management.' }]
    },
    environmentRows() {
      return this.isFrench
        ? [{ stage: 'Développement', purpose: 'Construction et tests techniques', access: 'Équipe produit' }, { stage: 'Préproduction', purpose: 'Recette métier et formation', access: 'Utilisateurs désignés' }, { stage: 'Production', purpose: 'Activité clinique réelle', access: 'Personnel autorisé' }]
        : [{ stage: 'Development', purpose: 'Engineering and technical tests', access: 'Product team' }, { stage: 'Staging', purpose: 'Workflow acceptance and training', access: 'Designated users' }, { stage: 'Production', purpose: 'Live clinical operations', access: 'Authorized staff' }]
    }
  }
}
</script>

<style scoped>
.implementation-page { color: #123b37; background: #f8fbfa; }.content-wrap { max-width: 1160px; margin: 0 auto; }.page-intro { padding: clamp(70px,10vw,130px) 24px; color: #fff; background: #073c38; }.page-intro .content-wrap { max-width: 1160px; }.eyebrow { margin: 0 0 10px; color: #0c8278; font-size: 12px; font-weight: 900; text-transform: uppercase; }.page-intro .eyebrow { color: #8fe3d6; }.page-intro h1 { max-width: 820px; margin: 0 0 18px; font-size: clamp(42px,7vw,76px); line-height: 1; letter-spacing: 0; }.page-intro p:not(.eyebrow) { max-width: 760px; color: #d2e7e4; font-size: 18px; line-height: 1.65; }.page-action { min-height: 46px; display: inline-flex; align-items: center; gap: 8px; margin-top: 10px; padding: 0 16px; color: #073c38; background: #fff; border-radius: 4px; text-decoration: none; font-weight: 900; }.page-action .v-icon { color: #073c38 !important; }.delivery-section,.environment-section { padding: clamp(60px,8vw,100px) 24px; }.section-title { max-width: 720px; margin-bottom: 34px; }.section-title h2,.readiness-grid h2 { margin: 0; color: #073c38; font-size: clamp(30px,5vw,48px); line-height: 1.1; }.delivery-steps { display: grid; grid-template-columns: repeat(4,1fr); border-top: 1px solid #bad0cc; border-bottom: 1px solid #bad0cc; }.delivery-steps article { min-height: 250px; padding: 24px; border-right: 1px solid #bad0cc; }.delivery-steps article:last-child { border-right: 0; }.delivery-steps>article>span { color: #0b8479; font-weight: 900; }.delivery-steps h3 { margin: 34px 0 10px; font-size: 20px; }.delivery-steps p,.readiness-grid p { color: #5a7571; line-height: 1.6; }.readiness-band { padding: clamp(58px,8vw,90px) 24px; background: #e8f3f1; }.readiness-grid { display: grid; grid-template-columns: .8fr 1.2fr; gap: 70px; }.readiness-list { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }.readiness-list>div { min-height: 120px; display: flex; gap: 14px; padding: 20px; border: 1px solid #c5dcd8; background: #fff; }.readiness-list .v-icon { color: #08786e !important; }.readiness-list span { display: flex; flex-direction: column; }.readiness-list strong { margin-bottom: 6px; }.readiness-list small { color: #607a76; line-height: 1.5; }.environment-table { border: 1px solid #c9dcd8; }.environment-table>div { display: grid; grid-template-columns: .7fr 1.5fr 1fr; gap: 18px; padding: 16px 18px; border-bottom: 1px solid #d9e6e3; background: #fff; }.environment-table>div:last-child { border-bottom: 0; }.environment-table .table-head { color: #d9f0ec; background: #07564f; font-size: 11px; font-weight: 900; text-transform: uppercase; }.environment-table span { color: #5d7773; }.table-head span { color: inherit; }@media(max-width:850px){.delivery-steps{grid-template-columns:1fr 1fr}.delivery-steps article:nth-child(2){border-right:0}.delivery-steps article{border-bottom:1px solid #bad0cc}.readiness-grid{grid-template-columns:1fr;gap:32px}}@media(max-width:560px){.delivery-steps,.readiness-list{grid-template-columns:1fr}.delivery-steps article{min-height:0;border-right:0}.environment-table>div{grid-template-columns:1fr;gap:5px}.environment-table .table-head{display:none}}
</style>
