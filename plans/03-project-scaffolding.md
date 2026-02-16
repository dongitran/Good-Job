# Phase 03 — Project Scaffolding

## Overview

**Status**: ✅ Complete
**Goal**: Set up monorepo at repo root with `/apps/web` + `/apps/api` → running `docker-compose up` with all services
**Prerequisite**: Phase 02 Architecture Document (complete)
**Output**: Working project skeleton with all configs, ready for feature development
**Structure**: Per coding-test spec — clear `/apps/web` and `/apps/api` at repo root (no wrapper folder)

---

## Scaffolding Checklist

```
 Step 01 — Prerequisites & Environment
 Step 02 — Monorepo Root Initialization
 Step 03 — Backend (NestJS) Scaffolding
 Step 04 — Frontend (React + Vite) Scaffolding
 Step 05 — Docker Compose (PostgreSQL + Redis)
 Step 06 — Environment Configuration
 Step 07 — Database Setup (TypeORM Entities + Migrations)
 Step 08 — NestJS Module Scaffolding
 Step 09 — Frontend Project Structure
 Step 10 — Code Quality (ESLint + Prettier + Husky)
 Step 11 — GitHub Actions CI/CD
 Step 12 — README & Documentation
 Step 13 — Verification & Smoke Test
```

---

## Step 01 — Prerequisites & Environment

### Required Tools

```
Node.js 20 LTS    → Runtime (nvm use 20)
npm 10+            → Package manager (comes with Node 20)
Docker Desktop     → Containers (PostgreSQL, Redis)
Git                → Version control
NestJS CLI         → Backend scaffolding (npm i -g @nestjs/cli)
```

### Verification

```bash
node -v       # v20.x.x
npm -v        # 10.x.x
docker -v     # Docker version 2x.x.x
git -v        # git version 2.x.x
nest -v       # 11.x.x
```

---

## Step 02 — Monorepo Root Initialization

### Flow

```
Project root (repo root, already has git)
    │
    ▼
npm init (configure workspaces)
    │
    ▼
Create apps/ directory structure
    │
    ▼
Root configs (tsconfig, .gitignore, .editorconfig)
```

### 2.1 Root package.json

Tạo trực tiếp `package.json` tại repo root với nội dung:

```jsonc
{
  "name": "good-job",
  "version": "0.1.0",
  "private": true,
  "description": "Good Job - Internal Recognition & Reward Platform",
  "workspaces": [
    "apps/*"
  ],
  "scripts": {
    "dev": "npm run dev --workspaces --if-present",
    "dev:api": "npm run start:dev -w apps/api",
    "dev:web": "npm run dev -w apps/web",
    "build": "npm run build --workspaces --if-present",
    "build:api": "npm run build -w apps/api",
    "build:web": "npm run build -w apps/web",
    "test": "npm run test --workspaces --if-present",
    "test:api": "npm run test -w apps/api",
    "test:web": "npm run test -w apps/web",
    "lint": "npm run lint --workspaces --if-present",
    "format": "prettier --write \"apps/**/*.{ts,tsx,json,css}\"",
    "db:migrate": "npm run migration:run -w apps/api",
    "db:seed": "npm run seed -w apps/api",
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "prepare": "husky"
  },
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

### 2.2 Directory Structure (Create Folders)

```bash
mkdir -p apps/api apps/web
mkdir -p .github/workflows
```

### 2.3 Root .gitignore

```gitignore
# Dependencies
node_modules/

# Build outputs
dist/
build/
.next/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Docker volumes
pgdata/

# Coverage
coverage/

# Logs
*.log
npm-debug.log*
```

### 2.4 Root .editorconfig

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

### 2.5 Root tsconfig.json (Base Config)

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

---

## Step 03 — Backend (NestJS) Scaffolding

### Flow

```
cd apps/
    │
    ▼
nest new api --package-manager npm --skip-git
    │
    ▼
Install dependencies (TypeORM, Passport, Redis, etc.)
    │
    ▼
Configure NestJS (main.ts, app.module.ts)
    │
    ▼
Set up module structure
```

### 3.1 Scaffold NestJS App

```bash
cd apps && nest new api --package-manager npm --skip-git --strict && cd ..
```

### 3.2 Install Backend Dependencies

```bash
# Core NestJS packages
npm install -w apps/api \
  @nestjs/config \
  @nestjs/typeorm \
  @nestjs/passport \
  @nestjs/jwt \
  @nestjs/throttler \
  @nestjs/event-emitter \
  @nestjs/schedule

# Database
npm install -w apps/api \
  typeorm \
  pg \
  ioredis

# Auth
npm install -w apps/api \
  passport \
  passport-jwt \
  passport-google-oauth20 \
  bcryptjs

# Validation & Utils
npm install -w apps/api \
  class-validator \
  class-transformer \
  helmet \
  uuid

# AI (Gemini for semantic search & summaries)
npm install -w apps/api \
  @google/generative-ai

# Dev dependencies
npm install -w apps/api -D \
  @types/passport-jwt \
  @types/passport-google-oauth20 \
  @types/bcryptjs \
  @types/uuid \
  ts-node \
  tsconfig-paths
```

### 3.3 Backend tsconfig.json

```jsonc
// apps/api/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "target": "ES2022",
    "outDir": "./dist",
    "baseUrl": "./",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

### 3.4 Health Check Controller

```typescript
// apps/api/src/app.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Good Job API',
    };
  }
}
```

### 3.5 main.ts Configuration

```typescript
// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: process.env.APP_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip unknown properties
      forbidNonWhitelisted: true, // Throw on unknown properties
      transform: true,           // Auto-transform types
    }),
  );

  const port = process.env.API_PORT || 3000;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}
bootstrap();
```

