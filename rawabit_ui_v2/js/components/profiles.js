/**
 * Rawabit v2 — Profiles Grid View Component
 * Clean CSS Grid layout of verified Algerian competencies for a selected wilaya,
 * with real-time filtering, search, and the Mind-Map experience on click.
 * Strictly Vanilla JS · 60FPS Performance
 */

import { getProfilesByWilaya, getAllCategories } from '../data/profiles-data.js';
import { WILAYAS } from './map-paths.js';
import { openMindMap } from './mindmap.js';
import { t, applyTranslations } from '../i18n.js';
import { store } from '../store.js';
import { navigate } from '../router.js';

let activeCategory = 'all';
let searchQuery = '';

/**
 * Render the Profiles View for a given wilaya code
 * @param {string} wilayaCode - The 2-digit wilaya code (e.g., "16")
 */
export function renderProfiles(wilayaCode) {
  const main = document.getElementById('main-content');
  if (!main) return;

  const code = String(wilayaCode).padStart(2, '0');
  const wilayaMeta = WILAYAS.find(w => w.code === code) || { code, name: `Wilaya ${code}`, nameAr: `ولاية ${code}` };
  const allProfiles = getProfilesByWilaya(code);

  const lang = store.state.lang;
  const wilayaDisplayName = (lang === 'ar' && wilayaMeta.nameAr) ? wilayaMeta.nameAr : wilayaMeta.name;

  // Calculate average reliability
  const avgRel = allProfiles.length > 0 
    ? Math.round(allProfiles.reduce((acc, p) => acc + p.reliability, 0) / allProfiles.length)
    : 95;

  main.innerHTML = `
    <!-- Top Wilaya Hero / Header Section -->
    <section class="profiles-hero section">
      <div class="container">
        
        <!-- Navigation Breadcrumb -->
        <div class="profiles-nav-row animate-fade-in">
          <button class="btn-back-map" id="btn-back-map">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span data-i18n="profiles.back">${t('profiles.back')}</span>
          </button>

          <div class="wilaya-id-badge">
            <span class="wilaya-code-circle">${code}</span>
            <span class="wilaya-name-badge">${wilayaDisplayName}</span>
          </div>
        </div>

        <!-- Section Title & Meta -->
        <div class="profiles-header-content animate-fade-in stagger-1">
          <span class="badge" data-i18n="profiles.badge">${t('profiles.badge')}</span>
          <h1 class="profiles-title">
            <span data-i18n="profiles.titlePrefix">${t('profiles.titlePrefix')}</span> 
            <span class="accent-text">${wilayaDisplayName}</span>
          </h1>
          
          <div class="profiles-stats-strip animate-fade-in stagger-2">
            <div class="stat-pill">
              <span class="stat-val">${allProfiles.length}</span>
              <span class="stat-label" data-i18n="profiles.verifiedCount">${t('profiles.verifiedCount')}</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-pill">
              <span class="stat-val">${avgRel}%</span>
              <span class="stat-label" data-i18n="profiles.avgReliability">${t('profiles.avgReliability')}</span>
            </div>
          </div>
        </div>

        <!-- Filter & Search Controls -->
        <div class="profiles-controls-wrap animate-fade-in stagger-3">
          
          <!-- Omnibar Search -->
          <div class="search-omnibar">
            <svg class="search-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              class="search-input" 
              id="profiles-search-input" 
              placeholder="${t('profiles.searchPlaceholder')}"
              data-i18n-placeholder="profiles.searchPlaceholder"
              value="${searchQuery}"
            />
            ${searchQuery ? `<button class="clear-search-btn" id="clear-search-btn">✕</button>` : ''}
          </div>

          <!-- Category Filter Pills -->
          <div class="category-pills" id="category-pills">
            <button class="cat-pill ${activeCategory === 'all' ? 'active' : ''}" data-cat="all" data-i18n="profiles.filterAll">${t('profiles.filterAll')}</button>
            <button class="cat-pill ${activeCategory === 'ai' ? 'active' : ''}" data-cat="ai">AI & DeepTech</button>
            <button class="cat-pill ${activeCategory === 'health' ? 'active' : ''}" data-cat="health">Health & Biotech</button>
            <button class="cat-pill ${activeCategory === 'energy' ? 'active' : ''}" data-cat="energy">Renewable Energy</button>
            <button class="cat-pill ${activeCategory === 'robotics' ? 'active' : ''}" data-cat="robotics">Robotics & IoT</button>
            <button class="cat-pill ${activeCategory === 'software' ? 'active' : ''}" data-cat="software">Cloud & Cyber</button>
          </div>

        </div>

      </div>
    </section>

    <!-- ── PROFILES GRID SECTION ── -->
    <section class="profiles-grid-section section">
      <div class="container">
        <div class="profiles-grid" id="profiles-grid-container">
          <!-- Profiles Cards Injected via JS -->
        </div>
      </div>
    </section>
  `;

  applyTranslations();

  // ── Render Initial Grid ──
  filterAndRenderGrid(allProfiles);

  // ── Wire Back to Map ──
  const btnBack = main.querySelector('#btn-back-map');
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      navigate('#/');
    });
  }

  // ── Wire Category Filters ──
  const pillsContainer = main.querySelector('#category-pills');
  if (pillsContainer) {
    pillsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.cat-pill');
      if (!btn) return;
      pillsContainer.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.cat;
      filterAndRenderGrid(allProfiles);
    });
  }

  // ── Wire Search Input ──
  const searchInput = main.querySelector('#profiles-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      filterAndRenderGrid(allProfiles);
    });
  }

  const clearSearchBtn = main.querySelector('#clear-search-btn');
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchQuery = '';
      if (searchInput) searchInput.value = '';
      filterAndRenderGrid(allProfiles);
    });
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Filter and render the cards inside the profiles grid container
 */
