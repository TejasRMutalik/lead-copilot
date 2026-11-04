# Phase 1: Dependencies

```bash
npm i @neondatabase/serverless
npm i -D tsx
```

## Env vars
| Name | Where | Value |
|---|---|---|
| DATABASE_URL | `.env.local` and Vercel (Production + Preview) | Neon pooled connection string (host contains `-pooler`) |

## Accounts
Neon free plan. One project is enough.
