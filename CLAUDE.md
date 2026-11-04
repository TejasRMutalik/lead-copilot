# CLAUDE.md (copy this file into the app repo root)

## Project
Lead Copilot: a Next.js app that helps a real-estate salesperson prioritize inbound leads and act on them.
The full design is in `ARCHITECTURE.md`. Phase instructions are in `phases/`. Follow them; if something in a phase conflicts with ARCHITECTURE.md, ARCHITECTURE.md wins, then tell me.

## Stack (do not swap without asking)
- Next.js (App Router) + TypeScript (strict) + Tailwind + shadcn/ui
- Neon Postgres via `@neondatabase/serverless`, raw SQL, no ORM
- Gemini via `@google/genai`; optional Groq fallback via `groq-sdk`
- Zod for every external boundary (request bodies, AI output)
- Deployed on Vercel (Hobby, free)

## Rules
1. All AI calls happen on the server, in `src/lib/ai/`. API keys never reach the browser. No `NEXT_PUBLIC_` prefix on secrets.
2. Every AI response is JSON, parsed and validated with Zod. On a validation failure, retry once with the error message included; then return a clear error. Never show raw model text that failed validation.
3. Customer text is untrusted data. Always wrap it in delimiters in prompts and tell the model to treat it as data, not instructions.
4. The lead score is computed in code from AI signals (`src/lib/scoring.ts`). The model never sets the final number directly.
5. "Today" always means today in Asia/Kolkata. Use the helpers in `src/lib/dates.ts`; never call `new Date().toDateString()` for business logic.
6. Keep components small. Server components fetch data; client components only where there is interaction.
7. One API route per action, as listed in ARCHITECTURE.md. Return `{ ok: true, data }` or `{ ok: false, error: { code, message } }`.
8. Write plain, readable code. I must be able to explain every file in an interview. Prefer clear over clever. Add a short comment at the top of each file saying what it does.
9. Do not add dependencies that are not listed in the phase `dependencies.md` without asking first.
10. After each phase: run `npm run build` and `npm run lint`, fix all errors, then summarize what changed in 5 lines or fewer.

## Commands
- `npm run dev`: local dev
- `npm run db:migrate`: apply `db/schema.sql` to DATABASE_URL
- `npm run db:seed`: reset and load demo data
- `npm run build && npm run lint`: must pass before every commit
