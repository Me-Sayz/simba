# SIMBA — Status Project

Ringkasan progres SIMBA — aplikasi monitoring stok + Kasir (POS) untuk UMKM, dengan dua mode: **Monitoring** (pemilik toko) dan **Kasir** (transaksi penjualan). Sekarang sudah multi-role (Owner/Staff).

Terakhir diupdate: 02 September 2026

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

### QRIS Dinamis (fitur besar, sesi baru)
- **Pendekatan**: self-built, bukan payment gateway pihak ketiga — Owner upload gambar QRIS statis dari GoPay Merchant (di-decode pakai `html5-qrcode` lewat `scanFile()`), string EMV mentahnya disimpan (`stores.qris_static_string`), gambar aslinya **gak disimpan** (cuma stringnya)
- `lib/qris.js` — parser TLV EMV manual, injeksi Tag 54 (nominal) + ubah Tag 01 (Point of Initiation static→dynamic) + hitung ulang CRC16-CCITT. Fungsi `validateStaticQris()` dipake buat validasi checksum pas upload & sebelum generate
- `/akun/qris` (Owner-only) — toggle aktif/nonaktif, upload+preview, `QrisPreview` component generate ulang QR dari string tersimpan (pakai `qr-code-styling`) buat ngisi ruang kosong di UI, bukan nyimpen gambar asli
- Checkout Kasir (`/kasir/keranjang`) — tab Tunai/QRIS (QRIS cuma muncul kalau toko udah setup+aktifin), `components/QrisPayment.js` generate QR dinamis dengan logo SIMBA + styling ungu terong, error correction level H
- **PENTING — konfirmasi pembayaran manual**: karena bukan lewat payment gateway resmi, SIMBA gak punya cara otomatis tau pembayaran QRIS masuk. Kasir wajib cek notifikasi di app GoPay Merchant sendiri, baru klik "Sudah Dibayar". Ini bukan bug, ini konsekuensi struktural dari pendekatan self-built
- DB: `stores.qris_enabled`, `stores.qris_static_string`, `transactions.payment_method` (`cash`/`qris`, constraint), `checkout_transaction()` di-update terima `p_payment_method` — nominal QRIS harus pas persis (gak ada kembalian)
- Riwayat (Kasir & Monitoring) — badge metode bayar (Tunai/QRIS), baris "Kembalian" disembunyiin khusus transaksi QRIS

### Fix Navigasi — Mode Kasir "Kabur" ke Monitoring
- **Root cause**: `AppShell.js` deteksi mode murni dari prefix URL (`/kasir/*`), tapi Settings & Bantuan itu halaman tunggal yang dipakai kedua mode (gak ada prefix `/kasir/settings`). Pas navigasi dari Kasir ke Settings/Bantuan, nav ikut balik ke Monitoring
- Fix: `AppShell.js` nyimpen "mode terakhir" di `sessionStorage` (`simba_last_mode`) tiap kali di path yang jelas Kasir/Monitoring, dipake sebagai fallback pas di shared path
- Sekalian nambah animasi cross-fade (`animate-nav-fade`, CSS keyframe opacity) pas mode ganti — pake `key={isKasir ? 'kasir' : 'monitoring'}` biar React remount & re-trigger animasi. Sengaja cuma `opacity` (bukan `transform`) karena sidebar/bottom-nav-nya `position: fixed`, dan `transform` di parent bisa ngerusak context positioning `fixed` itu

