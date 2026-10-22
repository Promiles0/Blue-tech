"""
Blue-Tech: make the small WebP copies (600px) of product photos that don't have one yet.

New photos get their copy from the admin product form automatically; run this for photos added
another way (bulk imports, older products). Needs Python with Pillow and the linked Supabase CLI.

    python scripts/make-thumbnails.py
"""
import io
import json
import os
import shutil
import subprocess
import sys
import tempfile
import urllib.request

from PIL import Image

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_URL = 'https://cfwqgpomvbqayqeghrft.supabase.co'
MAX_SIDE = 600
QUALITY = 76


def supabase(*args):
    # The npm-installed CLI (newer); an older standalone `supabase` may also be on PATH.
    npx = shutil.which('npx')
    if not npx:
        sys.exit('Node.js (npx) and the Supabase CLI are needed.')
    out = subprocess.run([npx, '--no-install', 'supabase', *args, '--workdir', REPO], capture_output=True, text=True, encoding='utf-8', cwd=REPO)
    return out.stdout + out.stderr


def query(sql):
    out = supabase('db', 'query', '--linked', sql)
    start = out.find('{')
    if start < 0:
        sys.exit(f'Query failed:\n{out[-400:]}')
    # The CLI may print notices after the JSON (e.g. "a new version is available").
    return json.JSONDecoder().raw_decode(out[start:])[0].get('rows', [])


def main():
    rows = query("select id, image_url from product_images where thumb_url is null and image_url is not null order by id")
    if not rows:
        print('Every photo already has a small copy.')
        return
    print(f'{len(rows)} photo(s) need a small copy.')
    # Inside the repo, so the upload can use a relative path (the CLI reads "C:" as a storage scheme).
    work = tempfile.mkdtemp(prefix='.bt-thumbs-', dir=REPO)
    folder = os.path.join(work, 'thumbs')
    os.makedirs(folder)
    made = []
    for r in rows:
        try:
            req = urllib.request.Request(r['image_url'], headers={'User-Agent': 'Blue-Tech thumbnails'})
            with urllib.request.urlopen(req, timeout=30) as resp:
                img = Image.open(io.BytesIO(resp.read()))
            img.load()
            img = img.convert('RGBA') if img.mode in ('RGBA', 'LA', 'P') else img.convert('RGB')
            img.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
            name = f"{r['id']}-{os.path.splitext(os.path.basename(r['image_url'].split('?')[0]))[0][:60]}.webp"
            img.save(os.path.join(folder, name), 'WEBP', quality=QUALITY, method=6)
            made.append((r['id'], name))
        except Exception as e:  # one bad photo shouldn't stop the rest
            print(f"  skipped #{r['id']}: {e}")
    if not made:
        sys.exit('Nothing was made.')
    before = sum(os.path.getsize(os.path.join(folder, n)) for _, n in made)
    print(f'Uploading {len(made)} small copies ({before / 1024 / len(made):.0f} KB each on average)…')
    out = supabase('storage', 'cp', '-r', '-j', '8', os.path.relpath(folder, REPO).replace(os.sep, '/'), 'ss:///product-images/thumbs', '--linked', '--experimental')
    if 'error' in out.lower() and 'Uploading' not in out:
        sys.exit(f'Upload failed:\n{out[-400:]}')
    # In batches: Windows limits how long one command line can be.
    for k in range(0, len(made), 25):
        values = ','.join(f"({i}, '{PROJECT_URL}/storage/v1/object/public/product-images/thumbs/{n}')" for i, n in made[k:k + 25])
        query(f"update product_images p set thumb_url = v.url from (values {values}) as v(id, url) where p.id = v.id")
    shutil.rmtree(work, ignore_errors=True)
    print(f'Done: {len(made)} photo(s) now have a small copy.')


if __name__ == '__main__':
    main()
