-- Reviews: "verified buyer" flag (set by the API when the reviewer bought the product) and
-- up to three customer photos stored in a public review-photos bucket.
alter table public.reviews add column if not exists verified_buyer boolean not null default false;
alter table public.reviews add column if not exists photos text[] not null default '{}';

-- Public read (photos appear on product pages); uploads go through the API's service role.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-photos', 'review-photos', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Mark existing reviews from people who did buy the product.
update public.reviews r
set verified_buyer = true
where exists (
  select 1
  from public.orders o
  join public.order_items oi on oi.order_id = o.id
  join public.product_variants v on v.id = oi.variant_id
  where o.user_id = r.user_id
    and v.product_id = r.product_id
    and lower(o.status) in ('paid', 'processing', 'shipped', 'delivered')
);
