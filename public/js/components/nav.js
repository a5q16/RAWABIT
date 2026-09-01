/**
 * Rawabit v2 — Sticky Luxurious Navbar
 * Features brand mark, page redirection navigation links,
 * and clean Language Switcher trigger with current active language badge.
 */

import { t } from '../i18n.js';
import { store } from '../store.js';
import { openLanguageSelector } from './overlay.js';

export function createNav() {
  let nav = document.getElementById('main-nav');
  if (!nav) {
    nav = document.createElement('nav');
    nav.className = 'nav';
    nav.id = 'main-nav';
  }

  const langMap = {
    ar: 'العربية',
    en: 'English',
    fr: 'Français'
  };

  nav.innerHTML = `
    <div class="nav-inner">
      
      <!-- Brand Logo -->
      <a class="nav-logo" href="#/" id="nav-logo-link">
        <img class="nav-logo-img" src="./logo.png" alt="Rawabit Logo" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12); flex-shrink: 0;" />
        <div class="nav-logo-text">
          <span class="nav-logo-name" data-i18n="nav.brandName">${t('nav.brandName')}</span>
          <span class="nav-logo-sub" data-i18n="nav.brandSubtitle">${t('nav.brandSubtitle')}</span>
        </div>
      </a>

      <!-- Navigation Links -->
      <div class="nav-links" id="nav-links">
        <a class="nav-link active" href="#/" data-i18n="nav.home" data-route="#/">${t('nav.home')}</a>
        <a class="nav-link" href="#/about" data-i18n="nav.about" data-route="#/about">${t('nav.about')}</a>
        <a class="nav-link" href="#/why" data-i18n="nav.why" data-route="#/why">${t('nav.why')}</a>
        <a class="nav-link trigger-roadmap" href="javascript:void(0)" id="trigger-roadmap" data-i18n="nav.roadmap">${t('nav.roadmap')}</a>
        <a class="nav-link" href="#/contact" data-i18n="nav.contact" data-route="#/contact">${t('nav.contact')}</a>
      </div>

      <!-- Action & Language Switcher -->
      <div class="nav-actions">
        <button class="nav-lang-btn" id="nav-lang-btn" title="Change Language">
          <svg class="nav-lang-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          <span class="nav-lang-label" id="nav-lang-label">${langMap[store.state.lang] || 'العربية'}</span>
        </button>

        <!-- Mobile Menu Toggle Button -->
        <button class="nav-menu-btn" id="nav-menu-toggle" aria-label="Toggle Menu">
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Mobile Dropdown Menu -->
      <div class="nav-mobile-menu" id="nav-mobile-menu">
        <a class="nav-mobile-link active" href="#/" data-i18n="nav.home" data-route="#/">${t('nav.home')}</a>
        <a class="nav-mobile-link" href="#/about" data-i18n="nav.about" data-route="#/about">${t('nav.about')}</a>
        <a class="nav-mobile-link" href="#/why" data-i18n="nav.why" data-route="#/why">${t('nav.why')}</a>
        <a class="nav-mobile-link trigger-roadmap" href="javascript:void(0)" id="trigger-roadmap-mobile" data-i18n="nav.roadmap">${t('nav.roadmap')}</a>
        <a class="nav-mobile-link" href="#/contact" data-i18n="nav.contact" data-route="#/contact">${t('nav.contact')}</a>
      </div>

    </div>
  `;

  // Update active links based on hash
  function updateActiveNav() {
    const rawHash = window.location.hash || '#/';
    const baseRoute = rawHash.split('?')[0];

    nav.querySelectorAll('[data-route]').forEach(link => {
      const targetRoute = link.getAttribute('data-route');
      const isMatch = (targetRoute === '#/' && (baseRoute === '#/' || baseRoute === '#' || !baseRoute)) ||
                      (targetRoute !== '#/' && (baseRoute === targetRoute || (targetRoute === '#/why' && baseRoute === '#/vision')));
      link.classList.toggle('active', isMatch);
    });
  }

  window.addEventListener('hashchange', updateActiveNav);
  updateActiveNav();

  // ── Language Button Trigger ──
  const langBtn = nav.querySelector('#nav-lang-btn');
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      openLanguageSelector(false);
    });
  }

  // ── Mobile Menu Toggle ──
  const menuBtn = nav.querySelector('#nav-menu-toggle');
  const mobileMenu = nav.querySelector('#nav-mobile-menu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });

    // Close mobile menu on clicking any link
    nav.querySelectorAll('.nav-mobile-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
      });
    });
  }

  // ── Sticky Navbar Scroll Listener ──
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 15);
  }, { passive: true });

  // ── Reactive Language Updates ──
  store.subscribe('lang', (newLang) => {
    const langLabel = nav.querySelector('#nav-lang-label');
    if (langLabel) {
      langLabel.textContent = langMap[newLang] || 'العربية';
    }
    updateActiveNav();
  });

  return nav;
}
