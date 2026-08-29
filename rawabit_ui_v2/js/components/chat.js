/**
 * Rawabit v2 — AI Assistant Chat Drawer Component
 * Luxury Saudi-Gov Tech Aesthetic · Real FastAPI RAG SSE Fetch Streaming · Zero Mock
 */

import { t } from '../i18n.js';
import { store, pushOverlay, popOverlay, isOverlayActive } from '../store.js';

let drawerElement = null;
let backdropElement = null;
let currentContext = null;
let isStreaming = false;

/**
 * Resolves the AI API URL across Vite, Webpack, window.ENV, and defaults
 */
function getAiApiUrl() {
  return (
    (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_AI_API_URL || import.meta.env.AI_API_URL)) ||
    (typeof window !== 'undefined' && window.ENV && (window.ENV.VITE_AI_API_URL || window.ENV.AI_API_URL)) ||
    (typeof window !== 'undefined' && window.__ENV__ && (window.__ENV__.VITE_AI_API_URL || window.__ENV__.AI_API_URL)) ||
    'http://localhost:8000/api/chat'
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
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
          </svg>
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
 * Open the AI Chat Drawer with specific context
 * @param {Object} context - Optional metadata (profile, search query, or wilaya guidance)
 */
export function openAIChat(context = null) {
  createChatDrawerDOM();
  currentContext = context;

  const lang = store.state.lang;
  updateHeaderTranslations(lang);

  // Render context strip if profile provided
  const contextStrip = drawerElement.querySelector('#ai-context-strip');
  if (context && context.profile) {
    const p = context.profile;
    const name = (lang === 'ar' && p.nameAr) ? p.nameAr : (lang === 'fr' && p.nameFr ? p.nameFr : p.name);
    const title = (lang === 'ar' && p.titleAr) ? p.titleAr : (lang === 'fr' && p.titleFr ? p.titleFr : p.title);
    
    contextStrip.innerHTML = `
      <div class="ai-context-badge">
        <div>
          <div class="ctx-name">${name}</div>
          <div class="ctx-title">${title}</div>
        </div>
        <span style="font-weight: 800; font-size: 0.85rem; color: var(--color-accent);">${p.reliability}% موثوقية</span>
      </div>
    `;
    contextStrip.style.display = 'block';
  } else {
    contextStrip.style.display = 'none';
  }

  // Populate Initial Greeting if messages empty
  const messagesContainer = drawerElement.querySelector('#ai-chat-messages');
  if (messagesContainer.children.length === 0) {
    renderInitialGreeting(context, lang);
  }

  pushOverlay('ai-chat');
  backdropElement.classList.add('active');
  drawerElement.classList.add('active');

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
      greetingText = `Hello! I am your AI assistant for Rawabit. How can I help you explore **${name}**'s research background, patents, or project collaboration availability?`;
      chips = ['Summarize published papers', 'Patents and inventions', 'Key contact and collaboration info'];
    } else if (lang === 'fr') {
      greetingText = `Bonjour ! Je suis votre assistant IA pour Rawabit. Comment puis-je vous renseigner sur le parcours de **${name}**, ses brevets ou ses disponibilités de recherche ?`;
      chips = ['Résumer les publications', 'Brevets et innovations', 'Contact et collaborations'];
    } else {
      greetingText = `مرحباً بك! أنا مساعدك الذكي في منصة روابط. كيف يمكنني مساعدتك في استكشاف المسار العلمي للباحث **${name}**، براءات الاختراع، أو إمكانيات التعاون الاستشاري معه؟`;
      chips = ['ملخص الأبحاث والمنشورات', 'براءات الاختراع المعتمدة', 'مجالات الاستشارة والمشاريع'];
    }
  } else {
    if (lang === 'en') {
      greetingText = `Welcome to Rawabit AI Assistant! I can help you find verified Algerian experts across all 58 wilayas, analyze specific engineering fields, or connect with national researchers.`;
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
  const messagesContainer = drawerElement.querySelector('#ai-chat-messages');
  const msgEl = document.createElement('div');
  msgEl.className = 'chat-msg user';
  msgEl.innerHTML = `
    <div class="msg-bubble">${escapeHtml(text)}</div>
    <span class="msg-time">${getCurrentTime()}</span>
  `;
  messagesContainer.appendChild(msgEl);
  scrollToBottom();
}

/**
 * Append static greeting AI message bubble
 */
function appendStaticAIMessage(fullText, suggestedChips = []) {
  const messagesContainer = drawerElement.querySelector('#ai-chat-messages');
  const msgEl = document.createElement('div');
  msgEl.className = 'chat-msg ai';

  const bubbleEl = document.createElement('div');
  bubbleEl.className = 'msg-bubble';
  bubbleEl.innerHTML = formatMarkdown(fullText);
  msgEl.appendChild(bubbleEl);

  const timeEl = document.createElement('span');
  timeEl.className = 'msg-time';
  timeEl.textContent = getCurrentTime();
  msgEl.appendChild(timeEl);

  if (suggestedChips && suggestedChips.length > 0) {
    renderChips(msgEl, suggestedChips);
  }

  messagesContainer.appendChild(msgEl);
  scrollToBottom();
}

/**
 * Render quick action chips under an AI message
 */
function renderChips(container, chips) {
  const chipsWrap = document.createElement('div');
  chipsWrap.className = 'ai-suggested-chips';

  chips.forEach(chipText => {
    const btn = document.createElement('button');
    btn.className = 'ai-chip-btn';
    btn.textContent = chipText;
    btn.addEventListener('click', () => {
      if (isStreaming) return;
      handleUserMessage(chipText);
    });
    chipsWrap.appendChild(btn);
  });

  container.appendChild(chipsWrap);
  scrollToBottom();
}

/**
 * Append pulsing 3-dot thinking indicator
 */
function showThinkingIndicator() {
  const messagesContainer = drawerElement.querySelector('#ai-chat-messages');
  if (drawerElement.querySelector('#ai-thinking-indicator')) return;

  const indicator = document.createElement('div');
  indicator.className = 'chat-msg ai';
  indicator.id = 'ai-thinking-indicator';
  indicator.innerHTML = `
    <div class="ai-typing-indicator">
      <span class="ai-typing-dot"></span>
      <span class="ai-typing-dot"></span>
      <span class="ai-typing-dot"></span>
    </div>
  `;
  messagesContainer.appendChild(indicator);
  scrollToBottom();
}

/**
 * Remove thinking indicator
 */
function removeThinkingIndicator() {
  const el = drawerElement?.querySelector('#ai-thinking-indicator');
  if (el) el.remove();
}

/**
 * Main User Message Dispatcher
 */
function handleUserMessage(userPrompt) {
  appendUserMessage(userPrompt);
  streamAIResponse(userPrompt, currentContext);
}

/**
 * ══════════════════════════════════════════════════════════════════
 * REAL FASTAPI / PYTHON RAG STREAMING (Fetch POST + ReadableStream)
 * ══════════════════════════════════════════════════════════════════
 * Asynchronously streams the AI response from the FastAPI / RAG backend via POST ReadableStream (SSE)
 * @param {string} userQuery - The message sent by the user
 * @param {Object} profileContext - Optional profile/wilaya context object
 */
export async function streamAIResponse(userQuery, profileContext) {
  const apiUrl = getAiApiUrl();
  const messagesContainer = drawerElement.querySelector('#ai-chat-messages');
  const sendBtn = drawerElement.querySelector('#ai-send-btn');

  // 1. Show Thinking pulsing dots immediately
  showThinkingIndicator();
  isStreaming = true;
  if (sendBtn) sendBtn.disabled = true;

  let aiMessageEl = null;
  let bubbleEl = null;
  let accumulatedText = '';
  let isFirstChunk = true;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream, application/json, text/plain'
      },
      body: JSON.stringify({
        query: userQuery,
        context: profileContext,
        lang: store.state.lang || 'ar'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI Backend responded with status ${response.status}: ${errorText}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported by browser or response body is empty.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      // Decode the streamed binary chunk to string
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // Extract lines from buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete trailing fragment in buffer

      for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        let content = '';

        // Handle SSE "data: " prefix if present
        if (line.startsWith('data:')) {
          const rawData = line.slice(5).trim();
          if (rawData === '[DONE]') {
            break;
          }
          try {
            const parsed = JSON.parse(rawData);
            content = parsed.delta || parsed.content || parsed.text || parsed.response || parsed.chunk || '';
          } catch (e) {
            content = rawData;
          }
        } else {
          // Standard chunked text
          content = line;
        }

        if (content) {
          // Remove thinking dots the exact moment the FIRST chunk arrives
          if (isFirstChunk) {
            removeThinkingIndicator();
            isFirstChunk = false;

            // Create AI Message DOM node
            aiMessageEl = document.createElement('div');
            aiMessageEl.className = 'chat-msg ai';

            bubbleEl = document.createElement('div');
            bubbleEl.className = 'msg-bubble';
            aiMessageEl.appendChild(bubbleEl);

            const timeEl = document.createElement('span');
            timeEl.className = 'msg-time';
            timeEl.textContent = getCurrentTime();
            aiMessageEl.appendChild(timeEl);

            messagesContainer.appendChild(aiMessageEl);
          }

          accumulatedText += content;
          if (bubbleEl) {
            bubbleEl.innerHTML = formatMarkdown(accumulatedText);
          }
          scrollToBottom();
        }
      }
    }

    // Process any remaining bytes in buffer
    if (buffer.trim()) {
      let finalChunk = buffer.trim();
      if (finalChunk.startsWith('data:')) {
        const rawData = finalChunk.slice(5).trim();
        if (rawData !== '[DONE]') {
          try {
            const parsed = JSON.parse(rawData);
            finalChunk = parsed.delta || parsed.content || parsed.text || parsed.response || '';
          } catch (e) {
            finalChunk = rawData;
          }
        } else {
          finalChunk = '';
        }
      }
      if (finalChunk) {
        if (isFirstChunk) {
          removeThinkingIndicator();
          isFirstChunk = false;

          aiMessageEl = document.createElement('div');
          aiMessageEl.className = 'chat-msg ai';

          bubbleEl = document.createElement('div');
          bubbleEl.className = 'msg-bubble';
          aiMessageEl.appendChild(bubbleEl);

          const timeEl = document.createElement('span');
          timeEl.className = 'msg-time';
          timeEl.textContent = getCurrentTime();
          aiMessageEl.appendChild(timeEl);

          messagesContainer.appendChild(aiMessageEl);
        }
        accumulatedText += finalChunk;
        if (bubbleEl) {
          bubbleEl.innerHTML = formatMarkdown(accumulatedText);
        }
      }
    }

  } catch (error) {
    console.error('[Rawabit AI Chat] Streaming error:', error);
    removeThinkingIndicator();

    // Render error message bubble
    const errorMsgEl = document.createElement('div');
    errorMsgEl.className = 'chat-msg ai';
    const lang = store.state.lang;
    const errorMsg = lang === 'ar'
      ? 'عذراً، تعذر الاتصال بخادم الذكاء الاصطناعي. يرجى التحقق من تشغيل واجهة البرمجة (FastAPI RAG Backend) أو إعداد متغير VITE_AI_API_URL.'
      : (lang === 'fr'
        ? 'Désolé, impossible de joindre le serveur IA. Veuillez vérifier le backend FastAPI RAG ou la variable VITE_AI_API_URL.'
        : 'Sorry, unable to connect to the AI backend. Please check that your FastAPI RAG server is running or set VITE_AI_API_URL.');

    errorMsgEl.innerHTML = `
      <div class="msg-bubble" style="background: rgba(220, 38, 38, 0.08); color: #B91C1C; border-color: rgba(220, 38, 38, 0.2);">
        ${errorMsg}
      </div>
      <span class="msg-time">${getCurrentTime()}</span>
    `;
    messagesContainer.appendChild(errorMsgEl);
  } finally {
    isStreaming = false;
    if (sendBtn) sendBtn.disabled = false;
    scrollToBottom();
  }
}

/**
 * Simple parser for bolding (**text**) and line breaks
 */
function formatMarkdown(str) {
  let formatted = escapeHtml(str);
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\n/g, '<br/>');
  return formatted;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
  const container = drawerElement?.querySelector('#ai-chat-messages');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}
