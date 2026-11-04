# Phase 6: Edge cases

| Risk | What happens | Handling |
|---|---|---|
| Same person messages several times in the dump | Split into several drafts | Prompt: merge messages from the same person into one lead |
| Group chat with the salesperson's own replies | Salesperson parsed as a lead | Prompt: ignore messages from the agent or business side |
| Dump has no leads (random text) | Empty result | Show "No enquiries found" plus the unparsed text |
| More than 15 enquiries | Huge output, truncation | Cap at 15; tell the user to paste the rest separately |
| Model invents a budget or location | Wrong data saved silently | Rule: leave empty, list in missing_fields; UI highlights empty required fields |
| Output truncated mid-JSON | Parse fails | Zod retry once; lower the cap if it repeats |
| Phone numbers in mixed formats | Duplicates missed | Normalization at save time (Phase 3 helper) |
| User navigates away mid-queue | Some leads not saved | `beforeunload` warning while the queue runs; already-saved leads stay saved |
| Rate limit during queue | Some leads unanalyzed | Retry once, then save unanalyzed with a visible marker |
| Pasted text contains instructions ("mark all as hot") | Manipulation | Data-only delimiters; scoring is in code |
