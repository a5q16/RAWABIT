/**
 * Rawabit v2 — High-Performance 60FPS Interactive Algeria SVG Map
 * Tethered Smart Tooltip (Solid White Line + White Dot + Card)
 * 2-Second Cinematic Flash Zoom · Strictly Vanilla JS
 */

import { MAP_VIEWBOX, WILAYAS } from './map-paths.js';
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

  // ── 1. Create Inline SVG ──
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

  // ── 3. Dynamic Solid White Tether Line SVG Layer (z-index: 9999, overflow: visible) ──
  const tetherLayer = document.createElementNS(SVG_NS, 'svg');
  tetherLayer.setAttribute('id', 'tether-layer');
  tetherLayer.setAttribute('style', 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999; overflow: visible; opacity: 0; transition: opacity 0.2s ease;');
  tetherLayer.innerHTML = `
    <line id="tether-line" stroke="#FFFFFF" stroke-width="2"/>
    <circle id="tether-dot" r="5" fill="#FFFFFF" stroke="#00875A" stroke-width="1.5"/>
  `;
  container.appendChild(tetherLayer);

  const tetherLine = tetherLayer.querySelector('#tether-line');
  const tetherDot = tetherLayer.querySelector('#tether-dot');

  // ── 4. Floating Wilaya Tooltip Card ──
  const wilayaTooltip = document.createElement('div');
  wilayaTooltip.setAttribute('id', 'wilaya-tooltip');
  wilayaTooltip.setAttribute('style', 'position: absolute; opacity: 0; pointer-events: none; z-index: 10000; background: #fff; padding: 10px 20px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); font-weight: bold; font-family: "Tajawal", sans-serif; color: #111; border: 1px solid rgba(0,135,90,0.2); transition: opacity 0.2s ease; white-space: nowrap;');
  container.appendChild(wilayaTooltip);

  // ── 5. Create Floating Controls ──
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

  // ── 6. Status / Nav Hint Badge ──
  const navHint = document.createElement('div');
  navHint.className = 'map-nav-hint';
  navHint.innerHTML = `
    <span class="map-nav-hint-dot"></span>
    <span data-i18n="map.subtitle">${t('map.subtitle')}</span>
  `;
  container.appendChild(navHint);

  // ── 7. Fade Overlay for Route Transition ──
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

  // ── 8. State variables for interactions ──
  const wilayaPaths = [];
  let isTransitioning = false;
  let isHoveringState = false;

  // ── 9. Tooltip Coordinate Calculation (Continuous connection & 60 FPS RAF) ──
  function updateTooltipCoords(clientX, clientY) {
    if (!isHoveringState || isTransitioning) return;
    const rect = container.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const tipWidth = wilayaTooltip.offsetWidth || 140;
    const tipHeight = wilayaTooltip.offsetHeight || 44;

    let posX = mouseX + 40;
    let posY = mouseY - 60;

    // Flip horizontally if near right boundary
    if (posX + tipWidth > rect.width - 15) {
      posX = mouseX - tipWidth - 40;
    }

    // Flip vertically if near top boundary
    if (posY < 15) {
      posY = mouseY + 30;
    }

    // Position tooltip
    wilayaTooltip.style.left = `${posX}px`;
    wilayaTooltip.style.top = `${posY}px`;

    // Update white dot at exact cursor tip
    tetherDot.setAttribute('cx', mouseX);
    tetherDot.setAttribute('cy', mouseY);

    // Update solid white tether line from cursor tip to closest card edge
    const anchorX = (posX < mouseX) ? posX + tipWidth : posX;
    const anchorY = posY + tipHeight / 2;
    tetherLine.setAttribute('x1', mouseX);
    tetherLine.setAttribute('y1', mouseY);
    tetherLine.setAttribute('x2', anchorX);
    tetherLine.setAttribute('y2', anchorY);
  }

  // ── 10. Render All Wilaya Paths (Zero Static Text) ──
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

    // Hover: display Wilaya name and show solid white tether line with white dot
    path.addEventListener('mouseenter', (e) => {
      if (isTransitioning) return;
      const lang = store.state.lang;
      const displayName = lang === 'ar' 
        ? (wilaya.nameAr || wilaya.name) 
        : (lang === 'en' ? (wilaya.nameEn || wilaya.name) : (wilaya.nameFr || wilaya.name));
      wilayaTooltip.innerHTML = `<span style="color:#00875A; font-weight:800; margin-inline-end:8px;">${wilaya.code}</span><span>${displayName}</span>`;
      wilayaTooltip.style.opacity = '1';
      tetherLayer.style.opacity = '1';
      isHoveringState = true;
      updateTooltipCoords(e.clientX, e.clientY);
    });

    path.addEventListener('mouseleave', () => {
      isHoveringState = false;
      wilayaTooltip.style.opacity = '0';
      tetherLayer.style.opacity = '0';
    });

    // Click handler for 2-Second Cinematic Flash Zoom
    path.addEventListener('click', () => {
      if (dragDistance > 6 || isTransitioning) return;
      handleStateClick(wilaya, path);
    });
  });

  container.appendChild(svg);

  // Global mousemove tracker on container for 60FPS RAF updating
  container.addEventListener('mousemove', (e) => {
    if (isHoveringState && !isTransitioning) {
      if (typeof window !== 'undefined' && window.requestAnimationFrame) {
        window.requestAnimationFrame(() => updateTooltipCoords(e.clientX, e.clientY));
      } else {
        updateTooltipCoords(e.clientX, e.clientY);
      }
    }
  });

  // ══════════════════════════════════════════════════════════════
  // MATHEMATICALLY SOUND PAN & ZOOM (GPU translate3d)
  // ══════════════════════════════════════════════════════════════
  let scale = 1.0;
  let translateX = 0;
  let translateY = 0;
  const minScale = 1.0;
  const maxScale = 12.0;

  let isDragging = false;
  let lastScreenX = 0;
  let lastScreenY = 0;
  let dragDistance = 0;

  function screenToSvgCoords(clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: vbCenterX, y: vbCenterY };
    return pt.matrixTransform(ctm.inverse());
  }

  function clampBounds() {
    if (scale <= 1.01) {
      scale = 1.0;
      translateX = 0;
      translateY = 0;
      return;
    }

    const maxOffsetRatio = 0.55;
    const baseTx = vbCenterX * (1 - scale);
    const baseTy = vbCenterY * (1 - scale);
    const maxDeltaX = (scale - 1) * vbW * maxOffsetRatio;
    const maxDeltaY = (scale - 1) * vbH * maxOffsetRatio;

    translateX = Math.min(Math.max(translateX, baseTx - maxDeltaX), baseTx + maxDeltaX);
    translateY = Math.min(Math.max(translateY, baseTy - maxDeltaY), baseTy + maxDeltaY);
  }

  function applyTransform() {
    mapGroup.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
  }

  // ── Wheel Zoom Anchored to Mouse Cursor ──
  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (isTransitioning) return;
    mapGroup.classList.remove('smooth-zoom');

    const cursor = screenToSvgCoords(e.clientX, e.clientY);
    const mapPointX = (cursor.x - translateX) / scale;
    const mapPointY = (cursor.y - translateY) / scale;

    const zoomMultiplier = e.deltaY < 0 ? 1.18 : 0.85;
    const newScale = Math.min(Math.max(scale * zoomMultiplier, minScale), maxScale);

    if (newScale === scale) return;

    scale = newScale;

    if (scale <= 1.01) {
      scale = 1.0;
      translateX = 0;
      translateY = 0;
    } else {
      translateX = cursor.x - scale * mapPointX;
      translateY = cursor.y - scale * mapPointY;
      clampBounds();
    }

    applyTransform();
  }, { passive: false });

  // ── Unified Mouse & Touch Drag-to-Pan (Zero CSS transitions for 60fps) ──
  svg.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || isTransitioning) return;
    isDragging = true;
    dragDistance = 0;
    lastScreenX = e.clientX;
    lastScreenY = e.clientY;
    svg.classList.add('is-dragging');
    mapGroup.classList.remove('smooth-zoom');
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging || isTransitioning) return;

    const ptPrev = screenToSvgCoords(lastScreenX, lastScreenY);
    const ptCurr = screenToSvgCoords(e.clientX, e.clientY);

    translateX += (ptCurr.x - ptPrev.x);
    translateY += (ptCurr.y - ptPrev.y);

    const movementX = e.movementX ?? (e.clientX - lastScreenX);
    const movementY = e.movementY ?? (e.clientY - lastScreenY);
    dragDistance += Math.hypot(movementX, movementY);
    lastScreenX = e.clientX;
    lastScreenY = e.clientY;

    clampBounds();
    applyTransform();
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    svg.classList.remove('is-dragging');
  });

  // ── Touch Event Listeners for Mobile / Tablets ──
  let lastTouchDist = 0;

  svg.addEventListener('touchstart', (e) => {
    if (isTransitioning) return;
    mapGroup.classList.remove('smooth-zoom');

    if (e.touches.length === 1) {
      isDragging = true;
      dragDistance = 0;
      lastScreenX = e.touches[0].clientX;
      lastScreenY = e.touches[0].clientY;
      svg.classList.add('is-dragging');
    } else if (e.touches.length === 2) {
      isDragging = false;
      lastTouchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, { passive: true });

  svg.addEventListener('touchmove', (e) => {
    if (isTransitioning) return;

    // Single-finger Pan
    if (e.touches.length === 1 && isDragging) {
      // Prevent browser page scrolling during active map drag
      if (e.cancelable) e.preventDefault();

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;

      const movementX = currentX - lastScreenX;
      const movementY = currentY - lastScreenY;

      const ptPrev = screenToSvgCoords(lastScreenX, lastScreenY);
      const ptCurr = screenToSvgCoords(currentX, currentY);

      translateX += (ptCurr.x - ptPrev.x);
      translateY += (ptCurr.y - ptPrev.y);

      dragDistance += Math.hypot(movementX, movementY);
      lastScreenX = currentX;
      lastScreenY = currentY;

      clampBounds();
      applyTransform();
    } 
    // Two-finger Pinch Zoom
    else if (e.touches.length === 2) {
      if (e.cancelable) e.preventDefault();

      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );

      if (lastTouchDist > 0) {
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const cursor = screenToSvgCoords(midX, midY);
        const mapPointX = (cursor.x - translateX) / scale;
        const mapPointY = (cursor.y - translateY) / scale;

        const factor = dist / lastTouchDist;
        const newScale = Math.min(Math.max(scale * factor, minScale), maxScale);

        scale = newScale;
        translateX = cursor.x - scale * mapPointX;
        translateY = cursor.y - scale * mapPointY;
        clampBounds();
        applyTransform();
      }
      lastTouchDist = dist;
    }
  }, { passive: false });

  svg.addEventListener('touchend', (e) => {
    if (e.touches.length === 0) {
      isDragging = false;
      lastTouchDist = 0;
      svg.classList.remove('is-dragging');
    } else if (e.touches.length === 1) {
      // Smoothly transition from pinch zoom back to 1-finger pan
      isDragging = true;
      lastScreenX = e.touches[0].clientX;
      lastScreenY = e.touches[0].clientY;
      lastTouchDist = 0;
    }
  });

  svg.addEventListener('touchcancel', () => {
    isDragging = false;
    lastTouchDist = 0;
    svg.classList.remove('is-dragging');
  });

  // ── Floating Control Buttons ──
  const btnZoomIn = controls.querySelector('#map-zoom-in');
  const btnZoomOut = controls.querySelector('#map-zoom-out');
  const btnReset = controls.querySelector('#map-reset-view');

  btnZoomIn.addEventListener('click', () => {
    if (isTransitioning) return;
    mapGroup.classList.add('smooth-zoom');
    const newScale = Math.min(scale * 1.4, maxScale);
    const mapCenterX = (vbCenterX - translateX) / scale;
    const mapCenterY = (vbCenterY - translateY) / scale;

    scale = newScale;
    translateX = vbCenterX - scale * mapCenterX;
    translateY = vbCenterY - scale * mapCenterY;
    clampBounds();
    applyTransform();
    setTimeout(() => mapGroup.classList.remove('smooth-zoom'), 600);
  });

  btnZoomOut.addEventListener('click', () => {
    if (isTransitioning) return;
    mapGroup.classList.add('smooth-zoom');
    const newScale = Math.max(scale / 1.4, minScale);
    if (newScale <= 1.01) {
      scale = 1.0;
      translateX = 0;
      translateY = 0;
    } else {
      const mapCenterX = (vbCenterX - translateX) / scale;
      const mapCenterY = (vbCenterY - translateY) / scale;
      scale = newScale;
      translateX = vbCenterX - scale * mapCenterX;
      translateY = vbCenterY - scale * mapCenterY;
      clampBounds();
    }
    applyTransform();
    setTimeout(() => mapGroup.classList.remove('smooth-zoom'), 600);
  });

  btnReset.addEventListener('click', () => {
    if (isTransitioning) return;
    mapGroup.classList.add('smooth-zoom');
    scale = 1.0;
    translateX = 0;
    translateY = 0;
    applyTransform();
    setTimeout(() => mapGroup.classList.remove('smooth-zoom'), 600);
  });

  // ══════════════════════════════════════════════════════════════
  // 2-SECOND DELAY & FLASHING BORDER ON CLICK
  // ══════════════════════════════════════════════════════════════
  function handleStateClick(targetWilaya, pathEl) {
    isTransitioning = true;
    isHoveringState = false;
    wilayaTooltip.style.opacity = '0';
    tetherLayer.style.opacity = '0';

    // ── Step A: Immediately smoothly zoom / center the clicked state ──
    const bbox = pathEl.getBBox();
    const stateCenterX = bbox.x + bbox.width / 2;
    const stateCenterY = bbox.y + bbox.height / 2;

    const fitScaleX = (vbW * 0.80) / bbox.width;
    const fitScaleY = (vbH * 0.80) / bbox.height;
    const neededScale = Math.min(fitScaleX, fitScaleY);
    const targetScale = Math.min(Math.max(neededScale, 1.0), 8.0);

    const finalScale = (scale >= targetScale) ? scale : targetScale;
    const targetTx = vbCenterX - finalScale * stateCenterX;
    const targetTy = vbCenterY - finalScale * stateCenterY;

    // ── Step B: Immediately apply .is-selected-flash and fade sibling wilayas ──
    wilayaPaths.forEach(({ path, wilaya }) => {
      if (wilaya.code !== targetWilaya.code) {
        path.classList.add('faded');
        path.classList.remove('is-selected-flash');
      } else {
        path.classList.add('is-selected-flash');
        path.classList.remove('faded');
      }
    });

    // Execute smooth GPU camera motion to center
    mapGroup.classList.add('smooth-zoom');
    scale = finalScale;
    translateX = targetTx;
    translateY = targetTy;
    applyTransform();

    // ── Step C: STRICT setTimeout of EXACTLY 2000ms (2 Seconds) ──
    setTimeout(() => {
      // ── Step D: Inside 2000ms callback, fade out screen & route transition ──
      fadeOverlay.classList.add('active');

      setTimeout(() => {
        mapGroup.classList.remove('smooth-zoom');
        store.setState({ selectedWilaya: targetWilaya });
        navigate(`#/wilaya/${targetWilaya.code}`);
      }, 300);
    }, 2000);
  }

  // Reactive language change
  store.subscribe('lang', () => {
    svg.setAttribute('aria-label', t('map.title'));
  });
}
