/**
 * Alumni By Location Page Component
 */
import { api } from '../api.js';

export function renderAlumniByLocation() {
    return `
    <div id="alumniByLocationPage">
        <div class="page-header">
            <div class="page-header-title">
                <h1>Alumni Geographic Distribution</h1>
                <p>Explore where our alumni community lives and works across cities and global tech hubs.</p>
            </div>
            <div>
                <a href="#/alumni/search" class="btn btn-secondary">
                    <span>🔍 Browse Alumni Directory</span>
                </a>
            </div>
        </div>

        <div style="max-width: 800px; margin: 0 auto;" id="locationListContainer">
            <p>Loading location statistics...</p>
        </div>
    </div>
    `;
}

export async function initAlumniByLocation() {
    const container = document.getElementById('locationListContainer');
    if (!container) return;

    try {
        const data = await api.get('/api/alumni/by-location');
        const locations = data.locations || [];

        if (locations.length === 0) {
            container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📍</div>
                <h3>No location data recorded yet</h3>
                <p>As alumni register and update their profiles with their cities, location analytics will appear here.</p>
                <a href="#/alumni/search" class="btn btn-primary">Find Alumni</a>
            </div>
            `;
            return;
        }

        container.innerHTML = `
        <div class="card" style="padding: 0; overflow: hidden;">
            <div style="padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-light); background: #ffffff;">
                <h3 style="font-size: 1.15rem; margin: 0;">Top Alumni Locations</h3>
                <span class="tag tag-primary">${locations.length} hubs</span>
            </div>

            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>City / Region Hub</th>
                            <th style="text-align: right;">Alumni Count</th>
                            <th style="text-align: right;">Explore</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${locations.map(row => `
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                    <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: #eef2ff; color: #4f46e5; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
                                        📍
                                    </div>
                                    <strong style="color: var(--text-main); font-size: 0.95rem;">${row.location}</strong>
                                </div>
                            </td>
                            <td style="text-align: right;">
                                <span class="tag tag-primary" style="font-size: 0.85rem; padding: 0.3rem 0.85rem;">
                                    ${row.total} ${row.total === 1 ? 'member' : 'members'}
                                </span>
                            </td>
                            <td style="text-align: right;">
                                <a href="#/alumni/search" class="btn btn-sm btn-secondary">View →</a>
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        `;
    } catch (err) {
        container.innerHTML = `<p style="color: var(--danger);">Failed to load location statistics: ${err.message}</p>`;
    }
}
