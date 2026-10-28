/**
 * Admin Database Viewer SPA Component
 */
import { api } from '../api.js';

export function renderAdminDatabase() {
    return `
    <div id="adminDbAppContainer">
        <p style="text-align: center; padding: 2rem;">Connecting to database viewer...</p>
    </div>
    `;
}

export async function initAdminDatabase() {
    const container = document.getElementById('adminDbAppContainer');
    if (!container) return;

    let currentTable = '';
    let currentPage = 1;
    let currentQuery = '';

    async function fetchTableData(tableName = '', page = 1, query = '') {
        try {
            const params = new URLSearchParams();
            if (tableName) params.append('table', tableName);
            if (page) params.append('page', page);
            if (query) params.append('q', query);

            const data = await api.get(`/api/admin/database?${params.toString()}`);
            currentTable = data.selected_table;
            currentPage = data.page;
            currentQuery = query;

            container.innerHTML = `
            <div class="page-header">
                <div class="page-header-title">
                    <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                        <h1>SQLite Database Viewer</h1>
                        <span class="tag tag-success" style="font-size: 0.8rem;">● ${data.db_status}</span>
                    </div>
                    <p style="margin-top: 0.35rem;">
                        Read-only development database explorer inspecting <code>${data.db_path}</code>
                    </p>
                </div>
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                    <a href="#/admin/users" class="btn btn-secondary">👥 Admin Users</a>
                    <a href="#/dashboard" class="btn btn-secondary">← Back to Dashboard</a>
                </div>
            </div>

            <!-- Database Stats Summary Bar -->
            <div class="card" style="padding: 1.25rem 1.5rem; margin-bottom: 2rem; background: var(--gradient-card); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.85rem;">
                    <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: #eef2ff; color: #4f46e5; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
                        🗄️
                    </div>
                    <div>
                        <strong style="color: var(--text-main); font-size: 0.95rem;">Database File:</strong>
                        <span style="font-family: monospace; font-size: 0.85rem; color: var(--text-muted); display: block; word-break: break-all;">
                            ${data.db_path}
                        </span>
                    </div>
                </div>
                <div style="display: flex; gap: 0.75rem;">
                    <span class="tag tag-primary" style="font-size: 0.85rem; padding: 0.4rem 0.9rem;">
                        ${data.tables.length} Tables Discovered
                    </span>
                </div>
            </div>

            <!-- 2-Column Layout -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)) 3fr; gap: 1.5rem; align-items: flex-start;">
                <!-- Tables Sidebar -->
                <div class="card" style="padding: 0; overflow: hidden;">
                    <div style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-light); background: #ffffff;">
                        <h3 style="font-size: 1rem; margin: 0;">Available Tables</h3>
                    </div>
                    <div style="display: flex; flex-direction: column;">
                        ${data.tables.map(t => `
                        <button type="button" class="btn-select-table" data-table="${t.name}"
                            style="display: flex; align-items: center; justify-content: space-between; padding: 0.9rem 1.25rem; border: none; border-bottom: 1px solid var(--border-light); text-align: left; font-weight: 600; font-size: 0.92rem; cursor: pointer; transition: background 0.15s ease; ${t.name === currentTable ? 'background: var(--primary-light); color: var(--primary-hover); border-left: 4px solid var(--primary);' : 'background: #ffffff; color: var(--text-main);'}">
                            <span style="display: flex; align-items: center; gap: 0.5rem;">
                                <span>📋</span> <span>${t.name}</span>
                            </span>
                            <span class="tag ${t.name === currentTable ? 'tag-primary' : 'tag-neutral'}" style="font-size: 0.75rem;">
                                ${t.count} rows
                            </span>
                        </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Data Table Column -->
                <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                    <!-- Table Search & Info Bar -->
                    <div class="card" style="margin-bottom: 0; padding: 1.25rem 1.5rem;">
                        <form id="dbSearchForm" style="background: transparent; padding: 0; border: none; box-shadow: none; display: flex; gap: 1rem; align-items: center; justify-content: space-between; flex-wrap: wrap;">
                            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                                <h2 style="font-size: 1.35rem; margin: 0; color: var(--text-main);">
                                    Table: <span style="color: var(--primary);">${currentTable}</span>
                                </h2>
                                <span class="tag tag-neutral" style="font-size: 0.8rem;">
                                    ${data.total_records} record${data.total_records !== 1 ? 's' : ''} found
                                </span>
                            </div>

                            <div style="display: flex; gap: 0.5rem; align-items: center;">
                                <input type="text" id="dbSearchInput" value="${currentQuery}" placeholder="Search rows..." style="padding: 0.45rem 0.85rem; font-size: 0.88rem; width: 220px;">
                                <button type="submit" class="btn btn-sm btn-primary" style="margin: 0;">🔍 Search</button>
                                ${currentQuery ? `<button type="button" id="resetDbSearchBtn" class="btn btn-sm btn-secondary" style="margin: 0;">Reset</button>` : ''}
                            </div>
                        </form>
                    </div>

                    <!-- Security Note -->
                    <div style="display: flex; align-items: center; gap: 0.5rem; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: var(--radius-md); padding: 0.65rem 1rem; font-size: 0.85rem; color: #065f46;">
                        <span>🔒</span>
                        <span><strong>Read-Only Mode:</strong> Passwords, hashes, and sensitive secrets are automatically masked & filtered.</span>
                    </div>

                    <!-- Table Data -->
                    <div class="card" style="padding: 0; overflow: hidden; margin-bottom: 0;">
                        ${data.rows && data.rows.length > 0 ? `
                        <div style="overflow-x: auto; max-height: 580px;">
                            <table>
                                <thead>
                                    <tr>
                                        <th style="width: 50px; background: #f1f5f9;">#</th>
                                        ${data.columns.map(col => `<th>${col}</th>`).join('')}
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.rows.map((row, idx) => `
                                    <tr>
                                        <td style="color: var(--text-muted); font-size: 0.8rem; background: #f8fafc;">
                                            ${idx + 1 + (data.page - 1) * 25}
                                        </td>
                                        ${data.columns.map(col => `
                                        <td>
                                            ${row[col] === null ? '<span style="color: var(--text-subtle); font-style: italic;">NULL</span>' :
                                              col === 'status' ? `<span class="tag ${row[col] === 'active' ? 'tag-success' : 'tag-warning'}" style="font-size: 0.75rem;">${row[col]}</span>` :
                                              col === 'role' ? `<span class="tag ${row[col] === 'admin' ? 'tag-danger' : row[col] === 'alumni' ? 'tag-primary' : row[col] === 'faculty' ? 'tag-warning' : 'tag-neutral'}" style="font-size: 0.75rem;">${row[col]}</span>` :
                                              `<span style="font-size: 0.9rem; word-break: break-word;">${row[col]}</span>`
                                            }
                                        </td>
                                        `).join('')}
                                    </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>

                        ${data.total_pages > 1 ? `
                        <div style="padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-light); background: #ffffff;">
                            <span style="font-size: 0.85rem; color: var(--text-muted);">
                                Page ${data.page} of ${data.total_pages} (${data.total_records} rows)
                            </span>
                            <div style="display: flex; gap: 0.5rem;">
                                ${data.page > 1 ? `<button type="button" class="btn btn-sm btn-secondary" id="dbPrevPageBtn">← Previous</button>` : ''}
                                ${data.page < data.total_pages ? `<button type="button" class="btn btn-sm btn-secondary" id="dbNextPageBtn">Next →</button>` : ''}
                            </div>
                        </div>
                        ` : ''}
                        ` : `
                        <div class="empty-state" style="margin: 0; border: none; border-radius: 0;">
                            <div class="empty-state-icon">🗄️</div>
                            <h3>No records found</h3>
                            <p>No rows in table <code>${currentTable}</code> matched your query.</p>
                        </div>
                        `}
                    </div>
                </div>
            </div>
            `;

            // Bind table selector clicks
            document.querySelectorAll('.btn-select-table').forEach(btn => {
                btn.addEventListener('click', () => {
                    fetchTableData(btn.dataset.table, 1, '');
                });
            });

            // Bind search
            const searchForm = document.getElementById('dbSearchForm');
            if (searchForm) {
                searchForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const qInput = document.getElementById('dbSearchInput');
                    fetchTableData(currentTable, 1, qInput.value.trim());
                });
            }

            const resetBtn = document.getElementById('resetDbSearchBtn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    fetchTableData(currentTable, 1, '');
                });
            }

            const prevBtn = document.getElementById('dbPrevPageBtn');
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    fetchTableData(currentTable, currentPage - 1, currentQuery);
                });
            }

            const nextBtn = document.getElementById('dbNextPageBtn');
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    fetchTableData(currentTable, currentPage + 1, currentQuery);
                });
            }

        } catch (err) {
            container.innerHTML = `<p style="color: var(--danger); padding: 2rem;">Failed to load database: ${err.message}</p>`;
        }
    }

    fetchTableData();
}
