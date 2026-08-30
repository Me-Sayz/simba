'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getStoreContext } from '@/lib/getUser'
import { LayoutDashboard, ChevronRight, LogOut, Settings, HelpCircle, Building2 } from 'lucide-react'

function KasirAkunSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 animate-pulse">
      <div className="flex flex-col items-center text-center pt-2 pb-5">
        <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800" />
        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-800 rounded mt-3" />
        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded mt-2" />
      </div>
      <div className="h-[74px] rounded-[20px] bg-gray-200 dark:bg-gray-800 mb-4" />
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[18px] overflow-hidden mb-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className={`flex items-center gap-3.5 px-5 py-4 ${i === 0 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
            <div className="w-11 h-11 rounded-[13px] bg-gray-200 dark:bg-gray-800 shrink-0" />
            <div className="flex-1">
              <div className="h-3.5 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-3 w-36 bg-gray-200 dark:bg-gray-800 rounded mt-2" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-[68px] rounded-[18px] bg-gray-200 dark:bg-gray-800" />
    </div>
  )
}

export default function KasirAkunPage() {
  const [profile, setProfile] = useState(null)
  const [storeName, setStoreName] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      const ctx = await getStoreContext()
      setStoreName(ctx?.storeName ?? null)
      setLoading(false)
    })()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initial = profile?.name?.[0]?.toUpperCase() || 'U'

  if (loading) return <KasirAkunSkeleton />

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="flex flex-col items-center text-center pt-2 pb-5">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} className="w-24 h-24 rounded-full object-cover border-4 border-terong-soft dark:border-gray-800" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-terong-soft dark:bg-gray-800 flex items-center justify-center font-bold text-3xl text-terong dark:text-terong-light border-4 border-terong-soft dark:border-gray-800">
            {initial}
          </div>
        )}
        <p className="font-bold text-lg text-gray-900 dark:text-gray-100 mt-3">{profile?.name || 'User'}</p>
        {storeName && (
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
            <Building2 size={11} /> {storeName}
          </p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Kasir aktif</p>
      </div>

      <Link
        href="/"
        className="w-full flex items-center gap-3.5 rounded-[20px] p-5 mb-4 border-[1.5px] border-dashed border-terong bg-terong-soft text-left"
      >
        <div className="w-11 h-11 rounded-[13px] bg-white flex items-center justify-center shrink-0 shadow-sm">
          <LayoutDashboard size={21} className="text-terong dark:text-terong-light" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm text-terong-deep dark:text-terong-light">Kembali ke Mode Monitoring</p>
          <p className="text-[11.5px] text-terong-deep/75 dark:text-terong-light/75">Lihat dashboard, stok &amp; laporan</p>
        </div>
        <ChevronRight size={18} className="text-terong dark:text-terong-light shrink-0" />
      </Link>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[18px] overflow-hidden mb-4">
        <Link href="/settings" className="flex items-center gap-3.5 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <span className="w-11 h-11 rounded-[13px] bg-terong-soft flex items-center justify-center shrink-0">
            <Settings size={19} className="text-terong dark:text-terong-light" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-gray-800 dark:text-gray-100">Pengaturan</span>
            <span className="block text-xs text-gray-400 mt-0.5">Atur preferensi aplikasi dan sistem</span>
          </span>
          <ChevronRight size={18} className="text-gray-400 shrink-0" />
        </Link>
        <Link href="/bantuan" className="flex items-center gap-3.5 px-5 py-4">
          <span className="w-11 h-11 rounded-[13px] bg-terong-soft flex items-center justify-center shrink-0">
            <HelpCircle size={19} className="text-terong dark:text-terong-light" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-gray-800 dark:text-gray-100">Bantuan</span>
            <span className="block text-xs text-gray-400 mt-0.5">FAQ dan pusat bantuan</span>
          </span>
          <ChevronRight size={18} className="text-gray-400 shrink-0" />
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[18px] overflow-hidden">
        <button onClick={handleLogout} className="w-full flex items-center gap-3.5 px-5 py-4 text-left">
          <span className="w-11 h-11 rounded-[13px] bg-merah-soft flex items-center justify-center shrink-0">
            <LogOut size={19} className="text-merah-c dark:text-merah-light" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-merah-c">Keluar</span>
            <span className="block text-xs text-merah-c/60 mt-0.5">Keluar dari akun ini</span>
          </span>
        </button>
      </div>
    </div>
  )
}