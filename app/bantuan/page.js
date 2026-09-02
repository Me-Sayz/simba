'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, Package, ArrowDownCircle, ArrowUpCircle,
  FileText, Settings, User, Search, ChevronDown, ChevronRight,
  Lightbulb, CheckCircle2, Info, X, BookOpen, ScanLine, ShoppingCart, QrCode, Users
} from 'lucide-react'
import faqs from './faqs.json'

const quickHelp = [
  {
    icon: LayoutDashboard,
    iconBg: 'bg-terong-soft',
    iconColor: 'text-terong dark:text-terong-light',
    title: 'Dashboard',
    desc: 'Melihat ringkasan stok dan aktivitas toko',
    panduan: [
      { step: 1, title: 'Buka Dashboard', desc: 'Klik menu "Dashboard" untuk melihat ringkasan stok & penjualan.' },
      { step: 2, title: 'Filter Periode', desc: 'Ganti periode ringkasan (Hari Ini / Minggu Ini / Bulan Ini) lewat tombol pill di atas.' },
      { step: 3, title: 'Stok Menipis', desc: 'Produk yang stoknya di bawah minimum muncul di kartu "Perlu Restock".' },
      { step: 4, title: 'Grafik Penjualan', desc: 'Grafik menampilkan omzet penjualan 7 hari terakhir dari transaksi Kasir.' },
      { step: 5, title: 'Produk Terlaris', desc: 'Lihat produk dengan penjualan terbanyak di periode yang dipilih.' },
    ]
  },
  {
    icon: Package,
    iconBg: 'bg-violet-50 dark:bg-violet-950',
    iconColor: 'text-violet-600 dark:text-violet-400',
    title: 'Kelola Produk',
    desc: 'Cara menambah, mengedit, dan menghapus produk',
    panduan: [
      { step: 1, title: 'Buka Stok → Produk', desc: 'Klik menu "Stok", pastikan tab "Produk" yang aktif.' },
      { step: 2, title: 'Tambah Produk', desc: 'Klik tombol "+" → isi nama, kategori, harga jual, harga beli, stok awal, dan barcode/SKU.' },
      { step: 3, title: 'Scan Barcode', desc: 'Klik ikon kamera di samping input barcode untuk scan barcode dari kemasan produk.' },
      { step: 4, title: 'Upload Foto', desc: 'Klik area foto untuk upload gambar produk dari perangkatmu (opsional).' },
      { step: 5, title: 'Edit / Hapus', desc: 'Klik ikon pensil untuk edit data produk, atau ikon hapus untuk menghapus (perlu konfirmasi). Cuma Owner yang bisa akses ini — Staff tidak bisa ubah/hapus produk.' },
      { step: 6, title: 'Search & Filter', desc: 'Gunakan kolom pencarian untuk mencari produk dengan cepat.' },
    ]
  },
  {
    icon: ArrowDownCircle,
    iconBg: 'bg-emerald-50 dark:bg-emerald-950',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    title: 'Riwayat Stok',
    desc: 'Catat stok masuk (restock) atau keluar manual',
    panduan: [
      { step: 1, title: 'Buka Stok → Riwayat Stok', desc: 'Klik menu "Stok", pindah ke tab "Riwayat Stok".' },
      { step: 2, title: 'Tambah Catatan', desc: 'Klik tombol "+" di pojok kanan atas untuk buka form.' },
      { step: 3, title: 'Pilih Masuk / Keluar', desc: 'Pilih toggle "Barang Masuk" (restock) atau "Barang Keluar" (rusak, kadaluarsa, dll — bukan penjualan).' },
      { step: 4, title: 'Isi Detail', desc: 'Pilih produk, jumlah, tanggal, dan (untuk Barang Keluar) alasan keluarnya.' },
      { step: 5, title: 'Simpan', desc: 'Stok produk otomatis ter-update sesuai catatan yang disimpan.' },
      { step: 6, title: 'Edit & Hapus', desc: 'Cuma Owner yang bisa edit/hapus, dan cuma buat catatan yang diinput manual — catatan otomatis dari transaksi Kasir tidak bisa diubah, biar data stok & penjualan tetap sinkron.' },
    ]
  },
  {
    icon: ScanLine,
    iconBg: 'bg-terong-soft',
    iconColor: 'text-terong dark:text-terong-light',
    title: 'Scan Produk',
    desc: 'Cek & update stok cepat pakai kamera',
    panduan: [
      { step: 1, title: 'Buka Menu Scan', desc: 'Klik menu "Scan" (ikon di tengah bottom nav / sidebar).' },
      { step: 2, title: 'Arahkan Kamera', desc: 'Arahkan kamera ke barcode produk sampai terdeteksi otomatis.' },
      { step: 3, title: 'Lihat Info Produk', desc: 'Nama produk & stok saat ini langsung muncul kalau barcode dikenali.' },
      { step: 4, title: 'Tambah / Kurangi Stok', desc: 'Atur jumlah lalu klik "Tambah Stok" atau "Kurangi Stok" — sekali klik, langsung update.' },
      { step: 5, title: 'Produk Belum Terdaftar', desc: 'Kalau barcode belum dikenali, klik "Tambah Produk Baru" untuk daftarin produk itu dulu.' },
    ]
  },
  {
    icon: ShoppingCart,
    iconBg: 'bg-terong-soft',
    iconColor: 'text-terong dark:text-terong-light',
    title: 'Mode Kasir',
    desc: 'Cara melayani transaksi penjualan',
    panduan: [
      { step: 1, title: 'Pindah ke Mode Kasir', desc: 'Buka menu "Akun" → klik kartu "Pindah ke Mode Kasir".' },
      { step: 2, title: 'Pilih Produk', desc: 'Tap produk di grid "Produk" untuk masukin ke keranjang, atau pakai "Scan" buat scan barcode langsung.' },
      { step: 3, title: 'Scan Berturut-turut', desc: 'Saat scan, produk yang lagi tampil otomatis masuk keranjang begitu kamu scan produk lain. Produk terakhir pakai tombol "Selesai, Masukkan ke Keranjang".' },
      { step: 4, title: 'Cek Keranjang', desc: 'Buka menu "Keranjang" untuk lihat & atur jumlah tiap produk sebelum bayar.' },
      { step: 5, title: 'Bayar', desc: 'Klik "Bayar Sekarang" → pilih metode Tunai atau QRIS (kalau toko sudah aktifin QRIS) → "Konfirmasi Bayar".' },
      { step: 6, title: 'Bayar Pakai QRIS', desc: 'Pilih tab QRIS → tunjukin QR ke pelanggan buat discan → cek notifikasi pembayaran masuk di aplikasi GoPay Merchant → klik "Sudah Dibayar".' },
      { step: 7, title: 'Kembali ke Monitoring', desc: 'Buka "Akun" → klik "Kembali ke Mode Monitoring" kapan aja.' },
    ]
  },
  {
    icon: FileText,
    iconBg: 'bg-rose-50 dark:bg-rose-950',
    iconColor: 'text-rose-500 dark:text-rose-400',
    title: 'Laporan',
    desc: 'Cara melihat dan export laporan ke PDF',
    panduan: [
      { step: 1, title: 'Buka Laporan', desc: 'Klik "Lihat Laporan Lengkap" di Dashboard, atau akses langsung dari menu Laporan.' },
      { step: 2, title: 'Pilih Periode', desc: 'Pilih preset waktu (hari ini, minggu, bulan, tahun) atau gunakan Custom Range.' },
      { step: 3, title: 'Ringkasan', desc: 'Lihat total produk, nilai stok, barang masuk/keluar, dan estimasi keuntungan.' },
      { step: 4, title: 'Grafik & Analisis', desc: 'Grafik menampilkan tren masuk vs keluar. Produk terlaris dan ringkasan alasan keluar juga tersedia.' },
      { step: 5, title: 'Export Laporan', desc: 'Klik tombol "Export" di kanan atas → pilih "Export PDF" atau "Export Excel" sesuai kebutuhan.' },
    ]
  },
  {
    icon: Settings,
    iconBg: 'bg-slate-50 dark:bg-slate-900',
    iconColor: 'text-slate-600 dark:text-slate-400',
    title: 'Pengaturan',
    desc: 'Kelola preferensi dan pengaturan aplikasi',
    panduan: [
      { step: 1, title: 'Buka Pengaturan', desc: 'Menu "Akun" → klik "Pengaturan".' },
      { step: 2, title: 'Tema Aplikasi', desc: 'Pilih Light, Dark, atau System sesuai preferensi tampilan.' },
      { step: 3, title: 'Satuan Default', desc: 'Atur satuan default (pcs, box, kg, dll) — otomatis terisi saat tambah produk baru.' },
      { step: 4, title: 'Minimum Stok Default', desc: 'Atur nilai minimum stok default — otomatis terisi di form tambah produk baru.' },
      { step: 5, title: 'Notifikasi', desc: 'Aktifkan atau nonaktifkan notifikasi untuk: stok menipis, produk baru, barang masuk, dan barang keluar.' },
      { step: 6, title: 'Reset ke Default', desc: 'Klik "Reset ke Default" di kanan atas untuk mengembalikan semua preferensi ke pengaturan awal.' },
    ]
  },
  {
    icon: QrCode,
    iconBg: 'bg-terong-soft',
    iconColor: 'text-terong dark:text-terong-light',
    title: 'Setup QRIS',
    desc: 'Terima pembayaran QRIS langsung dari toko sendiri',
    panduan: [
      { step: 1, title: 'Buka Akun → Setup QRIS', desc: 'Menu ini cuma muncul buat Owner toko.' },
      { step: 2, title: 'Upload QRIS Statis', desc: 'Download kode QR statis dari aplikasi GoPay Merchant, lalu upload gambarnya di SIMBA.' },
      { step: 3, title: 'Konfirmasi', desc: 'Cek nama toko yang kebaca dari QR sudah benar, baru klik "Simpan".' },
      { step: 4, title: 'Aktifkan', desc: 'Nyalain toggle "Terima Pembayaran QRIS" — metode QRIS langsung muncul di checkout Kasir.' },
      { step: 5, title: 'Konfirmasi Manual', desc: 'Setiap pembayaran QRIS wajib dikonfirmasi manual di Kasir setelah cek notifikasi masuk di aplikasi GoPay Merchant.' },
    ]
  },
  {
    icon: Users,
    iconBg: 'bg-violet-50 dark:bg-violet-950',
    iconColor: 'text-violet-600 dark:text-violet-400',
    title: 'Kelola Staff',
    desc: 'Undang dan kelola staff yang bantu jaga toko',
    panduan: [
      { step: 1, title: 'Buka Akun → Kelola Staff', desc: 'Menu ini cuma muncul buat Owner toko.' },
      { step: 2, title: 'Undang Staff', desc: 'Masukkan email staff → klik "Undang". Staff bakal nerima email undangan.' },
      { step: 3, title: 'Staff Terima Undangan', desc: 'Staff klik link di email, verifikasi, lalu bikin password sendiri.' },
      { step: 4, title: 'Lihat Detail', desc: 'Klik salah satu staff di list buat lihat email, tanggal gabung, dan login terakhir.' },
      { step: 5, title: 'Hapus Staff', desc: 'Klik ikon tempat sampah di baris staff buat cabut aksesnya dari toko.' },
    ]
  },
  {
    icon: User,
    iconBg: 'bg-terong-soft',
    iconColor: 'text-terong dark:text-terong-light',
    title: 'Akun & Profil',
    desc: 'Kelola profil, pindah mode, dan keamanan akun',
    panduan: [
      { step: 1, title: 'Buka Akun', desc: 'Klik menu "Akun" untuk lihat profil dan opsi lainnya.' },
      { step: 2, title: 'Pindah Mode', desc: 'Kartu "Pindah ke Mode Kasir" (atau sebaliknya) ada paling atas di halaman Akun.' },
      { step: 3, title: 'Edit Profil', desc: 'Klik ikon pensil di kartu profil untuk ubah nama, nama toko, atau foto profil.' },
      { step: 4, title: 'Ganti Email', desc: 'Di halaman Profil → Keamanan Akun → Ganti Email → verifikasi lewat kode OTP.' },
      { step: 5, title: 'Ganti Password', desc: 'Di halaman Profil → Keamanan Akun → Ganti Password.' },
      { step: 6, title: 'Hapus Akun', desc: 'Di bagian Zona Berbahaya (Profil), klik "Hapus Akun" → ketik HAPUS untuk konfirmasi. Semua data dihapus permanen.' },
    ]
  },
]

