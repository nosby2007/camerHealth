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
*   **Runtime:** Node.js v14.x or v16.x (Recommended)
*   **Auth:** Configured AWS Cognito User Pool with appropriate environment keys.
*   **GIS:** Google Maps API key with Geocoding and Maps JavaScript API enabled.

### Quick Start
```bash
# Install critical dependencies
npm install

# Launch development environment (port 8000 default)
npm run dev

# Production Build and Optimization
npm run build
npm run start
```

### Environment Configuration
The system requires a `.env.development` or `.env.production` file containing:
*   `VUE_APP_GOOGLE_MAPS_API_KEY`: GIS authentication.
*   `API_URL`: Backend endpoint for disease surveillance records.
*   `CLIENT_ID` / `CLIENT_SECRET`: AWS Cognito App Client credentials.

---

## ⚖️ License & Compliance
This software is developed for the **Ministry of Public Health of Cameroon (MINSANTE)**. It adheres to standard data privacy guidelines for anonymized health reporting.

**Copyright © 2024 CameroHealth / Innovtech Services.** All Rights Reserved.
