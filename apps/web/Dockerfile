# Multi-stage Dockerfile for Web (Nuxt 3)
FROM node:20-alpine AS builder
WORKDIR /app
# Copy root manifests and workspace manifests
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
# Install deps for all workspaces
RUN npm ci
# Copy web source
COPY apps/web apps/web
# Build Nuxt (generates .output)
RUN npm --workspace apps/web run build

# --- Runtime image ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copy only needed files for runtime deps resolution
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
# Install only production dependencies
RUN npm ci --omit=dev --prefer-offline
# Copy Nuxt output
COPY --from=builder /app/apps/web/.output apps/web/.output
EXPOSE 3000
# Ensure Nuxt listens on all interfaces
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
# Start Nuxt server
CMD ["node", "apps/web/.output/server/index.mjs"]
