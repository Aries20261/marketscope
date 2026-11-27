# MarketScope Indonesia

Riset produk, harga, suplier, dan peluang di marketplace Indonesia. Next.js (App Router) + Supabase, deploy ke Vercel.

Status: **tahap 1** (fondasi): halaman depan dengan pricing, pendaftaran dengan verifikasi superadmin, login, ganti password wajib, manajemen pengguna (admin), skema database dengan RLS. Pencarian, Riset kata kunci, Riset suplier, Buat produk, Watchlist, dan Impor menyusul sesuai rancangan.

## Pengaturan

1. **Database.** Di Supabase (SQL Editor) jalankan `supabase/migrations/0001_init.sql` pada proyek yang masih kosong.
2. **Variabel lingkungan** (lihat `.env.example`). Di Vercel: Project Settings → Environment Variables.
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (rahasia; hanya sisi server; melewati RLS)
3. **Superadmin pertama.** Jalankan sekali dari komputer Anda:
   ```bash
   ADMIN_EMAIL=anda@contoh.com ADMIN_INITIAL_PASSWORD='password-awal' \
   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed:admin
   ```
   Password awal tidak disimpan di repo. Saat login pertama, pengguna **wajib** menggantinya.
4. **Supabase Auth.** Pendaftaran berjalan lewat server aplikasi (`/daftar`), jadi matikan pendaftaran langsung di Supabase (Authentication → Providers → Email → "Allow new users to sign up" off) dan naikkan panjang password minimal ke 10.

## Pengembangan

```bash
npm install
cp .env.example .env.local   # isi nilainya
npm run dev
npm run typecheck && npm test && npm run build
```

## Riset permintaan (dashboard dan PDF)

Menu **Riset permintaan**: pengguna (analis ke atas) mengirim kata kunci + provinsi/kota, atau nama toko. Permintaan berstatus `antre` sampai kolektor mengirim hasilnya; dashboard (KPI, produk teratas, omzet per toko/kota/kategori, distribusi harga, penjualan bulanan) lalu terisi. **Unduh PDF** membuka halaman laporan A4 dan dialog cetak ("Simpan sebagai PDF"). Contoh publik: `/contoh`.

- **Omzet minimum** = harga tampil x batas bawah jumlah terjual ("10RB+" dihitung 10.000). Selalu batas bawah, sepanjang umur produk, bukan per bulan.
- **Penjualan bulanan** hanya dari selisih dua pengambilan data untuk produk dengan angka eksak (bukan "RB+"). Fungsi SQL `penjualan_bulanan`.
- **Kolektor** (tool Shopee di Claude Desktop atau skrip terpisah) mengirim hasil:
  ```bash
  curl -X POST "$APP_URL/api/riset/<id-permintaan>/hasil" \
    -H "Authorization: Bearer $INGEST_API_KEY" -H "Content-Type: text/csv" --data-binary @hasil.csv
  ```
  Kolom CSV: `tanggal,toko,shop_id,item_id,produk,harga,terjual_tampil` (opsional `kota,provinsi,kategori,satuan,rating,marketplace,url`), sama dengan baseline riset M-Star. JSON juga diterima: `{"tanggal":"yyyy-MM-dd","items":[...]}`.
- Migrasi `0002_riset_permintaan.sql` harus dijalankan setelah `0001`. Isi `INGEST_API_KEY` di Vercel.
- Aplikasi web tidak mengambil data dari Shopee sendiri; tool Shopee hanya berjalan di Claude Desktop pengguna.

## Peran dan paket

| Peran | Hak |
|---|---|
| superadmin | Semua, termasuk membuat dan mengelola superadmin |
| admin | Mengelola pengguna (kecuali superadmin), reset password semua pengguna lain |
| analis | Membaca dan menulis data riset |
| viewer | Hanya membaca |

Paket: Gratis, Bulanan (Rp30.000), 4 Bulan (Rp100.000), Lifetime (Rp1.000.000). Pendaftaran mandiri: akun baru nonaktif (status `menunggu`) sampai **superadmin** menyetujui di halaman Admin. Pembayaran online (rencana: mayar.id, atau tampilan nomor rekening) belum ada: superadmin mengaktifkan paket secara manual. Batas pemakaian per paket belum ditetapkan. Pendaftaran belum memakai captcha; hanya kolom jebakan bot, jadi tambahkan captcha atau pembatasan laju sebelum dibuka ke publik luas.

## Keamanan

- `SUPABASE_SERVICE_ROLE_KEY` hanya dibaca di `src/lib/supabase/admin.ts` (`server-only`).
- RLS aktif di semua tabel; `profiles` dan `audit_log` tidak punya policy tulis untuk pengguna biasa.
- Setiap aksi admin diperiksa di server (`requireAdmin`) dan dicatat di `audit_log`.
- Password hasil reset ditampilkan sekali dan pengguna wajib menggantinya.
