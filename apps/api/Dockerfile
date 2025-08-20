# Multi-stage Dockerfile for API
FROM node:20-alpine AS builder
WORKDIR /app
# Copy root manifests and workspace manifests
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
# Install all deps (including dev for build)
RUN npm ci
# Copy source for API
COPY apps/api/tsconfig.json apps/api/tsconfig.json
COPY apps/api/src apps/api/src
# Build TypeScript
RUN npm --workspace apps/api run build

# --- Runtime image ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copy manifests and install only production dependencies
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --omit=dev --prefer-offline
# Copy built dist
COPY --from=builder /app/apps/api/dist apps/api/dist
# Expose API port
EXPOSE 3001
# Start the API
CMD ["node", "apps/api/dist/index.js"]