### 3.6 app.module.ts Configuration

```typescript
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import {
  appConfig,
  dbConfig,
  redisConfig,
  jwtConfig,
  googleConfig,
  pointsConfig,
  geminiConfig,
  typeormConfig,
} from './config/app.config';
import { RedisModule } from './config/redis.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    // Environment - Load all configs
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
      load: [
        appConfig,
        dbConfig,
        redisConfig,
        jwtConfig,
        googleConfig,
        pointsConfig,
        geminiConfig,
        typeormConfig,
      ],
    }),

    // Database - Use typeorm config
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('typeorm'),
    }),

    // Redis - Global module
    RedisModule,

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,   // 1 minute
      limit: 100,   // 100 requests
    }]),

    // Event bus
    EventEmitterModule.forRoot(),

    // CRON scheduler
    ScheduleModule.forRoot(),

    // Feature modules (to be added)
    // AuthModule,
    // UsersModule,
    // OrganizationsModule,
    // KudosModule,
    // RewardsModule,
    // PointsModule,
    // FeedModule,
    // AdminModule,
    // AiModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
```

### 3.7 Backend Directory Structure

```bash
# Create module directories
mkdir -p apps/api/src/{modules,common,database,events,config}

# Modules
mkdir -p apps/api/src/modules/{auth,users,organizations,kudos,rewards,points,feed,admin,ai}

# Sub-directories per module
for mod in auth users organizations kudos rewards points feed admin ai; do
  mkdir -p apps/api/src/modules/$mod/{dto,guards,strategies,decorators}
done

# Common
mkdir -p apps/api/src/common/{decorators,filters,interceptors,pipes,guards}

# Database
mkdir -p apps/api/src/database/{entities,migrations,seeds}

# Config
mkdir -p apps/api/src/config
```

**Result:**

```
apps/api/src/
├── modules/
│   ├── auth/
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── strategies/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   └── auth.service.ts
│   ├── users/
│   ├── organizations/
│   ├── kudos/
│   ├── rewards/
│   ├── points/
│   ├── feed/
│   ├── admin/
│   └── ai/
├── common/
│   ├── decorators/        ← @CurrentUser, @Roles, @OrgTenant
│   ├── filters/           ← HttpExceptionFilter
│   ├── interceptors/      ← TransformInterceptor, LoggingInterceptor
│   ├── pipes/             ← Custom validation pipes
│   └── guards/            ← ThrottlerBehindProxy
├── database/
│   ├── entities/          ← TypeORM entities
│   ├── migrations/        ← DB migrations
│   └── seeds/             ← Demo data seeder
├── events/                ← Event definitions
├── config/                ← Configuration files
├── app.module.ts
└── main.ts
```

---

## Step 04 — Frontend (React + Vite) Scaffolding

### Flow

```
cd apps/
    │
    ▼
npm create vite@latest web -- --template react-ts
    │
    ▼
Install dependencies (Tailwind, shadcn/ui, TanStack Query, etc.)
    │
    ▼
Configure Tailwind + shadcn/ui
    │
    ▼
Set up project structure (pages, components, hooks, etc.)
```

### 4.1 Scaffold Vite + React

```bash
cd apps && npm create vite@latest web -- --template react-ts && cd ..
```

### 4.2 Install Frontend Dependencies

```bash
# UI & Styling
npm install -w apps/web \
  tailwindcss @tailwindcss/vite \
  class-variance-authority \
  clsx \
  tailwind-merge \
  lucide-react

# State & Data
npm install -w apps/web \
  @tanstack/react-query \
  zustand \
  axios

# Routing
npm install -w apps/web \
  react-router

# Charts (Admin dashboard)
npm install -w apps/web \
  recharts

# Utilities
npm install -w apps/web \
  date-fns \
  sonner

# Dev dependencies
npm install -w apps/web -D \
  @types/node
```

### 4.3 Tailwind CSS 4 Setup

```typescript
// apps/web/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

```css
/* apps/web/src/index.css */
@import "tailwindcss";

/* Design System from Phase 01 */
@theme {
  --color-primary: #7C3AED;
  --color-blue: #3B82F6;
  --color-pink: #EC4899;
  --color-orange: #F97316;
  --color-cyan: #06B6D4;
  --color-green: #10B981;
  --color-yellow: #F59E0B;
  --color-dark: #0F172A;
  --color-dark-alt: #1E293B;

  --font-display: 'Poppins', sans-serif;
  --font-body: 'Inter', sans-serif;
}
```

### 4.4 shadcn/ui Setup

```bash
cd apps/web && npx shadcn@latest init && cd ../..
# Choose: New York style, Zinc color, CSS variables: yes
```

**Install commonly needed components:**

```bash
cd apps/web && npx shadcn@latest add button input label card dialog \
  dropdown-menu avatar badge separator tabs toast \
  select textarea slider checkbox form popover \
  command sheet skeleton tooltip scroll-area && cd ../..
```

### 4.5 Frontend tsconfig.json

```jsonc
// apps/web/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "noEmit": true
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

### 4.6 Frontend Directory Structure

```bash
# Create directory structure
mkdir -p apps/web/src/{components,pages,hooks,lib,stores,types}

# Components sub-directories
mkdir -p apps/web/src/components/{ui,layout,kudos,rewards,admin}

# Pages sub-directories
mkdir -p apps/web/src/pages/{auth,admin}
```

**Result:**

