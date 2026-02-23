// Chatbot state
let chatbotOpen = false;
let chatHistory = [];

// Initialize chatbot
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.endsWith('dashboard.html')) {
        initChatbot();
        loadSuggestions();
        setWelcomeTime();
    }
});

// Initialize chatbot functionality
function initChatbot() {
    const toggleBtn = document.getElementById('toggleChatbot');
    const closeBtn = document.getElementById('closeChatbot');
    const sendBtn = document.getElementById('sendQueryBtn');
    const chatInput = document.getElementById('chatbotInput');

    // Toggle chatbot panel
    toggleBtn?.addEventListener('click', () => {
        toggleChatbot();
    });

    closeBtn?.addEventListener('click', () => {
        toggleChatbot();
    });

    // Send query on button click
    sendBtn?.addEventListener('click', () => {
        sendQuery();
    });

    // Send query on Enter key
    chatInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendQuery();
        }
    });
}

// Toggle chatbot panel
function toggleChatbot() {
    const panel = document.getElementById('chatbotPanel');
    chatbotOpen = !chatbotOpen;

    if (chatbotOpen) {
        panel.classList.add('open');
    } else {
        panel.classList.remove('open');
    }
}

// Load query suggestions
async function loadSuggestions() {
    try {
        const response = await fetch(`${window.API_BASE_URL}/chatbot/suggestions`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            renderSuggestions(data.suggestions.slice(0, 3)); // Show first 3 suggestions
        }
    } catch (error) {
        console.error('Load suggestions error:', error);
    }
}

// Render suggestion chips
function renderSuggestions(suggestions) {
    const suggestionsContainer = document.getElementById('suggestions');

    suggestionsContainer.innerHTML = suggestions.map(suggestion => `
    <div class="suggestion-chip" onclick="useSuggestion('${escapeHtml(suggestion.text)}')">
      ${escapeHtml(suggestion.text)}
    </div>
  `).join('');
}

// Use a suggestion
function useSuggestion(text) {
    document.getElementById('chatbotInput').value = text;
    sendQuery();
}

// Send query to chatbot
async function sendQuery() {
    const input = document.getElementById('chatbotInput');
    const query = input.value.trim();

    if (!query) {
        return;
    }

    // Add user message to chat
    addMessage(query, 'user');
    input.value = '';

    // Show typing indicator
    const typingId = addTypingIndicator();

    try {
        const response = await fetch(`${window.API_BASE_URL}/chatbot/query`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ query })
        });

        const data = await response.json();

        // Remove typing indicator
        removeTypingIndicator(typingId);

        if (response.ok) {
            // Add bot response
            addMessage(data.response, 'bot');

            // Store in history
            chatHistory.push({
                query: query,
                response: data.response,
                timestamp: new Date()
            });
        } else {
            addMessage('Sorry, I encountered an error processing your request.', 'bot');
        }
    } catch (error) {
        console.error('Query error:', error);
        removeTypingIndicator(typingId);
        addMessage('Connection error. Please check if the server is running.', 'bot');
    }
}

// Add message to chat
function addMessage(content, type) {
    const messagesContainer = document.getElementById('chatbotMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;

    const time = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Convert markdown-style **bold** to HTML
    const formattedContent = formatMessageContent(content);

    messageDiv.innerHTML = `
    <div class="message-content">${formattedContent}</div>
    <div class="message-time">${time}</div>
  `;

    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Format message content (handle markdown-style formatting)
function formatMessageContent(content) {
    // Convert **bold** to <strong>
    let formatted = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert _italic_ to <em>
    formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');

    // Convert newlines to <br>
    formatted = formatted.replace(/\n/g, '<br>');

    // Make URLs clickable
    formatted = formatted.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" style="color: var(--primary-blue);">$1</a>'
    );

    return formatted;
}

// Add typing indicator
function addTypingIndicator() {
    const messagesContainer = document.getElementById('chatbotMessages');
    const typingDiv = document.createElement('div');
    const typingId = 'typing-' + Date.now();
    typingDiv.id = typingId;
    typingDiv.className = 'message message-bot';

    typingDiv.innerHTML = `
    <div class="message-content" style="padding: 1rem;">
      <span class="spinner"></span>
      <span style="margin-left: 0.5rem;">Analyzing...</span>
    </div>
  `;

    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return typingId;
}

// Remove typing indicator
function removeTypingIndicator(typingId) {
    const typingDiv = document.getElementById(typingId);
    if (typingDiv) {
        typingDiv.remove();
    }
}

// Set welcome message time
function setWelcomeTime() {
    const welcomeTime = document.getElementById('welcomeTime');
    if (welcomeTime) {
        const time = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        welcomeTime.textContent = time;
    }
}

// Preset queries for quick testing
function askPresetQuery(query) {
    document.getElementById('chatbotInput').value = query;
    if (!chatbotOpen) {
        toggleChatbot();
    }
    setTimeout(() => {
        sendQuery();
    }, 300);
}

// Export for potential use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { sendQuery, toggleChatbot, askPresetQuery };
}
