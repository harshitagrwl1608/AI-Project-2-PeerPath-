import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, BookOpen, Loader2, Star, AlertTriangle, X, MessageSquare, Check } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { getSessions, deleteSession, updateSession } from '../services/sessionService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import UserProfileModal from '../components/UserProfileModal';
import ChatModal from '../components/ChatModal';

const MySessions = () => {
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [retractSession, setRetractSession] = useState(null);
    const [rateSession, setRateSession] = useState(null);
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // New Feature States
    const [showProfileId, setShowProfileId] = useState(null);
    const [activeChatSession, setActiveChatSession] = useState(null);

    useEffect(() => {
        const fetchSessions = async () => {
            setLoading(true);
            const data = await getSessions(currentUser?.email || null);
            setSessions(data);
            setLoading(false);
        };
        fetchSessions();
    }, [currentUser]);

    // Resolve peer name from the sessions data by fetching user profiles
    const [peerNames, setPeerNames] = useState({});
    useEffect(() => {
        const resolvePeerNames = async () => {
            const names = {};
            for (const session of sessions) {
                const isReq = session.requesterEmail === currentUser?.email;
                const peerEmail = isReq ? session.targetUserEmail : session.requesterEmail;
                if (peerEmail && !names[peerEmail]) {
                    try {
                        const { getUserProfile } = await import('../services/userService');
                        const profile = await getUserProfile(peerEmail);
                        names[peerEmail] = profile?.name || peerEmail;
                    } catch {
                        names[peerEmail] = peerEmail;
                    }
                }
            }
            setPeerNames(names);
        };
        if (sessions.length > 0 && currentUser) resolvePeerNames();
    }, [sessions, currentUser]);

    /**
     * Generate a deterministic Jitsi Meet room URL from the session ID.
     * Jitsi Meet (meet.jit.si) supports custom room names — both users
     * will always land in the exact same room because the name is derived
     * from the unique session ID. No API key required.
     */
    const getMeetUrl = (sessionId) => {
        // Strip hyphens → pure alphanumeric room name, e.g. "PeerPath-550e8400e29b41d4a716446655440000"
        const room = String(sessionId).replace(/-/g, '');
        return `https://meet.jit.si/PeerPath-${room}`;
    };

    const handleJoinStream = async (session) => {
        try {
            let meetUrl = session.meetLink;

            if (!meetUrl) {
                // First click: compute and persist so both peers always share the same link
                meetUrl = getMeetUrl(session.id);
                await updateSession(session.id, { meetLink: meetUrl });
                setSessions(prev =>
                    prev.map(s => s.id === session.id ? { ...s, meetLink: meetUrl } : s)
                );
            }

            showToast("Opening video meeting room…", "info");
            window.open(meetUrl, '_blank');
        } catch (err) {
            console.error('handleJoinStream error:', err);
            showToast("Could not open meeting. Please try again.", "error");
        }
    };

    const handleConfirmRetract = async () => {
        if (!retractSession) return;
        setIsSubmitting(true);
        try {
            await deleteSession(retractSession.id);
            setSessions(prev => prev.filter(s => s.id !== retractSession.id));
            showToast("Session request retracted successfully.", "success");
        } catch (err) {
            showToast("Failed to retract session.", "error");
        } finally {
            setIsSubmitting(false);
            setRetractSession(null);
        }
    };

    const handleAcceptSession = async (sessionId) => {
        setIsSubmitting(true);
        try {
            await updateSession(sessionId, { status: 'confirmed' });
            setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'confirmed' } : s));
            showToast("Session request accepted!", "success");
        } catch (err) {
            showToast("Failed to accept session.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeclineSession = async (sessionId) => {
        setIsSubmitting(true);
        try {
            await deleteSession(sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            showToast("Session request declined.", "info");
        } catch (err) {
            showToast("Failed to decline session.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmRate = async () => {
        if (!rateSession) return;
        if (rating === 0) {
            showToast("Please select a rating out of 5 stars.", "error");
            return;
        }
        setIsSubmitting(true);
        try {
            await updateSession(rateSession.id, { status: 'rated', rating, feedback });
            setSessions(prev => prev.map(s => s.id === rateSession.id ? { ...s, status: 'rated', rating, feedback } : s));
            showToast("Review submitted successfully! Thank you.", "success");
        } catch (err) {
            showToast("Failed to submit review.", "error");
        } finally {
            setIsSubmitting(false);
            setRateSession(null);
            setRating(0);
            setFeedback('');
        }
    };

    const handleSessionUpdate = (sessionId, updateData) => {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...updateData } : s));
    };

    return (
        <div className="max-w-4xl mx-auto pb-12 relative">
            <div className="mb-8 border-b border-gray-200 pb-5">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Sessions</h1>
                <p className="text-gray-500 mt-1">Manage your upcoming and past skill exchanges.</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="ml-3 text-gray-500 font-medium">Loading sessions...</span>
                </div>
            ) : (
                <div className="bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden">
                    <ul className="divide-y divide-gray-100">
                        {sessions.map(session => {
                            // FIX: use requesterEmail (actual DB column name)
                            const isRequester = session.requesterEmail === currentUser?.email;
                            const peerEmail = isRequester ? session.targetUserEmail : session.requesterEmail;
                            const displayType = isRequester ? 'Learning' : 'Teaching';
                            const peerName = peerNames[peerEmail] || peerEmail || 'Peer';

                            // FIX: date/time may be null — display TBD
                            const displayDate = session.date ? new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD';
                            const displayTime = session.time || 'TBD';
                            const isScheduled = !!session.date && !!session.time;

                            return (
                            <li key={session.id} className="p-6 hover:bg-gray-50 transition duration-200">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">

                                    <div className="flex items-start space-x-5">
                                        <div className={`p-4 rounded-2xl shrink-0 shadow-sm ${displayType === 'Teaching'
                                            ? 'bg-tag-bg text-primary'
                                            : 'bg-emerald-50 text-emerald-600'
                                            }`}>
                                            {displayType === 'Teaching' ? <Video className="w-7 h-7" /> : <BookOpen className="w-7 h-7" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${displayType === 'Teaching' ? 'text-primary' : 'text-emerald-500'}`}>
                                                    {displayType}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 leading-tight">
                                                {session.skill} <span className="text-gray-400 font-medium mx-1">with</span> <button onClick={() => setShowProfileId(peerEmail)} className="text-primary hover:underline">{peerName}</button>
                                            </h3>
                                            <div className="flex flex-wrap items-center text-sm font-medium text-gray-500 mt-2 gap-4">
                                                <span className="flex items-center bg-white px-2.5 py-1 rounded-md border border-gray-200 shadow-sm">
                                                    <Calendar className="w-4 h-4 mr-1.5 text-gray-400" /> {displayDate}
                                                </span>
                                                <span className="flex items-center bg-white px-2.5 py-1 rounded-md border border-gray-200 shadow-sm">
                                                    <Clock className="w-4 h-4 mr-1.5 text-gray-400" /> {displayTime}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
                                        <div className="self-start sm:self-auto">
                                            <StatusBadge status={session.status} />
                                        </div>
                                        <div className="mt-1 flex flex-wrap gap-2 w-full sm:w-auto">
                                            {session.status === 'confirmed' && (
                                                <>
                                                    <button onClick={() => setActiveChatSession(session)} className="flex-1 sm:flex-none flex items-center justify-center text-sm bg-white text-gray-700 px-5 py-2.5 rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 font-bold transition">
                                                        <MessageSquare className="w-4 h-4 mr-1.5" /> Chat
                                                    </button>
                                                    <button 
                                                        onClick={() => handleJoinStream(session)} 
                                                        disabled={!isScheduled}
                                                        title={!isScheduled ? 'Waiting for date & time to be set' : 'Join the session'}
                                                        className="flex-1 sm:flex-none text-sm bg-primary text-white px-6 py-2.5 rounded-xl shadow-custom hover:bg-primary-hover font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Join Stream
                                                    </button>
                                                </>
                                            )}
                                            {session.status === 'pending' && (
                                                isRequester ? (
                                                    <button onClick={() => setRetractSession(session)} className="flex-1 sm:flex-none text-sm bg-white text-red-600 px-5 py-2 rounded-xl border border-gray-200 hover:border-red-200 hover:bg-red-50 font-bold transition">
                                                        Retract
                                                    </button>
                                                ) : (
                                                    <div className="flex gap-2 w-full sm:w-auto">
                                                        <button 
                                                            onClick={() => handleDeclineSession(session.id)} 
                                                            disabled={isSubmitting}
                                                            className="flex-1 sm:flex-none text-sm bg-white text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 font-bold transition disabled:opacity-50"
                                                        >
                                                            Decline
                                                        </button>
                                                        <button 
                                                            onClick={() => handleAcceptSession(session.id)} 
                                                            disabled={isSubmitting}
                                                            className="flex-1 sm:flex-none text-sm bg-primary text-white px-5 py-2 rounded-xl shadow-custom hover:bg-primary-hover font-bold transition disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                                                        >
                                                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1.5" /> Accept</>}
                                                        </button>
                                                    </div>
                                                )
                                            )}
                                            {session.status === 'completed' && (
                                                <button onClick={() => setRateSession(session)} className="flex-1 sm:flex-none text-sm bg-yellow-50 text-yellow-700 px-5 py-2 rounded-xl border border-yellow-200 hover:bg-yellow-100 font-bold transition">
                                                    Rate Peer
                                                </button>
                                            )}
                                            {session.status === 'rated' && (
                                                 <span className="flex items-center text-sm bg-gray-50 text-amber px-5 py-2 rounded-xl border border-gray-200 font-bold">
                                                     <Star className="w-4 h-4 mr-1 fill-amber text-amber" /> Rated
                                                 </span>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </li>
                        )})}
                    </ul>

                    {sessions.length === 0 && (
                        <div className="text-center py-20">
                            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-lg font-medium text-gray-900">No sessions yet</p>
                            <p className="text-sm text-gray-500 mt-1">Browse the Discovery Feed to send your first session request!</p>
                        </div>
                    )}
                </div>
            )}

            {showProfileId && (
                <UserProfileModal userId={showProfileId} onClose={() => setShowProfileId(null)} />
            )}

            {activeChatSession && (
                <ChatModal 
                    session={activeChatSession} 
                    currentUser={currentUser} 
                    onClose={() => setActiveChatSession(null)} 
                    onSessionUpdate={handleSessionUpdate}
                />
            )}

            {/* Retract Confirmation Modal */}
            {retractSession && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Retract Request</h3>
                            <button onClick={() => setRetractSession(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-gray-600 mb-6">Are you sure you want to retract your request for <strong>{retractSession.skill}</strong> with <strong>{retractSession.peerName}</strong>?</p>
                        
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800 font-medium leading-snug">
                                Cancelling appointments will not be tolerated and frequent cancellations may result in an account ban.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setRetractSession(null)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition">
                                Cancel
                            </button>
                            <button onClick={handleConfirmRetract} disabled={isSubmitting} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-60 flex justify-center items-center">
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Retract'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rate Peer Modal */}
            {rateSession && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Rate Peer</h3>
                            <button onClick={() => setRateSession(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">How was your {rateSession.skill} session with {rateSession.peerName}?</p>

                        <div className="flex justify-center gap-2 mb-6">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} onClick={() => setRating(star)} className="focus:outline-none transition group">
                                    <Star className={`w-8 h-8 ${rating >= star ? 'fill-amber text-amber' : 'text-gray-300 group-hover:text-amber/50'}`} />
                                </button>
                            ))}
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Feedback (Optional)</label>
                            <textarea
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
                                placeholder="Leave your customised feedback..."
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setRateSession(null)} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition">
                                Cancel
                            </button>
                            <button onClick={handleConfirmRate} disabled={isSubmitting} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold hover:bg-primary-hover transition disabled:opacity-60 flex justify-center items-center">
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MySessions;

