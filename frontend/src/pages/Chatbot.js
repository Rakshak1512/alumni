/**
 * AI Portal Assistant Component
 */
import { api } from '../api.js';

export function renderChatbot() {
    return `
    <div id="chatbotPage">
        <div class="page-header">
            <div class="page-header-title">
                <h1>AI Portal Career Assistant 🤖</h1>
                <p>Instant guidance on alumni networking, career opportunities, study resources, and announcements.</p>
            </div>
        </div>

        <div style="max-width: 760px; margin: 0 auto;">
            <!-- Intro Card -->
            <div class="card" style="padding: 2rem; margin-bottom: 1.5rem; background: var(--gradient-card);">
                <div style="display: flex; gap: 1.25rem; align-items: flex-start;">
                    <div style="width: 52px; height: 52px; border-radius: var(--radius-lg); background: var(--gradient-primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; flex-shrink: 0; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);">
                        🤖
                    </div>
                    <div>
                        <h3 style="font-size: 1.25rem; margin-bottom: 0.35rem;">How can I help you today?</h3>
                        <p style="font-size: 0.92rem; color: var(--text-muted); margin-bottom: 1rem;">
                            Ask me about jobs, internships, contacting alumni, downloading resources, or navigating the platform.
                        </p>

                        <!-- Suggestion Pills -->
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            <button type="button" class="btn btn-sm btn-secondary btn-suggestion" data-prompt="How do I find alumni from my branch?" style="border-radius: var(--radius-full); font-size: 0.8rem;">
                                🔍 Find alumni in my branch
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary btn-suggestion" data-prompt="Where can I see available job postings?" style="border-radius: var(--radius-full); font-size: 0.8rem;">
                                💼 Explore career postings
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary btn-suggestion" data-prompt="How do I download faculty resources?" style="border-radius: var(--radius-full); font-size: 0.8rem;">
                                📚 Access study resources
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Form -->
            <form id="botQuestionForm" class="card">
                <div class="form-group">
                    <label for="botQuestionInput">Your Question</label>
                    <textarea id="botQuestionInput" name="question" rows="2" placeholder="e.g. How can I connect with an alumni working at Google?" required style="font-size: 0.95rem;"></textarea>
                </div>

                <div style="display: flex; justify-content: flex-end;">
                    <button type="submit" class="btn btn-primary" id="botSubmitBtn">
                        <span>Ask Assistant</span> ✨
                    </button>
                </div>
            </form>

            <!-- Response Container -->
            <div id="botResponseContainer"></div>
        </div>
    </div>
    `;
}

export function initChatbot() {
    const form = document.getElementById('botQuestionForm');
    const input = document.getElementById('botQuestionInput');
    const responseContainer = document.getElementById('botResponseContainer');

    async function sendQuestion(text) {
        if (!text.trim() || !responseContainer) return;
        const submitBtn = document.getElementById('botSubmitBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Thinking...';
        }

        try {
            const data = await api.post('/api/chatbot', { question: text });
            responseContainer.innerHTML = `
            <div class="card animate-scale-in" style="margin-top: 1.5rem; border-left: 5px solid var(--primary); background: #ffffff; box-shadow: var(--shadow-md);">
                <div style="display: flex; gap: 1rem; align-items: flex-start;">
                    <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;">
                        🤖
                    </div>
                    <div>
                        <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-main); margin-bottom: 0.35rem;">
                            Portal Assistant Response
                        </div>
                        <div style="color: var(--text-main); font-size: 0.95rem; line-height: 1.6;">
                            ${data.reply}
                        </div>
                    </div>
                </div>
            </div>
            `;
        } catch (err) {
            responseContainer.innerHTML = `<p style="color: var(--danger); margin-top: 1rem;">Assistant error: ${err.message}</p>`;
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>Ask Assistant</span> ✨';
            }
        }
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            sendQuestion(input.value);
        });
    }

    document.querySelectorAll('.btn-suggestion').forEach(btn => {
        btn.addEventListener('click', () => {
            if (input) {
                input.value = btn.dataset.prompt;
                sendQuestion(btn.dataset.prompt);
            }
        });
    });
}
