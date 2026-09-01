/**
 * Hash-based SPA router with View Transitions API support
 */
import { store } from './store.js';

const _routes = [];
let _currentParams = {};

export function registerRoute(pattern, handler) {
    _routes.push({ pattern, handler });
}

export function navigate(hash) {
    if (typeof document !== 'undefined' && document.body) {
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
    }
    window.location.hash = hash;
}

export function getCurrentParams() {
    return _currentParams;
}

export function initRouter() {
    const handleHashChange = () => {
        // Global Scroll-Lock Fix & Modal Cleanup on Route Change
        if (typeof document !== 'undefined' && document.body) {
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
            
            // Clean up any open modal nodes on route change
            const openOverlays = document.querySelectorAll('.mindmap-overlay, .roadmap-modal-overlay, .wilaya-modal-overlay, #hud-master-overlay, .proactive-ai-overlay, #proactive-ai-overlay');
            openOverlays.forEach(el => {
                if (el && el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            });
        }
        store.setState({ overlayStack: [] });

        let rawHash = window.location.hash || '#/';
        
        // Handle in-page smooth scrolling anchors on home page
        if (['#ai-search', '#map-section', '#features', '#stats', '#hero'].includes(rawHash)) {
            const targetEl = document.querySelector(rawHash);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth' });
                return;
            }
        }

        if (!rawHash || rawHash === '#' || rawHash === '') {
            rawHash = '#/';
        }
        if (!rawHash.startsWith('#/')) {
            rawHash = '#/' + rawHash.replace(/^#/, '');
        }

        // Strip trailing slash if not root
        const hash = (rawHash !== '#/' && rawHash.endsWith('/')) ? rawHash.slice(0, -1) : rawHash;
        
        let matched = false;

        for (const route of _routes) {
            const routeClean = (route.pattern !== '#/' && route.pattern.endsWith('/')) ? route.pattern.slice(0, -1) : route.pattern;
            const routeSegments = routeClean.split('/');
            const hashSegments = hash.split('/');
            
            if (routeSegments.length !== hashSegments.length) continue;
            
            let match = true;
            const params = {};
            
            for (let i = 0; i < routeSegments.length; i++) {
                if (routeSegments[i].startsWith(':')) {
                    const paramName = routeSegments[i].substring(1);
                    params[paramName] = hashSegments[i];
                } else if (routeSegments[i] !== hashSegments[i]) {
                    match = false;
                    break;
                }
            }
            
            if (match) {
                matched = true;
                _currentParams = params;
                
                const updateView = () => {
                    route.handler(params);
                    // Update store.state.view based on the matched pattern
                    let viewName = 'home';
                    if (route.pattern !== '#/') {
                        viewName = route.pattern.split('/')[1] || 'home';
                    }
                    store.setState({ view: viewName });
                };

                if (document.startViewTransition) {
                    document.startViewTransition(updateView);
                } else {
                    updateView();
                }
                
                break;
            }
        }

        // Fallback to home if no route matched
        if (!matched && _routes.length > 0) {
            const homeRoute = _routes.find(r => r.pattern === '#/');
            if (homeRoute) {
                homeRoute.handler({});
                store.setState({ view: 'home' });
            }
        }
    };

    // Add 'hashchange' listener
    window.addEventListener('hashchange', handleHashChange);
    
    // Call matching on init too
    handleHashChange();
}
