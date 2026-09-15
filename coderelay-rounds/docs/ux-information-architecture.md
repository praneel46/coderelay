# UX & Information Architecture

## VIDYANTRA 2026 — CODE RELAY Competition Platform

> This document defines the complete UX structure for the Code Relay competition
> platform. All subsequent implementation phases reference this document.

---

## 1. Design Principles

### P1 — Server Authority is Visible
The participant must always understand that the system is in control. Timers are
server-driven. States are server-confirmed. The UI never implies the browser is
running the competition. When a connection drops, the UI says so. When it recovers,
the UI confirms restoration.

### P2 — Role Isolation is Structural
Each portal (Participant, Organizer, Judge, Host) has its own layout shell,
navigation, and permission boundary. A participant cannot stumble into organizer controls.
A judge cannot accidentally modify round timing. The URL structure, navigation, and layout
all reinforce this separation.

### P3 — Competition Focus Over Decoration
During active competition, every pixel serves the participant's task. The timer
is prominent. The question is readable. The answer area is accessible. Everything else is secondary.
Decoration exists on the landing page and in idle states — never during timed competition.

### P4 — State Transitions are Unambiguous
Every meaningful state change — round starting, member handoff, submission received,
connection lost, time expired — must be visually distinct and impossible to miss.
No silent transitions. No ambiguous intermediate states.

### P5 — Progressive Disclosure
Participants see only what they need at each step. They don't see all 20 questions
at once until they're in the quiz. They don't see another member's stage. Organizers see summary
dashboards first, then drill into detail. Complexity is revealed on demand, not dumped upfront.

### P6 — Recoverability Without Anxiety
When a participant's browser crashes, refreshes, or disconnects, the recovery
flow should be calm and fast. "Restoring your session…" → restored. The UX must never suggest that data was lost when
the server has it safe. Reconnection is a routine event, not an emergency.

### P7 — Intentional Visual Hierarchy
Every screen has exactly one primary element, one or two secondary elements, and
supporting context. Nothing competes for attention equally. The eye flows naturally:
timer → question → answer → progress. This is enforced through size, weight, color, and spatial relationships.

---

## 2. Navigation Architecture

### Navigation Patterns by Role

| Role | Pattern | Rationale |
|------|---------|-----------|
| **Participant** | Linear/wizard — minimal top bar only | Competition focus. Participants follow a guided flow, not a dashboard. |
| **Organizer** | Sidebar + top bar — persistent left sidebar with section navigation. Top bar shows active round status, system health. | Information-dense control center. Organizers need rapid access to any section. |
| **Judge** | Minimal sidebar or tabs — small sidebar with Dashboard / Evaluations / Review. | Judges have a focused task: evaluate assigned submissions. |
| **Host** | No navigation — fullscreen display mode. Mode selector is a pre-display control panel. | Projection screens show content, not chrome. |

---

## 3. Complete Route Map

### Public Scope
| Route | Screen | Description |
|-------|--------|-------------|
| `/` | Landing Page | Event introduction, round overview, portal entry points |

### Authentication Scope
| Route | Screen | Description |
|-------|--------|-------------|
| `/login` | Login Portal | Unified login with role selection (Organizer / Judge / Host) |
| `/team-entry` | Team Entry | Team ID + member authentication for participants |

### Participant Scope — `/participant/...`
| Route | Screen | Description |
|-------|--------|-------------|
| `/participant/dashboard` | Team Dashboard | Round cards, qualification status, team info |
| `/participant/arena` | Arena Gate | Round selection + arena access code entry |
| `/participant/arena/code-iq/lobby` | R1 Lobby | Waiting room before Round 1 starts |
| `/participant/arena/code-iq/active` | R1 Active | Live quiz — questions, timer, answers |
| `/participant/arena/code-iq/complete` | R1 Complete | Round finished — score summary |
| `/participant/arena/triple-strike/lobby` | R2 Lobby | Waiting room before Round 2 starts |
| `/participant/arena/triple-strike/active` | R2 Active | Active stage — debugging / coding / predict output |
| `/participant/arena/triple-strike/handoff` | R2 Handoff | Member transition screen |
| `/participant/arena/triple-strike/complete` | R2 Complete | Round finished — summary |
| `/participant/arena/round-3/lobby` | R3 Lobby | Placeholder — waiting room |
| `/participant/arena/round-3/active` | R3 Active | Placeholder — configurable |
| `/participant/arena/round-3/complete` | R3 Complete | Placeholder — summary |
| `/participant/arena/relay-finale/lobby` | R4 Lobby | Waiting room before Round 4 starts |
| `/participant/arena/relay-finale/active` | R4 Active | Live coding with inherited code |
| `/participant/arena/relay-finale/handoff` | R4 Handoff | Relay handoff — snapshot + transition |
| `/participant/arena/relay-finale/complete` | R4 Complete | Final lock confirmation + summary |

