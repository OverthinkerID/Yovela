# Local Development Guide — Yovela Dental Clinic

Panduan menjalankan aplikasi **Yovela Dental Clinic** secara lokal di macOS / Windows / Linux.

## 1. Persiapan Awal

1. Salin template environment:
   ```bash
   cp .env.example .env.local
   ```
2. Pastikan isi `.env.local` untuk mode database lokal (SQLite):
   ```env
   NODE_ENV=development
   APP_DATA_MODE=real
   DATABASE_URL="file:./dev.db"
   AUTH_SECRET="dev-secret-lokal-ganti-dengan-string-acak-minimal-32-karakter"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```
   > Jika ingin mengembangkan UI tanpa database lokal, ubah sementara `APP_DATA_MODE=mock` (hanya berlaku di lokal, ditolak otomatis di Vercel).

## 2. Instalasi & Sinkronisasi Database Lokal

```bash
npm install
npm run validate:env
npm run db:generate
npx prisma db push
npm run db:seed:dev
```

- `npm run db:generate` otomatis menyinkronkan `prisma/schema.postgresql.prisma` dari `prisma/schema.prisma` (Single Source of Truth) dan menghasilkan Prisma Client.
- `npm run db:seed:dev` mengisi akun testing lokal, 30 katalog tindakan, pasien awal, jadwal, dan antrean secara idempoten (otomatis menolak berjalan di production).

## 3. Akun Testing Lokal (Setelah `npm run db:seed:dev`)

| Peran | Email | Username | Kata Sandi |
| :--- | :--- | :--- | :--- |
| Dokter Penanggung Jawab | `admin@yovela.dev.local` | `yulipanjaitan` | `admin123` |
| Dokter Gigi Praktik | `dokter.praktik@yovela.dev.local` | `dokter2` | `dokter123` |
| Front Office | `frontoffice@yovela.dev.local` | `pendaftaran` | `fo123` |
| Kasir | `kasir@yovela.dev.local` | `kasir` | `kasir123` |

## 4. Menjalankan Server Development

```bash
# Menjalankan Next.js dev server saja
npm run dev

# Atau menyinkronkan landing page statis (docs/index.html) + menjalankan dev server
npm run dev:all
```

## 5. Pengujian Fitur Reset Kata Sandi Lokal

Saat mengakses `/forgot-password` pada environment lokal (non-production, non-Vercel), respons API menyediakan `devResetPath` sehingga tautan reset kata sandi muncul langsung di layar tanpa memerlukan server SMTP eksternal.
