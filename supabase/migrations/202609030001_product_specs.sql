-- Adds an optional spec sheet to products, for categories where it's meaningful
-- (currently: Interactive Screens). Nullable everywhere else — harmless no-op for
-- every other category's rows.

alter table public.products add column if not exists screen_size text;
alter table public.products add column if not exists resolution text;
alter table public.products add column if not exists touch_points integer check (touch_points is null or touch_points >= 0);
alter table public.products add column if not exists os text;
alter table public.products add column if not exists connectivity text;
alter table public.products add column if not exists warranty text;

notify pgrst, 'reload schema';
