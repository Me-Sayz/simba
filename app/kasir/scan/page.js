'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'
import { ScanLine, Package, Plus, Minus, ShoppingCart } from 'lucide-react'

const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false })

export default function KasirScanPage() {
  const { addToCart, itemCount } = useCart()
  const [showScanner, setShowScanner] = useState(true)
  const [pending, setPending] = useState(null) // { product, qty } — belum masuk keranjang
  const [notFoundCode, setNotFoundCode] = useState(null)
  const [toast, setToast] = useState(null)

  function showToast(text) {
    setToast(text)
    setTimeout(() => setToast(null), 2000)
  }

  async function handleDetected(code) {
    setNotFoundCode(null)

    // produk yang lagi ditampilin (dari scan sebelumnya) otomatis
    // ke-commit dulu begitu ada scan produk baru
    if (pending) {
      addToCart(pending.product.id, pending.qty)
      showToast(`✓ ${pending.product.name} otomatis masuk keranjang`)
    }

    const { data } = await supabase.from('products').select('*').eq('barcode', code).maybeSingle()

    if (data) {
      setPending({ product: data, qty: 1 })
    } else {
      setPending(null)
      setNotFoundCode(code)
    }
  }

  function stepQty(delta) {
    setPending(p => p ? { ...p, qty: Math.max(1, p.qty + delta) } : p)
  }

  function confirmAdd() {
    if (!pending) return
    addToCart(pending.product.id, pending.qty)
    showToast(`✓ ${pending.product.name} ditambahkan ke keranjang`)
    setPending(null)
    setNotFoundCode(null)
  }

  function scanAgain() {
    setNotFoundCode(null)
    setShowScanner(true)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {toast && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-terong-deep shadow-lg">
          {toast}
        </div>
      )}

      <div className="text-center mb-4">
        <h1 className="font-bold text-lg text-gray-800 dark:text-gray-100">Scan Barcode</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Arahkan kamera ke barcode produk</p>
      </div>

      {showScanner && (
        <div className="mb-4">
          <BarcodeScanner
            inline
            onDetected={code => { setShowScanner(false); handleDetected(code) }}
            onClose={() => setShowScanner(false)}
          />
        </div>
      )}

      {!showScanner && !pending && !notFoundCode && (
        <button onClick={() => setShowScanner(true)} className="w-full py-4 rounded-2xl bg-terong-soft text-terong-deep font-bold text-sm flex items-center justify-center gap-2">
          <ScanLine size={18} /> Buka Kamera
        </button>
      )}

      {notFoundCode && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Produk tidak ditemukan</p>
          <p className="text-xs text-gray-400 mb-4">Barcode <code>{notFoundCode}</code> belum terdaftar.</p>
          <button onClick={scanAgain} className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold">
            Scan Lagi
          </button>
        </div>
      )}

      {pending && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-daun-soft flex items-center justify-center shrink-0 overflow-hidden">
              {pending.product.image_url
                ? <img src={pending.product.image_url} className="w-full h-full object-cover" />
                : <Package size={19} className="text-daun" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">{pending.product.name}</p>
              <p className="text-xs text-gray-400">Terdeteksi • Stok {pending.product.stock} {pending.product.unit}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl py-3 mb-4">
            <button onClick={() => stepQty(-1)} className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center font-bold text-terong shadow-sm">
              <Minus size={15} />
            </button>
            <span className="font-bold text-lg w-8 text-center">{pending.qty}</span>
            <button onClick={() => stepQty(1)} className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center font-bold text-terong shadow-sm">
              <Plus size={15} />
            </button>
          </div>

          <button onClick={confirmAdd} className="w-full py-3 rounded-xl bg-gradient-to-br from-terong to-terong-deep text-white font-bold text-sm flex items-center justify-center gap-2 mb-2.5">
            <ShoppingCart size={16} /> Selesai, Masukkan ke Keranjang
          </button>
          <button onClick={scanAgain} className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300">
            Scan Produk Lain
          </button>

          <p className="text-[11px] text-gray-400 text-center mt-3">
            Begitu produk lain di-scan, produk ini otomatis masuk keranjang.
          </p>
        </div>
      )}

      {itemCount > 0 && (
        <p className="text-center text-xs text-gray-400 mt-4">🛒 {itemCount} produk di keranjang</p>
      )}
    </div>
  )
}