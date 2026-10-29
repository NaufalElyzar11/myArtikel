// DOM behavior tests; these do not render layout or launch a browser.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parseHTML } = require('linkedom');
const root = path.resolve(__dirname, '..');
const softwareFiles = ['cetakin', 'pkl-kominfo', 'banua-tour', 'cloud-manager', 'myanimerent', 'e-ponic']
  .map(slug => `projects/${slug}/index.html`);
const files = ['index.html', 'projects/index.html', 'profil/index.html', 'projects/amd/index.html',
  'projects/mrc/index.html', 'projects/hexaka/index.html', 'projects/aac/index.html',
  'projects/teksif/index.html', 'projects/mangrovepreneurs/index.html', ...softwareFiles];

function load(file, { query = '', saved, blocked = false, mobile = true, reducedMotion = false, clipboard } = {}) {
  const { window, document } = parseHTML(fs.readFileSync(path.join(root, file), 'utf8'));
  let active = document.body;
  Object.defineProperty(document, 'activeElement', { get: () => active });
  window.HTMLElement.prototype.focus = function () { active = this; };
  const media = new Map();
  window.matchMedia = query => {
    if (!media.has(query)) media.set(query, {
      matches: query.includes('prefers-reduced-motion') ? reducedMotion : mobile,
      addEventListener(type, handler) { this.handler = handler; },
      change(value) { this.matches = value; this.handler?.(); }
    });
    return media.get(query);
  };
  window.innerHeight = 800;
  window.scrollY = 0;
  let timerId = 0;
  const timers = new Map();
  window.setTimeout = callback => { timers.set(++timerId, callback); return timerId; };
  window.clearTimeout = id => timers.delete(id);
  const location = new URL(`https://portfolio.test/${file}${query}`);
  const store = new Map(saved ? [['naufal-language', saved]] : []);
  const context = vm.createContext({
    window, document, location, URL, URLSearchParams, Date, navigator: { clipboard },
    CustomEvent: window.CustomEvent,
    localStorage: {
      getItem(key) { if (blocked) throw new Error('Storage blocked'); return store.get(key) ?? null; },
      setItem(key, value) { if (blocked) throw new Error('Storage blocked'); store.set(key, value); }
    },
    history: { state: null, replaceState(state, unused, url) { location.href = String(url); } },
    requestAnimationFrame: callback => callback()
  });
  for (const script of document.querySelectorAll('script[src]')) {
    const scriptPath = path.resolve(root, path.dirname(file), script.getAttribute('src').split('?')[0]);
    vm.runInContext(fs.readFileSync(scriptPath, 'utf8'), context, { filename: scriptPath });
  }
  const click = el => el.dispatchEvent(new window.Event('click', { bubbles: true, cancelable: true }));
  const key = (key, shiftKey = false) => {
    const event = new window.Event('keydown', { bubbles: true, cancelable: true });
    Object.assign(event, { key, shiftKey });
    document.dispatchEvent(event);
  };
  const advanceTimer = () => {
    const entry = timers.entries().next().value;
    if (!entry) return;
    timers.delete(entry[0]);
    entry[1]();
  };
  return { window, document, store, location, media, click, key, timers, advanceTimer };
}

