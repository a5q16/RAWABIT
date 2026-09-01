/**
 * Rawabit v2 — AI-First Categorized Command Palette & Smart Search Engine
 * Features:
 * 1. Categorized Filter Tabs (Ask AI, Experts, Specialties, Wilayas)
 * 2. Scope Switcher Bar inside Dropdown ("This Section" vs "All Site")
 * 3. Floating Glassmorphism Dropdown with absolute z-index: 9999
 * 4. Pinned Top AI Action Prompt with Instant SSE Chat Drawer Integration
 * 5. Segmented Result Headers for Clean UX
 * 6. 100% Strict Dynamic Localization (RTL / LTR)
 * Strictly Vanilla JS · 60FPS Reactive
 */

import { WILAYAS } from './map-paths.js';
import { openWilayaIntermediateScreen } from './wilaya-modal.js';
import { openAIChat } from './chat.js';
import { openMindMap, getProfileSources } from './mindmap.js';
import { getProfilesByWilaya, getAllCategories, searchGlobalProfiles } from '../data/profiles-data.js';
import { store } from '../store.js';
import { t } from '../i18n.js';
import { navigate } from '../router.js';

let activeDropdown = null;
let cachedProfiles = [];
const searchResultsCache = new Map();
const allCategories = getAllCategories();

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Pre-warm profiles cache for fast instant matching across key hubs
Promise.all([
  getProfilesByWilaya(16),
  getProfilesByWilaya(10),
  getProfilesByWilaya(31),
  getProfilesByWilaya(25)
]).then(resArrays => {
  const merged = [];
  resArrays.forEach(arr => {
    if (Array.isArray(arr)) merged.push(...arr);
  });
  cachedProfiles = merged;
}).catch(() => {});

/**
 * Initialize Categorized Command Palette on a given form and input
 * @param {HTMLFormElement} formEl 
 * @param {HTMLInputElement} inputEl 
 * @param {Object} options - Configuration options (wilayaCode, defaultScope, showScopeToggle, onScopeChange, onSearchInput)
 */
