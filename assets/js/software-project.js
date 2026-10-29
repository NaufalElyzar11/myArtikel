(() => {
  'use strict';
  const walkthrough = document.querySelector('[data-walkthrough]');
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
  if (!walkthrough) return;
  const scenes = [...walkthrough.querySelectorAll('[data-scene]')];
  const steps = [...walkthrough.querySelectorAll('[data-preview-step]')];
  const previous = walkthrough.querySelector('[data-preview-prev]');
  const next = walkthrough.querySelector('[data-preview-next]');
  const play = walkthrough.querySelector('[data-preview-play]');
  const status = walkthrough.querySelector('[data-preview-status]');
  const controls = walkthrough.querySelector('.walkthrough__controls');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let timer = null;
  let playing = false;
  const t = key => window.siteI18n.t(key);

  function render() {
    scenes.forEach((scene, index) => {
      scene.hidden = index !== current;
      scene.classList.toggle('is-entering', index === current && !reducedMotion.matches);
    });
    steps.forEach((button, index) => button.setAttribute('aria-pressed', String(index === current)));
    previous.disabled = current === 0;
    next.disabled = current === scenes.length - 1;
    play.textContent = t(playing ? 'sw.ui.pause' : reducedMotion.matches ? 'sw.ui.playReduced' : 'sw.ui.play');
    play.setAttribute('aria-pressed', String(playing));
    status.textContent = `${t('sw.ui.step')} ${current + 1} / ${scenes.length}: ${scenes[current].querySelector('.walkthrough__copy h3').textContent}`;
  }

  function stop() {
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
    playing = false;
    render();
  }

  function schedule() {
    // Playback is finite and starts only after the visitor explicitly chooses it.
    timer = window.setTimeout(() => {
      timer = null;
      if (!playing) return;
      if (current >= scenes.length - 1) { stop(); return; }
      current++;
      render();
      schedule();
    }, 4500);
  }

  function select(index) {
    stop();
    current = Math.max(0, Math.min(scenes.length - 1, index));
    render();
  }

  previous.addEventListener('click', () => select(current - 1));
  next.addEventListener('click', () => select(current + 1));
  steps.forEach((button, index) => button.addEventListener('click', () => select(index)));
  walkthrough.querySelectorAll('.gallery__item').forEach(link => link.addEventListener('click', stop));
  play.addEventListener('click', () => {
    if (playing) { stop(); return; }
    if (current === scenes.length - 1) current = 0;
    playing = true;
    render();
    schedule();
  });
  walkthrough.addEventListener('keydown', event => {
    if (!event.target.closest('.walkthrough__controls')) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Escape') { stop(); return; }
    select(event.key === 'Home' ? 0 : event.key === 'End' ? scenes.length - 1 : current + (event.key === 'ArrowRight' ? 1 : -1));
    steps[current].focus();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);
  reducedMotion.addEventListener('change', stop);
  document.addEventListener('languagechange', render);
  if ('IntersectionObserver' in window) {
    new window.IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) stop();
    }).observe(walkthrough);
  }
  controls.hidden = false;
  render();
})();
