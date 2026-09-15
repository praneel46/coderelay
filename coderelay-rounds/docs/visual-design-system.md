# Visual Design System

## VIDYANTRA 2026 — CODE RELAY Competition Platform

> **Document Status**: Approved Visual Design Specification (Phase 2)  
> **Source of Truth**: [UX & Information Architecture](./ux-information-architecture.md)  
> **Scope**: Design tokens, component specs, typography, colors, page-by-page visual layouts for all 4 portals (Participant, Organizer, Judge, Host).

---

## 1. Design Philosophy

The VIDYANTRA 2026 — CODE RELAY platform is built on six visual design pillars:

1. **Precision & Technical Sophistication**: A dark, near-black foundation with crisp 1px borders, subtle surface elevations, and precise grid alignment. It feels like a high-performance developer tool (IDE / competition arena) rather than a generic admin dashboard or marketing template.
2. **Strict Dual-Environment Separation**:
   - *Public / Event Experience*: Expressive typography, subtle cyan ambient glows, polished hero compositions, and smooth micro-interactions.
   - *Live Competition Experience*: Utterly distraction-free. **Clarity > Decoration**. Zero ambient glows, zero decorative animations, maximum legibility, prominent timers, and unmistakable state badges.
3. **Server Authority Made Visible**: Visual indicators clearly communicate when state is server-confirmed versus when the client is disconnected. Reconnection and synchronization states are displayed calmly and unambiguously.
4. **Member Isolation Enforcement**: Sequential relay screens (Round 2 & Round 4) strictly hide unassigned question content, code snippets, and active answers from non-active members.
5. **Legibility Under Stress**: High-contrast monospace typography for code, timers, team IDs, and technical metrics; clear sans-serif for UI labels and instructions.
6. **Data Density without Chaos**: Organizer and Judge consoles utilize compact, high-density data tables and split-pane workspaces with high visual hierarchy so complex information can be scanned in seconds.

---

## 2. Visual Direction

### A. Public / Event Experience
- **Context**: Landing page entry, login, team entry, round selection cards.
- **Visual Feel**: Sophisticated, dark technical aesthetic. Near-black background (`#07090e`), subtle cyan accent highlights (`#00d2ff`), soft border outlines (`#1e293b`).
- **Permitted Effects**: Ambient radial gradients (max 15% opacity), subtle card hover borders, smooth tab transitions.

### B. Live Competition Experience
- **Context**: Round 1 (Code IQ), Round 2 (Triple Strike active member), Round 4 (Relay Finale active coding), Security overlays, Handoff screens.
- **Visual Feel**: Pure functional IDE atmosphere. Solid charcoal surfaces (`#0f141c`), high contrast white/cyan text, strict 1px grid lines.
- **Forbidden Effects**: No floating particles, no ambient radial glows, no decorative page transitions, no pulsing background animations during active coding.

---

## 3. Color System

### Primary Color Palette Tokens

```css
:root {
  /* Background Foundations */
  --bg-app: #07090e;             /* Near-black deep foundation */
  --bg-surface-base: #0f141c;    /* Primary card & container background */
  --bg-surface-elevated: #161f2c;/* Modal, popover, & dropdown background */
  --bg-surface-overlay: #1e293b; /* Active highlight & hover background */

  /* Borders & Dividers */
  --border-subtle: #1e293b;     /* Primary container border (1px solid) */
  --border-medium: #334155;     /* Input & interactive border */
  --border-focus: #00d2ff;      /* Focus ring & active selection border */

  /* Typography Colors */
  --text-primary: #f8fafc;       /* Headings, primary labels, active code */
  --text-secondary: #cbd5e1;     /* Body text, problem descriptions */
  --text-muted: #64748b;         /* Captions, disabled text, secondary metadata */
  --text-inverse: #07090e;       /* Text inside bright accent badges/buttons */

  /* Technical Cyan Accent (Primary Brand & Active State) */
  --accent-cyan: #00d2ff;        /* Primary interactive color, timer normal */
  --accent-cyan-hover: #38bdf8;  /* Hover state for primary buttons */
  --accent-cyan-active: #0284c7; /* Pressed state */
  --accent-cyan-subtle: rgba(0, 210, 255, 0.08); /* Selection background */

  /* Semantic Status Colors */
  --status-success: #10b981;     /* Answered, Server Synced, Qualified, Completed */
  --status-success-bg: rgba(16, 185, 129, 0.1);

  --status-warning: #f59e0b;     /* Timer < 5m, Security Warning 1 & 2, Reconnecting */
  --status-warning-bg: rgba(245, 158, 11, 0.1);

  --status-danger: #ef4444;      /* Timer < 1m, 3rd Security Lock, Expired, Disqualified */
  --status-danger-bg: rgba(239, 68, 68, 0.1);

  --status-info: #6366f1;        /* Inherited Code Banner, Stage Transition Info */
  --status-info-bg: rgba(99, 102, 241, 0.1);
}
```

