/**
 * Navigation component
 */
import { t, getLang } from '../i18n.js';
import { store, pushOverlay } from '../store.js';

export function createNav() {
    const nav = document.createElement('nav');
    nav.className = 'nav';

    const navInner = document.createElement('div');
    navInner.className = 'nav-inner';

    // Logo
    const navLogo = document.createElement('a');
    navLogo.className = 'nav-logo';
    navLogo.href = '#/';
    
    const navLogoMark = document.createElement('div');
    navLogoMark.className = 'nav-logo-mark';
    navLogoMark.textContent = 'ر';
    
    const navLogoText = document.createElement('div');
    navLogoText.className = 'nav-logo-text';
    
    const navLogoName = document.createElement('span');
    navLogoName.className = 'nav-logo-name';
    navLogoName.textContent = 'روابط';
    
    const navLogoSub = document.createElement('span');
    navLogoSub.className = 'nav-logo-sub';
    navLogoSub.textContent = 'RAWABIT';
    
    navLogoText.appendChild(navLogoName);
    navLogoText.appendChild(navLogoSub);
    navLogo.appendChild(navLogoMark);
    navLogo.appendChild(navLogoText);

    // Links
    const navLinks = document.createElement('div');
    navLinks.className = 'nav-links';
    
    const linkHome = document.createElement('a');
    linkHome.className = 'nav-link active';
    linkHome.href = '#/';
    linkHome.dataset.i18n = 'nav.home';
    
    const linkAbout = document.createElement('a');
    linkAbout.className = 'nav-link';
    linkAbout.href = '#/about';
    linkAbout.dataset.i18n = 'nav.about';
    
    const linkWhy = document.createElement('a');
    linkWhy.className = 'nav-link';
    linkWhy.href = '#/why';
    linkWhy.dataset.i18n = 'nav.why';
    
    navLinks.appendChild(linkHome);
    navLinks.appendChild(linkAbout);
    navLinks.appendChild(linkWhy);

    // Actions
    const navActions = document.createElement('div');
    navActions.className = 'nav-actions';
    
    const navLangBtn = document.createElement('button');
    navLangBtn.className = 'nav-lang-btn';
    const langMap = { en: 'EN', fr: 'FR', ar: 'ع' };
    navLangBtn.textContent = langMap[store.state.lang] || 'EN';
    
    navLangBtn.addEventListener('click', () => {
        pushOverlay('language');
    });
    
    const navMenuBtn = document.createElement('button');
    navMenuBtn.className = 'nav-menu-btn';
    
    const menuSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    menuSvg.setAttribute('viewBox', '0 0 24 24');
    menuSvg.setAttribute('stroke', 'currentColor');
    menuSvg.setAttribute('stroke-width', '2');
    menuSvg.setAttribute('width', '24');
    menuSvg.setAttribute('height', '24');
    menuSvg.innerHTML = `
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
    `;
    navMenuBtn.appendChild(menuSvg);
    
    navActions.appendChild(navLangBtn);
    navActions.appendChild(navMenuBtn);

    // Mobile Menu
    const navMobileMenu = document.createElement('div');
    navMobileMenu.className = 'nav-mobile-menu';
    
    const mLinkHome = linkHome.cloneNode(true);
    const mLinkAbout = linkAbout.cloneNode(true);
    const mLinkWhy = linkWhy.cloneNode(true);
    
    navMobileMenu.appendChild(mLinkHome);
    navMobileMenu.appendChild(mLinkAbout);
    navMobileMenu.appendChild(mLinkWhy);

    navMenuBtn.addEventListener('click', () => {
        navMobileMenu.classList.toggle('open');
    });

    navInner.appendChild(navLogo);
    navInner.appendChild(navLinks);
    navInner.appendChild(navActions);
    navInner.appendChild(navMobileMenu);
    nav.appendChild(navInner);

    // Scroll handler
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 10);
    });

    // Reactive subscriptions
    store.subscribe('lang', (newLang) => {
        navLangBtn.textContent = langMap[newLang] || 'EN';
    });

    store.subscribe('view', (newView) => {
        const updateLinks = (linksContainer) => {
            Array.from(linksContainer.children).forEach(link => {
                const href = link.getAttribute('href');
                if ((newView === 'home' && href === '#/') || 
                    (href === `#/${newView}`)) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        };
        updateLinks(navLinks);
        updateLinks(navMobileMenu);
    });

    return nav;
}
