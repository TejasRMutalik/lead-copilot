# Phase 5: Edge cases

| Risk | What happens | Handling |
|---|---|---|
| Lead not analyzed yet | Thin context | Still answer from raw fields; add a hint "Run analysis for better answers" |
| Long chat history | Prompt grows, slower and costlier | Only last 10 messages sent |
| Off-topic or jailbreak questions | Generic chatbot behaviour | System rule: one-line redirect back to the lead |
| Model invents a project name or price | Salesperson repeats false info | Rule: only use given context; say what to ask the customer instead |
| Enter key sends half-typed message | Annoying UX | Enter sends, Shift+Enter new line; disable send while waiting |
| AI error mid-chat | User message lost | Save user message first; on error show inline "Couldn't answer, retry" with a retry button |
| Model replies in markdown | Asterisks in UI | Prompt says plain text; strip `**` and `#` defensively |
| Two tabs chatting on same lead | Interleaved history | Acceptable for demo; ordered by created_at |
