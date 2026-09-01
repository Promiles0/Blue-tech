-- The admin review moderation UI (AdminReviews.jsx) toggles review visibility,
-- but public.reviews had no column to persist that. Add it so admin/reviews
-- hide/show actually affects what storefront queries return.

alter table public.reviews add column if not exists hidden boolean not null default false;

notify pgrst, 'reload schema';
