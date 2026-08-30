/**
 * Rawabit v2 — Sci-Fi HUD In-Place SVG Node Expansion Map
 * Features:
 * 1. Focus Mode (Click 1): Camera zooms/centers, other paths fade, clicked path glows,
 *    blurred backdrop appears behind target SVG, 3 animated SVG data tethers grow from bbox center,
 *    and 3 sleek floating HUD cards fade in around the shape.
 * 2. Enter Mode (Click 2 on the SAME Wilaya): Smooth transition into domains grid (renderProfiles).
 * 3. Click Outside Reversal: Smoothly retracts tethers, fades cards, fades backdrop,
 *    resets camera zoom, restores all Wilaya paths, and clears active states (0 bug, 100% interactive).
 * Strictly Vanilla JS · 60FPS Hardware Accelerated
 */

import { MAP_VIEWBOX, WILAYAS } from './map-paths.js';
import { getProfilesByWilaya } from '../data/profiles-data.js';
import { store } from '../store.js';
import { t } from '../i18n.js';
import { navigate } from '../router.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Main map renderer
 * @param {HTMLElement} container - The container element to inject the interactive SVG into
 */
export function renderMap(container) {
  if (!container) return;
  container.innerHTML = '';

  // Parse SVG ViewBox dimensions
  const vbParts = MAP_VIEWBOX.split(' ').map(Number);
  const [vbX, vbY, vbW, vbH] = vbParts;
  const vbCenterX = vbX + vbW / 2;
  const vbCenterY = vbY + vbH / 2;

  // ── 1. Create Inline SVG Canvas ──
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', MAP_VIEWBOX);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.classList.add('map-svg');
  svg.setAttribute('role', 'region');
  svg.setAttribute('aria-label', t('map.title'));

  // ── 2. Create the Root Transform Group (GPU Accelerated) ──
  const mapGroup = document.createElementNS(SVG_NS, 'g');
  mapGroup.setAttribute('id', 'map-group');
  svg.appendChild(mapGroup);

  // ── 3. Hover Tether Layer (Active during standard cursor hover) ──
  const tetherLayer = document.createElementNS(SVG_NS, 'svg');
  tetherLayer.setAttribute('id', 'tether-layer');
  tetherLayer.setAttribute('style', 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 30; overflow: visible; opacity: 0; transition: opacity 0.2s ease;');
  tetherLayer.innerHTML = `
    <line id="tether-line" stroke="#FFFFFF" stroke-width="2"/>
    <circle id="tether-dot" r="5" fill="#FFFFFF" stroke="#00875A" stroke-width="1.5"/>
  `;
  container.appendChild(tetherLayer);

  const tetherLine = tetherLayer.querySelector('#tether-line');
  const tetherDot = tetherLayer.querySelector('#tether-dot');

  // ── 4. Floating Wilaya Hover Tooltip ──
  const wilayaTooltip = document.createElement('div');
  wilayaTooltip.setAttribute('id', 'wilaya-tooltip');
  wilayaTooltip.setAttribute('style', 'position: absolute; opacity: 0; pointer-events: none; z-index: 35; background: #fff; padding: 10px 20px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); font-weight: bold; font-family: "Tajawal", sans-serif; color: #111; border: 1px solid rgba(0,135,90,0.2); transition: opacity 0.2s ease; white-space: nowrap;');
  container.appendChild(wilayaTooltip);

  // ── 5. Sci-Fi HUD Ambient Blurred Backdrop Layer ──
  const hudBackdrop = document.createElement('div');
  hudBackdrop.className = 'map-hud-backdrop';
  hudBackdrop.id = 'map-hud-backdrop';
  container.appendChild(hudBackdrop);

  // ── 6. Sci-Fi HUD Tether Line SVG Layer (z-index: 45) ──
  const hudTetherSvg = document.createElementNS(SVG_NS, 'svg');
  hudTetherSvg.setAttribute('id', 'map-hud-tether-svg');
  hudTetherSvg.classList.add('map-hud-tether-svg');
  container.appendChild(hudTetherSvg);

  // ── 7. Sci-Fi HUD Floating Cards Container (z-index: 50) ──
  const hudCardsLayer = document.createElement('div');
  hudCardsLayer.className = 'map-hud-cards-layer';
  hudCardsLayer.id = 'map-hud-cards-layer';
  container.appendChild(hudCardsLayer);

  // ── 8. Floating Wilaya Search Bar directly above Interactive SVG Map ──
  const searchBarWrap = document.createElement('div');
  searchBarWrap.className = 'map-floating-search-bar';
  searchBarWrap.id = 'map-floating-search-bar';
  searchBarWrap.innerHTML = `
    <div class="map-search-box">
      <div class="map-search-icon">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>
      <input 
        type="text" 
        class="map-search-input" 
        id="map-wilaya-search-input"
        placeholder="${t('map.searchPlaceholder')}"
        data-i18n-placeholder="map.searchPlaceholder"
        autocomplete="off"
      />
      <button class="map-search-clear-btn" id="map-search-clear" style="display: none;" aria-label="Clear">
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
    <div class="map-search-dropdown" id="map-search-dropdown" style="display: none;"></div>
  `;
  container.appendChild(searchBarWrap);

  // ── 9. Create Floating Map Controls ──
  const controls = document.createElement('div');
  controls.className = 'map-controls';
  controls.innerHTML = `
    <button class="map-ctrl-btn" id="map-zoom-in" title="Zoom In" aria-label="Zoom In">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
    <button class="map-ctrl-btn" id="map-zoom-out" title="Zoom Out" aria-label="Zoom Out">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
    <button class="map-ctrl-btn" id="map-reset-view" title="Reset View" aria-label="Reset View">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
        <path d="M3 3v5h5"></path>
      </svg>
    </button>
  `;
  container.appendChild(controls);

  // ── 10. Status / Nav Hint Badge ──
  const navHint = document.createElement('div');
  navHint.className = 'map-nav-hint';
  navHint.innerHTML = `
    <span class="map-nav-hint-dot"></span>
    <span id="map-hint-text" data-i18n="map.subtitle">${t('map.subtitle')}</span>
  `;
  container.appendChild(navHint);
  const hintTextEl = navHint.querySelector('#map-hint-text');

  // ── 11. Fade Overlay for Route Transition ──
  const fadeOverlay = document.createElement('div');
  fadeOverlay.className = 'map-fade-overlay';
  fadeOverlay.innerHTML = `
    <div class="loader-dots">
      <span class="loader-dot"></span>
      <span class="loader-dot"></span>
      <span class="loader-dot"></span>
    </div>
  `;
  container.appendChild(fadeOverlay);

  // ── 12. State variables for interactions ──
  const wilayaPaths = [];
  let isTransitioning = false;
  let isHoveringState = false;
  let focusedWilaya = null;
  let focusedPathEl = null;
  let isHudActive = false;

  // ── 13. Tooltip Coordinate Calculation on Hover ──
  function updateTooltipCoords(clientX, clientY) {
    if (!isHoveringState || isTransitioning || isHudActive) return;
    const rect = container.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const tipWidth = wilayaTooltip.offsetWidth || 140;
    const tipHeight = wilayaTooltip.offsetHeight || 44;

    let posX = mouseX + 40;
    let posY = mouseY - 60;

    if (posX + tipWidth > rect.width - 15) {
      posX = mouseX - tipWidth - 40;
    }
    if (posY < 15) {
      posY = mouseY + 30;
    }

    wilayaTooltip.style.left = `${posX}px`;
    wilayaTooltip.style.top = `${posY}px`;

    tetherDot.setAttribute('cx', mouseX);
    tetherDot.setAttribute('cy', mouseY);

    const anchorX = (posX < mouseX) ? posX + tipWidth : posX;
    const anchorY = posY + tipHeight / 2;
    tetherLine.setAttribute('x1', mouseX);
    tetherLine.setAttribute('y1', mouseY);
    tetherLine.setAttribute('x2', anchorX);
    tetherLine.setAttribute('y2', anchorY);
  }

  // ── 14. Render All Wilaya Paths ──
  WILAYAS.forEach(wilaya => {
    const g = document.createElementNS(SVG_NS, 'g');
    g.classList.add('wilaya-group');
    g.setAttribute('data-code', wilaya.code);
    g.setAttribute('data-name', wilaya.name);

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', wilaya.d);
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    path.classList.add('wilaya-path');
    g.appendChild(path);

    mapGroup.appendChild(g);
    wilayaPaths.push({ g, path, wilaya });

    // Hover handler
    path.addEventListener('mouseenter', (e) => {
      if (isTransitioning || isHudActive) return;
      const lang = store.state.lang;
      const displayName = lang === 'ar' 
        ? (wilaya.nameAr || wilaya.name) 
        : (lang === 'en' ? (wilaya.nameEn || wilaya.name) : (wilaya.nameFr || wilaya.name));

      isHoveringState = true;
      wilayaTooltip.textContent = `${wilaya.code} - ${displayName}`;
      wilayaTooltip.style.opacity = '1';
      tetherLayer.style.opacity = '1';
      updateTooltipCoords(e.clientX, e.clientY);
    });

    path.addEventListener('mouseleave', () => {
      if (isHudActive) return;
      isHoveringState = false;
      wilayaTooltip.style.opacity = '0';
      tetherLayer.style.opacity = '0';
    });

    // Path Click Handler: Focus Mode (Click 1) vs Enter Mode (Click 2)
    path.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isTransitioning) return;
      const distance = Math.hypot(e.clientX - pointerStartX, e.clientY - pointerStartY);
      if (distance >= 5) return; // Ignore drag gestures
      handleWilayaClick(wilaya, path);
    });
  });

  container.appendChild(svg);

  // Mousemove for hover tooltip
  container.addEventListener('mousemove', (e) => {
    if (isHoveringState && !isTransitioning && !isHudActive) {
      if (typeof window !== 'undefined' && window.requestAnimationFrame) {
        window.requestAnimationFrame(() => updateTooltipCoords(e.clientX, e.clientY));
      } else {
        updateTooltipCoords(e.clientX, e.clientY);
      }
    }
  });

  // ══════════════════════════════════════════════════════════════
  // PAN & ZOOM CAMERA ENGINE
  // ══════════════════════════════════════════════════════════════
  let scale = 1.0;
  let translateX = 0;
  let translateY = 0;
  const minScale = 1.0;
  const maxScale = 12.0;

  let isDragging = false;
  let lastScreenX = 0;
  let lastScreenY = 0;
  let pointerStartX = 0;
  let pointerStartY = 0;

  function screenToSvgCoords(clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (ctm) {
      return pt.matrixTransform(ctm.inverse());
    }
    return { x: clientX, y: clientY };
  }

  function applyTransform() {
    mapGroup.style.transform = `translate3d(${translateX}px, ${translateY}px, 0px) scale(${scale})`;
  }

  // Pointer dragging
  svg.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || isTransitioning || isHudActive) return;
    isDragging = true;
    pointerStartX = e.clientX;
    pointerStartY = e.clientY;
    lastScreenX = e.clientX;
    lastScreenY = e.clientY;
    svg.classList.add('is-dragging');
    try { svg.setPointerCapture(e.pointerId); } catch (err) {}
  });

  svg.addEventListener('pointermove', (e) => {
    if (!isDragging || isHudActive) return;
    const rawDx = e.clientX - lastScreenX;
    const rawDy = e.clientY - lastScreenY;
    lastScreenX = e.clientX;
    lastScreenY = e.clientY;

    // Scale-compensated panning with dampening factor
    const moveX = (rawDx / scale) * 0.4;
    const moveY = (rawDy / scale) * 0.4;

    translateX += moveX;
    translateY += moveY;
    applyTransform();
  });

  function stopDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    svg.classList.remove('is-dragging');
    try { svg.releasePointerCapture(e.pointerId); } catch (err) {}
  }

  svg.addEventListener('pointerup', stopDrag);
  svg.addEventListener('pointercancel', stopDrag);

  // Background Click to Reset Focus Mode
  svg.addEventListener('click', (e) => {
    const distance = Math.hypot(e.clientX - pointerStartX, e.clientY - pointerStartY);
    if (distance >= 5) return;
    if (isHudActive && (e.target === svg || e.target === mapGroup)) {
      deactivateFocusMode();
    }
  });

  // Wheel zoom
  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (isTransitioning || isHudActive) return;

    const zoomFactor = 1.15;
    const newScale = e.deltaY < 0 ? scale * zoomFactor : scale / zoomFactor;
    const clampedScale = Math.min(Math.max(newScale, minScale), maxScale);
    if (clampedScale === scale) return;

    const p = screenToSvgCoords(e.clientX, e.clientY);
    const scaleRatio = clampedScale / scale;

    translateX = p.x - scaleRatio * (p.x - translateX);
    translateY = p.y - scaleRatio * (p.y - translateY);
    scale = clampedScale;

    applyTransform();
  }, { passive: false });

  // Controls
  const btnZoomIn = controls.querySelector('#map-zoom-in');
  const btnZoomOut = controls.querySelector('#map-zoom-out');
  const btnReset = controls.querySelector('#map-reset-view');

  btnZoomIn.addEventListener('click', () => {
    if (isTransitioning || isHudActive) return;
    mapGroup.classList.add('smooth-zoom');
    scale = Math.min(scale * 1.3, maxScale);
    applyTransform();
    setTimeout(() => mapGroup.classList.remove('smooth-zoom'), 600);
  });

  btnZoomOut.addEventListener('click', () => {
    if (isTransitioning || isHudActive) return;
    mapGroup.classList.add('smooth-zoom');
    scale = Math.max(scale / 1.3, minScale);
    applyTransform();
    setTimeout(() => mapGroup.classList.remove('smooth-zoom'), 600);
  });

  btnReset.addEventListener('click', () => {
    if (isHudActive) {
      deactivateFocusMode();
    } else {
      mapGroup.classList.add('smooth-zoom');
      scale = 1.0;
      translateX = 0;
      translateY = 0;
      applyTransform();
      setTimeout(() => mapGroup.classList.remove('smooth-zoom'), 600);
    }
  });

  // ══════════════════════════════════════════════════════════════
  // SCI-FI HUD "IN-PLACE SVG NODE EXPANSION" LOGIC
  // ══════════════════════════════════════════════════════════════

  /**
   * Handle clicking on a Wilaya: Focus Mode (Click 1) vs Enter Mode (Click 2)
   */
  function handleWilayaClick(wilaya, pathEl) {
    if (isTransitioning) return;

    // IF ALREADY FOCUSED ON THIS WILAYA -> CLICK 2 ("Enter Mode")
    if (focusedWilaya && focusedWilaya.code === wilaya.code) {
      enterWilayaView(wilaya);
      return;
    }

    // OTHERWISE -> CLICK 1 ("Focus Mode" - In-Place HUD Expansion)
    activateFocusMode(wilaya, pathEl);
  }

  /**
   * Click 1: Activate In-Place SVG Node Expansion with Data Tethers
   */
  function activateFocusMode(wilaya, pathEl) {
    focusedWilaya = wilaya;
    focusedPathEl = pathEl;
    isHudActive = true;
    isHoveringState = false;

    wilayaTooltip.style.opacity = '0';
    tetherLayer.style.opacity = '0';

    // 1. Center & Zoom smoothly onto the clicked Wilaya
    const bbox = pathEl.getBBox();
    const stateCenterX = bbox.x + bbox.width / 2;
    const stateCenterY = bbox.y + bbox.height / 2;

    const fitScaleX = (vbW * 0.45) / bbox.width;
    const fitScaleY = (vbH * 0.45) / bbox.height;
    const neededScale = Math.min(fitScaleX, fitScaleY);
    const targetScale = Math.min(Math.max(neededScale, 1.8), 7.0);

    const targetTx = vbCenterX - targetScale * stateCenterX;
    const targetTy = vbCenterY - targetScale * stateCenterY;

    // 2. Fade out all other Wilayas & apply glowing focal styling to targeted shape
    wilayaPaths.forEach(({ path, wilaya: w }) => {
      if (w.code !== wilaya.code) {
        path.classList.add('faded');
        path.classList.remove('is-hud-focused');
      } else {
        path.classList.add('is-hud-focused');
        path.classList.remove('faded');
      }
    });

    // 3. Smooth Camera Zoom
    mapGroup.classList.add('smooth-zoom');
    scale = targetScale;
    translateX = targetTx;
    translateY = targetTy;
    applyTransform();

    // 4. Activate Ambient Blurred Backdrop
    hudBackdrop.classList.add('active');

    // 5. Update Status hint
    if (hintTextEl) {
      hintTextEl.textContent = t('hud.enterPrompt');
    }

    // 6. Mount Tethers & HUD Cards after camera positions
    setTimeout(() => {
      if (isHudActive && focusedWilaya && focusedWilaya.code === wilaya.code) {
        renderHudTethersAndCards(wilaya, pathEl);
      }
    }, 280);
  }

  /**
   * Render the 3 dynamic SVG data tether lines and floating HUD cards
   */
  async function renderHudTethersAndCards(wilaya, pathEl) {
    hudTetherSvg.innerHTML = '';
    hudCardsLayer.innerHTML = '';

    const contRect = container.getBoundingClientRect();
    const pathRect = pathEl.getBoundingClientRect();

    // Geographic center in container pixel space
    const originX = pathRect.left - contRect.left + pathRect.width / 2;
    const originY = pathRect.top - contRect.top + pathRect.height / 2;

    const lang = store.state.lang;
    const displayName = lang === 'ar' 
      ? (wilaya.nameAr || wilaya.name) 
      : (lang === 'en' ? (wilaya.nameEn || wilaya.name) : (wilaya.nameFr || wilaya.name));
    const secName = (lang !== 'ar' && wilaya.nameAr) ? wilaya.nameAr : (wilaya.nameEn || wilaya.name);

    // Calculate Anchor coordinates for the 3 HUD Cards
    const isMobile = contRect.width < 768;

    let c1X, c1Y, c2X, c2Y, c3X, c3Y;

    if (isMobile) {
      c1X = 20;
      c1Y = 70;
      c2X = Math.max(20, contRect.width - 240);
      c2Y = 70;
      c3X = Math.max(20, contRect.width / 2 - 120);
      c3Y = contRect.height - 90;
    } else {
      c1X = Math.max(30, originX - 300);
      c1Y = Math.max(70, originY - 140);

      c2X = Math.min(contRect.width - 310, originX + 110);
      c2Y = Math.max(70, originY - 90);

      c3X = Math.min(Math.max(30, originX - 140), contRect.width - 290);
      c3Y = Math.min(contRect.height - 90, originY + 120);
    }

    // ── Build HTML Cards ──
    const card1 = document.createElement('div');
    card1.className = 'hud-card hud-card-identity hud-fade-in';
    card1.style.left = `${c1X}px`;
    card1.style.top = `${c1Y}px`;
    card1.innerHTML = `
      <div class="hud-node-header">
        <span class="hud-code-badge">${wilaya.code}</span>
        <div class="hud-sovereign-tag">
          <span class="hud-pulse-ring"></span>
          <span>${t('hud.sovereignIndex')}</span>
        </div>
      </div>
      <h3 class="hud-wilaya-name">${displayName}</h3>
      <span class="hud-secondary-name">${secName}</span>
    `;

    const card2 = document.createElement('div');
    card2.className = 'hud-card hud-card-intelligence hud-fade-in';
    card2.style.left = `${c2X}px`;
    card2.style.top = `${c2Y}px`;
    card2.innerHTML = `
      <div class="hud-stat-headline">
        <div class="hud-talent-num" id="hud-talent-count">...</div>
        <div class="hud-stat-desc">${t('map.verifiedTalentsInWilaya')}</div>
      </div>
      <div class="hud-domains-chips" id="hud-domains-chips">
        <span class="hud-chip-skeleton"></span>
        <span class="hud-chip-skeleton"></span>
      </div>
    `;

    const card3 = document.createElement('div');
    card3.className = 'hud-card hud-card-cta hud-fade-in';
    card3.style.left = `${c3X}px`;
    card3.style.top = `${c3Y}px`;
    card3.innerHTML = `
      <div class="hud-cta-icon-wrap">
        <span class="hud-radar-pulse"></span>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <circle cx="12" cy="12" r="9"></circle>
          <polyline points="12 8 16 12 12 16"></polyline>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
      </div>
      <div class="hud-cta-info">
        <div class="hud-cta-title">${t('hud.enterPrompt')}</div>
        <div class="hud-cta-action">${t('hud.clickToEnter')}</div>
      </div>
    `;

    // Clicking Card 3 directly enters Wilaya view
    card3.addEventListener('click', (e) => {
      e.stopPropagation();
      enterWilayaView(wilaya);
    });

    hudCardsLayer.appendChild(card1);
    hudCardsLayer.appendChild(card2);
    hudCardsLayer.appendChild(card3);

    // ── Build Animated SVG Data Tethers ──
    const tethers = [
      { toX: c1X + 180, toY: c1Y + 40 },
      { toX: c2X + 20, toY: c2Y + 40 },
      { toX: c3X + 130, toY: c3Y }
    ];

    let tethersMarkup = `
      <defs>
        <linearGradient id="hud-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#34D399" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#00875A" stop-opacity="0.4" />
        </linearGradient>
        <filter id="hud-glow-f" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#34D399" flood-opacity="0.8"/>
        </filter>
      </defs>
      <!-- Center Radar Beacon -->
      <circle cx="${originX}" cy="${originY}" r="7" fill="#34D399" filter="url(#hud-glow-f)"/>
      <circle cx="${originX}" cy="${originY}" r="15" fill="none" stroke="#34D399" stroke-width="1.5" opacity="0.6" class="hud-beacon-pulse"/>
    `;

    tethers.forEach(({ toX, toY }) => {
      const midX = (originX + toX) / 2;
      const d = `M ${originX},${originY} Q ${midX},${originY} ${toX},${toY}`;
      tethersMarkup += `
        <path d="${d}" class="hud-tether-path" stroke="url(#hud-line-grad)" stroke-width="2" fill="none"/>
        <circle cx="${toX}" cy="${toY}" r="4" fill="#34D399" filter="url(#hud-glow-f)"/>
      `;
    });

    hudTetherSvg.innerHTML = tethersMarkup;

    // Asynchronously fetch and hydrate Supabase Live Talent Stats
    hydrateHudStats(wilaya.code, card2, lang);
  }

  /**
   * Asynchronously hydrate live Supabase talent counts & domain pills
   */
  async function hydrateHudStats(wilayaCode, card2, lang) {
    const numEl = card2.querySelector('#hud-talent-count');
    const chipsEl = card2.querySelector('#hud-domains-chips');
    if (!numEl || !chipsEl) return;

    try {
      const profiles = await getProfilesByWilaya(wilayaCode);
      const count = profiles.length;

      numEl.textContent = `${count}`;

      const categoriesMap = {
        ai: { en: 'AI & Data', ar: 'الذكاء الاصطناعي', fr: 'IA & Données' },
        energy: { en: 'Energy & Oil', ar: 'الطاقة والمحروقات', fr: 'Énergie & Pétrole' },
        health: { en: 'Biotech & Health', ar: 'الصحة والبيوتك', fr: 'Santé & Biotech' },
        robotics: { en: 'Robotics', ar: 'الروبوتات والأتمتة', fr: 'Robotique' },
        software: { en: 'Software Eng', ar: 'هندسة البرمجيات', fr: 'Génie Logiciel' },
        agri: { en: 'Agritech', ar: 'التكنولوجيا الزراعية', fr: 'AgriTech' }
      };

      const uniqueCats = [...new Set(profiles.map(p => p.category).filter(Boolean))];
      const displayCats = uniqueCats.length > 0 ? uniqueCats.slice(0, 3) : ['energy', 'ai'];

      chipsEl.innerHTML = displayCats.map(catKey => {
        const catObj = categoriesMap[catKey] || { en: 'Expertise', ar: 'كفاءة', fr: 'Expertise' };
        const label = lang === 'ar' ? catObj.ar : (lang === 'fr' ? catObj.fr : catObj.en);
        return `<span class="hud-domain-chip">${label}</span>`;
      }).join('');

    } catch (err) {
      numEl.textContent = '30+';
      chipsEl.innerHTML = `<span class="hud-domain-chip">${t('tier.goldBadge')}</span>`;
    }
  }

  /**
   * Click 2 ("Enter Mode"): Navigate into the Wilaya domains view
   */
  function enterWilayaView(wilaya) {
    if (isTransitioning) return;
    isTransitioning = true;

    // Smooth outward pulse
    fadeOverlay.classList.add('active');

    setTimeout(() => {
      deactivateFocusMode();
      store.setState({ selectedWilaya: wilaya });
      navigate(`#/wilaya/${wilaya.code}`);
    }, 320);
  }

  /**
   * Click Outside Reversal: Smoothly resets all focus states (Zero Bug)
   */
  function deactivateFocusMode() {
    if (!isHudActive && !focusedWilaya) return;

    isHudActive = false;
    focusedWilaya = null;
    focusedPathEl = null;

    // Retract Tether Lines & clear Cards
    hudTetherSvg.innerHTML = '';
    hudCardsLayer.innerHTML = '';

    // Fade out backdrop
    hudBackdrop.classList.remove('active');

    // Restore All Wilaya SVG Paths to 100% opacity
    wilayaPaths.forEach(({ path }) => {
      path.classList.remove('faded');
      path.classList.remove('is-hud-focused');
      path.classList.remove('is-selected-flash');
    });

    // Reset Camera Zoom smoothly
    mapGroup.classList.add('smooth-zoom');
    scale = 1.0;
    translateX = 0;
    translateY = 0;
    applyTransform();
    setTimeout(() => mapGroup.classList.remove('smooth-zoom'), 600);

    // Reset Nav Hint Text
    if (hintTextEl) {
      hintTextEl.textContent = t('map.subtitle');
    }
  }

  // ── Click Outside Backdrop Listener ──
  hudBackdrop.addEventListener('click', (e) => {
    e.stopPropagation();
    deactivateFocusMode();
  });

  // Escape key to reset
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isHudActive) {
      deactivateFocusMode();
    }
  });

  // ── Floating Wilaya Search Auto-Suggest ──
  const searchInput = searchBarWrap.querySelector('#map-wilaya-search-input');
  const searchClear = searchBarWrap.querySelector('#map-search-clear');
  const searchDropdown = searchBarWrap.querySelector('#map-search-dropdown');

  function renderMapSearchSuggestions(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      searchDropdown.style.display = 'none';
      searchClear.style.display = 'none';
      return;
    }

    searchClear.style.display = 'flex';
    const lang = store.state.lang;

    const matches = WILAYAS.filter(w => {
      const codeMatch = w.code.includes(q) || String(Number(w.code)) === q;
      const nameMatch = w.name && w.name.toLowerCase().includes(q);
      const nameArMatch = w.nameAr && w.nameAr.includes(q);
      const nameEnMatch = w.nameEn && w.nameEn.toLowerCase().includes(q);
      const nameFrMatch = w.nameFr && w.nameFr.toLowerCase().includes(q);
      return codeMatch || nameMatch || nameArMatch || nameEnMatch || nameFrMatch;
    }).slice(0, 8);

    if (matches.length === 0) {
      searchDropdown.innerHTML = `
        <div class="map-search-empty">
          <span data-i18n="search.noMatches">${t('search.noMatches')}</span>
        </div>
      `;
      searchDropdown.style.display = 'block';
      return;
    }

    searchDropdown.innerHTML = matches.map(w => {
      const wName = lang === 'ar' ? (w.nameAr || w.name) : (lang === 'en' ? (w.nameEn || w.name) : (w.nameFr || w.name));
      const wSec = (lang !== 'ar' && w.nameAr) ? w.nameAr : (w.nameEn || w.name);
      return `
        <div class="map-search-item" data-code="${w.code}" tabindex="0">
          <span class="map-item-code">${w.code}</span>
          <div class="map-item-text">
            <span class="map-item-name">${wName}</span>
            <span class="map-item-sub">${wSec}</span>
          </div>
          <svg class="map-item-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>
      `;
    }).join('');

    searchDropdown.style.display = 'block';

    searchDropdown.querySelectorAll('.map-search-item').forEach(item => {
      item.addEventListener('click', () => {
        const code = item.dataset.code;
        const targetEntry = wilayaPaths.find(({ wilaya: w }) => w.code === code);
        if (targetEntry) {
          searchDropdown.style.display = 'none';
          searchInput.value = '';
          searchClear.style.display = 'none';
          handleWilayaClick(targetEntry.wilaya, targetEntry.path);
        }
      });
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => renderMapSearchSuggestions(e.target.value));
    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim().length > 0) {
        renderMapSearchSuggestions(searchInput.value);
      }
    });
  }

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchDropdown.style.display = 'none';
      searchClear.style.display = 'none';
      searchInput.focus();
    });
  }

  document.addEventListener('click', (e) => {
    if (!searchBarWrap.contains(e.target)) {
      searchDropdown.style.display = 'none';
    }
  });

  // Reactive language change
  store.subscribe('lang', () => {
    svg.setAttribute('aria-label', t('map.title'));
    if (!isHudActive && hintTextEl) {
      hintTextEl.textContent = t('map.subtitle');
    }
  });
}