### Organizer Scope — `/organizer/...`
| Route | Screen | Description |
|-------|--------|-------------|
| `/organizer/dashboard` | Control Dashboard | Active round, team counts, system health, warnings |
| `/organizer/teams` | Team Management | Team list, search, filter, bulk actions |
| `/organizer/teams/new` | Create Team | Add team + members form |
| `/organizer/teams/import` | Import Teams | CSV/bulk import |
| `/organizer/teams/[id]` | Team Detail | Members, credentials, history, qualification, scores |
| `/organizer/rounds` | Round Management | All rounds, status, configuration |
| `/organizer/rounds/[id]` | Round Detail | Stages, duration, arena codes, lifecycle controls |
| `/organizer/rounds/[id]/live` | Live Monitor | Real-time team/member status during active round |
| `/organizer/questions` | Question Bank | All questions, filter by round/type/status |
| `/organizer/questions/new` | Create Question | Question editor — type, content, options, answer |
| `/organizer/questions/[id]` | Edit Question | Full question editor |
| `/organizer/questions/[id]/preview` | Question Preview | Participant-view preview |
| `/organizer/submissions` | Submissions Browser | All submissions, filter by round/team/member |
| `/organizer/submissions/[id]` | Submission Detail | Answer, code, timestamps, relay snapshots |
| `/organizer/scoring` | Scoring Console | Scores, rankings, qualification, finalization |
| `/organizer/logs` | Event Logs | Security events, audit trail, system events |

### Judge Scope — `/judge/...`
| Route | Screen | Description |
|-------|--------|-------------|
| `/judge/dashboard` | Judge Dashboard | Assigned teams, pending evaluations, completion stats |
| `/judge/evaluations/[assignmentId]` | Evaluation Workspace | Submission viewer + scoring form + comments |
| `/judge/review` | Completed Reviews | All submitted evaluations for review |

### Host Scope — `/host/...`
| Route | Screen | Description |
|-------|--------|-------------|
| `/host/control` | Display Controller | Select display mode, configure what to show |
| `/host/display` | Live Display | Fullscreen projection mode |
| `/host/display/idle` | Idle/Branding | Event branding — pre-competition |
| `/host/display/countdown` | Countdown | Round countdown timer |
| `/host/display/live` | Round Live | Active round status indicators |
| `/host/display/leaderboard` | Leaderboard | Ranked results |
| `/host/display/announcement` | Announcement | Text/qualification announcements |
| `/host/display/results` | Final Results | Winner reveal |

---

## 4. Screen Inventory

| Portal | Unique Screens | Complexity |
|--------|---------------|------------|
| Public + Auth | 3 | Low–Medium |
| Participant | 16 | High |
| Organizer | 16 | Very High |
| Judge | 3 | Medium |
| Host | 7 | Medium |
| **Total** | **45** | |

---

## 5. Participant User Flow

### Step-by-Step Flow
1. **Landing**: Event branding, round overview, "Enter as Participant" button
2. **Team Entry**: Team ID input, then member selection/PIN authentication
3. **Dashboard**: Four round cards (status: Locked / Open / Completed / Qualified), team sidebar
4. **Arena Gate**: Round selector + arena access code input
5. **Validation**: Server validates team, member, qualification, round status, code
6. **Lobby**: Round rules summary, countdown timer, waiting state
7. **Active**: Competition interface (varies by round)
8. **Handoff (R2/R4 only)**: Member stage transition, snapshot saved, next member activated
9. **Complete**: Round summary, score display (when released), return to dashboard
10. **Return**: Dashboard updates with completed round status, next round qualification

### Key Participant UX Decisions
- No persistent sidebar during active competition — minimal top bar only (timer, team code, stage indicator, connection dot).
- No back button during competition — browser back button intercepted with warning.
- Automatic state restoration — refresh or reconnection restores exact server-authoritative state.
- Security overlay — semi-transparent overlay for warnings without fully blocking background context.

---

## 6. Round 1 — Code IQ UX

### Layout Architecture
- Competition bar: round name, timer, team code, connection status
- Question panel: question number, statement, code block, answer options (MCQ)
- Navigation strip: numbered buttons (1 to 20) with status (✓ answered, ● current, ○ unanswered)
- Progress: "Answered: X/20" + "Submit All" button

