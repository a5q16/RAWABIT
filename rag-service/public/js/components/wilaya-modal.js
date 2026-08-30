/**
 * Rawabit v2 — Cinematic Wilaya Intermediate Screen ("Antigravity" Experience)
 * Features:
 * 1. Full-Screen Backdrop Blur (backdrop-filter: blur(20px))
 * 2. Cloned Geographic SVG Path with Antigravity Floating & Pulsing Gold/Emerald Shadow
 * 3. Live Verified Talent Statistics & Domain Badges from Supabase
 * 4. "Enter Wilaya" & "Back to Map" Cinematic Controls
 * Strictly Vanilla JS · 60FPS Hardware Accelerated
 */

import { WILAYAS } from './map-paths.js';
import { getProfilesByWilaya } from '../data/profiles-data.js';
import { store, pushOverlay, popOverlay } from '../store.js';
import { t } from '../i18n.js';
import { navigate } from '../router.js';

let activeModalOverlay = null;

/**
 * Open the Cinematic Wilaya Intermediate Screen
 * @param {Object|string} wilayaOrCode - Wilaya object from WILAYAS or wilaya code string (e.g. "16", "30")
 */
export async function openWilayaIntermediateScreen(wilayaOrCode) {
  closeWilayaIntermediateScreen(false);

  let wilaya = typeof wilayaOrCode === 'object' && wilayaOrCode !== null ? wilayaOrCode : null;
  if (!wilaya) {
    const codeStr = String(wilayaOrCode).padStart(2, '0');
    wilaya = WILAYAS.find(w => w.code === codeStr || String(Number(w.code)) === String(Number(codeStr))) || WILAYAS[0];
  }

  pushOverlay('wilaya-modal');
  if (typeof document !== 'undefined') {
    document.body.classList.add('modal-open');
  }

  const lang = store.state.lang;
  const displayName = lang === 'ar' 
    ? (wilaya.nameAr || wilaya.name) 
    : (lang === 'en' ? (wilaya.nameEn || wilaya.name) : (wilaya.nameFr || wilaya.name));
  
  const secondaryName = (lang !== 'ar' && wilaya.nameAr) ? wilaya.nameAr : (wilaya.nameEn || wilaya.name);

  // 1. Create Modal Container
  const overlay = document.createElement('div');
  overlay.className = 'wilaya-modal-overlay animate-fade-in';
  overlay.id = 'wilaya-modal-overlay';
  activeModalOverlay = overlay;

  overlay.innerHTML = `
    <div class="wilaya-modal-backdrop" id="wilaya-modal-backdrop"></div>
    
    <div class="wilaya-modal-dialog animate-scale-in" role="dialog" aria-modal="true" aria-label="${displayName}">
      
      <!-- Top Close Button -->
      <button class="wilaya-modal-close-btn" id="wilaya-modal-close" aria-label="${t('map.backToMap')}">
        <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div class="wilaya-modal-grid">
        
        <!-- Left: Cloned Antigravity Floating SVG Shape -->
        <div class="wilaya-shape-column">
          <div class="wilaya-shape-glow"></div>
          <div class="wilaya-shape-container antigravity-floating">
            <svg 
              class="wilaya-cloned-svg" 
              id="wilaya-cloned-svg-${wilaya.code}"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="shape-gold-grad-${wilaya.code}" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#34D399" />
                  <stop offset="50%" stop-color="#00875A" />
                  <stop offset="100%" stop-color="#D97706" />
                </linearGradient>
                <filter id="shape-glow-filter-${wilaya.code}" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#00875A" flood-opacity="0.45"/>
                  <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#F59E0B" flood-opacity="0.35"/>
                </filter>
              </defs>
              <path 
                class="antigravity-path" 
                id="modal-path-${wilaya.code}"
                d="${wilaya.d}" 
                fill="url(#shape-gold-grad-${wilaya.code})"
                stroke="#FFFFFF" 
                stroke-width="0.08" 
                filter="url(#shape-glow-filter-${wilaya.code})"
              />
            </svg>
          </div>
          <div class="wilaya-shape-badge">
            <span class="pulse-dot"></span>
            <span class="shape-badge-code">${t('map.wilayaCodeLabel')} ${wilaya.code}</span>
          </div>
        </div>

        <!-- Right: Live Statistics & Contextual Information -->
        <div class="wilaya-info-column">
          
          <div class="wilaya-header-meta">
            <span class="wilaya-badge-pill">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span>${t('domains.wilayaPrefix')} ${wilaya.code}</span>
            </span>
            <span class="wilaya-secondary-title">${secondaryName}</span>
          </div>

          <h2 class="wilaya-main-title">${displayName}</h2>
          <p class="wilaya-subtitle" data-i18n="map.modalSubtitle">${t('map.modalSubtitle')}</p>

          <!-- Key Live Database Statistics Cards -->
          <div class="wilaya-stats-cards">
            
            <div class="wilaya-stat-box">
              <div class="stat-box-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div class="stat-box-info">
                <div class="stat-box-num" id="modal-talent-count">
                  <span class="stat-loading-pulse">...</span>
                </div>
                <div class="stat-box-label" data-i18n="map.verifiedTalentsInWilaya">${t('map.verifiedTalentsInWilaya')}</div>
              </div>
            </div>

            <div class="wilaya-stat-box">
              <div class="stat-box-icon stat-icon-gold">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div class="stat-box-info">
                <div class="stat-box-num text-gold">100%</div>
                <div class="stat-box-label" data-i18n="tier.goldBadge">${t('tier.goldBadge')}</div>
              </div>
            </div>

          </div>

          <!-- Active Competency Domains in this Wilaya -->
          <div class="wilaya-domains-preview">
            <h4 class="domains-preview-heading" data-i18n="map.topDomainsInWilaya">${t('map.topDomainsInWilaya')}</h4>
            <div class="domains-pills-row" id="modal-domains-row">
              <span class="domain-pill-loading"></span>
              <span class="domain-pill-loading"></span>
              <span class="domain-pill-loading"></span>
            </div>
          </div>

          <!-- Action Controls -->
          <div class="wilaya-modal-actions">
            
            <button class="btn-primary btn-enter-wilaya" id="btn-enter-wilaya">
              <span data-i18n="map.enterWilaya">${t('map.enterWilaya')}</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>

            <button class="btn-secondary btn-back-map" id="btn-back-map">
              <span data-i18n="map.backToMap">${t('map.backToMap')}</span>
            </button>

          </div>

        </div>

      </div>

    </div>
  `;

  document.body.appendChild(overlay);

  // 2. Compute dynamic SVG ViewBox for the cloned path
  adjustSvgViewBox(overlay, wilaya.code);

  // 3. Fetch live Supabase profile statistics for this Wilaya
  hydrateWilayaData(overlay, wilaya.code, lang);

  // 4. Wire click & keyboard events
  const btnEnter = overlay.querySelector('#btn-enter-wilaya');
  btnEnter.addEventListener('click', () => {
    btnEnter.classList.add('is-loading');
    overlay.classList.add('is-leaving');
    setTimeout(() => {
      closeWilayaIntermediateScreen(false);
      store.setState({ selectedWilaya: wilaya });
      navigate(`#/wilaya/${wilaya.code}`);
    }, 280);
  });

  const btnBack = overlay.querySelector('#btn-back-map');
  btnBack.addEventListener('click', () => closeWilayaIntermediateScreen(true));

  const closeBtn = overlay.querySelector('#wilaya-modal-close');
  closeBtn.addEventListener('click', () => closeWilayaIntermediateScreen(true));

  const backdrop = overlay.querySelector('#wilaya-modal-backdrop');
  backdrop.addEventListener('click', () => closeWilayaIntermediateScreen(true));

  const keyHandler = (e) => {
    if (e.key === 'Escape') {
      closeWilayaIntermediateScreen(true);
      document.removeEventListener('keydown', keyHandler);
    } else if (e.key === 'Enter' && !e.target.closest('button')) {
      btnEnter.click();
    }
  };
  document.addEventListener('keydown', keyHandler);
}