### Export ke Excel + Audit Bug Data Laporan
- Dropdown "Export" (PDF/Excel) di halaman Laporan, ganti dari tombol tunggal
- `lib/exportExcel.js` pake `exceljs` (bukan `xlsx`) — **versi gratis `xlsx` gak support cell styling sama sekali**, `exceljs` yang gratis+support styling penuh (warna, border, alternating rows, freeze header, currency format)
- **Bug sistemik ditemukan pas develop ini** (root cause 1: field salah nama): `lib/exportPDF.js` pakai `buy_price`/`price_at_time` yang gak pernah ada sebagai kolom — kolom aslinya `unit_price` buat masuk & keluar. Nyebabin NaN di semua nilai uang. Bug ini udah lama ada, ketauan pas bikin versi Excel-nya
- **Bug sistemik 2**: "alasan keluar" (`stock_movements.note`) di-treat mentah tanpa parsing — kalau ada catatan tambahan (`"Terjual — sisa promo"`), jadi kategori terpisah, bukan ke-gabung ke "Terjual". Bikin grafik pecah-pecah
- **Bug sistemik 3**: `"Penjualan kasir"` (note otomatis dari `checkout_transaction()` RPC) gak pernah kehitung sebagai "Terjual" di grafik alasan keluar — semua penjualan Kasir kebucket ke "Lainnya" dari awal fitur Kasir ada
- Fix: `lib/stockReason.js` — helper `extractReason()` (split `" — "`, sinonim `"Penjualan kasir"` → `"Terjual"`), dipake bareng di `lib/exportPDF.js`, `lib/exportExcel.js`, DAN halaman Laporan sendiri (grafik on-screen, bukan cuma export) — 3 tempat sekaligus biar konsisten

### Audit RLS Multi-Role (nemu & fix 2 celah)
- **Temuan 1** (nyata, bisa "kesenggol"): `StockMovementsTab.js` nampilin tombol Edit/Hapus di SETIAP baris tanpa cek role & tanpa cek asal baris — staff bisa hapus riwayat stok yang sebenernya otomatis dari transaksi Kasir, bikin data stok & penjualan gak sinkron. Fix: tombol cuma muncul kalau `isOwner && !row.transaction_id`
- **Temuan 2** (butuh niat teknis, gak kesenggol dari UI): RLS `stock_movements`, `transactions`, `transaction_items` tadinya pakai policy `ALL` tanpa cek role — staff bisa edit/hapus transaksi lewat DevTools/API langsung. Fix: `UPDATE`/`DELETE` dibatesin Owner-only, `INSERT`/`SELECT` tetep bebas semua member

### Security Fix — Reset Password Bisa Diakses Tanpa Token (kritis, pre-push)
- **Root cause**: halaman `/auth/reset-password` gak pernah verifikasi token — cuma percaya "ada sesi aktif = boleh ganti password". Kalau device/browser lagi login (sesi biasa, bukan hasil klik link resmi), buka halaman itu langsung bisa ganti password akun yang lagi login, tanpa email/token apapun
- Fix: verifikasi token dipindah dari `/auth/confirm` (yang tadinya verify server-side lalu buang token dari URL) ke halaman `/auth/reset-password` itu sendiri — `/auth/confirm/route.js` sekarang cuma nerusin `token_hash`+`type` sebagai query param, `reset-password/page.js` yang verify (`supabase.auth.verifyOtp`) dan gate render form-nya
- Jalur invite staff (token dari hash fragment, bukan query string) di-handle terpisah: cek `window.location.hash` ada `access_token` pas load awal + tunggu event `SIGNED_IN`/`PASSWORD_RECOVERY`, timeout 4 detik kalau gak ada respons
- **Gak ada token sama sekali di URL → langsung ditolak**, gak pernah cek sesi ambient sama sekali
- Tambahan defense: sign-out paksa abis sukses ganti password (jaga-jaga device dipake gantian di kasir)

### Splash Screen + Loading States
- Splash: gambar statis (`logo.png` mobile 1:1, `logo-horizontal.png` desktop 3:1, dipilih via `matchMedia`), background putih, `1500ms`, sekali per sesi (`sessionStorage`)
- **Bug ditemukan**: awalnya Dashboard sempet kebuka sekilas sebelum splash nongol. Root cause: status "tampilin splash" ditentuin di `useEffect` (setelah render pertama), bukan pas render pertama. Fix: `useState(() => ...)` lazy initializer (dihitung SAAT render, bukan setelahnya) + komponen dipaksa `ssr: false` lewat wrapper `SplashScreenLoader.js` (pakai `next/dynamic`) biar gak ada mismatch server/client dari `sessionStorage`/`matchMedia` yang cuma ada di browser
- Audit loading state ke semua 18 halaman utama — 3 ketemu belum ada/gak jalan: **Dashboard** (state `loading` ada tapi gak dipake buat gate render — kartu statistik nongol kosong dulu), **Settings** (section Owner-only pop-in telat), **Kasir Akun** (avatar/nama blank sekilas). Semua ditambahin skeleton (`animate-pulse`, pola yang sama kayak yang udah ada di Laporan)

