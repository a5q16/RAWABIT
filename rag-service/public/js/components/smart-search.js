/**
 * Rawabit v2 — True Smart Search Engine & Intelligent Floating Dropdown
 * 1. Pinned Top AI Action Prompt ("✨ Ask AI about: [query]") -> Directly streams Groq AI
 * 2. Instant Matching Wilayas -> Opens Cinematic Wilaya Intermediate Screen
 * 3. Verified Talents & Domains -> Opens Mind-Map Experience
 * Strictly Vanilla JS · 60FPS Reactive
 */

import { WILAYAS } from './map-paths.js';
import { openWilayaIntermediateScreen } from './wilaya-modal.js';
import { openAIChat } from './chat.js';
import { openMindMap } from './mindmap.js';
import { getProfilesByWilaya, generateLuxuryAvatar } from '../data/profiles-data.js';
import { store } from '../store.js';
import { t } from '../i18n.js';

let activeDropdown = null;
let cachedProfiles = [];

// Pre-warm profiles cache for fast instant matching
getProfilesByWilaya(16).then(res => {
  if (Array.isArray(res)) cachedProfiles = res;
}).catch(() => {});

/**
 * Initialize Smart Search on a given form and input
 * @param {HTMLFormElement} formEl 
 * @param {HTMLInputElement} inputEl 
 */
export function initSmartSearch(formEl, inputEl) {
  if (!formEl || !inputEl) return;

  let activeIndex = -1;

  // Create floating dropdown container
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

  function renderResults(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      closeDropdown();
      return;
    }

    const lang = store.state.lang;

    // 1. Matching Wilayas (up to 4)
    const matchingWilayas = WILAYAS.filter(w => {
      const codeMatch = w.code.includes(q) || String(Number(w.code)) === q;
      const nameMatch = w.name && w.name.toLowerCase().includes(q);
      const nameArMatch = w.nameAr && w.nameAr.includes(q);
      const nameEnMatch = w.nameEn && w.nameEn.toLowerCase().includes(q);
      const nameFrMatch = w.nameFr && w.nameFr.toLowerCase().includes(q);
      return codeMatch || nameMatch || nameArMatch || nameEnMatch || nameFrMatch;
    }).slice(0, 4);

    // 2. Matching Talents (up to 3)
    const matchingTalents = cachedProfiles.filter(p => {
      const nMatch = (p.name && p.name.toLowerCase().includes(q)) || (p.nameAr && p.nameAr.includes(q));
      const tMatch = (p.title && p.title.toLowerCase().includes(q)) || (p.titleAr && p.titleAr.includes(q));
      const tgMatch = p.tags && p.tags.some(tg => tg.toLowerCase().includes(q));
      return nMatch || tMatch || tgMatch;
    }).slice(0, 3);

    dropdown.innerHTML = `
      <!-- 1. TOP PINNED AI STREAM ACTION -->
      <div class="smart-search-ai-item" id="smart-search-ai-btn" tabindex="0">
        <div class="smart-ai-icon-badge">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
          </svg>
        </div>
        <div class="smart-ai-text">
          <div class="smart-ai-title-line">
            <span>${t('search.askAiPrefix')}</span>
            <span class="smart-ai-query-tag">"${query.trim()}"</span>
          </div>
          <p class="smart-ai-sub-desc">${t('search.aiSuggestionSub')}</p>
        </div>
        <span class="smart-ai-chip">AI Stream →</span>
      </div>

      <!-- 2. MATCHING WILAYAS -->
      ${matchingWilayas.length > 0 ? `
        <div class="smart-search-group">
          <div class="smart-group-title" data-i18n="search.wilayasHeading">${t('search.wilayasHeading')}</div>
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
                  <span class="smart-item-action-hint">${t('map.enterWilaya')}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- 3. MATCHING TALENTS & EXPERTS -->
      ${matchingTalents.length > 0 ? `
        <div class="smart-search-group">
          <div class="smart-group-title" data-i18n="search.talentsHeading">${t('search.talentsHeading')}</div>
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
                    ${p.tierLabel || 'Verified'}
                  </span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
    `;

    dropdown.style.display = 'block';

    // ── Wire Click Handlers ──

    // 1. AI Button Click -> Open AI Drawer with query prefilled and auto-sent
    const aiBtn = dropdown.querySelector('#smart-search-ai-btn');
    if (aiBtn) {
      aiBtn.addEventListener('click', () => {
        const text = inputEl.value.trim();
        closeDropdown();
        openAIChat({ initialQuery: text });
      });
    }

    // 2. Wilaya Clicks -> Trigger In-Place SVG Expansion on Map or Route
    dropdown.querySelectorAll('.smart-wilaya-item').forEach(item => {
      item.addEventListener('click', () => {
        const code = item.dataset.code;
        const target = WILAYAS.find(w => w.code === code);
        if (target) {
          closeDropdown();
          const mapStateEl = document.querySelector(`.wilaya-group[data-code="${code}"] .wilaya-path`);
          if (mapStateEl) {
            const mapContainer = document.querySelector('#map-container');
            if (mapContainer) {
              mapContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            setTimeout(() => {
              mapStateEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            }, 350);
          } else {
            store.setState({ selectedWilaya: target });
            navigate(`#/wilaya/${code}`);
          }
        }
      });
    });

    // 3. Talent Clicks -> Open Mind-Map
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
  }

  // ── Input & Form Event Listeners ──

  inputEl.addEventListener('input', (e) => {
    renderResults(e.target.value);
  });

  inputEl.addEventListener('focus', () => {
    if (inputEl.value.trim().length > 0) {
      renderResults(inputEl.value);
    }
  });

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = inputEl.value.trim();
    if (!query) return;

    // By default, submitting the hero search bar triggers the AI Assistant with that query!
    closeDropdown();
    openAIChat({ initialQuery: query });
  });

  // Keyboard navigation inside dropdown
  inputEl.addEventListener('keydown', (e) => {
    if (dropdown.style.display === 'none') return;

    const items = dropdown.querySelectorAll('.smart-search-ai-item, .smart-wilaya-item, .smart-talent-item');
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
