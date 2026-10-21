<#
  Blue-Tech backup — a full copy of the shop's database and uploaded photos, saved on this PC.

  What it saves (one dated folder per run, e.g. "blue-tech-2026-10-21"):
    database.dump      the database (products, orders, customers, sign-ins, settings...),
                       in pg_dump's compressed format — restore with pg_restore (docs/BACKUPS.md)
    storage\<bucket>\  every uploaded file: product photos, banners, review and warranty photos
  It keeps the newest 8 backups and deletes older ones, then records the run so
  Admin → Settings shows "Last backup" (and the shop stops reminding you).

  One-time setup (see docs/BACKUPS.md):
    1. Supabase dashboard → your project → Connect → "Session pooler" → copy the URI and put your
       database password in it.
    2. Save that line in a file named .blue-tech-db-url in your user folder
       (C:\Users\<you>\.blue-tech-db-url). It stays on this PC and is never committed.

  Run:   powershell -ExecutionPolicy Bypass -File scripts\backup-db.ps1
  Options: -Destination "D:\Google Drive\Blue-Tech backups"  -Keep 8
#>
param(
  [string]$Destination = (Join-Path $env:USERPROFILE 'Documents\Blue-Tech backups'),
  [int]$Keep = 8
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$buckets = @('product-images', 'media', 'review-photos', 'service-photos')

function Record-Run([bool]$ok, [long]$bytes, [int]$files, [string]$note) {
  $safeNote = ($note -replace "'", "''")
  if ($safeNote.Length -gt 300) { $safeNote = $safeNote.Substring(0, 300) }
  $okSql = if ($ok) { 'true' } else { 'false' }
  & supabase db query --linked --workdir $repo "insert into backup_log (ok, db_bytes, files, note) values ($okSql, $bytes, $files, '$safeNote')" *> $null
}

# The connection string: environment variable first, then the private file in the user folder.
$dbUrl = $env:BLUE_TECH_DB_URL
$urlFile = Join-Path $env:USERPROFILE '.blue-tech-db-url'
if (-not $dbUrl -and (Test-Path $urlFile)) { $dbUrl = (Get-Content $urlFile -Raw).Trim() }
if (-not $dbUrl) {
  Write-Host 'No database connection string yet.' -ForegroundColor Yellow
  Write-Host "Put the Supabase 'Session pooler' URI (with your password) in: $urlFile"
  Write-Host 'Details: docs\BACKUPS.md'
  exit 1
}

# pg_dump: on PATH, or the newest PostgreSQL install under Program Files.
$pgDump = $null
$onPath = Get-Command pg_dump -ErrorAction SilentlyContinue
if ($onPath) { $pgDump = $onPath.Source }
if (-not $pgDump) {
  $found = Get-ChildItem 'C:\Program Files\PostgreSQL\*\bin\pg_dump.exe' -ErrorAction SilentlyContinue |
    Sort-Object { [int]($_.Directory.Parent.Name -replace '\D', '') } -Descending | Select-Object -First 1
  if ($found) { $pgDump = $found.FullName }
}
if (-not $pgDump) { Write-Host 'pg_dump not found. Install PostgreSQL (client tools) from postgresql.org.' -ForegroundColor Red; exit 1 }
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) { Write-Host 'The Supabase CLI is not installed.' -ForegroundColor Red; exit 1 }

$stamp = Get-Date -Format 'yyyy-MM-dd'
$dir = Join-Path $Destination "blue-tech-$stamp"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
Write-Host "Backing up to $dir"

try {
  # 1. Database: the shop's tables, sign-in accounts and file records.
  Write-Host '1/3 Database...'
  $dump = Join-Path $dir 'database.dump'
  & $pgDump "--dbname=$dbUrl" --format=custom --no-owner --no-privileges --schema=public --schema=auth --schema=storage "--file=$dump"
  if ($LASTEXITCODE -ne 0) { throw "pg_dump failed (exit code $LASTEXITCODE). Check the connection string and password." }
  $bytes = (Get-Item $dump).Length

  # 2. Uploaded files (the CLI is linked to the project from the repo folder).
  Write-Host '2/3 Photos and files...'
  Push-Location $dir
  try {
    foreach ($b in $buckets) {
      & supabase storage cp -r "ss:///$b" "storage/$b" --linked --experimental --workdir $repo *> $null
      if ($LASTEXITCODE -ne 0) { throw "Copying the '$b' files failed (exit code $LASTEXITCODE)." }
    }
  } finally { Pop-Location }
  $files = @(Get-ChildItem (Join-Path $dir 'storage') -Recurse -File -ErrorAction SilentlyContinue).Count

  # 3. Keep the newest $Keep backups.
  Write-Host '3/3 Tidying old backups...'
  Get-ChildItem $Destination -Directory -Filter 'blue-tech-*' | Sort-Object Name -Descending |
    Select-Object -Skip $Keep | Remove-Item -Recurse -Force

  Record-Run $true $bytes $files "pc backup to $Destination"
  Write-Host ("Done: database {0:N1} MB, {1} files." -f ($bytes / 1MB), $files) -ForegroundColor Green
} catch {
  Record-Run $false 0 0 $_.Exception.Message
  Write-Host "Backup failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
