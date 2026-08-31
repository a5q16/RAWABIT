/**
 * Rawabit v2 — Sovereign Full-Screen AI Workspace & Chatbot Interface
 * Luxury Gov-Tech Aesthetic · 2-Column Responsive Workspace · Real Groq/Supabase RAG Streaming
 */

import { t } from '../i18n.js';
import { store, pushOverlay, popOverlay, isOverlayActive } from '../store.js';

let drawerElement = null;
let backdropElement = null;
let currentContext = null;
let currentSessionKey = null; // Bound to profile.id / wilayaCode / 'global'
let activeMessages = []; // Isolated session messages
let isStreaming = false;

const USER_AVATAR_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
const AI_AVATAR_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>`;

/**
 * Resolves the AI API URL across Vite, Webpack, window.ENV, and defaults
 */
function getAiApiUrl() {
  return (
    (typeof window !== 'undefined' && window.ENV && (window.ENV.VITE_AI_API_URL || window.ENV.AI_API_URL)) ||
    (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_AI_API_URL || import.meta.env.AI_API_URL)) ||
    '/api/chat'
  );
}

/**
 * Safely format Markdown to sanitized HTML
 */
function formatMarkdown(text) {
  if (!text) return '';
  try {
    if (typeof marked !== 'undefined' && marked.parse) {
      const rawHtml = marked.parse(text, { breaks: true, gfm: true });
      if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
        return DOMPurify.sanitize(rawHtml);
      }
      return rawHtml;
    }
  } catch (e) {
    console.warn('[Rawabit AI] Markdown parse fallback:', e);
  }
  return escapeHtml(text).replace(/\n/g, '<br/>');
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

/**
 * Ensures the persistent Full-Screen AI Workspace DOM is created and attached
 */
function createChatDrawerDOM() {
  if (drawerElement && backdropElement) return;

  // 1. Backdrop
  backdropElement = document.createElement('div');
  backdropElement.className = 'ai-drawer-backdrop';
  backdropElement.id = 'ai-drawer-backdrop';

  // 2. Full-Screen Workspace Panel
  drawerElement = document.createElement('div');
  drawerElement.className = 'ai-drawer-panel';
  drawerElement.id = 'ai-drawer-panel';

  drawerElement.innerHTML = `
    <div class="ai-workspace-container">
      
      <!-- 1. Executive Sidebar -->
      <aside class="ai-sidebar" id="ai-workspace-sidebar">
        <div class="ai-sidebar-header">
          <div class="ai-brand-badge">
            <div class="ai-brand-icon">
              ${AI_AVATAR_SVG}
            </div>
            <div class="ai-brand-info">
              <span class="ai-brand-title">RAWABIT AI</span>
              <span class="ai-brand-badge-tag" id="sidebar-brand-tag">المنظومة السيادية</span>
            </div>
          </div>
        </div>

        <div class="ai-sidebar-body">
          <!-- Active Scope Context -->
          <div class="ai-sidebar-section">
            <div class="ai-section-title" id="sidebar-context-heading">نطاق الاستفسار النشط</div>
            <div class="ai-context-card" id="ai-sidebar-context-card">
              <div class="ctx-name" id="ctx-card-name">السجل الوطني العام</div>
              <div class="ctx-title" id="ctx-card-title">استعلام شامل عبر 58 ولاية وكافة التخصصات</div>
              <div class="ctx-meta">
                <span class="ctx-badge" id="ctx-card-badge">● متصل بقاعدة البيانات</span>
              </div>
            </div>
          </div>

          <!-- Scope Capabilities Navigation -->
          <div class="ai-sidebar-section">
            <div class="ai-section-title" id="sidebar-capabilities-heading">المجالات المتاحة</div>
            <div class="ai-capability-list">
              <button type="button" class="ai-cap-btn" data-prompt="توقع المسار المهني وأفضل التخصصات المطلوبة لسوق العمل في الجزائر">
                <span class="cap-icon">🎯</span>
                <span class="cap-text" id="cap-careers-text">التنبؤ بالمسار المهني</span>
              </button>
              <button type="button" class="ai-cap-btn" data-prompt="تحليل فجوات المهارات والشهادات المطلوبة للكفاءات الجزائرية">
                <span class="cap-icon">📊</span>
                <span class="cap-text" id="cap-gaps-text">تحليل فجوات المهارات</span>
              </button>
              <button type="button" class="ai-cap-btn" data-prompt="اقتراح خارطة طريق للتعلم والبحث العلمي والشهادات المعتمدة">
                <span class="cap-icon">🗺️</span>
                <span class="cap-text" id="cap-roadmap-text">خارطة طريق التعلم</span>
              </button>
              <button type="button" class="ai-cap-btn" data-prompt="استكشاف الكفاءات الموثقة والمراكز البحثية والجامعات الوطنية">
                <span class="cap-icon">🔍</span>
                <span class="cap-text" id="cap-registry-text">استكشاف سجل الكفاءات</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Sidebar Footer -->
        <div class="ai-sidebar-footer">
          <button type="button" class="ai-clear-session-btn" id="ai-clear-session-btn">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
            <span id="ai-clear-session-label">جلسة استفسار جديدة</span>
          </button>
          <div class="ai-engine-telemetry">
            <span class="ai-status-dot"></span>
            <span>Groq LPU RAG • Live Connected</span>
          </div>
        </div>
      </aside>

      <!-- 2. Main Conversation Canvas -->
      <main class="ai-chat-canvas">
        <!-- Top Navigation Bar -->
        <header class="ai-canvas-topbar">
          <div class="topbar-left">
            <button type="button" class="ai-sidebar-toggle" id="ai-sidebar-toggle" aria-label="Toggle Sidebar">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div class="topbar-heading-wrap">
              <h1 class="topbar-title" id="ai-topbar-heading">المساعد الذكي السيادي</h1>
              <span class="topbar-subtitle" id="ai-topbar-subheading">المنصة الوطنية للربط بين الكفاءات والخبرات الجزائرية</span>
            </div>
          </div>

          <div class="topbar-actions">
            <button type="button" class="ai-close-canvas-btn" id="ai-drawer-close-btn" aria-label="Close" title="إغلاق (Esc)">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              <span class="key-badge">ESC</span>
            </button>
          </div>
        </header>

        <!-- Messages Stream Area -->
        <div class="ai-chat-messages" id="ai-chat-messages"></div>

        <!-- Floating Command Center Composer -->
        <div class="ai-composer-wrap">
          <div class="ai-composer-container">
            <form class="ai-input-form" id="ai-chat-form" onsubmit="event.preventDefault();">
              <textarea 
                class="ai-chat-input" 
                id="ai-chat-input" 
                rows="1" 
                placeholder="اكتب استفسارك للمساعد الذكي..." 
                autocomplete="off"
              ></textarea>
              
              <div class="ai-composer-bottom">
                <div class="ai-composer-hints">
                  <span class="hint-pill" id="hint-enter-pill">Enter ↵ للإرسال</span>
                  <span class="hint-pill" id="hint-shift-pill">Shift + Enter للسطر الجديد</span>
                  <span class="hint-pill" id="ai-char-counter">0 / 2000</span>
                </div>
                <button type="submit" class="ai-send-btn" id="ai-send-btn" aria-label="Send">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                  <span id="ai-send-label">إرسال</span>
                </button>
              </div>
            </form>
          </div>
        </div>

      </main>

    </div>
  `;

  document.body.appendChild(backdropElement);
  document.body.appendChild(drawerElement);

  // Wire close triggers
  const closeBtn = drawerElement.querySelector('#ai-drawer-close-btn');
  closeBtn.addEventListener('click', closeAIChat);
  backdropElement.addEventListener('click', closeAIChat);

  // Mobile sidebar toggle
  const sidebarToggle = drawerElement.querySelector('#ai-sidebar-toggle');
  const sidebar = drawerElement.querySelector('#ai-workspace-sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
  }

  // Clear session button
  const clearBtn = drawerElement.querySelector('#ai-clear-session-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      activeMessages = [];
      const messagesContainer = drawerElement.querySelector('#ai-chat-messages');
      if (messagesContainer) messagesContainer.innerHTML = '';
      renderInitialGreeting(currentContext, store.state.lang);
    });
  }

  // Capability Navigation Buttons
  const capButtons = drawerElement.querySelectorAll('.ai-cap-btn');
  capButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.getAttribute('data-prompt');
      if (p && !isStreaming) {
        if (sidebar) sidebar.classList.remove('mobile-open');
        handleUserMessage(p);
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOverlayActive('ai-chat')) {
      closeAIChat();
    }
  });

  // Textarea auto-resize and keyboard shortcuts
  const input = drawerElement.querySelector('#ai-chat-input');
  const form = drawerElement.querySelector('#ai-chat-form');
  const charCounter = drawerElement.querySelector('#ai-char-counter');

  if (input) {
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      if (charCounter) {
        const len = input.value.length;
        charCounter.textContent = `${len} / 2000`;
        charCounter.style.color = len > 1900 ? '#EF4444' : '#64748B';
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const text = input.value.trim();
        if (!text || isStreaming) return;
        input.value = '';
        input.style.height = 'auto';
        if (charCounter) charCounter.textContent = '0 / 2000';
        handleUserMessage(text);
      }
    });
  }

  if (form && input) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text || isStreaming) return;
      input.value = '';
      input.style.height = 'auto';
      if (charCounter) charCounter.textContent = '0 / 2000';
      handleUserMessage(text);
    });
  }
}

/**
 * Open the Full-Screen AI Workspace with strict context isolation & RTL support
 * @param {Object} context - Optional metadata (profile, search query, or wilaya guidance)
 */
export function openAIChat(context = null) {
  createChatDrawerDOM();
  currentContext = context;

  const lang = store.state.lang || localStorage.getItem('rawabit_lang') || 'ar';
  const isRtl = lang === 'ar';
  drawerElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  updateWorkspaceTranslations(lang);

  // ── Strict Context Isolation ──
  const newSessionKey = context?.profile?.id 
    ? `profile-${context.profile.id}` 
    : (context?.wilayaCode ? `wilaya-${context.wilayaCode}` : 'global-session');

  const messagesContainer = drawerElement.querySelector('#ai-chat-messages');

  // If opening for a DIFFERENT profile or context, completely flush history!
  if (newSessionKey !== currentSessionKey) {
    currentSessionKey = newSessionKey;
    activeMessages = [];
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }
  }

  // Update Sidebar Context Card
  updateSidebarContextDisplay(context, lang);

  // Populate Initial Greeting if messages empty for this session
  if (messagesContainer && messagesContainer.children.length === 0) {
    renderInitialGreeting(context, lang);
  }

  pushOverlay('ai-chat');
  backdropElement.classList.add('active');
  drawerElement.classList.add('active');

  // Contextual Awareness: Fade out FAB when chat drawer is open
  const fab = document.querySelector('#global-ai-fab');
  if (fab) fab.classList.add('drawer-open');

  // If initialQuery is provided from smart search, auto-send it
  if (context && context.initialQuery) {
    const q = context.initialQuery.trim();
    if (q) {
      setTimeout(() => {
        handleUserMessage(q);
      }, 300);
    }
  }

  // Auto focus input
  const input = drawerElement.querySelector('#ai-chat-input');
  setTimeout(() => input?.focus(), 300);
}

/**
 * Close the Full-Screen AI Workspace smoothly
 */
export function closeAIChat() {
  if (!drawerElement || !backdropElement) return;

  drawerElement.classList.remove('active');
  backdropElement.classList.remove('active');
  popOverlay();

  // Fade FAB back in when drawer closes
  const fab = document.querySelector('#global-ai-fab');
  if (fab) fab.classList.remove('drawer-open');
}

let globalFabInstance = null;

/**
 * Creates and mounts the Global Floating AI Button (FAB)
 */
export function createGlobalAIFab() {
  if (globalFabInstance && document.body.contains(globalFabInstance)) return globalFabInstance;

  const lang = store.state.lang || localStorage.getItem('rawabit_lang') || 'ar';
  const fabLabel = lang === 'ar' ? 'المساعد الذكي' : (lang === 'fr' ? 'Assistant IA' : 'AI Assistant');

  const fab = document.createElement('button');
  fab.className = 'global-ai-fab animate-fade-in';
  fab.id = 'global-ai-fab';
  fab.setAttribute('aria-label', fabLabel);
  fab.setAttribute('title', fabLabel);

  fab.innerHTML = `
    <div class="fab-inner">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
      </svg>
      <span class="fab-label" id="fab-label-text">${fabLabel}</span>
    </div>
  `;

  fab.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isOverlayActive('ai-chat')) {
      closeAIChat();
    } else {
      openAIChat();
    }
  });

  document.body.appendChild(fab);
  globalFabInstance = fab;
  return fab;
}

/**
 * Update Sidebar Context Card display according to active context
 */
function updateSidebarContextDisplay(context, lang) {
  const nameEl = drawerElement.querySelector('#ctx-card-name');
  const titleEl = drawerElement.querySelector('#ctx-card-title');
  const badgeEl = drawerElement.querySelector('#ctx-card-badge');

  if (!nameEl || !titleEl || !badgeEl) return;

  if (context && context.profile) {
    const p = context.profile;
    const name = (lang === 'ar' && p.nameAr) ? p.nameAr : (lang === 'fr' && p.nameFr ? p.nameFr : p.name);
    const title = (lang === 'ar' && p.titleAr) ? p.titleAr : (lang === 'fr' && p.titleFr ? p.titleFr : p.title);
    
    nameEl.textContent = name;
    titleEl.textContent = title;
    badgeEl.textContent = lang === 'ar' ? `● ملف معتمد (ولاية ${p.wilayaCode || '16'})` : `● Verified Dossier (Wilaya ${p.wilayaCode || '16'})`;
    badgeEl.style.color = '#10B981';
  } else if (context && context.wilayaCode) {
    nameEl.textContent = lang === 'ar' ? `ولاية ${context.wilayaCode}` : `Wilaya ${context.wilayaCode}`;
    titleEl.textContent = lang === 'ar' ? 'استكشاف كفاءات ومشاريع الولاية' : 'Exploring provincial competencies & research centers';
    badgeEl.textContent = lang === 'ar' ? '● نطاق ولائي مخصص' : '● Provincial Scope';
    badgeEl.style.color = '#38BDF8';
  } else {
    nameEl.textContent = lang === 'ar' ? 'السجل الوطني العام' : 'National Sovereign Registry';
    titleEl.textContent = lang === 'ar' ? 'استعلام شامل عبر 58 ولاية وكافة التخصصات' : 'Comprehensive search across all 58 Wilayas and specialties';
    badgeEl.textContent = lang === 'ar' ? '● متصل بقاعدة البيانات' : '● Live Database Connected';
    badgeEl.style.color = '#34D399';
  }
}

/**
 * Format and update Workspace Translations according to active language
 */
function updateWorkspaceTranslations(lang) {
  const topbarHeading = drawerElement.querySelector('#ai-topbar-heading');
  const topbarSubheading = drawerElement.querySelector('#ai-topbar-subheading');
  const input = drawerElement.querySelector('#ai-chat-input');
  const sendLabel = drawerElement.querySelector('#ai-send-label');
  const clearLabel = drawerElement.querySelector('#ai-clear-session-label');
  const brandTag = drawerElement.querySelector('#sidebar-brand-tag');
  const contextHeading = drawerElement.querySelector('#sidebar-context-heading');
  const capHeading = drawerElement.querySelector('#sidebar-capabilities-heading');
  const capCareers = drawerElement.querySelector('#cap-careers-text');
  const capGaps = drawerElement.querySelector('#cap-gaps-text');
  const capRoadmap = drawerElement.querySelector('#cap-roadmap-text');
  const capRegistry = drawerElement.querySelector('#cap-registry-text');
  const hintEnter = drawerElement.querySelector('#hint-enter-pill');
  const hintShift = drawerElement.querySelector('#hint-shift-pill');
  const fabLabel = document.querySelector('#fab-label-text');

  const fabText = lang === 'ar' ? 'المساعد الذكي' : (lang === 'fr' ? 'Assistant IA' : 'AI Assistant');
  if (fabLabel) fabLabel.textContent = fabText;

  if (lang === 'en') {
    if (topbarHeading) topbarHeading.textContent = 'Sovereign AI Assistant';
    if (topbarSubheading) topbarSubheading.textContent = 'National Registry for Algerian Competencies & Careers';
    if (input) input.placeholder = 'Ask anything about competencies, career paths, or verified research...';
    if (sendLabel) sendLabel.textContent = 'Send';
    if (clearLabel) clearLabel.textContent = 'New Inquiry Session';
    if (brandTag) brandTag.textContent = 'Sovereign Intelligence';
    if (contextHeading) contextHeading.textContent = 'Active Inquiry Scope';
    if (capHeading) capHeading.textContent = 'Available Domains';
    if (capCareers) capCareers.textContent = 'Career Prediction';
    if (capGaps) capGaps.textContent = 'Skills Gap Analysis';
    if (capRoadmap) capRoadmap.textContent = 'Learning Roadmap';
    if (capRegistry) capRegistry.textContent = 'Explore Competencies Registry';
    if (hintEnter) hintEnter.textContent = 'Enter ↵ to send';
    if (hintShift) hintShift.textContent = 'Shift + Enter for new line';
  } else if (lang === 'fr') {
    if (topbarHeading) topbarHeading.textContent = 'Assistant Intelligent Souverain';
    if (topbarSubheading) topbarSubheading.textContent = 'Plateforme Nationale des Compétences et Expertises Algériennes';
    if (input) input.placeholder = 'Posez vos questions sur les compétences, carrières ou chercheurs...';
    if (sendLabel) sendLabel.textContent = 'Envoyer';
    if (clearLabel) clearLabel.textContent = 'Nouvelle Session';
    if (brandTag) brandTag.textContent = 'Intelligence Souveraine';
    if (contextHeading) contextHeading.textContent = 'Périmètre Actif';
    if (capHeading) capHeading.textContent = 'Domaines Disponibles';
    if (capCareers) capCareers.textContent = 'Prédiction de Carrière';
    if (capGaps) capGaps.textContent = 'Analyse des Compétences';
    if (capRoadmap) capRoadmap.textContent = 'Feuille de Route d’Apprentissage';
    if (capRegistry) capRegistry.textContent = 'Explorer le Répertoire National';
    if (hintEnter) hintEnter.textContent = 'Entrée ↵ pour envoyer';
    if (hintShift) hintShift.textContent = 'Maj + Entrée pour saut de ligne';
  } else {
    if (topbarHeading) topbarHeading.textContent = 'المساعد الذكي السيادي';
    if (topbarSubheading) topbarSubheading.textContent = 'المنصة الوطنية للربط بين الكفاءات والخبرات الجزائرية';
    if (input) input.placeholder = 'اكتب استفسارك للمساعد الذكي حول الكفاءات، المسار المهني، أو المهارات...';
    if (sendLabel) sendLabel.textContent = 'إرسال';
    if (clearLabel) clearLabel.textContent = 'جلسة استفسار جديدة';
    if (brandTag) brandTag.textContent = 'المنظومة السيادية';
    if (contextHeading) contextHeading.textContent = 'نطاق الاستفسار النشط';
    if (capHeading) capHeading.textContent = 'المجالات المتاحة';
    if (capCareers) capCareers.textContent = 'التنبؤ بالمسار المهني';
    if (capGaps) capGaps.textContent = 'تحليل فجوات المهارات';
    if (capRoadmap) capRoadmap.textContent = 'خارطة طريق التعلم';
    if (capRegistry) capRegistry.textContent = 'استكشاف سجل الكفاءات';
    if (hintEnter) hintEnter.textContent = 'Enter ↵ للإرسال';
    if (hintShift) hintShift.textContent = 'Shift + Enter للسطر الجديد';
  }
}

/**
 * Render initial conversational prompt & suggested chips matching active UI language
 */
function renderInitialGreeting(context, lang = 'ar') {
  let greetingText = '';
  let chips = [];

  const activeLang = lang || store.state.lang || localStorage.getItem('rawabit_lang') || 'ar';

  if (context && context.profile) {
    const p = context.profile;
    const name = (activeLang === 'ar' && p.nameAr) ? p.nameAr : (activeLang === 'fr' && p.nameFr ? p.nameFr : p.name);

    if (activeLang === 'en') {
      greetingText = `Hello! I am Rawabit AI. How can I assist you with **${name}**'s verified dossier, competencies, academic trajectory, or research publications?`;
      chips = ['Summarize published research & thesis', 'Verified competencies & skills', 'Career trajectory & appointments'];
    } else if (activeLang === 'fr') {
      greetingText = `Bonjour ! Je suis l'IA Rawabit. Comment puis-je vous renseigner sur le parcours de **${name}**, ses compétences vérifiées ou ses contributions ?`;
      chips = ['Résumer les publications et thèse', 'Compétences et spécialités', 'Parcours professionnel et postes'];
    } else {
      greetingText = `مرحباً بك! أنا مساعد روابط الذكي. كيف يمكنني مساعدتك في استكشاف المسار المعتمد للباحث **${name}**، التخصصات الدقيقة، أو إمكانيات التعاون معه؟`;
      chips = ['ملخص الأبحاث والرسالة الأكاديمية', 'التخصصات الدقيقة المعتمدة', 'المسار المهني والمشاريع'];
    }
  } else {
    if (activeLang === 'en') {
      greetingText = `Welcome to the Rawabit Sovereign AI Workspace! I can assist you with career predictions, skills gap analysis, verified Algerian researchers, and national academic institutions.`;
      chips = ['Top AI & NLP researchers in Algeria', 'Renewable energy & solar engineering careers', 'How competency verification works'];
    } else if (activeLang === 'fr') {
      greetingText = `Bienvenue sur l'Espace IA Souverain de Rawabit ! Je peux vous orienter vers les compétences algériennes vérifiées, analyser les trajectoires de carrière ou évaluer les filières émergentes.`;
      chips = ['Chercheurs IA & NLP en Algérie', 'Métiers des énergies renouvelables', 'Processus de certification nationale'];
    } else {
      greetingText = `أهلاً بك في منصة روابط للذكاء الاصطناعي السيادي! يمكنني مساعدتك في استكشاف الكفاءات الموثقة، التنبؤ بالمسارات المهنية، تحليل فجوات المهارات، وربط الاحتياجات الوطنية.`;
      chips = ['أبرز خبراء الذكاء الاصطناعي في الجزائر', 'كفاءات الطاقة المتجددة والهيدروجين الأخضر', 'كيف يتم توثيق الكفاءات في روابط؟'];
    }
  }

  appendStaticAIMessage(greetingText, chips);
}

