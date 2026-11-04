# Phase 9: Morning briefing (custom feature, part 4)

## Goal
When the salesperson opens the app each day, a Today panel at the top tells them who to contact first, why, and gives an opening line and a ready message for each.

## Which leads are "due"
Computed in code (`repo/leads.ts: listDueLeads(todayIST)`):
1. Overdue: `next_follow_up_at` before today (IST)
2. Due today: `next_follow_up_at` within today (IST)
3. Going cold: tier hot or warm, status not won or lost, no contact (`last_contacted_at`, else `created_at`) for 3+ days (hot) or 7+ days (warm), and no future follow-up set
4. New hot leads never contacted
Cap at 10.

## Build steps
1. `GET /api/briefing`:
   - Get due leads. If none, return `{ items: [], headline: "No follow-ups due. Work new leads." }` with no AI call.
   - `leads_hash` = hash of due lead ids + their `updated_at`. Look up `briefings` for (todayIST, hash). If found, return it.
   - Else one AI call with MorningBriefing schema. Input per lead: name, tier, score, follow-up reason, last debrief summary, objections, days overdue. Rules: order by what will most likely close or be lost if ignored; why_now in one line; opening_line is what to say in the first 10 seconds of the call; draft_message for WhatsApp in the customer's style.
   - Save and return. Validate every `lead_id` in the output exists in the input; drop unknown ids; append any missing due leads at the end with a code-generated why_now.
2. `components/today-panel.tsx` at the top of the home page:
   - Greeting with IST date ("Good morning. Wednesday, 4 Nov")
   - Headline
   - Ordered cards: number, name, tier, chip (Overdue 2d, Due today, Going cold), why_now, opening line, buttons: Copy message, WhatsApp, Open lead, Mark done (opens debrief)
   - Collapsible; remembers collapsed state in localStorage (wrapped in try/catch)
3. Loading: panel shows skeleton while the list below renders immediately (fetch briefing on the client so it never blocks the list).
4. "Refresh plan" button forces regeneration (bypasses cache once, with a cooldown of 60 s).

## Done when
- [ ] With seeded data, the panel shows overdue, due and going-cold leads in a sensible order
- [ ] Refreshing the page does not make a new AI call (check server log)
- [ ] Doing a debrief on a due lead and reloading updates the panel (hash changed)
- [ ] With zero due leads, no AI call is made

## Interview talking point
"No cron or push service needed: the plan is built on first open each day and cached against the exact set of due leads. A real version would send this as a 9 AM WhatsApp or, fitting Masal, a short voice briefing."
