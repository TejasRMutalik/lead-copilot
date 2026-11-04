# Phase 1: Database

## Goal
Neon Postgres connected, schema applied, and small typed query helpers ready for every later phase.

## Build steps
1. Create a Neon project (region: closest to Vercel region, e.g. Singapore `ap-southeast-1`). Copy the pooled connection string into `.env.local` as `DATABASE_URL` and into Vercel env vars.
2. Write `db/schema.sql` exactly as in ARCHITECTURE.md section 4, including indexes and `create extension if not exists pgcrypto;` for `gen_random_uuid()`. Use `create table if not exists` so it is safe to re-run.
3. Write `db/migrate.ts`: reads schema.sql and runs it. Add script `"db:migrate": "tsx --env-file=.env.local db/migrate.ts"`.
4. Write `src/lib/db.ts`: exports `sql` from `@neondatabase/serverless` (`neon(process.env.DATABASE_URL!)`). Throw a clear error if DATABASE_URL is missing.
5. Write `src/types.ts`: `Lead`, `LeadInput`, `LeadEvent`, `ChatMessage`, `Tier`, `LeadStatus`, `LeadAnalysis` (shape from ARCHITECTURE.md section 5).
6. Write repo helpers:
   - `repo/leads.ts`: `createLead`, `getLead`, `listLeads(filters)`, `updateLeadAnalysis`, `updateStatus`, `setFollowUp`, `findByPhoneOrEmail`, `findRecentForFuzzy(limit)`
   - `repo/events.ts`: `addEvent`, `listEvents(leadId)`
   - `repo/chat.ts`: `addMessage`, `listMessages(leadId, limit)`
   - `repo/briefings.ts`: `getBriefing(dateIST, hash)`, `saveBriefing(...)`
7. `listLeads` implements the sort order from ARCHITECTURE.md section 6 in SQL.
8. Add a temporary `GET /api/health` that runs `select 1` and returns ok. Deploy and open it.

## Files touched
`db/schema.sql`, `db/migrate.ts`, `src/lib/db.ts`, `src/lib/repo/*.ts`, `src/types.ts`, `src/app/api/health/route.ts`, `package.json`

## Done when
- [ ] `npm run db:migrate` runs twice without error
- [ ] Tables visible in the Neon console
- [ ] `/api/health` returns ok on the live URL
- [ ] All queries use tagged template parameters (no string concatenation)

## Interview talking point
"I picked Neon over Supabase because Supabase free projects pause after a week idle and need a manual restore. Reviewers might open the link days later; Neon just wakes up on the next query."
