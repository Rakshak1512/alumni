/**
 * New Resource Upload Component
 */
import { api } from '../api.js';
import { showToast } from '../state.js';

export function renderNewResource() {
    return `
    <div class="page-header">
        <div class="page-header-title">
            <h1>Share a Learning Resource</h1>
            <p>Upload helpful documents, reference books, preparation links, or YouTube video tutorials.</p>
        </div>
        <div>
            <a href="#/resources" class="btn btn-secondary">← Back to Resources</a>
        </div>
    </div>

    <div style="max-width: 700px; margin: 0 auto;">
        <form id="newResourceForm" class="card" enctype="multipart/form-data">
            <div class="form-group">
                <label for="resTitle">Resource Title <span style="color: var(--danger);">*</span></label>
                <input type="text" id="resTitle" name="title" placeholder="e.g. Complete System Design Guide / DSA Roadmap" required>
            </div>

            <div class="form-group">
                <label for="resLink">External Link <span class="hint">(YouTube video URL, Github repository, or article)</span></label>
                <input type="url" id="resLink" name="link" placeholder="https://youtube.com/watch?v=... or https://github.com/...">
            </div>

            <div class="form-group">
                <label for="resFile">Or Upload a File Attachment <span class="hint">(PDF, DOC, ZIP, or Slides)</span></label>
                <input type="file" id="resFile" name="file">
            </div>

            <div class="form-group">
                <label for="resDesc">Summary / Overview</label>
                <textarea id="resDesc" name="description" rows="4" placeholder="Briefly describe what students will learn from this resource..."></textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--border-light);">
                <a href="#/resources" class="btn btn-secondary">Cancel</a>
                <button type="submit" class="btn btn-primary" id="publishResourceBtn">
                    <span>Publish Resource</span> →
                </button>
            </div>
        </form>
    </div>
    `;
}

export function initNewResource() {
    const form = document.getElementById('newResourceForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('publishResourceBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Publishing...';

        const formData = new FormData();
        formData.append('title', form.title.value);
        if (form.link.value) formData.append('link', form.link.value);
        if (form.description.value) formData.append('description', form.description.value);
        if (form.file.files[0]) formData.append('file', form.file.files[0]);

        try {
            const res = await api.postForm('/api/resources/new', formData);
            showToast(res.message || 'Resource published successfully!', 'success');
            window.location.hash = '#/resources';
        } catch (err) {
            showToast(err.message || 'Failed to add resource.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Publish Resource</span> →';
        }
    });
}