```
apps/web/src/
├── components/
│   ├── ui/                ← shadcn/ui primitives (auto-generated)
│   ├── layout/            ← AppShell, Sidebar, TopBar, BottomNav
│   ├── kudos/             ← KudoCard, KudoFeed, GiveKudoModal
│   ├── rewards/           ← RewardCard, RewardGrid, RedeemModal
│   └── admin/             ← Charts, Leaderboard, UserTable
├── pages/
│   ├── Landing.tsx
│   ├── Dashboard.tsx
│   ├── Rewards.tsx
│   ├── Profile.tsx
│   ├── KudoDetail.tsx
│   ├── auth/
│   │   ├── Login.tsx
│   │   └── Onboarding.tsx
│   └── admin/
│       ├── AdminDashboard.tsx
│       ├── UserManagement.tsx
│       ├── RewardManagement.tsx
│       └── OrgSettings.tsx
├── hooks/
│   ├── use-auth.ts        ← Auth state & actions
│   ├── use-kudos.ts       ← Kudos queries & mutations
│   ├── use-rewards.ts     ← Rewards queries & mutations
│   ├── use-points.ts      ← Points balance & history
│   └── use-sse.ts         ← SSE connection hook
├── lib/
│   ├── api.ts             ← Axios instance with interceptors
│   ├── utils.ts           ← cn() helper, formatters
│   └── constants.ts       ← App constants, routes
├── stores/
│   └── auth-store.ts      ← User session state
├── types/
│   └── index.ts           ← Shared TypeScript types
├── App.tsx                ← Router setup
├── main.tsx               ← Entry point
└── index.css              ← Tailwind + design tokens
```

---

## Step 05 — Docker Compose

### 5.1 docker-compose.yml

```yaml
# docker-compose.yml (project root)
services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: goodjob-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: goodjob
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: goodjob-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

### 5.2 Start Services

```bash
docker compose up -d

# Verify
docker compose ps
# postgres   running   0.0.0.0:5432->5432/tcp
# redis      running   0.0.0.0:6379->6379/tcp
```

---

## Step 06 — Environment Configuration

### 6.1 .env.example (Project Root)

```bash
# ─────────────────────────────────────
# Good Job - Environment Variables
# ─────────────────────────────────────

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/goodjob

# Redis
REDIS_URL=redis://localhost:6379

# JWT Authentication
JWT_SECRET=change-this-to-a-random-secret-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Google OAuth2 (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Gemini AI (for AI features)
GEMINI_API_KEY=

# Application
APP_URL=http://localhost:5173
API_PORT=3000
NODE_ENV=development

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# Default Organization Settings
DEFAULT_MONTHLY_BUDGET=200
DEFAULT_MIN_POINTS=10
DEFAULT_MAX_POINTS=50
```

### 6.2 Create .env from Example

```bash
cp .env.example .env
# Edit .env with actual values (JWT_SECRET at minimum)
```

### 6.3 All Config Exports (Single File)

Create single config file with all configurations:

```typescript
// apps/api/src/config/app.config.ts
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.API_PORT, 10) || 3000,
  url: process.env.APP_URL || 'http://localhost:5173',
  env: process.env.NODE_ENV || 'development',
}));

export const dbConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
}));

export const googleConfig = registerAs('google', () => ({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackUrl: process.env.GOOGLE_CALLBACK_URL,
}));

export const pointsConfig = registerAs('points', () => ({
  defaultMonthlyBudget: parseInt(process.env.DEFAULT_MONTHLY_BUDGET, 10) || 200,
  minPoints: parseInt(process.env.DEFAULT_MIN_POINTS, 10) || 10,
  maxPoints: parseInt(process.env.DEFAULT_MAX_POINTS, 10) || 50,
}));

export const geminiConfig = registerAs('gemini', () => ({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-2.0-flash-exp',
  embeddingModel: 'text-embedding-004',
}));

// TypeORM config
export const typeormConfig = registerAs('typeorm', (): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../database/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false,  // Always use migrations
  logging: process.env.NODE_ENV === 'development',
}));
```

### 6.4 Redis Module Setup

```typescript
// apps/api/src/config/redis.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const redis = new Redis({
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          password: configService.get('redis.password'),
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });

        redis.on('connect', () => {
          console.log('✅ Redis connected');
        });

        redis.on('error', (err) => {
          console.error('❌ Redis error:', err);
        });

        return redis;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
```

**Usage in other modules:**

```typescript
// Example: Inject Redis in a service
import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from '../config/redis.module';
import Redis from 'ioredis';

@Injectable()
export class FeedService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async publishKudo(kudoId: string) {
    await this.redis.publish('kudos:new', kudoId);
  }

  async cacheKudosFeed(orgId: string, data: any) {
    await this.redis.setex(`feed:${orgId}`, 300, JSON.stringify(data)); // 5 min TTL
  }
}
```

---

## Step 07 — Database Setup (TypeORM Entities + Migrations)

### Flow

```
Define entities (TypeORM decorators)
    │
    ▼
Configure TypeORM CLI (data-source.ts)
    │
    ▼
Generate initial migration
    │
    ▼
Run migration → tables created
    │
    ▼
Create seed script (demo data)
```

### 7.1 TypeORM Data Source (CLI Config)

```typescript
// apps/api/src/database/data-source.ts
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
```

### 7.2 TypeORM Scripts (apps/api/package.json)

```jsonc
// Add to apps/api/package.json scripts:
{
  "scripts": {
    "typeorm": "ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js -d src/database/data-source.ts",
    "migration:generate": "npm run typeorm migration:generate -- src/database/migrations/$npm_config_name",
    "migration:create": "npm run typeorm migration:create -- src/database/migrations/$npm_config_name",
    "migration:run": "npm run typeorm migration:run",
    "migration:revert": "npm run typeorm migration:revert",
    "seed": "ts-node src/database/seeds/run-seed.ts"
  }
}
```

### 7.3 Base Entity (Audit Fields)

```typescript
// apps/api/src/database/entities/base.entity.ts
import { CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Column } from 'typeorm';

