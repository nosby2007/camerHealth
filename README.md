<div align="center">
  <img alt="CameroHealth Dashboard" src="static/logo.png" width="180px">
  <h1>CameroHealth</h1>
  <p><strong>Integrated Health Intelligence & Disease Surveillance System</strong></p>
  <p><em>Official National Infrastructure for the Ministry of Public Health (MINSANTE), Cameroon</em></p>
</div>

---

## 📌 Project Overview: The Reality

**CameroHealth** is not merely a data visualization dashboard; it is a mission-critical, two-tier integrated health infrastructure designed to bridge the gap between frontline clinical operations and national-level epidemiological surveillance. 

The platform operates on a dual-philosophy architecture:
1.  **National Strategic Layer (Ministry View):** Provides high-level epidemiological intelligence, out-break detection through rule-based alerting systems, and geospatial resource allocation (ventilators, ICU beds, and PPE) across all 10 regions of Cameroon.
2.  **Facility Operational Layer (Clinical View):** Serves as a lightweight Electronic Health Record (EHR) and facility management tool. It enables medical staff to track patient lifecycles, manage inpatient admissions, schedule appointments, and coordinate laboratory/imaging orders in real-time.

---

## 🛠 Detailed Technical Stack

The architecture is built for high availability, security, and low-latency interaction in a SPA (Single Page Application) environment.

