'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { History, Receipt } from 'lucide-react'

function fmtRupiah(n) {
  return 'Rp ' + (n || 0).toLocaleString('id-ID')
}

function fmtDateTime(str) {
  const d = new Date(str)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' • ' +
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export default function RiwayatPage() {
  const [transactions, setTransactions] = useState([])
  const [fetching, setFetching] = useState(true)
  const [selected, setSelected] = useState(null)
  const [items, setItems] = useState([])

  useEffect(() => { fetchTransactions() }, [])

  async function fetchTransactions() {
    setFetching(true)
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    setTransactions(data || [])
    setFetching(false)
  }

  async function openDetail(tx) {
    setSelected(tx)
    const { data } = await supabase
      .from('transaction_items')
      .select('*, products(name)')
      .eq('transaction_id', tx.id)
    setItems(data || [])
  }

  const todayTotal = transactions
    .filter(t => new Date(t.created_at).toDateString() === new Date().toDateString())
    .reduce((s, t) => s + t.total_amount, 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-2xl bg-terong-soft flex items-center justify-center shrink-0">
          <History size={20} className="text-terong" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-gray-800 dark:text-gray-100">Riwayat Transaksi</h1>
          <p className="text-xs text-gray-400">Omzet hari ini: <strong className="text-daun">{fmtRupiah(todayTotal)}</strong></p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        {fetching ? (
          <div className="py-12 text-center text-sm text-gray-400">Memuat...</div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center">
            <Receipt size={40} className="mx-auto mb-3 text-terong-soft" />
            <p className="text-sm text-gray-400">Belum ada transaksi.<br />Transaksi dari Kasir bakal muncul di sini.</p>
          </div>
        ) : (
          transactions.map(t => (
            <button
              key={t.id}
              onClick={() => openDetail(t)}
              className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-b-0 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <div className="w-9 h-9 rounded-[11px] bg-daun-soft flex items-center justify-center shrink-0">
                <Receipt size={16} className="text-daun" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">#{t.transaction_code}</p>
                <p className="text-[11px] text-gray-400">{fmtDateTime(t.created_at)}</p>
              </div>
              <span className="text-sm font-bold text-daun shrink-0">{fmtRupiah(t.total_amount)}</span>
            </button>
          ))
        )}
      </div>

      {/* Modal detail transaksi */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-[90] flex items-end md:items-center justify-center" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-gray-900 w-full md:max-w-sm rounded-t-[24px] md:rounded-[24px] p-5 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <p className="font-bold text-sm mb-1">#{selected.transaction_code}</p>
            <p className="text-xs text-gray-400 mb-4">{fmtDateTime(selected.created_at)}</p>

            <div className="flex flex-col gap-2.5 mb-4 border-t border-dashed border-gray-200 dark:border-gray-700 pt-4">
              {items.map(it => (
                <div key={it.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-200">{it.qty}x {it.products?.name || 'Produk dihapus'}</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{fmtRupiah(it.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-3 flex flex-col gap-1.5 text-sm mb-4">
              <div className="flex justify-between"><span className="text-gray-400">Total</span><span className="font-bold">{fmtRupiah(selected.total_amount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Dibayar</span><span>{fmtRupiah(selected.payment_amount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Kembalian</span><span>{fmtRupiah(selected.change_amount)}</span></div>
            </div>

            <button onClick={() => setSelected(null)} className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold">
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}