'use client'
import { useEffect, useState } from 'react'

const SESSION_KEY = 'simba_splash_shown'
const DISPLAY_MS = 1500

function alreadyShown() {
  return typeof window !== 'undefined' && !!sessionStorage.getItem(SESSION_KEY)
}

function isDesktopViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
}

export default function SplashScreen() {
  // dihitung langsung pas render pertama (bukan di useEffect) — biar splash-nya
  // udah kebawa di frame PALING AWAL, gak ada celah konten asli kebuka duluan
  const [show, setShow] = useState(() => !alreadyShown())
  const [visible, setVisible] = useState(() => !alreadyShown())
  const [isDesktop, setIsDesktop] = useState(() => isDesktopViewport())

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setVisible(false)
    setTimeout(() => setShow(false), 300)
  }

  useEffect(() => {
    if (!show) return
    const timeout = setTimeout(dismiss, DISPLAY_MS)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const updateIsDesktop = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', updateIsDesktop)
    return () => mq.removeEventListener('change', updateIsDesktop)
  }, [])

  if (!show) return null

  return (
    <div
      className={`fixed inset-0 z-[999] flex items-center justify-center bg-white transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {isDesktop ? (
        // logo-horizontal.png rasio 3:1 — dijaga persis biar gak gepeng/melar
        <img src="/logo-horizontal.png" alt="SIMBA" className="w-[540px] h-[180px] object-contain" />
      ) : (
        // logo.png rasio 1:1
        <img src="/logo.png" alt="SIMBA" className="w-44 h-44 object-contain" />
      )}
    </div>
  )
}