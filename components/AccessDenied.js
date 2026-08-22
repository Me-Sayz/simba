import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default function AccessDenied({ message = 'Halaman ini cuma bisa diakses oleh Owner toko.' }) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 max-w-sm w-full text-center">
        <div className="w-14 h-14 bg-merah-soft rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={24} className="text-merah-c dark:text-merah-light" />
        </div>
        <h1 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1.5">Akses Ditolak</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
        <Link
          href="/"
          className="inline-block bg-terong text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:opacity-90 transition-colors"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  )
}