### Color Contrast Guidelines
- `var(--text-primary)` on `var(--bg-app)`: Contrast ratio **17.2:1** (Exceeds WCAG AAA).
- `var(--text-secondary)` on `var(--bg-surface-base)`: Contrast ratio **11.4:1** (Exceeds WCAG AAA).
- `var(--accent-cyan)` on `var(--bg-app)`: Contrast ratio **12.1:1** for icons and borders; when used for text, minimum font weight is 600.
- Status text on dark background surfaces pairs colored icons with high-contrast text labels.

---

## 4. Typography

### Font Pairing
- **Primary UI & Display Font**: `Plus Jakarta Sans` or `Inter` (sans-serif)
  - Fallback: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Monospace Code & Technical Font**: `JetBrains Mono` (monospace)
  - Fallback: `'Fira Code', 'Cascadia Code', Consolas, Monaco, monospace`

### Typography Scale

| Token | Font Family | Size | Weight | Line Height | Letter Spacing | Primary Use |
|-------|-------------|------|--------|-------------|----------------|-------------|
| `display-2xl` | Sans-Serif | 72px (4.5rem) | 800 Bold | 1.1 | -0.02em | Host Display Timer / Winner Reveal |
| `display-xl` | Sans-Serif | 48px (3.0rem) | 800 Bold | 1.15 | -0.02em | Hero Headings, Host Screen Titles |
| `heading-lg` | Sans-Serif | 32px (2.0rem) | 700 Bold | 1.2 | -0.01em | Section Titles, Modal Headers |
| `heading-md` | Sans-Serif | 24px (1.5rem) | 600 SemiBold | 1.3 | -0.01em | Card Titles, Portal Screen Headers |
| `heading-sm` | Sans-Serif | 18px (1.125rem) | 600 SemiBold | 1.4 | 0em | Subsection Headers, Table Titles |
| `body-lg` | Sans-Serif | 16px (1.0rem) | 400 Regular | 1.5 | 0em | Problem Statements, Public Copy |
| `body-md` | Sans-Serif | 14px (0.875rem) | 400 Regular | 1.5 | 0em | Standard Form Inputs, Table Cells |
| `caption` | Sans-Serif | 12px (0.75rem) | 500 Medium | 1.4 | 0.02em | Tooltips, Status Badges, Meta Labels |
| `code-lg` | Monospace | 16px (1.0rem) | 500 Medium | 1.5 | 0em | Monaco Code Editor, Code IQ Blocks |
| `code-md` | Monospace | 14px (0.875rem) | 400 Regular | 1.5 | 0em | Inline Code Snippets, Predict Output |
| `timer-display` | Monospace | 28px (1.75rem) | 700 Bold | 1.0 | 0.05em | Competition Header Countdown Timer |

---

## 5. Spacing & Layout System