/**
 * Append user message bubble to chat
 */
function appendUserMessage(text) {
  const container = drawerElement.querySelector('#ai-chat-messages');
  if (!container) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = 'ai-msg ai-msg-user animate-fade-in';
  msgDiv.innerHTML = `
    <div class="ai-msg-avatar">${USER_AVATAR_SVG}</div>
    <div class="ai-msg-body">
      <div class="ai-msg-bubble user-bubble">${escapeHtml(text)}</div>
    </div>
  `;
  container.appendChild(msgDiv);
  scrollToBottom();
}

/**
 * Append static AI greeting message with interactive quick chips
 */
function appendStaticAIMessage(text, chips = []) {
  const container = drawerElement.querySelector('#ai-chat-messages');
  if (!container) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = 'ai-msg ai-msg-assistant animate-fade-in';
  
  let chipsHtml = '';
  if (chips && chips.length > 0) {
    chipsHtml = `
      <div class="ai-chips-wrap">
        ${chips.map(c => `<button type="button" class="ai-chip-btn" data-query="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('')}
      </div>
    `;
  }

  msgDiv.innerHTML = `
    <div class="ai-msg-avatar">${AI_AVATAR_SVG}</div>
    <div class="ai-msg-body">
      <div class="ai-msg-bubble ai-bubble">${formatMarkdown(text)}</div>
      ${chipsHtml}
    </div>
  `;

  container.appendChild(msgDiv);

  // Wire chip buttons
  msgDiv.querySelectorAll('.ai-chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-query');
      if (q && !isStreaming) {
        handleUserMessage(q);
      }
    });
  });

  scrollToBottom();
}

/**
 * Handle sending a user message, invoking SSE stream, and rendering response
 */
async function handleUserMessage(queryText) {
  if (isStreaming) return;

  appendUserMessage(queryText);
  activeMessages.push({ role: 'user', content: queryText });

  const container = drawerElement.querySelector('#ai-chat-messages');
  const topbarSub = drawerElement.querySelector('#ai-topbar-subheading');
  const lang = store.state.lang || localStorage.getItem('rawabit_lang') || 'ar';
  
  const originalSubtext = topbarSub ? topbarSub.textContent : '';
  if (topbarSub) {
    topbarSub.textContent = lang === 'ar' ? 'جارٍ التحليل والبحث في السجل السيادي...' : (lang === 'fr' ? 'Analyse et consultation du registre souverain...' : 'Analyzing & querying sovereign registry...');
    topbarSub.style.color = '#059669';
  }

  // Create stream bubble
  const streamMsgDiv = document.createElement('div');
  streamMsgDiv.className = 'ai-msg ai-msg-assistant animate-fade-in';
  streamMsgDiv.innerHTML = `
    <div class="ai-msg-avatar">${AI_AVATAR_SVG}</div>
    <div class="ai-msg-body">
      <div class="ai-msg-bubble ai-bubble streaming" id="active-stream-bubble">
        <div class="ai-typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `;
  container.appendChild(streamMsgDiv);
  scrollToBottom();

  const bubble = streamMsgDiv.querySelector('#active-stream-bubble');
  isStreaming = true;
  let accumulatedText = '';
  let hasReceivedTokens = false;

  const activeLang = store.state.lang || localStorage.getItem('rawabit_lang') || 'ar';
  const languageName = activeLang === 'ar' ? 'Arabic' : (activeLang === 'fr' ? 'French' : 'English');

  // Build isolated context payload
  const payload = {
    query: queryText,
    lang: activeLang,
    currentLanguage: languageName,
    context: currentContext?.profile ? {
      id: currentContext.profile.id,
      name: currentContext.profile.name,
      nameAr: currentContext.profile.nameAr,
      title: currentContext.profile.title,
      titleAr: currentContext.profile.titleAr,
      organization: currentContext.profile.organization,
      organizationAr: currentContext.profile.organizationAr,
      location: currentContext.profile.location,
      locationAr: currentContext.profile.locationAr,
      wilaya: currentContext.profile.wilaya || currentContext.profile.wilayaCode,
      bio: currentContext.profile.bio || currentContext.profile.bioAr,
      tier: currentContext.profile.tier,
      tags: currentContext.profile.tags,
      reliability: currentContext.profile.reliability
    } : (currentContext?.wilayaCode ? { wilayaCode: currentContext.wilayaCode } : null),
    messages: activeMessages
  };

  try {
    const response = await fetch(getAiApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed.startsWith('data:')) {
          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(dataStr);
            const token = parsed.choices?.[0]?.delta?.content || parsed.token || '';
            if (token) {
              if (!hasReceivedTokens) {
                hasReceivedTokens = true;
                bubble.innerHTML = '';
              }
              accumulatedText += token;
              bubble.innerHTML = formatMarkdown(accumulatedText);
              scrollToBottom();
            }
          } catch {
            if (!hasReceivedTokens) {
              hasReceivedTokens = true;
              bubble.innerHTML = '';
            }
            accumulatedText += dataStr;
            bubble.innerHTML = formatMarkdown(accumulatedText);
            scrollToBottom();
          }
        }
      }
    }

    if (!hasReceivedTokens && accumulatedText) {
      bubble.innerHTML = formatMarkdown(accumulatedText);
    } else if (!hasReceivedTokens) {
      bubble.innerHTML = lang === 'ar' 
        ? 'تمت معالجة الاستفسار بنجاح.' 
        : 'Query processed successfully.';
    }

    activeMessages.push({ role: 'assistant', content: accumulatedText || 'Query processed.' });

  } catch (err) {
    console.error('[Rawabit AI] Streaming error:', err);
    bubble.innerHTML = `
      <div style="color: #DC2626; font-weight: 700;">
        ⚠️ ${lang === 'ar' ? 'تعذر الاتصال بخدمة الذكاء الاصطناعي. يرجى المحاولة لاحقاً.' : 'Failed to connect to AI engine. Please try again later.'}
      </div>
    `;
  } finally {
    isStreaming = false;
    bubble.classList.remove('streaming');
    if (topbarSub) {
      topbarSub.textContent = originalSubtext;
      topbarSub.style.color = '#64748B';
    }
    scrollToBottom();
  }
}

/**
 * Smoothly scroll the messages container to bottom
 */
function scrollToBottom() {
  const container = drawerElement?.querySelector('#ai-chat-messages');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}
