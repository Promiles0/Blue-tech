-- public.orders and public.users were created by the original 202608250001
-- migration with a much narrower shape. complete_schema.sql's
-- `create table if not exists` no-op'd on both since they already existed,
-- so the richer checkout/payments columns it describes were never actually
-- added. This migration brings the live tables in line with what the app
-- (and complete_schema.sql) expect, without touching existing data.

alter table public.orders
  add column if not exists address_id bigint references public.addresses(id) on delete restrict,
  add column if not exists total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  add column if not exists shipping_method text,
  add column if not exists payment_method text,
  add column if not exists shipping_fee numeric(12,2) default 0,
  add column if not exists order_address_street text,
  add column if not exists order_address_city text,
  add column if not exists order_address_country text,
  add column if not exists order_address_phone_number text,
  add column if not exists order_address_landmarks text,
  add column if not exists order_address_recipient text,
  add column if not exists ordered_at timestamptz;

-- Orders are now itemized via order_items (variant-based), so a single
-- product_id/quantity per order no longer applies. Relax them to match
-- complete_schema.sql, which never marks these not null.
alter table public.orders alter column product_id drop not null;
alter table public.orders alter column quantity drop not null;

alter table public.users add column if not exists phone text;

notify pgrst, 'reload schema';