### Grid Baseline: 4px / 8px Modular Scale
- **Spacing Tokens**:
  - `space-1`: 4px (tight inline padding, badge offsets)
  - `space-2`: 8px (component internal gap, icon-to-text spacing)
  - `space-3`: 12px (small input padding, compact table cell padding)
  - `space-4`: 16px (standard container padding, form field gap)
  - `space-6`: 24px (card padding, section internal layout gap)
  - `space-8`: 32px (panel spacing, modal padding)
  - `space-12`: 48px (page section margins)
  - `space-16`: 64px (hero padding, display margins)

### Max Content Widths
- **Public Landing**: `1280px` centered
- **Participant Competition Shell**: `1440px` max-width or `100vw` edge-to-edge during split-pane editing
- **Organizer Console**: `1600px` max-width or full viewport grid
- **Judge Split Workspace**: `100vw` edge-to-edge (60% submission viewer / 40% evaluation panel)
- **Host Display**: `100vw` edge-to-edge (optimized for 16:9 1080p/4K projector output)

---

## 6. Shape Language & Elevation

### Corner Radius Scale
- `radius-sm`: 4px — Buttons, Badges, Tooltips, Table Rows
- `radius-md`: 6px — Form Inputs, Code Blocks, Small Cards
- `radius-lg`: 8px — Standard Cards, Panels, Modals, Editor Shells
- `radius-pill`: 9999px — Status Dots, Floating Navigation Pills

*Note: Rounded bubble UI (>12px radius) is strictly avoided to preserve a crisp, technical IDE feel.*

### Elevation & Layering Scale
- **Flat (Layer 0)**: `--bg-app` (`#07090e`) — Screen base background
- **Surface (Layer 1)**: `--bg-surface-base` (`#0f141c`) + 1px border `--border-subtle` — Cards, Panels, Data Tables
- **Elevated (Layer 2)**: `--bg-surface-elevated` (`#161f2c`) + shadow `0 10px 25px -5px rgba(0,0,0,0.5)` — Dropdowns, Popovers, Active Floating Controls
- **Overlay (Layer 3)**: `--bg-surface-elevated` + Backdrop Blur `8px` + shadow `0 25px 50px -12px rgba(0,0,0,0.75)` — Modals, Security Overlay Warning

---

## 7. Button System

### Button Variants

| Variant | Background | Text Color | Border | Hover State | Active / Focus |
|---------|------------|------------|--------|-------------|----------------|
| **Primary** | `var(--accent-cyan)` | `var(--text-inverse)` | None | `var(--accent-cyan-hover)` | `var(--accent-cyan-active)` + 2px focus ring |
| **Secondary** | `var(--bg-surface-elevated)` | `var(--text-primary)` | `1px solid var(--border-medium)` | `--bg-surface-overlay` | Border `--border-focus` |
| **Ghost** | Transparent | `var(--text-secondary)` | None | Background `rgba(255,255,255,0.05)` | Text `var(--text-primary)` |
| **Danger / Destructive** | `var(--status-danger)` | `#ffffff` | None | `#dc2626` | 2px ring `#fca5a5` |
| **Outline Danger** | Transparent | `var(--status-danger)` | `1px solid var(--status-danger)` | `var(--status-danger-bg)` | Border `#ef4444` |

### Button Sizes
- **Small (`btn-sm`)**: Height 32px, Padding 0 12px, Font Size 12px (Medium)
- **Medium (`btn-md`)**: Height 40px, Padding 0 16px, Font Size 14px (SemiBold)
- **Large (`btn-lg`)**: Height 48px, Padding 0 24px, Font Size 16px (SemiBold)

### Action Mappings
- **START ROUND / OPEN ARENA**: `btn-lg primary` with cyan accent
- **SUBMIT STAGE / ANSWER**: `btn-md primary`
- **FINAL SUBMIT & LOCK**: `btn-lg primary` with confirmation modal
- **FORCE SUBMIT / DISQUALIFY (Organizer)**: `btn-md danger`
- **CANCEL / BACK**: `btn-md secondary` or `ghost`

---

## 8. Form & Input System

