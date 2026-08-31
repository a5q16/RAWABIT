/**
 * Rawabit v2 — Dedicated Pages (About, Why & Vision, Contact)
 * Sovereign Saudi-Gov-Tech Layout · Absolute Minimalism · 100% Trilingual Dynamic I18n
 */

import { t, applyTranslations } from '../i18n.js';
import { store } from '../store.js';

/**
 * ══════════════════════════════════════════════════════════════════
 * 1. ABOUT PAGE (عن منصة روابط / About / À propos)
 * ══════════════════════════════════════════════════════════════════
 */
export function renderAbout() {
  const main = document.getElementById('main-content');
  if (!main) return;

  main.innerHTML = `
    <div class="page-container animate-fade-in">
      
      <!-- Page Hero Header -->
      <section class="page-hero">
        <div class="container">
          <div class="page-badge">
            <span data-i18n="about.badge">${t('about.badge')}</span>
          </div>
          <h1 class="page-title" data-i18n="about.title">${t('about.title')}</h1>
          <p class="page-subtitle" data-i18n="about.subtitle">${t('about.subtitle')}</p>
        </div>
      </section>

      <!-- Mission Statement Section -->
      <section class="page-section">
        <div class="container">
          <div class="mission-card">
            <div class="mission-content">
              <span class="mission-tag" data-i18n="about.missionTag">${t('about.missionTag')}</span>
              <h2 data-i18n="about.missionTitle">${t('about.missionTitle')}</h2>
              <p data-i18n="about.missionDesc">${t('about.missionDesc')}</p>
            </div>
            <div class="mission-stats-badge">
              <div class="stat-highlight">
                <span class="stat-h-val">58</span>
                <span class="stat-h-lbl" data-i18n="about.statWilayas">${t('about.statWilayas')}</span>
              </div>
              <div class="stat-sep"></div>
              <div class="stat-highlight">
                <span class="stat-h-val">100%</span>
                <span class="stat-h-lbl" data-i18n="about.statSovereignty">${t('about.statSovereignty')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 3 Core Pillars -->
      <section class="page-section bg-milky-subtle">
        <div class="container">
          <div class="section-header">
            <h2 data-i18n="about.pillarsHeading">${t('about.pillarsHeading')}</h2>
            <p data-i18n="about.pillarsSub">${t('about.pillarsSub')}</p>
          </div>

          <div class="pillars-grid">
            
            <div class="pillar-card">
              <div class="pillar-icon">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <polyline points="9 12 11 14 15 10"></polyline>
                </svg>
              </div>
              <h3 data-i18n="about.pillar1Title">${t('about.pillar1Title')}</h3>
              <p data-i18n="about.pillar1Desc">${t('about.pillar1Desc')}</p>
            </div>

            <div class="pillar-card">
              <div class="pillar-icon">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
              </div>
              <h3 data-i18n="about.pillar2Title">${t('about.pillar2Title')}</h3>
              <p data-i18n="about.pillar2Desc">${t('about.pillar2Desc')}</p>
            </div>

            <div class="pillar-card">
              <div class="pillar-icon">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 data-i18n="about.pillar3Title">${t('about.pillar3Title')}</h3>
              <p data-i18n="about.pillar3Desc">${t('about.pillar3Desc')}</p>
            </div>

          </div>
        </div>
      </section>

      <!-- Verification Standard Banner -->
      <section class="page-section">
        <div class="container">
          <div class="verification-banner">
            <div class="vb-icon">
              <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div class="vb-text">
              <h3 data-i18n="about.ctaTitle">${t('about.ctaTitle')}</h3>
              <p data-i18n="about.ctaDesc">${t('about.ctaDesc')}</p>
            </div>
            <div class="vb-action">
              <a href="#/contact" class="btn-primary" data-i18n="about.ctaBtn">${t('about.ctaBtn')}</a>
            </div>
          </div>
        </div>
      </section>

      <!-- Minimalist Footer -->
      ${renderPageFooter()}

    </div>
  `;

  window.scrollTo({ top: 0, behavior: 'smooth' });
  applyTranslations();
}

/**
 * ══════════════════════════════════════════════════════════════════
 * 2. WHY & VISION PAGE (لماذا روابط؟ والرؤية الوطنية 2030)
 * ══════════════════════════════════════════════════════════════════
 */
