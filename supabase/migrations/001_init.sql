-- Avero Islamabad schema
create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists homes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  city text not null default 'Islamabad',
  area text not null,
  address_text text,
  latitude numeric,
  longitude numeric,
  created_at timestamptz not null default now()
);
create index if not exists homes_user_id_idx on homes(user_id);
create index if not exists homes_area_idx on homes(area);

create table if not exists home_assets (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references homes(id) on delete cascade,
  asset_type text not null,
  nickname text not null,
  brand text,
  model text,
  install_date date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references homes(id) on delete cascade,
  asset_id uuid references home_assets(id) on delete set null,
  status text not null,
  initial_description text not null,
  category_guess text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists incidents_home_id_idx on incidents(home_id);
create index if not exists incidents_status_idx on incidents(status);

create table if not exists incident_messages (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents(id) on delete cascade,
  role text not null,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists incident_messages_incident_id_idx on incident_messages(incident_id);

create table if not exists safety_assessments (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents(id) on delete cascade,
  level text not null,
  hazard_codes jsonb not null default '[]'::jsonb,
  stop_troubleshooting boolean not null default false,
  safe_actions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists triage_decisions (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents(id) on delete cascade,
  outcome text not null,
  likely_issue text not null,
  confidence text not null,
  observed_facts jsonb not null default '[]'::jsonb,
  concerns jsonb not null default '[]'::jsonb,
  recommended_next_step text not null,
  technician_trade text,
  created_at timestamptz not null default now()
);

create table if not exists diy_plans (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents(id) on delete cascade,
  title text not null,
  tools jsonb not null default '[]'::jsonb,
  safety_notes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists diy_steps (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references diy_plans(id) on delete cascade,
  step_order int not null,
  instruction text not null,
  success_check text not null,
  failure_action text not null
);

create table if not exists service_requests (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incidents(id) on delete cascade,
  category text not null,
  area text not null,
  title text not null,
  problem_summary text not null,
  symptoms jsonb not null default '[]'::jsonb,
  urgency text not null,
  hazard_notes jsonb not null default '[]'::jsonb,
  actions_tried jsonb not null default '[]'::jsonb,
  preferred_time text,
  status text not null,
  created_at timestamptz not null default now()
);
create index if not exists service_requests_status_idx on service_requests(status);

create table if not exists providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trade text not null,
  rating numeric not null default 0,
  completed_jobs int not null default 0,
  verified boolean not null default false,
  phone text,
  avatar_url text,
  verification_notes text,
  created_at timestamptz not null default now()
);
create index if not exists providers_trade_idx on providers(trade);

create table if not exists provider_coverage (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  area text not null
);
create index if not exists provider_coverage_area_idx on provider_coverage(area);

create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid not null references service_requests(id) on delete cascade,
  provider_id uuid not null references providers(id) on delete cascade,
  visit_fee numeric,
  estimated_total_min numeric,
  estimated_total_max numeric,
  earliest_arrival timestamptz,
  warranty_days int,
  parts_included text,
  notes text,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid not null references service_requests(id) on delete cascade,
  offer_id uuid not null references offers(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  provider_id uuid not null references providers(id) on delete cascade,
  status text not null,
  scheduled_for timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  amount numeric not null,
  currency text not null default 'PKR',
  state text not null,
  is_demo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists repair_records (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references homes(id) on delete cascade,
  asset_id uuid references home_assets(id) on delete set null,
  incident_id uuid not null references incidents(id) on delete cascade,
  booking_id uuid references bookings(id) on delete set null,
  title text not null,
  work_done text not null,
  parts_replaced jsonb not null default '[]'::jsonb,
  amount_paid numeric,
  provider_name text,
  completed_at timestamptz not null,
  warranty_days int,
  warranty_expires_at timestamptz,
  before_images jsonb not null default '[]'::jsonb,
  after_images jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
