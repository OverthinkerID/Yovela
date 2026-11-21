```markdown
<div align="center">

# Panduan Setup Database Cloud & Deploy ke Vercel

**Yovela Dental Clinic — SIM-RME Production Deployment Guide**

<p align="center">
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/Neon_PostgreSQL-00E599?style=for-the-badge&logo=postgresql&logoColor=0E261C" alt="Neon" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Prisma_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
</p>

</div>

---

## Mengapa Perlu PostgreSQL di Vercel?

Saat berjalan di `localhost`, Yovela Dental Clinic menggunakan **SQLite** (`prisma/dev.db`) agar praktis tanpa server database tambahan. Namun, **Vercel Serverless Functions** bersifat sementara (*ephemeral filesystem*) sehingga file SQLite lokal tidak tersimpan permanen. Untuk produksi di Vercel, gunakan **PostgreSQL Cloud** gratis dari **Neon** atau **Supabase**.

---

## <img src="https://cdn.simpleicons.org/postgresql/4169E1" width="22" height="22" align="center" /> Langkah 1 — Membuat Database PostgreSQL Cloud

### Opsi A: Neon (Disarankan — Tercepat & Native di Vercel)
<p><img src="https://img.shields.io/badge/Neon-Serverless_Postgres-00E599?style=flat-square&logo=postgresql&logoColor=0E261C" alt="Neon" /></p>

1. Buka [https://neon.tech](https://neon.tech) lalu daftar/masuk dengan akun **GitHub**.
2. Klik **New Project**, beri nama `yovela-dental-db`, lalu pilih region **Singapore (`ap-southeast-1`)**.
3. Salin **Pooled Connection String** dari dashboard Neon untuk variabel `DATABASE_URL`.

### Opsi B: Supabase
<p><img src="https://img.shields.io/badge/Supabase-Managed_Postgres-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" /></p>

1. Buka [https://supabase.com](https://supabase.com) lalu masuk dengan akun **GitHub**.
2. Klik **New Project**, beri nama `yovela-dental`, pilih region **Southeast Asia (Singapore)**, lalu catat password database Anda.
3. Buka **Project Settings → Database → Connection string → URI (Transaction Pooler, port 6543)** dan salin untuk `DATABASE_URL`.

---

## <img src="https://cdn.simpleicons.org/prisma/2D3748" width="22" height="22" align="center" /> Langkah 2 — Mengubah Provider Prisma ke PostgreSQL

1. Buka `prisma/schema.prisma`.
2. Ubah `datasource db` dari `sqlite` ke `postgresql`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}