### Form Inputs
- **Default State**: Background `var(--bg-app)`, Border `1px solid var(--border-medium)`, Text `var(--text-primary)`, Height 40px, Padding 0 12px, Radius `6px`.
- **Hover State**: Border `var(--text-muted)`.
- **Focus State**: Border `var(--accent-cyan)`, Outline `2px solid rgba(0, 210, 255, 0.2)`.
- **Error State**: Border `var(--status-danger)`, Error Text `var(--status-danger)` (12px caption below input).
- **Disabled State**: Background `rgba(255,255,255,0.02)`, Text `var(--text-muted)`, Cursor `not-allowed`.

### Code / Monospace Input
- Uses `JetBrains Mono`, 14px, 1.5 line-height for PIN inputs, Team Code inputs, and predict output answers.

---

## 9. Timer Visual Design

The timer is a central component of the competition shell.

```
┌────────────────────────────────────────┐
│ ⏱ 14:32 SERVER SYNCED                 │
└────────────────────────────────────────┘
```

### Specifications
- **Font**: `JetBrains Mono` 700 Bold, 24px (`timer-display`).
- **Container**: Padding 6px 16px, Background `var(--bg-surface-base)`, Border `1px solid var(--border-medium)`, Radius `6px`.
- **State Colors**:
  - **Normal (> 5m remaining)**: Text `var(--accent-cyan)`, Icon Cyan.
  - **Warning (1m to 5m remaining)**: Text `var(--status-warning)` (`#f59e0b`), Border `#f59e0b`.
  - **Critical (< 1m remaining)**: Text `var(--status-danger)` (`#ef4444`), Border `#ef4444`, 1Hz border pulse.
  - **Expired (00:00)**: Text `var(--text-muted)`, Background `var(--status-danger-bg)`.
- **Non-Distracting Motion**: Color transitions take 300ms ease. Only when time is < 30 seconds does a 1Hz subtle opacity pulse occur on the timer border.

---

## 10. Competition Status & Badge System

Status badges pair colored icons with text labels to ensure accessibility without relying on color alone.

| Status | Icon | Badge Background | Text & Border Color |
|--------|------|------------------|---------------------|
| **CONNECTED / SYNCED** | ● (Solid Green Dot) | `var(--status-success-bg)` | `var(--status-success)` |
| **RECONNECTING** | 🔄 (Spinning Yellow) | `var(--status-warning-bg)` | `var(--status-warning)` |
| **CONNECTION LOST** | ⚠ (Yellow Warning) | `var(--status-warning-bg)` | `var(--status-warning)` |
| **STAGE ACTIVE** | ● (Cyan Dot) | `var(--accent-cyan-subtle)` | `var(--accent-cyan)` |
| **STAGE LOCKED** | 🔒 (Lock Icon) | `rgba(255,255,255,0.05)` | `var(--text-muted)` |
| **WARNING 1/3** | ⚠ (Orange Alert) | `var(--status-warning-bg)` | `var(--status-warning)` |
| **WARNING 3/3 LOCK** | 🔒 (Red Lock) | `var(--status-danger-bg)` | `var(--status-danger)` |
| **QUALIFIED** | ✓ (Green Check) | `var(--status-success-bg)` | `var(--status-success)` |
| **DRAFT** | 📝 (Muted Pen) | `rgba(255,255,255,0.05)` | `var(--text-muted)` |
| **PUBLISHED** | 🌐 (Blue Globe) | `var(--status-info-bg)` | `var(--status-info)` |

---

## 11. Participant Arena Layouts

### Competition Shell Structure
The participant competition interface utilizes a distraction-free layout with a fixed top bar and a full-height work area.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [VIDYANTRA 2026] │ ROUND 1: CODE IQ │ ⏱ 14:32 │ TEAM-042 (M1) │ [● SYNCED]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                           MAIN WORK AREA                                │
│       (Question Panel / Monaco Code Editor / Predict Output UI)         │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  Question Navigator / Action Bar (Submit Stage / Save Status)            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Round 1 — Code IQ Visual Design

