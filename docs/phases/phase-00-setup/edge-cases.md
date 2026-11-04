# Phase 0: Edge cases

| Risk | What happens | Handling |
|---|---|---|
| Vercel Deployment Protection on | Reviewers hit a Vercel login page | Settings > Deployment Protection: make sure production is public. Test in incognito |
| `.env.local` committed | API keys leak in a public repo | Confirm `.env*.local` in `.gitignore` before the first commit. If leaked, rotate the key immediately |
| Node version mismatch on Vercel | Build fails on deploy only | Set `"engines": { "node": ">=20" }` in package.json |
| shadcn init picks wrong paths | Components land outside `src/` | Accept `src/components` and `@/` alias during init |
| Timezone drift | Server runs in UTC, "today" is wrong after 6:30 PM IST | All date logic goes through `src/lib/dates.ts` from day one |
| Repo name clash | `gh repo create` fails | Pick another name; update nothing else |
