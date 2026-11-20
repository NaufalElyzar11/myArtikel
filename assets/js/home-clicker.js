(() => {
  'use strict';

  const lab = document.querySelector('.clicker-lab');
  if (!lab) return;

  const input = lab.querySelector('#clicker-text');
  const keysWrap = lab.querySelector('#clicker-keys');
  const previewObject = lab.querySelector('#clicker-object');
  const previewWindow = lab.querySelector('#clicker-window');
  const status = lab.querySelector('#clicker-status');
  const orderLink = lab.querySelector('#clicker-order-link');
  const colorButtons = [...lab.querySelectorAll('.clicker-cetakin__option')];
  const pressTimers = new WeakMap();

  const colorKeys = {
    orange: 'home.clicker.color.orange',
    blue: 'home.clicker.color.blue',
    white: 'home.clicker.color.white',
    black: 'home.clicker.color.black',
    red: 'home.clicker.color.red',
    pink: 'home.clicker.color.pink'
  };

  function t(key) {
    return window.siteI18n?.t(key) ?? key;
  }

  function cleanLetters(value) {
    return value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
  }

  function renderPreview() {
    if (!input || !keysWrap || !previewObject || !previewWindow || !status || !orderLink) return;

    const cleanName = cleanLetters(input.value);
    if (input.value !== cleanName) {
      const caret = cleanLetters(input.value.slice(0, input.selectionStart ?? input.value.length)).length;
      input.value = cleanName;
      input.setSelectionRange?.(caret, caret);
    }

    const chosenColor = colorButtons.find(btn => btn.getAttribute('aria-pressed') === 'true')?.dataset.color || 'orange';
    const colorName = t(colorKeys[chosenColor] || colorKeys.orange).toLowerCase();
    const baseMaterial = chosenColor === 'pink' ? 'PLA' : 'PETG';

    previewWindow.dataset.color = chosenColor;
    lab.dataset.theme = chosenColor;
    keysWrap.replaceChildren();

    if (!cleanName) {
      const placeholder = document.createElement('span');
      placeholder.className = 'clicker-cetakin__key clicker-cetakin__key--placeholder';
      placeholder.textContent = '?';
      placeholder.setAttribute('aria-hidden', 'true');
      keysWrap.appendChild(placeholder);

      previewObject.setAttribute('aria-label', t('home.clicker.emptyAria'));
      status.textContent = t('home.clicker.emptyStatus');
      orderLink.removeAttribute('href');
      orderLink.setAttribute('aria-disabled', 'true');
      orderLink.tabIndex = 0;
      return;
    }

    for (const letter of cleanName) {
      const key = document.createElement('button');
      key.className = 'clicker-cetakin__key';
      key.type = 'button';
      key.textContent = letter;
      key.setAttribute('aria-label', `${t('home.clicker.key')} ${letter}`);
      key.addEventListener('click', () => {
        window.clearTimeout(pressTimers.get(key));
        key.classList.add('pressed');
        key.setAttribute('data-down', '');
        pressTimers.set(key, window.setTimeout(() => {
          key.classList.remove('pressed');
          key.removeAttribute('data-down');
        }, 130));
      });
      keysWrap.appendChild(key);
    }

    const isEn = window.siteI18n?.language === 'en';
    const unit = cleanName.length === 1 ? t('home.clicker.letterUnit') : t('home.clicker.lettersUnit');
    status.textContent = isEn
      ? `${cleanName.length} ${unit} · ${baseMaterial} ${colorName} base`
      : `${cleanName.length} ${unit} · ${t('home.clicker.basePrefix')} ${baseMaterial} ${colorName}`;
    previewObject.setAttribute('aria-label', `${t('home.clicker.previewPrefix')} ${cleanName}, ${baseMaterial} ${colorName}`);

    // Carry the preview directly into CetakIn's live Clicker Lab versioned v2 format.
    const design = [
      2,
      'solid',
      'round',
      chosenColor,
      'nunito',
      1,
      [...cleanName].map(letter => ['l', letter, 'white', 'black']),
      ''
    ];
    orderLink.href = `https://cetak-in.my.id/clicker.html#desain=${encodeURIComponent(JSON.stringify(design))}`;
    orderLink.removeAttribute('aria-disabled');
    orderLink.tabIndex = 0;
  }

  input?.addEventListener('input', renderPreview);
  colorButtons.forEach(button => {
    button.addEventListener('click', () => {
      colorButtons.forEach(opt => opt.setAttribute('aria-pressed', String(opt === button)));
      renderPreview();
    });
  });

  document.addEventListener('languagechange', renderPreview);
  renderPreview();
})();