### Specifications
- **Scale**: Designed to feel fast and lightweight for 200 concurrent participants.
- **Top Bar**: Shows "ROUND 1: CODE IQ", active countdown timer, Team ID, and Connection Dot.
- **Question Navigation Strip**: Fixed at bottom of screen. Horizontal row of numbered buttons (1 to 20):
  - `Answered`: Solid green background (`#10b981`), white text `✓`.
  - `Current`: Cyan border (`#00d2ff`), cyan text `●`.
  - `Unanswered`: Charcoal surface (`#161f2c`), muted text `○`.
  - `Flagged`: Subtle orange corner indicator `⚑`.
- **Question Container**: Max-width `900px` centered.
  - Question header: "Question 7 of 20" (14px monospace muted).
  - Code Block: Read-only syntax-highlighted block (`JetBrains Mono`, 14px, background `#07090e`).
  - Answer Options: MCQ radio cards with clear 1px hover borders and cyan background highlight when selected.

---

## 13. Round 2 — Triple Strike Visual Design

### Relay Header Visualization
A persistent stage progress bar shows the sequential flow:

```
┌──────────────────────────────────────────────────────────────┐
│  MEMBER 1: DEBUGGING    MEMBER 2: CODING    MEMBER 3: PREDICT │
│  [3 Questions] ✓       [3 Questions] ●     [3 Questions] ○   │
│  (10 min - Complete)   (10 min - Active)   (10 min - Waiting)│
└──────────────────────────────────────────────────────────────┘
```

### Stage Interfaces (3 Questions per Member, 9 Total)
1. **Member 1 (Debugging)**:
   - Left side: Buggy code block (read-only, syntax highlighted, line numbers).
   - Right side: Monaco editor shell pre-filled with buggy code for direct inline fixing.
   - Header: "Question X of 3".
2. **Member 2 (Coding)**:
   - Split view: Problem statement on left (40%), Monaco code editor on right (60%).
   - Editor header explicitly displays: `⚠ NO COMPILER / RUN ACTION. Code will be evaluated as-is upon submission.`
3. **Member 3 (Predict Output)**:
   - Top container: Read-only code snippet in `JetBrains Mono`.
   - Bottom container: MCQ or text output prediction box with "Question X of 3".

### Member Isolation Rules
- Non-active members see a neutral waiting screen:
  ```
  ┌──────────────────────────────────────────────────────────┐
  │ ⏳ WAITING FOR YOUR TURN                                  │
  │ Member 2 is currently active in Stage 2 (Coding).        │
  │ Please wait in the physical arena.                       │
  │ (Content, questions, and code are hidden for fairness)  │
  └──────────────────────────────────────────────────────────┘
  ```

---

## 14. Round 4 — Relay Finale Visual Design

### Signature UX Element: `INHERITED CODE`

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ⚡ INHERITED CODE — Left by Member 1 at 15:04:12                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Specifications
- **Inherited Code Banner**: Full-width bar above the editor in deep indigo/blue (`var(--status-info-bg)`), with an info icon, bold text `INHERITED CODE`, and the timestamp of Member 1's final handoff snapshot.
- **Member 1 (First Member)**: Banner reads `⚡ STARTING FRESH — You are the first member creating the base solution.`
- **Relay Timeline Bar**:
  - `M1 (Initial)`: Completed checkmark `✓`.
  - `M2 (Extend & Debug)`: Active dot `●`.
  - `M3 (Final Optimize)`: Waiting circle `○`.
- **Status Bar**: `Auto-saving... Last saved: 3s ago (Recovery protection only)`.

---

## 15. Handoff Visualization & State Transitions

### Transition Sequence
1. **Member Stage End**: Participant clicks "Submit Stage" or server timer hits `00:00`.
2. **Server Transaction**: Screen displays a full-screen transition card:
   ```
   ┌──────────────────────────────────────────────────────────┐
   │ 🔒 STAGE COMPLETE                                         │
   │ Final code snapshot saved server-side.                    │
   │ Member 1 session locked.                                  │
   │ Activating Member 2...                                    │
   └──────────────────────────────────────────────────────────┘
   ```
