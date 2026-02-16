# Good Job - Internal Recognition & Reward Platform

> Peer-to-peer recognition system where employees send points to colleagues, tied to core values, and redeem for rewards.

## Quick Start

### Prerequisites
- Node.js 20+
- Docker Desktop

### Setup

```bash
# Clone & install
git clone <repo-url>
cd good-job
npm install

# Start infrastructure
docker compose up -d

# IMPORTANT: Stop native PostgreSQL if running (conflicts with Docker)
brew services stop postgresql@14  # or your version
brew services stop postgresql

# Environment files (each service has its own .env)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env  # optional, for API URL config
# Edit apps/api/.env (set JWT_SECRET at minimum)

# Database
npm run db:migrate
npm run db:seed    # Optional: demo data

# Development
npm run dev:api    # http://localhost:3000
npm run dev:web    # http://localhost:5173
```

## Architecture

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** NestJS 11, TypeORM, PostgreSQL 16, Redis 7
- **Real-time:** SSE + Redis Pub/Sub
- **AI:** Gemini embeddings + pgvector (semantic search)

### Why These Choices?

| Decision | Choice | Rationale |
|:---|:---|:---|
| NestJS | Backend framework | Enterprise-grade DI, modular, TypeORM integration |
| PostgreSQL | Database | ACID transactions, pgvector for AI search |
| Redis Pub/Sub | Real-time | Cross-instance event broadcasting for SSE |
| SSE over WebSocket | Feed updates | Simpler, HTTP-native, unidirectional |
| Vite | Build tool | Fast HMR, lightweight, great DX |

## Project Structure

```
(repo root)
├── apps/
│   ├── api/    # NestJS backend
│   └── web/    # React frontend
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Environment Variables

Each service has its own `.env` file:
- Backend: [`apps/api/.env.example`](apps/api/.env.example)
- Frontend: [`apps/web/.env.example`](apps/web/.env.example)

## Testing

```bash
npm run test        # All tests
npm run test:api    # Backend (Jest)
# npm run test:web  # Frontend (Vitest - not configured yet)
```

## Docker

```bash
docker compose up -d      # Start PostgreSQL + Redis
docker compose down       # Stop all
```

## Development

```bash
# Install dependencies
npm install

# Run API
npm run dev:api

# Run Web
npm run dev:web

# Lint
npm run lint

# Format
npm run format

# Build
npm run build
```

## Database Management

```bash
# Generate migration
cd apps/api
npm run migration:generate --name=MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert

# Seed data
npm run db:seed
```

## License

Private - Amanotes Coding Test
