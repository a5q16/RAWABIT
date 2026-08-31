/**
 * Rawabit v2 — Personalized Learning Roadmap Component
 * Glassmorphism Onboarding Modal · LocalStorage Synchronization · Instant AI Chat Integration
 * Pure Vanilla JS · Zero External Frameworks
 */

import { t } from '../i18n.js';
import { store, pushOverlay, popOverlay, isOverlayActive } from '../store.js';
import { openAIChat } from './chat.js';

const STORAGE_KEY = 'userRoadmapData';

let activeRoadmapModal = null;
let activeKeyHandler = null;

/**
 * Retrieves the saved roadmap profile from localStorage
 * @returns {{ university: string, field: string } | null}
 */
export function getSavedRoadmapData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.university && parsed.field) {
      return parsed;
    }
  } catch (e) {
    console.warn('[Rawabit Roadmap] Error reading localStorage:', e);
  }
  return null;
}

/**
 * Saves roadmap data to localStorage
 * @param {string} university 
 * @param {string} field 
 */
export function saveRoadmapData(university, field) {
  try {
    const payload = {
      university: university.trim(),
      field: field.trim(),
      updatedAt: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('[Rawabit Roadmap] Error saving to localStorage:', e);
  }
}

/**
 * Generates the standardized prompt and triggers the AI Chat drawer
 * @param {string} university 
 * @param {string} field 
 */
export function triggerRoadmapGeneration(university, field) {
  const u = university.trim();
  const f = field.trim();
  if (!u || !f) return;

  // Construct prompt
  const prompt = `Generate a 3-step learning roadmap for a student at ${u} targeting ${f}. Base the recommendations on the Algerian academic system and practical industry skills. Use Markdown timelines.`;

  // Open the AI Chat drawer and automatically stream the response
  openAIChat({ initialQuery: prompt });
}

/**
 * Main Roadmap entrypoint flow
 * If data exists in localStorage -> directly trigger AI chat
 * If data is missing -> show the Glassmorphism Onboarding Modal
 */
export function startRoadmapFlow() {
  const savedData = getSavedRoadmapData();

  if (savedData && savedData.university && savedData.field) {
    triggerRoadmapGeneration(savedData.university, savedData.field);
  } else {
    openRoadmapModal();
  }
}

/**
 * Open the Glassmorphism Onboarding Modal
 */
export function openRoadmapModal() {
  closeRoadmapModal(false);

  pushOverlay('roadmap-modal');
  if (typeof document !== 'undefined') {
    document.body.classList.add('modal-open');
  }

  const overlay = document.createElement('div');
  overlay.className = 'roadmap-modal-overlay animate-fade-in';
  overlay.id = 'roadmap-modal-overlay';
  activeRoadmapModal = overlay;

  const savedData = getSavedRoadmapData() || { university: '', field: '' };

  overlay.innerHTML = `
    <div class="roadmap-modal-backdrop" id="roadmap-modal-backdrop"></div>

    <div class="roadmap-modal-dialog animate-scale-in" role="dialog" aria-modal="true" aria-labelledby="roadmap-title">
      
      <!-- Close Button -->
      <button class="roadmap-modal-close-btn" id="roadmap-modal-close" aria-label="Close">
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <!-- Header with Glowing Emblem -->
      <div class="roadmap-header">
        <div class="roadmap-icon-badge">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            <polyline points="10 6 14 10 10 14"></polyline>
          </svg>
        </div>

        <div class="roadmap-badge-pill" data-i18n="roadmap.badge">
          ${t('roadmap.badge')}
        </div>

        <h2 class="roadmap-title" id="roadmap-title" data-i18n="roadmap.modalTitle">
          ${t('roadmap.modalTitle')}
        </h2>
        
        <p class="roadmap-subtitle" data-i18n="roadmap.modalSubtitle">
          ${t('roadmap.modalSubtitle')}
        </p>
      </div>

      <!-- Interactive 2-Step Form -->
      <form class="roadmap-form" id="roadmap-onboarding-form" onsubmit="event.preventDefault();">
        
        <!-- Field 1: Current University / Level -->
        <div class="roadmap-form-group">
          <label class="roadmap-label" for="roadmap-university">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
              <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
            </svg>
            <span data-i18n="roadmap.inputUniversityLabel">${t('roadmap.inputUniversityLabel')}</span>
          </label>
          
          <input 
            type="text" 
            class="roadmap-input" 
            id="roadmap-university" 
            required
            autocomplete="off"
            value="${escapeHtml(savedData.university)}"
            placeholder="${t('roadmap.inputUniversityPlaceholder')}"
            data-i18n-placeholder="roadmap.inputUniversityPlaceholder"
          />

          <!-- Quick Suggestion Chips -->
          <div class="roadmap-chips-row">
            <button type="button" class="roadmap-chip" data-fill-target="roadmap-university" data-fill-val="جامعة باب الزوار (USTHB) - سنة ثانية L2">
              ${t('roadmap.chipUSTHB')}
            </button>
            <button type="button" class="roadmap-chip" data-fill-target="roadmap-university" data-fill-val="المدرسة الوطنية العليا للإعلام الآلي (ESI الجزائر) - ماستر">
              ${t('roadmap.chipESI')}
            </button>
          </div>
        </div>

        <!-- Field 2: Target Field / Role -->
        <div class="roadmap-form-group">
          <label class="roadmap-label" for="roadmap-field">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
            </svg>
            <span data-i18n="roadmap.inputFieldLabel">${t('roadmap.inputFieldLabel')}</span>
          </label>
          
          <input 
            type="text" 
            class="roadmap-input" 
            id="roadmap-field" 
            required
            autocomplete="off"
            value="${escapeHtml(savedData.field)}"
            placeholder="${t('roadmap.inputFieldPlaceholder')}"
            data-i18n-placeholder="roadmap.inputFieldPlaceholder"
          />

          <!-- Quick Suggestion Chips -->
          <div class="roadmap-chips-row">
            <button type="button" class="roadmap-chip" data-fill-target="roadmap-field" data-fill-val="الذكاء الاصطناعي وهندسة البيانات (AI & Data Science)">
              ${t('roadmap.chipAI')}
            </button>
            <button type="button" class="roadmap-chip" data-fill-target="roadmap-field" data-fill-val="الأمن السيبراني والدفاع الرقمي (Cybersecurity)">
              ${t('roadmap.chipCyber')}
            </button>
            <button type="button" class="roadmap-chip" data-fill-target="roadmap-field" data-fill-val="هندسة السحاب والأنظمة الموزعة (Cloud Architecture)">
              ${t('roadmap.chipCloud')}
            </button>
          </div>
        </div>

        <!-- Submit Button -->
        <button type="submit" class="btn-primary roadmap-submit-btn" id="btn-generate-roadmap">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
          </svg>
          <span data-i18n="roadmap.submitBtn">${t('roadmap.submitBtn')}</span>
        </button>

      </form>

    </div>
  `;

  document.body.appendChild(overlay);

  // Wire Form Submission
  const form = overlay.querySelector('#roadmap-onboarding-form');
  const uInput = overlay.querySelector('#roadmap-university');
  const fInput = overlay.querySelector('#roadmap-field');

  if (form && uInput && fInput) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const uVal = uInput.value.trim();
      const fVal = fInput.value.trim();

      if (!uVal || !fVal) {
        if (!uVal) uInput.focus();
        else fInput.focus();
        return;
      }

      // Save to localStorage
      saveRoadmapData(uVal, fVal);

      // Close modal smoothly
      closeRoadmapModal(true);

      // Trigger AI Chat generation
      setTimeout(() => {
        triggerRoadmapGeneration(uVal, fVal);
      }, 250);
    });
  }

  // Wire Quick Suggestion Chips
  overlay.querySelectorAll('.roadmap-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = chip.getAttribute('data-fill-target');
      const fillVal = chip.getAttribute('data-fill-val');
      const inputEl = overlay.querySelector(`#${targetId}`);
      if (inputEl && fillVal) {
        inputEl.value = fillVal;
        inputEl.focus();
      }
    });
  });

  // Close handlers
  const closeBtn = overlay.querySelector('#roadmap-modal-close');
  const backdrop = overlay.querySelector('#roadmap-modal-backdrop');

  closeBtn?.addEventListener('click', () => closeRoadmapModal(true));
  backdrop?.addEventListener('click', () => closeRoadmapModal(true));

  if (activeKeyHandler) {
    document.removeEventListener('keydown', activeKeyHandler);
    activeKeyHandler = null;
  }

  activeKeyHandler = (e) => {
    if (e.key === 'Escape' && isOverlayActive('roadmap-modal')) {
      closeRoadmapModal(true);
    }
  };
  document.addEventListener('keydown', activeKeyHandler);

  // Auto focus first input
  setTimeout(() => {
    if (uInput && !uInput.value) {
      uInput.focus();
    } else if (fInput) {
      fInput.focus();
    }
  }, 200);
}

/**
 * Close the Roadmap modal
 * @param {boolean} animate 
 */
export function closeRoadmapModal(animate = true) {
  if (activeKeyHandler) {
    document.removeEventListener('keydown', activeKeyHandler);
    activeKeyHandler = null;
  }

  if (!activeRoadmapModal) return;

  const overlay = activeRoadmapModal;
  activeRoadmapModal = null;

  if (animate) {
    overlay.classList.add('is-closing');
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      popOverlay();
    }, 200);
  } else {
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    popOverlay();
  }
}

/**
 * Attaches global event listener for all Roadmap trigger elements
 */
export function initRoadmapListeners() {
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('#trigger-roadmap, #trigger-roadmap-mobile, #trigger-roadmap-footer, #trigger-roadmap-footer-inner, .trigger-roadmap');
    if (trigger) {
      e.preventDefault();
      startRoadmapFlow();
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
