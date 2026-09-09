/* ═══════════════════════════════════════════════════════════════════
   HACKYON — App Logic
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ══════════════════════════════════════════
   STATE
   ══════════════════════════════════════════ */
const State = {
  theme: localStorage.getItem('hk-theme') || 'system',
  sidebarCollapsed: localStorage.getItem('hk-sidebar') === 'true',
  chats: JSON.parse(localStorage.getItem('hk-chats') || '[]'),
  activeChatId: null,
  isGenerating: false,
  generationTimer: null,
  abortController: null,
  voiceTimer: null,
  voiceSeconds: 0,
  attachments: [],
  pendingDeleteId: null,
  model: localStorage.getItem('hk-model') || 'Techis AI',
  savedPrompts: JSON.parse(localStorage.getItem('hk-prompts') || 'null'),
};

/* ══════════════════════════════════════════
   DEFAULT PROMPTS
   ══════════════════════════════════════════ */
const DEFAULT_PROMPTS = [
  { id: 'p1', name: "I'm Feeling Anxious", text: "I've been feeling anxious and on edge lately. I can't seem to calm my mind. Can you help me work through this?" },
  { id: 'p2', name: "I Feel So Alone", text: "I've been feeling really isolated and lonely. It feels like no one truly understands me. Can we talk about it?" },
  { id: 'p3', name: "Dealing with Anger", text: "I've been feeling a lot of anger lately and I don't know how to handle it in a healthy way. Can you help?" },
  { id: 'p4', name: "Low Self-Worth", text: "I constantly feel like I'm not good enough, no matter what I do. How do I start to believe in myself again?" },
  { id: 'p5', name: "Processing Heartbreak", text: "I'm going through a painful breakup and I'm struggling to cope with the grief and emptiness. Please help me." },
  { id: 'p6', name: "Finding Inner Peace", text: "I feel restless and unsettled inside. I really want to find calm and inner peace. Where do I start?" },
];

if (!State.savedPrompts) {
  State.savedPrompts = DEFAULT_PROMPTS;
  _savePrompts();
}

/* ══════════════════════════════════════════
   DEMO AI RESPONSES
   ══════════════════════════════════════════ */
const AI_RESPONSES = [
  `Thank you for trusting me with this. What you're feeling right now is completely valid, and it takes real courage to reach out.

Feeling overwhelmed often happens when our mind is carrying more than it feels equipped to handle at once. It doesn't mean you're weak — it means you're human.

Here are a few gentle things that might help in this moment:

- **Pause and breathe** — Take 3 slow, deep breaths. Inhale for 4 counts, hold for 4, exhale for 6. This signals your nervous system to calm down.
- **Name what you're feeling** — Simply saying "I feel anxious" or "I feel exhausted" can reduce the intensity of the emotion.
- **One small thing** — Instead of looking at everything at once, ask yourself: what is the one smallest thing I can do right now?

You don't have to fix everything today. I'm here with you, one step at a time. Would you like to talk about what's been feeling most heavy lately?`,

  `I'm really glad you reached out. You don't have to carry this alone.

Sometimes the most healing thing we can do is simply allow ourselves to be heard — without judgment, without pressure, without having to perform okay-ness for anyone.

I want you to know this is a safe space. Whatever you're going through — whether it's sadness, confusion, grief, loneliness, or something you can't even name yet — it's welcome here.

**You don't need to have it all figured out.** Just start wherever feels natural. You could tell me:

- What's been on your mind lately?
- When did things start feeling this way?
- Is there one moment this week that felt especially hard?

I'm not going anywhere. Take your time. 💙`,

  `What you're feeling makes a lot of sense. Negative self-talk and self-doubt are incredibly common, but that doesn't make them any less painful to live with.

Often, self-doubt is not a reflection of reality — it's a protective pattern your mind developed, usually during difficult experiences earlier in life.

Here are some gentle first steps toward rebuilding confidence:

- **Notice the inner critic** — When a negative thought appears, try to name it: *"There's that critical voice again."* Creating distance from it weakens its grip.
- **Challenge the story** — Ask yourself: *"Would I say this to a friend in the same situation?"* If not, you deserve the same kindness you'd give them.
- **Collect small wins** — Keep a daily note of even the tiniest things you did well. Over time, this rewires how you see yourself.
- **Speak to yourself with compassion** — Replace "I'm not good enough" with "I'm doing my best, and that is enough."

Recovery isn't linear, and it doesn't happen overnight. But every moment of self-awareness is a step forward. What's one area where you most struggle with self-doubt?`,

  `I'm so sorry for your loss. Grief is one of the heaviest things a person can carry, and there's no right or wrong way to move through it.

Please know this: **grieving is not weakness. It is love with nowhere left to go.**

What you're experiencing might feel like waves — sometimes manageable, sometimes completely overwhelming. That's normal. Grief doesn't follow a straight line, and healing doesn't mean forgetting.

A few things that may gently support you:

- **Give yourself permission to feel** — Suppressing grief delays healing. Let the tears come when they need to.
- **Talk about them** — Saying the name of who you've lost, sharing a memory, keeps their presence alive in a meaningful way.
- **Be patient with yourself** — Grief has no deadline. You're allowed to still be hurting, even if others think "enough time has passed."
- **Reach out** — Whether to a friend, a support group, or simply here — connection is one of the most powerful healers.

I'm here to listen whenever you need. Would you like to share something about who or what you've lost?`,

  `It sounds like you're going through something really difficult right now, and I want you to know — **your feelings matter, and you matter.**

Sometimes when we're in emotional pain, it can feel like it will never end. But feelings, even the most intense ones, are temporary. They move through us when we allow them to.

A gentle reminder for this moment:

- You have survived every hard day so far. That is 100% of your hard days.
- Healing isn't always visible. Sometimes it happens quietly, in ways you can only see looking back.
- Asking for support — like you're doing right now — is one of the bravest and most self-aware things a person can do.

I'm here to walk through this with you, at whatever pace feels right. What would feel most helpful to you today — to vent, to explore what you're feeling, or to find some calming strategies?`,
];

/* ══════════════════════════════════════════
   UTILITY HELPERS
   ══════════════════════════════════════════ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const uid = () => Math.random().toString(36).slice(2, 10);

function _saveChats() {
  localStorage.setItem('hk-chats', JSON.stringify(State.chats));
}

function _savePrompts() {
  localStorage.setItem('hk-prompts', JSON.stringify(State.savedPrompts));
}

function formatTime(date) {
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(date);
}

/* ══════════════════════════════════════════
   THEME
   ══════════════════════════════════════════ */
function applyTheme(theme) {
  State.theme = theme;
  localStorage.setItem('hk-theme', theme);

  const root = document.documentElement;
  const sunIcon = $('#theme-toggle-btn .icon-sun');
  const moonIcon = $('#theme-toggle-btn .icon-moon');

  let resolved = theme;
  if (theme === 'system') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  root.setAttribute('data-theme', resolved);

  if (sunIcon && moonIcon) {
    sunIcon.style.display = resolved === 'dark' ? 'none' : 'block';
    moonIcon.style.display = resolved === 'dark' ? 'block' : 'none';
  }

  // Update settings theme options if open
  $$('.theme-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.theme === theme);
  });
}

// Listen for OS theme changes when in system mode
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (State.theme === 'system') applyTheme('system');
});

/* ══════════════════════════════════════════
   TOAST NOTIFICATIONS
   ══════════════════════════════════════════ */
function showToast(message, { type = 'success', action = null, onAction = null, duration = 2500 } = {}) {
  const container = $('#toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');

  const iconSvg = type === 'success'
    ? `<svg class="toast-icon lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
    : `<svg class="toast-icon error lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`;

  toast.innerHTML = `${iconSvg}<span>${message}</span>`;

  if (action && onAction) {
    const btn = document.createElement('button');
    btn.className = 'toast-action';
    btn.textContent = action;
    btn.addEventListener('click', () => {
      onAction();
      dismissToast(toast);
    });
    toast.appendChild(btn);
  }

  container.appendChild(toast);

  const timer = setTimeout(() => dismissToast(toast), duration);
  toast._timer = timer;

  return toast;
}

