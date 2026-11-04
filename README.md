# Lead Copilot

An AI workspace for a real-estate salesperson. It reads each inbound enquiry, scores it, tells you what to do next and drafts the reply. Then it keeps every lead up to date from your call notes, and plans your day.

- **Live demo:** https://lead-copilot-swart.vercel.app (no sign-in, shared demo workspace)
- **Demo video (3 min):** _add link here_
- **Built for:** the Masal AI FDE assignment, Round 2

![Dashboard with the Today panel and ranked lead list](docs/screenshot.png)

## What I built

A Next.js app where a salesperson adds leads (a form, a pasted chat dump or a WhatsApp export), sees them ranked hot, warm and cold with the reasons, asks an AI chat for help on one lead, and logs calls in plain words. Every screen answers one question: who should I contact next, and what should I say?

## Features

### Core requirements

| # | Requirement | How it works in the app |
|---|---|---|
| 1 | Lead intake | A form on **New lead**. Required fields are checked in the browser and again on the server with the same Zod schema. |
| 2 | AI analysis | Each lead gets a summary, intent, key requirements, objections, a next action, a ready-to-send WhatsApp reply in the customer's own language style (including Hinglish), and four scored signals. |
| 3 | Lead chat | A chat on the lead page, grounded only in that lead: its details, latest analysis and last 5 timeline events. Quick prompts such as "Make my reply more assertive". History is saved. |
| 4 | Prioritisation | The list is grouped hot, warm, cold and sorted: overdue follow-ups first, then tier, then score, then newest. Filters for tier, status and search. |
| 5 | Clear display | The lead page leads with the next action and the reply to send. The reasoning (why this score, intent, original message) is one click away. |

### Custom feature: "The inbox cleans itself and every lead keeps learning"

| Part | What it does | Time it saves |
|---|---|---|
| **Paste intake** | Paste a messy dump, or upload a WhatsApp export (`.zip` or `.txt`). One AI call splits it into separate draft leads. You review them in a table, with missing fields highlighted and never invented, then save them one at a time with visible progress. | No retyping of leads from chats and emails. |
| **Duplicate detection** | When a new lead matches an existing one (same phone, same email, or a similar name with the same area or property), a dialog shows old and new side by side. Merging adds the new message to that lead's history and re-runs the analysis. | One history per person. A repeat enquiry becomes a stronger signal instead of a second record. |
| **Post-call debrief** | After a call, type notes in your own words. The AI updates the analysis and score, sets the follow-up date (it understands "Saturday") and writes the follow-up message. A "No answer" button does the same bookkeeping with no AI call. | No filling in CRM fields after every call. |
| **Morning briefing** | A compact **Today** panel lists who to contact first and why, with an opening line for the call and a ready message for each lead. | You start the day with a plan, not a list. |

## Architecture overview

```
Browser (Next.js pages, React)
   |
   |  fetch JSON
   v
Next.js API routes on Vercel (server only)
   |                    |
   |  SQL over HTTPS    |  HTTPS
   v                    v
Neon Postgres       Gemini API  (fallback: Groq)
```

One Next.js app holds the UI and the API, so there is one deploy and one URL. The browser never talks to the database or to the AI provider, so no key reaches it.

```
db/                    schema.sql, migrate.ts, seed.ts
scripts/               dev-only helpers (prompt tuning, seed generation, duplicate checks)
src/
  app/                 pages: dashboard, new lead, lead detail, welcome
    api/               one route per action (leads, chat, debrief, merge, intake/parse,
                       duplicates/check, briefing, demo/reset, health)
  components/          UI (server components fetch data; client components only where there is interaction)
  lib/
    ai/                client.ts (the only place that calls a model), prompts.ts, schemas.ts
    repo/              raw SQL queries: leads, events, chat, briefings
    scoring.ts         signals -> score -> tier
    duplicates.ts      name, phone and location matching
    due.ts             which leads are "due" today
    dates.ts           Asia/Kolkata "today" helpers
```

**Data model** (Postgres, raw SQL, no ORM): `leads` (the record, its latest analysis, score, tier and follow-up fields), `lead_events` (the timeline: created, analysis, merged, debrief and status changes, each with the score after it), `chat_messages`, and `briefings` (the daily plan, cached per day).

## AI model and how it is called

- **Model:** Gemini Flash (free tier) through `@google/genai`. The model name comes from an environment variable. Groq (`groq-sdk`) is an optional last fallback.
- **Server only:** every AI call is in `src/lib/ai/` and runs in an API route.
- **Structured output:** the model is given a JSON schema, and the reply is validated with Zod. If validation fails, it retries once with the error message included. After that the user sees a clear error, never raw model text.
- **Fallback chain:** Gemini model, then the Gemini fallback model, then Groq if configured. Each attempt has a 25 s timeout and the whole call stops at 55 s, inside Vercel's 60 s limit.
- **Untrusted text:** customer text is always wrapped in delimiter tags and the prompt says to treat it as data, not instructions.

