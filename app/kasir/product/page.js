'use client'
import { Package } from 'lucide-react'
import { useCart } from '@/context/CartContext'

// data contoh cuma buat verifikasi CartContext jalan sebelum halaman produk asli dibangun
const DEMO_PRODUCTS = [
  { id: 'demo-1', name: 'Indomie Goreng', price: 3500 },
  { id: 'demo-2', name: 'Aqua Botol 600ml', price: 4000 },
  { id: 'demo-3', name: 'Gula Pasir 1kg', price: 15000 },
]

export default function KasirProductPage() {
  const { addToCart, cart } = useCart()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-terong-soft flex items-center justify-center mx-auto mb-4">
          <Package size={28} className="text-terong" />
        </div>
        <h1 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-1.5">Produk</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Grid produk asli (dari Supabase) dibangun di step "Halaman Kasir". Sementara ini contoh buat cek badge Keranjang &amp; navigasi.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {DEMO_PRODUCTS.map(p => (
          <button
            key={p.id}
            onClick={() => addToCart(p.id, 1)}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-3 text-left hover:border-terong transition-colors"
          >
            <div className="h-14 rounded-xl bg-terong-soft mb-2" />
            <p className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">{p.name}</p>
            <p className="text-[11px] text-gray-400">Rp {p.price.toLocaleString('id-ID')}</p>
            <p className="text-[10px] text-terong font-bold mt-1">
              {cart[p.id] ? `${cart[p.id]} di keranjang` : 'Tap untuk tambah'}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}