### Kelola Staff — Detail (Email, Login Terakhir)
- `app/api/staff-detail/route.ts` (Owner-only, `service_role`) — ambil email + `last_sign_in_at` semua member toko sekaligus (1 request), karena data itu cuma ada di `auth.users`, gak bisa diakses langsung dari client
- List staff sekarang nampilin email + badge role (Owner/Staff), diklik → modal detail (nama, email, "Bergabung sejak" dari `store_members.created_at`, "Login terakhir" dari auth)

### Halaman About + Kredit Developer (Watermark)
- `/about` — info app, tech stack, kredit developer (nama placeholder + link TikTok/Instagram/GitHub, icon SVG custom karena `lucide-react` gak punya icon brand)
- Card "Tentang Aplikasi" di Settings diganti jadi link ke `/about` (dulu isinya lengkap dobel, sekarang cuma 1 sumber kebenaran)

### Kritik & Saran + Notifikasi Discord
- Tabel `feedback` (category, message, user_id, store_id) — RLS cuma `INSERT` (gak ada `SELECT` sama sekali, disengaja: dibaca langsung lewat Supabase Dashboard oleh developer, gak perlu bikin panel admin)
- `/kritik-saran` — form 4 kategori (Kritik/Saran/Bug/Lainnya)
- `app/api/feedback/route.ts` — insert DB + kirim notifikasi ke Discord webhook (`DISCORD_FEEDBACK_WEBHOOK_URL` di env, opsional — kalau kosong di-skip diem-diem, gak bikin submit gagal)

### Halaman Bantuan — Redesign + Update Konten
- **Panduan Cepat**: dari scroll horizontal (`overflow-x-auto`) → grid yang wrap. Alasan: scroll horizontal itu pola kurang intuitif buat target pengguna SIMBA (UMKM yang "kurang paham teknologi"), apalagi udah ada 9 kartu panduan
- **FAQ**: dipisah jadi section sendiri full-width, gak disandingin lagi sama kolom kanan (Alur Penggunaan/Tips/Tentang) di grid 2 kolom — soalnya kontennya beda jauh tingginya, bikin salah satu kolom nyisain kosong gede
- 2 panduan baru: **Setup QRIS**, **Kelola Staff**
- `faqs.json`: 15 → 20 FAQ. Beberapa yang lama ternyata **salah** (bukan cuma ketinggalan): FAQ reset password nyampur 2 alur beda (Lupa Password itu di halaman Login, bukan di dalam Profil), panduan edit/hapus riwayat stok masih bilang bebas semua orang padahal abis fix RLS udah Owner-only

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

### Prioritas tinggi
- **Testing end-to-end penuh multi-role** — audit kode+RLS dari sisi server udah kelar (nemu & fix 2 celah, lihat section Audit RLS di atas), tapi klik-klik manual di browser asli (login Owner+Staff beneran, alur undang staff dari 0 → terima → transaksi → hapus) di lingkungan production murni **masih belum dijalanin**. Ini murni testing manual, gak bisa disubstitusi audit kode

### Opsional / nunggu keputusan
- **Jadiin SIMBA sebagai APK** — masih belum ditentuin metodenya (kandidat: Capacitor, PWA-to-APK, WebView wrapper, dll). Sayz bakal kirim PDF referensi metode yang dimaksud di sesi mendatang — baca dulu sebelum ngasih rekomendasi
- **Push notifications** — nunggu keputusan APK di atas dulu (soalnya sebagian metode push notif tergantung platform APK-nya)

### Dipertimbangkan tapi ditunda (bukan "belum selesai", tapi keputusan sengaja)
- **Custom domain buat Supabase Auth** (biar teks acak `mmoelwdauvsrgepjiyaq.supabase.co` gak muncul di layar consent Google) — udah dicek, itu add-on berbayar $10/bulan + wajib plan Pro $25/bulan (~Rp550-600rb/bulan total). Terlalu mahal buat tahap development sekarang, **diputuskan skip**, jangan diusulin lagi kecuali situasinya berubah (misal udah generate revenue)
- **Kasbon/piutang** — diputuskan gak jadi dibuat
- **WhatsApp receipt** — dipertimbangkan, tapi belum ada kebutuhan nyata dari toko, di-skip dulu
- **Mode offline** — dipertimbangkan, tapi kompleksitasnya tinggi (sinkronisasi, resiko konflik data/stok minus kalau 2 device offline bareng) relatif ke kebutuhan yang belum jelas urgent-nya, di-skip dulu

