/**
 * Register Page Component
 * Role-Based Registration for Student, Alumni, and Faculty
 */
import { api } from '../api.js';
import { showToast } from '../state.js';

export function renderRegister() {
    return `
    <div class="auth-wrapper">
        <div class="login-box" style="max-width: 580px;">
            <div class="login-header">
                <div class="login-icon">✨</div>
                <h1>Create Account</h1>
                <p class="welcome">Join our campus network of verified students, alumni, and faculty</p>
            </div>

            <form id="registerForm" enctype="multipart/form-data">
                <!-- Role Selection -->
                <div class="form-group">
                    <label for="roleSelect">I am registering as <span style="color: var(--danger, #ef4444);">*</span></label>
                    <div class="input-box">
                        <select name="role" id="roleSelect" required>
                            <option value="student">🎓 Student</option>
                            <option value="alumni">💼 Alumni (Requires Admin Verification)</option>
                            <option value="faculty">👨‍🏫 Faculty / Staff</option>
                        </select>
                    </div>
                </div>

                <!-- Shared: Full Name -->
                <div class="form-group">
                    <label for="name">Full Name <span style="color: var(--danger, #ef4444);">*</span></label>
                    <div class="input-box">
                        <input type="text" id="name" name="name" placeholder="John Doe" required autocomplete="name">
                    </div>
                </div>

                <!-- Shared: Email Address -->
                <div class="form-group">
                    <label for="email">Email Address <span style="color: var(--danger, #ef4444);">*</span></label>
                    <div class="input-box">
                        <input type="email" id="email" name="email" placeholder="name@college.edu" required autocomplete="email">
                    </div>
                </div>

                <div class="form-group">
                    <label for="emailOtp">Email verification code</label>
                    <div class="input-box" style="display:flex;gap:8px;">
                        <input type="text" id="emailOtp" inputmode="numeric" maxlength="6" placeholder="6-digit code" autocomplete="one-time-code">
                        <button type="button" id="sendEmailOtpBtn">Send code</button>
                        <button type="button" id="verifyEmailOtpBtn">Verify</button>
                    </div>
                    <small id="emailOtpStatus">Verify your email before creating your account.</small>
                </div>

                <!-- Student & Alumni: Username -->
                <div class="form-group" id="username-group">
                    <label for="username">Username <span style="color: var(--danger, #ef4444);">*</span></label>
                    <div class="input-box">
                        <input type="text" id="username" name="username" placeholder="e.g. john_doe" autocomplete="username">
                    </div>
                </div>

                <!-- Student & Alumni: UUCMS ID -->
                <div class="form-group" id="uucms-group">
                    <label for="uucms_id">UUCMS ID <span style="color: var(--danger, #ef4444);">*</span></label>
                    <div class="input-box">
                        <input type="text" id="uucms_id" name="uucms_id" placeholder="e.g. U03AC21S0012">
                    </div>
                </div>

                <!-- Alumni: Last Year UUCMS ID -->
                <div class="form-group" id="last-year-uucms-group" style="display: none;">
                    <label for="last_year_uucms_id">Last Year UUCMS ID <span style="color: var(--danger, #ef4444);">*</span></label>
                    <div class="input-box">
                        <input type="text" id="last_year_uucms_id" name="last_year_uucms_id" placeholder="e.g. U03AC20S0012">
                    </div>
                </div>

                <!-- Faculty: Faculty ID -->
                <div class="form-group" id="faculty-id-group" style="display: none;">
                    <label for="faculty_id">Faculty ID <span style="color: var(--danger, #ef4444);">*</span></label>
                    <div class="input-box">
                        <input type="text" id="faculty_id" name="faculty_id" placeholder="e.g. FAC1042">
                    </div>
                </div>

                <!-- Shared Password -->
                <div class="form-group">
                    <label for="password">Password <span style="color: var(--danger, #ef4444);">*</span></label>
                    <div class="input-box">
                        <input type="password" name="password" id="password" placeholder="Create a strong password" required autocomplete="new-password">
                        <span class="eye" id="togglePasswordBtn" title="Toggle password visibility">👁️</span>
                    </div>
                </div>

                <!-- Student & Alumni: Branch -->
                <div class="form-group" id="branch-group">
                    <label for="branch">Branch / Department <span style="color: var(--danger, #ef4444);">*</span> <span class="hint">(e.g. Computer Science, Electronics)</span></label>
                    <div class="input-box">
                        <input type="text" id="branch" name="branch" placeholder="e.g. Computer Science & Engineering">
                    </div>
                </div>

                <!-- Faculty: Department -->
                <div class="form-group" id="department-group" style="display: none;">
                    <label for="department">Department <span style="color: var(--danger, #ef4444);">*</span></label>
                    <div class="input-box">
                        <input type="text" id="department" name="department" placeholder="e.g. Computer Science & Engineering">
                    </div>
                </div>

                <!-- Alumni-Specific Fields: CGPA & Certificate & Career Details -->
                <div id="alumni-fields" style="display: none; animation: fadeIn 0.3s ease-out; background: var(--bg-main, #f8fafc); padding: 1.25rem; border-radius: var(--radius-md, 12px); margin-bottom: 1.25rem; border: 1px dashed var(--border-light, #cbd5e1);">
                    <div style="font-size: 0.9rem; font-weight: 700; color: var(--primary, #3b82f6); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        <span>🎓</span> Alumni Verification & Professional Details
                    </div>

                    <!-- CGPA -->
                    <div class="form-group">
                        <label for="cgpa">Final CGPA (0.0 to 10.0) <span style="color: var(--danger, #ef4444);">*</span></label>
                        <div class="input-box">
                            <input type="number" id="cgpa" name="cgpa" step="0.01" min="0" max="10" placeholder="e.g. 8.75">
                        </div>
                    </div>

                    <!-- Certificate Upload -->
                    <div class="form-group">
                        <label for="certificate">Degree / Graduation Certificate Upload <span style="color: var(--danger, #ef4444);">*</span> <span class="hint">(PDF, PNG, JPG - Max 10MB)</span></label>
                        <div class="input-box">
                            <input type="file" id="certificate" name="certificate" accept=".pdf,.png,.jpg,.jpeg" style="padding: 0.5rem;">
                        </div>
                    </div>

                    <!-- Grad Year -->
                    <div class="form-group">
                        <label for="grad_year">Graduation Year</label>
                        <div class="input-box">
                            <input type="number" id="grad_year" name="grad_year" placeholder="e.g. 2022" min="1950" max="2035">
                        </div>
                    </div>

                    <!-- Company -->
                    <div class="form-group">
                        <label for="company">Current Company / Organization</label>
                        <div class="input-box">
                            <input type="text" id="company" name="company" placeholder="e.g. Google, Microsoft, Infosys">
                        </div>
                    </div>

                    <!-- Location -->
                    <div class="form-group" style="margin-bottom: 0;">
                        <label for="location">Current Location / City</label>
                        <div class="input-box">
                            <input type="text" id="location" name="location" placeholder="e.g. Bangalore, San Francisco, London">
                        </div>
                    </div>
                </div>

                <button type="submit" class="login-btn" id="registerSubmitBtn">
                    <span id="registerSubmitText">Create Student Account</span> →
                </button>
            </form>

            <p class="register">
                Already have an account?
                <a href="#/login">Sign In</a>
            </p>
        </div>
    </div>
    `;
}

