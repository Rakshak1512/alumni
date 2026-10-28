/**
 * Search Alumni Component
 */
import { api } from '../api.js';

export function renderSearchAlumni() {
    return `
    <div id="searchAlumniPage">
        <div class="page-header">
            <div class="page-header-title">
                <h1>Alumni Directory & Mentors</h1>
                <p>Discover and connect with verified alumni working across industries worldwide.</p>
            </div>
        </div>

        <!-- Search Filters Card -->
        <div class="card" style="margin-bottom: 2rem;">
            <form id="alumniSearchForm" style="background: transparent; padding: 0; border: none; box-shadow: none;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; align-items: flex-end;">
                    <div>
                        <label for="alumniBranch">Branch / Department</label>
                        <input type="text" id="alumniBranch" name="branch" placeholder="e.g. Computer Science, ECE">
                    </div>

                    <div>
                        <label for="alumniCompany">Company / Organization</label>
                        <input type="text" id="alumniCompany" name="company" placeholder="e.g. Google, Microsoft">
                    </div>

                    <div>
                        <label for="alumniGradYear">Graduation Year</label>
                        <input type="number" id="alumniGradYear" name="grad_year" placeholder="e.g. 2022">
                    </div>

                    <div style="display: flex; gap: 0.5rem;">
                        <button type="submit" class="btn btn-primary" style="margin: 0; width: 100%;">
                            🔍 Search
                        </button>
                        <button type="button" id="resetAlumniSearchBtn" class="btn btn-secondary" style="margin: 0;">Reset</button>
                    </div>
                </div>
            </form>
        </div>

        <!-- Results Table -->
        <div class="card" style="padding: 0; overflow: hidden;">
            <div style="padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-light); background: #ffffff;">
                <h3 style="font-size: 1.15rem; margin: 0;" id="alumniResultsCount">Verified Alumni</h3>
            </div>
            <div id="alumniResultsContainer">
                <p style="padding: 2rem; text-align: center;">Loading alumni...</p>
            </div>
        </div>
    </div>
    `;
}

export async function initSearchAlumni() {
    const form = document.getElementById('alumniSearchForm');
    const container = document.getElementById('alumniResultsContainer');
    const countLabel = document.getElementById('alumniResultsCount');
    const resetBtn = document.getElementById('resetAlumniSearchBtn');

    async function loadAlumni(branch = '', company = '', grad_year = '') {
        if (!container) return;
        container.innerHTML = '<p style="padding: 2rem; text-align: center;">Searching alumni directory...</p>';

        try {
            const data = await api.get(`/api/alumni/search?branch=${encodeURIComponent(branch)}&company=${encodeURIComponent(company)}&grad_year=${encodeURIComponent(grad_year)}`);
            const results = data.results || [];

            if (countLabel) {
                countLabel.textContent = `Verified Alumni (${results.length})`;
            }

            if (results.length === 0) {
                container.innerHTML = `
                <div class="empty-state" style="margin: 0; border: none; border-radius: 0;">
                    <div class="empty-state-icon">🔍</div>
                    <h3>No alumni found matching criteria</h3>
                    <p>Try broadening your search or clearing the branch/company filters to view all verified alumni.</p>
                </div>
                `;
                return;
            }

            container.innerHTML = `
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>Alumni</th>
                            <th>Branch</th>
                            <th>Current Company</th>
                            <th>Batch</th>
                            <th>Location</th>
                            <th style="text-align: right;">Connect</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.map(a => `
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                    <div style="width: 38px; height: 38px; border-radius: 50%; background: var(--gradient-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.95rem; flex-shrink: 0;">
                                        ${(a.name || 'A')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div style="display: flex; align-items: center; gap: 0.35rem;">
                                            <strong style="color: var(--text-main);">${a.name}</strong>
                                            <span title="Verified Alumni" style="color: var(--success); font-size: 0.9rem;">✓</span>
                                        </div>
                                        <span style="font-size: 0.8rem; color: var(--text-muted);">${a.email}</span>
                                    </div>
                                </div>
                            </td>
                            <td><span class="tag tag-neutral">${a.branch || 'Alumni'}</span></td>
                            <td><strong>${a.company || 'Industry Professional'}</strong></td>
                            <td><span class="tag tag-neutral">${a.grad_year || 'Alumni'}</span></td>
                            <td><span style="color: var(--text-muted);">📍 ${a.location || 'Global'}</span></td>
                            <td style="text-align: right;">
                                <a href="#/chat/${a.id}" class="btn btn-sm btn-primary">💬 Message</a>
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            `;
        } catch (err) {
            container.innerHTML = `<p style="color: var(--danger); padding: 1.5rem;">Failed to search: ${err.message}</p>`;
        }
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            loadAlumni(form.branch.value, form.company.value, form.grad_year.value);
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            form.reset();
            loadAlumni('', '', '');
        });
    }

    loadAlumni();
}
