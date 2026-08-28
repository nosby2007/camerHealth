<template>
  <section class="product-page">
    <header class="product-intro">
      <div class="content-wrap">
        <p class="eyebrow">{{ copy.eyebrow }}</p><h1>{{ copy.title }}</h1><p>{{ copy.lead }}</p>
      </div>
    </header>

    <section class="content-wrap module-section">
      <div class="module-index">
        <button v-for="(module,index) in modules" :key="module.title" :class="{ active: activeModule === index }" @click="activeModule=index">
          <v-icon small>{{ module.icon }}</v-icon>{{ module.title }}
        </button>
      </div>
      <div class="module-detail">
        <div><p class="eyebrow">{{ String(activeModule + 1).padStart(2,'0') }} / {{ String(modules.length).padStart(2,'0') }}</p><h2>{{ modules[activeModule].title }}</h2><p>{{ modules[activeModule].text }}</p></div>
        <ul><li v-for="item in modules[activeModule].items" :key="item"><v-icon small>mdi-check</v-icon>{{ item }}</li></ul>
      </div>
    </section>

    <section class="continuity-band">
      <div class="content-wrap">
        <div class="section-heading"><p class="eyebrow">{{ copy.continuity }}</p><h2>{{ copy.continuityTitle }}</h2></div>
        <div class="continuity-line">
          <article v-for="(step,index) in journey" :key="step.title"><span>{{ index+1 }}</span><h3>{{ step.title }}</h3><p>{{ step.text }}</p></article>
        </div>
      </div>
    </section>

    <section class="content-wrap field-section">
      <div><p class="eyebrow">{{ copy.field }}</p><h2>{{ copy.fieldTitle }}</h2><p>{{ copy.fieldText }}</p></div>
      <div class="field-points"><p v-for="point in fieldPoints" :key="point.title"><v-icon>{{ point.icon }}</v-icon><span><strong>{{ point.title }}</strong><small>{{ point.text }}</small></span></p></div>
    </section>
  </section>
