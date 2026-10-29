const navMenu = document.getElementById('navMenu');
const navToggle = document.getElementById('navToggle');
const menuIsMobile = window.matchMedia('(max-width: 1080px)');

function setMenu(open) {
  if (!navMenu || !navToggle) return;
  navMenu.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', window.siteI18n.t(open ? 'ui.closeMenu' : 'ui.openMenu'));
}
navToggle?.addEventListener('click', () => setMenu(!navMenu.classList.contains('open')));
navMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('click', event => {
  if (navMenu && navToggle && !navMenu.contains(event.target) && !navToggle.contains(event.target)) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navMenu?.classList.contains('open')) {
    setMenu(false);
    navToggle.focus();
  }
});
menuIsMobile.addEventListener('change', () => setMenu(false));
document.addEventListener('languagechange', () => setMenu(navMenu?.classList.contains('open') || false));
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const sectionLinks = [...(navMenu?.querySelectorAll('a[href^="#"]') || [])];
const overviewSections = [...document.querySelectorAll('main > section[id]')];
let pending = false;
function updateSection() {
  pending = false;
  const currentSection = overviewSections.filter(section => section.getBoundingClientRect().top <= 150)
    .sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top)[0];
  const active = currentSection && sectionLinks.find(link => link.getAttribute('href') === `#${currentSection.id}`);
  sectionLinks.forEach(link => {
    if (link === active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
window.addEventListener('scroll', () => {
  if (!pending) { pending = true; requestAnimationFrame(updateSection); }
}, { passive: true });
window.addEventListener('resize', updateSection);
document.addEventListener('languagechange', updateSection);
updateSection();

const projectBrowser = document.querySelector('.project-browser');
const projectFilters = [...document.querySelectorAll('[data-project-filter]')];
const projectCards = [...document.querySelectorAll('[data-project-category]')];

if (projectBrowser && projectFilters.length) {
  const count = projectBrowser.querySelector('.project-count');
  let selectedCategory = 'all';
  function filterProjects() {
    let visible = 0;
    projectCards.forEach(card => {
      const matches = selectedCategory === 'all' || card.dataset.projectCategory.split(' ').includes(selectedCategory);
      card.hidden = !matches;
      if (matches) visible++;
    });
    projectFilters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.projectFilter === selectedCategory)));
    count.textContent = `${visible} / ${projectCards.length} ${window.siteI18n.t('projects.count')}`;
  }
  projectFilters.forEach(button => button.addEventListener('click', () => {
    selectedCategory = button.dataset.projectFilter;
    filterProjects();
  }));
  document.addEventListener('languagechange', filterProjects);
  projectBrowser.hidden = false;
  filterProjects();
}

const devFilters = [...document.querySelectorAll('[data-dev-filter]')];
const devCards = [...document.querySelectorAll('[data-dev-category]')];
if (devFilters.length && devCards.length) {
  devFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.devFilter;
      devFilters.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      devCards.forEach(card => {
        const match = cat === 'all' || card.dataset.devCategory.split(' ').includes(cat);
        card.hidden = !match;
      });
    });
  });
}

const certFilters = [...document.querySelectorAll('[data-cert-filter]')];
const certCards = [...document.querySelectorAll('[data-cert-category]')];
if (certFilters.length && certCards.length) {
  certFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.certFilter;
      certFilters.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      certCards.forEach(card => {
        const match = cat === 'all' || card.dataset.certCategory.split(' ').includes(cat);
        card.hidden = !match;
      });
    });
  });
}

const isEn = () => window.siteI18n?.language === 'en';

const skillItems = [...document.querySelectorAll('#skillsGrid [data-skill-key]')];
const skillSpotlightTitle = document.getElementById('skillSpotlightTitle');
const skillSpotlightDesc = document.getElementById('skillSpotlightDesc');
let activeSkillKey = 'arduino';

