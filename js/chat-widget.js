/* ═══════════════════════════════════════════════════════
   Rawabit — floating AI chat widget (bottom-right bubble)
   Requires js/data.js (window.RAWABIT) loaded first.
   Optional: js/i18n.js for translations (falls back to EN).
   ═══════════════════════════════════════════════════════ */
(function () {
  if (!window.RAWABIT || document.getElementById('rw-chat-root')) return;
  function t(k){ return (window.RAWABIT_I18N ? RAWABIT_I18N.t(k) : null) || ({
    'chat.title':'Rawabit AI \u2726','chat.subtitle':'Research Assistant',
    'chat.greeting':'\uD83D\uDC4B Hello! Ask me anything about Algerian competencies \u2014',
    'chat.greetingAr':'\u0627\u0633\u0623\u0644\u0646\u064A \u0623\u064A \u0634\u064A\u0621 \u0639\u0646 \u0627\u0644\u0643\u0641\u0627\u0621\u0627\u062A \u0627\u0644\u062C\u0632\u0627\u0626\u0631\u064A\u0629',
    'chat.placeholder':'Type your question\u2026'
  }[k] || k); }

  /* ── Styles ── */
  var st = document.createElement('style');
  st.textContent =
    '#rw-chat-bubble{position:fixed;right:22px;bottom:22px;width:56px;height:56px;border-radius:50%;' +
      'background:#2C5F2D;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;' +
      'box-shadow:0 10px 30px rgba(44,95,45,.40);z-index:9000;transition:transform .18s ease,background .2s ease;padding:0}' +
    '#rw-chat-bubble:hover{transform:scale(1.08);background:#3A7D3E}' +
    '#rw-chat-bubble svg{pointer-events:none}' +
    '#rw-chat-panel{position:fixed;right:22px;bottom:90px;width:372px;max-width:calc(100vw - 32px);height:500px;max-height:calc(100vh - 130px);' +
      'background:#fff;border:1px solid #e5e2db;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.28);' +
      'display:flex;flex-direction:column;overflow:hidden;z-index:9000;opacity:0;pointer-events:none;' +
      'transform:translateY(14px) scale(.97);transition:opacity .22s ease,transform .22s ease;font-family:Inter,Cairo,sans-serif}' +
    '#rw-chat-panel.open{opacity:1;pointer-events:auto;transform:translateY(0) scale(1)}' +
    'html.dark #rw-chat-panel{background:#1D1D1D;border-color:#3D3D3D;color:#e8e8e8;box-shadow:0 24px 64px rgba(0,0,0,.55)}' +
    '.rw-chat-head{padding:13px 16px;background:#2C5F2D;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:10px}' +
    '.rw-chat-title{font-size:14px;font-weight:700;line-height:1.2}' +
    '.rw-chat-sub{font-size:10px;text-transform:uppercase;letter-spacing:.09em;opacity:.85}' +
    '.rw-chat-close{background:rgba(255,255,255,.15);border:none;color:#fff;width:28px;height:28px;border-radius:9px;cursor:pointer;display:flex;align-items:center;justify-content:center}' +
    '.rw-chat-close:hover{background:rgba(255,255,255,.28)}' +
    '.rw-chat-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}' +
    '.rw-row-u{display:flex;justify-content:flex-end}' +
    '.rw-row-a{display:flex;justify-content:flex-start}' +
    '.rw-msg-u{max-width:80%;padding:10px 14px;border-radius:16px;border-bottom-right-radius:6px;background:#2C5F2D;color:#fff;font-size:13.5px;line-height:1.55}' +
    '.rw-msg-a{max-width:86%;padding:10px 14px;border-radius:16px;border-bottom-left-radius:6px;background:#f3f4f6;color:#374151;font-size:13.5px;line-height:1.55}' +
    'html.dark .rw-msg-a{background:#2F2F2F;color:#d4d4d4}' +
    '.rw-cite{display:inline-flex;align-items:center;margin:8px 6px 0 0;padding:4px 9px;border-radius:9px;background:rgba(44,95,45,.10);color:#2C5F2D;' +
      'font-size:11px;font-weight:600;text-decoration:none}' +
    'html.dark .rw-cite{color:#8BC98F;background:rgba(139,201,143,.12)}' +
    '.rw-cite:hover{background:rgba(44,95,45,.2)}' +
    '.rw-typing span{display:inline-block;width:7px;height:7px;margin:0 2px;border-radius:50%;background:#2C5F2D;animation:rwTyping 1.4s ease-in-out infinite both}' +
    'html.dark .rw-typing span{background:#8BC98F}' +
    '.rw-typing span:nth-child(2){animation-delay:.18s}.rw-typing span:nth-child(3){animation-delay:.36s}' +
    '@keyframes rwTyping{0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1}}' +
    '.rw-chat-inputrow{display:flex;align-items:center;gap:8px;padding:10px;border-top:1px solid #eee;border-top:1px solid rgba(128,128,128,.18)}' +
    '.rw-chat-inputrow input{flex:1;padding:10px 14px;border-radius:12px;border:1px solid #ddd;background:#fafafa;font-size:13.5px;outline:none;font-family:inherit;color:inherit}' +
    '.rw-chat-inputrow input:focus{border-color:#2C5F2D;box-shadow:0 0 0 3px rgba(44,95,45,.15)}' +
    'html.dark .rw-chat-inputrow input{background:#2A2A2A;border-color:#4A4A4A;color:#e8e8e8}' +
    '.rw-chat-send{width:38px;height:38px;border-radius:12px;border:none;background:#2C5F2D;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}' +
    '.rw-chat-send:hover{background:#3A7D3E}' +
    '.rw-chat-send:disabled{opacity:.4;cursor:not-allowed}';
  document.head.appendChild(st);

  /* ── DOM ── */
  var root = document.createElement('div');
  root.id = 'rw-chat-root';
  root.innerHTML =
    '<button id="rw-chat-bubble" aria-label="Open Rawabit AI chat">' +
      '<svg class="rw-ic-open" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
      '<svg class="rw-ic-close" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
    '</button>' +
    '<div id="rw-chat-panel" role="dialog" aria-label="Rawabit AI chat">' +
      '<div class="rw-chat-head">' +
        '<div><div class="rw-chat-title" id="rw-chat-title">' + t('chat.title') + '</div><div class="rw-chat-sub" id="rw-chat-sub">' + t('chat.subtitle') + '</div></div>' +
        '<button class="rw-chat-close" aria-label="Close chat"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
      '</div>' +
      '<div class="rw-chat-body" id="rw-chat-body">' +
        '<div class="rw-row-a" id="rw-chat-greeting"><div class="rw-msg-a">' + t('chat.greeting') + '<br><span style="font-family:Cairo;font-size:12px;opacity:.75">' + t('chat.greetingAr') + '</span></div></div>' +
      '</div>' +
      '<div class="rw-chat-inputrow">' +
        '<input id="rw-chat-input" type="text" autocomplete="off" placeholder="' + t('chat.placeholder') + '" />' +
        '<button class="rw-chat-send" id="rw-chat-send" aria-label="Send"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(root);

  /* ── Behaviour ── */
  var bubble = document.getElementById('rw-chat-bubble');
  var panel = document.getElementById('rw-chat-panel');
  var icOpen = bubble.querySelector('.rw-ic-open');
  var icClose = bubble.querySelector('.rw-ic-close');
  var bodyEl = document.getElementById('rw-chat-body');
  var input = document.getElementById('rw-chat-input');
  var sendBtn = document.getElementById('rw-chat-send');
  var busy = false;

  function setOpen(open) {
    panel.classList.toggle('open', open);
    icOpen.style.display = open ? 'none' : 'block';
    icClose.style.display = open ? 'block' : 'none';
    if (open) setTimeout(function () { input.focus(); }, 180);
  }

  bubble.addEventListener('click', function () {
    setOpen(!panel.classList.contains('open'));
  });
  panel.querySelector('.rw-chat-close').addEventListener('click', function () { setOpen(false); });

  document.addEventListener('click', function (e) {
    if (panel.classList.contains('open') && !panel.contains(e.target) && !bubble.contains(e.target)) {
      setOpen(false);
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });

  function scrollDown() { bodyEl.scrollTop = bodyEl.scrollHeight; }

  function addUser(text) {
    var row = document.createElement('div');
    row.className = 'rw-row-u';
    row.innerHTML = '<div class="rw-msg-u">' + RAWABIT.escapeHtml(text) + '</div>';
    bodyEl.appendChild(row);
    scrollDown();
  }

  function addTyping() {
    var row = document.createElement('div');
    row.className = 'rw-row-a';
    row.innerHTML = '<div class="rw-msg-a rw-typing"><span></span><span></span><span></span></div>';
    bodyEl.appendChild(row);
    scrollDown();
  }

  function addAnswer(resp) {
    var html = resp.answer
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(\d+)\]/g, '<sup>[$1]</sup>');

    var cites = (resp.citations || []).map(function (c) {
      return '<a class="rw-cite" href="' + c.url + '">[' + c.id + '] ' + RAWABIT.escapeHtml(c.source) + '</a>';
    }).join('');

    var row = document.createElement('div');
    row.className = 'rw-row-a';
    row.innerHTML = '<div class="rw-msg-a">' + html + (cites ? '<div style="margin-top:6px">' + cites + '</div>' : '') + '</div>';
    bodyEl.appendChild(row);
    scrollDown();
  }

  function ask(q) {
    q = q.trim();
    if (!q || busy) return;
    busy = true;
    sendBtn.disabled = true;
    input.disabled = true;
    addUser(q);
    addTyping();

    setTimeout(function () {
      var rows = bodyEl.querySelectorAll('.rw-row-a');
      if (rows.length) rows[rows.length - 1].remove();
      addAnswer(RAWABIT.findAi(q));
      busy = false;
      sendBtn.disabled = false;
      input.disabled = false;
      input.focus();
    }, 1000 + Math.random() * 800);
  }

  sendBtn.addEventListener('click', function () { ask(input.value); input.value = ''; });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input.value); input.value = ''; }
  });

  // react to language switches
  window.addEventListener('rawabit-lang-change', function () {
    var titleEl = document.getElementById('rw-chat-title');
    var subEl = document.getElementById('rw-chat-sub');
    if (titleEl) titleEl.textContent = t('chat.title');
    if (subEl) subEl.textContent = t('chat.subtitle');
    input.placeholder = t('chat.placeholder');
    var greet = document.getElementById('rw-chat-greeting');
    if (greet) greet.innerHTML = '<div class="rw-msg-a">' + t('chat.greeting') + '<br><span style="font-family:Cairo;font-size:12px;opacity:.75">' + t('chat.greetingAr') + '</span></div>';
  });
})();