function dismissToast(toast) {
  if (!toast || toast._dismissed) return;
  toast._dismissed = true;
  clearTimeout(toast._timer);
  toast.classList.add('hiding');
  toast.addEventListener('animationend', () => toast.remove(), { once: true });
}

/* ══════════════════════════════════════════
   SIDEBAR
   ══════════════════════════════════════════ */
function initSidebar() {
  const sidebar = $('#sidebar');
  const overlay = $('#sidebar-overlay');
  const isMobile = () => window.innerWidth <= 768;

  function toggleSidebar() {
    if (isMobile()) {
      const isOpen = sidebar.classList.contains('mobile-open');
      sidebar.classList.toggle('mobile-open', !isOpen);
      overlay.classList.toggle('active', !isOpen);
    } else {
      State.sidebarCollapsed = !State.sidebarCollapsed;
      sidebar.classList.toggle('collapsed', State.sidebarCollapsed);
      localStorage.setItem('hk-sidebar', State.sidebarCollapsed);
    }
  }

  // Restore sidebar state
  if (!isMobile() && State.sidebarCollapsed) {
    sidebar.classList.add('collapsed');
  }

  $('#sidebar-toggle').addEventListener('click', toggleSidebar);
  $('#topbar-sidebar-toggle').addEventListener('click', toggleSidebar);
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
  });

  window.addEventListener('resize', () => {
    if (!isMobile()) {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('active');
    }
  });
}

/* ══════════════════════════════════════════
   CHAT MANAGEMENT
   ══════════════════════════════════════════ */
function createChat(title = 'New Conversation') {
  const chat = {
    id: uid(),
    title,
    messages: [],
    pinned: false,
    archived: false,
    createdAt: Date.now(),
    bucket: 'today',
  };
  State.chats.unshift(chat);
  _saveChats();
  return chat;
}

function getActiveChat() {
  return State.chats.find(c => c.id === State.activeChatId) || null;
}

function switchChat(id) {
  State.activeChatId = id;
  renderMessages();
  renderSidebar();
  closeMobileSidebar();
}

function closeMobileSidebar() {
  if (window.innerWidth <= 768) {
    $('#sidebar').classList.remove('mobile-open');
    $('#sidebar-overlay').classList.remove('active');
  }
}

function startNewChat() {
  const chat = createChat();
  State.activeChatId = chat.id;
  renderSidebar();
  renderMessages();
  $('#chat-input').focus();
  closeMobileSidebar();
}

/* ── Sidebar rendering ── */
function renderSidebar() {
  const pinned = State.chats.filter(c => c.pinned && !c.archived);
  const today = State.chats.filter(c => !c.pinned && !c.archived && c.bucket === 'today');
  const yesterday = State.chats.filter(c => !c.pinned && !c.archived && c.bucket === 'yesterday');
  const week = State.chats.filter(c => !c.pinned && !c.archived && c.bucket === 'week');

  const pinnedGroup = $('#pinned-group');
  pinnedGroup.style.display = pinned.length ? '' : 'none';
  renderChatList($('#pinned-list'), pinned);
  renderChatList($('#today-list'), today);
  renderChatList($('#yesterday-list'), yesterday);
  renderChatList($('#week-list'), week);

  $('#today-group').style.display = today.length ? '' : 'none';
  $('#yesterday-group').style.display = yesterday.length ? '' : 'none';
  $('#week-group').style.display = week.length ? '' : 'none';
}