for (const file of files) {
  test(`${file}: full EN/ID round trip, metadata and persistent selection`, () => {
    const { window, document, store, click, location } = load(file);
    const nodes = [...document.querySelectorAll('[data-i18n]')];
    const before = nodes.map(el => el.innerHTML);
    click(document.querySelector('[data-language="en"]'));
    assert.equal(document.documentElement.lang, 'en');
    assert.equal(store.get('naufal-language'), 'en');
    assert.equal(location.searchParams.get('lang'), 'en');
    assert.equal(document.querySelector('[data-language="en"]').getAttribute('aria-pressed'), 'true');
    nodes.forEach(el => assert.equal(el.textContent, window.siteTranslations[el.getAttribute('data-i18n')].en));
    for (const attr of ['alt', 'aria-label', 'data-caption', 'content']) {
      document.querySelectorAll(`[data-i18n-${attr}]`).forEach(el => {
        // The menu has a state-dependent accessible name managed by page behavior.
        if (el.id === 'navToggle') return;
        assert.equal(el.getAttribute(attr), window.siteTranslations[el.getAttribute(`data-i18n-${attr}`)].en);
      });
    }
    assert.ok(document.querySelector('.language-switch').className);
    const internal = [...document.querySelectorAll('a[href]')].find(a => a.getAttribute('href').includes('.html?lang=en') || a.getAttribute('href').includes('/?lang=en'));
    assert.ok(internal, 'Internal page links carry language');
    click(document.querySelector('[data-language="id"]'));
    assert.equal(document.documentElement.lang, 'id');
    nodes.forEach((el, index) => assert.equal(el.innerHTML, before[index]));
    assert.match(document.querySelector('#year, #yr').textContent, /^\d{4}$/);
    click(document.querySelector('[data-language="en"]'));
    assert.equal(document.querySelector('[data-language="en"]').getAttribute('aria-pressed'), 'true');
  });

  if (/class="(?:frame|gallery__item)(?:\s|")/.test(fs.readFileSync(path.join(root, file), 'utf8'))) {
  test(`${file}: gallery navigation, keyboard focus, Escape, and translated captions`, () => {
    const { document, window, click, key } = load(file, { query: '?lang=en' });
    const items = [...document.querySelectorAll('.frame, .gallery__item')];
    items[0].focus();
    click(items[0]);
    const modal = document.querySelector('.lightbox');
    assert.equal(modal.getAttribute('aria-hidden'), 'false');
    assert.equal(document.querySelector('main').inert, true);
    assert.equal(modal.querySelector('img').alt, items[0].dataset.caption);
    assert.equal(modal.querySelector('.lightbox__next').getAttribute('aria-label'), 'Next photo');
    assert.equal(document.activeElement, modal.querySelector('.lightbox__close'));
    key('ArrowRight');
    assert.equal(modal.querySelector('img').getAttribute('src'), items[1].href);
    key('ArrowLeft'); key('ArrowLeft');
    assert.equal(modal.querySelector('img').getAttribute('src'), items.at(-1).href);
    key('Tab', true);
    assert.equal(document.activeElement, modal.querySelector('.lightbox__next'));
    window.siteI18n.setLanguage('id');
    assert.equal(modal.querySelector('.lightbox__next').getAttribute('aria-label'), 'Foto berikutnya');
    key('Escape');
    assert.equal(modal.getAttribute('aria-hidden'), 'true');
    assert.notEqual(document.querySelector('main').inert, true);
    assert.equal(document.activeElement, items[0]);
    assert.notEqual(document.body.style.overflow, 'hidden');
  });
  }
}

test('Saved language, URL precedence, invalid values, and disabled storage', () => {
  assert.equal(load('index.html', { saved: 'en' }).document.documentElement.lang, 'en');
  assert.equal(load('index.html', { saved: 'en', query: '?lang=id' }).document.documentElement.lang, 'id');
  assert.equal(load('index.html', { saved: 'invalid', query: '?lang=fr' }).document.documentElement.lang, 'id');
  const result = load('index.html', { blocked: true, query: '?lang=en' });
  assert.equal(result.document.documentElement.lang, 'en');
  result.click(result.document.querySelector('[data-language="id"]'));
  assert.equal(result.document.documentElement.lang, 'id');
  result.window.siteI18n.setLanguage('unknown');
  assert.equal(result.document.documentElement.lang, 'id');
});

test('Mobile menu survives language changes and closes with Escape or resize', () => {
  const { document, click, key, window, media } = load('index.html');
  const toggle = document.querySelector('#navToggle');
  click(toggle);
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  window.siteI18n.setLanguage('en');
  assert.equal(toggle.getAttribute('aria-label'), 'Close menu');
  key('Escape');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, toggle);
  click(toggle);
  media.get('(max-width: 1080px)').change(false);
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
});

