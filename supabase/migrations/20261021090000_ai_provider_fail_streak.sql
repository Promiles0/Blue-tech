-- Failures in a row per AI provider, so repeated blips pause it for longer each time.
alter table public.ai_provider_status add column if not exists fail_streak integer not null default 0;
