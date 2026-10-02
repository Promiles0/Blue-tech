# Catalogue import (Oct 2026)

Loads the product spreadsheet (`items_list_arranged3.xlsx`, 65 products) into Supabase.

| File | What it is |
| --- | --- |
| `build_catalog.py` | Reads the spreadsheet and writes `catalog_v2.json`. Keeps product names exactly as written; normalises spec values (RAM `8GB`, storage `512GB SSD`, screen `15.6"`) so the shop filters group them. |
| `catalog_v2.json` | The cleaned data: 8 categories + 65 products. |
| `make_sql.py` | Turns the JSON into `import_catalog.sql` (optionally only some `--skus`). |
| `import_catalog.sql` | Inserts the categories and products. Products whose SKU already exists are **skipped**, so it is safe to re-run and never overwrites edits made in the admin. Every product is inserted **hidden**. |
| `verify_catalog.py` | Fingerprints each product so the database can be compared with the JSON field by field. |
| `cleanup_old_data.sql` | One-off: removes test orders, carts and the old sample products/categories. |

Already done on the live project: all 65 products imported (hidden) and verified.
Prices are RWF; stock 10; warranty "6 months".

## Publishing a product

Admin → Products → edit → add photos → tick **Visible in the shop** → Save.
The "Internal notes" box shows what the spreadsheet research flagged for checking.
