# =========================================================================
# Stage 1: Build & Package Frontend & Server Binary
# =========================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first for optimal layer caching
COPY package*.json ./
RUN npm ci

# Copy full source tree
COPY . .

# Build Vite client SPA bundle and esbuild server binary to /app/dist
RUN npm run build

# Prune devDependencies to keep runtime dependencies minimal
RUN npm prune --production

# =========================================================================
# Stage 2: Minimal Production Runtime
# =========================================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Run container as unprivileged non-root user
USER node

# Copy production node_modules and built artifacts
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

# Expose HTTP port (dynamically overridden by $PORT on Cloud Run / Render)
EXPOSE 3000

# Healthcheck for container orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT:-3000}/api/health || exit 1

# Start bundled Express production server
CMD ["node", "dist/server.cjs"]