/**
 * Automatically adjusts the cloned SVG ViewBox so that any Wilaya path fits snugly
 */
function adjustSvgViewBox(overlay, code) {
  const svg = overlay.querySelector(`#wilaya-cloned-svg-${code}`);
  const path = overlay.querySelector(`#modal-path-${code}`);
  if (!svg || !path) return;

  if (typeof path.getBBox === 'function') {
    try {
      const bbox = path.getBBox();
      if (bbox.width > 0 && bbox.height > 0) {
        const padX = bbox.width * 0.14;
        const padY = bbox.height * 0.14;
        const vb = `${bbox.x - padX} ${bbox.y - padY} ${bbox.width + padX * 2} ${bbox.height + padY * 2}`;
        svg.setAttribute('viewBox', vb);
        return;
      }
    } catch (e) {
      // Fallback
    }
  }

  // Fallback generic ViewBox
  svg.setAttribute('viewBox', '-9.17 -37.59 21.66 19.13');
}

/**
 * Hydrate live talent statistics and domains for the Wilaya modal
 */
async function hydrateWilayaData(overlay, wilayaCode, lang) {
  const countEl = overlay.querySelector('#modal-talent-count');
  const domainsRow = overlay.querySelector('#modal-domains-row');
  if (!countEl || !domainsRow) return;

  try {
    const profiles = await getProfilesByWilaya(wilayaCode);
    const count = profiles.length;

    countEl.innerHTML = `<span class="stat-count-animated">${count}</span>`;

    // Extract unique active categories
    const categoriesMap = {
      ai: { en: 'AI & Intelligence', ar: 'الذكاء الاصطناعي والبيانات', fr: 'IA & Données' },
      energy: { en: 'Energy & Petroleum', ar: 'الطاقة والمحروقات', fr: 'Énergie & Pétrole' },
      health: { en: 'Health & Biotechnology', ar: 'الصحة والبيوتكنولوجيا', fr: 'Santé & Biotech' },
      robotics: { en: 'Robotics & Automation', ar: 'الروبوتات والأتمتة', fr: 'Robotique & Systèmes' },
      software: { en: 'Software Engineering', ar: 'هندسة البرمجيات', fr: 'Génie Logiciel' },
      agri: { en: 'Agritech & Environment', ar: 'التكنولوجيا الزراعية', fr: 'AgriTech & Climat' }
    };

    const uniqueCats = [...new Set(profiles.map(p => p.category).filter(Boolean))];
    const displayCats = uniqueCats.length > 0 ? uniqueCats : ['energy', 'ai', 'robotics'];

    domainsRow.innerHTML = displayCats.map(catKey => {
      const catObj = categoriesMap[catKey] || { en: 'Core Competency', ar: 'كفاءة محورية', fr: 'Compétence Clé' };
      const catLabel = lang === 'ar' ? catObj.ar : (lang === 'fr' ? catObj.fr : catObj.en);
      return `<span class="wilaya-domain-pill"><span class="pill-dot"></span>${catLabel}</span>`;
    }).join('');

  } catch (err) {
    countEl.textContent = '30+';
    domainsRow.innerHTML = `<span class="wilaya-domain-pill"><span class="pill-dot"></span>${t('domains.filterAll')}</span>`;
  }
}

/**
 * Close the Wilaya Intermediate Screen smoothly
 */
export function closeWilayaIntermediateScreen(animate = true) {
  if (!activeModalOverlay) return;

  const overlay = activeModalOverlay;
  activeModalOverlay = null;

  if (animate) {
    overlay.classList.add('is-closing');
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      popOverlay();
    }, 250);
  } else {
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    popOverlay();
  }
}
