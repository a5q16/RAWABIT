/**
 * Rawabit v2 — Algeria Interactive Map with Cinematic Motion Choreography
 * 1. Base Map: 1:1 Google Maps Panning, Crisp 1px Borders, Solid White Line Tethered Tooltip
 * 2. Click 1 Choreography:
 *    - T=0.0s: Smooth Camera Zoom & Center on Wilaya (No blur yet)
 *    - T=0.4s: Wilaya path flashes with emerald pulse
 *    - T=0.5s: Fade in true translucent glass blur backdrop (rgba(20, 45, 35, 0.2) + blur(25px)) behind Wilaya
 *    - T=0.7s: Draw 4 glowing SVG vector lines (stroke: rgba(52, 211, 153, 0.6)) from Wilaya center to 4 cards
 *    - T=1.0s: Fade in 4 HUD Cards (Name, Verified Talents, Specialties, Universities) + Sleek Top Typography
 * 3. Click 2 "Breathe Out" Exit & Isolated Loading:
 *    - T=0.0s: Cards, lines, top typography, and cloned Wilaya scale down & fade out (opacity: 0)
 *    - T=0.3s: Center Loader appears in the empty blurred void
 *    - T=0.8s: Navigates cleanly to renderProfiles(wilayaCode)
 * 4. Reversal: Click background -> Smooth fade out & camera zooms out to national view
 */

import { MAP_VIEWBOX, WILAYAS } from './map-paths.js';
import { getProfilesByWilaya } from '../data/profiles-data.js';
import { store } from '../store.js';
import { t } from '../i18n.js';
import { navigate } from '../router.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const BASE_VB = { x: -9.17, y: -37.59, w: 21.66, h: 19.13 };

