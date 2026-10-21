-- Payment rescue (1b): when a customer retries a payment on the same order, the earlier
-- attempt's reference is kept here, so a late approval of that earlier MoMo prompt or card
-- payment still marks the order paid instead of being lost.
alter table public.payment_records add column if not exists previous_references text[] not null default '{}';
create index if not exists payment_records_previous_refs_idx on public.payment_records using gin (previous_references);
