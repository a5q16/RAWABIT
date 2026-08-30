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
    const loader = _loaderEl || createLoader();
    loader.style.display = 'flex';
    loader.classList.remove('hidden');
    
    return new Promise(resolve => {
        setTimeout(resolve, 200);
    });
}

export function hideLoader() {
    const loader = _loaderEl || document.getElementById('loader') || document.querySelector('.loader-screen');
    if (loader) {
        loader.classList.add('hidden');
        loader.style.zIndex = '';
        setTimeout(() => {
            if (loader && loader.classList.contains('hidden')) {
                loader.style.display = 'none';
            }
        }, 350);
    }
}
