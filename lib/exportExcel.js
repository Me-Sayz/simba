import ExcelJS from 'exceljs'
import { extractReason } from './stockReason'

// Data & perhitungan di sini disamakan persis dengan lib/exportPDF.js & halaman
// Laporan — biar angka gak beda antar format.

const TERONG = 'FF5B21B6'
const WHITE = 'FFFFFFFF'
const BORDER = { style: 'thin', color: { argb: 'FFE5E7EB' } }
const CURRENCY_FMT = '"Rp" #,##0'

const REASON_COLORS = {
  Terjual: 'FF10B981',
  Rusak: 'FFF97316',
  Kadaluarsa: 'FFF43F5E',
  Retur: 'FF3B82F6',
  Hilang: 'FF8B5CF6',
  Lainnya: 'FF9CA3AF',
}

function fdate(str) {
  if (!str) return '-'
  return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function styleHeaderRow(row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: WHITE } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TERONG } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER }
  })
  row.height = 22
}

function styleDataRow(row, idx) {
  row.eachCell((cell) => {
    cell.border = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER }
    if (idx % 2 === 0) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }
    }
  })
}

function triggerDownload(buffer, filename) {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function exportLaporanExcel({ products, stockIn, stockOut, dateFrom, dateTo }) {
  const totalProducts = products.length
  const totalStockValue = products.reduce((s, p) => s + (p.stock * p.price), 0)
  const totalInQty = stockIn.reduce((s, i) => s + i.quantity, 0)
  const totalInValue = stockIn.reduce((s, i) => s + (i.quantity * (i.unit_price || 0)), 0)
  const totalOutQty = stockOut.reduce((s, o) => s + o.quantity, 0)
  const totalOutValue = stockOut.reduce((s, o) => s + (o.quantity * o.unit_price), 0)
  const estimasi = totalOutValue - totalInValue

  const topMap = {}
  stockOut.forEach((o) => {
    const k = o.product_id
    if (!topMap[k]) topMap[k] = { name: o.products?.name || '-', qty: 0, value: 0 }
    topMap[k].qty += o.quantity
    topMap[k].value += o.quantity * o.unit_price
  })
  const topProducts = Object.values(topMap).sort((a, b) => b.qty - a.qty)

  const reasonMap = {}
  stockOut.forEach((o) => {
    const r = extractReason(o.note)
    if (!reasonMap[r]) reasonMap[r] = { qty: 0, value: 0 }
    reasonMap[r].qty += o.quantity
    reasonMap[r].value += o.quantity * o.unit_price
  })
  const reasonSummary = Object.entries(reasonMap)
    .map(([reason, data]) => ({
      reason, ...data,
      pct: totalOutQty ? Number(((data.qty / totalOutQty) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.qty - a.qty)

  const periodLabel = dateFrom && dateTo ? `${fdate(dateFrom)} - ${fdate(dateTo)}` : 'Semua periode'

  const wb = new ExcelJS.Workbook()
  wb.creator = 'SIMBA'
  wb.created = new Date()

  // ===== Sheet 1: Ringkasan =====
  const wsRingkasan = wb.addWorksheet('Ringkasan')
  wsRingkasan.columns = [{ width: 28 }, { width: 22 }]

  const titleRow = wsRingkasan.addRow(['Laporan SIMBA'])
  wsRingkasan.mergeCells('A1:B1')
  titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: TERONG } }
  titleRow.height = 26

  wsRingkasan.addRow(['Periode', periodLabel])
  wsRingkasan.addRow(['Digenerate', fdate(new Date().toISOString())])
  wsRingkasan.addRow([])

  styleHeaderRow(wsRingkasan.addRow(['Ringkasan', 'Nilai']))

  const summaryData = [
    ['Total Produk', totalProducts, false],
    ['Total Nilai Stok', totalStockValue, true],
    ['Total Barang Masuk (Qty)', totalInQty, false],
    ['Total Nilai Masuk', totalInValue, true],
    ['Total Barang Keluar (Qty)', totalOutQty, false],
    ['Total Nilai Keluar', totalOutValue, true],
    ['Estimasi Untung/Rugi', estimasi, true],
  ]
  summaryData.forEach(([label, value, isCurrency], idx) => {
    const row = wsRingkasan.addRow([label, value])
    styleDataRow(row, idx)
    row.getCell(2).alignment = { horizontal: 'right' }
    if (isCurrency) row.getCell(2).numFmt = CURRENCY_FMT
    if (label === 'Estimasi Untung/Rugi') {
      row.getCell(2).font = { bold: true, color: { argb: estimasi >= 0 ? 'FF059669' : 'FFDC2626' } }
    }
  })

  // ===== Sheet 2: Stok Masuk =====
  const wsIn = wb.addWorksheet('Stok Masuk')
  wsIn.columns = [
    { header: 'Tanggal', key: 'tanggal', width: 16 },
    { header: 'Produk', key: 'produk', width: 28 },
    { header: 'Satuan', key: 'satuan', width: 10 },
    { header: 'Qty', key: 'qty', width: 8 },
    { header: 'Harga Beli', key: 'harga', width: 14 },
    { header: 'Total', key: 'total', width: 14 },
    { header: 'Supplier/Catatan', key: 'ket', width: 26 },
  ]
  styleHeaderRow(wsIn.getRow(1))
  wsIn.views = [{ state: 'frozen', ySplit: 1 }]
  stockIn.forEach((i, idx) => {
    const row = wsIn.addRow({
      tanggal: fdate(i.created_at),
      produk: i.products?.name || '-',
      satuan: i.products?.unit || '',
      qty: i.quantity,
      harga: i.unit_price || 0,
      total: i.quantity * (i.unit_price || 0),
      ket: i.note || i.supplier || '-',
    })
    styleDataRow(row, idx)
    row.getCell('harga').numFmt = CURRENCY_FMT
    row.getCell('total').numFmt = CURRENCY_FMT
    row.getCell('qty').alignment = { horizontal: 'center' }
  })

  // ===== Sheet 3: Stok Keluar =====
  const wsOut = wb.addWorksheet('Stok Keluar')
  wsOut.columns = [
    { header: 'Tanggal', key: 'tanggal', width: 16 },
    { header: 'Produk', key: 'produk', width: 28 },
    { header: 'Satuan', key: 'satuan', width: 10 },
    { header: 'Qty', key: 'qty', width: 8 },
    { header: 'Harga Jual', key: 'harga', width: 14 },
    { header: 'Total', key: 'total', width: 14 },
    { header: 'Alasan', key: 'alasan', width: 14 },
    { header: 'Catatan', key: 'catatan', width: 24 },
  ]
  styleHeaderRow(wsOut.getRow(1))
  wsOut.views = [{ state: 'frozen', ySplit: 1 }]
  stockOut.forEach((o, idx) => {
    const reason = extractReason(o.note)
    const row = wsOut.addRow({
      tanggal: fdate(o.created_at),
      produk: o.products?.name || '-',
      satuan: o.products?.unit || '',
      qty: o.quantity,
      harga: o.unit_price,
      total: o.quantity * o.unit_price,
      alasan: reason,
      catatan: o.note || '-',
    })
    styleDataRow(row, idx)
    row.getCell('harga').numFmt = CURRENCY_FMT
    row.getCell('total').numFmt = CURRENCY_FMT
    row.getCell('qty').alignment = { horizontal: 'center' }
    row.getCell('alasan').alignment = { horizontal: 'center' }
    row.getCell('alasan').font = { bold: true, color: { argb: REASON_COLORS[reason] || REASON_COLORS.Lainnya } }
  })

  // ===== Sheet 4: Produk Terlaris =====
  const wsTop = wb.addWorksheet('Produk Terlaris')
  wsTop.columns = [
    { header: 'Peringkat', key: 'rank', width: 10 },
    { header: 'Produk', key: 'produk', width: 30 },
    { header: 'Qty Terjual', key: 'qty', width: 14 },
    { header: 'Total Nilai', key: 'total', width: 16 },
  ]
  styleHeaderRow(wsTop.getRow(1))
  topProducts.forEach((p, idx) => {
    const row = wsTop.addRow({ rank: idx + 1, produk: p.name, qty: p.qty, total: p.value })
    styleDataRow(row, idx)
    row.getCell('total').numFmt = CURRENCY_FMT
    row.getCell('rank').alignment = { horizontal: 'center' }
    row.getCell('qty').alignment = { horizontal: 'center' }
    if (idx === 0) row.eachCell((cell) => { cell.font = { ...cell.font, bold: true } })
  })

  // ===== Sheet 5: Rekap Alasan Keluar =====
  const wsReason = wb.addWorksheet('Alasan Keluar')
  wsReason.columns = [
    { header: 'Alasan', key: 'alasan', width: 16 },
    { header: 'Qty', key: 'qty', width: 10 },
    { header: 'Total Nilai', key: 'total', width: 16 },
    { header: 'Persentase', key: 'pct', width: 14 },
  ]
  styleHeaderRow(wsReason.getRow(1))
  reasonSummary.forEach((r, idx) => {
    const row = wsReason.addRow({ alasan: r.reason, qty: r.qty, total: r.value, pct: r.pct / 100 })
    styleDataRow(row, idx)
    row.getCell('total').numFmt = CURRENCY_FMT
    row.getCell('pct').numFmt = '0.0%'
    row.getCell('qty').alignment = { horizontal: 'center' }
    row.getCell('alasan').font = { bold: true, color: { argb: REASON_COLORS[r.reason] || REASON_COLORS.Lainnya } }
  })

  const buffer = await wb.xlsx.writeBuffer()
  const slug = dateFrom && dateTo ? `${dateFrom}_${dateTo}` : 'semua'
  triggerDownload(buffer, `laporan-simba-${slug}.xlsx`)
}