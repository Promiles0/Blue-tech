#!/usr/bin/env python3
"""Print an md5 fingerprint per SKU of catalog_v2.json, to compare with VERIFY_SQL run
against the database — proves every imported field matches the spreadsheet exactly."""
import hashlib
import json
from pathlib import Path

VERIFY_SQL = """
select v.sku_code as sku, md5(concat_ws('|', v.sku_code, p.name, p.price::bigint::text,
  coalesce(p.brand,''), coalesce(p.model_number,''), coalesce(p.condition,''), coalesce(p.warranty,''),
  v.stock_quantity::text, coalesce(p.short_description,''), coalesce(p.description,''),
  coalesce(p.in_the_box,''), coalesce(p.admin_notes,''), c.name,
  (select coalesce(string_agg(key || '=' || value, ';' order by key collate "C"), '') from jsonb_each_text(p.specs))
)) as fingerprint
from public.product_variants v join public.products p on p.id = v.product_id
join public.categories c on c.id = p.category_id
where v.sku_code like 'BT-%' order by 1;
"""


def fingerprint(p):
    specs = ";".join(f"{k}={p['specs'][k]}" for k in sorted(p["specs"]))
    parts = [p["sku"], p["name"], str(int(p["price"])), p["brand"] or "", p["model_number"] or "",
             p["condition"] or "", p["warranty"] or "", str(p["stock"]), p["short_description"] or "",
             p["description"] or "", p["in_the_box"] or "", p["admin_notes"] or "", p["category"], specs]
    return hashlib.md5("|".join(parts).encode()).hexdigest()


if __name__ == "__main__":
    catalog = json.loads((Path(__file__).parent / "catalog_v2.json").read_text())
    print(json.dumps({p["sku"]: fingerprint(p) for p in catalog["products"]}))