test('Overview navigation clears its active state while reading a section outside the main menu', () => {
  const { document, window } = load('index.html');
  const sections = [...document.querySelectorAll('main > section[id]')];
  const positions = new Map(sections.map(section => [section.id, 1000]));
  sections.forEach(section => { section.getBoundingClientRect = () => ({ top: positions.get(section.id) }); });
  positions.set('projects', -200);
  window.dispatchEvent(new window.Event('scroll'));
  assert.equal(document.querySelector('#navMenu a[href="#projects"]').getAttribute('aria-current'), 'location');
  positions.set('about', 80);
  window.dispatchEvent(new window.Event('scroll'));
  assert.equal(document.querySelector('#navMenu [aria-current]'), null);
  positions.set('about', -400);
  positions.set('skills', 80);
  window.dispatchEvent(new window.Event('scroll'));
  assert.equal(document.querySelector('#navMenu a[href="#skills"]').getAttribute('aria-current'), 'location');
  const profile = load('profil/index.html').document;
  assert.equal(profile.querySelector('#navMenu [aria-current="page"]').textContent, 'Profil');
});

test('Project contents collapse on mobile and expand on desktop', () => {
  const { document, click, media, window } = load('projects/hexaka/index.html');
  const toggle = document.querySelector('.toc-toggle');
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  click(toggle);
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  window.siteI18n.setLanguage('en');
  click(document.querySelector('.toc__link'));
  assert.equal(toggle.getAttribute('aria-expanded'), 'false');
  media.get('(max-width: 960px)').change(false);
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
});

test('Project filters show the right projects, retain selection across languages, and reset', () => {
  const { document, click, window } = load('projects/index.html');
  const visibleNames = () => [...document.querySelectorAll('[data-project-category]')]
    .filter(card => !card.hidden).map(card => card.querySelector('.project__name').textContent.trim());
  const button = category => document.querySelector(`[data-project-filter="${category}"]`);
  assert.equal(document.querySelector('.project-browser').hidden, false);
  assert.equal(visibleNames().length, 6);
  click(button('assistive'));
  assert.deepEqual(visibleNames(), ['AAC: Bicara Warna', 'TekSif: Chromoney']);
  assert.match(document.querySelector('.project-count').textContent, /^2 \/ 6/);
  window.siteI18n.setLanguage('en');
  assert.equal(button('assistive').getAttribute('aria-pressed'), 'true');
  assert.deepEqual(visibleNames(), ['AAC: Bicara Warna', 'TekSif: Chromoney']);
  assert.equal(document.querySelector('.project-count').textContent, '2 / 6 projects shown');
  click(button('iot'));
  assert.deepEqual(visibleNames(), ['Mangrovepreneurs', 'PRONE.ID', 'TRACO-BOT']);
  click(button('robotics'));
  assert.deepEqual(visibleNames(), ['Wasaka Hexapod (Hexaka V3)', 'TRACO-BOT']);
  click(button('all'));
  assert.equal(visibleNames().length, 6);
  assert.equal(document.querySelectorAll('[data-project-filter][aria-pressed="true"]').length, 1);
  window.siteI18n.setLanguage('id');
  assert.equal(document.querySelector('.project-count').textContent, '6 / 6 proyek ditampilkan');
});