---

## 🔑 Key Learnings

- **Kalau nambah warna/badge baru, selalu cek pasangan `dark:`** untuk kombinasi teks-di-atas-background-soft — jangan asumsi warna solid otomatis kebaca di dark mode
- **Kalau ada FK dari tabel `public` balik ke `auth.users`, JANGAN andelin cascade/SET NULL buat proses yang dieksekusi lewat `admin.deleteUser()`** — role `supabase_auth_admin` gak bisa nyentuh schema `public` sama sekali (dikunci platform). Bersihin data terkait secara eksplisit lewat `service_role` di kode aplikasi SEBELUM manggil `deleteUser()`.
- **`useSearchParams()` di Next.js App Router wajib dibungkus `<Suspense>`** — kalau enggak, lolos di `next dev`/lint tapi gagal total di `next build` produksi. Selalu validasi pakai `next build` asli buat perubahan yang nyentuh routing/params, jangan cuma percaya lint.
- **Jangan nebak state dari `user.identities`** buat hal yang krusial (kayak "user ini punya password apa belum") — perilaku Supabase soal kapan identity baru ditambahin itu gak selalu pasti/terdokumentasi jelas. Kalau butuh kepastian, cek langsung ke kolom aslinya di database lewat RPC `SECURITY DEFINER`.
- **Vercel + domain custom**: kalau ada 2 domain (custom + `.vercel.app`), redirect OAuth (`redirectTo`) WAJIB match salah satu yang terdaftar di Supabase "Redirect URLs" — kalau enggak, Supabase diam-diam fallback ke "Site URL" tanpa error yang jelas.
- **Halaman verifikasi token (reset password dkk) JANGAN PERNAH percaya "ada sesi aktif = valid"** — sesi login biasa & sesi hasil klik link resmi itu keliatan identik di level object session. Verifikasi token (`verifyOtp`) harus kejadian TEPAT di halaman yang butuh bukti itu, bukan di route terpisah yang keburu buang tokennya sebelum redirect.
- **RLS policy `ALL` itu red flag** — hampir selalu lebih permisif dari yang dibutuhin. Pecah jadi `SELECT`/`INSERT`/`UPDATE`/`DELETE` terpisah biar gampang liat mana yang emang butuh dibuka ke semua role vs Owner-only.
- **Field naming yang salah itu bisa nyebar ke banyak file diam-diam** — bug `buy_price`/`price_at_time` (harusnya `unit_price`) ada di `exportPDF.js` dari lama tapi gak ketauan sampe bikin versi Excel-nya. Kalau nemu bug kayak gini, grep semua file yang query tabel yang sama, jangan asumsi cuma 1 titik.
- **`next/dynamic` dengan `ssr: false` gak bisa langsung dipake di Server Component** (kayak `layout.js` yang ada `export const metadata`) — butuh wrapper Client Component kecil (`'use client'` + `dynamic(...)`) yang di-import ke Server Component itu.
- **`useState(() => ...)` (lazy initializer) vs `useEffect` buat state yang nentuin apa sesuatu muncul di render PERTAMA** — kalau pake `useEffect`, ada celah 1 frame+ konten asli kebuka duluan sebelum state ke-update. Lazy initializer dihitung SAAT render pertama, gak ada celah itu.
- **QRIS/pembayaran tanpa payment gateway resmi = konfirmasi manual, gak ada cara lain** — ini bukan kekurangan implementasi, ini batasan struktural. Jangan janjiin/coba-coba bikin "auto-confirm" tanpa gateway beneran.
- **Kalau nyandingin 2 blok konten di layout grid kolom, cek dulu apa tinggi kontennya emang sepadan** — FAQ (20 item, bisa sangat panjang) disandingin sama Tips (3 item pendek) bikin salah satu kolom nyisain ruang kosong gede. Konten yang panjangnya gak bisa diprediksi/bisa tumbuh (FAQ, riwayat, dll) lebih aman jadi section full-width sendiri, bukan dipasangin di grid kolom.