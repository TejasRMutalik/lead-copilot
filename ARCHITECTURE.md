# Architecture

## 1. System overview

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

- One Next.js app holds both the UI and the API. One deploy, one URL, no CORS.
- The browser never talks to Gemini or the database directly.
- No login. One shared demo workspace, so reviewers can test with zero setup. "Login" in the morning briefing means "first open of the app today".

## 2. Key decisions (each one is an interview answer)

| Decision | Choice | Why |
|---|---|---|
| Framework | Next.js App Router | UI and server routes in one deploy; keys stay server side |
| Database | Neon Postgres (free) | Real persistence across reviewer visits. Neon wakes automatically on the next query; Supabase free pauses after 7 idle days and needs a manual restore, which would break the live URL |
| DB access | Raw SQL, no ORM | Fewer moving parts, every query is readable in an interview |
| Model | Gemini Flash (free tier), model name in env | Good structured JSON output, free. Model is configurable because free-tier model lists change |
| Fallback | Groq (optional) | If Gemini rate-limits during a live demo, the app still answers |
| AI output | JSON schema + Zod validation + one retry | The UI needs predictable fields; a demo cannot show broken text |
| Scoring | AI extracts signals, code computes the score | Explainable and consistent. "Why is this lead hot?" has a real answer |
| Bulk analysis | Client-side queue, one lead at a time, backoff on 429 | Stays inside free-tier rate limits and shows visible progress |
| Duplicates | Code first (phone, email, name), AI only for unclear cases | Fast, cheap, explainable; AI used where judgment is needed |
| Briefing | Computed on first open each day, cached in DB | No cron needed; refreshing does not burn quota |

## 3. App folder layout

```
lead-copilot/
  CLAUDE.md
  db/
    schema.sql
    seed.ts
    migrate.ts
  src/
    app/
      page.tsx                      Dashboard: Today briefing + ranked lead list
      leads/new/page.tsx            New lead: Form tab + Paste tab
      leads/[id]/page.tsx           Lead detail: analysis, chat, debrief, timeline
      api/
        leads/route.ts              GET list, POST create
        leads/[id]/route.ts         GET one, PATCH status
        leads/[id]/analyze/route.ts POST run or re-run analysis
        leads/[id]/chat/route.ts    POST chat message
        leads/[id]/debrief/route.ts POST call notes
        leads/[id]/merge/route.ts   POST merge incoming lead data into this lead
        intake/parse/route.ts       POST messy text -> draft leads (not saved)
        duplicates/check/route.ts   POST draft lead -> possible matches
        briefing/route.ts           GET today's briefing
        demo/reset/route.ts         POST reset and reseed demo data
    components/
      lead-form.tsx
      paste-intake.tsx
      lead-list.tsx
      lead-card.tsx
      analysis-panel.tsx
      lead-chat.tsx
      debrief-form.tsx
      timeline.tsx
      today-panel.tsx
      duplicate-dialog.tsx
      tier-badge.tsx
    lib/
      db.ts                         Neon client + query helpers
      repo/leads.ts                 Lead queries
      repo/events.ts                Timeline queries
      repo/chat.ts                  Chat message queries
      repo/briefings.ts             Briefing cache queries
      ai/client.ts                  generateJson(): Gemini call, retry, fallback
      ai/schemas.ts                 Zod + JSON schemas for every AI output
      ai/prompts.ts                 All prompt builders in one file
      scoring.ts                    Signals -> score -> tier
      duplicates.ts                 Normalize + match logic
      dates.ts                      IST "today" helpers
      validation.ts                 Zod schemas for request bodies
      api.ts                        ok() and fail() response helpers
    types.ts
```

## 4. Data model (Postgres)

```sql
leads
  id                 uuid pk default gen_random_uuid()
  name               text not null
  phone              text null          -- as typed
  phone_norm         text null          -- digits only, last 10 for Indian numbers
  email              text null          -- lowercased
  location           text not null
  property_req       text not null
  budget_text        text not null      -- as typed, e.g. "80L - 1Cr"
  timeline_text      text not null      -- as typed, e.g. "within 3 months"
  message            text not null      -- customer message or chat transcript
  source             text not null      -- 'form' | 'paste' | 'seed'
  status             text not null default 'new'  -- new | contacted | negotiating | won | lost
  analysis           jsonb null         -- latest LeadAnalysis (denormalized for fast list)
  score              int null           -- 0..100, from scoring.ts
  tier               text null          -- 'hot' | 'warm' | 'cold'
  next_follow_up_at  timestamptz null
  follow_up_reason   text null
  last_contacted_at  timestamptz null
  created_at         timestamptz not null default now()
  updated_at         timestamptz not null default now()

lead_events                           -- the timeline and score history
  id          uuid pk
  lead_id     uuid fk -> leads on delete cascade
  type        text   -- 'created' | 'analysis' | 'merged' | 'debrief' | 'status_change'
  payload     jsonb  -- analysis snapshot, merged message, debrief notes, etc.
  score       int null   -- score after this event, for history
  created_at  timestamptz default now()

chat_messages
  id          uuid pk
  lead_id     uuid fk -> leads on delete cascade
  role        text   -- 'user' | 'assistant'
  content     text
  created_at  timestamptz default now()

briefings
  id          uuid pk
  date_ist    date not null
  leads_hash  text not null      -- hash of due lead ids + updated_at, so changes refresh it
  content     jsonb not null
  created_at  timestamptz default now()
  unique (date_ist, leads_hash)

indexes: leads(tier, score desc), leads(next_follow_up_at), leads(phone_norm), leads(email), lead_events(lead_id, created_at)
```