test('New project galleries use the supplied result covers and retain contextual captions', () => {
  for (const [slug, cover, photos] of [
    ['aac', 'aac-result', 3], ['teksif', 'teksif-result', 3], ['mangrovepreneurs', 'mangrove-result', 5]
  ]) {
    const { document } = load(`projects/${slug}/index.html`);
    assert.ok(document.querySelector('.hero__media img').getAttribute('src').includes(cover));
    assert.equal(document.querySelectorAll('.documentation-photo').length, photos);
    assert.equal(document.querySelector('.toc-toggle').textContent, 'Daftar isi');
    assert.equal(document.querySelector('.toc').getAttribute('aria-label'), 'Daftar isi');
    for (const photo of document.querySelectorAll('.documentation-photo')) {
      assert.equal(photo.querySelector('figcaption').textContent, photo.querySelector('a').dataset.caption);
    }
  }
  const { document } = load('profil/index.html');
  const names = [...document.querySelectorAll('.people strong')].map(el => el.textContent.trim());
  assert.ok(names.includes('Nanda Ikbar'));
  assert.ok(names.includes('Siti Fathimah Az-Zahra'));
});

test('Homepage covers the main roles, tools, teaching, and full contact while linking to archives', () => {
  const { document } = load('index.html');
  assert.equal(document.querySelectorAll('.selected-grid .work-card').length, 4);
  assert.equal(document.querySelector('#interactive-lab'), null);
  assert.equal(document.querySelector('[data-project-sim]'), null);
  assert.equal(document.querySelector('.project__tabs'), null);
  for (const id of ['skills', 'educator']) {
    assert.ok(document.querySelector(`#${id}`), `${id} overview is visible on the homepage`);
    assert.ok(document.querySelector(`#navMenu a[href="#${id}"]`), `${id} has a direct menu entry`);
    assert.ok(document.querySelector(`#${id} a[href*="/profil/"]`), `${id} links to its full record`);
  }
  assert.ok(document.querySelector('#contact #copyEmailBtn'));
  assert.ok(document.querySelector('#contact #copyFeedback'));
  for (const channel of ['mailto:', 'linkedin.com', 'github.com', 'instagram.com']) {
    assert.ok([...document.querySelectorAll('#contact a[href]')].some(link => link.href.includes(channel)));
  }
  assert.equal(document.querySelectorAll('#contact .people li').length, 6);
  assert.ok(document.querySelector('a[href*="/projects/?lang=id"]'));
  assert.ok(document.querySelector('a[href*="/profil/?lang=id"]'));
  const { document: archive } = load('projects/index.html');
  assert.equal(archive.querySelectorAll('.work-card').length, 13);
  for (const link of archive.querySelectorAll('.work-card__link')) {
    assert.ok(link.href.startsWith('https://portfolio.test/projects/'));
    assert.ok(!link.href.includes('github.com'));
  }
});

test('Copy email announces success only after the clipboard write resolves', async () => {
  let resolveWrite;
  let copiedValue;
  const { document, click, advanceTimer, window } = load('index.html', {
    clipboard: { writeText(value) { copiedValue = value; return new Promise(resolve => { resolveWrite = resolve; }); } }
  });
  const button = document.querySelector('#copyEmailBtn');
  const feedback = document.querySelector('#copyFeedback');
  click(button);
  assert.equal(copiedValue, button.dataset.email);
  assert.equal(button.disabled, true);
  assert.equal(feedback.hidden, false);
  assert.equal(feedback.getAttribute('role'), 'status');
  assert.doesNotMatch(feedback.textContent, /tersalin|copied/i);
  resolveWrite();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(button.disabled, false);
  assert.match(feedback.textContent, /tersalin/);
  window.siteI18n.setLanguage('en');
  assert.match(feedback.textContent, /copied/);
  advanceTimer();
  assert.equal(feedback.hidden, true);
});

test('Copy email keeps manual fallback available when clipboard access fails or is missing', async () => {
  for (const clipboard of [undefined, { writeText: () => Promise.reject(new Error('Access denied')) }]) {
    const { document, click, window, timers } = load('index.html', { clipboard });
    const button = document.querySelector('#copyEmailBtn');
    const feedback = document.querySelector('#copyFeedback');
    click(button);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(button.disabled, false);
    assert.equal(feedback.hidden, false);
    assert.match(feedback.textContent, /manual/);
    assert.ok(feedback.textContent.includes(button.dataset.email));
    assert.doesNotMatch(feedback.textContent, /tersalin|copied/i);
    assert.equal(timers.size, 0);
    window.siteI18n.setLanguage('en');
    assert.match(feedback.textContent, /manually/);
    assert.ok(document.querySelector(`#contact a[href="mailto:${button.dataset.email}"]`));
  }
});

const captureManifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/images/previews/manifest.json'), 'utf8'));
for (const file of softwareFiles.filter(file => captureManifest[file.split('/')[1]])) {
  test(`${file}: walkthrough navigation, finite playback, pause, and language changes`, () => {
    const { document, window, click, timers, advanceTimer } = load(file);
    const scenes = [...document.querySelectorAll('[data-scene]')];
    const current = () => scenes.findIndex(scene => !scene.hidden);
    const next = document.querySelector('[data-preview-next]');
    const previous = document.querySelector('[data-preview-prev]');
    const play = document.querySelector('[data-preview-play]');
    assert.equal(scenes.length, 3);
    assert.equal(current(), 0);
    assert.equal(previous.disabled, true);
    click(next);
    assert.equal(current(), 1);
    window.siteI18n.setLanguage('en');
    assert.match(document.querySelector('[data-preview-status]').textContent, /^Screen 2 \/ 3:/);
    assert.equal(current(), 1);
    click(play);
    assert.equal(timers.size, 1);
    click(play);
    assert.equal(timers.size, 0);
    assert.equal(current(), 1);
    click(play);
    advanceTimer();
    assert.equal(current(), 2);
    assert.equal(next.disabled, true);
    advanceTimer();
    assert.equal(timers.size, 0);
    assert.equal(play.getAttribute('aria-pressed'), 'false');
    click(play);
    assert.equal(current(), 0);
    document.dispatchEvent(new window.Event('visibilitychange'));
    window.dispatchEvent(new window.Event('pagehide'));
    assert.equal(timers.size, 0);
    assert.equal(play.getAttribute('aria-pressed'), 'false');
    click(document.querySelector('[data-preview-step="2"]'));
    assert.equal(current(), 2);
    click(play);
    assert.equal(timers.size, 1);
    click(document.querySelector('.walkthrough__scene:not([hidden]) .gallery__item'));
    assert.equal(play.getAttribute('aria-pressed'), 'false');
    assert.equal(timers.size, 0);
    click(document.querySelector('.lightbox__close'));
    assert.equal(document.querySelector('.lightbox').getAttribute('aria-hidden'), 'true');
  });

  test(`${file}: reduced motion disables scene transitions and honors preference changes`, () => {
    const { document, click, media, timers } = load(file, { reducedMotion: true });
    assert.equal(document.querySelector('.is-entering'), null);
    assert.equal(document.querySelector('[data-preview-play]').textContent, 'Putar tanpa animasi');
    click(document.querySelector('[data-preview-play]'));
    media.get('(prefers-reduced-motion: reduce)').change(false);
    assert.equal(timers.size, 0);
  });
}

test('Software previews use captured assets and never substitute reconstructed interfaces', () => {
  const crypto = require('node:crypto');
  for (const file of softwareFiles) {
    const { document } = load(file);
    const captures = captureManifest[file.split('/')[1]];
    assert.equal(document.querySelector('.preview-browser, .preview-phone'), null);
    if (!captures) {
      assert.ok(document.querySelector('.preview-unavailable'));
      assert.equal(document.querySelector('[data-walkthrough]'), null);
      continue;
    }
    assert.equal(document.querySelectorAll('.actual-capture img').length, captures.scenes.length);
    for (const scene of captures.scenes) {
      const asset = fs.readFileSync(path.join(root, 'assets/images/previews', scene.image));
      assert.equal(crypto.createHash('sha256').update(asset).digest('hex'), scene.sha256);
      assert.ok(asset.length > 10000, 'Capture must contain a rendered image');
    }
  }
});
