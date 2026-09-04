'use client'
import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Capacitor } from '@capacitor/core'

const ERROR_MESSAGES = {
  oauth_failed: 'Login Google gagal. Coba lagi ya.',
  invalid_link: 'Link ini sudah tidak berlaku atau kadaluarsa. Minta link baru.',
}

/* Inventory Illustration SVG */
function InventoryIllustration() {
  return (
    <svg viewBox="0 0 420 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '380px' }}>
      <ellipse cx="210" cy="268" rx="130" ry="22" fill="#3b82f6" fillOpacity="0.12" />

      {/* Main box */}
      <g filter="url(#boxShadow)">
        <rect x="120" y="130" width="180" height="128" rx="12" fill="url(#boxGrad)" />
        <rect x="120" y="130" width="180" height="128" rx="12" stroke="#60a5fa" strokeWidth="1.5" strokeOpacity="0.45" />
        <line x1="210" y1="130" x2="210" y2="258" stroke="#60a5fa" strokeWidth="1.5" strokeOpacity="0.35" />
        <line x1="120" y1="170" x2="300" y2="170" stroke="#60a5fa" strokeWidth="1.5" strokeOpacity="0.35" />
        <text x="210" y="158" textAnchor="middle" fill="#93c5fd" fontSize="16" fontFamily="sans-serif" fontWeight="700">S</text>
        <text x="165" y="224" textAnchor="middle" fill="#bfdbfe" fontSize="10" fontFamily="sans-serif">SKU-001</text>
        <text x="255" y="224" textAnchor="middle" fill="#bfdbfe" fontSize="10" fontFamily="sans-serif">SKU-002</text>
      </g>

      {/* Left small box */}
      <rect x="62" y="178" width="68" height="80" rx="8" fill="url(#boxGrad2)" stroke="#60a5fa" strokeWidth="1" strokeOpacity="0.35" />
      <line x1="62" y1="206" x2="130" y2="206" stroke="#60a5fa" strokeWidth="1" strokeOpacity="0.25" />

      {/* Right small box */}
      <rect x="290" y="178" width="68" height="80" rx="8" fill="url(#boxGrad2)" stroke="#60a5fa" strokeWidth="1" strokeOpacity="0.35" />
      <line x1="290" y1="206" x2="358" y2="206" stroke="#60a5fa" strokeWidth="1" strokeOpacity="0.25" />

      {/* Dashboard card top-right */}
      <rect x="248" y="32" width="148" height="88" rx="10" fill="#1e3a8a" fillOpacity="0.9" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.55" />
      <text x="262" y="55" fill="#93c5fd" fontSize="8.5" fontFamily="sans-serif" fontWeight="600" letterSpacing="0.5">TOTAL STOK</text>
      <text x="262" y="78" fill="#ffffff" fontSize="22" fontFamily="sans-serif" fontWeight="700">2,847</text>
      <text x="262" y="96" fill="#4ade80" fontSize="8.5" fontFamily="sans-serif">↑ +12.4% bulan ini</text>
      <rect x="352" y="72" width="5" height="18" rx="1.5" fill="#3b82f6" fillOpacity="0.5" />
      <rect x="359" y="64" width="5" height="26" rx="1.5" fill="#3b82f6" fillOpacity="0.7" />
      <rect x="366" y="56" width="5" height="34" rx="1.5" fill="#60a5fa" />
      <rect x="373" y="62" width="5" height="28" rx="1.5" fill="#3b82f6" fillOpacity="0.6" />

      {/* Dashboard card top-left */}
      <rect x="24" y="40" width="124" height="76" rx="10" fill="#1e3a8a" fillOpacity="0.9" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.55" />
      <text x="36" y="60" fill="#93c5fd" fontSize="8.5" fontFamily="sans-serif" fontWeight="600" letterSpacing="0.5">PERGERAKAN</text>
      <polyline points="34,105 50,93 66,99 82,85 98,90 114,80 130,73" stroke="#60a5fa" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" transform="translate(0,10)" />

      {/* Check badge */}
      <circle cx="306" cy="156" r="20" fill="#0f172a" stroke="#22c55e" strokeWidth="2" />
      <text x="306" y="162" textAnchor="middle" fill="#22c55e" fontSize="14" fontFamily="sans-serif">✓</text>

      {/* Scan badge */}
      <rect x="88" y="142" width="38" height="24" rx="5" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="107" y="158" textAnchor="middle" fill="#f59e0b" fontSize="8.5" fontFamily="sans-serif" fontWeight="700">SCAN</text>

      <defs>
        <linearGradient id="boxGrad" x1="120" y1="130" x2="300" y2="258" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e40af" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="boxGrad2" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#172554" />
        </linearGradient>
        <filter id="boxShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#3b82f6" floodOpacity="0.28" />
        </filter>
      </defs>
    </svg>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isNative, setIsNative] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState(() => {
    const errCode = searchParams.get('error')
    return errCode ? (ERROR_MESSAGES[errCode] || 'Terjadi kesalahan, coba lagi.') : ''
  })

  useEffect(() => {
    setMounted(true)
    // Google Sign-In belum jalan normal di dalam APK (WebView), disembunyikan
    // sementara di native platform sampai flow deep-link-nya dibenerin
    setIsNative(navigator.userAgent.includes('SIMBAAPK'))
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Email wajib diisi.')
      return
    }
    if (!password) {
      setError('Password wajib diisi.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message?.includes('fetch') || error.name === 'AuthRetryableFetchError') {
        setError('Tidak ada koneksi internet. Periksa koneksi kamu dan coba lagi.')
      } else if (error.message?.includes('Invalid login credentials')) {
        setError('Email atau password salah. Coba periksa lagi ya.')
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Email kamu belum diverifikasi. Cek inbox/spam buat link verifikasinya.')
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else {
      router.replace('/')
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
    // kalau sukses, browser langsung diarahin ke Google — gak perlu router.push di sini
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Poppins', sans-serif; }

        .login-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Poppins', sans-serif;
        }

        /* ── LEFT PANEL ── */
        .left-panel {
          width: 45%;
          min-height: 100vh;
          background: linear-gradient(148deg, #0b1d6b 0%, #1a337d 35%, #1e40af 72%, #1d4ed8 100%);
          display: flex;
          flex-direction: column;
          padding: 48px 52px 48px 52px;
          position: relative;
          overflow: hidden;
        }

        .left-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(96,165,250,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(96,165,250,0.07) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
          z-index: 0;
        }

        .left-panel::after {
          content: '';
          position: absolute;
          top: -100px; right: -100px;
          width: 340px; height: 340px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(96,165,250,0.16) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .glow-bottom {
          position: absolute;
          bottom: -80px; left: -80px;
          width: 280px; height: 280px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .left-logo {
          position: relative;
          z-index: 1;
          display: block;
        }
        .left-logo img {
          height: 90px;
          width: auto;
          object-fit: contain;
        }

        .hero-section {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 0 0;
        }

        .hero-title {
          font-size: 34px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.22;
          margin-bottom: 20px;
          letter-spacing: -0.01em;
        }

        .hero-desc {
          font-size: 14px;
          font-weight: 400;
          color: #bfdbfe;
          line-height: 1.85;
          max-width: 340px;
        }

        .illustration-wrap {
          position: relative;
          z-index: 1;
          margin-top: 36px;
          display: flex;
          justify-content: flex-start;
        }

        /* ── RIGHT PANEL ── */
        .right-panel {
          width: 55%;
          min-height: 100vh;
          background: #f0f4ff;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          padding: 60px 48px 32px;
          overflow-y: auto;
        }

        .form-card {
          width: 100%;
          max-width: 440px;
          background: #ffffff;
          border-radius: 20px;
          padding: 40px 36px 36px;
          box-shadow: 0 8px 40px rgba(30,58,138,0.10);
          opacity: ${mounted ? 1 : 0};
          transform: translateY(${mounted ? 0 : '14px'});
          transition: opacity 0.5s ease, transform 0.5s ease;
        }

        /* Form header */
        .form-header { margin-bottom: 32px; text-align: center; }

        .form-title {
          font-size: 26px;
          font-weight: 800;
          color: #0a1628;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }

        .form-subtitle {
          font-size: 14px;
          color: #475569;
          font-weight: 400;
        }

        /* Fields */
        .field-group { margin-bottom: 20px; }

        .field-label {
          display: block;
          font-size: 13.5px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          pointer-events: none;
          transition: color 0.2s;
          z-index: 1;
        }

        .input-field {
          width: 100%;
          padding: 13px 14px 13px 44px;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          font-size: 15px;
          font-family: 'Poppins', sans-serif;
          font-weight: 500;
          color: #0f172a;
          background: #ffffff;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          -webkit-text-fill-color: #0f172a;
        }

        .input-field::placeholder {
          color: #94a3b8;
          font-weight: 400;
          -webkit-text-fill-color: #94a3b8;
        }

        .input-field:focus {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow: 0 0 0 3.5px rgba(59,130,246,0.12);
        }

        .input-wrap:focus-within .input-icon { color: #3b82f6; }

        /* Fix autofill text color */
        .input-field:-webkit-autofill,
        .input-field:-webkit-autofill:hover,
        .input-field:-webkit-autofill:focus {
          -webkit-text-fill-color: #0f172a;
          -webkit-box-shadow: 0 0 0px 1000px #ffffff inset;
          transition: background-color 5000s ease-in-out 0s;
        }

        .pw-toggle {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          display: flex;
          align-items: center;
          padding: 4px;
          border-radius: 6px;
          transition: color 0.2s;
          z-index: 1;
        }
        .pw-toggle:hover { color: #3b82f6; }

        /* Options row */
        .options-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .remember-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13.5px;
          color: #334155;
          font-weight: 500;
          user-select: none;
        }

        .remember-cb {
          width: 16px; height: 16px;
          border: 1.5px solid #cbd5e1;
          border-radius: 4px;
          cursor: pointer;
          accent-color: #3b82f6;
        }

        .forgot-link {
          font-size: 13.5px;
          font-weight: 500;
          color: #3b82f6;
          text-decoration: none;
          transition: color 0.2s;
        }
        .forgot-link:hover { color: #1d4ed8; }

        /* Login button */
        .btn-login {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 16px rgba(37,99,235,0.32);
          transition: transform 0.15s, box-shadow 0.15s, background 0.2s;
          letter-spacing: 0.01em;
        }
        .btn-login:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(37,99,235,0.42);
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
        }
        .btn-login:active:not(:disabled) { transform: translateY(0); }
        .btn-login:disabled { opacity: 0.68; cursor: not-allowed; }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 22px 0;
        }
        .divider-line { flex: 1; height: 1px; background: #e2e8f0; }
        .divider-text { font-size: 12.5px; color: #94a3b8; white-space: nowrap; }

        /* Register button */
        .btn-register {
          width: 100%;
          padding: 13px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 13.5px;
          font-family: 'Poppins', sans-serif;
          font-weight: 400;
          color: #475569;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: border-color 0.2s, background 0.2s;
          text-decoration: none;
        }
        .btn-register:hover {
          border-color: #3b82f6;
          background: #f0f7ff;
        }
        .btn-register .accent { color: #3b82f6; font-weight: 600; }
        .btn-register:hover .accent { color: #1d4ed8; }

        /* Error */
        .error-box {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 13px;
          color: #be123c;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Footer */
        .right-footer {
          width: 100%;
          max-width: 440px;
          text-align: center;
          font-size: 11.5px;
          color: #64748b;
          font-weight: 400;
          padding-top: 24px;
        }

        /* Spinner */
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        /* Google button */
        .btn-google {
          width: 100%;
          padding: 13px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'Poppins', sans-serif;
          font-weight: 500;
          color: #334155;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 12px;
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
        }
        .btn-google:hover:not(:disabled) {
          border-color: #cbd5e1;
          background: #f8fafc;
          transform: translateY(-1px);
        }
        .btn-google:disabled { opacity: 0.68; cursor: not-allowed; }
        .spinner-dark {
          width: 16px; height: 16px;
          border: 2px solid rgba(51,65,85,0.2);
          border-top-color: #334155;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        /* ── MOBILE ≤640px ── */
        .mobile-logo { display: none; }

        @media (max-width: 640px) {
          .left-panel { display: none; }

          .right-panel {
            width: 100%;
            min-height: 100vh;
            background: #f0f4ff;
            padding: 40px 20px 32px;
            justify-content: flex-start;
            align-items: center;
          }

          .form-card {
            background: #ffffff;
            border-radius: 20px;
            padding: 32px 24px 28px;
            box-shadow: 0 8px 36px rgba(30,58,138,0.11);
            width: 100%;
            max-width: 420px;
            opacity: 1 !important;
            transform: none !important;
          }

          .mobile-logo {
            display: flex;
            justify-content: center;
            margin-bottom: 28px;
          }
          .mobile-logo img {
            height: auto;
            max-width: 160px;
            object-fit: contain;
          }

          .right-footer {
            margin-top: 20px;
            padding-top: 0;
          }
        }

        @media (max-width: 900px) and (min-width: 641px) {
          .left-panel { width: 42%; padding: 40px 36px; }
          .right-panel { width: 58%; padding: 48px 36px 32px; }
          .hero-title { font-size: 28px; }
        }
      `}</style>

      <div className="login-root">

        {/* ── Left Panel ── */}
        <div className="left-panel">
          <div className="glow-bottom" />

          <div className="left-logo">
            <img src="/logo-horizontal.png" alt="SIMBA - Sistem Monitoring Barang" />
          </div>

          <div className="hero-section">
            <h1 className="hero-title">
              Kelola Inventori,<br />
              Pantau Bisnis<br />
              Lebih Cerdas
            </h1>
            <p className="hero-desc">
              SIMBA membantu Anda mengelola stok barang,
              memantau pergerakan inventori, dan membuat
              keputusan bisnis yang lebih tepat.
            </p>
            <div className="illustration-wrap">
              <InventoryIllustration />
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="right-panel">
          <div className="form-card">

            {/* Mobile logo */}
            <div className="mobile-logo">
              <img src="/logo.png" alt="SIMBA" />
            </div>

            <div className="form-header">
              <h2 className="form-title">Selamat Datang Kembali!</h2>
              <p className="form-subtitle">Masuk untuk melanjutkan ke dashboard SIMBA</p>
            </div>

            <form onSubmit={handleLogin} noValidate>
              {/* Email */}
              <div className="field-group">
                <label className="field-label">Email</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="3" /><path d="M2 7l10 7 10-7" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="Masukkan email Anda"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input-field"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="field-group">
                <label className="field-label">Password</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password Anda"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field"
                    style={{ paddingRight: '44px' }}
                    autoComplete="current-password"
                  />
                  <button type="button" className="pw-toggle" onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="options-row">
                <label className="remember-label">
                  <input
                    type="checkbox"
                    className="remember-cb"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                  />
                  Ingat saya
                </label>
                <Link href="/forgot-password" className="forgot-link">Lupa password?</Link>
              </div>

              {/* Error */}
              {error && (
                <div className="error-box">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Masuk */}
              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? (
                  <div className="spinner" />
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    Masuk
                  </>
                )}
              </button>
            </form>

            {/* Divider + Google — disembunyikan di APK, lihat catatan isNative di atas */}
            {!isNative && (
              <>
                <div className="divider">
                  <div className="divider-line" />
                  <span className="divider-text">atau</span>
                  <div className="divider-line" />
                </div>

                <button type="button" className="btn-google" onClick={handleGoogleLogin} disabled={googleLoading}>
                  {googleLoading ? (
                    <div className="spinner-dark" />
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3.02h3.88c2.27-2.09 3.57-5.17 3.57-8.84z"/>
                        <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3.02c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.12C3.24 21.3 7.29 24 12 24z"/>
                        <path fill="#FBBC05" d="M5.27 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.62H1.26A11.97 11.97 0 000 12c0 1.94.46 3.77 1.26 5.38l4.01-3.12z"/>
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.29 0 3.24 2.7 1.26 6.62l4.01 3.12C6.22 6.86 8.87 4.75 12 4.75z"/>
                      </svg>
                      Masuk dengan Google
                    </>
                  )}
                </button>
              </>
            )}

            {/* Register */}
            <Link href="/register" className="btn-register" style={isNative ? { marginTop: '22px' } : undefined}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              Belum punya akun?&nbsp;<span className="accent">Daftar sekarang</span>
            </Link>
          </div>

          <div className="right-footer">
            © 2026 SIMBA - Sistem Monitoring Barang. Semua hak dilindungi.
          </div>
        </div>

      </div>
    </>
  )
}