// Authentic Algerian Universities & Academic Centers by Wilaya Code
const WILAYA_ACADEMIC_DATA = {
  '01': { unis: ['Univ Adrar (Ahmed Draia)'], specs: ['Energy & Solar', 'Agronomy', 'Geosciences'] },
  '02': { unis: ['Univ Chlef (Hassiba Benbouali)'], specs: ['Civil Engineering', 'Agronomy', 'Computer Science'] },
  '03': { unis: ['Univ Laghouat (Amar Telidji)', 'ENS Laghouat'], specs: ['Renewable Energy', 'Civil Engineering', 'Applied Mathematics'] },
  '04': { unis: ['Univ Oum El Bouaghi (Larbi Ben M\'hidi)'], specs: ['Biotechnology', 'Telecommunications', 'Mechanical Eng'] },
  '05': { unis: ['Univ Batna 1 (Hadj Lakhdar)', 'Univ Batna 2 (Mostefa Ben Boulaïd)'], specs: ['Industrial Safety', 'Artificial Intelligence', 'Electronics'] },
  '06': { unis: ['Univ Béjaïa (Abderrahmane Mira)'], specs: ['Food Technology', 'Biochemistry', 'Renewable Energy'] },
  '07': { unis: ['Univ Biskra (Mohamed Khider)'], specs: ['Agritech & Dates', 'Hydraulics', 'Physics & Materials'] },
  '08': { unis: ['Univ Béchar (Tahri Mohamed)'], specs: ['Solar Energy', 'Mining & Earth Sciences', 'Electrical Eng'] },
  '09': { unis: ['Univ Blida 1 (Saad Dahlab)', 'Univ Blida 2', 'Aeronautics Institute'], specs: ['Aeronautics & Aerospace', 'Biotech', 'Medicine'] },
  '10': { unis: ['Univ Bouira (Akli Mohand Oulhadj)'], specs: ['Materials Science', 'Computer Engineering', 'Hydraulics'] },
  '11': { unis: ['Univ Tamanrasset (Hadj Moussa)'], specs: ['Geology & Mining', 'Renewable Systems', 'Environmental Studies'] },
  '12': { unis: ['Univ Tébessa (Larbi Tébessi)'], specs: ['Mining Engineering', 'Earth Sciences', 'Applied Chemistry'] },
  '13': { unis: ['Univ Tlemcen (Abou Bekr Belkaïd)', 'ESSA Tlemcen'], specs: ['Telecommunications', 'Biomedical Engineering', 'Cybersecurity'] },
  '14': { unis: ['Univ Tiaret (Ibn Khaldoun)', 'ENS Tiaret'], specs: ['Veterinary Sciences', 'Agronomy', 'Applied Mechanics'] },
  '15': { unis: ['Univ Tizi Ouzou (Mouloud Mammeri)'], specs: ['Software Engineering', 'Electronics', 'Mechanical Eng'] },
  '16': { unis: ['USTHB Bab Ezzouar', 'Univ Algiers 1 (Benyoucef Benkhedda)', 'ESI (Computer Science School)', 'ENSIA (National AI School)'], specs: ['Artificial Intelligence', 'Cybersecurity', 'Biotech', 'Petroleum Systems', 'Robotics'] },
  '17': { unis: ['Univ Djelfa (Ziane Achour)'], specs: ['Civil Engineering', 'Agronomy', 'Renewable Energy'] },
  '18': { unis: ['Univ Jijel (Mohammed Seddik Benyahia)'], specs: ['Marine Sciences', 'Metallurgy', 'Computer Networks'] },
  '19': { unis: ['Univ Sétif 1 (Ferhat Abbas)', 'Univ Sétif 2'], specs: ['Optics & Precision Mechanics', 'Data Science', 'Nanotechnology'] },
  '20': { unis: ['Univ Saïda (Tahar Moulay)'], specs: ['Mathematics', 'Computer Science', 'Materials Science'] },
  '21': { unis: ['Univ Skikda (August 20, 1955)'], specs: ['Petrochemical Engineering', 'Process Engineering', 'Polymers'] },
  '22': { unis: ['Univ Sidi Bel Abbès (Djillali Liabes)', 'ESI Sidi Bel Abbès'], specs: ['Electronics & DSP', 'Artificial Intelligence', 'Smart Grids'] },
  '23': { unis: ['Univ Annaba (Badji Mokhtar)', 'ENSMM Mining & Metallurgy'], specs: ['Metallurgy & Steel', 'Computer Science', 'Biomedical'] },
  '24': { unis: ['Univ Guelma (8 Mai 1945)'], specs: ['Automatic Control', 'Robotics', 'Telecommunications'] },
  '25': { unis: ['Univ Constantine 1 (Frères Mentouri)', 'Univ Constantine 2', 'ENPC Biotechnology'], specs: ['Nanotechnology', 'Biotechnology', 'Process Engineering'] },
  '26': { unis: ['Univ Médéa (Yahia Farès)'], specs: ['Renewable Energy', 'Agri-food Process', 'Mechanical Design'] },
  '27': { unis: ['Univ Mostaganem (Abdelhamid Ibn Badis)'], specs: ['Agronomy', 'Marine Biology', 'Software Engineering'] },
  '28': { unis: ['Univ M\'Sila (Mohamed Boudiaf)'], specs: ['Physics & Thin Films', 'Civil Engineering', 'Data Systems'] },
  '29': { unis: ['Univ Mascara (Mustapha Stambouli)'], specs: ['Biotechnology', 'Agritech', 'Applied Chemistry'] },
  '30': { unis: ['Univ Ouargla (Kasdi Merbah)', 'Hassi Messaoud Energy Center'], specs: ['Petroleum Engineering', 'Reservoir Simulation', 'Renewable Energy', 'Geophysics'] },
  '31': { unis: ['Univ Oran 1 (Ahmed Ben Bella)', 'USTO-MB (Oran Tech)', 'ENPO Oran'], specs: ['Artificial Intelligence', 'Robotics', 'Biomedical Tech', 'Renewable Energy'] },
  '32': { unis: ['Univ El Bayadh (Nour Bachir)'], specs: ['Pastoral Agriculture', 'Renewable Systems', 'Hydrology'] },
  '33': { unis: ['Univ Illizi (Ali Kafi)'], specs: ['Hydrocarbons', 'Solar Systems', 'Environmental Engineering'] },
  '34': { unis: ['Univ Bordj Bou Arréridj (Mohamed El Bachir El Ibrahimi)'], specs: ['Electronics & Embedded Systems', 'IoT', 'Materials Science'] },
  '35': { unis: ['Univ Boumerdès (M\'Hamed Bougara - INH)', 'Applied Sciences Institute'], specs: ['Oil & Gas Engineering', 'Geophysics', 'Food Technology'] },
  '36': { unis: ['Univ El Tarf (Chadli Bendjedid)'], specs: ['Veterinary Sciences', 'Ecology', 'Biotechnology'] },
  '37': { unis: ['Univ Tindouf (Ali Kafi)'], specs: ['Mining Geology', 'Solar Energy', 'Hydrology'] },
  '38': { unis: ['Univ Tissemsilt (Ahmed Ben Yahia Al Wancharisi)'], specs: ['Civil Infrastructure', 'Applied Mathematics', 'Agronomy'] },
  '39': { unis: ['Univ El Oued (Hamma Lakhdar)'], specs: ['Renewable Energy', 'Desert Agriculture', 'Chemistry'] },
  '40': { unis: ['Univ Khenchela (Abbes Laghrour)'], specs: ['Forestry & Ecology', 'Materials Physics', 'Computer Science'] },
  '41': { unis: ['Univ Souk Ahras (Mohamed-Chérif Messaadia)'], specs: ['Electrical Systems', 'Agri-Environment', 'Chemistry'] },
  '42': { unis: ['Univ Tipaza (Morsli Abdellah)'], specs: ['Marine Archaeology', 'Maritime Studies', 'Computer Science'] },
  '43': { unis: ['Univ Mila (Abdelhafid Boussouf)'], specs: ['Telecommunications', 'Hydraulic Structures', 'Mathematics'] },
  '44': { unis: ['Univ Aïn Defla (Djilali Bounaama)'], specs: ['Agriculture & Food', 'Process Engineering', 'Computer Science'] },
  '45': { unis: ['Univ Naâma (Salhi Ahmed)'], specs: ['Renewable Energy', 'Pastoral Sciences', 'Electrical Eng'] },
  '46': { unis: ['Univ Aïn Témouchent (Belhadj Bouchaib)'], specs: ['Materials Science', 'Renewable Energy', 'Informatics'] },
  '47': { unis: ['Univ Ghardaïa'], specs: ['Solar Energy', 'Heritage Architecture', 'Hydrology'] },
  '48': { unis: ['Univ Relizane (Ahmed Zabana)'], specs: ['Civil Engineering', 'Electrical Engineering', 'Applied Chemistry'] }
};

