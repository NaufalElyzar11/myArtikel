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
  assert.equal(document.querySelectorAll('[data-project-reel] .project-reel__chapter').length, 4);
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

test('CetakIn homepage preview switches captures and preserves the selected view across languages', () => {
  const { document, window, click } = load('index.html');
  const viewer = document.querySelector('[data-showcase]');
  const controls = viewer.querySelector('.showcase__controls');
  const buttons = [...controls.querySelectorAll('button')];
  const panels = [...viewer.querySelectorAll('.showcase__screen')];
  const captures = {
    'cetakin-store': 'cetakin-home.jpg',
    'cetakin-clicker': 'cetakin-clicker.jpg',
    'cetakin-guides': 'cetakin-guides.jpg'
  };
  assert.equal(controls.hidden, false);
  assert.equal(controls.getAttribute('role'), 'group');
  assert.equal(panels.length, 3);
  assert.deepEqual(buttons.map(button => button.getAttribute('aria-controls')), Object.keys(captures));
  for (const button of buttons) {
    assert.equal(button.getAttribute('type'), 'button');
    assert.equal(button.disabled, false);
    const id = button.getAttribute('aria-controls');
    const panel = viewer.querySelector(`#${id}`);
    assert.ok(panel, `${id} is a panel inside the viewer`);
    assert.equal(path.basename(panel.querySelector('img').getAttribute('src')), captures[id]);
  }

  function assertSelection(id, language) {
    for (const button of buttons) {
      assert.equal(button.getAttribute('aria-pressed'), String(button.getAttribute('aria-controls') === id));
    }
    assert.deepEqual(panels.filter(panel => !panel.hidden).map(panel => panel.id), [id]);
    const caption = viewer.querySelector(`#${id} figcaption`);
    const translationKey = caption.getAttribute('data-i18n');
    assert.equal(caption.textContent, window.siteTranslations[translationKey][language]);
  }

  assertSelection('cetakin-store', 'id');
  for (const button of buttons.slice(1)) {
    // LinkeDOM has no native keyboard activation. Dispatch the click a focused button would receive.
    button.focus();
    click(button);
    assert.equal(document.activeElement, button);
    assertSelection(button.getAttribute('aria-controls'), 'id');
  }
  for (const language of ['en', 'id']) {
    click(document.querySelector(`[data-language="${language}"]`));
    assertSelection('cetakin-guides', language);
  }
  click(buttons[0]);
  assertSelection('cetakin-store', 'id');
});

