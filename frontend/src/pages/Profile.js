/**
 * Profile Page Component
 */
import { api } from '../api.js';
import { state, checkAuth, showToast } from '../state.js';

export function renderProfile() {
    return `
    <div id="profilePageContainer">
        <p style="text-align: center; padding: 2rem;">Loading profile...</p>
    </div>
    `;
}

export async function initProfile() {
    const container = document.getElementById('profilePageContainer');
    if (!container) return;

    try {
        const data = await api.get('/api/profile');
        const user = data.user;

        container.innerHTML = `
        <div class="page-header">
            <div class="page-header-title">
                <h1>Your Profile & Account</h1>
                <p>Manage your public persona, verify your details, and update your profile picture.</p>
            </div>
        </div>

        <div class="profile-container">
            <div class="profile-card">
                <!-- Banner -->
                <div class="profile-banner"></div>

                <!-- Content -->
                <div class="profile-content">
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem;">
                        <div class="profile-avatar-wrapper">
                            ${user.profile_pic ? `
                            <img src="/static/${user.profile_pic}" alt="${user.name}" class="profile-avatar-img">
                            ` : `
                            <div class="profile-avatar-placeholder">
                                ${(user.name || 'U')[0].toUpperCase()}
                            </div>
                            `}
                        </div>

                        <div style="margin-bottom: 1.25rem;">
                            <form id="profilePicForm" enctype="multipart/form-data" style="background: transparent; border: none; box-shadow: none; padding: 0; display: flex; gap: 0.5rem; align-items: center;">
                                <input type="file" id="pictureInput" name="picture" accept="image/*" required style="font-size: 0.8rem; padding: 0.35rem 0.65rem;">
                                <button type="submit" class="btn btn-sm btn-primary" id="uploadPicBtn" style="margin: 0;">Upload</button>
                            </form>
                        </div>
                    </div>

                    <div style="margin-top: 0.5rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                            <h2 style="font-size: 1.75rem; color: var(--text-main); margin: 0;">${user.name}</h2>
                            ${user.role === 'alumni' && user.status === 'active' ? `
                            <span title="Verified Alumni" style="color: var(--success); font-size: 1.25rem; font-weight: bold;">✓ Verified</span>
                            ` : ''}
                        </div>

                        <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem;">${user.email}</p>

                        <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
                            <span class="tag ${user.role === 'alumni' ? 'tag-primary' : user.role === 'faculty' ? 'tag-warning' : 'tag-neutral'}" style="font-size: 0.85rem; padding: 0.35rem 0.9rem;">
                                ${user.role}
                            </span>
                            ${user.role === 'alumni' ? `
                            <span class="tag ${user.status === 'active' ? 'tag-success' : 'tag-warning'}" style="font-size: 0.85rem; padding: 0.35rem 0.9rem;">
                                Status: ${user.status}
                            </span>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Details Grid -->
                    <div class="profile-details-grid">
                        ${user.username ? `
                        <div class="profile-detail-item">
                            <div class="profile-detail-icon">👤</div>
                            <div>
                                <div class="profile-detail-label">Username</div>
                                <div class="profile-detail-val">@${user.username}</div>
                            </div>
                        </div>
                        ` : ''}

                        ${user.uucms_id ? `
                        <div class="profile-detail-item">
                            <div class="profile-detail-icon">🆔</div>
                            <div>
                                <div class="profile-detail-label">UUCMS ID</div>
                                <div class="profile-detail-val">${user.uucms_id}</div>
                            </div>
                        </div>
                        ` : ''}

                        ${user.last_year_uucms_id ? `
                        <div class="profile-detail-item">
                            <div class="profile-detail-icon">⏮️</div>
                            <div>
                                <div class="profile-detail-label">Previous UUCMS ID</div>
                                <div class="profile-detail-val">${user.last_year_uucms_id}</div>
                            </div>
                        </div>
                        ` : ''}

                        ${user.faculty_id ? `
                        <div class="profile-detail-item">
                            <div class="profile-detail-icon">🆔</div>
                            <div>
                                <div class="profile-detail-label">Faculty ID</div>
                                <div class="profile-detail-val">${user.faculty_id}</div>
                            </div>
                        </div>
                        ` : ''}

                        ${user.cgpa ? `
                        <div class="profile-detail-item">
                            <div class="profile-detail-icon">⭐</div>
                            <div>
                                <div class="profile-detail-label">Final CGPA</div>
                                <div class="profile-detail-val">${user.cgpa} / 10.0</div>
                            </div>
                        </div>
                        ` : ''}

                        ${user.certificate_file ? `
                        <div class="profile-detail-item">
                            <div class="profile-detail-icon">📜</div>
                            <div>
                                <div class="profile-detail-label">Graduation Certificate</div>
                                <div class="profile-detail-val">
                                    <a href="/static/${user.certificate_file}" target="_blank" style="color: var(--primary); text-decoration: underline;">
                                        View Certificate ↗
                                    </a>
                                </div>
                            </div>
                        </div>
                        ` : ''}

                        <div class="profile-detail-item">
                            <div class="profile-detail-icon">🎓</div>
                            <div>
                                <div class="profile-detail-label">Academic Branch / Dept</div>
                                <div class="profile-detail-val">${user.department || user.branch || 'Not Specified'}</div>
                            </div>
                        </div>

                        <div class="profile-detail-item">
                            <div class="profile-detail-icon">📅</div>
                            <div>
                                <div class="profile-detail-label">Graduation Year</div>
                                <div class="profile-detail-val">${user.grad_year || 'Current Student / Faculty'}</div>
                            </div>
                        </div>

                        <div class="profile-detail-item">
                            <div class="profile-detail-icon">🏢</div>
                            <div>
                                <div class="profile-detail-label">Company / Workplace</div>
                                <div class="profile-detail-val">${user.company || 'Academic Institution'}</div>
                            </div>
                        </div>

                        <div class="profile-detail-item">
                            <div class="profile-detail-icon">📍</div>
                            <div>
                                <div class="profile-detail-label">Current Location</div>
                                <div class="profile-detail-val">${user.location || 'Campus'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;

        const form = document.getElementById('profilePicForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const fileInput = document.getElementById('pictureInput');
                if (!fileInput.files[0]) return;

                const submitBtn = document.getElementById('uploadPicBtn');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Uploading...';

                const formData = new FormData();
                formData.append('picture', fileInput.files[0]);

                try {
                    const res = await api.postForm('/api/profile/picture', formData);
                    showToast(res.message || 'Profile picture updated!', 'success');
                    await checkAuth();
                    initProfile();
                } catch (err) {
                    showToast(err.message || 'Failed to upload photo.', 'error');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Upload';
                }
            });
        }

    } catch (err) {
        container.innerHTML = `<p style="color: var(--danger);">Failed to load profile: ${err.message}</p>`;
    }
}
