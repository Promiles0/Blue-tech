# Supabase migration

This repository now targets one Supabase project only. Set `project_id` in `supabase/config.toml`, then link it:

```sh
supabase login
supabase link --project-ref <new-project-id>
supabase db push
supabase functions deploy api --no-verify-jwt
```

Set these frontend values from that same project in `Frontend/.env.local`:

```dotenv
VITE_SUPABASE_URL=https://<new-project-id>.supabase.co
VITE_SUPABASE_KEY=<new-project-anon-key>
VITE_SUPABASE_FUNCTIONS_URL=https://<new-project-id>.supabase.co/functions/v1/api
```

The function currently migrates Supabase Auth registration/login, public product listing/detail/search, the authenticated profile, and the authenticated user's orders. Other Spring routes intentionally return `501` until their table schema and side effects are mapped; payments and image uploads must remain server-side and should not receive the service-role key in the browser.

To create the default administrator, first create `systemadmin@ecom.rw` in Supabase Dashboard > Authentication > Users with a password. Copy that user's UUID, then run the commented admin seed at the bottom of `migrations/202608250001_core_schema.sql`, replacing `<auth-user-uuid>`. This is required because Supabase Auth passwords are stored in `auth.users`, not in `public.users.password_hash`.