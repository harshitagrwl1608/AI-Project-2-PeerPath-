import React, { useState, useEffect } from 'react';
import SkillCard from '../components/SkillCard';
import { Search, Filter, Loader2 } from 'lucide-react';
import { getAllUsers } from '../services/userService';
import { useAuth } from '../context/AuthContext';

const DiscoveryFeed = () => {
    const { currentUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            const data = await getAllUsers();
            setUsers(data || []);
            setLoading(false);
        };
        fetchUsers();
    }, []);

    const filteredUsers = (users || []).filter(u => {
        // Safety: ensure u is valid
        if (!u) return false;

        // Don't show current user in feed (check both id and email)
        if (currentUser && (u.id === currentUser.email || u.email === currentUser.email)) return false;
        
        const searchLower = searchTerm.toLowerCase();
        
        // Defensive checks for arrays and optional chaining
        const matchesSkill = (u.skillsTeach?.some(s => s?.toLowerCase().includes(searchLower))) ||
                             (u.skillsLearn?.some(s => s?.toLowerCase().includes(searchLower)));
        
        const matchesName = u.name?.toLowerCase().includes(searchLower);

        return matchesSkill || matchesName;
    });

    return (
        <div className="pb-12">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-5">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Discovery Feed</h1>
                    <p className="text-gray-500 mt-1">Find peers to exchange skills with across campuses.</p>
                </div>

                <div className="flex space-x-3 w-full md:w-auto">
                    <div className="relative flex-grow md:flex-grow-0">
                        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            id="discovery-search"
                            type="text"
                            placeholder="Search skills or names..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent w-full md:w-72 shadow-sm transition"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium shadow-sm transition">
                        <Filter className="w-4 h-4 mr-2" /> Filter
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="ml-3 text-gray-500 font-medium">Loading peers...</span>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredUsers.map(user => (
                            <SkillCard key={user.email || user.id || user.firebaseUid} user={user} />
                        ))}
                    </div>

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 border-dashed">
                            <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-lg font-medium text-gray-900">No peers found</p>
                            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search terms.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default DiscoveryFeed;
