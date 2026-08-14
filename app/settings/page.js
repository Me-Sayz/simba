'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { syncLowStockNotifs } from '@/lib/notifications'
import { Sliders, Bell, BookOpen, Info, AlertTriangle, Sun, Moon, Monitor, ChevronRight, RotateCcw } from 'lucide-react'

function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  if (!msg) return null
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium text-white ${msg.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
      {msg.text}
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-terong' : 'bg-gray-200 dark:bg-gray-700'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

function SectionHeader({ icon: Icon, title, subtitle, iconBg = 'bg-terong-soft', iconColor = 'text-terong' }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`${iconBg} p-2 rounded-xl`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div>
        <p className="font-semibold text-gray-800 dark:text-gray-100">{title}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [showResetModal, setShowResetModal] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [toast, setToast] = useState(null)
  const [currency, setCurrency] = useState('IDR')
  const [defaultUnit, setDefaultUnit] = useState('pcs')
  const [defaultMinStock, setDefaultMinStock] = useState(5)
  const [useDefaults, setUseDefaults] = useState(false)
  const [notifs, setNotifs] = useState({
    notifLowStock: true,
    notifNewProduct: true,
    notifStockIn: true,
    notifStockOut: true,
  })

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('stok-prefs')
    if (saved) {
      const prefs = JSON.parse(saved)
      setCurrency(prefs.currency || 'IDR')
      setDefaultUnit(prefs.defaultUnit || 'pcs')
      setDefaultMinStock(prefs.defaultMinStock || 5)
      setUseDefaults(prefs.useDefaults || false)
      if (prefs.notifs) setNotifs(prefs.notifs)
    }
  }, [])

  function savePrefs(updates) {
    const current = { currency, defaultUnit, defaultMinStock, notifs }
    const saved = JSON.parse(localStorage.getItem('stok-prefs') || '{}')
    const merged = { ...saved, ...current, ...updates }
    localStorage.setItem('stok-prefs', JSON.stringify(merged))
    setToast({ type: 'success', text: 'Preferensi disimpan' })
  }

  function handleCurrency(val) { setCurrency(val); savePrefs({ currency: val }) }
  function handleUnit(val) { setDefaultUnit(val); savePrefs({ defaultUnit: val }) }
  function handleMinStock(val) {
    const num = parseInt(val) || 0
    setDefaultMinStock(num)
    savePrefs({ defaultMinStock: num })
  }
  function handleUseDefaults(val) {
    setUseDefaults(val)
    savePrefs({ useDefaults: val })
  }
  async function handleNotif(key, val) {
    const updated = { ...notifs, [key]: val }
    setNotifs(updated)
    const saved = JSON.parse(localStorage.getItem('stok-prefs') || '{}')
    localStorage.setItem('stok-prefs', JSON.stringify({ ...saved, notifs: updated }))
    setToast({ type: 'success', text: 'Preferensi disimpan' })

    if (key === 'notifLowStock') {
      if (!val) {
        syncLowStockNotifs(false, [])
      } else {
        const { data } = await supabase.from('products').select('name, stock, min_stock, unit')
        const low = (data || []).filter(p => p.stock <= p.min_stock)
        syncLowStockNotifs(true, low)
      }
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      {showResetModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl p-6">
            <div className="w-12 h-12 bg-amber-soft rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={20} className="text-amber-c" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-center mb-1">Reset ke Default?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">Semua preferensi akan dikembalikan ke pengaturan awal. Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowResetModal(false)}
                className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                Batal
              </button>
              <button onClick={() => {
                setCurrency('IDR')
                setDefaultUnit('pcs')
                setDefaultMinStock(5)
                setUseDefaults(false)
                setNotifs({ notifLowStock: true, notifNewProduct: true, notifStockIn: true, notifStockOut: true })
                setTheme('system')
                localStorage.removeItem('stok-prefs')
                setShowResetModal(false)
                setToast({ type: 'success', text: 'Preferensi berhasil direset ke default' })
              }} className="flex-1 bg-amber-c text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90">
                Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pengaturan</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Kelola preferensi dan pengaturan aplikasi</p>
          </div>
          <button onClick={() => setShowResetModal(true)}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <RotateCcw size={14} /> Reset ke Default
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* PREFERENSI */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <SectionHeader icon={Sliders} title="Preferensi" subtitle="Atur preferensi penggunaan aplikasi" iconBg="bg-terong-soft" iconColor="text-terong" />
              <div className="flex flex-col gap-5">

                {/* Tema */}
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Tema Aplikasi</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Pilih tampilan aplikasi yang nyaman</p>
                  <div className="flex gap-2">
                    {[
                      { key: 'light', label: 'Light', icon: Sun },
                      { key: 'dark', label: 'Dark', icon: Moon },
                      { key: 'system', label: 'System', icon: Monitor },
                    ].map(({ key, label, icon: Icon }) => (
                      <button key={key} onClick={() => setTheme(key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors flex-1 justify-center
                          ${theme === key
                            ? 'bg-terong text-white border-terong'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                        <Icon size={14} /> {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nilai Default Produk */}
                <div className={`border-t border-gray-100 dark:border-gray-800 pt-3 flex flex-col gap-0 transition-opacity ${!useDefaults ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between pb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Nilai Default Produk</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Auto-isi satuan & min stok saat tambah produk</p>
                    </div>
                    <Toggle checked={useDefaults} onChange={handleUseDefaults} />
                  </div>
                  
                  {/* Satuan Default */}
                  <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Satuan Default</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Satuan saat menambah produk baru</p>
                    </div>
                    <select value={defaultUnit} onChange={e => handleUnit(e.target.value)} disabled={!useDefaults}
                      className={`border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 ${!useDefaults ? 'cursor-not-allowed' : ''}`}>
                      {['pcs', 'box', 'kg', 'liter', 'dus', 'lusin'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  
                  {/* Min Stok Default */}
                  <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Minimum Stok Default</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Nilai minimum stok saat tambah produk baru</p>
                    </div>
                    <input type="number" value={defaultMinStock} onChange={e => handleMinStock(e.target.value)} min="0" max="9999"
                      disabled={!useDefaults}
                      className={`border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm w-20 text-center bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 ${!useDefaults ? 'cursor-not-allowed' : ''}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* NOTIFIKASI */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <SectionHeader icon={Bell} title="Notifikasi" subtitle="Atur notifikasi aplikasi" iconBg="bg-amber-soft" iconColor="text-amber-c" />
              <div className="flex flex-col gap-3">
                {[
                  { key: 'notifLowStock', label: 'Stok Menipis', desc: 'Tampilkan peringatan ketika stok mencapai batas minimum' },
                  { key: 'notifNewProduct', label: 'Produk Baru Ditambahkan', desc: 'Notifikasi saat produk baru berhasil ditambahkan' },
                  { key: 'notifStockIn', label: 'Barang Masuk', desc: 'Notifikasi saat transaksi barang masuk berhasil dicatat' },
                  { key: 'notifStockOut', label: 'Barang Keluar', desc: 'Notifikasi saat transaksi barang keluar berhasil dicatat' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-800 rounded-xl">
                    <div className="flex-1 pr-4">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{label}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</p>
                    </div>
                    <Toggle checked={notifs[key]} onChange={val => handleNotif(key, val)} />
                  </div>
                ))}
              </div>
            </div>

            {/* BANTUAN */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <SectionHeader icon={BookOpen} title="Bantuan" subtitle="Butuh bantuan menggunakan aplikasi?" iconBg="bg-terong-soft" iconColor="text-terong" />
              <Link href="/bantuan" className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Pusat Bantuan</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Pelajari cara menggunakan aplikasi SIMBA</p>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </Link>
            </div>

            {/* TENTANG */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <SectionHeader icon={Info} title="Tentang Aplikasi" subtitle="Informasi tentang aplikasi SIMBA" iconBg="bg-slate-50 dark:bg-slate-900" iconColor="text-slate-600" />
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">SIMBA</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Sistem Monitoring Barang</p>
                </div>
                <span className="bg-terong-soft text-terong text-xs font-semibold px-2.5 py-1 rounded-lg">v1.0.0</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Dibuat dengan</p>
              <div className="flex items-center gap-4 flex-wrap">
                {[
                  { label: 'Next.js', bg: 'bg-black', text: 'text-white', letter: 'N' },
                  { label: 'Tailwind CSS', bg: 'bg-teal-500', text: 'text-white', letter: 'T' },
                  { label: 'Supabase', bg: 'bg-emerald-600', text: 'text-white', letter: 'S' },
                ].map(({ label, bg, text, letter }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`${bg} ${text} text-xs font-bold w-6 h-6 rounded-md flex items-center justify-center shrink-0`}>{letter}</div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}