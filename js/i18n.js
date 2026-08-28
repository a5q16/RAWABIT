/* ═══════════════════════════════════════════════════════
   Rawabit — i18n (AR / FR / EN) — whole-site translation
   Covers: nav, hero, search, map, profiles, profile, chat, footer
   Persists to localStorage rawabit-lang, sets html lang+dir,
   fires 'rawabit-lang-change' custom event.
   Requires: loaded after theme.js, before page scripts.
   ═══════════════════════════════════════════════════════ */
(function () {
  var DICT = {
    en: {
      'title.home': 'Rawabit — Rawabit',
      'title.profiles': 'Profiles — Rawabit',
      'title.profile': 'Profile — Rawabit',
      'nav.home': 'Home',
      'nav.profiles': 'Profiles',
      'hero.badge': "Algeria\u2019s Digital Competencies Platform",
      'hero.title': 'Discover Algerian Talents',
      'hero.titleAr': 'اكتشف الكفاءات الجزائرية',
      'hero.subtitle': 'Discover, explore, and connect with verified Algerian professionals across every wilaya and discipline.',
      'hero.subtitleAr': 'اكتشف واستكشف وتواصل مع الكفاءات الجزائرية الموثّقة عبر كل الولايات والتخصصات',
      'search.placeholder': 'Search competencies, fields, or institutions\u2026',
      'search.suggestions': 'Suggestions',
      'search.analyzing': 'Analyzing competencies database\u2026',
      'search.aiBadge': '\u2726 AI Research Assistant',
      'search.sources': 'Sources',
      'map.title': 'Explore by Wilaya',
      'map.subtitle': 'Interactive map of Algerian talents — 48 wilayas, clustered under zoom 8, filtered search',
      'map.badge': '48 Wilayas \u00b7 Optimized',
      'map.tip': 'Map clipped inside Algeria borders with neighboring countries masked \u00b7',
      'map.fullscreen': 'Open map fullscreen',
      'footer.about': 'About',
      'footer.api': 'API',
      'footer.privacy': 'Privacy',
      'footer.contact': 'Contact',
      'footer.copy': '\u00A9 2025 Rawabit \u2014 The Digital Platform for Algerian Talents',
      'profiles.title': 'Competency Profiles',
      'profiles.subtitle': 'Verified profiles structured with academic, professional, and reliability data.',
      'profiles.subtitleAr': 'ملفات كفاءات موثّقة بمسار أكاديمي ومهني ومؤشر موثوقية المصدر',
      'card.verified': 'Verified',
      'card.academic': 'Academic Trajectory',
      'card.reliability': 'Reliability',
      'card.skills': 'Skills',
      'card.viewProfile': 'View full profile',
      'card.high': 'High',
      'card.moderate': 'Moderate',
      'card.unverified': 'Unverified',
      'profile.back': '\u2190 Back to profiles',
      'profile.notFoundTitle': 'Profile not found',
      'profile.notFoundSub': 'الملف الشخصي غير موجود',
      'profile.browseAll': 'Browse all profiles',
      'profile.verified': 'Verified',
      'profile.academic': 'Academic Trajectory',
      'profile.professional': 'Professional Path',
      'profile.skills': 'Skills',
      'profile.fields': 'Fields of Expertise',
      'profile.sourceReliability': 'Source Reliability',
      'profile.verifiedNote': 'Data verified through Rawabit\u2019s multi-source reliability scoring.',
      'profile.high': 'High',
      'profile.moderate': 'Moderate',
      'profile.unverified': 'Unverified',
      'chat.title': 'Rawabit AI \u2726',
      'chat.subtitle': 'Research Assistant',
      'chat.greeting': 'Hello! Ask me anything about Algerian competencies \u2014',
      'chat.greetingAr': 'اسألني أي شيء عن الكفاءات الجزائرية',
      'chat.placeholder': 'Type your question\u2026',
      'chat.analyzing': 'Analyzing\u2026',
      'omnibar.q1.en': 'AI researchers in Algiers',
      'omnibar.q1.ar': 'باحثو الذكاء الاصطناعي في الجزائر',
      'omnibar.q2.en': 'Civil engineers Constantine',
      'omnibar.q2.ar': 'مهندسون مدنيون في قسنطينة',
      'omnibar.q3.en': 'Biomedical scientists Oran',
      'omnibar.q3.ar': 'علماء الطب الحيوي في وهران'
    },
    fr: {
      'title.home': 'Rawabit — Plateforme des Compétences Algériennes',
      'title.profiles': 'Profils — Rawabit',
      'title.profile': 'Profil — Rawabit',
      'nav.home': 'Accueil',
      'nav.profiles': 'Profils',
      'hero.badge': 'Plateforme Nationale des Compétences Algériennes',
      'hero.title': 'Découvrez les talents algériens',
      'hero.titleAr': 'اكتشف الكفاءات الجزائرية',
      'hero.subtitle': 'Découvrez, explorez et connectez-vous avec des professionnels algériens vérifiés dans chaque wilaya.',
      'hero.subtitleAr': 'اكتشف واستكشف وتواصل مع الكفاءات الجزائرية الموثّقة عبر كل الولايات والتخصصات',
      'search.placeholder': 'Rechercher compétences, domaines ou institutions\u2026',
      'search.suggestions': 'Suggestions',
      'search.analyzing': 'Analyse de la base de compétences\u2026',
      'search.aiBadge': '\u2726 Assistant de Recherche IA',
      'search.sources': 'Sources',
      'map.title': 'Explorer par Wilaya',
      'map.subtitle': 'Carte interactive des talents algériens — 48 wilayas, regroupées sous le zoom 8, recherche filtrée',
      'map.badge': '48 Wilayas \u00b7 Optimisée',
      'map.tip': 'Carte découpée aux frontières algériennes, pays voisins masqués \u00b7',
      'map.fullscreen': 'Ouvrir la carte en plein écran',
      'footer.about': 'À propos',
      'footer.api': 'API',
      'footer.privacy': 'Confidentialité',
      'footer.contact': 'Contact',
      'footer.copy': '\u00A9 2025 Rawabit \u2014 La plateforme numérique des compétences algériennes',
      'profiles.title': 'Profils de Compétences',
      'profiles.subtitle': 'Profils vérifiés structurés avec données académiques, professionnelles et de fiabilité.',
      'profiles.subtitleAr': 'ملفات كفاءات موثّقة بمسار أكاديمي ومهني ومؤشر موثوقية المصدر',
      'card.verified': 'Vérifié',
      'card.academic': 'Parcours Académique',
      'card.reliability': 'Fiabilité',
      'card.skills': 'Compétences',
      'card.viewProfile': 'Voir le profil complet',
      'card.high': 'Élevée',
      'card.moderate': 'Modérée',
      'card.unverified': 'Non vérifié',
      'profile.back': '\u2190 Retour aux profils',
      'profile.notFoundTitle': 'Profil introuvable',
      'profile.notFoundSub': 'الملف الشخصي غير موجود',
      'profile.browseAll': 'Parcourir tous les profils',
      'profile.verified': 'Vérifié',
      'profile.academic': 'Parcours Académique',
      'profile.professional': 'Parcours Professionnel',
      'profile.skills': 'Compétences',
      'profile.fields': 'Domaines d\u2019Expertise',
      'profile.sourceReliability': 'Fiabilité de la Source',
      'profile.verifiedNote': 'Données vérifiées via le score de fiabilité multi-sources de Rawabit.',
      'profile.high': 'Élevée',
      'profile.moderate': 'Modérée',
      'profile.unverified': 'Non vérifié',
      'chat.title': 'Rawabit IA \u2726',
      'chat.subtitle': 'Assistant de Recherche',
      'chat.greeting': 'Bonjour ! Posez-moi vos questions sur les compétences algériennes \u2014',
      'chat.greetingAr': 'اسألني أي شيء عن الكفاءات الجزائرية',
      'chat.placeholder': 'Tapez votre question\u2026',
      'chat.analyzing': 'Analyse\u2026',
      'omnibar.q1.en': 'Chercheurs IA à Alger',
      'omnibar.q1.ar': 'باحثو الذكاء الاصطناعي في الجزائر',
      'omnibar.q2.en': 'Ingénieurs civils Constantine',
      'omnibar.q2.ar': 'مهندسون مدنيون في قسنطينة',
      'omnibar.q3.en': 'Chercheurs biomédicaux Oran',
      'omnibar.q3.ar': 'علماء الطب الحيوي في وهران'
    },
    ar: {
      'title.home': 'روابط — المنصة الرقمية للكفاءات الجزائرية',
      'title.profiles': 'الكفاءات — روابط',
      'title.profile': 'الملف — روابط',
      'nav.home': 'الرئيسية',
      'nav.profiles': 'الكفاءات',
      'hero.badge': 'المنصة الرقمية للكفاءات الجزائرية',
      'hero.title': 'اكتشف الكفاءات الجزائرية',
      'hero.titleAr': 'اكتشف الكفاءات الجزائرية',
      'hero.subtitle': 'اكتشف واستكشف وتواصل مع الكفاءات الجزائرية الموثّقة عبر كل الولايات والتخصصات.',
      'hero.subtitleAr': 'Discover, explore, and connect with verified Algerian professionals across every wilaya and discipline.',
      'search.placeholder': 'ابحث عن الكفاءات، المجالات أو المؤسسات\u2026',
      'search.suggestions': 'اقتراحات',
      'search.analyzing': 'جاري تحليل قاعدة الكفاءات\u2026',
      'search.aiBadge': '\u2726 مساعد البحث الذكي',
      'search.sources': 'المصادر',
      'map.title': 'استكشف حسب الولاية',
      'map.subtitle': 'خريطة تفاعلية لكفاءات الجزائر — 48 ولاية، تجميع تحت تقريب 8، بحث مفلتر',
      'map.badge': '48 ولاية \u00b7 محسّنة',
      'map.tip': 'خريطة محصورة داخل حدود الجزائر مع إخفاء الدول المجاورة \u00b7',
      'map.fullscreen': 'فتح الخريطة بملء الشاشة',
      'footer.about': 'من نحن',
      'footer.api': 'واجهة برمجية',
      'footer.privacy': 'الخصوصية',
      'footer.contact': 'اتصل بنا',
      'footer.copy': '\u00A9 2025 روابط — المنصة الرقمية للكفاءات الجزائرية',
      'profiles.title': 'ملفات الكفاءات',
      'profiles.subtitle': 'ملفات كفاءات موثّقة بمسار أكاديمي ومهني ومؤشر موثوقية المصدر.',
      'profiles.subtitleAr': 'Verified profiles structured with academic, professional, and reliability data.',
      'card.verified': 'موثّق',
      'card.academic': 'المسار الأكاديمي',
      'card.reliability': 'الموثوقية',
      'card.skills': 'المهارات',
      'card.viewProfile': 'عرض الملف كاملاً',
      'card.high': 'عالية',
      'card.moderate': 'متوسطة',
      'card.unverified': 'غير موثّق',
      'profile.back': '\u2190 العودة إلى الكفاءات',
      'profile.notFoundTitle': 'الملف غير موجود',
      'profile.notFoundSub': 'Profile not found',
      'profile.browseAll': 'تصفح جميع الكفاءات',
      'profile.verified': 'موثّق',
      'profile.academic': 'المسار الأكاديمي',
      'profile.professional': 'المسار المهني',
      'profile.skills': 'المهارات',
      'profile.fields': 'مجالات الخبرة',
      'profile.sourceReliability': 'موثوقية المصدر',
      'profile.verifiedNote': 'البيانات موثّقة عبر نظام تقييم الموثوقية متعدد المصادر لروابط.',
      'profile.high': 'عالية',
      'profile.moderate': 'متوسطة',
      'profile.unverified': 'غير موثّق',
      'chat.title': 'روابط الذكي \u2726',
      'chat.subtitle': 'مساعد البحث',
      'chat.greeting': 'مرحباً! اسألني أي شيء عن الكفاءات الجزائرية \u2014',
      'chat.greetingAr': 'Hello! Ask me anything about Algerian competencies',
      'chat.placeholder': 'اكتب سؤالك\u2026',
      'chat.analyzing': 'جاري التحليل\u2026',
      'omnibar.q1.en': 'باحثو الذكاء الاصطناعي في الجزائر',
      'omnibar.q1.ar': 'AI researchers in Algiers',
      'omnibar.q2.en': 'مهندسون مدنيون في قسنطينة',
      'omnibar.q2.ar': 'Civil engineers Constantine',
      'omnibar.q3.en': 'علماء الطب الحيوي في وهران',
      'omnibar.q3.ar': 'Biomedical scientists Oran'
    }
  };

  var LANGS = ['en', 'fr', 'ar'];

  function getLang() {
    try {
      var s = localStorage.getItem('rawabit-lang');
      if (s && LANGS.indexOf(s) !== -1) return s;
    } catch (e) {}
    var nav = (navigator.language || 'en').toLowerCase();
    if (nav.indexOf('ar') === 0) return 'ar';
    if (nav.indexOf('fr') === 0) return 'fr';
    return 'en';
  }

  function t(key, lang) {
    lang = lang || current;
    var d = DICT[lang] || DICT.en;
    return d[key] != null ? d[key] : (DICT.en[key] || key);
  }

  var current = getLang();

  function apply(lang) {
    if (LANGS.indexOf(lang) === -1) lang = 'en';
    current = lang;
    try { localStorage.setItem('rawabit-lang', lang); } catch (e) {}
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // text nodes
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      el.textContent = t(key, lang);
    });
    // placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      el.setAttribute('placeholder', t(key, lang));
    });
    // html (rare)
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      el.innerHTML = t(key, lang);
    });
    // title per page: data-title-key on <title> or html attribute
    var titleKey = document.documentElement.getAttribute('data-title-key') || document.body.getAttribute('data-title-key');
    // fallback: infer from path
    if (!titleKey) {
      var path = location.pathname.split('/').pop() || 'index.html';
      if (path === 'profiles.html') titleKey = 'title.profiles';
      else if (path === 'profile.html') titleKey = 'title.profile';
      else titleKey = 'title.home';
    }
    document.title = t(titleKey, lang);

    // switcher buttons
    document.querySelectorAll('.lang-btn').forEach(function (b) {
      var on = b.getAttribute('data-lang') === lang;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    window.dispatchEvent(new CustomEvent('rawabit-lang-change', { detail: { lang: lang } }));
  }

  // early: set html lang/dir immediately (before DOMContentLoaded, to avoid flash)
  document.documentElement.lang = current;
  document.documentElement.dir = current === 'ar' ? 'rtl' : 'ltr';

  function initSwitcher() {
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var l = btn.getAttribute('data-lang');
        apply(l);
      });
    });
    apply(current);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSwitcher);
  } else {
    initSwitcher();
  }

  // also re-apply when onboarding finishes (it writes localStorage + html lang)
  window.addEventListener('storage', function () { apply(getLang()); });

  window.RAWABIT_I18N = { getLang: getLang, t: t, apply: apply, DICT: DICT };
  window.rawabitSetLang = apply;
})();
