'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), { ssr: false })
import { addNotification } from '@/lib/notifications'
import { getStoreContext } from '@/lib/getUser'
import { inputCls, FieldError } from '@/lib/formHelpers'
import { deleteImageFromStorage } from '@/lib/productImages'
import { Search, ScanBarcode, Pencil, Trash2, Plus, Package, ShieldCheck, AlertTriangle, XCircle, X, ChevronDown, Check } from 'lucide-react'
import { useSupabaseFetch } from '@/lib/useSupabaseFetch'
import DataErrorState from '@/components/DataErrorState'

const ITEMS_PER_PAGE = 10

function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  if (!msg) return null
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium text-white transition-all ${msg.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
      {msg.text}
    </div>
  )
}

function DeleteModal({ product, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={20} className="text-rose-500 dark:text-rose-400" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-center mb-1">Hapus Produk?</h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          Produk <span className="font-medium text-gray-800 dark:text-gray-200">"{product?.name}"</span> akan dihapus permanen.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Batal</button>
          <button onClick={onConfirm} className="flex-1 bg-rose-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-rose-600">Hapus</button>
        </div>
      </div>
    </div>
  )
}

function Drawer({ show, onClose, title, children }) {
  if (!show) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 h-full flex flex-col z-[100] shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  )
}

function StatusBadge({ stock, minStock }) {
  if (stock === 0) return <span className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-xs px-2.5 py-1 rounded-full font-medium">Habis</span>
  if (stock <= minStock) return <span className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-xs px-2.5 py-1 rounded-full font-medium">Rendah</span>
  return <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs px-2.5 py-1 rounded-full font-medium">Aman</span>
}

// Palet warna kategori — sengaja skip merah/amber/hijau karena warna itu udah
// dipakai badge status (Habis/Rendah/Aman), biar gak ketuker maknanya.
const CATEGORY_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
]

// Nama kategori yang sama selalu jatuh ke warna yang sama (deterministik),
// jadi konsisten tiap kali dibuka, bukan random tiap render.
function categoryColorClass(category) {
  const str = category.toLowerCase().trim()
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  }
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length]
}

function CategoryBadge({ category }) {
  if (!category) return <span className="text-gray-300 text-xs">-</span>
  const cls = categoryColorClass(category)
  return <span className={`${cls} text-xs px-2.5 py-1 rounded-full font-medium`}>{category}</span>
}

function CustomSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])
  const current = options.find(o => o.value === value)
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 shadow-sm min-w-[140px]">
        <span>{current?.label || placeholder}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`absolute left-0 top-11 min-w-max bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden transition-all duration-200 origin-top
        ${open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
        {options.map(({ value: val, label }) => (
          <button
            key={val}
            onClick={() => { onChange(val); setOpen(false) }}
            className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors whitespace-nowrap
              ${value === val
                ? 'bg-terong-soft text-terong-deep dark:text-terong-light font-medium'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            {label}
            {value === val && <Check size={13} className="ml-auto text-terong dark:text-terong-light" />}
          </button>
        ))}
      </div>
    </div>
  )
}

function CategoryAutocomplete({ id, value, onChange, options, placeholder, hasError }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = options.filter(o => o.toLowerCase().includes((value || '').toLowerCase()))
  const showSuggestions = open && filtered.length > 0

  return (
    <div className="relative" ref={ref}>
      <input
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        autoComplete="off"
        className={inputCls(hasError)}
      />
      <div className={`absolute left-0 top-[calc(100%+6px)] w-full max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 transition-all duration-200 origin-top
        ${showSuggestions ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
        {filtered.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => { onChange(c); setOpen(false) }}
            className="flex items-center w-full px-4 py-2.5 text-sm text-left text-gray-600 dark:text-gray-300 hover:bg-terong-soft hover:text-terong-deep dark:hover:bg-gray-700 dark:hover:text-terong-light transition-colors truncate"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  )
}

const EMPTY_FORM = {
  name: '', category: '', unit: '', price: '', buy_price: '',
  stock: '', min_stock: '', barcode: '', supplier: ''
}

function getFormDefaults() {
  try {
    const prefs = JSON.parse(localStorage.getItem('stok-prefs') || '{}')
    if (!prefs.useDefaults) return EMPTY_FORM
    return {
      ...EMPTY_FORM,
      unit: prefs.defaultUnit || '',
      min_stock: prefs.defaultMinStock !== undefined ? String(prefs.defaultMinStock) : '',
    }
  } catch {
    return EMPTY_FORM
  }
}

