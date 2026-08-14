'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'
import { ShoppingCart, X } from 'lucide-react'

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
  const [removeConfirm, setRemoveConfirm] = useState(null)
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
      setRemoveConfirm(id) // mau turun ke 0 -> minta konfirmasi hapus
    } else {
      removeFromCart(id, 1)
    }
  }

  function confirmRemove() {
    removeFromCart(removeConfirm, cart[removeConfirm])
    setRemoveConfirm(null)
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
    <div className="max-w-md mx-auto px-4 py-6">
      {toast && (
        <div className={`fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[95] px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg ${toast.type === 'error' ? 'bg-merah-c' : 'bg-daun'}`}>
          {toast.text}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[20px] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-bold text-[15px] text-gray-800 dark:text-gray-100 flex items-center gap-2">
            🧾 Keranjang
            {entries.length > 0 && (
              <span className="text-[11px] font-bold bg-terong-soft text-terong-deep px-2 py-0.5 rounded-full">
                {entries.length} item
              </span>
            )}
          </h1>
        </div>

        {fetching ? (
          <div className="py-14 text-center text-sm text-gray-400">Memuat...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <ShoppingCart size={44} className="mx-auto mb-3 text-terong-soft" />
            <p className="text-sm">Keranjang masih kosong.<br />Yuk pilih produk atau scan barcode.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 mb-4">
              {entries.map(({ id, qty, product }) => (
                <div key={id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 truncate">{product.name}</p>
                    <p className="text-[11px] text-gray-400">{fmt(product.price)}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-1.5 py-1">
                    <button onClick={() => handleDecrement(id, qty)} className="w-6 h-6 rounded-md bg-white dark:bg-gray-700 font-bold text-terong">−</button>
                    <span className="text-xs font-bold w-4 text-center">{qty}</span>
                    <button onClick={() => addToCart(id, 1)} disabled={qty >= product.stock} className="w-6 h-6 rounded-md bg-white dark:bg-gray-700 font-bold text-terong disabled:opacity-30">+</button>
                  </div>
                  <p className="text-[12.5px] font-bold w-16 text-right shrink-0">{fmt(product.price * qty)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4 flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">Total Bayar</span>
              <span className="font-bold text-xl text-terong-deep">{fmt(total)}</span>
            </div>
            <button onClick={() => setShowPayModal(true)} className="w-full py-3.5 rounded-2xl bg-gradient-to-br from-terong to-terong-deep text-white font-bold text-sm shadow-lg shadow-terong/30">
              Bayar Sekarang
            </button>
          </>
        )}
      </div>

      {/* MODAL konfirmasi hapus item (qty mau turun ke 0) */}
      {removeConfirm && (
        <div className="fixed inset-0 bg-black/40 z-[90] flex items-center justify-center px-4" onClick={() => setRemoveConfirm(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <p className="font-bold text-sm mb-1.5">Hapus produk ini dari keranjang?</p>
            <p className="text-xs text-gray-500 mb-4">{products[removeConfirm]?.name}</p>
            <div className="flex gap-2">
              <button onClick={confirmRemove} className="flex-1 bg-merah-c text-white rounded-xl py-2.5 text-sm font-semibold">Ya, Hapus</button>
              <button onClick={() => setRemoveConfirm(null)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm">Batal</button>
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
              <p className="font-bold text-2xl text-terong-deep">{fmt(total)}</p>
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
              <div className={`rounded-xl px-3.5 py-2.5 mb-4 text-sm font-semibold ${change >= 0 ? 'bg-daun-soft text-daun' : 'bg-merah-soft text-merah-c'}`}>
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