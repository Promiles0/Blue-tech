// Which spec fields each category uses. The admin product form renders these inputs,
// and the product page / quick view render the filled ones as a specifications table.
// Values are stored in the product's `specs` jsonb column under `key`.
//
// Keys shared across categories (ram, storage, screen_size, cpu_family) power the
// storefront filters, so keep their wording consistent: "8GB", "512GB SSD", '15.6"'.

const PROCESSOR = { key: 'processor', label: 'Processor', placeholder: 'e.g. Intel Core i5-1335U (13th Gen)' }
const CPU_FAMILY = {
  key: 'cpu_family', label: 'Processor family (filter)', placeholder: 'e.g. Intel Core i5',
  options: ['Intel Celeron', 'Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core 5', 'Intel Core 7', 'Intel Core Ultra 5', 'Intel Core Ultra 7', 'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7'],
}
const RAM = { key: 'ram', label: 'RAM', placeholder: 'e.g. 8GB', options: ['4GB', '6GB', '8GB', '16GB', '32GB', '64GB'] }
const STORAGE = { key: 'storage', label: 'Storage', placeholder: 'e.g. 512GB SSD', options: ['64GB', '128GB', '256GB SSD', '512GB SSD', '1TB SSD', '1TB HDD'] }
const SCREEN = { key: 'screen_size', label: 'Screen size', placeholder: 'e.g. 15.6"', options: ['8.7"', '11"', '14"', '15.6"', '16"', '24"', '27"', '32"'] }
const OS = { key: 'operating_system', label: 'Operating system', placeholder: 'e.g. Windows 11' }
const PORTS = { key: 'ports', label: 'Ports', placeholder: 'e.g. 2 x USB-A, 1 x USB-C, HDMI', wide: true }