export function initSmartSearch(formEl, inputEl, options = {}) {
  if (!formEl || !inputEl) return null;

  const {
    wilayaCode = null,
    defaultScope = wilayaCode ? 'local' : 'global',
    showScopeToggle = Boolean(wilayaCode),
    onScopeChange = null,
    onSearchInput = null
  } = options;

  let currentScope = defaultScope; // 'local' | 'global'
  let activeIndex = -1;
  let activeTab = 'ai'; // 'ai', 'experts', 'specialties', 'wilayas'

  // Remove existing dropdown if re-initializing on same form
  const existingDropdown = formEl.querySelector('.smart-search-dropdown');
  if (existingDropdown) {
    existingDropdown.remove();
  }

  // Create floating glassmorphism dropdown container with high z-index
  const dropdown = document.createElement('div');
  dropdown.className = 'smart-search-dropdown';
  dropdown.id = `smart-search-dropdown-${Math.random().toString(36).substr(2, 6)}`;
  dropdown.style.display = 'none';
  dropdown.style.position = 'absolute';
  dropdown.style.zIndex = '9999';
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
        scopeLabel: 'نطاق البحث:',
        scopeSection: 'هذا القسم',
        scopeAllSite: 'كامل المنصة',
        tabAi: 'اسأل الذكاء الاصطناعي',
        tabExperts: 'الخبراء والكفاءات',
        tabSpecialties: 'التخصصات والمجالات',
        tabWilayas: 'الولايات',
        askAiPrefix: 'اسأل المساعد الذكي عن:',
        aiActionBadge: 'محادثة ذكية ↵',
        aiSubDesc: 'توليد إجابات دقيقة وموثقة من السجل الوطني للكفاءات',
        wilayasHeading: 'الولايات المعتمدة',
        talentsHeading: currentScope === 'local' && wilayaCode ? 'كفاءات هذا القسم' : 'الكفاءات والخبراء المعتمدون',
        specialtiesHeading: 'التخصصات والمجالات الدقيقة',
        enterWilaya: 'استعراض ↵',
        emptyResults: 'لم يتم العثور على نتائج مباشرة، اضغط على اسأل الذكاء الاصطناعي للحصول على تحليل مخصص.'
      };
    } else if (lang === 'fr') {
      return {
        scopeLabel: 'Portée du filtre :',
        scopeSection: 'Cette Section',
        scopeAllSite: 'Tout le Site',
        tabAi: 'Demander à l’IA',
        tabExperts: 'Experts & Talents',
        tabSpecialties: 'Spécialités & Domaines',
        tabWilayas: 'Wilayas',
        askAiPrefix: 'Demander à l’IA :',
        aiActionBadge: 'Chat IA ↵',
        aiSubDesc: 'Générer des réponses vérifiées du registre souverain',
        wilayasHeading: 'Wilayas Enregistrées',
        talentsHeading: currentScope === 'local' && wilayaCode ? 'Compétences de cette Section' : 'Experts Vérifiés',
        specialtiesHeading: 'Domaines & Spécialités',
        enterWilaya: 'Explorer ↵',
        emptyResults: 'Aucun résultat direct. Cliquez sur Demander à l’IA pour une recherche étendue.'
      };
    } else {
      return {
        scopeLabel: 'Search Scope:',
        scopeSection: 'This Section',
        scopeAllSite: 'All Site',
        tabAi: 'Ask AI',
        tabExperts: 'Experts & Talents',
        tabSpecialties: 'Specialties',
        tabWilayas: 'Wilayas',
        askAiPrefix: 'Ask AI about:',
        aiActionBadge: 'AI Chat ↵',
        aiSubDesc: 'Generate verified responses from national database',
        wilayasHeading: 'Matching Wilayas',
        talentsHeading: currentScope === 'local' && wilayaCode ? 'Talents in this Section' : 'Verified Experts',
        specialtiesHeading: 'Specialized Domains',
        enterWilaya: 'Explore ↵',
        emptyResults: 'No direct records found. Click Ask AI for dynamic intelligence search.'
      };
    }
  }

  let debounceTimer = null;

  async function performLiveSearch(query) {
    if (!query || !query.trim()) return;
    const q = query.trim();

    const cacheKey = `${currentScope}:${wilayaCode || 'all'}:${q}`;
    if (searchResultsCache.has(cacheKey)) {
      const cached = searchResultsCache.get(cacheKey);
      updateTalentsList(cached, q);
      return;
    }

    try {
      let results = [];
      if (currentScope === 'local' && wilayaCode) {
        const localProfiles = await getProfilesByWilaya(wilayaCode);
        const lq = q.toLowerCase();
        results = (localProfiles || []).filter(p => {
          const nMatch = (p.name && p.name.toLowerCase().includes(lq)) || (p.nameAr && p.nameAr.includes(lq));
          const tMatch = (p.title && p.title.toLowerCase().includes(lq)) || (p.titleAr && p.titleAr.includes(lq));
          const bMatch = p.bio && p.bio.toLowerCase().includes(lq);
          const tgMatch = p.tags && p.tags.some(tg => tg.toLowerCase().includes(lq));
          return nMatch || tMatch || bMatch || tgMatch;
        });
      } else {
        results = await searchGlobalProfiles(q);
      }

      if (Array.isArray(results) && results.length > 0) {
        searchResultsCache.set(cacheKey, results);
        results.forEach(r => {
          if (!cachedProfiles.some(cp => String(cp.id) === String(r.id))) {
            cachedProfiles.push(r);
          }
        });
        updateTalentsList(results, q);
      }
    } catch (err) {
      console.warn('[SmartSearch] Async search error:', err);
    }
  }

  function updateTalentsList(results, query) {
    if (!dropdown || dropdown.style.display === 'none') return;
    if (inputEl.value.trim() !== query.trim()) return;
    renderPalette(query, results);
  }

  function renderPalette(query = '', asyncTalents = null) {
    const lang = store.state.lang;
    const isRtl = lang === 'ar';
    dropdown.setAttribute('dir', isRtl ? 'rtl' : 'ltr');

    const i18n = getLocalizedText();
    const q = query.trim().toLowerCase();
    const rawQuery = query.trim() || (lang === 'ar' ? 'الكفاءات الجزائرية' : (lang === 'fr' ? 'Compétences algériennes' : 'Algerian competencies'));
    const safeDisplayQuery = escapeHtml(rawQuery);

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
    let combinedTalents = Array.isArray(asyncTalents) ? [...asyncTalents] : [];
    
    // Search in-memory cached profiles
    const localMatches = cachedProfiles.filter(p => {
      if (currentScope === 'local' && wilayaCode) {
        const pCode = String(p.wilayaCode || p.wilaya_id || '').padStart(2, '0');
        const targetCode = String(wilayaCode).padStart(2, '0');
        if (pCode !== targetCode) return false;
      }
      if (!q) return true;
      const nMatch = (p.name && p.name.toLowerCase().includes(q)) || (p.nameAr && p.nameAr.includes(q));
      const tMatch = (p.title && p.title.toLowerCase().includes(q)) || (p.titleAr && p.titleAr.includes(q));
      const bMatch = p.bio && p.bio.toLowerCase().includes(q);
      const tgMatch = p.tags && p.tags.some(tg => tg.toLowerCase().includes(q));
      return nMatch || tMatch || bMatch || tgMatch;
    });

    localMatches.forEach(lp => {
      if (!combinedTalents.some(ct => String(ct.id) === String(lp.id))) {
        combinedTalents.push(lp);
      }
    });

    const matchingTalents = combinedTalents.slice(0, 6);

    // 3. Filter matching Specialties / Domains
    const matchingSpecialties = allCategories.filter(c => {
      if (!q) return true;
      const lMatch = (c.label && c.label.toLowerCase().includes(q)) || (c.labelAr && c.labelAr.includes(q)) || (c.labelFr && c.labelFr.toLowerCase().includes(q));
      const dMatch = (c.desc && c.desc.toLowerCase().includes(q)) || (c.descAr && c.descAr.includes(q));
      return lMatch || dMatch;
    }).slice(0, 4);

    // Render Command Palette DOM with Scope Bar inside header
    dropdown.innerHTML = `
      <!-- 0. SEARCH SCOPE TOGGLE BAR (INSIDE DROPDOWN) -->
      ${showScopeToggle || wilayaCode ? `
        <div class="smart-scope-bar">
          <div class="smart-scope-label">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>${i18n.scopeLabel}</span>
          </div>
          <div class="smart-scope-tabs" role="tablist">
            <button type="button" class="smart-scope-tab-btn ${currentScope === 'local' ? 'active' : ''}" data-scope="local">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>${i18n.scopeSection}</span>
            </button>
            <button type="button" class="smart-scope-tab-btn ${currentScope === 'global' ? 'active' : ''}" data-scope="global">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <span>${i18n.scopeAllSite}</span>
            </button>
          </div>
        </div>
      ` : ''}

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
            <span>${i18n.askAiPrefix} "${safeDisplayQuery}"</span>
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
                const pWilaya = p.wilayaCode || p.wilaya_id || '16';
                const sources = getProfileSources(p);
                return `
                  <div class="smart-talent-item" data-id="${p.id}" tabindex="0" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 14px; border-radius: 12px; cursor: pointer;">
                    <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
                      <img class="smart-talent-avatar" src="${p.avatar}" alt="${p.name}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; flex-shrink: 0;" />
                      <div class="smart-talent-info" style="min-width: 0;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                          <span class="smart-talent-name" style="font-weight: 700; color: #0F172A; font-size: 0.95rem;">${pName}</span>
                          <span style="font-size: 0.72rem; color: #059669; background: rgba(5, 150, 105, 0.1); padding: 1px 6px; border-radius: 6px; font-weight: 600;">Wilaya ${pWilaya}</span>
                        </div>
                        <span class="smart-talent-title" style="font-size: 0.78rem; color: #64748B; display: block; line-height: 1.35; word-break: break-word; overflow-wrap: anywhere; white-space: normal;">${pTitle}</span>
                      </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                      ${sources.slice(0, 3).map(s => `
                        <span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 4px; background: #F1F5F9; color: #475569;" title="${s.label}">
                          ${s.icon}
                        </span>
                      `).join('')}
                    </div>
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

    // ── Wire Scope Switcher inside Dropdown ──
    dropdown.querySelectorAll('.smart-scope-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const newScope = btn.getAttribute('data-scope');
        currentScope = newScope;
        if (typeof onScopeChange === 'function') {
          onScopeChange(newScope);
        }
        renderPalette(inputEl.value);
        if (inputEl.value && inputEl.value.trim().length >= 2) {
          performLiveSearch(inputEl.value);
        }
      });
    });

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
        openAIChat({ initialQuery: text, wilayaCode: wilayaCode || undefined, activeWilayaId: wilayaCode ? Number(wilayaCode) : undefined });
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
        const target = combinedTalents.find(p => String(p.id) === String(id)) || cachedProfiles.find(p => String(p.id) === String(id));
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
        navigate(`#/wilaya/${wilayaCode || '16'}?domain=${cat}`);
      });
    });
  }

  // ── Input & Form Event Listeners ──

  inputEl.addEventListener('input', (e) => {
    const val = e.target.value;
    renderPalette(val);

    if (typeof onSearchInput === 'function') {
      onSearchInput(val, currentScope);
    }

    clearTimeout(debounceTimer);
    if (val && val.trim().length >= 2) {
      debounceTimer = setTimeout(() => {
        performLiveSearch(val);
      }, 120);
    }
  });

  inputEl.addEventListener('focus', () => {
    renderPalette(inputEl.value);
    if (inputEl.value && inputEl.value.trim().length >= 2) {
      performLiveSearch(inputEl.value);
    }
  });

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = inputEl.value.trim();
    if (!query) return;

    closeDropdown();
    openAIChat({ initialQuery: query, wilayaCode: wilayaCode || undefined, activeWilayaId: wilayaCode ? Number(wilayaCode) : undefined });
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

  return {
    getScope: () => currentScope,
    setScope: (s) => {
      currentScope = s;
      renderPalette(inputEl.value);
    },
    close: closeDropdown,
    refresh: () => renderPalette(inputEl.value)
  };
}