### Navigation & Timer
- Free navigation across all 20 questions.
- Server-synced countdown timer: White → Yellow (< 5 min) → Red (< 1 min) → Pulsing Red (< 30s).
- Auto-submit when server timer expires.

### Scale Design (~200 participants)
- All 20 questions delivered at round start (no per-question API calls).
- Answer submissions are lightweight POST requests.
- WebSockets used for timer sync and round-state broadcasts only.

---

## 7. Round 2 — Triple Strike UX

### Structure
```
M1 Debugging (3 Qs) → Handoff → M2 Coding (3 Qs) → Handoff → M3 Predict Output (3 Qs)
```
Total: 9 questions (3 per member stage).

### Member Interfaces
- **Member 1 (Debugging)**: 3 questions (buggy code display + editable fix area)
- **Member 2 (Coding)**: 3 questions (problem statement + Monaco editor, no compiler)
- **Member 3 (Predict Output)**: 3 questions (code display + answer input)

### Isolation
- Only one member active at a time; no communication between members.
- Each member sees strictly their own 3 assigned questions.
- Waiting members see a minimal waiting screen only ("Waiting for your turn").
- Waiting members MUST NOT see the active member's questions, answers, code, or progress details.

---

## 8. Round 3 — Placeholder (TBD)

- Round 3 status remains **TBD**.
- The overall round system is architected to be configurable to accommodate future Round 3 requirements without inventing specific rules or committing to finalized round archetypes.
- Dashboard: "To Be Announced" badge.
- Arena Gate: "Not yet open / TBD" — no arena code entry.

---

## 9. Round 4 — Relay Finale UX

### Core Concept: Inherited Code
- Editor loads exact code from previous member's final handoff snapshot.
- Banner: `⚡ INHERITED CODE — left by Member X at HH:MM:SS`
- Member 1 sees: `⚡ STARTING FRESH — you are the first member`

### Snapshot Distinction: Periodic Autosave vs. Final Handoff Snapshot
- **Periodic Snapshot (Autosave)**: Saved every 30 seconds for local crash/recovery protection only. Does NOT constitute an official submission or handoff event.
- **Final Handoff Snapshot (Authoritative Event)**: Triggered when a member submits or timer expires.

### Handoff Execution (Server Transaction)
1. Member submits or stage timer expires.
2. Server transaction begins.
3. Final code snapshot is persisted server-side as the authoritative handoff snapshot.
4. Submission is finalized.
5. Current member is locked.
6. Next member is activated with the exact server snapshot.
7. Transaction completes.

---

## 10. Arena Access Flow

### Sequence
1. Participant selects round on dashboard.
2. Arena Gate shows round info + arena code input.
3. Participant enters announced code.
4. Server validates: team exists, member authenticated, team qualified, round open, code active.
5. Success → create session → navigate to lobby.
6. Failure → clear error message, remain on Arena Gate.

---

## 11. Responsive Strategy

| Breakpoint | Width | Name | Primary Use |
|------------|-------|------|-------------|
| `xs` | < 640px | Mobile | Landing page only |
| `sm` | 640–767px | Small mobile | Landing page, minimal participant |
| `md` | 768–1023px | Tablet | Judge portal, participant lobby |
| `lg` | 1024–1279px | Small laptop | All portals |
| `xl` | 1280–1535px | Laptop | Primary development target |
| `2xl` | 1536px+ | Desktop / Display | Organizer console, host display |

---

## 12. Component Hierarchy

### Tier 1 — Design System Primitives
Button, Input, Select, Textarea, Badge, Card, Modal, Table, Tabs, Toast, Tooltip, Skeleton, Spinner, Separator, Avatar, EmptyState, ErrorState, ConnectionDot

### Tier 2 — Competition Components
CompetitionBar, CountdownTimer, QuestionPanel, CodeBlock, CodeEditor, OptionGroup, QuestionNavigator, RelayTimeline, SecurityIndicator, SecurityWarning, HandoffScreen, WaitingRoom, SubmitDialog, ConnectionStatus, InheritedCodeBanner, AutoSaveIndicator

### Tier 3 — Organizer Components
OrgSidebar, DashboardCard, ActiveRoundPanel, TeamTable, TeamDetail, TeamImporter, RoundCard, RoundLifecycleControls, ArenaCodeManager, QuestionEditor, QuestionPreview, QuestionBankTable, LiveTeamMonitor, SubmissionViewer, RelaySnapshotViewer, ScoringTable, QualificationPanel, AuditLogStream, EventTimeline

### Tier 4 — Host Display Components
DisplayCountdown, DisplayLeaderboard, DisplayAnnouncement, DisplayResults, DisplayBranding, DisplayRoundStatus

---

