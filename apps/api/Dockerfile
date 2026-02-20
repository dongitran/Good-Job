# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable

# Copy workspace manifests first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY tsconfig.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/e2e/package.json ./apps/e2e/
COPY apps/infra/package.json ./apps/infra/

# Install all workspace deps (including devDeps needed for nest build)
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY apps/api ./apps/api
RUN pnpm run build:api

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Copy built output and node_modules (workspace root)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/main"]
