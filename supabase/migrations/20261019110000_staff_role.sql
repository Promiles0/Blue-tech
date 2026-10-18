-- Staff: day-to-day operations (orders, shipping, products without deleting or price
-- changes, quotes, proformas, reviews, messages). Settings, users, coupons, programs,
-- banners, categories, insights, Blue and the audit log stay admin-only.
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check check (role in ('admin', 'staff', 'user'));
