'use client'
import { useEffect, useMemo, useRef } from 'react'
import QRCodeStyling from 'qr-code-styling'
import { generateDynamicQris } from '@/lib/qris'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

function fmt(n) {
  return 'Rp ' + (n || 0).toLocaleString('id-ID')
}

// Panel QRIS checkout — konfirmasi bayar tetap MANUAL, gak ada webhook otomatis
export default function QrisPayment({ amount, staticString, confirming, onConfirm, onCancel }) {
  const qrContainerRef = useRef(null)
  const qrInstanceRef = useRef(null)

  const { dynamicString, genError } = useMemo(() => {
    try {
      return { dynamicString: generateDynamicQris(staticString, amount), genError: null }
    } catch (err) {
      return { dynamicString: null, genError: err.message || 'Gagal membuat QRIS' }
    }
  }, [staticString, amount])

  useEffect(() => {
    if (!dynamicString || !qrContainerRef.current) return

    if (!qrInstanceRef.current) {
      qrInstanceRef.current = new QRCodeStyling({
        width: 240,
        height: 240,
        type: 'svg',
        data: dynamicString,
        margin: 8,
        qrOptions: { errorCorrectionLevel: 'H' },
        dotsOptions: { color: '#5B21B6', type: 'rounded' },
        cornersSquareOptions: { color: '#5B21B6', type: 'extra-rounded' },
        cornersDotOptions: { color: '#5B21B6', type: 'dot' },
        backgroundOptions: { color: '#ffffff' },
        image: '/logo.png',
        imageOptions: { crossOrigin: 'anonymous', margin: 6, imageSize: 0.22 },
      })
      qrContainerRef.current.innerHTML = ''
      qrInstanceRef.current.append(qrContainerRef.current)
    } else {
      qrInstanceRef.current.update({ data: dynamicString })
    }
  }, [dynamicString])

  if (genError) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-merah-soft flex items-center justify-center">
          <AlertTriangle size={20} className="text-merah-c dark:text-merah-light" />
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-200 font-semibold">Gagal membuat QRIS</p>
        <p className="text-xs text-gray-400 max-w-xs">{genError}</p>
        <button
          onClick={onCancel}
          className="mt-2 text-sm text-terong dark:text-terong-light font-medium"
        >
          Kembali
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div ref={qrContainerRef} className="mx-auto" style={{ width: 240, height: 240 }} />

      <p className="text-xs text-gray-400 mt-3 text-center">
        Minta pelanggan scan QR ini pakai GoPay/e-wallet/m-banking
      </p>
      <p className="font-bold text-xl text-terong-deep dark:text-terong-light mt-1">{fmt(amount)}</p>

      <div className="w-full bg-amber-soft text-amber-c dark:text-amber-light text-xs rounded-xl p-3 mt-4 flex items-start gap-2">
        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
        <span>Cek dulu notifikasi pembayaran masuk di app GoPay Merchant sebelum konfirmasi — sistem gak bisa deteksi pembayaran otomatis.</span>
      </div>

      <div className="flex gap-2 w-full mt-4">
        <button
          onClick={onCancel}
          disabled={confirming}
          className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          Batal
        </button>
        <button
          onClick={onConfirm}
          disabled={confirming}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-terong to-terong-deep text-white text-sm font-bold px-4 py-3 rounded-xl disabled:opacity-60"
        >
          <CheckCircle2 size={16} />
          {confirming ? 'Memproses...' : 'Sudah Dibayar'}
        </button>
      </div>
    </div>
  )
}