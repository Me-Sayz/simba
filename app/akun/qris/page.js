'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Html5Qrcode } from 'html5-qrcode'
import QRCodeStyling from 'qr-code-styling'
import { supabase } from '@/lib/supabase'
import { getStoreContext } from '@/lib/getUser'
import { validateStaticQris, parseStaticQrisInfo } from '@/lib/qris'
import AccessDenied from '@/components/AccessDenied'
import { ChevronLeft, QrCode, Upload, CheckCircle2, AlertTriangle, Loader2, RefreshCw } from 'lucide-react'

function QrisPreview({ data }) {
  const containerRef = useRef(null)
  const [size, setSize] = useState(200)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const updateSize = () => setSize(mq.matches ? 260 : 200)
    updateSize()
    mq.addEventListener('change', updateSize)
    return () => mq.removeEventListener('change', updateSize)
  }, [])

  useEffect(() => {
    if (!data || !containerRef.current) return
    containerRef.current.innerHTML = ''
    const instance = new QRCodeStyling({
      width: size,
      height: size,
      type: 'svg',
      data,
      margin: 6,
      qrOptions: { errorCorrectionLevel: 'M' },
      dotsOptions: { color: '#1f2937', type: 'square' },
      backgroundOptions: { color: '#ffffff' },
    })
    instance.append(containerRef.current)
  }, [data, size])

  return <div ref={containerRef} className="shrink-0" style={{ width: size, height: size }} />
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? 'bg-terong' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export default function SetupQrisPage() {
  const [access, setAccess] = useState('checking') // 'checking' | 'granted' | 'denied'
  const [storeId, setStoreId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [decoding, setDecoding] = useState(false)
  const [toast, setToast] = useState(null)

  const [qrisEnabled, setQrisEnabled] = useState(false)
  const [savedString, setSavedString] = useState(null) // string yang udah tersimpan di DB
  const [savedInfo, setSavedInfo] = useState(null) // { merchantName, merchantCity }

  // hasil decode yang BELUM disimpan — nunggu Owner konfirmasi di preview
  const [pendingString, setPendingString] = useState(null)
  const [pendingInfo, setPendingInfo] = useState(null)
  const [decodeError, setDecodeError] = useState(null)

  const fileInputRef = useRef(null)
  const scanElementId = 'qris-setup-hidden-scanner'

  async function fetchStore(id) {
    setLoading(true)
    const { data } = await supabase
      .from('stores')
      .select('qris_enabled, qris_static_string')
      .eq('id', id)
      .single()

    if (data) {
      setQrisEnabled(!!data.qris_enabled)
      setSavedString(data.qris_static_string || null)
      if (data.qris_static_string) {
        try {
          setSavedInfo(parseStaticQrisInfo(data.qris_static_string))
        } catch {
          setSavedInfo(null)
        }
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    getStoreContext().then((ctx) => {
      if (ctx?.isOwner) {
        setAccess('granted')
        setStoreId(ctx.storeId)
        fetchStore(ctx.storeId)
      } else {
        setAccess('denied')
      }
    })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  async function handleFileSelected(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // biar bisa pilih file yang sama lagi kalau mau re-upload
    if (!file) return

    setDecodeError(null)
    setPendingString(null)
    setPendingInfo(null)
    setDecoding(true)

    try {
      const scanner = new Html5Qrcode(scanElementId, { verbose: false })
      const decodedText = await scanner.scanFile(file, false)
      try { scanner.clear() } catch {}

      if (!validateStaticQris(decodedText)) {
        setDecodeError('Gambar berhasil dibaca, tapi isinya bukan kode QRIS yang valid. Pastikan upload gambar QR statis dari GoPay Merchant, bukan gambar lain.')
        setDecoding(false)
        return
      }

      const info = parseStaticQrisInfo(decodedText)
      setPendingString(decodedText)
      setPendingInfo(info)
    } catch {
      setDecodeError('Gagal membaca kode QR dari gambar ini. Coba pakai foto/screenshot yang lebih jelas dan gak kepotong.')
    } finally {
      setDecoding(false)
    }
  }

  async function handleConfirmSave() {
    if (!pendingString || !storeId) return
    setSaving(true)
    const { error } = await supabase
      .from('stores')
      .update({ qris_static_string: pendingString })
      .eq('id', storeId)

    if (error) {
      setToast({ type: 'error', text: 'Gagal menyimpan QRIS: ' + error.message })
    } else {
      setSavedString(pendingString)
      setSavedInfo(pendingInfo)
      setPendingString(null)
      setPendingInfo(null)
      setToast({ type: 'success', text: 'QRIS toko berhasil disimpan' })
    }
    setSaving(false)
  }

  function handleCancelPending() {
    setPendingString(null)
    setPendingInfo(null)
    setDecodeError(null)
  }

  async function handleToggleEnabled(next) {
    if (next && !savedString) {
      setToast({ type: 'error', text: 'Setup QRIS dulu sebelum diaktifkan' })
      return
    }
    setQrisEnabled(next) // optimistic
    const { error } = await supabase
      .from('stores')
      .update({ qris_enabled: next })
      .eq('id', storeId)

    if (error) {
      setQrisEnabled(!next) // revert kalau gagal
      setToast({ type: 'error', text: 'Gagal mengubah status QRIS: ' + error.message })
    }
  }

  if (access === 'checking') return null
  if (access === 'denied') return <AccessDenied message="Setup QRIS cuma bisa diakses oleh Owner toko." />

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 pb-10">
      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/akun" className="p-2 -ml-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="font-bold text-lg text-gray-900 dark:text-gray-100">Setup QRIS</h1>
            <p className="text-xs text-gray-400">Terima pembayaran QRIS langsung dari toko sendiri</p>
          </div>
        </div>

        {/* Toggle aktifkan */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Terima Pembayaran QRIS</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {savedString
                ? 'Kalau aktif, metode QRIS bakal muncul di halaman checkout kasir'
                : 'Upload QRIS statis toko dulu di bawah sebelum bisa diaktifkan'}
            </p>
          </div>
          <Toggle checked={qrisEnabled} onChange={handleToggleEnabled} disabled={loading} />
        </div>

        {loading ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center text-sm text-gray-400">
            Memuat...
          </div>
        ) : (
          <>
            {/* QRIS statis sudah tersimpan */}
            {savedString && !pendingString && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-5">
                <div className="flex flex-col items-center text-center">
                  <QrisPreview data={savedString} />
                  <div className="flex items-center gap-2 mt-5">
                    <CheckCircle2 size={16} className="text-daun dark:text-daun-light shrink-0" />
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">QRIS toko sudah di-setup</p>
                  </div>
                  {savedInfo?.merchantName && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {savedInfo.merchantName}{savedInfo.merchantCity ? ` · ${savedInfo.merchantCity}` : ''}
                    </p>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-terong dark:text-terong-light hover:underline"
                  >
                    <RefreshCw size={13} /> Ganti QRIS
                  </button>
                </div>
              </div>
            )}

            {/* Preview hasil decode — nunggu konfirmasi Owner sebelum disimpan */}
            {pendingString && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-terong p-5 mb-5">
                <div className="flex items-start gap-3 mb-4">
                  <span className="w-11 h-11 rounded-[13px] bg-terong-soft flex items-center justify-center shrink-0">
                    <QrCode size={19} className="text-terong dark:text-terong-light" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Konfirmasi QRIS Toko</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {pendingInfo?.merchantName || 'Nama merchant tidak terbaca'}
                      {pendingInfo?.merchantCity ? ` · ${pendingInfo.merchantCity}` : ''}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-4">Pastikan nama toko di atas sesuai sebelum disimpan.</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelPending}
                    disabled={saving}
                    className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleConfirmSave}
                    disabled={saving}
                    className="flex-1 bg-terong text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:opacity-90 transition-colors disabled:opacity-60"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            )}

            {/* Upload zone — cuma tampil kalau belum ada saved string, atau lagi proses decode/error */}
            {(!savedString || decodeError) && !pendingString && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-terong-soft flex items-center justify-center mx-auto mb-3">
                  <Upload size={20} className="text-terong dark:text-terong-light" />
                </div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">Upload QRIS Statis Toko</p>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  Download kode QR statis dari aplikasi GoPay Merchant kamu (Menu → QRIS → Download QR), lalu upload gambarnya di sini.
                </p>

                {decodeError && (
                  <div className="flex items-start gap-2 bg-merah-soft text-merah-c dark:text-merah-light text-xs rounded-xl p-3 mb-4 text-left">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <span>{decodeError}</span>
                  </div>
                )}

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={decoding}
                  className="w-full flex items-center justify-center gap-2 bg-terong text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:opacity-90 transition-colors disabled:opacity-60"
                >
                  {decoding ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Membaca gambar...
                    </>
                  ) : (
                    <>
                      <Upload size={15} /> Pilih Gambar QR
                    </>
                  )}
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelected}
              className="hidden"
            />
            {/* elemen tersembunyi wajib ada di DOM buat Html5Qrcode.scanFile, gak perlu keliatan */}
            <div id={scanElementId} className="hidden" />
          </>
        )}

        {/* Toast */}
        {toast && (
          <div
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg z-50 ${
              toast.type === 'error' ? 'bg-merah-c text-white' : 'bg-daun text-white'
            }`}
          >
            {toast.text}
          </div>
        )}
      </div>
    </div>
  )
}