const skillNotes = {
  arduino: {
    titleId: 'Arduino & Mikrokontroler',
    titleEn: 'Arduino & Microcontrollers',
    id: 'Digunakan pada AAC Bicara Warna (Arduino Nano V3), TekSif Chromoney, TRACO-BOT, dan kurikulum mengajar ekstrakurikuler robotika.',
    en: 'Used in AAC Bicara Warna (Arduino Nano V3), TekSif Chromoney, TRACO-BOT, and robotics extracurricular teaching.'
  },
  raspi: {
    titleId: 'Raspberry Pi 5 (SBC)',
    titleEn: 'Raspberry Pi 5 (SBC)',
    id: 'Otak komputasi utama pada Wasaka Hexapod (Raspberry Pi 5) dan stasiun gateway penerima telemetri radio pada PRONE.ID.',
    en: 'Main onboard computer on Wasaka Hexapod (Raspberry Pi 5) and central RF telemetry gateway station on PRONE.ID.'
  },
  ros2: {
    titleId: 'ROS2 (Robot Operating System)',
    titleEn: 'ROS2 (Robot Operating System)',
    id: 'Arsitektur node modular dan komunikasi antar-proses untuk sistem navigasi dan kinematika robot di Wasaka Robotic Team.',
    en: 'Modular node architecture and inter-process communication for robot navigation and kinematics at Wasaka Robotic Team.'
  },
  dynamixel: {
    titleId: 'Servo Dynamixel AX-12A',
    titleEn: 'Dynamixel AX-12A Servos',
    id: 'Mengendalikan 18 sendi (Coxa, Femur, Tibia) secara serentak via paket komunikasi serial kecepatan tinggi pada Hexaka V3.',
    en: 'Controlling 18 joints (Coxa, Femur, Tibia) simultaneously via high-speed serial packet communication on Hexaka V3.'
  },
  cpp: {
    titleId: 'C / C++ Embedded',
    titleEn: 'Embedded C / C++',
    id: 'Pemrograman firmware latensi rendah untuk mikrokontroler Arduino dan ESP32, pembacaan ADC, dan filter sinyal sensor.',
    en: 'Low-latency firmware programming for Arduino and ESP32 microcontrollers, ADC reading, and sensor signal filtering.'
  },
  ino: {
    titleId: 'Arduino IDE (.ino)',
    titleEn: 'Arduino IDE (.ino)',
    id: 'Lingkungan pengembangan firmware utama untuk merakit logika tombol suara AAC Bicara Warna, Chromoney, dan modul panduan CetakIn.',
    en: 'Primary firmware environment for building voice-button logic in AAC Bicara Warna, Chromoney, and CetakIn component guides.'
  },
  wiring: {
    titleId: 'Wiring PCB & Penyolderan',
    titleEn: 'PCB Wiring & Soldering',
    id: 'Penataan jalur kabel presisi di atas PCB dot-matrix 10,5×7 cm agar 21 komponen muat rapi ke dalam casing cetak 3D.',
    en: 'Precision cable routing and soldering on 10.5×7 cm dot-matrix PCBs to fit 21 components cleanly inside 3D-printed enclosures.'
  },
  python: {
    titleId: 'Python 3 (Sertifikasi Dicoding)',
    titleEn: 'Python 3 (Dicoding Certified)',
    id: 'Bahasa utama untuk perhitungan matriks Inverse Kinematics, pipeline visi OpenCV/ONNX, dan streaming telemetri UDP 50 Hz.',
    en: 'Core language for Inverse Kinematics matrix math, OpenCV/ONNX vision pipelines, and 50 Hz UDP telemetry streaming.'
  },
  ml: {
    titleId: 'Machine Learning (Sertifikasi Dicoding)',
    titleEn: 'Machine Learning (Dicoding Certified)',
    id: 'Klasifikasi citra 6 kategori sampah pada konveyor TRACO-BOT (<1,2 detik/objek) dan deteksi korban pada misi robot SAR.',
    en: 'Six-class waste classification on the TRACO-BOT conveyor (<1.2s/item) and victim detection in SAR robotics.'
  },
  yolo: {
    titleId: 'YOLOv8 & YOLO11 (ONNX CPU Optimization)',
    titleEn: 'YOLOv8 & YOLO11 (ONNX CPU Optimization)',
    id: 'Deteksi rintangan lintasan otonom (BRIN BEST 2026) dan pelacakan manusia real-time pada Raspberry Pi 5 tanpa GPU.',
    en: 'Autonomous course obstacle detection (BRIN BEST 2026) and real-time human tracking on Raspberry Pi 5 CPU.'
  },
  opencv: {
    titleId: 'OpenCV',
    titleEn: 'OpenCV',
    id: 'Segmentasi lantai, analisis tepian (edge detection), optical flow, dan pemotongan ROI kamera pada Hexaka V3 & TRACO-BOT.',
    en: 'Floor segmentation, edge detection, optical flow, and camera ROI preprocessing on Hexaka V3 & TRACO-BOT.'
  },
  objdet: {
    titleId: 'Deteksi Objek Visual',
    titleEn: 'Visual Object Detection',
    id: 'Mengubah umpan kamera tunggal menjadi keputusan arah gerak robot dan pemicu lengan aktuator pemilah.',
    en: 'Translating single-camera feeds into spatial steering decisions and mechanical sorting triggers.'
  },
  dfe: {
    titleId: 'Digital Forensics (EC-Council D|FE Certified)',
    titleEn: 'Digital Forensics (EC-Council D|FE Certified)',
    id: 'Tersertifikasi resmi oleh EC-Council (Skor ujian 89,33%, ID ECC1467203859) dalam investigasi forensik Windows/Linux, akuisisi bukti, dan analisis malware.',
    en: 'Officially certified by EC-Council (89.33% exam score, ID ECC1467203859) in Windows/Linux forensics, evidence acquisition, and malware analysis.'
  },
  data: {
    titleId: 'Data Analytics & Visualisasi (Cisco & Dicoding)',
    titleEn: 'Data Analytics & Visualization (Cisco & Dicoding)',
    id: 'Pengolahan data telemetri sensor, visualisasi tren grafik (fl_chart), serta lulusan Cisco Data Analytics Essentials dan Dicoding Visualisasi Data.',
    en: 'Sensor telemetry analysis, time-series visualization (fl_chart), and graduate of Cisco Data Analytics Essentials & Dicoding Data Visualization.'
  },
  html: {
    titleId: 'HTML5 Semantik',
    titleEn: 'Semantic HTML5',
    id: 'Membangun struktur antarmuka web portofolio, platform CetakIn, dan aplikasi web yang aksesibel.',
    en: 'Building accessible semantic markup for this portfolio, the CetakIn platform, and web applications.'
  },
  css: {
    titleId: 'CSS3 Modern & Tailwind CSS',
    titleEn: 'Modern CSS3 & Tailwind CSS',
    id: 'Perancangan tata letak responsif lintas perangkat pada portofolio, CetakIn, dan proyek Cloud Resource Manager (Tailwind CSS v4).',
    en: 'Crafting responsive layouts across mobile and desktop viewports for CetakIn and Cloud Resource Manager (Tailwind CSS v4).'
  },
  js: {
    titleId: 'JavaScript (ES6+)',
    titleEn: 'JavaScript (ES6+)',
    id: 'Membangun konfigurator CAD 2D Clicker Lab di CetakIn, simulasi interaktif di browser, serta visualisasi Digital Twin 3D.',
    en: 'Building the 2D CAD Clicker Lab configurator on CetakIn, browser hardware simulators, and 3D Digital Twin visualizations.'
  },
  php: {
    titleId: 'PHP 8.2 & Laravel 12',
    titleEn: 'PHP 8.2 & Laravel 12',
    id: 'Digunakan pada Sistem Informasi Cuti Berjenjang PKL-Kominfo (Spatie RBAC, DomPDF, Fonnte WhatsApp), dan Cloud IaaS Manager.',
    en: 'Used in PKL-Kominfo multi-role leave system (Spatie RBAC, DomPDF, Fonnte WhatsApp), and Cloud IaaS Manager.'
  },
  ci4: {
    titleId: 'CodeIgniter 4',
    titleEn: 'CodeIgniter 4',
    id: 'Kerangka kerja backend utama pada platform wisata dan e-ticketing Banua-Tour beserta fitur batch import Excel dan verifikasi tiket.',
    en: 'Primary backend framework for the Banua-Tour tourism and e-ticketing platform with Excel batch import and ticket verification.'
  },
  nodejs: {
    titleId: 'Node.js & Express.js',
    titleEn: 'Node.js & Express.js',
    id: 'Menopang backend produksi CetakIn Cloud ERP (multi-unit kasir, kalkulator HPP 3D print, dan rekonsiliasi saldo 1-QRIS otomatis).',
    en: 'Powers the production CetakIn Cloud ERP backend (multi-unit POS, 3D print COGS calculator, and automated 1-QRIS reconciliation).'
  },
  react: {
    titleId: 'React & TypeScript (Inertia.js)',
    titleEn: 'React & TypeScript (Inertia.js)',
    id: 'Digunakan pada antarmuka Cetakin Cloud untuk unggah berkas cetak 3D (STL/3MF), validasi spesifikasi, dan alur penawaran harga.',
    en: 'Used in the Cetakin Cloud frontend for 3D print file intake (STL/3MF), specification validation, and quotation workflows.'
  },
  mysql: {
    titleId: 'MySQL, PostgreSQL & SQLite',
    titleEn: 'MySQL, PostgreSQL & SQLite',
    id: 'Manajemen basis data relasional untuk Banua-Tour, PKL-Kominfo, Cloud IaaS Manager (MySQL 8), dan Cetakin Cloud (PostgreSQL).',
    en: 'Relational database design for Banua-Tour, PKL-Kominfo, Cloud IaaS Manager (MySQL 8), and Cetakin Cloud (PostgreSQL).'
  },
  docker: {
    titleId: 'Docker & Linux Server',
    titleEn: 'Docker & Linux Server',
    id: 'Orkestrasi kontainer multi-layanan (Nginx, PHP-FPM, MySQL/PostgreSQL, SeaweedFS S3) pada proyek Cloud Computing dan Cetakin Cloud.',
    en: 'Multi-container orchestration (Nginx, PHP-FPM, MySQL/PostgreSQL, SeaweedFS S3) on Cloud Computing and Cetakin Cloud.'
  },
  esp32: {
    titleId: 'ESP32 Wi-Fi / BLE MCU',
    titleEn: 'ESP32 Wi-Fi / BLE MCU',
    id: 'Mikrokontroler utama pada Mangrovepreneurs dan materi Workshop IoT "Zero to Smart Device" untuk akuisisi sensor ke cloud.',
    en: 'Primary MCU in Mangrovepreneurs and the "Zero to Smart Device" IoT Workshop for cloud sensor telemetry.'
  },
  sensor: {
    titleId: 'Integrasi Sensor Fisik',
    titleEn: 'Hardware Sensor Integration',
    id: 'Kalibrasi IMU BNO055 9-DOF, sensor warna RGB, load cell, BME280, DHT22, kelembapan tanah, dan array sensor Line Follower.',
    en: 'Calibrating BNO055 9-DOF IMU, RGB color sensors, load cells, BME280, DHT22, soil moisture, and Line Follower sensor arrays.'
  },
  iotsys: {
    titleId: 'Arsitektur Sistem IoT',
    titleEn: 'IoT System Architecture',
    id: 'Merancang alur pengiriman data dari node sensor lapangan yang hemat daya menuju gateway lokal atau cloud database.',
    en: 'Designing end-to-end data pipelines from low-power field sensor nodes to local gateways or cloud databases.'
  },
  bme_hx711: {
    titleId: 'BME280 & Load Cell + HX711',
    titleEn: 'BME280 & Load Cell + HX711',
    id: 'Kombinasi sensor pada Mangrovepreneurs untuk memantau suhu/kelembapan sarang kelulut sekaligus menimbang bobot madu.',
    en: 'Sensor pair in Mangrovepreneurs for monitoring stingless bee hive microclimate while weighing honey accumulation.'
  },
  print3d: {
    titleId: 'FDM 3D Printing (PLA+ / PETG)',
    titleEn: 'FDM 3D Printing (PLA+ / PETG)',
    id: 'Produksi enclosure kustom untuk alat asistif AAC Bicara Warna, TekSif Chromoney, sarang IoT Mangrovepreneurs, dan lini produk CetakIn.',
    en: 'Manufacturing custom enclosures for AAC Bicara Warna, TekSif Chromoney, Mangrovepreneurs IoT, and CetakIn products.'
  },
  firebase: {
    titleId: 'Firebase Realtime Database',
    titleEn: 'Firebase Realtime Database',
    id: 'Sinkronisasi data real-time berlatensi rendah pada aplikasi Mangrovepreneurs dan marketplace sewa kostum MyAnimeRent.',
    en: 'Low-latency real-time data synchronization in Mangrovepreneurs and the MyAnimeRent cosplay rental marketplace.'
  },
  firestore: {
    titleId: 'Cloud Firestore & Firebase Auth',
    titleEn: 'Cloud Firestore & Firebase Auth',
    id: 'Arsitektur autentikasi dan dokumen multi-role (Farmer, Logistics, Courier, Admin, Superadmin) pada aplikasi hidroponik E-Ponic.',
    en: 'Multi-role authentication and document database architecture (Farmer, Logistics, Courier, Admin, Superadmin) in E-Ponic.'
  },
  flutter: {
    titleId: 'Flutter / Dart',
    titleEn: 'Flutter / Dart',
    id: 'Pengembangan 3 aplikasi mobile lintas platform: MyAnimeRent (Cosplay Marketplace), Mangrovepreneurs (IoT Kelulut), dan E-Ponic (Hidroponik).',
    en: 'Developing 3 cross-platform mobile apps: MyAnimeRent (Cosplay Marketplace), Mangrovepreneurs (Kelulut IoT), and E-Ponic (Hydroponics).'
  },
  notif: {
    titleId: 'Notifikasi & Background Service',
    titleEn: 'Notifications & Background Services',
    id: 'Layanan latar belakang (flutter_background_service & alarm) untuk peringatan mikroklimat sarang kelulut dan jadwal nutrisi tanaman E-Ponic.',
    en: 'Always-on background services (flutter_background_service & alarm) for hive microclimate alerts and E-Ponic plant maintenance.'
  },
  flchart: {
    titleId: 'fl_chart & GoRouter',
    titleEn: 'fl_chart & GoRouter',
    id: 'Visualisasi grafik tren suhu/berat madu pada Mangrovepreneurs serta navigasi deklaratif berpelindung autentikasi pada MyAnimeRent.',
    en: 'Interactive time-series charts in Mangrovepreneurs and auth-guarded declarative routing in MyAnimeRent.'
  },
  cad: {
    titleId: '3D CAD & Slicing (Cura / PrusaSlicer)',
    titleEn: '3D CAD & Slicing (Cura / PrusaSlicer)',
    id: 'Perancangan mekanik dudukan servo, casing perangkat elektronik, dan optimasi parameter cetak 3D di workshop CetakIn.',
    en: 'Mechanical design of servo brackets, electronics enclosures, and 3D print slicing optimization at CetakIn workshop.'
  },
  git: {
    titleId: 'Git, GitHub & Manajemen Proyek',
    titleEn: 'Git, GitHub & Project Management',
    id: 'Kolaborasi kode lintas tim (Wasaka, E-Ponic, Cloud Computing) dengan dasar manajemen proyek tersertifikasi Dicoding.',
    en: 'Cross-team version control (Wasaka, E-Ponic, Cloud Computing) backed by Dicoding Project Management certification.'
  },
  creative: {
    titleId: 'Canva, CapCut & Dokumentasi Teknis',
    titleEn: 'Canva, CapCut & Technical Documentation',
    id: 'Penyusunan materi ajar robotika, dek presentasi kompetisi nasional, dokumentasi 21 panduan komponen CetakIn, dan penyuntingan video.',
    en: 'Creating robotics teaching slides, national competition pitch decks, 21 interactive CetakIn guides, and video editing.'
  }
};

