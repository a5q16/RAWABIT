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
        const hash = window.location.hash || '#/';
        
        for (const route of _routes) {
            const routeSegments = route.pattern.split('/');
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
                _currentParams = params;
                
                const updateView = () => {
                    route.handler(params);
                    // Update store.state.view based on the matched pattern
                    let viewName = 'home';
                    if (route.pattern !== '#/') {
                        // Extract basic view name from pattern
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
    };

    // Add 'hashchange' listener
    window.addEventListener('hashchange', handleHashChange);
    
    // Call matching on init too
    handleHashChange();
}
