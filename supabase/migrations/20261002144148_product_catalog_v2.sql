-- Product catalog v2: richer product data for the new catalogue (laptops, printers,
-- network gear, UPS…), and prices stored in RWF instead of USD.
--
-- Category-specific specs (RAM, print speed, PoE, backup time…) live in one `specs`
-- jsonb column rather than dozens of mostly-null columns; which keys a category uses is
-- defined by the spec templates in Frontend/src/lib/specTemplates.js. The older
-- Interactive Screens columns (screen_size, resolution, touch_points, os, connectivity)
-- stay, and the API mirrors the matching spec keys into them.

alter table public.products add column if not exists brand text;
alter table public.products add column if not exists model_number text;
alter table public.products add column if not exists condition text;
alter table public.products add column if not exists short_description text;
alter table public.products add column if not exists in_the_box text;
alter table public.products add column if not exists specs jsonb not null default '{}'::jsonb;
-- Internal only — never returned to the storefront.
alter table public.products add column if not exists admin_notes text;
-- Hidden products are invisible to shoppers but still editable by admins, so a product
-- can be imported, given photos, and only then published.
alter table public.products add column if not exists is_active boolean not null default true;
alter table public.products add column if not exists updated_at timestamptz not null default now();

create index if not exists products_is_active_idx on public.products (is_active);
create index if not exists products_brand_idx on public.products (brand);
create index if not exists products_specs_idx on public.products using gin (specs);

-- ── Prices are now RWF ───────────────────────────────────────────────────────
-- RWF amounts are ~1,500x the USD ones, so numeric(10,2) (max 99,999,999.99) is too
-- tight for a large multi-laptop order. Widen every money column.
alter table public.order_items alter column unit_price type numeric(14,2);
alter table public.orders alter column total_amount type numeric(14,2);
alter table public.orders alter column shipping_fee type numeric(14,2);
alter table public.payments alter column amount type numeric(14,2);
alter table public.payment_records alter column amount type numeric(14,2);
alter table public.price_histories alter column price type numeric(14,2);
alter table public.product_variants alter column price_adjustment type numeric(14,2);
alter table public.coupons alter column coupon_value type numeric(14,2);
alter table public.coupons alter column min_subtotal type numeric(14,2);
alter table public.products alter column price type numeric(14,2);

-- Existing coupons were written in USD: convert the money amounts (not percentages) at
-- the current admin exchange rate so they keep the same real value.
update public.coupons c
set
  coupon_value = case when c.kind = 'FIXED' then round(c.coupon_value * r.rate) else c.coupon_value end,
  min_subtotal = case when c.min_subtotal is null then null else round(c.min_subtotal * r.rate) end
from (
  select coalesce((select nullif(value, '')::numeric from public.site_settings where key = 'usd_to_rwf_rate'), 1471) as rate
) r;

notify pgrst, 'reload schema';
