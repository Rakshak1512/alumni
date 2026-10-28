/**
 * Central API Client for Alumni Portal Frontend.
 * Local Vite requests target Flask directly. Production can override the
 * backend origin with VITE_API_BASE_URL; the fallback keeps the current hosted
 * API working for deployments where that build variable was omitted.
 */
const isLocalDevelopment = typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname);
const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const rawBaseUrl = configuredBaseUrl ||
    (isLocalDevelopment ? 'http://127.0.0.1:5000' : 'https://alumni-qk5y-nine.vercel.app');
const BASE_URL = rawBaseUrl.replace(/\/+$/, '');
const TOKEN_KEY = 'alumni_auth_token';

function readToken() {
    try {
        return window.localStorage.getItem(TOKEN_KEY) || '';
    } catch {
        return '';
    }
}

function saveToken(token) {
    try {
        if (token) window.localStorage.setItem(TOKEN_KEY, token);
        else window.localStorage.removeItem(TOKEN_KEY);
    } catch (err) {
        console.warn('Unable to persist authentication token in this browser.', err);
    }
}

export async function request(endpoint, options = {}) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = endpoint.startsWith('http')
        ? endpoint
        : (BASE_URL ? `${BASE_URL}${cleanEndpoint}` : cleanEndpoint);

    const defaultHeaders = {};
    if (!(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
    }

    const token = readToken();
    if (token && !options.headers?.Authorization) {
        defaultHeaders.Authorization = `Bearer ${token}`;
    }

    const config = {
        ...options,
        credentials: 'include',
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    let res;
    try {
        res = await fetch(url, config);
    } catch (err) {
        throw new Error(
            'Cannot reach the Alumni Portal backend. Check that the backend is deployed, ' +
            'VITE_API_BASE_URL points to the correct HTTPS API origin, and the frontend origin ' +
            'is allowed by the backend CORS configuration.'
        );
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
            const isLogin = cleanEndpoint === '/api/auth/login';
            if (!isLogin && res.status === 401) saveToken('');
        }
        throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
    }

    if (cleanEndpoint === '/api/auth/login' && data.auth_token) {
        saveToken(data.auth_token);
    }
    if (cleanEndpoint === '/api/auth/logout') saveToken('');
    return data;
}

export const api = {
    get: (endpoint) => request(endpoint, { method: 'GET' }),
    post: (endpoint, body) => request(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
    }),
    postForm: (endpoint, formData) => request(endpoint, {
        method: 'POST',
        body: formData,
    }),
};
