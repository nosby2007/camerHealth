/* eslint-disable quotes */
import colors from "vuetify/es5/util/colors";
require("./config");

// ─── Validation des variables d'environnement obligatoires ────────────────────
// L'application refuse de démarrer si une variable critique est absente.
// Ajoutez ici toute variable indispensable.
const REQUIRED_ENV = [
  'API_URL',
  'VUE_APP_GOOGLE_MAPS_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'CLIENT_ID'
]
const missingVars = REQUIRED_ENV.filter(k => !process.env[k])
if (missingVars.length > 0) {
  throw new Error(
    `[CameroHealth] Variables d'environnement manquantes : ${missingVars.join(', ')}\n` +
    `Copiez .env.example vers .env.development et remplissez toutes les valeurs.`
  )
}

const parseBooleanFlag = (value, fallback = false) => {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

export default {
  // ─── Variables publiques exposées côté client ────────────────────────────────
  // ⚠️  Ne jamais mettre de secrets ici. Toute valeur dans `env` est incluse
  //     dans le bundle JavaScript envoyé au navigateur.
  env: {
    API_URL: process.env.API_URL,
    GOOGLE_MAPS_API_KEY: process.env.VUE_APP_GOOGLE_MAPS_API_KEY,
    AUTH_URL: process.env.AUTH_URL,
    CLIENT_ID: process.env.CLIENT_ID,
    STATUS_AXIOS_URL: process.env.STATUS_AXIOS_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    // La clé Supabase publishable (anon key) est publique par conception,
    // mais les Row Level Security (RLS) doivent être activées côté Supabase.
    SUPABASE_KEY: process.env.SUPABASE_KEY,
    SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET || '',
    ENABLE_SUPABASE_AUTH: process.env.ENABLE_SUPABASE_AUTH || 'false',
    STAFF_INVITE_ENDPOINT: process.env.STAFF_INVITE_ENDPOINT || ''
  },
  // ─── Variables privées : jamais exposées au client ───────────────────────────
  // Accessibles uniquement via `this.$config` dans les contextes server-side.
  privateRuntimeConfig: {
    CLIENT_SECRET: process.env.CLIENT_SECRET
  },
  // ─── Variables publiques runtime (non compilées dans le bundle) ──────────────
  publicRuntimeConfig: {
    API_URL: process.env.API_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_KEY: process.env.SUPABASE_KEY,
    SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET || '',
    ENABLE_SUPABASE_AUTH: parseBooleanFlag(process.env.ENABLE_SUPABASE_AUTH, false),
    STAFF_INVITE_ENDPOINT: process.env.STAFF_INVITE_ENDPOINT || ''
  },
  mode: "spa",
  /*
   ** Headers of the page
   */
  head: {
    titleTemplate: "%s — CameroHealth | MINSANTE",
    title: "CameroHealth",
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        hid: "description",
        name: "description",
        content: "Système intégré de surveillance des maladies et de gestion clinique — Ministère de la Santé Publique du Cameroun (MINSANTE)"
      },
      // Sécurité : empêche les moteurs de recherche d'indexer un système de santé gouvernemental
      { name: "robots", content: "noindex, nofollow" },
      // PWA theme color (barre navigateur sur mobile)
      { name: "theme-color", content: "#003366" },
      // Pas de cache pour les pages contenant des données de santé
      { "http-equiv": "Cache-Control", content: "no-store, no-cache, must-revalidate" },
      { "http-equiv": "Pragma", content: "no-cache" }
    ],
    link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }]
  },
  router: {
    middleware: ["auth"],
    // Désactive le prefetch automatique des liens.
    // Dans un système RBAC, charger à l'avance des routes protégées
    // peut révéler l'existence de ressources non autorisées.
    prefetchLinks: false,
    // Remonte en haut de page à chaque navigation
    scrollBehavior(to, from, savedPosition) {
      if (savedPosition) return savedPosition
      return { x: 0, y: 0 }
    }
  },
  /*
   ** Customize the progress-bar color
   */
  loading: { color: "#fff" },
  /*
   ** Global CSS
   */
  css: [],
  /*
   ** Plugins to load before mounting the App
   */
  plugins: [
    { src: "~/plugins/vuetify-explicit.js" },
    // { src: "~/plugins/leaflet.js", ssr: false },
    { src: "~/plugins/google-maps.js" },
    { src: "~/plugins/apex.chart.js" },
    { src: "~/plugins/i18n.js" },
    { src: "~/plugins/supabase.js" },
    { src: "~/plugins/supabase-auth-compat.js" },
    { src: "~/plugins/amplify.js", ssr: false },
    { src: "~/plugins/amplify.auth.js", mode: "client" },
    { src: "~/plugins/vue-json-to-csv.js" }
  ],

  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [
    // ESLint activé — vérifie la qualité du code à chaque `npm run dev`
    '@nuxtjs/eslint-module',
    "@nuxtjs/vuetify"
  ],
  /*
   ** Nuxt.js modules
   */
  modules: [
    // "nuxt-client-init-module",
    ["@nuxtjs/pwa", { Icon: false }],
    "@nuxtjs/toast",
    "nuxt-leaflet",
    "@nuxtjs/axios",
    "nuxt-precompress"
  ],

  // ─── Configuration Axios ──────────────────────────────────────────────────
  axios: {
    // URL de base injectée automatiquement dans tous les appels $axios
    baseURL: (process.env.API_URL && !process.env.API_URL.includes('minsante.gov.cm')) ? process.env.API_URL : 'http://127.0.0.1:4000/api',
    // Timeout : 15 secondes (critique pour les zones à faible connectivité)
    timeout: 15000,
    // Envoie les cookies de session avec chaque requête cross-origin
    credentials: false,
    // Headers par défaut sur toutes les requêtes
    headers: {
      common: {
        'Accept': 'application/json',
        'X-Application': 'CameroHealth-MINSANTE'
      }
    },
    // Intercepteur de retry automatique (réseau instable en milieu hospitalier)
    retry: { retries: 2 }
  },

  nuxtPrecompress: {
    enabled: process.env.NODE_ENV === 'production', // Uniquement en production
    report: false, // Pas de logs verbose en production
    test: /\.(js|css|html|txt|xml|svg|json|geojson)$/, // files to compress on build
    // Serving options
    middleware: {
      // You can disable middleware if you serve static files using nginx...
      enabled: true,
      // Enable if you have .gz or .br files in /static/ folder
      enabledStatic: true,
      // Priority of content-encodings, first matched with request Accept-Encoding will me served
      encodingsPriority: ["br", "gzip"]
    },
    // build time compression settings
    gzip: {
      // should compress to gzip?
      enabled: true,
      // compression config
      // https://www.npmjs.com/package/compression-webpack-plugin
      filename: "[path].gz[query]", // middleware will look for this filename
      threshold: 10240,
      minRatio: 0.8,
      compressionOptions: { level: 9 }
    },
    brotli: {
      // should compress to brotli?
      enabled: false,
      // compression config
      // https://www.npmjs.com/package/compression-webpack-plugin
      filename: "[path].br[query]", // middleware will look for this filename
      compressionOptions: { level: 11 },
      threshold: 10240,
      minRatio: 0.8
    }
  },

  toast: {
    position: "top-right",
    duration: 3000
  },

  loadingIndicator: {
    name: "circle",
    color: "#f00",
    background: "#fff"
  },
  /*
   ** vuetify module configuration
   ** https://github.com/nuxt-community/vuetify-module
   */
  vuetify: {
    customVariables: ["~/assets/variables.scss"],
    theme: {
      dark: false,
      themes: {
        dark: {
          primary: "#003366",
          accent: "#B91C1C",
          secondary: "#00A99D",
          info: "#003366",
          warning: "#D97706",
          error: "#B91C1C",
          success: "#00A99D"
        },
        light: {
          primary: "#003366",
          secondary: "#00A99D",
          accent: "#F4A300",
          error: "#C0392B",
          warning: "#F4A300",
          info: "#00A99D",
          success: "#00A99D"
        }
      }
    }
  },
  pwa: {
    // ─── Manifest PWA ─────────────────────────────────────────────────────────
    manifest: {
      name: 'CameroHealth — MINSANTE',
      short_name: 'CameroHealth',
      description: 'Système national de surveillance épidémiologique et de gestion clinique',
      theme_color: '#003366',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      lang: 'fr'
    },
    // ─── Workbox (Service Worker) ──────────────────────────────────────────────
    workbox: {
      // Cache les assets statiques (JS, CSS, fonts) pour le mode hors-ligne
      // IMPORTANT : les données de patients ne sont jamais mises en cache
      runtimeCaching: [
        {
          urlPattern: 'https://fonts.googleapis.com/.*',
          handler: 'cacheFirst',
          strategyOptions: { cacheName: 'google-fonts', cacheExpiration: { maxAgeSeconds: 60 * 60 * 24 * 30 } }
        }
      ]
    }
  },
  /*
   ** Build configuration
   */
  build: {
    /*
     ** You can extend webpack config here
     */
    extend(config, ctx) {
      if (ctx && ctx.isClient) {
        config.optimization.splitChunks.maxSize = 256000;
      }
      // Add support for .mjs files in node_modules (required for Supabase/Webpack 4)
      config.module.rules.push({
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto'
      });
    },
    loaders: {
      scss: {
        implementation: require("sass"),
        sassOptions: {
          fiber: false
        }
      }
    },
    transpile: [
      /^vue2-google-maps($|\/)/,
      /@supabase/,
      /iceberg-js/
    ]
  }
};
