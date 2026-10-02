-- One-off cleanup before going live with the new catalogue (owner confirmed every
-- existing order was a test). Run it once in Supabase → SQL Editor → Run.
--
-- Removes: all orders/payments/shipments, carts, wishlists, reviews, and the OLD sample
-- products + categories. Keeps: the 65 imported products (SKUs starting with "BT-"),
-- their 8 categories, users, coupons, settings and hero slides.
-- Safe to run twice; it only ever deletes what is listed above.

begin;

delete from public.payment_records;
delete from public.payments;
delete from public.shipments;
delete from public.order_items;
delete from public.orders;
delete from public.cart_items;
delete from public.cart;
delete from public.wishlist_items;
delete from public.wishlist;
delete from public.reviews;
delete from public.price_histories;

-- Old sample products: every product without a "BT-" SKU.
delete from public.products p
where not exists (
  select 1 from public.product_variants v where v.product_id = p.id and v.sku_code like 'BT-%'
);

-- Old categories no product uses any more (HP Laptops, Dell Laptops, UPS, ...).
delete from public.categories c
where c.name not in ('Laptops', 'Desktops', 'Monitors', 'Printers & Photocopiers',
                     'Network Devices', 'Tablets', 'Accessories', 'UPS & Projectors')
  and not exists (select 1 from public.products p where p.category_id = c.id);

update public.coupons set uses = 0;

commit;

-- Should show 65 products, 8 categories, 0 orders:
select (select count(*) from public.products) as products,
       (select count(*) from public.categories) as categories,
       (select count(*) from public.orders) as orders;
