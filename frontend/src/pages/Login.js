/**
 * Login Page Component
 * Role-Based Login for Student, Alumni, Faculty, and Admin
 */
import { api } from '../api.js';
import { checkAuth, showToast } from '../state.js';

export function renderLogin() {
    return `
    <div class="auth-wrapper">
        <div class="login-box" style="max-width: 480px;">
            <div class="login-header">
                <div class="login-icon" id="loginHeaderIcon">🎓</div>
                <h1 id="loginHeaderTitle">Welcome Back</h1>
                <p class="welcome" id="loginHeaderSubtitle">Sign in to access your student portal</p>
            </div>

            <!-- Role Selector Tabs -->
            <div class="role-tabs-container" style="display: flex; gap: 0.35rem; margin-bottom: 1.5rem; background: var(--bg-main, #f1f5f9); padding: 0.35rem; border-radius: var(--radius-md, 12px); border: 1px solid var(--border-light, #e2e8f0);">
                <button type="button" class="role-tab active" data-role="student" style="flex: 1; padding: 0.55rem 0.4rem; font-size: 0.85rem; font-weight: 600; border: none; border-radius: var(--radius-sm, 8px); cursor: pointer; transition: all 0.2s ease; background: var(--primary, #3b82f6); color: white;">
                    🎓 Student
                </button>
                <button type="button" class="role-tab" data-role="alumni" style="flex: 1; padding: 0.55rem 0.4rem; font-size: 0.85rem; font-weight: 600; border: none; border-radius: var(--radius-sm, 8px); cursor: pointer; transition: all 0.2s ease; background: transparent; color: var(--text-muted, #64748b);">
                    💼 Alumni
                </button>
                <button type="button" class="role-tab" data-role="faculty" style="flex: 1; padding: 0.55rem 0.4rem; font-size: 0.85rem; font-weight: 600; border: none; border-radius: var(--radius-sm, 8px); cursor: pointer; transition: all 0.2s ease; background: transparent; color: var(--text-muted, #64748b);">
                    👨‍🏫 Faculty
                </button>
                <button type="button" class="role-tab" data-role="admin" style="flex: 1; padding: 0.55rem 0.4rem; font-size: 0.85rem; font-weight: 600; border: none; border-radius: var(--radius-sm, 8px); cursor: pointer; transition: all 0.2s ease; background: transparent; color: var(--text-muted, #64748b);">
                    🛡️ Admin
                </button>
            </div>

            <form id="loginForm">
                <input type="hidden" id="selectedRole" name="role" value="student">

                <!-- Student / Alumni Fields -->
                <div id="username-group" class="form-group">
                    <label for="username">Username <span style="color: var(--danger, #ef4444);">*</span></label>
                    <div class="input-box">
                        <input type="text" id="username" name="username" placeholder="Enter your username" required autocomplete="username">
                    </div>
                </div>

                <div id="uucms-group" class="form-group">
                    <label for="uucms_id">UUCMS ID <span style="color: var(--danger, #ef4444);">*</span></label>
                    <div class="input-box">
                        <input type="text" id="uucms_id" name="uucms_id" placeholder="e.g. U03AC21S0012" required>
                    </div>
                </div>

                <!-- Faculty Fields -->
                <div id="faculty-id-group" class="form-group" style="display: none;">
                    <label for="faculty_id">Faculty ID <span style="color: var(--danger, #ef4444);">*</span></label>
                    <div class="input-box">
                        <input type="text" id="faculty_id" name="faculty_id" placeholder="e.g. FAC1042">
                    </div>
                </div>

                <div id="name-group" class="form-group" style="display: none;">
                    <label for="name">Full Name <span style="color: var(--danger, #ef4444);">*</span></label>
                    <div class="input-box">
                        <input type="text" id="name" name="name" placeholder="Enter your full name">
                    </div>
                </div>

                <!-- Admin Username or Email Field -->
                <div id="email-group" class="form-group" style="display: none;">
                    <label for="email">Admin Username or Email <span style="color: var(--danger, #ef4444);">*</span></label>
                    <div class="input-box">
                        <input type="text" id="email" name="email" placeholder="testadmin or admin@college.edu" autocomplete="username">
                    </div>
                </div>

                <!-- Shared Password Field -->
                <div class="form-group">
                    <label for="password">Password <span style="color: var(--danger, #ef4444);">*</span></label>
                    <div class="input-box">
                        <input type="password" name="password" id="password" placeholder="Enter your password" required autocomplete="current-password">
                        <span class="eye" id="togglePasswordBtn" title="Toggle password visibility">👁️</span>
                    </div>
                </div>

                <button type="submit" class="login-btn" id="loginSubmitBtn">
                    <span id="loginSubmitText">Sign In as Student</span> →
                </button>
            </form>

            <p class="register" id="registerPrompt">
                Don't have an account?
                <a href="#/register">Create an Account</a>
            </p>

            <!-- Test Users Section (Click to Auto-Fill) -->
            <div class="test-users-section" style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px dashed var(--border-light, #e2e8f0);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                    <span style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted, #64748b);">
                        ⚡ Quick Test Users (Click to Fill)
                    </span>
                    <span class="tag tag-primary" style="font-size: 0.7rem; padding: 0.15rem 0.5rem; background: var(--primary-light, #eff6ff); color: var(--primary, #3b82f6); border-radius: 4px; font-weight: 600;">
                        TEST USER
                    </span>
                </div>

                <div class="test-users-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.6rem;">
                    <!-- Student Test User Card -->
                    <button type="button" class="test-user-card" id="btnTestStudent" title="Click to fill Student credentials" style="text-align: left; padding: 0.65rem 0.75rem; background: var(--bg-main, #f8fafc); border: 1px solid var(--border-light, #e2e8f0); border-radius: var(--radius-sm, 8px); cursor: pointer; transition: all 0.2s ease;">
                        <div style="font-weight: 600; font-size: 0.82rem; color: var(--text-main, #1e293b); display: flex; align-items: center; gap: 0.35rem; margin-bottom: 0.25rem;">
                            <span>🎓</span> <span>Student</span>
                        </div>
                        <div style="font-size: 0.72rem; color: var(--text-muted, #64748b); line-height: 1.35;">
                            <div>User: <b>teststudent</b></div>
                            <div>UUCMS: <b>TESTUUCMS001</b></div>
                            <div>Pass: <b>Student@123</b></div>
                        </div>
                    </button>

                    <!-- Alumni Test User Card -->
                    <button type="button" class="test-user-card" id="btnTestAlumni" title="Click to fill Alumni credentials" style="text-align: left; padding: 0.65rem 0.75rem; background: var(--bg-main, #f8fafc); border: 1px solid var(--border-light, #e2e8f0); border-radius: var(--radius-sm, 8px); cursor: pointer; transition: all 0.2s ease;">
                        <div style="font-weight: 600; font-size: 0.82rem; color: var(--text-main, #1e293b); display: flex; align-items: center; gap: 0.35rem; margin-bottom: 0.25rem;">
                            <span>💼</span> <span>Alumni</span>
                        </div>
                        <div style="font-size: 0.72rem; color: var(--text-muted, #64748b); line-height: 1.35;">
                            <div>User: <b>testalumni</b></div>
                            <div>UUCMS: <b>TESTALUMNI001</b></div>
                            <div>Pass: <b>Alumni@123</b></div>
                        </div>
                    </button>

                    <!-- Faculty Test User Card -->
                    <button type="button" class="test-user-card" id="btnTestFaculty" title="Click to fill Faculty credentials" style="text-align: left; padding: 0.65rem 0.75rem; background: var(--bg-main, #f8fafc); border: 1px solid var(--border-light, #e2e8f0); border-radius: var(--radius-sm, 8px); cursor: pointer; transition: all 0.2s ease;">
                        <div style="font-weight: 600; font-size: 0.82rem; color: var(--text-main, #1e293b); display: flex; align-items: center; gap: 0.35rem; margin-bottom: 0.25rem;">
                            <span>👨‍🏫</span> <span>Faculty</span>
                        </div>
                        <div style="font-size: 0.72rem; color: var(--text-muted, #64748b); line-height: 1.35;">
                            <div>ID: <b>TESTFAC001</b></div>
                            <div>Name: <b>Test Faculty</b></div>
                            <div>Pass: <b>Faculty@123</b></div>
                        </div>
                    </button>

                    <!-- Admin Test User Card -->
                    <button type="button" class="test-user-card" id="btnTestAdmin" title="Click to fill Admin credentials" style="text-align: left; padding: 0.65rem 0.75rem; background: var(--bg-main, #f8fafc); border: 1px solid var(--border-light, #e2e8f0); border-radius: var(--radius-sm, 8px); cursor: pointer; transition: all 0.2s ease;">
                        <div style="font-weight: 600; font-size: 0.82rem; color: var(--text-main, #1e293b); display: flex; align-items: center; gap: 0.35rem; margin-bottom: 0.25rem;">
                            <span>🛡️</span> <span>Admin</span>
                        </div>
                        <div style="font-size: 0.72rem; color: var(--text-muted, #64748b); line-height: 1.35;">
                            <div>User: <b>testadmin</b></div>
                            <div>Pass: <b>Admin@123</b></div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;
}

export function initLogin() {
    const form = document.getElementById('loginForm');
    const toggleBtn = document.getElementById('togglePasswordBtn');
    const passwordInput = document.getElementById('password');
    const roleTabs = document.querySelectorAll('.role-tab');
    const selectedRoleInput = document.getElementById('selectedRole');
    const usernameGroup = document.getElementById('username-group');
    const uucmsGroup = document.getElementById('uucms-group');
    const facultyIdGroup = document.getElementById('faculty-id-group');
    const nameGroup = document.getElementById('name-group');
    const emailGroup = document.getElementById('email-group');
    const submitText = document.getElementById('loginSubmitText');
    const headerIcon = document.getElementById('loginHeaderIcon');
    const headerTitle = document.getElementById('loginHeaderTitle');
    const headerSubtitle = document.getElementById('loginHeaderSubtitle');

    function switchRole(role) {
        if (!selectedRoleInput) return;
        selectedRoleInput.value = role;

        // Update tab styles
        roleTabs.forEach(tab => {
            if (tab.dataset.role === role) {
                tab.style.background = 'var(--primary, #3b82f6)';
                tab.style.color = 'white';
                tab.classList.add('active');
            } else {
                tab.style.background = 'transparent';
                tab.style.color = 'var(--text-muted, #64748b)';
                tab.classList.remove('active');
            }
        });

        // Reset requirements
        const usernameInput = document.getElementById('username');
        const uucmsInput = document.getElementById('uucms_id');
        const facultyInput = document.getElementById('faculty_id');
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');

        if (usernameInput) usernameInput.required = false;
        if (uucmsInput) uucmsInput.required = false;
        if (facultyInput) facultyInput.required = false;
        if (nameInput) nameInput.required = false;
        if (emailInput) emailInput.required = false;

        // Toggle field visibilities and requirements based on role
        if (role === 'student') {
            usernameGroup.style.display = 'block';
            uucmsGroup.style.display = 'block';
            facultyIdGroup.style.display = 'none';
            nameGroup.style.display = 'none';
            emailGroup.style.display = 'none';

            if (usernameInput) usernameInput.required = true;
            if (uucmsInput) uucmsInput.required = true;

            headerIcon.textContent = '🎓';
            headerTitle.textContent = 'Student Sign In';
            headerSubtitle.textContent = 'Sign in with your Username, UUCMS ID, and Password';
            submitText.textContent = 'Sign In as Student';
        } else if (role === 'alumni') {
            usernameGroup.style.display = 'block';
            uucmsGroup.style.display = 'block';
            facultyIdGroup.style.display = 'none';
            nameGroup.style.display = 'none';
            emailGroup.style.display = 'none';

            if (usernameInput) usernameInput.required = true;
            if (uucmsInput) uucmsInput.required = true;

            headerIcon.textContent = '💼';
            headerTitle.textContent = 'Alumni Sign In';
            headerSubtitle.textContent = 'Sign in with your Username, UUCMS ID, and Password';
            submitText.textContent = 'Sign In as Alumni';
        } else if (role === 'faculty') {
            usernameGroup.style.display = 'none';
            uucmsGroup.style.display = 'none';
            facultyIdGroup.style.display = 'block';
            nameGroup.style.display = 'block';
            emailGroup.style.display = 'none';

            if (facultyInput) facultyInput.required = true;
            if (nameInput) nameInput.required = true;

            headerIcon.textContent = '👨‍🏫';
            headerTitle.textContent = 'Faculty Sign In';
            headerSubtitle.textContent = 'Sign in with your Faculty ID, Name, and Password';
            submitText.textContent = 'Sign In as Faculty';
        } else if (role === 'admin') {
            usernameGroup.style.display = 'none';
            uucmsGroup.style.display = 'none';
            facultyIdGroup.style.display = 'none';
            nameGroup.style.display = 'none';
            emailGroup.style.display = 'block';

            if (emailInput) emailInput.required = true;

            headerIcon.textContent = '🛡️';
            headerTitle.textContent = 'Administrator Sign In';
            headerSubtitle.textContent = 'Sign in with your Administrator Username or Email';
            submitText.textContent = 'Sign In as Admin';
        }
    }

    roleTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchRole(tab.dataset.role);
        });
    });

    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', () => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleBtn.textContent = '🙈';
            } else {
                passwordInput.type = 'password';
                toggleBtn.textContent = '👁️';
            }
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('loginSubmitBtn');
            const originalText = submitText.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Verifying credentials...</span>';

            const role = selectedRoleInput.value;
            const password = form.password.value;
            const payload = { role, password };

            if (role === 'student' || role === 'alumni') {
                const username = form.username.value.trim();
                const uucms_id = form.uucms_id.value.trim();
                if (!username) {
                    showToast('Username is required.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<span>${originalText}</span> →`;
                    return;
                }
                if (!uucms_id) {
                    showToast('UUCMS ID is required.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<span>${originalText}</span> →`;
                    return;
                }
                payload.username = username;
                payload.uucms_id = uucms_id;
            } else if (role === 'faculty') {
                const faculty_id = form.faculty_id.value.trim();
                const name = form.name.value.trim();
                if (!faculty_id) {
                    showToast('Faculty ID is required.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<span>${originalText}</span> →`;
                    return;
                }
                if (!name) {
                    showToast('Full Name is required.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<span>${originalText}</span> →`;
                    return;
                }
                payload.faculty_id = faculty_id;
                payload.name = name;
            } else if (role === 'admin') {
                const adminId = form.email.value.trim();
                if (!adminId) {
                    showToast('Admin Username or Email is required.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<span>${originalText}</span> →`;
                    return;
                }
                payload.email = adminId;
                payload.username = adminId;
            }

            try {
                const res = await api.post('/api/auth/login', payload);
                showToast(res.message || 'Signed in successfully!', 'success');
                await checkAuth();
                window.location.hash = '#/dashboard';
            } catch (err) {
                showToast(err.message || 'Login failed. Check your credentials.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<span>${originalText}</span> →`;
            }
        });
    }

    // Test Users Quick Auto-Fill Handlers (Does NOT auto-submit)
    const btnTestStudent = document.getElementById('btnTestStudent');
    const btnTestAlumni = document.getElementById('btnTestAlumni');
    const btnTestFaculty = document.getElementById('btnTestFaculty');
    const btnTestAdmin = document.getElementById('btnTestAdmin');

    if (btnTestStudent) {
        btnTestStudent.addEventListener('click', () => {
            switchRole('student');
            const uInput = document.getElementById('username');
            const uucmsInput = document.getElementById('uucms_id');
            const pInput = document.getElementById('password');
            if (uInput) uInput.value = 'teststudent';
            if (uucmsInput) uucmsInput.value = 'TESTUUCMS001';
            if (pInput) pInput.value = 'Student@123';
            showToast('Student test credentials filled. Click "Sign In as Student" to login.', 'info');
        });
    }

    if (btnTestAlumni) {
        btnTestAlumni.addEventListener('click', () => {
            switchRole('alumni');
            const uInput = document.getElementById('username');
            const uucmsInput = document.getElementById('uucms_id');
            const pInput = document.getElementById('password');
            if (uInput) uInput.value = 'testalumni';
            if (uucmsInput) uucmsInput.value = 'TESTALUMNI001';
            if (pInput) pInput.value = 'Alumni@123';
            showToast('Alumni test credentials filled. Click "Sign In as Alumni" to login.', 'info');
        });
    }

    if (btnTestFaculty) {
        btnTestFaculty.addEventListener('click', () => {
            switchRole('faculty');
            const facInput = document.getElementById('faculty_id');
            const nInput = document.getElementById('name');
            const pInput = document.getElementById('password');
            if (facInput) facInput.value = 'TESTFAC001';
            if (nInput) nInput.value = 'Test Faculty';
            if (pInput) pInput.value = 'Faculty@123';
            showToast('Faculty test credentials filled. Click "Sign In as Faculty" to login.', 'info');
        });
    }

    if (btnTestAdmin) {
        btnTestAdmin.addEventListener('click', () => {
            switchRole('admin');
            const eInput = document.getElementById('email');
            const pInput = document.getElementById('password');
            if (eInput) eInput.value = 'testadmin';
            if (pInput) pInput.value = 'Admin@123';
            showToast('Admin test credentials filled. Click "Sign In as Admin" to login.', 'info');
        });
    }
}
