// Floating Chatbot Widget
const FloatingChatbot = {
    isOpen: false,
    messages: [],
    currentScope: 'my', // Track current scope: 'my' or 'all'

    init() {
        this.injectHTML();
        this.attachEventListeners();
        this.showWelcomeMessage();
    },

    injectHTML() {
        const chatbotHTML = `
            <!-- Floating Chatbot FAB Button -->
            <div class="chatbot-fab" id="chatbotFab">
                <span class="chatbot-fab-icon">💬</span>
            </div>

            <!-- Floating Chatbot Panel -->
            <div class="floating-chatbot" id="floatingChatbot">
                <div class="floating-chatbot-header">
                    <h3>
                        <span>🤖</span>
                        <span>Academic Assistant</span>
                    </h3>
                    <button class="floating-chatbot-close" id="closeChatbot">✕</button>
                </div>

                <div class="floating-chatbot-messages" id="floatingChatMessages">
                    <!-- Messages will be inserted here -->
                </div>

                <div class="floating-chatbot-input-area">
                    <div class="floating-chatbot-context" id="chatbotContext" style="padding: 0.5rem 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 0.85rem; text-align: center; border-radius: 8px 8px 0 0; font-weight: 600;">
                        📚 Context: <span id="contextLabel">Your Publications</span>
                    </div>
                    <div class="floating-suggestions" id="floatingSuggestions">
                        <div class="floating-suggestion-chip" data-query="Show publication summary">📚 Summary</div>
                        <div class="floating-suggestion-chip" data-query="What are the top research areas?">🔍 Research Areas</div>
                        <div class="floating-suggestion-chip" data-query="Show publications from 2024">📅 Recent Work</div>
                    </div>
                    <div class="floating-input-group">
                        <input 
                            type="text" 
                            class="floating-chatbot-input" 
                            id="floatingChatInput"
                            placeholder="Ask about your publications..."
                        >
                        <button class="floating-send-btn" id="floatingSendBtn">
                            Send
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    },

    attachEventListeners() {
        // FAB button click
        document.getElementById('chatbotFab').addEventListener('click', () => {
            this.toggle();
        });

        // Close button click
        document.getElementById('closeChatbot').addEventListener('click', () => {
            this.close();
        });

        // Send button click
        document.getElementById('floatingSendBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key press
        document.getElementById('floatingChatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Suggestion chips
        document.querySelectorAll('.floating-suggestion-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const query = e.target.dataset.query;
                document.getElementById('floatingChatInput').value = query;
                this.sendMessage();
            });
        });
    },

    toggle() {
        this.isOpen = !this.isOpen;
        const chatbot = document.getElementById('floatingChatbot');
        const fab = document.getElementById('chatbotFab');

        if (this.isOpen) {
            chatbot.classList.add('open');
            fab.classList.add('open');
            fab.querySelector('.chatbot-fab-icon').textContent = '✕';
        } else {
            chatbot.classList.remove('open');
            fab.classList.remove('open');
            fab.querySelector('.chatbot-fab-icon').textContent = '💬';
        }
    },

    close() {
        this.isOpen = false;
        document.getElementById('floatingChatbot').classList.remove('open');
        document.getElementById('chatbotFab').classList.remove('open');
        document.getElementById('chatbotFab').querySelector('.chatbot-fab-icon').textContent = '💬';
    },

    showWelcomeMessage() {
        setTimeout(() => {
            this.updateContext();
            const scopeText = this.currentScope === 'all' ? 'all research publications' : 'your publications';
            this.addMessage('bot', `👋 Hi! I'm your Academic Assistant. I can help you with questions about ${scopeText}, research areas, and more. How can I assist you today?`);
        }, 1000);
    },

    // Update context based on current tab
    updateContext() {
        // Check if we're on dashboard page with tabs
        if (typeof currentTab !== 'undefined') {
            this.currentScope = currentTab; // 'my' or 'all'
        } else {
            this.currentScope = 'my'; // Default to 'my'
        }

        // Update context label
        const contextLabel = document.getElementById('contextLabel');
        if (contextLabel) {
            if (this.currentScope === 'all') {
                contextLabel.textContent = 'All Research Publications';
            } else {
                contextLabel.textContent = 'Your Publications';
            }
        }
    },

    async sendMessage() {
        const input = document.getElementById('floatingChatInput');
        const message = input.value.trim();

        if (!message) return;

        // Update context before sending
        this.updateContext();

        // Add user message
        this.addMessage('user', message);
        input.value = '';

        // Show typing indicator
        this.showTyping();

        // Send to API with current scope
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/chatbot/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: message,
                    scope: this.currentScope // Send current scope
                })
            });

            const data = await response.json();

            // Remove typing indicator
            this.removeTyping();

            if (response.ok) {
                // Format the response to handle markdown-style formatting
                const formattedResponse = this.formatResponse(data.response);
                this.addMessage('bot', formattedResponse);
            } else {
                this.addMessage('bot', '❌ Sorry, I encountered an error. Please try again.');
            }
        } catch (error) {
            this.removeTyping();
            this.addMessage('bot', '❌ Connection error. Please make sure the server is running.');
        }
    },

    // Format response to handle markdown-style formatting
    formatResponse(text) {
        // Convert **bold** to actual bold
        let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Convert newlines to breaks
        formatted = formatted.replace(/\n/g, '<br>');
        return formatted;
    },

    addMessage(type, text) {
        const messagesContainer = document.getElementById('floatingChatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        // Use innerHTML for bot messages to support formatting
        if (type === 'bot') {
            contentDiv.innerHTML = text;
        } else {
            contentDiv.textContent = text;
        }

        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);
        messagesContainer.appendChild(messageDiv);

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        this.messages.push({ type, text, time: new Date() });
    },

    showTyping() {
        const messagesContainer = document.getElementById('floatingChatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message message-bot typing-indicator';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="message-content">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    removeTyping() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        FloatingChatbot.init();
    });
} else {
    FloatingChatbot.init();
}
