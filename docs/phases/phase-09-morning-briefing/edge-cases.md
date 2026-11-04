# Phase 9: Edge cases

| Risk | What happens | Handling |
|---|---|---|
| Server in UTC | "Today" flips at 5:30 AM IST, wrong due list late at night | All comparisons via `dates.ts` IST helpers |
| Reviewer opens the app days after seeding | All follow-ups overdue or stale | Seed dates relative to now (Phase 10); "Reset demo data" reseeds; auto-seed if DB empty |
| Model returns lead ids that don't exist | Broken cards | Validate ids against input; drop unknown |
| Model skips a due lead | Salesperson misses a follow-up | Append missing due leads in code |
| Every refresh calls AI | Quota burned | Cache by (date, hash) |
| Data changes during the day | Stale plan | Hash includes `updated_at`, so changes trigger a new plan |
| Refresh button spam | Quota burned | 60 s cooldown |
| AI fails | Empty panel | Show the code-computed due list without AI text, plus "AI plan unavailable, retry" |
| Opened in the evening | "Good morning" is odd | Greeting by IST hour |
| 30 due leads | Overwhelming | Cap at 10, show "+20 more due" linking to a filtered list |
