#!/usr/bin/env python3
"""Turn the product spreadsheet (items_list_arranged3.xlsx) into catalog_v2.json.

Usage:  python3 build_catalog.py path/to/items_list_arranged3.xlsx

The JSON is what import_catalog.sql loads (see README.md). Product names are kept exactly
as written in the spreadsheet; spec values are normalised ("16GBRAM/512GBSSD" -> RAM
"16GB", storage "512GB SSD") so the storefront filters group them correctly.
"""
import json
import re
import sys
from pathlib import Path

import openpyxl

DEFAULT_WARRANTY = "6 months"
DEFAULT_STOCK = 10

CATEGORIES = {
    "Laptops": "Laptops for work, business, school and everyday computing, from value models to premium business machines.",
    "Desktops": "Desktop computers and all-in-ones for offices, schools and home use, many supplied with a monitor, keyboard and mouse.",
    "Monitors": "High-quality displays for computers and other devices, suitable for work, study, entertainment and professional use.",
    "Printers & Photocopiers": "Printing and document-copying equipment for homes, offices, schools and businesses, including ink tank, laser, dot matrix and photocopier models.",
    "Network Devices": "Networking equipment to connect devices and keep offices online: routers, switches, range extenders, wireless adapters, cabling and testers.",
    "Tablets": "Portable touchscreen devices for browsing, communication, entertainment, education, work and everyday digital tasks.",
    "Accessories": "Essential computer accessories such as mice, headsets, adapters, external hard drives, laptop stands, locks, cleaning products and antivirus software.",
    "UPS & Projectors": "Backup power devices that keep computers and network equipment running through power cuts and protect them from surges, plus projectors for presentations.",
}

SHEET_CATEGORY = {
    "Laptops": "Laptops",
    "Desktops": "Desktops",
    "Monitors": "Monitors",
    "Printers & Photocopiers": "Printers & Photocopiers",
    "Network Devices": "Network Devices",
    "Tablets": "Tablets",
    "Accessories": "Accessories",
    "UPS & Projector": "UPS & Projectors",
}

# Spreadsheet column -> spec key (see Frontend/src/lib/specTemplates.js).
SPEC_COLUMNS = {
    "Operating System": "operating_system",
    "Graphics": "graphics",
    "Battery Life": "battery",
    "Weight": "weight",
    "Ports": "ports",
    "Keyboard (e.g. backlit)": "keyboard",
    "Wi-Fi / Bluetooth": "wireless",
    "RAM Upgradeable": "ram_upgradeable",
    "Monitor Size": "monitor_size",
    "Included (keyboard, mouse...)": "included",
    "Upgradeable (RAM / Storage)": "upgradeable",
    "Resolution": "resolution",
    "Panel Type": "panel_type",
    "Refresh Rate": "refresh_rate",
    "Ports (HDMI, VGA, DisplayPort)": "ports",
    "Type": "printer_type",
    "Functions": "functions",
    "Print Speed": "print_speed",
    "Paper Size": "paper_size",
    "Connectivity (Wi-Fi, USB, Ethernet)": "connectivity",
    "Duplex (two-sided) Printing": "duplex",
    "Cartridge / Ink Type": "cartridge",
    "Speed": "speed",
    "Frequency Band": "frequency_band",
    "Number of Ports": "port_count",
    "PoE Support": "poe",
    "Cable Length": "cable_length",
    "Screen Resolution": "screen_resolution",
    "Battery": "battery",
    "Connectivity (Wi-Fi / SIM)": "connectivity",
    "Camera": "camera",
    "Compatibility": "compatibility",
    "Wired / Wireless": "connection",
    "Colour": "colour",
    "Power (Watts)": "power",
    "Backup Time": "backup_time",
    "Outlets (number / type)": "outlets",
    "Battery Type": "battery_type",
}

# Owner-approved renames: the two "16 PORTS" switches were identical names at different prices.
RENAMES = {
    "BT-NET-TPL-004": "TP LINK SWITCH 16 PORTS 10/100",
    "BT-NET-TPL-006": "TP LINK SWITCH 16 PORTS GIGABIT",
}


def text(value):
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def gb(value):
    m = re.search(r"(\d+)\s*GB", value, re.I)
    return f"{m.group(1)}GB" if m else ""


def storage(value):
    m = re.search(r"(\d+)\s*(GB|TB)\s*(SSD|HDD)?", value, re.I)
    if not m:
        return ""
    kind = f" {m.group(3).upper()}" if m.group(3) else ""
    return f"{m.group(1)}{m.group(2).upper()}{kind}"


def screen(value):
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:''|\"|INCH)", value, re.I)
    return f'{m.group(1)}"' if m else ""


