# Round 2 — Triple Strike Engine Architecture & Rules

## 1. Official Competition Rules
- **Format:** Sequential Team Relay.
- **Eligibility:** Restricted strictly to qualified teams from Round 1 (`isQualifiedR2 === true`).
- **Team Composition:** Exactly 3 members per team.
- **Fixed Member Roles:**
  - **Member 1 (Stage 1):** DEBUGGING — 3 questions — 15 minutes (900 seconds)
  - **Member 2 (Stage 2):** CODING — 3 questions — 15 minutes (900 seconds)
  - **Member 3 (Stage 3):** PREDICT OUTPUT — 3 questions — 15 minutes (900 seconds)
- **Total Team Duration:** Maximum 45 minutes (2,700 seconds).
- **Single Active Member:** Only ONE member is active per team at any moment. Member roles cannot be selected or swapped by participants.
- **Member & Question Isolation:**
  - Member 1 can see ONLY Stage 1 (Debugging) questions.
  - Member 2 can see ONLY Stage 2 (Coding) questions.
  - Member 3 can see ONLY Stage 3 (Predict Output) questions.
  - No access to other teams' questions or submissions.

---

## 2. Server-Authoritative Timer & State Machine
- **Server Timer Authority:** `startedAt` and `deadlineAt` are calculated strictly by the NestJS backend and stored in PostgreSQL `stage_sessions`. Client clocks are ignored.
- **State Machine Sequence:**
  `DRAFT` → `READY` → `LOBBY` → `COUNTDOWN` → `MEMBER_1_ACTIVE` → `MEMBER_1_HANDOFF` → `MEMBER_2_ACTIVE` → `MEMBER_2_HANDOFF` → `MEMBER_3_ACTIVE` → `MEMBER_3_FINALIZE` → `LOCKED` → `SCORING` → `COMPLETE`
- **Transactional Handoff:**
  Executed within PostgreSQL `$transaction` with row-level locks (`SELECT ... FOR UPDATE`):
  1. Validates current active stage and member identity.
  2. Finalizes current member submissions (`isFinal = true`, `submittedAt = NOW()`).
  3. Marks `stage_sessions` record `status = 'SUBMITTED'`.
  4. Atomically initializes/activates next member `stage_sessions` record (`startedAt = NOW()`, `deadlineAt = NOW() + 900s`).
  5. Broadcasts `STAGE_HANDOFF` / `ROUND2_LOCKED` WebSocket events.

---

## 3. Security Warning System & 3-Warning Auto-Submit
- **Client Security Signals:** Client listens for `visibilitychange`, `blur`, `fullscreenchange`, and shortcut attempts and reports signals to `/api/round2/security-violation`.
- **Server Warnings:** Server validates violation signals and increments official `warningCount` (0/3 → 1/3 → 2/3 → 3/3) in database.
- **3-Warning Auto-Submission:** Upon reaching 3 official warnings, server automatically locks and finalizes the active stage (`isAutoSubmitted = true`, `isFinal = true`), performs atomic handoff to the next member stage, and broadcasts `STAGE_AUTO_SUBMITTED`.

---

## 4. Scoring Architecture (TBD Status)
- **Scoring Status:** Official Round 2 scoring weights and marks remain **TBD** as specified by competition organizers.
- **Predict Output Stage:** Evaluated automatically against `QuestionOption.isCorrect` when set.
- **Debugging & Coding Stages:** Code content persisted safely in `submissions` for TBD manual/automated evaluation.

---

## 5. Database Schema Extensions
- Extended existing `StageSession` model in `prisma/schema.prisma`:
  - `teamId`, `memberId`, `deadlineAt`, `submittedAt`, `isFinal`, `isAutoSubmitted`.
  - Reuses `StageStatus` (`PENDING`, `ACTIVE`, `SUBMITTED`, `TIMED_OUT`, `FORCE_SUBMITTED`).
  - Indexed via `@@index([teamId, stageId])`.
- Migration created in `prisma/migrations/20260914200000_extend_stage_session/migration.sql`.

---

## 6. Infrastructure Capacity Validation
- 200 concurrent participant sessions used strictly as a **target capacity and throughput benchmark** over real TCP/HTTP sockets.
- Competition participation is dynamically determined from actual database teams.

---

## 7. Socket.IO Event Vocabulary (`/ws` Namespace)
- `ROUND2_STATE_UPDATED`
- `ROUND2_STARTED`
- `STAGE_STARTED`
- `STAGE_DEADLINE`
- `STAGE_SUBMITTED`
- `STAGE_HANDOFF`
- `SECURITY_WARNING`
- `STAGE_AUTO_SUBMITTED`
- `ROUND2_LOCKED`
- `RESULTS_READY`
