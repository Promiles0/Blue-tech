-- Round 2 (3e honest signals): remember when a product sold out and when it came back, so the
-- product page can say "Back in stock" for a week after a restock.
alter table public.products add column if not exists out_of_stock_since timestamptz;
alter table public.products add column if not exists restocked_at timestamptz;

-- Start from today's state: products with no stock at all are out of stock from now.
update public.products p set out_of_stock_since = now()
where out_of_stock_since is null
  and not exists (select 1 from public.product_variants v where v.product_id = p.id and v.stock_quantity > 0);
