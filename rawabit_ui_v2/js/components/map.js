/**
 * Rawabit v2 — Interactive SVG Map of Algeria
 * Renders all 48 wilayas as interactive SVG paths with hover effects,
 * labels, tooltips, and click-to-zoom transitions.
 */
import { MAP_VIEWBOX, WILAYAS } from './map-paths.js';
import { store } from '../store.js';
import { t } from '../i18n.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Create and return the full interactive SVG map element
 * @param {HTMLElement} container - The element to append the map into
 */
export function renderMap(container) {
  // Clear existing
  container.innerHTML = '';

  // ── Create SVG ──
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', MAP_VIEWBOX);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.classList.add('map-svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', t('map.title'));

  // ── Tooltip element ──
  const tooltip = document.createElement('div');
  tooltip.className = 'map-tooltip';
  tooltip.innerHTML = `
    <div class="map-tooltip-name"></div>
    <div class="map-tooltip-name-ar"></div>
    <div class="map-tooltip-count"></div>
  `;
  container.appendChild(tooltip);

  const tooltipName = tooltip.querySelector('.map-tooltip-name');
  const tooltipNameAr = tooltip.querySelector('.map-tooltip-name-ar');
  const tooltipCount = tooltip.querySelector('.map-tooltip-count');

  // ── Render each wilaya ──
  const groups = [];

  WILAYAS.forEach(wilaya => {
    const g = document.createElementNS(SVG_NS, 'g');
    g.classList.add('wilaya-group');
    g.dataset.code = wilaya.code;
    g.dataset.name = wilaya.name;

    // Path
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', wilaya.d);
    path.classList.add('wilaya-path');

    // Label — only show for wilayas with enough area
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', wilaya.cx);
    label.setAttribute('y', wilaya.cy);
    label.setAttribute('font-size', wilaya.labelSize);
    label.classList.add('wilaya-label');

    // Use Arabic or Latin name based on current language
    const lang = store.state.lang;
    label.textContent = (lang === 'ar' && wilaya.nameAr) ? wilaya.nameAr : wilaya.name;

    // Hide labels for very small wilayas (they'll show in tooltip on hover)
    if (wilaya.area < 1) {
      label.style.opacity = '0';
      label.classList.add('compact-label');
    }

    g.appendChild(path);
    g.appendChild(label);
    svg.appendChild(g);
    groups.push({ g, path, label, wilaya });

    // ── Hover: show tooltip + reveal compact labels ──
    g.addEventListener('mouseenter', (e) => {
      tooltipName.textContent = wilaya.name;
      tooltipNameAr.textContent = wilaya.nameAr;
      tooltipCount.textContent = `${wilaya.code} · ${wilaya.name}`;
      tooltip.classList.add('visible');

      // Reveal compact label on hover
      if (label.classList.contains('compact-label')) {
        label.style.opacity = '1';
      }
    });

    g.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left + 16;
      const y = e.clientY - rect.top - 8;
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
    });

    g.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
      if (label.classList.contains('compact-label')) {
        label.style.opacity = '0';
      }
    });

    // ── Click: zoom into wilaya ──
    g.addEventListener('click', () => {
      zoomToWilaya(svg, groups, wilaya, container);
    });
  });

  container.appendChild(svg);

  // ── React to language changes ──
  store.subscribe('lang', (newLang) => {
    groups.forEach(({ label, wilaya }) => {
      label.textContent = (newLang === 'ar' && wilaya.nameAr)
        ? wilaya.nameAr
        : wilaya.name;
    });
    svg.setAttribute('aria-label', t('map.title'));
  });
}

/**
 * Zoom into a specific wilaya with a smooth CSS transform,
 * then transition to the profiles view.
 */
function zoomToWilaya(svg, groups, targetWilaya, container) {
  // Parse current viewBox
  const vbParts = MAP_VIEWBOX.split(' ').map(Number);
  const [vbX, vbY, vbW, vbH] = vbParts;

  // Get the target wilaya's bounding box in SVG coordinates
  const targetGroup = groups.find(g => g.wilaya.code === targetWilaya.code);
  if (!targetGroup) return;

  const pathEl = targetGroup.path;
  const bbox = pathEl.getBBox();

  // Calculate the center of the target in SVG units
  const centerX = bbox.x + bbox.width / 2;
  const centerY = bbox.y + bbox.height / 2;

  // Calculate scale factor (zoom to fill ~40% of viewport)
  const scaleX = vbW / (bbox.width * 2.5);
  const scaleY = vbH / (bbox.height * 2.5);
  const scale = Math.min(scaleX, scaleY, 8); // Max 8x zoom

  // Calculate translate to center the target
  const svgRect = svg.getBoundingClientRect();
  const svgCenterX = vbX + vbW / 2;
  const svgCenterY = vbY + vbH / 2;

  const translateX = (svgCenterX - centerX);
  const translateY = (svgCenterY - centerY);

  // Fade all other wilayas
  groups.forEach(({ path, label, wilaya }) => {
    if (wilaya.code !== targetWilaya.code) {
      path.classList.add('faded');
      label.classList.add('faded');
    } else {
      path.classList.add('active');
    }
  });

  // Apply zoom transform
  svg.classList.add('zooming');
  svg.style.transformOrigin = 'center center';
  svg.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;

  // After zoom animation completes, navigate to profiles
  setTimeout(() => {
    // Store the selected wilaya
    store.setState({ selectedWilaya: targetWilaya });

    // Reset the map state (for when user comes back)
    setTimeout(() => {
      svg.classList.remove('zooming');
      svg.style.transform = '';
      groups.forEach(({ path, label }) => {
        path.classList.remove('faded', 'active');
        label.classList.remove('faded');
      });
    }, 100);

    // Navigate to wilaya profiles view (will be implemented in Step 2)
    // For now, we just show the zoom effect and reset
    // navigate(`#/wilaya/${targetWilaya.code}`);
  }, 700);
}
