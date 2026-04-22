import React, { useEffect, useState } from 'react';
import { X, Star, Calendar, Mail, BookOpen, User, MapPin } from 'lucide-react';
import { getUserProfile } from '../services/userService';

const UserProfileModal = ({ userId, defaultUserObj, onClose }) => {
    const [user, setUser] = useState(defaultUserObj || null);
    const [loading, setLoading] = useState(!defaultUserObj);

    useEffect(() => {
        // If we only have an ID but no full object, fetch from DB
        if (!defaultUserObj && userId) {
            const fetchProfile = async () => {
                setLoading(true);
                const profileData = await getUserProfile(userId);
                setUser(profileData);
                setLoading(false);
            };
            fetchProfile();
        }
    }, [userId, defaultUserObj]);

    if (!userId && !defaultUserObj) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/50 flex flex-col items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[24px] shrink-0 w-full max-w-md shadow-2xl overflow-hidden relative">
                
                {/* Header background pattern */}
                <div className="h-32 bg-primary/10 relative">
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 bg-white/50 backdrop-blur rounded-full p-2 hover:bg-white transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="p-10 flex flex-col items-center justify-center">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 font-medium">Loading profile...</p>
                    </div>
                ) : !user ? (
                    <div className="p-10 text-center">
                        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900">Profile Not Found</h3>
                        <p className="text-gray-500 mt-2">This user profile might have been removed.</p>
                    </div>
                ) : (
                    <div className="px-6 pb-8 pt-0 relative">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-100 to-indigo-100 border-4 border-white shadow-md mx-auto -mt-12 flex items-center justify-center mb-4 relative z-10">
                            <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-indigo-600">
                                {user.name?.charAt(0) || '?'}
                            </span>
                        </div>

                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{user.name}</h2>
                            <p className="text-gray-500 font-medium mt-1 flex items-center justify-center gap-1.5">
                                <MapPin className="w-4 h-4" /> {user.college} &bull; {user.year} Year
                            </p>
                            {user.branch && <p className="text-gray-400 text-sm mt-0.5">{user.branch}</p>}
                        </div>

                        {/* Stats Row */}
                        <div className="flex justify-center gap-6 py-4 border-y border-gray-100 mb-6 bg-gray-50/50 rounded-xl">
                            <div className="text-center px-4">
                                <div className="flex items-center justify-center gap-1 text-gray-900 font-bold mb-1">
                                    <Star className="w-4 h-4 text-amber fill-amber" /> 
                                    {user.rating ? Number(user.rating).toFixed(1) : 'New'}
                                </div>
                                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Rating</span>
                            </div>
                            <div className="w-px h-10 bg-gray-200"></div>
                            <div className="text-center px-4">
                                <div className="flex items-center justify-center gap-1 text-gray-900 font-bold mb-1">
                                    <BookOpen className="w-4 h-4 text-primary" /> 
                                    {user.totalSessions || 0}
                                </div>
                                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Lectures</span>
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <p className="text-xs uppercase font-bold tracking-wider text-gray-400 mb-2">Can Teach</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {user.skillsTeach?.length > 0 ? (
                                        user.skillsTeach.map(s => (
                                            <span key={s} className="px-2.5 py-1 rounded-md text-xs font-semibold bg-tag-bg text-primary">{s}</span>
                                        ))
                                    ) : <span className="text-gray-400 text-sm italic">None listed</span>}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs uppercase font-bold tracking-wider text-gray-400 mb-2">Wants to Learn</p>
                                <div className="flex flex-wrap gap-1.5">
                                     {user.skillsLearn?.length > 0 ? (
                                        user.skillsLearn.map(s => (
                                            <span key={s} className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700">{s}</span>
                                        ))
                                    ) : <span className="text-gray-400 text-sm italic">None listed</span>}
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="space-y-3 bg-white border border-gray-100 rounded-xl p-4">
                            {user.showEmail && user.email && (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                                        <Mail className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="break-all">
                                        <p className="text-xs text-gray-500 font-medium mb-0.5">Contact Email</p>
                                        <a href={`mailto:${user.email}`} className="text-primary hover:underline font-medium">{user.email}</a>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                                    <Calendar className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium mb-0.5">Joined PeerPath</p>
                                    <p className="text-gray-900 font-medium">
                                        {user.createdAt 
                                            ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) 
                                            : 'Early Member'}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfileModal;
