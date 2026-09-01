import { store } from './store.js';
import { initI18n, t, applyTranslations } from './i18n.js';
import { registerRoute, initRouter, navigate } from './router.js';
import { createNav } from './components/nav.js';
import { createLanguageOverlay, openLanguageSelector } from './components/overlay.js';
import { shouldShowOnboarding } from './components/onboarding.js';
import { showLoader, hideLoader } from './components/loader.js';
import { initStatsAnimation } from './components/stats.js';
import { renderMap } from './components/map.js';
import { renderProfiles } from './components/profiles.js';
import { renderAbout, renderWhy, renderContact } from './components/pages.js';
import { getPlatformStats } from './data/profiles-data.js';
import { initSmartSearch } from './components/smart-search.js';
import { createGlobalAIFab } from './components/chat.js';
import { initRoadmapListeners } from './components/roadmap.js';

export function renderHome() {
  const main = document.getElementById('main-content');
  if (!main) return;

  main.innerHTML = `

    <section class="hero" id="hero">
      <div class="hero-content">
        <h1 class="animate-fade-in" data-i18n="hero.title">${t('hero.title')}</h1>
        <p class="hero-subtitle animate-fade-in stagger-1" data-i18n="hero.subtitle">${t('hero.subtitle')}</p>

        <div class="hero-actions animate-fade-in stagger-2">
          <a class="btn-primary" href="#ai-search">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
            </svg>
            <span data-i18n="hero.ctaSearch">${t('hero.ctaSearch')}</span>
          </a>

          <a class="btn-secondary" href="#map-section">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
              <line x1="8" y1="2" x2="8" y2="18"></line>
              <line x1="16" y1="6" x2="16" y2="22"></line>
            </svg>
            <span data-i18n="hero.ctaMap">${t('hero.ctaMap')}</span>
          </a>
        </div>
      </div>
    </section>

    <section class="section-ai-search" id="ai-search">
      <div class="container">
        <div class="search-section-wrap">

          <div class="section-header">
            <h2 data-i18n="search.title">${t('search.title')}</h2>
            <p data-i18n="search.subtitle">${t('search.subtitle')}</p>
          </div>

          <form class="ai-search-box" id="home-search-form" onsubmit="event.preventDefault();">
            <div class="ai-search-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
              </svg>
            </div>

            <input
              type="text"
              class="ai-search-input"
              id="home-search-input"
              placeholder="${t('search.placeholder')}"
              data-i18n-placeholder="search.placeholder"
              autocomplete="off"
            />

            <button type="submit" class="ai-search-btn" id="home-search-btn" aria-label="Search">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </form>

        </div>
      </div>
    </section>

    <section class="section-map" id="map-section">
      <div class="container">

        <div class="section-header">
          <h2 data-i18n="map.title">${t('map.title')}</h2>
          <p data-i18n="map.subtitle">${t('map.subtitle')}</p>
        </div>

        <div class="map-card-wrapper" id="map-container">
          <div class="map-placeholder-hint" id="map-placeholder">
            <div class="map-placeholder-icon">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                <line x1="8" y1="2" x2="8" y2="18"></line>
                <line x1="16" y1="6" x2="16" y2="22"></line>
              </svg>
            </div>
            <p data-i18n="map.placeholder">${t('map.placeholder')}</p>
          </div>
        </div>

      </div>
    </section>

    <section class="section-features" id="features">
      <div class="container">

        <div class="section-header">
          <h2 data-i18n="features.title">${t('features.title')}</h2>
          <p data-i18n="features.subtitle">${t('features.subtitle')}</p>
        </div>

        <div class="features-grid">

          <div class="feature-card">
            <div class="feature-icon-box">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <polyline points="9 12 11 14 15 10"></polyline>
              </svg>
            </div>
            <h3 class="feature-title" data-i18n="features.card1.title">${t('features.card1.title')}</h3>
            <p class="feature-desc" data-i18n="features.card1.desc">${t('features.card1.desc')}</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon-box">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <circle cx="12" cy="10" r="3"></circle>
                <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path>
              </svg>
            </div>
            <h3 class="feature-title" data-i18n="features.card2.title">${t('features.card2.title')}</h3>
            <p class="feature-desc" data-i18n="features.card2.desc">${t('features.card2.desc')}</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon-box">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                <circle cx="12" cy="12" r="4"></circle>
              </svg>
            </div>
            <h3 class="feature-title" data-i18n="features.card3.title">${t('features.card3.title')}</h3>
            <p class="feature-desc" data-i18n="features.card3.desc">${t('features.card3.desc')}</p>
          </div>

        </div>

      </div>
    </section>

    <section class="section-stats" id="stats">
      <div class="container">

        <div class="section-header">
          <h2 data-i18n="stats.title">${t('stats.title')}</h2>
        </div>

        <div class="stats-grid">

          <div class="stat-card">
            <div class="stat-number-wrap">
              <span class="stat-suffix" data-i18n="stats.stat1.suffix">${t('stats.stat1.suffix')}</span>
              <span class="stat-number" data-stat="wilayas" data-target="58">0</span>
            </div>
            <p class="stat-desc" data-i18n="stats.stat1.label">${t('stats.stat1.label')}</p>
          </div>

          <div class="stat-card">
            <div class="stat-number-wrap">
              <span class="stat-suffix" data-i18n="stats.stat2.suffix">${t('stats.stat2.suffix')}</span>
              <span class="stat-number" data-stat="talents" data-target="0">0</span>
            </div>
            <p class="stat-desc" data-i18n="stats.stat2.label">${t('stats.stat2.label')}</p>
          </div>

          <div class="stat-card">
            <div class="stat-number-wrap">
              <span class="stat-suffix" data-i18n="stats.stat3.suffix">${t('stats.stat3.suffix')}</span>
              <span class="stat-number" data-stat="categories" data-target="6">0</span>
            </div>
            <p class="stat-desc" data-i18n="stats.stat3.label">${t('stats.stat3.label')}</p>
          </div>

          <div class="stat-card">
            <div class="stat-number-wrap">
              <span class="stat-number" data-stat="accuracy" data-target="98.4">0</span>
              <span class="stat-suffix" data-i18n="stats.stat4.suffix">${t('stats.stat4.suffix')}</span>
            </div>
            <p class="stat-desc" data-i18n="stats.stat4.label">${t('stats.stat4.label')}</p>
          </div>

        </div>

      </div>
    </section>

    <footer class="footer-minimal">
      <div class="container">
        <div class="footer-minimal-inner">

          <div class="footer-minimal-brand">
            <img class="footer-logo-img" src="./logo.png" alt="Rawabit Logo" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12); flex-shrink: 0;" />
            <span class="footer-logo-name" data-i18n="nav.brandName">${t('nav.brandName')}</span>
          </div>

          <nav class="footer-minimal-nav">
            <a class="footer-minimal-link" href="#/about" data-i18n="footer.link1">${t('footer.link1')}</a>
            <span class="footer-nav-sep">·</span>
            <a class="footer-minimal-link" href="#/vision" data-i18n="footer.link2">${t('footer.link2')}</a>
            <span class="footer-nav-sep">·</span>
            <a class="footer-minimal-link trigger-roadmap" href="javascript:void(0)" id="trigger-roadmap-footer" data-i18n="nav.roadmap">${t('nav.roadmap')}</a>
            <span class="footer-nav-sep">·</span>
            <a class="footer-minimal-link" href="#/contact" data-i18n="footer.link3">${t('footer.link3')}</a>
          </nav>

          <p class="footer-minimal-copy" data-i18n="footer.copy">${t('footer.copy')}</p>

        </div>
      </div>
    </footer>
  `;

  applyTranslations();

  const searchForm = main.querySelector('#home-search-form');
  const searchInput = main.querySelector('#home-search-input');
  if (searchForm && searchInput) {
    initSmartSearch(searchForm, searchInput);
  }

  getPlatformStats().then(stats => {
    if (stats && main) {
      const statWilayas = main.querySelector('[data-stat="wilayas"]');
      const statTalents = main.querySelector('[data-stat="talents"]');
      const statCategories = main.querySelector('[data-stat="categories"]');
      const statAccuracy = main.querySelector('[data-stat="accuracy"]');

      if (statWilayas && stats.coveredWilayas > 0) {
        statWilayas.setAttribute('data-target', String(stats.coveredWilayas));
      }
      if (statTalents && stats.totalPersons > 0) {
        statTalents.setAttribute('data-target', String(stats.totalPersons));
      }
      if (statCategories && stats.categoriesCount > 0) {
        statCategories.setAttribute('data-target', String(stats.categoriesCount));
      }
      if (statAccuracy && stats.accuracyRate > 0) {
        statAccuracy.setAttribute('data-target', String(stats.accuracyRate));
      }

      initStatsAnimation(main);
    }
  });

  initStatsAnimation(main);

  const mapContainer = main.querySelector('#map-container');
  if (mapContainer) {
    renderMap(mapContainer);
  }
}