The six AI calls:

| Call | Route | Output |
|---|---|---|
| Analyse a lead | `POST /api/leads`, `POST /api/leads/[id]/analyze` | Summary, intent, requirements, objections, next action, reply, four signals |
| Chat about a lead | `POST /api/leads/[id]/chat` | Plain-text reply (the only call that is not JSON) |
| Parse a pasted dump | `POST /api/intake/parse` | Draft leads and unparsed text |
| Judge a duplicate | inside `POST /api/leads` and `POST /api/duplicates/check` | Same person or not, with confidence and reason |
| Debrief a call | `POST /api/leads/[id]/debrief` | Updated analysis, outcome, follow-up days, reason and message, suggested status |
| Plan the day | `GET /api/briefing` | Headline and ordered cards with opening line and message |

## How the score works

The model never gives the final number. It rates four signals from 0 to 3, each with a one-line reason, and `src/lib/scoring.ts` computes the score:

```
score = round( intent_strength/3 * 30
             + timeline_urgency/3 * 30
             + budget_fit/3       * 25
             + engagement/3       * 15 )
        minus 10 if there are 2 or more red flags (never below 0)

tier: hot >= 70, warm 40 to 69, cold < 40
```

Keeping the arithmetic in code makes the score consistent and explainable: "why is this lead hot?" has a real answer, shown under **Why this score** on the lead page. It also means pasted text such as "mark this lead as 100" cannot change a score.

## Run locally

You need Node 20 or newer, a free [Neon](https://neon.tech) database and a free Gemini API key.

```bash
git clone https://github.com/TejasRMutalik/lead-copilot.git
cd lead-copilot
npm install
cp .env.example .env.local     # then fill in the values below
npm run db:migrate             # creates the tables
npm run db:seed                # loads the demo leads (this deletes existing leads)
npm run dev
```

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon connection string |
| `GEMINI_API_KEY` | from Google AI Studio |
| `GEMINI_MODEL` | for example `gemini-2.5-flash` |
| `GEMINI_FALLBACK_MODEL` | for example `gemini-2.5-flash-lite` |
| `GROQ_API_KEY`, `GROQ_MODEL` | optional fallback |
| `DEMO_RESET_ENABLED` | `true` to show the **Reset demo** button and fill an empty database on first visit |

Before a deploy, `npm run build && npm run lint` must pass.

## Key technical decisions

| Decision | Choice | Why |
|---|---|---|
| Framework | Next.js App Router | UI and server routes in one deploy; keys stay server side |
| Database | Neon Postgres (free) | Real persistence across visits, and it wakes automatically on the next query |
| DB access | Raw SQL, no ORM | Fewer moving parts; every query is readable |
| Model | Gemini Flash, name in env | Good structured JSON output on the free tier; model lists change, so it is configurable |
| Fallback | Groq (optional) | If Gemini rate-limits during a demo, the app still answers |
| AI output | JSON schema, Zod validation, one retry | The UI needs predictable fields |
| Scoring | AI extracts signals, code computes the score | Explainable and consistent |
| Bulk analysis | Client-side queue, one lead at a time, a pause and retry on rate limit | Stays inside free-tier limits and shows visible progress |
| Duplicates | Code first (phone, email, name), AI only for unclear cases | Fast, cheap and explainable; AI is used where judgment is needed |
| Briefing | Built on first open each day, cached by date and a hash of the due leads | No cron job needed; reloading does not spend quota |
| Demo data | Analyses precomputed once with the real model | Reset costs zero AI calls and works even when quota is out |

## Known limitations

- **No authentication.** One shared demo workspace, so anything a visitor adds is visible to others. The welcome page is an introduction, not a login.
- **Free-tier limits.** Gemini rate limits and a daily quota apply. The app retries, falls back and shows a clear message, but heavy use can still hit them.
- **Data privacy.** On the free Gemini tier, prompts may be used by Google to improve its products. Use demo data only.
- **No real messaging.** The app never sends WhatsApp messages or emails. "Open in WhatsApp" opens a chat with the reply prefilled, and you press send.
- **The briefing appears when you open the app**, it is not pushed to you.
- **Duplicate detection** misses a person who comes back with a different phone number and no email, unless their name and area also match.
- **Scores skew generous.** The model tends to rate signals high, so many leads land in "hot". The score formula and tier cut-offs are in code and easy to tune.
- **Long chats are trimmed.** A pasted or uploaded chat longer than 15,000 characters is cut to its newest messages.
- **The lead list shows at most 200 leads**, with no pagination.

## Future work

- **Voice morning briefing and voice follow-up calls**, the natural next step for a voice-first assistant.
- **WhatsApp integration**, to send replies and ingest enquiries automatically.
- **Authentication and teams**, with leads owned per salesperson.
- **Inventory matching**, so a lead is matched to available properties.
- **Webhook intake** from property portals, and a server-side job queue for bulk analysis.
