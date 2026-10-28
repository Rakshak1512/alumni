/**
 * Resources Page Component
 */
import { api } from '../api.js';
import { state } from '../state.js';

export function renderResources() {
    return `
    <div id="resourcesPage">
        <div class="page-header">
            <div class="page-header-title">
                <h1>Study & Career Resources</h1>
                <p>Curated tutorials, lecture notes, prep guides, and videos shared by faculty and alumni.</p>
            </div>
            ${state.user && ['faculty', 'admin', 'alumni'].includes(state.user.role) ? `
            <div>
                <a href="#/resources/new" class="btn btn-primary">
                    <span>➕ Add Resource</span>
                </a>
            </div>
            ` : ''}
        </div>

        <!-- Search Bar -->
        <div class="card" style="margin-bottom: 2rem;">
            <form id="resourceSearchForm" style="background: transparent; padding: 0; border: none; box-shadow: none;">
                <div style="display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 260px;">
                        <label for="resourceSearch">Search Resources</label>
                        <input type="text" id="resourceSearch" name="search" placeholder="Search by title, topic, or description...">
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button type="submit" class="btn btn-primary" style="margin: 0;">Search</button>
                        <button type="button" id="resetResourceSearchBtn" class="btn btn-secondary" style="margin: 0;">Reset</button>
                    </div>
                </div>
            </form>
        </div>

        <!-- Grid Container -->
        <div id="resourcesGridContainer">
            <p>Loading resources...</p>
        </div>
    </div>
    `;
}

export async function initResources(queryParams = {}) {
    const container = document.getElementById('resourcesGridContainer');
    const form = document.getElementById('resourceSearchForm');
    const searchInput = document.getElementById('resourceSearch');
    const resetBtn = document.getElementById('resetResourceSearchBtn');

    if (queryParams.search && searchInput) searchInput.value = queryParams.search;

    async function loadResources(search = '') {
        if (!container) return;
        container.innerHTML = '<p style="text-align: center; padding: 2rem;">Loading resources...</p>';

        try {
            const data = await api.get(`/api/resources?search=${encodeURIComponent(search)}`);
            const resources = data.resources || [];

            if (resources.length === 0) {
                container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📚</div>
                    <h3>No resources found</h3>
                    <p>No study materials or preparation guides match your query.</p>
                </div>
                `;
                return;
            }

            container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
                ${resources.map(r => `
                <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; margin-bottom: 0; padding: 1.75rem;">
                    <div>
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.85rem;">
                            <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: #eef2ff; color: #4f46e5; display: flex; align-items: center; justify-content: center; font-size: 1.35rem;">
                                ${r.link && (r.link.includes('youtube.com') || r.link.includes('youtu.be')) ? '🎥' : r.file_path ? '📄' : '🔗'}
                            </div>
                            
                            <span class="tag tag-neutral">
                                ${r.link && (r.link.includes('youtube.com') || r.link.includes('youtu.be')) ? 'Video Lecture' : r.file_path ? 'Document / PDF' : 'Web Resource'}
                            </span>
                        </div>

                        <h3 style="font-size: 1.2rem; color: var(--text-main); margin-bottom: 0.5rem; line-height: 1.3;">
                            ${r.title}
                        </h3>

                        ${r.description ? `
                        <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 1.25rem; line-height: 1.5;">
                            ${r.description}
                        </p>
                        ` : ''}
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--border-light);">
                        ${r.link ? `
                            ${r.link.includes('youtube.com') || r.link.includes('youtu.be') ? `
                            <a href="${r.link}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary" style="background: #ef4444; width: 100%;">
                                <span>▶️ Watch on YouTube</span>
                            </a>
                            ` : `
                            <a href="${r.link}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary" style="width: 100%;">
                                <span>🔗 Open External Link</span> →
                            </a>
                            `}
                        ` : ''}

                        ${r.file_path ? `
                        <a href="/static/${r.file_path}" target="_blank" class="btn btn-sm btn-secondary" style="width: 100%;">
                            <span>📥 Download Attached File</span>
                        </a>
                        ` : ''}
                    </div>
                </div>
                `).join('')}
            </div>
            `;
        } catch (err) {
            container.innerHTML = `<p style="color: var(--danger);">Failed to load resources: ${err.message}</p>`;
        }
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            loadResources(searchInput.value);
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            searchInput.value = '';
            loadResources('');
        });
    }

    loadResources(queryParams.search || '');
}
