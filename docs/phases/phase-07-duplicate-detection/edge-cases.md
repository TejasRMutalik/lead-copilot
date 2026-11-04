# Phase 7: Edge cases

| Risk | What happens | Handling |
|---|---|---|
| Family members share one phone | Two real buyers merged | Dialog always asks; user can choose "Save as new" |
| Common names (Rahul, Priya) | False positives | Fuzzy needs name AND location or requirement overlap; AI confirms; user confirms |
| Same person, different phone and no email | Missed duplicate | Accept; fuzzy + AI catches some; note as limitation |
| `+91 98450 12345` vs `09845012345` | Missed match | Normalize to last 10 digits |
| Email case or spaces | Missed match | Lowercase and trim |
| Duplicate inside the same paste batch | Second one not caught (first not saved yet) | Queue is sequential, so the first is saved before the second is checked |
| AI duplicate call rate-limited | Queue stalls | Skip the AI step on error, fall back to code-only result |
| Merging into a lost or won lead | Closed lead reopens silently | Set status back to `new` and note "re-enquired after closing" in the event |
| Conflicting budgets old vs new | Which is true? | Newer wins on the lead, old kept in the event; analysis sees both |
| Merge chains (A into B, then B gets another) | History scattered | Always merge into the surviving lead id; events stay on that lead |
