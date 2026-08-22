'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { addNotification } from '@/lib/notifications'
import { getStoreContext } from '@/lib/getUser'
import { ScanLine, Package, Plus, Minus, RefreshCw } from 'lucide-react'

const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false })

export default function ScanPage() {
  const [showScanner, setShowScanner] = useState(true)
  const [product, setProduct] = useState(null)
  const [notFoundCode, setNotFoundCode] = useState(null)
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  async function handleDetected(code) {
    setShowScanner(false)
    setNotFoundCode(null)
    setProduct(null)

    const { data } = await supabase.from('products').select('*').eq('barcode', code).maybeSingle()
    if (data) {
      setProduct(data)
      setQty(1)
    } else {
      setNotFoundCode(code)
    }
  }

  async function adjustStock(type) {
    if (!product || qty < 1) return
    setLoading(true)

    const ctx = await getStoreContext()
    const { error } = await supabase.from('stock_movements').insert({
      product_id: product.id,
      type,
      quantity: qty,
      unit_price: type === 'out' ? product.price : null,
      movement_date: new Date().toISOString().split('T')[0],
      note: type === 'in' ? 'Update cepat via scan' : 'Terjual',
      user_id: ctx.userId,
      store_id: ctx.storeId,
    })

    setLoading(false)
    if (error) {
      setToast({ type: 'error', text: 'Gagal update stok' })
      return
    }

    addNotification({
      type: type === 'in' ? 'stock_in' : 'stock_out',
      message: `${type === 'in' ? 'Stok ditambah' : 'Stok dikurangi'}: ${product.name} ${type === 'in' ? '+' : '-'}${qty}`,
      link: '/stock',
    })
    setToast({ type: 'success', text: `Stok berhasil di-update` })
    setProduct(p => ({ ...p, stock: type === 'in' ? p.stock + qty : Math.max(0, p.stock - qty) }))
    setQty(1)
  }

  function scanAgain() {
    setProduct(null)
    setNotFoundCode(null)
    setShowScanner(true)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {toast && (
        <div className={`fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg ${toast.type === 'error' ? 'bg-merah-c' : 'bg-daun'}`}>
          {toast.text}
        </div>
      )}

      <div className="text-center mb-4">
        <h1 className="font-bold text-lg text-gray-800 dark:text-gray-100">Scan Produk</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Cek atau update stok cepat lewat kamera</p>
      </div>

      {showScanner && (
        <div className="mb-4">
          <BarcodeScanner
            inline
            onDetected={handleDetected}
            onClose={() => setShowScanner(false)}
          />
        </div>
      )}

      {!showScanner && !product && !notFoundCode && (
        <button
          onClick={() => setShowScanner(true)}
          className="w-full py-4 rounded-2xl bg-terong-soft text-terong-deep font-bold text-sm flex items-center justify-center gap-2"
        >
          <ScanLine size={18} /> Buka Kamera
        </button>
      )}
      {notFoundCode && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Produk tidak ditemukan</p>
          <p className="text-xs text-gray-400 mb-4">Barcode <code>{notFoundCode}</code> belum terdaftar.</p>
          <div className="flex gap-2">
            <a href="/stock" className="flex-1 py-2.5 rounded-xl bg-terong text-white text-sm font-semibold">
              Tambah Produk Baru
            </a>
            <button onClick={scanAgain} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold">
              Scan Lagi
            </button>
          </div>
        </div>
      )}

      {product && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-terong-soft flex items-center justify-center shrink-0 overflow-hidden">
              {product.image_url
                ? <img src={product.image_url} className="w-full h-full object-cover" />
                : <Package size={19} className="text-terong" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">{product.name}</p>
              <p className="text-xs text-gray-400">Stok saat ini: <strong className="text-gray-600 dark:text-gray-300">{product.stock} {product.unit}</strong></p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl py-3 mb-4">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center font-bold text-terong shadow-sm">
              <Minus size={15} />
            </button>
            <span className="font-bold text-lg w-8 text-center">{qty}</span>
            <button onClick={() => setQty(q => q + 1)} className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center font-bold text-terong shadow-sm">
              <Plus size={15} />
            </button>
          </div>

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => adjustStock('out')}
              disabled={loading || qty > product.stock}
              className="flex-1 py-3 rounded-xl bg-merah-c text-white font-bold text-sm disabled:opacity-40"
            >
              − Kurangi Stok
            </button>
            <button
              onClick={() => adjustStock('in')}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-daun text-white font-bold text-sm disabled:opacity-40"
            >
              + Tambah Stok
            </button>
          </div>

          <button onClick={scanAgain} className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300">
            <RefreshCw size={14} /> Scan Produk Lain
          </button>
        </div>
      )}
    </div>
  )
}