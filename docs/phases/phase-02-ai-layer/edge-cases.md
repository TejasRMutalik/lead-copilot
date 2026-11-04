# Phase 2: Edge cases

| Risk | What happens | Handling |
|---|---|---|
| Rate limit (429) | Analysis fails mid-demo | Wait, then fallback model, then Groq; UI shows "AI is busy, retrying" not a stack trace |
| Daily quota exhausted | Everything AI fails until reset (about 1:30 PM IST) | Fallback chain; README limitation; avoid heavy testing right before recording the demo |
| Model returns invalid JSON or missing fields | UI breaks | Zod validation + one retry with the error; then `AI_BAD_OUTPUT` |
| Model wraps JSON in ``` fences | Parse error | Strip fences before `JSON.parse` |
| Signal values out of range (e.g. 5) | Score above 100 | Zod `min(0).max(3)`; clamp in scoring as a second guard |
| Prompt injection in customer message | Score or reply manipulated | Delimiters + explicit instruction; score computed in code; test case in Done when |
| Hallucinated facts (prices, projects) | Salesperson sends wrong info | Prompt forbids inventing specifics; suggested response asks questions instead |
| Empty or tiny message ("hi") | Garbage analysis | Still analyze; engagement low; next action = "qualify by call" |
| Non-English message | Wrong or English-only reply | Detect `language`; reply in the customer's style |
| Request hangs | Vercel function times out | 25 s AbortController per attempt; set `export const maxDuration = 60` on AI routes |
| Free-tier data use | Google may use free-tier prompts to improve models | README limitation: use demo data only; paid tier for real customer data |
| Model deprecated later | Live URL breaks weeks later | Model name in env var; change without code edit |
