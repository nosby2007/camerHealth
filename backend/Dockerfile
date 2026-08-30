# ─── CameroHealth API — production image ────────────────────────────────────
# Multi-stage build: install + generate Prisma Client with dev deps available,
# then copy only what's needed for runtime into a slim final image.

# ── Stage 1: dependencies + Prisma Client generation ─────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Prisma's engine-detection step (run via the postinstall hook below) needs
# OpenSSL present to pick the right musl/OpenSSL 3.x binary target for
# Alpine — without it, prisma generate can silently pick the wrong engine.
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
COPY prisma ./prisma
# npm ci runs the "postinstall": "prisma generate" script (schema is already
# present above), so no separate `prisma generate` call is needed here.
RUN npm ci

COPY . .

# ── Stage 2: production runtime ───────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# curl is needed by the container HEALTHCHECK below; openssl is needed at
# runtime for the generated Prisma query engine to load libssl (Alpine's
# base image doesn't ship it) — see the matching install in the builder stage.
RUN apk add --no-cache curl openssl \
  && addgroup -S camerohealth && adduser -S camerohealth -G camerohealth

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY src ./src
COPY firebase.js ./firebase.js

RUN chown -R camerohealth:camerohealth /app
USER camerohealth

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:4000/api/health || exit 1

CMD ["node", "src/index.js"]
