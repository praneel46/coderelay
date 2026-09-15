# VIDYANTRA 2026 // CODE RELAY — Production Deployment & Infrastructure Guide

This guide provides the authoritative step-by-step procedure for deploying the **VIDYANTRA 2026 // CODE RELAY** competition platform to production hosting infrastructure (e.g. Vercel for Web Frontend, Render/Railway/AWS for NestJS API, and managed PostgreSQL for Database).

---

## NON-NEGOTIABLE PRODUCTION DIRECTIVES

> [!CAUTION]
> **NEVER USE `prisma db push` IN PRODUCTION.**
> `prisma db push` is strictly for local prototyping. It bypasses migration safety checks and can cause accidental data loss or schema drift. Always execute `npx prisma migrate deploy --schema=prisma/schema.prisma`.

> [!CAUTION]
> **DO NOT RUN THE DEVELOPMENT SEED AGAINST THE PRODUCTION DATABASE.**
> The development seed (`prisma/seed.ts`) contains sample test teams (`ALPHA-042`, `BETA-099`) and default development passwords (`password123`). Production event data must be provisioned cleanly using real organizer credentials and official competition team rosters.

---

## REQUIRED PRODUCTION ENVIRONMENT VARIABLES

### NestJS API Server (Render / Railway / AWS)
```env
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<dbname>?sslmode=require"
JWT_SECRET="<high-entropy-random-production-secret-key>"
PORT=3001
CORS_ORIGIN="https://coderelay.example.com"
NODE_ENV="production"
```

### Next.js Web Frontend (Vercel)
```env
API_URL="https://api-coderelay.example.com"
NEXT_PUBLIC_API_URL="https://api-coderelay.example.com"
NODE_ENV="production"
```

---

## PRODUCTION DEPLOYMENT SEQUENCE

Follow these 15 steps strictly in order when preparing for the live event:

1. **Provision Managed PostgreSQL Instance**:
   Set up a managed PostgreSQL 14+ database instance with connection pooling (e.g., PgBouncer / Supabase Pooler) on Railway, Render, Supabase, or AWS RDS.

2. **Obtain Connection String**:
   Copy the secure production `DATABASE_URL` connection string (ensure `?sslmode=require` or provider SSL flags are appended).

3. **Configure API Environment Variables**:
   In your API hosting provider control panel, set `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`, and `NODE_ENV=production`.

4. **Configure Web Environment Variables**:
   In your Web hosting provider control panel (e.g., Vercel), set `API_URL`, `NEXT_PUBLIC_API_URL`, and `NODE_ENV=production`.

5. **Deploy NestJS API Server**:
   Deploy `apps/api` to your hosting provider. Verify that process boots on `PORT` and logs startup confirmation.

6. **Execute Production Schema Migration**:
   Run the production migration command against the remote database:
   ```bash
   npx prisma migrate deploy --schema=prisma/schema.prisma
   ```
   *This transactionally applies all 5 migration SQL scripts (`20260914000000_init`, `20260914180000_add_submission_is_final`, `20260914190000_add_round_representative`, `20260914200000_extend_stage_session`, `20260914210000_add_paused_at_to_round`).*

7. **Verify API Health Endpoint**:
   Perform a `GET` request to `https://<your-api-domain>/api/health` and verify HTTP 200 response (`{"status":"ok", ...}`).

8. **Deploy Next.js Web Frontend**:
   Deploy `apps/web` to Vercel or target host.

9. **Verify Web → API Communication**:
   Open frontend URLs (`/team-entry`, `/login`, `/host/display`, `/judge/dashboard`) and verify HTTP requests to `/api/*` reach NestJS backend without 404 or CORS errors.

10. **Verify Socket.IO Realtime Connection**:
    Ensure clients connect to namespace `/ws` on `https://<your-api-domain>/ws` and receive lifecycle event updates.

11. **Provision Production Console Credentials**:
    Create official system accounts for Organizer, Judge, and Host using strong passwords via administrative endpoints or initial secure bootstrap.

12. **Import Official Competition Teams**:
    Import registered team records (Team Code, Team Name, Member Names) and generate secure Team Access Codes.

13. **Perform Production Rehearsal**:
    Conduct an end-to-end dry run testing Participant login, Organizer round loading (`LOAD ROUND`), event start (`START EVENT` 5s countdown), seat handoffs, submission, judging, and Host display.

14. **Take Event Database Backup**:
    Create a complete snapshot/backup of the PostgreSQL database prior to opening the physical arena.

15. **Freeze Production Version**:
    Freeze code deployment and configuration settings for the duration of the competition.

---

## TROUBLESHOOTING & EMERGENCY PROTOCOLS

- **500 Internal Server Error on Login**: Verify PostgreSQL database service availability, connection string, and SSL settings.
- **CORS Rejected**: Ensure `CORS_ORIGIN` matches the exact scheme and hostname of the frontend (`https://...`).
- **Emergency Lock**: Use the `🚨 EMERGENCY LOCK` action in the Organizer Console to immediately lock active rounds if physical arena issues occur.
