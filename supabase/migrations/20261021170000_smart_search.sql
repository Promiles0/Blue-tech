-- Smart product search (2a): typo-tolerant, word order doesn't matter, accents ignored.
-- "probok hp", "hp 440", "lenovo tinkpad" all find the right products.
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- Ranks published products for a search phrase. Every meaningful word must match the
-- product (fuzzily); words that match nothing anywhere ("cheap", "please") are ignored.
-- A match in the name/brand/model counts more than one in the description or specs.
create or replace function public.search_products(q text, max_results integer default 200)
returns table (product_id bigint, score real)
language sql
stable
set search_path = public, extensions
as $$
  with words as (
    select distinct w
    from unnest(regexp_split_to_array(lower(unaccent(coalesce(q, ''))), '[^a-z0-9.+]+')) as w
    where length(w) >= 2
  ),
  docs as (
    select p.id,
      lower(unaccent(concat_ws(' ', p.name, p.brand, p.model_number))) as head,
      lower(unaccent(concat_ws(' ', p.name, p.brand, p.model_number, c.name, p.short_description, p.specs::text))) as body
    from products p
    left join categories c on c.id = p.category_id
    where p.is_active
  ),
  sims as (
    select d.id, w.w,
      greatest(word_similarity(w.w, d.head) * 1.5, word_similarity(w.w, d.body)) as s,
      greatest(word_similarity(w.w, d.head), word_similarity(w.w, d.body)) as m
    from docs d cross join words w
  ),
  useful as (
    select w from sims group by w having max(m) >= 0.5
  )
  select id as product_id, sum(s)::real as score
  from sims
  where w in (select w from useful)
  group by id
  having min(m) >= 0.5
  order by score desc, id
  limit greatest(1, least(max_results, 500));
$$;

grant execute on function public.search_products(text, integer) to service_role;
