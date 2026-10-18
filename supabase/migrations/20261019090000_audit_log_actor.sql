-- audit_logs.user_id was a bigint, but users are uuid; record who acted properly.
alter table public.audit_logs add column if not exists actor_id uuid;
alter table public.audit_logs add column if not exists actor_name text;
alter table public.audit_logs add column if not exists actor_email text;
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
