// Homepage enhancements: the split-flap role board in the hero and the
// technology-to-project wiring map in Tools & Tech. Both degrade to plain
// readable markup when JavaScript is unavailable.
(() => {
  'use strict';
  const t = key => window.siteI18n?.t(key) ?? key;
  const reducedQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const prefersReduced = () => Boolean(reducedQuery?.matches);

  /* ---------- Split-flap board ---------- */
  const board = document.querySelector('[data-flap-board]');
  if (board) {
    const CELLS = 16;
    const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const HOLD_MS = 2600;
    const STEP_MS = 55;
    const STAGGER_MS = 32;
    let words = [];
    let index = 0;
    let holdTimer = 0;
    let flipTimers = [];
    // Rotation only starts once the board is observed on screen, so
    // environments without IntersectionObserver keep the first word static.
    let inView = false;

    const fallbackWord = board.textContent.trim();
    board.textContent = '';
    const cells = Array.from({ length: CELLS }, () => {
      const cell = document.createElement('span');
      cell.className = 'flap__cell';
      const glyph = document.createElement('span');
      glyph.className = 'flap__glyph';
      cell.append(glyph);
      board.append(cell);
      return glyph;
    });

    const pad = word => word.padEnd(CELLS, ' ').slice(0, CELLS);
    const setGlyph = (glyph, char) => {
      glyph.textContent = char === ' ' ? '' : char;
      glyph.parentElement.classList.toggle('is-blank', char === ' ');
    };
    const showInstant = word => {
      const chars = pad(word);
      cells.forEach((glyph, i) => setGlyph(glyph, chars[i]));
    };
    const clearFlips = () => {
      flipTimers.forEach(id => window.clearTimeout(id));
      flipTimers = [];
    };

    function flipTo(word) {
      clearFlips();
      const chars = pad(word);
      cells.forEach((glyph, i) => {
        const target = chars[i];
        const current = glyph.textContent || ' ';
        if (current === target) return;
        const turns = 2 + Math.floor(Math.random() * 4);
        for (let step = 0; step <= turns; step++) {
          flipTimers.push(window.setTimeout(() => {
            const char = step === turns ? target : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            setGlyph(glyph, char);
            const cell = glyph.parentElement;
            cell.classList.remove('is-flipping');
            void cell.offsetWidth;
            cell.classList.add('is-flipping');
          }, i * STAGGER_MS + step * STEP_MS));
        }
      });
    }

    function schedule() {
      window.clearTimeout(holdTimer);
      if (prefersReduced() || !inView || document.hidden || words.length < 2) return;
      holdTimer = window.setTimeout(() => {
        index = (index + 1) % words.length;
        flipTo(words[index]);
        schedule();
      }, HOLD_MS);
    }

    function loadWords() {
      const raw = String(t('home.flap.words'));
      // A stale cached dictionary returns the key itself; keep the markup word.
      words = (raw === 'home.flap.words' ? fallbackWord : raw).split('|').filter(Boolean);
      index = 0;
      clearFlips();
      showInstant(words[0] || '');
      schedule();
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        inView = entries.some(entry => entry.isIntersecting);
        schedule();
      }).observe(board);
    }
    document.addEventListener('visibilitychange', schedule);
    document.addEventListener('languagechange', loadWords);
    reducedQuery?.addEventListener?.('change', schedule);
    loadWords();
  }

  /* ---------- Skill map ---------- */
  const map = document.querySelector('[data-skill-map]');
  if (!map) return;
  const svg = map.querySelector('[data-skill-wires]');
  const groupsEl = map.querySelector('.skill-map__groups');
  const status = map.querySelector('[data-skill-status]');
  const chips = [...map.querySelectorAll('.skill-chip')];
  const rows = [...map.querySelectorAll('[data-project]')];
  const rowBySlug = new Map(rows.map(row => [row.dataset.project, row]));
  const linksOf = chip => (chip.dataset.links || '').split(/\s+/).filter(Boolean);
  const SVG_NS = 'http://www.w3.org/2000/svg';
  let locked = chips.find(chip => chip.textContent.trim() === 'Laravel') || chips[0];
  let preview = null;
  let animateNext = true;

  const nameOf = row => row.querySelector('.skill-map__name')?.textContent.trim() || '';
  const fill = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => values[key]);

  function currentPairs() {
    const source = preview || locked;
    if (!source) return { pairs: [], text: '' };
    if (source.classList.contains('skill-chip')) {
      const linked = linksOf(source).map(slug => rowBySlug.get(slug)).filter(Boolean);
      const key = linked.length === 1 ? 'skills.map.statusOne' : 'skills.map.status';
      return {
        pairs: linked.map(row => [source, row]),
        text: fill(t(key), { tech: source.textContent.trim(), n: linked.length })
      };
    }
    const slug = source.dataset.project;
    const using = chips.filter(chip => linksOf(chip).includes(slug));
    return {
      pairs: using.map(chip => [chip, source]),
      text: fill(t('skills.map.reverse'), { project: nameOf(source), n: using.length })
    };
  }

  function wiresVisible() {
    return Boolean(svg) && typeof svg.getBoundingClientRect === 'function'
      && window.getComputedStyle?.(svg).display !== 'none';
  }

  function drawWires(pairs) {
    if (!wiresVisible()) return;
    const box = map.getBoundingClientRect();
    if (!box.width) return;
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    svg.replaceChildren();
    const portX = groupsEl.getBoundingClientRect().right - box.left + 14;
    pairs.forEach(([chip, row], i) => {
      const c = chip.getBoundingClientRect();
      const r = row.getBoundingClientRect();
      // Leave from the chip itself, run behind the opaque chips to its right,
      // then curve across the gutter into the project's port.
      const x1 = c.right - box.left;
      const y1 = c.top + c.height / 2 - box.top;
      const x2 = r.left - box.left - 10;
      const y2 = r.top + r.height / 2 - box.top;
      const mid = (portX + x2) / 2;
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', `M ${x1} ${y1} H ${portX} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`);
      path.setAttribute('pathLength', '1');
      path.setAttribute('class', `skill-map__wire${animateNext ? ' is-drawing' : ''}`);
      path.style.setProperty('--i', i);
      svg.append(path);
      for (const [x, y] of [[portX, y1], [x2, y2]]) {
        const port = document.createElementNS(SVG_NS, 'circle');
        port.setAttribute('cx', x);
        port.setAttribute('cy', y);
        port.setAttribute('r', '3.5');
        port.setAttribute('class', 'skill-map__port');
        svg.append(port);
      }
    });
    animateNext = true;
  }

  function render() {
    const { pairs, text } = currentPairs();
    const activeChips = new Set(pairs.map(([chip]) => chip));
    const activeRows = new Set(pairs.map(([, row]) => row));
    const hasSelection = pairs.length > 0;
    map.classList.toggle('has-selection', hasSelection);
    chips.forEach(chip => {
      chip.setAttribute('aria-pressed', String(chip === locked));
      chip.classList.toggle('is-linked', activeChips.has(chip));
    });
    rows.forEach(row => row.classList.toggle('is-linked', activeRows.has(row)));
    if (status) status.textContent = text;
    drawWires(pairs);
  }

  const canHover = window.matchMedia?.('(hover: hover) and (pointer: fine)');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      locked = locked === chip ? null : chip;
      preview = null;
      render();
    });
    chip.addEventListener('pointerenter', () => {
      if (!canHover?.matches) return;
      preview = chip;
      render();
    });
    chip.addEventListener('focus', () => { preview = chip; render(); });
  });
  rows.forEach(row => {
    const link = row.querySelector('a');
    row.addEventListener('pointerenter', () => {
      if (!canHover?.matches) return;
      preview = row;
      render();
    });
    link?.addEventListener('focus', () => { preview = row; render(); });
  });
  const endPreview = () => {
    if (!preview) return;
    preview = null;
    render();
  };
  map.addEventListener('pointerleave', endPreview);
  map.addEventListener('focusout', event => {
    if (!map.contains(event.relatedTarget)) endPreview();
  });
  [groupsEl, map.querySelector('.skill-map__projects')].forEach(area => {
    area?.addEventListener('pointerleave', endPreview);
  });

  const redraw = () => { animateNext = false; render(); };
  if ('ResizeObserver' in window) new ResizeObserver(redraw).observe(map);
  else window.addEventListener('resize', redraw);
  document.addEventListener('languagechange', redraw);
  document.fonts?.ready?.then(redraw);
  render();
})();