3. **Handoff Lock**: Current member's editor becomes read-only with a grayed overlay (`opacity 0.6`).
4. **Member Activation**: Next member's screen receives WebSocket `stage:activated` signal and loads the authoritative server handoff snapshot.

---

## 16. Organizer Console Visual Design

The Organizer Console is an information-dense technical control center.

```
┌───────────────────────────────────────────────────────────────────────────┐
│ [VIDYANTRA ORG] │ Dashboard  Teams  Rounds  Questions  Submissions  Logs  │
├──────────────┬────────────────────────────────────────────────────────────┤
│ ACTIVE ROUND │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│ Triple Strike│ │ TEAMS: 64    │ │ ACTIVE: 42   │ │ WARNINGS: 3  │          │
│ [PAUSE] [END]│ └──────────────┘ └──────────────┘ └──────────────┘          │
│              │ Live Team Status Grid                                      │
│ ARENA CODE   │ ┌────────────────────────────────────────────────────────┐ │
│ STRIKE-7394  │ │ Team ID   │ Member │ Stage     │ Timer │ Status   │ │
│ [REVOKE]     │ │ ALPHA-042 │ M2     │ Coding    │ 08:12 │ ● Active │ │
│              │ │ BETA-017  │ M1     │ Debugging │ 02:44 │ ⚠ Warn 1 │ │
│              │ └────────────────────────────────────────────────────────┘ │
└──────────────┴────────────────────────────────────────────────────────────┘
```

### Status Lifecycle Badges for Questions & Rounds
- **DRAFT**: Gray outline badge `DRAFT`.
- **PUBLISHED**: Indigo solid badge `PUBLISHED`.
- **LOCKED**: Red solid badge `LOCKED` (Immutable once active in a live round).

---

## 17. Question Editor Visual Specs

### Interface Layout
- **Dynamic Form**: Adapts based on selected Question Type (MCQ, Predict Output, Debugging, Coding).
- **Fields**: Title, Type dropdown, Target Round/Stage, Marks, Difficulty (Easy/Medium/Hard), Problem Statement (Markdown editor), Code Snippet box (`JetBrains Mono`), Options / Correct Answer / Reference Solution.
- **State Badges**: Clearly shows `DRAFT` (editable) vs `PUBLISHED` (ready) vs `LOCKED` (live).
- **Participant Preview Button**: Opens a modal showing the exact participant-facing rendering.

---

## 18. Judge Interface Visual Specs

### Split-Pane Layout
- **Left Pane (60%)**: Read-only code viewer with tabbed access to Round 4 relay snapshots (`Member 1 Snapshot`, `Member 2 Snapshot`, `Final Snapshot`).
- **Right Pane (40%)**: Structured evaluation form.
  - **Rubric Weightings**:
    - Correctness / Test Cases (40%)
    - Code Completion (20%)
    - Debugging / Problem Solving (15%)
    - Time Efficiency (15%)
    - Code Quality / Readability (10%)
  - Score Input boxes with min/max validation.
  - Feedback comment textarea.
  - `Submit Evaluation` primary button.

---

## 19. Host Display Visual Specs

### Projection / LED Screen Layout
- **Viewport**: Scaled for 1080p / 4K projection screens. Minimum font size 24px; primary display numbers **72px+**.
- **Display Modes**:
  - `Idle`: Large event wordmark, countdown to event start.
  - `Countdown`: Massive 120px monospace countdown timer.
  - `Round Live`: Round name, active team progress bar, stage breakdown.
  - `Leaderboard`: High-contrast table with top 10/20 ranked teams.
  - `Results / Podium`: Celebratory gold/cyan winner reveal stage.

---

## 20. Access & Arena Gate Visual Specs

