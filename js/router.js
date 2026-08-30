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
    window.location.hash = hash;
}

export function getCurrentParams() {
    return _currentParams;
}

export function initRouter() {
    const handleHashChange = () => {
        let rawHash = (typeof window !== 'undefined' && window.location && window.location.hash) ? window.location.hash : '#/';

        // ── Global Cleanup Routine: Destroy orphaned overlays & unlock body scroll on route change/back button ──
        try {
            const overlaySelectors = [
                '#hud-master-overlay',
                '#hud-overlay',
                '#mindmap-overlay',
                '.wilaya-modal-overlay'
            ];
            overlaySelectors.forEach(sel => {
                if (typeof document !== 'undefined') {
                    document.querySelectorAll(sel).forEach(el => {
                        if (el && typeof el.remove === 'function') el.remove();
                    });
                }
            });

            // Close active AI chat drawer & backdrop with safe null checks
            if (typeof document !== 'undefined') {
                const chatDrawer = document.getElementById('ai-drawer-panel');
                const chatBackdrop = document.getElementById('ai-drawer-backdrop');
                if (chatDrawer && chatDrawer.classList && chatDrawer.classList.contains('active')) {
                    chatDrawer.classList.remove('active');
                }
                if (chatBackdrop && chatBackdrop.classList && chatBackdrop.classList.contains('active')) {
                    chatBackdrop.classList.remove('active');
                }

                // Force unlock body scroll
                if (document.body && document.body.classList) {
                    document.body.classList.remove('modal-open');
                }
            }
            
            if (store && typeof store.setState === 'function') {
                store.setState({ overlayStack: [] });
            }
        } catch (e) {
            console.warn('Router cleanup error:', e);
        }

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
                    try {
                        route.handler(params);
                    } catch (err) {
                        console.error('Route handler error:', err);
                    }
                    // Update store.state.view based on the matched pattern
                    let viewName = 'home';
                    if (route.pattern !== '#/') {
                        viewName = route.pattern.split('/')[1] || 'home';
                    }
                    store.setState({ view: viewName });
                };

                try {
                    if (document.startViewTransition) {
                        document.startViewTransition(updateView);
                    } else {
                        updateView();
                    }
                } catch (e) {
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
