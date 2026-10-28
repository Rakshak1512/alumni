/**
 * New Posting Form Component
 */
import { api } from '../api.js';
import { showToast } from '../state.js';

export function renderNewPosting() {
    return `
    <div class="page-header">
        <div class="page-header-title">
            <h1>Post a New Career Opportunity</h1>
            <p>Share a job or internship opening with students and fellow alumni in our network.</p>
        </div>
        <div>
            <a href="#/postings" class="btn btn-secondary">← Back to Postings</a>
        </div>
    </div>

    <div style="max-width: 780px; margin: 0 auto;">
        <form id="newPostingForm" class="card">
            <div class="form-group">
                <label for="title">Opportunity Title <span style="color: var(--danger);">*</span></label>
                <input type="text" id="title" name="title" placeholder="e.g. Associate Software Engineer / Frontend Intern" required>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem;">
                <div class="form-group">
                    <label for="type">Opportunity Type <span style="color: var(--danger);">*</span></label>
                    <select id="type" name="type" required>
                        <option value="job">💼 Full-Time Job</option>
                        <option value="internship">🎓 Internship</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="location">Location / Remote Status</label>
                    <input type="text" id="location" name="location" placeholder="e.g. Bangalore / Remote / Hybrid">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem;">
                <div class="form-group">
                    <label for="experience">Experience Level</label>
                    <input type="text" id="experience" name="experience" placeholder="e.g. Freshers / 0-2 Years">
                </div>

                <div class="form-group">
                    <label for="education">Education Requirements</label>
                    <input type="text" id="education" name="education" placeholder="e.g. B.Tech / B.E / Any Graduate">
                </div>
            </div>

            <div class="form-group">
                <label for="skills">Required Skills & Technologies</label>
                <input type="text" id="skills" name="skills" placeholder="e.g. Python, SQL, React, Communication">
            </div>

            <div class="form-group">
                <label for="apply_link">Direct Application URL <span class="hint">(e.g. Company career portal, Google form, or email)</span></label>
                <input type="url" id="apply_link" name="apply_link" placeholder="https://careers.company.com/apply/123">
            </div>

            <div class="form-group">
                <label for="description">Job Description & Responsibilities <span style="color: var(--danger);">*</span></label>
                <textarea id="description" name="description" rows="6" placeholder="Describe the role, day-to-day responsibilities, perks, and application instructions..." required></textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--border-light);">
                <a href="#/dashboard" class="btn btn-secondary">Cancel</a>
                <button type="submit" class="btn btn-primary" id="publishPostingBtn">
                    <span>Publish Opportunity</span> →
                </button>
            </div>
        </form>
    </div>
    `;
}

export function initNewPosting() {
    const form = document.getElementById('newPostingForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('publishPostingBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Publishing...';

        const payload = {
            title: form.title.value,
            type: form.type.value,
            location: form.location.value,
            experience: form.experience.value,
            education: form.education.value,
            skills: form.skills.value,
            apply_link: form.apply_link.value,
            description: form.description.value,
        };

        try {
            const res = await api.post('/api/postings/new', payload);
            showToast(res.message || 'Posting published successfully!', 'success');
            window.location.hash = '#/dashboard';
        } catch (err) {
            showToast(err.message || 'Failed to publish posting.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Publish Opportunity</span> →';
        }
    });
}
