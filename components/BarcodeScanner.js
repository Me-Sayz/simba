'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { X, Camera, RefreshCw, Loader2 } from 'lucide-react'

export default function BarcodeScanner({ onDetected, onClose, inline = false }) {
  const scannerRef = useRef(null)
  const onDetectedRef = useRef(onDetected)
  const onCloseRef = useRef(onClose)
  const [scannerId] = useState(() => 'html5qr-scanner-' + Math.random().toString(36).slice(2))
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(false)
  const [mounted, setMounted] = useState(false)
  // rasio asli kamera (lebar/tinggi) — begitu ketauan, container kita bikin
  // rasionya SAMA PERSIS kayak video, jadi gak akan ada sisa ruang kosong
  // sama sekali (landscape jadi pendek, portrait jadi memanjang ke bawah)
  const [videoAspect, setVideoAspect] = useState(4 / 3)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { onDetectedRef.current = onDetected }, [onDetected])
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  async function stopScanner() {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState()
        if (state === 2 || state === 3) {
          await scannerRef.current.stop()
        }
        scannerRef.current.clear()
      } catch {}
      scannerRef.current = null
    }
  }

  async function startScanner(deviceId) {
    await stopScanner()
    setError(null)
    setLoading(true)
    setVideoAspect(4 / 3)

    try {
      const scanner = new Html5Qrcode(scannerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.CODABAR,
        ],
        verbose: false,
      })
      scannerRef.current = scanner

      const config = {
        fps: 20,
        aspectRatio: 1.333,
        disableFlip: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      }

      await scanner.start(
        deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' },
        config,
        (decodedText) => {
          onDetectedRef.current(decodedText)
          stopScanner()
          onCloseRef.current()
        },
        () => {}
      )

      setLoading(false)

      // baca rasio ASLI kamera (videoWidth/videoHeight, resolusi sungguhan,
      // bukan ukuran tampilan) begitu metadata-nya siap — dari situ kita tau
      // pasti ini landscape atau portrait, terus dipasang ke container
      const videoEl = document.querySelector(`#${scannerId} video`)
      if (videoEl) {
        const applyAspect = () => {
          if (videoEl.videoWidth && videoEl.videoHeight) {
            setVideoAspect(videoEl.videoWidth / videoEl.videoHeight)
          }
        }
        applyAspect()
        videoEl.addEventListener('loadedmetadata', applyAspect)
      }
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
        const camDevices = await Html5Qrcode.getCameras()

        if (cancelled) return

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
          setError('Gagal akses kamera: ' + (err?.message || String(err)))
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

  // ============ Viewfinder — dipakai di kedua mode (inline & modal) ============
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
          /* wrapper ini yang di-animate — tingginya 100% kotak viewfinder,
             jadi translateY(%) di bawah dihitung dari tinggi kotak itu,
             bukan dari tinggi garis laser (yg cuma 2px) */
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
          /* transform, bukan top — jalan di compositor thread jadi gak
             rebutan CPU sama proses decode barcode di main thread */
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

  // ============ MODE INLINE — nempel langsung di halaman (bukan popup) ============
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
          className="relative overflow-hidden w-full [&_video]:!w-full [&_video]:!h-full [&_video]:object-cover"
          style={{ aspectRatio: videoAspect, maxHeight: '75vh' }}
        >
          <div id={scannerId} className="absolute inset-0" />
          <Viewfinder />
        </div>
      </div>
    )
  }

  // ============ MODE MODAL — popup, dipakai di form Tambah/Edit Produk ============
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
          className="relative mt-3 bg-black overflow-hidden w-full [&_video]:!w-full [&_video]:!h-full [&_video]:object-cover"
          style={{ aspectRatio: videoAspect, maxHeight: '60vh' }}
        >
          <div id={scannerId} className="absolute inset-0" />
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