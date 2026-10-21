-- 👍/👎 on Blue's answers. turn_id is a random id handed to the widget with each reply, so
-- a customer can rate that answer (matched together with their chat session id).
alter table public.chat_logs add column if not exists turn_id uuid;
alter table public.chat_logs add column if not exists feedback smallint check (feedback in (-1, 1));
alter table public.chat_logs add column if not exists feedback_at timestamptz;
create unique index if not exists chat_logs_turn_id_idx on public.chat_logs (turn_id);