function filterAndRenderGrid(profiles) {
  const container = document.getElementById('profiles-grid-container');
  if (!container) return;

  const lang = store.state.lang;

  // Filter based on active category & search query
  const filtered = profiles.filter(p => {
    const matchesCat = (activeCategory === 'all') || (p.category === activeCategory);
    if (!matchesCat) return false;

    if (!searchQuery) return true;
    const nameMatch = (p.name && p.name.toLowerCase().includes(searchQuery)) ||
                      (p.nameAr && p.nameAr.includes(searchQuery));
    const titleMatch = (p.title && p.title.toLowerCase().includes(searchQuery)) ||
                       (p.titleAr && p.titleAr.includes(searchQuery));
    const tagMatch = p.tags && p.tags.some(t => t.toLowerCase().includes(searchQuery));
    return nameMatch || titleMatch || tagMatch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-profiles-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <h3 data-i18n="profiles.noResults">${t('profiles.noResults')}</h3>
        <button class="btn-reset-filters" id="btn-reset-filters" data-i18n="profiles.resetFilters">${t('profiles.resetFilters')}</button>
      </div>
    `;
    const resetBtn = container.querySelector('#btn-reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        activeCategory = 'all';
        searchQuery = '';
        const searchInput = document.getElementById('profiles-search-input');
        if (searchInput) searchInput.value = '';
        document.querySelectorAll('.cat-pill').forEach(p => p.classList.toggle('active', p.dataset.cat === 'all'));
        filterAndRenderGrid(profiles);
      });
    }
    return;
  }

  // Render profile cards
  container.innerHTML = filtered.map((profile, index) => {
    const displayName = (lang === 'ar' && profile.nameAr) ? profile.nameAr : profile.name;
    const displayTitle = (lang === 'ar' && profile.titleAr) ? profile.titleAr : (lang === 'fr' && profile.titleFr ? profile.titleFr : profile.title);
    const displayOrg = (lang === 'ar' && profile.organizationAr) ? profile.organizationAr : profile.organization;
    const displayLoc = (lang === 'ar' && profile.locationAr) ? profile.locationAr : profile.location;

    return `
      <article class="profile-card animate-fade-in-up" style="animation-delay: ${Math.min(index * 60, 400)}ms;" data-id="${profile.id}">
        
        <div class="card-top-row">
          <div class="card-avatar-wrap">
            <img 
              class="card-avatar" 
              src="${profile.avatar}" 
              alt="${profile.name}" 
              loading="lazy"
              onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=240&auto=format&fit=crop&q=80';"
            />
            <div class="verified-indicator" title="${t('profiles.reliability')}">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="white">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
            </div>
          </div>

          <div class="reliability-badge">
            <span class="rel-score">${profile.reliability}%</span>
            <span class="rel-label">${t('profiles.reliability')}</span>
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
            ${(profile.tags || []).slice(0, 3).map(tag => `<span class="profile-tag">${tag}</span>`).join('')}
          </div>
        </div>

        <div class="card-footer">
          <span class="expand-prompt">
            <span>Explore Mind-Map</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </span>
        </div>

      </article>
    `;
  }).join('');

  // ── Click Card to Open Mind-Map ──
  container.querySelectorAll('.profile-card').forEach(card => {
    card.addEventListener('click', () => {
      const profileId = Number(card.dataset.id);
      const target = profiles.find(p => p.id === profileId);
      if (target) {
        openMindMap(target);
      }
    });
  });
}
