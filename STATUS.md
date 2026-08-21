# SIMBA — Status Project

Ringkasan progres SIMBA — aplikasi monitoring stok + Kasir (POS) untuk UMKM, dengan dua mode: **Monitoring** (pemilik toko) dan **Kasir** (transaksi penjualan).

Terakhir diupdate: (isi tanggal pas commit)

---

## ✅ Sudah Selesai

### Database & Backend
- Migrasi skema Supabase: tabel `stock_in` + `stock_out` lama digabung jadi `stock_movements`
- Tabel: `transactions`, `transaction_items` untuk transaksi kasir
- Trigger otomatis: insert/update/delete di `stock_movements` langsung update `products.stock`
- Function `checkout_transaction()` — RPC atomic buat proses transaksi kasir sekaligus

### Navigasi & Struktur Aplikasi
- Login langsung masuk ke **Mode Monitoring** (gak ada layar pilih mode di awal)
- Pindah mode (Monitoring ↔ Kasir) lewat halaman **Akun**
- `CartContext` — state keranjang global Mode Kasir
- `AppShell.js` — deteksi mode otomatis dari URL (`/kasir/*` = Kasir, selainnya = Monitoring)
- `MonitoringNav.js` & `KasirNav.js` — sidebar (desktop) + bottom nav (mobile) terpisah per mode, dengan FAB Scan di tengah

### Mode Monitoring
- `/` Dashboard — 4 stat card (Omzet, Transaksi, Total Produk, Stok Menipis), grafik 7 hari, quick actions, produk terlaris, peringatan stok
- `/stock` — Produk (CRUD) + Riwayat Stok Masuk/Keluar dalam 1 halaman (2 tab)
- `/scan` — cek & update stok cepat via kamera, kamera nempel di halaman
- `/riwayat` — riwayat transaksi penjualan, container lebar, Omzet jadi card sendiri, tiap transaksi card individual
- `/akun` — profil (foto+nama center, tanpa card solid), menu Profil & Akun/Laporan/Pengaturan/Bantuan
- `/laporan`, `/settings`, `/bantuan`, `/profile` — masing-masing sudah ada isinya

### Mode Kasir
- `/kasir/product` — grid produk asli dari Supabase (search, filter kategori)
- `/kasir/scan` — auto-commit: produk yang lagi tampil otomatis masuk keranjang begitu produk lain di-scan
- `/kasir/keranjang` — checkout via RPC `checkout_transaction`, hitung kembalian otomatis; tombol **Hapus Semua** (icon, dengan konfirmasi) + hapus per-item eksplisit (gak perlu turunin qty manual dulu)
- `/kasir/riwayat` — transaksi hari ini, layout konsisten sama Riwayat Monitoring
- `/kasir/akun` — kembali ke Mode Monitoring, menu Pengaturan & Bantuan

### Form Tambah/Edit Produk
- Dipisah jadi komponen `ProductFormDrawer` sendiri (perbaikan performa — sebelumnya numpuk render sama tabel produk berisi foto, bikin lag pas ngetik)
- Kategori: autocomplete custom (dropdown dari kategori yang udah ada, styling sendiri — bukan native browser datalist)
- Field wajib: Nama, Kategori, Satuan, Harga Jual, Harga Beli/Modal (add only), Stok Awal, Minimum Stok, Barcode
- Sticky footer tombol Simpan/Batal, icon kamera konsisten (lucide, bukan emoji)
- `lib/formHelpers.js` (inputCls, FieldError) & `lib/productImages.js` (getStoragePath, deleteImageFromStorage) — helper dipakai bareng ProductsTab & StockMovementsTab

### Riwayat Stok (StockMovementsTab)
- Pilih Produk: searchable dropdown custom (`ProductSearchSelect`), bukan `<select>` native
- Icon Masuk/Keluar pakai lucide (`ArrowDownCircle`/`ArrowUpCircle`), validasi & sticky footer disamain sama pola form Produk

### Kategori Produk
- `CategoryBadge` — warna badge sekarang **otomatis** dari hash nama kategori (palet 8 warna: blue/purple/orange/indigo/pink/cyan/teal/violet), bukan hardcode 4 kategori. Nama kategori yang sama selalu dapet warna sama & konsisten. Sengaja skip merah/kuning/hijau biar gak ketuker sama makna badge status (Habis/Rendah/Aman)

