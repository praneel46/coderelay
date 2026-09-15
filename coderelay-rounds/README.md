# VIDYANTRA 2026 — CODE RELAY

## Competition Platform

A production-grade competition platform for the Vidyantra 2026 Code Relay programming event.

This directory contains the full-stack application (Next.js + NestJS + PostgreSQL) that powers:

- **Participant Portal** — Team entry, arena access, timed competition rounds
- **Organizer Console** — Team management, question bank, round control, live monitoring, scoring
- **Judge Portal** — Submission review, evaluation, scoring
- **Host Display** — Projection-optimized countdown, leaderboard, announcements

### Competition Rounds

| Round | Name | Format |
|-------|------|--------|
| 1 | Code IQ | 20 questions, 20 minutes, ~200 participants, auto-scored |
| 2 | Triple Strike | 3-member sequential relay: Debugging → Coding → Predict Output |
| 3 | TBD | Configurable |
| 4 | Relay Finale | 3-member code relay with inherited codebase |

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Code Editor | Monaco Editor |
| Backend | NestJS, Node.js, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Real-time | Socket.IO |

### Project Structure

```
coderelay-rounds/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   └── shared/       # Shared types and constants
├── prisma/           # Database schema and migrations
└── docs/             # Architecture and design documentation
```

### Development Phases

See [PHASES.md](./PHASES.md) for the complete development roadmap.

### Repository Note

The parent directory contains the static landing page (`index.html`, `styles.css`, `script.js`, `assets/`). That is an independent public website and is not part of this application.
