'use client'
import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { App } from '@capacitor/app'
import { Network } from '@capacitor/network'
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
  const [isOffline, setIsOffline] = useState(false)

  const isAuthPage = AUTH_PATHS.includes(pathname)
  const isKasirPath = pathname.startsWith('/kasir')
  const isSharedPath = SHARED_PATHS.some(p => pathname.startsWith(p))

  const isAuthPageRef = useRef(isAuthPage)
  useEffect(() => { isAuthPageRef.current = isAuthPage }, [isAuthPage])

  useEffect(() => {
    let listenerHandle
    // Pakai plugin native @capacitor/network, bukan navigator.onLine/window
    // 'offline' event browser — event itu gak reliable di Android WebView.
    // Plugin ini baca status koneksi langsung dari sistem Android.
    Network.getStatus().then(status => setIsOffline(!status.connected))
    Network.addListener('networkStatusChange', status => setIsOffline(!status.connected))
      .then(handle => { listenerHandle = handle })
    return () => { listenerHandle?.remove() }
  }, [])

  useEffect(() => {
    let listenerHandle
    App.addListener('backButton', ({ canGoBack }) => {
      // Di halaman auth (Login/Register/dst), Back selalu keluar app —
      // gak peduli history di belakangnya (misal bekas halaman Akun
      // sebelum logout), karena halaman itu udah gak valid lagi diakses.
      if (isAuthPageRef.current) {
        App.exitApp()
      } else if (canGoBack) {
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