<template>
  <section class="contact-page">
    <div class="contact-intro">
      <p class="eyebrow">{{ copy.eyebrow }}</p><h1>{{ copy.title }}</h1><p>{{ copy.lead }}</p>
      <div class="contact-details">
        <p><v-icon>mdi-email-outline</v-icon><span><small>Email</small><a href="mailto:support@perryhomewoundcare.network">support@perryhomewoundcare.network</a></span></p>
        <p><v-icon>mdi-map-marker-outline</v-icon><span><small>{{ copy.region }}</small><strong>Cameroun</strong></span></p>
        <p><v-icon>mdi-clock-outline</v-icon><span><small>{{ copy.response }}</small><strong>{{ copy.responseValue }}</strong></span></p>
      </div>
    </div>

    <form class="contact-form" @submit.prevent="submitRequest">
      <div class="form-heading"><span>{{ copy.formStep }}</span><h2>{{ copy.formTitle }}</h2><p>{{ copy.formLead }}</p></div>
      <div class="field-grid">
        <label><span>{{ copy.name }}</span><input v-model.trim="form.name" required autocomplete="name" /></label>
        <label><span>{{ copy.email }}</span><input v-model.trim="form.email" required type="email" autocomplete="email" /></label>
        <label><span>{{ copy.facility }}</span><input v-model.trim="form.facility" required autocomplete="organization" /></label>
        <label><span>{{ copy.city }}</span><input v-model.trim="form.city" required autocomplete="address-level2" /></label>
        <label><span>{{ copy.role }}</span><select v-model="form.role" required><option disabled value="">{{ copy.choose }}</option><option v-for="role in roles" :key="role">{{ role }}</option></select></label>
        <label><span>{{ copy.size }}</span><select v-model="form.size" required><option disabled value="">{{ copy.choose }}</option><option v-for="size in sizes" :key="size">{{ size }}</option></select></label>
      </div>
      <label class="message-field"><span>{{ copy.priority }}</span><textarea v-model.trim="form.message" required rows="5"></textarea></label>
      <label class="consent"><input v-model="form.consent" required type="checkbox" /><span>{{ copy.consent }}</span></label>
      <button type="submit">{{ copy.submit }}<v-icon small>mdi-send</v-icon></button>
      <p class="form-note">{{ copy.note }}</p>
    </form>
  </section>