export function initRegister() {
    const form = document.getElementById('registerForm');
    const roleSelect = document.getElementById('roleSelect');
    const usernameGroup = document.getElementById('username-group');
    const uucmsGroup = document.getElementById('uucms-group');
    const lastYearUucmsGroup = document.getElementById('last-year-uucms-group');
    const facultyIdGroup = document.getElementById('faculty-id-group');
    const branchGroup = document.getElementById('branch-group');
    const departmentGroup = document.getElementById('department-group');
    const alumniFields = document.getElementById('alumni-fields');
    const toggleBtn = document.getElementById('togglePasswordBtn');
    const passwordInput = document.getElementById('password');
    const submitText = document.getElementById('registerSubmitText');

    function updateRoleView(role) {
        if (role === 'student') {
            usernameGroup.style.display = 'block';
            uucmsGroup.style.display = 'block';
            lastYearUucmsGroup.style.display = 'none';
            facultyIdGroup.style.display = 'none';
            branchGroup.style.display = 'block';
            departmentGroup.style.display = 'none';
            alumniFields.style.display = 'none';

            submitText.textContent = 'Create Student Account';
        } else if (role === 'alumni') {
            usernameGroup.style.display = 'block';
            uucmsGroup.style.display = 'block';
            lastYearUucmsGroup.style.display = 'block';
            facultyIdGroup.style.display = 'none';
            branchGroup.style.display = 'block';
            departmentGroup.style.display = 'none';
            alumniFields.style.display = 'block';

            submitText.textContent = 'Submit Alumni Application';
        } else if (role === 'faculty') {
            usernameGroup.style.display = 'none';
            uucmsGroup.style.display = 'none';
            lastYearUucmsGroup.style.display = 'none';
            facultyIdGroup.style.display = 'block';
            branchGroup.style.display = 'none';
            departmentGroup.style.display = 'block';
            alumniFields.style.display = 'none';

            submitText.textContent = 'Create Faculty Account';
        }
    }

    if (roleSelect) {
        roleSelect.addEventListener('change', () => {
            updateRoleView(roleSelect.value);
        });
        updateRoleView(roleSelect.value);
    }

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

    let verifiedEmail = '';
    const emailInput = document.getElementById('email');
    const otpInput = document.getElementById('emailOtp');
    const otpStatus = document.getElementById('emailOtpStatus');
    const sendOtpBtn = document.getElementById('sendEmailOtpBtn');
    const verifyOtpBtn = document.getElementById('verifyEmailOtpBtn');
    if (emailInput) emailInput.addEventListener('input', () => { if (emailInput.value.trim().toLowerCase() !== verifiedEmail) { verifiedEmail = ''; otpStatus.textContent = 'Verify your email before creating your account.'; } });
    if (sendOtpBtn) sendOtpBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim().toLowerCase();
        if (!email) { showToast('Enter your email first.', 'error'); return; }
        sendOtpBtn.disabled = true;
        try { const result = await api.post('/api/auth/send-otp', { email }); otpStatus.textContent = result.message; showToast(result.message, 'success'); }
        catch (err) { showToast(err.message || 'Could not send code.', 'error'); }
        finally { sendOtpBtn.disabled = false; }
    });
    if (verifyOtpBtn) verifyOtpBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim().toLowerCase();
        try { const result = await api.post('/api/auth/verify-otp', { email, code: otpInput.value.trim() }); verifiedEmail = email; otpStatus.textContent = 'Email verified ✓'; showToast(result.message, 'success'); }
        catch (err) { verifiedEmail = ''; showToast(err.message || 'Verification failed.', 'error'); }
    });

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('registerSubmitBtn');
            const originalText = submitText.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Processing registration...</span>';

            const role = roleSelect.value;
            const name = form.name.value.trim();
            const email = form.email.value.trim();
            const password = form.password.value;
            if (verifiedEmail !== email.toLowerCase()) {
                showToast('Please verify this email address with the OTP first.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<span>${originalText}</span> →`;
                return;
            }

            // Shared validation
            if (!name) {
                showToast('Full Name is required.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<span>${originalText}</span> →`;
                return;
            }
            if (!email) {
                showToast('Email Address is required.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<span>${originalText}</span> →`;
                return;
            }
            const emailRegex = /^[\w\.-]+@[\w\.-]+\.\w+$/;
            if (!emailRegex.test(email)) {
                showToast('Please enter a valid email address format.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<span>${originalText}</span> →`;
                return;
            }
            if (!password) {
                showToast('Password is required.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<span>${originalText}</span> →`;
                return;
            }

            const formData = new FormData();
            formData.append('role', role);
            formData.append('name', name);
            formData.append('email', email);
            formData.append('password', password);

            if (role === 'student') {
                const username = form.username.value.trim();
                const uucms_id = form.uucms_id.value.trim();
                const branch = form.branch.value.trim();

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
                if (!branch) {
                    showToast('Branch / Department is required.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<span>${originalText}</span> →`;
                    return;
                }

                formData.append('username', username);
                formData.append('uucms_id', uucms_id);
                formData.append('branch', branch);

            } else if (role === 'alumni') {
                const username = form.username.value.trim();
                const uucms_id = form.uucms_id.value.trim();
                const last_year_uucms_id = form.last_year_uucms_id.value.trim();
                const branch = form.branch.value.trim();
                const cgpaStr = form.cgpa.value.trim();
                const certFile = form.certificate.files[0];

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
                if (!last_year_uucms_id) {
                    showToast('Last Year UUCMS ID is required.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<span>${originalText}</span> →`;
                    return;
                }
                if (!branch) {
                    showToast('Branch / Department is required.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<span>${originalText}</span> →`;
                    return;
                }
                if (!cgpaStr) {
                    showToast('CGPA is required.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<span>${originalText}</span> →`;
                    return;
                }
                const cgpaNum = parseFloat(cgpaStr);
                if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
                    showToast('Invalid CGPA. CGPA must be a number between 0 and 10.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<span>${originalText}</span> →`;
                    return;
                }
                if (!certFile) {
                    showToast('Certificate is required. Please upload your graduation certificate.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<span>${originalText}</span> →`;
                    return;
                }
                const allowedExts = ['pdf', 'png', 'jpg', 'jpeg'];
                const fileExt = certFile.name.split('.').pop().toLowerCase();
                if (!allowedExts.includes(fileExt)) {
                    showToast('Invalid certificate file type. Allowed formats: PDF, PNG, JPG, JPEG.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<span>${originalText}</span> →`;
                    return;
                }
                if (certFile.size > 10 * 1024 * 1024) {
                    showToast('Certificate file size exceeds 10MB limit.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<span>${originalText}</span> →`;
                    return;
                }

                formData.append('username', username);
                formData.append('uucms_id', uucms_id);
                formData.append('last_year_uucms_id', last_year_uucms_id);
                formData.append('branch', branch);
                formData.append('cgpa', cgpaStr);
                formData.append('certificate', certFile);
                if (form.grad_year && form.grad_year.value) formData.append('grad_year', form.grad_year.value);
                if (form.company && form.company.value) formData.append('company', form.company.value.trim());
                if (form.location && form.location.value) formData.append('location', form.location.value.trim());

            } else if (role === 'faculty') {
                const faculty_id = form.faculty_id.value.trim();
                const department = form.department.value.trim();

                if (!faculty_id) {
                    showToast('Faculty ID is required.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<span>${originalText}</span> →`;
                    return;
                }
                if (!department) {
                    showToast('Department is required.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<span>${originalText}</span> →`;
                    return;
                }

                formData.append('faculty_id', faculty_id);
                formData.append('department', department);
                formData.append('branch', department);
            }

            try {
                const res = await api.postForm('/api/auth/register', formData);
                showToast(res.message, 'success');
                window.location.hash = '#/login';
            } catch (err) {
                showToast(err.message || 'Registration failed.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<span>${originalText}</span> →`;
            }
        });
    }
}
