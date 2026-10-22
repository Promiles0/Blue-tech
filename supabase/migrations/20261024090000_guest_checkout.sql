-- UX audit A2: check out as a guest. A guest gets a light account behind the scenes (so the
-- existing order and payment flow works unchanged) with a placeholder sign-in address that
-- nobody can log in with. The email they typed, if any, is kept separately for order messages.
-- Setting a password afterwards (POST /auth/guest/claim) turns it into a normal account.
alter table public.users add column if not exists is_guest boolean not null default false;
alter table public.users add column if not exists contact_email text;
