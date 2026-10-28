/**
 * Global App State & Toast Notification System
 */
import { api } from './api.js';

export const state = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
};

const listeners = [];

export function subscribe(fn) {
    listeners.push(fn);
    return () => {
        const idx = listeners.indexOf(fn);
        if (idx > -1) listeners.splice(idx, 1);
    };
}

export function notify() {
    listeners.forEach(fn => fn(state));
}

export async function checkAuth() {
    try {
        state.isLoading = true;
        const data = await api.get('/api/auth/me');
        state.isAuthenticated = data.authenticated;
        state.user = data.user;
    } catch (err) {
        state.isAuthenticated = false;
        state.user = null;
    } finally {
        state.isLoading = false;
        notify();
    }
}

export async function logout() {
    try {
        await api.post('/api/auth/logout');
    } catch (err) {
        console.error('Logout error:', err);
    } finally {
        state.user = null;
        state.isAuthenticated = false;
        notify();
        window.location.hash = '#/';
        showToast('Signed out successfully', 'success');
    }
}

export function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: bold;">${icon}</span>
            <p>${message}</p>
        </div>
        <button style="background: transparent; border: none; font-size: 16px; cursor: pointer; color: var(--text-muted); padding: 0; box-shadow: none;" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 4000);
}
