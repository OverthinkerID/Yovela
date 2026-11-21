export interface TreatmentConfigItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  duration: string;
  priceLabel: string;
  description: string;
  highlights: string[];
  imageSrc?: string;
  accentLabel: string;
}

export interface GalleryConfigItem {
  id: string;
  title: string;
  caption: string;
  tag: string;
  imageSrc?: string;
}

export interface DoctorConfig {
  isPlaceholder: boolean;
  name: string;
  role: string;
  credentialPlaceholder: string;
  education: string[];
  experience: string;
  experienceList?: string[];
  specialties: string[];
  philosophy: string;
  imageSrc?: string;
}

export interface TestimonialConfigItem {
  id: string;
  isPlaceholder: boolean;
  patientName: string;
  treatment: string;
  rating: number;
  quote: string;
  sourceLabel: string;
}

export const LANDING_CONFIG = {
  brand: {
    name: 'Yovela Dental Clinic',
    tagline: 'A Healthier Smile Starts Here.',
    subTagline: 'Thoughtful dental care, modern treatments, and a comfortable experience designed around your smile.',
    developerCredit: 'Overthinker Studio',
  },

  navLinks: [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Treatments', href: '#treatments' },
    { label: 'Our Dentist', href: '#dentist' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Contact', href: '#contact' },
  ],

  hero: {
    eyebrow: 'Editorial Dental Care & Digital Precision',
    headline: 'A Healthier Smile Starts Here.',
    supportingText:
      'Thoughtful dental care, modern treatments, and a comfortable experience designed around your smile.',
    primaryCta: 'Book Appointment',
    secondaryCta: 'Explore Our Clinic',
    imageSrc: '', // Isi path foto asli (mis. '/images/hero-clinic.jpg') saat aset foto tersedia
    imageCaption: 'Ruang Perawatan Tenang & Steril — Yovela Dental Clinic',
    stats: [
      { value: 5, suffix: '.0', label: 'Patient Comfort Focus' },
      { value: 30, suffix: '+', label: 'Curated Dental Procedures' },
      { value: 100, suffix: '%', label: 'Digital FDI Odontogram' },
    ],
  },

  about: {
    eyebrow: '01 — About Yovela',
    headline: 'Designed to Make Every Dental Visit Calm, Clear, and Personal.',
    leadText:
      'Kami percaya perawatan gigi yang baik dimulai dari rasa tenang dan penjelasan yang jujur. Tanpa terburu-buru, tanpa istilah medis yang membingungkan.',
    bodyText:
      'Di Yovela Dental Clinic, setiap konsultasi memadukan sentuhan klinis yang lembut dengan dokumentasi visual Odontogram FDI dan transparansi rencana perawatan—agar Anda memahami setiap langkah sebelum tindakan dimulai.',
    pillars: [
      { number: '01', title: 'Calm Architecture', desc: 'Nuansa ruang hangat bernuansa Forest & Oat yang meredam kecemasan pasien.' },
      { number: '02', title: 'Visual Transparency', desc: 'Kondisi gigi ditampilkan jelas lewat pemetaan digital sebelum estimasi biaya.' },
    ],
    primaryImageSrc: '',
    secondaryImageSrc: '',
  },

  treatments: [
    {
      id: 'trt-ortho',
      category: 'Orthodontics',
      title: 'Pemasangan Behel (Ortodonti)',
      subtitle: 'Merapikan susunan gigi & posisi rahang',
      duration: '60 Menit • Kontrol Bulanan',
      priceLabel: 'Tersedia Cicilan DP',
      description:
        'Memperbaiki susunan gigi yang tidak rapi dan memperbaiki posisi rahang dengan pemantauan berkala yang terencana.',
      highlights: ['Evaluasi Profil Rahang', 'Opsi Bracket Metal & Sapphire', 'Skema Pembayaran Bertahap'],
      accentLabel: 'Orthodontics',
    },
    {
      id: 'trt-bleaching',
      category: 'Aesthetic',
      title: 'Dental Bleaching',
      subtitle: 'Pemutihan gigi tampak lebih putih natural',
      duration: '60 Menit',
      priceLabel: 'Mulai Rp 1.800.000',
      description:
        'Prosedur pemutihan gigi untuk membuat permukaan gigi tampak lebih putih natural dengan perlindungan gusi dan enamel.',
      highlights: ['Hasil Putih Natural', 'Proteksi Gusi & Enamel', 'In-Office Monitoring'],
      accentLabel: 'Aesthetic',
    },
    {
      id: 'trt-scaling',
      category: 'Periodontics',
      title: 'Scaling',
      subtitle: 'Pembersihan karang gigi ultrasonik',
      duration: '45 Menit',
      priceLabel: 'Mulai Rp 300.000',
      description:
        'Prosedur pembersihan karang gigi untuk menghindari risiko peradangan gusi dan bau mulut.',
      highlights: ['Ultrasonik Lembut', 'Polishing Noda Kopi/Teh', 'Pencegahan Radang Gusi'],
      accentLabel: 'Popular',
    },
    {
      id: 'trt-restoration',
      category: 'Conservation',
      title: 'Restorasi Gigi',
      subtitle: 'Penambalan resin komposit sewarna gigi',
      duration: '45 Menit',
      priceLabel: 'Mulai Rp 280.000',
      description:
        'Prosedur penambalan pada gigi karies atau berlubang dengan menggunakan bahan resin komposit sewarna gigi.',
      highlights: ['Komposit Nano-Hybrid', 'Warna Menyatu Natural', 'Preservasi Struktur Gigi'],
      accentLabel: 'Esthetic',
    },
    {
      id: 'trt-psa',
      category: 'Endodontics',
      title: 'Perawatan Saluran Akar',
      subtitle: 'Menyelamatkan gigi terinfeksi & abses',
      duration: '45–60 Menit',
      priceLabel: 'Mulai Rp 450.000',
      description:
        'Prosedur perawatan gigi yang bertujuan untuk merawat gigi yang sudah terinfeksi dan menghilangkan abses gigi.',
      highlights: ['Mengatasi Infeksi & Abses', 'Sterilisasi Saluran Akar', 'Mempertahankan Gigi Asli'],
      accentLabel: 'Endodontics',
    },
    {
      id: 'trt-extraction',
      category: 'Oral Surgery',
      title: 'Pencabutan Gigi',
      subtitle: 'Tindakan aman menghentikan rasa sakit & infeksi',
      duration: '30–60 Menit',
      priceLabel: 'Mulai Rp 250.000',
      description:
        'Prosedur medis untuk mengangkat gigi yang rusak, terinfeksi, atau tidak dapat dipertahankan lagi dengan tujuan menghentikan rasa sakit dan mencegah penyebaran infeksi lebih lanjut.',
      highlights: ['Anestesi Lokal Nyaman', 'Sterilisasi Autoclave Ketat', 'Panduan Pemulihan Jelas'],
      accentLabel: 'Oral Care',
    },
    {
      id: 'trt-denture',
      category: 'Prosthodontics',
      title: 'Gigi Tiruan (Palsu)',
      subtitle: 'Protesa gigi lepasan maupun cekat',
      duration: '2–3 Kunjungan',
      priceLabel: 'Konsultasi Tarif',
      description:
        'Pembuatan protesa gigi lepasan maupun cekat untuk menggantikan fungsi fonetik dan estetika gigi yang tanggal.',
      highlights: ['Fungsi Kunyah & Fonetik', 'Estetika Natural', 'Lepasan maupun Cekat'],
      accentLabel: 'Prosthetic',
    },
    {
      id: 'trt-pediatric',
      category: 'Pedodontics',
      title: 'Dental Anak (Pedodonti)',
      subtitle: 'Perawatan gigi anak ramah & edukatif',
      duration: '30–45 Menit',
      priceLabel: 'Mulai Rp 150.000',
      description:
        'Pencegahan dini gigi berlubang pada anak-anak melalui pendekatan perawatan yang ramah, nyaman, dan edukatif.',
      highlights: ['Pendekatan Ramah Anak', 'Pencegahan Karies Dini', 'Edukasi Kebersihan Mulut'],
      accentLabel: 'Kids Care',
    },
  ] as TreatmentConfigItem[],

  whyYovela: {
    eyebrow: '03 — Why Choose Yovela',
    headline: 'Thoughtful Details That Set Our Care Apart.',
    items: [
      {
        code: '01',
        title: 'Modern Dental Technology',
        desc: 'Pencatatan rekam medis elektronik, pemetaan Odontogram FDI, dan dokumentasi intraoral untuk keputusan klinis yang presisi.',
      },
      {
        code: '02',
        title: 'Comfortable, Unhurried Care',
        desc: 'Setiap slot janji temu dirancang lega agar dokter dapat mendengarkan keluhan Anda tanpa rasa tergesa.',
      },
      {
        code: '03',
        title: 'Strict Sterilization Protocol',
        desc: 'Seluruh instrumen melewati siklus sterilisasi terstandar dan dikemas tersegel demi keamanan setiap pasien.',
      },
      {
        code: '04',
        title: 'Seamless Digital Experience',
        desc: 'Booking jadwal online, persetujuan tindakan digital, hingga pembayaran fleksibel via QRIS, EDC, maupun cicilan.',
      },
    ],
  },

  technologySteps: [
    {
      step: '01',
      title: 'Digital FDI Odontogram Mapping',
      desc: 'Setiap permukaan gigi dipetakan secara real-time sehingga pasien melihat langsung area yang sehat maupun yang membutuhkan perawatan.',
    },
    {
      step: '02',
      title: 'Intraoral & Radiograph Documentation',
      desc: 'Dokumentasi visual sebelum dan sesudah tindakan tersimpan aman di riwayat kunjungan pasien untuk pemantauan jangka panjang.',
    },
    {
      step: '03',
      title: 'Digital Informed Consent & Transparent Billing',
      desc: 'Persetujuan tindakan ditandatangani secara digital dengan rincian tarif yang jelas sebelum prosedur dijalankan.',
    },
    {
      step: '04',
      title: 'SATUSEHAT FHIR R4 Readiness',
      desc: 'Arsitektur data klinis mengikuti standar terminologi medis nasional ICD-10 & ICD-9-CM Kementerian Kesehatan RI.',
    },
  ],

  doctor: {
    isPlaceholder: false,
    name: 'drg. Yuli Kartilla Panjaitan',
    role: 'DOKTER GIGI PRAKTISI',
    credentialPlaceholder: 'SIP.503/449/DRG/2026',
    education: [
      'Sarjana Kedokteran Gigi (2018) — Universitas Sumatera Utara',
      'Profesi Dokter Gigi (2021) — Universitas Sumatera Utara',
    ],
    experience: 'Memiliki pengalaman praktis lebih dari 5 tahun dalam bidang Dentistry hingga sekarang.',
    experienceList: [
      'Dokter Gigi Praktisi di Vera Dental Care (2022 s.d. 2025, Medan)',
      'Dokter Gigi Praktisi di Lanera Dental Care & TP Dental (Batam)',
      'Lebih dari 5 tahun pengalaman klinis kedokteran gigi modern',
    ],
    specialties: [
      'Ortodonti (Behel)',
      'Dental Bleaching',
      'Scaling',
      'Restorasi Gigi',
      'Perawatan Saluran Akar',
      'Pencabutan Gigi',
      'Gigi Tiruan (Palsu)',
      'Dental Anak (Pedodonti)',
    ],
    philosophy:
      '“Saya adalah seorang dokter gigi profesional yang memberikan perawatan kesehatan gigi dan mulut dengan berfokus pada kenyamanan serta kepuasan pasien, aktif menerapkan standar klinis kedokteran gigi modern yang aman dan solutif.”',
    imageSrc: '/images/drg-yuli.png',
  } as DoctorConfig,

  gallery: [
    {
      id: 'gal-1',
      title: 'Calm Reception Lounge',
      caption: 'Area tunggu bernuansa Oat Milk & Forest Green yang tenang dan bebas bau obat menyengat.',
      tag: 'Interior',
    },
    {
      id: 'gal-2',
      title: 'Treatment Suite 01',
      caption: 'Unit dental modern dengan pencahayaan nyaman dan layar edukasi pasien.',
      tag: 'Clinical Suite',
    },
    {
      id: 'gal-3',
      title: 'Sterilization Room',
      caption: 'Zona sterilisasi instrumen terpisah dengan standar autoclave medis.',
      tag: 'Hygiene',
    },
    {
      id: 'gal-4',
      title: 'Digital Consultation Corner',
      caption: 'Sesi penjelasan odontogram dan rencana perawatan secara transparan.',
      tag: 'Experience',
    },
    {
      id: 'gal-5',
      title: 'Seamless Checkout Lounge',
      caption: 'Konfirmasi jadwal kontrol dan pembayaran cepat dengan QRIS & EDC.',
      tag: 'Hospitality',
    },
  ] as GalleryConfigItem[],

  testimonials: [
    {
      id: 't-placeholder-1',
      isPlaceholder: true,
      patientName: 'Pasien A. (Contoh Placeholder)',
      treatment: 'Ultrasonic Scaling',
      rating: 5,
      quote: 'Suasana kliniknya tenang seperti studio wellness, penjelasannya sangat jelas dan proses scaling terasa nyaman.',
      sourceLabel: 'Contoh Ulasan (Placeholder)',
    },
    {
      id: 't-placeholder-2',
      isPlaceholder: true,
      patientName: 'Pasien B. (Contoh Placeholder)',
      treatment: 'Esthetic Composite',
      rating: 5,
      quote: 'Jadwal booking tepat waktu tanpa antre lama. Hasil tambalan rapi dan warnanya menyatu dengan gigi asli.',
      sourceLabel: 'Contoh Ulasan (Placeholder)',
    },
    {
      id: 't-placeholder-3',
      isPlaceholder: true,
      patientName: 'Pasien C. (Contoh Placeholder)',
      treatment: 'Orthodontic Consultation',
      rating: 5,
      quote: 'Rincian biaya dijelaskan di awal dengan opsi cicilan yang jelas, sangat membantu dan profesional.',
      sourceLabel: 'Contoh Ulasan (Placeholder)',
    },
  ] as TestimonialConfigItem[],

  appointmentCta: {
    headline: 'Your Smile Deserves the Best.',
    subheadline:
      'Jadwalkan sesi konsultasi atau perawatan Anda bersama tim Yovela Dental Clinic secara online maupun melalui WhatsApp resmi klinik.',
    whatsappNumber: '6281234567890', // Ganti dengan nomor WhatsApp resmi klinik
  },

  contact: {
    addressPlaceholder: '[Alamat Lengkap Klinik Anda, Kota — Lengkapi di src/config/landingConfig.ts]',
    phonePlaceholder: '(024) [Nomor Telepon Resmi Klinik]',
    emailPlaceholder: 'care@yoveladental.example',
    hours: [
      { day: 'Senin – Jumat', time: '09:00 – 20:00 WIB' },
      { day: 'Sabtu', time: '09:00 – 17:00 WIB' },
      { day: 'Minggu & Hari Libur', time: 'Dengan Perjanjian' },
    ],
    socials: [
      { label: 'Instagram', href: 'https://instagram.com' },
      { label: 'WhatsApp', href: 'https://wa.me/6281234567890' },
      { label: 'Google Maps', href: 'https://maps.google.com' },
    ],
  },
};
