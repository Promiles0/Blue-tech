"""Find, download and normalise product images listed in products-image-checklist.csv.

Usage:
  python fetch_images.py                       # all products (resumable)
  python fetch_images.py --skus A,B            # only these SKUs
  python fetch_images.py --force --skus A      # re-fetch even if images exist
  python fetch_images.py --report              # build manifest, needs-review, zip, summary

Libraries: requests, Pillow (perceptual hash is a hand-rolled dHash).
"""
import argparse, csv, io, json, re, sys, time, zipfile
from pathlib import Path
from urllib.parse import urlparse

import requests
from PIL import Image

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
CSV_PATH = REPO / "Frontend" / "public" / "products-image-checklist.csv"
ENV_PATH = REPO / "Frontend" / ".env"
IMG_DIR, META_DIR = HERE / "images", HERE / "meta"
LOG_PATH = HERE / "download-log.txt"

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/129.0 Safari/537.36")
TRUSTED = ["hp.com", "epson.com", "epson.eu", "canon", "tp-link.com", "samsung.com", "logitech.com",
           "logi.com", "apc.com", "se.com", "lenovo.com", "dlink.com", "d-link.com", "seagate.com",
           "wd.com", "westerndigital.com", "kaspersky.com", "aico"]
BLOCKED = ["shutterstock", "alamy", "istockphoto", "gettyimages", "dreamstime", "123rf",
           "depositphotos", "pinterest", "pinimg", "facebook", "fbsbx", "instagram", "tiktok",
           "youtube", "ytimg", "freepik", "vecteezy", "lookaside"]
BAD_TITLE = re.compile(r"\b(logo|icon|banner|sale|price|vs\.?|versus|comparison|unboxing|teardown|"
                       r"repair|wallpaper|clipart|vector|cartoon|drawing)\b", re.I)
LOW_TRUST = ["alibaba", "alicdn", "aliexpress", "made-in-china", "indiamart", "ebay", "dhgate",
             "temu", "jumia", "jiji", "amazon.", "walmart"]   # marketplaces: logos/watermarks common
# words in the product name -> title words that mean a different variant
CONFLICTS = {"utp": r"(s?ftp|stp|armou?red|shielded)", "sftp": r"utp",
             "wireless": r"wired", "poe": None}
MIN_SIDE, FALLBACK_SIDE, MAX_SIDE = 800, 600, 1600
DUP_DIST, ANGLE_DIST = 6, 10   # dHash hamming: <=6 duplicate; <=10 "near identical" within product

log_fh = None


def log(msg):
    log_fh.write(time.strftime("%H:%M:%S ") + msg + "\n")
    log_fh.flush()


def load_key():
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        if re.match(r"(VITE_)?SERPER_API_KEY=", line):
            return line.split("=", 1)[1].strip().strip('"')
    sys.exit("SERPER_API_KEY missing from Frontend/.env")


