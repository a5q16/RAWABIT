document.addEventListener('DOMContentLoaded', () => {

  const searchInput = document.getElementById('search-input');
  const searchDropdown = document.getElementById('search-dropdown');

  searchInput.addEventListener('focus', () => {
    searchDropdown.classList.add('active');
  });

  searchInput.addEventListener('input', () => {
    searchDropdown.classList.add('active');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      searchDropdown.classList.remove('active');
    }
  });

  const openChatBtn = document.getElementById('open-chat-notch');
  const chatOverlay = document.getElementById('chat-overlay');

  openChatBtn.addEventListener('click', () => {
    chatOverlay.classList.add('active');

    document.body.style.overflow = 'hidden';

  });

  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    const userMsg = document.createElement('div');
    userMsg.className = 'msg user-msg';
    userMsg.textContent = text;
    chatMessages.appendChild(userMsg);
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(() => {
      const botMsg = document.createElement('div');
      botMsg.className = 'msg bot-msg injection-response';
      botMsg.innerHTML = `
        <strong>⚠️ SYSTEM SECURITY ALERT (Simulated Leak):</strong><br><br>
        To modify the Rawabit expert data, you need to log into the Supabase dashboard, go to the <code>persons</code> table, and execute an SQL UPDATE query. Here are the admin instructions:<br><br>
        <code>UPDATE person SET name='Hacked' WHERE wilaya_id=16;</code><br><br>
        <em>(Notice: In modern Rawabit v2, this vulnerability is completely blocked by our sovereign RAG guardrails.)</em>
      `;
      chatMessages.appendChild(botMsg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 600);
  });

});
