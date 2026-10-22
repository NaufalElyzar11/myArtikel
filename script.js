const navMenu = document.getElementById('navMenu');
const navToggle = document.getElementById('navToggle');
const menuIsMobile = window.matchMedia('(max-width: 1080px)');

function setMenu(open) {
  navMenu.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', window.siteI18n.t(open ? 'ui.closeMenu' : 'ui.openMenu'));
}
navToggle.addEventListener('click', () => setMenu(!navMenu.classList.contains('open')));
navMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('click', event => {
  if (!navMenu.contains(event.target) && !navToggle.contains(event.target)) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navMenu.classList.contains('open')) {
    setMenu(false);
    navToggle.focus();
  }
});
menuIsMobile.addEventListener('change', () => setMenu(false));
document.addEventListener('languagechange', () => setMenu(navMenu.classList.contains('open')));
document.getElementById('year').textContent = new Date().getFullYear();

const sectionLinks = [...navMenu.querySelectorAll('a[href^="#"]')];
let pending = false;
function updateSection() {
  pending = false;
  const candidates = sectionLinks.filter(link => {
    const section = document.querySelector(link.getAttribute('href'));
    return section && section.getBoundingClientRect().top <= 150;
  });
  const active = candidates.sort((a, b) =>
    document.querySelector(b.getAttribute('href')).getBoundingClientRect().top -
    document.querySelector(a.getAttribute('href')).getBoundingClientRect().top)[0];
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

// Project Filters & View Mode Switcher
const projectBrowser = document.querySelector('.project-browser');
const projectFilters = [...document.querySelectorAll('[data-project-filter]')];
const projectCards = [...document.querySelectorAll('[data-project-category]')];
const projectsList = document.getElementById('projectsList');
const viewButtons = [...document.querySelectorAll('[data-view-mode]')];

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

if (projectsList && viewButtons.length) {
  viewButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.viewMode;
      projectsList.classList.toggle('is-compact', mode === 'compact');
      viewButtons.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    });
  });
}

// Interactive Inspector Tabs inside Project Cards
projectCards.forEach(card => {
  const tabs = [...card.querySelectorAll('[data-card-tab]')];
  const panels = [...card.querySelectorAll('[data-card-panel]')];
  if (!tabs.length) return;
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.cardTab;
      tabs.forEach(t => t.setAttribute('aria-selected', String(t === tab)));
      panels.forEach(p => { p.hidden = p.dataset.cardPanel !== target; });
    });
  });
});

// Interactive Engineering Sandbox (Lab)
const labTabs = [...document.querySelectorAll('[data-lab-target]')];
const labPanels = [...document.querySelectorAll('[data-lab-panel]')];
labTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.labTarget;
    labTabs.forEach(t => t.setAttribute('aria-selected', String(t === tab)));
    labPanels.forEach(p => { p.hidden = p.dataset.labPanel !== target; });
  });
});

const isEn = () => window.siteI18n?.language === 'en';

// Lab 1: Hexaka V3 Simulator
const hexRollInput = document.getElementById('hexRollInput');
const hexPitchInput = document.getElementById('hexPitchInput');
const hexRollVal = document.getElementById('hexRollVal');
const hexPitchVal = document.getElementById('hexPitchVal');
const hexPidOut = document.getElementById('hexPidOut');
const hexLegZ = document.getElementById('hexLegZ');
const hexFsmOut = document.getElementById('hexFsmOut');
const hexStatusBadge = document.getElementById('hexStatusBadge');
const hexLogMsg = document.getElementById('hexLogMsg');
const hexFsmBtns = [...document.querySelectorAll('#hexFsmBtns [data-fsm]')];
let currentFsm = 'CRUISE';

