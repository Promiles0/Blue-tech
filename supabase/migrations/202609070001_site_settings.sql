-- Backs the admin-editable display-currency exchange rate. Prices are stored and
-- charged in USD everywhere; this rate only drives what the storefront RENDERS when a
-- visitor picks RWF, and the mobile-money cashin conversion (which is a real charge).
--
-- Kept as a generic key/value table rather than a single-purpose `exchange_rate` column
-- so later settings (support hours, banner copy) don't each need a migration.
--
-- Anon read is deliberate and narrow: the storefront must format prices for logged-out
-- visitors, so the public rows have to be readable without a session. Writes still go
-- exclusively through the api edge function's service-role client, same as every other
-- table in this schema.

create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create policy "public can read public settings"
  on public.site_settings for select
  using (is_public = true);

insert into public.site_settings (key, value, is_public)
values ('usd_to_rwf_rate', '1471', true)
on conflict (key) do nothing;

notify pgrst, 'reload schema';
