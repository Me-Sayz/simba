import { History } from 'lucide-react'

export default function KasirRiwayatPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-terong-soft flex items-center justify-center mx-auto mb-4">
        <History size={28} className="text-terong" />
      </div>
      <h1 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-1.5">Riwayat Hari Ini</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Daftar transaksi kasir hari ini dibangun di step "Halaman Kasir".
      </p>
    </div>
  )
}