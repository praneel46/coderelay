# Phase 3 — Project Foundation Documentation

## VIDYANTRA 2026 — CODE RELAY Competition Platform

> **Document Status**: Approved Project Foundation Specification (Phase 3)  
> **Source of Truth**: [UX & Information Architecture](./ux-information-architecture.md) & [Visual Design System](./visual-design-system.md)

---

## 1. Monorepo Repository Structure

The Code Relay competition platform is structured as an npm workspaces monorepo inside `coderelay-rounds/`. The parent directory (`code relay/` containing the static marketing site) is completely isolated and protected.

```
coderelay-rounds/
├── apps/
│   ├── web/                    # Next.js 15+ App Router Frontend (Port 3000)
│   └── api/                    # NestJS Backend API & WebSockets (Port 4000)
├── packages/
│   └── shared/                 # Shared TypeScript interfaces & constants (@coderelay/shared)
├── prisma/
│   └── schema.prisma           # Prisma ORM & PostgreSQL Database Schema
├── docs/                       # Architectural & Design specifications
├── .env.example                # Environment configuration template
└── package.json                # Monorepo workspace configuration
```

---

## 2. Frontend Architecture (`apps/web`)

- **Framework**: Next.js 15 (React 19, App Router)
- **Styling**: Tailwind CSS with Phase 2 visual tokens (`--bg-app: #07090e`, `--accent-cyan: #00d2ff`, font family `Plus Jakarta Sans` & `JetBrains Mono`).
- **Role Isolation & Route Architecture**:
  - `(auth)`: `/login`, `/team-entry`
  - `(participant)`: `/participant/dashboard`, `/participant/arena`, `/participant/arena/code-iq`, `/participant/arena/triple-strike`, `/participant/arena/round-3`, `/participant/arena/relay-finale`
  - `(organizer)`: `/organizer/dashboard`, `/organizer/teams`, `/organizer/rounds`, `/organizer/questions`, `/organizer/submissions`, `/organizer/scoring`, `/organizer/logs`
  - `(judge)`: `/judge/dashboard`, `/judge/evaluations`, `/judge/review`
  - `(host)`: `/host/control`, `/host/display`

---

## 3. Backend Architecture (`apps/api`)

- **Framework**: NestJS 11 (Express platform, TypeScript)
- **Validation**: Global `ValidationPipe` with whitelist and DTO transformation.
- **Error Handling**: Global `HttpExceptionFilter` producing structured JSON error responses with timestamps and URL paths.
- **CORS**: Enabled for `http://localhost:3000`.
- **Health Check**: `GET /health` returning server uptime, timestamp, and server-authority status.
- **Module Architecture**:
  - `HealthModule`: Handles system health check endpoints.
  - `CompetitionModule`: Socket.IO gateway abstraction (`CompetitionGateway`) for real-time WebSocket notifications.
  - Prepared module boundaries for `AuthModule`, `TeamsModule`, `RoundsModule`, `QuestionsModule`, `ScoringModule`, `RelayModule`, `JudgeModule`, `AuditModule`.

---

## 4. Shared Package (`packages/shared`)

- **Package Name**: `@coderelay/shared`
- **Purpose**: Provides a single source of truth for TypeScript interfaces and enums used across frontend and backend.
- **Types & Constants**:
  - `UserRole`: `PARTICIPANT`, `ORGANIZER`, `JUDGE`, `HOST`
  - `RoundSlug`: `code-iq`, `triple-strike`, `round-3`, `relay-finale`
  - `QuestionType`: `MCQ`, `PREDICT_OUTPUT`, `DEBUGGING`, `CODING`
  - `SocketEvent`: Room join, timer countdown, warning, stage transition
  - `Team`, `TeamMember`, `Question`, `Submission`, `RelaySnapshot`, `SecurityEvent` interfaces.

---

## 5. Database Foundation (`prisma`)

- **Database Engine**: PostgreSQL
- **ORM**: Prisma 6
- **Configuration**: Standard datasource URL loaded via `DATABASE_URL` environment variable.
- **Health Validation**: Includes a minimal `HealthCheck` model for validating database connectivity prior to Phase 4 schema implementation.

---

## 6. Server-Authority & Reliability Principles

- **Browser = Presentation & User Input**: The browser NEVER determines official timer value, remaining time, warning count, stage transitions, or final scores.
- **Server = Single Source of Truth**: All competition state is validated and managed server-side.
- **Database = Authoritative Record**: Transactions wrap all stage handoffs, final submissions, and warning locks.
- **Reconnection Policy**: On connection loss, local UI state is preserved temporarily. On reconnection, client state is synchronized against the server's authoritative state.

---

## 7. Development & Verification Commands

From `coderelay-rounds/`:

- **Install Dependencies**: `npm install`
- **Build Shared Package**: `npm run build:shared`
- **Run API (Dev)**: `npm run dev:api` (Runs NestJS on http://localhost:4000)
- **Run Web (Dev)**: `npm run dev:web` (Runs Next.js on http://localhost:3000)
- **Typecheck Workspace**: `npm run typecheck`
- **Build Workspace**: `npm run build`
- **Prisma Generate**: `npm run prisma:generate`

---

## 9. Deployment Architecture (Vercel & Render)

The application is structured to live on a single `main` branch in GitHub without separate Git branches, while allowing independent deployment of the frontend to **Vercel** and the backend to **Render**:

```
Repository Root: code relay/
└── coderelay-rounds/
    ├── apps/
    │   ├── web/        → Vercel Deployment (Root Directory: coderelay-rounds/apps/web)
    │   └── api/        → Render Deployment (Root Directory: coderelay-rounds/apps/api)
    └── packages/
        └── shared/     → Shared TypeScript Package
```

### Vercel Deployment Configuration (Frontend)
- **Framework Preset**: Next.js
- **Root Directory**: `coderelay-rounds/apps/web`
- **Build Command**: `npm run build` (Automatically builds `@coderelay/shared` & Next.js app)
- **Environment Variables**:
  - `NEXT_PUBLIC_API_URL`: Render Backend API URL (e.g. `https://coderelay-api.onrender.com`)
  - `NEXT_PUBLIC_WS_URL`: Render WebSocket URL (e.g. `https://coderelay-api.onrender.com`)

### Render Deployment Configuration (Backend)
- **Service Type**: Web Service (Node.js)
- **Root Directory**: `coderelay-rounds/apps/api` (or `coderelay-rounds`)
- **Build Command**: `npm run build`
- **Start Command**: `node dist/main.js` (or `npm run start`)
- **Environment Variables**:
  - `DATABASE_URL`: PostgreSQL Connection String (Supabase / Render Postgres / Neon)
  - `PORT`: `4000` (or `$PORT` assigned by Render)
  - `CORS_ORIGIN`: Vercel Frontend URL (e.g. `https://coderelay-web.vercel.app`)

---

## 10. Health Check Verification

`GET /health` on port 4000 returns:

```json
{
  "status": "ok",
  "service": "VIDYANTRA 2026 Code Relay API",
  "timestamp": "2026-09-14T16:08:00.000Z",
  "uptime": 12.4,
  "serverAuthority": true
}
```
