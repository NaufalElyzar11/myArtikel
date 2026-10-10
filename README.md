# Naufal Elyzar — Portfolio & Engineering Case Studies

Repositori web portofolio personal dan dokumentasi studi kasus teknis proyek rekayasa (**Robotics**, **Computer Vision**, **IoT & Embedded Systems**, dan **Software Development**).

Web ini dibangun secara *clean*, ringan, dan tanpa dependensi framework yang membengkak, mengutamakan performa tinggi, aksesibilitas semantik, serta estetika visual *warm-dark & amber gold* bertema rekayasa robotika.

---

## 🚀 Proyek Unggulan

Detail teknis setiap proyek terintegrasi langsung di repositori ini:

### 1. [PRONE.ID (Akademi Madrasah Digital)](./projects/amd/)
* **Kategori:** UAV · Agri-tech · IoT Telemetry
* **Tahun:** 2021 — 2022
* **Prestasi:** The Most Attractive Team — Akademi Madrasah Digital (Kemenag RI & XL Axiata)
* **Ringkasan:** Sistem integrasi 3 pilar: drone pemetaan udara & penyiraman terjadwal, node sensor kelembapan tanah *in-situ*, dan Raspberry Pi Station sebagai gateway data ke dashboard terpusat untuk efisiensi perkebunan sawit.

### 2. [TRACO-BOT (Madrasah Robotic Competition)](./projects/mrc/)
* **Kategori:** Robotics · Computer Vision · Machine Learning
* **Tahun:** 2022
* **Prestasi:** Finalis Madrasah Robotic Competition (MRC) Nasional
* **Ringkasan:** Konveyor pemilah sampah otomatis berbasis model inferensi *deep learning* yang mengklasifikasikan sampah ke dalam 6 kategori (logam, kaca, plastik, kertas, organik, residu), dilengkapi lengan aktuator pemilah presisi dan pencatatan telemetri IoT.