const steps = [
  { num: 1, icon: Package, iconBg: 'bg-violet-50 dark:bg-violet-950', iconColor: 'text-violet-600 dark:text-violet-400', numBg: 'bg-violet-600', title: 'Tambah Produk', desc: 'Daftarkan produk di menu Stok sebelum mulai jualan.' },
  { num: 2, icon: ScanLine, iconBg: 'bg-terong-soft', iconColor: 'text-terong dark:text-terong-light', numBg: 'bg-terong', title: 'Buka Kasir', desc: 'Pindah ke Mode Kasir lewat menu Akun untuk mulai transaksi.' },
  { num: 3, icon: ShoppingCart, iconBg: 'bg-emerald-50 dark:bg-emerald-950', iconColor: 'text-emerald-600 dark:text-emerald-400', numBg: 'bg-emerald-600', title: 'Layani Transaksi', desc: 'Pilih/scan produk, cek keranjang, lalu proses pembayaran.' },
  { num: 4, icon: FileText, iconBg: 'bg-rose-50 dark:bg-rose-950', iconColor: 'text-rose-500 dark:text-rose-400', numBg: 'bg-rose-500', title: 'Pantau Laporan', desc: 'Cek Dashboard & Laporan buat pantau stok dan penjualan.' },
]

const tips = [
  'Gunakan minimum stok untuk mendapatkan notifikasi produk hampir habis.',
  'Lakukan input barang masuk secara rutin agar stok tetap akurat.',
  'Export laporan secara berkala untuk backup data bisnis.',
]

