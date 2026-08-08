'use client'
import { useState } from 'react'
import ProductsTab from '@/components/ProductsTab'
import StockMovementsTab from '@/components/StockMovementsTab'

export default function StockPage() {
  const [tab, setTab] = useState('produk') // produk | riwayat

  return (
    <div>
      {/* Tab switch — cuma dipakai buat tab "Riwayat Stok", tab "Produk" udah
          punya toolbar sendiri di dalam ProductsTab (search, filter, dst) */}
      <div className="px-4 md:px-6 pt-6 max-w-8xl mx-auto">
        <div className="flex bg-terong-soft rounded-2xl p-1 max-w-xs mb-1">
          <button
            onClick={() => setTab('produk')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${tab === 'produk' ? 'bg-white text-terong-deep shadow-sm' : 'text-terong-deep/60'}`}
          >
            Produk
          </button>
          <button
            onClick={() => setTab('riwayat')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${tab === 'riwayat' ? 'bg-white text-terong-deep shadow-sm' : 'text-terong-deep/60'}`}
          >
            Riwayat Stok
          </button>
        </div>
      </div>

      {tab === 'produk' ? (
        <ProductsTab />
      ) : (
        <div className="px-4 md:px-6 py-4 max-w-8xl mx-auto">
          <StockMovementsTab />
        </div>
      )}
    </div>
  )
}