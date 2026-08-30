/**
 * Rawabit v2 — Interactive Algeria Map with Clone-based Antigravity HUD
 * 1. Base Map: 1:1 Google Maps Panning, Crisp Visible Borders (stroke: #cbd5e1, stroke-width: 1px)
 * 2. Antigravity HUD: Clones clicked Wilaya path into a fixed full-screen blurred overlay on document.body
 * 3. Data Tethers: 2 SVG dashed lines connecting center to floating glassmorphism cards
 * 4. Interaction: Click background to close; click cloned shape to enter wilaya
 * Strictly Vanilla JS · 60FPS
 */

import { MAP_VIEWBOX, WILAYAS } from './map-paths.js';
import { getProfilesByWilaya } from '../data/profiles-data.js';
import { store } from '../store.js';
import { t } from '../i18n.js';
import { navigate } from '../router.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const BASE_VB = { x: -9.17, y: -37.59, w: 21.66, h: 19.13 };

export function renderMap(container) {
  if (!container) return;
  container.innerHTML = '';

  // State
  let vb = { ...BASE_VB };
  let isPanning = false;
  let startPointerX = 0;
  let startPointerY = 0;
  let startVbX = 0;
  let startVbY = 0;
  let totalDragDist = 0;

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

  // ── 2. Render All Wilaya Paths with crisp borders ──
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

    // Hover tooltip
    path.addEventListener('mouseenter', (e) => {
      if (isPanning) return;
      const lang = store.state.lang;
      const name = lang === 'ar' ? (wilaya.nameAr || wilaya.name) : (lang === 'en' ? (wilaya.nameEn || wilaya.name) : (wilaya.nameFr || wilaya.name));
      hoverTooltip.textContent = `${wilaya.code} · ${name}`;
      hoverTooltip.style.opacity = '1';
      positionHoverTooltip(e.clientX, e.clientY);
    });

    path.addEventListener('mouseleave', () => {
      hoverTooltip.style.opacity = '0';
    });

    // Click: Open Antigravity HUD Overlay via Cloned Path
    path.addEventListener('click', (e) => {
      e.stopPropagation();
      if (totalDragDist >= 5) return;
      openAntigravityHUD(wilaya, path);
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
    if (!isPanning) {
      positionHoverTooltip(e.clientX, e.clientY);
    }
  });

  // ── 4. Natural 1:1 Pan Physics (Google Maps style) ──
  svg.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
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

  // ── 5. Natural Wheel Zoom ──
  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = svg.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width;
    const normY = (e.clientY - rect.top) / rect.height;
    const svgPointX = vb.x + normX * vb.w;
    const svgPointY = vb.y + normY * vb.h;

    const zoomFactor = e.deltaY < 0 ? 0.84 : 1.2;
    const newW = Math.max(Math.min(vb.w * zoomFactor, BASE_VB.w * 1.5), 1.2);
    const newH = newW * (BASE_VB.h / BASE_VB.w);

    vb.x = svgPointX - normX * newW;
    vb.y = svgPointY - normY * newH;
    vb.w = newW;
    vb.h = newH;
    applyViewBox();
  }, { passive: false });

  // ── 6. Floating Wilaya Search Bar ──
  const searchBarWrap = document.createElement('div');
  searchBarWrap.className = 'map-floating-search-bar';
  searchBarWrap.innerHTML = `
    <div class="map-search-box">
      <div class="map-search-icon">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2">
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

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
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
        return `
          <div class="map-search-item" data-code="${w.code}">
            <span class="map-item-code">${w.code}</span>
            <div class="map-item-text"><span class="map-item-name">${wName}</span></div>
          </div>
        `;
      }).join('');
      searchDropdown.style.display = 'block';

      searchDropdown.querySelectorAll('.map-search-item').forEach(it => {
        it.addEventListener('click', () => {
          const code = it.dataset.code;
          const targetW = WILAYAS.find(w => w.code === code);
          const pathEl = svg.querySelector(`.wilaya-group[data-code="${code}"] .wilaya-path`);
          if (targetW && pathEl) {
            searchDropdown.style.display = 'none';
            searchInput.value = '';
            searchClear.style.display = 'none';
            openAntigravityHUD(targetW, pathEl);
          }
        });
      });
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

  // ── 7. Controls ──
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
    vb.w = Math.max(vb.w * 0.75, 1.2);
    vb.h = vb.w * (BASE_VB.h / BASE_VB.w);
    applyViewBox();
  });

  controls.querySelector('#map-zoom-out').addEventListener('click', () => {
    vb.w = Math.min(vb.w * 1.35, BASE_VB.w * 1.5);
    vb.h = vb.w * (BASE_VB.h / BASE_VB.w);
    applyViewBox();
  });

  controls.querySelector('#map-reset-view').addEventListener('click', () => {
    vb = { ...BASE_VB };
    applyViewBox();
  });

  // ══════════════════════════════════════════════════════════════
  // ANTIGRAVITY HUD (EXACT CLONE-BASED OVERLAY TECHNIQUE)
  // ══════════════════════════════════════════════════════════════
  function openAntigravityHUD(wilaya, pathEl) {
    // Remove existing overlay if any
    const existing = document.getElementById('hud-overlay');
    if (existing) existing.remove();

    const lang = store.state.lang;
    const displayName = lang === 'ar' ? (wilaya.nameAr || wilaya.name) : (lang === 'en' ? (wilaya.nameEn || wilaya.name) : (wilaya.nameFr || wilaya.name));

    // STEP A: Create fixed full-screen blurred overlay
    const overlay = document.createElement('div');
    overlay.id = 'hud-overlay';
    overlay.style.cssText = 'position: fixed; inset: 0; z-index: 9999; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); background: rgba(248, 250, 252, 0.75); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.4s ease;';

    // Calculate ViewBox for the cloned path
    const bbox = pathEl.getBBox();
    const pad = Math.max(bbox.width, bbox.height) * 0.25;
    const cloneVb = `${bbox.x - pad} ${bbox.y - pad} ${bbox.width + pad * 2} ${bbox.height + pad * 2}`;

    // STEP B: Wrapper for Cloned SVG Shape and Tethers
    overlay.innerHTML = `
      <div class="hud-stage-wrap" style="position: relative; width: 640px; height: 500px; max-width: 92vw; max-height: 85vh; display: flex; align-items: center; justify-content: center;">
        
        <!-- Tether Lines SVG Layer -->
        <svg id="hud-tethers-layer" style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; z-index: 10;">
          <line id="tether-line-1" stroke="#059669" stroke-width="1.5" stroke-dasharray="4" opacity="0" style="transition: opacity 0.4s ease;"/>
          <line id="tether-line-2" stroke="#059669" stroke-width="1.5" stroke-dasharray="4" opacity="0" style="transition: opacity 0.4s ease;"/>
        </svg>

        <!-- Center Cloned SVG Container -->
        <div id="hud-clone-container" style="position: relative; z-index: 20; width: 260px; height: 260px; display: flex; align-items: center; justify-content: center;">
          <svg id="hud-clone-svg" viewBox="${cloneVb}" style="width: 100%; height: 100%; overflow: visible;"></svg>
        </div>

        <!-- Floating Glassmorphism Cards -->
        <div class="hud-card" id="hud-card-info" style="top: 30px; right: 20px; z-index: 30;">
          <h3 style="margin: 0 0 6px; font-size: 1.25rem; font-weight: 800; color: #0F172A;">${displayName} <span style="font-size: 0.85rem; color: #059669;">(${wilaya.code})</span></h3>
          <p style="margin: 0; font-size: 0.9rem; font-weight: 700; color: #475569;">Verified Talents: <span id="hud-talent-count" style="color: #059669; font-weight: 900;">...</span></p>
        </div>

        <div class="hud-card cta-card" id="hud-card-cta" style="bottom: 30px; right: 20px; z-index: 30; cursor: pointer;">
          <span style="font-size: 0.92rem; font-weight: 800; color: #059669;">✨ Click shape again to enter →</span>
        </div>

      </div>
    `;

    // STEP C: Deep CLONE the clicked Wilaya's SVG path
    const cloneSvg = overlay.querySelector('#hud-clone-svg');
    const clonedPath = pathEl.cloneNode(true);

    // STEP D: Apply the "Antigravity" styles to the CLONE
    clonedPath.style.cssText = 'fill: #059669; stroke: #34D399; stroke-width: 2px; filter: drop-shadow(0 20px 40px rgba(5, 150, 105, 0.5)); transform: scale(1.1) translateY(-10px); transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer;';
    clonedPath.setAttribute('id', `cloned-wilaya-${wilaya.code}`);
    cloneSvg.appendChild(clonedPath);

    document.body.appendChild(overlay);

    // Fade in overlay smoothly
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      drawTetherLines(overlay);
    });

    // Fetch and hydrate real Supabase count
    getProfilesByWilaya(wilaya.code).then(res => {
      const countEl = overlay.querySelector('#hud-talent-count');
      if (countEl) countEl.textContent = Array.isArray(res) ? res.length : '30+';
    }).catch(() => {
      const countEl = overlay.querySelector('#hud-talent-count');
      if (countEl) countEl.textContent = '30+';
    });

    // ── Interaction: Click on Cloned Wilaya Path or CTA card -> Enter Mode ──
    function handleEnter(e) {
      e.stopPropagation();
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
        store.setState({ selectedWilaya: wilaya });
        navigate(`#/wilaya/${wilaya.code}`);
      }, 300);
    }

    clonedPath.addEventListener('click', handleEnter);
    const ctaCard = overlay.querySelector('#hud-card-cta');
    if (ctaCard) ctaCard.addEventListener('click', handleEnter);

    // ── Interaction: Click on Background -> Smoothly close and remove ──
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.id === 'hud-tethers-layer' || e.target.classList.contains('hud-stage-wrap')) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 350);
      }
    });

    // Escape key closes HUD
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 350);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  // Draw the 2 SVG lines from the center of the cloned shape to the cards
  function drawTetherLines(overlay) {
    const stage = overlay.querySelector('.hud-stage-wrap');
    const clone = overlay.querySelector('#hud-clone-container');
    const card1 = overlay.querySelector('#hud-card-info');
    const card2 = overlay.querySelector('#hud-card-cta');
    const line1 = overlay.querySelector('#tether-line-1');
    const line2 = overlay.querySelector('#tether-line-2');

    if (!stage || !clone || !card1 || !card2 || !line1 || !line2) return;

    const sRect = stage.getBoundingClientRect();
    const cRect = clone.getBoundingClientRect();
    const c1Rect = card1.getBoundingClientRect();
    const c2Rect = card2.getBoundingClientRect();

    const originX = cRect.left - sRect.left + cRect.width / 2;
    const originY = cRect.top - sRect.top + cRect.height / 2;

    // Line 1 to Card 1 (Top-Right)
    const target1X = c1Rect.left - sRect.left;
    const target1Y = c1Rect.top - sRect.top + c1Rect.height / 2;
    line1.setAttribute('x1', originX);
    line1.setAttribute('y1', originY);
    line1.setAttribute('x2', target1X);
    line1.setAttribute('y2', target1Y);
    line1.style.opacity = '1';

    // Line 2 to Card 2 (Bottom-Right)
    const target2X = c2Rect.left - sRect.left;
    const target2Y = c2Rect.top - sRect.top + c2Rect.height / 2;
    line2.setAttribute('x1', originX);
    line2.setAttribute('y1', originY);
    line2.setAttribute('x2', target2X);
    line2.setAttribute('y2', target2Y);
    line2.style.opacity = '1';
  }

  // Reactive language change
  store.subscribe('lang', () => {
    svg.setAttribute('aria-label', t('map.title'));
  });
}
