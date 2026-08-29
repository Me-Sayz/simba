'use client'
import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPageWrapper() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPage />
    </Suspense>
  )
}

function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [verifyState, setVerifyState] = useState('checking') // 'checking' | 'ready' | 'invalid'

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    let settled = false

    // Jalur 1: link lupa password (diteruskan dari /auth/confirm) — ada
    // token_hash & type di query string. Verifikasi DI SINI, bukan percaya
    // sesi yang kebetulan lagi aktif.
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')

    if (token_hash && type) {
      supabase.auth.verifyOtp({ token_hash, type }).then(({ error }) => {
        settled = true
        setVerifyState(error ? 'invalid' : 'ready')
      })
      return
    }

    // Jalur 2: link undangan staff — token dikirim lewat hash fragment URL
    // (bukan query string), diproses otomatis sama supabase-js pas halaman
    // dimuat. Kalau hash-nya emang ada waktu halaman pertama kali dibuka,
    // tunggu event SIGNED_IN/PASSWORD_RECOVERY sebagai bukti sesi baru.
    const hadHashToken = typeof window !== 'undefined' && window.location.hash.includes('access_token')

    if (!hadHashToken) {
      // Gak ada token sama sekali di URL — TOLAK, jangan pernah percaya sesi
      // lama yang kebetulan lagi aktif di browser.
      Promise.resolve().then(() => setVerifyState('invalid'))
      return
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (settled) return
      if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
        settled = true
        setVerifyState('ready')
      }
    })

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true
        setVerifyState('invalid')
      }
    }, 4000)

    return () => {
      listener?.subscription?.unsubscribe()
      clearTimeout(timeout)
    }
  }, [searchParams])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) return setError('Konfirmasi password tidak cocok')
    if (password.length < 8) return setError('Password minimal 8 karakter')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // kalau ini staff yang lagi terima undangan, tandain status jadi 'active'.
      // Buat Owner/reset password biasa, fungsi ini gak ngapa-ngapain (no-op).
      await supabase.rpc('accept_invite')
      setSuccess(true)
      setLoading(false)
      // sign-out paksa sesi recovery ini — jaga-jaga device dipake bareng
      await supabase.auth.signOut()
      setTimeout(() => router.push('/login'), 3000)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Poppins', sans-serif; }

        .rp-root {
          min-height: 100vh;
          background: #f0f4ff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          font-family: 'Poppins', sans-serif;
          position: relative;
        }

        .rp-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 0%, rgba(59,130,246,0.10) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 100%, rgba(30,64,175,0.08) 0%, transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        .rp-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 460px;
          background: #ffffff;
          border-radius: 24px;
          padding: 44px 40px 36px;
          box-shadow: 0 8px 48px rgba(30,58,138,0.11), 0 1px 3px rgba(30,58,138,0.06);
          opacity: ${mounted ? 1 : 0};
          transform: translateY(${mounted ? 0 : '16px'});
          transition: opacity 0.5s ease, transform 0.5s ease;
        }

        .rp-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 32px;
        }
        .rp-logo img {
          height: 64px;
          width: auto;
          object-fit: contain;
          margin-bottom: 8px;
        }
        .rp-logo-name {
          font-size: 18px;
          font-weight: 800;
          color: #1e3a8a;
          letter-spacing: -0.01em;
          line-height: 1;
        }
        .rp-logo-sub {
          font-size: 11px;
          font-weight: 400;
          color: #94a3b8;
          letter-spacing: 0.04em;
          margin-top: 3px;
        }
        .rp-logo-divider {
          width: 40px;
          height: 2px;
          background: linear-gradient(90deg, #3b82f6, #1d4ed8);
          border-radius: 2px;
          margin: 12px auto 0;
        }

        .rp-title-section {
          text-align: center;
          margin-bottom: 28px;
        }
        .rp-title {
          font-size: 24px;
          font-weight: 800;
          color: #0a1628;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }
        .rp-subtitle {
          font-size: 13.5px;
          color: #64748b;
          line-height: 1.7;
          max-width: 340px;
          margin: 0 auto;
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
          left: 14px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          pointer-events: none;
          transition: color 0.2s;
          z-index: 1;
        }
        .input-toggle {
          position: absolute;
          right: 14px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          cursor: pointer;
          border: none;
          background: none;
          padding: 0;
          z-index: 1;
          transition: color 0.2s;
        }
        .input-toggle:hover { color: #3b82f6; }
        .input-field {
          width: 100%;
          padding: 13px 44px 13px 44px;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          font-size: 14.5px;
          font-family: 'Poppins', sans-serif;
          font-weight: 500;
          color: #0f172a;
          background: #ffffff;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          -webkit-text-fill-color: #0f172a;
        }
        .input-field::placeholder { color: #94a3b8; font-weight: 400; -webkit-text-fill-color: #94a3b8; }
        .input-field:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3.5px rgba(59,130,246,0.12);
        }
        .input-field:-webkit-autofill,
        .input-field:-webkit-autofill:focus {
          -webkit-text-fill-color: #0f172a;
          -webkit-box-shadow: 0 0 0px 1000px #ffffff inset;
          transition: background-color 5000s ease-in-out 0s;
        }
        .input-wrap:focus-within .input-icon { color: #3b82f6; }

        .password-strength {
          margin-top: 8px;
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .strength-bar {
          height: 3px;
          flex: 1;
          border-radius: 99px;
          background: #e2e8f0;
          transition: background 0.3s;
        }
        .strength-label {
          font-size: 11px;
          font-weight: 500;
          color: #94a3b8;
          margin-left: 6px;
          white-space: nowrap;
          transition: color 0.3s;
        }

        .info-card {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 20px;
        }
        .info-icon { color: #3b82f6; flex-shrink: 0; margin-top: 1px; }
        .info-text { font-size: 12.5px; color: #1e40af; line-height: 1.6; }

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

        .btn-submit {
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
          box-shadow: 0 4px 16px rgba(37,99,235,0.30);
          transition: transform 0.15s, box-shadow 0.15s, background 0.2s;
          letter-spacing: 0.01em;
          margin-bottom: 16px;
        }
        .btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(37,99,235,0.40);
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
        }
        .btn-submit:active:not(:disabled) { transform: translateY(0); }
        .btn-submit:disabled { opacity: 0.65; cursor: not-allowed; }

        .btn-back {
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
        .btn-back:hover {
          border-color: #3b82f6;
          background: #f0f7ff;
          color: #1d4ed8;
        }
        .btn-back .accent { color: #3b82f6; font-weight: 600; }

        .success-card {
          text-align: center;
          padding: 8px 0 4px;
        }
        .success-icon-wrap {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #d1fae5, #a7f3d0);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 4px 16px rgba(34,197,94,0.20);
        }
        .success-title {
          font-size: 20px;
          font-weight: 800;
          color: #0a1628;
          margin-bottom: 10px;
          letter-spacing: -0.01em;
        }
        .success-desc {
          font-size: 13.5px;
          color: #64748b;
          line-height: 1.75;
          margin-bottom: 28px;
        }
        .success-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #15803d;
          font-size: 12px;
          font-weight: 500;
          padding: 6px 14px;
          border-radius: 999px;
          margin-bottom: 28px;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .rp-footer {
          position: relative;
          z-index: 1;
          text-align: center;
          font-size: 11.5px;
          color: #94a3b8;
          margin-top: 24px;
        }

        @media (max-width: 480px) {
          .rp-card { padding: 32px 24px 28px; border-radius: 20px; }
          .rp-title { font-size: 22px; }
          .rp-logo img { height: 52px; }
        }
      `}</style>

      <div className="rp-root">
        <div className="rp-card">

          {/* Logo */}
          <div className="rp-logo">
            <img src="/logo.png" alt="SIMBA" />
            <div className="rp-logo-name">SIMBA</div>
            <div className="rp-logo-sub">Sistem Monitoring Barang</div>
            <div className="rp-logo-divider" />
          </div>

          {verifyState === 'checking' ? (
            <div className="success-card">
              <div className="spinner" style={{ margin: '0 auto 20px', width: 32, height: 32, borderWidth: 3, borderTopColor: '#2563eb', borderColor: 'rgba(37,99,235,0.15)' }} />
              <p className="success-desc">Memverifikasi link...</p>
            </div>
          ) : verifyState === 'invalid' ? (
            <div className="success-card">
              <div className="success-icon-wrap" style={{ background: 'linear-gradient(135deg, #fee2e2, #fecaca)', boxShadow: '0 4px 16px rgba(239,68,68,0.20)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2 className="success-title">Link Tidak Valid</h2>
              <p className="success-desc">
                Link ini sudah kadaluarsa, sudah pernah dipakai, atau tidak valid.<br />
                Silakan minta link baru.
              </p>
              <Link href="/forgot-password" className="btn-back">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span>Minta Link <span className="accent">Baru</span></span>
              </Link>
            </div>
          ) : !success ? (
            <>
              {/* Title */}
              <div className="rp-title-section">
                <h1 className="rp-title">Buat Password Baru</h1>
                <p className="rp-subtitle">
                  Masukkan password baru Anda. Pastikan minimal 8 karakter dan mudah diingat.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                {/* Password field */}
                <div className="field-group">
                  <label className="field-label">Password Baru</label>
                  <div className="input-wrap">
                    <span className="input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Masukkan password baru"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="input-field"
                      autoComplete="new-password"
                    />
                    <button type="button" className="input-toggle" onClick={() => setShowPassword(p => !p)}>
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {/* Strength indicator */}
                  {password.length > 0 && (
                    <PasswordStrength password={password} />
                  )}
                </div>

                {/* Confirm password */}
                <div className="field-group">
                  <label className="field-label">Konfirmasi Password</label>
                  <div className="input-wrap">
                    <span className="input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 12l2 2 4-4" />
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      placeholder="Ulangi password baru"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      className="input-field"
                      autoComplete="new-password"
                    />
                    <button type="button" className="input-toggle" onClick={() => setShowConfirm(p => !p)}>
                      {showConfirm ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="info-card">
                  <span className="info-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </span>
                  <span className="info-text">
                    Password minimal 8 karakter. Gunakan kombinasi huruf, angka, dan simbol untuk keamanan yang lebih baik.
                  </span>
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
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? (
                    <div className="spinner" />
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Simpan Password Baru
                    </>
                  )}
                </button>
              </form>

              <Link href="/login" className="btn-back">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span>Kembali ke <span className="accent">Login</span></span>
              </Link>
            </>
          ) : (
            /* Success */
            <div className="success-card">
              <div className="success-icon-wrap">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="success-title">Password Berhasil Diubah!</h2>
              <p className="success-desc">
                Password Anda telah berhasil diperbarui.<br />
                Anda akan diarahkan ke halaman login dalam 3 detik.
              </p>
              <div className="success-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Password berhasil diperbarui
              </div>
              <Link href="/login" className="btn-back">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span>Ke halaman <span className="accent">Login</span></span>
              </Link>
            </div>
          )}
        </div>

        <div className="rp-footer">
          © 2026 SIMBA - Sistem Monitoring Barang. Semua hak dilindungi.
        </div>
      </div>
    </>
  )
}

function PasswordStrength({ password }) {
  const getStrength = (p) => {
    let score = 0
    if (p.length >= 8) score++
    if (p.length >= 12) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    return score
  }

  const score = getStrength(password)
  const levels = [
    { label: 'Sangat Lemah', color: '#ef4444' },
    { label: 'Lemah', color: '#f97316' },
    { label: 'Cukup', color: '#eab308' },
    { label: 'Kuat', color: '#22c55e' },
    { label: 'Sangat Kuat', color: '#16a34a' },
  ]
  const current = levels[Math.min(score - 1, 4)] || levels[0]
  const filled = Math.max(score, 1)

  return (
    <div className="password-strength">
      {[1,2,3,4,5].map(i => (
        <div
          key={i}
          className="strength-bar"
          style={{ background: i <= filled ? current.color : '#e2e8f0' }}
        />
      ))}
      <span className="strength-label" style={{ color: current.color }}>{current.label}</span>
    </div>
  )
}