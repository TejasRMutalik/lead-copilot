# Phase 0: Dependencies

## Install on your machine
- Node.js 20 LTS or newer (`node -v`)
- Git
- GitHub CLI (optional, makes repo creation one command): `gh auth login`
- Vercel CLI (optional): `npm i -g vercel`

## Accounts (all free)
- GitHub
- Vercel (sign in with GitHub, Hobby plan)
- Google AI Studio (for the Gemini key, used in Phase 2): https://aistudio.google.com
- Neon (used in Phase 1): https://neon.tech
- Groq (optional, Phase 2 fallback): https://console.groq.com

## Commands
```bash
npx create-next-app@latest lead-copilot --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
cd lead-copilot
npx shadcn@latest init
npx shadcn@latest add button input textarea label card badge tabs dialog separator skeleton sonner scroll-area select
git init && git add . && git commit -m "Phase 0: scaffold"
gh repo create lead-copilot --public --source=. --push
```
Then import the repo in Vercel and deploy.

## Env vars introduced
None used yet. Create `.env.example` with all keys from ARCHITECTURE.md so later phases only fill values.
