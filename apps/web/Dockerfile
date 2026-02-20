# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable

# VITE_API_URL must be baked in at build time
ARG VITE_API_URL=https://api.good-job.xyz/api
ENV VITE_API_URL=$VITE_API_URL
# VITE_API_PROXY_TARGET is required by vite.config.ts at config load time (even during build)
# In production the proxy is not used — nginx handles /api routing
ARG VITE_API_PROXY_TARGET=http://api:3000
ENV VITE_API_PROXY_TARGET=$VITE_API_PROXY_TARGET

# Copy workspace manifests first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY tsconfig.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/e2e/package.json ./apps/e2e/
COPY apps/infra/package.json ./apps/infra/

# Install all workspace deps
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY apps/web ./apps/web
RUN pnpm run build:web

# Stage 2: Production — nginx to serve static files
FROM nginx:1.25-alpine AS production
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
