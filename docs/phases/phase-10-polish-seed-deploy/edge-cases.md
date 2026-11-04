# Phase 10: Edge cases

| Risk | What happens | Handling |
|---|---|---|
| Two reviewers use the app at once | One resets while the other works | Acceptable for a demo; mention shared workspace in README limitations |
| Someone spams reset or AI routes | Quota drained | Reset uses no AI; per-route simple cooldowns in the UI; note that real auth and rate limiting are future work |
| Abusive text submitted by a stranger | Shows up for the next reviewer | Reset clears it; auto-seed on empty |
| Seeded dates go stale | Today panel empty or all overdue | Relative dates at seed time; reset button; auto-seed |
| Precomputed seed analyses drift from schema | Lead page crashes | Validate seed JSON with the same Zod schema in the seed script |
| Build passes locally, fails on Vercel | Live URL down | Run `npm run build` locally before every push; check the Vercel build log |
| Neon cold start on first visit | Slow first paint | Skeletons; it wakes in under a second |
| Mobile layout breaks | Reviewer on phone sees a mess | Test at 375 px; stack columns on small screens |
