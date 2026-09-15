(() => {
  'use strict';
  const items = [...document.querySelectorAll('.frame, .gallery__item')];
  if (!items.length) return;
  // One implementation for the portfolio and every project page.
  let modal = document.querySelector('.lightbox');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'lightbox';
  }
  modal.innerHTML = '<button class="lightbox__close" type="button">×</button><img alt=""><p class="lightbox__caption" aria-live="polite"></p><div class="lightbox__toolbar"><button class="lightbox__previous" type="button">←</button><span class="lightbox__counter"></span><button class="lightbox__next" type="button">→</button></div>';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-hidden', 'true');
  document.body.append(modal);
  const photo = modal.querySelector('img');
  const caption = modal.querySelector('.lightbox__caption');
  const counter = modal.querySelector('.lightbox__counter');
  const closeButton = modal.querySelector('.lightbox__close');
  const previous = modal.querySelector('.lightbox__previous');
  const next = modal.querySelector('.lightbox__next');
  const t = key => window.siteI18n.t(key);
  let current = 0;
  let returnFocus;
  let previousOverflow;
  let background = [];
  const isOpen = () => modal.classList.contains('open');

  function renderPhoto() {
    const item = items[current];
    photo.src = item.href;
    photo.alt = item.dataset.caption || item.querySelector('img')?.alt || '';
    caption.textContent = photo.alt;
    counter.textContent = `${current + 1} / ${items.length}`;
  }
  function updateLabels() {
    modal.setAttribute('aria-label', t('ui.gallery'));
    closeButton.setAttribute('aria-label', t('ui.close'));
    previous.setAttribute('aria-label', t('ui.previous'));
    next.setAttribute('aria-label', t('ui.next'));
    if (isOpen()) renderPhoto();
  }
  function show(index) {
    current = (index + items.length) % items.length;
    renderPhoto();
  }
  function open(index) {
    returnFocus = document.activeElement;
    previousOverflow = document.body.style.overflow;
    background = [...document.body.children]
      .filter(el => el !== modal && !['SCRIPT', 'STYLE', 'LINK'].includes(el.tagName))
      .map(el => [el, el.inert]);
    background.forEach(([el]) => { el.inert = true; });
    show(index);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeButton.focus();
  }
  function close() {
    if (!isOpen()) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    photo.removeAttribute('src');
    background.forEach(([el, inert]) => { el.inert = inert; });
    document.body.style.overflow = previousOverflow;
    returnFocus?.focus({ preventScroll: true });
  }
  items.forEach((item, index) => item.addEventListener('click', event => {
    event.preventDefault();
    open(index);
  }));
  closeButton.addEventListener('click', close);
  previous.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  modal.addEventListener('click', event => { if (event.target === modal) close(); });
  document.addEventListener('keydown', event => {
    if (!isOpen()) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(current - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); show(current + 1); }
    if (event.key === 'Tab') {
      const buttons = [closeButton, previous, next];
      const at = buttons.indexOf(document.activeElement);
      event.preventDefault();
      buttons[(at + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
    }
  });
  let touchStart;
  photo.addEventListener('touchstart', event => {
    touchStart = event.touches.length === 1 ? [event.touches[0].clientX, event.touches[0].clientY] : null;
  }, { passive: true });
  photo.addEventListener('touchend', event => {
    if (!touchStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart[0];
    const dy = event.changedTouches[0].clientY - touchStart[1];
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });
  document.addEventListener('languagechange', updateLabels);
  updateLabels();
})();
