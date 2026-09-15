# VIDYANTRA 2026 — CODE RELAY
## Phase 4 Architecture Document: Database Schema & Authentication

---

### 1. Executive Overview

Phase 4 establishes the server-authoritative database foundation and identity/authentication system for the VIDYANTRA 2026 Code Relay platform.

The system uses **PostgreSQL** with **Prisma ORM**, **bcrypt** secret hashing (salt rounds = 10), and **JWT bearer tokens** backed by server-validated DB sessions (`ParticipantSession`).

---

### 2. Entity Architecture & Data Model

The PostgreSQL database schema consists of 14 core entities designed for maximum performance, data integrity, and strict separation of concerns:

```
+-------------------+       +-------------------+       +-----------------------+
|       User        |       |       Team        |       |   ParticipantSession  |
+-------------------+       +-------------------+       +-----------------------+
| id                |       | id                |       | id                    |
| username (unique) |       | teamCode (unique) |       | token (unique)        |
| passwordHash      |       | name              |       | teamId                |
| role (ORG/JDG/HST)|       | college           |       | memberId              |
| displayName       |       +---------+---------+       | role (PARTICIPANT)    |
+-------------------+                 | 1               | expiresAt             |
                                      |                 +-----------------------+
                                      | N
                            +---------+---------+
                            |    TeamMember     |
                            +-------------------+
                            | id                |
                            | teamId            |
                            | memberOrder (1-3) |
                            | pinHash           |
                            | displayName       |
                            +-------------------+
```

#### Detailed Entity Specifications

1. **`User`**: Privileged console users (Organizers, Judges, Live Arena Hosts).
2. **`Team`**: Participating teams identified by a 2-part team code (e.g., `ALPHA-042`).
3. **`TeamMember`**: Individual participants (1, 2, or 3 per team) with member-specific 4-digit PIN hashes.
4. **`ParticipantSession`**: Active participant token tracking with strict server-side validation and expiration.
5. **`Round`**: Competition rounds 1–4 (`ROUND1_MCQ`, `ROUND2_RELAY`, `ROUND3_BUG_HUNT`, `ROUND4_FINALE`).
6. **`RoundStage`**: Member-specific stages within Round 2 (Member 1 — Debugging, Member 2 — Coding, Member 3 — Predict Output).
7. **`StageSession`**: Active execution window per team/stage tracking start, end, handoff, and lock status.
8. **`ArenaCode`**: Server-authoritative relay code editor state per team/stage.
9. **`Question`**: Competition problem bank covering MCQ, Debugging, Coding, and Output Prediction questions.
10. **`QuestionOption`**: MCQ choice options with server-side `isCorrect` protection.
11. **`Submission`**: Participant answers and code submissions with automated and manual evaluation tracking.
12. **`RelaySnapshot`**: Point-in-time code snapshot history saved at handoff and time expiry.
13. **`SecurityEvent`**: Security violations (tab blur, copy-paste attempts, unauthorized API calls, window focus loss).
14. **`AuditLog`**: Organizer and judge action auditing for compliance and integrity.

---

### 3. Identity & Authentication Model

#### A. Participant Login Flow
- **Input**: Team Code (`ALPHA-042`) + Member Order (`1`, `2`, or `3`) + Member PIN (`1234`).
- **Validation**:
  1. Lookup team by `teamCode` (case-insensitive).
  2. Verify target member exists by `memberOrder`.
  3. Compare submitted PIN against `pinHash` using `bcrypt.compare()`.
  4. Create `ParticipantSession` with 12-hour expiration.
  5. Issue JWT signed token containing `sub`, `teamId`, `teamCode`, `memberOrder`, and `role: PARTICIPANT`.

#### B. Privileged User Login Flow
- **Input**: Username (`organizer` / `judge1` / `host1`) + Password (`password123`).
- **Validation**:
  1. Lookup user by `username`.
  2. Compare password against `passwordHash` using `bcrypt.compare()`.
  3. Write entry to `AuditLog` table via `AuditService`.
  4. Issue JWT signed token containing `sub`, `username`, and `role` (`ORGANIZER`, `JUDGE`, `HOST`).

---

### 4. Role-Based Access Control (RBAC)

The NestJS backend enforces strict authorization via decorators and guards:

- `@Roles(Role.ORGANIZER, Role.JUDGE)`: Decorator specifying authorized roles per endpoint.
- `JwtAuthGuard`: Extracts JWT token from `Authorization: Bearer <token>` header, verifies signature, and checks session validity.
- `RolesGuard`: Evaluates user role from request payload against target route requirements.

```typescript
@Get('me')
@UseGuards(JwtAuthGuard)
async getProfile(@CurrentUser() user: AuthenticatedUser) {
  return { success: true, user };
}

@Post('questions')
@Roles(Role.ORGANIZER)
@UseGuards(JwtAuthGuard, RolesGuard)
async createQuestion(@Body() dto: CreateQuestionDto) { ... }
```

---

### 5. Security & Data Integrity Protections

1. **Answer Leak Protection**: `QuestionOption.isCorrect` is stripped from all participant responses.
2. **PIN & Password Security**: All secrets are stored strictly as `bcrypt` salted hashes (salt factor = 10). Raw PINs or passwords are never logged or stored.
3. **Session Invalidation**: Server can instantly revoke participant sessions by removing entries from `ParticipantSession`.
4. **Auditability**: All privileged operations (login, round start, score edits) are logged to `AuditLog`.

---

### 6. Seeding & Local Development Setup

To initialize the database schema and seed test accounts:

```bash
# Generate Prisma Client
npm run prisma:generate

# Push Schema to PostgreSQL Database
npm run prisma:db-push

# Seed Initial Users & Sample Teams
npm run prisma:seed
```

Default Seed Accounts:
- **Organizer**: `organizer` / `password123`
- **Judge**: `judge1` / `password123`
- **Host**: `host1` / `password123`
- **Sample Team**: Code `ALPHA-042` / Member 1 (PIN: `1234`), Member 2 (PIN: `1234`), Member 3 (PIN: `1234`)
