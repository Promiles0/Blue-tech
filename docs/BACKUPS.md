# Backups

The free Supabase plan keeps **no backups** of the shop. `scripts/backup-db.ps1` makes a full
copy on this PC: the database (products, orders, customers, sign-ins, settings) and every
uploaded file (product photos, banners, review and warranty photos). Each run is recorded, so
**Admin → Settings → Backups** shows the last one, and the shop reminds the admins if there's
been none for 8 days.

## One-time setup

1. Supabase dashboard → the Blue-Tech project → **Connect** → **Session pooler** → copy the URI.
   Replace `[YOUR-PASSWORD]` with the database password (Project Settings → Database → reset it
   there if you don't have it).
2. Save that single line in a file called `.blue-tech-db-url` in your user folder:
   `C:\Users\<you>\.blue-tech-db-url`. It stays on this PC — never put it in the repository.
3. You need PostgreSQL's `pg_dump` (installed here: PostgreSQL 18) and the Supabase CLI (installed,
   and linked to the project).

## Run it

```powershell
powershell -ExecutionPolicy Bypass -File scripts\backup-db.ps1
```

Backups go to `Documents\Blue-Tech backups\blue-tech-YYYY-MM-DD\` and the newest 8 are kept.
To keep a copy off this PC too, point it at a synced folder:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\backup-db.ps1 -Destination "C:\Users\<you>\Google Drive\Blue-Tech backups"
```

## Run it every week automatically (optional)

Windows Task Scheduler → Create Basic Task → Weekly (e.g. Sunday 20:00) → Start a program:

- Program: `powershell`
- Arguments: `-ExecutionPolicy Bypass -File "C:\Users\arois\Blue-tech\scripts\backup-db.ps1"`

The PC must be on and online at that time. (Supabase Pro, about $25/month, adds automatic daily
backups in the cloud if you'd rather not depend on a PC.)

## Restore (for a developer)

Into a fresh Supabase project:

```bash
pg_restore --no-owner --no-privileges --clean --if-exists -d "<new project's connection URI>" database.dump
supabase storage cp -r storage/product-images ss:///product-images --linked --experimental
```

(repeat the second line for each folder under `storage/`). Then redeploy the API with
`supabase functions deploy api --no-verify-jwt`, set the secrets again, and point the website's
`VITE_SUPABASE_*` settings at the new project.