def compact(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


# ---------- model matching ----------

def model_keys(row):
    """Compact strings that identify the exact model, e.g. 'probook450g9', '7md73a'."""
    model = row["model"]
    if not model:
        return []
    main = re.sub(r"\(.*?\)", "", model)
    keys = [compact(main)]
    for alt in re.findall(r"\((.*?)\)", model):
        if re.search(r"\d", alt):
            keys.append(compact(alt))
    return [k for k in keys if k]


def sibling_pattern(key):
    """'probook450g9' -> regex matching any 'probook###g#' (to catch wrong models)."""
    return re.compile(re.sub(r"\d+", lambda m: r"\d{%d}" % len(m.group()), re.escape(key)))


UNIT_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(tb|va|kva|ports?|users?|gb|mbps)\b", re.I)


def units(text):
    out = {}
    for n, u in UNIT_RE.findall(text or ""):
        u = u.lower().rstrip("s")
        out.setdefault(u, set()).add(float(n))
    return out


def judge(row, title, page):
    """Return (confidence, reason) or (None, reject_reason)."""
    text = f"{title} {page}"
    ctext = compact(text)
    keys = model_keys(row)
    if keys:
        if any(k in ctext for k in keys):
            weak = compact(row["model"]).removeprefix(compact(row["brand"])).isdigit()
            return ("medium" if weak else "high"), "model in title/url"
        for k in keys:
            sibs = set(sibling_pattern(k).findall(ctext))
            if sibs - {k}:
                return None, f"different model ({', '.join(sorted(sibs))[:40]})"
        return "medium", "model not named in title"
    for word, pat in CONFLICTS.items():
        if pat and re.search(rf"{word}", row["name"], re.I) and re.search(pat, title, re.I):
            return None, f"different variant (not {word})"
    # no model: generic product; reject conflicting capacity / port counts
    want, got = units(row["name"]), units(title)
    for u, vals in want.items():
        if u in got and not (got[u] & vals):
            return None, f"different {u} ({sorted(got[u])})"
    return "generic", "no model in CSV"


# ---------- search ----------

def serper(session, key, q):
    for attempt in range(3):
        try:
            r = session.post("https://google.serper.dev/images", timeout=20,
                             headers={"X-API-KEY": key, "Content-Type": "application/json"},
                             json={"q": q, "num": 20})
            r.raise_for_status()
            time.sleep(0.7)
            return r.json().get("images", [])
        except Exception as e:
            err = e
            time.sleep(3 * (attempt + 1))
    raise err


def domain_of(url):
    return (urlparse(url).hostname or "").removeprefix("www.")


def candidates(session, key, row, log_rejects):
    ok_searches = 0
    queries = [row["search_query"]]
    if row["model"]:
        queries.append(f'{row["brand"]} {row["model"]} official product image')
    queries.append(f'{row["name"]} {row["brand"]}'.strip())
    seen, out = set(), []
    for q in queries:
        try:
            results = serper(session, key, q)
        except Exception as e:
            log(f"  search failed '{q}': {e}")
            continue
        ok_searches += 1
        log(f"  query '{q}': {len(results)} results")
        for it in results:
            url = it.get("imageUrl", "")
            if not url or url in seen:
                continue
            seen.add(url)
            dom = domain_of(it.get("link") or url)
            img_dom = domain_of(url)
            title = it.get("title", "")
            w, h = it.get("imageWidth") or 0, it.get("imageHeight") or 0
            why = None
            if any(b in dom or b in img_dom for b in BLOCKED):
                why = "blocked domain"
            elif re.search(r"\.(svg|gif)(\?|$)", url, re.I):
                why = "svg/gif"
            elif BAD_TITLE.search(title):
                why = "bad title word"
            elif w and h and min(w, h) < FALLBACK_SIDE:
                why = f"too small {w}x{h}"
            conf = reason = None
            if not why:
                conf, reason = judge(row, title, it.get("link", ""))
                if conf is None:
                    why = reason
            if why:
                log_rejects.append(f"    reject [{why}] {dom} {url[:110]}")
                continue
            trusted = any(t in dom or t in img_dom for t in TRUSTED)
            low = any(t in dom or t in img_dom for t in LOW_TRUST)
            score = (3 if trusted else 0) - (2 if low else 0) + {"high": 2, "medium": 1, "generic": 1}[conf] \
                + (1 if min(w, h) >= MIN_SIDE else 0) - it.get("position", 50) / 100
            out.append(dict(url=url, page=it.get("link", ""), domain=dom, title=title,
                            conf=conf, reason=reason, trusted=trusted, score=score, query=q))
        good = [c for c in out if c["conf"] == "high" or c["trusted"]]
        if len(good) >= 6:
            break
    if not ok_searches:
        raise RuntimeError("all searches failed (network) - not marked done")
    return sorted(out, key=lambda c: -c["score"])


# ---------- image processing ----------

def fetch(session, url):
    for attempt in range(3):
        try:
            r = session.get(url, timeout=20, headers={"User-Agent": UA, "Accept": "image/*,*/*"})
            r.raise_for_status()
            if len(r.content) < 5000:
                raise ValueError(f"tiny response {len(r.content)}B")
            return r.content
        except Exception as e:
            err = e
            time.sleep(1 + attempt)
    raise err


def to_rgb(im):
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        return bg
    return im.convert("RGB")


def dhash(im):
    g = im.convert("L").resize((9, 8), Image.LANCZOS)
    px = list(g.get_flattened_data()) if hasattr(g, 'get_flattened_data') else list(g.getdata())
    return sum(1 << i for i in range(64) if px[(i // 8) * 9 + i % 8] > px[(i // 8) * 9 + i % 8 + 1])


def ham(a, b):
    return bin(a ^ b).count("1")


def white_border(im):
    """Share of near-white pixels on the outer border (clean packshot ~1.0, lifestyle ~0)."""
    s = im.resize((64, 64))
    px = s.load()
    edge = [px[x, y] for x in range(64) for y in (0, 1, 62, 63)] + \
           [px[x, y] for y in range(64) for x in (0, 1, 62, 63)]
    return sum(1 for p in edge if min(p) > 235) / len(edge)


def product_codes(text):
    """Manufacturer part codes like BR1500MS2, SMT1500IC, TL-SG1016D (letters+digits, >=5 chars)."""
    toks = re.findall(r"[a-z0-9]+(?:-[a-z0-9]+)*", text.lower())
    return {t.replace("-", "") for t in toks
            if len(t.replace("-", "")) >= 5 and re.search(r"\d", t) and re.search(r"[a-z]", t)
            and not re.fullmatch(r"\d+(va|kva|tb|gb|mbps|awg|w|m|mm|px)", t)}


def load_global_hashes(exclude_sku):
    hashes = {}
    for f in META_DIR.glob("*.json"):
        m = json.loads(f.read_text())
        if m["sku"] != exclude_sku:
            for img in m["images"]:
                hashes[int(img["dhash"], 16)] = m["sku"]
    return hashes


def process(session, key, row, force):
    sku = row["sku"]
    names = [row[c] for c in ("filename", "filename_2", "filename_3") if row[c]]
    meta_path = META_DIR / f"{sku}.json"
    if meta_path.exists() and not force:
        return "skip"
    log(f"== {sku} {row['name']}")
    global_hashes = load_global_hashes(sku)
    rejects = []
    cands = candidates(session, key, row, rejects)
    picked, low_res = [], []
    for c in cands:
        if len(picked) >= len(names) or len(picked) + len(low_res) >= 12:
            break
        try:
            raw = fetch(session, c["url"])
            im = Image.open(io.BytesIO(raw))
            if im.format in ("GIF", "SVG"):
                raise ValueError(im.format)
            im = to_rgb(im)
        except Exception as e:
            rejects.append(f"    reject [download/decode: {str(e)[:60]}] {c['url'][:110]}")
            continue
        w, h = im.size
        hsh = dhash(im)
        dup = next((s for g, s in global_hashes.items() if ham(g, hsh) <= DUP_DIST), None)
        if dup:
            rejects.append(f"    reject [duplicate of {dup}] {c['url'][:110]}")
            continue
        if any(ham(p["hash"], hsh) <= ANGLE_DIST for p in picked + low_res):
            rejects.append(f"    reject [near-identical to a picked image] {c['url'][:110]}")
            continue
        if min(w, h) < FALLBACK_SIDE:
            rejects.append(f"    reject [actual size {w}x{h}] {c['url'][:110]}")
            continue
        white = white_border(im)
        if white < 0.6 and (c["conf"] != "high" or not picked):
            rejects.append(f"    reject [not a clean packshot, white={white:.2f}] {c['url'][:110]}")
            continue
        c.update(im=im, hash=hsh, w=w, h=h, white=white)
        (picked if min(w, h) >= MIN_SIDE else low_res).append(c)
        time.sleep(0.5)
    flags = []
    if not picked and low_res:
        picked = low_res[:1]
        flags.append("low-res fallback")
    # position 1 = best clean packshot (white background, then score)
    if picked:
        picked.sort(key=lambda c: -(c["score"] + (2 if c["white"] > 0.8 else 0)))
        if picked[0]["white"] < 0.5:
            flags.append("main image not on white background")
    if picked and not row["model"]:
        # generic product: extra slots must show the same model as image 1 (shared product code)
        codes = product_codes(picked[0]["title"] + " " + picked[0]["url"])
        keep = picked[:1] + [c for c in picked[1:] if codes & product_codes(c["title"] + " " + c["url"])]
        dropped = [c for c in picked if c not in keep]
        for c in dropped:
            rejects.append(f"    drop [generic: different model than image 1] {c['url'][:110]}")
        picked = keep
    images = []
    for pos, (c, fname) in enumerate(zip(picked, names), start=1):
        im = c["im"]
        if max(im.size) > MAX_SIDE:
            im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        im.save(IMG_DIR / fname, "JPEG", quality=85, optimize=True, progressive=True)
        img_flags = []
        if min(c["w"], c["h"]) < MIN_SIDE:
            img_flags.append(f"low-res {c['w']}x{c['h']}")
        if c["white"] < 0.5:
            img_flags.append("non-white background")
        images.append(dict(position=pos, filename=fname, width=im.size[0], height=im.size[1],
                           orig=f"{c['w']}x{c['h']}", source_url=c["url"], page_url=c["page"],
                           source_domain=c["domain"], trusted=c["trusted"], confidence=c["conf"],
                           title=c["title"][:150], dhash=f"{c['hash']:016x}", flags=img_flags,
                           kb=round((IMG_DIR / fname).stat().st_size / 1024)))
        log(f"  SAVED {fname} {im.size[0]}x{im.size[1]} [{c['conf']}] {c['domain']} {c['url']}")
    for r in rejects:
        log(r)
    meta = dict(sku=sku, name=row["name"], images=images, flags=flags,
                generic=not row["model"], candidates=len(cands))
    meta_path.write_text(json.dumps(meta, indent=1))
    return f"{len(images)} img"


# ---------- report ----------

def report(rows):
    manifest, review, counts = [], [], {0: 0, 1: 0, 2: 0, 3: 0}
    dupe_names = {}
    for r in rows:
        dupe_names.setdefault(r["name"].lower().replace("tplink", "tp link"), []).append(r["sku"])
    zf = zipfile.ZipFile(HERE / "product-images.zip", "w", zipfile.ZIP_DEFLATED)
    for r in rows:
        mp = META_DIR / f"{r['sku']}.json"
        m = json.loads(mp.read_text()) if mp.exists() else dict(images=[], flags=["not processed"])
        imgs = m["images"]
        counts[len(imgs)] += 1
        for i in imgs:
            zf.write(IMG_DIR / i["filename"], i["filename"])
            manifest.append(dict(sku=r["sku"], name=r["name"], image_position=i["position"],
                                 filename=i["filename"], is_primary=str(i["position"] == 1).lower(),
                                 width=i["width"], height=i["height"], source_url=i["source_url"],
                                 source_domain=i["source_domain"], match_confidence=i["confidence"],
                                 status="ok" if not i["flags"] else "flagged",
                                 notes="; ".join(i["flags"] + ([] if i["trusted"] else ["non-manufacturer source"]))))
        reasons = list(m.get("flags", []))
        if not imgs:
            reasons.append("no image found")
        elif all("low-res" in " ".join(i["flags"]) for i in imgs):
            reasons.append("only low-resolution images")
        if imgs and all(i["confidence"] == "generic" for i in imgs):
            reasons.append("only generic image(s)")
        if any(i["confidence"] == "medium" for i in imgs):
            reasons.append("possible wrong model (medium confidence)")
        same = dupe_names[r["name"].lower().replace("tplink", "tp link")]
        if len(same) > 1:
            reasons.append("same product name as " + ",".join(s for s in same if s != r["sku"]))
        if reasons:
            review.append(dict(sku=r["sku"], name=r["name"], images=len(imgs), reasons="; ".join(reasons)))
    zf.close()
    for name, data in (("images-manifest.csv", manifest), ("needs-review.csv", review)):
        with open(HERE / name, "w", newline="", encoding="utf-8") as f:
            if data:
                w = csv.DictWriter(f, fieldnames=list(data[0]))
                w.writeheader()
                w.writerows(data)
    print(f"Products with 3/2/1/0 images: {counts[3]}/{counts[2]}/{counts[1]}/{counts[0]}")
    print(f"{len(manifest)} images -> product-images.zip; {len(review)} rows in needs-review.csv")


def main():
    global log_fh
    ap = argparse.ArgumentParser()
    ap.add_argument("--skus")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--report", action="store_true")
    a = ap.parse_args()
    rows = list(csv.DictReader(open(CSV_PATH, encoding="utf-8")))
    for r in rows:
        r.update({k: (v or "").strip() for k, v in r.items()})
    if a.report:
        return report(rows)
    IMG_DIR.mkdir(exist_ok=True)
    META_DIR.mkdir(exist_ok=True)
    log_fh = open(LOG_PATH, "a", encoding="utf-8")
    if a.skus:
        wanted = set(a.skus.split(","))
        rows = [r for r in rows if r["sku"] in wanted]
        missing = wanted - {r["sku"] for r in rows}
        if missing:
            sys.exit(f"Unknown SKUs: {missing}")
    key = load_key()
    s = requests.Session()
    s.headers["User-Agent"] = UA
    for i, r in enumerate(rows, 1):
        try:
            res = process(s, key, r, a.force)
        except Exception as e:
            res = f"ERROR {e}"
            log(f"  ERROR {r['sku']}: {e}")
        print(f"[{i}/{len(rows)}] {r['sku']}: {res}")
        if res != "skip":
            time.sleep(1.5)


if __name__ == "__main__":
    main()
