-- Round 1, batch 3: the hourly job (unpaid-order auto-cancel, cart reminders, review requests).
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

alter table public.orders add column if not exists delivered_at timestamptz;
alter table public.orders add column if not exists cancelled_at timestamptz;
alter table public.orders add column if not exists review_requested_at timestamptz;
-- Set once the order's reserved stock has been put back, so it can never happen twice.
alter table public.orders add column if not exists stock_released boolean not null default false;

alter table public.carts add column if not exists reminded_at timestamptz;

-- Customers can switch off cart reminders and review requests in their account.
alter table public.users add column if not exists reminders_opt_out boolean not null default false;

-- Orders already delivered get their review request a few days from now.
update public.orders set delivered_at = now() where lower(status) = 'delivered' and delivered_at is null;