export default function BantuanPage() {
  const [search, setSearch] = useState('')
  const [openFaq, setOpenFaq] = useState(null)
  const [selectedGuide, setSelectedGuide] = useState(null)

  const filteredFaqs = faqs.filter(f =>
    f.q.toLowerCase().includes(search.toLowerCase()) ||
    f.a.toLowerCase().includes(search.toLowerCase())
  )

  const filteredCards = quickHelp.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.desc.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bantuan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Panduan penggunaan aplikasi SIMBA</p>
        </div>

        {/* Hero / Search */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 border-t-4 border-t-terong p-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-terong-soft p-2.5 rounded-xl">
                <BookOpen size={20} className="text-terong dark:text-terong-light" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Pusat Bantuan</h2>
                <p className="text-sm text-gray-400 dark:text-gray-500">Temukan jawaban dan panduan penggunaan</p>
              </div>
            </div>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari panduan atau pertanyaan..."
                className="w-full md:w-96 pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-terong transition-all"
              />
            </div>
          </div>
          <div className="hidden md:flex items-center gap-5 text-xs text-gray-400 dark:text-gray-500">
            <div className="text-center">
              <p className="text-2xl font-bold text-terong dark:text-terong-light">{quickHelp.length}</p>
              <p>Panduan</p>
            </div>
            <div className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
            <div className="text-center">
              <p className="text-2xl font-bold text-terong dark:text-terong-light">{faqs.length}</p>
              <p>FAQ</p>
            </div>
          </div>
        </div>

        {/* Panduan Cepat */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-terong rounded-full" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Panduan Cepat</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredCards.map((item) => (
              <button
                key={item.title}
                onClick={() => setSelectedGuide(item)}
                className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-left hover:border-terong/40 hover:shadow-sm transition-all duration-200 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`${item.iconBg} w-8 h-8 rounded-xl flex items-center justify-center shrink-0`}>
                    <item.icon size={15} className={item.iconColor} />
                  </div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">{item.title}</p>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed line-clamp-2">{item.desc}</p>
              </button>
            ))}
          </div>
          {filteredCards.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Tidak ditemukan panduan untuk "{search}"</p>
          )}
        </section>

        {/* Alur Penggunaan */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 bg-terong rounded-full" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Alur Penggunaan</h3>
          </div>
          <div className="hidden sm:flex items-start">
            {steps.map((step, i) => (
              <div key={step.num} className="flex items-start flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`${step.numBg} text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0`}>{step.num}</span>
                    <div className={`${step.iconBg} w-9 h-9 rounded-xl flex items-center justify-center`}>
                      <step.icon size={17} className={step.iconColor} />
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 text-center mb-1">{step.title}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 text-center leading-relaxed px-1">{step.desc}</p>
                    </div>
                    {i < steps.length - 1 && (
                      <div className="flex items-center mt-5 mx-1">
                        <div className="w-5 h-px bg-gray-200 dark:bg-gray-700" />
                        <ChevronRight size={12} className="text-gray-300 dark:text-gray-600 -ml-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="sm:hidden flex flex-col gap-0">
                {steps.map((step, i) => (
                  <div key={step.num} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className={`${step.numBg} text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0`}>{step.num}</span>
                      {i < steps.length - 1 && <div className="w-px flex-1 bg-gray-100 dark:bg-gray-800 my-1" />}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`${step.iconBg} w-8 h-8 rounded-xl flex items-center justify-center`}>
                          <step.icon size={15} className={step.iconColor} />
                        </div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{step.title}</p>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

        {/* Tips + Tentang */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

            {/* Tips */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-amber-400 rounded-full" />
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Tips & Informasi</h3>
                <Lightbulb size={15} className="text-amber-400 ml-auto" />
              </div>
              <div className="flex flex-col gap-2.5">
                {tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-xl p-3">
                    <CheckCircle2 size={15} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tentang — link ke halaman About, biar gak dobel konten */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Tentang Aplikasi</h3>
                <span className="ml-auto bg-terong-soft text-terong dark:text-terong-light text-xs font-semibold px-2.5 py-1 rounded-lg">v1.0.0</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center py-2">
                <img src="/logo.png" alt="SIMBA" className="w-14 h-14 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                  Info lengkap seputar SIMBA — tech stack, versi aplikasi, dan kredit developer.
                </p>
              </div>
              <Link
                href="/about"
                className="flex items-center justify-center gap-1.5 bg-terong-soft text-terong dark:text-terong-light text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-colors mt-2"
              >
                Lihat Detail <ChevronRight size={15} />
              </Link>
            </div>

        </div>

        {/* FAQ — section sendiri, gak disandingin kolom lain biar gak jomplang tingginya */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 shrink-0">
            <div className="w-1 h-5 bg-terong rounded-full" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">FAQ</h3>
            <span className="ml-auto text-xs text-gray-400">{faqs.length} pertanyaan</span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredFaqs.map((faq, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-start justify-between px-5 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors gap-3"
                >
                  <span className={`text-sm leading-snug flex-1 ${openFaq === i ? 'text-terong dark:text-terong-light font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`shrink-0 text-gray-400 mt-0.5 transition-transform duration-200 ${openFaq === i ? 'rotate-180 text-terong dark:text-terong-light' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <div className="bg-terong-soft rounded-xl p-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {filteredFaqs.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">Tidak ditemukan FAQ untuk "{search}"</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-start gap-3">
          <Info size={16} className="text-terong dark:text-terong-light mt-0.5 shrink-0" />
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Tidak menemukan jawaban yang kamu cari? Hubungi pengembang langsung melalui{' '}
            
            <a  href="https://wa.me/6282146773813"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
            >
              WhatsApp
            </a>
            .
          </p>
        </div>

      </div>

      {/* Panduan Modal */}
      {selectedGuide && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedGuide(null)}>
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl border border-gray-100 dark:border-gray-800"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className={`${selectedGuide.iconBg} w-9 h-9 rounded-xl flex items-center justify-center`}>
                  <selectedGuide.icon size={17} className={selectedGuide.iconColor} />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">{selectedGuide.title}</h3>
              </div>
              <button
                onClick={() => setSelectedGuide(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4 max-h-96 overflow-y-auto">
              {selectedGuide.panduan.map((p, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`${selectedGuide.iconBg} w-7 h-7 rounded-full flex items-center justify-center shrink-0`}>
                      <span className={`text-xs font-bold ${selectedGuide.iconColor}`}>{p.step}</span>
                    </div>
                    {i < selectedGuide.panduan.length - 1 && (
                      <div className="w-px flex-1 bg-gray-100 dark:bg-gray-800 my-1" />
                    )}
                  </div>
                  <div className="pb-4 flex-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">{p.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}