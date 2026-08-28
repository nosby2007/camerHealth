# ─── CameroHealth Web — production image ────────────────────────────────────
# Nuxt runs in `mode: "spa"` (see nuxt.config.js) with no server-side
# rendering, so the production artifact is a fully static bundle — `nuxt
# generate` (same command used for the Firebase Hosting deploy today), served
# here by a plain Nginx instead of Firebase Hosting. No Node process needed
# at runtime.

# ── Stage 1: build the static bundle ──────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# BACKEND_API_URL/API_URL are baked into the client bundle at build time —
# Nuxt has no server to read them from at runtime in SPA mode.
ARG API_URL=http://localhost:4000/api
ENV API_URL=${API_URL}
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run generate

# ── Stage 2: serve the static bundle with Nginx ──────────────────────────────
FROM nginx:1.27-alpine AS runtime

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ >/dev/null || exit 1

EXPOSE 80
