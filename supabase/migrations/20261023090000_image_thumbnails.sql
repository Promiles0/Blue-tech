-- Round 4 (4b): a small WebP copy (600px) of each product photo for cards, lists, cart and chat.
-- Made by the admin form on upload, and by scripts/make-thumbnails.py for existing photos.
alter table public.product_images add column if not exists thumb_url text;
