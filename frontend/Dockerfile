# ─── CameroHealth Web — production image ────────────────────────────────────
# Nuxt runs in `mode: "spa"` (see nuxt.config.js) with no server-side
# rendering, so the production artifact is a fully static bundle — `nuxt
# generate` (same command used for the Firebase Hosting deploy today), served
# here by a plain Nginx instead of Firebase Hosting. No Node process needed
# at runtime.

# ── Stage 1: build the static bundle ──────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Baked into the client bundle at build time — Nuxt has no server to read
# them from at runtime in SPA mode. Two names because two different HTTP
# clients exist in this codebase and read different env vars:
# services/api.js (most Vuex stores) reads BACKEND_API_URL; the few
# components using Nuxt's own $axios (nuxt.config.js `axios.baseURL`)
# read API_URL. Both must point at the same place.
ARG API_URL=http://localhost:4000/api
ENV API_URL=${API_URL}
ENV BACKEND_API_URL=${API_URL}

# nuxt.config.js hard-requires these to be non-empty (fails the build
# otherwise — see the REQUIRED_ENV check there). Both are optional
# integrations (Google Maps display, an OAuth client) not needed by every
# deployment, so an on-prem install with neither configured still needs a
# build-time value; "unconfigured" is a clearly-fake placeholder that
# satisfies the presence check without looking like a real credential.
ARG VUE_APP_GOOGLE_MAPS_API_KEY=unconfigured
ARG CLIENT_ID=unconfigured
ENV VUE_APP_GOOGLE_MAPS_API_KEY=${VUE_APP_GOOGLE_MAPS_API_KEY}
ENV CLIENT_ID=${CLIENT_ID}

COPY package.json package-lock.json ./
RUN npm ci

# Set only after npm ci — NODE_ENV=production earlier makes npm skip
# devDependencies (e.g. cross-env, needed by `npm run generate` below).
ENV NODE_ENV=production

COPY . .
RUN npm run generate

# ── Stage 2: serve the static bundle with Nginx ──────────────────────────────
FROM nginx:1.27-alpine AS runtime

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ >/dev/null || exit 1

EXPOSE 80
