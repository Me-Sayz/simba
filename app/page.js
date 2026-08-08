'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Package, ArrowDownCircle, ArrowUpCircle, AlertTriangle, TrendingUp, Calendar, ChevronDown, Check } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import NotificationPanel from '@/components/NotificationPanel'

function GaugeArc({ pct, color }) {
  const r = 30, cx = 44, cy = 44
  const toRad = d => (d * Math.PI) / 180
  const startAngle = 180
  const endAngle = 180 + Math.min(pct, 1) * 180
  const x1 = cx + r * Math.cos(toRad(startAngle))
  const y1 = cy + r * Math.sin(toRad(startAngle))
  const x2 = cx + r * Math.cos(toRad(endAngle))
  const y2 = cy + r * Math.sin(toRad(endAngle))
  const largeArc = pct > 0.5 ? 1 : 0
  return (
    <svg viewBox="0 0 88 52" className="w-full">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#e5e7eb" strokeWidth="9" strokeLinecap="round" />
      {pct > 0 && (
        <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
          fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" />
      )}
    </svg>
  )
}

function formatRupiah(val) {
  if (val >= 1_000_000) return `Rp${(val / 1_000_000).toFixed(1)}jt`
  if (val >= 1_000) return `Rp${(val / 1_000).toFixed(0)}rb`
  return `Rp${Math.round(val)}`
}

const presetOptions = [
  { key: 'today', label: 'Hari Ini', icon: '☀️' },
  { key: 'week', label: 'Minggu Ini', icon: '📅' },
  { key: 'month', label: 'Bulan Ini', icon: '🗓️' },
  { key: 'year', label: 'Tahun Ini', icon: '📆' },
  { key: 'all', label: 'Semua Waktu', icon: '🗂️' },
]

