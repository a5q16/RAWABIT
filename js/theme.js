/* ═══════════════════════════════════════════════════════
   Rawabit — shared theme logic (loaded in <head>, early)
   ═══════════════════════════════════════════════════════ */
(function () {
  var saved = null;
  try { saved = localStorage.getItem('rawabit-theme'); } catch (e) {}
  var dark = saved ? saved === 'dark'
                   : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', dark);
})();

function rawabitToggleTheme() {
  var root = document.documentElement;
  var dark = root.classList.toggle('dark');
  try { localStorage.setItem('rawabit-theme', dark ? 'dark' : 'light'); } catch (e) {}
  window.dispatchEvent(new CustomEvent('rawabit-theme-change', { detail: { dark: dark } }));
}

function rawabitInitNav() {
  var btn = document.getElementById('theme-toggle');
  if (btn) btn.addEventListener('click', rawabitToggleTheme);

  var burger = document.getElementById('menu-toggle');
  var menu = document.getElementById('mobile-menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      menu.classList.toggle('hidden');
    });
  }

  // Navbar background on scroll
  var nav = document.getElementById('navbar');
  if (nav) {
    var onScroll = function () {
      if (window.scrollY > 20) nav.classList.add('nav-scrolled');
      else nav.classList.remove('nav-scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
}
