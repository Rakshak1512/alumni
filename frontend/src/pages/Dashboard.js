/**
 * Dashboard Page Component (Role-based: Admin, Alumni, Student, Faculty)
 */
import { api } from '../api.js';
import { state, showToast } from '../state.js';

export function renderDashboard() {
    return `
    <div id="dashboardContainer">
        <div class="page-header">
            <div class="page-header-title">
                <h1>Loading Dashboard...</h1>
                <p>Retrieving your account updates and statistics</p>
            </div>
        </div>
        <div class="card" style="text-align: center; padding: 3rem;">
            <p>Loading data...</p>
        </div>
    </div>
    `;
}

export async function initDashboard() {
    const container = document.getElementById('dashboardContainer');
    if (!container) return;

    try {
        const data = await api.get('/api/dashboard');
        const user = data.user;
        const role = data.role;

        if (role === 'admin') {
            const stats = data.stats || {};
            const pending = data.pending_alumni || [];

            container.innerHTML = `
            <div class="page-header">
                <div class="page-header-title">
                    <h1>Admin Control Dashboard</h1>
                    <p>Overview of network statistics, pending alumni verifications, and platform activity.</p>
                </div>
                <div>
                    <a href="#/announcements" class="btn btn-primary">
                        <span>📢 Post Announcement</span>
                    </a>
                </div>
            </div>

            <!-- KPI Metrics Grid -->
            <div class="stats-grid">
                <div class="stat-card" style="--card-accent: #6366f1; --card-bg: #eef2ff; --card-color: #6366f1;">
                    <div class="stat-icon-wrapper">🎓</div>
                    <div class="stat-content">
                        <span class="stat-value">${stats.total_alumni || 0}</span>
                        <span class="stat-label">Active Alumni</span>
                    </div>
                </div>

                <div class="stat-card" style="--card-accent: #10b981; --card-bg: #ecfdf5; --card-color: #10b981;">
                    <div class="stat-icon-wrapper">🧑‍🎓</div>
                    <div class="stat-content">
                        <span class="stat-value">${stats.total_students || 0}</span>
                        <span class="stat-label">Enrolled Students</span>
                    </div>
                </div>

                <div class="stat-card" style="--card-accent: #f59e0b; --card-bg: #fffbeb; --card-color: #f59e0b;">
                    <div class="stat-icon-wrapper">💼</div>
                    <div class="stat-content">
                        <span class="stat-value">${stats.total_postings || 0}</span>
                        <span class="stat-label">Career Postings</span>
                    </div>
                </div>

                <div class="stat-card" style="--card-accent: #ec4899; --card-bg: #fdf2f8; --card-color: #ec4899;">
                    <div class="stat-icon-wrapper">📚</div>
                    <div class="stat-content">
                        <span class="stat-value">${stats.total_resources || 0}</span>
                        <span class="stat-label">Shared Resources</span>
                    </div>
                </div>
            </div>

            <!-- Pending Alumni Approvals Table -->
            <div class="card" style="padding: 0; overflow: hidden;">
                <div style="padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-light); background: #ffffff;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <h3 style="font-size: 1.15rem; margin: 0;">Pending Alumni Verifications</h3>
                        <span class="tag tag-warning">${pending.length} pending</span>
                    </div>
                </div>

                ${pending.length > 0 ? `
                <div style="overflow-x: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>Alumni Name</th>
                                <th>Email / Username</th>
                                <th>UUCMS ID</th>
                                <th>CGPA</th>
                                <th>Certificate</th>
                                <th>Branch & Details</th>
                                <th style="text-align: right;">Review Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pending.map(a => `
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                                        <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--gradient-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem;">
                                            ${(a.name || 'A')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <strong style="color: var(--text-main);">${a.name}</strong>
                                            ${a.username ? `<div style="font-size: 0.75rem; color: var(--text-muted);">@${a.username}</div>` : ''}
                                        </div>
                                    </div>
                                </td>
                                <td><span style="color: var(--text-muted); font-size: 0.85rem;">${a.email}</span></td>
                                <td>
                                    <div><strong style="font-size: 0.85rem;">${a.uucms_id || 'N/A'}</strong></div>
                                    ${a.last_year_uucms_id ? `<div style="font-size: 0.75rem; color: var(--text-muted);">Prev: ${a.last_year_uucms_id}</div>` : ''}
                                </td>
                                <td>
                                    <span class="tag tag-primary" style="font-weight: 700;">${a.cgpa ? `${a.cgpa} / 10` : 'N/A'}</span>
                                </td>
                                <td>
                                    ${a.certificate_file ? `
                                    <a href="/static/${a.certificate_file}" target="_blank" class="btn btn-sm btn-secondary" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.65rem; font-size: 0.8rem; text-decoration: none;">
                                        📄 View Cert
                                    </a>
                                    ` : `<span style="color: var(--text-muted); font-size: 0.8rem;">No file</span>`}
                                </td>
                                <td>
                                    <div style="font-size: 0.85rem;">${a.branch || 'N/A'}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-muted);">${a.grad_year ? `Batch ${a.grad_year}` : ''} ${a.company ? `• ${a.company}` : ''}</div>
                                </td>
                                <td style="text-align: right;">
                                    <div style="display: inline-flex; gap: 0.5rem;">
                                        <button class="btn btn-sm btn-success btn-approve-alumni" data-id="${a.id}">✓ Approve</button>
                                        <button class="btn btn-sm btn-danger btn-reject-alumni" data-id="${a.id}">✕ Reject</button>
                                    </div>
                                </td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : `
                <div class="empty-state" style="margin: 0; border: none; border-radius: 0;">
                    <div class="empty-state-icon">🎉</div>
                    <h3>All caught up!</h3>
                    <p>There are currently no pending alumni verification requests in the queue.</p>
                </div>
                `}
            </div>
            `;

            // Bind approve/reject actions
            container.querySelectorAll('.btn-approve-alumni').forEach(btn => {
                btn.addEventListener('click', async () => {
                    try {
                        await api.post(`/api/admin/approve/${btn.dataset.id}`);
                        showToast('Alumni approved successfully!', 'success');
                        initDashboard();
                    } catch (err) {
                        showToast(err.message, 'error');
                    }
                });
            });

            container.querySelectorAll('.btn-reject-alumni').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (confirm('Are you sure you want to reject this registration?')) {
                        try {
                            await api.post(`/api/admin/reject/${btn.dataset.id}`);
                            showToast('Alumni rejected and removed.', 'success');
                            initDashboard();
                        } catch (err) {
                            showToast(err.message, 'error');
                        }
                    }
                });
            });

        } else if (role === 'alumni') {
            const myPostings = data.my_postings || [];

            container.innerHTML = `
            <div class="page-header">
                <div class="page-header-title">
                    <h1>Welcome Back, ${user.name} 👋</h1>
                    <p>Manage your posted job opportunities, mentor students, and share career guidance.</p>
                </div>
                <div>
                    <a href="#/postings/new" class="btn btn-primary">
                        <span>➕ Post Job / Internship</span>
                    </a>
                </div>
            </div>

            <!-- Shortcuts -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
                <div class="card" style="margin-bottom: 0; display: flex; align-items: center; gap: 1.25rem;">
                    <div style="width: 50px; height: 50px; border-radius: var(--radius-md); background: #eef2ff; color: #4f46e5; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                        💼
                    </div>
                    <div>
                        <div style="font-size: 1.25rem; font-weight: 800;">${myPostings.length}</div>
                        <div style="color: var(--text-muted); font-size: 0.85rem; font-weight: 600;">Active Postings</div>
                    </div>
                </div>

                <div class="card" style="margin-bottom: 0; display: flex; align-items: center; gap: 1.25rem;">
                    <div style="width: 50px; height: 50px; border-radius: var(--radius-md); background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                        💬
                    </div>
                    <div>
                        <div style="font-size: 1.1rem; font-weight: 700;">Student Mentorship</div>
                        <a href="#/messages" style="font-size: 0.85rem; font-weight: 600;">Open Messages →</a>
                    </div>
                </div>

                <div class="card" style="margin-bottom: 0; display: flex; align-items: center; gap: 1.25rem;">
                    <div style="width: 50px; height: 50px; border-radius: var(--radius-md); background: #fffbeb; color: #d97706; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                        📢
                    </div>
                    <div>
                        <div style="font-size: 1.1rem; font-weight: 700;">Campus Bulletins</div>
                        <a href="#/announcements" style="font-size: 0.85rem; font-weight: 600;">View Announcements →</a>
                    </div>
                </div>
            </div>

            <!-- Published Postings Table -->
            <div class="card" style="padding: 0; overflow: hidden;">
                <div style="padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-light); background: #ffffff;">
                    <h3 style="font-size: 1.15rem; margin: 0;">Your Published Postings</h3>
                    <a href="#/postings/new" class="btn btn-sm btn-secondary">+ New Posting</a>
                </div>

                ${myPostings.length > 0 ? `
                <div style="overflow-x: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>Opportunity Title</th>
                                <th>Type</th>
                                <th>Created On</th>
                                <th style="text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${myPostings.map(p => `
                            <tr>
                                <td><strong style="color: var(--text-main); font-size: 0.95rem;">${p.title}</strong></td>
                                <td><span class="tag ${p.type === 'job' ? 'tag-primary' : 'tag-success'}">${p.type}</span></td>
                                <td><span style="color: var(--text-muted);">${p.created_at || 'Recently'}</span></td>
                                <td style="text-align: right;">
                                    <a href="#/postings?search=${encodeURIComponent(p.title)}" class="btn btn-sm btn-secondary">View Live →</a>
                                </td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : `
                <div class="empty-state" style="margin: 0; border: none; border-radius: 0;">
                    <div class="empty-state-icon">💼</div>
                    <h3>No postings yet</h3>
                    <p>Help current students jumpstart their careers by sharing openings at your company or team.</p>
                    <a href="#/postings/new" class="btn btn-primary">Publish Your First Opportunity</a>
                </div>
                `}
            </div>
            `;

        } else if (role === 'faculty') {
            const myResources = data.my_resources || [];

            container.innerHTML = `
            <div class="page-header">
                <div class="page-header-title">
                    <h1>Faculty Portal — ${user.name}</h1>
                    <p>Distribute study guides, upload video lectures/tutorials, and broadcast announcements.</p>
                </div>
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                    <a href="#/resources/new" class="btn btn-primary">
                        <span>📚 Share New Resource</span>
                    </a>
                    <a href="#/announcements" class="btn btn-secondary">
                        <span>📢 Post Announcement</span>
                    </a>
                </div>
            </div>

            <!-- Overview -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
                <div class="card" style="margin-bottom: 0; display: flex; align-items: center; gap: 1.25rem;">
                    <div style="width: 50px; height: 50px; border-radius: var(--radius-md); background: #eef2ff; color: #4f46e5; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                        📚
                    </div>
                    <div>
                        <div style="font-size: 1.35rem; font-weight: 800;">${myResources.length}</div>
                        <div style="color: var(--text-muted); font-size: 0.85rem; font-weight: 600;">Uploaded Resources</div>
                    </div>
                </div>

                <div class="card" style="margin-bottom: 0; display: flex; align-items: center; gap: 1.25rem;">
                    <div style="width: 50px; height: 50px; border-radius: var(--radius-md); background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                        💬
                    </div>
                    <div>
                        <div style="font-size: 1.1rem; font-weight: 700;">Student Communication</div>
                        <a href="#/messages" style="font-size: 0.85rem; font-weight: 600;">Open Direct Messages →</a>
                    </div>
                </div>
            </div>

            <!-- Shared Resources List -->
            <div class="card" style="padding: 0; overflow: hidden;">
                <div style="padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-light); background: #ffffff;">
                    <h3 style="font-size: 1.15rem; margin: 0;">Your Shared Resources</h3>
                    <a href="#/resources/new" class="btn btn-sm btn-primary">+ Add New</a>
                </div>

                ${myResources.length > 0 ? `
                <div style="padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
                    ${myResources.map(r => `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border: 1px solid var(--border-light); border-radius: var(--radius-md); background: #f8fafc;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="font-size: 1.5rem;">
                                ${r.link && (r.link.includes('youtube.com') || r.link.includes('youtu.be')) ? '🎥' : r.file_path ? '📄' : '🔗'}
                            </div>
                            <div>
                                <strong style="color: var(--text-main); font-size: 1rem; display: block;">${r.title}</strong>
                                ${r.link ? `<a href="${r.link}" target="_blank" style="font-size: 0.85rem; word-break: break-all;">${r.link}</a>` : ''}
                            </div>
                        </div>
                        <div>
                            <a href="#/resources?search=${encodeURIComponent(r.title)}" class="btn btn-sm btn-secondary">View in Library →</a>
                        </div>
                    </div>
                    `).join('')}
                </div>
                ` : `
                <div class="empty-state" style="margin: 0; border: none; border-radius: 0;">
                    <div class="empty-state-icon">📚</div>
                    <h3>No resources uploaded yet</h3>
                    <p>Share preparation material, YouTube tutorials, lecture links, or documents with students.</p>
                    <a href="#/resources/new" class="btn btn-primary">Add Your First Resource</a>
                </div>
                `}
            </div>
            `;

        } else { // student
            const postings = data.latest_postings || [];

            container.innerHTML = `
            <div class="page-header">
                <div class="page-header-title">
                    <h1>Welcome, ${user.name} 👋</h1>
                    <p>Explore verified alumni mentors, apply for jobs/internships, and accelerate your career.</p>
                </div>
                <div>
                    <a href="#/alumni/search" class="btn btn-primary">
                        <span>🔍 Find Alumni Mentors</span>
                    </a>
                </div>
            </div>

            <!-- Shortcuts -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
                <div class="card" style="margin-bottom: 0; padding: 1.25rem; display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 46px; height: 46px; border-radius: var(--radius-md); background: #eef2ff; color: #4f46e5; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
                        💼
                    </div>
                    <div>
                        <div style="font-weight: 700; font-size: 0.95rem;">Career Postings</div>
                        <a href="#/postings" style="font-size: 0.82rem; font-weight: 600;">Browse All Postings →</a>
                    </div>
                </div>

                <div class="card" style="margin-bottom: 0; padding: 1.25rem; display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 46px; height: 46px; border-radius: var(--radius-md); background: #fdf2f8; color: #db2777; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
                        🤖
                    </div>
                    <div>
                        <div style="font-weight: 700; font-size: 0.95rem;">AI Assistant</div>
                        <a href="#/chatbot" style="font-size: 0.82rem; font-weight: 600;">Ask Career Questions →</a>
                    </div>
                </div>

                <div class="card" style="margin-bottom: 0; padding: 1.25rem; display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 46px; height: 46px; border-radius: var(--radius-md); background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
                        📚
                    </div>
                    <div>
                        <div style="font-weight: 700; font-size: 0.95rem;">Study Materials</div>
                        <a href="#/resources" style="font-size: 0.82rem; font-weight: 600;">Access Resources →</a>
                    </div>
                </div>
            </div>

            <!-- Opportunities Table -->
            <div class="card" style="padding: 0; overflow: hidden;">
                <div style="padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-light); background: #ffffff;">
                    <div>
                        <h3 style="font-size: 1.15rem; margin: 0;">Featured Career Opportunities</h3>
                        <p style="font-size: 0.85rem; margin: 0; color: var(--text-muted);">Latest internships and full-time jobs posted by verified alumni</p>
                    </div>
                    <a href="#/postings" class="btn btn-sm btn-secondary">See All Postings →</a>
                </div>

                ${postings.length > 0 ? `
                <div style="overflow-x: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>Position Title</th>
                                <th>Type</th>
                                <th>Posted By</th>
                                <th>Company</th>
                                <th style="text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${postings.map(p => `
                            <tr>
                                <td><strong style="color: var(--text-main); font-size: 0.95rem;">${p.title}</strong></td>
                                <td><span class="tag ${p.type === 'job' ? 'tag-primary' : 'tag-success'}">${p.type}</span></td>
                                <td><span style="font-weight: 600; color: var(--text-main);">${p.alumni_name}</span></td>
                                <td><span class="tag tag-neutral">${p.company || 'Enterprise'}</span></td>
                                <td style="text-align: right;">
                                    <a href="#/postings?search=${encodeURIComponent(p.title)}" class="btn btn-sm btn-primary">Details →</a>
                                </td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : `
                <div class="empty-state" style="margin: 0; border: none; border-radius: 0;">
                    <div class="empty-state-icon">💼</div>
                    <h3>No postings available right now</h3>
                    <p>Check back soon or explore the alumni directory to connect with alumni directly.</p>
                    <a href="#/alumni/search" class="btn btn-primary">Search Alumni Directory</a>
                </div>
                `}
            </div>
            `;
        }

    } catch (err) {
        container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <h3>Unable to load dashboard</h3>
            <p>${err.message || 'Please make sure the backend is running.'}</p>
            <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>
        </div>
        `;
    }
}
