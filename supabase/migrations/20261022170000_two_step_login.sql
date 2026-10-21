-- Round 3 (8e): two-step login with an authenticator app (TOTP) for admin and staff.
-- The secret and backup-code hashes are server-only (RLS on, no client access).
alter table public.users add column if not exists mfa_enabled boolean not null default false;
alter table public.users add column if not exists mfa_secret text;
alter table public.users add column if not exists mfa_pending_secret text;
alter table public.users add column if not exists mfa_recovery text[] not null default '{}';  -- SHA-256 hashes
alter table public.users add column if not exists mfa_last_step bigint;                       -- blocks reusing a code
