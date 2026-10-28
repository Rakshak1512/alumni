/**
 * Main Client Router & Shell Architecture
 */
import { state, checkAuth, logout, subscribe } from './state.js';
import { renderHome, initHome } from './pages/Home.js';
import { renderLogin, initLogin } from './pages/Login.js';
import { renderRegister, initRegister } from './pages/Register.js';
import { renderDashboard, initDashboard } from './pages/Dashboard.js';
import { renderPostings, initPostings } from './pages/Postings.js';
import { renderNewPosting, initNewPosting } from './pages/NewPosting.js';
import { renderSearchAlumni, initSearchAlumni } from './pages/SearchAlumni.js';
import { renderAlumniByLocation, initAlumniByLocation } from './pages/AlumniByLocation.js';
import { renderResources, initResources } from './pages/Resources.js';
import { renderNewResource, initNewResource } from './pages/NewResource.js';
import { renderAnnouncements, initAnnouncements } from './pages/Announcements.js';
import { renderMessagesList, initMessagesList } from './pages/MessagesList.js';
import { renderChat, initChat } from './pages/Chat.js';
import { renderChatbot, initChatbot } from './pages/Chatbot.js';
import { renderVideoCall, initVideoCall } from './pages/VideoCall.js';
import { renderProfile, initProfile } from './pages/Profile.js';
import { renderAdminUsers, initAdminUsers } from './pages/AdminUsers.js';
import { renderAdminDatabase, initAdminDatabase } from './pages/AdminDatabase.js';

// Initialize Theme
function initTheme() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
}

function updateThemeUI() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const icons = document.querySelectorAll('.theme-icon');
    const texts = document.querySelectorAll('.theme-text');
    icons.forEach(i => i.textContent = current === 'dark' ? '🌙' : '☀️');
    texts.forEach(t => t.textContent = current === 'dark' ? 'Dark' : 'Light');
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeUI();
}

function parseHash(hashStr) {
    const raw = hashStr.replace(/^#\/?/, '') || '';
    const [path, queryStr] = raw.split('?');
    const params = {};
    if (queryStr) {
        new URLSearchParams(queryStr).forEach((val, key) => {
            params[key] = val;
        });
    }
    return { path: `/${path}`, params };
}

function renderShell(contentHtml, currentPath) {
    const isAuth = state.isAuthenticated;
    const user = state.user;

    if (!isAuth) {
        return `
        <!-- Public Navigation -->
        <nav class="public-nav">
            <a href="#/" class="brand">
                <div class="brand-badge">🎓</div>
                <span>Alumni Portal</span>
            </a>
            <div class="public-nav-links">
                <a href="#/" class="${currentPath === '/' ? 'active' : ''}">Home</a>
                <a href="#/login" class="${currentPath === '/login' ? 'active' : ''}">Sign In</a>
                <button class="theme-toggle-btn" type="button" aria-label="Toggle theme">
                    <span class="theme-icon">☀️</span>
                    <span class="theme-text">Theme</span>
                </button>
                <a href="#/register" class="btn-nav-primary">Get Started</a>
            </div>
        </nav>

        <main>
            ${contentHtml}
        </main>
        `;
    }

    return `
    <!-- Mobile Topbar -->
    <div class="mobile-topbar">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Toggle navigation menu">
                ☰
            </button>
            <span style="font-weight: 800; font-size: 1.1rem; color: var(--text-main);">🎓 Alumni Portal</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <button class="theme-toggle-btn" type="button" aria-label="Toggle light/dark theme" style="padding: 0.35rem 0.65rem;">
                <span class="theme-icon">☀️</span>
            </button>
            <a href="#/profile" style="display: flex; align-items: center;">
                ${user.profile_pic ? `
                <img src="/static/${user.profile_pic}" alt="${user.name}" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover;">
                ` : `
                <div style="width: 34px; height: 34px; border-radius: 50%; background: var(--gradient-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem;">
                    ${(user.name || 'U')[0].toUpperCase()}
                </div>
                `}
            </a>
        </div>
    </div>

    <!-- Mobile Overlay -->
    <div class="mobile-overlay" id="mobileOverlay"></div>

    <!-- Authenticated Sidebar -->
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-header" style="justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div class="sidebar-brand-icon">🎓</div>
                <div class="sidebar-brand-title">Alumni Portal</div>
            </div>
            <!-- Theme Toggle in Sidebar Header -->
            <button class="theme-toggle-btn" type="button" title="Toggle Light / Dark Mode" style="padding: 0.35rem 0.65rem;">
                <span class="theme-icon">☀️</span>
            </button>
        </div>

        <nav class="sidebar-nav-group">
            <div class="sidebar-section-title">Main Menu</div>
            <a href="#/dashboard" class="nav-item ${currentPath === '/dashboard' ? 'active' : ''}">
                <span class="icon">📊</span> <span>Dashboard</span>
            </a>
            <a href="#/postings" class="nav-item ${currentPath.startsWith('/postings') ? 'active' : ''}">
                <span class="icon">💼</span> <span>Job Postings</span>
            </a>
            <a href="#/alumni/search" class="nav-item ${currentPath === '/alumni/search' ? 'active' : ''}">
                <span class="icon">🔍</span> <span>Find Alumni</span>
            </a>
            <a href="#/resources" class="nav-item ${currentPath.startsWith('/resources') ? 'active' : ''}">
                <span class="icon">📚</span> <span>Resources</span>
            </a>
            <a href="#/announcements" class="nav-item ${currentPath === '/announcements' ? 'active' : ''}">
                <span class="icon">📢</span> <span>Announcements</span>
            </a>
            
            ${user.role === 'admin' ? `
            <a href="#/admin/users" class="nav-item ${currentPath === '/admin/users' ? 'active' : ''}">
                <span class="icon">👥</span> <span>Manage Users</span>
            </a>
            <a href="#/admin/database" class="nav-item ${currentPath === '/admin/database' ? 'active' : ''}">
                <span class="icon">🗄️</span> <span>Database Viewer</span>
            </a>
            ` : ''}

            <div class="sidebar-section-title" style="margin-top: 0.75rem;">Connect & Network</div>
            <a href="#/messages" class="nav-item ${currentPath.startsWith('/messages') || currentPath.startsWith('/chat') ? 'active' : ''}">
                <span class="icon">💬</span> <span>Messages</span>
            </a>
            <a href="#/chatbot" class="nav-item ${currentPath === '/chatbot' ? 'active' : ''}">
                <span class="icon">🤖</span> <span>AI Assistant</span>
            </a>
            <a href="#/alumni/by-location" class="nav-item ${currentPath === '/alumni/by-location' ? 'active' : ''}">
                <span class="icon">📍</span> <span>Alumni Map</span>
            </a>
        </nav>

        <div class="sidebar-footer">
            <a href="#/profile" class="sidebar-user-card">
                ${user.profile_pic ? `
                <img src="/static/${user.profile_pic}" alt="${user.name}" class="sidebar-user-avatar">
                ` : `
                <div class="sidebar-user-avatar">
                    ${(user.name || 'U')[0].toUpperCase()}
                </div>
                `}
                <div class="sidebar-user-info">
                    <span class="sidebar-user-name">${user.name}</span>
                    <span class="sidebar-user-role">${user.role}</span>
                </div>
            </a>
            <div id="logoutBtn" class="sidebar-logout">
                <span>🚪</span> <span>Sign Out</span>
            </div>
        </div>
    </aside>

    <main class="with-sidebar">
        ${contentHtml}
    </main>
    `;
}

function bindShellEvents() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const logoutBtn = document.getElementById('logoutBtn');

    if (mobileMenuBtn && sidebar && mobileOverlay) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            mobileOverlay.classList.toggle('active');
        });

        mobileOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            mobileOverlay.classList.remove('active');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
        });
    }

    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
        btn.addEventListener('click', toggleTheme);
    });
    updateThemeUI();
}

