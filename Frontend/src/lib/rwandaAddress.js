// Rwandan delivery address: Province → District, then sector/street and a landmark.
// Rwanda has no postal codes, so there's no ZIP field. Stored in the existing address
// columns: state = province, city = district, street = sector/street (+ landmark).
export const RWANDA = {
  'Kigali City': ['Gasabo', 'Kicukiro', 'Nyarugenge'],
  'Eastern Province': ['Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana'],
  'Northern Province': ['Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo'],
  'Southern Province': ['Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyaruguru', 'Ruhango'],
  'Western Province': ['Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro'],
}

export const EMPTY_RW_ADDRESS = { state: 'Kigali City', city: '', street: '', landmark: '', zipCode: '', country: 'Rwanda', phone: '' }

// Street line the courier reads: "Kimihurura, KG 7 Ave No. 12 (near Kigali Heights)".
export function addressStreet(a) {
  const street = (a.street ?? '').trim()
  const landmark = (a.landmark ?? '').trim()
  return landmark ? `${street} (near ${landmark})` : street
}
