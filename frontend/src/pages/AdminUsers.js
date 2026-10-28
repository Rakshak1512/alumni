/**
 * Admin User Management SPA Component
 */
import { api } from '../api.js';
import { showToast } from '../state.js';

export function renderAdminUsers() {
    return `
    <div class="page-header">
        <div class="page-header-title">
            <h1>Admin User Management</h1>
            <p>View, search, and inspect registered students, verified alumni, faculty, and administrators.</p>
        </div>
        <div style="display: flex; gap: 0.75rem;">
            <a href="#/dashboard" class="btn btn-secondary">
                ← Back to Dashboard
            </a>
            <a href="#/admin/database" class="btn btn-secondary">
                🗄️ Database Viewer
            </a>
        </div>
    </div>

    <!-- Search & Filters -->
    <div class="card" style="margin-bottom: 2rem;">
        <form id="adminUserFilterForm" style="background: transparent; padding: 0; border: none; box-shadow: none;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; align-items: flex-end;">
                <div>
                    <label for="uSearch">Search Name or Email</label>
                    <input type="text" id="uSearch" name="search" placeholder="e.g. John, student@college.edu">
                </div>

                <div>
                    <label for="uRole">Filter by Role</label>
                    <select id="uRole" name="role">
                        <option value="">All Roles</option>
                        <option value="student">🎓 Student</option>
                        <option value="alumni">💼 Alumni</option>
                        <option value="faculty">👨‍🏫 Faculty</option>
                        <option value="admin">🛡️ Admin</option>
                    </select>
                </div>

                <div>
                    <label for="uStatus">Filter by Status</label>
                    <select id="uStatus" name="status">
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                    </select>
                </div>

                <div style="display: flex; gap: 0.5rem;">
                    <button type="submit" class="btn btn-primary" style="margin: 0; width: 100%;">
                        🔍 Apply Filters
                    </button>
                    <button type="button" id="resetFiltersBtn" class="btn btn-secondary" style="margin: 0;">Reset</button>
                </div>
            </div>
        </form>
    </div>

    <!-- Users Table Container -->
    <div class="card" style="padding: 0; overflow: hidden;">
        <div style="padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-light); background: #ffffff;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <h3 style="font-size: 1.15rem; margin: 0;">Registered Accounts</h3>
                <span class="tag tag-primary" id="userCountTag">Loading...</span>
            </div>
        </div>

        <div id="usersTableContainer">
            <p style="padding: 2rem; text-align: center;">Loading registered accounts...</p>
        </div>
    </div>
    `;
}

export async function initAdminUsers() {
    const form = document.getElementById('adminUserFilterForm');
    const container = document.getElementById('usersTableContainer');
    const countTag = document.getElementById('userCountTag');
    const resetBtn = document.getElementById('resetFiltersBtn');

    async function loadUsers(search = '', role = '', status = '') {
        if (!container) return;
        container.innerHTML = '<p style="padding: 2rem; text-align: center;">Fetching accounts from database...</p>';

        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (role) params.append('role', role);
            if (status) params.append('status', status);

            const data = await api.get(`/api/admin/users?${params.toString()}`);
            const users = data.users || [];

            if (countTag) {
                countTag.textContent = `${users.length} user${users.length !== 1 ? 's' : ''}`;
            }

            if (users.length === 0) {
                container.innerHTML = `
                <div class="empty-state" style="margin: 0; border: none; border-radius: 0;">
                    <div class="empty-state-icon">👥</div>
                    <h3>No matching users found</h3>
                    <p>Try clearing your search query or changing filter parameters.</p>
                </div>
                `;
                return;
            }

            container.innerHTML = `
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 60px;">ID</th>
                            <th>Name & User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>ID (UUCMS/Faculty)</th>
                            <th>Branch / Dept</th>
                            <th>Grad / CGPA</th>
                            <th>Company</th>
                            <th>Certificate</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(u => `
                        <tr>
                            <td><span style="font-weight: 700; color: var(--text-muted); font-size: 0.85rem;">#${u.id}</span></td>
                            <td>
                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                    ${u.profile_pic ? `
                                    <img src="/static/${u.profile_pic}" alt="${u.name}" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover;">
                                    ` : `
                                    <div style="width: 34px; height: 34px; border-radius: 50%; background: var(--gradient-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; flex-shrink: 0;">
                                        ${(u.name || 'U')[0].toUpperCase()}
                                    </div>
                                    `}
                                    <div>
                                        <strong style="color: var(--text-main); font-size: 0.95rem;">${u.name}</strong>
                                        ${u.username ? `<div style="font-size: 0.75rem; color: var(--text-muted);">@${u.username}</div>` : ''}
                                    </div>
                                </div>
                            </td>
                            <td><span style="color: var(--text-muted); font-size: 0.9rem;">${u.email}</span></td>
                            <td>
                                <span class="tag ${u.role === 'admin' ? 'tag-danger' : u.role === 'alumni' ? 'tag-primary' : u.role === 'faculty' ? 'tag-warning' : 'tag-neutral'}">
                                    ${u.role}
                                </span>
                            </td>
                            <td>
                                <strong style="font-size: 0.85rem; color: var(--text-main);">
                                    ${u.uucms_id || u.faculty_id || '—'}
                                </strong>
                            </td>
                            <td><span class="tag tag-neutral">${u.department || u.branch || '—'}</span></td>
                            <td>
                                <div style="font-size: 0.9rem;">${u.grad_year || '—'}</div>
                                ${u.cgpa ? `<div style="font-size: 0.75rem; color: var(--primary); font-weight: 700;">CGPA: ${u.cgpa}</div>` : ''}
                            </td>
                            <td><strong style="color: var(--text-main); font-size: 0.9rem;">${u.company || '—'}</strong></td>
                            <td>
                                ${u.certificate_file ? `
                                <a href="/static/${u.certificate_file}" target="_blank" class="btn btn-sm btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; text-decoration: none;">
                                    📄 Cert
                                </a>
                                ` : '—'}
                            </td>
                            <td>
                                <span class="tag ${u.status === 'active' ? 'tag-success' : 'tag-warning'}">
                                    ${u.status}
                                </span>
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            `;
        } catch (err) {
            container.innerHTML = `<p style="color: var(--danger); padding: 2rem;">Error loading users: ${err.message}</p>`;
        }
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            loadUsers(form.search.value.trim(), form.role.value, form.status.value);
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (form) {
                form.reset();
                loadUsers('', '', '');
            }
        });
    }

    loadUsers();
}
