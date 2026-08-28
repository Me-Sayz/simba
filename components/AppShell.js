'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
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

  const isAuthPage = AUTH_PATHS.includes(pathname)
  const isKasirPath = pathname.startsWith('/kasir')
  const isSharedPath = SHARED_PATHS.some(p => pathname.startsWith(p))

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

  if (isAuthPage) return null

  const isKasir = isKasirPath || (isSharedPath && lastMode === 'kasir')

  return isKasir
    ? <KasirNav profile={profile} />
    : <MonitoringNav profile={profile} lowStock={lowStock} />
}