### Dark Mode — Sistem Warna
- Ditemukan bug sistemik: warna aksen (`--terong-deep`, `--daun`, `--amber-c`, `--merah-c`) gak punya versi dark mode, sementara background `-soft`-nya berubah gelap di dark mode → teks/icon jadi nyaris gak kebaca
- Fix: tambah variable CSS baru khusus dark mode — `--terong-light`, `--daun-light`, `--amber-light`, `--merah-light` (di `globals.css`), diterapin ke lebih dari 50 titik di seluruh app (nav, badge, stat card, tombol, dll)
- Badge kategori & status produk (yang pakai warna Tailwind polos kayak `bg-blue-100`) juga kena treatment sama
- **Kalau nambah warna/badge baru ke depannya**: selalu cek pasangan `dark:` untuk kombinasi teks-di-atas-background-soft, jangan asumsi warna solid otomatis kebaca di dark mode

### Branding
- Logo direcolor dari navy/biru ke ungu terong (`#5B21B6` / `#A78BFA`), dipasang di sidebar desktop + halaman auth (login/register/forgot-password/reset-password)
- Halaman auth sengaja **fixed light mode** (gak ikut dark mode) — bukan bug, keputusan desain

### Bug yang Sudah Diperbaiki
- FAB "Tambah Produk" ketimpa bottom nav di mobile (`bottom-6` → `bottom-24`)
- Header chart Dashboard ("Penjualan 7 Hari Terakhir") berantakan/wrap aneh di mobile
- Chrome browser autofill dropdown ganggu form (fix: `autoComplete="off"` di semua field form)
- Teks "(stok: X)" ke-embed di field input StockMovementsTab — dipisah jadi hint text
- Link notifikasi di `ProductsTab.js` yang masih ngarah ke `/products` (404) — diperbaiki ke `/stock`
- Chart Laporan yang pakai 2 shade biru buat Masuk/Keluar — diganti hijau/merah

---

## 🔲 Belum Selesai / Rencana Kerja

### Multi-Role Owner/Staff (masuk rencana kerja aktif)
**Kenapa perlu**: sekarang 1 akun Supabase Auth = 1 toko. Kalau ada lebih dari 1 orang pegang app (misal owner + kasir), mereka kepaksa share 1 email/password yang sama — gak aman, gak ketauan siapa ngapain.

**Kompleksitas**: medium-large. Bukan cuma nambah 1 fitur — hampir semua query di app (`ProductsTab`, `StockMovementsTab`, Dashboard, Laporan, Kasir) polanya `.eq('user_id', user.id)`, perlu digeser jadi konsep "toko" yang independen dari akun login. Butuh tabel baru (`stores`, `store_members`), RLS policy ditulis ulang, dan hampir semua komponen yang manggil Supabase kena sentuh.

**Timing**: lebih murah dikerjain **sekarang** (data masih dikit/testing) dibanding nanti pas udah banyak toko pakai beneran (migrasi data existing lebih riskan).

**Rencana pembagian akses** (baseline, bisa disempurnakan pas ada user asli):

| Fitur | Owner | Staff |
|---|---|---|
| Mode Kasir (transaksi) | ✅ | ✅ |
| Lihat stok produk | ✅ | ✅ (read-only) |
| Catat stok masuk/keluar (operasional harian) | ✅ | ✅ |
| Tambah/edit/hapus data master produk (nama/harga/kategori) | ✅ | ❌ |
| Laporan (omzet, profit) | ✅ | ❌ |
| Pengaturan aplikasi (Isi Otomatis, Notifikasi) | ✅ | ❌ |
| Kelola staff (undang/hapus) | ✅ | ❌ |
| Tema dark/light | per-device, gak perlu diatur lewat role (disimpan `localStorage`, bukan DB) |

Prinsip: mulai dari pembagian akses simpel (binary owner/staff), jangan bikin sistem permission granular dari awal sebelum ada user asli yang benerin kebutuhannya.

### Lainnya
- **Commit & push** — perubahan besar sesi ini (form produk, dark mode, Akun/Riwayat/Keranjang redesign) masih perlu dipush ke GitHub
- **Splash screen** dari video logo (intro reveal animasi) — muncul sekali pas app dibuka/abis login, video tanpa audio, gak loop
- **Halaman About SIMBA** — nunggu ada isi beneran (changelog dll), jangan bikin duluan sebelum ada konten
- **Form Kritik & Saran** — nempel di halaman Bantuan, simpan ke tabel Supabase baru (`feedback`), gak perlu dashboard admin dulu (cek manual lewat Supabase table editor)
- **Watermark/credit** nama pembuat (nama asli, karena app ini juga jadi portofolio) — taruh di section "Tentang Aplikasi" (Pengaturan), bukan nempel di tiap halaman
- Scan mode portrait belum ditest di HP asli (baru virtual camera)
- `faqs.json` belum direview penuh — kemungkinan ada yang masih merujuk fitur/struktur lama

