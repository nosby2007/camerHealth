<div align="center">
  <img alt="CameroHealth Dashboard" src="static/logo.png" width="200px">
</div>

# CameroHealth — Cameroon Integrated Disease Surveillance Dashboard

National disease surveillance and response monitoring platform for the **Ministry of Public Health of Cameroon (MINSANTE)**.

Built with Nuxt.js and authenticated via AWS Cognito, this dashboard provides real-time epidemiological intelligence across all 10 regions of Cameroon.

---

## Features

- National KPI statistics (confirmed, hospitalized, recovered, quarantined)
- GIS geographic distribution & resource heatmap (Google Maps + Leaflet)
- Regional case breakdown (Top 20 regions)
- Demographic spread analysis (age & sex)
- Occupancy resilience & outcome index (hospitalization / recovery rates)
- Hourly live surveillance time series
- Integrated Field Surveillance Data toggle
- Multi-language support (English / French)
- AWS Cognito authentication

---

## Setup

### Prerequisites

- Node.js ≥ 14
- A valid [Google Maps API Key](https://developers.google.com/maps)
- AWS Cognito User Pool configured for Cameroon deployment

### Environment Variables

Copy `.env.example` to `.env.development` or `.env.production` and fill in your values:

```bash
cp .env.example .env.development
```

| Variable | Description |
|---|---|
| `VUE_APP_GOOGLE_MAPS_API_KEY` | Google Maps API key (required for maps) |
| `PRODUCTION_URL` | Main MINSANTE API endpoint |
| `STATUS_AXIOS_URL` | Stats API endpoint |
| `AUTH_URL` | Cognito OAuth token endpoint |
| `CLIENT_ID` | Cognito client ID |
| `CLIENT_SECRET` | Cognito client secret |

### Install & Run

```bash
# Install dependencies
npm install

# Serve with hot reload at localhost:8000
npm run dev

# Build for production
npm run build
npm run start

# Generate static project
npm run generate
```

---

## Tech Stack

- [Nuxt.js](https://nuxtjs.org/) (SPA mode)
- [Vuetify](https://vuetifyjs.com/) — UI components
- [AWS Amplify](https://aws.amazon.com/amplify/) — Authentication (Cognito)
- [ApexCharts](https://apexcharts.com/) + [Chart.js](https://www.chartjs.org/) — Data visualization
- [Leaflet](https://leafletjs.com/) + [Google Maps](https://developers.google.com/maps) — Geospatial mapping
- [Vue i18n](https://kazupon.github.io/vue-i18n/) — Internationalization (EN/FR)
- [Axios](https://axios-http.com/) — HTTP client

---

## License

MIT License — Copyright (c) 2024 CameroHealth / MINSANTE
