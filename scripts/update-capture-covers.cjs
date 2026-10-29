const fs = require('node:fs');
const path = require('node:path');
const { parseHTML } = require('linkedom');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/images/previews/manifest.json'), 'utf8'));
const translationPath = path.join(root, 'assets/js/translations.js');
const catalog = JSON.parse(fs.readFileSync(translationPath,'utf8').split('window.siteTranslations = ')[1].trim().replace(/;$/,''));
const styleVersion = require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'style.css'))).digest('hex').slice(0,12);
const scriptVersion = require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'script.js'))).digest('hex').slice(0,12);
for (const file of ['index.html', 'projects/index.html', 'profil/index.html']) {
  const source = fs.readFileSync(path.join(root,file),'utf8');
  const { document } = parseHTML(source);
  const prefix = file === 'index.html' ? './' : '../';
  for (const media of document.querySelectorAll('.work-card__media')) {
    const slug = media.getAttribute('href').match(/projects\/([^/]+)\//)?.[1];
    const capture = manifest[slug];
    if (!capture) {
      if (slug === 'cloud-manager') {
        media.innerHTML = '<div class="work-card__awaiting"><strong>Cloud Resource Manager</strong><span data-i18n="capture.pending">Screenshot belum tersedia</span></div>';
        catalog['capture.pending'] = {id:'Screenshot belum tersedia',en:'Screenshots pending'};
      }
      continue;
    }
    const image = capture.scenes[0];
    const key = `capture.cover.${slug}`;
    catalog[key] = image.title;
    media.classList.add('work-card__media--capture');
    media.classList.toggle('work-card__media--mobile-capture',capture.kind === 'mobile');
    media.innerHTML = `<img src="${prefix}assets/images/previews/${image.image}" width="${image.width}" height="${image.height}" alt="${image.title.id}" data-i18n-alt="${key}" loading="lazy" decoding="async">`;
  }
  const html = document.documentElement.outerHTML.replace(/></g,'>\n<')
    .replace(/style\.css(?:\?v=[^"\s]+)?(?=")/g, `style.css?v=${styleVersion}`)
    .replace(/(src="(?:\.\/|\.\.\/)?)script\.js(?:\?[^"\s]+)?"/g, `$1script.js?v=${scriptVersion}"`);
  fs.writeFileSync(path.join(root,file),'<!DOCTYPE html>\n'+html+'\n');
}
fs.writeFileSync(translationPath,`window.siteTranslations = ${JSON.stringify(catalog,null,2)};\n`);
console.log('Updated genuine capture covers and shared stylesheet/script versions.');
