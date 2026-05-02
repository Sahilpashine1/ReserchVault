// ═══════════════════════════════════════════════════════
//  ResearchVault — Hybrid AI Floating Chatbot
//  Supports: table | download | summary | text responses
// ═══════════════════════════════════════════════════════

const FloatingChatbot = {
    isOpen: false,
    isMaximized: false,
    messages: [],
    currentScope: 'my', // 'my' | 'all'
    isTyping: false,
    sessionId: null,    // Session ID for context memory

    init() {
        // Generate a persistent session ID for this browser session
        this.sessionId = sessionStorage.getItem('chatbot_session_id') || this._generateSessionId();
        sessionStorage.setItem('chatbot_session_id', this.sessionId);

        this.injectHTML();
        this.attachEventListeners();
        this.updateScopeBtns();
        this.showWelcomeMessage();
    },

    _generateSessionId() {
        return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    },

    injectHTML() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const initial = (user.name || 'U').charAt(0).toUpperCase();

        const html = `
        <!-- ═══ Floating AI Chatbot FAB ═══ -->
        <div class="chatbot-fab" id="chatbotFab" title="AI Research Assistant" role="button" aria-label="Open AI chatbot">
            <span class="chatbot-fab-icon">🤖</span>
        </div>

        <!-- ═══ Chat Panel ═══ -->
        <div class="floating-chatbot" id="floatingChatbot" role="dialog" aria-label="AI Research Assistant">

            <!-- Header -->
            <div class="floating-chatbot-header">
                <div class="chatbot-header-left">
                    <div class="chatbot-avatar">🤖</div>
                    <div class="chatbot-header-info">
                        <h3>
                            Research Assistant
                            <span class="chatbot-ai-badge">✨ AI</span>
                        </h3>
                        <div class="chatbot-status">
                            <span class="chatbot-status-dot"></span>
                            <span>Powered by Groq</span>
                        </div>
                    </div>
                </div>
                <div class="chatbot-header-actions">
                    <button class="floating-chatbot-maximize" id="maximizeChatbot" title="Maximize" aria-label="Maximize chatbot">⛶</button>
                    <button class="floating-chatbot-close" id="closeChatbot" title="Close" aria-label="Close chatbot">✕</button>
                </div>
            </div>

            <!-- Messages -->
            <div class="floating-chatbot-messages" id="floatingChatMessages" aria-live="polite">
                <!-- messages injected by JS -->
            </div>

            <!-- Input Area -->
            <div class="floating-chatbot-input-area">

                <!-- Context bar with scope toggle -->
                <div class="chatbot-context-bar">
                    <span class="chatbot-context-bar-icon">📂</span>
                    <span id="contextLabel">My Publications</span>
                    <div class="chatbot-scope-switch">
                        <button class="scope-btn active" id="scopeMyBtn" onclick="FloatingChatbot.setScope('my')">Mine</button>
                        <button class="scope-btn" id="scopeAllBtn" onclick="FloatingChatbot.setScope('all')">All</button>
                    </div>
                </div>

                <!-- Suggestion chips -->
                <div class="floating-suggestions" id="floatingSuggestions">
                    <button class="floating-suggestion-chip" data-query="What are my publications?">📋 My Papers</button>
                    <button class="floating-suggestion-chip" data-query="Show latest publications">🕐 Latest</button>
                    <button class="floating-suggestion-chip" data-query="Summarize my latest paper">📝 Summary</button>
                </div>

                <!-- Input row -->
                <div class="floating-input-group">
                    <input
                        type="text"
                        class="floating-chatbot-input"
                        id="floatingChatInput"
                        placeholder="Ask anything about publications..."
                        autocomplete="off"
                        aria-label="Type your message"
                    >
                    <button class="floating-send-btn" id="floatingSendBtn" title="Send message" aria-label="Send">
                        ➤
                    </button>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
    },

    attachEventListeners() {
        const fab      = document.getElementById('chatbotFab');
        const close    = document.getElementById('closeChatbot');
        const maximize = document.getElementById('maximizeChatbot');
        const sendBtn  = document.getElementById('floatingSendBtn');
        const input    = document.getElementById('floatingChatInput');

        fab.addEventListener('click', () => this.toggle());
        maximize.addEventListener('click', () => this.toggleMaximize());
        close.addEventListener('click', () => this.close());
        sendBtn.addEventListener('click', () => this.sendMessage());

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Suggestion chips
        document.querySelectorAll('.floating-suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const query = chip.dataset.query;
                document.getElementById('floatingChatInput').value = query;
                this.sendMessage();
                document.getElementById('floatingSuggestions').style.display = 'none';
            });
        });
    },

    toggle() { this.isOpen ? this.close() : this.open(); },

    open() {
        this.isOpen = true;
        document.getElementById('floatingChatbot').classList.add('open');
        document.getElementById('chatbotFab').classList.add('open');
        document.getElementById('chatbotFab').querySelector('.chatbot-fab-icon').textContent = '✕';
        this.syncScope();
        setTimeout(() => document.getElementById('floatingChatInput').focus(), 350);
    },

    close() {
        this.isOpen = false;
        this.isMaximized = false;
        const panel = document.getElementById('floatingChatbot');
        panel.classList.remove('open', 'maximized');
        document.getElementById('maximizeChatbot').textContent = '⛶';
        document.getElementById('maximizeChatbot').title = 'Maximize';
        document.getElementById('chatbotFab').classList.remove('open');
        document.getElementById('chatbotFab').querySelector('.chatbot-fab-icon').textContent = '🤖';
    },

    toggleMaximize() {
        const panel = document.getElementById('floatingChatbot');
        const btn   = document.getElementById('maximizeChatbot');
        this.isMaximized = !this.isMaximized;
        if (this.isMaximized) {
            panel.classList.add('maximized');
            btn.textContent = '❐';
            btn.title = 'Restore';
        } else {
            panel.classList.remove('maximized');
            btn.textContent = '⛶';
            btn.title = 'Maximize';
        }
        const msgs = document.getElementById('floatingChatMessages');
        if (msgs) this.scrollToBottom(msgs);
    },

    setScope(scope) {
        this.currentScope = scope;
        this.updateScopeBtns();
        this.updateContextLabel();
        this.addBotMessage(
            scope === 'all'
                ? '🌐 <strong>Switched to All Publications.</strong> I can now answer questions about all faculty research.'
                : '👤 <strong>Switched to My Publications.</strong> I\'ll focus on your personal research output.'
        );
    },

    syncScope() {
        if (typeof currentTab !== 'undefined') {
            this.currentScope = currentTab;
        }
        this.updateScopeBtns();
        this.updateContextLabel();
    },

    updateScopeBtns() {
        const myBtn  = document.getElementById('scopeMyBtn');
        const allBtn = document.getElementById('scopeAllBtn');
        if (!myBtn || !allBtn) return;
        if (this.currentScope === 'all') {
            myBtn.classList.remove('active');
            allBtn.classList.add('active');
        } else {
            myBtn.classList.add('active');
            allBtn.classList.remove('active');
        }
        this.updateContextLabel();
    },

    updateContextLabel() {
        const lbl = document.getElementById('contextLabel');
        if (lbl) {
            lbl.textContent = this.currentScope === 'all' ? 'All Publications' : 'My Publications';
        }
    },

    showWelcomeMessage() {
        const container = document.getElementById('floatingChatMessages');

        const dateEl = document.createElement('div');
        dateEl.className = 'chat-date-label';
        dateEl.textContent = 'Today';
        container.appendChild(dateEl);

        const welcomeCard = document.createElement('div');
        welcomeCard.className = 'chatbot-welcome-card';
        welcomeCard.innerHTML = `
            <div class="welcome-icon">🎓</div>
            <strong>Hello! I'm your AI Research Assistant</strong>
            <p>Ask me anything about publications — summaries, statistics, trends, journals, authors, and more.</p>
            <div class="welcome-hints">
                <span class="welcome-hint">📋 "What are my publications?"</span>
                <span class="welcome-hint">📅 "Show papers from 2023"</span>
                <span class="welcome-hint">📝 "Summarize AI in Healthcare"</span>
                <span class="welcome-hint">⬇️ "Download latest publication"</span>
            </div>
        `;
        container.appendChild(welcomeCard);
    },

    // ─────────────────────────────────────────────────────
    //  SEND MESSAGE
    // ─────────────────────────────────────────────────────
    async sendMessage() {
        if (this.isTyping) return;

        this.syncScope();
        const input   = document.getElementById('floatingChatInput');
        const message = input.value.trim();
        if (!message) return;

        input.value = '';
        document.getElementById('floatingSuggestions').style.display = 'none';
        this.addUserMessage(message);
        this.showTyping();

        try {
            const token   = localStorage.getItem('token');
            const apiBase = (window.API_URL || 'http://localhost:3000/api').replace(/\/api$/, '');

            const response = await fetch(`${apiBase}/api/chatbot/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query:     message,
                    scope:     this.currentScope,
                    sessionId: this.sessionId
                })
            });

            const data = await response.json();
            this.removeTyping();

            if (response.ok) {
                this.renderResponse(data);
            } else {
                this.addBotMessage('❌ <strong>Error:</strong> ' + (data.message || 'Something went wrong. Please try again.'));
            }
        } catch (err) {
            this.removeTyping();
            this.addBotMessage('❌ <strong>Connection error.</strong> Please make sure the server is running.');
        }
    },

    // ─────────────────────────────────────────────────────
    //  RESPONSE DISPATCHER
    // ─────────────────────────────────────────────────────
    renderResponse(data) {
        const type = data.type || 'text';

        switch (type) {
            case 'table':
                this.renderTableResponse(data);
                break;
            case 'download':
                this.renderDownloadResponse(data);
                break;
            case 'summary':
                this.renderSummaryResponse(data);
                break;
            default:
                this.addBotMessage(this.formatText(data.response || 'No response received.'));
        }
    },

    // ─────────────────────────────────────────────────────
    //  TABLE RENDERER
    // ─────────────────────────────────────────────────────
    renderTableResponse(data) {
        const container = document.getElementById('floatingChatMessages');
        const { wrap, body } = this.createMessageEl('bot');

        // Header text
        if (data.response) {
            const header = document.createElement('div');
            header.className = 'chat-msg-bubble chat-msg-bubble-header';
            header.innerHTML = this.formatText(data.response);
            body.appendChild(header);
        }

        const pubs = data.publications || [];

        if (pubs.length === 0) {
            const bubble = document.createElement('div');
            bubble.className = 'chat-msg-bubble';
            bubble.innerHTML = '📭 No publications found.';
            body.appendChild(bubble);
        } else {
            // ── Table toolbar: count + Download All button ──
            const toolbar = document.createElement('div');
            toolbar.className = 'chat-table-toolbar';
            toolbar.innerHTML = `
                <span class="chat-table-count">${pubs.length} result${pubs.length !== 1 ? 's' : ''}</span>
                <button class="chat-table-dl-all-btn" id="dlAllBtn_${Date.now()}">📥 Download All (CSV)</button>
            `;
            body.appendChild(toolbar);

            // Attach click handler
            toolbar.querySelector('[id^="dlAllBtn_"]').addEventListener('click', () => {
                this.downloadTableAsCSV(pubs, data.label || 'Publications');
            });

            // Table wrapper (scrollable)
            const tableWrap = document.createElement('div');
            tableWrap.className = 'chat-table-wrapper';


            const table = document.createElement('table');
            table.className = 'chat-table';

            // Header row
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Year</th>
                        <th>Journal / Conference</th>
                        <th>Action</th>
                    </tr>
                </thead>
            `;

            const tbody = document.createElement('tbody');
            pubs.forEach((pub, idx) => {
                const tr = document.createElement('tr');

                const hasLink = pub.publicationLink && pub.publicationLink.trim().length > 0;
                const downloadCell = hasLink
                    ? `<a href="${pub.publicationLink}" target="_blank" rel="noopener noreferrer" class="chat-table-download-btn">⬇ Download</a>`
                    : `<span class="chat-table-no-link">No link</span>`;

                tr.innerHTML = `
                    <td class="chat-table-num">${idx + 1}</td>
                    <td class="chat-table-title">${this._esc(pub.title)}</td>
                    <td class="chat-table-author">${this._esc(pub.authors || '')}</td>
                    <td class="chat-table-year">${pub.year || '—'}</td>
                    <td class="chat-table-journal">${this._esc(pub.journalConference || '—')}</td>
                    <td class="chat-table-action">${downloadCell}</td>
                `;
                tbody.appendChild(tr);
            });

            table.appendChild(tbody);
            tableWrap.appendChild(table);
            body.appendChild(tableWrap);
        }

        // ── Overview summary card (AI-generated, shown below the table) ──
        if (data.overviewText) {
            const overviewCard = document.createElement('div');
            overviewCard.className = 'chat-overview-card';
            overviewCard.innerHTML = `
                <div class="chat-overview-header">
                    <span class="chat-overview-icon">🔍</span>
                    <span class="chat-overview-label">Research Overview</span>
                </div>
                <div class="chat-overview-text">${this.formatText(data.overviewText)}</div>
            `;
            body.appendChild(overviewCard);
        }

        // Timestamp
        const time = document.createElement('div');
        time.className = 'chat-msg-time';
        time.textContent = this.getTime();
        body.appendChild(time);

        container.appendChild(wrap);
        this.scrollToBottom(container);
        this.messages.push({ type: 'table', data });
    },

    // ─────────────────────────────────────────────────────
    //  CSV DOWNLOAD HELPER
    // ─────────────────────────────────────────────────────
    downloadTableAsCSV(pubs, label) {
        const esc = v => `"${String(v || '').replace(/"/g, '""')}"`;
        const headers = ['#', 'Title', 'Authors', 'Year', 'Journal / Conference', 'Keywords', 'Indexing', 'Link'];
        const rows = pubs.map((p, i) => [
            i + 1,
            esc(p.title),
            esc(p.authors),
            p.year || '',
            esc(p.journalConference),
            esc(p.keywords),
            esc(p.indexing),
            esc(p.publicationLink)
        ].join(','));

        const csv = [headers.join(','), ...rows].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `${label.replace(/[^a-z0-9]/gi, '_')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // ─────────────────────────────────────────────────────
    //  DOWNLOAD CARD RENDERER
    // ─────────────────────────────────────────────────────
    renderDownloadResponse(data) {
        const container = document.getElementById('floatingChatMessages');
        const { wrap, body } = this.createMessageEl('bot');

        const pub = (data.publications || [])[0];
        const url = data.downloadUrl || pub?.publicationLink || '';
        const title = data.title || pub?.title || 'Publication';

        const card = document.createElement('div');
        card.className = 'chat-download-card';
        card.innerHTML = `
            <div class="chat-download-icon">📄</div>
            <div class="chat-download-info">
                <div class="chat-download-title">${this._esc(title)}</div>
                ${pub?.year ? `<div class="chat-download-meta">${pub.year}${pub.authors ? ' · ' + this._esc(pub.authors) : ''}</div>` : ''}
                ${pub?.journalConference ? `<div class="chat-download-meta">${this._esc(pub.journalConference)}</div>` : ''}
            </div>
            ${url
                ? `<a href="${url}" target="_blank" rel="noopener noreferrer" class="chat-download-btn">⬇ Download</a>`
                : `<span class="chat-table-no-link">No link available</span>`
            }
        `;

        body.appendChild(card);

        const time = document.createElement('div');
        time.className = 'chat-msg-time';
        time.textContent = this.getTime();
        body.appendChild(time);

        container.appendChild(wrap);
        this.scrollToBottom(container);
    },

    // ─────────────────────────────────────────────────────
    //  SUMMARY CARD RENDERER
    // ─────────────────────────────────────────────────────
    renderSummaryResponse(data) {
        const container = document.getElementById('floatingChatMessages');
        const { wrap, body } = this.createMessageEl('bot');

        const pub = (data.publications || [])[0];

        const card = document.createElement('div');
        card.className = 'chat-summary-card';
        card.innerHTML = `
            <div class="chat-summary-header">
                <span class="chat-summary-icon">📝</span>
                <span class="chat-summary-label">AI Summary</span>
            </div>
            <div class="chat-summary-paper-title">${this._esc(data.title || pub?.title || '')}</div>
            ${data.authors ? `<div class="chat-summary-meta">${this._esc(data.authors)}${data.year ? ' · ' + data.year : ''}</div>` : ''}
            <div class="chat-summary-text">${this.formatText(data.response || '')}</div>
            ${pub?.publicationLink ? `<a href="${pub.publicationLink}" target="_blank" rel="noopener noreferrer" class="chat-summary-link">🔗 View Full Paper</a>` : ''}
        `;

        body.appendChild(card);

        const time = document.createElement('div');
        time.className = 'chat-msg-time';
        time.textContent = this.getTime();
        body.appendChild(time);

        container.appendChild(wrap);
        this.scrollToBottom(container);
        this.messages.push({ type: 'summary', data });
    },

    // ─────────────────────────────────────────────────────
    //  COMMON MESSAGE HELPERS
    // ─────────────────────────────────────────────────────
    formatText(text) {
        if (!text) return '';
        // Markdown links → <a>
        let out = text.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        // Bare URLs
        out = out.replace(/(?<!href=")(https?:\/\/[^\s<"]+)/g,
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
        // **bold**
        out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // _italic_
        out = out.replace(/_(.*?)_/g, '<em>$1</em>');
        // Newlines → <br>
        out = out.replace(/\n/g, '<br>');
        return out;
    },

    /** Escape HTML special characters */
    _esc(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    },

    createMessageEl(type) {
        const user    = JSON.parse(localStorage.getItem('user') || '{}');
        const initial = (user.name || 'U').charAt(0).toUpperCase();

        const wrap = document.createElement('div');
        wrap.className = `chat-message ${type}`;

        const avatarEl = document.createElement('div');
        avatarEl.className = 'chat-msg-avatar';
        avatarEl.textContent = type === 'bot' ? '🤖' : initial;

        const body = document.createElement('div');
        body.className = 'chat-msg-body';

        wrap.appendChild(avatarEl);
        wrap.appendChild(body);
        return { wrap, body };
    },

    addUserMessage(text) {
        const container = document.getElementById('floatingChatMessages');
        const { wrap, body } = this.createMessageEl('user');

        const bubble = document.createElement('div');
        bubble.className = 'chat-msg-bubble';
        bubble.textContent = text;

        const time = document.createElement('div');
        time.className = 'chat-msg-time';
        time.textContent = this.getTime();

        body.appendChild(bubble);
        body.appendChild(time);
        container.appendChild(wrap);
        this.scrollToBottom(container);
        this.messages.push({ type: 'user', text });
    },

    addBotMessage(html) {
        const container = document.getElementById('floatingChatMessages');
        const { wrap, body } = this.createMessageEl('bot');

        const bubble = document.createElement('div');
        bubble.className = 'chat-msg-bubble';
        bubble.innerHTML = html;

        const time = document.createElement('div');
        time.className = 'chat-msg-time';
        time.textContent = this.getTime();

        body.appendChild(bubble);
        body.appendChild(time);
        container.appendChild(wrap);
        this.scrollToBottom(container);
        this.messages.push({ type: 'bot', html });
    },

    showTyping() {
        this.isTyping = true;
        const container = document.getElementById('floatingChatMessages');

        const wrap = document.createElement('div');
        wrap.className = 'chat-typing';
        wrap.id = 'chatTypingIndicator';

        const avatarEl = document.createElement('div');
        avatarEl.className = 'chat-msg-avatar';
        avatarEl.style.cssText = 'background:linear-gradient(135deg,#dbeafe,#bfdbfe);color:#1d4ed8;font-size:0.9rem;border-radius:9px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;align-self:flex-end;flex-shrink:0;';
        avatarEl.textContent = '🤖';

        const bubble = document.createElement('div');
        bubble.className = 'chat-typing-bubble';
        bubble.innerHTML = `
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        `;

        wrap.appendChild(avatarEl);
        wrap.appendChild(bubble);
        container.appendChild(wrap);
        this.scrollToBottom(container);

        document.getElementById('floatingSendBtn').disabled = true;
    },

    removeTyping() {
        this.isTyping = false;
        const el = document.getElementById('chatTypingIndicator');
        if (el) el.remove();
        const sendBtn = document.getElementById('floatingSendBtn');
        if (sendBtn) sendBtn.disabled = false;
    },

    scrollToBottom(container) {
        requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight;
        });
    },

    getTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FloatingChatbot.init());
} else {
    FloatingChatbot.init();
}
