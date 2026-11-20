// Selected work reel and teaching timeline on the homepage.
// Without JavaScript both read as ordinary stacked content.
(() => {
  'use strict';
  const hasLayout = el => el && typeof el.getBoundingClientRect === 'function';

  /* ---------- Project reel ---------- */
  const reel = document.querySelector('[data-project-reel]');
  const layout = reel?.querySelector('[data-reel-layout]');
  const sticky = reel?.querySelector('[data-reel-sticky]');
  if (reel && layout && sticky) {
    const beats = [...layout.querySelectorAll('[data-reel-beat]')];
    const layers = [...sticky.querySelectorAll('[data-reel-layer]')];
    const number = sticky.querySelector('[data-reel-number]');
    const jumps = [...reel.querySelectorAll('[data-reel-jump]')];
    const viewer = reel.querySelector('[data-showcase]');
    const slots = {
      stage: reel.querySelector('[data-showcase-slot="stage"]'),
      inline: reel.querySelector('[data-showcase-slot="inline"]')
    };
    const media = window.matchMedia?.('(min-width: 980px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)');
    let frame = 0;
    let active = '';

    function activate(key) {
      if (key === active) return;
      active = key;
      layers.forEach(layer => {
        const on = layer.dataset.reelLayer === key;
        layer.dataset.active = String(on);
        // Hidden scenes must not take keyboard focus (the CetakIn viewer has buttons).
        if (on) layer.removeAttribute('inert'); else layer.setAttribute('inert', '');
      });
      jumps.forEach(jump => {
        if (jump.dataset.reelJump === key) jump.setAttribute('aria-current', 'location');
        else jump.removeAttribute('aria-current');
      });
      if (number) number.textContent = String(Math.max(0, beats.findIndex(b => b.dataset.reelBeat === key)) + 1).padStart(2, '0');
      reel.dataset.reelCurrent = key;
    }

    function update() {
      frame = 0;
      if (!media?.matches || !hasLayout(layout)) return;
      const bounds = layout.getBoundingClientRect();
      if (bounds.top > window.innerHeight + 100 || bounds.bottom < -100) return;
      // A reading line in the upper third picks the chapter in both scroll
      // directions and after anchor jumps.
      const readingLine = window.innerHeight * .35;
      let selected = beats[0];
      let selectedBounds = selected.getBoundingClientRect();
      for (const beat of beats.slice(1)) {
        const beatBounds = beat.getBoundingClientRect();
        if (beatBounds.top > readingLine) break;
        selected = beat;
        selectedBounds = beatBounds;
      }
      activate(selected.dataset.reelBeat);
      const progress = Math.max(0, Math.min(1, (readingLine - selectedBounds.top) / Math.max(1, selectedBounds.height)));
      reel.style.setProperty('--reel-progress', progress.toFixed(3));
    }

    function schedule() {
      if (media?.matches && !frame) frame = requestAnimationFrame(update);
    }

    function applyLayout() {
      const enhanced = Boolean(media?.matches);
      reel.toggleAttribute('data-reel-enhanced', enhanced);
      // One CetakIn viewer: on the sticky screen when enhanced, inline otherwise.
      const target = enhanced ? slots.stage : slots.inline;
      if (viewer && target && viewer.parentElement !== target) target.append(viewer);
      if (!enhanced) {
        if (frame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame);
        frame = 0;
        active = '';
        layers.forEach(layer => layer.removeAttribute('inert'));
        jumps.forEach(jump => jump.removeAttribute('aria-current'));
        reel.removeAttribute('data-reel-current');
        reel.style.removeProperty('--reel-progress');
        return;
      }
      activate(active || beats[0]?.dataset.reelBeat || '');
      schedule();
    }

    media?.addEventListener?.('change', applyLayout);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('pageshow', schedule);
    applyLayout();
  }

  /* ---------- Teaching timeline ---------- */
  const timeline = document.querySelector('[data-edu-timeline]');
  const marker = timeline?.querySelector('[data-timeline-current]');
  const entries = timeline ? [...timeline.querySelectorAll('[data-timeline-entry]')] : [];
  if (timeline && marker && entries.length) {
    let current = entries.find(entry => entry.classList.contains('is-current')) || entries[0];
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!hasLayout(timeline)) return;
      const viewport = window.innerHeight;
      const bounds = timeline.getBoundingClientRect();
      if (bounds.bottom <= 0 || bounds.top >= viewport) return;
      const readLine = viewport * .46;
      let next = entries[0];
      let nearest = Infinity;
      for (const entry of entries) {
        const box = entry.getBoundingClientRect();
        const distance = Math.abs((box.top + box.bottom) / 2 - readLine);
        if (distance < nearest) { nearest = distance; next = entry; }
      }
      if (next === current) return;
      current.classList.remove('is-current');
      next.classList.add('is-current');
      marker.textContent = next.dataset.timelineEntry || '';
      current = next;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    schedule();
  }
})();
