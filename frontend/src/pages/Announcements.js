/**
 * Announcements Bulletin Component
 */
import { api } from '../api.js';
import { state, showToast } from '../state.js';

export function renderAnnouncements() {
    const isAuthorized = state.user && ['admin', 'faculty'].includes(state.user.role);

    return `
    <div id="announcementsPage">
        <div class="page-header">
            <div class="page-header-title">
                <h1>Campus Bulletins & Announcements</h1>
                <p>Official announcements, upcoming alumni meetups, webinars, and placement updates.</p>
            </div>
        </div>

        <div style="max-width: 820px; margin: 0 auto;">
            ${isAuthorized ? `
            <!-- Announcement Form -->
            <div class="card" style="margin-bottom: 2.5rem;">
                <div class="card-header">
                    <h3 class="card-title">📢 Broadcast New Announcement</h3>
                </div>
                <form id="announcementForm" style="background: transparent; padding: 0; border: none; box-shadow: none;">
                    <div class="form-group">
                        <label for="annTitle">Announcement Subject / Title <span style="color: var(--danger);">*</span></label>
                        <input type="text" id="annTitle" name="title" placeholder="e.g. Annual Alumni Reunion 2026 / Campus Drive Notice" required>
                    </div>

                    <div class="form-group">
                        <label for="annContent">Announcement Message <span style="color: var(--danger);">*</span></label>
                        <textarea id="annContent" name="content" rows="4" placeholder="Write full details, dates, zoom links, or instructions..." required></textarea>
                    </div>

                    <div style="display: flex; justify-content: flex-end;">
                        <button type="submit" class="btn btn-primary" id="annSubmitBtn">
                            <span>Broadcast Announcement</span> 📢
                        </button>
                    </div>
                </form>
            </div>
            ` : ''}

            <!-- Announcements Feed Container -->
            <div id="announcementsListContainer">
                <p>Loading bulletins...</p>
            </div>
        </div>
    </div>
    `;
}

export async function initAnnouncements() {
    const form = document.getElementById('announcementForm');
    const container = document.getElementById('announcementsListContainer');

    async function loadAnnouncements() {
        if (!container) return;
        container.innerHTML = '<p style="text-align: center; padding: 2rem;">Fetching campus bulletins...</p>';

        try {
            const data = await api.get('/api/announcements');
            const items = data.announcements || [];

            if (items.length === 0) {
                container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📢</div>
                    <h3>No announcements yet</h3>
                    <p>Stay tuned! Official college bulletins and event updates will appear here.</p>
                </div>
                `;
                return;
            }

            container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                ${items.map(a => `
                <div class="card" style="padding: 1.75rem;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 0.85rem; flex-wrap: wrap;">
                        <h3 style="font-size: 1.25rem; color: var(--text-main); margin: 0;">${a.title}</h3>
                        <span class="tag tag-primary">📢 Official Notice</span>
                    </div>

                    <p style="color: var(--text-main); font-size: 0.95rem; line-height: 1.6; white-space: pre-line; margin-bottom: 1.25rem;">
                        ${a.content}
                    </p>

                    <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 0.85rem; border-top: 1px solid var(--border-light); font-size: 0.82rem; color: var(--text-muted);">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span>✍️ Posted by: <strong>${a.author || 'Faculty / Administration'}</strong></span>
                        </div>
                        <div>
                            <span>📅 ${a.created_at || 'Recent'}</span>
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>
            `;
        } catch (err) {
            container.innerHTML = `<p style="color: var(--danger);">Failed to load announcements: ${err.message}</p>`;
        }
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('annSubmitBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Broadcasting...';

            try {
                const res = await api.post('/api/announcements', {
                    title: form.title.value,
                    content: form.content.value,
                });
                showToast(res.message || 'Announcement broadcasted!', 'success');
                form.reset();
                loadAnnouncements();
            } catch (err) {
                showToast(err.message || 'Failed to post announcement.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>Broadcast Announcement</span> 📢';
            }
        });
    }

    loadAnnouncements();
}