def processor(raw, name):
    """('Intel Core i5 (13th Gen)', 'Intel Core i5') from the spreadsheet's free text."""
    value = re.sub(r"^PROCES+OR\s*:\s*", "", raw.strip(), flags=re.I)
    gen = re.search(r"(\d+)\s*(?:TH|ST|ND|RD)\b", value, re.I)
    gen_text = f" ({gen.group(1)}th Gen)" if gen else ""
    upper = value.upper()
    if "CELERON" in upper:
        return "Intel Celeron", "Intel Celeron"
    m = re.search(r"CORE\s*U\s*(\d)", upper)
    if m:
        return f"Intel Core Ultra {m.group(1)}", f"Intel Core Ultra {m.group(1)}"
    m = re.search(r"CORE\s*I\s*(\d)", upper) or re.search(r"\bI(\d)\b", name.upper())
    if m:
        family = f"Intel Core i{m.group(1)}"
        return family + gen_text, family
    m = re.search(r"CORE\s*(\d)\s*-?\s*(\d{3}U)?", upper)
    if m:
        family = f"Intel Core {m.group(1)}"
        return family + (f" {m.group(2)}" if m.group(2) else ""), family
    return value, ""


def fix_cpu_wording(s):
    # The research text calls Core Ultra chips "Core U7"/"Core U5"; use Intel's real name.
    return re.sub(r"\bCore U(\d)\b", r"Core Ultra \1", s)


def build(xlsx_path):
    wb = openpyxl.load_workbook(xlsx_path, data_only=True)
    products = []
    for ws in wb.worksheets:
        if ws.title not in SHEET_CATEGORY:
            continue
        rows = list(ws.iter_rows(values_only=True))
        header = rows[2]
        for row in rows[3:]:
            item = {h: row[i] for i, h in enumerate(header) if h}
            name = text(item.get("Product"))
            if not name:
                continue
            sku = text(item.get("SKU"))
            specs = {}
            for column, key in SPEC_COLUMNS.items():
                value = text(item.get(column))
                if value and value.upper() not in ("N/A", "NA", "-"):
                    specs[key] = fix_cpu_wording(value)

            ram_raw = text(item.get("RAM")) or text(item.get("Specification"))
            if ws.title in ("Laptops", "Desktops", "Tablets"):
                parts = ram_raw.split("/")
                if gb(parts[0]):
                    specs["ram"] = gb(parts[0])
                storage_value = storage(text(item.get("Storage"))) or (storage(parts[1]) if len(parts) > 1 else "")
                if storage_value:
                    specs["storage"] = storage_value
            if ws.title in ("Laptops", "Desktops"):
                display, family = processor(text(item.get("Processor")), name)
                specs["processor"] = display
                if family:
                    specs["cpu_family"] = family

            screen_size = screen(text(item.get("Display"))) or screen(text(item.get("Monitor Size"))) or screen(name)
            if not screen_size and name.upper().startswith("LENOVO V15"):
                screen_size = '15.6"'  # every V15 is a 15.6" laptop; this row's Display cell was empty
            all_in_one = ws.title == "Desktops" and "ALL IN ONE" in name.upper()
            if screen_size and (ws.title in ("Laptops", "Monitors", "Tablets") or all_in_one):
                specs["screen_size"] = screen_size
            if ws.title == "Network Devices" and text(item.get("Specification")):
                specs["specification"] = text(item.get("Specification"))
            if ws.title == "Printers & Photocopiers":
                specs.setdefault("printer_type", text(item.get("Type")))
            if ws.title == "UPS & Projector":
                m = re.search(r"(\d+)\s*(k?)VA", name, re.I)
                if m:
                    specs["capacity"] = f"{m.group(1)}{m.group(2).lower()}VA"

            price = item.get("Price")
            products.append({
                "sku": sku,
                "category": SHEET_CATEGORY[ws.title],
                "name": RENAMES.get(sku, name),
                "price": int(price) if isinstance(price, (int, float)) else 0,
                "brand": text(item.get("Brand")) or None,
                "model_number": text(item.get("Model Number")) or None,
                "condition": text(item.get("Condition")) or None,
                "warranty": text(item.get("Warranty")) or DEFAULT_WARRANTY,
                "stock": int(item["Stock Quantity"]) if isinstance(item.get("Stock Quantity"), (int, float)) else DEFAULT_STOCK,
                "short_description": fix_cpu_wording(text(item.get("Short Description"))) or None,
                "description": fix_cpu_wording(text(item.get("Full Description"))) or None,
                "in_the_box": text(item.get("What's in the Box")) or None,
                "admin_notes": text(item.get("Notes (to confirm)")) or None,
                "specs": {k: v for k, v in specs.items() if v},
            })
    skus = [p["sku"] for p in products]
    assert all(skus) and len(set(skus)) == len(skus), "every product needs a unique SKU"
    return {"categories": [{"name": k, "description": v} for k, v in CATEGORIES.items()], "products": products}


if __name__ == "__main__":
    catalog = build(sys.argv[1])
    out = Path(__file__).with_name("catalog_v2.json")
    out.write_text(json.dumps(catalog, indent=1, ensure_ascii=False) + "\n")
    print(f"{len(catalog['products'])} products -> {out}")