```
┌──────────────────────────────────────────────────────────────┐
│                  ENTER ARENA ACCESS CODE                     │
│                                                              │
│  Select Round:  [ Round 1: Code IQ           ▼ ]             │
│                                                              │
│  Arena Access Code:                                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ CODEIQ-4821                                            │  │
│  └────────────────────────────────────────────────────────┘  │
│  (Announced by the organizer in the physical hall)           │
│                                                              │
│                   [ Enter Arena Gate → ]                     │
└──────────────────────────────────────────────────────────────┘
```

- **Validation States**:
  - *Valid*: Green checkmark → automatic transition to Lobby.
  - *Invalid Code*: Red input border + "Invalid arena access code. Please check physical hall display."
  - *Not Qualified*: Yellow warning banner + "Team ALPHA-042 is not qualified for Round 2."
  - *Round Closed*: Muted banner + "Round 1 is currently closed by the organizer."

---

## 21. Security & Reliability UI Specs

### Security Warning Overlay
Appears when the browser detects fullscreen exit or tab switching:

```
┌──────────────────────────────────────────────────────────────┐
│ ⚠ SECURITY VIOLATION DETECTED (Warning 1 of 3)              │
│ Tab switch or window focus change recorded.                   │
│ Timestamp: 15:04:12 (Server Logged)                          │
│ Note: On 3rd warning, the server will force-submit & lock.   │
│                                                              │
│                  [ I Understand — Continue ]                 │
└──────────────────────────────────────────────────────────────┘
```

### Connection Disconnection & Synchronization Banner
- **Connection Lost**: Fixed top banner in Amber/Yellow: `⚡ Connection lost. Reconnecting... (Local UI preserved, server timer running)`.
- **Server Synchronized**: Brief Green banner: `✓ Connection restored. Authoritative server state synchronized.` (Auto-dismisses in 3s).

---

## 22. Design Tokens Reference

```json
{
  "colors": {
    "bgApp": "#07090e",
    "bgSurfaceBase": "#0f141c",
    "bgSurfaceElevated": "#161f2c",
    "bgSurfaceOverlay": "#1e293b",
    "borderSubtle": "#1e293b",
    "borderMedium": "#334155",
    "borderFocus": "#00d2ff",
    "textPrimary": "#f8fafc",
    "textSecondary": "#cbd5e1",
    "textMuted": "#64748b",
    "accentCyan": "#00d2ff",
    "statusSuccess": "#10b981",
    "statusWarning": "#f59e0b",
    "statusDanger": "#ef4444",
    "statusInfo": "#6366f1"
  },
  "radii": {
    "sm": "4px",
    "md": "6px",
    "lg": "8px",
    "pill": "9999px"
  },
  "fonts": {
    "sans": "Plus Jakarta Sans, Inter, system-ui, sans-serif",
    "mono": "JetBrains Mono, Fira Code, monospace"
  }
}
```

---

## 23. Design Consistency Rules (DOs & DON'Ts)

### DO
- **DO** use `JetBrains Mono` for all timers, code snippets, team IDs, and scores.
- **DO** display explicit text labels alongside colored status dots.
- **DO** make the server connection state visible at all times during competition.
- **DO** use 1px solid borders (`#1e293b`) for container separation.

### DON'T
- **DON'T** use ambient radial glows or background animations during live competition screens.
- **DON'T** design a "Run Code" or "Compile" button in Round 2 or Round 4 (code is submitted as-is).
- **DON'T** reveal questions, code, or progress of active members to waiting relay members.
- **DON'T** use rounded bubble UI corners (> 12px radius).
- **DON'T** place critical action buttons (e.g. "Final Submit") without a secondary confirmation modal.

---

## 24. Handoff Notes for Frontend Implementation (Phase 3+)

1. **CSS Custom Properties**: All tokens defined in Section 3 map directly to Tailwind CSS variables (`tailwind.config.ts`).
2. **Monaco Editor Integration**: Theme name `code-relay-dark` matching background `#07090e` and selection `#00d2ff22`.
3. **No Code Created in Phase 2**: This document is the visual spec output for Phase 2. No production code was modified or generated.