function renderChatList(ul, chats) {
  ul.innerHTML = '';
  chats.forEach(chat => {
    const li = document.createElement('li');
    li.className = 'chat-item' + (chat.id === State.activeChatId ? ' active' : '');
    li.dataset.id = chat.id;
    li.setAttribute('role', 'listitem');
    li.innerHTML = `
      <svg class="chat-icon lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <span class="chat-item-title">${escHtml(chat.title)}</span>
      ${chat.pinned ? `<svg class="chat-item-pin lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>` : ''}
      <div class="chat-item-actions">
        <button class="chat-item-btn ctx-trigger" title="More options" aria-label="Chat options">
          <svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
        </button>
      </div>
    `;

    li.addEventListener('click', e => {
      if (e.target.closest('.ctx-trigger')) return;
      switchChat(chat.id);
    });

    li.querySelector('.ctx-trigger').addEventListener('click', e => {
      e.stopPropagation();
      openContextMenu(e, chat.id);
    });

    li.addEventListener('contextmenu', e => {
      e.preventDefault();
      openContextMenu(e, chat.id);
    });

    ul.appendChild(li);
  });
}

/* ── Search chats ── */
function initChatSearch() {
  const input = $('#chat-search');
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { renderSidebar(); return; }

    const results = State.chats.filter(c =>
      !c.archived && c.title.toLowerCase().includes(q)
    );

    // Render all matching in today-list, hide others
    $('#pinned-group').style.display = 'none';
    $('#today-group').style.display = results.length ? '' : 'none';
    $('#yesterday-group').style.display = 'none';
    $('#week-group').style.display = 'none';
    renderChatList($('#today-list'), results);
  });
}

/* ── Context menu ── */
let _ctxChatId = null;

function openContextMenu(e, chatId) {
  _ctxChatId = chatId;
  const menu = $('#chat-context-menu');
  menu.style.display = 'block';

  const chat = State.chats.find(c => c.id === chatId);
  const pinBtn = menu.querySelector('[data-action="pin"]');
  pinBtn.querySelector('svg').style.color = chat.pinned ? 'var(--indigo)' : '';
  pinBtn.childNodes[pinBtn.childNodes.length - 1].textContent = chat.pinned ? ' Unpin' : ' Pin';

  // Position
  const vw = window.innerWidth, vh = window.innerHeight;
  let x = e.clientX, y = e.clientY;
  menu.style.opacity = '0';
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  requestAnimationFrame(() => {
    const rect = menu.getBoundingClientRect();
    if (x + rect.width > vw - 8) x = vw - rect.width - 8;
    if (y + rect.height > vh - 8) y = vh - rect.height - 8;
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.style.opacity = '';
  });
}

function closeContextMenu() {
  $('#chat-context-menu').style.display = 'none';
  _ctxChatId = null;
}

function initContextMenu() {
  const menu = $('#chat-context-menu');

  menu.addEventListener('click', e => {
    const item = e.target.closest('.ctx-item');
    if (!item || !_ctxChatId) return;
    const action = item.dataset.action;
    handleChatAction(action, _ctxChatId);
    closeContextMenu();
  });

  document.addEventListener('click', e => {
    if (!menu.contains(e.target)) closeContextMenu();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeContextMenu();
  });
}

function handleChatAction(action, chatId) {
  const chat = State.chats.find(c => c.id === chatId);
  if (!chat) return;

  switch (action) {
    case 'rename':
      startInlineRename(chatId);
      break;
    case 'pin':
      chat.pinned = !chat.pinned;
      _saveChats();
      renderSidebar();
      showToast(chat.pinned ? 'Conversation pinned' : 'Conversation unpinned');
      break;
    case 'duplicate': {
      const copy = { ...chat, id: uid(), title: chat.title + ' (copy)', createdAt: Date.now() };
      State.chats.unshift(copy);
      _saveChats();
      renderSidebar();
      showToast('Conversation duplicated');
      break;
    }
    case 'archive':
      chat.archived = true;
      if (State.activeChatId === chatId) {
        State.activeChatId = null;
        renderMessages();
      }
      _saveChats();
      renderSidebar();
      showToast('Conversation archived');
      break;
    case 'delete':
      State.pendingDeleteId = chatId;
      openModal('#delete-modal');
      break;
  }
}

function startInlineRename(chatId) {
  const item = $(`.chat-item[data-id="${chatId}"]`);
  if (!item) return;
  const titleSpan = item.querySelector('.chat-item-title');
  const chat = State.chats.find(c => c.id === chatId);
  const input = document.createElement('input');
  input.className = 'chat-item-rename';
  input.value = chat.title;
  titleSpan.replaceWith(input);
  input.focus();
  input.select();

  function commit() {
    const val = input.value.trim();
    if (val) {
      chat.title = val;
      _saveChats();
      showToast('Conversation renamed');
    }
    renderSidebar();
  }

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { input.value = chat.title; input.blur(); }
  });
}

/* ══════════════════════════════════════════
   MESSAGE RENDERING
   ══════════════════════════════════════════ */
function renderMessages() {
  const chat = getActiveChat();
  const welcomeScreen = $('#welcome-screen');
  const messagesList = $('#messages-list');

  if (!chat || chat.messages.length === 0) {
    welcomeScreen.style.display = 'flex';
    messagesList.innerHTML = '';
    return;
  }

  welcomeScreen.style.display = 'none';
  messagesList.innerHTML = '';

  chat.messages.forEach((msg, idx) => {
    const el = buildMessageEl(msg, idx);
    el.style.animationDelay = '0ms'; // no stagger on load
    el.style.opacity = '1';
    el.style.transform = 'none';
    messagesList.appendChild(el);
  });

  scrollToBottom(false);
}

function buildMessageEl(msg, idx) {
  const div = document.createElement('div');
  div.className = `message ${msg.role}`;
  div.dataset.id = msg.id;

  if (msg.role === 'user') {
    div.innerHTML = `
      <div class="msg-bubble">${escHtml(msg.content)}</div>
      <div class="msg-actions">
        <button class="msg-action-btn" data-action="copy" aria-label="Copy message">
          <svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          Copy
        </button>
        <button class="msg-action-btn" data-action="edit" aria-label="Edit message">
          <svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          Edit
        </button>
      </div>
    `;
  } else {
    div.innerHTML = `
      <div class="ai-header">
        <div class="ai-avatar">
          <svg class="logo-svg" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:28px;height:28px">
            <rect x="4" y="4" width="40" height="40" rx="12" fill="#111111"/>
            <path d="M12 14h24v4H28v16h-8V18H12z" fill="#FFFFFF"/>
            <circle cx="35" cy="13" r="3" fill="#6366F1"/>
          </svg>
        </div>
        <span class="ai-name">Techis AI</span>
      </div>
      <div class="msg-body">${renderMarkdown(msg.content)}</div>
      <div class="msg-actions">
        <button class="msg-action-btn" data-action="copy" aria-label="Copy response">
          <svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          Copy
        </button>
        <button class="msg-action-btn" data-action="like" aria-label="Like response">
          <svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
        </button>
        <button class="msg-action-btn" data-action="dislike" aria-label="Dislike response">
          <svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/></svg>
        </button>
        <button class="msg-action-btn" data-action="regenerate" aria-label="Regenerate response">
          <svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
          Regenerate
        </button>
        <button class="msg-action-btn" data-action="read-aloud" aria-label="Read aloud">
          <svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
        </button>
      </div>
      <div class="ai-suggestions">
        <button class="suggestion-btn" data-suggestion="I'd like to talk more about this">Tell me more</button>
        <button class="suggestion-btn" data-suggestion="Can you give me a calming exercise to try right now?">Calm me down</button>
        <button class="suggestion-btn" data-suggestion="What are some steps I can take to start feeling better?">Next steps</button>
        <button class="suggestion-btn" data-suggestion="I just need to vent, can you listen?">I need to vent</button>
      </div>
    `;
  }

  return div;
}

/* ── Simple Markdown Renderer ── */
function renderMarkdown(text) {
  // Escape HTML first, then apply markdown
  let out = escHtml(text);

  // Code blocks
  out = out.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const langLabel = lang || 'code';
    return `<div class="code-block">
      <div class="code-header">
        <span class="code-lang">${escHtml(langLabel)}</span>
        <button class="code-copy-btn" onclick="copyCode(this)">
          <svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          Copy
        </button>
      </div>
      <div class="code-content">${code.trim()}</div>
    </div>`;
  });

  // Inline code
  out = out.replace(/`([^`]+)`/g, '<code style="font-family:monospace;background:var(--surface-2);padding:1px 5px;border-radius:4px;font-size:0.9em">$1</code>');

  // Bold
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Headers
  out = out.replace(/^### (.+)$/gm, '<h4 style="font-size:14px;font-weight:600;margin:12px 0 6px">$1</h4>');
  out = out.replace(/^## (.+)$/gm, '<h3 style="font-size:16px;font-weight:600;margin:14px 0 8px">$1</h3>');
  out = out.replace(/^# (.+)$/gm, '<h2 style="font-size:18px;font-weight:700;margin:16px 0 8px">$1</h2>');

  // Numbered list
  out = out.replace(/^\d+\. (.+)$/gm, '<li style="margin:4px 0;padding-left:4px">$1</li>');
  out = out.replace(/(<li[^>]*>.*<\/li>\n?)+/g, m => `<ol style="padding-left:20px;margin:8px 0">${m}</ol>`);

  // Bullet list
  out = out.replace(/^- (.+)$/gm, '<li style="margin:4px 0;padding-left:4px">$1</li>');
  out = out.replace(/(<li[^>]*>.*<\/li>\n?)+/g, m => {
    if (m.startsWith('<ol')) return m;
    return `<ul style="padding-left:20px;margin:8px 0">${m}</ul>`;
  });

  // Paragraphs (double newlines)
  out = out.split(/\n\n+/).map(p => {
    if (p.startsWith('<')) return p;
    return `<p style="margin:0 0 10px">${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  return out;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── Message actions delegation ── */
function initMessageActions() {
  const list = $('#messages-list');

  list.addEventListener('click', e => {
    const btn = e.target.closest('.msg-action-btn');
    const sugBtn = e.target.closest('.suggestion-btn');

    if (sugBtn) {
      setInput(sugBtn.dataset.suggestion);
      return;
    }

    if (!btn) return;
    const action = btn.dataset.action;
    const msgEl = btn.closest('.message');
    const msgId = msgEl?.dataset.id;
    const chat = getActiveChat();
    const msg = chat?.messages.find(m => m.id === msgId);

    switch (action) {
      case 'copy': {
        const content = msg?.content || msgEl?.querySelector('.msg-bubble, .msg-body')?.textContent || '';
        copyToClipboard(content, btn);
        break;
      }
      case 'like':
        btn.classList.toggle('liked');
        btn.closest('.msg-actions').querySelector('[data-action="dislike"]')?.classList.remove('disliked');
        break;
      case 'dislike':
        btn.classList.toggle('disliked');
        btn.closest('.msg-actions').querySelector('[data-action="like"]')?.classList.remove('liked');
        break;
      case 'regenerate':
        if (!State.isGenerating) simulateAIResponse(true);
        break;
      case 'read-aloud':
        if (msg) readAloud(msg.content);
        break;
      case 'edit':
        if (msg) editUserMessage(msg, msgEl);
        break;
    }
  });
}

function editUserMessage(msg, msgEl) {
  const bubble = msgEl.querySelector('.msg-bubble');
  const input = document.createElement('textarea');
  input.value = msg.content;
  input.style.cssText = `width:100%;min-height:80px;padding:10px 14px;border-radius:var(--r-xl) var(--r-xl) var(--r-sm) var(--r-xl);border:2px solid var(--indigo);background:var(--accent);color:var(--accent-fg);font:inherit;resize:none;outline:none;`;
  bubble.replaceWith(input);
  input.focus();

  function commit() {
    const val = input.value.trim();
    if (val) {
      msg.content = val;
      _saveChats();
    }
    const newBubble = document.createElement('div');
    newBubble.className = 'msg-bubble';
    newBubble.textContent = msg.content;
    input.replaceWith(newBubble);
  }

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { input.value = msg.content; input.blur(); }
  });
}

function readAloud(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text.replace(/[#*`]/g, ''));
    window.speechSynthesis.speak(utt);
    showToast('Reading aloud…');
  } else {
    showToast('Text-to-speech not supported in this browser', { type: 'error' });
  }
}

/* ── Copy helpers ── */
function copyToClipboard(text, btn = null) {
  navigator.clipboard.writeText(text).then(() => {
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = `<svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px"><polyline points="20 6 9 17 4 12"/></svg> Copied`;
      setTimeout(() => { btn.innerHTML = orig; }, 2000);
    }
    showToast('Copied to clipboard');
  }).catch(() => showToast('Could not copy', { type: 'error' }));
}

window.copyCode = function(btn) {
  const block = btn.closest('.code-block');
  const code = block?.querySelector('.code-content')?.textContent || '';
  copyToClipboard(code, btn);
};

/* ══════════════════════════════════════════
   SEND & GENERATE
   ══════════════════════════════════════════ */
function initInput() {
  const textarea = $('#chat-input');
  const sendBtn = $('#send-btn');
  const charCounter = $('#char-counter');
  const MAX = 10000;

  textarea.addEventListener('input', () => {
    autoResizeTextarea(textarea);
    const len = textarea.value.length;
    sendBtn.disabled = len === 0 || State.isGenerating;

    if (len > 500) {
      charCounter.style.display = 'inline';
      charCounter.textContent = `${len.toLocaleString()} / ${MAX.toLocaleString()}`;
      charCounter.style.color = len > MAX * 0.9 ? 'var(--danger)' : 'var(--text-2)';
    } else {
      charCounter.style.display = 'none';
    }
  });

  textarea.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) sendMessage();
    }
  });

  sendBtn.addEventListener('click', () => {
    if (State.isGenerating) {
      stopGeneration();
    } else {
      sendMessage();
    }
  });
}

function autoResizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 240) + 'px';
}

function setInput(text) {
  const textarea = $('#chat-input');
  textarea.value = text;
  autoResizeTextarea(textarea);
  textarea.focus();
  $('#send-btn').disabled = false;
}

function sendMessage() {
  const textarea = $('#chat-input');
  const content = textarea.value.trim();
  if (!content) return;

  // Create chat if none
  if (!State.activeChatId) {
    const chat = createChat(content.slice(0, 48) + (content.length > 48 ? '…' : ''));
    State.activeChatId = chat.id;
  } else {
    // Update title if it's still default
    const chat = getActiveChat();
    if (chat.title === 'New Conversation' && chat.messages.length === 0) {
      chat.title = content.slice(0, 48) + (content.length > 48 ? '…' : '');
    }
  }

  // Clear input
  textarea.value = '';
  autoResizeTextarea(textarea);
  $('#send-btn').disabled = true;
  $('#char-counter').style.display = 'none';

  // Hide welcome screen
  $('#welcome-screen').style.display = 'none';

  // Add user message
  const userMsg = { id: uid(), role: 'user', content, ts: Date.now(), attachments: [...State.attachments] };
  getActiveChat().messages.push(userMsg);
  _saveChats();
  State.attachments = [];
  $('#attachment-previews').innerHTML = '';

  // Append user message element
  appendMessage(userMsg);
  renderSidebar();

  // Begin AI simulation
  simulateAIResponse(false);
}

function appendMessage(msg, animate = true) {
  const list = $('#messages-list');
  const el = buildMessageEl(msg);
  if (!animate) {
    el.style.animationDelay = '0ms';
    el.style.opacity = '1';
    el.style.transform = 'none';
  }
  list.appendChild(el);
  scrollToBottom(true);
  return el;
}

const AI_STATES = ['Thinking…', 'Searching…', 'Analyzing…', 'Generating…', 'Finalizing…'];

