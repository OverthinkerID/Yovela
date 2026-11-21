<div align="center">

<img src="https://cdn.simpleicons.org/nextdotjs/1B4332" width="46" height="46" alt="Yovela Dental Clinic" />

# Yovela Dental Clinic — SIM-RME v3.3

**Sistem Informasi Manajemen Klinik Gigi, Rekam Medis Elektronik (Odontogram FDI), Kasir QRIS/EDC, Laporan Laba Rugi (P&L), Stok BHP, & Landing Page Pasien Terintegrasi**

*Dikembangkan oleh **Overthinker Studio***

<p align="center">
  <img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript_Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Prisma_ORM_6-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma ORM" />
  <img src="https://img.shields.io/badge/PostgreSQL_Ready-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Vercel_Deploy-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

[Panduan Database & Deploy Vercel](./docs/PANDUAN_DATABASE_DAN_VERCEL.md) • [Fitur Utama](#fitur-utama) • [Arsitektur Route](#arsitektur-route) • [Instalasi Lokal](#instalasi-lokal)

</div>

---

## Ringkasan Proyek

**Yovela Dental Clinic** adalah aplikasi web *full-stack* modern untuk operasional klinik dokter gigi di Indonesia. Sistem ini memisahkan antarmuka **Landing Page Pasien** (`/landingpage`) dari **Portal Internal Klinik SIM-RME** (`/yovela`) sehingga siap menggunakan domain utama dan subdomain terpisah saat produksi.

- **Palet Warna Resmi:** Forest Green (`#1B4332` / `#2D6A4F`), Oat Milk (`#F5F1E8` / `#FAF7F0`), dan Red Tomato (`#E63946`).
- **Dark Forest & Light Oat Mode:** Tombol pengalih tema di header dengan penyimpanan otomatis.
- **Navigasi Adaptif:** *Floating Glass Dock* melayang di desktop (otomatis mengecil di halaman Poli) serta *iPhone-style 5-Slot Floating Bottom Bar* di perangkat seluler.
- **Offline-Ready:** Seluruh ikon menggunakan `lucide-react` lokal dan font `Poppins` *self-hosted* via `next/font/google`.

---

## Fitur Utama

| Modul | Deskripsi Kemampuan |
| :--- | :--- |
| **Landing Page & Booking Online** | Profil klinik, profil dokter, katalog layanan gigi, testimoni pasien (Aplikasi & Google Reviews), serta booking *real-time* yang langsung terkunci di jadwal dokter. |
| **Notifikasi WhatsApp Webhook** | Integrasi gateway **Fonnte** / **Wablas** untuk mengirim konfirmasi booking otomatis ke pasien & notifikasi ke admin klinik. |
| **Rekam Medis & Odontogram FDI** | Peta 32 gigi dewasa standar FDI (`Mesial`/`Distal`/`Buccal`/`Lingual`), SOAP klinis, riwayat multi-kunjungan, E-Resep, **Informed Consent Tanda Tangan Digital Canvas**, & unggah foto intraoral/rontgen. |
| **Antrean & Display TV Monitor** | Panggilan antrean lintas perangkat berbasis database (`/api/queue/call`) dengan pengumuman suara otomatis di layar ruang tunggu (`/display-antrean`). |
| **Kasir, QRIS Dinamis & EDC Bridge** | Master Tarif dinamis (CRUD), diskon, skema DP & cicilan (`InvoicePayment`), generator QRIS EMVCo dinamis, & jembatan mesin EDC. |
| **Laporan Keuangan & Laba Rugi (P&L)** | Kas Masuk Aktual vs Piutang Cicilan, pencatatan **Pengeluaran Bulanan/Tahunan** khusus Admin (Gaji, Listrik, Air, Alat Medis, Bahan/BHP), kalkulasi **Laba Bersih & Margin**, serta ekspor CSV & cetak PDF P&L 1 lembar siap akuntan. |
| **Manajemen Stok BHP (Logistik)** | Kartu stok Bahan Habis Pakai (sarung tangan, komposit, anestesi, dll.), sinkronisasi otomatis restock ke Pengeluaran Keuangan, & peringatan stok menipis di lonceng notifikasi. |
| **Keamanan, Token & Dynamic RBAC** | Cookie HTTP-only (`HMAC-SHA256` + `bcryptjs`), registrasi staf berbasis **Token Peran**, serta editor **Role & Wewenang** dinamis di menu Pengaturan. |

---

## Ekosistem & Layanan Pihak Ketiga

<p align="left">
  <img src="https://img.shields.io/badge/Vercel-Hosting_&_Serverless-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/Neon-Serverless_PostgreSQL-00E599?style=flat-square&logo=postgresql&logoColor=0E261C" alt="Neon PostgreSQL" />
  <img src="https://img.shields.io/badge/Supabase-Managed_PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/GitHub-Source_&_Pages-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub" />
  <img src="https://img.shields.io/badge/WhatsApp_Gateway-Fonnte_/_Wablas-25D366?style=flat-square&logo=whatsapp&logoColor=white" alt="WhatsApp Gateway" />
  <img src="https://img.shields.io/badge/Cloudflare-DNS_&_Subdomain-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare" />
</p>

---

## Arsitektur Route

| URL | Akses | Fungsi |
| :--- | :--- | :--- |
| `/landingpage` (dan `/`) | Publik (Pasien) | Profil klinik, layanan, testimoni, & booking online tanpa tautan portal internal staf. |
| `/yovela` (dan `/login`) | Internal Staf | Gerbang login & aktivasi akun staf berbasis token registrasi. |
| `/dashboard` | Staf Terautentikasi | Dasbor operasional harian dengan live queue, booking, KPI kas masuk, & banner beranimasi. |
| `/jadwal`, `/pasien`, `/antrean` | Dokter & Front Office | Jadwal janji temu, pendaftaran pasien, antrean, & Display TV (`/display-antrean`). |
| `/poli`, `/satusehat` | Dokter | Pemeriksaan klinis, Odontogram FDI, Informed Consent digital, media intraoral, & SATUSEHAT. |
| `/stok` | Dokter & Front Office | Inventaris Bahan Habis Pakai (BHP) dengan restock otomatis ke pengeluaran keuangan. |
| `/kasir`, `/laporan` | Dokter & Kasir | Billing QRIS/EDC/Cicilan, laporan omset, & tab **Pengeluaran & Laba Bersih** (khusus Admin). |

---

## Instalasi Lokal

```bash
git clone https://github.com/OverthinkerID/Yovela.git
cd Yovela
npm install
npx prisma db push
npx prisma db seed
npm run dev:all
```

### Daftar Script NPM

| Script | Fungsi |
| :--- | :--- |
| `npm run dev` | Menjalankan server pengembangan Next.js (`http://localhost:3000`). |
| `npm run dev:all` | Menyinkronkan Landing Page TSX ke `docs/` lalu menjalankan `next dev`. |
| `npm run build:landing` | Membangun HTML statis Landing Page dari sumber TSX ke `docs/index.html`. |
| `npm run sync:docs` | Alias untuk `build:landing` (menyalin HTML, CSS, JS runtime, & seluruh aset `public/images/` ke `docs/`). |
| `npm run validate:docs` | Memvalidasi kelengkapan `docs/index.html`, aset gambar, CSS, JS runtime, & font Poppins. |
| `npm run build` | Menjalankan `prisma generate && next build` untuk build produksi. |

### Pemisahan Role Dokter (RBAC)

- **DOKTER (Owner / Admin Klinik):** Akses penuh ke seluruh modul klinis, kasir, laporan laba rugi, pengeluaran, akun staf, token registrasi, pengaturan RBAC, dan webhook WhatsApp.
- **DOKTER_LAIN (Dokter Gigi Praktik Non-Admin):** Akses ke modul klinis & operasional (`dashboard`, `jadwal`, `pasien`, `antrean`, `display-antrean`, `poli`, `satusehat`, `stok`) tanpa akses admin/pengeluaran. Dapat diatur dinamis lewat tab **Role & Wewenang**.
