# Phase 1: Edge cases

| Risk | What happens | Handling |
|---|---|---|
| Neon cold start | First query after 5 idle minutes takes a few hundred ms | Acceptable. Show skeleton loaders (Phase 10). Do not add keep-alive pings |
| DATABASE_URL missing on Vercel | Every route 500s | `db.ts` throws "DATABASE_URL not set"; `/api/health` makes it obvious |
| SQL injection via form text | Data corruption | Only tagged template queries (`sql\`... ${value}\``), never string building |
| Schema change later | Old tables lack new columns | Use `alter table ... add column if not exists` lines at the end of schema.sql; migrate stays re-runnable |
| jsonb comes back as string | UI crashes on `.summary` | Neon driver parses jsonb to objects; still validate `analysis` with Zod when reading, treat invalid as null |
| Deleting a lead | Orphan events and chat rows | `on delete cascade` on foreign keys |
| Very long message text | Slow pages, huge prompts | Cap at the API layer (Phase 3): message 6,000 chars, other fields 300 chars |
| Storage limit (0.5 GB) | Not a real risk at demo scale | Note in README limitations |
