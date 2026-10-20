-- Blue's AI provider chain: health per provider (shared by every edge instance and shown
-- on Admin → Blue AI), a one-hour answer cache for common one-off questions, and which
-- provider answered each logged turn.
create table if not exists public.ai_provider_status (
  provider text primary key,
  paused_until timestamptz,
  last_error text,
  last_error_at timestamptz,
  last_ok_at timestamptz,
  ok_count integer not null default 0,
  fail_count integer not null default 0
);

create table if not exists public.ai_answer_cache (
  key text primary key,
  response jsonb not null,
  provider text,
  created_at timestamptz not null default now()
);
create index if not exists ai_answer_cache_created_idx on public.ai_answer_cache (created_at);

alter table public.chat_logs add column if not exists provider text;

alter table public.ai_provider_status enable row level security;
alter table public.ai_answer_cache enable row level security;
