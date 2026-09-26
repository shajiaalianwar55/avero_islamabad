# Avero — Islamabad AI home incident first responder

**When something breaks, know what to do next.**

Avero triages household problems for Islamabad residents: adaptive questions, a hard safety gate, DIY guidance, structured technician requests, transparent offers, protected payment demo states, and Home History with warranties.

## Stack

- Next.js (App Router) + TypeScript strict
- Tailwind CSS + shared UI components
- Supabase PostgreSQL / Auth / Storage (optional for local demo store)
- Zod-validated AI modules behind `lib/ai/provider.ts`
- Vitest + Playwright

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Fill in Supabase + `AI_*` keys when ready. With `NEXT_PUBLIC_DEMO_MODE=true`, the in-memory demo store works without Supabase.

### Supabase

1. Create a project
2. Run `supabase/migrations/001_init.sql`
3. Run `supabase/seed.sql`
4. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm test
npm run test:e2e
```

## Demo resident

Open `/app` or use the floating **Demo** control (scenarios + reset). Judges do not need email signup.

## Honest limitations

- Not a substitute for emergency services
- AI diagnosis can be uncertain; risky cases escalate
- Demo providers are seeded/fictional
- Payment protection is a prototype workflow, not licensed escrow
- Focused on Islamabad

See `docs/` and `AVERO_ISLAMABAD_IMAGINATHON_BUILD_SPEC.md`.
