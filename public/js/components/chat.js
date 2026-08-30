/**
 * Rawabit v2 — AI Assistant Chat Drawer Component with Context Isolation & Marked.js HTML Parser
 * Luxury Saudi-Gov Tech Aesthetic · Real Groq/FastAPI SSE Streaming · 100% Strict Localization
 */

import { t } from '../i18n.js';
import { store, pushOverlay, popOverlay, isOverlayActive } from '../store.js';

let drawerElement = null;
let backdropElement = null;
let currentContext = null;
let currentSessionKey = null; // Bound to profile.id / wilayaCode / 'global'
let activeMessages = []; // Isolated session messages
let isStreaming = false;

const USER_AVATAR_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
const AI_AVATAR_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>`;

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
 * Ensures the persistent Chat Drawer DOM is created and attached
 */
function createChatDrawerDOM() {
  if (drawerElement && backdropElement) return;

  // 1. Backdrop
  backdropElement = document.createElement('div');
  backdropElement.className = 'ai-drawer-backdrop';
  backdropElement.id = 'ai-drawer-backdrop';

  // 2. Drawer Panel
  drawerElement = document.createElement('div');
  drawerElement.className = 'ai-drawer-panel';
  drawerElement.id = 'ai-drawer-panel';

  drawerElement.innerHTML = `
    <!-- Header -->
    <header class="ai-drawer-header">
      <div class="ai-drawer-title-wrap">
        <div class="ai-drawer-icon">
          ${AI_AVATAR_SVG}
        </div>
        <div>
          <h2 class="ai-drawer-heading" id="ai-drawer-heading">المساعد الذكي</h2>
          <div class="ai-drawer-status">
            <span class="ai-status-dot"></span>
            <span id="ai-drawer-substatus">جاهز للإجابة الفورية</span>
          </div>
        </div>
      </div>

      <button class="ai-drawer-close-btn" id="ai-drawer-close-btn" aria-label="Close">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </header>

    <!-- Context Info Strip (Injected dynamically) -->
    <div id="ai-context-strip" style="display: none;"></div>

    <!-- Messages Container -->
    <div class="ai-chat-messages" id="ai-chat-messages"></div>

    <!-- Input Area -->
    <div class="ai-drawer-input-wrap">
      <form class="ai-input-form" id="ai-chat-form" onsubmit="event.preventDefault();">
        <input 
          type="text" 
          class="ai-chat-input" 
          id="ai-chat-input" 
          placeholder="اكتب استفسارك للمساعد الذكي..." 
          autocomplete="off"
        />
        <button type="submit" class="ai-send-btn" id="ai-send-btn" aria-label="Send">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(backdropElement);
  document.body.appendChild(drawerElement);

  // Wire close triggers
  const closeBtn = drawerElement.querySelector('#ai-drawer-close-btn');
  closeBtn.addEventListener('click', closeAIChat);
  backdropElement.addEventListener('click', closeAIChat);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOverlayActive('ai-chat')) {
      closeAIChat();
    }
  });

  // Wire Form Submit
  const form = drawerElement.querySelector('#ai-chat-form');
  const input = drawerElement.querySelector('#ai-chat-input');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || isStreaming) return;
    input.value = '';
    handleUserMessage(text);
  });
}

/**
 * Open the AI Chat Drawer with strict context isolation & RTL support
 * @param {Object} context - Optional metadata (profile, search query, or wilaya guidance)
 */
