/**
 * Rawabit v2 — Main Application Orchestrator
 * Initializes all modules, registers routes, and renders the initial view.
 */
import { store } from './store.js';
import { initI18n, t, applyTranslations } from './i18n.js';
import { registerRoute, initRouter } from './router.js';
import { createNav } from './components/nav.js';
import { createLanguageOverlay } from './components/overlay.js';
import { showLoader, hideLoader } from './components/loader.js';
import { renderMap } from './components/map.js';

/**
 * Render the home view: Hero + Map
 */
function renderHome() {
  const main = document.getElementById('main-content');
  if (!main) return;

  main.innerHTML = `
    <section class="hero" id="hero">
      <div class="hero-content">
        <span class="badge animate-fade-in" data-i18n="hero.badge"></span>
        <h1 class="animate-fade-in stagger-1" data-i18n="hero.title"></h1>
        <p class="hero-subtitle animate-fade-in stagger-2" data-i18n="hero.subtitle"></p>
      </div>
    </section>

    <section class="section" id="map-section">
      <div class="container">
        <div class="section-header">
          <span class="badge animate-fade-in" data-i18n="map.badge"></span>
          <h2 class="animate-fade-in stagger-1" data-i18n="map.title"></h2>
          <p class="animate-fade-in stagger-2" data-i18n="map.subtitle"></p>
        </div>
        <div class="map-container animate-fade-in stagger-3">
          <div class="map-body" id="map-root"></div>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <div class="footer-logo-mark">ر</div>
          <span class="footer-logo-name">روابط</span>
        </div>
        <p class="footer-copy" data-i18n="footer.copy"></p>
      </div>
    </footer>
  `;

  // Apply translations to newly rendered content
  applyTranslations();

  // Render the SVG map
  const mapRoot = document.getElementById('map-root');
  if (mapRoot) {
    renderMap(mapRoot);
  }
}

/**
 * Initialize the application
 */
async function init() {
  // Show initial loader
  await showLoader();

  // Initialize i18n (reads localStorage / browser lang)
  initI18n();

  // Render navigation
  const nav = createNav();
  document.body.prepend(nav);

  // Render language overlay
  const langOverlay = createLanguageOverlay();
  document.body.appendChild(langOverlay);

  // Register routes
  registerRoute('#/', renderHome);

  // Placeholder routes for About and Why (will be full overlays in future steps)
  registerRoute('#/about', () => {
    renderHome();
  });

  registerRoute('#/why', () => {
    renderHome();
  });

  // Wilaya profiles route (Step 2)
  registerRoute('#/wilaya/:code', (params) => {
    // Will render profiles view — for now, render home
    renderHome();
  });

  // Initialize router (triggers initial route)
  initRouter();

  // Hide loader after everything is ready
  setTimeout(() => {
    hideLoader();
  }, 200);
}

// ── Boot ──
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
