'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Capacitor } from '@capacitor/core'

/* Inventory Illustration SVG */
function InventoryIllustration() {
  return (
    <svg viewBox="0 0 420 320" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '380px' }}>
      <ellipse cx="210" cy="290" rx="140" ry="20" fill="#3b82f6" fillOpacity="0.1" />

      {/* Main platform */}
      <ellipse cx="210" cy="220" rx="120" ry="30" fill="#1e3a8a" fillOpacity="0.6" />

      {/* Big box center */}
      <g filter="url(#glow1)">
        <rect x="155" y="120" width="110" height="105" rx="10" fill="url(#boxMain)" />
        <rect x="155" y="120" width="110" height="105" rx="10" stroke="#60a5fa" strokeWidth="1.5" strokeOpacity="0.5" />
        {/* SIMBA logo on box */}
        <text x="210" y="178" textAnchor="middle" fill="#93c5fd" fontSize="20" fontFamily="sans-serif" fontWeight="800">S</text>
        <line x1="155" y1="155" x2="265" y2="155" stroke="#60a5fa" strokeWidth="1" strokeOpacity="0.3" />
        {/* Check marks */}
        <text x="175" y="195" fill="#4ade80" fontSize="10" fontFamily="sans-serif">✓ SKU-001</text>
        <text x="175" y="210" fill="#4ade80" fontSize="10" fontFamily="sans-serif">✓ SKU-002</text>
        <text x="175" y="225" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">○ SKU-003</text>
      </g>

      {/* Left floating card — Analytics */}
      <g filter="url(#glow2)">
        <rect x="20" y="80" width="118" height="80" rx="10" fill="#1e3a8a" fillOpacity="0.95" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.5" />
        <text x="32" y="102" fill="#93c5fd" fontSize="8" fontFamily="sans-serif" fontWeight="600" letterSpacing="0.5">STOK MASUK</text>
        <text x="32" y="124" fill="#ffffff" fontSize="20" fontFamily="sans-serif" fontWeight="700">1,284</text>
        <text x="32" y="140" fill="#4ade80" fontSize="8" fontFamily="sans-serif">↑ +8.2% minggu ini</text>
        {/* mini bar chart */}
        <rect x="86" y="118" width="4" height="12" rx="1" fill="#3b82f6" fillOpacity="0.5" />
        <rect x="92" y="112" width="4" height="18" rx="1" fill="#3b82f6" fillOpacity="0.7" />
        <rect x="98" y="106" width="4" height="24" rx="1" fill="#60a5fa" />
        <rect x="104" y="110" width="4" height="20" rx="1" fill="#3b82f6" fillOpacity="0.6" />
      </g>

      {/* Right floating card — Chart */}
      <g filter="url(#glow2)">
        <rect x="282" y="60" width="118" height="80" rx="10" fill="#1e3a8a" fillOpacity="0.95" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.5" />
        <text x="294" y="82" fill="#93c5fd" fontSize="8" fontFamily="sans-serif" fontWeight="600" letterSpacing="0.5">PERGERAKAN</text>
        <polyline points="294,138 308,126 322,132 336,118 350,122 364,112 378,105" stroke="#60a5fa" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x="294" y="102" fill="#ffffff" fontSize="18" fontFamily="sans-serif" fontWeight="700">+24%</text>
      </g>

      {/* Small box left */}
      <rect x="68" y="178" width="72" height="58" rx="8" fill="url(#boxSide)" stroke="#60a5fa" strokeWidth="1" strokeOpacity="0.35" />
      <line x1="68" y1="200" x2="140" y2="200" stroke="#60a5fa" strokeWidth="0.8" strokeOpacity="0.2" />
      <text x="104" y="194" textAnchor="middle" fill="#bfdbfe" fontSize="8" fontFamily="sans-serif">BOX A</text>
      <text x="104" y="222" textAnchor="middle" fill="#4ade80" fontSize="8" fontFamily="sans-serif">● 42 pcs</text>

      {/* Small box right */}
      <rect x="280" y="178" width="72" height="58" rx="8" fill="url(#boxSide)" stroke="#60a5fa" strokeWidth="1" strokeOpacity="0.35" />
      <line x1="280" y1="200" x2="352" y2="200" stroke="#60a5fa" strokeWidth="0.8" strokeOpacity="0.2" />
      <text x="316" y="194" textAnchor="middle" fill="#bfdbfe" fontSize="8" fontFamily="sans-serif">BOX B</text>
      <text x="316" y="222" textAnchor="middle" fill="#f59e0b" fontSize="8" fontFamily="sans-serif">● 18 pcs</text>

      {/* Scan badge */}
      <rect x="160" y="102" width="44" height="22" rx="5" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="182" y="117" textAnchor="middle" fill="#f59e0b" fontSize="8" fontFamily="sans-serif" fontWeight="700">SCAN</text>

      {/* Shield badge */}
      <circle cx="268" cy="148" r="18" fill="#0f172a" stroke="#22c55e" strokeWidth="1.8" />
      <text x="268" y="154" textAnchor="middle" fill="#22c55e" fontSize="13" fontFamily="sans-serif">✓</text>

      <defs>
        <linearGradient id="boxMain" x1="155" y1="120" x2="265" y2="225" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e40af" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="boxSide" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#172554" />
        </linearGradient>
        <filter id="glow1" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#3b82f6" floodOpacity="0.3" />
        </filter>
        <filter id="glow2" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#1d4ed8" floodOpacity="0.4" />
        </filter>
      </defs>
    </svg>
  )
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [isNative, setIsNative] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    // Google Sign-In belum jalan normal di dalam APK (WebView), disembunyikan
    // sementara di native platform sampai flow deep-link-nya dibenerin
    setIsNative(navigator.userAgent.includes('SIMBAAPK'))
  }, [])

  async function handleRegister(e) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.')
      return
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, store_name: storeName }
      }
    })

    // profiles + stores + store_members dibuat otomatis oleh trigger handle_new_user()
    // di database begitu auth.users kebentuk, gak perlu insert manual lagi di sini.
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  async function handleGoogleRegister() {
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
  }
  const passwordStrength = () => {
    if (!password) return null
    if (password.length < 6) return { level: 1, label: 'Lemah', color: '#ef4444' }
    if (password.length < 10) return { level: 2, label: 'Sedang', color: '#f59e0b' }
    return { level: 3, label: 'Kuat', color: '#22c55e' }
  }
  const strength = passwordStrength()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Poppins', sans-serif; }

        .register-root {
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
          padding: 48px 52px;
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
          padding: 36px 0 0;
        }

        .hero-title {
          font-size: 34px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.22;
          margin-bottom: 16px;
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
          margin-top: 28px;
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
          padding: 40px 48px 28px;
          overflow-y: auto;
        }

        .form-card {
          width: 100%;
          max-width: 520px;
          background: #ffffff;
          border-radius: 20px;
          padding: 36px 36px 32px;
          box-shadow: 0 8px 40px rgba(30,58,138,0.10);
          opacity: ${mounted ? 1 : 0};
          transform: translateY(${mounted ? 0 : '14px'});
          transition: opacity 0.5s ease, transform 0.5s ease;
        }

        .form-header { margin-bottom: 28px; text-align: center; }

        .form-title {
          font-size: 26px;
          font-weight: 800;
          color: #0a1628;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }

        .form-subtitle {
          font-size: 14px;
          color: #475569;
          font-weight: 400;
        }

        /* Grid 2 kolom */
        .field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 0;
        }

        .field-group { margin-bottom: 16px; }

        .field-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 7px;
        }

        .input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 13px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          pointer-events: none;
          transition: color 0.2s;
          z-index: 1;
        }

        .input-field {
          width: 100%;
          padding: 12px 13px 12px 42px;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          font-size: 14px;
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
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
        }

        .input-wrap:focus-within .input-icon { color: #3b82f6; }

        .input-field:-webkit-autofill,
        .input-field:-webkit-autofill:hover,
        .input-field:-webkit-autofill:focus {
          -webkit-text-fill-color: #0f172a;
          -webkit-box-shadow: 0 0 0px 1000px #ffffff inset;
          transition: background-color 5000s ease-in-out 0s;
        }

        .pw-toggle {
          position: absolute;
          right: 12px;
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

        /* Password strength */
        .pw-strength {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 6px;
        }
        .pw-bars {
          display: flex;
          gap: 3px;
        }
        .pw-bar {
          width: 28px;
          height: 3px;
          border-radius: 2px;
          background: #e2e8f0;
          transition: background 0.3s;
        }
        .pw-label {
          font-size: 11px;
          font-weight: 500;
        }

        /* Security card */
        .security-card {
          background: #f0f7ff;
          border: 1px solid #bfdbfe;
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 20px;
        }
        .security-icon {
          color: #3b82f6;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .security-title {
          font-size: 13px;
          font-weight: 600;
          color: #1e3a8a;
          margin-bottom: 3px;
        }
        .security-desc {
          font-size: 12px;
          color: #475569;
          line-height: 1.6;
        }

        /* Error */
        .error-box {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          color: #be123c;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Register button */
        .btn-register-submit {
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
        .btn-register-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(37,99,235,0.42);
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
        }
        .btn-register-submit:active:not(:disabled) { transform: translateY(0); }
        .btn-register-submit:disabled { opacity: 0.68; cursor: not-allowed; }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
        }
        .divider-line { flex: 1; height: 1px; background: #e2e8f0; }
        .divider-text { font-size: 12px; color: #94a3b8; white-space: nowrap; }

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

        /* Login link */        
        .btn-login-link {
          width: 100%;
          padding: 12px;
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
        .btn-login-link:hover {
          border-color: #3b82f6;
          background: #f0f7ff;
        }
        .btn-login-link .accent { color: #3b82f6; font-weight: 600; }
        .btn-login-link:hover .accent { color: #1d4ed8; }

        /* Footer */
        .right-footer {
          width: 100%;
          max-width: 520px;
          text-align: center;
          font-size: 11.5px;
          color: #64748b;
          font-weight: 400;
          padding-top: 20px;
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

        /* ── MOBILE ≤640px ── */
        .mobile-logo { display: none; }

        @media (max-width: 640px) {
          .left-panel { display: none; }

          .right-panel {
            width: 100%;
            min-height: 100vh;
            background: #f0f4ff;
            padding: 32px 16px 28px;
            justify-content: flex-start;
            align-items: center;
          }

          .form-card {
            border-radius: 20px;
            padding: 28px 20px 24px;
            box-shadow: 0 8px 36px rgba(30,58,138,0.11);
            width: 100%;
            max-width: 420px;
            opacity: 1 !important;
            transform: none !important;
          }

          .mobile-logo {
            display: flex;
            justify-content: center;
            margin-bottom: 24px;
          }
          .mobile-logo img {
            height: auto;
            max-width: 140px;
            object-fit: contain;
          }

          .field-row {
            grid-template-columns: 1fr;
          }

          .right-footer {
            margin-top: 16px;
            padding-top: 0;
          }
        }

        @media (max-width: 900px) and (min-width: 641px) {
          .left-panel { width: 42%; padding: 40px 36px; }
          .right-panel { width: 58%; padding: 36px 28px 28px; }
          .hero-title { font-size: 28px; }
          .form-card { padding: 28px 24px; }
        }
      `}</style>

      <div className="register-root">

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
              <h2 className="form-title">Buat Akun Baru</h2>
              <p className="form-subtitle">Daftar untuk mulai menggunakan SIMBA</p>
            </div>

            <form onSubmit={handleRegister} noValidate>

              {/* Nama Lengkap — full width */}
              <div className="field-group">
                <label className="field-label">Nama Lengkap</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama lengkap Anda"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="input-field"
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Nama Toko + Email — 2 kolom */}
              <div className="field-row">
                <div className="field-group">
                  <label className="field-label">Nama Toko / Bisnis</label>
                  <div className="input-wrap">
                    <span className="input-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Nama toko Anda"
                      value={storeName}
                      onChange={e => setStoreName(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">Email</label>
                  <div className="input-wrap">
                    <span className="input-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              </div>

              {/* Password + Konfirmasi — 2 kolom */}
              <div className="field-row">
                <div className="field-group">
                  <label className="field-label">Password</label>
                  <div className="input-wrap">
                    <span className="input-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min. 8 karakter"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="input-field"
                      style={{ paddingRight: '40px' }}
                      autoComplete="new-password"
                    />
                    <button type="button" className="pw-toggle" onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
                      {showPassword ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {/* Password strength indicator */}
                  {strength && (
                    <div className="pw-strength">
                      <div className="pw-bars">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="pw-bar" style={{ background: i <= strength.level ? strength.color : '#e2e8f0' }} />
                        ))}
                      </div>
                      <span className="pw-label" style={{ color: strength.color }}>{strength.label}</span>
                    </div>
                  )}
                </div>

                <div className="field-group">
                  <label className="field-label">Konfirmasi Password</label>
                  <div className="input-wrap">
                    <span className="input-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Ulangi password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="input-field"
                      style={{ paddingRight: '40px' }}
                      autoComplete="new-password"
                    />
                    <button type="button" className="pw-toggle" onClick={() => setShowConfirmPassword(p => !p)} tabIndex={-1}>
                      {showConfirmPassword ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {/* Match indicator */}
                  {confirmPassword && (
                    <div className="pw-strength">
                      <span className="pw-label" style={{ color: password === confirmPassword ? '#22c55e' : '#ef4444' }}>
                        {password === confirmPassword ? '✓ Password cocok' : '✗ Password tidak cocok'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Security card */}
              <div className="security-card">
                <span className="security-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                <div>
                  <div className="security-title">Akun Anda aman bersama kami</div>
                  <div className="security-desc">Kami menggunakan enkripsi modern untuk melindungi data dan informasi bisnis Anda.</div>
                </div>
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

              {/* Submit */}
              <button type="submit" className="btn-register-submit" disabled={loading}>
                {loading ? (
                  <div className="spinner" />
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                    Daftar Sekarang
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

                <button type="button" className="btn-google" onClick={handleGoogleRegister} disabled={googleLoading}>
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
                      Daftar dengan Google
                    </>
                  )}
                </button>
              </>
            )}

            {/* Login link */}
            <Link href="/login" className="btn-login-link" style={isNative ? { marginTop: '22px' } : undefined}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Sudah punya akun?&nbsp;<span className="accent">Masuk di sini</span>
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