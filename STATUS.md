# SIMBA — Status Redesign

Ringkasan progres redesign SIMBA dari monitoring stok sederhana jadi aplikasi dengan dua mode: **Monitoring** (pemilik toko) dan **Kasir** (transaksi penjualan).

Terakhir diupdate: (isi tanggal pas commit)

---

## ✅ Sudah Selesai

### Database & Backend
- Migrasi skema Supabase: tabel `stock_in` + `stock_out` lama digabung jadi `stock_movements`
- Tabel baru: `transactions`, `transaction_items` untuk transaksi kasir
- Trigger otomatis: insert/update/delete di `stock_movements` langsung update `products.stock` (gak perlu RPC manual lagi)
- Function `checkout_transaction()` — satu RPC atomic buat proses transaksi kasir sekaligus (hitung total, validasi stok, insert transaksi + item + stock_movements)

### Navigasi & Struktur Aplikasi
- Dihapus: layar Hub/pemilih mode di awal (dianggap kurang modern)
- Login langsung masuk ke **Mode Monitoring**
- Pindah mode (Monitoring ↔ Kasir) lewat halaman **Akun**, bukan tombol terpisah
- `CartContext` — state keranjang global untuk Mode Kasir
- `AppShell.js` — deteksi mode otomatis dari URL (`/kasir/*` = Kasir, selainnya = Monitoring)
- `MonitoringNav.js` & `KasirNav.js` — sidebar (desktop) + bottom nav (mobile) terpisah per mode, dengan FAB di tengah:
  - Monitoring: FAB = **Scan Produk** (cek/update stok cepat)
  - Kasir: FAB = **Scan Barcode** (checkout)

### Mode Monitoring
- `/` Dashboard — direstyle total: 4 stat card (Omzet, Transaksi, Total Produk, Stok Menipis), grafik 7 hari, quick actions, produk terlaris, peringatan stok. Data omzet & transaksi sekarang dari tabel `transactions` asli (bukan estimasi)
- `/stock` — gabungan Produk (CRUD) + Riwayat Stok Masuk/Keluar dalam 1 halaman (2 tab)
- `/scan` — cek & update stok cepat via kamera, kamera nempel di halaman (bukan popup)
- `/riwayat` — riwayat transaksi penjualan dari Kasir
- `/akun` — profil singkat + tombol pindah ke Mode Kasir + link ke Pengaturan/Bantuan
- Notifikasi bell terpasang di topbar Dashboard

### Mode Kasir
- `/kasir/product` — grid produk asli dari Supabase (search, filter kategori)
- `/kasir/scan` — scan barcode dengan logic **auto-commit**: produk yang lagi tampil otomatis masuk keranjang begitu produk lain di-scan; tombol manual cuma buat produk terakhir
- `/kasir/keranjang` — checkout via RPC `checkout_transaction`, hitung kembalian otomatis, konfirmasi sebelum hapus produk (qty turun ke 0)
- `/kasir/riwayat` — transaksi hari ini
- `/kasir/akun` — tombol kembali ke Mode Monitoring

### Komponen & Styling
- `BarcodeScanner.js` — 2 mode: `inline` (nempel di halaman Scan) dan modal (popup di form Tambah Produk). Viewfinder pakai CSS `aspect-ratio` dinamis mengikuti rasio asli kamera (landscape/portrait), jadi selalu pas tanpa ruang kosong
- Tema warna "terong" (ungu, `#5B21B6`) jadi warna utama, gantiin biru lama — sudah diterapkan di: Dashboard, Stok, Scan, Riwayat, Kasir (semua halaman), Akun, Settings, Bantuan, ProductsTab, NotificationPanel, Laporan, Profile
- `Sidebar.js` & `SidebarWrapper.js` lama sudah dihapus (diganti `AppShell` + `MonitoringNav`/`KasirNav`)

### Konten
- Halaman Bantuan diupdate — panduan lama yang masih nyebut "Barang Masuk"/"Barang Keluar" terpisah digabung jadi "Riwayat Stok", ditambah panduan baru untuk Scan Produk & Mode Kasir
- Alur penggunaan (steps) diupdate: Tambah Produk → Buka Kasir → Layani Transaksi → Pantau Laporan

### Bug yang Sudah Diperbaiki
- Link notifikasi di `ProductsTab.js` yang masih ngarah ke `/products` (404) — diperbaiki ke `/stock`
- Chart Laporan yang pakai 2 shade biru buat Masuk/Keluar — diganti hijau/merah biar konsisten sama konsep in/out di seluruh app

---

## 🔲 Belum Selesai / Pending

- **Scan mode portrait** belum ditest di HP asli (sempat ditest pakai virtual camera Windows, hasilnya bagus, tapi kamera HP beneran belum dicoba)
- **`faqs.json`** (isi pertanyaan FAQ di halaman Bantuan) belum direview — kemungkinan ada pertanyaan yang masih merujuk fitur/struktur lama
- Review menyeluruh dari user sendiri masih berjalan — kalau nemu bagian yang perlu diperbaiki, akan ditambahkan ke daftar ini

---

## 📌 Keputusan Desain Penting

- **Navigasi**: tanpa layar pilih mode di awal; landing langsung ke Monitoring; pindah mode lewat halaman Akun
- **Badge Keranjang**: nunjukin jumlah **produk berbeda**, bukan total kuantitas
- **Alur Scan Kasir**: scan produk baru otomatis commit produk sebelumnya ke keranjang; item terakhir butuh konfirmasi manual
- **Hapus item di Keranjang**: kalau qty diturunin sampai 0, muncul modal konfirmasi dulu (gak langsung hilang)
- **Konsistensi penamaan**: pakai istilah Inggris untuk nama folder/route (`product`, bukan `produk`) — menyamakan sama konvensi yang sudah ada (`app/products/`)
- **Dashboard**: disederhanakan drastis — gauge Revenue/Profit/Turnover dan tabel Barang Masuk/Keluar Terbaru **dihapus** (dianggap terlalu kompleks buat pemilik UMKM awam, dan redundan sama halaman Stok/Laporan). Filter periode disederhanakan dari dropdown 5 pilihan + date picker jadi pill switch 3 pilihan (Hari Ini/Minggu Ini/Bulan Ini)
- **Setting Mata Uang** dihapus (cuma ada 1 opsi — Rupiah — jadi gak perlu jadi pengaturan)
- **Halaman Laporan tetap terpisah** dari Riwayat/Dashboard (tidak digabung), untuk analisis mendalam

---

## ⚠️ Catatan Teknis

- Semua perubahan sejauh ini divalidasi lewat `npm run build` di environment terpisah sebelum dikirim — tapi tetap disarankan jalanin `npm run dev` dan tes manual sebelum push ke production
- File di project menggunakan line ending LF (dari environment kerja saya), sedangkan project asli pakai CRLF (Windows) — ini cuma perbedaan kosmetik di git diff, gak mempengaruhi fungsi