const REQUIRED_FIELDS = {
  name: 'Nama Produk',
  category: 'Kategori',
  unit: 'Satuan',
  price: 'Harga Jual',
  buy_price: 'Harga Beli / Modal',
  stock: 'Stok Awal',
  min_stock: 'Minimum Stok',
  barcode: 'Barcode / SKU',
}

// Komponen form Tambah/Edit Produk berdiri sendiri, dipisah dari ProductsTab
// biar ngetik di sini gak ikut ngerender ulang tabel/list produk di belakangnya
// (yang isinya foto tiap produk, cukup berat kalau ikut re-render tiap keystroke).
function ProductFormDrawer({ editProduct, categories, onClose, onSaved, setToast }) {
  const editId = editProduct?.id || null

  const [form, setForm] = useState(() => editProduct ? {
    name: editProduct.name,
    category: editProduct.category || '',
    unit: editProduct.unit || '',
    price: editProduct.price,
    buy_price: editProduct.buy_price || '',
    stock: editProduct.stock,
    min_stock: editProduct.min_stock,
    barcode: editProduct.barcode || '',
    supplier: editProduct.supplier || '',
  } : getFormDefaults())
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(editProduct?.image_url || null)

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    if (fieldErrors[key]) setFieldErrors(e => ({ ...e, [key]: undefined }))
  }

  function validateForm() {
    const errors = {}
    for (const [key, label] of Object.entries(REQUIRED_FIELDS)) {
      if (editId && key === 'buy_price') continue
      if (!form[key] || String(form[key]).trim() === '') {
        errors[key] = `${label} wajib diisi`
      }
    }
    return errors
  }

  async function uploadImage(oldImageUrl = null) {
    if (!imageFile) return null
    const { data: { user } } = await supabase.auth.getUser()
    const fileName = `${user.id}/${Date.now()}-${imageFile.name}`
    const { error } = await supabase.storage.from('product-images').upload(fileName, imageFile)
    if (error) return null
    if (oldImageUrl) deleteImageFromStorage(oldImageUrl)
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName)
    return data.publicUrl
  }

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      const firstErrKey = Object.keys(errors)[0]
      document.getElementById(`field-${firstErrKey}`)?.focus()
      return
    }

    setLoading(true)

    let nameQuery = supabase.from('products').select('id').ilike('name', form.name.trim()).limit(1)
    if (editId) nameQuery = nameQuery.neq('id', editId)
    const { data: nameData, error: nameError } = await nameQuery
    if (nameError) {
      setToast({ type: 'error', text: 'Gagal memvalidasi nama produk' })
      setLoading(false)
      return
    }
    if (nameData && nameData.length > 0) {
      setFieldErrors(e => ({ ...e, name: 'Produk dengan nama ini sudah ada' }))
      setToast({ type: 'error', text: 'Produk dengan nama ini sudah ada' })
      setLoading(false)
      return
    }

    let barcodeQuery = supabase.from('products').select('id').eq('barcode', form.barcode.trim()).limit(1)
    if (editId) barcodeQuery = barcodeQuery.neq('id', editId)
    const { data: barcodeData, error: barcodeError } = await barcodeQuery
    if (barcodeError) {
      setToast({ type: 'error', text: 'Gagal memvalidasi barcode' })
      setLoading(false)
      return
    }
    if (barcodeData && barcodeData.length > 0) {
      setFieldErrors(e => ({ ...e, barcode: 'Barcode / SKU ini sudah digunakan produk lain' }))
      setToast({ type: 'error', text: 'Barcode / SKU ini sudah digunakan produk lain' })
      setLoading(false)
      return
    }

    const ctx = await getStoreContext()
    const oldImageUrl = editId ? (editProduct?.image_url || null) : null
    const image_url = await uploadImage(oldImageUrl)

    const payload = {
      name: form.name,
      category: form.category,
      unit: form.unit,
      price: form.price,
      stock: form.stock,
      min_stock: form.min_stock,
      barcode: form.barcode,
      supplier: form.supplier,
      ...(image_url && { image_url }),
    }

    if (editId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editId).eq('user_id', ctx.userId)
      if (error) setToast({ type: 'error', text: 'Gagal update produk' })
      else setToast({ type: 'success', text: 'Produk berhasil diupdate' })
    } else {
      // stock awal dimulai dari 0 — nanti dinaikkan otomatis lewat trigger
      // stock_movements, biar gak dobel-hitung sama insert stok awal di bawah
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert({ ...payload, stock: 0, user_id: ctx.userId, store_id: ctx.storeId })
        .select()
        .single()
      if (error) {
        setToast({ type: 'error', text: 'Gagal tambah produk' })
        setLoading(false)
        return
      }
      if (newProduct && parseInt(form.stock) > 0) {
        await supabase.from('stock_movements').insert({
          product_id: newProduct.id,
          type: 'in',
          quantity: parseInt(form.stock),
          unit_price: parseFloat(form.buy_price) || null,
          note: 'Stok awal',
          movement_date: new Date().toISOString().split('T')[0],
          user_id: ctx.userId,
          store_id: ctx.storeId,
        })
      }
      setToast({ type: 'success', text: 'Produk berhasil ditambahkan' })
      addNotification({
        type: 'new_product',
        message: `Produk baru ditambahkan: ${form.name}`,
        link: '/stock',
      })
    }

    setLoading(false)
    onSaved()
    onClose()
  }

  return (
    <>
      <Drawer show={true} onClose={onClose} title={editId ? 'Edit Produk' : 'Tambah Produk'}>
        <form onSubmit={handleSubmit} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }} noValidate autoComplete="off" className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Nama Produk <span className="text-rose-500">*</span>
            </label>
            <input
              id="field-name"
              placeholder="Nama produk"
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              className={inputCls(fieldErrors.name)}
              autoComplete="off"
            />
            <FieldError msg={fieldErrors.name} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Kategori <span className="text-rose-500">*</span>
              </label>
              <CategoryAutocomplete
                id="field-category"
                placeholder="Minuman, Makanan..."
                value={form.category}
                onChange={val => setField('category', val)}
                options={categories}
                hasError={fieldErrors.category}
              />
              <FieldError msg={fieldErrors.category} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Satuan <span className="text-rose-500">*</span>
              </label>
              <input
                id="field-unit"
                placeholder="pcs, kg, dll"
                value={form.unit}
                onChange={e => setField('unit', e.target.value)}
                className={inputCls(fieldErrors.unit)}
                autoComplete="off"
              />
              <FieldError msg={fieldErrors.unit} />
            </div>
          </div>

          <div className={!editId ? 'grid grid-cols-2 gap-3' : ''}>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Harga Jual <span className="text-rose-500">*</span>
              </label>
              <input
                id="field-price"
                type="number"
                min="0"
                placeholder="0"
                value={form.price}
                onChange={e => setField('price', e.target.value)}
                className={inputCls(fieldErrors.price)}
                autoComplete="off"
              />
              <FieldError msg={fieldErrors.price} />
            </div>
            {!editId && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Harga Beli / Modal <span className="text-rose-500">*</span>
                </label>
                <input
                  id="field-buy_price"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.buy_price}
                  onChange={e => setField('buy_price', e.target.value)}
                  className={inputCls(fieldErrors.buy_price)}
                  autoComplete="off"
                />
                <FieldError msg={fieldErrors.buy_price} />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Supplier <span className="text-gray-400 font-normal">(opsional)</span></label>
            <input
              placeholder="Nama supplier"
              value={form.supplier}
              onChange={e => setField('supplier', e.target.value)}
              className={inputCls(false)}
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Stok Awal <span className="text-rose-500">*</span>
              </label>
              <input
                id="field-stock"
                type="number"
                min="0"
                placeholder="0"
                value={form.stock}
                onChange={e => setField('stock', e.target.value)}
                className={inputCls(fieldErrors.stock)}
                autoComplete="off"
              />
              <FieldError msg={fieldErrors.stock} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Minimum Stok <span className="text-rose-500">*</span>
              </label>
              <input
                id="field-min_stock"
                type="number"
                min="0"
                placeholder="0"
                value={form.min_stock}
                onChange={e => setField('min_stock', e.target.value)}
                className={inputCls(fieldErrors.min_stock)}
                autoComplete="off"
              />
              <FieldError msg={fieldErrors.min_stock} />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Barcode / SKU <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                id="field-barcode"
                placeholder="Scan atau ketik manual"
                value={form.barcode}
                onChange={e => setField('barcode', e.target.value)}
                className={inputCls(fieldErrors.barcode) + ' flex-1'}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300"
              >
                <ScanBarcode size={17} />
              </button>
            </div>
            <FieldError msg={fieldErrors.barcode} />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Foto Produk <span className="text-gray-400 font-normal">(opsional)</span></label>
            <div
              className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center cursor-pointer hover:border-terong/40 transition-colors"
              onClick={() => document.getElementById('foto-input').click()}
            >
              {imagePreview
                ? <img src={imagePreview} alt="preview" className="h-24 mx-auto rounded-lg object-cover" />
                : <div className="text-gray-400"><Package size={24} className="mx-auto mb-1" /><p className="text-xs">Klik untuk upload foto</p></div>
              }
            </div>
            <input id="foto-input" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>

          </div>

          <div className="flex gap-2 px-6 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
            <button type="submit" disabled={loading} className="flex-1 bg-terong text-white rounded-xl p-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60">
              {loading ? 'Menyimpan...' : editId ? 'Update Produk' : 'Simpan Produk'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              Batal
            </button>
          </div>
        </form>
      </Drawer>

      {/* Scanner khusus field barcode form ini — dipisah dari scanner search di toolbar */}
      {showScanner && (
        <BarcodeScanner
          onDetected={code => {
            setField('barcode', code)
            setToast({ type: 'success', text: `Barcode terdeteksi: ${code}` })
            setShowScanner(false)
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  )
}

export default function ProductsTab() {
  const { data: products, loading: fetching, error, refetch: fetchProducts } = useSupabaseFetch(() =>
    supabase.from('products').select('*').order('created_at', { ascending: false })
  )
  const [filtered, setFiltered] = useState([])
  const [editProduct, setEditProduct] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortBy, setSortBy] = useState('terbaru')
  const [page, setPage] = useState(1)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    getStoreContext().then(ctx => setIsOwner(ctx?.isOwner ?? false))
  }, [])

  // Notif stok menipis — jalan tiap kali fetch produk berhasil (mount,
  // abis hapus, abis simpan form), sama kayak behavior sebelumnya
  useEffect(() => {
    if (!products) return
    const low = products.filter(p => p.stock <= p.min_stock)
    low.forEach(p => {
      addNotification({
        type: 'low_stock',
        message: `Stok "${p.name}" menipis (${p.stock} ${p.unit || ''} tersisa)`,
        link: '/stock',
      })
    })
  }, [products])

  useEffect(() => {
    let result = [...(products || [])]
    if (search) result = result.filter(p =>
      p.name?.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search)
    )
    if (filterCategory !== 'all') result = result.filter(p => p.category?.toLowerCase() === filterCategory.toLowerCase())
    if (filterStatus === 'aman') result = result.filter(p => p.stock > p.min_stock)
    if (filterStatus === 'rendah') result = result.filter(p => p.stock > 0 && p.stock <= p.min_stock)
    if (filterStatus === 'habis') result = result.filter(p => p.stock === 0)
    if (sortBy === 'terbaru') result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    if (sortBy === 'stok-asc') result.sort((a, b) => a.stock - b.stock)
    if (sortBy === 'stok-desc') result.sort((a, b) => b.stock - a.stock)
    if (sortBy === 'nama') result.sort((a, b) => a.name.localeCompare(b.name))
    setFiltered(result)
    setPage(1)
  }, [products, search, filterStatus, filterCategory, sortBy])

  async function handleDelete() {
    if (deleteTarget.image_url) await deleteImageFromStorage(deleteTarget.image_url)
    const { error } = await supabase.from('products').delete().eq('id', deleteTarget.id)
    if (error) setToast({ type: 'error', text: 'Gagal hapus produk' })
    else setToast({ type: 'success', text: 'Produk berhasil dihapus' })
    setDeleteTarget(null)
    fetchProducts()
  }

  function handleEdit(product) {
    setEditProduct(product)
    setShowForm(true)
  }

  function handleCancel() {
    setEditProduct(null)
    setShowForm(false)
  }

  const categories = [...new Set((products || []).map(p => p.category).filter(Boolean))]
  const totalPage = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const stats = {
    total: (products || []).length,
    aman: (products || []).filter(p => p.stock > p.min_stock).length,
    rendah: (products || []).filter(p => p.stock > 0 && p.stock <= p.min_stock).length,
    habis: (products || []).filter(p => p.stock === 0).length,
  }

  function getPaginationPages() {
    const pages = []
    for (let i = 1; i <= totalPage; i++) {
      if (i === 1 || i === totalPage || Math.abs(i - page) <= 1) pages.push(i)
      else if (pages[pages.length - 1] !== '...') pages.push('...')
    }
    return pages
  }

  const categoryOptions = [
    { value: 'all', label: 'Semua Kategori' },
    ...categories.map(c => ({ value: c, label: c }))
  ]
  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'aman', label: 'Aman' },
    { value: 'rendah', label: 'Rendah' },
    { value: 'habis', label: 'Habis' },
  ]
  const sortOptions = [
    { value: 'terbaru', label: 'Terbaru' },
    { value: 'nama', label: 'Nama A-Z' },
    { value: 'stok-asc', label: 'Stok Terendah' },
    { value: 'stok-desc', label: 'Stok Tertinggi' },
  ]

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      {deleteTarget && <DeleteModal product={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}

      {/* Form Tambah/Edit Produk — komponen terpisah biar ngetik gak ikut ngerender ulang tabel */}
      {showForm && (
        <ProductFormDrawer
          editProduct={editProduct}
          categories={categories}
          onClose={handleCancel}
          onSaved={fetchProducts}
          setToast={setToast}
        />
      )}

      {/* Scanner buat search di toolbar */}
      {showScanner && (
        <BarcodeScanner
          onDetected={code => {
            setSearch(code)
            setToast({ type: 'success', text: `Barcode: ${code}` })
            setShowScanner(false)
          }}
          onClose={() => setShowScanner(false)}
        />
      )}


      <div className="px-4 md:px-6 py-6 max-w-8xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Produk</h1>
            <p className="text-sm text-gray-500 mt-0.5">Total Produk: {products.length.toLocaleString('id-ID')}</p>
          </div>
          {isOwner && (
            <button
              onClick={() => { setEditProduct(null); setShowForm(true) }}
              className="flex items-center gap-2 bg-terong text-white text-sm px-4 py-2.5 rounded-xl hover:opacity-90 transition-colors font-medium"
            >
              <Plus size={16} /> Tambah Produk
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-terong-soft rounded-2xl p-4 flex items-center gap-4">
            <div className="bg-white dark:bg-gray-900 p-3 rounded-xl"><Package size={20} className="text-terong dark:text-terong-light" /></div>
            <div>
              <p className="text-xs text-terong-deep/70 dark:text-terong-light/70 mb-0.5">Total Produk:</p>
              <p className="text-2xl font-bold text-terong-deep dark:text-terong-light">{stats.total}</p>
            </div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl p-4 flex items-center gap-4">
            <div className="bg-emerald-100 dark:bg-emerald-900/60 p-3 rounded-xl"><ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400" /></div>
            <div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-0.5">Aman:</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.aman}</p>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/40 rounded-2xl p-4 flex items-center gap-4">
            <div className="bg-amber-100 dark:bg-amber-900/60 p-3 rounded-xl"><AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" /></div>
            <div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-0.5">Rendah:</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.rendah}</p>
            </div>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/40 rounded-2xl p-4 flex items-center gap-4">
            <div className="bg-rose-100 dark:bg-rose-900/60 p-3 rounded-xl"><XCircle size={20} className="text-rose-500 dark:text-rose-400" /></div>
            <div>
              <p className="text-xs text-rose-500 dark:text-rose-400 mb-0.5">Habis:</p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-300">{stats.habis}</p>
            </div>
          </div>
        </div>

        {/* Filter + Search */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Cari produk berdasarkan nama / barcode..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <CustomSelect value={filterCategory} onChange={setFilterCategory} options={categoryOptions} placeholder="Semua Kategori" />
              <CustomSelect value={filterStatus} onChange={setFilterStatus} options={statusOptions} placeholder="Semua Status" />
              <CustomSelect value={sortBy} onChange={setSortBy} options={sortOptions} placeholder="Terbaru" />
              <button
                onClick={() => setShowScanner(true)}
                className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                <ScanBarcode size={15} /> Scan
              </button>
            </div>
          </div>
        </div>

        {/* Table — Desktop */}
        <div className="hidden md:block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-4">
          {fetching ? (
            <div className="p-10 text-center text-gray-300 text-sm">Memuat data...</div>
          ) : error ? (
            <DataErrorState onRetry={fetchProducts} />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left w-14">Gambar</th>
                  <th className="px-4 py-3 text-left">Nama Produk</th>
                  <th className="px-4 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-left">Kategori</th>
                  <th className="px-4 py-3 text-left">Supplier</th>
                  <th className="px-4 py-3 text-left">Stok</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Harga</th>
                  <th className="px-4 py-3 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(p => (
                  <tr key={p.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3">
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded-xl object-cover" />
                        : <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><Package size={16} className="text-gray-400" /></div>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 dark:text-gray-100">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.unit}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">{p.barcode || '-'}</td>
                    <td className="px-4 py-3"><CategoryBadge category={p.category} /></td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">{p.supplier || '-'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">
                      {p.stock} <span className="text-xs font-normal text-gray-400">{p.unit}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge stock={p.stock} minStock={p.min_stock} /></td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">Rp {Number(p.price).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3">
                      {isOwner && (
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(p)} className="p-2 rounded-lg hover:bg-terong-soft text-gray-400 hover:text-terong dark:hover:text-terong-light transition-colors"><Pencil size={15} /></button>
                          <button onClick={() => setDeleteTarget(p)} className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-gray-400 hover:text-rose-500 transition-colors"><Trash2 size={15} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center">
                      <Package size={40} className="text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">Tidak ada produk ditemukan</p>
                      <button
                        onClick={() => { setSearch(''); setFilterStatus('all'); setFilterCategory('all') }}
                        className="mt-3 text-terong dark:text-terong-light text-sm hover:underline"
                      >
                        Reset filter
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Cards — Mobile */}
        <div className="md:hidden flex flex-col gap-3 mb-4">
          {fetching && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center text-gray-300 text-sm">Memuat data...</div>
          )}
          {!fetching && error && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <DataErrorState onRetry={fetchProducts} />
            </div>
          )}
          {!fetching && !error && paginated.length === 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
              <Package size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Tidak ada produk</p>
            </div>
          )}
          {paginated.map(p => (
            <div key={p.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
              <div className="flex items-center gap-3 mb-3">
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} className="h-12 w-12 rounded-xl object-cover" />
                  : <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><Package size={18} className="text-gray-400" /></div>
                }
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5"><CategoryBadge category={p.category} /></div>
                </div>
                <StatusBadge stock={p.stock} minStock={p.min_stock} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                <div><p className="text-gray-400">Harga Jual</p><p className="font-medium text-gray-700 dark:text-gray-300">Rp {Number(p.price).toLocaleString('id-ID')}</p></div>
                <div><p className="text-gray-400">Stok</p><p className="font-bold text-gray-800 dark:text-gray-100">{p.stock} {p.unit}</p></div>
                <div><p className="text-gray-400">Min Stok</p><p className="font-medium text-gray-700 dark:text-gray-300">{p.min_stock}</p></div>
              </div>
              {p.supplier && <p className="text-xs text-gray-400 mb-1">Supplier: {p.supplier}</p>}
              {p.barcode && <p className="text-xs text-gray-400 font-mono mb-3">{p.barcode}</p>}
              {isOwner && (
                <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button onClick={() => handleEdit(p)} className="flex-1 flex items-center justify-center gap-1.5 text-terong dark:text-terong-light text-sm py-1.5 rounded-lg hover:bg-terong-soft"><Pencil size={14} /> Edit</button>
                  <button onClick={() => setDeleteTarget(p)} className="flex-1 flex items-center justify-center gap-1.5 text-rose-400 text-sm py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"><Trash2 size={14} /> Hapus</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPage > 1 && (
          <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-5 py-3">
            <p className="text-xs text-gray-400">
              Menampilkan {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} dari {filtered.length} produk
            </p>
            <div className="flex gap-1 items-center">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {getPaginationPages().map((n, i) =>
                n === '...'
                  ? <span key={`dots-${i}`} className="px-2 text-gray-400 text-sm">...</span>
                  : <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`w-8 h-8 rounded-lg text-sm ${page === n ? 'bg-terong text-white font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                    >
                      {n}
                    </button>
              )}
              <button
                onClick={() => setPage(p => Math.min(totalPage, p + 1))}
                disabled={page === totalPage}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* spacer biar pagination gak ketutup tombol tambah floating pas discroll abis-abisan */}
        <div className="h-16 md:hidden" aria-hidden="true" />

        {/* spacer biar pagination gak ketutup tombol tambah floating pas discroll abis-abisan */}
        <div className="h-16 md:hidden" aria-hidden="true" />

        <button
          onClick={() => { setEditProduct(null); setShowForm(true) }}
          className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-terong text-white rounded-full shadow-lg flex items-center justify-center hover:opacity-90 z-40"
        >
          <Plus size={24} />
        </button>

      </div>
    </div>
  )
}