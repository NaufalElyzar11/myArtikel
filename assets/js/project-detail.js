const year = document.getElementById('yr');
if (year) year.textContent = new Date().getFullYear();

const toc = document.querySelector('.toc');
const tocToggle = document.querySelector('.toc-toggle');
const tocLinks = [...document.querySelectorAll('.toc__link')];
const mobileToc = window.matchMedia('(max-width: 960px)');

function collapseToc(collapsed) {
  toc.classList.toggle('collapsed', collapsed);
  tocToggle.setAttribute('aria-expanded', String(!collapsed));
}
tocToggle.addEventListener('click', () => {
  if (mobileToc.matches) collapseToc(!toc.classList.contains('collapsed'));
});
tocLinks.forEach(link => link.addEventListener('click', () => {
  if (mobileToc.matches) {
    collapseToc(true);
    tocToggle.focus({ preventScroll: true });
  }
}));
mobileToc.addEventListener('change', () => collapseToc(mobileToc.matches));
collapseToc(mobileToc.matches);

let scheduled = false;
function updateContents() {
  scheduled = false;
  let active = tocLinks[0];
  tocLinks.forEach(link => {
    const section = document.querySelector(link.getAttribute('href'));
    if (section && section.getBoundingClientRect().top <= 165) active = link;
  });
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 40) {
    active = tocLinks[tocLinks.length - 1];
  }
  tocLinks.forEach(link => {
    link.classList.toggle('active', link === active);
    if (link === active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
window.addEventListener('scroll', () => {
  if (!scheduled) { scheduled = true; requestAnimationFrame(updateContents); }
}, { passive: true });
window.addEventListener('resize', updateContents);
document.addEventListener('languagechange', updateContents);
updateContents();

// Interactive Case-Study Simulators
const isEn = () => window.siteI18n?.language === 'en';
const simRoot = document.querySelector('[data-project-sim]');

if (simRoot) {
  const simType = simRoot.dataset.projectSim;

  // 1. Mangrovepreneurs Hive Simulator (Sarang Kelulut 1, 2, 3)
  if (simType === 'mangrove') {
    const hiveBtns = [...simRoot.querySelectorAll('[data-hive-preset]')];
    const wInput = simRoot.querySelector('#simMgWeight');
    const tInput = simRoot.querySelector('#simMgTemp');
    const wVal = simRoot.querySelector('#simMgWeightVal');
    const tVal = simRoot.querySelector('#simMgTempVal');
    const m1 = simRoot.querySelector('#simMgM1');
    const m2 = simRoot.querySelector('#simMgM2');
    const m3 = simRoot.querySelector('#simMgM3');
    const out = simRoot.querySelector('#simMgOut');

    const presets = {
      '1': { w: 29.1, t: 26.8, h: 100.0, bat: '100% (5.90V)' },
      '2': { w: 46.6, t: 30.1, h: 60.8, bat: '45% (3.54V)' },
      '3': { w: 9.3, t: 33.0, h: 79.9, bat: '64% (3.77V)' }
    };
    let activeHive = '1';

    function renderMg() {
      const w = Number(wInput.value);
      const t = Number(tInput.value);
      const p = presets[activeHive];
      wVal.textContent = `${w.toFixed(1)} kg`;
      tVal.textContent = `${t.toFixed(1)} °C`;
      m1.textContent = `${w.toFixed(1)} kg`;
      m2.textContent = `${t.toFixed(1)}°C / ${p.h}%`;
      m3.textContent = p.bat;

      if (w >= 35.0) {
        out.textContent = isEn()
          ? `[FLUTTER ALERT] Hive #${activeHive} weight (${w.toFixed(1)} kg) exceeds 35.0 kg harvest threshold! Ready to harvest honey.`
          : `[NOTIFIKASI FLUTTER] Bobot Sarang Kelulut ${activeHive} (${w.toFixed(1)} kg) telah melewati ambang panen 35,0 kg! Siap panen madu.`;
      } else if (t > 34.0 || t < 25.5) {
        out.textContent = isEn()
          ? `[FLUTTER ALERT] Hive #${activeHive} temperature (${t.toFixed(1)}°C) outside optimal range (26–34°C). Check hive shade!`
          : `[NOTIFIKASI FLUTTER] Suhu Sarang Kelulut ${activeHive} (${t.toFixed(1)}°C) di luar rentang ideal (26–34°C). Periksa peneduh kotak!`;
      } else {
        out.textContent = isEn()
          ? `[FIREBASE SYNC] Hive #${activeHive} normal. Weight at ${Math.round((w / 35) * 100)}% of harvest target.`
          : `[FIREBASE SYNC] Kondisi Sarang Kelulut ${activeHive} stabil. Bobot mencapai ${Math.round((w / 35) * 100)}% dari target panen.`;
      }
    }

    hiveBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        activeHive = btn.dataset.hivePreset;
        const p = presets[activeHive];
        wInput.value = String(p.w);
        tInput.value = String(p.t);
        hiveBtns.forEach(b => b.classList.toggle('active', b === btn));
        renderMg();
      });
    });
    wInput?.addEventListener('input', renderMg);
    tInput?.addEventListener('input', renderMg);
    document.addEventListener('languagechange', renderMg);
    renderMg();
  }

  // 2. AAC Bicara Warna Simulator
  if (simType === 'aac') {
    const btns = [...simRoot.querySelectorAll('[data-aac-btn]')];
    const m1 = simRoot.querySelector('#simAacM1');
    const m2 = simRoot.querySelector('#simAacM2');
    const m3 = simRoot.querySelector('#simAacM3');
    const out = simRoot.querySelector('#simAacOut');
    let currentKey = 'mau';

    const data = {
      mau: {
        colorId: 'Merah ("MAU")',
        colorEn: 'Red ("WANT")',
        pin: 'Nano D2 → LOW',
        track: '001_mau.mp3',
        id: '🔊 Speaker 4cm berbunyi: "Saya MAU." — Membantu anak N.M. menyatakan keinginan tanpa harus menangis karena salah paham.',
        en: '🔊 4cm Speaker plays: "I WANT this." — Helps child N.M. express desires clearly without frustration.'
      },
      iya: {
        colorId: 'Biru ("IYA")',
        colorEn: 'Blue ("YES")',
        pin: 'Nano D3 → LOW',
        track: '002_iya.mp3',
        id: '🔊 Speaker 4cm berbunyi: "IYA." — Merespons pertanyaan guru atau orang tua secara mandiri.',
        en: '🔊 4cm Speaker plays: "YES." — Allows independent affirmative response to teachers or parents.'
      },
      tidak: {
        colorId: 'Hijau ("TIDAK")',
        colorEn: 'Green ("NO")',
        pin: 'Nano D4 → LOW',
        track: '003_tidak.mp3',
        id: '🔊 Speaker 4cm berbunyi: "TIDAK." — Memberi tahu penolakan atau ketidaknyamanan secara jelas.',
        en: '🔊 4cm Speaker plays: "NO." — Clearly communicates refusal or discomfort.'
      }
    };

    function renderAac() {
      const d = data[currentKey];
      m1.textContent = isEn() ? d.colorEn : d.colorId;
      m2.textContent = d.pin;
      m3.textContent = d.track;
      out.textContent = isEn() ? d.en : d.id;
    }

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        currentKey = btn.dataset.aacBtn;
        btns.forEach(b => b.classList.toggle('active', b === btn));
        renderAac();
      });
    });
    document.addEventListener('languagechange', renderAac);
    renderAac();
  }

  // 3. TekSif Chromoney Banknote Scanner & Canteen Sum Simulator
  if (simType === 'teksif') {
    const noteBtns = [...simRoot.querySelectorAll('[data-note-val]')];
    const addBtn = simRoot.querySelector('#simTeksifAdd');
    const resetBtn = simRoot.querySelector('#simTeksifReset');
    const m1 = simRoot.querySelector('#simTeksifM1');
    const m2 = simRoot.querySelector('#simTeksifM2');
    const m3 = simRoot.querySelector('#simTeksifM3');
    const out = simRoot.querySelector('#simTeksifOut');

    let currentNote = 10000;
    let totalSum = 10000;

    const rgbMap = {
      2000: 'R:148 G:150 B:144',
      5000: 'R:198 G:152 B:94',
      10000: 'R:146 G:102 B:168',
      20000: 'R:92 G:174 B:132',
      50000: 'R:78 G:142 B:196',
      100000: 'R:212 G:96 B:108'
    };

    function fmtRp(n) {
      return 'Rp ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function renderTeksif(action = 'scan') {
      m1.textContent = fmtRp(currentNote);
      m2.textContent = rgbMap[currentNote] || 'R:150 G:150 B:150';
      m3.textContent = fmtRp(totalSum);
      if (action === 'add') {
        out.textContent = isEn()
          ? `🔊 [BUTTON + / =]: Added ${fmtRp(currentNote)}. Total canteen transaction: ${fmtRp(totalSum)}.`
          : `🔊 [TOMBOL + / =]: Menambahkan ${fmtRp(currentNote)}. Total uang di tangan untuk transaksi kantin: ${fmtRp(totalSum)}.`;
      } else {
        out.textContent = isEn()
          ? `🔊 [SPEAKER 3W]: "${fmtRp(currentNote)}." — Color sensor matched RGB reflectance (${rgbMap[currentNote]}).`
          : `🔊 [SPEAKER 3W]: "${fmtRp(currentNote)}." — Sensor warna mengenali pantulan RGB (${rgbMap[currentNote]}).`;
      }
    }

    noteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        currentNote = Number(btn.dataset.noteVal);
        noteBtns.forEach(b => b.classList.toggle('active', b === btn));
        renderTeksif('scan');
      });
    });
    addBtn?.addEventListener('click', () => {
      totalSum += currentNote;
      renderTeksif('add');
    });
    resetBtn?.addEventListener('click', () => {
      totalSum = currentNote;
      renderTeksif('scan');
    });
    document.addEventListener('languagechange', () => renderTeksif('scan'));
    renderTeksif('scan');
  }

  // 4. Hexaka V3 Simulator
  if (simType === 'hexaka') {
    const slopeInput = simRoot.querySelector('#simHexSlope');
    const slopeVal = simRoot.querySelector('#simHexSlopeVal');
    const modeBtns = [...simRoot.querySelectorAll('[data-hex-mode]')];
    const m1 = simRoot.querySelector('#simHexM1');
    const m2 = simRoot.querySelector('#simHexM2');
    const m3 = simRoot.querySelector('#simHexM3');
    const out = simRoot.querySelector('#simHexOut');
    let mode = 'BEST_AUTONOMOUS';

    function renderHex() {
      const s = Number(slopeInput.value);
      slopeVal.textContent = `${s}°`;
      m1.textContent = `${(-s * 0.94).toFixed(1)}° PID`;
      m2.textContent = s >= 18 ? 'INTERLOCK' : 'TRIPOD 3+3';
      m3.textContent = mode === 'TIKTOK_LIVE' ? 'WS + 50Hz UDP' : 'ONNX + 50Hz';

      if (s >= 18) {
        out.textContent = isEn()
          ? `[SAFETY INTERLOCK] Slope ${s}° near 20° threshold! Center of mass lowered by 18mm and stride shortened.`
          : `[SAFETY INTERLOCK] Kemiringan ${s}° mendekati batas 20°! Titik berat bodi diturunkan 18mm dan langkah diperpendek.`;
      } else if (mode === 'BEST_AUTONOMOUS') {
        out.textContent = isEn()
          ? `[BRIN BEST 2026] Single camera floor segmentation + YOLO11 obstacle avoidance active. BNO055 compensates ${s}° tilt.`
          : `[BRIN BEST 2026] Segmentasi lantai kamera tunggal + penghindaran rintangan YOLO11 aktif. IMU BNO055 mengompensasi miring ${s}°.`;
      } else if (mode === 'PKKMB_TRACK') {
        out.textContent = isEn()
          ? `[PKKMB EXHIBITION] YOLOv8 human tracking locked with hysteresis filter & dual distance/heading PID.`
          : `[PAMERAN PKKMB] Pelacakan manusia YOLOv8 terkunci dengan filter histeresis & kontrol PID ganda (jarak & arah).`;
      } else {
        out.textContent = isEn()
          ? `[TIKTOK LIVE] WebSocket event queue active; executing 18-DOF physical choreography while streaming to 3D Digital Twin.`
          : `[TIKTOK LIVE] Antrean event WebSocket aktif; mengeksekusi koreografi fisik 18-DOF sembari mengirim telemetri ke 3D Digital Twin.`;
      }
    }

    slopeInput?.addEventListener('input', renderHex);
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        mode = btn.dataset.hexMode;
        modeBtns.forEach(b => b.classList.toggle('active', b === btn));
        renderHex();
      });
    });
    document.addEventListener('languagechange', renderHex);
    renderHex();
  }

  // 5. PRONE.ID Simulator
  if (simType === 'amd') {
    const zoneBtns = [...simRoot.querySelectorAll('[data-zone-btn]')];
    const m1 = simRoot.querySelector('#simAmdM1');
    const m2 = simRoot.querySelector('#simAmdM2');
    const m3 = simRoot.querySelector('#simAmdM3');
    const out = simRoot.querySelector('#simAmdOut');
    let zone = 'A';

    const zones = {
      A: { moist: '64%', temp: '29.2°C', actionId: 'Tunda Siram (Hemat Air)', actionEn: 'Skip Spray (Save Water)', dry: false },
      B: { moist: '28%', temp: '34.6°C', actionId: 'Kirim Drone Sprayer!', actionEn: 'Dispatch Sprayer Drone!', dry: true },
      C: { moist: '31%', temp: '33.8°C', actionId: 'Kirim Drone Sprayer!', actionEn: 'Dispatch Sprayer Drone!', dry: true },
      D: { moist: '71%', temp: '28.5°C', actionId: 'Tunda Siram (Hemat Air)', actionEn: 'Skip Spray (Save Water)', dry: false }
    };

    function renderAmd() {
      const z = zones[zone];
      m1.textContent = z.moist;
      m2.textContent = z.temp;
      m3.textContent = isEn() ? z.actionEn : z.actionId;
      out.textContent = z.dry
        ? (isEn()
          ? `[GATEWAY RPi] Zone ${zone} soil moisture (${z.moist}) is below 35% threshold. Uploading GPS waypoint to UAV sprayer pump.`
          : `[GATEWAY RPi] Kelembapan tanah Blok ${zone} (${z.moist}) di bawah ambang 35%. Mengirim koordinat waypoint ke pompa sprayer drone.`)
        : (isEn()
          ? `[GATEWAY RPi] Zone ${zone} moisture (${z.moist}) is sufficient. Sprayer relay kept OFF—contributing to 22% water savings.`
          : `[GATEWAY RPi] Kelembapan Blok ${zone} (${z.moist}) sudah cukup. Pompa sprayer dinonaktifkan—menghemat penggunaan air hingga 22%.`);
    }

    zoneBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        zone = btn.dataset.zoneBtn;
        zoneBtns.forEach(b => b.classList.toggle('active', b === btn));
        renderAmd();
      });
    });
    document.addEventListener('languagechange', renderAmd);
    renderAmd();
  }

  // 6. TRACO-BOT Simulator
  if (simType === 'mrc') {
    const itemBtns = [...simRoot.querySelectorAll('[data-waste-item]')];
    const m1 = simRoot.querySelector('#simMrcM1');
    const m2 = simRoot.querySelector('#simMrcM2');
    const m3 = simRoot.querySelector('#simMrcM3');
    const out = simRoot.querySelector('#simMrcOut');
    let currentWaste = 'plastic';

    const items = {
      metal: { id: 'Logam (98.4%)', en: 'Metal (98.4%)', time: '0.84 s', bin: 'Bin #1 (Servo 15°)' },
      glass: { id: 'Kaca (96.1%)', en: 'Glass (96.1%)', time: '0.92 s', bin: 'Bin #2 (Servo 45°)' },
      plastic: { id: 'Plastik (97.8%)', en: 'Plastic (97.8%)', time: '0.79 s', bin: 'Bin #3 (Servo 75°)' },
      paper: { id: 'Kertas (95.5%)', en: 'Paper (95.5%)', time: '0.88 s', bin: 'Bin #4 (Servo 105°)' },
      organic: { id: 'Organik (96.9%)', en: 'Organic (96.9%)', time: '0.95 s', bin: 'Bin #5 (Servo 135°)' },
      residue: { id: 'Residu (94.2%)', en: 'Residue (94.2%)', time: '1.04 s', bin: 'Bin #6 ( ujung sabuk )' }
    };

    function renderMrc() {
      const it = items[currentWaste];
      m1.textContent = isEn() ? it.en : it.id;
      m2.textContent = it.time;
      m3.textContent = it.bin;
      out.textContent = isEn()
        ? `[TRACO-BOT] IR sensor triggered → OpenCV ROI crop → CNN classified ${it.en} in ${it.time} → Diverter arm routed item to ${it.bin}.`
        : `[TRACO-BOT] Sensor IR aktif → pemotongan ROI OpenCV → CNN mengenali ${it.id} dalam ${it.time} → Lengan servo mengarahkan ke ${it.bin}.`;
    }

    itemBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        currentWaste = btn.dataset.wasteItem;
        itemBtns.forEach(b => b.classList.toggle('active', b === btn));
        renderMrc();
      });
    });
    document.addEventListener('languagechange', renderMrc);
    renderMrc();
  }
}
