/**
 * Rawabit v2 — Centered Wilaya View & Competency Domains First Architecture
 * Strictly Centered Hero · Clean Luxury Typography · Domain Cards Before Profiles
 * Unified Smart Search Component with Local vs Global Scope Switcher
 * Proactive "Lost User" AI Assistant (Hesitation Logic & Floating Text) · Mind-Map Integration
 * Pure Vanilla JS · 60FPS Performance
 */

import { getProfilesByWilaya, getAllCategories, searchGlobalProfiles, generateLuxuryAvatar } from '../data/profiles-data.js';
import { WILAYAS } from './map-paths.js';
import { openMindMap, getProfileSources } from './mindmap.js';
import { openAIChat } from './chat.js';
import { initSmartSearch } from './smart-search.js';
import { t, applyTranslations } from '../i18n.js';
import { store } from '../store.js';
import { navigate } from '../router.js';

export { getProfileSources };

let activeDomain = null; // null = Domains Grid, string = Active Domain Profiles Grid
let searchQuery = '';
let currentWilayaCode = '16';
let activeScope = 'local'; // 'local' (this Wilaya) | 'global' (all Wilayas)
let globalProfiles = [];
let currentProfiles = [];
let isFetchingProfiles = false;

/**
 * Domain SVG Icons Helper
 */
function getDomainIconSvg(iconType) {
  switch (iconType) {
    case 'ai':
      return `
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a8 8 0 0 0-8 8c0 3.4 2.1 6.3 5.1 7.4L9 22h6l-.1-4.6c3-1.1 5.1-4 5.1-7.4a8 8 0 0 0-8-8z"></path>
          <line x1="9" y1="9" x2="9.01" y2="9"></line>
          <line x1="15" y1="9" x2="15.01" y2="9"></line>
          <path d="M10 13c.5.5 1.2.8 2 .8s1.5-.3 2-.8"></path>
        </svg>
      `;
    case 'energy':
      return `
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
          <path d="M13 2 11 8h4l-2 6"></path>
        </svg>
      `;
    case 'health':
      return `
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
        </svg>
      `;
    case 'robotics':
      return `
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2"></rect>
          <rect x="9" y="9" width="6" height="6"></rect>
          <line x1="9" y1="1" x2="9" y2="4"></line>
          <line x1="15" y1="1" x2="15" y2="4"></line>
          <line x1="9" y1="20" x2="9" y2="23"></line>
          <line x1="15" y1="20" x2="15" y2="23"></line>
          <line x1="20" y1="9" x2="23" y2="9"></line>
          <line x1="20" y1="14" x2="23" y2="14"></line>
          <line x1="1" y1="9" x2="4" y2="9"></line>
          <line x1="1" y1="14" x2="4" y2="14"></line>
        </svg>
      `;
    case 'software':
      return `
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      `;
    case 'agri':
    default:
      return `
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"></path>
          <path d="M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path>
        </svg>
      `;
  }
}

/**
 * Tier Badge SVG Icons Helper
 */
