/**
 * Direct Chat & Video Launch Component
 */
import { api } from '../api.js';
import { state, showToast } from '../state.js';

export function renderChat(otherId) {
    return `
    <div id="chatPageContainer" style="max-width: 820px; margin: 0 auto;">
        <p style="text-align: center; padding: 2rem;">Loading chat session...</p>
    </div>
    `;
}

export async function initChat(otherId) {
    const container = document.getElementById('chatPageContainer');
    if (!container) return;

    try {
        const data = await api.get(`/api/chat/${otherId}`);
        const otherUser = data.other_user;
        const messages = data.messages || [];
        const currentUserId = state.user ? state.user.id : null;

        container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
            <a href="#/messages" class="btn btn-secondary btn-sm">
                ← Back to All Messages
            </a>
            <a href="#/video/${otherId}" class="btn btn-primary btn-sm">
                <span>📹 Launch Video Session</span>
            </a>
        </div>

        <div class="chat-wrapper">
            <!-- Header -->
            <div class="chat-header">
                <div class="chat-user-profile">
                    ${otherUser.profile_pic ? `
                    <img src="/static/${otherUser.profile_pic}" alt="${otherUser.name}" class="chat-avatar">
                    ` : `
                    <div class="chat-avatar">
                        ${(otherUser.name || 'U')[0].toUpperCase()}
                    </div>
                    `}
                    <div>
                        <h3 style="font-size: 1.05rem; margin: 0; color: var(--text-main);">${otherUser.name}</h3>
                        <div style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; color: var(--text-muted);">
                            <span class="tag tag-neutral" style="padding: 0.15rem 0.5rem; font-size: 0.7rem;">${otherUser.role}</span>
                            ${otherUser.company ? `<span>• ${otherUser.company}</span>` : ''}
                        </div>
                    </div>
                </div>

                <span class="tag tag-success" style="font-size: 0.72rem;">● Active</span>
            </div>

            <!-- Messages Body -->
            <div class="chat-body" id="chatBody">
                ${messages.length > 0 ? messages.map(msg => `
                <div class="chat-message ${msg.sender_id === currentUserId ? 'sent' : 'received'}">
                    <div class="message-bubble">
                        ${msg.content}
                    </div>
                    <span class="message-meta">${msg.created_at || 'Just now'}</span>
                </div>
                `).join('') : `
                <div class="empty-state" style="margin: auto; border: none; background: transparent; padding: 2rem 1rem;">
                    <div class="empty-state-icon" style="font-size: 2.5rem;">👋</div>
                    <h3>Start the Conversation</h3>
                    <p style="font-size: 0.88rem;">Say hello to ${otherUser.name}! Ask about their experience, industry advice, or mentorship opportunities.</p>
                </div>
                `}
            </div>

            <!-- Footer Input -->
            <div class="chat-footer">
                <form id="sendMessageForm" style="display: flex; gap: 0.75rem; padding: 0; background: transparent; border: none; box-shadow: none;">
                    <input type="text" id="chatInput" name="content" placeholder="Type your message here..." required autocomplete="off" style="flex: 1; border-radius: var(--radius-full); padding: 0.75rem 1.25rem;">
                    <button type="submit" class="btn btn-primary" id="chatSendBtn" style="border-radius: var(--radius-full); padding: 0.75rem 1.5rem;">
                        <span>Send</span> ✈️
                    </button>
                </form>
            </div>
        </div>
        `;

        const chatBody = document.getElementById('chatBody');
        if (chatBody) {
            chatBody.scrollTop = chatBody.scrollHeight;
        }

        const sendForm = document.getElementById('sendMessageForm');
        if (sendForm) {
            sendForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const contentInput = document.getElementById('chatInput');
                const text = contentInput.value.trim();
                if (!text) return;

                contentInput.value = '';
                try {
                    await api.post(`/api/chat/${otherId}`, { content: text });
                    initChat(otherId);
                } catch (err) {
                    showToast(err.message || 'Failed to send message.', 'error');
                }
            });
        }

    } catch (err) {
        container.innerHTML = `<p style="color: var(--danger);">Failed to load chat: ${err.message}</p>`;
    }
}
