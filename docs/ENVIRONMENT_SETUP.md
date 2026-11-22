# Environment Setup — Yovela Dental Clinic (v3.3)

Panduan pemisahan konfigurasi antara **Development (Lokal)**, **Preview (Vercel PR)**, dan **Production (Vercel)**.

## 1. Daftar Variabel Konfigurasi

| Variabel | Wajib di Production | Keterangan |
| :--- | :--- | :--- |
| `NODE_ENV` | Otomatis (`production`) | Menentukan mode runtime Node/Next.js. |
| `APP_DATA_MODE` | Ya (`real`) | `real` untuk database asli, `mock` hanya untuk development lokal. |
| `DATABASE_URL` | Ya (PostgreSQL) | URL koneksi database. Lokal: `file:./dev.db`. Vercel: Pooled PostgreSQL URL. |
| `DIRECT_URL` | Ya (PostgreSQL) | Direct PostgreSQL URL (tanpa pooler) untuk migrasi Prisma. |
| `AUTH_SECRET` | Ya (min. 32 char) | Kunci acak HMAC-SHA256 untuk cookie sesi `yovela_session`. |
| `NEXT_PUBLIC_APP_URL` | Disarankan | Base URL publik aplikasi. |
| `RESEND_API_KEY` | Opsional | Integrasi Resend untuk email reset kata sandi. |
| `MAIL_FROM` | Opsional | Alamat pengirim email resmi klinik. |

## 2. Aturan Keamanan

1. Dilarang memakai prefix `NEXT_PUBLIC_` untuk variabel koneksi database, secret sesi, atau kunci layanan eksternal.
2. Dilarang meng-commit file `.env`, `.env.local`, atau `prisma/dev.db` ke GitHub (sudah tercakup di `.gitignore`).
3. Jika `APP_DATA_MODE=mock` dipakai pada environment `production`, `preview`, atau `VERCEL=1`, validasi startup (`npm run validate:env`) otomatis menghentikan build/server.
4. Gunakan [`.env.example`](../.env.example) sebagai template resmi.