test('Homepage Clicker Lab matches CetakIn preview behavior across languages, colors, and empty state', () => {
  const { document, window, click, advanceTimer } = load('index.html');
  const lab = document.querySelector('.clicker-lab');
  const input = lab.querySelector('#clicker-text');
  const previewWindow = lab.querySelector('#clicker-window');
  const status = lab.querySelector('#clicker-status');
  const orderLink = lab.querySelector('#clicker-order-link');
  const keys = () => [...lab.querySelectorAll('button.clicker-cetakin__key')];
  const legends = () => keys().map(key => key.textContent.trim());
  const pinkBtn = lab.querySelector('.clicker-cetakin__option[data-color="pink"]');
  const blueBtn = lab.querySelector('.clicker-cetakin__option[data-color="blue"]');

  assert.equal(previewWindow.dataset.color, 'orange');
  assert.deepEqual(legends(), ['C', 'E', 'T', 'A', 'K']);
  assert.equal(status.textContent, '5 huruf · Base PETG orange');
  assert.match(orderLink.getAttribute('href'), /^https:\/\/cetak-in\.my\.id\/clicker\.html#desain=/);

  input.value = 'n4!au f';
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  click(pinkBtn);

  assert.equal(input.value, 'NAUF');
  assert.deepEqual(legends(), ['N', 'A', 'U', 'F']);
  assert.equal(previewWindow.dataset.color, 'pink');
  assert.equal(pinkBtn.getAttribute('aria-pressed'), 'true');
  assert.equal(status.textContent, '4 huruf · Base PLA pink');
  assert.equal(keys()[0].getAttribute('aria-label'), `${window.siteTranslations['home.clicker.key'].id} N`);

  click(document.querySelector('[data-language="en"]'));
  assert.equal(status.textContent, '4 letters · PLA pink base');
  assert.equal(keys()[0].getAttribute('aria-label'), `${window.siteTranslations['home.clicker.key'].en} N`);

  click(blueBtn);
  assert.equal(previewWindow.dataset.color, 'blue');
  assert.equal(status.textContent, '4 letters · PETG sky blue base');

  const firstKey = keys()[0];
  firstKey.focus();
  click(firstKey);
  assert.equal(document.activeElement, firstKey);
  assert.equal(firstKey.classList.contains('pressed'), true);
  advanceTimer();
  assert.equal(firstKey.classList.contains('pressed'), false);

  input.value = '123';
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.equal(input.value, '');
  assert.equal(keys().length, 0);
  assert.equal(lab.querySelector('.clicker-cetakin__key--placeholder').textContent, '?');
  assert.equal(orderLink.getAttribute('aria-disabled'), 'true');
  assert.equal(status.textContent, window.siteTranslations['home.clicker.emptyStatus'].en);

  click(document.querySelector('[data-language="id"]'));
  assert.equal(status.textContent, window.siteTranslations['home.clicker.emptyStatus'].id);
});

test('Hexapod kinematics module solves 18-DOF IK/FK accurately across walking and IMU slope interlock', () => {
  const kin = require(path.join(root, 'assets/js/hexapod-kinematics.js'));
  for (const [vx, omega, slopeDeg, phase] of [
    [0, 0, 0, 0],
    [1, 0, 0, Math.PI * 0.5],
    [-1, 0, 10, Math.PI * 1.4],
    [0, 1, 14, Math.PI * 0.7],
    [1, 0, 22, Math.PI * 0.4]
  ]) {
    const pose = kin.computePose({ vx, omega, slopeDeg, phase });
    assert.equal(pose.legs.length, 6);
    assert.equal(pose.telemetry.interlock, slopeDeg >= 18);
    if (slopeDeg >= 18) {
      assert.equal(pose.telemetry.gaitLabel, 'INTERLOCK');
      assert.ok(pose.bodyHeight < kin.DEFAULT_STAND_HEIGHT);
    } else {
      assert.equal(pose.telemetry.gaitLabel, 'TRIPOD 3+3');
    }
    pose.legs.forEach((legOut, idx) => {
      const def = kin.DEFAULT_LEGS[idx];
      const fk = kin.solveLegFK(def.mount, def.baseYaw, legOut.angles);
      const err = Math.hypot(
        fk.x - legOut.footTarget.x,
        fk.y - legOut.footTarget.y,
        fk.z - legOut.footTarget.z
      );
      assert.ok(Number.isFinite(err) && err < 0.001, `Leg ${idx} IK error too large: ${err}`);
    });
  }

  // Verify smooth continuous velocity ramp across forward -> reverse and forward -> turn without discontinuities.
  let prevPose = null;
  for (let step = 0; step <= 20; step++) {
    const t = step / 20;
    const vx = 1 - 2 * t;
    const omega = Math.sin(t * Math.PI) * 0.5;
    const pose = kin.computePose({ vx, omega, slopeDeg: 8, phase: 0.6 + step * 0.12 });
    if (prevPose) {
      pose.legs.forEach((legOut, idx) => {
        const prev = prevPose.legs[idx].angles;
        const maxJointJump = Math.max(
          Math.abs(legOut.angles.coxa - prev.coxa),
          Math.abs(legOut.angles.femur - prev.femur),
          Math.abs(legOut.angles.tibia - prev.tibia)
        );
        assert.ok(maxJointJump < 0.35, `Leg ${idx} jumped abruptly during reversal: ${maxJointJump}`);
      });
    }
    prevPose = pose;
  }
});

test('Homepage Dual Lab defaults to Hexaka V3, controls gait/IMU/explode, and switches cleanly to Clicker Lab', () => {
  const { document, window, click } = load('index.html');
  const hexTab = document.querySelector('#lab-tab-hexapod');
  const clickerTab = document.querySelector('#lab-tab-clicker');
  const hexPanel = document.querySelector('#lab-panel-hexapod');
  const clickerPanel = document.querySelector('#lab-panel-clicker');
  const forwardBtn = hexPanel.querySelector('[data-hex-move="forward"]');
  const stopBtn = hexPanel.querySelector('[data-hex-move="stop"]');
  const slopeInput = hexPanel.querySelector('#hexapod-slope');
  const explodeBtn = hexPanel.querySelector('#hexapod-explode');
  const internalsBar = hexPanel.querySelector('#hexapod-internals');

  assert.equal(hexTab.getAttribute('aria-selected'), 'true');
  assert.equal(clickerTab.getAttribute('aria-selected'), 'false');
  assert.equal(hexPanel.hidden, false);
  assert.equal(clickerPanel.hidden, true);
  assert.equal(stopBtn.getAttribute('aria-pressed'), 'true');
  assert.equal(internalsBar.hidden, true);

  click(forwardBtn);
  assert.equal(forwardBtn.getAttribute('aria-pressed'), 'true');
  assert.equal(stopBtn.getAttribute('aria-pressed'), 'false');
  assert.equal(hexPanel.querySelector('#hexapod-motion-val').textContent, 'Maju');

  slopeInput.value = '18';
  slopeInput.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.equal(hexPanel.querySelector('#hexapod-slope-val').textContent, '18°');
  assert.equal(hexPanel.querySelector('#hexapod-pid-val').textContent, '-16.9° PID');
  assert.equal(hexPanel.querySelector('#hexapod-gait-val').textContent, 'INTERLOCK');
  assert.equal(hexPanel.hasAttribute('data-interlock'), true);

  click(explodeBtn);
  assert.equal(explodeBtn.getAttribute('aria-pressed'), 'true');
  assert.equal(internalsBar.hidden, false);

  window.siteI18n.setLanguage('en');
  assert.equal(hexPanel.querySelector('#hexapod-motion-val').textContent, 'Forward');
  assert.equal(internalsBar.hidden, false);

  click(stopBtn);
  assert.equal(stopBtn.getAttribute('aria-pressed'), 'true');
  assert.equal(hexPanel.querySelector('#hexapod-motion-val').textContent, 'Stop');

  click(clickerTab);
  assert.equal(clickerTab.getAttribute('aria-selected'), 'true');
  assert.equal(hexPanel.hidden, true);
  assert.equal(clickerPanel.hidden, false);

  click(hexTab);
  assert.equal(hexTab.getAttribute('aria-selected'), 'true');
  assert.equal(hexPanel.hidden, false);
  assert.equal(clickerPanel.hidden, true);
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

test('Skill map links each technology to real project pages and reports the selection in both languages', () => {
  const { document, window, click } = load('index.html');
  const map = document.querySelector('[data-skill-map]');
  const chips = [...map.querySelectorAll('.skill-chip')];
  const rows = new Map([...map.querySelectorAll('[data-project]')].map(row => [row.dataset.project, row]));
  assert.ok(chips.length >= 20);
  for (const [slug, row] of rows) {
    assert.ok(fs.existsSync(path.join(root, 'projects', slug, 'index.html')), `${slug} page exists`);
    assert.ok(row.querySelector('a').getAttribute('href').includes(`projects/${slug}/`));
  }
  for (const chip of chips) {
    const links = chip.dataset.links.split(' ');
    assert.ok(links.length > 0);
    links.forEach(slug => assert.ok(rows.has(slug), `${chip.textContent} links to ${slug}`));
  }
  const linked = () => [...rows].filter(([, row]) => row.classList.contains('is-linked')).map(([slug]) => slug);
  const status = map.querySelector('[data-skill-status]');
  const laravel = chips.find(chip => chip.textContent === 'Laravel');
  assert.equal(laravel.getAttribute('aria-pressed'), 'true');
  assert.deepEqual(linked(), ['pkl-kominfo', 'cloud-manager']);
  assert.equal(status.textContent, 'Laravel dipakai di 2 proyek.');

  const flutter = chips.find(chip => chip.textContent.startsWith('Flutter'));
  click(flutter);
  assert.equal(flutter.getAttribute('aria-pressed'), 'true');
  assert.equal(laravel.getAttribute('aria-pressed'), 'false');
  assert.deepEqual(linked(), ['myanimerent', 'e-ponic', 'mangrovepreneurs']);
  window.siteI18n.setLanguage('en');
  assert.equal(status.textContent, 'Flutter · Dart is used in 3 projects.');

  click(flutter);
  assert.equal(flutter.getAttribute('aria-pressed'), 'false');
  assert.deepEqual(linked(), []);
  assert.equal(status.textContent, '');
});

test('Hero split-flap board shows the first role and keeps a full sentence for screen readers', () => {
  const { document, window, timers } = load('index.html');
  const board = document.querySelector('[data-flap-board]');
  assert.equal(board.getAttribute('aria-hidden'), 'true');
  assert.equal(board.querySelectorAll('.flap__cell').length, 16);
  const text = () => [...board.querySelectorAll('.flap__glyph')].map(glyph => glyph.textContent || ' ').join('').trim();
  assert.equal(text(), 'WEBSITE LARAVEL');
  assert.equal(timers.size, 0, 'rotation waits until the board is observed on screen');
  window.siteI18n.setLanguage('en');
  assert.equal(text(), 'LARAVEL WEBSITES');
  assert.match(document.querySelector('.flap .sr-only').textContent, /Laravel websites, Flutter apps/);
});

test('Command palette opens from the keyboard, finds projects by technology, and keeps the language', () => {
  for (const file of ['index.html', 'projects/hexaka/index.html', 'projects/cetakin/index.html']) {
    const { document, window, location } = load(file);
    const trigger = document.querySelector('.cmd-trigger');
    assert.ok(trigger, `${file} has a palette trigger`);
    assert.equal(trigger.nextElementSibling, document.querySelector('.language-switch'));
    window.siteI18n.setLanguage('en');
    assert.equal(trigger.getAttribute('aria-label'), 'Search pages, projects, or commands');

    const press = (key, extra = {}) => {
      const event = new window.Event('keydown', { bubbles: true, cancelable: true });
      Object.assign(event, { key }, extra);
      (extra.target || document).dispatchEvent(event);
    };
    press('k', { ctrlKey: true });
    const dialog = document.querySelector('dialog.cmd');
    assert.ok(dialog.hasAttribute('open'));
    const input = dialog.querySelector('.cmd__input');
    assert.equal(document.activeElement, input);

    input.value = 'laravel';
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
    const labels = [...dialog.querySelectorAll('[role="option"] .cmd__label')].map(el => el.textContent);
    assert.deepEqual(labels, ['Sistem Cuti Kominfo', 'Cloud Resource Manager']);
    assert.equal(input.getAttribute('aria-activedescendant'), dialog.querySelector('[aria-selected="true"]').id);

    input.value = 'zzzz';
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
    assert.match(dialog.querySelector('.cmd__empty').textContent, /No results/);

    input.value = 'laravel';
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
    const down = new window.Event('keydown', { bubbles: true, cancelable: true });
    Object.assign(down, { key: 'ArrowDown' });
    input.dispatchEvent(down);
    const enter = new window.Event('keydown', { bubbles: true, cancelable: true });
    Object.assign(enter, { key: 'Enter' });
    input.dispatchEvent(enter);
    assert.equal(dialog.hasAttribute('open'), false);
    assert.equal(location.pathname, '/projects/cloud-manager/');
    assert.equal(location.searchParams.get('lang'), 'en');
  }
});

test('Selected work reel keeps one CetakIn viewer, moves it with the layout, and hides inactive scenes from focus', () => {
  const { document, media } = load('index.html');
  const reel = document.querySelector('[data-project-reel]');
  const viewer = () => document.querySelectorAll('[data-showcase]');
  assert.equal(viewer().length, 1);
  assert.equal(document.querySelectorAll('#cetakin-store').length, 1);
  const chapters = [...reel.querySelectorAll('[data-reel-beat]')].map(el => el.dataset.reelBeat);
  const layers = [...reel.querySelectorAll('[data-reel-layer]')];
  assert.deepEqual(chapters, ['cetakin', 'pkl-kominfo', 'myanimerent', 'hexaka']);
  assert.deepEqual(layers.map(el => el.dataset.reelLayer), chapters);
  for (const key of chapters) {
    assert.ok(reel.querySelector(`#work-${key} a[href*="projects/${key}/"]`), `${key} links to its case study`);
    assert.equal(reel.querySelectorAll(`[data-reel-jump="${key}"]`).length, 2);
  }

  const query = '(min-width: 980px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)';
  // Starts stacked (no sticky screen): the viewer sits inline in its chapter.
  assert.equal(reel.hasAttribute('data-reel-enhanced'), false);
  assert.ok(viewer()[0].closest('[data-showcase-slot="inline"]'));

  media.get(query).change(true);
  assert.ok(reel.hasAttribute('data-reel-enhanced'));
  assert.ok(viewer()[0].closest('[data-showcase-slot="stage"]'));
  assert.equal(viewer().length, 1);
  // Exactly one scene is shown; the others cannot take keyboard focus.
  const shown = layers.filter(layer => layer.dataset.active === 'true');
  assert.equal(shown.length, 1);
  layers.forEach(layer => assert.equal(layer.hasAttribute('inert'), layer !== shown[0]));
  assert.equal(reel.querySelector(`[data-reel-jump="${shown[0].dataset.reelLayer}"][aria-current="location"]`) !== null, true);

  media.get(query).change(false);
  assert.equal(reel.hasAttribute('data-reel-enhanced'), false);
  assert.ok(viewer()[0].closest('[data-showcase-slot="inline"]'));
  layers.forEach(layer => assert.equal(layer.hasAttribute('inert'), false));
});

test('Teaching timeline lists dated activities without inventing years and links to the full record', () => {
  const { document } = load('index.html');
  const timeline = document.querySelector('#educator [data-edu-timeline]');
  const entries = [...timeline.querySelectorAll('[data-timeline-entry]')];
  assert.equal(entries.length, 5);
  assert.deepEqual(entries.map(e => e.dataset.timelineEntry), ['2026', '2026', '2025', 'KOSSMI', 'MAN IC']);
  assert.equal(timeline.querySelector('[data-timeline-current]').textContent, '2026');
  assert.ok(entries[0].classList.contains('is-current'));
  assert.ok(timeline.querySelector('a[href*="/profil/"]'));
});
