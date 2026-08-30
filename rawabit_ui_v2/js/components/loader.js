/**
 * Global Loader component
 */

let _loaderEl = null;

export function createLoader() {
    let loader = document.getElementById('loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loader';
        loader.className = 'loader-screen';
        loader.innerHTML = `
            <div class="loader-brand">روابط</div>
            <div class="loader-dots">
                <span class="loader-dot"></span>
                <span class="loader-dot"></span>
                <span class="loader-dot"></span>
            </div>
        `;
        document.body.appendChild(loader);
    }
    _loaderEl = loader;
    return loader;
}

export function showLoader() {
    if (!_loaderEl) {
        createLoader();
    }
    _loaderEl.classList.remove('hidden');
    
    return new Promise(resolve => {
        setTimeout(resolve, 300);
    });
}

export function hideLoader() {
    if (_loaderEl) {
        _loaderEl.classList.add('hidden');
    }
}
