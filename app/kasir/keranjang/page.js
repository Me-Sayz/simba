'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'
import { ShoppingCart, X, Trash2 } from 'lucide-react'

function fmt(n) {
  return 'Rp ' + (n || 0).toLocaleString('id-ID')
}

export default function KasirKeranjangPage() {
  const { cart, addToCart, removeFromCart, clearCart } = useCart()
  const [products, setProducts] = useState({}) // { id: product }
  const [fetching, setFetching] = useState(true)
  const [showPayModal, setShowPayModal] = useState(false)
  const [payment, setPayment] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null) // { type: 'single', id } | { type: 'all' }
  const router = useRouter()

  const cartIds = Object.keys(cart)

  useEffect(() => {
    if (cartIds.length === 0) { setProducts({}); setFetching(false); return }
    fetchProducts()
  }, [cartIds.join(',')])

  async function fetchProducts() {
    setFetching(true)
    const { data } = await supabase.from('products').select('*').in('id', cartIds)
    const map = {}
    ;(data || []).forEach(p => { map[p.id] = p })
    setProducts(map)
    setFetching(false)
  }

  const entries = cartIds.map(id => ({ id, qty: cart[id], product: products[id] })).filter(e => e.product)
  const total = entries.reduce((s, e) => s + e.product.price * e.qty, 0)
  const paymentNum = parseFloat(payment) || 0
  const change = paymentNum - total

  function handleDecrement(id, qty) {
    if (qty <= 1) {
      setConfirmAction({ type: 'single', id }) // mau turun ke 0 -> minta konfirmasi hapus
    } else {
      removeFromCart(id, 1)
    }
  }

  function handleDeleteItem(id) {
    setConfirmAction({ type: 'single', id })
  }

  function handleClearAll() {
    setConfirmAction({ type: 'all' })
  }

  function confirmActionYes() {
    if (confirmAction.type === 'all') {
      clearCart()
    } else {
      removeFromCart(confirmAction.id, cart[confirmAction.id])
    }
    setConfirmAction(null)
  }

  async function handleCheckout() {
    if (paymentNum < total) {
      setToast({ type: 'error', text: 'Pembayaran kurang dari total' })
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const items = entries.map(e => ({ product_id: e.id, qty: e.qty, price: e.product.price }))

    const { error } = await supabase.rpc('checkout_transaction', {
      p_items: items,
      p_payment_amount: paymentNum,
      p_user_id: user.id,
    })

    setLoading(false)
    if (error) {
      setToast({ type: 'error', text: error.message || 'Gagal checkout' })
      return
    }

    clearCart()
    setShowPayModal(false)
    setPayment('')
    setToast({ type: 'success', text: 'Transaksi berhasil!' })
    setTimeout(() => router.push('/kasir/riwayat'), 1200)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      {toast && (
        <div className={`fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[95] px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg ${toast.type === 'error' ? 'bg-merah-c' : 'bg-daun'}`}>
          {toast.text}
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-terong-soft flex items-center justify-center shrink-0">
            <ShoppingCart size={20} className="text-terong dark:text-terong-light" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
              Keranjang
              {entries.length > 0 && (
                <span className="text-[11px] font-bold bg-terong-soft text-terong-deep dark:text-terong-light px-2 py-0.5 rounded-full">
                  {entries.length} item
                </span>
              )}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Periksa kembali pesanan sebelum melakukan pembayaran.</p>
          </div>
        </div>
        {entries.length > 0 && (
          <button
            onClick={handleClearAll}
            title="Hapus semua item"
            className="w-10 h-10 rounded-xl bg-merah-soft text-merah-c dark:text-merah-light flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {fetching ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl py-14 text-center text-sm text-gray-400">Memuat...</div>
      ) : entries.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-center py-14 text-gray-400">
          <ShoppingCart size={44} className="mx-auto mb-3 text-terong-soft" />
          <p className="text-sm">Keranjang masih kosong.<br />Yuk pilih produk atau scan barcode.</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden mb-4">
            {entries.map(({ id, qty, product }, idx) => (
              <div key={id} className={`flex items-center gap-3 px-5 py-4 ${idx !== entries.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{product.name}</p>
                  <p className="text-xs text-gray-400">{fmt(product.price)}</p>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-1.5 py-1 shrink-0">
                  <button onClick={() => handleDecrement(id, qty)} className="w-6 h-6 rounded-md bg-white dark:bg-gray-700 font-bold text-terong dark:text-terong-light">−</button>
                  <span className="text-xs font-bold w-4 text-center">{qty}</span>
                  <button onClick={() => addToCart(id, 1)} disabled={qty >= product.stock} className="w-6 h-6 rounded-md bg-white dark:bg-gray-700 font-bold text-terong dark:text-terong-light disabled:opacity-30">+</button>
                </div>
                <p className="text-sm font-bold w-20 text-right shrink-0">{fmt(product.price * qty)}</p>
                <button
                  onClick={() => handleDeleteItem(id)}
                  title="Hapus item"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-merah-c dark:hover:text-merah-light hover:bg-merah-soft transition-colors shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-gray-400">Total Bayar</p>
              <p className="font-bold text-2xl text-terong-deep dark:text-terong-light">{fmt(total)}</p>
            </div>
            <button
              onClick={() => setShowPayModal(true)}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-br from-terong to-terong-deep text-white font-bold text-sm shadow-lg shadow-terong/30"
            >
              Bayar Sekarang
            </button>
          </div>
        </>
      )}

      {/* MODAL konfirmasi hapus (single item atau semua) */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 z-[90] flex items-center justify-center px-4" onClick={() => setConfirmAction(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            {confirmAction.type === 'all' ? (
              <>
                <p className="font-bold text-sm mb-1.5">Hapus semua item dari keranjang?</p>
                <p className="text-xs text-gray-500 mb-4">{entries.length} produk akan dihapus dari keranjang.</p>
              </>
            ) : (
              <>
                <p className="font-bold text-sm mb-1.5">Hapus produk ini dari keranjang?</p>
                <p className="text-xs text-gray-500 mb-4">{products[confirmAction.id]?.name}</p>
              </>
            )}
            <div className="flex gap-2">
              <button onClick={confirmActionYes} className="flex-1 bg-merah-c text-white rounded-xl py-2.5 text-sm font-semibold">Ya, Hapus</button>
              <button onClick={() => setConfirmAction(null)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL Bayar */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/40 z-[90] flex items-end md:items-center justify-center" onClick={() => setShowPayModal(false)}>
          <div className="bg-white dark:bg-gray-900 w-full md:max-w-sm rounded-t-[24px] md:rounded-[24px] p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[15px]">Pembayaran</h3>
              <button onClick={() => setShowPayModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <X size={15} />
              </button>
            </div>

            <div className="text-center mb-5">
              <p className="text-xs text-gray-400">Total Belanja</p>
              <p className="font-bold text-2xl text-terong-deep dark:text-terong-light">{fmt(total)}</p>
            </div>

            <label className="text-xs text-gray-500 mb-1 block">Jumlah Dibayar</label>
            <input
              type="number"
              value={payment}
              onChange={e => setPayment(e.target.value)}
              placeholder="0"
              autoFocus
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-3 text-lg font-bold mb-3"
            />

            {paymentNum > 0 && (
              <div className={`rounded-xl px-3.5 py-2.5 mb-4 text-sm font-semibold ${change >= 0 ? 'bg-daun-soft text-daun dark:text-daun-light' : 'bg-merah-soft text-merah-c dark:text-merah-light'}`}>
                {change >= 0 ? `Kembalian: ${fmt(change)}` : `Kurang: ${fmt(Math.abs(change))}`}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading || paymentNum < total}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-br from-terong to-terong-deep text-white font-bold text-sm disabled:opacity-40"
            >
              {loading ? 'Memproses...' : 'Konfirmasi Bayar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}