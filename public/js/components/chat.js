/**
 * Rawabit v2 — Sovereign Full-Screen Glassmorphism AI Chat Interface
 * Raycast/Perplexity-Inspired Floating Omnibar · Centered 850px Canvas · Dynamic Zero-State FAQ
 */

import { t } from '../i18n.js';
import { store, pushOverlay, popOverlay, isOverlayActive } from '../store.js';

let drawerElement = null;
let backdropElement = null;
let currentContext = null;
let currentSessionKey = null;
let activeMessages = [];
let isStreaming = false;

const USER_AVATAR_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
const AI_AVATAR_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>`;

/**
 * Resolves the AI API URL across environments
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
 * Creates the single Full-Screen Glassmorphic Chat DOM
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
    <!-- Top Glass Header Bar -->
    <header class="ai-glass-header">
      <div class="ai-glass-header-inner">
        <div class="ai-header-brand">
          <div class="ai-brand-gem">${AI_AVATAR_SVG}</div>
          <div class="ai-brand-titles">
            <span class="ai-brand-heading" id="ai-top-brand-title">روابط AI <span style="font-size:0.75rem; color:#34D399; font-weight:700;">● السيادي</span></span>
            <span class="ai-brand-subheading" id="ai-top-brand-sub">المنصة الوطنية للربط بين الكفاءات والخبرات الجزائرية</span>
          </div>
        </div>

        <div class="ai-header-actions">
          <button type="button" class="ai-glass-btn" id="ai-new-chat-btn" style="display: none;">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            <span id="ai-new-chat-label">محادثة جديدة</span>
          </button>
          
          <button type="button" class="ai-glass-btn ai-close-btn" id="ai-drawer-close-btn" aria-label="Close">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            <span class="key-pill">ESC</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Centered Scroll Body -->
    <div class="ai-glass-scroll-body" id="ai-glass-scroll-body">
      <div class="ai-centered-column">
        
        <!-- Dynamic Zero-State FAQ Grid (Shown when empty) -->
        <div class="ai-zero-state" id="ai-zero-state">
          <div class="zero-icon-glow">
            ${AI_AVATAR_SVG}
          </div>
          <h1 class="zero-title" id="zero-hero-title">المساعد الذكي السيادي</h1>
          <p class="zero-subtitle" id="zero-hero-subtitle">استكشف الكفاءات الوطنية الجزائرية، تنبأ بمسارك المهني، وحلل فجوات المهارات ببيانات موثقة.</p>
          
          <!-- Context Pill (if profile is active) -->
          <div class="zero-context-pill" id="zero-context-pill" style="display: none;">
            <span class="zero-context-dot"></span>
            <span id="zero-context-text">استعلام مخصص</span>
          </div>

          <!-- 2x2 Clickable FAQ Cards Grid -->
          <div class="zero-faq-grid" id="zero-faq-grid">
            <!-- Dynamically populated -->
          </div>
        </div>

        <!-- Messages Stream Area -->
        <div class="ai-chat-messages" id="ai-chat-messages" style="display: none;"></div>

      </div>
    </div>

    <!-- Floating Raycast-Style Omnibar Input -->
    <div class="ai-floating-omnibar">
      <div class="ai-omnibar-card">
        <form class="ai-omnibar-form" id="ai-chat-form" onsubmit="event.preventDefault();">
          <textarea
            class="ai-omnibar-input"
            id="ai-chat-input"
            rows="1"
            placeholder="اكتب استفسارك للمساعد الذكي..."
            autocomplete="off"
          ></textarea>

          <div class="ai-omnibar-bottom">
            <div class="ai-omnibar-hints">
              <span class="hint-pill" id="hint-enter-pill">Enter ↵ للإرسال</span>
              <span class="hint-pill" id="hint-shift-pill">Shift + Enter للسطر الجديد</span>
              <span class="hint-pill" id="ai-char-counter">0 / 2000</span>
            </div>
            
            <button type="submit" class="ai-send-btn" id="ai-send-btn" aria-label="Send">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              <span id="ai-send-label">إرسال</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(backdropElement);
  document.body.appendChild(drawerElement);

  // Close triggers
  const closeBtn = drawerElement.querySelector('#ai-drawer-close-btn');
  closeBtn.addEventListener('click', closeAIChat);
  backdropElement.addEventListener('click', closeAIChat);

  // Reset / New Chat trigger
  const newChatBtn = drawerElement.querySelector('#ai-new-chat-btn');
  if (newChatBtn) {
    newChatBtn.addEventListener('click', () => {
      resetChatSession();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOverlayActive('ai-chat')) {
      closeAIChat();
    }
  });

  // Textarea handling (auto-resize & shortcuts)
  const input = drawerElement.querySelector('#ai-chat-input');
  const form = drawerElement.querySelector('#ai-chat-form');
  const charCounter = drawerElement.querySelector('#ai-char-counter');

  if (input) {
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 140) + 'px';
      if (charCounter) {
        const len = input.value.length;
        charCounter.textContent = `${len} / 2000`;
        charCounter.style.color = len > 1900 ? '#EF4444' : '#94A3B8';
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
 * Reset chat session and return smoothly to zero-state FAQ
 */
function resetChatSession() {
  activeMessages = [];
  const messagesContainer = drawerElement.querySelector('#ai-chat-messages');
  const zeroState = drawerElement.querySelector('#ai-zero-state');
  const newChatBtn = drawerElement.querySelector('#ai-new-chat-btn');

  if (messagesContainer) {
    messagesContainer.innerHTML = '';
    messagesContainer.style.display = 'none';
  }
  if (zeroState) {
    zeroState.style.display = 'flex';
  }
  if (newChatBtn) {
    newChatBtn.style.display = 'none';
  }

  renderDynamicZeroState(currentContext, store.state.lang);
}

/**
 * Open the Full-Screen AI Workspace
 * @param {Object} context - Optional metadata (profile, search query, or wilaya guidance)
 */
export function openAIChat(context = null) {
  createChatDrawerDOM();
  currentContext = context;

  const lang = store.state.lang || localStorage.getItem('rawabit_lang') || 'ar';
  const isRtl = lang === 'ar';
  drawerElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  updateWorkspaceTranslations(lang);

  // Strict Context Isolation
  const newSessionKey = context?.profile?.id 
    ? `profile-${context.profile.id}` 
    : (context?.wilayaCode ? `wilaya-${context.wilayaCode}` : 'global-session');

  if (newSessionKey !== currentSessionKey) {
    currentSessionKey = newSessionKey;
    resetChatSession();
  } else {
    renderDynamicZeroState(context, lang);
  }

  pushOverlay('ai-chat');
  backdropElement.classList.add('active');
  drawerElement.classList.add('active');

  // Fade out FAB
  const fab = document.querySelector('#global-ai-fab');
  if (fab) fab.classList.add('drawer-open');

  // Auto-send initialQuery if provided
  if (context && context.initialQuery) {
    const q = context.initialQuery.trim();
    if (q) {
      setTimeout(() => {
        handleUserMessage(q);
      }, 300);
    }
  }

  const input = drawerElement.querySelector('#ai-chat-input');
  setTimeout(() => input?.focus(), 300);
}

/**
 * Close the Full-Screen AI Workspace
 */
export function closeAIChat() {
  if (!drawerElement || !backdropElement) return;

  drawerElement.classList.remove('active');
  backdropElement.classList.remove('active');
  popOverlay();

  const fab = document.querySelector('#global-ai-fab');
  if (fab) fab.classList.remove('drawer-open');
}

/**
 * Render dynamic Zero-State FAQ Grid according to active context and language
 */
function renderDynamicZeroState(context, lang = 'ar') {
  const grid = drawerElement.querySelector('#zero-faq-grid');
  const heroTitle = drawerElement.querySelector('#zero-hero-title');
  const heroSubtitle = drawerElement.querySelector('#zero-hero-subtitle');
  const contextPill = drawerElement.querySelector('#zero-context-pill');
  const contextText = drawerElement.querySelector('#zero-context-text');

  if (!grid) return;

  let faqs = [];

  if (context && context.profile) {
    const p = context.profile;
    const name = (lang === 'ar' && p.nameAr) ? p.nameAr : (lang === 'fr' && p.nameFr ? p.nameFr : p.name);

    if (contextPill && contextText) {
      contextText.textContent = lang === 'ar' ? `استعلام مخصص: ${name}` : `Dossier Context: ${name}`;
      contextPill.style.display = 'inline-flex';
    }

    if (lang === 'en') {
      if (heroTitle) heroTitle.textContent = `Explore ${name}'s Dossier`;
      if (heroSubtitle) heroSubtitle.textContent = `Ask verified questions regarding research background, publications, academic credentials, and career trajectory.`;
      faqs = [
        { icon: '🎓', title: 'Academic Qualifications', desc: 'Degrees, university affiliations, and graduation thesis', prompt: `Summarize ${name}'s academic degrees and thesis title` },
        { icon: '💼', title: 'Professional Trajectory', desc: 'Appointments, corporate roles, and key responsibilities', prompt: `What are ${name}'s professional roles and key appointments?` },
        { icon: '🔬', title: 'Key Scientific Contributions', desc: 'Core competencies, algorithms, and projects', prompt: `What are the major scientific and technical contributions of ${name}?` },
        { icon: '🔗', title: 'Verified Channels & Contact', desc: 'LinkedIn, GitHub, Google Scholar, and institutional email', prompt: `Show verified links and contact channels for ${name}` },
      ];
    } else if (lang === 'fr') {
      if (heroTitle) heroTitle.textContent = `Explorer le Dossier de ${name}`;
      if (heroSubtitle) heroSubtitle.textContent = `Posez des questions précises sur son parcours académique, ses publications et ses compétences vérifiées.`;
      faqs = [
        { icon: '🎓', title: 'Parcours Académique', desc: 'Diplômes, affiliations universitaires et sujet de thèse', prompt: `Résumer les diplômes et la thèse de ${name}` },
        { icon: '💼', title: 'Parcours Professionnel', desc: 'Postes occupés, entreprises et responsabilités', prompt: `Quels sont les postes et expériences professionnelles de ${name} ?` },
        { icon: '🔬', title: 'Contributions Majeures', desc: 'Spécialités de recherche, algorithmes et projets', prompt: `Quelles sont les contributions majeures de ${name} ?` },
        { icon: '🔗', title: 'Canaux et Contact Vérifiés', desc: 'LinkedIn, GitHub, Google Scholar et email', prompt: `Afficher les sources et liens vérifiés pour ${name}` },
      ];
    } else {
      if (heroTitle) heroTitle.textContent = `استكشاف ملف: ${name}`;
      if (heroSubtitle) heroSubtitle.textContent = `اطرح استفساراتك حول المسار الأكاديمي، الأبحاث المنشورة، التخصصات الدقيقة، والمسيرة المهنية.`;
      faqs = [
        { icon: '🎓', title: 'المسار والشهادات الأكاديمية', desc: 'الدرجات العلمية، الجامعات، وموضوع أطروحة التخرج', prompt: `لخص الدرجات الأكاديمية وأطروحة ${name}` },
        { icon: '💼', title: 'المسار المهني والمناصب', desc: 'الخبرات الوظيفية، المؤسسات، وسنوات الممارسة', prompt: `ما هي المناصب والخبرات المهنية للباحث ${name}؟` },
        { icon: '🔬', title: 'أبرز الإسهامات والمشاريع', desc: 'التخصصات الدقيقة، الخوارزميات، والابتكارات', prompt: `ما هي أبرز الإسهامات العلمية والمشاريع المعتمدة للباحث ${name}؟` },
        { icon: '🔗', title: 'قنوات التواصل والاعتماد', desc: 'لينكد إن، غيت هاب، غوغل سكولار، والبريد الرسمي', prompt: `اعرض الروابط الرسمية وقنوات التحقق الخاصة بـ ${name}` },
      ];
    }
  } else {
    if (contextPill) contextPill.style.display = 'none';

    if (lang === 'en') {
      if (heroTitle) heroTitle.textContent = 'Sovereign AI Assistant';
      if (heroSubtitle) heroSubtitle.textContent = 'Explore verified Algerian competencies, predict career trajectories, analyze skill gaps, and access national intelligence.';
      faqs = [
        { icon: '🎯', title: 'Career Prediction', desc: 'Predict high-demand fields and future career pathways in Algeria', prompt: 'Predict career opportunities and emerging high-demand specializations in Algeria' },
        { icon: '📊', title: 'Skills Gap Analysis', desc: 'Benchmark required technical certifications and industrial skills', prompt: 'Analyze technical skill gaps and required credentials for Algerian talent' },
        { icon: '🗺️', title: 'Learning Roadmap', desc: 'Synthesize structured learning milestones and academic progression', prompt: 'Generate a step-by-step learning roadmap for AI and renewable energy' },
        { icon: '🔍', title: 'Verified Talent Registry', desc: 'Discover certified Algerian researchers and institutional centers', prompt: 'Who are the top verified researchers in AI and Energy in Algeria?' },
      ];
    } else if (lang === 'fr') {
      if (heroTitle) heroTitle.textContent = 'Assistant Intelligent Souverain';
      if (heroSubtitle) heroSubtitle.textContent = 'Explorez les compétences algériennes certifiées, analysez les filières d’avenir et accédez au registre national.';
      faqs = [
        { icon: '🎯', title: 'Prédiction de Carrière', desc: 'Anticiper les filières et métiers les plus recherchés en Algérie', prompt: 'Quelles sont les carrières d’avenir et compétences recherchées en Algérie ?' },
        { icon: '📊', title: 'Analyse des Compétences', desc: 'Évaluer les écarts de compétences et certifications requises', prompt: 'Analyser les besoins en compétences techniques et certifications requises' },
        { icon: '🗺️', title: 'Feuille de Route d’Apprentissage', desc: 'Plan structuré pour la progression académique et professionnelle', prompt: 'Proposer une feuille de route d’apprentissage pour l’IA et les énergies' },
        { icon: '🔍', title: 'Répertoire des Compétences', desc: 'Découvrir les chercheurs et experts algériens certifiés', prompt: 'Quels sont les experts certifiés en intelligence artificielle en Algérie ?' },
      ];
    } else {
      if (heroTitle) heroTitle.textContent = 'المساعد الذكي السيادي';
      if (heroSubtitle) heroSubtitle.textContent = 'استكشف الكفاءات الوطنية الجزائرية، تنبأ بمسارك المهني، وحلل فجوات المهارات ببيانات موثقة.';
      faqs = [
        { icon: '🎯', title: 'التنبؤ بالمسار المهني', desc: 'توقع التخصصات والمسارات الوظيفية الأكثر طلباً في سوق العمل الوطني', prompt: 'توقع المسارات المهنية والتخصصات الأكثر طلباً في الجزائر' },
        { icon: '📊', title: 'تحليل فجوات المهارات', desc: 'مقارنة المهارات التقنية مع متطلبات سوق العمل ومعايير الاعتماد', prompt: 'تحليل فجوات المهارات والشهادات المطلوبة للكفاءات الجزائرية' },
        { icon: '🗺️', title: 'خارطة طريق التعلم', desc: 'خطة منهجية لاكتساب المهارات والترقية الأكاديمية والمهنية', prompt: 'اقتراح خارطة طريق للتعلم والبحث العلمي في الذكاء الاصطناعي والطاقة' },
        { icon: '🔍', title: 'استكشاف سجل الكفاءات', desc: 'البحث عن الباحثين والخبراء المعتمدين عبر الـ 58 ولاية', prompt: 'من هم أبرز الباحثين المعتمدين في الذكاء الاصطناعي والطاقة بالجزائر؟' },
      ];
    }
  }

  grid.innerHTML = faqs.map(item => `
    <div class="zero-faq-card" data-prompt="${escapeHtml(item.prompt)}">
      <span class="faq-card-icon">${item.icon}</span>
      <div class="faq-card-body">
        <span class="faq-card-title">${escapeHtml(item.title)}</span>
        <span class="faq-card-desc">${escapeHtml(item.desc)}</span>
      </div>
    </div>
  `).join('');

  // Wire FAQ card clicks
  grid.querySelectorAll('.zero-faq-card').forEach(card => {
    card.addEventListener('click', () => {
      const p = card.getAttribute('data-prompt');
      if (p && !isStreaming) {
        handleUserMessage(p);
      }
    });
  });
}

