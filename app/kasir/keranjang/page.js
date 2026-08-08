'use client'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/context/CartContext'

const DEMO_NAMES = {
  'demo-1': { name: 'Indomie Goreng', price: 3500 },
  'demo-2': { name: 'Aqua Botol 600ml', price: 4000 },
  'demo-3': { name: 'Gula Pasir 1kg', price: 15000 },
}

function fmt(n) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

export default function KasirKeranjangPage() {
  const { cart, addToCart, removeFromCart, totalQty } = useCart()
  const entries = Object.entries(cart)
  const total = entries.reduce((s, [id, qty]) => s + (DEMO_NAMES[id]?.price || 0) * qty, 0)

  return (
    <div className="max-w-md mx-auto px-4 py-8">
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

        {entries.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <ShoppingCart size={44} className="mx-auto mb-3 text-terong-soft" />
            <p className="text-sm">
              Keranjang masih kosong.<br />Yuk pilih produk atau scan barcode.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 mb-4">
              {entries.map(([id, qty]) => {
                const p = DEMO_NAMES[id]
                if (!p) return null
                return (
                  <div key={id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 truncate">{p.name}</p>
                      <p className="text-[11px] text-gray-400">{fmt(p.price)}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-1.5 py-1">
                      <button onClick={() => removeFromCart(id, 1)} className="w-6 h-6 rounded-md bg-white dark:bg-gray-700 font-bold text-terong">−</button>
                      <span className="text-xs font-bold w-4 text-center">{qty}</span>
                      <button onClick={() => addToCart(id, 1)} className="w-6 h-6 rounded-md bg-white dark:bg-gray-700 font-bold text-terong">+</button>
                    </div>
                    <p className="text-[12.5px] font-bold w-16 text-right shrink-0">{fmt(p.price * qty)}</p>
                  </div>
                )
              })}
            </div>
            <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4 flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">Total Bayar</span>
              <span className="font-bold text-xl text-terong-deep">{fmt(total)}</span>
            </div>
            <button className="w-full py-3.5 rounded-2xl bg-gradient-to-br from-terong to-terong-deep text-white font-bold text-sm shadow-lg shadow-terong/30">
              Bayar Sekarang
            </button>
          </>
        )}
      </div>

      <p className="text-center text-[11px] text-gray-400 mt-4">
        Checkout ke Supabase (RPC <code>checkout_transaction</code>) dibangun di step "Halaman Kasir".
      </p>
    </div>
  )
}