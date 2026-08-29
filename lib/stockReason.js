const KNOWN_REASONS = ['Terjual', 'Rusak', 'Kadaluarsa', 'Retur', 'Hilang']

// "Penjualan kasir" ditulis otomatis sama checkout_transaction() RPC, disamain
// sebagai "Terjual" biar kesatuan sama alasan keluar yang diinput manual.
const SYNONYMS = { 'Penjualan kasir': 'Terjual' }

// note di stock_movements bisa berupa "Terjual" doang, atau "Terjual — catatan
// tambahan". Ambil bagian sebelum " — " aja buat nentuin kategorinya.
export function extractReason(note) {
  if (!note) return 'Lainnya'
  const firstPart = note.split(' — ')[0].trim()
  if (SYNONYMS[firstPart]) return SYNONYMS[firstPart]
  return KNOWN_REASONS.includes(firstPart) ? firstPart : 'Lainnya'
}