/**
 * Format and update Workspace Translations
 */
function updateWorkspaceTranslations(lang) {
  const topBrandTitle = drawerElement.querySelector('#ai-top-brand-title');
  const topBrandSub = drawerElement.querySelector('#ai-top-brand-sub');
  const newChatLabel = drawerElement.querySelector('#ai-new-chat-label');
  const input = drawerElement.querySelector('#ai-chat-input');
  const sendLabel = drawerElement.querySelector('#ai-send-label');
  const hintEnter = drawerElement.querySelector('#hint-enter-pill');
  const hintShift = drawerElement.querySelector('#hint-shift-pill');
  const fabLabel = document.querySelector('#fab-label-text');

  const fabText = lang === 'ar' ? 'المساعد الذكي' : (lang === 'fr' ? 'Assistant IA' : 'AI Assistant');
  if (fabLabel) fabLabel.textContent = fabText;

  if (lang === 'en') {
    if (topBrandTitle) topBrandTitle.innerHTML = 'RAWABIT AI <span style="font-size:0.75rem; color:#34D399; font-weight:700;">● Sovereign</span>';
    if (topBrandSub) topBrandSub.textContent = 'National Registry for Algerian Competencies & Careers';
    if (newChatLabel) newChatLabel.textContent = 'New Chat';
    if (input) input.placeholder = 'Ask anything about competencies, career prediction, skill gaps, or verified research...';
    if (sendLabel) sendLabel.textContent = 'Send';
    if (hintEnter) hintEnter.textContent = 'Enter ↵ to send';
    if (hintShift) hintShift.textContent = 'Shift + Enter for new line';
  } else if (lang === 'fr') {
    if (topBrandTitle) topBrandTitle.innerHTML = 'RAWABIT AI <span style="font-size:0.75rem; color:#34D399; font-weight:700;">● Souverain</span>';
    if (topBrandSub) topBrandSub.textContent = 'Plateforme Nationale des Compétences et Expertises Algériennes';
    if (newChatLabel) newChatLabel.textContent = 'Nouvelle Conversation';
    if (input) input.placeholder = 'Posez vos questions sur les compétences, carrières ou chercheurs...';
    if (sendLabel) sendLabel.textContent = 'Envoyer';
    if (hintEnter) hintEnter.textContent = 'Entrée ↵ pour envoyer';
    if (hintShift) hintShift.textContent = 'Maj + Entrée pour saut de ligne';
  } else {
    if (topBrandTitle) topBrandTitle.innerHTML = 'روابط AI <span style="font-size:0.75rem; color:#34D399; font-weight:700;">● السيادي</span>';
    if (topBrandSub) topBrandSub.textContent = 'المنصة الوطنية للربط بين الكفاءات والخبرات الجزائرية';
    if (newChatLabel) newChatLabel.textContent = 'محادثة جديدة';
    if (input) input.placeholder = 'اكتب استفسارك للمساعد الذكي حول الكفاءات، المسار المهني، أو المهارات...';
    if (sendLabel) sendLabel.textContent = 'إرسال';
    if (hintEnter) hintEnter.textContent = 'Enter ↵ للإرسال';
    if (hintShift) hintShift.textContent = 'Shift + Enter للسطر الجديد';
  }
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
 * Handle sending a user message, transitioning view, invoking SSE stream, and rendering response
 */
async function handleUserMessage(queryText) {
  if (isStreaming) return;

  // 1. Transition: Hide Zero-State FAQ, Show Message Stream & New Chat Button
  const zeroState = drawerElement.querySelector('#ai-zero-state');
  const messagesContainer = drawerElement.querySelector('#ai-chat-messages');
  const newChatBtn = drawerElement.querySelector('#ai-new-chat-btn');

  if (zeroState) zeroState.style.display = 'none';
  if (messagesContainer) messagesContainer.style.display = 'flex';
  if (newChatBtn) newChatBtn.style.display = 'flex';

  appendUserMessage(queryText);
  activeMessages.push({ role: 'user', content: queryText });

  const lang = store.state.lang || localStorage.getItem('rawabit_lang') || 'ar';
  const languageName = lang === 'ar' ? 'Arabic' : (lang === 'fr' ? 'French' : 'English');

  // 2. Create stream bubble
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
  messagesContainer.appendChild(streamMsgDiv);
  scrollToBottom();

  const bubble = streamMsgDiv.querySelector('#active-stream-bubble');
  isStreaming = true;
  let accumulatedText = '';
  let hasReceivedTokens = false;

  // Build isolated context payload
  const payload = {
    query: queryText,
    lang: lang,
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
      <div style="color: #F87171; font-weight: 700;">
        ⚠️ ${lang === 'ar' ? 'تعذر الاتصال بخدمة الذكاء الاصطناعي. يرجى المحاولة لاحقاً.' : 'Failed to connect to AI engine. Please try again later.'}
      </div>
    `;
  } finally {
    isStreaming = false;
    bubble.classList.remove('streaming');
    scrollToBottom();
  }
}

/**
 * Smoothly scroll the messages container to bottom
 */
function scrollToBottom() {
  const scrollBody = drawerElement?.querySelector('#ai-glass-scroll-body');
  if (scrollBody) {
    scrollBody.scrollTop = scrollBody.scrollHeight;
  }
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
