-- Apply this when public.categories already existed before parent categories
-- were added to the application schema.
alter table public.categories add column if not exists parent_id bigint;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'categories_parent_id_fkey'
      and conrelid = 'public.categories'::regclass
  ) then
    alter table public.categories
      add constraint categories_parent_id_fkey
      foreign key (parent_id) references public.categories(id) on delete set null;
  end if;
end
$$;