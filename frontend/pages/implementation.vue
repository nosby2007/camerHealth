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

    <section class="content-wrap interoperability-section" aria-labelledby="interoperability-title">
      <div class="section-title">
        <p class="eyebrow">{{ interoperabilityCopy.eyebrow }}</p>
        <h2 id="interoperability-title">{{ interoperabilityCopy.title }}</h2>
        <p>{{ interoperabilityCopy.text }}</p>
      </div>
      <div class="standard-grid">
        <article v-for="standard in standards" :key="standard.title">
          <v-icon>{{ standard.icon }}</v-icon>
          <div><h3>{{ standard.title }}</h3><p>{{ standard.text }}</p><small>{{ standard.status }}</small></div>
        </article>
      </div>
    </section>

    <section class="offline-band">
      <div class="content-wrap offline-grid">
        <div>
          <p class="eyebrow">{{ interoperabilityCopy.offlineEyebrow }}</p>
          <h2>{{ interoperabilityCopy.offlineTitle }}</h2>
          <p>{{ interoperabilityCopy.offlineText }}</p>
        </div>
        <ol>
          <li v-for="(step,index) in offlineSteps" :key="step"><span>{{ index + 1 }}</span>{{ step }}</li>
        </ol>
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
    interoperabilityCopy() {
      return this.isFrench
        ? { eyebrow: 'Interopérabilité régionale', title: 'Des interfaces ouvertes pour le Cameroun et la CEMAC.', text: 'CameroHealth prépare les échanges selon le système connecté. Chaque connecteur est validé avec l’établissement avant son activation en production.', offlineEyebrow: 'Mode dégradé sécurisé', offlineTitle: 'Préparer les interruptions réseau sans exposer le dossier patient.', offlineText: 'L’accès hors connexion clinique n’est pas un cache partagé. Il est configuré pour un établissement, un appareil autorisé et un périmètre de données précis, puis audité lors de la synchronisation.' }
        : { eyebrow: 'Regional interoperability', title: 'Open interfaces for Cameroon and the CEMAC region.', text: 'CameroHealth prepares exchanges according to the connected system. Each connector is validated with the facility before production activation.', offlineEyebrow: 'Secure degraded mode', offlineTitle: 'Prepare for network outages without exposing the patient record.', offlineText: 'Clinical offline access is not a shared cache. It is configured for a facility, an authorized device and a precise data scope, then audited during synchronization.' }
    },
    standards() {
      return this.isFrench ? [
        { icon: 'mdi-api', title: 'API REST documentée', text: 'Patients, prescriptions, résultats, références et rapports.', status: 'Interface disponible selon le module' },
        { icon: 'mdi-file-tree-outline', title: 'FHIR et HL7', text: 'Profils et connecteurs à valider avec le système partenaire.', status: 'Intégration sur cadrage' },
        { icon: 'mdi-image-multiple-outline', title: 'Imagerie DICOM', text: 'Lien entre demande, compte rendu et système d’imagerie.', status: 'Connecteur selon PACS' },
        { icon: 'mdi-chart-box-outline', title: 'DHIS2 et reporting', text: 'Exports structurés pour les indicateurs sanitaires autorisés.', status: 'Modèle adapté au programme' },
        { icon: 'mdi-book-open-page-variant-outline', title: 'ICD-10 / ICD-11', text: 'Catalogues diagnostiques adaptés aux exigences de déploiement.', status: 'Référentiel configurable' },
        { icon: 'mdi-shield-account-outline', title: 'Identité et consentement', text: 'MRN local, identifiant régional, traçabilité et rapprochement.', status: 'Isolation par organisation' }
      ] : [
        { icon: 'mdi-api', title: 'Documented REST API', text: 'Patients, orders, results, referrals and reports.', status: 'Interface available by module' },
        { icon: 'mdi-file-tree-outline', title: 'FHIR and HL7', text: 'Profiles and connectors validated with the partner system.', status: 'Scoped integration' },
        { icon: 'mdi-image-multiple-outline', title: 'DICOM imaging', text: 'Link orders, reports and the imaging system.', status: 'Connector based on PACS' },
        { icon: 'mdi-chart-box-outline', title: 'DHIS2 and reporting', text: 'Structured exports for authorized public health indicators.', status: 'Model adapted to programme' },
        { icon: 'mdi-book-open-page-variant-outline', title: 'ICD-10 / ICD-11', text: 'Diagnostic catalogues adapted to deployment requirements.', status: 'Configurable terminology' },
        { icon: 'mdi-shield-account-outline', title: 'Identity and consent', text: 'Local MRN, regional identifier, traceability and matching.', status: 'Organization-scoped isolation' }
      ]
    },
    offlineSteps() {
      return this.isFrench ? ['Autoriser l’appareil et le rôle', 'Limiter le périmètre clinique disponible', 'Documenter dans une file locale chiffrée', 'Synchroniser et résoudre les conflits au retour du réseau'] : ['Authorize device and role', 'Limit the available clinical scope', 'Document in an encrypted local queue', 'Sync and resolve conflicts when the network returns']
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
.implementation-page { color: #123b37; background: #f8fbfa; }.content-wrap { max-width: 1160px; margin: 0 auto; }.page-intro { padding: clamp(70px,10vw,130px) 24px; color: #fff; background: #073c38; }.page-intro .content-wrap { max-width: 1160px; }.eyebrow { margin: 0 0 10px; color: #0c8278; font-size: 12px; font-weight: 900; text-transform: uppercase; }.page-intro .eyebrow { color: #8fe3d6; }.page-intro h1 { max-width: 820px; margin: 0 0 18px; font-size: clamp(42px,7vw,76px); line-height: 1; letter-spacing: 0; }.page-intro p:not(.eyebrow) { max-width: 760px; color: #d2e7e4; font-size: 18px; line-height: 1.65; }.page-action { min-height: 46px; display: inline-flex; align-items: center; gap: 8px; margin-top: 10px; padding: 0 16px; color: #073c38; background: #fff; border-radius: 4px; text-decoration: none; font-weight: 900; }.page-action .v-icon { color: #073c38 !important; }.delivery-section,.environment-section,.interoperability-section { padding: clamp(60px,8vw,100px) 24px; }.section-title { max-width: 780px; margin-bottom: 34px; }.section-title h2,.readiness-grid h2,.offline-grid h2 { margin: 0; color: #073c38; font-size: clamp(30px,5vw,48px); line-height: 1.1; }.section-title>p:not(.eyebrow) { color: #5a7571; font-size: 16px; line-height: 1.65; }.delivery-steps { display: grid; grid-template-columns: repeat(4,1fr); border-top: 1px solid #bad0cc; border-bottom: 1px solid #bad0cc; }.delivery-steps article { min-height: 250px; padding: 24px; border-right: 1px solid #bad0cc; }.delivery-steps article:last-child { border-right: 0; }.delivery-steps>article>span { color: #0b8479; font-weight: 900; }.delivery-steps h3 { margin: 34px 0 10px; font-size: 20px; }.delivery-steps p,.readiness-grid p { color: #5a7571; line-height: 1.6; }.readiness-band { padding: clamp(58px,8vw,90px) 24px; background: #e8f3f1; }.readiness-grid { display: grid; grid-template-columns: .8fr 1.2fr; gap: 70px; }.readiness-list { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }.readiness-list>div { min-height: 120px; display: flex; gap: 14px; padding: 20px; border: 1px solid #c5dcd8; background: #fff; }.readiness-list .v-icon { color: #08786e !important; }.readiness-list span { display: flex; flex-direction: column; }.readiness-list strong { margin-bottom: 6px; }.readiness-list small { color: #607a76; line-height: 1.5; }.standard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }.standard-grid article { min-height: 170px; display: flex; gap: 16px; padding: 22px; border: 1px solid #cbdeda; background: #fff; }.standard-grid .v-icon { color: #08786e !important; }.standard-grid h3 { margin: 0 0 8px; color: #073c38; font-size: 17px; }.standard-grid p { margin: 0 0 16px; color: #5f7975; line-height: 1.5; }.standard-grid small { color: #0b6a82; font-weight: 900; }.offline-band { padding: clamp(58px,8vw,90px) 24px; background: #eef5f8; border-top: 1px solid #cadae2; border-bottom: 1px solid #cadae2; }.offline-grid { display: grid; grid-template-columns: .9fr 1.1fr; gap: 70px; }.offline-grid>div>p:not(.eyebrow) { color: #557078; line-height: 1.65; }.offline-grid ol { margin: 0; padding: 0; list-style: none; }.offline-grid li { display: grid; grid-template-columns: 34px 1fr; gap: 12px; align-items: center; padding: 13px 0; border-bottom: 1px solid #cadae2; font-weight: 800; }.offline-grid li span { width: 30px; height: 30px; display: grid; place-items: center; color: #fff; background: #0b6a82; }.environment-table { border: 1px solid #c9dcd8; }.environment-table>div { display: grid; grid-template-columns: .7fr 1.5fr 1fr; gap: 18px; padding: 16px 18px; border-bottom: 1px solid #d9e6e3; background: #fff; }.environment-table>div:last-child { border-bottom: 0; }.environment-table .table-head { color: #d9f0ec; background: #07564f; font-size: 11px; font-weight: 900; text-transform: uppercase; }.environment-table span { color: #5d7773; }.table-head span { color: inherit; }@media(max-width:850px){.delivery-steps{grid-template-columns:1fr 1fr}.delivery-steps article:nth-child(2){border-right:0}.delivery-steps article{border-bottom:1px solid #bad0cc}.readiness-grid,.offline-grid{grid-template-columns:1fr;gap:32px}}@media(max-width:560px){.delivery-steps,.readiness-list,.standard-grid{grid-template-columns:1fr}.delivery-steps article{min-height:0;border-right:0}.environment-table>div{grid-template-columns:1fr;gap:5px}.environment-table .table-head{display:none}}
</style>
