-- Seed Islamabad demo data for Avero
-- Fixed UUIDs for deterministic demos

insert into profiles (id, full_name, phone) values
  ('11111111-1111-1111-1111-111111111111', 'Demo Resident', '0300-0000000')
on conflict (id) do nothing;

insert into homes (id, user_id, name, city, area, address_text) values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'F-10 Family Home', 'Islamabad', 'F-10', 'House near Margalla Road')
on conflict (id) do nothing;

insert into home_assets (id, home_id, asset_type, nickname, brand, model, install_date, notes) values
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222222', 'ac', 'Bedroom AC', 'Haier', 'HSU-18HFN', '2023-05-01', 'Wall mount'),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222222', 'geyser', 'Bathroom geyser', 'Canon', '16L', '2022-11-10', null),
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222222', 'plumbing', 'Kitchen sink', null, null, null, 'P-trap area')
on conflict (id) do nothing;

-- Providers: 4 plumbers, 4 electricians, 4 AC, 2 pump/geyser, 2 appliance
insert into providers (id, name, trade, rating, completed_jobs, verified, phone, verification_notes) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', 'Capital Plumbing Services', 'plumbing', 4.8, 214, true, null, 'CNIC verified (demo)'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02', 'Sector Fix Plumbers', 'plumbing', 4.5, 132, true, null, 'Trade license on file'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03', 'BluePipe Islamabad', 'plumbing', 4.3, 89, false, null, null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04', 'QuickDrain F-series', 'plumbing', 4.6, 167, true, null, 'CNIC verified (demo)'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05', 'SafeSpark Electric', 'electrical', 4.7, 198, true, null, 'Electrician certification'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa06', 'VoltCare G-sectors', 'electrical', 4.4, 121, true, null, null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa07', 'WireRight DHA', 'electrical', 4.2, 76, false, null, null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa08', 'PowerLine Pros', 'electrical', 4.9, 240, true, null, 'Insurance on file'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa09', 'CoolBreeze AC', 'ac', 4.6, 305, true, null, 'Gas handling certified'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10', 'Islamabad CoolTech', 'ac', 4.5, 188, true, null, null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11', 'FrostLine Services', 'ac', 4.1, 94, false, null, null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12', 'AirCare Express', 'ac', 4.8, 221, true, null, 'CNIC verified (demo)'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13', 'PumpMaster ISB', 'water_pump', 4.5, 112, true, null, 'Motor rewind specialist'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa14', 'Geyser & Pump Co', 'geyser', 4.4, 98, true, null, null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa15', 'ApplianceAid Capital', 'appliance', 4.3, 143, true, null, null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa16', 'HomeFix Appliances', 'appliance', 4.6, 160, true, null, 'Parts inventory verified')
on conflict (id) do nothing;

insert into provider_coverage (provider_id, area)
select p.id, a.area
from providers p
cross join (values
  ('F-10'), ('F-11'), ('F-8'), ('G-11'), ('G-10'), ('I-8'), ('E-11'), ('DHA'), ('Bahria Town'), ('PWD'), ('Bani Gala')
) as a(area)
where p.trade in ('plumbing', 'electrical', 'ac')
on conflict do nothing;

insert into provider_coverage (provider_id, area)
select p.id, a.area
from providers p
cross join (values ('F-10'), ('G-11'), ('I-8'), ('DHA'), ('PWD')) as a(area)
where p.trade in ('water_pump', 'geyser', 'appliance')
on conflict do nothing;

-- Prior AC repair with active warranty (~30 days from a recent date)
insert into incidents (id, home_id, asset_id, status, initial_description, category_guess, created_at, resolved_at) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333301', 'RESOLVED', 'Bedroom AC stopped cooling', 'ac', now() - interval '18 days', now() - interval '18 days')
on conflict (id) do nothing;

insert into repair_records (
  id, home_id, asset_id, incident_id, title, work_done, parts_replaced, amount_paid, provider_name,
  completed_at, warranty_days, warranty_expires_at, notes
) values (
  'cccccccc-cccc-cccc-cccc-cccccccccc01',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333301',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01',
  'Bedroom AC cooling repair',
  'Gas top-up and filter clean',
  '["R410A top-up"]'::jsonb,
  4500,
  'CoolBreeze AC',
  now() - interval '18 days',
  30,
  (now() - interval '18 days') + interval '30 days',
  'Demo seeded repair with active warranty'
)
on conflict (id) do nothing;
