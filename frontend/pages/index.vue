<template>
  <div class="home-page">
    <section class="hero" aria-labelledby="home-title">
      <div class="hero-shade"></div>
      <div class="hero-content">
        <p class="hero-kicker">{{ copy.kicker }}</p>
        <h1 id="home-title">CameroHealth</h1>
        <p class="hero-lead">{{ copy.lead }}</p>
        <div class="hero-actions">
          <nuxt-link to="/contact" class="primary-action">{{ copy.demo }}<v-icon small>mdi-arrow-right</v-icon></nuxt-link>
          <nuxt-link to="/about" class="secondary-action">{{ copy.discover }}</nuxt-link>
        </div>
      </div>
      <div class="hero-context">
        <span><v-icon small>mdi-hospital-building</v-icon>{{ copy.contextFacility }}</span>
        <span><v-icon small>mdi-account-group</v-icon>{{ copy.contextTeams }}</span>
        <span><v-icon small>mdi-shield-lock</v-icon>{{ copy.contextSecurity }}</span>
      </div>
    </section>

    <section class="proof-band" aria-label="Platform scope">
      <div v-for="item in proof" :key="item.value" class="proof-item">
        <strong>{{ item.value }}</strong><span>{{ item.label }}</span>
      </div>
    </section>

    <section class="product-band section-wrap">
      <div class="section-heading">
        <p class="eyebrow">{{ copy.productEyebrow }}</p>
        <h2>{{ copy.productTitle }}</h2>
        <p>{{ copy.productText }}</p>
      </div>

      <div class="workspace-preview" aria-label="CameroHealth patient workspace preview">
        <div class="preview-topbar">
          <span class="preview-brand"><img src="/logo.png" alt="" />CameroHealth Chart</span>
          <span class="preview-search"><v-icon small>mdi-magnify</v-icon>{{ copy.searchPlaceholder }}</span>
          <span class="preview-role">{{ copy.role }}</span>
        </div>
        <div class="preview-patient">
          <strong>Amina Mbala</strong><span>MRN-360-0001</span>
          <em>{{ copy.activeCare }}</em><em>{{ copy.allergy }}</em><em>{{ copy.fallRisk }}</em>
        </div>
        <div class="preview-body">
          <aside>
            <strong>{{ copy.patientRecord }}</strong>
            <span v-for="item in previewMenu" :key="item">{{ item }}</span>
          </aside>
          <main>
            <nav><b>{{ copy.summary }}</b><span>{{ copy.orders }}</span><span>{{ copy.flowsheets }}</span><span>{{ copy.carePlan }}</span></nav>
            <div class="clinical-summary">
              <div><small>{{ copy.vitals }}</small><strong>118/74</strong><span>SpO₂ 97%</span></div>
              <div><small>{{ copy.tasks }}</small><strong>6</strong><span>{{ copy.twoDue }}</span></div>
              <div><small>{{ copy.medication }}</small><strong>08:00</strong><span>{{ copy.nextDose }}</span></div>
              <div><small>{{ copy.discharge }}</small><strong>4/7</strong><span>{{ copy.milestones }}</span></div>
            </div>
            <div class="timeline">
              <div v-for="event in timeline" :key="event.time"><time>{{ event.time }}</time><span></span><p><strong>{{ event.title }}</strong>{{ event.detail }}</p></div>
            </div>
          </main>
          <section class="preview-side">
            <strong>{{ copy.today }}</strong>
            <p v-for="task in tasks" :key="task"><v-icon x-small>mdi-checkbox-marked-circle-outline</v-icon>{{ task }}</p>
          </section>
        </div>
      </div>
    </section>

    <section class="workflow-band">
      <div class="section-wrap workflow-grid">
        <div class="section-heading compact">
          <p class="eyebrow">{{ copy.workflowEyebrow }}</p>
          <h2>{{ copy.workflowTitle }}</h2>
          <p>{{ copy.workflowText }}</p>
          <nuxt-link to="/implementation" class="text-link">{{ copy.seeDeployment }}<v-icon small>mdi-arrow-right</v-icon></nuxt-link>
        </div>
        <div class="workflow-list">
          <article v-for="(step, index) in workflows" :key="step.title">
            <span>{{ String(index + 1).padStart(2, '0') }}</span>
            <div><h3>{{ step.title }}</h3><p>{{ step.text }}</p></div>
          </article>
        </div>
      </div>
    </section>

    <section class="roles-band section-wrap">
      <div class="section-heading centered">
        <p class="eyebrow">{{ copy.rolesEyebrow }}</p><h2>{{ copy.rolesTitle }}</h2>
      </div>
      <div class="role-grid">
        <article v-for="role in roles" :key="role.title">
          <v-icon>{{ role.icon }}</v-icon><h3>{{ role.title }}</h3><p>{{ role.text }}</p>
        </article>
      </div>
    </section>

    <section class="identity-band" aria-labelledby="identity-title">
      <div class="section-wrap identity-grid">
        <div class="identity-copy">
          <p class="eyebrow light">{{ regionalCopy.identityEyebrow }}</p>
          <h2 id="identity-title">{{ regionalCopy.identityTitle }}</h2>
          <p>{{ regionalCopy.identityText }}</p>
          <div class="identity-benefits">
            <span v-for="benefit in identityBenefits" :key="benefit"><v-icon small>mdi-check-circle-outline</v-icon>{{ benefit }}</span>
          </div>
        </div>
        <div class="identity-record" aria-label="Unique patient identity example">
          <span>{{ regionalCopy.identityLabel }}</span>
          <strong>CMR-CE-26-004821</strong>
          <dl>
            <div><dt>{{ regionalCopy.localMrn }}</dt><dd>HGY-0004821</dd></div>
            <div><dt>{{ regionalCopy.facility }}</dt><dd>Hôpital Général</dd></div>
            <div><dt>{{ regionalCopy.status }}</dt><dd>{{ regionalCopy.matched }}</dd></div>
          </dl>
          <small><v-icon small>mdi-barcode-scan</v-icon>{{ regionalCopy.wristband }}</small>
        </div>
      </div>
    </section>

    <section class="regional-band section-wrap" aria-labelledby="regional-modules-title">
      <div class="section-heading">
        <p class="eyebrow">{{ regionalCopy.modulesEyebrow }}</p>
        <h2 id="regional-modules-title">{{ regionalCopy.modulesTitle }}</h2>
        <p>{{ regionalCopy.modulesText }}</p>
      </div>
      <div class="regional-module-grid">
        <article v-for="module in regionalModules" :key="module.code">
          <div class="module-code"><v-icon>{{ module.icon }}</v-icon><span>{{ module.code }}</span></div>
          <h3>{{ module.title }}</h3>
          <p>{{ module.text }}</p>
          <small>{{ module.scope }}</small>
        </article>
      </div>
    </section>

    <section class="connection-band">
      <div class="section-wrap connection-grid">
        <div>
          <p class="eyebrow light">{{ regionalCopy.interopEyebrow }}</p>
          <h2>{{ regionalCopy.interopTitle }}</h2>
          <p>{{ regionalCopy.interopText }}</p>
          <div class="interop-list">
            <span v-for="item in interoperabilityPoints" :key="item"><v-icon small>mdi-transit-connection-variant</v-icon>{{ item }}</span>
          </div>
        </div>
        <div class="offline-panel">
          <v-icon large>mdi-cloud-off-outline</v-icon>
          <p class="eyebrow">{{ regionalCopy.offlineEyebrow }}</p>
          <h3>{{ regionalCopy.offlineTitle }}</h3>
          <p>{{ regionalCopy.offlineText }}</p>
          <ul><li v-for="item in offlinePoints" :key="item"><v-icon small>mdi-check</v-icon>{{ item }}</li></ul>
        </div>
      </div>
    </section>

    <section class="cta-band">
      <div><p class="eyebrow light">{{ copy.ctaEyebrow }}</p><h2>{{ copy.ctaTitle }}</h2><p>{{ copy.ctaText }}</p></div>
      <nuxt-link to="/contact" class="primary-action light-action">{{ copy.contact }}<v-icon small>mdi-arrow-right</v-icon></nuxt-link>
    </section>
  </div>
