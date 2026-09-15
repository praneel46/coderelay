# PHASES.md — Development Roadmap

## VIDYANTRA 2026 — CODE RELAY Competition Platform

---

## Phase 0 — Requirements & Architecture ✅

**Status**: Complete

**Deliverables**:
- [x] Repository inspection and assessment
- [x] High-level architecture (Next.js + NestJS + PostgreSQL monolith)
- [x] Directory structure proposal
- [x] Database/domain model (18+ entities, ER diagram)
- [x] Route map (45+ routes across 5 scopes)
- [x] Role/permission matrix (4 roles, 25+ resource/action combinations)
- [x] WebSocket event architecture
- [x] Technical risk assessment (11 risks identified)

---

## Phase 1 — UX / Information Architecture ✅

**Status**: Complete

**Deliverables**:
- [x] 7 design principles
- [x] Navigation architecture per role
- [x] Complete route map (public, participant, organizer, judge, host)
- [x] Screen inventory (45 unique screens)
- [x] Participant user flow (landing → arena → competition → results)
- [x] Organizer user flow (pre-competition, live, post-round)
- [x] Judge user flow (assignment → evaluation → review)
- [x] Host user flow (mode selection → fullscreen display)
- [x] Round 1 Code IQ UX (quiz layout, free navigation, 200-participant design)
- [x] Round 2 Triple Strike UX (sequential relay, member isolation, handoff)
- [x] Round 3 placeholder architecture
- [x] Round 4 Relay Finale UX (inherited code, relay timeline, snapshots)
- [x] Arena access flow with validation sequence
- [x] Responsive strategy (6 breakpoints, per-portal layouts)
- [x] Component hierarchy (60+ components, 4 tiers)
- [x] UX states catalog (14 states with visual treatment)
- [x] Accessibility requirements
- [x] 7 open UX decisions documented

---

## Phase 2 — Visual Design System ✅

**Status**: Complete

**Deliverables**:
- [x] Design philosophy and visual direction (Public vs Live Competition)
- [x] Complete color system & HEX design tokens (`--bg-app`, `--accent-cyan`, semantic status)
- [x] Typography scale & font pairing (`Plus Jakarta Sans` / `Inter` + `JetBrains Mono`)
- [x] Spacing scale, layout grid, and max content widths
- [x] Border radius, shape language, and elevation scale
- [x] Button system (variants, states, sizing, competition action mappings)
- [x] Form & input system (defaults, hover, focus, error, disabled, code input)
- [x] Card system & container guidelines
- [x] Timer visual design (normal, warning < 5m, critical < 1m, expired, 1Hz border pulse)
- [x] Competition status system & accessible badges
- [x] Participant arena layout specs
- [x] Round 1 (Code IQ) visual design (~200 participants, navigation strip, MCQ cards)
- [x] Round 2 (Triple Strike) visual design (3 Qs/member, member relay bar, isolation state)
- [x] Round 2 Monaco editor shell & Predict Output MCQ design
- [x] Round 3 TBD configurable placeholder specs
- [x] Round 4 (Relay Finale) visual design (`INHERITED CODE` banner, single codebase relay)
- [x] Handoff visualization & snapshot distinction (periodic autosave vs authoritative final snapshot)
- [x] Organizer console visual specs (dashboard, live team monitor, question draft/publish/lock states)
- [x] Question editor dynamic form & preview specs
- [x] Judge interface split-pane visual specs & rubric weighting (40/20/15/15/10)
- [x] Host display projection visual specs (large-format 72px+ display type)
- [x] Access / Arena Gate validation visual states
- [x] Security UI (warning overlays, server-authoritative 3rd warning lock, connection banners)
- [x] Responsive design breakpoints & portal adaptation rules
- [x] Motion & animation system (restrained, zero motion during active coding)
- [x] Iconography style guidelines
- [x] Data density & table visual design
- [x] Empty, error, & loading state visual language
- [x] Accessibility requirements (contrast, keyboard focus, ARIA live)
- [x] JSON design token reference
- [x] Component inventory (30+ components)
- [x] Page-by-page visual specifications (45 unique screens)
- [x] DOs & DON'Ts design consistency rules
- [x] Landing page relationship guidelines

