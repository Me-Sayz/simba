'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getStoreContext } from '@/lib/getUser'
import AccessDenied from '@/components/AccessDenied'
import { inputCls, FieldError } from '@/lib/formHelpers'
import { ChevronLeft, UserPlus, Trash2, Mail, Clock, ShieldCheck } from 'lucide-react'

export default function KelolaStaffPage() {
  const [access, setAccess] = useState('checking') // 'checking' | 'granted' | 'denied'
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [removeTarget, setRemoveTarget] = useState(null)

  useEffect(() => {
    getStoreContext().then(ctx => {
      if (ctx?.isOwner) {
        setAccess('granted')
        fetchMembers()
      } else {
        setAccess('denied')
      }
    })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  async function fetchMembers() {
    setLoading(true)
    const { data } = await supabase
      .from('store_members')
      .select('id, role, status, user_id, created_at, profiles ( name )')
      .order('created_at', { ascending: true })
    setMembers(data || [])
    setLoading(false)
  }

  async function handleInvite(e) {
    e.preventDefault()
    setError('')
    if (!email.trim()) return setError('Email wajib diisi')

    setInviting(true)
    const { data: { session } } = await supabase.auth.getSession()

    const res = await fetch('/api/invite-staff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ email: email.trim() }),
    })
    const result = await res.json()
    setInviting(false)

    if (!res.ok) {
      setError(result.error || 'Gagal mengundang staff')
      return
    }

    setEmail('')
    setToast({ type: 'success', text: `Undangan terkirim ke ${email.trim()}` })
    fetchMembers()
  }

  async function handleRemove() {
    if (!removeTarget) return
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/remove-staff', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ staffMemberId: removeTarget.id }),
    })
    const result = await res.json()
    if (!res.ok) {
      setToast({ type: 'error', text: result.error || 'Gagal menghapus staff' })
    } else {
      setToast({ type: 'success', text: 'Staff berhasil dihapus dari toko' })
      fetchMembers()
    }
    setRemoveTarget(null)
  }

  if (access === 'checking') return null
  if (access === 'denied') return <AccessDenied message="Kelola Staff cuma bisa diakses oleh Owner toko." />

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 pb-10">
      <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/akun" className="p-2 -ml-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="font-bold text-lg text-gray-900 dark:text-gray-100">Kelola Staff</h1>
            <p className="text-xs text-gray-400">Undang dan kelola staff yang bantu jaga toko</p>
          </div>
        </div>

        {/* Form undang */}
        <form onSubmit={handleInvite} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-5">
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Undang Staff Baru</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <input
                type="email"
                placeholder="email@staff.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputCls(!!error)}
              />
              <FieldError msg={error} />
            </div>
            <button
              type="submit"
              disabled={inviting}
              className="flex items-center justify-center gap-2 bg-terong text-white text-sm px-4 py-2.5 rounded-xl hover:opacity-90 transition-colors font-medium disabled:opacity-60 shrink-0 h-fit"
            >
              <UserPlus size={16} /> {inviting ? 'Mengirim...' : 'Undang'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Staff bakal nerima email undangan buat verifikasi &amp; bikin password sendiri.
          </p>
        </form>

        {/* List member */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {loading ? (
            <div className="p-5 text-sm text-gray-400 text-center">Memuat...</div>
          ) : members.length === 0 ? (
            <div className="p-5 text-sm text-gray-400 text-center">Belum ada staff</div>
          ) : (
            members.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-4">
                <span className="w-10 h-10 rounded-full bg-terong-soft flex items-center justify-center shrink-0">
                  {m.role === 'owner' ? (
                    <ShieldCheck size={17} className="text-terong dark:text-terong-light" />
                  ) : (
                    <Mail size={17} className="text-terong dark:text-terong-light" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                    {m.profiles?.name || (m.role === 'owner' ? 'Anda (Owner)' : 'Staff')}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    {m.role === 'owner' ? 'Owner' : 'Staff'}
                    {m.status === 'invited' && (
                      <span className="inline-flex items-center gap-1 text-amber-c">
                        <Clock size={11} /> Menunggu diterima
                      </span>
                    )}
                  </p>
                </div>
                {m.role === 'staff' && (
                  <button
                    onClick={() => setRemoveTarget(m)}
                    className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-gray-400 hover:text-rose-500 transition-colors shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Konfirmasi hapus staff */}
      {removeTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={() => setRemoveTarget(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 max-w-xs w-full" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">Hapus staff ini?</p>
            <p className="text-xs text-gray-400 mb-4">
              {removeTarget.profiles?.name || 'Staff ini'} bakal kehilangan akses ke toko. Aksi ini gak bisa dibatalin.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setRemoveTarget(null)} className="flex-1 text-sm py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">Batal</button>
              <button onClick={handleRemove} className="flex-1 text-sm py-2 rounded-xl bg-merah-c text-white">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl text-sm font-medium text-white shadow-lg z-50 ${toast.type === 'error' ? 'bg-merah-c' : 'bg-daun'}`}>
          {toast.text}
        </div>
      )}
    </div>
  )
}