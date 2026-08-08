'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ShoppingCart, ChevronRight, Settings, HelpCircle, LogOut, Pencil } from 'lucide-react'

export default function AkunPage() {
  const [profile, setProfile] = useState(null)
  const [email, setEmail] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setEmail(user.email)
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(data)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initial = profile?.name?.[0]?.toUpperCase() || 'U'

  return (
    <div className="max-w-xl mx-auto px-4 py-6 md:py-8">
      {/* Header profil */}
      <div className="bg-gradient-to-br from-terong to-terong-deep rounded-[22px] p-6 flex items-center gap-4 text-white mb-5">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} className="w-[60px] h-[60px] rounded-full object-cover border-2 border-white/40 shrink-0" />
        ) : (
          <div className="w-[60px] h-[60px] rounded-full bg-white/15 flex items-center justify-center font-bold text-2xl border-2 border-white/40 shrink-0">
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[16.5px] truncate">{profile?.store_name || profile?.name || 'Toko Anda'}</p>
          <p className="text-xs opacity-80 truncate">{email}</p>
        </div>
        <Link href="/profile" className="w-9 h-9 rounded-[10px] bg-white/15 flex items-center justify-center shrink-0">
          <Pencil size={16} />
        </Link>
      </div>

      {/* Pindah mode */}
      <Link
        href="/kasir/product"
        className="w-full flex items-center gap-3.5 rounded-[20px] p-5 mb-4 border-[1.5px] border-dashed border-terong bg-terong-soft text-left"
      >
        <div className="w-11 h-11 rounded-[13px] bg-white flex items-center justify-center shrink-0 shadow-sm">
          <ShoppingCart size={21} className="text-terong" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm text-terong-deep">Pindah ke Mode Kasir</p>
          <p className="text-[11.5px] text-terong-deep/75">Mulai transaksi &amp; terima pembayaran</p>
        </div>
        <ChevronRight size={18} className="text-terong shrink-0" />
      </Link>

      {/* Menu */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[18px] overflow-hidden mb-4">
        <Link href="/settings" className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
          <span className="w-9 h-9 rounded-[11px] bg-terong-soft flex items-center justify-center shrink-0">
            <Settings size={17} className="text-terong" />
          </span>
          <span className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-100">Pengaturan</span>
          <ChevronRight size={16} className="text-gray-400" />
        </Link>
        <Link href="/bantuan" className="flex items-center gap-3 px-4 py-3.5">
          <span className="w-9 h-9 rounded-[11px] bg-terong-soft flex items-center justify-center shrink-0">
            <HelpCircle size={17} className="text-terong" />
          </span>
          <span className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-100">Bantuan</span>
          <ChevronRight size={16} className="text-gray-400" />
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[18px] overflow-hidden">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
          <span className="w-9 h-9 rounded-[11px] bg-merah-soft flex items-center justify-center shrink-0">
            <LogOut size={17} className="text-merah-c" />
          </span>
          <span className="flex-1 text-sm font-semibold text-merah-c">Keluar</span>
        </button>
      </div>
    </div>
  )
}