export abstract class BaseEntity {
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;  // User ID who created this record

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: string;  // User ID who last updated this record

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;  // Soft delete timestamp

  @Column({ name: 'deleted_by', nullable: true })
  deletedBy?: string;  // User ID who deleted this record
}
```

### 7.4 Entity Definitions

**Organization Entity:**

```typescript
// apps/api/src/database/entities/organization.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { CoreValue } from './core-value.entity';

export enum OrgPlan {
  FREE = 'free',
  PRO_TRIAL = 'pro_trial',
  PRO = 'pro',
}

@Entity('organizations')
export class Organization extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  industry: string;

  @Column({ name: 'company_size', nullable: true })
  companySize: string;

  @Column({ type: 'jsonb', default: {} })
  settings: {
    monthlyBudget?: number;
    minPoints?: number;
    maxPoints?: number;
  };

  @Column({ type: 'enum', enum: OrgPlan, default: OrgPlan.PRO_TRIAL })
  plan: OrgPlan;

  @Column({ name: 'trial_ends_at', type: 'timestamptz', nullable: true })
  trialEndsAt: Date;

  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @OneToMany(() => CoreValue, (value) => value.organization)
  coreValues: CoreValue[];
}
```

**User Entity:**

```typescript
// apps/api/src/database/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';

export enum UserRole {
  MEMBER = 'member',
  ADMIN = 'admin',
  OWNER = 'owner',
}

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash', nullable: true })
  passwordHash: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Index()
  @Column({ name: 'org_id' })
  orgId: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.MEMBER })
  role: UserRole;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  department: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => Organization, (org) => org.users)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;
}
```

**CoreValue Entity:**

```typescript
// apps/api/src/database/entities/core-value.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';

@Entity('core_values')
export class CoreValue extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id' })
  orgId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  emoji: string;

  @Column({ nullable: true })
  color: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => Organization, (org) => org.coreValues)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;
}
```

**Kudo Entity:**

```typescript
// apps/api/src/database/entities/kudo.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { CoreValue } from './core-value.entity';
import { KudoReaction } from './kudo-reaction.entity';
import { KudoComment } from './kudo-comment.entity';

@Entity('kudos')
@Index('idx_kudos_org_created', ['orgId', 'createdAt'])
export class Kudo extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id' })
  orgId: string;

  @Index('idx_kudos_giver')
  @Column({ name: 'giver_id' })
  giverId: string;

  @Index('idx_kudos_receiver')
  @Column({ name: 'receiver_id' })
  receiverId: string;

  @Column({ type: 'int' })
  points: number;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'value_id' })
  valueId: string;

  @Column({ name: 'is_private', default: false })
  isPrivate: boolean;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'giver_id' })
  giver: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  @ManyToOne(() => CoreValue)
  @JoinColumn({ name: 'value_id' })
  coreValue: CoreValue;

  @OneToMany(() => KudoReaction, (reaction) => reaction.kudo)
  reactions: KudoReaction[];

  @OneToMany(() => KudoComment, (comment) => comment.kudo)
  comments: KudoComment[];
}
```

**KudoReaction Entity:**

```typescript
// apps/api/src/database/entities/kudo-reaction.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { Kudo } from './kudo.entity';
import { User } from './user.entity';

@Entity('kudo_reactions')
@Unique('idx_reaction_unique', ['kudoId', 'userId', 'emoji'])
export class KudoReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'kudo_id' })
  kudoId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 10 })
  emoji: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Kudo, (kudo) => kudo.reactions)
  @JoinColumn({ name: 'kudo_id' })
  kudo: Kudo;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
```

**KudoComment Entity:**

```typescript
// apps/api/src/database/entities/kudo-comment.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Kudo } from './kudo.entity';
import { User } from './user.entity';

@Entity('kudo_comments')
export class KudoComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'kudo_id' })
  kudoId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Kudo, (kudo) => kudo.comments)
  @JoinColumn({ name: 'kudo_id' })
  kudo: Kudo;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
```

**PointLedger Entity:**

```typescript
// apps/api/src/database/entities/point-ledger.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';

export enum LedgerType {
  GIVE = 'give',
  RECEIVE = 'receive',
  REDEEM = 'redeem',
  BUDGET_RESET = 'reset',
}

export enum BalanceType {
  GIVEABLE = 'giveable',
  REDEEMABLE = 'redeemable',
}

@Entity('point_ledger')
@Index('idx_ledger_user_type', ['userId', 'balanceType'])
export class PointLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id' })
  orgId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: LedgerType })
  type: LedgerType;

  @Column({ type: 'int' })
  amount: number;

  @Column({ name: 'balance_type', type: 'enum', enum: BalanceType })
  balanceType: BalanceType;

  @Column({ name: 'reference_type', nullable: true })
  referenceType: string;

  @Column({ name: 'reference_id', nullable: true })
  referenceId: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
```

**GivingBudget Entity:**

```typescript
// apps/api/src/database/entities/giving-budget.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity('giving_budgets')
@Unique('idx_budget_user_month', ['userId', 'month'])
export class GivingBudget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id' })
  orgId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'date' })
  month: Date;

  @Column({ name: 'total_budget', type: 'int' })
  totalBudget: number;

  @Column({ type: 'int', default: 0 })
  spent: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