</template>

<script>
export default {
  layout: 'public',
  head() {
    return {
      title: 'CameroHealth — Système hospitalier intégré',
      meta: [
        { hid: 'description', name: 'description', content: 'CameroHealth réunit le dossier patient, les soins, la pharmacie, le laboratoire, l’imagerie et le pilotage hospitalier.' }
      ]
    }
  },
  computed: {
    isFrench() { return this.$store.state.locale !== 'en' },
    copy() {
      return this.isFrench ? this.frenchCopy : this.englishCopy
    },
    proof() {
      return this.isFrench
        ? [{ value: '360°', label: 'du parcours patient' }, { value: '18+', label: 'profils professionnels' }, { value: 'FR / EN', label: 'interface bilingue' }, { value: 'Réseau résilient', label: 'mode dégradé sécurisé' }]
        : [{ value: '360°', label: 'patient journey' }, { value: '18+', label: 'professional roles' }, { value: 'FR / EN', label: 'bilingual interface' }, { value: 'Network resilient', label: 'secure degraded mode' }]
    },
    previewMenu() { return this.isFrench ? ['Résumé patient', 'Revue du dossier', 'Prescriptions', 'Soins infirmiers', 'Résultats', 'Documents'] : ['Patient summary', 'Chart review', 'Orders', 'Nursing care', 'Results', 'Documents'] },
    timeline() {
      return this.isFrench
        ? [{ time: '07:30', title: 'Constantes documentées', detail: 'Paramètres stables' }, { time: '08:00', title: 'Médicament administré', detail: 'Dose et voie vérifiées' }, { time: '09:15', title: 'Pansement réalisé', detail: 'Photo et évaluation ajoutées' }]
        : [{ time: '07:30', title: 'Vitals documented', detail: 'Stable observations' }, { time: '08:00', title: 'Medication administered', detail: 'Dose and route verified' }, { time: '09:15', title: 'Dressing completed', detail: 'Photo and assessment added' }]
    },
    tasks() { return this.isFrench ? ['Prélèvement laboratoire', 'Réévaluation douleur', 'Éducation famille', 'Préparation sortie'] : ['Lab specimen', 'Pain reassessment', 'Family education', 'Discharge preparation'] },
    workflows() {
      return this.isFrench
        ? [{ title: 'Admission', text: 'Identité, MRN, bracelet, consentements, triage et affectation du service.' }, { title: 'Prise en charge', text: 'Évaluations, prescriptions, administration, soins horodatés et coordination.' }, { title: 'Continuité', text: 'Transmission, plan de soins, éducation, sortie et rendez-vous de suivi.' }]
        : [{ title: 'Admission', text: 'Identity, MRN, wristband, consent, triage and ward assignment.' }, { title: 'Care delivery', text: 'Assessments, orders, administration, timed care and coordination.' }, { title: 'Continuity', text: 'Handoff, care plan, education, discharge and follow-up appointments.' }]
    },
    roles() {
      return this.isFrench
        ? [{ icon: 'mdi-stethoscope', title: 'Médecins et soignants', text: 'Une vue clinique cohérente, adaptée à chaque responsabilité.' }, { icon: 'mdi-flask', title: 'Plateau technique', text: 'Demandes, prélèvements, résultats, imagerie et traçabilité.' }, { icon: 'mdi-pharmacy', title: 'Pharmacie', text: 'Validation, dispensation, stock et administration sécurisée.' }, { icon: 'mdi-chart-box', title: 'Direction hospitalière', text: 'Activité, qualité, équipes, audit et continuité de service.' }]
        : [{ icon: 'mdi-stethoscope', title: 'Clinicians', text: 'A coherent clinical view adapted to each responsibility.' }, { icon: 'mdi-flask', title: 'Diagnostics', text: 'Requests, specimens, results, imaging and traceability.' }, { icon: 'mdi-pharmacy', title: 'Pharmacy', text: 'Validation, dispensing, stock and safe administration.' }, { icon: 'mdi-chart-box', title: 'Hospital leadership', text: 'Operations, quality, staffing, audit and continuity.' }]
    },
    regionalCopy() {
      return this.isFrench
        ? { identityEyebrow: 'Identité de santé', identityTitle: 'Un patient, une identité fiable dans tout son parcours.', identityText: 'CameroHealth rapproche l’identifiant régional et le MRN de chaque établissement afin de limiter les doublons et de sécuriser les transferts entre structures.', identityLabel: 'IDENTIFIANT PATIENT CAMEROHEALTH', localMrn: 'MRN local', facility: 'Établissement', status: 'Rapprochement', matched: 'Identité vérifiée', wristband: 'Compatible bracelet et lecture code-barres', modulesEyebrow: 'Écosystème hospitalier', modulesTitle: 'Des modules dédiés, un dossier patient commun.', modulesText: 'Les services spécialisés travaillent dans leur propre file de tâches tout en alimentant le même dossier clinique.', interopEyebrow: 'Interopérabilité CEMAC', interopTitle: 'Relier les établissements sans effacer leurs réalités.', interopText: 'Les interfaces d’intégration sont conçues pour l’échange sécurisé avec les partenaires, les réseaux hospitaliers et les plateformes nationales.', offlineEyebrow: 'Continuité réseau', offlineTitle: 'Le soin continue lorsque la connexion devient instable.', offlineText: 'Le mode hors connexion sécurisé est activé établissement par établissement pour les parcours critiques, avec file de synchronisation et reprise contrôlée.' }
        : { identityEyebrow: 'Health identity', identityTitle: 'One patient, one trusted identity throughout the care journey.', identityText: 'CameroHealth links a regional identifier with each facility MRN to reduce duplicate records and secure transfers between facilities.', identityLabel: 'CAMEROHEALTH PATIENT IDENTIFIER', localMrn: 'Local MRN', facility: 'Facility', status: 'Matching', matched: 'Identity verified', wristband: 'Wristband and barcode-ready', modulesEyebrow: 'Hospital ecosystem', modulesTitle: 'Dedicated modules, one shared patient record.', modulesText: 'Specialist services work from their own queues while updating the same clinical record.', interopEyebrow: 'CEMAC interoperability', interopTitle: 'Connect facilities without erasing local realities.', interopText: 'Integration interfaces are designed for secure exchange with partners, hospital networks and national platforms.', offlineEyebrow: 'Network continuity', offlineTitle: 'Care continues when connectivity becomes unstable.', offlineText: 'Secure offline mode is enabled facility by facility for critical workflows, with a controlled sync queue and recovery.' }
    },
    identityBenefits() {
      return this.isFrench ? ['Recherche multi-établissements', 'Rapprochement des doublons', 'Historique des transferts', 'Contrôle d’accès par organisation'] : ['Cross-facility lookup', 'Duplicate matching', 'Transfer history', 'Organization-scoped access']
    },
    regionalModules() {
      return this.isFrench ? [
        { code: 'LAB', icon: 'mdi-flask-outline', title: 'Laboratoire', text: 'Prescription, prélèvement, validation biologique et alerte critique.', scope: 'Du bon de demande au résultat signé' },
        { code: 'GYNÉCO', icon: 'mdi-human-pregnant', title: 'Santé maternelle', text: 'Consultation gynécologique, grossesse, accouchement et suivi postnatal.', scope: 'Mère, nouveau-né et continuité' },
        { code: 'REFERRAL', icon: 'mdi-hospital-transfer', title: 'Référence et contre-référence', text: 'Orientation, dossier de transfert, acceptation et retour au centre d’origine.', scope: 'Traçabilité entre niveaux de soins' },
        { code: 'NETWORK', icon: 'mdi-hospital-building', title: 'Réseau hospitalier', text: 'Annuaire des structures, coordination des lits et continuité inter-sites.', scope: 'Hôpital, district, région et réseau' }
      ] : [
        { code: 'LAB', icon: 'mdi-flask-outline', title: 'Laboratory', text: 'Orders, collection, result validation and critical alerts.', scope: 'From request to signed result' },
        { code: 'GYNECO', icon: 'mdi-human-pregnant', title: 'Maternal health', text: 'Gynecology, pregnancy, delivery and postnatal follow-up.', scope: 'Mother, newborn and continuity' },
        { code: 'REFERRAL', icon: 'mdi-hospital-transfer', title: 'Referral and counter-referral', text: 'Routing, transfer record, acceptance and return to the originating facility.', scope: 'Traceability across levels of care' },
        { code: 'NETWORK', icon: 'mdi-hospital-building', title: 'Hospital network', text: 'Facility directory, bed coordination and cross-site continuity.', scope: 'Hospital, district, region and network' }
      ]
    },
    interoperabilityPoints() {
      return this.isFrench ? ['API documentée et connecteurs métier', 'Échanges cliniques structurés', 'Imagerie et résultats diagnostiques', 'Exports pour le reporting sanitaire'] : ['Documented API and workflow connectors', 'Structured clinical exchange', 'Imaging and diagnostic results', 'Public health reporting exports']
    },
    offlinePoints() {
      return this.isFrench ? ['Accès ciblé aux données autorisées', 'Saisie locale des actions critiques', 'Synchronisation dès le retour du réseau', 'Journal d’audit et résolution des conflits'] : ['Targeted access to authorized data', 'Local capture for critical actions', 'Sync when connectivity returns', 'Audit trail and conflict resolution']
    }
  },
  data() {
    return {
      frenchCopy: {
        kicker: 'Système hospitalier intégré pour la CEMAC et l’Afrique', lead: 'Le dossier patient, les soins, le laboratoire, la maternité, les références et le réseau hospitalier réunis dans un espace de travail simple, sécurisé et adapté aux réalités africaines.', demo: 'Demander une démonstration', discover: 'Découvrir le produit', contextFacility: 'Hôpital général', contextTeams: 'Équipes pluridisciplinaires', contextSecurity: 'Accès par rôle', productEyebrow: 'Un dossier, une équipe', productTitle: 'Le travail clinique reste centré sur le patient.', productText: 'Chaque professionnel retrouve les informations et les actions nécessaires à son poste, sans multiplier les écrans ni perdre le fil du séjour.', searchPlaceholder: 'Rechercher patient, MRN, prescription', role: 'RÔLE Infirmier', activeCare: 'Soins actifs', allergy: 'Allergie : Pénicilline', fallRisk: 'Risque de chute : élevé', patientRecord: 'DOSSIER PATIENT', summary: 'Résumé', orders: 'Prescriptions', flowsheets: 'Feuilles de soins', carePlan: 'Plan de soins', vitals: 'Constantes', tasks: 'Tâches', medication: 'Médicament suivant', discharge: 'Préparation sortie', twoDue: '2 à réaliser', nextDose: 'Prochaine dose', milestones: 'Étapes terminées', today: 'AUJOURD’HUI', workflowEyebrow: 'De l’admission à la sortie', workflowTitle: 'Un parcours continu, pas une collection de formulaires.', workflowText: 'Les données saisies au chevet alimentent le dossier, les tâches, les transmissions et les indicateurs sans double documentation.', seeDeployment: 'Voir le modèle de déploiement', rolesEyebrow: 'Un système commun', rolesTitle: 'Des espaces adaptés à chaque métier.', ctaEyebrow: 'Préparer votre établissement', ctaTitle: 'Organisons une démonstration sur vos parcours réels.', ctaText: 'Présentez votre structure, vos services et vos priorités. Nous préparons un scénario adapté à votre environnement.', contact: 'Nous contacter'
      },
      englishCopy: {
        kicker: 'Integrated hospital system for CEMAC and Africa', lead: 'Patient records, care delivery, laboratory, maternity, referrals and hospital networks brought together in one secure workspace designed for African realities.', demo: 'Request a demonstration', discover: 'Explore the product', contextFacility: 'General hospital', contextTeams: 'Multidisciplinary teams', contextSecurity: 'Role-based access', productEyebrow: 'One record, one team', productTitle: 'Clinical work stays centered on the patient.', productText: 'Each professional sees the information and actions required for their role without losing the thread of the hospital stay.', searchPlaceholder: 'Search patient, MRN, order', role: 'ROLE Nurse', activeCare: 'Active care', allergy: 'Allergy: Penicillin', fallRisk: 'Fall risk: high', patientRecord: 'PATIENT RECORD', summary: 'Summary', orders: 'Orders', flowsheets: 'Flowsheets', carePlan: 'Care plan', vitals: 'Vitals', tasks: 'Tasks', medication: 'Next medication', discharge: 'Discharge readiness', twoDue: '2 due', nextDose: 'Next dose', milestones: 'Milestones complete', today: 'TODAY', workflowEyebrow: 'Admission to discharge', workflowTitle: 'A continuous journey, not a collection of forms.', workflowText: 'Bedside documentation updates the chart, tasks, handoff and operational indicators without duplicate entry.', seeDeployment: 'View deployment model', rolesEyebrow: 'One shared system', rolesTitle: 'Workspaces adapted to every profession.', ctaEyebrow: 'Prepare your facility', ctaTitle: 'Let us demonstrate your real workflows.', ctaText: 'Tell us about your facility, departments and priorities. We will prepare a scenario for your environment.', contact: 'Contact us'
      }
    }
  }
}
</script>

