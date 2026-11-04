# Phase 8: Edge cases

| Risk | What happens | Handling |
|---|---|---|
| Relative dates in notes ("Saturday", "next week", "after Diwali") | Wrong follow-up date | Pass today's IST date and weekday into the prompt; model returns days; code computes the date. Vague festivals: model picks a reasonable day and states it in the reason |
| Follow-up in the past or > 30 days | Nonsense date | Clamp 0 to 30 days in Zod and code |
| Notes contradict the original form | Stale data | Notes win; old values stay in the event history |
| Customer said "not interested" | Lead keeps getting follow-ups | Outcome not_interested -> status lost suggested, follow-up null unless the notes say "try again in 3 months" |
| User already marked won or lost | AI overrides it | Never auto-change won or lost |
| Very short notes ("ok") | Weak update | Accept; model keeps prior analysis mostly; prompt asks it to not change scores without evidence |
| Notes in Hinglish or with typos | Misread | Model handles it; test with one Hinglish sample |
| AI fails on debrief | Notes lost | Save notes as an event first, then call AI; on error show retry using the saved notes |
| Repeated no answers | Lead stays hot forever | After 3 consecutive no-answer events, engagement signal drops by 1 |
