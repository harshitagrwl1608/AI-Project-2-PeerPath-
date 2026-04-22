import React, { useState } from 'react';
import { Star, MessageCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { createSession } from '../services/sessionService';
import UserProfileModal from './UserProfileModal';

const SkillCard = ({ user }) => {
    const { showToast } = useToast();
    const { currentUser, userProfile } = useAuth();
    const [requesting, setRequesting] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    const handleRequestSession = async () => {
        if (requesting) return;
        setRequesting(true);

        const userId = user.email || user.id || user.firebaseUid; // Handle all ID formats
        const sessionData = {
            peerName: user.name || 'Student',
            targetUserEmail: userId, 
            receiverId: userId, // Keep for legacy compat if needed
            requesterName: userProfile?.name || currentUser?.displayName || 'Student',
            skill: user.skillsTeach?.length ? user.skillsTeach[0] : 'General',
            type: 'Learning',
            date: 'TBD',
            time: 'TBD',
        };

        try {
            await createSession(sessionData, currentUser?.email || null);
            showToast(`Session request sent to ${sessionData.peerName}! Check My Sessions.`, 'success');
        } catch (err) {
            showToast('Failed to send request. Please try again.', 'error');
        } finally {
            setRequesting(false);
        }
    };

    return (
        <>
            <div className="bg-white rounded-[16px] shadow-custom p-5 hover:shadow-lg transition duration-200 group flex flex-col h-full border-l-[3px] border-l-primary">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setShowProfile(true)}
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-pink-100 text-pink-700 hover:ring-2 hover:ring-primary hover:ring-offset-2 transition"
                        >
                            {(user.name || 'S').charAt(0)}
                        </button>
                        <div>
                            <button onClick={() => setShowProfile(true)} className="font-bold text-lg text-gray-900 hover:text-primary transition text-left">
                                {user.name || 'Anonymous User'}
                            </button>
                            <p className="text-sm text-gray-500">{(user.college || 'N/A')} &bull; {(user.year || 'N/A')} Year</p>
                        </div>
                    </div>
                    <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-md text-amber text-xs font-bold shrink-0 shadow-sm border border-yellow-100">
                        <Star className="w-3 h-3 mr-1 fill-amber text-amber" />
                        {user.rating ? Number(user.rating).toFixed(1) : 'New'}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 flex-grow">
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-2">Can Teach</p>
                        <div className="flex flex-wrap gap-1.5 flex-grow">
                            {user.skillsTeach?.length > 0 ? user.skillsTeach.map(skill => (
                                <span key={skill} className="bg-tag-bg text-primary text-xs px-3 py-1 rounded-full font-medium">
                                    {skill}
                                </span>
                            )) : <span className="text-xs text-gray-400 italic">None</span>}
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-2">Wants to Learn</p>
                        <div className="flex flex-wrap gap-1.5">
                            {user.skillsLearn?.length > 0 ? user.skillsLearn.map(skill => (
                                <span key={skill} className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs px-2.5 py-1 rounded-md font-medium">
                                    {skill}
                                </span>
                            )) : <span className="text-xs text-gray-400 italic">None</span>}
                        </div>
                    </div>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <button
                        onClick={handleRequestSession}
                        disabled={requesting}
                        className="text-sm font-semibold text-primary hover:text-primary-hover flex items-center transition bg-tag-bg hover:bg-tag-bg/80 px-4 py-2 rounded-[12px] disabled:opacity-60"
                    >
                        {requesting ? (
                            <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Sending...</>
                        ) : (
                            <>Request Session <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition" /></>
                        )}
                    </button>
                    <button onClick={() => setShowProfile(true)} className="text-gray-400 hover:text-primary transition p-2 bg-gray-50 rounded-full hover:bg-tag-bg">
                        <MessageCircle className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {showProfile && (
                <UserProfileModal defaultUserObj={user} onClose={() => setShowProfile(false)} />
            )}
        </>
    );
};

export default SkillCard;