---

## 💭 Ide Masa Depan (didiskusikan, belum masuk rencana kerja konkret)

- **QRIS dinamis** — self-built (suntik nominal ke string QRIS statis + hitung ulang checksum, generate QR di app sendiri, gak butuh payment gateway berbayar). GoPay Merchant udah punya fitur multi-user (role kasir/manager) yang nyelesain masalah visibility notifikasi pembayaran kalau staff yang jaga kasir
- **Kasbon/piutang pelanggan** — rekomendasi paling kuat buat fitur baru, khas kebutuhan UMKM lokal
- **Utang ke supplier** — kebalikan dari kasbon
- Struk digital via WhatsApp
- Diskon di Kasir (per-item atau per-transaksi)
- Reminder stok menipis via push notification (WA/push) — kurasi: cuma pas bener-bener habis + rekap berkala (pagi/mingguan), jangan spam tiap produk nyenggol minimum stok. **Butuh backend/server-side baru** (Supabase Edge Functions + Scheduler) — implementasinya nunggu jelas metode APK yang dipakai (native/Capacitor/PWA) karena itu nentuin cara kirim notifnya (FCM vs Web Push)
- Export laporan ke Excel
- Mode offline (buat toko dengan internet kurang stabil) — effort besar, arsitektur local-first
- Rekomendasi restock otomatis berdasarkan histori penjualan (bukan cuma alert stok < minimum)
- Link sosial media — dipikir nanti, tergantung apakah app ini beneran di-scale jadi produk buat banyak toko

---

## 📌 Keputusan Desain Penting

- **Navigasi**: tanpa layar pilih mode di awal; landing langsung ke Monitoring; pindah mode lewat halaman Akun
- **Badge Keranjang**: nunjukin jumlah produk berbeda, bukan total kuantitas
- **Alur Scan Kasir**: scan produk baru otomatis commit produk sebelumnya ke keranjang; item terakhir butuh konfirmasi manual
- **Hapus item di Keranjang**: konfirmasi dulu sebelum beneran hilang (baik hapus satu maupun hapus semua)
- **Konsistensi penamaan**: folder/route pakai Bahasa Inggris (`product`, bukan `produk`)
- **Dashboard**: disederhanakan drastis — gauge kompleks & tabel redundan dihapus, filter periode cuma 3 pilihan (Hari Ini/Minggu Ini/Bulan Ini)
- **Setting Mata Uang** dihapus (cuma Rupiah)
- **Halaman Laporan tetap terpisah** dari Riwayat/Dashboard
- **Container lebar**: halaman-halaman utama (`Dashboard`, `Stok`, `Akun`, `Riwayat`, `Keranjang`) pakai `max-w-7xl` biar konsisten & gak kosong di desktop
- **Filter periode & pagination di Riwayat**: sengaja di-skip dulu — jumlah transaksi masih sedikit, jangan overengineer fitur yang belum kepake
- **Foto produk & trust badge generic e-commerce** sengaja gak ditambahin ke Keranjang Kasir — foto bikin makin ribet gak perlu, trust badge ("Belanja aman & terpercaya") itu copy khas e-commerce buat pembeli anonim online, gak relevan buat kasir yang pegang HP-nya sendiri di toko fisik
- **Warna kategori produk**: otomatis (hash nama → palet warna terbatas), bukan manual/hardcode — biar kepake buat kategori toko manapun, gak cuma yang kebetulan ke-hardcode

---

## ⚠️ Catatan Teknis

- Semua perubahan divalidasi lewat Babel syntax check + `eslint` di environment terpisah sebelum dikirim ke user — build penuh (`npm run build`) kadang gagal di environment kerja saya gara-gara `next/font/google` butuh akses internet ke Google Fonts yang gak selalu tersedia di sandbox; itu bukan indikasi bug beneran, cuma keterbatasan environment
- File di project pakai line ending LF (dari environment kerja saya), project asli pakai CRLF (Windows) — beda kosmetik doang di git diff, gak pengaruh ke fungsi
- Kalau nemu warna/badge baru yang keliatan aneh di dark mode, kemungkinan besar pola bug-nya sama kayak yang udah diperbaiki (teks-di-atas-background-soft tanpa pasangan `dark:`) — cek dulu sebelum bikin fix baru dari nol
