import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { BookOpen, User, Home, Monitor, Shield, Lock, Bell, Check, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ChangePasswordModal from '../ChangePasswordModal';

const ADMIN_EMAIL = 'admin@gmail.com';

const Navbar = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    return (
        <nav className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link to="/" className="flex-shrink-0 flex items-center group">
                            <BookOpen className="h-8 w-8 text-primary group-hover:text-primary-hover transition" />
                            <span className="ml-2 font-bold text-xl text-gray-900 tracking-tight">PeerPath</span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {currentUser ? (
                            <>
                                {currentUser.email === ADMIN_EMAIL ? (
                                    // Admin navigation
                                    <>
                                        <Link to="/admin" className="text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-semibold flex items-center transition shadow-md">
                                            <Shield className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Admin</span>
                                        </Link>
                                    </>
                                ) : (
                                    // Regular user navigation
                                    <>
                                        <Link to="/" className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium flex items-center transition">
                                            <Home className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Feed</span>
                                        </Link>
                                        <Link to="/sessions" className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium flex items-center transition">
                                            <Monitor className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Sessions</span>
                                        </Link>
                                    </>
                                )}
                                
                                <div className="relative ml-2">
                                    <button
                                        onClick={() => { setIsNotifOpen(!isNotifOpen); setIsDropdownOpen(false); }}
                                        className="relative flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition focus:outline-none"
                                    >
                                        <Bell className="h-5 w-5" />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white items-center justify-center text-[9px] font-bold text-white">
                                                    {unreadCount}
                                                </span>
                                            </span>
                                        )}
                                    </button>

                                    {isNotifOpen && (
                                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl py-2 border border-gray-100 z-50">
                                            <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
                                                <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                                                {unreadCount > 0 && (
                                                    <button onClick={markAllAsRead} className="text-xs text-primary font-semibold hover:underline">
                                                        Mark all as read
                                                    </button>
                                                )}
                                            </div>
                                            <div className="max-h-80 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="p-4 text-center text-gray-500 text-sm">No notifications yet.</div>
                                                ) : (
                                                    notifications.map(notif => (
                                                        <div 
                                                            key={notif.id} 
                                                            className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer ${!notif.isRead ? 'bg-indigo-50/30' : ''}`}
                                                            onClick={() => {
                                                                if (!notif.isRead) markAsRead(notif.id);
                                                                setIsNotifOpen(false);
                                                                navigate('/sessions');
                                                            }}
                                                        >
                                                            <div className="flex gap-3">
                                                                <div className="shrink-0 mt-0.5">
                                                                    {notif.type === 'upcoming' ? (
                                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center"><Clock className="w-4 h-4 text-indigo-600" /></div>
                                                                    ) : notif.type === 'request' ? (
                                                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"><BookOpen className="w-4 h-4 text-emerald-600" /></div>
                                                                    ) : (
                                                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><Check className="w-4 h-4 text-blue-600" /></div>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className={`text-sm font-semibold ${!notif.isRead ? 'text-gray-900' : 'text-gray-700'}`}>{notif.title}</p>
                                                                    <p className="text-xs text-gray-600 mt-0.5 leading-snug">{notif.message}</p>
                                                                    <div className="flex items-center gap-3 mt-2">
                                                                        <span className="text-[10px] text-gray-400 font-medium">
                                                                            {notif.type === 'upcoming' ? 'Just now' : new Date(notif.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                                                                        </span>
                                                                        {notif.type === 'upcoming' && notif.link && (
                                                                            <a href={notif.link} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded-md">
                                                                                Join Meet
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="relative">
                                    <button
                                        onClick={() => { setIsDropdownOpen(!isDropdownOpen); setIsNotifOpen(false); }}
                                        className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition focus:outline-none"
                                    >
                                        <User className="h-5 w-5" />
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 border border-gray-100 z-50">
                                            <Link
                                                to="/setup"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                            >
                                                <User className="h-4 w-4 mr-2 text-gray-400" />
                                                My Profile
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    setIsDropdownOpen(false);
                                                    setShowChangePassword(true);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                            >
                                                <Lock className="h-4 w-4 mr-2 text-gray-400" />
                                                Change Password
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsDropdownOpen(false);
                                                    handleLogout();
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                            >
                                                <User className="h-4 w-4 mr-2" />
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <Link
                                to="/admin-login"
                                className="flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-hover transition shadow-custom"
                            >
                                <Shield className="h-4 w-4" />
                                Admin Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
            
            {showChangePassword && currentUser?.email && (
                <ChangePasswordModal 
                    email={currentUser.email} 
                    onClose={() => setShowChangePassword(false)} 
                />
            )}
        </nav>
    );
};

export default Navbar;