export function renderMap(container) {
  if (!container) return;
  container.innerHTML = '';

  // State
  let vb = { ...BASE_VB };
  let animFrameId = null;
  let isMouseDown = false;
  let isMapDragging = false;
  let dragStartX = 0, dragStartY = 0;
  let lastMouseX = 0, lastMouseY = 0;
  let isHovering = false;
  let isHUDActive = false;

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

  // ── 2. Create Elegant Solid White Line Hover Tooltip Layer ──
  const tetherLayer = document.createElementNS(SVG_NS, 'svg');
  tetherLayer.setAttribute('id', 'tether-layer');
  tetherLayer.setAttribute('style', 'position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 30; overflow: visible; opacity: 0; transition: opacity 0.2s ease;');
  tetherLayer.innerHTML = `
    <line id="tether-line" stroke="#FFFFFF" stroke-width="2"/>
    <circle id="tether-dot" r="5" fill="#FFFFFF" stroke="#00875A" stroke-width="1.5"/>
  `;
  container.appendChild(tetherLayer);

  const tetherLine = tetherLayer.querySelector('#tether-line');
  const tetherDot = tetherLayer.querySelector('#tether-dot');

  // Floating Tether Tooltip Div
  const tooltip = document.createElement('div');
  tooltip.setAttribute('id', 'wilaya-tooltip');
  tooltip.className = 'map-tether-tooltip';
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

  // ── 3. Render All Wilaya Paths (Original Crisp 1.5px / 1px Styling) ──
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

    // Hover with solid white line
    path.addEventListener('mouseenter', (e) => {
      if (isMapDragging || isHUDActive) return;
      const lang = store.state.lang;
      const name = lang === 'ar' ? (wilaya.nameAr || wilaya.name) : (lang === 'en' ? (wilaya.nameEn || wilaya.name) : (wilaya.nameFr || wilaya.name));
      isHovering = true;
      tooltip.innerHTML = `<span style="color:#00875A; font-weight:900; margin-inline-end:6px;">${wilaya.code}</span> ${name}`;
      tooltip.style.opacity = '1';
      tetherLayer.style.opacity = '1';
      updateTooltipPosition(e.clientX, e.clientY);
    });

    path.addEventListener('mouseleave', () => {
      if (isHUDActive) return;
      isHovering = false;
      tooltip.style.opacity = '0';
      tetherLayer.style.opacity = '0';
    });

    // Path Click Handler (Trigger Choreographed Timeline)
    path.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isMapDragging || isHUDActive) return;
      startHUDChoreography(wilaya, path);
    });
  });

  container.appendChild(svg);

  // Mousemove for hover tooltip update
  container.addEventListener('mousemove', (e) => {
    if (isHovering && !isMapDragging && !isHUDActive) {
      updateTooltipPosition(e.clientX, e.clientY);
    }
  });

  // ── 4. Bulletproof Click vs Drag Panning Logic ──
  svg.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || isHUDActive) return;
    isMouseDown = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    isMapDragging = false;
  });

  svg.addEventListener('mousemove', (e) => {
    if (!isMouseDown || isHUDActive) return;
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
    setTimeout(() => {
      isMapDragging = false;
    }, 60);
  });

  // ── 5. Smooth Wheel Zoom (Centered at Cursor) ──
  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (isHUDActive) return;
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

  // Camera Smooth Interpolation (requestAnimationFrame)
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
            startHUDChoreography(targetW, pathEl);
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
    if (isHUDActive) return;
    const newW = Math.max(vb.w * 0.75, 1.2);
    const newH = newW * (BASE_VB.h / BASE_VB.w);
    const cX = vb.x + vb.w / 2;
    const cY = vb.y + vb.h / 2;
    animateViewBox({ x: cX - newW / 2, y: cY - newH / 2, w: newW, h: newH }, 400);
  });

  controls.querySelector('#map-zoom-out').addEventListener('click', () => {
    if (isHUDActive) return;
    const newW = Math.min(vb.w * 1.35, BASE_VB.w * 1.5);
    const newH = newW * (BASE_VB.h / BASE_VB.w);
    const cX = vb.x + vb.w / 2;
    const cY = vb.y + vb.h / 2;
    animateViewBox({ x: cX - newW / 2, y: cY - newH / 2, w: newW, h: newH }, 400);
  });

  controls.querySelector('#map-reset-view').addEventListener('click', () => {
    if (isHUDActive) return;
    animateViewBox(BASE_VB, 500);
  });

  // ══════════════════════════════════════════════════════════════
  // 8. THE CHOREOGRAPHED "HUD" ANIMATION (CLICK 1 & CLICK 2)
  // ══════════════════════════════════════════════════════════════

  function startHUDChoreography(wilaya, pathEl) {
    isHUDActive = true;
    tooltip.style.opacity = '0';
    tetherLayer.style.opacity = '0';

    // ── T = 0.0s: Camera smoothly zooms & centers on Wilaya (NO blur yet) ──
    const bbox = pathEl.getBBox();
    const pad = Math.max(bbox.width, bbox.height) * 0.95;
    const targetW = Math.max(bbox.width + pad * 2, 4.0);
    const targetH = targetW * (BASE_VB.h / BASE_VB.w);
    const targetX = (bbox.x + bbox.width / 2) - targetW / 2;
    const targetY = (bbox.y + bbox.height / 2) - targetH / 2;

    animateViewBox({ x: targetX, y: targetY, w: targetW, h: targetH }, 500);

    // ── T = 0.4s: The Wilaya path flashes / glows with emerald pulse ──
    setTimeout(() => {
      pathEl.classList.add('wilaya-flash-pulse');
    }, 400);

    // ── T = 0.5s: Fade in full-screen translucent frosted blur behind Wilaya ──
    setTimeout(() => {
      mountHUDGlassStage(wilaya, pathEl);
    }, 500);
  }

  function mountHUDGlassStage(wilaya, pathEl) {
    // Clean up any stale HUD nodes
    const staleOverlay = document.getElementById('hud-master-overlay');
    if (staleOverlay) staleOverlay.remove();

    const lang = store.state.lang;
    const displayName = lang === 'ar' ? (wilaya.nameAr || wilaya.name) : (lang === 'en' ? (wilaya.nameEn || wilaya.name) : (wilaya.nameFr || wilaya.name));
    const secName = (lang !== 'ar' && wilaya.nameAr) ? wilaya.nameAr : (wilaya.nameEn || wilaya.name);

    // Top Typography bilingual labels
    const topTitle = lang === 'ar' ? 'اضغط على الولاية للدخول' : (lang === 'fr' ? 'Cliquez sur la wilaya pour entrer' : 'Click the Wilaya to Enter');
    const topSubtitle = lang === 'ar' ? 'أو اضغط في أي مكان للعودة' : (lang === 'fr' ? 'Ou cliquez n\'importe où pour revenir' : 'Or click anywhere to return');
    const loadingText = lang === 'ar' ? 'جارٍ تحميل دليل الكفاءات المعتمدة...' : (lang === 'fr' ? 'Chargement du répertoire des talents...' : 'Loading Wilaya Talents Directory...');

    // Academic & Specialty Data
    const acad = WILAYA_ACADEMIC_DATA[wilaya.code] || {
      unis: [`University of ${wilaya.name}`, 'National Polytechnic Institute'],
      specs: ['Artificial Intelligence', 'Energy Systems', 'Software Engineering', 'Biotechnology']
    };

    // Master container for the HUD (True Glass Blur)
    const hudMaster = document.createElement('div');
    hudMaster.id = 'hud-master-overlay';
    hudMaster.className = 'hud-master-overlay';
    hudMaster.style.cssText = 'position: fixed; inset: 0; z-index: 9999; backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); background: rgba(20, 45, 35, 0.2); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.35s ease; cursor: pointer; overflow: hidden;';

    // SVG Viewport overlay matching exact map bounds
    const mapRect = svg.getBoundingClientRect();

    hudMaster.innerHTML = `
      <!-- Pure Top Typography -->
      <div class="hud-top-typography" id="hud-top-typography" style="position: fixed; top: 5vh; left: 0; width: 100%; text-align: center; pointer-events: none; z-index: 30; opacity: 0; transition: opacity 0.5s ease 0.3s;">
        <h2 style="color: #ffffff; font-size: 2rem; font-weight: 700; letter-spacing: 1px; text-shadow: 0 4px 15px rgba(0,0,0,0.4); margin: 0 0 8px;">${topTitle}</h2>
        <p style="color: #cbd5e1; font-size: 1.1rem; font-weight: 400; margin: 0; text-shadow: 0 2px 8px rgba(0,0,0,0.3);">${topSubtitle}</p>
      </div>

      <!-- Dedicated Full-Screen Viewport SVG Layer for Glowing Solid Tethers -->
      <svg id="hud-tether-canvas" style="position: fixed; inset: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 15; overflow: visible;">
        <line id="hud-tether-1" stroke="rgba(52, 211, 153, 0.6)" stroke-width="1.5" style="filter: drop-shadow(0 0 8px rgba(52, 211, 153, 0.8)); opacity: 0; transition: opacity 0.5s ease 0.3s;"/>
        <line id="hud-tether-2" stroke="rgba(52, 211, 153, 0.6)" stroke-width="1.5" style="filter: drop-shadow(0 0 8px rgba(52, 211, 153, 0.8)); opacity: 0; transition: opacity 0.5s ease 0.3s;"/>
        <line id="hud-tether-3" stroke="rgba(52, 211, 153, 0.6)" stroke-width="1.5" style="filter: drop-shadow(0 0 8px rgba(52, 211, 153, 0.8)); opacity: 0; transition: opacity 0.5s ease 0.3s;"/>
        <line id="hud-tether-4" stroke="rgba(52, 211, 153, 0.6)" stroke-width="1.5" style="filter: drop-shadow(0 0 8px rgba(52, 211, 153, 0.8)); opacity: 0; transition: opacity 0.5s ease 0.3s;"/>
      </svg>

      <!-- SVG Layer for Cloned Glowing Wilaya Shape -->
      <svg id="hud-clone-svg" style="position: fixed; left: ${mapRect.left}px; top: ${mapRect.top}px; width: ${mapRect.width}px; height: ${mapRect.height}px; pointer-events: none; overflow: visible; z-index: 18;">
        <defs>
          <filter id="hud-glow-filter" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#34D399" flood-opacity="0.9"/>
            <feDropShadow dx="0" dy="8" stdDeviation="20" flood-color="#00875A" flood-opacity="0.75"/>
          </filter>
        </defs>
        <g id="hud-clone-wrap" style="pointer-events: auto; cursor: pointer;"></g>
      </svg>

      <!-- Center Minimalist Loading Spinner in Blurred Void (Isolated on Click 2) -->
      <div class="hud-isolated-loader" id="hud-isolated-loader" style="position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); display: none; flex-direction: column; align-items: center; gap: 20px; z-index: 50; opacity: 0; transition: opacity 0.3s ease; pointer-events: none;">
        <div style="position: relative; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center;">
          <span class="hud-loader-ring"></span>
          <span class="hud-loader-core"></span>
        </div>
        <div style="font-size: 1.05rem; font-weight: 800; color: #FFFFFF; text-shadow: 0 4px 16px rgba(0,0,0,0.5);">${loadingText}</div>
      </div>

      <!-- 4 Floating Glassmorphic HUD Cards Layer -->
      <div class="hud-cards-stage" id="hud-cards-stage" style="position: fixed; inset: 0; pointer-events: none; z-index: 20;">
        
        <!-- Card 1: Wilaya Name (Top-Left) -->
        <div class="hud-card hud-card-1" id="hud-card-1" style="opacity: 0; transform: scale(0.92); pointer-events: auto;">
          <div class="hud-card-badge">DZ-${wilaya.code}</div>
          <h3 class="hud-card-title">${displayName}</h3>
          <div class="hud-card-subtitle">${secName}</div>
        </div>

        <!-- Card 2: Verified Talents (Top-Right) -->
        <div class="hud-card hud-card-2" id="hud-card-2" style="opacity: 0; transform: scale(0.92); pointer-events: auto;">
          <div class="hud-card-label">${t('map.verifiedTalentsInWilaya')}</div>
          <div class="hud-card-number" id="hud-talent-count">...</div>
          <div class="hud-card-tier">★ 100% ${t('tier.goldBadge')}</div>
        </div>

        <!-- Card 3: Available Specialties (Bottom-Left) -->
        <div class="hud-card hud-card-3" id="hud-card-3" style="opacity: 0; transform: scale(0.92); pointer-events: auto;">
          <div class="hud-card-label">${t('hud.cardSpecialties')}</div>
          <div class="hud-tags-wrap">
            ${acad.specs.map(s => `<span class="hud-tag">${s}</span>`).join('')}
          </div>
        </div>

        <!-- Card 4: Available Universities (Bottom-Right) -->
        <div class="hud-card hud-card-4" id="hud-card-4" style="opacity: 0; transform: scale(0.92); pointer-events: auto;">
          <div class="hud-card-label">${t('hud.cardUniversities')}</div>
          <div class="hud-unis-wrap">
            ${acad.unis.map(u => `<div class="hud-uni-item"><span class="hud-uni-dot"></span>${u}</div>`).join('')}
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(hudMaster);

    // Setup Cloned Path inside #hud-clone-svg
    const hudCloneSvg = hudMaster.querySelector('#hud-clone-svg');
    hudCloneSvg.setAttribute('viewBox', svg.getAttribute('viewBox'));
    hudCloneSvg.setAttribute('preserveAspectRatio', svg.getAttribute('preserveAspectRatio') || 'xMidYMid meet');

    const cloneWrap = hudMaster.querySelector('#hud-clone-wrap');
    const clonedPath = pathEl.cloneNode(true);
    clonedPath.style.cssText = 'fill: #059669; stroke: #34D399; stroke-width: 2px; vector-effect: non-scaling-stroke; filter: url(#hud-glow-filter); transform-origin: center; transition: all 0.3s ease; pointer-events: auto; cursor: pointer;';
    clonedPath.setAttribute('id', `hud-clone-path-${wilaya.code}`);
    cloneWrap.appendChild(clonedPath);

    // Fade in translucent frosted blur backdrop
    requestAnimationFrame(() => {
      hudMaster.style.opacity = '1';
      const topTypo = hudMaster.querySelector('#hud-top-typography');
      if (topTypo) topTypo.style.opacity = '1';
    });

    // Fetch and hydrate real Supabase count
    getProfilesByWilaya(wilaya.code).then(res => {
      const countEl = hudMaster.querySelector('#hud-talent-count');
      if (countEl) countEl.textContent = Array.isArray(res) ? `${res.length}` : '30+';
    }).catch(() => {
      const countEl = hudMaster.querySelector('#hud-talent-count');
      if (countEl) countEl.textContent = '30+';
    });

    // ── T = 0.7s (200ms after blur mount): Draw 4 Glowing SVG lines ──
    setTimeout(() => {
      draw4SolidTetherLines(hudMaster, pathEl);
    }, 200);

    // ── T = 1.0s (500ms after blur mount): Fade in the 4 HUD Cards ──
    setTimeout(() => {
      reveal4HUDCards(hudMaster);
    }, 500);

    // ── Wire Click 2: "Breathe Out" Exit & Isolated Loading State ──
    function executeClick2BreatheOut(e) {
      e.stopPropagation();
      executeBreatheOutTransition(hudMaster, wilaya);
    }

    clonedPath.addEventListener('click', executeClick2BreatheOut);
    hudMaster.querySelectorAll('.hud-card').forEach(c => c.addEventListener('click', executeClick2BreatheOut));

    // ── Wire Reversal: Clicking blurred backdrop or pressing Escape ──
    hudMaster.addEventListener('click', (e) => {
      if (e.target === hudMaster || e.target.id === 'hud-tether-canvas' || e.target.id === 'hud-cards-stage') {
        reverseHUDToNational(hudMaster);
      }
    });

    const escHandler = (e) => {
      if (e.key === 'Escape' && isHUDActive) {
        reverseHUDToNational(hudMaster);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  // Draw 4 Solid Vector Lines connecting Wilaya center to 4 Card coordinates
  function draw4SolidTetherLines(hudMaster, pathEl) {
    const l1 = hudMaster.querySelector('#hud-tether-1');
    const l2 = hudMaster.querySelector('#hud-tether-2');
    const l3 = hudMaster.querySelector('#hud-tether-3');
    const l4 = hudMaster.querySelector('#hud-tether-4');
    const c1 = hudMaster.querySelector('#hud-card-1');
    const c2 = hudMaster.querySelector('#hud-card-2');
    const c3 = hudMaster.querySelector('#hud-card-3');
    const c4 = hudMaster.querySelector('#hud-card-4');

    if (!l1 || !l2 || !l3 || !l4 || !c1 || !c2 || !c3 || !c4) return;

    const pRect = pathEl.getBoundingClientRect();
    const originX = pRect.left + pRect.width / 2;
    const originY = pRect.top + pRect.height / 2;

    const r1 = c1.getBoundingClientRect();
    const r2 = c2.getBoundingClientRect();
    const r3 = c3.getBoundingClientRect();
    const r4 = c4.getBoundingClientRect();

    // Line 1: From center to Card 1 (Top-Left)
    l1.setAttribute('x1', originX);
    l1.setAttribute('y1', originY);
    l1.setAttribute('x2', r1.right);
    l1.setAttribute('y2', r1.bottom - 12);
    l1.style.opacity = '1';

    // Line 2: From center to Card 2 (Top-Right)
    l2.setAttribute('x1', originX);
    l2.setAttribute('y1', originY);
    l2.setAttribute('x2', r2.left);
    l2.setAttribute('y2', r2.bottom - 12);
    l2.style.opacity = '1';

    // Line 3: From center to Card 3 (Bottom-Left)
    l3.setAttribute('x1', originX);
    l3.setAttribute('y1', originY);
    l3.setAttribute('x2', r3.right);
    l3.setAttribute('y2', r3.top + 12);
    l3.style.opacity = '1';

    // Line 4: From center to Card 4 (Bottom-Right)
    l4.setAttribute('x1', originX);
    l4.setAttribute('y1', originY);
    l4.setAttribute('x2', r4.left);
    l4.setAttribute('y2', r4.top + 12);
    l4.style.opacity = '1';
  }

  // Reveal 4 HUD Cards with spring animation
  function reveal4HUDCards(hudMaster) {
    const cards = hudMaster.querySelectorAll('.hud-card');
    cards.forEach((card, idx) => {
      setTimeout(() => {
        card.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        card.style.opacity = '1';
        card.style.transform = 'scale(1)';
      }, idx * 60);
    });
  }

  // ── Click 2: "Breathe Out" Exit & Isolated Loading Screen ──
  function executeBreatheOutTransition(hudMaster, wilaya) {
    const cards = hudMaster.querySelectorAll('.hud-card');
    const tetherCanvas = hudMaster.querySelector('#hud-tether-canvas');
    const topTypo = hudMaster.querySelector('#hud-top-typography');
    const cloneWrap = hudMaster.querySelector('#hud-clone-wrap');
    const loader = hudMaster.querySelector('#hud-isolated-loader');

    // 1. T=0.0s: Fade out cards, lines, top typography, and glowing Wilaya clone
    cards.forEach(c => {
      c.style.transition = 'all 0.3s ease';
      c.style.transform = 'scale(0.95)';
      c.style.opacity = '0';
    });
    if (tetherCanvas) {
      tetherCanvas.style.transition = 'opacity 0.3s ease';
      tetherCanvas.style.opacity = '0';
    }
    if (topTypo) {
      topTypo.style.transition = 'all 0.3s ease';
      topTypo.style.opacity = '0';
    }
    if (cloneWrap) {
      cloneWrap.style.transition = 'all 0.3s ease';
      cloneWrap.style.transform = 'scale(0.95)';
      cloneWrap.style.opacity = '0';
    }

    // 2. T=0.3s: Center Loader appears in the completely empty blurred void
    setTimeout(() => {
      if (loader) {
        loader.style.display = 'flex';
        requestAnimationFrame(() => {
          loader.style.opacity = '1';
        });
      }
    }, 300);

    // 3. T=0.8s: Execute routing to renderProfiles(wilayaCode)
    setTimeout(() => {
      hudMaster.style.opacity = '0';
      setTimeout(() => {
        hudMaster.remove();
        isHUDActive = false;
        store.setState({ selectedWilaya: wilaya });
        navigate(`#/wilaya/${wilaya.code}`);
      }, 250);
    }, 800);
  }

  // Reversal: Smoothly close HUD and zoom back out to national view
  function reverseHUDToNational(hudMaster) {
    hudMaster.style.opacity = '0';
    setTimeout(() => {
      hudMaster.remove();
      isHUDActive = false;
    }, 300);

    animateViewBox(BASE_VB, 550);
  }

  // Reactive language change
  store.subscribe('lang', () => {
    svg.setAttribute('aria-label', t('map.title'));
  });
}
