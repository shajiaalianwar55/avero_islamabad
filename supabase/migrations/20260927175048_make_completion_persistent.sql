-- Columns used by the application but missing from the original schema.
alter table public.bookings
  add column if not exists updated_at timestamptz not null default now();

alter table public.safety_assessments
  add column if not exists prohibited_actions jsonb not null default '[]'::jsonb;

alter table public.diy_plans
  add column if not exists estimated_minutes int;

alter table public.offers
  add column if not exists is_demo boolean not null default false;

-- A booking must produce at most one Home History entry, even when a
-- completion request is retried by the browser or platform.
create unique index if not exists repair_records_booking_id_unique
  on public.repair_records (booking_id)
  where booking_id is not null;
