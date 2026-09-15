# Round 1 — Code IQ Competition Engine Architecture

**VIDYANTRA 2026 — CODE RELAY**

---

## 1. Round 1 Rules & Format
- **Format**: Speed MCQ & Predict-Output logic elimination.
- **Participation**: Exactly one representative per team. Maximum target: 200 simultaneous participants.
- **Content**: 20 MCQ / Predict-Output questions (logic & code output; zero syntax/debugging trivia).
- **Time Limit**: 20 minutes (1200 seconds) total competition duration.
- **Navigation**: Free navigation across questions 1 to 20; answers persist automatically.
- **Submission**: Final submission is immutable; early submission allowed.
- **Tie-Break**: 1. Higher score, 2. Earlier official server submission timestamp (`submittedAt`). Ties matching on both score and timestamp are flagged for organizer review.
- **Qualification**: Configurable qualification ratio (default 50% / `qualificationRatio: 0.5`) evaluated server-side.

---

## 2. Server-Authoritative Architecture
```
┌───────────────────────────────────────────────────────────┐
│                     BROWSER (CLIENT)                      │
│        UI Rendering • Input Options • Countdown View       │
└─────────────────────────────┬─────────────────────────────┘
                              │ REST / WebSockets
┌─────────────────────────────▼─────────────────────────────┐
│                    NESTJS BACKEND API                     │
│   State Machine • Timer Authority • 1-Rep Lock • Scoring   │
└─────────────────────────────┬─────────────────────────────┘
                              │ Prisma ORM
┌─────────────────────────────▼─────────────────────────────┐
│                   POSTGRESQL DATABASE                     │
│    Submissions (isFinal) • Round Config • Team Status     │
└───────────────────────────────────────────────────────────┘
```

The browser acts strictly as a presentation and input layer. The backend server exclusively dictates:
- Official competition state
- Start time (`startedAt`) and deadline (`deadlineAt`)
- Answer validation and score calculation
- Team representative eligibility
- Qualification decisions

---

## 3. State Machine Sequence
The Round 1 state machine sequence is strictly guarded:

`DRAFT` → `READY` → `LOBBY` → `COUNTDOWN` → `ACTIVE` → `SUBMISSION` → `LOCKED` → `SCORING` → `QUALIFICATION` → `COMPLETE`

- **Transitions**: Controlled exclusively via `POST /api/organizer/round1/transition` by authenticated organizers.
- **Guard Validation**: Out-of-order or client-initiated state transitions are rejected with `400 Bad Request`.

---

## 4. Timer Architecture
- **Server Clock**: Upon transitioning to `ACTIVE`, the server records `startedAt = NOW` and calculates `deadlineAt = NOW + 1200s`.
- **Client Countdown**: Browsers receive `startedAt` and `deadlineAt` and display remaining time as `Math.max(0, deadlineAt - clientNow)`.
- **Expiry Guard**: Requests to save answers or submit after `deadlineAt` or during `LOCKED` state are rejected with `400 Bad Request`.

---

## 5. One Representative Per Team Enforcement
- Single representative lock is recorded in `Round.config.teamRepresentatives[teamId] = memberId`.
- The first team member entering Round 1 claims the representative slot.
- Secondary team members attempting entry receive `403 Forbidden`.

---

## 6. Question Flow & Sanitization
- Fetches 20 questions in deterministic order (`orderBy: { displayOrder: 'asc' }`).
- Option Sanitizer: Option records explicitly exclude `isCorrect`, reference solutions, or organizer metadata from participant API responses.

---

## 7. Answer Persistence
- Participant option choices are saved to `Submission` records with `isFinal = false`.
- Answers remain editable during `ACTIVE` state prior to final submission.

---

## 8. Final Submission Processing & Idempotency
- Participant triggers `POST /api/round1/submit`.
- Atomic transaction marks draft submissions for the team as `isFinal = true` with a server-generated `submittedAt` timestamp.
- Duplicate submission calls return the existing final submission record idempotently without duplicate records or errors.

---

## 9. Automatic Scoring Engine
- Executed via `POST /api/organizer/round1/score`.
- Evaluates participant `answerText` against `QuestionOption.isCorrect = true`.
- Correct = `question.marks` (10 pts), Incorrect = 0, Unanswered = 0. Zero negative marking.

---

## 10. Tie-Breaking Implementation
Leaderboard sorting rule:
1. `totalScore DESC`
2. `submittedAt ASC` (server-generated final submission timestamp)
3. If score and exact millisecond timestamp match: `requiresReview = true` (flagged for organizer handling).

---

## 11. Qualification Engine
- Configurable via `qualificationRatio` (default 0.5) or `qualificationCount`.
- Executed via `POST /api/organizer/round1/qualify`.
- Top qualifying teams have `Team.isQualifiedR2` set to `true` at the team level.

---

## 12. Socket.IO Synchronization Events
- `ROUND_STATE_UPDATED`: Broadcasts state changes, `startedAt`, and `deadlineAt`.
- `ROUND_STARTED`: Signals competition start.
- `ROUND_DEADLINE`: Signals competition deadline expiration.
- `PARTICIPANT_SUBMITTED`: Notifies host/organizer console of team submissions.
- `ROUND_LOCKED`: Signals emergency or automatic round lock.
- `RESULTS_READY`: Signals completion of scoring and qualification.

---

## 13. Participant UI
- Built at `/participant/round1`.
- Displays round title, server-synced timer, live connection badge, 20-question navigator grid, question content, code snippet block, radio options, auto-save status, and submit confirmation modal.

---

## 14. Organizer Control Center
- Built at `/organizer/rounds`.
- Displays current state badge, valid transition buttons, operational telemetry (startedAt, deadlineAt), emergency lock action, scoring trigger, qualification trigger, and live leaderboard preview table.

---

## 15. Host Projector Display
- Built at `/host/display`.
- Optimized for large screen projection with large monospace countdown timer, team submission progress bar, and top qualifying teams leaderboard.

---

## 16. Security Model & Role Guards
- Participant endpoints protected via `JwtAuthGuard`.
- Organizer endpoints protected via `JwtAuthGuard`, `RolesGuard`, and `@Roles(Role.ORGANIZER)`.
- Identity derived strictly from JWT server context (`req.user.teamId`, `req.user.memberId`).

---

## 17. Refresh & Reconnect Behavior
- Browser refresh fetches authoritative server state (`GET /api/round1/state`) and saved answers (`GET /api/round1/answers`).
- State is completely restored without progress loss or timer extension.

---

## 18. Network Interruption Handling
- Network drop triggers `[RECONNECTING...]` status badge.
- Reconnect re-syncs state from server. Server deadline continues uninterrupted.

---

## 19. Concurrency & Load Testing
- Dedicated test suite `apps/api/test/round1-engine.spec.ts` (24 test scenarios, 100% PASSED).
- Concurrency simulation `apps/api/test/round1-concurrency.load.ts` (200 simultaneous participants, 100% PASSED).