</template>
<script>
export default {
  layout:'public', head:{title:'Produit CameroHealth'}, data:()=>({activeModule:0}),
  computed:{
    isFrench(){return this.$store.state.locale!=='en'},
    copy(){return this.isFrench?{eyebrow:'Le produit',title:'Un système hospitalier construit autour du séjour patient.',lead:'CameroHealth relie les décisions, les soins, les examens, les médicaments et la continuité sans retirer à chaque métier son espace de travail.',continuity:'Continuité clinique',continuityTitle:'La même information accompagne le patient.',field:'Conçu pour le terrain',fieldTitle:'Rapide à comprendre, léger à utiliser.',fieldText:'Les écrans privilégient les actions fréquentes, les informations critiques et la documentation structurée.'}:{eyebrow:'The product',title:'A hospital system organized around the patient stay.',lead:'CameroHealth connects decisions, care, diagnostics, medication and continuity while preserving each profession’s workspace.',continuity:'Clinical continuity',continuityTitle:'The same information follows the patient.',field:'Built for the field',fieldTitle:'Quick to learn, lightweight to use.',fieldText:'Screens prioritize frequent actions, critical information and structured documentation.'}},
    modules(){return this.isFrench?[
      {icon:'mdi-account-heart',title:'Patient 360',text:'Le dossier actif rassemble l’identité, les risques, les événements, les tâches et les actions cliniques.',items:['Résumé longitudinal','Avatar anatomique et plaies','Documents et photos','Sortie en lecture seule']},
      {icon:'mdi-clipboard-pulse',title:'Soins infirmiers',text:'La documentation horodatée alimente les transmissions et le suivi de l’équipe.',items:['Constantes et évaluations','Feuilles de soins','Administration des médicaments','Plan de soins et éducation']},
      {icon:'mdi-stethoscope',title:'Décision médicale',text:'Prescriptions, résultats, notes et préparation de sortie restent dans le contexte du patient.',items:['Prescriptions et ordonnances','Revue du dossier','Résultats laboratoire et imagerie','Notes et synthèses']},
      {icon:'mdi-flask',title:'Services diagnostiques',text:'Les demandes circulent du prescripteur au laboratoire ou à l’imagerie avec leur statut.',items:['File de travail','Prélèvement et réception','Validation des résultats','Alerte de résultat critique']},
      {icon:'mdi-pharmacy',title:'Pharmacie',text:'Le pharmacien suit la validation, la disponibilité, la dispensation et l’administration.',items:['Catalogue par classe','Contrôle des allergies','Rupture de stock','Éducation médicament']},
      {icon:'mdi-flask-outline',title:'LAB',text:'Le laboratoire dispose d’une chaîne de travail complète reliée au dossier patient.',items:['Prescription et priorité','Prélèvement et réception','Validation biologique','Alerte de résultat critique']},
      {icon:'mdi-human-pregnant',title:'Gynéco et maternité',text:'Le suivi de la femme, de la grossesse et du nouveau-né reste continu entre consultation et hospitalisation.',items:['Consultation gynécologique','Suivi prénatal','Travail et accouchement','Post-partum et nouveau-né']},
      {icon:'mdi-hospital-transfer',title:'Referral',text:'La référence et la contre-référence organisent le passage entre les niveaux de soins.',items:['Motif et niveau d’urgence','Résumé clinique de transfert','Acceptation par la structure','Retour au centre d’origine']},
      {icon:'mdi-hospital-building',title:'Réseau hospitalier',text:'Les structures d’un même réseau coordonnent les orientations sans fusionner leurs droits d’accès.',items:['Annuaire des établissements','Disponibilité des services','Coordination inter-sites','Traçabilité des accès']},
      {icon:'mdi-monitor-dashboard',title:'Pilotage',text:'Les responsables suivent l’activité, les équipes, la qualité et les tâches en retard.',items:['Centre de commande','Gestion des équipes','Audit et rapports','Indicateurs par service']}
    ]:[
      {icon:'mdi-account-heart',title:'Patient 360',text:'The active record brings together identity, risks, events, tasks and clinical actions.',items:['Longitudinal summary','Anatomical avatar and wounds','Documents and photos','Read-only discharged chart']},
      {icon:'mdi-clipboard-pulse',title:'Nursing care',text:'Time-stamped documentation updates handoff and team follow-up.',items:['Vitals and assessments','Flowsheets','Medication administration','Care plan and education']},
      {icon:'mdi-stethoscope',title:'Medical decisions',text:'Orders, results, notes and discharge preparation stay in patient context.',items:['Orders and prescriptions','Chart review','Lab and imaging results','Notes and summaries']},
      {icon:'mdi-flask',title:'Diagnostics',text:'Requests move from prescriber to lab or imaging with clear status.',items:['Work queue','Collection and receipt','Result validation','Critical result alert']},
      {icon:'mdi-pharmacy',title:'Pharmacy',text:'Pharmacists track validation, availability, dispensing and administration.',items:['Class-based catalogue','Allergy checks','Out of stock','Medication education']},
      {icon:'mdi-flask-outline',title:'LAB',text:'The laboratory has an end-to-end work queue linked to the patient record.',items:['Order and priority','Collection and receipt','Result validation','Critical result alert']},
      {icon:'mdi-human-pregnant',title:'Gynecology and maternity',text:'Women’s health, pregnancy and newborn follow-up remain continuous across outpatient and inpatient care.',items:['Gynecology consultation','Antenatal care','Labour and delivery','Postpartum and newborn']},
      {icon:'mdi-hospital-transfer',title:'Referral',text:'Referral and counter-referral organize movement between levels of care.',items:['Reason and urgency','Clinical transfer summary','Receiving facility acceptance','Return to originating facility']},
      {icon:'mdi-hospital-building',title:'Hospital network',text:'Facilities in one network coordinate care while preserving access boundaries.',items:['Facility directory','Service availability','Cross-site coordination','Access traceability']},
      {icon:'mdi-monitor-dashboard',title:'Operations',text:'Leaders monitor activity, staffing, quality and overdue tasks.',items:['Command center','Staff management','Audit and reports','Department indicators']}
    ]},
    journey(){return this.isFrench?[{title:'Enregistrer',text:'Identité, MRN et bracelet.'},{title:'Admettre',text:'Triage, risques et service.'},{title:'Soigner',text:'Décisions et documentation.'},{title:'Transmettre',text:'Équipe et continuité.'},{title:'Sortir',text:'Instructions et suivi.'}]:[{title:'Register',text:'Identity, MRN and wristband.'},{title:'Admit',text:'Triage, risks and ward.'},{title:'Care',text:'Decisions and documentation.'},{title:'Handoff',text:'Team and continuity.'},{title:'Discharge',text:'Instructions and follow-up.'}]},
    fieldPoints(){return this.isFrench?[{icon:'mdi-translate',title:'Français et anglais',text:'La langue suit l’utilisateur.'},{icon:'mdi-wifi-strength-2',title:'Réseau contraint',text:'Des parcours sobres et ciblés.'},{icon:'mdi-barcode-scan',title:'Au chevet',text:'Bracelet patient et caméra.'},{icon:'mdi-account-key',title:'Accès métier',text:'Chaque rôle voit ce qui lui revient.'}]:[{icon:'mdi-translate',title:'French and English',text:'Language follows the user.'},{icon:'mdi-wifi-strength-2',title:'Constrained network',text:'Focused, lightweight workflows.'},{icon:'mdi-barcode-scan',title:'At the bedside',text:'Patient wristband and camera.'},{icon:'mdi-account-key',title:'Role access',text:'Each role sees what it needs.'}]}
  }
}
</script>
<style scoped>
.product-page{color:#123b37;background:#f8fbfa}.content-wrap{max-width:1160px;margin:0 auto}.product-intro{padding:clamp(70px,10vw,130px) 24px;background:#eaf4f2}.eyebrow{margin:0 0 10px;color:#08786e;font-size:12px;font-weight:900;text-transform:uppercase}.product-intro h1{max-width:900px;margin:0 0 18px;color:#073c38;font-size:clamp(42px,7vw,76px);line-height:1}.product-intro p:not(.eyebrow){max-width:800px;color:#58746f;font-size:18px;line-height:1.65}.module-section{display:grid;grid-template-columns:280px 1fr;padding:clamp(60px,8vw,100px) 24px}.module-index{display:flex;flex-direction:column;border:1px solid #c9dcd8}.module-index button{min-height:54px;display:flex;align-items:center;gap:10px;padding:0 16px;border:0;border-bottom:1px solid #d9e6e3;color:#41635f;background:#fff;font-weight:800;text-align:left;cursor:pointer}.module-index button:last-child{border-bottom:0}.module-index button.active{color:#fff;background:#006b63}.module-index button.active .v-icon{color:#fff!important}.module-detail{min-height:360px;display:grid;grid-template-columns:1.1fr .9fr;gap:45px;padding:42px;border:1px solid #c9dcd8;border-left:0;background:#fff}.module-detail h2,.section-heading h2,.field-section h2{margin:0 0 14px;font-size:clamp(30px,5vw,48px);line-height:1.08}.module-detail p,.continuity-line p,.field-section>div>p:not(.eyebrow){color:#5d7874;line-height:1.65}.module-detail ul{margin:0;padding:0;list-style:none}.module-detail li{display:flex;gap:9px;padding:13px 0;border-bottom:1px solid #e2ebe9;font-weight:700}.module-detail li .v-icon{color:#08786e!important}.continuity-band{padding:clamp(60px,8vw,90px) 24px;background:#073c38;color:#fff}.section-heading h2{color:#fff}.continuity-line{display:grid;grid-template-columns:repeat(5,1fr);margin-top:35px}.continuity-line article{padding:22px;border-left:1px solid rgba(255,255,255,.2)}.continuity-line span{color:#8fe3d6;font-weight:900}.continuity-line h3{margin:26px 0 8px}.continuity-line p{margin:0;color:#c2d9d5}.field-section{display:grid;grid-template-columns:.8fr 1.2fr;gap:70px;padding:clamp(60px,8vw,100px) 24px}.field-points{display:grid;grid-template-columns:1fr 1fr;gap:12px}.field-points p{display:flex;gap:14px;margin:0;padding:20px;border:1px solid #cddfdb;background:#fff}.field-points .v-icon{color:#08786e!important}.field-points span{display:flex;flex-direction:column}.field-points small{margin-top:5px;color:#607a76;line-height:1.4}@media(max-width:780px){.module-section,.module-detail,.field-section{grid-template-columns:1fr}.module-detail{border-left:1px solid #c9dcd8}.module-index{display:grid;grid-template-columns:1fr 1fr}.continuity-line{grid-template-columns:1fr}.continuity-line article{border-left:0;border-top:1px solid rgba(255,255,255,.2)}}@media(max-width:520px){.module-index,.field-points{grid-template-columns:1fr}.module-detail{padding:26px}.module-index button{border-right:0}}
</style>