```

**Reward Entity:**

```typescript
// apps/api/src/database/entities/reward.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum RewardCategory {
  SWAG = 'swag',
  GIFT_CARD = 'gift_card',
  TIME_OFF = 'time_off',
  EXPERIENCE = 'experience',
}

@Entity('rewards')
export class Reward extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id' })
  orgId: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'points_cost', type: 'int' })
  pointsCost: number;

  @Column({ type: 'enum', enum: RewardCategory, default: RewardCategory.SWAG })
  category: RewardCategory;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ type: 'int', default: -1 })
  stock: number;  // -1 = unlimited

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
```

**Redemption Entity:**

```typescript
// apps/api/src/database/entities/redemption.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';
import { Reward } from './reward.entity';

export enum RedemptionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  FULFILLED = 'fulfilled',
  REJECTED = 'rejected',
}

@Entity('redemptions')
export class Redemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'org_id' })
  orgId: string;

  @Column({ name: 'reward_id' })
  rewardId: string;

  @Index('idx_redemptions_user')
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'points_spent', type: 'int' })
  pointsSpent: number;

  @Column({
    type: 'enum',
    enum: RedemptionStatus,
    default: RedemptionStatus.PENDING,
  })
  status: RedemptionStatus;

  @Column({ name: 'idempotency_key', unique: true })
  idempotencyKey: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'fulfilled_at', type: 'timestamptz', nullable: true })
  fulfilledAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Reward)
  @JoinColumn({ name: 'reward_id' })
  reward: Reward;
}
```

### 7.4 Entity Index File

```typescript
// apps/api/src/database/entities/index.ts
export { BaseEntity } from './base.entity';
export { Organization, OrgPlan } from './organization.entity';
export { User, UserRole } from './user.entity';
export { CoreValue } from './core-value.entity';
export { Kudo } from './kudo.entity';
export { KudoReaction } from './kudo-reaction.entity';
export { KudoComment } from './kudo-comment.entity';
export { PointLedger, LedgerType, BalanceType } from './point-ledger.entity';
export { GivingBudget } from './giving-budget.entity';
export { Reward, RewardCategory } from './reward.entity';
export { Redemption, RedemptionStatus } from './redemption.entity';
```

### 7.5 Generate & Run Migration

```bash
# Generate migration from entities
cd apps/api
npm run migration:generate --name=InitialSchema

# Run migration
npm run migration:run
cd ../..
```

### 7.6 Enable pgvector Extension

```typescript
// apps/api/src/database/migrations/1700000000000-EnablePgvector.ts
// NOTE: Create this file MANUALLY first, then run 7.5 to generate schema migration
import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnablePgvector1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS vector');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP EXTENSION IF EXISTS vector');
  }
}
```

**Migration Order (IMPORTANT):**
1. First, create `1700000000000-EnablePgvector.ts` manually (copy code above)
2. Then, run step 7.5 to auto-generate schema migration (will have timestamp > 1700000000000)
3. Run `npm run migration:run` → pgvector extension installed first, then schema created

### 7.7 Seed Script (Demo Data)

```typescript
// apps/api/src/database/seeds/run-seed.ts
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import dataSource from '../data-source';
import {
  Organization,
  OrgPlan,
  User,
  UserRole,
  CoreValue,
  Kudo,
  Reward,
  RewardCategory,
  GivingBudget,
  PointLedger,
  LedgerType,
  BalanceType,
} from '../entities';