---

## Phase 3 — Application Foundation ✅

**Status**: Complete

**Deliverables**:
- [x] Monorepo workspace configuration (`apps/web`, `apps/api`, `packages/shared`)
- [x] Next.js project setup (App Router, TypeScript, Tailwind CSS)
- [x] NestJS project setup (TypeScript, modular architecture)
- [x] Shared types package (`@coderelay/shared`)
- [x] Deployment configuration for Vercel and Render
- [x] Health checks and API filters

---

## Phase 4 — Database Schema & Authentication ✅

**Status**: Complete

**Deliverables**:
- [x] PostgreSQL Prisma schema with 14 entities
- [x] Participant authentication (Team Code + Member Order + 4-digit PIN)
- [x] Console user authentication (Organizer, Judge, Host)
- [x] bcrypt password and PIN hashing (salt factor = 10)
- [x] JWT token generation and server-side session persistence (`ParticipantSession`)
- [x] Role-Based Access Control (`RolesGuard`, `@Roles()`, `JwtAuthGuard`)
- [x] Answer leak protection (MCQ correct options omitted from participant DTOs)
- [x] Audit logging infrastructure (`AuditService`)
- [x] Seed script (`prisma/seed.ts`) for dev users and sample teams

---

## Phase 5 — Organizer Console & Question Management ✅

**Status**: Complete

**Deliverables**:
- [x] Organizer Control Console Layout shell (`/organizer/layout.tsx`)
- [x] Organizer Dashboard (`/organizer/dashboard`) with operational metrics
- [x] Team Management interface (`/organizer/teams`) & API (`TeamsController`, `TeamsService`)
- [x] Round Management interface (`/organizer/rounds`) & API (`RoundsController`, `RoundsService`)
- [x] Question Bank listing (`/organizer/questions`) with search and status filter
- [x] Dynamic Question Form Editor (`/organizer/questions/new` & `[id]/edit`)
- [x] Dual-mode Question Preview (`/organizer/questions/[id]/preview`)
- [x] Question Lifecycle State Machine (`DRAFT` → `PUBLISHED` → `LOCKED`) & validation rules
- [x] Question Immutability enforcement & duplication workflow for locked questions
- [x] Participant API answer leak protection (`isCorrect` stripped in `ParticipantQuestionsController`)
- [x] Optimistic Concurrency Control (`expectedUpdatedAt` validation)
- [x] Submissions overview page (`/organizer/submissions`)
- [x] Results & Standings placeholder page (`/organizer/results`)
- [x] Audit Trail log viewer (`/organizer/audit`) & API (`AuditController`)
- [x] Automated test suite (`apps/api/test/organizer-console.spec.ts`) passing 100%
- [x] Architecture documentation (`docs/organizer-console.md`)

---

## Phase 6 — Round 1: Code IQ ✅

**Status**: Complete

**Deliverables**:
- [x] Prisma migration (`isFinal Boolean @default(false)` added to `Submission`)
- [x] Shared package types & DTOs (`packages/shared/src/round1.ts`)
- [x] Server-authoritative state machine (`DRAFT` → `READY` → `LOBBY` → `COUNTDOWN` → `ACTIVE` → `SUBMISSION` → `LOCKED` → `SCORING` → `QUALIFICATION` → `COMPLETE`)
- [x] One representative per team locking with 403 Forbidden enforcement (`ensureTeamRepresentative`)
- [x] 20-question deterministic delivery with answer key secrecy (`isCorrect` stripped)
- [x] Server-side answer persistence (`saveAnswer` with `isFinal = false`)
- [x] Idempotent final submission (`submitRound1` with `isFinal = true`) & immutable response
- [x] 20-minute server-authoritative timer & deadline lock enforcement
- [x] Server-side deterministic scoring engine (`scoreRound1`)
- [x] Leaderboard ranking with submission timestamp tie-breaking (`getLeaderboard`)
- [x] Organizer-configurable qualification engine (`qualifyRound1` default 50% threshold)
- [x] Socket.IO real-time event broadcasting (`CompetitionGateway` for `ROUND_STATE_UPDATED`, `ROUND_STARTED`, `ROUND_DEADLINE`, `PARTICIPANT_SUBMITTED`, `ROUND_LOCKED`, `RESULTS_READY`)
- [x] Participant UI (`/participant/round1`) with 20-question navigator, timer, auto-save, and submit confirmation modal
- [x] Organizer Control Console (`/organizer/rounds`) with state machine transitions, readiness counter, emergency lock, scoring/qualification actions, and leaderboard preview
- [x] Host Projector Display (`/host/display`) with large countdown timer, submission progress bar, and qualifying teams leaderboard
- [x] Dedicated test suite (`apps/api/test/round1-engine.spec.ts`) passing 24/24 core scenarios
- [x] Concurrency load test script (`apps/api/test/round1-concurrency.load.ts`) simulating 200 simultaneous participants with 0 errors
- [x] Architecture documentation (`docs/round-1-code-iq.md`)

