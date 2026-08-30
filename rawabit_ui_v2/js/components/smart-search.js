/**
 * Rawabit v2 — AI-First Categorized Command Palette & Smart Search Engine
 * Features:
 * 1. Categorized Filter Tabs (Ask AI, Experts, Specialties, Wilayas)
 * 2. Pinned Top AI Action Prompt: <div class="ai-suggest" style="cursor:pointer; font-weight:bold; color:#059669;">
 * 3. Segmented Result Headers for Clean UX
 * 4. 100% Strict Dynamic Localization (RTL / LTR)
 * Strictly Vanilla JS · 60FPS Reactive
 */

import { WILAYAS } from './map-paths.js';
import { openWilayaIntermediateScreen } from './wilaya-modal.js';
import { openAIChat } from './chat.js';
import { openMindMap } from './mindmap.js';
import { getProfilesByWilaya, getAllCategories } from '../data/profiles-data.js';
import { store } from '../store.js';
import { t } from '../i18n.js';
import { navigate } from '../router.js';

let activeDropdown = null;
let cachedProfiles = [];
const allCategories = getAllCategories();

// Pre-warm profiles cache for fast instant matching
getProfilesByWilaya(16).then(res => {
  if (Array.isArray(res)) cachedProfiles = res;
}).catch(() => {});

/**
 * Initialize Categorized Command Palette on a given form and input
 * @param {HTMLFormElement} formEl 
 * @param {HTMLInputElement} inputEl 
 */
