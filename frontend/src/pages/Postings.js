/**
 * Job & Internship Postings Page Component
 */
import { api } from '../api.js';
import { state, showToast } from '../state.js';

export function renderPostings() {
    return `
    <div id="postingsPage">
        <div class="page-header">
            <div class="page-header-title">
                <h1>Career & Internship Opportunities</h1>
                <p>Explore verified full-time roles, internships, and referral opportunities posted by our alumni.</p>
            </div>
            ${state.user && ['alumni', 'admin'].includes(state.user.role) ? `
            <div>
                <a href="#/postings/new" class="btn btn-primary">
                    <span>➕ Post an Opportunity</span>
                </a>
            </div>
            ` : ''}
        </div>

        <!-- Filter Bar -->
        <div class="card" style="margin-bottom: 2rem;">
            <form id="postingsFilterForm" style="background: transparent; padding: 0; border: none; box-shadow: none;">
                <div style="display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
                    <div style="flex: 2; min-width: 240px;">
                        <label for="postingsSearch">Keyword Search</label>
                        <input type="text" id="postingsSearch" name="search" placeholder="Search by title, skills, description...">
                    </div>
                    <div style="flex: 1; min-width: 160px;">
                        <label for="postingsType">Position Type</label>
                        <select id="postingsType" name="type">
                            <option value="">All Types</option>
                            <option value="job">💼 Full-Time Jobs</option>
                            <option value="internship">🎓 Internships</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button type="submit" class="btn btn-primary" style="margin: 0;">Filter Results</button>
                        <button type="button" id="resetPostingsBtn" class="btn btn-secondary" style="margin: 0;">Reset</button>
                    </div>
                </div>
            </form>
        </div>

        <!-- Results List -->
        <div id="postingsListContainer">
            <p>Loading postings...</p>
        </div>
    </div>
    `;
}

export async function initPostings(queryParams = {}) {
    const container = document.getElementById('postingsListContainer');
    const form = document.getElementById('postingsFilterForm');
    const searchInput = document.getElementById('postingsSearch');
    const typeSelect = document.getElementById('postingsType');
    const resetBtn = document.getElementById('resetPostingsBtn');

    if (queryParams.search && searchInput) searchInput.value = queryParams.search;
    if (queryParams.type && typeSelect) typeSelect.value = queryParams.type;

    async function loadPostings(search = '', type = '') {
        if (!container) return;
        container.innerHTML = '<p style="text-align:center; padding: 2rem;">Loading opportunities...</p>';

        try {
            const data = await api.get(`/api/postings?search=${encodeURIComponent(search)}&type=${encodeURIComponent(type)}`);
            const postings = data.postings || [];

            if (postings.length === 0) {
                container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💼</div>
                    <h3>No postings found</h3>
                    <p>We couldn't find any opportunities matching your criteria. Try searching with different keywords.</p>
                </div>
                `;
                return;
            }

            container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                ${postings.map(p => `
                <div class="card" style="padding: 1.75rem;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.35rem;">
                                <h2 style="font-size: 1.35rem; color: var(--text-main); margin: 0;">${p.title}</h2>
                                <span class="tag ${p.type === 'job' ? 'tag-primary' : 'tag-success'}">${p.type}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); font-size: 0.9rem;">
                                <span>🏢 <strong>${p.company || 'Enterprise Partner'}</strong></span>
                                <span>•</span>
                                <span>Posted by ${p.alumni_name}</span>
                            </div>
                        </div>

                        ${p.apply_link ? `
                        <a href="${p.apply_link}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                            <span>Apply Directly</span> →
                        </a>
                        ` : ''}
                    </div>

                    <div style="display: flex; flex-wrap: wrap; gap: 0.65rem; margin-bottom: 1.25rem;">
                        ${p.location ? `<span class="tag tag-neutral">📍 ${p.location}</span>` : ''}
                        ${p.experience ? `<span class="tag tag-neutral">⏳ Exp: ${p.experience}</span>` : ''}
                        ${p.education ? `<span class="tag tag-neutral">🎓 ${p.education}</span>` : ''}
                    </div>

                    ${p.skills ? `
                    <div style="background: #f8fafc; padding: 0.75rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-light); margin-bottom: 1rem; font-size: 0.88rem;">
                        <strong style="color: var(--text-main);">Required Skills:</strong>
                        <span style="color: var(--text-muted); margin-left: 0.35rem;">${p.skills}</span>
                    </div>
                    ` : ''}

                    <div style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; white-space: pre-line;">
                        ${p.description}
                    </div>
                </div>
                `).join('')}
            </div>
            `;
        } catch (err) {
            container.innerHTML = `<p style="color: var(--danger);">Failed to load postings: ${err.message}</p>`;
        }
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            loadPostings(searchInput.value, typeSelect.value);
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            searchInput.value = '';
            typeSelect.value = '';
            loadPostings('', '');
        });
    }

    loadPostings(queryParams.search || '', queryParams.type || '');
}