export function renderWhy(activeTab = 'why') {
  const main = document.getElementById('main-content');
  if (!main) return;

  main.innerHTML = `
    <div class="page-container animate-fade-in">
      
      <!-- Page Hero Header -->
      <section class="page-hero">
        <div class="container">
          <div class="page-badge">
            <span data-i18n="why.badge">${t('why.badge')}</span>
          </div>
          <h1 class="page-title" data-i18n="why.title">${t('why.title')}</h1>
          <p class="page-subtitle" data-i18n="why.subtitle">${t('why.subtitle')}</p>

          <!-- Interactive Tab Switcher linking Why & Vision -->
          <div class="page-tab-switcher">
            <button class="page-tab-btn ${activeTab === 'why' ? 'active' : ''}" id="tab-btn-why" data-i18n="why.tabWhy">
              ${t('why.tabWhy')}
            </button>
            <button class="page-tab-btn ${activeTab === 'vision' ? 'active' : ''}" id="tab-btn-vision" data-i18n="why.tabVision">
              ${t('why.tabVision')}
            </button>
          </div>
        </div>
      </section>

      <!-- Tab Content 1: WHY SECTION -->
      <div id="tab-content-why" class="${activeTab === 'why' ? 'tab-visible' : 'tab-hidden'}">
        
        <!-- 3 Core Challenges We Solve -->
        <section class="page-section">
          <div class="container">
            <div class="section-header">
              <h2 data-i18n="why.challengesHeading">${t('why.challengesHeading')}</h2>
              <p data-i18n="why.challengesSub">${t('why.challengesSub')}</p>
            </div>

            <div class="why-grid">
              
              <div class="why-card">
                <div class="why-number">01</div>
                <h3 data-i18n="why.card1Title">${t('why.card1Title')}</h3>
                <p data-i18n="why.card1Desc">${t('why.card1Desc')}</p>
                <div class="why-tag" data-i18n="why.card1Tag">${t('why.card1Tag')}</div>
              </div>

              <div class="why-card">
                <div class="why-number">02</div>
                <h3 data-i18n="why.card2Title">${t('why.card2Title')}</h3>
                <p data-i18n="why.card2Desc">${t('why.card2Desc')}</p>
                <div class="why-tag" data-i18n="why.card2Tag">${t('why.card2Tag')}</div>
              </div>

              <div class="why-card">
                <div class="why-number">03</div>
                <h3 data-i18n="why.card3Title">${t('why.card3Title')}</h3>
                <p data-i18n="why.card3Desc">${t('why.card3Desc')}</p>
                <div class="why-tag" data-i18n="why.card3Tag">${t('why.card3Tag')}</div>
              </div>

            </div>
          </div>
        </section>

        <!-- Vision Teaser linking to Vision Tab -->
        <section class="page-section bg-milky-subtle">
          <div class="container">
            <div class="vision-link-banner">
              <div class="vlb-content">
                <span class="vlb-badge" data-i18n="why.visionBannerTag">${t('why.visionBannerTag')}</span>
                <h3 data-i18n="why.visionBannerTitle">${t('why.visionBannerTitle')}</h3>
                <p data-i18n="why.visionBannerDesc">${t('why.visionBannerDesc')}</p>
              </div>
              <button class="btn-primary" id="btn-jump-vision">
                <span data-i18n="why.visionBannerBtn">${t('why.visionBannerBtn')}</span>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </section>

      </div>

      <!-- Tab Content 2: VISION SECTION -->
      <div id="tab-content-vision" class="${activeTab === 'vision' ? 'tab-visible' : 'tab-hidden'}">
        
        <section class="page-section" id="vision">
          <div class="container">
            
            <div class="vision-hero-box">
              <div class="vhb-mark">ر</div>
              <h2 data-i18n="vision.heading">${t('vision.heading')}</h2>
              <p data-i18n="vision.sub">${t('vision.sub')}</p>
            </div>

            <div class="vision-goals-grid">
              
              <div class="vision-goal-item">
                <div class="vg-icon-box">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="10" r="3"></circle>
                    <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"></path>
                  </svg>
                </div>
                <div class="vg-text">
                  <h4 data-i18n="vision.goal1Title">${t('vision.goal1Title')}</h4>
                  <p data-i18n="vision.goal1">${t('vision.goal1')}</p>
                </div>
              </div>

              <div class="vision-goal-item">
                <div class="vg-icon-box">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div class="vg-text">
                  <h4 data-i18n="vision.goal2Title">${t('vision.goal2Title')}</h4>
                  <p data-i18n="vision.goal2">${t('vision.goal2')}</p>
                </div>
              </div>

              <div class="vision-goal-item">
                <div class="vg-icon-box">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <div class="vg-text">
                  <h4 data-i18n="vision.goal3Title">${t('vision.goal3Title')}</h4>
                  <p data-i18n="vision.goal3">${t('vision.goal3')}</p>
                </div>
              </div>

              <div class="vision-goal-item">
                <div class="vg-icon-box">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <div class="vg-text">
                  <h4 data-i18n="vision.goal4Title">${t('vision.goal4Title')}</h4>
                  <p data-i18n="vision.goal4">${t('vision.goal4')}</p>
                </div>
              </div>

            </div>

          </div>
        </section>

      </div>

      <!-- Minimalist Footer -->
      ${renderPageFooter()}

    </div>
  `;

  // Tab switching logic
  const tabWhy = main.querySelector('#tab-btn-why');
  const tabVision = main.querySelector('#tab-btn-vision');
  const contentWhy = main.querySelector('#tab-content-why');
  const contentVision = main.querySelector('#tab-content-vision');
  const jumpVision = main.querySelector('#btn-jump-vision');

  function switchToTab(tab) {
    if (tab === 'why') {
      tabWhy?.classList.add('active');
      tabVision?.classList.remove('active');
      contentWhy?.classList.remove('tab-hidden');
      contentWhy?.classList.add('tab-visible');
      contentVision?.classList.remove('tab-visible');
      contentVision?.classList.add('tab-hidden');
      history.replaceState(null, '', '#/why');
    } else {
      tabVision?.classList.add('active');
      tabWhy?.classList.remove('active');
      contentVision?.classList.remove('tab-hidden');
      contentVision?.classList.add('tab-visible');
      contentWhy?.classList.remove('tab-visible');
      contentWhy?.classList.add('tab-hidden');
      history.replaceState(null, '', '#/vision');
    }
  }

  tabWhy?.addEventListener('click', () => switchToTab('why'));
  tabVision?.addEventListener('click', () => switchToTab('vision'));
  jumpVision?.addEventListener('click', () => switchToTab('vision'));

  window.scrollTo({ top: 0, behavior: 'smooth' });
  applyTranslations();
}

