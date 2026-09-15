# VIDYANTRA 2026 — CODE RELAY
## Phase 5 Architecture Document: Organizer Console & Question Management

---

### 1. Executive Overview

Phase 5 delivers the administrative control center for the VIDYANTRA 2026 Code Relay platform. The Organizer Console enables competition administrators to manage teams, rounds, question banks, submissions, and audit logs without manual database interventions or source code modifications.

---

### 2. Organizer Routes & Permissions

All organizer routes and API endpoints are protected using server-side JWT authentication (`JwtAuthGuard`) and Role-Based Access Control (`RolesGuard`). Access is strictly limited to users with `role: ORGANIZER`.

#### Frontend Routes (`apps/web`)
- `/organizer/dashboard`: High-level operational overview & system metrics.
- `/organizer/teams`: Team roster, member order, and PIN security status.
- `/organizer/rounds`: Competition rounds configuration (R1, R2, R3 TBD, R4).
- `/organizer/questions`: Question Bank listing with search, filtering, and status badges.
- `/organizer/questions/new`: Question Creator form.
- `/organizer/questions/[id]/edit`: Question Editor (enabled only for `DRAFT` and `PUBLISHED` questions).
- `/organizer/questions/[id]/preview`: Dual-mode question preview (Participant View vs. Organizer Answer Key View).
- `/organizer/submissions`: Submission log table (placeholder state prior to live competition engine).
- `/organizer/results`: Results & standings placeholder.
- `/organizer/audit`: Operational audit log timeline viewer.

---

### 3. Question Bank & Lifecycle State Machine

Questions transition through three explicit lifecycle states:

```
+---------------+      Publish       +------------------+       Lock       +---------------+
|     DRAFT     |  -------------->   |    PUBLISHED     |  ------------->  |    LOCKED     |
+---------------+                    +------------------+                  +---------------+
        ^                                                                          |
        |                                Duplicate                                 |
        +--------------------------------------------------------------------------+
```

1. **`DRAFT`**:
   - Editable by organizers.
   - Not accessible to participants.
   - Initial state upon creation or duplication.

2. **`PUBLISHED`**:
   - Validated for required fields and exact MCQ answer configuration (must have at least 2 choices and exactly 1 correct answer).
   - Servable to participants via `/api/participant/questions` during competition execution.
   - Editable with care.

3. **`LOCKED`**:
   - Immutable state during active competition execution.
   - Direct mutations (`PUT /api/organizer/questions/:id`) are strictly blocked with `403 Forbidden`.
   - Organizers can create a new editable `DRAFT` version via `POST /api/organizer/questions/:id/duplicate`.

---

### 4. Question Types Supported

- **`MCQ`** (Round 1 & Round 2 Member 3): Supports multi-choice option text and designated `isCorrect` flag.
- **`PREDICT_OUTPUT`** (Round 2 Member 3): Choice-based or text-based output prediction tasks.
- **`DEBUGGING`** (Round 2 Member 1): Problem statement, language specification, and starter buggy code snippet.
- **`CODING`** (Round 2 Member 2): Problem statement, language specification, starter code, and reference solution.

---

### 5. Answer Leak Protection & Dual-Mode Preview

- **Participant API Protection**: `GET /api/participant/questions` returns published questions while explicitly stripping `isCorrect`, test cases, reference solutions, and internal organizer metadata.
- **Organizer Dual-Mode Preview**: `/organizer/questions/[id]/preview` allows organizers to toggle between:
  1. **PARTICIPANT VIEW**: Displays sanitized layout as seen by competitors.
  2. **ORGANIZER KEY VIEW**: Highlights correct answers and reference solutions.

---

### 6. Optimistic Concurrency Control

To prevent accidental overwrites when multiple organizers edit the same question simultaneously, `PUT /api/organizer/questions/:id` supports an optional `expectedUpdatedAt` timestamp check. If the timestamp does not match the database `updatedAt` field, the request fails with `409 Conflict`.

---

### 7. Audit Behavior

All administrative operations trigger an entry in `AuditLog` via `AuditService`:
- `CREATE_TEAM`
- `UPDATE_ROUND`
- `CREATE_QUESTION`
- `UPDATE_QUESTION`
- `PUBLISH_QUESTION`
- `LOCK_QUESTION`
- `DUPLICATE_QUESTION`
- `REVOKE_SESSION`

---

### 8. Backend API Structure

- `TeamsController` (`/api/organizer/teams`)
- `RoundsController` (`/api/organizer/rounds`)
- `QuestionsController` (`/api/organizer/questions`)
- `ParticipantQuestionsController` (`/api/participant/questions`)
- `SubmissionsController` (`/api/organizer/submissions`)
- `AuditController` (`/api/organizer/audit`)

---

### 9. Deferred Functionality (Handled in Later Phases)

The following components belong to later phases and are intentionally deferred:
- Live competition engines & timers (Phases 6, 8, 10)
- Code execution / compiler sandbox (Participant editor only in Phase 8)
- Automatic scoring & qualification ranking calculation (Phase 6, 13)
- Live WebSocket real-time broadcast state (Phase 6–12)
- Fullscreen & security enforcement triggers (Phase 9)
