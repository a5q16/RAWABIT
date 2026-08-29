/**
 * Rawabit v2 — The Mind-Map Expansion Experience
 * Radial satellite card expansion, animated SVG connector drawing,
 * blurred backdrop, centered main card with AI actions, and
 * Cinematic Inward Pull & Breath Out Collapse Closing Animation.
 * Strictly Vanilla JS · 60FPS Hardware Accelerated
 */

import { t } from '../i18n.js';
import { store, pushOverlay, popOverlay } from '../store.js';
import { openAIChat } from './chat.js';

let activeOverlay = null;
let activeResizeHandler = null;

/**
 * Open the Mind-Map experience for a specific profile
 * @param {Object} profile - Full competency profile data
 * @param {HTMLElement} originCard - The original clicked card element in the grid
 */
export function openMindMap(profile, originCard = null) {
  closeMindMap(false);

  store.setState({ selectedProfile: profile });
  pushOverlay('mindmap');

  const lang = store.state.lang;
  const isRtl = lang === 'ar';

  // ── 1. Create Overlay DOM ──
  const overlay = document.createElement('div');
  overlay.className = 'mindmap-overlay';
  overlay.id = 'mindmap-overlay';
  activeOverlay = overlay;

  const displayName = (lang === 'ar' && profile.nameAr) ? profile.nameAr : (lang === 'fr' && profile.nameFr ? profile.nameFr : profile.name);
  const displayTitle = (lang === 'ar' && profile.titleAr) ? profile.titleAr : (lang === 'fr' && profile.titleFr ? profile.titleFr : profile.title);
  const displayOrg = (lang === 'ar' && profile.organizationAr) ? profile.organizationAr : (lang === 'fr' && profile.organizationFr ? profile.organizationFr : profile.organization);
  const displayLoc = (lang === 'ar' && profile.locationAr) ? profile.locationAr : (lang === 'fr' && profile.locationFr ? profile.locationFr : profile.location);
  const displayBio = (lang === 'ar' && profile.bioAr) ? profile.bioAr : (lang === 'fr' && profile.bioFr ? profile.bioFr : profile.bio);

  overlay.innerHTML = `
    <!-- Top Bar Controls -->
    <div class="mindmap-header-bar" id="mindmap-header-bar">
      <div class="mindmap-title-badge">
        <span class="pulse-dot"></span>
        <span class="mindmap-badge-text" data-i18n="mindmap.verifiedBadge">${t('mindmap.verifiedBadge')}</span>
        <span class="mindmap-badge-code">ID: ${profile.contact?.verifiedId || `DZ-${profile.wilayaCode}-2025`}</span>
      </div>
      <button class="mindmap-close-btn" id="mindmap-close-btn" aria-label="${t('mindmap.close')}">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <!-- Mind-Map Stage Container -->
    <div class="mindmap-stage" id="mindmap-stage">
      
      <!-- SVG Connectors Layer -->
      <svg class="mindmap-svg-canvas" id="mindmap-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="line-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#00875A" stop-opacity="0.9" />
            <stop offset="100%" stop-color="#10B981" stop-opacity="0.4" />
          </linearGradient>
        </defs>
        <g id="svg-paths-group"></g>
      </svg>

      <!-- ── SATELLITE CARD 1: Academic & Research (Top-Left) ── -->
      <div class="mindmap-node node-academic" id="node-academic" data-node="1">
        <div class="node-icon-box">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
            <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
          </svg>
        </div>
        <h3 class="node-title" data-i18n="mindmap.tabAcademic">${t('mindmap.tabAcademic')}</h3>
        <div class="node-content">
          ${(profile.academic || []).map(item => `
            <div class="node-item">
              <span class="item-year">${item.year}</span>
              <strong class="item-degree">${item.degree}</strong>
              <span class="item-sub">${item.institution}</span>
              ${item.details ? `<p class="item-desc">${item.details}</p>` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- ── SATELLITE CARD 2: Core Competencies (Top-Right) ── -->
      <div class="mindmap-node node-skills" id="node-skills" data-node="2">
        <div class="node-icon-box">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </div>
        <h3 class="node-title" data-i18n="mindmap.tabCompetencies">${t('mindmap.tabCompetencies')}</h3>
        <div class="node-content">
          <div class="skills-bars-wrap">
            ${(profile.skills || []).map(skill => `
              <div class="skill-row">
                <div class="skill-labels">
                  <span class="skill-name">${skill.name}</span>
                  <span class="skill-pct">${skill.level}%</span>
                </div>
                <div class="skill-track">
                  <div class="skill-fill" style="width: ${skill.level}%;"></div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="node-tags-wrap">
            ${(profile.tags || []).map(tg => `<span class="competency-tag">${tg}</span>`).join('')}
          </div>
        </div>
      </div>

      <!-- ── SATELLITE CARD 3: Professional Career (Bottom-Left) ── -->
      <div class="mindmap-node node-career" id="node-career" data-node="3">
        <div class="node-icon-box">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
        </div>
        <h3 class="node-title" data-i18n="mindmap.tabCareer">${t('mindmap.tabCareer')}</h3>
        <div class="node-content">
          ${(profile.professional || []).map(item => `
            <div class="node-item">
              <div class="item-header-row">
                <strong class="item-role">${item.role}</strong>
                <span class="item-period">${item.period}</span>
              </div>
              <span class="item-company">${item.company}</span>
              ${item.highlights ? `<p class="item-desc">${item.highlights}</p>` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- ── SATELLITE CARD 4: Credentials & Accreditations (Bottom-Right) ── -->
      <div class="mindmap-node node-credentials" id="node-credentials" data-node="4">
        <div class="node-icon-box">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
          </svg>
        </div>
        <h3 class="node-title" data-i18n="mindmap.tabCredentials">${t('mindmap.tabCredentials')}</h3>
        <div class="node-content">
          ${(profile.achievements || []).map(ach => `
            <div class="node-item achievement-item">
              <div class="ach-badge">${ach.badge || 'Verified'}</div>
              <strong class="ach-title">${ach.title}</strong>
              <span class="item-year">${ach.year}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- ── CENTER MAIN PROFILE CARD ── -->
      <div class="mindmap-center-card" id="mindmap-center-card">
        <div class="center-avatar-wrap">
          <img class="center-avatar" src="${profile.avatar}" alt="${profile.name}" onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=240&auto=format&fit=crop&q=80'" />
          <div class="center-verified-badge" title="${t('profiles.reliability')}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
          </div>
        </div>

        <div class="center-reliability-tag">
          <span class="reliability-num">${profile.reliability}%</span>
          <span class="reliability-label" data-i18n="profiles.reliability">${t('profiles.reliability')}</span>
        </div>

        <div class="center-info">
          <h2 class="center-name">${displayName}</h2>
          <p class="center-title">${displayTitle}</p>
          
          <div class="center-meta-tags">
            <span class="meta-tag meta-org">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 7v14M21 7v14M6 7V3h12v4M9 11h2M13 11h2M9 15h2M13 15h2"/></svg>
              ${displayOrg}
            </span>
            <span class="meta-tag meta-loc">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a8 8 0 00-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 00-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z"/></svg>
              ${displayLoc}
            </span>
          </div>

          <p class="center-bio">${displayBio}</p>
        </div>

        <!-- CENTER CARD ACTIONS (Ask AI & LinkedIn) -->
        <div class="center-actions-wrap">
          <button class="btn-ask-ai" id="btn-ask-ai">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
            </svg>
            <span data-i18n="mindmap.askAi">${t('mindmap.askAi')}</span>
          </button>

          <a class="btn-linkedin" href="${profile.contact?.linkedin || '#'}" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.25c-.9 0-1.63.73-1.63 1.63s.73 1.63 1.63 1.63 1.63-.73 1.63-1.63-.73-1.63-1.63-1.63z"/>
            </svg>
            <span data-i18n="mindmap.linkedin">${t('mindmap.linkedin')}</span>
          </a>
        </div>

      </div>

    </div>
  `;

  // ── 2. Mount Overlay & Animate In ──
  document.body.appendChild(overlay);
  const rAF = (typeof window !== 'undefined' && window.requestAnimationFrame) ? window.requestAnimationFrame : (cb) => setTimeout(cb, 16);
  rAF(() => {
    overlay.classList.add('active');
    drawConnectorLines();
  });

  // ── 3. Wire AI Action Button ──
  const btnAskAi = overlay.querySelector('#btn-ask-ai');
  if (btnAskAi) {
    btnAskAi.addEventListener('click', () => {
      openAIChat({ 
        type: 'profile', 
        profile, 
        displayName, 
        displayTitle 
      });
    });
  }

  // ── 4. Dismissal Listeners ──
  const closeBtn = overlay.querySelector('#mindmap-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeMindMap(true));
  }

  // Dismiss on clicking empty blurred background
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.id === 'mindmap-stage') {
      closeMindMap(true);
    }
  });

  // Dismiss on Escape key
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeMindMap(true);
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  // Resize handler for responsive line redraw
  activeResizeHandler = () => {
    if (activeOverlay && activeOverlay.classList.contains('active')) {
      drawConnectorLines();
    }
  };
  window.addEventListener('resize', activeResizeHandler, { passive: true });
}

/**
 * Mathematically draw SVG connector lines between the center card and 4 satellites
 */
function drawConnectorLines() {
  if (!activeOverlay) return;

  const stage = activeOverlay.querySelector('#mindmap-stage');
  const centerCard = activeOverlay.querySelector('#mindmap-center-card');
  const pathsGroup = activeOverlay.querySelector('#svg-paths-group');
  if (!stage || !centerCard || !pathsGroup) return;

  const stageRect = stage.getBoundingClientRect();
  const centerRect = centerCard.getBoundingClientRect();

  if (window.innerWidth <= 1024) {
    pathsGroup.innerHTML = '';
    return;
  }

  // Calculate center of main card relative to stage
  const cX = (centerRect.left + centerRect.width / 2) - stageRect.left;
  const cY = (centerRect.top + centerRect.height / 2) - stageRect.top;

  const nodes = [
    { el: activeOverlay.querySelector('#node-academic'), anchor: 'right-center', delay: '0ms' },
    { el: activeOverlay.querySelector('#node-skills'), anchor: 'left-center', delay: '120ms' },
    { el: activeOverlay.querySelector('#node-career'), anchor: 'right-center', delay: '240ms' },
    { el: activeOverlay.querySelector('#node-credentials'), anchor: 'left-center', delay: '360ms' }
  ];

  let pathsHtml = '';

  nodes.forEach(({ el, delay }) => {
    if (!el) return;
    const nRect = el.getBoundingClientRect();

    let nX = 0;
    let nY = 0;

    const nCenterX = (nRect.left + nRect.width / 2) - stageRect.left;
    const nCenterY = (nRect.top + nRect.height / 2) - stageRect.top;

    if (nCenterX < cX) {
      nX = (nRect.right) - stageRect.left;
      nY = nCenterY;
    } else {
      nX = (nRect.left) - stageRect.left;
      nY = nCenterY;
    }

    const deltaX = (nX - cX) * 0.5;
    const cp1X = cX + deltaX;
    const cp1Y = cY;
    const cp2X = nX - deltaX * 0.5;
    const cp2Y = nY;

    const d = `M ${cX} ${cY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${nX} ${nY}`;

    pathsHtml += `
      <path 
        d="${d}" 
        class="mindmap-connector-line" 
        style="animation-delay: ${delay};"
      />
      <circle cx="${nX}" cy="${nY}" r="4.5" class="mindmap-connector-dot" style="animation-delay: calc(${delay} + 400ms);" />
    `;
  });

  pathsGroup.innerHTML = pathsHtml;
}

/**
 * Cinematic 3-Step Mind-Map Close Sequence ("The Pull" & "The Breath Out")
 * STEP 1: .is-collapsing triggers 4 satellites & SVG lines to retract into center card (0.4s).
 * STEP 2: .breath-out triggers main center card to scale down to 0.9 and fade (0.3s).
 * STEP 3: Fade out blurred background overlay, remove elements, and restore grid.
 * @param {boolean} animate - Whether to run the collapse animation sequence
 */
export function closeMindMap(animate = true) {
  if (!activeOverlay) return;

  if (activeResizeHandler) {
    window.removeEventListener('resize', activeResizeHandler);
    activeResizeHandler = null;
  }

  if (!animate) {
    if (activeOverlay.parentNode) {
      activeOverlay.parentNode.removeChild(activeOverlay);
    }
    activeOverlay = null;
    popOverlay();
    return;
  }

  const overlay = activeOverlay;
  const stage = overlay.querySelector('#mindmap-stage') || overlay;
  const centerCard = overlay.querySelector('#mindmap-center-card');
  const satellites = overlay.querySelectorAll('.mindmap-node');

  // Prevent multiple closing triggers
  if (overlay.classList.contains('is-collapsing') || overlay.classList.contains('is-closing')) return;
  overlay.classList.add('is-closing');

  // ── STEP 1: "THE PULL" (Satellites & SVG lines retracting into center) ──
  if (centerCard) {
    const centerRect = centerCard.getBoundingClientRect();
    const cX = centerRect.left + centerRect.width / 2;
    const cY = centerRect.top + centerRect.height / 2;

    satellites.forEach(node => {
      const nRect = node.getBoundingClientRect();
      const nX = nRect.left + nRect.width / 2;
      const nY = nRect.top + nRect.height / 2;

      // Exact vector towards center of main card
      const deltaX = cX - nX;
      const deltaY = cY - nY;
      node.style.setProperty('--pull-x', `${deltaX}px`);
      node.style.setProperty('--pull-y', `${deltaY}px`);
    });
  }

  // Trigger CSS class for Step 1
  overlay.classList.add('is-collapsing');
  if (stage) stage.classList.add('is-collapsing');

  // ── STEP 2: "THE BREATH OUT" (Wait 400ms for satellites to be fully swallowed) ──
  setTimeout(() => {
    if (!activeOverlay || !centerCard) return;

    // Apply .breath-out class to main centered profile card
    centerCard.classList.add('breath-out');

    // ── STEP 3: RESTORE GRID (Wait 300ms after Step 2 begins) ──
    setTimeout(() => {
      if (!activeOverlay) return;

      // Fade out the blurred background
      activeOverlay.classList.add('is-fading-out');

      setTimeout(() => {
        if (activeOverlay && activeOverlay.parentNode) {
          activeOverlay.parentNode.removeChild(activeOverlay);
        }
        activeOverlay = null;
        store.setState({ selectedProfile: null });
        popOverlay();
      }, 250);

    }, 300);

  }, 400);
}

// Reactive language change re-render for active MindMap
store.subscribe('lang', () => {
  if (activeOverlay && store.state.selectedProfile) {
    openMindMap(store.state.selectedProfile, null);
  }
});

