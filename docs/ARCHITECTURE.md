# Architecture

Avero is a Next.js App Router application with:

- **Resident UI** — incident intake, triage chat, DIY, offers, booking, Home History
- **Provider UI** — structured requests, live offers, job status / change orders
- **API routes** — `ApiResponse<T>` JSON contracts
- **AI modules** — separate Zod-validated steps (intake, questions, safety, triage, DIY)
- **Safety gate** — deterministic rules ∪ AI classifier; emergency blocks DIY
- **Demo store** — in-memory seed so judges can run without Supabase; migrations/seed.sql for real Postgres

## Data flow

```
Report → Safety → Questions → Decision → DIY | Service request → Offers → Booking → History
```

## Deployment

Vercel + Supabase. Core demo does not require Twilio, WhatsApp approval, real payments, or Maps billing.
