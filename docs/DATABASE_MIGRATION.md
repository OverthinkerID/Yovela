# Database Migration Guide (Neon / Supabase PostgreSQL)

Aplikasi menggunakan `prisma/schema.prisma` sebagai **Single Source of Truth**. Skrip `scripts/prepare-prisma.ts` otomatis menghasilkan `prisma/schema.postgresql.prisma` dengan `provider = "postgresql"` dan `directUrl = env("DIRECT_URL")`.

## 1. Menyinkronkan Skema PostgreSQL

Setiap kali mengubah model di `prisma/schema.prisma`, jalankan:

```bash
npm run db:generate
```

Perintah tersebut otomatis memperbarui `prisma/schema.postgresql.prisma`.

## 2. Menerapkan Skema ke Neon / Supabase

Atur sementara `DATABASE_URL` dan `DIRECT_URL` PostgreSQL di shell terminal Anda (jangan simpan URL production ke file yang ter-commit):

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler.region.aws.neon.tech/yovela_prod?sslmode=require"
export DIRECT_URL="postgresql://USER:PASSWORD@HOST.region.aws.neon.tech/yovela_prod?sslmode=require"
```

### Opsi A — Sinkronisasi Skema Langsung (`db push`)
Cocok untuk inisialisasi awal database production kosong:

```bash
npx prisma db push --schema=prisma/schema.postgresql.prisma
```

### Opsi B — Menggunakan Prisma Migrate (Jika Folder `prisma/migrations` Tersedia)
```bash
npm run db:migrate:deploy
```

## 3. Mengisi Master Katalog Tindakan Medis (Aman untuk Production)

Setelah tabel terbentuk, jalankan master seed untuk mengisi 30 katalog tindakan standar (`TRT-001` .. `TRT-030`) **tanpa** akun demo maupun pasien dummy:

```bash
npm run db:seed
```

> **Peringatan**: Jangan pernah menjalankan `npm run db:seed:dev` ke database production. Skrip tersebut memiliki guard otomatis yang akan menolak eksekusi jika `NODE_ENV=production` atau `VERCEL=1`.