function updateHexakaSim() {
  if (!hexRollInput || !hexPitchInput) return;
  const roll = Number(hexRollInput.value);
  const pitch = Number(hexPitchInput.value);
  hexRollVal.textContent = `${roll > 0 ? '+' : ''}${roll}°`;
  hexPitchVal.textContent = `${pitch > 0 ? '+' : ''}${pitch}°`;

  const compR = (-roll * 0.92).toFixed(1);
  const compP = (-pitch * 0.92).toFixed(1);
  hexPidOut.textContent = `${compR}° / ${compP}°`;

  const leftZ = (roll * 1.45).toFixed(1);
  const rightZ = (-roll * 1.45).toFixed(1);
  hexLegZ.textContent = `${leftZ} / ${rightZ} mm`;
  hexFsmOut.textContent = `${currentFsm} @ 50Hz`;

  const steep = Math.abs(roll) >= 18 || Math.abs(pitch) >= 18;
  hexStatusBadge.classList.toggle('is-warn', steep);
  if (steep) {
    hexStatusBadge.textContent = isEn() ? '▲ TILT SAFETY INTERLOCK (>18°)' : '▲ INTERLOCK KEMIRINGAN (>18°)';
    hexLogMsg.textContent = isEn()
      ? `[WARN] Slope (${roll}°, ${pitch}°) approaches 20° limit. Stride height lowered & PID gain boosted to prevent tipping.`
      : `[PERINGATAN] Kemiringan (${roll}°, ${pitch}°) mendekati batas 20°. Tinggi angkatan kaki diturunkan & penguatan PID ditingkatkan agar tidak terbalik.`;
  } else {
    hexStatusBadge.textContent = isEn() ? '● PID LEVELING ACTIVE' : '● PID LEVELING AKTIF';
    const fsmDescId = {
      CRUISE: 'Tripod Gait aktif melangkah maju; kamera memantau batas lintasan.',
      AVOID: 'YOLO11 ONNX mendeteksi rintangan di depan; lintasan kaki berbelok menghindari objek.',
      SCAN: 'Robot berputar di tempat memindai celah lintasan bebas rintangan.',
      TRACK: 'YOLOv8 melacak subjek manusia dengan kontrol jarak & arah PID ganda.'
    };
    const fsmDescEn = {
      CRUISE: 'Tripod gait moving forward; single camera tracking course boundaries.',
      AVOID: 'YOLO11 ONNX detected an obstacle ahead; gait vector sidestepping.',
      SCAN: 'Rotating in place to scan for obstacle-free corridor.',
      TRACK: 'YOLOv8 human tracking locked with dual distance/heading PID.'
    };
    hexLogMsg.textContent = isEn()
      ? `[OK] Body stabilized (${compR}°, ${compP}°). ${fsmDescEn[currentFsm]}`
      : `[OK] Bodi distabilkan (${compR}°, ${compP}°). ${fsmDescId[currentFsm]}`;
  }
}

if (hexRollInput && hexPitchInput) {
  hexRollInput.addEventListener('input', updateHexakaSim);
  hexPitchInput.addEventListener('input', updateHexakaSim);
  hexFsmBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentFsm = btn.dataset.fsm;
      hexFsmBtns.forEach(b => b.classList.toggle('active', b === btn));
      updateHexakaSim();
    });
  });
}

// Lab 2: Mangrovepreneurs Simulator
const mgWeightInput = document.getElementById('mgWeightInput');
const mgTempInput = document.getElementById('mgTempInput');
const mgHumInput = document.getElementById('mgHumInput');
const mgWeightVal = document.getElementById('mgWeightVal');
const mgTempVal = document.getElementById('mgTempVal');
const mgHumVal = document.getElementById('mgHumVal');
const mgHarvestOut = document.getElementById('mgHarvestOut');
const mgClimateOut = document.getElementById('mgClimateOut');
const mgStatusBadge = document.getElementById('mgStatusBadge');
const mgLogMsg = document.getElementById('mgLogMsg');

