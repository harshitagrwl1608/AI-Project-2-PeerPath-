import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/apiService';
import { getSessions } from '../services/sessionService';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [dbNotifications, setDbNotifications] = useState([]);
    const [upcomingAlerts, setUpcomingAlerts] = useState([]);
    const [isPolling, setIsPolling] = useState(false);

    useEffect(() => {
        if (!currentUser?.email) {
            setDbNotifications([]);
            setUpcomingAlerts([]);
            return;
        }

        const fetchAll = async () => {
            try {
                // Fetch DB Notifications
                const notifs = await api.get('/api/notifications');
                setDbNotifications(notifs || []);

                // Fetch Sessions for dynamic Upcoming Alerts
                const sessions = await getSessions(currentUser.email);
                const now = new Date();
                
                const newUpcoming = [];
                (sessions || []).forEach(session => {
                    if (session.status === 'confirmed' && session.date && session.time) {
                        const sessionTime = new Date(`${session.date}T${session.time}`);
                        const diffMs = sessionTime - now;
                        const diffMins = Math.floor(diffMs / 60000);
                        
                        // If it's upcoming in exactly <= 15 mins and >= -60 mins (still active)
                        if (diffMins <= 15 && diffMins >= -60) {
                            newUpcoming.push({
                                id: `upcoming-${session.id}`,
                                type: 'upcoming',
                                title: 'Upcoming Session!',
                                message: `Your ${session.skill} session with ${session.requesterEmail === currentUser.email ? session.targetUserName : session.requesterName} is starting ${diffMins > 0 ? `in ${diffMins} mins` : 'now'}.`,
                                isRead: false,
                                link: session.meetLink,
                                createdAt: new Date().toISOString(), // Keep it at top
                                sessionId: session.id
                            });
                        }
                    }
                });
                
                setUpcomingAlerts(newUpcoming);
            } catch (err) {
                console.error('[NotificationContext] Error fetching notifications:', err);
            }
        };

        // Initial fetch
        fetchAll();

        // Poll every 15 seconds
        const intervalId = setInterval(fetchAll, 15000);
        return () => clearInterval(intervalId);
    }, [currentUser]);

    // Merge and sort
    const allNotifications = [...upcomingAlerts, ...dbNotifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const unreadCount = allNotifications.filter(n => !n.isRead).length;

    const markAsRead = async (id) => {
        if (String(id).startsWith('upcoming-')) {
            // Can't mark dynamic as read permanently in DB, so we just let it disappear when time passes
            return;
        }
        
        try {
            await api.patch(`/api/notifications/${id}/read`);
            setDbNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error('Error marking read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/api/notifications/read-all');
            setDbNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Error marking all read:', err);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications: allNotifications,
            unreadCount,
            markAsRead,
            markAllAsRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
