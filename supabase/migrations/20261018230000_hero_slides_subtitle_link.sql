-- Home carousel slides become editable from Admin → Home banners: `label` is the headline,
-- plus a subtitle and the page the slide opens.
alter table public.hero_slides add column if not exists subtitle text;
alter table public.hero_slides add column if not exists link text;
