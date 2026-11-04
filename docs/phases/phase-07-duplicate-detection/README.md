# Phase 7: Duplicate detection (custom feature, part 2)

## Goal
When a new lead comes in (form or paste), catch it if this person already exists, and merge the new message into their history instead of creating a second record.

## Matching logic (`src/lib/duplicates.ts`)
Run in this order, stop at the first strong match:
1. Exact `phone_norm` match -> strong match (confidence 1.0)
2. Exact email match -> strong match (confidence 1.0)
3. Fuzzy candidates: from the last 300 leads, name similarity >= 0.8 (normalized: lowercase, no titles like Mr or Mrs, token-sorted, Levenshtein or Jaro-Winkler written in plain TS) AND (same location token OR overlapping property requirement) -> possible match
4. Possible matches only (max 3): one AI call with DuplicateJudgement for each pair -> keep if `is_same_person` and confidence >= 0.7

Code-only steps cover most cases. AI handles "Rahul K, Whitefield, 2BHK" vs "Rahul Kumar, ITPL area, 2 bhk flat".

## Build steps
1. Write normalize helpers (phone, email, name) and `similarity(a, b)` with unit-style checks in a small script.
2. `findDuplicates(input)` returns `[{ lead, matchType: 'phone'|'email'|'ai', confidence, reason }]`.
3. `POST /api/duplicates/check`: returns candidates for an input.
4. In `POST /api/leads`, before insert: run `findDuplicates` unless `skipDuplicateCheck` is true. If any found, return `{ ok: true, data: { duplicateCandidates } }` without saving.
5. `POST /api/leads/[id]/merge`: body is the incoming LeadInput.
   - Append incoming message to a `merged` event (keep the full text).
   - Fill only empty fields on the existing lead (phone, email); for budget, timeline, requirement: if different, take the newer value and store the old one in the event payload.
   - Re-run analysis with the existing message plus the new message, labelled with dates, so the model sees the progression.
   - Return the updated lead.
6. `components/duplicate-dialog.tsx`: side-by-side old vs new, match reason ("Same phone number" or AI reason), buttons: "Merge into existing" (default), "Save as new lead", "Cancel".
7. Wire the dialog into both the form flow and the paste queue.
8. Lead page timeline shows merged events with "Came back via paste on 4 Nov: <message>".

## Done when
- [ ] Same phone in a different format is caught
- [ ] Name variant with no phone is caught via AI when location matches
- [ ] Two different people with the same common name in different areas are NOT merged
- [ ] Merge re-analyzes and the score can change (repeat enquiry usually raises engagement)

## Interview talking point
"A lead who enquires twice is a stronger lead, not noise. Merging keeps one history and the re-analysis usually pushes the score up, which is exactly the signal a salesperson needs."