async function seed() {
  const ds: DataSource = await dataSource.initialize();
  console.log('🌱 Seeding database...');

  // 1. Create Organization
  const org = ds.getRepository(Organization).create({
    name: 'Amanotes Demo',
    slug: 'amanotes-demo',
    industry: 'Gaming',
    companySize: '100-500',
    settings: {
      monthlyBudget: 200,
      minPoints: 10,
      maxPoints: 50,
    },
    plan: OrgPlan.PRO_TRIAL,
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
  });
  await ds.getRepository(Organization).save(org);
  console.log('✅ Organization created');

  // 2. Create Core Values
  const coreValues = [
    { name: 'Teamwork', emoji: '🤝', color: '#3B82F6' },
    { name: 'Innovation', emoji: '💡', color: '#7C3AED' },
    { name: 'Ownership', emoji: '🎯', color: '#F97316' },
    { name: 'Excellence', emoji: '⭐', color: '#F59E0B' },
  ];

  const savedValues = [];
  for (const cv of coreValues) {
    const value = ds.getRepository(CoreValue).create({
      orgId: org.id,
      ...cv,
    });
    savedValues.push(await ds.getRepository(CoreValue).save(value));
  }
  console.log('✅ Core values created');

  // 3. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);
  const users = [
    { email: 'admin@amanotes.com', fullName: 'Admin User', role: UserRole.ADMIN, department: 'Management' },
    { email: 'alice@amanotes.com', fullName: 'Alice Johnson', role: UserRole.MEMBER, department: 'Engineering' },
    { email: 'bob@amanotes.com', fullName: 'Bob Smith', role: UserRole.MEMBER, department: 'Design' },
    { email: 'charlie@amanotes.com', fullName: 'Charlie Lee', role: UserRole.MEMBER, department: 'Engineering' },
  ];

  const savedUsers = [];
  for (const u of users) {
    const user = ds.getRepository(User).create({
      orgId: org.id,
      passwordHash,
      avatarUrl: `https://i.pravatar.cc/150?u=${u.email}`,
      ...u,
    });
    savedUsers.push(await ds.getRepository(User).save(user));
  }
  console.log('✅ Users created');

  // 4. Create Giving Budgets
  const currentMonth = new Date(new Date().setDate(1)); // First day of current month
  for (const user of savedUsers) {
    const budget = ds.getRepository(GivingBudget).create({
      orgId: org.id,
      userId: user.id,
      month: currentMonth,
      totalBudget: 200,
      spent: 0,
    });
    await ds.getRepository(GivingBudget).save(budget);

    // Initial ledger entry
    const ledger = ds.getRepository(PointLedger).create({
      orgId: org.id,
      userId: user.id,
      type: LedgerType.BUDGET_RESET,
      amount: 200,
      balanceType: BalanceType.GIVEABLE,
      description: 'Monthly budget allocation',
    });
    await ds.getRepository(PointLedger).save(ledger);
  }
  console.log('✅ Giving budgets created');

  // 5. Create Sample Kudos
  const kudos = [
    {
      giverId: savedUsers[1].id,
      receiverId: savedUsers[2].id,
      points: 30,
      message: 'Amazing work on the new UI designs! The user flow is so intuitive.',
      valueId: savedValues[0].id, // Teamwork
    },
    {
      giverId: savedUsers[2].id,
      receiverId: savedUsers[3].id,
      points: 50,
      message: 'Your code refactoring saved us hours of debugging. Excellent architecture thinking!',
      valueId: savedValues[1].id, // Innovation
    },
    {
      giverId: savedUsers[3].id,
      receiverId: savedUsers[1].id,
      points: 40,
      message: 'Taking ownership of that critical bug fix. You rock! 🚀',
      valueId: savedValues[2].id, // Ownership
    },
  ];

  for (const k of kudos) {
    const kudo = ds.getRepository(Kudo).create({
      orgId: org.id,
      ...k,
    });
    await ds.getRepository(Kudo).save(kudo);

    // Update budgets & ledgers
    const budget = await ds.getRepository(GivingBudget).findOne({
      where: { userId: k.giverId, month: currentMonth },
    });
    budget.spent += k.points;
    await ds.getRepository(GivingBudget).save(budget);

    // Giver ledger (deduct giveable)
    const giverLedger = ds.getRepository(PointLedger).create({
      orgId: org.id,
      userId: k.giverId,
      type: LedgerType.GIVE,
      amount: -k.points,
      balanceType: BalanceType.GIVEABLE,
      referenceType: 'kudo',
      referenceId: kudo.id,
      description: `Gave kudos to ${savedUsers.find((u) => u.id === k.receiverId).fullName}`,
    });
    await ds.getRepository(PointLedger).save(giverLedger);

    // Receiver ledger (add redeemable)
    const receiverLedger = ds.getRepository(PointLedger).create({
      orgId: org.id,
      userId: k.receiverId,
      type: LedgerType.RECEIVE,
      amount: k.points,
      balanceType: BalanceType.REDEEMABLE,
      referenceType: 'kudo',
      referenceId: kudo.id,
      description: `Received kudos from ${savedUsers.find((u) => u.id === k.giverId).fullName}`,
    });
    await ds.getRepository(PointLedger).save(receiverLedger);
  }
  console.log('✅ Kudos created');

  // 6. Create Rewards
  const rewards = [
    { name: 'Company Hoodie', pointsCost: 500, category: RewardCategory.SWAG, stock: 20 },
    { name: 'Coffee Gift Card $25', pointsCost: 300, category: RewardCategory.GIFT_CARD, stock: 50 },
    { name: 'Friday Afternoon Off', pointsCost: 1000, category: RewardCategory.TIME_OFF, stock: -1 },
    { name: 'Team Lunch Budget $100', pointsCost: 800, category: RewardCategory.EXPERIENCE, stock: 10 },
  ];

  for (const r of rewards) {
    const reward = ds.getRepository(Reward).create({
      orgId: org.id,
      ...r,
    });
    await ds.getRepository(Reward).save(reward);
  }
  console.log('✅ Rewards created');

  await ds.destroy();
  console.log('🎉 Seeding complete!');
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
```

**To run seed:**
```bash
npm run db:seed
```

---

## Step 08 — NestJS Module Scaffolding

### Module Creation Order

```
1. Auth Module         ← Must be first (other modules depend on guards)
2. Users Module        ← User CRUD
3. Organizations Module ← Org management
4. Points Module       ← Ledger & balance (kudos & rewards depend on this)
5. Kudos Module        ← Core feature
6. Rewards Module      ← Redemption
7. Feed Module         ← SSE real-time
8. Admin Module        ← Analytics & management
9. AI Module           ← Innovation features
```

### Scaffold All Modules

```bash
cd apps/api

# Generate modules with controller + service (run from apps/api/)
nest g module modules/auth --no-spec
nest g controller modules/auth --no-spec
nest g service modules/auth --no-spec

nest g module modules/users --no-spec
nest g controller modules/users --no-spec
nest g service modules/users --no-spec

nest g module modules/organizations --no-spec
nest g controller modules/organizations --no-spec
nest g service modules/organizations --no-spec

nest g module modules/points --no-spec
nest g controller modules/points --no-spec
nest g service modules/points --no-spec

nest g module modules/kudos --no-spec
nest g controller modules/kudos --no-spec
nest g service modules/kudos --no-spec

nest g module modules/rewards --no-spec
nest g controller modules/rewards --no-spec
nest g service modules/rewards --no-spec

nest g module modules/feed --no-spec
nest g controller modules/feed --no-spec
nest g service modules/feed --no-spec

nest g module modules/admin --no-spec
nest g controller modules/admin --no-spec
nest g service modules/admin --no-spec

nest g module modules/ai --no-spec
nest g controller modules/ai --no-spec
nest g service modules/ai --no-spec

cd ../..
```

### Common Decorators

```typescript
// apps/api/src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
```

```typescript
// apps/api/src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../database/entities';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

### Global Exception Filter

```typescript
// apps/api/src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    this.logger.error(
      `${request.method} ${request.url} ${status}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(typeof message === 'string' ? { message } : message),
    });
  }
}
```

---

## Step 09 — Frontend Project Structure

### 9.1 API Client (Axios)

```typescript
// apps/web/src/lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF protection
  },
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post('/api/auth/refresh', null, {
          withCredentials: true,
        });
        localStorage.setItem('access_token', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);