### 3. [Wasaka Hexapod — Hexaka V3](./projects/hexaka/)
* **Kategori:** Robotics · Computer Vision · Autonomous Navigation
* **Tahun:** 2024 — 2026
* **Tim:** Wasaka Robotic Team
* **Prestasi / Event:** Finalis BRIN Exhibition on Smart Technology (BEST) 2026
* **Ringkasan:** Robot berkaki enam (hexapod) 18-DOF Dynamixel dengan kinematika inversi (IK 3-DOF per kaki), generator *tripod gait* dinamis, stabilisasi kemiringan bodi tertutup (*closed-loop PID body leveling* berbasis IMU 9-DOF), navigasi otonom visi murni tanpa LiDAR, pelacak manusia YOLOv8, dan integrasi siaran interaktif TikTok Live + 3D Digital Twin 50 Hz.
* **Repositori Resmi:** [Wasaka-Robotic-Team/HexakaV3](https://github.com/Wasaka-Robotic-Team/HexakaV3)

### 4. [Mangrovepreneurs](./projects/mangrovepreneurs/)
* **Klien / konteks:** FEB ULM — kebutuhan ajang nasional Innovilleague 2026, diselenggarakan Kementerian Koordinator Bidang Pemberdayaan Masyarakat RI.
* **Teknologi:** ESP32, BME280, load cell dengan HX711, Firebase Realtime Database, Flutter / Dart.
* **Ringkasan:** Pemantauan suhu, kelembapan, dan berat sarang kelulut melalui aplikasi mobile. Ambang suhu/kelembapan dan target berat panen dapat diatur pengguna; aplikasi menyediakan notifikasi kondisi dan kesiapan panen.

### 5. [AAC — Bicara Warna](./projects/aac/)
* **Klien:** Pendidikan Khusus ULM — Kelompok 2.
* **Kontribusi:** Wiring PCB dan pemrograman Arduino IDE dengan sketch `.ino`.
* **Ringkasan:** Alat bantu komunikasi dengan tiga tombol “mau”, “iya”, dan “tidak”, Arduino Nano V3, pemutar MP3, dan keluaran speaker.

### 6. [TekSif — Chromoney](./projects/teksif/)
* **Klien:** Pendidikan Khusus ULM — Kelompok 4.
* **Kontribusi:** Wiring PCB dan pemrograman Arduino IDE dengan sketch `.ino`.
* **Ringkasan:** Perangkat asistif pengenal nominal uang melalui sensor warna dan keluaran suara untuk pengguna tunanetra.

Beranda mempertahankan Hexaka sebagai proyek unggulan, diikuti Mangrovepreneurs, AAC, TekSif, PRONE.ID, dan TRACO-BOT. Filter **Semua / Robotika / Teknologi asistif / IoT** mendukung proyek dengan beberapa kategori. Pilihan kategori tetap aktif saat mengganti bahasa; semua proyek tetap tampil tanpa JavaScript.

---

## 📁 Struktur Direktori

Arsitektur repositori disusun secara modular dan terstruktur:

```
myArtikel/
├── assets/
│   ├── css/
│   │   └── project-detail.css   # Stylesheet bersama halaman studi kasus proyek
│   ├── js/
│   │   └── project-detail.js    # Skrip bersama (TOC ScrollSpy & Lightbox media)
│   └── images/
│       ├── profile/             # Foto profil, partner, dan CV
│       ├── gallery/             # Galeri fotografi lanskap
│       └── projects/
│           ├── prone-id/        # Dokumentasi foto PRONE.ID
│           ├── traco-bot/       # Dokumentasi foto TRACO-BOT (MRC)
│           └── hexaka/          # Dokumentasi foto Wasaka Hexapod
├── projects/
│   ├── amd/                     # Detail studi kasus PRONE.ID
│   │   └── index.html
│   ├── mrc/                     # Detail studi kasus TRACO-BOT
│   │   └── index.html
│   ├── hexaka/                  # Detail studi kasus Wasaka Hexapod (Hexaka V3)
│   │   └── index.html
│   ├── mangrovepreneurs/        # Perangkat pemantauan kelulut & aplikasi Flutter
│   │   └── index.html
│   ├── aac/                     # Alat bantu komunikasi Bicara Warna
│   │   └── index.html
│   └── teksif/                  # Pengenal nominal uang Chromoney
│       └── index.html
├── AMD/
│   └── index.html               # Pengalihan (redirect) untuk kompatibilitas tautan lama
├── index.html                   # Halaman utama portofolio & biodata
├── style.css                    # Stylesheet utama (warm-dark & gold theme)
├── script.js                    # Interaktivitas halaman utama (nav, lightbox, reveal)
└── README.md                    # Dokumentasi repositori
```

---

## 🛠️ Teknologi yang Digunakan

* **Markup:** Semantic HTML5 (struktur bersih, ramah SEO, dan aksesibel).
* **Styling:** Vanilla CSS3 dengan CSS Custom Properties (Design Tokens), Flexbox, CSS Grid, dan dukungan `prefers-reduced-motion`.
* **Tipografi:** Google Fonts (`Big Shoulders Display`, `IBM Plex Sans`, `IBM Plex Mono`).
* **Interaktivitas:** JavaScript tanpa framework untuk pilihan bahasa, navigasi bagian aktif, daftar isi, serta galeri dengan keyboard dan gestur sentuh.
* **Dependensi situs:** Tidak memerlukan bundler atau library JavaScript eksternal saat digunakan. `linkedom` hanya digunakan untuk pengujian pengembangan.

## Bahasa, galeri, dan pemeliharaan

- Tombol **ID / EN** tersedia di beranda dan keenam halaman proyek. Pilihan disimpan dalam `localStorage` dengan kunci `naufal-language` dan dibawa melalui parameter `?lang=id` atau `?lang=en` saat mengikuti tautan halaman lokal. Parameter URL yang valid didahulukan; bahasa awal adalah Indonesia.
- Kamus lokal ada di `assets/js/translations.js`. Atribut `data-i18n` pada HTML merujuk ke kunci kamus. Saat mengubah tulisan, perbarui versi Indonesia pada HTML (agar tetap terbaca tanpa JavaScript) serta pasangan `id` dan `en` dalam kamus. Atribut gambar, caption, dan label aksesibilitas menggunakan `data-i18n-alt`, `data-i18n-data-caption`, dan `data-i18n-aria-label`.
- `assets/js/i18n.js` mengatur pergantian bahasa. Terjemahan dibundel bersama situs dan tidak memanggil layanan eksternal. Dokumen CV dan nama resmi organisasi/kompetisi tetap mengikuti sumber aslinya.
- `assets/js/gallery.js` digunakan bersama oleh semua halaman. Foto dapat dibuka, diganti dengan tombol panah atau swipe, dan ditutup dengan Escape. Fokus keyboard dikembalikan ke foto asal.
- `assets/images/optimized/` berisi versi WebP dengan beberapa lebar, dipilih melalui `srcset`. Pratinjau memakai gambar asli yang tersedia; jika gambar asli tidak tersedia, galeri memakai varian WebP terbesar. Jika mengganti foto, perbarui juga varian WebP, `srcset`, dan dimensi intrinsiknya.
- Cover proyek baru memakai foto hasil alat. Galeri detail menampilkan keterangan untuk hasil, progres wiring, rancangan casing, aplikasi, dan survei sesuai nama serta isi foto. Kapitalisasi nama berkas harus dipertahankan untuk hosting yang membedakan huruf besar dan kecil. Gambar hasil TekSif memakai nama WebP berdasarkan revisi foto agar penggantian gambar tidak tertahan cache browser.
- Nanda Ikbar berperan sebagai **Electrical** dan Siti Fathimah Az-Zahra sebagai **Robotic Consultant**. Foto kecil memakai varian WebP 96 / 192 px.
- Tema gelap tetap dipakai. Navigasi beranda beralih ke menu mobile pada 1080 px; daftar isi proyek dapat dilipat pada 960 px. Animasi menghormati pengaturan reduced motion.

### Pemeriksaan

Dengan Node.js 20.19 atau lebih baru:

```bash
npm ci
npm test
```

Tes memeriksa kedua bahasa di tujuh halaman, penyimpanan dan fallback bahasa, galeri, menu, daftar isi, filter kategori, cover proyek baru, dan partner. Tes DOM ini tidak merender tampilan. Jika sandbox membatasi pembuatan proses tes Node, gunakan `node --test --test-isolation=none tests/site.test.cjs` pada Node.js yang mendukung opsi tersebut.

Pemeriksaan struktur tambahan dengan Python dan `beautifulsoup4`:

```bash
python tests/check_site.py
```

Untuk pemeriksaan visual, buka kedua bahasa pada lebar 320, 390, 768, 1024, dan 1440 px. Periksa menu, judul panjang, daftar isi, galeri, dan navigasi keyboard. Pemeriksaan otomatis bukan pengganti pemeriksaan visual ini.

---

## 💻 Menjalankan Secara Lokal

Situs web ini bersifat statis murni sehingga dapat dijalankan dengan mudah melalui metode apa pun:

### Opsi 1: Menggunakan Python (Direkomendasikan)
Buka terminal di direktori proyek ini, lalu jalankan:
```bash
# Python 3
python -m http.server 8000
```
Buka peramban di `http://localhost:8000`.

### Opsi 2: Menggunakan Node.js / npx
```bash
npx serve .
```

### Opsi 3: Buka Langsung di Peramban
Cukup klik ganda berkas `index.html` untuk langsung melihat halaman utama di peramban web Anda.

---

## 📬 Kontak & Tautan

* **Email:** [nelyzar8@gmail.com](mailto:nelyzar8@gmail.com) / [naufalelyzar11@gmail.com](mailto:naufalelyzar11@gmail.com)
* **LinkedIn:** [Naufal Elyzar](https://www.linkedin.com/in/naufal-elyzar-8b8764296/)
* **GitHub:** [@NaufalElyzar11](https://github.com/NaufalElyzar11)
* **Organisasi Robotika:** [Wasaka Robotic Team](https://github.com/Wasaka-Robotic-Team)

---
© Naufal Elyzar. Seluruh hak cipta dilindungi.
