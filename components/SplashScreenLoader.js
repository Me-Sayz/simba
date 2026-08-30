'use client'
import dynamic from 'next/dynamic'

// SplashScreen baca sessionStorage (cuma ada di browser) — wajib di-load
// client-only (ssr: false) biar gak mismatch sama hasil render server.
const SplashScreen = dynamic(() => import('./SplashScreen'), { ssr: false })

export default function SplashScreenLoader() {
  return <SplashScreen />
}