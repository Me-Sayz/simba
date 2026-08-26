'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getStoreContext } from '@/lib/getUser'
import { useRouter } from 'next/navigation'
import {
  Camera, User, Store, Mail, Lock, AlertTriangle,
  Eye, EyeOff, Check, CheckCircle2, ChevronRight, Shield,
  Clock, Monitor, Crown, Pencil, X, LogIn, Building2
} from 'lucide-react'

function getStoragePath(url) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const match = parsed.pathname.match(/\/avatars\/(.+)/)
    return match ? match[1] : null
  } catch { return null }
}

function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  if (!msg) return null
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium text-white ${msg.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
      {msg.text}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X size={16} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState({ name: '', store_name: '', avatar_url: '' })
  const [email, setEmail] = useState('')
  const [joinedAt, setJoinedAt] = useState('')
  const [lastSign, setLastSign] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [toast, setToast] = useState(null)
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null)
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState(null)
  const [showRemoveAvatarConfirm, setShowRemoveAvatarConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', store_name: '' })
  const [isOwner, setIsOwner] = useState(false)
  const [storeId, setStoreId] = useState(null)
  const [storeName, setStoreName] = useState('')
  const [hasPassword, setHasPassword] = useState(true)
  const [modal, setModal] = useState(null)
  const [emailStep, setEmailStep] = useState(1)
  const [emailOtp, setEmailOtp] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', newPass: '', confirm: '' })
  const [pwOtpStep, setPwOtpStep] = useState(1)
  const [pwOtp, setPwOtp] = useState('')
  const [pwOtpLoading, setPwOtpLoading] = useState(false)
  const [showPw, setShowPw] = useState({ current: false, newPass: false, confirm: false })
  const [pwError, setPwError] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteOtpStep, setDeleteOtpStep] = useState(1)
  const [deleteOtp, setDeleteOtp] = useState('')
  const [deleteOtpLoading, setDeleteOtpLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeletePw, setShowDeletePw] = useState(false)

  useEffect(() => { fetchProfile() }, [])

  async function fetchProfile() {
    setFetching(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setEmail(user?.email || '')
    setJoinedAt(user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-')
    setLastSign(user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-')
    // user yang login via Google doang (belum pernah set password) gak punya identity 'email'
    setHasPassword((user?.identities || []).some(i => i.provider === 'email'))
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) { setProfile(data); setAvatarPreview(data.avatar_url || null) }
    const ctx = await getStoreContext()
    if (ctx) { setIsOwner(ctx.isOwner); setStoreId(ctx.storeId); setStoreName(ctx.storeName || '') }
    setFetching(false)
  }

  function openEditModal() {
    setEditForm({ name: profile.name || '', store_name: storeName || '' })  
    setPendingAvatarFile(null)
    setPendingAvatarPreview(null)
    setEditModal(true)
  }

  function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setToast({ type: 'error', text: 'Ukuran foto maksimal 2MB' }); return }
    setPendingAvatarFile(file)
    setPendingAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSaveProfile() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    let avatar_url = profile.avatar_url
    if (pendingAvatarFile) {
      const fileName = `${user.id}/avatar-${Date.now()}-${pendingAvatarFile.name}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, pendingAvatarFile)
      if (uploadError) { setToast({ type: 'error', text: 'Gagal upload foto' }); setLoading(false); return }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      if (profile.avatar_url) {
        const oldPath = getStoragePath(profile.avatar_url)
        if (oldPath) await supabase.storage.from('avatars').remove([oldPath])
      }
      avatar_url = urlData.publicUrl
    }
    const { error } = await supabase.from('profiles').update({
      name: editForm.name, avatar_url, updated_at: new Date().toISOString()
    }).eq('id', user.id)
    if (error) { setToast({ type: 'error', text: 'Gagal menyimpan: ' + error.message }) }
    else {
      let nextStoreName = storeName
      if (isOwner && editForm.store_name !== storeName) {
        const { error: storeError } = await supabase.from('stores').update({ name: editForm.store_name }).eq('id', storeId)
        if (storeError) {
          setToast({ type: 'error', text: 'Nama disimpan, tapi gagal update nama toko: ' + storeError.message })
        } else {
          nextStoreName = editForm.store_name
          setStoreName(editForm.store_name)
        }
      }
      setProfile(p => ({ ...p, name: editForm.name, avatar_url }))
      setAvatarPreview(avatar_url)
      setPendingAvatarFile(null); setPendingAvatarPreview(null)
      setToast({ type: 'success', text: 'Profil berhasil disimpan' })
      setEditModal(false)
    }
    setLoading(false)
  }

  async function handleRemoveAvatar() {
    if (!profile.avatar_url) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const oldPath = getStoragePath(profile.avatar_url)
    if (oldPath) {
      const { error } = await supabase.storage.from('avatars').remove([oldPath])
      if (error) { setToast({ type: 'error', text: 'Gagal menghapus foto' }); setLoading(false); return }
    }
    await supabase.from('profiles').update({ avatar_url: null, updated_at: new Date().toISOString() }).eq('id', user.id)
    setProfile(p => ({ ...p, avatar_url: null }))
    setAvatarPreview(null); setPendingAvatarFile(null); setPendingAvatarPreview(null)
    setToast({ type: 'success', text: 'Foto profil dihapus' })
    setLoading(false)
  }

  async function handleSendOtp() {
    setOtpLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: undefined,
      }
    })
    if (error) setToast({ type: 'error', text: error.message })
    else { setEmailStep(2); setToast({ type: 'success', text: 'Kode OTP dikirim ke email kamu' }) }
    setOtpLoading(false)
  }

  async function handleVerifyOtp() {
    setOtpLoading(true)
    const { error } = await supabase.auth.verifyOtp({ email, token: emailOtp, type: 'email' })
    if (error) setToast({ type: 'error', text: 'Kode OTP salah atau kadaluarsa' })
    else { setEmailStep(3); setToast({ type: 'success', text: 'OTP terverifikasi' }) }
    setOtpLoading(false)
  }

  async function handleUpdateEmail() {
    if (!newEmail) return
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) setToast({ type: 'error', text: error.message })
    else { setToast({ type: 'success', text: 'Link konfirmasi dikirim ke email baru' }); setModal(null); setEmailStep(1); setEmailOtp(''); setNewEmail('') }
  }

  async function handleSendPwOtp() {
    setPwOtpLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
    if (error) setPwError(error.message)
    else { setPwOtpStep(2); setPwError('') }
    setPwOtpLoading(false)
  }

  async function handleVerifyPwOtp() {
    setPwOtpLoading(true)
    const { error } = await supabase.auth.verifyOtp({ email, token: pwOtp, type: 'email' })
    if (error) setPwError('Kode OTP salah atau kadaluarsa')
    else { setPwOtpStep(3); setPwError('') }
    setPwOtpLoading(false)
  }

  async function handleChangePassword() {
    setPwError('')
    if (hasPassword && !pwForm.current) { setPwError('Masukkan password saat ini'); return }
    if (pwForm.newPass.length < 6) { setPwError('Password baru minimal 6 karakter'); return }
    if (pwForm.newPass !== pwForm.confirm) { setPwError('Konfirmasi password tidak cocok'); return }
    setPwLoading(true)
    if (hasPassword) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: pwForm.current })
      if (signInError) { setPwError('Password saat ini salah'); setPwLoading(false); return }
    }
    // akun tanpa password (Google) udah wajib lolos verifikasi OTP (pwOtpStep 3) sebelum sampai sini
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPass })
    if (error) setPwError(error.message)
    else {
      setToast({ type: 'success', text: hasPassword ? 'Password berhasil diubah' : 'Password berhasil dibuat' })
      setModal(null)
      setPwForm({ current: '', newPass: '', confirm: '' })
      setPwOtpStep(1); setPwOtp('')
      setHasPassword(true)
    }
    setPwLoading(false)
  }

  async function handleResetPassword() {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm`,
    })
    if (error) setToast({ type: 'error', text: error.message })
    else { setToast({ type: 'success', text: 'Link reset password dikirim ke email' }); setModal(null) }
  }

  async function handleSendDeleteOtp() {
    setDeleteOtpLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
    if (error) setToast({ type: 'error', text: error.message })
    else setDeleteOtpStep(2)
    setDeleteOtpLoading(false)
  }

  async function handleVerifyDeleteOtp() {
    setDeleteOtpLoading(true)
    const { error } = await supabase.auth.verifyOtp({ email, token: deleteOtp, type: 'email' })
    if (error) setToast({ type: 'error', text: 'Kode OTP salah atau kadaluarsa' })
    else setDeleteOtpStep(3)
    setDeleteOtpLoading(false)
  }

  async function handleDeleteAccount() {
    if (deleteInput !== 'HAPUS') return
    if (hasPassword && !deletePassword) return
    if (!hasPassword && deleteOtpStep !== 3) return
    setDeleteLoading(true)

    if (hasPassword) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: deletePassword })
      if (signInError) {
        setToast({ type: 'error', text: 'Password salah' })
        setDeleteLoading(false)
        return
      }
    }
    // akun tanpa password (Google) udah wajib lolos verifikasi OTP (deleteOtpStep 3) sebelum sampai sini

    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/delete-account', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
  
    if (!res.ok) {
      const data = await res.json()
      setToast({ type: 'error', text: data.error || 'Gagal menghapus akun' })
      setDeleteLoading(false)
      return
    }
  
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = profile.name?.[0]?.toUpperCase() || email?.[0]?.toUpperCase() || '?'
  const currentAvatarInModal = pendingAvatarPreview || avatarPreview

  if (fetching) return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
      <p className="text-sm text-gray-400">Memuat profil...</p>
    </div>
  )

  const inputCls = 'border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-terong'

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      {/* Edit Profile Modal */}
      {editModal && (
        <Modal title="Edit Profil" onClose={() => {
          const hasChanges = editForm.name !== profile.name || editForm.store_name !== storeName || pendingAvatarFile !== null
          if (hasChanges) { setShowCancelConfirm(true); return }
          setEditModal(false)
        }}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                {currentAvatarInModal
                  ? <img src={currentAvatarInModal} className="w-20 h-20 rounded-full object-cover" />
                  : <div className="w-20 h-20 rounded-full bg-terong-soft flex items-center justify-center text-terong-deep dark:text-terong-light font-bold text-2xl">{initials}</div>
                }
                <label className={`absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1.5 shadow-sm ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  <Camera size={12} className="text-gray-500 dark:text-gray-400" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={loading} />
                </label>
              </div>
              {(avatarPreview || pendingAvatarPreview) && (
                <button onClick={() => setShowRemoveAvatarConfirm(true)} className="text-xs text-rose-400 hover:text-rose-600 hover:underline">Hapus foto profil</button>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Nama Lengkap</label>
              <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Nama kamu" className={inputCls} />
            </div>
            {isOwner ? (
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Nama Toko / Bisnis</label>
                <input value={editForm.store_name} onChange={e => setEditForm(f => ({ ...f, store_name: e.target.value }))} placeholder="Nama toko atau bisnis" className={inputCls} />
              </div>
            ) : (
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Nama Toko / Bisnis</label>
                <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5">{storeName || '-'}</p>
                <p className="text-xs text-gray-400 mt-1">Nama toko cuma bisa diubah oleh Owner</p>
              </div>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500">Untuk ganti email, gunakan menu Keamanan Akun.</p>
            <div className="flex gap-2">
              <button onClick={() => {
                const hasChanges = editForm.name !== profile.name || editForm.store_name !== storeName || pendingAvatarFile !== null
                if (hasChanges) { setShowCancelConfirm(true); return }
                setEditModal(false)
              }} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">Batal</button>
              <button onClick={handleSaveProfile} disabled={loading} className="flex-1 bg-terong text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60">
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showCancelConfirm && (
        <Modal title="Batalkan Perubahan?" onClose={() => setShowCancelConfirm(false)}>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Perubahan yang belum disimpan akan hilang.</p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowCancelConfirm(false)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm text-gray-600 dark:text-gray-400">Tidak</button>
              <button onClick={() => { setShowCancelConfirm(false); setEditModal(false); setPendingAvatarFile(null); setPendingAvatarPreview(null) }} className="flex-1 bg-rose-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-rose-600">Batalkan</button>
            </div>
          </div>
        </Modal>
      )}

      {showRemoveAvatarConfirm && (
        <Modal title="Hapus Foto Profil" onClose={() => setShowRemoveAvatarConfirm(false)}>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Foto profil akan dihapus permanen. Yakin?</p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowRemoveAvatarConfirm(false)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm text-gray-600 dark:text-gray-400">Batal</button>
              <button onClick={() => { setShowRemoveAvatarConfirm(false); handleRemoveAvatar() }} className="flex-1 bg-rose-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-rose-600">Hapus</button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'email' && (
        <Modal title="Ganti Email" onClose={() => { setModal(null); setEmailStep(1); setEmailOtp(''); setNewEmail('') }}>
          {emailStep === 1 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Kode OTP akan dikirim ke email aktif kamu.</p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-sm text-gray-700 dark:text-gray-200 font-medium">{email}</div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm text-gray-600 dark:text-gray-400">Batal</button>
                <button onClick={handleSendOtp} disabled={otpLoading} className="flex-1 bg-terong text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90">{otpLoading ? 'Mengirim...' : 'Kirim Kode OTP'}</button>
              </div>
            </div>
          )}
          {emailStep === 2 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Masukkan kode OTP yang dikirim ke <span className="font-medium text-gray-700 dark:text-gray-200">{email}</span></p>
              <input value={emailOtp} onChange={e => setEmailOtp(e.target.value)} placeholder="Masukkan kode OTP" className={inputCls + ' text-center tracking-widest text-lg'} />
              <button onClick={handleSendOtp} className="text-xs text-terong hover:underline text-center">Kirim ulang kode</button>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEmailStep(1)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm text-gray-600 dark:text-gray-400">Kembali</button>
                <button onClick={handleVerifyOtp} disabled={otpLoading || !emailOtp} className="flex-1 bg-terong text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50">{otpLoading ? 'Memverifikasi...' : 'Verifikasi'}</button>
              </div>
            </div>
          )}
          {emailStep === 3 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950 p-3 rounded-xl">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-700 dark:text-emerald-400">Identitas terverifikasi. Masukkan email baru.</p>
              </div>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@baru.com" className={inputCls} />
              <p className="text-xs text-gray-400">Link konfirmasi akan dikirim ke email baru.</p>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEmailStep(2)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm text-gray-600 dark:text-gray-400">Kembali</button>
                <button onClick={handleUpdateEmail} disabled={!newEmail} className="flex-1 bg-terong text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50">Kirim Konfirmasi</button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {modal === 'password' && (
        <Modal title={hasPassword ? 'Ganti Password' : 'Buat Password'} onClose={() => { setModal(null); setPwForm({ current: '', newPass: '', confirm: '' }); setPwError(''); setPwOtpStep(1); setPwOtp('') }}>
          {!hasPassword && pwOtpStep === 1 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Akun kamu login pakai Google dan belum punya password. Buat password biar bisa login pakai email juga — verifikasi dulu lewat kode OTP yang dikirim ke email kamu.</p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-sm text-gray-700 dark:text-gray-200 font-medium">{email}</div>
              {pwError && <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950 p-2 rounded-lg">{pwError}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm text-gray-600 dark:text-gray-400">Batal</button>
                <button onClick={handleSendPwOtp} disabled={pwOtpLoading} className="flex-1 bg-terong text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90">{pwOtpLoading ? 'Mengirim...' : 'Kirim Kode OTP'}</button>
              </div>
            </div>
          )}
          {!hasPassword && pwOtpStep === 2 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Masukkan kode OTP yang dikirim ke <span className="font-medium text-gray-700 dark:text-gray-200">{email}</span></p>
              <input value={pwOtp} onChange={e => setPwOtp(e.target.value)} placeholder="Masukkan kode OTP" className={inputCls + ' text-center tracking-widest text-lg'} />
              {pwError && <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950 p-2 rounded-lg">{pwError}</p>}
              <button onClick={handleSendPwOtp} className="text-xs text-terong hover:underline text-center">Kirim ulang kode</button>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setPwOtpStep(1)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm text-gray-600 dark:text-gray-400">Kembali</button>
                <button onClick={handleVerifyPwOtp} disabled={pwOtpLoading || !pwOtp} className="flex-1 bg-terong text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50">{pwOtpLoading ? 'Memverifikasi...' : 'Verifikasi'}</button>
              </div>
            </div>
          )}
          {(hasPassword || pwOtpStep === 3) && (
          <div className="flex flex-col gap-3">
            {!hasPassword && (
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950 p-3 rounded-xl">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-700 dark:text-emerald-400">Identitas terverifikasi. Buat password baru kamu.</p>
              </div>
            )}
            {[
              ...(hasPassword ? [{ key: 'current', label: 'Password Saat Ini' }] : []),
              { key: 'newPass', label: hasPassword ? 'Password Baru' : 'Password' },
              { key: 'confirm', label: 'Konfirmasi Password' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{label}</label>
                <div className="relative">
                  <input type={showPw[key] ? 'text' : 'password'} placeholder="••••••••"
                    value={pwForm[key]} onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                    className={inputCls + ' pr-10'} />
                  <button type="button" onClick={() => setShowPw(s => ({ ...s, [key]: !s[key] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            ))}
            {pwError && <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950 p-2 rounded-lg">{pwError}</p>}
            {hasPassword && (
              <button onClick={handleResetPassword} className="text-xs text-terong hover:underline text-left">Lupa password? Kirim link reset ke email</button>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={() => { setModal(null); setPwForm({ current: '', newPass: '', confirm: '' }); setPwError('') }} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm text-gray-600 dark:text-gray-400">Batal</button>
              <button onClick={handleChangePassword} disabled={pwLoading} className="flex-1 bg-terong text-white rounded-xl py-2.5 text-sm font-medium hover:opacity-90">{pwLoading ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
          )}
        </Modal>
      )}

      {modal === 'delete' && (
        <Modal title="Hapus Akun" onClose={() => { setModal(null); setDeleteInput(''); setDeletePassword(''); setShowDeletePw(false); setDeleteOtpStep(1); setDeleteOtp('') }}>
          {!hasPassword && deleteOtpStep === 1 && (
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={20} className="text-rose-500" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Akun kamu login pakai Google. Verifikasi dulu lewat kode OTP yang dikirim ke email kamu sebelum lanjut hapus akun.</p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-sm text-gray-700 dark:text-gray-200 font-medium">{email}</div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm text-gray-600 dark:text-gray-400">Batal</button>
                <button onClick={handleSendDeleteOtp} disabled={deleteOtpLoading} className="flex-1 bg-rose-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-rose-600">{deleteOtpLoading ? 'Mengirim...' : 'Kirim Kode OTP'}</button>
              </div>
            </div>
          )}
          {!hasPassword && deleteOtpStep === 2 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Masukkan kode OTP yang dikirim ke <span className="font-medium text-gray-700 dark:text-gray-200">{email}</span></p>
              <input value={deleteOtp} onChange={e => setDeleteOtp(e.target.value)} placeholder="Masukkan kode OTP" className={inputCls + ' text-center tracking-widest text-lg'} />
              <button onClick={handleSendDeleteOtp} className="text-xs text-terong hover:underline text-center">Kirim ulang kode</button>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setDeleteOtpStep(1)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm text-gray-600 dark:text-gray-400">Kembali</button>
                <button onClick={handleVerifyDeleteOtp} disabled={deleteOtpLoading || !deleteOtp} className="flex-1 bg-rose-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-rose-600 disabled:opacity-50">{deleteOtpLoading ? 'Memverifikasi...' : 'Verifikasi'}</button>
              </div>
            </div>
          )}
          {(hasPassword || deleteOtpStep === 3) && (
          <div className="flex flex-col gap-3">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={20} className="text-rose-500" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Semua data akan dihapus permanen dan <span className="font-semibold text-rose-500">tidak bisa dipulihkan</span>.</p>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ketik <span className="font-bold text-rose-500">HAPUS</span> untuk konfirmasi:</p>
              <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder="HAPUS" className={inputCls} />
            </div>
            {hasPassword ? (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Masukkan password kamu:</p>
                <div className="relative">
                  <input
                    type={showDeletePw ? 'text' : 'password'}
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputCls + ' pr-10'}
                  />
                  <button type="button" onClick={() => setShowDeletePw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showDeletePw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950 p-3 rounded-xl">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-700 dark:text-emerald-400">Identitas terverifikasi lewat OTP.</p>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={() => { setModal(null); setDeleteInput(''); setDeletePassword(''); setShowDeletePw(false); setDeleteOtpStep(1); setDeleteOtp('') }} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm text-gray-600 dark:text-gray-400">Batal</button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteInput !== 'HAPUS' || (hasPassword && !deletePassword) || deleteLoading}
                className="flex-1 bg-rose-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-rose-600 disabled:opacity-40"
              >
                {deleteLoading ? 'Menghapus...' : 'Hapus Akun'}
              </button>
            </div>
          </div>
          )}
        </Modal>
      )}

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profil & Akun</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Kelola informasi profil dan keamanan akun</p>
        </div>

        {/* Hero Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-t-4 border-t-terong border border-gray-200 dark:border-gray-800 overflow-hidden mb-5">
          <div className="px-6 py-5 flex items-center gap-4">
            <div className="relative shrink-0">
              {avatarPreview
                ? <img src={avatarPreview} className="w-[72px] h-[72px] rounded-full object-cover ring-4 ring-gray-100 dark:ring-gray-800" />
                : <div className="w-[72px] h-[72px] rounded-full bg-terong flex items-center justify-center text-white font-bold text-2xl ring-4 ring-gray-100 dark:ring-gray-800">
                    {initials}
                  </div>
              }
              <div className="absolute bottom-0.5 right-0.5 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                <Check size={10} className="text-white" strokeWidth={3} />
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg leading-tight">{profile.name || 'User'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-sm text-gray-400">{email}</p>
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" strokeWidth={2.5} />
              </div>
              {storeName && (
                <span className="inline-flex items-center gap-1.5 text-xs bg-terong-soft text-terong-deep dark:text-terong-light px-2.5 py-1 rounded-full mt-2 font-medium">
                  <Building2 size={11} /> {storeName}
                </span>
              )}
            </div>
            <button onClick={openEditModal}
              className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors shrink-0">
              <Pencil size={14} />
              <span className="hidden sm:inline text-sm font-medium">Edit profil</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

          {/* Informasi Profil */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Informasi profil</p>
            <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
              {[
                { icon: User, label: 'Nama lengkap', value: profile.name },
                { icon: Building2, label: 'Nama toko / bisnis', value: storeName },
                { icon: Mail, label: 'Email', value: email },
                { icon: Clock, label: 'Bergabung sejak', value: joinedAt },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mt-0.5">{value || '-'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {/* Keamanan */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Keamanan akun</p>
              <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
                {[
                  { icon: Mail, label: 'Ganti email', desc: 'Ubah alamat email akun', key: 'email' },
                  { icon: Lock, label: hasPassword ? 'Ganti password' : 'Buat password', desc: hasPassword ? 'Ubah password secara berkala' : 'Tambahin password biar bisa login pakai email', key: 'password' },
                ].map(({ icon: Icon, label, desc, key }) => (
                  <button key={key} onClick={() => setModal(key)}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 w-full text-left hover:opacity-70 transition-opacity">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                      <Icon size={14} className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{label}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</p>
                    </div>
                    <ChevronRight size={15} className="text-gray-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Info Akun */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Info akun</p>
              <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
                {[
                  { icon: Crown, label: 'Role akun', value: <span className="text-xs font-medium bg-terong-soft text-terong-deep dark:text-terong-light px-2.5 py-1 rounded-full">{isOwner ? 'Owner' : 'Staff'}</span> },
                  { icon: LogIn, label: 'Login terakhir', value: <span className="text-sm text-gray-600 dark:text-gray-300">{lastSign}</span> },
                  { icon: Monitor, label: 'Perangkat', value: <span className="text-sm text-gray-600 dark:text-gray-300">Browser</span> },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                      <Icon size={14} className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-200 flex-1">{label}</p>
                    {value}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-rose-200 dark:border-rose-900 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-rose-50 dark:bg-rose-950 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle size={16} className="text-rose-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-rose-600">Zona berbahaya</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Semua data dihapus secara permanen dari sistem</p>
            </div>
          </div>
          <button onClick={() => setModal('delete')}
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white text-sm px-4 py-2 rounded-xl transition-colors font-medium shrink-0">
            <AlertTriangle size={13} /> Hapus Akun
          </button>
        </div>
      </div>
    </div>
  )
}