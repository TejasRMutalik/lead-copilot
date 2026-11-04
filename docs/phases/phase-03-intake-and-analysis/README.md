# Phase 3: Lead intake and AI analysis

Covers core requirements 1 (intake form), 2 (AI analysis) and 5 (clear display).

## Goal
Fill a form, save the lead, run analysis, land on a lead page where the salesperson can read the result in seconds.

## Build steps
1. `src/lib/validation.ts`: Zod `LeadInputSchema`
   - required: name, location, property_req, budget_text, timeline_text, message
   - optional: phone, email (add to the form; needed for duplicate detection in Phase 7)
   - optional: `source` ('form' default, 'paste' from Phase 6), `skipDuplicateCheck` (boolean, used in Phase 7)
   - trim all strings; length caps (message 6,000, others 300)
2. `POST /api/leads`: validate, normalize phone and email (helpers in `src/lib/duplicates.ts`, create the normalize functions now), insert lead, add `created` event, run `analyzeLead`, save analysis + score + tier, add `analysis` event with score. Return the lead.
   - If analysis fails, still keep the lead with `analysis = null` and return `{ ok: true, data: lead, warning: 'AI_...' }`. The lead page shows a "Run analysis" button.
   - Phase 7 adds the duplicate check in front of the insert; leave a clear `// Phase 7: duplicate check` comment.
3. `POST /api/leads/[id]/analyze`: re-run analysis for an existing lead.
4. `GET /api/leads/[id]`: lead + events + chat messages.
5. `components/lead-form.tsx`: shadcn form, inline field errors, submit button with loading text "Analyzing lead...". On success, route to `/leads/[id]`.
   - Add a "Fill sample" button that fills a realistic Bengaluru lead (saves time in the demo).
6. `app/leads/new/page.tsx`: Tabs "Form" and "Paste" (Paste is a placeholder until Phase 6).
7. `components/analysis-panel.tsx` (the scan-in-seconds view). Layout top to bottom:
   - Header row: name, tier badge (hot red, warm amber, cold slate), score, status
   - One-line summary in larger text
   - Next action in a highlighted box with a verb first
   - Two columns: Key requirements (chips) | Objections (list, amber)
   - Intent with note
   - "Why this score": 4 signal bars (0 to 3) with the reason on hover or below
   - Suggested response in a box with a Copy button and a "Open in WhatsApp" link (`https://wa.me/<phone>?text=...`) when phone exists
   - Red flags, only if any
8. `app/leads/[id]/page.tsx`: analysis panel on the left (wide), placeholder right column for chat and debrief (Phases 5 and 8), timeline at the bottom.

## Done when
- [ ] Submitting the form saves a lead and shows the analysis page
- [ ] Copy button copies the suggested response
- [ ] Killing the AI (bad key) still saves the lead and shows "Run analysis"
- [ ] Missing required field shows inline error without calling the API

## Interview talking point
"I designed the page for a 5-second scan: tier, one-line summary, and next action are all above the fold. Details are below for when the salesperson has time."