export const SPEC_TEMPLATES = [
  {
    id: 'laptops', match: /laptop|notebook/i,
    fields: [
      PROCESSOR, CPU_FAMILY, RAM, STORAGE, SCREEN, OS,
      { key: 'graphics', label: 'Graphics', placeholder: 'e.g. Intel UHD Graphics' },
      { key: 'battery', label: 'Battery', placeholder: 'e.g. 41 Wh, 3-cell' },
      { key: 'weight', label: 'Weight', placeholder: 'e.g. Approx. 1.6 kg' },
      { key: 'keyboard', label: 'Keyboard', placeholder: 'e.g. Backlit' },
      { key: 'wireless', label: 'Wi-Fi / Bluetooth', placeholder: 'e.g. Wi-Fi 6 / Bluetooth 5.3' },
      { key: 'ram_upgradeable', label: 'RAM upgradeable', placeholder: 'e.g. Yes, up to 32 GB' },
      PORTS,
    ],
  },
  {
    id: 'desktops', match: /desktop|all.?in.?one|\bpc\b/i,
    fields: [
      PROCESSOR, CPU_FAMILY, RAM, STORAGE, OS,
      { key: 'monitor_size', label: 'Monitor size', placeholder: 'e.g. 21.5"' },
      { key: 'included', label: 'Included', placeholder: 'e.g. Monitor, keyboard and mouse' },
      { key: 'upgradeable', label: 'Upgradeable (RAM / storage)', placeholder: 'e.g. Yes: 2 DIMM slots', wide: true },
      PORTS,
    ],
  },
  {
    id: 'monitors', match: /monitor|display/i,
    fields: [
      SCREEN,
      { key: 'resolution', label: 'Resolution', placeholder: 'e.g. Full HD (1920 x 1080)' },
      { key: 'panel_type', label: 'Panel type', placeholder: 'e.g. IPS' },
      { key: 'refresh_rate', label: 'Refresh rate', placeholder: 'e.g. 100 Hz' },
      PORTS,
    ],
  },
  {
    id: 'printers', match: /print|copier/i,
    fields: [
      { key: 'printer_type', label: 'Type', placeholder: 'e.g. Colour ink tank' },
      { key: 'functions', label: 'Functions', placeholder: 'e.g. Print, scan, copy' },
      { key: 'print_speed', label: 'Print speed', placeholder: 'e.g. Up to 33 ppm' },
      { key: 'paper_size', label: 'Paper size', placeholder: 'e.g. A4, A5, Letter' },
      { key: 'connectivity', label: 'Connectivity', placeholder: 'e.g. Wi-Fi, USB' },
      { key: 'duplex', label: 'Two-sided printing', placeholder: 'e.g. Automatic' },
      { key: 'cartridge', label: 'Cartridge / ink', placeholder: 'e.g. Epson 103 ink bottles', wide: true },
    ],
  },
  {
    id: 'network', match: /network|switch|router|access point/i,
    fields: [
      { key: 'specification', label: 'Specification', placeholder: 'e.g. AC1900 dual band' },
      { key: 'speed', label: 'Speed', placeholder: 'e.g. 10/100/1000 Mbps' },
      { key: 'frequency_band', label: 'Frequency band', placeholder: 'e.g. 2.4 GHz + 5 GHz' },
      { key: 'port_count', label: 'Number of ports', placeholder: 'e.g. 16' },
      { key: 'poe', label: 'PoE support', placeholder: 'e.g. Yes, 24 PoE ports' },
      { key: 'cable_length', label: 'Cable length', placeholder: 'e.g. 305 m' },
    ],
  },
  {
    id: 'tablets', match: /tablet|\btab\b/i,
    fields: [
      RAM, STORAGE, SCREEN,
      { key: 'screen_resolution', label: 'Screen resolution', placeholder: 'e.g. 1340 x 800' },
      { key: 'battery', label: 'Battery', placeholder: 'e.g. 5,100 mAh' },
      { key: 'connectivity', label: 'Connectivity', placeholder: 'e.g. Wi-Fi only' },
      { key: 'camera', label: 'Camera', placeholder: 'e.g. 8 MP rear, 2 MP front' },
    ],
  },
  {
    id: 'interactive-screens', match: /interactive/i,
    fields: [
      SCREEN,
      { key: 'resolution', label: 'Resolution', placeholder: 'e.g. 4K UHD (3840×2160)' },
      { key: 'touch_points', label: 'Touch points', placeholder: 'e.g. 20' },
      { key: 'os', label: 'OS', placeholder: 'e.g. Android 13 + OPS slot' },
      { key: 'connectivity', label: 'Connectivity', placeholder: 'e.g. HDMI ×2, USB-C, RJ45, Wi-Fi 6', wide: true },
    ],
  },
  {
    id: 'ups', match: /\bups\b|power|projector/i,
    fields: [
      { key: 'capacity', label: 'Capacity', placeholder: 'e.g. 1000VA' },
      { key: 'power', label: 'Power (watts)', placeholder: 'e.g. 600 W' },
      { key: 'backup_time', label: 'Backup time', placeholder: 'e.g. About 10 min at half load' },
      { key: 'outlets', label: 'Outlets', placeholder: 'e.g. 6 x Schuko' },
      { key: 'battery_type', label: 'Battery type', placeholder: 'e.g. Sealed lead-acid' },
    ],
  },
  {
    id: 'accessories', match: /accessor|peripheral|storage|software/i,
    fields: [
      { key: 'compatibility', label: 'Compatibility', placeholder: 'e.g. Windows, macOS' },
      { key: 'connection', label: 'Wired / wireless', placeholder: 'e.g. Wireless (USB receiver)' },
      { key: 'colour', label: 'Colour', placeholder: 'e.g. Black' },
    ],
  },
]

const ALL_FIELDS = new Map()
for (const template of SPEC_TEMPLATES) {
  for (const field of template.fields) if (!ALL_FIELDS.has(field.key)) ALL_FIELDS.set(field.key, field)
}

export function templateForCategory(categoryName) {
  if (!categoryName) return null
  return SPEC_TEMPLATES.find(t => t.match.test(categoryName)) ?? null
}

// "battery_type" → "Battery type", for spec keys that no template knows about.
export function specLabel(key) {
  const known = ALL_FIELDS.get(key)
  if (known) return known.label.replace(/ \(filter\)$/, '')
  const text = String(key).replace(/_/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Rows for a product's specifications table: template order first, then any extra keys.
// `cpu_family` is filter metadata, not something a shopper needs to read.
export function specRows(product, categoryName) {
  const specs = product?.specs && typeof product.specs === 'object' ? product.specs : {}
  const template = templateForCategory(categoryName ?? product?.categoryName)
  const ordered = template ? template.fields.map(f => f.key) : []
  const keys = [...ordered, ...Object.keys(specs).filter(k => !ordered.includes(k))]
  return keys
    .filter(k => k !== 'cpu_family' && specs[k] != null && String(specs[k]).trim() !== '')
    .map(k => ({ key: k, label: specLabel(k), value: String(specs[k]) }))
}

export const FILTER_FACETS = [
  { key: 'brand', label: 'Brand' },
  { key: 'cpu_family', label: 'Processor' },
  { key: 'ram', label: 'RAM' },
  { key: 'storage', label: 'Storage' },
  { key: 'screen_size', label: 'Screen size' },
]