---

## Phase 7 — Participant Competition Shell

**Status**: Not started

**Scope**:
- Competition bar (timer, round, team, connection status)
- Lobby/waiting room
- Submission confirmation dialogs
- Connection state management (connected, reconnecting, restored)
- State restoration on refresh/reconnect
- Browser security controls (fullscreen, tab detection, copy/paste)
- Warning system (1/3, 2/3, 3/3 → auto-submit)

---

## Phase 8 — Round 2: Triple Strike

**Status**: Not started

**Scope**:
- Sequential member relay (M1 → M2 → M3)
- Stage-specific interfaces (Debugging, Coding, Predict Output)
- Member isolation (server-driven activation)
- Monaco editor integration (no compiler)
- 10-minute per-member server timer
- Handoff screen and transition choreography
- Stage session management

---

## Phase 9 — Security + Reliability Hardening

**Status**: Not started

**Scope**:
- Fullscreen enforcement
- Tab/window switching detection
- Copy/paste/cut/context-menu restriction
- Security violation logging
- Warning escalation and auto-submit
- Race condition testing (handoffs, submissions)
- Reconnection testing
- Refresh/crash recovery testing
- Authorization penetration testing

---

## Phase 10 — Round 4: Relay Finale

**Status**: Not started

**Scope**:
- Code inheritance system
- Relay snapshot creation (periodic, handoff, final lock)
- Member handoff with exact code transfer
- "Inherited Code" UX
- Relay timeline visualization
- Final lock and immutability
- Auto-save during coding

---

## Phase 11 — Judge Portal

**Status**: Not started

**Scope**:
- Judge assignment management
- Submission viewer (code, answers, timestamps)
- Relay snapshot viewer (R4 code evolution)
- Evaluation form (score, comments)
- Evaluation submission and review

---

## Phase 12 — Host Display

**Status**: Not started

**Scope**:
- Display mode controller
- Fullscreen projection mode
- Countdown display (large-format timer)
- Leaderboard display
- Announcement display
- Results/winner display
- Auto-update via WebSocket
- Large-screen typography (readable at 20+ meters)

---

## Phase 13 — Results + Reporting

**Status**: Not started

**Scope**:
- Final rankings per round
- Cumulative scoring
- Qualification chains (R1 → R2 → R4)
- Result export (CSV/PDF)
- Audit history report

---

## Phase 14 — Testing / Simulation

**Status**: Not started

**Scope**:
- Simulate ~200 concurrent Round 1 participants
- Simulate 60 simultaneous team sessions (Round 2)
- Simultaneous submission load testing
- Refresh/crash/reconnect simulation
- Duplicate login handling
- Client manipulation testing
- Timer manipulation testing
- Unauthorized API access testing
- Race condition testing
- Server restart recovery

---

## Phase 15 — Production Deployment

**Status**: Not started

**Scope**:
- Production environment setup
- Database backup strategy
- Monitoring and alerting
- Security configuration (HTTPS, CORS, rate limiting)
- Deployment checklist
- Emergency recovery plan
- Competition-day runbook
