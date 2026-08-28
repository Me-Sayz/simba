// Utilitas buat ubah QRIS statis (dari GoPay Merchant, atau PJSP lain yang ikut
// standar QRIS/EMVCo) jadi QRIS dinamis dengan nominal transaksi disisipkan.
//
// Format QRIS itu TLV (Tag-Length-Value): tiap field = 2 digit tag + 2 digit
// panjang value + value itu sendiri, diulang sampai habis. Field-field penting:
//   00 = Payload Format Indicator
//   01 = Point of Initiation Method ("11" statis, "12" dinamis)
//   54 = Transaction Amount (nominal transaksi, cuma ada di QRIS dinamis)
//   58 = Country Code
//   59 = Merchant Name
//   60 = Merchant City
//   63 = CRC (checksum, wajib di-hitung ulang tiap kali isi string berubah)
//
// PENTING: ini cuma manipulasi field standar EMV QR pada QRIS MILIK TOKO SENDIRI
// (bukan modifikasi QRIS orang lain). Ini teknik yang lazim dipakai POS kecil
// buat convert QRIS statis (nominal manual) jadi dinamis (nominal otomatis)
// tanpa perlu payment gateway berbayar. Konsekuensinya: SIMBA gak dapat
// konfirmasi otomatis dari pembayaran ini (gak ada webhook), makanya konfirmasi
// "Sudah Dibayar" di kasir tetap manual.

/**
 * Parse string QRIS jadi list field {tag, value} sesuai urutan aslinya.
 */
function parseEMV(str) {
  const fields = []
  let i = 0
  while (i < str.length) {
    const tag = str.substring(i, i + 2)
    const len = parseInt(str.substring(i + 2, i + 4), 10)
    if (Number.isNaN(len)) {
      throw new Error('String QRIS gak valid (format panjang field rusak)')
    }
    const value = str.substring(i + 4, i + 4 + len)
    fields.push({ tag, value })
    i += 4 + len
  }
  return fields
}

/**
 * Bangun ulang string EMV dari list field {tag, value}.
 */
function buildEMV(fields) {
  return fields
    .map((f) => {
      const len = String(f.value.length).padStart(2, '0')
      return `${f.tag}${len}${f.value}`
    })
    .join('')
}

/**
 * CRC16-CCITT (polynomial 0x1021, init 0xFFFF) — algoritma checksum standar
 * yang dipakai EMVCo/QRIS di field tag 63.
 */
function crc16ccitt(str) {
  let crc = 0xffff
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8
    for (let i = 0; i < 8; i++) {
      crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/**
 * Validasi checksum QRIS statis yang di-upload/decode Owner. Dipakai pas setup
 * biar ketahuan dari awal kalau hasil decode gambar QR-nya rusak/bukan QRIS
 * valid — daripada baru ketahuan pas checkout beneran di depan pelanggan.
 */
export function validateStaticQris(str) {
  if (!str || typeof str !== 'string' || str.length < 8) return false
  try {
    const fields = parseEMV(str)
    const crcField = fields.find((f) => f.tag === '63')
    if (!crcField || crcField.value.length !== 4) return false

    const withoutCrc = str.slice(0, -4) // buang 4 karakter value CRC di ujung
    const computedCrc = crc16ccitt(withoutCrc)
    return crcField.value.toUpperCase() === computedCrc
  } catch {
    return false
  }
}

/**
 * Ambil info dasar merchant dari QRIS statis, buat ditampilin sebagai preview
 * konfirmasi pas Owner setup (biar keliatan itu QRIS toko yang bener, bukan
 * ke-upload gambar lain).
 */
export function parseStaticQrisInfo(str) {
  const fields = parseEMV(str)
  const get = (tag) => fields.find((f) => f.tag === tag)?.value ?? null
  return {
    merchantName: get('59'),
    merchantCity: get('60'),
  }
}

/**
 * Fungsi utama: ubah QRIS statis + nominal transaksi -> string QRIS dinamis
 * yang siap di-generate jadi gambar QR buat ditampilin ke pelanggan.
 */
export function generateDynamicQris(staticString, amount) {
  if (!validateStaticQris(staticString)) {
    throw new Error('String QRIS statis toko gak valid atau rusak. Setup ulang QRIS di halaman Akun.')
  }
  const nominal = Math.round(Number(amount))
  if (!nominal || nominal <= 0) {
    throw new Error('Nominal transaksi harus lebih dari 0')
  }

  let fields = parseEMV(staticString)

  // Buang CRC lama — bakal dihitung ulang di akhir karena isi string berubah
  fields = fields.filter((f) => f.tag !== '63')

  // Tag 01: tandain sebagai QRIS dinamis (bukan lagi statis)
  const poiIndex = fields.findIndex((f) => f.tag === '01')
  if (poiIndex !== -1) {
    fields[poiIndex] = { tag: '01', value: '12' }
  } else {
    fields.unshift({ tag: '01', value: '12' })
  }

  // Tag 54: nominal transaksi. Buang dulu kalau kebetulan udah ada, lalu
  // sisipkan di posisi yang sesuai urutan numerik EMV (sebelum tag 58)
  fields = fields.filter((f) => f.tag !== '54')
  let insertAt = fields.findIndex((f) => f.tag === '58')
  if (insertAt === -1) insertAt = fields.length
  fields.splice(insertAt, 0, { tag: '54', value: String(nominal) })

  // Hitung ulang CRC atas seluruh string (termasuk placeholder tag 63 kosong)
  const withoutCrc = buildEMV(fields) + '6304'
  const crc = crc16ccitt(withoutCrc)

  return withoutCrc + crc
}