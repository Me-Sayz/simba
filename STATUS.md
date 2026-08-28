# SIMBA — Status Project

Ringkasan progres SIMBA — aplikasi monitoring stok + Kasir (POS) untuk UMKM, dengan dua mode: **Monitoring** (pemilik toko) dan **Kasir** (transaksi penjualan). Sekarang sudah multi-role (Owner/Staff).

Terakhir diupdate: (isi tanggal pas commit)

---

## ✅ Sudah Selesai

### Database & Backend (fondasi awal)
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
- `/akun` — profil (foto+nama center, tanpa card solid), menu Profil & Akun/Laporan/Pengaturan/Bantuan/**Kelola Staff** (baru)
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
- Tombol Tambah/Edit/Hapus sekarang disembunyikan buat Staff (lihat bagian Multi-Role)

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

### Scan Barcode
- Animasi laser sempat patah-patah di HP (animasi `top` rebutan CPU sama proses decode barcode) — fix: pindah ke `transform: translateY()` via wrapper track, udah dites di HP asli hasilnya smooth

### Multi-Role Owner/Staff (fitur besar)

**Skema database baru:**
- Tabel `stores` (id, name) — satu toko independen dari akun login
- Tabel `store_members` (store_id, user_id, role: `owner`/`staff`, status: `active`/`invited`) — relasi user↔toko
- Kolom `store_id` ditambah ke `products`, `stock_movements`, `transactions` — kolom `user_id` lama tetap dipertahankan sebagai jejak "siapa yang input" (audit trail), terpisah dari `store_id` sebagai kepemilikan data
- RLS ditulis ulang total di semua tabel terkait, pakai helper function `get_my_store_id()` & `get_my_role()` (SECURITY DEFINER)
- **1 akun = 1 toko** (bukan multi-store per akun, sengaja disederhanain)

**Alur undang staff:**
- Owner undang via email dari halaman **Kelola Staff** (`/akun/staff`) → `app/api/invite-staff/route.ts` (pakai `admin.inviteUserByEmail`, metadata `invited_store_id` dibaca trigger `handle_new_user()` biar staff otomatis nempel ke toko yang ngundang, bukan bikin toko baru)
- Staff terima email → klik link → `/auth/confirm` (verifikasi token) → `/auth/reset-password` (set password) → RPC `accept_invite()` ubah status dari `invited` jadi `active`
- Template email "Invite user" di Supabase Dashboard dikustomisasi manual (link ke `/auth/confirm?token_hash=...&type=invite`, sama pola kayak Reset Password) — **PENTING kalau invite lagi dari sesi baru, jangan asumsi Supabase default template dipakai**

**Pembatasan akses Staff:**
- Gak bisa tambah/edit/hapus produk (tombol disembunyikan + RLS backend)
- Gak bisa akses halaman Laporan & Kelola Staff (baik dari menu maupun akses langsung URL — pakai komponen `AccessDenied`)
- Section "Nilai Default Produk" di Pengaturan disembunyikan (gak relevan buat Staff)
- **Staff TETAP bisa**: transaksi Kasir, catat stok masuk/keluar, ganti tema/notifikasi personal

**Hapus staff (2 arah, keduanya udah bener):**
- Owner hapus dari Kelola Staff → `app/api/remove-staff/route.ts` — akun auth staff **beneran dihapus** (bukan cuma diputus dari toko), staff gak bisa login lagi sama sekali
- Staff hapus akun sendiri → `app/api/delete-account/route.ts` (role-aware: Staff vs Owner vs fallback)
- Data toko (produk/stok/transaksi) **TETAP UTUH** kalau staff yang dihapus — cuma kolom `user_id`-nya jadi `null`, gak ikut kehapus

### Google Sign-In
- Tombol "Masuk/Daftar dengan Google" di halaman Login & Register
- `app/auth/callback/route.js` — proses tukar authorization code jadi session (PKCE)
- User baru dari Google otomatis jadi Owner toko baru (nama default "Toko Saya", bisa diganti lewat Profil)
- Setup wajib di luar kode: Google Cloud OAuth Client ID + redirect URI `https://mmoelwdauvsrgepjiyaq.supabase.co/auth/v1/callback`, provider Google diaktifin di Supabase Dashboard
- **Status publish OAuth consent screen: masih "Testing"** (sengaja, karena masih development) — kalau mau buka ke publik, klik "Publish app" di Google Auth Platform (gak perlu review Google karena scope-nya basic/non-sensitif)
- Domain: pastiin `https://simbaapp.my.id/**` ada di Supabase Redirect URLs + Site URL di-set ke domain itu (bukan `vercel.app`)

### Password & Keamanan Akun buat Akun Google
- Akun yang login via Google gak punya password — fitur "Ganti Password" & "Hapus Akun" di Profil disesuaikan: skip verifikasi "password saat ini", diganti **verifikasi OTP ke email** dulu (dua flow terpisah state-nya, OTP satu gak bisa dipake buat otorisasi flow lain)
- Deteksi "user ini punya password atau belum" pakai RPC `has_password()` (cek langsung `encrypted_password` di `auth.users`) — **jangan pernah balik ke cara nebak dari `user.identities`**, itu gak reliable buat kasus password ditambahin ke akun OAuth-only

### Bug Kecil yang Sudah Diperbaiki (arsitektur lama)
- FAB "Tambah Produk" ketimpa bottom nav di mobile (`bottom-6` → `bottom-24`)
- Header chart Dashboard ("Penjualan 7 Hari Terakhir") berantakan/wrap aneh di mobile
- Chrome browser autofill dropdown ganggu form (fix: `autoComplete="off"` di semua field form)
- Teks "(stok: X)" ke-embed di field input StockMovementsTab — dipisah jadi hint text
- Link notifikasi di `ProductsTab.js` yang masih ngarah ke `/products` (404) — diperbaiki ke `/stock`
- Chart Laporan yang pakai 2 shade biru buat Masuk/Keluar — diganti hijau/merah

---

## 🐛 Bug Besar yang Ditemukan & Diperbaiki (sesi multi-role)

Beberapa ini penting buat dipahami biar gak keulang di sesi depan:

1. **`proxy.js` & `AppShell.js` nge-block `/auth/callback`** — daftar `publicPaths`/`AUTH_PATHS` gak nyertain `/auth/callback`, jadi request OAuth callback (yang justru tugasnya BIKIN sesi) ketolak duluan sebelum sempat jalan karena dianggap "belum login". Ini yang bikin Google Sign-In lama banget didiagnosis (gejala: "balik ke /login tanpa error apapun").

2. **Halaman Login gak nampilin `?error=`** dari `/auth/callback`/`/auth/confirm` yang gagal — user cuma diem-diem balik ke Login tanpa penjelasan. Sekarang dibaca & ditampilin, plus dibungkus `<Suspense>` (wajib buat `useSearchParams()`, kalau enggak bikin **`next build` gagal total** — udah divalidasi lewat build asli, bukan cuma lint).

3. **`supabase_auth_admin` role dikunci Supabase cuma ke schema `auth`** (dikonfirmasi dari dokumentasi resmi) — ini kenapa hapus staff/akun yang punya riwayat stok/transaksi selalu gagal ("Database error deleting user"), walau constraint database & RLS udah bener. **Gak bisa diakalin dari sisi database** (grant/policy gak ngefek karena `search_path` role itu dikunci ke `auth` doang). Fix yang bener: kode aplikasi kita sendiri (lewat `service_role`, akses penuh) yang bersihin data (SET NULL manual) **sebelum** manggil `admin.deleteUser()` — jangan sandarin ke FK cascade/SET NULL buat proses hapus akun manapun ke depannya.

4. **Constraint FK `user_id` di `products`/`stock_movements`/`transactions`** awalnya RESTRICT/CASCADE ke `auth.users` (peninggalan desain single-tenant lama) — diubah ke SET NULL biar riwayat toko gak ikut lenyap/gagal pas ada akun (Owner maupun Staff) yang dihapus. Kolom `stock_movements.user_id` & `transactions.user_id` juga diubah jadi nullable.

5. Register page sempat ada **insert `profiles` dobel** (manual di client + otomatis dari trigger `handle_new_user()`) — yang manual dihapus, errornya kemarin ke-swallow diam-diam (gak dicek).

---

## 🔲 Belum Selesai / Perlu Diperhatikan

### Fitur besar (rencana lama, belum dikerjain)
- **QRIS dinamis** — pembayaran QRIS di Kasir. Rencana: bikin sendiri lewat injeksi string QRIS (bukan pakai payment gateway pihak ketiga)
- **Push notifications** — masih perlu ditentuin metode APK-nya (Capacitor vs PWA) dulu sebelum bisa dieksekusi, karena itu nentuin feasibility-nya
- **Kasbon/piutang** — fitur kredit buat transaksi kasir
- **WhatsApp receipt** — kirim struk lewat WhatsApp
- **Export ke Excel**
- **Mode offline**

### Kecil/rapihan
- **Splash screen** dari video logo — belum dikerjain
- **Halaman About SIMBA** — nunggu konten
- **Form Kritik & Saran** — nunggu di halaman Bantuan, nempel ke tabel `feedback` (belum dibuat)
- **Watermark/credit nama asli** — belum
- **`faqs.json`** — belum direview penuh

### Terkait multi-role
- Belum ada testing end-to-end penuh buat multi-role dari 0 (undang → terima → transaksi → hapus) di lingkungan production murni tanpa campur tangan manual

### Dipertimbangkan tapi ditunda (bukan "belum selesai", tapi keputusan sengaja)
- **Custom domain buat Supabase Auth** (biar teks acak `mmoelwdauvsrgepjiyaq.supabase.co` gak muncul di layar consent Google) — udah dicek, itu add-on berbayar $10/bulan + wajib plan Pro $25/bulan (~Rp550-600rb/bulan total). Terlalu mahal buat tahap development sekarang, **diputuskan skip**, jangan diusulin lagi kecuali situasinya berubah (misal udah generate revenue)

---

## 🔑 Key Learnings

- **Kalau nambah warna/badge baru, selalu cek pasangan `dark:`** untuk kombinasi teks-di-atas-background-soft — jangan asumsi warna solid otomatis kebaca di dark mode
- **Kalau ada FK dari tabel `public` balik ke `auth.users`, JANGAN andelin cascade/SET NULL buat proses yang dieksekusi lewat `admin.deleteUser()`** — role `supabase_auth_admin` gak bisa nyentuh schema `public` sama sekali (dikunci platform). Bersihin data terkait secara eksplisit lewat `service_role` di kode aplikasi SEBELUM manggil `deleteUser()`.
- **`useSearchParams()` di Next.js App Router wajib dibungkus `<Suspense>`** — kalau enggak, lolos di `next dev`/lint tapi gagal total di `next build` produksi. Selalu validasi pakai `next build` asli buat perubahan yang nyentuh routing/params, jangan cuma percaya lint.
- **Jangan nebak state dari `user.identities`** buat hal yang krusial (kayak "user ini punya password apa belum") — perilaku Supabase soal kapan identity baru ditambahin itu gak selalu pasti/terdokumentasi jelas. Kalau butuh kepastian, cek langsung ke kolom aslinya di database lewat RPC `SECURITY DEFINER`.
- **Vercel + domain custom**: kalau ada 2 domain (custom + `.vercel.app`), redirect OAuth (`redirectTo`) WAJIB match salah satu yang terdaftar di Supabase "Redirect URLs" — kalau enggak, Supabase diam-diam fallback ke "Site URL" tanpa error yang jelas.