async function simulateAIResponse(isRegen = false) {
  if (State.isGenerating) return;
  State.isGenerating = true;

  const sendBtn = $('#send-btn');
  sendBtn.disabled = false;
  sendBtn.querySelector('.icon-send').style.display = 'none';
  sendBtn.querySelector('.icon-stop').style.display = 'block';

  const list = $('#messages-list');

  // Remove last AI message if regenerating
  if (isRegen) {
    const msgs = list.querySelectorAll('.message.ai');
    if (msgs.length) msgs[msgs.length - 1].remove();
    const chat = getActiveChat();
    if (chat) {
      const last = chat.messages[chat.messages.length - 1];
      if (last?.role === 'ai') chat.messages.pop();
    }
  }

  // Show typing indicator
  const typingEl = document.createElement('div');
  typingEl.className = 'message ai';
  typingEl.id = 'typing-message';
  typingEl.innerHTML = `
    <div class="ai-header">
      <div class="ai-avatar">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:28px;height:28px">
          <rect x="4" y="4" width="40" height="40" rx="12" fill="#111111"/>
          <path d="M12 14h24v4H28v16h-8V18H12z" fill="#FFFFFF"/>
          <circle cx="35" cy="13" r="3" fill="#6366F1"/>
        </svg>
      </div>
      <span class="ai-name">Techis AI</span>
      <span class="ai-state" id="ai-state-label">Thinking…</span>
    </div>
    <div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  list.appendChild(typingEl);
  scrollToBottom(true);

  const stateLabel = typingEl.querySelector('#ai-state-label');
  let stateIdx = 0;
  const stateInterval = setInterval(() => {
    stateIdx = (stateIdx + 1) % AI_STATES.length;
    if (stateLabel) stateLabel.textContent = AI_STATES[stateIdx];
  }, 700);

  const chat = getActiveChat();
  if (!chat) {
    clearInterval(stateInterval);
    typingEl.remove();
    finishGeneration();
    return;
  }

  // Send the full conversation to the cloud Ollama proxy.
  // The proxy is same-origin when the Colab server serves this UI.
  const apiBase = window.HACKYON_API_URL || '';
  const messages = chat.messages
    .filter(m => m.role === 'user' || m.role === 'ai' || m.role === 'assistant')
    .map(m => ({
      role: m.role === 'ai' ? 'assistant' : m.role,
      content: m.content || ''
    }));

  const endpoint = `${apiBase}/api/chat`;
  State.abortController = new AbortController();

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal: State.abortController.signal
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(detail || `Cloud AI returned HTTP ${response.status}`);
    }
    if (!response.body) throw new Error('Streaming is not supported by this browser.');

    clearInterval(stateInterval);
    typingEl.remove();

    const aiMsg = { id: uid(), role: 'ai', content: '', ts: Date.now() };
    chat.messages.push(aiMsg);
    const aiEl = appendMessage(aiMsg, false);
    const contentEl = aiEl.querySelector('.msg-body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const renderStreamingText = () => {
      if (contentEl) {
        contentEl.textContent = aiMsg.content;
        // Re-run the app's renderer for markdown/code formatting when available.
        try {
          if (typeof renderMarkdown === 'function') contentEl.innerHTML = renderMarkdown(aiMsg.content);
        } catch (_) {}
      }
      scrollToBottom(true);
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        let data;
        try { data = JSON.parse(line); } catch (_) { continue; }
        if (data.error) throw new Error(data.error);
        if (data.message?.content) {
          aiMsg.content += data.message.content;
          renderStreamingText();
        }
        if (data.done) break;
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer);
        if (data.message?.content) aiMsg.content += data.message.content;
      } catch (_) {}
    }

    if (!aiMsg.content.trim()) aiMsg.content = 'The model returned an empty response.';
    _saveChats();
    renderMessages();
    showToast('Response generated');
  } catch (err) {
    clearInterval(stateInterval);
    if (err?.name === 'AbortError') {
      // User pressed Stop; keep the partial response if one was already saved.
    } else {
      console.error('Cloud AI error:', err);
      typingEl.remove();
      const errorMsg = {
        id: uid(),
        role: 'ai',
        content: `⚠️ **Cloud AI connection failed.**\n\n${err?.message || 'Unknown error'}\n\nMake sure the Colab Ollama server and cloud proxy are running.`,
        ts: Date.now()
      };
      chat.messages.push(errorMsg);
      appendMessage(errorMsg);
      _saveChats();
      showToast('Cloud AI connection failed', { type: 'error' });
    }
  } finally {
    clearInterval(stateInterval);
    State.abortController = null;
    const typing = $('#typing-message');
    if (typing) typing.remove();
    _saveChats();
    finishGeneration();
  }
}

function stopGeneration() {
  if (!State.isGenerating) return;
  clearTimeout(State.generationTimer);
  if (State.abortController) State.abortController.abort();
  State.isGenerating = false;

  const typingEl = $('#typing-message');
  if (typingEl) typingEl.remove();

  finishGeneration();
  showToast('Generation stopped');
}

function finishGeneration() {
  State.isGenerating = false;
  const sendBtn = $('#send-btn');
  sendBtn.disabled = $('#chat-input').value.trim().length === 0;
  sendBtn.querySelector('.icon-send').style.display = 'block';
  sendBtn.querySelector('.icon-stop').style.display = 'none';
  renderSidebar();
}

/* ══════════════════════════════════════════
   SCROLL
   ══════════════════════════════════════════ */
function scrollToBottom(smooth = true) {
  const vp = $('#chat-viewport');
  vp.scrollTo({ top: vp.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
}

function initScrollToBottom() {
  const vp = $('#chat-viewport');
  const btn = $('#scroll-bottom-btn');

  vp.addEventListener('scroll', () => {
    const atBottom = vp.scrollHeight - vp.scrollTop - vp.clientHeight < 100;
    btn.style.display = atBottom ? 'none' : 'flex';
    btn.classList.toggle('visible', !atBottom);
  });

  btn.addEventListener('click', () => scrollToBottom(true));
}

/* ══════════════════════════════════════════
   FILE ATTACHMENTS
   ══════════════════════════════════════════ */
function initFileAttachments() {
  const attachBtn = $('#attach-btn');
  const fileInput = $('#file-input');
  const chatViewport = $('#chat-viewport');
  const dragOverlay = $('#drag-overlay');

  attachBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => handleFiles(fileInput.files));

  // Drag & drop
  let dragCounter = 0;

  ['dragenter', 'dragover'].forEach(evt => {
    chatViewport.addEventListener(evt, e => {
      e.preventDefault();
      dragCounter++;
      dragOverlay.classList.add('active');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    chatViewport.addEventListener(evt, e => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        dragOverlay.classList.remove('active');
      }
      if (evt === 'drop' && e.dataTransfer?.files.length) {
        handleFiles(e.dataTransfer.files);
      }
    });
  });
}

function handleFiles(files) {
  Array.from(files).forEach(file => {
    const id = uid();
    State.attachments.push({ id, file });
    renderAttachment({ id, file });
    showToast(`${file.name} attached`);
  });
}

function renderAttachment({ id, file }) {
  const container = $('#attachment-previews');
  const isImage = file.type.startsWith('image/');
  const sizeStr = formatFileSize(file.size);

  const div = document.createElement('div');
  div.className = 'attachment-item';
  div.dataset.id = id;

  if (isImage) {
    const reader = new FileReader();
    reader.onload = e => {
      div.querySelector('.attachment-thumb img').src = e.target.result;
    };
    reader.readAsDataURL(file);
    div.innerHTML = `
      <div class="attachment-thumb"><img src="" alt="${escHtml(file.name)}" /></div>
      <div>
        <div class="attachment-name">${escHtml(file.name)}</div>
        <div class="attachment-size">${sizeStr}</div>
      </div>
      <button class="attachment-remove" aria-label="Remove attachment">
        <svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>`;
  } else {
    const icon = file.type.includes('pdf') ? '📄' : file.type.includes('zip') ? '🗜️' : '📁';
    div.innerHTML = `
      <span class="attachment-file-icon">${icon}</span>
      <div>
        <div class="attachment-name">${escHtml(file.name)}</div>
        <div class="attachment-size">${sizeStr}</div>
      </div>
      <button class="attachment-remove" aria-label="Remove attachment">
        <svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>`;
  }

  div.querySelector('.attachment-remove').addEventListener('click', () => {
    div.remove();
    State.attachments = State.attachments.filter(a => a.id !== id);
  });

  container.appendChild(div);
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

/* ══════════════════════════════════════════
   VOICE INPUT
   ══════════════════════════════════════════ */
function initVoiceInput() {
  const voiceBtn = $('#voice-btn');
  const voiceIndicator = $('#voice-indicator');
  const voiceStopBtn = $('#voice-stop-btn');
  const timerEl = $('#voice-timer');

  voiceBtn.addEventListener('click', () => {
    voiceIndicator.style.display = 'flex';
    State.voiceSeconds = 0;
    timerEl.textContent = '00:00';

    State.voiceTimer = setInterval(() => {
      State.voiceSeconds++;
      const m = String(Math.floor(State.voiceSeconds / 60)).padStart(2, '0');
      const s = String(State.voiceSeconds % 60).padStart(2, '0');
      timerEl.textContent = `${m}:${s}`;
    }, 1000);
  });

  voiceStopBtn.addEventListener('click', stopVoice);

  function stopVoice() {
    clearInterval(State.voiceTimer);
    voiceIndicator.style.display = 'none';
    if (State.voiceSeconds > 0) {
      setInput(`[Voice input — ${State.voiceSeconds}s recorded]`);
      showToast('Voice input captured');
    }
    State.voiceSeconds = 0;
  }
}

/* ══════════════════════════════════════════
   TOOL TOGGLES
   ══════════════════════════════════════════ */
function initToolToggles() {
  $$('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const active = btn.classList.toggle('active');
      btn.setAttribute('aria-pressed', active);
      const name = btn.id === 'websearch-btn' ? 'Web Search' : 'Deep Thinking';
      showToast(`${name} ${active ? 'enabled' : 'disabled'}`);
    });
  });
}

/* ══════════════════════════════════════════
   MODEL SELECTOR
   ══════════════════════════════════════════ */
function initModelSelector() {
  const selector = $('#model-selector');
  const dropdown = $('#model-dropdown');
  const label = $('#model-label');

  // Set initial
  label.textContent = State.model;
  $$('.model-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.model === State.model);
  });

  selector.addEventListener('click', e => {
    e.stopPropagation();
    const open = dropdown.classList.toggle('open');
    selector.classList.toggle('open', open);
    selector.setAttribute('aria-expanded', open);
  });

  selector.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selector.click(); }
  });

  dropdown.addEventListener('click', e => {
    const opt = e.target.closest('.model-option');
    if (!opt) return;
    State.model = opt.dataset.model;
    localStorage.setItem('hk-model', State.model);
    label.textContent = State.model;
    $$('.model-option').forEach(o => o.classList.toggle('active', o.dataset.model === State.model));
    dropdown.classList.remove('open');
    selector.classList.remove('open');
    selector.setAttribute('aria-expanded', 'false');
    showToast(`Model switched to ${State.model}`);
  });

  // Keyboard navigation
  $$('.model-option').forEach((opt, i, arr) => {
    opt.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opt.click(); }
      if (e.key === 'ArrowDown') arr[(i + 1) % arr.length].focus();
      if (e.key === 'ArrowUp') arr[(i - 1 + arr.length) % arr.length].focus();
    });
  });

  document.addEventListener('click', e => {
    if (!selector.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
      selector.classList.remove('open');
      selector.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ══════════════════════════════════════════
   COMMAND PALETTE
   ══════════════════════════════════════════ */
const COMMANDS = [
  { name: 'New Chat', icon: 'plus', shortcut: 'Ctrl+N', action: 'new-chat', group: 'Chat' },
  { name: 'Search Chats', icon: 'search', shortcut: 'Ctrl+/', action: 'search', group: 'Chat' },
  { name: 'Toggle Sidebar', icon: 'panel-left', action: 'toggle-sidebar', group: 'View' },
  { name: 'Toggle Theme', icon: 'sun-moon', action: 'toggle-theme', group: 'View' },
  { name: 'Settings', icon: 'settings', shortcut: ',', action: 'settings', group: 'App' },
  { name: 'Prompt Library', icon: 'book', action: 'prompts', group: 'App' },
  { name: 'Keyboard Shortcuts', icon: 'keyboard', action: 'shortcuts', group: 'App' },
  { name: 'Profile', icon: 'user', action: 'profile', group: 'Account' },
];

const ICON_PATHS = {
  'plus': '<path d="M12 5v14M5 12h14"/>',
  'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  'panel-left': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
  'sun-moon': '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  'settings': '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  'book': '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
  'keyboard': '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h.001M12 12h.001M16 12h.001M7 16h10"/>',
  'user': '<circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>',
};

function makeIcon(name) {
  const path = ICON_PATHS[name] || ICON_PATHS['plus'];
  return `<svg class="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

function openCommandPalette() {
  const modal = $('#command-palette');
  const input = $('#command-input');
  modal.style.display = 'flex';
  input.value = '';
  renderCommandList('');
  setTimeout(() => input.focus(), 50);
}

function closeCommandPalette() {
  $('#command-palette').style.display = 'none';
}

function renderCommandList(query) {
  const list = $('#command-list');
  const q = query.toLowerCase().trim();
  const filtered = COMMANDS.filter(c => !q || c.name.toLowerCase().includes(q));

  if (!filtered.length) {
    list.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-2);font-size:13px">No commands found</div>';
    return;
  }

  // Group by category
  const groups = {};
  filtered.forEach(c => {
    if (!groups[c.group]) groups[c.group] = [];
    groups[c.group].push(c);
  });

  list.innerHTML = '';
  Object.entries(groups).forEach(([group, cmds]) => {
    if (!q) {
      const label = document.createElement('div');
      label.className = 'command-group-label';
      label.textContent = group;
      list.appendChild(label);
    }
    cmds.forEach(cmd => {
      const btn = document.createElement('button');
      btn.className = 'command-item';
      btn.setAttribute('role', 'option');
      btn.innerHTML = `
        ${makeIcon(cmd.icon)}
        <span class="command-item-name">${escHtml(cmd.name)}</span>
        ${cmd.shortcut ? `<kbd>${escHtml(cmd.shortcut)}</kbd>` : ''}
      `;
      btn.addEventListener('click', () => {
        closeCommandPalette();
        executeCommand(cmd.action);
      });
      list.appendChild(btn);
    });
  });
}

