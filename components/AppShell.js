'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import MonitoringNav from './MonitoringNav'
import KasirNav from './KasirNav'

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/auth/confirm', '/auth/reset-password', '/auth/callback']

export default function AppShell() {
  const pathname = usePathname()
  const [lowStock, setLowStock] = useState(0)
  const [profile, setProfile] = useState(null)

  const isAuthPage = AUTH_PATHS.includes(pathname)
  const isKasir = pathname.startsWith('/kasir')

  useEffect(() => {
    if (isAuthPage) return
    fetchData()
  }, [pathname])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: products } = await supabase.from('products').select('stock, min_stock')
    setLowStock((products || []).filter(p => p.stock <= p.min_stock).length)

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(profileData)
  }

  if (isAuthPage) return null

  return isKasir
    ? <KasirNav profile={profile} />
    : <MonitoringNav profile={profile} lowStock={lowStock} />
}