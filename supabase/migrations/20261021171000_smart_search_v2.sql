-- Smart search, refined: short words ("hp", "ups", "8gb") must match the start of a word
-- instead of fuzzily; the category name counts strongly (so "laptop" ranks laptops above a
-- laptop stand); long phrases need most — not all — of their words to match.
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
      lower(unaccent(coalesce(c.name, ''))) as cat,
      lower(unaccent(concat_ws(' ', p.name, p.brand, p.model_number, c.name, p.short_description, p.specs::text))) as body
    from products p
    left join categories c on c.id = p.category_id
    where p.is_active
  ),
  sims as (
    select d.id, w.w,
      case when length(w.w) <= 3 then
        case when d.head ~ ('\m' || w.w) then 1.5 when d.cat ~ ('\m' || w.w) then 1.4 when d.body ~ ('\m' || w.w) then 1.0 else 0 end
      else
        greatest(word_similarity(w.w, d.head) * 1.5, word_similarity(w.w, d.cat) * 1.6, word_similarity(w.w, d.body))
      end as s,
      case when length(w.w) <= 3 then
        case when d.body ~ ('\m' || w.w) then 1.0 else 0 end
      else
        greatest(word_similarity(w.w, d.head), word_similarity(w.w, d.cat), word_similarity(w.w, d.body))
      end as m
    from docs d cross join words w
  ),
  useful as (
    select w from sims group by w having max(m) >= 0.5
  ),
  needed as (
    -- 1–3 words: all must match; 4+: three quarters of them.
    select case when count(*) <= 3 then count(*) else ceil(count(*) * 0.75) end as n from useful
  ),
  ranked as (
    select id, count(*) filter (where m >= 0.5) as hits, sum(s) filter (where m >= 0.5) as score
    from sims where w in (select w from useful)
    group by id
  )
  select id as product_id, score::real
  from ranked, needed
  where hits >= needed.n and needed.n > 0
  order by hits desc, score desc, id
  limit greatest(1, least(max_results, 500));
$$;
