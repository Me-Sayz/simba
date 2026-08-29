'use client'
import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { getStoreContext } from '@/lib/getUser'
import { extractReason } from '@/lib/stockReason'
import AccessDenied from '@/components/AccessDenied'
import { FileDown, TrendingUp, TrendingDown, Package, ArrowDownCircle, ArrowUpCircle, DollarSign, ChevronDown, Check } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const ITEMS_PER_PAGE = 10

const REASON_COLORS = {
  'Terjual': '#10b981',
  'Rusak': '#f97316',
  'Kadaluarsa': '#f43f5e',
  'Retur': '#3b82f6',
  'Hilang': '#8b5cf6',
  'Lainnya': '#9ca3af',
}

function getDateRange(preset) {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  switch (preset) {
    case 'today': return { from: today, to: today }
    case 'week': {
      const d = new Date(now); d.setDate(d.getDate() - d.getDay())
      return { from: d.toISOString().split('T')[0], to: today }
    }
    case 'month': return { from: `${today.slice(0, 7)}-01`, to: today }
    case 'year': return { from: `${today.slice(0, 4)}-01-01`, to: today }
    default: return { from: '', to: '' }
  }
}

function formatRp(n) { return `Rp ${Number(n || 0).toLocaleString('id-ID')}` }
function formatDate(str) {
  if (!str) return '-'
  return new Date(str).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const presetOptions = [
  { key: 'today', label: 'Hari Ini', icon: '☀️' },
  { key: 'week', label: 'Minggu Ini', icon: '📅' },
  { key: 'month', label: 'Bulan Ini', icon: '🗓️' },
  { key: 'year', label: 'Tahun Ini', icon: '📆' },
  { key: 'custom', label: 'Custom', icon: '✏️' },
]

export default function LaporanPage() {
  const [products, setProducts] = useState([])
  const [stockIn, setStockIn] = useState([])
  const [stockOut, setStockOut] = useState([])
  const [loading, setLoading] = useState(true)
  const [preset, setPreset] = useState('month')
  const [presetOpen, setPresetOpen] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [txFilter, setTxFilter] = useState('all')
  const [txPage, setTxPage] = useState(1)
  const [exporting, setExporting] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const presetRef = useRef(null)
  const exportRef = useRef(null)
  const reportRef = useRef(null)
  const [access, setAccess] = useState('checking') // 'checking' | 'granted' | 'denied'

  useEffect(() => {
    getStoreContext().then(ctx => setAccess(ctx?.isOwner ? 'granted' : 'denied'))
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (presetRef.current && !presetRef.current.contains(e.target)) setPresetOpen(false)
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => { if (access === 'granted') fetchAll() }, [preset, dateFrom, dateTo, access])

  function getRange() {
    if (preset === 'custom') return { from: dateFrom, to: dateTo }
    return getDateRange(preset)
  }

  async function fetchAll() {
    setLoading(true)
    const { from, to } = getRange()
    const { data: productData } = await supabase.from('products').select('*')
    setProducts(productData || [])

    let inQuery = supabase.from('stock_movements').select('*, products(name, unit, barcode, image_url, category, price)').eq('type', 'in').order('created_at', { ascending: false })
    let outQuery = supabase.from('stock_movements').select('*, products(name, unit, barcode, image_url, category)').eq('type', 'out').order('created_at', { ascending: false })

    if (from) { inQuery = inQuery.gte('movement_date', from); outQuery = outQuery.gte('movement_date', from) }
    if (to) { inQuery = inQuery.lte('movement_date', to); outQuery = outQuery.lte('movement_date', to) }

    const [{ data: inData }, { data: outData }] = await Promise.all([inQuery, outQuery])
    setStockIn(inData || [])
    setStockOut(outData || [])
    setLoading(false)
  }

  function handlePreset(val) {
    setPreset(val)
    setShowCustom(val === 'custom')
    if (val !== 'custom') { setDateFrom(''); setDateTo('') }
  }

  const totalProducts = products.length
  const totalStockValue = products.reduce((s, p) => s + (p.stock * p.price), 0)
  const totalInQty = stockIn.reduce((s, i) => s + i.quantity, 0)
  const totalInValue = stockIn.reduce((s, i) => s + (i.quantity * (i.unit_price || 0)), 0)
  const totalOutQty = stockOut.reduce((s, o) => s + o.quantity, 0)
  const totalOutValue = stockOut.reduce((s, o) => s + (o.quantity * o.unit_price), 0)
  const estimasiKeuntungan = totalOutValue - totalInValue

  const chartData = (() => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const key = d.toISOString().slice(0, 7)
      const label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
      const masuk = stockIn.filter(h => h.movement_date?.startsWith(key)).reduce((s, h) => s + h.quantity, 0)
      const keluar = stockOut.filter(h => h.movement_date?.startsWith(key)).reduce((s, h) => s + h.quantity, 0)
      months.push({ label, masuk, keluar })
    }
    return months
  })()

  const topProducts = (() => {
    const map = {}
    stockOut.forEach(o => {
      const key = o.product_id
      if (!map[key]) map[key] = { name: o.products?.name, image: o.products?.image_url, barcode: o.products?.barcode, qty: 0, value: 0 }
      map[key].qty += o.quantity
      map[key].value += o.quantity * o.unit_price
    })
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 5)
  })()
  const totalOutQtyAll = topProducts.reduce((s, p) => s + p.qty, 0)

  const reasonSummary = (() => {
    const map = {}
    stockOut.forEach(o => {
      const r = extractReason(o.note)
      if (!map[r]) map[r] = { qty: 0, value: 0 }
      map[r].qty += o.quantity
      map[r].value += o.quantity * o.unit_price
    })
    return Object.entries(map).map(([reason, data]) => ({
      reason, ...data,
      pct: totalOutQty ? ((data.qty / totalOutQty) * 100).toFixed(1) : 0
    })).sort((a, b) => b.qty - a.qty)
  })()

  const topProduct = topProducts[0]
  const topLoss = reasonSummary.find(r => r.reason === 'Kadaluarsa' || r.reason === 'Rusak')
  const topCategory = (() => {
    const map = {}
    stockOut.forEach(o => {
      const cat = o.products?.category || 'Lainnya'
      if (!map[cat]) map[cat] = 0
      map[cat] += o.quantity
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]
  })()

  const combined = [
    ...stockIn.map(i => ({ ...i, type: 'masuk', productName: i.products?.name, productImage: i.products?.image_url, productBarcode: i.products?.barcode, unit: i.products?.unit, price: i.unit_price || 0, keterangan: i.note || i.supplier || '-' })),
    ...stockOut.map(o => ({ ...o, type: 'keluar', productName: o.products?.name, productImage: o.products?.image_url, productBarcode: o.products?.barcode, unit: o.products?.unit, price: o.unit_price, keterangan: o.note || '-' }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const txFiltered = txFilter === 'all' ? combined : combined.filter(t => t.type === txFilter)
  const txTotalPage = Math.ceil(txFiltered.length / ITEMS_PER_PAGE)
  const txPaginated = txFiltered.slice((txPage - 1) * ITEMS_PER_PAGE, txPage * ITEMS_PER_PAGE)

  function getTxPaginationPages() {
    const pages = []
    for (let i = 1; i <= txTotalPage; i++) {
      if (i === 1 || i === txTotalPage || Math.abs(i - txPage) <= 1) pages.push(i)
      else if (pages[pages.length - 1] !== '...') pages.push('...')
    }
    return pages
  }

  async function handleExportPDF() {
    setExportMenuOpen(false)
    setExporting(true)
    try {
      const { exportLaporanPDF } = await import('@/lib/exportPDF')
      const html2canvas = (await import('html2canvas')).default
      const chartLineEl = document.getElementById('pdf-chart-line')
      const lineCanvas = await html2canvas(chartLineEl, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
      await exportLaporanPDF({
        products, stockIn, stockOut, dateFrom, dateTo, preset,
        chartLineImg: lineCanvas.toDataURL('image/png'),
      })
    } catch (err) {
      console.error(err)
    }
    setExporting(false)
  }

  async function handleExportExcel() {
    setExportMenuOpen(false)
    setExporting(true)
    try {
      const { exportLaporanExcel } = await import('@/lib/exportExcel')
      await exportLaporanExcel({ products, stockIn, stockOut, dateFrom, dateTo })
    } catch (err) {
      console.error(err)
    }
    setExporting(false)
  }

  const currentPreset = presetOptions.find(p => p.key === preset)

  if (access === 'checking') return null
  if (access === 'denied') return <AccessDenied message="Laporan cuma bisa diakses oleh Owner toko." />

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <div className="px-4 md:px-6 py-6 max-w-8xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Laporan</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Analisis dan ringkasan data inventaris bisnis Anda</p>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative" ref={presetRef}>
              <button
                onClick={() => setPresetOpen(o => !o)}
                className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 shadow-sm"
              >
                <span>{currentPreset?.icon}</span>
                <span>{currentPreset?.label}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${presetOpen ? 'rotate-180' : ''}`} />
              </button>

              <div className={`absolute left-0 top-11 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden transition-all duration-200 origin-top
                ${presetOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                {presetOptions.map(({ key, label, icon }) => (
                  <button key={key} onClick={() => { handlePreset(key); setPresetOpen(false) }}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors
                      ${preset === key
                        ? 'bg-terong-soft text-terong-deep dark:text-terong-light font-medium'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                    <span>{icon}</span>
                    {label}
                    {preset === key && <Check size={13} className="ml-auto text-terong" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Date picker inline, menyatu di sebelah dropdown */}
            {preset === 'custom' && (
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-sm">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="text-sm border-none outline-none bg-transparent text-gray-700 dark:text-gray-200 w-32"
                />
                <span className="text-gray-300 dark:text-gray-600">—</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="text-sm border-none outline-none bg-transparent text-gray-700 dark:text-gray-200 w-32"
                />
              </div>
            )}

            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setExportMenuOpen(v => !v)}
                disabled={exporting}
                className="flex items-center gap-2 bg-terong text-white text-sm px-4 py-2 rounded-xl hover:opacity-90 font-medium disabled:opacity-60 shadow-sm active:scale-95 transition-all"
              >
                <FileDown size={15} /> {exporting ? 'Exporting...' : 'Export'}
                <ChevronDown size={14} className={`transition-transform duration-200 ${exportMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`absolute right-0 mt-2 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg z-20 overflow-hidden origin-top-right transition-all duration-150
                ${exportMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                <button
                  onClick={handleExportPDF}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                >
                  <FileDown size={14} /> Export PDF
                </button>
                <button
                  onClick={handleExportExcel}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 text-left border-t border-gray-100 dark:border-gray-800"
                >
                  <FileDown size={14} /> Export Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        <div ref={reportRef}>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-terong-soft rounded-2xl p-4">
              <div className="bg-white dark:bg-gray-900 w-9 h-9 rounded-xl flex items-center justify-center mb-3">
                <Package size={16} className="text-terong" />
              </div>
              <p className="text-xs text-terong-deep/70 dark:text-terong-light/70 mb-1">Total Produk Aktif</p>
              <p className="text-xl font-bold text-terong-deep dark:text-terong-light leading-tight">{totalProducts}</p>
              <p className="text-xs text-terong-deep/60 dark:text-terong-light/60 mt-0.5">produk</p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/40 rounded-2xl p-4">
              <div className="bg-purple-100 dark:bg-purple-900/60 w-9 h-9 rounded-xl flex items-center justify-center mb-3">
                <DollarSign size={16} className="text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-xs text-purple-500 dark:text-purple-400 mb-1">Total Nilai Stok</p>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-300 leading-tight">{formatRp(totalStockValue)}</p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl p-4">
              <div className="bg-emerald-100 dark:bg-emerald-900/60 w-9 h-9 rounded-xl flex items-center justify-center mb-3">
                <ArrowDownCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Barang Masuk</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 leading-tight">{totalInQty}</p>
              <p className="text-xs text-emerald-500 dark:text-emerald-500 mt-0.5">pcs · {formatRp(totalInValue)}</p>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 rounded-2xl p-4">
              <div className="bg-rose-100 dark:bg-rose-900/60 w-9 h-9 rounded-xl flex items-center justify-center mb-3">
                <ArrowUpCircle size={16} className="text-rose-500 dark:text-rose-400" />
              </div>
              <p className="text-xs text-rose-500 dark:text-rose-400 mb-1">Barang Keluar</p>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-300 leading-tight">{totalOutQty}</p>
              <p className="text-xs text-rose-400 dark:text-rose-500 mt-0.5">pcs · {formatRp(totalOutValue)}</p>
            </div>

            <div className={`${estimasiKeuntungan >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-rose-50 dark:bg-rose-950/40'} rounded-2xl p-4`}>
              <div className={`${estimasiKeuntungan >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/60' : 'bg-rose-100 dark:bg-rose-900/60'} w-9 h-9 rounded-xl flex items-center justify-center mb-3`}>
                {estimasiKeuntungan >= 0
                  ? <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
                  : <TrendingDown size={16} className="text-rose-500 dark:text-rose-400" />
                }
              </div>
              <p className={`text-xs mb-1 ${estimasiKeuntungan >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>Estimasi Keuntungan</p>
              <p className={`text-lg font-bold leading-tight ${estimasiKeuntungan >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>{formatRp(estimasiKeuntungan)}</p>
            </div>
          </div>

          {/* Chart + Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-gray-800 dark:text-gray-100">Barang Masuk vs Barang Keluar</h2>
                <span className="text-xs text-gray-400">6 bulan terakhir</span>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-3 h-1.5 rounded-full bg-daun inline-block" /> Masuk</span>
                <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-3 h-1.5 rounded-full bg-merah-c inline-block" /> Keluar</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="gMasuk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gKeluar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#DC2626" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#DC2626" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="masuk" stroke="#059669" strokeWidth={3} fill="url(#gMasuk)" dot={false} name="Masuk (pcs)" />
                  <Area type="monotone" dataKey="keluar" stroke="#DC2626" strokeWidth={3} fill="url(#gKeluar)" dot={false} name="Keluar (pcs)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Produk Terlaris</h2>
              {topProducts.length === 0 && <p className="text-gray-300 text-sm text-center py-8">Belum ada data</p>}
              <div className="flex flex-col gap-3">
                {topProducts.map((p, i) => (
                  <div key={p.name || i} className="flex items-center gap-3">
                    <span className={`text-xs font-bold w-5 text-center ${i === 0 ? 'text-amber-500' : 'text-gray-400'}`}>{i + 1}</span>
                    {p.image
                      ? <img src={p.image} className="w-8 h-8 rounded-lg object-cover shrink-0" alt={p.name} />
                      : <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0"><Package size={12} className="text-gray-400" /></div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                          <div className="bg-terong h-1.5 rounded-full" style={{ width: `${totalOutQtyAll ? (p.qty / totalOutQtyAll * 100) : 0}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{totalOutQtyAll ? (p.qty / totalOutQtyAll * 100).toFixed(1) : 0}%</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 font-semibold px-2 py-0.5 rounded-full">{p.qty} pcs</span>
                      <p className="text-xs text-gray-400 mt-0.5">{formatRp(p.value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reason + Insight */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Ringkasan per Alasan Keluar</h2>
              {reasonSummary.length === 0 && <p className="text-gray-300 text-sm text-center py-8">Belum ada data</p>}
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {reasonSummary.length > 0 && (
                  <PieChart width={160} height={160}>
                    <Pie data={reasonSummary} dataKey="qty" nameKey="reason" cx="50%" cy="50%" innerRadius={45} outerRadius={75}>
                      {reasonSummary.map((entry) => (
                        <Cell key={entry.reason} fill={REASON_COLORS[entry.reason] || '#9ca3af'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v} pcs`, n]} />
                  </PieChart>
                )}
                <div className="flex-1 flex flex-col gap-2">
                  {reasonSummary.map((r) => (
                    <div key={r.reason} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: REASON_COLORS[r.reason] || '#9ca3af' }} />
                        <span className="text-gray-700 dark:text-gray-300">{r.reason}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-gray-800 dark:text-gray-100">{r.qty} pcs</span>
                        <span className="text-gray-400 ml-1">({r.pct}%)</span>
                      </div>
                    </div>
                  ))}
                  {reasonSummary.length > 0 && (
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-2 flex justify-between text-sm font-semibold text-gray-800 dark:text-gray-100">
                      <span>Total</span>
                      <span>{totalOutQty} pcs · {formatRp(totalOutValue)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Insight Cepat</h2>
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
                  <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Produk paling laku</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{topProduct?.name || '-'}</p>
                    {topProduct && <p className="text-xs text-gray-400">{topProduct.qty} pcs keluar</p>}
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl">
                  <TrendingDown size={18} className="text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Kerugian terbesar</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{topLoss?.reason || '-'}</p>
                    {topLoss && <p className="text-xs text-gray-400">{formatRp(topLoss.value)}</p>}
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-terong-soft rounded-xl">
                  <Package size={18} className="text-terong shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Kategori terlaris</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{topCategory?.[0] || '-'}</p>
                    {topCategory && <p className="text-xs text-gray-400">{topCategory[1]} pcs dari total keluar</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Riwayat Transaksi */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-5">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100">Riwayat Transaksi</h2>
              <div className="flex gap-2">
                {['all', 'masuk', 'keluar'].map(f => (
                  <button key={f} onClick={() => { setTxFilter(f); setTxPage(1) }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      txFilter === f
                        ? f === 'masuk' ? 'bg-emerald-600 text-white'
                          : f === 'keluar' ? 'bg-rose-500 text-white'
                          : 'bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900'
                        : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}>
                    {f === 'all' ? 'Semua' : f === 'masuk' ? 'Masuk' : 'Keluar'}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 text-left">Tanggal</th>
                    <th className="px-5 py-3 text-left">Jenis</th>
                    <th className="px-5 py-3 text-left">Produk</th>
                    <th className="px-5 py-3 text-left">Jumlah</th>
                    <th className="px-5 py-3 text-left">Harga Satuan</th>
                    <th className="px-5 py-3 text-left">Total</th>
                    <th className="px-5 py-3 text-left">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                      {[...Array(7)].map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></td>)}
                    </tr>
                  ))}
                  {!loading && txPaginated.map((t) => (
                    <tr key={t.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">{formatDate(t.created_at)}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${t.type === 'masuk' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400'}`}>
                          {t.type === 'masuk' ? 'Masuk' : 'Keluar'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {t.productImage
                            ? <img src={t.productImage} className="w-8 h-8 rounded-lg object-cover shrink-0" alt={t.productName} />
                            : <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0"><Package size={12} className="text-gray-400" /></div>
                          }
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-100">{t.productName}</p>
                            <p className="text-xs text-gray-400 font-mono">{t.productBarcode || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${t.type === 'masuk' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400'}`}>
                          {t.type === 'masuk' ? '+' : '-'}{t.quantity} {t.unit}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{formatRp(t.price)}</td>
                      <td className="px-5 py-3 font-semibold text-gray-800 dark:text-gray-100">{formatRp(t.quantity * t.price)}</td>
                      <td className="px-5 py-3 text-gray-400 text-sm max-w-32 truncate">{t.keterangan}</td>
                    </tr>
                  ))}
                  {!loading && txPaginated.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-300 text-sm">Belum ada transaksi</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden flex flex-col gap-3 p-4">
              {txPaginated.map((t) => (
                <div key={t.id} className="border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {t.productImage
                        ? <img src={t.productImage} className="w-10 h-10 rounded-xl object-cover shrink-0" alt={t.productName} />
                        : <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0"><Package size={14} className="text-gray-400" /></div>
                      }
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{t.productName}</p>
                        <p className="text-xs text-gray-400 font-mono">{t.productBarcode || '-'}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${t.type === 'masuk' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400'}`}>
                      {t.type === 'masuk' ? 'Masuk' : 'Keluar'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className={`font-semibold ${t.type === 'masuk' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                      {t.type === 'masuk' ? '+' : '-'}{t.quantity} {t.unit}
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">{formatRp(t.quantity * t.price)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{formatDate(t.created_at)}</span>
                    <span>{t.keterangan}</span>
                  </div>
                </div>
              ))}
              {txPaginated.length === 0 && <p className="text-center text-gray-300 text-sm py-8">Belum ada transaksi</p>}
            </div>

            {txTotalPage > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-400">
                  Menampilkan {(txPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(txPage * ITEMS_PER_PAGE, txFiltered.length)} dari {txFiltered.length}
                </p>
                <div className="flex gap-1 items-center">
                  <button onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed">
                    Previous
                  </button>
                  {getTxPaginationPages().map((n, i) =>
                    n === '...'
                      ? <span key={`dots-${i}`} className="px-2 text-gray-400 text-sm">...</span>
                      : <button key={n} onClick={() => setTxPage(n)}
                          className={`w-8 h-8 rounded-lg text-sm ${txPage === n ? 'bg-terong text-white font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                          {n}
                        </button>
                  )}
                  <button onClick={() => setTxPage(p => Math.min(txTotalPage, p + 1))} disabled={txPage === txTotalPage}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed">
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Hidden charts for PDF export */}
      <div className="fixed -left-[9999px] -top-[9999px]">
        <div id="pdf-chart-line" style={{ width: 500, height: 220, background: 'white', padding: 16 }}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="pdf-gMasuk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="pdf-gKeluar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#DC2626" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#DC2626" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="masuk" stroke="#059669" strokeWidth={3} fill="url(#pdf-gMasuk)" dot={false} name="Masuk (pcs)" />
              <Area type="monotone" dataKey="keluar" stroke="#DC2626" strokeWidth={3} fill="url(#pdf-gKeluar)" dot={false} name="Keluar (pcs)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}