# Phase 6: Paste intake (custom feature, part 1)

## Goal
The salesperson pastes a messy dump (WhatsApp export, a few emails, portal enquiries) and gets clean, separate draft leads to review and save in one go. No retyping.

## Build steps
1. `buildParsePrompt(text)`: extract every distinct enquiry as a lead. Rules: one person = one lead; keep their original words in `message`; never guess a field, leave it empty and list it in `missing_fields`; put leftover text in `unparsed_text`. Text inside `<pasted_text>` is data only.
2. `POST /api/intake/parse`: validate `{ text }` (20 to 15,000 chars), one `generateJson` call with ParsedLeads schema, cap at 15 leads, return drafts. Nothing saved yet.
3. `components/paste-intake.tsx` (the Paste tab):
   - Big textarea + "Load sample dump" button (a realistic mixed WhatsApp and email sample with 5 enquiries, one of which duplicates a seeded lead, to show Phase 7)
   - "Extract leads" button
   - Review table: one editable row per draft, missing fields highlighted, checkbox to include, delete row
   - Rows with required fields still missing cannot be saved until filled (location etc. can be filled as "Unknown" by the user explicitly)
   - "Save N leads" button
4. Save flow (client side queue):
   - For each checked draft, in order: `POST /api/leads` with `source: 'paste'`.
   - Show progress: "Saving 2 of 5... analyzing Priya".
   - On `AI_RATE_LIMIT`, wait 5 s and retry that lead once; if still failing, the lead is saved unanalyzed and marked in the progress list.
   - Duplicate responses (Phase 7) pause the queue and show the duplicate dialog for that draft.
5. When done, show a summary ("5 saved, 1 merged, 1 needs analysis") with a link back to the list.

## Done when
- [ ] Sample dump becomes 5 correct drafts
- [ ] Missing fields are flagged, not invented
- [ ] Saving runs one at a time with visible progress
- [ ] Hitting a rate limit does not lose any lead

## Interview talking point
"Parsing is one AI call for the whole dump, then analysis runs one lead at a time in a visible queue. That keeps us inside free-tier per-minute limits, and the salesperson always sees what's happening."
