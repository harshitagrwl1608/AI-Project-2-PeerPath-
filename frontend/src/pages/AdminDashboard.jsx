import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/apiService';
import {
    Shield, Users, BookOpen, Trash2, AlertTriangle,
    Search, ChevronDown, CheckCircle2, Clock, Star, X,
    RefreshCw, Activity, UserX
} from 'lucide-react';

const ADMIN_EMAIL = 'Admin@gmail.com';

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

    const [activeTab, setActiveTab] = useState('users');
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
            {/* Header */}
            <div className="bg-slate-900/80 border-b border-white/10 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-xl shadow-lg">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">PeerPath Admin</h1>
                            <p className="text-xs text-indigo-300">Control Panel</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-2 text-sm text-indigo-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 transition"
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
                        { label: 'Total Users', value: stats.totalUsers, icon: <Users className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                        { label: 'Total Sessions', value: stats.totalSessions, icon: <Activity className="w-5 h-5" />, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
                        { label: 'Active Sessions', value: stats.activeSessions, icon: <Clock className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                        { label: 'Completed', value: stats.completedSessions, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                    ].map(({ label, value, icon, color, bg }) => (
                        <div key={label} className={`rounded-2xl border p-5 ${bg} backdrop-blur-sm`}>
                            <div className={`${color} mb-3`}>{icon}</div>
                            <p className="text-3xl font-bold text-white mb-1">{loading ? '—' : value}</p>
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs + Search */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                        <button
                            onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Users className="w-4 h-4 inline mr-2" />Users ({users.length})
                        </button>
                        <button
                            onClick={() => { setActiveTab('sessions'); setSearchQuery(''); }}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'sessions' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <BookOpen className="w-4 h-4 inline mr-2" />Sessions ({sessions.length})
                        </button>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder={activeTab === 'users' ? 'Search users...' : 'Search sessions...'}
                                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            />
                        </div>
                        {activeTab === 'sessions' && (
                            <div className="relative">
                                <select
                                    value={sessionFilter}
                                    onChange={e => setSessionFilter(e.target.value)}
                                    className="appearance-none bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="all" className="bg-slate-800">All Status</option>
                                    <option value="pending" className="bg-slate-800">Pending</option>
                                    <option value="confirmed" className="bg-slate-800">Confirmed</option>
                                    <option value="completed" className="bg-slate-800">Completed</option>
                                    <option value="rated" className="bg-slate-800">Rated</option>
                                    <option value="declined" className="bg-slate-800">Declined</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                        <p className="text-slate-400 font-medium">Loading admin data...</p>
                    </div>
                ) : activeTab === 'users' ? (
                    <div className="grid gap-3">
                        {filteredUsers.length === 0 ? (
                            <div className="text-center py-16 text-slate-500">No users found</div>
                        ) : filteredUsers.map(user => (
                            <div key={user.email} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/8 transition">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                                        {(user.name || 'U').charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{user.name || 'No Name'}</p>
                                        <p className="text-xs text-indigo-300">{user.email}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{user.college} · {user.year} · {user.branch}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 flex-wrap">
                                    <div className="text-center">
                                        <p className="text-white font-bold">{user.rating ? Number(user.rating).toFixed(1) : '—'}</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Rating</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white font-bold">{user.totalSessions || 0}</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Sessions</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white font-bold capitalize">{user.plan || 'free'}</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Plan</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Teaches</p>
                                        <div className="flex flex-wrap gap-1">
                                            {(user.skillsTeach || []).map(s => (
                                                <span key={s} className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setConfirmRemove(user)}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl text-sm font-semibold transition"
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
                            <div className="text-center py-16 text-slate-500">No sessions found</div>
                        ) : filteredSessions.map(session => {
                            const cfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.pending;
                            return (
                                <div key={session.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/8 transition">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                            <BookOpen className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-bold text-white">
                                                    {session.requesterName || session.requesterEmail}
                                                </p>
                                                <span className="text-slate-500 text-sm">→</span>
                                                <p className="font-bold text-indigo-300">
                                                    {session.targetUserName || session.targetUserEmail}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-medium">
                                                    {session.skill || 'Unknown Skill'}
                                                </span>
                                                {session.date && (
                                                    <span className="text-xs text-slate-500">
                                                        {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        {session.time ? ` · ${session.time}` : ''}
                                                    </span>
                                                )}
                                                {session.rating && (
                                                    <span className="text-xs text-amber-400 flex items-center gap-1">
                                                        <Star className="w-3 h-3 fill-amber-400" /> {session.rating}/5
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
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-500/20 rounded-xl">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Remove User</h3>
                                <p className="text-sm text-slate-400">This action cannot be undone.</p>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                            <p className="font-bold text-white">{confirmRemove.name}</p>
                            <p className="text-sm text-indigo-300">{confirmRemove.email}</p>
                        </div>
                        <p className="text-sm text-slate-400 mb-3">
                            This will permanently delete this user and <span className="text-red-400 font-semibold">all their sessions</span> from the platform.
                        </p>
                        <textarea
                            value={removeReason}
                            onChange={e => setRemoveReason(e.target.value)}
                            placeholder="Reason for removal (optional)..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-5"
                            rows={3}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setConfirmRemove(null); setRemoveReason(''); }}
                                className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRemoveUser}
                                disabled={removing}
                                className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
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