/**
 * ══════════════════════════════════════════════════════════════════
 * 3. CONTACT PAGE (تواصل مع فريق روابط / Contact / Contactez-nous)
 * ══════════════════════════════════════════════════════════════════
 */
export function renderContact() {
  const main = document.getElementById('main-content');
  if (!main) return;

  main.innerHTML = `
    <div class="page-container animate-fade-in">
      
      <!-- Page Hero Header -->
      <section class="page-hero">
        <div class="container">
          <div class="page-badge">
            <span data-i18n="contact.badge">${t('contact.badge')}</span>
          </div>
          <h1 class="page-title" data-i18n="contact.title">${t('contact.title')}</h1>
          <p class="page-subtitle" data-i18n="contact.subtitle">${t('contact.subtitle')}</p>
        </div>
      </section>

      <!-- Contact Main Content & Form Grid -->
      <section class="page-section">
        <div class="container">
          <div class="contact-grid-layout">
            
            <!-- Left/Main: Interactive Contact Form -->
            <div class="contact-form-card">
              <div class="form-header">
                <h2 data-i18n="contact.formTitle">${t('contact.formTitle')}</h2>
                <p data-i18n="contact.formSub">${t('contact.formSub')}</p>
              </div>

              <div id="contact-success-toast" class="contact-toast-success hidden">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span data-i18n="contact.successMsg">${t('contact.successMsg')}</span>
              </div>

              <form id="contact-form" class="contact-form" onsubmit="event.preventDefault();">
                
                <div class="form-row-2">
                  <div class="form-group">
                    <label for="contact-name" data-i18n="contact.name">${t('contact.name')}</label>
                    <input 
                      type="text" 
                      id="contact-name" 
                      required 
                      placeholder="${t('contact.namePlaceholder')}"
                      data-i18n-placeholder="contact.namePlaceholder"
                    />
                  </div>

                  <div class="form-group">
                    <label for="contact-email" data-i18n="contact.email">${t('contact.email')}</label>
                    <input 
                      type="email" 
                      id="contact-email" 
                      required 
                      placeholder="${t('contact.emailPlaceholder')}"
                      data-i18n-placeholder="contact.emailPlaceholder"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label for="contact-category" data-i18n="contact.category">${t('contact.category')}</label>
                  <select id="contact-category">
                    <option value="general" data-i18n="contact.catGeneral">${t('contact.catGeneral')}</option>
                    <option value="talent" data-i18n="contact.catTalent">${t('contact.catTalent')}</option>
                    <option value="partner" data-i18n="contact.catPartner">${t('contact.catPartner')}</option>
                    <option value="support" data-i18n="contact.catSupport">${t('contact.catSupport')}</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="contact-message" data-i18n="contact.message">${t('contact.message')}</label>
                  <textarea 
                    id="contact-message" 
                    rows="5" 
                    required 
                    placeholder="${t('contact.messagePlaceholder')}"
                    data-i18n-placeholder="contact.messagePlaceholder"
                  ></textarea>
                </div>

                <button type="submit" class="btn-primary form-submit-btn" id="btn-submit-contact">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                  <span data-i18n="contact.sendBtn">${t('contact.sendBtn')}</span>
                </button>

              </form>
            </div>

            <!-- Right: Direct Channels & Hubs -->
            <div class="contact-info-panel">
              
              <div class="info-widget-card">
                <h3 data-i18n="contact.infoTitle">${t('contact.infoTitle')}</h3>
                
                <div class="info-contact-item">
                  <div class="info-ci-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <div>
                    <span class="info-ci-label" data-i18n="contact.emailLabel">${t('contact.emailLabel')}</span>
                    <a href="mailto:contact@rawabit.dz" class="info-ci-val">contact@rawabit.dz</a>
                  </div>
                </div>

                <div class="info-contact-item">
                  <div class="info-ci-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <div>
                    <span class="info-ci-label" data-i18n="contact.locationsLabel">${t('contact.locationsLabel')}</span>
                    <span class="info-ci-val" data-i18n="contact.locationsVal">${t('contact.locationsVal')}</span>
                  </div>
                </div>

                <div class="info-contact-item">
                  <div class="info-ci-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <div>
                    <span class="info-ci-label" data-i18n="contact.hoursLabel">${t('contact.hoursLabel')}</span>
                    <span class="info-ci-val" data-i18n="contact.hoursVal">${t('contact.hoursVal')}</span>
                  </div>
                </div>

              </div>

              <!-- Quick Verification Box -->
              <div class="info-widget-card verification-hint-card">
                <h4 data-i18n="contact.verifyHintTitle">${t('contact.verifyHintTitle')}</h4>
                <p data-i18n="contact.verifyHintDesc">${t('contact.verifyHintDesc')}</p>
                <div class="badge-tag" data-i18n="contact.badgeTag">${t('contact.badgeTag')}</div>
              </div>

            </div>

          </div>
        </div>
      </section>

      <!-- Minimalist Footer -->
      ${renderPageFooter()}

    </div>
  `;

  // Form submission interaction
  const form = main.querySelector('#contact-form');
  const toast = main.querySelector('#contact-success-toast');
  const btn = main.querySelector('#btn-submit-contact');

  if (form && toast) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (btn) btn.disabled = true;
      toast.classList.remove('hidden');
      form.reset();
      setTimeout(() => {
        if (btn) btn.disabled = false;
      }, 3000);
    });
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  applyTranslations();
}

/**
 * Reusable Minimalist Footer for Inner Pages
 */
function renderPageFooter() {
  return `
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
            <a class="footer-minimal-link" href="#/why" data-i18n="footer.link2">${t('footer.link2')}</a>
            <span class="footer-nav-sep">·</span>
            <a class="footer-minimal-link trigger-roadmap" href="javascript:void(0)" id="trigger-roadmap-footer-inner" data-i18n="nav.roadmap">${t('nav.roadmap')}</a>
            <span class="footer-nav-sep">·</span>
            <a class="footer-minimal-link" href="#/contact" data-i18n="footer.link3">${t('footer.link3')}</a>
          </nav>

          <p class="footer-minimal-copy" data-i18n="footer.copy">${t('footer.copy')}</p>
        </div>
      </div>
    </footer>
  `;
}
