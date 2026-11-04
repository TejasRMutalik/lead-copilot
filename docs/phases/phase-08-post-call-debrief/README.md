# Phase 8: Post-call debrief (custom feature, part 3)

## Goal
After a call, the salesperson types or pastes rough notes ("spoke 10 min, wife wants 3BHK not 2, budget can stretch to 1.1Cr, wants site visit Sat, worried about possession date"). The AI turns that into an updated lead: new score, objections, next action, follow-up date and a ready follow-up message.

## Build steps
1. `buildDebriefPrompt(lead, notes, recentEvents)`: give current analysis plus the raw notes inside `<call_notes>` tags. Ask for DebriefResult. Rules: notes override older info when they conflict; keep objections that were not resolved; follow-up timing must match what the customer said (if they said Saturday, compute days until Saturday from today's IST date, which you pass in the prompt); follow-up message in the customer's language style.
2. `POST /api/leads/[id]/debrief`: validate `{ notes }` (10 to 4,000 chars).
   - Call AI, compute score from `updated_analysis.signals`.
   - Update lead: analysis, score, tier, status (`suggested_status`, unless user already set won or lost), `last_contacted_at = now`, `next_follow_up_at = startOfDayIST + follow_up_in_days` at 10:00 IST, `follow_up_reason`.
   - Add `debrief` event with notes, outcome, old score, new score, follow-up.
   - Return lead + result.
3. `components/debrief-form.tsx` on the lead page (right column, above chat):
   - Textarea "How did the call go?" with placeholder example notes
   - Quick outcome chips that prefill text: "No answer", "Busy, call back", "Site visit booked"
   - After submit: a result card showing score change ("62 -> 78, now Hot"), new objections, follow-up date and reason, the follow-up message with Copy
4. `components/timeline.tsx`: shows all events with icons; debrief entries show score change. Optional small score line chart if time allows (cut list item).
5. "No answer" outcome: do not re-run full analysis; set follow-up to tomorrow, add event, lower engagement slightly only after 3 consecutive no answers.

## Done when
- [ ] Notes with a new budget and a site visit date update the lead, score and follow-up date correctly
- [ ] "Saturday" in notes produces the right date in IST
- [ ] No-answer flow works without an AI call
- [ ] Timeline shows the before and after score

## Interview talking point
"Most CRMs make the salesperson fill 10 fields after a call, so they don't. Here they type how the call went in their own words, and the AI does the data entry, including when to follow up."
