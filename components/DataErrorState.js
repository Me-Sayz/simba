import { WifiOff, RefreshCw } from 'lucide-react'

/**
 * Ditampilin kalau query Supabase gagal (bukan kosong beneran) — dipasangin
 * bareng hook lib/useSupabaseFetch.js. Pesannya sengaja gak nyebut detail
 * teknis error, cukup arahan yang bisa langsung ditindaklanjuti user.
 */
export default function DataErrorState({ onRetry, message = 'Gagal memuat data. Periksa koneksi internet kamu.' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-amber-soft flex items-center justify-center">
        <WifiOff size={20} className="text-amber-c dark:text-amber-light" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-sm font-semibold text-terong dark:text-terong-light hover:underline"
        >
          <RefreshCw size={14} />
          Coba lagi
        </button>
      )}
    </div>
  )
}