<template>
	<v-app id="camerohealth-admins">
		<v-navigation-drawer v-model="drawer" fixed app floating width="280" color="#00A99D" dark class="gov-sidebar">
			<div class="pa-6 d-flex align-center">
				<v-avatar tile size="32" class="mr-3">
					<v-img src="/logo.png" contain></v-img>
				</v-avatar>
				<div class="line-height-1">
					<div class="text-caption font-weight-black grey--text text--lighten-1 ls-1 uppercase">CameroHealth</div>
					<div class="text-subtitle-2 font-weight-black white--text uppercase ls-tight">Digitalising Health, Improving Care</div>
				</div>
			</div>

			<v-divider class="mx-4 opacity-10"></v-divider>

			<v-list nav flat class="mt-4 px-2">
				<template v-for="(item, i) in filteredNavItems">
					<v-list-item :key="'item-'+i" :to="item.to" router exact active-class="gov-active-item">
						<v-list-item-icon><v-icon>{{ item.icon }}</v-icon></v-list-item-icon>
						<v-list-item-content>
							<v-list-item-title class="font-weight-medium uppercase">{{ item.titleKey.includes('menu') ? $t(item.titleKey) : item.titleKey }}</v-list-item-title>
						</v-list-item-content>
					</v-list-item>
				</template>
			</v-list>

			<template v-slot:append>
				<div class="pa-4">
					<v-btn block text color="grey lighten-1 " @click="logout" class="justify-start px-2 font-weight-bold">
						<v-icon left>mdi-logout-variant</v-icon>{{ $t("logout") }}
					</v-btn>
				</div>
			</template>
		</v-navigation-drawer>

		<v-app-bar flat fixed app color="white" height="72" class="gov-navbar b-bottom">
			<v-btn icon @click.stop="drawer = !drawer" class="mr-2">
				<v-icon color="#003366">mdi-menu-open</v-icon>
			</v-btn>

			<div class="ml-4 d-none d-md-flex flex-column">
				<span class="text-caption font-weight-black grey--text text--darken-1 mb-n1 mt-1">CameroHealth - {{ isClinical ? 'Clinical Layer' : 'National Health Statistics' }}</span>
				<span class="text-subtitle-2 font-weight-bold gov-primary--text">
					{{ isClinical ? institution : 'Ministry of Public Health - Surveillance Portal' }}
				</span>
			</div>

			<v-spacer />

			<v-menu offset-y transition="slide-y-transition" tile>
				<template v-slot:activator="{ on }">
					<v-btn text class="mr-4 px-4 font-weight-black text-caption ls-1 gov-primary--text" v-on="on">
						<v-icon left small>mdi-translate</v-icon>
						{{ currentLangName }}
					</v-btn>
				</template>
				<v-list dense tile class="pa-0 b-1">
					<v-list-item @click="setLang('en')" class="py-2">
						<v-list-item-title class="font-weight-bold text-caption">ENGLISH</v-list-item-title>
					</v-list-item>
					<v-list-item @click="setLang('fr')" class="py-2">
						<v-list-item-title class="font-weight-bold text-caption">FRANCAIS</v-list-item-title>
					</v-list-item>
				</v-list>
			</v-menu>

			<v-divider vertical class="mx-2 my-4 grey lighten-3"></v-divider>

			<v-menu offset-y transition="slide-y-transition">
				<template v-slot:activator="{ on }">
					<v-btn text class="pa-2 h-100" v-on="on">
						<div class="text-right mr-3 d-none d-sm-block">
							<div class="text-caption font-weight-black grey--text mb-n1 uppercase">SESSION: {{ isClinical ? 'STAFF' : 'OFFICER' }}</div>
							<div class="text-body-2 font-weight-black gov-primary--text">{{ admin ? admin.first_name : 'Authorized User' }}</div>
						</div>
						<v-avatar size="40" color="#F5F7F6" class="b-1">
							<v-icon color="#003366">mdi-account-circle</v-icon>
						</v-avatar>
					</v-btn>
				</template>
				<v-list dense tile class="pa-0 b-1 shadow-sm">
					<v-list-item class="bg-grey lighten-4 py-2 border-bottom">
						<v-list-item-content>
							<v-list-item-title class="font-weight-black text-caption">{{ institution }}</v-list-item-title>
							<v-list-item-subtitle class="text-caption">STAFF ID: {{ $store.state.auth.staffId }}</v-list-item-subtitle>
						</v-list-item-content>
					</v-list-item>
					<v-list-item @click="logout" class="py-2">
						<v-list-item-icon class="mr-2"><v-icon small color="error">mdi-power</v-icon></v-list-item-icon>
						<v-list-item-title class="font-weight-bold text-caption error--text">TERMINATE AUTH SESSION</v-list-item-title>
					</v-list-item>
				</v-list>
			</v-menu>
		</v-app-bar>

		<v-main class="gov-main-bg">
			<v-alert v-if="criticalAlert" tile :type="criticalAlert.type" color="#00A99D" dark class="ma-0 font-weight-black text-caption px-10 gov-alert">
				<v-icon left small>mdi-bullhorn-variant</v-icon>{{ criticalAlert.message }}
				<template v-slot:append>
					<v-btn x-small text class="font-weight-black ml-4" @click="criticalAlert = null">DISMISS</v-btn>
				</template>
			</v-alert>

			<div class="gov-content-wrapper">
				<nuxt />
			</div>
		</v-main>
	</v-app>
