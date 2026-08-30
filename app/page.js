'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getStoreContext } from '@/lib/getUser'
import { Package, ScanLine, Plus, AlertTriangle, TrendingUp, Wallet, Receipt } from 'lucide-react'
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import NotificationPanel from '@/components/NotificationPanel'

function fmtRupiah(n) {
  const v = n || 0
  if (v >= 1_000_000) return `Rp${(v / 1_000_000).toFixed(1)}jt`
  if (v >= 1_000) return `Rp${(v / 1_000).toFixed(0)}rb`
  return `Rp${Math.round(v)}`
}

function greeting() {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
}

const PERIODS = [
  { key: 'today', label: 'Hari Ini' },
  { key: 'week', label: 'Minggu Ini' },
  { key: 'month', label: 'Bulan Ini' },
]

function getPeriodRange(period) {
  const now = new Date()
  if (period === 'today') {
    const start = new Date(now); start.setHours(0, 0, 0, 0)
    return { start, end: now }
  }
  if (period === 'week') {
    const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0)
    return { start, end: now }
  }
  // month
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return { start, end: now }
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 pb-6 animate-pulse">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between gap-3">
        <div>
          <div className="h-5 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-3 w-56 bg-gray-200 dark:bg-gray-800 rounded mt-2.5" />
        </div>
      </div>
      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto">
        <div className="h-10 w-64 bg-terong-soft rounded-2xl mb-5" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-5">
                  <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-800 mb-2.5" />
                  <div className="h-3 w-14 bg-gray-200 dark:bg-gray-800 rounded" />
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded mt-2" />
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 h-[220px]" />
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-gray-200 dark:bg-gray-800 h-[92px]" />
              <div className="rounded-2xl bg-gray-200 dark:bg-gray-800 h-[92px]" />
            </div>
          </div>
          <div className="flex flex-col gap-5">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 h-[180px]" />
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 h-[160px]" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [period, setPeriod] = useState('today')
  const [products, setProducts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => { fetchProfile() }, [])
  useEffect(() => { fetchPeriodData() }, [period])
  useEffect(() => { fetchWeekChart() }, [])

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(data)
    const ctx = await getStoreContext()
    setIsOwner(ctx?.isOwner ?? false)
  }

  async function fetchPeriodData() {
    setLoading(true)
    const { start, end } = getPeriodRange(period)

    const { data: productData } = await supabase.from('products').select('*')
    setProducts(productData || [])

    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
    setTransactions(txData || [])

    // produk terlaris — dari transaction_items yang transaksinya masuk periode ini
    if (txData && txData.length > 0) {
      const txIds = txData.map(t => t.id)
      const { data: items } = await supabase
        .from('transaction_items')
        .select('qty, products(id, name, image_url)')
        .in('transaction_id', txIds)
      const tally = {}
      ;(items || []).forEach(it => {
        if (!it.products) return
        const key = it.products.id
        if (!tally[key]) tally[key] = { name: it.products.name, image_url: it.products.image_url, qty: 0 }
        tally[key].qty += it.qty
      })
      setTopProducts(Object.values(tally).sort((a, b) => b.qty - a.qty).slice(0, 4))
    } else {
      setTopProducts([])
    }

    setLoading(false)
  }

  async function fetchWeekChart() {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0)
      days.push(d)
    }
    const start = days[0]
    const { data: txData } = await supabase
      .from('transactions')
      .select('total_amount, created_at')
      .gte('created_at', start.toISOString())

    const result = days.map(d => {
      const dayEnd = new Date(d); dayEnd.setDate(d.getDate() + 1)
      const total = (txData || [])
        .filter(t => {
          const ts = new Date(t.created_at)
          return ts >= d && ts < dayEnd
        })
        .reduce((s, t) => s + t.total_amount, 0)
      return {
        label: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        total,
        isToday: d.toDateString() === new Date().toDateString(),
      }
    })
    setChartData(result)
  }

  const lowStockProducts = products
    .filter(p => p.stock <= p.min_stock)
    .sort((a, b) => (a.stock / (a.min_stock || 1)) - (b.stock / (b.min_stock || 1)))

  const omzet = transactions.reduce((s, t) => s + t.total_amount, 0)
  const jumlahTransaksi = transactions.length

  if (loading) return <DashboardSkeleton />

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 pb-6">
      {/* Topbar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{greeting()}, {profile?.name || 'Kak'} 👋</h1>
          <p className="text-sm text-gray-400 mt-0.5">Ringkasan stok & aktivitas tokomu.</p>
        </div>
        <NotificationPanel mode="mobile" />
      </div>

      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto">
        {/* Pill switch periode */}
        <div className="flex bg-terong-soft rounded-2xl p-1 max-w-xs mb-5">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${period === p.key ? 'bg-white text-terong-deep shadow-sm' : 'text-terong-deep/60 dark:text-terong-light/60'}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Kolom kiri */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-5">
                <div className="w-9 h-9 rounded-xl bg-daun-soft flex items-center justify-center mb-2.5">
                  <Wallet size={17} className="text-daun dark:text-daun-light" />
                </div>
                <p className="text-xs text-gray-400 font-semibold">Omzet</p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{fmtRupiah(omzet)}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-5">
                <div className="w-9 h-9 rounded-xl bg-terong-soft flex items-center justify-center mb-2.5">
                  <Receipt size={17} className="text-terong dark:text-terong-light" />
                </div>
                <p className="text-xs text-gray-400 font-semibold">Transaksi</p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{jumlahTransaksi}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-5">
                <div className="w-9 h-9 rounded-xl bg-terong-soft flex items-center justify-center mb-2.5">
                  <Package size={17} className="text-terong dark:text-terong-light" />
                </div>
                <p className="text-xs text-gray-400 font-semibold">Total Produk</p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{products.length}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-5">
                <div className="w-9 h-9 rounded-xl bg-amber-soft flex items-center justify-center mb-2.5">
                  <AlertTriangle size={17} className="text-amber-c dark:text-amber-light" />
                </div>
                <p className="text-xs text-gray-400 font-semibold">Stok Menipis</p>
                <p className="text-lg font-bold text-amber-c">{lowStockProducts.length} produk</p>
              </div>
            </div>

            {/* Chart 7 hari */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-4">
                <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Penjualan 7 Hari Terakhir</h2>
                {isOwner && (
                  <Link href="/laporan" className="text-xs font-semibold text-terong dark:text-terong-light hover:underline self-start sm:self-auto">Lihat Laporan Lengkap →</Link>
                )}
              </div>
              <div className="h-[140px] md:h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="28%">
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <Tooltip
                      formatter={(v) => fmtRupiah(v)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px' }}
                    />
                    <Bar dataKey="total" radius={[6, 6, 3, 3]}>
                      {chartData.map((d, i) => (
                        <Cell key={i} fill={d.isToday ? '#5B21B6' : '#EDE6FB'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <Link href="/scan" className="bg-gradient-to-br from-terong to-terong-deep rounded-2xl p-4 flex flex-col gap-2.5 text-white shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <ScanLine size={17} />
                </div>
                <div>
                  <p className="font-bold text-sm">Scan Produk</p>
                  <p className="text-[11px] opacity-80">Cek/update stok cepat</p>
                </div>
              </Link>
              <Link href="/stock" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex flex-col gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-terong-soft flex items-center justify-center">
                  <Plus size={17} className="text-terong dark:text-terong-light" />
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-800 dark:text-gray-100">Tambah Produk</p>
                  <p className="text-[11px] text-gray-400">Daftarkan barang baru</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Kolom kanan */}
          <div className="flex flex-col gap-5">
            {/* Peringatan stok */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">⚠️ Perlu Restock</h2>
                <Link href="/stock" className="text-xs font-semibold text-terong dark:text-terong-light hover:underline">Lihat</Link>
              </div>
              {lowStockProducts.length === 0 ? (
                <p className="text-xs text-gray-300 text-center py-4">Semua stok aman 👍</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {lowStockProducts.slice(0, 4).map(p => {
                    const critical = p.stock <= (p.min_stock || 1) * 0.5
                    return (
                      <div key={p.id} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
                          {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" /> : <Package size={15} className="text-gray-400" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{p.name}</p>
                          <p className="text-[11px] text-gray-400">Sisa {p.stock} {p.unit}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${critical ? 'bg-merah-soft text-merah-c dark:text-merah-light' : 'bg-amber-soft text-amber-c dark:text-amber-light'}`}>
                          {critical ? 'Kritis' : 'Menipis'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Produk terlaris */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Produk Terlaris</h2>
                <TrendingUp size={14} className="text-gray-400" />
              </div>
              {topProducts.length === 0 ? (
                <p className="text-xs text-gray-300 text-center py-4">Belum ada penjualan periode ini</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {topProducts.map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
                        {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" /> : <Package size={13} className="text-gray-400" />}
                      </div>
                      <p className="flex-1 text-xs text-gray-700 dark:text-gray-200 truncate">{p.name}</p>
                      <span className="text-[11px] font-bold text-terong dark:text-terong-light shrink-0">{p.qty} terjual</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}