# Authentication & RBAC Setup Guide

Panduan konfigurasi autentikasi, manajemen peran (RBAC), token registrasi, dan pemulihan kata sandi di **Yovela Dental Clinic**.

## 1. Arsitektur Autentikasi

- **Hashing Kata Sandi**: `bcryptjs` (cost factor 10).
- **Sesi Login**: Cookie HTTP-only `yovela_session` ditandatangani dengan `HMAC-SHA256` menggunakan `AUTH_SECRET` (`SameSite=Lax`, `Secure=true` di production).
- **Durasi Sesi**:
  - Default: 12 jam.
  - Opsi **Ingat saya**: 14 hari.
- **Proteksi Rute**: [`src/proxy.ts`](../src/proxy.ts) memverifikasi token cookie di Edge sebelum mengakses `/dashboard`, `/jadwal`, `/pasien`, `/antrean`, `/poli`, `/satusehat`, `/stok`, `/kasir`, dan `/laporan`.
  - Rute publik: `/`, `/landingpage`, `/yovela`, `/display-antrean`, `/login`, `/register`, `/forgot-password`, `/reset-password`.

## 2. Peran Pengguna (Dynamic RBAC)

| Role Key | Deskripsi |
| :--- | :--- |
| `DOKTER` | Dokter Gigi Penanggung Jawab & Administrator Klinik (akses penuh + kelola akun, token, dan izin peran). |
| `DOKTER_LAIN` | Dokter Gigi Praktik (akses klinis poli/rekam medis tanpa administrasi akun klinik). |
| `PENDAFTARAN` | Petugas Front Office & Registrasi (jadwal, pasien, antrean). |
| `KASIR` | Staf Kasir & Billing (pembayaran, invoice, laporan keuangan, stok BHP). |

## 3. Membuat Akun Administrator Pertama di Production

Database production dimulai dalam keadaan bersih (tanpa akun demo). Untuk membuat akun Dokter Penanggung Jawab pertama secara aman:

1. Pastikan `DATABASE_URL` dan `DIRECT_URL` mengarah ke PostgreSQL production.
2. Buat token atau user `DOKTER` melalui Prisma Studio (`npx prisma studio --schema=prisma/schema.postgresql.prisma`) atau skrip one-off yang menghitung hash `bcryptjs`, lalu segera hapus skrip sementara setelah selesai.
3. Setelah masuk sebagai `DOKTER`, buka menu **Pengguna & Hak Akses** untuk membuat **Token Registrasi Staf** (`RegistrationToken`) bagi dokter praktik, front office, atau kasir baru agar mereka mendaftar mandiri melalui `/register`.

## 4. Pemulihan Kata Sandi (`/forgot-password` & `/reset-password`)

- Token reset dibuat acak 32-byte, disimpan sebagai hash `SHA-256` pada tabel `PasswordResetToken`, berlaku 30 menit, dan hangus setelah dipakai sekali.
- Di production, atur `RESEND_API_KEY` dan `MAIL_FROM` pada Vercel Environment Variables agar tautan reset dikirim otomatis ke email staf.