async function init() {
  await showLoader();

  const nav = createNav();
  if (!document.body.contains(nav)) {
    document.body.prepend(nav);
  }

  const langOverlay = createLanguageOverlay();
  document.body.appendChild(langOverlay);

  createGlobalAIFab();

  initI18n();

  if (shouldShowOnboarding()) {
    hideLoader();
    openLanguageSelector(true);
  }

  registerRoute('#/', renderHome);
  registerRoute('#/about', renderAbout);
  registerRoute('#/why', () => renderWhy('why'));
  registerRoute('#/vision', () => renderWhy('vision'));
  registerRoute('#/contact', renderContact);

  registerRoute('#/wilaya/:code', async (params) => {
    await renderProfiles(params.code);
  });

  initRouter();

  window.addEventListener('hashchange', () => {
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
  });

  initRoadmapListeners();

  hideLoader();

  store.subscribe('lang', async () => {
    const rawHash = window.location.hash || '#/';
    const baseRoute = rawHash.split('?')[0];

    if (baseRoute === '#/' || baseRoute === '#' || !baseRoute) {
      renderHome();
    } else if (baseRoute === '#/about') {
      renderAbout();
    } else if (baseRoute === '#/why') {
      renderWhy('why');
    } else if (baseRoute === '#/vision') {
      renderWhy('vision');
    } else if (baseRoute === '#/contact') {
      renderContact();
    } else if (baseRoute.startsWith('#/wilaya/')) {
      const code = baseRoute.split('/')[2];
      if (code) await renderProfiles(code);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
