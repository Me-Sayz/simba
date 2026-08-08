'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { addNotification } from '@/lib/notifications'
import { Plus, Search, X, Trash2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'

const REASONS = ['Terjual', 'Rusak', 'Kadaluarsa', 'Retur', 'Hilang', 'Lainnya']

const EMPTY_FORM = {
  product_id: '', type: 'in', quantity: '', buy_price: '',
  movement_date: new Date().toISOString().split('T')[0],
  reason: 'Terjual', reason_note: '', note: '', supplier: '',
}

function fmtDate(str) {
  if (!str) return '-'
  return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function StockMovementsTab() {
  const [products, setProducts] = useState([])
  const [history, setHistory] = useState([])
  const [fetching, setFetching] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all') // all | in | out
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => { fetchProducts(); fetchHistory() }, [])

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('id, name, unit, price, stock').order('name')
    setProducts(data || [])
  }

  async function fetchHistory() {
    setFetching(true)
    const { data } = await supabase
      .from('stock_movements')
      .select('*, products(name, unit)')
      .order('created_at', { ascending: false })
      .limit(150)
    setHistory(data || [])
    setFetching(false)
  }

  function openAddModal() {
    setEditId(null)
    setForm({ ...EMPTY_FORM, movement_date: new Date().toISOString().split('T')[0] })
    setShowModal(true)
  }

  function openEditModal(row) {
    const [reasonPart, ...rest] = (row.note || '').split(' — ')
    const knownReason = REASONS.find(r => r === reasonPart)
    setEditId(row.id)
    setForm({
      product_id: row.product_id,
      type: row.type,
      quantity: row.quantity,
      buy_price: row.type === 'in' ? (row.unit_price || '') : '',
      movement_date: row.movement_date,
      reason: knownReason || 'Lainnya',
      reason_note: knownReason ? '' : reasonPart,
      note: rest.join(' — '),
      supplier: row.supplier || '',
    })
    setShowModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.product_id || !form.quantity) {
      setToast({ type: 'error', text: 'Lengkapi produk & jumlah dulu' })
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const selectedProduct = products.find(p => p.id === form.product_id)

    let combinedNote = form.note || ''
    let unitPrice = null

    if (form.type === 'out') {
      const reasonText = form.reason === 'Lainnya' ? (form.reason_note?.trim() || 'Lainnya') : form.reason
      combinedNote = form.note ? `${reasonText} — ${form.note}` : reasonText
      unitPrice = selectedProduct?.price ?? null
    } else {
      unitPrice = form.buy_price ? parseFloat(form.buy_price) : null
    }

    const payload = {
      product_id: form.product_id,
      type: form.type,
      quantity: parseInt(form.quantity),
      unit_price: unitPrice,
      movement_date: form.movement_date,
      note: combinedNote || null,
      supplier: form.type === 'in' ? (form.supplier || null) : null,
    }

    let error
    if (editId) {
      ;({ error } = await supabase.from('stock_movements').update(payload).eq('id', editId))
    } else {
      ;({ error } = await supabase.from('stock_movements').insert({ ...payload, user_id: user.id }))
    }

    setLoading(false)
    if (error) {
      setToast({ type: 'error', text: 'Gagal menyimpan data' })
      return
    }
    addNotification({
      type: form.type === 'in' ? 'stock_in' : 'stock_out',
      message: `${form.type === 'in' ? 'Barang masuk' : 'Barang keluar'}: ${selectedProduct?.name} ${form.type === 'in' ? '+' : '-'}${form.quantity}`,
      link: '/stock',
    })
    setToast({ type: 'success', text: editId ? 'Berhasil diupdate' : 'Berhasil disimpan' })
    setShowModal(false)
    fetchProducts()
    fetchHistory()
  }

  async function handleDelete() {
    const { error } = await supabase.from('stock_movements').delete().eq('id', deleteTarget.id)
    if (error) setToast({ type: 'error', text: 'Gagal menghapus' })
    else setToast({ type: 'success', text: 'Berhasil dihapus, stok disesuaikan kembali' })
    setDeleteTarget(null)
    fetchProducts()
    fetchHistory()
  }

  const filtered = history.filter(h => {
    if (filterType !== 'all' && h.type !== filterType) return false
    if (search && !h.products?.name?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      {toast && (
        <div className={`fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg ${toast.type === 'error' ? 'bg-merah-c' : 'bg-daun'}`}>
          {toast.text}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama produk..."
            className="bg-transparent outline-none text-sm w-full"
          />
        </div>
        <button onClick={openAddModal} className="w-11 h-11 rounded-xl bg-terong text-white flex items-center justify-center shrink-0 shadow-sm">
          <Plus size={20} />
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-4">
        {[['all', 'Semua'], ['in', 'Masuk'], ['out', 'Keluar']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilterType(val)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${filterType === val ? 'bg-terong text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        {fetching ? (
          <div className="py-10 text-center text-sm text-gray-400">Memuat...</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">Belum ada riwayat pergerakan stok</div>
        ) : (
          filtered.map(row => (
            <div key={row.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
              <div className={`w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0 ${row.type === 'in' ? 'bg-daun-soft' : 'bg-merah-soft'}`}>
                {row.type === 'in' ? <ArrowDownCircle size={17} className="text-daun" /> : <ArrowUpCircle size={17} className="text-merah-c" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 truncate">{row.products?.name || 'Produk dihapus'}</p>
                <p className="text-[11px] text-gray-400 truncate">{fmtDate(row.movement_date)} • {row.note || '-'}</p>
              </div>
              <span className={`text-xs font-bold shrink-0 ${row.type === 'in' ? 'text-daun' : 'text-merah-c'}`}>
                {row.type === 'in' ? '+' : '-'}{row.quantity}
              </span>
              <button onClick={() => openEditModal(row)} className="text-[11px] text-terong font-semibold shrink-0">Edit</button>
              <button onClick={() => setDeleteTarget(row)} className="text-gray-300 hover:text-merah-c shrink-0">
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* MODAL tambah/edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-[90] flex items-end md:items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-900 w-full md:max-w-md rounded-t-[24px] md:rounded-[24px] p-5 max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[15px]">{editId ? 'Edit Pergerakan Stok' : 'Catat Pergerakan Stok'}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: 'in' }))}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-colors ${form.type === 'in' ? 'bg-daun text-white' : 'text-gray-500'}`}
                >
                  📥 Barang Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: 'out' }))}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-colors ${form.type === 'out' ? 'bg-merah-c text-white' : 'text-gray-500'}`}
                >
                  📤 Barang Keluar
                </button>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Pilih Produk</label>
                <select
                  value={form.product_id}
                  onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm"
                  required
                >
                  <option value="">— Pilih produk —</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (stok: {p.stock})</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Jumlah</label>
                <input
                  type="number" min="1"
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm"
                  required
                />
              </div>

              {form.type === 'out' && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Alasan Keluar</label>
                  <select
                    value={form.reason}
                    onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm"
                  >
                    {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {form.reason === 'Lainnya' && (
                    <input
                      value={form.reason_note}
                      onChange={e => setForm(f => ({ ...f, reason_note: e.target.value }))}
                      placeholder="Jelaskan alasannya..."
                      className="w-full mt-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm"
                    />
                  )}
                </div>
              )}

              {form.type === 'in' && (
                <>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Harga Beli <span className="text-gray-400 font-normal">(opsional)</span></label>
                    <input
                      type="number" min="0"
                      value={form.buy_price}
                      onChange={e => setForm(f => ({ ...f, buy_price: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Supplier <span className="text-gray-400 font-normal">(opsional)</span></label>
                    <input
                      value={form.supplier}
                      onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tanggal</label>
                <input
                  type="date"
                  value={form.movement_date}
                  onChange={e => setForm(f => ({ ...f, movement_date: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Catatan <span className="text-gray-400 font-normal">(opsional)</span></label>
                <input
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Misal: dari supplier Pak Budi"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl text-white font-bold text-sm mt-1 disabled:opacity-60 ${form.type === 'in' ? 'bg-daun' : 'bg-merah-c'}`}
              >
                {loading ? 'Menyimpan...' : editId ? 'Update' : form.type === 'in' ? 'Simpan Barang Masuk' : 'Simpan Barang Keluar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL konfirmasi hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-[95] flex items-center justify-center px-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <p className="font-bold text-sm mb-1.5">Hapus catatan ini?</p>
            <p className="text-xs text-gray-500 mb-4">
              Stok produk <strong>{deleteTarget.products?.name}</strong> akan otomatis disesuaikan kembali.
            </p>
            <div className="flex gap-2">
              <button onClick={handleDelete} className="flex-1 bg-merah-c text-white rounded-xl py-2.5 text-sm font-semibold">Ya, Hapus</button>
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}