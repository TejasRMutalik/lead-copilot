# Phase 10: Polish, seed data, final deploy

## Goal
A reviewer opens the URL cold, with no setup, and immediately sees a realistic, working product.

## Build steps
1. `db/seed.ts` + `POST /api/demo/reset` (guarded by `DEMO_RESET_ENABLED`):
   - Deletes all rows, inserts 10 to 12 realistic Bengaluru leads (Whitefield, Sarjapur Road, HSR, Hebbal, Electronic City, Yelahanka, Kanakapura Road) with varied budgets, timelines and messages, including one Hinglish message and one vague "just looking".
   - Stores precomputed analyses in the seed (so reset costs zero AI calls and works even when quota is out). Generate them once with the real model and paste the JSON into the seed file.
   - Dates relative to now: 2 overdue follow-ups, 2 due today, 1 going cold, rest in the future or none.
   - Includes 1 lead with a merged event and 1 with two debriefs, so the timeline and score history are visible.
   - Script: `"db:seed": "tsx --env-file=.env.local db/seed.ts"`.
2. Auto-seed: if `/` loads and the leads table is empty, seed once.
3. "Reset demo data" button in the header with a confirm dialog.
4. Loading and error states everywhere: skeletons on list, lead page and Today panel; toasts (sonner) for success and errors; friendly text for each error code.
5. Header: app name, "New lead" button, Reset demo, a small "How it works" popover (3 lines) for reviewers.
6. Responsive check at 375 px width.
7. Accessibility basics: labels on inputs, buttons with text, color is never the only tier signal (badge text says Hot, Warm, Cold).
8. Remove `/api/health` or leave it harmless. Remove dev-only scripts from the build.
9. Final deploy. Test the full flow in incognito on the live URL: form lead, paste dump with a duplicate, chat, debrief, Today panel, reset.

## Done when
- [ ] Fresh incognito visit shows a full dashboard in under 3 s
- [ ] Every flow works on the live URL
- [ ] Reset works with AI quota exhausted (no AI calls)
- [ ] No console errors in the browser

## Interview talking point
"Seed analyses are precomputed so the demo never depends on quota at the moment someone opens the link, while every new action still makes a real AI call."