</template>
<script>
export default {
  layout:'public',head:{title:'Contact CameroHealth'},
  data:()=>({form:{name:'',email:'',facility:'',city:'',role:'',size:'',message:'',consent:false}}),
  computed:{
    isFrench(){return this.$store.state.locale!=='en'},
    copy(){return this.isFrench?{eyebrow:'Contact',title:'Parlons de votre établissement.',lead:'Une démonstration utile commence par vos services, vos équipes et vos priorités de soins.',region:'Zone de déploiement',response:'Premier échange',responseValue:'Sous 2 jours ouvrés',formStep:'DEMANDE DE DÉMONSTRATION',formTitle:'Préparer un échange concret.',formLead:'Ces informations servent uniquement à préparer la démonstration.',name:'Nom complet',email:'Email professionnel',facility:'Établissement',city:'Ville',role:'Votre fonction',size:'Capacité de l’établissement',choose:'Sélectionner',priority:'Priorités ou parcours à présenter',consent:'J’accepte d’être contacté au sujet de cette demande.',submit:'Envoyer la demande',note:'Aucune donnée patient ne doit être saisie dans ce formulaire.'}:{eyebrow:'Contact',title:'Tell us about your facility.',lead:'A useful demonstration starts with your departments, teams and care priorities.',region:'Deployment area',response:'First response',responseValue:'Within 2 business days',formStep:'DEMONSTRATION REQUEST',formTitle:'Prepare a practical conversation.',formLead:'This information is used only to prepare the demonstration.',name:'Full name',email:'Work email',facility:'Facility',city:'City',role:'Your role',size:'Facility capacity',choose:'Select',priority:'Priorities or workflows to demonstrate',consent:'I agree to be contacted about this request.',submit:'Send request',note:'Do not enter any patient information in this form.'}},
    roles(){return this.isFrench?['Direction hospitalière','Direction médicale','Direction des soins','Informatique / SI','Qualité','Partenaire de mise en œuvre','Autre']:['Hospital leadership','Medical leadership','Nursing leadership','IT / information systems','Quality','Implementation partner','Other']},
    sizes(){return this.isFrench?['Moins de 50 lits','50 à 149 lits','150 à 299 lits','300 lits et plus','Centre ambulatoire']:['Fewer than 50 beds','50–149 beds','150–299 beds','300+ beds','Outpatient center']}
  },
  methods:{submitRequest(){const subject=encodeURIComponent(`CameroHealth demo - ${this.form.facility}`);const body=encodeURIComponent(`Name: ${this.form.name}\nEmail: ${this.form.email}\nFacility: ${this.form.facility}\nCity: ${this.form.city}\nRole: ${this.form.role}\nCapacity: ${this.form.size}\n\nPriorities:\n${this.form.message}`);window.location.href=`mailto:support@perryhomewoundcare.network?subject=${subject}&body=${body}`}}
}
</script>
<style scoped>
.contact-page{min-height:calc(100vh - 72px);display:grid;grid-template-columns:.85fr 1.15fr;color:#123b37;background:#f7fbfa}.contact-intro{padding:clamp(55px,8vw,110px) clamp(24px,6vw,88px);color:#fff;background:#073c38}.eyebrow{margin:0 0 10px;color:#8fe3d6;font-size:12px;font-weight:900;text-transform:uppercase}.contact-intro h1{max-width:600px;margin:0 0 18px;font-size:clamp(42px,6vw,72px);line-height:1}.contact-intro>p:not(.eyebrow){max-width:570px;color:#cae0dc;font-size:18px;line-height:1.65}.contact-details{margin-top:55px;border-top:1px solid rgba(255,255,255,.18)}.contact-details p{display:flex;gap:14px;margin:0;padding:18px 0;border-bottom:1px solid rgba(255,255,255,.18)}.contact-details .v-icon{color:#8fe3d6!important}.contact-details span{display:flex;flex-direction:column}.contact-details small{margin-bottom:4px;color:#90b6b1;font-weight:800}.contact-details a,.contact-details strong{color:#fff;text-decoration:none}.contact-form{padding:clamp(55px,8vw,100px) clamp(24px,6vw,80px);background:#fff}.form-heading{max-width:650px;margin-bottom:32px}.form-heading>span{color:#08786e;font-size:11px;font-weight:900}.form-heading h2{margin:8px 0 10px;font-size:clamp(30px,4vw,44px)}.form-heading p,.form-note{color:#667f7b}.field-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.contact-form label{display:flex;flex-direction:column;gap:7px;color:#294f4b;font-size:12px;font-weight:800}.contact-form input,.contact-form select,.contact-form textarea{width:100%;border:1px solid #bcd1cd;border-radius:3px;background:#fbfdfc;padding:11px 12px;color:#153e3a;font:inherit;font-size:14px;outline:none}.contact-form input,.contact-form select{height:44px}.contact-form input:focus,.contact-form select:focus,.contact-form textarea:focus{border-color:#08786e;box-shadow:0 0 0 2px rgba(8,120,110,.12)}.message-field{margin-top:18px}.consent{margin:18px 0!important;flex-direction:row!important;align-items:flex-start}.consent input{width:17px;height:17px;flex:0 0 17px}.contact-form button{min-height:46px;display:inline-flex;align-items:center;gap:9px;padding:0 18px;border:0;border-radius:4px;color:#fff;background:#006b63;font-weight:900;cursor:pointer}.contact-form button .v-icon{color:#fff!important}.form-note{margin:12px 0 0;font-size:11px}@media(max-width:860px){.contact-page{grid-template-columns:1fr}.contact-details{margin-top:35px}}@media(max-width:560px){.field-grid{grid-template-columns:1fr}}
</style>
