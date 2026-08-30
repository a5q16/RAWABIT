/**
 * Proxy-based reactive state store for Rawabit
 */

function createStore(initialState) {
    // Clone initialState into an internal _state object
    const _state = { ...initialState };
    
    // Create a Map<string, Set<Function>> called _subs for per-key subscriptions
    const _subs = new Map();

    // Create a Proxy wrapper
    const proxy = new Proxy(_state, {
        set(target, prop, value) {
            const oldVal = target[prop];
            // if newVal !== oldVal, update _state, call all callbacks in _subs.get(key)
            if (value !== oldVal) {
                target[prop] = value;
                if (_subs.has(prop)) {
                    _subs.get(prop).forEach(fn => fn(value, oldVal));
                }
            }
            return true;
        }
    });

    return {
        state: proxy,
        subscribe(key, fn) {
            if (!_subs.has(key)) {
                _subs.set(key, new Set());
            }
            const callbacks = _subs.get(key);
            callbacks.add(fn);
            // returns unsubscribe fn
            return () => callbacks.delete(fn);
        },
        setState(partial) {
            // Object.entries(partial).forEach set on proxy
            Object.entries(partial).forEach(([key, value]) => {
                proxy[key] = value;
            });
        }
    };
}

export const store = createStore({ 
    lang: 'en', 
    view: 'home', 
    selectedWilaya: null, 
    selectedProfile: null, 
    loading: false, 
    overlayStack: [] 
});

export function pushOverlay(name) { 
    const nextStack = [...store.state.overlayStack, name];
    store.setState({ overlayStack: nextStack }); 
    if (typeof document !== 'undefined' && document.body) {
        document.body.classList.add('modal-open');
    }
}

export function popOverlay() { 
    const nextStack = store.state.overlayStack.slice(0, -1);
    store.setState({ overlayStack: nextStack }); 
    if (typeof document !== 'undefined' && document.body && nextStack.length === 0) {
        document.body.classList.remove('modal-open');
    }
}

export function isOverlayActive(name) { 
    return store.state.overlayStack.includes(name); 
}
