/**
 * Rawabit v2 — The Mind-Map Expansion Experience
 * Pure SVG animated radial connector lines with stroke-dasharray transitions,
 * blurred backdrop, satellite competency nodes, and prominent Ask AI trigger.
 */
import { t } from '../i18n.js';
import { store, pushOverlay, popOverlay } from '../store.js';

let activeOverlay = null;
let activeResizeHandler = null;

/**
 * Open the Mind-Map experience for a specific profile
 * @param {Object} profile - Full competency profile data
 */
export function openMindMap(profile) {
  // If an overlay already exists, clean it up first
  closeMindMap(false);

  store.setState({ selectedProfile: profile });
  pushOverlay('mindmap');

  const lang = store.state.lang;
  const isRtl = lang === 'ar';

  // ── Create Overlay DOM ──
  const overlay = document.createElement('div');
  overlay.className = 'mindmap-overlay';
  overlay.id = 'mindmap-overlay';
  activeOverlay = overlay;

  overlay.innerHTML = `
    <!-- Top Bar Controls -->
    <div class="mindmap-header-bar">
      <div class="mindmap-title-badge">
        <span class="pulse-dot"></span>
        <span class="mindmap-badge-text" data-i18n="mindmap.verifiedBadge">${t('mindmap.verifiedBadge')}</span>
        <span class="mindmap-badge-code">ID: ${profile.contact?.verifiedId || `DZ-${profile.wilayaCode}-2025`}</span>
      </div>
      <button class="mindmap-close-btn" id="mindmap-close-btn" aria-label="${t('mindmap.close')}">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <!-- Mind-Map Stage -->
    <div class="mindmap-stage" id="mindmap-stage">
      
      <!-- SVG Connectors Layer -->
      <svg class="mindmap-svg-canvas" id="mindmap-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="line-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="var(--color-accent)" stop-opacity="0.85" />
            <stop offset="100%" stop-color="#10B981" stop-opacity="0.4" />
          </linearGradient>
          <linearGradient id="line-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="var(--color-accent)" stop-opacity="0.85" />
            <stop offset="100%" stop-color="#059669" stop-opacity="0.4" />
          </linearGradient>
          <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <g id="svg-paths-group"></g>
        <g id="svg-nodes-group"></g>
      </svg>

      <!-- Center Main Card -->
      <div class="mindmap-center-card" id="mindmap-center-card">
        <div class="center-avatar-wrap">
          <img class="center-avatar" src="${profile.avatar}" alt="${profile.name}" onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=240&auto=format&fit=crop&q=80'" />
          <div class="center-verified-badge" title="${t('profiles.verified')}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
          </div>
          <div class="center-reliability-tag">
            <span class="reliability-num">${profile.reliability}%</span>
            <span class="reliability-label" data-i18n="profiles.reliability">${t('profiles.reliability')}</span>
          </div>
        </div>

        <div class="center-info">
          <h2 class="center-name">${(lang === 'ar' && profile.nameAr) ? profile.nameAr : profile.name}</h2>
          ${(lang !== 'ar' && profile.nameAr) ? `<p class="center-name-sub">${profile.nameAr}</p>` : ''}
          <p class="center-title">${(lang === 'ar' && profile.titleAr) ? profile.titleAr : (lang === 'fr' && profile.titleFr ? profile.titleFr : profile.title)}</p>
          
          <div class="center-meta-tags">
            <span class="meta-tag meta-org">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 7v14M21 7v14M6 7V3h12v4M9 11h2M13 11h2M9 15h2M13 15h2"/></svg>
              ${(lang === 'ar' && profile.organizationAr) ? profile.organizationAr : profile.organization}
            </span>
            <span class="meta-tag meta-loc">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a8 8 0 00-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 00-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z"/></svg>
              ${(lang === 'ar' && profile.locationAr) ? profile.locationAr : profile.location}
            </span>
          </div>

          <p class="center-bio">${(lang === 'ar' && profile.bioAr) ? profile.bioAr : profile.bio}</p>
        </div>

        <!-- Center Actions -->
        <div class="center-actions">
          <button class="mindmap-btn-ai" id="btn-ask-ai" title="${t('mindmap.askAi')}">
            <span class="ai-btn-sparkle">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
              </svg>
            </span>
            <span class="ai-btn-text" data-i18n="mindmap.askAi">${t('mindmap.askAi')}</span>
            <span class="ai-btn-pulse"></span>
          </button>

          <a class="mindmap-btn-ext" href="${profile.contact?.linkedin || '#'}" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.6a1.64 1.64 0 0 0-1.63 1.64 1.64 1.64 0 0 0 1.63 1.63 1.64 1.64 0 0 0 1.64-1.63A1.64 1.64 0 0 0 7.83 6.6z"/>
            </svg>
            <span data-i18n="mindmap.linkedin">${t('mindmap.linkedin')}</span>
          </a>
        </div>
      </div>

      <!-- Satellite Mini-Card 1: Academic & Research (Top-Left) -->
      <div class="mindmap-node node-education" id="node-education" data-index="0">
        <div class="node-header">
          <div class="node-icon-wrap icon-edu">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
              <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
            </svg>
          </div>
          <h3 class="node-title" data-i18n="mindmap.education">${t('mindmap.education')}</h3>
        </div>
        <div class="node-body">
          <div class="timeline-list">
            ${(profile.academic || []).map(item => `
              <div class="timeline-item">
                <span class="timeline-year">${item.year}</span>
                <div class="timeline-content">
                  <h4 class="timeline-degree">${item.degree}</h4>
                  <p class="timeline-inst">${item.institution}</p>
                  ${item.details ? `<p class="timeline-detail">${item.details}</p>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Satellite Mini-Card 2: Professional Experience (Top-Right) -->
      <div class="mindmap-node node-experience" id="node-experience" data-index="1">
        <div class="node-header">
          <div class="node-icon-wrap icon-exp">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
          <h3 class="node-title" data-i18n="mindmap.experience">${t('mindmap.experience')}</h3>
        </div>
        <div class="node-body">
          <div class="timeline-list">
            ${(profile.professional || []).map(item => `
              <div class="timeline-item">
                <span class="timeline-period">${item.period}</span>
                <div class="timeline-content">
                  <h4 class="timeline-role">${item.role}</h4>
                  <p class="timeline-company">${item.company}</p>
                  ${item.highlights ? `<p class="timeline-detail">${item.highlights}</p>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Satellite Mini-Card 3: Core Competencies / Skills (Bottom-Left) -->
      <div class="mindmap-node node-skills" id="node-skills" data-index="2">
        <div class="node-header">
          <div class="node-icon-wrap icon-skills">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </div>
          <h3 class="node-title" data-i18n="mindmap.skills">${t('mindmap.skills')}</h3>
        </div>
        <div class="node-body">
          <div class="skills-list">
            ${(profile.skills || []).map(skill => `
              <div class="skill-item">
                <div class="skill-label-row">
                  <span class="skill-name">${skill.name}</span>
                  <span class="skill-pct">${skill.level}%</span>
                </div>
                <div class="skill-bar-track">
                  <div class="skill-bar-fill" style="width: ${skill.level}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="skill-tags-wrap">
            ${(profile.tags || []).map(tag => `
              <span class="skill-tag">#${tag}</span>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Satellite Mini-Card 4: Credentials & Achievements (Bottom-Right) -->
      <div class="mindmap-node node-achievements" id="node-achievements" data-index="3">
        <div class="node-header">
          <div class="node-icon-wrap icon-achieve">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="8" r="7"></circle>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
            </svg>
          </div>
          <h3 class="node-title" data-i18n="mindmap.achievements">${t('mindmap.achievements')}</h3>
        </div>
        <div class="node-body">
          <div class="achievements-list">
            ${(profile.achievements || []).map(item => `
              <div class="achievement-item">
                <div class="achievement-badge-pill">${item.badge}</div>
                <h4 class="achievement-title">${item.title}</h4>
                <span class="achievement-year">${item.year}</span>
              </div>
            `).join('')}
          </div>
          <div class="direct-contact-box">
            <span class="contact-label">${t('mindmap.contact')}</span>
            <a class="contact-email" href="mailto:${profile.contact?.email}">${profile.contact?.email}</a>
          </div>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  // ── Bind Event Listeners ──
  const closeBtn = overlay.querySelector('#mindmap-close-btn');
  closeBtn.addEventListener('click', () => closeMindMap(true));

  // Dismiss on clicking the blurred backdrop (outside the cards)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.id === 'mindmap-stage' || e.target.id === 'mindmap-svg') {
      closeMindMap(true);
    }
  });

  // Escape key listener
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeMindMap(true);
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  // Ask AI Button Trigger (UI feedback, ready for FastAPI backend)
  const askAiBtn = overlay.querySelector('#btn-ask-ai');
  askAiBtn.addEventListener('click', () => {
    askAiBtn.classList.add('loading-pulse');
    setTimeout(() => {
      askAiBtn.classList.remove('loading-pulse');
      alert(`🤖 [Rawabit AI Engine]\n\n${t('mindmap.aiQueryPrompt')} ${profile.name} (${profile.title}).\n\nFastAPI SSE streaming endpoint will connect here in Step 3!`);
    }, 400);
  });

  // ── Entrance Animation & SVG Lines Calculation ──
  requestAnimationFrame(() => {
    overlay.classList.add('active');

    // Wait for layout calculation
    setTimeout(() => {
      drawConnectorLines(overlay);
    }, 80);
  });

  // Resize handler to redraw lines if viewport changes
  activeResizeHandler = () => {
    if (activeOverlay) {
      drawConnectorLines(activeOverlay);
    }
  };
  window.addEventListener('resize', activeResizeHandler);
}

/**
 * Compute and draw smooth pure SVG connecting lines with stroke-dasharray animation
 */
function drawConnectorLines(overlay) {
  const stage = overlay.querySelector('#mindmap-stage');
  const svg = overlay.querySelector('#mindmap-svg');
  const pathsGroup = overlay.querySelector('#svg-paths-group');
  const nodesGroup = overlay.querySelector('#svg-nodes-group');
  const centerCard = overlay.querySelector('#mindmap-center-card');

  if (!stage || !svg || !pathsGroup || !nodesGroup || !centerCard) return;

  // Clear previous lines
  pathsGroup.innerHTML = '';
  nodesGroup.innerHTML = '';

  const stageRect = stage.getBoundingClientRect();
  const centerRect = centerCard.getBoundingClientRect();

  // Center point relative to SVG canvas
  const cx = (centerRect.left + centerRect.width / 2) - stageRect.left;
  const cy = (centerRect.top + centerRect.height / 2) - stageRect.top;

  const satelliteNodes = [
    overlay.querySelector('#node-education'),
    overlay.querySelector('#node-experience'),
    overlay.querySelector('#node-skills'),
    overlay.querySelector('#node-achievements')
  ].filter(Boolean);

  satelliteNodes.forEach((nodeEl, idx) => {
    const nodeRect = nodeEl.getBoundingClientRect();

    // Node anchor point (center of the mini-card)
    const nx = (nodeRect.left + nodeRect.width / 2) - stageRect.left;
    const ny = (nodeRect.top + nodeRect.height / 2) - stageRect.top;

    // Calculate bezier curve control points for elegant organic flow
    const dx = nx - cx;
    const dy = ny - cy;
    const cp1x = cx + dx * 0.45;
    const cp1y = cy + dy * 0.05;
    const cp2x = cx + dx * 0.55;
    const cp2y = ny - dy * 0.05;

    const pathD = `M ${cx} ${cy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${nx} ${ny}`;

    // Create SVG Path Element
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('class', 'mindmap-svg-line');
    path.setAttribute('stroke', `url(#line-grad-${(idx % 2) + 1})`);
    path.setAttribute('stroke-width', '2.5');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('filter', 'url(#glow-filter)');

    pathsGroup.appendChild(path);

    // Create glowing connector pulse dots at both terminals
    const startDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    startDot.setAttribute('cx', cx);
    startDot.setAttribute('cy', cy);
    startDot.setAttribute('r', '4');
    startDot.setAttribute('class', 'mindmap-node-dot center-dot');
    nodesGroup.appendChild(startDot);

    const endDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    endDot.setAttribute('cx', nx);
    endDot.setAttribute('cy', ny);
    endDot.setAttribute('r', '5');
    endDot.setAttribute('class', 'mindmap-node-dot satellite-dot');
    nodesGroup.appendChild(endDot);

    // ── Animate Line Drawing Outward via stroke-dasharray ──
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    // Force reflow
    path.getBoundingClientRect();

    // Trigger stroke-dashoffset transition with staggered delay
    const staggerDelay = 120 + idx * 80;
    setTimeout(() => {
      path.style.transition = 'stroke-dashoffset 650ms cubic-bezier(0.16, 1, 0.3, 1)';
      path.style.strokeDashoffset = '0';
      nodeEl.classList.add('visible');
    }, staggerDelay);
  });
}

/**
 * Gracefully dismiss and retract the Mind-Map with reverse animation
 * @param {boolean} animate - Whether to animate retraction
 */
export function closeMindMap(animate = true) {
  if (!activeOverlay) return;

  const overlay = activeOverlay;
  activeOverlay = null;

  if (activeResizeHandler) {
    window.removeEventListener('resize', activeResizeHandler);
    activeResizeHandler = null;
  }

  popOverlay();

  if (!animate) {
    overlay.remove();
    return;
  }

  // ── Retract lines & mini-cards ──
  const lines = overlay.querySelectorAll('.mindmap-svg-line');
  lines.forEach(path => {
    const len = path.getTotalLength() || 400;
    path.style.transition = 'stroke-dashoffset 300ms ease-in';
    path.style.strokeDashoffset = `${len}`;
  });

  const nodes = overlay.querySelectorAll('.mindmap-node');
  nodes.forEach(n => n.classList.remove('visible'));

  overlay.classList.remove('active');

  setTimeout(() => {
    overlay.remove();
  }, 350);
}