function renderSkillSpotlight() {
  if (!skillSpotlightTitle || !skillSpotlightDesc) return;
  const note = skillNotes[activeSkillKey] || skillNotes.arduino;
  skillSpotlightTitle.textContent = isEn() ? note.titleEn : note.titleId;
  skillSpotlightDesc.textContent = isEn() ? note.en : note.id;
}

function selectSkillItem(item) {
  activeSkillKey = item.dataset.skillKey;
  skillItems.forEach(el => {
    const active = el === item;
    el.classList.toggle('is-active', active);
    el.setAttribute('aria-pressed', String(active));
  });
  renderSkillSpotlight();
}

skillItems.forEach(item => {
  item.addEventListener('click', () => selectSkillItem(item));
  item.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectSkillItem(item);
    }
  });
});

const copyEmailBtn = document.getElementById('copyEmailBtn');
const copyFeedback = document.getElementById('copyFeedback');
if (copyEmailBtn && copyFeedback) {
  const email = copyEmailBtn.dataset.email || 'nelyzar8@gmail.com';
  let copyState = 'idle';
  let feedbackTimer = null;
  copyFeedback.setAttribute('role', 'status');
  copyFeedback.setAttribute('aria-live', 'polite');
  copyFeedback.setAttribute('aria-atomic', 'true');

  function renderCopyFeedback() {
    copyFeedback.dataset.state = copyState;
    copyFeedback.hidden = copyState === 'idle';
    if (copyState === 'pending') copyFeedback.textContent = isEn() ? 'Copying email…' : 'Menyalin email…';
    else if (copyState === 'copied') copyFeedback.textContent = isEn() ? 'Email copied.' : 'Email tersalin.';
    else if (copyState === 'failed') copyFeedback.textContent = isEn()
      ? `Automatic copying is unavailable. Copy this address manually: ${email}`
      : `Penyalinan otomatis tidak tersedia. Salin alamat ini secara manual: ${email}`;
  }

  copyEmailBtn.addEventListener('click', async () => {
    if (copyState === 'pending') return;
    if (feedbackTimer !== null) window.clearTimeout(feedbackTimer);
    copyState = 'pending';
    copyEmailBtn.disabled = true;
    renderCopyFeedback();
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(email);
      copyState = 'copied';
      feedbackTimer = window.setTimeout(() => {
        feedbackTimer = null;
        copyState = 'idle';
        renderCopyFeedback();
      }, 2500);
    } catch {
      copyState = 'failed';
    } finally {
      copyEmailBtn.disabled = false;
      renderCopyFeedback();
    }
  });
  document.addEventListener('languagechange', renderCopyFeedback);
}

document.addEventListener('languagechange', () => {
  renderSkillSpotlight();
});
renderSkillSpotlight();
