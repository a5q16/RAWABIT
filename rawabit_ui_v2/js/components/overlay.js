/**
 * Overlays components
 */
import { t, setLang, getLang } from '../i18n.js';
import { store, popOverlay, isOverlayActive } from '../store.js';
import { showLoader, hideLoader } from './loader.js';

export function createLanguageOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'language-overlay';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'overlay-close';
    const closeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    closeSvg.setAttribute('viewBox', '0 0 24 24');
    closeSvg.setAttribute('stroke', 'currentColor');
    closeSvg.setAttribute('stroke-width', '2');
    closeSvg.innerHTML = `
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    `;
    closeBtn.appendChild(closeSvg);
    closeBtn.addEventListener('click', () => popOverlay());

    const title = document.createElement('h2');
    title.className = 'lang-title';
    title.dataset.i18n = 'lang.title';

    const subtitle = document.createElement('p');
    subtitle.className = 'lang-subtitle';
    subtitle.dataset.i18n = 'lang.subtitle';

    const langSelector = document.createElement('div');
    langSelector.className = 'lang-selector';

    const langs = [
        { code: 'en', icon: 'En', title: 'English', subtitle: 'English', sample: 'lang.en.sample' },
        { code: 'fr', icon: 'Fr', title: 'Français', subtitle: 'Français', sample: 'lang.fr.sample' },
        { code: 'ar', icon: 'ع', title: 'العربية', subtitle: 'العربية', sample: 'lang.ar.sample' }
    ];

    langs.forEach(l => {
        const card = document.createElement('div');
        card.className = 'lang-card';
        card.dataset.lang = l.code;
        
        if (store.state.lang === l.code) {
            card.classList.add('selected');
        }

        const icon = document.createElement('div');
        icon.className = 'lang-card-icon';
        icon.textContent = l.icon;

        const cTitle = document.createElement('h3');
        cTitle.className = 'lang-card-title';
        cTitle.textContent = l.title;

        const cSubtitle = document.createElement('p');
        cSubtitle.className = 'lang-card-subtitle';
        cSubtitle.textContent = l.subtitle;

        const cSample = document.createElement('p');
        cSample.className = 'lang-card-sample';
        cSample.dataset.i18n = l.sample;

        card.appendChild(icon);
        card.appendChild(cTitle);
        card.appendChild(cSubtitle);
        card.appendChild(cSample);

        card.addEventListener('click', async () => {
            Array.from(langSelector.children).forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            
            await showLoader();
            setLang(l.code);
            hideLoader();
            popOverlay();
        });

        langSelector.appendChild(card);
    });

    overlay.appendChild(closeBtn);
    overlay.appendChild(title);
    overlay.appendChild(subtitle);
    overlay.appendChild(langSelector);

    // Reactive subscriptions
    store.subscribe('lang', (newLang) => {
        Array.from(langSelector.children).forEach(card => {
            if (card.dataset.lang === newLang) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    });

    store.subscribe('overlayStack', () => {
        if (isOverlayActive('language')) {
            overlay.classList.add('active');
            Array.from(langSelector.children).forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('visible');
                }, (index + 1) * 100);
            });
        } else {
            Array.from(langSelector.children).forEach(card => {
                card.classList.remove('visible');
            });
            setTimeout(() => {
                overlay.classList.remove('active');
            }, 300);
        }
    });

    // Event listeners
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOverlayActive('language')) {
            popOverlay();
        }
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            popOverlay();
        }
    });

    return overlay;
}