async function handleRouting() {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    const { path, params } = parseHash(window.location.hash);
    const isAuth = state.isAuthenticated;

    // Protected Routes Check
    const publicPaths = ['/', '/login', '/register'];
    if (!isAuth && !publicPaths.includes(path)) {
        window.location.hash = '#/login';
        return;
    }

    let pageHtml = '';
    let initFunc = null;

    if (path === '/' || path === '') {
        pageHtml = renderHome();
        initFunc = initHome;
    } else if (path === '/login') {
        pageHtml = renderLogin();
        initFunc = initLogin;
    } else if (path === '/register') {
        pageHtml = renderRegister();
        initFunc = initRegister;
    } else if (path === '/dashboard') {
        pageHtml = renderDashboard();
        initFunc = initDashboard;
    } else if (path === '/postings') {
        pageHtml = renderPostings();
        initFunc = () => initPostings(params);
    } else if (path === '/postings/new') {
        pageHtml = renderNewPosting();
        initFunc = initNewPosting;
    } else if (path === '/alumni/search') {
        pageHtml = renderSearchAlumni();
        initFunc = initSearchAlumni;
    } else if (path === '/alumni/by-location') {
        pageHtml = renderAlumniByLocation();
        initFunc = initAlumniByLocation;
    } else if (path === '/resources') {
        pageHtml = renderResources();
        initFunc = () => initResources(params);
    } else if (path === '/resources/new') {
        pageHtml = renderNewResource();
        initFunc = initNewResource;
    } else if (path === '/announcements') {
        pageHtml = renderAnnouncements();
        initFunc = initAnnouncements;
    } else if (path === '/messages') {
        pageHtml = renderMessagesList();
        initFunc = initMessagesList;
    } else if (path.startsWith('/chat/')) {
        const otherId = path.split('/')[2];
        pageHtml = renderChat(otherId);
        initFunc = () => initChat(otherId);
    } else if (path.startsWith('/video/')) {
        const otherId = path.split('/')[2];
        pageHtml = renderVideoCall(otherId);
        initFunc = () => initVideoCall(otherId);
    } else if (path === '/chatbot') {
        pageHtml = renderChatbot();
        initFunc = initChatbot;
    } else if (path === '/profile') {
        pageHtml = renderProfile();
        initFunc = initProfile;
    } else if (path === '/admin/users') {
        pageHtml = renderAdminUsers();
        initFunc = initAdminUsers;
    } else if (path === '/admin/database') {
        pageHtml = renderAdminDatabase();
        initFunc = initAdminDatabase;
    } else {
        pageHtml = `
        <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <h3>404 — Page Not Found</h3>
            <p>The page you are looking for does not exist or has been moved.</p>
            <a href="#/" class="btn btn-primary">Return to Home</a>
        </div>
        `;
    }

    appEl.innerHTML = renderShell(pageHtml, path);
    bindShellEvents();

    if (initFunc) {
        initFunc();
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
}

// Global App Initialization
async function initApp() {
    initTheme();
    await checkAuth();
    handleRouting();
    window.addEventListener('hashchange', handleRouting);
    subscribe(() => handleRouting());
}

initApp();
