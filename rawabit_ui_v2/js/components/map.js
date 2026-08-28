/**
 * Rawabit v2 — Interactive Algeria SVG Map
 * Mathematically Sound Pan/Zoom Engine · Smart Typography Fitting · Click-to-Center
 * Strictly Vanilla JS · Zero External Dependencies
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

  // ── 2. Create the Root Transform Group ──
  const mapGroup = document.createElementNS(SVG_NS, 'g');
  mapGroup.setAttribute('id', 'map-group');
  svg.appendChild(mapGroup);

  // ── 3. Create Tooltip Element ──
  const tooltip = document.createElement('div');
  tooltip.className = 'map-tooltip';
  tooltip.innerHTML = `
    <span class="map-tooltip-badge" id="tooltip-code">16</span>
    <span class="map-tooltip-title" id="tooltip-title">Alger</span>
    <span class="map-tooltip-sub" id="tooltip-sub">الجزائر</span>
  `;
  container.appendChild(tooltip);

  const tooltipCode = tooltip.querySelector('#tooltip-code');
  const tooltipTitle = tooltip.querySelector('#tooltip-title');
  const tooltipSub = tooltip.querySelector('#tooltip-sub');

  // ── 4. Create Floating Controls ──
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

  // ── 5. Status / Nav Hint Badge ──
  const navHint = document.createElement('div');
  navHint.className = 'map-nav-hint';
  navHint.innerHTML = `
    <span class="map-nav-hint-dot"></span>
    <span data-i18n="map.subtitle">${t('map.subtitle')}</span>
  `;
  container.appendChild(navHint);

  // ── 6. Fade-out Overlay for Route Transition ──
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

  // ── 7. Render All Wilaya Paths & Labels ──
  const wilayaItems = [];

  WILAYAS.forEach(wilaya => {
    const g = document.createElementNS(SVG_NS, 'g');
    g.classList.add('wilaya-group');
    g.dataset.code = wilaya.code;
    g.dataset.name = wilaya.name;

    // Wilaya boundary path with non-scaling stroke
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', wilaya.d);
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    path.classList.add('wilaya-path');
    g.appendChild(path);

    // Wilaya center text label
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', wilaya.cx);
    label.setAttribute('y', wilaya.cy);
    label.setAttribute('font-size', wilaya.labelSize);
    label.classList.add('wilaya-label');

    const currentLang = store.state.lang;
    label.textContent = (currentLang === 'ar' && wilaya.nameAr) ? wilaya.nameAr : wilaya.name;

    g.appendChild(label);
    mapGroup.appendChild(g);

    wilayaItems.push({ g, path, label, wilaya, bbox: null, textWidth: null });

    // ── Hover Micro-interactions ──
    g.addEventListener('mouseenter', () => {
      const isArabic = store.state.lang === 'ar';
      tooltipCode.textContent = wilaya.code;
      tooltipTitle.textContent = isArabic ? wilaya.nameAr : wilaya.name;
      tooltipSub.textContent = isArabic ? wilaya.name : wilaya.nameAr;
      tooltip.classList.add('visible');
      label.style.opacity = '1';
    });

    g.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
    });

    g.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
      updateSingleLabelVisibility(wilayaItems.find(item => item.wilaya.code === wilaya.code));
    });

    // ── Click to Zoom & Transition ──
    g.addEventListener('click', (e) => {
      if (dragDistance > 6) return;
      zoomToWilayaAndTransition(wilaya, path);
    });
  });

  container.appendChild(svg);

  // ══════════════════════════════════════════════════════════════
  // MATHEMATICAL COORDINATE TRANSFORM HELPERS
  // ══════════════════════════════════════════════════════════════

  /**
   * Convert Screen Client (X, Y) to exact Root SVG Coordinate Space
   */
  function screenToSvgCoords(clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: vbCenterX, y: vbCenterY };
    return pt.matrixTransform(ctm.inverse());
  }

  // ══════════════════════════════════════════════════════════════
  // STATE MANAGEMENT FOR PAN & ZOOM
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

  /**
   * Measure bounding boxes and text lengths once rendered
   */
  function measureElements() {
    wilayaItems.forEach(item => {
      try {
        if (!item.bbox) {
          item.bbox = item.path.getBBox();
        }
        if (!item.textWidth) {
          item.textWidth = item.label.getComputedTextLength() || (item.wilaya.name.length * item.wilaya.labelSize * 0.6);
        }
      } catch (e) {
        item.bbox = { x: item.wilaya.cx - 0.5, y: item.wilaya.cy - 0.5, width: 1, height: 1 };
        item.textWidth = 1;
      }
    });
  }

  /**
   * Smart Typography Algorithm
   * Compares state effective width with text label width at current scale
   */
  function updateSingleLabelVisibility(item) {
    if (!item) return;
    const { bbox, textWidth, label, wilaya } = item;
    if (!bbox) return;

    // Effective state width in SVG units when zoomed
    const effectiveWidth = bbox.width * scale;
    const requiredWidth = (textWidth || 1) * 0.92;

    // Fit condition: state must be wide enough to contain text without colliding
    const fits = (effectiveWidth >= requiredWidth) || (wilaya.area >= 6.0 && scale >= 1.0);

    if (fits) {
      label.classList.add('visible');
      label.style.opacity = '1';
    } else {
      label.classList.remove('visible');
      label.style.opacity = '0';
    }
  }

  function updateTypography() {
    wilayaItems.forEach(updateSingleLabelVisibility);
  }

  /**
   * Constrain Pan translation bounds so map never gets lost outside container
   */
  function clampBounds() {
    if (scale <= 1.01) {
      scale = 1.0;
      translateX = 0;
      translateY = 0;
      return;
    }

    // Centered zoom bounds
    const maxOffsetRatio = 0.5;
    const baseTx = vbCenterX * (1 - scale);
    const baseTy = vbCenterY * (1 - scale);
    const maxDeltaX = (scale - 1) * vbW * maxOffsetRatio;
    const maxDeltaY = (scale - 1) * vbH * maxOffsetRatio;

    translateX = Math.min(Math.max(translateX, baseTx - maxDeltaX), baseTx + maxDeltaX);
    translateY = Math.min(Math.max(translateY, baseTy - maxDeltaY), baseTy + maxDeltaY);
  }

  /**
   * Apply transforms to #map-group
   */
  function applyTransform() {
    mapGroup.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
    updateTypography();
  }

  // Measure initial elements after layout frame
  requestAnimationFrame(() => {
    measureElements();
    updateTypography();
  });

  // ══════════════════════════════════════════════════════════════
  // MOUSE WHEEL ZOOM (Mathematical Invariance under Cursor)
  // ══════════════════════════════════════════════════════════════
  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    mapGroup.classList.remove('animating');

    // 1. Get exact cursor location in Root SVG coordinates
    const cursor = screenToSvgCoords(e.clientX, e.clientY);

    // 2. Map point under cursor before zoom
    const mapPointX = (cursor.x - translateX) / scale;
    const mapPointY = (cursor.y - translateY) / scale;

    // 3. Calculate new scale
    const zoomMultiplier = e.deltaY < 0 ? 1.18 : 0.85;
    const newScale = Math.min(Math.max(scale * zoomMultiplier, minScale), maxScale);

    if (newScale === scale) return;

    // 4. Update scale & adjust translations to keep mapPoint stationary under cursor
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

  // ══════════════════════════════════════════════════════════════
  // MOUSE DRAG TO PAN
  // ══════════════════════════════════════════════════════════════
  svg.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Left click only
    isDragging = true;
    dragDistance = 0;
    lastScreenX = e.clientX;
    lastScreenY = e.clientY;
    svg.classList.add('is-dragging');
    mapGroup.classList.remove('animating');
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    // Convert screen movement delta to SVG root coordinate delta
    const ptPrev = screenToSvgCoords(lastScreenX, lastScreenY);
    const ptCurr = screenToSvgCoords(e.clientX, e.clientY);

    const deltaX = ptCurr.x - ptPrev.x;
    const deltaY = ptCurr.y - ptPrev.y;

    translateX += deltaX;
    translateY += deltaY;

    dragDistance += Math.hypot(e.movementX || (e.clientX - lastScreenX), e.movementY || (e.clientY - lastScreenY));
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

  // ══════════════════════════════════════════════════════════════
  // TOUCH CONTROLS (Mobile / Tablets)
  // ══════════════════════════════════════════════════════════════
  let lastTouchPinchDist = 0;

  svg.addEventListener('touchstart', (e) => {
    mapGroup.classList.remove('animating');
    if (e.touches.length === 1) {
      isDragging = true;
      dragDistance = 0;
      lastScreenX = e.touches[0].clientX;
      lastScreenY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      isDragging = false;
      lastTouchPinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, { passive: true });

  svg.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && isDragging) {
      const ptPrev = screenToSvgCoords(lastScreenX, lastScreenY);
      const ptCurr = screenToSvgCoords(e.touches[0].clientX, e.touches[0].clientY);

      translateX += (ptCurr.x - ptPrev.x);
      translateY += (ptCurr.y - ptPrev.y);

      dragDistance += Math.hypot(e.touches[0].clientX - lastScreenX, e.touches[0].clientY - lastScreenY);
      lastScreenX = e.touches[0].clientX;
      lastScreenY = e.touches[0].clientY;

      clampBounds();
      applyTransform();
    } else if (e.touches.length === 2) {
      const pinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );

      if (lastTouchPinchDist > 0) {
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const cursor = screenToSvgCoords(midX, midY);
        const mapPointX = (cursor.x - translateX) / scale;
        const mapPointY = (cursor.y - translateY) / scale;

        const factor = pinchDist / lastTouchPinchDist;
        const newScale = Math.min(Math.max(scale * factor, minScale), maxScale);

        scale = newScale;
        translateX = cursor.x - scale * mapPointX;
        translateY = cursor.y - scale * mapPointY;
        clampBounds();
        applyTransform();
      }
      lastTouchPinchDist = pinchDist;
    }
  }, { passive: true });

  svg.addEventListener('touchend', () => {
    isDragging = false;
    lastTouchPinchDist = 0;
  });

  // ══════════════════════════════════════════════════════════════
  // FLOATING CONTROL BUTTONS
  // ══════════════════════════════════════════════════════════════
  const btnZoomIn = controls.querySelector('#map-zoom-in');
  const btnZoomOut = controls.querySelector('#map-zoom-out');
  const btnReset = controls.querySelector('#map-reset-view');

  btnZoomIn.addEventListener('click', () => {
    mapGroup.classList.add('animating');
    const newScale = Math.min(scale * 1.4, maxScale);
    const mapCenterX = (vbCenterX - translateX) / scale;
    const mapCenterY = (vbCenterY - translateY) / scale;

    scale = newScale;
    translateX = vbCenterX - scale * mapCenterX;
    translateY = vbCenterY - scale * mapCenterY;
    clampBounds();
    applyTransform();
  });

  btnZoomOut.addEventListener('click', () => {
    mapGroup.classList.add('animating');
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
  });

  btnReset.addEventListener('click', () => {
    mapGroup.classList.add('animating');
    scale = 1.0;
    translateX = 0;
    translateY = 0;
    applyTransform();
  });

  // ══════════════════════════════════════════════════════════════
  // CLICK-TO-CENTER & TRANSITION
  // ══════════════════════════════════════════════════════════════
  function zoomToWilayaAndTransition(targetWilaya, pathEl) {
    tooltip.classList.remove('visible');

    // Calculate exact visual center of target state using getBBox()
    const bbox = pathEl.getBBox();
    const stateCenterX = bbox.x + bbox.width / 2;
    const stateCenterY = bbox.y + bbox.height / 2;

    // Calculate target scale to frame the wilaya comfortably
    const targetScale = Math.min(Math.max(vbW / (Math.max(bbox.width, bbox.height) * 2.3), 3.4), 9.5);

    // Calculate translation so (stateCenterX, stateCenterY) lands precisely at (vbCenterX, vbCenterY)
    const targetTx = vbCenterX - targetScale * stateCenterX;
    const targetTy = vbCenterY - targetScale * stateCenterY;

    // Visual State: isolate selected wilaya and fade siblings
    wilayaItems.forEach(({ path, label, wilaya }) => {
      if (wilaya.code !== targetWilaya.code) {
        path.classList.add('faded');
        label.classList.add('faded');
      } else {
        path.classList.add('active');
        label.classList.remove('faded');
        label.style.opacity = '1';
      }
    });

    // Animate smoothly to center
    mapGroup.classList.add('animating');
    scale = targetScale;
    translateX = targetTx;
    translateY = targetTy;
    applyTransform();

    // Trigger fade overlay & navigate
    setTimeout(() => {
      fadeOverlay.classList.add('active');

      setTimeout(() => {
        store.setState({ selectedWilaya: targetWilaya });
        navigate(`#/wilaya/${targetWilaya.code}`);
      }, 250);
    }, 600);
  }

  // ── Reactive Language Subscription ──
  store.subscribe('lang', (newLang) => {
    const isArabic = newLang === 'ar';
    wilayaItems.forEach(({ label, wilaya }) => {
      label.textContent = (isArabic && wilaya.nameAr) ? wilaya.nameAr : wilaya.name;
    });
    svg.setAttribute('aria-label', t('map.title'));
    measureElements();
    updateTypography();
  });
}
