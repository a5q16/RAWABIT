/**
 * Rawabit v2 — Profiles Grid View Component
 * Renders verified Algerian competency directory for a selected wilaya
 * with real-time search, category filtering, and mind-map triggers.
 */
import { getProfilesByWilaya } from '../data/profiles-data.js';
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
    : 94;

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
            <button class="cat-pill ${activeCategory === 'ai' ? 'active' : ''}" data-cat="ai" data-i18n="profiles.filterAI">${t('profiles.filterAI')}</button>
            <button class="cat-pill ${activeCategory === 'engineering' ? 'active' : ''}" data-cat="engineering" data-i18n="profiles.filterEngineering">${t('profiles.filterEngineering')}</button>
            <button class="cat-pill ${activeCategory === 'health' ? 'active' : ''}" data-cat="health" data-i18n="profiles.filterHealth">${t('profiles.filterHealth')}</button>
            <button class="cat-pill ${activeCategory === 'energy' ? 'active' : ''}" data-cat="energy" data-i18n="profiles.filterEnergy">${t('profiles.filterEnergy')}</button>
          </div>
        </div>

      </div>
    </section>

    <!-- Profiles Grid Container -->
    <section class="section profiles-grid-section">
      <div class="container">
        <div class="profiles-grid" id="profiles-grid-container">
          <!-- Populated by updateProfilesGrid() -->
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <div class="footer-logo-mark">ر</div>
          <span class="footer-logo-name">روابط</span>
        </div>
        <p class="footer-copy" data-i18n="footer.copy">${t('footer.copy')}</p>
      </div>
    </footer>
  `;

  // Apply translations
  applyTranslations();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'instant' });

  // ── Bind Interactive Events ──
  const backBtn = main.querySelector('#btn-back-map');
  backBtn.addEventListener('click', () => {
    navigate('#/');
  });

  const searchInput = main.querySelector('#profiles-search-input');
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    updateProfilesGrid(allProfiles, code);
  });

  const clearBtn = main.querySelector('#clear-search-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchQuery = '';
      searchInput.value = '';
      updateProfilesGrid(allProfiles, code);
    });
  }

  const catPills = main.querySelectorAll('.cat-pill');
  catPills.forEach(pill => {
    pill.addEventListener('click', () => {
      catPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.dataset.cat;
      updateProfilesGrid(allProfiles, code);
    });
  });

  // Initial Grid Render
  updateProfilesGrid(allProfiles, code);

  // Re-render when language changes
  store.subscribe('lang', () => {
    renderProfiles(code);
  });
}

/**
 * Filter and render the cards inside the profiles grid container
 */
function updateProfilesGrid(profiles, wilayaCode) {
  const container = document.getElementById('profiles-grid-container');
  if (!container) return;

  const lang = store.state.lang;

  // Filter based on category and search query
  const filtered = profiles.filter(p => {
    // Category match
    const catMatch = (activeCategory === 'all') || (p.category === activeCategory);

    // Search query match
    if (!searchQuery) return catMatch;

    const nameStr = `${p.name} ${p.nameAr || ''} ${p.nameFr || ''}`.toLowerCase();
    const titleStr = `${p.title} ${p.titleAr || ''} ${p.titleFr || ''}`.toLowerCase();
    const orgStr = `${p.organization} ${p.organizationAr || ''}`.toLowerCase();
    const tagsStr = (p.tags || []).join(' ').toLowerCase();
    const skillsStr = (p.skills || []).map(s => s.name).join(' ').toLowerCase();

    const matchesSearch = nameStr.includes(searchQuery) ||
                          titleStr.includes(searchQuery) ||
                          orgStr.includes(searchQuery) ||
                          tagsStr.includes(searchQuery) ||
                          skillsStr.includes(searchQuery);

    return catMatch && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-results-box animate-fade-in">
        <div class="empty-icon-wrap">
          <svg viewBox="0 0 24 24" width="40" height="40" stroke="var(--color-text-secondary)" stroke-width="1.5" fill="none">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </div>
        <h3 class="empty-title" data-i18n="profiles.noResults">${t('profiles.noResults')}</h3>
        <button class="btn-reset-filters" id="btn-reset-filters" data-i18n="profiles.clearFilters">${t('profiles.clearFilters')}</button>
      </div>
    `;

    const resetBtn = container.querySelector('#btn-reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        searchQuery = '';
        activeCategory = 'all';
        const input = document.getElementById('profiles-search-input');
        if (input) input.value = '';
        const pills = document.querySelectorAll('.cat-pill');
        pills.forEach(p => p.classList.toggle('active', p.dataset.cat === 'all'));
        updateProfilesGrid(profiles, wilayaCode);
      });
    }
    return;
  }

  container.innerHTML = filtered.map((profile, index) => {
    const displayName = (lang === 'ar' && profile.nameAr) ? profile.nameAr : profile.name;
    const displayTitle = (lang === 'ar' && profile.titleAr) ? profile.titleAr : (lang === 'fr' && profile.titleFr ? profile.titleFr : profile.title);
    const displayOrg = (lang === 'ar' && profile.organizationAr) ? profile.organizationAr : profile.organization;
    const displayBio = (lang === 'ar' && profile.bioAr) ? profile.bioAr : profile.bio;

    return `
      <div class="profile-card animate-scale-in" data-id="${profile.id}" style="animation-delay: ${index * 60}ms;">
        
        <!-- Card Header: Avatar + Verification -->
        <div class="card-header">
          <div class="card-avatar-wrap">
            <img class="card-avatar" src="${profile.avatar}" alt="${profile.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=240&auto=format&fit=crop&q=80'" />
            <span class="card-verified-dot" title="${t('profiles.verified')}">✓</span>
          </div>

          <div class="card-reliability-badge">
            <span class="rel-score">${profile.reliability}%</span>
            <span class="rel-text" data-i18n="profiles.verified">${t('profiles.verified')}</span>
          </div>
        </div>

        <!-- Card Body: Name, Title, Institution -->
        <div class="card-body">
          <h3 class="card-name">${displayName}</h3>
          <p class="card-title">${displayTitle}</p>
          
          <div class="card-org-row">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 7v14M21 7v14M6 7V3h12v4M9 11h2M13 11h2M9 15h2M13 15h2"/></svg>
            <span>${displayOrg}</span>
          </div>

          <p class="card-bio">${displayBio}</p>

          <!-- Key Skill Badges -->
          <div class="card-skills-row">
            ${(profile.skills || []).slice(0, 3).map(s => `
              <span class="card-skill-pill">${s.name}</span>
            `).join('')}
          </div>
        </div>

        <!-- Card Footer: Mind-Map CTA Button -->
        <div class="card-footer">
          <button class="card-mindmap-btn" data-id="${profile.id}">
            <span class="mindmap-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <circle cx="19" cy="6" r="2"></circle>
                <circle cx="5" cy="6" r="2"></circle>
                <circle cx="19" cy="18" r="2"></circle>
                <circle cx="5" cy="18" r="2"></circle>
                <line x1="12" y1="9" x2="19" y2="6"></line>
                <line x1="12" y1="9" x2="5" y2="6"></line>
                <line x1="12" y1="15" x2="19" y2="18"></line>
                <line x1="12" y1="15" x2="5" y2="18"></line>
              </svg>
            </span>
            <span class="mindmap-btn-text" data-i18n="profiles.openMindmap">${t('profiles.openMindmap')}</span>
            <span class="mindmap-arrow">→</span>
          </button>
        </div>

      </div>
    `;
  }).join('');

  // ── Click Card to Open Mind-Map ──
  const cards = container.querySelectorAll('.profile-card');
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      const id = Number(card.dataset.id);
      const profile = profiles.find(p => p.id === id);
      if (profile) {
        openMindMap(profile);
      }
    });
  });
}
