'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BarcodeDetector } from 'barcode-detector/pure'
import { X, Camera, RefreshCw, Loader2 } from 'lucide-react'

const SUPPORTED_FORMATS = [
  'ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e', 'itf', 'codabar',
]

export default function BarcodeScanner({ onDetected, onClose, inline = false }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const detectorRef = useRef(null)
  const scanIntervalRef = useRef(null)
  const detectingRef = useRef(false)
  const onDetectedRef = useRef(onDetected)
  const onCloseRef = useRef(onClose)
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [videoAspect, setVideoAspect] = useState(4 / 3)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { onDetectedRef.current = onDetected }, [onDetected])
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  function stopScanner() {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  async function startScanner(deviceId) {
    stopScanner()
    setError(null)
    setLoading(true)
    setVideoAspect(4 / 3)

    try {
      if (!detectorRef.current) {
        detectorRef.current = new BarcodeDetector({ formats: SUPPORTED_FORMATS })
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream

      const videoEl = videoRef.current
      if (!videoEl) return
      videoEl.srcObject = stream
      await videoEl.play()

      setVideoAspect(videoEl.videoWidth && videoEl.videoHeight ? videoEl.videoWidth / videoEl.videoHeight : 4 / 3)
      setLoading(false)

      scanIntervalRef.current = setInterval(async () => {
        if (detectingRef.current || videoEl.readyState < 2) return
        detectingRef.current = true
        try {
          const results = await detectorRef.current.detect(videoEl)
          if (results.length > 0) {
            onDetectedRef.current(results[0].rawValue)
            stopScanner()
            onCloseRef.current()
          }
        } catch {
          // frame gagal dibaca sesekali itu normal, biarin lanjut ke frame berikutnya
        }
        detectingRef.current = false
      }, 100)
    } catch (err) {
      setLoading(false)
      if (err?.name === 'NotAllowedError' || String(err).includes('Permission')) {
        setError('Izin kamera ditolak. Klik ikon kunci di address bar → Site settings → Camera → Allow.')
      } else if (err?.name === 'NotReadableError' || String(err).includes('not readable')) {
        setError('Kamera sedang dipakai aplikasi lain. Tutup aplikasi lain lalu klik Coba Lagi.')
      } else if (err?.name === 'NotFoundError') {
        setError('Tidak ada kamera ditemukan.')
      } else {
        setError('Gagal akses kamera: ' + (err?.message || String(err)))
      }
    }
  }

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const primer = await navigator.mediaDevices.getUserMedia({ video: true })
        primer.getTracks().forEach(t => t.stop())

        if (cancelled) return

        const allDevices = await navigator.mediaDevices.enumerateDevices()
        const camDevices = allDevices
          .filter(d => d.kind === 'videoinput')
          .map(d => ({ id: d.deviceId, label: d.label }))

        if (!camDevices || camDevices.length === 0) {
          setLoading(false)
          setError('Tidak ada kamera ditemukan.')
          return
        }

        setDevices(camDevices)

        const realCams = camDevices.filter(d =>
          !/virtual|bytecast|obs|snap|droid|ivcam|epoccam/i.test(d.label)
        )
        const pool = realCams.length > 0 ? realCams : camDevices

        const backCamera = pool.find(d => /back|rear|environment/i.test(d.label))
        const physicalCamera = pool.find(d =>
          /webcam|usb|integrated|built.in|facetime|hd camera/i.test(d.label)
        )
        const chosen = backCamera || physicalCamera || pool[0]

        setSelectedDevice(chosen.id)
        startScanner(chosen.id)
      } catch (err) {
        if (!cancelled) {
          setLoading(false)
          if (err?.name === 'NotAllowedError' || String(err).includes('Permission')) {
            setError('Izin kamera ditolak. Klik ikon kunci di address bar → Site settings → Camera → Allow.')
          } else {
            setError('Gagal akses kamera: ' + (err?.message || String(err)))
          }
        }
      }
    }

    init()
    return () => {
      cancelled = true
      stopScanner()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleChangeDevice(e) {
    const deviceId = e.target.value
    setSelectedDevice(deviceId)
    await startScanner(deviceId)
  }

  async function handleRetry() {
    setRetrying(true)
    await startScanner(selectedDevice)
    setRetrying(false)
  }

  function handleClose() {
    stopScanner()
    onClose()
  }

  function Viewfinder() {
    return (
      <>
        {!loading && !error && (
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute inset-4 rounded-2xl"
              style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)' }}
            >
              <span className="absolute -top-0.5 -left-0.5 w-7 h-7 border-t-[3px] border-l-[3px] border-white rounded-tl-xl" />
              <span className="absolute -top-0.5 -right-0.5 w-7 h-7 border-t-[3px] border-r-[3px] border-white rounded-tr-xl" />
              <span className="absolute -bottom-0.5 -left-0.5 w-7 h-7 border-b-[3px] border-l-[3px] border-white rounded-bl-xl" />
              <span className="absolute -bottom-0.5 -right-0.5 w-7 h-7 border-b-[3px] border-r-[3px] border-white rounded-br-xl" />
              <div className="scanner-laser-track">
                <div className="scanner-laser" />
              </div>
            </div>
            <p className="absolute bottom-3 left-0 right-0 text-center text-white text-xs font-semibold drop-shadow">
              Arahkan kamera ke barcode produk
            </p>
          </div>
        )}

        <style jsx>{`
          .scanner-laser-track {
            position: absolute;
            inset: 0;
            animation: scanMove 2.2s ease-in-out infinite;
            will-change: transform;
          }
          .scanner-laser {
            position: absolute;
            top: 0;
            left: 6%;
            right: 6%;
            height: 2px;
            background: linear-gradient(90deg, transparent, #A78BFA, transparent);
            box-shadow: 0 0 8px 2px rgba(167, 139, 250, 0.7);
          }
          @keyframes scanMove {
            0%, 100% { transform: translateY(12%); }
            50% { transform: translateY(85%); }
          }
        `}</style>

        {loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black">
            <Loader2 size={28} className="text-white animate-spin" />
            <p className="text-white text-xs">Membuka kamera...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 bg-black">
            <p className="text-white text-xs text-center leading-relaxed">{error}</p>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-xs px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={retrying ? 'animate-spin' : ''} />
              {retrying ? 'Mencoba...' : 'Coba Lagi'}
            </button>
          </div>
        )}
      </>
    )
  }

  if (!mounted) return null

  if (inline) {
    return (
      <div className="rounded-3xl overflow-hidden bg-black">
        {devices.length > 1 && (
          <div className="px-4 pt-4 pb-2 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
              <Camera size={13} className="text-gray-500 dark:text-gray-400 shrink-0" />
              <select
                value={selectedDevice || ''}
                onChange={handleChangeDevice}
                className="w-full text-xs text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 outline-none cursor-pointer"
              >
                {devices.map(d => (
                  <option key={d.id} value={d.id}>{d.label || `Kamera ${d.id.slice(0, 8)}...`}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div
          className="relative overflow-hidden w-full"
          style={{ aspectRatio: videoAspect, maxHeight: '75vh' }}
        >
          <video ref={videoRef} muted playsInline className="absolute inset-0 w-full h-full object-cover" />
          <Viewfinder />
        </div>
      </div>
    )
  }

  return createPortal(
    <div style={{ zIndex: 99999 }} className="fixed inset-0 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">Scan Barcode</p>
            <p className="text-xs text-gray-400 mt-0.5">Arahkan kamera ke barcode produk</p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {devices.length > 1 && (
          <div className="px-5 pt-4 pb-0">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Pilih Kamera</label>
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5">
              <Camera size={14} className="text-gray-500 dark:text-gray-400 shrink-0" />
              <select
                value={selectedDevice || ''}
                onChange={handleChangeDevice}
                className="w-full text-sm text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 outline-none cursor-pointer"
              >
                {devices.map(d => (
                  <option key={d.id} value={d.id}>{d.label || `Kamera ${d.id.slice(0, 8)}...`}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div
          className="relative mt-3 bg-black overflow-hidden w-full"
          style={{ aspectRatio: videoAspect, maxHeight: '60vh' }}
        >
          <video ref={videoRef} muted playsInline className="absolute inset-0 w-full h-full object-cover" />
          <Viewfinder />
        </div>

        <div className="px-5 py-4 bg-white dark:bg-gray-900">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">Pastikan cahaya cukup & barcode tegak lurus</p>
        </div>
      </div>
    </div>,
    document.body
  )
}