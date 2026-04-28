import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/apiService';
import {
    Shield, Users, BookOpen, Trash2, AlertTriangle,
    Search, ChevronDown, CheckCircle2, Clock, Star, X,
    RefreshCw, Activity, UserX
} from 'lucide-react';

const ADMIN_EMAIL = 'admin@gmail.com';

const STATUS_CONFIG = {
    pending:   { color: 'bg-amber-50 text-amber-700 border-amber-200',   icon: <Clock className="w-3 h-3 mr-1" />,         label: 'Pending' },
    confirmed: { color: 'bg-blue-50 text-blue-700 border-blue-200',      icon: <CheckCircle2 className="w-3 h-3 mr-1" />,   label: 'Confirmed' },
    completed: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3 mr-1" />, label: 'Completed' },
    rated:     { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: <Star className="w-3 h-3 mr-1" />,          label: 'Rated' },
    declined:  { color: 'bg-red-50 text-red-700 border-red-200',         icon: <X className="w-3 h-3 mr-1" />,             label: 'Declined' },
};

const AdminDashboard = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const initialTab = searchParams.get('tab') === 'sessions' ? 'sessions' : 'users';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [users, setUsers] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [confirmRemove, setConfirmRemove] = useState(null);
    const [removing, setRemoving] = useState(false);
    const [sessionFilter, setSessionFilter] = useState('all');
    const [removeReason, setRemoveReason] = useState('');

    // Guard: redirect non-admins
    useEffect(() => {
        if (currentUser && currentUser.email !== ADMIN_EMAIL) {
            navigate('/');
        }
    }, [currentUser, navigate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersData, sessionsData] = await Promise.all([
                api.get('/api/users'),
                api.get('/api/sessions/all'),
            ]);
            setUsers(usersData);
            setSessions(sessionsData);
        } catch (err) {
            console.error('Admin fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.email === ADMIN_EMAIL) fetchData();
    }, [currentUser]);

    const handleRemoveUser = async () => {
        if (!confirmRemove) return;
        setRemoving(true);
        try {
            await api.delete(`/api/users/${encodeURIComponent(confirmRemove.email)}`);
            setUsers(prev => prev.filter(u => u.email !== confirmRemove.email));
            setSessions(prev => prev.filter(s =>
                s.requesterEmail !== confirmRemove.email &&
                s.targetUserEmail !== confirmRemove.email
            ));
            setConfirmRemove(null);
            setRemoveReason('');
        } catch (err) {
            console.error('Remove user error:', err);
        } finally {
            setRemoving(false);
        }
    };

    const filteredUsers = users.filter(u =>
        (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.college || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredSessions = sessions.filter(s =>
        sessionFilter === 'all' ? true : s.status === sessionFilter
    ).filter(s =>
        searchQuery
            ? (s.requesterName || s.requesterEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
              (s.targetUserName || s.targetUserEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
              (s.skill || '').toLowerCase().includes(searchQuery.toLowerCase())
            : true
    );

    // Stats
    const stats = {
        totalUsers: users.length,
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => ['pending', 'confirmed'].includes(s.status)).length,
        completedSessions: sessions.filter(s => ['completed', 'rated'].includes(s.status)).length,
    };

    if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white/80 border-b border-gray-200 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl shadow-sm">
                            <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">PeerPath Admin</h1>
                            <p className="text-xs font-medium text-gray-500">Control Panel</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary bg-white hover:bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 shadow-sm transition"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Users', value: stats.totalUsers, icon: <Users className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                        { label: 'Total Sessions', value: stats.totalSessions, icon: <Activity className="w-5 h-5" />, color: 'text-primary', bg: 'bg-indigo-50 border-indigo-100' },
                        { label: 'Active Sessions', value: stats.activeSessions, icon: <Clock className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
                        { label: 'Completed', value: stats.completedSessions, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                    ].map(({ label, value, icon, color, bg }) => (
                        <div key={label} className={`rounded-2xl border p-5 ${bg} backdrop-blur-sm shadow-sm`}>
                            <div className={`${color} mb-3`}>{icon}</div>
                            <p className="text-3xl font-extrabold text-gray-900 mb-1">{loading ? '—' : value}</p>
                            <p className="text-xs text-gray-600 font-semibold uppercase tracking-wider">{label}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs + Search */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex bg-gray-100 rounded-xl p-1 border border-gray-200">
                        <button
                            onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'users' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Users className="w-4 h-4 inline mr-2" />Users ({users.length})
                        </button>
                        <button
                            onClick={() => { setActiveTab('sessions'); setSearchQuery(''); }}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'sessions' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <BookOpen className="w-4 h-4 inline mr-2" />Sessions ({sessions.length})
                        </button>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder={activeTab === 'users' ? 'Search users...' : 'Search sessions...'}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition shadow-sm"
                            />
                        </div>
                        {activeTab === 'sessions' && (
                            <div className="relative">
                                <select
                                    value={sessionFilter}
                                    onChange={e => setSessionFilter(e.target.value)}
                                    className="appearance-none bg-white border border-gray-200 text-gray-700 font-medium text-sm px-4 py-2.5 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="completed">Completed</option>
                                    <option value="rated">Rated</option>
                                    <option value="declined">Declined</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-100 border-t-primary rounded-full animate-spin" />
                        <p className="text-gray-500 font-medium">Loading admin data...</p>
                    </div>
                ) : activeTab === 'users' ? (
                    <div className="grid gap-3">
                        {filteredUsers.length === 0 ? (
                            <div className="text-center py-16 text-gray-400 font-medium bg-white rounded-2xl border border-gray-200">No users found</div>
                        ) : filteredUsers.map(user => (
                            <div key={user.email} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-200 hover:shadow-md transition shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                                        {(user.name || 'U').charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{user.name || 'No Name'}</p>
                                        <p className="text-xs font-medium text-primary">{user.email}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{user.college} · {user.year} · {user.branch}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 flex-wrap">
                                    <div className="text-center">
                                        <p className="text-gray-900 font-extrabold">{user.rating ? Number(user.rating).toFixed(1) : '—'}</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Rating</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-gray-900 font-extrabold">{user.totalSessions || 0}</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Sessions</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-gray-900 font-extrabold capitalize">{user.plan || 'free'}</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Plan</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Teaches</p>
                                        <div className="flex flex-wrap gap-1">
                                            {(user.skillsTeach || []).map(s => (
                                                <span key={s} className="text-xs font-medium bg-indigo-50 text-primary border border-indigo-100 px-2.5 py-0.5 rounded-full">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setConfirmRemove(user)}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-sm font-semibold transition"
                                    >
                                        <UserX className="w-4 h-4" /> Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {filteredSessions.length === 0 ? (
                            <div className="text-center py-16 text-gray-400 font-medium bg-white rounded-2xl border border-gray-200">No sessions found</div>
                        ) : filteredSessions.map(session => {
                            const cfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.pending;
                            return (
                                <div key={session.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-200 hover:shadow-md transition shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                                            <BookOpen className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-bold text-gray-900">
                                                    {session.requesterName || session.requesterEmail}
                                                </p>
                                                <span className="text-gray-400 text-sm">→</span>
                                                <p className="font-bold text-primary">
                                                    {session.targetUserName || session.targetUserEmail}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                <span className="text-xs bg-gray-100 border border-gray-200 text-gray-700 px-2.5 py-0.5 rounded-full font-semibold">
                                                    {session.skill || 'Unknown Skill'}
                                                </span>
                                                {session.date && (
                                                    <span className="text-xs font-medium text-gray-500">
                                                        {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        {session.time ? ` · ${session.time}` : ''}
                                                    </span>
                                                )}
                                                {session.rating && (
                                                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                                                        <Star className="w-3.5 h-3.5 fill-amber-500" /> {session.rating}/5
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border ${cfg.color}`}>
                                            {cfg.icon}{cfg.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Remove Confirmation Modal */}
            {confirmRemove && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-red-100 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-50 rounded-xl border border-red-100">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Remove User</h3>
                                <p className="text-sm font-medium text-gray-500">This action cannot be undone.</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                            <p className="font-bold text-gray-900">{confirmRemove.name}</p>
                            <p className="text-sm font-medium text-primary">{confirmRemove.email}</p>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                            This will permanently delete this user and <span className="text-red-600 font-bold">all their sessions</span> from the platform.
                        </p>
                        <textarea
                            value={removeReason}
                            onChange={e => setRemoveReason(e.target.value)}
                            placeholder="Reason for removal (optional)..."
                            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-5 shadow-sm"
                            rows={3}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setConfirmRemove(null); setRemoveReason(''); }}
                                className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-gray-600 bg-white hover:bg-gray-50 border border-gray-300 transition shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRemoveUser}
                                disabled={removing}
                                className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-custom"
                            >
                                {removing ? (
                                    <><RefreshCw className="w-4 h-4 animate-spin" /> Removing...</>
                                ) : (
                                    <><Trash2 className="w-4 h-4" /> Confirm Remove</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
