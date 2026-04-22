/**
 * apiService.js
 * Central HTTP client for the PeerPath backend API.
 * Automatically attaches the user's email to every request via X-User-Email header.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Get the current user's email from localStorage.
 */
const getAuthEmail = () => {
    return localStorage.getItem('peerpath_auth_email');
};

/**
 * Make an authenticated API request.
 */
export const apiRequest = async (path, options = {}) => {
    const email = getAuthEmail();

    const headers = {
        'Content-Type': 'application/json',
        ...(email ? { 'X-User-Email': email } : {}),
        ...(options.headers || {}),
    };

    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(error.error || `Request failed: ${response.status}`);
    }

    return response.json();
};

export const api = {
    get: (path) => apiRequest(path, { method: 'GET' }),
    post: (path, body) => apiRequest(path, { method: 'POST', body: JSON.stringify(body) }),
    patch: (path, body) => apiRequest(path, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (path) => apiRequest(path, { method: 'DELETE' }),
};