</template>

<script>
import { mapActions } from "vuex"

export default {
	data() {
		return {
			drawer: true,
			criticalAlert: null,
			navItems: [
				{ icon: 'mdi-view-dashboard', titleKey: 'menu.dashboard', to: '/ministry', roles: ['PUBLIC_HEALTH_OFFICER', 'EPIDEMIOLOGIST'] },
				{ icon: 'mdi-shield-search', titleKey: 'menu.surveillance', to: '/surveillance', roles: ['PUBLIC_HEALTH_OFFICER', 'EPIDEMIOLOGIST'] },
				{ icon: 'mdi-map', titleKey: 'menu.map', to: '/maps', roles: ['PUBLIC_HEALTH_OFFICER', 'EPIDEMIOLOGIST'] },
				{ icon: 'mdi-file-chart', titleKey: 'menu.reports', to: '/reports', roles: ['PUBLIC_HEALTH_OFFICER', 'EPIDEMIOLOGIST'] },
				{ icon: 'mdi-shield-account', titleKey: 'Admin Dashboard', to: '/admin', roles: ['ADMIN'] },
				{ icon: 'mdi-hospital-building', titleKey: 'Hospital Model', to: '/admin/hospital', roles: ['ADMIN'] },
				{ icon: 'mdi-account-multiple', titleKey: 'Staff Accounts', to: '/admin/staff', roles: ['ADMIN'] },
				{ icon: 'mdi-history', titleKey: 'Audit Log', to: '/admin/audit', roles: ['ADMIN'] },
				{ icon: 'mdi-shield-crown', titleKey: 'Super Admin', to: '/super-admin', roles: ['ADMIN'] },
				{ icon: 'mdi-view-dashboard', titleKey: 'EMR Command Center', to: '/clinical/dashboard', roles: ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'CNA', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR', 'LAB', 'IMAGING', 'PHARMACY', 'BILLING', 'RECORDS', 'FRONT_DESK', 'SOCIAL_WORKER', 'PHYSIOTHERAPIST'] },
				{ icon: 'mdi-monitor-dashboard', titleKey: 'Patient Workflow 360', to: '/clinical/patients', roles: ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'CNA', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR', 'LAB', 'IMAGING', 'PHARMACY', 'RECORDS', 'FRONT_DESK', 'SOCIAL_WORKER', 'PHYSIOTHERAPIST'] },
				{ icon: 'mdi-medical-bag', titleKey: 'Doctor Worklist', to: '/clinical/doctor', roles: ['ADMIN', 'DOCTOR', 'NP'] },
				{ icon: 'mdi-account-heart', titleKey: 'Nurse Command Center', to: '/clinical/nursing', roles: ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'CNA', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR'] },
				{ icon: 'mdi-account-group', titleKey: 'Patient Listing', to: '/clinical/patients', roles: ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'CNA', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR', 'RECORDS', 'FRONT_DESK'] },
				{ icon: 'mdi-account-plus', titleKey: 'New Patient', to: '/clinical/patients/new', roles: ['ADMIN', 'NURSE', 'MIDWIFE', 'FRONT_DESK'] },
				{ icon: 'mdi-clipboard-list', titleKey: 'Outpatient', to: '/clinical/visits', roles: ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR'] },
				{ icon: 'mdi-bed', titleKey: 'Inpatient', to: '/clinical/inpatient', roles: ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR'] },
				{ icon: 'mdi-calendar-clock', titleKey: 'Appointments', to: '/clinical/appointments', roles: ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'MIDWIFE', 'FRONT_DESK'] },
				{ icon: 'mdi-pill', titleKey: 'Medications', to: '/clinical/medications', roles: ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'PHARMACY'] },
				{ icon: 'mdi-file-document-multiple', titleKey: 'Documents', to: '/clinical/documents', roles: ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'MIDWIFE', 'RECORDS'] },
				{ icon: 'mdi-text-box-check', titleKey: 'Templates', to: '/clinical/templates', roles: ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'MIDWIFE'] },
				{ icon: 'mdi-account-arrow-right', titleKey: 'Referrals', to: '/clinical/referrals', roles: ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'MIDWIFE', 'SOCIAL_WORKER'] },
				{ icon: 'mdi-shield-check', titleKey: 'Claims', to: '/clinical/insurance', roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
				{ icon: 'mdi-cellphone-message', titleKey: 'Patient Portal', to: '/clinical/portal', roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
				{ icon: 'mdi-microphone', titleKey: 'Voice Dictation', to: '/clinical/voice', roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
				{ icon: 'mdi-file-export', titleKey: 'menu.field_input', to: '/clinical/reports', roles: ['ADMIN'] },
				{ icon: 'mdi-flask', titleKey: 'Laboratory', to: '/clinical/lab', roles: ['LAB', 'ADMIN', 'DOCTOR', 'NP', 'NURSE', 'MIDWIFE'] },
				{ icon: 'mdi-radiology-box', titleKey: 'Imaging', to: '/clinical/imaging', roles: ['IMAGING', 'ADMIN', 'DOCTOR', 'NP', 'NURSE', 'MIDWIFE'] }
			]
		}
	},
	mounted() {
		this.$store.commit('clinical/LOAD_FROM_STORAGE')
		if (this.$store._modulesNamespaceMap['nursing/']) this.$store.commit('nursing/LOAD_FROM_STORAGE')
		this.$store.commit('facility/RELOAD_FROM_STORAGE')
		if (this.isMinistry) {
			setTimeout(() => {
				const infectious = this.$store.getters['clinical/infectiousAlerts']
				if (infectious.length > 0) {
					this.criticalAlert = { type: 'error', message: `CRITICAL ALERT: ${infectious[0].title.toUpperCase()} PROTOCOL ACTIVE` }
				}
			}, 2000)
		}
	},
	methods: {
		...mapActions('auth', ['logout']),
		setLang(lang) {
			this.$store.commit('SET_LANG', lang)
			this.$i18n.locale = lang
			this.$toast.success(lang === 'fr' ? 'Langue changée en Francais' : 'Language set to English')
		}
	},
	computed: {
		admin() { return this.$store.state.auth.user },
		userRole() { return this.$store.state.auth.role || 'GUEST' },
		institution() { return this.$store.state.auth.institution },
		isClinical() { return ['ADMIN', 'DOCTOR', 'NP', 'NURSE', 'CNA', 'MIDWIFE', 'MAJOR_SERVICE', 'NURSING_SUPERVISOR', 'LAB', 'IMAGING', 'PHARMACY', 'BILLING', 'RECORDS', 'FRONT_DESK', 'SOCIAL_WORKER', 'PHYSIOTHERAPIST'].includes(this.userRole) },
		isMinistry() { return ['PUBLIC_HEALTH_OFFICER', 'EPIDEMIOLOGIST'].includes(this.userRole) },
		currentLangName() { return this.$store.state.locale === 'fr' ? 'FRANCAIS' : 'ENGLISH' },
		filteredNavItems() { return this.navItems.filter(item => item.roles.includes(this.userRole)) }
	}
}
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&display=swap');
html, body { font-family: 'Inter', sans-serif !important; background: #F5F7F6 !important; }
.gov-sidebar {
	border-right: none !important;
	.gov-active-item { background: #003366 !important; color: white !important; font-weight: 900; margin: 0 12px; }
	.v-list-item { margin: 4px 12px; border-radius: 4px !important; }
}
.gov-navbar { box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important; z-index: 100; }
.gov-main-bg { background-color: #F5F7F6 !important; }
.gov-content-wrapper { padding: 0; min-height: calc(100vh - 72px); }
.gov-primary--text { color: #003366 !important; }
.b-bottom { border-bottom: 1px solid #E5E7EB !important; }
.b-1 { border: 1px solid #E5E7EB; }
.border-bottom { border-bottom: 1px solid #E5E7EB; }
.ls-tight { letter-spacing: -1.2px !important; }
.ls-1 { letter-spacing: 0.8px !important; }
.uppercase { text-transform: uppercase; }
.line-height-1 { line-height: 1.1; }
.opacity-10 { opacity: 0.1; }
.opacity-60 { opacity: 0.6; }
.v-application { font-family: 'Inter', sans-serif !important; }
.shadow-sm { box-shadow: 0 2px 6px rgba(0,0,0,0.05) !important; }
</style>
