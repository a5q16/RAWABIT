/* ═══════════════════════════════════════════════════════
   Rawabit — first-visit onboarding (theme + language)
   Shows once; stores choices in localStorage:
     rawabit-theme    = light | dark
     rawabit-lang     = ar | fr | en
     rawabit-onboarded= 1
   ═══════════════════════════════════════════════════════ */
(function () {
  var onboarded = null;
  try { onboarded = localStorage.getItem('rawabit-onboarded'); } catch (e) {}
  if (onboarded === '1') {
    // Still reflect the saved language on <html lang>
    try {
      var lang = localStorage.getItem('rawabit-lang');
      if (lang) document.documentElement.lang = lang;
    } catch (e) {}
    return;
  }

  function currentDark() {
    return document.documentElement.classList.contains('dark');
  }

  var state = {
    theme: currentDark() ? 'dark' : 'light',
    lang: (navigator.language || 'en').toLowerCase().indexOf('ar') === 0 ? 'ar'
        : (navigator.language || 'en').toLowerCase().indexOf('fr') === 0 ? 'fr'
        : 'en'
  };

  var overlay = document.createElement('div');
  overlay.id = 'rawabit-onboarding';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45);backdrop-filter:blur(6px);padding:16px;';

  overlay.innerHTML =
    '<div id="onb-card" style="max-width:440px;width:100%;background:#fff;border:1px solid #e5e2db;border-radius:24px;padding:32px;box-shadow:0 24px 64px rgba(0,0,0,.25);font-family:Inter,Cairo,sans-serif;color:#1a1a1a;animation:onbIn .45s ease-out both;">' +
      '<div style="text-align:center;margin-bottom:22px;">' +
        '<div style="width:52px;height:52px;border-radius:16px;background:#2C5F2D;color:#fff;display:flex;align-items:center;justify-content:center;font-family:Cairo,sans-serif;font-weight:700;font-size:24px;margin:0 auto 14px;">ر</div>' +
        '<h2 style="margin:0 0 4px;font-size:22px;font-weight:700;">Welcome to Rawabit</h2>' +
        '<p style="margin:0;font-family:Cairo,sans-serif;font-size:14px;color:#6b7280;">مرحبًا بك في روابط — كيف تحب أن نبدأ؟</p>' +
      '</div>' +

      '<p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#2C5F2D;">Theme · المظهر</p>' +
      '<div style="display:flex;gap:10px;margin-bottom:18px;">' +
        '<button type="button" data-theme="light" class="onb-theme" style="flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:14px;border:2px solid #e5e7eb;background:#fafafa;cursor:pointer;font-size:14px;font-weight:600;color:#374151;">☀️ Light</button>' +
        '<button type="button" data-theme="dark" class="onb-theme" style="flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:14px;border:2px solid #e5e7eb;background:#fafafa;cursor:pointer;font-size:14px;font-weight:600;color:#374151;">🌙 Dark</button>' +
      '</div>' +

      '<p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#2C5F2D;">Language · اللغة</p>' +
      '<div style="display:flex;gap:10px;margin-bottom:22px;">' +
        '<button type="button" data-lang="ar" class="onb-lang" style="flex:1;padding:12px;border-radius:14px;border:2px solid #e5e7eb;background:#fafafa;cursor:pointer;font-size:14px;font-weight:600;color:#374151;font-family:Cairo,sans-serif;">العربية</button>' +
        '<button type="button" data-lang="fr" class="onb-lang" style="flex:1;padding:12px;border-radius:14px;border:2px solid #e5e7eb;background:#fafafa;cursor:pointer;font-size:14px;font-weight:600;color:#374151;">Français</button>' +
        '<button type="button" data-lang="en" class="onb-lang" style="flex:1;padding:12px;border-radius:14px;border:2px solid #e5e7eb;background:#fafafa;cursor:pointer;font-size:14px;font-weight:600;color:#374151;">English</button>' +
      '</div>' +

      '<button type="button" id="onb-continue" style="width:100%;padding:14px;border:none;border-radius:16px;background:#2C5F2D;color:#fff;font-size:15px;font-weight:700;cursor:pointer;transition:background .2s;">Start Exploring · ابدأ الاستكشاف</button>' +
    '</div>' +
    '<style>' +
      '@keyframes onbIn{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}' +
      '.onb-sel{border-color:#2C5F2D !important;background:rgba(44,95,45,.08) !important;color:#2C5F2D !important;box-shadow:0 0 0 3px rgba(44,95,45,.15)}' +
      '#onb-continue:hover{background:#3A7D3E !important}' +
    '</style>';

  document.body.appendChild(overlay);

  var card = overlay.querySelector('#onb-card');
  var isDarkPage = currentDark();
  if (isDarkPage) {
    card.style.background = '#1D1D1D';
    card.style.borderColor = '#3D3D3D';
    card.style.color = '#e8e8e8';
  }

  function paintSelections() {
    overlay.querySelectorAll('.onb-theme').forEach(function (b) {
      var on = b.dataset.theme === state.theme;
      b.className = 'onb-theme' + (on ? ' onb-sel' : '');
      if (isDarkPage && !on) { b.style.background = '#2A2A2A'; b.style.borderColor = '#4A4A4A'; b.style.color = '#d4d4d4'; }
      else if (isDarkPage && on) { b.style.borderColor = '#8BC98F'; b.style.background = 'rgba(139,201,143,.12)'; b.style.color = '#8BC98F'; }
      else if (!on) { b.style.background = '#fafafa'; b.style.borderColor = '#e5e7eb'; b.style.color = '#374151'; }
      else { b.style.borderColor = '#2C5F2D'; b.style.background = 'rgba(44,95,45,.08)'; b.style.color = '#2C5F2D'; }
    });
    overlay.querySelectorAll('.onb-lang').forEach(function (b) {
      var on = b.dataset.lang === state.lang;
      b.className = 'onb-lang' + (on ? ' onb-sel' : '');
      if (isDarkPage && !on) { b.style.background = '#2A2A2A'; b.style.borderColor = '#4A4A4A'; b.style.color = '#d4d4d4'; }
      else if (isDarkPage && on) { b.style.borderColor = '#8BC98F'; b.style.background = 'rgba(139,201,143,.12)'; b.style.color = '#8BC98F'; }
      else if (!on) { b.style.background = '#fafafa'; b.style.borderColor = '#e5e7eb'; b.style.color = '#374151'; }
      else { b.style.borderColor = '#2C5F2D'; b.style.background = 'rgba(44,95,45,.08)'; b.style.color = '#2C5F2D'; }
    });
  }
  paintSelections();

  overlay.querySelectorAll('.onb-theme').forEach(function (b) {
    b.addEventListener('click', function () {
      state.theme = b.dataset.theme;
      if (state.theme === 'dark' && !currentDark()) rawabitToggleTheme();
      if (state.theme === 'light' && currentDark()) rawabitToggleTheme();
      isDarkPage = currentDark();
      card.style.background = isDarkPage ? '#1D1D1D' : '#fff';
      card.style.borderColor = isDarkPage ? '#3D3D3D' : '#e5e2db';
      card.style.color = isDarkPage ? '#e8e8e8' : '#1a1a1a';
      paintSelections();
    });
  });

  overlay.querySelectorAll('.onb-lang').forEach(function (b) {
    b.addEventListener('click', function () {
      state.lang = b.dataset.lang;
      paintSelections();
    });
  });

  overlay.querySelector('#onb-continue').addEventListener('click', function () {
    try {
      localStorage.setItem('rawabit-theme', state.theme);
      localStorage.setItem('rawabit-lang', state.lang);
      localStorage.setItem('rawabit-onboarded', '1');
    } catch (e) {}
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    if (window.RAWABIT_I18N) window.RAWABIT_I18N.apply(state.lang);
    else window.dispatchEvent(new CustomEvent('rawabit-lang-change', { detail: { lang: state.lang } }));
    overlay.style.transition = 'opacity .3s ease';
    overlay.style.opacity = '0';
    setTimeout(function () { overlay.remove(); }, 300);
  });
})();
