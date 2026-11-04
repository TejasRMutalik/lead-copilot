# Phase 4: Edge cases

| Risk | What happens | Handling |
|---|---|---|
| Lead with null analysis | Card crashes on `analysis.next_action` | Separate "Not analyzed" group with a Run analysis action |
| Equal scores | Order jumps between refreshes | Tie-break by `created_at desc`, then `id` |
| Overdue calculation in UTC | Lead shows "due today" a day early or late | Compare using `dates.ts` IST helpers |
| Many leads (hundreds) | Slow page | Limit 200 in query; note pagination as a known limitation |
| Search with special chars (`%`, `'`) | Broken SQL or wrong results | Parameterized `ilike` with escaped `%` and `_` |
| Stale list after creating a lead | New lead missing | `revalidatePath('/')` in mutation routes, or `router.refresh()` after actions |
| Closed leads clutter the list | Harder to scan | Collapsed "Closed" section |
