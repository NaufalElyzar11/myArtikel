// Site-wide enhancements shared by every page:
// 1. Cross-document View Transitions that morph a project cover into the
//    project page (and back), on browsers that support them.
// 2. A command palette (Ctrl/Cmd + K or "/") for jumping to pages, projects,
//    and common actions.
// Loaded first in <head> (right after the charset, before any stylesheet)
// without defer, so the pagereveal listener exists before the first render.
// Everything touching the DOM waits for it.
(() => {
  'use strict';
  const scriptSrc = document.currentScript?.src;
  const root = (() => {
    try { return new URL('../../', scriptSrc || location.href); } catch { return null; }
  })();
  const t = key => window.siteI18n?.t(key) ?? window.siteTranslations?.[key]?.id ?? key;
  const lang = () => (window.siteI18n?.language === 'en' ? 'en' : 'id');
  const reducedMotion = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const pathOf = href => {
    try { return new URL(href, location.href).pathname.replace(/index\.html$/, ''); } catch { return ''; }
  };

  /* ---------- View transitions ---------- */
  const COVER = 'project-cover';
  const isProjectPage = () => /\/projects\/[^/]+\/(?:index\.html)?$/.test(location.pathname);
  const visible = el => {
    if (!el || typeof el.getBoundingClientRect !== 'function') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < (window.innerHeight || 0);
  };
  const heroImage = () => document.querySelector('.hero__media img, .actual-capture img, main img');
  // The visible cover image for a link: its card, or for a reel chapter the
  // matching scene on the sticky screen.
  const coverFor = link => {
    const card = link?.closest('.work-card, .showcase, [data-reel-beat]');
    if (!card) return null;
    const scopes = [card];
    const beat = card.dataset?.reelBeat;
    if (beat) scopes.push(document.querySelector(`[data-reel-layer="${beat}"]`));
    for (const scope of scopes) {
      const img = scope && [...scope.querySelectorAll('img')].find(visible);
      if (img) return img;
    }
    return null;
  };
  const cardImageFor = href => {
    const target = pathOf(href);
    for (const link of document.querySelectorAll('a[href]')) {
      if (pathOf(link.href) !== target) continue;
      const img = coverFor(link);
      if (img) return img;
    }
    return null;
  };
  const quiet = promise => promise?.catch?.(() => {});
  const nameFor = (img, transition) => {
    // A skipped transition rejects these promises; that is expected, not an error.
    quiet(transition.ready);
    quiet(transition.updateCallbackDone);
    if (!img || !visible(img)) return;
    img.style.viewTransitionName = COVER;
    const reset = () => { img.style.viewTransitionName = ''; };
    transition.finished.then(reset, reset);
  };
  let clickedCover = null;
  document.addEventListener('click', event => {
    clickedCover = coverFor(event.target.closest?.('a[href]'));
  }, true);
  window.addEventListener('pageswap', event => {
    if (!event.viewTransition) return;
    quiet(event.viewTransition.ready);
    quiet(event.viewTransition.finished);
    const to = event.activation?.entry?.url;
    if (!to) return;
    if (isProjectPage()) nameFor(heroImage(), event.viewTransition);
    else nameFor(clickedCover || cardImageFor(to), event.viewTransition);
  });
  window.addEventListener('pagereveal', event => {
    if (!event.viewTransition) return;
    quiet(event.viewTransition.ready);
    quiet(event.viewTransition.finished);
    const from = window.navigation?.activation?.from?.url;
    if (!from) return;
    if (isProjectPage()) nameFor(heroImage(), event.viewTransition);
    else nameFor(cardImageFor(from), event.viewTransition);
  });

  /* ---------- Command palette ---------- */
  const projects = [
    ['cetakin', 'CetakIn', 'compact.kind.Usaha & web', 'javascript canvas express node 3d printing'],
    ['pkl-kominfo', 'Sistem Cuti Kominfo', 'compact.kind.Aplikasi web', 'laravel php mysql tailwind si-cuti'],
    ['banua-tour', 'Banua-Tour', 'compact.kind.Aplikasi web', 'codeigniter php mysql'],
    ['cloud-manager', 'Cloud Resource Manager', 'compact.kind.Cloud & backend', 'laravel php mysql docker'],
    ['myanimerent', 'MyAnimeRent', 'compact.kind.Aplikasi Flutter', 'flutter dart firebase'],
    ['e-ponic', 'E-Ponic', 'compact.kind.Aplikasi Flutter', 'flutter dart firebase firestore'],
    ['mangrovepreneurs', 'Mangrovepreneurs', 'compact.kind.IoT & Flutter', 'esp32 flutter firebase hx711 bme280'],
    ['hexaka', 'Hexaka V3', 'compact.kind.Robotika', 'hexapod python ros2 opencv yolo dynamixel raspberry'],
    ['mrc', 'TRACO-BOT', 'compact.kind.Robotika & visi komputer', 'opencv python esp32 arduino c++'],
    ['amd', 'PRONE.ID', 'compact.kind.Drone & IoT', 'drone raspberry pi python arduino javascript'],
    ['aac', 'AAC: Bicara Warna', 'compact.kind.Teknologi asistif', 'arduino dfplayer 3d print'],
    ['teksif', 'TekSif: Chromoney', 'compact.kind.Teknologi asistif', 'arduino color sensor']
  ];
  const homeSections = [['cmd.home', 'home'], ['cmd.projects', 'projects'], ['cmd.skills', 'skills'],
    ['cmd.educator', 'educator'], ['cmd.contact', 'contact']];
  const withLang = path => {
    const url = new URL(path, root || location.href);
    url.searchParams.set('lang', lang());
    return url;
  };
  const onHome = () => root && pathOf(location.href) === pathOf(root.href);

  function buildItems() {
    const pages = homeSections.map(([key, id]) => ({
      group: 'pages', label: t(key), meta: '#' + id, run: () => goSection(id)
    }));
    pages.push({ group: 'pages', label: t('cmd.profile'), meta: '/profil', run: () => go(withLang('profil/')) });
    pages.push({ group: 'pages', label: t('cmd.archive'), meta: '/projects', run: () => go(withLang('projects/')) });
    const work = projects.map(([slug, name, kindKey, tags]) => ({
      group: 'projects', label: name, meta: t(kindKey), tags, run: () => go(withLang(`projects/${slug}/`))
    }));
    const actions = [
      { group: 'actions', label: t('cmd.lang'), meta: lang() === 'id' ? 'EN' : 'ID', tags: 'language bahasa english indonesia',
        run: () => { close(); window.siteI18n?.setLanguage(lang() === 'id' ? 'en' : 'id', true); } },
      { group: 'actions', label: t('cmd.copy'), meta: 'nelyzar8@gmail.com', tags: 'email kontak contact', keepOpen: true, run: copyEmail },
      { group: 'actions', label: t('cmd.cv'), meta: 'JPG', tags: 'resume curriculum vitae',
        run: () => open_(new URL('assets/images/profile/My%20CV.jpg', root || location.href)) },
      { group: 'actions', label: t('cmd.github'), meta: '@NaufalElyzar11', tags: 'code repo source',
        run: () => open_('https://github.com/NaufalElyzar11') },
      { group: 'actions', label: t('cmd.linkedin'), meta: 'Naufal Elyzar', tags: 'profile kerja work',
        run: () => open_('https://www.linkedin.com/in/naufal-elyzar-8b8764296/') }
    ];
    return [...pages, ...work, ...actions];
  }

  function go(url) { close(); location.href = String(url); }
  function open_(url) { close(); window.open(String(url), '_blank', 'noopener'); }
  function goSection(id) {
    if (!onHome()) { go(withLang('./') + '#' + id); return; }
    close();
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    try { history.replaceState(history.state, '', '#' + id); } catch { /* ignore */ }
  }
  async function copyEmail() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('unavailable');
      await navigator.clipboard.writeText('nelyzar8@gmail.com');
      announce(t('cmd.copied'));
      window.setTimeout(close, 900);
    } catch {
      announce(t('cmd.copyFailed'));
    }
  }

  let dialog, input, list, live, items = [], results = [], active = 0, trigger;

  function score(item, terms) {
    const label = item.label.toLowerCase();
    const hay = `${label} ${String(item.meta).toLowerCase()} ${item.tags || ''}`;
    let total = 0;
    for (const term of terms) {
      if (label.startsWith(term)) total += 3;
      else if (label.includes(term)) total += 2;
      else if (hay.includes(term)) total += 1;
      else return 0;
    }
    return total;
  }

  function renderList() {
    const terms = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    results = terms.length
      ? items.map(item => [item, score(item, terms)]).filter(([, s]) => s > 0)
        .sort((a, b) => b[1] - a[1]).map(([item]) => item)
      : items;
    active = Math.min(active, Math.max(results.length - 1, 0));
    list.replaceChildren();
    if (!results.length) {
      const empty = document.createElement('p');
      empty.className = 'cmd__empty';
      empty.textContent = t('cmd.empty');
      list.append(empty);
      input.removeAttribute('aria-activedescendant');
      return;
    }
    const groups = terms.length ? [['results', results]] : ['pages', 'projects', 'actions']
      .map(group => [group, results.filter(item => item.group === group)]);
    let index = 0;
    for (const [group, entries] of groups) {
      const wrap = document.createElement('div');
      wrap.setAttribute('role', 'group');
      if (group !== 'results') {
        const heading = document.createElement('div');
        heading.className = 'cmd__group';
        heading.id = `cmd-group-${group}`;
        heading.textContent = t(`cmd.group.${group}`);
        heading.setAttribute('role', 'presentation');
        wrap.setAttribute('aria-labelledby', heading.id);
        wrap.append(heading);
      }
      for (const item of entries) {
        const i = index++;
        const option = document.createElement('div');
        option.className = 'cmd__item';
        option.id = `cmd-option-${i}`;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', String(i === active));
        const label = document.createElement('span');
        label.className = 'cmd__label';
        label.textContent = item.label;
        const meta = document.createElement('span');
        meta.className = 'cmd__meta';
        meta.textContent = item.meta;
        option.append(label, meta);
        option.addEventListener('pointermove', () => { if (active !== i) setActive(i); });
        option.addEventListener('click', () => results[i]?.run());
        wrap.append(option);
      }
      list.append(wrap);
    }
    setActive(active, false);
  }

  function setActive(i, scroll = true) {
    active = i;
    list.querySelectorAll('[role="option"]').forEach((option, n) => {
      option.setAttribute('aria-selected', String(n === i));
      if (n === i) {
        input.setAttribute('aria-activedescendant', option.id);
        if (scroll) option.scrollIntoView?.({ block: 'nearest' });
      }
    });
  }

  function announce(text) { if (live) live.textContent = text; }

  function kbd(text) {
    const el = document.createElement('kbd');
    el.textContent = text;
    return el;
  }

  function build() {
    dialog = document.createElement('dialog');
    dialog.className = 'cmd';
    dialog.setAttribute('aria-label', t('cmd.label'));
    const box = document.createElement('div');
    box.className = 'cmd__box';
    const field = document.createElement('div');
    field.className = 'cmd__field';
    field.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
    input = document.createElement('input');
    input.type = 'text';
    input.className = 'cmd__input';
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-expanded', 'true');
    input.setAttribute('aria-controls', 'cmd-list');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('spellcheck', 'false');
    field.append(input, kbd('Esc'));
    list = document.createElement('div');
    list.id = 'cmd-list';
    list.className = 'cmd__list';
    list.setAttribute('role', 'listbox');
    const footer = document.createElement('div');
    footer.className = 'cmd__footer';
    live = document.createElement('span');
    live.className = 'cmd__live';
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    const hints = document.createElement('span');
    hints.className = 'cmd__hints';
    hints.setAttribute('aria-hidden', 'true');
    footer.append(live, hints);
    box.append(field, list, footer);
    dialog.append(box);
    document.body.append(dialog);

    input.addEventListener('input', () => { active = 0; renderList(); });
    input.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!results.length) return;
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setActive((active + step + results.length) % results.length);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        results[active]?.run();
      }
    });
    dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
    dialog.addEventListener('close', () => { trigger?.setAttribute('aria-expanded', 'false'); });
  }

  function open() {
    if (!dialog) build();
    dialog.setAttribute('aria-label', t('cmd.label'));
    input.setAttribute('placeholder', t('cmd.placeholder'));
    input.setAttribute('aria-label', t('cmd.placeholder'));
    const hints = dialog.querySelector('.cmd__hints');
    hints.replaceChildren(kbd('↑↓'), ` ${t('cmd.navigate')}  `, kbd('Enter'), ` ${t('cmd.enter')}  `, kbd('Esc'), ` ${t('cmd.close')}`);
    announce('');
    items = buildItems();
    input.value = '';
    active = 0;
    renderList();
    if (typeof dialog.showModal === 'function') { if (!dialog.open) dialog.showModal(); }
    else dialog.setAttribute('open', '');
    trigger?.setAttribute('aria-expanded', 'true');
    input.focus();
  }

  function close() {
    if (!dialog) return;
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
    trigger?.setAttribute('aria-expanded', 'false');
  }

  const isOpen = () => Boolean(dialog && (dialog.open || dialog.hasAttribute('open')));
  const typing = el => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName || ''));

  document.addEventListener('keydown', event => {
    const key = String(event.key || '').toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === 'k') {
      event.preventDefault();
      if (isOpen()) close(); else open();
    } else if (key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !isOpen() && !typing(event.target)) {
      event.preventDefault();
      open();
    }
  });

  function mountTrigger() {
    const switcher = document.querySelector('.language-switch');
    if (!switcher || document.querySelector('.cmd-trigger')) return;
    trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'cmd-trigger';
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-keyshortcuts', 'Control+K Meta+K');
    const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
    trigger.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
    const hint = kbd(mac ? '⌘K' : 'Ctrl K');
    hint.setAttribute('aria-hidden', 'true');
    trigger.append(hint);
    const label = () => trigger.setAttribute('aria-label', t('cmd.open'));
    label();
    document.addEventListener('languagechange', label);
    trigger.addEventListener('click', open);
    switcher.before(trigger);
  }

  window.siteCommand = { open, close, get isOpen() { return isOpen(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountTrigger);
  else mountTrigger();
})();
