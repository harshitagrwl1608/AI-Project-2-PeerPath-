/**
 * userService.js
 * All user data now stored in MongoDB Atlas via the Express backend API.
 * Uses email-based identification.
 * Falls back to mock data if the API is unreachable.
 */

import { api } from './apiService';
import { INITIAL_DUMMY_USERS } from '../data/mockData';

/**
 * Fetch a single user's public profile by their email.
 */
export const getUserProfile = async (email) => {
    try {
        const user = await api.get(`/api/users/${encodeURIComponent(email)}`);
        return user;
    } catch (err) {
        console.error('[userService] getUserProfile error:', err.message);
        return null;
    }
};

/**
 * Save (create or update) the current user's profile via the API.
 */
export const saveUserProfile = async (email, data) => {
    try {
        const result = await api.post('/api/users', data);
        return result;
    } catch (err) {
        console.error('[userService] saveUserProfile error:', err.message);
        // Fallback: persist to localStorage so the UI still works
        localStorage.setItem('peerpath_profile', JSON.stringify({ ...data, id: email }));
    }
};

/**
 * Fetch all users for the discovery feed.
 */
export const getAllUsers = async () => {
    try {
        const users = await api.get('/api/users');
        if (!users || users.length === 0) return INITIAL_DUMMY_USERS;
        return users;
    } catch (err) {
        console.warn('[userService] API unavailable, using mock data:', err.message);
        return INITIAL_DUMMY_USERS;
    }
};
