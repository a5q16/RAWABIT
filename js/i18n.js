/**
 * Internationalization utilities
 */
import { TRANSLATIONS } from './data/translations.js';
import { store } from './store.js';

export function t(key) {
    return TRANSLATIONS[store.state.lang]?.[key] ?? TRANSLATIONS.en?.[key] ?? key;
}

export function setLang(lang) {
    // validate lang is 'en'|'fr'|'ar' (fallback 'en')
    const validLang = ['en', 'fr', 'ar'].includes(lang) ? lang : 'en';
    
    store.setState({ lang: validLang });
    document.documentElement.lang = validLang;
    document.documentElement.dir = (validLang === 'ar' ? 'rtl' : 'ltr');
    localStorage.setItem('rawabit-lang', validLang);
    
    applyTranslations();
    
    window.dispatchEvent(new CustomEvent('rawabit-lang-change', { detail: { lang: validLang } }));
}

export function getLang() {
    try {
        const stored = localStorage.getItem('rawabit-lang');
        if (stored && ['en', 'fr', 'ar'].includes(stored)) {
            return stored;
        }
    } catch (e) {
        // Ignore error
    }
    
    // fallback to navigator.language detection
    const navLang = (typeof navigator !== 'undefined' && (navigator.language || 'ar')).slice(0, 2);
    if (navLang === 'ar') return 'ar';
    if (navLang === 'fr') return 'fr';
    return 'en';
}

export function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n') || (el.dataset && el.dataset.i18n);
        if (key) {
            el.textContent = t(key);
        }
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder') || (el.dataset && el.dataset.i18nPlaceholder);
        if (key) {
            el.placeholder = t(key);
        }
    });
}

export function initI18n() {
    setLang(getLang());
}
