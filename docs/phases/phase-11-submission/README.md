# Phase 11: Submission

## Goal
Submit all four items on the Google form, every link open to anyone.

## 1. Repo README (write it in the app repo, not here)
Sections, in this order, matching the brief:
1. What I built (3 lines + live URL + demo video link + one screenshot)
2. Features: core requirements 1 to 5, then the custom feature "The inbox cleans itself and every lead keeps learning" (paste intake, duplicate detection, post-call debrief, morning briefing) and why each saves time
3. Architecture overview: the diagram from ARCHITECTURE.md section 1, folder layout, data model summary
4. AI model and how it's called: Gemini model via `@google/genai`, server-side only, JSON schema output, Zod validation, retry, fallback chain; list of the 6 AI calls (analyze, chat, parse, duplicate judge, debrief, briefing)
5. How the score works (the formula and why it is in code)
6. Run locally: clone, `npm i`, copy `.env.example` to `.env.local`, fill keys, `npm run db:migrate`, `npm run db:seed`, `npm run dev`
7. Key technical decisions (the table from ARCHITECTURE.md section 2)
8. Known limitations: no auth (shared demo workspace), free-tier rate limits and daily quota, free-tier Gemini data may be used by Google (demo data only), no real WhatsApp or email sending, briefing appears on open not pushed, duplicate detection misses people with different phone and no email, no pagination past 200 leads
9. Future work: voice morning briefing and voice follow-up calls (fits Masal), WhatsApp integration, auth and teams, inventory matching

## 2. AI usage disclosure (template, edit to be true)
"Claude (chat) for understanding the brief, choosing the custom feature, and writing the architecture and phase plan. Claude Code for scaffolding and implementing each phase from that plan, which I reviewed and tested phase by phase. Gemini is the model inside the product. I can explain every file."

## 3. Demo video (max 3:00, Loom)
| Time | Show |
|---|---|
| 0:00 to 0:15 | Problem in one line, the dashboard with Today panel |
| 0:15 to 0:50 | Add a lead via form, analysis page, the 5-second scan, Why this score |
| 0:50 to 1:15 | Chat: "what should I emphasize?" and "make reply more assertive" |
| 1:15 to 1:50 | Paste a messy dump, drafts, a duplicate caught and merged |
| 1:50 to 2:25 | Post-call debrief: notes in, score change, follow-up date and message |
| 2:25 to 2:45 | Back to dashboard: Today panel and ranked list updated |
| 2:45 to 3:00 | One decision: score computed in code from AI signals (or the free-tier queue design) |

Record after a fresh reset. Do not burn quota right before recording. Have a backup take.

## 4. Final checklist
- [ ] Repo public, README complete, no secrets in history
- [ ] Live URL works in incognito
- [ ] Video link set to anyone with the link
- [ ] AI disclosure written
- [ ] All four submitted on the form before 3:00 PM

## Interview prep (30 min)
Be ready to open and explain: `ai/client.ts` (retry and fallback), `scoring.ts`, `duplicates.ts`, the analysis prompt, one API route end to end, and the Today panel caching. Have one answer ready for "what would you change for a real customer with 500 leads a day?" (auth, queue on the server, paid tier, webhook intake from portals, WhatsApp API).