export function initSmartSearch(formEl, inputEl) {
  if (!formEl || !inputEl) return;

  let activeIndex = -1;
  let activeTab = 'ai'; // 'ai', 'experts', 'specialties', 'wilayas'

  // Create floating glassmorphism dropdown container
  const dropdown = document.createElement('div');
  dropdown.className = 'smart-search-dropdown';
  dropdown.id = 'smart-search-dropdown';
  dropdown.style.display = 'none';
  formEl.style.position = 'relative';
  formEl.appendChild(dropdown);
  activeDropdown = dropdown;

  function closeDropdown() {
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
    activeIndex = -1;
  }

  function getLocalizedText() {
    const lang = store.state.lang;
    if (lang === 'ar') {
      return {
        tabAi: 'اسأل الذكاء الاصطناعي',
        tabExperts: 'الخبراء والكفاءات',
        tabSpecialties: 'التخصصات والمجالات',
        tabWilayas: 'الولايات',
        askAiPrefix: 'اسأل المساعد الذكي عن:',
        aiActionBadge: 'محادثة ذكية ↵',
        aiSubDesc: 'توليد إجابات دقيقة وموثقة من السجل الوطني للكفاءات',
        wilayasHeading: 'الولايات المعتمدة',
        talentsHeading: 'الكفاءات والخبراء المعتمدون',
        specialtiesHeading: 'التخصصات والمجالات الدقيقة',
        enterWilaya: 'استعراض ↵',
        emptyResults: 'لم يتم العثور على نتائج مباشرة، اضغط على اسأل الذكاء الاصطناعي للحصول على تحليل مخصص.'
      };
    } else if (lang === 'fr') {
      return {
        tabAi: 'Demander à l’IA',
        tabExperts: 'Experts & Talents',
        tabSpecialties: 'Spécialités & Domaines',
        tabWilayas: 'Wilayas',
        askAiPrefix: 'Demander à l’IA :',
        aiActionBadge: 'Chat IA ↵',
        aiSubDesc: 'Générer des réponses vérifiées du registre souverain',
        wilayasHeading: 'Wilayas Enregistrées',
        talentsHeading: 'Experts Vérifiés',
        specialtiesHeading: 'Domaines & Spécialités',
        enterWilaya: 'Explorer ↵',
        emptyResults: 'Aucun résultat direct. Cliquez sur Demander à l’IA pour une recherche étendue.'
      };
    } else {
      return {
        tabAi: 'Ask AI',
        tabExperts: 'Experts & Talents',
        tabSpecialties: 'Specialties',
        tabWilayas: 'Wilayas',
        askAiPrefix: 'Ask AI about:',
        aiActionBadge: 'AI Chat ↵',
        aiSubDesc: 'Generate verified responses from sovereign registries',
        wilayasHeading: 'Matching Wilayas',
        talentsHeading: 'Verified Experts',
        specialtiesHeading: 'Specialized Domains',
        enterWilaya: 'Explore ↵',
        emptyResults: 'No direct records found. Click Ask AI for dynamic intelligence search.'
      };
    }
  }

  function renderPalette(query = '') {
    const lang = store.state.lang;
    const isRtl = lang === 'ar';
    dropdown.setAttribute('dir', isRtl ? 'rtl' : 'ltr');

    const i18n = getLocalizedText();
    const q = query.trim().toLowerCase();
    const rawQuery = query.trim() || (lang === 'ar' ? 'الكفاءات الجزائرية' : (lang === 'fr' ? 'Compétences algériennes' : 'Algerian competencies'));

    // 1. Filter matching Wilayas
    const matchingWilayas = WILAYAS.filter(w => {
      if (!q) return true;
      const codeMatch = w.code.includes(q) || String(Number(w.code)) === q;
      const nameMatch = w.name && w.name.toLowerCase().includes(q);
      const nameArMatch = w.nameAr && w.nameAr.includes(q);
      const nameEnMatch = w.nameEn && w.nameEn.toLowerCase().includes(q);
      const nameFrMatch = w.nameFr && w.nameFr.toLowerCase().includes(q);
      return codeMatch || nameMatch || nameArMatch || nameEnMatch || nameFrMatch;
    }).slice(0, 4);

    // 2. Filter matching Talents
    const matchingTalents = cachedProfiles.filter(p => {
      if (!q) return true;
      const nMatch = (p.name && p.name.toLowerCase().includes(q)) || (p.nameAr && p.nameAr.includes(q));
      const tMatch = (p.title && p.title.toLowerCase().includes(q)) || (p.titleAr && p.titleAr.includes(q));
      const tgMatch = p.tags && p.tags.some(tg => tg.toLowerCase().includes(q));
      return nMatch || tMatch || tgMatch;
    }).slice(0, 4);

    // 3. Filter matching Specialties / Domains
    const matchingSpecialties = allCategories.filter(c => {
      if (!q) return true;
      const lMatch = (c.label && c.label.toLowerCase().includes(q)) || (c.labelAr && c.labelAr.includes(q)) || (c.labelFr && c.labelFr.toLowerCase().includes(q));
      const dMatch = (c.desc && c.desc.toLowerCase().includes(q)) || (c.descAr && c.descAr.includes(q));
      return lMatch || dMatch;
    }).slice(0, 4);

    // Render Command Palette DOM
    dropdown.innerHTML = `
      <!-- CATEGORY TABS -->
      <div class="smart-palette-tabs">
        <button type="button" class="palette-tab-btn ${activeTab === 'ai' ? 'active' : ''}" data-tab="ai">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
          </svg>
          <span>${i18n.tabAi}</span>
        </button>

        <button type="button" class="palette-tab-btn ${activeTab === 'experts' ? 'active' : ''}" data-tab="experts">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>${i18n.tabExperts}</span>
        </button>

        <button type="button" class="palette-tab-btn ${activeTab === 'specialties' ? 'active' : ''}" data-tab="specialties">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
          <span>${i18n.tabSpecialties}</span>
        </button>

        <button type="button" class="palette-tab-btn ${activeTab === 'wilayas' ? 'active' : ''}" data-tab="wilayas">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>${i18n.tabWilayas}</span>
        </button>
      </div>

      <!-- RESULTS BODY -->
      <div class="smart-palette-results">

        <!-- 1. ALWAYS PRESENT TOP AI ACTION PROMPT -->
        <div class="ai-suggest" id="ai-suggest-top-btn" style="cursor:pointer; font-weight:bold; color:#059669;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
            </svg>
            <span>${i18n.askAiPrefix} "${rawQuery}"</span>
          </div>
          <span style="background: rgba(5, 150, 105, 0.15); color: #059669; font-size: 0.76rem; font-weight: 800; padding: 3px 8px; border-radius: 9999px;">${i18n.aiActionBadge}</span>
        </div>

        <!-- 2. SEGMENTED EXPERTS -->
        ${(activeTab === 'ai' || activeTab === 'experts') && matchingTalents.length > 0 ? `
          <div class="smart-search-group">
            <div class="smart-group-title">${i18n.talentsHeading}</div>
            <div class="smart-group-items">
              ${matchingTalents.map(p => {
                const pName = lang === 'ar' ? (p.nameAr || p.name) : (lang === 'fr' ? p.nameFr : p.name);
                const pTitle = lang === 'ar' ? (p.titleAr || p.title) : (lang === 'fr' ? p.titleFr : p.title);
                const tierClass = p.tier || 'gold';
                return `
                  <div class="smart-talent-item" data-id="${p.id}" tabindex="0">
                    <img class="smart-talent-avatar" src="${p.avatar}" alt="${p.name}" />
                    <div class="smart-talent-info">
                      <span class="smart-talent-name">${pName}</span>
                      <span class="smart-talent-title">${pTitle}</span>
                    </div>
                    <span class="tier-badge tier-${tierClass}" style="padding: 3px 8px; font-size: 0.72rem;">
                      ${p.tierLabel || (lang === 'ar' ? 'معتمد' : 'Verified')}
                    </span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 3. SEGMENTED SPECIALTIES -->
        ${(activeTab === 'ai' || activeTab === 'specialties') && matchingSpecialties.length > 0 ? `
          <div class="smart-search-group">
            <div class="smart-group-title">${i18n.specialtiesHeading}</div>
            <div class="smart-group-items">
              ${matchingSpecialties.map(c => {
                const cLabel = lang === 'ar' ? (c.labelAr || c.label) : (lang === 'fr' ? (c.labelFr || c.label) : c.label);
                const cDesc = lang === 'ar' ? (c.descAr || c.desc) : (lang === 'fr' ? (c.descFr || c.desc) : c.desc);
                return `
                  <div class="smart-specialty-item" data-cat="${c.id}" tabindex="0" style="display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 12px; cursor: pointer; transition: background 0.2s ease;">
                    <div style="width: 32px; height: 32px; border-radius: 8px; background: #E6F4EF; color: #00875A; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                    </div>
                    <div style="flex: 1;">
                      <span style="font-weight: 700; font-size: 0.92rem; color: #0F172A; display: block;">${cLabel}</span>
                      <span style="font-size: 0.76rem; color: #64748B;">${cDesc}</span>
                    </div>
                    <span style="font-size: 0.76rem; font-weight: 700; color: #00875A;">${i18n.enterWilaya}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 4. SEGMENTED WILAYAS -->
        ${(activeTab === 'ai' || activeTab === 'wilayas') && matchingWilayas.length > 0 ? `
          <div class="smart-search-group">
            <div class="smart-group-title">${i18n.wilayasHeading}</div>
            <div class="smart-group-items">
              ${matchingWilayas.map(w => {
                const wName = lang === 'ar' ? (w.nameAr || w.name) : (lang === 'en' ? (w.nameEn || w.name) : (w.nameFr || w.name));
                const wSec = (lang !== 'ar' && w.nameAr) ? w.nameAr : (w.nameEn || w.name);
                return `
                  <div class="smart-wilaya-item" data-code="${w.code}" tabindex="0">
                    <div class="smart-wilaya-code">${w.code}</div>
                    <div class="smart-wilaya-info">
                      <span class="smart-wilaya-name">${wName}</span>
                      <span class="smart-wilaya-sub">${wSec}</span>
                    </div>
                    <span class="smart-item-action-hint">${i18n.enterWilaya}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

      </div>
    `;

    dropdown.style.display = 'block';

    // ── Wire Tab Click Handlers ──
    dropdown.querySelectorAll('.palette-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        activeTab = btn.getAttribute('data-tab');
        renderPalette(inputEl.value);
      });
    });

    // ── Wire AI Suggestion Click ──
    const aiBtn = dropdown.querySelector('#ai-suggest-top-btn');
    if (aiBtn) {
      aiBtn.addEventListener('click', () => {
        const text = inputEl.value.trim() || rawQuery;
        closeDropdown();
        openAIChat({ initialQuery: text });
      });
    }

    // ── Wire Wilaya Clicks ──
    dropdown.querySelectorAll('.smart-wilaya-item').forEach(item => {
      item.addEventListener('click', () => {
        const code = item.dataset.code;
        const target = WILAYAS.find(w => w.code === code);
        if (target) {
          closeDropdown();
          store.setState({ selectedWilaya: target });
          navigate(`#/wilaya/${code}`);
        }
      });
    });

    // ── Wire Talent Clicks ──
    dropdown.querySelectorAll('.smart-talent-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        const target = cachedProfiles.find(p => String(p.id) === String(id));
        if (target) {
          closeDropdown();
          openMindMap(target);
        }
      });
    });

    // ── Wire Specialty Clicks ──
    dropdown.querySelectorAll('.smart-specialty-item').forEach(item => {
      item.addEventListener('click', () => {
        const cat = item.dataset.cat;
        closeDropdown();
        navigate(`/#/wilaya/16?domain=${cat}`);
      });
    });
  }

  // ── Input & Form Event Listeners ──

  inputEl.addEventListener('input', (e) => {
    renderPalette(e.target.value);
  });

  inputEl.addEventListener('focus', () => {
    renderPalette(inputEl.value);
  });

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = inputEl.value.trim();
    if (!query) return;

    closeDropdown();
    openAIChat({ initialQuery: query });
  });

  // Keyboard navigation inside dropdown
  inputEl.addEventListener('keydown', (e) => {
    if (dropdown.style.display === 'none') return;

    const items = dropdown.querySelectorAll('.ai-suggest, .smart-wilaya-item, .smart-talent-item, .smart-specialty-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      items.forEach((it, idx) => it.classList.toggle('is-focused', idx === activeIndex));
      items[activeIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      items.forEach((it, idx) => it.classList.toggle('is-focused', idx === activeIndex));
      items[activeIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      items[activeIndex].click();
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!formEl.contains(e.target)) {
      closeDropdown();
    }
  });
}