function executeCommand(action) {
  switch (action) {
    case 'new-chat': startNewChat(); break;
    case 'search': $('#chat-search')?.focus(); break;
    case 'toggle-sidebar':
      if (window.innerWidth <= 768) {
        const s = $('#sidebar');
        const o = $('#sidebar-overlay');
        s.classList.toggle('mobile-open');
        o.classList.toggle('active', s.classList.contains('mobile-open'));
      } else {
        State.sidebarCollapsed = !State.sidebarCollapsed;
        $('#sidebar').classList.toggle('collapsed', State.sidebarCollapsed);
        localStorage.setItem('hk-sidebar', State.sidebarCollapsed);
      }
      break;
    case 'toggle-theme':
      applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
      State.theme = document.documentElement.getAttribute('data-theme');
      localStorage.setItem('hk-theme', State.theme);
      showToast('Theme toggled');
      break;
    case 'settings': openModal('#settings-modal'); break;
    case 'prompts': openModal('#prompt-library-modal'); break;
    case 'shortcuts': openModal('#settings-modal'); setTimeout(() => activateSettingsSection('shortcuts'), 100); break;
    case 'profile': openProfileDrawer(); break;
  }
}

function initCommandPalette() {
  const input = $('#command-input');
  input.addEventListener('input', () => renderCommandList(input.value));
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeCommandPalette();
    if (e.key === 'ArrowDown') {
      const first = $('#command-list .command-item');
      first?.focus();
    }
  });

  $('#command-palette').addEventListener('click', e => {
    if (e.target === $('#command-palette')) closeCommandPalette();
  });
}

/* ══════════════════════════════════════════
   MODALS
   ══════════════════════════════════════════ */
function openModal(selector) {
  const el = $(selector);
  if (!el) return;
  el.style.display = 'flex';
  const focusable = el.querySelector('input, button, [tabindex]');
  setTimeout(() => focusable?.focus(), 100);
}

function closeModal(selector) {
  const el = $(selector);
  if (el) el.style.display = 'none';
}

function initModals() {
  // Settings
  $('#settings-close').addEventListener('click', () => closeModal('#settings-modal'));
  $('#settings-modal').addEventListener('click', e => {
    if (e.target === $('#settings-modal')) closeModal('#settings-modal');
  });

  // Delete confirm
  $('#delete-cancel').addEventListener('click', () => closeModal('#delete-modal'));
  $('#delete-confirm').addEventListener('click', () => {
    const id = State.pendingDeleteId;
    if (!id) return;
    const chat = State.chats.find(c => c.id === id);
    const title = chat?.title || 'Conversation';
    State.chats = State.chats.filter(c => c.id !== id);
    if (State.activeChatId === id) {
      State.activeChatId = null;
      renderMessages();
    }
    _saveChats();
    renderSidebar();
    closeModal('#delete-modal');
    State.pendingDeleteId = null;
    showToast(`"${title}" deleted`, {
      action: 'Undo',
      onAction: () => {
        // Restore: re-add chat (simplified undo)
        if (chat) { State.chats.unshift(chat); _saveChats(); renderSidebar(); showToast('Deletion undone'); }
      }
    });
  });
  $('#delete-modal').addEventListener('click', e => {
    if (e.target === $('#delete-modal')) closeModal('#delete-modal');
  });

  // Library
  $('#library-close').addEventListener('click', () => closeModal('#prompt-library-modal'));
  $('#prompt-library-modal').addEventListener('click', e => {
    if (e.target === $('#prompt-library-modal')) closeModal('#prompt-library-modal');
  });

  // Keyboard close
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      $$('.modal-backdrop, .drawer-backdrop').forEach(m => {
        if (m.style.display !== 'none') m.style.display = 'none';
      });
      closeCommandPalette();
    }
  });
}

/* ══════════════════════════════════════════
   SETTINGS
   ══════════════════════════════════════════ */
