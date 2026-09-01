import { setLang, getLang, t } from '../i18n.js';
import { store, pushOverlay, popOverlay, isOverlayActive } from '../store.js';
import { showLoader, hideLoader } from './loader.js';

let overlayElement = null;
let currentIsFirstVisit = false;

const LANGUAGE_CARDS = [
  {
    code: 'ar',
    icon: 'ع',
    title: 'العربية',
    subtitle: 'اللغة الرسمية',
    desc: 'اكتشف ألمع العقول الجزائرية وتواصل مع الكفاءات الموثقة عبر كل التخصصات.'
  },
  {
    code: 'en',
    icon: 'En',
    title: 'English',
    subtitle: 'International',
    desc: 'Discover Algeria\'s brightest minds and connect with verified professionals across every discipline.'
  },
  {
    code: 'fr',
    icon: 'Fr',
    title: 'Français',
    subtitle: 'Langue Nationale',
    desc: 'Découvrez les esprits les plus brillants d\'Algérie et connectez-vous avec des professionnels vérifiés.'
  }
];

export function createLanguageOverlay() {
  if (overlayElement) return overlayElement;

  const overlay = document.createElement('div');
  overlay.className = 'fullscreen-lang-overlay';
  overlay.id = 'fullscreen-language-overlay';

  overlay.innerHTML = `

    <button class="fullscreen-close-btn" id="lang-close-btn" aria-label="Close">
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>

    <div class="fullscreen-lang-header">
      <h2 class="fullscreen-lang-title" id="lang-dynamic-title">كيف تفضل أن تبدأ تجربتك؟</h2>
      <p class="fullscreen-lang-subtitle" id="lang-dynamic-subtitle">اختر لغة المنصة • Choisissez votre langue • Choose your language</p>
    </div>

    <div class="fullscreen-lang-cards" id="lang-cards-container">
      ${LANGUAGE_CARDS.map(card => `
        <div class="lang-luxury-card ${store.state.lang === card.code ? 'selected' : ''}" data-lang="${card.code}">
          <div class="lang-card-icon">${card.icon}</div>
          <h3 class="lang-card-title">${card.title}</h3>
          <p class="lang-card-subtitle">${card.subtitle}</p>
          <p class="lang-card-desc">${card.desc}</p>
        </div>
      `).join('')}
    </div>
  `;

  const closeBtn = overlay.querySelector('#lang-close-btn');
  closeBtn.addEventListener('click', () => closeLanguageSelector());

  overlay.addEventListener('click', (e) => {

    if (e.target === overlay && !currentIsFirstVisit) {
      closeLanguageSelector();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOverlayActive('language') && !currentIsFirstVisit) {
      closeLanguageSelector();
    }
  });

  const cards = overlay.querySelectorAll('.lang-luxury-card');
  cards.forEach(card => {
    card.addEventListener('click', async () => {
      const selectedLang = card.dataset.lang;

      cards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      await showLoader();

      try {
        localStorage.setItem('rawabit_has_onboarded_v2', 'true');
      } catch (e) {}

      setLang(selectedLang);

      hideLoader();
      closeLanguageSelector();
    });
  });

  store.subscribe('lang', (newLang) => {
    cards.forEach(c => {
      c.classList.toggle('selected', c.dataset.lang === newLang);
    });
  });

  overlayElement = overlay;
  return overlay;
}

export function openLanguageSelector(isFirstVisit = false) {
  if (!overlayElement) {
    createLanguageOverlay();
    document.body.appendChild(overlayElement);
  }

  currentIsFirstVisit = isFirstVisit;

  const titleEl = overlayElement.querySelector('#lang-dynamic-title');
  const subtitleEl = overlayElement.querySelector('#lang-dynamic-subtitle');
  const closeBtn = overlayElement.querySelector('#lang-close-btn');

  if (isFirstVisit) {

    if (titleEl) titleEl.textContent = 'كيف تفضل أن تبدأ تجربتك؟';
    if (subtitleEl) subtitleEl.textContent = 'اختر لغة المنصة • Choisissez votre langue • Choose your language';
    if (closeBtn) closeBtn.classList.add('hidden');
  } else {

    const currentLang = store.state.lang;
    if (titleEl && subtitleEl) {
      if (currentLang === 'en') {
        titleEl.textContent = 'Change Platform Language';
        subtitleEl.textContent = 'You can switch your browsing language at any time';
      } else if (currentLang === 'fr') {
        titleEl.textContent = 'Changer la langue de la plateforme';
        subtitleEl.textContent = 'Vous pouvez modifier la langue de navigation à tout moment';
      } else {
        titleEl.textContent = 'تغيير لغة المنصة';
        subtitleEl.textContent = 'يمكنك تبديل لغة العرض والتصفح في أي وقت';
      }
    }
    if (closeBtn) closeBtn.classList.remove('hidden');
  }

  const cards = overlayElement.querySelectorAll('.lang-luxury-card');
  cards.forEach(c => {
    const cardLang = c.getAttribute('data-lang') || (c.dataset && c.dataset.lang);
    c.classList.toggle('selected', cardLang === store.state.lang);
  });

  pushOverlay('language');
  overlayElement.classList.add('active');
}

export function closeLanguageSelector() {
  if (!overlayElement) return;

  overlayElement.classList.remove('active');
  popOverlay();
}
