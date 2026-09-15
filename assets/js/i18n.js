(() => {
  'use strict';
  const dictionary = window.siteTranslations || {};
  const storageKey = 'naufal-language';
  const valid = value => value === 'id' || value === 'en';
  const originals = new Map();
  const textNodes = [...document.querySelectorAll('[data-i18n]')];
  textNodes.forEach(el => originals.set(el, el.innerHTML));
  const attributes = ['alt', 'aria-label', 'data-caption', 'content'];
  let language = 'id';
  const t = key => dictionary[key]?.[language] ?? key;

  const status = document.createElement('span');
  status.className = 'sr-only';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  document.body.append(status);

  function applyLanguage(next, announce = false) {
    if (!valid(next)) return;
    language = next;
    document.documentElement.lang = language;
    textNodes.forEach(el => {
      const entry = dictionary[el.getAttribute('data-i18n')];
      if (!entry) return;
      if (language === 'id') el.innerHTML = originals.get(el);
      else el.textContent = entry.en;
    });
    attributes.forEach(attr => {
      document.querySelectorAll(`[data-i18n-${attr}]`).forEach(el => {
        const key = el.getAttribute(`data-i18n-${attr}`);
        if (dictionary[key]) el.setAttribute(attr, t(key));
      });
    });
    document.querySelectorAll('[data-language]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });
    try { localStorage.setItem(storageKey, language); } catch { /* Storage can be disabled. */ }
    // Carry language across pages even when browser storage is unavailable.
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      try {
        const url = new URL(href, location.href);
        if (url.origin !== location.origin || !/\/$|\.html$/i.test(url.pathname)) return;
        url.searchParams.set('lang', language);
        link.href = url.href;
      } catch { /* Leave non-URL links unchanged. */ }
    });
    try {
      const url = new URL(location.href);
      url.searchParams.set('lang', language);
      history.replaceState(history.state, '', url);
    } catch { /* Local-file previews may restrict history updates. */ }
    document.dispatchEvent(new CustomEvent('languagechange', { detail: { language } }));
    if (announce) status.textContent = t('ui.status');
  }

  window.siteI18n = { t, setLanguage: applyLanguage, get language() { return language; } };
  document.querySelectorAll('[data-language]').forEach(button => {
    button.addEventListener('click', () => applyLanguage(button.dataset.language, true));
  });
  const requested = new URLSearchParams(location.search).get('lang');
  let saved;
  try { saved = localStorage.getItem(storageKey); } catch { /* Default to Indonesian. */ }
  applyLanguage(valid(requested) ? requested : valid(saved) ? saved : 'id');
  document.documentElement.classList.add('i18n-ready');
})();