const SETTINGS_SECTIONS = {
  general: () => `
    <div class="settings-section-title">General</div>
    <div class="settings-row">
      <div><div class="settings-row-label">Send with Enter</div><div class="settings-row-desc">Press Enter to send, Shift+Enter for newline</div></div>
      <label class="toggle-switch"><input type="checkbox" checked /><span class="toggle-track"></span></label>
    </div>
    <div class="settings-row">
      <div><div class="settings-row-label">Auto-scroll to new messages</div><div class="settings-row-desc">Automatically scroll down when new responses arrive</div></div>
      <label class="toggle-switch"><input type="checkbox" checked /><span class="toggle-track"></span></label>
    </div>
    <div class="settings-row">
      <div><div class="settings-row-label">Show character counter</div><div class="settings-row-desc">Display character count while typing long messages</div></div>
      <label class="toggle-switch"><input type="checkbox" checked /><span class="toggle-track"></span></label>
    </div>
    <div class="settings-row">
      <div><div class="settings-row-label">Save chat history</div><div class="settings-row-desc">Persist conversations in local storage</div></div>
      <label class="toggle-switch"><input type="checkbox" checked /><span class="toggle-track"></span></label>
    </div>
  `,
  appearance: () => `
    <div class="settings-section-title">Appearance</div>
    <div class="settings-row" style="flex-direction:column;align-items:flex-start;gap:12px">
      <div><div class="settings-row-label">Theme</div><div class="settings-row-desc">Choose your preferred color scheme</div></div>
      <div class="theme-options" style="width:100%">
        <button class="theme-option ${State.theme === 'light' ? 'selected' : ''}" data-theme="light">
          <div class="theme-option-icon">☀️</div>Light
        </button>
        <button class="theme-option ${State.theme === 'dark' ? 'selected' : ''}" data-theme="dark">
          <div class="theme-option-icon">🌙</div>Dark
        </button>
        <button class="theme-option ${State.theme === 'system' ? 'selected' : ''}" data-theme="system">
          <div class="theme-option-icon">💻</div>System
        </button>
      </div>
    </div>
    <div class="settings-row">
      <div><div class="settings-row-label">Compact messages</div><div class="settings-row-desc">Reduce spacing between messages</div></div>
      <label class="toggle-switch"><input type="checkbox" /><span class="toggle-track"></span></label>
    </div>
    <div class="settings-row">
      <div><div class="settings-row-label">Show avatars</div><div class="settings-row-desc">Display AI avatar next to responses</div></div>
      <label class="toggle-switch"><input type="checkbox" checked /><span class="toggle-track"></span></label>
    </div>
  `,
  chat: () => `
    <div class="settings-section-title">Chat</div>
    <div class="settings-row">
      <div><div class="settings-row-label">Show AI suggestions</div><div class="settings-row-desc">Display follow-up suggestions after AI responses</div></div>
      <label class="toggle-switch"><input type="checkbox" checked /><span class="toggle-track"></span></label>
    </div>
    <div class="settings-row">
      <div><div class="settings-row-label">Typing animations</div><div class="settings-row-desc">Show animated typing indicator while AI responds</div></div>
      <label class="toggle-switch"><input type="checkbox" checked /><span class="toggle-track"></span></label>
    </div>
    <div class="settings-row">
      <div><div class="settings-row-label">Code syntax highlighting</div><div class="settings-row-desc">Highlight code blocks in AI responses</div></div>
      <label class="toggle-switch"><input type="checkbox" checked /><span class="toggle-track"></span></label>
    </div>
    <div class="settings-row">
      <div><div class="settings-row-label">Default model</div><div class="settings-row-desc">Model used for new conversations</div></div>
      <select style="padding:6px 10px;border-radius:var(--r-md);border:1px solid var(--border);background:var(--surface-2);color:var(--text);font:inherit;font-size:13px">
        <option>Techis AI</option><option>Fast</option><option>Thinking</option><option>Creative</option>
      </select>
    </div>
  `,
  voice: () => `
    <div class="settings-section-title">Voice</div>
    <div class="settings-row">
      <div><div class="settings-row-label">Voice input</div><div class="settings-row-desc">Use microphone for voice-to-text input</div></div>
      <label class="toggle-switch"><input type="checkbox" checked /><span class="toggle-track"></span></label>
    </div>
    <div class="settings-row">
      <div><div class="settings-row-label">Read aloud responses</div><div class="settings-row-desc">Automatically read AI responses using text-to-speech</div></div>
      <label class="toggle-switch"><input type="checkbox" /><span class="toggle-track"></span></label>
    </div>
    <div class="settings-row">
      <div><div class="settings-row-label">Voice speed</div><div class="settings-row-desc">Reading speed for text-to-speech</div></div>
      <select style="padding:6px 10px;border-radius:var(--r-md);border:1px solid var(--border);background:var(--surface-2);color:var(--text);font:inherit;font-size:13px">
        <option>Normal</option><option>Slow</option><option>Fast</option>
      </select>
    </div>
  `,
  shortcuts: () => `
    <div class="settings-section-title">Keyboard Shortcuts</div>
    <table class="shortcuts-table">
      <tbody>
        ${[
          ['Send message', 'Enter'],
          ['New line', 'Shift + Enter'],
          ['Command palette', 'Ctrl + K'],
          ['New chat', 'Ctrl + N'],
          ['Close modal', 'Esc'],
          ['Search chats', 'Ctrl + /'],
        ].map(([label, keys]) => `
          <tr>
            <td>${label}</td>
            <td>${keys.split(' + ').map(k => `<kbd>${k}</kbd>`).join(' + ')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `,
  privacy: () => `
    <div class="settings-section-title">Privacy</div>
    <div class="settings-row">
      <div><div class="settings-row-label">Store chat history locally</div><div class="settings-row-desc">Save conversations in browser localStorage only</div></div>
      <label class="toggle-switch"><input type="checkbox" checked /><span class="toggle-track"></span></label>
    </div>
    <div class="settings-row">
      <div><div class="settings-row-label">Analytics</div><div class="settings-row-desc">Help improve Techis by sharing anonymous usage data</div></div>
      <label class="toggle-switch"><input type="checkbox" /><span class="toggle-track"></span></label>
    </div>
    <div class="settings-row" style="flex-direction:column;align-items:flex-start;gap:12px">
      <div><div class="settings-row-label">Clear all data</div><div class="settings-row-desc">Delete all stored chats and preferences</div></div>
      <button class="btn-danger" onclick="clearAllData()">Clear All Data</button>
    </div>
  `,
  about: () => `
    <div class="settings-section-title">About</div>
    <div style="display:flex;flex-direction:column;gap:16px">
      <div style="display:flex;align-items:center;gap:16px;padding:20px;background:var(--surface-2);border-radius:var(--r-lg)">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:48px;height:48px;flex-shrink:0">
          <rect x="4" y="4" width="40" height="40" rx="12" fill="#111111"/>
          <path d="M12 14h24v4H28v16h-8V18H12z" fill="#FFFFFF"/>
          <circle cx="35" cy="13" r="3" fill="#6366F1"/>
        </svg>
        <div>
          <div style="font-size:18px;font-weight:700">Techis</div>
          <div style="font-size:13px;color:var(--text-2)">AI Assistant · Version 1.0.0</div>
        </div>
      </div>
      <div class="settings-row"><div class="settings-row-label">Version</div><span style="font-size:13px;color:var(--text-2)">1.0.0 (UI Prototype)</span></div>
      <div class="settings-row"><div class="settings-row-label">Build</div><span style="font-size:13px;color:var(--text-2)">2025-01</span></div>
      <div class="settings-row"><div class="settings-row-label">License</div><span style="font-size:13px;color:var(--text-2)">MIT</span></div>
    </div>
  `,
};

window.clearAllData = function () {
  localStorage.clear();
  showToast('All data cleared. Refreshing…');
  setTimeout(() => location.reload(), 1200);
};

function activateSettingsSection(section) {
  $$('.settings-nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.section === section));
  const content = $('#settings-content');
  content.innerHTML = SETTINGS_SECTIONS[section]?.() || '';

  // Theme option listeners
  content.querySelectorAll('.theme-option').forEach(opt => {
    opt.addEventListener('click', () => {
      applyTheme(opt.dataset.theme);
      content.querySelectorAll('.theme-option').forEach(o => o.classList.toggle('selected', o === opt));
      showToast('Theme updated');
    });
  });
}

function initSettings() {
  activateSettingsSection('general');

  $$('.settings-nav-item').forEach(btn => {
    btn.addEventListener('click', () => activateSettingsSection(btn.dataset.section));
  });
}

/* ══════════════════════════════════════════
   PROFILE DRAWER
   ══════════════════════════════════════════ */
function openProfileDrawer() {
  const drawer = $('#profile-drawer');
  drawer.style.display = 'flex';
}

function closeProfileDrawer() {
  $('#profile-drawer').style.display = 'none';
}

function initProfileDrawer() {
  $('#profile-trigger').addEventListener('click', openProfileDrawer);
  $('#topbar-profile-trigger').addEventListener('click', openProfileDrawer);
  $('#profile-close').addEventListener('click', closeProfileDrawer);
  $('#profile-drawer').addEventListener('click', e => {
    if (e.target === $('#profile-drawer')) closeProfileDrawer();
  });

  $('#drawer-settings-btn').addEventListener('click', () => {
    closeProfileDrawer();
    openModal('#settings-modal');
  });

  $('#drawer-appearance-btn').addEventListener('click', () => {
    closeProfileDrawer();
    openModal('#settings-modal');
    setTimeout(() => activateSettingsSection('appearance'), 100);
  });

  $('#drawer-prompts-btn').addEventListener('click', () => {
    closeProfileDrawer();
    openModal('#prompt-library-modal');
  });

  $('#drawer-help-btn').addEventListener('click', () => {
    closeProfileDrawer();
    showToast('Help documentation coming soon');
  });

  $('#drawer-logout-btn').addEventListener('click', () => {
    closeProfileDrawer();
    showToast('Signed out successfully');
  });
}

/* ══════════════════════════════════════════
   PROMPT LIBRARY
   ══════════════════════════════════════════ */
function renderPromptLibrary() {
  const list = $('#library-list');
  list.innerHTML = '';

  State.savedPrompts.forEach(prompt => {
    const div = document.createElement('div');
    div.className = 'library-item';
    div.setAttribute('role', 'listitem');
    div.innerHTML = `
      <div>
        <div class="library-item-name">${escHtml(prompt.name)}</div>
        <div class="library-item-text">${escHtml(prompt.text)}</div>
      </div>
      <button class="library-use-btn">Use</button>
    `;
    div.querySelector('.library-use-btn').addEventListener('click', () => {
      setInput(prompt.text);
      closeModal('#prompt-library-modal');
      showToast(`"${prompt.name}" loaded`);
    });
    list.appendChild(div);
  });
}

function initPromptLibrary() {
  renderPromptLibrary();

  // Refresh on open
  const observer = new MutationObserver(() => {
    if ($('#prompt-library-modal').style.display !== 'none') renderPromptLibrary();
  });
  observer.observe($('#prompt-library-modal'), { attributes: true, attributeFilter: ['style'] });
}

/* ══════════════════════════════════════════
   WELCOME SCREEN ANIMATIONS
   ══════════════════════════════════════════ */
function animateWelcomeScreen() {
  const logo = $('.welcome-logo-wrap');
  const heading = $('.welcome-heading');
  const subheading = $('.welcome-subheading');
  const cards = $$('.prompt-card');

  // Staggered reveals
  [logo, heading, subheading].forEach((el, i) => {
    if (!el) return;
    setTimeout(() => el.classList.add('reveal'), i * 120);
  });

  cards.forEach((card, i) => {
    setTimeout(() => card.classList.add('reveal'), 360 + i * 80);
  });
}

/* ══════════════════════════════════════════
   INTRO ANIMATION
   ══════════════════════════════════════════ */
function runIntroAnimation() {
  const overlay = $('#intro-overlay');
  const introLogoSvg = $('#intro-logo-svg');
  const app = $('#app');
  const navLogo = $('.logo-nav');

  // Reduce motion: skip
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    overlay.style.display = 'none';
    app.classList.add('visible');
    app.removeAttribute('aria-hidden');
    animateWelcomeScreen();
    return;
  }

  // Step 1: Fade in center logo
  introLogoSvg.classList.add('fade-in');

  // Step 2: After logo settles, travel to nav position
  setTimeout(() => {
    // Get center logo position
    const startRect = introLogoSvg.getBoundingClientRect();
    const startCX = startRect.left + startRect.width / 2;
    const startCY = startRect.top + startRect.height / 2;

    // Show app (faded), get target position
    app.style.opacity = '0';
    app.classList.add('visible');
    app.removeAttribute('aria-hidden');

    requestAnimationFrame(() => {
      const targetRect = navLogo.getBoundingClientRect();
      const endCX = targetRect.left + targetRect.width / 2;
      const endCY = targetRect.top + targetRect.height / 2;
      const endScale = targetRect.width / startRect.width;

      const dx = endCX - startCX;
      const dy = endCY - startCY;

      // Animate the intro logo travelling
      introLogoSvg.style.transition = 'none';
      introLogoSvg.style.transformOrigin = 'center';

      introLogoSvg.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(${endScale})`, opacity: 0 }
      ], {
        duration: 900,
        delay: 300,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards'
      });

      // Simultaneously fade in the full UI
      app.animate([
        { opacity: 0 },
        { opacity: 1 }
      ], {
        duration: 900,
        delay: 300,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards'
      }).onfinish = () => {
        app.style.opacity = '1';
      };

      // Fade out overlay
      overlay.animate([
        { opacity: 1 },
        { opacity: 0 }
      ], {
        duration: 400,
        delay: 1000,
        easing: 'ease',
        fill: 'forwards'
      }).onfinish = () => {
        overlay.style.display = 'none';
        overlay.classList.add('done');
        animateWelcomeScreen();
      };
    });
  }, 950); // hold time after logo appears
}

