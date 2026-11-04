# Phase 0: Setup

## Goal
A blank Next.js app in a public GitHub repo, deployed to a live Vercel URL. Every later phase deploys on top of this.

## Build steps
1. Create the app (command in dependencies.md) with TypeScript, Tailwind, ESLint, App Router, `src/` dir.
2. Initialise shadcn/ui and add the base components listed in dependencies.md.
3. Copy `CLAUDE.md` and `ARCHITECTURE.md` into the repo root. Copy the `phases/` folder into `docs/phases/`.
4. Create `.env.example` with every variable from ARCHITECTURE.md section 9 (empty values). Make sure `.env*.local` is in `.gitignore`.
5. Replace the default home page with a simple header "Lead Copilot" and an empty state.
6. Add `src/lib/api.ts` with `ok(data)` and `fail(code, message, status)` helpers.
7. Add `src/lib/dates.ts` with `todayIST()`, `startOfDayIST()`, `addDaysIST()`, `formatRelativeIST()` using `Intl` with `timeZone: 'Asia/Kolkata'`.
8. Create a public GitHub repo, push, import into Vercel, deploy.

## Files touched
`package.json`, `src/app/page.tsx`, `src/app/layout.tsx`, `src/lib/api.ts`, `src/lib/dates.ts`, `.env.example`, `.gitignore`, `CLAUDE.md`, `ARCHITECTURE.md`

## Done when
- [ ] `npm run build` and `npm run lint` pass
- [ ] Repo is public on GitHub
- [ ] Vercel URL opens and shows "Lead Copilot"
- [ ] Opening the URL in an incognito window works (no Vercel login wall; check Deployment Protection is off for production)

## Interview talking point
"I deployed a blank app in the first 30 minutes, so the live URL was never a last-minute risk."
