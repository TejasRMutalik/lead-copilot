# Phase 2: Dependencies

```bash
npm i @google/genai zod
npm i groq-sdk        # optional fallback; skip if short on time
```

## Env vars
| Name | Value |
|---|---|
| GEMINI_API_KEY | From Google AI Studio > Get API key |
| GEMINI_MODEL | A current free Flash model, e.g. `gemini-2.5-flash`. Check the model list and your limits in AI Studio |
| GEMINI_FALLBACK_MODEL | A lighter free model with higher limits, e.g. `gemini-2.5-flash-lite` |
| GROQ_API_KEY | Optional |
| GROQ_MODEL | Optional, a current Llama model listed in the Groq console |

Add all of them to Vercel env vars too.

## Note on free-tier limits
Google no longer publishes fixed free-tier numbers; your live limits are shown per project in AI Studio. Limits are per project, not per key, so a second key in the same project adds nothing. Daily quotas reset at midnight Pacific time (about 1:30 PM IST). Design for low requests per minute.
