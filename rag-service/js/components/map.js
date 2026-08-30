/**
 * Rawabit v2 — Algeria Interactive Map
 * 1. Base Map: 1:1 Google Maps Panning, Crisp 1px Borders, Elegant Tethered Hover Tooltip
 * 2. Bulletproof Drag vs Click: Mousedown/Mousemove with 5px distance threshold
 * 3. Safe Sci-Fi HUD: Fixed blur glass, cloned path aligned with exact viewBox, tether lines, and glassmorphic stats cards
 * 4. Interaction: Click background to close; click glowing clone to enter Wilaya
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

  // ── State Variables ──
  let vb = { ...BASE_VB };
  let isMouseDown = false;
  let isMapDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let isHovering = false;

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

  // ── 2. Create Tether Tooltip Layer ──
  const tetherLayer = document.createElementNS(SVG_NS, 'svg');
  tetherLayer.setAttribute('id', 'tether-layer');
  tetherLayer.setAttribute('style', 'position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 30; overflow: visible; opacity: 0; transition: opacity 0.2s ease;');
  tetherLayer.innerHTML = `
    <line id="tether-line" stroke="#00875A" stroke-width="2" stroke-dasharray="3 3"/>
    <circle id="tether-dot" r="5" fill="#FFFFFF" stroke="#00875A" stroke-width="2"/>
  `;
  container.appendChild(tetherLayer);

  const tetherLine = tetherLayer.querySelector('#tether-line');
  const tetherDot = tetherLayer.querySelector('#tether-dot');

  // Floating Tether Tooltip Div
  const tooltip = document.createElement('div');
  tooltip.setAttribute('id', 'wilaya-tooltip');
  tooltip.className = 'map-tether-tooltip';
  tooltip.setAttribute('style', 'position: absolute; opacity: 0; pointer-events: none; z-index: 35; background: #FFFFFF; padding: 10px 18px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); font-weight: 800; font-family: inherit; color: #0F172A; border: 1.5px solid rgba(0,135,90,0.3); transition: opacity 0.2s ease; white-space: nowrap;');
  container.appendChild(tooltip);

  function updateTooltipPosition(clientX, clientY) {
    const rect = container.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const tipW = tooltip.offsetWidth || 150;
    const tipH = tooltip.offsetHeight || 42;

    let posX = mouseX + 35;
    let posY = mouseY - 55;

    if (posX + tipW > rect.width - 15) {
      posX = mouseX - tipW - 35;
    }
    if (posY < 15) {
      posY = mouseY + 25;
    }

    tooltip.style.left = `${posX}px`;
    tooltip.style.top = `${posY}px`;

    if (tetherDot && tetherLine) {
      tetherDot.setAttribute('cx', mouseX);
      tetherDot.setAttribute('cy', mouseY);

      const anchorX = (posX < mouseX) ? (posX + tipW) : posX;
      const anchorY = posY + tipH / 2;

      tetherLine.setAttribute('x1', mouseX);
      tetherLine.setAttribute('y1', mouseY);
      tetherLine.setAttribute('x2', anchorX);
      tetherLine.setAttribute('y2', anchorY);
    }
  }

  // ── 3. Render All Wilaya Paths with crisp borders ──
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

    // Hover with thin connecting tether line
    path.addEventListener('mouseenter', (e) => {
      if (isMapDragging) return;
      const lang = store.state.lang;
      const name = lang === 'ar' ? (wilaya.nameAr || wilaya.name) : (lang === 'en' ? (wilaya.nameEn || wilaya.name) : (wilaya.nameFr || wilaya.name));
      isHovering = true;
      tooltip.innerHTML = `<span style="color:#00875A; font-weight:900; margin-inline-end:6px;">${wilaya.code}</span> ${name}`;
      tooltip.style.opacity = '1';
      tetherLayer.style.opacity = '1';
      updateTooltipPosition(e.clientX, e.clientY);
    });

    path.addEventListener('mouseleave', () => {
      isHovering = false;
      tooltip.style.opacity = '0';
      tetherLayer.style.opacity = '0';
    });

    // Path Click Handler
    path.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isMapDragging) return; // Ignore drags
      triggerSciFiHUD(path, wilaya);
    });
  });

  container.appendChild(svg);

  // Mousemove for hover tooltip update
  container.addEventListener('mousemove', (e) => {
    if (isHovering && !isMapDragging) {
      updateTooltipPosition(e.clientX, e.clientY);
    }
  });

  // ── 4. Bulletproof Click vs Drag Panning Logic ──
  svg.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isMouseDown = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    isMapDragging = false;
  });

  svg.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    const dist = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY);
    if (dist > 5) {
      isMapDragging = true;
      svg.classList.add('is-dragging');
      if (isHovering) {
        tooltip.style.opacity = '0';
        tetherLayer.style.opacity = '0';
      }

      // 1:1 ViewBox Panning
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      const rect = svg.getBoundingClientRect();
      vb.x -= (dx / rect.width) * vb.w;
      vb.y -= (dy / rect.height) * vb.h;
      applyViewBox();
    }
  });

  window.addEventListener('mouseup', () => {
    if (!isMouseDown) return;
    isMouseDown = false;
    svg.classList.remove('is-dragging');
    // Keep isMapDragging true momentarily to let click handler evaluate and ignore
    setTimeout(() => {
      isMapDragging = false;
    }, 50);
  });

  // ── 5. Smooth Wheel Zoom (Centered at Cursor) ──
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

  // ── 6. Floating Search Bar ──
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
            triggerSciFiHUD(pathEl, targetW);
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

  // ── 7. Map Controls ──
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
  // 8. THE SCI-FI HUD (SAFE CLONE METHOD)
  // ══════════════════════════════════════════════════════════════
  function triggerSciFiHUD(pathEl, wilayaData) {
    // Remove existing HUD elements if present
    const oldGlass = document.getElementById('hud-glass');
    const oldSvg = document.getElementById('hud-svg');
    const oldCard1 = document.getElementById('hud-card-info');
    const oldCard2 = document.getElementById('hud-card-cta');
    if (oldGlass) oldGlass.remove();
    if (oldSvg) oldSvg.remove();
    if (oldCard1) oldCard1.remove();
    if (oldCard2) oldCard2.remove();

    tooltip.style.opacity = '0';
    tetherLayer.style.opacity = '0';

    // Step 1: Append #hud-glass overlay to body
    const hudGlass = document.createElement('div');
    hudGlass.id = 'hud-glass';
    hudGlass.style.cssText = 'position: fixed; inset: 0; backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); background: rgba(248, 250, 252, 0.75); z-index: 1000; cursor: pointer; opacity: 0; transition: opacity 0.3s ease;';
    document.body.appendChild(hudGlass);

    // Step 2: Create #hud-svg over the exact screen viewport
    const mapRect = svg.getBoundingClientRect();
    const hudSvg = document.createElementNS(SVG_NS, 'svg');
    hudSvg.id = 'hud-svg';
    hudSvg.setAttribute('viewBox', svg.getAttribute('viewBox'));
    hudSvg.setAttribute('preserveAspectRatio', svg.getAttribute('preserveAspectRatio') || 'xMidYMid meet');
    hudSvg.style.cssText = `position: fixed; left: ${mapRect.left}px; top: ${mapRect.top}px; width: ${mapRect.width}px; height: ${mapRect.height}px; z-index: 1001; pointer-events: none; overflow: visible;`;
    document.body.appendChild(hudSvg);

    // Step 3: Clone pathEl and apply glowing Antigravity styling
    const clone = pathEl.cloneNode(true);
    clone.style.cssText = 'fill: #059669; stroke: #34D399; stroke-width: 2px; vector-effect: non-scaling-stroke; filter: drop-shadow(0 0 30px #34D399); transform-origin: center; transform: scale(1.05); pointer-events: auto; cursor: pointer; transition: all 0.4s ease;';
    hudSvg.appendChild(clone);

    // Step 4: Calculate pathEl.getBoundingClientRect() and position HTML cards & SVG tether lines
    const pRect = pathEl.getBoundingClientRect();
    const centerX = pRect.left + pRect.width / 2;
    const centerY = pRect.top + pRect.height / 2;

    const lang = store.state.lang;
    const displayName = lang === 'ar' ? (wilayaData.nameAr || wilayaData.name) : (lang === 'en' ? (wilayaData.nameEn || wilayaData.name) : (wilayaData.nameFr || wilayaData.name));

    // Card 1 (Info Card)
    const cardInfo = document.createElement('div');
    cardInfo.className = 'hud-card';
    cardInfo.id = 'hud-card-info';
    cardInfo.style.cssText = `position: fixed; left: ${Math.min(centerX + 60, window.innerWidth - 280)}px; top: ${Math.max(centerY - 100, 40)}px; z-index: 1002; opacity: 0; transform: translateY(10px); transition: all 0.35s ease;`;
    cardInfo.innerHTML = `
      <h3 style="margin: 0 0 6px; font-size: 1.2rem; font-weight: 800; color: #0F172A;">${displayName} <span style="font-size: 0.85rem; color: #059669;">(${wilayaData.code})</span></h3>
      <p style="margin: 0; font-size: 0.9rem; font-weight: 700; color: #475569;">Verified Talents: <span id="hud-talent-count" style="color: #059669; font-weight: 900;">...</span></p>
    `;
    document.body.appendChild(cardInfo);

    // Card 2 (CTA Card)
    const cardCta = document.createElement('div');
    cardCta.className = 'hud-card cta-card';
    cardCta.id = 'hud-card-cta';
    cardCta.style.cssText = `position: fixed; left: ${Math.min(centerX + 60, window.innerWidth - 280)}px; top: ${Math.min(centerY + 30, window.innerHeight - 90)}px; z-index: 1002; cursor: pointer; opacity: 0; transform: translateY(10px); transition: all 0.35s ease;`;
    cardCta.innerHTML = `
      <span style="font-size: 0.92rem; font-weight: 800; color: #059669;">✨ Click shape again to enter →</span>
    `;
    document.body.appendChild(cardCta);

    // Fetch live Supabase talents count
    getProfilesByWilaya(wilayaData.code).then(res => {
      const countEl = cardInfo.querySelector('#hud-talent-count');
      if (countEl) countEl.textContent = Array.isArray(res) ? res.length : '30+';
    }).catch(() => {
      const countEl = cardInfo.querySelector('#hud-talent-count');
      if (countEl) countEl.textContent = '30+';
    });

    // Fade in HUD
    requestAnimationFrame(() => {
      hudGlass.style.opacity = '1';
      cardInfo.style.opacity = '1';
      cardInfo.style.transform = 'translateY(0)';
      cardCta.style.opacity = '1';
      cardCta.style.transform = 'translateY(0)';
    });

    // Step 5: Interaction logic
    function closeHUD() {
      hudGlass.style.opacity = '0';
      cardInfo.style.opacity = '0';
      cardCta.style.opacity = '0';
      setTimeout(() => {
        hudGlass.remove();
        hudSvg.remove();
        cardInfo.remove();
        cardCta.remove();
      }, 300);
    }

    function routeToWilaya(e) {
      e.stopPropagation();
      hudGlass.style.opacity = '0';
      cardInfo.style.opacity = '0';
      cardCta.style.opacity = '0';
      setTimeout(() => {
        hudGlass.remove();
        hudSvg.remove();
        cardInfo.remove();
        cardCta.remove();
        store.setState({ selectedWilaya: wilayaData });
        navigate(`#/wilaya/${wilayaData.code}`);
      }, 300);
    }

    hudGlass.addEventListener('click', closeHUD);
    clone.addEventListener('click', routeToWilaya);
    cardCta.addEventListener('click', routeToWilaya);

    // Escape listener
    const escListener = (e) => {
      if (e.key === 'Escape') {
        closeHUD();
        document.removeEventListener('keydown', escListener);
      }
    };
    document.addEventListener('keydown', escListener);
  }

  // Reactive language change
  store.subscribe('lang', () => {
    svg.setAttribute('aria-label', t('map.title'));
  });
}