### 🎨 Frontend & UI Framework
*   **Framework:** [Nuxt.js 2.15+](https://nuxtjs.org/) (Vue.js 2) operating in **SPA Mode** to ensure a desktop-class experience for intensive data management tasks.
*   **Design System:** [Vuetify](https://vuetifyjs.com/) — Utilizes a customized Material Design implementation with a corporate "Health Infrastructure Green" color palette, ensuring accessibility and government-grade visual consistency.
*   **Internationalization:** [Vue i18n](https://kazupon.github.io/vue-i18n/) — Full EN/FR bilingual support, with French-first localization to align with primary Cameroonian administrative standards.

### 🗺 Geospatial Intelligence (GIS)
*   **Hybrid Map Engine:** Dual-integration of [Google Maps Platform](https://developers.google.com/maps) (for base/satellite layers and hospital markers) and [Leaflet](https://leafletjs.com/) (for high-fidelity GeoJSON administrative boundary overlays and heatmaps).
*   **Data Aggregation:** Dynamic polling of geospatial data via standardized GeoJSON shapefiles and [Sheetsu](https://sheetsu.com/) for rapid field-level data injection.

### 🔐 Security & Data Management
*   **Identity Provider:** [AWS Amplify](https://aws.amazon.com/amplify/) / **AWS Cognito**. Implements strict Role-Based Access Control (RBAC) separating `CLINICAL_STAFF` from `PUBLIC_HEALTH_OFFICER`.
*   **State Management:** High-complexity [Vuex](https://vuex.vuejs.org/) modules managing state for patients, surveillance reports, and clinical orders with persistent LocalStorage synchronization for resilient data retention.
*   **Networking:** [Axios](https://axios-http.com/) with interceptors for auth-token injection and robust error handling.

### 📊 Analytics & Reporting
*   **Visualization:** A hybrid stack of [ApexCharts](https://apexcharts.com/) (for complex time-series and radar charts) and [Chart.js](https://www.chartjs.org/) (for high-performance real-time data streaming).
*   **Interoperability:** Integrated **Excel/CSV Export** engines allowing for data portability to international bodies (WHO, CDC, and the World Bank).

---

## 🚀 Core Module Specifications

| Module | Purpose | Real-World Application |
| :--- | :--- | :--- |
| **Surveillance Engine** | Outbreak detection & monitoring | Automatic alerting for infectious disease clusters with severity scaling. |
| **Facility Manager** | Infrastructure monitoring | Real-time monitoring of ICU capacity, ventilator availability, and PPE stock. |
| **EHR Lite** | Patient lifecycle tracking | Managing registration, medications, lab orders, and billing for clinical facilities. |
| **GIS Surveillance** | Geographic spread analysis | Mapping patient origin clusters against regional healthcare capacity. |

---

## ⚙️ Development & Deployment

### Prerequisites
*   **Runtime:** Node.js **v20.x LTS** (obligatoire — v14/v16 sont en fin de vie)
*   **Auth:** Projet Supabase configuré + User Pool AWS Cognito avec les clés d'environnement appropriées.
*   **GIS:** Clé API Google Maps avec les APIs Maps JavaScript et Geocoding activées, **restreinte à vos domaines** dans Google Cloud Console.

### Quick Start
```bash
# 1. Cloner et installer les dépendances
npm install

# 2. Configurer l'environnement (ÉTAPE OBLIGATOIRE — voir section ci-dessous)
cp .env.example .env.development
# Éditez .env.development et remplissez TOUTES les variables

# 3. Lancer l'environnement de développement (port 8000)
npm run dev

# 4. Build de production
npm run build
npm run start
```

### 🔑 Environment Configuration — CRITIQUE

> **⚠️ AVERTISSEMENT SÉCURITÉ :** Ne committez **jamais** un fichier `.env` sur Git. Le fichier `.gitignore` protège `.env*` — ne le modifiez pas. Toute clé exposée dans un commit doit être **révoquée et régénérée immédiatement**.

Le fichier `.env.example` documente toutes les variables requises. Copiez-le et remplissez vos propres valeurs :

| Variable | Visibilité | Description |
| :--- | :---: | :--- |
| `API_URL` | Public | URL de l'API nationale MINSANTE |
| `STATUS_AXIOS_URL` | Public | Endpoint des statistiques en temps réel |
| `AUTH_URL` | Public | URL du serveur OAuth Cognito |
| `CLIENT_ID` | Public | Client ID de l'application Cognito |
| `CLIENT_SECRET` | **Privé** ⚠️ | Secret Cognito — uniquement côté serveur |
| `VUE_APP_GOOGLE_MAPS_API_KEY` | Public* | Clé Maps — restreindre aux domaines autorisés |
| `SUPABASE_URL` | Public | URL du projet Supabase |
| `SUPABASE_KEY` | Public* | Clé anon Supabase — RLS obligatoires sur toutes les tables |

> `*` Ces variables sont envoyées au navigateur. Elles sont sécurisées par les restrictions de domaine (Google) et les Row Level Security (Supabase), pas par leur secret.

#### Déploiement Vercel
Ajoutez ces variables dans **Vercel Dashboard → Settings → Environment Variables**. Ne les écrivez jamais dans `vercel.json`.

```bash
# Exemple via Vercel CLI
vercel env add SUPABASE_URL
vercel env add SUPABASE_KEY
vercel env add VUE_APP_GOOGLE_MAPS_API_KEY
# ... etc.
```

---

## 🔒 Security Architecture

> Cette section documente les décisions de sécurité prises dans le code. **Tout développeur contribuant au projet doit la lire.**

### Corrections de sécurité appliquées (P0 — Avril 2026)

Les corrections suivantes ont été implémentées suite à un audit de sécurité complet :

#### 1. Suppression de tous les secrets hardcodés (`nuxt.config.js`)
**Avant (vulnérable) :**
```js
// ❌ DANGEREUX — la clé est compilée dans le bundle JS et visible par tout utilisateur
SUPABASE_KEY: process.env.SUPABASE_KEY || 'sb_publishable_XXXXX'
```
**Après (corrigé) :**
```js
// ✅ L'application lève une erreur si la variable n'est pas définie
SUPABASE_KEY: process.env.SUPABASE_KEY
```
Les secrets serveur (`CLIENT_SECRET`) sont isolés dans `privateRuntimeConfig` et ne sont jamais envoyés au navigateur.

#### 2. Séparation public/privé des variables runtime
`nuxt.config.js` utilise désormais trois niveaux de configuration :
- `env` : variables compilées dans le bundle (client + build time)
- `publicRuntimeConfig` : variables publiques injectées au runtime (non compilées)
- `privateRuntimeConfig` : variables **jamais** accessibles côté client

#### 3. Headers HTTP de sécurité (`vercel.json`)
Les headers suivants sont désormais envoyés sur toutes les réponses :

| Header | Valeur | Protection |
| :--- | :--- | :--- |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `X-XSS-Protection` | `1; mode=block` | XSS réfléchi (legacy browsers) |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Downgrade HTTPS |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Fuite de données via Referer |
| `Content-Security-Policy` | Voir `vercel.json` | XSS, injection de contenu |
| `Permissions-Policy` | `camera=(), microphone=()` | APIs sensibles du navigateur |

#### 4. Validation des variables d'environnement au démarrage
`plugins/supabase.js` lève désormais une erreur explicite si `SUPABASE_URL` ou `SUPABASE_KEY` est absent, plutôt que de démarrer silencieusement avec une configuration invalide.

#### 5. Fichier `.gitignore` ajouté
Le projet ne possédait aucun `.gitignore`. Tous les fichiers `.env*` (sauf `.env.example`) et les répertoires `node_modules/`, `.nuxt/`, `dist/` sont désormais exclus du contrôle de version.

### Risques résiduels connus (à traiter en sprint suivant)

| Risque | Sévérité | Fichiers concernés |
| :--- | :---: | :--- |
| Données cliniques stockées uniquement en `localStorage` — aucune persistance serveur | 🔴 Critique | `store/clinical.js`, `store/facility.js` |
| Hachage de mots de passe SHA-256 sans sel côté navigateur | 🔴 Critique | `store/facility.js` → `sha256()` |
| Deux systèmes d'auth non reconciliés (Cognito + localStorage) | 🟠 Élevé | `plugins/auth.js`, `store/auth.js` |
| Absence de rate limiting sur `/login` (brute-force) | 🟠 Élevé | `pages/login.vue` |
| Audit log stocké en `localStorage` (effaçable par l'utilisateur) | 🟡 Moyen | `pages/admin/audit.vue` |
| Nuxt 2 / Vue 2 en fin de vie (EOL décembre 2023) | 🟡 Moyen | `package.json` |

---

## 🗺 Architecture des modules

### Couche Nationale (Ministry)
| Route | Rôles autorisés | Description |
| :--- | :--- | :--- |
| `/ministry` | `PUBLIC_HEALTH_OFFICER`, `EPIDEMIOLOGIST` | Dashboard épidémiologique national |
| `/surveillance` | `PUBLIC_HEALTH_OFFICER`, `EPIDEMIOLOGIST` | Carte GIS + alertes en temps réel |
| `/maps` | `PUBLIC_HEALTH_OFFICER`, `EPIDEMIOLOGIST` | Carte des infrastructures sanitaires |
| `/reports` | `PUBLIC_HEALTH_OFFICER`, `EPIDEMIOLOGIST` | Rapports exportables (CSV/Excel) |

### Couche Clinique (Facility)
| Route | Rôles autorisés | Description |
| :--- | :--- | :--- |
| `/clinical/dashboard` | `ADMIN`, `DOCTOR`, `NURSE` | Tableau de bord opérationnel du site |
| `/clinical/patients` | `ADMIN`, `DOCTOR`, `NURSE` | Registre des patients |
| `/clinical/patients/new` | `ADMIN`, `DOCTOR`, `NURSE` | Enregistrement d'un nouveau patient |
| `/clinical/visits` | `DOCTOR`, `NURSE` | Consultations cliniques |
| `/clinical/inpatient` | `DOCTOR`, `NURSE` | Gestion des hospitalisations |
| `/clinical/appointments` | `ADMIN`, `DOCTOR`, `NURSE` | Planning des rendez-vous |
| `/clinical/lab` | `LAB`, `DOCTOR` | Ordres d'analyses |
| `/clinical/imaging` | `IMAGING`, `DOCTOR` | Ordres d'imagerie |
| `/clinical/medications` | `DOCTOR`, `NURSE` | Prescriptions et médicaments |
| `/clinical/billing` | `ADMIN` | Facturation et finances |
| `/admin` | `ADMIN` | Dashboard administrateur |
| `/admin/staff` | `ADMIN` | Gestion des comptes personnels |
| `/admin/audit` | `ADMIN` | Journal d'audit d'intégrité |

---

## ⚖️ License & Compliance
This software is developed for the **Ministry of Public Health of Cameroon (MINSANTE)**. It adheres to standard data privacy guidelines for anonymized health reporting.

**Copyright © 2024 CameroHealth / Innovtech Services.** All Rights Reserved.