export function openAIChat(context = null) {
  createChatDrawerDOM();
  currentContext = context;

  const lang = store.state.lang;
  const isRtl = lang === 'ar';
  drawerElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  updateHeaderTranslations(lang);

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

  // Render context strip if profile provided
  const contextStrip = drawerElement.querySelector('#ai-context-strip');
  if (context && context.profile) {
    const p = context.profile;
    const name = (lang === 'ar' && p.nameAr) ? p.nameAr : (lang === 'fr' && p.nameFr ? p.nameFr : p.name);
    const title = (lang === 'ar' && p.titleAr) ? p.titleAr : (lang === 'fr' && p.titleFr ? p.titleFr : p.title);
    const reliabilityLabel = lang === 'ar' ? 'موثوقية' : (lang === 'fr' ? 'fiabilité' : 'reliability');
    
    contextStrip.innerHTML = `
      <div class="ai-context-badge">
        <div>
          <div class="ctx-name">${name}</div>
          <div class="ctx-title">${title}</div>
        </div>
        <span style="font-weight: 800; font-size: 0.85rem; color: #00875A;">${p.reliability || 99}% ${reliabilityLabel}</span>
      </div>
    `;
    contextStrip.style.display = 'block';
  } else {
    contextStrip.style.display = 'none';
  }

  // Populate Initial Greeting if messages empty for this session
  if (messagesContainer && messagesContainer.children.length === 0) {
    renderInitialGreeting(context, lang);
  }

  pushOverlay('ai-chat');
  backdropElement.classList.add('active');
  drawerElement.classList.add('active');

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
 * Close the AI Chat Drawer smoothly
 */
export function closeAIChat() {
  if (!drawerElement || !backdropElement) return;

  drawerElement.classList.remove('active');
  backdropElement.classList.remove('active');
  popOverlay();
}

/**
 * Format and update Drawer Header text according to language
 */
function updateHeaderTranslations(lang) {
  const heading = drawerElement.querySelector('#ai-drawer-heading');
  const substatus = drawerElement.querySelector('#ai-drawer-substatus');
  const input = drawerElement.querySelector('#ai-chat-input');

  if (lang === 'en') {
    if (heading) heading.textContent = 'Smart Assistant';
    if (substatus) substatus.textContent = 'Ready for instant query';
    if (input) input.placeholder = 'Ask the AI assistant anything...';
  } else if (lang === 'fr') {
    if (heading) heading.textContent = 'Assistant Intelligent';
    if (substatus) substatus.textContent = 'Prêt pour réponse instantanée';
    if (input) input.placeholder = 'Posez votre question à l’assistant IA...';
  } else {
    if (heading) heading.textContent = 'المساعد الذكي';
    if (substatus) substatus.textContent = 'جاهز للإجابة الفورية';
    if (input) input.placeholder = 'اكتب استفسارك للمساعد الذكي...';
  }
}

/**
 * Render initial conversational prompt & suggested chips
 */
function renderInitialGreeting(context, lang) {
  let greetingText = '';
  let chips = [];

  if (context && context.profile) {
    const p = context.profile;
    const name = (lang === 'ar' && p.nameAr) ? p.nameAr : (lang === 'fr' && p.nameFr ? p.nameFr : p.name);

    if (lang === 'en') {
      greetingText = `Hello! I am Rawabit AI. How can I help you explore **${name}**'s verified research background, competencies, or collaboration details?`;
      chips = ['Summarize published papers', 'Verified specialties', 'Direct contact & collaboration'];
    } else if (lang === 'fr') {
      greetingText = `Bonjour ! Je suis l'IA Rawabit. Comment puis-je vous renseigner sur le parcours de **${name}**, ses compétences ou ses collaborations ?`;
      chips = ['Résumer les publications', 'Spécialités vérifiées', 'Contact et collaborations'];
    } else {
      greetingText = `مرحباً بك! أنا مساعد روابط الذكي. كيف يمكنني مساعدتك في استكشاف المسار المعتمد للباحث **${name}**، التخصصات الدقيقة، أو إمكانيات التعاون معه؟`;
      chips = ['ملخص الأبحاث والخبرات', 'التخصصات الدقيقة المعتمدة', 'مجالات الاستشارة والمشاريع'];
    }
  } else {
    if (lang === 'en') {
      greetingText = `Welcome to Rawabit AI Assistant! I can help you discover verified Algerian competencies across all 58 wilayas and evaluate specialized engineering domains.`;
      chips = ['Find AI experts in Algiers', 'Top solar energy researchers', 'How verification works in Rawabit'];
    } else if (lang === 'fr') {
      greetingText = `Bienvenue sur l'Assistant IA de Rawabit ! Je peux vous orienter vers les compétences algériennes vérifiées sur les 58 wilayas ou analyser des domaines techniques pointus.`;
      chips = ['Chercheurs IA à Alger', 'Experts en énergie solaire', 'Comment fonctionne la certification'];
    } else {
      greetingText = `أهلاً بك في المساعد الذكي لمنصة روابط! يمكنني إرشادك للوصول إلى أدق الكفاءات الجزائرية عبر الـ 58 ولاية، أو تقديم تحليلات حول المشاريع والخبرات الموثقة.`;
      chips = ['أبرز خبراء الذكاء الاصطناعي في الجزائر', 'كفاءات الطاقة المتجددة والهيدروجين', 'كيف يتم توثيق الكفاءات في روابط؟'];
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
        ${chips.map(c => `<button class="ai-chip-btn" data-query="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('')}
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
  const substatus = drawerElement.querySelector('#ai-drawer-substatus');
  const lang = store.state.lang;
  if (substatus) {
    substatus.textContent = lang === 'ar' ? 'جارٍ التحليل والتوليد...' : (lang === 'fr' ? 'Génération en cours...' : 'Analyzing & generating...');
  }

  // Create stream bubble
  const streamMsgDiv = document.createElement('div');
  streamMsgDiv.className = 'ai-msg ai-msg-assistant animate-fade-in';
  streamMsgDiv.innerHTML = `
    <div class="ai-msg-avatar">${AI_AVATAR_SVG}</div>
    <div class="ai-msg-body">
      <div class="ai-msg-bubble ai-bubble streaming" id="active-stream-bubble">
        <span class="ai-typing-indicator">
          <span></span><span></span><span></span>
        </span>
      </div>
    </div>
  `;
  container.appendChild(streamMsgDiv);
  scrollToBottom();

  const bubble = streamMsgDiv.querySelector('#active-stream-bubble');
  isStreaming = true;
  let accumulatedText = '';
  let hasReceivedTokens = false;

  // Build isolated context payload
  const payload = {
    query: queryText,
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

    if (!hasReceivedTokens && !accumulatedText) {
      accumulatedText = t('chat.defaultResponse') || (lang === 'ar' ? 'تمت معالجة استفسارك بنجاح وفق سجلات المنصة المعتمدة.' : 'Your query was processed successfully according to official records.');
      bubble.innerHTML = formatMarkdown(accumulatedText);
    }

    activeMessages.push({ role: 'assistant', content: accumulatedText });

  } catch (err) {
    bubble.innerHTML = `<span style="color:#DC2626;">${lang === 'ar' ? 'تعذر استلام الرد المباشر' : 'Unable to receive direct stream'}: ${escapeHtml(err.message)}</span>`;
  } finally {
    isStreaming = false;
    bubble.classList.remove('streaming');
    bubble.removeAttribute('id');
    if (substatus) {
      substatus.textContent = lang === 'ar' ? 'جاهز للإجابة الفورية' : (lang === 'fr' ? 'Prêt pour réponse' : 'Ready for instant query');
    }
    scrollToBottom();
  }
}

/**
 * Scroll chat messages viewport to bottom
 */
function scrollToBottom() {
  const container = drawerElement?.querySelector('#ai-chat-messages');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

/**
 * Robust HTML / Markdown Parser utilizing marked.js CDN with fallback
 */
function formatMarkdown(md) {
  if (!md) return '';

  if (typeof window !== 'undefined' && window.marked && typeof window.marked.parse === 'function') {
    try {
      return window.marked.parse(md, { gfm: true, breaks: true });
    } catch (e) {
      console.warn('marked.parse error:', e);
    }
  }

  // Fallback if marked is still loading
  let html = escapeHtml(md);
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  html = html.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');
  return html;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