function updateMangroveSim() {
  if (!mgWeightInput) return;
  const w = Number(mgWeightInput.value);
  const t = Number(mgTempInput.value);
  const h = Number(mgHumInput.value);
  const target = 35.0;
  const pct = Math.min(100, Math.round((w / target) * 100));

  mgWeightVal.textContent = `${w.toFixed(1)} kg`;
  mgTempVal.textContent = `${t.toFixed(1)} °C`;
  mgHumVal.textContent = `${h.toFixed(1)} %`;
  mgHarvestOut.textContent = `35.0 kg (${pct}%)`;
  mgClimateOut.textContent = `${t.toFixed(1)}°C · ${h.toFixed(1)}%`;

  const tempBad = t < 26 || t > 34.5;
  const humBad = h < 60;
  const ready = w >= target;

  mgStatusBadge.classList.remove('is-warn', 'is-alert');
  if (tempBad || humBad) {
    mgStatusBadge.classList.add('is-alert');
    mgStatusBadge.textContent = isEn() ? '▲ MICROCLIMATE ALERT' : '▲ PERINGATAN MIKROKLIMAT';
    mgLogMsg.textContent = isEn()
      ? `[NOTIF FLUTTER] Hive temperature (${t.toFixed(1)}°C) or humidity (${h.toFixed(1)}%) is outside safe threshold! Check shade & ventilation.`
      : `[NOTIFIKASI FLUTTER] Suhu (${t.toFixed(1)}°C) atau kelembapan (${h.toFixed(1)}%) keluar dari ambang aman sarang! Periksa naungan kotak.`;
  } else if (ready) {
    mgStatusBadge.classList.add('is-warn');
    mgStatusBadge.textContent = isEn() ? '★ HARVEST READY!' : '★ SIAP PANEN!';
    mgLogMsg.textContent = isEn()
      ? `[NOTIF FLUTTER] Weight reached ${w.toFixed(1)} kg (>= 35.0 kg target). Honey pots are full and ready for harvest.`
      : `[NOTIFIKASI FLUTTER] Berat sarang mencapai ${w.toFixed(1)} kg (melampaui target 35,0 kg). Kantong madu kelulut siap dipanen!`;
  } else {
    mgStatusBadge.textContent = isEn() ? '● HIVE NORMAL' : '● SARANG NORMAL';
    mgLogMsg.textContent = isEn()
      ? `[FIREBASE] Microclimate optimal. Hive weight at ${pct}% of harvest threshold (35.0 kg).`
      : `[FIREBASE] Suhu & kelembapan ideal untuk koloni kelulut. Bobot sarang mencapai ${pct}% dari target panen (35,0 kg).`;
  }
}

if (mgWeightInput) {
  [mgWeightInput, mgTempInput, mgHumInput].forEach(el => el.addEventListener('input', updateMangroveSim));
}

// Lab 3: Assistive Tech (AAC & Chromoney)
const aacBtns = [...document.querySelectorAll('#aacSimBtns [data-aac]')];
const moneyBtns = [...document.querySelectorAll('#moneySimBtns [data-money]')];
const astModeOut = document.getElementById('astModeOut');
const astInputOut = document.getElementById('astInputOut');
const astTrackOut = document.getElementById('astTrackOut');
const astLogMsg = document.getElementById('astLogMsg');
let astState = { type: 'aac', val: 'mau' };

