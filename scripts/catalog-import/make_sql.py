#!/usr/bin/env python3
"""Write import_catalog.sql from catalog_v2.json.

Usage:  python3 make_sql.py [--skus SKU1,SKU2] [--out FILE]

The SQL is an anonymous DO block (no function left behind) that:
  * creates/updates the categories by name,
  * inserts each product + its single "Default" variant, matched on SKU,
  * skips any SKU that already exists, so re-running it never duplicates products
    or overwrites edits made in the admin since the first import.
Every product is inserted hidden (is_active = false) until it has photos.
"""
import argparse
import json
from pathlib import Path

HERE = Path(__file__).parent

TEMPLATE = """do $import$
declare
  r record;
  v_category_id bigint;
  v_product_id bigint;
begin
  for r in select * from jsonb_to_recordset($json${categories}$json$::jsonb) as x(name text, description text)
  loop
    insert into public.categories (name, description) values (r.name, r.description)
    on conflict (name) do update set description = excluded.description, updated_at = now();
  end loop;

  for r in select * from jsonb_to_recordset($json${products}$json$::jsonb) as x(
    sku text, category text, name text, price numeric, brand text, model_number text, condition text,
    warranty text, stock integer, short_description text, description text, in_the_box text,
    admin_notes text, specs jsonb)
  loop
    if exists (select 1 from public.product_variants v where v.sku_code = r.sku) then
      continue;
    end if;
    select c.id into v_category_id from public.categories c where c.name = r.category;
    insert into public.products (
      category_id, name, price, stock, brand, model_number, condition, warranty,
      short_description, description, in_the_box, admin_notes, specs, is_active,
      screen_size, resolution, os, connectivity
    ) values (
      v_category_id, r.name, r.price, r.stock, r.brand, r.model_number, r.condition, r.warranty,
      r.short_description, r.description, r.in_the_box, r.admin_notes, coalesce(r.specs, '{{}}'::jsonb), false,
      r.specs->>'screen_size', r.specs->>'resolution', r.specs->>'os', r.specs->>'connectivity'
    ) returning id into v_product_id;
    insert into public.product_variants (product_id, sku_code, size_or_color, price_adjustment, stock_quantity)
    values (v_product_id, r.sku, 'Default', 0, r.stock);
  end loop;
end
$import$;
"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skus", help="comma-separated SKUs to include (default: all)")
    parser.add_argument("--out", default=str(HERE / "import_catalog.sql"))
    args = parser.parse_args()

    catalog = json.loads((HERE / "catalog_v2.json").read_text())
    products = catalog["products"]
    if args.skus:
        wanted = set(args.skus.split(","))
        products = [p for p in products if p["sku"] in wanted]
    compact = lambda value: json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    sql = TEMPLATE.format(categories=compact(catalog["categories"]), products=compact(products))
    assert "$json$" not in compact(catalog), "data must not contain the dollar-quote tag"
    Path(args.out).write_text(sql)
    print(f"{len(products)} products -> {args.out} ({len(sql):,} bytes)")


if __name__ == "__main__":
    main()
