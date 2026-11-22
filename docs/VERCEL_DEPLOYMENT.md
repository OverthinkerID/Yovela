# Vercel Deployment Guide — Yovela Dental Clinic

Panduan deployment **Yovela Dental Clinic** ke **Vercel** dengan database **Neon** atau **Supabase PostgreSQL**.

## 1. Prasyarat

1. Repository GitHub terhubung ke proyek Vercel.
2. Database PostgreSQL Production (Neon atau Supabase) sudah tersedia.
3. Tidak ada file `.env` atau kredensial yang ikut ter-commit ke GitHub.

## 2. Konfigurasi di Vercel Project Settings

Atur variabel berikut di **Project Settings → Environment Variables** (pisahkan nilai Preview dan Production):

- `APP_DATA_MODE`: `real`
- `DATABASE_URL`: Pooled PostgreSQL connection string (`sslmode=require`)
- `DIRECT_URL`: Direct PostgreSQL connection string (`sslmode=require`)
- `AUTH_SECRET`: String acak minimal 32–64 karakter
- `NEXT_PUBLIC_APP_URL`: URL domain produksi aplikasi
- `RESEND_API_KEY`: Opsional, untuk pengiriman email reset kata sandi
- `MAIL_FROM`: Opsional, alamat pengirim email resmi klinik

## 3. Alur Build Otomatis Vercel

Sesuai [`vercel.json`](../vercel.json) dan `package.json`:

1. `npm run validate:env` memverifikasi `APP_DATA_MODE=real`, koneksi PostgreSQL valid, dan `AUTH_SECRET` memenuhi syarat panjang minimum.
2. `scripts/prepare-prisma.ts` menyinkronkan `prisma/schema.postgresql.prisma` dan menghasilkan Prisma Client untuk PostgreSQL.
3. `next build` membangun seluruh rute aplikasi serta `src/proxy.ts`.

## 4. Verifikasi Pasca-Deploy

1. Jalankan migrasi skema dan master seed (`npm run db:seed`) ke PostgreSQL production (lihat [`DATABASE_MIGRATION.md`](./DATABASE_MIGRATION.md)).
2. Periksa endpoint `/api/health` dan pastikan status mengembalikan `"status": "ok"`, `"dataMode": "real"`, dan `"database": "connected"`.
3. Siapkan akun Dokter Penanggung Jawab pertama (lihat [`AUTHENTICATION_SETUP.md`](./AUTHENTICATION_SETUP.md)).
