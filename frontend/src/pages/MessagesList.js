/**
 * Messages List Directory Component
 */
import { api } from '../api.js';

export function renderMessagesList() {
    return `
    <div id="messagesListPage">
        <div class="page-header">
            <div class="page-header-title">
                <h1>Direct Messages & Mentorship</h1>
                <p>Connect 1-on-1 with alumni mentors, students, and faculty members.</p>
            </div>
        </div>

        <div class="card" style="padding: 0; overflow: hidden; max-width: 900px; margin: 0 auto;">
            <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-light); background: #ffffff;">
                <h3 style="font-size: 1.15rem; margin: 0;">Community Members</h3>
            </div>

            <div id="peopleListContainer">
                <p style="padding: 2rem; text-align: center;">Loading members...</p>
            </div>
        </div>
    </div>
    `;
}

export async function initMessagesList() {
    const container = document.getElementById('peopleListContainer');
    if (!container) return;

    try {
        const data = await api.get('/api/messages');
        const people = data.people || [];

        if (people.length === 0) {
            container.innerHTML = `
            <div class="empty-state" style="margin: 0; border: none; border-radius: 0;">
                <div class="empty-state-icon">💬</div>
                <h3>No community members found</h3>
                <p>As other students, alumni, and faculty join the portal, they will appear here for messaging.</p>
            </div>
            `;
            return;
        }

        container.innerHTML = `
        <div style="overflow-x: auto;">
            <table>
                <thead>
                    <tr>
                        <th>Member</th>
                        <th>Role</th>
                        <th style="text-align: right;">Start Chat</th>
                    </tr>
                </thead>
                <tbody>
                    ${people.map(person => `
                    <tr>
                        <td>
                            <div style="display: flex; align-items: center; gap: 0.85rem;">
                                ${person.profile_pic ? `
                                <img src="/static/${person.profile_pic}" alt="${person.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                                ` : `
                                <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--gradient-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem;">
                                    ${(person.name || 'U')[0].toUpperCase()}
                                </div>
                                `}
                                <div>
                                    <strong style="color: var(--text-main); font-size: 0.95rem;">${person.name}</strong>
                                    <div style="font-size: 0.8rem; color: var(--text-muted);">${person.email}</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <span class="tag ${person.role === 'alumni' ? 'tag-primary' : person.role === 'faculty' ? 'tag-warning' : 'tag-neutral'}">
                                ${person.role}
                            </span>
                        </td>
                        <td style="text-align: right;">
                            <a href="#/chat/${person.id}" class="btn btn-sm btn-primary">
                                💬 Message →
                            </a>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        `;
    } catch (err) {
        container.innerHTML = `<p style="color: var(--danger); padding: 2rem;">Failed to load members: ${err.message}</p>`;
    }
}
