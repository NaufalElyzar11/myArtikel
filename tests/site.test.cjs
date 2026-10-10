// DOM behavior tests; these do not render layout or launch a browser.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parseHTML } = require('linkedom');
const root = path.resolve(__dirname, '..');
const files = ['index.html', 'projects/amd/index.html', 'projects/mrc/index.html', 'projects/hexaka/index.html',
  'projects/aac/index.html', 'projects/teksif/index.html', 'projects/mangrovepreneurs/index.html'];

function load(file, { query = '', saved, blocked = false, mobile = true } = {}) {
  const { window, document } = parseHTML(fs.readFileSync(path.join(root, file), 'utf8'));
  let active = document.body;
  Object.defineProperty(document, 'activeElement', { get: () => active });
  window.HTMLElement.prototype.focus = function () { active = this; };
  const media = new Map();
  window.matchMedia = query => {
    if (!media.has(query)) media.set(query, {
      matches: mobile,
      addEventListener(type, handler) { this.handler = handler; },
      change(value) { this.matches = value; this.handler?.(); }
    });
    return media.get(query);
  };
  window.innerHeight = 800;
  window.scrollY = 0;
  const location = new URL(`https://portfolio.test/${file}${query}`);
  const store = new Map(saved ? [['naufal-language', saved]] : []);
  const context = vm.createContext({
    window, document, location, URL, URLSearchParams, Date,
    CustomEvent: window.CustomEvent,
    localStorage: {
      getItem(key) { if (blocked) throw new Error('Storage blocked'); return store.get(key) ?? null; },
      setItem(key, value) { if (blocked) throw new Error('Storage blocked'); store.set(key, value); }
    },
    history: { state: null, replaceState(state, unused, url) { location.href = String(url); } },
    requestAnimationFrame: callback => callback()
  });
  for (const script of document.querySelectorAll('script[src]')) {
    const scriptPath = path.resolve(root, path.dirname(file), script.getAttribute('src'));
    vm.runInContext(fs.readFileSync(scriptPath, 'utf8'), context, { filename: scriptPath });
  }
  const click = el => el.dispatchEvent(new window.Event('click', { bubbles: true, cancelable: true }));
  const key = (key, shiftKey = false) => {
    const event = new window.Event('keydown', { bubbles: true, cancelable: true });
    Object.assign(event, { key, shiftKey });
    document.dispatchEvent(event);
  };
  return { window, document, store, location, media, click, key };
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
  const { document, click, window } = load('index.html');
  const visibleNames = () => [...document.querySelectorAll('[data-project-category]')]
    .filter(card => !card.hidden).map(card => card.querySelector('.project__name').textContent.trim());
  const button = category => document.querySelector(`[data-project-filter="${category}"]`);
  assert.equal(document.querySelector('.project-browser').hidden, false);
  assert.equal(visibleNames().length, 6);
  click(button('assistive'));
  assert.deepEqual(visibleNames(), ['AAC — Bicara Warna', 'TekSif — Chromoney']);
  assert.match(document.querySelector('.project-count').textContent, /^2 \/ 6/);
  window.siteI18n.setLanguage('en');
  assert.equal(button('assistive').getAttribute('aria-pressed'), 'true');
  assert.deepEqual(visibleNames(), ['AAC — Bicara Warna', 'TekSif — Chromoney']);
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
  const { document } = load('index.html');
  const names = [...document.querySelectorAll('.people strong')].map(el => el.textContent.trim());
  assert.ok(names.includes('Nanda Ikbar'));
  assert.ok(names.includes('Siti Fathimah Az-Zahra'));
});
