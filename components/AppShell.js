'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { App } from '@capacitor/app'
import { WifiOff } from 'lucide-react'
import MonitoringNav from './MonitoringNav'
import KasirNav from './KasirNav'

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/auth/confirm', '/auth/reset-password', '/auth/callback']
const SHARED_PATHS = ['/settings', '/bantuan'] // halaman tunggal dipakai kedua mode
const MODE_KEY = 'simba_last_mode'

export default function AppShell() {
  const pathname = usePathname()
  const [lowStock, setLowStock] = useState(0)
  const [profile, setProfile] = useState(null)
  const [lastMode, setLastMode] = useState(null)
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine)

  const isAuthPage = AUTH_PATHS.includes(pathname)
  const isKasirPath = pathname.startsWith('/kasir')
  const isSharedPath = SHARED_PATHS.some(p => pathname.startsWith(p))

  useEffect(() => {
    const goOffline = () => setIsOffline(true)
    const goOnline = () => setIsOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  useEffect(() => {
    let listenerHandle
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back()
      } else {
        App.exitApp()
      }
    }).then(handle => { listenerHandle = handle })

    return () => { listenerHandle?.remove() }
  }, [])

  useEffect(() => {
    if (isAuthPage) return
    Promise.resolve().then(() => {
      if (isKasirPath) {
        sessionStorage.setItem(MODE_KEY, 'kasir')
      } else if (!isSharedPath) {
        sessionStorage.setItem(MODE_KEY, 'monitoring')
      }
      setLastMode(sessionStorage.getItem(MODE_KEY))
    })
  }, [pathname, isAuthPage, isKasirPath, isSharedPath])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: products } = await supabase.from('products').select('stock, min_stock')
    setLowStock((products || []).filter(p => p.stock <= p.min_stock).length)

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(profileData)
  }

  useEffect(() => {
    if (isAuthPage) return
    Promise.resolve().then(() => fetchData())
  }, [pathname, isAuthPage])

  const offlineBanner = isOffline && (
    <div className="fixed top-0 inset-x-0 z-[100] bg-amber-soft text-amber-c dark:text-amber-light text-xs font-medium py-2 px-4 flex items-center justify-center gap-1.5">
      <WifiOff size={13} />
      Tidak ada koneksi internet
    </div>
  )

  if (isAuthPage) return offlineBanner

  const isKasir = isKasirPath || (isSharedPath && lastMode === 'kasir')

  return (
    <>
      {offlineBanner}
      <div key={isKasir ? 'kasir' : 'monitoring'} className="animate-nav-fade">
        {isKasir
          ? <KasirNav profile={profile} />
          : <MonitoringNav profile={profile} lowStock={lowStock} />}
      </div>
    </>
  )
}