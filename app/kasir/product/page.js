'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'
import { Search, Package } from 'lucide-react'

function fmt(n) {
  return 'Rp ' + (n || 0).toLocaleString('id-ID')
}

export default function KasirProductPage() {
  const { cart, addToCart } = useCart()
  const [products, setProducts] = useState([])
  const [fetching, setFetching] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua')

  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    setFetching(true)
    const { data } = await supabase.from('products').select('*').order('name')
    setProducts(data || [])
    setFetching(false)
  }

  const categories = ['Semua', ...new Set(products.map(p => p.category).filter(Boolean))]

  const filtered = products.filter(p => {
    if (category !== 'Semua' && p.category !== category) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 mb-4">
        <Search size={16} className="text-gray-400 shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari produk..."
          className="bg-transparent outline-none text-sm w-full"
        />
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${category === c ? 'bg-terong text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {fetching ? (
        <div className="py-16 text-center text-sm text-gray-400">Memuat produk...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">Produk tidak ditemukan</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pb-6">
          {filtered.map(p => {
            const inCart = cart[p.id] || 0
            const outOfStock = p.stock <= 0
            return (
              <button
                key={p.id}
                onClick={() => !outOfStock && addToCart(p.id, 1)}
                disabled={outOfStock}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden text-left hover:border-terong transition-colors disabled:opacity-50 relative"
              >
                <div className="h-20 bg-terong-soft flex items-center justify-center overflow-hidden">
                  {p.image_url
                    ? <img src={p.image_url} className="w-full h-full object-cover" />
                    : <Package size={22} className="text-terong" />}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">{p.name}</p>
                  <p className="text-[10.5px] text-gray-400">{outOfStock ? 'Stok habis' : `Stok: ${p.stock}`}</p>
                  <p className="text-[12.5px] font-bold text-terong-deep mt-1">{fmt(p.price)}</p>
                </div>
                {inCart > 0 && (
                  <span className="absolute top-2 right-2 min-w-[20px] h-5 px-1.5 rounded-full bg-merah-c text-white text-[10px] font-bold flex items-center justify-center">
                    {inCart}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}