function getTierBadgeIconSvg(tier) {
  if (tier === 'gold') {
    return `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
  } else if (tier === 'bronze') {
    return `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>`;
}

/**
 * Render the Centered Wilaya View (Async Supabase REST API Integration)
 * @param {string} wilayaCode - The 2-digit wilaya code (e.g., "16")
 */
export async function renderProfiles(wilayaCode) {
  const main = document.getElementById('main-content');
  if (!main) return;

  currentWilayaCode = String(wilayaCode).padStart(2, '0');
  const code = currentWilayaCode;
  const wilayaMeta = WILAYAS.find(w => w.code === code) || { code, name: `Wilaya ${code}`, nameAr: `ولاية ${code}` };
  const categories = getAllCategories();
  const lang = store.state.lang;
  
  activeDomain = null;
  searchQuery = '';
  activeScope = 'local';
  globalProfiles = [];

  // Format localized Wilaya Title (Clean luxury typography: "ولاية الجزائر" / "Wilaya of Algiers")
  let wilayaCleanTitle = '';
  if (lang === 'ar') {
    wilayaCleanTitle = `${t('domains.wilayaPrefix')} ${wilayaMeta.nameAr || wilayaMeta.name}`;
  } else if (lang === 'fr') {
    wilayaCleanTitle = `${t('domains.wilayaPrefix')} ${wilayaMeta.nameFr || wilayaMeta.name}`;
  } else {
    wilayaCleanTitle = `${t('domains.wilayaPrefix')} ${wilayaMeta.nameEn || wilayaMeta.name}`;
  }

  const loadingText = lang === 'ar' 
    ? 'جاري الاتصال بقاعدة البيانات واسترجاع الكفاءات...' 
    : (lang === 'fr' ? 'Connexion à la base de données et chargement des compétences...' : 'Connecting to database and fetching verified talents...');

  main.innerHTML = `
    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- 1. STRICTLY CENTERED HERO (ABSOLUTE SYMMETRY, ZERO CLUTTER)    -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <section class="wilaya-hero-section section">
      <div class="container">
        
        <!-- Subtle Back to Map Navigation -->
        <div class="wilaya-top-bar animate-fade-in">
          <button class="btn-back-clean" id="btn-back-map" title="${t('domains.backToMap')}">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span data-i18n="domains.backToMap">${t('domains.backToMap')}</span>
          </button>
        </div>

        <!-- Symmetrical Centered Hero Content -->
        <div class="wilaya-centered-hero animate-fade-in stagger-1">
          
          <!-- Bold Luxury Typography -->
          <h1 class="wilaya-title-pure">${wilayaCleanTitle}</h1>
          
          <p class="wilaya-subtitle-pure" data-i18n="domains.subtitle">
            ${t('domains.subtitle')}
          </p>

          <!-- ── UNIFIED SLEEK SMART SEARCH OMNIBAR ── -->
          <div class="giant-ai-search-wrap animate-fade-in stagger-2">
            <form class="ai-search-box wilaya-search-box" id="wilaya-search-form" onsubmit="event.preventDefault();">
              
              <div class="ai-search-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
                </svg>
              </div>

              <input 
                type="text" 
                class="ai-search-input" 
                id="wilaya-search-input" 
                placeholder="${t('domains.searchPlaceholder')}"
                data-i18n-placeholder="domains.searchPlaceholder"
                value="${searchQuery}"
                autocomplete="off"
              />

              <button type="submit" class="ai-search-btn" title="${t('search.btn')}">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>

            </form>
          </div>

        </div>

      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- 2. MAIN CONTENT STAGE: LOADING SKELETON / DYNAMIC STAGE        -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <section class="wilaya-content-section section">
      <div class="container" id="wilaya-dynamic-stage">
        <div class="profiles-loading-state animate-fade-in">
          <div class="profiles-loading-spinner"></div>
          <p class="profiles-loading-text">${loadingText}</p>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- 3. MASSIVELY SIMPLIFIED FOOTER                                 -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <footer class="footer-minimal" id="site-footer">
      <div class="container">
        <div class="footer-minimal-inner">
          
          <div class="footer-minimal-brand">
            <img class="footer-logo-img" src="./logo.png" alt="Rawabit Logo" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12); flex-shrink: 0;" />
            <span class="footer-logo-name" data-i18n="nav.brandName">${t('nav.brandName')}</span>
          </div>

          <!-- Footer navigation links -->
          <nav class="footer-minimal-nav footer-nav">
            <a class="footer-minimal-link" href="#/about" data-i18n="footer.link1">${t('footer.link1')}</a>
            <a class="footer-minimal-link" href="#/vision" data-i18n="footer.link2">${t('footer.link2')}</a>
            <a class="footer-minimal-link trigger-roadmap" href="javascript:void(0)" id="trigger-roadmap-footer" data-i18n="nav.roadmap">${t('nav.roadmap')}</a>
            <a class="footer-minimal-link" href="#/contact" data-i18n="footer.link3">${t('footer.link3')}</a>
          </nav>

          <p class="footer-minimal-copy" data-i18n="footer.copy">${t('footer.copy')}</p>

        </div>
      </div>
    </footer>
  `;

  applyTranslations();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // ── Fetch from Supabase PostgreSQL REST API ──
  isFetchingProfiles = true;
  currentProfiles = await getProfilesByWilaya(code);
  isFetchingProfiles = false;

  // ── Render Active State ──
  renderDynamicStage(currentProfiles, categories);

  // ── Wire Top Back Button ──
  const btnBack = main.querySelector('#btn-back-map');
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      stopHesitationTracker();
      activeDomain = null;
      searchQuery = '';
      activeScope = 'local';
      navigate('#/');
    });
  }

  // ── Wire Unified Smart Search Component ──
  const wilayaForm = main.querySelector('#wilaya-search-form');
  const searchInput = main.querySelector('#wilaya-search-input');

  if (wilayaForm && searchInput) {
    initSmartSearch(wilayaForm, searchInput, {
      wilayaCode: code,
      defaultScope: 'local',
      onScopeChange: async (newScope) => {
        activeScope = newScope;
        if (searchQuery.length > 1) {
          recordUserEngagement();
        }
        if (activeScope === 'global' && searchQuery.trim().length >= 2) {
          const results = await searchGlobalProfiles(searchQuery.trim());
          globalProfiles = results || [];
        }
        renderDynamicStage(currentProfiles, categories);
      },
      onSearchInput: async (val, scope) => {
        searchQuery = val.toLowerCase().trim();
        activeScope = scope;
        if (searchQuery.length > 1) {
          recordUserEngagement();
        }
        if (activeScope === 'global' && searchQuery.length >= 2) {
          const results = await searchGlobalProfiles(searchQuery);
          globalProfiles = results || [];
        }
        renderDynamicStage(currentProfiles, categories);
      }
    });
  }

  // ── Start Proactive Lost User AI Assistant Tracker ──
  startHesitationTracker();
}

/**
 * Switch dynamically between Step 1 (Domains Grid) and Step 2 (Profiles Grid)
 */
function renderDynamicStage(profiles, categories) {
  const stage = document.getElementById('wilaya-dynamic-stage');
  if (!stage) return;

  // ── Condition 1: Global Search Active with Query -> Render Global Profiles Grid ──
  if (activeScope === 'global' && searchQuery) {
    renderProfilesGrid(stage, globalProfiles, categories, true);
    return;
  }

  // ── Condition 2: Local Search Active OR Domain Selected -> Render Local Wilaya Profiles Grid ──
  if (searchQuery || activeDomain !== null) {
    renderProfilesGrid(stage, profiles, categories, false);
    return;
  }

  // ── Condition 3: Default Initial View -> Render Competency Domains Grid ──
  renderDomainsGrid(stage, profiles, categories);
}

/**
 * ── STEP 1: COMPETENCY DOMAINS GRID (CLEAN TITLE, ZERO CLUTTER) ──
 */
function renderDomainsGrid(container, profiles, categories) {
  const lang = store.state.lang;

  // Completely filter out any domain with 0 Verified Talents in this wilaya
  const activeCategories = categories.filter(cat => {
    return profiles.some(p => p.category === cat.id);
  });

  container.innerHTML = `
    <div class="domains-view-wrapper animate-fade-in">
      
      <div class="domains-grid-header">
        <h2 class="domains-grid-heading" data-i18n="domains.title">${t('domains.title')}</h2>
      </div>

      ${activeCategories.length === 0 ? `
        <div class="empty-profiles-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <h3 data-i18n="profiles.noResults">${t('profiles.noResults')}</h3>
        </div>
      ` : `
        <div class="domains-cards-grid">
          ${activeCategories.map((cat, idx) => {
            const catTitle = (lang === 'ar' && cat.labelAr) ? cat.labelAr : (lang === 'fr' && cat.labelFr ? cat.labelFr : cat.label);
            const catDesc = (lang === 'ar' && cat.descAr) ? cat.descAr : (lang === 'fr' && cat.descFr ? cat.descFr : cat.desc);
            
            const countInDomain = profiles.filter(p => p.category === cat.id).length;

            return `
              <article class="domain-card animate-fade-in-up" style="animation-delay: ${idx * 70}ms;" data-domain-id="${cat.id}">
                
                <div class="domain-card-icon-box">
                  ${getDomainIconSvg(cat.icon || cat.id)}
                </div>

                <h3 class="domain-card-title">${catTitle}</h3>
                <p class="domain-card-desc">${catDesc}</p>

                <div class="domain-card-footer">
                  <span class="domain-stat-pill">
                    <span class="stat-bullet"></span>
                    <strong>${countInDomain}</strong> ${t('domains.verifiedStat')}
                  </span>
                  
                  <span class="domain-explore-btn">
                    <span data-i18n="domains.viewProfiles">${t('domains.viewProfiles')}</span>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </span>
                </div>

              </article>
            `;
          }).join('')}
        </div>
      `}

    </div>
  `;

  // Wire click on domain card -> reveal profiles for that domain
  container.querySelectorAll('.domain-card').forEach(card => {
    card.addEventListener('click', () => {
      recordUserEngagement();
      const domainId = card.dataset.domainId;
      activeDomain = domainId;
      renderDynamicStage(profiles, categories);
      window.scrollTo({ top: 380, behavior: 'smooth' });
    });
  });
}

/**
 * ── STEP 2: PROFILES GRID (Revealed on Domain Click or Search) ──
 */
function renderProfilesGrid(container, profiles, categories, isGlobal = false) {
  const lang = store.state.lang;

  // Filter profiles
  const filtered = profiles.filter(p => {
    const matchesDomain = (activeDomain === null) || (p.category === activeDomain);
    if (!matchesDomain) return false;

    if (!searchQuery) return true;
    const nameMatch = (p.name && p.name.toLowerCase().includes(searchQuery)) ||
                      (p.nameAr && p.nameAr.includes(searchQuery));
    const titleMatch = (p.title && p.title.toLowerCase().includes(searchQuery)) ||
                       (p.titleAr && p.titleAr.includes(searchQuery));
    const tagMatch = p.tags && p.tags.some(t => t.toLowerCase().includes(searchQuery));
    return nameMatch || titleMatch || tagMatch;
  });

  // Header Title
  let activeDomainTitle = '';
  if (isGlobal) {
    activeDomainTitle = searchQuery 
      ? `${t('search.scopeHeadingGlobal')} — "${searchQuery}"` 
      : t('search.scopeHeadingGlobal');
  } else {
    const currentCat = categories.find(c => c.id === activeDomain);
    activeDomainTitle = currentCat 
      ? ((lang === 'ar' && currentCat.labelAr) ? currentCat.labelAr : (lang === 'fr' && currentCat.labelFr ? currentCat.labelFr : currentCat.label))
      : (searchQuery ? `${t('search.resultsFor')} "${searchQuery}"` : t('domains.filterAll'));
  }

  container.innerHTML = `
    <div class="profiles-view-wrapper animate-fade-in">
      
      <!-- Sub-Nav & Domain Context Header -->
      <div class="profiles-context-header">
        <button class="btn-back-to-domains" id="btn-back-domains">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span data-i18n="domains.backToDomains">${t('domains.backToDomains')}</span>
        </button>

        <div class="active-domain-indicator">
          <span class="active-domain-label">${activeDomainTitle}</span>
          <span class="active-domain-badge">${filtered.length} ${t('domains.verifiedStat')}</span>
        </div>
      </div>

      <!-- Profiles Cards Grid -->
      <div class="profiles-cards-grid" id="profiles-cards-grid">
        ${filtered.length === 0 ? `
          <div class="empty-profiles-state">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <h3 data-i18n="profiles.noResults">${t('profiles.noResults')}</h3>
            <button class="btn-reset-filters" id="btn-reset-all" data-i18n="profiles.resetFilters">${t('profiles.resetFilters')}</button>
          </div>
        ` : filtered.map((profile, index) => {
          const displayName = (lang === 'ar' && profile.nameAr) ? profile.nameAr : (lang === 'fr' && profile.nameFr ? profile.nameFr : profile.name);
          const displayTitle = (lang === 'ar' && profile.titleAr) ? profile.titleAr : (lang === 'fr' && profile.titleFr ? profile.titleFr : profile.title);
          const displayOrg = (lang === 'ar' && profile.organizationAr) ? profile.organizationAr : (lang === 'fr' && profile.organizationFr ? profile.organizationFr : profile.organization);
          const displayLoc = (lang === 'ar' && profile.locationAr) ? profile.locationAr : (lang === 'fr' && profile.locationFr ? profile.locationFr : profile.location);

          const tierClass = profile.tier || 'silver';
          const tierText = (lang === 'ar' && profile.tierLabelAr) 
            ? profile.tierLabelAr 
            : (lang === 'fr' && profile.tierLabelFr ? profile.tierLabelFr : (profile.tierLabel || t(`tier.${tierClass}`)));

          const pWilaya = profile.wilayaCode || profile.wilaya_id || currentWilayaCode;

          return `
            <article class="profile-card animate-fade-in-up" style="animation-delay: ${Math.min(index * 60, 360)}ms;" data-id="${profile.id}">
              
              <div class="card-top-row">
                <div class="card-avatar-wrap">
                  <img 
                    class="card-avatar" 
                    src="${profile.avatar}" 
                    alt="${profile.name}" 
                    loading="lazy"
                  />
                  <div class="verified-indicator tier-indicator-${tierClass}" title="${tierText}">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="white">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                  </div>
                </div>

                <div style="display: flex; align-items: center; gap: 8px;">
                  ${isGlobal ? `
                    <span style="font-size: 0.76rem; font-weight: 800; color: #00875A; background: #E6F4ED; padding: 4px 10px; border-radius: 9999px;">
                      Wilaya ${pWilaya}
                    </span>
                  ` : ''}
                  <div class="tier-badge tier-${tierClass}" title="${t(`tier.${tierClass}Badge`)}">
                    ${getTierBadgeIconSvg(tierClass)}
                    <span>${tierText}</span>
                  </div>
                </div>
              </div>

              <div class="card-body">
                <h3 class="card-name">${displayName}</h3>
                <p class="card-title">${displayTitle}</p>
                
                <div class="card-meta">
                  <span class="meta-item">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a8 8 0 00-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 00-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z"/></svg>
                    ${displayLoc}
                  </span>
                  <span class="meta-item">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 7v14M21 7v14M6 7V3h12v4M9 11h2M13 11h2M9 15h2M13 15h2"/></svg>
                    ${displayOrg}
                  </span>
                </div>

                <div class="card-tags">
                  ${(profile.tags || []).slice(0, 3).map(tag => `
                    <span class="card-tag">#${tag}</span>
                  `).join('')}
                </div>
              </div>

              <div class="card-footer">
                <button class="btn-card-action btn-open-mindmap" data-profile-id="${profile.id}">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                  <span data-i18n="profiles.exploreMindmap">${t('profiles.exploreMindmap')}</span>
                </button>
              </div>

            </article>
          `;
        }).join('')}
      </div>

    </div>
  `;

  // Wire Back to Domains Button
  const btnBackDomains = container.querySelector('#btn-back-domains');
  if (btnBackDomains) {
    btnBackDomains.addEventListener('click', () => {
      activeDomain = null;
      searchQuery = '';
      activeScope = 'local';
      const searchInput = document.getElementById('wilaya-search-input');
      if (searchInput) searchInput.value = '';
      const localBtn = document.getElementById('scope-btn-local');
      const globalBtn = document.getElementById('scope-btn-global');
      if (localBtn) localBtn.classList.add('active');
      if (globalBtn) globalBtn.classList.remove('active');
      renderDynamicStage(profiles, categories);
      window.scrollTo({ top: 380, behavior: 'smooth' });
    });
  }

  // Wire Reset Filters Button
  const btnReset = container.querySelector('#btn-reset-all');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      activeDomain = null;
      searchQuery = '';
      activeScope = 'local';
      const searchInput = document.getElementById('wilaya-search-input');
      if (searchInput) searchInput.value = '';
      const localBtn = document.getElementById('scope-btn-local');
      const globalBtn = document.getElementById('scope-btn-global');
      if (localBtn) localBtn.classList.add('active');
      if (globalBtn) globalBtn.classList.remove('active');
      renderDynamicStage(profiles, categories);
    });
  }

  // Wire Mind-Map Modal Trigger on Profile Cards
  container.querySelectorAll('.btn-open-mindmap').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      recordUserEngagement();
      const pId = btn.dataset.profileId;
      const targetProfile = (isGlobal ? globalProfiles : profiles).find(p => String(p.id) === String(pId)) || profiles.find(p => String(p.id) === String(pId));
      if (targetProfile) {
        openMindMap(targetProfile);
      }
    });
  });

  // Wire clicking card directly
  container.querySelectorAll('.profile-card').forEach(card => {
    card.addEventListener('click', () => {
      recordUserEngagement();
      const pId = card.dataset.id;
      const targetProfile = (isGlobal ? globalProfiles : profiles).find(p => String(p.id) === String(pId)) || profiles.find(p => String(p.id) === String(pId));
      if (targetProfile) {
        openMindMap(targetProfile);
      }
    });
  });
}

// ══════════════════════════════════════════════════════════════
// ── SMART BEHAVIORAL HESITATION ALGORITHM (AI ASSISTANT) ──
// ══════════════════════════════════════════════════════════════

let hesitationTrackerActive = false;
let idleTimer = null;
let lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
let lastScrollDirection = null;
let scrollDirectionChanges = []; // Tracks timestamps of rapid scroll reversals
let userHasInteracted = false;
let promptCooldownUntil = 0;
let hasPromptedThisSession = false;
let activeProactiveOverlay = null;

/**
 * Record user engagement (clicking domain, typing search, opening profile)
 * Once engaged, hesitation prompts are completely suppressed.
 */
function recordUserEngagement() {
  userHasInteracted = true;
  stopHesitationTracker();
}

/**
 * Handle Scroll Events with Direction-Reversal Pacing Analysis
 */
function onUserScroll() {
  if (userHasInteracted || hasPromptedThisSession || (promptCooldownUntil && Date.now() < promptCooldownUntil)) {
    return;
  }

  const currentY = window.scrollY;
  const delta = currentY - lastScrollY;
  const absDelta = Math.abs(delta);
  const now = Date.now();

  // Ignore micro-scroll jitter (< 40px)
  if (absDelta < 40) return;

  const currentDir = delta > 0 ? 'down' : 'up';

  // Detect genuine rapid direction reversal (Yo-Yo scrolling)
  if (lastScrollDirection && currentDir !== lastScrollDirection) {
    scrollDirectionChanges.push(now);
    // Keep only reversals within the last 6 seconds
    scrollDirectionChanges = scrollDirectionChanges.filter(t => now - t <= 6000);

    // If user changed direction 4+ times rapidly without selecting anything -> High-confidence hesitation
    if (scrollDirectionChanges.length >= 4) {
      scrollDirectionChanges = [];
      triggerProactiveAiOverlay();
      return;
    }
  }

  lastScrollDirection = currentDir;
  lastScrollY = currentY;

  // Reset prolonged idle timer (Set to 45s of genuine inaction)
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    // Only trigger if user is still on initial view without interacting and tab is focused
    if (!document.hidden && !userHasInteracted && !hasPromptedThisSession && activeDomain === null && !searchQuery) {
      triggerProactiveAiOverlay();
    }
  }, 45000);
}

function onUserMouseMove() {
  // Gentle activity refresh without false-positive triggers
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (!document.hidden && !userHasInteracted && !hasPromptedThisSession && activeDomain === null && !searchQuery) {
      triggerProactiveAiOverlay();
    }
  }, 45000);
}

export function startHesitationTracker() {
  stopHesitationTracker();
  hesitationTrackerActive = true;
  userHasInteracted = false;
  scrollDirectionChanges = [];
  lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;

  window.addEventListener('scroll', onUserScroll, { passive: true });
  window.addEventListener('mousemove', onUserMouseMove, { passive: true });

  // 45s base idle timer for completely untouched page
  idleTimer = setTimeout(() => {
    if (!document.hidden && !userHasInteracted && !hasPromptedThisSession && activeDomain === null && !searchQuery) {
      triggerProactiveAiOverlay();
    }
  }, 45000);
}

export function stopHesitationTracker() {
  hesitationTrackerActive = false;
  clearTimeout(idleTimer);
  idleTimer = null;
  scrollDirectionChanges = [];
  window.removeEventListener('scroll', onUserScroll);
  window.removeEventListener('mousemove', onUserMouseMove);
  if (activeProactiveOverlay) {
    dismissProactiveAiOverlay();
  }
}

export function resetHesitationTracker() {
  clearTimeout(idleTimer);
  scrollDirectionChanges = [];
  if (hesitationTrackerActive && !userHasInteracted && !hasPromptedThisSession) {
    idleTimer = setTimeout(() => {
      if (!document.hidden && !userHasInteracted && !hasPromptedThisSession && activeDomain === null && !searchQuery) {
        triggerProactiveAiOverlay();
      }
    }, 45000);
  }
}

/**
 * Trigger Proactive AI Assistant Full-Screen Ambient Overlay (Zero Pop-Up Boxes)
 */
export function triggerProactiveAiOverlay() {
  if (activeProactiveOverlay || document.getElementById('proactive-ai-overlay')) return;
  if (store.state.overlayStack && store.state.overlayStack.length > 0) return; // Don't interrupt open mindmap or language selector
  if (userHasInteracted || hasPromptedThisSession) return;
  if (promptCooldownUntil && Date.now() < promptCooldownUntil) return;

  hasPromptedThisSession = true;

  const lang = store.state.lang;
  const headingText = t('proactive.heading') || (lang === 'ar' ? 'هل تبحث عن تخصص معين؟' : 'Looking for a specific expertise?');
  const subText = t('proactive.sub') || (lang === 'ar' ? 'مساعدنا الذكي جاهز لإرشادك مباشرة إلى الكفاءات المناسبة في هذه الولاية.' : 'Our AI assistant is ready to guide you directly to matching competencies in this wilaya.');
  const btnText = t('proactive.btn') || (lang === 'ar' ? 'اسأل المساعد الذكي' : 'Ask AI Assistant');

  const overlay = document.createElement('div');
  overlay.className = 'proactive-ai-overlay';
  overlay.id = 'proactive-ai-overlay';
  activeProactiveOverlay = overlay;

  overlay.innerHTML = `
    <div class="proactive-ai-content animate-fade-in">
      <h1 class="proactive-ai-heading">${headingText}</h1>
      <p class="proactive-ai-subtitle">${subText}</p>
      <button class="proactive-ai-btn" id="btn-proactive-ask">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
        </svg>
        <span>${btnText}</span>
      </button>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });

  // Action Button Click -> Open AI Chat Drawer & record engagement
  const askBtn = overlay.querySelector('#btn-proactive-ask');
  if (askBtn) {
    askBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      recordUserEngagement();
      dismissProactiveAiOverlay();
      const wilayaMeta = WILAYAS.find(w => w.code === currentWilayaCode) || { name: 'Algiers', nameAr: 'الجزائر' };
      const wilayaName = lang === 'ar' ? (wilayaMeta.nameAr || wilayaMeta.name) : wilayaMeta.name;
      const prompt = lang === 'ar'
        ? `اقترح لي أفضل الكفاءات والخبراء في ولاية ${wilayaName}`
        : `Recommend the top verified competencies and researchers in ${wilayaName}`;
      openAIChat({ type: 'wilaya', wilayaCode: currentWilayaCode, initialQuery: prompt });
    });
  }

  // Dismissal: Clicking anywhere on the full-screen background (except on the button) fades it out
  overlay.addEventListener('click', (e) => {
    if (!e.target.closest('#btn-proactive-ask')) {
      dismissProactiveAiOverlay();
    }
  });

  // Dismiss on Escape key
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      dismissProactiveAiOverlay();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

export function dismissProactiveAiOverlay() {
  if (!activeProactiveOverlay) return;
  const el = activeProactiveOverlay;
  el.classList.remove('active');
  activeProactiveOverlay = null;

  // Set a 5-minute cooldown so it never annoys the user repeatedly
  promptCooldownUntil = Date.now() + (5 * 60 * 1000);
  stopHesitationTracker();

  setTimeout(() => {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }, 400);
}
