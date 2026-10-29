// Receives factual project descriptions and renders real captures only.
module.exports = function renderPages({ root, projects, fs, path }) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/images/previews/manifest.json'), 'utf8'));
  const dictionary = {
    'sw.nav': { id: 'Navigasi proyek', en: 'Project navigation' },
    'sw.ui.play': { id: 'Putar preview', en: 'Play preview' },
    'sw.ui.pause': { id: 'Jeda', en: 'Pause' },
    'sw.ui.playReduced': { id: 'Putar tanpa animasi', en: 'Play without animation' },
    'sw.ui.step': { id: 'Tampilan', en: 'Screen' },
    'sw.ui.choose': { id: 'Pilih tampilan aplikasi', en: 'Choose an application screen' },
    'sw.ui.controls': { id: 'Kontrol preview aplikasi', en: 'Application preview controls' }
  };
  let serial = 0;
  const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  function text(id, en, tag = 'span', attrs = '') {
    const key = `sw.real.${++serial}`;
    dictionary[key] = { id, en };
    return `<${tag} data-i18n="${key}" ${attrs}>${esc(id)}</${tag}>`;
  }
  const paragraph = (pair, attrs = '') => text(pair.id ?? pair[0], pair.en ?? pair[1], 'p', attrs);
  const link = (id, en, attrs) => text(id, en, 'a', attrs);
  function preview(project, capture) {
    if (!capture?.scenes?.length) {
      return `<div class="preview-unavailable">${text('Dokumentasi tampilan asli belum tersedia.','Original interface captures are not available yet.','h3')}${paragraph(['Penjelasan proyek tersedia di bawah. Preview akan ditambahkan setelah aplikasi aslinya dapat dijalankan dan didokumentasikan.','The project description is available below. A preview will be added when the original application can be run and documented.'])}</div>`;
    }
    const scenes = capture.scenes;
    return `<div class="walkthrough" data-walkthrough data-capture-kind="${esc(capture.kind)}"><div class="walkthrough__controls" role="group" aria-label="Kontrol preview aplikasi" data-i18n-aria-label="sw.ui.controls" hidden><div class="walkthrough__steps" role="group" aria-label="Pilih tampilan aplikasi" data-i18n-aria-label="sw.ui.choose">${scenes.map((scene, index) => text(`${index + 1}. ${scene.title.id}`, `${index + 1}. ${scene.title.en}`, 'button', `type="button" data-preview-step="${index}" aria-pressed="${index === 0}" aria-controls="preview-scene-${index}"`)).join('')}</div><div class="walkthrough__transport">${text('Sebelumnya', 'Previous', 'button', 'type="button" data-preview-prev')}${text('Berikutnya', 'Next', 'button', 'type="button" data-preview-next')}<button type="button" data-preview-play aria-pressed="false">Putar preview</button></div><p class="walkthrough__status" data-preview-status role="status" aria-live="polite"></p></div>${scenes.map((scene, index) => {
      const captionKey = `sw.capture.${project.slug}.${index}`;
      dictionary[captionKey] = scene.title;
      return `<div class="walkthrough__scene" id="preview-scene-${index}" role="group" aria-labelledby="preview-title-${index}" data-scene="${index}" ${index ? 'hidden' : ''}><figure class="actual-capture"><a class="gallery__item" href="../../assets/images/previews/${esc(scene.image)}" data-caption="${esc(scene.title.id)}" data-i18n-data-caption="${captionKey}"><img src="../../assets/images/previews/${esc(scene.image)}" width="${scene.width}" height="${scene.height}" alt="${esc(scene.title.id)}" data-i18n-alt="${captionKey}" loading="${index ? 'lazy' : 'eager'}" decoding="async"></a>${text('Klik gambar untuk memperbesar ↗','Select the image to enlarge ↗','figcaption')}</figure><div class="walkthrough__copy"><span class="walkthrough__number">${String(index + 1).padStart(2, '0')} / ${String(scenes.length).padStart(2, '0')}</span>${text(scene.title.id, scene.title.en, 'h3', `id="preview-title-${index}"`)}${paragraph(scene.description)}</div></div>`;
    }).join('')}${paragraph(['Tangkapan layar diambil dari antarmuka aplikasi asli pada lingkungan lokal dengan data demo. Teks di dalam gambar mengikuti bahasa aplikasi.','Screenshots were captured from the original application interface running locally with demo data. Text inside the images follows the application’s language.'], 'class="walkthrough__footnote"')}</div>`;
  }
  for (const project of projects) {
    const capture = manifest[project.slug];
    const titleKey = `sw.${project.slug}.pageTitle`;
    const metaKey = `sw.${project.slug}.meta`;
    dictionary[titleKey] = { id: `${project.name} | Naufal Elyzar`, en: `${project.name} | Naufal Elyzar` };
    dictionary[metaKey] = { id: project.intro[0], en: project.intro[1] };
    const source = capture?.source ?? {
      id: 'Tampilan asli aplikasi ini belum didokumentasikan. Tidak ada gambar rekonstruksi yang dipakai sebagai pengganti screenshot.',
      en: 'The original application interface has not been documented yet. Reconstructed images are not used as substitute screenshots.'
    };
    const page = `<!DOCTYPE html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title data-i18n="${titleKey}">${esc(project.name)} | Naufal Elyzar</title><meta name="description" content="${esc(project.intro[0])}" data-i18n-content="${metaKey}"><meta property="og:title" content="${esc(project.name)} | Naufal Elyzar" data-i18n-content="${titleKey}"><meta property="og:description" content="${esc(project.intro[0])}" data-i18n-content="${metaKey}"><meta property="og:type" content="article"><meta name="author" content="Naufal Elyzar"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&amp;family=IBM+Plex+Mono:wght@400;500;600&amp;family=IBM+Plex+Sans:wght@400;500;600;700&amp;display=swap"><link rel="stylesheet" href="../../assets/css/project-detail.css"><link rel="stylesheet" href="../../assets/css/site-controls.css"><link rel="stylesheet" href="../../assets/css/software-project.css?v=20261028-actual"></head>
<body class="software-page" data-software-project="${project.slug}"><a class="skip-link" href="#main-content" data-i18n="t002">Langsung ke konten</a><header class="topbar"><div class="wrap">${link('← Semua proyek','← All projects','class="back-link" href="../../projects/"')}<nav class="mininav" aria-label="Navigasi proyek" data-i18n-aria-label="sw.nav">${link('Preview','Preview','href="#preview"')}${link('Tentang proyek','About the project','href="#tentang"')}${link('Kontribusi','Contribution','href="#kontribusi"')}</nav><div class="language-switch" role="group" aria-label="Bahasa" data-i18n-aria-label="t107"><button type="button" data-language="id" lang="id" aria-pressed="true" aria-label="Bahasa Indonesia" data-i18n-aria-label="t108">ID</button><button type="button" data-language="en" lang="en" aria-pressed="false" aria-label="English" data-i18n-aria-label="t109">EN</button></div></div></header>
<main id="main-content" tabindex="-1"><section class="hero"><div class="wrap">${text(...project.category,'p','class="eyebrow"')}<h1 class="hero__title">${esc(project.name)}</h1>${text(...project.intro,'p','class="lead"')}<div class="cta-group">${link(capture?'Lihat tampilan asli ↓':'Tentang proyek ↓',capture?'View actual screens ↓':'About the project ↓',`class="btn" href="#${capture?'preview':'tentang'}"`)}${link('Peran saya ↓','My contribution ↓','class="btn btn--ghost" href="#kontribusi"')}</div><dl class="project-facts"><div>${text('Konteks proyek','Project context','dt')}${text(...project.context,'dd')}</div><div>${text('Untuk siapa','Who it serves','dt')}${text(...project.audience,'dd')}</div><div id="kontribusi">${text('Kontribusi saya','My contribution','dt')}${text(...project.role,'dd')}</div></dl></div></section>
<div class="wrap"><section class="block" id="preview"><div class="preview-intro"><div>${text('Tampilan aplikasi asli','Actual application screens','h2')}${paragraph(['Lihat langsung antarmukanya tanpa perlu membuka repositori.','See the interface directly without opening a repository.'])}</div>${capture?text('Screenshot aplikasi asli · data demo','Actual application screenshots · demo data','span','class="preview-label"'):''}</div>${preview(project,capture)}</section>
<section class="block" id="tentang">${text('Mengapa proyek ini dibuat?','Why was this project built?','h2')}<div class="story-grid"><div>${text('Masalahnya','The problem','h3')}${paragraph(project.problem)}</div><div>${text('Pendekatannya','The approach','h3')}${paragraph(project.solution)}</div></div></section>
<section class="block" id="fitur">${text('Yang bisa dilakukan pengguna','What users can do','h2')}<ul class="feature-list">${project.features.map(feature=>`<li>${text(feature[0],feature[1],'strong')}${text(feature[2],feature[3],'p')}</li>`).join('')}</ul></section>
<section class="block" id="teknologi">${text('Teknologi & dokumentasi','Technology & documentation','h2')}<ul class="stack">${project.stack.map(stack=>`<li>${esc(stack)}</li>`).join('')}</ul><details class="source-note"><summary>${text('Tentang dokumentasi preview','About these captures')}</summary>${paragraph(source)}</details><div class="source-links">${link(project.slug==='cetakin'?'Kunjungi website CetakIn ↗':'Kode sumber (opsional) ↗',project.slug==='cetakin'?'Visit CetakIn website ↗':'Source code (optional) ↗',`class="btn btn--ghost" href="${project.url}" target="_blank" rel="noreferrer"`)}</div></section>
<section class="block"><div class="cta-group">${link('← Jelajahi proyek lainnya','← Explore more projects','class="btn btn--ghost" href="../../projects/"')}${link('Bahas peluang kerja atau kolaborasi ↗','Discuss work or collaboration ↗','class="btn" href="../../index.html#contact"')}</div></section></div></main><footer><div class="wrap">© <span id="year"></span> <span data-i18n="t103">Naufal Elyzar. Hak cipta dilindungi.</span> ${link('Beranda','Home','href="../../index.html"')}</div></footer>
<script defer src="../../assets/js/translations.js"></script><script defer src="../../assets/js/software-data.js?v=actual"></script><script defer src="../../assets/js/i18n.js"></script><script defer src="../../assets/js/gallery.js"></script><script defer src="../../assets/js/software-project.js"></script></body></html>`;
    fs.mkdirSync(path.join(root, 'projects', project.slug), { recursive: true });
    fs.writeFileSync(path.join(root, 'projects', project.slug, 'index.html'), page.replace(/></g, '>\n<')+'\n');
  }
  const serialized = `// ID / EN case study copy; screenshots remain in the application's original language.\nObject.assign(window.siteTranslations, ${JSON.stringify(dictionary,null,2)});\n`;
  fs.writeFileSync(path.join(root, 'assets/js/software-data.js'), serialized);
  const hash = value => require('node:crypto').createHash('sha256').update(value).digest('hex').slice(0,12);
  const copyVersion = hash(serialized);
  const styleVersion = hash(fs.readFileSync(path.join(root, 'assets/css/software-project.css')));
  const behaviorVersion = hash(fs.readFileSync(path.join(root, 'assets/js/software-project.js')));
  for (const project of projects) {
    const file = path.join(root,'projects',project.slug,'index.html');
    const html = fs.readFileSync(file,'utf8')
      .replace('software-data.js?v=actual', `software-data.js?v=${copyVersion}`)
      .replace('software-project.css?v=20261028-actual', `software-project.css?v=${styleVersion}`)
      .replace('software-project.js"', `software-project.js?v=${behaviorVersion}"`);
    fs.writeFileSync(file,html);
  }
  console.log(`Rendered ${projects.length} case studies; ${Object.keys(manifest).length} have genuine application captures.`);
};