## 13. UX States

Every major screen must handle: Loading (skeletons), Empty, Error, Offline, Reconnecting, Restored, Unauthorized, Forbidden, Waiting, Active, Locked, Time Warning, Completed, Expired.

---

## 14. Round 2 — Question Count

Official Round 2 structure:
- Member 1 (Debugging): 3 questions
- Member 2 (Coding): 3 questions
- Member 3 (Predict Output): 3 questions
- **Total**: 9 questions.

Navigation within a stage is "Question X of 3".

---

## 15. Network Disconnection & Server Authority

### Fundamental Rule
THE SERVER / DATABASE IS THE SINGLE AUTHORITATIVE SOURCE OF COMPETITION STATE.
The browser is never the source of truth.

### Disconnection & Reconnection Sequence
1. **CONNECTION LOST**: Network connection drops.
2. **Preserve Temporary UI State**: Preserve local UI/editor state temporarily so visible work is not destroyed.
3. **Display Banner**: Show prominent banner: *"Connection lost. Reconnecting…"*
4. **Automatic Reconnection**: Reconnect with exponential backoff.
5. **Server Synchronization**: Fetch and synchronize against server authoritative state.
6. **Restore Authoritative State**: Client state is overwritten by server state.
7. **Display Confirmation**: Show *"State synchronized"* notification (auto-dismisses 3s).

### Critical Reliability Rules
- **Client-side queued actions MUST NOT automatically become official submissions**.
- **Client-side timestamps MUST NOT be treated as official competition timestamps**. Official Round 1 tie-breaking rules:
  1. Higher score ranks first.
  2. If scores are tied, faster response (based on server timestamps) ranks first.
- **Disconnected browsers MUST NOT extend official competition time**.
- **Server state always wins**.

---

## 16. Security Violations — Server Authority

### Rule
3 security violations → current member's active stage is automatically submitted and locked.

### Server-Authoritative Enforcement
- The **server** is the authority on the official warning count.
- The **server** decides when to issue a warning.
- The **server** decides when to force-submit and lock a stage.
- The browser must **never independently** decide warning counts or force submission.

---

## 17. Accessibility Requirements

- Minimum body text: 16px
- Color contrast: WCAG AA (4.5:1 body, 3:1 large text)
- All interactive elements focusable via Tab with visible focus states (2px ring)
- Form inputs have associated labels, ARIA live regions for dynamic status updates
- Respect `prefers-reduced-motion`

---

## 18. Open UX Decisions

- **OUX-1 (R1 Flagging)**: Recommend flag icon per question for review.
- **OUX-2 (R1 Delivery)**: All 20 questions delivered at round start.
- **OUX-3 (R2 Debugging Input)**: Editable copy of buggy code in Monaco Editor.
- **OUX-4 (Score Visibility)**: Organizer-controlled score release.
- **OUX-5 (Host Display)**: Automatic state transitions with manual organizer override.
- **OUX-6 (Organizer Live Monitor)**: Hybrid approach (WebSockets for critical events, 5s polling for grid).
- **OUX-7 (Team Dashboard Between Rounds)**: Show round cards + qualification status.

---

## Appendix A: Complete User Flow Checklists

### Participant Checklist
- [x] Can land on landing page & navigate to team entry
- [x] Can authenticate with Team ID + member credentials
- [x] Can see team dashboard with all 4 rounds & qualification status
- [x] Can select round, enter arena access code, receive server validation
- [x] Can enter lobby/waiting room & see round rules
- [x] Transitions to active competition on server signal
- [x] Can interact with questions (R1: 20 MCQ, R2: 3 per member, R4: code editor)
- [x] Sees timer, connection status, security warnings (R2/R4)
- [x] Submits answers & receives server-confirmed submission state
- [x] Sees handoff screen (R2/R4) & completion screen
- [x] State restored on refresh/reconnect from server source of truth

### Organizer Checklist
- [x] Can login & access Control Dashboard
- [x] Can manage teams, import CSV, generate credentials
- [x] Can manage question bank (create, edit, preview, publish, lock)
- [x] Can configure rounds, generate/revoke arena codes, control round lifecycle
- [x] Can monitor live competition, view submissions, run auto-scoring, enter manual scores, finalize rankings & qualification
- [x] Can view security & audit logs

### Judge Checklist
- [x] Can login & see assigned teams/pending evaluations
- [x] Can view submission code & R4 relay snapshots
- [x] Can enter scores, comments & submit evaluations

### Host Checklist
- [x] Can select display mode & enter fullscreen projection
- [x] Displays update automatically via WebSocket with large-format typography
- [x] No sensitive participant data exposed
