/**
 * sessionService.js
 * All session data now stored in MongoDB Atlas via the Express backend API.
 * Uses email identification.
 * Falls back gracefully if the API is unreachable.
 */

import { api } from './apiService';
import { INITIAL_SESSIONS } from '../data/mockData';

const dispatchOfflineWarning = () => {
    // Standard event for offline demo UI notification
    window.dispatchEvent(new CustomEvent('peerpath_offline'));
};

/**
 * Fetch all sessions for the current user.
 */
export const getSessions = async (email) => {
    if (!email) {
        const stored = localStorage.getItem('peerpath_sessions');
        return stored ? JSON.parse(stored) : INITIAL_SESSIONS;
    }
    try {
        const sessions = await api.get('/api/sessions');
        return sessions;
    } catch (err) {
        console.warn('[sessionService] API unavailable:', err.message);
        dispatchOfflineWarning();
        const stored = localStorage.getItem('peerpath_sessions');
        return stored ? JSON.parse(stored) : INITIAL_SESSIONS;
    }
};

/**
 * Create a new session request.
 */
export const createSession = async (sessionData, requesterEmail = null) => {
    if (!requesterEmail) {
        // Demo/offline mode — save to localStorage
        const stored = localStorage.getItem('peerpath_sessions') || '[]';
        const sessions = JSON.parse(stored);
        const fallback = { ...sessionData, id: `local-${Date.now()}`, status: 'pending' };
        sessions.push(fallback);
        localStorage.setItem('peerpath_sessions', JSON.stringify(sessions));
        return fallback;
    }
    try {
        return await api.post('/api/sessions', sessionData);
    } catch (err) {
        console.error('[sessionService] createSession error:', err.message);
        throw err;
    }
};

/**
 * Delete (retract) a session.
 */
export const deleteSession = async (sessionId) => {
    if (!sessionId || String(sessionId).startsWith('local-')) {
        const stored = localStorage.getItem('peerpath_sessions') || '[]';
        const sessions = JSON.parse(stored).filter(s => s.id !== sessionId);
        localStorage.setItem('peerpath_sessions', JSON.stringify(sessions));
        return;
    }
    await api.delete(`/api/sessions/${sessionId}`);
};

/**
 * Update a session (status, rating, date/time, messages).
 */
export const updateSession = async (sessionId, data) => {
    if (!sessionId || String(sessionId).startsWith('local-')) {
        const stored = localStorage.getItem('peerpath_sessions') || '[]';
        const sessions = JSON.parse(stored);
        const idx = sessions.findIndex(s => s.id === sessionId);
        if (idx > -1) {
            sessions[idx] = { ...sessions[idx], ...data };
            localStorage.setItem('peerpath_sessions', JSON.stringify(sessions));
        }
        return;
    }
    await api.patch(`/api/sessions/${sessionId}`, data);
};

/**
 * Add a chat message to a session.
 */
export const addChatMessage = async (sessionId, message) => {
    const newMessage = { ...message, timestamp: new Date().toISOString() };

    if (!sessionId || String(sessionId).startsWith('local-')) {
        // Offline fallback
        const stored = localStorage.getItem('peerpath_sessions') || '[]';
        const sessions = JSON.parse(stored);
        const idx = sessions.findIndex(s => s.id === sessionId);
        if (idx > -1) {
            if (!sessions[idx].messages) sessions[idx].messages = [];
            sessions[idx].messages.push(newMessage);
            localStorage.setItem('peerpath_sessions', JSON.stringify(sessions));
        }
        return newMessage;
    }

    try {
        const saved = await api.post(`/api/sessions/${sessionId}/messages`, message);
        return saved;
    } catch (err) {
        console.error('[sessionService] addChatMessage error:', err.message);
        return newMessage;
    }
};

/**
 * Poll a session for real-time-like updates.
 * Polls the API every 3 seconds while the chat is open.
 */
export const onSessionSnapshot = (sessionId, callback) => {
    if (!sessionId || String(sessionId).startsWith('local-')) {
        const intervalId = setInterval(() => {
            const stored = localStorage.getItem('peerpath_sessions') || '[]';
            const sessions = JSON.parse(stored);
            const session = sessions.find(s => s.id === sessionId);
            if (session) callback(session);
        }, 1500);
        return () => clearInterval(intervalId);
    }

    // Poll the API every 3 seconds
    const intervalId = setInterval(async () => {
        try {
            const session = await api.get(`/api/sessions/${sessionId}`);
            callback(session);
        } catch (err) {
            console.warn('[sessionService] polling error:', err.message);
        }
    }, 3000);

    return () => clearInterval(intervalId);
};