export default function Dashboard() {
  const [products, setProducts] = useState([])
  const [recentIn, setRecentIn] = useState([])
  const [recentOut, setRecentOut] = useState([])
  const [chartData, setChartData] = useState([])
  const [profile, setProfile] = useState(null)
  const [preset, setPreset] = useState('month')
  const [presetOpen, setPresetOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [revenue, setRevenue] = useState(0)
  const [totalBeli, setTotalBeli] = useState(0)
  const presetRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (presetRef.current && !presetRef.current.contains(e.target)) setPresetOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => { fetchAll() }, [selectedMonth, preset])
  useEffect(() => { fetchProfile(); fetchChartData() }, [])

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(data)
  }

  async function fetchChartData() {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const key = d.toISOString().slice(0, 7)
      const label = d.toLocaleDateString('id-ID', { month: 'short' })
      months.push({ key, label })
    }
    const result = []
    for (const { key, label } of months) {
      const start = `${key}-01`
      const end = new Date(key + '-01'); end.setMonth(end.getMonth() + 1)
      const endStr = end.toISOString().split('T')[0]
      const { data: inData } = await supabase.from('stock_in').select('quantity').gte('date', start).lt('date', endStr)
      const { data: outData } = await supabase.from('stock_out').select('quantity').gte('date', start).lt('date', endStr)
      result.push({
        label,
        masuk: (inData || []).reduce((s, i) => s + i.quantity, 0),
        keluar: (outData || []).reduce((s, i) => s + i.quantity, 0),
      })
    }
    setChartData(result)
  }

  async function fetchAll() {
    let startDate, endDateStr
    const now = new Date()
    if (preset === 'today') {
      startDate = now.toISOString().split('T')[0]
      const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1)
      endDateStr = tomorrow.toISOString().split('T')[0]
    } else if (preset === 'week') {
      const start = new Date(now); start.setDate(now.getDate() - now.getDay())
      startDate = start.toISOString().split('T')[0]
      const end = new Date(start); end.setDate(start.getDate() + 7)
      endDateStr = end.toISOString().split('T')[0]
    } else if (preset === 'month') {
      startDate = `${selectedMonth}-01`
      const end = new Date(selectedMonth + '-01'); end.setMonth(end.getMonth() + 1)
      endDateStr = end.toISOString().split('T')[0]
    } else if (preset === 'year') {
      const year = now.getFullYear()
      startDate = `${year}-01-01`
      endDateStr = `${year + 1}-01-01`
    } else if (preset === 'all') {
      startDate = '2000-01-01'
      endDateStr = '2100-01-01'
    }

    const { data: productData } = await supabase.from('products').select('*')
    setProducts(productData || [])
    const { data: inData } = await supabase.from('stock_in')
      .select('*, products(name, image_url)')
      .gte('date', startDate).lt('date', endDateStr).order('date', { ascending: false })
    const { data: outData } = await supabase.from('stock_out')
      .select('*, products(name, image_url)')
      .gte('date', startDate).lt('date', endDateStr).order('date', { ascending: false })
    setRecentIn(inData || [])
    setRecentOut(outData || [])
    const rev = (outData || []).reduce((s, i) => s + ((i.price_at_time || 0) * i.quantity), 0)
    const beli = (inData || []).reduce((s, i) => s + ((i.buy_price || 0) * i.quantity), 0)
    setRevenue(rev)
    setTotalBeli(beli)
  }

  const lowStockProducts = products.filter(p => p.stock <= p.min_stock)
  const totalInQty = recentIn.reduce((sum, i) => sum + i.quantity, 0)
  const totalOutQty = recentOut.reduce((sum, i) => sum + i.quantity, 0)
  const profit = revenue - totalBeli
  const totalStok = products.reduce((s, p) => s + (p.stock || 0), 0)
  const turnoverRate = totalStok > 0 ? Math.round((totalOutQty / totalStok) * 100) : 0

  const topProducts = [...recentOut].reduce((acc, cur) => {
    const ex = acc.find(a => a.name === cur.products?.name)
    if (ex) ex.total += cur.quantity
    else acc.push({ name: cur.products?.name, total: cur.quantity, image_url: cur.products?.image_url })
    return acc
  }, []).sort((a, b) => b.total - a.total).slice(0, 5)

  function formatDate(d) {
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Selamat pagi'
    if (h < 15) return 'Selamat siang'
    if (h < 18) return 'Selamat sore'
    return 'Selamat malam'
  }

  const maxRev = Math.max(revenue, 1)
  const maxProfit = Math.max(Math.abs(profit), 1)
  const currentPreset = presetOptions.find(p => p.key === preset)

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">

      {/* Topbar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{greeting()}, {profile?.name || 'Owner'} 👋</h1>
            <p className="text-sm text-gray-400 mt-0.5">Berikut ringkasan stok dan aktivitas tokomu hari ini.</p>
          </div>
          <div className="ml-auto sm:hidden">
            <NotificationPanel mode="mobile" />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:block">
            <NotificationPanel mode="mobile" />
          </div>
          {/* Custom Dropdown */}
          <div className="relative" ref={presetRef}>
            <button
              onClick={() => setPresetOpen(o => !o)}
              className="flex items-center gap-2 min-w-[140px] justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 shadow-sm"
            >
              <span>{currentPreset?.icon}</span>
              <span>{currentPreset?.label}</span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${presetOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`absolute left-0 top-11 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden transition-all duration-200 origin-top
              ${presetOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
              {presetOptions.map(({ key, label, icon }) => (
                <button key={key} onClick={() => { setPreset(key); setPresetOpen(false) }}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors
                    ${preset === key
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  <span>{icon}</span>
                  {label}
                  {preset === key && <Check size={13} className="ml-auto text-blue-500" />}
                </button>
              ))}
            </div>
          </div>

          {preset === 'month' && (
            <div className="flex items-center gap-2 min-w-[140px] justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-sm">
              <Calendar size={13} className="text-gray-400 shrink-0" />
              <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                className="text-sm border-none outline-none bg-transparent text-gray-700 dark:text-gray-200 w-24" />
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-6 max-w-screen-2xl mx-auto">

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {[
            { label: 'Total Produk', value: products.length, unit: 'produk', icon: Package, text: 'text-blue-600', iconBg: 'bg-blue-100 dark:bg-blue-900/60', blobColor: '#3b82f6' },
            { label: 'Stok Menipis', value: lowStockProducts.length, unit: 'produk', icon: AlertTriangle, text: 'text-amber-500', iconBg: 'bg-amber-100 dark:bg-amber-900/60', blobColor: '#f59e0b' },
            { label: 'Masuk Periode Ini', value: totalInQty, unit: 'item', icon: ArrowDownCircle, text: 'text-emerald-600', iconBg: 'bg-emerald-100 dark:bg-emerald-900/60', blobColor: '#10b981' },
            { label: 'Keluar Periode Ini', value: totalOutQty, unit: 'item', icon: ArrowUpCircle, text: 'text-rose-500', iconBg: 'bg-rose-100 dark:bg-rose-900/60', blobColor: '#f43f5e' },
          ].map(({ label, value, unit, icon: Icon, text, iconBg, blobColor }) => (
            <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 overflow-hidden relative">
              <div className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full opacity-10" style={{ background: blobColor }} />
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-10" style={{ background: blobColor }} />
              <div className="flex items-center justify-between mb-4 relative">
                <p className="text-xs font-medium text-gray-400">{label}</p>
                <div className={`${iconBg} p-2 rounded-xl`}><Icon size={15} className={text} /></div>
              </div>
              <p className={`text-4xl font-extrabold relative ${text}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-1.5 relative">{unit}</p>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

          {/* Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100">Tren Stok Masuk & Keluar</h2>
              <span className="text-xs text-gray-400">6 bulan terakhir</span>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-3 h-1.5 rounded-full bg-blue-600 inline-block" /> Stock In</span>
              <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-3 h-1.5 rounded-full bg-blue-300 inline-block" /> Stock Out</span>
            </div>
            <div className="flex-1 min-h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="gMasuk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1d4ed8" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gKeluar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#93c5fd" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#93c5fd" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="masuk" stroke="#1d4ed8" strokeWidth={3} fill="url(#gMasuk)" dot={false} name="Stock In" />
                  <Area type="monotone" dataKey="keluar" stroke="#93c5fd" strokeWidth={3} fill="url(#gKeluar)" dot={false} name="Stock Out" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Produk Terlaris</h2>
                <TrendingUp size={14} className="text-gray-400" />
              </div>
              {topProducts.length === 0
                ? <p className="text-xs text-gray-300 text-center py-3">Belum ada data</p>
                : <div className="flex flex-col gap-2.5">
                    {topProducts.map((p, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {p.image_url
                          ? <img src={p.image_url} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                          : <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0"><Package size={14} className="text-gray-400" /></div>
                        }
                        <p className="flex-1 text-sm text-gray-700 dark:text-gray-200 truncate">{p.name}</p>
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0">{p.total} units</span>
                      </div>
                    ))}
                  </div>
              }
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-4">Performa Periode Ini</h2>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { label: 'Revenue', value: formatRupiah(revenue), pct: revenue / maxRev, color: '#3b82f6', valueColor: 'text-gray-800 dark:text-gray-100' },
                  { label: 'Profit', value: (profit < 0 ? '-' : '') + formatRupiah(Math.abs(profit)), pct: Math.abs(profit) / maxProfit, color: profit < 0 ? '#f43f5e' : '#10b981', valueColor: profit < 0 ? 'text-rose-500' : 'text-gray-800 dark:text-gray-100' },
                  { label: 'Turnover', value: `${turnoverRate}%`, pct: turnoverRate / 100, color: '#8b5cf6', valueColor: 'text-gray-800 dark:text-gray-100' },
                ].map(({ label, value, pct, color, valueColor }) => (
                  <div key={label} className="flex flex-col items-center">
                    <GaugeArc pct={pct} color={color} />
                    <p className={`text-xs font-bold -mt-2 ${valueColor}`}>{value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {lowStockProducts.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Peringatan Stok</h2>
                  <Link href="/stock" className="text-xs text-blue-600 hover:underline">Lihat</Link>
                </div>
                <div className="flex flex-col gap-3">
                  {lowStockProducts.slice(0, 4).map(p => {
                    const pct = Math.round((p.stock / (p.min_stock || 1)) * 100)
                    const barColor = pct <= 25 ? 'bg-rose-500' : pct <= 50 ? 'bg-amber-400' : 'bg-emerald-400'
                    return (
                      <div key={p.id}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-gray-700 dark:text-gray-200 truncate max-w-[140px]">{p.name} (Stok: {p.stock}/{p.min_stock})</p>
                          <Link href="/stock" className="text-xs border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 shrink-0 ml-2">Restock</Link>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                          <div className={`${barColor} h-1.5 rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Barang Masuk Terbaru</h2>
              <Link href="/stock" className="text-xs text-blue-600 hover:underline">Lihat semua</Link>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 dark:border-gray-800">
                  <th className="px-5 py-2.5 text-left text-xs text-gray-400 font-medium">Produk</th>
                  <th className="px-5 py-2.5 text-left text-xs text-gray-400 font-medium">Jumlah</th>
                  <th className="px-5 py-2.5 text-left text-xs text-gray-400 font-medium">Supplier</th>
                  <th className="px-5 py-2.5 text-left text-xs text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentIn.slice(0, 5).map(h => (
                  <tr key={h.id} className="border-t border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-700 dark:text-gray-200 text-sm">{h.products?.name}</td>
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{h.quantity}</td>
                    <td className="px-5 py-3 text-xs text-gray-400">{h.supplier || '-'}</td>
                    <td className="px-5 py-3">
                      <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-medium px-2.5 py-1 rounded-full">Positive</span>
                    </td>
                  </tr>
                ))}
                {recentIn.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-300 text-sm">Belum ada data</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Barang Keluar Terbaru</h2>
              <Link href="/stock" className="text-xs text-blue-600 hover:underline">Lihat semua</Link>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 dark:border-gray-800">
                  <th className="px-5 py-2.5 text-left text-xs text-gray-400 font-medium">Produk</th>
                  <th className="px-5 py-2.5 text-left text-xs text-gray-400 font-medium">Jumlah</th>
                  <th className="px-5 py-2.5 text-left text-xs text-gray-400 font-medium">Tanggal</th>
                  <th className="px-5 py-2.5 text-left text-xs text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOut.slice(0, 5).map(h => (
                  <tr key={h.id} className="border-t border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-700 dark:text-gray-200 text-sm">{h.products?.name}</td>
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{h.quantity}</td>
                    <td className="px-5 py-3 text-xs text-gray-400">{formatDate(h.date)}</td>
                    <td className="px-5 py-3">
                      <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 text-xs font-medium px-2.5 py-1 rounded-full">Negative</span>
                    </td>
                  </tr>
                ))}
                {recentOut.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-300 text-sm">Belum ada data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}