```

### 9.2 Utils (cn helper)

```typescript
// apps/web/src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPoints(points: number): string {
  return `${points.toLocaleString()} pts`;
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}
```

### 9.3 Auth Store (Zustand)

```typescript
// apps/web/src/stores/auth-store.ts
import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'member' | 'admin' | 'owner';
  orgId: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, isAuthenticated: false });
  },
}));
```

### 9.4 App Router Setup

```typescript
// apps/web/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Pages (placeholder imports)
import Landing from './pages/Landing';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,       // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />

          {/* Auth */}
          {/* <Route path="/login" element={<Login />} /> */}
          {/* <Route path="/onboarding" element={<Onboarding />} /> */}

          {/* Authenticated */}
          {/* <Route element={<AppShell />}> */}
          {/*   <Route path="/dashboard" element={<Dashboard />} /> */}
          {/*   <Route path="/rewards" element={<Rewards />} /> */}
          {/*   <Route path="/profile" element={<Profile />} /> */}
          {/*   <Route path="/kudos/:id" element={<KudoDetail />} /> */}
          {/*   <Route path="/admin" element={<AdminDashboard />} /> */}
          {/*   <Route path="/admin/users" element={<UserManagement />} /> */}
          {/*   <Route path="/admin/rewards" element={<RewardManagement />} /> */}
          {/*   <Route path="/admin/settings" element={<OrgSettings />} /> */}
          {/* </Route> */}
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

### 9.5 Landing Page Placeholder

```typescript
// apps/web/src/pages/Landing.tsx
export default function Landing() {
  return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white font-display">
          Good Job
        </h1>
        <p className="mt-4 text-lg text-gray-400 font-body">
          Internal Recognition & Reward Platform
        </p>
        <button className="mt-8 px-8 py-3 bg-primary text-white rounded-2xl font-semibold hover:opacity-90 transition">
          Get Started
        </button>
      </div>
    </div>
  );
}
```

---

## Step 10 — Code Quality (ESLint + Prettier + Husky)

### 10.1 Prettier (Root)

```jsonc
// .prettierrc (project root)
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "lf"
}
```

```gitignore
# .prettierignore
node_modules
dist
build
coverage
*.min.js
```

### 10.2 ESLint (Backend)

```bash
# Backend ESLint comes pre-configured with NestJS CLI
# Verify: apps/api/.eslintrc.js exists
```

### 10.3 ESLint (Frontend)

```bash
# Frontend ESLint comes pre-configured with Vite template
# Verify: apps/web/eslint.config.js exists
```

### 10.4 Husky + lint-staged

```bash
# Install
npm install -D husky lint-staged

# Init husky
npx husky init

# Create pre-commit hook
echo 'npx lint-staged' > .husky/pre-commit
```

```jsonc
// Add to root package.json:
{
  "lint-staged": {
    "apps/**/*.{ts,tsx}": [
      "prettier --write",
      "eslint --fix --no-warn-ignored"
    ],
    "apps/**/*.{json,css,md}": [
      "prettier --write"
    ]
  }
}
```

---

## Step 11 — GitHub Actions CI/CD

### 11.1 CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - name: Type check (API)
        run: npx tsc --noEmit -p apps/api/tsconfig.json
      - name: Type check (Web)
        run: npx tsc --noEmit -p apps/web/tsconfig.json

  test-api:
    name: API Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: goodjob_test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/goodjob_test
      REDIS_URL: redis://localhost:6379
      JWT_SECRET: test-secret
      NODE_ENV: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - name: Run migrations
        run: npm run db:migrate
      - name: Unit tests
        run: npm run test:api
      - name: Integration tests
        run: npm run test:api -- --config jest.integration.config.ts

  test-web:
    name: Web Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - name: Unit tests
        run: npm run test:web

  build:
    name: Build Check
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, test-api, test-web]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build:api
      - run: npm run build:web
```

---

## Step 12 — README & Documentation

### 12.1 README.md Structure

```markdown
# Good Job - Internal Recognition & Reward Platform

> Peer-to-peer recognition system where employees send points
> to colleagues, tied to core values, and redeem for rewards.

## Quick Start

### Prerequisites
- Node.js 20+
- Docker Desktop

### Setup

\`\`\`bash
# Clone & install
git clone <repo-url>
cd <repo-name>
npm install

# Start infrastructure
docker compose up -d

# Environment
cp .env.example .env
# Edit .env (set JWT_SECRET)

# Database
npm run db:migrate
npm run db:seed    # Optional: demo data

# Development
npm run dev:api    # http://localhost:3000
npm run dev:web    # http://localhost:5173
\`\`\`

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

\`\`\`
(repo root)
├── apps/
│   ├── api/    # NestJS backend
│   └── web/    # React frontend
├── docker-compose.yml
└── .github/workflows/ci.yml
\`\`\`

## Environment Variables

See [.env.example](.env.example)

## Testing

\`\`\`bash
npm run test        # All tests
npm run test:api    # Backend (Jest)
npm run test:web    # Frontend (Vitest)
\`\`\`

## Docker

\`\`\`bash
docker compose up -d      # Start PostgreSQL + Redis
docker compose down        # Stop all
\`\`\`
```