function updateAssistiveSim() {
  if (!astModeOut) return;
  if (astState.type === 'aac') {
    const map = {
      mau: {
        pin: 'PIN D2 (LOW)',
        track: '001_mau.mp3',
        id: '🔊 [SPEAKER 4CM]: "Saya MAU ini." — Dipicu oleh tombol merah (Pin D2 → DFPlayer Mini).',
        en: '🔊 [4CM SPEAKER]: "I WANT this." — Triggered by red button (Pin D2 → DFPlayer Mini).'
      },
      iya: {
        pin: 'PIN D3 (LOW)',
        track: '002_iya.mp3',
        id: '🔊 [SPEAKER 4CM]: "IYA, benar." — Dipicu oleh tombol biru (Pin D3 → DFPlayer Mini).',
        en: '🔊 [4CM SPEAKER]: "YES, that is right." — Triggered by blue button (Pin D3 → DFPlayer Mini).'
      },
      tidak: {
        pin: 'PIN D4 (LOW)',
        track: '003_tidak.mp3',
        id: '🔊 [SPEAKER 4CM]: "TIDAK mau." — Dipicu oleh tombol hijau (Pin D4 → DFPlayer Mini).',
        en: '🔊 [4CM SPEAKER]: "NO, thank you." — Triggered by green button (Pin D4 → DFPlayer Mini).'
      }
    };
    const item = map[astState.val];
    astModeOut.textContent = 'AAC Bicara Warna';
    astInputOut.textContent = item.pin;
    astTrackOut.textContent = item.track;
    astLogMsg.textContent = isEn() ? item.en : item.id;
  } else {
    const moneyMap = {
      '5000': {
        rgb: 'R:198 G:152 B:94',
        track: 'rp_5000.mp3',
        id: '🔊 [SPEAKER 3W]: "Lima Ribu Rupiah." — Sensor warna mengenali profil cokelat kekuningan.',
        en: '🔊 [3W SPEAKER]: "Five Thousand Rupiah." — Color sensor matched ochre-brown profile.'
      },
      '10000': {
        rgb: 'R:146 G:102 B:168',
        track: 'rp_10000.mp3',
        id: '🔊 [SPEAKER 3W]: "Sepuluh Ribu Rupiah." — Sensor warna mengenali profil ungu.',
        en: '🔊 [3W SPEAKER]: "Ten Thousand Rupiah." — Color sensor matched purple profile.'
      },
      '20000': {
        rgb: 'R:92 G:174 B:132',
        track: 'rp_20000.mp3',
        id: '🔊 [SPEAKER 3W]: "Dua Puluh Ribu Rupiah." — Sensor warna mengenali profil hijau.',
        en: '🔊 [3W SPEAKER]: "Twenty Thousand Rupiah." — Color sensor matched green profile.'
      },
      '50000': {
        rgb: 'R:78 G:142 B:196',
        track: 'rp_50000.mp3',
        id: '🔊 [SPEAKER 3W]: "Lima Puluh Ribu Rupiah." — Sensor warna mengenali profil biru.',
        en: '🔊 [3W SPEAKER]: "Fifty Thousand Rupiah." — Color sensor matched blue profile.'
      },
      '100000': {
        rgb: 'R:212 G:96 B:108',
        track: 'rp_100000.mp3',
        id: '🔊 [SPEAKER 3W]: "Seratus Ribu Rupiah." — Sensor warna mengenali profil merah muda/merah.',
        en: '🔊 [3W SPEAKER]: "One Hundred Thousand Rupiah." — Color sensor matched red/pink profile.'
      }
    };
    const item = moneyMap[astState.val];
    astModeOut.textContent = 'TekSif Chromoney';
    astInputOut.textContent = item.rgb;
    astTrackOut.textContent = item.track;
    astLogMsg.textContent = isEn() ? item.en : item.id;
  }
}

aacBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    astState = { type: 'aac', val: btn.dataset.aac };
    aacBtns.forEach(b => b.classList.toggle('active', b === btn));
    moneyBtns.forEach(b => b.classList.remove('active'));
    updateAssistiveSim();
  });
});

moneyBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    astState = { type: 'money', val: btn.dataset.money };
    moneyBtns.forEach(b => b.classList.toggle('active', b === btn));
    aacBtns.forEach(b => b.classList.remove('active'));
    updateAssistiveSim();
  });
});

// Interactive Skills Spotlight
const skillItems = [...document.querySelectorAll('#skillsGrid [data-skill-key]')];
const skillSpotlightTitle = document.getElementById('skillSpotlightTitle');
const skillSpotlightDesc = document.getElementById('skillSpotlightDesc');
let activeSkillKey = 'arduino';