/* ══════════════════════════════════════════
   THEME TOGGLE BUTTON
   ══════════════════════════════════════════ */
function initThemeToggle() {
  $('#theme-toggle-btn').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    showToast(`Switched to ${next} mode`);
  });
}

/* ══════════════════════════════════════════
   SHARE BUTTON
   ══════════════════════════════════════════ */
function initShare() {
  $('#share-btn').addEventListener('click', () => {
    const chat = getActiveChat();
    if (!chat || !chat.messages.length) {
      showToast('No conversation to share', { type: 'error' });
      return;
    }
    copyToClipboard(window.location.href);
    showToast('Conversation link copied');
  });
}

/* ══════════════════════════════════════════
   NEW CHAT BUTTON
   ══════════════════════════════════════════ */
function initNewChat() {
  $('#new-chat-btn').addEventListener('click', startNewChat);
}

/* ══════════════════════════════════════════
   PROMPT CARDS
   ══════════════════════════════════════════ */
function initPromptCards() {
  $$('.prompt-card').forEach(card => {
    card.addEventListener('click', () => {
      const prompt = card.dataset.prompt;
      setInput(prompt);
    });
  });
}

/* ══════════════════════════════════════════
   KEYBOARD SHORTCUTS
   ══════════════════════════════════════════ */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    // Ctrl+K — command palette
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const palette = $('#command-palette');
      if (palette.style.display === 'none' || !palette.style.display) {
        openCommandPalette();
      } else {
        closeCommandPalette();
      }
    }

    // Ctrl+N — new chat
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      startNewChat();
    }

    // Ctrl+/ — focus search
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      const search = $('#chat-search');
      if (search) { search.focus(); search.select(); }
    }
  });
}

/* ══════════════════════════════════════════
   SEED DEMO CHATS
   ══════════════════════════════════════════ */
function seedDemoChats() {
  if (State.chats.length > 0) return;

  const demos = [
    { title: 'Explain quantum computing', bucket: 'today' },
    { title: 'Python string reversal', bucket: 'today' },
    { title: 'Startup ideas in AI', bucket: 'yesterday' },
    { title: 'Write a cover letter', bucket: 'yesterday' },
    { title: 'React vs Vue comparison', bucket: 'week' },
    { title: 'Best practices for REST APIs', bucket: 'week' },
  ];

  demos.forEach(d => {
    const c = createChat(d.title);
    c.bucket = d.bucket;
    // Add a sample exchange
    c.messages.push({ id: uid(), role: 'user', content: d.title, ts: Date.now() });
    c.messages.push({ id: uid(), role: 'ai', content: AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)], ts: Date.now() });
  });

  _saveChats();
}

/* ══════════════════════════════════════════
   INIT
   ══════════════════════════════════════════ */
function init() {
  // Apply saved theme
  applyTheme(State.theme);

  // Seed demo data
  seedDemoChats();

  // Render sidebar
  renderSidebar();

  // Set active chat (most recent today)
  const firstChat = State.chats.find(c => !c.archived);
  if (firstChat) {
    State.activeChatId = firstChat.id;
    renderMessages();
    renderSidebar();
  }

  // Init all subsystems
  initSidebar();
  initNewChat();
  initChatSearch();
  initContextMenu();
  initInput();
  initFileAttachments();
  initVoiceInput();
  initToolToggles();
  initModelSelector();
  initCommandPalette();
  initModals();
  initSettings();
  initProfileDrawer();
  initPromptLibrary();
  initPromptCards();
  initThemeToggle();
  initShare();
  initScrollToBottom();
  initMessageActions();
  initKeyboardShortcuts();

  // Run intro animation
  runIntroAnimation();
}

// Boot
document.addEventListener('DOMContentLoaded', init);