<style scoped>
.home-page { color: #123b37; }
.hero { position: relative; min-height: clamp(520px, 78vh, 690px); display: flex; align-items: center; overflow: hidden; background: url('/images/public/camerohealth-care-team.png') center/cover no-repeat; }
.hero-shade { position: absolute; inset: 0; background: rgba(4,47,44,.64); }
.hero-content { position: relative; z-index: 1; width: min(760px, calc(100% - 40px)); margin-left: clamp(20px, 8vw, 130px); padding: 54px 0 100px; color: #fff; }
.hero-kicker,.eyebrow { margin: 0 0 11px; color: #08786e; font-size: 12px; font-weight: 900; letter-spacing: 0; text-transform: uppercase; }
.hero-kicker { color: #b7f0e7; }
.hero h1 { margin: 0; font-size: clamp(54px, 8vw, 104px); line-height: .95; letter-spacing: 0; }
.hero-lead { max-width: 720px; margin: 24px 0 30px; font-size: clamp(17px, 2vw, 22px); line-height: 1.55; color: #f1fbf9; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.primary-action,.secondary-action { min-height: 48px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 0 18px; border-radius: 4px; text-decoration: none; font-size: 13px; font-weight: 900; }
.primary-action { color: #053d38; background: #fff; }
.primary-action .v-icon { color: #053d38 !important; }
.secondary-action { color: #fff; border: 1px solid rgba(255,255,255,.65); background: rgba(0,0,0,.08); }
.hero-context { position: absolute; z-index: 1; left: clamp(20px, 8vw, 130px); right: clamp(20px, 8vw, 130px); bottom: 22px; display: flex; flex-wrap: wrap; gap: 22px; color: #e6f7f4; font-size: 12px; font-weight: 800; }
.hero-context span { display: inline-flex; align-items: center; gap: 7px; }
.hero-context .v-icon { color: #8fe3d6 !important; }
.proof-band { min-height: 110px; display: grid; grid-template-columns: repeat(4, 1fr); padding: 0 clamp(20px, 7vw, 110px); background: #fff; border-bottom: 1px solid #d8e5e2; }
.proof-item { display: flex; flex-direction: column; justify-content: center; padding: 20px clamp(14px, 3vw, 38px); border-right: 1px solid #e3ecea; }
.proof-item:last-child { border-right: 0; }
.proof-item strong { color: #004f49; font-size: 23px; }
.proof-item span { margin-top: 3px; color: #657e7a; font-size: 12px; font-weight: 700; }
.section-wrap { max-width: 1240px; margin: 0 auto; padding: clamp(64px, 8vw, 104px) 24px; }
.section-heading { max-width: 760px; margin-bottom: 36px; }
.section-heading h2,.cta-band h2 { margin: 0 0 14px; color: #073c38; font-size: clamp(32px, 5vw, 52px); line-height: 1.08; letter-spacing: 0; }
.section-heading p:not(.eyebrow),.cta-band p { color: #56736f; font-size: 17px; line-height: 1.65; }
.workspace-preview { border: 1px solid #9dbdb8; background: #eef7f5; box-shadow: 0 24px 60px rgba(7,60,56,.14); overflow: hidden; }
.preview-topbar { min-height: 48px; display: grid; grid-template-columns: 1fr minmax(240px, 420px) 1fr; align-items: center; gap: 20px; padding: 7px 14px; color: #063f3a; background: #34aaa0; font-size: 11px; font-weight: 900; }
.preview-brand { display: flex; align-items: center; gap: 7px; }.preview-brand img { width: 22px; height: 22px; }
.preview-search { height: 30px; display: flex; align-items: center; gap: 8px; padding: 0 12px; color: #657e7a; background: #eaf5f3; border-radius: 15px; font-weight: 700; }
.preview-role { justify-self: end; padding: 6px 10px; background: #d8efeb; }
.preview-patient { min-height: 48px; display: flex; align-items: center; gap: 13px; padding: 8px 14px; border-bottom: 1px solid #b9d1cd; background: #f8fcfb; font-size: 11px; }
.preview-patient strong { font-size: 14px; }.preview-patient span { color: #58736f; }.preview-patient em { padding: 5px 8px; border: 1px solid #b7d3ce; background: #e5f4f1; font-style: normal; font-weight: 800; }
.preview-patient em:nth-last-child(2) { color: #8d2525; background: #fff0ee; border-color: #f0bcb4; }.preview-patient em:last-child { color: #805d00; background: #fff7d7; border-color: #e8d28b; }
.preview-body { min-height: 430px; display: grid; grid-template-columns: 190px minmax(0,1fr) 230px; }
.preview-body aside { display: flex; flex-direction: column; gap: 4px; padding: 18px 14px; color: #315c57; border-right: 1px solid #a9c8c3; background: #dff1ee; font-size: 11px; }
.preview-body aside strong { margin-bottom: 8px; color: #073c38; }.preview-body aside span { padding: 8px; }.preview-body aside span:first-of-type { color: #fff; background: #08786e; }
.preview-body main { padding: 0 12px 18px; background: #f8fbfa; }
.preview-body main nav { height: 43px; display: flex; align-items: center; gap: 18px; border-bottom: 1px solid #cadbd8; font-size: 11px; overflow: hidden; }
.preview-body main nav b { height: 43px; display: flex; align-items: center; color: #006b63; border-bottom: 3px solid #006b63; }
.clinical-summary { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; padding: 14px 0; }
.clinical-summary div { min-height: 92px; display: flex; flex-direction: column; padding: 12px; border: 1px solid #d3e1df; background: #fff; }
.clinical-summary small,.clinical-summary span { color: #6c827f; font-size: 10px; }.clinical-summary strong { margin: 4px 0; color: #073c38; font-size: 22px; }
.timeline { padding: 5px 14px; border: 1px solid #d3e1df; background: #fff; }
.timeline>div { display: grid; grid-template-columns: 48px 12px 1fr; gap: 8px; align-items: start; padding: 11px 0; border-bottom: 1px solid #edf2f1; font-size: 11px; }
.timeline>div:last-child { border-bottom: 0; }.timeline time { color: #5d7773; }.timeline>div>span { width: 8px; height: 8px; margin-top: 3px; border-radius: 50%; background: #22a79a; }.timeline p { display: flex; flex-direction: column; margin: 0; color: #6b817e; }.timeline strong { color: #123b37; }
.preview-side { padding: 18px 14px; border-left: 1px solid #a9c8c3; background: #edf6f4; font-size: 11px; }.preview-side>strong { display: block; margin-bottom: 13px; color: #073c38; }.preview-side p { display: flex; gap: 7px; margin: 0 0 8px; padding: 10px; background: #fff; border: 1px solid #d4e2e0; }.preview-side .v-icon { color: #08786e !important; }
.workflow-band { background: #e9f3f1; }.workflow-grid { display: grid; grid-template-columns: .8fr 1.2fr; gap: clamp(36px,7vw,90px); }.compact { margin: 0; }.text-link { display: inline-flex; align-items: center; gap: 7px; margin-top: 8px; color: #006b63; font-weight: 900; text-decoration: none; }.text-link .v-icon { color: #006b63 !important; }
.workflow-list article { display: grid; grid-template-columns: 52px 1fr; gap: 18px; padding: 22px 0; border-bottom: 1px solid #c7dcd8; }.workflow-list article:first-child { padding-top: 0; }.workflow-list article>span { color: #0a8479; font-size: 14px; font-weight: 900; }.workflow-list h3 { margin: 0 0 7px; color: #073c38; font-size: 21px; }.workflow-list p { margin: 0; color: #5c7773; line-height: 1.6; }
.centered { margin-left: auto; margin-right: auto; text-align: center; }.role-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }.role-grid article { min-height: 210px; padding: 24px; border: 1px solid #d1e1de; background: #fff; }.role-grid .v-icon { color: #08786e !important; }.role-grid h3 { margin: 20px 0 8px; color: #073c38; font-size: 18px; }.role-grid p { margin: 0; color: #607a76; line-height: 1.55; }
.identity-band { color: #fff; background: #073c38; }.identity-grid { display: grid; grid-template-columns: 1.15fr .85fr; gap: clamp(36px,7vw,90px); align-items: center; }.identity-copy h2,.connection-grid h2 { margin: 0 0 16px; font-size: clamp(32px,5vw,52px); line-height: 1.08; }.identity-copy>p:not(.eyebrow),.connection-grid>div>p:not(.eyebrow) { color: #c6dcda; font-size: 17px; line-height: 1.65; }.identity-benefits { display: flex; flex-wrap: wrap; gap: 12px 22px; margin-top: 28px; }.identity-benefits span { display: inline-flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 800; }.identity-benefits .v-icon { color: #60d3c3 !important; }.identity-record { padding: 28px; color: #123b37; border-left: 4px solid #10a394; background: #fff; }.identity-record>span { display: block; color: #617c78; font-size: 10px; font-weight: 900; }.identity-record>strong { display: block; margin: 8px 0 24px; color: #004f49; font-size: clamp(24px,4vw,34px); overflow-wrap: anywhere; }.identity-record dl { margin: 0; }.identity-record dl div { display: flex; justify-content: space-between; gap: 20px; padding: 10px 0; border-top: 1px solid #e0eae8; }.identity-record dt { color: #6a817e; }.identity-record dd { margin: 0; font-weight: 900; text-align: right; }.identity-record small { display: flex; gap: 7px; margin-top: 20px; color: #08786e; font-weight: 800; }.identity-record .v-icon { color: #08786e !important; }
.regional-module-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }.regional-module-grid article { min-height: 270px; display: flex; flex-direction: column; padding: 24px; border: 1px solid #cbdeda; background: #fff; }.module-code { display: flex; align-items: center; justify-content: space-between; }.module-code .v-icon { color: #08786e !important; }.module-code span { padding: 5px 7px; color: #006b63; border: 1px solid #9fc8c2; font-size: 10px; font-weight: 900; }.regional-module-grid h3 { margin: 30px 0 9px; color: #073c38; font-size: 19px; }.regional-module-grid p { margin: 0; color: #5f7975; line-height: 1.55; }.regional-module-grid small { margin-top: auto; padding-top: 22px; color: #08786e; font-weight: 800; }
.connection-band { color: #fff; background: #0b3653; }.connection-grid { display: grid; grid-template-columns: 1fr .8fr; gap: clamp(36px,7vw,90px); align-items: center; }.interop-list { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 26px; }.interop-list span { display: flex; align-items: center; gap: 8px; padding: 13px; border: 1px solid rgba(255,255,255,.16); font-size: 12px; font-weight: 800; }.interop-list .v-icon { color: #59d1c2 !important; }.offline-panel { padding: 30px; color: #123b37; background: #f1f8f6; border-top: 4px solid #e6a823; }.offline-panel>.v-icon { color: #0b6a82 !important; }.offline-panel .eyebrow { margin-top: 24px; }.offline-panel h3 { margin: 0 0 10px; color: #073c38; font-size: 26px; }.offline-panel>p:not(.eyebrow) { color: #58746f; line-height: 1.6; }.offline-panel ul { margin: 20px 0 0; padding: 0; list-style: none; }.offline-panel li { display: flex; gap: 8px; padding: 9px 0; border-top: 1px solid #d8e6e3; font-weight: 700; }.offline-panel li .v-icon { color: #08786e !important; }
.cta-band { max-width: 1240px; margin: 0 auto 80px; display: flex; justify-content: space-between; align-items: center; gap: 30px; padding: 42px clamp(24px,5vw,64px); color: #fff; background: #006b63; }.cta-band h2 { max-width: 780px; color: #fff; }.cta-band p:not(.eyebrow) { max-width: 750px; margin: 0; color: #d8efeb; }.eyebrow.light { color: #a9eee4; }.light-action { flex: 0 0 auto; }
@media (max-width: 900px) { .proof-band,.clinical-summary,.role-grid,.regional-module-grid { grid-template-columns: repeat(2,1fr); }.preview-body { grid-template-columns: 150px 1fr; }.preview-side { display: none; }.workflow-grid,.identity-grid,.connection-grid { grid-template-columns: 1fr; }.cta-band { align-items: flex-start; flex-direction: column; } }
@media (max-width: 620px) { .hero { min-height: 700px; }.hero-content { width: calc(100% - 40px); margin: 0 20px; padding: 48px 0 196px; }.hero h1 { max-width: 100%; font-size: 42px; line-height: 1; overflow-wrap: anywhere; }.hero-lead { margin: 20px 0 24px; font-size: 17px; }.hero-actions { width: 100%; flex-direction: column; align-items: stretch; }.primary-action,.secondary-action { width: 100%; padding: 0 14px; text-align: center; }.hero-context { left: 20px; right: 20px; bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px 14px; }.hero-context span:last-child { grid-column: 1 / -1; }.proof-band { grid-template-columns: 1fr 1fr; padding: 0; }.proof-item { min-height: 90px; border-bottom: 1px solid #e3ecea; }.preview-topbar { grid-template-columns: 1fr auto; }.preview-search { display: none; }.preview-body { grid-template-columns: 1fr; }.preview-body aside { display: none; }.preview-patient { overflow-x: auto; }.clinical-summary,.role-grid,.regional-module-grid,.interop-list { grid-template-columns: 1fr; }.workspace-preview { margin-left: -12px; margin-right: -12px; }.identity-record { padding: 22px; }.identity-record dl div { flex-direction: column; gap: 3px; }.identity-record dd { text-align: left; }.cta-band { margin: 0 14px 54px; } }
</style>