const skillNotes = {
  arduino: {
    titleId: 'Arduino & Mikrokontroler',
    titleEn: 'Arduino & Microcontrollers',
    id: 'Digunakan pada AAC Bicara Warna (Arduino Nano V3), TekSif Chromoney, TRACO-BOT, dan PRONE.ID untuk pembacaan sensor dan aktuasi real-time.',
    en: 'Used in AAC Bicara Warna (Arduino Nano V3), TekSif Chromoney, TRACO-BOT, and PRONE.ID for real-time sensor reading and actuation.'
  },
  raspi: {
    titleId: 'Raspberry Pi (SBC)',
    titleEn: 'Raspberry Pi (SBC)',
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
    id: 'Lingkungan pengembangan firmware utama untuk merakit logika tombol suara AAC Bicara Warna dan sensor warna uang Chromoney.',
    en: 'Primary firmware environment for building the voice-button logic in AAC Bicara Warna and color classification in Chromoney.'
  },
  wiring: {
    titleId: 'Wiring PCB & Penyolderan',
    titleEn: 'PCB Wiring & Soldering',
    id: 'Penataan jalur kabel presisi di atas PCB dot-matrix 10,5×7 cm agar 21 komponen muat rapi ke dalam casing cetak 3D.',
    en: 'Precision cable routing and soldering on 10.5×7 cm dot-matrix PCBs to fit 21 components cleanly inside 3D-printed enclosures.'
  },
  python: {
    titleId: 'Python 3',
    titleEn: 'Python 3',
    id: 'Bahasa utama untuk perhitungan matriks Inverse Kinematics, pipeline visi OpenCV/ONNX, dan streaming telemetri UDP 50 Hz.',
    en: 'Core language for Inverse Kinematics matrix math, OpenCV/ONNX vision pipelines, and 50 Hz UDP telemetry streaming.'
  },
  ml: {
    titleId: 'Machine Learning',
    titleEn: 'Machine Learning',
    id: 'Klasifikasi citra 6 kategori sampah pada konveyor TRACO-BOT (<1,2 detik/objek) dan deteksi korban pada misi robot SAR.',
    en: 'Six-class waste classification on the TRACO-BOT conveyor (<1.2s/item) and victim detection in SAR robotics.'
  },
  yolo: {
    titleId: 'YOLOv8 & YOLO11 (ONNX)',
    titleEn: 'YOLOv8 & YOLO11 (ONNX)',
    id: 'Deteksi rintangan lintasan otonom (BEST 2026) dan pelacakan manusia real-time (human tracking) pada Hexaka V3.',
    en: 'Autonomous course obstacle detection (BEST 2026) and real-time human tracking on Hexaka V3.'
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
  html: {
    titleId: 'HTML5 Semantik',
    titleEn: 'Semantic HTML5',
    id: 'Membangun struktur antarmuka web portofolio, dashboard monitoring PRONE.ID, dan platform BanuaTour yang aksesibel.',
    en: 'Building accessible semantic markup for this portfolio, the PRONE.ID monitoring dashboard, and BanuaTour.'
  },
  css: {
    titleId: 'CSS3 Modern & Responsif',
    titleEn: 'Modern & Responsive CSS3',
    id: 'Perancangan tata letak responsif lintas perangkat tanpa ketergantungan framework berat.',
    en: 'Crafting responsive layouts across mobile and desktop viewports without heavy framework bloat.'
  },
  js: {
    titleId: 'JavaScript (ES6+)',
    titleEn: 'JavaScript (ES6+)',
    id: 'Simulasi interaktif di browser, lokalisasi dwibahasa (ID/EN), serta visualisasi Digital Twin 3D via WebSockets.',
    en: 'Interactive browser simulations, bilingual i18n, and 3D Digital Twin visualization over WebSockets.'
  },
  php: {
    titleId: 'PHP & Laravel',
    titleEn: 'PHP & Laravel',
    id: 'Pengembangan backend web informasi dan pemesanan tiket wisata lokal Kalimantan Selatan (BanuaTour).',
    en: 'Backend web development for South Kalimantan local tourism information and ticket booking (BanuaTour).'
  },
  mysql: {
    titleId: 'MySQL & SQLite',
    titleEn: 'MySQL & SQLite',
    id: 'Penyimpanan relasional untuk aplikasi web serta pencatatan histori telemetri lokal di stasiun gateway.',
    en: 'Relational storage for web applications and local telemetry history logging on gateway stations.'
  },
  esp32: {
    titleId: 'ESP32 Wi-Fi / BLE MCU',
    titleEn: 'ESP32 Wi-Fi / BLE MCU',
    id: 'Mikrokontroler utama pada Mangrovepreneurs untuk membaca sensor BME280 + HX711 dan menyinkronkan data ke Firebase.',
    en: 'Primary MCU in Mangrovepreneurs for reading BME280 + HX711 sensors and syncing data over Wi-Fi to Firebase.'
  },
  sensor: {
    titleId: 'Integrasi Sensor Fisik',
    titleEn: 'Hardware Sensor Integration',
    id: 'Kalibrasi IMU BNO055 9-DOF, sensor warna RGB, load cell, BME280, DHT22, kelembapan tanah, dan proximity IR.',
    en: 'Calibrating BNO055 9-DOF IMU, RGB color sensors, load cells, BME280, DHT22, soil moisture, and IR proximity sensors.'
  },
  iotsys: {
    titleId: 'Arsitektur Sistem IoT',
    titleEn: 'IoT System Architecture',
    id: 'Merancang alur pengiriman data dari node sensor lapangan yang hemat daya menuju gateway atau cloud database.',
    en: 'Designing end-to-end data pipelines from low-power field sensor nodes to local gateways or cloud databases.'
  },
  bme_hx711: {
    titleId: 'BME280 & Load Cell + HX711',
    titleEn: 'BME280 & Load Cell + HX711',
    id: 'Kombinasi sensor pada Mangrovepreneurs untuk memantau suhu/kelembapan sarang kelulut sekaligus menimbang bobot madu.',
    en: 'Sensor pair in Mangrovepreneurs for monitoring stingless bee hive microclimate while weighing honey accumulation.'
  },
  firebase: {
    titleId: 'Firebase Realtime Database',
    titleEn: 'Firebase Realtime Database',
    id: 'Jembatan sinkronisasi data real-time berlatensi rendah antara perangkat ESP32 di sarang kelulut dan aplikasi Flutter.',
    en: 'Low-latency real-time data synchronization bridge between field ESP32 units and the Flutter mobile app.'
  },
  flutter: {
    titleId: 'Flutter / Dart',
    titleEn: 'Flutter / Dart',
    id: 'Membangun aplikasi mobile Mangrovepreneurs untuk memantau daftar sarang aktif, baterai, suhu, kelembapan, dan berat.',
    en: 'Building the Mangrovepreneurs mobile app to monitor active hives, battery voltage, temperature, humidity, and weight.'
  },
  notif: {
    titleId: 'Notifikasi & Ambang Dinamis',
    titleEn: 'Notifications & Dynamic Thresholds',
    id: 'Pengaturan batas suhu, kelembapan, dan target kilogram panen yang dapat disesuaikan peternak langsung dari aplikasi.',
    en: 'User-configurable temperature, humidity, and harvest weight thresholds with automated mobile alerts.'
  }
};

function renderSkillSpotlight() {
  if (!skillSpotlightTitle || !skillSpotlightDesc) return;
  const note = skillNotes[activeSkillKey] || skillNotes.arduino;
  skillSpotlightTitle.textContent = isEn() ? note.titleEn : note.titleId;
  skillSpotlightDesc.textContent = isEn() ? note.en : note.id;
}

skillItems.forEach(item => {
  item.addEventListener('click', () => {
    activeSkillKey = item.dataset.skillKey;
    skillItems.forEach(el => el.classList.toggle('is-active', el.dataset.skillKey === activeSkillKey));
    renderSkillSpotlight();
  });
});

// Copy Email Action
const copyEmailBtn = document.getElementById('copyEmailBtn');
const copyFeedback = document.getElementById('copyFeedback');
if (copyEmailBtn && copyFeedback) {
  copyEmailBtn.addEventListener('click', () => {
    const email = copyEmailBtn.dataset.email || 'nelyzar8@gmail.com';
    try {
      navigator.clipboard?.writeText(email);
    } catch { /* fallback */ }
    copyFeedback.hidden = false;
    copyFeedback.textContent = isEn() ? '✓ Email copied!' : '✓ Email tersalin!';
    setTimeout(() => { copyFeedback.hidden = true; }, 2500);
  });
}

document.addEventListener('languagechange', () => {
  updateHexakaSim();
  updateMangroveSim();
  updateAssistiveSim();
  renderSkillSpotlight();
});

updateHexakaSim();
updateMangroveSim();
updateAssistiveSim();
renderSkillSpotlight();