## 5. AI outputs (shapes every prompt must return)

### LeadAnalysis (Phase 2, used in 3, 7, 8)
```
summary            string, max 2 sentences
intent             'buy_to_live' | 'investment' | 'rent' | 'just_browsing' | 'unclear'
intent_note        string, 1 sentence
key_requirements   string[] (max 6, short phrases)
objections         string[] (max 5; empty if none)
next_action        string, 1 sentence, starts with a verb
suggested_response string, ready to send on WhatsApp, under 90 words
signals:
  intent_strength  0..3   + reason
  budget_fit       0..3   + reason   (clear and realistic for the ask = high)
  timeline_urgency 0..3   + reason
  engagement       0..3   + reason   (detail given, questions asked, reachable)
red_flags          string[] (e.g. "budget far below area rates")
language           string (detected language of customer, e.g. "English", "Hinglish")
```

### ParsedLeads (Phase 6)
```
leads: [{ name, phone?, email?, location, property_req, budget_text, timeline_text, message, missing_fields: string[] }]
unparsed_text: string   (anything the model could not attach to a lead)
```

### DuplicateJudgement (Phase 7)
```
is_same_person  boolean
confidence      0..1
reason          string
```

### DebriefResult (Phase 8)
```
call_outcome       'interested' | 'needs_time' | 'site_visit_booked' | 'not_interested' | 'no_answer'
updated_analysis   LeadAnalysis
new_objections     string[]
follow_up_in_days  integer 0..30
follow_up_reason   string
follow_up_message  string (draft to send at follow-up time)
suggested_status   'contacted' | 'negotiating' | 'won' | 'lost'
```

### MorningBriefing (Phase 9)
```
headline   string, 1 sentence ("3 hot follow-ups due, start with Priya")
items: [{ lead_id, order, why_now, opening_line, draft_message }]
```

## 6. Scoring (src/lib/scoring.ts)

```
score = round( (intent_strength/3)*30 + (timeline_urgency/3)*30 + (budget_fit/3)*25 + (engagement/3)*15 )
minus 10 if red_flags.length >= 2 (floor 0)
tier: hot >= 70, warm 40..69, cold < 40
```
List sort order: overdue follow-ups first, then tier (hot, warm, cold), then score desc, then newest.

## 7. API contract

All routes return `{ ok: true, data }` or `{ ok: false, error: { code, message } }`.
Error codes: `VALIDATION`, `NOT_FOUND`, `AI_RATE_LIMIT`, `AI_BAD_OUTPUT`, `AI_UNAVAILABLE`, `DB_ERROR`.

| Method | Route | Body | Returns |
|---|---|---|---|
| GET | /api/leads | query: tier?, status?, q? | Lead[] sorted |
| POST | /api/leads | LeadInput + skipDuplicateCheck? | Lead, or `{ duplicateCandidates }` |
| GET | /api/leads/[id] | | Lead + events + chat |
| PATCH | /api/leads/[id] | { status } | Lead |
| POST | /api/leads/[id]/analyze | | Lead with fresh analysis |
| POST | /api/leads/[id]/chat | { message } | { reply } |
| POST | /api/leads/[id]/debrief | { notes } | Lead + DebriefResult |
| POST | /api/leads/[id]/merge | LeadInput | Lead (re-analyzed) |
| POST | /api/intake/parse | { text } | ParsedLeads |
| POST | /api/duplicates/check | LeadInput | candidates[] |
| GET | /api/briefing | | MorningBriefing + due leads |
| POST | /api/demo/reset | | { seeded: n } |

## 8. Main user flows

1. Form: fill form -> duplicate check -> (merge or save new) -> analysis -> lead page.
2. Paste: paste dump -> parse (1 AI call) -> review drafts table -> save -> each draft runs duplicate check -> analysis queue runs one by one with progress.
3. Work a lead: open lead -> scan analysis cards -> ask chat -> call customer -> paste notes in debrief -> score, follow-up date and timeline update.
4. Next morning: open app -> Today panel lists due and overdue leads -> AI briefing orders them with opening lines and drafts.

## 9. Environment variables

```
DATABASE_URL=            Neon pooled connection string
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash          (check AI Studio for current free models)
GEMINI_FALLBACK_MODEL=gemini-2.5-flash-lite
GROQ_API_KEY=            optional
GROQ_MODEL=              optional, e.g. a current Llama model on Groq
DEMO_RESET_ENABLED=true
```
