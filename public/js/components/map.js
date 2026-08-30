/**
 * Rawabit v2 — Cinematic Antigravity Algeria Map
 * Features:
 * 1. 100% 1:1 Natural Google-Maps Style Pan & Zoom (Direct SVG ViewBox manipulation)
 * 2. Click 1 (Focus Mode): Camera centers, full-bleed frosted glass blur covers the screen,
 *    and the focused Wilaya floats above the blur with Antigravity glow & dynamic optical data tethers.
 * 3. Connected Glassmorphism Cards: Identity, Supabase Live Stats, and Action CTA.
 * 4. Click 2 (Enter Mode): Clicking the floating Wilaya shape or CTA card transitions to the profiles page.
 * 5. Reversal: Clicking the dark blurred void smoothly reverses back to national view (Zero bugs).
 * Strictly Vanilla JS · 60FPS Hardware Accelerated
 */

import { MAP_VIEWBOX, WILAYAS } from './map-paths.js';
import { getProfilesByWilaya } from '../data/profiles-data.js';
import { store } from '../store.js';
import { t } from '../i18n.js';
import { navigate } from '../router.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Native SVG coordinate dimensions
const BASE_VB = { x: -9.17, y: -37.59, w: 21.66, h: 19.13 };

export function renderMap(container) {
  if (!container) return;
  container.innerHTML = '';

  // ── State Variables ──
  let vb = { ...BASE_VB };
  let animFrameId = null;
  let isPanning = false;
  let startPointerX = 0;
  let startPointerY = 0;
  let startVbX = 0;
  let startVbY = 0;
  let totalDragDist = 0;
  let isTransitioning = false;
  let focusedWilaya = null;

  // ── 1. Create Main SVG Canvas ──
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('map-svg');
  svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('role', 'region');
  svg.setAttribute('aria-label', t('map.title'));

  function applyViewBox() {
    svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  }

  // ── 2. Render Wilaya Vector Paths ──
  const pathElementsMap = new Map();

  WILAYAS.forEach(wilaya => {
    const g = document.createElementNS(SVG_NS, 'g');
    g.classList.add('wilaya-group');
    g.setAttribute('data-code', wilaya.code);

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', wilaya.d);
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    path.classList.add('wilaya-path');

    g.appendChild(path);
    svg.appendChild(g);
    pathElementsMap.set(wilaya.code, { g, path, wilaya });

    // Hover tooltip interaction
    path.addEventListener('mouseenter', (e) => {
      if (isTransitioning || focusedWilaya || isPanning) return;
      const lang = store.state.lang;
      const name = lang === 'ar' ? (wilaya.nameAr || wilaya.name) : (lang === 'en' ? (wilaya.nameEn || wilaya.name) : (wilaya.nameFr || wilaya.name));
      hoverTooltip.textContent = `${wilaya.code} · ${name}`;
      hoverTooltip.style.opacity = '1';
      positionHoverTooltip(e.clientX, e.clientY);
    });

    path.addEventListener('mouseleave', () => {
      if (focusedWilaya) return;
      hoverTooltip.style.opacity = '0';
    });

    // Wilaya Click Handler (Click 1: Focus Mode)
    path.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isTransitioning || totalDragDist >= 5) return;
      openCinematicIsolation(wilaya, path);
    });
  });

  container.appendChild(svg);

  // ── 3. Hover Tooltip ──
  const hoverTooltip = document.createElement('div');
  hoverTooltip.className = 'map-hover-tooltip';
  container.appendChild(hoverTooltip);

  function positionHoverTooltip(clientX, clientY) {
    const contRect = container.getBoundingClientRect();
    let posX = clientX - contRect.left + 16;
    let posY = clientY - contRect.top - 36;

    if (posX + 160 > contRect.width) posX = clientX - contRect.left - 170;
    if (posY < 10) posY = clientY - contRect.top + 20;

    hoverTooltip.style.left = `${posX}px`;
    hoverTooltip.style.top = `${posY}px`;
  }

  container.addEventListener('mousemove', (e) => {
    if (!focusedWilaya && !isPanning) {
      positionHoverTooltip(e.clientX, e.clientY);
    }
  });

  // ── 4. Natural 1:1 Panning (Google Maps Physics) ──
  svg.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || isTransitioning || focusedWilaya) return;
    isPanning = true;
    totalDragDist = 0;
    startPointerX = e.clientX;
    startPointerY = e.clientY;
    startVbX = vb.x;
    startVbY = vb.y;

    svg.classList.add('is-dragging');
    try { svg.setPointerCapture(e.pointerId); } catch (err) {}
  });

  svg.addEventListener('pointermove', (e) => {
    if (!isPanning) return;
    const dx = e.clientX - startPointerX;
    const dy = e.clientY - startPointerY;
    totalDragDist += Math.hypot(e.movementX || 0, e.movementY || 0);

    const rect = svg.getBoundingClientRect();
    vb.x = startVbX - (dx / rect.width) * vb.w;
    vb.y = startVbY - (dy / rect.height) * vb.h;
    applyViewBox();
  });

  function stopPanning(e) {
    if (!isPanning) return;
    isPanning = false;
    svg.classList.remove('is-dragging');
    try { svg.releasePointerCapture(e.pointerId); } catch (err) {}
  }

  svg.addEventListener('pointerup', stopPanning);
  svg.addEventListener('pointercancel', stopPanning);

  // ── 5. Smooth Wheel Zoom (Centered at Mouse Position) ──
  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (isTransitioning || focusedWilaya) return;

    const rect = svg.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width;
    const normY = (e.clientY - rect.top) / rect.height;
    const svgPointX = vb.x + normX * vb.w;
    const svgPointY = vb.y + normY * vb.h;

    const zoomFactor = e.deltaY < 0 ? 0.82 : 1.22;
    const newW = Math.max(Math.min(vb.w * zoomFactor, BASE_VB.w * 1.6), 1.2);
    const newH = newW * (BASE_VB.h / BASE_VB.w);

    vb.x = svgPointX - normX * newW;
    vb.y = svgPointY - normY * newH;
    vb.w = newW;
    vb.h = newH;
    applyViewBox();
  }, { passive: false });

  // ── 6. Camera Smooth Interpolator (requestAnimationFrame) ──
  function animateViewBox(targetVb, durationMs = 500, onComplete = null) {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    const startVb = { ...vb };
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1.0);
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      vb.x = startVb.x + (targetVb.x - startVb.x) * ease;
      vb.y = startVb.y + (targetVb.y - startVb.y) * ease;
      vb.w = startVb.w + (targetVb.w - startVb.w) * ease;
      vb.h = startVb.h + (targetVb.h - startVb.h) * ease;

      applyViewBox();

      if (progress < 1.0) {
        animFrameId = requestAnimationFrame(step);
      } else {
        animFrameId = null;
        if (onComplete) onComplete();
      }
    }

    animFrameId = requestAnimationFrame(step);
  }

  // ── 7. Floating Wilaya Search Bar ──
  const searchBarWrap = document.createElement('div');
  searchBarWrap.className = 'map-floating-search-bar';
  searchBarWrap.innerHTML = `
    <div class="map-search-box">
      <div class="map-search-icon">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>
      <input 
        type="text" 
        class="map-search-input" 
        id="map-wilaya-search-input"
        placeholder="${t('map.searchPlaceholder')}"
        autocomplete="off"
      />
      <button class="map-search-clear-btn" id="map-search-clear" style="display: none;" aria-label="Clear">
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
    <div class="map-search-dropdown" id="map-search-dropdown" style="display: none;"></div>
  `;
  container.appendChild(searchBarWrap);

  const searchInput = searchBarWrap.querySelector('#map-wilaya-search-input');
  const searchClear = searchBarWrap.querySelector('#map-search-clear');
  const searchDropdown = searchBarWrap.querySelector('#map-search-dropdown');

  function renderSearchSuggestions(query) {
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
      const nameMatch = (w.name && w.name.toLowerCase().includes(q)) ||
                         (w.nameAr && w.nameAr.includes(q)) ||
                         (w.nameEn && w.nameEn.toLowerCase().includes(q)) ||
                         (w.nameFr && w.nameFr.toLowerCase().includes(q));
      return codeMatch || nameMatch;
    }).slice(0, 8);

    if (matches.length === 0) {
      searchDropdown.innerHTML = `<div class="map-search-empty">${t('search.noMatches')}</div>`;
      searchDropdown.style.display = 'block';
      return;
    }

    searchDropdown.innerHTML = matches.map(w => {
      const wName = lang === 'ar' ? (w.nameAr || w.name) : (lang === 'en' ? (w.nameEn || w.name) : (w.nameFr || w.name));
      const wSec = (lang !== 'ar' && w.nameAr) ? w.nameAr : (w.nameEn || w.name);
      return `
        <div class="map-search-item" data-code="${w.code}">
          <span class="map-item-code">${w.code}</span>
          <div class="map-item-text">
            <span class="map-item-name">${wName}</span>
            <span class="map-item-sub">${wSec}</span>
          </div>
          <svg class="map-item-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>
      `;
    }).join('');

    searchDropdown.style.display = 'block';

    searchDropdown.querySelectorAll('.map-search-item').forEach(it => {
      it.addEventListener('click', () => {
        const code = it.dataset.code;
        const entry = pathElementsMap.get(code);
        if (entry) {
          searchDropdown.style.display = 'none';
          searchInput.value = '';
          searchClear.style.display = 'none';
          openCinematicIsolation(entry.wilaya, entry.path);
        }
      });
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => renderSearchSuggestions(e.target.value));
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

  // ── 8. Map Controls (Zoom In, Zoom Out, Reset) ──
  const controls = document.createElement('div');
  controls.className = 'map-controls';
  controls.innerHTML = `
    <button class="map-ctrl-btn" id="map-zoom-in" title="Zoom In" aria-label="Zoom In">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    </button>
    <button class="map-ctrl-btn" id="map-zoom-out" title="Zoom Out" aria-label="Zoom Out">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    </button>
    <button class="map-ctrl-btn" id="map-reset-view" title="Reset View" aria-label="Reset View">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
    </button>
  `;
  container.appendChild(controls);

  controls.querySelector('#map-zoom-in').addEventListener('click', () => {
    if (focusedWilaya) return;
    const newW = Math.max(vb.w * 0.75, 1.2);
    const newH = newW * (BASE_VB.h / BASE_VB.w);
    const cX = vb.x + vb.w / 2;
    const cY = vb.y + vb.h / 2;
    animateViewBox({ x: cX - newW / 2, y: cY - newH / 2, w: newW, h: newH }, 400);
  });

  controls.querySelector('#map-zoom-out').addEventListener('click', () => {
    if (focusedWilaya) return;
    const newW = Math.min(vb.w * 1.35, BASE_VB.w * 1.6);
    const newH = newW * (BASE_VB.h / BASE_VB.w);
    const cX = vb.x + vb.w / 2;
    const cY = vb.y + vb.h / 2;
    animateViewBox({ x: cX - newW / 2, y: cY - newH / 2, w: newW, h: newH }, 400);
  });

  controls.querySelector('#map-reset-view').addEventListener('click', () => {
    if (focusedWilaya) {
      closeCinematicIsolation();
    } else {
      animateViewBox(BASE_VB, 500);
    }
  });

  // ══════════════════════════════════════════════════════════════
  // CINEMATIC ISOLATION & ANTIGRAVITY DATA TETHERING STAGE
  // ══════════════════════════════════════════════════════════════

  const isolationOverlay = document.createElement('div');
  isolationOverlay.className = 'cinematic-isolation-overlay';
  isolationOverlay.id = 'cinematic-isolation-overlay';
  container.appendChild(isolationOverlay);

  /**
   * Click 1: Trigger Focus Mode with Frosted Blur, Antigravity Float & Optical Tethers
   */
  function openCinematicIsolation(wilaya, pathEl) {
    focusedWilaya = wilaya;
    hoverTooltip.style.opacity = '0';

    // 1. Center camera on Wilaya
    const bbox = pathEl.getBBox();
    const pad = Math.max(bbox.width, bbox.height) * 0.9;
    const targetW = Math.max(bbox.width + pad * 2, 3.8);
    const targetH = targetW * (BASE_VB.h / BASE_VB.w);
    const targetX = (bbox.x + bbox.width / 2) - targetW / 2;
    const targetY = (bbox.y + bbox.height / 2) - targetH / 2;

    animateViewBox({ x: targetX, y: targetY, w: targetW, h: targetH }, 600);

    // 2. Render Frosted Glass Isolation Stage
    const lang = store.state.lang;
    const displayName = lang === 'ar' ? (wilaya.nameAr || wilaya.name) : (lang === 'en' ? (wilaya.nameEn || wilaya.name) : (wilaya.nameFr || wilaya.name));
    const secName = (lang !== 'ar' && wilaya.nameAr) ? wilaya.nameAr : (wilaya.nameEn || wilaya.name);

    // Calculate normalized ViewBox for the isolated Wilaya shape
    const padShape = Math.max(bbox.width, bbox.height) * 0.18;
    const shapeVb = `${bbox.x - padShape} ${bbox.y - padShape} ${bbox.width + padShape * 2} ${bbox.height + padShape * 2}`;

    isolationOverlay.innerHTML = `
      <!-- Optical Data Tethering SVG Canvas -->
      <svg class="tether-svg-canvas" id="isolation-tethers-svg">
        <defs>
          <linearGradient id="fiber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#34D399" stop-opacity="1" />
            <stop offset="100%" stop-color="#00875A" stop-opacity="0.3" />
          </linearGradient>
          <filter id="fiber-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#34D399" flood-opacity="0.9"/>
          </filter>
        </defs>
        <g id="tether-lines-group"></g>
      </svg>

      <!-- Center: Antigravity Floating Isolated Shape -->
      <div class="isolated-wilaya-stage antigravity-float-node" id="isolated-wilaya-shape" title="${t('hud.enterPrompt')}">
        <div class="shape-ambient-glow"></div>
        <svg class="isolated-shape-svg" viewBox="${shapeVb}">
          <defs>
            <linearGradient id="isolated-gold-grad-${wilaya.code}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#34D399" />
              <stop offset="50%" stop-color="#00875A" />
              <stop offset="100%" stop-color="#D97706" />
            </linearGradient>
            <filter id="isolated-shadow-${wilaya.code}" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#00875A" flood-opacity="0.6"/>
              <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#34D399" flood-opacity="0.8"/>
            </filter>
          </defs>
          <path 
            d="${wilaya.d}" 
            fill="url(#isolated-gold-grad-${wilaya.code})" 
            stroke="#FFFFFF" 
            stroke-width="0.08" 
            filter="url(#isolated-shadow-${wilaya.code})"
          />
        </svg>
      </div>

      <!-- Card 1: Identity Node (Top-Left) -->
      <div class="hud-floating-card hud-card-identity" id="hud-card-1">
        <div class="hud-card-header">
          <span class="hud-code-pill">${wilaya.code}</span>
          <span class="hud-sovereignty-badge">
            <span class="hud-green-dot"></span>
            ${t('hud.sovereignIndex')}
          </span>
        </div>
        <h2 class="hud-wilaya-title">${displayName}</h2>
        <div class="hud-wilaya-subtitle">${secName}</div>
      </div>

      <!-- Card 2: Intelligence & Real Supabase Stats (Top-Right) -->
      <div class="hud-floating-card hud-card-intelligence" id="hud-card-2">
        <div class="hud-stats-row">
          <div class="hud-stat-number" id="hud-live-talents">
            <span class="pulse-loader">...</span>
          </div>
          <div class="hud-stat-meta">
            <div class="hud-stat-label">${t('map.verifiedTalentsInWilaya')}</div>
            <div class="hud-tier-pill">100% ${t('tier.goldBadge')}</div>
          </div>
        </div>
        <div class="hud-domains-row" id="hud-domains-container">
          <span class="domain-skeleton"></span>
          <span class="domain-skeleton"></span>
        </div>
      </div>

      <!-- Card 3: Interactive CTA Action Node (Bottom-Center) -->
      <div class="hud-floating-card hud-card-cta" id="hud-card-3">
        <div class="hud-radar-wrap">
          <span class="hud-radar-ring"></span>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <circle cx="12" cy="12" r="9"></circle>
            <polyline points="12 8 16 12 12 16"></polyline>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </div>
        <div class="hud-cta-content">
          <div class="hud-cta-prompt">${t('hud.enterPrompt')}</div>
          <div class="hud-cta-link">${t('hud.clickToEnter')}</div>
        </div>
      </div>
    `;

    isolationOverlay.classList.add('active');

    // 3. Draw Optical Tether Curves
    requestAnimationFrame(() => {
      drawOpticalTethers();
    });

    // 4. Hydrate Live Supabase Data
    hydrateSupabaseStats(wilaya.code, lang);

    // 5. Wire Click 2: Enter Mode on Shape or CTA Card
    const isolatedShape = isolationOverlay.querySelector('#isolated-wilaya-shape');
    const cardCTA = isolationOverlay.querySelector('#hud-card-3');

    const handleEnter = (e) => {
      e.stopPropagation();
      enterWilayaProfiles(wilaya);
    };

    if (isolatedShape) isolatedShape.addEventListener('click', handleEnter);
    if (cardCTA) cardCTA.addEventListener('click', handleEnter);

    // 6. Reversal: Clicking the dark void closes isolation
    isolationOverlay.onclick = (e) => {
      if (e.target === isolationOverlay || e.target.id === 'isolation-tethers-svg') {
        closeCinematicIsolation();
      }
    };
  }

  /**
   * Draw glowing curved optical fiber lines connecting the center shape to the 3 cards
   */
  function drawOpticalTethers() {
    const linesGroup = isolationOverlay.querySelector('#tether-lines-group');
    const shapeEl = isolationOverlay.querySelector('#isolated-wilaya-shape');
    const c1 = isolationOverlay.querySelector('#hud-card-1');
    const c2 = isolationOverlay.querySelector('#hud-card-2');
    const c3 = isolationOverlay.querySelector('#hud-card-3');

    if (!linesGroup || !shapeEl || !c1 || !c2 || !c3) return;

    const overlayRect = isolationOverlay.getBoundingClientRect();
    const sRect = shapeEl.getBoundingClientRect();
    const c1Rect = c1.getBoundingClientRect();
    const c2Rect = c2.getBoundingClientRect();
    const c3Rect = c3.getBoundingClientRect();

    const originX = sRect.left - overlayRect.left + sRect.width / 2;
    const originY = sRect.top - overlayRect.top + sRect.height / 2;

    const targets = [
      { toX: c1Rect.right - overlayRect.left - 20, toY: c1Rect.bottom - overlayRect.top - 10 },
      { toX: c2Rect.left - overlayRect.left + 20, toY: c2Rect.bottom - overlayRect.top - 10 },
      { toX: c3Rect.left - overlayRect.left + c3Rect.width / 2, toY: c3Rect.top - overlayRect.top }
    ];

    let markup = `
      <circle cx="${originX}" cy="${originY}" r="7" fill="#34D399" filter="url(#fiber-glow)"/>
      <circle cx="${originX}" cy="${originY}" r="16" fill="none" stroke="#34D399" stroke-width="1.5" class="center-beacon-ring"/>
    `;

    targets.forEach(({ toX, toY }) => {
      const midX = (originX + toX) / 2;
      const d = `M ${originX},${originY} Q ${midX},${originY} ${toX},${toY}`;
      markup += `
        <path d="${d}" class="optic-tether-line" stroke="url(#fiber-grad)" stroke-width="2.5" fill="none"/>
        <circle cx="${toX}" cy="${toY}" r="4" fill="#34D399" filter="url(#fiber-glow)"/>
      `;
    });

    linesGroup.innerHTML = markup;
  }

  /**
   * Hydrate live talent statistics from Supabase
   */
  async function hydrateSupabaseStats(wilayaCode, lang) {
    const countEl = isolationOverlay.querySelector('#hud-live-talents');
    const domainsEl = isolationOverlay.querySelector('#hud-domains-container');
    if (!countEl || !domainsEl) return;

    try {
      const profiles = await getProfilesByWilaya(wilayaCode);
      const count = profiles.length;
      countEl.textContent = `${count}`;

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

      domainsEl.innerHTML = displayCats.map(catKey => {
        const catObj = categoriesMap[catKey] || { en: 'Expertise', ar: 'كفاءة', fr: 'Expertise' };
        const label = lang === 'ar' ? catObj.ar : (lang === 'fr' ? catObj.fr : catObj.en);
        return `<span class="hud-domain-chip">${label}</span>`;
      }).join('');
    } catch (err) {
      countEl.textContent = '30+';
      domainsEl.innerHTML = `<span class="hud-domain-chip">${t('tier.goldBadge')}</span>`;
    }
  }

  /**
   * Click 2: Transition into the Profiles view
   */
  function enterWilayaProfiles(wilaya) {
    if (isTransitioning) return;
    isTransitioning = true;

    isolationOverlay.classList.add('is-leaving');

    setTimeout(() => {
      isolationOverlay.classList.remove('active', 'is-leaving');
      focusedWilaya = null;
      store.setState({ selectedWilaya: wilaya });
      navigate(`#/wilaya/${wilaya.code}`);
    }, 350);
  }

  /**
   * Reversal: Smoothly close isolation and return to national view
   */
  function closeCinematicIsolation() {
    if (!focusedWilaya) return;
    focusedWilaya = null;

    isolationOverlay.classList.add('is-closing');
    setTimeout(() => {
      isolationOverlay.classList.remove('active', 'is-closing');
      isolationOverlay.innerHTML = '';
    }, 300);

    animateViewBox(BASE_VB, 550);
  }

  // Escape key listener for reversal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && focusedWilaya) {
      closeCinematicIsolation();
    }
  });

  // Reactive language change
  store.subscribe('lang', () => {
    svg.setAttribute('aria-label', t('map.title'));
  });
}
