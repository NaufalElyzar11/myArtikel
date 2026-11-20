(() => {
  'use strict';

  const lab = document.querySelector('.hero-lab');
  if (!lab) return;

  const tabs = [...lab.querySelectorAll('[data-lab-tab]')];
  const panels = [...lab.querySelectorAll('[data-lab-panel]')];
  const hexPanel = lab.querySelector('#lab-panel-hexapod');
  if (!hexPanel) return;

  const viewport = hexPanel.querySelector('#hexapod-view');
  const stage = hexPanel.querySelector('#hexapod-canvas');
  const poster = hexPanel.querySelector('#hexapod-poster');
  const stateBanner = hexPanel.querySelector('#hexapod-state');
  const stateText = hexPanel.querySelector('#hexapod-state-text');

  const motionBtns = [...hexPanel.querySelectorAll('[data-hex-move]')];
  const slopeInput = hexPanel.querySelector('#hexapod-slope');
  const slopeVal = hexPanel.querySelector('#hexapod-slope-val');
  const explodeBtn = hexPanel.querySelector('#hexapod-explode');
  const resetBtn = hexPanel.querySelector('#hexapod-reset');
  const internalsBar = hexPanel.querySelector('#hexapod-internals');

  const pidReadout = hexPanel.querySelector('#hexapod-pid-val');
  const gaitReadout = hexPanel.querySelector('#hexapod-gait-val');
  const modeReadout = hexPanel.querySelector('#hexapod-motion-val');

  const kinematics = window.HexapodKinematics;
  const motionVectors = {
    forward: { vx: 1, omega: 0 },
    backward: { vx: -1, omega: 0 },
    left: { vx: 0, omega: 1 },
    right: { vx: 0, omega: -1 },
    stop: { vx: 0, omega: 0 }
  };

  const motionLabels = {
    forward: 'home.hexapod.dirForward',
    backward: 'home.hexapod.dirBackward',
    left: 'home.hexapod.dirLeft',
    right: 'home.hexapod.dirRight',
    stop: 'home.hexapod.dirStop'
  };

  const state = {
    activeTab: 'hexapod',
    motion: 'stop',
    slopeDeg: Number(slopeInput?.value || 0),
    exploded: false,
    sceneStatus: 'idle'
  };

  let sceneCtrl = null;
  let sceneBooted = false;
  let activeKeyMove = null;
  const reducedQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');

  function t(key) {
    return window.siteI18n?.t(key) ?? key;
  }

  function updateTelemetry() {
    if (!kinematics) return;
    const tel = kinematics.computeTelemetry(state.slopeDeg);
    if (slopeVal) slopeVal.textContent = `${tel.slopeDeg}°`;
    if (pidReadout) pidReadout.textContent = `${tel.pidCorrectionDeg.toFixed(1)}° PID`;
    if (gaitReadout) gaitReadout.textContent = tel.gaitLabel;
    if (modeReadout) modeReadout.textContent = t(motionLabels[state.motion]);
    hexPanel.toggleAttribute('data-interlock', tel.interlock);
  }

  function updateStatusBanner() {
    if (!stateBanner || !stateText) return;
    if (state.sceneStatus === 'ready' || state.sceneStatus === 'idle') {
      stateBanner.hidden = true;
      return;
    }
    stateBanner.hidden = false;
    stateBanner.dataset.state = state.sceneStatus;
    if (state.sceneStatus === 'loading') {
      stateText.textContent = t('home.hexapod.loading');
    } else if (state.sceneStatus === 'file-protocol') {
      stateText.textContent = t('home.hexapod.fileProtocol');
    } else if (state.sceneStatus === 'load-error') {
      stateText.textContent = t('home.hexapod.loadError');
    } else {
      stateText.textContent = t('home.hexapod.fallback');
    }
  }

  function setMotion(nextMove) {
    if (!motionVectors[nextMove]) return;
    state.motion = nextMove;
    motionBtns.forEach(btn => {
      btn.setAttribute('aria-pressed', String(btn.dataset.hexMove === nextMove));
    });
    const vec = motionVectors[nextMove];
    sceneCtrl?.setMotion(vec.vx, vec.omega);
    updateTelemetry();
  }

  function setSlope(deg) {
    state.slopeDeg = Math.max(0, Math.min(22, Number(deg) || 0));
    if (slopeInput && Number(slopeInput.value) !== state.slopeDeg) {
      slopeInput.value = String(state.slopeDeg);
    }
    sceneCtrl?.setSlope(state.slopeDeg);
    updateTelemetry();
  }

  function setExploded(exploded) {
    state.exploded = Boolean(exploded);
    explodeBtn?.setAttribute('aria-pressed', String(state.exploded));
    if (internalsBar) internalsBar.hidden = !state.exploded;
    sceneCtrl?.setExploded(state.exploded);
  }

  function selectTab(targetId, moveFocus = false) {
    state.activeTab = targetId;
    tabs.forEach(tab => {
      const selected = tab.dataset.labTab === targetId;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && moveFocus) tab.focus();
    });
    panels.forEach(panel => {
      panel.hidden = panel.dataset.labPanel !== targetId;
    });
    sceneCtrl?.setActive(targetId === 'hexapod');
    if (targetId === 'hexapod') bootScene();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab.dataset.labTab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let nextIdx = index;
      if (event.key === 'ArrowRight') nextIdx = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') nextIdx = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') nextIdx = 0;
      else if (event.key === 'End') nextIdx = tabs.length - 1;
      selectTab(tabs[nextIdx].dataset.labTab, true);
    });
  });

  motionBtns.forEach(btn => {
    btn.addEventListener('click', () => setMotion(btn.dataset.hexMove));
  });

  slopeInput?.addEventListener('input', () => setSlope(slopeInput.value));
  explodeBtn?.addEventListener('click', () => setExploded(!state.exploded));
  resetBtn?.addEventListener('click', () => sceneCtrl?.resetCamera());

  // Keyboard drive bindings scoped only to the focused 3D canvas container
  stage?.addEventListener('keydown', event => {
    const keyMap = {
      KeyW: 'forward',
      ArrowUp: 'forward',
      KeyS: 'backward',
      ArrowDown: 'backward',
      KeyA: 'left',
      ArrowLeft: 'left',
      KeyD: 'right',
      ArrowRight: 'right'
    };
    if (event.code === 'Space') {
      event.preventDefault();
      activeKeyMove = null;
      setMotion('stop');
      return;
    }
    const move = keyMap[event.code];
    if (move) {
      event.preventDefault();
      if (activeKeyMove !== move) {
        activeKeyMove = move;
        setMotion(move);
      }
    }
  });

  stage?.addEventListener('keyup', event => {
    const keyMap = {
      KeyW: 'forward',
      ArrowUp: 'forward',
      KeyS: 'backward',
      ArrowDown: 'backward',
      KeyA: 'left',
      ArrowLeft: 'left',
      KeyD: 'right',
      ArrowRight: 'right'
    };
    const released = keyMap[event.code];
    if (released && activeKeyMove === released) {
      activeKeyMove = null;
      setMotion('stop');
    }
  });

  function hasWebGL() {
    if (typeof window.WebGLRenderingContext === 'undefined') return false;
    try {
      const probe = document.createElement('canvas');
      const ctx = probe.getContext('webgl2') || probe.getContext('webgl') || probe.getContext('experimental-webgl');
      if (!ctx) return false;
      ctx.getExtension('WEBGL_lose_context')?.loseContext();
      return true;
    } catch {
      return false;
    }
  }

  async function bootScene() {
    if (sceneBooted || state.activeTab !== 'hexapod' || !stage || !kinematics) return;
    if (typeof window.WebGLRenderingContext === 'undefined') {
      return;
    }
    sceneBooted = true;

    if (window.location?.protocol === 'file:') {
      state.sceneStatus = 'file-protocol';
      updateStatusBanner();
      return;
    }

    if (!hasWebGL()) {
      state.sceneStatus = 'error';
      updateStatusBanner();
      return;
    }

    state.sceneStatus = 'loading';
    updateStatusBanner();

    try {
      const mod = await import('./hexapod-scene.mjs');
      sceneCtrl = await mod.createHexapodScene({
        container: stage,
        kinematics,
        reducedMotion: Boolean(reducedQuery?.matches),
        onReady: () => {
          state.sceneStatus = 'ready';
          if (poster) poster.hidden = true;
          viewport?.setAttribute('data-scene-ready', 'true');
          updateStatusBanner();
          const vec = motionVectors[state.motion];
          sceneCtrl?.setMotion(vec.vx, vec.omega);
          sceneCtrl?.setSlope(state.slopeDeg);
          sceneCtrl?.setExploded(state.exploded);
          sceneCtrl?.setActive(state.activeTab === 'hexapod');
        },
        onError: err => {
          console.warn('[Hexaka 3D]', err);
          state.sceneStatus = 'error';
          updateStatusBanner();
        }
      });
      if (!sceneCtrl) {
        state.sceneStatus = 'error';
        updateStatusBanner();
      }
    } catch (err) {
      console.warn('[Hexaka 3D]', err);
      state.sceneStatus = 'load-error';
      updateStatusBanner();
    }
  }

  if (typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        sceneCtrl?.setVisible(entry.isIntersecting);
      });
    }, { threshold: 0.05 });
    observer.observe(lab);
  }

  document.addEventListener('visibilitychange', () => {
    sceneCtrl?.setVisible(!document.hidden);
  });

  reducedQuery?.addEventListener('change', () => {
    sceneCtrl?.setReducedMotion(Boolean(reducedQuery.matches));
  });

  document.addEventListener('languagechange', () => {
    updateTelemetry();
    updateStatusBanner();
  });

  updateTelemetry();
  setExploded(false);
  setMotion('stop');

  // Defer WebGL initialization slightly so initial static hero paints first.
  if (typeof window.WebGLRenderingContext !== 'undefined') {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => bootScene(), { timeout: 600 });
    } else {
      window.setTimeout(bootScene, 80);
    }
  }
})();