---

## Step 13 — Verification & Smoke Test

### Verification Checklist

```
After completing all steps, verify:

  ┌──────────────────────────────────────────────────────┐
  │                 Verification Flow                     │
  │                                                       │
  │  1. Docker services running?                          │
  │     docker compose ps                                 │
  │     → postgres: running, redis: running               │
  │                                                       │
  │  2. Database connected?                               │
  │     npm run db:migrate                                │
  │     → "Migration has been executed successfully"      │
  │                                                       │
  │  3. API starts?                                       │
  │     npm run dev:api                                   │
  │     → "API running on http://localhost:3000"          │
  │     → GET http://localhost:3000/api → 200             │
  │                                                       │
  │  4. Frontend starts?                                  │
  │     npm run dev:web                                   │
  │     → http://localhost:5173 → "Good Job" page         │
  │                                                       │
  │  5. Proxy works?                                      │
  │     http://localhost:5173/api → forwards to :3000     │
  │                                                       │
  │  6. Lint passes?                                      │
  │     npm run lint                                      │
  │     → 0 errors                                        │
  │                                                       │
  │  7. Type check passes?                                │
  │     npx tsc --noEmit -p apps/api/tsconfig.json        │
  │     npx tsc --noEmit -p apps/web/tsconfig.json        │
  │     → 0 errors                                        │
  │                                                       │
  │  8. Tests pass?                                       │
  │     npm run test                                      │
  │     → All green                                       │
  │                                                       │
  │  9. Build succeeds?                                   │
  │     npm run build                                     │
  │     → dist/ generated for both apps                   │
  │                                                       │
  │  10. Git commit works?                                │
  │      git add . && git commit -m "chore: initial..."   │
  │      → husky + lint-staged runs                       │
  │      → Commit succeeds                                │
  │                                                       │
  └──────────────────────────────────────────────────────┘
```

### Quick Smoke Test Commands

```bash
# 1. Infrastructure
docker compose up -d
docker compose ps

# 2. Database
npm run db:migrate

# 3. Start both apps (in separate terminals)
npm run dev:api
npm run dev:web

# 4. Test API health
curl http://localhost:3000/api

# 5. Open browser
open http://localhost:5173

# 6. Quality checks
npm run lint
npm run build
npm test
```

---

## Expected File Count After Scaffolding

```
Project Root:
  .editorconfig              ← Editor config
  .env.example               ← Environment template
  .env                       ← Local env (gitignored)
  .gitignore                 ← Git ignore rules
  .prettierrc                ← Prettier config
  .prettierignore            ← Prettier ignore
  docker-compose.yml         ← PostgreSQL + Redis
  package.json               ← Workspace root
  tsconfig.json              ← Base TypeScript config
  README.md                  ← Project documentation

Backend (apps/api/):
  ~15 entity files           ← TypeORM entities (9 entities + index + enums)
  ~9 module files            ← NestJS modules (scaffold only)
  ~9 controller files        ← NestJS controllers (scaffold only)
  ~9 service files           ← NestJS services (scaffold only)
  ~5 common files            ← Decorators, filters, guards
  ~3 config files            ← App configuration
  ~2 migration files         ← Initial schema + pgvector
  1 data-source.ts           ← TypeORM CLI config
  1 main.ts                  ← App bootstrap
  1 app.module.ts            ← Root module

Frontend (apps/web/):
  ~20 shadcn/ui components   ← UI primitives
  ~3 lib files               ← API client, utils, constants
  ~2 store files             ← Zustand stores
  1 App.tsx                  ← Router
  1 main.tsx                 ← Entry point
  1 index.css                ← Tailwind + design tokens
  1 Landing.tsx              ← Placeholder page

CI/CD:
  .github/workflows/ci.yml  ← GitHub Actions pipeline
  .husky/pre-commit          ← Git hook

Total: ~90 files
```

---

## Initial Commit Strategy

```
After scaffolding is complete, create these commits:

Commit 1: chore: initialize monorepo with npm workspaces
  → Root configs, .gitignore, .editorconfig, docker-compose.yml

Commit 2: feat(api): scaffold NestJS backend with TypeORM
  → NestJS app, all entities, migrations, module scaffolds

Commit 3: feat(web): scaffold React frontend with Vite + Tailwind
  → React app, shadcn/ui, router, stores, API client

Commit 4: ci: add GitHub Actions pipeline + Husky
  → CI workflow, pre-commit hook, lint-staged

Commit 5: docs: add README with setup instructions
  → README.md, .env.example
```

### Commit Flow

```
(repo root — git already initialized)
    │
    ├─ Commit 1: monorepo root
    │
    ├─ Commit 2: backend scaffold
    │
    ├─ Commit 3: frontend scaffold
    │
    ├─ Commit 4: CI/CD + hooks
    │
    └─ Commit 5: documentation
         │
         ▼
    Ready for Phase 04 (Backend Development)
```

---

## Next Steps After Scaffolding

```
Phase 03 Complete → All scaffolding done, project runs
    │
    ▼
Phase 04: Backend Development
    ├─ Auth module (register, login, JWT, OAuth)
    ├─ Kudos module (give kudo, atomic transaction)
    ├─ Points module (ledger, balance, budget reset)
    ├─ Rewards module (catalog, redemption, idempotency)
    ├─ Feed module (SSE, Redis Pub/Sub)
    ├─ Admin module (analytics, leaderboard)
    └─ Unit + Integration tests
```

---

**Last Updated**: 2026-02-16
**Status**: ✅ Complete
**Prerequisite**: Docker Desktop installed, Node.js 20 LTS
**Next**: Phase 04 — Backend Development
